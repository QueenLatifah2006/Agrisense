import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { askConseillerAgent, getAggregatedPrices, matchLocalLanguageAudio } from '../services/aiService.js';
import { query } from '../config/db.js';
import { jsPDF } from 'jspdf';
import { uploadPdfToCloudinary, uploadAudioToCloudinary } from '../services/cloudinaryService.js';
import { transcribeSpeech, generateTTSCloudinary } from '../services/voiceService.js';

/**
 * Handle POST /api/ai/chat
 */
export const chatWithCrew = async (req: Request, res: Response) => {
  let { message } = req.body;
  const { audio, isAudio, mimeType } = req.body;
  let { chatId } = req.body;

  let isLocalMatch = false;
  let localAudioUrl: string | null = null;
  let aiResultText = '';
  let aiResponse: any = { status: 'success' };

  if (isAudio && audio) {
    try {
      console.log('[AI-Controller] Voice query detected. Checking for local language match...');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const base64Data = audio.replace(/^data:audio\/\w+;base64,/, "");
      const tempDir = path.resolve(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      let ext = 'webm';
      if (mimeType.includes('wav')) ext = 'wav';
      else if (mimeType.includes('mp3')) ext = 'mp3';
      else if (mimeType.includes('m4a')) ext = 'm4a';
      else if (mimeType.includes('ogg')) ext = 'ogg';

      const tempFileBase = path.join(tempDir, `local_audio_${Date.now()}`);
      const tempFilePathRaw = `${tempFileBase}.${ext}`;
      const tempFilePathWav = `${tempFileBase}.wav`;
      
      fs.writeFileSync(tempFilePathRaw, base64Data, 'base64');
      
      let finalAudioPath = tempFilePathRaw;
      
      if (ext !== 'wav') {
        try {
          const ffmpegStatic = await import('ffmpeg-static');
          const ffmpegPath = ffmpegStatic.default;
          if (ffmpegPath) {
             const { execSync } = await import('child_process');
             execSync(`"${ffmpegPath}" -i "${tempFilePathRaw}" -ar 16000 -ac 1 "${tempFilePathWav}"`, { stdio: 'ignore' });
             finalAudioPath = tempFilePathWav;
          }
        } catch (e) {
          console.warn('[AI-Controller] Failed to convert audio using ffmpeg:', e);
        }
      }
      
      const matchResult = await matchLocalLanguageAudio(finalAudioPath);
      
      if (fs.existsSync(tempFilePathRaw)) fs.unlinkSync(tempFilePathRaw);
      if (finalAudioPath !== tempFilePathRaw && fs.existsSync(finalAudioPath)) {
        fs.unlinkSync(finalAudioPath);
      }
      
      if (matchResult.match && matchResult.response_url) {
        console.log(`[AI-Controller] Local audio matched! Confidence: ${matchResult.confidence}, Distance: ${matchResult.distance}`);
        isLocalMatch = true;
        localAudioUrl = matchResult.response_url;
        message = "Audio en langue locale (Question Reconnue)";
        aiResultText = "Voici la réponse pré-enregistrée à votre question en langue locale.";
        aiResponse.message = aiResultText;
        aiResponse.result = aiResultText;
        aiResponse.audioUrl = localAudioUrl;
      } else {
        console.log(`[AI-Controller] No local match found (Distance was ${matchResult.distance}). Transcribing using Whisper (Fallback)...`);
        message = await transcribeSpeech(audio, mimeType || 'audio/webm');
        console.log(`[AI-Controller] Voice query transcribed to: "${message}"`);
      }
    } catch (voiceErr: any) {
      console.error('[AI-Controller] Audio processing/transcription failed:', voiceErr);
      return res.status(500).json({ message: 'Erreur lors du traitement de votre message vocal.' });
    }
  }

  if (!message) {
    return res.status(400).json({ message: 'Le paramètre "message" ou "audio" est requis.' });
  }

  try {
    const userId = (req as any).user?.id;
    
    if (!isLocalMatch) {
      console.log(`[AI-Controller] Querying chat crew with message: "${message}"`);
      try {
        const cropsRes = await query('SELECT * FROM crops ORDER BY created_at DESC');
        const cropsContext = JSON.stringify(cropsRes.rows);
      } catch (err) {
        console.error('[AI-Controller] Error loading crops for chat context:', err);
      }

      aiResponse = await askConseillerAgent(message);

      if (aiResponse.status === 'error') {
        return res.status(500).json({ 
          message: aiResponse.message || 'Une erreur est survenue lors de l\'interrogation de l\'IA.' 
        });
      }

      aiResultText = aiResponse.result || aiResponse.message || '';
    }

    // Sauvegarder l'historique du chat si l'utilisateur est connecté
    if (userId) {
      try {
        if (chatId) {
          const chatCheck = await query(
            'SELECT id FROM chat_history WHERE id = $1 AND user_id = $2',
            [chatId, userId]
          );
          if (chatCheck.rows.length === 0) {
            chatId = null;
          }
        }

        if (!chatId) {
          const title = message.length > 45 ? `${message.substring(0, 42).trim()}...` : message;
          const newChatResult = await query(
            'INSERT INTO chat_history (user_id, title, last_message) VALUES ($1, $2, $3) RETURNING id',
            [userId, title, aiResultText]
          );
          chatId = newChatResult.rows[0].id;
        } else {
          await query(
            'UPDATE chat_history SET last_message = $1, created_at = CURRENT_TIMESTAMP WHERE id = $2',
            [aiResultText, chatId]
          );
        }

        let audioUrlVal = null;
        let aiAudioUrlVal = null;

        if (isAudio && audio) {
          try {
            const fileName = `voice_${userId}_${Date.now()}`;
            audioUrlVal = await uploadAudioToCloudinary(audio, mimeType || 'audio/webm', fileName);
          } catch (err) {
            console.error('[AI-Controller] Failed to upload audio to Cloudinary:', err);
            audioUrlVal = 'voice'; // Fallback
          }

          if (isLocalMatch && localAudioUrl) {
            // Use the predefined response URL directly without generating TTS
            aiAudioUrlVal = localAudioUrl;
          } else {
            // Generate TTS for AI response since the user sent an audio message and no local match was found
            try {
              aiAudioUrlVal = await generateTTSCloudinary(aiResultText);
            } catch (ttsErr) {
              console.error('[AI-Controller] Failed to generate TTS:', ttsErr);
            }
          }
        }
        
        await query(
          'INSERT INTO messages (chat_id, sender, content, audio_url) VALUES ($1, $2, $3, $4)',
          [chatId, 'user', message, audioUrlVal]
        );
        await query(
          'INSERT INTO messages (chat_id, sender, content, audio_url) VALUES ($1, $2, $3, $4)',
          [chatId, 'ai', aiResultText, aiAudioUrlVal]
        );

        console.log(`[AI-Controller] Messages enregistrés : user_id=${userId}, chat_id=${chatId}`);
        (aiResponse as any).chatId = chatId;
        if (aiAudioUrlVal) {
          (aiResponse as any).audioUrl = aiAudioUrlVal;
        }
      } catch (historyErr) {
        console.error('[AI-Controller] Impossible d\'enregistrer l\'historique :', historyErr);
      }
    }

    res.json({
      ...aiResponse,
      queryMessage: message
    });
  } catch (error) {
    console.error('[AI-Controller] Chat error:', error);
    res.status(500).json({ message: "Erreur interne du serveur lors de l'appel de l'agent IA." });
  }
};

/**
 * Handle GET /api/ai/chats
 */
export const getUserChats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé.' });
    }

    const result = await query(
      'SELECT id, title, last_message, created_at FROM chat_history WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('[AI-Controller] Error fetching user chats:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique.' });
  }
};

