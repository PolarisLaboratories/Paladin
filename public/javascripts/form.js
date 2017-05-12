$(function() {
    $('form').submit(function(e) {
        var form = $(this);
        var alert = $(form).attr('data-alert');

        $.ajax({
            type: $(form).attr('method'),
            url: $(form).attr('action'),
            data: $(form).serialize(),

            success: function(data, status) {
                console.log(data);
                if (data.status == "success") {
                    $(alert).addClass("alert-success");
                } else {
                    $(alert).addClass("alert-danger");
                }
                $(alert).removeAttr("hidden").text(data.message);
                // Only clear password fields in this form
                $(form).find("input[type='password']").val('');
            }
        });
        event.preventDefault();
    });
});
