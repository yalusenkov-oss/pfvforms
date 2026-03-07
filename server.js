import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the project root (works regardless of cwd)
dotenv.config({ path: join(__dirname, '.env') });

import express from 'express';
import { createServer } from 'http';

import submitHandler from './api/submit.js';
import signHandler from './api/sign.js';
import sendContractHandler from './api/send-contract.js';
import listHandler from './api/list.js';
import paymentCreateHandler from './api/payment/create.js';
import paymentStatusHandler from './api/payment/status.js';
import paymentWebhookHandler from './api/payment/webhook.js';
import uploadCoverHandler from './api/upload-cover.js';

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
app.all('/api/payment/webhook', vercelHandler(paymentWebhookHandler));
app.all('/api/upload-cover', vercelHandler(uploadCoverHandler));

// Proxy for Google Apps Script (avoids CORS on localhost)
app.all('/api/gas-proxy', async (req, res) => {
  try {
    const gasUrl = process.env.VITE_GOOGLE_SCRIPT_URL;
    if (!gasUrl) return res.status(500).json({ error: 'GAS URL not configured' });

    if (req.method === 'GET') {
      const params = new URLSearchParams(req.query);
      const url = `${gasUrl}?${params.toString()}`;
      const response = await fetch(url, { redirect: 'follow' });
      const text = await response.text();
      res.setHeader('Content-Type', 'application/json');
      res.status(response.ok ? 200 : response.status).send(text);
    } else {
      // POST — forward body to GAS
      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
        redirect: 'follow',
      });
      const text = await response.text();
      res.setHeader('Content-Type', 'application/json');
      res.status(response.ok ? 200 : response.status).send(text);
    }
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ═══ Security: block sensitive files from being served ═══
app.use((req, res, next) => {
  const blocked = ['/config.json', '/.env', '/.env.local', '/.gitignore'];
  if (blocked.includes(req.path) || req.path.endsWith('/config.json')) {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
});

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
