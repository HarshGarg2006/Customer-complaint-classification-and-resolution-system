
from pathlib import Path
import re
import joblib

from services.sentiment import analyze_sentiment
from services.priority import calculate_priority
from services.resolution import get_resolution


# ============================================================
# MODEL PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

CATEGORY_MODEL_PATH = BASE_DIR / "models" / "complaint_classifier.pkl"
INTENT_MODEL_PATH = BASE_DIR / "models" / "intent_classifier.pkl"

category_model = joblib.load(CATEGORY_MODEL_PATH)
intent_model = joblib.load(INTENT_MODEL_PATH)


# ============================================================
# INTENT TO CATEGORY
# ============================================================

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
    "complaint": "FEEDBACK",
}


# ============================================================
# STRONG INTENT RULES
# ============================================================

STRONG_INTENT_RULES = {
    # Payment
    "charged multiple times": ("payment_issue", "PAYMENT"),
    "charged more than once": ("payment_issue", "PAYMENT"),
    "charged twice": ("payment_issue", "PAYMENT"),
    "charged two times": ("payment_issue", "PAYMENT"),
    "payment failed": ("payment_issue", "PAYMENT"),
    "cannot make a payment": ("payment_issue", "PAYMENT"),
    "can't make a payment": ("payment_issue", "PAYMENT"),

    # Order tracking
    "track my order": ("track_order", "ORDER"),
    "track my package": ("track_order", "ORDER"),
    "where is my order": ("track_order", "ORDER"),
    "where is my package": ("track_order", "ORDER"),

    # Delivery time
    "when will my order be delivered": ("delivery_period", "DELIVERY"),
    "when my order will be delivered": ("delivery_period", "DELIVERY"),
    "when will my order arrive": ("delivery_period", "DELIVERY"),
    "when will my package arrive": ("delivery_period", "DELIVERY"),
    "expected delivery date": ("delivery_period", "DELIVERY"),
    "delivery is delayed": ("delivery_period", "DELIVERY"),
    "package has not arrived": ("track_order", "ORDER"),
    "order has not arrived": ("track_order", "ORDER"),

    # Refund
    "refund has not arrived": ("track_refund", "REFUND"),
    "refund not received": ("track_refund", "REFUND"),
    "refund not arrived": ("track_refund", "REFUND"),
    "track my refund": ("track_refund", "REFUND"),

    # Password
    "forgot my password": ("recover_password", "ACCOUNT"),
    "forgot password": ("recover_password", "ACCOUNT"),
    "cannot log in": ("recover_password", "ACCOUNT"),
    "cannot login": ("recover_password", "ACCOUNT"),
    "can't log in": ("recover_password", "ACCOUNT"),
    "reset my password": ("recover_password", "ACCOUNT"),

    # Shipping address
    "change my delivery address": ("change_shipping_address", "SHIPPING"),
    "change delivery address": ("change_shipping_address", "SHIPPING"),
    "change my shipping address": ("change_shipping_address", "SHIPPING"),

    # Cancellation
    "cancel my order": ("cancel_order", "ORDER"),
    "cancel the order": ("cancel_order", "ORDER"),

    # Explicit account actions
    "delete my account": ("delete_account", "ACCOUNT"),
    "create a new account": ("create_account", "ACCOUNT"),
    "edit my account": ("edit_account", "ACCOUNT"),
}


# ============================================================
# PRODUCT DAMAGE / DEFECT RULES
#
# The trained model has no PRODUCT_DEFECTS category.
# Use FEEDBACK/complaint as the closest existing label and
# require human review instead of inventing a product category.
# ============================================================

PRODUCT_DAMAGE_PHRASES = (
    "damaged product",
    "damaged item",
    "product is damaged",
    "item is damaged",
    "product arrived damaged",
    "product was damaged",
    "received a damaged",
    "received damaged",
    "broken product",
    "broken item",
    "product is broken",
    "item is broken",
    "defective product",
    "product is defective",
    "defective item",
    "product does not work",
    "product doesn't work",
    "item does not work",
    "item doesn't work",
    "arrived broken",
)


# ============================================================
# GENERAL ACCOUNT PROBLEMS
# ============================================================

GENERAL_ACCOUNT_PHRASES = (
    "problem in account",
    "problem with my account",
    "issue with my account",
    "problem with account",
    "account problem",
    "account issue",
    "having trouble with my account",
    "having problems with my account",
)


# ============================================================
# HELPERS
# ============================================================

def contains_phrase(text, phrase):
    pattern = r"(?<!\w)" + re.escape(phrase) + r"(?!\w)"
    return re.search(pattern, text, flags=re.IGNORECASE) is not None


def looks_like_gibberish(text):
    words = re.findall(r"[a-zA-Z]+", text)

    if not words or len(text.strip()) < 4:
        return True

    # Flag obvious random strings, not ordinary short words.
    if len(words) == 1:
        word = words[0].lower()

        if len(word) >= 8 and not re.search(r"[aeiouy]", word):
            return True

    return False


def get_model_confidence(model, text, label):
    probabilities = model.predict_proba([text])[0]
    classes = list(model.classes_)

    if label not in classes:
        return 0.0

    index = classes.index(label)
    return round(float(probabilities[index]) * 100, 2)


