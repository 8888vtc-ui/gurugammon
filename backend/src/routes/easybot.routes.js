/**
 * EASY BOT API ROUTES
 * Beginner-friendly backgammon AI
 */

const express = require('express');
const { EasyBotService } = require('../services/easybot.service.js');

const router = express.Router();
const easyBot = new EasyBotService();

/**
 * POST /api/easybot/move
 * Get EasyBot move for current position
 */
router.post('/move', async (req, res) => {
  try {
    const { 
      position_id, 
      dice, 
      player_color = 'white',
      game_id = null
    } = req.body;

    if (!position_id || !dice) {
      return res.status(400).json({
        success: false,
        error: 'position_id and dice are required',
        easyBot: {
          message: 'I need the position and dice to help you!',
          emoji: '🤔'
        }
      });
    }

    // Validate dice
    if (!Array.isArray(dice) || dice.length !== 2 && dice.length !== 4) {
      return res.status(400).json({
        success: false,
        error: 'dice must be array of 2 (normal) or 4 (doubles) values',
        easyBot: {
          message: 'Let me check those dice for you!',
          emoji: '🎲'
        }
      });
    }

    // Generate EasyBot move
    const moveResult = await easyBot.generateMove(position_id, dice, player_color);

    res.json({
      success: true,
      move: moveResult,
      easyBot: {
        encouraging_message: easyBot.getEncouragingMessage(),
        emoji: '😊',
        difficulty: 'EASY',
        teaching_moment: moveResult.educational_comment
      },
      metadata: {
        bot_name: easyBot.name,
        bot_version: easyBot.version,
        elo_rating: easyBot.eloRating,
        thinking_time: moveResult.thinking_time,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      easyBot: {
        message: 'Oops! Let me try again. Learning is all about practice!',
        emoji: '🤖💪'
      }
    });
  }
});

/**
 * POST /api/easybot/cube-decision
 * Get EasyBot cube decision
 */
router.post('/cube-decision', async (req, res) => {
  try {
    const { 
      position_id, 
      cube_value = 1, 
      player_on_roll = 'white',
      is_opponent_double = false
    } = req.body;

    if (!position_id) {
      return res.status(400).json({
        success: false,
        error: 'position_id is required',
        easyBot: {
          message: 'I need to see the position to decide about the cube!',
          emoji: '🎯'
        }
      });
    }

    let cubeDecision;
    
    if (is_opponent_double) {
      // Opponent doubled - decide to take or drop
      cubeDecision = easyBot.makeTakeDropDecision(position_id, cube_value);
    } else {
      // Our turn - decide to double or not
      cubeDecision = easyBot.makeCubeDecision(position_id, cube_value, player_on_roll);
    }

    res.json({
      success: true,
      cube_decision: cubeDecision,
      easyBot: {
        explanation: cubeDecision.comment,
        emoji: '🎲',
        learning_tip: 'Cube decisions are tricky! When in doubt, play it safe!'
      },
      metadata: {
        position_id: position_id,
        cube_value: cube_value,
        player_on_roll: player_on_roll,
        decision_confidence: cubeDecision.confidence
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      easyBot: {
        message: 'Cube decisions can be complex. Let me think about it!',
        emoji: '🤔🎲'
      }
    });
  }
});

/**
 * POST /api/easybot/game
 * Create new game vs EasyBot
 */
router.post('/game', async (req, res) => {
  try {
    const { 
      player_name = 'Player',
      player_color = 'white',
      match_length = 1,
      difficulty = 'EASY'
    } = req.body;

    const game = {
      game_id: `easybot_${Date.now()}`,
      created_at: new Date().toISOString(),
      
      players: {
        human: {
          name: player_name,
          color: player_color,
          type: 'human'
        },
        easybot: {
          name: easyBot.name,
          color: player_color === 'white' ? 'black' : 'white',
          type: 'ai',
          difficulty: difficulty,
          elo_rating: easyBot.eloRating
        }
      },
      
      game_settings: {
        match_length: match_length,
        cube_limit: match_length * 2 - 1,
        crawford_rule: match_length > 1,
        teaching_mode: true
      },
      
      initial_position: {
        position_id: '4HPwATDgc/ABMA',
        board: generateInitialBoard()
      },
      
      status: 'waiting_for_first_roll'
    };

    res.json({
      success: true,
      game: game,
      easyBot: {
        greeting: easyBot.getGreeting(),
        emoji: '👋',
        message: "Let's have a fun game! I'll help you learn along the way.",
        tips: [
          "Don't worry about making mistakes - that's how we learn!",
          "I'll explain my moves to help you understand the strategy.",
          "Feel free to ask me questions about any position!"
        ]
      },
      metadata: {
        bot_info: easyBot.getStatistics(),
        game_ready: true
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      easyBot: {
        message: 'Let me set up our game. One moment please!',
        emoji: '🎮⚙️'
      }
    });
  }
});

/**
 * POST /api/easybot/teaching
 * Get teaching explanation for position
 */
router.post('/teaching', async (req, res) => {
  try {
    const { 
      position_id, 
      dice = null,
      topic = 'general',
      player_level = 'beginner'
    } = req.body;

    if (!position_id) {
      return res.status(400).json({
        success: false,
        error: 'position_id is required',
        easyBot: {
          message: 'Show me the position and I\'ll teach you something cool!',
          emoji: '📚'
        }
      });
    }

    const teachingContent = generateTeachingContent(position_id, dice, topic, player_level);

    res.json({
      success: true,
      teaching: teachingContent,
      easyBot: {
        encouragement: easyBot.getEncouragingMessage(),
        emoji: '👨‍🏫',
        follow_up: "Would you like to see examples or try some practice positions?"
      },
      metadata: {
        topic: topic,
        player_level: player_level,
        teaching_style: 'simple_encouraging'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      easyBot: {
        message: 'Teaching is my favorite! Let me prepare a great lesson for you.',
        emoji: '📚✨'
      }
    });
  }
});

/**
 * GET /api/easybot/status
 * Get EasyBot status and information
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    easyBot: {
      ...easyBot.getStatistics(),
      status: 'online_ready',
      current_mood: 'friendly_encouraging',
      ready_to_play: true,
      
      features: {
        beginner_friendly: true,
        teaching_mode: true,
        encouraging_feedback: true,
        simple_explanations: true,
        safe_play_style: true,
        quick_decisions: true
      },
      
      personality_traits: {
        patience: 'very_high',
        encouragement: 'constant',
        forgiveness: 'high',
        teaching_aptitude: 'excellent'
      }
    },
    message: 'EasyBot is ready to play and teach!',
    emoji: '🤖😊🎲'
  });
});

/**
 * POST /api/easybot/chat
 * Chat with EasyBot
 */
router.post('/chat', async (req, res) => {
  try {
    const { 
      message,
      context = null,
      player_level = 'beginner'
    } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'message is required',
        easyBot: {
          message: 'I\'m here to help! What would you like to know?',
          emoji: '💬'
        }
      });
    }

    // Generate EasyBot response
    const response = await generateEasyBotResponse(message, context, player_level);

    res.json({
      success: true,
      response: response,
      easyBot: {
        follow_up_question: 'Is there anything else you\'d like to learn about?',
        emoji: '💡😊',
        helpful_rating: response.confidence
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      easyBot: {
        message: 'I love chatting! Let me think of the best way to help you.',
        emoji: '🤔💬'
      }
    });
  }
});

/**
 * POST /api/easybot/practice
 * Get practice positions
 */
router.post('/practice', async (req, res) => {
  try {
    const { 
      skill_level = 'beginner',
      focus_area = 'general',
      number_of_positions = 3
    } = req.body;

    const practicePositions = generatePracticePositions(skill_level, focus_area, number_of_positions);

    res.json({
      success: true,
      practice: practicePositions,
      easyBot: {
        encouragement: "Practice makes perfect! Let's work on these positions together.",
        emoji: '🎯📚',
        tip: "Take your time and think about each move. I'll help you understand the best choices!"
      },
      metadata: {
        skill_level: skill_level,
        focus_area: focus_area,
        positions_count: practicePositions.positions.length
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      easyBot: {
        message: 'Let me find some perfect practice positions for you!',
        emoji: '🎯⚙️'
      }
    });
  }
});

// Helper functions
function generateInitialBoard() {
  return {
    white_points: [0, 0, 0, 0, 0, 5, 0, 3, 0, 0, 0, 0, 5, 0, 0, 0, 0, 3, 0, 5, 0, 0, 0, 0],
    black_points: [0, 0, 0, 0, 0, 5, 0, 3, 0, 0, 0, 0, 5, 0, 0, 0, 0, 3, 0, 5, 0, 0, 0, 0],
    white_bar: 0,
    black_bar: 0,
    white_home: 0,
    black_home: 0,
    cube_value: 1,
    player_on_roll: 'white'
  };
}

function generateTeachingContent(positionId, dice, topic, playerLevel) {
  const content = {
    position_id: positionId,
    topic: topic,
    level: playerLevel,
    
    explanation: getSimpleExplanation(topic, playerLevel),
    key_concepts: getKeyConcepts(topic, playerLevel),
    common_mistakes: getCommonMistakes(topic, playerLevel),
    practice_tips: getPracticeTips(topic, playerLevel),
    
    examples: dice ? [{
      dice: dice,
      best_move: '13/9 6/5',
      reasoning: 'Making a safe point is usually the best strategy',
      alternatives: ['13/8 24/23', '8/5 6/5']
    }] : []
  };
  
  return content;
}

function getSimpleExplanation(topic, level) {
  const explanations = {
    opening: "In the opening, focus on making safe points and building your inner board. Safety first!",
    safety: "Always try to avoid leaving blots (single checkers) where they can be hit.",
    racing: "When there's no more contact, race your checkers home as quickly as possible.",
    cube: "The doubling cube is tricky! When in doubt, play it safe and don't double.",
    general: "Backgammon is about balancing safety, offense, and planning ahead!"
  };
  
  return explanations[topic] || explanations.general;
}

function getKeyConcepts(topic, level) {
  const concepts = {
    opening: ['Making points', 'Building primes', 'Splitting runners'],
    safety: ['Avoiding blots', 'Making safe moves', 'Protecting checkers'],
    racing: ['Pip count', 'Bearing off efficiently', 'No contact positions'],
    cube: ['When to double', 'When to take', 'When to drop'],
    general: ['Basic strategy', 'Probability thinking', 'Planning ahead']
  };
  
  return concepts[topic] || concepts.general;
}

function getCommonMistakes(topic, level) {
  const mistakes = {
    opening: ['Leaving too many blots', 'Not making points', 'Aggressive splits'],
    safety: ['Leaving checkers vulnerable', 'Unsafe hitting', 'Poor timing'],
    racing: ['Inefficient bearing off', 'Wasting pips', 'Poor race calculation'],
    cube: ['Doubling too early', 'Taking bad cubes', 'Dropping good cubes'],
    general: ['Playing too fast', 'Not thinking ahead', 'Ignoring safety']
  };
  
  return mistakes[topic] || mistakes.general;
}

function getPracticeTips(topic, level) {
  const tips = {
    opening: 'Practice the basic opening moves until they become automatic.',
    safety: 'Always ask: "Can this checker be hit?" before moving.',
    racing: 'Count your pips regularly to know who\'s ahead in the race.',
    cube: 'Only double when you\'re clearly winning. Be conservative!',
    general: 'Take your time, think about each move, and learn from mistakes!'
  };
  
  return tips[topic] || tips.general;
}

async function generateEasyBotResponse(message, context, level) {
  const lowerMessage = message.toLowerCase();
  
  // Simple keyword-based responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return {
      text: easyBot.getGreeting(),
      confidence: 0.9,
      suggestions: ['Ask me about opening moves', 'Learn about safety', 'Practice together']
    };
  }
  
  if (lowerMessage.includes('opening')) {
    return {
      text: "Great question! In the opening, focus on making safe points like 8/5 6/5 with 3-1. Safety first builds strong foundations!",
      confidence: 0.85,
      suggestions: ['Show me specific openings', 'Practice opening moves', 'Learn opening theory']
    };
  }
  
  if (lowerMessage.includes('safe') || lowerMessage.includes('blot')) {
    return {
      text: "Safety is super important! Try to avoid leaving single checkers (blots) where they can be hit. Making points keeps your checkers safe!",
      confidence: 0.8,
      suggestions: ['Learn safety principles', 'Practice safe moves', 'See safety examples']
    };
  }
  
  if (lowerMessage.includes('cube') || lowerMessage.includes('double')) {
    return {
      text: "Cube decisions can be tricky! My advice: be conservative. Only double when you\'re clearly winning, and take if you have 25%+ chance to win.",
      confidence: 0.75,
      suggestions: ['Learn cube basics', 'Practice cube decisions', 'Study cube strategy']
    };
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('learn')) {
    return {
      text: "I'd love to help you learn! We can practice positions, discuss strategy, or play a game together. What interests you most?",
      confidence: 0.9,
      suggestions: ['Practice positions', 'Play a learning game', 'Discuss strategy']
    };
  }
  
  // Default friendly response
  return {
    text: "That's a great question! Backgammon has so many interesting aspects. Would you like to learn about openings, safety, racing, or the cube?",
    confidence: 0.7,
    suggestions: ['Learn openings', 'Study safety', 'Practice racing', 'Understand the cube']
  };
}

function generatePracticePositions(skillLevel, focusArea, count) {
  const positions = [];
  
  for (let i = 0; i < count; i++) {
    positions.push({
      position_id: `practice_${i + 1}`,
      position_name: `Practice Position ${i + 1}`,
      difficulty: skillLevel,
      focus_area: focusArea,
      description: `Practice your ${focusArea} skills with this position`,
      dice: [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1],
      best_move: '13/9 6/5',
      reasoning: 'Safe point building is the best approach here',
      learning_goal: 'Focus on making safe points and avoiding blots'
    });
  }
  
  return {
    positions: positions,
    instructions: "Take your time with each position. Think about safety and basic strategy!",
    difficulty: skillLevel,
    estimated_time: '5-10 minutes'
  };
}

module.exports = router;
