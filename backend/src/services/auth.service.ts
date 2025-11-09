/**
 * AuthService - Gestion des utilisateurs et authentification
 */

import { 
  User, 
  RegisterRequest, 
  LoginRequest, 
  UpdateProfileRequest,
  UserRole,
  SubscriptionType
} from '../types';
import { JwtConfig } from '../config';
import { SecurityUtils } from '../utils';
import { Logger } from '../utils';
import { ValidationUtils, RegisterSchema, LoginSchema, UpdateProfileSchema } from '../utils';

export class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  public static async register(userData: RegisterRequest): Promise<{ user: Omit<User, 'passwordHash'>; tokens: import('../config').JwtTokens }> {
    try {
      const validatedData = ValidationUtils.validate(RegisterSchema, userData);
      
      // Vérifier si l'email existe déjà
      const existingUser = await AuthService.findUserByEmail(validatedData.email);
      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Vérifier si le username existe déjà
      const existingUsername = await AuthService.findUserByUsername(validatedData.username);
      if (existingUsername) {
        throw new Error('Username already taken');
      }

      // Hasher le mot de passe
      const passwordHash = await SecurityUtils.hashPassword(validatedData.password);

      // Créer l'utilisateur
      const newUser: User = {
        id: SecurityUtils.generateSecureId(),
        email: validatedData.email,
        username: validatedData.username,
        passwordHash,
        role: UserRole.USER,
        subscriptionType: SubscriptionType.FREE,
        level: 1,
        elo: 1200,
        isActive: true,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Sauvegarder l'utilisateur (en production: base de données)
      await AuthService.saveUser(newUser);

      // Générer les tokens JWT
      const tokens = JwtConfig.generateTokens(newUser.id, newUser.email, newUser.role);

      const userResponse: Omit<User, 'passwordHash'> = {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        subscriptionType: newUser.subscriptionType,
        level: newUser.level,
        elo: newUser.elo,
        isActive: newUser.isActive,
        isVerified: newUser.isVerified,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      };

      Logger.info('User registered successfully', {
        userId: newUser.id,
        email: newUser.email,
        action: 'user_registered'
      });

      return { user: userResponse, tokens };
    } catch (error) {
      Logger.error('Registration failed', {
        email: userData.email,
        action: 'registration_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Connexion d'un utilisateur
   */
  public static async login(loginData: LoginRequest): Promise<{ user: Omit<User, 'passwordHash'>; tokens: import('../config').JwtTokens }> {
    try {
      const validatedData = ValidationUtils.validate(LoginSchema, loginData);
      
      // Trouver l'utilisateur par email
      const user = await AuthService.findUserByEmail(validatedData.email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Vérifier si le compte est actif
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Vérifier le mot de passe
      const isPasswordValid = await SecurityUtils.verifyPassword(validatedData.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Générer les tokens JWT
      const tokens = JwtConfig.generateTokens(user.id, user.email, user.role);

      const userResponse: Omit<User, 'passwordHash'> = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        subscriptionType: user.subscriptionType,
        level: user.level,
        elo: user.elo,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: new Date()
      };

      Logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
        action: 'user_login'
      });

      return { user: userResponse, tokens };
    } catch (error) {
      Logger.error('Login failed', {
        email: loginData.email,
        action: 'login_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Rafraîchir les tokens JWT
   */
  public static async refreshTokens(refreshToken: string): Promise<import('../config').JwtTokens> {
    try {
      const payload = JwtConfig.validateRefreshToken(refreshToken as any);
      
      // Vérifier que l'utilisateur existe toujours
      const user = await AuthService.findUserById(payload.userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Générer de nouveaux tokens
      const newTokens = JwtConfig.generateTokens(user.id, user.email, user.role);

      Logger.info('Tokens refreshed successfully', {
        userId: user.id,
        action: 'tokens_refreshed'
      });

      return newTokens;
    } catch (error) {
      Logger.error('Token refresh failed', {
        action: 'token_refresh_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  public static async updateProfile(userId: string, profileData: UpdateProfileRequest): Promise<Omit<User, 'passwordHash'>> {
    try {
      const validatedData = ValidationUtils.validate(UpdateProfileSchema, profileData);
      
      const user = await AuthService.findUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Si changement de mot de passe
      if (validatedData.newPassword) {
        if (!validatedData.currentPassword) {
          throw new Error('Current password is required');
        }

        const isCurrentPasswordValid = await SecurityUtils.verifyPassword(
          validatedData.currentPassword, 
          user.passwordHash
        );
        
        if (!isCurrentPasswordValid) {
          throw new Error('Current password is incorrect');
        }

        user.passwordHash = await SecurityUtils.hashPassword(validatedData.newPassword);
      }

      // Mettre à jour le username si fourni
      if (validatedData.username) {
        const existingUsername = await AuthService.findUserByUsername(validatedData.username);
        if (existingUsername && existingUsername.id !== userId) {
          throw new Error('Username already taken');
        }
        user.username = validatedData.username;
      }

      user.updatedAt = new Date();

      // Sauvegarder les modifications
      await AuthService.updateUser(user);

      const userResponse: Omit<User, 'passwordHash'> = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        subscriptionType: user.subscriptionType,
        level: user.level,
        elo: user.elo,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      Logger.info('Profile updated successfully', {
        userId,
        action: 'profile_updated'
      });

      return userResponse;
    } catch (error) {
      Logger.error('Profile update failed', {
        userId,
        action: 'profile_update_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Obtenir le profil utilisateur
   */
  public static async getProfile(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
    try {
      const user = await AuthService.findUserById(userId);
      if (!user) {
        return null;
      }

      const userResponse: Omit<User, 'passwordHash'> = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        subscriptionType: user.subscriptionType,
        level: user.level,
        elo: user.elo,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      Logger.debug('Profile fetched successfully', {
        userId,
        action: 'profile_fetched'
      });

      return userResponse;
    } catch (error) {
      Logger.error('Profile fetch failed', {
        userId,
        action: 'profile_fetch_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Mettre à jour le ELO de l'utilisateur
   */
  public static async updateElo(userId: string, gameResult: 'win' | 'loss' | 'draw', opponentElo: number): Promise<void> {
    try {
      const user = await AuthService.findUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const newElo = AuthService.calculateElo(user.elo, opponentElo, gameResult);
      user.elo = Math.round(newElo);
      user.updatedAt = new Date();

      await AuthService.updateUser(user);

      Logger.info('ELO updated successfully', {
        userId,
        oldElo: user.elo,
        newElo,
        gameResult,
        action: 'elo_updated'
      });
    } catch (error) {
      Logger.error('ELO update failed', {
        userId,
        action: 'elo_update_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Désactiver un compte utilisateur
   */
  public static async deactivateAccount(userId: string): Promise<void> {
    try {
      const user = await AuthService.findUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.isActive = false;
      user.updatedAt = new Date();

      await AuthService.updateUser(user);

      Logger.info('Account deactivated successfully', {
        userId,
        action: 'account_deactivated'
      });
    } catch (error) {
      Logger.error('Account deactivation failed', {
        userId,
        action: 'account_deactivation_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Méthodes privées (en production, ces méthodes interagiraient avec la base de données)

  private static async findUserByEmail(email: string): Promise<User | null> {
    // Simulation - en production: requête base de données
    Logger.debug('Finding user by email', { email, action: 'find_user_by_email' });
    return null;
  }

  private static async findUserByUsername(username: string): Promise<User | null> {
    // Simulation - en production: requête base de données
    Logger.debug('Finding user by username', { username, action: 'find_user_by_username' });
    return null;
  }

  private static async findUserById(userId: string): Promise<User | null> {
    // Simulation - en production: requête base de données
    Logger.debug('Finding user by ID', { userId, action: 'find_user_by_id' });
    return null;
  }

  private static async saveUser(user: User): Promise<void> {
    // Simulation - en production: insertion base de données
    Logger.debug('Saving user', { userId: user.id, action: 'save_user' });
  }

  private static async updateUser(user: User): Promise<void> {
    // Simulation - en production: mise à jour base de données
    Logger.debug('Updating user', { userId: user.id, action: 'update_user' });
  }

  /**
   * Calculer le nouveau ELO selon la formule standard
   */
  private static calculateElo(currentElo: number, opponentElo: number, result: 'win' | 'loss' | 'draw'): number {
    const K = 32; // Facteur K pour les joueurs amateurs
    const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - currentElo) / 400));
    const actualScore = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
    
    return currentElo + K * (actualScore - expectedScore);
  }
}
