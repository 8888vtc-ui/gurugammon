/**
 * Complete Authentication Routes
 * Implements all 15 auth endpoints as documented
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.final';
import { ErrorHandler } from '../middleware/error.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Apply async handler to all routes for error handling
const asyncHandler = ErrorHandler.asyncHandler;

/**
 * Authentication Routes (15 endpoints)
 */

// POST /api/auth/register - Complete user registration
router.post('/register', asyncHandler(AuthController.register));

// POST /api/auth/login - User login with JWT tokens
router.post('/login', asyncHandler(AuthController.login));

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', asyncHandler(AuthController.refresh));

// GET /api/auth/profile - Get user profile (protected)
router.get('/profile', authMiddleware, asyncHandler(AuthController.getProfile));

// PUT /api/auth/profile - Update user profile (protected)
router.put('/profile', authMiddleware, asyncHandler(AuthController.updateProfile));

// POST /api/auth/logout - Logout user (revoke refresh token)
router.post('/logout', asyncHandler(AuthController.logout));

// DELETE /api/auth/account - Deactivate user account (protected)
router.delete('/account', authMiddleware, asyncHandler(AuthController.deleteAccount));

// GET /api/auth/check-email - Check if email is available
router.get('/check-email', asyncHandler(AuthController.checkEmail));

// GET /api/auth/check-username - Check if username is available
router.get('/check-username', asyncHandler(AuthController.checkUsername));

// POST /api/auth/forgot-password - Send password reset email
router.post('/forgot-password', asyncHandler(AuthController.forgotPassword));

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', asyncHandler(AuthController.resetPassword));

// POST /api/auth/verify-email - Verify email address
router.post('/verify-email', asyncHandler(AuthController.verifyEmail));

// GET /api/auth/sessions - Get all active sessions for user (protected)
router.get('/sessions', authMiddleware, asyncHandler(AuthController.getSessions));

// DELETE /api/auth/sessions/:id - Revoke a specific session (protected)
router.delete('/sessions/:id', authMiddleware, asyncHandler(AuthController.revokeSession));

// POST /api/auth/change-password - Change password for authenticated user (protected)
router.post('/change-password', authMiddleware, asyncHandler(AuthController.changePassword));

export default router;
