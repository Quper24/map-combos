// Adapted wasm-bindgen glue from ivsema/sii-decode-rs (MIT). See README.md.
import m from './sii_decode_bg.wasm?url';
var y = async (e = {}, t) => {
  let n;
  if (t.startsWith('data:')) {
    const r = t.replace(/^data:.*?base64,/, '');
    let s;
    if (typeof Buffer == 'function' && typeof Buffer.from == 'function')
      s = Buffer.from(r, 'base64');
    else if (typeof atob == 'function') {
      const _ = atob(r);
      s = new Uint8Array(_.length);
      for (let i = 0; i < _.length; i++) s[i] = _.charCodeAt(i);
    } else throw new Error('Cannot decode base64-encoded data URL');
    n = await WebAssembly.instantiate(s, e);
  } else {
    const r = await fetch(t),
      s = r.headers.get('Content-Type') || '';
    if ('instantiateStreaming' in WebAssembly && s.startsWith('application/wasm'))
      n = await WebAssembly.instantiateStreaming(r, e);
    else {
      const _ = await r.arrayBuffer();
      n = await WebAssembly.instantiate(_, e);
    }
  }
  return n.instance.exports;
};
function x(e) {
  let t, n;
  try {
    const _ = p(e, o.__wbindgen_malloc),
      i = g,
      c = o.decode(_, i);
    var r = c[0],
      s = c[1];
    if (c[3]) throw ((r = 0), (s = 0), U(c[2]));
    return ((t = r), (n = s), b(r, s));
  } finally {
    o.__wbindgen_free(t, n, 1);
  }
}
function h(e, t) {
  return Error(b(e, t));
}
function A() {
  const e = o.__wbindgen_externrefs,
    t = e.grow(4);
  (e.set(0, void 0), e.set(t + 0, void 0), e.set(t + 1, null), e.set(t + 2, !0), e.set(t + 3, !1));
}
function b(e, t) {
  return ((e = e >>> 0), T(e, t));
}
let d = null;
function u() {
  return ((d === null || d.byteLength === 0) && (d = new Uint8Array(o.memory.buffer)), d);
}
function p(e, t) {
  const n = t(e.length * 1, 1) >>> 0;
  return (u().set(e, n / 1), (g = e.length), n);
}
function U(e) {
  const t = o.__wbindgen_externrefs.get(e);
  return (o.__externref_table_dealloc(e), t);
}
let f = new TextDecoder('utf-8', { ignoreBOM: !0, fatal: !0 });
f.decode();
const E = 2146435072;
let l = 0;
function T(e, t) {
  return (
    (l += t),
    l >= E && ((f = new TextDecoder('utf-8', { ignoreBOM: !0, fatal: !0 })), f.decode(), (l = t)),
    f.decode(u().subarray(e, e + t))
  );
}
let g = 0,
  o;
function B(e) {
  o = e;
}
export async function init() {
  const a = await y(
      {
        './sii_decode_bg.js': {
          __wbg_Error_8c4e43fe74559d73: h,
          __wbindgen_init_externref_table: A,
        },
      },
      m,
    ),
    W = a.memory,
    M = a.decode,
    v = a.__wbindgen_externrefs,
    S = a.__wbindgen_malloc,
    L = a.__externref_table_dealloc,
    R = a.__wbindgen_free,
    w = a.__wbindgen_start;
  var C = Object.freeze({
    __proto__: null,
    __externref_table_dealloc: L,
    __wbindgen_externrefs: v,
    __wbindgen_free: R,
    __wbindgen_malloc: S,
    __wbindgen_start: w,
    decode: M,
    memory: W,
  });
  B(C);
  w();
}
export { x as decode };
