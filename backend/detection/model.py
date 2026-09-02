import os
from pathlib import Path

import torch
from ultralytics import YOLO

MODELS_DIR = Path(__file__).resolve().parents[2] / "models"
MODEL_NAME = os.environ.get("EGG_MODEL", "egg_crack.pt")
MODEL_PATH = MODELS_DIR / MODEL_NAME
CONFIDENCE_THRESHOLD = 0.50
IOU_THRESHOLD = 0.45

_model: YOLO | None = None
_device: str | None = None


def get_device() -> str:
    global _device
    if _device is None:
        _device = "cuda" if torch.cuda.is_available() else "cpu"
    return _device


def get_model() -> YOLO:
    global _model
    if _model is None:
        if not MODEL_PATH.is_file():
            raise FileNotFoundError(
                f"Egg detection model not found at {MODEL_PATH}. "
                "Place a YOLO .pt model in models/ or set EGG_MODEL to its filename "
                "(e.g. egg_detector.pt or egg_crack.pt)."
            )
        try:
            _model = YOLO(str(MODEL_PATH))
        except Exception as exc:
            raise RuntimeError(f"Failed to load YOLO model from {MODEL_PATH}: {exc}") from exc
    return _model


def get_class_names() -> dict[int, str]:
    return get_model().names


def predict(frame, conf: float = 0.25, iou: float = 0.45) -> list[dict]:
    model = get_model()
    results = model.predict(
        source=frame,
        device=get_device(),
        conf=conf,
        iou=iou,
        verbose=False,
    )
    detections: list[dict] = []
    for result in results:
        for box in result.boxes:
            x1, y1, x2, y2 = (int(v) for v in box.xyxy[0].tolist())
            detections.append(
                {
                    "class_id": int(box.cls[0].item()),
                    "class_name": model.names[int(box.cls[0].item())],
                    "confidence": float(box.conf[0].item()),
                    "bounding_box": (x1, y1, x2, y2),
                }
            )
    return detections


def track(frame, conf: float = CONFIDENCE_THRESHOLD, iou: float = IOU_THRESHOLD) -> list[dict]:
    model = get_model()
    results = model.track(
        source=frame,
        device=get_device(),
        conf=conf,
        iou=iou,
        persist=True,
        verbose=False,
    )
    detections: list[dict] = []
    for result in results:
        if result.boxes is None:
            continue
        for box in result.boxes:
            if box.id is None:
                continue
            x1, y1, x2, y2 = (int(v) for v in box.xyxy[0].tolist())
            detections.append(
                {
                    "track_id": int(box.id[0].item()),
                    "class_id": int(box.cls[0].item()),
                    "class_name": model.names[int(box.cls[0].item())],
                    "confidence": float(box.conf[0].item()),
                    "bounding_box": (x1, y1, x2, y2),
                }
            )
    return detections