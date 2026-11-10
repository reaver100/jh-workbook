/* 영어 단어 사냥 — 카메라로 사물을 찍어 영어 단어를 모으는 앱 */
(() => {
'use strict';

const $ = id => document.getElementById(id);
const KEY = 'wordhunt.v1';
const MKEY = 'wordhunt.mission.v1';
const MIN_PROB = 0.12;

/* ---------- 저장 ---------- */
let words = [];
try { words = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { words = []; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(words)); } catch (e) { toast('저장 공간이 꽉 찼어요. 도감에서 조금 지워 주세요.'); } };
const has = en => words.some(w => w.en === en);

/* ---------- 오늘의 목표 ---------- */
const TARGETS = [
  ['cup','컵'],['mug','머그컵'],['clock','시계'],['lamp','전등'],['chair','의자'],
  ['table','탁자'],['sofa','소파'],['pillow','베개'],['towel','수건'],['backpack','책가방'],
  ['sneakers','운동화'],['sock','양말'],['water bottle','물병'],['bowl','그릇'],['plate','접시'],
  ['refrigerator','냉장고'],['television','텔레비전'],['remote control','리모컨'],
  ['laptop','노트북 컴퓨터'],['keyboard','키보드'],['mouse','마우스'],['cell phone','휴대폰'],
  ['pen','볼펜'],['eraser','지우개'],['basket','바구니'],['broom','빗자루'],['umbrella','우산'],
  ['teddy bear','곰인형'],['ball','공'],['banana','바나나'],['apple','사과'],['orange','오렌지'],
  ['candle','양초'],['fan','선풍기'],['microwave','전자레인지'],['toaster','토스터'],
  ['bed','침대'],['desk','책상'],['bookcase','책장'],['dog','개'],['cat','고양이'],
  ['flower pot','화분'],['wooden spoon','나무 숟가락'],['soccer ball','축구공'],
  ['watch','손목시계'],['tablet','태블릿'],['guitar','기타'],['piano','피아노'],
  ['puzzle','퍼즐'],['shoes','신발'],['pizza','피자'],['vacuum','청소기']
];
const today = () => new Date().toISOString().slice(0, 10);
let mission = { date: '', list: [] };
try { mission = JSON.parse(localStorage.getItem(MKEY) || 'null') || mission; } catch (e) {}
if (mission.date !== today()) {
  let seed = 0; for (const c of today()) seed = (seed * 31 + c.charCodeAt(0)) % 99991;
  const pool = TARGETS.slice();
  const list = [];
  for (let i = 0; i < 5 && pool.length; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483647;
    const [en, ko] = pool.splice(seed % pool.length, 1)[0];
    list.push({ en, ko, done: false });
  }
  mission = { date: today(), list };
  localStorage.setItem(MKEY, JSON.stringify(mission));
}
const saveMission = () => localStorage.setItem(MKEY, JSON.stringify(mission));

function drawMission() {
  $('missionList').innerHTML = mission.list.map(m =>
    `<span class="chip ${m.done ? 'done' : ''}"><b>${m.en}</b><i>${m.ko}</i></span>`).join('');
}

/* ---------- 점수 / 배지 ---------- */
const LEVELS = [[100,'👑'],[60,'🥇'],[30,'🥈'],[10,'🥉'],[0,'🌱']];
function drawScore() {
  $('count').textContent = words.length;
  $('badge').textContent = (LEVELS.find(l => words.length >= l[0]) || LEVELS[4])[1];
  const next = [10, 30, 60, 100, 200].find(n => n > words.length) || 200;
  $('progFill').style.width = Math.min(100, words.length / next * 100) + '%';
  $('progTxt').textContent = words.length >= 200
    ? `${words.length}개 — 단어 사냥 왕! 👑`
    : `${words.length}개 모았어요 · 다음 배지까지 ${next - words.length}개`;
}

/* ---------- 소리 ---------- */
let soundOn = localStorage.getItem('wordhunt.sound') !== 'off';
function drawSound() { $('soundBtn').classList.toggle('off', !soundOn); }
let voice = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices() || [];
  voice = vs.find(v => /en[-_]US/i.test(v.lang) && /female|samantha|google/i.test(v.name))
       || vs.find(v => /en[-_]US/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function speak(text) {
  if (!soundOn || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.82; u.pitch = 1.05;
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  } catch (e) {}
}
let actx = null;
function ding(ok = true) {
  if (!soundOn) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = ok ? [660, 880, 1320] : [330, 262];
    notes.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, actx.currentTime + i * 0.09);
      g.gain.exponentialRampToValueAtTime(0.22, actx.currentTime + i * 0.09 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + i * 0.09 + 0.26);
      o.connect(g); g.connect(actx.destination);
      o.start(actx.currentTime + i * 0.09); o.stop(actx.currentTime + i * 0.09 + 0.3);
    });
  } catch (e) {}
}

