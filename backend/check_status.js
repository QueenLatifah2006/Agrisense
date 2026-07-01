import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/agritechs'
});
async function run() {
  const res = await pool.query('SELECT status FROM crops LIMIT 5');
  console.log(res.rows);
  await pool.end();
}
run();
