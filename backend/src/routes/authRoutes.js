import { Router } from 'express';
import { changePassword, login, me, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();
router.post('/login', login);
router.get('/me', protect, me);
router.put('/change-password', protect, changePassword);
router.put('/change-profile', protect, upload.single('image'), updateProfile);
export default router;
