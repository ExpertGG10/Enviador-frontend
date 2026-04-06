import { AccountSettings, DEFAULT_ACCOUNT_SETTINGS, GmailSenderCard, MessageTemplate, WhatsAppSenderCard } from '../types/accountSettings'

const STORAGE_KEY = 'enviador_account_settings_v2'
export const ACCOUNT_SETTINGS_UPDATED_EVENT = 'enviador:account-settings-updated'

type LooseGmailSenderCard = Omit<Partial<GmailSenderCard>, 'templates'> & {
  templates?: Array<string | MessageTemplate>
}

type LooseWhatsappSenderCard = Omit<Partial<WhatsAppSenderCard>, 'templates'> & {
  templates?: Array<string | MessageTemplate>
}

function sanitizeCardTemplates(templates: Array<string | MessageTemplate> | undefined): MessageTemplate[] {
  if (!templates) return []

  const normalized = templates
    .map<MessageTemplate | null>((template) => {
      if (typeof template === 'string') {
        const title = template.trim()
        if (!title) return null
        return { title, content: '' }
      }

      const title = template.title?.trim() || ''
      const content = template.content?.trim() || ''
      const subject = template.subject?.trim() || ''
      if (!title) return null
      return subject ? { title, content, subject } : { title, content }
    })
    .filter((template): template is MessageTemplate => template !== null)

  return normalized.filter((template, index, arr) => arr.findIndex(item => item.title === template.title) === index)
}

function sanitizeGmailSenderCard(card: LooseGmailSenderCard): GmailSenderCard | null {
  const senderEmail = card.senderEmail?.trim() || ''
  const appPassword = card.appPassword || ''

  if (!senderEmail || !appPassword) return null

  return {
    id: card.id?.trim() || `${senderEmail || 'gmail'}-${Date.now()}`,
    senderEmail,
    appPassword,
    templates: sanitizeCardTemplates(card.templates)
  }
}

function sanitizeGmailSenders(cards: Array<Partial<GmailSenderCard>> | undefined): GmailSenderCard[] {
  return (cards || [])
    .map(sanitizeGmailSenderCard)
    .filter((card): card is GmailSenderCard => Boolean(card))
}

function sanitizeWhatsappSenderCard(card: LooseWhatsappSenderCard): WhatsAppSenderCard | null {
  const phoneNumber = card.phoneNumber?.trim() || ''
  const accessToken = card.accessToken?.trim() || ''
  const accessTokenMasked = card.accessTokenMasked?.trim() || ''
  const phoneNumberId = card.phoneNumberId?.trim() || ''
  const wabaId = card.wabaId?.trim() || ''
  const templates = sanitizeCardTemplates(card.templates)

  if (!phoneNumber && !accessToken && !accessTokenMasked && !phoneNumberId && !wabaId && templates.length === 0) return null

  return {
    id: card.id?.trim() || `${phoneNumber || 'sender'}-${phoneNumberId || Date.now()}`,
    phoneNumber,
    accessToken,
    accessTokenMasked: accessTokenMasked || undefined,
    phoneNumberId,
    wabaId,
    templates: sanitizeCardTemplates(card.templates)
  }
}

function sanitizeWhatsappSenders(cards: Array<Partial<WhatsAppSenderCard>> | undefined): WhatsAppSenderCard[] {
  return (cards || [])
    .map(sanitizeWhatsappSenderCard)
    .filter((card): card is WhatsAppSenderCard => Boolean(card))
}

function normalizeSettings(input: Partial<AccountSettings> | null | undefined): AccountSettings {
  return {
    gmailSenders: sanitizeGmailSenders(input?.gmailSenders),
    whatsappSenders: sanitizeWhatsappSenders(input?.whatsappSenders)
  }
}

export function loadAccountSettings(): AccountSettings {
  if (typeof window === 'undefined') return DEFAULT_ACCOUNT_SETTINGS

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_ACCOUNT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<AccountSettings>
    return normalizeSettings(parsed)
  } catch {
    return DEFAULT_ACCOUNT_SETTINGS
  }
}

export function saveAccountSettings(settings: AccountSettings): AccountSettings {
  const normalized = normalizeSettings(settings)

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
    window.dispatchEvent(new CustomEvent(ACCOUNT_SETTINGS_UPDATED_EVENT, { detail: normalized }))
  }

  return normalized
}

export function getWhatsAppConfigStatus(whatsapp: Pick<WhatsAppSenderCard, 'phoneNumber' | 'accessToken' | 'phoneNumberId' | 'wabaId' | 'accessTokenMasked'>): { isConfigured: boolean; missingFields: string[] } {
  const missingFields: string[] = []
  const accessTokenValue = whatsapp.accessToken.trim() || whatsapp.accessTokenMasked?.trim() || ''

  if (!whatsapp.phoneNumber.trim()) missingFields.push('Número de telefone')
  if (!accessTokenValue) missingFields.push('Token de acesso')
  if (!whatsapp.phoneNumberId.trim()) missingFields.push('Phone Number ID')
  if (!whatsapp.wabaId.trim()) missingFields.push('WABA ID')

  return {
    isConfigured: missingFields.length === 0,
    missingFields
  }
}
