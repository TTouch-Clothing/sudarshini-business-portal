import { Router } from 'express';
import { forecast } from '../controllers/predictionController.js';
import { protect } from '../middleware/auth.js';
const router = Router();
router.get('/', protect, forecast);
export default router;
