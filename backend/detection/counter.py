from collections import defaultdict, deque

LINE_Y_FRACTION = 0.75
STATUS_VOTE_WINDOW = 10
# How many tracked frames a crossing has to finalize its status vote before the
# count is committed. Without this, the status at the exact crossing frame can
# be a majority that is not yet settled (e.g. an egg crossing during a run of
# "normal" votes and only resolving to "cracked" a few frames later), freezing
# the count into the wrong bucket. It must be at least STATUS_VOTE_WINDOW so a
# sustained true status can evict the pre-crossing votes from the sliding
# window and secure a majority before the count is frozen. Because a pending
# crossing is finalized on elapsed frames (not only when the egg is seen), a
# count is never dropped.
STATUS_SETTLE_FRAMES = STATUS_VOTE_WINDOW

# Stable-identification counting. A stationary egg is counted once after it has
# been occupied for STABLE_FRAMES, so "count when identified" works without it
# physically crossing the line. It must exceed STATUS_VOTE_WINDOW so the status
# vote is settled before the count commits.
STABLE_FRAMES = 15
# Spatial-grid cell size (px). Each detection's centroid quantizes into a cell;
# a cell represents one physical egg and counts at most once, so ByteTrack ID
# churn and bounding-box jitter on a stationary egg can never double-count it,
# while two distinct eggs in different cells each count once.
GRID_CELL = 140
# After a counted cell has been empty for this many frames it is treated as a
# vacated spot, so a genuinely new egg placed there later can be counted.
CELL_EXPIRY_FRAMES = 20
# Non-stationary (crossing) eggs also count, but only by committing once. See
# the crossing path in `update`.

CRACKED_KEYWORDS = ("broken", "cracked", "crack")


def build_status_mapping(class_names: dict[int, str]) -> dict[int, str]:
    mapping: dict[int, str] = {}
    for class_id, name in class_names.items():
        lowered = name.lower()
        if any(keyword in lowered for keyword in CRACKED_KEYWORDS):
            mapping[class_id] = "cracked"
        else:
            mapping[class_id] = "normal"
    return mapping


class TrackState:
    __slots__ = (
        "track_id",
        "status_votes",
        "counted",
        "prev_side",
        "bbox",
        "class_name",
        "confidence",
        "status",
        "pending",
        "settle_remaining",
        "cell",
    )

    def __init__(self, track_id: int) -> None:
        self.track_id = track_id
        self.status_votes: deque[str] = deque(maxlen=STATUS_VOTE_WINDOW)
        self.counted = False
        self.prev_side: str | None = None
        self.bbox: tuple[int, int, int, int] | None = None
        self.class_name = ""
        self.confidence = 0.0
        self.status = "normal"
        self.pending = False
        self.settle_remaining = 0
        self.cell: tuple[int, int] | None = None


