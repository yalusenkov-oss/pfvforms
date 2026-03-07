import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function getScriptUrl() {
  return process.env.GOOGLE_SCRIPT_URL || process.env.VITE_GOOGLE_SCRIPT_URL || '';
}

// ═══ CORS helper ═══
const ALLOWED_ORIGINS = ['https://pfvmusic.digital', 'https://www.pfvmusic.digital'];
function getCorsOrigin(requestOrigin) {
  if (!requestOrigin) return 'https://pfvmusic.digital';
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(requestOrigin)) return requestOrigin;
  if (ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin;
  return 'https://pfvmusic.digital';
}

export default async function handler(req, res) {
  const requestOrigin = req.headers.origin || '';
  const referer = req.headers.referer || '';
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(requestOrigin));
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // ═══ Security: block direct access to promo codes ═══
  const sheet = req.query.sheet || '';
  if (sheet === 'promocodes') {
    const isAllowedOrigin = 
      requestOrigin.includes('pfvmusic.digital') || 
      requestOrigin.includes('localhost') || 
      requestOrigin.includes('127.0.0.1') ||
      referer.includes('pfvmusic.digital') || 
      referer.includes('localhost') || 
      referer.includes('127.0.0.1');
    if (!isAllowedOrigin) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
  }

  try {
    const scriptUrl = getScriptUrl();
    if (!scriptUrl) {
      res.status(500).json({ success: false, error: 'Google Script URL not configured' });
      return;
    }

    const sheet = req.query.sheet || '';
    const limit = req.query.limit || '';
    const params = new URLSearchParams();
    params.set('action', 'list');
    if (sheet) params.set('sheet', String(sheet));
    if (limit) params.set('limit', String(limit));

    const url = `${scriptUrl}${scriptUrl.includes('?') ? '&' : '?'}${params.toString()}`;
    const response = await fetch(url, { method: 'GET', redirect: 'follow' });
    const text = await response.text();
    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}
