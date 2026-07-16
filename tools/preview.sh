#!/usr/bin/env bash
# 本地预览：http://127.0.0.1:8090 （只绑回环，不对外）
cd "$(dirname "$0")/../site"
exec python3 -m http.server 8090 --bind 127.0.0.1
