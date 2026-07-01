import { query } from './src/config/db.js';

async function seedTestData() {
  const culture = 'Tomate';
  const zone = 'Centre';
  const marche = "Marché d'Acacia";
  
  const baseDate = new Date('2026-05-01');
  const prices = [500, 520, 510, 540, 530];
  
  console.log(`Seeding test data for ${culture} / ${zone} / ${marche}...`);
  
  for (let i = 0; i < prices.length; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i * 5); // every 5 days
    const dateStr = d.toISOString().split('T')[0];
    const price = prices[i];
    
    // Check if exists
    const checkMatch = await query(
      'SELECT id FROM crops WHERE LOWER(name) = LOWER($1) AND LOWER(variety) = LOWER($2) AND LOWER(market) = LOWER($3) AND price_recorded_date = $4',
      [culture, zone, marche, dateStr]
    );
    
    if (checkMatch.rows.length === 0) {
      await query(
        'INSERT INTO crops (name, type, planting_date, area, status, variety, market, progress, price_recorded_date, price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [culture, 'Maraîchage', dateStr, price / 100, 'active', zone, marche, 100, dateStr, price]
      );
    }
  }
  
  console.log("Seeding complete!");
  process.exit(0);
}

seedTestData().catch(err => {
  console.error(err);
  process.exit(1);
});
