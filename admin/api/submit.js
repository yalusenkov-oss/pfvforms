import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxV8xHP0O09Q7KqMWmsApHOiSw9oNMDb6JKonoVnOBwbL95-v9duxnNZLca55yQJQk7OQ/exec';

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
    console.warn('[admin/api/submit] Falling back to DEFAULT_SCRIPT_URL. config.json not found.');
    return DEFAULT_SCRIPT_URL;
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

    const maxFieldLength = 45000; // Leave 5000 char margin for safety
    const cleanPayload = {};

    for (const [key, value] of Object.entries(payload)) {
      // Skip excluded fields entirely
      if (fieldsToExclude.includes(key)) {
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
    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}
