import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: false });

async function checkCrops() {
  try {
    const res = await pool.query('SELECT id, name, category FROM crops;');
    console.log(`Trouvé ${res.rows.length} enregistrements.`);
    
    const categories = {};
    res.rows.forEach(row => {
      if (!categories[row.category]) categories[row.category] = new Set();
      categories[row.category].add(row.name);
    });

    for (const [cat, names] of Object.entries(categories)) {
      console.log(`Catégorie: ${cat} -> Cultures uniques: ${Array.from(names).join(', ')}`);
    }
    
  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
checkCrops();
