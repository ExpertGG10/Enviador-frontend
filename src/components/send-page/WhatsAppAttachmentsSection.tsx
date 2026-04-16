import React, { useMemo, useRef, useState } from 'react'
import { formatBytes } from '../../utils/fileUtils'

export type WhatsAppButtonFunction = 'none' | 'attachment'

export type WhatsAppButtonAttachmentEntry = {
  fileName: string
  caption: string
  fileColumn: string
}

export type WhatsAppButtonAction = {
  functionType: WhatsAppButtonFunction
  attachments: WhatsAppButtonAttachmentEntry[]
}

export type WhatsAppButtonActionsMap = Record<string, WhatsAppButtonAction>

type Props = {
  buttons: Array<{ label: string; payload: string }>
  headers: string[]
  matchMode: 'igual' | 'contem' | 'comeca_com' | 'termina_com'
  attachments: File[]
  actionsMap: WhatsAppButtonActionsMap
  theme: {
    bg: string
    border: string
    accent: string
    btnClass: string
  }
  onMatchModeChange: (mode: 'igual' | 'contem' | 'comeca_com' | 'termina_com') => void
  onAddFiles: (files: FileList | null) => void
  onRemoveFile: (index: number) => void
  onClearAll: () => void
  onButtonFunctionChange: (buttonPayload: string, functionType: WhatsAppButtonFunction) => void
  onButtonAttachmentsChange: (buttonPayload: string, entries: WhatsAppButtonAttachmentEntry[]) => void
}

const EMPTY_ENTRY: WhatsAppButtonAttachmentEntry = {
  fileName: '',
  caption: '',
  fileColumn: ''
}

