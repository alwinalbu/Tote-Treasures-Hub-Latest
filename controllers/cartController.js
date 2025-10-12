const Product = require("../models/productSchema");
const Cart = require("../models/cartSchema");
const User=require('../models/userSchema')
const flash = require('express-flash');

module.exports = {
  

  checkStock: async (req, res) => {
    try {
      const userId = req.session.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized. Please login." });

      const userCart = await Cart.findOne({ UserId: userId });
      if (!userCart) return res.json({ success: false, error: "Cart is empty" });

      const existingCart = await Promise.all(
        userCart.Items.map(async (cartItem) => {
          const product = await Product.findById(cartItem.ProductId);
          if (!product) return null;

          if (product.Display === "Inactive") {
            return { productId: cartItem.ProductId, blocked: true };
          }
          return {
            productId: cartItem.ProductId,
            availableQuantity: product.AvailableQuantity,
            requestedQuantity: cartItem.Quantity,
            blocked: false,
          };
        })
      );

      const blockedItems = existingCart.filter((i) => i?.blocked);
      if (blockedItems.length > 0) {
        return res.json({ error: "Some items are blocked by admin", blockedItems });
      }

      const insufficient = existingCart.filter(
        (i) => i && i.availableQuantity < i.requestedQuantity
      );
      if (insufficient.length > 0) {
        return res.json({ error: "Insufficient stock for some items", itemsWithInsufficientStock: insufficient });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error while checking stock:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  getQuantity: async (req, res) => {
    try {
      const userId = req.session.user?.id;
      if (!userId) return res.json({ success: true, quantity: 0 });

      const cart = await Cart.findOne({ UserId: userId });
      if (!cart) return res.json({ success: true, quantity: 0 });

      const totalQuantity = cart.Items.reduce((total, item) => total + item.Quantity, 0);
      res.json({ success: true, quantity: totalQuantity });
    } catch (error) {
      console.error("Error fetching cart quantity:", error);
      res.status(500).json({ success: false, error: "Failed to fetch cart quantity" });
    }
  },


};

  


