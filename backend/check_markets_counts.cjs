const { query } = require('./dist/config/db.js');

async function checkAreaMarkets() {
  try {
    const crops = await query('SELECT area, market, COUNT(*) FROM crops WHERE market IS NOT NULL GROUP BY area, market');
    console.log("--- FROM CROPS ---");
    crops.rows.forEach(r => console.log(r));

    const notes = await query('SELECT zone as area, market, COUNT(*) FROM farmer_notes WHERE market IS NOT NULL GROUP BY zone, market');
    console.log("--- FROM FARMER_NOTES ---");
    notes.rows.forEach(r => console.log(r));
    
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
checkAreaMarkets();
