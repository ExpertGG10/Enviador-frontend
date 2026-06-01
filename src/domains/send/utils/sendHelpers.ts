import { type VariableBinding } from '@/domains/send/components/send-page/WhatsAppTemplatePreviewSection'

export type SendChannel = 'whatsapp' | 'email' | 'none'
export type MatchMode = 'igual' | 'contem' | 'comeca_com' | 'termina_com'

export type SendDraft = {
  channel: SendChannel
  message: string
  subject: string
  selectedEmailSender: string
  selectedEmailTemplateTitle: string
  selectedWhatsappSenderId: string
  selectedWhatsappTemplateTitle: string
  whatsappVariableBindings: Record<string, VariableBinding>
  phoneColumn: string
  emailColumn: string
  fileColumn: string
  matchMode: MatchMode
}

export function loadSendDraft(storageKey: string): SendDraft | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    return JSON.parse(raw) as SendDraft
  } catch {
    return null
  }
}

export function extractTemplateVariables(searchableTextParts: Array<string | undefined>): string[] {
  const vars = new Set<string>()
  const searchableText = searchableTextParts.filter(Boolean).join('\n')
  const matches = searchableText.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)

  for (const match of matches) {
    const variable = match[1].trim()
    if (variable) vars.add(variable)
  }

  return Array.from(vars)
}

export function normalizeAttachmentReference(name: string): string {
  if (!name) return ''
  let normalized = String(name).trim()
  normalized = normalized.replace(/^[\s\-→>»•]+/, '')
  normalized = normalized.trim()
  normalized = normalized.replace(/\.(jpg|jpeg|png|gif|pdf|docx|doc|xlsx|xls|zip|txt)$/i, '')
  return normalized.toLowerCase()
}

export function attachmentMatchesByMode(fileNameValue: string, fileName: string, matchMode: MatchMode): boolean {
  const normValue = normalizeAttachmentReference(fileNameValue)
  const normFile = normalizeAttachmentReference(fileName)

  switch (matchMode) {
    case 'igual':
      return normValue === normFile
    case 'comeca_com':
      return normFile.startsWith(normValue)
    case 'termina_com':
      return normFile.endsWith(normValue)
    case 'contem':
    default:
      return normFile.includes(normValue)
  }
}

export function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `wa-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}