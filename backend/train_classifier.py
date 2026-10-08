import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)


# ==========================================
# CONFIGURATION
# ==========================================

DATASET = "dataset/complaints_processed.csv"

MODEL_PATH = "models/complaint_classifier.pkl"


# ==========================================
# LOAD DATASET
# ==========================================

print("Loading processed dataset...")

df = pd.read_csv(DATASET)

print("Total samples:", len(df))


# ==========================================
# INPUT / OUTPUT
# ==========================================

X = df["text"]

y = df["category"]


# ==========================================
# SHOW CLASS DISTRIBUTION
# ==========================================

print("\nCategory distribution:")

print(
    y.value_counts()
)


# ==========================================
# TRAIN / TEST SPLIT
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
# TF-IDF + LOGISTIC REGRESSION
# ==========================================

model = Pipeline(

    [

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

    ]

)


# ==========================================
# TRAIN
# ==========================================

print("\nTraining model...")

model.fit(

    X_train,

    y_train

)


print("Training completed.")


# ==========================================
# PREDICTION
# ==========================================

print("\nGenerating predictions...")

y_pred = model.predict(X_test)


# ==========================================
# ACCURACY
# ==========================================

accuracy = accuracy_score(

    y_test,

    y_pred

)


print("\n======================================")

print("MODEL PERFORMANCE")

print("======================================")

print(
    f"Accuracy: {accuracy * 100:.2f}%"
)


# ==========================================
# CLASSIFICATION REPORT
# ==========================================

print("\nClassification Report:\n")

print(

    classification_report(

        y_test,

        y_pred

    )

)


# ==========================================
# CONFUSION MATRIX
# ==========================================

cm = confusion_matrix(

    y_test,

    y_pred

)

print("\nConfusion Matrix:")

print(cm)


# ==========================================
# SAVE MODEL
# ==========================================

joblib.dump(

    model,

    MODEL_PATH

)


print("\n======================================")

print("MODEL SAVED SUCCESSFULLY")

print("======================================")

print(

    "Location:",

    MODEL_PATH

)