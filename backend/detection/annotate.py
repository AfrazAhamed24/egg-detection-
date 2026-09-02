import cv2

FONT = cv2.FONT_HERSHEY_SIMPLEX
TEXT_THICKNESS = 1
BOX_THICKNESS = 2
LABEL_PAD = 4
LABEL_BG = (25, 25, 25)
NORMAL_COLOR = (60, 200, 60)
CRACKED_COLOR = (60, 60, 255)
LINE_COLOR = (255, 255, 0)
FPS_COLOR = (255, 255, 0)


def _rects_overlap(a: tuple, b: tuple) -> bool:
    (ax1, ay1, ax2, ay2), (bx1, by1, bx2, by2) = a, b
    return not (ax2 <= bx1 or bx2 <= ax1 or ay2 <= by1 or by2 <= ay1)


def _draw_track_label(frame, state, color, placed) -> None:
    x1, y1, x2, y2 = state.bbox
    frame_w = frame.shape[1]
    lines = [
        f"ID: #{state.track_id:02d}",
        state.status.upper(),
        f"{state.confidence * 100:.0f}%",
    ]
    line_h = 15
    bw = max(len(lines[i]) for i in range(len(lines))) * 8 + 2 * LABEL_PAD
    bh = line_h * len(lines) + LABEL_PAD * 2
    cx = max(1, min(x1, frame_w - bw - 1))
    cy = y1 - bh - 4 if y1 - bh - 4 >= 1 else y1 + 4
    while cy > 1:
        if not any(_rects_overlap((cx, cy, cx + bw, cy + bh), p) for p in placed):
            break
        cy -= max(1, bh // 2)
    if cy < 1:
        cy = 1
    placed.append((cx, cy, cx + bw, cy + bh))
    cv2.rectangle(frame, (cx, cy), (cx + bw, cy + bh), LABEL_BG, -1)
    cv2.rectangle(frame, (cx, cy), (cx + bw, cy + bh), color, 1)
    for i, text in enumerate(lines):
        cv2.putText(
            frame,
            text,
            (cx + LABEL_PAD, cy + LABEL_PAD + line_h // 2 + 5 + i * line_h),
            FONT,
            0.45,
            (255, 255, 255),
            TEXT_THICKNESS,
            cv2.LINE_AA,
        )


def draw_frame(frame, states, counter, fps: float, line_y_fraction: float = 0.75):
    frame_h, frame_w = frame.shape[:2]
    line_y = int(frame_h * line_y_fraction)
    cv2.line(frame, (0, line_y), (frame_w, line_y), LINE_COLOR, 1)

    placed: list[tuple] = []
    for state in states:
        if state.bbox is None:
            continue
        color = CRACKED_COLOR if state.status == "cracked" else NORMAL_COLOR
        x1, y1, x2, y2 = state.bbox
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, BOX_THICKNESS)
        _draw_track_label(frame, state, color, placed)

    stats = counter.stats
    panel_lines = [
        f"TOTAL: {stats['total_eggs']}",
        f"CRACKED: {stats['cracked_eggs']}",
        f"NORMAL: {stats['normal_eggs']}",
        f"FPS: {fps:.1f}",
    ]
    panel_w = 130
    panel_h = 22 * len(panel_lines) + 8
    cv2.rectangle(frame, (4, 4), (4 + panel_w, 4 + panel_h), LABEL_BG, -1)
    for i, text in enumerate(panel_lines):
        cv2.putText(
            frame,
            text,
            (12, 26 + i * 22),
            FONT,
            0.55,
            FPS_COLOR,
            1,
            cv2.LINE_AA,
        )
    return frame