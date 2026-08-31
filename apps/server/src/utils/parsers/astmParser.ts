export interface ParsedItem {
  testCode: string;
  testName?: string;
  value: string;
  unit?: string;
  flags?: string; // e.g. H, L, N, A, C
  isAbnormal?: boolean;
  isCritical?: boolean;
  timestamp?: string;
}

export interface ParsedAnalyzerMessage {
  protocol: 'ASTM_1394' | 'HL7_V2' | 'CSV_DELIMITED' | 'CUSTOM_TEXT';
  sampleNumber?: number;
  sampleBarcode?: string;
  patientName?: string;
  patientId?: string;
  messageType?: string;
  timestamp?: Date;
  items: ParsedItem[];
  rawMessage: string;
}

/**
 * Clean control characters & ASTM E1381 frame checksums from transmission
 * Handles STX (0x02), ETX (0x03), EOT (0x04), ENQ (0x05), ACK (0x06), LF (0x0A), CR (0x0D), NAK (0x15), ETB (0x17)
 * and strips 2-byte hexadecimal checksums following ETX/ETB.
 */
export function cleanAstmControlChars(raw: string): string {
  return raw
    // Strip ETX/ETB followed by 2-character hex checksum (e.g. \x034E or \x172A)
    .replace(/[\x03\x17][0-9A-Fa-f]{2}/g, '')
    // Strip remaining control characters
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

/**
 * Parses ASTM E1381 / E1394 records:
 * Record types:
 * H | \ ^ & | ... (Header)
 * P | 1 | ... (Patient)
 * O | 1 | SampleID | ... (Order)
 * R | 1 | ^^^TestCode^TestName | Value | Units | RefRanges | AbnormalFlag | ... (Result)
 * C | 1 | ... (Comment)
 * L | 1 | N (Terminator)
 */
export function parseAstm1394(raw: string): ParsedAnalyzerMessage {
  const cleaned = cleanAstmControlChars(raw);
  const lines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean);

  let sampleNumber: number | undefined = undefined;
  let sampleBarcode: string | undefined = undefined;
  let patientName: string | undefined = undefined;
  let patientId: string | undefined = undefined;
  const items: ParsedItem[] = [];

  for (const line of lines) {
    // Strip leading frame sequence number if present (e.g. "1H|...", "2P|...", "3O|...", "4R|...")
    const matchFrame = line.match(/^(\d?)([HPORCL])\|(.*)$/i);
    if (!matchFrame) continue;

    const recordType = matchFrame[2].toUpperCase();
    const rest = matchFrame[3];
    const fields = rest.split('|');

    switch (recordType) {
      case 'P': {
        // Patient Record: P | seq | practiceId | labId | patientId | patientName(Last^First)
        if (fields.length > 2 && fields[2]) patientId = fields[2].trim();
        if (fields.length > 3 && fields[3] && !patientId) patientId = fields[3].trim();
        if (fields.length > 4 && fields[4]) {
          const nameParts = fields[4].split('^').filter(Boolean);
          patientName = nameParts.join(' ').trim();
        }
        break;
      }
      case 'O': {
        // Order Record: O | seq | specimenId / sampleId | instrumentSpecimenId | ...
        const rawSampleId = fields[1]?.trim() || fields[2]?.trim() || '';
        if (rawSampleId) {
          sampleBarcode = rawSampleId;
          const numericMatch = rawSampleId.match(/\d+/);
          if (numericMatch) {
            sampleNumber = parseInt(numericMatch[0], 10);
          }
        }
        break;
      }
      case 'R': {
        // Result Record: R | seq | ^^^TestCode^TestName | Value | Units | RefRange | AbnormalFlag | ...
        // fields: [seq, universalTestId, dataOrValue, units, refRanges, abnormalFlags, natureOfAbnormal, status, dateTestCompleted]
        const rawTestId = fields[1]?.trim() || '';
        
        let testCode = '';
        let testName: string | undefined = undefined;

        if (rawTestId.includes('^')) {
          const parts = rawTestId.split('^');
          // Standard ASTM format: ^^^TestCode^TestName or ^^^TestCode
          if (parts.length >= 4 && parts[3]) {
            testCode = parts[3].trim();
            testName = parts[4]?.trim() || undefined;
          } else {
            const nonEmpties = parts.map((p) => p.trim()).filter(Boolean);
            testCode = nonEmpties[0] || rawTestId;
            testName = nonEmpties[1] || undefined;
          }
        } else {
          testCode = rawTestId;
        }

        const value = fields[2]?.trim() || '';
        const unit = fields[3]?.trim() || '';
        // Strip any residual checksum from flag field if present
        let flag = fields[5]?.trim() || '';
        flag = flag.replace(/^[0-9A-Fa-f]{2}$/, ''); // if only checksum remained

        if (testCode && value) {
          const cleanFlag = flag.toUpperCase();
          const isAbnormal = ['H', 'L', 'A', 'AA', 'HH', 'LL', '+', '-', 'POS', 'POSITIVE'].includes(cleanFlag);
          const isCritical = ['HH', 'LL', 'CRIT', 'PANIC', 'C'].includes(cleanFlag);

          items.push({
            testCode: testCode.toUpperCase(),
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
    protocol: 'ASTM_1394',
    sampleNumber,
    sampleBarcode,
    patientName,
    patientId,
    timestamp: new Date(),
    items,
    rawMessage: raw,
  };
}
