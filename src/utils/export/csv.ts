export type CsvCell = string | number | boolean | null | undefined

/** Only pass explicitly selected display fields; never serialize whole business records. */
export function serializeCsv(headers: string[], rows: CsvCell[][]): string {
  const escape = (value: CsvCell): string => {
    let text = value == null ? '' : String(value)
    // Quoting alone does not prevent spreadsheet formula execution.
    if (typeof value === 'string' && (/^\s*[=+@-]/.test(text) || /^[\t\r\n]/.test(text))) {
      text = `'${text}`
    }
    return `"${text.replaceAll('"', '""')}"`
  }
  if (rows.some((row) => row.length !== headers.length)) {
    throw new Error('CSV 欄位數不一致')
  }
  return '\uFEFF' + [headers, ...rows].map((row) => row.map(escape).join(',')).join('\r\n')
}

export function downloadCsv(filename: string, headers: string[], rows: CsvCell[][]): void {
  const content = serializeCsv(headers, rows)
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  try {
    link.href = url
    const safeName = Array.from(filename, (char) =>
      char.charCodeAt(0) < 32 || /[\\/:*?"<>|]/.test(char) ? '_' : char
    ).join('')
    link.download = `${safeName}.csv`
    document.body.appendChild(link)
    link.click()
  } finally {
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
