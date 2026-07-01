const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 7, role: 'superadmin' }, 'maison_de_l_ia', { expiresIn: '1h' });

const culture = 'Tomate';
const zone = 'Yaoundé';
const marche = 'Marché Central';
const date_debut = '2026-05-01';
const date_fin = '2026-05-26';

fetch('http://localhost:3000/api/ai/prices-dataset', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ culture, zone, marche, date_debut, date_fin })
}).then(async r => {
  console.log(r.status);
  console.log(await r.text());
  process.exit();
}).catch(console.error);
