from pathlib import Path
import gzip
import io

path = Path('../../campaign-2026-07-12-the-first/game-1-imperator-rome/save-games/FCL1-2026-07-26-C.rome')
data = path.read_bytes()
idx = data.find(b'\x1f\x8b')
print('gzip idx', idx)
if idx == -1:
    raise SystemExit('no gzip found')
print(data[idx:idx+16].hex())
try:
    with gzip.GzipFile(fileobj=io.BytesIO(data[idx:])) as g:
        d = g.read(1000)
        print('read len', len(d))
        print(d[:500].decode('latin1', errors='replace'))
except Exception as e:
    print('gzip fail', type(e).__name__, e)
