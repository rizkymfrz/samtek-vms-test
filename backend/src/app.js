const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const config = require("./config");
const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const eventRoutes = require("./routes/events.routes");
const path = require("path");
const notificationRoutes = require("./routes/notification.routes");
const app = express();

app.use(
  "/snapshots",
  express.static(path.join(__dirname, "../../ai-service/snapshots")),
);

app.use(helmet());
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.http(message.trim()) },
  }),
);
app.use(
  cors({
    origin: config.frontendUrls,
    methods: ["GET", "POST", "OPTIONS"],
  }),
);
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: "error",
    message: "Too many requests, please try again later.",
  },
});

app.use("/", (req, res, next) => {
  if (req.path === "/events") return next();
  return limiter(req, res, next);
});
app.use("/", eventRoutes);
app.use("/", notificationRoutes);
app.use(errorHandler);

module.exports = app;
