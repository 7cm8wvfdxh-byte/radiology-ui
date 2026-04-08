export interface Organ {
  id: string
  name: string
  name_en: string
}

export interface Finding {
  id: string
  name: string
  organ: string
  modality: string
  sequence: string
  display_order: number
}

export interface FindingsResponse {
  organ: string
  modality: string
  grouped: Record<string, Finding[]>
}

export interface Action {
  id: string
  name: string
  urgency: 'kritik' | 'yuksek' | 'orta' | 'elektif'
  urgency_level: number
  order: number
}

export interface Differential {
  name: string
  key_finding: string
  modality: string
}

export interface MatchedFinding {
  finding: string
  weight: number
  required: boolean
  source: string
}

export interface Diagnosis {
  id: string
  name: string
  risk_level: 'yuksek' | 'orta' | 'dusuk'
  lirads: string | null
  icd10: string
  source: string
  report_template: string
  confidence: number
  base_score: number
  final_score: number
  multiplier: number
  matched_findings: MatchedFinding[]
  actions: Action[]
  differentials?: Differential[]
}

export interface DiagnoseResponse {
  organ: string
  modality: string
  findings: string[]
  contexts: string[]
  diagnoses: Diagnosis[]
}

export interface ClinicalContext {
  id: string
  name: string
  description: string
}

export type Modality = 'us' | 'ct' | 'mr'

export const MODALITY_LABELS: Record<Modality, string> = {
  us: 'Ultrasonografi',
  ct: 'BT (Kontrastlı)',
  mr: 'MR',
}

export const SEQUENCE_LABELS: Record<string, string> = {
  bmode:    'B-Mod',
  doppler:  'Doppler',
  ceus:     'CEUS',
  native:   'Natif',
  arterial: 'Arteryel Faz',
  portal:   'Portal Faz',
  delayed:  'Geç Faz',
  t1:       'T1',
  t1_ip_op: 'T1 In/Out Phase',
  t2:       'T2',
  dwi:      'DWI',
  hbp:      'Hepatobiliyer Faz',
}

export const URGENCY_COLORS: Record<string, string> = {
  kritik:  'bg-red-100 text-red-800',
  yuksek:  'bg-orange-100 text-orange-800',
  orta:    'bg-yellow-100 text-yellow-800',
  elektif: 'bg-green-100 text-green-800',
}

export const RISK_COLORS: Record<string, string> = {
  yuksek: 'bg-red-100 text-red-800 border-red-200',
  orta:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  dusuk:  'bg-green-100 text-green-800 border-green-200',
}

export const RISK_LABELS: Record<string, string> = {
  yuksek: 'Yüksek olasılık',
  orta:   'Orta olasılık',
  dusuk:  'Benign / Düşük',
}
