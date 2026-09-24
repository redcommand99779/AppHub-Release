/* ── Meme-Generator ── */
let memeImg=null;
function memeInit(){
  const cv=document.getElementById('meme-canvas');if(!cv)return;
  memeRender();
}
function memeLoadImage(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const img=new Image();
    img.onload=()=>{memeImg=img;memeRender();};
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}
function memeRender(){
  const cv=document.getElementById('meme-canvas');if(!cv)return;
  const ctx=cv.getContext('2d');
  const w=cv.width,h=cv.height;
  ctx.clearRect(0,0,w,h);
  if(memeImg){
    const scale=Math.max(w/memeImg.width,h/memeImg.height);
    const iw=memeImg.width*scale,ih=memeImg.height*scale;
    ctx.drawImage(memeImg,(w-iw)/2,(h-ih)/2,iw,ih);
  }else{
    ctx.fillStyle='#333';ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#888';ctx.font='16px sans-serif';ctx.textAlign='center';ctx.fillText('Bild wählen…',w/2,h/2);
  }
  const top=(document.getElementById('meme-top')?.value||'').toUpperCase();
  const bottom=(document.getElementById('meme-bottom')?.value||'').toUpperCase();
  ctx.font='bold 40px Impact, sans-serif';ctx.textAlign='center';
  ctx.fillStyle='#fff';ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.lineJoin='round';
  if(top){ctx.strokeText(top,w/2,50);ctx.fillText(top,w/2,50);}
  if(bottom){ctx.strokeText(bottom,w/2,h-24);ctx.fillText(bottom,w/2,h-24);}
}
function memeDownload(){
  const cv=document.getElementById('meme-canvas');if(!cv)return;
  const a=document.createElement('a');a.download='meme.png';a.href=cv.toDataURL();a.click();
}
