import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/agritechs'
});

async function run() {
  console.log('Updating crop types...');
  try {
    await pool.query("UPDATE crops SET type = 'Céréales' WHERE name IN ('Maïs', 'Riz')");
    await pool.query("UPDATE crops SET type = 'Maraîchage' WHERE name IN ('Tomate', 'Oignons')");
    await pool.query("UPDATE crops SET type = 'Épices' WHERE name IN ('Ail', 'Djindja')");
    await pool.query("UPDATE crops SET type = 'Tubercules' WHERE name = 'Manioc'");
    
    console.log('Crop types successfully updated.');
  } catch (error) {
    console.error('Error updating crop types:', error);
  } finally {
    await pool.end();
  }
}

run();
