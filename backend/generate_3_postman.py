import base64
import json
import os

audio_dir = r'D:\projet_soutenance\agritechs\assets\audio_qa'
output_dir = r'D:\projet_soutenance\backend'

files = [
    ("Dans_quelle_ville_puis_je_vendre_toute_ma_production_d_oignons_et_réaliser_un_bénéfice.wav", "postman_test_oignons.json"),
    ("Quel_est_le_prix_moyen_d_un_kilo_de_tomates_a_l_Ouest.wav", "postman_test_tomates.json"),
    ("Quelle_est_la_bonne_période_pour_cultiver_le_maïs_dans_la_zone_du_Nord.wav", "postman_test_mais.json")
]

for audio_file, json_file in files:
    audio_path = os.path.join(audio_dir, audio_file)
    json_path = os.path.join(output_dir, json_file)
    
    with open(audio_path, "rb") as f:
        encoded_string = base64.b64encode(f.read()).decode('utf-8')
        
    data = {
        "message": "Audio en langue locale",
        "isAudio": True,
        "audio": f"data:audio/wav;base64,{encoded_string}"
    }
    
    with open(json_path, "w", encoding='utf-8') as f:
        json.dump(data, f, indent=2)
        
    print(f"Created {json_file}")
