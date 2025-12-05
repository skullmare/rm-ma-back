import 'dotenv/config';

const parseBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  return ['1', 'true', 'TRUE', 'yes', 'YES', 'on', 'ON'].includes(value);
};

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const env = Object.freeze({
  PORT: parseNumber(process.env.PORT, 4000),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
  BOT_TOKEN: process.env.BOT_TOKEN,
  N8N_BASE_URL: process.env.N8N_BASE_URL,
  N8N_API_KEY: process.env.N8N_API_KEY,
});