export function WhatsAppAttachmentsSection({
  buttons,
  headers,
  matchMode,
  attachments,
  actionsMap,
  theme,
  onMatchModeChange,
  onAddFiles,
  onRemoveFile,
  onClearAll,
  onButtonFunctionChange,
  onButtonAttachmentsChange
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [activeTab, setActiveTab] = useState<'functions' | 'attachments'>('functions')

  const buttonsWithAttachmentFn = useMemo(
    () => buttons.filter(button => (actionsMap[button.payload]?.functionType || 'none') === 'attachment'),
    [buttons, actionsMap]
  )

  const hasAttachmentFunction = buttonsWithAttachmentFn.length > 0

  const radioStyle = 'w-4 h-4 border-2 rounded-full focus:ring-2 focus:outline-none appearance-none cursor-pointer'
  const checkedColor = theme.accent.includes('green') ? '#16a34a' : '#4f46e5'

  return (
    <div className={`mb-4 p-4 rounded ${theme.bg} border-2 ${theme.border}`}>
      <h3 className="font-medium mb-2">Função dos botões (WhatsApp)</h3>
      <p className="text-xs text-slate-500 mb-3">
        Defina a função de cada botão da template. Ao selecionar "Anexo", você pode configurar os arquivos na aba de anexos.
      </p>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('functions')}
          className={`btn ${activeTab === 'functions' ? 'btn-whatsapp' : 'btn-ghost'}`}
        >Funções</button>
        <button
          type="button"
          onClick={() => hasAttachmentFunction && setActiveTab('attachments')}
          disabled={!hasAttachmentFunction}
          className={`btn ${activeTab === 'attachments' ? 'btn-whatsapp' : 'btn-ghost'} ${!hasAttachmentFunction ? 'opacity-50 cursor-not-allowed' : ''}`}
        >Anexos</button>
      </div>

      {activeTab === 'functions' && (
        <div className="space-y-2">
          {buttons.length === 0 ? (
            <p className="text-xs text-amber-600 rounded border border-amber-200 bg-amber-50 p-2">
              Selecione uma template com botões para configurar as funções.
            </p>
          ) : (
            buttons.map(button => {
              const functionType = actionsMap[button.payload]?.functionType || 'none'
              return (
                <div key={button.payload} className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center rounded border border-green-200 bg-white p-3">
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
              )
            })
          )}
        </div>
      )}

      {activeTab === 'attachments' && (
        <div className="space-y-4">
          <input ref={inputRef} type="file" multiple onChange={e => onAddFiles(e.target.files)} className="hidden" />

          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); onAddFiles(e.dataTransfer?.files ?? null) }}
            className={`border-dashed border-2 rounded p-4 flex items-center justify-between gap-3 ${theme.border}`}
          >
            <div>
              <div className="font-medium">Adicionar anexos</div>
              <div className="text-xs text-slate-500">Arraste aqui ou <button type="button" onClick={() => inputRef.current?.click()} className={`underline ${theme.accent}`}>selecione arquivos</button></div>
            </div>
            <div className="flex items-center gap-3">
              {attachments.length > 0 && (
                <div className="text-sm text-slate-600">{attachments.length} arquivo(s) • {formatBytes(attachments.reduce((s, f) => s + f.size, 0))}</div>
              )}
              <button type="button" onClick={() => inputRef.current?.click()} className={`btn ${theme.btnClass}`}>Adicionar</button>
              {attachments.length > 0 && <button type="button" onClick={onClearAll} className="btn btn-ghost text-red-600">Limpar tudo</button>}
            </div>
          </div>

          {attachments.length > 0 && (
            <ul className="text-sm rounded border border-green-200 bg-white p-3">
              {attachments.map((f, idx) => (
                <li key={idx} className="flex items-center justify-between py-1">
                  <span>{f.name} ({formatBytes(f.size)})</span>
                  <button type="button" onClick={() => onRemoveFile(idx)} className="text-xs text-red-600 hover:underline">Remover</button>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded border border-green-200 bg-white p-3">
            <div className="text-sm font-medium mb-2">Opções de vínculo por coluna</div>
            <div className="text-xs text-slate-500 mb-3">Use coluna para diferenciar destinatários, ou deixe em "Todos os destinatários" para envio global.</div>

            {buttonsWithAttachmentFn.map(button => {
              const entries = actionsMap[button.payload]?.attachments || []

              const updateEntry = (idx: number, partial: Partial<WhatsAppButtonAttachmentEntry>) => {
                const next = entries.map((entry, i) => (i === idx ? { ...entry, ...partial } : entry))
                onButtonAttachmentsChange(button.payload, next)
              }

              const addEntry = () => {
                onButtonAttachmentsChange(button.payload, [...entries, { ...EMPTY_ENTRY }])
              }

              const removeEntry = (idx: number) => {
                onButtonAttachmentsChange(button.payload, entries.filter((_, i) => i !== idx))
              }

              return (
                <div key={button.payload} className="mb-3 rounded border border-green-100 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">Botão: {button.label}</span>
                    <button type="button" onClick={addEntry} className="btn btn-ghost text-xs text-green-700">+ Adicionar arquivo</button>
                  </div>

                  {entries.length === 0 && <p className="text-xs text-slate-400 italic">Nenhum arquivo configurado para este botão.</p>}

                  {entries.map((entry, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center border-t border-green-100 pt-2 mt-2">
                      <select
                        value={entry.fileName}
                        onChange={e => updateEntry(idx, { fileName: e.target.value })}
                        className="input"
                      >
                        <option value="">Selecione o arquivo</option>
                        {attachments.map(file => (
                          <option key={file.name} value={file.name}>{file.name}</option>
                        ))}
                      </select>

                      <select
                        value={entry.fileColumn}
                        onChange={e => updateEntry(idx, { fileColumn: e.target.value })}
                        className="input"
                      >
                        <option value="">Todos os destinatários</option>
                        {headers.map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={entry.caption}
                        disabled={!entry.fileName}
                        onChange={e => updateEntry(idx, { caption: e.target.value })}
                        placeholder="Legenda (opcional)"
                        className="input disabled:opacity-40"
                      />

                      <button type="button" onClick={() => removeEntry(idx)} className="text-xs text-red-600 hover:underline text-left md:text-center">Remover</button>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

          <div className="rounded border border-green-200 bg-white p-3">
            <div className="text-sm font-medium mb-2">Modo de correspondência por coluna</div>
            <div className='flex items-end justify-between'>
              <div className='flex items-center'>
                <input id="wa_igual" type="radio" name="wa-match-mode" value="igual" checked={matchMode === 'igual'} onChange={e => onMatchModeChange(e.target.value as any)} className={`border-2 ${theme.border} ${radioStyle}`} />
                <label htmlFor="wa_igual" className="select-none ms-2 text-xs font-medium text-heading">Igual</label>
              </div>
              <div className='flex items-center'>
                <input id="wa_contem" type="radio" name="wa-match-mode" value="contem" checked={matchMode === 'contem'} onChange={e => onMatchModeChange(e.target.value as any)} className={`border-2 ${theme.border} ${radioStyle}`} />
                <label htmlFor="wa_contem" className="select-none ms-2 text-xs font-medium text-heading">Contém</label>
              </div>
              <div className='flex items-center'>
                <input id="wa_comeca_com" type="radio" name="wa-match-mode" value="comeca_com" checked={matchMode === 'comeca_com'} onChange={e => onMatchModeChange(e.target.value as any)} className={`border-2 ${theme.border} ${radioStyle}`} />
                <label htmlFor="wa_comeca_com" className="select-none ms-2 text-xs font-medium text-heading">Começa com</label>
              </div>
              <div className='flex items-center'>
                <input id="wa_termina_com" type="radio" name="wa-match-mode" value="termina_com" checked={matchMode === 'termina_com'} onChange={e => onMatchModeChange(e.target.value as any)} className={`border-2 ${theme.border} ${radioStyle}`} />
                <label htmlFor="wa_termina_com" className="select-none ms-2 text-xs font-medium text-heading">Termina com</label>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        input[type='radio'][class*='w-4']:checked {
          background-color: ${checkedColor};
          border-color: ${checkedColor};
        }
      `}</style>
    </div>
  )
}
