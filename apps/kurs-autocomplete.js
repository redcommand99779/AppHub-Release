// Autovervollständigung für den Editor (wie in VS Code): Vorschläge beim Tippen,
// Pfeiltasten wählen, Enter/Tab übernimmt, Esc schließt, Strg+Leertaste öffnet manuell.
// Stellt window.kursAutocomplete(textarea, getLang) und window.kursSuggest(text, pos, lang, forced) bereit (aus dem CodingKurs-Projekt).
(() => {
  const w = (s) => s.split(" ");

  const WORDS = {
    python: {
      keyword: w("and as assert break class continue def del elif else except finally for from global if import in is lambda None not or pass raise return try while with yield True False"),
      builtin: w("print len range input int str float list dict set tuple sum max min sorted abs round type open enumerate zip map filter bool isinstance reversed any all self"),
      member: w("append extend insert remove pop sort reverse index count clear copy upper lower strip split join replace startswith endswith find format items keys values get update setdefault add discard capitalize title isdigit lstrip rstrip"),
    },
    javascript: {
      keyword: w("break case catch class const continue default do else export false finally for function if import in let new null of return switch this throw true try typeof undefined var while await async"),
      builtin: w("console Math Number String Object Array JSON Date Boolean Set Map Promise parseInt parseFloat isNaN"),
      member: w("log push pop shift unshift slice splice map filter reduce forEach find includes indexOf join length sort reverse concat toUpperCase toLowerCase trim split replace startsWith endsWith toString toFixed keys values entries random floor ceil round max min abs sqrt PI stringify parse"),
    },
    sql: {
      keyword: w("SELECT FROM WHERE AND OR NOT IN LIKE BETWEEN IS NULL AS ORDER BY GROUP HAVING LIMIT OFFSET ASC DESC DISTINCT INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE DROP ALTER ADD PRIMARY KEY JOIN INNER LEFT ON UNION CASE WHEN THEN ELSE END INTEGER TEXT REAL"),
      builtin: w("COUNT SUM AVG MIN MAX ROUND UPPER LOWER LENGTH ABS COALESCE"),
      member: [],
    },
    git: {
      keyword: w("git init add commit status log diff branch switch checkout merge clone pull push restore revert mkdir cd ls touch echo cat"),
      builtin: w("--version --oneline -m -b -c -d --amend --staged main HEAD ."),
      member: [],
    },
  };
  // DOM-Wörter für JavaScript innerhalb von <script> (Lektionen „JavaScript im Browser“ und Spielplatz)
  const DOM_WORDS = {
    builtin: w("document window console alert event"),
    member: w("querySelector querySelectorAll getElementById getElementsByClassName createElement appendChild append remove removeChild addEventListener removeEventListener textContent innerHTML value classList add toggle contains style setAttribute getAttribute dataset parentElement children firstElementChild nextElementSibling preventDefault target checked disabled focus click reset"),
  };
  // Namen der Beispieldatenbank (aus dem SQL-Kurs) für Tabellen und Spalten
  let sqlNames = null;
  function sqlSchemaNames() {
    if (sqlNames) return sqlNames;
    sqlNames = [];
    try {
      const c = (window.KURS_COURSES || []).find((x) => x.id === "sql");
      const setup = (c && c.lessons[0].setup) || "";
      for (const m of setup.matchAll(/CREATE TABLE\s+(\w+)\s*\(([^;]*?)\)\s*;/gi)) {
        sqlNames.push(m[1]);
        m[2].split(",").forEach((col) => { const n = col.trim().split(/\s+/)[0]; if (/^\w+$/.test(n)) sqlNames.push(n); });
      }
    } catch (e) { /* ohne Schemanamen weiter */ }
    return sqlNames;
  }

  const HTML_TAGS = w("a article aside b body br button div em footer form h1 h2 h3 h4 h5 h6 head header hr html i img input label li main meta nav ol option p script section select span strong style table td textarea th title tr ul");
  const HTML_ATTRS = w("alt class href id src style title type value width height placeholder for name target rel colspan rowspan lang charset content");
  const CSS_PROPS = w("color background-color background font-size font-family font-weight text-align text-decoration text-transform letter-spacing line-height margin margin-top margin-right margin-bottom margin-left padding padding-top padding-right padding-bottom padding-left border border-width border-style border-color border-radius width height max-width min-width max-height min-height display flex flex-direction flex-wrap justify-content align-items gap position top left right bottom opacity box-shadow cursor overflow list-style grid-template-columns");
  const COLORS = w("red green blue orange yellow black white gray purple pink tomato gold skyblue lightblue lightgreen transparent");
  const CSS_VALUES = {
    display: w("block inline inline-block flex grid none"),
    "justify-content": w("flex-start center flex-end space-between space-around space-evenly"),
    "align-items": w("stretch flex-start center flex-end"),
    "flex-direction": w("row column row-reverse column-reverse"),
    "flex-wrap": w("nowrap wrap"),
    "text-align": w("left center right justify"),
    "font-weight": w("normal bold"),
    "text-decoration": w("none underline line-through"),
    "text-transform": w("none uppercase lowercase capitalize"),
    "border-style": w("solid dashed dotted none"),
    position: w("static relative absolute fixed"),
    cursor: w("pointer default"),
    overflow: w("visible hidden scroll auto"),
    color: COLORS,
    background: COLORS,
    "background-color": COLORS,
    "border-color": COLORS,
  };

  const item = (label, kind, extra) => Object.assign({ label, kind }, extra);

  // ---- Kontext bestimmen: welche Vorschläge passen an der Cursorposition? ----
  function inStringOrComment(lineBefore, lang) {
    let quote = "";
    for (let i = 0; i < lineBefore.length; i++) {
      const ch = lineBefore[i];
      if (quote) {
        if (ch === "\\") i++;
        else if (ch === quote) quote = "";
      } else if (ch === '"' || ch === "'" || ((lang === "javascript" || lang === "dom") && ch === "`")) quote = ch;
      else if ((lang === "python" || lang === "git") && ch === "#") return true;
      else if (lang === "sql" && ch === "-" && lineBefore[i + 1] === "-") return true;
      else if ((lang === "javascript" || lang === "dom") && ch === "/" && lineBefore[i + 1] === "/") return true;
    }
    return !!quote;
  }

  function codeContext(value, pos, lang) {
    const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
    const lineBefore = value.slice(lineStart, pos);
    if (inStringOrComment(lineBefore, lang)) return null;
    const m = lineBefore.match(lang === "git" ? /[A-Za-z_$.-][\w$.-]*$/ : /[A-Za-z_$][\w$]*$/);
    const prefix = m ? m[0] : "";
    const before = lineBefore.slice(0, lineBefore.length - prefix.length);
    const W = lang === "dom" ? { keyword: WORDS.javascript.keyword, builtin: [...WORDS.javascript.builtin, ...DOM_WORDS.builtin], member: [...WORDS.javascript.member, ...DOM_WORDS.member] } : WORDS[lang];
    // Nach einem Punkt: Methoden, aber nicht bei Kommazahlen wie 1.5
    if (before.endsWith(".")) {
      if (/\d\.$/.test(before)) return null;
      return { prefix, items: W.member.map((l) => item(l, "method")) };
    }
    if (!prefix) return { prefix, items: [] };
    const seen = new Set([...W.keyword, ...W.builtin]);
    const items = [
      ...W.keyword.map((l) => item(l, "keyword")),
      ...W.builtin.map((l) => item(l, "builtin")),
    ];
    if (lang === "sql") for (const n of sqlSchemaNames()) if (!seen.has(n)) { seen.add(n); items.push(item(n, "tabelle/spalte")); }
    // Eigene Namen aus dem Code (Variablen, Funktionen)
    const re = /[A-Za-z_$][\w$]*/g;
    let id;
    while ((id = re.exec(value))) {
      if (id.index + id[0].length === pos) continue; // das Wort, das gerade getippt wird
      if (id[0].length > 1 && !seen.has(id[0])) { seen.add(id[0]); items.push(item(id[0], "variable")); }
    }
    return { prefix, items };
  }

  function cssContext(css) {
    const depth = (css.match(/\{/g) || []).length - (css.match(/\}/g) || []).length;
    if (depth > 0) {
      const seg = css.slice(Math.max(css.lastIndexOf("{"), css.lastIndexOf(";"), css.lastIndexOf("}")) + 1);
      const colon = seg.indexOf(":");
      if (colon === -1) {
        const prefix = (seg.match(/[\w-]*$/) || [""])[0];
        return { prefix, items: CSS_PROPS.map((l) => item(l, "property", { css: true })) };
      }
      const prop = seg.slice(0, colon).trim();
      const prefix = (seg.slice(colon + 1).match(/[\w#-]*$/) || [""])[0];
      return { prefix, items: (CSS_VALUES[prop] || []).map((l) => item(l, "value")) };
    }
    // Außerhalb der Klammern: Selektoren – Klassen und IDs aus dem HTML, sonst Tags
    return null;
  }

  function htmlContext(value, pos) {
    const before = value.slice(0, pos);
    // Innerhalb von <style> … </style> gelten CSS-Regeln
    const sOpen = before.search(/<style\b[^>]*>(?![\s\S]*<style\b)/i);
    if (sOpen !== -1) {
      const afterOpen = before.slice(sOpen).replace(/^<style\b[^>]*>/i, "");
      if (!/<\/style>/i.test(afterOpen)) {
        const ctx = cssContext(afterOpen);
        if (ctx) return ctx;
        const m = afterOpen.match(/([.#])?([\w-]*)$/);
        const kind = m[1];
        const prefix = m[2];
        if (kind === ".") {
          const classes = new Set();
          for (const c of value.matchAll(/class="([^"]*)"/g)) c[1].split(/\s+/).filter(Boolean).forEach((x) => classes.add(x));
          return { prefix, items: [...classes].map((l) => item(l, "class")) };
        }
        if (kind === "#") {
          const ids = [...value.matchAll(/\sid="([^"]+)"/g)].map((c) => item(c[1], "id"));
          return { prefix, items: ids };
        }
        return { prefix, items: HTML_TAGS.map((l) => item(l, "tag")) };
      }
    }
    const lt = before.lastIndexOf("<"), gt = before.lastIndexOf(">");
    if (lt === -1 || lt < gt) return null;
    const tagText = before.slice(lt);
    const nameMatch = tagText.match(/^<\/?([\w-]*)$/);
    if (nameMatch) return { prefix: nameMatch[1], items: HTML_TAGS.map((l) => item(l, "tag")) };
    if ((tagText.match(/"/g) || []).length % 2 === 1) return null; // gerade in einem Attributwert
    const prefix = (tagText.match(/[\w-]*$/) || [""])[0];
    if (!/\s/.test(tagText.slice(0, tagText.length - prefix.length))) return null;
    return { prefix, items: HTML_ATTRS.map((l) => item(l, "attribute")) };
  }

  // „dom“: HTML mit Skript – innerhalb von <script> gilt JavaScript (mit DOM-Wörtern), sonst HTML/CSS
  function domContext(value, pos) {
    const before = value.slice(0, pos), open = before.search(/<script\b[^>]*>(?![\s\S]*<script\b)/i);
    if (open !== -1) {
      const inner = before.slice(open).replace(/^<script\b[^>]*>/i, "");
      if (!/<\/script>/i.test(inner)) return codeContext(inner, inner.length, "dom");
    }
    return htmlContext(value, pos);
  }

  function getSuggestions(value, pos, lang, forced) {
    const ctx = lang === "html" ? htmlContext(value, pos) : lang === "dom" ? domContext(value, pos) : WORDS[lang] ? codeContext(value, pos, lang) : null;
    if (!ctx) return null;
    const p = ctx.prefix.toLowerCase();
    if (!p && !forced) return null;
    const starts = [], contains = [];
    const used = new Set();
    for (const it of ctx.items) {
      if (used.has(it.label)) continue;
      const l = it.label.toLowerCase();
      if (!p || l.startsWith(p)) { starts.push(it); used.add(it.label); }
      else if (l.includes(p)) { contains.push(it); used.add(it.label); }
    }
    const list = [...starts, ...contains];
    // Wenn nur genau das getippte Wort übrig ist, gibt es nichts zu ergänzen
    if (list.length === 0 || (list.length === 1 && list[0].label === ctx.prefix)) return null;
    return { prefix: ctx.prefix, list };
  }

  window.kursSuggest = getSuggestions;

  // ---- Oberfläche ----
  window.kursAutocomplete = (ed, getLang) => {
    const pop = document.createElement("div");
    pop.className = "ck-ac-popup ck-hidden";
    pop.setAttribute("role", "listbox");
    document.body.appendChild(pop);

    const canvas = document.createElement("canvas").getContext("2d");
    let state = null; // { list, prefix, index }
    let suppress = false;

    function close() { state = null; pop.classList.add("ck-hidden"); }

    function caretXY() {
      const cs = getComputedStyle(ed);
      canvas.font = cs.fontSize + " " + cs.fontFamily;
      const charW = canvas.measureText("MMMMMMMMMM").width / 10;
      const lineH = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;
      const pos = ed.selectionStart;
      const upTo = ed.value.slice(0, pos);
      const line = upTo.split("\n").length - 1;
      const col = pos - (upTo.lastIndexOf("\n") + 1);
      const r = ed.getBoundingClientRect();
      return {
        x: r.left + parseFloat(cs.paddingLeft) + col * charW - ed.scrollLeft,
        yTop: r.top + parseFloat(cs.paddingTop) + line * lineH - ed.scrollTop,
        lineH,
        r,
      };
    }

    function render() {
      pop.innerHTML = "";
      state.list.forEach((it, i) => {
        const row = document.createElement("div");
        row.className = "ck-ac-item" + (i === state.index ? " sel" : "");
        row.setAttribute("role", "option");
        const label = document.createElement("span");
        label.className = "ck-ac-label";
        const n = state.prefix.length;
        const at = it.label.toLowerCase().indexOf(state.prefix.toLowerCase());
        if (n && at !== -1) {
          label.append(it.label.slice(0, at));
          const b = document.createElement("b");
          b.textContent = it.label.slice(at, at + n);
          label.append(b, it.label.slice(at + n));
        } else label.textContent = it.label;
        const kind = document.createElement("span");
        kind.className = "ck-ac-kind";
        kind.textContent = it.kind;
        row.append(label, kind);
        // mousedown statt click, damit der Editor den Fokus behält
        row.addEventListener("mousedown", (e) => { e.preventDefault(); state.index = i; accept(); });
        pop.appendChild(row);
      });
      pop.classList.remove("ck-hidden");
      const { x, yTop, lineH, r } = caretXY();
      const ph = pop.offsetHeight, pw = pop.offsetWidth;
      let top = yTop + lineH + 2;
      if (top + ph > window.innerHeight - 8) top = Math.max(8, yTop - ph - 2); // nach oben klappen
      pop.style.top = top + "px";
      pop.style.left = Math.max(4, Math.min(x, window.innerWidth - pw - 8, r.right - pw)) + "px";
      const sel = pop.querySelector(".sel");
      if (sel) sel.scrollIntoView({ block: "nearest" });
    }

    function update(forced) {
      if (suppress || ed.selectionStart !== ed.selectionEnd) return close();
      const res = getSuggestions(ed.value, ed.selectionStart, getLang(), forced);
      if (!res) return close();
      const prevLabel = state && state.list[state.index] && state.list[state.index].label;
      state = { list: res.list, prefix: res.prefix, index: 0 };
      const keep = res.list.findIndex((it) => it.label === prevLabel);
      if (keep > 0) state.index = keep;
      render();
    }

    function accept() {
      if (!state) return;
      const it = state.list[state.index];
      const pos = ed.selectionStart;
      const start = pos - state.prefix.length;
      let text = it.label;
      let caretBack = 0;
      const lineEnd = ed.value.indexOf("\n", pos);
      const rest = ed.value.slice(pos, lineEnd === -1 ? undefined : lineEnd);
      if (it.kind === "attribute" && !rest.startsWith("=")) { text += '=""'; caretBack = 1; }
      else if (it.css && !rest.trim().startsWith(":")) { text += ": ;"; caretBack = 1; }
      suppress = true;
      ed.setSelectionRange(start, pos);
      if (!document.execCommand("insertText", false, text)) {
        ed.setRangeText(text, start, pos, "end");
        ed.dispatchEvent(new Event("input"));
      }
      const end = start + text.length - caretBack;
      ed.setSelectionRange(end, end);
      suppress = false;
      close();
      // Nach einer CSS-Eigenschaft gleich die passenden Werte anbieten
      if (it.css && CSS_VALUES[it.label]) update(true);
    }

    ed.addEventListener("input", () => update(false));

    ed.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.code === "Space") {
        e.preventDefault();
        e.stopImmediatePropagation();
        update(true);
        return;
      }
      if (!state) return;
      const n = state.list.length;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); e.stopImmediatePropagation();
        state.index = (state.index + (e.key === "ArrowDown" ? 1 : n - 1)) % n;
        render();
      } else if ((e.key === "Enter" || e.key === "Tab") && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(); e.stopImmediatePropagation();
        accept();
      } else if (e.key === "Escape") {
        e.preventDefault(); e.stopImmediatePropagation();
        close();
      } else if (["ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"].includes(e.key)) {
        close();
      }
    });

    ed.addEventListener("blur", () => setTimeout(close, 120));
    ed.addEventListener("mousedown", close);
    ed.addEventListener("scroll", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return { close };
  };
})();
