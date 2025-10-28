document.addEventListener("DOMContentLoaded", () => {
  let appliedCoupon = null; // store applied coupon globally

  if (window.serverAppliedCoupon) {
    appliedCoupon = {
      discount: Number(window.serverAppliedCoupon.discount_amount || 0),
      minAmount: Number(window.serverAppliedCoupon.minimum_purchase || 0),
      code: window.serverAppliedCoupon.code,
    };
    console.log("✅ Restored coupon from server:", appliedCoupon);
  }

  // ----------------------------------------
  // 🔹 Pre-fill totals from server
  // ----------------------------------------
  if (window.serverCartTotals) {
    const sub = document.getElementById("sub-total");
    const disc = document.getElementById("discountCell");
    const total = document.getElementById("totalAmountCell");

    const preDiscount = Number(window.serverCartTotals.subTotal || 0);
    const discount = Number(window.serverCartTotals.discount || 0);
    const finalTotal = Math.max(preDiscount - discount, 0);

    if (sub) sub.textContent = preDiscount.toFixed(2);
    if (disc)
      disc.textContent =
        discount > 0 ? `- ₹${discount.toFixed(2)}` : "0.00";
    if (total) total.value = finalTotal.toFixed(2);
  }


  const increaseButtons = document.querySelectorAll(".increase-quantity");
  const decreaseButtons = document.querySelectorAll(".decrease-quantity");
  const removeButtons = document.querySelectorAll(".remove-button");
  const makePurchase = document.querySelector("#makePurchase");

  // ---------------- STOCK CHECK BEFORE CHECKOUT ----------------
  makePurchase.addEventListener("click", (event) => {
    event.preventDefault();
    checkStock();
  });

  async function checkStock() {
    try {
      const response = await fetch("/checkStock", { method: "GET" });
      const data = await response.json();

      if (response.ok && data.success) {
        $.ajax({
          url: "/cartpage",
          type: "POST",
          data: $("#cartSubmit").serialize(),
          success: function () {
            window.location.href = "/checkout";
          },
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Stock Issue",
          text: data.error || "Some items are not available",
        });

        if (data.itemsWithInsufficientStock) {
          data.itemsWithInsufficientStock.forEach((item) => {
            const outOfStockMessage = document.getElementById(
              `outOfStockMessage_${item.productId}`
            );
            if (outOfStockMessage) {
              outOfStockMessage.style.display = "block";
              outOfStockMessage.textContent = `Only ${item.availableQuantity} left in stock`;
            }
          });
        }
      }
    } catch (error) {
      console.error("Error checking stock:", error);
    }
  }

  // ---------------- APPLY COUPON ----------------
  document.querySelector(".applyCoupon").addEventListener("click", async () => {
    const couponDropdown = document.getElementById("couponDropdown");
    const selectedCouponCode = couponDropdown.value;
    if (!selectedCouponCode) return;

    const subTotal = parseFloat(
      document.getElementById("sub-total").textContent || "0"
    );

    try {
      const response = await fetch("/checkCoupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: selectedCouponCode, total: subTotal }),
      });

      const data = await response.json();
      if (data.success) {
        appliedCoupon = {
          discount: data.discount,
          minAmount: data.minAmount,
          code: data.code,
        };
        Swal.fire("", "Coupon Applied", "success");
        updateTotalAmount();
      } else {
        appliedCoupon = null;
        Swal.fire("Coupon Error", data.error, "error");
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
    }
  });

  // ---------------- TOTAL AMOUNT ----------------
  function updateTotalAmount() {
    let totalAmount = 0;

    const productRows = document.querySelectorAll(".row.gy-3.mb-4");
    productRows.forEach((row) => {
      const productId = row
        .querySelector(".decrease-quantity")
        .getAttribute("data-product-id");

      const productAmountEl = document.querySelector(
        `#productAmount_${productId}`
      );
      const productAmount = parseFloat(productAmountEl.textContent.trim() || "0");
      totalAmount += productAmount;
    });

    let discountApplied = 0;

    if (appliedCoupon) {
      if (totalAmount < appliedCoupon.minAmount) {
        Swal.fire({
          icon: "error",
          title: "Coupon Removed",
          text: `Minimum purchase for this coupon is ₹${appliedCoupon.minAmount}.`,
        });
        appliedCoupon = null;
        // 🔑 Tell backend to remove coupon
        fetch("/removeCoupon", { method: "POST" });
      } else {
        discountApplied = parseFloat(appliedCoupon.discount || 0);
        totalAmount -= discountApplied;
      }
    }

    document.getElementById("sub-total").textContent = (
      totalAmount + discountApplied
    ).toFixed(2);
    document.getElementById("totalAmountCell").value = totalAmount.toFixed(2);

    document.getElementById("discountCell").textContent =
      discountApplied > 0 ? `- ₹${discountApplied.toFixed(2)}` : "0.00";
  }

  // ---------------- QUANTITY UPDATE ----------------
  async function updateQuantity(productId, change, availableQty) {
    const quantityInput = document.getElementById(`count_${productId}`);
    let currentQty = parseInt(quantityInput.value, 10);

    // prevent less than 1
    if (currentQty + change < 1) {
      Swal.fire("Error", "Quantity cannot be less than 1. Remove item instead.", "warning");
      return;
    }

    // prevent more than stock
    if (currentQty + change > availableQty) {
      Swal.fire("Error", `Only ${availableQty} items available in stock.`, "warning");
      return;
    }

    try {
      const response = await fetch("/updateQuantity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, change }),
      });

      const data = await response.json();

      if (!data.success) {
        Swal.fire("Error", data.error, "error");
        return;
      }

      const productAmount = document.getElementById(
        `productAmount_${productId}`
      );
      const baseValue = parseFloat(productAmount.getAttribute("data-value"));

      quantityInput.value = data.newQuantity;
      quantityInput.setAttribute("value", data.newQuantity);
      productAmount.textContent = (baseValue * data.newQuantity).toFixed(2);

      updateTotalAmount();
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  }

  // ---------------- HOOK UP BUTTONS ----------------
  increaseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.getAttribute("data-product-id");
      const availableQty = parseInt(
        document.getElementById(`count_${productId}`).getAttribute("data-available-quantity"),
        10
      );
      updateQuantity(productId, 1, availableQty);
    });
  });

  decreaseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.getAttribute("data-product-id");
      const availableQty = parseInt(
        document.getElementById(`count_${productId}`).getAttribute("data-available-quantity"),
        10
      );
      updateQuantity(productId, -1, availableQty);
    });
  });

  // ---------------- REMOVE ITEM ----------------
  removeButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      Swal.fire({
        title: "Remove Product",
        text: "Are you sure you want to remove this product from your cart?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, remove it",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = button.href;
        }
      });
    });
  });

  // initial calculation
  updateTotalAmount();
});


