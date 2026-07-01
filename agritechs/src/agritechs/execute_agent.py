import os
import sys
import json
import re
import argparse
from dotenv import load_dotenv
import litellm
from litellm import completion
import time

# Configure litellm to automatically retry on rate limits
litellm.num_retries = 5
litellm.retry_strategy = "exponential_backoff"

# --- ROBUS MONKEYPATCH FOR CREWAI GROQ BUG ---
# CrewAI has a bug (Issue #5886) where it injects 'cache_breakpoint' into system and user messages.
# Groq fails with BadRequestError because it doesn't support prompt caching.
# This monkeypatch intercept all litellm calls (sync and async) and purges the unsupported parameters safely.

original_litellm_completion = litellm.completion
original_main_completion = getattr(litellm.main, 'completion', None)
original_litellm_acompletion = getattr(litellm, 'acompletion', None)
original_main_acompletion = getattr(litellm.main, 'acompletion', None) if hasattr(litellm, 'main') else None

# Enable drop_params as well just in case LiteLLM needs to drop unsupported top-level params
try:
    litellm.drop_params = True
except Exception:
    pass

def clean_messages_inplace(messages):
    if not messages:
        return
    for msg in messages:
        if isinstance(msg, dict):
            msg.pop('cache_breakpoint', None)
            msg.pop('cache_prompt', None)
            if 'extra_body' in msg and isinstance(msg['extra_body'], dict):
                msg['extra_body'].pop('cache_breakpoint', None)
                msg['extra_body'].pop('cache_prompt', None)
        elif hasattr(msg, 'pop'):
            try:
                msg.pop('cache_breakpoint', None)
                msg.pop('cache_prompt', None)
                if hasattr(msg, 'get') and isinstance(msg.get('extra_body'), dict):
                    msg.get('extra_body').pop('cache_breakpoint', None)
                    msg.get('extra_body').pop('cache_prompt', None)
            except Exception:
                pass
        elif hasattr(msg, '__dict__'):
            try:
                if 'cache_breakpoint' in msg.__dict__:
                    del msg.__dict__['cache_breakpoint']
                if 'cache_prompt' in msg.__dict__:
                    del msg.__dict__['cache_prompt']
            except Exception:
                pass
        
        # Check standard properties as attributes
        for attr in ['cache_breakpoint', 'cache_prompt']:
            if hasattr(msg, attr):
                try:
                    setattr(msg, attr, None)
                except Exception:
                    pass

def patched_completion(*args, **kwargs):
    try:
        if 'messages' in kwargs:
            clean_messages_inplace(kwargs['messages'])
        for arg in args:
            if isinstance(arg, list):
                clean_messages_inplace(arg)
    except Exception as e:
        print(f"[Patch Info] Non-blocking warning during message cleaning: {e}", file=sys.stderr)
    return original_litellm_completion(*args, **kwargs)

async def patched_acompletion(*args, **kwargs):
    try:
        if 'messages' in kwargs:
            clean_messages_inplace(kwargs['messages'])
        for arg in args:
            if isinstance(arg, list):
                clean_messages_inplace(arg)
    except Exception as e:
        print(f"[Patch Info] Non-blocking warning during async message cleaning: {e}", file=sys.stderr)
    return await original_litellm_acompletion(*args, **kwargs)

# Apply monkeypatch globally for both sync and async
litellm.completion = patched_completion
if original_main_completion:
    litellm.main.completion = patched_completion

if original_litellm_acompletion:
    litellm.acompletion = patched_acompletion
if original_main_acompletion:
    litellm.main.acompletion = patched_acompletion
# ---------------------------------------------


# Ensure current directory and its parent directory (src/ for local dev or backend_ia/ for server) are in Python path
# This ensures imports under 'agritechs.*' or absolute imports under 'backend_ia.*' can be resolved.
_current_dir = os.path.dirname(os.path.abspath(__file__))
_parent_dir = os.path.dirname(_current_dir)
if _current_dir not in sys.path:
    sys.path.insert(0, _current_dir)
if _parent_dir not in sys.path:
    sys.path.insert(0, _parent_dir)

try:
    from crew import AgritechsCrew
except (ImportError, ModuleNotFoundError) as e:
    # If the missing module name is not our own crew module, then it is a library dependency they are missing
    if hasattr(e, 'name') and e.name not in (None, 'crew', 'agritechs', 'agritechs.crew'):
        print(f"\n[DÉPENDANCE MANQUANTE] Une bibliothèque requise par l'agent est manquante : '{e.name}'.", file=sys.stderr)
        print("Veuillez installer toutes les dépendances requises en exécutant :", file=sys.stderr)
        print("   pip install -r requirements.txt\n", file=sys.stderr)
        sys.exit(1)
    try:
        from .crew import AgritechsCrew
    except (ImportError, ModuleNotFoundError):
        try:
            from agritechs.crew import AgritechsCrew
        except (ImportError, ModuleNotFoundError):
            print("\n[CRITICAL ERROR] Impossible de charger le module 'crew.py'. Assurez-vous d'être dans le bon dossier ou d'avoir ajouté le chemin d'accès au PYTHONPATH.", file=sys.stderr)
            raise e

load_dotenv()