def make_result(
    text,
    category,
    intent,
    category_confidence,
    intent_confidence,
    sentiment_result,
    priority,
    resolution,
    human_review,
    review_reason=None,
    rule_detected=None,
):
    return {
        "complaint": text,
        "category": category,
        "category_confidence": round(category_confidence, 2),
        "intent": intent,
        "intent_confidence": round(intent_confidence, 2),
        "sentiment": sentiment_result["sentiment"],
        "polarity": sentiment_result["polarity"],
        "subjectivity": sentiment_result["subjectivity"],
        "priority": priority,
        "resolution": resolution,
        "human_review": human_review,
        "review_reason": review_reason,
        "rule_detected": rule_detected,
    }


# ============================================================
# MAIN PIPELINE
# ============================================================

def analyze_complaint(text):

    if not isinstance(text, str):
        raise ValueError("Complaint must be text.")

    text = text.strip()

    if not text:
        raise ValueError("Complaint text cannot be empty.")

    text_lower = text.lower()

    sentiment_result = analyze_sentiment(text)
    sentiment = sentiment_result["sentiment"]

    # --------------------------------------------------------
    # 1. Reject obvious meaningless input
    # --------------------------------------------------------

    if looks_like_gibberish(text):
        return make_result(
            text=text,
            category="UNKNOWN",
            intent="unknown",
            category_confidence=0,
            intent_confidence=0,
            sentiment_result=sentiment_result,
            priority="Low",
            resolution=(
                "We could not understand this complaint. Please describe "
                "the issue in a complete sentence so the support team "
                "can help you."
            ),
            human_review=True,
            review_reason="Input is incomplete or appears meaningless.",
            rule_detected="invalid_or_unclear_input",
        )

    # --------------------------------------------------------
    # 2. Product damage: do not predict place_order
    # --------------------------------------------------------

    for phrase in sorted(PRODUCT_DAMAGE_PHRASES, key=len, reverse=True):
        if contains_phrase(text_lower, phrase):
            return make_result(
                text=text,
                category="FEEDBACK",
                intent="complaint",
                category_confidence=0,
                intent_confidence=0,
                sentiment_result=sentiment_result,
                priority=calculate_priority(text, sentiment, "FEEDBACK"),
                resolution=(
                    "The customer reports a damaged, broken, or defective "
                    "product. A support agent should verify the order and "
                    "product condition, then review the applicable "
                    "replacement or refund policy."
                ),
                human_review=True,
                review_reason=(
                    "Product damage requires verification. The trained "
                    "model does not have a dedicated product-defect category."
                ),
                rule_detected=phrase,
            )

    # --------------------------------------------------------
    # 3. General account problem: don't assume deletion
    # --------------------------------------------------------

    for phrase in GENERAL_ACCOUNT_PHRASES:
        if contains_phrase(text_lower, phrase):
            return make_result(
                text=text,
                category="ACCOUNT",
                intent="complaint",
                category_confidence=0,
                intent_confidence=0,
                sentiment_result=sentiment_result,
                priority=calculate_priority(text, sentiment, "ACCOUNT"),
                resolution=(
                    "A customer account problem has been reported. "
                    "Please identify the specific issue and verify the "
                    "account details before taking action."
                ),
                human_review=True,
                review_reason="The exact account problem is unclear.",
                rule_detected=phrase,
            )

    # --------------------------------------------------------
    # 4. Run trained models
    # --------------------------------------------------------

    category_prediction = str(category_model.predict([text])[0])
    intent_prediction = str(intent_model.predict([text])[0])

    detected_rule = None

    # Match longer phrases first.
    for phrase in sorted(STRONG_INTENT_RULES, key=len, reverse=True):
        if contains_phrase(text_lower, phrase):
            intent_prediction, category_prediction = STRONG_INTENT_RULES[phrase]
            detected_rule = phrase
            break

    category_confidence = get_model_confidence(
        category_model, text, category_prediction
    )

    intent_confidence = get_model_confidence(
        intent_model, text, intent_prediction
    )

    # --------------------------------------------------------
    # 5. Priority
    # --------------------------------------------------------

    priority = calculate_priority(
        text, sentiment, category_prediction
    )

    # --------------------------------------------------------
    # 6. Human-review decision
    # --------------------------------------------------------

    human_review = False
    review_reason = None

    if detected_rule is None and category_confidence < 55:
        human_review = True
        review_reason = "Low category confidence"

    elif detected_rule is None and intent_confidence < 55:
        human_review = True
        review_reason = "Low intent confidence"

    elif detected_rule is None and len(text.split()) < 3:
        human_review = True
        review_reason = "Complaint lacks sufficient detail"

    # --------------------------------------------------------
    # 7. Resolution
    # --------------------------------------------------------

    if human_review:
        resolution = (
            "The complaint requires human review because the available "
            "information is insufficient for a reliable automated "
            "resolution. A support agent should verify the customer's "
            "issue before recommending an action."
        )
    else:
        resolution = get_resolution(intent_prediction)

    return make_result(
        text=text,
        category=category_prediction,
        intent=intent_prediction,
        category_confidence=category_confidence,
        intent_confidence=intent_confidence,
        sentiment_result=sentiment_result,
        priority=priority,
        resolution=resolution,
        human_review=human_review,
        review_reason=review_reason,
        rule_detected=detected_rule,
    )
