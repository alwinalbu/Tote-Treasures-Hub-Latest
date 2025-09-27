const jwt = require("jsonwebtoken");

function syncAuth(req, res, next) {
    const hasSession = !!req.session.user;
    const token = req.cookies.userJwt;

    // Case 1: Session exists, but no JWT → issue new JWT
    if (hasSession && !token) {
        const newToken = jwt.sign(
            { id: req.session.user.id, email: req.session.user.email },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "1h" }
        );

        res.cookie("userJwt", newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 1000 // 1 hour
        });
    }

    // Case 2: JWT exists, but session missing → clear JWT
    if (!hasSession && token) {
        res.clearCookie("userJwt");
        return res.redirect("/login");
    }

    // Case 3: JWT exists but expired/invalid → clear both
    if (token) {
        try {
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        } catch (err) {
            res.clearCookie("userJwt");
            req.session.destroy(() => {
                return res.redirect("/login");
            });
            return;
        }
    }

    next();
}

module.exports = syncAuth;
