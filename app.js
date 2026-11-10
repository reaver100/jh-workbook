/* 우리집 문제집 — 앱 본체 */
(function () {
  'use strict';

  const KEY = 'wb.v1';
  const SUBJ = {
    korean: { name: '국어', color: 'var(--korean)', ico: '📖' },
    english: { name: '영어', color: 'var(--english)', ico: '🔤' },
    math: { name: '수학', color: 'var(--math)', ico: '➗' },
    science: { name: '과학', color: 'var(--science)', ico: '🔬' },
    social: { name: '국가 및 수도', color: 'var(--social)', ico: '🌍' }
  };
  const SUBJ_ORDER = ['korean', 'english', 'math', 'science', 'social'];
  const EMOJIS = ['🐻', '🐰', '🦊', '🐼', '🦁', '🐯', '🐸', '🐥', '🦄', '🐙'];
  const SET_SIZE = 20;   /* 한 단원을 고르면 이만큼 나온다 */
  /* 수학은 문제가 무한히 만들어지므로 한 단원당 이만큼 풀면 다음 단원으로 넘어간다 */
  const MATH_QUOTA = 24;

  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, txt) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  };
  const shuffle = (a) => {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  };
  const today = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  /* ---------------- 저장소 ---------------- */
  let S = { profiles: [], current: null, data: {} };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && typeof p === 'object') S = Object.assign(S, p);
      }
    } catch (e) { /* 저장소를 못 읽어도 앱은 돌아간다 */ }
    if (!Array.isArray(S.profiles)) S.profiles = [];
    if (!S.data || typeof S.data !== 'object') S.data = {};
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
      return true;
    } catch (e) {
      toast('저장 공간이 부족해요');
      return false;
    }
  }
  function blank() {
    return { solved: {}, correct: {}, days: [], wrong: [], logs: [], best: 0, maxStreak: 0, prog: {} };
  }
  function me() {
    if (!S.current) return null;
    if (!S.data[S.current]) S.data[S.current] = blank();
    const d = S.data[S.current];
    if (!d.solved) d.solved = {};
    if (!d.correct) d.correct = {};
    if (!Array.isArray(d.days)) d.days = [];
    if (!Array.isArray(d.wrong)) d.wrong = [];
    if (!Array.isArray(d.logs)) d.logs = [];
    if (!d.prog || typeof d.prog !== 'object') d.prog = {};
    return d;
  }
  function profile() {
    return S.profiles.find((p) => p.id === S.current) || null;
  }

  /* ---------------- 화면 전환 ---------------- */
  let stack = [];
  function show(name, push) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('on'));
    const sc = $('sc-' + name);
    if (sc) sc.classList.add('on');
    if (push !== false) stack.push(name);
    const tabs = ['home', 'wrong', 'stats', 'settings'];
    $('nav').classList.toggle('on', tabs.indexOf(name) >= 0 && !!S.current);
    document.querySelectorAll('.nav button').forEach((b) => b.classList.toggle('on', b.dataset.go === name));
    $('backBtn').hidden = ['home', 'profile', 'wrong', 'stats', 'settings'].indexOf(name) >= 0;
    const titles = {
      profile: '우리집 문제집', edit: '프로필', home: '우리집 문제집', setup: '문제 수 고르기',
      quiz: '문제 풀기', result: '결과', wrong: '오답노트', stats: '기록', settings: '설정'
    };
    $('title').textContent = titles[name] || '우리집 문제집';
    const p = profile();
    $('who').textContent = p && name !== 'profile' ? p.emoji + ' ' + p.name + ' · ' + p.grade + '학년' : '';
    window.scrollTo(0, 0);
  }
  function back() {
    stack.pop();
    const prev = stack.pop() || (S.current ? 'home' : 'profile');
    show(prev);
  }

  let toastTimer = null;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('on'), 1900);
  }

  /* ---------------- 문제 만들기 ---------------- */
  function bankOf(grade, subject) {
    const srcs = [window.BANK_MAIN, window.BANK_EXTRA, window.BANK_PLUS];
    const out = [], seen = new Set();
    srcs.forEach((src) => {
      const list = ((src || {})[grade] || {})[subject];
      if (!Array.isArray(list)) return;
      list.forEach((it) => {
        if (!it || !it.q) return;
        const sig = bankSig(it);
        if (seen.has(sig)) return;
        seen.add(sig);
        out.push(it);
      });
    });
    return out;
  }
  /* 문제 구분용 서명 — 문구가 같아도 보기가 다르면 다른 문제다 */
  function bankSig(it) {
    return it.q + '|' + (Array.isArray(it.c) ? it.c.join('·') : (it.a || []).join('·'));
  }
  function fromBank(it, grade, subject) {
    const base = {
      subject: subject, grade: grade, unitName: it.u, explain: it.e, fig: it.i || null,
      key: subject + '|' + grade + '|' + bankSig(it)
    };
    if (it.t === 'input') {
      return Object.assign(base, { type: 'input', q: it.q, answers: it.a.map(String), placeholder: it.p || '답' });
    }
    const correct = it.c[it.a];
    const opts = shuffle(it.c);
    return Object.assign(base, { type: 'choice', q: it.q, choices: opts, answer: opts.indexOf(correct) });
  }
  /* ---------------- 진도(단계) ---------------- */
  /* 단원 순서대로 줄을 세운 문제 목록. 진도는 이 줄 위의 위치다. */
  function orderedBank(grade, subject) {
    const all = bankOf(grade, subject);
    const order = [], byUnit = new Map();
    all.forEach((it) => {
      if (!byUnit.has(it.u)) { byUnit.set(it.u, []); order.push(it.u); }
      byUnit.get(it.u).push(it);
    });
    const out = [];
    order.forEach((u) => byUnit.get(u).forEach((it) => out.push(it)));
    return out;
  }
  function mathUnits(grade) {
    return (window.MATH_ENGINE && window.MATH_ENGINE.units(grade)) || [];
  }
  /* 한 바퀴의 길이 — 수학은 단원 수 × 할당량, 나머지는 문제은행 크기 */
  function poolSize(grade, subject) {
    if (subject === 'math') return Math.max(mathUnits(grade).length, 1) * MATH_QUOTA;
    return orderedBank(grade, subject).length;
  }
  /* ---------------- 단원 ---------------- */
  /* 과목의 단원 목록. 수학은 자동 생성이라 문제 수가 정해져 있지 않다(total 0). */
  function unitsOf(grade, subject) {
    if (subject === 'math') return mathUnits(grade).map((u) => ({ id: u.id, name: u.name, total: 0, items: null }));
    const pool = orderedBank(grade, subject);
    const map = new Map();
    pool.forEach((it) => { if (!map.has(it.u)) map.set(it.u, []); map.get(it.u).push(it); });
    /* 문제가 몇 개 안 되는 단원은 하나로 모아 준다 — 2~3문제짜리 단원이 생기지 않도록 */
    const MIN = 10;
    const big = [], small = [];
    [...map.entries()].forEach(([name, items]) => {
      (items.length >= MIN ? big : small).push({ id: name, name: name, total: items.length, items: items });
    });
    if (small.length) {
      const merged = [];
      small.forEach((u) => u.items.forEach((it) => merged.push(it)));
      if (small.length === 1) big.push(small[0]);
      else big.push({ id: '__mix__', name: '여러 단원 모아 풀기', total: merged.length, items: merged });
    }
    return big;
  }
  function unitKey(grade, subject, unitId) { return 'u|' + subject + '|' + grade + '|' + unitId; }
  function unitProg(grade, subject, unitId) {
    const d = me();
    if (!d) return { done: 0, sets: 0, round: 1 };
    const k = unitKey(grade, subject, unitId);
    const p = d.prog[k];
    if (!p || typeof p !== 'object') d.prog[k] = { done: 0, sets: 0, round: 1 };
    else {
      if (typeof p.done !== 'number') p.done = 0;
      if (typeof p.sets !== 'number') p.sets = 0;
      if (typeof p.round !== 'number') p.round = 1;
    }
    return d.prog[k];
  }
  /* 고른 단원에서 이어지는 문제를 만든다 */
  function buildUnitSet(grade, subject, unit, done) {
    if (subject === 'math') {
      const qs = (window.MATH_ENGINE && window.MATH_ENGINE.make(grade, [unit.id], SET_SIZE)) || [];
      return qs.map((q) => Object.assign(q, { key: 'math|' + grade + '|' + q.q, placeholder: q.placeholder || '답' }));
    }
    const items = unit.items || [];
    if (!items.length) return [];
    const take = Math.min(SET_SIZE, items.length);
    const start = ((done % items.length) + items.length) % items.length;
    const out = [];
    for (let i = 0; i < take; i++) out.push(fromBank(items[(start + i) % items.length], grade, subject));
    return out;
  }

  function progKey(grade, subject) { return subject + '|' + grade; }
  function progOf(grade, subject) {
    const d = me();
    if (!d) return { done: 0, sets: 0, round: 1 };
    const k = progKey(grade, subject);
    const p = d.prog[k];
    if (!p || typeof p !== 'object') d.prog[k] = { done: 0, sets: 0, round: 1 };
    else {
      if (typeof p.done !== 'number') p.done = 0;
      if (typeof p.sets !== 'number') p.sets = 0;
      if (typeof p.round !== 'number') p.round = 1;
    }
    return d.prog[k];
  }
  /* 지금 진도에서 다음에 나올 단원 이름 */
  function unitAt(grade, subject, pos) {
    const total = poolSize(grade, subject);
    if (!total) return '';
    const p = ((pos % total) + total) % total;
    if (subject === 'math') {
      const us = mathUnits(grade);
      return us.length ? (us[Math.floor(p / MATH_QUOTA) % us.length] || us[0]).name : '';
    }
    const pool = orderedBank(grade, subject);
    return pool.length ? (pool[p] || pool[0]).u : '';
  }
  /* 진도 위치에서 n문제를 이어서 뽑는다 */
  function buildNext(grade, subject, n, done) {
    const total = poolSize(grade, subject);
    if (!total) return [];
    const take = Math.min(n, total);
    if (subject === 'math') {
      const us = mathUnits(grade);
      if (!us.length) return [];
      const out = [];
      let p = ((done % total) + total) % total, left = take, guard = 0;
      while (left > 0 && guard++ < 20) {
        const ui = Math.floor(p / MATH_QUOTA) % us.length;
        const room = MATH_QUOTA - (p % MATH_QUOTA);
        const c = Math.min(left, room);
        window.MATH_ENGINE.make(grade, [us[ui].id], c).forEach((q) => {
          out.push(Object.assign(q, { key: 'math|' + grade + '|' + q.q, placeholder: q.placeholder || '답' }));
        });
        left -= c;
        p = (p + c) % total;
      }
      return out;
    }
    const pool = orderedBank(grade, subject);
    const out = [];
    const start = ((done % total) + total) % total;
    for (let i = 0; i < take; i++) out.push(fromBank(pool[(start + i) % total], grade, subject));
    return out;
  }

  /* ---------------- 정답 비교 ---------------- */
  function canon(s) {
    return String(s).trim().toLowerCase().replace(/\s+/g, ' ').replace(/\s*\/\s*/g, '/');
  }
  const UNIT_RE = /(cm²|cm³|cm2|cm3|cm|mm|km|kg|ml|l|g|t|℃|도|%|개|장|자루|마리|명|권|가지|분|시간|원|쪽)\s*$/;
  function numeric(s) {
    let t = canon(s).replace(/,/g, '');
    for (let i = 0; i < 3; i++) t = t.replace(UNIT_RE, '').trim();
    if (/^-?\d+(\.\d+)?$/.test(t)) return parseFloat(t);
    let m = t.match(/^(\d+)\/(\d+)$/);
    if (m && +m[2] !== 0) return +m[1] / +m[2];
    m = t.match(/^(\d+)[\s\-와]+(\d+)\/(\d+)$/);
    if (m && +m[3] !== 0) return +m[1] + +m[2] / +m[3];
    return null;
  }
  function isRight(user, answers) {
    const u = canon(user);
    if (!u) return false;
    if (answers.some((a) => canon(a) === u)) return true;
    const un = numeric(user);
    if (un === null) return false;
    return answers.some((a) => {
      const an = numeric(a);
      return an !== null && Math.abs(an - un) < 1e-9;
    });
  }
  function answerText(q) {
    return q.type === 'choice' ? q.choices[q.answer] : q.answers[0];
  }

  /* ---------------- 프로필 화면 ---------------- */
  function renderProfiles() {
    const box = $('profileList');
    box.innerHTML = '';
    if (!S.profiles.length) {
      const e = el('div', 'empty');
      e.innerHTML = '<span class="e">👋</span>먼저 프로필을 만들어 주세요.';
      box.appendChild(e);
    }
    S.profiles.forEach((p) => {
      const b = el('button', 'pitem');
      const av = el('span', 'av', p.emoji);
      const meta = el('span', 'meta');
      meta.appendChild(el('span', null, p.name));
      const d = S.data[p.id] || blank();
      const total = SUBJ_ORDER.reduce((s, k) => s + (d.solved[k] || 0), 0);
      meta.appendChild(el('small', null, p.grade + '학년 · 지금까지 ' + total + '문제'));
      b.appendChild(av); b.appendChild(meta); b.appendChild(el('span', null, '›'));
      b.onclick = () => { S.current = p.id; save(); stack = []; show('home'); renderHome(); };
      box.appendChild(b);
    });
  }

  let editing = null;
  function openEdit(p) {
    editing = p ? Object.assign({}, p) : { id: 'p' + Date.now(), name: '', grade: 3, emoji: EMOJIS[0] };
    $('editTitle').textContent = p ? '프로필 수정' : '새 프로필';
    $('pName').value = editing.name;
    $('delProfileBtn').hidden = !p;
    const gc = $('gradeChips'); gc.innerHTML = '';
    [1, 2, 3, 4, 5, 6].forEach((g) => {
      const c = el('button', 'chip' + (g === editing.grade ? ' on' : ''), g + '학년');
      c.onclick = () => { editing.grade = g; openEditChips(); };
      gc.appendChild(c);
    });
    const ec = $('emojiChips'); ec.innerHTML = '';
    EMOJIS.forEach((e) => {
      const c = el('button', 'chip' + (e === editing.emoji ? ' on' : ''), e);
      c.onclick = () => { editing.emoji = e; openEditChips(); };
      ec.appendChild(c);
    });
    show('edit');
  }
  function openEditChips() {
    [...$('gradeChips').children].forEach((c, i) => c.classList.toggle('on', i + 1 === editing.grade));
    [...$('emojiChips').children].forEach((c, i) => c.classList.toggle('on', EMOJIS[i] === editing.emoji));
  }

  /* ---------------- 홈 ---------------- */
  function streakOf(days) {
    if (!days.length) return 0;
    const set = new Set(days);
    let n = 0;
    const d = new Date();
    if (!set.has(today())) d.setDate(d.getDate() - 1);
    for (;;) {
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      if (!set.has(k)) break;
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }
  function renderHome() {
    const p = profile(), d = me();
    if (!p || !d) { show('profile'); renderProfiles(); return; }
    const hour = new Date().getHours();
    const greet = hour < 11 ? '좋은 아침' : hour < 18 ? '안녕' : '좋은 저녁';
    $('homeHi').textContent = greet + ', ' + p.name + '!';
    const totalSolved = SUBJ_ORDER.reduce((s, k) => s + (d.solved[k] || 0), 0);
    $('homeSub').textContent = p.grade + '학년 문제집 · 지금까지 ' + totalSolved + '문제 풀었어요';
    const todayCount = d.logs.filter((l) => l.d === today()).reduce((s, l) => s + l.total, 0);
    $('kToday').textContent = todayCount;
    $('kStreak').textContent = streakOf(d.days);
    const tc = SUBJ_ORDER.reduce((s, k) => s + (d.correct[k] || 0), 0);
    $('kRate').textContent = totalSolved ? Math.round((tc / totalSolved) * 100) + '%' : '—';
    SUBJ_ORDER.forEach((k) => {
      const s = d.solved[k] || 0, c = d.correct[k] || 0;
      const id = 'p' + k.charAt(0).toUpperCase() + k.slice(1);
      const un = unitsOf(p.grade, k).length;
      $(id).textContent = s
        ? un + '개 단원 · 정답률 ' + Math.round((c / s) * 100) + '%'
        : un + '개 단원';
    });
    const wn = d.wrong.length;
    $('resumeMsg').textContent = wn
      ? '오답노트에 ' + wn + '문제가 모여 있어요. 다시 풀면 기억에 오래 남습니다.'
      : '오답노트는 아직 비어 있어요. 문제를 풀면 틀린 것만 모입니다.';
  }

  /* ---------------- 단원 고르기 ---------------- */
  let setup = { subject: 'math', unit: null };
  function openSetup(subject) {
    if (!SUBJ[subject]) return;
    const p = profile();
    setup.subject = subject;
    const list = unitsOf(p.grade, subject);
    $('setupTitle').textContent = SUBJ[subject].ico + ' ' + SUBJ[subject].name + ' · ' + p.grade + '학년';

    if (!list.length) {
      $('setupHint').textContent = '아직 이 학년 문제가 준비되지 않았어요.';
      $('setupProg').textContent = '';
      $('setupBar').style.width = '0%';
      $('unitList').innerHTML = '';
      show('setup');
      return;
    }

    /* 과목 전체 진도 */
    let done = 0, total = 0, cleared = 0;
    list.forEach((u) => {
      const pr = unitProg(p.grade, subject, u.id);
      if (u.total) { total += u.total; done += Math.min(pr.done, u.total) + (pr.round > 1 ? 0 : 0); }
      if (u.total && (pr.round > 1 || pr.done >= u.total)) cleared++;
      if (!u.total && pr.sets > 0) cleared++;
    });
    $('setupHint').textContent = subject === 'math'
      ? '단원을 고르면 그 단원 문제가 20개 나와요. 수학은 숫자가 매번 새로 만들어집니다.'
      : '단원을 고르면 아직 안 푼 문제부터 20개가 이어서 나와요.';
    $('setupProg').textContent = subject === 'math'
      ? list.length + '개 단원'
      : list.length + '개 단원 · 전체 ' + total + '문제 중 ' + done + '문제 풀었어요';
    $('setupBar').style.width = total ? Math.round((done / total) * 100) + '%' : (list.length ? Math.round((cleared / list.length) * 100) + '%' : '0%');

    const box = $('unitList');
    box.innerHTML = '';
    list.forEach((u) => {
      const pr = unitProg(p.grade, subject, u.id);
      const b = el('button', 'unit');
      const left = el('div', null);
      left.style.flex = '1';
      left.appendChild(el('b', null, u.name));
      let sub;
      if (!u.total) {
        sub = pr.sets > 0 ? pr.sets + '번 풀었어요 · 새 문제가 계속 나와요' : '새 문제가 계속 나와요';
      } else if (pr.round > 1) {
        sub = '한 바퀴 다 풀었어요 · ' + pr.round + '바퀴째 ' + pr.done + '/' + u.total;
      } else {
        sub = pr.done + ' / ' + u.total + '문제';
      }
      const s = el('small', null, sub);
      s.style.display = 'block';
      s.style.color = 'var(--ink-soft)';
      s.style.fontWeight = '600';
      left.appendChild(s);
      b.appendChild(left);
      b.appendChild(el('span', null, '▶'));
      if (u.total && pr.round > 1) b.classList.add('on');
      b.onclick = () => startUnitSet(subject, u);
      box.appendChild(b);
    });
    show('setup');
  }

  /* 고른 단원으로 퀴즈 시작 */
  function startUnitSet(subject, unit) {
    const p = profile();
    if (!p) return;
    setup.subject = subject;
    setup.unit = unit;
    const pr = unitProg(p.grade, subject, unit.id);
    const qs = buildUnitSet(p.grade, subject, unit, pr.done);
    if (!qs.length) { toast('이 단원은 아직 문제가 없어요'); return; }
    startQuiz(qs, SUBJ[subject].name + ' · ' + unit.name, 'normal', {
      key: unitKey(p.grade, subject, unit.id), total: unit.total || 0
    });
  }

  /* ---------------- 퀴즈 ---------------- */
  let run = null;
  function startQuiz(questions, label, mode, prog) {
    if (!questions.length) { toast('낼 수 있는 문제가 없어요'); return; }
    run = {
      qs: questions, i: 0, ok: 0, wrong: [], label: label,
      mode: mode || 'normal', locked: false, prog: prog || null
    };
    show('quiz');
    drawQ();
  }
  function drawQ() {
    const q = run.qs[run.i];
    run.locked = false;
    $('bar').style.width = Math.round((run.i / run.qs.length) * 100) + '%';
    $('qmeta').textContent = (run.i + 1) + ' / ' + run.qs.length + ' · ' + (q.unitName || SUBJ[q.subject].name);
    $('qtext').textContent = q.q;
    const fig = $('qfig');
    if (q.fig) { fig.innerHTML = q.fig; fig.hidden = false; }
    else { fig.innerHTML = ''; fig.hidden = true; }
    $('verdict').hidden = true;
    $('nextBtn').hidden = true;
    const opts = $('opts');
    opts.innerHTML = '';
    if (q.type === 'choice') {
      $('answerbox').hidden = true;
      q.choices.forEach((c, idx) => {
        const b = el('button', 'opt');
        b.appendChild(el('span', 'no', String(idx + 1)));
        b.appendChild(el('span', 'tx', c));
        b.onclick = () => grade(idx === q.answer, b, idx === q.answer ? null : b);
        opts.appendChild(b);
      });
    } else {
      $('answerbox').hidden = false;
      const inp = $('answerInput');
      inp.value = '';
      inp.placeholder = q.placeholder || '답';
      inp.disabled = false;
      $('submitBtn').disabled = false;
      setTimeout(() => { try { inp.focus(); } catch (e) {} }, 120);
    }
  }
  function grade(ok, rightBtn, wrongBtn) {
    if (run.locked) return;
    run.locked = true;
    const q = run.qs[run.i];
    if (q.type === 'choice') {
      [...$('opts').children].forEach((b, idx) => {
        b.disabled = true;
        if (idx === q.answer) b.classList.add('right');
      });
      if (!ok && wrongBtn) wrongBtn.classList.add('wrong');
    } else {
      $('answerInput').disabled = true;
      $('submitBtn').disabled = true;
    }
    const v = $('verdict');
    v.className = 'verdict ' + (ok ? 'ok' : 'no');
    v.innerHTML = '';
    v.appendChild(el('b', null, ok ? '잘했어요! 정답이에요 ✅' : '아쉬워요. 정답은 ' + answerText(q)));
    if (q.explain) v.appendChild(el('span', null, q.explain));
    v.hidden = false;
    if (ok) run.ok++; else run.wrong.push(q);
    recordOne(q, ok);
    $('nextBtn').textContent = run.i + 1 >= run.qs.length ? '결과 보기' : '다음 문제';
    $('nextBtn').hidden = false;
    $('bar').style.width = Math.round(((run.i + 1) / run.qs.length) * 100) + '%';
  }
  function nextQ() {
    if (run.i + 1 >= run.qs.length) { finish(); return; }
    run.i++;
    drawQ();
  }

  /* ---------------- 기록 ---------------- */
  function recordOne(q, ok) {
    const d = me();
    if (!d) return;
    d.solved[q.subject] = (d.solved[q.subject] || 0) + 1;
    if (ok) d.correct[q.subject] = (d.correct[q.subject] || 0) + 1;
    const t = today();
    if (d.days.indexOf(t) < 0) d.days.push(t);
    const i = d.wrong.findIndex((w) => w.k === q.key);
    if (ok) {
      if (i >= 0) d.wrong.splice(i, 1);
    } else if (i < 0) {
      d.wrong.unshift({
        k: q.key, s: q.subject, g: q.grade, u: q.unitName || '', t: q.type,
        q: q.q, f: q.fig || null, c: q.choices || null, a: q.answer != null ? q.answer : null,
        ans: q.answers || null, e: q.explain || '', p: q.placeholder || '답', ts: Date.now()
      });
      if (d.wrong.length > 300) d.wrong.length = 300;
    }
    const st = streakOf(d.days);
    if (st > (d.maxStreak || 0)) d.maxStreak = st;
    advanceProg();
    save();
  }
  /* 한 문제 풀 때마다 진도를 한 칸 옮긴다 — 중간에 그만둬도 거기서 이어진다 */
  function advanceProg() {
    if (!run || !run.prog) return;
    const d = me();
    if (!d) return;
    const pr = d.prog[run.prog.key];
    if (!pr) return;
    const total = run.prog.total || 0;
    pr.done = (pr.done || 0) + 1;
    if (total && pr.done >= total) { pr.done = 0; pr.round = (pr.round || 1) + 1; }
  }
  function finish() {
    const d = me();
    const total = run.qs.length, ok = run.ok;
    const pct = Math.round((ok / total) * 100);
    if (d) {
      d.logs.unshift({ d: today(), ts: Date.now(), s: run.qs[0].subject, label: run.label, total: total, ok: ok });
      if (d.logs.length > 120) d.logs.length = 120;
      if (pct > (d.best || 0)) d.best = pct;
      if (run.prog && d.prog[run.prog.key]) {
        const pr = d.prog[run.prog.key];
        pr.sets = (pr.sets || 0) + 1;
      }
      save();
    }
    const nx = $('rNext');
    if (run.prog && d && d.prog[run.prog.key]) {
      const pr = d.prog[run.prog.key];
      const p = profile();
      const un = setup.unit ? setup.unit.name : '';
      nx.textContent = '여기까지 저장했어요.'
        + (un ? " 다음에 '" + un + "' 단원을 고르면 이어서 나와요." : '');
      nx.hidden = false;
    } else {
      nx.hidden = true;
    }
    $('rScore').textContent = ok;
    $('rOf').textContent = total + '문제 중 ' + ok + '개 정답 (' + pct + '%)';
    $('rEmo').textContent = pct === 100 ? '🏆' : pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '🌱';
    $('rMsg').textContent = pct === 100 ? '만점! 완벽해요' : pct >= 80 ? '아주 잘했어요!' : pct >= 50 ? '좋아요, 조금만 더!' : '천천히 다시 해 보자';
    const wc = $('rWrongCard'), wl = $('rWrongList');
    wl.innerHTML = '';
    if (run.wrong.length) {
      wc.hidden = false;
      run.wrong.forEach((q) => wl.appendChild(wrongCard(q)));
      $('retryWrongBtn').hidden = false;
    } else {
      wc.hidden = true;
      $('retryWrongBtn').hidden = true;
    }
    show('result');
  }
  function wrongCard(q, onDel) {
    const c = el('div', 'wi');
    c.appendChild(el('div', 't', SUBJ[q.subject || q.s].name + ' · ' + (q.unitName || q.u || '')));
    c.appendChild(el('div', 'q', q.q));
    c.appendChild(el('div', 'a', '정답: ' + (q.type ? answerText(q) : (q.t === 'choice' ? q.c[q.a] : (q.ans || [''])[0]))));
    if (q.e || q.explain) c.appendChild(el('div', 'muted', q.e || q.explain));
    if (onDel) {
      const b = el('button', 'btn ghost sm', '이 문제 지우기');
      b.onclick = onDel;
      c.appendChild(b);
    }
    return c;
  }

  /* ---------------- 오답노트 ---------------- */
  let wrongFilter = 'all';
  function renderWrong() {
    const d = me();
    if (!d) return;
    const fc = $('wrongFilter'); fc.innerHTML = '';
    const opts = [{ id: 'all', n: '전체' }].concat(SUBJ_ORDER.map((k) => ({ id: k, n: SUBJ[k].name })));
    opts.forEach((o) => {
      const cnt = o.id === 'all' ? d.wrong.length : d.wrong.filter((w) => w.s === o.id).length;
      const c = el('button', 'chip' + (o.id === wrongFilter ? ' on' : ''), o.n + ' ' + cnt);
      c.onclick = () => { wrongFilter = o.id; renderWrong(); };
      fc.appendChild(c);
    });
    const list = wrongFilter === 'all' ? d.wrong : d.wrong.filter((w) => w.s === wrongFilter);
    $('wrongHint').textContent = d.wrong.length
      ? '틀린 문제는 자동으로 모이고, 다시 풀어서 맞히면 목록에서 빠집니다.'
      : '문제를 풀면 틀린 것만 여기에 모입니다.';
    $('wrongStartBtn').hidden = !list.length;
    $('wrongStartBtn').textContent = list.length ? '모아서 다시 풀기 (' + Math.min(list.length, 20) + '문제)' : '다시 풀기';
    const box = $('wrongList'); box.innerHTML = '';
    $('wrongEmpty').hidden = !!list.length;
    list.slice(0, 60).forEach((w) => {
      box.appendChild(wrongCard(w, () => {
        const i = d.wrong.findIndex((x) => x.k === w.k);
        if (i >= 0) d.wrong.splice(i, 1);
        save(); renderWrong(); toast('지웠어요');
      }));
    });
  }
  function wrongToQuestion(w) {
    const base = { subject: w.s, grade: w.g, unitName: w.u, explain: w.e, key: w.k, fig: w.f || null, placeholder: w.p || '답' };
    if (w.t === 'input') return Object.assign(base, { type: 'input', q: w.q, answers: w.ans || [''] });
    const correct = w.c[w.a];
    const opts = shuffle(w.c);
    return Object.assign(base, { type: 'choice', q: w.q, choices: opts, answer: opts.indexOf(correct) });
  }

  /* ---------------- 통계 ---------------- */
  const BADGES = [
    { id: 'first', n: '🌱 첫걸음', t: (d) => tot(d) >= 1 },
    { id: 'ten', n: '🔟 10문제', t: (d) => tot(d) >= 10 },
    { id: 'hundred', n: '💯 100문제', t: (d) => tot(d) >= 100 },
    { id: 'fivehundred', n: '🚀 500문제', t: (d) => tot(d) >= 500 },
    { id: 'perfect', n: '🏆 만점왕', t: (d) => (d.best || 0) >= 100 },
    { id: 's3', n: '🔥 3일 연속', t: (d) => (d.maxStreak || 0) >= 3 },
    { id: 's7', n: '⭐ 7일 연속', t: (d) => (d.maxStreak || 0) >= 7 },
    { id: 'allsub', n: '🎓 다섯 과목 모두', t: (d) => SUBJ_ORDER.every((k) => (d.solved[k] || 0) > 0) }
  ];
  function tot(d) { return SUBJ_ORDER.reduce((s, k) => s + (d.solved[k] || 0), 0); }

  function renderStats() {
    const d = me();
    if (!d) return;
    const bars = $('rateBars'); bars.innerHTML = '';
    SUBJ_ORDER.forEach((k) => {
      const s = d.solved[k] || 0, c = d.correct[k] || 0;
      const pct = s ? Math.round((c / s) * 100) : 0;
      const b = el('div', 'bar');
      const lb = el('div', 'lb');
      lb.appendChild(el('span', null, SUBJ[k].ico + ' ' + SUBJ[k].name));
      lb.appendChild(el('span', null, s ? pct + '% (' + c + '/' + s + ')' : '아직 없음'));
      const tr = el('div', 'tr');
      const i = el('i');
      i.style.width = pct + '%';
      i.style.background = SUBJ[k].color;
      tr.appendChild(i);
      b.appendChild(lb); b.appendChild(tr);
      bars.appendChild(b);
    });
    const bl = $('badgeList'); bl.innerHTML = '';
    BADGES.forEach((bg) => {
      const got = bg.t(d);
      bl.appendChild(el('span', 'badge' + (got ? '' : ' off'), bg.n));
    });
    const ll = $('logList'); ll.innerHTML = '';
    $('logEmpty').hidden = !!d.logs.length;
    d.logs.slice(0, 20).forEach((l) => {
      const row = el('div', 'log');
      row.appendChild(el('span', 'd', l.d.slice(5).replace('-', '/')));
      row.appendChild(el('span', 's', (SUBJ[l.s] ? SUBJ[l.s].ico + ' ' : '') + (l.label || (SUBJ[l.s] ? SUBJ[l.s].name : ''))));
      row.appendChild(el('span', 'r', l.ok + '/' + l.total));
      ll.appendChild(row);
    });
  }

  /* ---------------- 설정 ---------------- */
  function renderSettings() {
    const box = $('settingsProfiles'); box.innerHTML = '';
    S.profiles.forEach((p) => {
      const b = el('button', 'pitem');
      b.appendChild(el('span', 'av', p.emoji));
      const meta = el('span', 'meta');
      meta.appendChild(el('span', null, p.name + (p.id === S.current ? ' (지금)' : '')));
      meta.appendChild(el('small', null, p.grade + '학년 · 눌러서 수정'));
      b.appendChild(meta);
      b.appendChild(el('span', null, '›'));
      b.onclick = () => openEdit(p);
      box.appendChild(b);
    });
  }
  function exportData() {
    try {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '문제집-백업-' + today() + '.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      toast('백업 파일을 내보냈어요');
    } catch (e) { toast('내보내기에 실패했어요'); }
  }
  function importData(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const p = JSON.parse(String(r.result));
        if (!p || !Array.isArray(p.profiles)) throw new Error('형식이 달라요');
        if (!confirm('지금 기록을 백업 파일 내용으로 바꿉니다. 계속할까요?')) return;
        S = Object.assign({ profiles: [], current: null, data: {} }, p);
        save();
        stack = [];
        if (S.current && S.profiles.some((x) => x.id === S.current)) { show('home'); renderHome(); }
        else { show('profile'); renderProfiles(); }
        toast('불러왔어요');
      } catch (e) { toast('파일을 읽을 수 없어요'); }
    };
    r.readAsText(file);
  }

  /* ---------------- 이벤트 연결 ---------------- */
  function bind() {
    $('backBtn').onclick = back;
    $('addProfileBtn').onclick = () => openEdit(null);
    $('addProfileBtn2').onclick = () => openEdit(null);
    $('switchBtn').onclick = () => { stack = []; show('profile'); renderProfiles(); };

    $('saveProfileBtn').onclick = () => {
      const nm = $('pName').value.trim();
      if (!nm) { toast('이름을 적어 주세요'); $('pName').focus(); return; }
      editing.name = nm;
      const i = S.profiles.findIndex((p) => p.id === editing.id);
      const isNew = i < 0;
      if (isNew) S.profiles.push(editing); else S.profiles[i] = editing;
      if (!S.data[editing.id]) S.data[editing.id] = blank();
      // 새로 만든 프로필은 바로 그 아이로 전환한다
      if (isNew || !S.current) S.current = editing.id;
      save();
      toast('저장했어요');
      if (S.current === editing.id) { stack = []; show('home'); renderHome(); }
      else { stack = []; show('profile'); renderProfiles(); }
    };
    $('delProfileBtn').onclick = () => {
      if (!confirm('이 프로필과 기록을 모두 지웁니다. 계속할까요?')) return;
      S.profiles = S.profiles.filter((p) => p.id !== editing.id);
      delete S.data[editing.id];
      if (S.current === editing.id) S.current = S.profiles.length ? S.profiles[0].id : null;
      save();
      stack = [];
      if (S.current) { show('home'); renderHome(); } else { show('profile'); renderProfiles(); }
      toast('지웠어요');
    };

    document.querySelectorAll('.subjects .sub').forEach((b) => { b.onclick = () => openSetup(b.dataset.s); });


    $('submitBtn').onclick = () => {
      const q = run.qs[run.i];
      const v = $('answerInput').value;
      if (!v.trim()) { toast('답을 적어 주세요'); return; }
      grade(isRight(v, q.answers));
    };
    $('answerInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); $('submitBtn').click(); }
    });
    $('nextBtn').onclick = nextQ;

    $('againBtn').onclick = () => { if (setup.unit) startUnitSet(setup.subject, setup.unit); else openSetup(setup.subject); };
    $('retryWrongBtn').onclick = () => {
      const qs = run.wrong.map((q) => {
        if (q.type === 'choice') {
          const correct = q.choices[q.answer];
          const opts = shuffle(q.choices);
          return Object.assign({}, q, { choices: opts, answer: opts.indexOf(correct) });
        }
        return q;
      });
      startQuiz(shuffle(qs), '다시 풀기', 'retry');
    };
    $('homeBtn').onclick = () => { stack = []; show('home'); renderHome(); };
    $('goWrongBtn').onclick = () => { stack = []; show('wrong'); renderWrong(); };

    $('wrongStartBtn').onclick = () => {
      const d = me();
      const list = (wrongFilter === 'all' ? d.wrong : d.wrong.filter((w) => w.s === wrongFilter)).slice(0, 20);
      startQuiz(shuffle(list.map(wrongToQuestion)), '오답노트', 'retry');
    };

    $('exportBtn').onclick = exportData;
    $('importBtn').onclick = () => $('importFile').click();
    $('importFile').onchange = (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) importData(f);
      e.target.value = '';
    };
    $('clearWrongBtn').onclick = () => {
      if (!confirm('오답노트를 비울까요?')) return;
      const d = me(); d.wrong = []; save(); renderWrong(); toast('비웠어요');
    };
    $('resetBtn').onclick = () => {
      if (!confirm('이 프로필의 기록을 모두 지웁니다. 프로필은 남습니다. 계속할까요?')) return;
      S.data[S.current] = blank(); save(); renderHome(); toast('기록을 지웠어요');
    };

    document.querySelectorAll('.nav button').forEach((b) => {
      b.onclick = () => {
        const go = b.dataset.go;
        stack = [];
        show(go);
        if (go === 'home') renderHome();
        if (go === 'wrong') renderWrong();
        if (go === 'stats') renderStats();
        if (go === 'settings') renderSettings();
      };
    });

    window.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  }

  /* ---------------- 시작 ---------------- */
  load();
  bind();
  if (S.current && S.profiles.some((p) => p.id === S.current)) { show('home'); renderHome(); }
  else { show('profile'); renderProfiles(); }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
