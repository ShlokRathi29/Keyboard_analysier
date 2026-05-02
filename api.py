from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from collections import Counter
import os
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(
    os.getenv("APPDATA"),
    "KeyboardAnalyzer",
    "keystrokes.db"
)

os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS keystrokes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT,
        timestamp REAL
    )
    """)

    conn.commit()
    conn.close()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/stats")
def stats():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT key, timestamp FROM keystrokes WHERE key IS NOT NULL")
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return {
            "wpm": 0,
            "total_keys": 0,
            "error_rate": 0,
            "accuracy": 100,
            "top_keys": [],
            "duration_minutes": 0
        }

    total_keys = len(rows)
    start = rows[0][1]
    end = rows[-1][1]

    duration = max(end - start, 1)
    minutes = duration / 60

    chars = sum(1 for k, _ in rows if k and len(k) == 1)
    wpm = (chars / 5) / minutes if minutes > 0 else 0

    backspace = sum(1 for k, _ in rows if k and k == "Key.backspace")
    error_rate = (backspace / total_keys) * 100
    accuracy = max(0, round(100 - error_rate, 2))

    counter = Counter(k for k, _ in rows if k)

    return {
        "wpm": round(wpm, 2),
        "total_keys": total_keys,
        "error_rate": round(error_rate, 2),
        "accuracy": accuracy,
        "top_keys": counter.most_common(5),
        "duration_minutes": round(minutes, 1)
    }


@app.post("/reset")
def reset():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("DELETE FROM keystrokes")

    conn.commit()
    conn.close()

    return {"message": "reset"}


print("Starting API server...")
init_db()

uvicorn.run(
    app,
    host="127.0.0.1",
    port=8000,
    log_config=None
)