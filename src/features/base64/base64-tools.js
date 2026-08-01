function bytesToBinary(bytes) {
  const chunkSize = 0x8000
  let binary = ''
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return binary
}

export function encodeBase64(value) {
  return btoa(bytesToBinary(new TextEncoder().encode(value)))
}

export function decodeBase64(value) {
  const compact = value.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/')
  if (!compact || /[^A-Za-z0-9+/=]/.test(compact)) throw new Error('Строка содержит недопустимые Base64-символы.')

  const paddingLength = (4 - (compact.length % 4)) % 4
  const normalized = compact + '='.repeat(paddingLength)
  let binary
  try {
    binary = atob(normalized)
  } catch {
    throw new Error('Не удалось декодировать Base64-строку.')
  }

  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw new Error('Результат не является корректным UTF-8 текстом.')
  }
}
