# UniPay Backend

QR-based postpaid campus payment system backend built with Node.js, Express, and Supabase.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3000
```

3. Set up authentication in Supabase:
   - Open Supabase SQL Editor
   - Run the SQL script from `config/auth_functions.sql`
   - This enables pgcrypto and creates password verification functions

4. Start the development server:
```bash
npm run dev
```

5. Start the production server:
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Check if server is running
- `GET /` - API information and available endpoints

### Authentication
- `POST /api/auth/login` - User login with email and password
  - Body: `{ "email": "string", "password": "string" }`
  - Returns: `{ "success": true, "user": { "email", "name", "role", "active" } }`
- `POST /api/auth/register` - Register new user
  - Body: `{ "email": "string", "name": "string", "password": "string", "role": "student|vendor|admin" }`
  - Returns: `{ "success": true, "message": "User registered successfully" }`

### Transactions
- `POST /api/transactions` - Create a new transaction (QR scan)
  - Body: `{ "registration_number": "string", "vendorid": "string", "amount": number, "qr_timestamp": "ISO 8601 timestamp" }`
  - QR codes expire after 60 seconds for security
  - Returns: `{ "success": true, "transaction": {...} }`

### Students
- `GET /api/students/:registration_number` - Get student profile
- `GET /api/students/:registration_number/monthly-spending` - Get student's monthly spending from SQL view

### Vendors
- `GET /api/vendors/:vendorid` - Get vendor profile
- `GET /api/vendors/:vendorid/monthly-earnings` - Get vendor's monthly earnings from SQL view

### Admin
- `GET /api/admin/students/monthly-spending` - Get all students' monthly spending analytics
- `GET /api/admin/vendors/monthly-earnings` - Get all vendors' monthly earnings analytics

## Error Responses

All errors return JSON in the format:
```json
{
  "error": "Error message",
  "details": "Optional details"
}
```

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (missing/invalid fields)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (inactive user account)
- `404` - Not Found
- `409` - Conflict (user already exists)
- `410` - Gone (QR code expired - older than 60 seconds)
- `500` - Internal Server Error



## Database Schema

Tables managed in Supabase:
- `Users` (email, name, password_hash, role, created_at, active) - Master authentication table
  - Passwords hashed using PostgreSQL's pgcrypto (bcrypt)
  - Roles: student, vendor, admin
- `students` (registration_number, name, email, phoneno, parent_email, spending_limit)
  - Foreign key: `email` references `Users(email)`
- `vendors` (vendorid, vendor_name, email, phoneno, stall_location, fixed_biweekly)
  - Foreign key: `email` references `Users(email)`
- `transactions` (transaction_id, registration_number, vendorid, amount, created_at)

SQL Views:
- `student_monthly_spending` - Monthly spending per student
- `vendor_monthly_earnings` - Monthly earnings per vendor


**Access Control**:
- Transactions are only allowed if both the student and vendor have `active = true` in the `Users` table.
