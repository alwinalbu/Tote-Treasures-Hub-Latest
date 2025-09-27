const Order=require('../models/orderSchema')
const Products=require('../models/productSchema')
const pdf=require('../utility/pdf')
const excel=require('../utility/execl')
const Wallet = require('../models/walletSchema')
const Coupon = require("../models/couponSchema");  
const resetCouponIfValid = require('../utility/couponUtils')

module.exports={

  getOrders: async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const perPage = 5;
        const skip = (page - 1) * perPage;
      const orders = await Order.find()
        .populate('UserId', 'Email')
        .sort({ OrderDate: -1 })   
        .skip(skip)
        .limit(perPage)
        .exec();
        const totalCount = await Order.countDocuments();

        res.render("admin/orderlist", {
            orders,
            currentPage: page,
            perPage,
            totalCount,
            totalPages: Math.ceil(totalCount / perPage),
        });
    } catch (err) {
        res.status(500).send('Error fetching orders');
    }
},


    getOrderDetails: async (req, res) => {
        try {

        console.log("admin order details inside ")

          const orderId = req.params._id;
          const orderDetails = await Order.findOne({ _id: orderId }).populate(
            "Items.ProductId"
          );
          res.render("admin/orderDetailspage", { order: orderDetails });
        } catch (error) {
          console.log(error);
        }
      },

      //--------------------------change the status of order by admin-------------------------------

  changeStatus: async (req, res) => {
    console.log("Updating order status...");

    const orderId = req.params.orderId;
    const { status } = req.body;

    try {
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { Status: status },
        { new: true }
      ).populate("UserId");

      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Normalize payment method for safety
      const method = updatedOrder.PaymentMethod.toLowerCase();
      const prepaidMethods = ["online", "upi", "card", "netbanking", "wallet"];

      // --- Handle payment status + refunds ---
      if (status.toLowerCase() === "delivered") {
        
        //  Only mark as paid after delivery
        
        updatedOrder.PaymentStatus = "Paid";

      } else if (status.toLowerCase() === "rejected") {
        updatedOrder.PaymentStatus = "Order Rejected";

        //  Restock product quantities
        for (const item of updatedOrder.Items) {
          const product = await Products.findById(item.ProductId);
          if (product) {
            product.AvailableQuantity += item.Quantity;
            await product.save();
            console.log("Quantity restored:", product.AvailableQuantity);
          }
        }

        //  Refund only if prepaid method
        if (prepaidMethods.includes(method)) {
          const Wallet = require("../models/walletSchema");
          await Wallet.findOneAndUpdate(
            { UserID: updatedOrder.UserId._id },
            { $inc: { Amount: updatedOrder.TotalPrice } },
            { new: true, upsert: true }
          );
          console.log(`Refunded ${updatedOrder.TotalPrice} to user wallet`);
        }

        //  Coupon reset for BOTH COD & Prepaid rejections
        if (updatedOrder.Coupon) {
          const coupon = await Coupon.findById(updatedOrder.Coupon);

          if (coupon) {
            const now = new Date();

            if (coupon.expiration_date >= now && coupon.Status === "Active") {
              await Coupon.updateOne(
                { _id: updatedOrder.Coupon, "usedBy.userId": updatedOrder.UserId._id },
                { $set: { "usedBy.$.status": "removed" } }
              );

              console.log("Coupon reset for user:", updatedOrder.UserId._id);
            } else {
              console.log("Coupon NOT reset (expired or inactive).");
            }
          }
        }

      } else {
        // Any other status → keep pending
        updatedOrder.PaymentStatus = "Pending";
      }

      await updatedOrder.save();
      res.json(updatedOrder);

    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },


// --------------------------------------------Cancel the Return Request----------------------------------------------------------------

cancelReturn: async (req,res)=>{

  try {

    const orderId=req.params.orderId;

    console.log("inside the cancel return id ",orderId)

    const updatedOrder=await Order.findByIdAndUpdate(
      { _id: orderId },
      { $set: { Status: "Return Canceled"} }, 
      { new: true }
    )
    res.json({ success: true, order: updatedOrder });

  } catch (error) {
    console.error('Error:',error);
    res.status(500).json({success:false,error:'Internal Server Error'})
    
  }
},
      


// -------------------------------------------------Accept The Return Request----------------------------------------------------------------

  acceptReturn: async (req, res) => {
    try {
      const orderId = req.params.orderId;

      console.log("REACHED inside acceptReturn, order id:", orderId);

      // 1. Update order status
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { $set: { Status: "Return Accepted" } },
        { new: true }
      ).populate("UserId");

      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found" });
      }

      const userId = updatedOrder.UserId._id;  // ✅ customer id
      const TotalPrice = updatedOrder.TotalPrice;

      console.log("Refunding to user:", userId, "Amount:", TotalPrice);

      // 2. Refund amount to wallet
      await Wallet.findOneAndUpdate(
        { UserID: userId },
        { $inc: { Amount: TotalPrice } },
        { new: true, upsert: true }
      );

      updatedOrder.PaymentStatus = "Refund To Wallet";

      // 3. Restock product quantities
      for (const item of updatedOrder.Items) {
        const product = await Products.findById(item.ProductId).exec();
        if (product) {
          product.AvailableQuantity += item.Quantity;
          await product.save();
          console.log("Quantity updated for", product.ProductName, ":", product.AvailableQuantity);
        }
      }

      console.log("Coupon used in this order is --->", updatedOrder.Coupon);

      // 4. Reset coupon if used AND still valid
      if (updatedOrder.Coupon) {
        const coupon = await Coupon.findById(updatedOrder.Coupon);

        if (coupon) {
          const now = new Date();

          // ✅ Check if coupon has not expired and is active
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

      await updatedOrder.save();

      // 5. Send response
      res.json({
        success: true,
        message: "Return accepted successfully. Amount refunded. Coupon reset only if still valid.",
        order: updatedOrder
      });

    } catch (error) {
      console.error("Error in acceptReturn:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },


// --------------------------------Download sales report------------------------------------------------------------------

getDownloadSalesReport: async (req, res) => {
  console.log("reached inside of download sales report");

  try {
    const startDate = new Date(req.body.startDate);
    const format = req.body.fileFormat;
    const endDate = new Date(req.body.endDate);

    const orders = await Order.find({
      Status: {
        $nin: ["Return Pending", "Cancelled", "Return Accepted"]
      },
      OrderDate: { $gte: startDate, $lte: endDate },
      PaymentStatus: { $in: ["Paid", "Pending"] }, // Corrected field name
    })
    .populate('Items.ProductId')
    .populate('UserId');

    const totalSales = await Order.aggregate([
      {
        $match: {
          PaymentStatus: { $in: ["Paid", "Pending"] }, // Corrected field name
          OrderDate: { $gte: startDate, $lte: endDate },
          Status: { $nin: ["Return Pending", "Cancelled", "Return Accepted"] },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$TotalPrice' },
        },
      },
    ]);

    console.log("total sales is ", totalSales);

    const sum = totalSales.length > 0 ? totalSales[0].totalSales : 0;

    if (format === 'pdf') {
      pdf.downloadPdf(req, res, orders, startDate, endDate, totalSales);
      
    } else if (format === 'excel') {
      excel.downloadExcel(req, res, orders, startDate, endDate, totalSales);
    } else {
      res.status(400).json({ error: 'Unsupported file format' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
},



}
