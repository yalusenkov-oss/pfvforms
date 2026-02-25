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
      body { margin:0; padding:0; background:#0b0b10; }
      table { border-collapse:collapse; }
      img { border:0; outline:none; text-decoration:none; }
      a { text-decoration:none; }
      @media (max-width:600px) {
        .container { width:100% !important; }
        .px { padding-left:16px !important; padding-right:16px !important; }
        .btn { width:100% !important; }
      }
    </style>
  </head>
  <body>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0b0b10;">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation" style="width:600px;max-width:600px;">

            <tr>
              <td class="px" style="padding:0 24px 14px 24px;">
                <table width="100%" role="presentation">
                  <tr>
                    <td align="left" style="font-family:Arial,Helvetica,sans-serif;">
                      <div style="font-size:18px;font-weight:800;letter-spacing:0.6px;color:#ffffff;">PFVMUSIC</div>
                      <div style="margin-top:4px;font-size:12px;letter-spacing:1.6px;color:#b6b6c9;">ИЗДАТЕЛЬСТВО</div>
                    </td>
                    <td align="right" style="font-family:Arial,Helvetica,sans-serif;">
                      <div style="display:inline-block;padding:6px 10px;border:1px solid #2a2a3a;border-radius:999px;font-size:12px;color:#cfd0e6;">DOC</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td class="px" style="padding:0 24px;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#121220;border:1px solid #23233a;border-radius:16px;">
                  <tr>
                    <td style="padding:22px 20px;">

                      <div style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:20px;font-weight:700;line-height:1.3;">
                        Здравствуйте, ${safeName}!
                      </div>
                      <div style="font-family:Arial,Helvetica,sans-serif;color:#cfd0e6;font-size:14px;line-height:1.6;margin-top:10px;">
                        Ваш договор успешно сгенерирован и готов к подписанию.<br />
                        Пожалуйста, ознакомьтесь с деталями ниже и подтвердите документ.
                      </div>

                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:16px;background:#0f0f1a;border:1px solid #23233a;border-radius:12px;">
                        <tr>
                          <td style="padding:16px 14px;">
                            <div style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:14px;font-weight:700;">Детали договора</div>
                            <div style="font-family:Arial,Helvetica,sans-serif;color:#9ea0bf;font-size:12px;margin-top:4px;">Автоматически сгенерировано</div>
                            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:12px;">
                              <tr>
                                <td style="padding:10px 0;border-top:1px solid #23233a;font-family:Arial,Helvetica,sans-serif;color:#9ea0bf;font-size:12px;">№ Договора</td>
                                <td align="right" style="padding:10px 0;border-top:1px solid #23233a;font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:12px;font-weight:700;">${safeContract}</td>
                              </tr>
                              <tr>
                                <td style="padding:10px 0;border-top:1px solid #23233a;font-family:Arial,Helvetica,sans-serif;color:#9ea0bf;font-size:12px;">Произведение</td>
                                <td align="right" style="padding:10px 0;border-top:1px solid #23233a;font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:12px;font-weight:700;">«${safeWork}»</td>
                              </tr>
                              <tr>
                                <td style="padding:10px 0;border-top:1px solid #23233a;font-family:Arial,Helvetica,sans-serif;color:#9ea0bf;font-size:12px;">Тип релиза</td>
                                <td align="right" style="padding:10px 0;border-top:1px solid #23233a;font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:12px;font-weight:700;">${safeRelease}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:18px;">
                        <tr>
                          <td align="left">
                            <a class="btn" href="${safeLink}" target="_blank"
                               style="display:inline-block;padding:12px 20px;border-radius:12px;background:#6d5efc;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;">
                              Подписать договор
                            </a>
                          </td>
                        </tr>
                      </table>

                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:18px;">
                        <tr>
                          <td style="padding-top:14px;border-top:1px solid #23233a;">
                            <div style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:14px;font-weight:700;">Вопросы по дистрибуции?</div>
                            <div style="margin-top:6px;font-family:Arial,Helvetica,sans-serif;color:#cfd0e6;font-size:13px;line-height:1.6;">
                              Поддержка: <span style="color:#ffffff;font-weight:700;">@pfvmusic_support</span>
                            </div>
                            <div style="margin-top:12px;font-family:Arial,Helvetica,sans-serif;color:#9ea0bf;font-size:12px;line-height:1.6;">
                              Если кнопка не работает, скопируйте адрес и вставьте в браузер:
                            </div>
                            <div style="margin-top:8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;">
                              <a href="${safeLink}" target="_blank" style="color:#9ad1ff;word-break:break-all;">${safeLink}</a>
                            </div>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td class="px" style="padding:18px 24px 0 24px;">
                <div style="font-family:Arial,Helvetica,sans-serif;color:#b6b6c9;font-size:12px;line-height:1.6;">
                  <strong style="color:#ffffff;">PFVMUSIC</strong><br />
                  С уважением, Музыкальное издательство PFVMUSIC<br />
                  <a href="mailto:support@pfvmusic.digital" style="color:#9ad1ff;">support@pfvmusic.digital</a>
                </div>
              </td>
            </tr>
            <tr>
              <td class="px" style="padding:14px 24px 0 24px;">
                <div style="font-family:Arial,Helvetica,sans-serif;color:#7f80a3;font-size:11px;line-height:1.6;">
                  Это письмо строго конфиденциально и предназначено исключительно для указанного адресата.
                  Если вы получили его по ошибке — немедленно уведомите отправителя и удалите сообщение.
                </div>
                <div style="margin-top:10px;font-family:Arial,Helvetica,sans-serif;color:#7f80a3;font-size:11px;">
                  © 2026 PFVMUSIC. Все права защищены.
                </div>
              </td>
            </tr>
            <tr><td style="height:18px;"></td></tr>

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
