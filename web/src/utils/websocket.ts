class WebSocketService {
  static instance: null | WebSocketService;
  ws: null | WebSocket;
  constructor() {
    this.ws = null;
  }

  static getInstance() {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect(url: string | URL) {
    if (!this.ws) {
      this.ws = new WebSocket(url);
      this.ws.onopen = () => console.log("WebSocket connected");
      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
        this.ws = null;
      };
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }

  sendMessage(message: string | ArrayBufferLike | Blob | ArrayBufferView<ArrayBufferLike>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    }
  }
}

export default WebSocketService;
