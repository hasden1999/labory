/**
 * cbcDeviceConfig.ts
 * Manages device-specific CBC parameter profiles, custom reference ranges,
 * parameter name customization, sticky field visibility per analyzer,
 * and age/gender-specific demographic reference intervals with customization.
 */

import {
  CbcDemographicBracketId,
  CBC_DEMOGRAPHIC_BRACKETS,
  DEFAULT_CBC_DEMOGRAPHIC_MATRIX,
  resolveCbcDemographicBracket,
  getCbcParamDemographicRange,
  getPatientCbcDemographicRanges,
} from '@lab-manager/domain';

export type { CbcDemographicBracketId };
export {
  CBC_DEMOGRAPHIC_BRACKETS,
  DEFAULT_CBC_DEMOGRAPHIC_MATRIX,
  resolveCbcDemographicBracket,
  getCbcParamDemographicRange,
  getPatientCbcDemographicRanges,
};

export type CbcDeviceId = 
  | 'SWELAB_3PART' 
  | 'MINDRAY_3PART' 
  | 'MINDRAY_5PART' 
  | 'SYSMEX_3PART'
  | 'CUSTOM_CBC';

export type CbcSectionType = 'LEUKOCYTES' | 'ERYTHROID' | 'PLATELETS';

export interface CbcFieldMeta {
  key: string;
  name: string;             // Display name (e.g. 'WBC', 'RBC', 'HGB')
  label?: string;           // Convenient alias for name
  arabicName: string;       // Arabic name (e.g. 'كريات الدم البيض')
  labelAr?: string;         // Convenient alias for arabicName
  unit: string;             // Unit (e.g. '10^3/uL', 'g/dL', '%')
  refMin?: number;          // Default Normal Low
  refMax?: number;          // Default Normal High
  section: CbcSectionType;
  isResearch?: boolean;     // e.g. Research parameter with asterisk
  category?: '3PART' | '5PART' | 'COMMON';
}

export interface CbcDeviceProfile {
  id: CbcDeviceId;
  name?: string;            // Convenient alias for primary name
  nameAr: string;
  nameEn: string;
  badge: string;
  descriptionAr: string;
  diffType: '3PART' | '5PART';
  is3Part?: boolean;
  defaultActiveFieldKeys?: string[];
  fields: CbcFieldMeta[];
}

