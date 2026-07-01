import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: false });

async function check() {
  try {
    const res = await pool.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reset_codes');`);
    console.log('Table reset_codes exists:', res.rows[0].exists);
    if (!res.rows[0].exists) {
      console.log('Creating table reset_codes...');
      await pool.query(`
        CREATE TABLE reset_codes (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          code VARCHAR(10) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Table created successfully');
    }
  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
check();
