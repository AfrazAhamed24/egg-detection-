import asyncio
import os
import sys
from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.camera_service import CameraService

DEBUG = os.environ.get("EGG_DEBUG", "1") == "1"
HOST = os.environ.get("EGG_HOST", "127.0.0.1")
PORT = int(os.environ.get("EGG_PORT", "8000"))
CORS_ORIGINS = os.environ.get(
    "EGG_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

CAMERA_INDEX = int(os.environ.get("EGG_CAMERA_INDEX", "0"))
SNAPSHOT_INTERVAL_S = 0.12  # websocket ~8 updates/sec

app = FastAPI(title="Egg Inspection API", version="0.2.0")

camera_service = CameraService(camera_index=CAMERA_INDEX)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in CORS_ORIGINS if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MJPEG_BOUNDARY = "frame"


def _placeholder_jpeg(text: str = "Camera offline") -> bytes:
    frame = cv2.imread(str(Path(__file__).resolve().parents[2] / "data" / "offline_bg.jpg"))
    if frame is None:
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
    frame = cv2.putText(
        frame,
        text,
        (20, frame.shape[0] // 2),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (255, 255, 255),
        2,
        cv2.LINE_AA,
    )
    ok, jpeg = cv2.imencode(".jpg", frame)
    return jpeg.tobytes() if ok else b""


def _mjpeg_payload(jpeg: bytes) -> bytes:
    return b"--" + MJPEG_BOUNDARY.encode() + b"\r\n" + (
        f"Content-Type: image/jpeg\r\nContent-Length: {len(jpeg)}\r\n\r\n"
    ).encode() + jpeg + b"\r\n"


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "debug": DEBUG}


@app.get("/api/status")
def api_status() -> dict:
    snap = camera_service.snapshot()
    return {
        "running": snap["running"],
        "total_eggs": snap["total_eggs"],
        "normal_eggs": snap["normal_eggs"],
        "cracked_eggs": snap["cracked_eggs"],
        "fps": snap["fps"],
        "active_tracks": snap["active_tracks"],
        "error": snap["error"],
    }


@app.get("/api/camera/status")
def camera_status() -> dict:
    return camera_service.status


@app.post("/api/camera/start")
def camera_start() -> dict:
    return camera_service.start()


@app.post("/api/camera/stop")
def camera_stop() -> dict:
    return camera_service.stop()


@app.post("/api/inspection/reset")
def inspection_reset() -> dict:
    return camera_service.reset()


async def _mjpeg_iter():
    placeholders = 0
    while True:
        jpeg = camera_service.latest_jpeg_bytes()
        if jpeg is None:
            if placeholders % 30 == 0:
                yield _mjpeg_payload(_placeholder_jpeg())
            placeholders += 1
            await asyncio.sleep(0.1)
            continue
        placeholders = 0
        yield _mjpeg_payload(jpeg)
        await asyncio.sleep(0.03)


@app.get("/api/video")
async def api_video() -> StreamingResponse:
    return StreamingResponse(
        _mjpeg_iter(),
        media_type=f"multipart/x-mixed-replace; boundary={MJPEG_BOUNDARY}",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:
    await ws.accept()
    try:
        while True:
            snap = camera_service.snapshot()
            await ws.send_json(
                {
                    "type": "inspection_update",
                    "running": snap["running"],
                    "total_eggs": snap["total_eggs"],
                    "normal_eggs": snap["normal_eggs"],
                    "cracked_eggs": snap["cracked_eggs"],
                    "fps": snap["fps"],
                    "active_tracks": snap["active_tracks"],
                    "error": snap["error"],
                }
            )
            await asyncio.sleep(SNAPSHOT_INTERVAL_S)
    except WebSocketDisconnect:
        return


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)