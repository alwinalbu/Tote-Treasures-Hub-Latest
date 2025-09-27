const mongoose = require('mongoose');
const { Schema, ObjectId  } = mongoose;

// Define the User schema
const UserSchema = new Schema({
    Username: {
        type: String,
        required: false
    },
    Email: {
        type: String,
        required: true,
        unique:true
    },
    Password: { type: String, required: function () { return !this.googleId; } }
,
    Status: {
        type: String,
        default: 'Active'
    },
    ReferralCode: {
        type: String,
        unique: true
      },
      ReferrerID: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      Referrals: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      
    Address: [{
        Name: {
            type: String
        },
        AddressLane: {
            type: String
        },
        City: {
            type: String
        },
        Pincode: {
            type: Number
        },
        State: {
            type: String
        },
        Mobile: {
            type: Number
        }
    }],
    googleId: {
        type: String,
        unique:true,
        sparse:true
    },
    Wishlist:[{
        productId:{type:Schema.Types.ObjectId,ref:'Products'}
    }]
});

// Create a User model based on the UserSchema
const User = mongoose.model('User', UserSchema);

// Export the User model for use in other parts of your application
module.exports = User;
