import nodemailer from 'nodemailer';
import { enableCORS } from './cors.js';
import { validateEmail, validateName, validateTextField, escapeHtml } from '../shared/sanitize.js';
import { rateLimitMiddleware } from '../shared/rateLimiter.js';

export default async function handler(req, res) {
  if (enableCORS(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (rateLimitMiddleware(req, res, 'email', 5, 60 * 60 * 1000)) return;

  const { name, email, phone, role, message } = req.body || {};

  const validatedName = validateName(name);
  if (!validatedName) {
    return res.status(400).json({ ok: false, error: 'Invalid name format' });
  }

  const validatedEmail = validateEmail(email);
  if (!validatedEmail) {
    return res.status(400).json({ ok: false, error: 'Invalid email address' });
  }

  const validatedRole = validateTextField(role, 1, 100) || 'Not specified';
  const validatedMessage = validateTextField(message, 10, 2000);
  if (!validatedMessage) {
    return res.status(400).json({ ok: false, error: 'Please provide a message with at least 10 characters' });
  }

  const validatedPhone = typeof phone === 'string' && phone.trim() ? validateTextField(phone, 1, 30) : 'Not provided';

  if (!process.env.ADMIN_EMAIL || !validateEmail(process.env.ADMIN_EMAIL)) {
    console.error('Admin email not configured');
    return res.status(500).json({ ok: false, error: 'Service configuration error' });
  }

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
    const mailOptions = {
      from: `"Newus Careers" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `Career enquiry from ${escapeHtml(validatedName)} for ${escapeHtml(validatedRole)}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="margin:0 0 12px;color:#111827;">New Career Enquiry</h2>
          <p><strong>Name:</strong> ${escapeHtml(validatedName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(validatedEmail)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(validatedPhone)}</p>
          <p><strong>Role:</strong> ${escapeHtml(validatedRole)}</p>
          <p><strong>Message:</strong><br/>${escapeHtml(validatedMessage)}</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ ok: true, message: 'Your enquiry has been sent successfully.' });
  } catch (error) {
    console.error('Career enquiry failed:', error);
    return res.status(500).json({ ok: false, error: 'Failed to send enquiry email.' });
  }
}
