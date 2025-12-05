import { parse, validate } from '@telegram-apps/init-data-node';
import { env } from '../config/env.js';

// ----------------------------
// Custom Error
// ----------------------------
export class TelegramAuthError extends Error {
  constructor(message, debug = null) {
    super(message);
    this.name = 'TelegramAuthError';
    this.status = 401;
    this.debug = debug;
  }
}

const buildDebugPayload = (base, extra = {}) =>
  env.ENABLE_DEBUG_ERRORS ? { ...base, ...extra } : null;

// ----------------------------
// Main validation function
// ----------------------------

export const verifyTelegramAuth = (initDataString, botToken = env.BOT_TOKEN) => {
  if (!initDataString) {
    throw new TelegramAuthError('initData is required');
  }

  let initData;
  try {
    initData = parse(initDataString);
    console.log(initData);
  } catch (err) {
    throw new TelegramAuthError(
      'Invalid initData format',
      buildDebugPayload({ initDataString, error: err.message })
    );
  }

  try {
    validate(initData, botToken);
  } catch (err) {
    throw new TelegramAuthError(
      'Signature mismatch',
      buildDebugPayload({
        initDataString,
        error: err.message,
      })
    );
  }

  // Проверка срока действия (библиотека не ограничивает TTL)
  const nowSec = Math.floor(Date.now() / 1000);
  if (!initData.auth_date || nowSec - initData.auth_date > env.TELEGRAM_AUTH_TTL) {
    throw new TelegramAuthError('Auth data expired');
  }

  if (!initData.user) {
    throw new TelegramAuthError('user field missing');
  }

  const user = initData.user;

  return {
    telegramUser: {
      id: Number(user.id),
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      username: user.username || '',
      isPremium: !!user.is_premium,
      languageCode: user.language_code || 'en',
      photoUrl: user.photo_url || '',
      allowsWriteToPm: !!user.allows_write_to_pm,
    },
    authDate: initData.auth_date * 1000,
    queryId: initData.query_id || undefined,
  };
};
