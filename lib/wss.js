var WebSocket = require('ws');
var config = require('../config/config.json')

var wss = new WebSocket.Server({
    perMessageDeflate: false,
    port: 1234,
    path: '/api'
});

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

    ws.on('message', function(data, flags) {
        /*
         * For now we just echo the data back
         */
        var response = {
            'type': 'debug',
            'data': data,
        }
        ws.send(JSON.stringify(response));
    });

    ws.on('close', function(code, reason) {
        console.log('Client disconnected from WebSocket.');
    });
});
