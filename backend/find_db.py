import os
import chromadb

paths = [
    r'D:\projet_soutenance\agritechs\knowledge',
    r'D:\projet_soutenance\agritechs\src\knowledge',
    r'D:\projet_soutenance\agritechs\src\agritechs\knowledge',
    r'D:\projet_soutenance\backend\knowledge'
]

for p in paths:
    if os.path.exists(p):
        print(f"\nChecking {p}")
        try:
            client = chromadb.PersistentClient(path=p)
            colls = client.list_collections()
            for c in colls:
                if c.name == 'local_audio_qa':
                    print(f"Collection local_audio_qa found in {p} with count {c.count()}")
        except Exception as e:
            print("Error:", e)
