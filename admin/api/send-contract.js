import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        const { email, name, contractNumber, signLink } = req.body || {};

        if (!email || !signLink) {
            return res.status(400).json({ success: false, error: 'Missing email or signLink' });
        }

        // Validate email format
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
            auth: {
                user: smtpUser,
                pass: smtpPass,
            }
        });

        const safeName = String(name || 'уважаемый артист').replace(/[<>"]/g, '');
        const safeContract = String(contractNumber || 'Б/Н').replace(/[<>"]/g, '');
        const safeLink = String(signLink).replace(/"/g, '&quot;');

        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #6a1b9a; margin-top: 0;">Ваш договор готов</h2>
        <p>Здравствуйте, <strong>${safeName}</strong>!</p>
        <p>Ваш лицензионный договор <strong>№ ${safeContract}</strong> успешно сгенерирован.</p>
        <p>Пожалуйста, ознакомьтесь с ним и подпишите по ссылке ниже:</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${safeLink}" style="background-color: #6a1b9a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Открыть и подписать договор</a>
        </div>
        
        <p style="color: #666; font-size: 14px;">Если кнопка не работает, скопируйте эту ссылку в браузер:</p>
        <p style="font-size: 13px; color: #6a1b9a; word-break: break-all; background-color: #f7effa; padding: 10px; border-radius: 4px;">${safeLink}</p>
        
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
        <p style="font-size: 12px; color: #999;">Это автоматическое письмо. Пожалуйста, не отвечайте на него.</p>
        <p style="font-size: 12px; color: #999; margin-top: 5px;">С уважением, команда <strong>PFVMUSIC</strong>.</p>
      </div>
    `;

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
