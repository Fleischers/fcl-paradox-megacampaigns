from pathlib import Path
import zipfile

path = Path('../../campaign-2026-07-12-the-first/game-1-imperator-rome/save-games/FCL1-2026-07-26-C.rome')
data = path.read_bytes()
start = data.find(b'PK\x03\x04')
print('zip start', start)
assert start != -1

with zipfile.ZipFile(path.open('rb')) as zf:
    print('entries from direct file:')
    for info in zf.infolist():
        print(info.filename, info.compress_type, info.file_size, info.compress_size)

# try opening from embedded offset slice
from io import BytesIO
zip_data = BytesIO(data[start:])
with zipfile.ZipFile(zip_data) as zf2:
    print('\nentries from embedded zip slice:')
    for info in zf2.infolist():
        print(info.filename, info.compress_type, info.file_size, info.compress_size)
        with zf2.open(info) as f:
            sample = f.read(512)
            print(' sample:', repr(sample[:200]))
            print(' startswith', sample[:20])
            if info.filename.endswith('.rome') or info.filename.endswith('.yml') or info.filename.endswith('.sav'):
                print('### content sample ###')
                print(sample[:1000].decode('latin1', errors='replace'))
                break
