const { query } = require('./dist/config/db.js');

async function cloneCrops() {
  try {
    const users = await query('SELECT id FROM users');
    
    // Pour chaque utilisateur (autre que 4), copier les 160 cultures
    for (let u of users.rows) {
      if (u.id === 4) continue;
      
      console.log(`Copie des cultures pour l'utilisateur ${u.id}...`);
      await query(`
        INSERT INTO crops (
          user_id, name, type, variety, area, planting_date, sowing_start, sowing_end, 
          harvest_start, harvest_end, selling_start, selling_end, price_recorded_date, 
          market, quantity, price, status, progress, image_url, created_at
        )
        SELECT 
          $1, name, type, variety, area, planting_date, sowing_start, sowing_end, 
          harvest_start, harvest_end, selling_start, selling_end, price_recorded_date, 
          market, quantity, price, status, progress, image_url, created_at
        FROM crops WHERE user_id = 4
      `, [u.id]);
    }
    
    console.log("Cultures dupliquées pour tous les comptes !");
  } catch (error) {
    console.error("Erreur:", error);
  } finally {
    process.exit();
  }
}

cloneCrops();
