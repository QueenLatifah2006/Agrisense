import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 3000, 
});

pool.on('connect', () => {
  console.log('Successfully connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.log('[AgriSense Database] PostgreSQL disconnected:', err.message);
});

export const checkConnection = async () => {
  try {
    const client = await pool.connect();
    client.release();
    return { connected: true };
  } catch (err: any) {
    console.log(`[AgriSense Database] PostgreSQL connection error: ${err.message}`);
    return { connected: false, error: err.message };
  }
};

export const query = async (text: string, params?: any[]) => {
  return await pool.query(text, params);
};

export default pool;

