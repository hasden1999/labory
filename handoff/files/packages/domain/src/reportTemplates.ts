/**
 * Header and Template mapping dictionary for printable medical reports.
 * Shared between domain reporting, web print rendering, and SQLite synchronization.
 */

export const HEADER_STYLE_TO_TEMPLATE_MAP: Record<string, string> = {
  'default': 'CLASSIC',
  'regal_box': 'BAGHDAD_ROYAL_DUAL',
  'dual_wing': 'INDIAN_DUAL_WING',
  'gradient_banner': 'MODERN',
  'minimal_pure': 'MINIMAL_PURE_LINE',
  'compact_strip': 'COMPACT_MICRO_STRIP',
  'gold_frame': 'REGAL_GOLD_FRAME',
  'smart_digital': 'SMART_DIGITAL',
  'accredited_badge': 'MULTI_ACCREDITED',
  'bauhaus_grid': 'BAUHAUS_GRID',
  'aurora_wave': 'AZURE_WAVE',
  'executive_dark': 'EXECUTIVE_LUXURY',
  'vertical_accent': 'VERTICAL_SPINE',
  'glass_capsule': 'GLASS_CAPSULE',
};

export const TEMPLATE_TO_HEADER_STYLE_MAP: Record<string, string> = {
  'CLASSIC': 'default',
  'ROYAL_CLASSIC': 'default',
  'BAGHDAD_ROYAL_DUAL': 'regal_box',
  'INDIAN_DUAL_WING': 'dual_wing',
  'DR_LAL_CLINICAL': 'dual_wing',
  'MODERN': 'gradient_banner',
  'CLINICAL_FRAME': 'gradient_banner',
  'CLINICAL_TEAL': 'gradient_banner',
  'MINIMAL_PURE_LINE': 'minimal_pure',
  'COMPACT_MICRO_STRIP': 'compact_strip',
  'REGAL_GOLD_FRAME': 'gold_frame',
  'SMART_DIGITAL': 'smart_digital',
  'MULTI_ACCREDITED': 'accredited_badge',
  'BAUHAUS_GRID': 'bauhaus_grid',
  'AZURE_WAVE': 'aurora_wave',
  'EXECUTIVE_LUXURY': 'executive_dark',
  'EXECUTIVE': 'executive_dark',
  'VERTICAL_SPINE': 'vertical_accent',
  'GLASS_CAPSULE': 'glass_capsule',
};
