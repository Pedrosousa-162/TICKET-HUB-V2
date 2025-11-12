'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateTestTicketsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState('cs_test_a1L36es7Y9ng0BkGC577oV55YDhQESso6pPum3kvd1UuVZkm0078dujNtg')

  const createTestTickets = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/create-test-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ ${data.message}`)
        router.push(`/payment/success?session_id=${sessionId}`)
      } else {
        alert(`❌ Erro: ${data.error}`)
      }
    } catch (error) {
      alert('❌ Erro ao criar bilhetes')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          🎫 Criar Bilhetes de Teste
        </h1>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session ID
          </label>
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="cs_test_..."
          />
        </div>

        <button
          onClick={createTestTickets}
          disabled={loading || !sessionId}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ Criando...' : '🎫 Criar Bilhetes de Teste'}
        </button>

        <p className="mt-4 text-sm text-gray-600">
          Isso criará 2 bilhetes de teste para visualizar a página de sucesso com QR codes.
        </p>
      </div>
    </div>
  )
}
