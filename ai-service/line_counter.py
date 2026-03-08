import os
import math
from datetime import datetime
import cv2
from config import LINE_Y, SNAPSHOT_DIR, ENABLE_SNAPSHOT, ENABLE_LOGGING

class LineCrossingCounter:
    def __init__(self, line_y=LINE_Y, max_distance=200, max_missed_frames=10):
        self.line_y = line_y
        self.max_distance = max_distance
        self.max_missed_frames = max_missed_frames
        self.tracked_objects = {}
        self.next_id = 0
        self.vehicle_count = 0
        os.makedirs(SNAPSHOT_DIR, exist_ok=True)

    def update(self, detections, frame):
        crossing_events = []
        used_ids = set()
        for det in detections:
            cx = det["center_x"]
            cy = det["center_y"]
            matched_id = self._find_nearest(cx, cy, used_ids)
            if matched_id is not None:
                obj = self.tracked_objects[matched_id]
                previous_y = obj["previous_y"]
                crossed_down = previous_y < self.line_y and cy >= self.line_y
                crossed_up = previous_y > self.line_y and cy <= self.line_y
                crossed = crossed_down or crossed_up
                if crossed and not obj["counted"]:
                    obj["counted"] = True
                    self.vehicle_count += 1
                    if ENABLE_LOGGING:
                        direction = "DOWN" if crossed_down else "UP"
                        print(f"[INFO] === CROSSING EVENT ===")
                        print(f"[INFO]   vehicle: {det['class']} (conf: {det['confidence']})")
                        print(f"[INFO]   direction: {direction}")
                        print(f"[INFO]   previous_y: {previous_y:.0f} -> current_y: {cy:.0f} (line: {self.line_y})")
                    is_special = det["class"] == "truk"
                    
                    snapshot_name = ""
                    if ENABLE_SNAPSHOT and is_special:
                        snapshot_name = self._save_snapshot(frame, prefix="truck_")
                        
                    event = {
                        "type": "vehicle_crossing",
                        "vehicle": det["class"],
                        "confidence": det["confidence"],
                        "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
                        "image": snapshot_name,
                        "is_special_event": is_special,
                    }
                    crossing_events.append(event)
                obj["previous_y"] = cy
                obj["center_x"] = cx
                obj["center_y"] = cy
                obj["missed"] = 0
                used_ids.add(matched_id)
            else:
                obj_id = self.next_id
                self.next_id += 1
                self.tracked_objects[obj_id] = {
                    "center_x": cx,
                    "center_y": cy,
                    "previous_y": cy,
                    "counted": False,
                    "missed": 0,
                }
                used_ids.add(obj_id)
        stale_ids = []
        for oid in self.tracked_objects:
            if oid not in used_ids:
                self.tracked_objects[oid]["missed"] += 1
                if self.tracked_objects[oid]["missed"] > self.max_missed_frames:
                    stale_ids.append(oid)
        for oid in stale_ids:
            del self.tracked_objects[oid]
        if ENABLE_LOGGING:
            total_tracked = len(self.tracked_objects)
            print(f"[DEBUG] detections={len(detections)} tracked={total_tracked} count={self.vehicle_count}")
        return crossing_events

    def _find_nearest(self, cx, cy, exclude_ids):
        best_id = None
        best_dist = float("inf")
        for obj_id, obj in self.tracked_objects.items():
            if obj_id in exclude_ids:
                continue
            dist = math.sqrt((cx - obj["center_x"]) ** 2 + (cy - obj["center_y"]) ** 2)
            if dist < best_dist and dist < self.max_distance:
                best_dist = dist
                best_id = obj_id
        return best_id

    def _save_snapshot(self, frame, prefix="snapshot_"):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{prefix}{timestamp}.jpg"
        filepath = os.path.join(SNAPSHOT_DIR, filename)
        cv2.imwrite(filepath, frame)
        if ENABLE_LOGGING:
            print(f"[INFO] snapshot saved: {filename}")
        return filename
