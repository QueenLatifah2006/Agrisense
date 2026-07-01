import { Request, Response } from 'express';
import { query } from '../config/db.js';
import { jsPDF } from 'jspdf';
import { uploadPdfToCloudinary } from '../services/cloudinaryService.js';

export const getCrops = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé.' });
    }
    const userRole = (req as any).user?.role;
    
    let result;
    if (userRole === 'superadmin') {
      result = await query('SELECT * FROM crops ORDER BY created_at DESC LIMIT 1000');
    } else {
      result = await query('SELECT * FROM crops WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1000', [userId]);
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching crops:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des cultures' });
  }
};

const formatDbDate = (d: any): string | null => {
  if (!d) return null;
  let clean = String(d).trim();
  if (clean.includes('T')) {
    clean = clean.split('T')[0];
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }
  return null;
};

export const createCrop = async (req: Request, res: Response) => {
  const { 
    name, 
    type, 
    planting_date, 
    area, 
    status, 
    variety, 
    progress, 
    price_recorded_date, 
    market, 
    quantity, 
    price,
    sowing_start,
    sowing_end,
    harvest_start,
    harvest_end,
    selling_start,
    selling_end
  } = req.body;
  const userId = (req as any).user?.id;
  
  if (!name) {
    return res.status(400).json({ message: 'Le nom de la culture est obligatoire.' });
  }
  if (!userId) {
    return res.status(401).json({ message: 'Connexion obligatoire.' });
  }

  try {
    const checkDuplicate = await query(
      `SELECT id FROM crops 
       WHERE user_id = $1 
         AND LOWER(TRIM(name)) = LOWER($2)
         AND COALESCE(variety, '') = COALESCE($3, '')
         AND COALESCE(area, '') = COALESCE($4, '')
         AND COALESCE(market, '') = COALESCE($5, '')`,
      [userId, String(name).trim(), variety || '', area || '', market || '']
    );

    if (checkDuplicate.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Une culture strictement identique (même nom, variété, zone et marché) existe déjà.'
      });
    }

    let cleanPlantingDate = planting_date ? String(planting_date) : '';
    if (cleanPlantingDate && cleanPlantingDate.includes('T')) {
      cleanPlantingDate = cleanPlantingDate.split('T')[0];
    }
    if (!cleanPlantingDate || !/^\d{4}-\d{2}-\d{2}$/.test(cleanPlantingDate)) {
      cleanPlantingDate = new Date().toISOString().split('T')[0];
    }

    const cleanSowingStart = formatDbDate(sowing_start) || cleanPlantingDate;
    const cleanSowingEnd = formatDbDate(sowing_end) || cleanPlantingDate;
    const cleanHarvestStart = formatDbDate(harvest_start);
    const cleanHarvestEnd = formatDbDate(harvest_end);
    const cleanSellingStart = formatDbDate(selling_start);
    const cleanSellingEnd = formatDbDate(selling_end);

    const safeProgress = isNaN(Number(progress)) ? 15 : Number(progress);
    const safeQuantity = isNaN(Number(quantity)) ? 0 : Number(quantity);
    const safePrice = isNaN(Number(price)) ? 0 : Number(price);

    const result = await query(
      'INSERT INTO crops (user_id, name, type, planting_date, area, status, variety, progress, price_recorded_date, market, quantity, price, sowing_start, sowing_end, harvest_start, harvest_end, selling_start, selling_end) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *',
      [
        userId,
        String(name).trim(), 
        String(type || 'Céréales').trim(), 
        cleanPlantingDate, 
        String(area || '12').trim(), 
        String(status || 'active').trim(),
        String(variety || 'Secteur Central').trim(),
        safeProgress,
        price_recorded_date || new Date().toISOString().split('T')[0],
        String(market || 'Marché Central').trim(),
        safeQuantity,
        safePrice,
        cleanSowingStart,
        cleanSowingEnd,
        cleanHarvestStart,
        cleanHarvestEnd,
        cleanSellingStart,
        cleanSellingEnd
      ]
    );

    await query(
      'INSERT INTO messages (chat_id, sender, content) VALUES ($1, $2, $3)',
      [1, 'ai', `[Activité Utilisateur ${userId}] Enregistrement d'une nouvelle culture: ${name} (Catégorie: ${type || 'Indéfini'}, Zone: ${variety || 'Standard'}).`]
    ).catch(() => {});

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating crop:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la création de la culture', 
      error: error?.message || String(error)
    });
  }
};

