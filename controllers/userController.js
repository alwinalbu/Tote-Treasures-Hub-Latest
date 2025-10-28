const User = require('../models/userSchema')
const Category = require('../models/categorySchema')
const Product = require('../models/productSchema')
const Brand = require('../models/brandSchema')
const Cart = require("../models/cartSchema")
const Order = require("..//models/orderSchema");
const Coupon = require('../models/couponSchema')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer');
const jwt = require("jsonwebtoken");
const flash = require("express-flash")
const otpFunctions = require('../utility/otpFunctions')
const OTP = require('../models/otpSchema')
const session = require('express-session');
const crypto = require("crypto");
const razorpay = require("../utility/razorpay");
const mongoose = require('mongoose');
const passport = require('passport');
const invoice = require('../utility/invoice')
const Wallet = require('../models/walletSchema')
const { generateReferralCode } = require('../utility/generateReferralCode')
const path = require('path');
const { restockProducts } = require('../utility/inventoryUtils')
const Orders = require('..//models/orderSchema')

const MAIL_USER = process.env.MAIL_USER || "totetreasureshub@gmail.com";
const MAIL_PASS = process.env.MAIL_PASS || "qvod ldhr wjre svjr"

require("dotenv").config();


module.exports = {
    initial: async (req, res) => {
        try {
            const categories = await Category.find();
            const products = await Product.find({ Display: "Active" }).populate('offer');
            // Assuming your offer field in the Product model is named 'offer'

            res.render("user/landingpage", { user: '', products, categories });
        } catch (error) {
            console.log(error);
        }
    },

    GetAboutpage: async(req,res)=>{
        try {
            res.render('user/aboutus',)
        } catch (error) {
            res.render('errorpage'); 
        }
    },

    GetConatctpage:async(req,res)=>{
        try {
            res.render('user/contactUs',)
        } catch (error) {
            res.render('errorpage'); 
        }
    },


    // Route: /auth/google/callback
    googleSignInCallback: (req, res, next) => {
        passport.authenticate("google", async (err, user) => {
            if (err || !user) {
                req.flash("error", "Google login failed");
                return res.redirect("/login");
            }

            // Create JWT just like normal login
            const token = jwt.sign(
                { id: user._id, email: user.Email },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "1h" }
            );

            res.cookie("userJwt", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 60 * 1000
            });

            
            req.session.user = {
                id: user._id,
                email: user.Email,
                username: user.Username,
            };

            //  Create wallet if not exists
            let wallet = await Wallet.findOne({ UserID: user._id });
            if (!wallet) {
                await Wallet.create({
                    UserID: user._id,
                    Amount: 0,
                    TransactionType: "Initial"
                });
            }

            console.log("✅ Google user logged in:", user.Email);

            req.session.save((err) => {
                if (err) {
                    console.error("Google login session save error:", err);
                    req.flash("error", "Google login failed, please retry.");
                    return res.redirect("/login");
                }

                console.log("✅ Session saved successfully for Google user:", user.Email);
                res.redirect("/homepage");
            });
        })(req, res, next);
    },
   

    home: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1; 
            const limit = 8; 
    
            const user = req.session.user;
    
            // Check if the user is logged in
            if (!user) {
                // Redirect to the login page or handle it in your application logic
                res.redirect('/');
                return;
            }
    
            console.log("user inside homepage is", user);
    
            const userId = user.id;
    
            console.log("userID in homepage is", userId);
    
            const categories = await Category.find();
            const totalProductsCount = await Product.countDocuments({ Display: "Active" });
    
            const totalPages = Math.ceil(totalProductsCount / limit);
            const skip = (page - 1) * limit;
    
            const products = await Product.find({ Display: "Active" })
                .skip(skip)
                .limit(limit)
                .populate('offer');
    
            const userCart = await Cart.findOne({ UserId: userId });
    
            const totalQuantity = userCart ? userCart.Items.reduce((acc, item) => acc + item.Quantity, 0) : 0;
    
            req.session.cartCount = totalQuantity;
    
            const cartCount = req.session.cartCount;
    
            console.log('user cart count is ', cartCount);
    
            res.render("user/homepage", {
                user,
                products,
                categories,
                currentPage: page,
                totalPages,
                cartCount
            });
        } catch (error) {
            console.error(error);
            
            res.status(500).render('error', { error: 'An error occurred' });
        }
    },
    


    shop: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 8;

            const categories = await Category.find();
            const totalProductsCount = await Product.countDocuments({ Display: "Active" })

            const totalPages = Math.ceil(totalProductsCount / limit);
            const skip = (page - 1) * limit;

            const products = await Product.find({ Display: "Active" })
                .skip(skip)
                .limit(limit)
                .populate('offer');
 
            const brands = await Brand.find();
            res.render("user/shop", {
                user: req.session.user,
                products,
                categories,
                currentPage: page,
                totalPages,
                brands,
            });
        } catch (error) {
            console.log(error);

            res.status(500).send("An error occurred");
        }
    },



    login: (req, res) => {
        res.render('user/login', { error: req.session.error, user: "" });
    },

    userLogin: async (req, res) => {
        try {
            const { Email, Password } = req.body;

            // 1. Find user by email
            const user = await User.findOne({ Email });
            if (!user) {
                req.flash("error", "User not found. Please sign up first.");
                return res.redirect("/login");
            }

            // 2. Check status
            if (user.Status !== "Active") {
                req.flash("error", "Your account has been blocked.");
                return res.redirect("/login");
            }

            // 3. Compare password
            const isMatch = await bcrypt.compare(Password, user.Password);
            if (!isMatch) {
                req.flash("error", "Invalid email or password.");
                return res.redirect("/login");
            }

            // 4. Create session (for EJS pages)
            req.session.user = {
                id: user._id,
                email: user.Email,
                username: user.Username,
            };


            // 5. Create JWT (for APIs)
            const token = jwt.sign(
                { id: user._id, email: user.Email },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "1h" }
            );

            res.cookie("userJwt", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 60 * 1000 // 1 hour
            });

            req.session.save((err) => {
                if (err) {
                    console.error("Session save error during login:", err);
                    req.flash("error", "Login session error, please try again.");
                    return res.redirect("/login");
                }

                console.log("✅ Session saved successfully for login user:", user.Email);
                res.redirect("/homepage");
            });

        } catch (err) {
            console.error("Login error:", err);
            req.flash("error", "Something went wrong during login.");
            res.redirect("/login");
        }
    },


    // signup: (req, res) => {
    //     const referralCode = req.query.referralCode;
    //     console.log("Referral Code from URL:", referralCode);

        
    //     req.session.referralCode = referralCode;

    //     const error = req.flash('error');
    //     res.render("user/signup", { err: error, user: '', referralCode: referralCode });
    // },

    signup: (req, res) => {
        const referralCode = req.query.referralCode;
        console.log("Referral Code from URL:", referralCode);

        // Store the referral code in the session
        req.session.referralCode = referralCode;

        // 🔹 Fetch both error and success flash messages safely
        const error = req.flash("error") || [];
        const success = req.flash("success") || [];

        // 🔹 Always pass both to the EJS file
        res.render("user/signup", {
            err: error,
            success: success,
            user: "",
            referralCode: referralCode,
        });
    },


    postUserSignup: async (req, res) => {
        try {
            const { Username, Email, Password, confirmPassword } = req.body;
            const referralCode = req.query.referralCode || null;

            if (Password !== confirmPassword) {
                req.flash("error", "Passwords do not match");
                return res.redirect("/signup");
            }

            // Check if email already exists
            const existingUser = await User.findOne({ Email: { $regex: new RegExp(Email, "i") } });
            if (existingUser) {
                req.flash("error", "Email already exists");
                return res.redirect("/signup");
            }

            // Hash password but don’t save user yet
            const hashedPassword = await bcrypt.hash(Password, 10);

            // Store temp signup info in session (until OTP verified)
            req.session.pendingUser = {
                Username,
                Email,
                Password: hashedPassword,
                referralCode
            };

            // Generate + send OTP
            const otpToBeSent = otpFunctions.generateOTP();
            const sent = await otpFunctions.sendOTP(Email, otpToBeSent);

            if (sent) {
                req.flash("success", "OTP sent to your email.");
                return res.redirect("/emailVerification");
            } else {
                req.flash("error", "Failed to send OTP. Check mail config.");
                // delete req.session.pendingUser;
                return res.redirect("/signup");
            }
        } catch (error) {
            console.error(error);
            req.flash("error", "Signup failed. Try again.");
            res.redirect("/signup");
        }
    },



    getemailVerification: async (req, res) => {
        try {
            const Email = req.session.pendingUser?.Email; // ✅ fix

            if (!Email) {
                req.flash("error", "Session expired. Please signup again.");
                return res.redirect("/signup");
            }

            res.render("user/emailVerification", { messages: req.flash(), user: '' });
        } catch (error) {
            console.error("getemailVerification error:", err);
            req.flash("error", "Something went wrong.");
            res.redirect("/signup");
        }
    },

    postEmailVerification: async (req, res) => {
        try {
            if (!req.session.pendingUser || !req.session.OtpValid) {
                req.flash("error", "OTP not validated or session expired.");
                return res.redirect("/signup");
            }

            const { Username, Email, Password, referralCode } = req.session.pendingUser;
            console.log("inside the postemail userPending", req.session.pendingUser);

            // Check existing user again
            const existingUser = await User.findOne({ Email });
            if (existingUser) {
                req.flash("error", "Email already registered");
                delete req.session.pendingUser;
                return res.redirect("/login");
            }

            // Referrer logic
            let referrer = null;
            if (referralCode) {
                referrer = await User.findOne({ ReferralCode: referralCode });
            }

            // Create new user
            const newUser = await User.create({
                Username,
                Email,
                Password,
                ReferrerID: referrer ? referrer._id : null,
                ReferralCode: generateReferralCode()
            });

            // Wallet + bonus
            if (referrer) {
                await Wallet.findOneAndUpdate(
                    { UserID: referrer._id },
                    { $inc: { Amount: 100 }, TransactionDate: new Date() },
                    { new: true }
                );
                await User.findByIdAndUpdate(referrer._id, {
                    $push: { Referrals: newUser._id }
                });
                await Wallet.create({ UserID: newUser._id, Amount: 100 });
            } else {
                await Wallet.create({ UserID: newUser._id, Amount: 0 });
            }

            // ✅ delete OTP now (after success)
            await OTP.deleteOne({ Email });

            // Session + JWT
            req.session.user = { id: newUser._id, email: newUser.Email, username: newUser.Username };
            const accessToken = jwt.sign(
                { id: newUser._id, email: newUser.Email },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "1h" }
            );
            res.cookie("userJwt", accessToken, { httpOnly: true, maxAge: 60 * 60 * 1000 });

            delete req.session.pendingUser;
            delete req.session.OtpValid;

            
            req.session.save((err) => {
                if (err) {
                    console.error("Session save error:", err);
                    return res.json({ success: false, message: "Session save failed." });
                }

                console.log("✅ Session saved successfully for", newUser.Email);
                return res.json({ success: true, redirectUrl: "/homepage" });
            });

        } catch (error) {
            console.error(error);
            req.flash("error", "Email verification failed.");
            res.redirect("/signup");
        }
    },



    otpAuth: async (req, res, next) => {
        try {
            const { otp } = req.body;
            const Email = req.session.pendingUser?.Email;
            if (!Email) {
                req.flash("error", "Session expired. Please signup again.");
                return res.redirect("/signup");
            }

            console.log("User-provided OTP:", otp, "Email:", Email);

            const matchedOTPrecord = await OTP.findOne({ Email });
            if (!matchedOTPrecord) {
                req.flash("error", "OTP not found. Please resend.");
                return res.redirect("/emailVerification");
            }

            // expiry check
            if (matchedOTPrecord.expiresAt && matchedOTPrecord.expiresAt < Date.now()) {
                req.flash("error", "OTP expired. Please resend.");
                return res.redirect("/emailVerification");
            }

            const submitted = Number(otp);
            const stored = Number(matchedOTPrecord.otp);
            console.log("Comparing submitted:", submitted, "stored:", stored);

            if (submitted === stored) {
                req.session.OtpValid = true;
                console.log("✅ OTP verified for", Email);
                return next();
            } else {
                req.flash("error", "Invalid OTP. Please try again.");
                return res.redirect("/emailVerification");
            }
        } catch (err) {
            console.error("otpAuth error:", err);
            req.flash("error", "OTP verification failed.");
            return res.redirect("/emailVerification");
        }
    },

    resendOtp: async (req, res) => {
        try {
            const Email = req.session.pendingUser?.Email;
            if (!Email) {
                req.flash("error", "Session expired. Please signup again.");
                return res.redirect("/signup");
            }

            const otpToBeSent = otpFunctions.generateOTP();
            const sent = await otpFunctions.resendOTP(Email, otpToBeSent);

            if (sent) {
                req.flash("success", "OTP resent successfully.");
                return res.redirect("/emailVerification");
            } else {
                req.flash("error", "Failed to resend OTP.");
                return res.redirect("/emailVerification");
            }
        } catch (err) {
            console.error(err);
            req.flash("error", "Error resending OTP");
            res.redirect("/emailVerification");
        }
    },

    forgotpassword: (req, res) => {
        res.render("user/forgotpassword", {
            messages: req.flash(), user: req.session.user
        });
    },
  
    postforgotpassword: async (req, res) => {
        try {
            const Email = req.body.Email;
            req.session.Email = Email;

            const userData = await User.findOne({ Email });
            if (!userData) {
                req.flash("error", "Email not registered");
                return res.redirect("/forgotpassword");
            }

            if (userData.Status !== "Active") {
                req.flash("error", "Email is blocked");
                return res.redirect("/forgotpassword");
            }

            const otpToBeSent = otpFunctions.generateOTP();
            const sent = await otpFunctions.passwordsendOTP(Email, otpToBeSent);

            if (sent) {
                req.flash("success", "OTP sent to your email.");
                return res.redirect("/otpVerification");
            } else {
                req.flash("error", "Failed to send OTP.");
                return res.redirect("/forgotpassword");
            }
        } catch (error) {
            console.log(error);
            res.redirect("/login");
        }
    },


    PasswordResendOtp:async (req,res)=>{
        const Email = req.session.Email;
        if (!Email) {
            req.flash("error", "Session expired. Try again.");
            return res.redirect("/forgotpassword");
        }

        const otpToBeSent = otpFunctions.generateOTP();
        const sent = await otpFunctions.passwordresendOTP(Email, otpToBeSent);

        if (sent) {
            req.flash("success", "OTP resent successfully.");
            return res.redirect("/otpVerification");
        } else {
            req.flash("error", "Failed to resend OTP.");
            return res.redirect("/forgotpassword");
        }

    },

    getOtpVerification: async (req, res) => {
        try {
            // email is taken from the input 
            const Email = req.session.Email;
            console.log("this is new eamil", Email);
            // a timeout function to deleted the old otp after 1 minute
            setTimeout(() => {
                OTP.deleteOne({ Email: Email })
                    .then(() => {
                        console.log("Document deleted successfully");
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            }, 60000);
            res.render("user/otpVerification", { messages: req.flash(), user: req.session.user });
        } catch (error) {
            console.log(error);
            res.redirect("/login");
        }
    },
    passwordOtpAuth: async (req, res, next) => {
        try {

            let { otp } = req.body;

            // Ensure an OTP record exists for the email
            console.log(req.session.Email);

            const matchedOTPrecord = await OTP.findOne({
                Email: req.session.Email,
            });

            if (!matchedOTPrecord) {
                throw new Error("No OTP records found for the provided email.");
            }

            const { expiresAt } = matchedOTPrecord;
            console.log("Expires At:", expiresAt);

            if (expiresAt) {
                if (expiresAt < Date.now()) {
                    await OTP.deleteOne({ Email: req.session.Email });
                    throw new Error("The OTP code has expired. Please request a new one.");
                }
            } else {
                console.log("ExpiresAt is not defined in the OTP record.");
            }

            console.log("Stored OTP from the database:", matchedOTPrecord.otp);

            if (Number(otp) === matchedOTPrecord.otp) {
                req.session.OtpValid = true;
                next();
            } else {
                console.log("Entered OTP does not match stored OTP.");
                req.flash("error", "Invalid OTP. Please try again.");
                res.redirect("/otpVerification");
            }
        } catch (error) {
            console.error(error);
            res.redirect("/login");
        }
    },

 

    postOtpVerification: async (req, res) => {
        try {
            if (!req.session.Email || !req.session.OtpValid) {
                return res.json({ success: false, error: "OTP not validated or session expired." });
            }
            // OTP validated
            return res.json({ success: true });
        } catch (err) {
            console.error(err);
            return res.json({ success: false, error: "Internal error" });
        }
    },


    getCreateNewPassword: async (req, res) => {
        if (!req.session.Email || !req.session.OtpValid) {
            req.flash("error", "OTP not validated. Please verify your email first.");
            return res.redirect("/forgotpassword");
        }
        res.render('user/changePassword', { messages: req.flash(), user: req.session.user });
    },


    postCreateNewPassword: async (req, res) => {
        try {
            if (!req.session.Email || !req.session.OtpValid) {
                req.flash("error", "OTP not validated or session expired.");
                return res.redirect("/login");
            }

            const user = await User.findOne({ Email: req.session.Email });
            if (!user) {
                req.flash("error", "User not found.");
                return res.redirect("/login");
            }

            const hashedPassword = await bcrypt.hash(req.body.Password, 8);
            await User.updateOne({ _id: user._id }, { $set: { Password: hashedPassword } });

            // clear session flags
            delete req.session.OtpValid;
            delete req.session.Email;

            // log user in if you want:
            req.session.user = { id: user._id, email: user.Email, username: user.Username };

            res.redirect("/homepage");
        } catch (err) {
            console.error(err);
            req.flash("error", "Failed to reset password.");
            res.redirect("/login");
        }
    },

    getproductViewDetailspage: async (req, res) => {
        const _id = req.params.id; // Use req.params.id
        const categories = await Category.find();
        const brands = await Brand.find();
        const product = await Product.findOne({ _id }).populate('Category BrandName');
        console.log(product);
        
        res.render("user/productViewDetailspage", {
            product,
            categories,
            brands,
            user: req.session.user,
            wishlist: req.session.user ? req.session.user.wishlist : null,
        });
    },


    // --------------------------------------------seacrh---------------------------------------------------------------
    searchByNames: async (req, res) => {
        try {
            const { searchNames } = req.query;

            console.log('Search names:', searchNames);

            const products = await Product.find().populate('offer');

            const filteredProducts = products.filter(product => {
                const productName = product.ProductName.trim().toLowerCase()
                return searchNames.split(',').some(searchName => productName.includes(searchName.trim().toLowerCase()));
            });

            console.log("filtered products:", filteredProducts);

            res.render('user/searchResults', { user: req.session.user ?? null, products: filteredProducts});

        } catch (error) {
            console.log(error);
        }
    },


    // ---------------------addtocart------------------------------------------------------------------------------


   
    addtocart: async (req, res) => {
        try {
            const user = req.session.user;

            if (!user || !user.id) {
                return res.status(400).json({ success: false, error: "Invalid user session" });
            }

            const userId = user.id;  // ✅ fixed
            const productId = req.params.productId;
            const fromWishlist = req.query.from === "wishlist";

            // Check if cart exists
            let usercart = await Cart.findOne({ UserId: userId });

            if (!usercart) {
                usercart = new Cart({
                    UserId: userId,
                    Items: [],
                    TotalAmount: 0
                });
            }

            // Check if product already exists in cart
            const existingItem = usercart.Items.find(item => item.ProductId.toString() === productId);

            if (existingItem) {
                existingItem.Quantity += 1;
            } else {
                usercart.Items.push({
                    ProductId: productId,
                    Quantity: 1
                });
            }

            // Recalculate total
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ success: false, error: "Product not found" });
            }

            usercart.TotalAmount = await Promise.all(
                usercart.Items.map(async item => {
                    const p = await Product.findById(item.ProductId);
                    return p ? p.DiscountAmount * item.Quantity : 0;
                })
            ).then(amounts => amounts.reduce((a, b) => a + b, 0));

            await usercart.save();

            // If from wishlist → remove from wishlist
            if (fromWishlist) {
                await User.findByIdAndUpdate(userId, {
                    $pull: { Wishlist: { productId: productId } }
                });
            }

            return res.json({ success: true, message: "Product added to cart" });

        } catch (error) {
            console.error("Error in addtocart:", error);
            res.status(500).json({ success: false, error: "Internal server error" });
        }
    },


    // --------------------------------cartpage----------------------------------------------------------------


    getCartpage: async (req, res) => {
        try {
            const userId = req.session.user?.id;
            if (!userId) return res.redirect("/login");

            const user = await User.findById(userId);
            if (!user) return res.redirect("/login");

            const cart = await Cart.findOne({ UserId: userId })
                .populate("Items.ProductId")
                .populate("coupon");

            const today = new Date();
            const coupons = await Coupon.find({
                Status: "Active",
                startDate: { $lte: today },
                expiration_date: { $gte: today }
            });

            // cartCount is already set by middleware (res.locals.cartCount)
            const cartCount = res.locals.cartCount || 0;

            res.render("user/cartpage", { user, cart, coupons, cartCount });
        } catch (error) {
            console.error("Error in getCartpage:", error);
            res.status(500).send("Internal Server Error");
        }
    },



    postCart: async (req, res) => {

        req.session.totalPrice = parseInt(req.body.totalPrice);

        console.log("TOTTAL PRICE in session ", req.session.totalPrice)

        res.json({ success: true })

    },


    //---------------------------------------------remove coupen------------------------------------------------------


    removeCoupon: async (req, res) => {
        try {
            const userId = req.session.user?.id;

            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }

            // 1. Remove coupon from cart
            await Cart.findOneAndUpdate(
                { UserId: userId },
                { $unset: { coupon: "" } }
            );

            // 2. Update coupon status → pending → removed
            await Coupon.updateOne(
                { "usedBy.userId": userId, "usedBy.status": "pending" },
                { $set: { "usedBy.$.status": "removed" } }
            );

            // 3. Clear from session if exists
            if (req.session.temporaryCouponInfo) {
                delete req.session.temporaryCouponInfo;
            }

            return res.json({ success: true, message: "Coupon removed successfully" });
        } catch (error) {
            console.error("Error removing coupon:", error);
            return res.status(500).json({ error: "Failed to remove coupon" });
        }
    },

    // ----------------------------------------------update Quantity -------------------------------------------------

    updateQuantity: async (req, res) => {
        try {
            const userId = req.session.user?.id;
            const { productId, change } = req.body;

            if (!userId) {
                return res.status(401).json({ success: false, error: "Please login first" });
            }

            const usercart = await Cart.findOne({ UserId: userId });
            const product = await Product.findById(productId);

            if (!usercart || !product) {
                return res.status(404).json({ success: false, error: "Product or cart not found" });
            }

            const cartItem = usercart.Items.find(item => item.ProductId.equals(productId));
            if (!cartItem) {
                return res.status(404).json({ success: false, error: "Item not in cart" });
            }

            let newQuantity = cartItem.Quantity + parseInt(change, 10);

            //  Prevent < 1
            if (newQuantity < 1) {
                return res.json({
                    success: false,
                    error: "Quantity cannot be less than 1. Remove the product if you don't want it.",
                    newQuantity: cartItem.Quantity
                });
            }

            //  Prevent > stock
            if (newQuantity > product.AvailableQuantity) {
                return res.json({
                    success: false,
                    error: `Only ${product.AvailableQuantity} items available in stock.`,
                    newQuantity: cartItem.Quantity
                });
            }

            //  Save valid new quantity
            cartItem.Quantity = newQuantity;
            await usercart.save();

            return res.json({ success: true, newQuantity });
        } catch (error) {
            console.error("Error updating quantity:", error);
            res.status(500).json({ success: false, error: "Internal Server Error" });
        }
    },



    // -------------------------------remove from cart----------------------------------------------------------------


    removeItemFromCart: async (req, res) => {
        try {
            const userId = req.session.user?.id;
            const productId = req.params.productId;

            if (!userId) return res.redirect("/login");

            await Cart.findOneAndUpdate(
                { UserId: userId },
                { $pull: { Items: { ProductId: productId } } },
                { new: true }
            );

            res.redirect("/cartpage");
        } catch (error) {
            console.error("Error removing item:", error);
            res.redirect("/cartpage");
        }
    },


    // --------------------------------------------User Profile------------------------------------------

    profile: async (req, res) => {
        try {
            const userId = req.session.user.id; 
            const user = await User.findById(userId).populate('Referrals').populate('ReferrerID');

            if (!user) {
                return res.status(404).send('User not found');
            }

            // Construct the referral link
            const referralLink = `${process.env.BASE_URL}/signup?referralCode=${user.ReferralCode}`;
      
            res.render("user/userprofile", {
                user,
                referralLink,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    },

    // --------------------------------------------User Change Password--------------------------------------------------

    changePassword:async (req, res) => {
        const userId = req.session.user?.id;

        console.log("Came inside the Password change");

        try {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            const dbPassword = user.Password;

            // 1. Verify current password
            const passwordIsValid = await bcrypt.compare(req.body.currentPassword, dbPassword);
            if (!passwordIsValid) {
                return res.status(400).json({ error: "Current Password is incorrect" });
            }

            // 2. Prevent reusing the same password
            const isNewPasswordSameAsCurrent = await bcrypt.compare(req.body.Password, dbPassword);
            if (isNewPasswordSameAsCurrent) {
                return res.status(400).json({
                    error: "New Password cannot be the same as the current one",
                    retry: true,
                });
            }

            // 3. Update password (validator already checked confirmPassword)
            const passwordHashed = await bcrypt.hash(req.body.Password, 8);
            await User.updateOne(
                { _id: userId },
                { $set: { Password: passwordHashed } }
            );

            res.json({
                success: true,
                message: "Password changed successfully",
            });

        } catch (err) {
            console.error("Change password error:", err);
            res.status(500).json({ success: false, error: err.message || "Password change failed" });
        }
    },

    // ------------------------------------------get address page--------------------------------------------


    getEditAddress: async (req, res) => {
        const userId = req.session.user?.id;
        const user = await User.findById(userId);
        console.log(user.Address);
        res.render("user/editAddress", { user });
    },

    //   -----------------------------------------------add new address------------------------------------------


    postAddressForm: async (req, res) => {
        const userId = req.session.user?.id;
        const address = await User.findByIdAndUpdate(
            userId,
            { $push: { Address: req.body } },
            { new: true }
        );
        // console.log("Adress which got added is this ",address);
        req.flash("success", "Address Added successfully");
        res.redirect("/editAddress");

    },

    // ------------------------------------------------edit address-------------------------------------------------

    postEditAddress: async (req, res) => {

        const addressId = req.params._id;

        const userId = req.session.user?.id;

        console.log("user id is ", userId);

        const user = await User.findById(userId)

        try {
            if (user) {

                const { Name, AddressLane, City, State, Pincode, Mobile } = req.body

                const addressIndex = user.Address.findIndex((a) => a._id.toString() === addressId);

                if (addressIndex !== -1) {

                    user.Address[addressIndex].Name = Name;
                    user.Address[addressIndex].AddressLane = AddressLane;
                    user.Address[addressIndex].City = City;
                    user.Address[addressIndex].State = State;
                    user.Address[addressIndex].Pincode = Pincode;
                    user.Address[addressIndex].Mobile = Mobile;

                    await user.save();


                    console.log("Address updated successfully");
                    req.flash("success", "Address updated successfully");
                    res.redirect("/editAddress");

                } else {
                    console.log("Address Not Found")
                    req.flash("error", "Address Not Found")
                    res.redirect("/editAddress");
                }

            } else {
                req.flash("error", "User Not Found")
                res.redirect("/editAddress");
            }

        } catch (error) {
            req.flash("error", "Error In Updating Address")
            res.redirect("/editAddress");
        }

    },

    // -----------------------------------------delete the address--------------------------------------------------------


    deleteAddress: async (req, res) => {
        console.log('test');
        const userId = req.session.user?.id;
        const addressId = req.params._id; // Assuming you receive the address ID to delete from the request parameters

        console.log("address id is to delete", addressId)
        try {
            const user = await User.findById(userId);

            if (!user) {
                console.log("User not found");
                req.flash("error", "User not found");
                return res.redirect("/editAddress");
            }

            const addressIndex = user.Address.findIndex(
                (a) => a._id.toString() === addressId
            );

            if (addressIndex === -1) {
                console.log("Address not found");
                req.flash("error", "Address not found");
                return res.redirect("/editAddress");
            }

            user.Address.splice(addressIndex, 1); // Removing the address at the found index

            await user.save();

            console.log("Address deleted successfully");
            req.flash("success", "Address deleted successfully");
            return res.redirect("/editAddress");
        } catch (error) {
            console.error("Error deleting address:", error.message);
            req.flash("error", "Error deleting address");
            return res.status(500).send("Internal Server Error");
        }
    },

    //   --------------------------------------------------Orderlist--------------------------------------------------------

    getOrderlist: async (req, res) => {
        try {
            const userId = req.session.user?.id;
    
            const user = await User.findById(userId);
    
            const page = parseInt(req.query.page) || 1;
            const limit = 8;
    
            const totalOrderCount = await Order.countDocuments({ UserId: userId });
    
            const totalPages = Math.ceil(totalOrderCount / limit);
            const skip = (page - 1) * limit;
    
            
            const orders = await Order.find({ UserId: userId })
                .sort({ OrderDate: -1 })  
                .skip(skip)
                .limit(limit);
    
            res.render("user/orderlist", { 
                user, 
                order: orders,  // Use the sorted orders
                currentPage: page,
                totalPages
            });
        } catch (error) {
            console.error(error);
            // Render the error page with the error information
            res.render("errorpage", { error: "Internal Server Error" });
        }
    },
    

    getOrderDetails: async (req, res) => {
        try {
            const userId = req.session.user?.id;
    
            console.log("userid is", userId);
    
            const user = await User.findById(userId);
    
            const orderId = req.params._id;

            const order = await Orders.findById(orderId)
                .populate("Items.ProductId")   
                .populate("Coupon")            
                .populate("UserId");           
    
            const addressId = order.Address._id;
            console.log(addressId, "ADDRESSiD");
    
            console.log(order, "order");
    
            // Check if coupon information exists
            if (order.Coupon) {
                const couponCode = order.Coupon.code;
                console.log("coupon code is ", couponCode);
    
                const discountAmount = order.DiscountAmount;
                console.log(discountAmount, "discount amount");
            } else {
                console.log("No coupon applied to this order");
            }
    
            res.render("user/orderdetails", { user, order });
            console.log(order,"@@@@@@@@@");
        } catch (error) {
            console.log(error);
            res.render("errorpage", { error: "Internal Server Error" });
        }
    },
    
    
    

    // -------------------------------------------------------order cancel---------------------------------------------

    cancelOrder: async (req, res) => {
        const orderId = req.params._id;

        try {
            const order = await Order.findById(orderId).populate('UserId');

            if (!order) {
                return res.status(404).json({ success: false, message: "Order not found" });
            }

            const userId = order.UserId._id; //  Always use _id
            const method = order.PaymentMethod.toLowerCase();

            
            // 1. COD Orders
          
            if (method === "cod") {
                if (order.Status === "Order Placed" || order.Status === "Shipped") {
                    await restockProducts(order.Items);

                    order.Status = "Cancelled";
                    order.PaymentStatus = "Cancelled - No Payment Required";
                    await order.save();

                    return res.status(200).json({ success: true, message: "Order cancelled (COD - no refund)" });
                }
            }

           
            // 2. Prepaid Orders (Online / Wallet)
            
            else if (["online", "wallet", "upi", "card", "netbanking"].includes(method)) {
                const updatedOrder = await Order.findByIdAndUpdate(
                    orderId,
                    { $set: { Status: "Cancelled" } },
                    { new: true }
                );

                const TotalPrice = updatedOrder.TotalPrice;
                console.log("Refund amount:", TotalPrice);

                // Refund to wallet (create wallet if it doesn’t exist)
                const wallet = await Wallet.findOneAndUpdate(
                    { UserID: userId },
                    { $inc: { Amount: TotalPrice } },
                    { new: true, upsert: true }
                );
                console.log("Wallet after refund:", wallet);

                // Reset coupon if one was applied
                if (updatedOrder.Coupon) {
                    const coupon = await Coupon.findById(updatedOrder.Coupon);

                    if (coupon) {
                        const now = new Date();
                        if (coupon.expiration_date >= now && coupon.Status === "Active") {
                            await Coupon.updateOne(
                                { _id: updatedOrder.Coupon, "usedBy.userId": userId },
                                { $set: { "usedBy.$.status": "removed" } }
                            );
                            console.log("Coupon reset for user:", userId);
                        } else {
                            console.log("Coupon NOT reset (expired or inactive).");
                        }
                    }
                }

                // Update payment status
                updatedOrder.PaymentStatus = "Refund To Wallet";

                // Restock products
                await restockProducts(order.Items);

                await updatedOrder.save();

                return res.status(200).json({ success: true, message: "Order cancelled and refunded" });
            }

            
            // 3. Not Cancellable
          
            else {
                return res.status(400).json({ success: false, message: "Order cannot be cancelled with this payment method" });
            }

        } catch (error) {
            console.error("Error cancelling the order:", error);
            return res.status(500).json({ success: false, message: "Error cancelling the order" });
        }
    },


    // -------------------------------------------------checkout page-----------------------------------------------------

    getCheckout: async (req, res) => {
        const userId = req.session.user?.id;

        console.log("user id is to checkout ", userId)
        const user = await User.findById(userId);
        const cart = await Cart.findOne({ UserId: userId }).populate(
            "Items.ProductId"
        );
       
        if (!cart) {
            res.redirect('/cartpage')
        } else {
            res.render("user/checkout", { messages: req.flash(), user });
        }
    },


    // ----------------------------------post Checkout server side ----------------------------------------------------
    postCheckout: async (req, res) => {
        try {
            console.log("reached here for postcheckout ", req.body);

            const PaymentMethod = req.body.paymentMethod;
            const Address = req.body.Address;
            const userId = req.session.user?.id;
            const amount = req.session.totalPrice;
            const currentDate = new Date();

            const user = await User.findById(userId);
            const Email = user.Email;

            const cart = await Cart.findOne({ UserId: userId }).populate("Items.ProductId");
            if (!cart || cart.Items.length === 0) {
                return res.status(400).json({ cartEmpty: true });
            }

            const addressData = await User.findOne(
                { _id: userId },
                { Address: { $elemMatch: { _id: new mongoose.Types.ObjectId(Address) } } }
            );

            if (!addressData || !addressData.Address) {
                console.error("Address data not found.");
                return res.status(400).json({ error: "No address found" });
            }

            const add = {
                Name: addressData.Address[0].Name,
                Address: addressData.Address[0].AddressLane,
                Pincode: addressData.Address[0].Pincode.toString(),
                City: addressData.Address[0].City,
                State: addressData.Address[0].State,
                Mobile: addressData.Address[0].Mobile,
            };

            const fourDaysFromNow = new Date(currentDate);
            fourDaysFromNow.setDate(currentDate.getDate() + 4);
            const deliveryDate = fourDaysFromNow.toLocaleDateString();

            const newOrders = new Order({
                UserId: userId,
                Items: cart.Items,
                OrderDate: currentDate,
                deliveryDate,
                TotalPrice: amount,
                Address: add,
                PaymentMethod: PaymentMethod,
            });

            req.session.orderId = newOrders._id;

            // ---------------------------------------------stock modifying-----------------------------------------------
            for (const item of newOrders.Items) {
                const product = await Product.findById(item.ProductId);
                if (product) {
                    const updatedQuantity = product.AvailableQuantity - item.Quantity;
                    product.AvailableQuantity = Math.max(updatedQuantity, 0);
                    if (product.AvailableQuantity === 0) {
                        product.Status = "Out of Stock";
                    }
                    await product.save();
                }
            }

            // -------------------------------------------Save Coupon Information ------------------------------------------
            if (req.session.temporaryCouponInfo) {
                const { couponCode, discount } = req.session.temporaryCouponInfo;
                const couponData = await Coupon.findById(couponCode);

                if (couponData && currentDate >= couponData.startDate && currentDate <= couponData.expiration_date) {
                    if (PaymentMethod === "cod" || PaymentMethod === "wallet") {
                        // ✅ Immediate payment → mark coupon as used
                        await Coupon.updateOne(
                            { _id: couponCode, "usedBy.userId": userId, "usedBy.status": "pending" },
                            { $set: { "usedBy.$.status": "used", "usedBy.$.usedAt": new Date() } }
                        );

                        newOrders.Coupon = couponCode;
                        newOrders.DiscountAmount = discount;
                        delete req.session.temporaryCouponInfo;
                    } else if (PaymentMethod === "online") {
                        // ⏳ Online → keep coupon "pending" until verifyPayment
                        newOrders.Coupon = couponCode;
                        newOrders.DiscountAmount = discount;
                    }
                } else {
                    console.error("Coupon expired or invalid");
                    return res.status(400).json({ error: "Coupon is invalid or expired." });
                }
            }

            // -------------------------------------------COD------MAIL SENDING ------------------------------------------------------
            if (PaymentMethod === "cod") {
               const transporter = nodemailer.createTransport({
                   port: 465,
                   service: 'Gmail',
                   auth: { user: MAIL_USER, pass: MAIL_PASS },
                   secure: true,
                   tls: { rejectUnauthorized: false }
               });

                const mailData = {
                    from: "totetreasureshub@gmail.com",
                    to: Email,
                    subject: "Your Orders!",
                    text: `Hello! ${user.Username}, Your order has been received and will be processed within ${deliveryDate}. Your total price is ${amount}`,
                };

                transporter.sendMail(mailData, (error) => {
                    if (error) console.error("Mail error:", error);
                });

                await newOrders.save();
                await Cart.findByIdAndDelete(cart._id);
                return res.json({ codSuccess: true });
            }

            // -------------------------------------------Online Payment (Razorpay) ------------------------------------------------------
            if (PaymentMethod === "online") {
                const order = {
                    amount: amount,
                    currency: "INR",
                    receipt: req.session.orderId,
                };

                try {
                    const createdOrder = await razorpay.createRazorpayOrder(order);
                    newOrders.razorpayOrderId = createdOrder.id;
                    await newOrders.save();
                    return res.json({ onlineSuccess: true, createdOrder, order });
                } catch (err) {
                    console.error("Razorpay order creation failed:", err);
                    return res.json({ onlineSuccess: false, error: "Razorpay order creation failed" });
                }
            }

            // -------------------------------------------Wallet Payment ------------------------------------------------------
            if (PaymentMethod === "wallet") {
                const wallet = await Wallet.findOne({ UserID: userId });
                if (!wallet) {
                    if (req.session.temporaryCouponInfo) delete req.session.temporaryCouponInfo;
                    return res.json({ walletSuccess: false, error: "Wallet not found for the user" });
                }

                if (wallet.Amount < amount) {
                    if (req.session.temporaryCouponInfo) delete req.session.temporaryCouponInfo;
                    return res.json({ walletSuccess: false, error: "Insufficient funds in the wallet" });
                }

                wallet.Amount -= amount;
                await wallet.save();

              const transporter = nodemailer.createTransport({
                  port: 465,
                  service: 'Gmail',
                  auth: { user: MAIL_USER, pass: MAIL_PASS },
                  secure: true,
                  tls: { rejectUnauthorized: false }
              });

                const mailData = {
                    from: "totetreasureshub@gmail.com",
                    to: Email,
                    subject: "Your Orders!",
                    text: `Hello! ${user.Username}, Your order has been received and will be processed within ${deliveryDate}. Your total price is ${amount}. Your wallet balance is now ${wallet.Amount}.`,
                };

                transporter.sendMail(mailData, (error) => {
                    if (error) console.error("Mail error:", error);
                });

                newOrders.OrderDate = new Date();
                newOrders.TotalPrice = amount;
                newOrders.PaymentStatus = "Paid";
                newOrders.PaymentMethod = "wallet";

                await newOrders.save();
                await Cart.findByIdAndDelete(cart._id);

                return res.json({ walletSuccess: true });
            }
        } catch (error) {
            console.error(error);
            if (req.session.temporaryCouponInfo) {
                delete req.session.temporaryCouponInfo;
            }
            res.json({ error: "Some error occurred" });
        }
    },

    // -----------------------------------------------END-----------------------------------------------------------------------------------




    // ------------------------------------------------------verifyPayment-------------------------------------------------------------------

    verifyPayment: async (req, res) => {
        console.log("Verify payment body inside:", req.body);

        try {
            const hmac = crypto.createHmac("sha256", process.env.KEY_SECRET);
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body.payment;

            hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
            const calculatedHmac = hmac.digest("hex");

            console.log("Calculated HMAC:", calculatedHmac);
            console.log("Received Signature:", razorpay_signature);

            if (calculatedHmac === razorpay_signature) {
                const orderId = req.session.orderId;

                if (!mongoose.Types.ObjectId.isValid(orderId)) {
                    console.error("Invalid order ID format.");
                    return res.status(400).json({ error: "Invalid order ID format." });
                }

                const order = await Order.findById(orderId).populate("UserId");
                if (!order) {
                    console.error("Order not found.");
                    return res.status(404).json({ error: "Order not found." });
                }

                // ✅ Update order details
                order.PaymentStatus = "Paid";
                order.PaymentMethod = "Online";

                // ✅ Finalize coupon if applied
                if (order.Coupon) {
                    await Coupon.updateOne(
                        { _id: order.Coupon, "usedBy.userId": order.UserId, "usedBy.status": "pending" },
                        { $set: { "usedBy.$.status": "used", "usedBy.$.usedAt": new Date() } }
                    );
                    console.log("✅ Coupon finalized for user:", order.UserId);
                }

                await order.save();

                // ✅ Clear cart after successful payment
                await Cart.findOneAndDelete({ UserId: order.UserId });

                // ✅ Clean session
                if (req.session.temporaryCouponInfo) {
                    delete req.session.temporaryCouponInfo;
                }

                // ✅ Send Email Confirmation
                const transporter = nodemailer.createTransport({
                    port: 465,
                    service: "Gmail",
                    auth: { user: MAIL_USER, pass: MAIL_PASS },
                    secure: true,
                    tls: { rejectUnauthorized: false },
                });

                const mailData = {
                    from: "totetreasureshub@gmail.com",
                    to: order.UserId.Email,
                    subject: "Payment Successful - Your Order Confirmation",
                    text: `Hello ${order.UserId.Username}, your payment of ₹${order.TotalPrice} was successful. 
Your order will be delivered by ${order.deliveryDate}. Thank you for shopping with us!`,
                };

                transporter.sendMail(mailData, (error) => {
                    if (error) console.error("Mail error:", error);
                });

                console.log("HMAC verification success & email sent");
                return res.json({ success: true });
            } else {
                console.log("HMAC verification failed");
                return res.json({ failure: true });
            }
        } catch (error) {
            console.error("An error occurred in verifyPayment:", error);
            return res.status(500).json({ error: "An error occurred." });
        }
    },
    
    // -----------------------------------------------------Address adding in checkoutpage---------------------------------------------------

    addAddressCheckout: async (req, res) => {
        const userId = req.session.user?.id;
        const address = await User.findByIdAndUpdate(
            userId,
            { $push: { Address: req.body } },
            { new: true }
        );
        req.flash("success", "New Address Added successfully");
        res.redirect("/checkout");
    },
    // --------------------------------------------------OrderSuccess--------------------------------------------------------


    getOrderSucces: async (req, res) => {
        const userId = req.session.user?.id;
        const user = await User.findById(userId);
        
        res.render("user/orderSuccess", { user });
    },

    // ------------------------------------------------download invoice------------------------------------------------------------------------------------


    //  Download Invoice - Generate PDF
    downloadInvoice: async (req, res) => {
        try {
            const orderData = await Order.findOne({ _id: req.body.orderId })
                .populate("Items.ProductId")
                .populate("Coupon"); // for code

            if (!orderData) {
                return res.status(404).json({ error: "Order not found" });
            }

            const couponCode = orderData.Coupon ? orderData.Coupon.code : "";
            const discountAmount = Number(orderData.DiscountAmount || 0);

            // Pass ALL arguments in the right order
            await invoice.order(
                orderData,
                orderData.Status,
                orderData.PaymentMethod,
                couponCode,
                discountAmount
            );

            // Let frontend hit the download endpoint
            res.json({ orderId: orderData._id });
        } catch (error) {
            console.error("Error in downloadInvoice:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    },

    // Serve the generated file
    downloadfile: async (req, res) => {
        try {
            const id = req.params._id;
            const filePath = path.join(__dirname, "..", "public", "pdf", `${id}.pdf`);

            res.download(filePath, `invoice_${id}.pdf`, (err) => {
                if (err) {
                    console.error(`Error sending file: ${err}`);
                    res.status(500).send("Internal Server Error");
                }
            });
        } catch (error) {
            console.error("Error in downloadfile:", error);
            res.status(500).send("Internal Server Error");
        }
    },
    // ----------------------------------------------------------Retrun the order----------------------------------------------------

    // User requests a return
    returnOrder: async (req, res) => {
        const orderId = req.params._id;
        const reason = req.body.returnReason;

        try {
            console.log("Reason for return is:", reason);

            const order = await Order.findOneAndUpdate(
                { _id: orderId },
                { $set: { Status: "Return Pending", ReturnReason: reason } },
                { new: true }
            );

            if (!order) {
                return res.status(404).json({ error: "Order not found" });
            }

            console.log("Return order status:", order.Status);

            return res.status(200).json({
                success: true,
                message: "Return requested successfully.",
                order
            });
        } catch (error) {
            console.error("Error requesting return:", error.message);
            return res.status(500).json({ error: "Error requesting return" });
        }
    },

    //-----------------Cancel The Return Order---------------------------------------------

    CancelreturnOrder: async (req, res) => {
        const orderId = req.params._id;

        try {
            const order = await Order.findOneAndUpdate(
                { _id: orderId },
                { $set: { Status: "Delivered", ReturnReason: null } },
                { new: true }
            );

            if (!order) {
                return res.status(404).json({ error: "Order not found" });
            }

            return res.status(200).json({
                success: true,
                message: "Return request canceled successfully"
            });
        } catch (error) {
            console.error("Error canceling return request:", error);
            return res.status(500).json({ error: "Error canceling return request" });
        }
    },

    // -----------------------------------------------------user logout-------------------------------------------------

    getUserLogout: (req, res) => {
        // Clear JWT cookie
        res.clearCookie("userJwt");

        // Destroy session
        req.session.destroy((err) => {
            if (err) {
                console.error("Logout error:", err);
                return res.redirect("/homepage"); // fallback
            }
            res.redirect("/login");
        });
    }



};

