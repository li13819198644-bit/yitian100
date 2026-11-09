import { expect, it } from 'vitest'
import { readingLessons } from './reading'
import { wordCount } from './engine'

it('ships twelve complete offline text chapters with stable bookmark IDs', () => {
  expect(readingLessons).toHaveLength(12)
  expect(new Set(readingLessons.map(item => item.id)).size).toBe(12)
  for (const lesson of readingLessons) {
    expect(lesson.sections.length).toBeGreaterThanOrEqual(2)
    expect(lesson.takeaway.length).toBeGreaterThan(10)
    expect(lesson.sections.every(section => section.body.every(text => text.length > 20))).toBe(true)
  }
})
it('provides a full Task 2 sample above 250 words without counting the Chinese commentary', () => {
  const essay = readingLessons.find(item => item.id === 'task2-example')!
  expect(wordCount(essay.sections.slice(0, 4).flatMap(section => section.body).join(' '))).toBeGreaterThanOrEqual(250)
  expect(essay.focus).toContain('不标注 Band')
})
