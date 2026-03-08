const { v4: uuidv4 } = require("uuid");
const { addEvent, getEvents } = require("../store/eventStore");
const { validateEventPayload } = require("../validators/event.validator");

function processEvent(payload) {
  const validation = validateEventPayload(payload);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.message || validation.error.issues,
    };
  }
  const parsedData = validation.data;

  if (parsedData.image) {
    parsedData.image = `http://localhost:5000/snapshots/${parsedData.image}`;
  }

  const event = {
    id: uuidv4(),
    ...parsedData,
    created_at: new Date().toISOString(),
  };
  addEvent(event);
  return { success: true, event };
}

function getRecentEvents(limit = 50) {
  return getEvents(limit);
}

module.exports = { processEvent, getRecentEvents };
