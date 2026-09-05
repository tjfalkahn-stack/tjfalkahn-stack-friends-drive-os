"""One-time source transfer. Whole-part and whole-bundle hashes are mandatory."""
import base64
import hashlib
import json
import lzma
import os
from pathlib import Path
import shutil
import subprocess

root = Path('.delivery')
out = Path(os.environ['RUNNER_TEMP']) / 'ram03-evidence'
out.mkdir(parents=True, exist_ok=True)
shutil.copytree(root, out/'transport', dirs_exist_ok=True)
m = json.loads((root/'manifest.json').read_text())
assert m['base'] == '9f84382a79a00a5bc9311cd7881e3247d1a1e55f'
assert m['head'] == '383b23b9a25c8456f022aab1cd965acee1c39dd4'
assert m['commits'] == ['f0674ec3ed34dabb8ed875ae48a0e3e1d6ff406d', '383b23b9a25c8456f022aab1cd965acee1c39dd4']
report, parts = [], []
for n, item in enumerate(m['parts'], 1):
    if n >= 12:
        chunks = sorted(root.glob(f'chunk-{n:02d}-*.b64'))
        assert len(chunks) == (2 if n == 17 else 4)
        pieces = []
        for chunk in chunks:
            if chunk.name == 'chunk-12-1.b64':
                # The original transfer differs by exactly two missing characters.
                # Use that immutable version, not the unsuccessful subsequent copy.
                raw = subprocess.check_output(['git', 'show', '1538e7119071670089408f023c9f9a1e672bba67:.delivery/chunk-12-1.b64'])
                raw = raw.replace(b'QviSp/Pt2C7', b'QviSpSp/Pt2C7')
            else:
                raw = chunk.read_bytes()
            if chunk.name == 'chunk-14-3.b64':
                raw = raw.replace(b'UkeQkeSf/nt38', b'UkeQjvAkeSf/nt38')
            pieces.append(raw.strip())
        data = b''.join(pieces) + b'\n'
    else:
        data = (root/item['name']).read_bytes()
    if n == 2:
        data = data.replace(b'wv6TcrXOOQ', b'wv6TNDcrXOOQ')
    actual = hashlib.sha256(data).hexdigest()
    report.append({'part': n, 'bytes': len(data), 'expected': item['sha256'], 'actual': actual, 'pass': actual == item['sha256']})
    parts.append(data.strip())
(out/'transport-check.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
assert all(x['pass'] for x in report), 'Integrity check failed: source NOT imported.'
packed = base64.b64decode(b''.join(parts), validate=True)
assert hashlib.sha256(packed).hexdigest() == m['packedSha256']
decoder = lzma.LZMADecompressor()
data = decoder.decompress(packed, max_length=4_000_000)
assert decoder.eof and not decoder.unused_data
assert hashlib.sha256(data).hexdigest() == m['bundleSha256']
(out/'source.bundle').write_bytes(data)
