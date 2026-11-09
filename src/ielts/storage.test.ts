import 'fake-indexeddb/auto'
import { openDB } from 'idb'
import { expect, it } from 'vitest'
import { getWords, getWritingState, resetProgress, saveWritingState } from '../lib/db'
import { emptyWriting } from './types'

it('persists concurrent writing drafts without touching vocabulary, grammar or old progress', async () => {
  const before = (await getWords()).map(word => word.id)
  const db = await openDB('yitian-100-words', 1)
  const old = { wordId: 'concrete', seen: 20, excluded: true }
  await db.put('progress', old)
  await db.put('meta', [{ questionId: 'existing', attempts: 5 }], 'grammar')
  await Promise.all([
    saveWritingState({ ...emptyWriting(), drafts: { paragraph: { text: 'My original draft.', updatedAt: 2 } } }),
    saveWritingState({ ...emptyWriting(), drafts: { task2: { text: 'My essay.', updatedAt: 3 } } }),
  ])
  expect((await getWritingState()).drafts.paragraph.text).toBe('My original draft.')
  expect((await getWritingState()).drafts.task2.text).toBe('My essay.')
  expect(await db.get('progress', 'concrete')).toEqual(old)
  expect(await db.get('meta', 'grammar')).toEqual([{ questionId: 'existing', attempts: 5 }])
  expect((await getWords()).map(word => word.id)).toEqual(before)
  expect(before).toHaveLength(605)
  await resetProgress()
  expect((await getWritingState()).drafts.task2.text).toBe('My essay.')
  db.close()
})
