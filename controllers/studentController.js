const supabase = require('../config/supabase');

const getProfile = async (req, res, next) => {
  try {
    const { registration_number } = req.params;

    const { data: student, error } = await supabase
      .from('students')
      .select('*, Users!students_email_fkey(active)')
      .eq('registration_number', registration_number)
      .single();

    if (error || !student) {
      return res.status(404).json({
        error: 'Student not found',
        details: `No student found with registration number: ${registration_number}`
      });
    }

    res.status(200).json(student);

  } catch (error) {
    next(error);
  }
};

const getMonthlySpending = async (req, res, next) => {
  try {
    const { registration_number } = req.params;

    const { data: spending, error } = await supabase
      .from('student_monthly_spending')
      .select('*')
      .eq('registration_number', registration_number);

    if (error) {
      throw error;
    }

    res.status(200).json(spending || []);

  } catch (error) {
    next(error);
  }
};

const getCurrentMonthSpending = async (req, res, next) => {
  try {
    const { registration_number } = req.params;

    // Get current month start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    // Query transactions for current month
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('registration_number', registration_number)
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth);

    if (error) {
      throw error;
    }

    // Calculate total spending
    const total_spent = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    res.status(200).json({
      registration_number,
      month: now.toISOString().slice(0, 7), // YYYY-MM format
      total_spent
    });

  } catch (error) {
    next(error);
  }
};

const getWeeklySpending = async (req, res, next) => {
  try {
    const { registration_number } = req.params;

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
      .eq('registration_number', registration_number)
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
      registration_number,
      weekly_data
    });

  } catch (error) {
    next(error);
  }
};

const getDailySpending = async (req, res, next) => {
  try {
    const { registration_number } = req.params;
    const { year, month } = req.query;

    // Validate query parameters
    if (!year || !month) {
      return res.status(400).json({
        error: 'Missing required parameters',
        details: 'Year and month query parameters are required'
      });
    }

    // Create date range for the specified month
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999).toISOString();

    // Query transactions for the month
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('amount, created_at')
      .eq('registration_number', registration_number)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) {
      throw error;
    }

    // Group by day of month
    const daily_spending = {};
    let max_amount = 0;

    transactions.forEach(t => {
      const day = new Date(t.created_at).getDate().toString();
      const amount = parseFloat(t.amount);
      daily_spending[day] = (daily_spending[day] || 0) + amount;
      max_amount = Math.max(max_amount, daily_spending[day]);
    });

    res.status(200).json({
      registration_number,
      year: parseInt(year),
      month: parseInt(month),
      daily_spending,
      max_amount
    });

  } catch (error) {
    next(error);
  }
};

const getTransactionHistory = async (req, res, next) => {
  try {
    const { registration_number } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    console.log(`Fetching transactions for student: ${registration_number}`);

    // Get total count
    const { count, error: countError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('registration_number', registration_number);

    if (countError) {
      console.error('Count error:', countError);
      throw countError;
    }

    console.log(`Total transaction count: ${count}`);

    // Get paginated transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('id, amount, created_at, vendorid')
      .eq('registration_number', registration_number)
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
        registration_number,
        transactions: [],
        total_count: count || 0,
        limit,
        offset
      });
    }

    // Get unique vendor IDs
    const vendorIds = [...new Set(transactions.map(t => t.vendorid).filter(id => id != null))];
    console.log(`Unique vendor IDs: ${vendorIds.join(', ')}`);

    // Create vendor lookup map
    const vendorMap = {};

    // Only fetch vendors if we have vendor IDs
    if (vendorIds.length > 0) {
      const { data: vendors, error: vendorError } = await supabase
        .from('vendors')
        .select('vendorid, vendorname')
        .in('vendorid', vendorIds);

      if (vendorError) {
        console.error('Error fetching vendors:', vendorError);
        // Continue anyway - we'll use 'Unknown Vendor'
      } else if (vendors) {
        console.log(`Fetched ${vendors.length} vendors`);
        vendors.forEach(v => {
          vendorMap[v.vendorid] = v.vendorname;
        });
      }
    }

    // Format response with vendor names
    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      vendor_name: vendorMap[t.vendorid] || 'Unknown Vendor',
      amount: parseFloat(t.amount),
      created_at: t.created_at
    }));

    res.status(200).json({
      registration_number,
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

const getGoal = async (req, res, next) => {
  try {
    const { registration_number } = req.params;

    const { data: student, error } = await supabase
      .from('students')
      .select('spending_limit')
      .eq('registration_number', registration_number)
      .single();

    if (error || !student) {
      return res.status(404).json({
        error: 'Student not found',
        details: `No student found with registration number: ${registration_number}`
      });
    }

    res.status(200).json({
      registration_number,
      spending_limit: student.spending_limit || 0
    });

  } catch (error) {
    next(error);
  }
};

const setGoal = async (req, res, next) => {
  try {
    const { registration_number } = req.params;
    const { spending_limit } = req.body;

    // Validate spending_limit
    if (spending_limit === undefined || spending_limit === null) {
      return res.status(400).json({
        error: 'Missing required field',
        details: 'spending_limit is required in request body'
      });
    }

    const limit = parseFloat(spending_limit);
    if (isNaN(limit) || limit <= 0) {
      return res.status(400).json({
        error: 'Invalid spending_limit',
        details: 'spending_limit must be a positive number'
      });
    }

    // Update student's spending limit
    const { data, error } = await supabase
      .from('students')
      .update({ spending_limit: limit })
      .eq('registration_number', registration_number)
      .select('spending_limit')
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        error: 'Student not found',
        details: `No student found with registration number: ${registration_number}`
      });
    }

    res.status(200).json({
      success: true,
      spending_limit: data.spending_limit
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  getMonthlySpending,
  getCurrentMonthSpending,
  getWeeklySpending,
  getDailySpending,
  getTransactionHistory,
  getGoal,
  setGoal
};
