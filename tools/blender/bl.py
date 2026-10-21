#!/usr/bin/env python3
"""Run Python inside the open Blender through the Blender Lab MCP add-on socket
(the "MCP" extension, port 9876). The code gets REPO (this repo's path).
Usage: bl.py <file.py>   or   bl.py -c "code".  The code sets `result = {...}`."""
import socket, json, sys
from pathlib import Path
REPO = str(Path(__file__).resolve().parents[2])
def run(code, timeout=1800):
    s = socket.create_connection(('127.0.0.1', 9876), timeout=timeout)
    s.sendall((json.dumps({'type': 'execute', 'code': code, 'strict_json': False}) + '\0').encode())
    buf = b''
    while b'\0' not in buf:
        c = s.recv(1 << 16)
        if not c: break
        buf += c
    return json.loads(buf.split(b'\0')[0])
if __name__ == '__main__':
    code = sys.argv[2] if sys.argv[1] == '-c' else open(sys.argv[1]).read()
    code = 'REPO = %r\n' % REPO + code
    r = run(code)
    for k in ('stdout', 'stderr'):
        if r.get(k): print(f'--- {k}\n' + r[k][-4000:])
    if r.get('status') != 'ok': print('ERROR\n' + r.get('message', '')[-4000:]); sys.exit(1)
    print(json.dumps(r.get('result'), indent=1, ensure_ascii=False)[:8000])
