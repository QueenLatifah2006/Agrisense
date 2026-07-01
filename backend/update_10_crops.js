import pg from 'pg';

const pool = new pg.Pool({ connectionString: "postgresql://postgres:postgres@localhost:5432/agritechs", ssl: false });

async function updateCrops() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Récupérer l'ID du superadmin
    const superAdminRes = await client.query("SELECT id FROM users WHERE role = 'superadmin' LIMIT 1");
    let superAdminId = null;
    if (superAdminRes.rows.length > 0) {
      superAdminId = superAdminRes.rows[0].id;
    } else {
      console.log("Aucun superadmin trouvé. Les cultures n'auront pas d'utilisateur assigné.");
    }

    // 2. Générer des dates cohérentes (ex: pour l'année en cours)
    // Semis: Il y a 90 jours
    const sowing_start = new Date();
    sowing_start.setDate(sowing_start.getDate() - 90);
    const sowing_end = new Date(sowing_start);
    sowing_end.setDate(sowing_end.getDate() + 15);

    // Date de plantation (identique au début des semis)
    const planting_date = new Date(sowing_start);

    // Récolte: Il y a 10 jours
    const harvest_start = new Date();
    harvest_start.setDate(harvest_start.getDate() - 10);
    const harvest_end = new Date(harvest_start);
    harvest_end.setDate(harvest_end.getDate() + 5);

    // Vente: En ce moment
    const selling_start = new Date();
    const selling_end = new Date();
    selling_end.setDate(selling_end.getDate() + 20);

    const formatDate = (d) => d.toISOString().split('T')[0];

    // 3. Mettre à jour toutes les cultures existantes (les 10 qu'on vient de créer)
    const updateQuery = `
      UPDATE crops
      SET user_id = $1,
          quantity = $2,
          planting_date = $3,
          sowing_start = $4,
          sowing_end = $5,
          harvest_start = $6,
          harvest_end = $7,
          selling_start = $8,
          selling_end = $9,
          progress = $10
    `;
    
    // On met une quantité aléatoire entre 500 et 2000 kg (ou fixe pour simplifier, disons 1500)
    const quantity = 1500;
    const progress = 100; // Puisqu'on est à la vente

    const updateRes = await client.query(updateQuery, [
      superAdminId,
      quantity,
      formatDate(planting_date),
      formatDate(sowing_start),
      formatDate(sowing_end),
      formatDate(harvest_start),
      formatDate(harvest_end),
      formatDate(selling_start),
      formatDate(selling_end),
      progress
    ]);

    await client.query('COMMIT');
    console.log(`Succès: ${updateRes.rowCount} cultures ont été mises à jour avec les informations de calendrier et l'ID SuperAdmin (${superAdminId}).`);
  } catch(e) {
    await client.query('ROLLBACK');
    console.error("Erreur:", e);
  } finally {
    client.release();
    await pool.end();
  }
}

updateCrops();
