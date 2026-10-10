#!/usr/bin/env python3
"""Deterministic 开片 (crackle) SVG. Two-level Voronoi: coarse primary cracks (thicker) + fine secondary cracks (thinner, partially drawn),
inside a soft ellipse. Edges grouped into 6 radial bands (inner -> outer) so the page can light them up progressively.
Usage: crackle.py out.svg [seed]"""
import sys, numpy as np
from scipy.spatial import Voronoi
seed = int(sys.argv[2]) if len(sys.argv) > 2 else 7; rng = np.random.default_rng(seed)
C = np.array([500.0, 500.0]); RX, RY = 500.0, 440.0
def inside(p, f=0.985): return ((p[0]-C[0])/RX)**2 + ((p[1]-C[1])/RY)**2 < f*f
def jitter_grid(n, lo=.12, hi=.88):
    g = int(np.sqrt(n * 4 / np.pi)) + 2; pts = []
    for i in range(g):
        for j in range(g):
            p = np.array([(i + rng.uniform(lo, hi)) / g * 2 * RX + C[0] - RX, (j + rng.uniform(lo, hi)) / g * 2 * RY + C[1] - RY])
            if inside(p): pts.append(p)
    return np.array(pts)
def edges_of(pts, keep=1.0, bend=3.0):
    vor = Voronoi(pts); out = []
    for (a, b) in vor.ridge_vertices:
        if a < 0 or b < 0: continue
        A, B = vor.vertices[a], vor.vertices[b]
        if not (inside(A) and inside(B)): continue
        if rng.uniform() > keep: continue
        M = (A + B) / 2 + rng.normal(0, bend, 2); out.append((np.linalg.norm(M - C), A, M, B))
    return out
primary = edges_of(jitter_grid(42), keep=1.0, bend=4.0)
secondary = edges_of(jitter_grid(300), keep=0.62, bend=2.0)
def band(d): return min(5, int(d / max(RX, RY) * 6.2))
def seg(A, M, B): return f'M{A[0]:.0f},{A[1]:.0f} Q{M[0]:.0f},{M[1]:.0f} {B[0]:.0f},{B[1]:.0f}'
out = ['<svg class="au-crackle" viewBox="0 0 1000 1000" aria-hidden="true" focusable="false">']
for gi in range(6):
    p = ' '.join(seg(A, M, B) for d, A, M, B in primary if band(d) == gi)
    s = ' '.join(seg(A, M, B) for d, A, M, B in secondary if band(d) == gi)
    out.append(f'<g class="ck ck{gi+1}"><path class="ck-a" d="{p}"/><path class="ck-b" d="{s}"/></g>')
out.append('</svg>'); svg = '\n'.join(out); open(sys.argv[1], 'w').write(svg)
print('primary', len(primary), 'secondary', len(secondary), 'bytes', len(svg.encode()))
