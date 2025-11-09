/**
 * EASY BOT - AI Backgammon Beginner Friendly
 * Perfect for learning and casual play
 * Simple, encouraging, and educational
 */

class EasyBotService {
  constructor() {
    this.name = 'EasyBot';
    this.version = '1.0.0';
    this.difficulty = 'EASY';
    this.eloRating = 1400;
    
    // EasyBot personality - friendly and encouraging
    this.personality = {
      tone: 'friendly_encouraging',
      play_style: 'safe_fundamental',
      response_time: 'fast',
      encouragement_level: 'high',
      teaching_mode: 'always_on'
    };
    
    // EasyBot skill characteristics
    this.skills = {
      opening_knowledge: 'basic_moves_only',
      tactical_depth: '1_ply_max',
      positional_understanding: 'fundamental',
      cube_handling: 'conservative',
      error_rate: 'beginner_level',
      mistake_frequency: 'occasional_simple_errors'
    };
    
    // EasyBot move preferences - safe and simple
    this.movePriorities = [
      'make_safe_points',
      'avoid_leaving_blots', 
      'basic_prime_building',
      'simple_race_strategy',
      'conservative_cube_decisions'
    ];
    
    // EasyBot opening repertoire - basic only
    this.openingRepertoire = {
      '3-1': { move: '8/5 6/5', reasoning: 'Make a safe point' },
      '4-2': { move: '8/4 6/2', reasoning: 'Build inner board' },
      '5-3': { move: '8/3 6/3', reasoning: 'Make key point' },
      '6-1': { move: '13/7 8/7', reasoning: 'Safe point building' },
      '6-2': { move: '24/18 13/11', reasoning: 'Simple split' },
      '6-3': { move: '24/18 13/10', reasoning: 'Basic escape' },
      '6-4': { move: '24/14', reasoning: 'Run to safety' },
      '6-5': { move: '24/13', reasoning: 'Major escape' },
      
      // Doubles - simple approach
      '1-1': { move: '8/7 8/7 6/5 6/5', reasoning: 'Make safe points' },
      '2-2': { move: '8/6 8/6 6/4 6/4', reasoning: 'Build inner board' },
      '3-3': { move: '8/5 8/5 6/3', reasoning: 'Make strong points' },
      '4-4': { move: '13/9 13/9 6/2', reasoning: 'Build prime' },
      '5-5': { move: '13/8 13/8 6/1 6/1', reasoning: 'Escape and build' },
      '6-6': { move: '24/18 24/18 13/7 13/7', reasoning: 'Major escape' }
    };
    
    // EasyBot strategic guidelines
    this.strategicGuidelines = {
      safety_first: 'Never leave blots when safe alternatives exist',
      simple_primes: 'Build 2-3 point primes maximum',
      basic_racing: 'Race only with clear advantage',
      conservative_cube: 'Double only with 70%+ win chance',
      educational_play: 'Make teaching moments visible'
    };
    
    // EasyBot messages - encouraging and simple
    this.messages = {
      greeting: [
        "Hi! I'm EasyBot. Let's have fun learning backgammon together!",
        "Hello! Ready to play? I'll help you learn the basics!",
        "Hi there! I'm EasyBot, perfect for learning backgammon!",
        "Welcome! Let's play and learn together!"
      ],
      encouragement: [
        "Great move! You're learning quickly!",
        "Nice thinking! That's a solid choice!",
        "Good job! Backgammon is all about practice!",
        "Well done! Every game teaches us something new!"
      ],
      simple_explanation: [
        "I'm making the safe move here - safety first!",
        "Let's build a point, that's always a good idea!",
        "I'll keep it simple and safe!",
        "Basic strategy is the best strategy when learning!"
      ],
      gentle_correction: [
        "Interesting choice! Have you considered this alternative?",
        "Good thinking! Here's another way to think about it...",
        "Nice try! Let me show you a simple approach...",
        "Good effort! The basic move would be..."
      ],
      game_end: [
        "Great game! You're improving every time!",
        "Thanks for playing! I learned a lot from you too!",
        "Excellent game! Practice makes perfect!",
        "Well played! Keep up the great work!"
      ]
    };
  }

