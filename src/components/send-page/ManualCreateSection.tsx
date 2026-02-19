import React from 'react'
import { Row } from '../../utils/fileUtils'

interface Props {
  showManual: boolean
  headers: string[]
  headerInput: string
  manualRow: Row
  theme: {
    bg: string
    border: string
    btnClass: string
  }
  onHeaderInputChange: (value: string) => void
  onApplyHeaders: () => void
  onManualRowChange: (key: string, value: string) => void
  onAddManualRow: () => void
  onCancel: () => void
}

export function ManualCreateSection({
  showManual,
  headers,
  headerInput,
  manualRow,
  theme,
  onHeaderInputChange,
  onApplyHeaders,
  onManualRowChange,
  onAddManualRow,
  onCancel
}: Props) {
  if (!showManual) return null

  return (
    <div className={`mb-4 p-4 ${theme.bg} border ${theme.border} rounded`}>
      {headers.length === 0 ? (
        <div>
          <div className="text-sm text-slate-600 mb-2">Definir cabeçalhos (separados por vírgula):</div>
          <div className="flex gap-2">
            <input 
              value={headerInput} 
              onChange={e => onHeaderInputChange(e.target.value)} 
              className="input w-full" 
              placeholder="Nome, Celular, Email" 
            />
            <button onClick={onApplyHeaders} className={`btn ${theme.btnClass}`}>Definir</button>
            <button onClick={onCancel} className="btn btn-ghost">Cancelar</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="text-sm font-medium mb-2">Adicionar destinatário manualmente</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {headers.map(h => (
              <div key={h}>
                <div className="text-xs text-slate-500">{h}</div>
                <input 
                  value={manualRow[h] ?? ''} 
                  onChange={e => onManualRowChange(h, e.target.value)} 
                  className="input w-full" 
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={onAddManualRow} className={`btn ${theme.btnClass}`}>Adicionar</button>
            <button onClick={onCancel} className="btn btn-ghost">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}
