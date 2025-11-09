/**
 * Auth Routes Simplifiées - Sans middleware externes
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { z } from 'zod';

const router = Router();

// Middleware de validation simple
const validateBody = (schema: z.ZodSchema) => (req: any, res: any, next: any) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: error.issues
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Erreur de validation'
    });
  }
};

const validateQuery = (schema: z.ZodSchema) => (req: any, res: any, next: any) => {
  try {
    req.query = schema.parse(req.query);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres de requête invalides',
        details: error.issues
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Erreur de validation'
    });
  }
};

// Schémas de validation
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
});

const updateProfileSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).optional()
});

const emailCheckSchema = z.object({
  email: z.string().email()
});

const usernameCheckSchema = z.object({
  username: z.string().min(3)
});

/**
 * @route   POST /api/auth/register
 * @desc    Inscription
 */
router.post('/register', validateBody(registerSchema), AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Connexion
 */
router.post('/login', validateBody(loginSchema), AuthController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Rafraîchir tokens
 */
router.post('/refresh', validateBody(refreshTokenSchema), AuthController.refreshTokens);

/**
 * @route   GET /api/auth/profile
 * @desc    Obtenir profil
 */
router.get('/profile', AuthController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Mettre à jour profil
 */
router.put('/profile', validateBody(updateProfileSchema), AuthController.updateProfile);

/**
 * @route   POST /api/auth/logout
 * @desc    Déconnexion
 */
router.post('/logout', AuthController.logout);

/**
 * @route   DELETE /api/auth/account
 * @desc    Désactiver compte
 */
router.delete('/account', AuthController.deactivateAccount);

/**
 * @route   GET /api/auth/check-email
 * @desc    Vérifier email
 */
router.get('/check-email', validateQuery(emailCheckSchema), AuthController.checkEmailAvailability);

/**
 * @route   GET /api/auth/check-username
 * @desc    Vérifier username
 */
router.get('/check-username', validateQuery(usernameCheckSchema), AuthController.checkUsernameAvailability);

export default router;
