import { config } from '../config'

const API_BASE = config.API_BASE

export type WhatsAppTemplatePreview = {
  name: string
  language: string
  header: string
  body: string
  footer: string
  buttons: string[]
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

    return (await response.json()) as WhatsAppTemplatePreview
  }
}
