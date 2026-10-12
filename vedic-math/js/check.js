/* Answer checking. A small, safe expression parser (no eval) lets learners type
   3/4, 2.5, -7, 3x+2, 2(x-1)^2, 4sqrt(3), pi/6 or 2+3i, and compares by value. */

function normalize(s) {
  return String(s).trim().toLowerCase()
    .replace(/[−–—]/g, '-').replace(/[×·]/g, '*').replace(/÷/g, '/')
    .replace(/π/g, 'pi').replace(/√/g, 'sqrt').replace(/²/g, '^2').replace(/³/g, '^3')
    .replace(/(\d),(?=\d{3}\b)/g, '$1').replace(/\s+/g, '');
}

const FUNCS = { sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan, ln: Math.log, log: Math.log10, abs: Math.abs };

function tokenize(s) {
  const t = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) { let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; const v = Number(s.slice(i, j)); if (Number.isNaN(v)) throw new Error('num'); t.push({ k: 'n', v }); i = j; continue; }
    if (/[a-z]/.test(c)) {
      const f = Object.keys(FUNCS).sort((a, b) => b.length - a.length).find(n => s.startsWith(n, i));
      if (f) { t.push({ k: 'f', v: f }); i += f.length; continue; }
      if (s.startsWith('pi', i)) { t.push({ k: 'n', v: Math.PI }); i += 2; continue; }
      t.push({ k: 'v', v: c }); i++; continue;
    }
    if ('+-*/^()'.includes(c)) { t.push({ k: 'o', v: c }); i++; continue; }
    throw new Error('char');
  }
  // implicit multiplication: 2x, 2(, )(, x(, )x, 3sqrt
  const out = [];
  t.forEach((tk, j) => {
    const p = out[out.length - 1];
    if (p && (p.k === 'n' || p.k === 'v' || (p.k === 'o' && p.v === ')')) && (tk.k === 'n' || tk.k === 'v' || tk.k === 'f' || (tk.k === 'o' && tk.v === '('))) out.push({ k: 'o', v: '*' });
    out.push(tk);
  });
  return out;
}

/* Recursive descent: expr = term (+|- term)*, term = unary (*|/ unary)*, unary = -unary | power, power = atom (^ unary)? */
export function compile(src) {
  const toks = tokenize(normalize(src)); let p = 0;
  const peek = () => toks[p], eat = v => { if (peek() && peek().v === v) { p++; return true; } return false; };
  function expr() { let n = term(); for (;;) { if (eat('+')) { const a = n, b = term(); n = e => a(e) + b(e); } else if (eat('-')) { const a = n, b = term(); n = e => a(e) - b(e); } else return n; } }
  function term() { let n = unary(); for (;;) { if (eat('*')) { const a = n, b = unary(); n = e => a(e) * b(e); } else if (eat('/')) { const a = n, b = unary(); n = e => a(e) / b(e); } else return n; } }
  function unary() { if (eat('-')) { const a = unary(); return e => -a(e); } if (eat('+')) return unary(); return power(); }
  function power() { const a = atom(); if (eat('^')) { const b = unary(); return e => Math.pow(a(e), b(e)); } return a; }
  function atom() {
    const tk = toks[p++]; if (!tk) throw new Error('end');
    if (tk.k === 'n') { const v = tk.v; return () => v; }
    if (tk.k === 'v') { const name = tk.v; return e => { if (!(name in e)) throw new Error('var'); return e[name]; }; }
    if (tk.k === 'f') { const f = FUNCS[tk.v]; const a = atom(); return e => f(a(e)); }
    if (tk.v === '(') { const n = expr(); if (!eat(')')) throw new Error('paren'); return n; }
    throw new Error('tok');
  }
  const fn = expr(); if (p !== toks.length) throw new Error('trail');
  return fn;
}
export function evalNum(src, env = {}) { try { const v = compile(src)(env); return Number.isFinite(v) ? v : NaN; } catch (e) { return NaN; } }
const close = (a, b, tol = 1e-6) => Math.abs(a - b) <= Math.max(tol, 1e-9 * Math.max(1, Math.abs(b)));

