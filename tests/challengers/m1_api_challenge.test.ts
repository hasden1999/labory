import { describe, test, it, beforeAll, beforeEach } from '../e2e/harness/testRunner';
import { getStore } from '../../apps/web/src/lib/serverStore';

// Import Route Handlers
import { GET as getBarcode } from '../../apps/web/src/app/api/samples/[id]/barcode/route';
import { GET as getPatient, PATCH as patchPatient, DELETE as deletePatient } from '../../apps/web/src/app/api/patients/[id]/route';
import { GET as searchPatientsRoute } from '../../apps/web/src/app/api/patients/search/route';
import { GET as getDoctorsList, POST as postDoctor } from '../../apps/web/src/app/api/doctors/route';
import { GET as getDoctor, PATCH as patchDoctor, DELETE as deleteDoctor } from '../../apps/web/src/app/api/doctors/[id]/route';
import { GET as getSettingsRoute, POST as postSettingsRoute, PUT as putSettingsRoute, PATCH as patchSettingsRoute } from '../../apps/web/src/app/api/settings/route';
import { addSample, findSample } from '../../apps/web/src/lib/serverStore';

// Helper to create Request object
function makeRequest(url: string, options: { method?: string; body?: any; headers?: Record<string, string> } = {}): Request {
  const method = options.method || 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const body = options.body ? JSON.stringify(options.body) : undefined;
  return new Request(url, {
    method,
    headers,
    body: method !== 'GET' && method !== 'HEAD' ? body : undefined
  });
}

describe('M1 Challenger: /api/samples/[id]/barcode Thermal Label Route', () => {
  test('Valid sample ID returns 200 with 50x25mm CSS and Code128 SVG barcode', async () => {
    const req = makeRequest('http://localhost:3000/api/samples/s-1001/barcode');
    const res = await getBarcode(req, { params: { id: 's-1001' } });
    
    if (res.status !== 200) {
      throw new Error(`Expected status 200, got ${res.status}`);
    }

    const html = await res.text();
    const contentType = res.headers.get('Content-Type');
    if (!contentType?.includes('text/html')) {
      throw new Error(`Expected text/html content type, got ${contentType}`);
    }

    // Verify 50x25mm thermal print dimensions
    if (!html.includes('size: 50mm 25mm')) {
      throw new Error('Barcode thermal label missing "@page { size: 50mm 25mm; }" CSS');
    }

    // Verify Code 128 SVG elements
    if (!html.includes('<svg') || !html.includes('</svg>') || !html.includes('<rect')) {
      throw new Error('Barcode HTML missing valid SVG / rect elements');
    }

    // Verify sample number and patient name
    if (!html.includes('#1001') || !html.includes('*S1001*')) {
      throw new Error('Barcode HTML missing sample number identifier #1001 or *S1001*');
    }

    if (!html.includes('حيدر عبد الحسين الخفاجي')) {
      throw new Error('Barcode HTML missing Arabic patient name');
    }
  });

  test('Lookup by numeric sampleNumber string (e.g. "1002") succeeds with 200', async () => {
    const req = makeRequest('http://localhost:3000/api/samples/1002/barcode');
    const res = await getBarcode(req, { params: { id: '1002' } });

    if (res.status !== 200) {
      throw new Error(`Expected status 200 for numeric sampleNumber lookup, got ${res.status}`);
    }

    const html = await res.text();
    if (!html.includes('#1002') || !html.includes('زينب جاسم')) {
      throw new Error('Sample 1002 demographics missing in barcode output');
    }
  });

  test('Urgent sample renders STAT urgency badge in barcode header', async () => {
    const req = makeRequest('http://localhost:3000/api/samples/s-1002/barcode');
    const res = await getBarcode(req, { params: { id: 's-1002' } });
    const html = await res.text();

    if (!html.includes('stat-badge') || !html.includes('STAT')) {
      throw new Error('Urgent sample s-1002 missing STAT urgency badge in thermal label');
    }
  });

  test('Non-existent sample ID returns 404 Not Found', async () => {
    const req = makeRequest('http://localhost:3000/api/samples/s-9999/barcode');
    const res = await getBarcode(req, { params: { id: 's-9999' } });

    if (res.status !== 404) {
      throw new Error(`Expected 404 for non-existent sample ID, got ${res.status}`);
    }

    const html = await res.text();
    if (!html.includes('Sample Not Found') && !html.includes('غير موجودة')) {
      throw new Error('Expected 404 error message body in barcode response');
    }
  });

  test('Adversarial sample IDs (SQLi, path traversal, unicode) return 404 cleanly without crashing', async () => {
    const adversarialIds = [
      "' OR '1'='1",
      "../../etc/passwd",
      "<script>alert(1)</script>",
      "null",
      "undefined",
      "0",
      "-100",
      "🧪💉🦠",
      "   "
    ];

    for (const id of adversarialIds) {
      const req = makeRequest(`http://localhost:3000/api/samples/${encodeURIComponent(id)}/barcode`);
      const res = await getBarcode(req, { params: { id } });
      if (res.status !== 404) {
        throw new Error(`Expected 404 for adversarial ID "${id}", got ${res.status}`);
      }
    }
  });
});

