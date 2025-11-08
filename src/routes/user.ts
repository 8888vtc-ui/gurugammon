// src/routes/user.ts
import express from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { getProfile, updateProfile } from '../controllers/userController';

const router = express.Router();

// Toutes les routes utilisateur nécessitent une authentification
router.use(authMiddleware);

// GET /api/user/profile - Obtenir son profil
router.get('/profile', getProfile);

// PUT /api/user/profile - Mettre à jour son profil
router.put('/profile', updateProfile);

export default router;
