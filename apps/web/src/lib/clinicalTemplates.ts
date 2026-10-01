import fs from 'fs';
import path from 'path';
import {
  PillFieldConfig,
  UrineTemplatesConfig,
  StoolTemplatesConfig,
  ClinicalTemplates,
  DEFAULT_CLINICAL_TEMPLATES,
} from './clinicalTemplatesConfig';

export type {
  PillFieldConfig,
  UrineTemplatesConfig,
  StoolTemplatesConfig,
  ClinicalTemplates,
};
export { DEFAULT_CLINICAL_TEMPLATES };

function getCandidatePaths(): string[] {
  const paths: string[] = [];
  if (process.env.LABRYO_DATA_DIR) {
    paths.push(path.join(path.resolve(process.env.LABRYO_DATA_DIR), 'clinical_templates.json'));
  }
  // Windows AppData fallback
  if (process.env.APPDATA) {
    paths.push(path.join(process.env.APPDATA, '@lab-manager', 'desktop', 'data', 'clinical_templates.json'));
  }
  // Project / web data paths
  paths.push(path.resolve(process.cwd().includes('apps') ? process.cwd() : path.join(process.cwd(), 'apps', 'web'), 'data', 'clinical_templates.json'));
  paths.push(path.resolve(process.cwd(), 'data', 'clinical_templates.json'));
  return paths;
}

export function getClinicalTemplates(): ClinicalTemplates {
  try {
    const candidatePaths = getCandidatePaths();
    for (const filePath of candidatePaths) {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_CLINICAL_TEMPLATES,
          ...parsed,
          urine: {
            ...DEFAULT_CLINICAL_TEMPLATES.urine,
            ...(parsed.urine || {}),
          },
          stool: {
            ...DEFAULT_CLINICAL_TEMPLATES.stool,
            ...(parsed.stool || {}),
          },
        };
      }
    }
  } catch (err) {
    console.warn('[ClinicalTemplates] Error reading template config, falling back to defaults:', err);
  }
  return DEFAULT_CLINICAL_TEMPLATES;
}

export function saveClinicalTemplates(newConfig: Partial<ClinicalTemplates>): boolean {
  try {
    const targetDir = process.env.LABRYO_DATA_DIR
      ? path.resolve(process.env.LABRYO_DATA_DIR)
      : (process.env.APPDATA
          ? path.join(process.env.APPDATA, '@lab-manager', 'desktop', 'data')
          : path.resolve(process.cwd().includes('apps') ? process.cwd() : path.join(process.cwd(), 'apps', 'web'), 'data'));

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const current = getClinicalTemplates();
    const merged: ClinicalTemplates = {
      ...current,
      ...newConfig,
      updatedAt: new Date().toISOString(),
      urine: {
        ...current.urine,
        ...(newConfig.urine || {}),
      },
      stool: {
        ...current.stool,
        ...(newConfig.stool || {}),
      },
    };

    const targetFile = path.join(targetDir, 'clinical_templates.json');
    fs.writeFileSync(targetFile, JSON.stringify(merged, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[ClinicalTemplates] Error saving template config:', err);
    return false;
  }
}
