import { sendContractEmail } from './_email.js';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // GET = diagnostics only (no email sent)
  if (req.method === 'GET') {
    return res.status(200).json({
      smtp_user_set: !!process.env.SMTP_USER,
      smtp_user: smtpUser ? smtpUser.replace(/(.{3}).*(@.*)/, '$1***$2') : null,
      smtp_pass_set: !!process.env.SMTP_PASS,
      smtp_host: 'smtp.yandex.ru',
      smtp_port: 465,
      note: 'POST to this endpoint to send a test email',
      post_body_example: {
        to: 'test@example.com',
        name: 'Test User',
        contractNumber: 'PFV-202602-0000',
        signLink: 'https://pfvmusic.digital/#sign?token=test123',
        workTitle: 'Test Track',
        releaseType: 'Сингл'
      }
    });
  }

  // POST = send test email
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use GET for diagnostics, POST to send test email' });
  }

  if (!smtpUser || !smtpPass) {
    return res.status(500).json({
      success: false,
      error: 'SMTP credentials not available',
      smtp_user_set: !!process.env.SMTP_USER,
      smtp_pass_set: !!process.env.SMTP_PASS
    });
  }

  let body = req.body || {};
  if (!body || Object.keys(body).length === 0) {
    await new Promise(resolve => {
      let d = '';
      req.on('data', c => { d += c; });
      req.on('end', () => { try { body = JSON.parse(d); } catch {} resolve(); });
    });
  }

  const to = body.to || smtpUser;
  const name = body.name || 'Тестовый пользователь';
  const contractNumber = body.contractNumber || 'PFV-TEST-0000';
  const signLink = body.signLink || 'https://pfvmusic.digital/#sign?token=test123';
  const workTitle = body.workTitle || 'Тестовый трек';
  const releaseType = body.releaseType || 'Сингл';

  // First verify SMTP connection
  let verifyOk = false;
  let verifyError = '';
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.yandex.ru',
      port: 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass }
    });
    await transporter.verify();
    verifyOk = true;
  } catch (e) {
    verifyError = String(e.message || e);
  }

  if (!verifyOk) {
    return res.status(500).json({
      success: false,
      step: 'smtp_verify',
      error: verifyError,
      smtp_user: smtpUser.replace(/(.{3}).*(@.*)/, '$1***$2'),
      hint: 'Check SMTP_USER and SMTP_PASS in Vercel Environment Variables. For Yandex, use an app password, not your main password.'
    });
  }

  // If simple=true, send a plain-text email to isolate spam issues from HTML content
  if (body.simple) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.yandex.ru', port: 465, secure: true,
        auth: { user: smtpUser, pass: smtpPass }
      });
      const info = await transporter.sendMail({
        from: `PFVMUSIC <${smtpUser}>`,
        to,
        subject: `PFVMUSIC — Договор ${contractNumber}`,
        text: `Здравствуйте, ${name}!\n\nВаш договор ${contractNumber} готов к подписанию.\nПроизведение: ${workTitle}\nТип релиза: ${releaseType}\n\nСсылка для подписания:\n${signLink}\n\nС уважением,\nPFVMUSIC`
      });
      return res.status(200).json({ success: true, mode: 'simple_text', messageId: info.messageId, sentTo: to });
    } catch (e) {
      return res.status(500).json({ success: false, mode: 'simple_text', error: String(e.message || e) });
    }
  }

  // Send actual email using the full HTML template
  try {
    const info = await sendContractEmail({
      email: to,
      name,
      contractNumber,
      signLink,
      workTitle,
      releaseType
    });
    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      sentTo: to,
      from: smtpUser,
      contractNumber,
      signLink,
      smtpVerified: verifyOk
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      step: 'send_email',
      error: String(e.message || e),
      smtp_user: smtpUser.replace(/(.{3}).*(@.*)/, '$1***$2'),
      smtpVerified: verifyOk
    });
  }
}
