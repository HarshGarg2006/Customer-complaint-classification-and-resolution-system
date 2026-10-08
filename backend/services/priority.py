def calculate_priority(text, sentiment="Neutral", category=""):
    text_lower = text.lower()

    critical_keywords = [
        "fraud",
        "scam",
        "hacked",
        "stolen",
        "unauthorized",
        "security",
        "identity theft",
        "account compromised"
    ]

    high_keywords = [
        "charged twice",
        "charged multiple times",
        "money missing",
        "payment failed",
        "payment issue",
        "cannot make payment",
        "refund not received",
        "refund missing",
        "wrong charge",
        "wrong amount",
        "urgent",
        "emergency"
    ]

    medium_keywords = [
        "late",
        "delayed",
        "not received",
        "cannot login",
        "cannot log in",
        "forgot password",
        "forgot my password",
        "password forgotten",
        "cancel",
        "complaint",
        "problem",
        "issue",
        "error"
    ]

    # Critical priority
    if any(keyword in text_lower for keyword in critical_keywords):
        return "Critical"

    # High priority
    if any(keyword in text_lower for keyword in high_keywords):
        return "High"

    # Negative sentiment increases priority
    if sentiment == "Negative":
        return "Medium"

    # Medium priority
    if any(keyword in text_lower for keyword in medium_keywords):
        return "Medium"

    # Default priority
    return "Low"