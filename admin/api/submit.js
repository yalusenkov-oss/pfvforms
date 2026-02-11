import { readFileSync } from 'fs';
import { join } from 'path';

function getScriptUrl() {
  if (process.env.GOOGLE_SCRIPT_URL) return process.env.GOOGLE_SCRIPT_URL;
  const configPath = join(process.cwd(), 'public', 'config.json');
  const raw = readFileSync(configPath, 'utf8');
  const parsed = JSON.parse(raw);
  return parsed.VITE_GOOGLE_SCRIPT_URL || '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
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

    let payload = req.body || {};
    if (req.method === 'GET') payload = req.query || {};
    if (payload && payload.data && typeof payload.data === 'string') {
      payload = JSON.parse(payload.data);
    }

    const url = `${scriptUrl}${scriptUrl.includes('?') ? '&' : '?'}data=${encodeURIComponent(JSON.stringify(payload))}`;
    const response = await fetch(url, { method: 'GET', redirect: 'follow' });
    const text = await response.text();
    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}
