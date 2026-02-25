import nodemailer from 'nodemailer';

function esc(str) {
  return String(str || '').replace(/[<>"&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', '&': '&amp;' }[c]));
}

function buildText({ name, contractNumber, workTitle, releaseType, signLink }) {
  return [
    `Здравствуйте, ${name || 'уважаемый автор'}!`,
    '',
    'Ваш договор готов к подписанию.',
    `Номер договора: ${contractNumber || 'Б/Н'}`,
    `Произведение: ${workTitle || '—'}`,
    `Тип релиза: ${releaseType || '—'}`,
    '',
    'Ссылка для подписания:',
    String(signLink || ''),
    '',
    'Если у вас есть вопросы, ответьте на это письмо или напишите на support@pfvmusic.digital.',
    '',
    'PFVMUSIC'
  ].join('\n');
}

function buildHtml({ safeName, safeContract, safeWork, safeRelease, safeLink }) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PFVMUSIC — Договор готов к подписанию</title>
  <style>
    body { margin:0; padding:0; background:#f3f4f6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color:#111827; }
    table { border-spacing:0; border-collapse:collapse; }
    .outer { width:100%; background:#f3f4f6; padding:34px 12px; box-sizing:border-box; }
    .card { max-width:600px; width:100%; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:18px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.06); }
    .hero { background:#12072b; background-image:linear-gradient(135deg, #12072b 0%, #2a1154 100%); padding:40px 34px; text-align:center; }
    .logo { margin:0 auto 14px; }
    .logo img { display:block; margin:0 auto; width:86px; height:auto; border:0; }
    .brand { color:#ffffff; font-size:28px; font-weight:900; letter-spacing:4px; text-transform:uppercase; }
    .subtitle { color:#c8b4f4; font-size:11px; letter-spacing:5px; text-transform:uppercase; font-weight:700; margin-top:8px; }
    .section { padding:34px; }
    .title { font-size:24px; font-weight:800; margin:0 0 12px; }
    .text { font-size:16px; color:#4b5563; line-height:1.6; margin:0 0 28px; }
    .info-card { border:1px solid #e5e7eb; border-radius:14px; background:#f8f9fa; padding:22px; margin-bottom:28px; }
    .icon-box { width:48px; height:48px; background:#7c3aed; color:#ffffff; font-size:11px; font-weight:700; border-radius:12px; text-align:center; }
    .icon-box span { line-height:48px; display:block; }
    .icon-box.secondary { background:#a855f7; font-size:10px; }
    .rowline { border-top:1px solid #f0f1f3; margin:12px 0; }
    .meta-title { font-size:16px; font-weight:700; color:#111827; }
    .meta-sub { font-size:13px; color:#6b7280; margin-top:2px; }
    .kv td { font-size:14px; padding:8px 0; }
    .k { color:#6b7280; }
    .v { color:#111827; font-weight:600; text-align:right; }
    .cta-wrap { text-align:center; margin:26px 0 28px; }
    .cta { display:inline-block; text-decoration:none; color:#ffffff; background:#7c3aed; background-image:linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); font-size:18px; font-weight:700; padding:16px 40px; border-radius:12px; }
    .support { border:1px solid #e9d5ff; background:#faf5ff; border-radius:14px; padding:20px; margin-bottom:16px; }
    .support-title { color:#111827; font-size:15px; font-weight:700; margin-bottom:5px; }
    .support-text { color:#4b5563; font-size:14px; }
    .warning { border:1px solid #fde68a; background:#fef3c7; border-radius:14px; padding:20px; }
    .warning-title { color:#b45309; font-size:14px; font-weight:700; margin-bottom:6px; }
    .warning-text { color:#92400e; font-size:12px; margin-bottom:10px; line-height:1.4; }
    .linkbox { border:1px dashed #fbbf24; border-radius:8px; background:#ffffff; padding:10px; font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size:12px; color:#d97706; word-break:break-all; line-height:1.35; }
    .footer { background:#12072b; padding:34px; text-align:center; }
    .footer-brand { color:#ffffff; font-size:18px; font-weight:900; letter-spacing:4px; text-transform:uppercase; margin-bottom:14px; }
    .footer-main { color:#e5e7eb; font-size:15px; line-height:1.6; margin-bottom:8px; }
    .footer-mail { color:#a78bfa; font-size:14px; font-weight:700; }
    .footer-sep { height:1px; background:#2a1154; margin:24px 0; }
    .footer-note { color:#9ca3af; font-size:12px; line-height:1.6; margin-bottom:12px; }
    .footer-copy { color:#6b7280; font-size:12px; font-weight:500; }
  </style>
</head>
<body>
  <div class="outer">
    <table role="presentation" class="card" cellpadding="0" cellspacing="0">
      <tr>
        <td class="hero">
          <div class="logo">
            <img src="https://www.pfvmusic.digital/Frame%203.png" alt="PFVMUSIC logo" />
          </div>
          <div class="brand">PFVMUSIC</div>
          <div class="subtitle">ИЗДАТЕЛЬСТВО</div>
        </td>
      </tr>
      <tr>
        <td class="section">
          <h1 class="title">Здравствуйте, ${safeName}!</h1>
          <p class="text">Ваш договор успешно сгенерирован и готов к подписанию.<br/>Пожалуйста, ознакомьтесь с деталями ниже и подтвердите документ.</p>

          <div class="info-card">
            <table role="presentation" width="100%">
              <tr>
                <td width="48" valign="top">
                  <div class="icon-box"><span>DOC</span></div>
                </td>
                <td width="14"></td>
                <td valign="top">
                  <div class="meta-title">Детали договора</div>
                  <div class="meta-sub">Автоматически сгенерировано</div>
                </td>
              </tr>
            </table>
            <div class="rowline"></div>
            <table role="presentation" width="100%" class="kv">
              <tr>
                <td class="k">№ Договора</td>
                <td class="v">${safeContract}</td>
              </tr>
              <tr>
                <td class="k">Произведение</td>
                <td class="v">«${safeWork}»</td>
              </tr>
              <tr>
                <td class="k">Тип релиза</td>
                <td class="v">${safeRelease}</td>
              </tr>
            </table>
          </div>

          <div class="cta-wrap">
            <a href="${safeLink}" class="cta">Подписать договор</a>
          </div>

          <div class="support">
            <table role="presentation" width="100%">
              <tr>
                <td width="48" valign="top">
                  <div class="icon-box secondary"><span>INFO</span></div>
                </td>
                <td width="14"></td>
                <td valign="top">
                  <div class="support-title">Вопросы по дистрибуции?</div>
                  <div class="support-text">Поддержка: @pfvmusic_support</div>
                </td>
              </tr>
            </table>
          </div>

          <div class="warning">
            <div class="warning-title">Если кнопка не работает</div>
            <div class="warning-text">Скопируйте этот адрес и вставьте в строку браузера:</div>
            <div class="linkbox">${safeLink}</div>
          </div>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <div class="footer-brand">PFVMUSIC</div>
          <div class="footer-main">С уважением, Музыкальное издательство PFVMUSIC</div>
          <div class="footer-mail">support@pfvmusic.digital</div>
          <div class="footer-sep"></div>
          <div class="footer-note">Это письмо и все приложения к нему строго конфиденциальны и предназначены исключительно для указанного адресата. Если вы получили это письмо по ошибке, пожалуйста, немедленно уведомите отправителя и удалите сообщение.</div>
          <div class="footer-copy">© 2026 PFVMUSIC. Все права защищены.</div>
        </div>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

async function sendWithMode({ transporter, smtpUser, email, subject, text, html, mode }) {
  const mailOptions = {
    from: `PFVMUSIC <${smtpUser}>`,
    to: String(email).trim(),
    subject,
    text,
  };
  if (mode === 'html') {
    mailOptions.html = html;
  }
  const info = await transporter.sendMail(mailOptions);
  return { ...info, usedMode: mode };
}

export async function sendContractEmail({ email, name, contractNumber, signLink, workTitle, releaseType, strategy = 'html_then_simple' }) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) {
    throw new Error('SMTP credentials not configured in ENV');
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true,
    auth: { user: smtpUser, pass: smtpPass }
  });

  const safeName = esc(name || 'уважаемый автор');
  const safeContract = esc(contractNumber || 'Б/Н');
  const safeWork = esc(workTitle || '—');
  const safeRelease = esc(releaseType || '—');
  const safeLink = String(signLink).replace(/"/g, '%22');
  const text = buildText({ name, contractNumber, workTitle, releaseType, signLink });
  const html = buildHtml({ safeName, safeContract, safeWork, safeRelease, safeLink });
  const subject = `PFVMUSIC: договор готов к подписанию (${safeContract})`;
  const modes = strategy === 'simple_then_html' ? ['simple', 'html'] : ['html', 'simple'];

  let lastError;
  for (let i = 0; i < modes.length; i += 1) {
    const mode = modes[i];
    try {
      return await sendWithMode({ transporter, smtpUser, email, subject, text, html, mode });
    } catch (err) {
      lastError = err;
      if (i === modes.length - 1) break;
    }
  }

  throw lastError;
}
