import * as googleTTS from 'google-tts-api';
import { uploadAudioToCloudinary } from './cloudinaryService.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const ENGINE_PATH = path.join(process.cwd(), 'src/services/localVoiceEngine.py');
// On gère la différence entre Windows (local) et Linux (Serveur Render/Docker)
const isWindows = process.platform === 'win32';
const PYTHON_BIN = path.join(process.cwd(), isWindows ? '../agritechs/.venv/Scripts/python.exe' : '../agritechs/.venv/bin/python');

export async function transcribeSpeech(base64Audio: string, mimeType: string = 'audio/webm'): Promise<string> {
  if (!base64Audio) throw new Error('No audio content provided for transcription.');
  
  let cleanBase64 = base64Audio;
  if (cleanBase64.includes('base64,')) cleanBase64 = cleanBase64.split('base64,')[1];
  
  const buffer = Buffer.from(cleanBase64, 'base64');
  const tempAudioPath = path.join(process.cwd(), `temp_${randomUUID()}.webm`);
  
  fs.writeFileSync(tempAudioPath, buffer);
  
  return new Promise((resolve, reject) => {
    const process = spawn(PYTHON_BIN, [ENGINE_PATH, '--action', 'transcribe', '--audio', tempAudioPath]);
    
    let stdoutData = '';
    process.stdout.on('data', (data) => { stdoutData += data.toString(); });
    
    process.on('close', (code) => {
      fs.unlinkSync(tempAudioPath); // Cleanup
      
      try {
        const lines = stdoutData.trim().split('\n');
        const jsonLine = lines[lines.length - 1]; // Parse the last line as JSON
        const result = JSON.parse(jsonLine);
        
        if (result.status === 'success') resolve(result.text);
        else reject(new Error(result.message));
      } catch (e) {
        reject(new Error('Failed to parse local STT response: ' + stdoutData));
      }
    });
  });
}

export async function synthesizeSpeech(text: string): Promise<string> {
  return 'client-synth';
}

export async function generateTTSCloudinary(text: string): Promise<string> {
  if (!text) return '';
  
  const sanitizedText = text.replace(/[*#~_]/g, ' ').replace(/[’‘`]/g, "'").replace(/https?:\/\/[^\s]+/g, 'lien web').trim();
  
  const tempAudioPath = path.join(process.cwd(), `public/uploads/tts_${randomUUID()}.wav`);
  // S'assurer que le dossier uploads existe
  if (!fs.existsSync(path.dirname(tempAudioPath))) {
    fs.mkdirSync(path.dirname(tempAudioPath), { recursive: true });
  }
  
  return new Promise((resolve, reject) => {
    const process = spawn(PYTHON_BIN, [ENGINE_PATH, '--action', 'synthesize', '--text', sanitizedText, '--output', tempAudioPath]);
    
    let stdoutData = '';
    process.stdout.on('data', (data) => { stdoutData += data.toString(); });
    
    process.on('close', (code) => {
      try {
        const lines = stdoutData.trim().split('\n');
        const jsonLine = lines[lines.length - 1];
        const result = JSON.parse(jsonLine);
        
        if (result.status === 'success') {
          // On lit le fichier généré pour le retourner en base64
          const audioBuffer = fs.readFileSync(tempAudioPath);
          const base64Audio = audioBuffer.toString('base64');
          fs.unlinkSync(tempAudioPath); // On peut supprimer si on retourne du base64
          resolve(`data:audio/wav;base64,${base64Audio}`);
        }
        else resolve(''); // Fallback silence in case of failure
      } catch (e) {
        console.error('TTS error', e);
        resolve('');
      }
    });
  });
}
