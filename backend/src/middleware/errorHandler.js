const logger = require("../utils/logger");

function errorHandler(err, req, res, next) {
  logger.error(`${err.name}: ${err.message}\n${err.stack}`);
  const isProd = process.env.NODE_ENV === "production";
  res.status(err.status || 500).json({
    status: "error",
    message: isProd ? "Internal Server Error" : err.message,
    ...(isProd ? {} : { stack: err.stack }),
  });
}

module.exports = errorHandler;
