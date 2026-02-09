-- ============================================
-- UniPay Authentication SQL Functions
-- Run these in Supabase SQL Editor
-- ============================================

-- 1. Enable pgcrypto extension (for bcrypt hashing)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Function to verify user password during login
CREATE OR REPLACE FUNCTION verify_user_password(
  user_email text,
  user_password text
)
RETURNS TABLE (
  email text,
  name text,
  role text,
  active boolean
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT email, name, role, active
  FROM public."Users"
  WHERE email = user_email
    AND password_hash = crypt(user_password, password_hash);
$$;

-- 3. Function to create a new user with hashed password
CREATE OR REPLACE FUNCTION create_user_with_hash(
  user_email text,
  user_name text,
  user_password text,
  user_role text
)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO public."Users" (email, name, password_hash, role, active)
  VALUES (
    user_email,
    user_name,
    crypt(user_password, gen_salt('bf')),
    user_role,
    true
  )
  RETURNING email;
$$;

-- ============================================
-- TEST DATA (Optional - for testing)
-- ============================================

-- Create test users with hashed passwords
INSERT INTO public."Users" (email, name, password_hash, role, active)
VALUES
  (
    'student@test.com',
    'Test Student',
    crypt('password123', gen_salt('bf')),
    'student',
    true
  ),
  (
    'vendor@test.com',
    'Test Vendor',
    crypt('password123', gen_salt('bf')),
    'vendor',
    true
  ),
  (
    'admin@test.com',
    'Test Admin',
    crypt('admin123', gen_salt('bf')),
    'admin',
    true
  )
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES (Run to test)
-- ============================================

-- Test login verification
SELECT * FROM verify_user_password('student@test.com', 'password123');
-- Should return: student@test.com, Test Student, student, true

-- Test wrong password
SELECT * FROM verify_user_password('student@test.com', 'wrongpassword');
-- Should return: empty result

-- ============================================
-- NOTES
-- ============================================
--
-- Security:
-- - Passwords are hashed using bcrypt (gen_salt('bf'))
-- - password_hash is irreversible (one-way)
-- - crypt() automatically uses the salt stored in the hash
-- - SECURITY DEFINER allows the function to run with elevated privileges
--
-- Usage:
-- - Login: Call verify_user_password(email, password)
-- - Register: Call create_user_with_hash(email, name, password, role)
