#!/usr/bin/env python3
"""Single source of the page copy: regenerates site/vibecoding/aurelia/index.html.
Copy voice: 文雅而明晰，以器物与证据为本；分清实验结果、研究目标与商业设想。"""
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
    out=['<div class="au-hbars" role="img" aria-label="五类清代仿古器：更接近宋元风格原型的比例，以及年代分类器判为清代的比例">','<p class="au-hbars__leg"><i class="au-sw au-sw--a"></i>更近宋元原型　<i class="au-sw au-sw--b"></i>年代判为清代</p>']
    for zh,k in rows:
        a=_B2[f"{k}:P(style>period)_matched"]; b=_B2[f"dyn_probe:{k}:pred_Qing"]; n=_B2[f"{k}:n_imit"]
        out.append(f'<div class="au-hbars__row"><span class="au-hbars__lab">{zh}<small>n={n}</small></span><span class="au-hbars__bars"><span class="au-hbar"><i class="au-hbar__a" style="--w:{a:.3f}"></i><b>{a*100:.0f}%</b></span><span class="au-hbar"><i class="au-hbar__b" style="--w:{b:.3f}"></i><b>{b*100:.0f}%</b></span></span></div>')
    out.append("</div>"); return "".join(out)
def fig_dynasty():
    rows=[("明",8830),("清",6577),("宋",1251),("元",407),("唐",165)]
    out=['<div class="au-hbars au-hbars--strip" role="img" aria-label="研究语料的主要朝代分布：明 8830 件、清 6577 件、宋 1251 件、元 407 件、唐 165 件；其余朝代未列">']
    for zh,n in rows: out.append(f'<div class="au-hbars__row"><span class="au-hbars__lab">{zh}</span><span class="au-hbars__bars"><span class="au-hbar"><i class="au-hbar__a" style="--w:{n/8830:.3f}"></i><b>{n:,}</b></span></span></div>')
    out.append("</div>"); return "".join(out)
