import { verifyToken } from '../services/tokenService.js';
import { findUserById } from '../repositories/userRepository.js';

export const authGuard = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.substring(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authorization token is required' });
  }

  try {
    const payload = verifyToken(token);
    const user = findUserById(payload.userId);

    if (!user) {
      return res.status(401).json({ message: 'User session not found' });
    }

    req.auth = payload;
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};






