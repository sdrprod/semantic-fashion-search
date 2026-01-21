import { config } from 'dotenv';
import { Resend } from 'resend';

config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

console.log('Testing signup email flow...');
console.log('API Key:', process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : 'NOT SET');
console.log('From Email:', FROM_EMAIL);
console.log('');

// Simulate the exact email that gets sent during signup
async function testSignupEmail(toEmail, firstName) {
  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const APP_NAME = 'Semantic Fashion Search';
    const APP_URL = 'http://localhost:3000';

    const verificationUrl = `${APP_URL}/verify-email?email=${encodeURIComponent(toEmail)}&code=${code}`;

    console.log(`Sending verification email to: ${toEmail}`);
    console.log(`Verification code: ${code}`);
    console.log('');

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `Verify your email for ${APP_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${APP_NAME}!</h1>
            </div>

            <div style="background: #ffffff; padding: 40px; border: 1px solid #e1e4e8; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${firstName},</p>

              <p style="font-size: 16px; margin-bottom: 20px;">
                Thank you for signing up! To complete your registration, please verify your email address.
              </p>

              <div style="background: #f6f8fa; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Your verification code:</p>
                <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea; margin: 10px 0; font-family: 'Courier New', monospace;">
                  ${code}
                </p>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">This code expires in 10 minutes</p>
              </div>

              <p style="font-size: 16px; margin: 30px 0 20px 0; text-align: center;">Or click the button below:</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}"
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                If you didn't create an account, you can safely ignore this email.
              </p>

              <hr style="border: none; border-top: 1px solid #e1e4e8; margin: 30px 0;">

              <p style="font-size: 12px; color: #999; text-align: center;">
                ${APP_NAME}<br>
                This email was sent to ${toEmail}
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return false;
    }

    console.log('✅ Email sent successfully!');
    console.log('Email ID:', data.id);
    console.log('');
    console.log('Check:');
    console.log('1. Your inbox (including spam/junk folder)');
    console.log('2. Resend dashboard: https://resend.com/emails/' + data.id);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

// Replace this with the actual email you verified in Resend
const TEST_EMAIL = process.argv[2] || 'your-verified-email@example.com';

if (TEST_EMAIL === 'your-verified-email@example.com') {
  console.log('⚠️  Please provide your verified email address as an argument:');
  console.log('   node test-signup-email.mjs your-email@example.com');
  process.exit(1);
}

testSignupEmail(TEST_EMAIL, 'Test User');
