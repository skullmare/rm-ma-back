import { Router } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import { getProfile } from '../services/n8nClient.js';

const router = Router();

router.get('/', authGuard, async (req, res, next) => {
  try {
    const chatId = req.user.telegramId || req.user.id;
    const n8nProfile = await getProfile(chatId);

    // Если n8n вернул ошибку или пропустил запрос, возвращаем базовый профиль
    if (n8nProfile.status === 'error' || n8nProfile.status === 'skipped') {
      const fallbackProfile = {
        userId: req.user.id,
        chat_id: String(chatId),
        tariff: 'free',
        tokensRemaining: 0,
        lastPaymentAt: null,
      };
      return res.json({ profile: fallbackProfile });
    }

    // Возвращаем данные профиля из n8n
    return res.json({ profile: n8nProfile });
  } catch (error) {
    return next(error);
  }
});

export default router;




