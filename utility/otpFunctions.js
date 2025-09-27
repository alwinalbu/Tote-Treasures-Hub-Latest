// const nodemailer=require('nodemailer')
// const flash=require('express-flash')
// const OTP=require('../models/otpSchema')

// //generate otp

// module.exports={
//     generateOTP:()=>{
//         return `${Math.floor(1000+Math.random()*9000)}`;
//     },

//     sendOTP: async (req, res, Email, otpToBeSent) => {
//         try {
//             const transporter = nodemailer.createTransport({
//                 port: 465,
//                 service: 'Gmail',
//                 auth: {
//                     user: "totetreasureshub@gmail.com",
//                     pass: "qvod ldhr wjre svjr"
//                 },
//                 secure: true,
//                 tls: {
//                     rejectUnauthorized: false
//                 }
//             } );

//             // OTP schema creating and how much time it should be valid
//             const duration = 60 * 1000; // 60 seconds

//             const createdAt = Date.now();
//             const expiresAt = createdAt + duration;

//             const newOTP = new OTP({
//                 Email: Email,
//                 otp: otpToBeSent,
//                 createdAt: createdAt,
//                 expiresAt: expiresAt, // Set the correct expiration time
//             });

//             // Log important information for debugging
//             console.log("Generated OTP:", otpToBeSent);
//             console.log("Created At:", createdAt);
//             console.log("Expires At:", expiresAt);

//             // OTP is saving
//             const createdOTPRecord = await newOTP.save();
//             console.log("Saved OTP Record:", createdOTPRecord);

//             // creating the Mail data
//             const message = "Enter This OTP To Continue For The Verification";
//             const mailData = {
//                 from: "totetreasureshub@gmail.com",
//                 to: Email,
//                 subject: "OTP FROM TOTE TREASURES HUB",
//                 html: `<p>${message}</p> <p style="color: tomato; font-size: 25px; letter-spacing: 2px;"><b>${otpToBeSent}</b></p><p>This Code <b>expires in <b>${duration / 1000} seconds</b>.</p>`,
//             }

//             // Sending mail data
//             transporter.sendMail(mailData, (error, info) => {
//                 if (error) {
//                     return console.log(error);
//                 }
//                 console.log("Successfully send otp");
//             });

//             // Redirect to the page after success
//             req.flash("success", "Successfully Send OTP ");
//             res.redirect("/emailVerification");

//         } catch (error) {
//             console.error(error);
//             req.flash("error", "Error in Sending OTP");
//             res.redirect("/signup");
//         }
//     },
//     resendOTP: async (req, res, Email, otpToBeSent) => {
//         try {
//             const transporter = nodemailer.createTransport({
//                 port: 465,
//                 service: 'Gmail',
//                 auth: {
//                     user: "totetreasureshub@gmail.com",
//                     pass: "qvod ldhr wjre svjr"
//                 },
//                 secure: true,
//                 tls: {
//                     rejectUnauthorized: false
//                 }
//             });

//             // OTP schema creating and how much time it should be valid
//             const duration = 60 * 1000; // 60 seconds

//             const createdAt = Date.now();
//             const expiresAt = createdAt + duration;

//             const newOTP = new OTP({
//                 Email: Email,
//                 otp: otpToBeSent,
//                 createdAt: createdAt,
//                 expiresAt: expiresAt, // Set the correct expiration time
//             });

//             // Log important information for debugging
//             console.log("Generated OTP:", otpToBeSent);
//             console.log("Created At:", createdAt);
//             console.log("Expires At:", expiresAt);

//             // OTP is saving
//             const createdOTPRecord = await newOTP.save();
//             console.log("Saved OTP Record:", createdOTPRecord);

//             // Mail data
//             const message = "Enter This OTP to Continue For The Verification";
//             const mailData = {
//                 from: "totetreasureshub@gmail.com",
//                 to: Email,
//                 subject: "OTP FROM TOTE TREASURES HUB",
//                 html: `<p>${message}</p> <p style="color: tomato; font-size: 25px; letter-spacing: 2px;"><b>${otpToBeSent}</b></p><p>This Code <b>expires in ${duration / 1000} seconds</b>.</p>`,
//             }

//             // Sending mail data
//             transporter.sendMail(mailData, (error, info) => {
//                 if (error) {
//                     return console.log(error);
//                 }
//                 console.log("Successfully send otp");
//             });

//             // Redirect to the page after success
//             req.flash("success", "OTP Successfully ");
//             res.redirect("/emailVerification");

