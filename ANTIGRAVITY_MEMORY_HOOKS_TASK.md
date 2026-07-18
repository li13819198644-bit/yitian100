# Antigravity Task - 一天100词记忆钩子

## Role

You are the first-pass memory-hook writer. Codex will act as reviewer and editor before release.

## Goal

Write practical Chinese learner memory hooks for every seed vocabulary word in `src/data/seedWords.ts`.

## Output Shape

Create or update a TypeScript map keyed by lowercase word:

```ts
export const antigravityHooks = {
  anticipate: {
    core: '...',
    image: '...',
    breakdown: '...',
    cue: '...',
    personalPrompt: '...',
  },
}
```

Each hook must match `VocabWord['memoryHook']`.

## Quality Rules

- Do not invent etymology.
- Do not use fake roots or forced puns.
- Do not simply repeat the Chinese translation.
- Prefer useful distinctions: `anticipate` vs `expect`, `eliminate` vs `reduce`, `viable` vs `possible`.
- Prefer real usage contexts and common collocations.
- Keep each field short enough for iPhone.
- The hook should help the user produce the word, not merely recognize it.

## Suggested Field Meaning

- `core`: the plain action or idea.
- `image`: a concrete real-life scene.
- `breakdown`: usage note, confusion warning, or structure.
- `cue`: common collocations to recall first.
- `personalPrompt`: a short sentence frame the user can complete.

## Handoff Back To Codex

Return:

- File path changed.
- Number of words covered.
- Known weak entries that need human review.
