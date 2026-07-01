import 'dotenv/config';
import { transcribeSpeech } from './src/services/voiceService.js';
import fs from 'fs';
import path from 'path';

async function test() {
  const audioFile = 'D:/projet_soutenance/agritechs/assets/audio_qa/Quel_est_le_prix_moyen_d_un_kilo_de_tomates_a_l_Ouest.wav';
  console.log("Transcribing file:", audioFile);
  const base64Audio = fs.readFileSync(audioFile, { encoding: 'base64' });
  // The transcribeSpeech function expects "data:audio/webm;base64,..." or just base64?
  // Let's pass the raw base64 or construct the data uri
  const uri = "data:audio/wav;base64," + base64Audio;
  const result = await transcribeSpeech(uri, "audio/wav");
  console.log("Transcription result:", result);
}

test().catch(console.error);
