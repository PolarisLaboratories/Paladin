class PaladinWebSocket {
    constructor(address) {
        this.ws = new WebSocket(address);
        this.ws.onmessage = this.ws_handler;
    }
    ws_handler(event) {
        console.log(event.data);
    }
    write(data) {
        this.ws.send(data);
    }
}
