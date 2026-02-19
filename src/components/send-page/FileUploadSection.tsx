import React, { useRef } from 'react'

interface Props {
  theme: {
    btnClass: string
    bg: string
    border: string
  }
  onFilesSelected: (files: FileList | null) => void
  onManualCreate: () => void
  onClear: () => void
  onSaveList: () => void
  hasData: boolean
}

export function FileUploadSection({ theme, onFilesSelected, onManualCreate, onClear, onSaveList, hasData }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className={`mb-4 p-4 rounded ${theme.bg} border ${theme.border}`}>
      <label className="block text-sm font-medium mb-2">Upload de arquivo (CSV, TXT, XLSX)</label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          onChange={e => onFilesSelected(e.target.files)}
          type="file"
          multiple
          accept=".csv,.txt,.xls,.xlsx"
          className="hidden"
        />
        <button onClick={() => inputRef.current?.click()} className={`btn ${theme.btnClass}`}>
          Selecionar arquivo(s)
        </button>
        <button onClick={onManualCreate} className={`btn ${theme.btnClass}`}>
          Criar manualmente
        </button>
        <button onClick={onClear} className="btn btn-ghost">
          Limpar
        </button>
        {hasData && (
          <button onClick={onSaveList} className={`btn ${theme.btnClass}`}>
            Salvar Lista
          </button>
        )}
      </div>
      <div className="text-xs text-slate-500 mt-2">
        Você pode selecionar múltiplos arquivos ao mesmo tempo; eles serão combinados apenas se os cabeçalhos forem idênticos.
      </div>
    </div>
  )
}
