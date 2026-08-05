from pathlib import Path
import zipfile

path = Path('../../campaign-2026-07-12-the-first/game-1-imperator-rome/save-games/FCL1-2026-07-26-C.rome')
with zipfile.ZipFile(path, 'r') as zf:
    raw = zf.read('gamestate')

for pat in [b'TUS', b'MAC', b'TAR', b'DAC', b'SCY', b'BEL', b'ARM', b'ALB', b'SUI']:
    idx = raw.find(pat)
    print(pat.decode(), 'idx', idx)
    if idx != -1:
        print('hex', raw[idx:idx+64].hex())
        print('text', raw[idx:idx+64].decode('latin1', errors='replace'))
        before = raw[max(0, idx-40):idx]
        print('before hex', before.hex())
        print('before text', before.decode('latin1', errors='replace'))
        print('---')
