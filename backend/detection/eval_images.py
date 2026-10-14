import json
import sys
from pathlib import Path

import cv2

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from detection.counter import build_status_mapping
from detection.model import CONFIDENCE_THRESHOLD, get_model, predict


def annotate(frame, detections, status_map):
    for det in detections:
        x1, y1, x2, y2 = det["bounding_box"]
        status = status_map.get(det["class_id"], "normal")
        color = (0, 0, 255) if status == "cracked" else (0, 200, 0)
        label = f"{status}:{det['confidence']:.2f}"
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        cv2.putText(frame, label, (x1, max(20, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2, cv2.LINE_AA)
    return frame


def main() -> int:
    if len(sys.argv) < 3:
        print("Usage: python -m detection.eval_images <output_dir> <image1> [<image2> ...]", file=sys.stderr)
        return 1

    output_dir = Path(sys.argv[1]).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    model = get_model()
    status_map = build_status_mapping(model.names)
    report = []

    for raw_path in sys.argv[2:]:
        image_path = Path(raw_path).resolve()
        frame = cv2.imread(str(image_path))
        if frame is None:
            report.append({"image": str(image_path), "error": "failed to load"})
            continue

        detections = predict(frame, conf=CONFIDENCE_THRESHOLD)
        cracked = sum(1 for det in detections if status_map.get(det["class_id"], "normal") == "cracked")
        normal = sum(1 for det in detections if status_map.get(det["class_id"], "normal") == "normal")

        annotated = annotate(frame.copy(), detections, status_map)
        output_path = output_dir / f"annotated_{image_path.stem}.jpg"
        cv2.imwrite(str(output_path), annotated)

        report.append(
            {
                "image": str(image_path),
                "annotated_image": str(output_path),
                "total_detections": len(detections),
                "cracked_count": cracked,
                "normal_count": normal,
                "detections": detections,
            }
        )

    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
