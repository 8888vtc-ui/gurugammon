/**
 * Utilitaires de sécurité - Sanitization et protections
 */

import crypto from 'crypto';
import { Logger } from './logger.utils';

export class SecurityUtils {
  /**
   * Hash sécurisé des mots de passe
   */
  public static async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Vérification du mot de passe
   */
  public static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const [salt, hash] = hashedPassword.split(':');
      if (!salt || !hash) return false;
      
      const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
      return hash === verifyHash;
    } catch (error) {
      Logger.error('Password verification failed', undefined, { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  /**
   * Génération de token sécurisé
   */
  public static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Sanitization des entrées utilisateur
   */
  public static sanitizeInput(input: string): string {
    if (!input) return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 1000); // Limit length
  }

  /**
   * Validation d'email avec vérification DNS optionnelle
   */
  public static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    
    // Vérifications supplémentaires
    const parts = email.split('@');
    const localPart = parts[0];
    const domain = parts[1];
    
    if (!localPart || !domain) return false;
    
    // Pas de points consécutifs
    if (localPart.includes('..') || domain.includes('..')) return false;
    
    // Pas de caractères dangereux
    if (/[<>:"\\|?*]/.test(email)) return false;
    
    return true;
  }

  /**
   * Validation de force de mot de passe
   */
  public static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number; // 0-100
  } {
    const errors: string[] = [];
    let score = 0;

    // Longueur
    if (password.length >= 8) score += 20;
    else errors.push('Au moins 8 caractères');

    if (password.length >= 12) score += 10;

    // Complexité
    if (/[a-z]/.test(password)) score += 15;
    else errors.push('Au moins une minuscule');

    if (/[A-Z]/.test(password)) score += 15;
    else errors.push('Au moins une majuscule');

    if (/\d/.test(password)) score += 15;
    else errors.push('Au moins un chiffre');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;
    else errors.push('Au moins un caractère spécial');

    // Bonus pour longueur supplémentaire
    if (password.length >= 16) score += 10;

    // Pénalités pour patterns faibles
    if (/(.)\1{2,}/.test(password)) { // Caractères répétés
      score -= 10;
      errors.push('Pas de caractères répétés');
    }

    if (/123|abc|qwe/i.test(password)) { // Séquences communes
      score -= 10;
      errors.push('Pas de séquences communes');
    }

    return {
      isValid: errors.length === 0 && score >= 60,
      errors,
      score: Math.max(0, Math.min(100, score))
    };
  }

  /**
   * Génération d'ID sécurisé
   */
  public static generateSecureId(): string {
    return crypto.randomUUID();
  }

  /**
   * Vérification de timeout pour les opérations
   */
  public static createTimeoutPromise<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs);
    });

    return Promise.race([promise, timeout]);
  }

  /**
   * Validation des noms de fichiers
   */
  public static isValidFileName(fileName: string): boolean {
    // Pas de path traversal
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return false;
    }
    
    // Pas de caractères dangereux
    if (/[<>:"|?*]/.test(fileName)) {
      return false;
    }
    
    // Extension autorisées
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasAllowedExtension = allowedExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    
    return hasAllowedExtension && fileName.length <= 255;
  }

  /**
   * Rate limiting par utilisateur (en mémoire)
   */
  private static userRateLimits = new Map<string, { count: number; resetTime: number }>();

  public static checkUserRateLimit(userId: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    let record = this.userRateLimits.get(userId);
    
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      this.userRateLimits.set(userId, record);
      return true;
    }
    
    if (record.count >= maxRequests) {
      return false;
    }
    
    record.count++;
    return true;
  }
}
