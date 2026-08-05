from pathlib import Path
path = Path(r'E:\Games\paradox_tools\FCL1-2026-08-02-b.json')
b = path.read_bytes()
if b[:2] == b'\xff\xfe':
    text = b[2:].decode('utf-16le')
elif b[:2] == b'\xfe\xff':
    text = b[2:].decode('utf-16be')
else:
    text = b.decode('utf-8', errors='replace')
tokens = ['MAURETANIA','BAETICA','ITALIA','MACEDONIA','CELTICA','SCANDIA','BRITANNIA','TAURICA','DACIA','ARMENIA']
for tok in tokens:
    idx = text.find(tok)
    print(tok, 'count', text.count(tok), 'first', idx)
    if idx != -1:
        start = max(0, idx-200)
        end = min(len(text), idx+200)
        snippet = text[start:end]
        print('---')
        print(snippet)
        print('---\n')
