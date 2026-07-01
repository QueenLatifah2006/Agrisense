import { Router } from 'express';
import { 
  chatWithCrew, 
  getUserChats, 
  getAllChats, 
  getChatMessages, 
  validateChat,
  rejectChat,
  fetchCrewPrices
} from '../controllers/aiController.js';
import { getDashboardStats, getAdvancedChartsData } from '../controllers/dashboardController.js';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/chat', optionalAuthenticateToken, chatWithCrew);

router.get('/chats', authenticateToken, getUserChats);
router.get('/chats/all', authenticateToken, getAllChats);
router.get('/chats/:chatId/messages', authenticateToken, getChatMessages);
router.put('/chats/:chatId/validate', authenticateToken, validateChat);
router.put('/chats/:chatId/reject', authenticateToken, rejectChat);

router.post('/prices-dataset', fetchCrewPrices);

router.get('/dashboard-stats', authenticateToken, getDashboardStats);
router.get('/advanced-charts-stats', authenticateToken, getAdvancedChartsData);

export default router;
