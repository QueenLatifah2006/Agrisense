import { getAggregatedPrices } from './src/services/aiService.js';
import { query, checkConnection } from './src/config/db.js';

async function runTomate() {
  await checkConnection();
  console.log("Generating data for Tomate / Centre / Marché d'Acacia...");
  const culture = 'Tomate';
  const zone = 'Centre';
  const marche = "Marché d'Acacia";

  const aiResponse = await getAggregatedPrices({ culture, zone, marche });
        
  if (aiResponse && aiResponse.status === 'success' && aiResponse.data) {
    console.log(`[Scheduler] AI calibration successful for ${culture}/${zone}/${marche}. Found ${aiResponse.data.total_points} price points.`);
    
    if (aiResponse.data.dataset && aiResponse.data.dataset.length > 0) {
      for (const point of aiResponse.data.dataset) {
        const priceVal = Number(point.prix_moyen_fcfa_kg);
        
        const checkMatch = await query(
          'SELECT id FROM crops WHERE LOWER(name) = LOWER($1) AND LOWER(variety) = LOWER($2) AND LOWER(market) = LOWER($3) AND price_recorded_date = $4',
          [culture, zone, marche, point.date]
        );
        
        if (checkMatch.rows.length > 0) {
          await query(
            'UPDATE crops SET area = $1, price = $2 WHERE id = $3',
            [priceVal / 100, priceVal, checkMatch.rows[0].id]
          );
        } else {
          await query(
            'INSERT INTO crops (name, type, planting_date, area, status, variety, market, progress, price_recorded_date, price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [culture, 'Maraîchage', point.date, priceVal / 100, 'active', zone, marche, 100, point.date, priceVal]
          );
        }
      }
    }
    console.log("Done inserting points!");
  }
  process.exit(0);
}

runTomate().catch(console.error);