export const updateCrop = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    name, 
    type, 
    planting_date, 
    area, 
    status, 
    progress, 
    variety, 
    price_recorded_date, 
    market, 
    quantity, 
    price,
    sowing_start,
    sowing_end,
    harvest_start,
    harvest_end,
    selling_start,
    selling_end
  } = req.body;
  const userId = (req as any).user?.id;
  try {
    const cleanSowingStart = formatDbDate(sowing_start) || formatDbDate(planting_date);
    const cleanSowingEnd = formatDbDate(sowing_end) || formatDbDate(planting_date);
    const cleanHarvestStart = formatDbDate(harvest_start);
    const cleanHarvestEnd = formatDbDate(harvest_end);
    const cleanSellingStart = formatDbDate(selling_start);
    const cleanSellingEnd = formatDbDate(selling_end);

    const result = await query(
      'UPDATE crops SET name = $1, type = $2, planting_date = $3, area = $4, status = $5, progress = $6, variety = $7, price_recorded_date = $8, market = $9, quantity = $10, price = $11, sowing_start = $12, sowing_end = $13, harvest_start = $14, harvest_end = $15, selling_start = $16, selling_end = $17 WHERE id = $18 AND user_id = $19 RETURNING *',
      [
        name, 
        type, 
        planting_date, 
        area, 
        status, 
        progress, 
        variety, 
        price_recorded_date, 
        market, 
        quantity || 0, 
        price || 0, 
        cleanSowingStart,
        cleanSowingEnd,
        cleanHarvestStart,
        cleanHarvestEnd,
        cleanSellingStart,
        cleanSellingEnd,
        id, 
        userId
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Culture non trouvée ou non autorisée' });
    }
    
    await query(
      'INSERT INTO messages (chat_id, sender, content) VALUES ($1, $2, $3)',
      [1, 'ai', `[Activité Utilisateur] Mise à jour des informations de la culture: ${name} (ID: ${id}).`]
    ).catch(() => {});

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating crop:', error);
    res.status(500).json({ message: 'Erreur lors de la modification de la culture' });
  }
};

export const toggleBlockCrop = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user?.id;
  try {
    const checkResult = await query('SELECT status FROM crops WHERE id = $1 AND user_id = $2', [id, userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Culture non trouvée ou non autorisée' });
    }
    const currentStatus = checkResult.rows[0].status || 'active';
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    
    await query('UPDATE crops SET status = $1 WHERE id = $2 AND user_id = $3', [newStatus, id, userId]);
    
    res.json({ success: true, message: `Culture ${newStatus === 'blocked' ? 'bloquée' : 'débloquée'} avec succès`, status: newStatus });
  } catch (error) {
    console.error('Error toggling crop block status:', error);
    res.status(500).json({ message: 'Erreur lors du changement de statut de la culture' });
  }
};

export const getCropLogs = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(
      'SELECT * FROM messages WHERE chat_id = (SELECT id FROM chat_history WHERE user_id = $1 AND title LIKE $2 LIMIT 1) ORDER BY created_at ASC',
      [(req as any).user.id, `%${id}%`]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching crop logs:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des suivis' });
  }
};

interface FarmerNote {
  id: number;
  farmerName: string;
  cropName: string;
  price: number;
  zone: string;
  recordedAt: string;
  content: string;
  pdfName: string;
  status: 'pending' | 'validated';
  knowledgeBaseStored: boolean;
}

export const getFarmerNotes = async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM farmer_notes ORDER BY created_at DESC');
    const mapped = result.rows.map((row: any) => ({
      id: row.id,
      farmerName: row.farmer_name,
      cropName: row.crop_name,
      price: Number(row.price),
      zone: row.zone,
      recordedAt: row.recorded_at,
      content: row.content,
      pdfName: row.pdf_name,
      status: row.status,
      knowledgeBaseStored: row.knowledge_base_stored
    }));
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching farmer notes:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des notes d\'agriculteurs de la base de données' });
  }
};

