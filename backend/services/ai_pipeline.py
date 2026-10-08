from pathlib import Path
import joblib

from services.sentiment import analyze_sentiment
from services.priority import calculate_priority
from services.resolution import get_resolution


# --------------------------------------------------
# Paths
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

CATEGORY_MODEL_PATH = BASE_DIR / "models" / "complaint_classifier.pkl"
INTENT_MODEL_PATH = BASE_DIR / "models" / "intent_classifier.pkl"


# --------------------------------------------------
# Load trained models
# --------------------------------------------------

category_model = joblib.load(CATEGORY_MODEL_PATH)
intent_model = joblib.load(INTENT_MODEL_PATH)


# --------------------------------------------------
# Strong keyword-based corrections
# --------------------------------------------------
# These rules handle very obvious real-world phrases
# where the ML model may have low confidence.

STRONG_INTENT_RULES = {

    "charged twice": "payment_issue",
    "charged multiple times": "payment_issue",
    "charged two times": "payment_issue",

    "track my order": "track_order",
    "track my package": "track_order",
    "where is my order": "track_order",
    "where is my package": "track_order",

    "forgot my password": "recover_password",
    "forgot password": "recover_password",
    "cannot login": "recover_password",
    "cannot log in": "recover_password",

    "refund has not arrived": "track_refund",
    "refund not arrived": "track_refund",
    "refund not received": "track_refund",

    "change my delivery address": "change_shipping_address",
    "change delivery address": "change_shipping_address",

    "cancel my order": "cancel_order"
}


INTENT_TO_CATEGORY = {

    "cancel_order": "ORDER",
    "change_order": "ORDER",
    "place_order": "ORDER",
    "track_order": "ORDER",

    "change_shipping_address": "SHIPPING",
    "set_up_shipping_address": "SHIPPING",

    "track_refund": "REFUND",
    "get_refund": "REFUND",
    "check_refund_policy": "REFUND",

    "payment_issue": "PAYMENT",
    "check_payment_methods": "PAYMENT",

    "check_invoice": "INVOICE",
    "get_invoice": "INVOICE",

    "delivery_options": "DELIVERY",
    "delivery_period": "DELIVERY",

    "contact_customer_service": "CONTACT",
    "contact_human_agent": "CONTACT",

    "create_account": "ACCOUNT",
    "delete_account": "ACCOUNT",
    "edit_account": "ACCOUNT",
    "recover_password": "ACCOUNT",
    "registration_problems": "ACCOUNT",
    "switch_account": "ACCOUNT",

    "newsletter_subscription": "SUBSCRIPTION",

    "review": "FEEDBACK",
    "complaint": "FEEDBACK"
}


# --------------------------------------------------
# Main prediction function
# --------------------------------------------------

def analyze_complaint(text):

    text = text.strip()

    if not text:
        raise ValueError("Complaint text cannot be empty.")

    text_lower = text.lower()

    # ----------------------------------------------
    # Category prediction
    # ----------------------------------------------

    category_prediction = category_model.predict([text])[0]

    category_probabilities = category_model.predict_proba([text])[0]

    category_confidence = max(category_probabilities) * 100


    # ----------------------------------------------
    # Intent prediction
    # ----------------------------------------------

    intent_prediction = intent_model.predict([text])[0]

    intent_probabilities = intent_model.predict_proba([text])[0]

    intent_confidence = max(intent_probabilities) * 100


    # ----------------------------------------------
    # Strong phrase correction
    # ----------------------------------------------

    detected_rule = None

    for phrase, rule_intent in STRONG_INTENT_RULES.items():

        if phrase in text_lower:

            intent_prediction = rule_intent
            detected_rule = phrase

            # If a strong intent is detected,
            # use the corresponding category.
            if rule_intent in INTENT_TO_CATEGORY:
                category_prediction = INTENT_TO_CATEGORY[rule_intent]

            break


    # ----------------------------------------------
    # Sentiment
    # ----------------------------------------------

    sentiment_result = analyze_sentiment(text)

    sentiment = sentiment_result["sentiment"]


    # ----------------------------------------------
    # Priority
    # ----------------------------------------------

    priority = calculate_priority(
        text,
        sentiment,
        category_prediction
    )


    # ----------------------------------------------
    # Confidence / Human Review
    # ----------------------------------------------

    human_review = False

    review_reason = None

    if category_confidence < 55:

        human_review = True

        review_reason = "Low category confidence"

    elif intent_confidence < 55 and detected_rule is None:

        human_review = True

        review_reason = "Low intent confidence"


    # ----------------------------------------------
    # Resolution
    # ----------------------------------------------

    if human_review:

        resolution = (
            "The complaint requires human review because "
            "the AI classification confidence is low. "
            "A support agent should verify the complaint "
            "before providing a final resolution."
        )

    else:

        resolution = get_resolution(intent_prediction)


    # ----------------------------------------------
    # Final result
    # ----------------------------------------------

    return {

        "complaint": text,

        "category": category_prediction,

        "category_confidence": round(
            category_confidence, 2
        ),

        "intent": intent_prediction,

        "intent_confidence": round(
            intent_confidence, 2
        ),

        "sentiment": sentiment,

        "polarity": sentiment_result["polarity"],

        "subjectivity": sentiment_result["subjectivity"],

        "priority": priority,

        "resolution": resolution,

        "human_review": human_review,

        "review_reason": review_reason,

        "rule_detected": detected_rule
    }