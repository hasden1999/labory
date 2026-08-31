import { ParsedAnalyzerMessage, ParsedItem } from './astmParser';

/**
 * Parses HL7 v2.x (ORU^R01) messages commonly used by Mindray BC-5000, Sysmex XN, Cobas, Beckman Coulter, Maglumi, etc.
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

  for (const line of lines) {
    if (!line.includes('|')) continue;
    const segment = line.substring(0, 3).toUpperCase();
    const fields = line.split('|');

    switch (segment) {
      case 'MSH': {
        // MSH|^~\&|SendingApp|SendingFacility|...|...|DateTime||MsgType|...
        if (fields.length > 8 && fields[8]) {
          messageType = fields[8].trim();
        }
        break;
      }
      case 'PID': {
        // PID|SetID|PatientID|PatientIdentifierList|...|PatientName(Last^First)
        if (fields.length > 3 && fields[3]) patientId = fields[3].trim();
        if (fields.length > 5 && fields[5]) {
          const parts = fields[5].split('^').filter(Boolean);
          patientName = parts.join(' ').trim();
        }
        break;
      }
      case 'OBR': {
        // OBR|SetID|PlacerOrderNumber|FillerOrderNumber|UniversalServiceIdentifier|...
        const rawOrder = fields[2]?.trim() || fields[3]?.trim() || '';
        if (rawOrder && !sampleBarcode) {
          sampleBarcode = rawOrder;
          const num = rawOrder.match(/\d+/);
          if (num) sampleNumber = parseInt(num[0], 10);
        }
        break;
      }
      case 'OBX': {
        // OBX|SetID|ValueType|ObservationIdentifier(Code^Name^CodingSystem^AltCode)|ObservationSubId|ObservationValue|Units|RefRange|AbnormalFlags|...|ResultStatus
        // fields: [OBX, 1, NM, WBC^White Blood Cell, subId, 7.45, 10*3/uL, 4.0-10.0, N, ..., status]
        const resultStatus = fields[11]?.trim()?.toUpperCase() || '';
        // Skip deleted or cancelled tests
        if (resultStatus === 'X' || resultStatus === 'D') continue;

        const testIdentifier = fields[3]?.trim() || '';
        const testParts = testIdentifier.split('^').map((p) => p.trim());
        
        // If LOINC identifier is present e.g. "6690-2^Leukocytes^LN^WBC", check alt code or first code
        let testCode = testParts[0] || '';
        if (testParts.length >= 4 && testParts[3] && !testParts[0].match(/^[A-Za-z]/)) {
          testCode = testParts[3]; // Alt manufacturer code like WBC
        }
        const testName = testParts[1] || testCode;

        const value = fields[5]?.trim() || '';
        const unit = fields[6]?.trim() || '';
        const flag = fields[8]?.trim() || '';

        if (testCode && value) {
          const cleanFlag = flag.toUpperCase();
          const isAbnormal = ['H', 'L', 'A', 'AA', 'HH', 'LL', 'POS', 'POSITIVE', '+', '-'].includes(cleanFlag);
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
    protocol: 'HL7_V2',
    sampleNumber,
    sampleBarcode,
    patientName,
    patientId,
    messageType,
    timestamp: new Date(),
    items,
    rawMessage: raw,
  };
}
