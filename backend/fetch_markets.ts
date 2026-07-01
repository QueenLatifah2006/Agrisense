import { query } from './src/config/db.js';

async function run() {
  const res = await query(`
    SELECT DISTINCT market FROM crops WHERE market IS NOT NULL AND market != ''
    UNION
    SELECT DISTINCT market FROM farmer_notes WHERE market IS NOT NULL AND market != ''
  `);
  console.log(res.rows);
  process.exit(0);
}
run();