/**
 * Handle GET /api/ai/chats/:chatId/messages
 */
export const getChatMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { chatId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé.' });
    }

    const chatCheck = await query(
      'SELECT id FROM chat_history WHERE id = $1 AND user_id = $2',
      [chatId, userId]
    );
    if (chatCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Conversation non trouvée.' });
    }

    const result = await query(
      'SELECT id, sender, content, audio_url, created_at FROM messages WHERE chat_id = $1 ORDER BY created_at ASC',
      [chatId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('[AI-Controller] Error fetching chat messages:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des messages.' });
  }
};



/**
 * Handle POST /api/ai/prices-dataset
 */
export const fetchCrewPrices = async (req: Request, res: Response) => {
  const { culture, zone, marche, date_debut, date_fin } = req.body;

  if (!culture || !zone) {
    return res.status(400).json({ message: 'Les paramètres "culture" et "zone" sont obligatoires.' });
  }

  try {
    console.log(`[AI-Controller] Agrégation des prix pour : "${culture}" / "${zone}"`);

    let aiDataset: any[] = [];
    // Essayer d'abord l'agent Python CrewAI
    try {
      const aiResponse = await getAggregatedPrices({ culture, zone, marche, date_debut, date_fin });
      if (
        aiResponse &&
        aiResponse.status === 'success' &&
        aiResponse.data &&
        aiResponse.data.dataset &&
        aiResponse.data.dataset.length > 0
      ) {
        aiDataset = aiResponse.data.dataset;
      }
    } catch (err) {
      console.warn('[AI-Controller] CrewAI indisponible, bascule partielle sur PostgreSQL :', err);
    }

    console.log('[AI-Controller] Récupération des données réelles depuis PostgreSQL (farmer_notes & crops)...');

    // Récupérer depuis farmer_notes
    const notesCheck = await query(
      `SELECT price, recorded_at, zone FROM farmer_notes
       WHERE crop_name ILIKE $1 AND zone ILIKE $2
       AND status = 'validated'`,
      [`%${culture}%`, `%${zone}%`]
    );

    // Récupérer depuis crops en utilisant aussi le marché si fourni
    let cropsQuery = `SELECT price, price_recorded_date AS recorded_at, area AS zone, market FROM crops WHERE name ILIKE $1`;
    let cropsParams: any[] = [`%${culture}%`];
    
    if (marche) {
      cropsQuery += ` AND market ILIKE $2`;
      cropsParams.push(`%${marche}%`);
    } else {
      cropsQuery += ` AND (area ILIKE $2 OR market ILIKE $2)`;
      cropsParams.push(`%${zone}%`);
    }

    const cropsCheck = await query(cropsQuery, cropsParams);

    let sqlDataset: any[] = [];
    const allSqlRows = [...notesCheck.rows, ...cropsCheck.rows];
    
    // Renvoyer les points bruts sans faire de moyenne
    for (const row of allSqlRows) {
      if (!row.price || !row.recorded_at) continue;
      
      let dateObj;
      if (typeof row.recorded_at === 'string') {
        let cleanDate = row.recorded_at.replace('_', ' ').replace('h', ':');
        dateObj = new Date(cleanDate);
      } else {
        dateObj = row.recorded_at;
      }
      
      if (isNaN(dateObj.getTime())) continue;

      // Filter by date_debut and date_fin
      if (date_debut) {
        const dDebut = new Date(date_debut);
        if (!isNaN(dDebut.getTime()) && dateObj.getTime() < dDebut.getTime()) continue;
      }
      if (date_fin) {
        const dFin = new Date(date_fin);
        if (!isNaN(dFin.getTime()) && dateObj.getTime() > dFin.getTime()) continue;
      }

      sqlDataset.push({
        date: dateObj.toISOString(),
        prix_moyen_fcfa_kg: Number(row.price),
        nb_sources: 1,
        source: 'terrain'
      });
    }

    if (aiDataset.length === 0 && sqlDataset.length === 0) {
      return res.json({
        status: 'VIDE',
        culture,
        zone,
        total_points: 0,
        dataset: [],
        message: `Aucune donnée de prix enregistrée pour "${culture}" dans la zone "${zone}".`
      });
    }

    // FUSION des datasets (IA + SQL) : on concatène tout simplement pour le ScatterPlot
    const finalDataset = [...aiDataset, ...sqlDataset].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return res.json({
      status: 'OK',
      culture,
      zone,
      total_points: finalDataset.length,
      dataset: finalDataset
    });

  } catch (error) {
    console.error('[AI-Controller] Price aggregation error:', error);
    res.status(500).json({ message: 'Erreur interne lors de la génération du dataset de prix.' });
  }
};