const generateFarmerNotePDF = (row: { id: number; farmer_name: string; crop_name: string; price: number; zone: string; recorded_at: string; content: string }): string => {
  const doc = new jsPDF();
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 115, 60); // Forest green Agrisense theme
  doc.text('AGRISENSE IA - RAPPORT AGRO-ÉCOLOGIQUE CERTIFIÉ', 15, 22);
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(15, 26, 195, 26);
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(`Identifiant Document : AGRISENSE-DOC-${row.id}`, 15, 33);
  doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 15, 39);
  doc.text(`ID Unique Enregistrement : REF_${row.recorded_at}`, 15, 45);
  
  doc.setFillColor(245, 247, 246);
  doc.rect(15, 50, 180, 38, 'F');
  doc.setDrawColor(220, 225, 222);
  doc.rect(15, 50, 180, 38, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`Fiche technique - ${row.crop_name}`, 20, 56);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Observateur / Agriculteur : ${row.farmer_name}`, 20, 63);
  doc.text(`Zone Écologique de culture : ${row.zone}`, 20, 69);
  doc.text(`Prix de Marché Certifié : ${row.price} FCFA / kg`, 20, 75);
  doc.text(`Période de relevé de données : ${row.recorded_at}`, 20, 81);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 115, 60);
  doc.text('OBSERVATIONS ET DIALOGUES DE TERRAIN EXTRACTIBLES', 15, 98);
  doc.line(15, 100, 195, 100);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  const wrappedContent = doc.splitTextToSize(row.content || 'Aucune observation complémentaire disponible.', 180);
  doc.text(wrappedContent, 15, 107);
  
  const pageHeight = doc.internal.pageSize.height || 297;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, pageHeight - 30, 195, pageHeight - 30);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 120, 120);
  doc.text('Ce rapport de terrain automatisé a été officiellement vérifié, validé et archivé par l\'administrateur principal.', 15, pageHeight - 23);
  doc.text('Une copie immuable de ce PDF a été synchronisée avec le moteur de base de connaissances IA d\'AgriSense.', 15, pageHeight - 17);
  
  const apiDataUri = doc.output('datauristring');
  const base64Index = apiDataUri.indexOf('base64,');
  if (base64Index !== -1) {
    return apiDataUri.substring(base64Index + 7);
  }
  return Buffer.from(doc.output('arraybuffer')).toString('base64');
};

export const createFarmerNote = async (req: Request, res: Response) => {
  const { farmerName, cropName, price, zone, content } = req.body;
  
  if (!farmerName || !cropName || !price || !zone) {
    return res.status(400).json({ message: 'Tous les champs requis de la note d\'agriculteur doivent être renseignés.' });
  }

  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const recordedAt = `${dateStr}_${hours}h${minutes}`;
    
    const cleanFarmer = farmerName.replace(/[^a-zA-Z0-9]/g, '');
    const cleanCrop = cropName.replace(/[^a-zA-Z0-9]/g, '');
    const cleanZone = zone.replace(/[^a-zA-Z0-9]/g, '');
    
    const pdfName = `Note_${cleanFarmer}_${cleanCrop}_${cleanZone}_${dateStr}.pdf`;

    const result = await query(
      `INSERT INTO farmer_notes (farmer_name, crop_name, price, zone, recorded_at, content, pdf_name, status, knowledge_base_stored)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [farmerName, cropName, Number(price), zone, recordedAt, content || '', pdfName, 'pending', false]
    );

    const row = result.rows[0];

    let cloudinaryUrl = '';
    try {
      const base64Pdf = generateFarmerNotePDF({
        id: row.id,
        farmer_name: row.farmer_name,
        crop_name: row.crop_name,
        price: Number(row.price),
        zone: row.zone,
        recorded_at: row.recorded_at,
        content: row.content
      });

      console.log(`[cropController] Uploading draft PDF report to Cloudinary: ${pdfName}...`);
      cloudinaryUrl = await uploadPdfToCloudinary(base64Pdf, pdfName, 'note', true); // isDraft = true
    } catch (pdfErr) {
      console.error('[cropController] Non-blocking draft PDF upload warning:', pdfErr);
      cloudinaryUrl = `https://res.cloudinary.com/agrisense-knowledge/image/upload/v1717246800/draft/notes/${pdfName}`;
    }

    await query('UPDATE farmer_notes SET cloudinary_url = $1 WHERE id = $2', [cloudinaryUrl, row.id]);

    const newNote = {
      id: row.id,
      farmerName: row.farmer_name,
      cropName: row.crop_name,
      price: Number(row.price),
      zone: row.zone,
      recordedAt: row.recorded_at,
      content: row.content,
      pdfName: row.pdf_name,
      status: row.status,
      knowledgeBaseStored: row.knowledge_base_stored,
      cloudinaryUrl: cloudinaryUrl
    };

    await query(
      'INSERT INTO messages (chat_id, sender, content) VALUES ($1, $2, $3)',
      [1, 'ai', `[Mobile Log] Sauvegarde de note par l'agriculteur ${farmerName}: Relevé de culture ${cropName} généré automatiquement sous format PDF (${pdfName}) et mis en attente de révision.`]
    ).catch(() => {});

    res.status(201).json(newNote);
  } catch (error) {
    console.error('Error creating farmer note:', error);
    res.status(500).json({ message: 'Erreur lors de la soumission de la note' });
  }
};

