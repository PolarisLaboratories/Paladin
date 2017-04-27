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
  console.log('Client connected to WebSocket API');

  ws.on('message', function(data, flags) {
    ws.send(data);
  });
});
