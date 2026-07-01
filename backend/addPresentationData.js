import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedPresentationData() {
  try {
    const client = await pool.connect();
    
    // MAÏS JAUNE (Default Frontend Crop)
    console.log("Adding presentation data for 'Maïs Jaune (Grain)', Centre, Marché Central...");
    const pricesMais = [
      { price: 420, date: '2026-05-01' },
      { price: 425, date: '2026-05-05' },
      { price: 415, date: '2026-05-10' },
      { price: 430, date: '2026-05-15' },
      { price: 440, date: '2026-05-20' },
      { price: 435, date: '2026-05-26' }
    ];
    for (const p of pricesMais) {
      await client.query(
        `INSERT INTO crops (name, type, area, price_recorded_date, market, price)
         VALUES ('Maïs Jaune (Grain)', 'Céréales', 'Centre', $1, 'Marché Central', $2)`,
        [p.date, p.price]
      );
    }
    console.log("Inserted data for Maïs Jaune");

    // TOMATE
    console.log("Adding presentation data for 'Tomate', Centre, Marché Central...");
    const pricesTomate = [
      { price: 500, date: '2026-05-01' },
      { price: 520, date: '2026-05-06' },
      { price: 510, date: '2026-05-11' },
      { price: 540, date: '2026-05-16' },
      { price: 530, date: '2026-05-21' },
      { price: 900, date: '2026-07-23' }
    ];
    for (const p of pricesTomate) {
      await client.query(
        `INSERT INTO crops (name, type, area, price_recorded_date, market, price)
         VALUES ('Tomate', 'Légumes', 'Centre', $1, 'Marché Central', $2)`,
        [p.date, p.price]
      );
    }
    console.log("Inserted data for Tomate (Marché Central)");
    
    client.release();
    console.log("Done.");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

seedPresentationData();
