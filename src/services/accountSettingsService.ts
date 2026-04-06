import { config } from '../config'
import { AccountSettings } from '../types/accountSettings'
import { loadAccountSettings, saveAccountSettings } from '../utils/accountSettingsStorage'

const API_BASE = config.API_BASE

type AccountSettingsApiResponse = AccountSettings

function toAccountSettings(data: AccountSettingsApiResponse): AccountSettings {
  return saveAccountSettings(data)
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

export const accountSettingsService = {
  async getSettings(token: string): Promise<AccountSettings> {
    const response = await fetch(`${API_BASE}/account/settings/`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(await parseError(response))
    }

    const data = (await response.json()) as AccountSettingsApiResponse
    return toAccountSettings(data)
  },

  async saveSettings(token: string, settings: AccountSettings): Promise<AccountSettings> {
    const response = await fetch(`${API_BASE}/account/settings/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`
      },
      body: JSON.stringify(settings)
    })

    if (!response.ok) {
      throw new Error(await parseError(response))
    }

    const data = (await response.json()) as AccountSettingsApiResponse
    return toAccountSettings(data)
  },

  getCachedSettings(): AccountSettings {
    return loadAccountSettings()
  }
}
