import dotenv from 'dotenv';

dotenv.config();

const requiredKeys = ['BOT_TOKEN', 'JWT_SECRET'];
const missing = requiredKeys.filter((key) => !process.env[key]);

if (missing.length) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}`
  );
}

export const env = Object.freeze({
  PORT: 4000,
  CLIENT_ORIGIN: 'https://rm-ma-front-ivanostapchuk.amvera.io',
  BOT_TOKEN: '8558968621:AAGGhZTBDGuGcMhkoNC234qLG3XnZb2Le7A',
  JWT_SECRET: '90139791492bc815bbefde539ab9d8bbecfdfbc0d97efae22beb158f811a28ea',
  N8N_BASE_URL: 'https://n8n-assistant-ivanostapchuk.amvera.io/webhook',
  N8N_API_KEY: '',
  TELEGRAM_AUTH_TTL: 86400,
  ENABLE_DEBUG_ERRORS: true,
});


