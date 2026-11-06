/**
 * Design Tokens: Colors
 * Central palette definitions for the Medical Lab Manager system.
 */

export const colors = {
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },
  status: {
    success: {
      light: '#ecfdf5',
      border: '#a7f3d0',
      text: '#047857',
      base: '#10b981',
    },
    warning: {
      light: '#fffbeb',
      border: '#fde68a',
      text: '#b45309',
      base: '#f59e0b',
    },
    danger: {
      light: '#fef2f2',
      border: '#fecaca',
      text: '#b91c1c',
      base: '#ef4444',
    },
    info: {
      light: '#f0f9ff',
      border: '#bae6fd',
      text: '#0369a1',
      base: '#0284c7',
    },
  },
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
} as const;

export type ColorTokens = typeof colors;
