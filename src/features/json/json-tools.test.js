import test from 'node:test'
import assert from 'node:assert/strict'
import { inspectJson, repairJson } from './json-tools.js'

test('reports the exact line and column of a syntax error', () => {
  const result = inspectJson('{\n  "ok": true,\n  "bad": ]\n}')

  assert.equal(result.valid, false)
  assert.equal(result.line, 3)
  assert.equal(result.column, 10)
  assert.match(result.message, /]|символ/)
})

test('repairs common JavaScript-like JSON syntax', () => {
  const result = repairJson("{name: 'David', active: True, note: None,}")

  assert.equal(result.valid, true)
  assert.deepEqual(JSON.parse(result.output), {
    name: 'David',
    active: true,
    note: null,
  })
})

test('adds missing brackets and removes extra ones', () => {
  const missing = repairJson('{"items":[1,2,3}')
  const extra = repairJson('{"ready":true}}')

  assert.equal(missing.valid, true)
  assert.deepEqual(JSON.parse(missing.output), { items: [1, 2, 3] })
  assert.equal(extra.valid, true)
  assert.deepEqual(JSON.parse(extra.output), { ready: true })
})

test('removes comments and trailing commas', () => {
  const result = repairJson('{/* draft */ "items": [1, 2,],}')

  assert.equal(result.valid, true)
  assert.deepEqual(JSON.parse(result.output), { items: [1, 2] })
})
