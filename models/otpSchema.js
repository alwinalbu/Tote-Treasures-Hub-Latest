// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const OTPSchema = new Schema({
//     Email: {
//         type: String,
//     },
//     otp: {
//         type: Number
//     },
//     createdAt: {
//         type: Date
//     },
//     expiresAt: {
//         type: Date
//     }
// });

// const OTP = mongoose.model('OTP', OTPSchema);

// module.exports = OTP;

// models/otpSchema.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const OTPSchema = new Schema({
    Email: { type: String, unique: true },
    otp: { type: Number },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date }
});

// Auto-delete once expiresAt is past
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTP', OTPSchema);


// const OTPSchema = new Schema({
//     Email: {
//         type: String,
//         required: true, // required instead of unique
//         index: true
//     },
//     otp: {
//         type: Number,
//         required: true
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now
//     },
//     expiresAt: {
//         type: Date
//     }
// });

// const OTP = mongoose.model('OTP', OTPSchema);

// module.exports = OTP;
