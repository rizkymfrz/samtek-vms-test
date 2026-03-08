const http = require("http");
const app = require("./app");
const config = require("./config");
const logger = require("./utils/logger");
const { initSocket } = require("./websocket/socket");

const PORT = config.port;
const server = http.createServer(app);

initSocket(server);

server.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT} in ${config.env} mode`);
});

const shutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info("HTTP server closed.");
    process.exit(0);
  });
  setTimeout(() => {
    logger.error(
      "Could not close connections in time, forcefully shutting down",
    );
    process.exit(1);
  }, 10000);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}\n${err.stack}`);
  process.exit(1);
});
