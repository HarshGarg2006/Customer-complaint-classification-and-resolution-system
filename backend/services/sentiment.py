from textblob import TextBlob


def analyze_sentiment(text):
    analysis = TextBlob(text)

    polarity = analysis.sentiment.polarity
    subjectivity = analysis.sentiment.subjectivity

    if polarity > 0.20:
        sentiment = "Positive"
    elif polarity < -0.20:
        sentiment = "Negative"
    else:
        sentiment = "Neutral"

    return {
        "sentiment": sentiment,
        "polarity": round(polarity, 3),
        "subjectivity": round(subjectivity, 3)
    }