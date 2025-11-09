/**
 * AuthService - Gestion utilisateurs robuste et sécurisée
 */

import { Logger } from '../utils/logger.utils';
import { SecurityUtils } from '../utils/security.utils';
import { JwtConfig } from '../config/jwt.config';
import { UserRole } from '../types';
import { z } from 'zod';

// Schémas de validation Zod robustes
const RegisterSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'),
  username: z.string().min(3, 'Le username doit contenir au moins 3 caractères')
    .max(20, 'Le username ne peut pas dépasser 20 caractères')
    .regex(/^[a-zA-Z0-9_]+$/, 'Le username ne peut contenir que des lettres, chiffres et underscore')
});

const LoginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis')
});

const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).optional()
});

// Types locaux simples
interface SimpleUser {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  subscription: 'free' | 'premium';
  level: number;
  elo: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SimpleRegisterRequest {
  email: string;
  password: string;
  username: string;
}

interface SimpleLoginRequest {
  email: string;
  password: string;
}

interface SimpleUpdateProfileRequest {
  username?: string;
  currentPassword?: string;
  newPassword?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Base de données simulée (en production: PostgreSQL/Supabase)
class UserDatabase {
  private static users: Map<string, SimpleUser> = new Map();
  private static emailIndex: Map<string, string> = new Map();
  private static usernameIndex: Map<string, string> = new Map();

  static async findByEmail(email: string): Promise<SimpleUser | null> {
    const userId = this.emailIndex.get(email);
    return userId ? this.users.get(userId) || null : null;
  }

  static async findByUsername(username: string): Promise<SimpleUser | null> {
    const userId = this.usernameIndex.get(username);
    return userId ? this.users.get(userId) || null : null;
  }

  static async findById(id: string): Promise<SimpleUser | null> {
    return this.users.get(id) || null;
  }