// document.addEventListener("DOMContentLoaded", () => {
//   console.log("🛒 Cart page loaded");

//   // ----------------------------------------
//   // 🔹 Restore coupon from server (survives reloads)
//   // ----------------------------------------
//   let appliedCoupon = null;

//   if (window.serverAppliedCoupon) {
//     appliedCoupon = {
//       discount: Number(window.serverAppliedCoupon.discount_amount || 0),
//       minAmount: Number(window.serverAppliedCoupon.minimum_purchase || 0),
//       code: window.serverAppliedCoupon.code,
//     };
//     console.log("✅ Restored coupon from server:", appliedCoupon);
//   }

//   // ----------------------------------------
//   // 🔹 Pre-fill totals from server
//   // ----------------------------------------
//   if (window.serverCartTotals) {
//     const sub = document.getElementById("sub-total");
//     const disc = document.getElementById("discountCell");
//     const total = document.getElementById("totalAmountCell");

//     const preDiscount = Number(window.serverCartTotals.subTotal || 0);
//     const discount = Number(window.serverCartTotals.discount || 0);
//     const finalTotal = Math.max(preDiscount - discount, 0);

//     if (sub) sub.textContent = preDiscount.toFixed(2);
//     if (disc)
//       disc.textContent =
//         discount > 0 ? `- ₹${discount.toFixed(2)}` : "0.00";
//     if (total) total.value = finalTotal.toFixed(2);
//   }

