import argparse
import sys
import os
import json
import subprocess

def transcribe(audio_path):
    try:
        # Check if file exists
        if not os.path.exists(audio_path):
            raise Exception(f"Audio file not found: {audio_path}")
            
        from faster_whisper import WhisperModel
        # Use CPU for now as default (Raspberry Pi compatible)
        model = WhisperModel("small", device="cpu", compute_type="int8")
        segments, info = model.transcribe(audio_path)
        text = " ".join([segment.text for segment in segments])
        print(json.dumps({"status": "success", "text": text.strip()}))
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))

def synthesize(text, output_path):
    try:
        model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fr_FR-siwis-low.onnx")
        model_json = model_path + ".json"
        
        if not os.path.exists(model_path):
            import urllib.request
            print("Downloading Piper TTS model for the first time...", file=sys.stderr)
            urllib.request.urlretrieve("https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR/siwis/low/fr_FR-siwis-low.onnx", model_path)
            urllib.request.urlretrieve("https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR/siwis/low/fr_FR-siwis-low.onnx.json", model_json)

        piper_exe = os.path.join(os.path.dirname(sys.executable), "piper.exe")
        if not os.path.exists(piper_exe):
            piper_exe = "piper" # fallback to PATH
            
        process = subprocess.Popen([piper_exe, "--model", model_path, "--output_file", output_path], stdin=subprocess.PIPE, stderr=subprocess.PIPE)
        _, err = process.communicate(input=text.encode('utf-8'))
        
        if process.returncode != 0:
            raise Exception(f"Piper failed: {err.decode('utf-8', errors='ignore')}")
            
        print(json.dumps({"status": "success", "file": output_path}))
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--action", choices=["transcribe", "synthesize"], required=True)
    parser.add_argument("--audio", type=str)
    parser.add_argument("--text", type=str)
    parser.add_argument("--output", type=str)
    args = parser.parse_args()

    if args.action == "transcribe":
        transcribe(args.audio)
    elif args.action == "synthesize":
        synthesize(args.text, args.output)
