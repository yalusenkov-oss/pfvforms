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
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>PFVMUSIC — Договор готов к подписанию</title>
    <style type="text/css">
      body { margin:0; padding:0; background:#f4f3ff; }
      table { border-collapse:collapse; }
      img { border:0; outline:none; text-decoration:none; }
      a { text-decoration:none; }
      @media (max-width:600px) {
        .container { width:100% !important; }
        .px { padding-left:16px !important; padding-right:16px !important; }
        .btn { width:100% !important; display:block !important; text-align:center !important; box-sizing:border-box !important; }
      }
    </style>
  </head>
  <body>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f3ff;">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation" style="width:600px;max-width:600px;">

            <!-- Header -->
            <tr>
              <td style="background:#6d28d9;border-radius:16px 16px 0 0;padding:28px 32px;">
                <table width="100%" role="presentation">
                  <tr>
                    <td style="font-family:Arial,Helvetica,sans-serif;">
                      <div style="font-size:20px;font-weight:900;letter-spacing:2px;color:#ffffff;">PFVMUSIC</div>
                      <div style="font-size:11px;letter-spacing:2.5px;color:#c4b5fd;margin-top:3px;">ИЗДАТЕЛЬСТВО</div>
                    </td>
                    <td align="right" style="font-family:Arial,Helvetica,sans-serif;">
                      <div style="display:inline-block;padding:5px 12px;border:1px solid rgba(255,255,255,0.25);border-radius:999px;font-size:11px;font-weight:700;color:#ede9fe;letter-spacing:1px;">DOC</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body card -->
            <tr>
              <td style="background:#ffffff;padding:32px 32px 0;border-left:1px solid #e9e5ff;border-right:1px solid #e9e5ff;">

                <div style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;color:#1e1b4b;line-height:1.3;">
                  Здравствуйте, ${safeName}!
                </div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6b7280;line-height:1.6;margin-top:10px;">
                  Ваш договор успешно сгенерирован и готов к подписанию.<br />
                  Пожалуйста, ознакомьтесь с деталями ниже и подтвердите документ.
                </div>

                <!-- Details block -->
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:20px;background:#faf9ff;border:1px solid #ede9ff;border-radius:12px;">
                  <tr>
                    <td style="padding:18px 16px;">
                      <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#4c1d95;text-transform:uppercase;letter-spacing:0.8px;">Детали договора</div>
                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:12px;">
                        <tr>
                          <td style="padding:9px 0;border-top:1px solid #ede9ff;font-family:Arial,Helvetica,sans-serif;color:#6b7280;font-size:13px;">№ Договора</td>
                          <td align="right" style="padding:9px 0;border-top:1px solid #ede9ff;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#6d28d9;">${safeContract}</td>
                        </tr>
                        <tr>
                          <td style="padding:9px 0;border-top:1px solid #ede9ff;font-family:Arial,Helvetica,sans-serif;color:#6b7280;font-size:13px;">Произведение</td>
                          <td align="right" style="padding:9px 0;border-top:1px solid #ede9ff;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#1e1b4b;">«${safeWork}»</td>
                        </tr>
                        <tr>
                          <td style="padding:9px 0;border-top:1px solid #ede9ff;font-family:Arial,Helvetica,sans-serif;color:#6b7280;font-size:13px;">Тип релиза</td>
                          <td align="right" style="padding:9px 0;border-top:1px solid #ede9ff;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#1e1b4b;">${safeRelease}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- CTA button -->
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;">
                  <tr>
                    <td>
                      <a class="btn" href="${safeLink}" target="_blank"
                         style="display:inline-block;padding:14px 28px;border-radius:12px;background:#7c3aed;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;max-width:100%;box-sizing:border-box;text-align:center;">
                        Подписать договор
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Support -->
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;">
                  <tr>
                    <td style="padding-top:20px;border-top:1px solid #ede9ff;">
                      <div style="font-family:Arial,Helvetica,sans-serif;color:#1e1b4b;font-size:14px;font-weight:700;">Вопросы по дистрибуции?</div>
                      <div style="margin-top:5px;font-family:Arial,Helvetica,sans-serif;color:#6b7280;font-size:13px;line-height:1.6;">
                        Поддержка: <a href="https://t.me/pfvmusic_support" style="color:#7c3aed;font-weight:700;">@pfvmusic_support</a>
                      </div>
                      <div style="margin-top:14px;font-family:Arial,Helvetica,sans-serif;color:#9ca3af;font-size:12px;line-height:1.5;">
                        Если кнопка не работает, скопируйте адрес и вставьте в браузер:
                      </div>
                      <div style="margin-top:6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;word-break:break-all;">
                        <a href="${safeLink}" target="_blank" style="color:#7c3aed;">${safeLink}</a>
                      </div>
                    </td>
                  </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td style="height:32px;"></td></tr></table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#6d28d9;border-radius:0 0 16px 16px;padding:24px 32px;">
                <div style="font-family:Arial,Helvetica,sans-serif;color:#ede9fe;font-size:13px;line-height:1.6;">
                  <strong style="color:#ffffff;font-size:15px;letter-spacing:1px;">PFVMUSIC</strong><br />
                  С уважением, Музыкальное издательство PFVMUSIC<br />
                  <a href="mailto:support@pfvmusic.digital" style="color:#c4b5fd;">support@pfvmusic.digital</a>
                </div>
                <div style="margin-top:16px;font-family:Arial,Helvetica,sans-serif;color:#a78bfa;font-size:11px;line-height:1.6;">
                  Это письмо конфиденциально и предназначено исключительно для указанного адресата.
                  Если вы получили его по ошибке — немедленно уведомите отправителя и удалите сообщение.
                </div>
                <div style="margin-top:8px;font-family:Arial,Helvetica,sans-serif;color:#a78bfa;font-size:11px;">
                  © 2026 PFVMUSIC. Все права защищены.
                </div>
              </td>
            </tr>

            <tr><td style="height:20px;"></td></tr>
          </table>
        </td>
      </tr>
    </table>
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
