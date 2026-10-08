import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

from sklearn.metrics import (
    accuracy_score,
    classification_report
)


DATASET = "dataset/complaints_processed.csv"
MODEL_PATH = "models/intent_classifier.pkl"


# ==========================================
# LOAD DATA
# ==========================================

print("Loading dataset...")

df = pd.read_csv(DATASET)

print("Total samples:", len(df))


# ==========================================
# INPUT / TARGET
# ==========================================

X = df["text"]
y = df["intent"]


print("\nNumber of intents:", y.nunique())

print("\nIntent distribution:")
print(y.value_counts())


# ==========================================
# TRAIN TEST SPLIT
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))


# ==========================================
# MODEL
# ==========================================

model = Pipeline([

    (
        "tfidf",

        TfidfVectorizer(

            lowercase=True,

            stop_words="english",

            ngram_range=(1, 2),

            max_features=50000

        )
    ),

    (
        "classifier",

        LogisticRegression(

            max_iter=2000

        )
    )

])


# ==========================================
# TRAIN
# ==========================================

print("\nTraining intent classifier...")

model.fit(
    X_train,
    y_train
)

print("Training completed.")


# ==========================================
# PREDICTION
# ==========================================

y_pred = model.predict(X_test)


# ==========================================
# PERFORMANCE
# ==========================================

accuracy = accuracy_score(
    y_test,
    y_pred
)

print("\n====================================")
print("INTENT MODEL PERFORMANCE")
print("====================================")

print(
    f"Accuracy: {accuracy * 100:.2f}%"
)

print("\nClassification Report:\n")

print(
    classification_report(
        y_test,
        y_pred
    )
)


# ==========================================
# SAVE
# ==========================================

joblib.dump(
    model,
    MODEL_PATH
)

print("\n====================================")
print("INTENT MODEL SAVED")
print("====================================")

print(
    "Location:",
    MODEL_PATH
)