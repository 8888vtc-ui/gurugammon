/**
 * Configuration JWT - Gestion des tokens
 */

import jwt, { JwtPayload as JwtPayloadType } from 'jsonwebtoken';
import { JwtPayload, Token, UserId, UserRole } from '../types';
import { EnvConfig } from './env.config';

// Export des types pour utilisation externe
export type { JwtPayload, Token } from '../types';

export interface JwtTokens {
  readonly accessToken: Token;
  readonly refreshToken: Token;
}

export class JwtConfig {
  private static readonly ACCESS_TOKEN_EXPIRES_IN = '15m';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = '7d';

  /**
   * Génération des tokens pour un utilisateur
   */
  public static generateTokens(userId: UserId, email: string, role: UserRole): JwtTokens {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      userId,
      email,
      role
    };

    const accessToken = jwt.sign(payload, EnvConfig.get().JWT_SECRET, {
      expiresIn: JwtConfig.ACCESS_TOKEN_EXPIRES_IN,
      issuer: 'gammonguru',
      audience: 'gammonguru-users'
    });

    const refreshToken = jwt.sign(payload, EnvConfig.get().JWT_SECRET, {
      expiresIn: JwtConfig.REFRESH_TOKEN_EXPIRES_IN,
      issuer: 'gammonguru',
      audience: 'gammonguru-refresh'
    });

    return {
      accessToken: (accessToken as unknown) as Token,
      refreshToken: (refreshToken as unknown) as Token
    };
  }

  /**
   * Validation d'un token
   */
  public static validateToken(token: Token): JwtPayload {
    try {
      const decoded = jwt.verify((token as unknown) as string, EnvConfig.get().JWT_SECRET, {
        issuer: 'gammonguru',
        audience: 'gammonguru-users'
      }) as JwtPayloadType;

      return decoded as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        throw new Error('Token validation failed');
      }
    }
  }

  /**
   * Validation refresh token
   */
  public static validateRefreshToken(token: Token): JwtPayload {
    try {
      const decoded = jwt.verify((token as unknown) as string, EnvConfig.get().JWT_SECRET, {
        issuer: 'gammonguru',
        audience: 'gammonguru-refresh'
      }) as JwtPayloadType;

      return decoded as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      } else {
        throw new Error('Refresh token validation failed');
      }
    }
  }

  /**
   * Extraction du payload sans validation (pour les logs)
   */
  public static decodeToken(token: Token): JwtPayload | null {
    try {
      const decoded = jwt.decode((token as unknown) as string) as JwtPayloadType;
      return decoded as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Vérification si un token expire bientôt (dans les 5 prochaines minutes)
   */
  public static isTokenExpiringSoon(token: Token): boolean {
    const decoded = JwtConfig.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;
    
    return decoded.exp - now < fiveMinutes;
  }
}
