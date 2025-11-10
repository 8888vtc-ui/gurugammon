import { apiClient } from '../config/api.config.js';
export const gameService = {
    // Créer une nouvelle partie
    async createGame(options) {
        try {
            const data = await apiClient.createGame(options.mode, options.difficulty || 'MEDIUM');
            return {
                success: true,
                data: data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Erreur lors de la création de la partie'
            };
        }
    },
    // Obtenir le statut d'une partie
    async getGameStatus(gameId) {
        try {
            const data = await apiClient.getGameStatus(gameId);
            return {
                success: true,
                data: data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Erreur lors du chargement de la partie'
            };
        }
    },
    // Lancer les dés
    async rollDice(gameId) {
        try {
            const data = await apiClient.rollDice(gameId);
            return {
                success: true,
                data: data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Erreur lors du lancer de dés'
            };
        }
    },
    // Effectuer un mouvement
    async makeMove(gameId, move) {
        try {
            const data = await apiClient.makeMove(gameId, move.from, move.to);
            return {
                success: true,
                data: data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Erreur lors du mouvement'
            };
        }
    },
    // Obtenir les suggestions de l'IA
    async getSuggestions(gameId) {
        // TODO: Implement when backend supports this endpoint
        return {
            success: false,
            error: 'Suggestions not implemented yet'
        };
    },
    // Analyser une position avec GNUBG
    async analyzePosition(boardState, dice, player, analysisType = 'FULL') {
        // TODO: Implement when backend GNUBG analysis is ready
        return {
            success: false,
            error: 'GNUBG analysis not implemented yet'
        };
    },
    // Obtenir une suggestion rapide
    async getHint(boardState, dice, player) {
        // TODO: Implement when backend hint system is ready
        return {
            success: false,
            error: 'Hint system not implemented yet'
        };
    }
};
//# sourceMappingURL=game.js.map