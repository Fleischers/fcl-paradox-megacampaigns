from pathlib import Path
import zlib
import struct

path = Path('../../campaign-2026-07-12-the-first/game-1-imperator-rome/save-games/FCL1-2026-07-26-C.rome')
data = path.read_bytes()
print('file len', len(data))
print('head raw', data[:64])
print('head hex', data[:64].hex())
print('head ascii', data[:64].decode('latin1', errors='replace'))

# print parsed fields from the header region
print('\n=== HEADER FIELDS ===')
print('magic', data[:7])
print('magic ascii', data[:7].decode('ascii', errors='replace'))
print('bytes 7-11', data[7:11].hex())
print('bytes 11-15', data[11:15].hex())
print('bytes 15-19', data[15:19].hex())
print('bytes 19-23', data[19:23].hex())
print('bytes 23-27', data[23:27].hex())
print('bytes 27-31', data[27:31].hex())
print('bytes 31-35', data[31:35].hex())

for off in [8, 12, 16, 20, 24, 28, 32, 36, 40]:
    if off + 4 <= len(data):
        print(f'uint32 @ {off:02d}', off, struct.unpack_from('<I', data, off)[0])

# search for ASCII metadata markers near the beginning
for pat in [b'version=', b'date=', b'meta_player_name=', b'tag=', b'countries', b'country', b'primary_culture=']:
    idx = data.find(pat)
    print('search', pat, idx)

print('\n=== ZLIB CANDIDATES ===')
candidates = [b'\x78\x9c', b'\x78\xda', b'\x78\x01']
for cand in candidates:
    idx = data.find(cand)
    print('\nCAND', cand, idx)
    if idx == -1:
        continue
    # show surrounding bytes and search for block boundaries
    print(' surrounding', data[idx-16:idx+16].hex())
    for offset in range(max(0, idx-16), idx+2):
        segment = data[offset:offset+8]
        print(' offset', offset, segment.hex(), segment.decode('latin1', errors='replace'))
    for wbits in [15, 31, -15]:
        try:
            d = zlib.decompress(data[idx:], wbits)
            print('  ok wbits', wbits, 'len', len(d))
            print(d[:200].decode('latin1', errors='replace'))
        except Exception as e:
            print('  fail wbits', wbits, type(e).__name__, e)

print('\nDone.')
