import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

// Load .env only when running locally
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app = express();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(express.json());

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ------------------ ROUTES ------------------

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Newus API</title>
    </head>
    <body>
      <h1>🚀 Welcome to Newus API</h1>
      <p>Endpoints:</p>
      <ul>
        <li><a href="/api/health">/api/health</a></li>
        <li><a href="/api/lead">/api/lead</a></li>
      </ul>
    </body>
    </html>
  `);
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Backend server is running ✅" });
});

// Lead submission
app.post("/lead", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body;

    if (!firstName || !lastName || !email || !phone) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing required fields" });
    }

    const adminMail = {
      from: `"Newus Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `📩 New Contact from ${firstName} ${lastName}`,
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
                      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:600;">New Lead Received</h1>
                      <p style="margin:10px 0 0;color:#e0e7ff;font-size:14px;">Someone just contacted Newus!</p>
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
                                  <span style="color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Full Name</span>
                                  <p style="margin:4px 0 0;color:#111827;font-size:16px;font-weight:600;">${firstName} ${lastName}</p>
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
                        
                        ${
                          message
                            ? `
                        <tr>
                          <td style="padding-bottom:24px;">
                            <p style="margin:0 0 12px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
                            <div style="background-color:#f8f9fc;border-left:4px solid #667eea;border-radius:8px;padding:20px;">
                              <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">${message}</p>
                            </div>
                          </td>
                        </tr>
                        `
                            : ""
                        }
                        
                        <tr>
                          <td align="center" style="padding-top:20px;">
                            <a href="mailto:${email}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">Reply to Lead</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
                      <p style="margin:0;color:#9ca3af;font-size:13px;">
                        This notification was sent from your Newus contact form
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

    const userMail = {
      from: `"Newus Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Thanks for contacting Newus",
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
                        <span style="font-size:40px;">✅</span>
                      </div>
                      <h1 style="margin:0;color:#ffffff;font-size:32px;font-weight:700;">Message Received!</h1>
                      <p style="margin:12px 0 0;color:#e0e7ff;font-size:16px;">We'll get back to you soon</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding:40px;">
                      <p style="margin:0 0 20px;color:#111827;font-size:18px;font-weight:600;">Hi ${firstName},</p>
                      <p style="margin:0 0 24px;color:#4b5563;font-size:16px;line-height:1.6;">
                        Thank you for reaching out to us! We've received your message and our team will review it carefully. 
                        We typically respond within <strong style="color:#667eea;">24 hours</strong>.
                      </p>
                      
                      ${
                        message
                          ? `
                      <div style="background-color:#f8f9fc;border-radius:10px;padding:24px;margin-bottom:24px;">
                        <p style="margin:0 0 12px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Your Message:</p>
                        <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;font-style:italic;">"${message}"</p>
                      </div>
                      `
                          : ""
                      }
                      
                      <div style="background:linear-gradient(135deg,#f0f4ff 0%,#f5f3ff 100%);border-radius:10px;padding:24px;margin-bottom:24px;">
                        <p style="margin:0 0 12px;color:#667eea;font-size:14px;font-weight:600;">What happens next?</p>
                        <ul style="margin:0;padding-left:20px;color:#4b5563;font-size:14px;line-height:1.8;">
                          <li>Our team reviews your inquiry</li>
                          <li>We'll prepare a personalized response</li>
                          <li>You'll hear from us within 24 hours</li>
                        </ul>
                      </div>
                      
                      <p style="margin:24px 0 0;color:#4b5563;font-size:15px;line-height:1.6;">
                        Best regards,<br/>
                        <strong style="color:#111827;font-size:16px;">The Newus Team</strong>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#f9fafb;padding:32px;text-align:center;border-top:1px solid #e5e7eb;">
                      <p style="margin:0 0 16px;color:#6b7280;font-size:14px;">
                        Need immediate assistance?
                      </p>
                      <p style="margin:0;color:#9ca3af;font-size:13px;">
                        Reply to this email or call us at your convenience
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

    await transporter.sendMail(adminMail);
    await transporter.sendMail(userMail);

    res.json({ ok: true, emailSent: true });
  } catch (err) {
    console.error("Lead Error:", err);
    res.status(500).json({ ok: false, error: "Email sending failed" });
  }
});

// Newsletter
app.post("/newsletter", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ ok: false, error: "Email is required" });

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
          <p>You’ve successfully subscribed to our newsletter.</p>
          <p style="margin-top:20px;font-size:12px;color:#6b7280;">© ${new Date().getFullYear()} Newus. All rights reserved.</p>
        </div>
      `,
    });

    res.json({ ok: true, emailSent: true });
  } catch (err) {
    console.error("Newsletter Error:", err);
    res.status(500).json({ ok: false, error: "Subscription failed" });
  }
});

// Course inquiry
app.post("/course-inquiry", async (req, res) => {
  try {
    const { fullName, email, course, phone, brochureUrl } = req.body;
    if (!fullName || !email || !course) {
      return res.status(400).json({ ok: false, error: "Missing fields" });
    }

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
          We’re excited to help you take the next step in your career!
        </p>

        <ul style="padding-left:18px;">
          <li>📚 Detailed syllabus</li>
          <li>⏳ Course duration & fees</li>
          <li>🎯 Career guidance</li>
        </ul>

        ${
          brochureUrl
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

    res.json({ ok: true, emailSent: true, brochureUrl });
  } catch (err) {
    console.error("Course Inquiry Error:", err);
    res.status(500).json({ ok: false, error: "Inquiry failed" });
  }
});

// Export for Vercel
export default app;

// Start locally (dev only)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