def extraire_parametres_depuis_phrase(phrase_utilisateur):
    """
    Analyse la phrase libre de l'utilisateur en utilisant la puissance de Groq.
    Aucun mot-clé n'est écrit en dur ici.
    """
    prompt = f"""
Tu es un expert en traitement du langage naturel spécialisé dans l'agriculture au Cameroun.
Analyse la phrase de l'utilisateur et extrait les entités suivantes sous forme de JSON strict.

Règles d'extraction :
- culture : Identifie le produit agricole (ex: "Tomate", "Maïs", "Njansang", "Gombo", "Oignon"). Si absent ou non lié à l'agriculture, mets "Inconnu".
- zone : Identifie la région ou ville du Cameroun (ex: "Ouest", "Bafoussam", "Centre", "Grand-Nord"). Si absente, mets "Inconnu".
- climat : Extrait les indices climatiques si mentionnés, sinon mets "Climat normal".

Phrase de l'utilisateur : "{phrase_utilisateur}"

Réponds UNIQUEMENT avec le JSON structuré comme ceci, sans aucune explication, sans texte autour :
{{
    "culture": "Nom détecté",
    "zone": "Zone détectée",
    "climat": "Climat détecté"
}}
"""
    if not os.environ.get("GROQ_API_KEY"):
        return {"culture": "Inconnu", "zone": "Inconnu", "climat": "Inconnu"}

    try:
        response = completion(
            model="groq/llama-3.3-70b-versatile", 
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            base_url="https://api.groq.com/openai/v1"
        )
        
        texte_brut = response.choices[0].message.content.strip()
        match = re.search(r'\{.*\}', texte_brut, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        else:
            return {"culture": "Inconnu", "zone": "Inconnu", "climat": "Inconnu"}
    except Exception as e:
        print(f"DEBUG Error extraction parameters: {e}", file=sys.stderr)
        return {"culture": "Inconnu", "zone": "Inconnu", "climat": "Inconnu"}

def run_chat_module(phrase):
    data_extraite = extraire_parametres_depuis_phrase(phrase)
    
    if data_extraite["culture"] == "Inconnu":
        return {
            "status": "warning",
            "message": "Je n'ai pas bien compris de quelle culture vous parlez. Pouvez-vous préciser ?",
            "data": None
        }

    zone_pour_ia = data_extraite["zone"]
    if zone_pour_ia == "Inconnu":
        zone_pour_ia = "Cameroun"

    inputs = {
        'phrase_utilisateur': phrase,
        'culture': data_extraite['culture'],
        'zone': zone_pour_ia,
        'climat': data_extraite['climat']
    }

    try:
        # ── Rediriger stdout → stderr pendant CrewAI ──
        real_stdout = sys.stdout
        sys.stdout = sys.stderr

        result = AgritechsCrew().crew().kickoff(inputs=inputs)

        # ── Restaurer stdout pour le JSON final ──
        sys.stdout = real_stdout

        final_markdown = result.raw if hasattr(result, 'raw') else str(result)
        
        if final_markdown.startswith("```markdown"):
            final_markdown = final_markdown.replace("```markdown", "", 1).rstrip("```")
        elif final_markdown.startswith("```"):
            final_markdown = final_markdown.replace("```", "", 1).rstrip("```")
            
        return {
            "status": "success",
            "result": final_markdown.strip(),
            "extracted_parameters": inputs
        }
    except Exception as e:
        sys.stdout = real_stdout  # Toujours restaurer même en cas d'erreur
        return {
            "status": "error",
            "message": f"Erreur lors de l'exécution de l'IA : {str(e)}",
            "data": None
        }


def run_prices_module(culture, zone, marche, date_debut, date_fin):
    inputs = {
        "culture": culture or "Tomate",
        "zone": zone or "Ouest",
        "marche": marche or "Inconnu",
        "date_debut": date_debut or "2026-04-01",
        "date_fin": date_fin or "2026-04-30",
    }

    try:
        # ── Rediriger stdout → stderr pendant CrewAI ──
        real_stdout = sys.stdout
        sys.stdout = sys.stderr

        result = AgritechsCrew().crew_prix().kickoff(inputs=inputs)

        # ── Restaurer stdout ──
        sys.stdout = real_stdout

        final_output = result.raw if hasattr(result, 'raw') else str(result)
        
        clean = final_output.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        
        try:
            data = json.loads(clean.strip())
            return {"status": "success", "data": data}
        except Exception:
            return {"status": "success", "raw_result": final_output, "data": None}

    except Exception as e:
        sys.stdout = real_stdout
        return {
            "status": "error",
            "message": f"Erreur lors de l'extraction des prix: {str(e)}",
            "data": None
        }

def main():
    parser = argparse.ArgumentParser(description="Agritechs IA Agent Execution Bridge")
    parser.add_argument("--module", choices=["chat", "prices"], required=True, help="Module model type to call")
    parser.add_argument("--phrase", type=str, help="Text query to ask the chat agent (For chat module)")
    parser.add_argument("--culture", type=str, help="Culture targeted (For prices module)")
    parser.add_argument("--zone", type=str, help="Zone targeted (For prices module)")
    parser.add_argument("--marche", type=str, help="Market targeted (For prices module)")
    parser.add_argument("--date_debut", type=str, help="Start Date YYYY-MM-DD (For prices module)")
    parser.add_argument("--date_fin", type=str, help="End Date YYYY-MM-DD (For prices module)")

    args = parser.parse_args()

    if args.module == "chat":
        if not args.phrase:
            print(json.dumps({"status": "error", "message": "Missing required field: --phrase"}))
            sys.exit(1)
        res = run_chat_module(args.phrase)
        print(json.dumps(res, ensure_ascii=False, indent=2))
        
    elif args.module == "prices":
        res = run_prices_module(
            args.culture, 
            args.zone, 
            args.marche, 
            args.date_debut, 
            args.date_fin
        )
        print(json.dumps(res, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()