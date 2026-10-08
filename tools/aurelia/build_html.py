#!/usr/bin/env python3
"""Single source of the page copy: regenerates site/vibecoding/aurelia/index.html.
Copy voice: 雅致、半文言、成语精当，普通人可读；数字只用白名单（见 spec §6.2）。"""
import json, re, os
from urllib.parse import quote
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'site', 'vibecoding', 'aurelia')
def m(subject): return 'mailto:email@kesixu.com?subject=' + quote(subject, safe='')
S_MAIN, S_AB, S_ORG, S_REP = m('Aurelia 研习内测申请'), m('Aurelia 专家两两标注参与'), m('Aurelia 机构研究合作'), m('Aurelia 方法报告索取')
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
  <span class="au-shadow" aria-hidden="true"></span>
  {img}
  <span class="au-sheen" aria-hidden="true"><i></i></span>
  <figcaption class="au-cap">{cap}<small>{acc}</small></figcaption>
</figure>'''

SEAL = '<svg class="au-seal" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><rect x="4" y="4" width="92" height="92" rx="6"/><rect class="au-seal__inner" x="11" y="11" width="78" height="78" rx="3"/><text x="50" y="52" text-anchor="middle" dominant-baseline="central">鉴</text></svg>'

html = f'''<!DOCTYPE html>
<html lang="zh-CN" class="motion-pending">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Aurelia 鉴赏 · 似在何处 · 古瓷风格比对</title>
<meta name="description" content="一纸影像，入两万件馆藏著录之器中寻其所似，并指明似在何处。不鉴真伪，不论估价，不替上手。研习之用，邀请内测">
<meta name="theme-color" content="#121619">
<meta property="og:type" content="website">
<meta property="og:title" content="Aurelia 鉴赏 · 似在何处">
<meta property="og:description" content="一纸影像，两万件馆藏著录之器中寻其所似——似在何处，讲得分明；真伪与价值，仍归于人">
<meta property="og:url" content="https://kesixu.com/vibecoding/aurelia/">
<meta property="og:image" content="https://kesixu.com/vibecoding/aurelia/media/og.jpg">
<link rel="canonical" href="https://kesixu.com/vibecoding/aurelia/">
<link rel="icon" type="image/svg+xml" href="/vibecoding/assets/favicon.svg">
<link rel="preload" as="font" type="font/woff2" href="fonts/mashanzheng-aurelia.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="fonts/notoserif-aurelia.woff2" crossorigin>
<link rel="preload" as="image" href="media/vessels/cma_140168-900.webp" imagesrcset="media/vessels/cma_140168-900.webp 900w, media/vessels/cma_140168-1400.webp 1400w" imagesizes="(min-width:900px) 40vw, 78vw">
<link rel="stylesheet" href="aurelia.css?v=3">
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
      <p class="au-slip au-intro"><span>古瓷风格比对 · 研习之用</span></p>
      <h1 class="au-h1 au-intro">似在何处{SEAL}</h1>
      <p class="au-echo au-intro">Nearest in style, and where</p>
      <p class="au-lede au-intro">一纸影像，入两万件馆藏著录之器中，寻其形神最近者，并指明似在何处。<br class="au-br">不鉴真伪，不论估价，不替上手。</p>
      <div class="au-cta au-intro">
        <a class="au-btn au-btn--moon" href="{S_MAIN}">修书申请研习</a>
        <a class="au-btn" href="/vibecoding/">回灯火</a>
      </div>
    </div>
    {stage('cma_140168', '明 永乐 甜白釉暗花梅瓶，克利夫兰艺术博物馆 1964.167', 877, 1419, '明 永乐 · 甜白釉暗花梅瓶', '克利夫兰艺术博物馆 1964.167', 900, 'au-stage--hero au-intro', srcset='media/vessels/cma_140168-900.webp 900w, media/vessels/cma_140168-1400.webp 1400w', sizes='(min-width:900px) 40vw, 78vw', prio=True)}
  </div>
  <p class="au-scroll-hint au-intro" aria-hidden="true"><span>展卷</span><i></i></p>
</section>

