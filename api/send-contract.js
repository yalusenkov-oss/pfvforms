import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
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

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (!smtpUser || !smtpPass) {
      return res.status(500).json({ success: false, error: 'SMTP credentials not configured in ENV' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.yandex.ru',
      port: 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass }
    });

    const safeName = String(name || 'уважаемый автор').replace(/[<>"&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', '&': '&amp;' }[c]));
    const safeContract = String(contractNumber || 'Б/Н').replace(/[<>"&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', '&': '&amp;' }[c]));
    const safeWork = String(workTitle || '—').replace(/[<>"&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', '&': '&amp;' }[c]));
    const safeRelease = String(releaseType || '—').replace(/[<>"&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', '&': '&amp;' }[c]));
    const safeLink = String(signLink).replace(/"/g, '%22');

    const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="ru">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PFVMUSIC — Договор готов к подписанию</title>
  <style type="text/css">
    body { margin: 0; padding: 0; background-color: #f0f2f5; font-family: Arial, sans-serif; }
    table { border-spacing: 0; border-collapse: collapse; }
    td { font-family: Arial, sans-serif; }
    .long-link { word-wrap: break-word !important; word-break: break-all !important; overflow-wrap: break-word !important; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;">

<!-- Outer wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f2f5;">
  <tr>
    <td align="center" style="padding:40px 16px;">

      <!-- Email card -->
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);">

        <!-- ===== HEADER ===== -->
        <tr>
          <td style="background-color:#1b1b3a;padding:52px 40px 44px;text-align:center;">
            <!-- Logo icon -->
            <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 20px;">
              <tr>
                <td width="68" height="68" align="center" valign="middle" style="background-color:#8b5cf6;border-radius:18px;font-size:30px;line-height:68px;">🎵</td>
              </tr>
            </table>
            <div style="color:#ffffff;font-size:26px;font-weight:900;letter-spacing:5px;">PFVMUSIC</div>
            <div style="color:#a5b4fc;font-size:11px;font-weight:600;letter-spacing:4px;text-transform:uppercase;margin-top:6px;">Издательство</div>
          </td>
        </tr>

        <!-- ===== BODY ===== -->
        <tr>
          <td style="padding:40px 40px 0;background-color:#ffffff;">

            <!-- Greeting -->
            <div style="color:#111827;font-size:22px;font-weight:800;margin-bottom:10px;">Здравствуйте, ${safeName}!</div>
            <div style="color:#6b7280;font-size:15px;line-height:1.6;margin-bottom:30px;">
              Ваш договор успешно сгенерирован и готов к подписанию.<br/>
              Пожалуйста, ознакомьтесь с деталями ниже и подтвердите документ.
            </div>

            <!-- Details card -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fafbfd;border:1px solid #eef0f4;border-radius:12px;">
              <tr>
                <td style="padding:24px;">

                  <!-- Card header -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="44" valign="middle">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr><td width="44" height="44" align="center" valign="middle" style="background-color:#8b5cf6;border-radius:10px;font-size:20px;line-height:44px;">📄</td></tr>
                        </table>
                      </td>
                      <td width="14">&nbsp;</td>
                      <td valign="middle">
                        <div style="font-size:16px;font-weight:700;color:#111827;">Детали договора</div>
                        <div style="font-size:12px;color:#9ca3af;margin-top:2px;">Автоматически сгенерировано</div>
                      </td>
                    </tr>
                  </table>

                  <!-- Divider spacing -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td height="16"></td></tr>
                    <tr><td height="1" bgcolor="#eef0f4" style="line-height:1px;font-size:1px;">&nbsp;</td></tr>
                    <tr><td height="16"></td></tr>
                  </table>

                  <!-- Row: contract number -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="left" style="font-size:13px;color:#9ca3af;">№ Договора</td>
                      <td align="right" style="font-size:14px;font-weight:700;color:#6366f1;">${safeContract}</td>
                    </tr>
                  </table>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td height="12"></td></tr>
                    <tr><td height="1" bgcolor="#f0f1f5" style="line-height:1px;font-size:1px;">&nbsp;</td></tr>
                    <tr><td height="12"></td></tr>
                  </table>

                  <!-- Row: work title -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="left" style="font-size:13px;color:#9ca3af;">Произведение</td>
                      <td align="right" style="font-size:14px;font-weight:600;color:#1f2937;">«${safeWork}»</td>
                    </tr>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td height="12"></td></tr>
                    <tr><td height="1" bgcolor="#f0f1f5" style="line-height:1px;font-size:1px;">&nbsp;</td></tr>
                    <tr><td height="12"></td></tr>
                  </table>

                  <!-- Row: release type -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="left" style="font-size:13px;color:#9ca3af;">Тип релиза</td>
                      <td align="right">
                        <table cellpadding="0" cellspacing="0" border="0" align="right">
                          <tr><td bgcolor="#eef2ff" style="color:#6366f1;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:700;">${safeRelease}</td></tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

            <!-- CTA button Spacer -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="32"></td></tr></table>

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center">
                  <table cellpadding="0" cellspacing="0" border="0" bgcolor="#6366f1" style="border-radius:12px;">
                    <tr>
                      <td align="center" valign="middle" style="padding:16px 40px;">
                        <a href="${safeLink}" style="color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;">&#9997;&#65039; Подписать договор</a>
                      </td>
                    </tr>
                  </table>
                  <div style="color:#b0b8c9;font-size:12px;margin-top:12px;font-weight:500;">Ссылка действительна 7 дней</div>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="32"></td></tr></table>

            <!-- Support block -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f3ff;border:1px solid #e0e7ff;border-radius:12px;">
              <tr>
                <td style="padding:20px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="44" valign="middle">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr><td width="44" height="44" align="center" valign="middle" style="background-color:#6366f1;border-radius:10px;font-size:20px;line-height:44px;">💬</td></tr>
                        </table>
                      </td>
                      <td width="14">&nbsp;</td>
                      <td valign="middle">
                        <div style="color:#1f2937;font-size:14px;font-weight:700;margin-bottom:2px;">Есть вопросы по дистрибуции?</div>
                        <div style="color:#6b7280;font-size:13px;">Напишите нам в Telegram: <a href="https://t.me/pfvmusic_support" style="color:#6366f1;font-weight:700;text-decoration:none;">@pfvmusic_support</a></div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="12"></td></tr></table>

            <!-- Fallback block -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fffdf5;border:1px solid #fde68a;border-radius:12px;">
              <tr>
                <td style="padding:20px;">
                  <div style="color:#92400e;font-size:14px;font-weight:700;margin-bottom:8px;">⚠️ Кнопка не работает?</div>
                  <div style="color:#a16207;font-size:13px;line-height:1.5;margin-bottom:12px;">Скопируйте этот адрес и вставьте в строку браузера:</div>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;">
                    <tr>
                      <td class="long-link" style="background-color:#fefce8;border:1px dashed #fbbf24;border-radius:8px;padding:12px;font-size:12px;color:#6366f1;font-family:monospace;line-height:1.5;">
                        <a href="${safeLink}" style="color:#6366f1;text-decoration:none;" class="long-link">${safeLink}</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="32"></td></tr></table>

          </td>
        </tr>

        <!-- ===== FOOTER ===== -->
        <tr>
          <td style="background-color:#1b1b3a;padding:40px;text-align:center;">

            <!-- Footer logo -->
            <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:16px;">
              <tr>
                <td width="32" height="32" align="center" valign="middle" style="background-color:#8b5cf6;border-radius:8px;font-size:14px;line-height:32px;">🎵</td>
                <td width="10">&nbsp;</td>
                <td style="color:#c7d2fe;font-size:15px;font-weight:800;letter-spacing:3px;vertical-align:middle;">PFVMUSIC</td>
              </tr>
            </table>

            <div style="color:#9ca3af;font-size:14px;line-height:1.6;margin-bottom:6px;">С уважением, Музыкальное издательство <span style="color:#c7d2fe;font-weight:700;">PFVMUSIC</span></div>
            <div><a href="mailto:booking@pfvmusic.digital" style="color:#818cf8;font-size:13px;text-decoration:none;font-weight:600;">booking@pfvmusic.digital</a></div>

            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td height="24"></td></tr>
              <tr><td height="1" bgcolor="#252552" style="line-height:1px;font-size:1px;">&nbsp;</td></tr>
              <tr><td height="24"></td></tr>
            </table>

            <div style="color:#6b7280;font-size:11px;line-height:1.6;margin:0 auto 16px;font-style:italic;">
              Это письмо и все приложения к нему строго конфиденциальны и предназначены исключительно для указанного адресата. Если вы получили это письмо по ошибке, пожалуйста, немедленно уведомите отправителя и удалите сообщение.
            </div>
            <div style="color:#4b5563;font-size:11px;font-weight:500;">&#169; 2026 PFVMUSIC. Все права защищены.</div>

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
      subject: `Ваш договор № ${safeContract} готов к подписанию`,
      html,
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('SMTP Error:', error);
    return res.status(500).json({ success: false, error: String(error.message || error) });
  }
}
