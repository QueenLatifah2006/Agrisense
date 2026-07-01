import os
import chromadb
import json

db_path = r'D:\projet_soutenance\agritechs\src\knowledge'
client = chromadb.PersistentClient(path=db_path)
collection = client.get_collection(name="local_audio_qa")

results = collection.get(include=["metadatas"])
for i, meta in enumerate(results['metadatas']):
    print(f"Item {i+1}:")
    print(json.dumps(meta, indent=2))