def fig_price():
    import math
    items=[(4.8,"失窃记录核查，机构按件","ref"),(19,"单件初筛（拟）","us"),(25,"在线估价 Mearto","ref"),(110,"失窃记录核查，单次","ref"),(149,"专家复核（拟）","us"),(400,"热释光检测","ref"),(2200,"绘画 AI 鉴真，Art Recognition","ref")]
    W=640; L=24; R=24; lo,hi=math.log10(3),math.log10(4000); X=lambda v:L+(W-L-R)*(math.log10(v)-lo)/(hi-lo)
    out=[f'<svg class="au-fig au-fig--price" viewBox="0 0 {W} 150" role="img" aria-label="外部服务调研报价与 Aurelia 拟议价格，单位为美元；服务范围各不相同">','<line x1="24" y1="70" x2="616" y2="70" class="f-axis"/>']
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
    """Two native SVG layouts share the same stages; CSS motion needs no JS."""
    A = 'media/demo/cut_npm_1321.webp'
    B = 'media/demo/cut_npm_38059.webp'
    css = '''
.au-flowwrap{overflow:visible;padding:10px 0 0}
.au-flowwrap .au-flow{width:100%;min-width:0;height:auto;overflow:visible}
.au-flowwrap .af-mobile{display:none}
.au-flowwrap text{font-family:var(--sans);font-weight:300;letter-spacing:.035em}
.af-path{fill:none;stroke:#9DBBB0;stroke-opacity:.32;stroke-width:1.4}
.af-panel{fill:#17211f;stroke:#9DBBB0;stroke-opacity:.4;stroke-width:1}
.af-title{fill:#ECE9E1;font-size:21px}
.af-note{fill:#A9B5AE;font-size:17px}
.af-label{fill:#C9DAD2;font-size:19px}
.af-brand{fill:#ECE9E1;font-size:29px;font-weight:400!important;letter-spacing:.06em!important}
.af-rule{stroke:#9DBBB0;stroke-opacity:.35;fill:none}
.af-mark{fill:#A34736}
.af-orbit{fill:none;stroke:#9DBBB0;stroke-width:1;opacity:.45}
.af-glow{animation:af-breathe 11s ease-in-out infinite}
.af-token{opacity:0;animation-duration:24s;animation-timing-function:linear;animation-iteration-count:infinite;pointer-events:none}
.af-token circle{fill:#C9DAD2;fill-opacity:.14;stroke:#C9DAD2;stroke-opacity:.45}
@keyframes af-breathe{0%,100%{opacity:.35}50%{opacity:.7}}
@media(max-width:899px){.au-flowwrap .af-wide{display:none}.au-flowwrap .af-mobile{display:block}}
@media(prefers-reduced-motion:reduce){.au-flowwrap .af-token{display:none}.au-flowwrap .af-glow{animation:none;opacity:.55}}
'''
    def image(href, x, y, w, h):
        return f'<image href="{href}" x="{x-w/2}" y="{y-h/2}" width="{w}" height="{h}" preserveAspectRatio="xMidYMid meet"/>'
    def text(x, y, words, cls='af-note'):
        return f'<text x="{x}" y="{y}" text-anchor="middle" class="{cls}">{words}</text>'
    def panel(x, y, w, h):
        return f'<rect x="{x-w/2}" y="{y-h/2}" width="{w}" height="{h}" rx="14" class="af-panel"/>'
    def model(x, y):
        return f'''<g transform="translate({x} {y})">
{panel(0,0,218,150)}
<g class="af-glow"><ellipse class="af-orbit" cx="0" cy="-34" rx="54" ry="14"/><ellipse class="af-orbit" cx="0" cy="-34" rx="35" ry="25"/><path class="af-orbit" d="M-73,-34 H73 M0,-62 V-7"/><circle cx="0" cy="-34" r="4" fill="#C9DAD2"/></g>
<path class="af-rule" d="M-94,-59 v-4 h19 M94,59 v4 h-19"/>
<rect x="79" y="-61" width="14" height="14" rx="2" class="af-mark"/>
{text(0,18,'Aurelia AI','af-brand')}{text(0,49,'分辨风格与年代','af-label')}
</g>'''
    layouts = []
    for mode in ['wide', 'mobile']:
        mobile = mode == 'mobile'
        vb = '0 0 440 875' if mobile else '0 0 1160 540'
        ins = [(110,82),(330,82)] if mobile else [(94,165),(94,370)]
        enc = (220,237) if mobile else (345,267)
        mdl = (220,403) if mobile else (604,267)
        outs = [(112,683),(328,683)] if mobile else [(973,143),(973,404)]
        body = []
        # Stage paths terminate at panel boundaries, keeping text and images clear.
        paths = ['M110,156 C110,185 220,176 220,208','M330,156 C330,185 220,176 220,208',
                 'M220,269 V328','M172,478 C172,506 112,505 112,550','M268,478 C268,506 328,505 328,550'] if mobile else [
                 'M164,165 C220,165 238,267 278,267','M164,370 C220,370 238,267 278,267',
                 'M440,267 H495','M713,239 C765,239 774,143 834,143','M713,295 C765,295 774,404 834,404']
        body += [f'<g class="af-path">'+''.join(f'<path d="{d}"/>' for d in paths)+'</g>']
        for i, (x,y) in enumerate(ins):
            body += [image([A,B][i],x,y,102,120), text(x,y+84,['元 · 钧窑梅瓶','清乾隆 · 仿钧花口瓶'][i])]
        x,y = enc
        body += [panel(x,y,220 if mobile else 190,66 if mobile else 112),text(x,y-3,'取形 · 提取特征','af-label'),text(x,y+23,'视觉编码器')]
        body += [model(*mdl)]
        for i,(x,y) in enumerate(outs):
            w,h = (192,240) if mobile else (276,198)
            body += [panel(x,y,w,h),text(x,y-h/2+34,['风格分支','年代分支'][i],'af-title'),text(x,y-h/2+61,['承袭何种范式','制作于何时'][i])]
            iy = y+14
            body += [image(A,x-43,iy,58,84),image(B,x+43,iy,58,84)]
            if i == 0:
                body += [f'<path d="M{x-78},{iy+48} v7 h156 v-7" class="af-rule"/>',text(x,y+h/2-17,'同属钧窑风格','af-label')]
            else:
                body += [f'<path d="M{x},{iy-39} v88" class="af-rule"/>',text(x-43,y+h/2-17,'元','af-label'),text(x+43,y+h/2-17,'清','af-label')]
        # Small vessel tokens travel steadily through the stages; static results stay legible.
        for i in range(6):
            name = f'af-{mode}-{i}'
            source = ins[i%2]
            if i < 2:
                points = [(0,source,0),(5,source,1),(25,enc,1),(46,mdl,1),(50,mdl,0),(100,mdl,0)]
            else:
                ox,oy = outs[(i-2)//2]
                dest = (ox + (-43 if i%2==0 else 43), oy+14)
                points = [(0,mdl,0),(50,mdl,0),(54,mdl,1),(78,dest,1),(88,dest,0),(100,dest,0)]
            css += '@keyframes '+name+'{'+''.join(f'{pct}%{{transform:translate({p[0]}px,{p[1]}px);opacity:{opacity}}}' for pct,p,opacity in points)+'}\n'
            css += f'.{name}'+'{animation-name:'+name+'}\n'
            body += [f'<g class="af-token {name}" aria-hidden="true"><circle r="22"/>'+image([A,B][i%2],0,0,29,36)+'</g>']
        body += [text(220 if mobile else 604,850 if mobile else 525,'同一风格，分辨不同年代 · 训练目标示意')]
        layouts += [f'<svg class="au-flow af-{mode}" viewBox="{vb}" role="img" aria-label="Aurelia AI 双分支训练目标：元代钧窑梅瓶与清乾隆仿钧花口瓶，风格同属钧窑，制作年代分别为元与清。">'+''.join(body)+'</svg>']
    return '<style>'+css+'</style><div class="au-flowwrap">'+''.join(layouts)+'</div>'

def demo_cards():
    NOTE={"npm:35659":"相近参照却均来自官窑，提示风格分类与图像检索并不完全一致；哥、官之间的相近之处，仍需逐项细辨。","npm:38059":"第三件参照为龙泉贯耳壶，器形相近而釉色有别，可见检索结果也会受轮廓影响。"}
    out=[]
    for oid in _D["pick"]:
        r=_D["reports"][oid]; m=_D["meta"][oid]
        sk=max(r["style"],key=r["style"].get); sp=min(r["style"][sk],0.99); dk=max(r["period"],key=r["period"].get); dp=min(r["period"][dk],0.99)
        ok_s=sk==r["target"]; ok_d=dk=="Qing"; tgt=_KILN[r["target"]]; reign=_REIGN.get(m.get("reign"),"清")
        if ok_s and ok_d: verdict=f"风格预测为{tgt}，年代预测为清，与馆方著录的「清{reign}仿{tgt[:-1]}釉」相符。"+NOTE.get(oid,"")
        else: verdict=f"此件的风格与年代均有误判：模型倾向{_KILN[sk]}风格，并将年代判为{_DYN[dk]}；馆方著录为「清{reign}仿{tgt[:-1]}釉」。正面照片不足以呈现圈足与款识，具体误判原因尚待核查。较高的模型分值，也可能对应错误结论。"
        nbs=""
        for n in r["neighbours"]:
            mm=_D["meta"][n["id"]]; t=mm["zh_s"]; kz=_KILN[n["kiln"]]
            head=f"{_DYN[n['dynasty']]} · {kz}" if not t.startswith(kz[:-1]) else _DYN[n["dynasty"]]
            nbs+=f'<li><img src="media/demo/{mm["file"]}" width="{mm["size"][0]}" height="{mm["size"][1]}" alt="{t}" loading="lazy" decoding="async"><span class="nb-h">{head}</span><span class="nb-t">{t}</span><span class="nb-s">图像相似度 {n["sim"]:.2f}</span><span class="nb-s">故宫资料编号 {n["id"].split(":")[1]}</span></li>'
        out.append(f'''<article class="au-rep au-rise{'' if ok_s and ok_d else ' au-rep--miss'}">
  <figure class="au-rep__fig"><img src="media/demo/{m['file']}" width="{m['size'][0]}" height="{m['size'][1]}" alt="{m['zh_s']}" decoding="async"><figcaption>{_DYN[m['dynasty']]} {reign} · {m['zh_s']}<small>台北故宫 · 资料编号 {oid.split(':')[1]} · 留出测试器物</small></figcaption></figure>
  <div class="au-rep__body">
    <div class="au-prob"><span>风格预测</span><i style="--w:{sp:.2f}"></i><b>{_KILN[sk]} {sp*100:.0f}%</b></div>
    <div class="au-prob"><span>年代预测</span><i style="--w:{dp:.2f}"></i><b>{_DYN[dk]}代 {dp*100:.0f}%</b></div>
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
<title>Aurelia · AI 能否读懂中国古瓷之美</title>
<meta name="description" content="以近两万件博物馆藏瓷为参照，从照片辨识风格、寻找相近之器，探索 AI 如何学习古瓷鉴赏。研究原型，邀请制内测。">
<meta name="theme-color" content="#121619">
<meta property="og:type" content="website">
<meta property="og:title" content="Aurelia · AI 能否读懂中国古瓷之美">
<meta property="og:description" content="以馆藏为参照，从识器入手：辨风格，寻同类，探索形似之外的时代特征。">
<meta property="og:url" content="https://kesixu.com/vibecoding/aurelia/">
<meta property="og:image" content="https://kesixu.com/vibecoding/aurelia/media/og.jpg">
<link rel="canonical" href="https://kesixu.com/vibecoding/aurelia/">
<link rel="icon" type="image/svg+xml" href="/vibecoding/assets/favicon.svg">
<link rel="preload" as="font" type="font/woff2" href="fonts/sans-300-aurelia.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="fonts/sans-400-aurelia.woff2" crossorigin>
<link rel="preload" as="image" href="media/vessels/cma_140168-900.webp" imagesrcset="media/vessels/cma_140168-900.webp 900w, media/vessels/cma_140168-1400.webp 1400w" imagesizes="(min-width:900px) 40vw, 78vw">
<link rel="stylesheet" href="aurelia.css?v=28">
</head>
<body>
<a class="au-skip" href="#main">跳转至正文</a>

<div class="au-sky" aria-hidden="true">
  <div class="au-lattice"></div>
  <div class="au-haze"></div>
  <div class="au-moonwrap"><div class="au-moon"></div></div>
</div>
<span class="au-ember" aria-hidden="true"></span>
<div class="au-paper" aria-hidden="true"></div>

<nav class="au-nav" aria-label="站内导航">
  <a class="au-back" href="/vibecoding/">← kesixu.com</a>
  <span class="au-mark">AURELIA · 古瓷风格比对</span>
</nav>

<main id="main">

<!-- ═══ S1 月出 · 开卷 ═══ -->
<section class="au-s au-s1" id="s1" aria-label="开卷">
  <div class="au-wrap au-hero">
    <div class="au-hero__text">
      <p class="au-eyebrow au-intro">Aurelia · 古瓷风格比对</p>
      <h1 class="au-h1 au-intro">AI 能否读懂<br><span class="au-nw">中国古瓷</span><wbr><span class="au-nw">之美</span></h1>
      <p class="au-lede au-intro">从识器入手，以近<span class="nw">两万件</span>博物馆藏瓷为参照，为一张照片寻得相近之器，逐步辨明<span class="nw">相似之处</span>。</p>
      <div class="au-cta au-intro">
        <a class="au-btn au-btn--moon" href="{S_MAIN}">申请内测</a>
        <a class="au-btn" href="/vibecoding/">浏览其他作品</a>
      </div>
    </div>
    {stage('cma_140168', '明 永乐 甜白釉暗花梅瓶，克利夫兰艺术博物馆 1964.167', 877, 1419, '明 永乐 · 甜白釉暗花梅瓶', '克利夫兰艺术博物馆 1964.167', 900, 'au-stage--hero au-intro', srcset='media/vessels/cma_140168-900.webp 900w, media/vessels/cma_140168-1400.webp 1400w', sizes='(min-width:900px) 40vw, 78vw', prio=True)}
  </div>
  <p class="au-scroll-hint au-intro" aria-hidden="true"><span>向下阅览</span><i></i></p>
</section>

<!-- ═══ S2 看器，贵在上手 ═══ -->
<section class="au-s au-s2" id="s2" aria-label="从识器到鉴赏">
  <div class="au-wrap au-two">
    {stage('cma_97956', '宋 钧窑 莲蕾罐，克利夫兰艺术博物馆 1917.60', 1060, 967, '宋 钧窑 · 莲蕾罐', '克利夫兰艺术博物馆 1917.60 · 本页天青色取意于此', 1100, 'au-stage--s2')}
    <div class="au-text">
      <h2 class="au-h2 au-rise">鉴赏之始，在于识器</h2>
      <p class="au-p au-rise">一件古瓷的意趣，见于器形、釉色，也藏在工艺细节之中。行家观器，须察胎釉、辨纹饰、读款识；上手掂量，翻看圈足，借侧光细察釉面，方能<span class="nw">见微知著</span>。</p>
      <p class="au-p au-rise">Aurelia 先学习照片中可见的线索：以馆藏作参照，辨识器物的风格与形制。待这一步有据可依，再向专家学习，同类器物之间<span class="nw">何以见高下</span>。</p>
    </div>
  </div>
</section>


<!-- ═══ S3 五馆同堂 ═══ -->
<section class="au-s au-s3" id="s3" aria-label="馆藏研究语料">
  <canvas class="au-space" aria-hidden="true"></canvas>
  <div class="au-wrap">
    <h2 class="au-h2 au-rise">五馆藏珍，汇为参照</h2>
    <p class="au-bignum au-rise"><span class="au-num">19,487</span><span class="au-bignum__lab">件 · 馆藏研究语料</span></p>
    <p class="au-fine au-rise au-sources"><span class="nw">台北故宫 14,557</span> · <span class="nw">英国 V&amp;A 3,473</span> · <span class="nw">克利夫兰 699</span> · <span class="nw">芝加哥 673</span> · <span class="nw">大都会 85</span></p>
    <div class="au-figwrap au-rise">{fig_dynasty()}</div>
    <p class="au-fine au-rise">图列主要朝代，以明清器物居多；这份语料尚不足以代表中国古瓷的全貌。</p>
    <div class="au-arc">
      {stage('cma_134843', '宋 汝窑 笔洗，克利夫兰艺术博物馆 1957.40', 1346, 523, '宋 汝窑 · 笔洗', '克利夫兰 1957.40', 900, 'au-stage--arc au-wide')}
      {stage('cma_135015', '南宋 官窑 葵口碗，克利夫兰艺术博物馆 1957.66', 1508, 808, '南宋 官窑 · 葵口碗', '克利夫兰 1957.66', 900, 'au-stage--arc au-wide')}
      {stage('cma_121469', '宋 建窑 兔毫盏，克利夫兰艺术博物馆 1942.132', 1484, 1011, '宋 建窑 · 兔毫盏', '克利夫兰 1942.132', 900, 'au-stage--arc au-wide')}
      {stage('met_49855', '元 青花莲池纹玉壶春瓶，大都会艺术博物馆 1984.297', 653, 1349, '元 · 青花莲池纹玉壶春瓶', '大都会 1984.297', 900, 'au-stage--arc')}
      {stage('met_39666', '明 宣德 青花云龙纹罐，大都会艺术博物馆 37.191.1', 947, 1004, '明 宣德 · 青花云龙纹罐', '大都会 37.191.1', 900, 'au-stage--arc')}
      {stage('cma_154732', '清 雍正 釉里红海水龙纹梅瓶，克利夫兰艺术博物馆 1989.314', 870, 1477, '清 雍正 · 釉里红海水龙纹梅瓶', '克利夫兰 1989.314', 900, 'au-stage--arc')}
      {stage('cma_112196', '清 雍正 粉彩蝠桃纹盘，克利夫兰艺术博物馆 1930.639', 1612, 1613, '清 雍正 · 粉彩蝠桃纹盘', '克利夫兰 1930.639', 900, 'au-stage--arc au-wide')}
    </div>
    <p class="au-fine au-fine--note">本节器物照片来自克利夫兰与大都会艺术博物馆的开放获取资料（CC0）。</p>
  </div>
</section>

<!-- ═══ S4 闭卷而试 ═══ -->
<section class="au-s au-s4" id="s4" aria-label="检索评测结果">
  <div class="au-wrap">
    <h2 class="au-h2 au-rise">闭卷检验，检索有据</h2>
    <p class="au-p au-rise">以 <span class="nw">2,435 件</span>未参与训练的器物作查询，在训练与验证集组成的参照库中检索。先检验一件具体的事：返回的前五件中，平均有多少与查询器物<span class="nw">同朝代、同器型</span>。</p>
    <div class="au-bars au-rise">
      <div class="au-bargroup">
        <p class="au-bargroup__t">前五件相关比例 precision@5</p>
        <div class="au-bar"><span class="au-bar__lab">微调前</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.795"></i></span><b>79.5%</b></div>
        <div class="au-bar"><span class="au-bar__lab">微调后</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--after" style="--w:.847"></i></span><b>84.7%</b></div>
        <p class="au-bar__delta">提高 5.2 个百分点</p>
      </div>
      <div class="au-bargroup">
        <p class="au-bargroup__t">前十件排序得分 nDCG@10 · 满分 1</p>
        <div class="au-bar"><span class="au-bar__lab">微调前</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.778"></i></span><b>0.778</b></div>
        <div class="au-bar"><span class="au-bar__lab">微调后</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--after" style="--w:.847"></i></span><b>0.847</b></div>
        <p class="au-bar__delta">+0.069</p>
      </div>
    </div>
    <p class="au-fine au-rise">相关器物须同时满足同朝代、同器型；排序得分越高，表示相关器物越靠前。这两项指标衡量检索表现，尚未衡量审美判断。</p>
    <div class="au-routes au-rise">
      <p class="au-bargroup__t">六条技术路线，同一标准比较（nDCG@10）</p>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">OpenCLIP 微调</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--after" style="--w:.847"></i></span><b>0.847</b></div>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">DINOv3 微调 + 自蒸馏</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.824"></i></span><b>0.824</b></div>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">DINOv3 微调</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.822"></i></span><b>0.822</b></div>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">DINOv3 未微调</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.779"></i></span><b>0.779</b></div>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">OpenCLIP 未微调</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.778"></i></span><b>0.778</b></div>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">SDXL 生成器特征</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.689"></i></span><b>0.689</b></div>
      <p class="au-p au-p--small">本轮评测中，微调后的 OpenCLIP 得分最高；前三条路线相差约 0.025。</p>
    </div>
  </div>
</section>

<!-- ═══ S13 报告 ═══ -->
<section class="au-s au-s13" id="s13" aria-label="报告样例">
  <div class="au-wrap">
    <h2 class="au-h2 au-rise">四件仿古器，见其得失</h2>
    <p class="au-p au-rise">从留出测试集中选取四件清代仿古器，展示模型的风格、年代预测及相近参照，其中保留一件误判。样例采用同一次计算的结果，说明文字便于对照馆方著录阅读。</p>
    <p class="au-p au-rise">这批 <span class="nw">38 件</span>器物中，年代预测与著录相符的有 <span class="nw">35 件</span>，所仿风格相符的有 <span class="nw">36 件</span>。训练中见过同类仿古器；若将仿钧整类留出，初步判为清代的比例仅约一成半。能否辨识未见过的仿古类型，仍是研究难点。</p>
    {demo_cards()}
    <p class="au-fine au-rise">百分比为模型分类分值，显示上限 99%，未经校准，不能作为判断正确的概率。参照检索使用未微调的视觉特征，与分类结果分别计算。图片：国立故宫博物院开放资料（CC BY 4.0）。</p>
  </div>
</section>
<!-- ═══ S11 核心发现 ═══ -->
<section class="au-s au-s11" id="s11" aria-label="仿古器与风格年代研究">
  <div class="au-wrap">
    <h2 class="au-h2 au-rise">形似之外，时代有别<br><span class="nw">分清「像」与「是」</span></h2>
    <p class="au-p au-rise">雍正、乾隆时期的仿古瓷，将宋元名窑的釉色与形制重新演绎。馆方著录中的「仿钧」「仿哥」「仿官」「仿龙泉」「仿汝」，同时记录了所仿风格与制作年代。台北故宫著录带「仿」字的器物有 <span class="nw">352 件</span>，其中 <span class="nw">282 件</span>已纳入研究库；清代仿这五类釉色的有 <span class="nw">190 件</span>。</p>
    <p class="au-p au-rise au-p--pull">仿古之中，也有当时的审美。</p>
    <p class="au-p au-rise">这些著录提供了一组跨时代的对照：风格承袭宋元，器物却制于清代。我们据此训练模型分别回答：<span class="nw">承袭何种风格</span>，<span class="nw">可能制于何时</span>。目标是辨识形似之外的时代线索，而这一步能否成立，须由未见类型的测试来回答。</p>
    <p class="au-fine au-rise">相关研究已有瓷器属性识别与艺术风格解耦的方法。Aurelia AI 的研究着眼于历史仿古著录：以所仿风格和制作年代分别监督训练，再将整类仿古器留出，检验模型能否举一反三。</p>
    <div class="au-figwrap au-rise">
      <p class="au-figcap">通用视觉模型如何看待这 <span class="nw">190 件</span>清代仿古器（以 Meta PE-Core 为例）</p>
      {fig_fooled()}
      <p class="au-fine">比较时匹配两组参照的件数，并重复抽样；「更近原型」指与宋元同窑器物比与清代对照器物更相似。年代分类器在非仿古器的留出集上准确率约 86%，对这 190 件仿古器仅约 35% 判为清代。</p>
    </div>
    <p class="au-p au-rise">图像中的相近风格较容易被捕捉，制作年代却更难辨明。胎质、圈足与釉面能否提供更可靠的线索，是下一步要检验的问题。双头模型因此设置风格与年代两个分支。加入训练约束后，对未见仿古类型的年代判断与仅训练年代分支持平，线索须另寻。</p>
    <div class="au-figwrap au-figwrap--flow au-rise">
      <p class="au-figcap">同一风格，不同年代：双分支训练目标</p>
      {fig_flow()}
      <p class="au-fine">风格分支将两件归入钧窑风格，年代分支则区分元与清。图示表达训练目标，尚不代表模型已能稳定识别未见过的仿古类型。</p>
    </div>
    <div class="au-todos au-rise">
      <div class="au-todo"><span class="au-todo__k">整类仿古器未参与训练时，判为清代的比例</span><span class="au-todo__v">仿钧约两成 · 仿龙泉约三成 · 仿官约七成 · 仿哥约八成</span></div>
      <div class="au-todo"><span class="au-todo__k">年代线索来自何处：圈足、釉面或口沿</span><span class="au-todo__v">按比例切分的部位未见线索 · 口沿改由 SAM 3 分割模型定位 · 圈足需底部照片</span></div>
      <div class="au-todo"><span class="au-todo__k">跨文化对照：V&amp;A 的 88 件欧洲仿中国瓷</span><span class="au-todo__v">待开展</span></div>
      <div class="au-todo"><span class="au-todo__k">公开真仿对照集 CArtBench：通用大模型现有基线答对 6 / 10 对</span><span class="au-todo__v">本模型尚待测试</span></div>
    </div>
    <h3 class="au-h3 au-rise">值得长期积累的是什么</h3>
    <ul class="au-bullets au-rise">
      <li>将相似风格与年代判断分别验证，并为每项判断寻找可复核的线索。能否在未见类型上仍然有效，比一份漂亮的样例报告更能说明方法的价值。</li>
      <li>馆藏著录虽公开，专家逐件评议、误判修正及经授权的交易反馈，仍需日积月累。每条记录有出处、每次修正有依据，才能逐步形成可靠的研究资料。</li>
      <li>若这一方法在古瓷上得到验证，可进一步探索青铜、玉器与书画中的仿古现象；各品类的材料与工艺不同，须重新建立参照与评测。</li>
    </ul>
  </div>
</section>


<!-- ═══ S5 开片 · 证据 ═══ -->
<section class="au-s au-s5" id="s5" aria-label="器物分割与图像测量">
  <div class="au-wrap au-two au-two--ev">
    <div class="au-evstage">
      {crackle}
      <figure class="au-stage au-stage--ev" data-v="cma_135015">
        <span class="au-box"><span class="au-shadow" aria-hidden="true"></span><img class="au-vessel" src="media/vessels/cma_135015-900.webp" srcset="media/vessels/cma_135015-900.webp 900w, media/vessels/cma_135015-1400.webp 1400w" sizes="(min-width:900px) 44vw, 84vw" width="1508" height="808" alt="南宋 官窑 葵口碗，克利夫兰艺术博物馆 1957.66" decoding="async" loading="lazy"><span class="au-sheen" aria-hidden="true"><i></i></span><span class="au-sheen au-sheen--v" aria-hidden="true"><i></i></span><svg class="au-outline" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path pathLength="1" d="{outline}"/></svg><span class="au-part au-part--rim" aria-hidden="true">口沿</span><span class="au-part au-part--body" aria-hidden="true">腹</span><span class="au-part au-part--foot" aria-hidden="true">圈足</span></span>
        <figcaption class="au-cap">南宋 官窑 · 葵口碗<small>克利夫兰艺术博物馆 1957.66</small></figcaption>
      </figure>
    </div>
    <div class="au-text">
      <p class="au-eyebrow au-rise">从图像到线索</p>
      <h2 class="au-h2 au-rise">观器有法，循迹求证</h2>
      <ol class="au-steps">
        <li class="au-step" data-step="1"><b>取器物之形，分离背景</b><span>月色勾勒的轮廓来自模型分割。150 件样本上，与自动生成的参考分割平均重合度为 0.884，人工标注验证尚待开展。</span></li>
        <li class="au-step" data-step="2"><b>由整体入局部，细察形制</b><span>分别比较器颈、腹部与圈足。初步实验中，仅用单个部位检索，前五件参照约 65% 与查询器物同朝代；部位定位与证据仍待验证。</span></li>
        <li class="au-step" data-step="3"><b>将可见特征化为度量</b>
          <dl class="au-measure">
            <div><dt>轮廓对称度</dt><dd>98.2<i>%</i></dd><small>轮廓与其镜像的重合度 IoU</small></div>
            <div><dt>釉面色差</dt><dd>16.3</dd><small>Lab 色差标准差 · 描述色彩变化</small></div>
            <div><dt>纹理密度</dt><dd>1.1<i>%</i></dd><small>器身区域内边缘像素的占比</small></div>
          </dl>
          <span class="au-fine">数值取自本页这只葵口碗的照片。</span></li>
      </ol>
      <p class="au-p au-rise">这些度量描述照片中的形与色。开片之疏密、兔毫之流动、窑变之斑斓，各有意趣；如何品评，仍须放回器物所属的时代与工艺传统之中。</p>
    </div>
  </div>
</section>

<!-- ═══ S6 一瓶，五亲 ═══ -->
<section class="au-s au-s6" id="s6" aria-label="相近器物检索示例">
  <div class="au-wrap au-wrap--rel">
    <h2 class="au-h2 au-rise">以一瓶为引，寻相近之器</h2>
    <div class="au-query">
      {stage('cma_134979', '南宋 龙泉窑 梅瓶，克利夫兰艺术博物馆 1957.52', 898, 1509, '查询 · 南宋 龙泉窑 · 梅瓶', '克利夫兰艺术博物馆 1957.52', 1100, 'au-stage--q')}
    </div>
    <svg class="au-beams" aria-hidden="true" focusable="false"><path pathLength="1" d=""/><path pathLength="1" d=""/><path pathLength="1" d=""/><path pathLength="1" d=""/><path pathLength="1" d=""/></svg>
    <ol class="au-nbs">
      <li class="au-nb"><span class="au-spot" aria-hidden="true"></span>{stage('aic_80869', '西夏 黑釉剔花梅瓶，芝加哥艺术博物馆 80869', 477, 994, '西夏 · 黑釉剔花梅瓶', '芝加哥 80869<br>图像相似度 0.859', 700, 'au-stage--nb')}</li>
      <li class="au-nb"><span class="au-spot" aria-hidden="true"></span>{stage('cma_134997', '宋 龙泉窑 五管瓶，克利夫兰艺术博物馆 1957.53', 690, 1128, '宋 龙泉窑 · 五管瓶', '克利夫兰 1957.53<br>图像相似度 0.857', 700, 'au-stage--nb')}</li>
      <li class="au-nb"><span class="au-spot" aria-hidden="true"></span>{stage('cma_284746', '宋 刻花梅瓶，克利夫兰艺术博物馆 2017.20', 903, 1460, '宋 · 刻花梅瓶', '克利夫兰 2017.20<br>图像相似度 0.848', 700, 'au-stage--nb')}</li>
      <li class="au-nb"><span class="au-spot" aria-hidden="true"></span>{stage('cma_153286', '宋 梅瓶，克利夫兰艺术博物馆 1986.245', 548, 1391, '宋 · 梅瓶', '克利夫兰 1986.245<br>图像相似度 0.846', 700, 'au-stage--nb')}</li>
      <li class="au-nb"><span class="au-spot" aria-hidden="true"></span>{stage('aic_58904', '北宋 婴戏纹盖梅瓶，芝加哥艺术博物馆 58904', 515, 919, '北宋 · 婴戏纹盖梅瓶', '芝加哥 58904<br>图像相似度 0.844', 700, 'au-stage--nb')}</li>
    </ol>
    <p class="au-p au-rise">以一只南宋龙泉梅瓶作查询，前五件参照中，四件著录为宋代，其中三件同为梅瓶。首位却是西夏黑釉剔花梅瓶：轮廓相近，釉色与装饰迥异。相似度将它们引到一处，具体像在哪里、又有何不同，仍须<span class="nw">逐项比对</span>。</p>
    <p class="au-fine au-rise">此演示仅在 <span class="nw">1,372 件</span> CC0 馆藏中检索。图像相似度用于排序，不能解释为年代或真伪判断的概率。</p>
  </div>
</section>


<!-- ═══ S12 生意 ═══ -->
<section class="au-s au-s12" id="s12" aria-label="应用方向与商业设想">
  <div class="au-wrap">
    <h2 class="au-h2 au-rise">从馆藏研究，走向实际应用</h2>
    <p class="au-p au-rise">古瓷研究若能沉淀为工具，应先帮助人把参照找全、把疑点看清。我们拟将检索结果、风格与年代预测整理成可复核的比对报告，附馆方资料编号，并按需要交由专家复核。当前仍处于研究与内测阶段，以下为应用方向及定价设想。</p>
    <h3 class="au-h3 au-rise">哪些场景需要这样的参照</h3>
    <div class="au-kpis au-rise">
      <div class="au-kpi"><b>42.7<i>亿元</i></b><span>2025 年上半年内地百家拍卖行样本中，瓷器杂项成交额，占总成交额 38.7%</span></div>
      <div class="au-kpi"><b>51%</b><span>瓷玉杂项占境外中国文物艺术品成交额的比重，2024 年</span></div>
      <div class="au-kpi"><b>30.7<i>万件</i></b><span>2024 年内地文物艺术品拍卖成交量，包含书画与杂项，并非仅指瓷器</span></div>
      <div class="au-kpi"><b>40<i>万件/年</i></b><span>Art Loss Register 披露的拍品核查量；机构按件核查费为 3.66 英镑，提供专业核查付费的参照</span></div>
    </div>
    <h3 class="au-h3 au-rise">专业核查服务的价格参照</h3>
    <div class="au-figwrap au-rise">
      <p class="au-figcap">调研所录公开报价与拟议价格（美元）</p>
      {fig_price()}
      <p class="au-fine">报价参考 Art Loss Register、Mearto、Oxford Authentication 与 Art Recognition。失窃记录核查、估价、材料检测及绘画鉴真各有用途，服务范围与 Aurelia 不同；图中标「拟」者为本项目设想。</p>
    </div>
    <h3 class="au-h3 au-rise">拟议服务与定价</h3>
    <div class="au-tiers au-rise">
      <div class="au-tier"><b>$6<i>/件</i></b><span>机构批量初筛 · 拟按年签约</span><small>自动检索与线索整理；单位成本及毛利待实测</small></div>
      <div class="au-tier"><b>$19<i>/件</i></b><span>单件比对报告</span><small>面向藏家与顾问，提供馆藏参照</small></div>
      <div class="au-tier"><b>$149<i>/件</i></b><span>专家复核报告</span><small>拟由专家审阅；复核范围与责任须另行约定</small></div>
      <div class="au-tier"><b>$490<i>/件</i></b><span>保险与融资资料报告</span><small>远期设想，须先明确专业资质与机构采信要求</small></div>
    </div>
    <p class="au-p au-rise">先以机构批量初筛验证需求，再探索专家复核服务。按拟议单价测算，一万份复核报告收入约 150 万美元，三千份保险与融资资料报告亦约 150 万美元；这只是收入情景，尚未扣除专家、获客与合规等成本，实际需求仍待试点验证。</p>
    <div class="au-cols">
      <div class="au-col au-rise">
        <h3>面向谁</h3>
        <ul>
          <li>拍卖行与古董商：编目及上拍前比对</li>
          <li>藏家与顾问：竞投前查找参照</li>
          <li>交易平台：上架资料初筛</li>
          <li>保险与融资机构：远期资料辅助场景</li>
        </ul>
      </div>
      <div class="au-col au-rise">
        <h3>交付什么价值</h3>
        <ul>
          <li>参照器物附馆方资料编号，便于核对著录</li>
          <li>分别呈现风格与年代预测，记录疑点与误判</li>
          <li>研究数据与商用数据须按用途分别核验许可</li>
        </ul>
      </div>
      <div class="au-col au-rise">
        <h3>如何拓展</h3>
        <ul>
          <li>与机构试点，验证效率与复核质量</li>
          <li>在需求成立后，探索平台按件调用</li>
          <li>逐类建立青铜、玉器与书画的参照体系</li>
        </ul>
      </div>
    </div>
    <p class="au-fine au-rise">市场资料参考中国拍卖行业协会 2024 年报、雅昌艺术市场监测中心 2025 年上半年报告及 Art Loss Register 公开资料。各项统计范围不同，不能直接视为本项目的可服务市场规模。</p>
  </div>
</section>
<!-- ═══ S7 光止于此 ═══ -->
<section class="au-s au-s7" id="s7" aria-label="判断边界">
  <div class="au-wrap au-center">
    <p class="au-eyebrow au-rise">比对有据，鉴赏有度</p>
    <h2 class="au-h2 au-h2--line au-rise"><span class="au-nw">参照可寻</span><span class="au-dot">·</span><span class="au-nw">判断在人</span></h2>
    <span class="au-redline" aria-hidden="true"></span>
    <p class="au-p au-rise">照片可以提供器形、釉色与纹饰的线索，却难以尽呈胎质、重量、款识与修复痕迹。Aurelia 目前提供相近馆藏及初步的风格、年代预测，供研习与复核。真伪与估值仍须结合实物、来源记录和专家意见；器物之美，也需由人细看、细品。</p>
  </div>
</section>

<!-- ═══ S8 既成 · 方作 · 未竟 ═══ -->
<section class="au-s au-s8" id="s8" aria-label="路线与局限">
  <div class="au-wrap">
    <h2 class="au-h2 au-rise">由识器到品评</h2>
    <div class="au-cols">
      <div class="au-col au-rise">
        <h3>已建立的基础</h3>
        <ul>
          <li>近两万件馆藏语料与器物检索</li>
          <li>自动分割器物，提取三项图像度量</li>
          <li>以 2,435 件留出器物检验检索表现</li>
        </ul>
      </div>
      <div class="au-col au-rise">
        <h3>正在探索</h3>
        <ul>
          <li>同朝代、同器型内的典范度与稀缺度：描述典型性与少见程度</li>
          <li>风格与年代的双分支模型，重点检验未见过的仿古类型</li>
          <li>发明专利申请工作</li>
        </ul>
      </div>
      <div class="au-col au-rise">
        <h3>下一步</h3>
        <ul>
          <li>在许可明确的范围内获取高清图像，补充圈足与釉面细节</li>
          <li>将检索、分类及部位线索整理成可核对的报告</li>
          <li>邀请专家在同类器物间比较「何者更精」，学习不同时代的品评尺度</li>
        </ul>
      </div>
    </div>
    <p class="au-p au-rise">检索的进步，让我们有了继续研究的基础。下一步须把典型与精妙、少见与珍贵分别辨清，再以专家的比较意见检验模型。由识器到品评，尚需一段细致的功夫。</p>
    {stage('cma_120203', '清 乾隆 仿哥釉八卦纹琮式瓶，克利夫兰艺术博物馆 1940.969', 728, 1459, '清 乾隆 · 仿哥釉八卦纹琮式瓶', '克利夫兰艺术博物馆 1940.969 · 仿古，也是时代趣味的表达', 900, 'au-stage--s8')}
  </div>
</section>

<!-- ═══ S9 来函，携一器 ═══ -->
<section class="au-s au-s9" id="s9" aria-label="内测与研究合作">
  <div class="au-wrap au-center">
    <h2 class="au-h2 au-rise">携一器，来信相谈</h2>
    <p class="au-p au-rise">邀请研究者、博物馆同仁与鉴赏行家参与内测。来信时，可附一张器物照片，简述所关注的问题，让讨论<span class="nw">从具体器物谈起</span>。</p>
    <p class="au-fine au-rise">发起人 徐可斯 · 计算机科学博士，研究医学图像分割与视觉表示学习</p>
    <p class="au-cta au-rise"><a class="au-btn au-btn--moon" href="{S_MAIN}">来信申请内测</a></p>
    <p class="au-doors au-rise">
      <a href="{S_AB}">参与器物品评标注</a>
      <a href="{S_ORG}">机构研究合作</a>
      <a href="{S_REP}">索取方法报告</a>
    </p>
  </div>
</section>

</main>

<aside class="au-rail" aria-hidden="true"><i></i></aside>
<details class="au-toc" id="toc">
  <summary aria-label="展开或收起卷目"><span class="o">目</span><span class="c">合</span></summary>
  <nav class="au-toc__sheet" aria-label="卷目">
    <p class="au-toc__t">卷目</p>
    <ol><li><a href="#s1"><i>一</i><span>开卷</span></a></li><li><a href="#s2"><i>二</i><span>识器与鉴赏</span></a></li><li><a href="#s3"><i>三</i><span>五馆参照</span></a></li><li><a href="#s4"><i>四</i><span>闭卷检验</span></a></li><li><a href="#s13"><i>五</i><span>报告得失</span></a></li><li><a href="#s11"><i>六</i><span>风格与年代</span></a></li><li><a href="#s5"><i>七</i><span>观器之法</span></a></li><li><a href="#s6"><i>八</i><span>梅瓶比对</span></a></li><li><a href="#s12"><i>九</i><span>应用设想</span></a></li><li><a href="#s7"><i>十</i><span>判断边界</span></a></li><li><a href="#s8"><i>十一</i><span>研究进展</span></a></li><li><a href="#s9"><i>十二</i><span>来信相谈</span></a></li></ol>
  </nav>
</details>

<footer class="au-foot">
  <ul class="au-foot__list"><li>研究原型 · 邀请制内测</li><li>本页展示的器物照片来自克利夫兰、大都会、芝加哥三馆开放获取资料（CC0）</li><li>报告样例与流程图图片来自国立故宫博物院开放资料（CC BY 4.0）</li><li>页面资源均由本站托管</li><li>© 2026 徐可斯</li></ul>
</footer>

<script src="/vibecoding/vendor/gsap.min.js" defer></script>
<script src="/vibecoding/vendor/ScrollTrigger.min.js" defer></script>
<script src="/vibecoding/vendor/lenis.min.js" defer></script>
<script src="aurelia.js?v=28" defer></script>
</body>
</html>
'''
open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(html)
print('index.html', len(html.encode()), 'bytes')
