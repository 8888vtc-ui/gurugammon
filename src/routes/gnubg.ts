// src/routes/gnubg.ts
import express from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { 
  getHint, 
  evaluatePosition, 
  analyzeGame, 
  checkInstallation 
} from '../controllers/gnubgController';

const router = express.Router();

// Toutes les routes GNUBG nécessitent une authentification
router.use(authMiddleware);

// POST /api/gnubg/hint - Obtenir une suggestion de mouvement
router.post('/hint', getHint);

// POST /api/gnubg/evaluate - Évaluer une position
router.post('/evaluate', evaluatePosition);

// POST /api/gnubg/analyze - Analyser une partie complète
router.post('/analyze', analyzeGame);

// GET /api/gnubg/check - Vérifier l'installation de GNUBG
router.get('/check', checkInstallation);

export default router;