import axios from 'axios';
import { env } from '../config/env.js';

const n8nEnabled = Boolean(env.N8N_BASE_URL);

const client = n8nEnabled
  ? axios.create({
      baseURL: env.N8N_BASE_URL,
      timeout: 5000,
      headers: { Authorization: `Bearer ${env.N8N_API_KEY}` },
    })
  : null;

export const initProfile = async (user) => {
  if (!client) {
    return { status: 'skipped', reason: 'n8n client not configured' };
  }

  // Форматируем username: добавляем @ если его нет
  const username = user.username 
    ? (user.username.startsWith('@') ? user.username : `@${user.username}`)
    : null;

  const payload = [
    {
      chat_id: String(user.telegramId || user.id),
      first_name: user.firstName || '',
      last_name: user.lastName || '',
      username: username || '',
    },
  ];

  try {
    const { data } = await client.post('/profile/init', payload);
    return data;
  } catch (error) {
    // Логируем ошибку, но не прерываем процесс авторизации
    console.error('Failed to initialize profile in n8n:', error.message);
    return { status: 'error', error: error.message };
  }
};


