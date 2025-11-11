// Backgammon Learning API - Complete Educational System
const { createClient } = require('@supabase/supabase-js')
const { BackgammonCoach, BACKGAMMON_RULES, LEARNING_MODULES, TUTORIAL_SCENARIOS } = require('../src/backgammon-coach')

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const coach = new BackgammonCoach()

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  // Authentication check
  if (!event.headers.authorization?.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Authentication required' })
    }
  }

  try {
    const path = event.path.replace('/.netlify/functions/learn/', '')
    const method = event.httpMethod
    const body = event.body ? JSON.parse(event.body) : {}

    // Route handling
    switch (`${method} ${path}`) {
      case 'GET rules':
        return await getRules(event)
      case 'GET rules/basic':
      case 'GET rules/movement':
      case 'GET rules/hitting':
      case 'GET rules/bearing_off':
        const ruleKey = path.split('/').pop()
        return await getSpecificRule(event, ruleKey)
      case 'GET curriculum':
        return await getCurriculum(event)
      case 'GET tutorials':
        return await getTutorials(event)
      case 'GET tutorials/0':
      case 'GET tutorials/1':
        const tutorialIndex = parseInt(path.split('/').pop())
        return await getTutorialScenario(event, tutorialIndex)
      case 'POST validate-move':
        return await validateMoveWithFeedback(event, body)
      case 'GET progress':
        return await getLearningProgress(event)
      case 'POST complete-lesson':
        return await completeLesson(event, body)
      case 'GET achievements':
        return await getAchievements(event)
      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Learning endpoint not found' })
        }
    }

  } catch (error) {
    console.error('Learning API error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Learning system error',
        message: error.message
      })
    }
  }
}

// Get all available rules
async function getRules(event) {
  const rules = Object.keys(BACKGAMMON_RULES).map(key => ({
    id: key,
    title: BACKGAMMON_RULES[key].title,
    difficulty: BACKGAMMON_RULES[key].difficulty,
    estimatedTime: BACKGAMMON_RULES[key].estimatedTime
  }))

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      data: {
        rules,
        totalRules: rules.length,
        message: "Welcome to Backgammon Learning! Start with the 'basic' rules."
      }
    })
  }
}

// Get specific rule explanation
async function getSpecificRule(event, ruleKey) {
  const rule = coach.getRuleExplanation(ruleKey)

  // Track that user viewed this rule
  const token = event.headers.authorization.substring(7)
  try {
    const { data: { user } } = await supabase.auth.getUser(token)
    if (user) {
      await supabase
        .from('user_learning_progress')
        .upsert({
          user_id: user.id,
          rule_key: ruleKey,
          viewed_at: new Date(),
          completed: false
        })
    }
  } catch (error) {
    console.warn('Could not track rule view:', error.message)
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      data: {
        rule,
        nextRule: getNextRule(ruleKey),
        progress: `You've learned about ${ruleKey} rules!`
      }
    })
  }
}

// Get learning curriculum
async function getCurriculum(event) {
  const curriculum = coach.getLearningCurriculum()

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      data: {
        curriculum,
        message: "Complete these modules to become a backgammon expert!",
        totalEstimatedTime: curriculum.estimatedTotalTime + " minutes"
      }
    })
  }
}

// Get available tutorials
async function getTutorials(event) {
  const tutorials = TUTORIAL_SCENARIOS.map((scenario, index) => ({
    id: index,
    title: scenario.title,
    description: scenario.description,
    difficulty: "beginner",
    estimatedTime: "3 minutes"
  }))

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      data: {
        tutorials,
        message: "Interactive tutorials to practice what you've learned!"
      }
    })
  }
}

// Get specific tutorial scenario
async function getTutorialScenario(event, index) {
  const scenario = coach.getTutorialScenario(index)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      data: {
        scenario,
        message: `Tutorial: ${scenario.title} - ${scenario.objective}`
      }
    })
  }
}

// Validate move with educational feedback
async function validateMoveWithFeedback(event, body) {
  const { board, move, player, dice } = body

  if (!board || !move || !player || !dice) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Missing required fields: board, move, player, dice'
      })
    }
  }

  const result = coach.validateMoveWithFeedback(board, move, player, dice)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      data: {
        validation: result,
        learningTip: result.legal ?
          "Great job! Keep practicing to improve your skills." :
          "Don't worry about mistakes - they're how you learn!"
      }
    })
  }
}

// Get user's learning progress
async function getLearningProgress(event) {
  try {
    const token = event.headers.authorization.substring(7)
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'User not authenticated' })
      }
    }

    // Get learning progress from database
    const { data: progress } = await supabase
      .from('user_learning_progress')
      .select('*')
      .eq('user_id', user.id)

    // Get game statistics
    const { data: games } = await supabase
      .from('games')
      .select('winner')
      .or(`white_player_id.eq.${user.id},black_player_id.eq.${user.id}`)

    const gamesPlayed = games?.length || 0
    const wins = games?.filter(game =>
      (game.white_player_id === user.id && game.winner === 'white') ||
      (game.black_player_id === user.id && game.winner === 'black')
    ).length || 0

    const winRate = gamesPlayed > 0 ? wins / gamesPlayed : 0
    const completedLessons = progress?.map(p => p.rule_key) || []

    const progressReport = coach.generateProgressReport(
      user.id,
      completedLessons,
      gamesPlayed,
      winRate
    )

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: {
          progress: progressReport,
          message: `You've completed ${completedLessons.length} lessons and played ${gamesPlayed} games!`
        }
      })
    }
  } catch (error) {
    console.error('Progress retrieval error:', error)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Could not retrieve learning progress' })
    }
  }
}

// Mark lesson as completed
async function completeLesson(event, body) {
  const { lessonKey } = body

  if (!lessonKey) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'lessonKey is required' })
    }
  }

  try {
    const token = event.headers.authorization.substring(7)
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'User not authenticated' })
      }
    }

    // Mark lesson as completed
    await supabase
      .from('user_learning_progress')
      .upsert({
        user_id: user.id,
        rule_key: lessonKey,
        completed_at: new Date(),
        completed: true
      })

    const nextLesson = coach.getNextRecommendedLesson([lessonKey])

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: {
          completedLesson: lessonKey,
          nextLesson: nextLesson,
          message: `Congratulations! You've completed the ${lessonKey} lesson.`,
          achievement: getLessonAchievement(lessonKey)
        }
      })
    }
  } catch (error) {
    console.error('Lesson completion error:', error)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Could not complete lesson' })
    }
  }
}

// Get user's achievements
async function getAchievements(event) {
  try {
    const token = event.headers.authorization.substring(7)
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'User not authenticated' })
        }
    }

    // Get achievements from database
    const { data: achievements } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id)

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: {
          achievements: achievements || [],
          message: `You've earned ${achievements?.length || 0} achievements!`
        }
      })
    }
  } catch (error) {
    console.error('Achievements retrieval error:', error)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Could not retrieve achievements' })
    }
  }
}

// Helper functions
function getNextRule(currentRule) {
  const ruleOrder = ['basic', 'movement', 'hitting', 'bearing_off']
  const currentIndex = ruleOrder.indexOf(currentRule)

  if (currentIndex === -1 || currentIndex === ruleOrder.length - 1) {
    return null
  }

  return ruleOrder[currentIndex + 1]
}

function getLessonAchievement(lessonKey) {
  const achievements = {
    basic: '🎯 First Steps',
    movement: '🚀 Moving Master',
    hitting: '💥 Hitting Hero',
    bearing_off: '🏠 Bearing Off Boss'
  }

  return achievements[lessonKey] || '📚 Knowledge Seeker'
}
