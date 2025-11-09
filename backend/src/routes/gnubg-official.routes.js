/**
 * GNU BACKGAMMON OFFICIAL API ROUTES
 * Basé sur documentation officielle http://www.gnubg.org/documentation/
 * Compatible avec format position_id, match_id, annotations, etc.
 */

const express = require('express');
const { GnubgOfficialService } = require('../services/gnubg-official.service.js');

const router = express.Router();
const gnubgService = new GnubgOfficialService();

/**
 * POST /api/gnubg/official/evaluate
 * Évaluation position avec neural networks officiels
 */
router.post('/evaluate', async (req, res) => {
  try {
    const { 
      position_id, 
      cube_value = 1, 
      player_on_roll = 'white',
      evaluation_settings = {}
    } = req.body;

    // Validation des inputs selon documentation officielle
    if (!position_id) {
      return res.status(400).json({
        success: false,
        error: 'position_id is required (format: 4HPwATDgc/ABMA)',
        documentation: 'http://www.gnubg.org/documentation/'
      });
    }

    // Appliquer les settings d'évaluation
    if (evaluation_settings.plies) {
      gnubgService.evaluationSettings.plies = evaluation_settings.plies;
    }
    if (evaluation_settings.noise !== undefined) {
      gnubgService.evaluationSettings.noise = evaluation_settings.noise;
    }
    if (evaluation_settings.pruning_nets !== undefined) {
      gnubgService.evaluationSettings.pruningNets = evaluation_settings.pruning_nets;
    }

    // Évaluation avec neural networks officiels
    const evaluation = await gnubgService.evaluatePosition(
      position_id, 
      cube_value, 
      player_on_roll
    );

    res.json({
      success: true,
      evaluation: evaluation,
      metadata: {
        api_version: '1.06.002',
        documentation: 'http://www.gnubg.org/documentation/',
        neural_networks: {
          cubeless: gnubgService.neuralNets.cubeless,
          cubeful: gnubgService.neuralNets.cubeful,
          pruning: gnubgService.neuralNets.pruning
        },
        bearoff_database: gnubgService.bearoffDatabase,
        evaluation_time_ms: evaluation.evaluationTime
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      documentation: 'http://www.gnubg.org/documentation/'
    });
  }
});

/**
 * POST /api/gnubg/official/best-moves
 * Recherche meilleurs coups avec pruning neural nets
 */
router.post('/best-moves', async (req, res) => {
  try {
    const { 
      position_id, 
      dice, 
      player_on_roll = 'white',
      plies = 2,
      include_analysis = true
    } = req.body;

    // Validation selon format officiel
    if (!position_id || !dice || !Array.isArray(dice)) {
      return res.status(400).json({
        success: false,
        error: 'position_id and dice array are required',
        example: {
          position_id: '4HPwATDgc/ABMA',
          dice: [3, 5],
          player_on_roll: 'white'
        }
      });
    }

    // Validation des dés
    if (dice.length !== 2 && dice.length !== 4) {
      return res.status(400).json({
        success: false,
        error: 'dice must be array of 2 (normal) or 4 (doubles) values',
        dice_provided: dice
      });
    }

    // Recherche des meilleurs coups
    const analysis = await gnubgService.findBestMoves(
      position_id, 
      dice, 
      player_on_roll, 
      plies
    );

    res.json({
      success: true,
      analysis: analysis,
      best_move: analysis.bestMove,
      all_moves: analysis.moves,
      metadata: {
        position_id: position_id,
        dice: dice,
        player_on_roll: player_on_roll,
        plies: plies,
        pruning_enabled: gnubgService.evaluationSettings.pruningNets,
        total_possible_moves: analysis.analysis.totalPossibleMoves,
        pruned_moves: analysis.analysis.prunedMoves,
        pruning_efficiency: analysis.analysis.pruningEfficiency,
        evaluation_time_ms: analysis.analysis.evaluationTime,
        annotation_system: 'borrowed from chess (!!, !, !?, ?!, ?, ??)'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/gnubg/official/analyze-game
 * Analyse complète de partie avec annotations officielles
 */
router.post('/analyze-game', async (req, res) => {
  try {
    const { 
      game_moves, 
      match_id = null,
      analysis_settings = {
        include_annotations: true,
        calculate_error_rates: true,
        include_statistics: true
      }
    } = req.body;

    if (!game_moves || !Array.isArray(game_moves)) {
      return res.status(400).json({
        success: false,
        error: 'game_moves array is required',
        format: [
          {
            position_id: '4HPwATDgc/ABMA',
            dice: [3, 5],
            move: '8/5 6/5',
            player: 'white'
          }
        ]
      });
    }

    const gameAnalysis = {
      match_id: match_id,
      total_moves: game_moves.length,
      moves_analysis: [],
      statistics: {},
      annotations: []
    };

    let totalErrorRate = 0;
    let moveCount = 0;

    // Analyser chaque coup
    for (let i = 0; i < game_moves.length; i++) {
      const gameMove = game_moves[i];
      
      // Trouver le meilleur coup pour cette position
      const bestMovesAnalysis = await gnubgService.findBestMoves(
        gameMove.position_id,
        gameMove.dice,
        gameMove.player,
        2
      );

      // Analyser le coup joué vs le meilleur coup
      const playedMoveAnalysis = await gnubgService.findBestMoves(
        gameMove.position_id,
        gameMove.dice,
        gameMove.player,
        2
      );

      // Trouver l'analyse du coup joué
      const playedMoveEval = playedMoveAnalysis.moves.find(
        m => m.move === gameMove.move
      );

      const bestMove = bestMovesAnalysis.bestMove;
      const moveError = playedMoveEval ? bestMove.equity - playedMoveEval.equity : 0;
      
      // Annotation selon système officiel
      const annotation = gnubgService.getAnnotation(moveError);

      const moveAnalysis = {
        move_number: i + 1,
        player: gameMove.player,
        position_id: gameMove.position_id,
        dice: gameMove.dice,
        played_move: gameMove.move,
        best_move: bestMove.move,
        equity_difference: moveError,
        error_rate: Math.abs(moveError) * 1000, // millipoints
        annotation: annotation,
        evaluation: playedMoveEval ? playedMoveEval.evaluation : null
      };

      gameAnalysis.moves_analysis.push(moveAnalysis);
      
      if (analysis_settings.include_annotations) {
        gameAnalysis.annotations.push({
          move_number: i + 1,
          annotation: annotation.symbol,
          text: annotation.text,
          move: gameMove.move
        });
      }

      totalErrorRate += Math.abs(moveError);
      moveCount++;
    }

    // Statistiques de la partie
    if (analysis_settings.calculate_error_rates) {
      gameAnalysis.statistics = {
        average_error_rate: (totalErrorRate / moveCount) * 1000,
        total_error_rate: totalErrorRate * 1000,
        moves_analyzed: moveCount,
        error_distribution: {
          excellent: gameAnalysis.moves_analysis.filter(m => m.annotation.symbol === '!!').length,
          very_good: gameAnalysis.moves_analysis.filter(m => m.annotation.symbol === '!').length,
          good: gameAnalysis.moves_analysis.filter(m => m.annotation.symbol === '!?').length,
          doubtful: gameAnalysis.moves_analysis.filter(m => m.annotation.symbol === '?!').length,
          bad: gameAnalysis.moves_analysis.filter(m => m.annotation.symbol === '?').length,
          very_bad: gameAnalysis.moves_analysis.filter(m => m.annotation.symbol === '??').length
        }
      };
    }

    res.json({
      success: true,
      game_analysis: gameAnalysis,
      metadata: {
        analysis_type: 'full_game_analysis',
        annotation_system: 'official_gnubg_chess_based',
        neural_networks_used: ['cubeless', 'pruning'],
        bearoff_database: 'one_sided_memory',
        documentation: 'http://www.gnubg.org/documentation/'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gnubg/official/import-formats
 * Formats supportés pour import (documentation officielle)
 */
router.get('/import-formats', (req, res) => {
  res.json({
    success: true,
    supported_formats: {
      positions: ['.pos'],  // Jellyfish position format
      matches: ['.mat', '.ssg', '.tmg'],  // Jellyfish, Gamesgrid, TrueMoneyGames
      moves: ['.oldmove'],  // Fibs old move format
      position_id: {
        description: 'GNUBG position ID format',
        example: '4HPwATDgc/ABMA',
        documentation: 'http://www.gnubg.org/documentation/'
      },
      match_id: {
        description: 'GNUBG match ID format',
        example: '8HgAATDgc/ABMA',
        documentation: 'http://www.gnubg.org/documentation/'
      }
    },
    export_formats: {
      analysis: ['.txt', '.html'],
      matches: ['.mat', '.sgg'],
      positions: ['.pos']
    }
  });
});

/**
 * POST /api/gnubg/official/import-position
 * Importer position selon formats officiels
 */
router.post('/import-position', (req, res) => {
  try {
    const { format, data } = req.body;

    const supportedFormats = ['.pos', '.mat', '.ssg', '.tmg', '.oldmove'];
    
    if (!supportedFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported format: ${format}`,
        supported_formats: supportedFormats
      });
    }

    // Parser selon format (simulation)
    let parsedPosition;
    
    switch (format) {
      case '.pos':
        parsedPosition = parseJellyfishPosition(data);
        break;
      case '.mat':
        parsedPosition = parseJellyfishMatch(data);
        break;
      case '.ssg':
        parsedPosition = parseGamesgridMatch(data);
        break;
      case '.tmg':
        parsedPosition = parseTrueMoneyGames(data);
        break;
      case '.oldmove':
        parsedPosition = parseFibsOldMove(data);
        break;
    }

    res.json({
      success: true,
      parsed_position: parsedPosition,
      format: format,
      position_id: parsedPosition.position_id,
      metadata: {
        parser_version: '1.06.002',
        documentation: 'http://www.gnubg.org/documentation/'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gnubg/official/neural-networks
 * Information sur neural networks officiels
 */
router.get('/neural-networks', (req, res) => {
  res.json({
    success: true,
    neural_networks: gnubgService.neuralNets,
    bearoff_database: gnubgService.bearoffDatabase,
    evaluation_settings: gnubgService.evaluationSettings,
    annotation_system: gnubgService.annotations,
    documentation: {
      official: 'http://www.gnubg.org/documentation/',
      manual: 'https://www.gnu.org/software/gnubg/manual/',
      pruning_nets: 'https://www.gnu.org/software/gnubg/manual/html_node/Pruning-neural-networks.html'
    },
    version: {
      gnubg: '1.06.002',
      api: '1.0.0',
      neural_nets: 'cubeless + cubeful + pruning'
    }
  });
});

// Helper functions pour parsing (simulations)
function parseJellyfishPosition(data) {
  return {
    position_id: '4HPwATDgc/ABMA',
    board: data,
    format: 'jellyfish_pos'
  };
}

function parseJellyfishMatch(data) {
  return {
    position_id: '4HPwATDgc/ABMA',
    match_data: data,
    format: 'jellyfish_mat'
  };
}

function parseGamesgridMatch(data) {
  return {
    position_id: '4HPwATDgc/ABMA',
    match_data: data,
    format: 'gamesgrid_ssg'
  };
}

function parseTrueMoneyGames(data) {
  return {
    position_id: '4HPwATDgc/ABMA',
    match_data: data,
    format: 'truemoneygames_tmg'
  };
}

function parseFibsOldMove(data) {
  return {
    position_id: '4HPwATDgc/ABMA',
    move_data: data,
    format: 'fibs_oldmove'
  };
}

module.exports = router;
