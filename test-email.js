import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔧 Email Configuration Test');
console.log('============================\n');

console.log('Configuration:');
console.log(`EMAIL_HOST: ${process.env.EMAIL_HOST}`);
console.log(`EMAIL_PORT: ${process.env.EMAIL_PORT}`);
console.log(`EMAIL_SECURE: ${process.env.EMAIL_SECURE}`);
console.log(`EMAIL_USER: ${process.env.EMAIL_USER}`);
console.log(`ADMIN_EMAIL: ${process.env.ADMIN_EMAIL}`);
console.log('\n');

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

// Verify the transporter
console.log('🧪 Testing SMTP Connection...\n');

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Failed:');
    console.error('Error:', error.message);
    console.log('\n⚠️  Common Issues:');
    console.log('1. Wrong Email Password - Use App Password from Google Account');
    console.log('2. 2FA not enabled on Gmail - Enable 2FA first at https://myaccount.google.com/security');
    console.log('3. Allow Less Secure Apps - No longer available, must use App Password');
    console.log('4. Wrong EMAIL_HOST - Should be: smtp.gmail.com');
    console.log('5. Wrong EMAIL_PORT - Should be: 587 (or 465 for secure)');
    process.exit(1);
  } else {
    console.log('✅ SMTP Connection Successful!');
    console.log('\nReady to send emails. Your configuration is correct.\n');
    
    // Try sending a test email
    console.log('📧 Sending test email...\n');
    
    transporter.sendMail({
      from: `"Newus Test" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: '✅ Email Configuration Test - Newus',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f0f9ff;">
          <h2 style="color: #1e40af;">✅ Email Configuration Test</h2>
          <p>This is a test email to verify your SMTP configuration is working correctly.</p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Configuration Details:</h3>
            <p><strong>Host:</strong> ${process.env.EMAIL_HOST}</p>
            <p><strong>Port:</strong> ${process.env.EMAIL_PORT}</p>
            <p><strong>From:</strong> ${process.env.EMAIL_USER}</p>
            <p><strong>To:</strong> ${process.env.ADMIN_EMAIL}</p>
          </div>
          
          <p style="color: #6b7280; font-size: 12px;">If you received this email, your email configuration is working correctly!</p>
        </div>
      `,
    }, (err, info) => {
      if (err) {
        console.error('❌ Failed to send email:');
        console.error('Error:', err.message);
        process.exit(1);
      } else {
        console.log('✅ Test email sent successfully!');
        console.log(`Message ID: ${info.messageId}`);
        console.log('\n🎉 Your email configuration is working perfectly!');
        process.exit(0);
      }
    });
  }
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('\n❌ Connection timeout - SMTP server not responding');
  process.exit(1);
}, 10000);
