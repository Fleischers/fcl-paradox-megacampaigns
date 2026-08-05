from pathlib import Path

path = Path(r'E:\Games\paradox_tools\FCL1-2026-08-02-b_melted.rome')
print('path:', path)
print('exists:', path.exists())
if not path.exists():
    raise SystemExit(1)
raw = path.read_bytes()
print('size:', len(raw))
print('head hex:', raw[:64].hex())
print('head ascii:', raw[:64].decode('latin1', errors='replace'))

for encoding in ['utf8', 'utf16le', 'utf16be']:
    try:
        text = raw.decode(encoding)
        valid = all(32 <= ord(ch) <= 126 or ch in '\r\n\t' for ch in text[:200])
        print(f'{encoding}: ok, first 200 chars valid={valid}')
        print(text[:300])
    except Exception as e:
        print(f'{encoding}: fail {type(e).__name__}: {e}')

keywords = [b'countries', b'country', b'tag', b'religion', b'primary_culture', b'owned_provinces', b'province', b'people', b'ruler', b'monarch']
for kw in keywords:
    idx = raw.find(kw)
    print(kw.decode(), idx)
    if idx != -1:
        start = max(0, idx-40)
        end = min(len(raw), idx+120)
        print(raw[start:end].decode('latin1', errors='replace'))
        print('---')
