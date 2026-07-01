const { query } = require('./dist/config/db.js');

async function checkMapping() {
  try {
    const crops = await query('SELECT DISTINCT area, market FROM crops WHERE market IS NOT NULL');
    console.log("--- FROM CROPS ---");
    crops.rows.forEach(r => console.log(r));

    const notes = await query('SELECT DISTINCT zone as area, market FROM farmer_notes WHERE market IS NOT NULL');
    console.log("--- FROM FARMER_NOTES ---");
    notes.rows.forEach(r => console.log(r));
    
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
checkMapping();
