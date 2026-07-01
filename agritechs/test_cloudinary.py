import cloudinary
import cloudinary.api
import os
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

print("=== TEST prefix knowledgebase ===")
result = cloudinary.api.resources(
    type="upload",
    resource_type="image",
    prefix="knowledgebase",
    max_results=10
)
print(f"Résultats : {len(result.get('resources', []))}")
for r in result.get("resources", []):
    print(f"  → {r['public_id']} | format: {r.get('format')}")

print("\n=== TEST sans prefix (tous les PDFs) ===")
result2 = cloudinary.api.resources(
    type="upload",
    resource_type="image",
    max_results=50
)
pdfs = [r for r in result2.get("resources", []) if r.get("format") == "pdf"]
print(f"PDFs trouvés : {len(pdfs)}")
for r in pdfs:
    print(f"  → public_id : '{r['public_id']}'")