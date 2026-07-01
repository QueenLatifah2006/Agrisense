const fs = require('fs');
const { query } = require('./dist/config/db.js');

async function runSeed() {
  try {
    console.log("Lecture du fichier SQL...");
    const sqlScript = fs.readFileSync('../database_crops_seed.sql', 'utf-8');
    
    console.log("Exécution de la requête d'insertion (160 lignes)...");
    await query(sqlScript);
    
    console.log("✅ Succès ! Les 160 cultures ont été insérées dans la base de données.");
  } catch (error) {
    console.error("❌ Erreur lors de l'insertion :", error);
  } finally {
    process.exit();
  }
}

runSeed();
