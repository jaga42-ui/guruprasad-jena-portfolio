/* dc2next — mechanical .dc.html → Next.js page converter.
   Design decisions are NOT made here: every literal is carried across untouched.
   Used by the build scripts; kept in the repo so the port can be re-run if a
   .dc.html source is edited again.

   Rules
     template   = text between <x-dc> and </x-dc>, minus <helmet>, minus comments
     style="…"          → style={{ … }}   (entities decoded, --custom-props kept as strings)
     style-hover="…"    → generated class + `.hvN:hover { … !important }` in hover.css
     class / for / tabindex / … → React names
     SVG kebab attrs    → camelCase (data-* and aria-* stay verbatim; custom elements untouched)
     {{ hole }}         → {V.hole}    (attribute, mixed attribute, or text)
     logic class        → class Page extends React.Component, body verbatim,
                          starfield() swapped for the canvas <Starfield/>            */

const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);

const ATTR = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly',
  maxlength: 'maxLength', minlength: 'minLength', autocomplete: 'autoComplete',
  autofocus: 'autoFocus', spellcheck: 'spellCheck', contenteditable: 'contentEditable',
  crossorigin: 'crossOrigin', srcset: 'srcSet', colspan: 'colSpan', rowspan: 'rowSpan',
  inputmode: 'inputMode', enterkeyhint: 'enterKeyHint', novalidate: 'noValidate',
  usemap: 'useMap', datetime: 'dateTime', accesskey: 'accessKey',
  'xlink:href': 'xlinkHref', 'xml:space': 'xmlSpace', 'xmlns:xlink': null,
};

const ENT = {
  '&nbsp;': '\u00a0', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
  '&#39;': "'", '&apos;': "'", '&middot;': '\u00b7', '&mdash;': '\u2014',
  '&ndash;': '\u2013', '&rsquo;': '\u2019', '&lsquo;': '\u2018', '&hellip;': '\u2026',
  '&rarr;': '\u2192', '&larr;': '\u2190', '&times;': '\u00d7', '&deg;': '\u00b0',
  '&Eacute;': '\u00c9', '&eacute;': '\u00e9', '&copy;': '\u00a9',
};

function decode(v) {
  return String(v).replace(/&#(\d+);|&[a-zA-Z]+;/g, (m, d) =>
    d ? String.fromCharCode(+d) : (ENT[m] !== undefined ? ENT[m] : m));
}

function camel(k) { return k.replace(/-([a-z])/g, (m, c) => c.toUpperCase()); }

