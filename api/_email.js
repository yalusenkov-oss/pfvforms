import nodemailer from 'nodemailer';

function esc(str) {
  return String(str || '').replace(/[<>"&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', '&': '&amp;' }[c]));
}

export async function sendContractEmail({ email, name, contractNumber, signLink, workTitle, releaseType }) {
  const smtpUser = process.env.SMTP_USER || 'noreply@pfvmusic.digital';
  const smtpPass = process.env.SMTP_PASS || 'fsvyjzrabtslbfef';
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

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="ru">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PFVMUSIC — Договор готов к подписанию</title>
  <style type="text/css">
    body { margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    table { border-spacing: 0; border-collapse: collapse; }
    td { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .long-link { word-wrap: break-word !important; word-break: break-all !important; overflow-wrap: break-word !important; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;">
  <tr>
    <td align="center" style="padding:40px 16px;">

      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08);">

        <tr>
          <td style="background-color:#12072b; background-image:linear-gradient(135deg, #12072b 0%, #2a1154 100%); padding:50px 40px; text-align:center;">
            <div style="color:#ffffff;font-size:26px;font-weight:900;letter-spacing:4px;text-transform:uppercase;">PFVMUSIC</div>
            <div style="color:#b29ee6;font-size:11px;font-weight:600;letter-spacing:5px;text-transform:uppercase;margin-top:8px;">Издательство</div>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px 10px;background-color:#ffffff;">

            <div style="color:#111827;font-size:24px;font-weight:800;margin-bottom:12px;">Здравствуйте, ${safeName}!</div>
            <div style="color:#4b5563;font-size:16px;line-height:1.6;margin-bottom:32px;">
              Ваш договор успешно сгенерирован и готов к подписанию.<br/>
              Пожалуйста, ознакомьтесь с деталями ниже и подтвердите документ.
            </div>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f9fa;border:1px solid #e5e7eb;border-radius:14px;">
              <tr>
                <td style="padding:24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="48" valign="middle">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td width="48" height="48" align="center" valign="middle" style="background-color:#7c3aed;color:#ffffff;font-size:22px;border-radius:12px;">📄</td>
                          </tr>
                        </table>
                      </td>
                      <td width="16">&nbsp;</td>
                      <td valign="middle">
                        <div style="font-size:16px;font-weight:700;color:#111827;">Детали договора</div>
                        <div style="font-size:13px;color:#6b7280;margin-top:2px;">Автоматически сгенерировано</div>
                      </td>
                    </tr>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td height="20"></td></tr>
                    <tr><td height="1" bgcolor="#e5e7eb" style="line-height:1px;font-size:1px;">&nbsp;</td></tr>
                    <tr><td height="20"></td></tr>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="left" style="font-size:14px;color:#6b7280;">№ Договора</td>
                      <td align="right" style="font-size:15px;font-weight:700;color:#7c3aed;">${safeContract}</td>
                    </tr>
                  </table>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td height="14"></td></tr>
                    <tr><td height="1" bgcolor="#f3f4f6" style="line-height:1px;font-size:1px;">&nbsp;</td></tr>
                    <tr><td height="14"></td></tr>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="left" style="font-size:14px;color:#6b7280;">Произведение</td>
                      <td align="right" style="font-size:15px;font-weight:600;color:#111827;">«${safeWork}»</td>
                    </tr>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td height="14"></td></tr>
                    <tr><td height="1" bgcolor="#f3f4f6" style="line-height:1px;font-size:1px;">&nbsp;</td></tr>
                    <tr><td height="14"></td></tr>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="left" style="font-size:14px;color:#6b7280;" valign="middle">Тип релиза</td>
                      <td align="right" valign="middle">
                        <table cellpadding="0" cellspacing="0" border="0" align="right">
                          <tr>
                            <td bgcolor="#ede9fe" style="color:#7c3aed;padding:6px 14px;border-radius:6px;font-size:13px;font-weight:700;">${safeRelease}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="36"></td></tr></table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center">
                  <table cellpadding="0" cellspacing="0" border="0" bgcolor="#7c3aed" style="background-image:linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); border-radius:14px;">
                    <tr>
                      <td align="center" valign="middle" style="padding:18px 44px;">
                        <a href="${safeLink}" style="color:#ffffff;text-decoration:none;font-weight:bold;font-size:18px;">✍️ Подписать договор</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="36"></td></tr></table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#faf5ff;border:1px solid #e9d5ff;border-radius:14px;">
              <tr>
                <td style="padding:22px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="48" valign="middle">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td width="48" height="48" align="center" valign="middle" style="background-color:#a855f7;color:#ffffff;font-size:22px;border-radius:12px;">💬</td>
                          </tr>
                        </table>
                      </td>
                      <td width="16">&nbsp;</td>
                      <td valign="middle">
                        <div style="color:#111827;font-size:15px;font-weight:700;margin-bottom:4px;">Вопросы по дистрибуции?</div>
                        <div style="color:#4b5563;font-size:14px;">Поддержка в Telegram: <a href="https://t.me/pfvmusic_support" style="color:#9333ea;font-weight:bold;text-decoration:none;">@pfvmusic_support</a></div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="20"></td></tr></table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fef3c7;border:1px solid #fde68a;border-radius:14px;">
              <tr>
                <td style="padding:22px;">
                  <div style="color:#b45309;font-size:15px;font-weight:700;margin-bottom:8px;">⚠️ Кнопка не работает?</div>
                  <div style="color:#92400e;font-size:14px;line-height:1.5;margin-bottom:14px;">Скопируйте этот адрес и вставьте в строку браузера:</div>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;">
                    <tr>
                      <td class="long-link" style="background-color:#ffffff;border:1px dashed #fbbf24;border-radius:8px;padding:14px;font-size:13px;color:#d97706;font-family:monospace;line-height:1.5;">
                        <a href="${safeLink}" style="color:#d97706;text-decoration:none;" class="long-link">${safeLink}</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="40"></td></tr></table>

          </td>
        </tr>

        <tr>
          <td style="background-color:#12072b;padding:40px;text-align:center;">

            <div style="color:#ffffff;font-size:18px;font-weight:900;letter-spacing:4px;text-transform:uppercase;margin-bottom:20px;">PFVMUSIC</div>

            <div style="color:#e5e7eb;font-size:15px;line-height:1.6;margin-bottom:8px;">С уважением, Музыкальное издательство <span style="color:#a78bfa;font-weight:700;">PFVMUSIC</span></div>
            <div><a href="mailto:support@pfvmusic.digital" style="color:#a78bfa;font-size:14px;text-decoration:none;font-weight:700;">support@pfvmusic.digital</a></div>

            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td height="32"></td></tr>
              <tr><td height="1" bgcolor="#2a1154" style="line-height:1px;font-size:1px;">&nbsp;</td></tr>
              <tr><td height="32"></td></tr>
            </table>

            <div style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0 auto 16px;font-style:italic;max-width:480px;">
              Это письмо и все приложения к нему строго конфиденциальны и предназначены исключительно для указанного адресата. Если вы получили это письмо по ошибке, пожалуйста, немедленно уведомите отправителя и удалите сообщение.
            </div>
            <div style="color:#6b7280;font-size:12px;font-weight:500;">&#169; 2026 PFVMUSIC. Все права защищены.</div>

          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>`;

  const info = await transporter.sendMail({
    from: `PFVMUSIC <${smtpUser}>`,
    to: String(email).trim(),
    subject: `PFVMUSIC — Ваш договор готов к подписанию (${safeContract})`,
    html,
  });

  return info;
}
