function populateForm(id) {
    $.getJSON("/users/user/" + id, function(data) {
        $("#firstname").val(data.firstname);
        $("#lastname").val(data.lastname);
        $("#username").val(data.username);
        $("#role").val(data.role);
        $("#user-form").attr("action", data._id);
    });
}

function submitUserForm() {
    var form = $("#user-form");
    var alert = $("#user-alert");
    $.ajax({
        type: $(form).attr('method'),
        url: '/users/update/' + $("#user-form").attr("action"),
        data: $(form).serialize(),

        success: function(data, status) {
            if (data.status == "success") {
                $(alert).addClass("alert-success");
            } else {
                $(alert).addClass("alert-danger");
            }
            $(alert).show().text(data.message);
            generateTable();
        }
    });
    event.preventDefault();
}

function submitPasswordForm() {
    var form = $("#password-form");
    var alert = $("#password-alert");
    $.ajax({
        type: $(form).attr('method'),
        url: '/users/password/' + $("#user-form").attr("action"),
        data: $(form).serialize(),

        success: function(data, status) {
            if (data.status == "success") {
                $(alert).addClass("alert-success");
            } else {
                $(alert).addClass("alert-danger");
            }
            $(alert).show().text(data.message);
            generateTable();
        }
    });
    event.preventDefault();
}

$(document).ready(function() {
    $('#edit-user').on('show.bs.modal', function(e) {
        populateForm($(e.relatedTarget).data('id'));
    });
    $('#edit-user').on('hidden.bs.modal', function(e) {
        $("#user-alert").removeClass("alert-success").removeClass("alert-danger").hide().text("");
        $("#password-alert").removeClass("alert-success").removeClass("alert-danger").hide().text("");
    });
    $('#user-form').on('submit', function(e) {
        submitUserForm();
    });
    $('#password-form').on('submit', function(e) {
        submitPasswordForm();
    });
});