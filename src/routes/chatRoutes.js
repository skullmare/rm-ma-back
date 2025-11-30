import { Router } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import { sendAgentMessage, getAgentMessages } from '../services/n8nClient.js';

const router = Router();

// Получение истории сообщений
router.get('/history', authGuard, async (req, res, next) => {
  try {
    const chatId = req.user.telegramId || req.user.id;
    
    if (!chatId) {
      return res.status(400).json({ message: 'User chat_id not found' });
    }

    // Получаем timestamp из query параметра (опционально)
    const timestamp = req.query.timestamp || null;

    const messages = await getAgentMessages(chatId, timestamp);

    // Возвращаем сообщения в формате, который ожидает фронтенд
    return res.json({
      messages: messages,
      hasMore: messages.length > 0, // Если получили 10 сообщений, возможно есть еще
    });
  } catch (error) {
    return next(error);
  }
});

// Отправка сообщения агенту
router.post('/send', authGuard, async (req, res, next) => {
  try {
    const { message, agent } = req.body ?? {};
    const chatId = req.user.telegramId || req.user.id;

    if (!message || !agent) {
      return res
        .status(400)
        .json({ message: 'message and agent are required' });
    }

    if (!chatId) {
      return res.status(400).json({ message: 'User chat_id not found' });
    }

    const response = await sendAgentMessage(chatId, message, agent);

    // Проверяем, есть ли ошибка
    if (response.status === 'error') {
      return res.status(500).json({
        message: response.error || 'Failed to send message',
      });
    }

    // Возвращаем ответ агента
    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

export default router;


