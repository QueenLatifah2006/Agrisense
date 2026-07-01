import os
import sys
import re
import json
import tempfile
import unicodedata
import cloudinary
import cloudinary.api
import cloudinary.uploader
from urllib.request import urlretrieve
from crewai.tools import tool, BaseTool
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from typing import Optional, Type, List
from pydantic import BaseModel, Field
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from litellm import completion

load_dotenv()

# Helper function to normalize strings for robust matching (accents, spaces, casing)
def normaliser_chaine(texte: Optional[str], mode_js: bool = False) -> str:
    if not texte:
        return ""
    if mode_js:
        # Suppression brute de tout ce qui n'est pas a-zA-Z0-9 (comportement JS regex)
        return re.sub(r'[^a-zA-Z0-9]', '', texte).lower()
    else:
        # Retrait des accents d'abord, puis suppression des espaces/spéciaux
        texte_normalise = unicodedata.normalize('NFD', texte)
        texte_sans_accents = "".join([c for c in texte_normalise if unicodedata.category(c) != 'Mn'])
        return re.sub(r'[^a-zA-Z0-9]', '', texte_sans_accents).lower()

# --- Config SQLAlchemy ---
DB_URL = os.getenv("DATABASE_URL")
if DB_URL and DB_URL.startswith("postgres://") and not DB_URL.startswith("postgresql://"):
    # Fix for SQLAlchemy requiring postgresql:// over postgres://
    DB_URL = DB_URL.replace("postgres://", "postgresql://", 1)

# Only initialize engine if DB_URL is present to avoid errors
engine = create_engine(DB_URL) if DB_URL else None

# --- Config Cloudinary ---
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# =========================================================================
# MODULE 1 — OUTILS SQL + RAG (mis à jour pour Cloudinary)
# =========================================================================

class DiscoverSchema(BaseModel):
    table_name: Optional[str] = Field(None, description="Nom de la table à explorer.")

class DiscoverDatabaseTool(BaseTool):
    name: str = "discover_database_structure"
    description: str = (
        "Retourne UNIQUEMENT les noms des colonnes d'une table. "
        "N'utilise cet outil QUE pour connaître la structure, jamais pour chercher des données."
    )
    args_schema: Type[BaseModel] = DiscoverSchema

    def _run(self, table_name: Optional[str] = None) -> str:
        if not engine:
            return "Erreur : DATABASE_URL non configuré."
        try:
            with engine.connect() as connection:
                if table_name:
                    result = connection.execute(
                        text(
                            "SELECT column_name, data_type "
                            "FROM information_schema.columns "
                            "WHERE table_name = :t ORDER BY ordinal_position"
                        ),
                        {"t": table_name}
                    )
                    rows = result.mappings().all()
                    if not rows:
                        return f"Table '{table_name}' introuvable."
                    cols = ", ".join(
                        f"{r['column_name']} ({r['data_type']})" for r in rows
                    )
                    return f"{table_name}({cols})"
                else:
                    result = connection.execute(text(
                        "SELECT table_name FROM information_schema.tables "
                        "WHERE table_schema = 'public'"
                    ))
                    rows = result.mappings().all()
                    return "Tables disponibles : " + ", ".join(
                        r["table_name"] for r in rows
                    )
        except Exception as e:
            return f"Erreur SQL : {str(e)}"

class QuerySQLSchema(BaseModel):
    query: str = Field(..., description="Requête SQL SELECT valide.")

class QuerySQLTool(BaseTool):
    name: str = "query_sql_database"
    description: str = "Exécute une requête SQL SELECT et retourne les données réelles."
    args_schema: Type[BaseModel] = QuerySQLSchema

    def _run(self, query: str) -> str:
        if any(k in query.lower() for k in ["insert", "update", "delete"]):
            return "Erreur : SELECT uniquement."

        if not engine:
            print("❌ [QuerySQLTool] DATABASE_URL non configuré.")
            return "Nous n'avons pas trouvé les données demandées dans la base SQL"

        try:
            with engine.connect() as connection:
                result = connection.execute(text(query))
                db_rows = result.mappings().all()
                if db_rows:
                    print(f"📥 [QuerySQLTool] Extrait {len(db_rows)} lignes réelles depuis PostgreSQL.")
                    return "\n".join([str(dict(r)) for r in db_rows])
                else:
                    print(f"📥 [QuerySQLTool] Vraie DB interrogée, mais aucun résultat trouvé (SQL_VIDE).")
                    return "Nous n'avons pas trouvé les données demandées dans la base SQL"
        except Exception as db_err:
            print(f"[QuerySQLTool] Échec de la requête SQL directe de la DB réelle : {db_err}", file=sys.stderr)
            return "Nous n'avons pas trouvé les données demandées dans la base SQL"

