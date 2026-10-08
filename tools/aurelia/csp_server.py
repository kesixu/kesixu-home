#!/usr/bin/env python3
"""Static preview server that mirrors kesixu.com's production CSP + headers so CSP violations show up locally.
Usage: csp_server.py <site_root_dir> [port]   -> serves / => site_root (so /vibecoding/... paths resolve like production)."""
import http.server, sys, os, functools
ROOT = sys.argv[1]; PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8091
CSP = ("default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; "
       "font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'")
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Content-Security-Policy', CSP)
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
    def log_message(self, *a): pass
H.extensions_map.update({'.woff2': 'font/woff2', '.webp': 'image/webp', '.avif': 'image/avif', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.mjs': 'text/javascript'})
http.server.ThreadingHTTPServer.allow_reuse_address = True
with http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(H, directory=ROOT)) as s:
    print(f'serving {ROOT} at http://127.0.0.1:{PORT}/ with production CSP', flush=True); s.serve_forever()
