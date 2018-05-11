function createUser() {
    var form = $("#create-form");
    var alert = $("#create-alert");
    $.ajax({
        type: $(form).attr('method'),
        url: '/users/create',
        data: $(form).serialize(),

        success: function(data, status) {
            if (status === "success") {
                $(alert).addClass("alert-success");
            } else {
                $(alert).addClass("alert-danger");
            }
            $(alert).show().text(data.message);
            console.log(data);
            generateTable();
        }
    });
    event.preventDefault();
}

$(document).ready(function() {
    $('#create-user').on('hidden.bs.modal', function(e) {
        $("#create-alert").removeClass("alert-success").removeClass("alert-danger").hide().text("");
    });
    $('#create-form').on('submit', function(e) {
        createUser();
    });
});
