import nodemailer from 'nodemailer';
import { enableCORS } from './cors.js';

export default async function handler(req, res) {
    // Enable CORS
    if (enableCORS(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { fullName, email, phone, course } = req.body;
    if (!fullName || !email || !phone || !course) {
        return res.status(400).json({ ok: false, error: 'Missing required fields (name, email, phone, course)' });
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
        // Send email to admin
        await transporter.sendMail({
            from: `"Newus Courses" <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL,
            subject: `🎓 New Brochure Download Request – ${course}`,
            html: `
  <div style="background:#f4f6f8;padding:30px;font-family:Arial,sans-serif;">
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
      
      <div style="padding:20px;color:#333;">
        <h2 style="color:#1e40af;margin:0 0 15px 0;">📘 New Brochure Download Request</h2>
        <p>A user has requested to download your course brochure.</p>

        <table style="width:100%;border-collapse:collapse;margin-top:20px;background:#f9fafb;">
          <tr>
            <td style="padding:10px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Name</td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${fullName}</td>
          </tr>
          <tr>
            <td style="padding:10px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Email</td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${email}</td>
          </tr>
          <tr>
            <td style="padding:10px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Phone</td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${phone}</td>
          </tr>
          <tr>
            <td style="padding:10px;font-weight:bold;">Course</td>
            <td style="padding:10px;">${course}</td>
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

        // Return success - client will handle the brochure download
        res.status(200).json({ 
            ok: true, 
            message: "Thank you! Your brochure is ready for download.",
            data: {
                name: fullName,
                email: email,
                phone: phone,
                course: course
            }
        });
    } catch (err) {
        console.error("Course Inquiry Error:", err);
        res.status(500).json({ ok: false, error: "Inquiry failed" });
    }
}
