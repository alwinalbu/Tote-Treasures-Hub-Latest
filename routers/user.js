const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const wishlisitController = require('../controllers/wishlistController');
const couponController = require('../controllers/couponController');
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const cartController = require("../controllers/cartController");
const walletController = require('../controllers/walletController');
const { userSignupValidation, validate } = require('../middlewares/signupvalidation');
const { passwordValidation, confirmPasswordValidation, passvalidate, currentPasswordValidation } = require('../middlewares/newpasswordvalidate');
const calculateCartCount = require('../middlewares/cartCountMiddleware');
const { userTokenAuth, userExist } = require('../middlewares/userAuth');
const requireSession = require('../middlewares/requireSession'); // ✅ new middleware
const passport = require('passport');

// ----------------- Public Landing -----------------
router.get('/', calculateCartCount, userController.initial);

// ----------------- Auth -----------------
router.get('/login', userExist, userController.login);
router.post('/login', userController.userLogin);

// ✅ Start Google login
router.get("/auth/google",passport.authenticate("google", { scope: ["profile", "email"] }));

// ✅ Google callback
router.get("/auth/google/callback",userController.googleSignInCallback);

router.get('/signup', userExist, userController.signup);
router.post('/signup', userSignupValidation, validate, userController.postUserSignup);

router.get('/emailVerification', userExist, userController.getemailVerification);
router.post('/emailVerification', userController.otpAuth, userController.postEmailVerification);

router.get('/resendOtp', userExist, userController.resendOtp);

router.get('/forgotpassword', userExist, userController.forgotpassword);
router.post('/forgotpassword', userController.postforgotpassword);

router.get('/otpVerification', userExist, userController.getOtpVerification);
router.post('/otpVerification', userController.passwordOtpAuth, userController.postOtpVerification);

router.get('/passwordResendOtp', userExist, userController.PasswordResendOtp);

router.get('/createNewPassword', userExist, userController.getCreateNewPassword);
router.post('/createNewPassword', userExist, passwordValidation, confirmPasswordValidation, passvalidate, userController.postCreateNewPassword);

router.get('/logout', userController.getUserLogout);

// ----------------- Home / Shop / Categories -----------------
router.get('/homepage', requireSession, calculateCartCount, userController.home);
router.get('/shop', calculateCartCount, userController.shop);
router.get('/category/:_id', calculateCartCount, categoryController.getCategorybyId);

// ----------------- Search -----------------
router.get('/search', requireSession, calculateCartCount, userController.searchByNames);

// ----------------- Wallet -----------------
router.get('/Wallet', requireSession, calculateCartCount, walletController.getWallet);

// ----------------- Filter -----------------
router.get('/filter', requireSession, calculateCartCount, productController.filterProducts);

// ----------------- Product -----------------
router.get('/productViewDetailspage/:id', calculateCartCount, userController.getproductViewDetailspage);

// ----------------- Wishlist -----------------
router.get('/wishlist', requireSession, calculateCartCount, wishlisitController.getWishList);

// API route (AJAX) → use JWT
router.get('/addToWishlist/:_id', userTokenAuth, wishlisitController.addToWishList);
router.get('/removefromWishlist/:_id', userTokenAuth, wishlisitController.removeItemFromWishlist);

// ----------------- Coupons -----------------
router.post("/checkCoupon", userTokenAuth, couponController.checkCoupon);


// ----------------- About / Contact -----------------
router.get("/aboutus", userController.GetAboutpage);
router.get("/contactUs", userController.GetConatctpage);

// ----------------- Cart -----------------
router.get('/cartpage', requireSession, calculateCartCount, userController.getCartpage);
router.post('/cartpage', requireSession, userController.postCart);

// API routes
router.post('/add-to-cart/:productId', userTokenAuth, userController.addtocart);
router.get('/getcartquantity', userTokenAuth, cartController.getQuantity);
router.post('/updateQuantity', userTokenAuth, userController.updateQuantity);
router.get('/removefromcart/:productId', userTokenAuth, userController.removeItemFromCart);
router.get('/checkStock', userTokenAuth, cartController.checkStock);
router.post("/removeCoupon", userController.removeCoupon);

// ----------------- Checkout -----------------
router.get('/checkout', requireSession, calculateCartCount, userController.getCheckout);
router.post('/checkout', requireSession, calculateCartCount, userController.postCheckout);
router.post('/verify-payment', userTokenAuth, userController.verifyPayment);
router.post('/addAddressCheckout', requireSession, calculateCartCount, userController.addAddressCheckout);
router.get('/orderSuccess', requireSession, calculateCartCount, userController.getOrderSucces);


// ----------------- User Profile -----------------
router.get('/profile', requireSession, calculateCartCount, userController.profile);
router.post('/changepassword', requireSession,currentPasswordValidation,passwordValidation, confirmPasswordValidation, passvalidate, userController.changePassword);

router.post('/addAddress', requireSession, calculateCartCount, userController.postAddressForm);
router.get('/editAddress', requireSession, calculateCartCount, userController.getEditAddress);
router.post('/editAddress/:_id', requireSession, calculateCartCount, userController.postEditAddress);
router.get('/deleteAddress/:_id', requireSession, userController.deleteAddress);

// ----------------- Orders -----------------
router.get('/orderlist', requireSession, calculateCartCount, userController.getOrderlist);
router.get('/order/details/:_id', requireSession, calculateCartCount, userController.getOrderDetails);
router.post('/order/cancelorder/:_id', requireSession, userController.cancelOrder);
router.post('/order/return/:_id', requireSession, userController.returnOrder);
router.post('/order/cancelRequest/:_id', requireSession, userController.CancelreturnOrder);

// ----------------- Invoices -----------------
router.post('/download-invoice', requireSession, userController.downloadInvoice);
router.get('/download-invoice/:_id', requireSession, userController.downloadfile);

module.exports = router;
