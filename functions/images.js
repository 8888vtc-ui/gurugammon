// Image Generation Service - Netlify Function
const { createClient } = require('@supabase/supabase-js')
const { createCanvas, loadImage, registerFont } = require('canvas')

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'image/png',
    'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const path = event.path.replace('/.netlify/functions/images/', '')
    const queryParams = event.queryStringParameters || {}

    // Route to different image generators
    switch (path) {
      case 'board':
        return await generateBoardImage(queryParams)
      case 'mistake':
        return await generateMistakeImage(queryParams)
      case 'achievement':
        return await generateAchievementImage(queryParams)
      case 'tournament':
        return await generateTournamentImage(queryParams)
      case 'share':
        return await generateShareImage(queryParams)
      default:
        return {
          statusCode: 404,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Image type not found' })
        }
    }

  } catch (error) {
    console.error('Image generation error:', error)
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Image generation failed' })
    }
  }
}

// Generate backgammon board visualization
async function generateBoardImage(params) {
  const { gameId, moveNumber, showArrows } = params

  // Create canvas (800x600 for board)
  const canvas = createCanvas(800, 600)
  const ctx = canvas.getContext('2d')

  // Draw backgammon board background
  ctx.fillStyle = '#D2691E' // Saddle brown
  ctx.fillRect(0, 0, 800, 600)

  // Draw board points (simplified representation)
  drawBoardPoints(ctx)

  // Draw checkers (simplified)
  drawCheckers(ctx)

  // Add move annotations if requested
  if (showArrows === 'true') {
    drawMoveArrows(ctx, params)
  }

  // Add game info
  addGameInfo(ctx, params)

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600'
    },
    body: canvas.toBuffer('image/png').toString('base64'),
    isBase64Encoded: true
  }
}

// Generate mistake illustration
async function generateMistakeImage(params) {
  const { mistakeType, playedMove, bestMove, equityLoss } = params

  const canvas = createCanvas(1000, 600)
  const ctx = canvas.getContext('2d')

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 1000, 600)
  gradient.addColorStop(0, '#1a1a2e')
  gradient.addColorStop(1, '#16213e')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1000, 600)

  // Title
  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 32px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('BACKGAMMON MISTAKE ANALYSIS', 500, 50)

  // Mistake explanation
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '24px Arial'
  ctx.fillText(`Mistake Type: ${mistakeType}`, 500, 120)

  // Moves comparison
  ctx.fillStyle = '#FF6B6B'
  ctx.font = 'bold 28px Arial'
  ctx.fillText(`❌ Played: ${playedMove}`, 500, 200)

  ctx.fillStyle = '#4ECDC4'
  ctx.fillText(`✅ Best: ${bestMove}`, 500, 260)

  // Equity impact
  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 24px Arial'
  ctx.fillText(`Equity Cost: ${equityLoss || '0.00'} points`, 500, 340)

  // AI explanation
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '18px Arial'
  ctx.textAlign = 'left'
  const explanation = getMistakeExplanation(mistakeType, playedMove, bestMove)
  const words = explanation.split(' ')
  let line = ''
  let y = 400
  for (const word of words) {
    const testLine = line + word + ' '
    const metrics = ctx.measureText(testLine)
    if (metrics.width > 800 && line !== '') {
      ctx.fillText(line, 100, y)
      line = word + ' '
      y += 25
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, 100, y)

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600'
    },
    body: canvas.toBuffer('image/png').toString('base64'),
    isBase64Encoded: true
  }
}

// Generate achievement badge
async function generateAchievementImage(params) {
  const { achievement, username, level } = params

  const canvas = createCanvas(400, 400)
  const ctx = canvas.getContext('2d')

  // Circular badge background
  ctx.beginPath()
  ctx.arc(200, 200, 180, 0, 2 * Math.PI)
  ctx.fillStyle = '#FFD700'
  ctx.fill()

  // Inner circle
  ctx.beginPath()
  ctx.arc(200, 200, 160, 0, 2 * Math.PI)
  ctx.fillStyle = '#FFA500'
  ctx.fill()

  // Achievement icon (simplified)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 80px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('🏆', 200, 220)

  // Achievement text
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 24px Arial'
  ctx.fillText(achievement, 200, 280)

  // Username
  ctx.fillStyle = '#333333'
  ctx.font = '18px Arial'
  ctx.fillText(username, 200, 320)

  // Level
  ctx.fillStyle = '#666666'
  ctx.font = '16px Arial'
  ctx.fillText(`Level ${level}`, 200, 350)

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600'
    },
    body: canvas.toBuffer('image/png').toString('base64'),
    isBase64Encoded: true
  }
}

