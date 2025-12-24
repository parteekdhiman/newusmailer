import nodemailer from 'nodemailer';
import { enableCORS } from './cors.js';

export default async function handler(req, res) {
    // Enable CORS
    if (enableCORS(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { fullName, email, course, phone, brochureUrl } = req.body;
    if (!fullName || !email || !course) {
        return res.status(400).json({ ok: false, error: 'Missing fields' });
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
            from: `"Newus Courses" <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL,
            subject: `🎓 New Course Inquiry – ${course}`,
            html: `
  <div style="background:#f4f6f8;padding:30px;font-family:Arial,sans-serif;">
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:8px;overflow:hidden;">
      
      <!-- Header with Logo -->

      <div style="padding:20px;color:#333;">
        <p>You have received a new course inquiry.</p>

        <table style="width:100%;border-collapse:collapse;margin-top:15px;">
          <tr>
            <td style="padding:8px;font-weight:bold;">Name</td>
            <td style="padding:8px;">${fullName}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="padding:8px;font-weight:bold;">Email</td>
            <td style="padding:8px;">${email}</td>
          </tr>
          <tr>
            <td style="padding:8px;font-weight:bold;">Phone</td>
            <td style="padding:8px;">${phone || "Not provided"}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="padding:8px;font-weight:bold;">Course</td>
            <td style="padding:8px;">${course}</td>
          </tr>
        </table>
      </div>

      <div style="background:#f1f5f9;text-align:center;padding:12px;font-size:12px;color:#666;">
        Newus Admin Panel • Automated Notification
      </div>
    </div>
  </div>
  `,
        });

        await transporter.sendMail({
            from: `"Newus Team" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `📘 We Received Your Inquiry – ${course}`,
            html: `
  <div style="background:#f4f6f8;padding:30px;font-family:Arial,sans-serif;">
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:8px;overflow:hidden;">

      <!-- Header -->
      <div style="padding:25px;color:#333;">
        <h2 style="color:#1e40af;">Hello ${fullName} 👋</h2>

        <p>
          Thank you for your interest in our <b>${course}</b>.
          We're excited to help you take the next step in your career!
        </p>

        <ul style="padding-left:18px;">
          <li>📚 Detailed syllabus</li>
          <li>⏳ Course duration & fees</li>
          <li>🎯 Career guidance</li>
        </ul>

        ${brochureUrl
                    ? `<p style="margin-top:20px;">
                <a href="${brochureUrl}"
                   style="display:inline-block;padding:12px 22px;
                   background:#1e40af;color:white;text-decoration:none;
                   border-radius:6px;font-weight:bold;">
                  📄 Download Course Brochure
                </a>
              </p>`
                    : ""
                }

        <p style="margin-top:30px;">
          Regards,<br/>
          <b>Newus Team</b>
        </p>
      </div>

      <div style="background:#f1f5f9;text-align:center;padding:12px;font-size:12px;color:#666;">
        © ${new Date().getFullYear()} Newus Academy • All Rights Reserved
      </div>
    </div>
  </div>
  `,
        });

        res.status(200).json({ ok: true, emailSent: true, brochureUrl });
    } catch (err) {
        console.error("Course Inquiry Error:", err);
        res.status(500).json({ ok: false, error: "Inquiry failed" });
    }
}