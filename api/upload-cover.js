import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function getScriptUrl() {
  if (process.env.GOOGLE_SCRIPT_URL) return process.env.GOOGLE_SCRIPT_URL;
  if (process.env.VITE_GOOGLE_SCRIPT_URL) return process.env.VITE_GOOGLE_SCRIPT_URL;
  const candidates = [
    join(process.cwd(), 'public', 'config.json'),
    join(process.cwd(), 'config.json'),
    join(process.cwd(), 'dist', 'config.json'),
  ];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    const parsed = JSON.parse(readFileSync(p, 'utf8'));
    if (parsed.VITE_GOOGLE_SCRIPT_URL) return parsed.VITE_GOOGLE_SCRIPT_URL;
  }
  return '';
}

// ═══ CORS helper ═══
const ALLOWED_ORIGINS = ['https://pfvmusic.digital', 'https://www.pfvmusic.digital'];
function getCorsOrigin(requestOrigin) {
  if (!requestOrigin) return 'https://pfvmusic.digital';
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(requestOrigin)) return requestOrigin;
  if (ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin;
  if (/\.vercel\.app$/i.test(requestOrigin)) return requestOrigin;
  return 'https://pfvmusic.digital';
}

export default async function handler(req, res) {
  const requestOrigin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(requestOrigin));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'POST only' });

  try {
    const { coverFile, artistName } = req.body || {};
    if (!coverFile || !coverFile.startsWith('data:')) {
      return res.status(400).json({ success: false, error: 'No valid cover file provided' });
    }

    const scriptUrl = getScriptUrl();
    if (!scriptUrl) {
      return res.status(500).json({ success: false, error: 'GAS URL not configured' });
    }

    console.log('[upload-cover] Uploading cover image to Drive, size:', Math.round(coverFile.length / 1024), 'KB');

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'upload_cover',
        coverFile,
        artistName: artistName || 'Артист',
      }),
      redirect: 'follow',
    });

    const text = await response.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}

    if (json?.success && json?.coverUrl) {
      console.log('[upload-cover] ✅ Cover uploaded:', json.coverUrl);
      return res.status(200).json({ success: true, coverUrl: json.coverUrl });
    }

    console.error('[upload-cover] ❌ GAS error:', text.substring(0, 300));
    return res.status(500).json({ success: false, error: json?.error || 'Upload failed' });
  } catch (err) {
    console.error('[upload-cover] Fatal error:', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
}
