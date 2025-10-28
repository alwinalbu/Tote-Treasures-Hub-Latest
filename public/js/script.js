
// $(document).ready(function () {
  
//   let duration = 120; 
//   let countdown;

 
//   const timerDisplay = $("#timer");
//   const resendOtp = $("#resendOtp");
//   const otpInput = $("#number");
//   const emailVerificationButton = $("#emailVerification");

  
//   function updateTimer() {
//     const minutes = Math.floor(duration / 60);
//     let seconds = duration % 60;
//     seconds = seconds < 10 ? "0" + seconds : seconds;

//     timerDisplay.text(`${minutes}:${seconds}`);

//     if (duration === 0) {
//       clearInterval(countdown);
//       timerDisplay.text("00:00");
//       resendOtp.css("display", "block");
//     } else {
//       duration--;
//     }
//   }

  
//   updateTimer();


//   countdown = setInterval(updateTimer, 1000);

  
//   emailVerificationButton.click(function (e) {
//     e.preventDefault(); 

//     const otp = otpInput.val();

//     $.ajax({
//       type: "POST",
//       url: "/emailVerification", 
//       data: { otp:otp }, 
//       success: function (response) {


//         if (response.success) {
//           clearInterval(countdown);
//           timerDisplay.text(" Otp Validated Signup Successful");
      
//           var redirectUrl = response.redirectUrl;
//           console.log("Redirect URL:", redirectUrl);
      
//           window.location.href = redirectUrl;
//       }
//        else {
         
//           alert("Invalid OTP. Please try again.");
//         }
//       },
//       error: function () {
//         alert("An error occurred while validating OTP.");
//       },
//     });
//     console.log('data');
//   });
// });


$(document).ready(function () {

  let duration = 60; // 2 minutes
  const timerDisplay = $("#timer");
  const resendOtp = $("#resendOtp");
  const otpInput = $("#number");
  const emailVerificationButton = $("#emailVerification");
  let countdown;

  function updateTimer() {
    const minutes = Math.floor(duration / 60);
    const seconds = (duration % 60).toString().padStart(2, "0");

    // show formatted timer while active
    timerDisplay.text(`${minutes}:${seconds}`);

    if (duration === 0) {
      clearInterval(countdown);

      // show expired message
      timerDisplay.text("OTP expired");

      // change style to make it obvious
      timerDisplay.css({
        color: "red",
        fontWeight: "bold",
      });

      // show resend link
      resendOtp.fadeIn();

      // disable verify button
      emailVerificationButton.prop("disabled", true).css({
        opacity: 0.6,
        cursor: "not-allowed",
      });
    } else {
      duration--;
    }
  }

  // start timer
  updateTimer();
  countdown = setInterval(updateTimer, 1000);

  emailVerificationButton.click(function (e) {
    e.preventDefault();

    const otp = otpInput.val();

    $.ajax({
      type: "POST",
      url: "/emailVerification",
      data: { otp: otp },
      success: function (response) {


        if (response.success) {
          clearInterval(countdown);
          timerDisplay.text(" Otp Validated Signup Successful");

          var redirectUrl = response.redirectUrl;
          console.log("Redirect URL:", redirectUrl);

          window.location.href = redirectUrl;
        }
        else {

          alert("Invalid OTP. Please try again.");
        }
      },
      error: function () {
        alert("An error occurred while validating OTP.");
      },
    });
    console.log('data');
  });
});
