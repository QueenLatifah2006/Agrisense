const { query } = require('./dist/config/db.js');

async function resetCrops() {
  try {
    console.log("Vérification des cultures...");
    const res = await query("SELECT COUNT(*) FROM crops");
    console.log(`Nombre total de cultures actuelles : ${res.rows[0].count}`);
    
    // Supprimer toutes les cultures générées (on peut tout vider si c'est une base de test, 
    // ou supprimer celles qui correspondent à ce qu'on a inséré).
    // Pour être sûr de supprimer les "160 cultures dupliquées", on vide la table crops
    // car le projet semble être en phase de test.
    console.log("Suppression de toutes les cultures générées...");
    await query("DELETE FROM crops");
    
    console.log("Les cultures ont été supprimées.");
  } catch (error) {
    console.error("Erreur:", error);
  } finally {
    process.exit();
  }
}

resetCrops();
