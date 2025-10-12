
// const Razorpay = require('razorpay')


// require('dotenv').config()


// module.exports = {
//     createRazorpayOrder: (order) => {
//         return new Promise((resolve, reject) => {
            
//             const razorpay = new Razorpay({
//                 key_id: process.env.KEY_ID,
//                 key_secret: process.env.KEY_SECRET
//             });

           
//             console.log("INCOMING ORDER IS :", order);

         
//             const razorpayOrder = razorpay.orders.create({
//                 amount: order.amount * 100, 
//                 currency: 'INR',
//                 receipt: order.receipt, 
//             });

//             // Resolve the Promise with the created Razorpay order
//             resolve(razorpayOrder);
//         });
//     }
// };

const Razorpay = require('razorpay');
require('dotenv').config();

module.exports = {
    createRazorpayOrder: async (order) => {
        const razorpay = new Razorpay({
            key_id: process.env.KEY_ID,
            key_secret: process.env.KEY_SECRET
        });

        console.log("key:", process.env.KEY_ID);
        console.log("key-secret:", process.env.KEY_SECRET);

        console.log("INCOMING ORDER IS:", order);

        try {
            const razorpayOrder = await razorpay.orders.create({
                amount: order.amount * 100,
                currency: 'INR',
                receipt: order.receipt,
            });

            console.log(razorpayOrder,"rayser ordere here FINALLY");
            return razorpayOrder;
        } catch (err) {
            console.error('Error creating Razorpay order:', err);
            throw err;
        }
    }
};
