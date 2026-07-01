async function checkAllCrops() {
  const crops = ['Maïs Jaune', 'Tomate', 'Oignon', 'Pomme de terre'];
  for (const crop of crops) {
    const res = await fetch('http://localhost:3000/api/ai/prices-dataset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ culture: crop, zone: 'Centre', date_debut: '2026-05-01', date_fin: '2026-05-26' })
    });
    const data = await res.json();
    console.log(`CROP: ${crop} -> ${data.dataset ? data.dataset.length : 0} points`);
  }
}
checkAllCrops();
