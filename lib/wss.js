var WebSocket = require('ws');

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
  ws.send("Ping");

  ws.on('message', function(data, flags) {
    ws.send(data);
  });

  ws.on('close', function(code, reason) {
    console.log('Client disconnected from WebSocket.');
  });
});
