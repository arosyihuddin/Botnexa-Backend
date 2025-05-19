import express from 'express';
import {
    getBots,
    getBotById,
    createBot,
    updateBot,
    deleteBot,
    disconnectBot,
    getBotSettings,
    updateBotSettings,
    connectBot
} from '../../controllers/botController';
import { authenticate } from '../middlewares/authenticate';

const router = express.Router();

// Protected routes (require authentication)
router.use(authenticate);

// Bot CRUD operations
router.get('/', getBots);
router.get('/:id', getBotById);
router.post('/', createBot);
router.put('/:id', updateBot);
router.delete('/:id', deleteBot);

// Bot connection operations
router.post('/:id/connect', connectBot);
router.post('/:id/disconnect', disconnectBot);

// Bot settings operations
router.get('/:id/settings', getBotSettings);
router.put('/:id/settings', updateBotSettings);

export default router;
