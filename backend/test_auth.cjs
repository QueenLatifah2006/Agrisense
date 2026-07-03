const bcrypt = require('bcryptjs');
const pg = require('pg');
const pool = new pg.Pool({ connectionString: 'postgresql://agritechs_user:PMyewkuO1VzKf8P5EEfh7qnnnXpQskqY@dpg-d933690k1i2s73dgorkg-a.oregon-postgres.render.com/agritechs', ssl: false });

async function test() {
  try {
    const res = await pool.query('SELECT * FROM users WHERE email = $1', ['superadmin@gmail.com']);
    if (res.rows.length === 0) { console.log('User not found'); return; }
    const user = res.rows[0];
    console.log('User found:', user.email);
    const isMatch = bcrypt.compareSync('SuperAdmin@1234', user.password);
    console.log('Password match:', isMatch);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
test();
