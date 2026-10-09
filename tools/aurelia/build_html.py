#!/usr/bin/env python3
"""Single source of the page copy: regenerates site/vibecoding/aurelia/index.html.
Copy voice: 雅致、半文言、成语精当，普通人可读；数字只用白名单（见 spec §6.2）。"""
import json, re, os
from urllib.parse import quote
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'site', 'vibecoding', 'aurelia')
def m(subject): return 'mailto:email@kesixu.com?subject=' + quote(subject, safe='')
S_MAIN, S_AB, S_ORG, S_REP = m('Aurelia 研习内测申请'), m('Aurelia 专家标注参与'), m('Aurelia 机构研究合作'), m('Aurelia 方法报告索取')
crackle = open(os.path.join(ROOT, 'media', 'crackle.svg'), encoding='utf-8').read()
outline = json.load(open('/tmp/aurelia-v2/data/evidence.json'))['cma_135015']['outline_path'] if os.path.exists('/tmp/aurelia-v2/data/evidence.json') else None
if outline is None:  # fall back to the path already in the deployed page
    cur = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read(); outline = re.search(r'pathLength="1" d="(M[^"]+)"', cur).group(1)

def stage(vid, alt, w, h, cap, acc, size, cls='', srcset=None, sizes=None, prio=False):
    if srcset:
        extra = ' fetchpriority="high"' if prio else ' loading="lazy"'
        img = f'<img class="au-vessel" src="media/vessels/{vid}-{size}.webp" srcset="{srcset}" sizes="{sizes}" width="{w}" height="{h}" alt="{alt}" decoding="async"{extra}>'
    else:
        img = f'<img class="au-vessel" src="media/vessels/{vid}-{size}.webp" width="{w}" height="{h}" alt="{alt}" decoding="async" loading="lazy">'
    return f'''<figure class="au-stage {cls}" data-v="{vid}">
  <span class="au-box"><span class="au-shadow" aria-hidden="true"></span>{img}<span class="au-sheen" aria-hidden="true"><i></i></span></span>
  <figcaption class="au-cap">{cap}<small>{acc}</small></figcaption>
</figure>'''

SEAL = '<svg class="au-seal" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><rect x="4" y="4" width="92" height="92" rx="6"/><rect class="au-seal__inner" x="11" y="11" width="78" height="78" rx="3"/><text x="50" y="52" text-anchor="middle" dominant-baseline="central">鉴</text></svg>'


import json as _json
_D=_json.load(open("tools/aurelia/demo_reports.json",encoding="utf-8"))
_KILN={"Jun":"钧窑","Ge":"哥窑","Guan":"官窑","Longquan":"龙泉窑","Ru":"汝窑","Jingdezhen":"景德镇"}
_DYN={"Song":"宋","Yuan":"元","Ming":"明","Qing":"清"}; _REIGN={"Qianlong":"乾隆","Yongzheng":"雍正"}

_B2=_json.load(open("tools/aurelia/baseline2_results.json",encoding="utf-8"))["pe_core_l14_336"]
def fig_fooled():
    rows=[("仿钧","Jun"),("仿哥","Ge"),("仿官","Guan"),("仿龙泉","Longquan"),("仿汝","Ru")]
    out=['<div class="au-hbars" role="img" aria-label="五种仿品：被放到宋元原型旁边的比例，以及被判成清代的比例">','<p class="au-hbars__leg"><i class="au-sw au-sw--a"></i>找对原型　<i class="au-sw au-sw--b"></i>认出清代</p>']
    for zh,k in rows:
        a=_B2[f"{k}:P(style>period)_matched"]; b=_B2[f"dyn_probe:{k}:pred_Qing"]; n=_B2[f"{k}:n_imit"]
        out.append(f'<div class="au-hbars__row"><span class="au-hbars__lab">{zh}<small>n={n}</small></span><span class="au-hbars__bars"><span class="au-hbar"><i class="au-hbar__a" style="--w:{a:.3f}"></i><b>{a*100:.0f}%</b></span><span class="au-hbar"><i class="au-hbar__b" style="--w:{b:.3f}"></i><b>{b*100:.0f}%</b></span></span></div>')
    out.append("</div>"); return "".join(out)
def fig_dynasty():
    rows=[("明",8830),("清",6577),("宋",1251),("元",407),("唐",165)]
    out=['<div class="au-hbars au-hbars--strip" role="img" aria-label="两万件馆藏按朝代">']
    for zh,n in rows: out.append(f'<div class="au-hbars__row"><span class="au-hbars__lab">{zh}</span><span class="au-hbars__bars"><span class="au-hbar"><i class="au-hbar__a" style="--w:{n/8830:.3f}"></i><b>{n:,}</b></span></span></div>')
    out.append("</div>"); return "".join(out)