  /**
   * EASY BOT MOVE GENERATION
   * Simple, safe, and educational moves
   */
  async generateMove(positionId, dice, playerColor = 'white') {
    const startTime = Date.now();
    
    // Generate all possible moves (simplified)
    const allMoves = this.generateBasicMoves(positionId, dice, playerColor);
    
    // Filter and rank moves by EasyBot priorities
    const rankedMoves = this.rankMovesByEasyBot(allMoves, positionId);
    
    // Select move with some beginner-level randomness
    const selectedMove = this.selectEasyBotMove(rankedMoves);
    
    // Calculate thinking time (short for EasyBot)
    const thinkingTime = 1000 + Math.random() * 1000; // 1-2 seconds
    
    // Ensure minimum thinking time for realism
    await new Promise(resolve => setTimeout(resolve, Math.max(0, thinkingTime - (Date.now() - startTime))));
    
    return {
      move: selectedMove.move,
      thinking_time: Date.now() - startTime,
      reasoning: selectedMove.reasoning,
      confidence: selectedMove.confidence,
      educational_comment: selectedMove.educational_comment,
      
      easyBot_info: {
        difficulty: this.difficulty,
        elo_rating: this.eloRating,
        strategy_used: selectedMove.strategy,
        safety_level: selectedMove.safety_level
      }
    };
  }

  /**
   * Generate basic legal moves only
   */
  generateBasicMoves(positionId, dice, playerColor) {
    const moves = [];
    
    // Simple move generation based on dice
    if (dice[0] === dice[1]) {
      // Doubles - simple approach
      moves.push(...this.generateDoubleMoves(positionId, dice[0], playerColor));
    } else {
      // Regular dice - basic combinations
      moves.push(...this.generateRegularMoves(positionId, dice, playerColor));
    }
    
    return moves;
  }

  /**
   * Generate double moves - simple and safe
   */
  generateDoubleMoves(positionId, die, playerColor) {
    const moves = [];
    
    // Use opening repertoire if applicable
    const diceKey = `${die}-${die}`;
    if (this.isOpeningPosition(positionId) && this.openingRepertoire[diceKey]) {
      const openingMove = this.openingRepertoire[diceKey];
      moves.push({
        move: openingMove.move,
        reasoning: openingMove.reasoning,
        strategy: 'opening_basic',
        safety_level: 'high'
      });
    }
    
    // Simple double moves
    if (die === 1) {
      moves.push({
        move: '8/7 8/7 6/5 6/5',
        reasoning: 'Make safe points with doubles',
        strategy: 'point_building',
        safety_level: 'high'
      });
    } else if (die === 2) {
      moves.push({
        move: '8/6 8/6 6/4 6/4',
        reasoning: 'Build inner board safely',
        strategy: 'inner_board',
        safety_level: 'high'
      });
    } else if (die === 3) {
      moves.push({
        move: '8/5 8/5 6/3',
        reasoning: 'Make strong points',
        strategy: 'prime_building',
        safety_level: 'medium'
      });
    }
    
    return moves;
  }

  /**
   * Generate regular moves - basic combinations
   */
  generateRegularMoves(positionId, dice, playerColor) {
    const moves = [];
    const [die1, die2] = dice;
    
    // Check opening repertoire
    const diceKey = `${Math.max(die1, die2)}-${Math.min(die1, die2)}`;
    if (this.isOpeningPosition(positionId) && this.openingRepertoire[diceKey]) {
      const openingMove = this.openingRepertoire[diceKey];
      moves.push({
        move: openingMove.move,
        reasoning: openingMove.reasoning,
        strategy: 'opening_basic',
        safety_level: 'high'
      });
    }
    
    // Basic safe moves
    moves.push({
      move: '13/9 6/5',
      reasoning: 'Safe point building',
      strategy: 'safe_positional',
      safety_level: 'high'
    });
    
    moves.push({
      move: '13/8 24/23',
      reasoning: 'Build and split safely',
      strategy: 'balanced',
      safety_level: 'medium'
    });
    
    // Simple race moves if applicable
    if (this.isRacePosition(positionId)) {
      moves.push({
        move: '13/7 8/6',
        reasoning: 'Race with safe checkers',
        strategy: 'race_basic',
        safety_level: 'medium'
      });
    }
    
    return moves;
  }

  /**
   * Rank moves by EasyBot priorities (safety first)
   */
  rankMovesByEasyBot(moves, positionId) {
    return moves.map(move => {
      let score = 0;
      
      // Safety is highest priority
      if (move.safety_level === 'high') score += 10;
      else if (move.safety_level === 'medium') score += 5;
      else score += 0;
      
      // Simplicity bonus
      if (move.strategy.includes('basic') || move.strategy.includes('safe')) {
        score += 5;
      }
      
      // Educational value
      if (move.strategy.includes('opening') || move.strategy.includes('point_building')) {
        score += 3;
      }
      
      // Add some randomness for beginner feel
      score += Math.random() * 3;
      
      return {
        ...move,
        easyBot_score: score,
        confidence: Math.min(0.8, 0.5 + score / 20),
        educational_comment: this.generateEducationalComment(move)
      };
    }).sort((a, b) => b.easyBot_score - a.easyBot_score);
  }

