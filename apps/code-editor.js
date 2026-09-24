/* ══════════════════════════════════
   CODE EDITOR
══════════════════════════════════ */
const CE_TOKENS={
  js:[{re:/\/\/.*$/gm,cls:'color:#6c7986'},{re:/\/\*[\s\S]*?\*\//g,cls:'color:#6c7986'},{re:/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g,cls:'color:#fc6d24'},{re:/\b(const|let|var|function|return|if|else|for|while|class|new|this|typeof|instanceof|import|export|default|async|await|try|catch|finally|throw|switch|case|break|continue|in|of)\b/g,cls:'color:#c586c0'},{re:/\b(true|false|null|undefined|NaN|Infinity)\b/g,cls:'color:#569cd6'},{re:/\b\d+(\.\d+)?\b/g,cls:'color:#b5cea8'},{re:/\b([A-Z][a-zA-Z0-9]*)\b/g,cls:'color:#4ec9b0'}],
  python:[{re:/#.*$/gm,cls:'color:#6c7986'},{re:/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g,cls:'color:#fc6d24'},{re:/\b(def|class|return|if|elif|else|for|while|import|from|as|with|try|except|finally|raise|in|not|and|or|is|lambda|yield|pass|break|continue|global|nonlocal)\b/g,cls:'color:#c586c0'},{re:/\b(True|False|None)\b/g,cls:'color:#569cd6'},{re:/\b\d+(\.\d+)?\b/g,cls:'color:#b5cea8'}],
  html:[{re:/<!--[\s\S]*?-->/g,cls:'color:#6c7986'},{re:/"[^"]*"/g,cls:'color:#fc6d24'},{re:/&lt;\/?[\w\s="'/:.#-]*&gt;/g,cls:'color:#569cd6'}],
  css:[{re:/\/\*[\s\S]*?\*\//g,cls:'color:#6c7986'},{re:/"[^"]*"|'[^']*'/g,cls:'color:#fc6d24'},{re:/[.#]?[\w-]+\s*\{/g,cls:'color:#d7ba7d'},{re:/[\w-]+(?=\s*:)/g,cls:'color:#9cdcfe'},{re:/#[0-9a-fA-F]{3,8}\b|\b\d+(\.\d+)?(px|em|rem|%|vh|vw|s|ms)?\b/g,cls:'color:#b5cea8'}],
  json:[{re:/"(?:[^"\\]|\\.)*"(?=\s*:)/g,cls:'color:#9cdcfe'},{re:/:(?:\s*)"(?:[^"\\]|\\.)*"/g,cls:'color:#fc6d24'},{re:/\b(true|false|null)\b/g,cls:'color:#569cd6'},{re:/\b-?\d+(\.\d+)?([eE][+-]?\d+)?\b/g,cls:'color:#b5cea8'}],
  plain:[]
};
function ceInit(){const ed=document.getElementById('ce-editor');if(ed&&!ed.value)ed.value='// Willkommen im Code-Editor\n// Sprache oben wählen\n\nconsole.log("Hello, World!");\n';ceHighlight();ceStats();}
function ceHighlight(){
  const ed=document.getElementById('ce-editor');const hl=document.getElementById('ce-highlight');if(!ed||!hl)return;
  const lang=document.getElementById('ce-lang')?.value||'plain';
  let code=escHtml(ed.value+'\n');
  const tokens=CE_TOKENS[lang]||[];
  // Apply tokens (non-overlapping by replacing with placeholders)
  const spans=[];
  tokens.forEach(({re,cls})=>{
    code=code.replace(re,(m)=>{const id=String.fromCodePoint(0xE000+spans.length);spans.push(`<span style="${cls}">${m}</span>`);return id;});
  });
  spans.forEach((s,i)=>{code=code.replace(String.fromCodePoint(0xE000+i),s);});
  hl.innerHTML=code;
  // Sync scroll
  hl.scrollTop=ed.scrollTop;hl.scrollLeft=ed.scrollLeft;
}
function ceStats(){const ed=document.getElementById('ce-editor');const st=document.getElementById('ce-stats');if(!ed||!st)return;const t=ed.value;st.textContent=`${t.split('\n').length} Zeilen · ${t.length} Zeichen`;}
function ceSyncScroll(){const ed=document.getElementById('ce-editor');const hl=document.getElementById('ce-highlight');if(ed&&hl){hl.scrollTop=ed.scrollTop;hl.scrollLeft=ed.scrollLeft;}}
function ceCopy(){const ed=document.getElementById('ce-editor');if(ed)navigator.clipboard.writeText(ed.value);}
function ceSave(){
  const ed=document.getElementById('ce-editor');if(!ed)return;
  const lang=document.getElementById('ce-lang')?.value||'plain';
  const ext={js:'js',html:'html',css:'css',python:'py',json:'json',plain:'txt'}[lang]||'txt';
  const blob=new Blob([ed.value],{type:'text/plain'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='code.'+ext;a.click();
  showToast('Datei gespeichert ✓');
}
function ceClear(){const ed=document.getElementById('ce-editor');if(ed){ed.value='';ceHighlight();ceStats();}}
function ceFormat(){
  const ed=document.getElementById('ce-editor');if(!ed)return;
  const lang=document.getElementById('ce-lang')?.value;
  if(lang==='json'){try{ed.value=JSON.stringify(JSON.parse(ed.value),null,2);}catch{}}
  ceHighlight();ceStats();
}
function ceKey(e){
  if(e.key==='Tab'){e.preventDefault();const s=e.target.selectionStart,en=e.target.selectionEnd;e.target.value=e.target.value.slice(0,s)+'  '+e.target.value.slice(en);e.target.selectionStart=e.target.selectionEnd=s+2;ceHighlight();}
}

