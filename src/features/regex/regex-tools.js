function append(segments, type, text) {
  if (!text) return
  const previous = segments[segments.length - 1]
  if (previous?.type === type) previous.text += text
  else segments.push({ type, text })
}

export function testRegex(pattern, flags, text) {
  if (!pattern) return { valid: false, error: 'Введите регулярное выражение.' }

  let expression
  try {
    const searchFlags = flags.includes('g') ? flags : `${flags}g`
    expression = new RegExp(pattern, searchFlags)
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : String(error) }
  }

  const segments = []
  const matches = []
  let cursor = 0
  let match

  while ((match = expression.exec(text)) !== null) {
    append(segments, 'plain', text.slice(cursor, match.index))
    append(segments, 'match', match[0])
    matches.push({ value: match[0], index: match.index, groups: match.slice(1) })
    cursor = match.index + match[0].length

    if (match[0] === '') {
      expression.lastIndex += 1
      cursor = match.index
    }
    if (matches.length >= 10_000) break
  }

  append(segments, 'plain', text.slice(cursor))
  return { valid: true, segments, matches }
}
