import hashlib
import hmac
import json
import os
import re
import secrets
from datetime import datetime, timedelta, timezone
from functools import wraps

import psycopg
import requests
from flask import Flask, jsonify, request, session
from flask_cors import CORS


app = Flask(__name__)
app.config.update(
    SECRET_KEY=os.environ.get("SESSION_SECRET", "local-t-assist-session-secret"),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=False,
    PERMANENT_SESSION_LIFETIME=timedelta(days=14),
)
CORS(app, supports_credentials=True)

DATABASE_URL = os.environ.get("DATABASE_URL")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
PIN_PATTERN = re.compile(r"^\d{4,6}$")


def db():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL must be configured")
    return psycopg.connect(DATABASE_URL)


def row_dict(row, columns):
    return dict(zip(columns, row, strict=True))


def student_payload(student):
    return {
        "id": student["id"],
        "name": student["name"],
        "ageOrClassLevel": student["age_or_class_level"],
        "currentStreak": student["current_streak_count"],
        "longestStreak": student["longest_streak_count"],
    }


def message_payload(message):
    return {
        "id": message["id"],
        "sender": message["sender"],
        "contentType": message["content_type"],
        "contentText": message["content_text"],
        "createdAt": message["created_at"].isoformat(),
    }


def hash_pin(pin):
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        pin.encode("utf-8"),
        salt=salt,
        n=2**14,
        r=8,
        p=1,
    )
    return f"scrypt${salt.hex()}${digest.hex()}"


def check_pin(pin, stored):
    try:
        algorithm, salt_hex, digest_hex = stored.split("$")
        if algorithm != "scrypt":
            return False
        digest = hashlib.scrypt(
            pin.encode("utf-8"),
            salt=bytes.fromhex(salt_hex),
            n=2**14,
            r=8,
            p=1,
        )
        return hmac.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def current_student():
    student_id = session.get("student_id")
    if not student_id:
        return None
    with db() as conn:
        row = conn.execute(
            """
            SELECT id, name, age_or_class_level, current_streak_count,
                   longest_streak_count
            FROM students
            WHERE id = %s
            """,
            (student_id,),
        ).fetchone()
    if not row:
        session.clear()
        return None
    return row_dict(
        row,
        ["id", "name", "age_or_class_level", "current_streak_count", "longest_streak_count"],
    )


def require_student(handler):
    @wraps(handler)
    def wrapped(*args, **kwargs):
        student = current_student()
        if not student:
            return jsonify({"error": "Please sign in first"}), 401
        return handler(student, *args, **kwargs)

    return wrapped


def update_streak(conn, student_id):
    today = datetime.now(timezone.utc).date()
    row = conn.execute(
        "SELECT last_active_at, current_streak_count, longest_streak_count FROM students WHERE id = %s FOR UPDATE",
        (student_id,),
    ).fetchone()
    last_active, current, longest = row
    last_day = last_active.astimezone(timezone.utc).date() if last_active else None

    if current == 0:
        current = 1
    elif last_day == today:
        return current, longest
    if last_day == today - timedelta(days=1):
        current += 1
    else:
        current = 1
    longest = max(longest, current)
    conn.execute(
        """
        UPDATE students
        SET last_active_at = now(), current_streak_count = %s,
            longest_streak_count = %s
        WHERE id = %s
        """,
        (current, longest, student_id),
    )
    return current, longest


def award_badges(conn, student_id, streak):
    earned = []
    rules = [
        ("first-chat", "First chat", True),
        ("three-day-streak", "Three day streak", streak >= 3),
        ("seven-day-streak", "Seven day streak", streak >= 7),
    ]
    for badge_type, _label, eligible in rules:
        if not eligible:
            continue
        exists = conn.execute(
            "SELECT 1 FROM badges WHERE student_id = %s AND badge_type = %s",
            (student_id, badge_type),
        ).fetchone()
        if not exists:
            conn.execute(
                "INSERT INTO badges (student_id, badge_type) VALUES (%s, %s)",
                (student_id, badge_type),
            )
            earned.append(badge_type)
    return earned


def infer_topic(text):
    lowered = text.lower()
    subjects = {
        "maths": ["math", "fraction", "algebra", "equation", "number", "multiply"],
        "science": ["plant", "science", "cell", "force", "energy", "photosynthesis"],
        "english": ["essay", "grammar", "story", "write", "reading", "sentence"],
        "social studies": ["history", "geography", "government", "culture"],
    }
    for subject, keywords in subjects.items():
        if any(word in lowered for word in keywords):
            return subject, " ".join(text.strip().split()[:5]).lower()
    return "general study", "study question"