def _sync_knowledgebase_from_cloudinary() -> str:
    local_kb = "knowledge"
    os.makedirs(local_kb, exist_ok=True)
    try:
        import requests

        resources = []
        # Tenter d'abord de récupérer toutes les ressources raw et image globales en un coup
        for r_type in ["raw", "image"]:
            try:
                result = cloudinary.api.resources(
                    type="upload",
                    resource_type=r_type,
                    max_results=500
                )
                type_resources = result.get("resources", [])
                for r in type_resources:
                    public_id = r.get("public_id", "")
                    # Conserver seulement les PDFs de type "image" ou n'importe quel fichier "raw"
                    if r.get("format") == "pdf" or public_id.lower().endswith(".pdf") or r_type == "raw":
                        resources.append(r)
                print(f"📥 [CloudinarySync] Trouvé {len(type_resources)} documents {r_type} totaux dans le compte Cloudinary.")
            except Exception as global_err:
                print(f"⚠️ [CloudinarySync] Échec de la récupération totale {r_type} : {global_err}. Tentative par préfixes de dossiers...", file=sys.stderr)
                # Sinon, scanner dossier par dossier en incluant les dossiers standards et de brouillons (draft/)
                folders_to_sync = [
                    "note", "article", "conversation", "knowledgebase", "message", "notes", "articles", "conversations",
                    "draft/note", "draft/article", "draft/conversation", "draft/knowledgebase", "draft/message"
                ]
                for folder in folders_to_sync:
                    try:
                        res_folder = cloudinary.api.resources(
                            type="upload",
                            resource_type=r_type,
                            prefix=folder + "/",
                            max_results=500
                        )
                        folder_res = res_folder.get("resources", [])
                        for r in folder_res:
                            public_id = r.get("public_id", "")
                            if r.get("format") == "pdf" or public_id.lower().endswith(".pdf") or r_type == "raw":
                                resources.append(r)
                    except Exception:
                        pass

        if not resources:
            print("⚠️ Aucun PDF ou document trouvé dans Cloudinary pour les dossiers analysés")
            return local_kb

        for resource in resources:
            public_id = resource["public_id"]
            # Conversion de l'arborescence en un nom plat unique pour éviter les collisions (ex: "draft/note/file" -> "draft_note_file.pdf")
            filename = public_id.replace("/", "_")
            if not filename.endswith(".pdf"):
                filename += ".pdf"
            local_path = os.path.join(local_kb, filename)

            if not os.path.exists(local_path):
                print(f"📥 Téléchargement : {filename}")
                try:
                    response = requests.get(
                        resource["secure_url"], timeout=60
                    )
                    if response.status_code == 200:
                        with open(local_path, "wb") as f:
                            f.write(response.content)
                        print(f"   ✅ OK : {filename}")
                    else:
                        print(f"   ❌ Statut {response.status_code} : {filename}")
                except Exception as e:
                    print(f"   ❌ Échec de téléchargement pour {filename} : {e}")
                    continue

        _locaux_pdfs = len([f for f in os.listdir(local_kb) if f.endswith(".pdf")])
        print(f"✅ Knowledgebase synchronisée avec succès ({_locaux_pdfs} PDFs locaux dans '{local_kb}')")
        return local_kb

    except Exception as e:
        print(f"❌ Erreur critique lors de la synchronisation Cloudinary : {e}")
        return local_kb

