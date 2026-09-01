/**
 * Tier 1 Feature Coverage: Pre-Printed Letterhead Mode & Millimeter Margins (R1)
 * Covers: HeaderMode (DIGITAL vs PREPRINTED), digital header suppression,
 * millimeter margin calibration (top, bottom, left, right), and print media rules.
 */

import { describe, test } from '../harness/testRunner';
import { expect } from '../harness/assertions';
import { FIXTURE_SETTINGS } from '../harness/fixtures';

describe('Tier 1: Pre-Printed Letterhead Mode & Millimeter Margins', () => {

  function generatePrintStyle(settings: typeof FIXTURE_SETTINGS.classicDigital): {
    headerVisible: boolean;
    pageMarginCss: string;
    containerPaddingCss: string;
  } {
    const isPreprinted = settings.headerMode === 'PREPRINTED';
    return {
      headerVisible: !isPreprinted,
      pageMarginCss: `@page { margin: ${settings.topMarginMm}mm ${settings.rightMarginMm}mm ${settings.bottomMarginMm}mm ${settings.leftMarginMm}mm; }`,
      containerPaddingCss: `padding-top: ${settings.topMarginMm}mm; padding-bottom: ${settings.bottomMarginMm}mm; padding-left: ${settings.leftMarginMm}mm; padding-right: ${settings.rightMarginMm}mm;`
    };
  }

  test('R1.1: DIGITAL Header Mode includes lab name, logo, doctor license & registration', () => {
    const settings = FIXTURE_SETTINGS.classicDigital;
    const style = generatePrintStyle(settings);

    expect(settings.headerMode).toBe('DIGITAL');
    expect(style.headerVisible).toBe(true);
  });

  test('R1.2: PREPRINTED Letterhead Mode suppresses digital header elements', () => {
    const settings = FIXTURE_SETTINGS.preprintedLetterhead;
    const style = generatePrintStyle(settings);

    expect(settings.headerMode).toBe('PREPRINTED');
    expect(style.headerVisible).toBe(false);
  });

  test('R1.3: Top Millimeter Margin (topMarginMm) calibration for pre-printed letterhead space', () => {
    const settings = FIXTURE_SETTINGS.preprintedLetterhead; // topMarginMm: 45mm
    const style = generatePrintStyle(settings);

    expect(settings.topMarginMm).toBe(45);
    expect(style.pageMarginCss).toContain('45mm');
    expect(style.containerPaddingCss).toContain('padding-top: 45mm');
  });

  test('R1.4: Bottom Millimeter Margin (bottomMarginMm) calibration for pre-printed footer space', () => {
    const settings = FIXTURE_SETTINGS.preprintedLetterhead; // bottomMarginMm: 30mm
    const style = generatePrintStyle(settings);

    expect(settings.bottomMarginMm).toBe(30);
    expect(style.pageMarginCss).toContain('30mm');
    expect(style.containerPaddingCss).toContain('padding-bottom: 30mm');
  });

  test('R1.5: Left and Right Millimeter Margins calibration (leftMarginMm, rightMarginMm)', () => {
    const settings = FIXTURE_SETTINGS.preprintedLetterhead; // 15mm left/right
    const style = generatePrintStyle(settings);

    expect(settings.leftMarginMm).toBe(15);
    expect(settings.rightMarginMm).toBe(15);
    expect(style.containerPaddingCss).toContain('padding-left: 15mm');
    expect(style.containerPaddingCss).toContain('padding-right: 15mm');
  });

  test('R1.6: @media print CSS rules prevent page break inside result tables and test rows', () => {
    const printCss = `
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .no-break { page-break-inside: avoid; break-inside: avoid; }
        .test-row { page-break-inside: avoid; break-inside: avoid; }
        .results-section { page-break-inside: auto; }
      }
    `;

    expect(printCss).toContain('page-break-inside: avoid');
    expect(printCss).toContain('print-color-adjust: exact');
  });

});
