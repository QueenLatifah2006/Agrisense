import { matchLocalLanguageAudio } from './src/services/aiService.js';
import path from 'path';

async function test() {
  const audioFile = 'D:/projet_soutenance/agritechs/assets/audio_qa/Quel_est_le_prix_moyen_d_un_kilo_de_tomates_a_l_Ouest.wav';
  console.log("Testing matcher for:", audioFile);
  const result = await matchLocalLanguageAudio(audioFile);
  console.log("Result:", result);
}

test().catch(console.error);
