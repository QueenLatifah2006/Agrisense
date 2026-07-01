import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const initializeDatabase = async () => {
  try {
    console.log('Starting database initialization...');
    
    // Chemin vers le fichier SQL (remonter deux niveaux vers la racine du dossier backend)
    const sqlPath = path.join(__dirname, '../../init_db.sql');
    
    if (!fs.existsSync(sqlPath)) {
      console.warn('init_db.sql file not found at:', sqlPath);
      return;
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    await query(sql);
    
    // Auto-migrate standard table if it already existed without the new market column
    await query('ALTER TABLE crops ADD COLUMN IF NOT EXISTS market VARCHAR(255)').catch((err) => {
      console.warn('Non-blocking schema update warning (crops.market relation check):', err.message);
    });

    // Auto-migrate crops.area column to VARCHAR(255) to prevent SQL exceptions when mobile saves text zone inputs
    await query('ALTER TABLE crops ALTER COLUMN area TYPE VARCHAR(255)').catch((err) => {
      console.warn('Non-blocking schema update warning (crops.area type conversion check):', err.message);
    });

    // Auto-migrate planning dates for crops
    await query('ALTER TABLE crops ADD COLUMN IF NOT EXISTS sowing_start DATE').catch((err) => {
      console.warn('Non-blocking schema update warning (crops.sowing_start relation check):', err.message);
    });
    await query('ALTER TABLE crops ADD COLUMN IF NOT EXISTS sowing_end DATE').catch((err) => {
      console.warn('Non-blocking schema update warning (crops.sowing_end relation check):', err.message);
    });
    await query('ALTER TABLE crops ADD COLUMN IF NOT EXISTS harvest_start DATE').catch((err) => {
      console.warn('Non-blocking schema update warning (crops.harvest_start relation check):', err.message);
    });
    await query('ALTER TABLE crops ADD COLUMN IF NOT EXISTS harvest_end DATE').catch((err) => {
      console.warn('Non-blocking schema update warning (crops.harvest_end relation check):', err.message);
    });
    await query('ALTER TABLE crops ADD COLUMN IF NOT EXISTS selling_start DATE').catch((err) => {
      console.warn('Non-blocking schema update warning (crops.selling_start relation check):', err.message);
    });
    await query('ALTER TABLE crops ADD COLUMN IF NOT EXISTS selling_end DATE').catch((err) => {
      console.warn('Non-blocking schema update warning (crops.selling_end relation check):', err.message);
    });

    // Auto-migrate standard table if it already existed without the new quantity and price columns
    await query('ALTER TABLE crops ADD COLUMN IF NOT EXISTS quantity DECIMAL DEFAULT 0').catch((err) => {
      console.warn('Non-blocking schema update warning (crops.quantity relation check):', err.message);
    });

    await query('ALTER TABLE crops ADD COLUMN IF NOT EXISTS price DECIMAL DEFAULT 0').catch((err) => {
      console.warn('Non-blocking schema update warning (crops.price relation check):', err.message);
    });

    await query('ALTER TABLE crops ADD COLUMN IF NOT EXISTS price_recorded_date VARCHAR(100)').catch((err) => {
      console.warn('Non-blocking schema update warning (crops.price_recorded_date relation check):', err.message);
    });

    // Auto-migrate farmer_notes table if it already existed without the new cloudinary_url column
    await query('ALTER TABLE farmer_notes ADD COLUMN IF NOT EXISTS cloudinary_url TEXT').catch((err) => {
      console.warn('Non-blocking schema update warning (farmer_notes.cloudinary_url relation check):', err.message);
    });

    // Auto-migrate messages table for chat PDF and audio URLs
    await query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS pdf_url TEXT').catch((err) => {
      console.warn('Non-blocking schema update warning (messages.pdf_url relation check):', err.message);
    });

    await query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS audio_url TEXT').catch((err) => {
      console.warn('Non-blocking schema update warning (messages.audio_url relation check):', err.message);
    });

    // Auto-migrate chat_history table for validation workflow
    await query('ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT \'active\'').catch((err) => {
      console.warn('Non-blocking schema update warning (chat_history.status relation check):', err.message);
    });

    await query('ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS cloudinary_url TEXT').catch((err) => {
      console.warn('Non-blocking schema update warning (chat_history.cloudinary_url relation check):', err.message);
    });

    // Auto-migrate users table if it already existed without the new columns
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT').catch((err) => {
      console.warn('Non-blocking schema update warning (users.profile_picture check):', err.message);
    });
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS domain VARCHAR(255)').catch((err) => {
      console.warn('Non-blocking schema update warning (users.domain check):', err.message);
    });
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255)').catch((err) => {
      console.warn('Non-blocking schema update warning (users.organization_id check):', err.message);
    });
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)').catch((err) => {
      console.warn('Non-blocking schema update warning (users.phone check):', err.message);
    });
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255)').catch((err) => {
      console.warn('Non-blocking schema update warning (users.location check):', err.message);
    });

    // Auto-migrate farmer_notes table if it already existed without columns from init_db.sql
    await query('ALTER TABLE farmer_notes ADD COLUMN IF NOT EXISTS pdf_name VARCHAR(255) DEFAULT \'\'').catch((err) => {
      console.warn('Non-blocking schema update warning (farmer_notes.pdf_name check):', err.message);
    });
    await query('ALTER TABLE farmer_notes ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT \'pending\'').catch((err) => {
      console.warn('Non-blocking schema update warning (farmer_notes.status check):', err.message);
    });
    await query('ALTER TABLE farmer_notes ADD COLUMN IF NOT EXISTS knowledge_base_stored BOOLEAN DEFAULT FALSE').catch((err) => {
      console.warn('Non-blocking schema update warning (farmer_notes.knowledge_base_stored check):', err.message);
    });

    // Pure schema initialization/migration. No predefined records (mock data) will be seeded.
    console.log('Database schema validated.');

    console.log('Database initialized successfully.');
  } catch (error: any) {
    console.error('Database initialization error:', error);
  }
};
