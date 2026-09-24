/* ══════════════════════════════════
   FARB-PICKER
══════════════════════════════════ */
let savedColors=JSON.parse(localStorage.getItem('zf_colors')||'[]');
let currentHex='#0071e3';
const SWATCHES=['#ff3b30','#ff9f0a','#ffcc00','#34c759','#007aff','#5856d6','#af52de','#ff2d55','#000000','#636366','#ffffff','#8e8e93'];

function colorInit(){
  colorSetHex('#0071e3');
  const sw=document.getElementById('color-swatches');
  sw.innerHTML=SWATCHES.map(h=>`<div class="color-swatch" style="background:${h}" onclick="colorSetHex('${h}')"></div>`).join('');
  renderSavedColors();
}
function colorFromNative(){colorSetHex(document.getElementById('color-native').value);}
function colorFromHex(){
  let v=document.getElementById('c-hex').value.trim();
  if(!v.startsWith('#'))v='#'+v;
  if(/^#[0-9a-fA-F]{6}$/.test(v))colorSetHex(v,true);
}
function colorFromRgb(){
  const v=document.getElementById('c-rgb').value;
  const m=v.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if(m){const h=rgbToHex(+m[1],+m[2],+m[3]);if(h)colorSetHex(h,true,true);}
}
function colorFromHsl(){
  const v=document.getElementById('c-hsl').value;
  const m=v.match(/([\d.]+)[,\s]+([\d.]+)%?[,\s]+([\d.]+)%?/);
  if(m){const rgb=hslToRgb(+m[1],+m[2],+m[3]);colorSetHex(rgbToHex(...rgb),true,true,true);}
}
function colorSetHex(hex,skipHex,skipRgb,skipHsl){
  currentHex=hex;
  document.getElementById('color-preview').style.background=hex;
  document.getElementById('color-native').value=hex;
  if(!skipHex)document.getElementById('c-hex').value=hex;
  const [r,g,b]=hexToRgb(hex);
  if(!skipRgb)document.getElementById('c-rgb').value=`${r}, ${g}, ${b}`;
  const [h,s,l]=rgbToHsl(r,g,b);
  if(!skipHsl)document.getElementById('c-hsl').value=`${h}°, ${s}%, ${l}%`;
}
function colorSave(){
  if(!savedColors.includes(currentHex)){savedColors.unshift(currentHex);if(savedColors.length>16)savedColors.pop();localStorage.setItem('zf_colors',JSON.stringify(savedColors));renderSavedColors();}
}
function renderSavedColors(){
  const el=document.getElementById('color-saved');
  el.innerHTML=savedColors.length?savedColors.map((h,i)=>`<div class="color-saved-item" style="background:${h}" onclick="colorSetHex('${h}')" title="${h}"></div>`).join(''):'<span style="font-size:12px;color:var(--text-3)">Noch keine gespeichert. Klicke auf die Vorschau.</span>';
}
function hexToRgb(hex){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return[r,g,b];}
function rgbToHex(r,g,b){return'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');}
function rgbToHsl(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b);let h,s,l=(max+min)/2;if(max===min){h=s=0;}else{const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=((g-b)/d+(g<b?6:0))/6;break;case g:h=((b-r)/d+2)/6;break;default:h=((r-g)/d+4)/6;}}return[Math.round(h*360),Math.round(s*100),Math.round(l*100)];}
function hslToRgb(h,s,l){s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l);const f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));return[Math.round(f(0)*255),Math.round(f(8)*255),Math.round(f(4)*255)];}
