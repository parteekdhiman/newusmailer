import nodemailer from 'nodemailer';
import { enableCORS } from './cors.js';

export default async function handler(req, res) {
  // Enable CORS
  if (enableCORS(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fullName, email, phone, companyName, designation, experience, expertise } = req.body;

  if (!fullName || !email || !phone || !companyName || !designation) {
    return res
      .status(400)
      .json({ ok: false, error: 'Missing required fields (fullName, email, phone, companyName, designation)' });
  }

  // Create transporter using environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true' || false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    // Email to admin
    const adminMail = {
      from: `"Newus Job Fair" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `👔 Interviewer Registration: ${fullName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);padding:30px 40px;color:#ffffff;text-align:center;">
                      <h1 style="margin:0;font-size:24px;font-weight:600;">New Interviewer Registration</h1>
                      <p style="margin:10px 0 0 0;font-size:16px;opacity:0.9;">Someone wants to join as an interviewer!</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding:10px 0;border-bottom:1px solid #e1e5e9;">
                            <strong style="color:#374151;">Full Name:</strong> ${fullName}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0;border-bottom:1px solid #e1e5e9;">
                            <strong style="color:#374151;">Email:</strong> <a href="mailto:${email}" style="color:#667eea;text-decoration:none;">${email}</a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0;border-bottom:1px solid #e1e5e9;">
                            <strong style="color:#374151;">Phone:</strong> <a href="tel:${phone}" style="color:#667eea;text-decoration:none;">${phone}</a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0;border-bottom:1px solid #e1e5e9;">
                            <strong style="color:#374151;">Company Name:</strong> ${companyName}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0;border-bottom:1px solid #e1e5e9;">
                            <strong style="color:#374151;">Designation:</strong> ${designation}
                          </td>
                        </tr>
                        ${experience ? `<tr>
                          <td style="padding:10px 0;border-bottom:1px solid #e1e5e9;">
                            <strong style="color:#374151;">Years of Experience:</strong> ${experience}
                          </td>
                        </tr>` : ''}
                        ${expertise ? `<tr>
                          <td style="padding:10px 0;border-bottom:1px solid #e1e5e9;">
                            <strong style="color:#374151;">Expertise:</strong> ${expertise}
                          </td>
                        </tr>` : ''}
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e1e5e9;">
                      <p style="margin:0;color:#6b7280;font-size:14px;">This registration was submitted from the Newus website.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(adminMail);

    // Email to user
    const userMail = {
      from: `"Newus Job Fair" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Thank you for registering as an Interviewer, ${fullName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);padding:30px 40px;color:#ffffff;text-align:center;">
                      <h1 style="margin:0;font-size:24px;font-weight:600;">Registration Confirmed!</h1>
                      <p style="margin:10px 0 0 0;font-size:16px;opacity:0.9;">Thank you for joining our interviewer pool</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px;text-align:center;">
                      <p style="margin:0 0 20px 0;color:#374151;font-size:16px;">Hi ${fullName},</p>
                      <p style="margin:0 0 20px 0;color:#374151;font-size:16px;">Thank you for registering to be an interviewer at Newus Job Fair. We have received your details and will contact you soon with more information.</p>
                      <p style="margin:0 0 20px 0;color:#374151;font-size:16px;">If you have any questions, feel free to reply to this email.</p>
                      <p style="margin:0;color:#6b7280;font-size:14px;">Best regards,<br>The Newus Team</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(userMail);

    res.status(200).json({ ok: true, message: 'Registration successful! Check your email for confirmation.' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ ok: false, error: 'Failed to send email. Please try again.' });
  }
}