<!-- ═══ S2 看器，贵在上手 ═══ -->
<section class="au-s au-s2" id="s2" aria-label="为何是比对">
  <div class="au-wrap au-two">
    {stage('cma_97956', '宋 钧窑 莲蕾罐，克利夫兰艺术博物馆 1917.60', 1060, 967, '宋 钧窑 · 莲蕾罐', '克利夫兰艺术博物馆 1917.60 · 本页天青，自此而来', 1100, 'au-stage--s2')}
    <div class="au-text">
      <h2 class="au-h2 au-rise">看器　贵在上手</h2>
      <p class="au-echo au-rise">Not a verdict. A comparison.</p>
      <p class="au-p au-rise">掂其轻重，抚其胎骨，审其底足，迎光观釉——鉴赏的功夫在手上，影像代劳不得。</p>
      <p class="au-p au-rise">影像所能者，另有一事：在两万件著录之器中，拣出最相似的几件，指明相似之处，而后把判断仍交还于人。</p>
    </div>
  </div>
</section>

<!-- ═══ S3 五馆同堂 ═══ -->
<section class="au-s au-s3" id="s3" aria-label="语料">
  <canvas class="au-space" aria-hidden="true"></canvas>
  <div class="au-wrap">
    <h2 class="au-h2 au-rise">五馆同堂　两万件著录之器</h2>
    <p class="au-echo au-rise">Twenty thousand catalogued pieces, five named museums</p>
    <p class="au-bignum au-rise"><span class="au-num">19,487</span><span class="au-bignum__lab">件 · 开放馆藏</span></p>
    <p class="au-fine au-rise au-sources"><span class="au-nw-d">台北故宫 14,557 · 英国 V&amp;A 3,473 · 克利夫兰 699 · 芝加哥 673 · 大都会 85</span><span class="au-sep">　｜　</span><span class="au-nw-d">明 8,830 · 清 6,577 · 宋 1,251 · 元 407 · 唐 165</span></p>
    <div class="au-arc">
      {stage('cma_134843', '宋 汝窑 笔洗，克利夫兰艺术博物馆 1957.40', 1346, 523, '宋 汝窑 · 笔洗', '克利夫兰 1957.40', 900, 'au-stage--arc au-wide')}
      {stage('cma_135015', '南宋 官窑 葵口碗，克利夫兰艺术博物馆 1957.66', 1508, 808, '南宋 官窑 · 葵口碗', '克利夫兰 1957.66', 900, 'au-stage--arc au-wide')}
      {stage('cma_121469', '宋 建窑 兔毫盏，克利夫兰艺术博物馆 1942.132', 1484, 1011, '宋 建窑 · 兔毫盏', '克利夫兰 1942.132', 900, 'au-stage--arc au-wide')}
      {stage('met_49855', '元 青花莲池纹玉壶春瓶，大都会艺术博物馆 1984.297', 653, 1349, '元 · 青花莲池纹玉壶春瓶', '大都会 1984.297', 900, 'au-stage--arc')}
      {stage('met_39666', '明 宣德 青花云龙纹罐，大都会艺术博物馆 37.191.1', 947, 1004, '明 宣德 · 青花云龙纹罐', '大都会 37.191.1', 900, 'au-stage--arc')}
      {stage('cma_154732', '清 雍正 釉里红海水龙纹梅瓶，克利夫兰艺术博物馆 1989.314', 870, 1477, '清 雍正 · 釉里红海水龙纹梅瓶', '克利夫兰 1989.314', 900, 'au-stage--arc')}
      {stage('cma_112196', '清 雍正 粉彩蝠桃纹盘，克利夫兰艺术博物馆 1930.639', 1612, 1613, '清 雍正 · 粉彩蝠桃纹盘', '克利夫兰 1930.639', 900, 'au-stage--arc au-wide')}
    </div>
    <p class="au-fine au-fine--note">背景微光，是微调编码器所得嵌入的二维投影（t-SNE），一万九千四百八十七件，仅作示意。器物影像取自克利夫兰、大都会两馆开放获取（CC0）；其余馆藏图片依各馆许可，仅供研习。</p>
  </div>
</section>

