import { sendContractEmail } from './_email.js';

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
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const { email, name, contractNumber, signLink, workTitle, releaseType } = req.body || {};

    if (!email || !signLink) {
      return res.status(400).json({ success: false, error: 'Missing email or signLink' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({ success: false, error: `Invalid email: "${email}"` });
    }

    const info = await sendContractEmail({ email, name, contractNumber, signLink, workTitle, releaseType });
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('SMTP Error:', error);
    return res.status(500).json({ success: false, error: String(error.message || error) });
  }
}
