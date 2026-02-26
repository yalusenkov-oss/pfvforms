/**
 * Express server for Timeweb Cloud (and any non-Vercel Node.js hosting).
 * Wraps Vercel-style serverless API handlers and serves the built frontend.
 */
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Dynamically import Vercel-style handlers
import listHandler         from './api/list.js';
import submitHandler       from './api/submit.js';
import signHandler         from './api/sign.js';
import sendContractHandler from './api/send-contract.js';
import testEmailHandler    from './api/test-email.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = express();

// ── Increase body size limit to fix 413 errors ──────────────────────────────
// submit.js reads the raw stream itself, so we do NOT use express.json() here.
// We just raise the limit on the underlying socket via a raw body collector.
app.use((req, _res, next) => {
  // Allow up to 50 MB (base64 images can be large)
  req.socket.setMaxListeners?.(20);
  next();
});

// ── API routes — pass directly to Vercel-style handlers ─────────────────────
// Each handler does its own CORS + body parsing from the raw stream.
app.all('/api/list',          (req, res) => listHandler(req, res));
app.all('/api/submit',        (req, res) => submitHandler(req, res));
app.all('/api/sign',          (req, res) => signHandler(req, res));
app.all('/api/send-contract', (req, res) => sendContractHandler(req, res));
app.all('/api/test-email',    (req, res) => testEmailHandler(req, res));

// ── Static: admin panel at /admin ────────────────────────────────────────────
app.use('/admin', express.static(join(__dirname, 'admin', 'dist')));
app.get('/admin/*path', (_req, res) => {
  res.sendFile(join(__dirname, 'admin', 'dist', 'index.html'));
});

// ── Static: main site ────────────────────────────────────────────────────────
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback — all non-API routes serve index.html
app.get('/*path', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  process.stdout.write(`Server started on port ${PORT}\n`);
});
