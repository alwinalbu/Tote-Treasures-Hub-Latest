

const Cart = require('../models/cartSchema');

const calculateCartCount = async (req, res, next) => {
  try {
    // ✅ Use "id" from session instead of "_id"
    const userId = req.session.user?.id;

    if (!userId) {
      res.locals.cartCount = 0;
      return next(); // no logged-in user → no cart
    }

    console.log("CartCount middleware - userId:", userId);

    const userCart = await Cart.findOne({ UserId: userId });

    if (userCart) {
      const cartCount = userCart.Items.reduce(
        (total, item) => total + item.Quantity,
        0
      );

      console.log("Cart count is:", cartCount);
      res.locals.cartCount = cartCount;
    } else {
      res.locals.cartCount = 0;
    }

    next();
  } catch (error) {
    console.error("Error in cartCountMiddleware:", error);
    res.locals.cartCount = 0;
    next();
  }
};

module.exports = calculateCartCount;


