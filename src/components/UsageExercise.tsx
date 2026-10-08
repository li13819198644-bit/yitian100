import { useQuickAnswer } from '../lib/useQuickAnswer'

export function UsageExercise({ word, meaning, collocation, example, onAnswer, onAnswered }: {
  word: string; meaning: string; collocation: string; example: string
  onAnswered?: () => void
  onAnswer: (correct: boolean) => void | boolean | Promise<void | boolean>
}) {
  const { result, error, submit } = useQuickAnswer(onAnswer, onAnswered)
  return <div className="grid gap-3">
    <p className="text-2xl font-semibold">{word} · {meaning}</p>
    <p className="text-sm text-stone-600">在心里用这个词说一句自己的话，然后自评。无需打字。</p>
    <p className="rounded-lg bg-stone-100 p-3">{collocation || '暂无搭配'}<br />{example || '暂无例句'}</p>
    <div className="grid grid-cols-2 gap-3">
      <button className="tap-button bg-emerald-600 text-white" disabled={result !== null} onClick={() => submit(true, 'usage')}>会用</button>
      <button className="tap-button bg-stone-100" disabled={result !== null} onClick={() => submit(false, 'usage')}>还不会</button>
    </div>
    {result !== null && <p role="status">{result ? '已记下，正在继续…' : '已安排再练。'}</p>}
    {error && <p role="alert" className="text-rose-800">{error}</p>}
  </div>
}
