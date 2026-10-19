#!/usr/bin/env python3
"""projection.json (t-SNE of 19,487 fine-tuned embeddings, computed on kudu) -> compact projection.bin
Layout: magic 'AURP' (4B) | uint32 n | then n * (uint16 x, uint16 y, uint8 dyn) little-endian. dyn: 0 unknown,1 Tang,2 Song,3 Yuan,4 Ming,5 Qing,6 Modern."""
import json, struct, sys, numpy as np
src, dst = sys.argv[1], sys.argv[2]
d = json.load(open(src)); xy = np.array(d['xy'], dtype=np.float32)
xy = (xy - xy.min(0)) / (xy.max(0) - xy.min(0)); q = np.round(xy * 65535).astype(np.uint16)
code = {'Tang': 1, 'Song': 2, 'Yuan': 3, 'Ming': 4, 'Qing': 5, 'Modern': 6}
dyn = np.array([code.get(x, 0) if isinstance(x, str) else 0 for x in d['dynasty']], dtype=np.uint8)
with open(dst, 'wb') as f:
    f.write(b'AURP'); f.write(struct.pack('<I', len(q)))
    rec = np.zeros(len(q), dtype=[('x', '<u2'), ('y', '<u2'), ('d', 'u1')]); rec['x'] = q[:, 0]; rec['y'] = q[:, 1]; rec['d'] = dyn
    f.write(rec.tobytes())
import os, collections
print('n', len(q), 'bytes', os.path.getsize(dst), 'dyn', collections.Counter(dyn.tolist()), 'method', d['method'])
