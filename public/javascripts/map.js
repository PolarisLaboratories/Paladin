var hostname = window.location.hostname;
var wsaddr = "wss://".concat(hostname, "/map/wss");
var ws;

var config;
var width = $(window).width();
var height = $(window).height();

var svg;
var zoom;
var g;

var roomList = [];
var userList = [];

var roomEditEnabled = false;

// Constants

const ROOM_RADIUS = 5;
const ROOM_ZOOM_RADIUS = 10;
const ROOM_X_OFFSET = 30;
const ROOM_Y_OFFSET = 15;

const USER_RADIUS = 4;
const USER_ZOOM_RADIUS = 8;
const USER_X_OFFSET = 15;
const USER_Y_OFFSET = 8;

const ZOOM_DURATION = 500;

// Zoom setting for searching a user
const ZOOM_MULT = 4;

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

// Utilities
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getTranslation(transform) {
    // Create a dummy g for calculation purposes only. This will never
    // be appended to the DOM and will be discarded once this function
    // returns.
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Set the transform attribute to the provided string value.
    g.setAttributeNS(null, "transform", transform);

    // consolidate the SVGTransformList containing all transformations
    // to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
    // its SVGMatrix.
    var matrix = g.transform.baseVal.consolidate().matrix;

    // Below calculations are taken and adapted from the private function
    // transform/decompose.js of D3's module d3-interpolate.
    var {a, b, c, d, e, f} = matrix;   // ES6, if this doesn't work, use below assignment
    // var a=matrix.a, b=matrix.b, c=matrix.c, d=matrix.d, e=matrix.e, f=matrix.f; // ES5
    var scaleX, scaleY, skewX;
    if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
    if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
    if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
    if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
    return {
        translateX: e,
        translateY: f,
        rotate: Math.atan2(b, a) * 180 / Math.PI,
        skewX: Math.atan(skewX) * 180 / Math.PI,
        scaleX: scaleX,
        scaleY: scaleY,
    };
}

// Register all onload stuff here
$(document).ready(function() {
    // Add handlers for the buttons
    $('#zoom-reset').click(zoom_reset);
    $('#zoom-in').click(zoom_in);
    $('#zoom-out').click(zoom_out);

    $('#search-button').click(search_user);

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

    d3.selection.prototype.moveUp = function() {
        return this.each(function() {
            this.parentNode.appendChild(this);
        });
    };

    $("#search-input").keyup(function(event){
        if(event.keyCode == 13) {
            if ($("ul").css('display') === "none") {
                $("#search-button").click();
            }
        }
    });

    $("g").on('click', function(e) {
        if ($("#configure-card").is(":visible")) {
            $("#configure-card").hide();
        }
    });

    connect();
});

// WebSocket low level stuff. See below these for the message handlers
var functions = {
    'config': setup,
    'raw': raw,
    'rooms': room_first_run,
    'users': users,
};

function connect() {
    try {
        ws = new WebSocket(wsaddr);
    } catch (err) {
        banner("alert-danger", error(err), -1);
    }
    ws.onmessage = ws_handler;
    ws.onerror = ws_error;
}

function ws_error(message) {
    return error(message);
}

