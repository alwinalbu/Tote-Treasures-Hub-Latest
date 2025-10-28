// const { body, validationResult } = require('express-validator');

// const userSignupValidation = [
//   body('Username')
//     .notEmpty().withMessage('Username is required')
//     .isLength({ min: 4 }).withMessage('Username must be at least 4 characters')
//     .bail(),

//   body('Password')
//     .notEmpty().withMessage('Password is required')
//     .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
//     .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
//     .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
//     .bail(),

//   body('confirmPassword')
//     .notEmpty().withMessage('Confirm Password is required')
//     .custom((value, { req }) => {
//       if (value !== req.body.Password) {
//         throw new Error('Passwords do not match');
//       }
//       return true;
//     })
//     .bail(),

//   body('Email')
//     .notEmpty().withMessage('Email is required')
//     .isEmail().withMessage('Invalid email address')
//     .bail(),
// ];



// const validate = (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     console.log(errors.array()); // Log the errors to see what is being captured
//     const errorMessages = errors.array().map(error => error.msg);
//     req.flash('error', errorMessages);
//     return res.redirect('/signup');
//   }
//   next();
// };




// module.exports = {
//   userSignupValidation,
//   validate,
// };

const { body, validationResult } = require("express-validator");
const User = require("../models/userSchema"); // ✅ Import your User model

// ======================
// USER SIGNUP VALIDATION
// ======================
const userSignupValidation = [
  // 🔹 USERNAME
  body("Username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 4, max: 15 })
    .withMessage("Username must be between 4 and 15 characters long")
    .matches(/^[A-Za-z0-9_]+(?: [A-Za-z0-9_]+)*$/)
    .withMessage(
      "Username can contain letters, numbers, underscores, and single spaces (no leading, trailing, or multiple spaces)"
    )
    .custom((value) => {
      // Prevent only numbers or negatives
      if (/^-?\d+$/.test(value)) {
        throw new Error("Username cannot be only numbers or negative values");
      }
      return true;
    })
    .bail(),

  // 🔹 EMAIL
  body("Email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .custom(async (value) => {
      // ✅ Check if email already exists in DB
      const existingUser = await User.findOne({ Email: value });
      if (existingUser) {
        throw new Error("Email already in use");
      }
      return true;
    })
    .bail(),

  // 🔹 PASSWORD
  body("Password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    )
    .custom((value, { req }) => {
      if (value === req.body.Username) {
        throw new Error("Password cannot be the same as username");
      }
      if (/^-?\d+$/.test(value)) {
        throw new Error("Password cannot be only numbers or negative values");
      }
      return true;
    })
    .bail(),

  // 🔹 CONFIRM PASSWORD
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm Password is required")
    .custom((value, { req }) => {
      if (value !== req.body.Password) {
        throw new Error("Passwords do not match");
      }
      return true;
    })
    .bail(),
];

// ======================
// VALIDATE & SEND ERRORS
// ======================
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    req.flash("error", errorMessages);
    return res.redirect("/signup");
  }
  next();
};

module.exports = {
  userSignupValidation,
  validate,
};

