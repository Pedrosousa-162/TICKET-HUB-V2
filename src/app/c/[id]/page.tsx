'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { TicketIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface CollaboratorLinkData {
  id: string
  event_id: string
  collaborator_id: string
  unique_code: string
  clicks: number
  sales: number
  revenue: number
  is_active: boolean
  created_at: string
  updated_at: string
  events: {
    title: string
    slug: string
  }
}

export default function CollaboratorLinkPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadLinkAndRedirect()
  }, [params.id])

  async function loadLinkAndRedirect() {
    try {
      const linkCode = params.id as string
      console.log('Loading link with code:', linkCode)

      // Buscar dados do link (sem join com users/profiles primeiro)
      const { data: linkData, error: linkError } = await supabase
        .from('collaborator_links')
        .select(`
          *,
          events (
            title,
            slug
          )
        `)
        .eq('unique_code', linkCode)
        .single()

      console.log('Link data:', linkData)
      console.log('Link error:', linkError)

      if (linkError) {
        console.error('Supabase error details:', linkError)
        throw new Error(linkError.message || 'Erro ao buscar link')
      }

      const link = linkData as CollaboratorLinkData

      if (!link) {
        setError('Link não encontrado.')
        setLoading(false)
        return
      }

      if (!link.is_active) {
        setError('Este link está desativado.')
        setLoading(false)
        return
      }

      // Incrementar visualizações
      const clickCount = (link.clicks || 0) + 1
      const { error: updateError } = await supabase
        .from('collaborator_links')
        // @ts-ignore - Type inference issue with Supabase update
        .update({ clicks: clickCount })
        .eq('id', link.id)

      if (updateError) {
        console.warn('Error updating clicks:', updateError)
      }

      // Salvar o ID do colaborador no sessionStorage para rastreamento
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('collaborator_ref', link.collaborator_id)
        sessionStorage.setItem('collaborator_link_id', link.id)
      }

      // Redirecionar para a página do evento
      console.log('Redirecting to:', `/events/${link.events.slug}?ref=${linkCode}`)
      router.push(`/events/${link.events.slug}?ref=${linkCode}`)

    } catch (err: any) {
      console.error('Error loading link:', err)
      console.error('Error message:', err?.message)
      console.error('Error details:', JSON.stringify(err, null, 2))
      setError(err?.message || 'Link não encontrado ou inválido.')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecionando...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-medium"
          >
            Voltar à Página Inicial
          </Link>
        </div>
      </div>
    )
  }

  return null
}
