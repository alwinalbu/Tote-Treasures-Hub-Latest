
$(document).ready(function () {
    // Open modal with SweetAlert confirmation
    $("#changePasswordButton").click(() => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you really want to change your password?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, change it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $('#changePasswordModal').modal('show');
            } else {
                Swal.fire('Password change canceled!', '', 'info');
            }
        });
    });

    // ✅ Bind submit ONCE (removed shown.bs.modal binding)
    $("#passwordChangeForm").on("submit", submitPasswordChangeForm);
});

function submitPasswordChangeForm(e) {
    e.preventDefault();

    console.log('Form submitted!');
    $.ajax({
        url: '/changePassword',
        method: 'POST',
        data: $('#passwordChangeForm').serialize(),
        success: (response) => {
            if (response.success) {
                console.log('Password changed successfully');

                // Close modal
                $('#changePasswordModal').modal('hide');

                // Reset form + clear flash message
                $('#passwordChangeForm')[0].reset();
                $('#flashMessage').hide();

                Swal.fire({
                    title: 'Success!',
                    text: response.message || 'Password changed successfully',
                    icon: 'success',
                });
            } else {
                $('#flashMessage').text(response.error).show();
                Swal.fire({
                    title: 'Error!',
                    text: response.error || 'An error occurred. Please try again.',
                    icon: 'error',
                });
            }
        },
        error: (xhr, status, error) => {
            console.log('Error:', error);

            // Try to read the actual error message from backend
            const response = xhr.responseJSON;

            console.log("error is here",response);
            

            const message = response?.error || 'An error occurred. Please try again.';

            $('#flashMessage').text(message).show();

            Swal.fire({
                title: 'Error!',
                text: message,
                icon: 'error',
            });
        }
    });
}
