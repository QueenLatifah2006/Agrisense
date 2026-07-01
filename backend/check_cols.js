import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/agritechs'
});
async function run() {
  const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'crops'");
  console.log(res.rows.map(r => r.column_name));
  await pool.end();
}
run();
