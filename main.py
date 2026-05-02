from pynput import keyboard
import sqlite3
import time
import os

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


def on_press(key):
    try:
        k = key.char
    except:
        k = str(key)

    if not k:
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO keystrokes (key, timestamp) VALUES (?, ?)",
        (k, time.time())
    )

    conn.commit()
    conn.close()


if __name__ == "__main__":
    print("Tracker started...")
    print("DB:", DB_PATH)

    init_db()

    with keyboard.Listener(on_press=on_press) as listener:
        listener.join()