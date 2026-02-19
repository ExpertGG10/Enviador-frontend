import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { config } from '../config'
import SendProgressModal from './SendProgressModal'
import ErrorModal from './ErrorModal'
import { FileUploadSection } from './send-page/FileUploadSection'
import { ManualCreateSection } from './send-page/ManualCreateSection'
import { DataTableSection } from './send-page/DataTableSection'
import { AttachmentsSection } from './send-page/AttachmentsSection'
import { MessageSection } from './send-page/MessageSection'
import { ContactChannelSection } from './send-page/ContactChannelSection'
import { AttachmentWarningsModal } from './send-page/AttachmentWarningsModal'
import { ColumnModals } from './send-page/ColumnModals'
import { parseFile, headersEqual, type Row } from '../utils/fileUtils'

export default function SendPage() {
  const { token } = useAuth()
  
  // Data state
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Row[]>([])
  
  // Channel & configuration
  const [channel, setChannel] = useState<'whatsapp' | 'email' | 'none'>('none')
  const [message, setMessage] = useState<string>('Olá {Nome}, este é um teste!')
  const [subject, setSubject] = useState<string>('')
  const [senderId, setSenderId] = useState<string>('')
  const [appPassword, setAppPassword] = useState<string>('')
  const [showPasswordInput, setShowPasswordInput] = useState<boolean>(false)
  
  // Attachments
  const [attachments, setAttachments] = useState<File[]>([])
  const [fileColumn, setFileColumn] = useState<string>('')
  const [matchMode, setMatchMode] = useState<'igual' | 'contem' | 'comeca_com' | 'termina_com'>('contem')
  
  // Contact columns
  const [phoneColumn, setPhoneColumn] = useState<string>('')
  const [emailColumn, setEmailColumn] = useState<string>('')
  
  // Pagination
  const [pageSize, setPageSize] = useState<number>(20)
  const [currentPage, setCurrentPage] = useState<number>(1)
  
  // Manual create
  const [showManual, setShowManual] = useState<boolean>(false)
  const [headerInput, setHeaderInput] = useState<string>('')
  const [manualRow, setManualRow] = useState<Row>({})
  
  // Column management
  const [editingColumn, setEditingColumn] = useState<string | null>(null)
  const [newColumnName, setNewColumnName] = useState<string>('')
  const [showAddColumnModal, setShowAddColumnModal] = useState<boolean>(false)
  const [newColumnInput, setNewColumnInput] = useState<string>('')
  
  // Modals
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [errorModal, setErrorModal] = useState<{ title: string; message: string; details?: string } | null>(null)
  const [showAttachmentPreview, setShowAttachmentPreview] = useState<boolean>(false)
  const [previewWarnings, setPreviewWarnings] = useState<{
    unusedFiles: string[]
    recipientsWithoutFile: Array<{ index: number; value: string }>
    missingFilesForRecipients: Array<{ index: number; fileName: string }>
    recipientsWithMultipleAttachments: Array<{ index: number; attachments: string[]; contact: string }>
    attachmentsSentToMultiple: Array<{ fileName: string; recipients: Array<{ index: number; contact: string }> }>
    attachmentPreview: Array<{ index: number; contact: string; attachments: string[] }>
    bulkWarning: boolean
  }>({
    unusedFiles: [],
    recipientsWithoutFile: [],
    missingFilesForRecipients: [],
    recipientsWithMultipleAttachments: [],
    attachmentsSentToMultiple: [],
    attachmentPreview: [],
    bulkWarning: false
  })

  // Theme mapping
  const themeMap = {
    whatsapp: { bg: 'bg-green-50', border: 'border-green-200', accent: 'text-green-600', btnClass: 'btn-success' },
    email: { bg: 'bg-red-50', border: 'border-red-200', accent: 'text-red-600', btnClass: 'btn-danger' },
    none: { bg: 'bg-blue-50', border: 'border-blue-200', accent: 'text-blue-600', btnClass: 'btn-primary' }
  } as const
  const currentTheme = themeMap[channel]

  // Auto-configure contact column based on channel
  useEffect(() => {
    if (channel === 'email') {
      const emailCols = headers.filter(h => 
        h.toLowerCase().includes('email') || 
        h.toLowerCase().includes('e-mail') ||
        h.toLowerCase().includes('mail')
      )
      if (emailCols.length > 0 && !emailColumn) {
        setEmailColumn(emailCols[0])
      }
    } else if (channel === 'whatsapp') {
      const phoneCols = headers.filter(h => 
        h.toLowerCase().includes('telefone') || 
        h.toLowerCase().includes('celular') || 
        h.toLowerCase().includes('numero') || 
        h.toLowerCase().includes('número') || 
        h.toLowerCase().includes('phone') || 
        h.toLowerCase().includes('whatsapp') ||
        h.toLowerCase().includes('fone')
      )
      if (phoneCols.length > 0 && !phoneColumn) {
        setPhoneColumn(phoneCols[0])
      }
    }
  }, [channel, headers, emailColumn, phoneColumn])

  // File handling
  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    
    const fileArray = Array.from(files)
    const parsed: Array<{ name: string; heads: string[]; rows: Row[] }> = []
    
    for (const f of fileArray) {
      try {
        const p = await parseFile(f)
        parsed.push({ name: f.name, heads: p.heads, rows: p.rows })
      } catch (err: any) {
        setErrorModal({ title: 'Erro ao ler arquivo', message: `Erro ao ler ${f.name}`, details: err?.message || String(err) })
        return
      }
    }
    
    if (parsed.length === 0) return

    const firstHeads = parsed[0].heads
    const allSame = parsed.every(p => headersEqual(p.heads, firstHeads))
    
    if (!allSame) {
      setErrorModal({ title: 'Arquivos incompatíveis', message: 'Os arquivos possuem cabeçalhos diferentes. Selecione arquivos com o mesmo cabeçalho para importar juntos.' })
      return
    }

    if (headers.length > 0 && !headersEqual(headers, firstHeads)) {
      if (!confirm('Os arquivos possuem um cabeçalho diferente do cabeçalho atual. Deseja substituir o cabeçalho atual e perder os dados existentes?')) return
      setHeaders(firstHeads)
      const totalNew = parsed.flatMap(p => p.rows)
      setRows(totalNew)
      setCurrentPage(1)
      return
    }

    const prevLen = rows.length
    const combined = parsed.flatMap(p => p.rows)
    if (headers.length === 0) {
      setHeaders(firstHeads)
      setCurrentPage(1)
    }
    setRows(prev => {
      const next = [...prev, ...combined]
      const nextTotalPages = Math.max(1, Math.ceil(next.length / pageSize))
      if (prevLen === 0) {
        setCurrentPage(1)
      } else {
        setCurrentPage(nextTotalPages)
      }
      return next
    })
    alert(`Importados ${parsed.length} arquivo(s). Linhas adicionadas: ${combined.length}. Total agora: ${prevLen + combined.length}`)
  }

  function handleAttachmentFiles(files: FileList | null) {
    if (!files) return
    setAttachments(prev => {
      const existing = new Map(prev.map(f => [f.name, f]))
      Array.from(files).forEach(f => existing.set(f.name, f))
      return Array.from(existing.values())
    })
  }

  function updateCell(rIdx: number, key: string, value: string) {
    setRows(prev => prev.map((r, i) => (i === rIdx ? { ...r, [key]: value } : r)))
  }

  function addRow() {
    const empty: Row = {}
    headers.forEach(h => (empty[h] = ''))
    setRows(prev => {
      const next = [...prev, empty]
      const nextTotalPages = Math.max(1, Math.ceil(next.length / pageSize))
      setCurrentPage(nextTotalPages)
      return next
    })
  }

  function removeRow(idx: number) {
    setRows(prev => {
      const next = prev.filter((_, i) => i !== idx)
      const nextTotalPages = Math.max(1, Math.ceil(next.length / pageSize))
      if (currentPage > nextTotalPages) setCurrentPage(nextTotalPages)
      return next
    })
  }

  function addColumn(columnName: string) {
    if (!columnName.trim()) {
      alert('O nome da coluna não pode estar vazio.')
      return
    }
    if (headers.includes(columnName)) {
      alert('Uma coluna com este nome já existe.')
      return
    }
    setHeaders(prev => [...prev, columnName])
    setRows(prev => prev.map(r => ({ ...r, [columnName]: '' })))
    setNewColumnInput('')
    setShowAddColumnModal(false)
  }

  function removeColumn(columnName: string) {
    if (!confirm(`Tem certeza que deseja remover a coluna "${columnName}"? Todos os dados desta coluna serão perdidos.`)) {
      return
    }
    setHeaders(prev => prev.filter(h => h !== columnName))
    setRows(prev => prev.map(r => {
      const { [columnName]: _, ...rest } = r
      return rest
    }))
    if (phoneColumn === columnName) setPhoneColumn('')
    if (emailColumn === columnName) setEmailColumn('')
    if (fileColumn === columnName) setFileColumn('')
  }

  function renameColumn(oldName: string, newName: string) {
    if (!newName.trim()) {
      alert('O nome da coluna não pode estar vazio.')
      return
    }
    if (oldName === newName) {
      setEditingColumn(null)
      return
    }
    if (headers.includes(newName)) {
      alert('Uma coluna com este nome já existe.')
      return
    }
    setHeaders(prev => prev.map(h => h === oldName ? newName : h))
    setRows(prev => prev.map(r => {
      const { [oldName]: value, ...rest } = r
      return { ...rest, [newName]: value }
    }))
    if (phoneColumn === oldName) setPhoneColumn(newName)
    if (emailColumn === oldName) setEmailColumn(newName)
    if (fileColumn === oldName) setFileColumn(newName)
    setEditingColumn(null)
    setNewColumnName('')
  }

  function startManualCreate() {
    if (headers.length === 0) {
      setShowManual(true)
      return
    }
    const empty: Row = {}
    headers.forEach(h => (empty[h] = ''))
    setManualRow(empty)
    setShowManual(true)
  }

  function applyHeadersFromInput() {
    const parts = headerInput.split(/[,;\t|]/).map(s => s.trim()).filter(Boolean)
    if (parts.length === 0) return alert('Informe ao menos 2 cabeçalhos separados por vírgula')
    setHeaders(parts)
    setHeaderInput('')
    const empty: Row = {}
    parts.forEach(h => (empty[h] = ''))
    setManualRow(empty)
    setShowManual(true)
  }

  function handleManualChange(key: string, value: string) {
    setManualRow(prev => ({ ...prev, [key]: value }))
  }

  function addManualRow() {
    setRows(prev => {
      const next = [...prev, manualRow]
      setManualRow(headers.reduce((a, h) => ({ ...a, [h]: '' }), {}))
      const nextTotalPages = Math.max(1, Math.ceil(next.length / pageSize))
      setCurrentPage(nextTotalPages)
      return next
    })
  }

  function changePageSize(n: number) {
    setPageSize(n)
    setCurrentPage(1)
  }

  function insertPlaceholder(placeholder: string) {
    setMessage(prev => prev + ' {' + placeholder + '}')
  }

  async function handleSend() {
    if (rows.length === 0) {
      setErrorModal({ title: 'Sem dados', message: 'Nenhum destinatário carregado.' })
      return
    }
    
    const contactColumn = channel === 'whatsapp' ? phoneColumn : channel === 'email' ? emailColumn : ''
    
    if (!contactColumn) {
      setErrorModal({ title: 'Campo obrigatório', message: `Selecione a coluna de ${channel === 'whatsapp' ? 'número' : 'email'} antes de enviar.` })
      return
    }

    if (channel === 'email' && !senderId) {
      setErrorModal({ title: 'Campo obrigatório', message: 'Informe o email remetente para enviar emails.' })
      return
    }

    if (channel === 'email' && !appPassword) {
      setErrorModal({ title: 'Campo obrigatório', message: 'Informe a senha de app do Gmail para enviar emails.' })
      return
    }

    if (channel === 'whatsapp' && !senderId) {
      setErrorModal({ title: 'Campo obrigatório', message: 'Informe o número de telefone para enviar via WhatsApp.' })
      return
    }
    
    const invalid = rows.filter(r => !(r[contactColumn] && r[contactColumn].trim()))
    if (invalid.length > 0) {
      if (!confirm(`${invalid.length} linhas sem ${channel === 'whatsapp' ? 'número' : 'email'}. Continuar mesmo assim?`)) return
    }

    if (channel === 'email' && subject.trim().length === 0) {
      if (!confirm('Assunto vazio. Continuar sem assunto?')) return
    }

    // Analyze attachment warnings and preview
    let unusedFiles: string[] = []
    let recipientsWithoutFile: Array<{ index: number; value: string }> = []
    let missingFilesForRecipients: Array<{ index: number; fileName: string }> = []
    let recipientsWithMultipleAttachments: Array<{ index: number; attachments: string[]; contact: string }> = []
    let attachmentsSentToMultiple: Array<{ fileName: string; recipients: Array<{ index: number; contact: string }> }> = []
    let attachmentPreview: Array<{ index: number; contact: string; attachments: string[] }> = []
    let bulkWarning = false

    if (fileColumn) {
      const _normalize = (name: string): string => {
        if (!name) return ''
        let s = String(name).trim()
        s = s.replace(/^[\s\-→>»•]+/, '')
        s = s.trim()
        s = s.replace(/\.(jpg|jpeg|png|gif|pdf|docx|doc|xlsx|xls|zip|txt)$/i, '')
        return s.toLowerCase()
      }

      const _matchesFile = (fileNameValue: string, fileName: string): boolean => {
        const normValue = _normalize(fileNameValue)
        const normFile = _normalize(fileName)
        
        // Aplicar lógica conforme o modo selecionado
        switch (matchMode) {
          case 'igual':
            return normValue === normFile
          
          case 'comeca_com':
            return normFile.startsWith(normValue)
          
          case 'termina_com':
            return normFile.endsWith(normValue)
          
          case 'contem':
          default:
            return normFile.includes(normValue)
        }
      }

      const filesReferencedSet = new Set<string>()
      const recipientAttachments: Map<number, string[]> = new Map()
      const attachmentRecipients: Map<string, Array<{index: number, contact: string}>> = new Map()
      
      rows.forEach((row, index) => {
        const fileNameValue = (row[fileColumn] || '').trim()
        const contact = row[contactColumn] || `Linha ${index + 1}`
        
        if (!fileNameValue) {
          recipientsWithoutFile.push({ 
            index, 
            value: contact
          })
          attachmentPreview.push({ index, contact, attachments: [] })
          return
        }
        
        // Procura por arquivos que correspondem ao valor da coluna
        const matchedFiles = attachments.filter(f => _matchesFile(fileNameValue, f.name))
        
        recipientAttachments.set(index, matchedFiles.map(f => f.name))
        attachmentPreview.push({ index, contact, attachments: matchedFiles.map(f => f.name) })
        
        if (matchedFiles.length === 0) {
          missingFilesForRecipients.push({ index, fileName: fileNameValue })
        } else {
          matchedFiles.forEach(f => {
            filesReferencedSet.add(_normalize(f.name))
            if (!attachmentRecipients.has(f.name)) {
              attachmentRecipients.set(f.name, [])
            }
            attachmentRecipients.get(f.name)!.push({ index, contact })
          })
        }
      })
      
      unusedFiles = attachments
        .map(f => f.name)
        .filter(name => !filesReferencedSet.has(_normalize(name)))
      
      recipientsWithMultipleAttachments = Array.from(recipientAttachments.entries())
        .filter(([_, atts]) => atts.length > 1)
        .map(([index, atts]) => ({
          index,
          attachments: atts,
          contact: rows[index][contactColumn] || `Linha ${index + 1}`
        }))
      
      attachmentsSentToMultiple = Array.from(attachmentRecipients.entries())
        .filter(([_, recs]) => recs.length > 1)
        .map(([fileName, recs]) => ({ fileName, recipients: recs }))
    } else {
      // Para attachToAll, todos os destinatários recebem todos os anexos
      attachmentPreview = rows.map((row, index) => ({
        index,
        contact: row[contactColumn] || `Linha ${index + 1}`,
        attachments: attachments.map(f => f.name)
      }))
      bulkWarning = attachments.length > 1 && rows.length > 10
    }

    // Sempre mostrar a prévia
    setPreviewWarnings({
      unusedFiles,
      recipientsWithoutFile,
      missingFilesForRecipients,
      recipientsWithMultipleAttachments,
      attachmentsSentToMultiple,
      attachmentPreview,
      bulkWarning
    })
    setShowAttachmentPreview(true)
  }

  async function sendMessages() {
    const contactColumn = channel === 'whatsapp' ? phoneColumn : emailColumn
    
    const payload: any = {
      channel,
      message,
      rows,
      contact_column: contactColumn,
      file_column: fileColumn || null,
      attach_to_all: !fileColumn,
      match_mode: matchMode
    }

    if (channel === 'email') {
      payload.subject = subject
      payload.email_sender = senderId
      payload.app_password = appPassword
    }

    if (channel === 'whatsapp') {
      payload.phone_number = senderId
    }

    if (attachments.length > 0) {
      payload.attachment_names = attachments.map(f => f.name)
    }

    const form = new FormData()
    form.append('payload', JSON.stringify(payload))
    attachments.forEach(f => form.append('files', f, f.name))

    try {
      const resp = await fetch(`${config.API_BASE}/jobs/start/`, { 
        method: 'POST', 
        body: form,
        headers: {
          'Authorization': `Token ${token}`
        }
      })
      
      if (!resp.ok) {
        const text = await resp.text()
        setErrorModal({ title: 'Erro ao iniciar envio', message: `Status ${resp.status}`, details: text })
        return
      }
      const data = await resp.json()
      setCurrentJobId(data.job_id)
      setAppPassword('')
      setShowPasswordInput(false)
    } catch (err: any) {
      setErrorModal({ title: 'Erro de conexão', message: 'Erro ao conectar com o servidor', details: err?.message || String(err) })
    }
  }

  function handleSaveList() {
    console.log('Salvar Lista - payload', { headers, rows })
    alert('Salvar Lista: configuração pendente. Veja console para payload.')
  }

  return (
    <div>
      <h2 className={`text-2xl font-semibold mb-4 ${currentTheme.accent}`}>Enviar Mensagens</h2>

      <FileUploadSection
        theme={currentTheme}
        onFilesSelected={handleFiles}
        onManualCreate={startManualCreate}
        onClear={() => { setHeaders([]); setRows([]); setCurrentPage(1) }}
        onSaveList={handleSaveList}
        hasData={rows.length > 0}
      />

      <ManualCreateSection
        showManual={showManual}
        headers={headers}
        headerInput={headerInput}
        manualRow={manualRow}
        theme={currentTheme}
        onHeaderInputChange={setHeaderInput}
        onApplyHeaders={applyHeadersFromInput}
        onManualRowChange={handleManualChange}
        onAddManualRow={addManualRow}
        onCancel={() => { 
          setShowManual(false) 
          setManualRow(headers.reduce((a, h) => ({ ...a, [h]: '' }), {}))
        }}
      />

      <DataTableSection
        headers={headers}
        rows={rows}
        currentPage={currentPage}
        pageSize={pageSize}
        theme={currentTheme}
        onUpdateCell={updateCell}
        onRemoveRow={removeRow}
        onAddRow={addRow}
        onAddColumn={() => setShowAddColumnModal(true)}
        onPageChange={setCurrentPage}
        onPageSizeChange={changePageSize}
        onEditColumn={(col) => {
          setEditingColumn(col)
          setNewColumnName(col)
        }}
        onRemoveColumn={removeColumn}
      />

      <AttachmentsSection
        attachments={attachments}
        headers={headers}
        fileColumn={fileColumn}
        matchMode={matchMode}
        theme={currentTheme}
        onAddFiles={handleAttachmentFiles}
        onRemoveFile={idx => setAttachments(prev => prev.filter((_, i) => i !== idx))}
        onClearAll={() => setAttachments([])}
        onFileColumnChange={setFileColumn}
        onMatchModeChange={setMatchMode}
      />

      <MessageSection
        headers={headers}
        message={message}
        theme={currentTheme}
        onMessageChange={setMessage}
        onInsertPlaceholder={insertPlaceholder}
      />

      <ContactChannelSection
        channel={channel}
        headers={headers}
        phoneColumn={phoneColumn}
        emailColumn={emailColumn}
        senderId={senderId}
        appPassword={appPassword}
        subject={subject}
        showPasswordInput={showPasswordInput}
        theme={currentTheme}
        onPhoneColumnChange={setPhoneColumn}
        onEmailColumnChange={setEmailColumn}
        onSenderIdChange={setSenderId}
        onAppPasswordChange={setAppPassword}
        onSubjectChange={setSubject}
        onTogglePasswordVisibility={() => setShowPasswordInput(!showPasswordInput)}
        onChannelChange={setChannel}
        onSend={handleSend}
      />

      <AttachmentWarningsModal
        show={showAttachmentPreview}
        warnings={previewWarnings}
        fileColumn={fileColumn}
        onContinue={() => {
          setShowAttachmentPreview(false)
          sendMessages()
        }}
        onCancel={() => setShowAttachmentPreview(false)}
      />

      <ColumnModals
        showAddModal={showAddColumnModal}
        showEditModal={editingColumn !== null}
        editingColumn={editingColumn}
        newColumnInput={newColumnInput}
        newColumnName={newColumnName}
        theme={currentTheme}
        onAddColumn={addColumn}
        onRenameColumn={renameColumn}
        onNewColumnInputChange={setNewColumnInput}
        onNewColumnNameChange={setNewColumnName}
        onCancelAdd={() => {
          setShowAddColumnModal(false)
          setNewColumnInput('')
        }}
        onCancelEdit={() => {
          setEditingColumn(null)
          setNewColumnName('')
        }}
      />

      {currentJobId && (
        <SendProgressModal jobId={currentJobId} token={token} onClose={() => setCurrentJobId(null)} />
      )}

      {errorModal && (
        <ErrorModal
          title={errorModal.title}
          message={errorModal.message}
          details={errorModal.details}
          onClose={() => setErrorModal(null)}
        />
      )}
    </div>
  )
}
