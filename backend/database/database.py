import sqlite3
from pathlib import Path
from datetime import datetime


BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "complaints.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tickets (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            ticket_id TEXT UNIQUE NOT NULL,

            complaint TEXT NOT NULL,

            category TEXT,

            intent TEXT,

            category_confidence REAL,

            intent_confidence REAL,

            sentiment TEXT,

            polarity REAL,

            subjectivity REAL,

            priority TEXT,

            resolution TEXT,

            human_review INTEGER DEFAULT 0,

            review_reason TEXT,

            status TEXT DEFAULT 'Open',

            created_at TEXT NOT NULL

        )
    """)

    connection.commit()
    connection.close()


def create_ticket(result):

    connection = get_connection()
    cursor = connection.cursor()

    created_at = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    cursor.execute("""
        INSERT INTO tickets (
            ticket_id,
            complaint,
            category,
            intent,
            category_confidence,
            intent_confidence,
            sentiment,
            polarity,
            subjectivity,
            priority,
            resolution,
            human_review,
            review_reason,
            status,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (

        result["ticket_id"],
        result["complaint"],
        result["category"],
        result["intent"],
        result["category_confidence"],
        result["intent_confidence"],
        result["sentiment"],
        result["polarity"],
        result["subjectivity"],
        result["priority"],
        result["resolution"],
        int(result["human_review"]),
        result["review_reason"],
        "Open",
        created_at
    ))

    connection.commit()
    connection.close()

    return result["ticket_id"]


def get_ticket(ticket_id):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM tickets
        WHERE ticket_id = ?
    """, (ticket_id,))

    ticket = cursor.fetchone()

    connection.close()

    if ticket:
        return dict(ticket)

    return None


def get_all_tickets():

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM tickets
        ORDER BY id DESC
    """)

    tickets = cursor.fetchall()

    connection.close()

    return [dict(ticket) for ticket in tickets]


def update_ticket_status(ticket_id, status):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        UPDATE tickets
        SET status = ?
        WHERE ticket_id = ?
    """, (status, ticket_id))

    connection.commit()

    updated = cursor.rowcount > 0

    connection.close()

    return updated