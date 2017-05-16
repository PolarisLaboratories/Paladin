var hostname = window.location.hostname;
var wsaddr = "wss://".concat(hostname, "/map/wss");
var ws;

var config;
var width = $(window).width();
var height = $(window).height();

var svg;
var zoom;
var g;

var roomEditEnabled = false;

// Alert functions
function banner(type, message, delay) {
    $('body').prepend('<div style="padding: 5px; z-index: 10; position: absolute; right: 0; left: 0;"> <div id="inner-message" class="alert ' + type + ' show"><button type="button" class="close" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span></button>' + message + '</div></div>');
    if (delay >= 0) {
        $(".alert").delay(delay).fadeOut("slow", function () { $(this).parent('div').remove(); $(this).remove(); });
    }
}

function error(message) {
    banner("alert-danger", "An error occurred. Please contact Polaris Laboratories. Error: " + message, -1);
}

function warning(message) {
    banner("alert-warning", "Something unexpected occurred. Please contact Polaris Laboratories. Event: " + message, 5000);
}

// Register all onload stuff here
$(document).ready(function() {
    // Add handlers for the buttons
    $('#zoom-reset').click(zoom_reset);
    $('#zoom-in').click(zoom_in);
    $('#zoom-out').click(zoom_out);

    // Initialize all tooltips
    $('[data-toggle="tooltip"]').tooltip();

    // Initialize page properties
    zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", zoomed);

    svg = d3.select("svg")
        .attr("width", width)
        .attr("height", height)

    g = svg.append("g");

    svg.call(zoom);

    connect();
});

// WebSocket low level stuff. See below these for the message handlers
var functions = {
    'config': setup,
    'raw': raw,
    'rooms': rooms,
};

function connect() {
    try {
        ws = new WebSocket(wsaddr);
    } catch (err) {
        banner("alert-danger", error(err), -1);
    }
    ws.onmessage = ws_handler;
    ws.onerror = ws_error;

    banner("alert-info", "Connected to " + wsaddr, 3000);
}

function ws_error(message) {
    return error(message);
}

function ws_handler(event) {
    var response = JSON.parse(event.data);
    try {
        functions[response.type](response);
    } catch (err) {
        warning("Server sent unknown WebSocket data.");
    }
}

// WebSocket message handlers
function raw(response) {
    console.log(response.data);
    banner("alert-info", response.data, 2000);
}

function drawCircle(x, y, size, name) {
    var circle = svg.append("circle")
              .attr('class', 'circle')
              .attr("cx", x)
              .attr("cy", y)
              .attr("r", size)
              .attr('data-name', name)
              .on("mouseover", room_mouseover)
              .on("mouseout", room_mouseout);
    var text = svg.append("text")
       .attr('x', x - 30)
       .attr('y', y - 15)
       .attr('id', 'label-' + name)
       .text(name);
    if (roomEditEnabled === false) {
        circle.attr("visibility", "hidden");
        text.attr("visibility", "hidden");
    }
    return circle;
}

function setup(response) {
    config = response;

    // Grab the dimensions from the imsage
    var image = new Image();
    image.src = config.map;

    // Wait for the image to load, or else we get garbage metadata
    image.onload = function() {
        g.append("svg:image")
            .attr("xlink:href", config.map)
            .attr("x", "50%")
            .attr("y", "50%")
            .attr("width", image.width + "px")
            .attr("height", image.height + "px")
            // Disgusting string concatenation
            .attr("transform", "translate(-" + image.width / 2 + ", -" + image.height / 2 + ")")
        // Remove the CSS loading element since the map is technically loaded
        $("link[href='stylesheets/loading.css']").remove();
        $("div.loading").remove();
    }
}

function rooms(response) {
    $(".circle").remove();
    for (var room of response.data) {
        var circle = drawCircle(room.x + (0.5 * width), room.y + (0.5 * height), 5, room.name);
    }
}

// User interface stuff
function zoomed () {
    g.attr("transform", d3.event.transform);
    svg.selectAll("circle, text").attr("transform", d3.event.transform);
}

function zoom_reset() {
    svg.transition()
       .duration(750)
       .call(zoom.transform, d3.zoomIdentity);
}

function zoom_in() {
    svg.transition()
       .duration(750)
       .call(zoom.scaleBy, 2);
}

function zoom_out() {
    svg.transition()
       .duration(750)
       .call(zoom.scaleBy, 0.5);
}

function room_click() {
    $('#create-room').on('show.bs.modal', function(e) {
        $(this).removeClass("fade");
    });
    $("#create-room").modal("toggle");
    var coords = d3.mouse(this);
    /*
     * Why do we subtract 0.5 * width and 0.5 * height? Note that the
     * image above has 50% for the x and y attributes, which is
     * necessary to ensure that the image is properly centered in
     * the g element. Thus, the value we get as the mouse click location
     * is off by 0.5 * the dimensions of the screen size. The value
     * we send to the server is this "compensated" value, but when
     * we render the dots, we add the offset for the screen size.
     */
    var x = coords[0] - (0.5 * width);
    var y = coords[1] - (0.5 * height);
    $('#create-room-form').on('submit', function(e) {
        event.preventDefault();
        $('#create-room-form').off('submit');
        dispatch_room($("#roomname").val(), x, y);
        $('#create-room').on('hide.bs.modal', function(e) {
            $(this).removeClass("fade");
        });
        $("#create-room").modal("toggle");
        $("#roomname").val("");
    });
}

function dispatch_room(name, x, y) {
    var point = {
        'type': 'point',
        'data': {
            'name': name,
            'x': x,
            'y': y
        }
    };
    ws.send(JSON.stringify(point));
    drawCircle(x + (0.5 * width), y + (0.5 * height), 5, name);
}

function toggle_rooms() {
    if (roomEditEnabled === false) {
        g.on("click", room_click);
        $('body').prepend('<div id="alert-container" style="padding: 5px; z-index: 10; position: absolute; right: 0; left: 0;"> <div id="inner-message" class="alert alert-info text-center"><b>Room Editing Mode</b><br>Click on the button again to exit</div></div>');
        svg.selectAll("circle, text")
           .attr("visibility", "visible");
    } else {
        g.on("click", function() {

        });
        $("#alert-container").remove();
        svg.selectAll("circle, text")
           .attr("visibility", "hidden");
    }
    roomEditEnabled = !roomEditEnabled;
}

function room_mouseover(d, i) {
    var element = d3.select(this);
    element.attr('fill', 'orange')
        .attr('r', 10)
    var x = element.attr('cx');
    var y = element.attr('cy');
    var name = element.attr('data-name');
    $("#label-" + name).css("font-weight","Bold");
}

function room_mouseout(d, i) {
    var element = d3.select(this);
    element.attr('fill', 'black')
           .attr('r', 5);
    var name = element.attr('data-name');
    $("#label-" + name).css("font-weight","");
}
