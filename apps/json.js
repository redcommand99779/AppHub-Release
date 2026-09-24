function jsonInit(){
  const i=document.getElementById('json-input');if(i&&!i.value)i.value='{}';
  jsonValidate();
}
function jsonValidate(){
  const i=document.getElementById('json-input');const err=document.getElementById('json-error');
  const stats=document.getElementById('json-stats');const status=document.getElementById('json-status');
  if(!i)return;
  const t=i.value;
  if(!t.trim()){if(err)err.style.display='none';if(stats)stats.textContent='';if(status)status.textContent='';return;}
  try{
    JSON.parse(t);
    if(err)err.style.display='none';
    if(status){status.textContent='✓ Gültig';status.style.color='#34c759';}
    if(stats)stats.textContent=`${t.length} Zeichen · ${t.split('\n').length} Zeilen`;
  }catch(e){
    if(status){status.textContent='✗ Ungültig';status.style.color='var(--danger)';}
    if(err){err.style.display='block';err.textContent=e.message;}
    if(stats)stats.textContent='';
  }
}
function jsonFormat(){
  const i=document.getElementById('json-input');if(!i)return;
  try{i.value=JSON.stringify(JSON.parse(i.value),null,2);}catch(e){}
  jsonValidate();
}
function jsonMinify(){
  const i=document.getElementById('json-input');if(!i)return;
  try{i.value=JSON.stringify(JSON.parse(i.value));}catch(e){}
  jsonValidate();
}
function jsonClear(){
  const i=document.getElementById('json-input');if(i)i.value='';
  jsonValidate();
}
function jsonCopy(){
  const i=document.getElementById('json-input');if(!i)return;
  navigator.clipboard.writeText(i.value);
  showToast('In Zwischenablage kopiert');
}
