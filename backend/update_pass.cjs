const pg = require('pg');
const pool = new pg.Pool({ 
  connectionString: 'postgresql://agritechs_user:PMyewkuO1VzKf8P5EEfh7qnnnXpQskqY@dpg-d933690k1i2s73dgorkg-a.oregon-postgres.render.com/agritechs', 
  ssl: { rejectUnauthorized: false } 
});

async function fix() {
  try {
    const newHash = '$2b$10$cH/75hUH.xlCVypeF/uhsuU8yXNEIcqOTHe3LFzNDmGXsSzhZ265y';
    await pool.query('UPDATE users SET password = $1 WHERE id = 7', [newHash]);
    console.log('Password fixed!');
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
fix();
