from services.priority import calculate_priority


test_cases = [
    {
        "text": "Someone hacked my account",
        "sentiment": "Negative",
        "category": "ACCOUNT"
    },
    {
        "text": "I was charged twice for my order",
        "sentiment": "Negative",
        "category": "PAYMENT"
    },
    {
        "text": "My order is very late",
        "sentiment": "Negative",
        "category": "DELIVERY"
    },
    {
        "text": "I forgot my password",
        "sentiment": "Neutral",
        "category": "ACCOUNT"
    },
    {
        "text": "I want to know the delivery options",
        "sentiment": "Neutral",
        "category": "DELIVERY"
    }
]


print("\n====================================")
print("PRIORITY ENGINE TEST")
print("====================================")

for case in test_cases:

    priority = calculate_priority(
        case["text"],
        case["sentiment"],
        case["category"]
    )

    print("\nComplaint:", case["text"])
    print("Sentiment:", case["sentiment"])
    print("Category:", case["category"])
    print("Priority:", priority)

    print("------------------------------------")