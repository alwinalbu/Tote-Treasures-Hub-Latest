
// function updateCartQuantity() {

//     $.ajax({
//         url: '/getcartquantity',
//         method: 'GET',
//         success: function (response) {
//             const cartQuantityElement = document.getElementById('cart-quantity');
//             cartQuantityElement.textContent = response.quantity;
//         },
//         error: function (error) {
//             console.error('Error fetching cart quantity:', error);
//         }
//     });
// }


// document.getElementById('addToCartButton').addEventListener('click', (event) => {
//     event.preventDefault();
//     const productId = event.currentTarget.getAttribute('href').split('/').pop();

//     $.ajax({
//         url: `/add-to-cart/${productId}`,
//         method: 'POST',
//         success: (response) => {
//             if (response.success) {
//                 Toastify({
//                     text: "Product added to cart",
//                     duration: 1000,
//                     newWindow: true,
//                     close: false,
//                     gravity: "top", 
//                     position: "center", 
//                     style: {
//                         background: "linear-gradient(to right, #000, #000)",
//                         color: "#fff",
//                         marginTop: "35px",
//                     },
//                 }).showToast();
//                     updateCartQuantity();
//             } else {
//                 console.error('Failed to add item to the cart');
//                 toastr.error('Failed to add item to the cart');
//             }
//         },
//         error: (error) => {
//             console.error('AJAX request failed:', error);
//             toastr.error('AJAX request failed');
//         }
//     });
// });

// ✅ Function to update cart badge count dynamically
// function updateCartQuantity() {
//     $.ajax({
//         url: '/getcartquantity',
//         method: 'GET',
//         success: function (response) {
//             const cartQuantityElement = document.getElementById('cart-quantity');
//             if (cartQuantityElement && response.quantity !== undefined) {
//                 cartQuantityElement.textContent = response.quantity;
//             }
//         },
//         error: function (error) {
//             console.error('Error fetching cart quantity:', error);
//         }
//     });
// }

// // ✅ Wait until DOM is ready
// document.addEventListener("DOMContentLoaded", () => {
//     const addToCartButtons = document.querySelectorAll(".add-to-cart-button");

//     if (addToCartButtons.length === 0) return; // ✅ Safeguard

//     addToCartButtons.forEach((button) => {
//         button.addEventListener("click", (event) => {
//             event.preventDefault();

//             const productUrl = button.getAttribute("href");
//             const productId = productUrl.split('/').pop();

//             $.ajax({
//                 url: `/add-to-cart/${productId}`,
//                 method: "POST",
//                 success: (response) => {
//                     if (response.success) {
//                         // ✅ Show toast message
//                         Toastify({
//                             text: "Product added to cart 🛒",
//                             duration: 1200,
//                             close: false,
//                             gravity: "top",
//                             position: "center",
//                             style: {
//                                 background: "linear-gradient(to right, #fa8232, #000)",
//                                 color: "#fff",
//                                 borderRadius: "6px",
//                                 fontWeight: "bold",
//                                 marginTop: "40px",
//                             },
//                         }).showToast();

//                         updateCartQuantity();
//                     } else {
//                         console.error("Failed to add item to the cart");
//                         toastr.error("Failed to add item to the cart");
//                     }
//                 },
//                 error: (error) => {
//                     console.error("AJAX request failed:", error);
//                     toastr.error("AJAX request failed");
//                 },
//             });
//         });
//     });
// });

// ✅ Wait until DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    const addToCartButtons = document.querySelectorAll(".add-to-cart-button");

    // 🧩 Exit if no buttons found
    if (!addToCartButtons.length) return;

    addToCartButtons.forEach((button) => {
        button.addEventListener("click", async (event) => {
            event.preventDefault();

            // Disable button briefly to prevent double-clicks
            button.disabled = true;
            button.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-1"></i> Adding...`;

            try {
                const productUrl = button.getAttribute("href");
                const productId = productUrl.split("/").pop();

                // Send POST request (no jQuery needed)
                const response = await fetch(`/add-to-cart/${productId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                });

                const data = await response.json();

                if (data.success) {
                    // ✅ Success Toast
                    Toastify({
                        text: "🛒 Product added to cart!",
                        duration: 1500,
                        gravity: "top",
                        position: "center",
                        close: false,
                        style: {
                            background: "linear-gradient(to right, #fa8232, #000)",
                            color: "#fff",
                            borderRadius: "8px",
                            fontWeight: "bold",
                            marginTop: "35px",
                        },
                    }).showToast();

                    // ✅ Update cart count if available
                    updateCartQuantity();
                } else {
                    console.error("Failed to add item:", data.error);
                    Swal.fire("Error", "Failed to add item to cart", "error");
                }
            } catch (error) {
                console.error("Fetch request failed:", error);
                Swal.fire("Error", "Something went wrong while adding to cart.", "error");
            } finally {
                // Re-enable button
                button.disabled = false;
                button.innerHTML = `<i class="fa-solid fa-cart-plus me-1"></i>Add to Cart`;
            }
        });
    });

    // ✅ Fetch and update cart badge dynamically
    async function updateCartQuantity() {
        try {
            const response = await fetch("/getcartquantity");
            const data = await response.json();

            const cartBadge = document.getElementById("cart-quantity");
            if (cartBadge && data.quantity !== undefined) {
                cartBadge.textContent = data.quantity;
                cartBadge.style.display = data.quantity > 0 ? "inline-block" : "none";
            }
        } catch (error) {
            console.error("Error updating cart quantity:", error);
        }
    }
});

