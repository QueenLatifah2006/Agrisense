import { Router } from 'express';
import { 
  getCrops, 
  createCrop, 
  updateCrop, 
  toggleBlockCrop, 
  getCropLogs,
  getFarmerNotes,
  createFarmerNote,
  validateFarmerNote,
  rejectFarmerNote
} from '../controllers/cropController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getCrops);
router.post('/', createCrop);
router.put('/:id', updateCrop);
router.put('/:id/block', toggleBlockCrop);
router.get('/:id/logs', getCropLogs);

router.get('/notes/all', getFarmerNotes);
router.post('/notes/submit', createFarmerNote);
router.put('/notes/:id/validate', validateFarmerNote);
router.put('/notes/:id/reject', rejectFarmerNote);

export default router;
