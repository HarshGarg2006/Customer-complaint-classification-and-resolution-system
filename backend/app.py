import time
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS

from services.ai_pipeline import analyze_complaint
from database.database import (
    initialize_database,
    create_ticket,
    get_all_tickets,
    get_ticket,
    update_ticket_status,
)

app = Flask(__name__)

# Allow frontend to communicate with Flask
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize SQLite database
initialize_database()


def generate_ticket_id():
    """
    Generate a unique ticket ID.
    Example: TKT-20261008143025123
    """
    return "TKT-" + datetime.now().strftime("%Y%m%d%H%M%S%f")[:-3]


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "service": "ResolveAI Customer Complaint Classification Backend",
        "status": "online",
        "message": "API is running successfully"
    }), 200


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "service": "ResolveAI Classification & Resolution API",
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0"
    }), 200


@app.route("/api/classify", methods=["POST"])
def classify_complaint():
    """
    Classify a customer complaint using the trained
    category + intent models and save the result to SQLite.

    Expected JSON:
    {
        "text": "I was charged twice for my order",
        "customer": "Test User"
    }
    """

    data = request.get_json(force=True, silent=True) or {}

    text = data.get("text", "").strip()
    customer = data.get("customer", "Anonymous Customer").strip()

    if not text:
        return jsonify({
            "success": False,
            "error": "Field 'text' is required"
        }), 400

    try:
        # Run complete AI pipeline
        result = analyze_complaint(text)

        ticket_id = generate_ticket_id()
        created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Prepare database record
        ticket_data = {
            "ticket_id": ticket_id,
            "complaint": text,
            "category": result["category"],
            "intent": result["intent"],
            "category_confidence": result["category_confidence"],
            "intent_confidence": result["intent_confidence"],
            "sentiment": result["sentiment"],
            "polarity": result["polarity"],
            "subjectivity": result["subjectivity"],
            "priority": result["priority"],
            "resolution": result["resolution"],
            "human_review": result["human_review"],
            "review_reason": result["review_reason"],
            "status": "Open",
            "created_at": created_at
        }

        # Save to SQLite
        create_ticket(ticket_data)

        # Frontend-compatible response
        response = {
            "success": True,

            "id": ticket_id,
            "ticket_id": ticket_id,

            "customer": customer,
            "complaint": text,

            "category": result["category"],
            "intent": result["intent"],

            "categoryConfidence": result["category_confidence"],
            "intentConfidence": result["intent_confidence"],

            # Main confidence used by older frontend
            "confidence": result["intent_confidence"] / 100,

            "sentiment": result["sentiment"],
            "polarity": result["polarity"],
            "subjectivity": result["subjectivity"],

            "priority": result["priority"],

            # Compatibility with old frontend terminology
            "urgency": result["priority"],

            "humanReview": result["human_review"],
            "reviewReason": result["review_reason"],

            "resolution": result["resolution"],

            "status": "Open",

            "ruleDetected": result["rule_detected"],

            "timestamp": created_at
        }

        return jsonify(response), 200

    except Exception as e:
        print("Classification error:", str(e))

        return jsonify({
            "success": False,
            "error": "AI classification failed",
            "details": str(e)
        }), 500


@app.route("/api/tickets", methods=["GET"])
def get_tickets():
    """
    Return all tickets stored in SQLite.
    """

    try:
        tickets = get_all_tickets()

        return jsonify({
            "success": True,
            "tickets": tickets,
            "total": len(tickets)
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/api/tickets/<ticket_id>", methods=["GET"])
def get_single_ticket(ticket_id):
    """
    Retrieve one ticket by ticket ID.
    """

    ticket = get_ticket(ticket_id)

    if ticket is None:
        return jsonify({
            "success": False,
            "error": f"Ticket {ticket_id} not found"
        }), 404

    return jsonify({
        "success": True,
        "ticket": ticket
    }), 200


@app.route("/api/tickets/<ticket_id>", methods=["PUT"])
def update_ticket(ticket_id):
    """
    Update ticket status.
    Example:
    {
        "status": "Resolved"
    }
    """

    data = request.get_json(force=True, silent=True) or {}

    status = data.get("status")

    if not status:
        return jsonify({
            "success": False,
            "error": "Field 'status' is required"
        }), 400

    allowed_statuses = [
        "Open",
        "In Progress",
        "Resolved",
        "Closed"
    ]

    if status not in allowed_statuses:
        return jsonify({
            "success": False,
            "error": "Invalid status",
            "allowed_statuses": allowed_statuses
        }), 400

    updated = update_ticket_status(ticket_id, status)

    if not updated:
        return jsonify({
            "success": False,
            "error": f"Ticket {ticket_id} not found"
        }), 404

    return jsonify({
        "success": True,
        "message": f"Ticket {ticket_id} updated successfully",
        "ticket_id": ticket_id,
        "status": status
    }), 200


@app.route("/api/metrics", methods=["GET"])
def get_metrics():
    """
    Real dashboard metrics from SQLite.
    No fabricated ticket counts.
    """

    try:
        tickets = get_all_tickets()

        total = len(tickets)

        open_count = sum(
            1 for t in tickets
            if t.get("status") == "Open"
        )

        in_progress_count = sum(
            1 for t in tickets
            if t.get("status") == "In Progress"
        )

        resolved_count = sum(
            1 for t in tickets
            if t.get("status") == "Resolved"
        )

        closed_count = sum(
            1 for t in tickets
            if t.get("status") == "Closed"
        )

        critical_count = sum(
            1 for t in tickets
            if t.get("priority") == "Critical"
        )

        high_count = sum(
            1 for t in tickets
            if t.get("priority") == "High"
        )

        medium_count = sum(
            1 for t in tickets
            if t.get("priority") == "Medium"
        )

        low_count = sum(
            1 for t in tickets
            if t.get("priority") == "Low"
        )

        human_review_count = sum(
            1 for t in tickets
            if t.get("human_review") in (1, True)
        )

        return jsonify({
            "success": True,

            "total": total,

            "status": {
                "open": open_count,
                "inProgress": in_progress_count,
                "resolved": resolved_count,
                "closed": closed_count
            },

            "priority": {
                "critical": critical_count,
                "high": high_count,
                "medium": medium_count,
                "low": low_count
            },

            "humanReview": human_review_count,

            # Actual trained-model validation metrics
            "modelAccuracy": {
                "category": 99.61,
                "intent": 97.28
            }
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == "__main__":
    print("=======================================================")
    print(" ResolveAI Customer Complaint Classification Backend")
    print(" Real AI + SQLite Backend")
    print(" Running on http://127.0.0.1:5000")
    print("=======================================================")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )