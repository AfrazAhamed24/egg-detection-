import sys
import time
from pathlib import Path

import cv2

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from detection.annotate import draw_frame
from detection.counter import EggCounter, build_status_mapping
from detection.model import CONFIDENCE_THRESHOLD, get_device, get_model, track

CAMERA_INDEX = 0
WINDOW_NAME = "Egg Detection"
QUIT_KEYS = ("q", "Q")


def main() -> None:
    get_model()
    print(f"Egg detector loaded. Class names: {get_model().names}")
    print(f"Inference device: {get_device()}")
    print(f"Confidence threshold: {CONFIDENCE_THRESHOLD}")

    status_map = build_status_mapping(get_model().names)
    counter = EggCounter()

    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        raise RuntimeError(
            f"Webcam could not be opened (index {CAMERA_INDEX}). "
            "Check that a camera is connected and not in use by another application."
        )

    cv2.namedWindow(WINDOW_NAME)
    prev_time = time.perf_counter()
    fps = 0.0

    while True:
        ok, frame = cap.read()
        if not ok or frame is None:
            raise RuntimeError("Failed to read a frame from the webcam.")

        frame_h, frame_w = frame.shape[:2]
        detections = track(frame)
        states = counter.update(detections, frame_h, status_map)

        now = time.perf_counter()
        fps = 0.9 * fps + 0.1 * (1.0 / (now - prev_time))
        prev_time = now

        frame = draw_frame(frame, states, counter, fps, counter.line_y_fraction)

        cv2.imshow(WINDOW_NAME, frame)
        if cv2.waitKey(1) & 0xFF in (ord(k) for k in QUIT_KEYS):
            break

    cap.release()
    cv2.destroyAllWindows()
    print("Webcam closed.")
    print(f"Final stats: {counter.stats}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"[ERROR] {exc}")
        sys.exit(1)