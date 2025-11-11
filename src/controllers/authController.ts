// src/controllers/authController.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../server';
import { config } from '../config';

// Use validated JWT_SECRET from config
const JWT_SECRET = config.jwtSecret!; // ! because config validates it exists

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
    const existingPlayer = await prisma.users.findUnique({
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
    const player = await prisma.users.create({
      data: {
        id: uuidv4(),
        username: name,
        email,
        password: hashedPassword
      }
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
          name: player.username,
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
    const player = await prisma.users.findUnique({
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
          name: player.username,
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
