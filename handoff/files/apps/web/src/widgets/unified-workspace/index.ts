/**
 * Public API for Unified Workspace Widget (FSD Architecture)
 * Layer: widgets/unified-workspace
 */

export * from './model/types';
export * from './lib/tubeBadges';
export * from './model/useUnifiedWorkspace';
export { default as UnifiedWorkspace } from './ui/UnifiedWorkspace';
export { default as PatientCardPanel } from './ui/PatientCardPanel';
export { default as CatalogCartPanel } from './ui/CatalogCartPanel';
export { default as ResultsGridPanel } from './ui/ResultsGridPanel';
export { default as UnifiedActionBar } from './ui/UnifiedActionBar';
