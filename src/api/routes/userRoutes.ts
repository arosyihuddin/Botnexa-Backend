import { Router } from 'express';
import {
    getAllUsers,
    getUserById,
    register,
    deleteUser,
    updateUser,
    getUserBots,
    // login, 
    verifyToken,
    getProfile,
    updateProfile,
    // changePassword,
    updatePreferences
} from '../../controllers/userController';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

// Public routes
// router.post('/register', register);
// router.post('/login', login);
router.get('/verify', authenticate, verifyToken);

// Protected routes - Profile & Settings
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
// router.put('/password', authenticate, changePassword);
router.put('/preferences', authenticate, updatePreferences);

// Protected routes - Admin
router.get('/', authenticate, getAllUsers);
router.get('/:id', authenticate, getUserById);
router.delete('/:id', authenticate, deleteUser);
router.put('/:id', authenticate, updateUser);
router.get('/:id/bots', authenticate, getUserBots);

export default router;