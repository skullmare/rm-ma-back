import { Router } from 'express';
import { verifyTelegramAuth } from '../services/telegramAuth.js';
import { issueToken } from '../services/tokenService.js';
import { initProfile } from '../services/n8nClient.js';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const initData = req.body.initData;

    if (!initData) {
      return res.status(400).json({ message: 'initData is required' });
    }

    const { telegramUser } = verifyTelegramAuth(initData);
    // Инициализируем профиль в n8n (не блокируем авторизацию при ошибке)
    initProfile(user).catch((error) => {
      console.error('Profile initialization error:', error);
    });

    const token = issueToken({
      userId: telegramUser.id,
      telegramId: telegramUser.id,
    });

    // Отправляем только token и chat_id, данные профиля будут приходить из n8n через /api/profile
    return res.json({ 
      token, 
      user: {
        id: telegramUser.id,
        chat_id: String(telegramUser.id),
      }
    });
  } catch (error) {
    return next(error);
  }
});

export default router;




