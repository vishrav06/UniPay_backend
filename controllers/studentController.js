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

module.exports = {
  getProfile,
  getMonthlySpending
};
