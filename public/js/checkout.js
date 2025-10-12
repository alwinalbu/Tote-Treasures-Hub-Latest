  

$(document).ready(function () {

  // Checkout form submission
  $("#form-checkout").submit((e) => {
    e.preventDefault();

    const selectedAddress = $("input[name='Address']:checked").val();

    if (!selectedAddress) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please Add An Address Before Confirming The Order.",
      });
      return;
    }

    $.ajax({
      url: '/checkout',
      method: 'post',
      data: $('#form-checkout').serialize(),
      success: (data) => {
        if (data.cartEmpty) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Your cart is empty. Please add items to your cart before checking out.',
            showCancelButton: true,
            confirmButtonText: 'OK',
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.href = '/shop';
            }
          });

        } else if (data.codSuccess) {
          console.log("COD payment success");
          window.location = '/orderSuccess';

        } else if (data.onlineSuccess) {
          console.log("Online payment selected, redirecting to Razorpay");
          handlePayNowClick(data);

        } else if (data.walletSuccess) {
          console.log("Wallet payment success");
          window.location = '/orderSuccess';

        } else if (data.walletSuccess === false) {
          Swal.fire({
            icon: 'error',
            title: 'Insufficient Wallet Balance',
            text: data.error || 'Your wallet balance is too low. Please choose another payment method.',
            confirmButtonText: 'OK',
          });
        }
      },

      error: (error) => {
        console.error('AJAX request failed:', error);
        Swal.fire({
          icon: 'error',
          title: 'Request Failed',
          text: 'Something went wrong. Please try again later.',
        });
      },
    });
  });
});


// Razorpay payment handler
function handlePayNowClick(order) {
  var options = {
    "key": "rzp_test_k4YsY5id32FQHs", 
    "amount": order.createdOrder.amount,
    "currency": "INR",
    "name": "ToteTreasures Hub",
    "description": "Test Transaction",
    "image": "/images/logo.png",
    "order_id": order.createdOrder.id,

    "handler": function (response) {
      verifyPayment(response, order);
    },

    //  format for Razorpay
    "prefill": {
      "name": order.order.Username || "Customer",
      "email": order.order.Email || "customer@example.com",
      "contact": order.order.Mobile || "9999999999"
    },

    "notes": {
      "address": "Razorpay Corporate Office"
    },

    "theme": {
      "color": "#33ccb3"
    }
  };

  if (typeof Razorpay !== 'undefined') {
    var rzp1 = new Razorpay(options);
    rzp1.open();
  } else {
    console.error('Razorpay script not loaded');
  }
}


// Verify payment with backend
function verifyPayment(payment, order) {
  console.log('Now verifying payment...');

  $.ajax({
    url: '/verify-payment',
    data: {
      payment,
      order
    },
    method: 'post',
    success: (response) => {
      if (response.success) {
        console.log('Payment verified successfully');
        location.href = '/orderSuccess';
      } else {
        console.log('Payment verification failed');
        Swal.fire({
          icon: 'error',
          title: 'Payment Failed',
          text: 'There was an error processing your payment. Please try again later or contact support.'
        });
      }
    },
    error: () => {
      console.log('AJAX request failed during payment verification');
      Swal.fire({
        icon: 'error',
        title: 'Request Failed',
        text: 'There was an issue processing your request. Please try again later.'
      });
    }
  });
}