describe('M1 Challenger: /api/patients/[id] Patient Details & Mutation Route', () => {
  test('GET /api/patients/pat-1 returns enriched profile with aggregated debt and history', async () => {
    const req = makeRequest('http://localhost:3000/api/patients/pat-1');
    const res = await getPatient(req, { params: { id: 'pat-1' } });

    if (res.status !== 200) {
      throw new Error(`Expected status 200, got ${res.status}`);
    }

    const data = await res.json();
    if (data.id !== 'pat-1' || data.name !== 'حيدر عبد الحسين الخفاجي') {
      throw new Error(`Incorrect patient record returned: ${JSON.stringify(data)}`);
    }

    if (typeof data.visitsCount !== 'number' || data.visitsCount < 1) {
      throw new Error(`Expected visitsCount >= 1, got ${data.visitsCount}`);
    }

    if (typeof data.totalBilled !== 'number' || typeof data.totalPaid !== 'number' || typeof data.outstandingDebt !== 'number') {
      throw new Error('Missing financial aggregation fields in patient response');
    }

    if (!Array.isArray(data.abnormalFlags)) {
      throw new Error('Expected abnormalFlags array in patient response');
    }
  });

  test('GET /api/patients/pat-3 accurately computes outstanding debt (15,000 IQD)', async () => {
    const req = makeRequest('http://localhost:3000/api/patients/pat-3');
    const res = await getPatient(req, { params: { id: 'pat-3' } });
    const data = await res.json();

    if (data.outstandingDebt !== 15000) {
      throw new Error(`Expected outstandingDebt of 15000 for patient 3, got ${data.outstandingDebt}`);
    }
  });

  test('GET /api/patients/non-existent returns 404 JSON', async () => {
    const req = makeRequest('http://localhost:3000/api/patients/pat-unknown-999');
    const res = await getPatient(req, { params: { id: 'pat-unknown-999' } });

    if (res.status !== 404) {
      throw new Error(`Expected status 404, got ${res.status}`);
    }

    const json = await res.json();
    if (!json.message) {
      throw new Error('Expected JSON error message in 404 response');
    }
  });

  test('PATCH /api/patients/pat-2 updates demographics and syncs in-memory samples', async () => {
    const updatePayload = {
      phone: '07809998877',
      address: 'البصرة - العشار',
      notes: 'تم تحديث العنوان ورقم الهاتف'
    };

    const req = makeRequest('http://localhost:3000/api/patients/pat-2', {
      method: 'PATCH',
      body: updatePayload
    });

    const res = await patchPatient(req, { params: { id: 'pat-2' } });
    if (res.status !== 200) {
      throw new Error(`Expected status 200 on PATCH, got ${res.status}`);
    }

    const updated = await res.json();
    if (updated.phone !== '07809998877' || updated.address !== 'البصرة - العشار') {
      throw new Error(`PATCH did not persist fields: ${JSON.stringify(updated)}`);
    }

    // Verify sample patient record also synced
    const store = getStore();
    const sample = store.samples.find(s => s.patientId === 'pat-2');
    if (sample && sample.patient.phone !== '07809998877') {
      throw new Error(`Sample patient sub-object was not synchronized with updated patient`);
    }
  });

  test('PATCH /api/patients/unknown returns 404', async () => {
    const req = makeRequest('http://localhost:3000/api/patients/pat-nonexistent', {
      method: 'PATCH',
      body: { name: 'New Name' }
    });

    const res = await patchPatient(req, { params: { id: 'pat-nonexistent' } });
    if (res.status !== 404) {
      throw new Error(`Expected status 404 on PATCH non-existent, got ${res.status}`);
    }
  });

  test('DELETE /api/patients/unknown returns 404', async () => {
    const req = makeRequest('http://localhost:3000/api/patients/pat-nonexistent', {
      method: 'DELETE'
    });

    const res = await deletePatient(req, { params: { id: 'pat-nonexistent' } });
    if (res.status !== 404) {
      throw new Error(`Expected status 404 on DELETE non-existent, got ${res.status}`);
    }
  });
});

