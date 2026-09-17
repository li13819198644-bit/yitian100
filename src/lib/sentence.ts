export interface SentenceToken { id: number; text: string }

export function sentenceTokens(sentence: string): SentenceToken[] {
  return sentence.trim().split(/\s+/).filter(Boolean).map((text, id) => ({ id, text }))
}

export function shuffleSentence(tokens: SentenceToken[], random = Math.random): SentenceToken[] {
  const shuffled = [...tokens]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  // Do not present the reference order as the initial puzzle.
  if (shuffled.length > 1 && shuffled.every((token, i) => token.text === tokens[i].text)) {
    const different = shuffled.findIndex((token) => token.text !== shuffled[0].text)
    if (different > 0) [shuffled[0], shuffled[different]] = [shuffled[different], shuffled[0]]
  }
  return shuffled
}

export function matchesSentence(selected: SentenceToken[], reference: SentenceToken[]): boolean {
  return selected.length === reference.length
    && new Set(selected.map((token) => token.id)).size === reference.length
    && selected.every((token, index) => reference.some((item) => item.id === token.id && item.text === token.text)
      && token.text === reference[index].text)
}
