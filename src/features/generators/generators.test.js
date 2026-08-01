import test from 'node:test'
import assert from 'node:assert/strict'
import {
  dateTimeToTimestamp,
  generatePassword,
  generateToken,
  generateUuidV4,
  getTimestamps,
  timestampToDateTime,
} from './generators.js'

test('generates a valid UUID v4', () => {
  assert.match(generateUuidV4(), /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i)
})

test('generates secure tokens and passwords of requested length', () => {
  assert.match(generateToken(16), /^[\da-f]{32}$/)
  assert.equal(generatePassword(24).length, 24)
})

test('returns seconds, milliseconds and ISO timestamp', () => {
  const result = getTimestamps(new Date('2026-08-01T12:00:00.123Z'))

  assert.equal(result.seconds, 1785585600)
  assert.equal(result.milliseconds, 1785585600123)
  assert.equal(result.iso, '2026-08-01T12:00:00.123Z')
})

test('converts timestamps in seconds and milliseconds to datetime', () => {
  assert.equal(timestampToDateTime('1785585600').iso, '2026-08-01T12:00:00.000Z')
  assert.equal(timestampToDateTime('1785585600123').iso, '2026-08-01T12:00:00.123Z')
})

test('converts datetime back to timestamps', () => {
  const result = dateTimeToTimestamp('2026-08-01T12:00:00.123Z')
  assert.equal(result.seconds, 1785585600)
  assert.equal(result.milliseconds, 1785585600123)
})
