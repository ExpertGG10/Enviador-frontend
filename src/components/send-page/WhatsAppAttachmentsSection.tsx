import React from 'react'

export type WhatsAppButtonFunction = 'none' | 'attachment'

export type WhatsAppButtonAttachmentBinding = {
  fileColumn: string
  captionColumn: string
  required: boolean
  mediaType: 'document' | 'image' | 'video'
  mimeType: string
}

export type WhatsAppButtonAction = {
  functionType: WhatsAppButtonFunction
  binding: WhatsAppButtonAttachmentBinding
}

export type WhatsAppButtonActionsMap = Record<string, WhatsAppButtonAction>

export const DEFAULT_BINDING: WhatsAppButtonAttachmentBinding = {
  fileColumn: '',
  captionColumn: '',
  required: true,
  mediaType: 'document',
  mimeType: 'application/pdf'
}

const MEDIA_TYPE_OPTIONS: Array<{ value: WhatsAppButtonAttachmentBinding['mediaType']; label: string }> = [
  { value: 'document', label: 'Documento' },
  { value: 'image', label: 'Imagem' },
  { value: 'video', label: 'Vídeo' }
]

const MIME_TYPE_SUGGESTIONS: Record<WhatsAppButtonAttachmentBinding['mediaType'], string[]> = {
  document: ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword'],
  image: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/3gpp']
}

type Props = {
  buttons: Array<{ label: string; payload: string }>
  headers: string[]
  actionsMap: WhatsAppButtonActionsMap
  theme: {
    bg: string
    border: string
    accent: string
    btnClass: string
  }
  onButtonFunctionChange: (buttonPayload: string, functionType: WhatsAppButtonFunction) => void
  onButtonBindingChange: (buttonPayload: string, binding: WhatsAppButtonAttachmentBinding) => void
}

export function WhatsAppAttachmentsSection({
  buttons,
  headers,
  actionsMap,
  theme,
  onButtonFunctionChange,
  onButtonBindingChange
}: Props) {
  return (
    <div className={`mb-4 p-4 rounded ${theme.bg} border-2 ${theme.border}`}>
      <h3 className="font-medium mb-2">Função dos botões (WhatsApp)</h3>
      <p className="text-xs text-slate-500 mb-3">
        Defina a função de cada botão da template. Quando a função for "Anexo", configure as colunas da planilha que contêm o nome do arquivo e a legenda.
      </p>

      {buttons.length === 0 ? (
        <p className="text-xs text-amber-600 rounded border border-amber-200 bg-amber-50 p-2">
          Selecione uma template com botões para configurar as funções.
        </p>
      ) : (
        <div className="space-y-3">
          {buttons.map(button => {
            const functionType = actionsMap[button.payload]?.functionType || 'none'
            const binding = actionsMap[button.payload]?.binding || DEFAULT_BINDING

            const updateBinding = (partial: Partial<WhatsAppButtonAttachmentBinding>) => {
              onButtonBindingChange(button.payload, { ...binding, ...partial })
            }

            return (
              <div key={button.payload} className="rounded border border-green-200 bg-white p-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                  <div className="text-sm font-medium text-slate-800">{button.label}</div>
                  <select
                    value={functionType}
                    onChange={e => onButtonFunctionChange(button.payload, e.target.value as WhatsAppButtonFunction)}
                    className="input"
                  >
                    <option value="none">Nenhuma</option>
                    <option value="attachment">Anexo</option>
                  </select>
                </div>

                {functionType === 'attachment' && (
                  <div className="mt-3 rounded border border-green-100 bg-green-50/30 p-3 space-y-3">
                    <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Configuração do Anexo</div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Coluna com nome do arquivo <span className="text-red-500">*</span></label>
                        <select
                          value={binding.fileColumn}
                          onChange={e => updateBinding({ fileColumn: e.target.value })}
                          className="input"
                        >
                          <option value="">Selecione a coluna…</option>
                          {headers.map(header => (
                            <option key={header} value={header}>{header}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Coluna com legenda (opcional)</label>
                        <select
                          value={binding.captionColumn}
                          onChange={e => updateBinding({ captionColumn: e.target.value })}
                          className="input"
                        >
                          <option value="">Nenhuma</option>
                          {headers.map(header => (
                            <option key={header} value={header}>{header}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Tipo de mídia</label>
                        <select
                          value={binding.mediaType}
                          onChange={e => {
                            const mediaType = e.target.value as WhatsAppButtonAttachmentBinding['mediaType']
                            updateBinding({ mediaType, mimeType: MIME_TYPE_SUGGESTIONS[mediaType][0] })
                          }}
                          className="input"
                        >
                          {MEDIA_TYPE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-500 mb-1">MIME type</label>
                        <input
                          type="text"
                          value={binding.mimeType}
                          onChange={e => updateBinding({ mimeType: e.target.value })}
                          placeholder="ex: application/pdf"
                          className="input"
                          list={`mime-suggestions-${button.payload}`}
                        />
                        <datalist id={`mime-suggestions-${button.payload}`}>
                          {MIME_TYPE_SUGGESTIONS[binding.mediaType].map(mime => (
                            <option key={mime} value={mime} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id={`required-${button.payload}`}
                        type="checkbox"
                        checked={binding.required}
                        onChange={e => updateBinding({ required: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <label htmlFor={`required-${button.payload}`} className="text-xs text-slate-600 select-none">
                        Envio obrigatório (erro se a coluna estiver vazia para o destinatário)
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
