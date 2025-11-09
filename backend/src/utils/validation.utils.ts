/**
 * Utilitaires de validation - Zod schemas
 */

import { z } from 'zod';
import { GameMode, Difficulty, AnalysisType } from '../types';

// Schémas de validation
export const RegisterSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  username: z.string()
    .min(3, 'Le pseudo doit contenir au moins 3 caractères')
    .max(20, 'Le pseudo ne peut pas dépasser 20 caractères')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Le pseudo ne peut contenir que des lettres, chiffres, _ et -')
});

export const LoginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis')
});

export const CreateGameSchema = z.object({
  mode: z.nativeEnum(GameMode),
  difficulty: z.nativeEnum(Difficulty).optional(),
  isRanked: z.boolean(),
  timeLimit: z.number().int().min(60).max(3600).optional() // 1 minute à 1 heure
});

export const MakeMoveSchema = z.object({
  from: z.number().int().min(0).max(25),
  to: z.number().int().min(0).max(25),
  diceValue: z.number().int().min(1).max(6)
});

export const AnalyzeRequestSchema = z.object({
  boardState: z.string().min(1, 'L\'état du plateau est requis'),
  dice: z.tuple([z.number().int().min(1).max(6), z.number().int().min(1).max(6)]),
  move: z.string().optional(),
  analysisType: z.nativeEnum(AnalysisType),
  playerColor: z.enum(['WHITE', 'BLACK'])
});

export const UpdateProfileSchema = z.object({
  username: z.string()
    .min(3, 'Le pseudo doit contenir au moins 3 caractères')
    .max(20, 'Le pseudo ne peut pas dépasser 20 caractères')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Le pseudo ne peut contenir que des lettres, chiffres, _ et -')
    .optional(),
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis').optional(),
  newPassword: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre')
    .optional()
}).refine((data) => {
  // Si nouveau mot de passe, l'ancien est requis
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: 'Le mot de passe actuel est requis pour en définir un nouveau',
  path: ['currentPassword']
});

// Types inférés depuis les schémas
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateGameInput = z.infer<typeof CreateGameSchema>;
export type MakeMoveInput = z.infer<typeof MakeMoveSchema>;
export type AnalyzeRequestInput = z.infer<typeof AnalyzeRequestSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

// Classe de validation utilitaire
export class ValidationUtils {
  /**
   * Validation et transformation sécurisée
   */
  public static validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const message = error.issues.map((e: z.ZodIssue) => e.message).join(', ');
        throw new Error(`Validation failed: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Validation async (pour les validations complexes)
   */
  public static async validateAsync<T>(
    schema: z.ZodSchema<T>, 
    data: unknown
  ): Promise<T> {
    try {
      return await schema.parseAsync(data);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const message = error.issues.map((e: z.ZodIssue) => e.message).join(', ');
        throw new Error(`Validation failed: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Validation partielle (ne retourne que les erreurs)
   */
  public static validatePartial<T>(schema: z.ZodSchema<T>, data: unknown): { 
    isValid: boolean; 
    errors: string[]; 
    data?: T;
  } {
    try {
      const parsed = schema.parse(data);
      return { isValid: true, errors: [], data: parsed };
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((e: z.ZodIssue) => e.message);
        return { isValid: false, errors };
      }
      return { isValid: false, errors: ['Validation error'] };
    }
  }
}
