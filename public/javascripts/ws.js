class PaladinWebSocket {
    constructor(address) {
        this.ws = new WebSocket(address);
        this.ws.onmessage = this.handler;
        window.close = this.close;
    }
    handler(event) {
        console.log(event.data);
    }
    write(data) {
        this.ws.send(data);
    }
    close() {
        this.ws.close();
    }
}
