# Egg Inspection System

Real-time egg inspection using computer vision. The project is built step-by-step.

## Architecture

```
egg-inspection/
├── frontend/   # React + Vite + TypeScript + Tailwind CSS
├── backend/    # Python + FastAPI + OpenCV + Ultralytics YOLO
├── models/     # Trained YOLO model weights (.pt)
└── data/       # Datasets / captured frames
```

Frontend and backend are independent. They are developed and run separately.

## Prerequisites

- Node.js (v18+)
- npm
- Python 3.10+

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server starts at http://localhost:5173.

### Build / Preview

```bash
npm run build
npm run preview
```

## Backend

Create and activate a virtual environment:

```bash
cd backend
python -m venv .venv
```

- Windows (PowerShell): `.venv\\Scripts\\Activate.ps1`
- macOS / Linux: `source .venv/bin/activate`

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the server:

```bash
uvicorn app.main:app --reload
```

The API runs at http://localhost:8000.

### Test the API

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

Interactive API docs are available at http://localhost:8000/docs.

## Status

- [x] Step 1: Project foundation (frontend + backend boilerplate, /health endpoint)
- [ ] Step 2: Egg detection with YOLO
- [ ] Step 3: Real-time camera pipeline
- [ ] Step 4: Dashboard UI