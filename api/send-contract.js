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
            return res.status(400).json({ success: false, error: `Invalid email address: "${email}"` });
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

        const safeName = String(name || 'уважаемый автор').replace(/[<>"]/g, '');
        const safeContract = String(contractNumber || 'Б/Н').replace(/[<>"]/g, '');
        const safeWork = String(workTitle || '—').replace(/[<>"]/g, '');
        const safeRelease = String(releaseType || '—').replace(/[<>"]/g, '');
        const safeLink = String(signLink).replace(/"/g, '%22');

        const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PFVMUSIC — Договор готов к подписанию</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif}
    body{background:#f0f2f5;padding:40px 16px}
    .wrap{width:100%;max-width:620px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.08)}
    /* HEADER */
    .hdr{background:linear-gradient(145deg,#0e0e1a 0%,#1b1b3a 40%,#252552 70%,#1b1b3a 100%);padding:52px 40px 48px;text-align:center}
    .logo-box{width:68px;height:68px;border-radius:18px;background:linear-gradient(135deg,#6366f1,#8b5cf6,#a78bfa);display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;box-shadow:0 8px 28px rgba(99,102,241,.35)}
    .logo-title{color:#fff;font-size:26px;font-weight:900;letter-spacing:5px}
    .logo-sub{color:rgba(165,180,252,.5);font-size:11px;font-weight:600;letter-spacing:4px;text-transform:uppercase;margin-top:6px}
    /* BODY */
    .body{padding:44px 44px 36px}
    .greeting{color:#111827;font-size:22px;font-weight:800;margin-bottom:10px}
    .intro{color:#6b7280;font-size:15px;line-height:1.75;margin-bottom:32px}
    /* DETAILS */
    .card{background:#fafbfd;border:1px solid #eef0f4;border-radius:16px;padding:28px 30px;margin-bottom:32px}
    .card-hdr{display:flex;align-items:center;gap:14px;margin-bottom:22px;padding-bottom:18px;border-bottom:1px solid #eef0f4}
    .card-icon{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(99,102,241,.2)}
    .card-ttl{font-size:16px;font-weight:700;color:#111827}
    .card-sub{font-size:12px;color:#9ca3af;margin-top:1px}
    .row{display:flex;justify-content:space-between;align-items:center;padding:14px 0}
    .row+.row{border-top:1px solid #f0f1f5}
    .lbl{color:#9ca3af;font-size:13px;font-weight:500;display:flex;align-items:center;gap:8px}
    .dot{width:6px;height:6px;border-radius:50%;background:#d1d5db;flex-shrink:0}
    .val{color:#1f2937;font-size:14px;font-weight:600;text-align:right}
    .val.hi{color:#6366f1;font-weight:700}
    .badge{display:inline-block;background:#eef2ff;color:#6366f1;padding:4px 14px;border-radius:8px;font-size:12px;font-weight:700}
    /* CTA */
    .cta-wrap{text-align:center;margin-bottom:36px}
    .btn{display:inline-block;background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;text-decoration:none;padding:18px 56px;border-radius:14px;font-weight:700;font-size:16px;letter-spacing:.3px;box-shadow:0 4px 12px rgba(99,102,241,.25),0 12px 32px rgba(99,102,241,.2)}
    .hint{color:#b0b8c9;font-size:12px;margin-top:12px;font-weight:500}
    .divider{height:1px;background:linear-gradient(90deg,transparent,#e5e7eb,transparent);margin:0 0 32px}
    /* SUPPORT */
    .sup{background:linear-gradient(135deg,#f0f7ff,#f5f3ff);border:1px solid #e0e7ff;border-radius:14px;padding:22px 26px;display:flex;align-items:center;gap:16px;margin-bottom:20px}
    .sup-icon{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#3b82f6,#6366f1);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .sup-ttl{color:#1f2937;font-size:14px;font-weight:700;margin-bottom:3px}
    .sup-txt{color:#6b7280;font-size:13px;line-height:1.5}
    .sup-lnk{color:#6366f1;font-weight:700;text-decoration:none}
    /* FALLBACK */
    .fb{background:#fffdf5;border:1px solid #fde68a;border-radius:14px;padding:22px 26px;margin-bottom:8px}
    .fb-hdr{display:flex;align-items:center;gap:10px;margin-bottom:10px}
    .fb-ico{width:32px;height:32px;border-radius:8px;background:#fef3c7;display:flex;align-items:center;justify-content:center}
    .fb-ttl{color:#92400e;font-size:14px;font-weight:700}
    .fb-txt{color:#a16207;font-size:13px;line-height:1.65;margin-bottom:14px}
    .fb-url{background:#fefce8;border:1px dashed #fbbf24;border-radius:10px;padding:12px 16px;font-size:12px;color:#6366f1;word-break:break-all;font-family:monospace;line-height:1.6}
    /* FOOTER */
    .ftr{background:linear-gradient(145deg,#0e0e1a,#1b1b3a);padding:40px 44px;text-align:center}
    .ftr-logo{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:16px}
    .ftr-ico{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center}
    .ftr-name{color:#c7d2fe;font-size:15px;font-weight:800;letter-spacing:3px}
    .ftr-rg{color:#9ca3af;font-size:14px;line-height:1.6;margin-bottom:6px}
    .ftr-rg strong{color:#c7d2fe}
    .ftr-mail{color:#818cf8;font-size:13px;text-decoration:none;font-weight:600}
    .ftr-div{height:1px;background:rgba(255,255,255,.06);margin:24px 0}
    .ftr-disc{color:#4b5563;font-size:11px;line-height:1.8;max-width:460px;margin:0 auto 16px;font-style:italic}
    .ftr-copy{color:#374151;font-size:11px;font-weight:500}
  </style>
</head>
<body>
<div class="wrap">

  <!-- HEADER -->
  <div class="hdr">
    <div class="logo-box">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
        <path d="M9 18V5l12-2v13" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="6" cy="18" r="3" stroke="white" stroke-width="2.2"/>
        <circle cx="18" cy="16" r="3" stroke="white" stroke-width="2.2"/>
      </svg>
    </div>
    <div class="logo-title">PFVMUSIC</div>
    <div class="logo-sub">Издательство</div>
  </div>

  <!-- BODY -->
  <div class="body">
    <h1 class="greeting">Здравствуйте, ${safeName}!</h1>
    <p class="intro">
      Ваш договор успешно сгенерирован и готов к подписанию.<br>
      Пожалуйста, ознакомьтесь с деталями ниже и подтвердите документ, перейдя по ссылке.
    </p>

    <!-- Contract details -->
    <div class="card">
      <div class="card-hdr">
        <div class="card-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div>
          <div class="card-ttl">Детали договора</div>
          <div class="card-sub">Автоматически сгенерированный документ</div>
        </div>
      </div>
      <div class="row">
        <span class="lbl"><span class="dot"></span>№ Договора</span>
        <span class="val hi">${safeContract}</span>
      </div>
      <div class="row">
        <span class="lbl"><span class="dot"></span>Произведение</span>
        <span class="val">«${safeWork}»</span>
      </div>
      <div class="row">
        <span class="lbl"><span class="dot"></span>Тип релиза</span>
        <span class="val"><span class="badge">${safeRelease}</span></span>
      </div>
    </div>

    <!-- CTA -->
    <div class="cta-wrap">
      <a href="${safeLink}" class="btn">
        ✍️ Подписать договор
      </a>
      <p class="hint">Ссылка действительна 7 дней</p>
    </div>

    <div class="divider"></div>

    <!-- Support -->
    <div class="sup">
      <div class="sup-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div>
        <div class="sup-ttl">Есть вопросы по дистрибуции?</div>
        <div class="sup-txt">Напишите нам в Telegram: <a href="https://t.me/pfvmusic_support" class="sup-lnk">@pfvmusic_support</a></div>
      </div>
    </div>

    <!-- Fallback -->
    <div class="fb">
      <div class="fb-hdr">
        <div class="fb-ico">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="12" y1="9" x2="12" y2="13" stroke="#d97706" stroke-width="2" stroke-linecap="round"/>
            <line x1="12" y1="17" x2="12.01" y2="17" stroke="#d97706" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="fb-ttl">Кнопка не работает?</div>
      </div>
      <p class="fb-txt">Некоторые почтовые клиенты блокируют интерактивные элементы. Скопируйте адрес ниже и вставьте в браузер:</p>
      <div class="fb-url">${safeLink}</div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="ftr">
    <div class="ftr-logo">
      <div class="ftr-ico">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 18V5l12-2v13" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="6" cy="18" r="3" stroke="white" stroke-width="2.2"/>
          <circle cx="18" cy="16" r="3" stroke="white" stroke-width="2.2"/>
        </svg>
      </div>
      <span class="ftr-name">PFVMUSIC</span>
    </div>
    <p class="ftr-rg">С уважением, Музыкальное издательство <strong>PFVMUSIC</strong></p>
    <a href="mailto:booking@pfvmusic.digital" class="ftr-mail">booking@pfvmusic.digital</a>
    <div class="ftr-div"></div>
    <p class="ftr-disc">
      Это письмо и все приложения к нему строго конфиденциальны и предназначены исключительно для указанного адресата.
      Если вы получили это письмо по ошибке, пожалуйста, немедленно уведомите отправителя и удалите сообщение.
    </p>
    <p class="ftr-copy">© 2026 PFVMUSIC. Все права защищены.</p>
  </div>

</div>
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
