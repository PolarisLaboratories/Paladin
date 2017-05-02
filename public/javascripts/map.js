var hostname = window.location.hostname;
var wsaddr = "ws://".concat(hostname, ":1234/api");
var config;

/*
 * Useful functions
 */
function map_alert(message) {
    $('body').prepend('<div style="padding: 5px; z-index: 10; position: absolute; right: 0; left: 0;"> <div id="inner-message" class="alert alert-info alert-dismissible show"><button type="button" class="close" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span></button>' + message + '</div></div>');
    $(".alert-dismissible").delay(3000).fadeOut("slow", function () { $(this).parent('div').remove(); $(this).remove(); });
}

function message_handler(event) {
    var response = JSON.parse(event.data);
    functions[response.type](response);
}

var functions = {
    'config': setup,
};

/*
 * Connect to the web socket
 */
var paladinws = new PaladinWebSocket(wsaddr);
paladinws.ws.onmessage = message_handler;

map_alert("Connected to " + wsaddr);

/*
 * Event based handling
 */
function setup(response) {
    config = response;
    /*
     * Initialize the page SVG and controls
     */
    var width = $(document).width();
    var height = $(document).height();

    // Disable the scroll bar
    document.documentElement.style.overflow = 'hidden';
    // Only for IE
    document.body.scroll = 'no';

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
