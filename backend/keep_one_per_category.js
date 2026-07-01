import pg from 'pg';

const pool = new pg.Pool({ connectionString: "postgresql://postgres:postgres@localhost:5432/agritechs", ssl: false });

async function keepOneCropPerCategory() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Trouver les cultures à garder : 1 par catégorie (on prend la plus récente ou la première)
    const res = await client.query(`
      WITH RankedCrops AS (
        SELECT id, name, type, 
               ROW_NUMBER() OVER(PARTITION BY type ORDER BY id ASC) as rn
        FROM crops
      )
      SELECT id, name, type FROM RankedCrops WHERE rn = 1;
    `);

    const cropsToKeep = res.rows;
    const idsToKeep = cropsToKeep.map(row => row.id);

    console.log("Cultures qui seront conservées (1 par type) :");
    cropsToKeep.forEach(c => console.log(`- [${c.type}] : ${c.name} (ID: ${c.id})`));

    if (idsToKeep.length > 0) {
      // Supprimer toutes les autres cultures
      const deleteRes = await client.query(`
        DELETE FROM crops 
        WHERE id != ALL($1::int[])
      `, [idsToKeep]);

      console.log(`\nSuccès: ${deleteRes.rowCount} cultures ont été supprimées de la base de données.`);
    } else {
      console.log("Aucune culture trouvée dans la base de données.");
    }

    await client.query('COMMIT');
  } catch(e) {
    await client.query('ROLLBACK');
    console.error("Erreur:", e);
  } finally {
    client.release();
    await pool.end();
  }
}
keepOneCropPerCategory();
