export type FormFieldType = 'text' | 'number' | 'select' | 'chips' | 'textarea' | 'multientry';

export interface FormFieldDefinition {
  key: string;
  label: string;
  arabicLabel?: string;
  type: FormFieldType;
  defaultValue?: any;
  options?: string[];
  unit?: string;
  normalRange?: string;
  refLow?: number;
  refHigh?: number;
  placeholder?: string;
}

export interface FormSectionDefinition {
  id: string;
  title: string;
  arabicTitle?: string;
  fields: FormFieldDefinition[];
}

export interface FormSchema {
  id: string;
  name: string;
  arabicName?: string;
  category: string;
  sections: FormSectionDefinition[];
}
