import os
VIDEO_SOURCE = os.environ.get("VIDEO_SOURCE", "rtsp://localhost:8554/live")
MODEL_PATH = os.environ.get("MODEL_PATH", "yolov8n.pt")
LINE_Y = int(os.environ.get("LINE_Y", "400"))
TARGET_CLASSES = {
    2: "mobil",
    3: "motor",
    5: "bus",
    7: "truk",
}
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:5000/events")
SNAPSHOT_DIR = os.environ.get("SNAPSHOT_DIR", "snapshots/")
FRAME_SKIP = int(os.environ.get("FRAME_SKIP", "2"))
CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", "0.1"))
ENABLE_SNAPSHOT = True
ENABLE_LOGGING = False
DISPLAY_DEBUG = False
