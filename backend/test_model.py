import joblib


MODEL_PATH = "models/complaint_classifier.pkl"


model = joblib.load(MODEL_PATH)


complaints = [

    "I was charged twice for my order",

    "My package has not arrived yet",

    "I cannot login to my account",

    "I want to cancel my order",

    "I need a refund for my purchase",

    "I want to speak with customer service",

    "I cannot make a payment",

    "I need to change my delivery address"

]


print("\n======================================")
print("AI COMPLAINT CLASSIFICATION")
print("======================================\n")


for complaint in complaints:

    prediction = model.predict(
        [complaint]
    )[0]


    probabilities = model.predict_proba(
        [complaint]
    )[0]


    confidence = max(
        probabilities
    )


    print("Complaint:")
    print(complaint)

    print("\nPredicted Category:")
    print(prediction)

    print(
        f"Confidence: {confidence * 100:.2f}%"
    )

    print(
        "-" * 55
    )