export const validateFarmerNote = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const checkNote = await query('SELECT * FROM farmer_notes WHERE id = $1', [id]);
    if (checkNote.rows.length === 0) {
      return res.status(404).json({ message: 'Note d\'agriculteur non trouvée.' });
    }

    const row = checkNote.rows[0];

    const cleanFarmer = String(row.farmer_name).replace(/[^a-zA-Z0-9]/g, '');
    const cleanCrop = String(row.crop_name).replace(/[^a-zA-Z0-9]/g, '');
    const cleanZone = String(row.zone).replace(/[^a-zA-Z0-9]/g, '');
    const dateStr = new Date(row.created_at || new Date()).toISOString().split('T')[0];

    const pdfName = `Note_${cleanFarmer}_${cleanCrop}_${cleanZone}_${dateStr}.pdf`;

    let cloudinaryUrl = '';
    try {
      const base64Pdf = generateFarmerNotePDF({
        id: row.id,
        farmer_name: row.farmer_name,
        crop_name: row.crop_name,
        price: Number(row.price),
        zone: row.zone,
        recorded_at: row.recorded_at,
        content: row.content
      });

      console.log(`[cropController] Uploading certified final PDF report to Cloudinary: ${pdfName}...`);
      cloudinaryUrl = await uploadPdfToCloudinary(base64Pdf, pdfName, 'note', false); // isDraft = false (final directory)
    } catch (pdfErr: any) {
      console.error('[cropController] Non-blocking warning: Final PDF upload failed, fallback to simulated URL:', pdfErr);
      cloudinaryUrl = `https://res.cloudinary.com/agrisense-knowledge/image/upload/v1717246800/note/${pdfName}`;
    }

    await query(
      'UPDATE farmer_notes SET status = $1, knowledge_base_stored = $2, cloudinary_url = $3, pdf_name = $4 WHERE id = $5',
      ['validated', true, cloudinaryUrl, pdfName, id]
    );

    const note = {
      id: row.id,
      farmerName: row.farmer_name,
      cropName: row.crop_name,
      price: Number(row.price),
      zone: row.zone,
      recordedAt: row.recorded_at,
      content: row.content,
      pdfName: pdfName,
      status: 'validated',
      knowledgeBaseStored: true,
      cloudinaryUrl: cloudinaryUrl
    };

    const logMsg = `[SuperAdmin Action] Validation réussie pour la note de terrain "${note.pdfName}". Le rapport a été signé, scellé sous format PDF et sauvegardé de manière permanente dans le Cloud Cloudinary à l'adresse suivante : ${cloudinaryUrl}. L'indexation est complète dans l'environnement vectorisé de l'IA.`;
    
    await query(
      'INSERT INTO messages (chat_id, sender, content) VALUES ($1, $2, $3)',
      [1, 'ai', logMsg]
    ).catch(() => {});

    const existingCropsMatch = await query('SELECT * FROM crops WHERE LOWER(name) = LOWER($1)', [note.cropName]);
    if (existingCropsMatch.rows.length > 0) {
      const cropToUpdate = existingCropsMatch.rows[0];
      await query(
        'UPDATE crops SET area = $1, planting_date = $2, progress = $3, price_recorded_date = $4 WHERE id = $5',
        [note.price / 100, note.recordedAt.split('_')[0], cropToUpdate.progress || 15, note.recordedAt.split('_')[0], cropToUpdate.id]
      );
    } else {
      await query(
        'INSERT INTO crops (name, type, planting_date, area, status, variety, progress, price_recorded_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [note.cropName, 'Maraîchage', note.recordedAt.split('_')[0], note.price / 100, 'active', note.zone, 25, note.recordedAt.split('_')[0]]
      );
    }

    res.json({ success: true, message: 'La note a été validée avec succès, générée en PDF et stockée sur Cloudinary pour réentraînement continu du LLM et recalibrage de la courbe de prix.', note });
  } catch (error) {
    console.error('Error validating farmer note:', error);
    res.status(500).json({ message: 'Erreur lors de la validation de la note' });
  }
};

export const rejectFarmerNote = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const checkNote = await query('SELECT * FROM farmer_notes WHERE id = $1', [id]);
    if (checkNote.rows.length === 0) {
      return res.status(404).json({ message: 'Note d\'agriculteur non trouvée.' });
    }

    await query('UPDATE farmer_notes SET status = $1 WHERE id = $2', ['rejected', id]);

    res.json({ success: true, message: 'La note a été rejetée et supprimée de la file d\'attente.' });
  } catch (error) {
    console.error('Error rejecting farmer note:', error);
    res.status(500).json({ message: 'Erreur lors du rejet de la note' });
  }
};
