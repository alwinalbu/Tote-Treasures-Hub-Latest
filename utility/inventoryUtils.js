const Products = require("../models/productSchema");


// Efficient restocking using bulkWrite
async function restockProducts(items) {
    if (!items || items.length === 0) return;

    const bulkOps = items.map(item => ({
        updateOne: {
            filter: { _id: item.ProductId },
            update: { $inc: { AvailableQuantity: item.Quantity } }
        }
    }));

    await Products.bulkWrite(bulkOps);
}

module.exports = { restockProducts };
