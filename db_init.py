# -*- coding: utf-8 -*-
import sqlite3

def init_db():
    conn = sqlite3.connect("hearing_test.db")
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS hearing_results (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_id TEXT,
        timestamp  TEXT,
        score      TEXT,
        raw_json   TEXT
    )
    """)
    conn.commit()
    conn.close()
    print("DB初期化完了")

if __name__ == "__main__":
    init_db()