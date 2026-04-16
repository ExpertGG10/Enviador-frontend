import { config } from '../config'

const API_BASE = config.API_BASE

export type WhatsAppTemplatePreview = {
  name: string
  language: string
  header: string
  body: string
  footer: string
  buttons: Array<{
    label: string
    payload: string
  }>
}

type RawWhatsAppTemplateButton =
  | string
  | {
      text?: string
      title?: string
      label?: string
      payload?: string
      button_payload?: string
      quick_reply_payload?: string
    }

type RawWhatsAppTemplatePreview = Omit<WhatsAppTemplatePreview, 'buttons'> & {
  buttons?: RawWhatsAppTemplateButton[]
}

function normalizeButtonPayload(label: string, index: number): string {
  const normalized = label
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')
    .toUpperCase()

  return normalized || `BUTTON_${index + 1}`
}

function normalizeButton(button: RawWhatsAppTemplateButton, index: number): { label: string; payload: string } {
  if (typeof button === 'string') {
    const label = button.trim() || `Botao ${index + 1}`
    return {
      label,
      payload: normalizeButtonPayload(label, index)
    }
  }

  const label = (button.text || button.title || button.label || button.payload || button.button_payload || '').trim() || `Botao ${index + 1}`
  const payload = (button.payload || button.button_payload || button.quick_reply_payload || '').trim() || normalizeButtonPayload(label, index)

  return { label, payload }
}

function normalizePreview(preview: RawWhatsAppTemplatePreview): WhatsAppTemplatePreview {
  return {
    name: preview.name || '',
    language: preview.language || 'pt_BR',
    header: preview.header || '',
    body: preview.body || '',
    footer: preview.footer || '',
    buttons: Array.isArray(preview.buttons)
      ? preview.buttons.map((button, index) => normalizeButton(button, index))
      : []
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const json = await response.json()
    if (typeof json?.detail === 'string') return json.detail
    if (typeof json?.message === 'string') return json.message
    return JSON.stringify(json)
  } catch {
    return `Status ${response.status}`
  }
}

export const whatsappTemplateService = {
  async getTemplatePreview(token: string, senderId: string, templateName: string): Promise<WhatsAppTemplatePreview> {
    const response = await fetch(
      `${API_BASE}/account/whatsapp/senders/${encodeURIComponent(senderId)}/templates/${encodeURIComponent(templateName)}/preview/`,
      {
        method: 'GET',
        headers: {
          Authorization: `Token ${token}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(await parseError(response))
    }

    const raw = (await response.json()) as RawWhatsAppTemplatePreview
    return normalizePreview(raw)
  }
}
