#!/usr/bin/env python3
"""OpenAI 图像生成管线(gpt-image 系):读 ~/.env.openai 的 OPENAI_API_KEY。
用法: genart.py <out.png> <size> <background:transparent|auto> <prompt...>
模型顺序尝试 gpt-image-2 → gpt-image-1;b64 落盘;失败打印 API 错误。"""
import sys, os, json, base64, urllib.request

def key():
    for line in open(os.path.expanduser("~/.env.openai")):
        line = line.strip()
        if line.startswith("OPENAI_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"')
    raise SystemExit("no OPENAI_API_KEY in ~/.env.openai")

def gen(out, size, background, prompt):
    k = key()
    for model in ("gpt-image-2", "gpt-image-1"):
        body = {"model": model, "prompt": prompt, "size": size, "n": 1}
        if background == "transparent":
            body["background"] = "transparent"
            body["output_format"] = "png"
        req = urllib.request.Request(
            "https://api.openai.com/v1/images/generations",
            data=json.dumps(body).encode(),
            headers={"Authorization": "Bearer " + k, "Content-Type": "application/json"})
        try:
            resp = json.load(urllib.request.urlopen(req, timeout=300))
            b64 = resp["data"][0]["b64_json"]
            open(out, "wb").write(base64.b64decode(b64))
            print(f"OK {model} -> {out} ({os.path.getsize(out)//1024}KB)")
            return
        except urllib.error.HTTPError as e:
            err = e.read().decode()[:300]
            print(f"[{model}] HTTP {e.code}: {err}")
            if e.code in (400, 404) and "model" in err:
                continue
            raise
    raise SystemExit("all models failed")

if __name__ == "__main__":
    gen(sys.argv[1], sys.argv[2], sys.argv[3], " ".join(sys.argv[4:]))