export const CBC_DEVICE_PROFILES: Record<CbcDeviceId, CbcDeviceProfile> = {
  SWELAB_3PART: {
    id: 'SWELAB_3PART',
    name: 'سوي لاب (Swelab 3-Part)',
    is3Part: true,
    nameAr: 'جهاز سوي لاب (Swelab / Boule 3-Part)',
    nameEn: 'Swelab Alfa / Lumi 3-Part',
    badge: 'سوي لاب 3-Part',
    descriptionAr: 'قالب مطابق 100% لقصاصة جهاز سوي لاب بتفريق ثلاثي ومنحنيات 450/250/30 fL',
    diffType: '3PART',
    fields: [
      // Leukocytes (3-Part)
      { key: 'wbc', name: 'WBC', arabicName: 'العدد الكلي للبيض', unit: '10^9/l', refMin: 4.0, refMax: 11.0, section: 'LEUKOCYTES', category: 'COMMON' },
      { key: 'graPct', name: 'GRA%', arabicName: 'المحببات (العدلات) %', unit: '%', refMin: 35.0, refMax: 80.0, section: 'LEUKOCYTES', category: '3PART' },
      { key: 'graAbs', name: 'GRA', arabicName: 'المحببات (مطلق)', unit: '10^9/l', refMin: 1.2, refMax: 8.0, section: 'LEUKOCYTES', category: '3PART' },
      { key: 'lymPct', name: 'LYM%', arabicName: 'اللمفاويات %', unit: '%', refMin: 15.0, refMax: 50.0, section: 'LEUKOCYTES', category: '3PART' },
      { key: 'lymAbs', name: 'LYM', arabicName: 'اللمفاويات (مطلق)', unit: '10^9/l', refMin: 0.9, refMax: 5.0, section: 'LEUKOCYTES', category: '3PART' },
      { key: 'midPct', name: 'MID%', arabicName: 'الخلايا المتوسطة %', unit: '%', refMin: 2.0, refMax: 15.0, section: 'LEUKOCYTES', category: '3PART' },
      { key: 'midAbs', name: 'MID', arabicName: 'الخلايا المتوسطة (مطلق)', unit: '10^9/l', refMin: 0.1, refMax: 1.5, section: 'LEUKOCYTES', category: '3PART' },

      // Erythroid
      { key: 'rbc', name: 'RBC', arabicName: 'عدد كريات الحمر', unit: '10^12/l', refMin: 4.0, refMax: 6.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'hgb', name: 'HGB', arabicName: 'الهيموغلوبين', unit: 'g/dl', refMin: 11.0, refMax: 17.5, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'hct', name: 'HCT', arabicName: 'حجم الخلايا المكدسة', unit: '%', refMin: 35.0, refMax: 50.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'mcv', name: 'MCV', arabicName: 'الحجم الكروي الوسطي', unit: 'fl', refMin: 76.0, refMax: 96.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'mch', name: 'MCH', arabicName: 'هيموغلوبين الكرية الوسطي', unit: 'pg', refMin: 27.0, refMax: 34.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'mchc', name: 'MCHC', arabicName: 'تركيز هيموغلوبين الكرية', unit: 'g/dl', refMin: 30.0, refMax: 37.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'rdw', name: 'RDW%', arabicName: 'تباين حجم الحمر %', unit: '%', refMin: 11.0, refMax: 16.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'rdwSd', name: 'RDWa', arabicName: 'تباين حجم الحمر (مطلق)', unit: 'fl', refMin: 35.0, refMax: 56.0, section: 'ERYTHROID', category: 'COMMON', isResearch: true },

      // Platelets
      { key: 'plt', name: 'PLT', arabicName: 'العدد الكلي للصفيحات', unit: '10^9/l', refMin: 140, refMax: 450, section: 'PLATELETS', category: 'COMMON' },
      { key: 'mpv', name: 'MPV', arabicName: 'الحجم الوسطي للصفيحات', unit: 'fl', refMin: 6.5, refMax: 11.0, section: 'PLATELETS', category: 'COMMON' },
      { key: 'pdw', name: 'PDW%', arabicName: 'تباين توزيع الصفيحات', unit: '%', refMin: 10.0, refMax: 18.0, section: 'PLATELETS', category: 'COMMON' },
      { key: 'pdwSd', name: 'PDWa', arabicName: 'تباين توزيع الصفيحات المطلق', unit: 'fl', refMin: 8.0, refMax: 17.0, section: 'PLATELETS', category: 'COMMON', isResearch: true },
      { key: 'pct', name: 'PCT', arabicName: 'كتلة الصفيحات', unit: '%', refMin: 0.15, refMax: 0.50, section: 'PLATELETS', category: 'COMMON' },
      { key: 'plcr', name: 'P-LCR', arabicName: 'نسبة الصفيحات الكبيرة', unit: '%', refMin: 10.0, refMax: 45.0, section: 'PLATELETS', category: 'COMMON', isResearch: true },
      { key: 'plcc', name: 'P-LCC', arabicName: 'عدد الصفيحات الكبيرة', unit: '10^9/l', refMin: 20, refMax: 100, section: 'PLATELETS', category: 'COMMON', isResearch: true },
    ]
  },

  MINDRAY_3PART: {
    id: 'MINDRAY_3PART',
    name: 'ميندراي (Mindray 3-Part)',
    is3Part: true,
    nameAr: 'جهاز ميندراي ثلاثي الفئات (Mindray BC-3000 / BC-20s)',
    nameEn: 'Mindray BC-Series 3-Part',
    badge: 'ميندراي 3-Part',
    descriptionAr: 'قالب أجهزة ميندراي ثلاثية الفئات مع عمود التنبيه Flag (H/L) والمنحنيات',
    diffType: '3PART',
    fields: [
      // Leukocytes
      { key: 'wbc', name: 'WBC', arabicName: 'العدد الكلي للبيض', unit: '10^9/L', refMin: 4.0, refMax: 10.0, section: 'LEUKOCYTES', category: 'COMMON' },
      { key: 'lymAbs', name: 'Lymph#', arabicName: 'اللمفاويات (مطلق)', unit: '10^9/L', refMin: 0.8, refMax: 4.0, section: 'LEUKOCYTES', category: '3PART' },
      { key: 'midAbs', name: 'Mid#', arabicName: 'الخلايا المتوسطة (مطلق)', unit: '10^9/L', refMin: 0.1, refMax: 1.5, section: 'LEUKOCYTES', category: '3PART' },
      { key: 'graAbs', name: 'Gran#', arabicName: 'المحببات (مطلق)', unit: '10^9/L', refMin: 2.0, refMax: 7.0, section: 'LEUKOCYTES', category: '3PART' },
      { key: 'lymPct', name: 'Lymph%', arabicName: 'اللمفاويات %', unit: '%', refMin: 20.0, refMax: 40.0, section: 'LEUKOCYTES', category: '3PART' },
      { key: 'midPct', name: 'Mid%', arabicName: 'الخلايا المتوسطة %', unit: '%', refMin: 3.0, refMax: 15.0, section: 'LEUKOCYTES', category: '3PART' },
      { key: 'graPct', name: 'Gran%', arabicName: 'المحببات %', unit: '%', refMin: 50.0, refMax: 70.0, section: 'LEUKOCYTES', category: '3PART' },

      // Erythroid
      { key: 'rbc', name: 'RBC', arabicName: 'عدد كريات الحمر', unit: '10^12/L', refMin: 3.50, refMax: 5.50, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'hgb', name: 'HGB', arabicName: 'الهيموغلوبين', unit: 'g/dL', refMin: 11.0, refMax: 16.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'hct', name: 'HCT', arabicName: 'حجم الخلايا المكدسة', unit: '%', refMin: 36.0, refMax: 50.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'mcv', name: 'MCV', arabicName: 'الحجم الكروي الوسطي', unit: 'fL', refMin: 80.0, refMax: 100.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'mch', name: 'MCH', arabicName: 'هيموغلوبين الكرية الوسطي', unit: 'pg', refMin: 27.0, refMax: 34.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'mchc', name: 'MCHC', arabicName: 'تركيز هيموغلوبين الكرية', unit: 'g/dL', refMin: 32.0, refMax: 36.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'rdw', name: 'RDW-CV', arabicName: 'تباين حجم الحمر CV', unit: '%', refMin: 11.0, refMax: 16.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'rdwSd', name: 'RDW-SD', arabicName: 'تباين حجم الحمر SD', unit: 'fL', refMin: 35.0, refMax: 56.0, section: 'ERYTHROID', category: 'COMMON' },

      // Platelets
      { key: 'plt', name: 'PLT', arabicName: 'العدد الكلي للصفيحات', unit: '10^9/L', refMin: 100, refMax: 300, section: 'PLATELETS', category: 'COMMON' },
      { key: 'mpv', name: 'MPV', arabicName: 'الحجم الوسطي للصفيحات', unit: 'fL', refMin: 6.5, refMax: 12.0, section: 'PLATELETS', category: 'COMMON' },
      { key: 'pdw', name: 'PDW', arabicName: 'تباين توزيع الصفيحات', unit: 'fL', refMin: 9.0, refMax: 17.0, section: 'PLATELETS', category: 'COMMON' },
      { key: 'pct', name: 'PCT', arabicName: 'كتلة الصفيحات', unit: '%', refMin: 0.108, refMax: 0.282, section: 'PLATELETS', category: 'COMMON' },
      { key: 'plcr', name: 'P-LCR', arabicName: 'نسبة الصفيحات الكبيرة', unit: '%', refMin: 11.0, refMax: 45.0, section: 'PLATELETS', category: 'COMMON' },
      { key: 'plcc', name: 'P-LCC', arabicName: 'عدد الصفيحات الكبيرة', unit: '10^9/L', refMin: 30, refMax: 90, section: 'PLATELETS', category: 'COMMON' },
    ]
  },

  MINDRAY_5PART: {
    id: 'MINDRAY_5PART',
    name: 'ميندراي (Mindray 5-Part)',
    is3Part: false,
    nameAr: 'جهاز ميندراي خماسي الفئات (Mindray BC-5000 / BC-5150)',
    nameEn: 'Mindray BC 5-Part & Laser Scattergram',
    badge: 'ميندراي 5-Part',
    descriptionAr: 'تفريق خماسي كامل مع مخطط التشتت الليزري DIFF Scattergram والمنحنيات',
    diffType: '5PART',
    fields: [
      // Leukocytes (5-Part)
      { key: 'wbc', name: 'WBC', arabicName: 'العدد الكلي للبيض', unit: '10^9/L', refMin: 4.0, refMax: 10.0, section: 'LEUKOCYTES', category: 'COMMON' },
      { key: 'neutrophilsAbs', name: 'Neu#', arabicName: 'العدلات (مطلق)', unit: '10^9/L', refMin: 2.0, refMax: 7.0, section: 'LEUKOCYTES', category: '5PART' },
      { key: 'lymphocytesAbs', name: 'Lym#', arabicName: 'اللمفاويات (مطلق)', unit: '10^9/L', refMin: 0.8, refMax: 4.0, section: 'LEUKOCYTES', category: '5PART' },
      { key: 'monocytesAbs', name: 'Mon#', arabicName: 'الوحيدات (مطلق)', unit: '10^9/L', refMin: 0.12, refMax: 1.2, section: 'LEUKOCYTES', category: '5PART' },
      { key: 'eosinophilsAbs', name: 'Eos#', arabicName: 'الحمضات (مطلق)', unit: '10^9/L', refMin: 0.02, refMax: 0.5, section: 'LEUKOCYTES', category: '5PART' },
      { key: 'basophilsAbs', name: 'Bas#', arabicName: 'القاعديات (مطلق)', unit: '10^9/L', refMin: 0.0, refMax: 0.1, section: 'LEUKOCYTES', category: '5PART' },
      { key: 'neutrophils', name: 'Neu%', arabicName: 'العدلات %', unit: '%', refMin: 40.0, refMax: 75.0, section: 'LEUKOCYTES', category: '5PART' },
      { key: 'lymphocytes', name: 'Lym%', arabicName: 'اللمفاويات %', unit: '%', refMin: 20.0, refMax: 45.0, section: 'LEUKOCYTES', category: '5PART' },
      { key: 'monocytes', name: 'Mon%', arabicName: 'الوحيدات %', unit: '%', refMin: 2.0, refMax: 10.0, section: 'LEUKOCYTES', category: '5PART' },
      { key: 'eosinophils', name: 'Eos%', arabicName: 'الحمضات %', unit: '%', refMin: 0.5, refMax: 6.0, section: 'LEUKOCYTES', category: '5PART' },
      { key: 'basophils', name: 'Bas%', arabicName: 'القاعديات %', unit: '%', refMin: 0.0, refMax: 1.0, section: 'LEUKOCYTES', category: '5PART' },

      // Erythroid
      { key: 'rbc', name: 'RBC', arabicName: 'عدد كريات الحمر', unit: '10^12/L', refMin: 3.50, refMax: 5.50, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'hgb', name: 'HGB', arabicName: 'الهيموغلوبين', unit: 'g/dL', refMin: 11.0, refMax: 16.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'hct', name: 'HCT', arabicName: 'حجم الخلايا المكدسة', unit: '%', refMin: 36.0, refMax: 50.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'mcv', name: 'MCV', arabicName: 'الحجم الكروي الوسطي', unit: 'fL', refMin: 80.0, refMax: 100.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'mch', name: 'MCH', arabicName: 'هيموغلوبين الكرية الوسطي', unit: 'pg', refMin: 27.0, refMax: 34.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'mchc', name: 'MCHC', arabicName: 'تركيز هيموغلوبين الكرية', unit: 'g/dL', refMin: 32.0, refMax: 36.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'rdw', name: 'RDW-CV', arabicName: 'تباين حجم الحمر CV', unit: '%', refMin: 11.0, refMax: 16.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'rdwSd', name: 'RDW-SD', arabicName: 'تباين حجم الحمر SD', unit: 'fL', refMin: 35.0, refMax: 56.0, section: 'ERYTHROID', category: 'COMMON' },

      // Platelets
      { key: 'plt', name: 'PLT', arabicName: 'العدد الكلي للصفيحات', unit: '10^9/L', refMin: 100, refMax: 300, section: 'PLATELETS', category: 'COMMON' },
      { key: 'mpv', name: 'MPV', arabicName: 'الحجم الوسطي للصفيحات', unit: 'fL', refMin: 6.5, refMax: 12.0, section: 'PLATELETS', category: 'COMMON' },
      { key: 'pdw', name: 'PDW', arabicName: 'تباين توزيع الصفيحات', unit: 'fL', refMin: 9.0, refMax: 17.0, section: 'PLATELETS', category: 'COMMON' },
      { key: 'pct', name: 'PCT', arabicName: 'كتلة الصفيحات', unit: '%', refMin: 0.108, refMax: 0.282, section: 'PLATELETS', category: 'COMMON' },
      { key: 'plcr', name: 'P-LCR', arabicName: 'نسبة الصفيحات الكبيرة', unit: '%', refMin: 11.0, refMax: 45.0, section: 'PLATELETS', category: 'COMMON' },
      { key: 'plcc', name: 'P-LCC', arabicName: 'عدد الصفيحات الكبيرة', unit: '10^9/L', refMin: 30, refMax: 90, section: 'PLATELETS', category: 'COMMON' },
    ]
  },

  SYSMEX_3PART: {
    id: 'SYSMEX_3PART',
    name: 'سيسمكس (Sysmex 3-Part)',
    is3Part: true,
    nameAr: 'جهاز سيسمكس (Sysmex XP-300 / KX-21N)',
    nameEn: 'Sysmex Automated Hematology',
    badge: 'سيسمكس 3-Part',
    descriptionAr: 'قالب أجهزة سيسمكس اليابانية مع تسلسل ومعاملات XP-300 الرسمية',
    diffType: '3PART',
    fields: [
      // Leukocytes
      { key: 'wbc', name: 'WBC', arabicName: 'العدد الكلي للبيض', unit: '10^3/uL', refMin: 4.0, refMax: 10.0, section: 'LEUKOCYTES', category: 'COMMON' },
      { key: 'lymPct', name: 'W-SCR (LYM%)', arabicName: 'الخلايا الصغيرة (اللمفاوية) %', unit: '%', refMin: 15.0, refMax: 45.0, section: 'LEUKOCYTES', category: '3PART' },
      { key: 'midPct', name: 'W-MCR (MXD%)', arabicName: 'الخلايا المتوسطة %', unit: '%', refMin: 2.0, refMax: 13.0, section: 'LEUKOCYTES', category: '3PART' },
      { key: 'graPct', name: 'W-LCR (NEUT%)', arabicName: 'الخلايا الكبيرة (العدلات) %', unit: '%', refMin: 40.0, refMax: 75.0, section: 'LEUKOCYTES', category: '3PART' },
      { key: 'lymAbs', name: 'W-SCC (LYM#)', arabicName: 'اللمفاويات (مطلق)', unit: '10^3/uL', refMin: 1.0, refMax: 3.5, section: 'LEUKOCYTES', category: '3PART' },
      { key: 'midAbs', name: 'W-MCC (MXD#)', arabicName: 'الخلايا المتوسطة (مطلق)', unit: '10^3/uL', refMin: 0.1, refMax: 1.0, section: 'LEUKOCYTES', category: '3PART' },
      { key: 'graAbs', name: 'W-LCC (NEUT#)', arabicName: 'العدلات (مطلق)', unit: '10^3/uL', refMin: 1.5, refMax: 7.0, section: 'LEUKOCYTES', category: '3PART' },

      // Erythroid
      { key: 'rbc', name: 'RBC', arabicName: 'عدد كريات الحمر', unit: '10^6/uL', refMin: 3.8, refMax: 5.8, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'hgb', name: 'HGB', arabicName: 'الهيموغلوبين', unit: 'g/dL', refMin: 11.5, refMax: 17.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'hct', name: 'HCT', arabicName: 'حجم الخلايا المكدسة', unit: '%', refMin: 35.0, refMax: 50.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'mcv', name: 'MCV', arabicName: 'الحجم الكروي الوسطي', unit: 'fL', refMin: 80.0, refMax: 98.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'mch', name: 'MCH', arabicName: 'هيموغلوبين الكرية الوسطي', unit: 'pg', refMin: 27.0, refMax: 33.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'mchc', name: 'MCHC', arabicName: 'تركيز هيموغلوبين الكرية', unit: 'g/dL', refMin: 32.0, refMax: 36.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'rdw', name: 'RDW-CV', arabicName: 'تباين حجم الحمر CV', unit: '%', refMin: 11.5, refMax: 14.5, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'rdwSd', name: 'RDW-SD', arabicName: 'تباين حجم الحمر SD', unit: 'fL', refMin: 37.0, refMax: 54.0, section: 'ERYTHROID', category: 'COMMON' },

      // Platelets
      { key: 'plt', name: 'PLT', arabicName: 'العدد الكلي للصفيحات', unit: '10^3/uL', refMin: 150, refMax: 450, section: 'PLATELETS', category: 'COMMON' },
      { key: 'mpv', name: 'MPV', arabicName: 'الحجم الوسطي للصفيحات', unit: 'fL', refMin: 7.0, refMax: 11.0, section: 'PLATELETS', category: 'COMMON' },
      { key: 'pdw', name: 'PDW', arabicName: 'تباين توزيع الصفيحات', unit: 'fL', refMin: 9.0, refMax: 17.0, section: 'PLATELETS', category: 'COMMON' },
      { key: 'pct', name: 'P-LCR', arabicName: 'نسبة الصفيحات الكبيرة', unit: '%', refMin: 13.0, refMax: 43.0, section: 'PLATELETS', category: 'COMMON' },
    ]
  },

  CUSTOM_CBC: {
    id: 'CUSTOM_CBC',
    name: 'يدوي مخصص (Custom CBC)',
    is3Part: false,
    nameAr: 'فورمة فحص دم يدوية مخصصة (Custom Manual Profile)',
    nameEn: 'Custom Hematology Profile',
    badge: 'يدوي مخصص',
    descriptionAr: 'فورمة مفتوحة قابلة لتخصيص كافة الحقول والمديات بما يناسب أي جهاز آخر',
    diffType: '5PART',
    fields: [
      { key: 'wbc', name: 'WBC', arabicName: 'العدد الكلي للبيض', unit: '10^3/uL', refMin: 4.0, refMax: 11.0, section: 'LEUKOCYTES', category: 'COMMON' },
      { key: 'neutrophils', name: 'NEUT%', arabicName: 'العدلات %', unit: '%', refMin: 40.0, refMax: 75.0, section: 'LEUKOCYTES', category: '5PART' },
      { key: 'lymphocytes', name: 'LYM%', arabicName: 'اللمفاويات %', unit: '%', refMin: 20.0, refMax: 45.0, section: 'LEUKOCYTES', category: '5PART' },
      { key: 'monocytes', name: 'MONO%', arabicName: 'الوحيدات %', unit: '%', refMin: 2.0, refMax: 10.0, section: 'LEUKOCYTES', category: '5PART' },
      { key: 'eosinophils', name: 'EOS%', arabicName: 'الحمضات %', unit: '%', refMin: 1.0, refMax: 6.0, section: 'LEUKOCYTES', category: '5PART' },
      { key: 'basophils', name: 'BASO%', arabicName: 'القاعديات %', unit: '%', refMin: 0.0, refMax: 2.0, section: 'LEUKOCYTES', category: '5PART' },
      { key: 'rbc', name: 'RBC', arabicName: 'عدد كريات الحمر', unit: '10^6/uL', refMin: 4.2, refMax: 5.8, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'hgb', name: 'HGB', arabicName: 'الهيموغلوبين', unit: 'g/dL', refMin: 12.0, refMax: 17.5, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'hct', name: 'HCT', arabicName: 'حجم الخلايا المكدسة', unit: '%', refMin: 36.0, refMax: 52.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'mcv', name: 'MCV', arabicName: 'الحجم الكروي الوسطي', unit: 'fL', refMin: 80.0, refMax: 100.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'mch', name: 'MCH', arabicName: 'هيموغلوبين الكرية الوسطي', unit: 'pg', refMin: 27.0, refMax: 34.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'mchc', name: 'MCHC', arabicName: 'تركيز هيموغلوبين الكرية', unit: 'g/dL', refMin: 32.0, refMax: 36.0, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'rdw', name: 'RDW-CV', arabicName: 'تباين حجم الحمر CV', unit: '%', refMin: 11.5, refMax: 14.5, section: 'ERYTHROID', category: 'COMMON' },
      { key: 'plt', name: 'PLT', arabicName: 'العدد الكلي للصفيحات', unit: '10^3/uL', refMin: 150, refMax: 450, section: 'PLATELETS', category: 'COMMON' },
      { key: 'mpv', name: 'MPV', arabicName: 'الحجم الوسطي للصفيحات', unit: 'fL', refMin: 7.4, refMax: 11.0, section: 'PLATELETS', category: 'COMMON' },
      { key: 'pct', name: 'PCT', arabicName: 'كتلة الصفيحات', unit: '%', refMin: 0.15, refMax: 0.35, section: 'PLATELETS', category: 'COMMON' },
      { key: 'pdw', name: 'PDW', arabicName: 'تباين توزيع الصفيحات', unit: '%', refMin: 9.0, refMax: 17.0, section: 'PLATELETS', category: 'COMMON' },
    ]
  }
};