@tool("rag_dossier_tool")
def rag_dossier_tool(query: str) -> str:
    """
    Scanne les PDF de la knowledgebase Cloudinary et extrait
    les conseils techniques pour la requête donnée.
    """
    path_db = "chroma_db"
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    # Synchronise les PDFs depuis Cloudinary
    path_knowledge = _sync_knowledgebase_from_cloudinary()

    local_pdfs = sorted([f for f in os.listdir(path_knowledge) if f.endswith(".pdf")])
    if not local_pdfs:
        return "Aucun document PDF d'information n'a pu être récupéré de la base de connaissances Cloudinary."

    indexed_tracker_path = os.path.join(path_db, "indexed_files.json")
    needs_rebuild = True

    if os.path.exists(path_db) and os.listdir(path_db) and os.path.exists(indexed_tracker_path):
        try:
            with open(indexed_tracker_path, "r") as tracker_file:
                indexed_pdfs = json.load(tracker_file)
            if indexed_pdfs == local_pdfs:
                needs_rebuild = False
        except Exception:
            pass

    if needs_rebuild:
        print("🔄 Construction ou mise à jour complète de l'index vectoriel...")
        if os.path.exists(path_db):
            import shutil
            try:
                shutil.rmtree(path_db)
            except Exception:
                pass
        os.makedirs(path_db, exist_ok=True)

        try:
            from langchain_community.document_loaders import PyPDFLoader
            docs = []
            for file_name in local_pdfs:
                pdf_path = os.path.join(path_knowledge, file_name)
                try:
                    loader = PyPDFLoader(pdf_path)
                    docs.extend(loader.load())
                except Exception as e:
                    print(f"⚠️ Fichier ignoré (corrompu ?) {file_name} : {e}")
                    
            if not docs:
                return "Aucun contenu textuel n'a pu être extrait des PDFs disponibles."

            chunks = RecursiveCharacterTextSplitter(
                chunk_size=800, chunk_overlap=100
            ).split_documents(docs)
            db = Chroma.from_documents(
                chunks, embedding=embeddings, persist_directory=path_db
            )
            with open(indexed_tracker_path, "w") as tracker_file:
                json.dump(local_pdfs, tracker_file)
        except Exception as build_err:
            print(f"❌ Erreur lors de la construction de l'index : {build_err}")
            # Fallback simple
            if not os.path.exists(path_db) or not os.listdir(path_db):
                return f"Erreur de construction de l'index vectoriel : {str(build_err)}"
            db = Chroma(persist_directory=path_db, embedding_function=embeddings)
    else:
        db = Chroma(persist_directory=path_db, embedding_function=embeddings)

    docs_trouves = db.similarity_search(query, k=3)
    if not docs_trouves:
        return ""
    return "\n---\n".join([doc.page_content for doc in docs_trouves])

# =========================================================================
# MODULE 2 — OUTILS EXTRACTION DES PRIX
# =========================================================================

class FetchPDFSchema(BaseModel):
    culture: str = Field(..., description="Nom de la culture ex: Tomate")
    zone: str = Field(..., description="Zone géographique ex: Ouest")
    marche: Optional[str] = Field(None, description="Nom du marché ex: Douala")
    date_debut: Optional[str] = Field(None, description="Date début YYYY-MM-DD")
    date_fin: Optional[str] = Field(None, description="Date fin YYYY-MM-DD")

class FetchPDFsFromCloudinaryTool(BaseTool):
    name: str = "fetch_pdfs_cloudinary"
    description: str = (
        "Récupère les PDFs depuis Cloudinary (notes, conversations, articles) "
        "filtrés par culture, zone, marché et période de dates."
    )
    args_schema: Type[BaseModel] = FetchPDFSchema

    def _run(
        self,
        culture: str,
        zone: str,
        marche: Optional[str] = None,
        date_debut: Optional[str] = None,
        date_fin: Optional[str] = None
    ) -> str:
        try:
            folders = [
                "note", "message", "article", "knowledgebase", "notes", "conversations", "articles",
                "draft/note", "draft/message", "draft/article", "draft/knowledgebase", "draft/conversation"
            ]
            pdfs_trouves = []

            for folder in folders:
                for r_type in ["raw", "image"]:
                    try:
                        result = cloudinary.api.resources(
                            type="upload",
                            prefix=folder,
                            resource_type=r_type,
                            max_results=500
                        )
                        resources = result.get("resources", [])

                        for resource in resources:
                            public_id = resource["public_id"]
                            filename = os.path.basename(public_id)

                            # Eviter doublon si récupéré via raw et image
                            if any(x["nom"] == filename for x in pdfs_trouves):
                                continue

                            # Format attendu: type_culture_zone_marche_date
                            parts = filename.split("_")
                            if len(parts) < 4:
                                continue

                            # Normalisation pour la recherche
                            filename_norm_js = normaliser_chaine(filename, mode_js=True)
                            filename_norm_acc = normaliser_chaine(filename, mode_js=False)
                            
                            culture_norm_js = normaliser_chaine(culture, mode_js=True)
                            culture_norm_acc = normaliser_chaine(culture, mode_js=False)
                            
                            zone_norm_js = normaliser_chaine(zone, mode_js=True)
                            zone_norm_acc = normaliser_chaine(zone, mode_js=False)

                            # Filtre par culture (doit correspondre à la version sans accents ou avec suppression brute JS)
                            if culture_norm_js not in filename_norm_js and culture_norm_acc not in filename_norm_acc:
                                continue

                            # Filtre par zone (doit correspondre à la version sans accents ou avec suppression brute JS)
                            if zone_norm_js not in filename_norm_js and zone_norm_acc not in filename_norm_acc:
                                continue

                            # Filtre par marché si précisé
                            if marche:
                                marche_norm_js = normaliser_chaine(marche, mode_js=True)
                                marche_norm_acc = normaliser_chaine(marche, mode_js=False)
                                if marche_norm_js not in filename_norm_js and marche_norm_acc not in filename_norm_acc:
                                    continue

                            # Filtre par date si précisé
                            if date_debut or date_fin:
                                # Extrait la date du nom (dernier segment avant .pdf)
                                date_match = re.search(
                                    r'(\d{4}-\d{2}-\d{2})', filename
                                )
                                if date_match:
                                    date_pdf = date_match.group(1)
                                    if date_debut and date_pdf < date_debut:
                                        continue
                                    if date_fin and date_pdf > date_fin:
                                        continue

                            pdfs_trouves.append({
                                "url": resource["secure_url"],
                                "nom": filename,
                                "type": folder.split("/")[-1],
                                "date_upload": resource.get("created_at", "")
                            })
                    except Exception as cloud_err:
                        # Non-blocking: standard folder scan error fallback
                        pass

            if not pdfs_trouves:
                return f"Aucun PDF trouvé pour {culture} / {zone}"

            return json.dumps(pdfs_trouves, ensure_ascii=False, indent=2)

        except Exception as e:
            return f"Erreur Cloudinary : {str(e)}"

