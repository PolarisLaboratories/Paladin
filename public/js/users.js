function generateTable() {
    $.getJSON("/users/list", function(data) {
        if (data.status == "success") {
            var users = JSON.parse(data.data);
            // Reset the table
            $("#user-table").find("tbody").remove();
            $("#user-table").append('<tbody>');
            $.each(users, function(i, user) {
                $('<tr>').append(
                    $('<td>').text(user.username),
                    $('<td>').text(user.firstname),
                    $('<td>').text(user.lastname),
                    $('<td>').text(user.role),
                    $('<td>').text(user.tagID),
                    $('<td>').text(user.location),
                    $('<td>').html('<div class="btn-toolbar"><button class="btn btn-primary btn-raised" type="button" data-id="' + user._id + '" data-toggle="modal" data-target="#edit-user">Edit</a><button class="btn btn-danger btn-raised" type="button" data-href="/users/user/' + user._id + '" data-toggle="modal" data-target="#confirm-delete">Delete</button></div>')
                ).appendTo('#user-table');
            });
            $('td').css("vertical-align", "middle");
            $("#user-table").append('</tbody>');
            $("#num-users").html('<strong>' + users.length + '</strong> users in the database');
        } else {
            $("#users-alert").addClass("alert-danger").show().text(data.message);
        }
    });
}

function deleteUser() {
    $.ajax({
        type: 'DELETE',
        url: $('#delete-ok').attr('href'),

        success: function(data, status) {
            generateTable();
            $("#confirm-delete").modal('toggle');
        }
    });
    event.preventDefault();
};

$(document).ready(function() {
    generateTable();
    $('#delete-ok').click(function() {
        deleteUser();
    });
});
