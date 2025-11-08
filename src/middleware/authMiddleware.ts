// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Interface pour étendre Request
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

// Middleware d'authentification
export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    // Extraire le token
    const token = authHeader.substring(7); // Supprimer "Bearer "

    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Récupérer l'utilisateur depuis la base
    const user = await prisma.player.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token. User not found.'
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token.'
    });
  }
};