from typing import Optional

class ExtractPricesSchema(BaseModel):
    pdf_url: Optional[str] = Field(None, description="URL du PDF à analyser. Si null ou AUCUN_PDF, ne fait rien.")
    culture: str = Field(..., description="Culture recherchée.")
    zone: str = Field(..., description="Zone recherchée.")

class ExtractPricesFromPDFTool(BaseTool):
    name: str = "extract_prices_from_pdf"
    description: str = (
        "Télécharge un PDF depuis une URL Cloudinary, extrait le texte "
        "et utilise le LLM pour identifier les prix, dates, zones et marchés."
    )
    args_schema: Type[BaseModel] = ExtractPricesSchema

    def _run(self, pdf_url: Optional[str], culture: str, zone: str) -> str:
        try:
            if not pdf_url or pdf_url == "AUCUN_PDF" or pdf_url == "null":
                return "Aucun PDF fourni à extraire."
            
            # Télécharge le PDF dans un fichier temporaire
            with tempfile.NamedTemporaryFile(
                suffix=".pdf", delete=False
            ) as tmp:
                urlretrieve(pdf_url, tmp.name)
                tmp_path = tmp.name

            # Extrait le texte avec PyMuPDF
            import fitz  # pymupdf
            doc = fitz.open(tmp_path)
            texte_complet = ""
            for page in doc:
                texte_complet += page.get_text()
            doc.close()
            os.unlink(tmp_path)

            if not texte_complet.strip():
                return "PDF vide ou illisible."

            # Utilise le LLM pour extraire les entités prix
            prompt = f"""
Tu es un expert en extraction d'informations agricoles.
Analyse ce texte et extrais UNIQUEMENT les informations de prix.
Culture recherchée : {culture}
Zone recherchée : {zone}
Texte à analyser :
{texte_complet[:3000]}
Réponds UNIQUEMENT avec un JSON valide, sans explication :
{{
  "prix_extraits": [
    {{
      "culture": "nom de la culture",
      "zone": "zone géographique",
      "marche": "nom du marché ou Inconnu",
      "prix_fcfa_kg": 000,
      "date": "YYYY-MM-DD ou Inconnu",
      "source": "note/conversation/article"
    }}
  ]
}}
Si aucun prix trouvé, retourne : {{"prix_extraits": []}}
"""
            response = completion(
                model="groq/llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0
            )
            texte_reponse = response.choices[0].message.content.strip()
            match = re.search(r'\{.*\}', texte_reponse, re.DOTALL)
            if match:
                return match.group(0)
            return '{"prix_extraits": []}'

        except Exception as e:
            return f"Erreur extraction PDF : {str(e)}"

