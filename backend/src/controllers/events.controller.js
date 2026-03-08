const { processEvent, getRecentEvents } = require("../services/event.service");
const { getIO } = require("../websocket/socket");
const logger = require("../utils/logger");
const {
  sendCrossingNotification,
} = require("../services/notification.service");

function createEvent(req, res) {
  const payload = req.body;
  if (payload.type === "detections") {
    return handleDetectionStream(payload, res);
  }
  return handleCrossingEvent(payload, res);
}

function handleDetectionStream(payload, res) {
  try {
    const io = getIO();
    io.emit("detections", {
      frame_width: payload.frame_width,
      frame_height: payload.frame_height,
      objects: payload.objects || [],
    });
  } catch (err) {
    logger.error(`[WS] Detection broadcast failed: ${err.message}`);
  }
  return res.status(200).json({ status: "ok" });
}

function handleCrossingEvent(payload, res) {
  const result = processEvent(payload);
  if (!result.success) {
    logger.warn(`Invalid event payload: ${result.error}`);
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      details: result.error,
    });
  }
  const { event } = result;
  logger.info(`Crossing event: ${event.vehicle} (${event.confidence})`);
  try {
    const io = getIO();
    io.emit("vehicle_event", event);
  } catch (err) {
    logger.error(`[WS] Event broadcast failed: ${err.message}`);
  }
  sendCrossingNotification(event).catch((err) => {
    logger.error(`Push notification failed: ${err.message}`);
  });
  return res.status(200).json({ status: "ok" });
}

function listEvents(req, res) {
  const limit = parseInt(req.query.limit, 10) || 50;
  const events = getRecentEvents(limit);
  return res.status(200).json(events);
}

function healthCheck(req, res) {
  return res.status(200).json({ status: "ok" });
}

module.exports = { createEvent, listEvents, healthCheck };
