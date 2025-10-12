const { body, validationResult } = require('express-validator');


// Current password must not be empty
const currentPasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
];


// New password rules

const passwordValidation = [
  body('Password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
];



// Confirm password must match new password

const confirmPasswordValidation = [
  body('confirmPassword')
    .notEmpty().withMessage('Confirm Password is required')
    .custom((value, { req }) => {
      if (value !== req.body.Password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];


// Middleware to handle errors

const passvalidate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {

    console.log(errors.array());

    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).json({
      success: false,
      error: errorMessages.join(', '),
    });
  }
  next();
};

module.exports = {
  currentPasswordValidation,
  passwordValidation,
  confirmPasswordValidation,
  passvalidate,
};
