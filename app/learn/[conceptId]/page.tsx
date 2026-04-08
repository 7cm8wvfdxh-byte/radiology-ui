'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const DEMO_USER = 'demo-user-123'

interface Question {
  id: string
  question: string
  options: string[]
  level: number
  type: string
}

interface ConceptDetail {
  id: string
  name: string
  level: number
  category: string
  summary: string
  why_matters: string
  key_points: string[]
  source: string
  unlocks: { id: string; name: string }[]
  requires: { id: string; name: string }[]
  diagnoses: { id: string; name: string; risk_level: string }[]
  questions: Question[]
}

type QuizState = 'idle' | 'question' | 'answered' | 'finished'

const SCORE_LABELS = [
  { score: 5, label: 'Çok kolay', color: 'bg-green-600' },
  { score: 4, label: 'Kolay',     color: 'bg-green-500' },
  { score: 3, label: 'Orta',      color: 'bg-yellow-500' },
  { score: 2, label: 'Zor',       color: 'bg-orange-500' },
  { score: 1, label: 'Çok zor',   color: 'bg-red-500' },
  { score: 0, label: 'Bilmedim',  color: 'bg-red-600' },
]

export default function ConceptPage() {
  const router = useRouter()
  const params = useParams()
  const conceptId = params.conceptId as string

  const [concept, setConcept] = useState<ConceptDetail | null>(null)
  const [loading, setLoading] = useState(true)

  // Quiz state
  const [quizState, setQuizState] = useState<QuizState>('idle')
  const [currentQ, setCurrentQ] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answerResult, setAnswerResult] = useState<{
    is_correct: boolean; explanation: string; sm2: any
  } | null>(null)
  const [startTime, setStartTime] = useState(0)
  const [score, setScore] = useState(0)
  const [results, setResults] = useState<{ correct: boolean; q: Question }[]>([])

  useEffect(() => {
    fetch(`${API}/learn/concept/${conceptId}`)
      .then(r => r.json())
      .then(data => { setConcept(data); setLoading(false) })
  }, [conceptId])

  function startQuiz() {
    setQuizState('question')
    setCurrentQ(0)
    setSelectedAnswer(null)
    setAnswerResult(null)
    setResults([])
    setStartTime(Date.now())
  }

  async function submitAnswer(answerIndex: number, smScore: number) {
    if (!concept) return
    const q = concept.questions[currentQ]
    setSelectedAnswer(answerIndex)

    const timeMs = Date.now() - startTime

    const res = await fetch(`${API}/quiz/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id:       DEMO_USER,
        question_id:   q.id,
        concept_id:    conceptId,
        organ:         concept.id.split('_')[0],
        user_answer:   answerIndex,
        score:         smScore,
        time_spent_ms: timeMs,
      })
    })

    const data = await res.json()
    setAnswerResult(data)
    setQuizState('answered')
    setResults(prev => [...prev, { correct: data.is_correct, q }])
  }

  function nextQuestion() {
    if (!concept) return
    if (currentQ + 1 >= concept.questions.length) {
      setQuizState('finished')
    } else {
      setCurrentQ(prev => prev + 1)
      setSelectedAnswer(null)
      setAnswerResult(null)
      setStartTime(Date.now())
      setQuizState('question')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Yükleniyor...</p>
      </div>
    )
  }

  if (!concept) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Kavram bulunamadı</p>
      </div>
    )
  }

  const currentQuestion = concept.questions[currentQ]
  const correctCount = results.filter(r => r.correct).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/learn')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Öğrenme Haritası
          </button>
          <div className="text-xs text-gray-400">
            {concept.source}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">

        {/* Concept başlık */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-medium text-gray-900">{concept.name}</h1>
              <p className="text-sm text-gray-500 mt-1">{concept.summary}</p>
            </div>
            <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${
              concept.level === 1 ? 'bg-green-100 text-green-800' :
              concept.level === 2 ? 'bg-yellow-100 text-yellow-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              Seviye {concept.level}
            </span>
          </div>
        </div>

        {/* Neden önemli */}
        <div className="bg-teal-50 rounded-xl border border-teal-200 p-5">
          <p className="text-xs font-medium text-teal-700 uppercase tracking-wide mb-2">
            Neden önemli?
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{concept.why_matters}</p>
        </div>

        {/* Anahtar noktalar */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Anahtar Noktalar
          </p>
          <ul className="space-y-2">
            {concept.key_points?.map((point, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-teal-500 mt-0.5 shrink-0 font-medium">{i + 1}.</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Önkoşul / Kilit açılan */}
        <div className="grid grid-cols-2 gap-4">
          {concept.requires.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Önkoşul
              </p>
              {concept.requires.map(r => (
                <button
                  key={r.id}
                  onClick={() => router.push(`/learn/${r.id}`)}
                  className="block text-xs text-teal-600 hover:underline mb-1"
                >
                  ← {r.name}
                </button>
              ))}
            </div>
          )}
          {concept.unlocks.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Sonraki Kavramlar
              </p>
              {concept.unlocks.map(u => (
                <button
                  key={u.id}
                  onClick={() => router.push(`/learn/${u.id}`)}
                  className="block text-xs text-teal-600 hover:underline mb-1"
                >
                  → {u.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* İlgili tanılar */}
        {concept.diagnoses.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              İlgili Tanılar
            </p>
            <div className="flex flex-wrap gap-2">
              {concept.diagnoses.map(d => (
                <span
                  key={d.id}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    d.risk_level === 'yuksek' ? 'bg-red-100 text-red-800' :
                    d.risk_level === 'orta'   ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}
                >
                  {d.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* QUIZ BÖLÜMÜ */}
        {concept.questions.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <p className="font-medium text-gray-900 text-sm">
                Kendini Test Et
              </p>
              <span className="text-xs text-gray-500">
                {concept.questions.length} soru
              </span>
            </div>

            {/* Idle */}
            {quizState === 'idle' && (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Bu kavramla ilgili {concept.questions.length} soru seni bekliyor.
                  SM-2 algoritması cevaplarına göre tekrar zamanını ayarlayacak.
                </p>
                <button
                  onClick={startQuiz}
                  className="px-6 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
                >
                  Teste Başla →
                </button>
              </div>
            )}

            {/* Soru */}
            {quizState === 'question' && currentQuestion && (
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-500">
                    Soru {currentQ + 1} / {concept.questions.length}
                  </span>
                  <div className="flex gap-1">
                    {concept.questions.map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < currentQ ? 'bg-teal-500' :
                          i === currentQ ? 'bg-teal-300' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-sm font-medium text-gray-900 mb-4 leading-relaxed">
                  {currentQuestion.question}
                </p>

                <div className="space-y-2">
                  {currentQuestion.options.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedAnswer(i)
                        setQuizState('answered')
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-teal-400 hover:bg-teal-50 transition-all"
                    >
                      <span className="font-medium text-gray-400 mr-2">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cevaplandı — SM-2 skoru seç */}
            {quizState === 'answered' && currentQuestion && selectedAnswer !== null && (
              <div className="p-5">
                <p className="text-sm font-medium text-gray-900 mb-3 leading-relaxed">
                  {currentQuestion.question}
                </p>

                {/* Seçilen cevap */}
                <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Seçtiğin cevap:</p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium text-gray-400 mr-1">
                      {String.fromCharCode(65 + selectedAnswer)}.
                    </span>
                    {currentQuestion.options[selectedAnswer]}
                  </p>
                </div>

                {/* SM-2 zorluk seçimi */}
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Bu soruyu ne kadar kolay buldun?
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {SCORE_LABELS.map(sl => (
                    <button
                      key={sl.score}
                      onClick={() => submitAnswer(selectedAnswer, sl.score)}
                      className={`py-2 rounded-lg text-white text-xs font-medium ${sl.color} hover:opacity-90`}
                    >
                      {sl.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sonuç göster */}
            {answerResult && quizState !== 'question' && quizState !== 'finished' && (
              <div className={`mx-5 mb-4 p-4 rounded-lg border ${
                answerResult.is_correct
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-xs font-medium mb-1 ${
                  answerResult.is_correct ? 'text-green-700' : 'text-red-700'
                }`}>
                  {answerResult.is_correct ? '✓ Doğru!' : '✗ Yanlış'}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {answerResult.explanation}
                </p>
                {answerResult.sm2 && (
                  <p className="text-xs text-gray-400 mt-2">
                    Sonraki tekrar: {answerResult.sm2.interval} gün sonra
                  </p>
                )}
                <button
                  onClick={nextQuestion}
                  className="mt-3 px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700"
                >
                  {currentQ + 1 >= concept.questions.length ? 'Testi Bitir' : 'Sonraki Soru →'}
                </button>
              </div>
            )}

            {/* Test bitti */}
            {quizState === 'finished' && (
              <div className="p-6 text-center">
                <div className={`text-4xl mb-3 ${
                  correctCount === results.length ? '🎉' :
                  correctCount >= results.length / 2 ? '👍' : '📚'
                }`}>
                  {correctCount === results.length ? '🎉' :
                   correctCount >= results.length / 2 ? '👍' : '📚'}
                </div>
                <p className="font-medium text-gray-900 mb-1">
                  {correctCount} / {results.length} doğru
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  SM-2 algoritması tekrar zamanlarını ayarladı.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={startQuiz}
                    className="px-4 py-2 border border-teal-600 text-teal-600 rounded-lg text-sm hover:bg-teal-50"
                  >
                    Tekrar Dene
                  </button>
                  <button
                    onClick={() => router.push('/learn')}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700"
                  >
                    Haritaya Dön
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
