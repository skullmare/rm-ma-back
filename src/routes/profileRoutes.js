import { Router } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import { getProfile } from '../services/n8nClient.js';

const router = Router();

router.get('/', authGuard, async (req, res, next) => {
  try {
    const chatId = req.user.telegramId || req.user.id;
    
    if (!chatId) {
      console.error('Profile route: chat_id not found in req.user:', req.user);
      return res.status(400).json({ message: 'User chat_id not found' });
    }

    console.log('Profile route: fetching profile for chat_id:', chatId);
    const n8nProfile = await getProfile(chatId);
    console.log('Profile route: n8n response:', JSON.stringify(n8nProfile, null, 2));

    // Если n8n вернул ошибку или пропустил запрос, возвращаем базовый профиль
    if (n8nProfile && (n8nProfile.status === 'error' || n8nProfile.status === 'skipped')) {
      console.log('Profile route: using fallback profile');
      const fallbackProfile = {
        userId: req.user.id,
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

export default router;




