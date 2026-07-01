import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, signup, getMe, updateMe, forgotPassword, verifyCode, resetPassword, getAllUsers, adminCreateUser, adminToggleBlockUser, adminUpdateUser } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 3 * 60 * 1000, // 3 minutes
  max: 3, // Limite chaque IP à 3 requêtes de connexion par fenêtre
  message: { message: 'Trop de tentatives de connexion depuis cette IP, veuillez réessayer après 3 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', authLimiter, login);
router.post('/signup', authLimiter, signup);

router.post('/forgot-password', forgotPassword);
router.post('/verify-code', verifyCode);
router.post('/reset-password', resetPassword);

router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, updateMe);

router.get('/users', authenticateToken, getAllUsers);
router.post('/users', authenticateToken, adminCreateUser);
router.put('/users/:id', authenticateToken, adminUpdateUser);
router.put('/users/:id/block', authenticateToken, adminToggleBlockUser);

export default router;
