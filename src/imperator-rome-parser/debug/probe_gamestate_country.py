from pathlib import Path
import zipfile

path = Path('../../campaign-2026-07-12-the-first/game-1-imperator-rome/save-games/FCL1-2026-07-26-C.rome')
with zipfile.ZipFile(path, 'r') as zf:
    raw = zf.read('gamestate')

for key in [b'country', b'countries']:
    idx = raw.find(key)
    print('KEY', key, 'idx', idx)
    if idx != -1:
        region = raw[max(0, idx-100):idx+400]
        print('hex', region.hex())
        print('text', region.decode('latin1', errors='replace'))
        print('------')
