import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';

import submitHandler from './api/submit.js';
import signHandler from './api/sign.js';
import sendContractHandler from './api/send-contract.js';
import listHandler from './api/list.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Parse JSON and large base64 payloads (files uploaded as base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// Serve built frontend (dist/) for all other routes (SPA fallback)
const distPath = join(__dirname, 'dist');
app.use(express.static(distPath));
// Используем именованный параметр со звездочкой для захвата всех путей
app.get('(.*)', (req, res) => {
  const distPath = join(__dirname, 'dist');
  if (!req.path.startsWith('/api/')) {
    res.sendFile(join(distPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'API route not found' });
  }
});

const PORT = process.env.PORT || 3000;
createServer(app).listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
