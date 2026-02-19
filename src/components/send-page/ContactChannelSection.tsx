import React from 'react'

interface Props {
  channel: 'whatsapp' | 'email' | 'none'
  headers: string[]
  phoneColumn: string
  emailColumn: string
  senderId: string
  appPassword: string
  subject: string
  showPasswordInput: boolean
  theme: {
    bg: string
    border: string
  }
  onPhoneColumnChange: (value: string) => void
  onEmailColumnChange: (value: string) => void
  onSenderIdChange: (value: string) => void
  onAppPasswordChange: (value: string) => void
  onSubjectChange: (value: string) => void
  onTogglePasswordVisibility: () => void
  onChannelChange: (channel: 'whatsapp' | 'email' | 'none') => void
  onSend: () => void
}

export function ContactChannelSection({
  channel,
  headers,
  phoneColumn,
  emailColumn,
  senderId,
  appPassword,
  subject,
  showPasswordInput,
  theme,
  onPhoneColumnChange,
  onEmailColumnChange,
  onSenderIdChange,
  onAppPasswordChange,
  onSubjectChange,
  onTogglePasswordVisibility,
  onChannelChange,
  onSend
}: Props) {
  return (
    <div className="mb-4 space-y-3">
      {/* Contact column selection based on channel */}
      {headers.length > 0 && (
        <div className={`mb-4 p-4 rounded ${theme.bg} border ${theme.border}`}>
          <div className="text-sm font-medium mb-2">
            {channel === 'whatsapp' ? '📱 Coluna de Número' : channel === 'email' ? '📧 Coluna de Email' : '❓ Coluna de Contato'}
          </div>
          <select
            value={channel === 'whatsapp' ? phoneColumn : emailColumn}
            onChange={e => {
              if (channel === 'whatsapp') {
                onPhoneColumnChange(e.target.value)
              } else {
                onEmailColumnChange(e.target.value)
              }
            }}
            className="input w-full"
          >
            <option value="">Selecione a coluna...</option>
            {headers.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <div className="text-xs text-slate-500 mt-2">
            {channel === 'whatsapp'
              ? 'Selecione qual coluna contém o número de telefone dos destinatários.'
              : 'Selecione qual coluna contém o email dos destinatários.'}
          </div>
        </div>
      )}

      {/* Email configuration section */}
      {channel === 'email' && (
        <div className="p-4 rounded bg-red-50 border border-red-200 space-y-3">
          <div>
            <div className="text-sm font-medium mb-1">📧 Email Remetente</div>
            <input 
              type="email"
              value={senderId} 
              onChange={e => onSenderIdChange(e.target.value)} 
              placeholder="seu.email@gmail.com"
              className="input w-full" 
            />
            <div className="text-xs text-slate-500 mt-1">
              Email do Gmail que será usado como remetente dos mensagens
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-1">Senha de App Gmail</div>
            <div className="flex gap-2">
              <input 
                type={showPasswordInput ? 'text' : 'password'} 
                value={appPassword} 
                onChange={e => onAppPasswordChange(e.target.value)} 
                placeholder="Informe sua senha de app do Gmail"
                className="input flex-1" 
              />
              <button 
                onClick={onTogglePasswordVisibility}
                className="btn btn-ghost"
                title={showPasswordInput ? 'Ocultar' : 'Mostrar'}
              >
                {showPasswordInput ? '🙈' : '👁️'}
              </button>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Gere em: <a href="https://myaccount.google.com/apppasswords" target="_blank" className="text-red-600 hover:underline">Google App Passwords</a>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-1">Assunto</div>
            <input value={subject} onChange={e => onSubjectChange(e.target.value)} placeholder="Assunto do email" className="input w-full" />
          </div>
        </div>
      )}

      {/* WhatsApp configuration section */}
      {channel === 'whatsapp' && (
        <div className="p-4 rounded bg-green-50 border border-green-200 space-y-3">
          <div>
            <div className="text-sm font-medium mb-1">📱 Número Remetente (WhatsApp)</div>
            <input 
              type="tel"
              value={senderId} 
              onChange={e => onSenderIdChange(e.target.value)} 
              placeholder="5541999999999"
              className="input w-full" 
            />
            <div className="text-xs text-slate-500 mt-1">
              Número do WhatsApp que será usado como remetente (formato: 55 + DDD + número)
            </div>
          </div>
        </div>
      )}

      {/* Channel selection and Send button */}
      <div className={`p-4 rounded flex items-end justify-between ${theme.bg} border ${theme.border}`}>
        <div>
          <div className="text-sm font-medium mb-1">Canal</div>
          <div className="flex gap-2">
            <label className={`btn ${channel === 'whatsapp' ? 'btn-success' : 'btn-ghost'}`}>
              <input className="hidden" type="radio" name="channel" checked={channel === 'whatsapp'} onChange={() => onChannelChange('whatsapp')} /> WhatsApp
            </label>
            <label className={`btn ${channel === 'email' ? 'btn-danger' : 'btn-ghost'}`}>
              <input className="hidden" type="radio" name="channel" checked={channel === 'email'} onChange={() => onChannelChange('email')} /> Email
            </label>
          </div>
        </div>

        <button onClick={onSend} className={`btn ${theme.btnClass}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          Enviar
        </button>
      </div>
    </div>
  )
}
