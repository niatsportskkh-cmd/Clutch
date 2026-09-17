const cell = (v: unknown) => {
  let s = String(v ?? '')
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}` // spreadsheet formula injection guard
  return `"${s.replace(/"/g, '""')}"`
}

export const toCsv = (rows: unknown[][]) => rows.map(r => r.map(cell).join(',')).join('\r\n')
