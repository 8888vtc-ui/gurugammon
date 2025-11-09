/**
 * Auth Routes - Définition des routes API pour l'authentification
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';
import { z } from 'zod';

const router = Router();

// Schémas de validation pour les routes
const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  username: z.string().min(3, 'Le username doit contenir au moins 3 caractères')
});

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis')
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Le refresh token est requis')
});

const updateProfileSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).optional()
});

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post('/register',
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 5 }), // 5 inscriptions par 15 minutes
  validationMiddleware(registerSchema, 'body'),
  AuthController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Connexion d'un utilisateur
 * @access  Public
 */
router.post('/login',
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 connexions par 15 minutes
  validationMiddleware(loginSchema, 'body'),
  AuthController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Rafraîchir les tokens JWT
 * @access  Public
 */
router.post('/refresh',
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 20 }), // 20 rafraîchissements par minute
  validationMiddleware(refreshTokenSchema, 'body'),
  AuthController.refreshTokens
);

/**
 * @route   GET /api/auth/profile
 * @desc    Obtenir le profil utilisateur
 * @access  Private
 */
router.get('/profile',
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 30 }), // 30 requêtes par minute
  AuthController.getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Mettre à jour le profil utilisateur
 * @access  Private
 */
router.put('/profile',
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 10 }), // 10 mises à jour par minute
  validationMiddleware(updateProfileSchema, 'body'),
  AuthController.updateProfile
);

/**
 * @route   POST /api/auth/logout
 * @desc    Déconnexion d'un utilisateur
 * @access  Private
 */
router.post('/logout',
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 10 }), // 10 déconnexions par minute
  AuthController.logout
);

/**
 * @route   DELETE /api/auth/account
 * @desc    Désactiver le compte utilisateur
 * @access  Private
 */
router.delete('/account',
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 3 }), // 3 désactivations par minute
  AuthController.deactivateAccount
);

/**
 * @route   GET /api/auth/check-email
 * @desc    Vérifier si un email est disponible
 * @access  Public
 */
router.get('/check-email',
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 20 }), // 20 vérifications par minute
  AuthController.checkEmailAvailability
);

/**
 * @route   GET /api/auth/check-username
 * @desc    Vérifier si un username est disponible
 * @access  Public
 */
router.get('/check-username',
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 20 }), // 20 vérifications par minute
  AuthController.checkUsernameAvailability
);

export default router;