def build_progress(conn, student_id, current_streak=None, longest_streak=None):
    if current_streak is None or longest_streak is None:
        streak_row = conn.execute(
            "SELECT current_streak_count, longest_streak_count FROM students WHERE id = %s",
            (student_id,),
        ).fetchone()
        current_streak, longest_streak = streak_row
    topic_rows = conn.execute(
        """
        SELECT subject, topic, times_discussed, last_covered_at
        FROM progress_topics
        WHERE student_id = %s
        ORDER BY last_covered_at DESC
        LIMIT 12
        """,
        (student_id,),
    ).fetchall()
    badge_rows = conn.execute(
        """
        SELECT badge_type, awarded_at
        FROM badges
        WHERE student_id = %s
        ORDER BY awarded_at DESC
        """,
        (student_id,),
    ).fetchall()
    return {
        "currentStreak": current_streak,
        "longestStreak": longest_streak,
        "topics": [
            {
                "subject": row[0],
                "topic": row[1],
                "timesDiscussed": row[2],
                "lastCoveredAt": row[3].isoformat(),
            }
            for row in topic_rows
        ],
        "badges": [
            {"badgeType": row[0], "awardedAt": row[1].isoformat()}
            for row in badge_rows
        ],
    }


def fallback_reply(student, text):
    subject, _topic = infer_topic(text)
    name = student["name"].split()[0]
    if subject == "maths":
        return f"Hey {name}, let’s take this one step at a time. Tell me which part of the problem feels confusing, and we’ll work it out together."
    if subject == "science":
        return f"Good question, {name}. Let’s connect it to something you already know. What do you think happens first?"
    if subject == "english":
        return f"I’m with you, {name}. Start by telling me what you think the main idea is, then we can shape the answer together."
    return f"Nice one, {name}. I’m here with you. What do you already understand about it, even if it is just one small part?"


