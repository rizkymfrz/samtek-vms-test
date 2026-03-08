const { Server } = require("socket.io");

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  io.on("connection", (socket) => {
    console.log(`[INFO] new websocket client connected (${socket.id})`);
    socket.on("disconnect", (reason) => {
      console.log(
        `[INFO] websocket client disconnected (${socket.id}): ${reason}`,
      );
    });
  });
  return io;
}

function getIO() {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized. Call initSocket() first.",
    );
  }
  return io;
}

module.exports = { initSocket, getIO };
