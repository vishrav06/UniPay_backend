const supabase = require('../config/supabase');

const createTransaction = async (req, res, next) => {
  try {
    const { registration_number, vendorid, amount, qr_timestamp } = req.body;

    // Validate required fields
    if (!registration_number || vendorid === undefined || amount === undefined || !qr_timestamp) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'registration_number, vendorid, amount, and qr_timestamp are required'
      });
    }

    // Validate QR timestamp format and check if it's expired (more than 1 minute old)
    const qrTime = new Date(qr_timestamp);
    const currentTime = new Date();

    if (isNaN(qrTime.getTime())) {
      return res.status(400).json({
        error: 'Invalid QR timestamp',
        details: 'qr_timestamp must be a valid ISO 8601 timestamp'
      });
    }

    const timeDifferenceInSeconds = (currentTime - qrTime) / 1000;

    // Check if QR is expired (more than 60 seconds old)
    if (timeDifferenceInSeconds > 60) {
      return res.status(410).json({
        error: 'QR code expired',
        details: `QR code is ${Math.floor(timeDifferenceInSeconds)} seconds old. Maximum allowed: 60 seconds`,
        expired_by_seconds: Math.floor(timeDifferenceInSeconds - 60)
      });
    }

    // Check if QR timestamp is in the future (clock skew protection)
    if (timeDifferenceInSeconds < -5) {
      return res.status(400).json({
        error: 'Invalid QR timestamp',
        details: 'QR timestamp cannot be in the future'
      });
    }

    // Convert vendorid to number (database expects numeric type)
    const vendorIdNum = Number(vendorid);
    if (isNaN(vendorIdNum)) {
      return res.status(400).json({
        error: 'Invalid vendorid',
        details: 'vendorid must be a valid number'
      });
    }

    // Validate amount is positive number
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        details: 'Amount must be a positive number'
      });
    }

    // Check if student exists and is active
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*, Users!students_email_fkey(active)')
      .eq('registration_number', registration_number)
      .single();

    if (studentError) {
      console.error('Student query error:', studentError);
      if (studentError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Student not found',
          details: `No student found with registration number: ${registration_number}`
        });
      }
      return res.status(500).json({
        error: 'Database error while checking student',
        details: studentError.message
      });
    }

    if (!student) {
      return res.status(404).json({
        error: 'Student not found',
        details: `No student found with registration number: ${registration_number}`
      });
    }

    // Check if student is active
    if (!student.Users || !student.Users.active) {
      return res.status(403).json({
        error: 'Student account is inactive',
        details: `Student ${registration_number} is not active and cannot make transactions`
      });
    }

    // Check if vendor exists and is active
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*, Users!vendors_email_fkey(active)')
      .eq('vendorid', vendorIdNum)
      .single();

    if (vendorError) {
      console.error('Vendor query error:', vendorError);
      if (vendorError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Vendor not found',
          details: `No vendor found with vendorid: ${vendorIdNum}`
        });
      }
      return res.status(500).json({
        error: 'Database error while checking vendor',
        details: vendorError.message
      });
    }

    if (!vendor) {
      return res.status(404).json({
        error: 'Vendor not found',
        details: `No vendor found with vendorid: ${vendorIdNum}`
      });
    }

    // Check if vendor is active
    if (!vendor.Users || !vendor.Users.active) {
      return res.status(403).json({
        error: 'Vendor account is inactive',
        details: `Vendor ${vendorIdNum} is not active and cannot accept transactions`
      });
    }

    // Insert transaction
    const { data: transaction, error: transactionError} = await supabase
      .from('transactions')
      .insert([{
        registration_number: registration_number,
        vendorid: vendorIdNum,
        amount: amountNum
      }])
      .select();

    if (transactionError) {
      console.error('Transaction insert error:', transactionError);
      return res.status(500).json({
        error: 'Failed to create transaction',
        details: transactionError.message
      });
    }

    res.status(201).json({
      success: true,
      transaction: transaction[0]
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    next(error);
  }
};

module.exports = {
  createTransaction
};
