import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function getScriptUrl() {
  if (process.env.GOOGLE_SCRIPT_URL) return process.env.GOOGLE_SCRIPT_URL;
  if (process.env.VITE_GOOGLE_SCRIPT_URL) return process.env.VITE_GOOGLE_SCRIPT_URL;
  const candidates = [
    join(process.cwd(), 'public', 'config.json'),
    join(process.cwd(), 'config.json'),
    join(process.cwd(), 'dist', 'config.json'),
    join(process.cwd(), 'admin', 'public', 'config.json')
  ];

  for (const configPath of candidates) {
    if (!existsSync(configPath)) continue;
    const raw = readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed.VITE_GOOGLE_SCRIPT_URL) return parsed.VITE_GOOGLE_SCRIPT_URL;
  }

  return '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Only POST is allowed' });
    return;
  }

  try {
    const scriptUrl = getScriptUrl();
    if (!scriptUrl) {
      res.status(500).json({ success: false, error: 'Google Script URL not configured' });
      return;
    }

    let payload = req.body || {};
    if (payload && payload.data && typeof payload.data === 'string') {
      payload = JSON.parse(payload.data);
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    const text = await response.text();
    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}
