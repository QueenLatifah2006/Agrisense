async function test() {
  try {
    const res = await fetch('http://localhost:3001/api/ai/prices-dataset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        culture: 'Tomate',
        zone: 'Centre',
        marche: "Marché d'Acacia",
        date_debut: "2026-05-01",
        date_fin: "2026-05-26"
      })
    });
    console.log("STATUS:", res.status);
    const text = await res.text();
    console.log("BODY:", text);
  } catch (err) {
    console.error(err);
  }
}
test();
