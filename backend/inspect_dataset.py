import pandas as pd

FILE = "dataset/complaints_raw.csv"

df = pd.read_csv(FILE)

print("\n========== DATASET INFO ==========\n")

print("Rows:", len(df))
print("Columns:", list(df.columns))

print("\n========== FIRST 5 ROWS ==========\n")
print(df.head())

print("\n========== MISSING VALUES ==========\n")
print(df.isnull().sum())

print("\n========== CATEGORIES ==========\n")
if "category" in df.columns:
    print(df["category"].value_counts())

print("\n========== INTENTS ==========\n")
if "intent" in df.columns:
    print(df["intent"].value_counts())