const supabase = require('../config/supabase');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'email and password are required'
      });
    }

    // Query user from database
    const { data: users, error: queryError } = await supabase
      .from('Users')
      .select('email, name, password, role, active')
      .eq('email', email)
      .limit(1);

    if (queryError) {
      console.error('Login error:', queryError);
      return res.status(500).json({
        error: 'Login failed',
        details: queryError.message
      });
    }

    if (!users || users.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        details: 'Email or password is incorrect'
      });
    }

    const user = users[0];

    // Check if user is active
    if (!user.active) {
      return res.status(403).json({
        error: 'Account inactive',
        details: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Simple password check (plain text comparison)
    if (user.password !== password) {
      return res.status(401).json({
        error: 'Invalid credentials',
        details: 'Email or password is incorrect'
      });
    }

    // Get role-specific data
    let userData = {
      email: user.email,
      name: user.name,
      role: user.role,
      active: user.active
    };

    // Fetch student-specific data
    if (user.role === 'student') {
      const { data: student } = await supabase
        .from('students')
        .select('registration_number, phoneno, parent_email, spending_limit')
        .eq('email', email)
        .single();

      if (student) {
        userData.registration_number = student.registration_number;
        userData.phoneno = student.phoneno;
        userData.parent_email = student.parent_email;
        userData.spending_limit = student.spending_limit;
      }
    }

    // Fetch vendor-specific data
    if (user.role === 'vendor') {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('vendorid, vendor_name, phoneno, stall_location, fixed_biweekly')
        .eq('email', email)
        .single();

      if (vendor) {
        userData.vendorid = vendor.vendorid.toString();
        userData.vendor_name = vendor.vendor_name;
        userData.phoneno = vendor.phoneno;
        userData.stall_location = vendor.stall_location;
        userData.fixed_biweekly = vendor.fixed_biweekly;
      }
    }

    // Login successful - return user info
    res.status(200).json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { email, name, password, role } = req.body;

    // Validate required fields
    if (!email || !name || !password || !role) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'email, name, password, and role are required'
      });
    }

    // Validate role
    if (!['student', 'vendor', 'admin'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        details: 'Role must be one of: student, vendor, admin'
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('Users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        details: `User with email ${email} already exists`
      });
    }

    // Insert new user with plain text password
    const { data: newUser, error } = await supabase
      .from('Users')
      .insert([{
        email: email,
        name: name,
        password: password,  // Plain text password
        role: role,
        active: true
      }])
      .select()
      .single();

    if (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        error: 'Registration failed',
        details: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    next(error);
  }
};

module.exports = {
  login,
  register
};
