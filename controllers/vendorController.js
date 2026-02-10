const supabase = require('../config/supabase');

const getProfile = async (req, res, next) => {
  try {
    const { vendorid } = req.params;

    // Convert vendorid to number (database expects numeric type)
    const vendorIdNum = Number(vendorid);
    if (isNaN(vendorIdNum)) {
      return res.status(400).json({
        error: 'Invalid vendorid',
        details: 'vendorid must be a valid number'
      });
    }

    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('*, Users!vendors_email_fkey(active)')
      .eq('vendorid', vendorIdNum)
      .single();

    if (error || !vendor) {
      return res.status(404).json({
        error: 'Vendor not found',
        details: `No vendor found with ID: ${vendorid}`
      });
    }

    res.status(200).json(vendor);

  } catch (error) {
    next(error);
  }
};

const getMonthlyEarnings = async (req, res, next) => {
  try {
    const { vendorid } = req.params;

    // Convert vendorid to number (database expects numeric type)
    const vendorIdNum = Number(vendorid);
    if (isNaN(vendorIdNum)) {
      return res.status(400).json({
        error: 'Invalid vendorid',
        details: 'vendorid must be a valid number'
      });
    }

    const { data: earnings, error } = await supabase
      .from('vendor_monthly_earnings')
      .select('*')
      .eq('vendorid', vendorIdNum);

    if (error) {
      throw error;
    }

    res.status(200).json(earnings || []);

  } catch (error) {
    next(error);
  }
};

const getTodayRevenue = async (req, res, next) => {
  try {
    const { vendorid } = req.params;

    // Convert vendorid to number
    const vendorIdNum = Number(vendorid);
    if (isNaN(vendorIdNum)) {
      return res.status(400).json({
        error: 'Invalid vendorid',
        details: 'vendorid must be a valid number'
      });
    }

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

    // Query transactions for today
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('vendorid', vendorIdNum)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    if (error) {
      throw error;
    }

    // Calculate total revenue
    const total_revenue = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    res.status(200).json({
      vendorid: vendorIdNum,
      date: today.toISOString().split('T')[0],
      total_revenue
    });

  } catch (error) {
    next(error);
  }
};

const getWeeklyRevenue = async (req, res, next) => {
  try {
    const { vendorid } = req.params;

    // Convert vendorid to number
    const vendorIdNum = Number(vendorid);
    if (isNaN(vendorIdNum)) {
      return res.status(400).json({
        error: 'Invalid vendorid',
        details: 'vendorid must be a valid number'
      });
    }

    // Get last 7 days date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6); // Last 7 days including today

    const startISO = startDate.toISOString().split('T')[0] + 'T00:00:00.000Z';
    const endISO = endDate.toISOString().split('T')[0] + 'T23:59:59.999Z';

    // Query transactions for last 7 days
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('amount, created_at')
      .eq('vendorid', vendorIdNum)
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Group by date and calculate daily totals
    const dailyTotals = {};
    transactions.forEach(t => {
      const date = t.created_at.split('T')[0]; // YYYY-MM-DD
      dailyTotals[date] = (dailyTotals[date] || 0) + parseFloat(t.amount);
    });

    // Build weekly data array with day names
    const weekly_data = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      weekly_data.push({
        date: dateStr,
        day: dayNames[date.getDay()],
        amount: dailyTotals[dateStr] || 0
      });
    }

    res.status(200).json({
      vendorid: vendorIdNum,
      weekly_data
    });

  } catch (error) {
    next(error);
  }
};

const getMonthlyStats = async (req, res, next) => {
  try {
    const { vendorid } = req.params;

    // Convert vendorid to number
    const vendorIdNum = Number(vendorid);
    if (isNaN(vendorIdNum)) {
      return res.status(400).json({
        error: 'Invalid vendorid',
        details: 'vendorid must be a valid number'
      });
    }

    // Get current month range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    // Query transactions for current month
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('amount, created_at')
      .eq('vendorid', vendorIdNum)
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth);

    if (error) {
      throw error;
    }

    // Group by date and calculate daily totals
    const dailyTotals = {};
    let total_month = 0;

    transactions.forEach(t => {
      const date = t.created_at.split('T')[0];
      const amount = parseFloat(t.amount);
      dailyTotals[date] = (dailyTotals[date] || 0) + amount;
      total_month += amount;
    });

    // Find highest and lowest days
    const days = Object.entries(dailyTotals).map(([date, amount]) => ({ date, amount }));

    let highest_day = null;
    let lowest_day = null;

    if (days.length > 0) {
      days.sort((a, b) => b.amount - a.amount);
      highest_day = days[0];
      lowest_day = days[days.length - 1];
    }

    res.status(200).json({
      vendorid: vendorIdNum,
      month: now.toISOString().slice(0, 7),
      highest_day,
      lowest_day,
      total_month
    });

  } catch (error) {
    next(error);
  }
};

const getTransactionHistory = async (req, res, next) => {
  try {
    const { vendorid } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    // Convert vendorid to number
    const vendorIdNum = Number(vendorid);
    if (isNaN(vendorIdNum)) {
      return res.status(400).json({
        error: 'Invalid vendorid',
        details: 'vendorid must be a valid number'
      });
    }

    console.log(`Fetching transactions for vendor: ${vendorIdNum}`);

    // Get total count
    const { count, error: countError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('vendorid', vendorIdNum);

    if (countError) {
      console.error('Count error:', countError);
      throw countError;
    }

    console.log(`Total transaction count: ${count}`);

    // Get paginated transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('id, amount, created_at, registration_number')
      .eq('vendorid', vendorIdNum)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Transaction fetch error:', error);
      throw error;
    }

    console.log(`Fetched ${transactions?.length || 0} transactions`);

    // If no transactions, return empty array
    if (!transactions || transactions.length === 0) {
      return res.status(200).json({
        vendorid: vendorIdNum,
        transactions: [],
        total_count: count || 0,
        limit,
        offset
      });
    }

    // Get unique registration numbers
    const regNumbers = [...new Set(transactions.map(t => t.registration_number).filter(r => r != null))];
    console.log(`Unique registration numbers: ${regNumbers.join(', ')}`);

    // Create student lookup map
    const studentMap = {};

    // Only fetch students if we have registration numbers
    if (regNumbers.length > 0) {
      const { data: students, error: studentError } = await supabase
        .from('students')
        .select('registration_number, email, name')
        .in('registration_number', regNumbers);

      if (studentError) {
        console.error('Error fetching students:', studentError);
        // Continue anyway - we'll use 'Unknown Student'
      } else if (students) {
        console.log(`Fetched ${students.length} students`);
        students.forEach(s => {
          studentMap[s.registration_number] = {
            email: s.email,
            name: s.name
          };
        });
      }
    }

    // Format response with student info
    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      student: studentMap[t.registration_number]?.email || t.registration_number,
      student_name: studentMap[t.registration_number]?.name || 'Unknown Student',
      amount: parseFloat(t.amount),
      created_at: t.created_at
    }));

    res.status(200).json({
      vendorid: vendorIdNum,
      transactions: formattedTransactions,
      total_count: count || 0,
      limit,
      offset
    });

  } catch (error) {
    console.error('Unexpected error in getTransactionHistory:', error);
    next(error);
  }
};

module.exports = {
  getProfile,
  getMonthlyEarnings,
  getTodayRevenue,
  getWeeklyRevenue,
  getMonthlyStats,
  getTransactionHistory
};
