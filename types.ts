
export type OrganKey = 'brain' | 'lungs' | 'heart' | 'liver' | 'digestive' | 'limbs' | 'general';

export interface OrganConfig {
  label: string;
  color: string;
  text: string;
  bg: string;
  border: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: string;
  birthDate: string;
}

export interface MedicalRecord {
  id: string;
  category_name: string;
  target_organ: OrganKey;
  report_date: string;
  date: string; // Used for timeline display
  findings: string;
  diagnosis: string;
  doctor_summary?: string;
  detailed_interpretation?: string;
  health_score?: number;
  abnormal_items?: string[];
  images?: string[];
  originalImage?: string;
}

export interface AIAnalysisResult {
  reports: Partial<MedicalRecord>[];
}
