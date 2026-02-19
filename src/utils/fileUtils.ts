import * as XLSX from 'xlsx'

export type Row = Record<string, string>

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function headersEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const na = a.map(s => s.trim().toLowerCase())
  const nb = b.map(s => s.trim().toLowerCase())
  return na.every((v, i) => v === nb[i])
}

export function parseCSVText(text: string): { heads: string[]; rows: Row[] } {
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

export async function parseFile(file: File): Promise<{ heads: string[]; rows: Row[] }> {
  const name = file.name.toLowerCase()
  
  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    const text = await new Promise<string>((res, rej) => {
      const reader = new FileReader()
      reader.onload = () => res(reader.result as string)
      reader.onerror = () => rej(new Error('Erro ao ler arquivo'))
      reader.readAsText(file)
    })
    return parseCSVText(text)
  }

  if (name.endsWith('.xls') || name.endsWith('.xlsx')) {
    const data = await new Promise<Uint8Array>((res, rej) => {
      const reader = new FileReader()
      reader.onload = () => res(new Uint8Array(reader.result as ArrayBuffer))
      reader.onerror = () => rej(new Error('Erro ao ler arquivo'))
      reader.readAsArrayBuffer(file)
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

export function exportToCSV(headers: string[], rows: Row[]): void {
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
