const { validationResult } = require('express-validator');
const { ErrorResponse } = require('./errorHandler');

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: errorMessages,
    });
  }
  next();
};
