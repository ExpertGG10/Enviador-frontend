import React from 'react'
import { WhatsAppTemplatePreview } from '../../services/whatsappTemplateService'

export type VariableBinding = {
  mode: 'column' | 'fixed'
  column: string
  value: string
}

type Props = {
  preview: WhatsAppTemplatePreview | null
  variables: string[]
  headers: string[]
  bindings: Record<string, VariableBinding>
  isLoading: boolean
  error: string | null
  selectedTemplateTitle: string
  theme: {
    bg: string
    border: string
    accent: string
  }
  onBindingChange: (variable: string, binding: VariableBinding) => void
}

function renderWithLineBreaks(text: string) {
  return text.split('\n').map((line, idx) => (
    <React.Fragment key={`${line}-${idx}`}>
      {line}
      {idx < text.split('\n').length - 1 && <br />}
    </React.Fragment>
  ))
}

export function WhatsAppTemplatePreviewSection({
  preview,
  variables,
  headers,
  bindings,
  isLoading,
  error,
  selectedTemplateTitle,
  theme,
  onBindingChange
}: Props) {
  return (
    <div className={`mb-4 p-4 rounded ${theme.bg} border ${theme.border} space-y-4`}>
      <h3 className="font-medium">Template WhatsApp</h3>

      {!selectedTemplateTitle ? (
        <p className="text-sm text-slate-500">Selecione uma template de WhatsApp para ver a prévia e configurar as variáveis.</p>
      ) : isLoading ? (
        <p className="text-sm text-slate-500">Carregando prévia da template...</p>
      ) : error ? (
        <p className="text-sm text-red-600">Não foi possível carregar a prévia: {error}</p>
      ) : !preview ? (
        <p className="text-sm text-slate-500">Prévia indisponível para a template selecionada.</p>
      ) : (
        <>
          <div className="rounded border border-green-200 bg-white p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-1">Nome: {preview.name}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">Idioma: {preview.language}</span>
            </div>

            {preview.header && (
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Header</div>
                <p className="text-sm font-semibold text-slate-800">{renderWithLineBreaks(preview.header)}</p>
              </div>
            )}

            {preview.body && (
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Body</div>
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{renderWithLineBreaks(preview.body)}</p>
              </div>
            )}

            {preview.footer && (
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Footer</div>
                <p className="text-xs text-slate-500">{renderWithLineBreaks(preview.footer)}</p>
              </div>
            )}

            {preview.buttons?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {preview.buttons.map((button, index) => (
                  <span key={`${button.payload}-${index}`} className="rounded border border-slate-300 px-3 py-1 text-xs text-slate-700">
                    {button.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-800">Vínculo das variáveis</h4>

            {variables.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma variável no formato {'{{x}}'} foi encontrada nesta template.</p>
            ) : (
              variables.map((variable) => {
                const binding = bindings[variable] || { mode: 'column' as const, column: '', value: '' }
                return (
                  <div key={variable} className="rounded border border-green-200 bg-white p-3">
                    <div className="text-sm font-medium text-slate-800 mb-2">{`{{${variable}}}`}</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <select
                        value={binding.mode}
                        onChange={e => {
                          const mode = e.target.value as 'column' | 'fixed'
                          onBindingChange(variable, {
                            mode,
                            column: mode === 'column' ? binding.column : '',
                            value: mode === 'fixed' ? binding.value : ''
                          })
                        }}
                        className="input"
                      >
                        <option value="column">Vincular com coluna</option>
                        <option value="fixed">Valor fixo</option>
                      </select>

                      {binding.mode === 'column' ? (
                        <select
                          value={binding.column}
                          onChange={e => {
                            onBindingChange(variable, {
                              ...binding,
                              mode: 'column',
                              column: e.target.value
                            })
                          }}
                          className="input md:col-span-2"
                        >
                          <option value="">Selecione a coluna</option>
                          {headers.map((header) => (
                            <option key={header} value={header}>{header}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={binding.value}
                          onChange={e => {
                            onBindingChange(variable, {
                              ...binding,
                              mode: 'fixed',
                              value: e.target.value
                            })
                          }}
                          placeholder="Digite o valor fixo"
                          className="input md:col-span-2"
                        />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}
