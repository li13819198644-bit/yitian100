# IELTS Writing 7.0: phase-one MVP

## Scope

The home screen opens an independent Chinese-language writing module. It has
today's practice, grammar, collocations, independent sentence production, error
review, statistics, paragraph drafts and Task 2 drafts. The initial profile is
user-reported, not fabricated test evidence. The initial bank contains 40 items:
10 recognition items, 20 foundation production items and 10 transfer items.

Use `npm install`, `npm run dev -- --host 0.0.0.0`, `npm test`, `npm run build`.
On the same Wi-Fi, open the Mac's LAN address and displayed port on iPhone Safari.
Production HTTPS is needed for installation and service-worker offline testing.

## Feedback boundaries

Recognition questions are scored against an explicit key. Sentence feedback
accepts reviewed references and alternatives (case, whitespace and final
punctuation are normalized). A small, question-specific set of rules identifies
definite target errors. Other responses are **unverified**, not automatically
wrong or correct. The original, reference, knowledge point, error category,
date and evidence mode are stored. The four feedback labels distinguish grammar,
vocabulary, naturalness and meaning, but the MVP does not claim to detect every
error in each category. Naturalness and meaning generally require manual review.

Reference expressions appear only after a successful persisted submission.
Editing after feedback is imitation. Repeated items remain imitation, even on a
later day. Recognition, imitation and independent evidence have separate counts.
The same day's correction cannot overwrite the first attempt or trend.

## Scheduling

Errors increase skill priority and make practice due after ten minutes.
Other attempts default to one day; independently passing different questions on
different calendar days at least 24 hours apart increases the interval, capped at fourteen days. A new
failure resets the independent-success streak. Two independent days allow the
transfer tier. These are conservative starting heuristics, not an empirically
optimal schedule or proof of mastery. Users may practise early without claiming
delayed mastery. Unseen questions are chosen first; exhausted banks are explicitly
labelled as previously seen, not new independent evidence.

## Storage and preservation

IndexedDB `yitian-100-words` remains version 1; the existing `meta` store receives
only the new `ielts-writing` key. No migration, table deletion, vocabulary ID or
progress reset is required. `saveWritingState` merges append-only attempt IDs and
last-write-wins per-draft timestamps in a transaction. LocalStorage is a fallback
backup under `yitian100:writing`. The old vocabulary reset leaves writing intact.
Existing grammar records and word SRS are intentionally not scored by writing
answers because their evidence types differ.

Writing has its own JSON export including original responses and drafts.
Writing cloud synchronization and import are **not implemented**. Existing cloud
word sync remains unchanged; do not imply that it includes the writing module.
Browser storage can be cleared by the user or OS, so use JSON export for backup.

## Phase two, not implemented

- Semantic/AI review of arbitrary sentences, manually confirmed adjudication.
- Full paragraph and essay feedback or simulated band estimates.
- A timed Task 2 exam, expanded advanced question banks and longitudinal models.
- Cloud synchronization of writing records and backup restore UI.

Paragraphs and essays currently provide saved drafts, word counts, a causal-chain
checklist and the four official assessment dimensions, **not marks**. The 60–100
word range is a practice target, not an IELTS requirement. Task 2 requires at
least 250 words. One Task 2 response alone is not the full Writing score.

Official sources checked 2026-11-09:
- https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing
- https://ielts.org/cdn/Guides/ielts-writing-band-descriptors.pdf

## Verification

Tests cover bounded grading, unseen questions, cross-day progression, same-day
and imitation exclusion, priority after errors, transaction merging, old data
preservation, hidden answers, failed-save retry and draft restoration. Browser
checks should additionally cover iPhone-sized layouts, refresh, original word
learning and export. Automated mobile emulation is not a physical iPhone test.
