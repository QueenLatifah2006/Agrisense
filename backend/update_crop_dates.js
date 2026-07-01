import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/agritechs'
});

async function run() {
  console.log('Updating dates for seeded crops...');
  try {
    const updateQuery = `
      UPDATE crops
      SET 
        sowing_start = CAST(price_recorded_date AS DATE) - INTERVAL '90 days',
        sowing_end = CAST(price_recorded_date AS DATE) - INTERVAL '70 days',
        harvest_start = CAST(price_recorded_date AS DATE) - INTERVAL '30 days',
        harvest_end = CAST(price_recorded_date AS DATE) - INTERVAL '20 days',
        selling_start = CAST(price_recorded_date AS DATE) - INTERVAL '10 days',
        selling_end = CAST(price_recorded_date AS DATE)
      WHERE sowing_start IS NULL AND price_recorded_date IS NOT NULL AND price_recorded_date != ''
    `;
    const res = await pool.query(updateQuery);
    console.log(`Updated ${res.rowCount} rows with realistic crop lifecycle dates.`);
  } catch (error) {
    console.error('Error updating dates:', error);
  } finally {
    await pool.end();
  }
}

run();
