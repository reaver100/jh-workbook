/* 수학 문제 자동 생성 엔진 (초등 1~6학년) */
(function (global) {
  'use strict';

  /* ---------- 공통 도우미 ---------- */
  const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuf = (a) => {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  };
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const lcm = (a, b) => (a * b) / gcd(a, b);
  const reduce = (n, d) => {
    const g = gcd(n, d) || 1;
    return [n / g, d / g];
  };
  const fmt = (n) => {
    const r = Math.round(n * 1e6) / 1e6;
    return String(r);
  };
  const frac = (n, d) => (d === 1 ? String(n) : n + '/' + d);

  /* 분수 입력 허용 형태 모으기: 3/4, 6/8(약분전) 제외 / 가분수·대분수 모두 허용 */
  function fracAnswers(n, d) {
    const [rn, rd] = reduce(n, d);
    const out = new Set();
    if (rd === 1) {
      out.add(String(rn));
      return [...out];
    }
    out.add(rn + '/' + rd);
    if (rn > rd) {
      const w = Math.floor(rn / rd);
      const rem = rn % rd;
      if (rem === 0) out.add(String(w));
      else {
        out.add(w + ' ' + rem + '/' + rd);
        out.add(w + '-' + rem + '/' + rd);
        out.add(w + '와' + rem + '/' + rd);
      }
    }
    return [...out];
  }

  /* 한글 조사 처리: 받침 유무에 따라 이/가, 은/는, 을/를 */
  function hasJong(word) {
    const ch = word.charCodeAt(word.length - 1);
    if (ch < 0xac00 || ch > 0xd7a3) return false;
    return (ch - 0xac00) % 28 !== 0;
  }
  const ga = (w) => w + (hasJong(w) ? '이' : '가');
  const neun = (w) => w + (hasJong(w) ? '은' : '는');

  function near(ans, spread, n) {
    n = n || 3;
    const out = new Set();
    let guard = 0;
    while (out.size < n && guard++ < 300) {
      const d = ans + (R(0, 1) ? 1 : -1) * R(1, spread);
      if (d !== ans && d >= 0) out.add(d);
    }
    return [...out];
  }

  function choiceQ(q, ans, distract, explain) {
    const a = String(ans);
    const set = [a];
    distract.map(String).forEach((d) => {
      if (!set.includes(d)) set.push(d);
    });
    const opts = shuf(set);
    return { type: 'choice', q: q, choices: opts, answer: opts.indexOf(a), explain: explain };
  }

  /* 그림 붙이기 */
  function withFig(q, fig) { if (fig) q.fig = fig; return q; }
  const F = () => global.FIG || null;

  function inputQ(q, answers, explain, placeholder) {
    return {
      type: 'input',
      q: q,
      answers: Array.isArray(answers) ? answers.map(String) : [String(answers)],
      explain: explain,
      placeholder: placeholder || '답'
    };
  }

  /* ================= 1학년 ================= */
  const G1 = [
    {
      id: 'g1-num9',
      name: '9까지의 수',
      gen() {
        const n = R(1, 9);
        const k = R(1, 3);
        if (F() && R(0, 2) === 0) {
          const c = R(3, 9);
          return withFig(inputQ('그림의 개수는 모두 몇 개인가요?', c, '하나씩 세어 보면 ' + c + '개입니다.', '개'), F().dots(c));
        }
        if (R(0, 1)) {
          return inputQ(`${n}보다 ${k} 큰 수는 얼마인가요?`, n + k, `${n}에서 ${k}만큼 더 세면 ${n + k}입니다.`);
        }
        const base = R(k + 1, 9);
        return inputQ(`${base}보다 ${k} 작은 수는 얼마인가요?`, base - k, `${base}에서 ${k}만큼 되돌아 세면 ${base - k}입니다.`);
      }
    },
    {
      id: 'g1-add',
      name: '한 자리 수 더하기',
      gen() {
        const a = R(1, 9), b = R(1, 9);
        return inputQ(`${a} + ${b} = ?`, a + b, `${a}에서 ${b}만큼 더 세면 ${a + b}입니다.`);
      }
    },
    {
      id: 'g1-sub',
      name: '한 자리 수 빼기',
      gen() {
        const a = R(2, 9), b = R(1, a - 1);
        return inputQ(`${a} - ${b} = ?`, a - b, `${a}에서 ${b}만큼 덜어 내면 ${a - b}입니다.`);
      }
    },
    {
      id: 'g1-ten',
      name: '10 모으기와 가르기',
      gen() {
        const a = R(1, 9);
        return inputQ(`${a} + □ = 10 에서 □에 알맞은 수는?`, 10 - a, `10은 ${a}와 ${10 - a}로 가를 수 있습니다.`);
      }
    },
    {
      id: 'g1-num50',
      name: '50까지의 수',
      gen() {
        const t = R(1, 4), o = R(1, 9);
        if (R(0, 1)) {
          return inputQ(`10개씩 묶음 ${t}개와 낱개 ${o}개인 수는 얼마인가요?`, t * 10 + o, `10이 ${t}개면 ${t * 10}, 여기에 ${o}을 더하면 ${t * 10 + o}입니다.`);
        }
        const n = t * 10 + o;
        return choiceQ(`${n}에 대한 설명으로 알맞은 것은?`, `10개씩 묶음 ${t}개와 낱개 ${o}개`, [
          `10개씩 묶음 ${o}개와 낱개 ${t}개`,
          `10개씩 묶음 ${t + 1}개와 낱개 ${o}개`,
          `10개씩 묶음 ${t}개와 낱개 ${o + 1}개`
        ], `${n}은 10이 ${t}개, 1이 ${o}개인 수입니다.`);
      }
    },
    {
      id: 'g1-add2',
      name: '(몇십몇) 더하기·빼기',
      gen() {
        const t = R(1, 4), o = R(1, 5), b = R(1, 9 - o);
        if (R(0, 1)) {
          const a = t * 10 + o;
          return inputQ(`${a} + ${b} = ?`, a + b, `낱개끼리 더하면 ${o} + ${b} = ${o + b}, 그래서 ${a + b}입니다.`);
        }
        const o2 = R(2, 9), b2 = R(1, o2 - 1), a2 = t * 10 + o2;
        return inputQ(`${a2} - ${b2} = ?`, a2 - b2, `낱개끼리 빼면 ${o2} - ${b2} = ${o2 - b2}, 그래서 ${a2 - b2}입니다.`);
      }
    },
    {
      id: 'g1-clock',
      name: '시계 보기',
      gen() {
        const h = R(1, 12);
        const half = R(0, 1);
        if (F()) {
          const mm = half ? 30 : 0;
          const a2 = `${h}시 ${mm}분`.replace(' 0분', '');
          const ds = [`${(h % 12) + 1}시${half ? ' 30분' : ''}`, `${((h + 10) % 12) + 1}시${half ? ' 30분' : ''}`, half ? `${h}시` : `${h}시 30분`];
          return withFig(choiceQ('시계가 가리키는 시각은 몇 시인가요?', a2, ds,
            '짧은바늘은 ' + h + ', 긴바늘은 ' + (half ? '6(30분)' : '12(정각)') + '을 가리킵니다.'), F().clock(h, mm));
        }
        const ans = half ? `${h}시 30분` : `${h}시`;
        const d = [
          half ? `${h}시` : `${h}시 30분`,
          `${(h % 12) + 1}시${half ? ' 30분' : ''}`,
          `${((h + 10) % 12) + 1}시${half ? ' 30분' : ''}`
        ];
        return choiceQ(
          `짧은바늘이 ${half ? h + '과 ' + ((h % 12) + 1) + ' 사이' : h}를 가리키고, 긴바늘이 ${half ? 6 : 12}를 가리킬 때 시각은?`,
          ans, d,
          `긴바늘이 ${half ? '6이면 30분' : '12이면 정각'}입니다.`
        );
      }
    },
    {
      id: 'g1-rule',
      name: '규칙 찾기',
      gen() {
        const s = R(1, 5), d = pick([2, 3, 5]);
        const seq = [s, s + d, s + 2 * d, s + 3 * d];
        return inputQ(`규칙에 따라 빈칸에 알맞은 수는?\n${seq[0]}, ${seq[1]}, ${seq[2]}, □`, seq[3], `${d}씩 커지는 규칙입니다.`);
      }
    }
  ];

  /* ================= 2학년 ================= */
  const G2 = [
    {
      id: 'g2-num3',
      name: '세 자리 수',
      gen() {
        const h = R(1, 9), t = R(1, 9), o = R(1, 9);
        const n = h * 100 + t * 10 + o;
        const mode = R(0, 2);
        if (mode === 0) {
          const target = pick([
            { d: h, v: h * 100, name: '백의 자리' },
            { d: t, v: t * 10, name: '십의 자리' },
            { d: o, v: o, name: '일의 자리' }
          ]);
          return choiceQ(`${n}에서 ${target.name} 숫자 ${target.d}이 나타내는 값은?`, target.v,
            [target.d, target.d * 10, target.d * 100].filter((x) => x !== target.v).concat([target.v + 10]),
            `${target.name}의 ${target.d}은 ${target.v}을 나타냅니다.`);
        }
        if (mode === 1) {
          return inputQ(`100이 ${h}개, 10이 ${t}개, 1이 ${o}개인 수는 얼마인가요?`, n, `${h * 100} + ${t * 10} + ${o} = ${n}`);
        }
        const m = R(100, 999);
        const bigger = Math.max(n, m), smaller = Math.min(n, m);
        if (n === m) return inputQ(`${n}보다 10 큰 수는 얼마인가요?`, n + 10, `십의 자리가 1 커집니다.`);
        return choiceQ(`${n}과 ${m} 중 더 큰 수는?`, bigger, [smaller], `백의 자리부터 차례로 비교하면 ${bigger}이 더 큽니다.`);
      }
    },
    {
      id: 'g2-add',
      name: '받아올림이 있는 덧셈',
      gen() {
        const o1 = R(2, 9), o2 = R(10 - o1, 9);
        const a = R(1, 8) * 10 + o1, b = R(1, 8) * 10 + o2;
        return inputQ(`${a} + ${b} = ?`, a + b,
          `일의 자리 ${o1} + ${o2} = ${o1 + o2}이므로 10을 십의 자리로 올립니다. 답은 ${a + b}입니다.`);
      }
    },
    {
      id: 'g2-sub',
      name: '받아내림이 있는 뺄셈',
      gen() {
        const o1 = R(0, 7), o2 = R(o1 + 1, 9);
        const t2 = R(1, 7), t1 = R(t2 + 1, 9);
        const a = t1 * 10 + o1, b = t2 * 10 + o2;
        return inputQ(`${a} - ${b} = ?`, a - b,
          `일의 자리 ${o1}에서 ${o2}를 뺄 수 없으니 십의 자리에서 10을 받아내립니다. 답은 ${a - b}입니다.`);
      }
    },
    {
      id: 'g2-mul',
      name: '곱셈구구',
      gen() {
        const a = R(2, 9), b = R(2, 9);
        if (R(0, 3) === 0) {
          const p = a * b;
          return inputQ(`${a} × □ = ${p} 에서 □에 알맞은 수는?`, b, `${a}단에서 ${p}이 되는 수는 ${b}입니다.`);
        }
        return inputQ(`${a} × ${b} = ?`, a * b, `${a}을 ${b}번 더하면 ${a * b}입니다.`);
      }
    },
    {
      id: 'g2-mulword',
      name: '곱셈 문장제',
      gen() {
        const a = R(2, 9), b = R(2, 9);
        const item = pick([
          { t: '사과', u: '개', c: '봉지' },
          { t: '연필', u: '자루', c: '묶음' },
          { t: '사탕', u: '개', c: '상자' },
          { t: '색종이', u: '장', c: '묶음' },
          { t: '구슬', u: '개', c: '주머니' }
        ]);
        return inputQ(
          `한 ${item.c}에 ${ga(item.t)} ${a}${item.u}씩 들어 있습니다. ${b}${item.c}에 들어 있는 ${neun(item.t)} 모두 몇 ${item.u}인가요?`,
          a * b,
          `${a} × ${b} = ${a * b}${item.u}입니다.`
        );
      }
    },
    {
      id: 'g2-len',
      name: '길이 재기 (cm, m)',
      gen() {
        const mode = R(0, 3);
        if (mode === 3 && F()) {
          const cm = R(2, 9);
          return withFig(inputQ('막대의 길이는 몇 cm인가요?', cm, '자의 0에서 시작해 ' + cm + '까지이므로 ' + cm + 'cm입니다.', 'cm'), F().ruler(cm));
        }
        if (mode === 0) {
          const m = R(1, 9), c = R(1, 99);
          return inputQ(`${m}m ${c}cm는 몇 cm인가요?`, m * 100 + c, `1m는 100cm이므로 ${m}m는 ${m * 100}cm, 더하면 ${m * 100 + c}cm입니다.`, 'cm');
        }
        if (mode === 1) {
          const m = R(1, 9), c = R(1, 99);
          const total = m * 100 + c;
          return choiceQ(`${total}cm는 몇 m 몇 cm인가요?`, `${m}m ${c}cm`, [`${c}m ${m}cm`, `${m + 1}m ${c}cm`, `${m}m ${c + 1}cm`], `100cm마다 1m이므로 ${m}m ${c}cm입니다.`);
        }
        const a = R(1, 9) * 100 + R(1, 99), b = R(1, 9) * 100 + R(1, 99);
        if (a === b) return inputQ(`${a}cm + 10cm는 몇 cm인가요?`, a + 10, `${a} + 10 = ${a + 10}`, 'cm');
        const big = Math.max(a, b);
        return choiceQ(`${Math.floor(a / 100)}m ${a % 100}cm와 ${Math.floor(b / 100)}m ${b % 100}cm 중 더 긴 것은?`,
          `${Math.floor(big / 100)}m ${big % 100}cm`,
          [`${Math.floor(Math.min(a, b) / 100)}m ${Math.min(a, b) % 100}cm`],
          `cm로 바꿔 비교하면 ${big}cm가 더 깁니다.`);
      }
    },
    {
      id: 'g2-time',
      name: '시각과 시간',
      gen() {
        const mode = R(0, 3);
        if (mode === 3 && F()) {
          const h = R(1, 12), mm = pick([5, 10, 15, 20, 25, 35, 40, 45, 50, 55]);
          return withFig(choiceQ('시계가 가리키는 시각은?', `${h}시 ${mm}분`,
            [`${h}시 ${(mm + 5) % 60}분`, `${(h % 12) + 1}시 ${mm}분`, `${h}시 ${(mm + 30) % 60}분`],
            '긴바늘이 가리키는 숫자에 5를 곱하면 분입니다.'), F().clock(h, mm));
        }
        if (mode === 0) {
          const h = R(1, 3), m = R(1, 59);
          return inputQ(`${h}시간 ${m}분은 몇 분인가요?`, h * 60 + m, `1시간은 60분이므로 ${h}시간은 ${h * 60}분, 더하면 ${h * 60 + m}분입니다.`, '분');
        }
        if (mode === 1) {
          const h = R(1, 3), m = R(1, 59);
          const total = h * 60 + m;
          return choiceQ(`${total}분은 몇 시간 몇 분인가요?`, `${h}시간 ${m}분`, [`${m}시간 ${h}분`, `${h + 1}시간 ${m}분`, `${h}시간 ${m + 10}분`], `60분마다 1시간이므로 ${h}시간 ${m}분입니다.`);
        }
        const sh = R(1, 9), sm = pick([0, 10, 20, 30, 40, 50]);
        const dur = pick([20, 30, 40, 50, 60, 70]);
        const end = sh * 60 + sm + dur;
        const eh = Math.floor(end / 60), em = end % 60;
        return choiceQ(`${sh}시 ${sm}분에 시작해서 ${dur}분 동안 공부했습니다. 끝난 시각은?`,
          `${eh}시 ${em}분`,
          [`${eh}시 ${(em + 10) % 60}분`, `${eh + 1}시 ${em}분`, `${sh}시 ${(sm + dur) % 60}분`],
          `${sh}시 ${sm}분에서 ${dur}분 뒤는 ${eh}시 ${em}분입니다.`);
      }
    },
    {
      id: 'g2-three',
      name: '세 수의 계산',
      gen() {
        const a = R(20, 60), b = R(5, 30), c = R(5, 30);
        if (R(0, 1)) {
          return inputQ(`${a} + ${b} - ${c} = ?`, a + b - c, `앞에서부터 계산하면 ${a} + ${b} = ${a + b}, ${a + b} - ${c} = ${a + b - c}입니다.`);
        }
        const d = Math.min(c, a - 1);
        return inputQ(`${a} - ${d} + ${b} = ?`, a - d + b, `앞에서부터 계산하면 ${a} - ${d} = ${a - d}, ${a - d} + ${b} = ${a - d + b}입니다.`);
      }
    },
    {
      id: 'g2-pattern',
      name: '규칙 찾기',
      gen() {
        const mode = R(0, 1);
        if (mode === 0) {
          const s = R(2, 9), d = pick([3, 4, 5, 6, 7]);
          const seq = [s, s + d, s + 2 * d, s + 3 * d, s + 4 * d];
          const hide = R(2, 4);
          const shown = seq.map((v, i) => (i === hide ? '□' : v)).join(', ');
          return inputQ(`규칙에 따라 □에 알맞은 수는?\n${shown}`, seq[hide], `${d}씩 커지는 규칙입니다.`);
        }
        const a = R(2, 9);
        const seq = [a, a * 2, a * 3, a * 4, a * 5];
        return inputQ(`규칙에 따라 다음에 올 수는?\n${seq.slice(0, 4).join(', ')}, □`, seq[4], `${a}씩 커지는(=${a}단) 규칙입니다.`);
      }
    }
  ];

  /* ================= 3학년 ================= */
  const G3 = [
    {
      id: 'g3-addsub',
      name: '세 자리 수의 덧셈과 뺄셈',
      gen() {
        let a = R(120, 899), b = R(110, 799);
        if (R(0, 1)) return inputQ(`${a} + ${b} = ?`, a + b, `자리를 맞추어 더하면 ${a + b}입니다.`);
        if (b > a) [a, b] = [b, a];
        return inputQ(`${a} - ${b} = ?`, a - b, `자리를 맞추어 빼면 ${a - b}입니다.`);
      }
    },
    {
      id: 'g3-div',
      name: '나눗셈',
      gen() {
        const b = R(2, 9), q = R(2, 9);
        const a = b * q;
        if (R(0, 2) === 0) return inputQ(`${a} ÷ ${b} = ? (몫)`, q, `${b} × ${q} = ${a}이므로 몫은 ${q}입니다.`);
        return inputQ(`${a} ÷ ${q} = ? (몫)`, b, `${q} × ${b} = ${a}이므로 몫은 ${b}입니다.`);
      }
    },
    {
      id: 'g3-divr',
      name: '나머지가 있는 나눗셈',
      gen() {
        const b = R(3, 9), q = R(2, 9), r = R(1, b - 1);
        const a = b * q + r;
        if (R(0, 1)) return inputQ(`${a} ÷ ${b}의 나머지는?`, r, `${b} × ${q} = ${b * q}, ${a} - ${b * q} = ${r}이므로 나머지는 ${r}입니다.`);
        return inputQ(`${a} ÷ ${b}의 몫은?`, q, `${b} × ${q} = ${b * q}이고 나머지가 ${r}이므로 몫은 ${q}입니다.`);
      }
    },
    {
      id: 'g3-mul',
      name: '(두 자리) × (한 자리)',
      gen() {
        const a = R(12, 98), b = R(3, 9);
        return inputQ(`${a} × ${b} = ?`, a * b, `${Math.floor(a / 10) * 10} × ${b} = ${Math.floor(a / 10) * 10 * b}, ${a % 10} × ${b} = ${(a % 10) * b}, 더하면 ${a * b}입니다.`);
      }
    },
    {
      id: 'g3-frac',
      name: '분수',
      gen() {
        const mode = R(0, 2);
        if (mode === 0 && F()) {
          const d = R(3, 8), n = R(1, d - 1);
          const useCircle = R(0, 1) === 1;
          return withFig(inputQ('색칠한 부분을 분수로 나타내면? (예: 2/5)', [`${n}/${d}`],
            '전체를 ' + d + '로 나눈 것 중 ' + n + '칸이 색칠되어 있으므로 ' + n + '/' + d + '입니다.', '예: 2/5'),
            useCircle ? F().fracCircle(d, n) : F().fracBar(d, n));
        }
        if (mode === 0) {
          const d = R(3, 9), n = R(1, d - 1);
          return inputQ(`전체를 똑같이 ${d}로 나눈 것 중 ${n}만큼을 분수로 쓰면? (예: 2/5)`, [`${n}/${d}`], `분모는 ${d}, 분자는 ${n}이므로 ${n}/${d}입니다.`, '예: 2/5');
        }
        if (mode === 1) {
          const d = R(4, 9);
          let n1 = R(1, d - 1), n2 = R(1, d - 1);
          while (n1 === n2) n2 = R(1, d - 1);
          const big = Math.max(n1, n2);
          return choiceQ(`${n1}/${d}와 ${n2}/${d} 중 더 큰 분수는?`, `${big}/${d}`, [`${Math.min(n1, n2)}/${d}`], `분모가 같으면 분자가 큰 쪽이 큽니다.`);
        }
        const d = pick([2, 3, 4, 5, 6]);
        const unit = R(2, 8);
        const total = d * unit;
        return inputQ(`사탕 ${total}개의 1/${d}은 몇 개인가요?`, unit, `${total}을 똑같이 ${d}묶음으로 나누면 한 묶음은 ${unit}개입니다.`, '개');
      }
    },
    {
      id: 'g3-dec',
      name: '소수',
      gen() {
        const mode = R(0, 2);
        if (mode === 0) {
          const a = R(1, 9), b = R(1, 9);
          return inputQ(`0.${a} + 0.${b} = ? (소수로 쓰세요)`, [fmt((a + b) / 10)], `0.1이 ${a}개와 ${b}개를 더하면 ${a + b}개, 즉 ${fmt((a + b) / 10)}입니다.`);
        }
        if (mode === 1) {
          const w = R(1, 9), a = R(1, 9);
          return choiceQ(`${w}.${a}에서 소수 첫째 자리 숫자는?`, a, near(a, 4, 3), `소수점 바로 뒤 숫자가 소수 첫째 자리입니다.`);
        }
        let x = R(11, 98) / 10, y = R(11, 98) / 10;
        x = Math.round(x * 10) / 10; y = Math.round(y * 10) / 10;
        if (x === y) y = Math.round((y + 0.3) * 10) / 10;
        const big = Math.max(x, y);
        return choiceQ(`${fmt(x)}와 ${fmt(y)} 중 더 큰 수는?`, fmt(big), [fmt(Math.min(x, y))], `자연수 부분부터 비교하면 ${fmt(big)}이 더 큽니다.`);
      }
    },
    {
      id: 'g3-unit',
      name: '들이와 무게',
      gen() {
        const mode = R(0, 3);
        if (mode === 0) {
          const l = R(1, 9), ml = R(1, 999);
          return inputQ(`${l}L ${ml}mL는 몇 mL인가요?`, l * 1000 + ml, `1L는 1000mL이므로 ${l * 1000 + ml}mL입니다.`, 'mL');
        }
        if (mode === 1) {
          const kg = R(1, 9), g = R(1, 999);
          return inputQ(`${kg}kg ${g}g은 몇 g인가요?`, kg * 1000 + g, `1kg은 1000g이므로 ${kg * 1000 + g}g입니다.`, 'g');
        }
        if (mode === 2) {
          const kg = R(1, 9), g = R(1, 999);
          return choiceQ(`${kg * 1000 + g}g은 몇 kg 몇 g인가요?`, `${kg}kg ${g}g`, [`${g}kg ${kg}g`, `${kg + 1}kg ${g}g`, `${kg}kg ${g + 100}g`], `1000g마다 1kg입니다.`);
        }
        const t = R(1, 9);
        return inputQ(`1t은 몇 kg인가요?`, 1000, `1t = 1000kg입니다.`, 'kg');
      }
    },
    {
      id: 'g3-circle',
      name: '원',
      gen() {
        const r = R(2, 15);
        if (R(0, 1)) return inputQ(`반지름이 ${r}cm인 원의 지름은 몇 cm인가요?`, r * 2, `지름은 반지름의 2배이므로 ${r * 2}cm입니다.`, 'cm');
        return inputQ(`지름이 ${r * 2}cm인 원의 반지름은 몇 cm인가요?`, r, `반지름은 지름의 절반이므로 ${r}cm입니다.`, 'cm');
      }
    }
  ];

  /* ================= 4학년 ================= */
  const G4 = [
    {
      id: 'g4-big',
      name: '큰 수',
      gen() {
        const mode = R(0, 2);
        if (mode === 0) {
          const man = R(11, 9999), rest = R(1000, 9999);
          const n = man * 10000 + rest;
          return choiceQ(`${n.toLocaleString()}을 바르게 읽은 것은?`, `${man}만 ${rest}`,
            [`${man}억 ${rest}`, `${rest}만 ${man}`, `${man}만 ${rest + 1}`],
            `만의 자리까지 끊어 읽으면 ${man}만 ${rest}입니다.`);
        }
        if (mode === 1) {
          const k = R(1, 9);
          const place = pick([
            { n: '만', v: 10000 }, { n: '십만', v: 100000 },
            { n: '백만', v: 1000000 }, { n: '천만', v: 10000000 }
          ]);
          return choiceQ(`숫자 ${k}이 ${place.n}의 자리에 있을 때 나타내는 값은?`, (k * place.v).toLocaleString(),
            [(k * place.v * 10).toLocaleString(), (k * place.v / 10).toLocaleString(), (k * place.v + place.v).toLocaleString()],
            `${place.n}의 자리 ${k}은 ${(k * place.v).toLocaleString()}을 나타냅니다.`);
        }
        const a = R(10000, 99999) * 10, b = R(10000, 99999) * 10;
        const big = Math.max(a, b);
        if (a === b) return inputQ(`${a.toLocaleString()}보다 10000 큰 수는?`, a + 10000, `만의 자리가 1 커집니다.`);
        return choiceQ(`${a.toLocaleString()}과 ${b.toLocaleString()} 중 더 큰 수는?`, big.toLocaleString(), [Math.min(a, b).toLocaleString()], `가장 높은 자리부터 비교합니다.`);
      }
    },
    {
      id: 'g4-mul',
      name: '(세 자리) × (두 자리)',
      gen() {
        const a = R(102, 989), b = R(12, 89);
        return inputQ(`${a} × ${b} = ?`, a * b, `${a} × ${Math.floor(b / 10) * 10} = ${a * Math.floor(b / 10) * 10}, ${a} × ${b % 10} = ${a * (b % 10)}, 더하면 ${a * b}입니다.`);
      }
    },
    {
      id: 'g4-div',
      name: '(세 자리) ÷ (두 자리)',
      gen() {
        const b = R(12, 45), q = R(5, 30), r = R(0, b - 1);
        const a = b * q + r;
        if (r === 0 || R(0, 1)) return inputQ(`${a} ÷ ${b}의 몫은?`, q, `${b} × ${q} = ${b * q}${r ? `, 나머지 ${r}` : ''}이므로 몫은 ${q}입니다.`);
        return inputQ(`${a} ÷ ${b}의 나머지는?`, r, `${b} × ${q} = ${b * q}, ${a} - ${b * q} = ${r}입니다.`);
      }
    },
    {
      id: 'g4-angle',
      name: '각도',
      gen() {
        const mode = R(0, 2);
        if (mode === 0) {
          const a = R(20, 100), b = R(20, 150 - a);
          return inputQ(`삼각형의 두 각이 ${a}°, ${b}°일 때 나머지 한 각은 몇 도인가요?`, 180 - a - b, `삼각형 세 각의 합은 180°이므로 180 - ${a} - ${b} = ${180 - a - b}°입니다.`, '도');
        }
        if (mode === 1) {
          const a = R(50, 110), b = R(50, 110), c = R(50, 120);
          const d = 360 - a - b - c;
          if (d <= 10 || d >= 170) return inputQ(`사각형 네 각의 크기의 합은 몇 도인가요?`, 360, `사각형은 삼각형 2개로 나뉘므로 180 × 2 = 360°입니다.`, '도');
          return inputQ(`사각형의 세 각이 ${a}°, ${b}°, ${c}°일 때 나머지 한 각은?`, d, `사각형 네 각의 합은 360°이므로 ${d}°입니다.`, '도');
        }
        const ang = R(10, 170);
        const kind = ang < 90 ? '예각' : ang === 90 ? '직각' : '둔각';
        if (F()) {
          const a2 = pick([30, 45, 60, 90, 120, 135, 150]);
          const k2 = a2 < 90 ? '예각' : a2 === 90 ? '직각' : '둔각';
          return withFig(choiceQ('그림의 각은 어떤 각인가요?', k2, ['예각', '직각', '둔각'].filter((k) => k !== k2),
            '90°보다 작으면 예각, 90°이면 직각, 90°보다 크고 180°보다 작으면 둔각입니다.'), F().angle(a2));
        }
        return choiceQ(`${ang}°는 어떤 각인가요?`, kind, ['예각', '직각', '둔각'].filter((k) => k !== kind), `0°보다 크고 90°보다 작으면 예각, 90°보다 크고 180°보다 작으면 둔각입니다.`);
      }
    },
    {
      id: 'g4-frac',
      name: '분수의 덧셈과 뺄셈',
      gen() {
        const d = R(4, 9);
        const mode = R(0, 2);
        if (mode === 0) {
          const n1 = R(1, d - 1), n2 = R(1, d - 1);
          return inputQ(`${n1}/${d} + ${n2}/${d} = ? (기약분수로)`, fracAnswers(n1 + n2, d), `분모가 같으면 분자끼리 더합니다. ${n1 + n2}/${d}`, '예: 3/4');
        }
        if (mode === 1) {
          let n1 = R(2, d - 1), n2 = R(1, n1 - 1);
          return inputQ(`${n1}/${d} - ${n2}/${d} = ? (기약분수로)`, fracAnswers(n1 - n2, d), `분자끼리 빼면 ${n1 - n2}/${d}입니다.`, '예: 1/4');
        }
        const w = R(1, 4), n = R(1, d - 1), n2 = R(1, d - 1);
        const total = w * d + n + n2;
        return inputQ(`${w} ${n}/${d} + ${n2}/${d} = ? (대분수 또는 가분수로)`, fracAnswers(total, d), `자연수는 그대로 두고 분자끼리 더합니다.`, '예: 2 1/4');
      }
    },
    {
      id: 'g4-dec',
      name: '소수의 덧셈과 뺄셈',
      gen() {
        const a = R(101, 999), b = R(101, 999);
        if (R(0, 1)) return inputQ(`${fmt(a / 100)} + ${fmt(b / 100)} = ?`, [fmt((a + b) / 100)], `소수점의 자리를 맞추어 더하면 ${fmt((a + b) / 100)}입니다.`);
        const big = Math.max(a, b), small = Math.min(a, b);
        if (big === small) return inputQ(`${fmt(a / 100)} + 0.5 = ?`, [fmt((a + 50) / 100)], `소수점을 맞추어 더합니다.`);
        return inputQ(`${fmt(big / 100)} - ${fmt(small / 100)} = ?`, [fmt((big - small) / 100)], `소수점의 자리를 맞추어 빼면 ${fmt((big - small) / 100)}입니다.`);
      }
    },
    {
      id: 'g4-shape',
      name: '삼각형과 사각형',
      gen() {
        const items = [
          { q: '세 변의 길이가 모두 같은 삼각형의 이름은?', a: '정삼각형', d: ['이등변삼각형', '직각삼각형', '둔각삼각형'], e: '세 변이 같으면 정삼각형이고, 세 각도 모두 60°입니다.' },
          { q: '두 변의 길이가 같은 삼각형의 이름은?', a: '이등변삼각형', d: ['정삼각형', '직각삼각형', '예각삼각형'], e: '두 변이 같은 삼각형을 이등변삼각형이라고 합니다.' },
          { q: '마주 보는 두 쌍의 변이 서로 평행한 사각형은?', a: '평행사변형', d: ['사다리꼴', '마름모', '직각삼각형'], e: '두 쌍의 변이 평행하면 평행사변형입니다.' },
          { q: '평행한 변이 한 쌍이라도 있는 사각형은?', a: '사다리꼴', d: ['평행사변형', '마름모', '정사각형'], e: '평행한 변이 한 쌍 있으면 사다리꼴입니다.' },
          { q: '네 변의 길이가 모두 같은 사각형은?', a: '마름모', d: ['사다리꼴', '평행사변형', '직사각형'], e: '네 변이 모두 같은 사각형을 마름모라고 합니다.' },
          { q: '정삼각형의 한 각의 크기는?', a: '60°', d: ['90°', '45°', '30°'], e: '180 ÷ 3 = 60°입니다.' },
          { q: '이등변삼각형에서 길이가 같은 두 변 사이가 아닌 두 각은?', a: '크기가 서로 같다', d: ['크기가 서로 다르다', '항상 직각이다', '항상 60°이다'], e: '이등변삼각형의 두 밑각은 크기가 같습니다.' }
        ];
        if (F() && R(0, 1) === 0) {
          const names = F().shapeNames();
          const nm = pick(names);
          const ds = shuf(names.filter((x) => x !== nm)).slice(0, 3);
          return withFig(choiceQ('그림에서 알맞은 도형의 이름은?', nm, ds, nm + '의 모양입니다.'), F().shape(nm));
        }
        const it = pick(items);
        return choiceQ(it.q, it.a, it.d, it.e);
      }
    }
  ];

  /* ================= 5학년 ================= */
  const G5 = [
    {
      id: 'g5-mixed',
      name: '자연수의 혼합 계산',
      gen() {
        const mode = R(0, 2);
        if (mode === 0) {
          const a = R(2, 9), b = R(2, 9), c = R(2, 9), d = R(1, 20);
          return inputQ(`${d} + ${a} × ${b} = ?`, d + a * b, `곱셈을 먼저 합니다. ${a} × ${b} = ${a * b}, ${d} + ${a * b} = ${d + a * b}`);
        }
        if (mode === 1) {
          const b = R(2, 9), q = R(2, 9), a = b * q, c = R(1, 30);
          return inputQ(`${a} ÷ ${b} + ${c} = ?`, q + c, `나눗셈을 먼저 합니다. ${a} ÷ ${b} = ${q}, ${q} + ${c} = ${q + c}`);
        }
        const a = R(10, 40), b = R(2, 9), c = R(2, 9);
        return inputQ(`(${a} + ${b}) × ${c} = ?`, (a + b) * c, `괄호 안을 먼저 계산합니다. ${a} + ${b} = ${a + b}, ${a + b} × ${c} = ${(a + b) * c}`);
      }
    },
    {
      id: 'g5-factor',
      name: '약수와 배수',
      gen() {
        const mode = R(0, 3);
        if (mode === 0) {
          const g = R(2, 9);
          let m = R(2, 9), n = R(2, 9);
          while (m === n) n = R(2, 9);
          const a = g * m, b = g * n;
          return inputQ(`${a}과 ${b}의 최대공약수는?`, gcd(a, b),
            `${a} = ${gcd(a, b)} × ${a / gcd(a, b)}, ${b} = ${gcd(a, b)} × ${b / gcd(a, b)}이므로 최대공약수는 ${gcd(a, b)}입니다.`);
        }
        if (mode === 1) {
          let a, b, guard = 0;
          do {
            a = R(3, 16); b = R(3, 16);
            guard++;
          } while ((a === b || lcm(a, b) > 72) && guard < 200);
          return inputQ(`${a}과 ${b}의 최소공배수는?`, lcm(a, b), `${a}과 ${b}의 공통인 배수 중 가장 작은 수는 ${lcm(a, b)}입니다.`);
        }
        if (mode === 2) {
          const n = pick([12, 16, 18, 20, 24, 28, 30, 36, 40, 45, 48]);
          const divs = [];
          for (let i = 1; i <= n; i++) if (n % i === 0) divs.push(i);
          return inputQ(`${n}의 약수는 모두 몇 개인가요?`, divs.length, `${n}의 약수: ${divs.join(', ')} → ${divs.length}개`, '개');
        }
        const n = R(3, 12), k = R(3, 9);
        return inputQ(`${n}의 배수 중 ${k}번째 수는?`, n * k, `${n} × ${k} = ${n * k}`);
      }
    },
    {
      id: 'g5-reduce',
      name: '약분과 통분',
      gen() {
        const mode = R(0, 2);
        if (mode === 0) {
          const [rn, rd] = [R(1, 8), R(2, 9)];
          const k = R(2, 6);
          const n = rn * k, d = rd * k;
          const [an, ad] = reduce(n, d);
          return inputQ(`${n}/${d}을 기약분수로 나타내면?`, [`${an}/${ad}`].concat(ad === 1 ? [String(an)] : []), `분모와 분자를 최대공약수 ${gcd(n, d)}로 나누면 ${an}/${ad}입니다.`, '예: 2/3');
        }
        if (mode === 1) {
          const d1 = R(2, 9), d2 = R(2, 9);
          return inputQ(`1/${d1}과 1/${d2}을 통분할 때 공통분모로 가장 작은 수는?`, lcm(d1, d2), `${d1}과 ${d2}의 최소공배수는 ${lcm(d1, d2)}입니다.`);
        }
        const d1 = R(3, 9);
        let d2 = R(3, 9);
        while (d2 === d1) d2 = R(3, 9);
        const n1 = R(1, d1 - 1), n2 = R(1, d2 - 1);
        const v1 = n1 / d1, v2 = n2 / d2;
        if (Math.abs(v1 - v2) < 1e-9) return inputQ(`1/${d1}과 1/${d2}의 공통분모를 구하세요. (가장 작은 수)`, lcm(d1, d2), `최소공배수를 씁니다.`);
        const bigStr = v1 > v2 ? `${n1}/${d1}` : `${n2}/${d2}`;
        const smallStr = v1 > v2 ? `${n2}/${d2}` : `${n1}/${d1}`;
        return choiceQ(`${n1}/${d1}과 ${n2}/${d2} 중 더 큰 분수는?`, bigStr, [smallStr], `통분해서 비교하면 ${bigStr}이 더 큽니다.`);
      }
    },
    {
      id: 'g5-fracadd',
      name: '분모가 다른 분수의 덧셈과 뺄셈',
      gen() {
        let d1, d2, n1, n2, guard = 0;
        do {
          const a = R(2, 9), b = R(2, 9);
          [n1, d1] = reduce(R(1, a - 1 || 1), a);
          [n2, d2] = reduce(R(1, b - 1 || 1), b);
          guard++;
        } while ((d1 === d2 || d1 < 2 || d2 < 2) && guard < 300);
        if (d1 === d2) { d1 = 3; n1 = 1; d2 = 4; n2 = 3; }
        if (R(0, 1)) {
          const n = n1 * d2 + n2 * d1, d = d1 * d2;
          return inputQ(`${n1}/${d1} + ${n2}/${d2} = ? (기약분수로)`, fracAnswers(n, d),
            `통분하면 ${n1 * d2}/${d} + ${n2 * d1}/${d} = ${n}/${d} → ${frac(...reduce(n, d))}`, '예: 5/6');
        }
        let A = [n1, d1], B = [n2, d2];
        if (n1 / d1 < n2 / d2) { A = [n2, d2]; B = [n1, d1]; }
        const n = A[0] * B[1] - B[0] * A[1], d = A[1] * B[1];
        if (n === 0) return inputQ(`${A[0]}/${A[1]} + ${B[0]}/${B[1]} = ? (기약분수로)`, fracAnswers(A[0] * B[1] + B[0] * A[1], d), `통분해서 더합니다.`, '예: 5/6');
        return inputQ(`${A[0]}/${A[1]} - ${B[0]}/${B[1]} = ? (기약분수로)`, fracAnswers(n, d),
          `통분하면 ${A[0] * B[1]}/${d} - ${B[0] * A[1]}/${d} = ${n}/${d} → ${frac(...reduce(n, d))}`, '예: 1/6');
      }
    },
    {
      id: 'g5-fracmul',
      name: '분수의 곱셈',
      gen() {
        const mode = R(0, 2);
        if (mode === 0) {
          const d = R(3, 9), n = R(1, d - 1), k = R(2, 9);
          return inputQ(`${n}/${d} × ${k} = ? (기약분수로)`, fracAnswers(n * k, d), `분자에 ${k}를 곱하면 ${n * k}/${d} → ${frac(...reduce(n * k, d))}`, '예: 3/4');
        }
        if (mode === 1) {
          const d1 = R(2, 9), n1 = R(1, d1 - 1), d2 = R(2, 9), n2 = R(1, d2 - 1);
          return inputQ(`${n1}/${d1} × ${n2}/${d2} = ? (기약분수로)`, fracAnswers(n1 * n2, d1 * d2),
            `분자끼리, 분모끼리 곱하면 ${n1 * n2}/${d1 * d2} → ${frac(...reduce(n1 * n2, d1 * d2))}`, '예: 1/6');
        }
        const w = R(1, 3), d = R(2, 6), n = R(1, d - 1), k = R(2, 5);
        const imp = w * d + n;
        return inputQ(`${w} ${n}/${d} × ${k} = ? (대분수 또는 가분수로)`, fracAnswers(imp * k, d),
          `대분수를 가분수로 바꾸면 ${imp}/${d}, ${imp}/${d} × ${k} = ${imp * k}/${d}`, '예: 2 1/3');
      }
    },
    {
      id: 'g5-decmul',
      name: '소수의 곱셈',
      gen() {
        const mode = R(0, 2);
        if (mode === 0) {
          const a = R(11, 99), k = R(2, 9);
          return inputQ(`${fmt(a / 10)} × ${k} = ?`, [fmt((a * k) / 10)], `${a} × ${k} = ${a * k}이고 소수 한 자리이므로 ${fmt((a * k) / 10)}입니다.`);
        }
        if (mode === 1) {
          const a = R(11, 99), b = R(11, 99);
          return inputQ(`${fmt(a / 10)} × ${fmt(b / 10)} = ?`, [fmt((a * b) / 100)],
            `${a} × ${b} = ${a * b}이고 소수점 아래 자리 수가 모두 2개이므로 ${fmt((a * b) / 100)}입니다.`);
        }
        const a = R(101, 999), k = R(2, 9);
        return inputQ(`${fmt(a / 100)} × ${k} = ?`, [fmt((a * k) / 100)], `${a} × ${k} = ${a * k}, 소수 두 자리이므로 ${fmt((a * k) / 100)}입니다.`);
      }
    },
    {
      id: 'g5-avg',
      name: '평균',
      gen() {
        const cnt = R(3, 5);
        const avg = R(5, 30);
        const nums = [];
        let sum = 0;
        for (let i = 0; i < cnt - 1; i++) {
          const v = avg + R(-4, 4);
          nums.push(v);
          sum += v;
        }
        const last = avg * cnt - sum;
        nums.push(last);
        if (last < 0) return inputQ(`${avg}, ${avg}, ${avg}의 평균은?`, avg, `모두 같으면 평균도 같습니다.`);
        if (R(0, 1)) {
          return inputQ(`다음 수들의 평균은?\n${shuf(nums).join(', ')}`, avg, `합은 ${avg * cnt}이고 자료 수는 ${cnt}개이므로 평균은 ${avg * cnt} ÷ ${cnt} = ${avg}입니다.`);
        }
        const shown = nums.slice(0, cnt - 1);
        return inputQ(`${cnt}개 수의 평균이 ${avg}입니다. ${shown.join(', ')}일 때 나머지 한 수는?`, nums[cnt - 1],
          `전체 합은 ${avg} × ${cnt} = ${avg * cnt}, 여기서 ${shown.reduce((x, y) => x + y, 0)}을 빼면 ${nums[cnt - 1]}입니다.`);
      }
    },
    {
      id: 'g5-area',
      name: '다각형의 둘레와 넓이',
      gen() {
        const mode = R(0, 4);
        if (mode === 0) {
          const a = R(3, 20), b = R(3, 20);
          return withFig(inputQ(`직사각형의 넓이는 몇 cm²인가요?`, a * b, `넓이 = 가로 × 세로 = ${a} × ${b} = ${a * b}`, 'cm²'), F() && F().rectDim(a, b));
        }
        if (mode === 1) {
          const a = R(3, 20), b = R(3, 20);
          return inputQ(`가로 ${a}cm, 세로 ${b}cm인 직사각형의 둘레는 몇 cm인가요?`, (a + b) * 2, `둘레 = (가로 + 세로) × 2 = (${a} + ${b}) × 2 = ${(a + b) * 2}`, 'cm');
        }
        if (mode === 2) {
          const b = R(3, 20), h = R(2, 10) * 2;
          return withFig(inputQ(`삼각형의 넓이는 몇 cm²인가요?`, (b * h) / 2, `삼각형의 넓이 = 밑변 × 높이 ÷ 2 = ${b} × ${h} ÷ 2 = ${(b * h) / 2}`, 'cm²'), F() && F().triDim(b, h));
        }
        if (mode === 3) {
          const b = R(3, 20), h = R(3, 15);
          return withFig(inputQ(`평행사변형의 넓이는 몇 cm²인가요?`, b * h, `평행사변형의 넓이 = 밑변 × 높이 = ${b} × ${h} = ${b * h}`, 'cm²'), F() && F().paraDim(b, h));
        }
        const a = R(3, 12), b = R(3, 12), h = R(2, 8) * 2;
        return withFig(inputQ(`사다리꼴의 넓이는 몇 cm²인가요?`, ((a + b) * h) / 2,
          `사다리꼴의 넓이 = (윗변 + 아랫변) × 높이 ÷ 2 = (${a} + ${b}) × ${h} ÷ 2 = ${((a + b) * h) / 2}`, 'cm²'), F() && F().trapDim(a, b, h));
      }
    },
    {
      id: 'g5-round',
      name: '어림하기 (올림·버림·반올림)',
      gen() {
        const n = R(1234, 98765);
        const place = pick([
          { name: '십', v: 10 }, { name: '백', v: 100 }, { name: '천', v: 1000 }
        ]);
        const kind = pick(['올림', '버림', '반올림']);
        let ans;
        if (kind === '올림') ans = Math.ceil(n / place.v) * place.v;
        else if (kind === '버림') ans = Math.floor(n / place.v) * place.v;
        else ans = Math.round(n / place.v) * place.v;
        return inputQ(`${n}을 ${place.name}의 자리에서 ${kind}하여 나타내면?`, ans,
          `${place.name}의 자리 아래 수를 ${kind === '올림' ? '올려' : kind === '버림' ? '버려' : '보고 5 이상이면 올리고 5 미만이면 버려'} ${ans}이 됩니다.`);
      }
    }
  ];

  /* ================= 6학년 ================= */
  const G6 = [
    {
      id: 'g6-fracdiv',
      name: '분수의 나눗셈',
      gen() {
        const mode = R(0, 2);
        if (mode === 0) {
          const d = R(2, 9), n = R(1, d - 1), k = R(2, 9);
          return inputQ(`${n}/${d} ÷ ${k} = ? (기약분수로)`, fracAnswers(n, d * k), `÷${k}는 ×1/${k}이므로 ${n}/${d * k} → ${frac(...reduce(n, d * k))}`, '예: 1/8');
        }
        if (mode === 1) {
          const d1 = R(2, 9), n1 = R(1, d1 - 1), d2 = R(2, 9), n2 = R(1, d2 - 1);
          return inputQ(`${n1}/${d1} ÷ ${n2}/${d2} = ? (기약분수 또는 대분수로)`, fracAnswers(n1 * d2, d1 * n2),
            `나누는 분수를 뒤집어 곱하면 ${n1}/${d1} × ${d2}/${n2} = ${n1 * d2}/${d1 * n2} → ${frac(...reduce(n1 * d2, d1 * n2))}`, '예: 3/2');
        }
        const k = R(2, 9), d = R(2, 9), n = R(1, d - 1);
        return inputQ(`${k} ÷ ${n}/${d} = ? (기약분수 또는 자연수로)`, fracAnswers(k * d, n),
          `뒤집어 곱하면 ${k} × ${d}/${n} = ${k * d}/${n} → ${frac(...reduce(k * d, n))}`, '예: 12');
      }
    },
    {
      id: 'g6-decdiv',
      name: '소수의 나눗셈',
      gen() {
        const mode = R(0, 1);
        if (mode === 0) {
          const q = R(11, 99), b = R(2, 9);
          const a = q * b;
          return inputQ(`${fmt(a / 10)} ÷ ${b} = ?`, [fmt(q / 10)], `${a} ÷ ${b} = ${q}이고 소수 한 자리이므로 ${fmt(q / 10)}입니다.`);
        }
        const q = R(2, 30), b = R(11, 49);
        const a = q * b;
        return inputQ(`${fmt(a / 10)} ÷ ${fmt(b / 10)} = ?`, [fmt(q)],
          `두 수에 10을 곱하면 ${a} ÷ ${b} = ${q}입니다. 몫은 변하지 않습니다.`);
      }
    },
    {
      id: 'g6-ratio',
      name: '비와 비율',
      gen() {
        const mode = R(0, 3);
        if (mode === 0) {
          const b = pick([4, 5, 8, 10, 20, 25, 50]);
          const a = R(1, b - 1);
          const pct = (a / b) * 100;
          return inputQ(`${a}/${b}을 백분율로 나타내면 몇 %인가요?`, fmt(pct), `${a} ÷ ${b} = ${fmt(a / b)}, × 100 = ${fmt(pct)}%`, '%');
        }
        if (mode === 1) {
          const total = pick([200, 300, 400, 500, 600, 800]);
          const pct = pick([5, 10, 15, 20, 25, 30, 40, 50]);
          return inputQ(`${total}의 ${pct}%는 얼마인가요?`, (total * pct) / 100, `${total} × ${pct}/100 = ${(total * pct) / 100}`);
        }
        if (mode === 2) {
          const a = R(2, 12), b = R(2, 12);
          const g = gcd(a, b);
          return choiceQ(`${a} : ${b}을 가장 간단한 자연수의 비로 나타내면?`, `${a / g} : ${b / g}`,
            [`${b / g} : ${a / g}`, `${a} : ${b / g}`, `${a / g} : ${b}`].filter((s) => s !== `${a / g} : ${b / g}`),
            `두 수를 최대공약수 ${g}로 나누면 ${a / g} : ${b / g}입니다.`);
        }
        const base = R(20, 200), comp = R(5, 60);
        return choiceQ(`${comp}의 ${base}에 대한 비를 바르게 쓴 것은?`, `${comp} : ${base}`,
          [`${base} : ${comp}`, `${comp} : ${comp + base}`, `${base} : ${base + comp}`],
          `"A의 B에 대한 비"는 A : B로 씁니다.`);
      }
    },
    {
      id: 'g6-prop',
      name: '비례식과 비례배분',
      gen() {
        const mode = R(0, 1);
        if (mode === 0) {
          const a = R(2, 9), b = R(2, 9), k = R(2, 9);
          return inputQ(`${a} : ${b} = ${a * k} : □ 에서 □에 알맞은 수는?`, b * k, `앞의 비에 ${k}를 곱했으므로 뒤의 항도 ${k}를 곱해 ${b * k}입니다.`);
        }
        const r1 = R(1, 6), r2 = R(1, 6), unit = R(3, 15);
        const total = (r1 + r2) * unit;
        return inputQ(`${total}을 ${r1} : ${r2}로 나눌 때 앞의 몫은 얼마인가요?`, r1 * unit,
          `전체를 ${r1 + r2}묶음으로 보면 한 묶음은 ${unit}, 앞의 몫은 ${r1} × ${unit} = ${r1 * unit}입니다.`);
      }
    },
    {
      id: 'g6-circle',
      name: '원의 둘레와 넓이 (원주율 3.14)',
      gen() {
        const r = R(2, 15);
        const mode = R(0, 2);
        if (mode === 0) {
          return withFig(inputQ(`원의 둘레는 몇 cm인가요? (원주율 3.14)`, [fmt(Math.round(2 * r * 3.14 * 100) / 100)],
            `원주 = 지름 × 3.14 = ${2 * r} × 3.14 = ${fmt(Math.round(2 * r * 3.14 * 100) / 100)}cm`, 'cm'), F() && F().circleFig(r, 'r'));
        }
        if (mode === 1) {
          return withFig(inputQ(`원의 넓이는 몇 cm²인가요? (원주율 3.14)`, [fmt(Math.round(r * r * 3.14 * 100) / 100)],
            `원의 넓이 = 반지름 × 반지름 × 3.14 = ${r} × ${r} × 3.14 = ${fmt(Math.round(r * r * 3.14 * 100) / 100)}cm²`, 'cm²'), F() && F().circleFig(r, 'r'));
        }
        const d = r * 2;
        return inputQ(`원의 둘레가 ${fmt(Math.round(d * 3.14 * 100) / 100)}cm일 때 지름은 몇 cm인가요? (원주율 3.14)`, d,
          `지름 = 원주 ÷ 3.14 = ${fmt(Math.round(d * 3.14 * 100) / 100)} ÷ 3.14 = ${d}cm`, 'cm');
      }
    },
    {
      id: 'g6-solid',
      name: '직육면체의 부피와 겉넓이',
      gen() {
        const a = R(2, 12), b = R(2, 12), c = R(2, 12);
        const mode = R(0, 2);
        if (mode === 0) {
          return withFig(inputQ(`직육면체의 부피는 몇 cm³인가요?`, a * b * c,
            `부피 = 가로 × 세로 × 높이 = ${a} × ${b} × ${c} = ${a * b * c}`, 'cm³'), F() && F().boxFig(a, b, c));
        }
        if (mode === 1) {
          const s = 2 * (a * b + b * c + a * c);
          return withFig(inputQ(`직육면체의 겉넓이는 몇 cm²인가요?`, s,
            `겉넓이 = (${a}×${b} + ${b}×${c} + ${a}×${c}) × 2 = ${s}`, 'cm²'), F() && F().boxFig(a, b, c));
        }
        return inputQ(`한 모서리가 ${a}cm인 정육면체의 부피는 몇 cm³인가요?`, a * a * a,
          `${a} × ${a} × ${a} = ${a * a * a}`, 'cm³');
      }
    },
    {
      id: 'g6-case',
      name: '경우의 수와 가능성',
      gen() {
        const mode = R(0, 2);
        if (mode === 0) {
          const a = R(2, 6), b = R(2, 6);
          return inputQ(`상의 ${a}가지와 하의 ${b}가지로 옷을 한 벌씩 짝지을 때, 만들 수 있는 경우는 모두 몇 가지인가요?`, a * b,
            `${a} × ${b} = ${a * b}가지`, '가지');
        }
        if (mode === 1) {
          const n = R(3, 5);
          let f = 1;
          for (let i = 2; i <= n; i++) f *= i;
          return inputQ(`서로 다른 ${n}명을 한 줄로 세우는 방법은 모두 몇 가지인가요?`, f,
            `${Array.from({ length: n }, (_, i) => n - i).join(' × ')} = ${f}가지`, '가지');
        }
        const total = pick([4, 5, 8, 10]);
        const win = R(1, total - 1);
        return inputQ(`구슬 ${total}개 중 ${win}개가 빨간색입니다. 한 개를 꺼낼 때 빨간 구슬일 가능성을 분수로 쓰면? (기약분수)`,
          fracAnswers(win, total), `${win}/${total} → ${frac(...reduce(win, total))}`, '예: 1/2');
      }
    }
  ];

  const UNITS = { 1: G1, 2: G2, 3: G3, 4: G4, 5: G5, 6: G6 };

  global.MATH_ENGINE = {
    units(grade) {
      return (UNITS[grade] || []).map((u) => ({ id: u.id, name: u.name }));
    },
    /* 단원 id 배열(또는 null=전체)에서 n문제 생성 */
    make(grade, unitIds, n) {
      const list = UNITS[grade] || [];
      const pool = unitIds && unitIds.length ? list.filter((u) => unitIds.includes(u.id)) : list;
      const use = pool.length ? pool : list;
      const out = [];
      const seen = new Set();
      let guard = 0;
      while (out.length < n && guard++ < n * 40) {
        const u = use[out.length % use.length] || pick(use);
        const q = u.gen();
        /* 같은 문제인지 판단할 때 그림과 정답까지 본다 — 문구가 같아도 그림이 다르면 다른 문제 */
        const sig = q.q + '|' + (q.fig || '') + '|' +
          (q.type === 'choice' ? q.choices[q.answer] : (q.answers || []).join(','));
        if (seen.has(sig)) continue;
        seen.add(sig);
        q.unitId = u.id;
        q.unitName = u.name;
        q.subject = 'math';
        q.grade = grade;
        out.push(q);
      }
      return shuf(out);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
