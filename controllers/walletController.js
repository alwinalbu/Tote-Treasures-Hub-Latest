const User = require('../models/userSchema');
const Wallet = require('../models/walletSchema');

module.exports = {
  getWallet: async (req, res) => {
    try {
      const userId = req.session.user?.id;

      const user = await User.findById(userId);

      let wallet = await Wallet.findOne({ UserID: userId });

      let userTransactions = [];
      
      res.render('user/walletpage', { Amount:wallet.Amount, userTransactions, user});

    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  },
};


