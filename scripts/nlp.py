from pathlib import Path
import re
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score


# Base paths robustes
BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "nlp.xlsx"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
MODELS_DIR = BASE_DIR / "models"

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)


def clean_text(text: str) -> str:
    text = str(text).lower()
    text = re.sub(r"[^a-zA-ZÀ-ÿ0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def note_to_sentiment(note: float) -> str:
    if note <= 4:
        return "negatif"
    if note <= 7:
        return "neutre"
    return "positif"


def main():
    # 1) Chargement
    df = pd.read_excel(DATA_FILE)

    # 2) Normalisation colonnes
    df["text"] = df["remarque"].astype(str)
    df["note"] = (
        df["note"]
        .astype(str)
        .str.replace(",", ".", regex=False)
        .astype(float)
    )

    # 3) Nettoyage NLP
    df["clean_text"] = df["text"].apply(clean_text)
    df = df[df["clean_text"].str.len() > 0].copy()

    # 4) Label sentiment
    df["sentiment"] = df["note"].apply(note_to_sentiment)

    # 5) Sauvegarde dataset préparé
    processed_csv = PROCESSED_DIR / "nlp_processed.csv"
    df.to_csv(processed_csv, index=False, encoding="utf-8-sig")
    print(f"Dataset préparé: {processed_csv}")
    print(df[["text", "clean_text", "note", "sentiment"]].head())

    # 6) Train / test
    X_train, X_test, y_train, y_test = train_test_split(
        df["clean_text"],
        df["sentiment"],
        test_size=0.2,
        random_state=42,
        stratify=df["sentiment"]
    )

    # 7) Pipeline modèle
    model = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=2)),
        ("clf", LogisticRegression(max_iter=1200))
    ])

    model.fit(X_train, y_train)

    # 8) Evaluation
    y_pred = model.predict(X_test)
    print("\n=== METRICS ===")
    print("Accuracy:", round(accuracy_score(y_test, y_pred), 4))
    print("F1 macro:", round(f1_score(y_test, y_pred, average="macro"), 4))
    print("\nClassification report:\n", classification_report(y_test, y_pred))
    print("Confusion matrix:\n", confusion_matrix(y_test, y_pred))

    # 9) Sauvegarde modèle
    model_file = MODELS_DIR / "sentiment_model.joblib"
    joblib.dump(model, model_file)
    print(f"\nModèle sauvegardé: {model_file}")

    # 10) Test rapide
    samples = [
        "service parfait et personnel très agréable",
        "attente longue mais correct",
        "expérience catastrophique, je ne recommande pas"
    ]
    preds = model.predict(samples)
    probs = model.predict_proba(samples)
    classes = model.classes_

    print("\n=== EXEMPLES ===")
    for i, s in enumerate(samples):
        best_idx = probs[i].argmax()
        print(f"- '{s}' -> {preds[i]} ({classes[best_idx]}: {probs[i][best_idx]:.3f})")


if __name__ == "__main__":
    main()