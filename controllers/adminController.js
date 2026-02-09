const supabase = require('../config/supabase');

const getAllStudentsSpending = async (req, res, next) => {
  try {
    const { data: spending, error } = await supabase
      .from('student_monthly_spending')
      .select('*');

    if (error) {
      throw error;
    }

    res.status(200).json(spending || []);

  } catch (error) {
    next(error);
  }
};

const getAllVendorsEarnings = async (req, res, next) => {
  try {
    const { data: earnings, error } = await supabase
      .from('vendor_monthly_earnings')
      .select('*');

    if (error) {
      throw error;
    }

    res.status(200).json(earnings || []);

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllStudentsSpending,
  getAllVendorsEarnings
};
