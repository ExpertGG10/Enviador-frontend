import React from 'react'
import { Row } from '../../utils/fileUtils'

interface Props {
  headers: string[]
  rows: Row[]
  currentPage: number
  pageSize: number
  theme: {
    bg: string
    border: string
    btnClass: string
  }
  onUpdateCell: (rowIndex: number, key: string, value: string) => void
  onRemoveRow: (rowIndex: number) => void
  onAddRow: () => void
  onAddColumn: () => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onEditColumn: (columnName: string) => void
  onRemoveColumn: (columnName: string) => void
}

export function DataTableSection({
  headers,
  rows,
  currentPage,
  pageSize,
  theme,
  onUpdateCell,
  onRemoveRow,
  onAddRow,
  onAddColumn,
  onPageChange,
  onPageSizeChange,
  onEditColumn,
  onRemoveColumn
}: Props) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const pageRows = rows.slice(startIndex, startIndex + pageSize)

  if (rows.length === 0) {
    return (
      <div className={`mb-4 p-4 rounded ${theme.bg} border ${theme.border}`}>
        <h3 className="font-medium mb-2">Visualização / Edição de dados</h3>
        <div className="text-slate-500">Nenhum dado carregado. Faça upload de um arquivo para visualizar ou crie manualmente.</div>
      </div>
    )
  }

  return (
    <div className={`mb-4 p-4 rounded ${theme.bg} border ${theme.border}`}>
      <h3 className="font-medium mb-2">Visualização / Edição de dados</h3>
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div>Mostrando <strong>{Math.min(rows.length, startIndex + 1)}</strong> - <strong>{Math.min(rows.length, startIndex + pageSize)}</strong> de <strong>{rows.length}</strong></div>
            <div className="ml-4">| Página <strong>{currentPage}</strong> / <strong>{totalPages}</strong></div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600">Por página:</label>
            <select value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))} className="input">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className='overflow-hidden rounded border border-slate-200'>
            <table className="border-collapse rounded-lg min-w-full divide-y divide-slate-100">
              <thead className="bg-transparent">
                <tr>
                  <th className="p-2 text-left text-sm font-medium text-slate-500">#</th>
                  {headers.map(h => (
                    <th key={h} className="p-2 text-left text-sm font-medium text-slate-500 group relative">
                      <div className="flex items-center justify-between gap-2">
                        <span>{h}</span>
                        <div className="hidden group-hover:flex gap-1">
                          <button
                            onClick={() => onEditColumn(h)}
                            title="Editar coluna"
                            className="text-slate-400 hover:text-blue-600 p-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onRemoveColumn(h)}
                            title="Remover coluna"
                            className="text-slate-400 hover:text-red-600 p-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className="p-2 text-sm text-left font-medium text-slate-500">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {pageRows.map((r, i) => {
                  const globalIndex = startIndex + i
                  return (
                    <tr key={globalIndex} className="border-t border-slate-200 odd:bg-slate-50">
                      <td className="p-2 text-sm">{globalIndex + 1}</td>
                      {headers.map(h => (
                        <td key={h} className="p-2">
                          <input
                            value={r[h] ?? ''}
                            onChange={e => onUpdateCell(globalIndex, h, e.target.value)}
                            className="input w-full"
                          />
                        </td>
                      ))}
                      <td className="p-2">
                        <button onClick={() => onRemoveRow(globalIndex)} className="text-sm text-red-600 hover:underline">Remover</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="mt-3">
              <button onClick={onAddRow} className={`btn ${theme.btnClass} mr-2`}>Adicionar linha</button>
              <button onClick={onAddColumn} className={`btn ${theme.btnClass}`}>Adicionar coluna</button>
            </div>

            <div className="text-sm text-slate-600">Ir para página:
              <input type="number" min={1} max={totalPages} value={currentPage} onChange={e => onPageChange(Math.min(Math.max(1, Number(e.target.value || 1)), totalPages))} className="input w-20 ml-2" />
            </div>
          
            <div className="flex items-center gap-2">
              <button disabled={currentPage === 1} onClick={() => onPageChange(Math.max(1, currentPage - 1))} className="btn btn-ghost">Anterior</button>
              <button disabled={currentPage === totalPages} onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} className="btn btn-ghost">Próxima</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
