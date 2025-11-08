// src/controllers/authController.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Inscription
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Validation basique
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email and password are required'
      });
    }

    // Vérifier si l'utilisateur existe
    const existingPlayer = await prisma.player.findUnique({
      where: { email }
    });

    if (existingPlayer) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const player = await prisma.player.create({
      data: { name, email, password: hashedPassword }
    });

    // Générer token
    const token = jwt.sign(
      { userId: player.id, email: player.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: player.id,
          name: player.name,
          email: player.email
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
};

// Connexion
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation basique
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Trouver l'utilisateur
    const player = await prisma.player.findUnique({
      where: { email }
    });

    if (!player || !player.password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, player.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Générer token
    const token = jwt.sign(
      { userId: player.id, email: player.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: player.id,
          name: player.name,
          email: player.email
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
};

// Logout (côté client - suppression du token)
export const logout = async (req: Request, res: Response) => {
  // Dans une implémentation simple, le logout est géré côté client
  // en supprimant le token stocké localement
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};
