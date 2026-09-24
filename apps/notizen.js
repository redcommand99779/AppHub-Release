/* ══════════════════════════════════
   NOTIZEN
══════════════════════════════════ */
let notes=JSON.parse(localStorage.getItem('zf_notes')||'[]');
let activeNoteId=null;
function notesInit(){
  renderNoteList();
  if(notes.length) noteOpen(notes[0].id);
  else showNoteEmpty();
}
function notesDataSave(){localStorage.setItem('zf_notes',JSON.stringify(notes))}
function noteNew(){
  const n={id:Date.now(),title:'Neue Notiz',body:'',date:new Date().toLocaleDateString('de-DE')};
  notes.unshift(n);notesDataSave();renderNoteList();noteOpen(n.id);
}
function noteOpen(id){
  activeNoteId=id;
  const n=notes.find(x=>x.id===id);if(!n)return;
  document.getElementById('notes-empty').style.display='none';
  const ea=document.getElementById('notes-edit-area');ea.style.display='flex';
  document.getElementById('note-title').value=n.title;
  document.getElementById('note-body').value=n.body;
  renderNoteList();
}
function showNoteEmpty(){
  activeNoteId=null;
  document.getElementById('notes-empty').style.display='flex';
  document.getElementById('notes-edit-area').style.display='none';
}
function noteSave(){
  if(!activeNoteId)return;
  const n=notes.find(x=>x.id===activeNoteId);if(!n)return;
  n.title=document.getElementById('note-title').value||'Ohne Titel';
  n.body=document.getElementById('note-body').value;
  n.date=new Date().toLocaleDateString('de-DE');
  notesDataSave();renderNoteList();
}
function noteDelete(){
  notes=notes.filter(x=>x.id!==activeNoteId);
  notesDataSave();renderNoteList();
  if(notes.length)noteOpen(notes[0].id);else showNoteEmpty();
}
function renderNoteList(){
  const el=document.getElementById('notes-list-items');
  el.innerHTML=notes.map(n=>`<div class="note-item${n.id===activeNoteId?' active':''}" onclick="noteOpen(${n.id})">
    <div class="note-item-title">${escD(n.title)}</div>
    <div class="note-item-date">${n.date}</div>
  </div>`).join('');
}