  static async create(user: Omit<SimpleUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<SimpleUser> {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newUser: SimpleUser = {
      ...user,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(id, newUser);
    this.emailIndex.set(user.email, id);
    this.usernameIndex.set(user.username, id);
    
    return newUser;
  }

  static async update(id: string, updates: Partial<SimpleUser>): Promise<SimpleUser | null> {
    const user = this.users.get(id);
    if (!user) return null;
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    
    // Mettre à jour les index si email/username changent
    if (updates.email) {
      this.emailIndex.delete(user.email);
      this.emailIndex.set(updates.email, id);
    }
    if (updates.username) {
      this.usernameIndex.delete(user.username);
      this.usernameIndex.set(updates.username, id);
    }
    
    return updatedUser;
  }
}

export class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  public static async register(userData: SimpleRegisterRequest): Promise<{ 
    user: Omit<SimpleUser, 'passwordHash'>; 
    tokens: AuthTokens 
  }> {
    try {
      // Validation robuste avec Zod
      const validatedData = RegisterSchema.parse(userData);
      
      // Vérifier si l'email existe déjà
      const existingUser = await UserDatabase.findByEmail(validatedData.email);
      if (existingUser) {
        throw new Error('Cet email est déjà enregistré');
      }

      // Vérifier si le username existe déjà
      const existingUsername = await UserDatabase.findByUsername(validatedData.username);
      if (existingUsername) {
        throw new Error('Ce username est déjà pris');
      }

      // Hasher le mot de passe
      const passwordHash = await SecurityUtils.hashPassword(validatedData.password);

      // Créer l'utilisateur
      const newUser = await UserDatabase.create({
        email: validatedData.email,
        username: validatedData.username,
        passwordHash,
        role: UserRole.PLAYER,
        subscription: 'free',
        level: 1,
        elo: 1200,
        isActive: true,
        isVerified: false
      });

      // Générer les tokens JWT
      const jwtTokens = JwtConfig.generateTokens(newUser.id, newUser.email, newUser.role);
      const tokens: AuthTokens = {
        accessToken: jwtTokens.accessToken.toString(),
        refreshToken: jwtTokens.refreshToken.toString()
      };

      const userResponse: Omit<SimpleUser, 'passwordHash'> = {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        subscription: newUser.subscription,
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
  public static async login(loginData: SimpleLoginRequest): Promise<{ 
    user: Omit<SimpleUser, 'passwordHash'>; 
    tokens: AuthTokens 
  }> {
    try {
      // Validation robuste avec Zod
      const validatedData = LoginSchema.parse(loginData);
      
      // Trouver l'utilisateur par email
      const user = await UserDatabase.findByEmail(validatedData.email);
      if (!user) {
        throw new Error('Email ou mot de passe incorrect');
      }

      // Vérifier si le compte est actif
      if (!user.isActive) {
        throw new Error('Ce compte a été désactivé');
      }

      // Vérifier le mot de passe
      const isPasswordValid = await SecurityUtils.verifyPassword(validatedData.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Email ou mot de passe incorrect');
      }

      // Générer les tokens JWT
      const jwtTokens = JwtConfig.generateTokens(user.id, user.email, user.role);
      const tokens: AuthTokens = {
        accessToken: jwtTokens.accessToken.toString(),
        refreshToken: jwtTokens.refreshToken.toString()
      };

      const userResponse: Omit<SimpleUser, 'passwordHash'> = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        subscription: user.subscription,
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
  public static async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = JwtConfig.validateRefreshToken(refreshToken as any);
      
      // Vérifier que l'utilisateur existe toujours
      const user = await UserDatabase.findById(payload.userId);
      if (!user || !user.isActive) {
        throw new Error('Utilisateur non trouvé ou inactif');
      }

      // Générer de nouveaux tokens
      const jwtTokens = JwtConfig.generateTokens(user.id, user.email, user.role);
      const newTokens: AuthTokens = {
        accessToken: jwtTokens.accessToken.toString(),
        refreshToken: jwtTokens.refreshToken.toString()
      };

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
   * Obtenir le profil utilisateur
   */
  public static async getProfile(userId: string): Promise<Omit<SimpleUser, 'passwordHash'> | null> {
    try {
      const user = await UserDatabase.findById(userId);
      if (!user) {
        return null;
      }

      const userResponse: Omit<SimpleUser, 'passwordHash'> = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        subscription: user.subscription,
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
  public static async updateElo(
    userId: string, 
    gameResult: 'win' | 'loss' | 'draw', 
    opponentElo: number
  ): Promise<void> {
    try {
      const user = await UserDatabase.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      const newElo = AuthService.calculateElo(user.elo, opponentElo, gameResult);
      
      await UserDatabase.update(userId, { 
        elo: Math.round(newElo),
        level: Math.floor(newElo / 100) + 1
      });

      Logger.info('ELO updated successfully', {
        userId,
        oldElo: user.elo,
        newElo: Math.round(newElo),
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
   * Mettre à jour le profil utilisateur
   */
  public static async updateProfile(
    userId: string, 
    profileData: SimpleUpdateProfileRequest
  ): Promise<Omit<SimpleUser, 'passwordHash'>> {
    try {
      // Validation robuste avec Zod
      const validatedData = UpdateProfileSchema.parse(profileData);
      
      const user = await UserDatabase.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      const updates: Partial<SimpleUser> = {};

      // Si changement de mot de passe
      if (validatedData.newPassword) {
        if (!validatedData.currentPassword) {
          throw new Error('Le mot de passe actuel est requis pour le changer');
        }

        const isCurrentPasswordValid = await SecurityUtils.verifyPassword(
          validatedData.currentPassword, 
          user.passwordHash
        );
        
        if (!isCurrentPasswordValid) {
          throw new Error('Le mot de passe actuel est incorrect');
        }

        updates.passwordHash = await SecurityUtils.hashPassword(validatedData.newPassword);
      }

      // Mettre à jour le username si fourni
      if (validatedData.username) {
        const existingUsername = await UserDatabase.findByUsername(validatedData.username);
        if (existingUsername && existingUsername.id !== userId) {
          throw new Error('Ce username est déjà pris');
        }
        updates.username = validatedData.username;
      }

      const updatedUser = await UserDatabase.update(userId, updates);
      if (!updatedUser) {
        throw new Error('Échec de la mise à jour');
      }

      const userResponse: Omit<SimpleUser, 'passwordHash'> = {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
        subscription: updatedUser.subscription,
        level: updatedUser.level,
        elo: updatedUser.elo,
        isActive: updatedUser.isActive,
        isVerified: updatedUser.isVerified,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
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
   * Désactiver un compte utilisateur
   */
  public static async deactivateAccount(userId: string): Promise<void> {
    try {
      const user = await UserDatabase.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      await UserDatabase.update(userId, { isActive: false });

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