describe('M1 Challenger: /api/patients/search Autocomplete & NLP Search Route', () => {
  test('Empty search query returns empty array []', async () => {
    const req = makeRequest('http://localhost:3000/api/patients/search?q=');
    const res = await searchPatientsRoute(req);
    const data = await res.json();

    if (!Array.isArray(data) || data.length !== 0) {
      throw new Error(`Expected empty array for empty search, got ${JSON.stringify(data)}`);
    }
  });

  test('Whitespace only query returns empty array []', async () => {
    const req = makeRequest('http://localhost:3000/api/patients/search?q=%20%20%20');
    const res = await searchPatientsRoute(req);
    const data = await res.json();

    if (!Array.isArray(data) || data.length !== 0) {
      throw new Error(`Expected empty array for whitespace search, got ${JSON.stringify(data)}`);
    }
  });

  test('Arabic exact name match "حيدر" returns patient with priorVisits and lastTestIds', async () => {
    const req = makeRequest('http://localhost:3000/api/patients/search?q=' + encodeURIComponent('حيدر'));
    const res = await searchPatientsRoute(req);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Search failed for Arabic query "حيدر"');
    }

    const patient = data[0];
    if (patient.id !== 'pat-1') {
      throw new Error(`Expected patient pat-1, got ${patient.id}`);
    }

    if (!patient.priorVisits || patient.priorVisits.length === 0) {
      throw new Error('Expected priorVisits array in autocomplete result');
    }

    if (!patient.lastTestIds || patient.lastTestIds.length === 0) {
      throw new Error('Expected lastTestIds for "Repeat Last Tests" feature');
    }
  });

  test('Arabic surname substring match "الجبوري" finds patient 2', async () => {
    const req = makeRequest('http://localhost:3000/api/patients/search?q=' + encodeURIComponent('الجبوري'));
    const res = await searchPatientsRoute(req);
    const data = await res.json();

    if (data.length === 0 || !data.some((p: any) => p.name.includes('الجبوري'))) {
      throw new Error('Search failed for Arabic surname "الجبوري"');
    }
  });

  test('Arabic middle name match "طارق" finds patient 3', async () => {
    const req = makeRequest('http://localhost:3000/api/patients/search?q=' + encodeURIComponent('طارق'));
    const res = await searchPatientsRoute(req);
    const data = await res.json();

    if (data.length === 0 || !data.some((p: any) => p.name.includes('عمر طارق'))) {
      throw new Error('Search failed for Arabic middle name "طارق"');
    }
  });

  test('Phone number query matches patient by phone', async () => {
    // Test pat-1's phone "07701239988"
    const req1 = makeRequest('http://localhost:3000/api/patients/search?q=07701239988');
    const res1 = await searchPatientsRoute(req1);
    const data1 = await res1.json();

    if (data1.length === 0 || data1[0].id !== 'pat-1') {
      throw new Error('Phone query search for pat-1 failed');
    }

    // Test pat-2's updated phone "07809998877"
    const req2 = makeRequest('http://localhost:3000/api/patients/search?q=07809998877');
    const res2 = await searchPatientsRoute(req2);
    const data2 = await res2.json();

    if (data2.length === 0 || data2[0].id !== 'pat-2') {
      throw new Error('Phone query search for pat-2 failed');
    }
  });

  test('Partial phone query "0770" matches both patient 1 and patient 3', async () => {
    const req = makeRequest('http://localhost:3000/api/patients/search?q=0770');
    const res = await searchPatientsRoute(req);
    const data = await res.json();

    if (data.length < 2) {
      throw new Error(`Expected at least 2 results for partial phone "0770", got ${data.length}`);
    }
  });

  test('Non-matching query returns empty array without error', async () => {
    const req = makeRequest('http://localhost:3000/api/patients/search?q=NonExistentPatient12345');
    const res = await searchPatientsRoute(req);
    const data = await res.json();

    if (!Array.isArray(data) || data.length !== 0) {
      throw new Error('Expected 0 results for non-matching query');
    }
  });
});

