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
    if (rateLimitMiddleware(req, res, 'ip', 5, 60 * 60 * 1000)) return;

    const { fullName, email, phone, course } = req.body;

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

    const validatedCourse = validateTextField(course, 1, 200);
    if (!validatedCourse) {
        return res.status(400).json({ ok: false, error: 'Invalid course name' });
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

        // Send email to admin - SECURITY: Escape all user input in HTML
        const adminPromise = transporter.sendMail({
            from: `"Newus Courses" <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL,
            subject: `🎓 New Brochure Download Request – ${escapeHtml(validatedCourse)}`,
            html: `
  <div style="background:#f4f6f8;padding:30px;font-family:Arial,sans-serif;">
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
      
      <div style="padding:20px;color:#333;">
        <h2 style="color:#1e40af;margin:0 0 15px 0;">📘 New Brochure Download Request</h2>
        <p>A user has requested to download your course brochure.</p>

        <table style="width:100%;border-collapse:collapse;margin-top:20px;background:#f9fafb;">
          <tr>
            <td style="padding:10px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Name</td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(validatedName)}</td>
          </tr>
          <tr>
            <td style="padding:10px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Email</td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(validatedEmail)}</td>
          </tr>
          <tr>
            <td style="padding:10px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Phone</td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(validatedPhone)}</td>
          </tr>
          <tr>
            <td style="padding:10px;font-weight:bold;">Course</td>
            <td style="padding:10px;">${escapeHtml(validatedCourse)}</td>
          </tr>
        </table>

        <p style="margin-top:20px;padding:15px;background:#eff6ff;border-left:4px solid #1e40af;border-radius:4px;">
          <strong>👉 Next Step:</strong> Follow up with this lead to provide course details and enrollment information.
        </p>
      </div>

      <div style="background:#f1f5f9;text-align:center;padding:12px;font-size:12px;color:#666;">
        Newus Admin Panel • Automated Notification
      </div>
    </div>
  </div>
  `,
        });

        // Wait for email with timeout
        await Promise.race([adminPromise, emailTimeout]);

        // Return success - client will handle the brochure download
        res.status(200).json({ 
            ok: true, 
            message: "Thank you! Your brochure is ready for download.",
            data: {
                name: validatedName,
                email: validatedEmail,
                phone: validatedPhone,
                course: validatedCourse
            }
        });
    } catch (err) {
        // SECURITY: Don't leak error details to client
        const errorMsg = err.message || 'Unknown error';
        
        if (errorMsg === 'Email timeout') {
            return res.status(504).json({ ok: false, error: 'Service timeout. Please try again.' });
        }
        
        if (errorMsg.includes('Invalid login') || errorMsg.includes('Authentication failed')) {
            console.error('Email authentication failed - check EMAIL_USER/EMAIL_PASS');
            return res.status(500).json({ ok: false, error: 'Service configuration error' });
        }

        console.error("Course Inquiry Error:", { message: errorMsg, code: err.code });
        res.status(500).json({ ok: false, error: "Inquiry failed" });
    }
}