const STORAGE_KEYS = {
  LAST_DEVICE: 'labryo_cbc_last_device',
  CUSTOM_RANGES_PREFIX: 'labryo_cbc_custom_profile_',
  ACTIVE_FIELDS_PREFIX: 'labryo_cbc_active_fields_',
  DEMOGRAPHIC_MATRIX: 'labryo_cbc_demographic_matrix',
};

/**
 * Retrieves user-customized demographic ranges matrix from LocalStorage.
 */
export function getSavedCbcDemographicMatrix(): Record<string, Record<string, { min?: number; max?: number }>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEMOGRAPHIC_MATRIX);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Persists customized demographic ranges matrix to LocalStorage and synchronizes with server settings.
 */
export function saveCbcDemographicMatrix(
  matrix: Record<string, Record<string, { min?: number; max?: number }>>
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.DEMOGRAPHIC_MATRIX, JSON.stringify(matrix));
    // Persist to central settings so printed reports and other workstations immediately use it
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cbcDemographicMatrix: matrix }),
    }).catch(() => {
      // Graceful offline fallback
    });
  } catch (err) {
    console.error('Failed to save CBC demographic matrix:', err);
  }
}

/**
 * Resets customized demographic ranges matrix (or a specific demographic bracket).
 */
export function resetCbcDemographicMatrix(bracketId?: CbcDemographicBracketId): void {
  if (typeof window === 'undefined') return;
  try {
    if (!bracketId) {
      localStorage.removeItem(STORAGE_KEYS.DEMOGRAPHIC_MATRIX);
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cbcDemographicMatrix: {} }),
      }).catch(() => {});
    } else {
      const current = getSavedCbcDemographicMatrix();
      delete current[bracketId];
      saveCbcDemographicMatrix(current);
    }
  } catch (err) {
    console.error('Failed to reset CBC demographic matrix:', err);
  }
}

