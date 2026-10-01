/**
 * Design Tokens: Arabic RTL Rules
 * Enforces right-to-left layout and bidirectional text safety.
 */

export const rtlRules = {
  direction: 'rtl' as const,
  textAlign: 'right' as const,
  arabicLocale: 'ar-IQ' as const,
  wrapperTag: {
    dir: 'rtl',
    style: {
      textAlign: 'right',
      direction: 'rtl'
    }
  }
} as const;

/**
 * Ensures clean bidirectional text isolation for medical formulas or English abbreviations.
 */
export function isolateEnglishTerm(term: string): string {
  return `\u202A${term}\u202C`;
}
