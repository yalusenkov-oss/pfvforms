import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { sendContractEmail } from './_email.js';

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
    if (!payload || Object.keys(payload).length === 0) {
      const raw = await readJsonBody(req);
      if (raw && typeof raw === 'object') payload = raw;
    }
    if (payload && payload.data && typeof payload.data === 'string') {
      payload = JSON.parse(payload.data);
    }

    // Remove or truncate large fields to avoid Google Sheets 50000 char limit per cell
    // Fields to exclude: contract HTML, full contract text, signature images, etc.
    const fieldsToExclude = [
      'contractHTML',
      'contract_html',
      'contractText',
      'contract_text',
      'signableContractHTML',
      'signable_contract_html',
      'signPreviewHTML',
      'sign_preview_html',
      'signatureImage',
      'signature_image',
      'fullContractHTML',
      'full_contract_html',
    ];

    // Fields that can be large but must be passed through without truncation
    // (GAS handles them directly, e.g. uploads to Drive — they never end up in a cell)
    const fieldsNoTruncate = ['paymentProof', 'payment_proof'];

    const maxFieldLength = 45000; // Leave 5000 char margin for safety
    const cleanPayload = {};

    for (const [key, value] of Object.entries(payload)) {
      // Skip excluded fields entirely
      if (fieldsToExclude.includes(key)) {
        continue;
      }

      // Pass through without truncation (large binary/base64 fields handled by GAS)
      if (fieldsNoTruncate.includes(key)) {
        cleanPayload[key] = value;
        continue;
      }

      // Truncate string fields that exceed limit
      if (typeof value === 'string' && value.length > maxFieldLength) {
        cleanPayload[key] = value.substring(0, maxFieldLength) + '...[TRUNCATED]';
      } else {
        cleanPayload[key] = value;
      }
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPayload),
      redirect: 'follow'
    });

    const text = await response.text();

    // After successful GAS response, send contract email via Yandex SMTP
    let emailSent = false;
    let emailError = '';
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

    // Always return valid JSON
    try {
      const parsed = JSON.parse(text);
      parsed.emailSent = emailSent;
      if (emailError) parsed.emailError = emailError;
      delete parsed.emailData;
      res.status(response.status).json(parsed);
    } catch {
      res.status(response.status).json({
        success: response.ok,
        message: text ? text.substring(0, 500) : 'Empty GAS response',
        emailSent,
        emailError: emailError || undefined
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}
