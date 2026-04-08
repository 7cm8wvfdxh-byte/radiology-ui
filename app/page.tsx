'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  getOrgans, getFindings, diagnose, getClinicalContexts,
} from './lib/api'
import {
  Organ, Finding, Diagnosis, ClinicalContext,
  Modality, MODALITY_LABELS, SEQUENCE_LABELS,
  URGENCY_COLORS, RISK_COLORS, RISK_LABELS,
} from './lib/types'

const MODALITIES: Modality[] = ['us', 'ct', 'mr']

export default function Home() {
  const [organs, setOrgans] = useState<Organ[]>([])
  const [contexts, setContexts] = useState<ClinicalContext[]>([])
  const [selectedOrgan, setSelectedOrgan] = useState<string>('')
  const [selectedModality, setSelectedModality] = useState<Modality>('ct')
  const [selectedContexts, setSelectedContexts] = useState<Set<string>>(new Set())
  const [groupedFindings, setGroupedFindings] = useState<Record<string, Finding[]>>({})
  const [selectedFindings, setSelectedFindings] = useState<Set<string>>(new Set())
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [openCard, setOpenCard] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingFindings, setLoadingFindings] = useState(false)

  useEffect(() => {
    getOrgans().then(data => {
      setOrgans(data)
      if (data.length > 0) setSelectedOrgan(data[0].id)
    })
    getClinicalContexts().then(setContexts)
  }, [])

  useEffect(() => {
    if (!selectedOrgan) return
    setLoadingFindings(true)
    setSelectedFindings(new Set())
    setDiagnoses([])
    getFindings(selectedOrgan, selectedModality)
      .then(data => setGroupedFindings(data.grouped))
      .finally(() => setLoadingFindings(false))
  }, [selectedOrgan, selectedModality])

  const toggleFinding = useCallback((id: string) => {
    setSelectedFindings(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const toggleContext = useCallback((id: string) => {
    setSelectedContexts(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const runDiagnose = useCallback(async () => {
    if (selectedFindings.size === 0) return
    setLoading(true)
    setOpenCard(null)
    try {
      const res = await diagnose(
        selectedOrgan,
        selectedModality,
        Array.from(selectedFindings),
        Array.from(selectedContexts)
      )
      setDiagnoses(res.diagnoses)
    } finally {
      setLoading(false)
    }
  }, [selectedOrgan, selectedModality, selectedFindings, selectedContexts])

  const reset = () => {
    setSelectedFindings(new Set())
    setSelectedContexts(new Set())
    setDiagnoses([])
    setOpenCard(null)
  }

  const selectedOrganName = organs.find(o => o.id === selectedOrgan)?.name || ''
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-gray-900">Radyoloji Tanı Asistanı</h1>
            <p className="text-xs text-gray-500 mt-0.5">ACR LI-RADS v2018/2024 · EASL · AASLD 2023 · ACG 2024</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/learn')}
              className="text-sm text-teal-600 border border-teal-200 rounded-lg px-3 py-1.5 hover:bg-teal-50"
            >
              Öğrenme Haritası →
            </button>
            <button onClick={reset} className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
              Temizle
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* SOL PANEL — Girdi */}
        <div className="space-y-5">

          {/* Organ seç */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Organ</p>
            <div className="flex flex-wrap gap-2">
              {organs.map(o => (
                <button
                  key={o.id}
                  onClick={() => setSelectedOrgan(o.id)}
                  className={`px-4 py-2 rounded-full text-sm border transition-all ${
                    selectedOrgan === o.id
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-gray-200 text-gray-700 hover:border-teal-400'
                  }`}
                >
                  {o.name}
                </button>
              ))}
            </div>
          </div>

          {/* Modalite seç */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Modalite</p>
            <div className="flex gap-2">
              {MODALITIES.map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedModality(m)}
                  className={`flex-1 py-2 rounded-lg text-sm border transition-all ${
                    selectedModality === m
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-gray-200 text-gray-700 hover:border-teal-400'
                  }`}
                >
                  {MODALITY_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {/* Klinik bağlam */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Klinik Bağlam</p>
            <div className="flex flex-wrap gap-2">
              {contexts.map(c => (
                <button
                  key={c.id}
                  onClick={() => toggleContext(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                    selectedContexts.has(c.id)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 text-gray-700 hover:border-blue-400'
                  }`}
                  title={c.description}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Bulgular */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
              Bulgular — {selectedOrganName} / {MODALITY_LABELS[selectedModality]}
            </p>
            {loadingFindings ? (
              <p className="text-sm text-gray-400">Yükleniyor...</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedFindings).map(([seq, findings]) => (
                  <div key={seq}>
                    <p className="text-xs font-medium text-teal-700 mb-2">
                      {SEQUENCE_LABELS[seq] || seq}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {findings.map(f => (
                        <button
                          key={f.id}
                          onClick={() => toggleFinding(f.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs border transition-all text-left ${
                            selectedFindings.has(f.id)
                              ? 'bg-teal-50 border-teal-500 text-teal-800'
                              : 'border-gray-200 text-gray-700 hover:border-teal-300'
                          }`}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tanıla butonu */}
          <button
            onClick={runDiagnose}
            disabled={selectedFindings.size === 0 || loading}
            className="w-full py-3 bg-teal-600 text-white rounded-xl font-medium text-sm hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Analiz ediliyor...' : `Tanıla (${selectedFindings.size} bulgu seçildi)`}
          </button>
        </div>

        {/* SAĞ PANEL — Tanılar */}
        <div className="space-y-3">
          {diagnoses.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">Bulgu seçin ve Tanıla butonuna basın</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {diagnoses.length} olası tanı
              </p>
              {diagnoses.map((d, i) => (
                <div
                  key={d.id}
                  className={`bg-white rounded-xl border transition-all ${
                    openCard === d.id ? 'border-teal-400' : 'border-gray-200'
                  }`}
                >
                  {/* Kart başlığı */}
                  <button
                    className="w-full p-4 text-left"
                    onClick={() => setOpenCard(openCard === d.id ? null : d.id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-lg font-medium text-gray-400 w-5 shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">{d.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {/* Confidence bar */}
                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  d.risk_level === 'yuksek' ? 'bg-red-500' :
                                  d.risk_level === 'orta'   ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${d.confidence}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">%{d.confidence}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {d.lirads && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {d.lirads}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${RISK_COLORS[d.risk_level]}`}>
                          {RISK_LABELS[d.risk_level]}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {openCard === d.id ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Kart detayı */}
                  {openCard === d.id && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">

                      {/* Eşleşen bulgular */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Destekleyen bulgular
                        </p>
                        <div className="space-y-1">
                          {d.matched_findings.map((mf, j) => (
                            <div key={j} className="flex items-center justify-between text-xs">
                              <span className="text-gray-700">{mf.finding}</span>
                              <div className="flex items-center gap-2">
                                {mf.required && (
                                  <span className="text-red-500 font-medium">zorunlu</span>
                                )}
                                <span className="text-gray-400">{mf.source}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Rapor cümlesi */}
                      <div className="bg-teal-50 border-l-2 border-teal-500 rounded-r-lg p-3">
                        <p className="text-xs font-medium text-teal-700 mb-1">Rapor cümlesi</p>
                        <p className="text-xs text-gray-700 leading-relaxed italic">
                          {d.report_template}
                        </p>
                      </div>

                      {/* Aksiyonlar */}
                      {d.actions && d.actions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                            Yapılacaklar
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {d.actions.map(a => (
                              <span
                                key={a.id}
                                className={`text-xs px-2.5 py-1 rounded-full font-medium ${URGENCY_COLORS[a.urgency]}`}
                              >
                                {a.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ayırıcı tanılar */}
                      {d.differentials && d.differentials.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                            Ayırıcı tanı
                          </p>
                          <div className="space-y-2">
                            {d.differentials.map((diff, j) => (
                              <div key={j} className="bg-gray-50 rounded-lg p-2.5">
                                <p className="text-xs font-medium text-gray-700">{diff.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{diff.key_finding}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Kaynak */}
                      <p className="text-xs text-gray-400">Kaynak: {d.source}</p>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
