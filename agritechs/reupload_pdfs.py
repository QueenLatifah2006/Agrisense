import cloudinary
import cloudinary.api
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

def reupload_pdfs_as_raw():
    print("📋 Récupération des PDFs existants (type image)...")
    
    result = cloudinary.api.resources(
        type="upload",
        resource_type="image",
        max_results=500
    )
    pdfs = [r for r in result.get("resources", []) if r.get("format") == "pdf"]
    
    print(f"✅ {len(pdfs)} PDFs trouvés\n")
    
    import requests
    import tempfile

    for resource in pdfs:
        public_id = resource["public_id"]
        filename = public_id.split("/")[-1] + ".pdf"
        
        print(f"🔄 Traitement : {filename}")
        
        try:
            # Télécharge via l'API admin Cloudinary (authentifié)
            url = f"https://api.cloudinary.com/v1_1/{os.getenv('CLOUDINARY_CLOUD_NAME')}/image/download"
            response = requests.get(
                url,
                params={"public_id": public_id},
                auth=(os.getenv("CLOUDINARY_API_KEY"), os.getenv("CLOUDINARY_API_SECRET")),
                timeout=60
            )
            
            if response.status_code != 200:
                print(f"   ❌ Téléchargement échoué : {response.status_code}")
                continue
            
            # Sauvegarde temporaire
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(response.content)
                tmp_path = tmp.name
            
            # Re-upload en resource_type=raw
            upload_result = cloudinary.uploader.upload(
                tmp_path,
                public_id=f"knowledgebase/{public_id.split('/')[-1]}",
                resource_type="raw",
                overwrite=True
            )
            
            os.unlink(tmp_path)
            print(f"   ✅ Re-uploadé : {upload_result['secure_url']}")
            
        except Exception as e:
            print(f"   ❌ Erreur : {e}")

if __name__ == "__main__":
    reupload_pdfs_as_raw()