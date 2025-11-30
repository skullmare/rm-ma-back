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
      photo_url: user.photoUrl || '',
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

export const getProfile = async (chatId) => {
  if (!client) {
    return { status: 'skipped', reason: 'n8n client not configured' };
  }

  if (!chatId) {
    return { status: 'error', error: 'chatId is required' };
  }

  try {
    const { data } = await client.get('/profile/get', {
      params: { chat_id: String(chatId) },
    });
    
    // Если n8n вернул успешный ответ, возвращаем данные
    // n8n может вернуть объект профиля напрямую или массив с одним элементом
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    if (data && typeof data === 'object') {
      return data;
    }
    
    // Если формат неожиданный, возвращаем как есть
    return data;
  } catch (error) {
    console.error('Failed to get profile from n8n:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return { status: 'error', error: error.message };
  }
};


