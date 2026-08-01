import test from 'node:test'
import assert from 'node:assert/strict'
import { jsonToPhp, phpToJson } from './php-array-tools.js'

test('converts nested JSON into a PHP short array', () => {
  const result = jsonToPhp('{"user":{"name":"David"},"roles":["admin","editor"],"active":true}')

  assert.equal(result.valid, true)
  assert.match(result.output, /'user' => \[/)
  assert.match(result.output, /'roles' => \[/)
  assert.match(result.output, /'active' => true/)
})

test('converts a PHP associative array into JSON', () => {
  const php = "<?php return ['name' => 'David', 'active' => true, 'score' => 12.5, 'note' => null];"
  const result = phpToJson(php)

  assert.equal(result.valid, true)
  assert.deepEqual(JSON.parse(result.output), {
    name: 'David',
    active: true,
    score: 12.5,
    note: null,
  })
})

test('supports the classic array() syntax and trailing commas', () => {
  const result = phpToJson("array('items' => array(1, 2, 3,), 'ready' => false,)")

  assert.equal(result.valid, true)
  assert.deepEqual(JSON.parse(result.output), { items: [1, 2, 3], ready: false })
})

test('reports a precise PHP parse error', () => {
  const result = phpToJson("[\n  'name' => 'David'\n  'active' => true\n]")

  assert.equal(result.valid, false)
  assert.equal(result.error.line, 3)
  assert.match(result.error.message, /запятая/)
})
