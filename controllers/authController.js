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

    // Use PostgreSQL's crypt() to verify password
    // This query will only return a row if the password matches
    const { data: user, error } = await supabase
      .rpc('verify_user_password', {
        user_email: email,
        user_password: password
      });

    if (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        error: 'Login failed',
        details: error.message
      });
    }

    if (!user || user.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        details: 'Email or password is incorrect'
      });
    }

    // Check if user is active
    if (!user[0].active) {
      return res.status(403).json({
        error: 'Account inactive',
        details: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Login successful - return user info (without password_hash)
    res.status(200).json({
      success: true,
      user: {
        email: user[0].email,
        name: user[0].name,
        role: user[0].role,
        active: user[0].active
      }
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

    // Use PostgreSQL's crypt() to hash password
    const { data: newUser, error } = await supabase
      .rpc('create_user_with_hash', {
        user_email: email,
        user_name: name,
        user_password: password,
        user_role: role
      });

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
        email: email,
        name: name,
        role: role
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
