async function main() {
  const res = await fetch('http://127.0.0.1:8080/api/tests');
  const d = await res.json();
  console.log('Total tests in API:', d.tests.length);

  const keywords = ['urea', 'hba1c', 'creat', 'fbs', 'sugar', 'glucose', 'bun'];
  const matched = d.tests.filter(t => {
    const s = `${t.id} ${t.code} ${t.name} ${t.arabicName} ${t.category}`.toLowerCase();
    return keywords.some(k => s.includes(k));
  });

  console.log(`Found ${matched.length} matched tests:`);
  matched.forEach(t => {
    console.log({
      id: t.id,
      code: t.code,
      name: t.name,
      arabicName: t.arabicName,
      category: t.category,
      active: t.active,
      freqId: d.frequencies[t.id] || 0,
      freqCode: d.frequencies[(t.code || '').toUpperCase()] || 0
    });
  });
}

main().catch(console.error);
