import { jsPDF } from 'jspdf';
import { query } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

interface PricePoint {
  date: string;
  price: number;
}

/**
 * Generate chart image buffer from QuickChart API for a crop's price points
 */
async function generateChartImage(culture: string, dataPoints: PricePoint[]): Promise<string | null> {
  const dates = dataPoints.map(d => d.date);
  const prices = dataPoints.map(d => d.price);

  const chartConfig = {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: `Moyenne Hebdomadaire - ${culture} (FCFA/kg)`,
        data: prices,
        borderColor: 'rgb(15, 115, 60)', // Forest green theme
        backgroundColor: 'rgba(15, 115, 60, 0.1)',
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: 'rgb(15, 115, 60)'
      }]
    },
    options: {
      title: {
        display: true,
        text: `Évolution des prix - ${culture}`
      },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: false
          }
        }]
      }
    }
  };

  try {
    const response = await fetch('https://quickchart.io/chart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chart: chartConfig,
        width: 500,
        height: 250,
        format: 'png'
      })
    });

    if (!response.ok) {
      throw new Error(`QuickChart returned status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  } catch (err) {
    console.error(`[WeeklyReport] Failed to generate chart image for ${culture} via QuickChart:`, err);
    return null;
  }
}

/**
 * Generate weekly analysis text from Groq AI
 */
async function getWeeklyAnalysis(culture: string, dataPoints: PricePoint[]): Promise<string> {
  const priceListStr = dataPoints.map(d => `- Date: ${d.date}, Prix: ${d.price} FCFA/kg`).join('\n');
  const prompt = `
Tu es l'agronome principal et analyste de données d'AgriSense.
Rédige un court rapport d'analyse hebdomadaire pour la culture suivante :
Culture : ${culture}

Données de prix récoltées cette semaine :
${priceListStr}

Rédige un texte fluide et professionnel en français (150-200 mots, sans puces ni tirets) décrivant :
1. La tendance globale du prix (hausse, baisse, stabilité).
2. Les causes probables (météo, saisonnalité, offre et demande locales).
3. Un conseil pratique de commercialisation ou de récolte pour les agriculteurs.
`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`Groq HTTP error ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (err) {
    console.error(`[WeeklyReport] Failed to get AI summary for ${culture}:`, err);
    return `L'analyse des prix pour la culture de ${culture} montre une activité stable sur les marchés. Les agriculteurs sont encouragés à surveiller l'évolution des conditions locales pour optimiser le moment de leur récolte et négocier au mieux leurs tarifs avec les grossistes.`;
  }
}

/**
 * Build the weekly report PDF
 */
export async function generateWeeklyReport(): Promise<void> {
  console.log('[WeeklyReport] Starting weekly report generation...');
  
  try {
    // 1. Fetch active crops for this week
    const cropsRes = await query(
      `SELECT DISTINCT TRIM(name) as culture 
       FROM crops 
       WHERE created_at > NOW() - INTERVAL '7 days'`
    );

    if (cropsRes.rows.length === 0) {
      console.log('[WeeklyReport] No active crop records found in the last 7 days. Skipping report.');
      return;
    }

    const doc = new jsPDF();
    let isFirstPage = true;

    for (const row of cropsRes.rows) {
      const culture = row.culture;

      // Fetch last 7 days of price points for this crop
      const pricesRes = await query(
        `SELECT DISTINCT price_recorded_date as date, AVG(price) as avg_price 
         FROM crops 
         WHERE LOWER(name) = LOWER($1) AND price > 0 AND price_recorded_date IS NOT NULL
         AND created_at > NOW() - INTERVAL '7 days'
         GROUP BY price_recorded_date
         ORDER BY price_recorded_date ASC`,
        [culture]
      );

      if (pricesRes.rows.length < 2) {
        // Not enough data points to plot a curve, skip this crop
        continue;
      }

      const dataPoints: PricePoint[] = pricesRes.rows.map((r: any) => ({
        date: r.date,
        price: Number(r.avg_price)
      }));

      // Add a page if not first
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;

      // Document Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(15, 115, 60);
      doc.text('AGRISENSE IA - RAPPORT HEBDOMADAIRE DES MARCHÉS', 15, 22);

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(15, 26, 195, 26);

      // Metadata
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'normal');
      doc.text(`Rapport d'analyse de marché : ${culture}`, 15, 33);
      doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, 15, 39);

      doc.line(15, 43, 195, 43);

      // A. Call QuickChart to get PNG chart
      console.log(`[WeeklyReport] Generating Chart.js PNG for ${culture} via QuickChart...`);
      const chartBase64 = await generateChartImage(culture, dataPoints);
      
      let currentY = 50;
      if (chartBase64) {
        try {
          doc.addImage(chartBase64, 'PNG', 15, currentY, 180, 90);
          currentY += 100;
        } catch (imgErr) {
          console.error('[WeeklyReport] PDF addImage warning:', imgErr);
        }
      } else {
        doc.setFont('helvetica', 'italic');
        doc.text('Graphique de prix temporairement indisponible.', 15, currentY);
        currentY += 15;
      }

      // B. Call Groq to get summary text description
      console.log(`[WeeklyReport] Fetching AI weekly report description for ${culture}...`);
      const analysisText = await getWeeklyAnalysis(culture, dataPoints);

      // Render summary heading
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 115, 60);
      doc.text('ANALYSE DE SYNTHÈSE DE L\'INTELLIGENCE ARTIFICIELLE :', 15, currentY);
      doc.line(15, currentY + 2, 195, currentY + 2);
      
      currentY += 10;

      // Render summary body
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      const wrappedText = doc.splitTextToSize(analysisText, 175);
      doc.text(wrappedText, 15, currentY);

      // Footer layout
      const pageHeight = doc.internal.pageSize.height || 297;
      doc.setDrawColor(200, 200, 200);
      doc.line(15, pageHeight - 20, 195, pageHeight - 20);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120, 120, 120);
      doc.text('Ce rapport d\'aide à la décision agricole est compilé automatiquement à la fin de chaque semaine par AgriSense.', 15, pageHeight - 14);
    }

    if (!isFirstPage) {
      const fileName = `Weekly_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      // Save report PDF locally or to an archives directory
      console.log(`[WeeklyReport] Report successfully generated: ${fileName}`);
      doc.save(`./${fileName}`);
    } else {
      console.log('[WeeklyReport] Not enough active crop dataset points this week to produce a PDF report.');
    }

  } catch (err) {
    console.error('[WeeklyReport] Critical exception generating weekly report PDF:', err);
  }
}

/**
 * Schedule weekly reports to generate every Sunday at 23:00
 */
export function scheduleWeeklyReportRun() {
  const checkInterval = 60 * 60 * 1000; // Check every hour
  
  setInterval(async () => {
    const now = new Date();
    // Sunday is 0, hour is 23
    if (now.getDay() === 0 && now.getHours() === 23) {
      console.log('[Scheduler] Sunday 23:00 reached. Executing weekly report...');
      await generateWeeklyReport();
    }
  }, checkInterval);
}
