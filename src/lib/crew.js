const STORAGE_KEY = 'acc_crew'

const DEFAULT_CREW = [
  { id: 'aaron-f', name: 'Aaron F', active: true },
  { id: 'miguel-r', name: 'Miguel R', active: true },
  { id: 'carlos-m', name: 'Carlos M', active: true },
  { id: 'jose-l', name: 'Jose L', active: true },
  { id: 'david-t', name: 'David T', active: true },
  { id: 'marco-s', name: 'Marco S', active: true },
  { id: 'luis-g', name: 'Luis G', active: true },
  { id: 'chris-p', name: 'Chris P', active: true },
]

export function getCrew() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    // ignore
  }
  return DEFAULT_CREW
}

export function saveCrew(crew) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(crew))
}

export function getActiveCrew() {
  return getCrew().filter(c => c.active)
}

function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function addCrewMember(name) {
  const crew = getCrew()
  const id = slugify(name) + '-' + Date.now()
  const updated = [...crew, { id, name: name.trim(), active: true }]
  saveCrew(updated)
  return updated
}

export function deleteCrewMember(id) {
  const updated = getCrew().filter(c => c.id !== id)
  saveCrew(updated)
  return updated
}

export function toggleCrewMember(id) {
  const updated = getCrew().map(c => c.id === id ? { ...c, active: !c.active } : c)
  saveCrew(updated)
  return updated
}
