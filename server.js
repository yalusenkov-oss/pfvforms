import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';

import submitHandler from './api/submit.js';
import signHandler from './api/sign.js';
import sendContractHandler from './api/send-contract.js';
import listHandler from './api/list.js';
import paymentCreateHandler from './api/payment/create.js';
import paymentStatusHandler from './api/payment/status.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Parse JSON and large base64 payloads (files uploaded as base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Редирект с www на основной домен
app.use((req, res, next) => {
  const host = req.headers.host || '';
  if (host.startsWith('www.')) {
    return res.redirect(301, `https://pfvmusic.digital${req.url}`);
  }
  next();
});

// Wrap a Vercel-style handler (req, res) for Express
function vercelHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: String(err) });
      }
    }
  };
}

// API routes
app.all('/api/submit', vercelHandler(submitHandler));
app.all('/api/sign', vercelHandler(signHandler));
app.all('/api/send-contract', vercelHandler(sendContractHandler));
app.all('/api/list', vercelHandler(listHandler));
app.all('/api/payment/create', vercelHandler(paymentCreateHandler));
app.all('/api/payment/status', vercelHandler(paymentStatusHandler));

// Serve built frontend (dist/) for all other routes (SPA fallback)
const distPath = join(__dirname, 'dist');
app.use(express.static(distPath));
// Правильный SPA-fallback для Express 5 / Node 24
app.use((req, res) => {
  // Проверка на API запросы
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'API route not found' });
  }
  // Отправляем index.html для всех остальных путей
  res.sendFile(join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
createServer(app).listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
