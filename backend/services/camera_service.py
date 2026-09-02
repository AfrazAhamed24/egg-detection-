import sys
import threading
import time
from pathlib import Path

import cv2

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from detection.annotate import draw_frame
from detection.counter import EggCounter, build_status_mapping
from detection.model import CONFIDENCE_THRESHOLD, get_model, track

CAMERA_RECONNECT_ATTEMPTS = 3
RECONNECT_DELAY_S = 0.5
MAX_READ_FAILURES = 5
FPS_SMOOTHING = 0.1


class CameraService:
    """Owns the webcam + YOLO + counter pipeline in a single background thread.

    Exactly one inference loop runs at a time; the rest of the app consumes the
    latest annotated JPEG and statistics snapshot exposed by this service.
    """

    def __init__(self, camera_index: int = 0, line_y_fraction: float = 0.75) -> None:
        self._camera_index = camera_index
        self._line_y_fraction = line_y_fraction

        self._lock = threading.RLock()
        self._stop_event = threading.Event()
        self._thread: threading.Thread | None = None
        self._cap: cv2.VideoCapture | None = None

        self._running = False
        self._error: str | None = None
        self._status_map: dict[int, str] = {}
        self._counter = EggCounter(line_y_fraction=line_y_fraction)
        self._fps = 0.0
        self._active_tracks = 0
        self._latest_jpeg: bytes | None = None

    # ------------------------------------------------------------------ state
    @property
    def status(self) -> dict:
        with self._lock:
            return {"running": self._running, "camera": self._camera_index}

    def snapshot(self) -> dict:
        with self._lock:
            stats = self._counter.stats
            return {
                "running": self._running,
                "total_eggs": stats["total_eggs"],
                "normal_eggs": stats["normal_eggs"],
                "cracked_eggs": stats["cracked_eggs"],
                "fps": round(self._fps, 1),
                "active_tracks": self._active_tracks,
                "error": self._error,
            }

    def latest_jpeg_bytes(self) -> bytes | None:
        with self._lock:
            return self._latest_jpeg

    # ------------------------------------------------------------------ control
    def start(self) -> dict:
        with self._lock:
            if self._running:
                return self.status

            try:
                model = get_model()
                self._status_map = build_status_mapping(model.names)
            except Exception as exc:
                self._error = f"Model load failed: {exc}"
                return self.status

            self._error = None
            if not self._open_camera():
                return self.status

            # Begin a fresh counting session. ByteTrack may reuse track IDs
            # across a restart, and a stale "counted" flag would silently
            # suppress a new egg that received a recycled ID. A fresh counter
            # keeps "count exactly once" intact across stop -> start.
            self._counter = EggCounter(line_y_fraction=self._line_y_fraction)
            self._active_tracks = 0

            self._stop_event = threading.Event()
            self._running = True
            self._thread = threading.Thread(target=self._loop, name="camera-inspection", daemon=True)
            self._thread.start()
            return self.status

    def stop(self) -> dict:
        with self._lock:
            self._stop_event.set()
            thread, self._thread = self._thread, None
        if thread is not None and thread.is_alive():
            thread.join(timeout=5.0)
        return self.status

    def reset(self) -> dict:
        with self._lock:
            self._counter = EggCounter(line_y_fraction=self._line_y_fraction)
            self._active_tracks = 0
            return self.snapshot()

    # ------------------------------------------------------------------ internals
    def _open_camera(self) -> bool:
        attempts = CAMERA_RECONNECT_ATTEMPTS
        cap = None
        for attempt in range(1, attempts + 1):
            cap = cv2.VideoCapture(self._camera_index)
            if cap.isOpened():
                self._cap = cap
                return True
            cap.release()
            self._error = (
                f"Camera {self._camera_index} unavailable (attempt {attempt}/{attempts}). "
                "Ensure a webcam is connected and not in use by another application."
            )
            if attempt < attempts:
                time.sleep(RECONNECT_DELAY_S)
        self._cap = None
        return False

    def _loop(self) -> None:
        prev_time = time.perf_counter()
        fps = 0.0
        read_failures = 0
        try:
            while not self._stop_event.is_set():
                cap = self._cap
                if cap is None:
                    break
                ok, frame = cap.read()
                if not ok or frame is None:
                    read_failures += 1
                    if read_failures >= MAX_READ_FAILURES:
                        raise RuntimeError("Camera disconnected or frame read failed repeatedly.")
                    time.sleep(0.05)
                    continue
                read_failures = 0

                frame_h, frame_w = frame.shape[:2]
                detections = track(frame, conf=CONFIDENCE_THRESHOLD)
                states = self._counter.update(detections, frame_h, self._status_map)

                now = time.perf_counter()
                fps = FPS_SMOOTHING * (1.0 / (now - prev_time)) + (1.0 - FPS_SMOOTHING) * fps
                prev_time = now

                frame = draw_frame(frame, states, self._counter, fps, self._line_y_fraction)
                ok_enc, jpeg = cv2.imencode(".jpg", frame)
                if ok_enc:
                    with self._lock:
                        self._latest_jpeg = jpeg.tobytes()
                        self._fps = fps
                        self._active_tracks = len(self._counter.tracks)
        except Exception as exc:
            with self._lock:
                self._error = f"Camera pipeline error: {exc}"
        finally:
            with self._lock:
                self._running = False
                if self._cap is not None:
                    self._cap.release()
                    self._cap = None