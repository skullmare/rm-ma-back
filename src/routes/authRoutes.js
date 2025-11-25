import { Router } from 'express';
import { verifyTelegramAuth } from '../services/telegramAuth.js';
import { issueToken } from '../services/tokenService.js';
import { syncTelegramUser } from '../repositories/userRepository.js';

const router = Router();

router.post('/login', (req, res, next) => {
  try {
    const { initData } = req.body ?? {};

    if (!initData) {
      return res.status(400).json({ message: 'initData is required' });
    }

    const { telegramUser } = verifyTelegramAuth(initData);
    const user = syncTelegramUser(telegramUser);
    const token = issueToken({
      userId: user.id,
      telegramId: user.telegramId,
    });

    return res.json({ token, user });
  } catch (error) {
    return next(error);
  }
});

export default router;


