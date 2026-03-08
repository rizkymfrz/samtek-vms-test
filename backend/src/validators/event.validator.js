const { z } = require("zod");

const detectionObjectSchema = z.object({
  class: z.string(),
  confidence: z.number().min(0).max(1),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  center_x: z.number().optional(),
  center_y: z.number().optional(),
});
const detectionStreamSchema = z.object({
  type: z.literal("detections"),
  frame_width: z.number().positive(),
  frame_height: z.number().positive(),
  objects: z.array(detectionObjectSchema).default([]),
});
const crossingEventSchema = z.object({
  type: z.literal("vehicle_crossing"),
  vehicle: z.string().min(1),
  confidence: z.number().min(0).max(1),
  timestamp: z.string().datetime(),
  image: z.string().optional(),
  is_special_event: z.boolean().default(false),
});

function validateEventPayload(payload) {
  if (payload.type === "detections") {
    return detectionStreamSchema.safeParse(payload);
  }
  if (payload.type === "vehicle_crossing" || !payload.type) {
    const eventToParse = { ...payload, type: "vehicle_crossing" };
    return crossingEventSchema.safeParse(eventToParse);
  }
  return {
    success: false,
    error: new Error(`Unknown event type: ${payload.type}`),
  };
}

module.exports = {
  validateEventPayload,
};
