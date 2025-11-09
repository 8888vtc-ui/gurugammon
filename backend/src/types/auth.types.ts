/**
 * Types pour l'authentification et la gestion utilisateur
 */

export type UserId = string;
export type Email = string;
export type Token = string;

export enum UserRole {
  PLAYER = 'PLAYER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR'
}

export enum SubscriptionType {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  PRO = 'PRO'
}

// Interface Utilisateur
export interface User {
  readonly id: UserId;
  readonly email: Email;
  readonly username: string;
  readonly passwordHash: string;
  readonly level: number;
  readonly elo: number;
  readonly role: UserRole;
  readonly subscription: SubscriptionType;
  readonly isActive: boolean;
  readonly isVerified: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastLoginAt?: Date;
}

// Interface pour inscription
export interface RegisterRequest {
  readonly email: Email;
  readonly password: string;
  readonly username: string;
}

// Interface pour connexion
export interface LoginRequest {
  readonly email: Email;
  readonly password: string;
}

// Interface réponse authentification
export interface AuthResponse {
  readonly user: Omit<User, 'passwordHash'>;
  readonly token: Token;
  readonly refreshToken: Token;
  readonly expiresIn: number; // en secondes
}

// Interface payload JWT
export interface JwtPayload {
  readonly userId: UserId;
  readonly email: Email;
  readonly role: UserRole;
  readonly iat: number;
  readonly exp: number;
}

// Interface refresh token
export interface RefreshTokenRequest {
  readonly refreshToken: Token;
}

// Interface mise à jour profil
export interface UpdateProfileRequest {
  readonly username?: string;
  readonly currentPassword?: string;
  readonly newPassword?: string;
}

// Interface profil public
export interface PublicProfile {
  readonly id: UserId;
  readonly username: string;
  readonly level: number;
  readonly elo: number;
  readonly subscription: SubscriptionType;
  readonly gamesPlayed: number;
  readonly winRate: number;
  readonly createdAt: Date;
}
