import test from 'node:test'
import assert from 'node:assert/strict'
import { removeBackslashes } from './url-cleaner.js'

test('removes escape backslashes from a URL', () => {
  assert.equal(
    removeBackslashes('https:/\\/\\www.example.com/\\something'),
    'https://www.example.com/something',
  )
})

test('leaves an ordinary URL unchanged', () => {
  assert.equal(removeBackslashes('https://example.com/path'), 'https://example.com/path')
})
