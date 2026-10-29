import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { DailyAnalysisPanel } from './DailyAnalysisPanel'
import { analyzeDailyReports } from '../../supabase/functions/_shared/dailyAnalysis'
import { report } from '../test/dailyAnalysisFixtures'
import type { AnalysisJob } from '../lib/dailyAnalysis'

it('keeps refresh available for today even while showing a previous completed report', () => {
  const previous: AnalysisJob = { id: 'previous', report_date: '2026-10-28', revision: 1, status: 'completed', result: analyzeDailyReports([report()], '2026-10-28'), created_at: '2026-10-28T12:00:00Z', updated_at: '2026-10-28T12:00:00Z' }
  const job: AnalysisJob = { ...previous, id: 'today', report_date: '2026-10-29', status: 'pending', result: null }
  const noop = () => {}
  const html = renderToStaticMarkup(<DailyAnalysisPanel date="2026-10-29" ready signedIn configured job={job} previousJob={previous} cards={[]} busy={false} message="" onUpload={noop} onLogin={noop} onRefresh={noop} onAccept={noop} onRestore={noop} />)
  expect(html).toContain('刷新分析状态')
  expect(html).toContain('已上传，等待分析')
  expect(html).toContain('最近分析来自')
})
