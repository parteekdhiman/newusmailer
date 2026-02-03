import nodemailer from 'nodemailer';
import { enableCORS } from './cors.js';
import { validateEmail, validatePhone, validateName, escapeHtml } from '../shared/sanitize.js';

// Helper to convert base64 to buffer for attachments
const processAttachment = (base64Str, filename) => {
  if (!base64Str || typeof base64Str !== 'string') return null;
  
  // Remove data URL prefix (e.g., "data:image/png;base64,")
  const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  
  if (matches && matches.length === 3) {
    return {
      filename: filename,
      content: Buffer.from(matches[2], 'base64'),
      contentType: matches[1]
    };
  }
  
  // Fallback if no prefix logic
  return {
     filename: filename,
     content: Buffer.from(base64Str, 'base64')
  };
};

export default async function handler(req, res) {
  // Enable CORS
  if (enableCORS(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      fullName, 
      email, 
      phone, 
      photo, 
      tenthCertificate, 
      twelfthCertificate, 
      higherEducationCertificate, 
      cv 
    } = req.body;

    // Validate inputs
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (!validatePhone(phone)) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    if (!validateName(fullName)) {
      return res.status(400).json({ error: 'Invalid name' });
    }

    // Prepare attachments
    const attachments = [];
    
    if (photo) attachments.push(processAttachment(photo, `Photo_${fullName.replace(/\s+/g, '_')}.png`));
    if (tenthCertificate) attachments.push(processAttachment(tenthCertificate, `10th_Certificate.pdf`));
    if (twelfthCertificate) attachments.push(processAttachment(twelfthCertificate, `12th_Certificate.pdf`));
    if (higherEducationCertificate) attachments.push(processAttachment(higherEducationCertificate, `Higher_Education_Certificate.pdf`));
    if (cv) attachments.push(processAttachment(cv, `CV_${fullName.replace(/\s+/g, '_')}.pdf`));

    // Filter out nulls
    const validAttachments = attachments.filter(a => a !== null);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true' || false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email to Admin
    const adminMail = {
      from: `"Newus Registration" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL, // Send to configured admin
      subject: `🎓 New Student Registration: ${fullName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #4F46E5;">New Student Registration</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Full Name</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(fullName)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Email</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(email)}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Phone</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(phone)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Registration Fee</td>
              <td style="padding: 10px; border: 1px solid #ddd;">₹299</td>
            </tr>
          </table>
          <p style="margin-top: 20px; color: #666;">
            <strong>Attachments:</strong> ${validAttachments.length} files attached.
          </p>
        </div>
      `,
      attachments: validAttachments
    };

    // Email to Student (Confirmation)
    const studentMail = {
      from: `"Newus Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Registration Received - Newus Job Fair`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #4F46E5;">Registration Received</h2>
          <p>Dear ${escapeHtml(fullName)},</p>
          <p>Thank you for registering for the Job Fair. We have received your application and documents.</p>
          <p>Our team will review your application and get back to you soon.</p>
          <br>
          <p>Best Regards,</p>
          <p><strong>The Newus Team</strong></p>
        </div>
      `
    };

    await transporter.sendMail(adminMail);
    await transporter.sendMail(studentMail);

    res.status(200).json({ ok: true, message: 'Registration submitted successfully' });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Internal server error while processing registration.' });
  }
}
