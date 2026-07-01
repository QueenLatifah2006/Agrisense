import json
import re

transcript_path = r'C:\Users\PC\.gemini\antigravity\brain\7a2d8167-863c-44fe-a592-91656048b5d9\.system_generated\logs\transcript_full.jsonl'
output_json_path = r'D:\projet_soutenance\backend\postman_test.json'

base64_str = ""

try:
    with open(transcript_path, 'r', encoding='utf-8') as f:
        for line in f:
            data = json.loads(line)
            if data.get('type') == 'USER_INPUT':
                content = data.get('content', '')
                if 'UklGRngSCwBXQVZFZm10IBAAAAABAAEAgLsAAAB3AQACABAATElTVBoAAABJTkZPSVNGVA0AAABM' in content:
                    # Match everything after 'ceci (' until the closing ')'
                    match = re.search(r'par ceci \((UklGRng.*?)\)', content, re.DOTALL)
                    if match:
                        base64_str = match.group(1).replace('\n', '').replace('\r', '').replace(' ', '')
                    else:
                        match2 = re.search(r'(UklGRng[A-Za-z0-9+/=\n\r ]+)', content, re.DOTALL)
                        if match2:
                            base64_str = match2.group(1).replace('\n', '').replace('\r', '').replace(' ', '')

    if base64_str:
        print(f"Found base64 string of length {len(base64_str)}")
        
        postman_data = {
            "message": "Audio en langue locale",
            "isAudio": True,
            "audio": f"data:audio/wav;base64,{base64_str}"
        }
        
        with open(output_json_path, 'w', encoding='utf-8') as f:
            json.dump(postman_data, f, indent=2)
            
        print("Successfully recreated postman_test.json!")
    else:
        print("Base64 string not found in transcript.")

except Exception as e:
    print(f"Error: {e}")
