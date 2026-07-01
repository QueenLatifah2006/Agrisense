import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

def upload_pdfs_as_raw():
    dossier = "pdfs_temp"
    
    if not os.path.exists(dossier):
        print(f"❌ Dossier '{dossier}' introuvable.")
        return
    
    pdfs = [f for f in os.listdir(dossier) if f.endswith(".pdf")]
    
    if not pdfs:
        print("❌ Aucun PDF trouvé dans pdfs_temp/")
        return
    
    print(f"✅ {len(pdfs)} PDFs trouvés dans {dossier}/\n")
    
    for filename in pdfs:
        filepath = os.path.join(dossier, filename)
        public_id = f"knowledgebase/{os.path.splitext(filename)[0]}"
        
        print(f"📤 Upload : {filename}")
        try:
            result = cloudinary.uploader.upload(
                filepath,
                public_id=public_id,
                resource_type="raw",  # ✅ RAW = téléchargeable sans restriction
                overwrite=True
            )
            print(f"   ✅ OK : {result['secure_url']}")
        except Exception as e:
            print(f"   ❌ Échec : {e}")
    
    print(f"\n🎉 Upload terminé !")

if __name__ == "__main__":
    upload_pdfs_as_raw()