<!-- ═══ S4 闭卷而试 ═══ -->
<section class="au-s au-s4" id="s4" aria-label="结果">
  <div class="au-wrap">
    <h2 class="au-h2 au-rise">闭卷而试</h2>
    <p class="au-echo au-rise">Held-out, no leakage</p>
    <p class="au-p au-rise">留出二千四百三十五件为考题，自始未入训练。考其前五件中同朝代、同器型者几何：</p>
    <div class="au-bars au-rise">
      <div class="au-bargroup">
        <p class="au-bargroup__t">前五命中 precision@5</p>
        <div class="au-bar"><span class="au-bar__lab">微调前</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.795"></i></span><b>79.5%</b></div>
        <div class="au-bar"><span class="au-bar__lab">微调后</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--after" style="--w:.847"></i></span><b>84.7%</b></div>
        <p class="au-bar__delta">+5.2 分</p>
      </div>
      <div class="au-bargroup">
        <p class="au-bargroup__t">排序之序 nDCG@10</p>
        <div class="au-bar"><span class="au-bar__lab">微调前</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.778"></i></span><b>77.8%</b></div>
        <div class="au-bar"><span class="au-bar__lab">微调后</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--after" style="--w:.847"></i></span><b>84.7%</b></div>
        <p class="au-bar__delta">+6.9 分</p>
      </div>
    </div>
    <p class="au-fine au-rise">「命中」即同朝代且同器型；单次运行，未作显著性检验。</p>
    <div class="au-routes au-rise">
      <p class="au-bargroup__t">六条路，皆已试过（nDCG@10）</p>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">OpenCLIP 微调</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--after" style="--w:.847"></i></span><b>0.847</b></div>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">DINOv3 微调 + 自蒸馏</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.824"></i></span><b>0.824</b></div>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">DINOv3 微调</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.822"></i></span><b>0.822</b></div>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">DINOv3 冻结</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.779"></i></span><b>0.779</b></div>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">OpenCLIP 冻结</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.778"></i></span><b>0.778</b></div>
      <div class="au-bar au-bar--route"><span class="au-bar__lab">SDXL 生成器特征</span><span class="au-bar__track"><i class="au-bar__fill au-bar__fill--before" style="--w:.689"></i></span><b>0.689</b></div>
      <p class="au-p au-p--small">新者未必胜；依数据，取其简。</p>
    </div>
  </div>
</section>

<!-- ═══ S5 开片 · 证据 ═══ -->
<section class="au-s au-s5" id="s5" aria-label="证据">
  <div class="au-wrap au-two au-two--ev">
    <div class="au-evstage">
      {crackle}
      <figure class="au-stage au-stage--ev" data-v="cma_135015">
        <span class="au-shadow" aria-hidden="true"></span>
        <img class="au-vessel" src="media/vessels/cma_135015-900.webp" srcset="media/vessels/cma_135015-900.webp 900w, media/vessels/cma_135015-1400.webp 1400w" sizes="(min-width:900px) 44vw, 84vw" width="1508" height="808" alt="南宋 官窑 葵口碗，克利夫兰艺术博物馆 1957.66" decoding="async" loading="lazy">
        <span class="au-sheen" aria-hidden="true"><i></i></span>
        <span class="au-sheen au-sheen--v" aria-hidden="true"><i></i></span>
        <svg class="au-outline" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path pathLength="1" d="{outline}"/></svg>
        <span class="au-part au-part--rim" aria-hidden="true">口沿</span>
        <span class="au-part au-part--body" aria-hidden="true">腹</span>
        <span class="au-part au-part--foot" aria-hidden="true">圈足</span>
        <figcaption class="au-cap">南宋 官窑 · 葵口碗<small>克利夫兰艺术博物馆 1957.66</small></figcaption>
      </figure>
    </div>
    <div class="au-text">
      <p class="au-eyebrow au-rise">光驻于此</p>
      <h2 class="au-h2 au-rise">先分其形　再量三事</h2>
      <p class="au-echo au-rise">Segment first, then measure</p>
      <ol class="au-steps">
        <li class="au-step" data-step="一"><b>以言导形</b><span>以文字引导，自动分出器身——月色轮廓，即模型所给之掩码。一百五十件全分辨率，mean IoU 0.884；点选提示则为 0.614 / 0.492。</span></li>
        <li class="au-step" data-step="二"><b>部位</b><span>光自口沿而下，经腹至圈足，一如行家看器之序。部位级检索尚属概念验证：一百五十件，单看一部位，前五件同朝代约六成五。</span></li>
        <li class="au-step" data-step="三"><b>三项可复核之测量</b>
          <dl class="au-measure">
            <div><dt>轮廓对称</dt><dd>98.2<i>%</i></dd><small>与镜像之 IoU</small></div>
            <div><dt>釉面色差</dt><dd>16.3</dd><small>Lab 标准差 · 素釉开片</small></div>
            <div><dt>纹饰密度</dt><dd>1.1<i>%</i></dd><small>器身边缘像素之比</small></div>
          </dl>
          <span class="au-fine">本页实算，以此碗为例。</span></li>
      </ol>
      <p class="au-p au-rise">此为测量，非为品评。开片、兔毫、窑变皆「不匀」，而各得其妙；系统不出美丑之分。</p>
    </div>
  </div>