function ws_handler(event) {
    var response = JSON.parse(event.data);
    try {
        functions[response.type](response);
    } catch (err) {
        warning("Server sent unknown WebSocket data. Type: " + response.type);
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

// This is kind of a hack to prevent the users loading before the rooms are.
function room_first_run(response) {
    // Set the handler for future room updates to the real function
    functions['rooms'] = rooms;
    // Pass through to the real function
    rooms(response);
    // Send a request for users
    var request = {
        'type': 'user_request'
    };
    ws.send(JSON.stringify(request));
}

function rooms(response) {
    $("circle, .room-label").not('.user').remove();
    roomList = [];
    for (var room of response.data) {
        roomList.push(room);
        var circle = drawCircle(room.x + (0.5 * width), room.y + (0.5 * height), ROOM_RADIUS);
        circle.attr('data-name', room.name)
              .attr('data-id', room._id)
              .classed('room', true)
              .on("mouseover", room_mouseover)
              .on("mouseout", room_mouseout)
              .on("click", room_select);
        var text = drawText(room.x + (0.5 * width) - ROOM_X_OFFSET, room.y + (0.5 * height) - ROOM_Y_OFFSET, room.name);
        text.attr('id', 'room-label-' + room.name)
            .classed('room-label', true)
            .attr('text-anchor', 'middle')
        if (roomEditEnabled === false) {
            circle.attr("visibility", "hidden");
            text.attr("visibility", "hidden");
        }
    }
}

function users(response) {
    $(".user, .user-label").remove();
    userList = [];
    for (var user of response.data) {
        user.name = user.firstname + ' ' + user.lastname;
        userList.push(user);
        var room = roomList.find(function(room) {
            return room.name == user.location;
        });
        if (!room) {
            console.log("Invalid room specified for user " + user.username + ". Room: " + user.location);
        } else {
            var circle = drawCircle(room.x + (0.5 * width) - getRandomInt(-15, 15), room.y + (0.5 * height) - getRandomInt(-15, 15), USER_RADIUS);
            circle.attr('data-name', user.username)
                  .classed('user', true)
                  .attr('fill', 'red')
                  .on("mouseover", user_mouseover)
                  .on("mouseout", user_mouseout)
                  .on("click", user_click);
            user.icon = circle;
            var text = drawText(circle.attr('cx') - USER_X_OFFSET, circle.attr('cy') - USER_Y_OFFSET, user.firstname + ' ' + user.lastname);
            text.classed('user-label', true)
                .attr('id', 'user-label-' + user.username)
                .attr('fill', 'red')
                .attr('font-size', '10')
                .attr('text-anchor', 'middle')
        }
    }
    $("#search-input").typeahead({ source: userList });
}

function drawText(x, y, text) {
    var transform = g.attr('transform');
    var element = svg.append("text")
       .attr('x', x)
       .attr('y', y)
       .attr('transform', transform)
       .text(text);
    return element;
}

function search_user() {
    var name = $("#search-input").val();
    console.log("Searching user " + name);
    var user = userList.find(function(user) {
        return user.name == name;
    });
    var circle = user.icon;
    var x = circle.attr("cx");
    var y = circle.attr("cy");
    // Found these values from graphing regressions after manually zooming
    var xoffset = (width * 0.5) - x * ZOOM_MULT;
    var yoffset = (height * 0.5) - y * ZOOM_MULT;
    var transform = g.attr("transform");
    var t;
    if (transform) {
        t = getTranslation(transform);
    } else {
        t = getTranslation("translate(0,0) scale(1)");
    }
    t.translateX = xoffset;
    t.translateY = yoffset;
    console.log("Need to pan to " + xoffset + ', ' + yoffset);
    var final = d3.zoomIdentity.translate(t.translateX, t.translateY).scale(ZOOM_MULT);
    svg.transition().duration(2000).call(zoom.transform, final);
}

// User interface stuff
function drawCircle(x, y, size) {
    var transform = g.attr('transform');
    var circle = svg.append("circle")
              .classed('circle', true)
              .attr("cx", x)
              .attr("cy", y)
              .attr("r", size)
              .attr('transform', transform)
    return circle;
}

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
        $("#create-room").modal("toggle");
        $("#roomname").val("");
    });
}

function dispatch_room(name, x, y) {
    var point = {
        'type': 'room_create',
        'data': {
            'name': name,
            'x': x,
            'y': y
        }
    };
    ws.send(JSON.stringify(point));
    drawCircle(x + (0.5 * width), y + (0.5 * height), 5);
}

