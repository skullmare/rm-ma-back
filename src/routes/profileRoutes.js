import { Router } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import { fetchProfile } from '../services/n8nClient.js';

const router = Router();

router.get('/', authGuard, async (req, res, next) => {
  try {
    const profile = await fetchProfile(req.user);
    return res.json({ user: req.user, profile });
  } catch (error) {
    return next(error);
  }
});

export default router;




