const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');
require('dotenv').config()


function userTokenAuth(req, res, next) {
    const token = req.cookies.userJwt || req.headers.authorization?.split(" ")[1];

    if (!token) {
        req.flash("error", "Please log in first");
        return res.redirect("/login");
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded; 

        next();
    } catch (err) {
        res.clearCookie("userJwt");
        console.error("JWT error:", err.message);
        req.flash("error", "Session expired. Please log in again.");
        return res.redirect("/login"); 
    }
}

function userExist(req, res, next) {
    const token = req.cookies.userJwt;
    if (!token) return next();

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (decoded) {
            return res.redirect("/homepage");
        }
    } catch (err) {
        // invalid token → let them proceed to login/signup
        return next();
    }
}


module.exports = { userTokenAuth,userExist };

