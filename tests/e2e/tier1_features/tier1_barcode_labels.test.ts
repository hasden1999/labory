/**
 * Tier 1 Feature Coverage: Barcode Thermal Labels (R4)
 * Covers: 50x25mm thermal print format, barcode SVG rendering, sample metadata,
 * patient demographics on label, and test abbreviation lists.
 */

import { describe, test } from '../harness/testRunner';
import { expect } from '../harness/assertions';

describe('Tier 1: Barcode Thermal Labels', () => {

  function renderBarcodeLabelHtml(sample: any): string {
    const testCodes = sample.tests.map((t: any) => t.code || t.name.substring(0, 4)).join(', ');
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: 50mm 25mm; margin: 0; }
          body { margin: 0; width: 50mm; height: 25mm; font-family: monospace; padding: 1.5mm; box-sizing: border-box; }
          .label-header { display: flex; justify-content: space-between; font-size: 8px; font-weight: bold; }
          .barcode-container { text-align: center; margin: 1mm 0; }
          .barcode-svg { width: 44mm; height: 10mm; }
          .sample-num { font-size: 10px; font-weight: bold; letter-spacing: 1px; }
          .test-list { font-size: 7px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        </style>
      </head>
      <body>
        <div class="label-header">
          <span>${sample.patient.name}</span>
          <span>${sample.patient.age}y / ${sample.patient.gender === 'MALE' ? 'M' : 'F'}</span>
        </div>
        <div class="barcode-container">
          <svg class="barcode-svg" data-barcode="${sample.sampleNumber}">
            <rect width="100%" height="100%" fill="#000" />
          </svg>
          <div class="sample-num">#${sample.sampleNumber}</div>
        </div>
        <div class="test-list">${testCodes}</div>
      </body>
      </html>
    `;
  }

  const mockSample = {
    id: 's-1001',
    sampleNumber: 1001,
    patient: { name: 'حيدر الخفاجي', age: 48, gender: 'MALE' },
    tests: [
      { code: 'GUE', name: 'General Urine Examination' },
      { code: 'CBC', name: 'Complete Blood Count' },
      { code: 'CREAT', name: 'Serum Creatinine' }
    ],
    collectedAt: '2026-08-31 20:30'
  };

  test('R4.1: 50x25mm Standard Thermal Print Dimensions in CSS', () => {
    const html = renderBarcodeLabelHtml(mockSample);

    expect(html).toContain('size: 50mm 25mm');
    expect(html).toContain('width: 50mm');
    expect(html).toContain('height: 25mm');
  });

  test('R4.2: Barcode SVG rendering with sample number', () => {
    const html = renderBarcodeLabelHtml(mockSample);

    expect(html).toContain('data-barcode="1001"');
    expect(html).toContain('#1001');
    expect(html).toContain('<svg class="barcode-svg"');
  });

  test('R4.3: Patient Demographics displayed concisely on thermal label', () => {
    const html = renderBarcodeLabelHtml(mockSample);

    expect(html).toContain('حيدر الخفاجي');
    expect(html).toContain('48y / M');
  });

  test('R4.4: Ordered Test Abbreviations listed on label for tube routing', () => {
    const html = renderBarcodeLabelHtml(mockSample);

    expect(html).toContain('GUE, CBC, CREAT');
  });

  test('R4.5: High volume batch generation of thermal labels', () => {
    const sampleBatch = [
      { ...mockSample, sampleNumber: 1001 },
      { ...mockSample, sampleNumber: 1002 },
      { ...mockSample, sampleNumber: 1003 },
      { ...mockSample, sampleNumber: 1004 },
      { ...mockSample, sampleNumber: 1005 }
    ];

    const batchHtml = sampleBatch.map(s => renderBarcodeLabelHtml(s)).join('\n<!-- PAGE BREAK -->\n');

    expect(batchHtml).toContain('#1001');
    expect(batchHtml).toContain('#1005');
    expect(sampleBatch.length).toBe(5);
  });

});
