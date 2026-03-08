const winston = require("winston");
const config = require("../config");

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};
const level = () => {
  const env = config.env || "development";
  const isDevelopment = env === "development";
  return isDevelopment ? "debug" : "info";
};
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] ${info.level}: ${info.message}`,
  ),
);
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
);
const transports = [
  new winston.transports.Console({
    format: config.env === "development" ? consoleFormat : fileFormat,
  }),
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
    format: fileFormat,
  }),
  new winston.transports.File({
    filename: "logs/all.log",
    format: fileFormat,
  }),
];
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

module.exports = logger;
