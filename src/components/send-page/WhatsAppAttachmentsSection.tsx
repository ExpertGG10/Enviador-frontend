import React, { useMemo, useRef } from 'react'
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
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const radioStyle = 'w-4 h-4 border-2 rounded-full focus:ring-2 focus:outline-none appearance-none cursor-pointer'
  const checkedColor = theme.accent.includes('green') ? '#16a34a' : '#4f46e5'

  const buttonsWithAttachmentFn = useMemo(
    () => buttons.filter(button => (actionsMap[button.payload]?.functionType || 'none') === 'attachment'),
    [buttons, actionsMap]
  )

  const handleAddFilesForButton = (buttonPayload: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    onAddFiles(files)

    const currentEntries = actionsMap[buttonPayload]?.attachments || []
    const newEntries = Array.from(files).map(file => ({
      ...EMPTY_ENTRY,
      fileName: file.name
    }))
    onButtonAttachmentsChange(buttonPayload, [...currentEntries, ...newEntries])
  }

  const removeAttachmentEntry = (buttonPayload: string, entryIndex: number) => {
    const currentEntries = actionsMap[buttonPayload]?.attachments || []
    onButtonAttachmentsChange(buttonPayload, currentEntries.filter((_, idx) => idx !== entryIndex))
  }

  const updateAttachmentEntry = (
    buttonPayload: string,
    entryIndex: number,
    partial: Partial<WhatsAppButtonAttachmentEntry>
  ) => {
    const currentEntries = actionsMap[buttonPayload]?.attachments || []
    const nextEntries = currentEntries.map((entry, idx) =>
      idx === entryIndex ? { ...entry, ...partial } : entry
    )
    onButtonAttachmentsChange(buttonPayload, nextEntries)
  }

  return (
    <div className={`mb-4 p-4 rounded ${theme.bg} border-2 ${theme.border}`}>
      <h3 className="font-medium mb-2">Função dos botões (WhatsApp)</h3>
      <p className="text-xs text-slate-500 mb-3">
        Defina a função de cada botão da template. Quando a função for "Anexo", a configuração de anexos aparece abaixo do botão.
      </p>

      {buttons.length === 0 ? (
        <p className="text-xs text-amber-600 rounded border border-amber-200 bg-amber-50 p-2">
          Selecione uma template com botões para configurar as funções.
        </p>
      ) : (
        <div className="space-y-3">
          {buttons.map(button => {
            const functionType = actionsMap[button.payload]?.functionType || 'none'
            const entries = actionsMap[button.payload]?.attachments || []

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
                    <input
                      ref={el => { inputRefs.current[button.payload] = el }}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={e => {
                        handleAddFilesForButton(button.payload, e.target.files)
                        e.currentTarget.value = ''
                      }}
                    />

                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">Anexos deste botão</div>
                        <div className="text-xs text-slate-500">Os arquivos adicionados aqui ficam vinculados a este botão.</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => inputRefs.current[button.payload]?.click()}
                        className={`btn ${theme.btnClass}`}
                      >Adicionar arquivo</button>
                    </div>

                    {entries.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Nenhum anexo configurado para este botão.</p>
                    ) : (
                      <div className="space-y-2">
                        {entries.map((entry, idx) => {
                          const selectedFile = attachments.find(file => file.name === entry.fileName)
                          return (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center border-t border-green-100 pt-2">
                              <div className="text-xs text-slate-700 break-all">
                                {entry.fileName || 'Arquivo não selecionado'}
                                {selectedFile && ` (${formatBytes(selectedFile.size)})`}
                              </div>

                              <select
                                value={entry.fileColumn}
                                onChange={e => updateAttachmentEntry(button.payload, idx, { fileColumn: e.target.value })}
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
                                onChange={e => updateAttachmentEntry(button.payload, idx, { caption: e.target.value })}
                                placeholder="Legenda (opcional)"
                                className="input"
                              />

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => removeAttachmentEntry(button.payload, idx)}
                                  className="text-xs text-red-600 hover:underline"
                                >Remover vínculo</button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const fileIndex = attachments.findIndex(file => file.name === entry.fileName)
                                    if (fileIndex >= 0) onRemoveFile(fileIndex)
                                  }}
                                  className="text-xs text-red-500 hover:underline"
                                >Remover arquivo</button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {buttonsWithAttachmentFn.length > 0 && (
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
          )}
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
