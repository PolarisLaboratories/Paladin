var hostname = window.location.hostname;
var wsaddr = "wss://".concat(hostname, "/api");
var ws;

var config;
var width = $(window).width();
var height = $(window).height();

var svg;
var zoom;
var g;

// Alert functions
function banner(type, message, delay) {
    $('body').prepend('<div style="padding: 5px; z-index: 10; position: absolute; right: 0; left: 0;"> <div id="inner-message" class="alert ' + type + ' show"><button type="button" class="close" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span></button>' + message + '</div></div>');
    if (delay >= 0) {
        $(".alert").delay(3000).fadeOut("slow", function () { $(this).parent('div').remove(); $(this).remove(); });
    }
}

function error(message) {
    banner("alert-danger", "An error occurred. Please contact Polaris Laboratories. Error: " + message, -1);
}

/*
 * Register all onload stuff here
 */
$(document).ready(function() {
    // Add handlers for the buttons
    $('#zoom-reset').click(zoom_reset);
    $('#zoom-in').click(zoom_in);
    $('#zoom-out').click(zoom_out);

    // Initialize all tooltips
    $('[data-toggle="tooltip"]').tooltip();

    // Disable the scroll bar
    document.documentElement.style.overflow = 'hidden';
    // Only for IE
    document.body.scroll = 'no';

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
        error("Server sent unknown WebSocket data.");
    }
}

// WebSocket message handlers
function raw(response) {
    console.log(response.data);
    banner("alert-info", response.data, 2000);
}

function setup(response) {
    config = response;

    // Grab the dimensions from the imsage
    var image = new Image();
    image.src = config.map;

    image.onload = function() {
        g.append("svg:image")
            .attr("xlink:href", config.map)
            .attr("x", "50%")
            .attr("y", "50%")
            .attr("width", image.width + "px")
            .attr("height", image.height + "px")
            // Disgusting string concatenation
            .attr("transform", "translate(-" + image.width / 2 + ", -" + image.height / 2 + ")")
        $("link[href='stylesheets/loading.css']").remove();
        $("div.loading").remove();
    }
}

/*
 * User interface stuff
 */
 function zoomed () {
     g.attr("transform", d3.event.transform);
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
