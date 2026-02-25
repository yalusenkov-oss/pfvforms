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
  <title>PFVMUSIC: договор готов к подписанию</title>
  <style>
    body { margin:0; padding:0; background:#f4f5f7; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color:#0f172a; }
    .wrap { width:100%; padding:28px 14px; box-sizing:border-box; }
    .card { max-width:620px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden; }
    .head { background:#111827; color:#ffffff; padding:26px 30px; }
    .brand { font-size:18px; font-weight:800; letter-spacing:1px; }
    .sub { font-size:12px; color:#cbd5e1; margin-top:6px; }
    .body { padding:28px 30px; }
    .title { font-size:22px; margin:0 0 12px; }
    .text { font-size:15px; color:#334155; line-height:1.6; margin:0 0 20px; }
    .box { border:1px solid #e2e8f0; border-radius:12px; padding:16px; background:#f8fafc; margin-bottom:22px; }
    .row { font-size:14px; color:#334155; margin:8px 0; }
    .label { color:#64748b; display:inline-block; min-width:130px; }
    .cta-wrap { margin:22px 0; text-align:center; }
    .cta { display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:13px 22px; border-radius:10px; font-size:16px; font-weight:700; }
    .hint { font-size:13px; color:#64748b; line-height:1.5; }
    .link { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; color:#1d4ed8; word-break:break-all; }
    .foot { border-top:1px solid #e5e7eb; padding:18px 30px 24px; font-size:12px; color:#64748b; line-height:1.6; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="head">
        <div class="brand">PFVMUSIC</div>
        <div class="sub">Музыкальное издательство</div>
      </div>
      <div class="body">
        <h1 class="title">Здравствуйте, ${safeName}!</h1>
        <p class="text">Ваш договор готов к подписанию. Проверьте данные и подпишите документ по кнопке ниже.</p>

        <div class="box">
          <div class="row"><span class="label">Номер договора:</span> ${safeContract}</div>
          <div class="row"><span class="label">Произведение:</span> ${safeWork}</div>
          <div class="row"><span class="label">Тип релиза:</span> ${safeRelease}</div>
        </div>

        <div class="cta-wrap">
          <a class="cta" href="${safeLink}">Подписать договор</a>
        </div>

        <p class="hint">Если кнопка не открывается, вставьте ссылку в браузер:</p>
        <p class="link">${safeLink}</p>
      </div>
      <div class="foot">
        Поддержка: support@pfvmusic.digital<br/>
        Это служебное письмо по вашему договору.
      </div>
    </div>
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
