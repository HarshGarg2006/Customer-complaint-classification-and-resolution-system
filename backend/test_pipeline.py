from services.ai_pipeline import analyze_complaint


complaints = [
    "I was charged twice for my order",
    "My package has not arrived yet",
    "I cannot login to my account",
    "I want to cancel my order",
    "I need a refund for my purchase",
    "I want to speak with customer service",
    "I cannot make a payment",
    "I need to change my delivery address",
    "I forgot my password",
    "I want to track my order"
]


print("\n==============================================")
print("COMPLETE CUSTOMER COMPLAINT AI PIPELINE")
print("==============================================")


for complaint in complaints:

    result = analyze_complaint(complaint)

    print("\nComplaint:")
    print(result["complaint"])

    print("\nCategory:")
    print(
        result["category"],
        f"({result['category_confidence']}%)"
    )

    print("\nIntent:")
    print(
        result["intent"],
        f"({result['intent_confidence']}%)"
    )

    print("\nSentiment:")
    print(result["sentiment"])

    print("Polarity:")
    print(result["polarity"])

    print("\nPriority:")
    print(result["priority"])

    print("\nHuman Review:")
    print(result["human_review"])

    if result["review_reason"]:
        print("Review Reason:")
        print(result["review_reason"])

    print("\nResolution:")
    print(result["resolution"])

    if result["rule_detected"]:
        print("\nRule Detected:")
        print(result["rule_detected"])

    print("\n----------------------------------------------")