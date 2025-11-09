/**
 * AuthController - API REST pour l'authentification
 */

import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.robust';
import { Logger } from '../utils/logger.utils';
import { z } from 'zod';

// Schémas de validation pour les requêtes API
const RegisterRequestSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  username: z.string().min(3, 'Le username doit contenir au moins 3 caractères')
});

const LoginRequestSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis')
});

const UpdateProfileRequestSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).optional()
});

const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, 'Le refresh token est requis')
});

export class AuthController {
  /**
   * Inscription d'un nouvel utilisateur
   */
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      // Validation de la requête
      const validatedData = RegisterRequestSchema.parse(req.body);
      
      // Appeler AuthService pour l'inscription
      const result = await AuthService.register(validatedData);

      Logger.info('User registered via API', {
        userId: result.user.id,
        email: result.user.email,
        action: 'api_user_registered'
      });

      res.status(201).json({
        success: true,
        message: 'Inscription réussie',
        data: {
          user: result.user,
          tokens: result.tokens
        }
      });
    } catch (error) {
      Logger.error('API register failed', {
        email: req.body.email,
        action: 'api_register_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: error.issues
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur serveur lors de l\'inscription'
      });
    }
  }

  /**
   * Connexion d'un utilisateur
   */
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      // Validation de la requête
      const validatedData = LoginRequestSchema.parse(req.body);
      
      // Appeler AuthService pour la connexion
      const result = await AuthService.login(validatedData);

      Logger.info('User logged in via API', {
        userId: result.user.id,
        email: result.user.email,
        action: 'api_user_login'
      });

      res.status(200).json({
        success: true,
        message: 'Connexion réussie',
        data: {
          user: result.user,
          tokens: result.tokens
        }
      });
    } catch (error) {
      Logger.error('API login failed', {
        email: req.body.email,
        action: 'api_login_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: error.issues
        });
        return;
      }

      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Email ou mot de passe incorrect'
      });
    }
  }

  /**
   * Rafraîchir les tokens JWT
   */
  public static async refreshTokens(req: Request, res: Response): Promise<void> {
    try {
      // Validation de la requête
      const { refreshToken } = RefreshTokenRequestSchema.parse(req.body);
      
      // Appeler AuthService pour rafraîchir les tokens
      const tokens = await AuthService.refreshTokens(refreshToken);

      Logger.info('Tokens refreshed via API', {
        action: 'api_tokens_refreshed'
      });

      res.status(200).json({
        success: true,
        message: 'Tokens rafraîchis avec succès',
        data: {
          tokens
        }
      });
    } catch (error) {
      Logger.error('API refresh tokens failed', {
        action: 'api_refresh_tokens_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: error.issues
        });
        return;
      }

      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Token de rafraîchissement invalide'
      });
    }
  }

  /**
   * Obtenir le profil utilisateur
   */
  public static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      // Récupérer l'utilisateur depuis le JWT (middleware d'auth)
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ 
          success: false,
          error: 'Utilisateur non authentifié' 
        });
        return;
      }

      // Appeler AuthService pour obtenir le profil
      const user = await AuthService.getProfile(userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
        return;
      }

      Logger.info('Profile fetched via API', {
        userId,
        action: 'api_profile_fetched'
      });

      res.status(200).json({
        success: true,
        data: {
          user
        }
      });
    } catch (error) {
      Logger.error('API get profile failed', {
        userId: (req as any).user?.id,
        action: 'api_get_profile_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la récupération du profil'
      });
    }
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  public static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      // Récupérer l'utilisateur depuis le JWT (middleware d'auth)
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ 
          success: false,
          error: 'Utilisateur non authentifié' 
        });
        return;
      }

      // Validation de la requête
      const validatedData = UpdateProfileRequestSchema.parse(req.body);
      
      // Appeler AuthService pour mettre à jour le profil
      const updatedUser = await AuthService.updateProfile(userId, validatedData);

      Logger.info('Profile updated via API', {
        userId,
        action: 'api_profile_updated'
      });

      res.status(200).json({
        success: true,
        message: 'Profil mis à jour avec succès',
        data: {
          user: updatedUser
        }
      });
    } catch (error) {
      Logger.error('API update profile failed', {
        userId: (req as any).user?.id,
        action: 'api_update_profile_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: error.issues
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur serveur lors de la mise à jour du profil'
      });
    }
  }

  /**
   * Déconnexion (révocation des tokens)
   */
  public static async logout(req: Request, res: Response): Promise<void> {
    try {
      // Récupérer l'utilisateur depuis le JWT (middleware d'auth)
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ 
          success: false,
          error: 'Utilisateur non authentifié' 
        });
        return;
      }

      // Pour l'instant, on simule la déconnexion
      // En production, on pourrait ajouter les tokens à une blacklist
      Logger.info('User logged out via API', {
        userId,
        action: 'api_user_logout'
      });

      res.status(200).json({
        success: true,
        message: 'Déconnexion réussie'
      });
    } catch (error) {
      Logger.error('API logout failed', {
        userId: (req as any).user?.id,
        action: 'api_logout_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la déconnexion'
      });
    }
  }

  /**
   * Désactiver le compte utilisateur
   */
  public static async deactivateAccount(req: Request, res: Response): Promise<void> {
    try {
      // Récupérer l'utilisateur depuis le JWT (middleware d'auth)
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ 
          success: false,
          error: 'Utilisateur non authentifié' 
        });
        return;
      }

      // Appeler AuthService pour désactiver le compte
      await AuthService.deactivateAccount(userId);

      Logger.info('Account deactivated via API', {
        userId,
        action: 'api_account_deactivated'
      });

      res.status(200).json({
        success: true,
        message: 'Compte désactivé avec succès'
      });
    } catch (error) {
      Logger.error('API deactivate account failed', {
        userId: (req as any).user?.id,
        action: 'api_deactivate_account_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur serveur lors de la désactivation du compte'
      });
    }
  }

  /**
   * Vérifier si l'email est disponible
   */
  public static async checkEmailAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Email requis'
        });
        return;
      }

      // Pour l'instant, on simule la vérification
      // En production, on vérifierait dans la base de données
      const isAvailable = !email.includes('taken'); // Simulation simple

      Logger.debug('Email availability checked via API', {
        email,
        isAvailable,
        action: 'api_email_availability_checked'
      });

      res.status(200).json({
        success: true,
        data: {
          email,
          isAvailable
        }
      });
    } catch (error) {
      Logger.error('API check email availability failed', {
        email: req.query.email,
        action: 'api_check_email_availability_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la vérification de la disponibilité de l\'email'
      });
    }
  }

  /**
   * Vérifier si le username est disponible
   */
  public static async checkUsernameAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.query;
      
      if (!username || typeof username !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Username requis'
        });
        return;
      }

      // Pour l'instant, on simule la vérification
      const isAvailable = !username.includes('taken'); // Simulation simple

      Logger.debug('Username availability checked via API', {
        username,
        isAvailable,
        action: 'api_username_availability_checked'
      });

      res.status(200).json({
        success: true,
        data: {
          username,
          isAvailable
        }
      });
    } catch (error) {
      Logger.error('API check username availability failed', {
        username: req.query.username,
        action: 'api_check_username_availability_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la vérification de la disponibilité du username'
      });
    }
  }
}