describe('M1 Challenger: /api/doctors & /api/doctors/[id] Referring Doctor Management Route', () => {
  test('GET /api/doctors returns doctor list with aggregated sample counts and commissions', async () => {
    const req = makeRequest('http://localhost:3000/api/doctors');
    const res = await getDoctorsList();

    if (res.status !== 200) {
      throw new Error(`Expected status 200, got ${res.status}`);
    }

    const doctors = await res.json();
    if (!Array.isArray(doctors) || doctors.length === 0) {
      throw new Error('Expected non-empty doctors array');
    }

    const doc1 = doctors.find((d: any) => d.id === 'doc-1');
    if (!doc1) {
      throw new Error('doc-1 missing from doctors list');
    }

    if (typeof doc1.sampleCount !== 'number' || typeof doc1.totalCommissions !== 'number') {
      throw new Error('Missing sampleCount or totalCommissions statistics in doctor item');
    }

    if (doc1.totalCommissions < 3000) {
      throw new Error(`Expected doc1 totalCommissions >= 3000, got ${doc1.totalCommissions}`);
    }
  });

  test('POST /api/doctors creates new doctor with valid fields -> 201', async () => {
    const newDocPayload = {
      name: 'د. سامر عبد الله الكرخي',
      phone: '07705556677',
      specialty: 'Endocrinology & Diabetes',
      commissionPercent: 15,
      clinicAddress: 'بغداد - المنصور - ساحة الرواد',
      notes: 'طبيب استشاري غدد صماء وسكري'
    };

    const req = makeRequest('http://localhost:3000/api/doctors', {
      method: 'POST',
      body: newDocPayload
    });

    const res = await postDoctor(req);
    if (res.status !== 201) {
      throw new Error(`Expected status 201 on doctor creation, got ${res.status}`);
    }

    const created = await res.json();
    if (!created.id || created.name !== 'د. سامر عبد الله الكرخي' || created.commissionPercent !== 15) {
      throw new Error(`Doctor creation response invalid: ${JSON.stringify(created)}`);
    }

    // Verify retrieval via GET /api/doctors/[id]
    const getReq = makeRequest(`http://localhost:3000/api/doctors/${created.id}`);
    const getRes = await getDoctor(getReq, { params: { id: created.id } });
    if (getRes.status !== 200) {
      throw new Error(`Could not retrieve newly created doctor by ID: status ${getRes.status}`);
    }
  });

  test('POST /api/doctors with missing name or empty whitespace returns 400 Bad Request', async () => {
    const badPayloads = [
      {},
      { name: '' },
      { name: '   ' },
      { specialty: 'Cardiology' }
    ];

    for (const payload of badPayloads) {
      const req = makeRequest('http://localhost:3000/api/doctors', {
        method: 'POST',
        body: payload
      });

      const res = await postDoctor(req);
      if (res.status !== 400) {
        throw new Error(`Expected 400 Bad Request for invalid doctor payload ${JSON.stringify(payload)}, got ${res.status}`);
      }

      const json = await res.json();
      if (!json.message) {
        throw new Error('Expected error message in 400 response');
      }
    }
  });

  test('POST /api/doctors with omitted commissionPercent defaults to 10%', async () => {
    const payload = {
      name: 'د. ليث حميد الراوي',
      phone: '07801122334'
    };

    const req = makeRequest('http://localhost:3000/api/doctors', {
      method: 'POST',
      body: payload
    });

    const res = await postDoctor(req);
    if (res.status !== 201) {
      throw new Error(`Expected 201, got ${res.status}`);
    }

    const created = await res.json();
    if (created.commissionPercent !== 10) {
      throw new Error(`Expected default commission 10%, got ${created.commissionPercent}`);
    }
  });

  test('GET /api/doctors/doc-nonexistent returns 404', async () => {
    const req = makeRequest('http://localhost:3000/api/doctors/doc-nonexistent');
    const res = await getDoctor(req, { params: { id: 'doc-nonexistent' } });

    if (res.status !== 404) {
      throw new Error(`Expected 404 for non-existent doctor, got ${res.status}`);
    }
  });

  test('PATCH /api/doctors/[id] updates doctor fields and syncs in-memory samples', async () => {
    const updatePayload = {
      specialty: 'Consultant Nephrologist',
      commissionPercent: 20
    };

    const req = makeRequest('http://localhost:3000/api/doctors/doc-1', {
      method: 'PATCH',
      body: updatePayload
    });

    const res = await patchDoctor(req, { params: { id: 'doc-1' } });
    if (res.status !== 200) {
      throw new Error(`Expected 200 on doctor PATCH, got ${res.status}`);
    }

    const updated = await res.json();
    if (updated.specialty !== 'Consultant Nephrologist' || updated.commissionPercent !== 20) {
      throw new Error(`Doctor update not reflected: ${JSON.stringify(updated)}`);
    }
  });

  test('DELETE /api/doctors/[id] removes doctor and returns 200, repeated DELETE returns 404', async () => {
    const postReq = makeRequest('http://localhost:3000/api/doctors', {
      method: 'POST',
      body: { name: 'د. مؤقت للحذف' }
    });
    const postRes = await postDoctor(postReq);
    const created = await postRes.json();

    const delReq = makeRequest(`http://localhost:3000/api/doctors/${created.id}`, { method: 'DELETE' });
    const delRes = await deleteDoctor(delReq, { params: { id: created.id } });
    if (delRes.status !== 200) {
      throw new Error(`Expected 200 on DELETE, got ${delRes.status}`);
    }

    const delRes2 = await deleteDoctor(delReq, { params: { id: created.id } });
    if (delRes2.status !== 404) {
      throw new Error(`Expected 404 on deleting already deleted doctor, got ${delRes2.status}`);
    }
  });
});

