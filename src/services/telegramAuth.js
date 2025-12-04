import crypto from 'crypto';
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

export const verifyTelegramAuth = (initData, botToken = env.BOT_TOKEN) => {
  if (!initData) {
    throw new TelegramAuthError('initData is required');
  }

  const params = new URLSearchParams(initData);
  // Требуем именно поле `hash`. Нельзя доверять `signature` как признак теста!
  const receivedHash = params.get('hash');

  if (!receivedHash) {
    // НИКАК нельзя принимать запросы без hash в production.
    throw new TelegramAuthError('No hash found — hash field is required');
  }

  // Удаляем подписи из набора параметров, т.к. они не должны быть в data-check-string
  params.delete('hash');
  // Если есть поле signature — удаляем чтобы оно не попало в data-check-string,
  // но не используем его как переключатель режима.
  params.delete('signature');

  // Собираем data-check-string (ключи в лексикографическом порядке)
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Всегда вычисляем ожидаемый хеш используя бот-токен (production и dev)
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // Защищённое сравнение: избегаем утечек через timing-attack.
  try {
    const receivedBuf = Buffer.from(receivedHash, 'hex');
    const expectedBuf = Buffer.from(expectedHash, 'hex');

    if (receivedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(receivedBuf, expectedBuf)) {
      throw new TelegramAuthError('Signature mismatch', buildDebugPayload({
        initData,
        dataCheckString,
        receivedHash,
        expectedHash,
        botTokenLength: botToken ? botToken.length : 0,
      }));
    }
  } catch (err) {
    // Если Buffer.from(...) выбросил ошибку (не hex) — тоже считаем это несовпадением подписи
    if (err instanceof TelegramAuthError) throw err;
    throw new TelegramAuthError('Signature mismatch (invalid hash format)', buildDebugPayload({
      initData,
      dataCheckString,
      receivedHash,
      expectedHash,
      botTokenLength: botToken ? botToken.length : 0,
      error: err.message,
    }));
  }

  // Проверка срока действия
  const authDateStr = params.get('auth_date');
  const authDate = authDateStr ? Number(authDateStr) : NaN;
  const nowSec = Math.floor(Date.now() / 1000);
  if (!authDate || Number.isNaN(authDate) || nowSec - authDate > env.TELEGRAM_AUTH_TTL) {
    throw new TelegramAuthError('Auth data expired');
  }

  // Парсим user
  const userStr = params.get('user');
  if (!userStr) throw new TelegramAuthError('user field missing');

  let user;
  try {
    user = JSON.parse(userStr);
  } catch {
    throw new TelegramAuthError('Invalid user JSON');
  }

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
    authDate: authDate * 1000,
    queryId: params.get('query_id') || undefined,
  };
};
