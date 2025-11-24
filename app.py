# -*- coding: utf-8 -*-

# app.py
from flask import Flask, render_template, request, jsonify
import sqlite3
import json

app = Flask(__name__)

DB_PATH = "hearing_test.db"

def insert_result(subject_id, timestamp, score, records):
    """検査結果をSQLiteに保存する関数"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO hearing_results (subject_id, timestamp, score, raw_json) VALUES (?, ?, ?, ?)",
        (subject_id, timestamp, score, json.dumps(records, ensure_ascii=False))
    )
    conn.commit()
    conn.close()

@app.route("/")
def index():
    # templates/index.html を返す
    return render_template("index.html")

@app.route("/api/submit", methods=["POST"])
def api_submit():
    data = request.get_json()

    # フロントから送られてくるJSONの想定：
    # {
    #   "subjectId": "...",
    #   "timestamp": "...",
    #   "score": "80.0%",
    #   "records": [ {...}, {...}, ... ]
    # }

    subject_id = data.get("subjectId", "")
    timestamp = data.get("timestamp", "")
    score = data.get("score", "")
    records = data.get("records", [])

    insert_result(subject_id, timestamp, score, records)

    # フロントに返すレスポンス（JSON）
    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    # 開発用サーバ起動
    app.run(debug=True)