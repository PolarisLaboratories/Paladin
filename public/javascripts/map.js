var hostname = window.location.hostname;
var wsaddr = "ws://".concat(hostname, ":1234/api");
var config;

/*
 * Useful functions
 */
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
 * Disable the scroll bar
 */
document.documentElement.style.overflow = 'hidden';
// Only for IE
document.body.scroll = 'no';

/*
 * Connect to the web socket
 */
try {
    var paladinws = new PaladinWebSocket(wsaddr);
} catch (err) {
    banner("alert-danger", "An error occurred while connecting. Please contact Polaris Laboratories. Error: " + err, -1);
}
paladinws.ws.onmessage = ws_handler;
paladinws.ws.onerror = ws_error;

banner("alert-info", "Connected to " + wsaddr, 3000);

/*
 * Event based handling
 */

function log(response) {
    console.log(response.data);
    banner("alert-info", response.data, 2000);
}

function setup(response) {
    $("link[href='stylesheets/loading.css']").remove();
    $("div.loading").remove();

    config = response;
    /*
     * Initialize the page SVG and controls
     */
    var width = $(document).width();
    var height = $(document).height();

    var zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", zoomed);

    var svg = d3.select("svg")
        .attr("width", width)
        .attr("height", height)

    g = svg.append("g");

    function zoomed () {
        g.attr("transform", d3.event.transform);
    }

    svg.call(zoom);

    g.append("svg:image")
        .attr("xlink:href", config.map)
}
