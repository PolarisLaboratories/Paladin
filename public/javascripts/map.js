var hostname = window.location.hostname;
var wsaddr = "wss://".concat(hostname, ":1234/api");
console.log("Connecting to " + wsaddr);

var paladinws = new PaladinWebSocket(wsaddr);

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
    .attr("xlink:href", "images/US.svg")
