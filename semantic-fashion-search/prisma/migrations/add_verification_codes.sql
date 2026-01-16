-- Create verification_codes table
CREATE TABLE IF NOT EXISTS "verification_codes" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- 'signup', 'password-reset', 'email-change'
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "verification_codes_email_idx" ON "verification_codes"("email");
CREATE INDEX IF NOT EXISTS "verification_codes_code_idx" ON "verification_codes"("code");
CREATE INDEX IF NOT EXISTS "verification_codes_type_idx" ON "verification_codes"("type");
CREATE INDEX IF NOT EXISTS "verification_codes_expiresAt_idx" ON "verification_codes"("expiresAt");

-- Add unique constraint for active codes (email + type combination)
CREATE UNIQUE INDEX IF NOT EXISTS "verification_codes_email_type_active_idx"
ON "verification_codes"("email", "type")
WHERE "usedAt" IS NULL AND "expiresAt" > NOW();