//   // ----------------------------------------
//   // 🔹 DOM references
//   // ----------------------------------------
//   const increaseButtons = document.querySelectorAll(".increase-quantity");
//   const decreaseButtons = document.querySelectorAll(".decrease-quantity");
//   const removeButtons = document.querySelectorAll(".remove-button");
//   const applyButton = document.querySelector(".applyCoupon");
//   const makePurchase = document.querySelector("#makePurchase");

//   // ----------------------------------------
//   // 🧮 Update total amount function
//   // ----------------------------------------
//   function updateTotalAmount() {
//     let totalAmount = 0;

//     const productRows = document.querySelectorAll(".row.align-items-center");
//     productRows.forEach((row) => {
//       const productAmountEl = row.querySelector("[id^='productAmount_']");
//       if (productAmountEl) {
//         const val = parseFloat(productAmountEl.textContent.trim() || "0");
//         totalAmount += val;
//       }
//     });

//     let discountApplied = 0;

//     // ✅ Handle coupon logic
//     if (appliedCoupon) {
//       if (totalAmount < appliedCoupon.minAmount) {
//         Swal.fire({
//           icon: "warning",
//           title: "Coupon Removed",
//           text: `Minimum purchase for coupon ₹${appliedCoupon.minAmount} not met.`,
//         });
//         removeCouponFromBackend(); // 🔥 remove from DB
//         appliedCoupon = null; // remove from memory
//       } else {
//         discountApplied = appliedCoupon.discount;
//         totalAmount -= discountApplied;
//       }
//     }

//     // ✅ Update UI
//     const subEl = document.getElementById("sub-total");
//     const discEl = document.getElementById("discountCell");
//     const totalEl = document.getElementById("totalAmountCell");

//     if (subEl) subEl.textContent = (totalAmount + discountApplied).toFixed(2);
//     if (discEl)
//       discEl.textContent =
//         discountApplied > 0
//           ? `- ₹${discountApplied.toFixed(2)}`
//           : "0.00";
//     if (totalEl) totalEl.value = totalAmount.toFixed(2);
//   }

//   // ----------------------------------------
//   // 🔹 Apply Coupon Button Click
//   // ----------------------------------------
//   applyButton?.addEventListener("click", async () => {
//     const couponDropdown = document.getElementById("couponDropdown");
//     const selectedCouponCode = couponDropdown.value;
//     if (!selectedCouponCode) return;

//     const subTotal = parseFloat(
//       document.getElementById("sub-total").textContent || "0"
//     );

//     try {
//       const response = await fetch("/checkCoupon", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ code: selectedCouponCode, total: subTotal }),
//       });

//       const data = await response.json();

//       if (data.success) {
//         appliedCoupon = {
//           discount: data.discount,
//           minAmount: data.minAmount,
//           code: data.code,
//         };
//         Swal.fire("Success", "Coupon applied!", "success");
//       } else {
//         appliedCoupon = null;
//         Swal.fire("Error", data.error || "Invalid coupon", "error");
//       }

//       updateTotalAmount();
//     } catch (error) {
//       console.error("Error applying coupon:", error);
//     }
//   });

//   // ----------------------------------------
//   // 🔹 Remove Coupon (backend + UI)
//   // ----------------------------------------
//   async function removeCouponFromBackend() {
//     try {
//       const res = await fetch("/removeCoupon", { method: "POST" });
//       const data = await res.json();
//       if (data.success) {
//         console.log("✅ Coupon removed from backend");
//       }
//     } catch (err) {
//       console.error("Error removing coupon from backend:", err);
//     }