//         } catch (error) {
//             console.error(error);
//             req.flash("error", "Error in Sending OTP");
//             res.redirect("/signup");
//         }
//     }, 
//     passwordsendOTP: async (req, res, Email, otpToBeSent) => {
//         try {
//             const transporter = nodemailer.createTransport({
//                 port: 465,
//                 service: 'Gmail',
//                 auth: {
//                     user: "totetreasureshub@gmail.com",
//                     pass: "qvod ldhr wjre svjr"
//                 },
//                 secure: true,
//                 tls: {
//                     rejectUnauthorized: false
//                 }
//             });

//             // OTP schema creating and how much time it should be valid
//             const duration = 60 * 1000; // 60 seconds

//             const createdAt = Date.now();
//             const expiresAt = createdAt + duration;

//             const newOTP = new OTP({
//                 Email: Email,
//                 otp: otpToBeSent,
//                 createdAt: createdAt,
//                 expiresAt: expiresAt, // Set the correct expiration time
//             });

//             // Log important information for debugging
//             console.log("Generated OTP:", otpToBeSent);
//             console.log("Created At:", createdAt);
//             console.log("Expires At:", expiresAt);

//             // OTP is saving
//             const createdOTPRecord = await newOTP.save();
//             console.log("Saved OTP Record:", createdOTPRecord);

//             // Mail data
//             const message = "Enter This OTP to Continue For The Verification";
//             const mailData = {
//                 from: "totetreasureshub@gmail.com",
//                 to: Email,
//                 subject: "OTP FROM TOTE TREASURES HUB",
//                 html: `<p>${message}</p> <p style="color: tomato; font-size: 25px; letter-spacing: 2px;"><b>${otpToBeSent}</b></p><p>This Code <b>expires in ${duration / 1000} seconds</b>.</p>`,
//             }

//             // Sending mail data
//             transporter.sendMail(mailData, (error, info) => {
//                 if (error) {
//                     return console.log(error);
//                 }
//                 console.log("Successfully send otp");
//             });

//             // Redirect to the page after success
//             req.flash("success", "OTP Successfully ");
//             res.redirect("/otpVerification");

//         } catch (error) {
//             console.error(error);
//             req.flash("error", "Error in Sending OTP");
//             res.redirect("/login");
//         }
//     },
//     passwordresendOTP: async (req, res, Email, otpToBeSent) => {
//         try {
//             const transporter = nodemailer.createTransport({
//                 port: 465,
//                 service: 'Gmail',
//                 auth: {
//                     user: "totetreasureshub@gmail.com",
//                     pass: "qvod ldhr wjre svjr"
//                 },
//                 secure: true,
//                 tls: {
//                     rejectUnauthorized: false
//                 }
//             });

//             console.log("Email:", Email);

//             // OTP schema creating and how much time it should be valid
//             const duration = 60 * 1000; // 60 seconds

//             const createdAt = Date.now();
//             const expiresAt = createdAt + duration;

//             const newOTP = new OTP({
//                 Email: Email,
//                 otp: otpToBeSent,
//                 createdAt: createdAt,
//                 expiresAt: expiresAt, // Set the correct expiration time
//             });

//             // Log important information for debugging
//             console.log("Generated OTP:", otpToBeSent);
//             console.log("Created At:", createdAt);
//             console.log("Expires At:", expiresAt);

//             // OTP is saving
//             const createdOTPRecord = await newOTP.save();
//             console.log("Saved OTP Record:", createdOTPRecord);

//             // Mail data
//             const message = "Enter This OTP to Continue For The Verification";
//             const mailData = {
//                 from: "totetreasureshub@gmail.com",
//                 to: Email,
//                 subject: "OTP FROM TOTE TREASURES HUB",
//                 html: `<p>${message}</p> <p style="color: tomato; font-size: 25px; letter-spacing: 2px;"><b>${otpToBeSent}</b></p><p>This Code <b>expires in ${duration / 1000} seconds</b>.</p>`,
//             }

//             // Sending mail data
//             transporter.sendMail(mailData, (error, info) => {
//                 if (error) {
//                     return console.log(error);
//                 }
//                 console.log("Successfully send otp");
//             });

//             // Redirect to the page after success
//             req.flash("success", "OTP Successfully ");
//             res.redirect("/otpVerification");

//         } catch (error) {
//             console.error(error);
//             req.flash("error", "Error in Sending OTP");
//             res.redirect("/login");
//         }
//     },
// }

// const nodemailer = require('nodemailer');
// const OTP = require('../models/otpSchema');

// module.exports = {
//     generateOTP: () => {
//         return `${Math.floor(1000 + Math.random() * 9000)}`;
//     },

