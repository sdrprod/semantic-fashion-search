# Email Verification Sign-Up System - Setup Guide

## What's Been Built

A complete sign-up and email verification system with the following features:

### ✅ Features Implemented

1. **Two Sign-Up Methods**:
   - Sign up with Google OAuth (auto-verified)
   - Sign up with Email/Password (requires verification)

2. **Email Verification Flow**:
   - 6-digit verification code sent to email
   - Code expires after 10 minutes
   - Click link in email OR enter code manually
   - "Resend Code" button (resets 10-minute timer)

3. **Sign-In Options**:
   - Sign in with Google OAuth
   - Sign in with Email/Password
   - Blocks unverified email accounts from signing in

4. **Navigation Updates**:
   - "Sign Up" and "Sign In" buttons (instead of just "Sign In")
   - Works on desktop and mobile

## Setup Instructions

### Step 1: Run SQL Migration in Supabase

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy the SQL from: `prisma/migrations/add_verification_codes.sql`
4. Paste and run it

This creates the `verification_codes` table.

### Step 2: Set Up Resend Email Service

1. Go to [Resend.com](https://resend.com) and create a free account
2. Verify your domain OR use Resend's test domain (for development)
3. Generate an API key at https://resend.com/api-keys
4. Update `.env.local`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com  # Or: onboarding@resend.dev (for testing)
```

**Testing with Resend's Test Domain**:
- Resend provides `onboarding@resend.dev` for testing
- Emails will be sent but only visible in Resend dashboard (not real inbox)
- Perfect for development/testing before adding your own domain

### Step 3: Build and Test

```bash
cd semantic-fashion-search
npm run build
npm run dev
```

### Step 4: Test the Flow

1. Go to `http://localhost:3000`
2. Click "Sign Up" in navigation
3. Try both methods:
   - **Google OAuth**: Instant sign-up, auto-verified
   - **Email/Password**: Fill form → Receives code → Verify → Sign in

## User Flows

### Flow 1: Sign Up with Google OAuth
```
1. Click "Sign Up" → /signup
2. Click "Sign up with Google"
3. Authorize with Google
4. Redirected to home page (signed in)
```

### Flow 2: Sign Up with Email/Password
```
1. Click "Sign Up" → /signup
2. Fill form: First Name, Last Name, Email, Password
3. Submit → Account created
4. Redirected to /verify-email?email=user@example.com
5. Check email for 6-digit code
6. Enter code OR click link in email
7. Email verified → Redirected to /admin/login?verified=true
8. Sign in with email/password
```

### Flow 3: Sign In
```
Existing users:
1. Click "Sign In" → /admin/login
2. Choose method:
   - "Sign in with Google" (OAuth users)
   - "Or sign in with email" (Email/password users)
3. Enter credentials → Signed in
```

## Database Tables

### `users` table
```sql
- id (TEXT, PRIMARY KEY)
- email (TEXT, UNIQUE)
- name (TEXT)
- password (TEXT, nullable for OAuth users)
- emailVerified (TIMESTAMP, nullable)
- role (TEXT, default: 'viewer')
- image (TEXT, nullable)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

### `verification_codes` table
```sql
- id (TEXT, PRIMARY KEY)
- email (TEXT)
- code (TEXT, 6 digits)
- type (TEXT: 'signup', 'password-reset', etc.)
- expiresAt (TIMESTAMP, +10 minutes)
- createdAt (TIMESTAMP)
- usedAt (TIMESTAMP, nullable)
```

## API Endpoints Created

- `POST /api/auth/signup` - Create new account
- `POST /api/auth/verify-email` - Verify email with code
- `POST /api/auth/resend-code` - Resend verification code
- `POST /api/auth/[...nextauth]` - NextAuth (Google + Credentials)

## Pages Created

- `/signup` - Sign up page (Google + Email options)
- `/verify-email` - Enter verification code
- `/admin/login` - Sign in page (updated with email/password support)

## Security Features

- Passwords hashed with bcrypt (12 rounds)
- Verification codes expire after 10 minutes
- Email verification required before sign-in
- Prevents duplicate accounts (same email)
- OAuth users auto-verified
- JWT sessions (secure, no database lookups)

## Email Template

Beautiful HTML email with:
- 6-digit code displayed prominently
- Click-to-verify button
- 10-minute expiration notice
- Responsive design
- Professional branding

## Troubleshooting

### Issue: Emails not sending
- Check RESEND_API_KEY in .env.local
- Check Resend dashboard for errors
- Use `onboarding@resend.dev` for testing

### Issue: "Email already exists"
- User might have signed up with Google
- Tell them to use "Sign in with Google"

### Issue: "Please verify your email"
- User created account but didn't verify
- Resend verification code from /verify-email

### Issue: Code expired
- Codes expire after 10 minutes
- Click "Resend Code" to get a new one

## Next Steps (Optional Enhancements)

1. **Password Reset Flow**: Add "Forgot Password?" link
2. **Email Change**: Allow users to change email (requires verification)
3. **Social Auth**: Add more providers (Facebook, Twitter, etc.)
4. **Profile Management**: Let users update name, preferences
5. **Admin Dashboard**: View all users, manually verify emails

## Files Modified/Created

**New Files**:
- `lib/email.ts` - Email sending utilities
- `app/api/auth/signup/route.ts` - Signup endpoint
- `app/api/auth/verify-email/route.ts` - Verification endpoint
- `app/api/auth/resend-code/route.ts` - Resend code endpoint
- `app/signup/page.tsx` - Signup page UI
- `app/verify-email/page.tsx` - Verification page UI
- `prisma/migrations/add_verification_codes.sql` - Database migration

**Modified Files**:
- `lib/auth.ts` - Added CredentialsProvider
- `components/Navigation.tsx` - Added Sign Up button
- `app/admin/login/page.tsx` - Added email/password signin
- `.env.local` - Added RESEND_API_KEY and FROM_EMAIL

## Done! 🎉

Your sign-up system with email verification is ready to use!
