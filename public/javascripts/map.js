var hostname = window.location.hostname;
var wsaddr = "wss://".concat(hostname, "/api");
var config;

var width = $(document).width();
var height = $(document).height();

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
function ws_error(event) {
    banner("alert-danger", "An error occurred: " + event.data, -1);
}

function ws_handler(event) {
    var response = JSON.parse(event.data);
    try {
        functions[response.type](response);
    } catch (err) {
        banner("alert-danger", "No handler for WebSocket packet.", -1);
    }
}

var functions = {
    'config': setup,
    'raw': log,
};

/*
 * Register all onload stuff here
 */
$(document).ready(function() {
    // Add handlers for the buttons
    $('#zoom-reset').click(zoom_reset);
    $('#zoom-in').click(zoom_in);
    $('#zoom-out').click(zoom_out);
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

// Connect to the web socket
function connect() {
    try {
        var paladinws = new PaladinWebSocket(wsaddr);
    } catch (err) {
        banner("alert-danger", "An error occurred while connecting. Please contact Polaris Laboratories. Error: " + err, -1);
    }
    paladinws.ws.onmessage = ws_handler;
    paladinws.ws.onerror = ws_error;

    banner("alert-info", "Connected to " + wsaddr, 3000);
}

// WebSocket message handlers
function log(response) {
    console.log(response.data);
    banner("alert-info", response.data, 2000);
}

function setup(response) {
    $("link[href='stylesheets/loading.css']").remove();
    $("div.loading").remove();

    config = response;

    g.append("svg:image")
        .attr("xlink:href", config.map)
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