describe('M1 Challenger: /api/settings Lab Settings & Letterhead Configuration Route', () => {
  test('GET /api/settings returns full LabSettings structure', async () => {
    const res = await getSettingsRoute();
    if (res.status !== 200) {
      throw new Error(`Expected 200 on GET /api/settings, got ${res.status}`);
    }

    const settings = await res.json();
    if (!settings.labName || !settings.headerMode || !settings.reportTemplate) {
      throw new Error(`Incomplete settings structure: ${JSON.stringify(settings)}`);
    }

    if (typeof settings.topMarginMm !== 'number' || typeof settings.bottomMarginMm !== 'number') {
      throw new Error('Missing millimeter margin settings for pre-printed letterhead mode');
    }
  });

  test('POST /api/settings performs atomic update and preserves unchanged fields', async () => {
    const partialUpdate = {
      headerMode: 'PREPRINTED',
      topMarginMm: 45,
      bottomMarginMm: 30,
      leftMarginMm: 20,
      rightMarginMm: 20,
      reportTemplate: 'MODERN'
    };

    const req = makeRequest('http://localhost:3000/api/settings', {
      method: 'POST',
      body: partialUpdate
    });

    const res = await postSettingsRoute(req);
    if (res.status !== 200) {
      throw new Error(`Expected 200 on POST /api/settings, got ${res.status}`);
    }

    const updated = await res.json();
    if (
      updated.headerMode !== 'PREPRINTED' ||
      updated.topMarginMm !== 45 ||
      updated.bottomMarginMm !== 30 ||
      updated.reportTemplate !== 'MODERN'
    ) {
      throw new Error(`Settings POST update mismatch: ${JSON.stringify(updated)}`);
    }

    if (!updated.labName) {
      throw new Error('Unchanged fields like labName were wiped out during partial settings update');
    }

    const getRes = await getSettingsRoute();
    const retrieved = await getRes.json();
    if (retrieved.topMarginMm !== 45 || retrieved.headerMode !== 'PREPRINTED') {
      throw new Error('Subsequent GET did not return persisted settings updates');
    }
  });

  test('PUT and PATCH /api/settings behave idempotently with POST', async () => {
    const putReq = makeRequest('http://localhost:3000/api/settings', {
      method: 'PUT',
      body: { primaryColor: '#10b981' }
    });
    const putRes = await putSettingsRoute(putReq);
    if (putRes.status !== 200) throw new Error(`PUT returned ${putRes.status}`);

    const patchReq = makeRequest('http://localhost:3000/api/settings', {
      method: 'PATCH',
      body: { primaryColor: '#6366f1' }
    });
    const patchRes = await patchSettingsRoute(patchReq);
    if (patchRes.status !== 200) throw new Error(`PATCH returned ${patchRes.status}`);

    const patchData = await patchRes.json();
    if (patchData.primaryColor !== '#6366f1') {
      throw new Error(`PATCH did not apply primaryColor update: ${patchData.primaryColor}`);
    }
  });

  test('Zero millimeter margin settings (topMarginMm: 0) are accepted and preserved', async () => {
    const req = makeRequest('http://localhost:3000/api/settings', {
      method: 'POST',
      body: { topMarginMm: 0, bottomMarginMm: 0 }
    });

    const res = await postSettingsRoute(req);
    const data = await res.json();
    if (data.topMarginMm !== 0 || data.bottomMarginMm !== 0) {
      throw new Error(`Zero margins not preserved: top=${data.topMarginMm}, bottom=${data.bottomMarginMm}`);
    }
  });
});