def gemini_reply(student, history, text, media_data=None, media_mime_type=None):
    if not GEMINI_API_KEY:
        return fallback_reply(student, text)
    recent = history[-8:]
    conversation = [
        {
            "role": "user" if item["sender"] == "student" else "model",
            "parts": [{"text": item["content_text"]}],
        }
        for item in recent
    ]
    instruction = (
        "You are Temmy, a warm AI study companion for a student. "
        "Be encouraging, clear, and age-appropriate for the student's class level. "
        "Do not use em dashes. Do not just complete homework by default. "
        "Use judgment: guide with a question when that helps learning, but give a direct "
        "answer when the student needs clarity. Keep replies under 120 words. "
        f"Student name: {student['name']}. Class or age: {student['age_or_class_level']}."
    )
    user_parts = [{"text": text}]
    if media_data and media_mime_type:
        user_parts.append(
            {
                "inline_data": {
                    "mime_type": media_mime_type,
                    "data": media_data,
                }
            }
        )
    payload = {
        "system_instruction": {"parts": [{"text": instruction}]},
        "contents": conversation + [{"role": "user", "parts": user_parts}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 300},
    }
    try:
        response = requests.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            params={"key": GEMINI_API_KEY},
            json=payload,
            timeout=25,
        )
        response.raise_for_status()
        body = response.json()
        return body["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (requests.RequestException, KeyError, IndexError, TypeError, json.JSONDecodeError):
        return fallback_reply(student, text)


@app.get("/api/healthz")
def healthz():
    return jsonify({"status": "ok"})


@app.post("/api/auth/signup")
def signup():
    payload = request.get_json(silent=True) or {}
    name = str(payload.get("name", "")).strip()
    level = str(payload.get("ageOrClassLevel", "")).strip()
    pin = str(payload.get("pin", "")).strip()
    if not 2 <= len(name) <= 100 or not level or len(level) > 50 or not PIN_PATTERN.fullmatch(pin):
        return jsonify({"error": "Enter your name, class level, and a 4 to 6 digit PIN"}), 400

    try:
        with db() as conn:
            existing = conn.execute(
                "SELECT id FROM students WHERE lower(name) = lower(%s)",
                (name,),
            ).fetchone()
            if existing:
                return jsonify({"error": "That name already has a profile. Try logging in instead."}), 409
            row = conn.execute(
                """
                INSERT INTO students (name, age_or_class_level, pin_hash)
                VALUES (%s, %s, %s)
                RETURNING id, name, age_or_class_level, current_streak_count, longest_streak_count
                """,
                (name, level, hash_pin(pin)),
            ).fetchone()
        student = row_dict(
            row,
            ["id", "name", "age_or_class_level", "current_streak_count", "longest_streak_count"],
        )
        session.permanent = True
        session["student_id"] = student["id"]
        return jsonify({"student": student_payload(student)}), 201
    except psycopg.Error:
        return jsonify({"error": "We could not create your profile right now. Please try again."}), 500


@app.post("/api/auth/login")
def login():
    payload = request.get_json(silent=True) or {}
    name = str(payload.get("name", "")).strip()
    pin = str(payload.get("pin", "")).strip()
    if not name or not PIN_PATTERN.fullmatch(pin):
        return jsonify({"error": "Enter your name and 4 to 6 digit PIN"}), 400
    with db() as conn:
        row = conn.execute(
            """
            SELECT id, name, age_or_class_level, pin_hash, current_streak_count,
                   longest_streak_count
            FROM students WHERE lower(name) = lower(%s)
            """,
            (name,),
        ).fetchone()
    if not row or not check_pin(pin, row[3]):
        return jsonify({"error": "That name and PIN do not match"}), 401
    student = row_dict(
        row,
        ["id", "name", "age_or_class_level", "pin_hash", "current_streak_count", "longest_streak_count"],
    )
    session.permanent = True
    session["student_id"] = student["id"]
    return jsonify({"student": student_payload(student)})


@app.post("/api/auth/logout")
def logout():
    session.clear()
    return ("", 204)


@app.get("/api/auth/me")
@require_student
def me(student):
    return jsonify(student_payload(student))


@app.get("/api/chat/history")
@require_student
def chat_history(student):
    with db() as conn:
        rows = conn.execute(
            """
            SELECT m.id, m.sender, m.content_type, m.content_text, m.created_at
            FROM messages m
            JOIN conversations c ON c.id = m.conversation_id
            WHERE c.student_id = %s
            ORDER BY m.created_at ASC
            LIMIT 80
            """,
            (student["id"],),
        ).fetchall()
    return jsonify(
        [
            message_payload(
                row_dict(row, ["id", "sender", "content_type", "content_text", "created_at"])
            )
            for row in rows
        ]
    )


@app.post("/api/chat/message")
@require_student
def send_message(student):
    payload = request.get_json(silent=True) or {}
    text = str(payload.get("contentText", "")).strip()
    content_type = str(payload.get("contentType", "text")).strip()
    media_data = payload.get("mediaData")
    media_mime_type = str(payload.get("mediaMimeType", "")).strip()
    if not text or len(text) > 4000 or content_type not in {"text", "voice", "image"}:
        return jsonify({"error": "Send a message between 1 and 4000 characters"}), 400
    if media_data is not None:
        if not isinstance(media_data, str) or len(media_data) > 8_000_000:
            return jsonify({"error": "That file is too large. Try a smaller recording or image."}), 400
        allowed_mimes = {
            "image/jpeg",
            "image/png",
            "image/webp",
            "audio/webm",
            "audio/ogg",
            "audio/mp4",
            "audio/mpeg",
        }
        if media_mime_type not in allowed_mimes:
            return jsonify({"error": "That file type is not supported yet."}), 400

    with db() as conn:
        conversation = conn.execute(
            """
            SELECT id FROM conversations
            WHERE student_id = %s AND channel = 'web'
            ORDER BY started_at DESC LIMIT 1
            """,
            (student["id"],),
        ).fetchone()
        if conversation:
            conversation_id = conversation[0]
        else:
            conversation_id = conn.execute(
                """
                INSERT INTO conversations (student_id, channel)
                VALUES (%s, 'web') RETURNING id
                """,
                (student["id"],),
            ).fetchone()[0]

        student_row = conn.execute(
            """
            INSERT INTO messages (conversation_id, sender, content_type, content_text)
            VALUES (%s, 'student', %s, %s)
            RETURNING id, sender, content_type, content_text, created_at
            """,
            (conversation_id, content_type, text),
        ).fetchone()
        history_rows = conn.execute(
            """
            SELECT sender, content_text FROM messages
            WHERE conversation_id = %s ORDER BY created_at ASC LIMIT 80
            """,
            (conversation_id,),
        ).fetchall()
        history = [{"sender": row[0], "content_text": row[1]} for row in history_rows[:-1]]
        reply_text = gemini_reply(
            student,
            history,
            text,
            media_data if content_type in {"voice", "image"} else None,
            media_mime_type if content_type in {"voice", "image"} else None,
        )
        temmy_row = conn.execute(
            """
            INSERT INTO messages (conversation_id, sender, content_type, content_text)
            VALUES (%s, 'temmy', 'text', %s)
            RETURNING id, sender, content_type, content_text, created_at
            """,
            (conversation_id, reply_text),
        ).fetchone()
        current_streak, longest_streak = update_streak(conn, student["id"])
        subject, topic = infer_topic(text)
        conn.execute(
            """
            INSERT INTO progress_topics (student_id, subject, topic)
            VALUES (%s, %s, %s)
            ON CONFLICT (student_id, subject, topic)
            DO UPDATE SET last_covered_at = now(), times_discussed = progress_topics.times_discussed + 1
            """,
            (student["id"], subject, topic),
        )
        award_badges(conn, student["id"], current_streak)
        progress = build_progress(conn, student["id"], current_streak, longest_streak)

    return jsonify(
        {
            "studentMessage": message_payload(
                row_dict(student_row, ["id", "sender", "content_type", "content_text", "created_at"])
            ),
            "temmyMessage": message_payload(
                row_dict(temmy_row, ["id", "sender", "content_type", "content_text", "created_at"])
            ),
            "progress": progress,
        }
    ), 201


@app.get("/api/progress")
@require_student
def progress(student):
    with db() as conn:
        return jsonify(build_progress(conn, student["id"]))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8080")))