// module.exports = function requireSession(req, res, next) {
//     if (!req.session.user) {
//         req.flash("error", "Please log in first");
//         return res.redirect("/login");
//     }
//     next();
// };


module.exports = function requireSession(req, res, next) {
    if (!req.session || !req.session.user) {
        req.flash("error", "Please log in first.");
        return res.redirect("/login");
    }
    next();
};
