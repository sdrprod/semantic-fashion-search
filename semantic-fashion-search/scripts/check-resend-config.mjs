#!/usr/bin/env node
/**
 * Check Resend configuration and test email sending
 * Run: node scripts/check-resend-config.mjs
 */

import { Resend } from 'resend';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

console.log('\n🔍 Checking Resend Configuration...\n');

// Check environment variables
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;
const APP_URL = process.env.NEXTAUTH_URL;

console.log('Environment Variables:');
console.log('  RESEND_API_KEY:', RESEND_API_KEY ? `✓ Set (${RESEND_API_KEY.substring(0, 10)}...)` : '❌ NOT SET');
console.log('  FROM_EMAIL:', FROM_EMAIL || '⚠️  Not set (using default)');
console.log('  NEXTAUTH_URL:', APP_URL || '⚠️  Not set (using localhost)');

if (!RESEND_API_KEY) {
  console.error('\n❌ RESEND_API_KEY is not set in .env.local');
  console.error('   Get your API key from: https://resend.com/api-keys');
  process.exit(1);
}

if (!FROM_EMAIL) {
  console.warn('\n⚠️  FROM_EMAIL is not set. Using: noreply@yourdomain.com');
  console.warn('   This will likely fail. Set FROM_EMAIL in .env.local');
}

// Test Resend API
console.log('\n🧪 Testing Resend API...\n');

const resend = new Resend(RESEND_API_KEY);

try {
  // Try to send a test email (to yourself)
  const testEmail = 'support@myatlaz.com'; // Change this to your email

  console.log(`Attempting to send test email to ${testEmail}...`);

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL || 'onboarding@resend.dev', // Use Resend test domain if no FROM_EMAIL
    to: testEmail,
    subject: 'Resend Configuration Test',
    html: `
      <h1>✓ Resend is Working!</h1>
      <p>Your Resend configuration is correct and emails are being sent.</p>
      <p>Sent at: ${new Date().toISOString()}</p>
    `,
  });

  if (error) {
    console.error('❌ Failed to send test email:', error);

    if (error.message?.includes('Invalid domain')) {
      console.error('\n⚠️  FROM_EMAIL domain is not verified in Resend');
      console.error('   1. Go to https://resend.com/domains');
      console.error('   2. Add and verify your domain');
      console.error('   3. Update FROM_EMAIL in .env.local');
      console.error('   OR use onboarding@resend.dev for testing');
    }

    process.exit(1);
  }

  console.log('✅ Test email sent successfully!');
  console.log('   Email ID:', data?.id);
  console.log(`\n📧 Check ${testEmail} for the test email`);

  // Check Netlify environment variables
  console.log('\n🌐 IMPORTANT: For production, ensure these are also set in Netlify:');
  console.log('   1. Go to: https://app.netlify.com/sites/YOUR_SITE/configuration/env');
  console.log('   2. Add:');
  console.log('      - RESEND_API_KEY');
  console.log('      - FROM_EMAIL');
  console.log('      - NEXTAUTH_URL (your production URL)');

} catch (error) {
  console.error('❌ Error testing Resend:', error);
  process.exit(1);
}
