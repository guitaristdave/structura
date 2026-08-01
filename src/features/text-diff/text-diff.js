function tokenize(text) {
  return text.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu) ?? []
}

function append(segments, type, text) {
  if (!text) return
  const previous = segments[segments.length - 1]
  if (previous?.type === type) previous.text += text
  else segments.push({ type, text })
}

function fallbackDiff(left, right) {
  let prefixLength = 0
  const maxPrefix = Math.min(left.length, right.length)
  while (prefixLength < maxPrefix && left[prefixLength] === right[prefixLength]) prefixLength += 1

  let suffixLength = 0
  const maxSuffix = Math.min(left.length - prefixLength, right.length - prefixLength)
  while (
    suffixLength < maxSuffix
    && left[left.length - 1 - suffixLength] === right[right.length - 1 - suffixLength]
  ) {
    suffixLength += 1
  }

  const prefix = left.slice(0, prefixLength)
  const suffix = suffixLength ? left.slice(left.length - suffixLength) : ''
  const leftMiddle = left.slice(prefixLength, left.length - suffixLength || undefined)
  const rightMiddle = right.slice(prefixLength, right.length - suffixLength || undefined)

  const leftSegments = []
  const rightSegments = []
  append(leftSegments, 'same', prefix)
  append(rightSegments, 'same', prefix)
  append(leftSegments, 'removed', leftMiddle)
  append(rightSegments, 'added', rightMiddle)
  append(leftSegments, 'same', suffix)
  append(rightSegments, 'same', suffix)
  return { left: leftSegments, right: rightSegments }
}

export function compareText(left, right) {
  if (left === right) {
    const segment = left ? [{ type: 'same', text: left }] : []
    return { left: segment, right: segment, identical: true, added: 0, removed: 0 }
  }

  const leftTokens = tokenize(left)
  const rightTokens = tokenize(right)

  let result
  if (leftTokens.length * rightTokens.length > 400_000) {
    result = fallbackDiff(left, right)
  } else {
    const matrix = Array.from(
      { length: leftTokens.length + 1 },
      () => new Uint32Array(rightTokens.length + 1),
    )

    for (let leftIndex = leftTokens.length - 1; leftIndex >= 0; leftIndex -= 1) {
      for (let rightIndex = rightTokens.length - 1; rightIndex >= 0; rightIndex -= 1) {
        matrix[leftIndex][rightIndex] = leftTokens[leftIndex] === rightTokens[rightIndex]
          ? matrix[leftIndex + 1][rightIndex + 1] + 1
          : Math.max(matrix[leftIndex + 1][rightIndex], matrix[leftIndex][rightIndex + 1])
      }
    }

    const leftSegments = []
    const rightSegments = []
    let leftIndex = 0
    let rightIndex = 0

    while (leftIndex < leftTokens.length && rightIndex < rightTokens.length) {
      if (leftTokens[leftIndex] === rightTokens[rightIndex]) {
        append(leftSegments, 'same', leftTokens[leftIndex])
        append(rightSegments, 'same', rightTokens[rightIndex])
        leftIndex += 1
        rightIndex += 1
      } else if (matrix[leftIndex + 1][rightIndex] >= matrix[leftIndex][rightIndex + 1]) {
        append(leftSegments, 'removed', leftTokens[leftIndex])
        leftIndex += 1
      } else {
        append(rightSegments, 'added', rightTokens[rightIndex])
        rightIndex += 1
      }
    }

    while (leftIndex < leftTokens.length) {
      append(leftSegments, 'removed', leftTokens[leftIndex])
      leftIndex += 1
    }
    while (rightIndex < rightTokens.length) {
      append(rightSegments, 'added', rightTokens[rightIndex])
      rightIndex += 1
    }

    result = { left: leftSegments, right: rightSegments }
  }

  return {
    ...result,
    identical: false,
    added: result.right
      .filter((segment) => segment.type === 'added')
      .reduce((total, segment) => total + segment.text.length, 0),
    removed: result.left
      .filter((segment) => segment.type === 'removed')
      .reduce((total, segment) => total + segment.text.length, 0),
  }
}