/* split "a:b;c:d" on top-level semicolons only */
function splitDecls(css) {
  const out = []; let depth = 0, cur = '', q = null;
  for (const ch of css) {
    if (q) { cur += ch; if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ';' && depth === 0) { if (cur.trim()) out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function jsStr(v) { return "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"; }

/* style="…" → "{ key: 'val', … }" */
function styleObject(css) {
  const parts = [];
  for (const d of splitDecls(decode(css))) {
    const i = d.indexOf(':');
    if (i < 0) continue;
    const prop = d.slice(0, i).trim();
    const val = d.slice(i + 1).trim();
    if (!prop) continue;
    const key = prop.startsWith('--') ? jsStr(prop) : camel(prop);
    HOLE.lastIndex = 0;
    const live = HOLE.test(val);
    HOLE.lastIndex = 0;
    // a live value (e.g. width:{{ deployFill }}) becomes a template literal
    const out = live
      ? '`' + val.replace(/`/g, '\\`').replace(HOLE, (m, n) => '${' + holeExpr(n) + '}') + '`'
      : jsStr(val);
    parts.push(key + ': ' + out);
  }
  return '{ ' + parts.join(', ') + ' }';
}

/* style-hover="…" → ".cls:hover{…!important}" */
function hoverRule(sel, cls, css) {
  const decls = splitDecls(decode(css)).map((d) => {
    const i = d.indexOf(':');
    if (i < 0) return null;
    return d.slice(0, i).trim() + ': ' + d.slice(i + 1).trim() + ' !important';
  }).filter(Boolean);
  return '.' + cls + sel + ' { ' + decls.join('; ') + '; }';
}

function tokenize(html) {
  const out = []; let i = 0;
  while (i < html.length) {
    // a bare '<' in copy (e.g. "<12h") is text, not a tag
    if (html[i] === '<' && /[a-zA-Z/!]/.test(html[i + 1] || '')) {
      if (html.startsWith('<!--', i)) { const e = html.indexOf('-->', i); i = e < 0 ? html.length : e + 3; continue; }
      let j = i + 1, q = null;
      while (j < html.length) {
        const c = html[j];
        if (q) { if (c === q) q = null; }
        else if (c === '"' || c === "'") q = c;
        else if (c === '>') break;
        j++;
      }
      out.push({ t: 'tag', s: html.slice(i, j + 1) });
      i = j + 1;
    } else {
      let j = html.indexOf('<', i);
      while (j > -1 && !/[a-zA-Z/!]/.test(html[j + 1] || '')) j = html.indexOf('<', j + 1);
      const e = j < 0 ? html.length : j;
      out.push({ t: 'text', s: html.slice(i, e === i ? i + 1 : e) });
      i = e === i ? i + 1 : e;
    }
  }
  return out;
}

function parseTag(s) {
  const m = /^<\s*([a-zA-Z][\w:-]*)/.exec(s);
  if (!m) return null;
  const name = m[1];
  const selfClosed = /\/\s*>$/.test(s);
  const inner = s.slice(m[0].length, s.length - (selfClosed ? 2 : 1));
  const attrs = [];
  const re = /([a-zA-Z_:@][\w:.$-]*)\s*(?:=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let a;
  while ((a = re.exec(inner))) {
    const has = a[2] !== undefined;
    const val = a[3] !== undefined ? a[3] : a[4] !== undefined ? a[4] : a[5];
    attrs.push([a[1], has ? val : null]);
  }
  return { name, attrs, selfClosed };
}

const HOLE = /\{\{\s*([\w.$]+)\s*\}\}/g;

function holeExpr(name) {
  if (name === 'true') return 'true';
  if (name === 'false') return 'false';
  if (name === 'null') return 'null';
  if (/^\d/.test(name)) return name;
  return 'V.' + name;
}

/* one attribute → JSX source, or '' to drop */
function attrToJsx(tag, key, val, hover) {
  const isCustom = tag.includes('-');
  const lower = key.toLowerCase();

  if (lower === 'style-hover' || lower === 'style-active' || lower === 'style-focus') {
    const sel = lower === 'style-hover' ? ':hover' : lower === 'style-active' ? ':active' : ':focus-visible';
    const cls = hover.add(sel, val);
    hover.classes.push(cls);
    return '';
  }
  if (lower === 'style-before' || lower === 'style-after') {
    const cls = hover.add('::' + lower.slice(6), val);
    hover.classes.push(cls);
    return '';
  }
  if (lower === 'style') return 'style={' + styleObject(val) + '}';

  if (ATTR[lower] === null) return '';
  let name = ATTR[lower] || key;
  if (!ATTR[lower] && !isCustom && key.includes('-') && !/^(data|aria)-/.test(lower)) name = camel(key);

  if (val === null) return name;

  const whole = /^\{\{\s*[\w.$]+\s*\}\}$/.test(val.trim());
  if (whole) return name + '={' + holeExpr(val.trim().replace(/[{}\s]/g, '')) + '}';

  if (HOLE.test(val)) {
    HOLE.lastIndex = 0;
    const tpl = val.replace(/`/g, '\\`').replace(HOLE, (m, n) => '${' + holeExpr(n) + '}');
    return name + '={`' + tpl + '`}';
  }
  return name + '=' + JSON.stringify(decode(val));
}

function textToJsx(txt) {
  if (!txt.trim()) return txt.replace(/[{}<>]/g, '');
  const marked = txt.replace(HOLE, (m, n) => '\u0000' + holeExpr(n) + '\u0001');
  return marked.replace(/[{}<>]/g, (c) => "{'" + c + "'}")
               .replace(/\u0000/g, '{').replace(/\u0001/g, '}');
}

export function convertTemplate(tpl, prefix = '') {
  const hoverRules = new Map();
  let n = 0;
  const hover = {
    classes: [],
    add(sel, css) {
      const rule = sel + '|' + css;
      if (!hoverRules.has(rule)) hoverRules.set(rule, { cls: prefix + 'hv' + (++n), sel, css });
      return hoverRules.get(rule).cls;
    },
  };

  const out = [];
  for (const tk of tokenize(tpl)) {
    if (tk.t === 'text') { out.push(textToJsx(tk.s)); continue; }
    if (/^<\s*\//.test(tk.s)) { out.push(tk.s.replace(/\s+/g, '')); continue; }

    const parsed = parseTag(tk.s);
    if (!parsed) { out.push(textToJsx(tk.s)); continue; }
    const { name, attrs, selfClosed } = parsed;
    hover.classes.length = 0;
    const pieces = [];
    let classIdx = -1;
    for (const [k, v] of attrs) {
      const jsx = attrToJsx(name, k, v, hover);
      if (!jsx) continue;
      if (jsx.startsWith('className=')) classIdx = pieces.length;
      pieces.push(jsx);
    }
    if (hover.classes.length) {
      const extra = hover.classes.join(' ');
      if (classIdx > -1) {
        pieces[classIdx] = pieces[classIdx].replace(/^className="(.*)"$/, (m, c) => 'className="' + c + ' ' + extra + '"');
      } else {
        pieces.push('className="' + extra + '"');
      }
    }
    const close = (selfClosed || VOID.has(name)) ? ' />' : '>';
    out.push('<' + name + (pieces.length ? ' ' + pieces.join(' ') : '') + close);
  }

  return { jsx: out.join(''), hoverRules: [...hoverRules.values()] };
}

const ROUTE = {
  'Home.dc.html': '/', 'About.dc.html': '/about', 'Skills.dc.html': '/skills',
  'Projects.dc.html': '/projects', 'Contact.dc.html': '/contact',
};

export function convert(src, { component, prefix = '' }) {
  const open = src.indexOf('<x-dc>') + 6;
  let stop = src.lastIndexOf('</x-dc>');
  if (stop < 0) {
    const sc = src.search(/<script[^>]*data-dc-script/);
    stop = sc > -1 ? sc : src.length;
  }
  let body = src.slice(open, stop);
  body = body.replace(/<helmet>[\s\S]*?<\/helmet>/, '');
  for (const [file, route] of Object.entries(ROUTE)) {
    body = body.split('href="' + file + '"').join('href="' + route + '"');
    body = body.split("href='" + file + "'").join('href="' + route + '"');
  }

  const sm = /<script[^>]*data-dc-script[^>]*>/.exec(src);
  let logic = '';
  if (sm) {
    const from = sm.index + sm[0].length;
    // the whole script body — module-level consts (Home's CMDS/BOOT) live above the class
    logic = src.slice(from, src.indexOf('</script>', from)).trim();
  }
  logic = logic.replace(/class Component extends DCLogic/, 'class Page extends React.Component');
  logic = logic.replace(/ {2}starfield\(\)\s*\{[\s\S]*?\n {2}\}/,
    '  starfield() {\n' +
    '    // 120 animated spans → one canvas; identical field, one paint.\n' +
    '    if (this.props.starfield === false) return null;\n' +
    '    return React.createElement(Starfield);\n' +
    '  }');
  if (!/renderVals\s*\(/.test(logic)) logic = 'class Page extends React.Component {\n  renderVals() { return {}; }\n}';
  for (const [file, route] of Object.entries(ROUTE)) logic = logic.split(file).join(route);

  const { jsx, hoverRules } = convertTemplate(body, prefix);

  /* data-props defaults become defaultProps so this.props.x reads the same value
     the DC host supplied. */
  let defaults = '';
  const pm = /data-props="([\s\S]*?)"\s*>/.exec(src);
  if (pm) {
    try {
      const spec = JSON.parse(decode(pm[1]));
      const pairs = Object.entries(spec)
        .filter(([k, v]) => k !== '$preview' && v && v.default !== undefined)
        .map(([k, v]) => '  ' + k + ': ' + JSON.stringify(v.default));
      if (pairs.length) defaults = 'Page.defaultProps = {\n' + pairs.join(',\n') + ',\n};\n\n';
    } catch (e) { /* no defaults */ }
  }

  const file =
    "'use client';\n" +
    "import React from 'react';\n" +
    "import Starfield from '@/components/Starfield';\n\n" +
    logic.replace(/\n\}\s*$/, '') + '\n\n' +
    '  render() {\n    const V = this.renderVals();\n    return (\n      <>' +
    jsx.replace(/\n/g, '\n') +
    '</>\n    );\n  }\n}\n\n' +
    defaults +
    'export default function ' + component + '() {\n  return <Page />;\n}\n';

  return { file, hoverRules };
}