describe('M1 Challenger: Financial Discounts & Doctor Commission Invariants', () => {
  test('0% discount yields netPayable == priceTotal and standard commission', () => {
    const sample = addSample({
      patientName: 'مريض تجربة الخصم 0',
      doctorId: 'doc-1',
      priceTotal: 40000,
      discount: 0,
      discountPercent: 0,
      paidAmount: 40000,
      testIds: ['t-gue']
    });

    if (sample.remainingAmount !== 0) {
      throw new Error(`Expected remainingAmount 0, got ${sample.remainingAmount}`);
    }

    const expectedCommission = Math.round(40000 * (sample.doctor?.commissionPercent || 10) / 100);
    if (sample.doctorCommission !== expectedCommission) {
      throw new Error(`Expected doctor commission ${expectedCommission}, got ${sample.doctorCommission}`);
    }
  });

  test('20% discount correctly reduces net payable and doctor commission base', () => {
    const sample = addSample({
      patientName: 'مريض تجربة الخصم 20%',
      doctorId: 'doc-1',
      priceTotal: 50000,
      discount: 10000,
      discountPercent: 20,
      paidAmount: 30000,
      testIds: ['t-cbc']
    });

    if (sample.remainingAmount !== 10000) {
      throw new Error(`Expected remainingAmount 10000, got ${sample.remainingAmount}`);
    }

    const docPercent = sample.doctor?.commissionPercent || 10;
    const expectedCommission = Math.round(40000 * docPercent / 100);
    if (sample.doctorCommission !== expectedCommission) {
      throw new Error(`Doctor commission was not calculated on discounted net: expected ${expectedCommission}, got ${sample.doctorCommission}`);
    }
  });

  test('100% Charitable / Exempt Discount yields netPayable = 0, debt = 0, commission = 0', () => {
    const sample = addSample({
      patientName: 'مريض إعفاء خيري كامل',
      doctorId: 'doc-1',
      priceTotal: 35000,
      discount: 35000,
      discountPercent: 100,
      paidAmount: 0,
      testIds: ['t-gue']
    });

    if (sample.remainingAmount !== 0) {
      throw new Error(`Expected remainingAmount 0 for 100% discount, got ${sample.remainingAmount}`);
    }

    if (sample.doctorCommission !== 0) {
      throw new Error(`Expected doctor commission 0 for 100% discount, got ${sample.doctorCommission}`);
    }
  });

  test('Extreme discount > priceTotal (e.g. 60,000 on 30,000) is clamped gracefully to 0 without negative debt', () => {
    const sample = addSample({
      patientName: 'مريض خصم مفرط',
      priceTotal: 30000,
      discount: 60000,
      paidAmount: 0,
      testIds: ['t-fbs']
    });

    if (sample.remainingAmount !== 0) {
      throw new Error(`Expected remainingAmount 0 when discount > total, got ${sample.remainingAmount}`);
    }

    if (sample.doctorCommission !== 0) {
      throw new Error(`Expected doctor commission 0, got ${sample.doctorCommission}`);
    }
  });

  test('Negative discount input (-5,000) is handled safely without crashing', () => {
    const sample = addSample({
      patientName: 'مريض خصم سالب',
      priceTotal: 25000,
      discount: -5000,
      paidAmount: 0,
      testIds: ['t-cbc']
    });

    if (typeof sample.remainingAmount !== 'number' || isNaN(sample.remainingAmount)) {
      throw new Error('Negative discount caused NaN remainingAmount');
    }
  });
});