</section>

<!-- ═══ S6 一瓶，五亲 ═══ -->
<section class="au-s au-s6" id="s6" aria-label="检索">
  <div class="au-wrap au-wrap--rel">
    <h2 class="au-h2 au-rise">一瓶　五亲</h2>
    <p class="au-echo au-rise">One beam, five neighbours</p>
    <div class="au-query">
      {stage('cma_134979', '南宋 龙泉窑 梅瓶，克利夫兰艺术博物馆 1957.52', 898, 1509, '所询 · 南宋 龙泉窑 · 梅瓶', '克利夫兰艺术博物馆 1957.52', 1100, 'au-stage--q')}
    </div>
    <svg class="au-beams" aria-hidden="true" focusable="false"><path pathLength="1" d=""/><path pathLength="1" d=""/><path pathLength="1" d=""/><path pathLength="1" d=""/><path pathLength="1" d=""/></svg>
    <ol class="au-nbs">
      <li class="au-nb"><span class="au-spot" aria-hidden="true"></span>{stage('aic_80869', '西夏 黑釉剔花梅瓶，芝加哥艺术博物馆 80869', 477, 994, '西夏 · 黑釉剔花梅瓶', '芝加哥 80869 · 接近度 0.859', 700, 'au-stage--nb')}</li>
      <li class="au-nb"><span class="au-spot" aria-hidden="true"></span>{stage('cma_134997', '宋 龙泉窑 五管瓶，克利夫兰艺术博物馆 1957.53', 690, 1128, '宋 龙泉窑 · 五管瓶', '克利夫兰 1957.53 · 接近度 0.857', 700, 'au-stage--nb')}</li>
      <li class="au-nb"><span class="au-spot" aria-hidden="true"></span>{stage('cma_284746', '宋 刻花梅瓶，克利夫兰艺术博物馆 2017.20', 903, 1460, '宋 · 刻花梅瓶', '克利夫兰 2017.20 · 接近度 0.848', 700, 'au-stage--nb')}</li>
      <li class="au-nb"><span class="au-spot" aria-hidden="true"></span>{stage('cma_153286', '宋 梅瓶，克利夫兰艺术博物馆 1986.245', 548, 1391, '宋 · 梅瓶', '克利夫兰 1986.245 · 接近度 0.846', 700, 'au-stage--nb')}</li>
      <li class="au-nb"><span class="au-spot" aria-hidden="true"></span>{stage('aic_58904', '北宋 婴戏纹盖梅瓶，芝加哥艺术博物馆 58904', 515, 919, '北宋 · 婴戏纹盖梅瓶', '芝加哥 58904 · 接近度 0.844', 700, 'au-stage--nb')}</li>
    </ol>
    <p class="au-p au-rise">第一件竟是西夏黑釉剔花梅瓶——器形最近，釉色相远。它只说似在何处；真伪几何、价值几何，皆留与人。</p>
    <p class="au-fine au-rise">由生产模型于一千三百七十二件 CC0 馆藏（克利夫兰、芝加哥）中离线检索而得，余弦接近度；馆方编号可据以核对著录。</p>
  </div>
</section>

