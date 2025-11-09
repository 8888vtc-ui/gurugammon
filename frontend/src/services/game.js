import api from './api';
export const gameService = {
    // Créer une nouvelle partie
    async createGame(options) {
        try {
            const response = await api.post('/game/create', {
                game_mode: options.mode,
                opponent_id: options.opponentId || null,
                difficulty: options.difficulty || 'MEDIUM',
                time_control: options.timeControl || 'NORMAL'
            });
            return {
                success: true,
                data: response.data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Erreur lors de la création de la partie'
            };
        }
    },
    // Obtenir le statut d'une partie
    async getGameStatus(gameId) {
        try {
            const response = await api.get(`/game/status?gameId=${gameId}`);
            return {
                success: true,
                data: response.data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Erreur lors du chargement de la partie'
            };
        }
    },
    // Lancer les dés
    async rollDice(gameId) {
        try {
            const response = await api.post(`/games/${gameId}/roll`);
            return {
                success: true,
                data: response.data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Erreur lors du lancer des dés'
            };
        }
    },
    // Effectuer un mouvement
    async makeMove(gameId, move) {
        try {
            const response = await api.post(`/games/${gameId}/move`, {
                from: move.from,
                to: move.to,
                die: move.die,
                type: move.type
            });
            return {
                success: true,
                data: response.data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Erreur lors du mouvement'
            };
        }
    },
    // Obtenir les suggestions de l'IA
    async getSuggestions(gameId) {
        try {
            const response = await api.get(`/games/${gameId}/suggestions`);
            return {
                success: true,
                data: response.data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Erreur lors de l\'obtention des suggestions'
            };
        }
    },
    // Analyser une position avec GNUBG
    async analyzePosition(boardState, dice, player, analysisType = 'FULL') {
        try {
            const response = await api.post('/gnubg/analyze', {
                boardState,
                dice,
                player,
                analysisType
            });
            return {
                success: true,
                data: response.data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Erreur lors de l\'analyse de la position'
            };
        }
    },
    // Obtenir une suggestion rapide
    async getHint(boardState, dice, player) {
        try {
            const response = await api.post('/gnubg/hint', {
                boardState,
                dice,
                player
            });
            return {
                success: true,
                data: response.data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Erreur lors de l\'obtention de la suggestion'
            };
        }
    },
    // Évaluer l'équité d'une position
    async evaluatePosition(boardState, player) {
        try {
            const response = await api.post('/gnubg/evaluate', {
                boardState,
                player
            });
            return {
                success: true,
                data: response.data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Erreur lors de l\'évaluation de la position'
            };
        }
    },
    // Abandonner la partie
    async resignGame(gameId) {
        try {
            await api.post(`/games/${gameId}/resign`);
            return {
                success: true
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Erreur lors de l\'abandon de la partie'
            };
        }
    },
    // Proposer une nulle
    async proposeDraw(gameId) {
        try {
            await api.post(`/games/${gameId}/draw`);
            return {
                success: true
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Erreur lors de la proposition de nulle'
            };
        }
    },
    // Accepter/refuser une nulle
    async respondToDraw(gameId, accept) {
        try {
            await api.put(`/games/${gameId}/draw`, { accept });
            return {
                success: true
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Erreur lors de la réponse à la nulle'
            };
        }
    },
    // Obtenir l'historique des parties d'un utilisateur
    async getUserGames(limit = 20, offset = 0) {
        try {
            const response = await api.get(`/games?limit=${limit}&offset=${offset}`);
            return {
                success: true,
                data: response.data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Erreur lors de l\'obtention de l\'historique des parties'
            };
        }
    },
    // Rejoindre une partie en attente
    async joinGame(gameId) {
        try {
            const response = await api.post(`/games/${gameId}/join`);
            return {
                success: true,
                data: response.data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Erreur lors de la rejointe de la partie'
            };
        }
    },
    // Quitter une partie (avant qu'elle ne commence)
    async leaveGame(gameId) {
        try {
            await api.post(`/games/${gameId}/leave`);
            return {
                success: true
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Erreur lors du départ de la partie'
            };
        }
    }
};
export default gameService;
//# sourceMappingURL=game.js.map