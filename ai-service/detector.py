from ultralytics import YOLO
from config import TARGET_CLASSES, CONFIDENCE_THRESHOLD, ENABLE_LOGGING

class VehicleDetector:
    def __init__(self, model_path):
        self.model = YOLO(model_path)
        if ENABLE_LOGGING:
            print(f"[INFO] model loaded: {model_path}")

    def detect(self, frame):
        results = self.model(frame, verbose=False)
        detections = []
        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue
            for box in boxes:
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                if class_id not in TARGET_CLASSES:
                    continue
                if confidence < CONFIDENCE_THRESHOLD:
                    continue
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                center_x = (x1 + x2) / 2
                center_y = (y1 + y2) / 2
                class_name = TARGET_CLASSES[class_id]
                detection = {
                    "class": class_name,
                    "confidence": round(confidence, 2),
                    "bbox": [int(x1), int(y1), int(x2), int(y2)],
                    "center_x": center_x,
                    "center_y": center_y,
                }
                detections.append(detection)
                if ENABLE_LOGGING:
                    print(f"[INFO] vehicle detected: {class_name} ({confidence:.2f})")
        return detections
