/**
 * Idempotent Clinical Templates Data Patch (v1.0.0)
 * 
 * Applies the 4 required clinical form customizations:
 * 1. Urine: Bilirubin -> ['Negative', 'Positive']
 * 2. Urine: Urobilinogen -> ['Normal', 'Increased']
 * 3. Urine: Pus & RBCs -> allowCustomInput: true, isNumericOnly: false (free typing)
 * 4. Stool: Remove 'dispar' -> 'Entamoeba histolytica'
 * 
 * Safe, idempotent, preserves all existing patient records intact.
 */

const fs = require('fs');
const path = require('path');

const PATCH_VERSION = '1.0.0';

const TARGET_DIRECTORIES = [
  path.resolve(__dirname, '..', 'apps', 'web', 'data'),
  process.env.APPDATA ? path.join(process.env.APPDATA, '@lab-manager', 'desktop', 'data') : null,
  process.env.LABRYO_DATA_DIR ? path.resolve(process.env.LABRYO_DATA_DIR) : null
].filter(Boolean);

const TEMPLATE_PAYLOAD = {
  version: PATCH_VERSION,
  updatedAt: new Date().toISOString(),
  urine: {
    bilirubin: {
      options: ['Negative', 'Positive'],
      abnormalValues: ['Positive'],
      refRange: 'Negative'
    },
    urobilinogen: {
      options: ['Normal', 'Increased'],
      abnormalValues: ['Increased'],
      refRange: 'Normal'
    },
    pusCells: {
      options: ['0-2', '2-4', '4-6', '8-10', '15-20', '25-35', '40-50', 'Full Slide'],
      abnormalValues: ['8-10', '15-20', '25-35', '40-50', 'Full Slide'],
      refRange: '0 - 5 /HPF',
      allowCustomInput: true,
      isNumericOnly: false,
      customInputPlaceholder: 'اكتب أي قيمة (مثال: 2-4 أو 10-15 أو many)...'
    },
    rbcs: {
      options: ['0-2', '2-4', '5-10', '15-25', 'Packed / Bloody'],
      abnormalValues: ['5-10', '15-25', 'Packed / Bloody'],
      refRange: '0 - 2 /HPF',
      allowCustomInput: true,
      isNumericOnly: false,
      customInputPlaceholder: 'اكتب أي قيمة (مثال: 0-2 أو 10-15 أو packed)...'
    }
  },
  stool: {
    parasiteSuggestions: [
      'Entamoeba histolytica',
      'Entamoeba coli',
      'Giardia lamblia',
      'Blastocystis hominis',
      'Cryptosporidium spp.',
      'Cyclospora cayetanensis',
      'Ascaris lumbricoides',
      'Enterobius vermicularis',
      'Trichuris trichiura',
      'Hookworm',
      'Strongyloides stercoralis',
      'Hymenolepis nana',
      'Taenia spp.',
      'Schistosoma mansoni'
    ],
    stageSuggestions: [
      'Cyst',
      'Trophozoite',
      'Ova (Egg)',
      'Larva',
      'Adult worm',
      'Proglottid (segment)',
      'Oocyst'
    ]
  }
};

function applyPatch() {
  console.log(`[DataPatch] Starting Clinical Templates Patch v${PATCH_VERSION}...`);
  let appliedCount = 0;

  for (const dir of TARGET_DIRECTORIES) {
    if (!fs.existsSync(dir)) {
      console.log(`[DataPatch] Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }

    const targetFile = path.join(dir, 'clinical_templates.json');
    let needsUpdate = true;

    if (fs.existsSync(targetFile)) {
      try {
        const existing = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));
        const hasBilirubin = JSON.stringify(existing?.urine?.bilirubin?.options) === JSON.stringify(['Negative', 'Positive']);
        const hasUrob = JSON.stringify(existing?.urine?.urobilinogen?.options) === JSON.stringify(['Normal', 'Increased']);
        const hasNoDispar = !existing?.stool?.parasiteSuggestions?.some(s => s.includes('dispar'));
        const hasFreeInput = existing?.urine?.pusCells?.allowCustomInput === true && existing?.urine?.pusCells?.isNumericOnly === false;

        if (hasBilirubin && hasUrob && hasNoDispar && hasFreeInput && existing?.version === PATCH_VERSION) {
          console.log(`[DataPatch] Idempotency check: ${targetFile} is already up to date (v${existing.version}). Skipping.`);
          needsUpdate = false;
        }
      } catch (e) {
        console.warn(`[DataPatch] Existing file unparseable, will rewrite: ${targetFile}`);
      }
    }

    if (needsUpdate) {
      fs.writeFileSync(targetFile, JSON.stringify(TEMPLATE_PAYLOAD, null, 2), 'utf-8');
      console.log(`[DataPatch] Successfully wrote updated template config: ${targetFile}`);
      appliedCount++;
    }
  }

  console.log(`[DataPatch] Completed successfully. Target directories checked: ${TARGET_DIRECTORIES.length}, Applied: ${appliedCount}`);
}

applyPatch();