// Generate tournament bracket image
async function generateTournamentImage(params) {
  const { tournamentName, players, round } = params

  const canvas = createCanvas(1200, 800)
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, 1200, 800)

  // Tournament title
  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 36px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(tournamentName || 'GAMMON GURU TOURNAMENT', 600, 50)

  // Round indicator
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '24px Arial'
  ctx.fillText(`Round ${round || 1}`, 600, 100)

  // Draw simple bracket (simplified)
  drawTournamentBracket(ctx, players || ['Player 1', 'Player 2', 'Player 3', 'Player 4'])

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600'
    },
    body: canvas.toBuffer('image/png').toString('base64'),
    isBase64Encoded: true
  }
}

// Generate social sharing image
async function generateShareImage(params) {
  const { username, score, achievement, gameType } = params

  const canvas = createCanvas(1200, 630) // Facebook/LinkedIn optimal size
  const ctx = canvas.getContext('2d')

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630)
  gradient.addColorStop(0, '#667eea')
  gradient.addColorStop(1, '#764ba2')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1200, 630)

  // Game logo/branding
  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 48px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('🎲 GAMMON GURU', 600, 100)

  // Achievement or score
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 36px Arial'
  if (achievement) {
    ctx.fillText(`${username} unlocked: ${achievement}`, 600, 200)
  } else {
    ctx.fillText(`${username} scored: ${score} points`, 600, 200)
  }

  // Game type
  ctx.fillStyle = '#E0E0E0'
  ctx.font = '24px Arial'
  ctx.fillText(gameType || 'Backgammon Tournament', 600, 280)

  // Call to action
  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 28px Arial'
  ctx.fillText('Join the revolution at gammon-guru.com', 600, 400)

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600'
    },
    body: canvas.toBuffer('image/png').toString('base64'),
    isBase64Encoded: true
  }
}

// Helper functions
function drawBoardPoints(ctx) {
  // Simplified board drawing - would be more complex in reality
  ctx.fillStyle = '#8B4513'
  for (let i = 0; i < 24; i++) {
    const x = (i % 12) * 60 + 50
    const y = Math.floor(i / 12) * 500 + 50
    ctx.fillRect(x, y, 40, 200)
  }
}

function drawCheckers(ctx) {
  // Draw some sample checkers
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(100, 150, 15, 0, 2 * Math.PI)
  ctx.fill()

  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(700, 450, 15, 0, 2 * Math.PI)
  ctx.fill()
}

function drawMoveArrows(ctx, params) {
  // Draw arrows showing moves
  ctx.strokeStyle = '#FF0000'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(100, 150)
  ctx.lineTo(200, 150)
  ctx.stroke()

  // Arrow head
  ctx.beginPath()
  ctx.moveTo(200, 150)
  ctx.lineTo(190, 140)
  ctx.lineTo(190, 160)
  ctx.closePath()
  ctx.fill()
}

function addGameInfo(ctx, params) {
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '16px Arial'
  ctx.textAlign = 'left'
  ctx.fillText(`Game ID: ${params.gameId || 'Demo'}`, 50, 550)
  ctx.fillText(`Move: ${params.moveNumber || '1'}`, 50, 575)
}

function getMistakeExplanation(type, played, best) {
  const explanations = {
    'blunder': 'A serious mistake that costs significant equity. This move leaves you vulnerable.',
    'mistake': 'A noticeable error that reduces your winning chances.',
    'imprecision': 'Not the best move, but not a major mistake either.',
    'minor_error': 'A small inaccuracy that doesn\'t significantly hurt your position.'
  }
  return explanations[type] || 'This move could have been improved for better results.'
}

function drawTournamentBracket(ctx, players) {
  const startY = 150
  const spacing = 100

  ctx.fillStyle = '#FFFFFF'
  ctx.font = '18px Arial'
  ctx.textAlign = 'left'

  players.forEach((player, index) => {
    const y = startY + (index * spacing)
    ctx.fillText(player, 100, y)
  })

  // Draw bracket lines (simplified)
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(300, startY)
  ctx.lineTo(300, startY + (players.length - 1) * spacing)
  ctx.stroke()
}
