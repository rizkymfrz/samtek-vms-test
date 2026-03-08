import threading
import requests
from config import BACKEND_URL, ENABLE_LOGGING

class EventSender:
    def __init__(self, backend_url=BACKEND_URL):
        self.backend_url = backend_url

    def send(self, event):
        thread = threading.Thread(target=self._post, args=(event,), daemon=True)
        thread.start()

    def _post(self, event):
        try:
            response = requests.post(self.backend_url, json=event, timeout=3)
            if ENABLE_LOGGING:
                print(f"[INFO] event sent to backend (status {response.status_code})")
        except requests.exceptions.RequestException as e:
            if ENABLE_LOGGING:
                print(f"[WARNING] failed to send event: {e}")