def fig_price():
    import math
    items=[(4.8,"赃物核查，拍卖行按件","ref"),(10,"快筛报告（拟）","us"),(25,"在线估价 Mearto","ref"),(110,"赃物核查，单次","ref"),(150,"人工复核报告（拟）","us"),(400,"热释光检测","ref"),(2200,"AI 绘画鉴真 Art Recognition","ref")]
    W=640; L=24; R=24; lo,hi=math.log10(3),math.log10(4000); X=lambda v:L+(W-L-R)*(math.log10(v)-lo)/(hi-lo)
    out=[f'<svg class="au-fig au-fig--price" viewBox="0 0 {W} 150" role="img" aria-label="单件鉴定与核查服务的价格带，美元">','<line x1="24" y1="70" x2="616" y2="70" class="f-axis"/>']
    for t in [5,10,50,100,500,1000,2000]: out.append(f'<line x1="{X(t):.1f}" y1="66" x2="{X(t):.1f}" y2="74" class="f-axis"/><text x="{X(t):.1f}" y="90" class="f-n" text-anchor="middle">${t:,}</text>')
    up=True
    for v,lab,cls in items:
        x=X(v); short=lab.replace("，","<br>").replace("（拟）","<br>（拟）").split("<br>")
        if cls=="us": out.append(f'<circle cx="{x:.1f}" cy="70" r="6" class="f-us"/>'); ty=118
        else: out.append(f'<circle cx="{x:.1f}" cy="70" r="4" class="f-ref"/>'); ty=22 if up else 44; up=not up
        for j,ln in enumerate(short): out.append(f'<text x="{x:.1f}" y="{ty+j*14}" class="{"f-lab-us" if cls=="us" else "f-lab-s"}" text-anchor="middle">{ln}</text>')
    out.append("</svg>")
    lst=['<ul class="au-pricelist">']+[f'<li class="{"is-us" if c=="us" else ""}"><span>{lab}</span><b>${v:,.0f}</b></li>' for v,lab,c in sorted(items,key=lambda t:t[0])]+["</ul>"]
    return "".join(out)+"".join(lst)
def fig_flow():
    A="media/demo/cut_npm_1321.webp"; B="media/demo/cut_npm_38059.webp"   # 宋 钧窑梅瓶 / 清 乾隆仿钧花口瓶
    def img(href,w,h,cls="",extra=""):
        return f'<image href="{href}" x="{-w/2:.0f}" y="{-h/2:.0f}" width="{w}" height="{h}" preserveAspectRatio="xMidYMid meet" class="{cls}" {extra}/>'
    SPL="0.45 0.05 0.3 1"
    def tokm(cls,inner,vals,kt):
        n=len(kt.split(";"))-1
        return (f'<g class="fl-tok {cls}">{inner}<animateTransform attributeName="transform" type="translate" values="{vals}" keyTimes="{kt}" dur="12s" repeatCount="indefinite" calcMode="spline" keySplines="{";".join([SPL]*n)}"/>'
                f'<animate attributeName="opacity" values="0;1;1;1;0;0" keyTimes="0;.06;.5;.54;.58;1" dur="12s" repeatCount="indefinite"/></g>')
    def toko(cls,inner,dest):
        return (f'<g class="fl-tok {cls}">{inner}<animateTransform attributeName="transform" type="translate" values="720 215;720 215;{dest};{dest}" keyTimes="0;.58;.76;1" dur="12s" repeatCount="indefinite" calcMode="spline" keySplines="{SPL};{SPL};{SPL}"/>'
                f'<animate attributeName="opacity" values="0;0;1;1;1;0" keyTimes="0;.58;.62;.76;.95;1" dur="12s" repeatCount="indefinite"/></g>')
    grid="".join(f'<circle cx="{-26+i*13}" cy="{-26+j*13}" r="2.2"/>' for i in range(5) for j in range(5))
    return f'''<div class="au-flowwrap"><svg class="au-flow" viewBox="0 0 1000 430" role="img" aria-label="训练法示意：宋钧梅瓶与清乾隆仿钧花口瓶一起进入模型，风格一路把两件放进同一格，做工一路把它们分进宋与清">
<defs>
  <linearGradient id="fl-tile" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1A2422"/><stop offset="1" stop-color="#0F1416"/></linearGradient>
  <radialGradient id="fl-halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#9DBBB0" stop-opacity=".22"/><stop offset="1" stop-color="#9DBBB0" stop-opacity="0"/></radialGradient>
</defs>
<g class="fl-lines"><path d="M180,150 C250,150 250,215 330,215"/><path d="M180,300 C250,300 250,215 330,215"/><path d="M370,215 H490"/><path d="M570,215 H672"/><path d="M768,200 C820,200 820,120 850,120"/><path d="M768,230 C820,230 820,310 850,310"/></g>
<g transform="translate(110,150)"><circle r="78" fill="url(#fl-halo)"/>{img(A,120,140)}<text class="fl-cap" y="86" text-anchor="middle">宋 · 钧窑梅瓶</text></g>
<g transform="translate(110,300)"><circle r="78" fill="url(#fl-halo)"/>{img(B,120,120)}<text class="fl-cap" y="80" text-anchor="middle">清 乾隆 · 仿钧釉花口瓶</text></g>
{tokm("fl-t1",img(A,54,64),"110 150;330 215;530 215;700 208;720 215","0;.22;.4;.54;.58")}{tokm("fl-t2",img(B,54,54),"110 300;330 215;530 215;700 222;720 215","0;.22;.4;.54;.58")}
<g class="fl-node" transform="translate(330,215)"><rect x="-34" y="-40" width="68" height="80" rx="34" class="fl-dash"/><text class="fl-nl" y="66" text-anchor="middle">看图</text><text class="fl-ns" y="84" text-anchor="middle">自动分出器物</text></g>
<g class="fl-node" transform="translate(530,215)"><g class="fl-grid">{grid}</g><text class="fl-nl" y="66" text-anchor="middle">看懂</text><text class="fl-ns" y="84" text-anchor="middle">开源视觉大模型</text><text class="fl-nx" y="100" text-anchor="middle">Meta Perception Encoder · DINOv3 · Google SigLIP 2</text></g>
<g class="fl-node" transform="translate(720,215)"><rect x="-48" y="-36" width="96" height="72" rx="6" fill="url(#fl-tile)" class="fl-tile"/><rect x="26" y="-28" width="12" height="12" rx="1.5" class="fl-sealdot"/><text class="fl-nl" y="66" text-anchor="middle">分开两件事</text></g>
<g class="fl-shelf" transform="translate(900,120)"><rect x="-58" y="-48" width="116" height="96" rx="6"/><text class="fl-ns" x="0" y="-58" text-anchor="middle">风格 · 仿的是谁</text><text class="fl-sl" x="0" y="62" text-anchor="middle">钧窑</text></g>
<g class="fl-shelf" transform="translate(900,310)"><rect x="-58" y="-48" width="52" height="96" rx="6"/><rect x="6" y="-48" width="52" height="96" rx="6"/><text class="fl-ns" x="0" y="-58" text-anchor="middle">做工 · 出自谁手</text><text class="fl-sl" x="-32" y="62" text-anchor="middle">宋</text><text class="fl-sl" x="32" y="62" text-anchor="middle">清</text></g>
{toko("fl-s1",img(A,44,52),"888 118")}{toko("fl-s2",img(B,44,44),"912 124")}{toko("fl-k1",img(A,40,48),"868 308")}{toko("fl-k2",img(B,40,40),"932 308")}
<text class="fl-out" x="900" y="405" text-anchor="middle">风格最像钧窑 · 做工属清代</text>
</svg></div>'''

