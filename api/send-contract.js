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
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:Arial,Helvetica,sans-serif;">

<!-- Outer wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f2f5;">
  <tr>
    <td align="center" style="padding:40px 16px;">

      <!-- Email card -->
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);">

        <!-- ===== HEADER ===== -->
        <tr>
          <td style="background-color:#141428;background-image:linear-gradient(145deg,#0e0e1a 0%,#1b1b3a 50%,#252552 100%);padding:52px 40px 44px;text-align:center;">
            <!-- Logo icon (CSS only, no SVG) -->
            <table width="68" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 20px;">
              <tr>
                <td width="68" height="68" style="background-image:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:18px;text-align:center;vertical-align:middle;font-size:30px;line-height:68px;">
                  🎵
                </td>
              </tr>
            </table>
            <div style="color:#ffffff;font-size:26px;font-weight:900;letter-spacing:5px;font-family:Arial,Helvetica,sans-serif;">PFVMUSIC</div>
            <div style="color:rgba(165,180,252,0.6);font-size:11px;font-weight:600;letter-spacing:4px;text-transform:uppercase;margin-top:6px;font-family:Arial,Helvetica,sans-serif;">Издательство</div>
          </td>
        </tr>

        <!-- ===== BODY ===== -->
        <tr>
          <td style="padding:44px 44px 0;background-color:#ffffff;">

            <!-- Greeting -->
            <div style="color:#111827;font-size:22px;font-weight:800;margin-bottom:10px;font-family:Arial,Helvetica,sans-serif;">Здравствуйте, ${safeName}!</div>
            <div style="color:#6b7280;font-size:15px;line-height:1.75;margin-bottom:32px;font-family:Arial,Helvetica,sans-serif;">
              Ваш договор успешно сгенерирован и готов к подписанию.<br/>
              Пожалуйста, ознакомьтесь с деталями ниже и подтвердите документ, перейдя по ссылке.
            </div>

            <!-- Details card -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fafbfd;border:1px solid #eef0f4;border-radius:16px;margin-bottom:32px;">
              <tr>
                <td style="padding:28px 30px;">

                  <!-- Card header -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom:1px solid #eef0f4;padding-bottom:18px;margin-bottom:22px;">
                    <tr>
                      <td width="52" valign="middle">
                        <div style="width:44px;height:44px;background-image:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;text-align:center;line-height:44px;font-size:20px;">📄</div>
                      </td>
                      <td valign="middle" style="padding-left:14px;">
                        <div style="font-size:16px;font-weight:700;color:#111827;font-family:Arial,Helvetica,sans-serif;">Детали договора</div>
                        <div style="font-size:12px;color:#9ca3af;margin-top:1px;font-family:Arial,Helvetica,sans-serif;">Автоматически сгенерированный документ</div>
                      </td>
                    </tr>
                  </table>

                  <!-- Row: contract number -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom:1px solid #f0f1f5;">
                    <tr>
                      <td style="padding:14px 0;font-size:13px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif;">&#9702; &nbsp;№ Договора</td>
                      <td style="padding:14px 0;font-size:14px;font-weight:700;color:#6366f1;text-align:right;font-family:Arial,Helvetica,sans-serif;">${safeContract}</td>
                    </tr>
                  </table>

                  <!-- Row: work title -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom:1px solid #f0f1f5;">
                    <tr>
                      <td style="padding:14px 0;font-size:13px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif;">&#9702; &nbsp;Произведение</td>
                      <td style="padding:14px 0;font-size:14px;font-weight:600;color:#1f2937;text-align:right;font-family:Arial,Helvetica,sans-serif;">«${safeWork}»</td>
                    </tr>
                  </table>

                  <!-- Row: release type -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding:14px 0;font-size:13px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif;">&#9702; &nbsp;Тип релиза</td>
                      <td style="padding:14px 0;text-align:right;">
                        <span style="display:inline-block;background-color:#eef2ff;color:#6366f1;padding:4px 14px;border-radius:8px;font-size:12px;font-weight:700;font-family:Arial,Helvetica,sans-serif;">${safeRelease}</span>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
              <tr>
                <td align="center">
                  <a href="${safeLink}" style="display:inline-block;background-color:#6366f1;background-image:linear-gradient(135deg,#6366f1,#7c3aed);color:#ffffff;text-decoration:none;padding:18px 56px;border-radius:14px;font-weight:700;font-size:16px;font-family:Arial,Helvetica,sans-serif;">
                    &#9997;&#65039; Подписать договор
                  </a>
                  <div style="color:#b0b8c9;font-size:12px;margin-top:12px;font-weight:500;font-family:Arial,Helvetica,sans-serif;">Ссылка действительна 7 дней</div>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
              <tr><td style="height:1px;background-color:#e5e7eb;font-size:0;line-height:0;">&nbsp;</td></tr>
            </table>

            <!-- Support block -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f3ff;border:1px solid #e0e7ff;border-radius:14px;margin-bottom:20px;">
              <tr>
                <td style="padding:22px 26px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="56" valign="middle">
                        <div style="width:44px;height:44px;background-image:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:12px;text-align:center;line-height:44px;font-size:20px;">💬</div>
                      </td>
                      <td valign="middle" style="padding-left:16px;">
                        <div style="color:#1f2937;font-size:14px;font-weight:700;margin-bottom:3px;font-family:Arial,Helvetica,sans-serif;">Есть вопросы по дистрибуции?</div>
                        <div style="color:#6b7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">Напишите нам в Telegram: <a href="https://t.me/pfvmusic_support" style="color:#6366f1;font-weight:700;text-decoration:none;">@pfvmusic_support</a></div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Fallback block -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fffdf5;border:1px solid #fde68a;border-radius:14px;margin-bottom:8px;">
              <tr>
                <td style="padding:22px 26px;">
                  <div style="color:#92400e;font-size:14px;font-weight:700;margin-bottom:10px;font-family:Arial,Helvetica,sans-serif;">⚠️ Кнопка не работает?</div>
                  <div style="color:#a16207;font-size:13px;line-height:1.65;margin-bottom:14px;font-family:Arial,Helvetica,sans-serif;">Скопируйте адрес ниже и вставьте в строку браузера:</div>
                  <div style="background-color:#fefce8;border:1px dashed #fbbf24;border-radius:10px;padding:12px 16px;font-size:12px;color:#6366f1;word-break:break-all;font-family:monospace;line-height:1.6;">${safeLink}</div>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- ===== FOOTER ===== -->
        <tr>
          <td style="background-color:#141428;background-image:linear-gradient(145deg,#0e0e1a,#1b1b3a);padding:40px 44px;text-align:center;">

            <!-- Footer logo -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
              <tr>
                <td align="center">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="36" height="32" style="background-image:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:8px;text-align:center;line-height:32px;font-size:14px;">🎵</td>
                      <td style="padding-left:10px;color:#c7d2fe;font-size:15px;font-weight:800;letter-spacing:3px;font-family:Arial,Helvetica,sans-serif;vertical-align:middle;">PFVMUSIC</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <div style="color:#9ca3af;font-size:14px;line-height:1.6;margin-bottom:6px;font-family:Arial,Helvetica,sans-serif;">
              С уважением, Музыкальное издательство <strong style="color:#c7d2fe;">PFVMUSIC</strong>
            </div>
            <a href="mailto:booking@pfvmusic.digital" style="color:#818cf8;font-size:13px;text-decoration:none;font-weight:600;font-family:Arial,Helvetica,sans-serif;">booking@pfvmusic.digital</a>

            <!-- Divider -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
              <tr><td style="height:1px;background-color:rgba(255,255,255,0.06);font-size:0;line-height:0;">&nbsp;</td></tr>
            </table>

            <div style="color:#4b5563;font-size:11px;line-height:1.8;max-width:460px;margin:0 auto 16px;font-style:italic;font-family:Arial,Helvetica,sans-serif;">
              Это письмо и все приложения к нему строго конфиденциальны и предназначены исключительно для указанного адресата. Если вы получили это письмо по ошибке, пожалуйста, немедленно уведомите отправителя и удалите сообщение.
            </div>
            <div style="color:#374151;font-size:11px;font-weight:500;font-family:Arial,Helvetica,sans-serif;">&#169; 2026 PFVMUSIC. Все права защищены.</div>

          </td>
        </tr>

      </table>
      <!-- /email card -->

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
