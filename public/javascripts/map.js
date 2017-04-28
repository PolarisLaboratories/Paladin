var paladinws = new PaladinWebSocket("ws://localhost:1234/api");

var width = $(document).width();
var height = $(document).height();

var zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)

g = svg.append("g");

function zoomed () {
    g.attr("transform", d3.event.transform);
}

svg.call(zoom);

g.append("svg:image")
    .attr("xlink:href", "images/US.svg")