/* ---------- 토스트 / 축하 ---------- */
let tT = null;
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(tT); tT = setTimeout(() => { t.hidden = true; }, 2200);
}
function confetti() {
  const box = $('confetti'); box.hidden = false; box.innerHTML = '';
  const cols = ['#ffd166','#4ade80','#60a5fa','#fb7185','#f472b6','#fff'];
  for (let i = 0; i < 36; i++) {
    const d = document.createElement('div');
    d.className = 'conf';
    d.style.left = Math.random() * 100 + '%';
    d.style.background = cols[i % cols.length];
    d.style.animationDuration = (1.1 + Math.random() * 0.9) + 's';
    d.style.animationDelay = (Math.random() * 0.3) + 's';
    box.appendChild(d);
  }
  setTimeout(() => { box.hidden = true; box.innerHTML = ''; }, 2400);
}

/* ---------- 탭 ---------- */
document.querySelectorAll('.tab').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === b));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('on', v.id === b.dataset.view));
  if (b.dataset.view === 'book') drawGrid();
  if (b.dataset.view === 'quiz') newQuiz();
});

/* ---------- 카메라 ---------- */
const cam = $('cam');
let stream = null, facing = 'environment', model = null, busy = false;

async function openCam() {
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 1280 } },
    audio: false
  });
  cam.srcObject = stream;
  await cam.play().catch(() => {});
}

async function loadModel() {
  if (model) return model;
  $('loading').hidden = false;
  $('loadingText').textContent = 'AI 준비 중… 처음엔 조금 걸려요';
  try {
    model = await mobilenet.load({ version: 2, alpha: 1.0 });
    // 첫 추론을 미리 돌려서 실제 사용할 때 빠르게
    const c = document.createElement('canvas'); c.width = c.height = 224;
    await model.classify(c);
  } finally { $('loading').hidden = true; }
  return model;
}

$('startBtn').onclick = async () => {
  const note = $('coverNote'); note.textContent = '';
  try {
    $('startBtn').disabled = true;
    await openCam();
    $('cover').hidden = true;
    await loadModel();
    toast('준비 끝! 물건을 찍어 보세요 📸');
  } catch (e) {
    const msg = String(e && e.name || e);
    note.textContent = /NotAllowed|Permission/i.test(msg)
      ? '카메라 권한을 허용해 주세요. (주소창 왼쪽 자물쇠 → 카메라 허용)'
      : /NotFound/i.test(msg) ? '카메라를 찾을 수 없어요.'
      : '카메라를 열지 못했어요: ' + msg;
  } finally { $('startBtn').disabled = false; }
};

$('flipBtn').onclick = async () => {
  facing = facing === 'environment' ? 'user' : 'environment';
  try { await openCam(); } catch (e) { toast('카메라를 바꿀 수 없어요'); }
};
$('soundBtn').onclick = () => {
  soundOn = !soundOn;
  localStorage.setItem('wordhunt.sound', soundOn ? 'on' : 'off');
  drawSound(); if (soundOn) ding(true);
};

/* ---------- 찍기 ---------- */
let pending = null;

function grab(size) {
  const vw = cam.videoWidth, vh = cam.videoHeight;
  if (!vw || !vh) return null;
  const s = Math.min(vw, vh) * 0.82;             // 가운데 정사각형
  const sx = (vw - s) / 2, sy = (vh - s) / 2;
  const c = $('shot'); c.width = c.height = size;
  const x = c.getContext('2d');
  if (facing === 'user') { x.translate(size, 0); x.scale(-1, 1); }
  x.drawImage(cam, sx, sy, s, s, 0, 0, size, size);
  return c;
}

$('shutter').onclick = async () => {
  if (busy) return;
  if (!stream) { toast('먼저 시작하기를 눌러 주세요'); return; }
  busy = true;
  try {
    await loadModel();
    const big = grab(448);
    if (!big) { toast('카메라가 아직 준비되지 않았어요'); return; }
    const thumb = big.toDataURL('image/jpeg', 0.55);
    $('loading').hidden = false;
    $('loadingText').textContent = '무엇인지 보고 있어요…';
    const small = grab(224);
    const res = await model.classify(small, 3);
    $('loading').hidden = true;
    showResult(res, thumb);
  } catch (e) {
    $('loading').hidden = true;
    toast('인식에 실패했어요. 다시 찍어 볼까요?');
  } finally { busy = false; }
};

