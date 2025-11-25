import { Router } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import { fetchChatHistory, sendChatMessage } from '../services/n8nClient.js';

const router = Router();

router.get('/history', authGuard, async (req, res, next) => {
  try {
    const agent = req.query.agent;
    if (!agent) {
      return res.status(400).json({ message: 'agent is required' });
    }

    const history = await fetchChatHistory(req.user, {
      limit: Number(req.query.limit ?? 20),
      agent,
    });
    return res.json(history);
  } catch (error) {
    return next(error);
  }
});

router.post('/send', authGuard, async (req, res, next) => {
  try {
    const { message, meta, agent } = req.body ?? {};

    if (!message || !agent) {
      return res
        .status(400)
        .json({ message: 'message and agent are required' });
    }

    const response = await sendChatMessage(req.user, { message, meta, agent });
    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

export default router;


