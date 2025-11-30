import { Router } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import { fetchChatHistory, sendChatMessage } from '../services/n8nClient.js';

const router = Router();

export default router;


