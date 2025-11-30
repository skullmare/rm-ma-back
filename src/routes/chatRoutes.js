import { Router } from 'express';
import { authGuard } from '../middleware/authGuard.js';

const router = Router();

router.get('/history', authGuard, async (req, res, next) => {
  try {
    const agent = req.query.agent;
    if (!agent) {
      return res.status(400).json({ message: 'agent is required' });
    }

    // Заглушка: возвращаем пустую историю
    return res.json({
      agent,
      items: [],
    });
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
        .json({ message: 'message and agent is required' });
    }

    // Заглушка: возвращаем эхо-ответ
    return res.json({
      status: 'queued',
      agent,
      echo: message,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;