def demo_cards():
    NOTE={"npm:35659":"哥、官两窑釉色相近，最像的几件落在官窑，行家也常并看。","npm:38059":"第三件是龙泉贯耳壶，形近釉远，检索偏看轮廓。"}
    out=[]
    for oid in _D["pick"]:
        r=_D["reports"][oid]; m=_D["meta"][oid]
        sk=max(r["style"],key=r["style"].get); sp=min(r["style"][sk],0.99); dk=max(r["period"],key=r["period"].get); dp=min(r["period"][dk],0.99)
        ok_s=sk==r["target"]; ok_d=dk=="Qing"; tgt=_KILN[r["target"]]; reign=_REIGN.get(m.get("reign"),"清")
        if ok_s and ok_d: verdict=f"风格最像{tgt}，做工属清代，与著录「{reign}仿{tgt[:-1]}」相符。"+NOTE.get(oid,"")
        else: verdict=f"这一件判错了，而且错得很自信：风格看成{_KILN[sk]}，做工看成{_DYN[dk]}代，著录是「{reign}仿{tgt[:-1]}」。此壶形制本出南宋官窑，正面照又看不到圈足和款。遇到这种情况，报告会标「须上手看足」。"
        nbs=""
        for n in r["neighbours"]:
            mm=_D["meta"][n["id"]]; t=mm["zh_s"]; kz=_KILN[n["kiln"]]
            head=f"{_DYN[n['dynasty']]} · {kz}" if not t.startswith(kz[:-1]) else _DYN[n["dynasty"]]
            nbs+=f'<li><img src="media/demo/{mm["file"]}" width="{mm["size"][0]}" height="{mm["size"][1]}" alt="{t}" loading="lazy" decoding="async"><span class="nb-h">{head}</span><span class="nb-t">{t}</span><span class="nb-s">接近度 {n["sim"]:.2f}</span></li>'
        out.append(f'''<article class="au-rep au-rise{'' if ok_s and ok_d else ' au-rep--miss'}">
  <figure class="au-rep__fig"><img src="media/demo/{m['file']}" width="{m['size'][0]}" height="{m['size'][1]}" alt="{m['zh_s']}" decoding="async"><figcaption>{_DYN[m['dynasty']]} {reign} · {m['zh_s']}<small>台北故宫 · 训练时没见过这件</small></figcaption></figure>
  <div class="au-rep__body">
    <div class="au-prob"><span>风格最像</span><i style="--w:{sp:.2f}"></i><b>{_KILN[sk]} {sp*100:.0f}%</b></div>
    <div class="au-prob"><span>做工年代</span><i style="--w:{dp:.2f}"></i><b>{_DYN[dk]}代 {dp*100:.0f}%</b></div>
    <p class="au-rep__verdict">{verdict}</p>
    <ul class="au-rep__nbs">{nbs}</ul>
  </div>
</article>''')
    return "\n".join(out)