//     // reset UI display
//     document.getElementById("discountCell").textContent = "0.00";
//   }

//   // ----------------------------------------
//   // 🔹 Quantity Update Handler
//   // ----------------------------------------
//   async function updateQuantity(productId, change, availableQty) {
//     const quantityInput = document.getElementById(`count_${productId}`);
//     let currentQty = parseInt(quantityInput.value, 10);

//     if (currentQty + change < 1) {
//       Swal.fire("Error", "Quantity cannot be less than 1.", "warning");
//       return;
//     }

//     if (currentQty + change > availableQty) {
//       Swal.fire("Error", `Only ${availableQty} items available.`, "warning");
//       return;
//     }

//     try {
//       const res = await fetch("/updateQuantity", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ productId, change }),
//       });

//       const data = await res.json();

//       if (!data.success) {
//         Swal.fire("Error", data.error, "error");
//         return;
//       }

//       const baseValue = parseFloat(
//         document
//           .getElementById(`productAmount_${productId}`)
//           .getAttribute("data-value")
//       );

//       quantityInput.value = data.newQuantity;
//       document.getElementById(`productAmount_${productId}`).textContent = (
//         baseValue * data.newQuantity
//       ).toFixed(2);

//       updateTotalAmount();
//     } catch (error) {
//       console.error("Error updating quantity:", error);
//     }
//   }

//   // ----------------------------------------
//   // 🔹 Hook up quantity buttons
//   // ----------------------------------------
//   increaseButtons.forEach((btn) => {
//     btn.addEventListener("click", () => {
//       const productId = btn.getAttribute("data-product-id");
//       const availableQty = parseInt(
//         document
//           .getElementById(`count_${productId}`)
//           .getAttribute("data-available-quantity"),
//         10
//       );
//       updateQuantity(productId, 1, availableQty);
//     });
//   });

//   decreaseButtons.forEach((btn) => {
//     btn.addEventListener("click", () => {
//       const productId = btn.getAttribute("data-product-id");
//       const availableQty = parseInt(
//         document
//           .getElementById(`count_${productId}`)
//           .getAttribute("data-available-quantity"),
//         10
//       );
//       updateQuantity(productId, -1, availableQty);
//     });
//   });

//   // ----------------------------------------
//   // 🔹 Remove Button Confirmation
//   // ----------------------------------------
//   removeButtons.forEach((btn) => {
//     btn.addEventListener("click", (e) => {
//       e.preventDefault();
//       Swal.fire({
//         title: "Remove Product",
//         text: "Remove this product from your cart?",
//         icon: "warning",
//         showCancelButton: true,
//         confirmButtonText: "Yes, remove it",
//       }).then((res) => {
//         if (res.isConfirmed) {
//           window.location.href = btn.href;
//         }
//       });
//     });
//   });

//   // ----------------------------------------
//   // 🔹 Checkout Button → Stock Check
//   // ----------------------------------------
//   makePurchase?.addEventListener("click", async (e) => {
//     e.preventDefault();
//     try {
//       const res = await fetch("/checkStock", { method: "GET" });
//       const data = await res.json();

//       if (res.ok && data.success) {
//         $.ajax({
//           url: "/cartpage",
//           type: "POST",
//           data: $("#cartSubmit").serialize(),
//           success: function () {
//             window.location.href = "/checkout";
//           },
//         });
//       } else {
//         Swal.fire({
//           icon: "error",
//           title: "Stock Issue",
//           text: data.error || "Some items are unavailable",
//         });
//       }
//     } catch (err) {
//       console.error("Error during stock check:", err);
//     }
//   });

//   // ----------------------------------------
//   // 🔹 Initial total update on load
//   // ----------------------------------------
//   updateTotalAmount();
// });
