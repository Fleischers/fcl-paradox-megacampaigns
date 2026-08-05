from pathlib import Path
import zlib

path = Path('../../campaign-2026-07-12-the-first/game-1-imperator-rome/save-games/FCL1-2026-07-26-C.rome')
data = path.read_bytes()
print('file len', len(data))

# scan for candidate zlib headers
candidates = []
for i in range(len(data) - 1):
    if data[i] == 0x78 and data[i+1] in (0x01, 0x5e, 0x9c, 0xda):
        candidates.append((i, data[i+1]))
print('candidates found', len(candidates))

# attempt decompress on each candidate and stop at first plausible result
for idx, b2 in candidates:
    for wbits in [15, 31, -15]:
        try:
            d = zlib.decompress(data[idx:], wbits)
            if len(d) > 0:
                print('SUCCESS', idx, hex(b2), 'wbits', wbits, 'len', len(d))
                print(d[:512].decode('latin1', errors='replace'))
                raise SystemExit
        except Exception:
            continue
print('done, no valid zlib start found')
