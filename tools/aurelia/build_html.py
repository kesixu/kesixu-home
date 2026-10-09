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
    out=['<div class="au-hbars" role="img" aria-label="五种仿品：被放到宋元原型旁边的比例，以及被判成清代的比例">','<p class="au-hbars__leg"><i class="au-sw au-sw--a"></i>放到宋元原型旁　<i class="au-sw au-sw--b"></i>判成清代</p>']
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
def demo_cards():
    out=[]
    for oid in _D["pick"]:
        r=_D["reports"][oid]; m=_D["meta"][oid]
        sk=max(r["style"],key=r["style"].get); sp=r["style"][sk]; dk=max(r["period"],key=r["period"].get); dp=r["period"][dk]
        ok_s=sk==r["target"]; ok_d=dk=="Qing"
        tgt=_KILN[r["target"]]
        if ok_s and ok_d: verdict=f"风格最近{tgt}，工艺特征属清代。与著录“{_REIGN.get(m.get('reign'),'清')}仿{tgt[:-1] if tgt.endswith('窑') else tgt}”一致。"
        else: verdict=f"这一件它判错了：风格看成{_KILN[sk]}，工艺看成{_DYN[dk]}代。著录为{_REIGN.get(m.get('reign'),'清')}仿{tgt[:-1]}。错例也放在这里。"
        nbs="".join(f'<li><img src="media/demo/{_D["meta"][n["id"]]["file"]}" width="{_D["meta"][n["id"]]["size"][0]}" height="{_D["meta"][n["id"]]["size"][1]}" alt="{_D["meta"][n["id"]]["zh_s"]}" loading="lazy" decoding="async"><span>{_DYN[n["dynasty"]]} {_KILN[n["kiln"]]}<br>{_D["meta"][n["id"]]["zh_s"]}<br><i>接近度 {n["sim"]:.2f}</i></span></li>' for n in r["neighbours"])
        out.append(f'''<article class="au-rep au-rise{'' if ok_s and ok_d else ' au-rep--miss'}">
  <figure class="au-rep__fig"><img src="media/demo/{m['file']}" width="{m['size'][0]}" height="{m['size'][1]}" alt="{m['zh_s']}" loading="lazy" decoding="async"><figcaption>{_DYN[m['dynasty']]} {_REIGN.get(m.get('reign'),'')} · {m['zh_s']}<small>台北故宫 · 模型训练时未见过这件</small></figcaption></figure>
  <div class="au-rep__body">
    <div class="au-prob"><span>风格最近</span><i style="--w:{sp:.2f}"></i><b>{_KILN[sk]} {sp*100:.0f}%</b></div>
    <div class="au-prob"><span>工艺年代</span><i style="--w:{dp:.2f}"></i><b>{_DYN[dk]}代 {dp*100:.0f}%</b></div>
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
<link rel="stylesheet" href="aurelia.css?v=17">
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
      <h1 class="au-h1 au-intro">AI 能不能学会<br><span class="au-nw">中式古瓷的审美</span></h1>
      <p class="au-echo au-intro">Can a machine learn the connoisseur’s eye?</p>
      <p class="au-lede au-intro">第一步是看懂：把瓷器照片交给它，它在两万件博物馆藏品里找出最像的几件，并标出像在哪里。</p>
      <div class="au-cta au-intro">
        <a class="au-btn au-btn--moon" href="{S_MAIN}">申请研习内测</a>
        <a class="au-btn" href="/vibecoding/">回灯火</a>
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
      <p class="au-echo au-rise">Taste begins with seeing</p>
      <p class="au-p au-rise">行家看一件瓷器，先看形，再看釉，再看工。掂重量、摸胎骨、看底足、迎光看釉，功夫在手上。</p>
      <p class="au-p au-rise">AI 学这套眼光，先从照片能做的事学起：把一件器物放回两万件著录器物中间，说出它最像谁、像在哪。</p>
    </div>
  </div>
</section>


<!-- ═══ S10 市场 ═══ -->
<section class="au-s au-s10" id="s10" aria-label="市场">
  <div class="au-wrap">
    <h2 class="au-h2 au-rise">我们做的是什么</h2>
    <p class="au-echo au-rise">A checkable report for every piece of Chinese ceramics</p>
    <p class="au-p au-rise">一件具体的事：给中国古代瓷器做看图比对的工具。一张照片进去，出来一份可核对的报告：它最像博物馆里的哪几件，像在哪里，风格属于哪一窑，工艺是否与所称的年代一致。每句结论都带馆方编号。</p>
    <h3 class="au-h3 au-rise">市场在哪</h3>
    <div class="au-kpis au-rise">
      <div class="au-kpi"><b>596<i>亿美元</i></b><span>2025 年全球艺术品销售额，中国占 14%，是第三大市场</span></div>
      <div class="au-kpi"><b>51%</b><span>境外中国文物艺术品成交额里，瓷器玉器杂项的份额；内地这一板块连续两期唯一增长</span></div>
      <div class="au-kpi"><b>30.7<i>万件</i></b><span>2024 年内地文物艺术品拍卖成交量，每一件都要有人看过、断过代</span></div>
      <div class="au-kpi"><b>40<i>万件/年</i></b><span>拍卖行已经按件付费核查拍品是否为赃物，每件 3.66 英镑</span></div>
    </div>
    <h3 class="au-h3 au-rise">用钱说话</h3>
    <div class="au-figwrap au-rise">
      <p class="au-figcap">单件核查与鉴定服务的现行价格，美元</p>
      {fig_price()}
      <p class="au-fine">赃物核查为 Art Loss Register 公开价（拍卖行每件 3.66 英镑、单次 85 英镑）；在线估价为 Mearto；热释光为 Oxford Authentication 英国价起；AI 绘画鉴真为 Art Recognition 报道价。两档拟定价为本项目假设。</p>
    </div>
    <ul class="au-bullets au-rise">
      <li>内地与境外每年上拍的瓷器玉器杂项约 17.5 万件（按成交额占比推算）。全部走快筛，是每年 175 万美元；两成再走人工复核，再加 525 万美元。</li>
      <li>一件估价 1,500 英镑以上的拍品，买家为一份 150 美元的报告付钱，花的是拍品价值的十分之一以内。</li>
    </ul>
    <h3 class="au-h3 au-rise">这份报告对市场起什么作用</h3>
    <ul class="au-bullets au-rise">
      <li>今天断代与归属全靠行家的眼睛，一件一件看，留下的书面依据很少。报告把依据写下来，按件计价，像查赃物一样成为上拍前的固定步骤。</li>
      <li>先用在最需要它的环节：古董商与中型拍卖行的上拍前核查，竞投前的尽调，保险与抵押贷款的估值依据，交易平台的上架筛查。</li>
    </ul>
    <h3 class="au-h3 au-rise">未来的市场</h3>
    <ul class="au-bullets au-rise">
      <li>中国古瓷是起点，也是最难的一块：同窑同型的量产器最多。打穿它，青铜、玉器、书画用同一套办法。</li>
      <li>报告之后是数据层：平台按条调用，保险与贷款条款直接引用，登记过的器物每次流转都回到这里。</li>
    </ul>
    <p class="au-fine au-rise">来源：Art Basel &amp; UBS《艺术市场报告 2026》；中国拍卖行业协会 2024 年报；雅昌艺术市场监测中心 2025 上半年报告；Art Loss Register 收费页。</p>
  </div>
</section>
<!-- ═══ S3 五馆同堂 ═══ -->
<section class="au-s au-s3" id="s3" aria-label="语料">
  <canvas class="au-space" aria-hidden="true"></canvas>
  <div class="au-wrap">
    <h2 class="au-h2 au-rise">两万件馆藏，一次看遍</h2>
    <p class="au-echo au-rise">Five museums, one index</p>
    <p class="au-bignum au-rise"><span class="au-num">19,487</span><span class="au-bignum__lab">件 · 开放馆藏</span></p>
    <p class="au-fine au-rise au-sources"><span class="au-nw-d">台北故宫 14,557 · 英国 V&amp;A 3,473 · 克利夫兰 699 · 芝加哥 673 · 大都会 85</span></p>
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
    <p class="au-fine au-fine--note">背景微光是这两万件器物在模型眼中的分布图。器物照片来自克利夫兰、大都会两馆的开放获取（CC0）。</p>
  </div>
</section>

<!-- ═══ S4 闭卷而试 ═══ -->
<section class="au-s au-s4" id="s4" aria-label="结果">
  <div class="au-wrap">
    <h2 class="au-h2 au-rise">答对多少</h2>
    <p class="au-echo au-rise">Held-out test</p>
    <p class="au-p au-rise">留出 2,435 件训练时隔离的器物当考题，看前五个答案里有几个是同朝代、同器型：</p>
    <div class="au-bars au-rise">
      <div class="au-bargroup">
        <p class="au-bargroup__t">前五命中率 precision@5</p>
        <div class="au-bar"><span class="au-bar__lab">微调前</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.795"></i></span><b>79.5%</b></div>
        <div class="au-bar"><span class="au-bar__lab">微调后</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--after" style="--w:.847"></i></span><b>84.7%</b></div>
        <p class="au-bar__delta">+5.2 分</p>
      </div>
      <div class="au-bargroup">
        <p class="au-bargroup__t">排序质量 nDCG@10</p>
        <div class="au-bar"><span class="au-bar__lab">微调前</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.778"></i></span><b>77.8%</b></div>
        <div class="au-bar"><span class="au-bar__lab">微调后</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--after" style="--w:.847"></i></span><b>84.7%</b></div>
        <p class="au-bar__delta">+6.9 分</p>
      </div>
    </div>
    <p class="au-fine au-rise">命中 = 同朝代且同器型；单次运行。</p>
    <div class="au-routes au-rise">
      <p class="au-bargroup__t">试过六条技术路线（nDCG@10）</p>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">OpenCLIP 微调</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--after" style="--w:.847"></i></span><b>0.847</b></div>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">DINOv3 微调 + 自蒸馏</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.824"></i></span><b>0.824</b></div>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">DINOv3 微调</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.822"></i></span><b>0.822</b></div>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">DINOv3 冻结</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.779"></i></span><b>0.779</b></div>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">OpenCLIP 冻结</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.778"></i></span><b>0.778</b></div>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">SDXL 生成器特征</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.689"></i></span><b>0.689</b></div>
      <p class="au-p au-p--small">最简单的一条胜出。</p>
    </div>
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
      <p class="au-echo au-rise">Segment first, then measure</p>
      <ol class="au-steps">
        <li class="au-step" data-step="1"><b>先把器物从背景里分出来</b><span>月色轮廓就是模型给出的边界。150 件样本上与人工标注的重合度 0.884。</span></li>
        <li class="au-step" data-step="2"><b>按行家的顺序看</b><span>口沿、腹部、圈足。单看一个部位，前五件同朝代约 65%，仍在验证中。</span></li>
        <li class="au-step" data-step="3"><b>量三把尺子</b>
          <dl class="au-measure">
            <div><dt>轮廓对称</dt><dd>98.2<i>%</i></dd><small>与镜像的 IoU</small></div>
            <div><dt>釉面色差</dt><dd>16.3</dd><small>Lab 标准差 · 素釉开片</small></div>
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
    <p class="au-echo au-rise">One vase, five nearest</p>
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
    <p class="au-p au-rise">一只南宋龙泉梅瓶，找到五件近亲。排第一的是西夏黑釉剔花梅瓶：器形最近，釉色相远。它说的是像在哪里。</p>
    <p class="au-fine au-rise">在 1,372 件 CC0 馆藏中检索；馆方编号可核对。</p>
  </div>
</section>


<!-- ═══ S11 核心发现 ═══ -->
<section class="au-s au-s11" id="s11" aria-label="发现">
  <div class="au-wrap">
    <h2 class="au-h2 au-rise">AI 学审美的第一课：分清“像”与“是”</h2>
    <p class="au-echo au-rise">Eight centuries of taste, written in the catalogue</p>
    <p class="au-p au-rise">清代宫廷公开地仿宋代名窑，博物馆著录里写得清清楚楚：仿钧、仿哥、仿官、仿龙泉、仿汝，台北故宫就有 352 件。什么被后世一再仿，什么就是那个时代公认的美。这三百多件器物是八百年审美留下的投票，也是机器学习里少有的实验条件：同一种风格，相隔五六百年由两个作坊做出来，谁做的是已知的。我们用这个“仿”字当老师，教模型分开两件事：它想像谁，它由谁所制。检索过 222 篇论文和十件最接近的专利，这条路还没有人走过。</p>
    <div class="au-figwrap au-rise">
      <p class="au-figcap">今年最强的通用视觉模型（以 PE-Core 为例）怎么看 190 件清代仿品</p>
      {fig_fooled()}
      <p class="au-fine">五个模型结果相近：放到宋元原型旁 85% – 95%，判成清代只有 36% – 41%。池大小已匹配，重采样 50 次。</p>
    </div>
    <p class="au-p au-rise">模型记住的是器物“想像谁”，对“由谁所制”只看见一部分。而行家靠的正是后者：胎、足、釉面的质感。我们正在用这 282 件仿品训练一个双头模型，一头认风格，一头认工艺，并让两头互不干扰。</p>
    <div class="au-todos au-rise">
      <div class="au-todo"><span class="au-todo__k">从未见过某类仿品时，仍判对年代的比例</span><span class="au-todo__v">待补 · 训练中</span></div>
      <div class="au-todo"><span class="au-todo__k">泄露真实年代的部位：足圈、釉面还是口沿</span><span class="au-todo__v">待补 · 训练中</span></div>
      <div class="au-todo"><span class="au-todo__k">跨文化检验：V&amp;A 的 88 件欧洲仿中国瓷</span><span class="au-todo__v">待补</span></div>
      <div class="au-todo"><span class="au-todo__k">公开真仿对照题（CArtBench 10 对，通用大模型目前 6/10）</span><span class="au-todo__v">待补</span></div>
    </div>
    <h3 class="au-h3 au-rise">护城河在哪</h3>
    <ul class="au-bullets au-rise">
      <li>只有我们在用著录里的“仿”做监督，它给出的能力是通用模型拿不到的：说出“风格最近宋钧，工艺特征与清代仿钧一致”。这正是行家“形似与神似”的分辨。</li>
      <li>行家“看足看釉”的经验第一次被量化，哪个部位在什么条件下泄露年代，有数可查，写进报告就是证据。</li>
      <li>同一套办法可复制到任何有“仿”著录的品类：青铜、玉器、书画。先做的人先拿到裁定过的数据。</li>
    </ul>
  </div>
</section>


<!-- ═══ S13 报告 ═══ -->
<section class="au-s au-s13" id="s13" aria-label="报告样例">
  <div class="au-wrap">
    <h2 class="au-h2 au-rise">它交出的报告</h2>
    <p class="au-echo au-rise">Four pieces the model had never seen</p>
    <p class="au-p au-rise">下面是训练好的模型在四件它从未见过的清代仿品上的输出，一次算好，原样保存。这一批共 38 件未见过的仿品，年代判对 35 件，风格判对 36 件。</p>
    {demo_cards()}
    <p class="au-fine au-rise">模型训练时见过其他仿品；完全没见过某一类仿品的严格结果在训练中。图片：国立故宫博物院开放资料（CC BY 4.0）。</p>
  </div>
</section>
<!-- ═══ S12 生意 ═══ -->
<section class="au-s au-s12" id="s12" aria-label="生意">
  <div class="au-wrap">
    <h2 class="au-h2 au-rise">能做成什么生意</h2>
    <p class="au-echo au-rise">A report, sold per piece</p>
    <p class="au-p au-rise">产品是一份报告：最像的馆藏近亲、风格归属、工艺是否与所称年代一致，以及在授权范围内的历史成交记录。按件收费，人工复核分级。</p>
    <div class="au-cols">
      <div class="au-col au-rise">
        <h3>谁付钱</h3>
        <ul>
          <li>中型拍卖行与古董商的上拍前核查</li>
          <li>替藏家做竞投前尽调的顾问</li>
          <li>保险与艺术品抵押贷款的估值依据</li>
          <li>交易平台的上架筛查</li>
        </ul>
      </div>
      <div class="au-col au-rise">
        <h3>凭什么</h3>
        <ul>
          <li>每句结论都附馆方编号，可核对</li>
          <li>仿品识别能力，市面产品都没有公开做到</li>
          <li>只用开放许可与授权数据，可商用的开放馆藏图已核实超过五万件</li>
        </ul>
      </div>
      <div class="au-col au-rise">
        <h3>怎么变大</h3>
        <ul>
          <li>交易平台按条计费</li>
          <li>保险与贷款条款写入这份报告</li>
          <li>同一方法扩到玉器、铜器、书画</li>
        </ul>
      </div>
    </div>
  </div>
</section>
<!-- ═══ S7 光止于此 ═══ -->
<section class="au-s au-s7" id="s7" aria-label="边界">
  <div class="au-wrap au-center">
    <p class="au-eyebrow au-rise">它的边界</p>
    <h2 class="au-h2 au-h2--line au-rise"><span class="au-nw">像不像</span> <span class="au-nw">像在哪</span> <span class="au-nw">判断归人</span></h2>
    <span class="au-redline" aria-hidden="true"></span>
    <p class="au-echo au-rise">Taught to look before it speaks</p>
    <p class="au-p au-rise">它答两个问题：像不像，像在哪。真不真、值多少，由人来答。正在加第三个答案：风格最近哪一窑，工艺像哪个时代。审美的最后一票，始终在人手里。</p>
  </div>
</section>

<!-- ═══ S8 既成 · 方作 · 未竟 ═══ -->
<section class="au-s au-s8" id="s8" aria-label="路线与局限">
  <div class="au-wrap">
    <h2 class="au-h2 au-rise">AI 学审美，走到哪了</h2>
    <p class="au-echo au-rise">Done, doing, not yet</p>
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
          <li>双头模型训练中，留一仿型的结果本周补上</li>
          <li>发明专利申请</li>
        </ul>
      </div>
      <div class="au-col au-rise">
        <h3>下一步</h3>
        <ul>
          <li>按博物馆原图重取 7 百万像素高清图，看清足圈与釉面</li>
          <li>报告生成模型：把检索与两头输出写成可核对的报告</li>
          <li>审美层第二步：请行家两两比较“哪件更精”，让模型学到每个时代各自的标准；再扩到青铜、玉器、书画</li>
        </ul>
      </div>
    </div>
    <p class="au-p au-rise">开放馆藏到了两万件，视觉模型微调后提升 5 分，自动分割已经成熟。三件事同一年到位，所以现在做。</p>
    {stage('cma_120203', '清 乾隆 仿哥釉八卦纹琮式瓶，克利夫兰艺术博物馆 1940.969', 728, 1459, '清 乾隆 · 仿哥釉八卦纹琮式瓶', '克利夫兰艺术博物馆 1940.969 · “仿古”是鉴赏的老话题', 900, 'au-stage--s8')}
  </div>
</section>

<!-- ═══ S9 来函，携一器 ═══ -->
<section class="au-s au-s9" id="s9" aria-label="来信">
  <div class="au-wrap au-center">
    <h2 class="au-h2 au-rise">来信，带一件器物</h2>
    <p class="au-echo au-rise">Write, and bring a piece</p>
    <p class="au-p au-rise">内测邀请制，面向研究者、博物馆与行家。说一句你在看什么，附一张照片。</p>
    <p class="au-cta au-rise"><a class="au-btn au-btn--moon" href="{S_MAIN}">申请研习内测</a></p>
    <p class="au-doors au-rise">
      <a href="{S_AB}">参与“哪件更精”标注</a>
      <a href="{S_ORG}">机构研究合作</a>
      <a href="{S_REP}">索取方法报告</a>
    </p>
  </div>
</section>

</main>

<footer class="au-foot">
  <p class="au-fine"><span class="au-nw">邀请制内测</span> · <span class="au-nw">器物照片取自克利夫兰、大都会、芝加哥三馆开放获取（CC0）</span> · <span class="au-nw">页面全部资源来自本站</span> · <span class="au-nw">© 2026 徐可斯</span></p>
</footer>

<script src="/vibecoding/vendor/gsap.min.js" defer></script>
<script src="/vibecoding/vendor/ScrollTrigger.min.js" defer></script>
<script src="/vibecoding/vendor/lenis.min.js" defer></script>
<script src="aurelia.js?v=5" defer></script>
</body>
</html>
'''
open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(html)
print('index.html', len(html.encode()), 'bytes')
