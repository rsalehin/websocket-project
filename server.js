// ---------------------------------------------------------------------
// Import the 'ws' library.
//   - WebSocketServer: the class we use to spin up a server that
//     listens for incoming WebSocket connections.
//   - WebSocket: imported here purely to access its static constants
//     (like WebSocket.OPEN) for comparing against a client's readyState.
//     We never construct a `new WebSocket()` on the server side — that's
//     a client-side concept. The server deals with the *sockets that
//     connect to it*, which are instances handed to us automatically.
// ---------------------------------------------------------------------
import { WebSocketServer, WebSocket } from "ws";

// Spin up the server and start listening on port 8080 immediately.
// Once this line runs, the server is live and accepting connections —
// there's no separate ".listen()" call needed like with plain http.
const wss = new WebSocketServer({ port: 8080 });

// ---------------------------------------------------------------------
// Reference: WebSocket readyState values (used throughout this file
// and on the client side too). Every socket — client or server-side —
// is always in exactly one of these four states:
//   0 = CONNECTING  (handshake in progress, not ready yet)
//   1 = OPEN         (fully connected, .send() is safe to call)
//   2 = CLOSING      (shutdown initiated, but not finished)
//   3 = CLOSED       (fully disconnected)
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// 'connection' event — fires once for EACH new client that successfully
// connects to this server. The callback receives two things:
//   socket  - this specific client's WebSocket instance (use this to
//             send/receive messages with THIS client only)
//   request - the raw HTTP request that was used to initiate the
//             WebSocket handshake (useful for reading headers, IP, etc.)
// ---------------------------------------------------------------------
wss.on("connection", (socket, request) => {

    // request.socket here refers to the underlying raw TCP socket
    // (not the WebSocket) that the HTTP request arrived on — that's
    // where low-level network info like remoteAddress lives.
    const ip = request.socket.remoteAddress;
    console.log("Client connected from IP:", ip);

    // -------------------------------------------------------------
    // 'message' event — fires every time THIS client sends data.
    // rawData arrives as a Buffer by default, so we call .toString()
    // to convert it into a normal JS string we can log/work with.
    // -------------------------------------------------------------
    socket.on("message", (rawData) => {
        const data = rawData.toString();
        console.log("Received message:", data);

        // ---------------------------------------------------------
        // Broadcast: relay this message out to EVERY currently
        // connected client (including the original sender) so
        // everyone's log stays in sync. wss.clients is a Set
        // containing all active WebSocket connections on this server.
        // ---------------------------------------------------------
        wss.clients.forEach((client) => {
            // Guard: only send to clients that are actually OPEN.
            // A client could be in the process of closing/closed,
            // and calling .send() on a non-open socket throws an error.
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    });

    // -------------------------------------------------------------
    // 'error' event — fires if something goes wrong with this
    // specific client's connection (e.g. malformed frames, abrupt
    // network failure). Logging it here prevents an unhandled
    // error from crashing the whole server process.
    //
    // NOTE: this must use backticks (`) to enable ${...} string
    // interpolation. Single quotes ('...') treat ${error} and ${ip}
    // as literal plain text rather than substituting their values.
    // -------------------------------------------------------------
    socket.on('error', (error) => {
        console.error(`WebSocket error: ${error}: ${ip}`);
    });

    // -------------------------------------------------------------
    // 'close' event — fires when this client disconnects, whether
    // intentionally (client called ws.close()) or due to a dropped
    // connection/timeout. No further messages will be received from
    // this socket after this fires.
    // -------------------------------------------------------------
    socket.on('close', () => {
        console.log('Client disconnected:', ip);
    });
});

// This runs once, immediately, right after the server starts
// listening — not per-connection. It's just a startup confirmation.
console.log("WebSocket server is running on ws://localhost:8080");