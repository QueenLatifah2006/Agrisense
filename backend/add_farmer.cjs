const bcrypt = require('bcryptjs');
const pg = require('pg');

const pool = new pg.Pool({ 
  connectionString: 'postgresql://agritechs_user:PMyewkuO1VzKf8P5EEfh7qnnnXpQskqY@dpg-d933690k1i2s73dgorkg-a.oregon-postgres.render.com/agritechs', 
  ssl: { rejectUnauthorized: false } 
});

async function addFarmer() {
  try {
    const email = 'latifahsalem523@gmail.com';
    const rawPassword = 'Djaboume@2006';
    const role = 'farmer';
    const name = 'Latifah Salem'; // Default name since it wasn't specified

    // Generate hash
    const hash = bcrypt.hashSync(rawPassword, 10);

    // Insert user
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      [name, email, hash, role]
    );

    console.log('Farmer successfully added!');
  } catch (e) {
    if (e.code === '23505') {
      console.log('User already exists!');
    } else {
      console.error('Error adding user:', e);
    }
  } finally {
    pool.end();
  }
}

addFarmer();
