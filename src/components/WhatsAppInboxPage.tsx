import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { accountSettingsService } from '../services/accountSettingsService'
import { whatsappInboxService, type WhatsAppInboxResponse } from '../services/whatsappInboxService'
import { getWhatsAppConfigStatus } from '../utils/accountSettingsStorage'

type WhatsAppInboxPageProps = {
  onNavigate?: (page: 'home' | 'send' | 'account' | 'contact' | 'whatsapp' | 'login' | 'signup') => void
}

export default function WhatsAppInboxPage({ onNavigate }: WhatsAppInboxPageProps) {
  const { token } = useAuth()
  const [isWhatsappConfigured, setIsWhatsappConfigured] = React.useState(false)
  const [isLoadingConfig, setIsLoadingConfig] = React.useState(true)
  const [isLoadingInbox, setIsLoadingInbox] = React.useState(false)
  const [error, setError] = React.useState('')
  const [inboxData, setInboxData] = React.useState<WhatsAppInboxResponse | null>(null)
  const [selectedWaId, setSelectedWaId] = React.useState('')

  const getSenderConfigStatus = React.useCallback((sender: {
    phoneNumber: string
    accessToken: string
    phoneNumberId: string
    businessId: string
  }) => {
    return getWhatsAppConfigStatus({
      phoneNumber: sender.phoneNumber,
      accessToken: sender.accessToken,
      phoneNumberId: sender.phoneNumberId,
      businessId: sender.businessId,
      templates: []
    })
  }, [])

  const conversations = React.useMemo(() => {
    if (!inboxData) return []

    const timelineMap = new Map(
      inboxData.ui_components.message_timeline.map((timeline) => [timeline.wa_id, timeline])
    )

    return inboxData.ui_components.conversation_list.map((conversation) => {
      const timeline = timelineMap.get(conversation.wa_id)
      const inboundMessages = (timeline?.messages || []).filter((message) => message.direction === 'inbound')

      return {
        ...conversation,
        contactName: conversation.contact_name || timeline?.contact_name || conversation.wa_id,
        inboundMessages
      }
    })
  }, [inboxData])

  const selectedConversation = React.useMemo(() => {
    if (conversations.length === 0) return null
    return conversations.find((conversation) => conversation.wa_id === selectedWaId) || conversations[0]
  }, [conversations, selectedWaId])

  const formatMessagePreview = React.useCallback((message: { type: string; text?: string }) => {
    if (message.type === 'text') {
      const value = message.text?.trim()
      return value || '{text}'
    }

    return `{${message.type}}`
  }, [])

  const formatDateTime = React.useCallback((value: string) => {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return value

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date)
  }, [])

  const resolveConfigStatus = React.useCallback(() => {
    const settings = accountSettingsService.getCachedSettings()
    const hasConfiguredSender = settings.whatsappSenders.some((sender) =>
      getSenderConfigStatus(sender).isConfigured
    )
    setIsWhatsappConfigured(hasConfiguredSender)
    return hasConfiguredSender
  }, [getSenderConfigStatus])

  const loadInbox = React.useCallback(async () => {
    if (!token) return

    const hasConfiguredSender = resolveConfigStatus()
    if (!hasConfiguredSender) {
      setError('Configure um remetente de WhatsApp válido na aba Conta para liberar a inbox.')
      setInboxData(null)
      return
    }

    setIsLoadingInbox(true)
    setError('')

    try {
      const data = await whatsappInboxService.getInbox(token)
      setInboxData(data)
      setSelectedWaId((current) => current || data.ui_components.conversation_list[0]?.wa_id || '')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível carregar a inbox do WhatsApp.'
      setError(message)
    } finally {
      setIsLoadingInbox(false)
    }
  }, [resolveConfigStatus, token])

  React.useEffect(() => {
    if (!token) return

    let mounted = true

    const loadConfig = async () => {
      setIsLoadingConfig(true)
      setError('')

      try {
        const settings = await accountSettingsService.getSettings(token)
        if (!mounted) return

        const hasConfiguredSender = settings.whatsappSenders.some((sender) =>
          getSenderConfigStatus(sender).isConfigured
        )
        setIsWhatsappConfigured(hasConfiguredSender)
      } catch {
        if (!mounted) return
        const hasConfiguredSender = resolveConfigStatus()
        setIsWhatsappConfigured(hasConfiguredSender)
      } finally {
        if (mounted) setIsLoadingConfig(false)
      }
    }

    loadConfig()

    return () => {
      mounted = false
    }
  }, [getSenderConfigStatus, resolveConfigStatus, token])

  React.useEffect(() => {
    if (!token || isLoadingConfig || !isWhatsappConfigured) return
    loadInbox()
  }, [isLoadingConfig, isWhatsappConfigured, loadInbox, token])

  if (isLoadingConfig) {
    return (
      <section className="card p-6">
        <p className="text-sm text-slate-600">Validando configuração do WhatsApp...</p>
      </section>
    )
  }

  if (!isWhatsappConfigured) {
    return (
      <section className="card p-6 space-y-4">
        <h1 className="h2">Inbox WhatsApp</h1>
        <p className="text-slate-700">
          Esta aba só é liberada após configurar um remetente de WhatsApp com todos os campos obrigatórios.
        </p>
        <div className="flex gap-3">
          <button onClick={() => onNavigate?.('account')} className="btn btn-primary">
            Ir para Conta
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="card p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="h2">Inbox WhatsApp</h1>
          <p className="text-sm text-slate-600">Mensagens recebidas separadas por contato.</p>
        </div>

        <button
          onClick={loadInbox}
          className="btn btn-ghost"
          disabled={isLoadingInbox}
        >
          {isLoadingInbox ? 'Carregando...' : 'Atualizar inbox'}
        </button>
      </div>

      {error && (
        <div className="card p-4 border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {inboxData && (
        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Contatos</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                {inboxData.ui_components.stats.conversations} conversa(s)
              </span>
            </div>

            <div className="space-y-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation.wa_id}
                  type="button"
                  onClick={() => setSelectedWaId(conversation.wa_id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${selectedConversation?.wa_id === conversation.wa_id ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{conversation.contactName}</p>
                      <p className="truncate text-xs text-slate-500">{conversation.wa_id}</p>
                    </div>
                    {conversation.unread_count > 0 && (
                      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 truncate text-sm text-slate-600">
                    {conversation.inboundMessages[conversation.inboundMessages.length - 1]
                      ? formatMessagePreview(conversation.inboundMessages[conversation.inboundMessages.length - 1])
                      : 'Sem mensagens recebidas'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(conversation.last_timestamp)}</p>
                </button>
              ))}

              {conversations.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  Nenhum contato retornado pela inbox.
                </div>
              )}
            </div>
          </aside>

          <section className="card p-4 md:p-6">
            {selectedConversation ? (
              <>
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{selectedConversation.contactName}</h2>
                      <p className="text-sm text-slate-500">{selectedConversation.wa_id}</p>
                    </div>
                    <div className="text-sm text-slate-500">
                      {selectedConversation.inboundMessages.length} mensagem(ns) recebida(s)
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {selectedConversation.inboundMessages.map((message) => (
                    <article key={message.message_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                          recebido
                        </span>
                        <time className="text-xs text-slate-400">{formatDateTime(message.datetime_iso)}</time>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-800">
                        {formatMessagePreview(message)}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-white px-2 py-1">tipo: {message.type}</span>
                        <span className="rounded-full bg-white px-2 py-1">evento: {message.event_id}</span>
                        <span className="rounded-full bg-white px-2 py-1">número exibido: {message.display_phone_number}</span>
                      </div>
                    </article>
                  ))}

                  {selectedConversation.inboundMessages.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                      Este contato não possui mensagens recebidas no payload atual.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                Nenhuma conversa disponível para exibição.
              </div>
            )}
          </section>
        </div>
      )}

      {!inboxData && !isLoadingInbox && !error && (
        <div className="card p-6 text-sm text-slate-500">
          Nenhum dado carregado ainda.
        </div>
      )}
    </section>
  )
}
