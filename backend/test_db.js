const { query } = require('./dist/config/db.js');
query('SELECT * FROM crops ORDER BY created_at DESC LIMIT 5').then(res => console.log(res.rows)).catch(console.error).finally(() => process.exit());
