export const CREW_MEMBERS = [
  { id: 'aaron-f', name: 'Aaron F' },
  { id: 'miguel-r', name: 'Miguel R' },
  { id: 'carlos-m', name: 'Carlos M' },
  { id: 'jose-l', name: 'Jose L' },
  { id: 'david-t', name: 'David T' },
  { id: 'marco-s', name: 'Marco S' },
  { id: 'luis-g', name: 'Luis G' },
  { id: 'chris-p', name: 'Chris P' },
]

export const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => {
  const hour = i + 7 // 7 AM to 6 PM
  const ampm = hour < 12 ? 'AM' : 'PM'
  const displayHour = hour <= 12 ? hour : hour - 12
  return {
    label: `${displayHour}:00 ${ampm}`,
    value: `${String(hour).padStart(2, '0')}:00`,
    hour,
  }
})

export const JOB_STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'complete', label: 'Complete' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const STATUS_COLORS = {
  scheduled: {
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    text: 'text-blue-800',
    dot: 'bg-blue-500',
  },
  in_progress: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-300',
    text: 'text-yellow-800',
    dot: 'bg-yellow-500',
  },
  complete: {
    bg: 'bg-green-100',
    border: 'border-green-300',
    text: 'text-green-800',
    dot: 'bg-green-500',
  },
  cancelled: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-500',
    dot: 'bg-gray-400',
  },
}
