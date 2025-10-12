const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userSchema");
const { generateReferralCode } = require("../utility/generateReferralCode");

module.exports = function (passport) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // 1. Check if user already exists with googleId
                    let user = await User.findOne({ googleId: profile.id });

                    if (!user) {
                        const email = profile.emails[0].value;

                        // 2. If user exists by email → link Google account
                        user = await User.findOne({ Email: email });
                        if (user) {
                            user.googleId = profile.id;
                            await user.save();
                        } else {
                            // 3. New Google user → create with referral code
                            user = await User.create({
                                Username: profile.displayName,
                                Email: email,
                                googleId: profile.id,
                                Status: "Active",
                                ReferralCode: generateReferralCode(), 
                            });
                        }
                    }

                    return done(null, user);
                } catch (err) {
                    console.error("Google strategy error:", err);
                    return done(err, null);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};
