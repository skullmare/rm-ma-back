import { Router } from 'express';
import { authGuard } from '../middleware/authGuard.js';

const router = Router();

router.get('/', authGuard, async (req, res, next) => {
  try {
    // Заглушка: возвращаем базовый профиль
    const profile = {
      userId: req.user.id,
      tariff: 'free',
      tokensRemaining: 0,
      lastPaymentAt: null,
    };
    return res.json({ user: req.user, profile });
  } catch (error) {
    return next(error);
  }
});

export default router;




