export interface ReportTestItem {
  testName: string;
  category: string;
  resultValue: string;
  unit?: string | null;
  refRangeLow?: number | null;
  refRangeHigh?: number | null;
  refRangeText?: string | null;
  isAbnormal?: boolean | null;
}

export interface ReportData {
  labName: string;
  labAddress?: string | null;
  labPhone?: string | null;
  patientName: string;
  patientAge?: number | null;
  patientGender?: string | null;
  sampleNumber: number;
  sampleDate: string;
  tests: ReportTestItem[];
}

export interface ReportTemplateOptions {
  qrDataUrl?: string;
  pageSize?: 'A4' | 'A5';
  headerColor?: string;
  showSignature?: boolean;
}
