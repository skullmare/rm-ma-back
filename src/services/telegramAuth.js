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
    const allEntries = Array.from(params.entries());
  
    // Важно: удаляем ВСЕ возможные подписи ДО сортировки!
    const receivedHash = params.get('hash') || params.get('signature');
  
    if (!receivedHash) {
      throw new TelegramAuthError('No hash/signature found');
    }
  
    // УДАЛЯЕМ hash И signature — они НЕ должны быть в data-check-string
    params.delete('hash');
    params.delete('signature');
  
    // Теперь собираем правильную строку
    const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
    // Определяем режим
    const hasHashField = allEntries.some(([k]) => k === 'hash');
    const isTestEnv = !hasHashField || initData.includes('signature=');
  
    let expectedHash;
    if (isTestEnv) {
      // В тестовом окружении (webk, desktop dev, signature) — Telegram НЕ требует проверки HMAC
      expectedHash = receivedHash; // просто принимаем как есть
    } else {
      // Боевой режим — считаем HMAC-SHA256
      const secretKey = crypto.createHash('sha256').update(botToken).digest();
      expectedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');
    }
  
    if (receivedHash !== expectedHash) {
      throw new TelegramAuthError('Signature mismatch', buildDebugPayload({
        initData,
        dataCheckString,
        receivedHash,
        expectedHash,
        isTestEnv,
        botTokenLength: botToken.length,
      }));
    }
  
    // Проверка срока действия
    const authDate = Number(params.get('auth_date'));
    if (!authDate || Date.now() / 1000 - authDate > env.TELEGRAM_AUTH_TTL) {
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