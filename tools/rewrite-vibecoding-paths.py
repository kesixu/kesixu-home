#!/usr/bin/env python3
"""把 vibecoding/ 整站内部绝对路径加 /vibecoding/ 前缀。
规则：
  A. 主域名绝对 URL  https://kesixu.com/  ->  https://kesixu.com/vibecoding/
  B. 内部资源路径    "/xxx  ->  "/vibecoding/xxx   （assets/fonts/vendor/style.css/main.js/pathbot/matchpoint/zaojian/aurelia/probe.html）
  C. 首页链接        href="/"  ->  href="/vibecoding/"
绝不触碰：子域名外链(yinian/gym/textbook/quanjian/game/resume.kesixu.com)、
          github、lovable.app、ncbi.nlm.nih.gov、mailto:、data:、协议相对 //。
"""
import os
import sys

ROOT = "site/vibecoding"

# 顺序敏感：A 先做（把 og:image 的 https://kesixu.com/assets/... 先变成 vibecoding/assets/...），
# 再做 B（此时 "/assets 不会误命中已含 vibecoding 的 URL 里）。
REPLACEMENTS = [
    # A. 主域名绝对 URL（精确带斜杠，避免误伤子域名，子域名是 resume.kesixu.com 前面有别的字符）
    ("https://kesixu.com/", "https://kesixu.com/vibecoding/"),
    # C. 首页裸链接（pathbot 页脚"我的其他作品"）
    ('href="/"', 'href="/vibecoding/"'),
    # B. 内部资源绝对路径（双引号 + 单引号两种）
    ('"/assets/', '"/vibecoding/assets/'),
    ("'/assets/", "'/vibecoding/assets/"),
    ('"/fonts/', '"/vibecoding/fonts/'),
    ("'/fonts/", "'/vibecoding/fonts/"),
    ('"/vendor/', '"/vibecoding/vendor/'),
    ("'/vendor/", "'/vibecoding/vendor/"),
    ('"/style.css', '"/vibecoding/style.css'),
    ('"/main.js', '"/vibecoding/main.js'),
    ('"/pathbot/', '"/vibecoding/pathbot/'),
    ("'/pathbot/", "'/vibecoding/pathbot/"),
    ('"/matchpoint/', '"/vibecoding/matchpoint/'),
    ("'/matchpoint/", "'/vibecoding/matchpoint/"),
    ('"/zaojian/', '"/vibecoding/zaojian/'),
    ("'/zaojian/", "'/vibecoding/zaojian/"),
    ('"/aurelia/', '"/vibecoding/aurelia/'),
    ("'/aurelia/", "'/vibecoding/aurelia/"),
    ('"/probe.html', '"/vibecoding/probe.html'),
]

EXT = {".html", ".css", ".js", ".xml", ".txt"}

def rewrite(path):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    orig = text
    total = 0
    for old, new in REPLACEMENTS:
        n = text.count(old)
        if n:
            text = text.replace(old, new)
            total += n
    if text != orig:
        with open(path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"{path}: {total} 处替换")
    return total

if __name__ == "__main__":
    grand = 0
    for dirpath, _dirs, files in os.walk(ROOT):
        for fn in files:
            if os.path.splitext(fn)[1].lower() in EXT:
                grand += rewrite(os.path.join(dirpath, fn))
    print(f"\n共 {grand} 处替换")
