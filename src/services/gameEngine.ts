// src/services/gameEngine.ts
// @ts-nocheck - Désactiver les vérifications strictes pour le moteur de jeu
import { 
  BoardState, 
  DiceState, 
  Move, 
  PlayerColor, 
  ValidationResult,
  INITIAL_BOARD 
} from '../types/game';

export class BackgammonEngine {
  
  // Créer un board initial
  static createInitialBoard(): BoardState {
    return {
      positions: [...INITIAL_BOARD.positions],
      whiteBar: INITIAL_BOARD.whiteBar,
      blackBar: INITIAL_BOARD.blackBar,
      whiteOff: INITIAL_BOARD.whiteOff,
      blackOff: INITIAL_BOARD.blackOff
    };
  }

  // Lancer les dés
  static rollDice(): DiceState {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const doubles = die1 === die2;
    
    return {
      dice: [die1, die2],
      used: [false, false],
      doubles,
      remaining: doubles ? [die1, die1, die2, die2] : [die1, die2]
    };
  }

  // Valider un mouvement
  static validateMove(move: Move, board: BoardState, dice: DiceState): ValidationResult {
    // 1. Vérifier que le mouvement utilise un dé valide
    if (!dice.remaining.includes(move.diceUsed)) {
      return {
        valid: false,
        error: `Die value ${move.diceUsed} is not available`
      };
    }

    // 2. Vérifier que c'est le tour du bon joueur
    const direction = move.player === 'white' ? 1 : -1;
    
    // 3. Valider le mouvement selon la position de départ
    if (move.from === 24) {
      // Mouvement depuis le bar
      return this.validateFromBar(move, board, dice);
    } else if (move.to === 25) {
      // Bearing off
      return this.validateBearingOff(move, board, dice);
    } else {
      // Mouvement normal
      return this.validateNormalMove(move, board, dice);
    }
  }

  // Valider mouvement depuis le bar
  private static validateFromBar(move: Move, board: BoardState, dice: DiceState): ValidationResult {
    const playerBar = move.player === 'white' ? board.whiteBar : board.blackBar;
    
    if (playerBar === 0) {
      return {
        valid: false,
        error: 'No pieces on bar to move'
      };
    }

    // Pour sortir du bar, on doit entrer dans la maison adverse (positions 0-5 ou 18-23)
    const homeStart = move.player === 'white' ? 18 : 0;
    const homeEnd = move.player === 'white' ? 24 : 6;
    
    if (move.to < homeStart || move.to >= homeEnd) {
      return {
        valid: false,
        error: 'Must enter from bar to opponent\'s home board'
      };
    }

    // Vérifier que la destination est valide
    const targetPosition = board.positions[move.to];
    const canLand = this.canLandOn(targetPosition, move.player);
    
    if (!canLand) {
      return {
        valid: false,
        error: 'Cannot land on this position'
      };
    }

    return { valid: true };
  }

  // Valider bearing off (sortie de pièces)
  private static validateBearingOff(move: Move, board: BoardState, dice: DiceState): ValidationResult {
    // Vérifier que toutes les pièces sont dans la maison
    if (!this.allPiecesInHome(move.player, board)) {
      return {
        valid: false,
        error: 'Cannot bear off until all pieces are in home board'
      };
    }

    // Vérifier que la pièce existe à la position de départ
    if (move.from < 0 || move.from > 23) {
      return {
        valid: false,
        error: 'Invalid starting position for bearing off'
      };
    }

    const piecesAtPosition = move.player === 'white' 
      ? board.positions[move.from] 
      : -board.positions[move.from];

    if (piecesAtPosition === 0) {
      return {
        valid: false,
        error: 'No piece at this position'
      };
    }

    return { valid: true };
  }

  // Valider mouvement normal
  private static validateNormalMove(move: Move, board: BoardState, dice: DiceState): ValidationResult {
    // Vérifier positions valides
    if (move.from < 0 || move.from > 23 || move.to < 0 || move.to > 23) {
      return {
        valid: false,
        error: 'Invalid board positions'
      };
    }

    // Vérifier que la pièce existe à la position de départ
    const piecesAtFrom = move.player === 'white' 
      ? board.positions[move.from] 
      : -board.positions[move.from];

    if (piecesAtFrom === 0) {
      return {
        valid: false,
        error: 'No piece at starting position'
      };
    }

    // Vérifier la direction du mouvement
    const direction = move.player === 'white' ? 1 : -1;
    const actualMove = (move.to - move.from) * direction;
    
    if (actualMove !== move.diceUsed) {
      return {
        valid: false,
        error: `Move distance ${actualMove} does not match die value ${move.diceUsed}`
      };
    }

    // Vérifier qu'on peut atterrir sur la destination
    const targetPosition = board.positions[move.to];
    const canLand = this.canLandOn(targetPosition, move.player);
    
    if (!canLand) {
      return {
        valid: false,
        error: 'Cannot land on this position'
      };
    }

    return { valid: true };
  }

