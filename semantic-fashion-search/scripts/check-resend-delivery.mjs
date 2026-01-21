#!/usr/bin/env node
/**
 * Check recent email delivery status in Resend
 * Run: node scripts/check-resend-delivery.mjs
 */

import { Resend } from 'resend';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not set');
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

console.log('\n📊 Checking Recent Email Deliveries...\n');

try {
  // Get recent emails from Resend
  const { data: emails, error } = await resend.emails.list({ limit: 10 });

  if (error) {
    console.error('❌ Error fetching emails:', error);

    if (error.message?.includes('API key')) {
      console.error('\n⚠️  API Key Issue:');
      console.error('   - Check if your Resend API key is still valid');
      console.error('   - Go to https://resend.com/api-keys to verify');
    }

    process.exit(1);
  }

  if (!emails || emails.length === 0) {
    console.log('⚠️  No emails found in Resend dashboard');
    console.log('\nPossible reasons:');
    console.log('  1. Emails were sent with a different API key');
    console.log('  2. This is a brand new Resend account');
    console.log('  3. Emails have been deleted');

    console.log('\n📝 Try sending a test email with:');
    console.log('   node scripts/check-resend-config.mjs');
    process.exit(0);
  }

  console.log(`Found ${emails.length} recent emails:\n`);

  emails.forEach((email, index) => {
    console.log(`${index + 1}. Email ID: ${email.id}`);
    console.log(`   To: ${email.to}`);
    console.log(`   From: ${email.from}`);
    console.log(`   Subject: ${email.subject}`);
    console.log(`   Status: ${email.last_event || 'unknown'}`);
    console.log(`   Created: ${new Date(email.created_at).toLocaleString()}`);

    // Highlight delivery issues
    if (email.last_event === 'bounced') {
      console.log('   ⚠️  BOUNCED - Email was rejected by recipient server');
    } else if (email.last_event === 'complained') {
      console.log('   ⚠️  SPAM COMPLAINT - Recipient marked as spam');
    } else if (email.last_event === 'delivered') {
      console.log('   ✓ DELIVERED - Email was successfully delivered');
    } else if (email.last_event === 'sent') {
      console.log('   📤 SENT - Email was sent (delivery pending)');
    }

    console.log('');
  });

  // Check for common issues
  const bouncedCount = emails.filter(e => e.last_event === 'bounced').length;
  const deliveredCount = emails.filter(e => e.last_event === 'delivered').length;

  console.log('📈 Summary:');
  console.log(`   Delivered: ${deliveredCount}/${emails.length}`);
  console.log(`   Bounced: ${bouncedCount}/${emails.length}`);

  if (bouncedCount > 0) {
    console.log('\n⚠️  Some emails bounced! Common causes:');
    console.log('   1. FROM_EMAIL domain not verified in Resend');
    console.log('   2. Recipient email address is invalid');
    console.log('   3. Recipient mail server blocked the email');
    console.log('\n   Check: https://resend.com/emails');
  }

  if (deliveredCount === 0 && emails.length > 0) {
    console.log('\n⚠️  No delivered emails found!');
    console.log('   1. Check your FROM_EMAIL domain is verified: https://resend.com/domains');
    console.log('   2. For testing, use: FROM_EMAIL=onboarding@resend.dev');
    console.log('   3. Check Resend dashboard for detailed logs: https://resend.com/emails');
  }

  // Check FROM_EMAIL configuration
  const fromEmail = process.env.FROM_EMAIL;
  console.log(`\n📧 Current FROM_EMAIL: ${fromEmail || '⚠️  NOT SET (using default)'}`);

  if (!fromEmail || fromEmail === 'noreply@yourdomain.com') {
    console.log('\n⚠️  FROM_EMAIL is not configured properly!');
    console.log('   Add to .env.local:');
    console.log('   FROM_EMAIL=onboarding@resend.dev  (for testing)');
    console.log('   OR');
    console.log('   FROM_EMAIL=noreply@yourverifieddomain.com  (for production)');
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
