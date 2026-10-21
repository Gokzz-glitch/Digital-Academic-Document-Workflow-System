const User = require('../models/User');
const { ErrorResponse } = require('../middleware/errorHandler');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { isEmailConfigured, sendPasswordResetEmail } = require('../services/email.service');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, department, year, section, rollNumber, phone } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new ErrorResponse('Email already exists', 400));
    }

    const user = await User.create({
      name, email, password, role: 'student', department, year, section, rollNumber, phone
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorResponse('Please provide an email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    if (!user.isActive) {
      return next(new ErrorResponse('Your account has been deactivated', 403));
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
      year: req.body.year,
      section: req.body.section,
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    if (!isEmailConfigured()) {
      return next(new ErrorResponse('Password reset is unavailable because email is not configured.', 503));
    }

    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists for that email, a password reset link has been sent.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await User.updateOne(
      { _id: user._id },
      { $set: { passwordResetToken: hashedToken, passwordResetExpires: expiresAt } }
    );

    const clientUrl = (process.env.CLIENT_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
    const sent = await sendPasswordResetEmail(user, resetUrl);
    if (!sent) {
      await User.updateOne(
        { _id: user._id },
        { $unset: { passwordResetToken: 1, passwordResetExpires: 1 } }
      );
      return next(new ErrorResponse('The password reset email could not be sent. Please try again later.', 503));
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists for that email, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const resetToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');
    const user = await User.findOne({
      passwordResetToken: resetToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ErrorResponse('Invalid token', 400));
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};
