import pandas as pd
import re

INPUT_FILE = "dataset/complaints_raw.csv"
OUTPUT_FILE = "dataset/complaints_processed.csv"


def clean_text(text):
    """Clean customer complaint text."""

    if pd.isna(text):
        return ""

    text = str(text).lower()

    # Remove URLs
    text = re.sub(r"http\S+|www\S+", "", text)

    # Remove extra spaces
    text = re.sub(r"\s+", " ", text)

    # Keep letters, numbers and basic punctuation
    text = re.sub(r"[^a-zA-Z0-9\s?.!,']", "", text)

    return text.strip()


# -----------------------------------------
# 1. Load dataset
# -----------------------------------------

print("Loading dataset...")

df = pd.read_csv(INPUT_FILE)

print("Original rows:", len(df))


# -----------------------------------------
# 2. Keep useful columns
# -----------------------------------------

df = df[
    [
        "instruction",
        "category",
        "intent",
        "response"
    ]
]


# -----------------------------------------
# 3. Rename instruction → text
# -----------------------------------------

df = df.rename(
    columns={
        "instruction": "text"
    }
)


# -----------------------------------------
# 4. Clean complaint text
# -----------------------------------------

print("Cleaning complaint text...")

df["text"] = df["text"].apply(clean_text)


# -----------------------------------------
# 5. Remove empty complaints
# -----------------------------------------

df = df[
    df["text"].str.len() > 5
]


# -----------------------------------------
# 6. Remove missing values
# -----------------------------------------

df = df.dropna(
    subset=[
        "text",
        "category",
        "intent",
        "response"
    ]
)


# -----------------------------------------
# 7. Remove duplicate complaints
# -----------------------------------------

df = df.drop_duplicates(
    subset=["text"]
)


# -----------------------------------------
# 8. Reset index
# -----------------------------------------

df = df.reset_index(drop=True)


# -----------------------------------------
# 9. Save processed dataset
# -----------------------------------------

df.to_csv(
    OUTPUT_FILE,
    index=False
)


# -----------------------------------------
# 10. Display results
# -----------------------------------------

print("\n====================================")
print("DATASET PREPROCESSING COMPLETE")
print("====================================")

print("\nOriginal rows:", 26872)
print("Processed rows:", len(df))

print("\nColumns:")
print(df.columns.tolist())

print("\nCategories:")
print(df["category"].value_counts())

print("\nIntents:")
print(df["intent"].value_counts())

print("\nSaved file:")
print(OUTPUT_FILE)

print("\n====================================")