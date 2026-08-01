const positionPatterns = [
  /position\s+(\d+)/i,
  /at\s+position\s+(\d+)/i,
  /at\s+character\s+(\d+)/i,
]

function offsetFromLineAndColumn(text, line, column) {
  const rows = text.split('\n')
  let offset = 0

  for (let index = 0; index < Math.max(0, line - 1); index += 1) {
    offset += (rows[index]?.length ?? 0) + 1
  }

  return offset + Math.max(0, column - 1)
}

function getErrorOffset(message, text) {
  for (const pattern of positionPatterns) {
    const match = message.match(pattern)
    if (match) return Number(match[1])
  }

  const lineMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i)
  if (lineMatch) {
    return offsetFromLineAndColumn(text, Number(lineMatch[1]), Number(lineMatch[2]))
  }

  if (/end of (json input|data)|unexpected end/i.test(message)) return text.length
  return 0
}

function getFriendlyMessage(message, offset, text) {
  if (!text.trim()) return 'Введите JSON, чтобы начать проверку.'
  if (/end of (json input|data)|unexpected end/i.test(message)) {
    return 'JSON обрывается раньше, чем заканчивается структура.'
  }
  if (/property name|double-quoted property/i.test(message)) {
    return 'Ожидалось имя свойства в двойных кавычках.'
  }
  if (/expected.*['"][:,}\]]|expected.*comma|after property value/i.test(message)) {
    return 'Проверьте разделитель рядом с этим местом.'
  }
  if (/bad control character/i.test(message)) {
    return 'В строке найден недопустимый управляющий символ.'
  }
  if (/unterminated string/i.test(message)) return 'Строка не закрыта двойной кавычкой.'

  const symbol = text[offset]
  if (symbol) return `Неожиданный символ «${symbol === '\n' ? 'перенос строки' : symbol}».`
  return 'JSON содержит синтаксическую ошибку.'
}

function findSyntaxError(text) {
  let index = 0

  const fail = (message, offset = index) => {
    throw { message, offset }
  }

  const skipWhitespace = () => {
    while (/[ \t\r\n]/.test(text[index] ?? '')) index += 1
  }

  const parseString = () => {
    index += 1
    while (index < text.length) {
      const char = text[index]
      if (char === '"') {
        index += 1
        return
      }
      if (char === '\\') {
        const escapeOffset = index
        index += 1
        const escaped = text[index]
        if (!'"\\/bfnrtu'.includes(escaped ?? '')) {
          fail('Недопустимая escape-последовательность в строке.', escapeOffset)
        }
        if (escaped === 'u') {
          const unicode = text.slice(index + 1, index + 5)
          if (!/^[\da-fA-F]{4}$/.test(unicode)) {
            fail('После \\u должны идти четыре шестнадцатеричных символа.', escapeOffset)
          }
          index += 4
        }
        index += 1
        continue
      }
      if (char.charCodeAt(0) < 0x20) fail('В строке найден недопустимый управляющий символ.')
      index += 1
    }
    fail('Строка не закрыта двойной кавычкой.', text.length)
  }

  const parseNumber = () => {
    const match = text.slice(index).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/)
    if (!match) fail('Некорректное число.')
    index += match[0].length
  }

  const parseLiteral = (literal) => {
    if (text.slice(index, index + literal.length) !== literal) {
      fail(`Ожидалось значение ${literal}.`)
    }
    index += literal.length
  }

  const parseValue = () => {
    skipWhitespace()
    const char = text[index]
    if (char === undefined) fail('JSON обрывается раньше, чем заканчивается структура.', text.length)
    if (char === '"') return parseString()
    if (char === '{') return parseObject()
    if (char === '[') return parseArray()
    if (char === 't') return parseLiteral('true')
    if (char === 'f') return parseLiteral('false')
    if (char === 'n') return parseLiteral('null')
    if (char === '-' || /\d/.test(char)) return parseNumber()
    fail(`Неожиданный символ «${char === '\n' ? 'перенос строки' : char}».`)
  }

  const parseObject = () => {
    index += 1
    skipWhitespace()
    if (text[index] === '}') {
      index += 1
      return
    }

    while (index < text.length) {
      if (text[index] !== '"') fail('Ожидалось имя свойства в двойных кавычках.')
      parseString()
      skipWhitespace()
      if (text[index] !== ':') fail('После имени свойства ожидалось двоеточие.')
      index += 1
      parseValue()
      skipWhitespace()
      if (text[index] === '}') {
        index += 1
        return
      }
      if (text[index] !== ',') fail('Ожидалась запятая или закрывающая скобка «}».')
      index += 1
      skipWhitespace()
      if (text[index] === '}') fail('Лишняя запятая перед закрывающей скобкой.')
    }
    fail('Не хватает закрывающей скобки «}».', text.length)
  }

  const parseArray = () => {
    index += 1
    skipWhitespace()
    if (text[index] === ']') {
      index += 1
      return
    }

    while (index < text.length) {
      parseValue()
      skipWhitespace()
      if (text[index] === ']') {
        index += 1
        return
      }
      if (text[index] !== ',') fail('Ожидалась запятая или закрывающая скобка «]».')
      index += 1
      skipWhitespace()
      if (text[index] === ']') fail('Лишняя запятая перед закрывающей скобкой.')
    }
    fail('Не хватает закрывающей скобки «]».', text.length)
  }

  try {
    skipWhitespace()
    parseValue()
    skipWhitespace()
    if (index < text.length) fail('После конца JSON найдены лишние символы.')
  } catch (error) {
    return error
  }

  return null
}