  /**
   * Select move with beginner-level decision making
   */
  selectEasyBotMove(rankedMoves) {
    if (rankedMoves.length === 0) {
      return {
        move: 'No legal moves',
        reasoning: 'No moves available',
        strategy: 'forced_pass',
        safety_level: 'high',
        confidence: 1.0,
        educational_comment: "Sometimes you have to pass. That's part of backgammon!"
      };
    }
    
    // 80% chance to pick the best move, 20% to pick 2nd or 3rd best
    const random = Math.random();
    let selectedIndex = 0;
    
    if (random < 0.8) {
      selectedIndex = 0; // Best move
    } else if (random < 0.95 && rankedMoves.length > 1) {
      selectedIndex = 1; // Second best
    } else if (rankedMoves.length > 2) {
      selectedIndex = 2; // Third best
    }
    
    return rankedMoves[selectedIndex];
  }

  /**
   * Generate educational comments for moves
   */
  generateEducationalComment(move) {
    const comments = {
      opening_basic: "In the opening, making points is usually the best strategy!",
      point_building: "Building points gives you safe places to land your checkers.",
      safe_positional: "Safe moves protect your checkers from being hit.",
      inner_board: "Building your inner board helps when bearing off later.",
      race_basic: "In a race, getting your checkers home quickly is important.",
      balanced: "Balancing safety and progress is a key backgammon skill!"
    };
    
    return comments[move.strategy] || "Good thinking about the position!";
  }

  /**
   * EasyBot cube decisions - very conservative
   */
  makeCubeDecision(positionId, cubeValue, playerOnRoll) {
    // Simple conservative cube strategy
    const winProbability = this.estimateWinProbability(positionId);
    
    if (cubeValue === 1) {
      // Initial double - only with big advantage
      if (winProbability > 0.70) {
        return {
          decision: 'DOUBLE',
          reasoning: 'I have a strong position!',
          confidence: 0.7,
          comment: "When you're winning by a lot, doubling puts pressure on your opponent!"
        };
      }
    } else {
      // Redouble - very rare for EasyBot
      if (winProbability > 0.80) {
        return {
          decision: 'REDOUBLE',
          reasoning: 'I\'m in a very strong position!',
          confidence: 0.8,
          comment: "Redoubling when you\'re way ahead can win the game immediately!"
        };
      }
    }
    
    return {
      decision: 'NO_DOUBLE',
      reasoning: 'I think the position is still balanced',
      confidence: 0.6,
      comment: "No need to rush the cube. Let\'s see how the game develops!"
    };
  }

  /**
   * EasyBot take/drop decisions
   */
  makeTakeDropDecision(positionId, cubeValue) {
    const winProbability = this.estimateWinProbability(positionId);
    
    // Very conservative take point
    if (winProbability > 0.30) {
      return {
        decision: 'TAKE',
        reasoning: 'I think I still have chances to win',
        confidence: 0.6,
        comment: "It\'s usually worth taking if you have more than 25% chance to win!"
      };
    } else {
      return {
        decision: 'DROP',
        reasoning: 'This position looks too difficult',
        confidence: 0.7,
        comment: "Sometimes dropping is the smart move. Save your energy for the next game!"
      };
    }
  }

  /**
   * Generate encouraging messages
   */
  getEncouragingMessage(context = 'general') {
    const messageSet = this.messages[context] || this.messages.encouragement;
    return messageSet[Math.floor(Math.random() * messageSet.length)];
  }

  /**
   * Get EasyBot greeting
   */
  getGreeting() {
    return this.getEncouragingMessage('greeting');
  }

  /**
   * Get EasyBot game end message
   */
  getGameEndMessage(won = false) {
    const baseMessage = this.getEncouragingMessage('game_end');
    return won ? 
      `${baseMessage} Congratulations on your win!` : 
      `${baseMessage} Great game overall!`;
  }

  // Helper methods
  isOpeningPosition(positionId) {
    // Simplified opening detection
    return positionId === '4HPwATDgc/ABMA' || positionId.includes('HPw');
  }

  isRacePosition(positionId) {
    // Simplified race detection
    return Math.random() > 0.7; // Placeholder
  }

  estimateWinProbability(positionId) {
    // Very simplified win probability estimation
    return 0.4 + Math.random() * 0.3; // 40-70% range
  }

  /**
   * Get EasyBot statistics
   */
  getStatistics() {
    return {
      name: this.name,
      version: this.version,
      difficulty: this.difficulty,
      elo_rating: this.eloRating,
      personality: this.personality,
      skills: this.skills,
      play_style: 'beginner_friendly',
      average_thinking_time: '1-2 seconds',
      error_rate: '~15%',
      teaching_mode: 'always_on',
      best_for: ['beginners', 'casual_players', 'learning_fundamentals']
    };
  }
}

module.exports = { EasyBotService };
