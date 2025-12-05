import { verifyTelegramAuth, TelegramAuthError } from '../services/telegramAuth.js';

const INIT_DATA_HEADER = 'x-telegram-init-data';

const normalizeTelegramUser = (telegramUser) => ({
  ...telegramUser,
  telegramId: telegramUser.id,
  chatId: String(telegramUser.id),
});

export const authGuard = (req, res, next) => {
  const initData =
    req.get(INIT_DATA_HEADER) ||
    req.body?.initData ||
    req.query?.initData;

  if (!initData) {
    return res
      .status(401)
      .json({ message: 'Telegram initData header is required' });
  }

  try {
    const { telegramUser, authDate, queryId } = verifyTelegramAuth(initData);
    const user = normalizeTelegramUser(telegramUser);

    req.auth = { telegramUser, authDate, queryId };
    req.user = user;
    req.chatId = user.chatId;

    return next();
  } catch (error) {
    if (error instanceof TelegramAuthError) {
      return res.status(error.status).json({ message: error.message });
    }

    console.error('AuthGuard error:', error);
    return res.status(500).json({ message: 'Failed to authorize request' });
  }
};






