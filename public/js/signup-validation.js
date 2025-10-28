// signup-validation.js
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signupForm");

    // Inputs
    const username = document.getElementById("username");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirm-password");

    // Error Message Spans
    const usernameError = document.getElementById("usernameError");
    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");
    const confirmPasswordError = document.getElementById("confirmPasswordError");

    // Toggle Eye Icons
    const togglePassword = document.getElementById("togglePassword");
    const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

    // ✅ Helper Functions
    const showError = (input, errorElement, message) => {
        errorElement.textContent = message;
        errorElement.style.display = "block";
        input.classList.add("invalid");
        input.classList.remove("valid");
    };

    const showSuccess = (input, errorElement) => {
        errorElement.textContent = "";
        errorElement.style.display = "none";
        input.classList.add("valid");
        input.classList.remove("invalid");
    };

    
    // 🔹 Username Validation
    username.addEventListener("input", () => {
        const value = username.value.trim();

        if (value.length < 4) {
            showError(username, usernameError, "Username must be at least 4 characters.");
        } else if (value.length > 15) {
            showError(username, usernameError, "Username cannot exceed 15 characters.");
            username.value = value.substring(0, 20);
        } else if (!/^[A-Za-z0-9_]+(?: [A-Za-z0-9_]+)*$/.test(value)) {
            showError(username, usernameError, "Only letters, numbers, underscores, and single spaces allowed (no leading, trailing, or multiple spaces).");
        } else if (/^-?\d+$/.test(value)) {
            showError(username, usernameError, "Username cannot be only numbers or negative values.");
        } else {
            showSuccess(username, usernameError);
        }
    });


    // ✅ Email Validation
    email.addEventListener("input", () => {
        const value = email.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            showError(email, emailError, "Enter a valid email address.");
        } else {
            showSuccess(email, emailError);
        }
    });

    // ✅ Password Validation
    password.addEventListener("input", () => {
        const value = password.value;

        if (value.length < 8) {
            showError(password, passwordError, "Password must be at least 8 characters.");
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(value)) {
            showError(password, passwordError, "Include upper, lower, number, and special character.");
        } else if (/^-?\d+$/.test(value)) {
            showError(password, passwordError, "Password cannot be only numbers or negative values.");
        } else if (value === username.value) {
            showError(password, passwordError, "Password cannot be the same as username.");
        } else {
            showSuccess(password, passwordError);
        }
    });

    // ✅ Confirm Password Validation
    confirmPassword.addEventListener("input", () => {
        if (confirmPassword.value !== password.value || confirmPassword.value === "") {
            showError(confirmPassword, confirmPasswordError, "Passwords do not match.");
        } else {
            showSuccess(confirmPassword, confirmPasswordError);
        }
    });

    // ✅ Password Visibility Toggle
    if (togglePassword && password) {
        togglePassword.addEventListener("click", () => {
            const type = password.getAttribute("type") === "password" ? "text" : "password";
            password.setAttribute("type", type);
            togglePassword.classList.toggle("fa-eye-slash");
        });
    }

    if (toggleConfirmPassword && confirmPassword) {
        toggleConfirmPassword.addEventListener("click", () => {
            const type = confirmPassword.getAttribute("type") === "password" ? "text" : "password";
            confirmPassword.setAttribute("type", type);
            toggleConfirmPassword.classList.toggle("fa-eye-slash");
        });
    }

    // ✅ Final Validation on Form Submit
    form.addEventListener("submit", (e) => {
        // Trigger validation manually before submission
        username.dispatchEvent(new Event("input"));
        email.dispatchEvent(new Event("input"));
        password.dispatchEvent(new Event("input"));
        confirmPassword.dispatchEvent(new Event("input"));

        // If any field is invalid, stop submission
        if (
            username.classList.contains("invalid") ||
            email.classList.contains("invalid") ||
            password.classList.contains("invalid") ||
            confirmPassword.classList.contains("invalid")
        ) {
            e.preventDefault();
            alert("Please fix the highlighted errors before submitting.");
        }
    });
});
