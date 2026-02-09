# Testing the UniPay Backend

## Quick Start - Run All Tests

```bash
chmod +x test-api.sh
./test-api.sh
```

## Manual Testing Options

### Option 1: Using curl (Built-in, No Installation)

#### Test Health Check
```bash
curl http://localhost:3000/health
```

#### Test API Info
```bash
curl http://localhost:3000/
```

#### Get Student Profile
```bash
curl http://localhost:3000/api/students/21BCE123
```

#### Create Transaction (POST)
```bash
# Get current timestamp in ISO format (Linux/Mac/Git Bash)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d "{
    \"registration_number\": \"21BCE123\",
    \"vendorid\": 1,
    \"amount\": 150.50,
    \"qr_timestamp\": \"$TIMESTAMP\"
  }"
```

**For Windows PowerShell:**
```powershell
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.000Z")
curl.exe -X POST http://localhost:3000/api/transactions `
  -H "Content-Type: application/json" `
  -d "{`"registration_number`":`"21BCE123`",`"vendorid`":1,`"amount`":150.50,`"qr_timestamp`":`"$timestamp`"}"
```

#### Get Student Monthly Spending
```bash
curl http://localhost:3000/api/students/21BCE123/monthly-spending
```

#### Get Vendor Profile
```bash
curl http://localhost:3000/api/vendors/V001
```

#### Get Vendor Monthly Earnings
```bash
curl http://localhost:3000/api/vendors/V001/monthly-earnings
```

#### Get Admin Analytics - All Students
```bash
curl http://localhost:3000/api/admin/students/monthly-spending
```

#### Get Admin Analytics - All Vendors
```bash
curl http://localhost:3000/api/admin/vendors/monthly-earnings
```

---

### Option 2: Using VS Code REST Client Extension

If you have VS Code, install the "REST Client" extension, then create a file `test.http`:

```http
### Health Check
GET http://localhost:3000/health

### API Info
GET http://localhost:3000/

### Get Student Profile
GET http://localhost:3000/api/students/21BCE123

### Create Transaction
POST http://localhost:3000/api/transactions
Content-Type: application/json

{
  "registration_number": "21BCE123",
  "vendorid": 1,
  "amount": 150.50,
  "qr_timestamp": "2026-02-09T10:30:00.000Z"
}

### Create Transaction with Current Timestamp (use this for testing)
POST http://localhost:3000/api/transactions
Content-Type: application/json

{
  "registration_number": "21BCE123",
  "vendorid": 1,
  "amount": 150.50,
  "qr_timestamp": "{{$datetime iso8601}}"
}

### Get Student Monthly Spending
GET http://localhost:3000/api/students/21BCE123/monthly-spending

### Get Vendor Profile
GET http://localhost:3000/api/vendors/V001

### Get Vendor Monthly Earnings
GET http://localhost:3000/api/vendors/V001/monthly-earnings

### Admin - All Students Spending
GET http://localhost:3000/api/admin/students/monthly-spending

### Admin - All Vendors Earnings
GET http://localhost:3000/api/admin/vendors/monthly-earnings
```

Click "Send Request" above each endpoint to test.

---

### Option 3: Using Postman

1. Download Postman from https://www.postman.com/downloads/
2. Create a new request
3. Set the method (GET, POST, etc.)
4. Enter the URL (e.g., `http://localhost:3000/api/students/21BCE123`)
5. For POST requests, go to Body → raw → JSON and add your data
6. Click Send

---

### Option 4: Using Thunder Client (VS Code Extension)

1. Install "Thunder Client" extension in VS Code
2. Click the Thunder Client icon in the sidebar
3. Create a new request
4. Similar to Postman but built into VS Code

---

## Test Data Needed in Supabase

Before testing transactions, make sure you have data in your Supabase tables:

### Add test users (required first - Users table):
```sql
-- Add student user
INSERT INTO "Users" (email, name, active)
VALUES ('test@example.com', 'Test Student', true);

-- Add vendor user
INSERT INTO "Users" (email, name, active)
VALUES ('vendor@example.com', 'Test Vendor', true);

-- Add inactive user for testing
INSERT INTO "Users" (email, name, active)
VALUES ('inactive@example.com', 'Inactive User', false);
```

