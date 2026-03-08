import cv2
import threading
import time

class VideoStream:
    def __init__(self, src=0, name="VideoStream"):
        self.src = src
        self.name = name
        self.stream = None
        self.stopped = True
        self.grabbed = False
        self.frame = None
        self.retry_interval = 2.0

    def start(self):
        self.stopped = False
        self._connect()
        self.thread = threading.Thread(target=self.update, name=self.name, args=())
        self.thread.daemon = True
        self.thread.start()
        return self

    def _connect(self):
        if self.stream:
            self.stream.release()
        print(f"[INFO] {self.name}: Connecting to source {self.src}...")
        self.stream = cv2.VideoCapture(self.src)
        self.stream.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        if not self.stream.isOpened():
            print(f"[WARN] {self.name}: Connection failed.")
            self.grabbed = False
            self.frame = None
            return False
        self.grabbed, self.frame = self.stream.read()
        if self.grabbed:
            print(f"[INFO] {self.name}: Connection successful.")
        else:
            print(f"[WARN] {self.name}: Connected but no frames received.")
        return self.grabbed

    def update(self):
        while not self.stopped:
            if self.stream is None or not self.stream.isOpened() or not self.grabbed:
                print(f"[WARN] {self.name}: Stream dropped. Reconnecting in {self.retry_interval}s...")
                time.sleep(self.retry_interval)
                self._connect()
                continue
            self.grabbed, frame = self.stream.read()
            if self.grabbed:
                self.frame = frame
            else:
                pass

    def read(self):
        return self.frame

    def stop(self):
        self.stopped = True
        if self.thread.is_alive():
            self.thread.join(timeout=2.0)
        if self.stream:
            self.stream.release()
            self.stream = None
        print(f"[INFO] {self.name}: Stopped.")
