const { Router } = require("express");
const {
  createEvent,
  listEvents,
  healthCheck,
} = require("../controllers/events.controller");

const router = Router();

router.post("/events", createEvent);
router.get("/events", listEvents);
router.get("/health", healthCheck);

module.exports = router;
