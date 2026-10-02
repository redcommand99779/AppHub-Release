// Kleiner Syntax-Highlighter ohne Abhängigkeiten für Python, JavaScript, HTML (auch mit Skript), CSS, SQL und Git.
// Stellt window.kursHighlight(code, lang) bereit (aus dem CodingKurs-Projekt) und gibt HTML mit <span class="t-…"> zurück.
(() => {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const span = (cls, s) => '<span class="t-' + cls + '">' + esc(s) + "</span>";
  const set = (s) => new Set(s.split(" "));

  const PY = {
    re: /(#[^\n]*)|((?:[rRbBfFuU]{1,2})?(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?))|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)/g,
    decl: set("def class lambda True False None"),
    kw: set("if elif else for while in return import from as try except finally with pass break continue and or not is raise del global yield assert"),
    bi: set("print len range input int str float list dict set tuple sum max min sorted abs round type open enumerate zip map filter bool isinstance"),
    attr: set("self"),
    defs: set("def class"),
  };
  const JS = {
    re: /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|("(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|`(?:\\[\s\S]|[^`\\])*`?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g,
    decl: set("const let var function class true false null undefined this"),
    kw: set("if else for while do return break continue new of in typeof switch case default try catch finally throw await async import export from"),
    bi: set("console Math Number String Object Array JSON Date Boolean Set Map Promise"),
    attr: set(""),
    defs: set("function class"),
  };

  const SQL = {
    re: /(--[^\n]*)|('(?:''|[^'])*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)/g,
    decl: set("NULL TRUE FALSE"),
    kw: set("select from where and or not in like between is null as order by group having limit offset asc desc distinct insert into values update set delete create table drop alter add primary key join inner left right outer on union case when then else end exists default integer text real autoincrement"),
    bi: set("count sum avg min max round upper lower length abs coalesce"),
    attr: set(""),
    defs: set(""),
    ci: true,
  };
  const GIT = {
    re: /(#[^\n]*)|("(?:\\.|[^"\\\n])*"?|'[^'\n]*'?)|(--?[A-Za-z][\w-]*)|([A-Za-z_][\w.\/-]*)/g,
    decl: set("git"),
    kw: set("init add commit status log diff branch switch checkout merge clone pull push restore revert remote stash reset tag fetch rebase"),
    bi: set("mkdir cd ls touch echo cat pwd"),
    attr: set(""),
    defs: set(""),
    flag: true,
  };
  function code(src, L) {
    let out = "", last = 0, prevWord = "", m;
    L.re.lastIndex = 0;
    while ((m = L.re.exec(src))) {
      if (m.index > last) out += esc(src.slice(last, m.index));
      last = L.re.lastIndex;
      if (m[1] !== undefined) out += span("com", m[0]);
      else if (m[2] !== undefined) out += span("str", m[0]);
      else if (m[3] !== undefined && L.flag) out += span("attr", m[0]);
      else if (m[3] !== undefined) out += span("num", m[0]);
      else {
        const w = L.ci ? m[0].toLowerCase() : m[0];
        let cls = "";
        if (L.decl.has(L.ci ? m[0].toUpperCase() : w)) cls = "decl";
        else if (L.kw.has(w)) cls = "kw";
        else if (L.bi.has(w)) cls = "bi";
        else if (L.attr.has(w)) cls = "attr";
        else if (L.defs.has(prevWord) || src[last] === "(") cls = "fn";
        out += cls ? span(cls, m[0]) : esc(m[0]);
        prevWord = w;
        continue;
      }
      prevWord = "";
    }
    return out + esc(src.slice(last));
  }

  function css(src) {
    const re = /(\/\*[\s\S]*?(?:\*\/|$))|([{}:;])|(#[0-9a-fA-F]{3,8}\b)|("[^"]*"?|'[^']*'?)|(-?\d*\.?\d+(?:px|em|rem|%|vh|vw|s|ms|deg|fr)?)|([A-Za-z_-][\w-]*)|([\s\S])/g;
    let out = "", depth = 0, inValue = false, m;
    while ((m = re.exec(src))) {
      const t = m[0];
      if (m[1] !== undefined) out += span("com", t);
      else if (m[2] !== undefined) {
        if (t === "{") { depth++; inValue = false; out += span("punc", t); }
        else if (t === "}") { depth = Math.max(0, depth - 1); inValue = false; out += span("punc", t); }
        else if (t === ";") { inValue = false; out += span("punc", t); }
        else if (depth === 0) out += span("sel", t); // Pseudo-Klasse wie :hover
        else { inValue = true; out += span("punc", t); }
      } else if (m[3] !== undefined || m[5] !== undefined) out += depth > 0 && inValue ? span("num", t) : depth === 0 ? span("sel", t) : esc(t);
      else if (m[4] !== undefined) out += span("str", t);
      else if (m[6] !== undefined) out += depth === 0 ? span("sel", t) : inValue ? esc(t) : span("prop", t);
      else out += depth === 0 && /\S/.test(t) ? span("sel", t) : esc(t);
    }
    return out;
  }

  function tag(src) {
    const re = /(<\/?)([A-Za-z][\w-]*)|([A-Za-z_:][\w:.-]*)|("[^"]*"?|'[^']*'?)|(\/?>)/g;
    let out = "", last = 0, m;
    while ((m = re.exec(src))) {
      if (m.index > last) out += esc(src.slice(last, m.index));
      last = re.lastIndex;
      if (m[2] !== undefined) out += span("punc", m[1]) + span("tag", m[2]);
      else if (m[3] !== undefined) out += span("attr", m[3]);
      else if (m[4] !== undefined) out += span("str", m[4]);
      else out += span("punc", m[5]);
    }
    return out + esc(src.slice(last));
  }

  function html(src) {
    const re = /<!--[\s\S]*?(?:-->|$)|(<style\b[^>]*>)([\s\S]*?)(<\/style>|$)|(<script\b[^>]*>)([\s\S]*?)(<\/script>|$)|<\/?[a-zA-Z][^>]*>?/gi;
    let out = "", last = 0, m;
    while ((m = re.exec(src))) {
      if (m.index > last) out += esc(src.slice(last, m.index));
      last = re.lastIndex;
      if (m[0].startsWith("<!--")) out += span("com", m[0]);
      else if (m[1] !== undefined) out += tag(m[1]) + css(m[2]) + tag(m[3]);
      else if (m[4] !== undefined) out += tag(m[4]) + code(m[5], JS) + tag(m[6]);
      else out += tag(m[0]);
      if (m[0] === "") re.lastIndex++; // Endlosschleife bei leerem Treffer verhindern
    }
    return out + esc(src.slice(last));
  }

  window.kursHighlight = (src, lang) => {
    try {
      if (lang === "python") return code(src, PY);
      if (lang === "javascript") return code(src, JS);
      if (lang === "html" || lang === "dom") return html(src);
      if (lang === "css") return css(src);
      if (lang === "sql") return code(src, SQL);
      if (lang === "git") return code(src, GIT);
    } catch (e) { /* bei Fehlern ohne Farben anzeigen */ }
    return esc(src);
  };
})();
