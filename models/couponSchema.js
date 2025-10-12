const mongoose = require('mongoose');
const { Schema } = mongoose;

const couponSchema = new Schema({
  couponName: {
    type: String,
    required: true
  },
  code: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  discount_amount: {
    type: Number,
    required: true,
    min: 1
  },
  minimum_purchase: {
    type: Number,
    required: true,
    min: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  expiration_date: {
    type: Date,
    required: true
  },
  Status: {
    type: String,
    enum: ["Active", "Inactive", "Expired"],
    default: "Active"
  },
  usedBy: [
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      status: {
        type: String,
        enum: ["used", "pending"], // "pending" = applied but not checked out yet
        default: "used"
      },
      usedAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, { timestamps: true });

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
