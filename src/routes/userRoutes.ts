import { Router } from 'express';
import { getAllUsers, getUserById, register, deleteUser, updateUser, getUserBots, login } from '../controllers/userController';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

router.get('/', authenticate, getAllUsers);
router.get('/:id', authenticate, getUserById);
router.delete('/:id', authenticate, deleteUser);
router.put('/:id', authenticate, updateUser);
router.get('/:id/bots', authenticate, getUserBots);

router.post('/register', register);
router.post('/login', login);

export default router;