function showResult(res, img) {
  const top = res[0] || { className: '', probability: 0 };
  const w = lookupWord(top.className);
  const weak = top.probability < MIN_PROB;

  pending = { en: w.en, ko: w.ko, prob: top.probability, img, raw: top.className };

  $('sheetImg').src = img;
  $('sheetEn').textContent = w.en || '???';
  $('sheetKo').textContent = w.ko || '(한국어 이름은 아직 몰라요)';
  $('sheetSub').textContent = weak
    ? '잘 모르겠어요 🤔 더 가까이, 밝은 곳에서 찍어 보세요'
    : has(w.en) ? '이미 도감에 있는 단어예요! 한 번 더 읽어 볼까요?'
      : '맞으면 도감에 담아요 · 확신 ' + Math.round(top.probability * 100) + '%';
  $('alts').innerHTML = res.slice(1, 3).map(r => {
    const a = lookupWord(r.className);
    return `<span class="alt">${a.en}${a.ko ? ' · ' + a.ko : ''}</span>`;
  }).join('');
  $('keepBtn').textContent = has(w.en) ? '다시 듣기' : '도감에 담기';
  $('sheet').hidden = false;
  speak(w.en);
}

$('retryBtn').onclick = () => { $('sheet').hidden = true; pending = null; };
$('sheet').onclick = e => { if (e.target.id === 'sheet') $('retryBtn').onclick(); };

$('keepBtn').onclick = () => {
  if (!pending) return;
  if (has(pending.en)) { speak(pending.en); return; }
  words.unshift({ en: pending.en, ko: pending.ko, img: pending.img, at: Date.now() });
  if (words.length > 300) words.length = 300;
  save(); drawScore();

  const m = mission.list.find(x => x.en === pending.en && !x.done);
  if (m) {
    m.done = true; saveMission(); drawMission();
    const left = mission.list.filter(x => !x.done).length;
    toast(left ? `목표 달성! ${m.en} ✅ (${left}개 남음)` : '오늘의 목표를 모두 찾았어요! 🎉');
    confetti();
  } else {
    toast(`${pending.en} 담았어요! (${words.length}개)`);
    if ([10, 30, 60, 100].includes(words.length)) confetti();
  }
  ding(true);
  $('sheet').hidden = true; pending = null;
};

/* ---------- 도감 ---------- */
let editing = false;
$('editBtn').onclick = () => {
  editing = !editing;
  document.body.classList.toggle('editing', editing);
  $('editBtn').textContent = editing ? '완료' : '편집';
};

function drawGrid() {
  drawScore();
  $('empty').style.display = words.length ? 'none' : 'block';
  $('grid').innerHTML = words.map((w, i) => `
    <div class="cell" data-i="${i}">
      <img src="${w.img}" alt="${w.en}">
      <div class="en">${w.en}</div>
      <div class="ko">${w.ko || '—'}</div>
      <button class="del" data-del="${i}">×</button>
    </div>`).join('');
}

$('grid').onclick = e => {
  const del = e.target.closest('[data-del]');
  if (del) {
    const i = +del.dataset.del;
    words.splice(i, 1); save(); drawGrid();
    return;
  }
  const cell = e.target.closest('.cell');
  if (cell) speak(words[+cell.dataset.i].en);
};

/* ---------- 복습 퀴즈 ---------- */
let qAns = '', qDone = 0, qOk = 0;
function newQuiz() {
  if (words.length < 4) { $('quizNeed').hidden = false; $('quizPlay').hidden = true; return; }
  $('quizNeed').hidden = true; $('quizPlay').hidden = false;
  const pick = words[Math.floor(Math.random() * words.length)];
  qAns = pick.en;
  const others = words.filter(w => w.en !== pick.en).sort(() => Math.random() - 0.5).slice(0, 3);
  const opts = [pick, ...others].sort(() => Math.random() - 0.5);
  $('quizImg').src = pick.img;
  $('quizQ').textContent = pick.ko ? `“${pick.ko}”의 영어 이름은?` : '이 물건의 영어 이름은?';
  $('quizOpts').innerHTML = opts.map(o => `<button class="opt" data-en="${o.en}">${o.en}</button>`).join('');
  $('quizMsg').textContent = '';
  $('quizScore').textContent = qDone ? `${qDone}문제 중 ${qOk}개 정답` : '';
}
$('quizOpts').onclick = e => {
  const b = e.target.closest('.opt'); if (!b || $('quizMsg').textContent) return;
  const ok = b.dataset.en === qAns;
  qDone++; if (ok) qOk++;
  document.querySelectorAll('.opt').forEach(o => {
    if (o.dataset.en === qAns) o.classList.add('ok');
    else if (o === b) o.classList.add('ng');
  });
  $('quizMsg').textContent = ok ? '정답이에요! 🎉' : `아쉬워요, 정답은 ${qAns}`;
  speak(qAns); ding(ok);
  setTimeout(newQuiz, 1600);
};

/* ---------- 시작 ---------- */
drawScore(); drawMission(); drawSound();
if (words.length) $('empty').style.display = 'none';
document.addEventListener('visibilitychange', () => {
  if (document.hidden && 'speechSynthesis' in window) speechSynthesis.cancel();
});
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
})();
