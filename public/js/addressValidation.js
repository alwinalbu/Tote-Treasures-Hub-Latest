document.addEventListener("DOMContentLoaded", () => {
    const forms = document.querySelectorAll("form[action^='/addAddress'], form[action^='/editAddress']");

    function showError(input, message) {
        let error = input.parentElement.querySelector(".error-text");
        if (!error) {
            error = document.createElement("small");
            error.className = "error-text text-danger mt-1 d-block";
            input.parentElement.appendChild(error);
        }
        error.textContent = message;
        input.classList.add("is-invalid");
    }

    function clearError(input) {
        const error = input.parentElement.querySelector(".error-text");
        if (error) error.textContent = "";
        input.classList.remove("is-invalid");
        input.classList.add("is-valid");
    }

    forms.forEach((form) => {
        const name = form.querySelector("input[name='Name']");
        const address = form.querySelector("input[name='AddressLane']");
        const city = form.querySelector("input[name='City']");
        const pincode = form.querySelector("input[name='Pincode']");
        const state = form.querySelector("input[name='State']");
        const mobile = form.querySelector("input[name='Mobile']");

        const nameRegex = /^[A-Za-z\s]{3,20}$/;
        const cityStateRegex = /^[A-Za-z\s]{2,30}$/;
        const pincodeRegex = /^[0-9]{6}$/;
        const mobileRegex = /^[0-9]{10}$/;

        function validateField(input) {
            const val = input.value.trim();
            let valid = true;

            if (input === name && !nameRegex.test(val))
                showError(input, "Only letters allowed (3–20 characters)."), (valid = false);
            else if (input === address && val.length < 5)
                showError(input, "Address must be at least 5 characters."), (valid = false);
            else if (input === city && !cityStateRegex.test(val))
                showError(input, "City must contain only letters."), (valid = false);
            else if (input === pincode && !pincodeRegex.test(val))
                showError(input, "Enter a valid 6-digit pincode."), (valid = false);
            else if (input === state && !cityStateRegex.test(val))
                showError(input, "State must contain only letters."), (valid = false);
            else if (input === mobile && !mobileRegex.test(val))
                showError(input, "Mobile must be exactly 10 digits."), (valid = false);
            else clearError(input);

            return valid;
        }

        [name, address, city, pincode, state, mobile].forEach((input) => {
            input.addEventListener("input", () => validateField(input));
        });

        form.addEventListener("submit", (e) => {
            let allValid = true;
            [name, address, city, pincode, state, mobile].forEach((input) => {
                const ok = validateField(input);
                if (!ok) allValid = false;
            });

            if (!allValid) {
                e.preventDefault();
                Swal.fire({
                    icon: "error",
                    title: "Please correct the highlighted errors",
                    confirmButtonColor: "#fa8232",
                });
            }
        });
    });
});

// 🗑️ Delete confirmation
document.addEventListener("DOMContentLoaded", () => {
    const removeButtons = document.querySelectorAll(".remove-button");

    removeButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();

            Swal.fire({
                title: "Remove Address",
                text: "Are you sure you want to remove this address?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, remove it",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#fa8232",
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = button.href;
                }
            });
        });
    });
});