/* Checks one answer. spec = { kind, answer, tol, simplest, vars }. Returns { ok, msg } where msg explains a near miss. */
export function checkOne(spec, input) {
  const raw = String(input ?? '').trim();
  if (!raw) return { ok: false, empty: true };
  const kind = spec.kind || 'num';
  if (kind === 'choice' || kind === 'text') {
    const norm = s => normalize(s).replace(/[^a-z0-9<>=.\-/]/g, '');
    return { ok: norm(raw) === norm(spec.answer) };
  }
  if (kind === 'num') {
    const v = evalNum(raw); if (Number.isNaN(v)) return { ok: false, msg: 'Type a number, like 12, -3, 0.5 or 3/4.' };
    const ok = close(v, spec.answer, spec.tol ?? 1e-6);
    if (ok && spec.simplest) {
      const m = normalize(raw).match(/^(-?)(\d+)\/(\d+)$/);
      if (m) { let a = +m[2], b = +m[3]; while (b) [a, b] = [b, a % b]; if (a !== 1) return { ok: false, msg: 'Right value. Now simplify the fraction.' }; if (+m[3] === 1) return { ok: true }; }
      else if (/[.]/.test(raw) && !Number.isInteger(spec.answer)) return { ok: false, msg: 'Right value. Write it as a fraction.' };
    }
    return { ok };
  }
  if (kind === 'expr') {
    const vars = spec.vars || ['x'];
    let f, g; try { f = compile(raw); g = compile(spec.answer); } catch (e) { return { ok: false, msg: 'I could not read that. Try something like 3x^2 - 2x + 1.' }; }
    for (let k = 0; k < 6; k++) {
      const env = {}; vars.forEach((v, i) => { env[v] = 0.37 + k * 1.13 + i * 0.71; });
      let a, b; try { a = f(env); b = g(env); } catch (e) { return { ok: false, msg: `Use only the letter${vars.length > 1 ? 's' : ''} ${vars.join(', ')}.` }; }
      if (!Number.isFinite(a) || !close(a, b, 1e-6)) return { ok: false };
    }
    if (spec.form === 'factored' && !/\(/.test(raw)) return { ok: false, msg: 'Equal, but write it as a product of factors, like (x + 2)(x - 3).' };
    return { ok: true };
  }
  if (kind === 'complex') {
    let f; try { f = compile(raw); } catch (e) { return { ok: false, msg: 'Write it like 3 + 2i.' }; }
    try { const r = f({ i: 0 }), im = f({ i: 1 }) - r, chk = f({ i: 2 }) - r; if (!close(chk, 2 * im)) return { ok: false, msg: 'Write it in the form a + bi.' }; return { ok: close(r, spec.answer[0]) && close(im, spec.answer[1]) }; }
    catch (e) { return { ok: false, msg: 'Write it like 3 + 2i.' }; }
  }
  if (kind === 'set') {
    const parts = raw.toLowerCase().replace(/[{}]/g, '').split(/,|;|\bor\b|\band\b/).map(s => normalize(s).replace(/^[a-z]=/, '')).filter(Boolean).map(s => evalNum(s));
    if (parts.some(Number.isNaN)) return { ok: false, msg: 'List the values with commas, like 2, -5.' };
    const want = spec.answer.slice().sort((a, b) => a - b), got = [...new Set(parts.map(v => Math.round(v * 1e6) / 1e6))].sort((a, b) => a - b);
    const uniqWant = [...new Set(want.map(v => Math.round(v * 1e6) / 1e6))];
    if (got.length !== uniqWant.length) return { ok: false, msg: uniqWant.length > 1 ? `There ${uniqWant.length === 2 ? 'are two' : 'are ' + uniqWant.length} answers.` : 'There is one answer.' };
    return { ok: got.every((v, i) => close(v, uniqWant[i], spec.tol ?? 1e-4)) };
  }
  if (kind === 'ineq') {
    const s = normalize(raw).replace(/≤/g, '<=').replace(/≥/g, '>=');
    let m = s.match(/^([a-z])(<=|>=|<|>)(.+)$/), op, val;
    if (m) { op = m[2]; val = evalNum(m[3]); }
    else { m = s.match(/^(.+?)(<=|>=|<|>)([a-z])$/); if (!m) return { ok: false, msg: 'Write it like x < 4 or x >= -2.' }; val = evalNum(m[1]); op = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' }[m[2]]; }
    if (Number.isNaN(val)) return { ok: false };
    if (close(val, spec.answer.val) && op !== spec.answer.op) return { ok: false, msg: 'Right number. Check the direction of the sign.' };
    return { ok: op === spec.answer.op && close(val, spec.answer.val) };
  }
  return { ok: false };
}