function toggle_rooms() {
    if (roomEditEnabled === false) {
        g.on("click", room_click);
        $('body').prepend('<div id="alert-container" style="padding: 5px; z-index: 10; position: absolute; right: 0; left: 0;"> <div id="inner-message" class="alert alert-info text-center"><b>Room Editing Mode</b><br>Click on the button again to exit</div></div>');
        svg.selectAll(".room, .room-label")
           .attr("visibility", "visible");
    } else {
        g.on("click", function() {

        });
        $("#alert-container").remove();
        svg.selectAll(".room, .room-label")
           .attr("visibility", "hidden");
    }
    roomEditEnabled = !roomEditEnabled;
}

function room_mouseover(d, i) {
    var element = d3.select(this);
    element.transition()
           .duration(ZOOM_DURATION)
           .attr('fill', 'blue')
           .attr('r', ROOM_ZOOM_RADIUS);
    var x = element.attr('cx');
    var y = element.attr('cy');
    var name = element.attr('data-name');
    d3.select("#room-label-" + name)
        .transition()
        .duration(ZOOM_DURATION)
        .style("font-size", "18")
        .attr("fill", "blue")
}

function room_mouseout(d, i) {
    var element = d3.select(this);
    element.transition()
           .duration(ZOOM_DURATION)
           .attr('fill', 'black')
           .attr('r', ROOM_RADIUS);
    var name = element.attr('data-name');
    d3.select("#room-label-" + name)
        .transition()
        .duration(ZOOM_DURATION)
        .style("font-size","14")
        .attr("fill", "black")
}

function room_select(d, i) {
    var element = d3.select(this);
    var x = element.attr('cx');
    var y = element.attr('cy');
    var name = element.attr('data-name');
    var id = element.attr('data-id');
    $("#user-container").hide();
    $("#roomname-edit").val(name);
    $("#configure-card").show();
    $("#room-container").show();
    $("#roomname-form").on('submit', function(e) {
        event.preventDefault();
        var request = {
            'type': 'room_update',
            'data' : {
                'id': id,
                'name' : $('#roomname-edit').val(),
            }
        }
        ws.send(JSON.stringify(request));
        $("#roomname-form").off('submit');
    });
    $("#delete-room").on('click', function(e) {
        var request = {
            'type': 'room_delete',
            'data': {
                'id': id,
            }
        };
        ws.send(JSON.stringify(request));
        $("#roomname-edit").val('');
        $("#delete-room").off('click');
    });
}

function user_mouseover(d, i) {
    var circle = d3.select(this);
    var x = circle.attr('cx');
    var y = circle.attr('cy');
    var name = circle.attr('data-name');
    var text = d3.select('#user-label-' + name);
    text.moveUp();
    var rawCircle = this;
    d3.selectAll('circle').transition().duration(ZOOM_DURATION).style('opacity',function () {
            return (this === rawCircle) ? 1.0 : 0.5;
    });
    circle.transition().duration(ZOOM_DURATION).attr('r', USER_ZOOM_RADIUS)
    text.transition()
        .duration(ZOOM_DURATION)
        .attr('fill', 'black')
        .style("font-size", "16")
        .style("font-weight", "bold")
}

function user_mouseout(d, i) {
    var circle = d3.select(this);
    var name = circle.attr('data-name');
    d3.selectAll('circle').transition().duration(ZOOM_DURATION).style('opacity', 1.0).attr('r', USER_RADIUS);
    d3.select('#user-label-' + name)
      .transition()
      .duration(ZOOM_DURATION)
      .attr('fill', 'red')
      .style("font-size","10")
      .style("font-weight", "")
}

function user_click(d, i) {
    var element = d3.select(this);
    var username = element.attr('data-name');
    var user = userList.find(function(user) {
        return user.username == username;
    });
    $("#username").val(user.firstname + ' ' + user.lastname);
    $("#location").val(user.location);
    $("#configure-card").show();
    $("#user-container").show();
}
