const User = require("../models/userSchema");

async function blockCheck(req, res, next) {
    try {
        const openRoutes = ["/login", "/signup", "/emailVerification", "/aboutus", "/contactUs"];
        if (openRoutes.includes(req.path) || req.path.startsWith("/admin")) return next();

        if (!req.session || !req.session.user) return next();

        const userId = req.session.user.id || req.session.user._id;
        if (!userId) return next();

        const user = await User.findById(userId).select("Status Email");
        if (!user) return next();

        if (user.Status === "Blocked") {
            console.log(`🚫 User ${user.Email} is blocked — ending session`);

            // ✅ Render the blocked page first (session still exists)
            res.status(403).render("user/userBlocked", {
                message: "Your account has been blocked by the admin.",
            });

            
            res.on("finish", () => {
                req.session.destroy((err) => {
                    if (err) console.error("Error destroying session:", err);
                    try {
                        res.clearCookie("connect.sid", { path: "/" });
                    } catch {
                        // Do nothing if headers already sent
                    }
                });
            });

            return;
        }

        next();
    } catch (err) {
        console.error("❌ Error in blockCheck:", err);
        next();
    }
}

module.exports = blockCheck;