<!-- ═══ S7 光止于此 ═══ -->
<section class="au-s au-s7" id="s7" aria-label="边界">
  <div class="au-wrap au-center">
    <p class="au-eyebrow au-rise">光止于此</p>
    <h2 class="au-h2 au-h2--line au-rise">不鉴真伪　不论估价　不替上手</h2>
    <span class="au-redline" aria-hidden="true"></span>
    <p class="au-echo au-rise">Taught to look before it speaks</p>
    <p class="au-p au-rise">它答「似与不似、似在何处」；「真与不真、值与不值」，仍归于人。此线写在产品里，也写在评测里。</p>
  </div>
</section>

<!-- ═══ S8 既成 · 方作 · 未竟 ═══ -->
<section class="au-s au-s8" id="s8" aria-label="路线与局限">
  <div class="au-wrap">
    <h2 class="au-h2 au-rise">既成 · 方作 · 未竟</h2>
    <p class="au-echo au-rise">Done, doing, not yet</p>
    <div class="au-cols">
      <div class="au-col au-rise">
        <h3>既成</h3>
        <ul>
          <li>感知之层：一万九千四百八十七件语料上微调而得的风格嵌入与检索</li>
          <li>证据之层：自动分出器身，三项器表测量</li>
          <li>无泄漏评测：留出二千四百三十五件，指标皆可追溯至文件</li>
        </ul>
      </div>
      <div class="au-col au-rise">
        <h3>方作</h3>
        <ul>
          <li>判断之层：同朝代、同器型内的典范与稀缺百分位（描述而已，不出美丑）</li>
          <li>「孰者更精」两两比较之标注工具已成，专家采集未始</li>
          <li>发明专利交底书已成稿，申请在备</li>
        </ul>
      </div>
      <div class="au-col au-rise">
        <h3>未竟</h3>
        <ul>
          <li>多以单视角影像为据；不替上手</li>
          <li>recall@k 结构性偏低（相关集大）；跨馆稳健性待测</li>
          <li>专家偏好数据尚为零；铜器、玉器、书画仍在规划</li>
        </ul>
      </div>
    </div>
    <p class="au-p au-rise">何以是此时：开放馆藏积至两万件之量；视觉语言模型稍加专项微调，即得五分之增；以言导形之分割，已能自动分出器身——三事同年可用。</p>
    {stage('cma_120203', '清 乾隆 仿哥釉八卦纹琮式瓶，克利夫兰艺术博物馆 1940.969', 728, 1459, '清 乾隆 · 仿哥釉八卦纹琮式瓶', '克利夫兰艺术博物馆 1940.969 · 仿古一事，鉴赏之旧题', 900, 'au-stage--s8')}
  </div>
</section>

<!-- ═══ S9 来函，携一器 ═══ -->
<section class="au-s au-s9" id="s9" aria-label="来信">
  <div class="au-wrap au-center">
    <h2 class="au-h2 au-rise">来函　携一器</h2>
    <p class="au-echo au-rise">Write, and bring a piece</p>
    <p class="au-p au-rise">内测采邀请制，先予有研习之需的学人、馆方与行家。来信但说手边正看何器，附一影像尤佳。</p>
    <p class="au-cta au-rise"><a class="au-btn au-btn--moon" href="{S_MAIN}">修书申请研习</a></p>
    <p class="au-doors au-rise">
      <a href="{S_AB}">参与「孰者更精」标注</a>
      <a href="{S_ORG}">机构研究合作</a>
      <a href="{S_REP}">索取方法报告</a>
    </p>
  </div>
</section>

</main>

<footer class="au-foot">
  <nav aria-label="站内">
    <a href="/vibecoding/">主页 · 划亮</a>
    <a href="/vibecoding/pathbot/">PathBot</a>
    <a href="https://resume.kesixu.com">简历</a>
  </nav>
  <p class="au-fine"><span class="au-nw">邀请制内测</span> · <span class="au-nw">器物影像取自克利夫兰、大都会、芝加哥三馆开放获取（CC0）</span> · <span class="au-nw">无追踪、无埋点、无第三方请求</span> · <span class="au-nw">© 2026 徐可斯</span></p>
</footer>

<script src="/vibecoding/vendor/gsap.min.js" defer></script>
<script src="/vibecoding/vendor/ScrollTrigger.min.js" defer></script>
<script src="aurelia.js?v=2" defer></script>
</body>
</html>
'''
open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(html)
print('index.html', len(html.encode()), 'bytes')