/**
 * Returns device CBC fields with reference ranges dynamically resolved for a specific patient's demographic bracket.
 */
export function getPatientDeviceCbcFields(
  deviceId: CbcDeviceId,
  patient?: any,
  customMatrix?: Record<string, Record<string, { min?: number; max?: number }>>
): CbcFieldMeta[] {
  const baseFields = getDeviceCbcFields(deviceId);
  const matrix = customMatrix || getSavedCbcDemographicMatrix();
  const bracketId = resolveCbcDemographicBracket(patient);

  return baseFields.map((f) => {
    const range = getCbcParamDemographicRange(bracketId, f.key, matrix);
    if (range && (range.min !== undefined || range.max !== undefined)) {
      return {
        ...f,
        refMin: range.min !== undefined ? range.min : f.refMin,
        refMax: range.max !== undefined ? range.max : f.refMax,
      };
    }
    return f;
  });
}

/**
 * Loads the active device profile with user customizations applied from LocalStorage.
 */
export function getDeviceCbcFields(deviceId: CbcDeviceId): CbcFieldMeta[] {
  const baseProfile = CBC_DEVICE_PROFILES[deviceId] || CBC_DEVICE_PROFILES.SWELAB_3PART;
  const mappedBase = baseProfile.fields.map((f) => ({
    ...f,
    label: f.label || f.name,
    labelAr: f.labelAr || f.arabicName,
  }));
  if (typeof window === 'undefined') return mappedBase;

  try {
    const rawCustom = localStorage.getItem(`${STORAGE_KEYS.CUSTOM_RANGES_PREFIX}${deviceId}`);
    if (!rawCustom) return mappedBase;

    const customMap: Record<string, Partial<CbcFieldMeta>> = JSON.parse(rawCustom);
    return mappedBase.map((f) => {
      const override = customMap[f.key];
      if (!override) return f;
      const finalName = override.name || override.label || f.name;
      const finalAr = override.arabicName || override.labelAr || f.arabicName;
      return {
        ...f,
        name: finalName,
        label: finalName,
        arabicName: finalAr,
        labelAr: finalAr,
        unit: override.unit !== undefined ? override.unit : f.unit,
        refMin: typeof override.refMin === 'number' ? override.refMin : f.refMin,
        refMax: typeof override.refMax === 'number' ? override.refMax : f.refMax,
      };
    });
  } catch (err) {
    console.error('Failed to load custom CBC device fields from localStorage:', err);
    return mappedBase;
  }
}

