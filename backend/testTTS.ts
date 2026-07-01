import { generateTTSCloudinary } from './src/services/voiceService.js';
import 'dotenv/config';

async function run() {
  console.log('Testing TTS...');
  const url = await generateTTSCloudinary('Bonjour ceci est un test de la voix de IA. Il fait très beau.');
  console.log('Result URL:', url);
}

run();
