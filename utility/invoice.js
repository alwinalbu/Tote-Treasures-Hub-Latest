// utils/invoiceGenerator.js

const easyinvoice = require("easyinvoice");
const fs = require("fs");
const path = require("path");
const util = require("util");
const writeFileAsync = util.promisify(fs.writeFile);

function safeNumber(n, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

// ✅ Pricing rules: Offer > Discount > Price
function pickBasePrice(product) {
  const offerPrice = safeNumber(product?.ProductId?.offerPrice, NaN);
  const discountPrice = safeNumber(product?.ProductId?.DiscountAmount, NaN);
  const price = safeNumber(product?.ProductId?.Price, NaN);
  const isOffer = product?.ProductId?.IsInOffer;

  if (isOffer && Number.isFinite(offerPrice)) {
    return offerPrice;        // Rule 1: offer price if available
  }
  if (Number.isFinite(discountPrice)) {
    return discountPrice;     // Rule 2: discount price
  }
  if (Number.isFinite(price)) {
    return price;             // Rule 3: original price
  }
  return 0;
}

module.exports = {
  order: async (order, status, paymentMethod, couponCode, discountAmount) => {
    const discount = safeNumber(discountAmount, 0);
    const paidTotal = safeNumber(order.TotalPrice, 0);

    // Build product lines
    const productLines = (order.Items || []).map((item) => ({
      quantity: safeNumber(item.Quantity, 1),
      description: item?.ProductId?.ProductName || "Item",
      "tax-rate": 0,
      price: pickBasePrice(item),
    }));

    // Add coupon line if discount > 0
    const lines = [...productLines];
    if (discount > 0) {
      lines.push({
        quantity: 1,
        description: `Coupon ${couponCode ? `(${couponCode})` : ""}`.trim(),
        "tax-rate": 0,
        price: -discount,
      });
    }

    // ✅ No adjustment line, we trust DB total (paidTotal)

    // Prepare invoice data
    const data = {
      images: (() => {
        try {
          const logoB64 = fs.readFileSync(
            path.join(__dirname, "..", "public", "images", "logo.png"),
            "base64"
          );
          return { logo: logoB64 };
        } catch {
          return {};
        }
      })(),
      sender: {
        company: "ToteTreasures Hub",
        address: "HiLITE Business Park",
        zip: "673014",
        city: "Calicut",
        country: "Kerala",
        website: "totetreasureshub.shop",
      },
      client: {
        company: order?.Address?.Name || "",
        address: order?.Address?.Address || "",
        zip: order?.Address?.Pincode || "",
        city: order?.Address?.City || "",
        state: order?.Address?.State || "",
        mobNo: order?.Address?.Mobile || "",
      },
      information: {
        number: String(order._id),
        date: new Date(order.OrderDate || Date.now()).toLocaleDateString("en-IN"),
        status: status || "",
        paymentType: paymentMethod || "",
        coupon: couponCode || (discount > 0 ? "Applied" : "No Coupon"),
      },
      products: lines,
      "bottom-notice": "Thank You For Your Purchase",
      settings: {
        currency: "INR",
        "tax-notation": "GST",
        "margin-top": 50,
        "margin-right": 50,
        "margin-left": 50,
        "margin-bottom": 25,
      },
    };

    try {
      const result = await easyinvoice.createInvoice(data);
      const filePath = path.join(__dirname, "..", "public", "pdf", `${order._id}.pdf`);
      await writeFileAsync(filePath, result.pdf, "base64");
      return filePath;
    } catch (error) {
      console.error("easyinvoice error:", error);
      throw error;
    }
  },
};


