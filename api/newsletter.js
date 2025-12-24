import nodemailer from 'nodemailer';
import { enableCORS } from './cors.js';

export default async function handler(req, res) {
    // Enable CORS
    if (enableCORS(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ ok: false, error: 'Email is required' });
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
        await transporter.sendMail({
            from: `"Newus Newsletter" <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL,
            subject: "📬 New Newsletter Subscription",
            html: `<p>New subscriber: <b>${email}</b></p>`,
        });

        await transporter.sendMail({
            from: `"Newus Team" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "🎉 Welcome to Newus Newsletter!",
            html: `
        <div style="padding:20px;background:#f0f9ff;">
          <h2>Welcome aboard! 🎉</h2>
          <p>You've successfully subscribed to our newsletter.</p>
          <p style="margin-top:20px;font-size:12px;color:#6b7280;">© ${new Date().getFullYear()} Newus. All rights reserved.</p>
        </div>
      `,
        });

        res.status(200).json({ ok: true, emailSent: true });
    } catch (err) {
        console.error("Newsletter Error:", err);
        res.status(500).json({ ok: false, error: "Subscription failed" });
    }
}