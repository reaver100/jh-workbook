/* 우리집 문제집 — 문제에 들어가는 그림(SVG) 만들기
   색은 앱 테마를 따라가므로 밝은 화면·어두운 화면 모두에서 잘 보입니다. */
(function (g) {
  'use strict';

  const INK = 'currentColor';
  const FILL = 'var(--brand)';
  const SOFT = 'var(--line)';

  function svg(w, h, body) {
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" ' +
      'fill="none" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
  }
  const txt = (x, y, s, size, anchor) =>
    '<text x="' + x + '" y="' + y + '" font-size="' + (size || 13) + '" font-weight="700" ' +
    'text-anchor="' + (anchor || 'middle') + '" fill="' + INK + '" stroke="none">' + s + '</text>';
  const line = (x1, y1, x2, y2, w, color) =>
    '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (color || INK) + '" stroke-width="' + (w || 2) + '"/>';
  const poly = (pts, fill, w) =>
    '<polygon points="' + pts + '" fill="' + (fill || 'none') + '" stroke="' + INK + '" stroke-width="' + (w || 2) + '"/>';

  /* ---------- 시계 ---------- */
  function clock(h, m) {
    const cx = 70, cy = 70, r = 58;
    let s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" stroke="' + INK + '" stroke-width="3" fill="var(--card)"/>';
    for (let i = 0; i < 12; i++) {
      const a = (i * 30) * Math.PI / 180;
      const big = i % 3 === 0;
      const r1 = r - (big ? 10 : 6), r2 = r - 2;
      s += line(cx + r1 * Math.sin(a), cy - r1 * Math.cos(a), cx + r2 * Math.sin(a), cy - r2 * Math.cos(a), big ? 3 : 1.5);
    }
    [[12, 0], [3, 90], [6, 180], [9, 270]].forEach(function (p) {
      const a = p[1] * Math.PI / 180, rr = r - 20;
      s += txt(cx + rr * Math.sin(a), cy - rr * Math.cos(a) + 5, p[0], 14);
    });
    const ha = ((h % 12) * 30 + m * 0.5) * Math.PI / 180;
    const ma = (m * 6) * Math.PI / 180;
    s += line(cx, cy, cx + 30 * Math.sin(ha), cy - 30 * Math.cos(ha), 5);
    s += line(cx, cy, cx + 45 * Math.sin(ma), cy - 45 * Math.cos(ma), 3, FILL);
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="' + INK + '" stroke="none"/>';
    return svg(140, 140, s);
  }

  /* ---------- 분수: 띠 모양 ---------- */
  function fracBar(total, shaded) {
    const W = 260, H = 54, w = W / total;
    let s = '';
    for (let i = 0; i < total; i++) {
      s += '<rect x="' + (i * w) + '" y="2" width="' + w + '" height="' + (H - 4) + '" ' +
        'fill="' + (i < shaded ? FILL : 'var(--card)') + '" stroke="' + INK + '" stroke-width="2"/>';
    }
    return svg(W, H, s);
  }

  /* ---------- 분수: 원 모양 ---------- */
  function fracCircle(total, shaded) {
    const cx = 70, cy = 70, r = 60;
    let s = '';
    for (let i = 0; i < total; i++) {
      const a1 = (i * 360 / total - 90) * Math.PI / 180;
      const a2 = ((i + 1) * 360 / total - 90) * Math.PI / 180;
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
      const large = (360 / total) > 180 ? 1 : 0;
      s += '<path d="M' + cx + ',' + cy + ' L' + x1.toFixed(1) + ',' + y1.toFixed(1) +
        ' A' + r + ',' + r + ' 0 ' + large + ',1 ' + x2.toFixed(1) + ',' + y2.toFixed(1) + ' Z" ' +
        'fill="' + (i < shaded ? FILL : 'var(--card)') + '" stroke="' + INK + '" stroke-width="2"/>';
    }
    return svg(140, 140, s);
  }

  /* ---------- 각 ---------- */
  function angle(deg) {
    const vx = 100, vy = 112, L = 92;
    const a = deg * Math.PI / 180;
    let s = line(vx, vy, vx + L, vy, 3);
    s += line(vx, vy, vx + L * Math.cos(a), vy - L * Math.sin(a), 3);
    const r = 34;
    const ex = vx + r * Math.cos(a), ey = vy - r * Math.sin(a);
    s += '<path d="M' + (vx + r) + ',' + vy + ' A' + r + ',' + r + ' 0 0,0 ' + ex.toFixed(1) + ',' + ey.toFixed(1) + '" stroke="' + FILL + '" stroke-width="2.5"/>';
    s += '<circle cx="' + vx + '" cy="' + vy + '" r="3.5" fill="' + INK + '" stroke="none"/>';
    return svg(205, 128, s);
  }

  /* ---------- 평면도형 ---------- */
  const SHAPES = {
    '정삼각형': '100,20 170,130 30,130',
    '이등변삼각형': '100,20 160,130 40,130',
    '직각삼각형': '40,20 40,130 160,130',
    '둔각삼각형': '40,30 180,130 30,130',
    '직사각형': '30,30 180,30 180,120 30,120',
    '정사각형': '55,25 155,25 155,125 55,125',
    '평행사변형': '55,30 190,30 155,120 20,120',
    '사다리꼴': '70,30 160,30 190,120 20,120',
    '마름모': '105,20 180,75 105,130 30,75'
  };
  function shape(name) {
    const pts = SHAPES[name];
    if (!pts) return '';
    let s = poly(pts, 'var(--card)', 2.5);
    if (name === '직각삼각형') s += '<rect x="40" y="112" width="18" height="18" fill="none" stroke="' + INK + '" stroke-width="2"/>';
    return svg(210, 150, s);
  }
  function shapeNames() { return Object.keys(SHAPES); }

  /* ---------- 넓이용 도형 (길이 표시) ---------- */
  function rectDim(a, b) {
    let s = '<rect x="65" y="30" width="150" height="90" fill="var(--card)" stroke="' + INK + '" stroke-width="2.5"/>';
    s += txt(140, 22, a + 'cm');
    s += txt(57, 80, b + 'cm', 13, 'end');
    return svg(230, 140, s);
  }
  function triDim(b, h) {
    let s = poly('90,25 230,120 60,120', 'var(--card)', 2.5);
    s += line(90, 25, 90, 120, 1.5, SOFT);
    s += '<rect x="90" y="106" width="14" height="14" fill="none" stroke="' + SOFT + '" stroke-width="1.5"/>';
    s += txt(145, 138, '밑변 ' + b + 'cm');
    s += txt(82, 78, h + 'cm', 13, 'end');
    return svg(250, 148, s);
  }
  function paraDim(b, h) {
    let s = poly('105,25 240,25 190,115 55,115', 'var(--card)', 2.5);
    s += line(105, 25, 105, 115, 1.5, SOFT);
    s += txt(150, 131, '밑변 ' + b + 'cm');
    s += txt(97, 75, h + 'cm', 13, 'end');
    return svg(255, 142, s);
  }
  function trapDim(a, b, h) {
    let s = poly('110,28 200,28 240,118 60,118', 'var(--card)', 2.5);
    s += line(110, 28, 110, 118, 1.5, SOFT);
    s += txt(155, 20, '윗변 ' + a + 'cm');
    s += txt(150, 134, '아랫변 ' + b + 'cm');
    s += txt(102, 78, h + 'cm', 13, 'end');
    return svg(255, 145, s);
  }

  /* ---------- 원 ---------- */
  function circleFig(r, label) {
    const cx = 80, cy = 80, rr = 62;
    let s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + rr + '" fill="var(--card)" stroke="' + INK + '" stroke-width="2.5"/>';
    if (label === 'd') {
      s += line(cx - rr, cy, cx + rr, cy, 2, FILL);
      s += txt(cx, cy - 8, '지름 ' + r + 'cm');
    } else {
      s += line(cx, cy, cx + rr, cy, 2, FILL);
      s += txt(cx + 32, cy - 8, r + 'cm');
    }
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="' + INK + '" stroke="none"/>';
    return svg(160, 160, s);
  }

  /* ---------- 직육면체 ---------- */
  function boxFig(a, b, c) {
    const x = 30, y = 50, w = 120, h = 80, d = 40;
    let s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="var(--card)" stroke="' + INK + '" stroke-width="2.5"/>';
    s += poly((x) + ',' + y + ' ' + (x + d) + ',' + (y - d) + ' ' + (x + w + d) + ',' + (y - d) + ' ' + (x + w) + ',' + y, 'none', 2.5);
    s += line(x + w, y, x + w + d, y - d, 2.5);
    s += line(x + w + d, y - d, x + w + d, y + h - d, 2.5);
    s += line(x + w, y + h, x + w + d, y + h - d, 2.5);
    s += txt(x + w / 2, y + h + 20, '가로 ' + a + 'cm');
    s += txt(x + w + d + 6, y + h / 2 - 8, '높이 ' + c + 'cm', 12, 'start');
    s += txt(x + d / 2 - 6, y - d / 2, '세로 ' + b + 'cm', 12, 'end');
    return svg(275, 165, s);
  }

  /* ---------- 세기 (1학년) ---------- */
  function dots(n, shape2) {
    const per = 5, rows = Math.ceil(n / per);
    let s = '';
    for (let i = 0; i < n; i++) {
      const cx = 28 + (i % per) * 46, cy = 28 + Math.floor(i / per) * 46;
      if (shape2 === 'square') s += '<rect x="' + (cx - 16) + '" y="' + (cy - 16) + '" width="32" height="32" rx="6" fill="' + FILL + '" stroke="none"/>';
      else s += '<circle cx="' + cx + '" cy="' + cy + '" r="16" fill="' + FILL + '" stroke="none"/>';
    }
    return svg(per * 46 + 10, rows * 46 + 10, s);
  }

  /* ---------- 자 (길이 재기) ---------- */
  function ruler(cm) {
    const x0 = 26, y = 70, u = 22, W = x0 * 2 + 10 * u;
    let s = '<rect x="' + x0 + '" y="' + y + '" width="' + (10 * u) + '" height="34" fill="var(--card)" stroke="' + INK + '" stroke-width="2"/>';
    for (let i = 0; i <= 10; i++) {
      const x = x0 + i * u;
      s += line(x, y, x, y + (i % 5 === 0 ? 16 : 9), i % 5 === 0 ? 2 : 1.2);
      if (i % 5 === 0) s += txt(x, y + 29, i, 11);
    }
    s += '<rect x="' + x0 + '" y="' + (y - 26) + '" width="' + (cm * u) + '" height="18" rx="4" fill="' + FILL + '" stroke="none"/>';
    return svg(W, 115, s);
  }

  /* ---------- 막대그래프 ---------- */
  function bars(labels, values) {
    const W = 260, H = 160, base = 125, bw = W / labels.length;
    const max = Math.max.apply(null, values) || 1;
    let s = line(20, base, W - 10, base, 2);
    labels.forEach(function (lb, i) {
      const h = (values[i] / max) * 95;
      const x = 28 + i * (bw - 6);
      s += '<rect x="' + x + '" y="' + (base - h) + '" width="' + (bw - 28) + '" height="' + h + '" fill="' + FILL + '" stroke="none"/>';
      s += txt(x + (bw - 28) / 2, base + 18, lb, 12);
      s += txt(x + (bw - 28) / 2, base - h - 6, values[i], 12);
    });
    return svg(W, H, s);
  }

  g.FIG = {
    clock: clock, fracBar: fracBar, fracCircle: fracCircle, angle: angle,
    shape: shape, shapeNames: shapeNames,
    rectDim: rectDim, triDim: triDim, paraDim: paraDim, trapDim: trapDim,
    circleFig: circleFig, boxFig: boxFig, dots: dots, ruler: ruler, bars: bars
  };
})(typeof window !== 'undefined' ? window : globalThis);