class EggCounter:
    def __init__(self, line_y_fraction: float = LINE_Y_FRACTION) -> None:
        self.line_y_fraction = line_y_fraction
        self.tracks: dict[int, TrackState] = {}
        self.total_eggs = 0
        self.normal_eggs = 0
        self.cracked_eggs = 0
        # Global frame counter and spatial occupancy, decoupled from track IDs
        # so ByteTrack ID churn / bbox jitter on a stationary egg can never
        # double-count the same physical egg.
        self._frame = 0
        self._cells: dict[tuple[int, int], int] = {}
        self._cell_status: dict[tuple[int, int], deque] = {}
        # cell -> last_occupied_frame. A counted cell is released only after it
        # has been genuinely empty for CELL_EXPIRY_FRAMES, and is refreshed
        # every frame its egg remains present, so a stationary egg is counted
        # exactly once and never re-counted while still in view.
        self._counted_cells: dict[tuple[int, int], int] = {}

    @property
    def stats(self) -> dict:
        return {
            "total_eggs": self.total_eggs,
            "normal_eggs": self.normal_eggs,
            "cracked_eggs": self.cracked_eggs,
        }

    def _centroid(self, bbox: tuple[int, int, int, int]) -> tuple[int, int]:
        x1, y1, x2, y2 = bbox
        return ((x1 + x2) // 2, (y1 + y2) // 2)

    def _side(self, cy: int, line_y: int) -> str:
        return "above" if cy <= line_y else "below"

    def _cell_of(self, cx: int, cy: int) -> tuple[int, int]:
        return (cx // GRID_CELL, cy // GRID_CELL)

    def _settled_status(self, votes: deque) -> str:
        counts = defaultdict(int)
        for vote in votes:
            counts[vote] += 1
        return max(counts, key=counts.get)

    def _commit_cell(self, cell: tuple[int, int], status: str, state: TrackState | None = None) -> None:
        self.total_eggs += 1
        if status == "cracked":
            self.cracked_eggs += 1
        else:
            self.normal_eggs += 1
        self._counted_cells[cell] = self._frame
        self._cells.pop(cell, None)
        self._cell_status.pop(cell, None)
        if state is not None:
            state.counted = True

    def update(self, detections: list[dict], frame_h: int, status_map: dict[int, str]) -> list[TrackState]:
        self._frame += 1
        line_y = int(frame_h * self.line_y_fraction)
        updated: list[TrackState] = []

        # Counted cells are released only when they have been empty (no
        # detection) for CELL_EXPIRY_FRAMES. A stationary egg keeps its cell
        # refreshed every frame, so it can never be re-counted while it remains
        # in view; once it leaves, a genuinely new egg there can count later.
        self._counted_cells = {
            cell: last for cell, last in self._counted_cells.items()
            if self._frame - last < CELL_EXPIRY_FRAMES
        }

        for det in detections:
            track_id = det["track_id"]
            state = self.tracks.get(track_id)
            if state is None:
                state = TrackState(track_id)
                self.tracks[track_id] = state

            state.bbox = det["bounding_box"]
            state.class_name = det["class_name"]
            state.confidence = det["confidence"]
            status = status_map.get(det["class_id"], "normal")
            state.status_votes.append(status)
            state.status = self._settled_status(state.status_votes)

            cx, cy = self._centroid(state.bbox)
            cell = self._cell_of(cx, cy)
            state.cell = cell
            side = self._side(cy, line_y)

            # --- Cell-based stable identification (stationary eggs) ----------
            if cell in self._counted_cells:
                # The egg occupying this cell is already counted and is still
                # present: refresh its occupancy so it stays counted (never
                # recounts) and keep it from being released on this frame.
                self._counted_cells[cell] = self._frame
                state.counted = True
            elif not state.counted:
                self._cells[cell] = self._cells.get(cell, 0) + 1
                votes = self._cell_status.setdefault(cell, deque(maxlen=STATUS_VOTE_WINDOW))
                votes.append(status)
                if self._cells[cell] >= STABLE_FRAMES:
                    self._commit_cell(cell, self._settled_status(votes), state)

            # --- Line-crossing (moving eggs) ---------------------------------
            # A moving egg travels across cells, so the crossing path is keyed
            # to the track, not the cell. It counts once when the centroid
            # flips sides; ID churn is handled by marking the state counted.
            if state.prev_side is None:
                state.prev_side = side
            elif side != state.prev_side and not state.counted and not state.pending:
                state.pending = True
                state.settle_remaining = STATUS_SETTLE_FRAMES
                self._cells.pop(cell, None)
                self._cell_status.pop(cell, None)
            state.prev_side = side
            updated.append(state)

        # Finalize pending crossings on elapsed frames (even if the egg is not
        # seen this frame) so a real crossing is never dropped.
        for state in list(self.tracks.values()):
            if not state.pending:
                continue
            state.settle_remaining -= 1
            if state.settle_remaining <= 0:
                self._commit_crossing(state)
        return updated

    def _commit_crossing(self, state: TrackState) -> None:
        # A crossing is a distinct counted event; suppress re-count of this
        # track and of its current cell.
        state.counted = True
        state.pending = False
        self.total_eggs += 1
        if state.status == "cracked":
            self.cracked_eggs += 1
        else:
            self.normal_eggs += 1
        if state.cell is not None:
            self._counted_cells[state.cell] = self._frame
            self._cells.pop(state.cell, None)
            self._cell_status.pop(state.cell, None)