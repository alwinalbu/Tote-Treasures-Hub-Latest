document.addEventListener("DOMContentLoaded", () => {
    const removeButtons = document.querySelectorAll(".remove-button");

    removeButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            
             console.log("delete adress here");

            Swal.fire({
                title: "Remove Address",
                text: "Are you sure you want to remove this Address?",
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
});
