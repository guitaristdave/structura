import test from 'node:test'
import assert from 'node:assert/strict'
import { decodeBase64, encodeBase64 } from './base64-tools.js'

test('round-trips Unicode text through Base64', () => {
  const source = 'Привет, Structura 👋'
  assert.equal(decodeBase64(encodeBase64(source)), source)
})

test('supports URL-safe Base64 input', () => {
  const encoded = encodeBase64('subjects?_d').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  assert.equal(decodeBase64(encoded), 'subjects?_d')
})

test('rejects malformed Base64', () => {
  assert.throws(() => decodeBase64('%%%'), /Base64/)
})
