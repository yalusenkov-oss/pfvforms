import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { sendContractEmail } from './_email.js';

function readConfigValue(key) {
  if (process.env[key]) return process.env[key];
  if (key === 'VITE_GOOGLE_SCRIPT_URL' && process.env.GOOGLE_SCRIPT_URL) {
    return process.env.GOOGLE_SCRIPT_URL;
  }
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
    if (parsed[key] != null) return parsed[key];
  }

  return null;
}

function getScriptUrl() {
  const url = readConfigValue('VITE_GOOGLE_SCRIPT_URL');
  return url || '';
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

async function readJsonBody(req) {
  return await new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      if (!data) return resolve(null);
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
  });
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
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(requestOrigin));
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
    if (req.method === 'POST' && (!payload || Object.keys(payload).length === 0)) {
      const raw = await readJsonBody(req);
      if (raw && typeof raw === 'object') payload = raw;
    }
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
        signExpiresDays,
        contractHtml: payload.contractHtml,
        signSource: payload.signSource || 'internal',
        forceRegenerate: payload.forceRegenerate || false
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

    // After sign_create, send contract email via Yandex SMTP
    let emailSent = false;
    let emailError = '';
    if (action === 'create') {
      try {
        const gasJson = text ? JSON.parse(text) : null;
        if (gasJson && gasJson.success && gasJson.emailData) {
          const ed = gasJson.emailData;
          if (ed.email && ed.signLink) {
            await sendContractEmail(ed);
            emailSent = true;
            console.log('Contract email sent to', ed.email);
          }
        }
      } catch (emailErr) {
        emailError = String(emailErr.message || emailErr);
        console.error('Email send error (non-fatal):', emailError);
      }
    }

    // Always return valid JSON for create actions
    if (action === 'create') {
      try {
        const parsed = JSON.parse(text);
        parsed.emailSent = emailSent;
        if (emailError) parsed.emailError = emailError;
        delete parsed.emailData;
        res.status(response.status).json(parsed);
        return;
      } catch {
        res.status(response.status).json({
          success: response.ok,
          message: text ? text.substring(0, 500) : 'Empty GAS response',
          emailSent,
          emailError: emailError || undefined
        });
        return;
      }
    }

    // For non-create actions, try JSON then fallback
    try {
      res.status(response.status).json(JSON.parse(text));
    } catch {
      res.status(response.status).json({ success: response.ok, message: text ? text.substring(0, 500) : 'Empty response' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}
