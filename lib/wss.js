var WebSocket = require('ws');
var Room = require('../models/room')
var Account = require('../models/account')
var config = require('../config/config.json')

/*
 * Communication packets between client and server:
 *
 * Valid types for server->client: config, raw, users, rooms
 * Valid types for client->server: room_create, room_update, room_delete
 */

var wss = new WebSocket.Server({
    perMessageDeflate: false,
    port: 1234,
    path: '/map/wss'
});

exports.user_broadcast = user_broadcast;

var functions = {
    'room_create': room_create,
    'room_update': room_update,
    'room_delete': room_delete,
    'room_request': room_request,
    'user_request': user_request,
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
            functions[response.type](response, ws);
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
        roomID: data.roomid,
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
    Room.update({ _id: data.id }, { name: data.name, roomID: data.roomid }, function(err, numberAffected, rawResponse) {
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

function room_request(response, ws) {
    Room.find({}).lean().exec(function(err, rooms) {
        var res = {
            'type': 'rooms',
            'data': rooms
        };
        ws.send(JSON.stringify(res));
    });
}

function user_request(response, ws) {
    Account.find({}).lean().exec(function(err, users) {
        for (var user of users) {
            delete user._id;
            delete user.role;
        }
        var res = {
            'type': 'users',
            'data': users
        };
        ws.send(JSON.stringify(res));
    });
}

function user_broadcast() {
    Account.find({}).lean().exec(function(err, users) {
        for (var user of users) {
            delete user._id;
            delete user.role;
        }
        var res = {
            'type': 'users',
            'data': users
        };
        wss.broadcast(JSON.stringify(res));
    });
}
