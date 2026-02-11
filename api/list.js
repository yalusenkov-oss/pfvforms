import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz7FmVZm6C4d8QecFslgeSRCCmi4zSi-H8YuA1dIEVE6Nj4KZllOsbA8JSUFf03epdfvQ/exec';

function getScriptUrl() {
  if (process.env.GOOGLE_SCRIPT_URL) return process.env.GOOGLE_SCRIPT_URL;
  const candidates = [
    join(process.cwd(), 'public', 'config.json'),
    join(process.cwd(), 'config.json')
  ];

  for (const configPath of candidates) {
    if (!existsSync(configPath)) continue;
    const raw = readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed.VITE_GOOGLE_SCRIPT_URL) return parsed.VITE_GOOGLE_SCRIPT_URL;
  }

  if (DEFAULT_SCRIPT_URL) {
    console.warn('[api/list] Falling back to DEFAULT_SCRIPT_URL. config.json not found.');
    return DEFAULT_SCRIPT_URL;
  }

  return '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
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
