from database.database import (
    initialize_database,
    create_ticket,
    get_ticket,
    get_all_tickets,
    update_ticket_status
)

from datetime import datetime


print("\n====================================")
print("DATABASE TEST")
print("====================================")


# Create database and table
initialize_database()

print("\nDatabase initialized successfully.")


# Generate unique ticket ID
ticket_id = "TKT-" + datetime.now().strftime("%Y%m%d%H%M%S")


# Sample ticket
sample_ticket = {
    "ticket_id": ticket_id,

    "complaint": "I cannot make a payment",

    "category": "PAYMENT",
    "intent": "payment_issue",

    "category_confidence": 93.63,
    "intent_confidence": 69.16,

    "sentiment": "Neutral",
    "polarity": 0.0,
    "subjectivity": 0.0,

    "priority": "Medium",

    "resolution":
        "Please verify your payment details and try again.",

    "human_review": False,
    "review_reason": None
}


# Insert ticket
created_ticket_id = create_ticket(sample_ticket)

print("\nTicket created:")
print(created_ticket_id)


# Retrieve ticket
ticket = get_ticket(created_ticket_id)

print("\nRetrieved ticket:")

if ticket:

    for key, value in ticket.items():
        print(f"{key}: {value}")


# Update status
updated = update_ticket_status(
    created_ticket_id,
    "In Progress"
)

print("\nStatus updated:", updated)


# Get all tickets
tickets = get_all_tickets()

print("\nTotal tickets:", len(tickets))


print("\n====================================")
print("DATABASE TEST COMPLETED")
print("====================================")