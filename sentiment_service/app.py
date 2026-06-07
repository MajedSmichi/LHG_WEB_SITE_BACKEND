from fastapi import FastAPI
from pydantic import BaseModel
from pathlib import Path
from collections import Counter
import joblib
import numpy as np
import re
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
import time

class PredictRequest(BaseModel):
    text: str

app = FastAPI(title="Sentiment Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://localhost:3000",
        "http://3.211.174.1",
        "https://lhgstream.duckdns.org"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "scripts" / "data" / "processed" / "nlp_processed.csv"
MODEL_PATH = BASE_DIR / "scripts" / "models" / "sentiment_model.joblib"

# load data & model
df = pd.read_csv(DATA_PATH)
model = joblib.load(MODEL_PATH)

# simple in-memory cache for /summary
SUMMARY_CACHE = None
LAST_CACHE_TS = 0
CACHE_TTL = 300  # seconds

# mots positifs connus (retirez 'accueil' si vous ne le voulez pas comme signal positif)
POSITIVE_WORDS = {
    "excellent", "parfait", "super", "propre", "confortable", "agréable",
    "gentil", "magnifique", "bon", "bien", "qualité", "spacieux", "calme",
    "rapide", "recommande", "satisfait", "top", "impeccable", "sympathique", "efficace"
}

NEGATIVE_WORDS = {
    "mauvais", "sale", "bruyant", "lent", "déçu", "décevant", "problème", "retard",
    "froid", "inconfortable", "vieillot", "cher", "désagréable", "pire", "nul",
    "fuite", "cassé", "incident", "insalubre", "humide", "incohérent", "amateur"
}

# mots neutres / domaine à ignorer dans les keywords
NEUTRAL_WORDS = {
    "nuit", "nuits", "séjour", "sejour", "chambre", "hotel", "hôtel", "hébergement",
    "prix", "tarif", "reservation", "réservation", "personnel", "jour", "jours",
    "assez", "très", "bien", "bon"  # retirez si vous voulez garder 'bien'/'bon' sentimentiels
}

STOPWORDS = {
    "le", "la", "les", "de", "des", "du", "un", "une", "et", "en", "dans", "pour",
    "avec", "sur", "pas", "que", "qui", "au", "aux", "ce", "cette", "ces", "se",
    "sa", "son", "ses", "est", "sont", "été", "etre", "être", "mais", "plus",
    "tres", "nous", "vous", "ils", "elles", "je", "tu", "il", "elle", "on", "ne"
}

def note_to_sentiment(note: float) -> str:
    if note <= 4:
        return "negatif"
    if note <= 7:
        return "neutre"
    return "positif"


def clean_text(text: str) -> str:
    t = str(text).lower()
    t = re.sub(r"[^a-zA-ZÀ-ÿ0-9\s]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def tokenize(text: str) -> list[str]:
    cleaned = clean_text(text)
    tokens = [token for token in cleaned.split() if len(token) > 2 and token not in STOPWORDS and token not in NEUTRAL_WORDS]
    return tokens


def top_keywords_from_texts(texts: pd.Series, sentiment_label: str, limit: int = 10):
    counter = Counter()
    for text in texts.fillna(""):
        tokens = tokenize(text)
        for token in tokens:
            if token in NEUTRAL_WORDS:
                continue
            if sentiment_label == "positif" and token in POSITIVE_WORDS:
                counter[token] += 3
            elif sentiment_label == "negatif" and token in NEGATIVE_WORDS:
                counter[token] += 3
            else:
                counter[token] += 1

    return [
        {"keyword": keyword, "count": count, "sentiment": sentiment_label}
        for keyword, count in counter.most_common(limit)
    ]


def predict_sentiment_with_confidence(text: str):
    ct = clean_text(text)
    probs = model.predict_proba([ct])[0]
    classes = model.classes_.tolist()
    best_idx = int(np.argmax(probs))
    return {
        "sentiment": classes[best_idx],
        "confidence": float(probs[best_idx]),
        "probabilities": dict(zip(classes, [float(p) for p in probs.tolist()])),
    }


def build_review_row(row):
    # reuse precomputed columns if available
    sentiment = row.get("pred_sentiment") or row.get("sentiment") or note_to_sentiment(float(row.get("note", 0)))
    confidence = float(row.get("pred_confidence", 0.0))
    return {
        "hotel": row.get("nom", ""),
        "note": float(row.get("note", 0)),
        "text": row.get("remarque", ""),
        "sentiment": sentiment,
        "confidence": confidence,
    }


def make_insight(sentiments: dict, average_note: float) -> str:
    negatif = sentiments.get("negatif", 0)
    positif = sentiments.get("positif", 0)

    if negatif >= 0.3:
        return f"Attention: {round(negatif * 100)}% des avis sont négatifs. Priorité sur la qualité de service."
    if positif >= 0.6 and average_note >= 7.5:
        return f"Résultat solide: {round(positif * 100)}% d'avis positifs et une note moyenne de {average_note:.1f}/10."
    if average_note >= 6.5:
        return f"Tendance globalement stable avec une note moyenne de {average_note:.1f}/10."
    return "Le niveau de satisfaction reste modéré. Un suivi ciblé est recommandé."


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict(req: PredictRequest):
    ct = clean_text(req.text)
    probs = model.predict_proba([ct])[0]
    classes = model.classes_.tolist()
    best_idx = int(np.argmax(probs))

    return {
        "sentiment": classes[best_idx],
        "probabilities": dict(zip(classes, [float(p) for p in probs.tolist()])),
        "confidence": float(probs[best_idx]),
        "cleanText": ct,
    }


@app.get("/summary")
def summary():
    global SUMMARY_CACHE, LAST_CACHE_TS

    # return cached summary if fresh
    now = time.time()
    if SUMMARY_CACHE is not None and (now - LAST_CACHE_TS) < CACHE_TTL:
        return SUMMARY_CACHE

    data = df.copy()

    if "sentiment" not in data.columns:
        data["sentiment"] = data["note"].apply(note_to_sentiment)

    if "remarque" not in data.columns:
        data["remarque"] = ""

    # faster/safer date parsing
    if "date_sejour" in data.columns:
        try:
            data["date_sejour"] = pd.to_datetime(data["date_sejour"], format="%Y-%m-%d", errors="coerce")
        except Exception:
            data["date_sejour"] = pd.to_datetime(data["date_sejour"], errors="coerce", infer_datetime_format=True)
        data["month"] = data["date_sejour"].dt.to_period("M").astype(str).fillna("unknown")
    else:
        data["month"] = "unknown"

    total_reviews = int(len(data))
    average_note = float(data["note"].mean()) if total_reviews else 0.0

    sentiment_counts = data["sentiment"].value_counts().to_dict()
    positive_count = int(sentiment_counts.get("positif", 0))
    neutral_count = int(sentiment_counts.get("neutre", 0))
    negative_count = int(sentiment_counts.get("negatif", 0))

    sentiments = {
        "positif": positive_count / total_reviews if total_reviews else 0,
        "neutre": neutral_count / total_reviews if total_reviews else 0,
        "negatif": negative_count / total_reviews if total_reviews else 0,
    }

    # --- batch predict for all remarks (much faster than per-row calls) ---
    texts = data["remarque"].fillna("").astype(str).tolist()
    pred_confidences = []
    pred_classes = []

    if len(texts) > 0:
        try:
            cleaned_texts = [clean_text(t) for t in texts]
            probs = model.predict_proba(cleaned_texts)  # shape (n_samples, n_classes)
            pred_idxs = np.argmax(probs, axis=1)
            classes = model.classes_.tolist()
            pred_classes = [classes[int(i)] for i in pred_idxs]
            pred_confidences = [float(p) for p in probs.max(axis=1)]
        except Exception:
            # fallback to safe per-row predict (slow but prevents crash)
            pred_confidences = []
            pred_classes = []
            for t in texts:
                res = predict_sentiment_with_confidence(t)
                pred_classes.append(res["sentiment"])
                pred_confidences.append(float(res["confidence"]))

    # attach predictions to dataframe for reuse
    data["pred_sentiment"] = pred_classes if len(pred_classes) == len(data) else [None] * len(data)
    data["pred_confidence"] = pred_confidences if len(pred_confidences) == len(data) else [0.0] * len(data)

    average_confidence = float(np.mean(pred_confidences)) if pred_confidences else 0.0

    sentiment_by_hotel = (
        data.groupby("nom")
        .agg(
            total=("sentiment", "count"),
            positif=("sentiment", lambda s: (s == "positif").sum()),
            neutre=("sentiment", lambda s: (s == "neutre").sum()),
            negatif=("sentiment", lambda s: (s == "negatif").sum()),
            averageNote=("note", "mean"),
        )
        .reset_index()
        .rename(columns={"nom": "hotel"})
        .sort_values(["negatif", "total"], ascending=[False, False])
        .to_dict(orient="records")
    )

    trend_by_month = (
        data.groupby("month")
        .agg(
            total=("sentiment", "count"),
            positif=("sentiment", lambda s: (s == "positif").sum()),
            neutre=("sentiment", lambda s: (s == "neutre").sum()),
            negatif=("sentiment", lambda s: (s == "negatif").sum()),
            averageNote=("note", "mean"),
        )
        .reset_index()
        .sort_values("month")
        .to_dict(orient="records")
    )

    top_keywords_positive = top_keywords_from_texts(
        data.loc[data["sentiment"] == "positif", "remarque"],
        "positif",
        12
    )

    top_keywords_negative = top_keywords_from_texts(
        data.loc[data["sentiment"] == "negatif", "remarque"],
        "negatif",
        12
    )

    # use precomputed prediction columns when building review rows
    top_positive_reviews = (
        data[data["sentiment"] == "positif"]
        .sort_values(["note"], ascending=False)
        .head(5)
        .apply(build_review_row, axis=1)
        .tolist()
    )

    top_negative_reviews = (
        data[data["sentiment"] == "negatif"]
        .sort_values(["note"], ascending=True)
        .head(5)
        .apply(build_review_row, axis=1)
        .tolist()
    )

    alerts = []
    for row in sentiment_by_hotel[:5]:
        if row["negatif"] > row["positif"]:
            alerts.append({
                "type": "warning",
                "hotel": row["hotel"],
                "message": f"{row['hotel']} concentre plus d'avis négatifs que positifs.",
                "severity": "high",
            })

    summary_text = make_insight(sentiments, average_note)

    result = {
        "totalReviews": total_reviews,
        "averageNote": average_note,
        "averageConfidence": average_confidence,
        "sentiments": sentiments,
        "trendByMonth": trend_by_month,
        "sentimentByHotel": sentiment_by_hotel,
        "topKeywordsPositive": top_keywords_positive,
        "topKeywordsNegative": top_keywords_negative,
        "alerts": alerts,
        "summaryText": summary_text,
        "topPositiveReviews": top_positive_reviews,
        "topNegativeReviews": top_negative_reviews,
    }

    # update cache
    SUMMARY_CACHE = result
    LAST_CACHE_TS = now

    return result
print("MODEL PATH:", MODEL_PATH)
print("LOADING MODEL...")
model = joblib.load(MODEL_PATH)
print("MODEL LOADED:", type(model))
