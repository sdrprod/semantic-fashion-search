import { Resend } from 'resend';

// Lazy initialization - only create Resend client when actually needed (not during build)
let resendClient: Resend | null = null;
function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourdomain.com';
const APP_NAME = 'Semantic Fashion Search';
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export async function sendVerificationEmail(
  email: string,
  code: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const verificationUrl = `${APP_URL}/verify-email?email=${encodeURIComponent(
      email
    )}&code=${code}`;

    const resend = getResendClient();
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
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
                This email was sent to ${email}
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Email] Error sending verification email:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Verification email sent to:', email);
    return { success: true };
  } catch (error: any) {
    console.error('[Email] Failed to send verification email:', error);
    return { success: false, error: error.message };
  }
}

export function generateVerificationCode(): string {
  // Generate a 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function isCodeExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}
