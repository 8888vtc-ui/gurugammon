// src/routes/players.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/players
router.get('/', async (req, res) => {
  try {
    const players = await prisma.player.findMany();
    res.json({
      success: true,
      data: players
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch players'
    });
  }
});

// POST /api/players
router.post('/', async (req, res) => {
  const { name, email } = req.body;
  
  try {
    const newPlayer = await prisma.player.create({
      data: { name, email }
    });
    
    res.status(201).json({
      success: true,
      data: newPlayer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to create player'
    });
  }
});

// DELETE /api/players/:id
router.delete('/:id', async (req, res) => {
  const playerId = parseInt(req.params.id);
  
  try {
    const deletedPlayer = await prisma.player.delete({
      where: { id: playerId }
    });
    
    res.json({
      success: true,
      data: deletedPlayer
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: 'Player not found'
    });
  }
});

export default router;