export function inspectJson(text) {
  try {
    const value = JSON.parse(text)
    return { valid: true, value }
  } catch (error) {
    const technicalMessage = error instanceof Error ? error.message : String(error)
    const syntaxError = findSyntaxError(text)
    const detectedOffset = syntaxError?.offset ?? getErrorOffset(technicalMessage, text)
    const offset = Math.min(Math.max(detectedOffset, 0), text.length)
    const before = text.slice(0, offset)
    const line = before.split('\n').length
    const lineStart = text.lastIndexOf('\n', Math.max(0, offset - 1)) + 1
    const lineEndIndex = text.indexOf('\n', offset)
    const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex
    const snippet = text.slice(lineStart, lineEnd) || ' '
    const column = offset - lineStart + 1

    return {
      valid: false,
      offset,
      line,
      column,
      snippet,
      message: syntaxError?.message ?? getFriendlyMessage(technicalMessage, offset, text),
      technicalMessage,
    }
  }
}

function stripComments(input, changes) {
  let output = ''
  let quote = null
  let escaped = false
  let removed = 0

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]
    const next = input[index + 1]

    if (quote) {
      output += char
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === quote) quote = null
      continue
    }

    if (char === '"' || char === "'") {
      quote = char
      output += char
      continue
    }

    if (char === '/' && next === '/') {
      removed += 1
      index += 2
      while (index < input.length && input[index] !== '\n') index += 1
      if (input[index] === '\n') output += '\n'
      continue
    }

    if (char === '/' && next === '*') {
      removed += 1
      index += 2
      while (index < input.length && !(input[index] === '*' && input[index + 1] === '/')) {
        if (input[index] === '\n') output += '\n'
        index += 1
      }
      index += 1
      continue
    }

    output += char
  }

  if (removed) changes.push(`убраны комментарии: ${removed}`)
  return output
}

function normalizeSingleQuotedStrings(input, changes) {
  let output = ''
  let converted = 0

  for (let index = 0; index < input.length; index += 1) {
    if (input[index] !== "'") {
      output += input[index]
      continue
    }

    converted += 1
    output += '"'
    index += 1

    for (; index < input.length; index += 1) {
      const char = input[index]
      const next = input[index + 1]

      if (char === "'") {
        output += '"'
        break
      }
      if (char === '\\' && next === "'") {
        output += "'"
        index += 1
        continue
      }
      if (char === '\\' && next === '"') {
        output += '\\\"'
        index += 1
        continue
      }
      if (char === '"') {
        output += '\\\"'
        continue
      }
      output += char
    }
  }

  if (converted) changes.push(`одинарные кавычки заменены: ${converted}`)
  return output
}

function balanceBrackets(input, changes) {
  const pairs = { '{': '}', '[': ']' }
  const closers = new Set(['}', ']'])
  const stack = []
  let output = ''
  let inString = false
  let escaped = false
  let added = 0
  let removed = 0

  for (const char of input) {
    if (inString) {
      output += char
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }

    if (char === '"') {
      inString = true
      output += char
      continue
    }

    if (pairs[char]) {
      stack.push(pairs[char])
      output += char
      continue
    }

    if (closers.has(char)) {
      if (stack[stack.length - 1] === char) {
        stack.pop()
        output += char
        continue
      }

      const matchingIndex = stack.lastIndexOf(char)
      if (matchingIndex !== -1) {
        while (stack.length - 1 > matchingIndex) {
          output += stack.pop()
          added += 1
        }
        stack.pop()
        output += char
      } else {
        removed += 1
      }
      continue
    }

    output += char
  }

  while (stack.length) {
    output += stack.pop()
    added += 1
  }

  if (added) changes.push(`добавлены закрывающие скобки: ${added}`)
  if (removed) changes.push(`убраны лишние скобки: ${removed}`)
  return output
}

function replaceWithCount(input, pattern, replacer, label, changes) {
  let count = 0
  const output = input.replace(pattern, (...args) => {
    count += 1
    return typeof replacer === 'function' ? replacer(...args) : replacer
  })
  if (count) changes.push(`${label}: ${count}`)
  return output
}

export function repairJson(input) {
  const changes = []
  let output = input

  output = replaceWithCount(output, /[“”]/g, '"', 'нормализованы типографские кавычки', changes)
  output = replaceWithCount(output, /[‘’]/g, "'", 'нормализованы одинарные кавычки', changes)
  output = stripComments(output, changes)
  output = normalizeSingleQuotedStrings(output, changes)
  output = replaceWithCount(
    output,
    /([{,]\s*)([A-Za-z_$][\w$.-]*)(\s*:)/g,
    (_match, prefix, key, suffix) => `${prefix}"${key}"${suffix}`,
    'ключи взяты в кавычки',
    changes,
  )
  output = replaceWithCount(output, /\bTrue\b/g, 'true', 'True заменено на true', changes)
  output = replaceWithCount(output, /\bFalse\b/g, 'false', 'False заменено на false', changes)
  output = replaceWithCount(output, /\b(?:None|undefined)\b/g, 'null', 'пустые значения заменены на null', changes)
  output = replaceWithCount(
    output,
    /,\s*([}\]])/g,
    (_match, closer) => closer,
    'убраны хвостовые запятые',
    changes,
  )
  output = balanceBrackets(output, changes)

  const validation = inspectJson(output)
  if (validation.valid) output = JSON.stringify(validation.value, null, 2)

  return { output, changes, valid: validation.valid }
}
