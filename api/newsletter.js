import nodemailer from 'nodemailer';
import { enableCORS } from './cors.js';
import { validateEmail, escapeHtml } from '../shared/sanitize.js';
import { rateLimitMiddleware } from '../shared/rateLimiter.js';
import { checkDuplicateRequest, storeDuplicateResponse } from '../shared/deduplicator.js';

export default async function handler(req, res) {
    // Enable CORS
    if (enableCORS(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // SECURITY: Rate limit by email address (prevent spam abuse)
    if (rateLimitMiddleware(req, res, 'email', 1, 60 * 60 * 1000)) return;

    const { email } = req.body;

    // SECURITY: Validate and sanitize email
    const validatedEmail = validateEmail(email);
    if (!validatedEmail) {
        return res.status(400).json({ ok: false, error: 'Invalid email address' });
    }

    // SECURITY: Prevent duplicate submissions
    const dedup = checkDuplicateRequest(req, 'newsletter', validatedEmail);
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

        // Send admin notification with escaped HTML
        const adminPromise = transporter.sendMail({
            from: `"Newus Newsletter" <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL,
            subject: "📬 New Newsletter Subscription",
            html: `<p>New subscriber: <b>${escapeHtml(validatedEmail)}</b></p>`,
        });

        // Send user confirmation
        const userPromise = transporter.sendMail({
            from: `"Newus Team" <${process.env.EMAIL_USER}>`,
            to: validatedEmail,
            subject: "🎉 Welcome to Newus Newsletter!",
            html: `
        <div style="padding:20px;background:#f0f9ff;">
          <h2>Welcome aboard! 🎉</h2>
          <p>You've successfully subscribed to our newsletter.</p>
          <p style="margin-top:20px;font-size:12px;color:#6b7280;">© ${new Date().getFullYear()} Newus. All rights reserved.</p>
        </div>
      `,
        });

        // Wait for both emails with timeout
        await Promise.race([Promise.all([adminPromise, userPromise]), emailTimeout]);

        const response = { ok: true, emailSent: true };
        
        // Store for deduplication (60 second window)
        storeDuplicateResponse(dedup.key, response, 60000);

        res.status(200).json(response);
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

        // Log full error for debugging but don't expose to client
        console.error('Newsletter Error:', { message: errorMsg, code: err.code });
        res.status(500).json({ ok: false, error: 'Subscription failed' });
    }
}