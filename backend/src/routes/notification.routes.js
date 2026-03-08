const { Router } = require("express");
const { subscribeToTopic } = require("../services/fcm.service");

const router = Router();

router.post("/notifications/subscribe", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({
      status: "error",
      message: "FCM token is required",
    });
  }
  const result = await subscribeToTopic(token, "vehicle-alerts");
  if (result) {
    return res.status(200).json({ status: "ok" });
  } else {
    return res
      .status(500)
      .json({ status: "error", message: "Failed to subscribe to topic" });
  }
});

module.exports = router;
