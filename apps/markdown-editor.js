/* ══════════════════════════════════
   MARKDOWN EDITOR
══════════════════════════════════ */
function mdInit(){
  const ed=document.getElementById('md-editor');
  if(ed&&!ed.value)ed.value=`# Willkommen im Markdown Editor\n\nSchreibe hier deinen **Markdown**-Text.\n\n## Features\n- *Kursiv* und **Fett**\n- [Links](https://example.com)\n- \`Code\`\n- Tabellen & mehr\n\n\`\`\`javascript\nconsole.log('Hello!');\n\`\`\`\n`;
  mdUpdate();
}
function mdSetMode(m){
  ['split','edit','preview'].forEach(x=>document.getElementById('md-mode-'+x)?.classList.toggle('active',x===m));
  const ed=document.getElementById('md-editor');const pr=document.getElementById('md-preview');
  if(!ed||!pr)return;
  if(m==='split'){ed.style.display='';pr.style.display='';}
  else if(m==='edit'){ed.style.display='';pr.style.display='none';}
  else{ed.style.display='none';pr.style.display='';}
}
function mdUpdate(){
  const src=document.getElementById('md-editor')?.value||'';
  const pr=document.getElementById('md-preview');if(!pr)return;
  pr.innerHTML=mdParse(src);
}
function mdParse(src){
  let html=escHtml(src);
  // Code blocks
  html=html.replace(/```[\w]*\n?([\s\S]*?)```/g,'<pre style="background:var(--bg);padding:10px;border-radius:6px;overflow-x:auto;font-size:12px"><code>$1</code></pre>');
  // Headings
  html=html.replace(/^######\s(.+)$/gm,'<h6 style="font-size:12px;margin:6px 0">$1</h6>');
  html=html.replace(/^#####\s(.+)$/gm,'<h5 style="font-size:13px;margin:6px 0">$1</h5>');
  html=html.replace(/^####\s(.+)$/gm,'<h4 style="font-size:14px;margin:8px 0">$1</h4>');
  html=html.replace(/^###\s(.+)$/gm,'<h3 style="font-size:16px;margin:8px 0">$1</h3>');
  html=html.replace(/^##\s(.+)$/gm,'<h2 style="font-size:18px;margin:10px 0;border-bottom:0.5px solid var(--divider);padding-bottom:4px">$1</h2>');
  html=html.replace(/^#\s(.+)$/gm,'<h1 style="font-size:22px;margin:12px 0;border-bottom:1px solid var(--divider);padding-bottom:6px">$1</h1>');
  // Bold, italic
  html=html.replace(/\*\*\*(.+?)\*\*\*/g,'<strong><em>$1</em></strong>');
  html=html.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  html=html.replace(/\*(.+?)\*/g,'<em>$1</em>');
  html=html.replace(/`(.+?)`/g,'<code style="background:var(--bg);padding:1px 4px;border-radius:3px;font-size:12px">$1</code>');
  // Links
  html=html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" style="color:var(--accent)">$1</a>');
  // Images
  html=html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img src="$2" alt="$1" style="max-width:100%;border-radius:6px"/>');
  // Lists
  html=html.replace(/^[-*]\s(.+)$/gm,'<li style="margin:2px 0">$1</li>');
  html=html.replace(/(<li[^>]*>.*<\/li>\n?)+/g,'<ul style="padding-left:20px;margin:6px 0">$&</ul>');
  html=html.replace(/^\d+\.\s(.+)$/gm,'<li style="margin:2px 0">$1</li>');
  // Blockquote
  html=html.replace(/^&gt;\s(.+)$/gm,'<blockquote style="border-left:3px solid var(--accent);padding-left:10px;color:var(--text-2);margin:6px 0">$1</blockquote>');
  // HR
  html=html.replace(/^---+$/gm,'<hr style="border:none;border-top:0.5px solid var(--divider);margin:12px 0"/>');
  // Paragraphs
  html=html.replace(/\n\n/g,'</p><p style="margin:6px 0">');
  html='<p style="margin:0">'+html+'</p>';
  return html;
}
function mdClear(){const ed=document.getElementById('md-editor');if(ed){ed.value='';mdUpdate();}}
function mdExport(){
  const src=document.getElementById('md-editor')?.value||'';
  const blob=new Blob([src],{type:'text/markdown'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='dokument.md';a.click();
}

