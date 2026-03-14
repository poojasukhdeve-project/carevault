import { cn, formatFileSize } from '@/lib/utils'

describe('cn', () => {
  test('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  test('handles empty inputs', () => {
    expect(cn()).toBe('')
  })

  test('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  test('handles undefined and null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })

  test('merges conflicting tailwind classes (last wins)', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  test('merges tailwind variants correctly', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })
})

describe('formatFileSize', () => {
  test('returns empty string for undefined', () => {
    expect(formatFileSize(undefined)).toBe('')
  })

  test('returns empty string for 0', () => {
    expect(formatFileSize(0)).toBe('')
  })

  test('returns bytes for values under 1024', () => {
    expect(formatFileSize(500)).toBe('500 B')
    expect(formatFileSize(1)).toBe('1 B')
    expect(formatFileSize(1023)).toBe('1023 B')
  })

  test('returns KB for values between 1024 and 1MB', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(1024 * 100)).toBe('100.0 KB')
  })

  test('returns MB for values >= 1MB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
    expect(formatFileSize(1024 * 1024 * 5.5)).toBe('5.5 MB')
  })
})
