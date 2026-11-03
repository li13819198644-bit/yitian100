import type { SemanticCard } from '../data/semanticCards'

// Original schematic drawings, used only while studying. Tests render no diagram.
export function LearningObjectDiagram({ kind }: { kind: NonNullable<SemanticCard['image']> }) {
  return <svg viewBox="0 0 300 155" role="img" aria-label={{ hinge: '连接门框和门板的合页示意图', latch: '横向插销伸入扣环的门闩示意图', shard: '有尖角和不规则断口的玻璃碎片示意图' }[kind]} className="w-full rounded-lg bg-sky-50">
    {kind === 'hinge' ? <g stroke="#334155" strokeWidth="3"><path d="M75 25H140V130H75ZM160 25H225V130H160Z" fill="#cbd5e1" /><rect x="142" y="15" width="16" height="125" rx="7" fill="#64748b" />{[48, 105].flatMap(y => [100, 200].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill="white" />))}<path d="M150 20V135" stroke="#f8fafc" /></g> : kind === 'latch' ? <g stroke="#334155" strokeWidth="3"><rect x="35" y="40" width="135" height="75" rx="5" fill="#cbd5e1" /><rect x="205" y="40" width="50" height="75" rx="5" fill="#cbd5e1" /><rect x="45" y="66" width="185" height="20" rx="5" fill="#64748b" /><path d="M115 76V99H130" fill="none" strokeWidth="8" /><rect x="211" y="58" width="15" height="36" fill="none" /></g> : <g stroke="#0284c7" strokeWidth="3"><path d="M85 22L235 60L162 135L105 101L65 108L77 60Z" fill="#bae6fd" /><path d="M90 40L168 65L142 109" fill="none" stroke="white" /><path d="M36 115L48 125L31 135Z" fill="#bae6fd" /></g>}
  </svg>
}