### Add a test student:
```sql
INSERT INTO students (registration_number, name, email, phoneno, parent_email, spending_limit)
VALUES ('21BCE123', 'Test Student', 'test@example.com', 9876543210, 'parent@example.com', 5000.00);

-- Add inactive student for testing
INSERT INTO students (registration_number, name, email, phoneno, parent_email, spending_limit)
VALUES ('21BCE999', 'Inactive Student', 'inactive@example.com', 9876543299, 'parent2@example.com', 5000.00);
```

### Add a test vendor:
```sql
INSERT INTO vendors (vendorid, vendor_name, email, phoneno, stall_location, fixed_biweekly)
VALUES (1, 'Test Vendor', 'vendor@example.com', '9876543211', 'Canteen A', 100000);
```

### Then test creating a transaction:
```bash
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d "{
    \"registration_number\": \"21BCE123\",
    \"vendorid\": 1,
    \"amount\": 150.50,
    \"qr_timestamp\": \"$TIMESTAMP\"
  }"
```

---

## Expected Responses

### Success (200/201):
```json
{
  "success": true,
  "transaction": {
    "id": 1,
    "registration_number": "21BCE123",
    "vendorid": "V001",
    "amount": 150.50,
    "created_at": "2026-02-09T10:30:00Z"
  }
}
```

### Error (404):
```json
{
  "error": "Student not found",
  "details": "No student found with registration number: 21BCE123"
}
```

### Error (400):
```json
{
  "error": "Missing required fields",
  "details": "registration_number, vendorid, and amount are required"
}
```

### Error (403 - Inactive User):
```json
{
  "error": "Student account is inactive",
  "details": "Student 21BCE999 is not active and cannot make transactions"
}
```

### Error (410 - QR Code Expired):
```json
{
  "error": "QR code expired",
  "details": "QR code is 125 seconds old. Maximum allowed: 60 seconds",
  "expired_by_seconds": 65
}
```

---

## Testing Active/Inactive User Validation

### Test with Inactive Student
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "registration_number": "21BCE999",
    "vendorid": 1,
    "amount": 100.00
  }'
```
**Expected**: 403 error - Student account is inactive

### Test Toggling User Status
```sql
-- Deactivate a user
UPDATE "Users" SET active = false WHERE email = 'test@example.com';

-- Try to create a transaction (should fail with 403)

-- Reactivate the user
UPDATE "Users" SET active = true WHERE email = 'test@example.com';

-- Try again (should succeed with 201)
```

### Check Active Status in Profile Response
```bash
curl http://localhost:3000/api/students/21BCE123
```
**Expected**: Response includes `"Users": { "active": true }` field

---

## Testing QR Code Expiry (60 Second Timeout)

### Test with Valid QR (Fresh Timestamp)
```bash
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d "{
    \"registration_number\": \"21BCE123\",
    \"vendorid\": 1,
    \"amount\": 100.00,
    \"qr_timestamp\": \"$TIMESTAMP\"
  }"
```
**Expected**: 201 Created - Transaction successful

### Test with Expired QR (Old Timestamp)
```bash
# Create a timestamp from 2 minutes ago
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "registration_number": "21BCE123",
    "vendorid": 1,
    "amount": 100.00,
    "qr_timestamp": "2026-02-09T10:00:00.000Z"
  }'
```
**Expected**: 410 Gone - QR code expired

### Test with Missing QR Timestamp
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "registration_number": "21BCE123",
    "vendorid": 1,
    "amount": 100.00
  }'
```
**Expected**: 400 Bad Request - Missing qr_timestamp field

### Test with Invalid QR Timestamp Format
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "registration_number": "21BCE123",
    "vendorid": 1,
    "amount": 100.00,
    "qr_timestamp": "invalid-timestamp"
  }'
```
**Expected**: 400 Bad Request - Invalid timestamp format
