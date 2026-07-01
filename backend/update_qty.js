import pg from 'pg';

const pool = new pg.Pool({ connectionString: "postgresql://postgres:postgres@localhost:5432/agritechs", ssl: false });

async function updateQuantity() {
  const client = await pool.connect();
  try {
    const res = await client.query("UPDATE crops SET quantity = 1");
    console.log(`Succès : La quantité a été mise à 1kg pour ${res.rowCount} cultures.`);
  } catch (e) {
    console.error("Erreur:", e);
  } finally {
    client.release();
    await pool.end();
  }
}

updateQuantity();
