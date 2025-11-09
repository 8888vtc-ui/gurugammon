export interface GameOptions {
    mode: 'AI_VS_PLAYER' | 'PLAYER_VS_PLAYER' | 'TOURNAMENT';
    opponentId?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    timeControl?: 'BLITZ' | 'NORMAL' | 'LONG';
}
export interface Game {
    id: string;
    whitePlayer: {
        id: string;
        username: string;
        elo: number;
    };
    blackPlayer: {
        id: string;
        username: string;
        elo: number;
    };
    boardState: string;
    currentPlayer: 'white' | 'black';
    status: 'WAITING' | 'PLAYING' | 'FINISHED' | 'ABORTED';
    gameMode: string;
    createdAt: string;
    whiteScore: number;
    blackScore: number;
    winner?: 'white' | 'black' | 'draw';
}
export interface Move {
    from: number;
    to: number;
    die: number;
    type: 'move' | 'hit' | 'bear_off';
}
export interface Analysis {
    equity: number;
    winProbability: {
        white: number;
        black: number;
    };
    bestMove: string;
    explanation: string;
    alternatives: Array<{
        move: string;
        equity: number;
    }>;
    pr: number;
}
export declare const gameService: {
    createGame(options: GameOptions): Promise<{
        success: boolean;
        data?: {
            game: Game;
        };
        error?: string;
    }>;
    getGameStatus(gameId: string): Promise<{
        success: boolean;
        data?: {
            game: Game;
            moves: Move[];
        };
        error?: string;
    }>;
    rollDice(gameId: string): Promise<{
        success: boolean;
        data?: {
            dice: number[];
        };
        error?: string;
    }>;
    makeMove(gameId: string, move: Move): Promise<{
        success: boolean;
        data?: {
            game: Game;
        };
        error?: string;
    }>;
    getSuggestions(gameId: string): Promise<{
        success: boolean;
        data?: {
            suggestions: Move[];
        };
        error?: string;
    }>;
    analyzePosition(boardState: string, dice: number[], player: "white" | "black", analysisType?: "QUICK" | "FULL"): Promise<{
        success: boolean;
        data?: Analysis;
        error?: string;
    }>;
    getHint(boardState: string, dice: number[], player: "white" | "black"): Promise<{
        success: boolean;
        data?: {
            hint: string;
            explanation: string;
        };
        error?: string;
    }>;
    evaluatePosition(boardState: string, player: "white" | "black"): Promise<{
        success: boolean;
        data?: {
            equity: number;
            winProbability: number;
        };
        error?: string;
    }>;
    resignGame(gameId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    proposeDraw(gameId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    respondToDraw(gameId: string, accept: boolean): Promise<{
        success: boolean;
        error?: string;
    }>;
    getUserGames(limit?: number, offset?: number): Promise<{
        success: boolean;
        data?: {
            games: Game[];
            total: number;
        };
        error?: string;
    }>;
    joinGame(gameId: string): Promise<{
        success: boolean;
        data?: {
            game: Game;
        };
        error?: string;
    }>;
    leaveGame(gameId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
};
export default gameService;
//# sourceMappingURL=game.d.ts.map