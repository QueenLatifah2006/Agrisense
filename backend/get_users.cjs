const { query } = require('./dist/config/db.js');
query('SELECT id, email, role FROM users').then(res => console.log(res.rows)).catch(console.error).finally(() => process.exit());