// Helper function to generate PDF from chat messages history
const generateChatPDF = (
  chatId: number, 
  user: { name: string; domain: string; location: string }, 
  title: string, 
  messages: Array<{ sender: string; content: string; created_at: Date }>
): string => {
  const doc = new jsPDF();
  
  // Document Brand Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 115, 60); // Forest green Agrisense theme
  doc.text('AGRISENSE IA - DIALOGUE DE TERRAIN CERTIFIÉ', 15, 22);
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(15, 26, 195, 26);
  
  // Metadata Section
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(`Identifiant Chat : AGRISENSE-CHAT-${chatId}`, 15, 33);
  doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 15, 39);
  doc.text(`Utilisateur / Agriculteur : ${user.name}`, 15, 45);
  doc.text(`Sujet de discussion : ${title}`, 15, 51);
  doc.text(`Localisation : ${user.location || user.domain || 'Non spécifiée'}`, 15, 57);
  
  doc.line(15, 62, 195, 62);
  
  // Chat History heading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 115, 60);
  doc.text('HISTORIQUE DES ÉCHANGES (TEXTES & AUDIOS TRANSCRITS)', 15, 70);
  doc.line(15, 72, 195, 72);
  
  // Content loop
  let currentY = 80;
  const pageHeight = doc.internal.pageSize.height || 297;
  
  doc.setFontSize(9.5);
  for (const msg of messages) {
    // Check page overflow
    if (currentY > pageHeight - 30) {
      doc.addPage();
      currentY = 20;
    }
    
    const senderLabel = msg.sender === 'user' ? `${user.name} :` : 'Assistant IA :';
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(msg.sender === 'user' ? 30 : 15, msg.sender === 'user' ? 41 : 115, msg.sender === 'user' ? 59 : 60);
    doc.text(senderLabel, 15, currentY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    const textLines = doc.splitTextToSize(msg.content || '', 170);
    doc.text(textLines, 20, currentY + 5);
    
    currentY += 5 + (textLines.length * 5) + 5; // Spacing for next message
  }
  
  // Footer
  const footerY = doc.internal.pageSize.height - 20;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, footerY - 5, 195, footerY - 5);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 120, 120);
  doc.text('Ce rapport de conversation a été archivé pour validation et analyse sémantique AgriSense IA.', 15, footerY);
  
  const apiDataUri = doc.output('datauristring');
  const base64Index = apiDataUri.indexOf('base64,');
  if (base64Index !== -1) {
    return apiDataUri.substring(base64Index + 7);
  }
  return Buffer.from(doc.output('arraybuffer')).toString('base64');
};

