import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/agritechs?client_encoding=utf8'
});

async function run() {
  const res = await pool.query(`SELECT crop_name, zone, price, recorded_at FROM farmer_notes WHERE status = 'validated'`);
  console.log('FARMER NOTES:');
  console.table(res.rows);

  const res2 = await pool.query(`SELECT name, type, area, price_recorded_date, market, price FROM crops`);
  console.log('CROPS:');
  console.table(res2.rows);

  await pool.end();
}
run();
