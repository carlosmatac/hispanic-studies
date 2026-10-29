import struct, sys
f = open(sys.argv[1], 'rb'); enc = sys.argv[2] if len(sys.argv) > 2 else 'utf-8'
ver, y, m, d, n, hlen, rlen = struct.unpack('<BBBBIHH20x', f.read(32))
fields = []
while True:
    b = f.read(32)
    if b[0] == 0x0D: break
    fields.append((b[:11].split(b'\0')[0].decode(), chr(b[11]), b[16]))
f.seek(hlen)
print([x[0] for x in fields])
for i in range(n):
    r = f.read(rlen); pos = 1; row = []
    for name, t, l in fields:
        row.append(r[pos:pos+l].decode(enc, 'replace').strip()); pos += l
    print(row)
