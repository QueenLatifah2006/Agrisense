import os
import sys
import json
import re
from collections import defaultdict
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, text
import cloudinary
import cloudinary.api
import requests
from litellm import completion

# ── Config ──────────────────────────────────────────────────────
engine = create_engine(os.getenv("DATABASE_URL"))

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# ════════════════════════════════════════════════════════════════
# SOURCE 1 — Base SQL
# ════════════════════════════════════════════════════════════════
def extraire_prix_sql(culture: str, zone: str,
                      date_debut: str, date_fin: str) -> list:
    print("\n📊 Source 1 : Base SQL...")
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT culture_nom, zone_agro, prix_moyen, unite, date_releve
                FROM prix_marche
                WHERE culture_nom ILIKE :culture
                AND zone_agro ILIKE :zone
            """), {
                "culture": f"%{culture}%",
                "zone": f"%{zone}%"
            })
            rows = result.mappings().all()

        prix = []
        for r in rows:
            prix.append({
                "culture": r["culture_nom"],
                "zone": r["zone_agro"],
                "prix_fcfa_kg": float(r["prix_moyen"]),
                "date": r["date_releve"],
                "source": "base_sql"
            })
        print(f"   ✅ {len(prix)} prix trouvés en SQL")
        return prix
    except Exception as e:
        print(f"   ❌ Erreur SQL : {e}")
        return []

# ════════════════════════════════════════════════════════════════
# SOURCE 2 — PDFs Cloudinary (notes + conversations)
# ════════════════════════════════════════════════════════════════
def extraire_prix_pdfs(culture: str, zone: str, marche: str) -> list:
    print("\n📄 Source 2 : PDFs Cloudinary...")
    try:
        result = cloudinary.api.resources(
            type="upload",
            resource_type="raw",
            prefix="knowledgebase/",
            max_results=500
        )
        resources = result.get("resources", [])
        pdfs_pertinents = [
            r for r in resources
            if culture.lower() in r["public_id"].lower()
            or zone.lower() in r["public_id"].lower()
            or marche.lower() in r["public_id"].lower()
        ]

        if not pdfs_pertinents:
            print(f"   ℹ️ Aucun PDF pertinent pour {culture}/{zone}/{marche}")
            return []

        tous_prix = []
        for resource in pdfs_pertinents[:5]:  # Max 5 PDFs
            url = resource["secure_url"]
            filename = resource["public_id"].split("/")[-1]
            print(f"   📥 Analyse : {filename}")

            try:
                import fitz
                import tempfile

                resp = requests.get(url, timeout=30)
                if resp.status_code != 200:
                    continue

                with tempfile.NamedTemporaryFile(
                    suffix=".pdf", delete=False
                ) as tmp:
                    tmp.write(resp.content)
                    tmp_path = tmp.name

                doc = fitz.open(tmp_path)
                texte = ""
                for page in doc:
                    texte += page.get_text()
                doc.close()
                os.unlink(tmp_path)

                if not texte.strip():
                    continue

                # Extraction LLM
                prompt = f"""
Analyse ce texte et extrais les prix de {culture} mentionnés.
Zone : {zone} Marché : {marche}

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
                print(f"   ❌ Erreur PDF {filename} : {e}")
                continue

        print(f"   ✅ {len(tous_prix)} prix extraits des PDFs")
        return tous_prix

    except Exception as e:
        print(f"   ❌ Erreur Cloudinary : {e}")
        return []


