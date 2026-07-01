import os
import sys
import json
import re
from collections import defaultdict
from typing import Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# ── Ajoute le chemin vers agritechs ──────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src', 'agritechs'))

from sqlalchemy import create_engine, text
import cloudinary
import cloudinary.api
import requests
from litellm import completion

# ── Config ───────────────────────────────────────────────────────
engine = create_engine(os.getenv("DATABASE_URL"))

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# ── App FastAPI ──────────────────────────────────────────────────
app = FastAPI(
    title="AgriTechs IA API",
    description="API IA pour AgriTechs — Chat agriculteur et extraction des prix",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ════════════════════════════════════════════════════════════════
# SCHEMAS
# ════════════════════════════════════════════════════════════════
class ChatRequest(BaseModel):
    message: str
    user_id: Optional[int] = None
    zone: Optional[str] = None

class PrixDatasetRequest(BaseModel):
    culture: str
    zone: str
    marche: Optional[str] = ""
    date_debut: Optional[str] = "2026-01-01"
    date_fin: Optional[str] = "2026-12-31"

# ════════════════════════════════════════════════════════════════
# HELPERS — Extraction prix
# ════════════════════════════════════════════════════════════════
def extraire_prix_sql(culture: str, zone: str) -> list:
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT culture_nom, zone_agro, prix_moyen, unite, date_releve
                FROM prix_marche
                WHERE culture_nom ILIKE :culture
                AND zone_agro ILIKE :zone
            """), {"culture": f"%{culture}%", "zone": f"%{zone}%"})
            rows = result.mappings().all()
        return [{
            "culture": r["culture_nom"],
            "zone": r["zone_agro"],
            "prix_fcfa_kg": float(r["prix_moyen"]),
            "date": r["date_releve"],
            "source": "base_sql"
        } for r in rows]
    except Exception as e:
        print(f"Erreur SQL : {e}")
        return []


def extraire_prix_pdfs(culture: str, zone: str) -> list:
    try:
        result = cloudinary.api.resources(
            type="upload",
            resource_type="raw",
            prefix="knowledgebase/",
            max_results=500
        )
        resources = result.get("resources", [])
        pdfs = [
            r for r in resources
            if culture.lower() in r["public_id"].lower()
            or zone.lower() in r["public_id"].lower()
        ]

        if not pdfs:
            return []

        tous_prix = []
        for resource in pdfs[:5]:
            url = resource["secure_url"]
            filename = resource["public_id"].split("/")[-1]
            try:
                import fitz
                import tempfile
                resp = requests.get(url, timeout=30)
                if resp.status_code != 200:
                    continue
                with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                    tmp.write(resp.content)
                    tmp_path = tmp.name
                doc = fitz.open(tmp_path)
                texte = "".join([page.get_text() for page in doc])
                doc.close()
                os.unlink(tmp_path)
                if not texte.strip():
                    continue
                prompt = f"""
Analyse ce texte et extrais les prix de {culture} en FCFA/kg.
Zone : {zone}
Texte : {texte[:2000]}
Réponds UNIQUEMENT avec un JSON :
{{"prix_extraits": [{{"prix_fcfa_kg": 0, "date": "YYYY-MM-DD ou Inconnu", "marche": "nom ou Inconnu"}}]}}
Si aucun prix : {{"prix_extraits": []}}
"""
                resp_llm = completion(
                    model="groq/llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0
                )
                texte_rep = resp_llm.choices[0].message.content.strip()
                match = re.search(r'\{.*\}', texte_rep, re.DOTALL)
                if match:
                    data = json.loads(match.group(0))
                    for p in data.get("prix_extraits", []):
                        if p.get("prix_fcfa_kg", 0) > 0:
                            tous_prix.append({
                                "culture": culture,
                                "zone": zone,
                                "prix_fcfa_kg": p["prix_fcfa_kg"],
                                "date": p.get("date", "Inconnu"),
                                "source": f"pdf:{filename}"
                            })
            except Exception as e:
                continue
        return tous_prix
    except Exception as e:
        return []


def extraire_prix_web(culture: str, zone: str) -> list:
    try:
        serper_key = os.getenv("SERPER_API_KEY")
        if not serper_key:
            return []
        query = f"prix {culture} marché {zone} Cameroun FCFA kg 2026"
        resp = requests.post(
            "https://google.serper.dev/search",
            headers={"X-API-KEY": serper_key, "Content-Type": "application/json"},
            json={"q": query, "num": 5},
            timeout=30
        )
        if resp.status_code != 200:
            return []
        snippets = [
            f"{i.get('title', '')} — {i.get('snippet', '')}"
            for i in resp.json().get("organic", [])
        ]
        texte = "\n".join(snippets)
        if not texte.strip():
            return []
        prompt = f"""
Extrais les prix de {culture} dans la zone {zone} au Cameroun.
Résultats web : {texte[:2000]}
Réponds UNIQUEMENT avec un JSON :
{{"prix_extraits": [{{"prix_fcfa_kg": 0, "date": "YYYY-MM-DD ou Inconnu", "marche": "nom ou Inconnu", "source": "URL"}}]}}
Si aucun prix : {{"prix_extraits": []}}
"""
        resp_llm = completion(
            model="groq/llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )
        texte_rep = resp_llm.choices[0].message.content.strip()
        match = re.search(r'\{.*\}', texte_rep, re.DOTALL)
        if not match:
            return []
        data = json.loads(match.group(0))
        return [{
            "culture": culture,
            "zone": zone,
            "prix_fcfa_kg": p["prix_fcfa_kg"],
            "date": p.get("date", "Inconnu"),
            "source": p.get("source", "web")
        } for p in data.get("prix_extraits", []) if p.get("prix_fcfa_kg", 0) > 0]
    except Exception:
        return []


def agreger_prix(tous_prix: list, culture: str, zone: str) -> dict:
    if not tous_prix:
        return {
            "status": "VIDE",
            "culture": culture,
            "zone": zone,
            "total_points": 0,
            "dataset": []
        }
    prix_par_date = defaultdict(list)
    for p in tous_prix:
        if p.get("prix_fcfa_kg", 0) > 0:
            prix_par_date[p.get("date", "Inconnu")].append(p["prix_fcfa_kg"])
    dataset = [
        {
            "date": date,
            "prix_moyen_fcfa_kg": round(sum(pl) / len(pl), 2),
            "nb_sources": len(pl)
        }
        for date, pl in sorted(prix_par_date.items())
    ]
    return {
        "status": "OK",
        "culture": culture,
        "zone": zone,
        "total_points": len(dataset),
        "dataset": dataset
    }


# ════════════════════════════════════════════════════════════════
# ENDPOINTS
# ════════════════════════════════════════════════════════════════

@app.get("/api/ia/health")
def health():
    return {
        "status": "ok",
        "service": "AgriTechs IA API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/ia/chat")
async def chat(request: ChatRequest):
    """Chat avec l'agent agriculteur (Module 1)"""
    try:
        from crew import AgritechsCrew
        from main import extraire_parametres_depuis_phrase

        phrase = request.message
        data = extraire_parametres_depuis_phrase(phrase)

        if data["culture"] == "Inconnu":
            return {
                "status": "error",
                "message": "Je n'ai pas bien compris de quelle culture vous parlez.",
                "response": None
            }

        zone = data["zone"]
        if zone == "Inconnu":
            zone = request.zone or "Cameroun"

        inputs = {
            "phrase_utilisateur": phrase,
            "culture": data["culture"],
            "zone": zone,
            "climat": data["climat"]
        }

        result = AgritechsCrew().crew().kickoff(inputs=inputs)
        final = result.raw if hasattr(result, "raw") else str(result)

        return {
            "status": "ok",
            "culture": data["culture"],
            "zone": zone,
            "response": final
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ia/prix/dataset")
async def get_prix_dataset(request: PrixDatasetRequest):
    """Retourne le dataset de prix pour générer la courbe de variation"""
    try:
        prix_sql  = extraire_prix_sql(request.culture, request.zone)
        prix_pdfs = extraire_prix_pdfs(request.culture, request.zone)
        prix_web  = extraire_prix_web(request.culture, request.zone)

        tous_prix = prix_sql + prix_pdfs + prix_web
        dataset = agreger_prix(tous_prix, request.culture, request.zone)

        dataset["sources"] = {
            "sql": len(prix_sql),
            "pdfs": len(prix_pdfs),
            "web": len(prix_web)
        }

        return dataset
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ia/prix/cultures")
async def get_cultures():
    """Liste toutes les cultures disponibles en base"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT DISTINCT culture_nom FROM prix_marche ORDER BY culture_nom"
            ))
            cultures = [r["culture_nom"] for r in result.mappings().all()]
        return {"status": "ok", "cultures": cultures}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ia/prix/zones")
async def get_zones():
    """Liste toutes les zones disponibles en base"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT DISTINCT zone_agro FROM prix_marche ORDER BY zone_agro"
            ))
            zones = [r["zone_agro"] for r in result.mappings().all()]
        return {"status": "ok", "zones": zones}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ia/calendrier")
async def get_calendrier(
    culture: str = Query(..., description="Nom de la culture"),
    zone: str = Query(..., description="Zone géographique")
):
    """Retourne le calendrier agricole pour une culture et une zone"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT * FROM calendrier_agricole
                WHERE culture_nom ILIKE :culture
                AND zone_agro ILIKE :zone
                LIMIT 1
            """), {"culture": f"%{culture}%", "zone": f"%{zone}%"})
            row = result.mappings().first()

        if not row:
            return {"status": "VIDE", "message": f"Aucun calendrier pour {culture} / {zone}"}

        return {"status": "ok", "calendrier": dict(row)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))