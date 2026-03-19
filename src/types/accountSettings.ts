export interface MessageTemplate {
  title: string
  content: string
  subject?: string
}

export interface GmailSenderCard {
  id: string
  senderEmail: string
  appPassword: string
  templates: MessageTemplate[]
}

export interface WhatsAppSenderCard {
  id: string
  phoneNumber: string
  accessToken: string
  accessTokenMasked?: string
  phoneNumberId: string
  businessId: string
  templates: MessageTemplate[]
}

export interface AccountSettings {
  gmailSenders: GmailSenderCard[]
  whatsappSenders: WhatsAppSenderCard[]
}

export const DEFAULT_ACCOUNT_SETTINGS: AccountSettings = {
  gmailSenders: [],
  whatsappSenders: []
}