/**
 * Saves customized parameter labels, units, and normal ranges for a device.
 */
export function saveDeviceCbcCustomizations(deviceId: CbcDeviceId, customMap: Record<string, Partial<CbcFieldMeta>>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEYS.CUSTOM_RANGES_PREFIX}${deviceId}`, JSON.stringify(customMap));
  } catch (err) {
    console.error('Failed to save custom CBC device fields to localStorage:', err);
  }
}

/**
 * Resets a device profile to its factory defaults.
 */
export function resetDeviceCbcCustomizations(deviceId: CbcDeviceId): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${STORAGE_KEYS.CUSTOM_RANGES_PREFIX}${deviceId}`);
  } catch (err) {
    console.error('Failed to reset custom CBC device fields in localStorage:', err);
  }
}

/**
 * Retrieves the persisted list of active/visible field keys for this device.
 * If user hasn't customized it yet, returns all field keys of this device.
 */
export function getActiveCbcFieldKeys(deviceId: CbcDeviceId): string[] {
  const allFields = getDeviceCbcFields(deviceId);
  const defaultKeys = allFields.map((f) => f.key);
  if (typeof window === 'undefined') return defaultKeys;

  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.ACTIVE_FIELDS_PREFIX}${deviceId}`);
    if (!raw) return defaultKeys;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Filter out any stale keys that no longer exist
      const validSet = new Set(defaultKeys);
      const filtered = parsed.filter((k: string) => validSet.has(k));
      return filtered.length > 0 ? filtered : defaultKeys;
    }
    return defaultKeys;
  } catch {
    return defaultKeys;
  }
}

/**
 * Persists the user's active/visible field keys for this device.
 * Sticky persistence ensures the next patient starts with the exact same chosen fields.
 */
export function saveActiveCbcFieldKeys(deviceId: CbcDeviceId, keys: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEYS.ACTIVE_FIELDS_PREFIX}${deviceId}`, JSON.stringify(keys));
  } catch (err) {
    console.error('Failed to save active CBC field keys to localStorage:', err);
  }
}

/**
 * Gets the last selected CBC device ID.
 */
export function getLastSelectedCbcDevice(): CbcDeviceId {
  if (typeof window === 'undefined') return 'SWELAB_3PART';
  try {
    const dev = localStorage.getItem(STORAGE_KEYS.LAST_DEVICE) as CbcDeviceId;
    if (dev && CBC_DEVICE_PROFILES[dev]) return dev;
    return 'SWELAB_3PART';
  } catch {
    return 'SWELAB_3PART';
  }
}

/**
 * Saves the last selected CBC device ID.
 */
export function saveLastSelectedCbcDevice(deviceId: CbcDeviceId): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_DEVICE, deviceId);
  } catch (err) {
    console.error('Failed to save last selected CBC device to localStorage:', err);
  }
}
