import fs from 'fs';
import path from 'path';

export const getCloudinaryConfigured = (): boolean => {
  return false;
};

export const uploadPdfToCloudinary = async (
  pdfBufferBase64: string, 
  fileName: string, 
  folder: 'note' | 'article' | 'knowledgebase' | 'conversation' = 'note',
  isDraft: boolean = false
): Promise<string> => {
  try {
    const cleanedName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '');
    const prefix = isDraft ? 'draft/' : '';
    const targetPath = path.join(__dirname, `../../public/uploads/${prefix}${folder}/${cleanedName}`);
    
    if (!fs.existsSync(path.dirname(targetPath))) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    }
    
    const buffer = Buffer.from(pdfBufferBase64, 'base64');
    fs.writeFileSync(targetPath, buffer);
    
    // We assume backend is running on port 3000
    // This allows the mobile app to fetch the PDF over the local network (replace localhost with Pi's IP on deployment)
    const url = `http://localhost:3000/uploads/${prefix}${folder}/${cleanedName}`;
    console.log(`[LocalStorage] Successfully saved PDF: ${url}`);
    return url;
  } catch (error: any) {
    console.error('[LocalStorage] PDF save exception details:', error);
    throw new Error(`Échec de la sauvegarde locale du PDF (${folder}): ${error.message || error}`);
  }
};

export const uploadAudioToCloudinary = async (
  audioBase64: string, 
  mimeType: string = 'audio/webm',
  fileName: string
): Promise<string> => {
  try {
    let cleanBase64 = audioBase64;
    if (cleanBase64.includes('base64,')) {
      cleanBase64 = cleanBase64.split('base64,')[1];
    }
    
    const targetPath = path.join(__dirname, `../../public/uploads/conversation/audios/${fileName.replace(/\.[^/.]+$/, '.webm')}`);
    
    if (!fs.existsSync(path.dirname(targetPath))) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    }
    
    const buffer = Buffer.from(cleanBase64, 'base64');
    fs.writeFileSync(targetPath, buffer);
    
    const url = `http://localhost:3000/uploads/conversation/audios/${fileName.replace(/\.[^/.]+$/, '.webm')}`;
    console.log(`[LocalStorage] Successfully saved Audio: ${url}`);
    return url;
  } catch (error: any) {
    console.error('[LocalStorage] Audio save exception details:', error);
    throw new Error(`Échec de la sauvegarde locale audio: ${error.message || error}`);
  }
};
