import { orderCatalogByImportance } from '../apps/web/src/widgets/unified-workspace/lib/catalogOrdering';

async function main() {
  const res = await fetch('http://127.0.0.1:8080/api/tests');
  const d = await res.json();
  const bio = d.tests.filter((t: any) => {
    const c = (t.category || '').toLowerCase();
    return c.includes('كيمياء') || c.includes('سكري') || c.includes('كبد') || c.includes('كلى') || c.includes('دهون');
  });
  console.log('Biochemistry tests count:', bio.length);
  const ordered = orderCatalogByImportance(bio, d.frequencies, 50, 'BIOCHEMISTRY');
  console.log('Top 20 ordered:');
  ordered.slice(0, 20).forEach((t: any, i: number) => {
    const fId = d.frequencies[t.id] || 0;
    const fCode = d.frequencies[(t.code || '').toUpperCase()] || 0;
    console.log(`${i + 1}. ${t.name} [${t.code}] (freqId: ${fId}, freqCode: ${fCode})`);
  });
}

main().catch(console.error);
