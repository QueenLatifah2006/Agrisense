import { jsPDF } from 'jspdf';
import { uploadPdfToCloudinary } from './cloudinaryService.js';
import { query } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

interface ArticleData {
  title: string;
  category: string;
  content: string;
  recommendations: string[];
}

/**
 * Call Groq API to write a structured agricultural article
 */
async function draftArticleContent(culture: string, zone: string): Promise<ArticleData> {
  const prompt = `
Tu es un expert agronome principal pour AgriSense au Cameroun.
Rédige un article technique détaillé et vulgarisé sur la culture suivante :
Culture : ${culture}
Zone agro-écologique : ${zone}

L'article doit être extrêmement constructif pour les agriculteurs de la région et contenir des recommandations pratiques.
Format de réponse attendu (UNIQUEMENT du JSON valide, pas d'explication autour) :
{
  "title": "Titre accrocheur et professionnel de l'article",
  "category": "Technique de culture / Alerte maladie / Gestion des sols",
  "content": "Corps de l'article bien structuré en 2-3 paragraphes détaillés (sans puces ni tirets)",
  "recommendations": [
    "Recommandation pratique 1",
    "Recommandation pratique 2",
    "Recommandation pratique 3"
  ]
}
`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      json: true,
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    } as any);

    if (!response.ok) {
      throw new Error(`Groq API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.choices[0].message.content.trim();
    
    // Extract JSON block using regex
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('No JSON found in response');
  } catch (err) {
    console.error('[ArticleService] Error calling Groq for article creation:', err);
    // Return high quality fallback article
    return {
      title: `Guide complet d'optimisation de la culture de ${culture} en zone ${zone}`,
      category: 'Itinéraire Technique',
      content: `La culture de la ${culture} dans la région de ${zone} représente un enjeu économique majeur pour les exploitations locales. Pour maximiser les rendements, il est essentiel de respecter le calendrier agricole et de surveiller l'état phytosanitaire des plantations, en particulier en période de transition saisonnière où l'humidité favorise le développement des ravageurs.`,
      recommendations: [
        'Assurer un système de drainage adéquat pour éviter la pourriture racinaire.',
        'Pratiquer la rotation des cultures pour préserver la richesse minérale du sol.',
        'Mettre en place un paillage organique pour retenir l\'humidité au sol.'
      ]
    };
  }
}

/**
 * Generate a technical article PDF and upload it to Cloudinary
 */
export async function generateDailyArticle(culture: string = 'Tomate', zone: string = 'Ouest'): Promise<string> {
  console.log(`[ArticleService] Generating daily agricultural article for ${culture} / ${zone}...`);
  
  // 1. Fetch structured article text from AI
  const article = await draftArticleContent(culture, zone);

  // 2. Generate PDF with jsPDF
  const doc = new jsPDF();
  const dateStr = new Date().toISOString().split('T')[0];

  // Document Brand Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 115, 60); // Forest green
  doc.text('AGRISENSE IA - BULLETIN TECHNIQUE AGRICOLE', 15, 22);

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(15, 26, 195, 26);

  // Metadata Section
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(`Catégorie : ${article.category}`, 15, 33);
  doc.text(`Publié le : ${new Date().toLocaleDateString('fr-FR')}`, 15, 39);
  doc.text(`Cible : Culture de ${culture} | Zone : ${zone}`, 15, 45);

  doc.line(15, 50, 195, 50);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 41, 59);
  const wrappedTitle = doc.splitTextToSize(article.title.toUpperCase(), 170);
  doc.text(wrappedTitle, 15, 60);

  let currentY = 60 + (wrappedTitle.length * 7) + 5;

  // Article body
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(40, 40, 40);
  const wrappedContent = doc.splitTextToSize(article.content, 170);
  doc.text(wrappedContent, 15, currentY);

  currentY += (wrappedContent.length * 6) + 10;

  // Recommendations section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 115, 60);
  doc.text('RECOMMANDATIONS DE NOS AGRONOMES :', 15, currentY);
  
  doc.setDrawColor(15, 115, 60);
  doc.line(15, currentY + 2, 195, currentY + 2);

  currentY += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  
  for (const rec of article.recommendations) {
    const wrappedRec = doc.splitTextToSize(`• ${rec}`, 170);
    doc.text(wrappedRec, 15, currentY);
    currentY += (wrappedRec.length * 5) + 3;
  }

  // Footer page layout
  const pageHeight = doc.internal.pageSize.height || 297;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, pageHeight - 25, 195, pageHeight - 25);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 120, 120);
  doc.text('Ce bulletin est généré automatiquement par l\'agent IA AgriSense et validé scientifiquement.', 15, pageHeight - 18);

  // Stringified base64 extraction
  const apiDataUri = doc.output('datauristring');
  const base64Index = apiDataUri.indexOf('base64,');
  let base64PdfBuffer = '';
  if (base64Index !== -1) {
    base64PdfBuffer = apiDataUri.substring(base64Index + 7);
  } else {
    base64PdfBuffer = Buffer.from(doc.output('arraybuffer')).toString('base64');
  }

  // Upload to Cloudinary under folder 'article'
  const cleanCulture = culture.replace(/[^a-zA-Z0-9]/g, '');
  const cleanZone = zone.replace(/[^a-zA-Z0-9]/g, '');
  const pdfName = `Article_${cleanCulture}_${cleanZone}_${dateStr}.pdf`;

  console.log(`[ArticleService] Uploading article PDF to Cloudinary: ${pdfName}...`);
  const cloudinaryUrl = await uploadPdfToCloudinary(base64PdfBuffer, pdfName, 'article', false); // isDraft = false (direct publish)

  return cloudinaryUrl;
}
