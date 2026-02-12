import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz7FmVZm6C4d8QecFslgeSRCCmi4zSi-H8YuA1dIEVE6Nj4KZllOsbA8JSUFf03epdfvQ/exec';

function readConfigValue(key) {
  if (process.env[key]) return process.env[key];
  const candidates = [
    join(process.cwd(), 'public', 'config.json'),
    join(process.cwd(), 'config.json')
  ];

  for (const configPath of candidates) {
    if (!existsSync(configPath)) continue;
    const raw = readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed[key] != null) return parsed[key];
  }

  return null;
}

function getScriptUrl() {
  const url = readConfigValue('VITE_GOOGLE_SCRIPT_URL');
  if (url) return url;
  if (DEFAULT_SCRIPT_URL) {
    console.warn('[api/sign] Falling back to DEFAULT_SCRIPT_URL. config.json not found.');
    return DEFAULT_SCRIPT_URL;
  }
  return '';
}

function getSignBaseUrl(req) {
  const configured = readConfigValue('VITE_SIGN_BASE_URL');
  if (configured) return String(configured).replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  return host ? `${proto}://${host}` : '';
}

function getSignExpiresDays() {
  const raw = readConfigValue('VITE_SIGN_EXPIRES_DAYS');
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return 7;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Only GET/POST is allowed' });
    return;
  }

  try {
    const scriptUrl = getScriptUrl();
    if (!scriptUrl) {
      res.status(500).json({ success: false, error: 'Google Script URL not configured' });
      return;
    }

    let payload = req.method === 'GET' ? (req.query || {}) : (req.body || {});
    if (payload && payload.data && typeof payload.data === 'string') {
      payload = JSON.parse(payload.data);
    }

    const action = payload.action || '';
    if (!action) {
      res.status(400).json({ success: false, error: 'Missing action' });
      return;
    }

    const signBaseUrl = getSignBaseUrl(req);
    const signExpiresDays = getSignExpiresDays();

    let scriptPayload = payload;
    if (action === 'create') {
      scriptPayload = {
        action: 'sign_create',
        contractNumber: payload.contractNumber,
        row: payload.row,
        signBaseUrl,
        signExpiresDays
      };
    } else if (action === 'get') {
      scriptPayload = { action: 'sign_get', token: payload.token };
    } else if (action === 'submit') {
      scriptPayload = { action: 'sign_submit', token: payload.token, signature: payload.signature };
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scriptPayload),
      redirect: 'follow'
    });

    const text = await response.text();
    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}
