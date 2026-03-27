export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatDateShort(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function toISODateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromISODateString(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function formatTime12(timeStr) {
  if (!timeStr) return ''
  const [hourStr, minStr] = timeStr.split(':')
  const hour = parseInt(hourStr)
  const min = minStr || '00'
  const ampm = hour < 12 ? 'AM' : 'PM'
  const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${h}:${min} ${ampm}`
}

export function addOneHour(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const newH = Math.min(h + 1, 23)
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