/**
 * Periodically closes inactive conversations (30 minutes) and uploads draft PDF to Cloudinary
 */
export const closeInactiveChats = async () => {
  try {
    console.log('[Scheduler] Scanning for inactive chats to archive (30 min threshold)...');
    
    // Select chats that are active and have not been updated for 30 minutes
    const inactiveChats = await query(
      `SELECT id, user_id, title, created_at FROM chat_history
       WHERE status = 'active'
       AND created_at < NOW() - INTERVAL '30 minutes'`
    );

    if (inactiveChats.rows.length === 0) {
      console.log('[Scheduler] No inactive chats found.');
      return;
    }

    console.log(`[Scheduler] Found ${inactiveChats.rows.length} inactive chats to archive.`);

    for (const chat of inactiveChats.rows) {
      const chatId = chat.id;
      const userId = chat.user_id;

      // 1. Fetch user profile
      const userRes = await query('SELECT name, domain, location FROM users WHERE id = $1', [userId]);
      if (userRes.rows.length === 0) continue;
      const user = userRes.rows[0];

      // 2. Fetch all messages in chat
      const msgRes = await query(
        'SELECT sender, content, created_at FROM messages WHERE chat_id = $1 ORDER BY created_at ASC',
        [chatId]
      );
      const messages = msgRes.rows;

      if (messages.length === 0) {
        // Empty chat, just archive it directly
        await query("UPDATE chat_history SET status = 'pending' WHERE id = $1", [chatId]);
        continue;
      }

      // 3. Extract culture and zone (use user location/domain as fallback)
      const cleanUser = user.name.replace(/[^a-zA-Z0-9]/g, '');
      const cleanZone = (user.location || user.domain || 'Yaounde').replace(/[^a-zA-Z0-9]/g, '');
      const cleanTitle = chat.title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20) || 'Conversations';
      const dateStr = new Date().toISOString().split('T')[0];

      const pdfName = `Conversation_${cleanUser}_${cleanTitle}_${cleanZone}_${dateStr}.pdf`;

      // 4. Generate PDF
      const base64Pdf = generateChatPDF(chatId, user, chat.title, messages);

      // 5. Upload PDF as draft to Cloudinary
      let cloudinaryUrl = '';
      try {
        cloudinaryUrl = await uploadPdfToCloudinary(base64Pdf, pdfName, 'conversation', true); // isDraft = true
      } catch (uploadErr) {
        console.error(`[Scheduler] Cloudinary upload failed for chat ${chatId}:`, uploadErr);
        cloudinaryUrl = `https://res.cloudinary.com/agrisense-knowledge/image/upload/v1717246800/draft/conversation/${pdfName}`;
      }

      // 6. Update chat_history status and cloudinary_url in DB
      await query(
        "UPDATE chat_history SET status = 'pending', cloudinary_url = $1 WHERE id = $2",
        [cloudinaryUrl, chatId]
      );

      console.log(`[Scheduler] Chat ${chatId} automatically closed and uploaded to Cloudinary: ${cloudinaryUrl}`);
    }
  } catch (error) {
    console.error('[Scheduler] Error archiving inactive chats:', error);
  }
};

/**
 * PUT /api/ai/chats/:chatId/validate
 * SuperAdmin validation endpoint to promote draft chat PDF to official conversation PDF
 */
