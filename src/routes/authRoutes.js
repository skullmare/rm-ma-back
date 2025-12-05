import { Router } from 'express';
import { verifyTelegramAuth } from '../services/telegramAuth.js';
import { initProfile } from '../services/n8nClient.js';

const normalizeTelegramUser = (telegramUser) => ({
  ...telegramUser,
  telegramId: telegramUser.id,
  chatId: String(telegramUser.id),
});

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const initData = req.body.initData;

    if (!initData) {
      return res.status(400).json({ message: 'initData is required' });
    }

    const { telegramUser } = verifyTelegramAuth(initData);
    const user = normalizeTelegramUser(telegramUser);

    // initProfile is fire-and-forget; errors are logged but don't break auth
    initProfile(user).catch((error) => {
      console.error('Profile initialization error:', error);
    });

    return res.json({
      user: {
        id: user.id,
        chat_id: user.chatId,
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
