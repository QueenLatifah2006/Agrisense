import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/agritechs?client_encoding=utf8'
});

const CROPS = [
  { name: 'Maïs Jaune', type: 'Céréales', basePrice: 420, trend: '+4.2%' },
  { name: 'Manioc Doux', type: 'Maraîchage', basePrice: 300, trend: '-1.5%' },
  { name: 'Café Robusta', type: 'Rente', basePrice: 1200, trend: '+1.8%' },
  { name: 'Sorgho Rouge', type: 'Céréales', basePrice: 380, trend: '-2.1%' },
  { name: 'Igname Blanche', type: 'Tubercule', basePrice: 600, trend: '-5.4%' },
  { name: 'Tomate', type: 'Légumes', basePrice: 500, trend: '+1.2%' },
  { name: 'Arachide', type: 'Légumineuse', basePrice: 800, trend: '+0.5%' },
  { name: 'Riz', type: 'Céréales', basePrice: 350, trend: '+1.0%' },
  { name: 'Djindja', type: 'Épice', basePrice: 1500, trend: '-0.5%' },
  { name: 'Ail', type: 'Épice', basePrice: 2000, trend: '+2.5%' },
  { name: 'Oignon', type: 'Légumes', basePrice: 400, trend: '-1.0%' }
];

const ZONES = [
  { name: 'Extrême-Nord', coef: 0.82 },
  { name: 'Nord', coef: 0.85 },
  { name: 'Adamaoua', coef: 0.92 },
  { name: 'Nord-Ouest', coef: 0.94 },
  { name: 'Ouest', coef: 0.90 },
  { name: 'Sud-Ouest', coef: 1.05 },
  { name: 'Littoral', coef: 1.18 },
  { name: 'Centre', coef: 1.12 },
  { name: 'Est', coef: 0.98 },
  { name: 'Sud', coef: 1.15 }
];

const MARKETS = [
  { name: 'Marché de Gros', bonus: -20 },
  { name: 'Marché Central', bonus: 10 },
  { name: 'Marché Gouro', bonus: 25 },
  { name: 'Marché de Cocody', bonus: 40 },
  { name: 'Marché de Casablanca', bonus: 15 } // Added because user selected it
];

async function seed() {
  const client = await pool.connect();
  console.log("Deleting old generated crops from the DB...");
  await client.query("DELETE FROM crops WHERE name IN ('Maïs Jaune (Grain)', 'Maïs Jaune', 'Manioc Doux', 'Café Robusta', 'Sorgho Rouge', 'Igname Blanche', 'Tomate', 'Arachide', 'Riz', 'Djindja', 'Ail', 'Oignon')");
  
  console.log("Seeding 30 days of data for all crops, zones, markets...");
  
  const now = Date.now();
  let count = 0;
  
  for (const crop of CROPS) {
    const isUptrend = crop.trend.includes('+');
    for (const zone of ZONES) {
      for (const market of MARKETS) {
        
        let curPrice = Math.round(crop.basePrice * zone.coef + market.bonus);
        
        for (let i = 30; i >= 0; i--) {
          const randomFluctuation = (Math.random() - 0.4) * (crop.basePrice * 0.04);
          const drift = (30 - i) * (isUptrend ? 0.5 : -0.5);
          curPrice = Math.round(curPrice + randomFluctuation + drift);
          
          const dateStr = new Date(now - i * 86400000).toISOString();
          
          await client.query(
            `INSERT INTO crops (name, type, area, price_recorded_date, market, price)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [crop.name, crop.type, zone.name, dateStr, market.name, Math.max(50, curPrice)]
          );
          count++;
        }
      }
    }
  }
  
  console.log(`Successfully seeded ${count} points!`);
  client.release();
  await pool.end();
}

seed();
