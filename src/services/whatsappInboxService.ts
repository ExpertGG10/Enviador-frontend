import { config } from '../config'

const API_BASE = config.API_BASE

export type WhatsAppConversationListItem = {
  wa_id: string
  contact_name: string
  last_message: string
  last_timestamp: string
  unread_count: number
}

export type WhatsAppMediaInfo = {
  asset_id: number
  media_type: string
  mime_type: string
  status: 'ready' | 'pending' | 'failed' | string
}

export type WhatsAppMediaUrlResponse = {
  asset_id: number
  status: 'ready' | 'pending' | 'failed' | string
  media_type?: string
  mime_type?: string
  url?: string
  file_size_bytes?: number
  whatsapp_message_id?: string
  error?: string
}

export type WhatsAppTimelineMessage = {
  wa_id?: string
  message_id: string
  type: string
  text?: string
  timestamp: number
  datetime_iso: string
  direction: 'inbound' | 'outbound' | string
  phone_number_id: string
  display_phone_number: string
  event_id: number | null
  status?: string | null
  media?: WhatsAppMediaInfo
}

export type WhatsAppTimelineItem = {
  wa_id: string
  contact_name: string
  messages: WhatsAppTimelineMessage[]
}

export type WhatsAppInboxStats = {
  loaded_messages: number
  conversations: number
  wa_id_filter: string | null
  conversation_limit: number
  message_limit: number
}

export type WhatsAppInboxResponse = {
  ui_components: {
    conversation_list: WhatsAppConversationListItem[]
    message_timeline: WhatsAppTimelineItem[]
    stats: WhatsAppInboxStats
  }
}

export type WhatsAppSendTextPayload = {
  sender_id: string
  wa_id: string
  text: string
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

export const whatsappInboxService = {
  async getInbox(token: string): Promise<WhatsAppInboxResponse> {
    const response = await fetch(`${API_BASE}/notifications/whatsapp/inbox/`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(await parseError(response))
    }

    return (await response.json()) as WhatsAppInboxResponse
  },

  async sendTextMessage(token: string, payload: WhatsAppSendTextPayload): Promise<void> {
    const response = await fetch(`${API_BASE}/notifications/whatsapp/send-text/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(await parseError(response))
    }
  },

  async getMediaUrl(token: string, assetId: number): Promise<WhatsAppMediaUrlResponse> {
    const response = await fetch(`${API_BASE}/notifications/whatsapp/media/${assetId}/`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${token}`,  // ← Mude de "Bearer" para "Token"
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      return (await response.json()) as WhatsAppMediaUrlResponse
    }

    return (await response.json()) as WhatsAppMediaUrlResponse
  }
}
