function randomBytes(length) {
  const bytes = new Uint8Array(length)
  globalThis.crypto.getRandomValues(bytes)
  return bytes
}

function randomCharacter(characters) {
  return characters[randomBytes(1)[0] % characters.length]
}

export function generateUuidV4() {
  if (typeof globalThis.crypto.randomUUID === 'function') return globalThis.crypto.randomUUID()

  const bytes = randomBytes(16)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function generateToken(byteLength = 24) {
  return [...randomBytes(byteLength)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function generatePassword(length = 20) {
  const safeLength = Math.min(128, Math.max(8, Number(length) || 20))
  const groups = [
    'ABCDEFGHJKLMNPQRSTUVWXYZ',
    'abcdefghijkmnopqrstuvwxyz',
    '23456789',
    '!@#$%&*+-=?',
  ]
  const allCharacters = groups.join('')
  const password = groups.map(randomCharacter)

  while (password.length < safeLength) password.push(randomCharacter(allCharacters))

  const shuffleBytes = randomBytes(password.length)
  for (let index = password.length - 1; index > 0; index -= 1) {
    const target = shuffleBytes[index] % (index + 1)
    ;[password[index], password[target]] = [password[target], password[index]]
  }

  return password.join('')
}

export function getTimestamps(date = new Date()) {
  return {
    seconds: Math.floor(date.getTime() / 1000),
    milliseconds: date.getTime(),
    iso: date.toISOString(),
  }
}

export function formatDateTimeLocal(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
    ':',
    pad(date.getSeconds()),
  ].join('')
}

export function timestampToDateTime(value) {
  const numericValue = Number(String(value).trim())
  if (!Number.isFinite(numericValue)) throw new Error('Введите корректный timestamp.')

  const milliseconds = Math.abs(numericValue) < 1e11 ? numericValue * 1000 : numericValue
  const date = new Date(milliseconds)
  if (Number.isNaN(date.getTime())) throw new Error('Timestamp находится вне допустимого диапазона.')

  return {
    local: date.toLocaleString('ru-RU'),
    localInput: formatDateTimeLocal(date),
    iso: date.toISOString(),
    seconds: Math.floor(date.getTime() / 1000),
    milliseconds: date.getTime(),
  }
}

export function dateTimeToTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error('Введите корректные дату и время.')
  return {
    seconds: Math.floor(date.getTime() / 1000),
    milliseconds: date.getTime(),
    iso: date.toISOString(),
  }
}
