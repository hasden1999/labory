import { ParsedAnalyzerMessage, parseAstm1394 } from './astmParser';
import { parseHl7V2 } from './hl7Parser';
import { parseCsvOrText } from './csvParser';

export function parseUniversalPayload(raw: string, forcedProtocol?: string): ParsedAnalyzerMessage {
  if (!raw || typeof raw !== 'string') {
    return {
      protocol: 'CUSTOM_TEXT',
      items: [],
      rawMessage: String(raw || ''),
    };
  }

  // If forced protocol is provided
  if (forcedProtocol === 'ASTM_1394') {
    return parseAstm1394(raw);
  }
  if (forcedProtocol === 'HL7_V2') {
    return parseHl7V2(raw);
  }
  if (forcedProtocol === 'CSV_DELIMITED') {
    return parseCsvOrText(raw);
  }

  // Auto-detect based on signature
  const trimmed = raw.trim();

  // HL7 v2 starts with MSH
  if (trimmed.startsWith('MSH|') || trimmed.includes('\nMSH|') || trimmed.includes('\rMSH|')) {
    return parseHl7V2(raw);
  }

  // ASTM 1394 has H|\ or H|^ or \d?H|
  if (/^(\x02)?\d?H\|/i.test(trimmed) || /\|[\\^&]+\|/i.test(trimmed)) {
    return parseAstm1394(raw);
  }

  // Check if it's JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsedJson = JSON.parse(trimmed);
      if (parsedJson.items && Array.isArray(parsedJson.items)) {
        return {
          protocol: 'CUSTOM_TEXT',
          sampleNumber: parsedJson.sampleNumber,
          sampleBarcode: parsedJson.sampleBarcode || String(parsedJson.sampleNumber || ''),
          patientName: parsedJson.patientName,
          items: parsedJson.items,
          rawMessage: raw,
        };
      }
    } catch {
      // Fall through to CSV / Text
    }
  }

  // Default to CSV / Delimited text parser
  return parseCsvOrText(raw);
}
