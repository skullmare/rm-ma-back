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

const fallbackProfile = (user) => ({
  userId: user.id,
  tariff: 'free',
  tokensRemaining: 0,
  lastPaymentAt: null,
});

const fallbackHistory = (agent) => ({
  agent,
  items: [],
});

export const fetchProfile = async (user) => {
  if (!client) {
    return fallbackProfile(user);
  }

  const { data } = await client.get('/profile', {
    params: { userId: user.id, telegramId: user.telegramId },
  });
  return data;
};

export const fetchChatHistory = async (user, params = {}) => {
  if (!client) {
    return fallbackHistory(params.agent);
  }

  const { data } = await client.get('/chats/history', {
    params: {
      userId: user.id,
      telegramId: user.telegramId,
      limit: params.limit ?? 20,
      agent: params.agent,
    },
  });
  return data;
};

export const sendChatMessage = async (user, payload) => {
  if (!client) {
    return {
      status: 'queued',
      agent: payload.agent,
      echo: payload.message,
    };
  }

  const { data } = await client.post('/chats/send', {
    userId: user.id,
    telegramId: user.telegramId,
    message: payload.message,
    agent: payload.agent,
    meta: payload.meta ?? {},
  });
  return data;
};

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
    const { data } = await client.post('/webhook/profile/init', payload);
    return data;
  } catch (error) {
    // Логируем ошибку, но не прерываем процесс авторизации
    console.error('Failed to initialize profile in n8n:', error.message);
    return { status: 'error', error: error.message };
  }
};


