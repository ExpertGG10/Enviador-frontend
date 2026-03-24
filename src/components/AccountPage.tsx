import React, { useMemo, useState } from 'react'
import { AccountSettings, GmailSenderCard, WhatsAppSenderCard } from '../types/accountSettings'
import { getWhatsAppConfigStatus, saveAccountSettings } from '../utils/accountSettingsStorage'
import { accountSettingsService } from '../services/accountSettingsService'
import { useAuth } from '../hooks/useAuth'
import RichTextInput from './RichTextInput'

export default function AccountPage() {
  const { token } = useAuth()
  const [settings, setSettings] = useState<AccountSettings>(() => accountSettingsService.getCachedSettings())
  const [showWhatsAppSenderForm, setShowWhatsAppSenderForm] = useState(false)
  const [editingWhatsAppSenderId, setEditingWhatsAppSenderId] = useState<string | null>(null)
  const [editingGmailSenderId, setEditingGmailSenderId] = useState<string | null>(null)
  const [showGmailForm, setShowGmailForm] = useState(false)
  const [gmailSaved, setGmailSaved] = useState(false)
  const [whatsappSaved, setWhatsappSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [apiMessage, setApiMessage] = useState('')
  const [templateTarget, setTemplateTarget] = useState<{ channel: 'gmail' | 'whatsapp'; senderId: string } | null>(null)
  const [templateTitleInput, setTemplateTitleInput] = useState('')
  const [templateSubjectInput, setTemplateSubjectInput] = useState('')
  const [templateContentInput, setTemplateContentInput] = useState('')

  const activeGmailSender = settings.gmailSenders[0] || null
  const activeWhatsAppSender = settings.whatsappSenders[0] || null

  const [gmailEmailInput, setGmailEmailInput] = useState(activeGmailSender?.senderEmail || '')
  const [gmailPasswordInput, setGmailPasswordInput] = useState(activeGmailSender?.appPassword || '')

  const [phoneNumber, setPhoneNumber] = useState(activeWhatsAppSender?.phoneNumber || '')
  const [accessToken, setAccessToken] = useState(activeWhatsAppSender?.accessToken || '')
  const [phoneNumberId, setPhoneNumberId] = useState(activeWhatsAppSender?.phoneNumberId || '')
  const [wabaId, setWabaId] = useState(activeWhatsAppSender?.wabaId || '')

  const whatsappStatus = useMemo(() => getWhatsAppConfigStatus(activeWhatsAppSender || {
    phoneNumber: '',
    accessToken: '',
    phoneNumberId: '',
    wabaId: ''
  }), [activeWhatsAppSender])
  const whatsappSenderConfigured = settings.whatsappSenders.length > 0

  React.useEffect(() => {
    if (!token) return

    let mounted = true
    setIsLoading(true)
    setApiMessage('')

    accountSettingsService
      .getSettings(token)
      .then((loaded) => {
        if (!mounted) return
        setSettings(loaded)
        setGmailEmailInput(loaded.gmailSenders[0]?.senderEmail || '')
        setGmailPasswordInput(loaded.gmailSenders[0]?.appPassword || '')
        setPhoneNumber(loaded.whatsappSenders[0]?.phoneNumber || '')
        setAccessToken(loaded.whatsappSenders[0]?.accessToken || '')
        setPhoneNumberId(loaded.whatsappSenders[0]?.phoneNumberId || '')
        setWabaId(loaded.whatsappSenders[0]?.wabaId || '')
      })
      .catch(() => {
        if (!mounted) return
        setApiMessage('Não foi possível carregar configurações do servidor. Exibindo dados locais em cache.')
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [token])

  function maskSecret(value: string): string {
    if (!value) return 'Não configurado'
    if (value.length <= 6) return '••••••'
    return `${value.slice(0, 3)}••••••${value.slice(-3)}`
  }

  function openTemplateEditor(channel: 'gmail' | 'whatsapp', senderId: string) {
    setTemplateTarget({ channel, senderId })
    setTemplateTitleInput('')
    setTemplateSubjectInput('')
    setTemplateContentInput('')
  }

  function closeTemplateEditor() {
    setTemplateTarget(null)
    setTemplateTitleInput('')
    setTemplateSubjectInput('')
    setTemplateContentInput('')
  }

  async function handleAddTemplateToSender(channel: 'gmail' | 'whatsapp', senderId: string) {
    const title = templateTitleInput.trim()
    const subject = templateSubjectInput.trim()
    const content = templateContentInput.trim()

    if (!title) {
      setApiMessage(channel === 'gmail' ? 'Informe título e conteúdo do template.' : 'Informe o título do template do WhatsApp.')
      return
    }

    if (channel === 'gmail') {
      if (!content) {
        setApiMessage('Informe título e conteúdo do template.')
        return
      }

      if (!subject) {
        setApiMessage('No template de email, o campo assunto é obrigatório.')
        return
      }
    }

    let next: AccountSettings

    if (channel === 'gmail') {
      const nextGmailSenders = settings.gmailSenders.map(sender => {
        if (sender.id !== senderId) return sender
        const nextTemplates = [
          ...sender.templates.filter(template => template.title !== title),
          { title, subject, content }
        ]
        return { ...sender, templates: nextTemplates }
      })
      next = { ...settings, gmailSenders: nextGmailSenders }
    } else {
      const nextWhatsappSenders = settings.whatsappSenders.map(sender => {
        if (sender.id !== senderId) return sender
        const nextTemplates = [
          ...sender.templates.filter(template => template.title !== title),
          { title, content: '' }
        ]
        return { ...sender, templates: nextTemplates }
      })
      next = { ...settings, whatsappSenders: nextWhatsappSenders }
    }

    if (!token) {
      setSettings(saveAccountSettings(next))
      closeTemplateEditor()
      return
    }

    setIsSaving(true)
    setApiMessage('')
    try {
      const saved = await accountSettingsService.saveSettings(token, next)
      setSettings(saveAccountSettings(saved))
      closeTemplateEditor()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar template.'
      setApiMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteTemplateFromSender(channel: 'gmail' | 'whatsapp', senderId: string, templateTitle: string) {
    let next: AccountSettings

    if (channel === 'gmail') {
      const nextGmailSenders = settings.gmailSenders.map(sender =>
        sender.id === senderId
          ? { ...sender, templates: sender.templates.filter(template => template.title !== templateTitle) }
          : sender
      )
      next = { ...settings, gmailSenders: nextGmailSenders }
    } else {
      const nextWhatsappSenders = settings.whatsappSenders.map(sender =>
        sender.id === senderId
          ? { ...sender, templates: sender.templates.filter(template => template.title !== templateTitle) }
          : sender
      )
      next = { ...settings, whatsappSenders: nextWhatsappSenders }
    }

    if (!token) {
      setSettings(saveAccountSettings(next))
      return
    }

    setIsSaving(true)
    setApiMessage('')
    try {
      const saved = await accountSettingsService.saveSettings(token, next)
      setSettings(saveAccountSettings(saved))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao excluir template.'
      setApiMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveGmail(e: React.FormEvent) {
    e.preventDefault()
    if (!token) {
      setApiMessage('Sessão inválida. Faça login novamente para salvar as configurações.')
      return
    }

    if (!gmailEmailInput.trim() || !gmailPasswordInput.trim()) {
      setApiMessage('Informe email e senha de app para salvar o remetente Gmail.')
      return
    }

    const nextSender: GmailSenderCard = {
      id: editingGmailSenderId || crypto.randomUUID(),
      senderEmail: gmailEmailInput.trim(),
      appPassword: gmailPasswordInput,
      templates: settings.gmailSenders.find(sender => sender.id === editingGmailSenderId)?.templates || []
    }

    const existing = settings.gmailSenders
    const senderIndex = existing.findIndex(sender => sender.id === nextSender.id)
    const nextSenders =
      senderIndex >= 0
        ? existing.map(sender => (sender.id === nextSender.id ? nextSender : sender))
        : [...existing, nextSender]

    const next: AccountSettings = {
      ...settings,
      gmailSenders: nextSenders
    }

    setIsSaving(true)
    setApiMessage('')
    try {
      const saved = await accountSettingsService.saveSettings(token, next)
      const merged = saveAccountSettings(saved)
      setSettings(merged)
      setGmailEmailInput(merged.gmailSenders[0]?.senderEmail || '')
      setGmailPasswordInput(merged.gmailSenders[0]?.appPassword || '')
      setShowGmailForm(false)
      setEditingGmailSenderId(null)
      setGmailSaved(true)
      setTimeout(() => setGmailSaved(false), 2500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar Gmail no backend.'
      setApiMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteGmailSender() {
    if (editingGmailSenderId) {
      await handleDeleteGmailSenderById(editingGmailSenderId)
      return
    }

    setApiMessage('Selecione um card específico para excluir.')
  }

  async function handleDeleteGmailSenderById(senderId: string) {
    if (!token) {
      setApiMessage('Sessão inválida. Faça login novamente para salvar as configurações.')
      return
    }

    if (!confirm('Deseja excluir este remetente de Gmail?')) return

    const remaining = settings.gmailSenders.filter(sender => sender.id !== senderId)
    const next: AccountSettings = {
      ...settings,
      gmailSenders: remaining
    }

    setIsSaving(true)
    setApiMessage('')
    try {
      const saved = await accountSettingsService.saveSettings(token, next)
      const merged = saveAccountSettings(saved)

      setSettings(merged)
      setGmailEmailInput(merged.gmailSenders[0]?.senderEmail || '')
      setGmailPasswordInput(merged.gmailSenders[0]?.appPassword || '')
      setShowGmailForm(false)
      setEditingGmailSenderId(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao excluir remetente de Gmail.'
      setApiMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveWhatsAppSender(e: React.FormEvent) {
    e.preventDefault()
    if (!token) {
      setApiMessage('Sessão inválida. Faça login novamente para salvar as configurações.')
      return
    }

    const nextSender: WhatsAppSenderCard = {
      id: editingWhatsAppSenderId || crypto.randomUUID(),
      phoneNumber: phoneNumber.trim(),
      accessToken: accessToken.trim(),
      phoneNumberId: phoneNumberId.trim(),
      wabaId: wabaId.trim(),
      templates: settings.whatsappSenders.find(sender => sender.id === editingWhatsAppSenderId)?.templates || []
    }

    const existing = settings.whatsappSenders
    const senderIndex = existing.findIndex(sender => sender.id === nextSender.id)
    const nextSenders =
      senderIndex >= 0
        ? existing.map(sender => (sender.id === nextSender.id ? nextSender : sender))
        : [...existing, nextSender]

    const next: AccountSettings = {
      ...settings,
      whatsappSenders: nextSenders
    }

    setIsSaving(true)
    setApiMessage('')
    try {
      const saved = await accountSettingsService.saveSettings(token, next)
      const merged = saveAccountSettings(saved)

      setSettings(merged)
      setPhoneNumber(merged.whatsappSenders[0]?.phoneNumber || '')
      setAccessToken(merged.whatsappSenders[0]?.accessToken || '')
      setPhoneNumberId(merged.whatsappSenders[0]?.phoneNumberId || '')
      setWabaId(merged.whatsappSenders[0]?.wabaId || '')
      setWhatsappSaved(true)
      setShowWhatsAppSenderForm(false)
      setEditingWhatsAppSenderId(null)
      setTimeout(() => setWhatsappSaved(false), 2500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar remetente de WhatsApp no backend.'
      setApiMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteWhatsAppSender() {
    if (editingWhatsAppSenderId) {
      await handleDeleteWhatsAppSenderById(editingWhatsAppSenderId)
      return
    }

    setApiMessage('Selecione um card específico para excluir.')
  }

  async function handleDeleteWhatsAppSenderById(senderId: string) {
    if (!token) {
      setApiMessage('Sessão inválida. Faça login novamente para salvar as configurações.')
      return
    }

    if (!confirm('Deseja excluir este remetente de WhatsApp?')) return

    const remaining = settings.whatsappSenders.filter(sender => sender.id !== senderId)
    const next: AccountSettings = {
      ...settings,
      whatsappSenders: remaining
    }

    setIsSaving(true)
    setApiMessage('')
    try {
      const saved = await accountSettingsService.saveSettings(token, next)
      const merged = saveAccountSettings(saved)

      setSettings(merged)
      setPhoneNumber(merged.whatsappSenders[0]?.phoneNumber || '')
      setAccessToken(merged.whatsappSenders[0]?.accessToken || '')
      setPhoneNumberId(merged.whatsappSenders[0]?.phoneNumberId || '')
      setWabaId(merged.whatsappSenders[0]?.wabaId || '')
      setShowWhatsAppSenderForm(false)
      setEditingWhatsAppSenderId(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao excluir remetente de WhatsApp.'
      setApiMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  function handleCreateNewWhatsAppSender() {
    setEditingWhatsAppSenderId(null)
    setPhoneNumber('')
    setAccessToken('')
    setPhoneNumberId('')
    setWabaId('')
    setShowWhatsAppSenderForm(true)
  }

  function handleCreateNewGmailSender() {
    setEditingGmailSenderId(null)
    setGmailEmailInput('')
    setGmailPasswordInput('')
    setShowGmailForm(true)
  }

  function handleEditGmailSender(sender: GmailSenderCard) {
    setEditingGmailSenderId(sender.id)
    setGmailEmailInput(sender.senderEmail)
    setGmailPasswordInput(sender.appPassword)
    setShowGmailForm(true)
  }

  async function handleSelectGmailSender(sender: GmailSenderCard) {
    const next = saveAccountSettings({
      ...settings,
      gmailSenders: [sender, ...settings.gmailSenders.filter(item => item.id !== sender.id)]
    })

    setSettings(next)
    setEditingGmailSenderId(sender.id)
    setGmailEmailInput(sender.senderEmail)
    setGmailPasswordInput(sender.appPassword)

    if (!token) return

    setIsSaving(true)
    setApiMessage('')
    try {
      const saved = await accountSettingsService.saveSettings(token, next)
      setSettings(saveAccountSettings(saved))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao selecionar remetente de Gmail.'
      setApiMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  function handleEditWhatsAppSender(sender: WhatsAppSenderCard) {
    setEditingWhatsAppSenderId(sender.id)
    setPhoneNumber(sender.phoneNumber)
    setAccessToken(sender.accessToken)
    setPhoneNumberId(sender.phoneNumberId)
    setWabaId(sender.wabaId)
    setShowWhatsAppSenderForm(true)
  }

  async function handleSelectWhatsAppSender(sender: WhatsAppSenderCard) {
    const next = saveAccountSettings({
      ...settings,
      whatsappSenders: [sender, ...settings.whatsappSenders.filter(item => item.id !== sender.id)]
    })

    setSettings(next)
    setEditingWhatsAppSenderId(sender.id)
    setPhoneNumber(sender.phoneNumber)
    setAccessToken(sender.accessToken)
    setPhoneNumberId(sender.phoneNumberId)
    setWabaId(sender.wabaId)

    if (!token) return

    setIsSaving(true)
    setApiMessage('')
    try {
      const saved = await accountSettingsService.saveSettings(token, next)
      setSettings(saveAccountSettings(saved))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao selecionar remetente de WhatsApp.'
      setApiMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  function renderTemplateSection(channel: 'gmail' | 'whatsapp', senderId: string, templates: Array<{ title: string; content: string; subject?: string }>) {
    const isEditingThisCard = templateTarget?.channel === channel && templateTarget.senderId === senderId
    const isWhatsapp = channel === 'whatsapp'
    const channelBtnClass = isWhatsapp ? 'btn-whatsapp' : 'btn-gmail'

    return (
      <div className="mt-3 rounded-lg border border-slate-200 bg-white/80 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-700">Templates</p>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => (isEditingThisCard ? closeTemplateEditor() : openTemplateEditor(channel, senderId))}
          >
            {isEditingThisCard ? 'Cancelar template' : isWhatsapp ? 'Adicionar template da Meta' : 'Adicionar template'}
          </button>
        </div>

        {isWhatsapp && (
          <p className="text-xs text-slate-500">
            Para WhatsApp, este sistema salva apenas o título exato da template já aprovada na Meta.
          </p>
        )}

        {templates.length > 0 ? (
          <div className="space-y-2">
            {templates.map(template => (
              <details key={template.title} className="rounded border border-slate-200 bg-white px-3 py-2">
                <summary className="cursor-pointer text-sm font-medium text-slate-800">{template.title}</summary>
                {channel === 'gmail' && (
                  <p className="mt-2 text-sm text-slate-700"><span className="font-medium">Assunto:</span> {template.subject || 'Sem assunto.'}</p>
                )}
                {channel === 'gmail' && template.content ? (
                  <div
                    className="mt-2 text-sm text-slate-600 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: template.content }}
                  />
                ) : channel === 'gmail' ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">Sem conteúdo.</p>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">Template referenciada pelo título. Conteúdo e variáveis são gerenciados na Meta.</p>
                )}
                <button
                  type="button"
                  className="btn btn-destructive btn-sm mt-2"
                  onClick={() => handleDeleteTemplateFromSender(channel, senderId, template.title)}
                >
                  Excluir template
                </button>
              </details>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Nenhum template cadastrado neste card.</p>
        )}

        {isEditingThisCard && (
          <div className="space-y-2 border-t border-slate-200 pt-2">
            <input
              type="text"
              value={templateTitleInput}
              onChange={(e) => setTemplateTitleInput(e.target.value)}
              placeholder={isWhatsapp ? 'Nome exato da template cadastrada na Meta' : 'Título do template'}
              className="input w-full"
            />
            {channel === 'gmail' && (
              <>
                <input
                  type="text"
                  value={templateSubjectInput}
                  onChange={(e) => setTemplateSubjectInput(e.target.value)}
                  placeholder="Assunto do email"
                  className="input w-full"
                />
                <RichTextInput
                  value={templateContentInput}
                  onChange={setTemplateContentInput}
                  placeholder="Digite ou cole aqui um texto formatado (Ctrl+V com negrito, listas, etc.)"
                  minHeightClassName="min-h-[110px]"
                />
              </>
            )}
            {isWhatsapp && (
              <p className="text-xs text-slate-500">
                O corpo da mensagem não é cadastrado aqui. Informe apenas o título da template existente na plataforma da Meta.
              </p>
            )}
            <button type="button" className={`btn ${channelBtnClass}`} onClick={() => handleAddTemplateToSender(channel, senderId)}>
              Salvar template
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="max-w-4xl mx-auto space-y-6">
      <div className="card p-6">
        <h2 className="text-2xl font-semibold text-slate-900">Conta</h2>
        <p className="text-sm text-slate-600 mt-1">
          Configure e visualize as credenciais de Gmail e WhatsApp Business para habilitar o envio.
        </p>
        {isLoading && <p className="text-sm text-slate-500 mt-2">Carregando configurações da conta...</p>}
        {apiMessage && <p className="badge-warning mt-2">{apiMessage}</p>}
      </div>

      <div className="card p-6 space-y-4 bg-red-50/80 border-2 border-red-300 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Gmail</h3>
            <p className="text-sm text-slate-600">Configuração usada para envios por email.</p>
          </div>
          {gmailSaved && <span className="badge-success">Configuração salva</span>}
        </div>
        <div className="rounded-lg border-2 border-red-300 bg-white/85 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">Cadastrar remetente</h4>
          </div>

          {settings.gmailSenders.length > 0 ? (
            <div className="space-y-2 text-sm">
              {settings.gmailSenders.map((sender) => {
                const isActive = sender.id === activeGmailSender?.id

                return (
                  <div
                    key={sender.id}
                    className={`rounded-lg border p-3 ${isActive ? 'border-red-400 bg-red-50' : 'border-red-200 bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div><span className="text-slate-500">Remetente:</span> <span className="font-medium text-slate-900">{sender.senderEmail}</span></div>
                        <div><span className="text-slate-500">Senha de app:</span> <span className="font-medium text-slate-900">{maskSecret(sender.appPassword)}</span></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" className="btn btn-ghost" onClick={() => handleSelectGmailSender(sender)}>
                          {isActive ? 'Ativo' : 'Selecionar'}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => handleEditGmailSender(sender)}>
                          Editar
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => handleDeleteGmailSenderById(sender.id)} disabled={isSaving}>
                          Excluir
                        </button>
                      </div>
                    </div>
                    {renderTemplateSection('gmail', sender.id, sender.templates)}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-600">Nenhum remetente de Gmail cadastrado.</p>
          )}

          <button type="button" className="btn btn-gmail" onClick={handleCreateNewGmailSender}>
            Adicionar remetente
          </button>
        </div>

        {showGmailForm && (
          <form onSubmit={handleSaveGmail} className="space-y-3 border-2 border-red-300 rounded-lg p-4 bg-white/80">
            <div>
              <label htmlFor="account-gmail-email" className="form-label">Email remetente</label>
              <input
                id="account-gmail-email"
                type="email"
                value={gmailEmailInput}
                onChange={(e) => setGmailEmailInput(e.target.value)}
                placeholder="seu.email@gmail.com"
                className="input w-full"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="account-gmail-password" className="form-label">Senha de app Gmail</label>
              <input
                id="account-gmail-password"
                name="account-gmail-password"
                type="password"
                value={gmailPasswordInput}
                onChange={(e) => setGmailPasswordInput(e.target.value)}
                placeholder="Cole sua senha de app"
                className="input w-full"
                autoComplete="new-password"
              />
              <p className="text-xs text-slate-500 mt-1">
                Gere em: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-red-600 hover:underline">Google App Passwords</a>
              </p>
            </div>
            <button type="submit" className="btn btn-gmail" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar Gmail'}</button>
          </form>
        )}
      </div>

      <div className="card p-6 space-y-4 bg-green-50/80 border-2 border-green-300 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">WhatsApp Business</h3>
            <p className="text-sm text-slate-600">Somente templates aprovados pela Meta são aceitos para envio.</p>
          </div>
          {whatsappSaved && <span className="badge-success">Cadastro salvo</span>}
        </div>
        <div className="rounded-lg border-2 border-green-300 bg-white/85 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">Cadastrar remetente</h4>
          </div>

          {whatsappSenderConfigured ? (
            <div className="space-y-2">
              {settings.whatsappSenders.map((sender) => {
                const isActive = sender.id === activeWhatsAppSender?.id

                return (
                  <div
                    key={sender.id}
                    className={`rounded-lg border p-3 text-sm ${isActive ? 'border-green-400 bg-green-50' : 'border-green-200 bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div><span className="text-slate-500">Número:</span> <span className="font-medium text-slate-900">{sender.phoneNumber}</span></div>
                        <div><span className="text-slate-500">Access Token:</span> <span className="font-medium text-slate-900">{sender.accessTokenMasked || maskSecret(sender.accessToken)}</span></div>
                        <div><span className="text-slate-500">Phone Number ID:</span> <span className="font-medium text-slate-900">{sender.phoneNumberId}</span></div>
                        <div><span className="text-slate-500">WABA ID:</span> <span className="font-medium text-slate-900">{sender.wabaId}</span></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" className="btn btn-ghost" onClick={() => handleSelectWhatsAppSender(sender)}>
                          {isActive ? 'Ativo' : 'Selecionar'}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => handleEditWhatsAppSender(sender)}>
                          Editar
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => handleDeleteWhatsAppSenderById(sender.id)} disabled={isSaving}>
                          Excluir
                        </button>
                      </div>
                    </div>
                    {renderTemplateSection('whatsapp', sender.id, sender.templates)}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-600">Nenhum remetente de WhatsApp cadastrado.</p>
          )}

          <button type="button" onClick={handleCreateNewWhatsAppSender} className="btn btn-whatsapp">
            Adicionar remetente
          </button>
        </div>

        {showWhatsAppSenderForm && (
          <form onSubmit={handleSaveWhatsAppSender} className="space-y-3 border-2 border-green-300 rounded-lg p-4 bg-white/80">
            <div>
              <label htmlFor="wa-phone-number" className="form-label">Número de telefone</label>
              <input
                id="wa-phone-number"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="5541999999999"
                className="input w-full"
              />
            </div>

            <div>
              <label htmlFor="wa-access-token" className="form-label">Token de acesso</label>
              <input
                id="wa-access-token"
                name="wa-access-token"
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Access Token do WhatsApp Business"
                className="input w-full"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="wa-phone-number-id" className="form-label">Phone Number ID</label>
              <input
                id="wa-phone-number-id"
                type="text"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                placeholder="Identificador do número"
                className="input w-full"
              />
            </div>

            <div>
              <label htmlFor="wa-business-id" className="form-label">WABA ID</label>
              <input
                id="wa-business-id"
                type="text"
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                placeholder="Identificador do WhatsApp Business Account"
                className="input w-full"
              />
            </div>

            <button type="submit" className="btn btn-whatsapp" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar remetente WhatsApp'}</button>
          </form>
        )}

      </div>
    </section>
  )
}