html = f'''<!DOCTYPE html>
<html lang="zh-CN" class="motion-pending">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Aurelia · AI 能不能学会中式古瓷的审美</title>
<meta name="description" content="把瓷器照片交给它，它在两万件博物馆藏品里找出最像的几件，并标出像在哪里。研习用途，邀请内测">
<meta name="theme-color" content="#121619">
<meta property="og:type" content="website">
<meta property="og:title" content="Aurelia · AI 能不能学会中式古瓷的审美">
<meta property="og:description" content="把瓷器照片交给它，它在两万件博物馆藏品里找出最像的几件，并标出像在哪里">
<meta property="og:url" content="https://kesixu.com/vibecoding/aurelia/">
<meta property="og:image" content="https://kesixu.com/vibecoding/aurelia/media/og.jpg">
<link rel="canonical" href="https://kesixu.com/vibecoding/aurelia/">
<link rel="icon" type="image/svg+xml" href="/vibecoding/assets/favicon.svg">
<link rel="preload" as="font" type="font/woff2" href="fonts/sans-300-aurelia.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="fonts/sans-400-aurelia.woff2" crossorigin>
<link rel="preload" as="image" href="media/vessels/cma_140168-900.webp" imagesrcset="media/vessels/cma_140168-900.webp 900w, media/vessels/cma_140168-1400.webp 1400w" imagesizes="(min-width:900px) 40vw, 78vw">
<link rel="stylesheet" href="aurelia.css?v=26">
</head>
<body>
<a class="au-skip" href="#main">跳到内容</a>

<div class="au-sky" aria-hidden="true">
  <div class="au-lattice"></div>
  <div class="au-haze"></div>
  <div class="au-moonwrap"><div class="au-moon"></div></div>
</div>
<span class="au-ember" aria-hidden="true"></span>
<div class="au-paper" aria-hidden="true"></div>

<nav class="au-nav" aria-label="站内">
  <a class="au-back" href="/vibecoding/">← kesixu.com</a>
  <span class="au-mark">AURELIA · 古瓷风格比对</span>
</nav>

<main id="main">

<!-- ═══ S1 月出 · 开卷 ═══ -->
<section class="au-s au-s1" id="s1" aria-label="开卷">
  <div class="au-wrap au-hero">
    <div class="au-hero__text">
      <p class="au-eyebrow au-intro">Aurelia · 古瓷风格比对</p>
      <h1 class="au-h1 au-intro">AI 能不能学会<br><span class="au-nw">中国古瓷的审美</span></h1>
      <p class="au-lede au-intro">第一步是看懂：把瓷器照片交给它，它在<span class="nw">两万件</span>博物馆藏品里找出最像的几件，并标出<span class="nw">像在哪里</span>。</p>
      <div class="au-cta au-intro">
        <a class="au-btn au-btn--moon" href="{S_MAIN}">申请内测</a>
        <a class="au-btn" href="/vibecoding/">看其他作品</a>
      </div>
    </div>
    {stage('cma_140168', '明 永乐 甜白釉暗花梅瓶，克利夫兰艺术博物馆 1964.167', 877, 1419, '明 永乐 · 甜白釉暗花梅瓶', '克利夫兰艺术博物馆 1964.167', 900, 'au-stage--hero au-intro', srcset='media/vessels/cma_140168-900.webp 900w, media/vessels/cma_140168-1400.webp 1400w', sizes='(min-width:900px) 40vw, 78vw', prio=True)}
  </div>
  <p class="au-scroll-hint au-intro" aria-hidden="true"><span>向下</span><i></i></p>
</section>

<!-- ═══ S2 看器，贵在上手 ═══ -->
<section class="au-s au-s2" id="s2" aria-label="为何是比对">
  <div class="au-wrap au-two">
    {stage('cma_97956', '宋 钧窑 莲蕾罐，克利夫兰艺术博物馆 1917.60', 1060, 967, '宋 钧窑 · 莲蕾罐', '克利夫兰艺术博物馆 1917.60 · 本页的天青色来自它', 1100, 'au-stage--s2')}
    <div class="au-text">
      <h2 class="au-h2 au-rise">审美，从看懂开始</h2>
      <p class="au-p au-rise">行家看一件瓷器，看器型、胎釉、纹饰、款识和做工：上手掂分量，翻过来看足看胎，侧光看釉面。<span class="nw">功夫都在手上</span>。</p>
      <p class="au-p au-rise">AI 学这套眼光，先学照片看得出的部分：把一件器物放进两万件馆藏里比一比，说出它最像谁、<span class="nw">像在哪</span>。</p>
    </div>
  </div>
</section>


<!-- ═══ S3 五馆同堂 ═══ -->
<section class="au-s au-s3" id="s3" aria-label="语料">
  <canvas class="au-space" aria-hidden="true"></canvas>
  <div class="au-wrap">
    <h2 class="au-h2 au-rise">两万件馆藏，一次看遍</h2>
    <p class="au-bignum au-rise"><span class="au-num">19,487</span><span class="au-bignum__lab">件 · 开放馆藏</span></p>
    <p class="au-fine au-rise au-sources"><span class="nw">台北故宫 14,557</span> · <span class="nw">英国 V&amp;A 3,473</span> · <span class="nw">克利夫兰 699</span> · <span class="nw">芝加哥 673</span> · <span class="nw">大都会 85</span></p>
    <div class="au-figwrap au-rise">{fig_dynasty()}</div>
    <div class="au-arc">
      {stage('cma_134843', '宋 汝窑 笔洗，克利夫兰艺术博物馆 1957.40', 1346, 523, '宋 汝窑 · 笔洗', '克利夫兰 1957.40', 900, 'au-stage--arc au-wide')}
      {stage('cma_135015', '南宋 官窑 葵口碗，克利夫兰艺术博物馆 1957.66', 1508, 808, '南宋 官窑 · 葵口碗', '克利夫兰 1957.66', 900, 'au-stage--arc au-wide')}
      {stage('cma_121469', '宋 建窑 兔毫盏，克利夫兰艺术博物馆 1942.132', 1484, 1011, '宋 建窑 · 兔毫盏', '克利夫兰 1942.132', 900, 'au-stage--arc au-wide')}
      {stage('met_49855', '元 青花莲池纹玉壶春瓶，大都会艺术博物馆 1984.297', 653, 1349, '元 · 青花莲池纹玉壶春瓶', '大都会 1984.297', 900, 'au-stage--arc')}
      {stage('met_39666', '明 宣德 青花云龙纹罐，大都会艺术博物馆 37.191.1', 947, 1004, '明 宣德 · 青花云龙纹罐', '大都会 37.191.1', 900, 'au-stage--arc')}
      {stage('cma_154732', '清 雍正 釉里红海水龙纹梅瓶，克利夫兰艺术博物馆 1989.314', 870, 1477, '清 雍正 · 釉里红海水龙纹梅瓶', '克利夫兰 1989.314', 900, 'au-stage--arc')}
      {stage('cma_112196', '清 雍正 粉彩蝠桃纹盘，克利夫兰艺术博物馆 1930.639', 1612, 1613, '清 雍正 · 粉彩蝠桃纹盘', '克利夫兰 1930.639', 900, 'au-stage--arc au-wide')}
    </div>
    <p class="au-fine au-fine--note">器物照片来自克利夫兰、大都会两馆开放获取（CC0）。</p>
  </div>
</section>

<!-- ═══ S4 闭卷而试 ═══ -->
<section class="au-s au-s4" id="s4" aria-label="结果">
  <div class="au-wrap">
    <h2 class="au-h2 au-rise">答对多少</h2>
    <p class="au-p au-rise">拿 <span class="nw">2,435 件</span>训练时没见过的器物当考题，看前五个答案里有几件跟它同朝代、<span class="nw">同器型</span>：</p>
    <div class="au-bars au-rise">
      <div class="au-bargroup">
        <p class="au-bargroup__t">前五命中率 precision@5</p>
        <div class="au-bar"><span class="au-bar__lab">微调前</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.795"></i></span><b>79.5%</b></div>
        <div class="au-bar"><span class="au-bar__lab">微调后</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--after" style="--w:.847"></i></span><b>84.7%</b></div>
        <p class="au-bar__delta">+5.2 分</p>
      </div>
      <div class="au-bargroup">
        <p class="au-bargroup__t">排序得分 nDCG@10，满分 1</p>
        <div class="au-bar"><span class="au-bar__lab">微调前</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.778"></i></span><b>0.778</b></div>
        <div class="au-bar"><span class="au-bar__lab">微调后</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--after" style="--w:.847"></i></span><b>0.847</b></div>
        <p class="au-bar__delta">+0.069</p>
      </div>
    </div>
    <p class="au-fine au-rise">命中 = 同朝代且同器型。</p>
    <div class="au-routes au-rise">
      <p class="au-bargroup__t">试过六条技术路线（nDCG@10）</p>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">OpenCLIP 微调</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--after" style="--w:.847"></i></span><b>0.847</b></div>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">DINOv3 微调 + 自蒸馏</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.824"></i></span><b>0.824</b></div>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">DINOv3 微调</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.822"></i></span><b>0.822</b></div>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">DINOv3 冻结</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.779"></i></span><b>0.779</b></div>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">OpenCLIP 冻结</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.778"></i></span><b>0.778</b></div>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">SDXL 生成器特征</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.689"></i></span><b>0.689</b></div>
      <p class="au-p au-p--small">微调 OpenCLIP 最好，前三名只差两分多。</p>
    </div>
  </div>
</section>

<!-- ═══ S13 报告 ═══ -->
<section class="au-s au-s13" id="s13" aria-label="报告样例">
  <div class="au-wrap">
    <h2 class="au-h2 au-rise">它交出的报告</h2>
    <p class="au-p au-rise">下面四件清代仿品，模型训练时一件也没见过。结果一次算出，原样照登。这批留出的 <span class="nw">38 件</span>里，年代认对 <span class="nw">35 件</span>，风格认对 <span class="nw">36 件</span>；同类仿品训练时进过，整类都没见过时初步只认对一成半，这正是下一步要攻的。</p>
    {demo_cards()}
    <p class="au-fine au-rise">百分比为模型打分，封顶 99。图片：国立故宫博物院开放资料（CC BY 4.0）。</p>
  </div>
</section>
<!-- ═══ S11 核心发现 ═══ -->
<section class="au-s au-s11" id="s11" aria-label="发现">
  <div class="au-wrap">
    <h2 class="au-h2 au-rise">AI 学审美的第一课<br><span class="nw">分清「像」与「是」</span></h2>
    <p class="au-p au-rise">雍正、乾隆两朝御窑厂奉旨仿古，著录直书「仿某釉」：<span class="nw">仿钧</span>、<span class="nw">仿哥</span>、<span class="nw">仿官</span>、<span class="nw">仿龙泉</span>、<span class="nw">仿汝</span>。台北故宫著录带「仿」字的有 <span class="nw">352 件</span>，<span class="nw">282 件</span>在我们库里，其中清代仿这五种釉的 <span class="nw">190 件</span>。</p>
    <p class="au-p au-rise au-p--pull">宫廷选择仿什么，是那个时代趣味留下的记录。</p>
    <p class="au-p au-rise">对机器学习来说，这是少有的实验条件：同一种风格，隔了五六百年由两处窑场各做一遍，出自谁手，早有定论。我们拿这个「仿」字当老师，教模型分开两件事：<span class="nw">它仿的是谁</span>，<span class="nw">它出自谁手</span>。查了 222 篇论文和 10 件最接近的专利，据我们检索，还没人这样做过。</p>
    <div class="au-figwrap au-rise">
      <p class="au-figcap">顶尖通用视觉模型怎么看这 <span class="nw">190 件</span>清代仿品（图为 Meta 的 PE-Core 模型）</p>
      {fig_fooled()}
      <p class="au-fine">五个模型结果相近。参照：随便猜，找对原型是五成；同一断代器对普通清代器物能认对八成。</p>
    </div>
    <p class="au-p au-rise">模型记住的是器物「仿的是谁」，对「出自谁手」只看见一部分。行家靠的正是后者：胎、足、釉面的质感。我们正用这批仿品训练一个双头模型，一头认风格，一头认做工，两头互不干扰。</p>
    <div class="au-figwrap au-figwrap--flow au-rise">
      <p class="au-figcap">一张图看懂训练法</p>
      {fig_flow()}
      <p class="au-fine">风格一路要把两件放进同一格，做工一路要把它们分进宋与清。两路互相牵制，模型只能把「像」和「是」分开学。</p>
    </div>
    <div class="au-todos au-rise">
      <div class="au-todo"><span class="au-todo__k">整类仿品都没见过时，仍认出清代的比例</span><span class="au-todo__v">初步一成半 · 训练中</span></div>
      <div class="au-todo"><span class="au-todo__k">泄露真实年代的部位：圈足、釉面还是口沿</span><span class="au-todo__v">待补 · 训练中</span></div>
      <div class="au-todo"><span class="au-todo__k">跨文化检验：V&amp;A 的 88 件欧洲仿中国瓷</span><span class="au-todo__v">待补</span></div>
      <div class="au-todo"><span class="au-todo__k">公开真仿对照题 CArtBench，10 对里通用大模型目前答对 6 对</span><span class="au-todo__v">待补</span></div>
    </div>
    <h3 class="au-h3 au-rise">难抄的是什么</h3>
    <ul class="au-bullets au-rise">
      <li>通用模型说得出它像谁，说不出它是清代做的。我们补的是后一半，报告里那句「风格最像宋钧，做工属清代仿钧」就是它。行家说的「仿得了样，仿不了时代」，分的正是这两头。</li>
      <li>「仿」的著录是公开的，谁都拿得到。难抄的是攒下来的东西：行家逐件的标注、成交之后回流的结果，以及每句结论都带馆方编号的证据链。</li>
      <li>同一套办法可照搬到任何有「仿」著录的品类：青铜、玉器、书画。先做的人先攒下裁定过的数据。</li>
    </ul>
  </div>
</section>


<!-- ═══ S5 开片 · 证据 ═══ -->
<section class="au-s au-s5" id="s5" aria-label="证据">
  <div class="au-wrap au-two au-two--ev">
    <div class="au-evstage">
      {crackle}
      <figure class="au-stage au-stage--ev" data-v="cma_135015">
        <span class="au-box"><span class="au-shadow" aria-hidden="true"></span><img class="au-vessel" src="media/vessels/cma_135015-900.webp" srcset="media/vessels/cma_135015-900.webp 900w, media/vessels/cma_135015-1400.webp 1400w" sizes="(min-width:900px) 44vw, 84vw" width="1508" height="808" alt="南宋 官窑 葵口碗，克利夫兰艺术博物馆 1957.66" decoding="async" loading="lazy"><span class="au-sheen" aria-hidden="true"><i></i></span><span class="au-sheen au-sheen--v" aria-hidden="true"><i></i></span><svg class="au-outline" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path pathLength="1" d="{outline}"/></svg><span class="au-part au-part--rim" aria-hidden="true">口沿</span><span class="au-part au-part--body" aria-hidden="true">腹</span><span class="au-part au-part--foot" aria-hidden="true">圈足</span></span>
        <figcaption class="au-cap">南宋 官窑 · 葵口碗<small>克利夫兰艺术博物馆 1957.66</small></figcaption>
      </figure>
    </div>
    <div class="au-text">
      <p class="au-eyebrow au-rise">怎么做到</p>
      <h2 class="au-h2 au-rise">它怎么看一件器物</h2>
      <ol class="au-steps">
        <li class="au-step" data-step="1"><b>先把器物从背景里分出来</b><span>月色轮廓就是模型给出的边界。150 件样本上与人工标注的重合度 0.884。</span></li>
        <li class="au-step" data-step="2"><b>按行家的顺序看</b><span>口沿、腹部、圈足。只看一个部位，前五个结果里约 65% 同朝代，还在验证。</span></li>
        <li class="au-step" data-step="3"><b>量三把尺子</b>
          <dl class="au-measure">
            <div><dt>轮廓对称</dt><dd>98.2<i>%</i></dd><small>与镜像的重合度 IoU</small></div>
            <div><dt>釉面色差</dt><dd>16.3</dd><small>Lab 色差标准差 · 素釉开片</small></div>
            <div><dt>纹饰密度</dt><dd>1.1<i>%</i></dd><small>器身边缘像素占比</small></div>
          </dl>
          <span class="au-fine">以这只碗为例，本页实算。</span></li>
      </ol>
      <p class="au-p au-rise">尺子只量长短。开片、兔毫、窑变各有各的精彩，美丑由人来定。</p>
    </div>
  </div>
</section>

<!-- ═══ S6 一瓶，五亲 ═══ -->
<section class="au-s au-s6" id="s6" aria-label="检索">
  <div class="au-wrap au-wrap--rel">
    <h2 class="au-h2 au-rise">看一个例子</h2>
    <div class="au-query">
      {stage('cma_134979', '南宋 龙泉窑 梅瓶，克利夫兰艺术博物馆 1957.52', 898, 1509, '查询 · 南宋 龙泉窑 · 梅瓶', '克利夫兰艺术博物馆 1957.52', 1100, 'au-stage--q')}
    </div>
    <svg class="au-beams" aria-hidden="true" focusable="false"><path pathLength="1" d=""/><path pathLength="1" d=""/><path pathLength="1" d=""/><path pathLength="1" d=""/><path pathLength="1" d=""/></svg>
    <ol class="au-nbs">
      <li class="au-nb"><span class="au-spot" aria-hidden="true"></span>{stage('aic_80869', '西夏 黑釉剔花梅瓶，芝加哥艺术博物馆 80869', 477, 994, '西夏 · 黑釉剔花梅瓶', '芝加哥 80869<br>接近度 0.859', 700, 'au-stage--nb')}</li>
      <li class="au-nb"><span class="au-spot" aria-hidden="true"></span>{stage('cma_134997', '宋 龙泉窑 五管瓶，克利夫兰艺术博物馆 1957.53', 690, 1128, '宋 龙泉窑 · 五管瓶', '克利夫兰 1957.53<br>接近度 0.857', 700, 'au-stage--nb')}</li>
      <li class="au-nb"><span class="au-spot" aria-hidden="true"></span>{stage('cma_284746', '宋 刻花梅瓶，克利夫兰艺术博物馆 2017.20', 903, 1460, '宋 · 刻花梅瓶', '克利夫兰 2017.20<br>接近度 0.848', 700, 'au-stage--nb')}</li>
      <li class="au-nb"><span class="au-spot" aria-hidden="true"></span>{stage('cma_153286', '宋 梅瓶，克利夫兰艺术博物馆 1986.245', 548, 1391, '宋 · 梅瓶', '克利夫兰 1986.245<br>接近度 0.846', 700, 'au-stage--nb')}</li>
      <li class="au-nb"><span class="au-spot" aria-hidden="true"></span>{stage('aic_58904', '北宋 婴戏纹盖梅瓶，芝加哥艺术博物馆 58904', 515, 919, '北宋 · 婴戏纹盖梅瓶', '芝加哥 58904<br>接近度 0.844', 700, 'au-stage--nb')}</li>
    </ol>
    <p class="au-p au-rise">一只南宋龙泉梅瓶，找出最像的五件，四件是宋代梅瓶。排第一的竟是一件西夏黑釉剔花梅瓶：器形最接近，釉色却差得远。它告诉你的，<span class="nw">是哪里像</span>。</p>
    <p class="au-fine au-rise">演示在 <span class="nw">1,372 件</span> CC0 馆藏中检索。</p>
  </div>
</section>


<!-- ═══ S12 生意 ═══ -->
<section class="au-s au-s12" id="s12" aria-label="生意">
  <div class="au-wrap">
    <h2 class="au-h2 au-rise">能做成什么生意</h2>
    <p class="au-p au-rise">我们在做一个工具：看图比对中国古瓷。一张照片进去，出来一份可核对的报告：它最像博物馆里的哪几件，像在哪里，风格属于哪个窑口，时代特征与所称年代是否相符。每句结论都带馆方编号，按件收费，人工复核分级。</p>
    <h3 class="au-h3 au-rise">市场在哪</h3>
    <div class="au-kpis au-rise">
      <div class="au-kpi"><b>42.7<i>亿元</i></b><span>2025 年上半年内地百家拍卖行的瓷玉杂项成交额，占 38.7%，是唯一正增长的板块</span></div>
      <div class="au-kpi"><b>51%</b><span>瓷玉杂项占境外中国文物艺术品成交额的比重，2024 年</span></div>
      <div class="au-kpi"><b>30.7<i>万件</i></b><span>2024 年内地文物艺术品拍卖成交量，含书画杂项，每件上拍前都要经人过眼</span></div>
      <div class="au-kpi"><b>40<i>万件/年</i></b><span>拍卖行已经在按件付费核查拍品是否为赃物，每件 3.66 英镑</span></div>
    </div>
    <h3 class="au-h3 au-rise">同类服务卖多少钱</h3>
    <div class="au-figwrap au-rise">
      <p class="au-figcap">单件核查与鉴定服务现行价格（美元）</p>
      {fig_price()}
      <p class="au-fine">公开价来源：失窃艺术品登记处 Art Loss Register、在线估价 Mearto、热释光检测 Oxford Authentication、AI 鉴真 Art Recognition。</p>
    </div>
    <h3 class="au-h3 au-rise">我们怎么收费</h3>
    <div class="au-tiers au-rise">
      <div class="au-tier"><b>$6<i>/件</i></b><span>机构快筛，年包</span><small>全自动，边际成本几分钱，毛利 95% 以上</small></div>
      <div class="au-tier"><b>$19<i>/件</i></b><span>单件快筛</span><small>藏家与顾问零售价</small></div>
      <div class="au-tier"><b>$149<i>/件</i></b><span>专家复核报告</span><small>行家 20 分钟签字，毛利约三分之二</small></div>
      <div class="au-tier"><b>$490<i>/件</i></b><span>保险与贷款报告</span><small>可写进合同的依据，按估值分档</small></div>
    </div>
    <p class="au-p au-rise">机构快筛走量，专家复核赚钱，保险与贷款报告定价最高。一万份复核报告就是 150 万美元，三千份保险报告再加 150 万；上拍核查是敲门砖，大头在合同里。</p>
    <div class="au-cols">
      <div class="au-col au-rise">
        <h3>谁付钱</h3>
        <ul>
          <li>中型拍卖行、古董商：上拍前核查</li>
          <li>藏家顾问：竞投前尽调</li>
          <li>保险公司、抵押贷款方：估值依据</li>
          <li>交易平台：上架筛查</li>
        </ul>
      </div>
      <div class="au-col au-rise">
        <h3>凭什么</h3>
        <ul>
          <li>每句结论附馆方编号，可核对</li>
          <li>分得清「仿的是谁」和「出自谁手」，市面产品都没有公开做到</li>
          <li>只用开放许可与授权数据，可商用的开放馆藏图已核实超过五万件</li>
        </ul>
      </div>
      <div class="au-col au-rise">
        <h3>怎么变大</h3>
        <ul>
          <li>这份报告写进保险与贷款条款</li>
          <li>交易平台按条计费</li>
          <li>同一套办法扩到青铜、玉器、书画</li>
        </ul>
      </div>
    </div>
    <p class="au-fine au-rise">来源：中国拍卖行业协会 2024 年报；雅昌艺术市场监测中心 2025 年上半年报告；Art Loss Register 收费页。</p>
  </div>
</section>
<!-- ═══ S7 光止于此 ═══ -->
<section class="au-s au-s7" id="s7" aria-label="边界">
  <div class="au-wrap au-center">
    <p class="au-eyebrow au-rise">它的边界</p>
    <h2 class="au-h2 au-h2--line au-rise"><span class="au-nw">像不像</span><span class="au-dot">·</span><span class="au-nw">像在哪</span><span class="au-dot">·</span><span class="au-nw">判断归人</span></h2>
    <span class="au-redline" aria-hidden="true"></span>
    <p class="au-p au-rise">它答两个问题：像不像，像在哪。第三个问题已有初步答案，还在打磨：风格最像哪个窑口，做工像哪个时代，和卖家说的对不对得上。真假与价格，由人来定。<span class="nw">审美的最后一票</span>，<span class="nw">始终在人手里</span>。</p>
  </div>
</section>

<!-- ═══ S8 既成 · 方作 · 未竟 ═══ -->
<section class="au-s au-s8" id="s8" aria-label="路线与局限">
  <div class="au-wrap">
    <h2 class="au-h2 au-rise">AI 学审美，走到哪了</h2>
    <div class="au-cols">
      <div class="au-col au-rise">
        <h3>已完成</h3>
        <ul>
          <li>两万件语料上的风格检索</li>
          <li>自动分出器物，三项测量</li>
          <li>留出 2,435 件的闭卷评测</li>
        </ul>
      </div>
      <div class="au-col au-rise">
        <h3>进行中</h3>
        <ul>
          <li>审美层第一步：同朝代、同器型内的典范度与稀缺度</li>
          <li>双头模型训练中，整类仿品都没见过的严格测试陆续出结果</li>
          <li>发明专利申请</li>
        </ul>
      </div>
      <div class="au-col au-rise">
        <h3>下一步</h3>
        <ul>
          <li>按博物馆原图重新下载 700 万像素大图，看清圈足与釉面</li>
          <li>报告生成模型：把检索与两头输出写成可核对的报告</li>
          <li>审美层第二步：请行家两两比较「哪件更精」，让模型学到每个时代各自的标准</li>
        </ul>
      </div>
    </div>
    <p class="au-p au-rise">开放馆藏够了两万件，微调让检索准了 <span class="nw">5 分</span>，自动分割也已成熟。三件事今年凑齐，这件事才做得成。</p>
    {stage('cma_120203', '清 乾隆 仿哥釉八卦纹琮式瓶，克利夫兰艺术博物馆 1940.969', 728, 1459, '清 乾隆 · 仿哥釉八卦纹琮式瓶', '克利夫兰艺术博物馆 1940.969 · 「仿古」是鉴赏的老话题', 900, 'au-stage--s8')}
  </div>
</section>

<!-- ═══ S9 来函，携一器 ═══ -->
<section class="au-s au-s9" id="s9" aria-label="来信">
  <div class="au-wrap au-center">
    <h2 class="au-h2 au-rise">来信，带一件器物</h2>
    <p class="au-p au-rise">内测采用邀请制，面向研究者、博物馆与行家。说一句你在看什么，<span class="nw">附一张照片</span>。</p>
    <p class="au-fine au-rise">发起人 徐可斯 · 计算机科学博士，研究方向是医学图像分割与视觉表示学习</p>
    <p class="au-cta au-rise"><a class="au-btn au-btn--moon" href="{S_MAIN}">发张照片，试一次</a></p>
    <p class="au-doors au-rise">
      <a href="{S_AB}">参与「哪件更精」标注</a>
      <a href="{S_ORG}">机构研究合作</a>
      <a href="{S_REP}">索取方法报告</a>
    </p>
  </div>
</section>

</main>

<aside class="au-rail" aria-hidden="true"><i></i></aside>
<details class="au-toc" id="toc">
  <summary aria-label="打开卷目"><span class="o">目</span><span class="c">合</span></summary>
  <nav class="au-toc__sheet" aria-label="卷目">
    <p class="au-toc__t">卷目</p>
    <ol><li><a href="#s1"><i>一</i><span>开卷</span></a></li><li><a href="#s2"><i>二</i><span>从看懂开始</span></a></li><li><a href="#s3"><i>三</i><span>两万件馆藏</span></a></li><li><a href="#s4"><i>四</i><span>答对多少</span></a></li><li><a href="#s13"><i>五</i><span>它交出的报告</span></a></li><li><a href="#s11"><i>六</i><span>审美第一课</span></a></li><li><a href="#s5"><i>七</i><span>它怎么看</span></a></li><li><a href="#s6"><i>八</i><span>看一个例子</span></a></li><li><a href="#s12"><i>九</i><span>能做成什么生意</span></a></li><li><a href="#s7"><i>十</i><span>它的边界</span></a></li><li><a href="#s8"><i>十一</i><span>走到哪了</span></a></li><li><a href="#s9"><i>十二</i><span>来信</span></a></li></ol>
  </nav>
</details>

<footer class="au-foot">
  <ul class="au-foot__list"><li>内测采用邀请制</li><li>器物照片来自克利夫兰、大都会、芝加哥三馆开放获取（CC0）</li><li>报告样例图片来自国立故宫博物院开放资料（CC BY 4.0）</li><li>页面全部资源来自本站</li><li>© 2026 徐可斯</li></ul>
</footer>

<script src="/vibecoding/vendor/gsap.min.js" defer></script>
<script src="/vibecoding/vendor/ScrollTrigger.min.js" defer></script>
<script src="/vibecoding/vendor/lenis.min.js" defer></script>
<script src="aurelia.js?v=7" defer></script>
</body>
</html>
'''
open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(html)
print('index.html', len(html.encode()), 'bytes')
