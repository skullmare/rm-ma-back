import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const DEFAULT_EXPIRY = '1d';

export const issueToken = (claims, options = {}) =>
  jwt.sign(claims, env.JWT_SECRET, {
    expiresIn: DEFAULT_EXPIRY,
    ...options,
  });

export const verifyToken = (token) => jwt.verify(token, env.JWT_SECRET);


