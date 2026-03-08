require("dotenv").config();

const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 5000,
  frontendUrls: (process.env.FRONTEND_URL || "http://localhost:3000")
    .split(",")
    .map((url) => url.trim()),
  vapid: {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT,
  },
};

if (!config.vapid.publicKey || !config.vapid.privateKey) {
  console.warn(
    "[WARN] VAPID keys not fully configured in environment. Push notifications will not work.",
  );
}

module.exports = config;
