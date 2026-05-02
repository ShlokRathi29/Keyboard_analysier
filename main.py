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

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )
    """)

    cursor.execute("""
    INSERT OR IGNORE INTO settings (key, value) VALUES ('paused', '0')
    """)

    conn.commit()
    conn.close()


def is_paused():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = 'paused'")
        row = cursor.fetchone()
        conn.close()
        return row and row[0] == '1'
    except Exception:
        return False


def on_press(key):
    try:
        k = key.char
    except Exception:
        k = str(key)

    if not k:
        return

    if is_paused():
        return

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute(
            "INSERT INTO keystrokes (key, timestamp) VALUES (?, ?)",
            (k, time.time())
        )

        conn.commit()
        conn.close()
    except Exception:
        # If table doesn't exist yet, recreate it
        try:
            init_db()
        except Exception:
            pass


if __name__ == "__main__":
    init_db()

    with keyboard.Listener(on_press=on_press) as listener:
        listener.join()