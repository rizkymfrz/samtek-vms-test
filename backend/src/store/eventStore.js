const MAX_EVENTS = 100;
const events = [];

function addEvent(event) {
  events.push(event);
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
}

function getEvents(limit = 50) {
  return events.slice(-limit).reverse();
}

function getEventById(id) {
  return events.find((e) => e.id === id) || null;
}

module.exports = { addEvent, getEvents, getEventById };
