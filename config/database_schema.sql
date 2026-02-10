-- Unipay Database Schema
-- PostgreSQL/Supabase Database Setup
-- Run this script in your Supabase SQL Editor to set up the complete database

-- =====================================================
-- 1. ENABLE EXTENSIONS
-- =====================================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 2. CREATE TABLES
-- =====================================================

-- Users table (master authentication table)
CREATE TABLE IF NOT EXISTS Users (
    email VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'vendor', 'admin')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    registration_number VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phoneno VARCHAR(20),
    parent_email VARCHAR(255),
    spending_limit DECIMAL(10, 2) DEFAULT 0,
    FOREIGN KEY (email) REFERENCES Users(email) ON DELETE CASCADE
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
    vendorid SERIAL PRIMARY KEY,
    vendorname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phoneno VARCHAR(20),
    stall_location VARCHAR(255),
    fixed_biweekly DECIMAL(10, 2) DEFAULT 0,
    FOREIGN KEY (email) REFERENCES Users(email) ON DELETE CASCADE
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    registration_number VARCHAR(50) NOT NULL,
    vendorid INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (registration_number) REFERENCES students(registration_number),
    FOREIGN KEY (vendorid) REFERENCES vendors(vendorid)
);

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for student transaction queries (by registration number and date)
CREATE INDEX IF NOT EXISTS idx_transactions_reg_date
ON transactions(registration_number, created_at DESC);

-- Index for vendor transaction queries (by vendor ID and date)
CREATE INDEX IF NOT EXISTS idx_transactions_vendor_date
ON transactions(vendorid, created_at DESC);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_transactions_created_at
ON transactions(created_at DESC);

-- =====================================================
-- 4. CREATE VIEWS FOR ANALYTICS
-- =====================================================

-- Student monthly spending view
CREATE OR REPLACE VIEW student_monthly_spending AS
SELECT
    registration_number,
    DATE_TRUNC('month', created_at) AS month,
    SUM(amount) AS total_spent
FROM transactions
GROUP BY registration_number, DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Vendor monthly earnings view
CREATE OR REPLACE VIEW vendor_monthly_earnings AS
SELECT
    vendorid,
    DATE_TRUNC('month', created_at) AS month,
    SUM(amount) AS total_earned
FROM transactions
GROUP BY vendorid, DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- =====================================================
-- 5. CREATE AUTHENTICATION FUNCTIONS
-- =====================================================

-- Function to verify password during login
CREATE OR REPLACE FUNCTION verify_password(input_email TEXT, input_password TEXT)
RETURNS TABLE(email TEXT, name TEXT, role TEXT, active BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT u.email, u.name, u.role, u.active
    FROM Users u
    WHERE u.email = input_email
      AND u.password_hash = crypt(input_password, u.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to hash password during registration
CREATE OR REPLACE FUNCTION hash_password(plain_password TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN crypt(plain_password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. INSERT SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =====================================================

-- Sample admin user (password: admin123)
INSERT INTO Users (email, name, password_hash, role, active)
VALUES (
    'admin@unipay.ac.in',
    'Admin User',
    crypt('admin123', gen_salt('bf')),
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Sample student (password: student123)
INSERT INTO Users (email, name, password_hash, role, active)
VALUES (
    'student@vitstudent.ac.in',
    'Test Student',
    crypt('student123', gen_salt('bf')),
    'student',
    true
) ON CONFLICT (email) DO NOTHING;

INSERT INTO students (registration_number, name, email, phoneno, parent_email, spending_limit)
VALUES (
    '21BCE123',
    'Test Student',
    'student@vitstudent.ac.in',
    '9876543210',
    'parent@gmail.com',
    5000
) ON CONFLICT (registration_number) DO NOTHING;

-- Sample vendor (password: vendor123)
INSERT INTO Users (email, name, password_hash, role, active)
VALUES (
    'vendor@unipay.ac.in',
    'Test Vendor',
    crypt('vendor123', gen_salt('bf')),
    'vendor',
    true
) ON CONFLICT (email) DO NOTHING;

INSERT INTO vendors (vendorname, email, phoneno, stall_location, fixed_biweekly)
VALUES (
    'Campus Cafeteria',
    'vendor@unipay.ac.in',
    '9876543211',
    'Main Building Ground Floor',
    2000
) ON CONFLICT (email) DO NOTHING;

-- Sample transaction
INSERT INTO transactions (registration_number, vendorid, amount)
SELECT '21BCE123', vendorid, 150.50
FROM vendors
WHERE email = 'vendor@unipay.ac.in'
LIMIT 1;

-- =====================================================
-- 7. VERIFY SETUP
-- =====================================================

-- Check tables
SELECT 'Users' as table_name, COUNT(*) as row_count FROM Users
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'vendors', COUNT(*) FROM vendors
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions;

-- Check views
SELECT * FROM student_monthly_spending LIMIT 5;
SELECT * FROM vendor_monthly_earnings LIMIT 5;

-- Check indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('users', 'students', 'vendors', 'transactions')
ORDER BY tablename, indexname;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. All passwords are hashed using bcrypt (pgcrypto extension)
-- 2. Transactions table uses append-only pattern (no updates/deletes)
-- 3. All timestamps are stored in UTC
-- 4. Views automatically calculate totals - no stored aggregates
-- 5. Indexes optimize date-based transaction queries
-- 6. Foreign keys ensure referential integrity
-- 7. Sample data includes default credentials for testing
