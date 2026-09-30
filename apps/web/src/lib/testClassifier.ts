/**
 * Test Classification Utility
 * Decouples specialized test type detection from route handlers (Print & WhatsApp)
 */

export const isCbcTest = (t: any) => {
  const code = (t.test?.code || t.testCode || '').toUpperCase();
  const name = (t.test?.name || '').toLowerCase();
  const val = typeof t.resultValue === 'string' ? t.resultValue : '';
  return (
    code === 'CBC' ||
    code === 'FBC' ||
    name.includes('complete blood count') ||
    name.includes('صورة الدم') ||
    val.includes('CBC') ||
    val.includes('ERYTHROID:') ||
    val.includes('DIFFERENTIAL:')
  );
};

export const isSfaTest = (t: any) => {
  if (isCbcTest(t)) return false;
  const code = (t.test?.code || t.testCode || '').toUpperCase();
  const name = (t.test?.name || '').toLowerCase();
  const val = typeof t.resultValue === 'string' ? t.resultValue : '';
  return (
    code === 'SFA' ||
    val.includes('S.F.A') ||
    val.includes('SEMINAL') ||
    name.includes('semen') ||
    name.includes('سائل منوي') ||
    name.includes('نطف') ||
    (val.includes('PHYSICAL:') && (val.includes('MOTILITY:') || val.includes('MORPHOLOGY:')))
  );
};

export const isGueTest = (t: any) => {
  if (isCbcTest(t) || isSfaTest(t)) return false;
  const code = (t.test?.code || t.testCode || '').toUpperCase();
  const name = (t.test?.name || '').toLowerCase();
  const val = typeof t.resultValue === 'string' ? t.resultValue : '';
  return (
    code === 'GUE' ||
    val.includes('G.U.E') ||
    name.includes('urine') ||
    name.includes('إدرار') ||
    (val.includes('PHYSICAL:') && !val.includes('G.S.E') && !val.includes('PARASITOLOGY:'))
  );
};

export const isGseTest = (t: any) => {
  if (isCbcTest(t) || isSfaTest(t)) return false;
  const code = (t.test?.code || t.testCode || '').toUpperCase();
  const name = (t.test?.name || '').toLowerCase();
  const val = typeof t.resultValue === 'string' ? t.resultValue : '';
  return (
    code === 'GSE' ||
    val.includes('G.S.E') ||
    name.includes('stool') ||
    name.includes('خروج') ||
    val.includes('PARASITOLOGY:')
  );
};

export const isGeneralTest = (t: any) =>
  !isCbcTest(t) && !isSfaTest(t) && !isGueTest(t) && !isGseTest(t);
