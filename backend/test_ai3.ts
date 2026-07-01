import fs from 'fs';
import path from 'path';
import { matchLocalLanguageAudio } from './src/services/aiService.js';

async function run() {
  const jsonPath = path.resolve('D:/projet_soutenance/backend/postman_test.json');
  const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const audio = payload.audio;
  const base64Data = audio.replace(/^data:audio\/\w+;base64,/, "");
  
  const tempFilePath = path.resolve('temp_test.wav');
  fs.writeFileSync(tempFilePath, base64Data, 'base64');
  
  console.log("Matching temp file...");
  const matchResult = await matchLocalLanguageAudio(tempFilePath);
  console.log("Match Result:", matchResult);
}

run().catch(console.error);
