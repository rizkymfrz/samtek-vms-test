const { sendToTopic } = require("./fcm.service");
const logger = require("../utils/logger");

async function sendCrossingNotification(event) {
  if (!event.is_special_event) return;
  const payload = {
    title: `🚛 ${event.vehicle.toUpperCase()} Detected`,
    body: `Confidence: ${(event.confidence * 100).toFixed(0)}%`,
    image: event.image || undefined,
    data: {
      vehicle: event.vehicle,
      confidence: event.confidence.toString(),
      timestamp: event.timestamp,
      image: event.image || "",
    },
  };
  logger.info(`[INFO] Truck detected — sending notification`);
  const success = await sendToTopic("vehicle-alerts", payload);
  if (success) {
    logger.info(`[INFO] FCM notification sent`);
  } else {
    logger.error(`[ERROR] FCM send failed`);
  }
}

module.exports = {
  sendCrossingNotification,
};
