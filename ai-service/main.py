import cv2
import numpy as np
import time
from config import VIDEO_SOURCE, MODEL_PATH, LINE_Y, FRAME_SKIP, DISPLAY_DEBUG, ENABLE_LOGGING
from detector import VehicleDetector
from line_counter import LineCrossingCounter
from event_sender import EventSender
from stream_reader import VideoStream

def draw_corners(frame, x1, y1, x2, y2, color, length=20, thickness=2):
    cv2.line(frame, (x1, y1), (x1 + length, y1), color, thickness)
    cv2.line(frame, (x1, y1), (x1, y1 + length), color, thickness)
    cv2.line(frame, (x2, y1), (x2 - length, y1), color, thickness)
    cv2.line(frame, (x2, y1), (x2, y1 + length), color, thickness)
    cv2.line(frame, (x1, y2), (x1 + length, y2), color, thickness)
    cv2.line(frame, (x1, y2), (x1, y2 - length), color, thickness)
    cv2.line(frame, (x2, y2), (x2 - length, y2), color, thickness)
    cv2.line(frame, (x2, y2), (x2, y2 - length), color, thickness)


def draw_debug(frame, detections, line_y, vehicle_count, frame_count=0):
    h, w = frame.shape[:2]
    overlay = frame.copy()
    dash_len = 20
    gap_len = 15
    x = 0
    while x < w:
        cv2.line(overlay, (x, line_y), (min(x + dash_len, w), line_y), (0, 255, 180), 1)
        x += dash_len + gap_len
    cv2.line(overlay, (0, line_y), (w, line_y), (0, 255, 180), 3)
    cv2.addWeighted(overlay, 0.3, frame, 0.7, 0, frame)
    cv2.line(frame, (0, line_y), (w, line_y), (0, 255, 180), 1)
    cv2.putText(frame, "SCAN LINE", (w - 140, line_y - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 180), 1, cv2.LINE_AA)
    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        conf = det["confidence"]
        cls = det["class"]
        if cls == "truk":
            color = (0, 80, 255)
            accent = (0, 120, 255)
        else:
            color = (255, 200, 0)
            accent = (255, 230, 80)
        fill_overlay = frame.copy()
        cv2.rectangle(fill_overlay, (x1, y1), (x2, y2), color, -1)
        cv2.addWeighted(fill_overlay, 0.08, frame, 0.92, 0, frame)
        box_w = x2 - x1
        box_h = y2 - y1
        corner_len = max(12, min(box_w, box_h) // 4)
        draw_corners(frame, x1, y1, x2, y2, color, corner_len, 2)
        label = f"{cls.upper()} {conf}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        cv2.rectangle(frame, (x1, y1 - th - 10), (x1 + tw + 8, y1 - 2), color, -1)
        cv2.putText(frame, label, (x1 + 4, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1, cv2.LINE_AA)
    hud_h = 50
    hud_overlay = frame.copy()
    cv2.rectangle(hud_overlay, (0, 0), (280, hud_h), (0, 0, 0), -1)
    cv2.addWeighted(hud_overlay, 0.6, frame, 0.4, 0, frame)
    cv2.line(frame, (0, hud_h), (280, hud_h), (0, 255, 180), 1)
    cv2.putText(frame, "SAMTEK AI", (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 180), 1, cv2.LINE_AA)
    cv2.putText(frame, f"VEHICLES: {vehicle_count}", (10, 42), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(frame, "LIVE", (200, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 255), 1, cv2.LINE_AA)
    return frame

def main():
    if ENABLE_LOGGING:
        print("[INFO] initializing AI Detection Service...")
    detector = VehicleDetector(MODEL_PATH)
    sender = EventSender()
    cap = VideoStream(VIDEO_SOURCE).start()
    time.sleep(1.0)
    first_frame = cap.read()
    if first_frame is None:
        print(f"[ERROR] cannot read from video source: {VIDEO_SOURCE}")
        cap.stop()
        return
    dynamic_line_y = first_frame.shape[0] // 2
    counter = LineCrossingCounter(dynamic_line_y)
    if ENABLE_LOGGING:
        print(f"[INFO] video source opened: {VIDEO_SOURCE}")
        print(f"[INFO] virtual line at y={dynamic_line_y} (Auto-centered)")
        print(f"[INFO] frame skip: {FRAME_SKIP}")
        print(f"[INFO] debug display: {'ON' if DISPLAY_DEBUG else 'OFF'}")
        print("[INFO] processing started... (press 'q' or Ctrl+C to quit)")
    frame_count = 0
    detections = []
    try:
        while True:
            frame = cap.read()
            if frame is None:
                time.sleep(0.1)
                continue
            frame = frame.copy()
            frame_count += 1
            if frame_count % FRAME_SKIP == 0:
                detections = detector.detect(frame)
                sender.send({
                    "type": "detections",
                    "frame_width": frame.shape[1],
                    "frame_height": frame.shape[0],
                    "objects": detections,
                })
                crossing_events = counter.update(detections, frame)
                for event in crossing_events:
                    sender.send(event)
            if DISPLAY_DEBUG:
                debug_frame = draw_debug(frame.copy(), detections, dynamic_line_y, counter.vehicle_count)
                cv2.imshow("AI Detection Service", debug_frame)
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    if ENABLE_LOGGING:
                        print("[INFO] quit signal received")
                    break
    except KeyboardInterrupt:
        if ENABLE_LOGGING:
            print("\n[INFO] KeyboardInterrupt received. Shutting down gracefully...")
    cap.stop()
    if DISPLAY_DEBUG:
        cv2.destroyAllWindows()
    if ENABLE_LOGGING:
        print(f"\n[INFO] === SUMMARY ===")
        print(f"[INFO] total frames processed: {frame_count}")
        print(f"[INFO] total vehicles counted: {counter.vehicle_count}")
        print("[INFO] service stopped")

if __name__ == "__main__":
    main()