describe('M1 Challenger: Adversarial Stress & Robustness Hardening', () => {
  test('Search with regex meta-characters (.*+?[]()^$\\) does not crash and returns safely', async () => {
    const metaQueries = ['.*', '(', '[a-z]', '+', '?', '\\', '^', '$', '.*|.*'];
    for (const q of metaQueries) {
      const req = makeRequest(`http://localhost:3000/api/patients/search?q=${encodeURIComponent(q)}`);
      const res = await searchPatientsRoute(req);
      if (res.status !== 200) {
        throw new Error(`Search crashed with status ${res.status} on regex meta-query: ${q}`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error(`Expected array return for meta-query: ${q}`);
      }
    }
  });

  test('Settings round-trip preserves rich Arabic text without Mojibake or character loss', async () => {
    const arabicSettings = {
      labName: 'مختبر بغداد التخصصي للتحليلات المرضية والمناعة السريرية',
      labSubtitle: 'فحوصات الجينات والوراثة الخلوية - دقة تشخيصية معتمدة دولياً (ISO 15189:2022)',
      reportFooter: 'هذا التقرير صادر إلكترونياً وموقع رقمياً - صالح لكافة المعاملات الطبية والقانونية الرسمية.'
    };

    const postReq = makeRequest('http://localhost:3000/api/settings', {
      method: 'POST',
      body: arabicSettings
    });
    const postRes = await postSettingsRoute(postReq);
    if (postRes.status !== 200) throw new Error(`POST Arabic settings failed: ${postRes.status}`);

    const getRes = await getSettingsRoute();
    const retrieved = await getRes.json();

    if (retrieved.labName !== arabicSettings.labName) {
      throw new Error(`Arabic labName corrupted: expected "${arabicSettings.labName}", got "${retrieved.labName}"`);
    }
    if (retrieved.labSubtitle !== arabicSettings.labSubtitle) {
      throw new Error(`Arabic labSubtitle corrupted: expected "${arabicSettings.labSubtitle}", got "${retrieved.labSubtitle}"`);
    }
    if (retrieved.reportFooter !== arabicSettings.reportFooter) {
      throw new Error(`Arabic reportFooter corrupted: expected "${arabicSettings.reportFooter}", got "${retrieved.reportFooter}"`);
    }
  });

  test('Sequential sample creation maintains monotonic sampleNumber incrementation', () => {
    const s1 = addSample({ patientName: 'تسلسل 1', priceTotal: 10000 });
    const s2 = addSample({ patientName: 'تسلسل 2', priceTotal: 10000 });
    const s3 = addSample({ patientName: 'تسلسل 3', priceTotal: 10000 });

    if (s2.sampleNumber <= s1.sampleNumber || s3.sampleNumber <= s2.sampleNumber) {
      throw new Error(`Non-monotonic sample numbers: s1=${s1.sampleNumber}, s2=${s2.sampleNumber}, s3=${s3.sampleNumber}`);
    }
  });
});
