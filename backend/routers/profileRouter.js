import express from 'express';
import {
  getProfile,
  updateProfile,
  uploadProfileImage,
  getProfileImage,
  deleteProfile,
  uploadMiddleware
} from '../controllers/profileController.js';
import authMiddleware from "../middleware/auth.js"

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get current user's profile
router.get('/', getProfile);

// Update current user's profile
router.put('/', updateProfile);

// Upload profile image
router.post('/image', uploadMiddleware, uploadProfileImage);

// Get profile image by filename
router.get('/image/:filename', getProfileImage);

// Delete current user's profile
router.delete('/', deleteProfile);

export default router;