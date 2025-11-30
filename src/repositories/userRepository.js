const users = new Map();

export const syncTelegramUser = (telegramUser) => {
  const now = new Date().toISOString();
  const existing = users.get(telegramUser.id);

  const userRecord = {
    id: telegramUser.id,
    telegramId: telegramUser.id,
    firstName: telegramUser.firstName,
    lastName: telegramUser.lastName,
    username: telegramUser.username,
    languageCode: telegramUser.languageCode,
    photoUrl: telegramUser.photoUrl,
    isPremium: telegramUser.isPremium,
    allowsWriteToPm: telegramUser.allowsWriteToPm,
    createdAt: existing?.createdAt ?? now,
    lastLoginAt: now,
  };

  users.set(telegramUser.id, userRecord);
  return userRecord;
};

export const findUserById = (userId) => users.get(userId);




