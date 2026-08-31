export interface TestItem {
  id: string;
  code: string;
  name: string;
  arabicName: string;
  category: string;
  price: number;
  costEstimate?: number;
  refRangeLow?: number | null;
  refRangeHigh?: number | null;
  normalMaleLow?: number | null;
  normalMaleHigh?: number | null;
  normalFemaleLow?: number | null;
  normalFemaleHigh?: number | null;
  criticalLow?: number | null;
  criticalHigh?: number | null;
  refRangeText?: string;
  unit?: string;
  sampleType?: string;
}

export interface PanelItem {
  id: string;
  name: string;
  description: string;
  price: number;
  testCodes: string[];
  items?: { test: TestItem }[];
}

export const INITIAL_TESTS_CATALOG: TestItem[] = [
  // 1. Hematology
  { id: 't-cbc', code: 'CBC', name: 'Complete Blood Count (CBC)', arabicName: 'طµظˆط±ط© ط§ظ„ط¯ظ… ط§ظ„ظƒط§ظ…ظ„ط©', category: 'ط£ظ…ط±ط§ط¶ ط§ظ„ط¯ظ… ظˆط§ظ„طھط®ط«ط±', price: 15000, costEstimate: 2500, refRangeLow: 12.0, refRangeHigh: 16.0, normalMaleLow: 13.5, normalMaleHigh: 17.5, normalFemaleLow: 12.0, normalFemaleHigh: 15.5, criticalLow: 7.0, criticalHigh: 20.0, refRangeText: '12.0 - 16.0', unit: 'g/dL', sampleType: 'ط¯ظ… ظƒط§ظ…ظ„ (EDTA)' },
  { id: 't-hb', code: 'HB', name: 'Hemoglobin (Hb)', arabicName: 'ط®ط¶ط§ط¨ ط§ظ„ط¯ظ… (ط§ظ„ظ‡ظٹظ…ظˆط؛ظ„ظˆط¨ظٹظ†)', category: 'ط£ظ…ط±ط§ط¶ ط§ظ„ط¯ظ… ظˆط§ظ„طھط®ط«ط±', price: 5000, costEstimate: 800, refRangeLow: 12.0, refRangeHigh: 16.5, normalMaleLow: 13.5, normalMaleHigh: 17.5, normalFemaleLow: 12.0, normalFemaleHigh: 15.5, criticalLow: 7.0, criticalHigh: 20.0, refRangeText: '12.0 - 16.5', unit: 'g/dL', sampleType: 'ط¯ظ… ظƒط§ظ…ظ„ (EDTA)' },
  { id: 't-esr', code: 'ESR', name: 'Erythrocyte Sedimentation Rate (ESR)', arabicName: 'ط³ط±ط¹ط© طھط±ط³ط¨ ظƒط±ظٹط§طھ ط§ظ„ط¯ظ… ط§ظ„ط­ظ…ط±', category: 'ط£ظ…ط±ط§ط¶ ط§ظ„ط¯ظ… ظˆط§ظ„طھط®ط«ط±', price: 5000, costEstimate: 600, refRangeLow: 0, refRangeHigh: 20, normalMaleLow: 0, normalMaleHigh: 15, normalFemaleLow: 0, normalFemaleHigh: 20, criticalHigh: 100, refRangeText: '0 - 20', unit: 'mm/1st hr', sampleType: 'ط¯ظ… ظƒط§ظ…ظ„ (Citrate)' },
  { id: 't-bg', code: 'BG', name: 'Blood Group & Rh Factor', arabicName: 'ظپطµظٹظ„ط© ط§ظ„ط¯ظ… ظˆط§ظ„ط¹ط§ظ…ظ„ ط§ظ„ط±ظٹط³ظٹ', category: 'ط£ظ…ط±ط§ط¶ ط§ظ„ط¯ظ… ظˆط§ظ„طھط®ط«ط±', price: 5000, costEstimate: 800, refRangeText: 'A / B / AB / O (Pos/Neg)', unit: '', sampleType: 'ط¯ظ… ظƒط§ظ…ظ„ (EDTA)' },
  { id: 't-plt', code: 'PLT', name: 'Platelets Count', arabicName: 'طھط¹ط¯ط§ط¯ ط§ظ„طµظپط§ط¦ط­ ط§ظ„ط¯ظ…ظˆظٹط©', category: 'ط£ظ…ط±ط§ط¶ ط§ظ„ط¯ظ… ظˆط§ظ„طھط®ط«ط±', price: 6000, costEstimate: 1000, refRangeLow: 150000, refRangeHigh: 450000, criticalLow: 30000, criticalHigh: 1000000, refRangeText: '150,000 - 450,000', unit: '/uL', sampleType: 'ط¯ظ… ظƒط§ظ…ظ„ (EDTA)' },
  { id: 't-pt', code: 'PT-INR', name: 'Prothrombin Time (PT / INR)', arabicName: 'ط²ظ…ظ† ط§ظ„ط¨ط±ظˆط«ط±ظˆظ…ط¨ظٹظ† ظˆظ…ط¹ط¯ظ„ ط§ظ„طھط®ط«ط± ط§ظ„ط¯ظˆظ„ظٹ', category: 'ط£ظ…ط±ط§ط¶ ط§ظ„ط¯ظ… ظˆط§ظ„طھط®ط«ط±', price: 15000, costEstimate: 3000, refRangeLow: 0.9, refRangeHigh: 1.2, criticalHigh: 4.5, refRangeText: '0.9 - 1.2', unit: 'Ratio', sampleType: 'ط¨ظ„ط§ط²ظ…ط§ (Sodium Citrate)' },
  { id: 't-ptt', code: 'PTT', name: 'Partial Thromboplastin Time (PTT/APTT)', arabicName: 'ط²ظ…ظ† ط§ظ„طھط±ظˆظ…ط¨ظˆط¨ظ„ط§ط³طھظٹظ† ط§ظ„ط¬ط²ط¦ظٹ', category: 'ط£ظ…ط±ط§ط¶ ط§ظ„ط¯ظ… ظˆط§ظ„طھط®ط«ط±', price: 15000, costEstimate: 3000, refRangeLow: 25, refRangeHigh: 38, criticalHigh: 80, refRangeText: '25 - 38', unit: 'sec', sampleType: 'ط¨ظ„ط§ط²ظ…ط§ (Sodium Citrate)' },
  { id: 't-ddimer', code: 'DDIMER', name: 'D-Dimer (Quantitative)', arabicName: 'ظپط­طµ ط¯ظٹ ط¯ط§ظٹظ…ط± ظ„ظ„طھط®ط«ط± ظˆط§ظ„ط¬ظ„ط·ط§طھ', category: 'ط£ظ…ط±ط§ط¶ ط§ظ„ط¯ظ… ظˆط§ظ„طھط®ط«ط±', price: 25000, costEstimate: 6000, refRangeLow: 0, refRangeHigh: 0.5, criticalHigh: 5.0, refRangeText: '< 0.5', unit: 'ug/mL', sampleType: 'ط¨ظ„ط§ط²ظ…ط§' },
  { id: 't-fer', code: 'FER', name: 'Serum Ferritin', arabicName: 'ظ…ط®ط²ظˆظ† ط§ظ„ط­ط¯ظٹط¯ (ط§ظ„ظپظٹط±ظٹطھظٹظ†)', category: 'ط£ظ…ط±ط§ط¶ ط§ظ„ط¯ظ… ظˆط§ظ„طھط®ط«ط±', price: 18000, costEstimate: 3500, refRangeLow: 15, refRangeHigh: 200, normalMaleLow: 30, normalMaleHigh: 400, normalFemaleLow: 15, normalFemaleHigh: 150, criticalLow: 5, refRangeText: '15 - 200', unit: 'ng/mL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-iron', code: 'IRON', name: 'Serum Iron', arabicName: 'ط§ظ„ط­ط¯ظٹط¯ ظپظٹ ظ…طµظ„ ط§ظ„ط¯ظ…', category: 'ط£ظ…ط±ط§ط¶ ط§ظ„ط¯ظ… ظˆط§ظ„طھط®ط«ط±', price: 10000, costEstimate: 1800, refRangeLow: 50, refRangeHigh: 170, normalMaleLow: 65, normalMaleHigh: 175, normalFemaleLow: 50, normalFemaleHigh: 170, refRangeText: '50 - 170', unit: 'ug/dL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-tibc', code: 'TIBC', name: 'Total Iron Binding Capacity (TIBC)', arabicName: 'ط§ظ„ط³ط¹ط© ط§ظ„ظƒظ„ظٹط© ط§ظ„ط±ط§ط¨ط·ط© ظ„ظ„ط­ط¯ظٹط¯', category: 'ط£ظ…ط±ط§ط¶ ط§ظ„ط¯ظ… ظˆط§ظ„طھط®ط«ط±', price: 12000, costEstimate: 2000, refRangeLow: 250, refRangeHigh: 450, refRangeText: '250 - 450', unit: 'ug/dL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },

  // 2. Clinical Chemistry & Diabetes
  { id: 't-fbs', code: 'FBS', name: 'Fasting Blood Sugar (FBS)', arabicName: 'ط³ظƒط± ط§ظ„ط¯ظ… ط§ظ„طµط§ط¦ظ…', category: 'ط§ظ„ظƒظٹظ…ظٹط§ط، ط§ظ„ط³ط±ظٹط±ظٹط© ظˆط§ظ„ط³ظƒط±ظٹ', price: 5000, costEstimate: 800, refRangeLow: 70, refRangeHigh: 100, criticalLow: 45, criticalHigh: 400, refRangeText: '70 - 100 (Normal)', unit: 'mg/dL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-rbs', code: 'RBS', name: 'Random Blood Sugar (RBS)', arabicName: 'ط³ظƒط± ط§ظ„ط¯ظ… ط§ظ„ط¹ط´ظˆط§ط¦ظٹ', category: 'ط§ظ„ظƒظٹظ…ظٹط§ط، ط§ظ„ط³ط±ظٹط±ظٹط© ظˆط§ظ„ط³ظƒط±ظٹ', price: 5000, costEstimate: 800, refRangeLow: 70, refRangeHigh: 140, criticalLow: 45, criticalHigh: 450, refRangeText: '70 - 140', unit: 'mg/dL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-hba1c', code: 'HBA1C', name: 'Glycated Hemoglobin (HbA1c)', arabicName: 'ط§ظ„ط³ظƒط± ط§ظ„طھط±ط§ظƒظ…ظٹ', category: 'ط§ظ„ظƒظٹظ…ظٹط§ط، ط§ظ„ط³ط±ظٹط±ظٹط© ظˆط§ظ„ط³ظƒط±ظٹ', price: 15000, costEstimate: 3500, refRangeLow: 4.0, refRangeHigh: 5.6, criticalHigh: 12.0, refRangeText: '4.0 - 5.6 % (Non-diabetic)', unit: '%', sampleType: 'ط¯ظ… ظƒط§ظ…ظ„ (EDTA)' },
  { id: 't-ogtt', code: 'OGTT', name: 'Oral Glucose Tolerance Test (2hr)', arabicName: 'ط§ط®طھط¨ط§ط± طھط­ظ…ظ„ ط§ظ„ط³ظƒط± ط§ظ„ظپظ…ظˆظٹ', category: 'ط§ظ„ظƒظٹظ…ظٹط§ط، ط§ظ„ط³ط±ظٹط±ظٹط© ظˆط§ظ„ط³ظƒط±ظٹ', price: 15000, costEstimate: 2500, refRangeLow: 70, refRangeHigh: 140, refRangeText: '< 140', unit: 'mg/dL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-insulin', code: 'INSULIN', name: 'Fasting Insulin', arabicName: 'ظ‡ط±ظ…ظˆظ† ط§ظ„ط£ظ†ط³ظˆظ„ظٹظ† ط§ظ„طµط§ط¦ظ…', category: 'ط§ظ„ظƒظٹظ…ظٹط§ط، ط§ظ„ط³ط±ظٹط±ظٹط© ظˆط§ظ„ط³ظƒط±ظٹ', price: 25000, costEstimate: 5000, refRangeLow: 2.6, refRangeHigh: 24.9, refRangeText: '2.6 - 24.9', unit: 'uIU/mL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-cpep', code: 'CPEPTIDE', name: 'C-Peptide Fasting', arabicName: 'ظپط­طµ ط³ظٹ ط¨ط¨طھظٹط¯ ظ„ظƒظپط§ط،ط© ط§ظ„ط¨ظ†ظƒط±ظٹط§ط³', category: 'ط§ظ„ظƒظٹظ…ظٹط§ط، ط§ظ„ط³ط±ظٹط±ظٹط© ظˆط§ظ„ط³ظƒط±ظٹ', price: 25000, costEstimate: 5000, refRangeLow: 0.8, refRangeHigh: 3.8, refRangeText: '0.8 - 3.8', unit: 'ng/mL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },

  // 3. Renal & Electrolytes
  { id: 't-creat', code: 'CREAT', name: 'Serum Creatinine', arabicName: 'ط§ظ„ظƒط±ظٹط§طھظٹظ†ظٹظ† ظپظٹ ظ…طµظ„ ط§ظ„ط¯ظ…', category: 'ظˆط¸ط§ط¦ظپ ط§ظ„ظƒظ„ظ‰ ظˆط§ظ„ط£ظ…ظ„ط§ط­', price: 7000, costEstimate: 1200, refRangeLow: 0.6, refRangeHigh: 1.2, normalMaleLow: 0.7, normalMaleHigh: 1.3, normalFemaleLow: 0.5, normalFemaleHigh: 1.1, criticalHigh: 5.0, refRangeText: '0.6 - 1.2', unit: 'mg/dL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-urea', code: 'UREA', name: 'Blood Urea', arabicName: 'ط§ظ„ظٹظˆط±ظٹط§ ظپظٹ ط§ظ„ط¯ظ…', category: 'ظˆط¸ط§ط¦ظپ ط§ظ„ظƒظ„ظ‰ ظˆط§ظ„ط£ظ…ظ„ط§ط­', price: 7000, costEstimate: 1200, refRangeLow: 15, refRangeHigh: 45, criticalHigh: 120, refRangeText: '15 - 45', unit: 'mg/dL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-bun', code: 'BUN', name: 'Blood Urea Nitrogen (BUN)', arabicName: 'ظ†طھط±ظˆط¬ظٹظ† ظٹظˆط±ظٹط§ ط§ظ„ط¯ظ…', category: 'ظˆط¸ط§ط¦ظپ ط§ظ„ظƒظ„ظ‰ ظˆط§ظ„ط£ظ…ظ„ط§ط­', price: 7000, costEstimate: 1200, refRangeLow: 7, refRangeHigh: 20, refRangeText: '7 - 20', unit: 'mg/dL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-uric', code: 'URIC', name: 'Serum Uric Acid', arabicName: 'ط­ظ…ط¶ ط§ظ„ظٹظˆط±ظٹظƒ (ط¯ط§ط، ط§ظ„ظ†ظ‚ط±ط³)', category: 'ظˆط¸ط§ط¦ظپ ط§ظ„ظƒظ„ظ‰ ظˆط§ظ„ط£ظ…ظ„ط§ط­', price: 7000, costEstimate: 1200, refRangeLow: 3.5, refRangeHigh: 7.2, normalMaleLow: 3.5, normalMaleHigh: 7.2, normalFemaleLow: 2.6, normalFemaleHigh: 6.0, refRangeText: '3.5 - 7.2', unit: 'mg/dL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-na', code: 'NA', name: 'Serum Sodium (Na+)', arabicName: 'ط§ظ„طµظˆط¯ظٹظˆظ… ظپظٹ ط§ظ„ط¯ظ…', category: 'ظˆط¸ط§ط¦ظپ ط§ظ„ظƒظ„ظ‰ ظˆط§ظ„ط£ظ…ظ„ط§ط­', price: 8000, costEstimate: 1500, refRangeLow: 135, refRangeHigh: 145, criticalLow: 120, criticalHigh: 160, refRangeText: '135 - 145', unit: 'mmol/L', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-k', code: 'K', name: 'Serum Potassium (K+)', arabicName: 'ط§ظ„ط¨ظˆطھط§ط³ظٹظˆظ… ظپظٹ ط§ظ„ط¯ظ…', category: 'ظˆط¸ط§ط¦ظپ ط§ظ„ظƒظ„ظ‰ ظˆط§ظ„ط£ظ…ظ„ط§ط­', price: 8000, costEstimate: 1500, refRangeLow: 3.5, refRangeHigh: 5.1, criticalLow: 2.8, criticalHigh: 6.2, refRangeText: '3.5 - 5.1', unit: 'mmol/L', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-cl', code: 'CL', name: 'Serum Chloride (Cl-)', arabicName: 'ط§ظ„ظƒظ„ظˆط±ظٹط¯ ظپظٹ ط§ظ„ط¯ظ…', category: 'ظˆط¸ط§ط¦ظپ ط§ظ„ظƒظ„ظ‰ ظˆط§ظ„ط£ظ…ظ„ط§ط­', price: 8000, costEstimate: 1500, refRangeLow: 98, refRangeHigh: 107, refRangeText: '98 - 107', unit: 'mmol/L', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-malb', code: 'MALB', name: 'Microalbumin in Urine', arabicName: 'ط§ظ„ط²ظ„ط§ظ„ ط§ظ„ط¯ظ‚ظٹظ‚ ظپظٹ ط§ظ„ط¥ط¯ط±ط§ط±', category: 'ظˆط¸ط§ط¦ظپ ط§ظ„ظƒظ„ظ‰ ظˆط§ظ„ط£ظ…ظ„ط§ط­', price: 15000, costEstimate: 3000, refRangeLow: 0, refRangeHigh: 30, refRangeText: '< 30', unit: 'mg/L', sampleType: 'ط¥ط¯ط±ط§ط± ط¹ط´ظˆط§ط¦ظٹ' },

  // 4. Liver Function
  { id: 't-got', code: 'GOT', name: 'SGOT / AST (Aspartate Aminotransferase)', arabicName: 'ط¥ظ†ط²ظٹظ… ط§ظ„ظƒط¨ط¯ ظˆط§ظ„ظ‚ظ„ط¨ (AST/GOT)', category: 'ظˆط¸ط§ط¦ظپ ط§ظ„ظƒط¨ط¯ ظˆط§ظ„ظ…ط±ط§ط±ط©', price: 7000, costEstimate: 1200, refRangeLow: 5, refRangeHigh: 40, normalMaleLow: 5, normalMaleHigh: 40, normalFemaleLow: 5, normalFemaleHigh: 32, criticalHigh: 250, refRangeText: '5 - 40', unit: 'U/L', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-gpt', code: 'GPT', name: 'SGPT / ALT (Alanine Aminotransferase)', arabicName: 'ط¥ظ†ط²ظٹظ… ط§ظ„ظƒط¨ط¯ ط§ظ„ظ…طھط®طµطµ (ALT/GPT)', category: 'ظˆط¸ط§ط¦ظپ ط§ظ„ظƒط¨ط¯ ظˆط§ظ„ظ…ط±ط§ط±ط©', price: 7000, costEstimate: 1200, refRangeLow: 5, refRangeHigh: 45, normalMaleLow: 5, normalMaleHigh: 45, normalFemaleLow: 5, normalFemaleHigh: 34, criticalHigh: 250, refRangeText: '5 - 45', unit: 'U/L', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-alp', code: 'ALP', name: 'Alkaline Phosphatase (ALP)', arabicName: 'ط¥ظ†ط²ظٹظ… ط§ظ„ظپظˆط³ظپط§طھط§ط² ط§ظ„ظ‚ظ„ظˆظٹ', category: 'ظˆط¸ط§ط¦ظپ ط§ظ„ظƒط¨ط¯ ظˆط§ظ„ظ…ط±ط§ط±ط©', price: 8000, costEstimate: 1400, refRangeLow: 40, refRangeHigh: 130, refRangeText: '40 - 130', unit: 'U/L', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-tsb', code: 'TSB', name: 'Total Bilirubin (TSB)', arabicName: 'ط§ظ„ط¨ظٹظ„ظٹط±ظˆط¨ظٹظ† ط§ظ„ظƒظ„ظٹ (ط§ظ„ظٹط±ظ‚ط§ظ† / ط£ط¨ظˆ طµظپط§ط±)', category: 'ظˆط¸ط§ط¦ظپ ط§ظ„ظƒط¨ط¯ ظˆط§ظ„ظ…ط±ط§ط±ط©', price: 7000, costEstimate: 1200, refRangeLow: 0.2, refRangeHigh: 1.2, criticalHigh: 15.0, refRangeText: '0.2 - 1.2', unit: 'mg/dL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-dirbil', code: 'DIR-BIL', name: 'Direct Bilirubin', arabicName: 'ط§ظ„ط¨ظٹظ„ظٹط±ظˆط¨ظٹظ† ط§ظ„ظ…ط¨ط§ط´ط± (ط§ظ„ظ…ظ‚طھط±ظ†)', category: 'ظˆط¸ط§ط¦ظپ ط§ظ„ظƒط¨ط¯ ظˆط§ظ„ظ…ط±ط§ط±ط©', price: 7000, costEstimate: 1200, refRangeLow: 0.0, refRangeHigh: 0.3, refRangeText: '0.0 - 0.3', unit: 'mg/dL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-tp', code: 'TP', name: 'Total Serum Protein', arabicName: 'ط§ظ„ط¨ط±ظˆطھظٹظ† ط§ظ„ظƒظ„ظٹ ظپظٹ ظ…طµظ„ ط§ظ„ط¯ظ…', category: 'ظˆط¸ط§ط¦ظپ ط§ظ„ظƒط¨ط¯ ظˆط§ظ„ظ…ط±ط§ط±ط©', price: 7000, costEstimate: 1200, refRangeLow: 6.4, refRangeHigh: 8.3, refRangeText: '6.4 - 8.3', unit: 'g/dL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-alb', code: 'ALB', name: 'Serum Albumin', arabicName: 'ط§ظ„ط£ظ„ط¨ظˆظ…ظٹظ† ظپظٹ ظ…طµظ„ ط§ظ„ط¯ظ…', category: 'ظˆط¸ط§ط¦ظپ ط§ظ„ظƒط¨ط¯ ظˆط§ظ„ظ…ط±ط§ط±ط©', price: 7000, costEstimate: 1200, refRangeLow: 3.5, refRangeHigh: 5.0, refRangeText: '3.5 - 5.0', unit: 'g/dL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },

  // 5. Lipid & Cardiac
  { id: 't-chol', code: 'CHOL', name: 'Total Cholesterol', arabicName: 'ط§ظ„ظƒظˆظ„ظٹط³طھط±ظˆظ„ ط§ظ„ظƒظ„ظٹ', category: 'ط¯ظ‡ظˆظ† ط§ظ„ط¯ظ… ظˆطµط­ط© ط§ظ„ظ‚ظ„ط¨', price: 7000, costEstimate: 1200, refRangeLow: 120, refRangeHigh: 200, criticalHigh: 300, refRangeText: '< 200 (Desirable)', unit: 'mg/dL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-tg', code: 'TG', name: 'Triglycerides (TG)', arabicName: 'ط§ظ„ط¯ظ‡ظˆظ† ط§ظ„ط«ظ„ط§ط«ظٹط©', category: 'ط¯ظ‡ظˆظ† ط§ظ„ط¯ظ… ظˆطµط­ط© ط§ظ„ظ‚ظ„ط¨', price: 7000, costEstimate: 1200, refRangeLow: 50, refRangeHigh: 150, criticalHigh: 500, refRangeText: '< 150 (Normal)', unit: 'mg/dL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-hdl', code: 'HDL', name: 'HDL Cholesterol (Good)', arabicName: 'ط§ظ„ظƒظˆظ„ظٹط³طھط±ظˆظ„ ط¹ط§ظ„ظٹ ط§ظ„ظƒط«ط§ظپط© (ط§ظ„ظ†ط§ظپط¹)', category: 'ط¯ظ‡ظˆظ† ط§ظ„ط¯ظ… ظˆطµط­ط© ط§ظ„ظ‚ظ„ط¨', price: 8000, costEstimate: 1500, refRangeLow: 40, refRangeHigh: 65, normalMaleLow: 40, normalMaleHigh: 60, normalFemaleLow: 50, normalFemaleHigh: 65, refRangeText: '> 40 (Male) / > 50 (Female)', unit: 'mg/dL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-ldl', code: 'LDL', name: 'LDL Cholesterol (Bad)', arabicName: 'ط§ظ„ظƒظˆظ„ظٹط³طھط±ظˆظ„ ظ…ظ†ط®ظپط¶ ط§ظ„ظƒط«ط§ظپط© (ط§ظ„ط¶ط§ط±)', category: 'ط¯ظ‡ظˆظ† ط§ظ„ط¯ظ… ظˆطµط­ط© ط§ظ„ظ‚ظ„ط¨', price: 8000, costEstimate: 1500, refRangeLow: 0, refRangeHigh: 100, criticalHigh: 190, refRangeText: '< 100 (Optimal)', unit: 'mg/dL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-vldl', code: 'VLDL', name: 'VLDL Cholesterol', arabicName: 'ط§ظ„ظƒظˆظ„ظٹط³طھط±ظˆظ„ ط´ط¯ظٹط¯ ط§ظ†ط®ظپط§ط¶ ط§ظ„ظƒط«ط§ظپط©', category: 'ط¯ظ‡ظˆظ† ط§ظ„ط¯ظ… ظˆطµط­ط© ط§ظ„ظ‚ظ„ط¨', price: 5000, costEstimate: 0, refRangeLow: 5, refRangeHigh: 30, refRangeText: '5 - 30', unit: 'mg/dL', sampleType: 'ظ…ط­ط³ظˆط¨' },
  { id: 't-trop', code: 'TROP-I', name: 'Troponin I (High Sensitive)', arabicName: 'ط¥ظ†ط²ظٹظ… طھط±ظˆط¨ظˆظ†ظٹظ† ط§ظ„ظ‚ظ„ط¨ظٹ ط§ظ„ط³ط±ظٹط¹ ظ„ظ„ط¬ظ„ط·ط©', category: 'ط¯ظ‡ظˆظ† ط§ظ„ط¯ظ… ظˆطµط­ط© ط§ظ„ظ‚ظ„ط¨', price: 30000, costEstimate: 8000, refRangeLow: 0, refRangeHigh: 0.04, criticalHigh: 0.1, refRangeText: '< 0.04 (Negative)', unit: 'ng/mL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },

  // 6. Thyroid & Hormones
  { id: 't-tsh', code: 'TSH', name: 'Thyroid Stimulating Hormone (TSH)', arabicName: 'ظ‡ط±ظ…ظˆظ† ط§ظ„ط؛ط¯ط© ط§ظ„ط¯ط±ظ‚ظٹط© ط§ظ„ظ…ط­ظپط² (TSH)', category: 'ط§ظ„ط؛ط¯ط© ط§ظ„ط¯ط±ظ‚ظٹط© ظˆط§ظ„ظ‡ط±ظ…ظˆظ†ط§طھ', price: 20000, costEstimate: 4000, refRangeLow: 0.4, refRangeHigh: 4.2, criticalLow: 0.05, criticalHigh: 15.0, refRangeText: '0.4 - 4.2', unit: 'uIU/mL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-ft4', code: 'FT4', name: 'Free Thyroxine (Free T4)', arabicName: 'ظ‡ط±ظ…ظˆظ† ط§ظ„ط«ط§ظٹط±ظˆظƒط³ظٹظ† ط§ظ„ط­ط± (FT4)', category: 'ط§ظ„ط؛ط¯ط© ط§ظ„ط¯ط±ظ‚ظٹط© ظˆط§ظ„ظ‡ط±ظ…ظˆظ†ط§طھ', price: 20000, costEstimate: 4000, refRangeLow: 0.8, refRangeHigh: 1.8, refRangeText: '0.8 - 1.8', unit: 'ng/dL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-ft3', code: 'FT3', name: 'Free Triiodothyronine (Free T3)', arabicName: 'ظ‡ط±ظ…ظˆظ† ط«ظ„ط§ط«ظٹ ط§ظ„ظٹظˆط¯ ط§ظ„ط«ط§ظٹط±ظˆظ†ظٹظ† ط§ظ„ط­ط± (FT3)', category: 'ط§ظ„ط؛ط¯ط© ط§ظ„ط¯ط±ظ‚ظٹط© ظˆط§ظ„ظ‡ط±ظ…ظˆظ†ط§طھ', price: 20000, costEstimate: 4000, refRangeLow: 2.0, refRangeHigh: 4.4, refRangeText: '2.0 - 4.4', unit: 'pg/mL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-prl', code: 'PRL', name: 'Prolactin (Milk Hormone)', arabicName: 'ظ‡ط±ظ…ظˆظ† ط§ظ„ط­ظ„ظٹط¨ (ط§ظ„ط¨ط±ظˆظ„ط§ظƒطھظٹظ†)', category: 'ط§ظ„ط؛ط¯ط© ط§ظ„ط¯ط±ظ‚ظٹط© ظˆط§ظ„ظ‡ط±ظ…ظˆظ†ط§طھ', price: 20000, costEstimate: 4000, refRangeLow: 3.0, refRangeHigh: 25.0, normalMaleLow: 3.0, normalMaleHigh: 15.0, normalFemaleLow: 4.0, normalFemaleHigh: 25.0, criticalHigh: 100, refRangeText: '4.0 - 25.0 (Female)', unit: 'ng/mL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-fsh', code: 'FSH', name: 'Follicle Stimulating Hormone (FSH)', arabicName: 'ط§ظ„ظ‡ط±ظ…ظˆظ† ط§ظ„ظ…ظ†ط¨ظ‡ ظ„ظ„ط¬ط±ظٹط¨ (FSH)', category: 'ط§ظ„ط؛ط¯ط© ط§ظ„ط¯ط±ظ‚ظٹط© ظˆط§ظ„ظ‡ط±ظ…ظˆظ†ط§طھ', price: 20000, costEstimate: 4000, refRangeLow: 1.5, refRangeHigh: 12.4, refRangeText: '1.5 - 12.4', unit: 'mIU/mL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-lh', code: 'LH', name: 'Luteinizing Hormone (LH)', arabicName: 'ط§ظ„ظ‡ط±ظ…ظˆظ† ط§ظ„ظ…ظ„ظˆطھظ† (LH)', category: 'ط§ظ„ط؛ط¯ط© ط§ظ„ط¯ط±ظ‚ظٹط© ظˆط§ظ„ظ‡ط±ظ…ظˆظ†ط§طھ', price: 20000, costEstimate: 4000, refRangeLow: 1.7, refRangeHigh: 12.6, refRangeText: '1.7 - 12.6', unit: 'mIU/mL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-testo', code: 'TESTO', name: 'Total Testosterone', arabicName: 'ظ‡ط±ظ…ظˆظ† ط§ظ„ط°ظƒظˆط±ط© ط§ظ„ظƒظ„ظٹ (ط§ظ„طھط³طھظˆط³طھظٹط±ظˆظ†)', category: 'ط§ظ„ط؛ط¯ط© ط§ظ„ط¯ط±ظ‚ظٹط© ظˆط§ظ„ظ‡ط±ظ…ظˆظ†ط§طھ', price: 25000, costEstimate: 5000, refRangeLow: 2.8, refRangeHigh: 8.0, normalMaleLow: 2.8, normalMaleHigh: 8.0, normalFemaleLow: 0.1, normalFemaleHigh: 0.8, refRangeText: '2.8 - 8.0 (Male)', unit: 'ng/mL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-bhcg', code: 'BHCG', name: 'Beta-hCG (Quantitative Pregnancy)', arabicName: 'ظ‡ط±ظ…ظˆظ† ط§ظ„ط­ظ…ظ„ ط§ظ„ط±ظ‚ظ…ظٹ ط§ظ„طھط±ط§ظƒظ…ظٹ', category: 'ط§ظ„ط؛ط¯ط© ط§ظ„ط¯ط±ظ‚ظٹط© ظˆط§ظ„ظ‡ط±ظ…ظˆظ†ط§طھ', price: 20000, costEstimate: 4000, refRangeLow: 0, refRangeHigh: 5, refRangeText: '< 5 (Non-pregnant)', unit: 'mIU/mL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-amh', code: 'AMH', name: 'Anti-Mullerian Hormone (AMH)', arabicName: 'ظ‡ط±ظ…ظˆظ† ظ…ط®ط²ظˆظ† ط§ظ„ظ…ط¨ظٹط¶ (AMH)', category: 'ط§ظ„ط؛ط¯ط© ط§ظ„ط¯ط±ظ‚ظٹط© ظˆط§ظ„ظ‡ط±ظ…ظˆظ†ط§طھ', price: 45000, costEstimate: 12000, refRangeLow: 1.0, refRangeHigh: 3.5, refRangeText: '1.0 - 3.5', unit: 'ng/mL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },

  // 7. Vitamins & Minerals
  { id: 't-vitd', code: 'VITD', name: 'Vitamin D3 (25-OH Total)', arabicName: 'ظپظٹطھط§ظ…ظٹظ† ط¯3 ط§ظ„ظƒظ„ظٹ (ظپط­طµ ط§ظ„ظ…ظ†ط§ط¹ط© ظˆط§ظ„ط¹ط¸ط§ظ…)', category: 'ط§ظ„ظ…ط¹ط§ط¯ظ† ظˆط§ظ„ظپظٹطھط§ظ…ظٹظ†ط§طھ', price: 25000, costEstimate: 5500, refRangeLow: 30, refRangeHigh: 100, criticalLow: 10, refRangeText: '30 - 100 (Sufficiency)', unit: 'ng/mL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-vitb12', code: 'VITB12', name: 'Vitamin B12 (Cobalamin)', arabicName: 'ظپظٹطھط§ظ…ظٹظ† ط¨12 (ظپظٹطھط§ظ…ظٹظ† ط§ظ„ط£ط¹طµط§ط¨)', category: 'ط§ظ„ظ…ط¹ط§ط¯ظ† ظˆط§ظ„ظپظٹطھط§ظ…ظٹظ†ط§طھ', price: 25000, costEstimate: 5000, refRangeLow: 200, refRangeHigh: 900, criticalLow: 100, refRangeText: '200 - 900', unit: 'pg/mL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-calc', code: 'CALC', name: 'Total Serum Calcium', arabicName: 'ط§ظ„ظƒط§ظ„ط³ظٹظˆظ… ط§ظ„ظƒظ„ظٹ ظپظٹ ط§ظ„ط¯ظ…', category: 'ط§ظ„ظ…ط¹ط§ط¯ظ† ظˆط§ظ„ظپظٹطھط§ظ…ظٹظ†ط§طھ', price: 8000, costEstimate: 1400, refRangeLow: 8.5, refRangeHigh: 10.5, criticalLow: 6.5, criticalHigh: 13.0, refRangeText: '8.5 - 10.5', unit: 'mg/dL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-phos', code: 'PHOS', name: 'Serum Phosphorus / Phosphate', arabicName: 'ط§ظ„ظپظˆط³ظپظˆط± ط؛ظٹط± ط§ظ„ط¹ط¶ظˆظٹ ظپظٹ ط§ظ„ط¯ظ…', category: 'ط§ظ„ظ…ط¹ط§ط¯ظ† ظˆط§ظ„ظپظٹطھط§ظ…ظٹظ†ط§طھ', price: 8000, costEstimate: 1400, refRangeLow: 2.5, refRangeHigh: 4.5, refRangeText: '2.5 - 4.5', unit: 'mg/dL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-mg', code: 'MG', name: 'Serum Magnesium', arabicName: 'ط§ظ„ظ…ط؛ظ†ظٹط³ظٹظˆظ… ظپظٹ ط§ظ„ط¯ظ…', category: 'ط§ظ„ظ…ط¹ط§ط¯ظ† ظˆط§ظ„ظپظٹطھط§ظ…ظٹظ†ط§طھ', price: 8000, costEstimate: 1400, refRangeLow: 1.7, refRangeHigh: 2.4, refRangeText: '1.7 - 2.4', unit: 'mg/dL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-zinc', code: 'ZINC', name: 'Serum Zinc', arabicName: 'ط§ظ„ط²ظ†ظƒ ظپظٹ ط§ظ„ط¯ظ…', category: 'ط§ظ„ظ…ط¹ط§ط¯ظ† ظˆط§ظ„ظپظٹطھط§ظ…ظٹظ†ط§طھ', price: 20000, costEstimate: 4000, refRangeLow: 70, refRangeHigh: 120, refRangeText: '70 - 120', unit: 'ug/dL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },

  // 8. Immunology & Serology
  { id: 't-crp', code: 'CRP', name: 'C-Reactive Protein (CRP Quantitative)', arabicName: 'ط¨ط±ظˆطھظٹظ† ط³ظٹ ط§ظ„طھظپط§ط¹ظ„ظٹ ط§ظ„ظƒظ…ظٹ (ط§ظ„ط§ظ„طھظ‡ط§ط¨)', category: 'ط§ظ„ظ…ظ†ط§ط¹ط© ظˆط§ظ„ط£ظ…طµط§ظ„', price: 12000, costEstimate: 2200, refRangeLow: 0, refRangeHigh: 6.0, criticalHigh: 50.0, refRangeText: '< 6.0 (Normal)', unit: 'mg/L', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-rf', code: 'RF', name: 'Rheumatoid Factor (RF)', arabicName: 'ط¹ط§ظ…ظ„ ط§ظ„ط±ظˆظ…ط§طھظˆظٹط¯ (ط§ظ„ط±ظˆظ…ط§طھظٹط²ظ…)', category: 'ط§ظ„ظ…ظ†ط§ط¹ط© ظˆط§ظ„ط£ظ…طµط§ظ„', price: 10000, costEstimate: 1800, refRangeLow: 0, refRangeHigh: 20, refRangeText: '< 20 (Negative)', unit: 'IU/mL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-aso', code: 'ASO', name: 'Anti-Streptolysin O (ASOT)', arabicName: 'ظپط­طµ ط¨ظƒطھظٹط±ظٹط§ ط§ظ„ط¨ظ„ط¹ظˆظ… ظˆط§ظ„ظ„ظˆط²طھظٹظ† (ASOT)', category: 'ط§ظ„ظ…ظ†ط§ط¹ط© ظˆط§ظ„ط£ظ…طµط§ظ„', price: 10000, costEstimate: 1800, refRangeLow: 0, refRangeHigh: 200, refRangeText: '< 200 (Negative)', unit: 'IU/mL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-rose', code: 'ROSE', name: 'Rose Bengal (Brucella Screen)', arabicName: 'ظپط­طµ ط­ظ…ظ‰ ظ…ط§ظ„ط·ط§ (ط§ظ„ط¨ط±ظˆط³ظٹظ„ط§)', category: 'ط§ظ„ظ…ظ†ط§ط¹ط© ظˆط§ظ„ط£ظ…طµط§ظ„', price: 8000, costEstimate: 1200, refRangeText: 'Negative', unit: '', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-widal', code: 'WIDAL', name: 'Widal Test (Typhoid Fever)', arabicName: 'ظپط­طµ ط­ظ…ظ‰ ط§ظ„طھظٹظپظˆط¦ظٹط¯ (ط§ظ„ظپظٹط¯ط§ظ„)', category: 'ط§ظ„ظ…ظ†ط§ط¹ط© ظˆط§ظ„ط£ظ…طµط§ظ„', price: 8000, costEstimate: 1200, refRangeText: 'Negative (< 1:80)', unit: 'Titer', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-hp', code: 'HP-AG', name: 'H. Pylori Antigen in Stool', arabicName: 'ط¬ط±ط«ظˆظ…ط© ط§ظ„ظ…ط¹ط¯ط© (ط£ظ†طھظٹط¬ظٹظ† ط§ظ„ط®ط±ظˆط¬)', category: 'ط§ظ„ظ…ظ†ط§ط¹ط© ظˆط§ظ„ط£ظ…طµط§ظ„', price: 15000, costEstimate: 3000, refRangeText: 'Negative', unit: '', sampleType: 'ط¹ظٹظ†ط© ط®ط±ظˆط¬' },
  { id: 't-hbsag', code: 'HBSAG', name: 'Hepatitis B Surface Antigen (HBsAg)', arabicName: 'ط§ظ„طھظ‡ط§ط¨ ط§ظ„ظƒط¨ط¯ ط§ظ„ظپظٹط±ظˆط³ظٹ ظ†ظˆط¹ B', category: 'ط§ظ„ظ…ظ†ط§ط¹ط© ظˆط§ظ„ط£ظ…طµط§ظ„', price: 15000, costEstimate: 2800, refRangeText: 'Negative (Non-reactive)', unit: '', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-hcv', code: 'HCV', name: 'Hepatitis C Virus Antibody (HCV Ab)', arabicName: 'ط§ظ„طھظ‡ط§ط¨ ط§ظ„ظƒط¨ط¯ ط§ظ„ظپظٹط±ظˆط³ظٹ ظ†ظˆط¹ C', category: 'ط§ظ„ظ…ظ†ط§ط¹ط© ظˆط§ظ„ط£ظ…طµط§ظ„', price: 15000, costEstimate: 2800, refRangeText: 'Negative (Non-reactive)', unit: '', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-hiv', code: 'HIV', name: 'HIV 1 & 2 Ab/Ag Combo', arabicName: 'ظپط­طµ ط§ظ„ط¥ظٹط¯ط² ظˆظپظٹط±ظˆط³ ظ†ظ‚طµ ط§ظ„ظ…ظ†ط§ط¹ط©', category: 'ط§ظ„ظ…ظ†ط§ط¹ط© ظˆط§ظ„ط£ظ…طµط§ظ„', price: 20000, costEstimate: 4000, refRangeText: 'Negative (Non-reactive)', unit: '', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },

  // 9. Urine & Stool
  { id: 't-gue', code: 'GUE', name: 'General Urine Examination (GUE)', arabicName: 'ظپط­طµ ط§ظ„ط¥ط¯ط±ط§ط± ط§ظ„ط¹ط§ظ… ط§ظ„ط´ط§ظ…ظ„', category: 'ط§ظ„ظپط­طµ ط§ظ„ظ…ط¬ظ‡ط±ظٹ ط§ظ„ط¹ط§ظ…', price: 5000, costEstimate: 800, refRangeText: 'Normal (Pus: 0-4 / RBCs: 0-2 / Prot: Nil)', unit: '', sampleType: 'ط¥ط¯ط±ط§ط± طµط¨ط§ط­ظٹ' },
  { id: 't-gse', code: 'GSE', name: 'General Stool Examination (GSE)', arabicName: 'ظپط­طµ ط§ظ„ط®ط±ظˆط¬ ط§ظ„ط¹ط§ظ… ط§ظ„ط´ط§ظ…ظ„', category: 'ط§ظ„ظپط­طµ ط§ظ„ظ…ط¬ظ‡ط±ظٹ ط§ظ„ط¹ط§ظ…', price: 5000, costEstimate: 800, refRangeText: 'Normal (No Parasites / FOBT: Negative)', unit: '', sampleType: 'ط¹ظٹظ†ط© ط®ط±ظˆط¬' },
  { id: 't-fobt', code: 'FOBT', name: 'Fecal Occult Blood Test (FOBT)', arabicName: 'ظپط­طµ ط§ظ„ط¯ظ… ط§ظ„ط®ظپظٹ ظپظٹ ط§ظ„ط®ط±ظˆط¬', category: 'ط§ظ„ظپط­طµ ط§ظ„ظ…ط¬ظ‡ط±ظٹ ط§ظ„ط¹ط§ظ…', price: 10000, costEstimate: 2000, refRangeText: 'Negative', unit: '', sampleType: 'ط¹ظٹظ†ط© ط®ط±ظˆط¬' },

  // 10. Tumor Markers
  { id: 't-psa', code: 'PSA-TOT', name: 'Total PSA (Prostate Specific Antigen)', arabicName: 'ط¯ظ„ط§ظ„ط§طھ ط§ظ„ط¨ط±ظˆط³طھط§طھ ط§ظ„ظƒظ„ظٹط© (PSA)', category: 'ط¯ظ„ط§ظ„ط§طھ ط§ظ„ط£ظˆط±ط§ظ…', price: 25000, costEstimate: 5000, refRangeLow: 0, refRangeHigh: 4.0, criticalHigh: 10.0, refRangeText: '< 4.0', unit: 'ng/mL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-cea', code: 'CEA', name: 'Carcinoembryonic Antigen (CEA)', arabicName: 'ط¯ظ„ط§ظ„ط§طھ ط£ظˆط±ط§ظ… ط§ظ„ظ‚ظˆظ„ظˆظ† ظˆط§ظ„ط¬ظ‡ط§ط² ط§ظ„ظ‡ط¶ظ…ظٹ (CEA)', category: 'ط¯ظ„ط§ظ„ط§طھ ط§ظ„ط£ظˆط±ط§ظ…', price: 25000, costEstimate: 5000, refRangeLow: 0, refRangeHigh: 5.0, refRangeText: '< 5.0', unit: 'ng/mL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-ca125', code: 'CA125', name: 'Cancer Antigen 125 (CA-125)', arabicName: 'ط¯ظ„ط§ظ„ط§طھ ط£ظˆط±ط§ظ… ط§ظ„ظ…ط¨ظٹط¶ ظˆط§ظ„ط±ط­ظ… (CA-125)', category: 'ط¯ظ„ط§ظ„ط§طھ ط§ظ„ط£ظˆط±ط§ظ…', price: 30000, costEstimate: 6500, refRangeLow: 0, refRangeHigh: 35.0, refRangeText: '< 35.0', unit: 'U/mL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-ca199', code: 'CA19-9', name: 'Cancer Antigen 19-9 (CA 19-9)', arabicName: 'ط¯ظ„ط§ظ„ط§طھ ط£ظˆط±ط§ظ… ط§ظ„ط¨ظ†ظƒط±ظٹط§ط³ ظˆط§ظ„ظ…ط±ط§ط±ط© (CA 19-9)', category: 'ط¯ظ„ط§ظ„ط§طھ ط§ظ„ط£ظˆط±ط§ظ…', price: 30000, costEstimate: 6500, refRangeLow: 0, refRangeHigh: 37.0, refRangeText: '< 37.0', unit: 'U/mL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-ca153', code: 'CA15-3', name: 'Cancer Antigen 15-3 (CA 15-3)', arabicName: 'ط¯ظ„ط§ظ„ط§طھ ط£ظˆط±ط§ظ… ط§ظ„ط«ط¯ظٹ (CA 15-3)', category: 'ط¯ظ„ط§ظ„ط§طھ ط§ظ„ط£ظˆط±ط§ظ…', price: 30000, costEstimate: 6500, refRangeLow: 0, refRangeHigh: 30.0, refRangeText: '< 30.0', unit: 'U/mL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
  { id: 't-afp', code: 'AFP', name: 'Alpha-Fetoprotein (AFP)', arabicName: 'ط¯ظ„ط§ظ„ط§طھ ط£ظˆط±ط§ظ… ط§ظ„ظƒط¨ط¯ ظˆط§ظ„ط¬ظ†ظٹظ† (AFP)', category: 'ط¯ظ„ط§ظ„ط§طھ ط§ظ„ط£ظˆط±ط§ظ…', price: 25000, costEstimate: 5000, refRangeLow: 0, refRangeHigh: 7.0, refRangeText: '< 7.0', unit: 'ng/mL', sampleType: 'ظ…طµظ„ ط§ظ„ط¯ظ… (Serum)' },
];

export const INITIAL_PANELS: PanelItem[] = [
  {
    id: 'p-1',
    name: 'ط§ظ„ظپط­طµ ط§ظ„ط´ط§ظ…ظ„ ظ„ظ„ط§ط·ظ…ط¦ظ†ط§ظ† ظˆط§ظ„طµط­ط© ط§ظ„ط¹ط§ظ…ط© (Comprehensive Health Check)',
    description: 'ظٹط´ظ…ظ„ طµظˆط±ط© ط§ظ„ط¯ظ…طŒ ط§ظ„ط³ظƒط± ط§ظ„طھط±ط§ظƒظ…ظٹطŒ ظˆط¸ط§ط¦ظپ ط§ظ„ظƒظ„ظ‰طŒ ظˆط¸ط§ط¦ظپ ط§ظ„ظƒط¨ط¯طŒ ط¯ظ‡ظˆظ† ط§ظ„ط¯ظ…طŒ ظپظٹطھط§ظ…ظٹظ† ط¯طŒ ظˆظپط­طµ ط§ظ„ط¥ط¯ط±ط§ط± ط§ظ„ط¹ط§ظ…',
    price: 85000,
    testCodes: ['CBC', 'HBA1C', 'CREAT', 'UREA', 'URIC', 'GOT', 'GPT', 'CHOL', 'TG', 'HDL', 'LDL', 'VITD', 'GUE'],
  },
  {
    id: 'p-2',
    name: 'ط¨ط§ظ‚ط© ظ…طھط§ط¨ط¹ط© ظ…ط±ط¶ظ‰ ط§ظ„ط³ظƒط±ظٹ ط§ظ„ظ…طھظƒط§ظ…ظ„ط© (Diabetic Care Panel)',
    description: 'ظٹط´ظ…ظ„ ط§ظ„ط³ظƒط± ط§ظ„طµط§ط¦ظ…طŒ ط§ظ„ط³ظƒط± ط§ظ„طھط±ط§ظƒظ…ظٹطŒ ظˆط¸ط§ط¦ظپ ط§ظ„ظƒظ„ظ‰طŒ ط§ظ„ط²ظ„ط§ظ„ ط§ظ„ط¨ظˆظ„ظٹطŒ ظˆط§ظ„ط¯ظ‡ظˆظ† ط§ظ„ط«ظ„ط§ط«ظٹط©',
    price: 45000,
    testCodes: ['FBS', 'HBA1C', 'CREAT', 'UREA', 'MALB', 'CHOL', 'TG', 'GUE'],
  },
  {
    id: 'p-3',
    name: 'ط¨ط§ظ‚ط© ظˆط¸ط§ط¦ظپ ط§ظ„ظƒظ„ظ‰ ظˆط§ظ„ط£ظ…ظ„ط§ط­ ط§ظ„ط´ط§ظ…ظ„ط© (KFT & Electrolytes Panel)',
    description: 'ط§ظ„ظƒط±ظٹط§طھظٹظ†ظٹظ†طŒ ط§ظ„ظٹظˆط±ظٹط§طŒ ط­ظ…ط¶ ط§ظ„ظٹظˆط±ظٹظƒطŒ ط§ظ„طµظˆط¯ظٹظˆظ…طŒ ط§ظ„ط¨ظˆطھط§ط³ظٹظˆظ…طŒ ظˆظپط­طµ ط§ظ„ط¥ط¯ط±ط§ط± ط§ظ„ط¹ط§ظ…',
    price: 30000,
    testCodes: ['CREAT', 'UREA', 'BUN', 'URIC', 'NA', 'K', 'GUE'],
  },
  {
    id: 'p-4',
    name: 'ط¨ط§ظ‚ط© ظˆط¸ط§ط¦ظپ ط§ظ„ظƒط¨ط¯ ظˆط§ظ„ظ…ط±ط§ط±ط© ط§ظ„ظƒط§ظ…ظ„ط© (Complete LFT Panel)',
    description: 'ط¥ظ†ط²ظٹظ…ط§طھ ط§ظ„ظƒط¨ط¯ AST ظˆ ALTطŒ ط§ظ„ظپظˆط³ظپط§طھط§ط² ط§ظ„ظ‚ظ„ظˆظٹطŒ ط§ظ„ط¨ظٹظ„ظٹط±ظˆط¨ظٹظ† ط§ظ„ظƒظ„ظٹ ظˆط§ظ„ظ…ط¨ط§ط´ط±طŒ ظˆط§ظ„ط£ظ„ط¨ظˆظ…ظٹظ† ظˆط§ظ„ط¨ط±ظˆطھظٹظ†',
    price: 35000,
    testCodes: ['GOT', 'GPT', 'ALP', 'TSB', 'DIR-BIL', 'TP', 'ALB'],
  },
  {
    id: 'p-5',
    name: 'ط¨ط§ظ‚ط© ط¯ظ‡ظˆظ† ط§ظ„ط¯ظ… ظˆطµط­ط© ط§ظ„ظ‚ظ„ط¨ (Lipid & Cardiovascular Panel)',
    description: 'ط§ظ„ظƒظˆظ„ظٹط³طھط±ظˆظ„ ط§ظ„ظƒظ„ظٹطŒ ط§ظ„ط¯ظ‡ظˆظ† ط§ظ„ط«ظ„ط§ط«ظٹط©طŒ ط§ظ„ظƒظˆظ„ظٹط³طھط±ظˆظ„ ط§ظ„ظ†ط§ظپط¹ HDLطŒ ظˆط§ظ„ظƒظˆظ„ظٹط³طھط±ظˆظ„ ط§ظ„ط¶ط§ط± LDL',
    price: 25000,
    testCodes: ['CHOL', 'TG', 'HDL', 'LDL', 'VLDL'],
  },
  {
    id: 'p-6',
    name: 'ط¨ط§ظ‚ط© ط§ظ„ط؛ط¯ط© ط§ظ„ط¯ط±ظ‚ظٹط© ط§ظ„ظƒط§ظ…ظ„ط© (Thyroid Health Panel)',
    description: 'ظ‡ط±ظ…ظˆظ† ط§ظ„ظ…ط­ظپط² ظ„ظ„ط¯ط±ظ‚ظٹط© TSHطŒ ط§ظ„ط«ط§ظٹط±ظˆظƒط³ظٹظ† ط§ظ„ط­ط± Free T4طŒ ظˆط«ظ„ط§ط«ظٹ ط§ظ„ظٹظˆط¯ ط§ظ„ط­ط± Free T3',
    price: 50000,
    testCodes: ['TSH', 'FT4', 'FT3'],
  },
  {
    id: 'p-7',
    name: 'ط¨ط§ظ‚ط© ط§ظ„ظپط­طµ ط§ظ„ط·ط¨ظٹ ظ‚ط¨ظ„ ط§ظ„ط²ظˆط§ط¬ (Premarital Screen Package)',
    description: 'طµظˆط±ط© ط§ظ„ط¯ظ… ظˆط§ظ„ط£ظ†ظٹظ…ظٹط§طŒ ظپطµظٹظ„ط© ط§ظ„ط¯ظ…طŒ ط§ظ„طھظ‡ط§ط¨ ط§ظ„ظƒط¨ط¯ B ظˆ CطŒ ظپظٹط±ظˆط³ ط§ظ„ط¥ظٹط¯ط²طŒ ظˆط§ظ„ط²ظ‡ط±ظٹ',
    price: 60000,
    testCodes: ['CBC', 'BG', 'HBSAG', 'HCV', 'HIV', 'VDRL'],
  },
  {
    id: 'p-8',
    name: 'ط¨ط§ظ‚ط© طھط³ط§ظ‚ط· ط§ظ„ط´ط¹ط± ظˆط§ظ„ظ†ط´ط§ط· ظˆط§ظ„ط­ظٹظˆظٹط© (Hair Loss & Vitality Screen)',
    description: 'طµظˆط±ط© ط§ظ„ط¯ظ…طŒ ط§ظ„ظپظٹط±ظٹطھظٹظ† ظ…ط®ط²ظˆظ† ط§ظ„ط­ط¯ظٹط¯طŒ ظ‡ط±ظ…ظˆظ† TSHطŒ ط§ظ„ط²ظ†ظƒطŒ ظˆظپظٹطھط§ظ…ظٹظ† D3',
    price: 75000,
    testCodes: ['CBC', 'FER', 'IRON', 'TSH', 'VITD', 'ZINC'],
  },
];

export const INITIAL_DOCTORS = [
  { id: 'doc-1', name: 'ط¯. ط¹ظ„ظٹ ط­ط³ظٹظ† ط§ظ„ط³ط¹ط¯ظٹ', phone: '07709876543', clinic: 'ط¹ظٹط§ط¯ط© ط§ظ„ط¨ط§ط·ظ†ظٹط© ظˆط§ظ„ط³ظƒط±ظٹ - ط´ط§ط±ط¹ ط§ظ„ط£ط·ط¨ط§ط،', specialty: 'ط£ظ…ط±ط§ط¶ ط¨ط§ط·ظ†ظٹط© ظˆط³ظƒط±ظٹ ظˆط؛ط¯ط¯ طµظ…ط§ط،', commissionPercent: 10 },
  { id: 'doc-2', name: 'ط¯. ظ…ط±ظٹظ… ظپط§ط¶ظ„ ط§ظ„ط®ظپط§ط¬ظٹ', phone: '07801122334', clinic: 'ظ…ط¬ظ…ط¹ ط§ظ„ط¹ط§ط¦ظ„ط© ظ„ظ„ظ†ط³ط§ط¦ظٹط© ظˆط§ظ„طھظˆظ„ظٹط¯', specialty: 'ظ†ط³ط§ط¦ظٹط© ظˆطھظˆظ„ظٹط¯ ظˆط¹ظ‚ظ…', commissionPercent: 15 },
  { id: 'doc-3', name: 'ط¯. ظ…طµط·ظپظ‰ ظƒظ…ط§ظ„ ط§ظ„ط²ط¨ظٹط¯ظٹ', phone: '07703334455', clinic: 'ظ…ط±ظƒط² ط§ظ„ظ†ظˆط± ط§ظ„ط·ط¨ظٹ - ط¬ط±ط§ط­ط© ط§ظ„ظƒظ„ظ‰ ظˆط§ظ„ظ…ط³ط§ظ„ظƒ', specialty: 'ط¬ط±ط§ط­ط© ط§ظ„ظƒظ„ظ‰ ظˆط§ظ„ظ…ط³ط§ظ„ظƒ ط§ظ„ط¨ظˆظ„ظٹط© ظˆط§ظ„ط¹ظ‚ظ…', commissionPercent: 12 },
  { id: 'doc-4', name: 'ط¯. ط³ط§ط±ط© ط¹ط§ط¯ظ„ ط§ظ„ط¬ط¨ظˆط±ظٹ', phone: '07806667788', clinic: 'ظ…ط¬ظ…ط¹ ط§ط¨ظ† ط³ظٹظ†ط§ ط§ظ„طھط®طµطµظٹ', specialty: 'ط£ظ…ط±ط§ط¶ ط§ظ„ط¯ظ… ظˆط§ظ„ط£ظˆط±ط§ظ…', commissionPercent: 10 },
];