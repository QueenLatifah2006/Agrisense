import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/agritechs'
});
async function run() {
  const superAdminRes = await pool.query("SELECT id FROM users WHERE role = 'superadmin' LIMIT 1");
  if (superAdminRes.rows.length > 0) {
    const adminId = superAdminRes.rows[0].id;
    console.log('Superadmin ID:', adminId);
    const updateRes = await pool.query("UPDATE crops SET user_id = $1 WHERE user_id IS NULL", [adminId]);
    console.log('Updated rows:', updateRes.rowCount);
  } else {
    console.log('No superadmin found');
  }
  await pool.end();
}
run();
