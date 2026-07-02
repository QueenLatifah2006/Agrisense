import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

/**
 * Checks if Cloudinary is fully configured in current environment
 */
export const getCloudinaryConfigured = (): boolean => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Uploads an in-memory PDF (base64 encoded) to Cloudinary in a specific folder
 * 
 * @param pdfBufferBase64 Base64 string of the PDF content
 * @param fileName Target filename
 * @param folder Target folder inside Cloudinary (e.g. 'note', 'message', 'article', 'knowledgebase')
 * @returns Cloudinary secure secure_url
 */
export const uploadPdfToCloudinary = async (
  pdfBufferBase64: string, 
  fileName: string, 
  folder: 'note' | 'article' | 'knowledgebase' | 'conversation' = 'note',
  isDraft: boolean = false
): Promise<string> => {
  if (!getCloudinaryConfigured()) {
    console.warn('[CloudinaryService] Cloudinary keys not found. Fallback to simulation URL.');
    // Simulated live secure link conforming to Cloudinary formatting
    const cleanedName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '');
    const prefix = isDraft ? 'home/draft/' : 'home/';
    return `https://res.cloudinary.com/agrisense-knowledge/image/upload/v1717246800/${prefix}${folder}/${cleanedName}`;
  }

  try {
    const dataUri = `data:application/pdf;base64,${pdfBufferBase64}`;
    const targetPublicId = isDraft 
      ? `home/draft/${folder}/${fileName.replace('.pdf', '')}`
      : `home/${folder}/${fileName.replace('.pdf', '')}`;

    const uploadOptions: any = {
      resource_type: 'raw',
      public_id: targetPublicId,
      access_mode: 'public',
    };

    if (isDraft) {
      uploadOptions.tags = ['draft'];
    }

    const result = await cloudinary.uploader.upload(dataUri, uploadOptions);
    
    console.log(`[CloudinaryService] Successfully uploaded PDF to Cloudinary! Draft: ${isDraft}, Folder: ${folder}, URL: ${result.secure_url}`);
    return result.secure_url;
  } catch (error: any) {
    console.error('[CloudinaryService] Cloudinary upload exception details:', error);
    throw new Error(`Échec de la synchronisation vers le cloud Cloudinary (${folder}): ${error.message || error}`);
  }
};

/**
 * Uploads an audio file (base64 encoded) to Cloudinary
 * 
 * @param audioBase64 Base64 string of the audio content
 * @param mimeType Mime type of the audio (e.g. audio/webm)
 * @param fileName Target filename
 * @returns Cloudinary secure secure_url
 */
export const uploadAudioToCloudinary = async (
  audioBase64: string, 
  mimeType: string = 'audio/webm',
  fileName: string
): Promise<string> => {
  if (!getCloudinaryConfigured()) {
    console.warn('[CloudinaryService] Cloudinary keys not found. Fallback to simulation URL.');
    return `https://res.cloudinary.com/demo/video/upload/v1689255877/sample_audio.mp3`;
  }

  try {
    let cleanBase64 = audioBase64;
    if (cleanBase64.includes('base64,')) {
      cleanBase64 = cleanBase64.split('base64,')[1];
    }
    const dataUri = `data:${mimeType};base64,${cleanBase64}`;
    
    const result = await cloudinary.uploader.upload(dataUri, {
      resource_type: 'video', // Audio uses the 'video' resource type in Cloudinary
      public_id: `home/conversation/audios/${fileName.replace(/\.[^/.]+$/, '')}`,
      access_mode: 'public',
    });
    
    console.log(`[CloudinaryService] Successfully uploaded Audio to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  } catch (error: any) {
    console.error('[CloudinaryService] Cloudinary audio upload exception details:', error);
    throw new Error(`Échec de l'upload audio vers Cloudinary: ${error.message || error}`);
  }
};
