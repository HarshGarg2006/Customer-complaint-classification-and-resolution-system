import joblib

# Load trained models
category_model = joblib.load("models/complaint_classifier.pkl")
intent_model = joblib.load("models/intent_classifier.pkl")


def predict_complaint(text):
    # Category prediction
    category = category_model.predict([text])[0]
    category_probabilities = category_model.predict_proba([text])[0]
    category_confidence = max(category_probabilities) * 100

    # Intent prediction
    intent = intent_model.predict([text])[0]
    intent_probabilities = intent_model.predict_proba([text])[0]
    intent_confidence = max(intent_probabilities) * 100

    return {
        "text": text,
        "category": category,
        "category_confidence": category_confidence,
        "intent": intent,
        "intent_confidence": intent_confidence
    }


# Test complaints
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


print("\n====================================")
print("CUSTOMER COMPLAINT AI TEST")
print("====================================")

for complaint in complaints:

    result = predict_complaint(complaint)

    print("\nComplaint:", result["text"])
    print("Category:", result["category"])
    print("Category Confidence:",
          f"{result['category_confidence']:.2f}%")

    print("Intent:", result["intent"])
    print("Intent Confidence:",
          f"{result['intent_confidence']:.2f}%")

    print("------------------------------------")