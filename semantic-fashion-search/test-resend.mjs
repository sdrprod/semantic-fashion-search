import { config } from 'dotenv';
import { Resend } from 'resend';

config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

console.log('Testing Resend email service...');
console.log('API Key:', process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : 'NOT SET');
console.log('From Email:', process.env.FROM_EMAIL);
console.log('');

async function testEmail() {
  try {
    console.log('Sending test email...');

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: 'delivered@resend.dev', // Resend's test email
      subject: 'Test Email from Semantic Fashion Search',
      html: '<p>This is a test email to verify Resend configuration.</p>',
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('Email ID:', data.id);
    console.log('');
    console.log('Next steps:');
    console.log('1. Check your Resend dashboard at https://resend.com/emails');
    console.log('2. Look for the email with ID:', data.id);
    console.log('3. Check the delivery status');
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    console.error('Full error:', error);
  }
}

testEmail();
