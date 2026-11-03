import { useRef, useState } from 'react'
import type { VocabWord, WordProgress } from '../types'
import { semanticCards } from '../data/semanticCards'
import { createABExperiment, createImagePilot, experimentCheckpoint, experimentResults, reservedExperimentWords } from '../lib/vocabularyExperiment'
import { learningEvent, type LearningState, type VocabularyExperiment } from '../lib/learningProtocol'
import { ExperimentStudyRound } from './ExperimentStudyRound'
import { RecallExperimentRound } from './RecallExperimentRound'
import { UsagePractice } from './UsagePractice'

export function VocabularyLab({ words, progress, state, onSave, onBack }: { words: VocabWord[]; progress: WordProgress[]; state: LearningState; onSave: (state: LearningState) => Promise<void>; onBack: () => void }) {
  const [activeId, setActiveId] = useState(''), [mode, setMode] = useState<'menu' | 'setup' | 'study' | 'initial' | 'reverse' | 'delayed' | 'results' | 'usage' | 'transfer'>('menu')
  const [unfamiliar, setUnfamiliar] = useState<string[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [transferIds, setTransferIds] = useState<string[]>([])
  const lock = useRef(false)
  const experiment = state.experiments.find(item => item.id === activeId)
  async function commit(next: LearningState, after?: () => void) {
    if (lock.current) return
    lock.current = true; setBusy(true); setError('')
    try { await onSave(next); after?.() }
    catch { setError('保存未完成，请检查本机存储后重试。') }
    finally { lock.current = false; setBusy(false) }
  }
  function start(item: VocabularyExperiment, next: typeof mode) {
    void commit({ schemaVersion: 1, events: [], experiments: [item] }, () => { setActiveId(item.id); setMode(next) })
  }
  function resume(item: VocabularyExperiment) {
    setActiveId(item.id)
    if (item.closedAt) { setMode('results'); return }
    if (item.armOrder.some(arm => item.completedAt[arm] == null)) setMode(item.priorReport ? 'reverse' : 'study')
    else if (!state.events.some(event => event.experimentId === item.id && event.checkpoint === 'initial') && !item.priorReport) setMode('initial')
    else setMode('results')
  }
  if (mode === 'transfer' && experiment) return <UsagePractice cards={experiment.items.filter(item => transferIds.includes(item.card.id)).map(item => item.card)} events={state.events} experimentId={experiment.id} checkpoint="14d" onSave={events => onSave({ schemaVersion: 1, events, experiments: [] })} onBack={() => setMode('results')} />
  if (mode === 'usage') {
    const reserved = reservedExperimentWords(state)
    const cards = semanticCards.filter(card => words.some(word => word.id === card.id) && !progress.find(item => item.wordId === card.id)?.excluded && !reserved.has(card.id))
    return <UsagePractice cards={cards} events={state.events} onSave={events => onSave({ schemaVersion: 1, events, experiments: [] })} onBack={() => setMode('menu')} />
  }
  if (experiment && ['initial', 'reverse', 'delayed'].includes(mode)) {
    const point = mode === 'delayed' ? experimentCheckpoint(experiment, state.events) : null
    if (mode === 'delayed' && !point) return <section><p>这个延迟检查点尚未到期或已经完成。</p><button className="tap-button" onClick={() => setMode('results')}>查看记录</button></section>
    const checkpoint = mode === 'initial' ? 'initial' : mode === 'reverse' ? 'reverse' : point!.id
    return <RecallExperimentRound key={`${experiment.id}:${checkpoint}`} experimentId={experiment.id} checkpoint={checkpoint} cards={experiment.items.map(item => item.card)} direction={mode === 'reverse' ? 'zh-en' : 'en-zh'} onCancel={() => setMode('results')} onSubmit={async events => {
      // Answers are shown only after all responses commit; feedback is separate evidence.
      const feedback = events.map(event => learningEvent({ ...event, kind: 'feedback', cue: 'sentence', outcome: null, answer: undefined, activeMs: 0 }))
      const completedAt = { ...experiment.completedAt }
      if (mode !== 'delayed') for (const arm of experiment.armOrder) completedAt[arm] = Date.now()
      await onSave({ schemaVersion: 1, events: [...events, ...feedback], experiments: [{ ...experiment, updatedAt: Date.now(), completedAt }] })
      setMode('results')
    }} />
  }
  if (experiment && mode === 'study') {
    const arm = experiment.armOrder.find(arm => experiment.completedAt[arm] == null)
    if (!arm) return <section className="space-y-4"><p>{experiment.kind === 'image-pilot' ? '三词学习阶段已结束。' : '两组学习阶段已结束。'}接下来进行无提示初测，并记录即时结果。</p><button className="tap-button w-full bg-stone-950 text-white" onClick={() => setMode('initial')}>开始首次提取</button></section>
    return <ExperimentStudyRound key={`${experiment.id}:${arm}`} experiment={experiment} arm={arm} onSave={async (next, events) => { await onSave({ schemaVersion: 1, events, experiments: [next] }) }} onBack={() => setMode('menu')} />
  }
  if (experiment && mode === 'results') {
    const attempts = state.events.filter(event => event.experimentId === experiment.id && event.kind === 'recall')
    const latestCheckpoint = attempts.at(-1)?.checkpoint
    const round = attempts.filter(event => event.checkpoint === latestCheckpoint)
    const due = experiment.closedAt ? null : experimentCheckpoint(experiment, state.events)
    const reverseDone = attempts.some(event => event.checkpoint === 'reverse')
    return <section className="space-y-4" aria-label="实验结果">
      <h2 className="text-xl font-semibold">{experiment.kind === 'image-pilot' ? '图像试学记录' : '14天探索性对照'}</h2>
      {experiment.priorReport && <p className="text-sm text-stone-600">此前首轮3/3来自你的聊天自述，学习时间未知，未计入程序验证成绩。延迟计时从本次答案核对开始。</p>}
      {round.length > 0 && <><p className="font-semibold">本轮 {round.filter(event => event.outcome === 'correct').length}/{round.length} 正确{round.some(event => event.outcome === 'needs-review') ? '，另有答案待核对' : ''}</p><ul className="space-y-3">{round.map(event => { const card = experiment.items.find(item => item.card.id === event.wordId)!.card; return <li className="rounded-lg bg-white p-4" key={event.id}><strong>{card.word}</strong><span className="ml-2 text-sm">{event.outcome === 'correct' ? '正确' : event.outcome === 'needs-review' ? '待核对' : event.direction === 'zh-en' ? '未提取出本轮目标词' : '未想起'}{event.assessment === 'self' ? '（自评复核）' : ''}</span> · 你的答案：{event.answer?.trim() || '未想起'}<p className="mt-2 text-sm">{card.partOfSpeech}：{card.meaning}</p>{event.outcome === 'needs-review' && <><p className="mt-2 text-xs">程序未匹配到已收录表达，请核对含义；自行确认会标为自评。</p><div className="flex gap-3">{(['correct', 'incorrect'] as const).map((outcome, i) => <button key={outcome} disabled={busy} className="min-h-11 text-sm underline" onClick={() => void commit({ schemaVersion: 1, experiments: [], events: [{ ...event, updatedAt: Math.max(Date.now(), event.updatedAt + 1), outcome, assessment: 'self' }] })}>{['含义正确', '需要重学'][i]}</button>)}</div></>}</li> })}</ul></>}
      {experiment.kind === 'image-pilot' && !reverseDone && <button disabled={busy} className="tap-button w-full bg-stone-950 text-white" onClick={() => setMode('reverse')}>进行中文到英文的反向提取</button>}
      {due ? <><p className="text-sm">已距初学核对约 {(due.actualDelayMs / 3600000).toFixed(1)} 小时。检查点：{due.id}。较早漏测的检查点保留为未测。</p><button className="tap-button w-full bg-stone-950 text-white" onClick={() => setMode('delayed')}>开始到期无提示复测</button></> : !experiment.closedAt && <p className="text-sm text-stone-600">到期后可做约24小时、7天、14天无提示复测；未到期不提前记为延迟保持。</p>}
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>检查点</th><th>组</th><th>正确／已测／分配</th><th>学习分钟</th><th>保留词／学习分钟</th><th>已知词对混淆</th><th>新语境表达自评</th></tr></thead><tbody>{experimentResults(experiment, state).flatMap(point => point.groups.map(group => <tr key={`${point.id}:${group.arm}`}><td className="py-3">{point.id}</td><td>{group.arm}</td><td>{group.tested ? `${group.correct}/${group.tested}/${group.allocated}` : '尚未测试'}{group.selfRated ? `（自评${group.selfRated}）` : ''}{group.actualDelayDays != null && <span className="block text-xs text-stone-500">初学后约{group.actualDelayDays.toFixed(1)}天；期间记录{group.interveningExposures}次词项练习；距最近接触至少约{group.latestExposureGapDays?.toFixed(1)}天</span>}</td><td>{group.learningMinutes.toFixed(1)}</td><td>{group.retainedPerMinute === null ? '—' : group.retainedPerMinute.toFixed(2)}</td><td>{group.confusions}</td><td>{group.transfer.tested ? `${group.transfer.correct}/${group.transfer.tested}（自评）` : '尚未测试'}</td></tr>))}</tbody></table></div>
      {experiment.kind === 'ab14' && latestCheckpoint === '14d' && experiment.items.some(item => !state.events.some(event => event.experimentId === experiment.id && event.checkpoint === '14d' && event.kind === 'usage' && event.wordId === item.card.id)) && <button className="tap-button w-full bg-white" onClick={() => { setTransferIds(experiment.items.filter(item => !state.events.some(event => event.experimentId === experiment.id && event.checkpoint === '14d' && event.kind === 'usage' && event.wordId === item.card.id)).map(item => item.card.id)); setMode('transfer') }}>终测后的新语境表达检查（口头自评）</button>}<p className="text-xs leading-6 text-stone-600">首次答对和同日反向测试只反映当下提取。小样本、自评、漏测、前台计时误差及期间复习会影响解释；结果用于调整个人方案，不能据此证明图像记忆或某组方法更优。7天与14天检查点按初学时间标记，期间的反馈、其他练习仍须一起查看。</p>
      {experiment.kind === 'ab14' && !experiment.closedAt && <button disabled={busy} className="min-h-11 text-sm underline" onClick={() => void commit({ schemaVersion: 1, events: [], experiments: [{ ...experiment, closedAt: Date.now(), updatedAt: Date.now() }] })}>结束对照并恢复普通复习</button>}
      {error && <p role="alert">{error}</p>}
      <button className="tap-button w-full bg-white" onClick={() => setMode('menu')}>返回实验记录</button>
    </section>
  }
  return <section className="space-y-4" aria-label="记忆方法实验">
    <h2 className="text-xl font-semibold">记忆方法实验</h2>
    <p className="text-sm leading-6">把提示、提取方向和间隔分开检查。反向实验需要输入英文，普通学习保持会／不会。</p>
    {mode === 'setup' ? <><p className="text-sm">只勾选确认尚未掌握的词。程序从同词性、近似难度中配出8词，随机分为两组并随机安排先后，每组固定3分钟前台学习。</p>{semanticCards.filter(card => !card.partOfSpeech.includes('／') && words.some(word => word.id === card.id) && !progress.find(item => item.wordId === card.id)?.excluded).map(card => <label className="flex min-h-11 items-center gap-3" key={card.id}><input type="checkbox" checked={unfamiliar.includes(card.id)} onChange={event => setUnfamiliar(ids => event.target.checked ? [...ids, card.id] : ids.filter(id => id !== card.id))} /><span>{card.word} · 尚未掌握</span></label>)}<button disabled={busy} className="tap-button w-full bg-stone-950 text-white" onClick={() => { try { start(createABExperiment(words, unfamiliar), 'study') } catch (reason) { setError(reason instanceof Error ? reason.message : '无法配对') } }}>随机分组并开始</button></> : <>
      <button disabled={busy} className="tap-button w-full bg-stone-950 text-white" onClick={() => start(createImagePilot(true), 'reverse')}>接着自述首轮3/3，做反向测试</button>
      <button disabled={busy} className="tap-button w-full bg-white" onClick={() => start(createImagePilot(false), 'study')}>从图像学习开始三词试学</button>
      <button className="tap-button w-full bg-white" onClick={() => setMode('setup')}>建立14天对照实验</button>
      <button className="tap-button w-full bg-white" onClick={() => setMode('usage')}>新语境表达练习（口头自评）</button>
    </>}
    {error && <p role="alert">{error}</p>}
    {state.experiments.map(item => <button key={item.id} className="block min-h-14 w-full rounded-lg bg-white p-4 text-left" onClick={() => resume(item)}>{item.kind === 'image-pilot' ? '图像三词试学' : '14天对照'} · {new Date(item.createdAt).toLocaleDateString()}{item.closedAt ? ' · 已结束' : ''}<span className="block text-xs text-stone-500">{experimentCheckpoint(item, state.events) && !item.closedAt ? '有到期复测' : '查看学习与测试记录'}</span></button>)}
    <button className="tap-button w-full bg-white" onClick={onBack}>返回首页</button>
  </section>
}
