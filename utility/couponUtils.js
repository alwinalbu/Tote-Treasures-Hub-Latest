const Coupon = require("../models/couponSchema");


async function resetCouponIfValid(order) {
    try {
        if (!order.Coupon) return;

        const coupon = await Coupon.findById(order.Coupon);
        if (!coupon) return;

        const now = new Date();

        // Only reset if coupon is still valid
        if (coupon.expiration_date >= now && coupon.Status === "Active") {
            await Coupon.updateOne(
                { _id: order.Coupon, "usedBy.userId": order.UserId._id },
                { $set: { "usedBy.$.status": "removed" } }
            );
            console.log("Coupon reset for user:", order.UserId._id);
        } else {
            console.log("Coupon NOT reset (expired or inactive).");
        }
    } catch (err) {
        console.error("Error resetting coupon:", err);
    }
}

module.exports = { resetCouponIfValid };
