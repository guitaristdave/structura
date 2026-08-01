import test from 'node:test'
import assert from 'node:assert/strict'
import { compareText } from './text-diff.js'

test('marks added and removed words', () => {
  const result = compareText('JSON проверяет данные', 'JSON быстро проверяет текст')

  assert.equal(result.identical, false)
  assert.equal(result.left.filter((part) => part.type === 'removed').map((part) => part.text).join(''), 'данные')
  assert.equal(result.right.filter((part) => part.type === 'added').map((part) => part.text).join(''), 'быстро текст')
})

test('preserves identical text', () => {
  const result = compareText('Одинаковый\nтекст', 'Одинаковый\nтекст')

  assert.equal(result.identical, true)
  assert.deepEqual(result.left, [{ type: 'same', text: 'Одинаковый\nтекст' }])
})

test('supports multiline fragments', () => {
  const result = compareText('первая строка\nстарая строка', 'первая строка\nновая строка')

  assert.equal(result.left.some((part) => part.type === 'removed' && part.text.includes('старая')), true)
  assert.equal(result.right.some((part) => part.type === 'added' && part.text.includes('новая')), true)
})
