"""Build the vocabulary-only POS extract from an ECDICT CSV and exported seed words."""
import csv
import hashlib
import json
import pathlib
import re
import sys

source, vocabulary = map(pathlib.Path, sys.argv[1:3])
root = pathlib.Path(__file__).resolve().parents[1]
wanted = {w['word']: w for w in json.loads(vocabulary.read_text())}
labels = {'n': '名词 n.', 'a': '形容词 adj.', 'adj': '形容词 adj.',
          'v': '动词 v.', 'vt': '及物动词 vt.', 'vi': '不及物动词 vi.',
          'adv': '副词 adv.', 'ad': '副词 adv.', 'prep': '介词 prep.',
          'pron': '代词 pron.', 'conj': '连词 conj.', 'num': '数词 num.', 'int': '感叹词 int.'}
result = {}
unparsed = {}
with source.open(encoding='utf-8-sig', newline='') as stream:
    for row in csv.DictReader(stream):
        word = row['word']
        if word not in wanted:
            continue
        senses = []
        for line in row['translation'].replace('\\n', '\n').splitlines():
            match = re.match(r'^\s*(n|a|adj|v|vt|vi|adv|ad|prep|pron|conj|num|int)\.\s*(.+)$', line)
            if match:
                pos, meaning = match.groups()
                if meaning.strip():
                    senses.append({'partOfSpeech': labels[pos], 'meaning': meaning.strip()})
            elif line.strip():
                unparsed.setdefault(word, []).append(line)
        if senses:
            grouped = {}
            for sense in senses:
                label = sense['partOfSpeech']
                if label in ('动词 v.', '及物动词 vt.', '不及物动词 vi.'):
                    label = '动词 v.'
                grouped.setdefault(label, []).append(sense['meaning'])
            # Keep the application's authored gloss for single-POS words;
            # dictionary translations may contain outdated or technical senses.
            result[word] = [{'partOfSpeech': label, 'meaning': wanted[word]['meaning'] if len(grouped) == 1 else '；'.join(dict.fromkeys(meanings))} for label, meanings in grouped.items()]
metadata = {
    'source': 'https://github.com/skywind3000/ECDICT',
    'license': 'MIT',
    'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'entries': result,
}
(root / 'src/data/dictionarySenses.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'covered': len(result), 'missing': sorted(wanted - result.keys()), 'unparsed': unparsed}, ensure_ascii=False, indent=2))
