const { query } = require('./dist/config/db.js');
query('SELECT market, COUNT(*) FROM crops GROUP BY market').then(res => {
  console.log(res.rows);
  process.exit();
}).catch(console.error);
