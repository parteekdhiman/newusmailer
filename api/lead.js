import nodemailer from 'nodemailer';
import { enableCORS } from './cors.js';

export default async function handler(req, res) {
  // Enable CORS
  if (enableCORS(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fullName, email, phone, course, brochureUrl } = req.body;

  if (!fullName || !email || !phone || !course) {
    return res
      .status(400)
      .json({ ok: false, error: 'Missing required fields' });
  }

  // Create transporter using environment variables
  const transporter = nodemailer.createTransporter({
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
      from: `"Newus Courses" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `📚 Course Inquiry: ${course}`,
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
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:600;">📚 New Course Inquiry</h1>
                      <p style="margin:10px 0 0;color:#e0e7ff;font-size:14px;">Brochure download request received</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding:40px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom:24px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fc;border-radius:8px;padding:20px;">
                              <tr>
                                <td style="padding:8px 0;">
                                  <span style="color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Course Interest</span>
                                  <p style="margin:4px 0 0;color:#667eea;font-size:18px;font-weight:700;">${course}</p>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:8px 0;border-top:1px solid #e5e7eb;">
                                  <span style="color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Full Name</span>
                                  <p style="margin:4px 0 0;color:#111827;font-size:16px;font-weight:600;">${fullName}</p>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:8px 0;border-top:1px solid #e5e7eb;">
                                  <span style="color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Email</span>
                                  <p style="margin:4px 0 0;color:#111827;font-size:16px;font-weight:600;">
                                    <a href="mailto:${email}" style="color:#667eea;text-decoration:none;">${email}</a>
                                  </p>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:8px 0;border-top:1px solid #e5e7eb;">
                                  <span style="color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Phone</span>
                                  <p style="margin:4px 0 0;color:#111827;font-size:16px;font-weight:600;">
                                    <a href="tel:${phone}" style="color:#667eea;text-decoration:none;">${phone}</a>
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        
                        <tr>
                          <td align="center" style="padding-top:20px;">
                            <a href="mailto:${email}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">Contact Lead</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
                      <p style="margin:0;color:#9ca3af;font-size:13px;">
                        This notification was sent from your Newus course inquiry form
                      </p>
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

    // Email to user with brochure link
    const userMail = {
      from: `"Newus Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `📚 Your ${course} Brochure is Ready!`,
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
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:50px 40px;text-align:center;">
                      <div style="background-color:rgba(255,255,255,0.2);width:80px;height:80px;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
                        <span style="font-size:40px;">📚</span>
                      </div>
                      <h1 style="margin:0;color:#ffffff;font-size:32px;font-weight:700;">Your Brochure is Ready!</h1>
                      <p style="margin:12px 0 0;color:#e0e7ff;font-size:16px;">Thanks for your interest in ${course}</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding:40px;">
                      <p style="margin:0 0 20px;color:#111827;font-size:18px;font-weight:600;">Hi ${fullName},</p>
                      <p style="margin:0 0 24px;color:#4b5563;font-size:16px;line-height:1.6;">
                        Thank you for your interest in our <strong style="color:#667eea;">${course}</strong> course! 
                        We're excited to help you on your learning journey.
                      </p>
                      
                      ${brochureUrl ? `
                      <div style="background:linear-gradient(135deg,#f0f4ff 0%,#f5f3ff 100%);border-radius:10px;padding:24px;margin-bottom:24px;text-align:center;">
                        <p style="margin:0 0 16px;color:#667eea;font-size:14px;font-weight:600;">Download Your Brochure</p>
                        <a href="${brochureUrl}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">📥 Download Brochure</a>
                      </div>
                      ` : ''}
                      
                      <div style="background-color:#f8f9fc;border-radius:10px;padding:24px;margin-bottom:24px;">
                        <p style="margin:0 0 12px;color:#667eea;font-size:14px;font-weight:600;">What's Next?</p>
                        <ul style="margin:0;padding-left:20px;color:#4b5563;font-size:14px;line-height:1.8;">
                          <li>Review the course curriculum and structure</li>
                          <li>Our team will reach out within 24 hours</li>
                          <li>We'll answer any questions you may have</li>
                          <li>Get personalized guidance on enrollment</li>
                        </ul>
                      </div>
                      
                      <p style="margin:24px 0 0;color:#4b5563;font-size:15px;line-height:1.6;">
                        Have questions? Feel free to reply to this email anytime!<br/><br/>
                        Best regards,<br/>
                        <strong style="color:#111827;font-size:16px;">The Newus Team</strong>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#f9fafb;padding:32px;text-align:center;border-top:1px solid #e5e7eb;">
                      <p style="margin:0 0 16px;color:#6b7280;font-size:14px;">
                        Ready to enroll? We're here to help!
                      </p>
                      <div style="margin-top:24px;padding-top:24px;border-top:1px solid #e5e7eb;">
                        <p style="margin:0;color:#9ca3af;font-size:12px;">
                          © ${new Date().getFullYear()} Newus. All rights reserved.
                        </p>
                      </div>
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

    // Send both emails
    await transporter.sendMail(adminMail);
    await transporter.sendMail(userMail);

    // IMPORTANT: Return the brochureUrl in the response
    res.status(200).json({ 
      ok: true, 
      emailSent: true,
      brochureUrl: brochureUrl || null
    });
  } catch (err) {
    console.error("Course Inquiry Error:", err);
    res.status(500).json({ ok: false, error: "Email sending failed" });
  }
}