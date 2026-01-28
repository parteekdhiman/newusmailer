import nodemailer from 'nodemailer';
import { enableCORS } from './cors.js';
import { validateEmail, validatePhone, validateName, validateTextField, escapeHtml } from '../shared/sanitize.js';
import { rateLimitMiddleware } from '../shared/rateLimiter.js';

export default async function handler(req, res) {
  // Enable CORS
  if (enableCORS(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // SECURITY: Rate limit by IP (prevent spam abuse)
  if (rateLimitMiddleware(req, res, 'ip', 3, 60 * 60 * 1000)) return;

  const { fullName, email, phone, companyName, designation, experience, expertise } = req.body;

  // SECURITY: Validate and sanitize all inputs
  const validatedEmail = validateEmail(email);
  if (!validatedEmail) {
    return res.status(400).json({ ok: false, error: 'Invalid email address' });
  }

  const validatedPhone = validatePhone(phone);
  if (!validatedPhone) {
    return res.status(400).json({ ok: false, error: 'Invalid phone number' });
  }

  const validatedName = validateName(fullName);
  if (!validatedName) {
    return res.status(400).json({ ok: false, error: 'Invalid name format' });
  }

  const validatedCompany = validateTextField(companyName, 1, 200);
  if (!validatedCompany) {
    return res.status(400).json({ ok: false, error: 'Invalid company name' });
  }

  const validatedDesignation = validateTextField(designation, 1, 200);
  if (!validatedDesignation) {
    return res.status(400).json({ ok: false, error: 'Invalid designation' });
  }

  // Optional fields
  const validatedExperience = experience ? validateTextField(experience, 0, 100) : null;
  const validatedExpertise = expertise ? validateTextField(expertise, 0, 1000) : null;

  // SECURITY: Validate admin email is configured
  if (!process.env.ADMIN_EMAIL || !validateEmail(process.env.ADMIN_EMAIL)) {
    console.error('Admin email not properly configured');
    return res.status(500).json({ ok: false, error: 'Service configuration error' });
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
    // SECURITY: Set timeout for email operations (prevent hanging)
    const emailTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Email timeout')), 25000)
    );

    // Email to admin - SECURITY: Escape all user input in HTML
    const adminMailPromise = transporter.sendMail({
      from: `"Newus Job Fair" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `👔 Interviewer Registration: ${escapeHtml(validatedName)}`,
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
                            <strong style="color:#374151;">Full Name:</strong> ${escapeHtml(validatedName)}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0;border-bottom:1px solid #e1e5e9;">
                            <strong style="color:#374151;">Email:</strong> <a href="mailto:${escapeHtml(validatedEmail)}" style="color:#667eea;text-decoration:none;">${escapeHtml(validatedEmail)}</a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0;border-bottom:1px solid #e1e5e9;">
                            <strong style="color:#374151;">Phone:</strong> <a href="tel:${escapeHtml(validatedPhone)}" style="color:#667eea;text-decoration:none;">${escapeHtml(validatedPhone)}</a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0;border-bottom:1px solid #e1e5e9;">
                            <strong style="color:#374151;">Company Name:</strong> ${escapeHtml(validatedCompany)}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0;border-bottom:1px solid #e1e5e9;">
                            <strong style="color:#374151;">Designation:</strong> ${escapeHtml(validatedDesignation)}
                          </td>
                        </tr>
                        ${validatedExperience ? `<tr>
                          <td style="padding:10px 0;border-bottom:1px solid #e1e5e9;">
                            <strong style="color:#374151;">Years of Experience:</strong> ${escapeHtml(validatedExperience)}
                          </td>
                        </tr>` : ''}
                        ${validatedExpertise ? `<tr>
                          <td style="padding:10px 0;border-bottom:1px solid #e1e5e9;">
                            <strong style="color:#374151;">Expertise:</strong> ${escapeHtml(validatedExpertise)}
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
    });

    // Email to user
    const userMailPromise = transporter.sendMail({
      from: `"Newus Job Fair" <${process.env.EMAIL_USER}>`,
      to: validatedEmail,
      subject: `Thank you for registering as an Interviewer, ${escapeHtml(validatedName)}!`,
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
                      <p style="margin:0 0 20px 0;color:#374151;font-size:16px;">Hi ${escapeHtml(validatedName)},</p>
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
    });

    // Wait for both emails with timeout
    await Promise.race([Promise.all([adminMailPromise, userMailPromise]), emailTimeout]);

    res.status(200).json({ ok: true, message: 'Registration successful! Check your email for confirmation.' });
  } catch (error) {
    // SECURITY: Don't leak error details to client
    const errorMsg = error.message || 'Unknown error';
    
    if (errorMsg === 'Email timeout') {
      return res.status(504).json({ ok: false, error: 'Service timeout. Please try again.' });
    }
    
    if (errorMsg.includes('Invalid login') || errorMsg.includes('Authentication failed')) {
      console.error('Email authentication failed - check EMAIL_USER/EMAIL_PASS');
      return res.status(500).json({ ok: false, error: 'Service configuration error' });
    }

    console.error('Interviewer Registration Error:', { message: errorMsg, code: error.code });
    res.status(500).json({ ok: false, error: 'Failed to send email. Please try again.' });
  }
}