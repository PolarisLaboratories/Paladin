var WebSocket = require('ws');
var Room = require('../models/room')
var config = require('../config/config.json')

/*
 * Communication packets between client and server:
 *
 * Valid types for server->client: config, raw, user, rooms
 * Valid types for client->server: room_create, room_update, room_delete
 */

var wss = new WebSocket.Server({
    perMessageDeflate: false,
    port: 1234,
    path: '/map/wss'
});

var functions = {
    'room_create': room_create,
    'room_update': room_update,
    'room_delete': room_delete,
};

wss.broadcast = function (data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

wss.on('connection', function(ws) {
    console.log('Client connected to WebSocket');
    config.type = 'config';
    ws.send(JSON.stringify(config));
    Room.find({}).lean().exec(function(err, rooms) {
        var res = {
            'type': 'rooms',
            'data': rooms
        };
        ws.send(JSON.stringify(res));
    });

    ws.on('message', function(data, flags) {
        var response = JSON.parse(data);
        try {
            functions[response.type](response);
        } catch (err) {
            console.log("Client sent unknown command: " + response.type);
        }
    });

    ws.on('close', function(code, reason) {
        console.log('Client disconnected from WebSocket.');
    });
});

function room_create(response) {
    var data = response.data;
    var room = new Room({
        name: data.name,
        x: data.x,
        y: data.y
    });
    room.save(function(err) {
        if (err) {
            console.log("An error occurred while saving room");
        }
        Room.find({}).lean().exec(function(err, rooms) {
            var res = {
                'type': 'rooms',
                'data': rooms
            };
            wss.broadcast(JSON.stringify(res));
        });
    });
}

function room_update(response) {
    var data = response.data;
    Room.update({ _id: data.id }, { name: data.name }, function(err, numberAffected, rawResponse) {
        if (err) {
            return console.log("An error occurred while updating room");
        }
        Room.find({}).lean().exec(function(err, rooms) {
            var res = {
                'type': 'rooms',
                'data': rooms
            };
            wss.broadcast(JSON.stringify(res));
        });
    });
}

function room_delete(response) {
    var data = response.data;
    Room.remove({ _id: data.id }, function(err) {
        if (err) {
            return console.log("An error occurred while deleting room");
        }
        Room.find({}).lean().exec(function(err, rooms) {
            var res = {
                'type': 'rooms',
                'data': rooms
            };
            wss.broadcast(JSON.stringify(res));
        });
    });
}
