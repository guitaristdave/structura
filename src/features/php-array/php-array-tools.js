function escapePhpString(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function formatPhpValue(value, level = 0) {
  const indent = '  '.repeat(level)
  const childIndent = '  '.repeat(level + 1)

  if (value === null) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return `'${escapePhpString(value)}'`

  if (Array.isArray(value)) {
    if (!value.length) return '[]'
    const entries = value.map((item) => `${childIndent}${formatPhpValue(item, level + 1)},`)
    return `[\n${entries.join('\n')}\n${indent}]`
  }

  const entries = Object.entries(value)
  if (!entries.length) return '[]'
  const formatted = entries.map(
    ([key, item]) => `${childIndent}'${escapePhpString(key)}' => ${formatPhpValue(item, level + 1)},`,
  )
  return `[\n${formatted.join('\n')}\n${indent}]`
}

export function jsonToPhp(input) {
  try {
    return {
      valid: true,
      output: `<?php\n\nreturn ${formatPhpValue(JSON.parse(input))};`,
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

class PhpArrayParser {
  constructor(input) {
    this.input = input
    this.index = 0
  }

  fail(message, offset = this.index) {
    const before = this.input.slice(0, offset)
    const line = before.split('\n').length
    const lineStart = this.input.lastIndexOf('\n', Math.max(0, offset - 1)) + 1
    throw { message, offset, line, column: offset - lineStart + 1 }
  }

  skipIgnored() {
    while (this.index < this.input.length) {
      if (/[ \t\r\n]/.test(this.input[this.index])) {
        this.index += 1
        continue
      }
      if (this.input.startsWith('//', this.index) || this.input[this.index] === '#') {
        while (this.index < this.input.length && this.input[this.index] !== '\n') this.index += 1
        continue
      }
      if (this.input.startsWith('/*', this.index)) {
        const end = this.input.indexOf('*/', this.index + 2)
        if (end === -1) this.fail('Комментарий не закрыт.')
        this.index = end + 2
        continue
      }
      break
    }
  }

  isWord(word) {
    if (this.input.slice(this.index, this.index + word.length).toLowerCase() !== word) return false
    const next = this.input[this.index + word.length]
    return !next || !/[\w$]/.test(next)
  }

  consumeWord(word) {
    if (!this.isWord(word)) this.fail(`Ожидалось «${word}».`)
    this.index += word.length
  }

  parse() {
    this.skipIgnored()
    if (this.input.startsWith('<?php', this.index)) this.index += 5
    this.skipIgnored()
    if (this.isWord('return')) this.consumeWord('return')
    this.skipIgnored()

    const value = this.parseValue()
    this.skipIgnored()
    if (this.input[this.index] === ';') this.index += 1
    this.skipIgnored()
    if (this.input.startsWith('?>', this.index)) this.index += 2
    this.skipIgnored()
    if (this.index < this.input.length) this.fail('После массива найдены лишние символы.')
    return value
  }

  parseValue() {
    this.skipIgnored()
    const char = this.input[this.index]

    if (char === '[') {
      this.index += 1
      return this.parseEntries(']')
    }
    if (this.isWord('array')) {
      this.consumeWord('array')
      this.skipIgnored()
      if (this.input[this.index] !== '(') this.fail('После array ожидалась открывающая скобка.')
      this.index += 1
      return this.parseEntries(')')
    }
    if (char === "'" || char === '"') return this.parseString()
    if (char === '-' || /\d/.test(char ?? '')) return this.parseNumber()
    if (this.isWord('true')) {
      this.consumeWord('true')
      return true
    }
    if (this.isWord('false')) {
      this.consumeWord('false')
      return false
    }
    if (this.isWord('null')) {
      this.consumeWord('null')
      return null
    }

    this.fail(char ? `Неожиданный символ «${char}».` : 'PHP-массив неожиданно оборвался.')
  }

  parseString() {
    const quote = this.input[this.index]
    let output = ''
    this.index += 1

    while (this.index < this.input.length) {
      const char = this.input[this.index]
      if (char === quote) {
        this.index += 1
        return output
      }
      if (char === '\\') {
        const next = this.input[this.index + 1]
        if (next === undefined) this.fail('Строка неожиданно оборвалась.')
        if (quote === "'" && next !== "'" && next !== '\\') {
          output += `\\${next}`
        } else {
          const escapes = { n: '\n', r: '\r', t: '\t', '"': '"', "'": "'", '\\': '\\', $: '$' }
          output += escapes[next] ?? next
        }
        this.index += 2
        continue
      }
      output += char
      this.index += 1
    }

    this.fail('Строка не закрыта кавычкой.')
  }

  parseNumber() {
    const match = this.input.slice(this.index).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/)
    if (!match) this.fail('Некорректное число.')
    this.index += match[0].length
    return Number(match[0])
  }

  parseEntries(closingChar) {
    const entries = []
    let nextIndex = 0
    this.skipIgnored()

    if (this.input[this.index] === closingChar) {
      this.index += 1
      return []
    }

    while (this.index < this.input.length) {
      const firstValue = this.parseValue()
      this.skipIgnored()

      if (this.input.startsWith('=>', this.index)) {
        if (typeof firstValue !== 'string' && !Number.isInteger(firstValue)) {
          this.fail('Ключ PHP-массива должен быть строкой или целым числом.')
        }
        this.index += 2
        const value = this.parseValue()
        entries.push({ key: firstValue, value })
        if (Number.isInteger(firstValue) && firstValue >= nextIndex) nextIndex = firstValue + 1
      } else {
        entries.push({ key: nextIndex, value: firstValue })
        nextIndex += 1
      }

      this.skipIgnored()
      if (this.input[this.index] === closingChar) {
        this.index += 1
        return this.entriesToJson(entries)
      }
      if (this.input[this.index] !== ',') {
        this.fail(`Ожидалась запятая или закрывающая скобка «${closingChar}».`)
      }
      this.index += 1
      this.skipIgnored()
      if (this.input[this.index] === closingChar) {
        this.index += 1
        return this.entriesToJson(entries)
      }
    }

    this.fail(`Не хватает закрывающей скобки «${closingChar}».`)
  }

  entriesToJson(entries) {
    const isList = entries.every((entry, index) => entry.key === index)
    if (isList) return entries.map((entry) => entry.value)

    return Object.fromEntries(entries.map((entry) => [String(entry.key), entry.value]))
  }
}

export function phpToJson(input) {
  try {
    const value = new PhpArrayParser(input).parse()
    return { valid: true, value, output: JSON.stringify(value, null, 2) }
  } catch (error) {
    return {
      valid: false,
      error: {
        message: error?.message ?? 'Не удалось разобрать PHP-массив.',
        line: error?.line ?? 1,
        column: error?.column ?? 1,
      },
    }
  }
}
