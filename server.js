import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

// Handle WebSocket connections
// 0: Connecting
// 1: OPEN (where we can use .send())
// 2: CLOSING
// 3: CLOSED
wss.on("connection", (socket, request) => {
    const ip = request.socket.remoteAddress;
    console.log("Client connected from IP:", ip );

    socket.on("message", (rawData) => {
        const data = rawData.toString();
        console.log("Received message:", data);

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }      
    });
});

    socket.on('error', (error) => {
        console.error('WebSocket error: ${error}: ${ip}');
    })
    
    socket.on('close', () => {
        console.log('Client disconnected:', ip);
    })
}); 

console.log("WebSocket server is running on ws://localhost:8080");