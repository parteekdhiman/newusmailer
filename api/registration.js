import nodemailer from 'nodemailer';
import { enableCORS } from './cors.js';
import { validateEmail, validateName, validateTextField, escapeHtml } from '../shared/sanitize.js';
import { rateLimitMiddleware } from '../shared/rateLimiter.js';
import { checkDuplicateRequest, storeDuplicateResponse } from '../shared/deduplicator.js';

/**
 * Validate Indian phone number
 * Indian mobile numbers are 10 digits, starting with 6, 7, 8, or 9
 * @param {string} phone - Phone number to validate
 * @returns {string|null} - Cleaned phone number or null if invalid
 */
const validateIndianPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return null;
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Indian numbers must be exactly 10 digits and start with 6-9
  const indianPhoneRegex = /^[6-9]\d{9}$/;
  
  if (!indianPhoneRegex.test(cleaned)) {
    return null;
  }
  
  return cleaned;
};

/**
 * Validate marks for 10th class (0-700)
 * @param {number|string} marks - Marks to validate
 * @returns {number|null} - Marks as number or null if invalid
 */
const validateTenthMarks = (marks) => {
  const num = Number(marks);
  if (isNaN(num) || num < 0 || num > 700) {
    return null;
  }
  return num;
};

/**
 * Validate marks for 12th class (0-500)
 * @param {number|string} marks - Marks to validate
 * @returns {number|null} - Marks as number or null if invalid
 */
const validateTwelfthMarks = (marks) => {
  const num = Number(marks);
  if (isNaN(num) || num < 0 || num > 500) {
    return null;
  }
  return num;
};

export default async function handler(req, res) {
  // Enable CORS
  if (enableCORS(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // SECURITY: Rate limit by email (prevent spam abuse)
  if (rateLimitMiddleware(req, res, 'email', 3, 60 * 60 * 1000)) return;

  const { name, fatherName, tenthMarks, twelfthMarks, email, phone } = req.body;

  // SECURITY: Validate and sanitize all inputs
  const validatedName = validateName(name);
  if (!validatedName) {
    return res.status(400).json({ ok: false, error: 'Invalid name format' });
  }

  const validatedFatherName = validateName(fatherName);
  if (!validatedFatherName) {
    return res.status(400).json({ ok: false, error: 'Invalid father name format' });
  }

  const validatedEmail = validateEmail(email);
  if (!validatedEmail) {
    return res.status(400).json({ ok: false, error: 'Invalid email address' });
  }

  const validatedPhone = validateIndianPhone(phone);
  if (!validatedPhone) {
    return res.status(400).json({ ok: false, error: 'Invalid Indian phone number (must be 10 digits starting with 6-9)' });
  }

  const validatedTenthMarks = validateTenthMarks(tenthMarks);
  if (validatedTenthMarks === null) {
    return res.status(400).json({ ok: false, error: 'Invalid 10th marks (must be 0-700)' });
  }

  const validatedTwelfthMarks = validateTwelfthMarks(twelfthMarks);
  if (validatedTwelfthMarks === null) {
    return res.status(400).json({ ok: false, error: 'Invalid 12th marks (must be 0-500)' });
  }

  // SECURITY: Prevent duplicate submissions
  const dedup = checkDuplicateRequest(req, 'registration', validatedEmail);
  if (dedup.isDuplicate) {
    return res.status(200).json({ ok: true, emailSent: true, isDuplicate: true });
  }

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
    const adminMail = {
      from: `"Newus Registration" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `📋 New Registration: ${escapeHtml(validatedName)}`,
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
                      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:600;">📋 New Student Registration</h1>
                      <p style="margin:10px 0 0;color:#e0e7ff;font-size:14px;">${new Date().toLocaleString()}</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding:40px;">
                      <h2 style="margin:0 0 20px;color:#333;font-size:18px;font-weight:600;">Registration Details</h2>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                        <tr style="background-color:#f9fafb;">
                          <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#666;font-weight:500;width:150px;">Name:</td>
                          <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#333;">${escapeHtml(validatedName)}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#666;font-weight:500;">Father's Name:</td>
                          <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#333;">${escapeHtml(validatedFatherName)}</td>
                        </tr>
                        <tr style="background-color:#f9fafb;">
                          <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#666;font-weight:500;">Email:</td>
                          <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#333;">${escapeHtml(validatedEmail)}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#666;font-weight:500;">Phone:</td>
                          <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#333;">+91-${validatedPhone.replace(/(\d{5})(\d{5})/, '$1-$2')}</td>
                        </tr>
                        <tr style="background-color:#f9fafb;">
                          <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#666;font-weight:500;">10th Marks:</td>
                          <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#333;">${validatedTenthMarks} / 700</td>
                        </tr>
                        <tr>
                          <td style="padding:12px;color:#666;font-weight:500;">12th Marks:</td>
                          <td style="padding:12px;color:#333;">${validatedTwelfthMarks} / 500</td>
                        </tr>
                      </table>

                      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
                      
                      <p style="margin:0;color:#666;font-size:12px;">
                        <strong>Action Required:</strong> Please contact the student to verify their details and proceed with enrollment.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
                      <p style="margin:0;color:#999;font-size:12px;">
                        This is an automated email from Newus Registration System
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

    // Email to user
    const userMail = {
      from: `"Newus" <${process.env.EMAIL_USER}>`,
      to: validatedEmail,
      subject: 'Registration Confirmation - Newus',
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
                      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:600;">✓ Registration Successful</h1>
                      <p style="margin:10px 0 0;color:#e0e7ff;font-size:14px;">Welcome to Newus</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding:40px;">
                      <p style="margin:0 0 20px;color:#333;font-size:16px;">Dear ${escapeHtml(validatedName)},</p>
                      
                      <p style="margin:0 0 20px;color:#666;font-size:14px;line-height:1.6;">
                        Thank you for registering with Newus! We have received your registration form with the following details:
                      </p>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background-color:#f9fafb;border-radius:8px;">
                        <tr>
                          <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#666;font-weight:500;">Name:</td>
                          <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#333;">${escapeHtml(validatedName)}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#666;font-weight:500;">Email:</td>
                          <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#333;">${escapeHtml(validatedEmail)}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px;color:#666;font-weight:500;">10th Marks:</td>
                          <td style="padding:12px;color:#333;">${validatedTenthMarks} / 700</td>
                        </tr>
                      </table>

                      <p style="margin:20px 0;color:#666;font-size:14px;line-height:1.6;">
                        Our team will review your registration and contact you shortly to provide further information about our courses and programs.
                      </p>

                      <p style="margin:0;color:#666;font-size:14px;">
                        Best regards,<br>
                        <strong>Newus Team</strong>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
                      <p style="margin:0;color:#999;font-size:12px;">
                        For support, contact us at support@newus.in
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

    // Send both emails in parallel
    await Promise.race([
      Promise.all([
        transporter.sendMail(adminMail),
        transporter.sendMail(userMail),
      ]),
      emailTimeout,
    ]);

    // Store successful response
    storeDuplicateResponse(req, 'registration', validatedEmail, { emailSent: true });

    return res.status(200).json({
      ok: true,
      emailSent: true,
      message: 'Registration successful! Check your email for confirmation.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to process registration. Please try again later.',
    });
  }
}
