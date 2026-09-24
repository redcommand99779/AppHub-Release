/* ══════════════════════════════════
   KOPFBANNER für die Einzelspieler-Spiele und Lern-Apps (gleicher Stil wie Snake, Sudoku und die Spielzentrale).
   Jedes Banner: Icon, Name, kurzer Hinweis – der Titel kommt aus der Titelleiste des Bildschirms.
══════════════════════════════════ */
const GAME_HEROES={
  tetris:['🧱','#3949ab','Reihen füllen, Linien räumen, Rekord jagen'],
  g2048:['🔢','#f57c00','Kombiniere gleiche Kacheln bis zur 2048'],
  pacman:['🟡','#fbc02d','Sammle alle Punkte und meide die Geister'],
  flappy:['🐦','#0288d1','Flattere durch die Lücken, ohne anzustoßen'],
  wordle:['🟩','#43a047','Errate das Wort in sechs Versuchen'],
  breakout:['🧱','#e53935','Zerstöre alle Steine mit dem Ball'],
  puzzle15:['🔲','#00897b','Schiebe die Kacheln in die richtige Reihenfolge'],
  typeracer:['⌨️','#5e35b1','Tippe schneller als die anderen'],
  typing:['⌨️','#5e35b1','Trainiere dein Tempo und deine Genauigkeit'],
  reaktion:['⚡','#f9a825','Wie schnell bist du wirklich?'],
  mathe:['➕','#00838f','Kopfrechnen unter Zeitdruck'],
  vokabeln:['📚','#6d4c41','Vokabeln lernen und wiederholen'],
  laenderquiz:['🌍','#1565c0','Wie gut kennst du die Länder der Welt?'],
  flaggenquiz:['🚩','#c62828','Erkenne die Flagge']
};
function gameHeroesMount(){
  Object.keys(GAME_HEROES).forEach(id=>{
    try{
      const screen=document.getElementById('screen-'+id);if(!screen||screen.querySelector('.sm-hero'))return;
      const content=[...screen.children].find(c=>!c.classList.contains('titlebar'));if(!content)return;
      const [icon,color,sub]=GAME_HEROES[id];
      const title=((screen.querySelector('.title-text')||{}).textContent||id).replace(/</g,'&lt;');
      const d=document.createElement('div');d.className='sm-hero';
      d.style.cssText=`display:flex;align-items:center;gap:14px;padding:14px 16px;margin-bottom:16px;border-radius:18px;background:linear-gradient(120deg,${color},var(--accent));color:#fff;box-shadow:0 6px 20px rgba(0,0,0,0.15)`;
      d.innerHTML=`<div style="font-size:36px;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.3))">${icon}</div>
        <div style="min-width:0"><div style="font-size:20px;font-weight:800;line-height:1.15;letter-spacing:-0.3px">${title}</div><div style="font-size:12px;opacity:0.92;margin-top:2px">${sub}</div></div>`;
      content.insertBefore(d,content.firstChild);
    }catch(e){}
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',gameHeroesMount);else gameHeroesMount();
