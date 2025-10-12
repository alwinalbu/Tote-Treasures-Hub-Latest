const cron = require('node-cron')

const Coupon = require('../models/couponSchema');

cron.schedule('0 0 * * *',async()=>{
    const today = new Date();
    await Coupon.updateMany(
        {expiration_date:{$lt:today},
         Status:{$ne:'Expired'}
        },
        {$set:{Status:'Expired'}}
    );
    console.log("Expired coupons updated automatically");
});