//     // --------- send OTP for signup ---------
//     sendOTP: async (Email, otpToBeSent) => {
//         try {
//             const transporter = nodemailer.createTransport({
//                 service: 'Gmail',
//                 auth: {
//                     user: "totetreasureshub@gmail.com",
//                     pass: "qvod ldhr wjre svjr"
//                 },
//                 secure: true,
//                 tls: {
//                     rejectUnauthorized: false
//                 }
//             });

//             const duration = 60 * 1000;
//             const createdAt = Date.now();
//             const expiresAt = createdAt + duration;

//             const newOTP = new OTP({ Email, otp: otpToBeSent, createdAt, expiresAt });
//             await newOTP.save();

//             const message = "Enter This OTP To Continue For The Verification";
//             const mailData = {
//                 from: "totetreasureshub@gmail.com",
//                 to: Email,
//                 subject: "OTP FROM TOTE TREASURES HUB",
//                 html: `<p>${message}</p> 
//                        <p style="color: tomato; font-size: 25px; letter-spacing: 2px;">
//                        <b>${otpToBeSent}</b></p>
//                        <p>This Code <b>expires in ${duration / 1000} seconds</b>.</p>`
//             };

//             await transporter.sendMail(mailData);

//             console.log("✅ OTP sent to:", Email, " | OTP:", otpToBeSent);
//             return true;

//         } catch (error) {
//             console.error("❌ Error sending OTP:", error);
//             return false;
//         }
//     },

//     // --------- resend OTP ---------
//     resendOTP: async (Email, otpToBeSent) => {
//         try {
//             return await module.exports.sendOTP(Email, otpToBeSent); // reuse
//         } catch (error) {
//             console.error("❌ Error resending OTP:", error);
//             return false;
//         }
//     },

//     // --------- send OTP for password reset ---------
//     passwordsendOTP: async (Email, otpToBeSent) => {
//         try {
//             return await module.exports.sendOTP(Email, otpToBeSent); // reuse
//         } catch (error) {
//             console.error("❌ Error sending password OTP:", error);
//             return false;
//         }
//     },

//     // --------- resend OTP for password reset ---------
//     passwordresendOTP: async (Email, otpToBeSent) => {
//         try {
//             return await module.exports.sendOTP(Email, otpToBeSent); // reuse
//         } catch (error) {
//             console.error("❌ Error resending password OTP:", error);
//             return false;
//         }
//     }
// };

const nodemailer = require('nodemailer');
const OTP = require('../models/otpSchema');

const MAIL_USER = process.env.MAIL_USER || "totetreasureshub@gmail.com";
const MAIL_PASS = process.env.MAIL_PASS || "qvod ldhr wjre svjr"

const transporter = nodemailer.createTransport({
    port: 465,
    service: 'Gmail',
    auth: { user: MAIL_USER, pass: MAIL_PASS },
    secure: true,
    tls: { rejectUnauthorized: false }
});

module.exports = {
    generateOTP: () => Math.floor(1000 + Math.random() * 9000).toString(),

    sendOTP: async (Email, otpToBeSent, durationMs = 60 * 1000) => {
        try {
            if (!Email || !otpToBeSent) {
                console.error('[otpFunctions] Missing Email or OTP');
                return false;
            }

            const createdAt = Date.now();
            const expiresAt = createdAt + durationMs;

            // Upsert: replace any existing OTP doc for that email
            await OTP.findOneAndUpdate(
                { Email },
                { Email, otp: Number(otpToBeSent), createdAt: new Date(createdAt), expiresAt: new Date(expiresAt) },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            const message = "Enter this OTP to continue the verification";
            const mailData = {
                from: MAIL_USER,
                to: Email,
                subject: "OTP FROM TOTE TREASURES HUB",
                html: `<p>${message}</p>
               <p style="color: tomato; font-size: 25px;"><b>${otpToBeSent}</b></p>
               <p>This code expires in ${Math.floor(durationMs / 1000)} seconds.</p>`
            };

            const info = await transporter.sendMail(mailData);
            console.log(`[otpFunctions] OTP sent to ${Email} messageId=${info.messageId}`);
            return true;
        } catch (err) {
            console.error("[otpFunctions] Error sending OTP to", Email, err && err.message ? err.message : err);
            console.error(err);
            return false;
        }
    },

    resendOTP: async (Email, otpToBeSent) => module.exports.sendOTP(Email, otpToBeSent),
    passwordsendOTP: async (Email, otpToBeSent) => module.exports.sendOTP(Email, otpToBeSent),
    passwordresendOTP: async (Email, otpToBeSent) => module.exports.sendOTP(Email, otpToBeSent),
};