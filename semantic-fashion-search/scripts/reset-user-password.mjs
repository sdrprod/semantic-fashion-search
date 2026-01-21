#!/usr/bin/env node
/**
 * Reset user password and make them admin
 * Run: node scripts/reset-user-password.mjs
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetUserPassword() {
  const email = 'support@myatlaz.com';
  const newPassword = 'PWD123!!';

  console.log(`\n🔐 Resetting password for ${email}...`);

  // Hash the password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  console.log('✓ Password hashed');

  // Update user: set password, verify email, make admin
  const { data, error } = await supabase
    .from('users')
    .update({
      password: hashedPassword,
      emailVerified: new Date().toISOString(),
      role: 'admin',
      updatedAt: new Date().toISOString(),
    })
    .eq('email', email)
    .select();

  if (error) {
    console.error('❌ Error updating user:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.error('❌ User not found. Creating new admin user...');

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: crypto.randomUUID(),
        email: email,
        name: 'Support Admin',
        password: hashedPassword,
        role: 'admin',
        emailVerified: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select();

    if (createError) {
      console.error('❌ Error creating user:', createError);
      process.exit(1);
    }

    console.log('✓ User created:', newUser[0]);
  } else {
    console.log('✓ User updated:', data[0]);
  }

  console.log('\n✅ SUCCESS!');
  console.log('📧 Email:', email);
  console.log('🔑 Password:', newPassword);
  console.log('👑 Role: admin');
  console.log('✉️  Email verified: YES');
  console.log('\n🚀 You can now sign in at /admin/login');
}

resetUserPassword().catch(console.error);
