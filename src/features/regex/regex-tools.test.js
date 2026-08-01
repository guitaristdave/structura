import test from 'node:test'
import assert from 'node:assert/strict'
import { testRegex } from './regex-tools.js'

test('finds and highlights every match', () => {
  const result = testRegex('json', 'gi', 'JSON and json')

  assert.equal(result.valid, true)
  assert.equal(result.matches.length, 2)
  assert.equal(result.segments.filter((part) => part.type === 'match').length, 2)
})

test('returns a readable error for an invalid expression', () => {
  const result = testRegex('[a-', 'g', 'text')
  assert.equal(result.valid, false)
  assert.ok(result.error)
})

test('handles zero-length matches without looping forever', () => {
  const result = testRegex('^|$', 'gm', 'a\nb')
  assert.equal(result.valid, true)
  assert.equal(result.matches.length, 4)
})
