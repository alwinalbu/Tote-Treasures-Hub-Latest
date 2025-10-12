const User = require("../models/userSchema");
const Coupon = require("../models/couponSchema");
const flash = require("express-flash");
const Cart = require('../models/cartSchema')


module.exports = {

  // -----------------------------------------------Get Coupon------------------------------------------------------
  getCoupon: async (req, res) => {
    try {
      const today = new Date();

      let coupons = await Coupon.find().populate({
        path: 'usedBy.userId',
        model: 'User',
      });

      // Update expired coupons in DB
      for (let coupon of coupons) {
        if (coupon.expiration_date < today && coupon.Status !== "Expired") {
          coupon.Status = "Expired";
          await coupon.save();
        }
      }

      res.render('admin/couponpage', { coupons });
    } catch (error) {
      console.error('Error fetching coupons:', error);
      res.status(500).render('error_template', { error: 'Internal Server Error' });
    }
  },
  

  // -------------------------------------Coupon Added-------------------------------------------------------------

  AddCoupon: async (req, res) => {

    try {

      const existingCoupon = await Coupon.findOne({ code: req.body.code });

      if (existingCoupon) {
        return res.json({ error: 'Coupon code already exists' });
      }

      const newCoupon = await Coupon.create(req.body);

      console.log('Coupon added successfully', newCoupon);

      res.json({ success: true, coupon: newCoupon });

    } catch (error) {

      console.error('Error adding coupon:', error);

      if (error.name === 'ValidationError') {

        res.status(400).json({ error: 'Invalid coupon data' });
      } else {

        res.status(500).json({ error: 'Internal server error' });
      }
    }
  },

  // ---------------------------------------------Coupen Edit----------------------------------------------------

  // UpdateCoupon: async (req, res) => {
  //   const { couponId } = req.body;

  //   try {

  //     if (!mongoose.Types.ObjectId.isValid(couponId)) {
  //       return res.status(400).json({ success: false, error: 'Invalid couponId' });
  //     }

  //     const updatedCoupon = await Coupon.findByIdAndUpdate(
  //       couponId,
  //       { $set: req.body },
  //       { new: true }
  //     );

  //     if (!updatedCoupon) {
  //       return res.status(404).json({ success: false, error: 'Coupon not found' });
  //     }

  //     res.status(200).json({ success: true, updatedCoupon });
  //   } catch (error) {
  //     console.error('Error updating coupon:', error);
  //     res.status(500).json({ success: false, error: 'Internal server error' });
  //   }
  // },

  // --------------------------------------Delete Coupen----------------------------------------------------------

  // DeleteCoupon: async (req, res) => {
  //   try {
  //     const couponId = req.params.couponId;

  //     console.log('coupen for delte is :',couponId);

  //     const deletedCoupen = await Coupon.findByIdAndDelete(couponId)

  //     if (!deletedCoupen) {
  //       return res.status(404).json({ success: false, error: 'Coupon not found' });
  //     }

  //     res.json({ success: true, message: 'Coupon deleted successfully' });

  //   } catch (error) {
  //     console.error('Error In Deleting coupon:', error);
  //     res.status(500).json({ success: false, error: 'Internal server error' });
  //   }

  // },


  // -------------------------------------------Coupen Check in User Side------------------------------------------
  checkCoupon: async (req, res) => {
    try {
      console.log("inside checkCoupon");

      const userId = req.session.user.id; 
      const { code, total } = req.body;
      const today = new Date();

      // 1. Find valid coupon
      const couponMatch = await Coupon.findOne({
        code,
        Status: "Active",
        startDate: { $lte: today },
        expiration_date: { $gte: today }
      });

      if (!couponMatch) {
        return res.json({ error: "Coupon is invalid or expired." });
      }

      // 2. Check if user already used this coupon
      const userCoupon = couponMatch.usedBy.find(
        (used) => used.userId.toString() === userId
      );

      if (userCoupon && userCoupon.status === "used") {
        return res.json({ error: "You have already used this coupon." });
      }

      if (userCoupon && userCoupon.status === "pending") {
        if (total >= couponMatch.minimum_purchase) {
          return res.json({
            success: true,
            discount: couponMatch.discount_amount,
            minAmount: couponMatch.minimum_purchase,
            code: couponMatch.code
          });
        } else {
          return res.json({
            error: `Cart should contain a minimum amount of ₹${couponMatch.minimum_purchase}`
          });
        }
      }

      // 3. Check minimum purchase
      if (total < couponMatch.minimum_purchase) {
        return res.json({
          error: `Cart should contain a minimum amount of ₹${couponMatch.minimum_purchase}`
        });
      }

      // 4. Valid coupon → apply temporarily
      const discount = couponMatch.discount_amount;

      // Store coupon in session for checkout reference
      req.session.temporaryCouponInfo = {
        userId,
        couponCode: couponMatch._id,
        discount
      };

      // Save coupon reference in cart + mark "pending"
      await Cart.findOneAndUpdate(
        { UserId: userId },
        { $set: { coupon: couponMatch._id } }
      );

      // Insert new or update existing record
      await Coupon.updateOne(
        { _id: couponMatch._id, "usedBy.userId": userId },
        { $set: { "usedBy.$.status": "pending" } }
      );

      await Coupon.updateOne(
        { _id: couponMatch._id, "usedBy.userId": { $ne: userId } },
        { $push: { usedBy: { userId, status: "pending" } } }
      );

      return res.json({
        success: true,
        discount,
        minAmount: couponMatch.minimum_purchase,
        code: couponMatch.code
      });

    } catch (error) {
      console.error("Error in checkCoupon:", error);
      res.json({ error: "Some error occurred while applying coupon" });
    }
  }

}
