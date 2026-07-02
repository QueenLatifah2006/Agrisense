import os
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"
os.environ["ANONYMIZED_TELEMETRY"] = "False"
import sys
import librosa
import torch
from transformers import Wav2Vec2Processor, Wav2Vec2Model
import chromadb

def main():
    # Directory containing pre-recorded questions
    audio_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'audio_qa')
    
    if not os.path.exists(audio_dir):
        print(f"Le dossier {audio_dir} n'existe pas. Creation en cours...")
        os.makedirs(audio_dir, exist_ok=True)
        print("Veuillez y placer vos fichiers .wav locaux (ex: question_fulfulde_01.wav)")
        return

    wav_files = [f for f in os.listdir(audio_dir) if f.endswith('.wav')]
    if not wav_files:
        print("Aucun fichier .wav trouve dans le dossier assets/audio_qa")
        return

    print("Chargement du modele Wav2Vec2...")
    
    local_model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'wav2vec2-base')
    if os.path.exists(local_model_path) and os.path.exists(os.path.join(local_model_path, 'config.json')):
        print("Chargement depuis le dossier local...")
        model_name = local_model_path
    else:
        print("Veuillez patienter quelques minutes pendant le telechargement (environ 360 Mo) la toute premiere fois...")
        model_name = "facebook/wav2vec2-base"
        
    processor = Wav2Vec2Processor.from_pretrained(model_name)
    model = Wav2Vec2Model.from_pretrained(model_name)

    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'knowledge')
    client = chromadb.PersistentClient(path=db_path)
    collection = client.get_or_create_collection(name="local_audio_qa", metadata={"hnsw:space": "cosine"})

    for wav_file in wav_files:
        file_path = os.path.join(audio_dir, wav_file)
        print(f"Traitement de {wav_file}...")
        
        # Determine metadata based on filename convention or hardcoded logic
        # Determine metadata based on filename convention
        # If the question is 'prix_djindja.wav', the response should be placed in backend/public/uploads/conversation/audios/reponse_prix_djindja.wav
        response_url = f"http://localhost:3000/uploads/conversation/audios/reponse_{wav_file}"
        
        try:
            speech, rate = librosa.load(file_path, sr=16000)
            input_values = processor(speech, return_tensors="pt", sampling_rate=16000).input_values
            
            with torch.no_grad():
                outputs = model(input_values)
                embedding = outputs.last_hidden_state.mean(dim=1).squeeze().numpy().tolist()
                
            # Upsert into ChromaDB
            collection.upsert(
                ids=[wav_file],
                embeddings=[embedding],
                metadatas=[{
                    "response_audio_url": response_url,
                    "language": "local"
                }]
            )
            print(f"✅ {wav_file} enregistre avec succes.")
        except Exception as e:
            print(f"❌ Erreur lors du traitement de {wav_file} : {e}")

    print("Termine. La base de donnees d'empreintes audios est a jour.")

if __name__ == "__main__":
    main()
