import { sendContractEmail } from './_email.js';

function readEnvValue(key) {
  if (process.env[key]) return process.env[key];
  if (key === 'VITE_GOOGLE_SCRIPT_URL') return process.env.GOOGLE_SCRIPT_URL || process.env.VITE_GOOGLE_SCRIPT_URL || null;
  if (key === 'VITE_SIGN_BASE_URL') return process.env.SIGN_BASE_URL || process.env.VITE_SIGN_BASE_URL || null;
  if (key === 'VITE_SIGN_EXPIRES_DAYS') return process.env.SIGN_EXPIRES_DAYS || process.env.VITE_SIGN_EXPIRES_DAYS || null;
  return null;
}

function getScriptUrl() {
  return readEnvValue('VITE_GOOGLE_SCRIPT_URL') || '';
}

function getSignBaseUrl(req) {
  const configured = readEnvValue('VITE_SIGN_BASE_URL');
  if (configured) return String(configured).replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  return host ? `${proto}://${host}` : '';
}

function getSignExpiresDays() {
  const raw = readEnvValue('VITE_SIGN_EXPIRES_DAYS');
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return 7;
}

async function readJsonBody(req) {
  return await new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
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
    if (req.method === 'POST' && (!payload || Object.keys(payload).length === 0)) {
      const raw = await readJsonBody(req);
      if (raw && typeof raw === 'object') payload = raw;
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
      redirect: 'follow',
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

    try {
      res.status(response.status).json(JSON.parse(text));
    } catch {
      res.status(response.status).json({ success: response.ok, message: text ? text.substring(0, 500) : 'Empty response' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}
