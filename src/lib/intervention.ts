import type { ReviewReason, VocabWord, WordProgress } from '../types'
import { isLeech } from './srs'

export function needsIntervention(progress?: WordProgress): boolean {
  return Boolean(progress && !progress.excluded && ((progress.evidence?.failureDays.length ?? 0) >= 2 || isLeech(progress)))
}
export function interventionText(word: VocabWord, reason: ReviewReason): string {
  if (word.word.toLowerCase() === 'repudiate') {
    if (reason === 'meaning') return 'repudiate：正式、明确地拒绝承认或接受某个说法、义务或关系。repudiate responsibility 表示拒绝承认自己负有责任；不是用证据证明责任不存在。'
    if (reason === 'confusion') return 'deny：否认某件事是真的；reject：拒绝接受；refute：用理由或证据反驳；repudiate：正式拒绝承认或接受。只抓住一个区别：repudiate responsibility 是拒绝认责，refute a claim 是用证据反驳说法。'
    if (reason === 'usage') return 'repudiate responsibility：拒绝承认责任。The company repudiated responsibility for the damage. 公司拒绝承认对损失负有责任。先记这一组，不需要再背其他新词。'
  }
  if (reason === 'meaning') return `${word.word}：${word.meaning}。${word.collocation ? `先用 ${word.collocation} 把意思连起来。` : '只抓住当前核心含义。'}`
  if (reason === 'usage') return word.usageNote || [word.collocation, word.example].filter(Boolean).join(' · ') || '此词暂无搭配资料，可先看当前释义。'
  if (reason === 'confusion') return word.confusions?.[0]?.correction || word.usageNote || '暂无经核对的专门辨析；先回到本词的核心含义，不编造近义词区别。'
  return word.memoryHook?.breakdown || `看清 ${word.word} 的字形，再联系当前释义。暂无词源资料，不把拼写联想当作词源。`
}
