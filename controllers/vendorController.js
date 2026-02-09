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

module.exports = {
  getProfile,
  getMonthlyEarnings
};