  // Vérifier si on peut atterrir sur une position
  private static canLandOn(position: number, player: PlayerColor): boolean {
    if (player === 'white') {
      return position >= -1; // Peut atterrir sur vide, blanc, ou 1 noir (capture)
    } else {
      return position <= 1; // Peut atterrir sur vide, noir, ou 1 blanc (capture)
    }
  }

  // Vérifier si toutes les pièces sont dans la maison
  private static allPiecesInHome(player: PlayerColor, board: BoardState): boolean {
    const homeStart = player === 'white' ? 18 : 0;
    const homeEnd = player === 'white' ? 24 : 6;
    const playerBar = player === 'white' ? board.whiteBar : board.blackBar;

    if (playerBar > 0) return false;

    for (let i = 0; i < 24; i++) {
      if (i >= homeStart && i < homeEnd) continue; // Maison, c'est OK
      
      const pieces = board.positions[i];
      if (player === 'white' && pieces > 0) return false;
      if (player === 'black' && pieces < 0) return false;
    }

    return true;
  }

  // Appliquer un mouvement au board
  static applyMove(move: Move, board: BoardState): BoardState {
    const newBoard = {
      positions: [...board.positions],
      whiteBar: board.whiteBar,
      blackBar: board.blackBar,
      whiteOff: board.whiteOff,
      blackOff: board.blackOff
    };

    if (move.from === 24) {
      // Depuis le bar
      if (move.player === 'white') {
        newBoard.whiteBar--;
      } else {
        newBoard.blackBar--;
      }
    } else {
      // Mouvement normal
      if (move.player === 'white') {
        newBoard.positions[move.from]--;
      } else {
        newBoard.positions[move.from]++;
      }
    }

    if (move.to === 25) {
      // Bearing off
      if (move.player === 'white') {
        newBoard.whiteOff++;
      } else {
        newBoard.blackOff++;
      }
    } else {
      // Atterrir sur une position
      const targetPosition = newBoard.positions[move.to];
      
      // Capture si nécessaire
      if (move.player === 'white' && targetPosition === -1) {
        newBoard.positions[move.to] = 1;
        newBoard.blackBar++;
      } else if (move.player === 'black' && targetPosition === 1) {
        newBoard.positions[move.to] = -1;
        newBoard.whiteBar++;
      } else {
        // Mouvement normal
        newBoard.positions[move.to] += move.player === 'white' ? 1 : -1;
      }
    }

    return newBoard;
  }

  // Utiliser un dé
  static useDie(diceValue: number, dice: DiceState): DiceState {
    const index = dice.remaining.indexOf(diceValue);
    if (index === -1) return dice;

    const newRemaining = [...dice.remaining];
    newRemaining.splice(index, 1);

    return {
      ...dice,
      remaining: newRemaining
    };
  }

  // Calculer tous les mouvements possibles
  static calculateAvailableMoves(player: PlayerColor, board: BoardState, dice: DiceState): Move[] {
    const moves: Move[] = [];

    // Pour chaque dé disponible
    for (const dieValue of dice.remaining) {
      // Mouvements depuis chaque position
      for (let from = 0; from < 24; from++) {
        const pieces = player === 'white' ? board.positions[from] : -board.positions[from];
        if (pieces <= 0) continue;

        const direction = player === 'white' ? 1 : -1;
        const to = from + (dieValue * direction);

        // Mouvement normal
        if (to >= 0 && to < 24) {
          const move: Move = { from, to, player, diceUsed: dieValue };
          const validation = this.validateMove(move, board, dice);
          if (validation.valid) {
            moves.push(move);
          }
        }

        // Bearing off
        if (this.allPiecesInHome(player, board)) {
          const move: Move = { from, to: 25, player, diceUsed: dieValue };
          const validation = this.validateMove(move, board, dice);
          if (validation.valid) {
            moves.push(move);
          }
        }
      }

      // Mouvements depuis le bar
      const playerBar = player === 'white' ? board.whiteBar : board.blackBar;
      if (playerBar > 0) {
        const homeStart = player === 'white' ? 18 : 0;
        const homeEnd = player === 'white' ? 24 : 6;

        for (let to = homeStart; to < homeEnd; to++) {
          const move: Move = { from: 24, to, player, diceUsed: dieValue };
          const validation = this.validateMove(move, board, dice);
          if (validation.valid) {
            moves.push(move);
          }
        }
      }
    }

    return moves;
  }

  // Vérifier si le jeu est terminé
  static checkWinCondition(board: BoardState): PlayerColor | null {
    if (board.whiteOff === 15) return 'white';
    if (board.blackOff === 15) return 'black';
    return null;
  }

  // Compter les points (pip count)
  static calculatePipCount(board: BoardState): { white: number; black: number } {
    let whitePip = 0;
    let blackPip = 0;

    // Points sur le board
    for (let i = 0; i < 24; i++) {
      if (board.positions[i] > 0) {
        whitePip += board.positions[i] * (24 - i);
      } else if (board.positions[i] < 0) {
        blackPip += Math.abs(board.positions[i]) * (i + 1);
      }
    }

    // Points sur le bar
    whitePip += board.whiteBar * 25;
    blackPip += board.blackBar * 25;

    return { white: whitePip, black: blackPip };
  }
}
