'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const LEVEL_COLORS: Record<number, { bg: string; border: string; text: string; label: string }> = {
  1: { bg: '#E1F5EE', border: '#1D9E75', text: '#085041', label: 'Temel' },
  2: { bg: '#FAEEDA', border: '#EF9F27', text: '#412402', label: 'Orta' },
  3: { bg: '#FAECE7', border: '#D85A30', text: '#4A1B0C', label: 'İleri' },
  4: { bg: '#EEE8FA', border: '#7C3AED', text: '#3B0764', label: 'Ayırıcı Tanı' },
  5: { bg: '#FDE8F0', border: '#DB2777', text: '#500724', label: 'Tuzaklar' },
  6: { bg: '#E0F2FE', border: '#0284C7', text: '#0C4A6E', label: 'Multimodal' },
}

const CATEGORY_ICONS: Record<string, string> = {
  anatomy:    '🫀',
  physiology: '⚗️',
  modality:   '📡',
  technique:  '🔬',
  pathology:  '🧬',
}

interface Concept {
  id: string
  name: string
  level: number
  category: string
  summary: string
  why_matters: string
  key_points: string[]
  source: string
}

interface MapData {
  organ: string
  concepts: Concept[]
  prerequisites: { from: string; to: string }[]
}

export default function LearnPage() {
  const router = useRouter()
  const svgRef = useRef<SVGSVGElement>(null)
  const [mapData, setMapData] = useState<MapData | null>(null)
  const [selected, setSelected] = useState<Concept | null>(null)
  const [organ, setOrgan] = useState('liver')
  const [loading, setLoading] = useState(true)

  const ORGANS = [
    { id: 'liver', name: 'Karaciğer' },
    { id: 'brain', name: 'Beyin' },
    { id: 'lung', name: 'Akciğer' },
    { id: 'kidney', name: 'Böbrek' },
    { id: 'pancreas', name: 'Pankreas' },
  ]

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/learn/map/${organ}`)
      .then(r => r.json())
      .then(data => { setMapData(data); setLoading(false) })
  }, [organ])

  useEffect(() => {
    if (!mapData || !svgRef.current) return
    drawGraph(mapData)
  }, [mapData, selected])

  function drawGraph(data: MapData) {
    const svg = svgRef.current!
    const W = svg.clientWidth || 700
    const H = svg.clientHeight || 500

    svg.innerHTML = ''

    const concepts = data.concepts
    const links = data.prerequisites

    // Seviyeye göre y pozisyonu
    const levelY: Record<number, number> = { 1: H * 0.08, 2: H * 0.22, 3: H * 0.38, 4: H * 0.55, 5: H * 0.72, 6: H * 0.88 }

    // X pozisyonu — aynı seviyedekiler eşit aralıklı
    const levelGroups: Record<number, Concept[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
    concepts.forEach(c => levelGroups[c.level]?.push(c))

    const positions: Record<string, { x: number; y: number }> = {}
    ;[1, 2, 3, 4, 5, 6].forEach(level => {
      const group = levelGroups[level]
      group.forEach((c, i) => {
        const total = group.length
        positions[c.id] = {
          x: (W / (total + 1)) * (i + 1),
          y: levelY[level],
        }
      })
    })

    // Defs — ok işareti
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
    marker.setAttribute('id', 'arrow')
    marker.setAttribute('markerWidth', '8')
    marker.setAttribute('markerHeight', '8')
    marker.setAttribute('refX', '6')
    marker.setAttribute('refY', '3')
    marker.setAttribute('orient', 'auto')
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', 'M0,0 L0,6 L8,3 z')
    path.setAttribute('fill', '#9FE1CB')
    marker.appendChild(path)
    defs.appendChild(marker)
    svg.appendChild(defs)

    // Seviye etiketleri
    ;[1, 2, 3, 4, 5, 6].forEach(level => {
      const info = LEVEL_COLORS[level]
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('x', '12')
      text.setAttribute('y', String(levelY[level] - 30))
      text.setAttribute('font-size', '11')
      text.setAttribute('fill', info.border)
      text.setAttribute('font-weight', '500')
      text.textContent = `Seviye ${level} — ${info.label}`
      svg.appendChild(text)

      // Yatay çizgi
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.setAttribute('x1', '0')
      line.setAttribute('y1', String(levelY[level] - 20))
      line.setAttribute('x2', String(W))
      line.setAttribute('y2', String(levelY[level] - 20))
      line.setAttribute('stroke', info.border)
      line.setAttribute('stroke-width', '0.5')
      line.setAttribute('stroke-dasharray', '4,4')
      line.setAttribute('opacity', '0.3')
      svg.appendChild(line)
    })

    // Kenarlar (önkoşul okları)
    links.forEach(link => {
      const from = positions[link.from]
      const to = positions[link.to]
      if (!from || !to) return

      const dx = to.x - from.x
      const dy = to.y - from.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const nx = dx / dist
      const ny = dy / dist
      const r = 36

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.setAttribute('x1', String(from.x + nx * r))
      line.setAttribute('y1', String(from.y + ny * r))
      line.setAttribute('x2', String(to.x - nx * (r + 4)))
      line.setAttribute('y2', String(to.y - ny * (r + 4)))
      line.setAttribute('stroke', '#9FE1CB')
      line.setAttribute('stroke-width', '1.5')
      line.setAttribute('marker-end', 'url(#arrow)')
      line.setAttribute('opacity', '0.6')
      svg.appendChild(line)
    })

    // Düğümler
    concepts.forEach(c => {
      const pos = positions[c.id]
      if (!pos) return
      const color = LEVEL_COLORS[c.level]
      const isSelected = selected?.id === c.id

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      g.style.cursor = 'pointer'
      g.addEventListener('click', () => setSelected(c))

      // Gölge / seçili halkası
      if (isSelected) {
        const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        ring.setAttribute('cx', String(pos.x))
        ring.setAttribute('cy', String(pos.y))
        ring.setAttribute('r', '42')
        ring.setAttribute('fill', 'none')
        ring.setAttribute('stroke', color.border)
        ring.setAttribute('stroke-width', '2')
        g.appendChild(ring)
      }

      // Ana daire
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', String(pos.x))
      circle.setAttribute('cy', String(pos.y))
      circle.setAttribute('r', '36')
      circle.setAttribute('fill', isSelected ? color.border : color.bg)
      circle.setAttribute('stroke', color.border)
      circle.setAttribute('stroke-width', isSelected ? '2' : '1')
      g.appendChild(circle)

      // İkon
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      icon.setAttribute('x', String(pos.x))
      icon.setAttribute('y', String(pos.y - 8))
      icon.setAttribute('text-anchor', 'middle')
      icon.setAttribute('font-size', '16')
      icon.textContent = CATEGORY_ICONS[c.category] || '📌'
      g.appendChild(icon)

      // Kısa isim
      const words = c.name.split(' ')
      const shortName = words.length > 3 ? words.slice(0, 2).join(' ') + '...' : c.name
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      label.setAttribute('x', String(pos.x))
      label.setAttribute('y', String(pos.y + 10))
      label.setAttribute('text-anchor', 'middle')
      label.setAttribute('font-size', '9')
      label.setAttribute('font-weight', '500')
      label.setAttribute('fill', isSelected ? 'white' : color.text)
      label.textContent = shortName
      g.appendChild(label)

      // Alt isim etiketi
      const nameLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      nameLabel.setAttribute('x', String(pos.x))
      nameLabel.setAttribute('y', String(pos.y + 52))
      nameLabel.setAttribute('text-anchor', 'middle')
      nameLabel.setAttribute('font-size', '10')
      nameLabel.setAttribute('fill', '#666')
      nameLabel.setAttribute('max-width', '80')
      const shortFull = c.name.length > 22 ? c.name.slice(0, 20) + '…' : c.name
      nameLabel.textContent = shortFull
      g.appendChild(nameLabel)

      svg.appendChild(g)
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-gray-900">Öğrenme Haritası</h1>
            <p className="text-xs text-gray-500 mt-0.5">Kavramlar arası ilişkileri keşfet</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50"
          >
            ← Tanı Aracı
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* Organ seç */}
        <div className="flex gap-2 mb-6">
          {ORGANS.map(o => (
            <button
              key={o.id}
              onClick={() => setOrgan(o.id)}
              className={`px-4 py-2 rounded-full text-sm border transition-all ${
                organ === o.id
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'border-gray-200 text-gray-600 hover:border-teal-400'
              }`}
            >
              {o.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Graf */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4">
            {loading ? (
              <div className="flex items-center justify-center h-96 text-gray-400 text-sm">
                Yükleniyor...
              </div>
            ) : (
              <>
                {/* Seviye legendi */}
                <div className="flex gap-4 mb-4">
                  {[1, 2, 3, 4, 5, 6].map(level => (
                    <div key={level} className="flex items-center gap-1.5">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: LEVEL_COLORS[level].border }}
                      />
                      <span className="text-xs text-gray-500">
                        Seviye {level} — {LEVEL_COLORS[level].label}
                      </span>
                    </div>
                  ))}
                </div>
                <svg
                  ref={svgRef}
                  className="w-full"
                  style={{ height: '480px' }}
                />
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Kavrama tıkla → detay görüntüle
                </p>
              </>
            )}
          </div>

          {/* Detay paneli */}
          <div className="space-y-4">
            {!selected ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <p className="text-gray-400 text-sm">Bir kavrama tıkla</p>
                <p className="text-gray-300 text-xs mt-1">Detaylar burada görünecek</p>
              </div>
            ) : (
              <>
                {/* Concept başlık */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: LEVEL_COLORS[selected.level].bg,
                    border: `1px solid ${LEVEL_COLORS[selected.level].border}`
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{CATEGORY_ICONS[selected.category]}</span>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: LEVEL_COLORS[selected.level].border,
                        color: 'white'
                      }}
                    >
                      Seviye {selected.level}
                    </span>
                  </div>
                  <h2 className="font-medium text-gray-900 text-sm leading-snug">
                    {selected.name}
                  </h2>
                </div>

                {/* Özet */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Özet
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selected.summary}
                  </p>
                </div>

                {/* Neden önemli */}
                <div className="bg-teal-50 rounded-xl border border-teal-200 p-4">
                  <p className="text-xs font-medium text-teal-700 uppercase tracking-wide mb-2">
                    Neden önemli?
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selected.why_matters}
                  </p>
                </div>

                {/* Anahtar noktalar */}
                {selected.key_points?.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                      Anahtar Noktalar
                    </p>
                    <ul className="space-y-2">
                      {selected.key_points.map((point, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-teal-500 mt-0.5 shrink-0">→</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Kaynak */}
                <p className="text-xs text-gray-400 px-1">
                  Kaynak: {selected.source}
                </p>

                {/* Test et butonu */}
                <button
                  onClick={() => router.push(`/learn/${selected.id}`)}
                  className="w-full py-3 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-all"
                >
                  Bu Kavramı Test Et →
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
