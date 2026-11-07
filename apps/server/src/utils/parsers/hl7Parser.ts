import { ParsedAnalyzerMessage, ParsedItem } from './astmParser';

/**
 * Parses HL7 v2.x (ORU^R01) messages commonly used by Mindray BC-30s, BC-5000, Sysmex XN, Cobas, Beckman Coulter, Maglumi, etc.
 * Supports standard MLLP envelope stripping (VT \x0B and FS \x1C CR \x0D).
 */
export function parseHl7V2(raw: string): ParsedAnalyzerMessage {
  // Strip MLLP control characters and normalize newlines
  const cleaned = raw
    .replace(/^[\x0B\x00-\x09]+/, '')
    .replace(/[\x1C\x0D\x0B]+$/, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  const lines = cleaned
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let sampleNumber: number | undefined = undefined;
  let sampleBarcode: string | undefined = undefined;
  let patientName: string | undefined = undefined;
  let patientId: string | undefined = undefined;
  let messageType = 'ORU^R01';
  const items: ParsedItem[] = [];
  const histograms: { wbc?: number[]; rbc?: number[]; plt?: number[] } = {};

  for (const line of lines) {
    if (!line.includes('|')) continue;
    const segment = line.substring(0, 3).toUpperCase();
    const fields = line.split('|');

    switch (segment) {
      case 'MSH': {
        if (fields.length > 8 && fields[8]) {
          messageType = fields[8].trim();
        }
        break;
      }
      case 'PID': {
        if (fields.length > 3 && fields[3]) patientId = fields[3].trim();
        if (fields.length > 5 && fields[5]) {
          const parts = fields[5].split('^').filter(Boolean);
          patientName = parts.join(' ').trim();
        }
        break;
      }
      case 'OBR': {
        const rawOrder = (fields[3]?.split('^')[0]?.trim() || fields[2]?.split('^')[0]?.trim() || '');
        if (rawOrder && !sampleBarcode) {
          sampleBarcode = rawOrder;
          const num = rawOrder.match(/\d+/);
          if (num) sampleNumber = parseInt(num[0], 10);
        }
        break;
      }
      case 'OBX': {
        const resultStatus = fields[11]?.trim()?.toUpperCase() || '';
        if (resultStatus === 'X' || resultStatus === 'D') continue;

        const valueType = fields[2]?.trim()?.toUpperCase() || '';
        const testIdentifier = fields[3]?.trim() || '';
        const testParts = testIdentifier.split('^').map((p) => p.trim());
        const rawCodePart = testParts[0] || '';

        let testCode = rawCodePart;
        if (testParts.length >= 2 && !/^[A-Za-z]/.test(rawCodePart)) {
          testCode = testParts[3] || testParts[1] || rawCodePart;
        }
        const testName = testParts[1] || testParts[3] || testCode;

        const value = fields[5]?.trim() || '';
        const unit = (fields[6]?.split('^')[0]?.trim() || '').replace(/^10\*(\d+)/, '10^$1');
        const flag = fields[8]?.trim() || '';

        // Check for histogram curves (text or Mindray ED Base64 binary)
        const upperCode = testCode.toUpperCase().trim();
        if (upperCode.includes('HISTOGRAM.BINARY') && value) {
          try {
            const b64Part = value.includes('^') ? (value.split('^').pop() || '') : value;
            if (b64Part) {
              const bytes = Array.from(Buffer.from(b64Part, 'base64'));
              if (bytes.length > 0) {
                if (upperCode.includes('WBC')) histograms.wbc = bytes;
                else if (upperCode.includes('RBC')) histograms.rbc = bytes;
                else if (upperCode.includes('PLT')) histograms.plt = bytes;
              }
            }
          } catch {}
          continue;
        }

        if (upperCode.includes('HIST') || upperCode.includes('WBC_CURVE') || upperCode.includes('RBC_CURVE') || upperCode.includes('PLT_CURVE')) {
          const nums = value.split(/[\s,;^~]+/).map(Number).filter((n) => !isNaN(n));
          if (nums.length > 0) {
            if (upperCode.includes('WBC')) histograms.wbc = nums;
            else if (upperCode.includes('RBC')) histograms.rbc = nums;
            else if (upperCode.includes('PLT')) histograms.plt = nums;
          }
          continue;
        }

        if (
          valueType === 'IS' ||
          valueType === 'ED' ||
          upperCode.includes('HISTOGRAM') ||
          upperCode.includes('SCATTERGRAM') ||
          [
            'TAKE MODE',
            'BLOOD MODE',
            'TEST MODE',
            'REF GROUP',
            'AGE',
            'REMARK',
            'GRANULARITY',
            'PROJECT NAME',
          ].includes(upperCode) ||
          /^(0800|0100|120|150|151)/.test(rawCodePart)
        ) {
          continue;
        }

        const CODE_ALIAS_MAP: Record<string, string> = {
          'LYMPH#': 'LYM#',
          'LYMPH%': 'LYM%',
          'GRAN#': 'GRAN#',
          'GRAN%': 'GRAN%',
          'MID#': 'MID#',
          'MID%': 'MID%',
          'NEUT#': 'NEU#',
          'NEUT%': 'NEU%',
          'MONO#': 'MON#',
          'MONO%': 'MON%',
          'BASO#': 'BAS#',
          'BASO%': 'BAS%',
        };
        const normalizedCode = CODE_ALIAS_MAP[upperCode] || upperCode;

        if (normalizedCode && value) {
          const cleanFlag = flag.toUpperCase();
          const isAbnormal = ['H', 'L', 'A', 'AA', 'HH', 'LL', 'POS', 'POSITIVE', '+', '-'].includes(cleanFlag);
          const isCritical = ['HH', 'LL', 'CRIT', 'PANIC', 'C'].includes(cleanFlag);

          items.push({
            testCode: normalizedCode,
            testName,
            value,
            unit,
            flags: flag || undefined,
            isAbnormal,
            isCritical,
          });
        }
        break;
      }
    }
  }

  return {
    protocol: 'HL7_V2',
    sampleNumber,
    sampleBarcode,
    patientName,
    patientId,
    messageType,
    timestamp: new Date(),
    items,
    histograms: Object.keys(histograms).length > 0 ? histograms : undefined,
    rawMessage: raw,
  };
}
