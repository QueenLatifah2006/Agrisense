import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/agritechs'
});

const crops = ['Maïs', 'Riz', 'Tomate', 'Ail', 'Djindja', 'Oignons', 'Manioc'];
const cities = [
  'Maroua', 'Garoua', 'Ngaoundéré', 'Bamenda', 'Bafoussam', 
  'Buea', 'Douala', 'Yaoundé', 'Bertoua', 'Ebolowa'
];

async function run() {
  try {
    // get superadmin
    const superAdminRes = await pool.query("SELECT id FROM users WHERE role = 'superadmin' LIMIT 1");
    const superAdminId = superAdminRes.rows.length > 0 ? superAdminRes.rows[0].id : null;

    console.log('Clearing old crops...');
    await pool.query("DELETE FROM crops");

    console.log('Inserting 700 new crops...');
    const now = new Date();
    let count = 0;

    for (const cropName of crops) {
      for (const city of cities) {
        for (let i = 0; i < 10; i++) {
          // distribute over last 30 days
          const recordedDate = new Date(now.getTime() - (i * 3 * 24 * 60 * 60 * 1000));
          
          const sowing_start = new Date(recordedDate.getTime() - (90 * 24 * 60 * 60 * 1000));
          const sowing_end = new Date(recordedDate.getTime() - (70 * 24 * 60 * 60 * 1000));
          const harvest_start = new Date(recordedDate.getTime() - (30 * 24 * 60 * 60 * 1000));
          const harvest_end = new Date(recordedDate.getTime() - (20 * 24 * 60 * 60 * 1000));
          const selling_start = new Date(recordedDate.getTime() - (10 * 24 * 60 * 60 * 1000));
          const selling_end = new Date(recordedDate.getTime());

          const formatDate = (d) => d.toISOString().split('T')[0];
          
          const basePrice = Math.floor(Math.random() * 500) + 200;

          await pool.query(`
            INSERT INTO crops (
              name, type, area, market, price, user_id, 
              price_recorded_date, sowing_start, sowing_end, 
              harvest_start, harvest_end, selling_start, selling_end
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `, [
            cropName,
            'Produit Agricole', // type
            city, // area (zone)
            `Marché de ${city}`, // market
            basePrice,
            superAdminId,
            formatDate(recordedDate),
            formatDate(sowing_start),
            formatDate(sowing_end),
            formatDate(harvest_start),
            formatDate(harvest_end),
            formatDate(selling_start),
            formatDate(selling_end)
          ]);
          count++;
        }
      }
    }
    console.log(`Successfully inserted ${count} rows.`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
