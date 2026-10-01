/**
 * @lab-manager/reports
 * Print & PDF report templates and engine
 */

export const MODULE_NAME = 'reports';

// Types & Templates
export * from './templates/types';
export * from './templates/ClassicTemplate';

// Engine & Detection
export * from './engine/browserDetector';
export * from './engine/pdfEngine';

// Builder & High-level API
export * from './builder/ReportDataBuilder';
