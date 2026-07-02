import * as googleTTS from 'google-tts-api';
import { uploadAudioToCloudinary } from './cloudinaryService.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

/**
 * Transcribes user voice recording to text using Whisper via Groq API.
 * 
 * @param base64Audio Base64-encoded audio data
 * @param mimeType Audio MIME type (e.g. 'audio/webm', 'audio/wav', 'audio/m4a')
 * @returns Transcribed text in French
 */
export async function transcribeSpeech(base64Audio: string, mimeType: string = 'audio/webm'): Promise<string> {
  if (!base64Audio) {
    throw new Error('No audio content provided for transcription.');
  }

  // Clean mime type
  let formattedMimeType = mimeType;
  if (formattedMimeType.includes(';')) {
    formattedMimeType = formattedMimeType.split(';')[0];
  }

  // Extract clean base64 if it has standard data-uri prefix headers
  let cleanBase64 = base64Audio;
  if (cleanBase64.includes('base64,')) {
    cleanBase64 = cleanBase64.split('base64,')[1];
  }

  // 1. Try Whisper on Groq if configured
  if (GROQ_API_KEY) {
    console.log('[VoiceService] Transcribing speech using Whisper via Groq API...');
    try {
      // Decode base64 to binary buffer
      const buffer = Buffer.from(cleanBase64, 'base64');
      
      // Construct form-data manually for lightweight fetch without requiring complex packages
      const boundary = '----WebKitFormBoundaryAgrisenseChatVoiceUpload' + Math.random().toString(36).substring(2);
      
      // Guess extension
      let ext = 'webm';
      if (formattedMimeType.includes('wav')) ext = 'wav';
      else if (formattedMimeType.includes('mp3')) ext = 'mp3';
      else if (formattedMimeType.includes('m4a')) ext = 'm4a';
      else if (formattedMimeType.includes('ogg')) ext = 'ogg';

      const filename = `recording.${ext}`;

      // Build multipart request body containing file block, model, and language filters
      const header = 
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
        `Content-Type: ${formattedMimeType}\r\n\r\n`;
      
      const middle = 
        `\r\n--${boundary}\r\n` +
        `Content-Disposition: form-data; name="model"\r\n\r\n` +
        `whisper-large-v3-turbo\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="language"\r\n\r\n` +
        `fr\r\n` +
        `--${boundary}--\r\n`;

      const body = Buffer.concat([
        Buffer.from(header, 'utf-8'),
        buffer,
        Buffer.from(middle, 'utf-8')
      ]);

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`[VoiceService] Groq Whisper transcription successful: "${result.text}"`);
        return result.text || '';
      } else {
        const errText = await response.text();
        console.warn('[VoiceService] Groq Whisper transcription request failed:', errText);
      }
    } catch (err) {
      console.warn('[VoiceService] Groq Whisper transcription encountered an exception:', err);
    }
  } else {
    console.warn('[VoiceService] GROQ_API_KEY is missing in your environment variables.');
    throw new Error("GROQ_API_KEY est manquante. La transcription vocale n'est pas possible.");
  }

  throw new Error("Échec de la transcription vocale.");
}
/**
 * Synthesizes assistant's response text to Speech by returning client-synth instruction.
 * We delegate TTS entirely to the native client-side speech synthesis (such as mobile device engines).
 * 
 * @param text The text response to synthesize
 * @returns 'client-synth' code for local device speech synthesis
 */
export async function synthesizeSpeech(text: string): Promise<string> {
  if (!text) {
    throw new Error('No text provided for synthesis.');
  }

  console.log('[VoiceService] Returning metadata to delegate speech synthesis to the native mobile device.');
  return 'client-synth';
}

export async function generateTTSCloudinary(text: string): Promise<string> {
  if (!text) return '';

  // Nettoyage du texte pour éviter que le TTS lise les caractères markdown ou de ponctuation bizarre
  const sanitizedText = text
    .replace(/[*#~]/g, '') // Enlever le markdown (on garde le _ pour le remplacer par un espace)
    .replace(/_/g, ' ') // Remplacer les tirets bas par des espaces
    .replace(/[’‘`]/g, "'") // Standardiser les apostrophes
    .replace(/\s+'\s+/g, "'") // Enlever les espaces autour des apostrophes
    .replace(/https?:\/\/[^\s]+/g, 'lien web') // Remplacer les URL
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Enlever la syntaxe lien markdown
    .replace(/\b[A-Z]{5,}\b/g, (match) => match.toLowerCase()) // Mettre en minuscules les mots de plus de 4 lettres en MAJ pour éviter l'épellation
    .trim();

  console.log('[VoiceService] Generating TTS for text length:', sanitizedText.length);
  try {
    const chunks = await googleTTS.getAllAudioBase64(sanitizedText, {
      lang: 'fr',
      slow: false,
      host: 'https://translate.google.com',
      splitPunct: ',.?',
    });

    const buffers = chunks.map(chunk => Buffer.from(chunk.base64, 'base64'));
    const finalBuffer = Buffer.concat(buffers);
    const finalBase64 = finalBuffer.toString('base64');
    
    return `data:audio/mp3;base64,${finalBase64}`;
  } catch (error) {
    console.error('[VoiceService] Error generating TTS:', error);
    return '';
  }
}
