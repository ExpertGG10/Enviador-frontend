import React from 'react'

interface Props {
  headers: string[]
  message: string
  theme: {
    bg: string
    border: string
    accent: string
  }
  onMessageChange: (value: string) => void
  onInsertPlaceholder: (placeholder: string) => void
}

export function MessageSection({ headers, message, theme, onMessageChange, onInsertPlaceholder }: Props) {
  return (
    <div className={`mb-4 p-4 rounded ${theme.bg} border ${theme.border}`}>
      <h3 className="font-medium mb-2">Mensagem</h3> 
      <p className="text-sm text-slate-500 mb-2">
        Use placeholders baseados nos cabeçalhos: 
        {headers.map(h => 
          <button 
            key={h} 
            onClick={() => onInsertPlaceholder(h)} 
            className={`ml-2 ${theme.accent} hover:underline text-sm`}
          >
            {'{' + h + '}'}
          </button>
        )}
      </p>
      <textarea 
        value={message} 
        onChange={e => onMessageChange(e.target.value)} 
        rows={4} 
        className="input w-full"
      />
    </div>
  )
}
