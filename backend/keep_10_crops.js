import pg from 'pg';

const pool = new pg.Pool({ connectionString: "postgresql://postgres:postgres@localhost:5432/agritechs", ssl: false });

const TEN_CROPS = [
  { name: 'Maïs', type: 'Céréales', area: 'Nord', market: 'Marché Central', price: 400 },
  { name: 'Manioc', type: 'Tubercules', area: 'Sud', market: 'Marché de Gros', price: 300 },
  { name: 'Tomate', type: 'Maraîchage', area: 'Ouest', market: 'Marché Central', price: 500 },
  { name: 'Cacao', type: 'Rente', area: 'Centre', market: 'Marché de Gros', price: 1500 },
  { name: 'Oignon', type: 'Maraîchage', area: 'Extrême-Nord', market: 'Marché Central', price: 600 },
  { name: 'Riz', type: 'Céréales', area: 'Littoral', market: 'Marché de Douala', price: 450 },
  { name: 'Ail', type: 'Épices', area: 'Ouest', market: 'Marché Central', price: 2000 },
  { name: 'Café', type: 'Rente', area: 'Ouest', market: 'Marché de Gros', price: 1200 },
  { name: 'Arachide', type: 'Légumineuses', area: 'Nord', market: 'Marché Central', price: 800 },
  { name: 'Igname', type: 'Tubercules', area: 'Adamaoua', market: 'Marché Central', price: 550 }
];

async function keepExactly10() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log("Suppression de toutes les anciennes cultures...");
    await client.query("DELETE FROM crops");

    console.log("Insertion d'exactement 10 cultures...");
    
    for (const crop of TEN_CROPS) {
      await client.query(
        `INSERT INTO crops (name, type, area, market, price, status)
         VALUES ($1, $2, $3, $4, $5, 'active')`,
        [crop.name, crop.type, crop.area, crop.market, crop.price]
      );
      console.log(`- Ajouté : ${crop.name} (${crop.type})`);
    }

    await client.query('COMMIT');
    console.log("\nOpération réussie : Il y a maintenant exactement 10 cultures dans la base de données.");
  } catch(e) {
    await client.query('ROLLBACK');
    console.error("Erreur:", e);
  } finally {
    client.release();
    await pool.end();
  }
}

keepExactly10();
