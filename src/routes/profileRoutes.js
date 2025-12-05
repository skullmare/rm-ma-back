import { Router } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import { getProfile, updateProfession } from '../services/n8nClient.js';

const router = Router();

const resolveChatId = (req) =>
  req.chatId ||
  req.user?.chatId ||
  req.user?.telegramId ||
  req.user?.id ||
  req.auth?.telegramUser?.id;

router.get('/', authGuard, async (req, res, next) => {
  try {
    const chatId = resolveChatId(req);
    
    if (!chatId) {
      console.error('Profile route: chat_id not found in req.user:', req.user);
      return res.status(400).json({ message: 'User chat_id not found' });
    }

    const n8nProfile = await getProfile(chatId);

    // Если n8n вернул ошибку или пропустил запрос, возвращаем базовый профиль
    if (n8nProfile && (n8nProfile.status === 'error' || n8nProfile.status === 'skipped')) {
      const fallbackProfile = {
        userId: req.user?.id || Number(chatId),
        chat_id: String(chatId),
        tariff: 'free',
        tokensRemaining: 0,
        lastPaymentAt: null,
      };
      return res.json({ profile: fallbackProfile });
    }

    // Если n8n вернул успешный ответ с данными профиля (объект без поля status)
    // Возвращаем данные профиля из n8n
    return res.json({ profile: n8nProfile });
  } catch (error) {
    console.error('Error in profile route:', error);
    console.error('Error stack:', error.stack);
    return next(error);
  }
});

router.put('/profession', authGuard, async (req, res, next) => {
  try {
    const { profession } = req.body || {};
    const chatId = resolveChatId(req);

    if (!chatId) {
      return res.status(400).json({ message: 'User chat_id not found' });
    }

    const result = await updateProfession(chatId, profession);

    // Если n8n вернул ошибку или пропустил запрос
    if (result && (result.status === 'error' || result.status === 'skipped')) {
      return res.status(500).json({ 
        message: result.error || result.reason || 'Failed to update profession' 
      });
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in profession update route:', error);
    console.error('Error stack:', error.stack);
    return next(error);
  }
});

export default router;