# ════════════════════════════════════════════════════════════════
# SOURCE 3 — Web scraping
# ════════════════════════════════════════════════════════════════
def extraire_prix_web(culture: str, zone: str, marche: str) -> list:
    print("\n🌐 Source 3 : Web...")
    try:
        serper_key = os.getenv("SERPER_API_KEY")
        if not serper_key:
            print("   ⚠️ SERPER_API_KEY absent — scraping web ignoré")
            return []

        query = f"prix {culture} marché {zone} Cameroun FCFA kg 2026"
        resp = requests.post(
            "https://google.serper.dev/search",
            headers={
                "X-API-KEY": serper_key,
                "Content-Type": "application/json"
            },
            json={"q": query, "num": 5},
            timeout=30
        )

        if resp.status_code != 200:
            print(f"   ❌ Serper HTTP {resp.status_code}")
            return []

        snippets = []
        for item in resp.json().get("organic", []):
            snippets.append(
                f"{item.get('title', '')} — {item.get('snippet', '')}"
            )
        texte = "\n".join(snippets)

        if not texte.strip():
            print("   ℹ️ Aucun résultat web")
            return []

        prompt = f"""
Extrais les prix de {culture} dans la zone {zone} au Cameroun.

Résultats web :
{texte[:2000]}

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
        prix = []
        for p in data.get("prix_extraits", []):
            if p.get("prix_fcfa_kg", 0) > 0:
                prix.append({
                    "culture": culture,
                    "zone": zone,
                    "prix_fcfa_kg": p["prix_fcfa_kg"],
                    "date": p.get("date", "Inconnu"),
                    "source": p.get("source", "web")
                })

        print(f"   ✅ {len(prix)} prix trouvés sur le web")
        return prix

    except Exception as e:
        print(f"   ❌ Erreur web : {e}")
        return []


# ════════════════════════════════════════════════════════════════
# AGRÉGATION
# ════════════════════════════════════════════════════════════════
def agreger_prix(tous_prix: list, culture: str, zone: str) -> dict:
    print("\n🔄 Agrégation des données...")

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
        date = p.get("date", "Inconnu")
        prix = p.get("prix_fcfa_kg", 0)
        if prix > 0:
            prix_par_date[date].append(prix)

    dataset = []
    for date, prix_list in sorted(prix_par_date.items()):
        dataset.append({
            "date": date,
            "prix_moyen_fcfa_kg": round(
                sum(prix_list) / len(prix_list), 2
            ),
            "nb_sources": len(prix_list)
        })

    return {
        "status": "OK",
        "culture": culture,
        "zone": zone,
        "total_points": len(dataset),
        "dataset": dataset
    }


# ════════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════════
def run_module2():
    print("==================================================================")
    print(" 🌾 AGRITECHS MODULE 2 — Extraction Prix pour Courbe")
    print("==================================================================\n")

    culture    = input("🌱 Culture    : ").strip() or "Tomate"
    zone       = input("📍 Zone       : ").strip() or "Ouest"
    marche     = input("🏪 Marché     : ").strip() or ""
    date_debut = input("📅 Date début (YYYY-MM-DD) : ").strip() or "2026-04-01"
    date_fin   = input("📅 Date fin   (YYYY-MM-DD) : ").strip() or "2026-04-30"

    print(f"\n✅ Recherche : {culture} | {zone} | {date_debut} → {date_fin}")

    # ✅ Appels corrects avec les bons paramètres
    prix_sql  = extraire_prix_sql(culture, zone, date_debut, date_fin)
    prix_pdfs = extraire_prix_pdfs(culture, zone, marche)
    prix_web  = extraire_prix_web(culture, zone, marche)

    tous_prix = prix_sql + prix_pdfs + prix_web
    print(f"\n📦 Total brut : {len(tous_prix)} entrées de prix")

    dataset = agreger_prix(tous_prix, culture, zone)

    # Affichage
    print("\n==================================================")
    print("📊 DATASET FINAL :")
    print("==================================================\n")
    print(f"  Culture      : {dataset['culture']}")
    print(f"  Zone         : {dataset['zone']}")
    print(f"  Status       : {dataset['status']}")
    print(f"  Total points : {dataset['total_points']}")
    print()

    if dataset["dataset"]:
        print(f"  {'Date':<15} {'Prix moyen (FCFA/kg)':<25} {'Nb sources'}")
        print(f"  {'-'*15} {'-'*25} {'-'*10}")
        for entry in dataset["dataset"]:
            print(
                f"  {entry['date']:<15} "
                f"{entry['prix_moyen_fcfa_kg']:<25} "
                f"{entry['nb_sources']}"
            )
    else:
        print("  ⚠️ Aucun prix trouvé pour cette culture/zone/période.")
        print(f"  💡 Vérifiez que des données existent en base SQL")
        print(f"     pour '{culture}' dans la zone '{zone}'.")

    print("\n==================================================\n")

    output_file = f"dataset_{culture}_{zone}_{date_debut}_{date_fin}.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)
    print(f"💾 Dataset sauvegardé : {output_file}\n")

    return dataset

if __name__ == "__main__":
    run_module2()