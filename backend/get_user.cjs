const { query } = require('./dist/config/db.js');
query('SELECT id FROM users LIMIT 1').then(res => console.log(res.rows)).catch(console.error).finally(() => process.exit());
