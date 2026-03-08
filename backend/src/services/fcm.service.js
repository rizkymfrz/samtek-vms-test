const admin = require("firebase-admin");
const path = require("path");
const logger = require("../utils/logger");

let messaging = null;

try {
  const serviceAccountPath = path.resolve(
    __dirname,
    "../config/firebase-service-account.json",
  );
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  messaging = admin.messaging();
  logger.info(
    "[FCM] Firebase Admin successfully initialized with service account",
  );
} catch (error) {
  logger.warn(
    `[FCM] Could not initialize Firebase Admin SDK. Push notifications will be disabled. Error: ${error.message}`,
  );
}

async function sendToTopic(topic, payload) {
  if (!messaging) {
    logger.warn("[FCM] Messaging is not configured, skipping notification");
    return false;
  }
  try {
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
        ...(payload.image && { image: payload.image }),
      },
      data: payload.data,
      topic: topic,
    };
    const response = await messaging.send(message);
    logger.info(
      `[FCM] Successfully sent message to topic '${topic}': ${response}`,
    );
    return true;
  } catch (error) {
    logger.error(
      `[FCM] Error sending message to topic '${topic}': ${error.message}`,
    );
    return false;
  }
}

async function subscribeToTopic(token, topic) {
  if (!messaging) {
    logger.warn(
      "[FCM] Messaging is not configured, skipping subscription but returning success to client",
    );
    return true;
  }
  try {
    const response = await messaging.subscribeToTopic(token, topic);
    logger.info(
      `[FCM] Successfully subscribed client to topic '${topic}':`,
      response,
    );
    return true;
  } catch (error) {
    logger.error(
      `[FCM] Error subscribing client to topic '${topic}': ${error.message}`,
    );
    return false;
  }
}

module.exports = {
  sendToTopic,
  subscribeToTopic,
};
