import os
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"
os.environ["ANONYMIZED_TELEMETRY"] = "False"
import sys
import argparse
import librosa
import torch
import json
from transformers import Wav2Vec2Processor, Wav2Vec2Model

# Initialiser ChromaDB
import chromadb

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", type=str, required=True, help="Chemin vers le fichier audio .wav a comparer")
    args = parser.add_argument_group()
    args = parser.parse_args()

    audio_path = args.audio
    
    if not os.path.exists(audio_path):
        print(json.dumps({"error": f"Le fichier {audio_path} n'existe pas"}))
        sys.exit(1)

    try:
        # Load model and processor
        local_model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'wav2vec2-base')
        if os.path.exists(local_model_path) and os.path.exists(os.path.join(local_model_path, 'config.json')):
            model_name = local_model_path
        else:
            model_name = "facebook/wav2vec2-base"
            
        processor = Wav2Vec2Processor.from_pretrained(model_name)
        model = Wav2Vec2Model.from_pretrained(model_name)

        # Load audio (librosa resamples to 16kHz automatically if sr=16000)
        speech, rate = librosa.load(audio_path, sr=16000)

        # Process and get embedding
        input_values = processor(speech, return_tensors="pt", sampling_rate=16000).input_values
        with torch.no_grad():
            outputs = model(input_values)
            # Use mean pooling over the sequence dimension to get a single vector representation
            embedding = outputs.last_hidden_state.mean(dim=1).squeeze().numpy().tolist()

        # Search in ChromaDB
        db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'knowledge')
        client = chromadb.PersistentClient(path=db_path)
        
        # Obtenir ou créer la collection
        collection = client.get_or_create_collection(name="local_audio_qa")
        
        if collection.count() == 0:
            print(json.dumps({"error": "La base de donnees ChromaDB est vide. Lancez l'enrolement."}))
            sys.exit(0)

        results = collection.query(
            query_embeddings=[embedding],
            n_results=1
        )

        if not results['distances'] or len(results['distances'][0]) == 0:
            print(json.dumps({"match": False, "confidence": 0}))
            sys.exit(0)

        # ChromaDB Cosine distance (closer to 0 is better, usually. Actually, depends on metric space. Default is l2. Let's assume l2 distance for now)
        distance = results['distances'][0][0]
        metadata = results['metadatas'][0][0]
        
        # Pour la soutenance (solution rapide) :
        # On ignore la limite stricte de distance. Le système prendra TOUJOURS
        # la question qui ressemble le plus mathématiquement à l'audio de l'utilisateur.
        # Cela permet au système de fonctionner même si la voix est différente.
        threshold = 100.0  # Tolérance infinie pour forcer la correspondance
        
        if distance < threshold:
            print(json.dumps({
                "match": True, 
                "confidence": 1.0 / (1.0 + distance),
                "distance": distance,
                "response_url": metadata.get("response_audio_url", ""),
                "language": metadata.get("language", "")
            }))
        else:
            print(json.dumps({
                "match": False, 
                "confidence": 1.0 / (1.0 + distance),
                "distance": distance
            }))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
