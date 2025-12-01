import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { TelegramAuthError } from './services/telegramAuth.js';
import paymentRouter from './routes/paymentRouter.js';

const app = express();

// ВОТ ЭТИ ДВЕ СТРОЧКИ — ОБЕ НУЖНЫ!
app.use(express.json());                     // для JSON тел
app.use(express.urlencoded({ extended: true }));  // ЭТО РЕШЕНИЕ ТВОЕЙ ПРОБЛЕМЫ

app.use(
  cors({
    origin: env.CLIENT_ORIGIN === '*' ? undefined : env.CLIENT_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());

app.get('/health', (_req, res) =>
  res.json({
    status: 'ok',
    timestamp: Date.now(),
  })
);

app.use('/api/auth/telegram', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/payments', paymentRouter);

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof TelegramAuthError) {
    return res.status(err.status).json({
      message: err.message,
      ...(env.ENABLE_DEBUG_ERRORS && err.debug ? { debug: err.debug } : {}),
    });
  }

  const status = err.status ?? 500;
  console.error(err);
  return res.status(status).json({
    message: err.message ?? 'Server error',
    ...(env.ENABLE_DEBUG_ERRORS ? { debug: err.stack } : {}),
  });
});

app.listen(env.PORT, () => {
  console.log(`API listening on port ${env.PORT}`);
});


