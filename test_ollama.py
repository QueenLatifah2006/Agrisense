import requests
import json

prompt = """
Tu es un expert en traitement du langage naturel spécialisé dans l'agriculture au Cameroun.
Analyse la phrase de l'utilisateur et extrait les entités suivantes.

Règles d'extraction :
- CULTURE : Identifie le produit agricole (ex: "Tomate", "Maïs"). Si absent, mets "Inconnu".
- ZONE : Identifie la région ou ville (ex: "Ouest", "Bafoussam"). Si absente, mets "Inconnu".
- CLIMAT : Extrait les indices climatiques si mentionnés, sinon mets "Climat normal".

Phrase de l'utilisateur : "je veux le prix du riz au littoral"

Réponds UNIQUEMENT avec ce format exact, sans accolades ni JSON, ligne par ligne :
CULTURE=le nom
ZONE=la zone
CLIMAT=le climat
"""

payload = {
    "model": "qwen2.5:3b",
    "prompt": prompt,
    "stream": False,
    "options": {
        "temperature": 0.1,
        "num_gpu": 0
    }
}

try:
    print("Envoi de la requête à Ollama...")
    res = requests.post("http://localhost:11434/api/generate", json=payload)
    print(res.status_code)
    print(res.text)
except Exception as e:
    print("Erreur:", e)
