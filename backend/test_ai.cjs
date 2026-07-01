const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/agritechs' });

async function test(culture, zone, marche) {
  try {
    const notesCheck = await pool.query(
      `SELECT price, recorded_at, zone FROM farmer_notes
       WHERE crop_name ILIKE $1 AND zone ILIKE $2
       AND status = 'validated'`,
      [`%${culture}%`, `%${zone}%`]
    );

    let cropsQuery = `SELECT price, price_recorded_date AS recorded_at, area AS zone, market FROM crops WHERE name ILIKE $1`;
    let cropsParams = [`%${culture}%`];
    
    if (marche) {
      cropsQuery += ` AND market ILIKE $2`;
      cropsParams.push(`%${marche}%`);
    } else {
      cropsQuery += ` AND (area ILIKE $2 OR market ILIKE $2)`;
      cropsParams.push(`%${zone}%`);
    }

    const cropsCheck = await pool.query(cropsQuery, cropsParams);

    const allSqlRows = [...notesCheck.rows, ...cropsCheck.rows];
    let sqlDataset = [];

    for (const row of allSqlRows) {
      if (!row.price || !row.recorded_at) continue;
      
      let dateObj;
      if (typeof row.recorded_at === 'string') {
        let cleanDate = row.recorded_at.replace('_', ' ').replace('h', ':');
        dateObj = new Date(cleanDate);
      } else {
        dateObj = row.recorded_at;
      }
      
      if (isNaN(dateObj.getTime())) continue;

      sqlDataset.push({
        date: dateObj.toISOString(),
        prix_moyen_fcfa_kg: Number(row.price),
        nb_sources: 1,
        source: 'terrain'
      });
    }

    console.log("Input:", { culture, zone, marche });
    console.log("SQL Dataset size:", sqlDataset.length);
    console.log("Points:", sqlDataset.slice(0, 3));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

test('Tomate', 'Centre', "Marché d'Acacia");
