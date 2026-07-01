import sys
import os
import json
import re
from dotenv import load_dotenv
from litellm import completion
from agritechs.crew import AgritechsCrew

# 🔥 FORCE LE CHARGEMENT DE TA CLÉ GROQ DEPUIS LE FICHIER .ENV
load_dotenv()

# Forcer l'affichage sous Windows
if sys.platform == "win32":
    os.system('chcp 65001 > nul')

def extraire_parametres_depuis_phrase(phrase_utilisateur):
    """
    Analyse la phrase libre de l'utilisateur en utilisant la puissance de Openrouter.
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
    
    # Vérification de sécurité pour toi dans le terminal
    if not os.environ.get("GROQ_API_KEY"):
        print("❌ Erreur critique : La clé GROQ_API_KEY n'est pas détectée dans l'environnement !")
        print("Vérifie que ton fichier .env contient bien GROQ_API_KEY=...")

    try:
        # Appel à Groq (ultra-rapide)
        response = completion(
            model="groq/llama-3.3-70b-versatile", 
            messages=[{"role": "user", "content": prompt}],
            temperature=0,  # Garde le modèle super précis et factuel
            base_url="https://api.groq.com/openai/v1"
        )
        
        texte_brut = response.choices[0].message.content.strip()
        
        # Isolation du JSON par Regex pour éviter les lignes parasites
        match = re.search(r'\{.*\}', texte_brut, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        else:
            raise ValueError(f"le model n'a pas renvoyé un format JSON valide. Réponse reçue : {texte_brut}")
            
    except Exception as e:
        print(f"\n❌ Erreur technique lors de l'appel à Groq : {e}")
        # On renvoie Inconnu pour bloquer proprement sans faire crasher tout le script Python
        return {"culture": "Inconnu", "zone": "Inconnu", "climat": "Inconnu"}

def run():
    print("==================================================================")
    print(" 🌾 ASSISTANT AGRITECHS V 0.1 : Analyse IA Intégrale ")
    print("==================================================================\n")
    
    phrase = input("💬 Que souhaitez-vous savoir ?\n👉 Votre demande : ").strip()
    
    if not phrase:
        print("❌ Vous n'avez rien écrit.")
        return

    print("\n🧠 Analyse sémantique en cours ...")
    data_extraite = extraire_parametres_depuis_phrase(phrase)
    
    # MODIFICATION ICI : On ne bloque plus si la zone est Inconnue
    if data_extraite["culture"] == "Inconnu":
        print(f"\n⚠️ Je n'ai pas bien compris de quelle culture vous parlez.")
        return

    # Si la zone est inconnue, on met une valeur par défaut pour ne pas faire planter le SQL
    zone_pour_ia = data_extraite["zone"]
    if zone_pour_ia == "Inconnu":
        print("ℹ️ Note : Vous n'avez pas précisé de zone, je vais chercher des informations générales.")
        zone_pour_ia = "Cameroun" # Valeur par défaut pour la recherche

    inputs = {
        'phrase_utilisateur': phrase,
        'culture': data_extraite['culture'],
        'zone': zone_pour_ia, # On utilise la zone corrigée
        'climat': data_extraite['climat']
    }
    
    print(f"\n✅ Analyse validée ! [Culture: {inputs['culture']} | Zone: {inputs['zone']}]")

    print("🔍 Lancement de vos agents CrewAI (Recherche SQL & Rédaction)...\n")
    
    # Exécution du Crew
    result = AgritechsCrew().crew().kickoff(inputs=inputs)
    
    # Nettoyage de la sortie finale
    final_markdown = result.raw if hasattr(result, 'raw') else str(result)
    if final_markdown.startswith("```markdown"):
        final_markdown = final_markdown.replace("```markdown", "", 1).rstrip("```")
    elif final_markdown.startswith("```"):
        final_markdown = final_markdown.replace("```", "", 1).rstrip("```")
        
    print("\n==================================================")
    print("📄 RAPPORT DE CONSEIL GÉNÉRÉ :")
    print("==================================================\n")
    print(final_markdown.strip())
    
    return final_markdown.strip()

if __name__ == "__main__":
    run()