export const validateChat = async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const userRole = (req as any).user?.role;

  if (userRole !== 'superadmin' && userRole !== 'admin') {
    return res.status(403).json({ message: 'Seul le Super Admin peut valider les rapports de conversations.' });
  }

  try {
    const chatRes = await query('SELECT * FROM chat_history WHERE id = $1', [chatId]);
    if (chatRes.rows.length === 0) {
      return res.status(404).json({ message: 'Conversation non trouvée.' });
    }
    const chat = chatRes.rows[0];

    // Fetch user profile
    const userRes = await query('SELECT name, domain, location FROM users WHERE id = $1', [chat.user_id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur associé à la conversation introuvable.' });
    }
    const user = userRes.rows[0];

    // Fetch all messages
    const msgRes = await query(
      'SELECT sender, content, created_at FROM messages WHERE chat_id = $1 ORDER BY created_at ASC',
      [chatId]
    );
    const messages = msgRes.rows;

    const cleanUser = user.name.replace(/[^a-zA-Z0-9]/g, '');
    const cleanZone = (user.location || user.domain || 'Yaounde').replace(/[^a-zA-Z0-9]/g, '');
    const cleanTitle = chat.title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20) || 'Conversation';
    const dateStr = new Date().toISOString().split('T')[0];

    const pdfName = `Conversation_${cleanUser}_${cleanTitle}_${cleanZone}_${dateStr}.pdf`;

    // Regenerate final certified PDF
    const base64Pdf = generateChatPDF(Number(chatId), user, chat.title, messages);

    // Upload final PDF to Cloudinary (isDraft = false)
    let finalCloudinaryUrl = '';
    try {
      console.log(`[aiController] Uploading final certified conversation PDF: ${pdfName}...`);
      finalCloudinaryUrl = await uploadPdfToCloudinary(base64Pdf, pdfName, 'conversation', false); // isDraft = false
    } catch (pdfErr) {
      console.error('[aiController] Certified PDF Cloudinary upload exception:', pdfErr);
      finalCloudinaryUrl = `https://res.cloudinary.com/agrisense-knowledge/image/upload/v1717246800/conversation/${pdfName}`;
    }

    // Update status and URL in DB
    await query(
      "UPDATE chat_history SET status = 'validated', cloudinary_url = $1 WHERE id = $2",
      [finalCloudinaryUrl, chatId]
    );

    res.json({
      success: true,
      message: 'La conversation a été officiellement validée par le Super Admin et archivée sur Cloudinary.',
      chatId,
      cloudinaryUrl: finalCloudinaryUrl
    });
  } catch (error) {
    console.error('Error validating chat:', error);
    res.status(500).json({ message: 'Erreur interne lors de la validation du rapport de conversation.' });
  }
};

/**
 * GET /api/ai/chats/all
 * Retrieve all chats history for superadmin validation review
 */
export const getAllChats = async (req: Request, res: Response) => {
  const userRole = (req as any).user?.role;

  if (userRole !== 'superadmin' && userRole !== 'admin') {
    return res.status(403).json({ message: 'Seul l\'administrateur peut lister toutes les conversations.' });
  }

  try {
    const result = await query(
      `SELECT ch.id, ch.user_id, ch.title, ch.last_message, ch.status, ch.cloudinary_url, ch.created_at, u.name as user_name
       FROM chat_history ch
       JOIN users u ON ch.user_id = u.id
       ORDER BY ch.created_at DESC`
    );

    const mapped = result.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      title: row.title,
      lastMessage: row.last_message,
      status: row.status,
      cloudinaryUrl: row.cloudinary_url,
      createdAt: row.created_at
    }));

    res.json(mapped);
  } catch (error) {
    console.error('[AI-Controller] Error fetching all chats:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'ensemble des conversations.' });
  }
};

export const rejectChat = async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const userRole = (req as any).user?.role;

  if (userRole !== 'superadmin' && userRole !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé. Droits administrateur requis.' });
  }

  try {
    const checkChat = await query('SELECT * FROM chat_history WHERE id = $1', [chatId]);
    if (checkChat.rows.length === 0) {
      return res.status(404).json({ message: 'Conversation introuvable.' });
    }

    await query('UPDATE chat_history SET status = $1 WHERE id = $2', ['rejected', chatId]);

    res.json({ success: true, message: 'La conversation a été rejetée avec succès.' });
  } catch (error) {
    console.error('Error rejecting chat:', error);
    res.status(500).json({ message: 'Erreur lors du rejet de la conversation' });
  }
};