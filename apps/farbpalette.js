/* ── Farbpalette ── */
function hexToHsl(hex){
  let r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b);let h=0,s=0,l=(max+min)/2;
  if(max!==min){
    const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);
    if(max===r)h=(g-b)/d+(g<b?6:0);
    else if(max===g)h=(b-r)/d+2;
    else h=(r-g)/d+4;
    h*=60;
  }
  return[h,s*100,l*100];
}
function hslToHex(h,s,l){
  h=((h%360)+360)%360;s=Math.min(100,Math.max(0,s))/100;l=Math.min(100,Math.max(0,l))/100;
  const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
  let r,g,b;
  if(h<60){r=c;g=x;b=0;}else if(h<120){r=x;g=c;b=0;}else if(h<180){r=0;g=c;b=x;}
  else if(h<240){r=0;g=x;b=c;}else if(h<300){r=x;g=0;b=c;}else{r=c;g=0;b=x;}
  const toHex=v=>Math.round((v+m)*255).toString(16).padStart(2,'0');
  return '#'+toHex(r)+toHex(g)+toHex(b);
}
function paletteRandom(){
  const el=document.getElementById('pal-base');if(el)el.value='#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');
  paletteGen();
}
function paletteGen(){
  const base=document.getElementById('pal-base')?.value||'#0071e3';
  const mode=document.getElementById('pal-mode')?.value||'mono';
  const[h,s,l]=hexToHsl(base);
  let colors=[];
  if(mode==='mono')colors=[20,35,50,65,80].map(ll=>hslToHex(h,s,ll));
  else if(mode==='analog')colors=[-40,-20,0,20,40].map(dh=>hslToHex(h+dh,s,l));
  else if(mode==='comp')colors=[hslToHex(h,s,Math.max(20,l-20)),hslToHex(h,s,l),hslToHex(h,s,Math.min(80,l+20)),hslToHex(h+180,s,l),hslToHex(h+180,s,Math.max(20,l-20))];
  else if(mode==='triad')colors=[hslToHex(h,s,l),hslToHex(h+120,s,l),hslToHex(h+240,s,l),hslToHex(h,s,Math.min(85,l+15)),hslToHex(h+120,s,Math.min(85,l+15))];
  else colors=[10,28,46,64,82].map(ll=>hslToHex(h,Math.max(10,s-10),ll));
  const wrap=document.getElementById('pal-swatches');if(!wrap)return;
  wrap.innerHTML=colors.map(c=>`<div onclick="paletteCopy('${c}')" style="cursor:pointer;border-radius:10px;overflow:hidden;border:0.5px solid var(--divider)"><div style="height:70px;background:${c}"></div><div style="padding:6px;text-align:center;font-family:var(--mono);font-size:12px;background:var(--surface);color:var(--text)">${c}</div></div>`).join('');
}
function paletteCopy(hex){
  navigator.clipboard.writeText(hex);
  showToast(hex+' kopiert');
}
function paletteInit(){paletteGen();}
