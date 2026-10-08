from services.sentiment import analyze_sentiment


complaints = [
    "I am very happy with your service",
    "My order is late and I am extremely frustrated",
    "I want to know when my order will arrive",
    "This is the worst customer service I have ever received",
    "Thank you for solving my problem"
]


print("\n====================================")
print("SENTIMENT ANALYSIS TEST")
print("====================================")

for complaint in complaints:

    result = analyze_sentiment(complaint)

    print("\nComplaint:", complaint)
    print("Sentiment:", result["sentiment"])
    print("Polarity:", result["polarity"])
    print("Subjectivity:", result["subjectivity"])
    print("------------------------------------")