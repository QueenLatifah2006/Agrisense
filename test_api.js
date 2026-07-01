const culture = 'Tomate';
const zone = 'Ouest';
fetch('http://localhost:3001/api/ai/prices-dataset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ culture, zone })
}).then(r => r.json().then(data => console.log(r.status, data)));
