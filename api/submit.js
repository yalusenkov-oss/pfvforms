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

// ═══════════════════════════════════════════════════════════════════════════
// Background tasks: email, Telegram, paymentProof upload
// Runs AFTER response is sent to client — fire-and-forget
// ═══════════════════════════════════════════════════════════════════════════
function runBackgroundTasks(scriptUrl, cleanPayload, gasJson) {
  const isDistribution = cleanPayload.formType === 'distribution' && cleanPayload.email;
  const emailData = gasJson?.emailData || null;

  // 1. Send email if we have emailData with signLink (fire-and-forget)
  if (emailData?.email && emailData?.signLink) {
    sendContractEmail(emailData)
      .then(() => console.log('[bg] ✅ Email sent to', emailData.email))
      .catch(err => {
        console.error('[bg] ❌ Email error:', err.message);
      });
  } else if (emailData?.email && !emailData?.signLink) {
    // We have email but no signLink — signLink is created later from admin
    console.log('[bg] ℹ️ Email available but no signLink yet — email will be sent when sign link is created from admin');
  } else {
    console.log('[bg] ⚠️ No emailData — email not sent. gasJson keys:', gasJson ? Object.keys(gasJson) : 'null');
  }
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
    const fieldsToExclude = [
      'contractHTML', 'contract_html', 'contractText', 'contract_text',
      'signableContractHTML', 'signable_contract_html',
      'signPreviewHTML', 'sign_preview_html',
      'signatureImage', 'signature_image',
      'fullContractHTML', 'full_contract_html',
    ];

    // Fields that can be large but must be passed through without truncation
    const fieldsNoTruncate = ['paymentProof', 'payment_proof', 'coverFile'];

    const maxFieldLength = 45000;
    const cleanPayload = {};

    for (const [key, value] of Object.entries(payload)) {
      if (fieldsToExclude.includes(key)) continue;
      if (fieldsNoTruncate.includes(key)) {
        cleanPayload[key] = value;
        continue;
      }
      if (typeof value === 'string' && value.length > maxFieldLength) {
        cleanPayload[key] = value.substring(0, maxFieldLength) + '...[TRUNCATED]';
      } else {
        cleanPayload[key] = value;
      }
    }

    // ═══ For distribution: send GAS request WITHOUT paymentProof/coverFile for speed ═══
    // These large base64 fields will be sent in the background request separately
    const isDistribution = cleanPayload.formType === 'distribution';
    let gasPayload = cleanPayload;
    if (isDistribution) {
      gasPayload = { ...cleanPayload };
      if (gasPayload.paymentProof) delete gasPayload.paymentProof; // Don't send 8MB base64 in fast path
      if (gasPayload.coverFile) delete gasPayload.coverFile; // Don't send large cover base64 in fast path
    }

    console.log('[submit] coverLink:', gasPayload.coverLink || '(empty)', '| coverFile length:', (cleanPayload.coverFile || '').length);

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gasPayload),
      redirect: 'follow'
    });

    const text = await response.text();
    console.log('[submit] GAS response status:', response.status, '| body length:', text.length);

    let gasJson = null;
    try { gasJson = text ? JSON.parse(text) : null; } catch {}

    const resolvedSignLink = gasJson?.signLink || gasJson?.emailData?.signLink || '';

    // ═══ RESPOND TO CLIENT IMMEDIATELY ═══
    const clientResponse = {
      success: gasJson?.success ?? response.ok,
      message: gasJson?.message || 'Данные успешно отправлены',
      signLink: resolvedSignLink,
      contractNumber: gasJson?.contractNumber || '',
      emailSent: 'pending', // email will be sent in background
    };

    if (!gasJson?.success && gasJson?.error) {
      clientResponse.success = false;
      clientResponse.message = gasJson.error;
    }

    console.log('[submit] Responding to client:', { success: clientResponse.success, signLink: resolvedSignLink, contractNumber: clientResponse.contractNumber });
    res.status(gasJson?.success ? 200 : (response.status || 500)).json(clientResponse);

    // ═══ BACKGROUND: email + Telegram + paymentProof ═══
    // This runs AFTER res.json() — client already has response
    if (gasJson?.success && isDistribution) {
      runBackgroundTasks(scriptUrl, cleanPayload, gasJson);
    }

  } catch (err) {
    console.error('[submit] Fatal error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: String(err) });
    }
  }
}
