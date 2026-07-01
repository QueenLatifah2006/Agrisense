import { query } from '../config/db.js';
import { generateDailyArticle } from './articleService.js';
import { getAggregatedPrices } from './aiService.js';

/**
 * Execute all automated daily agricultural tasks:
 * 1. Closes any lingering inactive chats.
 * 2. Generates new agricultural bulletin articles for active crops/zones.
 * 3. Triggers AI prices dataset recalibration by scanning Cloudinary PDFs.
 */
export async function executeDailyTasks() {
  console.log(`[Scheduler] Starting daily execution tasks: ${new Date().toISOString()}`);

  try {
    // 1. Fetch unique combinations of crop names and zones from farmer_notes / crops
    const activeCombinations = await query(`
      SELECT DISTINCT TRIM(crop_name) as culture, TRIM(zone) as zone, NULL as market 
      FROM farmer_notes 
      WHERE status = 'validated' AND crop_name IS NOT NULL AND zone IS NOT NULL
      UNION
      SELECT DISTINCT TRIM(name) as culture, TRIM(variety) as zone, TRIM(market) as market 
      FROM crops 
      WHERE name IS NOT NULL AND variety IS NOT NULL
    `);

    if (activeCombinations.rows.length === 0) {
      console.log('[Scheduler] No active crops or zones found for daily task calibration. Generating defaults...');
      // Fallbacks
      await generateDailyArticle('Tomate', 'Ouest').catch(console.error);
      await getAggregatedPrices({ culture: 'Tomate', zone: 'Ouest', marche: "Marché Inconnu" }).catch(console.error);
      return;
    }

    console.log(`[Scheduler] Calibrating ${activeCombinations.rows.length} crop/zone/market combinations...`);

    for (const combo of activeCombinations.rows) {
      const culture = combo.culture;
      const zone = combo.zone;
      const marche = combo.market || "Marché Inconnu";
      
      if (!culture || !zone) continue;

      console.log(`[Scheduler] -> Calibrating combination: [${culture} / ${zone} / ${marche}]`);

      // A. Generate dynamic technical article (bulletin)
      try {
        const articleUrl = await generateDailyArticle(culture, zone);
        console.log(`[Scheduler] Daily article created successfully: ${articleUrl}`);
      } catch (articleErr) {
        console.error(`[Scheduler] Failed to generate daily article for ${culture}/${zone}:`, articleErr);
      }

      // B. Trigger AI prices dataset aggregation (scans Cloudinary notes, messages, articles)
      try {
        console.log(`[Scheduler] Running AI price aggregation agent for ${culture}/${zone}/${marche}...`);
        const aiResponse = await getAggregatedPrices({ culture, zone, marche });
        
        if (aiResponse && aiResponse.status === 'success' && aiResponse.data) {
          console.log(`[Scheduler] AI calibration successful for ${culture}/${zone}/${marche}. Found ${aiResponse.data.total_points} price points.`);
          
          // Seed the values back to crops table so dashboard charts load instantly
          if (aiResponse.data.dataset && aiResponse.data.dataset.length > 0) {
            for (const point of aiResponse.data.dataset) {
              const priceVal = Number(point.prix_moyen_fcfa_kg);
              
              // Check if we already have this calibration point
              const checkMatch = await query(
                'SELECT id FROM crops WHERE LOWER(name) = LOWER($1) AND LOWER(variety) = LOWER($2) AND LOWER(market) = LOWER($3) AND price_recorded_date = $4',
                [culture, zone, marche, point.date]
              );
              
              if (checkMatch.rows.length > 0) {
                // Update
                await query(
                  'UPDATE crops SET area = $1, price = $2 WHERE id = $3',
                  [priceVal / 100, priceVal, checkMatch.rows[0].id]
                );
              } else {
                // Insert new calibration node
                await query(
                  'INSERT INTO crops (name, type, planting_date, area, status, variety, market, progress, price_recorded_date, price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                  [culture, 'Maraîchage', point.date, priceVal / 100, 'active', zone, marche, 100, point.date, priceVal]
                );
              }
            }
          }
        }
      } catch (priceErr) {
        console.error(`[Scheduler] Failed to trigger prices calibration for ${culture}/${zone}/${marche}:`, priceErr);
      }
    }

    console.log('[Scheduler] Daily execution tasks finished successfully!');
  } catch (err) {
    console.error('[Scheduler] Critical error in daily scheduled execution flow:', err);
  }
}

/**
 * Schedule the next execution precisely at midnight (00:00:00)
 */
export function scheduleNextDailyRun() {
  const now = new Date();
  const nextRun = new Date();
  
  // Set to next midnight
  nextRun.setHours(24, 0, 0, 0);
  
  const msToNextRun = nextRun.getTime() - now.getTime();
  console.log(`[Scheduler] Daily tasks scheduler started. Next run in ${Math.round(msToNextRun / 1000 / 60 / 60)} hours.`);

  setTimeout(async () => {
    await executeDailyTasks();
    scheduleNextDailyRun(); // Recursively schedule for the next day
  }, msToNextRun);
}
