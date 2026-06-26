-- AlterTable: users
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP(3);

-- CreateTable: verification_codes
CREATE TABLE IF NOT EXISTS verification_codes (
    id TEXT NOT NULL,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'email_verification',
    expires_at TIMESTAMP(3) NOT NULL,
    used_at TIMESTAMP(3),
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT verification_codes_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS verification_codes_email_code_idx ON verification_codes(email, code);
CREATE INDEX IF NOT EXISTS verification_codes_email_type_idx ON verification_codes(email, type);
