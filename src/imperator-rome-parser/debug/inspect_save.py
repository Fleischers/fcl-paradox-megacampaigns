from pathlib import Path
import sys

save_path = Path(sys.argv[1])
if not save_path.exists():
    raise SystemExit(f"File not found: {save_path}")

data = save_path.read_bytes()
print('LENGTH', len(data))
print('HEAD BYTES', data[:64])
print('NULLS IN HEAD', data[:64].count(0))
for enc in ['utf-8', 'utf-16le', 'utf-16be', 'latin1']:
    try:
        decoded = data.decode(enc, errors='replace')
        print('ENC', enc, 'HEAD', repr(decoded[:120]))
        print('contains tag=', 'tag=' in decoded)
        print('contains countries=', 'countries' in decoded.lower())
        print('contains country=', 'country' in decoded.lower())
    except Exception as e:
        print('ENC', enc, 'ERROR', e)

def extract_strings(data, min_len=5, utf16=False):
    result = []
    if utf16:
        cur = []
        i = 0
        while i + 1 < len(data):
            ch = data[i:i+2]
            if len(ch) == 2 and ch[1] == 0 and 32 <= ch[0] < 127:
                cur.append(chr(ch[0]))
            else:
                if len(cur) >= min_len:
                    result.append(''.join(cur))
                cur = []
            i += 2
        if len(cur) >= min_len:
            result.append(''.join(cur))
    else:
        cur = []
        for b in data:
            if 32 <= b < 127:
                cur.append(chr(b))
            else:
                if len(cur) >= min_len:
                    result.append(''.join(cur))
                cur = []
        if len(cur) >= min_len:
            result.append(''.join(cur))
    return result

# Extract ASCII and UTF-16LE strings
for label, extractor in [('ascii', lambda b: extract_strings(b, 5)), ('utf16le', lambda b: extract_strings(b, 5, utf16=True))]:
    print('--- STRING EXTRACT', label)
    strings = extractor(data)
    matches = [s for s in strings if any(x in s for x in ['country', 'countries', 'tag=', 'TUS', 'MAC', 'MAU', 'Macedonia'])]
    print('FOUND', len(matches), 'matches')
    for s in matches[:40]:
        print(s)
    print('---')

patterns = [b'countries', b'country', b'tag="MAC"', b'tag=MAC', b'tag="TUS"', b'tag=TUS', b'tag="TAR"', b'tag=TAR', b'tag="MAU"', b'tag=MAU,', b't\x00a\x00g\x00=', b'T\x00A\x00G\x00=']
for pat in patterns:
    idx = data.find(pat)
    print(f"PAT {pat} IDX {idx}")
    if idx != -1:
        chunk = data[max(0, idx-120):idx+220]
        print(chunk.replace(b'\n', b'\\n')[:400])
        print('---')
