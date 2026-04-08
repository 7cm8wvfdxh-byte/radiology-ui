import {
  Organ,
  FindingsResponse,
  DiagnoseResponse,
  ClinicalContext,
  Modality,
} from './types'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function getOrgans(): Promise<Organ[]> {
  const res = await fetch(`${BASE}/organs`)
  if (!res.ok) throw new Error('Organlar yüklenemedi')
  return res.json()
}

export async function getFindings(
  organ: string,
  modality: Modality
): Promise<FindingsResponse> {
  const res = await fetch(`${BASE}/findings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organ, modality }),
  })
  if (!res.ok) throw new Error('Bulgular yüklenemedi')
  return res.json()
}

export async function diagnose(
  organ: string,
  modality: Modality,
  finding_ids: string[],
  clinical_context_ids: string[]
): Promise<DiagnoseResponse> {
  const res = await fetch(`${BASE}/diagnose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organ, modality, finding_ids, clinical_context_ids }),
  })
  if (!res.ok) throw new Error('Tanı alınamadı')
  return res.json()
}

export async function getClinicalContexts(): Promise<ClinicalContext[]> {
  const res = await fetch(`${BASE}/clinical-contexts`)
  if (!res.ok) throw new Error('Klinik bağlamlar yüklenemedi')
  return res.json()
}
