import React, { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { useAuth } from '../hooks/useAuth'
import { config } from '../config'
import SendProgressModal from './SendProgressModal'
import ErrorModal from './ErrorModal'

type Row = Record<string, string>

export default function SendPage() {
  const { token } = useAuth()
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [message, setMessage] = useState<string>('Olá {Nome}, este é um teste!')
  const [channel, setChannel] = useState<'whatsapp' | 'email' | 'none'>('none')
  const [subject, setSubject] = useState<string>('')
  const [senderId, setSenderId] = useState<string>('')
  const [appPassword, setAppPassword] = useState<string>('')
  const [showPasswordInput, setShowPasswordInput] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const attachmentInputRef = useRef<HTMLInputElement | null>(null)
  // Attachments
  const [attachments, setAttachments] = useState<File[]>([])
  const [fileColumn, setFileColumn] = useState<string>('') // nome da coluna que contém o arquivo
  const [attachToAll, setAttachToAll] = useState<boolean>(false)
  const [includeAttachments, setIncludeAttachments] = useState<boolean>(false) // mostrar UI de anexos

  // Contact columns per channel
  const [phoneColumn, setPhoneColumn] = useState<string>('')
  const [emailColumn, setEmailColumn] = useState<string>('')

  // Pagination & manual create
  const [pageSize, setPageSize] = useState<number>(20)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [showManual, setShowManual] = useState<boolean>(false)
  const [headerInput, setHeaderInput] = useState<string>('')
  const [manualRow, setManualRow] = useState<Row>({})
  const [showAttachmentPreview, setShowAttachmentPreview] = useState<boolean>(false)
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [errorModal, setErrorModal] = useState<{ title: string; message: string; details?: string } | null>(null)
  const [previewWarnings, setPreviewWarnings] = useState<{
    unusedFiles: string[]
    recipientsWithoutFile: Array<{ index: number; value: string }>
    missingFilesForRecipients: Array<{ index: number; fileName: string }>
  }>({
    unusedFiles: [],
    recipientsWithoutFile: [],
    missingFilesForRecipients: []
  })
  const [editingColumn, setEditingColumn] = useState<string | null>(null)
  const [newColumnName, setNewColumnName] = useState<string>('')
  const [showAddColumnModal, setShowAddColumnModal] = useState<boolean>(false)
  const [newColumnInput, setNewColumnInput] = useState<string>('')

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const pageRows = rows.slice(startIndex, startIndex + pageSize)

  // Sync attachToAll with fileColumn: when fileColumn is empty, attachToAll should be true
  useEffect(() => {
    setAttachToAll(fileColumn === '')
  }, [fileColumn])

  // Theme mapping based on selected channel
  const themeMap = {
  whatsapp: { 
    bg: 'bg-green-50', 
    border: 'border-green-200', 
    accent: 'text-green-600',
    btnClass: 'btn-success'
  },
  email: { 
    bg: 'bg-red-50', 
    border: 'border-red-200', 
    accent: 'text-red-600',
    btnClass: 'btn-danger'
  },
  none: { 
    bg: 'bg-blue-50', 
    border: 'border-blue-200', 
    accent: 'text-blue-600',
    btnClass: 'btn-primary'
  }
} as const
  const currentTheme = channel === 'whatsapp' ? themeMap.whatsapp : channel === 'email' ? themeMap.email : themeMap.none

  function parseCSV(text: string) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) return
    // detect delimiter by sampling first few meaningful lines
    const sample = lines.slice(0, 5)
    const delimiter = sample.find(l => l.includes(';')) ? ';' : sample.find(l => l.includes('\t')) ? '\t' : ','

    // find the header line: the first line that has at least 2 columns and all columns non-empty
    let headerIdx = -1
    for (let i = 0; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map(c => c.trim())
      if (cols.length >= 2 && cols.every(c => c.length > 0)) {
        headerIdx = i
        break
      }
    }

    // fallback to first line if none found
    if (headerIdx === -1) headerIdx = 0

    const heads = lines[headerIdx].split(delimiter).map(h => h.trim())
    const dataLines = lines.slice(headerIdx + 1)
    const data = dataLines.map(line => {
      const cols = line.split(delimiter).map(c => c.trim())
      const obj: Row = {}
      heads.forEach((h, i) => (obj[h] = cols[i] ?? ''))
      return obj
    })
    setHeaders(heads)
    setRows(data)
  }  function handleAttachmentFiles(files: FileList | null) {
    console.log('[DEBUG] ========== PROCESSAMENTO DE ANEXOS ==========')
    if (!files) {
      console.log('[DEBUG] Nenhum arquivo recebido')
      return
    }
    
    const arr = Array.from(files)
    console.log('[DEBUG] Número de arquivos recebidos:', arr.length)
    arr.forEach((f, idx) => {
      console.log(`[DEBUG] Arquivo ${idx + 1}/${arr.length}: ${f.name} (${f.size} bytes, tipo: ${f.type})`)
    })
    
    // replace files with same name
    setAttachments(prev => {
      console.log('[DEBUG] Anexos anteriores:', prev.length)
      const existing = new Map(prev.map(f => [f.name, f]))
      console.log('[DEBUG] Mapa de anexos anteriores criado')
      
      for (const f of arr) {
        console.log(`[DEBUG] Processando arquivo: ${f.name}`)
        existing.set(f.name, f)
      }
      
      const result = Array.from(existing.values())
      console.log('[DEBUG] Anexos finais após processamento:', result.length)
      result.forEach((f, idx) => {
        console.log(`[DEBUG] Anexo final ${idx + 1}/${result.length}: ${f.name}`)
      })
      return result
    })
  }

  function removeAttachment(idx: number) {
    console.log('[DEBUG] Removendo anexo no índice:', idx)
    setAttachments(prev => {
      const updated = prev.filter((_, i) => i !== idx)
      console.log('[DEBUG] Anexos após remoção:', updated.length)
      return updated
    })
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const fileArray = Array.from(files)

    async function parseFile(f: File): Promise<{ heads: string[]; rows: Row[] }> {
      const name = f.name.toLowerCase()
      if (name.endsWith('.csv') || name.endsWith('.txt')) {
        const text = await new Promise<string>((res, rej) => {
          const reader = new FileReader()
          reader.onload = () => res(reader.result as string)
          reader.onerror = () => rej(new Error('Erro ao ler arquivo'))
          reader.readAsText(f)
        })
        return parseCSVText(text)
      }

      if (name.endsWith('.xls') || name.endsWith('.xlsx')) {
        const data = await new Promise<Uint8Array>((res, rej) => {
          const reader = new FileReader()
          reader.onload = () => res(new Uint8Array(reader.result as ArrayBuffer))
          reader.onerror = () => rej(new Error('Erro ao ler arquivo'))
          reader.readAsArrayBuffer(f)
        })
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const arr = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets[sheetName], { header: 1, defval: '' })
        let headerIdx = -1
        for (let i = 0; i < arr.length; i++) {
          const row = arr[i]
          if (!row) continue
          const cells = row.map((c: any) => String(c).trim())
          if (cells.length >= 2 && cells.every((c: string) => c.length > 0)) {
            headerIdx = i
            break
          }
        }
        if (headerIdx === -1) headerIdx = 0
        const heads = (arr[headerIdx] || []).map((h: any) => String(h).trim())
        const dataRows = arr.slice(headerIdx + 1).filter(r => r && r.some((c: any) => String(c).trim().length > 0))
        const json = dataRows.map(row => {
          const obj: Row = {}
          heads.forEach((h, i) => (obj[h] = String(row[i] ?? '').trim()))
          return obj
        })
        return { heads, rows: json }
      }

      throw new Error('Formato de arquivo não suportado. Use CSV, TXT, XLS ou XLSX.')
    }

    function parseCSVText(text: string) {
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
      if (lines.length === 0) return { heads: [], rows: [] }
      const sample = lines.slice(0, 5)
      const delimiter = sample.find(l => l.includes(';')) ? ';' : sample.find(l => l.includes('\t')) ? '\t' : ','

      let headerIdx = -1
      for (let i = 0; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map(c => c.trim())
        if (cols.length >= 2 && cols.every(c => c.length > 0)) {
          headerIdx = i
          break
        }
      }
      if (headerIdx === -1) headerIdx = 0

      const heads = lines[headerIdx].split(delimiter).map(h => h.trim())
      const dataLines = lines.slice(headerIdx + 1)
      const rows = dataLines.map(line => {
        const cols = line.split(delimiter).map(c => c.trim())
        const obj: Row = {}
        heads.forEach((h, i) => (obj[h] = cols[i] ?? ''))
        return obj
      })
      return { heads, rows }
    }

    function headersEqual(a: string[], b: string[]) {
      if (a.length !== b.length) return false
      const na = a.map(s => s.trim().toLowerCase())
      const nb = b.map(s => s.trim().toLowerCase())
      return na.every((v, i) => v === nb[i])
    }

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
      // Sucess message removed - no alert needed
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

  function updateCell(rIdx: number, key: string, value: string) {
    setRows(prev => prev.map((r, i) => (i === rIdx ? { ...r, [key]: value } : r)))
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
    // Reset column selections if they were using the deleted column
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
    // Update column selections if they were using the renamed column
    if (phoneColumn === oldName) setPhoneColumn(newName)
    if (emailColumn === oldName) setEmailColumn(newName)
    if (fileColumn === oldName) setFileColumn(newName)
    setEditingColumn(null)
    setNewColumnName('')
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

  function startManualCreate() {
    // if no headers yet, show header input first
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
    // prepare manual row
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

  function detectContactField() {
    const candidates = ['phone', 'telefone', 'celular', 'contact', 'contato', 'email', 'e-mail']
    for (const h of headers) {
      if (candidates.includes(h.toLowerCase())) return h
    }
    return headers[0]
  }

  function formatBytes(bytes: number) {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  async function handleSend() {
    console.log('[DEBUG] ========== INÍCIO DO ENVIO DE MENSAGENS ==========')
    console.log('[DEBUG] Canal selecionado:', channel)
    console.log('[DEBUG] Número de linhas:', rows.length)
    console.log('[DEBUG] Anexos selecionados:', attachments.length, attachments.map(f => f.name))
    console.log('[DEBUG] includeAttachments:', includeAttachments)
    console.log('[DEBUG] attachToAll:', attachToAll)
    console.log('[DEBUG] fileColumn:', fileColumn)
    
    if (rows.length === 0) {
      setErrorModal({ title: 'Sem dados', message: 'Nenhum destinatário carregado.' })
      return
    }
    
    // Determine which contact column to use based on channel
    const contactColumn = channel === 'whatsapp' ? phoneColumn : channel === 'email' ? emailColumn : ''
    console.log('[DEBUG] Coluna de contato determinada:', contactColumn)
    
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

    // Analyze attachment warnings in detail
    let unusedFiles: string[] = []
    let recipientsWithoutFile: Array<{ index: number; value: string }> = []
    let missingFilesForRecipients: Array<{ index: number; fileName: string }> = []

    // Only validate per-row attachments if NOT attaching all to everyone
    if (includeAttachments && fileColumn && !attachToAll) {
      // Normalize filenames (remove extension and arrows)
      const _normalize = (name: string): string => {
        if (!name) return ''
        let s = String(name).trim()
        // remove leading arrows
        s = s.replace(/^[\s\-→>»•]+/, '')
        s = s.trim()
        // remove common extensions
        s = s.replace(/\.(jpg|jpeg|png|gif|pdf|docx|doc|xlsx|xls|zip|txt)$/i, '')
        return s.toLowerCase()
      }

      // Build map of normalized filenames to original filenames
      const normalizedMap = new Map<string, string[]>()
      attachments.forEach(f => {
        const norm = _normalize(f.name)
        if (norm) {
          if (!normalizedMap.has(norm)) {
            normalizedMap.set(norm, [])
          }
          normalizedMap.get(norm)!.push(f.name)
        }
      })
      
      const filesReferencedSet = new Set<string>()
      
      // Analyze each row
      rows.forEach((row, index) => {
        const fileName = (row[fileColumn] || '').trim()
        
        if (!fileName) {
          // Row has no file specified
          recipientsWithoutFile.push({ 
            index, 
            value: row[contactColumn] || `Linha ${index + 1}`
          })
        } else {
          const normRef = _normalize(fileName)
          filesReferencedSet.add(normRef)
          
          // Check if the normalized reference exists in our map
          if (!normalizedMap.has(normRef)) {
            missingFilesForRecipients.push({ 
              index, 
              fileName 
            })
          }
        }
      })
      
      // Find unused files (files not referenced by any row)
      unusedFiles = attachments
        .map(f => f.name)
        .filter(name => {
          const norm = _normalize(name)
          return !filesReferencedSet.has(norm)
        })
    }

    // Show preview if there are any issues
    if (unusedFiles.length > 0 || recipientsWithoutFile.length > 0 || missingFilesForRecipients.length > 0) {
      setPreviewWarnings({
        unusedFiles,
        recipientsWithoutFile,
        missingFilesForRecipients
      })
      setShowAttachmentPreview(true)
      return
    }

    // Construct payload
    const payload: any = {
      channel,
      message,
      rows,
      contact_column: contactColumn,
      file_column: fileColumn || null,
      attach_to_all: attachToAll
    }

    // For email, add sender info and subject
    if (channel === 'email') {
      payload.subject = subject
      payload.email_sender = senderId
      payload.app_password = appPassword
    }

    // For WhatsApp, add phone number
    if (channel === 'whatsapp') {
      payload.phone_number = senderId
    }

    // Add attachment names to payload
    if (attachments.length > 0) {
      payload.attachment_names = attachments.map(f => f.name)
    }

    // Use FormData to attach files
    const form = new FormData()
    console.log('[DEBUG] Criando FormData...')
    form.append('payload', JSON.stringify(payload))
    console.log('[DEBUG] Payload adicionado ao FormData:', payload)
    
    console.log('[DEBUG] Adicionando anexos ao FormData...')
    console.log('[DEBUG] Número de anexos a adicionar:', attachments.length)
    attachments.forEach((f, idx) => {
      console.log(`[DEBUG] Adicionando anexo ${idx + 1}/${attachments.length}: ${f.name} (${f.size} bytes, tipo: ${f.type})`)
      form.append('files', f, f.name)
    })
    console.log('[DEBUG] Todos os anexos adicionados ao FormData')

    // Determine which endpoint to use based on channel
    const endpoint = channel === 'email' ? `${config.API_BASE}/send-email/` : `${config.API_BASE}/send-whatsapp/`
    console.log('[DEBUG] Endpoint determinado:', endpoint)

    try {
      console.log('[DEBUG] Iniciando requisição para /api/jobs/start/')
      const resp = await fetch(`${config.API_BASE}/jobs/start/`, { 
        method: 'POST', 
        body: form,
        headers: {
          'Authorization': `Token ${token}`
        }
      })
      console.log('[DEBUG] Resposta recebida do servidor:', resp.status, resp.statusText)
      
      if (!resp.ok) {
        const text = await resp.text()
        console.log('[DEBUG] Erro na resposta:', text)
        setErrorModal({ title: 'Erro ao iniciar envio', message: `Status ${resp.status}`, details: text })
        return
      }
      const data = await resp.json()
      console.log('[DEBUG] Job criado com sucesso:', data)
      setCurrentJobId(data.job_id)
      console.log('[DEBUG] Job ID armazenado:', data.job_id)
      // open modal automatically by setting job id
      setAppPassword('')
      setShowPasswordInput(false)
    } catch (err: any) {
      console.error('[DEBUG] Erro ao enviar requisição:', err)
      setErrorModal({ title: 'Erro de conexão', message: 'Erro ao conectar com o servidor', details: err?.message || String(err) })
    }
  }

  function exportCSV() {
    if (rows.length === 0) {
      alert('Sem dados para exportar.')
      return
    }
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${(r[h] ?? '').replaceAll('"', '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'recipients.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleSaveList() {
    // Placeholder: salvar lista será implementado posteriormente
    console.log('Salvar Lista - payload', { headers, rows })
    alert('Salvar Lista: configuração pendente. Veja console para payload.')
  }

  return (
    <div>
      <h2 className={`text-2xl font-semibold mb-4 ${currentTheme.accent}`}>Enviar Mensagens</h2>

      <div className={`mb-4 p-4 rounded ${currentTheme.bg} border ${currentTheme.border}`}>
        <label className="block text-sm font-medium mb-2">Upload de arquivo (CSV, TXT, XLSX)</label>
        <div className={"flex flex-wrap items-center gap-2"}>
          <input
            ref={fileInputRef}
            onChange={e => handleFiles(e.target.files)}
            type="file"
            multiple
            accept=".csv,.txt,.xls,.xlsx"
            className="hidden"
          />
          <button onClick={() => fileInputRef.current?.click()} className={`btn ${currentTheme.btnClass}`}>
            Selecionar arquivo(s)
          </button>
          <button onClick={startManualCreate} className={`btn ${currentTheme.btnClass}`}>
            Criar manualmente
          </button>
          <button onClick={() => { setHeaders([]); setRows([]); setCurrentPage(1) }} className="btn btn-ghost">
            Limpar
          </button>
          {rows.length > 0 && (
            <button onClick={() => handleSaveList()} className={`btn ${currentTheme.btnClass}`}>
              Salvar Lista
            </button>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-2">Você pode selecionar múltiplos arquivos ao mesmo tempo; eles serão combinados apenas se os cabeçalhos forem idênticos.</div>


      </div>

      {showManual && (
          <div className={`mb-4 p-4 ${currentTheme.bg} border ${currentTheme.border} rounded`}>
            {headers.length === 0 ? (
              <div>
                <div className="text-sm text-slate-600 mb-2">Definir cabeçalhos (separados por vírgula):</div>
                <div className="flex gap-2">
                  <input value={headerInput} onChange={e => setHeaderInput(e.target.value)} className="input w-full" placeholder="Nome, Celular, Email" />
                  <button onClick={applyHeadersFromInput} className={`btn ${currentTheme.btnClass}`}>Definir</button>
                  <button onClick={() => { setShowManual(false); setManualRow(headers.reduce((a, h) => ({ ...a, [h]: '' }), {})) }} className="btn btn-ghost">Cancelar</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm font-medium mb-2">Adicionar destinatário manualmente</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {headers.map(h => (
                    <div key={h}>
                      <div className="text-xs text-slate-500">{h}</div>
                      <input value={manualRow[h] ?? ''} onChange={e => handleManualChange(h, e.target.value)} className="input w-full" />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={addManualRow} className={`btn ${currentTheme.btnClass}`}>Adicionar</button>
                  <button onClick={() => { setShowManual(false); setManualRow(headers.reduce((a, h) => ({ ...a, [h]: '' }), {})) }} className="btn btn-ghost">Cancelar</button>
                </div>
              </div>
            )}
          </div>
        )}

      <div className={`mb-4 p-4 rounded ${currentTheme.bg} border ${currentTheme.border}`}>
        <h3 className="font-medium mb-2">Visualização / Edição de dados</h3>
        {rows.length === 0 ? (
          <div className="text-slate-500">Nenhum dado carregado. Faça upload de um arquivo para visualizar ou crie manualmente.</div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div>Mostrando <strong>{Math.min(rows.length, startIndex + 1)}</strong> - <strong>{Math.min(rows.length, startIndex + pageSize)}</strong> de <strong>{rows.length}</strong></div>
                <div className="ml-4">| Página <strong>{currentPage}</strong> / <strong>{totalPages}</strong></div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-600">Por página:</label>
                <select value={pageSize} onChange={e => changePageSize(Number(e.target.value))} className="input">
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
                                onClick={() => {
                                  setEditingColumn(h)
                                  setNewColumnName(h)
                                }}
                                title="Editar coluna"
                                className="text-slate-400 hover:text-blue-600 p-1"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => removeColumn(h)}
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
                                onChange={e => updateCell(globalIndex, h, e.target.value)}
                                className="input w-full"
                              />
                            </td>
                          ))}
                          <td className="p-2">
                            <button onClick={() => removeRow(globalIndex)} className="text-sm text-red-600 hover:underline">Remover</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="mt-3">
                  <button onClick={addRow} className={`btn ${currentTheme.btnClass} mr-2`}>Adicionar linha</button>
                  <button onClick={() => setShowAddColumnModal(true)} className={`btn ${currentTheme.btnClass}`}>Adicionar coluna</button>
                </div>

                <div className="text-sm text-slate-600">Ir para página:
                  <input type="number" min={1} max={totalPages} value={currentPage} onChange={e => setCurrentPage(Math.min(Math.max(1, Number(e.target.value || 1)), totalPages))} className="input w-20 ml-2" />
                </div>
              
                <div className="flex items-center gap-2">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="btn btn-ghost">Anterior</button>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="btn btn-ghost">Próxima</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      

      {/* {includeAttachments && ( */}
        <div className={`mb-4 p-4 rounded ${currentTheme.bg} border ${currentTheme.border}`}>
          {/* Hidden file input triggered by the large button/dropzone */}
          <input ref={el => (attachmentInputRef.current = el)} type="file" multiple onChange={e => handleAttachmentFiles(e.target.files)} className="hidden" />

          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleAttachmentFiles(e.dataTransfer?.files ?? null) }}
            className={`border-dashed border-2 rounded p-4 flex items-center justify-between gap-3 ${currentTheme.border}`}
          >
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h6l6 6v3a4 4 0 01-4 4H7z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v6m0 0l-3-3m3 3l3-3" />
              </svg>
              <div>
                <div className="font-medium">Adicionar anexos</div>
                <div className="text-xs text-slate-500">Arraste aqui ou <button onClick={() => attachmentInputRef.current?.click()} className={`underline ${currentTheme.accent}`}>selecione arquivos</button></div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {attachments.length > 0 && (
                <div className="text-sm text-slate-600">{attachments.length} arquivo(s) • {formatBytes(attachments.reduce((s,f) => s + f.size, 0))}</div>
              )}
              <button onClick={() => attachmentInputRef.current?.click()} className={`btn ${currentTheme.btnClass}`}>Adicionar</button>
              {attachments.length > 0 && (
                <button onClick={() => setAttachments([])} className="btn btn-ghost text-red-600">Limpar tudo</button>
              )}
            </div>
          </div>

          {attachments.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium mb-1">Anexos</div>
              <ul className="text-sm">
                {attachments.map((f, idx) => (
                  <li key={idx} className="flex items-center justify-between py-1">
                    <span>{f.name} ({formatBytes(f.size)})</span>
                    <div className="flex gap-2">
                      <button onClick={() => removeAttachment(idx)} className="text-xs text-red-600 hover:underline">Remover</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={`mt-3 rounded`}>
            <div className="text-sm font-medium mb-2">Vincular arquivos à:</div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <select value={fileColumn} onChange={e => {
                  setFileColumn(e.target.value)
                  setAttachToAll(e.target.value === '')
                }} className="input w-full">
                  <option value="">Nenhuma coluna (enviar os mesmos para todos)</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
            <div className="text-xs text-slate-500 mt-2">Se selecionar uma coluna, cada destinatário receberá apenas os anexos cujo nome coincida com o valor da coluna. Ex: coluna “Arquivo” com valor “fatura.pdf” enviará apenas fatura.pdf.</div>
          </div>
        </div>
      {/* )} */}

      {/* <div className={`mb-4 p-4 rounded ${currentTheme.bg} border ${currentTheme.border} flex items-center justify-between`}>
        <div>
          <button onClick={() => setIncludeAttachments(v => !v)} className={`btn ${includeAttachments ? currentTheme.btnClass : 'btn-ghost'} inline-flex items-center gap-2`}> 
            {includeAttachments ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h7a2 2 0 012 2v8a3 3 0 11-6 0H4a2 2 0 01-2-2V6z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7a4 4 0 014-4h6l4 4v4a4 4 0 01-4 4H7a4 4 0 01-4-4V7z"/></svg>
            )}
            <span>Incluir anexos</span>
            {attachments.length > 0 && includeAttachments && <span className="ml-2 px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-700">{attachments.length} • {formatBytes(attachments.reduce((s,f) => s + f.size, 0))}</span>}
          </button>
        </div>
        <div className="text-sm text-slate-500">Ative para enviar anexos por destinatário (mapeamento por coluna disponível)</div>
      </div> */}

      <div className={`mb-4 p-4 rounded ${currentTheme.bg} border ${currentTheme.border}`}>
        <h3 className="font-medium mb-2">Mensagem</h3> 
        <p className="text-sm text-slate-500 mb-2">Use placeholders baseados nos cabeçalhos: {headers.map(h => <button key={h} onClick={() => insertPlaceholder(h)} className={`ml-2 ${currentTheme.accent} hover:underline text-sm`}>{'{' + h + '}'}</button>)}</p>
        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} className="input w-full"></textarea>

        
      </div>

      <div className="mb-4 space-y-3">
        {/* Contact column selection based on channel */}
        {headers.length > 0 && (
          <div className={`mb-4 p-4 rounded ${currentTheme.bg} border ${currentTheme.border}`}>
            <div className="text-sm font-medium mb-2">
              {channel === 'whatsapp' ? '📱 Coluna de Número' : channel === 'email' ? '📧 Coluna de Email' : '❓ Coluna de Contato'}
            </div>
            <select
              value={channel === 'whatsapp' ? phoneColumn : emailColumn}
              onChange={e => {
                if (channel === 'whatsapp') {
                  setPhoneColumn(e.target.value)
                } else {
                  setEmailColumn(e.target.value)
                }
              }}
              className="input w-full"
            >
              <option value="">Selecione a coluna...</option>
              {headers.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <div className="text-xs text-slate-500 mt-2">
              {channel === 'whatsapp'
                ? 'Selecione qual coluna contém o número de telefone dos destinatários.'
                : 'Selecione qual coluna contém o email dos destinatários.'}
            </div>
          </div>
        )}

        {/* Email configuration section */}
        {channel === 'email' && (
          <div className="p-4 rounded bg-red-50 border border-red-200 space-y-3">

            <div>
              <div className="text-sm font-medium mb-1">📧 Email Remetente</div>
              <input 
                type="email"
                value={senderId} 
                onChange={e => setSenderId(e.target.value)} 
                placeholder="seu.email@gmail.com"
                className="input w-full" 
              />
              <div className="text-xs text-slate-500 mt-1">
                Email do Gmail que será usado como remetente dos mensagens
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-1">Senha de App Gmail</div>
              <div className="flex gap-2">
                <input 
                  type={showPasswordInput ? 'text' : 'password'} 
                  value={appPassword} 
                  onChange={e => setAppPassword(e.target.value)} 
                  placeholder="Informe sua senha de app do Gmail"
                  className="input flex-1" 
                />
                <button 
                  onClick={() => setShowPasswordInput(!showPasswordInput)}
                  className="btn btn-ghost"
                  title={showPasswordInput ? 'Ocultar' : 'Mostrar'}
                >
                  {showPasswordInput ? '🙈' : '👁️'}
                </button>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Gere em: <a href="https://myaccount.google.com/apppasswords" target="_blank" className="text-red-600 hover:underline">Google App Passwords</a>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-1">Assunto</div>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Assunto do email" className="input w-full" />
            </div>
          </div>
        )}

        {/* WhatsApp configuration section */}
        {channel === 'whatsapp' && (
          <div className="p-4 rounded bg-green-50 border border-green-200 space-y-3">
            <div>
              <div className="text-sm font-medium mb-1">📱 Número Remetente (WhatsApp)</div>
              <input 
                type="tel"
                value={senderId} 
                onChange={e => setSenderId(e.target.value)} 
                placeholder="5541999999999"
                className="input w-full" 
              />
              <div className="text-xs text-slate-500 mt-1">
                Número do WhatsApp que será usado como remetente (formato: 55 + DDD + número)
              </div>
            </div>
          </div>
        )}

        {/* Channel selection and Send button */}
        <div className={`p-4 rounded flex items-end justify-between ${currentTheme.bg} border ${currentTheme.border}`}>
          <div>
            <div className="text-sm font-medium mb-1">Canal</div>
            <div className="flex gap-2">
              <label className={`btn ${channel === 'whatsapp' ? 'btn-success' : 'btn-ghost'}`}>
                <input className="hidden" type="radio" name="channel" checked={channel === 'whatsapp'} onChange={() => setChannel('whatsapp')} /> WhatsApp
              </label>
              <label className={`btn ${channel === 'email' ? 'btn-danger' : 'btn-ghost'}`}>
                <input className="hidden" type="radio" name="channel" checked={channel === 'email'} onChange={() => setChannel('email')} /> Email
              </label>
            </div>
          </div>

          <button onClick={handleSend} className={`btn btn-lg py-3 px-8 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition ${channel === 'whatsapp' ? 'bg-green-600 hover:bg-green-700' : channel === 'email' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            Enviar
          </button>
        </div>
      </div>

      {/* Modal de Avisos de Anexos - Versão Melhorada */}
      {showAttachmentPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-2xl font-bold">Problemas com Anexos Detectados</h3>
            </div>

            <div className="space-y-4">
              {/* Arquivos não utilizados */}
              {previewWarnings.unusedFiles.length > 0 && (
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">📄</span>
                    <div className="font-bold text-yellow-900">
                      Arquivos não utilizados ({previewWarnings.unusedFiles.length})
                    </div>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">
                    Os seguintes arquivos não combinam com nenhuma linha no mapeamento e <span className="font-semibold">NÃO serão enviados</span>:
                  </p>
                  <div className="bg-white rounded p-3 max-h-40 overflow-y-auto">
                    <ul className="space-y-2">
                      {previewWarnings.unusedFiles.map((file, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-yellow-800">
                          <span className="text-yellow-600 mt-0.5">→</span>
                          <span>{file}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Destinatários sem arquivo */}
              {previewWarnings.recipientsWithoutFile.length > 0 && (
                <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">👤</span>
                    <div className="font-bold text-blue-900">
                      Destinatários sem arquivo ({previewWarnings.recipientsWithoutFile.length})
                    </div>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    Os seguintes destinatários não têm nenhum arquivo especificado na coluna "{fileColumn}":
                  </p>
                  <div className="bg-white rounded p-3 max-h-40 overflow-y-auto">
                    <ul className="space-y-2">
                      {previewWarnings.recipientsWithoutFile.slice(0, 10).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                          <span className="text-blue-600 mt-0.5">→</span>
                          <span>
                            <span className="font-medium">Linha {item.index + 1}</span>
                            {item.value && <span> ({item.value})</span>}
                          </span>
                        </li>
                      ))}
                      {previewWarnings.recipientsWithoutFile.length > 10 && (
                        <li className="text-sm text-blue-600 italic">
                          ... e mais {previewWarnings.recipientsWithoutFile.length - 10}
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Arquivos faltando para recipientes */}
              {previewWarnings.missingFilesForRecipients.length > 0 && (
                <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🔴</span>
                    <div className="font-bold text-red-900">
                      Arquivo(s) não encontrado(s) ({previewWarnings.missingFilesForRecipients.length})
                    </div>
                  </div>
                  <p className="text-sm text-red-700 mb-3">
                    Os seguintes destinatários referenciam arquivos que não foram anexados:
                  </p>
                  <div className="bg-white rounded p-3 max-h-40 overflow-y-auto">
                    <ul className="space-y-2">
                      {previewWarnings.missingFilesForRecipients.slice(0, 10).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-red-800">
                          <span className="text-red-600 mt-0.5">→</span>
                          <span>
                            <span className="font-medium">Linha {item.index + 1}</span>
                            <span className="text-red-600"> requer "{item.fileName}"</span>
                          </span>
                        </li>
                      ))}
                      {previewWarnings.missingFilesForRecipients.length > 10 && (
                        <li className="text-sm text-red-600 italic">
                          ... e mais {previewWarnings.missingFilesForRecipients.length - 10}
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Resumo */}
            <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200">
              <div className="font-semibold text-gray-900 mb-2">📊 Resumo:</div>
              <div className="text-sm text-gray-700 space-y-1">
                {previewWarnings.unusedFiles.length > 0 && (
                  <div>• {previewWarnings.unusedFiles.length} arquivo(s) não será(ão) enviado(s)</div>
                )}
                {previewWarnings.recipientsWithoutFile.length > 0 && (
                  <div>• {previewWarnings.recipientsWithoutFile.length} destinatário(s) sem anexo</div>
                )}
                {previewWarnings.missingFilesForRecipients.length > 0 && (
                  <div>• {previewWarnings.missingFilesForRecipients.length} destinatário(s) com arquivo(s) faltando</div>
                )}
              </div>
            </div>

            {/* Botões */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowAttachmentPreview(false)
                  // Proceed with send
                  const contactColumn = channel === 'whatsapp' ? phoneColumn : channel === 'email' ? emailColumn : ''
                  const payload: any = {
                    channel,
                    message,
                    rows,
                    contact_column: contactColumn,
                    file_column: fileColumn || null,
                    attach_to_all: attachToAll
                  }
                  
                  // Add channel-specific fields
                  if (channel === 'email') {
                    payload.subject = subject
                    payload.email_sender = senderId
                    payload.app_password = appPassword
                  } else if (channel === 'whatsapp') {
                    payload.phone_number = senderId
                  }

                  // Add attachment names to payload
                  if (attachments.length > 0) {
                    payload.attachment_names = attachments.map(f => f.name)
                  }
                  
                  const form = new FormData()
                  form.append('payload', JSON.stringify(payload))
                  attachments.forEach(f => form.append('files', f, f.name))
                  
                  fetch(`${config.API_BASE}/jobs/start/`, { 
                    method: 'POST', 
                    body: form,
                    headers: {
                      'Authorization': `Token ${token}`
                    }
                  })
                    .then(resp => {
                      if (!resp.ok) {
                        return resp.text().then(text => {
                          alert(`Erro ao iniciar job: ${resp.status} - ${text}`)
                        })
                      }
                      return resp.json().then(data => {
                        console.log('Job iniciado:', data)
                        setCurrentJobId(data.job_id)
                      })
                    })
                    .catch((err: any) => {
                      console.error(err)
                      alert('Erro ao conectar com o servidor: ' + (err?.message || err))
                    })
                }}
                className="flex-1 btn bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                ✓ Continuar mesmo assim
              </button>
              <button
                onClick={() => setShowAttachmentPreview(false)}
                className="flex-1 btn bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold"
              >
                ✕ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Adição de Coluna */}
      {showAddColumnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Adicionar Nova Coluna</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Nome da coluna</label>
              <input
                type="text"
                value={newColumnInput}
                onChange={e => setNewColumnInput(e.target.value)}
                placeholder="Ex: Email, Telefone, Cargo..."
                className="input w-full"
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    addColumn(newColumnInput)
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => addColumn(newColumnInput)}
                className={`btn ${currentTheme.btnClass}`}
              >
                Adicionar
              </button>
              <button
                onClick={() => {
                  setShowAddColumnModal(false)
                  setNewColumnInput('')
                }}
                className="btn btn-ghost"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Coluna */}
      {editingColumn && (
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
                onChange={e => setNewColumnName(e.target.value)}
                placeholder="Digite o novo nome..."
                className="input w-full"
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    renameColumn(editingColumn, newColumnName)
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => renameColumn(editingColumn, newColumnName)}
                className={`btn ${currentTheme.btnClass}`}
              >
                Renomear
              </button>
              <button
                onClick={() => {
                  setEditingColumn(null)
                  setNewColumnName('')
                }}
                className={`btn ${currentTheme.btnGhostClass}`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress modal */}
      {currentJobId && (
        <SendProgressModal jobId={currentJobId} token={token} onClose={() => setCurrentJobId(null)} />
      )}
    </div>
  )
}