class ScrapeWebSchema(BaseModel):
    culture: str = Field(..., description="Culture recherchée ex: Tomate")
    zone: str = Field(..., description="Zone recherchée ex: Ouest Cameroun")

class ScrapeAgriculturalPricesTool(BaseTool):
    name: str = "scrape_agricultural_prices"
    description: str = (
        "Recherche les prix agricoles actuels sur le web pour une culture "
        "et une zone données. Retourne les prix trouvés avec leurs sources."
    )
    args_schema: Type[BaseModel] = ScrapeWebSchema

    def _run(self, culture: str, zone: str) -> str:
        try:
            from crewai_tools import SerperDevTool
            search_tool = SerperDevTool()

            query = (
                f"prix {culture} marché {zone} Cameroun FCFA kilogramme 2026"
            )
            resultats = search_tool._run(search_query=query)

            # Utilise le LLM pour extraire les prix des résultats web
            prompt = f"""
Tu es un expert en extraction d'informations agricoles au Cameroun.
Analyse ces résultats de recherche web et extrais les prix mentionnés.
Culture : {culture}
Zone : {zone}
Résultats web :
{str(resultats)[:3000]}
Réponds UNIQUEMENT avec un JSON valide :
{{
  "prix_extraits": [
    {{
      "culture": "{culture}",
      "zone": "zone trouvée",
      "marche": "marché trouvé ou Inconnu",
      "prix_fcfa_kg": 000,
      "date": "YYYY-MM-DD ou Inconnu",
      "source": "URL ou nom du site"
    }}
  ]
}}
Si aucun prix trouvé : {{"prix_extraits": []}}
"""
            response = completion(
                model="groq/llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0
            )
            texte_reponse = response.choices[0].message.content.strip()
            match = re.search(r'\{.*\}', texte_reponse, re.DOTALL)
            if match:
                return match.group(0)
            return '{"prix_extraits": []}'

        except Exception as e:
            return f"Erreur scraping web : {str(e)}"

class AggregateSchema(BaseModel):
    prix_pdfs: str = Field(..., description="JSON des prix extraits des PDFs.")
    prix_web: str = Field(..., description="JSON des prix extraits du web.")
    culture: str = Field(..., description="Culture ciblée.")
    zone: str = Field(..., description="Zone ciblée.")

class AggregatePricesTool(BaseTool):
    name: str = "aggregate_prices"
    description: str = (
        "Fusionne les prix extraits des PDFs et du web, "
        "déduplique et calcule la moyenne par jour. "
        "Retourne un dataset propre prêt pour la courbe."
    )
    args_schema: Type[BaseModel] = AggregateSchema

    def _run(
        self,
        prix_pdfs: str,
        prix_web: str,
        culture: str,
        zone: str
    ) -> str:
        try:
            from collections import defaultdict

            toutes_entrees = []

            # Parse PDFs
            try:
                data_pdfs = json.loads(prix_pdfs)
                toutes_entrees.extend(
                    data_pdfs.get("prix_extraits", [])
                )
            except Exception:
                pass

            # Parse Web
            try:
                data_web = json.loads(prix_web)
                toutes_entrees.extend(
                    data_web.get("prix_extraits", [])
                )
            except Exception:
                pass

            if not toutes_entrees:
                return json.dumps({
                    "status": "VIDE",
                    "message": f"Aucun prix trouvé pour {culture} / {zone}",
                    "dataset": []
                })

            # Filtre par culture et zone
            filtrees = [
                e for e in toutes_entrees
                if culture.lower() in str(e.get("culture", "")).lower()
                and zone.lower() in str(e.get("zone", "")).lower()
                and e.get("prix_fcfa_kg", 0) > 0
            ]

            # Moyenne par date
            prix_par_date = defaultdict(list)
            for entree in filtrees:
                date = entree.get("date", "Inconnu")
                prix = entree.get("prix_fcfa_kg", 0)
                if prix > 0:
                    prix_par_date[date].append(prix)

            # Calcule moyenne et construit dataset final
            dataset = []
            for date, prix_list in sorted(prix_par_date.items()):
                dataset.append({
                    "date": date,
                    "prix_moyen_fcfa_kg": round(
                        sum(prix_list) / len(prix_list), 2
                    ),
                    "nb_sources": len(prix_list)
                })

            return json.dumps({
                "status": "OK",
                "culture": culture,
                "zone": zone,
                "total_points": len(dataset),
                "dataset": dataset
            }, ensure_ascii=False, indent=2)

        except Exception as e:
            return f"Erreur agrégation : {str(e)}"
