import React from 'react'

interface Props {
  showAddModal: boolean
  showEditModal: boolean
  editingColumn: string | null
  newColumnInput: string
  newColumnName: string
  theme: {
    btnClass: string
  }
  onAddColumn: (name: string) => void
  onRenameColumn: (oldName: string, newName: string) => void
  onNewColumnInputChange: (value: string) => void
  onNewColumnNameChange: (value: string) => void
  onCancelAdd: () => void
  onCancelEdit: () => void
}

export function ColumnModals({
  showAddModal,
  showEditModal,
  editingColumn,
  newColumnInput,
  newColumnName,
  theme,
  onAddColumn,
  onRenameColumn,
  onNewColumnInputChange,
  onNewColumnNameChange,
  onCancelAdd,
  onCancelEdit
}: Props) {
  return (
    <>
      {/* Modal de Adição de Coluna */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Adicionar Nova Coluna</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Nome da coluna</label>
              <input
                type="text"
                value={newColumnInput}
                onChange={e => onNewColumnInputChange(e.target.value)}
                placeholder="Ex: Email, Telefone, Cargo..."
                className="input w-full"
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    onAddColumn(newColumnInput)
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onAddColumn(newColumnInput)}
                className={`btn ${theme.btnClass}`}
              >
                Adicionar
              </button>
              <button
                onClick={onCancelAdd}
                className="btn btn-ghost"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Coluna */}
      {showEditModal && editingColumn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Renomear Coluna</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Nome atual</label>
              <div className="text-sm text-slate-600 mb-4 p-2 bg-slate-100 rounded">{editingColumn}</div>
              <label className="block text-sm font-medium mb-2">Novo nome</label>
              <input
                type="text"
                value={newColumnName}
                onChange={e => onNewColumnNameChange(e.target.value)}
                placeholder="Digite o novo nome..."
                className="input w-full"
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    onRenameColumn(editingColumn, newColumnName)
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onRenameColumn(editingColumn, newColumnName)}
                className={`btn ${theme.btnClass}`}
              >
                Renomear
              </button>
              <button
                onClick={onCancelEdit}
                className="btn btn-ghost"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
