/* ══════════════════════════════════
   SHOP – Themes, Avatar-Rahmen, Profil-Banner, Titel, Konfetti, Sound-Pakete, Spielbrett-Skins
   Seltenheiten, Freischalt-Belohnungen (Trophäen), limitierte Saison-Items, Wochenangebote (−30 %)
   Tagesbonus & Glücksrad.  Alles gehört dem aktiven Spieler (zc.player); Ausrüstung: zc.eqp[name]
══════════════════════════════════ */
/* ── Admin-Modus (versteckt, Strg/Cmd+Alt+Shift+M) – unendlich Münzen zum Testen ── */
function zcAdminOn(){try{return localStorage.getItem('zf_admin')==='1';}catch(e){return false;}}
function zcAdminToggle(){
  const on=!zcAdminOn();
  try{localStorage.setItem('zf_admin',on?'1':'0');}catch(e){}
  showToast(on?'🔑 Admin-Modus aktiviert – unendlich Münzen':'Admin-Modus deaktiviert',2500);
  if(typeof zcRenderShop==='function')zcRenderShop();
  if(typeof zcChipUpdate==='function')zcChipUpdate();
}

const ZC_RARITY={common:{label:'Gewöhnlich',color:'#9e9e9e'},rare:{label:'Selten',color:'#42a5f5'},epic:{label:'Episch',color:'#ab47bc'},legend:{label:'Legendär',color:'#ffb300'},mythic:{label:'Mythisch',color:'#ff2fd0'},admin:{label:'Admin',color:'#ff1744'}};
const ZC_MONTHS=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

/* ── Themes ── */
const ZC_SKINS={
  ocean:{name:'Ozean',icon:'🌊',price:100,dark:true,desc:'Tiefblau mit Türkis',vars:{'--bg':'#06202e','--window':'rgba(8,38,54,0.92)','--window-border':'rgba(38,198,218,0.25)','--surface':'rgba(14,64,86,0.6)','--surface-hover':'rgba(20,84,110,0.8)','--text':'#e3f9ff','--text-2':'#8fc9d8','--text-3':'#4f8494','--accent':'#26c6da','--accent-hover':'#4dd8ea','--divider':'rgba(255,255,255,0.09)','--glow':'rgba(38,198,218,0.25)'}},
  candy:{name:'Zuckerwatte',icon:'🍭',price:100,dark:false,desc:'Helles Rosa & Pastell',vars:{'--bg':'#fff0f6','--window':'rgba(255,255,255,0.9)','--window-border':'rgba(255,77,148,0.25)','--surface':'rgba(255,255,255,0.8)','--surface-hover':'#ffe0ee','--text':'#4a1942','--text-2':'#8c4a7c','--text-3':'#b98aae','--accent':'#ff4d94','--accent-hover':'#ff6fa8','--divider':'rgba(74,25,66,0.1)','--glow':'rgba(255,77,148,0.2)'}},
  sunset:{name:'Sonnenuntergang',icon:'🌅',price:120,dark:true,desc:'Violett zu Orange',vars:{'--bg':'#2a1233','--window':'rgba(58,22,64,0.9)','--window-border':'rgba(255,112,67,0.28)','--surface':'rgba(96,36,84,0.55)','--surface-hover':'rgba(120,46,96,0.75)','--text':'#fff0e6','--text-2':'#f3b8a0','--text-3':'#a5717a','--accent':'#ff7043','--accent-hover':'#ff8a65','--divider':'rgba(255,255,255,0.09)','--glow':'rgba(255,112,67,0.25)'}},
  neon:{name:'Neon-Nacht',icon:'💜',price:150,dark:true,desc:'Dunkel mit leuchtendem Cyan',vars:{'--bg':'#08081a','--window':'rgba(14,10,40,0.94)','--window-border':'rgba(0,240,255,0.35)','--surface':'rgba(28,18,72,0.6)','--surface-hover':'rgba(44,28,104,0.8)','--text':'#f2f0ff','--text-2':'#b4acff','--text-3':'#6e64b8','--accent':'#00f0ff','--accent-hover':'#5cf6ff','--divider':'rgba(0,240,255,0.14)','--glow':'rgba(0,240,255,0.45)'}},
  gaming:{name:'Gaming',icon:'🎮',price:200,dark:true,desc:'Schwarz, Giftgrün, eckig',vars:{'--bg':'#0b0d10','--window':'rgba(16,19,24,0.95)','--window-border':'rgba(118,255,3,0.3)','--surface':'rgba(26,31,38,0.85)','--surface-hover':'rgba(38,46,56,0.95)','--text':'#e8ffe0','--text-2':'#9bc48a','--text-3':'#58704f','--accent':'#76ff03','--accent-hover':'#96ff3a','--divider':'rgba(118,255,3,0.14)','--glow':'rgba(118,255,3,0.3)','--tile-radius':'3px','--font':"'Segoe UI','Rajdhani',Arial,sans-serif"}},
  retro:{name:'Retro-Terminal',icon:'📟',price:250,dark:true,desc:'Grüner Phosphor mit Scanlines',vars:{'--bg':'#020a04','--window':'rgba(4,16,8,0.96)','--window-border':'rgba(51,255,102,0.35)','--surface':'rgba(8,32,16,0.75)','--surface-hover':'rgba(12,48,24,0.9)','--text':'#33ff66','--text-2':'#22b84a','--text-3':'#157a30','--accent':'#ffb000','--accent-hover':'#ffc233','--divider':'rgba(51,255,102,0.18)','--glow':'rgba(51,255,102,0.3)','--font':"'DM Mono','Consolas','Courier New',monospace"}},
  gold:{name:'Gold-Luxus',icon:'👑',price:300,dark:true,desc:'Schwarz mit Goldakzenten',vars:{'--bg':'#120f08','--window':'rgba(26,21,12,0.95)','--window-border':'rgba(255,213,79,0.35)','--surface':'rgba(46,38,20,0.7)','--surface-hover':'rgba(66,54,28,0.85)','--text':'#fff4d6','--text-2':'#d6bf82','--text-3':'#8a7a4c','--accent':'#ffd54f','--accent-hover':'#ffe082','--divider':'rgba(255,213,79,0.15)','--glow':'rgba(255,213,79,0.3)'}},
  cyber:{name:'Cyberpunk',icon:'🤖',price:350,dark:true,desc:'Magenta auf Nachtviolett',vars:{'--bg':'#12001c','--window':'rgba(26,4,40,0.95)','--window-border':'rgba(255,42,109,0.4)','--surface':'rgba(52,10,72,0.65)','--surface-hover':'rgba(78,16,104,0.85)','--text':'#fdeaff','--text-2':'#d99cff','--text-3':'#8a57b3','--accent':'#ff2a6d','--accent-hover':'#ff5c8f','--divider':'rgba(5,217,232,0.2)','--glow':'rgba(255,42,109,0.4)'}},
  diamant:{name:'Diamant',icon:'💎',price:0,rarity:'legend',dark:false,desc:'Kristallklar & glitzernd',req:{t:'trophy',id:'expert',txt:'Trophäe „KI-Bezwinger"'},vars:{'--bg':'#eaf6ff','--window':'rgba(255,255,255,0.92)','--window-border':'rgba(64,196,255,0.4)','--surface':'rgba(255,255,255,0.85)','--surface-hover':'#d8efff','--text':'#0d2a44','--text-2':'#3d6a8f','--text-3':'#7fa6c4','--accent':'#00b0ff','--accent-hover':'#40c4ff','--divider':'rgba(13,42,68,0.1)','--glow':'rgba(0,176,255,0.35)'}},
  fruehling:{name:'Frühlingswiese',icon:'🌸',price:180,rarity:'epic',dark:false,desc:'Zartes Grün & Blütenrosa',limited:[3,4,5],vars:{'--bg':'#f1f8e9','--window':'rgba(255,255,255,0.9)','--window-border':'rgba(124,179,66,0.35)','--surface':'rgba(255,255,255,0.8)','--surface-hover':'#e6f4d7','--text':'#2e3b1f','--text-2':'#6b8a4a','--text-3':'#9bb37f','--accent':'#ec407a','--accent-hover':'#f06292','--divider':'rgba(46,59,31,0.1)','--glow':'rgba(236,64,122,0.2)'}},
  sommer:{name:'Sommerstrand',icon:'🏖️',price:180,rarity:'epic',dark:false,desc:'Sand, Sonne, Meerblau',limited:[6,7,8],vars:{'--bg':'#fff8e1','--window':'rgba(255,255,255,0.9)','--window-border':'rgba(255,167,38,0.4)','--surface':'rgba(255,255,255,0.8)','--surface-hover':'#ffefc4','--text':'#3e2f10','--text-2':'#8a6a2a','--text-3':'#b9a06a','--accent':'#039be5','--accent-hover':'#29b6f6','--divider':'rgba(62,47,16,0.1)','--glow':'rgba(3,155,229,0.2)'}},
  herbst:{name:'Herbstlaub',icon:'🍂',price:180,rarity:'epic',dark:true,desc:'Warme Braun- und Orangetöne',limited:[9,10,11],vars:{'--bg':'#231810','--window':'rgba(44,28,18,0.94)','--window-border':'rgba(230,126,34,0.35)','--surface':'rgba(78,48,28,0.6)','--surface-hover':'rgba(104,64,36,0.8)','--text':'#fdebd3','--text-2':'#dba872','--text-3':'#9a7448','--accent':'#f57c00','--accent-hover':'#ff9800','--divider':'rgba(255,255,255,0.09)','--glow':'rgba(245,124,0,0.3)'}},
  winter:{name:'Winterzauber',icon:'⛄',price:180,rarity:'epic',dark:true,desc:'Eisblau und Schneeweiß',limited:[12,1,2],vars:{'--bg':'#0d1b2a','--window':'rgba(18,34,52,0.94)','--window-border':'rgba(179,229,252,0.35)','--surface':'rgba(30,58,86,0.6)','--surface-hover':'rgba(44,80,116,0.8)','--text':'#f0f8ff','--text-2':'#a9cce3','--text-3':'#5d84a4','--accent':'#81d4fa','--accent-hover':'#b3e5fc','--divider':'rgba(255,255,255,0.1)','--glow':'rgba(129,212,250,0.3)'}},
  mythic:{name:'Individuell',icon:'🎨',price:520,rarity:'mythic',dark:true,custom:true,desc:'Wähle deine eigene Akzentfarbe – der ganze Look wird darum gebaut'},
  admin:{name:'System-Override',icon:'🛡️',price:0,rarity:'admin',dark:true,req:{t:'admin',txt:'Nur im Admin-Modus'},desc:'Exklusiv für den Admin-Modus',vars:{'--bg':'#0a0000','--window':'rgba(20,4,4,0.95)','--window-border':'rgba(255,23,68,0.4)','--surface':'rgba(40,10,10,0.7)','--surface-hover':'rgba(60,16,16,0.9)','--text':'#ffdada','--text-2':'#ff8a8a','--text-3':'#a85050','--accent':'#ff1744','--accent-hover':'#ff5252','--divider':'rgba(255,23,68,0.15)','--glow':'rgba(255,23,68,0.4)'}}
};
const ZC_CONFETTI={
  gold:{name:'Münzregen',icon:'🪙',price:60,em:['🪙','💰','🪙']},
  party:{name:'Party',icon:'🎉',price:60,em:['🎉','🎊','🥳']},
  hearts:{name:'Herzchen',icon:'💖',price:80,em:['💖','💗','💕']},
  stars:{name:'Sternenhimmel',icon:'✨',price:80,em:['✨','⭐','🌟']},
  snow:{name:'Schneefall',icon:'❄️',price:80,em:['❄️','❅','❆']},
  fire:{name:'Funkenflug',icon:'🔥',price:100,em:['🔥','🧨','✴️']},
  halloween:{name:'Kürbisregen',icon:'🎃',price:120,rarity:'epic',limited:[10],em:['🎃','👻','🦇']},
  xmas:{name:'Weihnachten',icon:'🎄',price:120,rarity:'epic',limited:[12],em:['🎄','🎁','⭐']},
  sylvester:{name:'Feuerwerk',icon:'🎆',price:120,rarity:'epic',limited:[1],em:['🎆','🎇','🍾']},
  nova:{name:'Sternenexplosion',icon:'💥',price:540,rarity:'mythic',burst:true,desc:'Partikel schießen aus der Mitte statt von oben zu fallen',em:['💥','✨','🌟','⭐']},
  victory:{name:'Siegesrausch',icon:'🌈',price:580,rarity:'mythic',burst:true,flash:true,desc:'Bildschirmweiter Farbverlauf-Flash + Partikel-Explosion',em:['🎉','✨','🌟','💫','🎆']}
};
const ZC_TITLES={
  passchamp:{icon:'🏵️',name:'Saison-Champion',price:400,rarity:'mythic',req:{t:'pass',level:15,txt:'Saison-Pass Stufe 15 (Meister-Rang) erreichen'}},
  neu:{icon:'🐣',name:'Neuling',price:20},wuerfel:{icon:'🎲',name:'Würfelkönig',price:60},
  fuchs:{icon:'🦊',name:'Schachfuchs',price:60},hai:{icon:'🦈',name:'Kartenhai',price:60},
  glueck:{icon:'🍀',name:'Glückspilz',price:80},strat:{icon:'🧠',name:'Stratege',price:100},
  meister:{icon:'🏵️',name:'Meister',price:150},legende:{icon:'👑',name:'Legende',price:300},
  unaufh:{icon:'🌋',name:'Unaufhaltsam',price:0,rarity:'epic',req:{t:'trophy',id:'streak10',txt:'Trophäe „Unaufhaltsam" (10 Siege in Folge)'}},
  welt:{icon:'🌍',name:'Weltenbummler',price:0,rarity:'rare',req:{t:'trophy',id:'played9',txt:'Trophäe „Weltenbummler" (alle Spiele gespielt)'}},
  chamaeleon:{icon:'🦎',name:'Chamäleon',price:520,rarity:'mythic',anim:true,desc:'Der Titel schimmert in einem laufenden Regenbogen-Farbverlauf'},
  admin:{icon:'🛡️',name:'Administrator',price:0,rarity:'admin',req:{t:'admin',txt:'Nur im Admin-Modus'}}
};
const ZC_PACKS={
  '8bit':{icon:'👾',name:'Retro-8-Bit',price:80,desc:'Alle Effekte als Rechteckwellen'},
  soft:{icon:'🎐',name:'Sanft',price:60,desc:'Weiche, leise Sinustöne'},
  deep:{icon:'🥁',name:'Tief',price:60,desc:'Alles eine Oktave tiefer'}
};
const ZC_FRAMES={
  pixel:{icon:'🟦',name:'Pixel-Rahmen',price:60,ring:'repeating-linear-gradient(45deg,#222 0 4px,#fff 4px 8px)'},
  gold:{icon:'🥇',name:'Goldrand',price:80,ring:'linear-gradient(135deg,#fff3b0,#ffc107 40%,#b8860b)',glow:'0 0 6px rgba(255,193,7,0.6)'},
  ice:{icon:'🧊',name:'Eiskristall',price:100,ring:'linear-gradient(135deg,#e0f7fa,#4fc3f7,#0277bd)',glow:'0 0 8px rgba(79,195,247,0.6)'},
  neon:{icon:'💠',name:'Neon-Glow',price:120,ring:'linear-gradient(135deg,#00f0ff,#7c4dff)',glow:'0 0 12px #00f0ff'},
  flame:{icon:'🔥',name:'Flammenring',price:150,ring:'conic-gradient(#ff5722,#ffc107,#ff5722,#ffc107,#ff5722)',glow:'0 0 10px rgba(255,87,34,0.7)'},
  rainbow:{icon:'🌈',name:'Regenbogen',price:200,ring:'conic-gradient(#f44336,#ff9800,#ffeb3b,#4caf50,#2196f3,#9c27b0,#f44336)',glow:'0 0 8px rgba(156,39,176,0.5)'},
  krone:{icon:'👑',name:'Kronen-Rahmen',price:0,rarity:'legend',req:{t:'trophy',id:'champ',txt:'Trophäe „Meister" (Meisterschaft gewonnen)'},ring:'linear-gradient(135deg,#fff8e1,#ffd700,#ff8f00)',glow:'0 0 14px #ffd700',deco:'👑'},
  herz:{icon:'💝',name:'Herzkranz',price:140,rarity:'epic',limited:[2],ring:'conic-gradient(#ff80ab,#f50057,#ff80ab,#f50057,#ff80ab)',glow:'0 0 10px rgba(245,0,87,0.5)',deco:'💗'},
  mythic:{icon:'🎨',name:'Individueller Rahmen',price:520,rarity:'mythic',custom:true,anim:true,desc:'Wähle zwei eigene Farben – der Verlauf schimmert dabei sanft'},
  sparkle:{icon:'✨',name:'Sternenkranz',price:540,rarity:'mythic',ring:'conic-gradient(#ff2fd0,#7c4dff,#00e5ff,#00e676,#ffea00,#ff2fd0)',glow:'0 0 12px rgba(255,47,208,0.55)',deco:'✨',decoAnim:true,desc:'Ein Funken-Symbol schwebt sanft über dem Profilbild'},
  admin:{icon:'🛡️',name:'Admin-Schild',price:0,rarity:'admin',req:{t:'admin',txt:'Nur im Admin-Modus'},ring:'linear-gradient(135deg,#37474f,#ff1744 50%,#37474f)',glow:'0 0 14px rgba(255,23,68,0.6)',deco:'🛡️'}
};
const ZC_BANNERS={
  aurora:{icon:'🌌',name:'Polarlicht',price:60,bg:'linear-gradient(120deg,#00c9a7,#4d8dff,#b26bff)'},
  sunset:{icon:'🌇',name:'Abendrot',price:60,bg:'linear-gradient(120deg,#ff7043,#f06292,#7e57c2)'},
  ocean:{icon:'🌊',name:'Meeresrauschen',price:80,bg:'linear-gradient(120deg,#0093e9,#80d0c7)'},
  space:{icon:'🚀',name:'Weltraum',price:100,bg:'radial-gradient(circle at 20% 30%,#5b3aa8,#0b0b2a 60%)'},
  matrix:{icon:'🟩',name:'Matrix',price:120,bg:'repeating-linear-gradient(90deg,#001a00 0 6px,#003a00 6px 12px)'},
  gold:{icon:'🏆',name:'Goldbarren',price:200,bg:'linear-gradient(120deg,#8a6d1d,#ffd54f,#8a6d1d)'},
  saison:{icon:'🏁',name:'Saisonsieger',price:0,rarity:'legend',req:{t:'trophy',id:'season',txt:'Trophäe „Saisonsieger"'},bg:'linear-gradient(120deg,#ff8f00,#ffd700,#ff5722,#ffd700)'},
  mythic:{icon:'🎨',name:'Individuelles Banner',price:520,rarity:'mythic',custom:true,desc:'Wähle zwei eigene Farben für dein Banner'},
  admin:{icon:'🛡️',name:'Root-Zugriff',price:0,rarity:'admin',req:{t:'admin',txt:'Nur im Admin-Modus'},bg:'linear-gradient(120deg,#0a0000,#37474f,#ff1744)'}
};
const ZC_BOARDS={
  chess:{
    marble:{icon:'⬜',name:'Marmor',price:80,l:'#e9e9ef',d:'#8c96ab',sel:'#8bd3a8',ml:'#c9dcae',md:'#9fb98a'},
    forest:{icon:'🌲',name:'Turnier-Grün',price:60,l:'#eeeed2',d:'#769656',sel:'#bbcb2b',ml:'#d6e07a',md:'#a3b94a'},
    ice:{icon:'🧊',name:'Eisfeld',price:100,l:'#e3f2fd',d:'#6fa3d1',sel:'#7fdcb0',ml:'#b6e0f7',md:'#5b93c2'},
    neon:{icon:'💜',name:'Neon-Brett',price:150,l:'#2a1f5c',d:'#0f0a2a',sel:'#00b894',ml:'#3c5bd6',md:'#2a3fa8',ts:'0 0 8px #00f0ff'},
    mythic:{icon:'🌌',name:'Kosmos-Brett',price:560,rarity:'mythic',l:'#241a3d',d:'#120b22',sel:'#ff2fd0',ml:'#5a3d8a',md:'#3d2a63',ts:'0 0 8px #ff2fd0',glowAnim:true,glowColor:'#ff2fd0',desc:'Figuren pulsieren sanft in mythischem Glühen'}
  },
  vg:{
    glass:{icon:'🔮',name:'Glas-Steine',price:80,disc:(c,f)=>f?`background:radial-gradient(circle at 30% 28%,rgba(255,255,255,0.85),${c} 48%,${c});border:2px solid rgba(255,255,255,0.4);box-shadow:inset 0 -4px 8px rgba(0,0,0,0.25)`:'background:rgba(255,255,255,0.12);border:2px solid rgba(255,255,255,0.15)'},
    coin:{icon:'🪙',name:'Münzen',price:100,disc:(c,f)=>f?`background:radial-gradient(circle,${c} 52%,rgba(255,255,255,0.7) 55%,${c} 60%);border:3px solid rgba(0,0,0,0.3);box-shadow:0 2px 4px rgba(0,0,0,0.3)`:'background:rgba(255,255,255,0.12);border:3px dashed rgba(255,255,255,0.15)'},
    neon:{icon:'💡',name:'Neon-Steine',price:140,rarity:'epic',disc:(c,f)=>f?`background:${c};border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 14px ${c},0 0 4px #fff inset`:'background:rgba(255,255,255,0.06);border:2px solid rgba(255,255,255,0.18)'},
    mythic:{icon:'🌌',name:'Kosmos-Steine',price:560,rarity:'mythic',glowAnim:true,disc:(c,f)=>f?`background:radial-gradient(circle at 30% 28%,rgba(255,255,255,0.9),${c} 55%);border:2px solid rgba(255,255,255,0.7);animation:zcGlowPulse 1.8s ease-in-out infinite;--myth-glow:${c}`:'background:rgba(255,255,255,0.06);border:2px solid rgba(255,255,255,0.18)',desc:'Gesetzte Steine pulsieren in ihrer eigenen Farbe'}
  },
  dice:{
    gold:{icon:'🟨',name:'Gold-Würfel',price:100,bg:'linear-gradient(135deg,#ffe082,#ffb300)',pip:'#4e342e',bd:'#b8860b',sh:'0 2px 8px rgba(184,134,11,0.5)'},
    casino:{icon:'🟥',name:'Casino-Würfel',price:80,bg:'#c62828',pip:'#fff',bd:'#7f0000',sh:'0 2px 6px rgba(0,0,0,0.3)'},
    ice:{icon:'🟦',name:'Eis-Würfel',price:80,bg:'linear-gradient(135deg,#e3f2fd,#b3e5fc)',pip:'#0d47a1',bd:'#90caf9',sh:'0 2px 6px rgba(13,71,161,0.25)'},
    neon:{icon:'💠',name:'Neon-Würfel',price:150,rarity:'epic',bg:'#0a0a1f',pip:'#00f0ff',bd:'#00f0ff',sh:'0 0 12px rgba(0,240,255,0.6)'},
    mythic:{icon:'🌌',name:'Kosmos-Würfel',price:560,rarity:'mythic',bg:'radial-gradient(circle at 35% 30%,#4a2f8a,#0a0416)',pip:'#ff2fd0',bd:'#7c4dff',sh:'0 0 14px rgba(124,77,255,0.6)',glowAnim:true,glowColor:'#ff2fd0',desc:'Würfel pulsieren beim Wurf in mythischem Glühen'}
  },
  mem:{
    stars:{icon:'🌟',name:'Sternenrücken',price:60,back:'🌟',bg:'#1a237e'},
    ocean:{icon:'🐚',name:'Muschelrücken',price:60,back:'🐚',bg:'#006064'},
    flame:{icon:'🔥',name:'Flammenrücken',price:80,back:'🔥',bg:'#bf360c'},
    cat:{icon:'🐱',name:'Katzenrücken',price:100,back:'🐱',bg:'#6a1b9a'},
    mythic:{icon:'🌌',name:'Kosmos-Rücken',price:560,rarity:'mythic',back:'🌌',bg:'#1a0a2e',glowAnim:true,glowColor:'#ff2fd0',desc:'Kartenrücken pulsieren in mythischem Glühen'}
  }
};
const ZC_BACKGROUNDS={
  starfield:{icon:'🌌',name:'Sternenfeld',price:560,rarity:'mythic',anim:'stars',desc:'Ein dezent funkelndes Sternenfeld hinter der ganzen App'}
};
/* Helden-Skins für das Jump-and-Run „Super Jumper“ (Farben und Effekte des Helden; werden in jump-run.js gezeichnet) */
const ZC_JSKINS={
  wald:{icon:'🌲',name:'Waldläufer',price:60,hero:{cap:'#2e7d32',capTop:'#a5d6a7',body:'#5d4037',strap:'#ffd54f'}},
  rosa:{icon:'💗',name:'Rosa Blitz',price:60,hero:{cap:'#ec407a',capTop:'#f8bbd0',body:'#8e24aa',strap:'#ffeb3b'}},
  feuer:{icon:'🔥',name:'Feuerläufer',price:100,hero:{cap:'#e53935',capTop:'#ffab91',body:'#b71c1c',strap:'#ffca28',boots:'#3e2723'}},
  eis:{icon:'🧊',name:'Eisprinz',price:100,hero:{cap:'#4fc3f7',capTop:'#e1f5fe',body:'#0277bd',strap:'#e1f5fe',boots:'#01579b'}},
  goldkappe:{icon:'👑',name:'Goldkappe',price:120,hero:{cap:'#ffd600',capTop:'#fff59d',body:'#37474f',strap:'#ffd600'}},
  schatten:{icon:'🌑',name:'Schattenläufer',price:150,hero:{cap:'#311b92',capTop:'#7c4dff',body:'#212121',strap:'#7c4dff',skin:'#d1c4e9',boots:'#000000',glow:'rgba(124,77,255,0.7)'}},
  neon:{icon:'💠',name:'Neon-Held',price:180,hero:{cap:'#00e5ff',capTop:'#b2ebf2',body:'#0d0221',strap:'#ff2fd0',skin:'#e0f7fa',boots:'#00e5ff',glow:'rgba(0,229,255,0.8)'}},
  ninja:{icon:'🥷',name:'Ninja',price:280,hero:{cap:'#212121',capTop:'#616161',body:'#263238',strap:'#e53935',boots:'#111111',mask:true,cape:'#e53935'}},
  astronaut:{icon:'🧑‍🚀',name:'Astronaut',price:300,hero:{cap:'#eceff1',capTop:'#ffffff',body:'#cfd8dc',strap:'#ff7043',skin:'#eceff1',boots:'#90a4ae',visor:true}},
  regenbogen:{icon:'🌈',name:'Regenbogen-Läufer',price:540,rarity:'mythic',desc:'Hinterlässt beim Laufen und Springen einen Regenbogen-Schweif',hero:{cap:'#ff2fd0',capTop:'#ffffff',body:'#7c4dff',strap:'#ffea00',boots:'#00e5ff',trail:'rainbow',glow:'rgba(255,47,208,0.6)'}},
  golden:{icon:'✨',name:'Goldener Held',price:580,rarity:'mythic',desc:'Golden glänzend mit funkelndem Schweif',hero:{cap:'#ffd54f',capTop:'#fff8e1',body:'#ffb300',strap:'#fff8e1',skin:'#ffe0b2',boots:'#bf8a00',trail:'gold',glow:'rgba(255,213,79,0.8)'}}
};
/* Kleines Bild des Helden (für Vorschau im Shop) */
function zcHeroSvg(h,size){
  const d={cap:'#ffb300',capTop:'#ffe082',body:'#3f6fe6',strap:'#ffd54f',skin:'#ffdcb8',boots:'#5d4037'};
  const c=Object.assign({},d,h||{}),w=size||32,ht=Math.round(w*1.25);
  return`<svg viewBox="0 0 32 40" width="${w}" height="${ht}" style="display:block;${c.glow?`filter:drop-shadow(0 0 4px ${c.glow})`:''}">
    ${c.cape?`<path d="M9 19 L1 26 L9 33 Z" fill="${c.cape}"/>`:''}
    <rect x="8" y="33" width="7" height="5" rx="2" fill="${c.boots}"/><rect x="17" y="33" width="7" height="5" rx="2" fill="${c.boots}"/>
    <rect x="8" y="20" width="16" height="14" rx="5" fill="${c.body}"/><circle cx="13" cy="25" r="1.7" fill="${c.strap}"/><circle cx="19" cy="25" r="1.7" fill="${c.strap}"/>
    <circle cx="16" cy="13" r="8.5" fill="${c.skin}"/>
    <path d="M7.5 12 A8.5 8.5 0 0 1 24.5 12 Z" fill="${c.cap}"/><rect x="15" y="9" width="11" height="3.5" fill="${c.cap}"/><circle cx="13" cy="6.5" r="1.8" fill="${c.capTop}"/>
    ${c.mask?`<rect x="7.5" y="11.5" width="17" height="5" fill="rgba(20,20,30,0.9)"/>`:''}
    ${c.visor?`<rect x="14" y="8.5" width="11" height="8" rx="3.5" fill="rgba(120,200,255,0.85)"/>`:`<circle cx="19.5" cy="13" r="2.4" fill="#fff"/><circle cx="20.3" cy="13" r="1.2" fill="#222"/>`}
  </svg>`;
}
const ZC_COLL={jskin:ZC_JSKINS,skin:ZC_SKINS,title:ZC_TITLES,conf:ZC_CONFETTI,pack:ZC_PACKS,frame:ZC_FRAMES,banner:ZC_BANNERS,bg:ZC_BACKGROUNDS,bchess:ZC_BOARDS.chess,bvg:ZC_BOARDS.vg,bdice:ZC_BOARDS.dice,bmem:ZC_BOARDS.mem};
const ZC_TABS=[['home','🎡 Rotation'],['bundle','🎁 Sets'],['skin','🎨 Themes'],['frame','🖼️ Rahmen'],['banner','🏳️ Banner'],['bg','🌌 Hintergrund'],['jskin','🏃 Helden'],['title','🏷️ Titel'],['conf','🎊 Konfetti'],['pack','🔊 Sound'],['board','🎲 Spielbretter'],['set','⚙️ Sonstiges']];
const ZC_BOARD_KINDS=[['bchess','♟️ Schach'],['bvg','🔴 Vier gewinnt'],['bdice','🎲 Kniffel-Würfel'],['bmem','🃏 Memory-Rücken']];
let zcShopTab='home';

function zcItem(kind,id){return(ZC_COLL[kind]||{})[id];}
function zcRarityKey(it){
  if(it.rarity)return it.rarity;
  const p=it.price;return p<90?'common':p<180?'rare':p<300?'epic':'legend';
}
function zcRarityOf(it){return ZC_RARITY[zcRarityKey(it)];}

/* ── Mythische Items: Farben komplett selbst wählbar + Animationen ── */
const ZC_MYTH_CSS=`
@keyframes zcGradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes zcFloat{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-4px)}}
@keyframes zcGlowPulse{0%,100%{filter:drop-shadow(0 0 2px var(--myth-glow,#ff2fd0))}50%{filter:drop-shadow(0 0 9px var(--myth-glow,#ff2fd0))}}
@keyframes zcBurst{to{transform:translate(var(--dx),var(--dy)) scale(0.3) rotate(540deg);opacity:0}}
@keyframes zcFlash{0%{opacity:0}18%{opacity:0.3}100%{opacity:0}}
@keyframes zcFall{to{transform:translateY(105vh) rotate(540deg);opacity:0.2}}
@keyframes zcTwinkle{0%,100%{opacity:0.55}50%{opacity:1}}
`;
function zcEnsureMythStyle(){
  if(document.getElementById('zc-myth-css'))return;
  const st=document.createElement('style');st.id='zc-myth-css';st.textContent=ZC_MYTH_CSS;document.head.appendChild(st);
}
function zcHexToHsl(hex){
  const m=/^#?([0-9a-f]{6})$/i.exec(hex||'');hex=m?'#'+m[1]:'#ff2fd0';
  const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b);let h=0,s=0;const l=(max+min)/2;
  if(max!==min){
    const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);
    if(max===r)h=(g-b)/d+(g<b?6:0);else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;
    h*=60;
  }
  return[h,s*100,l*100];
}
function zcHslToHex(h,s,l){
  s/=100;l/=100;
  const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
  let r=0,g=0,b=0;
  if(h<60)[r,g,b]=[c,x,0];else if(h<120)[r,g,b]=[x,c,0];else if(h<180)[r,g,b]=[0,c,x];
  else if(h<240)[r,g,b]=[0,x,c];else if(h<300)[r,g,b]=[x,0,c];else[r,g,b]=[c,0,x];
  return'#'+[r+m,g+m,b+m].map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('');
}
const ZC_CUSTOM_DEFAULT={skin:'#ff2fd0',frame:['#ff2fd0','#7c4dff'],banner:['#ff2fd0','#7c4dff']};
function zcCustomGet(kind,name){
  const z=zcp(),k=zcKey(name===undefined?z.player:name);
  return(z.custom[k]&&z.custom[k][kind])||ZC_CUSTOM_DEFAULT[kind];
}
function zcCustomSet(kind,name,val){
  const z=zcp(),k=zcKey(name===undefined?z.player:name);
  z.custom[k]=z.custom[k]||{};z.custom[k][kind]=val;smSave('zentrale');
}
function zcMythicSkinVars(hex){
  const[h]=zcHexToHsl(hex);
  return{'--bg':zcHslToHex(h,45,7),'--window':zcHslToHex(h,40,11),'--window-border':hex+'55',
    '--surface':zcHslToHex(h,35,15),'--surface-hover':zcHslToHex(h,35,19),
    '--text':zcHslToHex(h,20,96),'--text-2':zcHslToHex(h,28,74),'--text-3':zcHslToHex(h,24,48),
    '--accent':hex,'--accent-hover':zcHslToHex(h,85,68),
    '--divider':'rgba(255,255,255,0.1)','--glow':hex+'55'};
}
function zcFrameRing(fr,name){const c=zcCustomGet('frame',name);return fr.anim?`linear-gradient(135deg,${c[0]},${c[1]},${c[0]})`:`linear-gradient(135deg,${c[0]},${c[1]})`;}
function zcFrameGlow(fr,name){return`0 0 10px ${zcCustomGet('frame',name)[0]}99`;}
function zcBannerGrad(b,name){const c=zcCustomGet('banner',name);return`linear-gradient(120deg,${c[0]},${c[1]})`;}
function zcCustomOpen(kind,id){
  const z=zcp(),name=(z.player||'').trim();if(!name)return;
  const single=kind==='skin',cur=zcCustomGet(kind,name),c1=single?cur:cur[0],c2=single?null:cur[1];
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px';
  ov.innerHTML=`<div style="background:var(--window);color:var(--text);border:0.5px solid var(--window-border,var(--divider));border-radius:14px;padding:22px;max-width:300px;width:100%;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,0.3)">
    <div style="font-size:15px;font-weight:700;margin-bottom:14px">🎨 Eigene Farben wählen</div>
    <div style="display:flex;gap:16px;justify-content:center;margin-bottom:16px">
      <label style="display:flex;flex-direction:column;align-items:center;gap:6px;font-size:11px;color:var(--text-3)">${single?'Farbe':'Farbe 1'}<input type="color" id="zc-cc-1" value="${c1}" style="width:48px;height:36px;padding:0;border:0.5px solid var(--divider);border-radius:8px;cursor:pointer;background:none"/></label>
      ${single?'':`<label style="display:flex;flex-direction:column;align-items:center;gap:6px;font-size:11px;color:var(--text-3)">Farbe 2<input type="color" id="zc-cc-2" value="${c2}" style="width:48px;height:36px;padding:0;border:0.5px solid var(--divider);border-radius:8px;cursor:pointer;background:none"/></label>`}
    </div>
    <div style="display:flex;gap:10px;justify-content:center">
      <button class="timer-btn" id="zc-cc-cancel" style="padding:8px 16px;font-size:13px">Abbrechen</button>
      <button class="timer-btn" id="zc-cc-save" style="padding:8px 16px;font-size:13px;background:var(--accent);color:#fff;border-color:var(--accent)">Speichern</button>
    </div>
  </div>`;
  ov.querySelector('#zc-cc-cancel').onclick=()=>ov.remove();
  ov.onclick=e=>{if(e.target===ov)ov.remove();};
  ov.querySelector('#zc-cc-save').onclick=()=>{
    const v1=document.getElementById('zc-cc-1').value;
    zcCustomSet(kind,name,single?v1:[v1,document.getElementById('zc-cc-2').value]);
    if(kind==='skin'&&zcEquipped('skin',name)===id)zcSkinApply();
    ov.remove();zcRenderShop();showToast('🎨 Farben gespeichert',2000);
  };
  document.body.appendChild(ov);
}

/* ── Sets: mehrere zusammenpassende Kosmetik-Teile mit Rabatt ── */
const ZC_BUNDLES=[
  {id:'ocean',name:'Ozean-Set',icon:'🌊',rarity:'common',items:[['skin','ocean'],['frame','ice'],['conf','snow']]},
  {id:'candy',name:'Zuckerwatte-Set',icon:'🍭',rarity:'common',items:[['skin','candy'],['frame','herz'],['conf','hearts']]},
  {id:'neon',name:'Neon-Set',icon:'💜',rarity:'rare',items:[['skin','neon'],['frame','neon'],['conf','stars']]},
  {id:'retro',name:'Retro-Set',icon:'📟',rarity:'rare',items:[['skin','retro'],['frame','pixel'],['conf','party']]},
  {id:'gold',name:'Gold-Set',icon:'👑',rarity:'epic',items:[['skin','gold'],['frame','gold'],['conf','gold']]},
  {id:'cyber',name:'Cyberpunk-Set',icon:'🤖',rarity:'legend',items:[['skin','cyber'],['frame','neon'],['conf','fire']]}
];
/* Sets sind eine Stufe seltener als ihre eigene Seltenheit: ein "gewöhnliches" Set taucht
   in der Rotation so oft auf wie ein "seltenes" Item, ein "seltenes" Set so oft wie ein
   "episches" Item, usw. – daher ein eigenes Mapping statt der normalen Item-Gewichte. */
const ZC_BUNDLE_TIER_SHIFT={common:'rare',rare:'epic',epic:'legend',legend:'mythic'};
function zcBundleSum(b){return b.items.reduce((s,[kind,id])=>s+(zcItem(kind,id).price||0),0);}
function zcBundlePrice(b){return Math.round(zcBundleSum(b)*0.78/10)*10;}
function zcBundleOwned(name,b){return b.items.every(([kind,id])=>zcOwn(name,kind+':'+id));}
function zcBundleBuy(id){
  const b=ZC_BUNDLES.find(x=>x.id===id);if(!b)return;
  const z=zcp(),name=(z.player||'').trim(),k=zcKey(name);
  if(!k){showToast('Wähle zuerst einen Spieler');return;}
  if(zcBundleOwned(name,b)){b.items.forEach(([kind,iid])=>zcShopEquip(kind,iid,true));showToast('Set schon komplett – angelegt ✓');return;}
  const admin=zcAdminOn();
  if(!admin&&!zcRotHas('bundle',id)){sfx('error');showToast('🎡 Sets sind nur kaufbar, wenn sie gerade in der Rotation sind');return;}
  const price=zcBundlePrice(b);
  if(!admin&&(z.coins[k]||0)<price){showToast(`Zu wenig Coins – dir fehlen ${price-(z.coins[k]||0)} 🪙`);return;}
  if(!admin)z.coins[k]-=price;
  b.items.forEach(([kind,iid])=>{const key=kind+':'+iid;if(!zcOwn(name,key))(z.inv[k]=z.inv[k]||[]).push(key);});
  smSave('zentrale');
  b.items.forEach(([kind,iid])=>zcShopEquip(kind,iid,true));
  sfx('rankup');if(typeof smConfetti==='function')smConfetti();
  showToast(`🎁 Set gekauft & angelegt: ${b.name} (−${price} 🪙)`,3000);
  zcRenderShop();
}
function zcBundleCard(name,coins,b,opts){
  opts=opts||{};
  const owned=zcBundleOwned(name,b),sum=zcBundleSum(b),price=zcBundlePrice(b),save=sum-price,rar=ZC_RARITY[b.rarity];
  const inRot=owned||zcRotHas('bundle',b.id)||zcAdminOn();
  const swatches=b.items.map(([kind,id])=>zcItemPreview(kind,id,zcItem(kind,id),name)).join('');
  let btn;
  if(owned)btn=`<button class="timer-btn" onclick="zcBundleBuy('${b.id}')" style="padding:6px 10px;font-size:12px;white-space:nowrap">✓ Anlegen</button>`;
  else if(!inRot)btn=`<button class="timer-btn" disabled title="Erscheint zufällig in der Rotation" style="padding:6px 10px;font-size:12px;white-space:nowrap;opacity:0.5;cursor:default">🔒</button>`;
  else btn=`<button class="timer-btn" onclick="zcBundleBuy('${b.id}')" style="padding:6px 10px;font-size:12px;white-space:nowrap;${coins>=price?'':'opacity:0.5'}"><s style="opacity:0.6">${sum}</s> 🪙 ${price}</button>`;
  return`<div style="background:var(--surface);border:0.5px solid var(--divider);border-left:4px solid #ab47bc;border-radius:10px;padding:8px 12px;margin-bottom:6px">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="display:flex;gap:4px;flex-shrink:0">${swatches}</div>
      <span style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700;color:var(--text)">${b.icon} ${b.name} <span style="font-size:9px;font-weight:700;color:${rar.color};text-transform:uppercase;letter-spacing:0.05em">${rar.label}</span>${opts.badge?` <span style="font-size:10px;color:#fff;background:#ab47bc;border-radius:8px;padding:1px 6px">${opts.badge}</span>`:''}</div><div style="font-size:11px;color:var(--text-3)">${owned||inRot?b.items.map(([kind,id])=>zcItem(kind,id).name).join(' · ')+(owned?'':` · spart ${save} 🪙`):'🎡 Nicht in der aktuellen Rotation'}</div></span>
      ${btn}
    </div></div>`;
}

/* ── Ausrüstung (pro Spieler) ── */
function zcEq(name){
  const z=zcp(),k=zcKey(name===undefined?z.player:name);
  if(!z.eqp[k]){z.eqp[k]={};if(k&&!z.eqMig&&z.eq&&(z.eq.skin||z.eq.conf||z.eq.pack)){Object.assign(z.eqp[k],z.eq);z.eqMig=1;}}
  return z.eqp[k];
}
function zcEquipped(kind,name){const z=zcp(),k=zcKey(name===undefined?z.player:name);return kind==='title'?(z.titles[k]||''):(zcEq(name)[kind]||'');}
function zcBoardSkin(game){
  const kind={chess:'bchess',vg:'bvg',dice:'bdice',mem:'bmem'}[game];
  const id=kind&&zcEquipped(kind),it=id?zcItem(kind,id)||null:null;
  if(it&&it.glowAnim)zcEnsureMythStyle();
  return it;
}
function zcOwn(name,key){return(zcp().inv[zcKey(name)]||[]).includes(key);}

/* ── Titel & Avatar ── */
function zcTitleOf(name){
  const id=zcp().titles[zcKey(name)],t=zcItem('title',id);
  if(!t)return'';
  if(t.anim){
    zcEnsureMythStyle();
    return`<span style="font-weight:700;background:linear-gradient(90deg,#ff2fd0,#7c4dff,#00e5ff,#00e676,#ffea00,#ff2fd0);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:zcGradShift 3s linear infinite">${t.icon} ${t.name}</span>`;
  }
  return`<span style="font-weight:700;color:var(--accent)">${t.icon} ${t.name}</span>`;
}
function zcAvatarHtml(name,size){
  size=size||34;
  const pr=typeof zcProfileOf==='function'?zcProfileOf(name):null,em=(pr&&pr.avatar)||'🙂',col=(pr&&pr.color)||'';
  const fr=zcItem('frame',zcEquipped('frame',name));
  const ring=fr?(fr.custom?zcFrameRing(fr,name):fr.ring):(col?col:'var(--divider)');
  const glow=fr?(fr.custom?zcFrameGlow(fr,name):fr.glow):null,pad=fr?Math.max(2,Math.round(size/11)):2;
  const ringAnim=fr&&fr.anim?(zcEnsureMythStyle(),'background-size:250% 250%;animation:zcGradShift 4s ease-in-out infinite;'):'';
  const decoStyle=fr&&fr.decoAnim?(zcEnsureMythStyle(),'animation:zcFloat 2.2s ease-in-out infinite;'):'transform:translateX(-50%);';
  return`<span style="position:relative;display:inline-flex;flex:none;width:${size}px;height:${size}px;border-radius:50%;padding:${pad}px;background:${ring};${ringAnim}${glow?`box-shadow:${glow};`:''}box-sizing:border-box"><span style="flex:1;border-radius:50%;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.5)}px;line-height:1">${escHtml(em)}</span>${fr&&fr.deco?`<span style="position:absolute;top:-${Math.round(size*0.32)}px;left:50%;font-size:${Math.round(size*0.4)}px;line-height:1;${decoStyle}">${fr.deco}</span>`:''}</span>`;
}
function zcBannerBg(name){const b=zcItem('banner',zcEquipped('banner',name));return b?(b.custom?zcBannerGrad(b,name):b.bg):'';}
function zcBannerBar(name){const bg=zcBannerBg(name);return bg?`<span style="width:5px;align-self:stretch;flex:none;border-radius:3px;background:${bg}"></span>`:'';}
function zcBannerHtml(name){
  const b=zcItem('banner',zcEquipped('banner',name));if(!b)return'';
  return`<div style="height:54px;border-radius:9px;margin:-4px -4px 10px;background:${b.custom?zcBannerGrad(b,name):b.bg}"></div>`;
}

/* ── Skin anwenden ── */
const ZC_SKIN_CSS=`
html[data-skin] .screen.active{background:var(--skin-bg,var(--bg))}
html[data-skin=neon] .app-tile,html[data-skin=neon] .btn-generate,html[data-skin=neon] .nav-tab.active,html[data-skin=cyber] .app-tile,html[data-skin=cyber] .btn-generate,html[data-skin=cyber] .nav-tab.active{box-shadow:0 0 12px var(--glow),inset 0 0 10px var(--glow)}
html[data-skin=neon] .title-text,html[data-skin=cyber] .title-text,html[data-skin=retro] .title-text,html[data-skin=gaming] .title-text{text-shadow:0 0 8px var(--glow)}
html[data-skin=gold] .app-tile,html[data-skin=sunset] .app-tile,html[data-skin=ocean] .app-tile,html[data-skin=diamant] .app-tile,html[data-skin=herbst] .app-tile,html[data-skin=winter] .app-tile{box-shadow:0 0 10px var(--glow)}
html[data-skin=gaming] .app-tile{border-left:3px solid var(--accent)}
html[data-skin=gaming] .title-text,html[data-skin=gaming] .app-tile-name{text-transform:uppercase;letter-spacing:0.06em}
html[data-skin=retro] *{font-family:var(--font)!important}
html[data-skin=retro] body::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:9998;background:repeating-linear-gradient(0deg,rgba(0,0,0,0.2) 0 1px,transparent 1px 3px)}
html[data-skin=sunset]{--skin-bg:linear-gradient(160deg,#2a1233,#5a1f3d 60%,#7a3324)}
html[data-skin=ocean]{--skin-bg:linear-gradient(170deg,#06202e,#0a3a52)}
html[data-skin=candy]{--skin-bg:linear-gradient(160deg,#fff0f6,#ffe4f0 60%,#fdeaff)}
html[data-skin=gold]{--skin-bg:linear-gradient(160deg,#120f08,#241c0c)}
html[data-skin=cyber]{--skin-bg:linear-gradient(160deg,#12001c,#1f0a33 60%,#00202a)}
html[data-skin=neon]{--skin-bg:linear-gradient(160deg,#08081a,#150c38)}
html[data-skin=diamant]{--skin-bg:linear-gradient(160deg,#eaf6ff,#d6efff 60%,#f4fbff)}
html[data-skin=fruehling]{--skin-bg:linear-gradient(160deg,#f1f8e9,#fce4ec)}
html[data-skin=sommer]{--skin-bg:linear-gradient(160deg,#fff8e1,#e1f5fe)}
html[data-skin=herbst]{--skin-bg:linear-gradient(160deg,#231810,#3b2414)}
html[data-skin=winter]{--skin-bg:linear-gradient(160deg,#0d1b2a,#16324a)}
html[data-skin=cyber] .app-tile,html[data-skin=neon] .app-tile{border-color:var(--accent)}
`;
let zcSkinApplied=[];
function zcSkinApply(id){
  const root=document.documentElement;
  if(id===undefined)id=zcEquipped('skin');
  zcSkinApplied.forEach(p=>root.style.removeProperty(p));zcSkinApplied=[];
  let st=document.getElementById('zc-skin-css');
  if(!st){st=document.createElement('style');st.id='zc-skin-css';st.textContent=ZC_SKIN_CSS;document.head.appendChild(st);}
  const s=ZC_SKINS[id];
  if(!s){
    root.removeAttribute('data-skin');
    const th=localStorage.getItem('zf_theme')||'auto';
    root.setAttribute('data-theme',(typeof zfThemeDark==='function'?zfThemeDark(th):(th==='dark'||(th==='auto'&&window.matchMedia('(prefers-color-scheme:dark)').matches)))?'dark':'light');
    return;
  }
  const vars=s.custom?zcMythicSkinVars(zcCustomGet('skin')):s.vars;
  Object.entries(vars).forEach(([k,v])=>{root.style.setProperty(k,v);zcSkinApplied.push(k);});
  root.style.setProperty('--active-bg',vars['--accent']+'22');root.style.setProperty('--active-border',vars['--accent']+'66');
  zcSkinApplied.push('--active-bg','--active-border');
  root.setAttribute('data-skin',id);
  root.setAttribute('data-theme',s.dark?'dark':'light');
}
const ZC_STARFIELD_POS=[[12,22],[78,15],[48,8],[90,42],[8,78],[34,58],[62,88],[92,82],[25,40],[55,30],[68,65],[38,92],[15,55],[95,12],[45,75],[72,48],[5,35],[82,68],[58,18],[20,88]];
function zcBgApply(){
  const id=zcEquipped('bg'),it=id?ZC_BACKGROUNDS[id]:null;
  let el=document.getElementById('zc-bg-layer');
  if(!it){el&&el.remove();return;}
  zcEnsureMythStyle();
  if(!el){el=document.createElement('div');el.id='zc-bg-layer';document.body.prepend(el);}
  // größere, weiche "Glow"-Sterne statt harter 1px-Punkte, plus ein paar in --accent für Farbe –
  // sonst auf hellen Themes/über der dichten UI kaum wahrnehmbar
  const layers=ZC_STARFIELD_POS.map(([x,y],i)=>{
    const size=i%4===0?7:i%3===0?5:3.2;
    const color=i%5===0?'var(--accent)':'var(--text)';
    return`radial-gradient(${size}px ${size}px at ${x}% ${y}%,${color},transparent 72%)`;
  }).join(',');
  el.style.cssText='position:fixed;inset:0;z-index:0;pointer-events:none;'+
    `background-image:${layers};animation:zcTwinkle 4.5s ease-in-out infinite alternate`;
}
function zcApplyPlayer(){try{zcSkinApply();zcBgApply();if(typeof zcChipUpdate==='function')zcChipUpdate();}catch(e){}}
function zcConfetti(c){
  const it=ZC_CONFETTI[c];if(!it)return;
  zcEnsureMythStyle();
  const em=it.em;
  if(it.flash){
    const fl=document.createElement('div');
    fl.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:2099;background:conic-gradient(from 0deg,#ff2fd0,#7c4dff,#00e5ff,#00e676,#ffea00,#ff2fd0);animation:zcFlash 1.1s ease-out forwards';
    document.body.appendChild(fl);setTimeout(()=>fl.remove(),1150);
  }
  const div=document.createElement('div');
  div.style.cssText='position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:2100';
  let h='';
  if(it.burst){
    for(let i=0;i<40;i++){
      const ang=Math.random()*Math.PI*2,dist=26+Math.random()*40;
      const dx=(Math.cos(ang)*dist).toFixed(1)+'vw',dy=(Math.sin(ang)*dist).toFixed(1)+'vh';
      h+=`<span style="position:absolute;top:50%;left:50%;font-size:${16+Math.floor(Math.random()*20)}px;--dx:${dx};--dy:${dy};animation:zcBurst ${(0.7+Math.random()*0.6).toFixed(2)}s ${(Math.random()*0.15).toFixed(2)}s cubic-bezier(0.2,0.8,0.3,1) forwards">${em[i%em.length]}</span>`;
    }
    div.innerHTML=h;document.body.appendChild(div);setTimeout(()=>div.remove(),1700);
  }else{
    for(let i=0;i<34;i++)h+=`<span style="position:absolute;top:-40px;left:${(Math.random()*100).toFixed(1)}%;font-size:${16+Math.floor(Math.random()*18)}px;animation:zcFall ${(2+Math.random()*1.6).toFixed(2)}s ${(Math.random()*0.6).toFixed(2)}s ease-in forwards">${em[i%em.length]}</span>`;
    div.innerHTML=h;document.body.appendChild(div);setTimeout(()=>div.remove(),4200);
  }
}

/* ── Preise, Angebote, Voraussetzungen ── */
function zcReqMet(name,req){
  if(!req)return true;
  const z=zcp(),k=zcKey(name);
  if(req.t==='trophy')return((z.trophies||{})[k]||[]).includes(req.id);
  if(req.t==='pass')return typeof zcPassState==='function'&&zcPassState(name).claimed.includes(req.level-1); // erst nach dem Abholen der Stufe
  if(req.t==='admin')return zcAdminOn();
  return false;
}
/* Rotierende Auswahl: immer genau 5 Artikel, alle 15 Minuten neu, nach Seltenheit gewichtet
   (gewöhnlich am häufigsten, legendär am seltensten) – wie bei den Vorschau-Stichproben früher,
   aber jetzt spürbar öfter und mit fester Anzahl statt einer wöchentlichen Zufallsauswahl. */
const ZC_ROT_MS=15*60*1000,ZC_ROT_COUNT=5;
const ZC_ROT_WEIGHT={common:50,rare:25,epic:15,legend:6,mythic:2};
function zcRotSlot(){return Math.floor(Date.now()/ZC_ROT_MS);}
function zcRotMsLeft(){return ZC_ROT_MS-(Date.now()%ZC_ROT_MS);}
/* Saison-Pass-Belohnungen: 14 zufällige normale Kosmetik-Artikel pro Saison (aufsteigend nach Preis),
   die bis Saisonende nicht im Shop kaufbar sind. Stufe 15 = Titel „Saison-Champion". */
const ZC_PASS_N=14;
let zcPassItemsCache=null,zcPassItemsSeason=null;
function zcPassItems(){
  let sn=1;try{sn=zcState().zc.seasonNo||1;}catch(e){}
  if(zcPassItemsSeason===sn&&zcPassItemsCache)return zcPassItemsCache;
  const pool=[];
  Object.keys(ZC_COLL).forEach(kind=>Object.entries(ZC_COLL[kind]).forEach(([id,it])=>{
    if(kind==='jskin')return;   // Helden-Skins gehören nicht in den Saison-Pass (Belohnungen bleiben stabil)
    if(it.req||it.limited||it.custom||it.price<=0)return;
    const rk=zcRarityKey(it);if(rk==='mythic'||rk==='admin')return;
    pool.push({kind,id,price:it.price});
  }));
  pool.sort((a,b)=>a.price-b.price||(a.kind+a.id<b.kind+b.id?-1:1));
  const rnd=zcRng('zcpass-'+sn),out=[],n=pool.length;
  for(let i=0;i<ZC_PASS_N;i++){
    const lo=Math.floor(i*n/ZC_PASS_N),hi=Math.max(lo+1,Math.floor((i+1)*n/ZC_PASS_N));
    const p=pool[Math.min(n-1,lo+Math.floor(rnd()*(hi-lo)))];
    out.push({kind:p.kind,id:p.id});
  }
  out.push({kind:'title',id:'passchamp'});
  zcPassItemsSeason=sn;zcPassItemsCache=out;return out;
}
function zcPassItemAt(i){return zcPassItems()[i]||null;}
function zcIsPassItem(kind,id){return zcPassItems().some((p,i)=>i<ZC_PASS_N&&p.kind===kind&&p.id===id);}
function zcRotPool(){
  const out=[];
  Object.keys(ZC_COLL).forEach(kind=>Object.entries(ZC_COLL[kind]).forEach(([id,it])=>{
    if(it.req)return; // nur echte Käufe, keine Erfolgs-Freischaltungen
    if(zcIsPassItem(kind,id))return; // diese Saison exklusiv im Saison-Pass
    if(it.limited&&!zcLimitedOpen(it))return;
    out.push({kind,id,rar:zcRarityKey(it)});
  }));
  ZC_BUNDLES.forEach(b=>out.push({kind:'bundle',id:b.id,rar:ZC_BUNDLE_TIER_SHIFT[b.rarity]}));
  return out;
}
function zcRotPlayerKey(){try{return zcKey((zcp().player||'').trim());}catch(e){return '';}}
function zcRotPick(){
  const slot=zcRotSlot(),rnd=zcRng('zcrot-'+slot+'-'+zcRotPlayerKey()),pool=zcRotPool();
  const byRar={};pool.forEach(p=>{(byRar[p.rar]=byRar[p.rar]||[]).push(p);});
  const used=new Set(),picked=[];
  let guard=0;
  while(picked.length<ZC_ROT_COUNT&&guard<200){
    guard++;
    const avail=Object.keys(ZC_ROT_WEIGHT).filter(r=>byRar[r]&&byRar[r].some(p=>!used.has(p.kind+':'+p.id)));
    if(!avail.length)break;
    const totalW=avail.reduce((s,r)=>s+ZC_ROT_WEIGHT[r],0);
    let roll=rnd()*totalW,chosenR=avail[avail.length-1];
    for(const r of avail){if(roll<ZC_ROT_WEIGHT[r]){chosenR=r;break;}roll-=ZC_ROT_WEIGHT[r];}
    const candidates=byRar[chosenR].filter(p=>!used.has(p.kind+':'+p.id));
    const item=candidates[Math.floor(rnd()*candidates.length)];
    used.add(item.kind+':'+item.id);picked.push(item);
  }
  return picked;
}
let zcRotCache=null,zcRotCacheSlot=null;
function zcRotPickCached(){
  const slot=zcRotSlot()+'|'+zcRotPlayerKey();
  if(zcRotCacheSlot!==slot){zcRotCacheSlot=slot;zcRotCache=zcRotPick();}
  return zcRotCache;
}
function zcRotHas(kind,id){return zcRotPickCached().some(o=>o.kind===kind&&o.id===id);}
function zcPriceOf(name,kind,id){return zcItem(kind,id).price;}
let zcRotTimer=null,zcRotLastSlot=null;
function zcRotStart(){
  if(zcRotTimer)return;
  zcRotLastSlot=zcRotSlot();
  zcRotTimer=setInterval(()=>{
    if(zcView!=='shop'||zcShopTab!=='home'){clearInterval(zcRotTimer);zcRotTimer=null;return;}
    const slot=zcRotSlot();
    if(slot!==zcRotLastSlot){zcRotLastSlot=slot;zcRenderShop();return;}
    const cd=document.getElementById('zc-rot-cd');if(!cd){clearInterval(zcRotTimer);zcRotTimer=null;return;}
    const ms=zcRotMsLeft(),m=Math.floor(ms/60000),sec2=Math.floor(ms%60000/1000);
    cd.textContent=`${m}:${String(sec2).padStart(2,'0')}`;
    const bar=document.getElementById('zc-rot-bar');if(bar)bar.style.width=(ms/ZC_ROT_MS*100).toFixed(1)+'%';
  },1000);
}
function zcLimitedOpen(it){return!it.limited||it.limited.includes(new Date().getMonth()+1);}
function zcLimitedText(it){return it.limited.length===12?'':it.limited.map(m=>ZC_MONTHS[m-1]).join('/');}

function zcShopBuy(kind,id){
  const z=zcp(),name=(z.player||'').trim(),k=zcKey(name);
  if(!k){showToast('Wähle zuerst einen Spieler');return;}
  const it=zcItem(kind,id),key=kind+':'+id;
  if(!it||zcOwn(name,key))return;
  const admin=zcAdminOn();
  if(it.req){
    if(!admin&&!zcReqMet(name,it.req)){sfx('error');showToast('🔒 '+it.req.txt+' nötig');return;}
  }else{
    if(!admin&&zcIsPassItem(kind,id)){sfx('error');showToast('🎫 Diese Saison nur über den Saison-Pass');return;}
    if(!admin&&!zcLimitedOpen(it)){sfx('error');showToast('⏳ Nur im '+zcLimitedText(it)+' erhältlich');return;}
    if(!admin&&!it.limited&&!zcRotHas(kind,id)){sfx('error');showToast('🎡 Nur die 5 Artikel der aktuellen Rotation sind kaufbar');return;}
    const price=zcPriceOf(name,kind,id);
    if(!admin&&(z.coins[k]||0)<price){sfx('error');showToast(`Zu wenig Coins – dir fehlen ${price-(z.coins[k]||0)} 🪙`);return;}
    if(!admin)z.coins[k]-=price;
  }
  (z.inv[k]=z.inv[k]||[]).push(key);smSave('zentrale');
  // Kaufklang nach Seltenheit: gewöhnlich/selten = Münze, episch = Fanfare, legendär+ = Rang-Aufstieg mit Konfetti
  const rk=zcRarityKey(it);
  if(it.req||rk==='legend'||rk==='mythic'||rk==='admin'){sfx('rankup');if(typeof smConfetti==='function')smConfetti();}
  else sfx(rk==='epic'?'win':'coin');
  zcShopEquip(kind,id,true);
  showToast(it.req?`🔓 Freigeschaltet: ${it.name}`:`🛍️ Gekauft: ${it.name}`,2500);
}
function zcShopEquip(kind,id,quiet){
  const z=zcp(),name=(z.player||'').trim(),k=zcKey(name),key=kind+':'+id;
  if(!zcOwn(name,key))return;
  if(!quiet)sfx('click');
  if(kind==='title'){z.titles[k]=z.titles[k]===id&&!quiet?'':id;}
  else{const eq=zcEq();eq[kind]=eq[kind]===id&&!quiet?'':id;}
  if(kind==='skin')zcSkinApply();
  else if(kind==='bg')zcBgApply();
  else if(kind==='conf'&&zcEq().conf)zcConfetti(zcEq().conf);
  else if(kind==='pack')sfx('win');
  smSave('zentrale');zcRenderShop();if(typeof zcChipUpdate==='function')zcChipUpdate();
}
let zcPreviewT=null;
function zcSkinPreview(id){
  zcSkinApply(id);clearTimeout(zcPreviewT);
  showToast('👁️ Vorschau – wird in 6 Sekunden zurückgesetzt',2500);
  zcPreviewT=setTimeout(()=>zcSkinApply(),6000);
}
function zcPackPreview(id){
  const eq=zcEq(),orig=eq.pack;
  eq.pack=id;sfx('rankup');
  setTimeout(()=>{eq.pack=orig;},700);
}
function zcItemPreviewBig(kind,it){
  if(it.custom&&kind==='frame')return`<span style="width:96px;height:96px;border-radius:50%;padding:8px;box-sizing:border-box;background:conic-gradient(${ZC_CUSTOM_DEFAULT.frame[0]},${ZC_CUSTOM_DEFAULT.frame[1]},${ZC_CUSTOM_DEFAULT.frame[0]});display:inline-flex"><span style="flex:1;border-radius:50%;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:40px">🎨</span></span>`;
  if(it.custom&&kind==='banner')return`<div style="width:100%;height:90px;border-radius:12px;background:linear-gradient(120deg,${ZC_CUSTOM_DEFAULT.banner[0]},${ZC_CUSTOM_DEFAULT.banner[1]})"></div>`;
  if(kind==='frame')return`<span style="width:96px;height:96px;border-radius:50%;padding:8px;box-sizing:border-box;background:${it.ring};${it.glow?`box-shadow:${it.glow};`:''}display:inline-flex;position:relative"><span style="flex:1;border-radius:50%;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:40px">🙂</span>${it.deco?`<span style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);font-size:30px">${it.deco}</span>`:''}</span>`;
  if(kind==='banner')return`<div style="width:100%;height:90px;border-radius:12px;background:${it.bg}"></div>`;
  if(kind==='bchess')return`<div style="display:grid;grid-template-columns:repeat(4,36px);width:fit-content;margin:0 auto;border-radius:6px;overflow:hidden">${Array.from({length:16}).map((_,i)=>{const r=Math.floor(i/4),f=i%4,light=(r+f)%2===0;return`<div style="width:36px;height:36px;background:${light?it.l:it.d}"></div>`;}).join('')}</div>`;
  if(kind==='bvg')return`<div style="display:inline-flex;gap:6px;padding:12px;border-radius:10px;background:#1565c0">${Array.from({length:4}).map(()=>`<span style="width:30px;height:30px;border-radius:50%;${it.disc('#e53935',true)}"></span>`).join('')}</div>`;
  if(kind==='bdice')return`<span style="display:inline-flex;width:64px;height:64px;border-radius:12px;align-items:center;justify-content:center;background:${it.bg};border:2px solid ${it.bd};box-shadow:${it.sh||'none'}${it.glowAnim?`;animation:zcGlowPulse 1.8s ease-in-out infinite;--myth-glow:${it.glowColor||'#ff2fd0'}`:''}"><span style="width:14px;height:14px;border-radius:50%;background:${it.pip}"></span></span>`;
  if(kind==='bmem')return`<span style="display:inline-flex;width:64px;height:88px;border-radius:8px;align-items:center;justify-content:center;font-size:34px;background:${it.bg}${it.glowAnim?`;animation:zcGlowPulse 1.8s ease-in-out infinite;--myth-glow:${it.glowColor||'#ff2fd0'}`:''}">${it.back}</span>`;
  if(kind==='title'&&it.anim)return`<span style="font-size:22px;font-weight:800;background:linear-gradient(90deg,#ff2fd0,#7c4dff,#00e5ff,#00e676,#ffea00,#ff2fd0);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:zcGradShift 3s linear infinite">${it.icon} ${it.name}</span>`;
  if(kind==='title')return`<span style="font-size:22px;font-weight:800;color:var(--accent)">${it.icon} ${it.name}</span>`;
  if(kind==='jskin')return`<div style="display:flex;justify-content:center;padding:6px 0">${zcHeroSvg(it.hero,84)}</div>`;
  if(kind==='bg')return`<div style="width:100%;height:90px;border-radius:12px;position:relative;overflow:hidden;background:#0a0a1a;box-shadow:inset 0 0 20px rgba(0,0,0,0.4)"><div style="position:absolute;inset:0;opacity:0.8;background-image:radial-gradient(1.4px 1.4px at 15% 25%,#fff,transparent),radial-gradient(1.4px 1.4px at 75% 20%,#fff,transparent),radial-gradient(1px 1px at 45% 60%,#fff,transparent),radial-gradient(1.4px 1.4px at 85% 70%,#fff,transparent),radial-gradient(1px 1px at 25% 80%,#fff,transparent),radial-gradient(1px 1px at 60% 40%,#fff,transparent);animation:zcTwinkle 3s ease-in-out infinite alternate"></div></div>`;
  return'';
}
function zcItemPreviewOpen(kind,id){
  const it=zcItem(kind,id);if(!it)return;
  if(kind==='skin')return zcSkinPreview(id);
  if(kind==='conf')return zcConfetti(id);
  if(kind==='pack')return zcPackPreview(id);
  zcEnsureMythStyle();
  const big=zcItemPreviewBig(kind,it);if(!big)return;
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px';
  ov.innerHTML=`<div style="background:var(--window);color:var(--text);border:0.5px solid var(--window-border,var(--divider));border-radius:14px;padding:22px;max-width:300px;width:100%;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,0.3)">
    <div style="margin-bottom:14px;display:flex;align-items:center;justify-content:center">${big}</div>
    <div style="font-size:15px;font-weight:700;margin-bottom:4px">${it.icon||''} ${it.name}</div>
    ${it.desc?`<div style="font-size:12px;color:var(--text-3);margin-bottom:14px">${it.desc}</div>`:''}
    <button class="timer-btn" style="padding:8px 18px;font-size:13px">Schließen</button>
  </div>`;
  ov.querySelector('button').onclick=()=>ov.remove();
  ov.onclick=e=>{if(e.target===ov)ov.remove();};
  document.body.appendChild(ov);
}
function zcSetPlayerPlus(v){
  zcp().player=(v||'').trim();smSave('zentrale');
  if(zcView==='shop')zcRenderShop(true);else if(zcView==='week')zcRenderWeek(true);
  else if(zcView==='bonus')zcRenderBonus(true);else if(zcView==='stats')zcRenderStats(true);
  else if(zcView==='season'&&typeof zcRenderSeason==='function')zcRenderSeason(true);
}
function zcNotifToggle(on){
  const z=zcp();
  if(on){
    if(!('Notification' in window)){showToast('Benachrichtigungen werden hier nicht unterstützt');z.notif=false;}
    else Notification.requestPermission().then(p=>{z.notif=p==='granted';smSave('zentrale');zcRenderShop();if(z.notif)showToast('🔔 Erinnerungen aktiviert');else showToast('Erlaubnis nicht erteilt');});
    return;
  }
  z.notif=false;smSave('zentrale');zcRenderShop();
}
function zcPlayerInput(id){
  const z=zcp(),names=typeof zcProfiles==='function'?zcProfiles().map(p=>p.name):[];
  return`<datalist id="zc-names4">${[...new Set([...names,...zcAllNames()])].map(n=>`<option value="${escHtml(n)}"></option>`).join('')}</datalist>
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:14px;padding:8px 10px;background:var(--surface);border:0.5px solid var(--divider);border-radius:14px">${z.player?zcAvatarHtml(z.player,38):'<span style="font-size:24px;padding:0 4px">👤</span>'}
    <input type="text" id="${id}" list="zc-names4" value="${escHtml(z.player||'')}" placeholder="Dein Spielername…" oninput="zcSetPlayerPlus(this.value)" onchange="zcApplyPlayer()" style="flex:1;min-width:0;box-sizing:border-box;padding:10px 12px;background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;color:var(--text);font-size:14px"/>
    ${typeof zcWhoOpen==='function'?`<button class="timer-btn" onclick="zcWhoOpen(true)" style="padding:9px 12px;font-size:12px;white-space:nowrap">👥 Wechseln</button>`:''}</div>`;
}

/* ── Shop-Ansicht ── */
function zcShopSetTab(t){zcShopTab=t;zcRenderShop();}
function zcRenderShop(keepFocus){
  const wrap=document.getElementById('zc-shop');if(!wrap)return;
  const z=zcp(),name=(z.player||'').trim(),k=zcKey(name),coins=zcAdminOn()?Infinity:(z.coins[k]||0);
  const active=document.activeElement;
  if(keepFocus&&active&&active.id==='zc-shop-input'){const body=document.getElementById('zc-shop-body');if(body){body.innerHTML=zcShopBody(name,k,coins);return;}}
  wrap.innerHTML=`${zcPlayerInput('zc-shop-input')}<div id="zc-shop-body">${zcShopBody(name,k,coins)}</div>`;
}
function zcItemCard(name,coins,kind,id,opts){
  opts=opts||{};
  const it=zcItem(kind,id),key=kind+':'+id,own=zcOwn(name,key),rar=zcRarityOf(it),eqOn=zcEquipped(kind,name)===id;
  const sw=zcItemPreview(kind,id,it,name);
  const previewBtn=`<button class="timer-btn" onclick="zcItemPreviewOpen('${kind}','${id}')" style="padding:6px 8px;font-size:12px" title="Vorschau">👁️</button>`;
  const customizeBtn=it.custom?`<button class="timer-btn" onclick="zcCustomOpen('${kind}','${id}')" style="padding:6px 10px;font-size:12px;white-space:nowrap" title="Eigene Farben wählen">🎨 Anpassen</button>`:'';
  let btn='',desc=it.desc||'';
  if(own){btn=`${previewBtn}${customizeBtn}<button class="timer-btn" onclick="zcShopEquip('${kind}','${id}')" style="padding:6px 10px;font-size:12px;white-space:nowrap;${eqOn?'background:var(--accent);color:#fff;border-color:var(--accent)':''}">${eqOn?'✓ Aktiv':'Anlegen'}</button>`;}
  else if(it.req){
    const met=zcReqMet(name,it.req)||zcAdminOn();
    desc=(met?'✅ ':'🔒 ')+it.req.txt;
    btn=`${previewBtn}<button class="timer-btn" onclick="zcShopBuy('${kind}','${id}')" style="padding:6px 10px;font-size:12px;white-space:nowrap;${met?'':'opacity:0.5'}">${met?'🔓 Freischalten':'🔒'}</button>`;
  }else{
    const passOnly=zcIsPassItem(kind,id)&&!zcAdminOn();
    const inRot=!passOnly&&(it.limited||zcRotHas(kind,id)||zcAdminOn());
    const open=zcLimitedOpen(it)||zcAdminOn(),price=it.price,ok=coins>=price&&open&&inRot;
    if(it.limited)desc=(open?'⏳ Limitiert – noch bis Monatsende':'⏳ Nur im '+zcLimitedText(it))+(it.desc?' · '+it.desc:'');
    else if(passOnly)desc='🎫 Diese Saison nur über den Saison-Pass'+(it.desc?' · '+it.desc:'');
    else if(!inRot)desc='🎡 Nicht in der aktuellen Rotation'+(it.desc?' · '+it.desc:'');
    btn=inRot?`${previewBtn}<button class="timer-btn" onclick="zcShopBuy('${kind}','${id}')" style="padding:6px 10px;font-size:12px;white-space:nowrap;${ok?'':'opacity:0.5'}">🪙 ${price}</button>`
      :`${previewBtn}<button class="timer-btn" disabled title="Erscheint zufällig in der Rotation" style="padding:6px 10px;font-size:12px;white-space:nowrap;opacity:0.5;cursor:default">🔒</button>`;
  }
  return`<div style="display:flex;align-items:center;gap:10px;background:var(--surface);border:0.5px solid var(--divider);border-left:4px solid ${rar.color};border-radius:12px;padding:10px 12px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.05)">${sw}<span style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700;color:var(--text)">${it.icon} ${it.name} <span style="font-size:9px;font-weight:700;color:${rar.color};text-transform:uppercase;letter-spacing:0.05em">${rar.label}</span>${opts.badge?` <span style="font-size:10px;color:#fff;background:#e53935;border-radius:8px;padding:1px 6px">${opts.badge}</span>`:''}</div>${desc?`<div style="font-size:11px;color:var(--text-3)">${desc}</div>`:''}</span>${btn}</div>`;
}
/* Schaufenster-Kachel für die Rotation: große Vorschau, Seltenheits-Leuchten, Kaufknopf */
function zcRotTile(name,coins,o){
  const isB=o.kind==='bundle';
  const b=isB?ZC_BUNDLES.find(x=>x.id===o.id):null,it=isB?null:zcItem(o.kind,o.id);
  const rar=isB?ZC_RARITY[b.rarity]:zcRarityOf(it),rk=isB?b.rarity:zcRarityKey(it);
  const own=isB?zcBundleOwned(name,b):zcOwn(name,o.kind+':'+o.id);
  const price=isB?zcBundlePrice(b):it.price,sum=isB?zcBundleSum(b):0;
  const affordable=coins>=price;
  const big=isB?`<div style="display:flex;gap:4px;justify-content:center">${b.items.map(([k2,i2])=>`<span style="zoom:1.15;display:inline-flex">${zcItemPreview(k2,i2,zcItem(k2,i2),name)}</span>`).join('')}</div>`
    :`<div style="zoom:1.9;display:inline-flex">${zcItemPreview(o.kind,o.id,it,name)}</div>`;
  const glow=rk==='legend'||rk==='mythic'?`box-shadow:0 0 16px ${rar.color}55;`:'';
  const previewBtn=isB?'':`<button class="timer-btn" onclick="zcItemPreviewOpen('${o.kind}','${o.id}')" style="padding:6px 9px;font-size:12px" title="Vorschau">👁️</button>`;
  const act=isB?`zcBundleBuy('${o.id}')`:`zcShopBuy('${o.kind}','${o.id}')`;
  let btn;
  if(own)btn=isB?`<button class="timer-btn" onclick="${act}" style="flex:1;padding:7px 10px;font-size:12px">✓ Anlegen</button>`
    :`<button class="timer-btn" onclick="zcShopEquip('${o.kind}','${o.id}')" style="flex:1;padding:7px 10px;font-size:12px;${zcEquipped(o.kind,name)===o.id?'background:var(--accent);color:#fff;border-color:var(--accent)':''}">${zcEquipped(o.kind,name)===o.id?'✓ Aktiv':'✓ Im Besitz · Anlegen'}</button>`;
  else btn=`<button class="btn-generate" onclick="${act}" style="flex:1;width:auto;padding:8px 10px;font-size:13px;${affordable?'':'opacity:0.55'}">${isB?`<s style="opacity:0.65;font-weight:400">${sum}</s> `:''}🪙 ${price===Infinity?'∞':price}</button>`;
  const sub=isB?b.items.map(([k2,i2])=>zcItem(k2,i2).name).join(' · ')+(own?'':` · spart ${sum-price} 🪙`):(it.desc||'');
  return`<div style="position:relative;display:flex;flex-direction:column;text-align:center;background:linear-gradient(180deg,${rar.color}26,var(--surface) 62%);border:1.5px solid ${rar.color};${glow}border-radius:14px;padding:12px 10px 10px;${isB?'grid-column:1/-1;':''}">
    <span style="position:absolute;top:8px;left:8px;font-size:9px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#fff;background:${rar.color};border-radius:8px;padding:2px 7px">${rar.label}</span>
    ${isB?`<span style="position:absolute;top:8px;right:8px;font-size:9px;font-weight:800;color:#fff;background:#ab47bc;border-radius:8px;padding:2px 7px">🎁 SET</span>`:''}
    <div style="display:flex;align-items:center;justify-content:center;min-height:${isB?70:86}px;padding-top:14px">${big}</div>
    <div style="font-size:14px;font-weight:800;color:var(--text);margin-top:8px">${isB?b.icon:it.icon} ${escHtml(isB?b.name:it.name)}</div>
    <div style="font-size:11px;color:var(--text-3);min-height:15px;margin:2px 0 9px">${escHtml(sub)}</div>
    <div style="display:flex;gap:6px;margin-top:auto">${previewBtn}${btn}</div>
  </div>`;
}
function zcItemPreview(kind,id,it,name){
  const box=(inner,extra)=>`<span style="width:38px;height:38px;border-radius:8px;flex:none;display:flex;align-items:center;justify-content:center;font-size:20px;${extra||''}">${inner}</span>`;
  if(it.custom){
    const owned=name&&zcOwn(name,kind+':'+id);
    if(kind==='skin'){const c=owned?zcCustomGet('skin',name):ZC_CUSTOM_DEFAULT.skin;return box(`<span style="width:14px;height:14px;border-radius:50%;background:${c};box-shadow:0 0 8px ${c}"></span>`,`background:conic-gradient(#ff2fd0,#7c4dff,#00e5ff,#ff2fd0);border:1px solid rgba(255,255,255,0.3)`);}
    if(kind==='frame'){const c=owned?zcCustomGet('frame',name):ZC_CUSTOM_DEFAULT.frame;return`<span style="width:38px;height:38px;flex:none;display:flex;align-items:center;justify-content:center"><span style="width:32px;height:32px;border-radius:50%;padding:3px;box-sizing:border-box;background:linear-gradient(135deg,${c[0]},${c[1]});display:flex"><span style="flex:1;border-radius:50%;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:13px">🎨</span></span></span>`;}
    if(kind==='banner'){const c=owned?zcCustomGet('banner',name):ZC_CUSTOM_DEFAULT.banner;return box('',`background:linear-gradient(135deg,${c[0]},${c[1]})`);}
  }
  if(kind==='skin')return box(`<span style="width:14px;height:14px;border-radius:50%;background:${it.vars['--accent']};box-shadow:0 0 8px ${it.vars['--accent']}"></span>`,`background:${it.vars['--bg']};border:1px solid ${it.vars['--window-border']}`);
  if(kind==='frame')return`<span style="width:38px;height:38px;flex:none;display:flex;align-items:center;justify-content:center"><span style="width:32px;height:32px;border-radius:50%;padding:3px;box-sizing:border-box;background:${it.ring};${it.glow?`box-shadow:${it.glow}`:''};display:flex"><span style="flex:1;border-radius:50%;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:13px">🙂</span></span></span>`;
  if(kind==='banner')return box('',`background:${it.bg}`);
  if(kind==='bdice')return box(`<span style="width:8px;height:8px;border-radius:50%;background:${it.pip}"></span>`,`background:${it.bg};border:1px solid ${it.bd}`);
  if(kind==='bchess')return box('',`background:conic-gradient(${it.l} 25%,${it.d} 0 50%,${it.l} 0 75%,${it.d} 0)`);
  if(kind==='bvg')return box('',`background:#1565c0`).replace('></span>',`><span style="width:22px;height:22px;border-radius:50%;${it.disc('#e53935',true)}"></span></span>`);
  if(kind==='bmem')return box(it.back,`background:${it.bg}`);
  if(kind==='jskin')return box(zcHeroSvg(it.hero,26),'background:var(--bg)');
  return box(it.icon,'background:var(--bg)');
}
function zcShopBody(name,k,coins){
  const z=zcp(),sec=t=>`<div style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:800;color:var(--text-2);letter-spacing:0.02em;margin:20px 0 8px">${t}<span style="flex:1;height:1px;background:var(--divider)"></span></div>`;
  const chips=ZC_TABS.map(([id,l])=>`<button onclick="zcShopSetTab('${id}')" style="padding:7px 13px;font-size:12px;font-weight:600;border-radius:18px;border:0.5px solid ${zcShopTab===id?'var(--accent)':'var(--divider)'};background:${zcShopTab===id?'var(--accent)':'var(--surface)'};color:${zcShopTab===id?'#fff':'var(--text-2)'};cursor:pointer;white-space:nowrap;${zcShopTab===id?'box-shadow:0 2px 8px var(--glow,rgba(0,0,0,0.18))':''}">${l}</button>`).join('');
  const ownedN=(z.inv[k]||[]).length;
  const earned=z.earned[k]||0;
  let body='';
  const all=kind=>Object.keys(ZC_COLL[kind]).sort((a,b)=>{const A=ZC_COLL[kind][a],B=ZC_COLL[kind][b];return((A.req||A.limited)?1:0)-((B.req||B.limited)?1:0)||A.price-B.price;});
  if(zcShopTab==='home'){
    const rot=zcRotPickCached();
    const ms=zcRotMsLeft(),rm=Math.floor(ms/60000),rs=Math.floor(ms%60000/1000);
    const limited=[];Object.keys(ZC_COLL).forEach(kind=>Object.keys(ZC_COLL[kind]).forEach(id=>{const it=ZC_COLL[kind][id];if(it.limited&&zcLimitedOpen(it))limited.push([kind,id]);}));
    const specials=[];Object.keys(ZC_COLL).forEach(kind=>Object.keys(ZC_COLL[kind]).forEach(id=>{if(ZC_COLL[kind][id].req)specials.push([kind,id]);}));
    body=`<div style="margin:14px 0 12px;border-radius:14px;overflow:hidden;background:linear-gradient(120deg,var(--accent),#ab47bc);color:#fff;padding:14px 16px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <div><div style="font-size:16px;font-weight:800">🎡 Shop-Rotation</div><div style="font-size:11px;opacity:0.9;margin-top:2px">5 Artikel · alle 15 Minuten neu – nur diese sind gerade kaufbar</div></div>
          <div style="text-align:right"><div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85">Neue Auswahl in</div><div id="zc-rot-cd" style="font-size:22px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1.1">${rm}:${String(rs).padStart(2,'0')}</div></div>
        </div>
        <div style="height:5px;background:rgba(255,255,255,0.28);border-radius:3px;margin-top:10px;overflow:hidden"><div id="zc-rot-bar" style="height:100%;width:${(ms/ZC_ROT_MS*100).toFixed(1)}%;background:#fff;border-radius:3px"></div></div>
      </div>`
      +(name?`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">${rot.map(o=>zcRotTile(name,coins,o)).join('')}</div>`:'<div style="font-size:12px;color:var(--text-3)">Wähle einen Spieler, um die Rotation zu sehen.</div>')
      +sec(`⏳ Limitiert im ${ZC_MONTHS[new Date().getMonth()]}`)+(limited.length?limited.map(([kd,id])=>zcItemCard(name,coins,kd,id)).join(''):'<div style="font-size:12px;color:var(--text-3)">Diesen Monat gibt es nichts Limitiertes.</div>')
      +sec('🏆 Freischaltbare Belohnungen (nicht kaufbar)')+specials.map(([kd,id])=>zcItemCard(name,coins,kd,id)).join('')
      +sec('⏳ Kommt später (limitiert)')+Object.keys(ZC_COLL).flatMap(kd=>Object.keys(ZC_COLL[kd]).filter(id=>ZC_COLL[kd][id].limited&&!zcLimitedOpen(ZC_COLL[kd][id])).map(id=>`<span style="display:inline-block;margin:0 6px 6px 0;padding:4px 9px;border-radius:12px;background:var(--surface);border:0.5px solid var(--divider);font-size:11px;color:var(--text-2)">${ZC_COLL[kd][id].icon} ${ZC_COLL[kd][id].name} · ${zcLimitedText(ZC_COLL[kd][id])}</span>`)).join('');
    zcRotStart();
  }else if(zcShopTab==='bundle'){
    body=sec('🎁 Sets – mehrere passende Teile zusammen günstiger')
      +`<div style="font-size:11px;color:var(--text-3);margin-bottom:8px">🎡 Sets sind sehr selten und nur kaufbar, wenn sie gerade in der Rotation auftauchen.</div>`
      +ZC_BUNDLES.map(b=>zcBundleCard(name,coins,b)).join('');
  }else if(zcShopTab==='board'){
    body=`<div style="font-size:11px;color:var(--text-3);margin-bottom:8px">🎡 Nur Artikel aus der aktuellen Rotation sind kaufbar – der Rest ist eine Vorschau und erscheint dort zufällig.</div>`
      +ZC_BOARD_KINDS.map(([kd,l])=>sec(l)+all(kd).map(id=>zcItemCard(name,coins,kd,id)).join('')).join('');
  }else if(zcShopTab==='set'){
    body=sec('🔔 Erinnerungen')+`<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:10px 12px">
      <input type="checkbox" ${z.notif?'checked':''} onchange="zcNotifToggle(this.checked)" style="margin-top:2px"/>
      <span><span style="display:block;font-size:13px;font-weight:600;color:var(--text)">Browser-Benachrichtigung bei drohendem Serien-Verlust</span><span style="display:block;font-size:11px;color:var(--text-3);margin-top:2px">Ab 17 Uhr, solange die App geöffnet ist. Ohne Häkchen gibt es nur den Hinweis in der App.</span></span></label>`
      +sec('🧹 Kosmetik')+`<button class="timer-btn" onclick="zcShopReset()" style="padding:6px 12px;font-size:12px">Alle Kosmetik ablegen</button>`;
  }else{
    body=`<div style="font-size:11px;color:var(--text-3);margin-bottom:8px">🎡 Nur Artikel aus der aktuellen Rotation sind kaufbar – der Rest ist eine Vorschau und erscheint dort zufällig.</div>`
      +all(zcShopTab).map(id=>zcItemCard(name,coins,zcShopTab,id)).join('');
  }
  return`<div style="border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;background:linear-gradient(120deg,#f9a825,#ff7043);color:#fff;box-shadow:0 2px 10px rgba(255,112,67,0.25)">
      <div style="font-size:38px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25))">🪙</div>
      <div style="flex:1;min-width:140px"><div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9">Dein Guthaben</div><div style="font-size:26px;font-weight:800;line-height:1.1">${coins===Infinity?'∞':coins} Coins</div><div style="font-size:11px;opacity:0.92;margin-top:2px">${name?`insgesamt verdient: ${earned} · ${ownedN} Artikel im Besitz`:'Spieler wählen, um Coins & Käufe zu sehen'}</div></div>
      <div style="display:flex;gap:8px"><button onclick="zcGiftToggle()" style="padding:8px 13px;font-size:12px;font-weight:700;border-radius:12px;border:1px solid rgba(255,255,255,0.6);background:rgba(255,255,255,0.2);color:#fff;cursor:pointer;white-space:nowrap">💌 Verschenken</button>
      <button onclick="zcShow('bonus')" style="padding:8px 13px;font-size:12px;font-weight:700;border-radius:12px;border:none;background:#fff;color:#e65100;cursor:pointer;white-space:nowrap">🎁 Bonus</button></div>
    </div>
    ${zcGiftOpen?zcGiftPanel(name,coins):''}
    <div style="font-size:11px;color:var(--text-3);margin-top:6px;line-height:1.5">Coins gibt es für Partien (Sieg 5, Unentschieden 2, Niederlage 1, +3 gegen schwere KI), Challenges, Trophäen, Schach-Rätsel, den Tagesbonus und das Glücksrad.</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin:12px 0 4px">${chips}</div>${body}`;
}
/* ── Coins verschenken ── */
let zcGiftOpen=false,zcGiftTo='',zcGiftAmt=10;
function zcGiftToggle(){zcGiftOpen=!zcGiftOpen;zcRenderShop();}
function zcGiftSetTo(v){zcGiftTo=v;}
function zcGiftSetAmt(v){zcGiftAmt=Math.max(1,Math.round(+v||1));}
function zcGiftSend(){
  const z=zcp(),from=(z.player||'').trim(),k=zcKey(from);
  if(!k){showToast('Wähle zuerst einen Spieler');return;}
  const to=(zcGiftTo||'').trim(),tk=zcKey(to);
  if(!to||tk===k){showToast('Wähle einen Empfänger');return;}
  if(!zcProfileOf(to)){showToast('Unbekannter Account');return;}
  const amt=zcGiftAmt;
  if((z.coins[k]||0)<amt){showToast('Zu wenig Coins');return;}
  z.coins[k]-=amt;z.coins[tk]=(z.coins[tk]||0)+amt;z.earned[tk]=(z.earned[tk]||0)+amt;
  smSave('zentrale');sfx('coin');showToast(`💌 ${amt} Coins an ${to} verschenkt`,2500);
  zcGiftOpen=false;zcRenderShop();if(typeof zcChipUpdate==='function')zcChipUpdate();
}
function zcGiftPanel(name,coins){
  coins=zcp().coins[zcKey(name)]||0; // Verschenken bleibt an den echten Kontostand gebunden, auch im Admin-Modus
  const others=zcProfiles().filter(p=>zcKey(p.name)!==zcKey(name));
  if(!others.length)return`<div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:10px 12px;margin-top:8px;font-size:12px;color:var(--text-3)">Noch kein anderer Account vorhanden, dem du etwas schenken könntest.</div>`;
  if(!zcGiftTo||!others.some(p=>zcKey(p.name)===zcKey(zcGiftTo)))zcGiftTo=others[0].name;
  return`<div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:10px 12px;margin-top:8px">
    <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:8px">💌 Coins verschenken</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <select onchange="zcGiftSetTo(this.value)" style="flex:1;min-width:120px;padding:7px 9px;background:var(--bg);border:0.5px solid var(--divider);border-radius:8px;color:var(--text);font-size:13px">${others.map(p=>`<option value="${escHtml(p.name)}" ${zcKey(p.name)===zcKey(zcGiftTo)?'selected':''}>${escHtml(p.avatar)} ${escHtml(p.name)}</option>`).join('')}</select>
      <input type="number" min="1" max="${coins}" value="${zcGiftAmt}" oninput="zcGiftSetAmt(this.value)" style="width:80px;padding:7px 9px;background:var(--bg);border:0.5px solid var(--divider);border-radius:8px;color:var(--text);font-size:13px;text-align:right"/>
      <button class="btn-generate" onclick="zcGiftSend()" style="width:auto;padding:8px 16px;font-size:12px">Senden</button>
    </div>
    <div style="font-size:10px;color:var(--text-3);margin-top:6px">Dein Kontostand: ${coins} 🪙</div>
  </div>`;
}
function zcShopReset(){const z=zcp(),k=zcKey(z.player);z.eqp[k]={};z.titles[k]='';smSave('zentrale');zcSkinApply();zcBgApply();zcRenderShop();}

/* ══ Tagesbonus & Glücksrad ══ */
const ZC_WHEEL=[{v:5,w:26,c:'#78909c'},{v:10,w:26,c:'#42a5f5'},{v:15,w:18,c:'#26a69a'},{v:20,w:12,c:'#66bb6a'},{v:25,w:9,c:'#ffa726'},{v:50,w:6,c:'#ab47bc'},{v:100,w:2,c:'#ef5350'},{v:250,w:1,c:'#ffd54f'}];
let zcWheelRot=0,zcWheelBusy=false;
function zcBonusState(name){const z=zcp(),k=zcKey(name);if(!z.bonusD[k])z.bonusD[k]={last:'',streak:0,spin:''};return z.bonusD[k];}
function zcBonusReward(streak){return 10+Math.min(streak-1,6)*4+(streak%7===0?50:0);}
function zcBonusAvailable(name){
  if(!name)return false;
  const b=zcBonusState(name),t=zcToday();return b.last!==t||b.spin!==t;
}
function zcBonusClaim(){
  const z=zcp(),name=(z.player||'').trim();if(!name){showToast('Wähle zuerst einen Spieler');return;}
  const b=zcBonusState(name),t=zcToday();if(b.last===t)return;
  b.streak=b.last===zcYesterday()?b.streak+1:1;b.last=t;
  const n=zcBonusReward(b.streak);zcAddCoins(name,n);smSave('zentrale');
  sfx('coin');showToast(`🎁 Tagesbonus: +${n} 🪙 · Serie ${b.streak} Tag${b.streak===1?'':'e'}`,3000);
  zcRenderBonus();if(typeof zcChipUpdate==='function')zcChipUpdate();
}
function zcWheelPick(){
  const tot=ZC_WHEEL.reduce((a,x)=>a+x.w,0);let r=Math.random()*tot;
  for(let i=0;i<ZC_WHEEL.length;i++){r-=ZC_WHEEL[i].w;if(r<=0)return i;}return 0;
}
function zcWheelDraw(cv){
  const c=cv.getContext('2d'),R=cv.width/2,n=ZC_WHEEL.length,sl=Math.PI*2/n;
  c.clearRect(0,0,cv.width,cv.height);
  ZC_WHEEL.forEach((s,i)=>{
    c.beginPath();c.moveTo(R,R);c.arc(R,R,R-4,i*sl-Math.PI/2-sl/2,(i+1)*sl-Math.PI/2-sl/2);c.closePath();c.fillStyle=s.c;c.fill();c.strokeStyle='rgba(255,255,255,0.7)';c.lineWidth=2;c.stroke();
    c.save();c.translate(R,R);c.rotate(i*sl);c.fillStyle='#fff';c.font='bold 17px sans-serif';c.textAlign='center';c.textBaseline='middle';c.shadowColor='rgba(0,0,0,0.5)';c.shadowBlur=3;c.fillText(s.v,0,-R*0.68);c.restore();
  });
  c.beginPath();c.arc(R,R,18,0,Math.PI*2);c.fillStyle='#fff';c.fill();c.fillStyle='#333';c.font='16px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('🪙',R,R+1);
}
function zcWheelSpin(){
  const z=zcp(),name=(z.player||'').trim();if(!name){showToast('Wähle zuerst einen Spieler');return;}
  const b=zcBonusState(name),t=zcToday();if(b.spin===t||zcWheelBusy)return;
  zcWheelBusy=true;b.spin=t;smSave('zentrale'); // sofort sperren (kein Neuladen-Trick)
  const idx=zcWheelPick(),n=ZC_WHEEL.length,sl=360/n,v=ZC_WHEEL[idx].v;
  zcAddCoins(name,v);smSave('zentrale'); // Gewinn sofort gutschreiben, Animation ist nur Show
  zcWheelRot+=360*5+(360-idx*sl)-(zcWheelRot%360);
  const cv=document.getElementById('zc-wheel');if(cv){cv.style.transition='transform 4s cubic-bezier(0.15,0.7,0.1,1)';cv.style.transform=`rotate(${zcWheelRot}deg)`;}
  let tick=0;const ti=setInterval(()=>{sfx('click');if(++tick>14)clearInterval(ti);},260);
  setTimeout(()=>{
    zcWheelBusy=false;
    sfx(v>=50?'rankup':'win');if(v>=50&&typeof smConfetti==='function')smConfetti();
    showToast(`🎡 Glücksrad: +${v} 🪙${v>=100?' – JACKPOT!':''}`,3500);
    zcRenderBonus();if(typeof zcChipUpdate==='function')zcChipUpdate();
  },4200);
}
function zcRenderBonus(keepFocus){
  const wrap=document.getElementById('zc-bonus');if(!wrap)return;
  const z=zcp(),name=(z.player||'').trim(),t=zcToday();
  if(keepFocus&&document.activeElement&&document.activeElement.id==='zc-bonus-input'){const b=document.getElementById('zc-bonus-body');if(b){b.innerHTML=zcBonusBody(name,t);zcBonusWheelInit();return;}}
  wrap.innerHTML=`${zcPlayerInput('zc-bonus-input')}<div id="zc-bonus-body">${zcBonusBody(name,t)}</div>`;
  zcBonusWheelInit();
}
function zcBonusWheelInit(){
  const cv=document.getElementById('zc-wheel');if(!cv)return;
  zcWheelDraw(cv);cv.style.transform=`rotate(${zcWheelRot}deg)`;
}
function zcBonusBody(name,t){
  const b=name?zcBonusState(name):{last:'',streak:0,spin:''};
  const claimed=b.last===t,spun=b.spin===t;
  const nextStreak=claimed?b.streak:(b.last===zcYesterday()?b.streak+1:1);
  const cur=((nextStreak-1)%7)+1,shown=claimed?b.streak:(b.last===zcYesterday()?b.streak:0);
  const days=[1,2,3,4,5,6,7].map(d=>{
    const done=claimed?d<=cur:d<cur,isCur=d===cur&&!claimed,big=d===7;
    return`<div style="flex:1;min-width:0;text-align:center;padding:8px 2px 7px;border-radius:12px;position:relative;background:${done?'linear-gradient(160deg,var(--accent),#ab47bc)':'var(--bg)'};color:${done?'#fff':'var(--text)'};border:1.5px solid ${isCur?'var(--accent)':done?'transparent':'var(--divider)'};${isCur?'animation:zcPassPulse 1.6s ease-in-out infinite;--pc:var(--accent);':''}${!done&&!isCur?'opacity:0.75;':''}"><div style="font-size:9px;opacity:0.85;font-weight:700">Tag ${d}</div><div style="font-size:${big?20:17}px;line-height:1.3">${done?'✓':big?'🎁':'🪙'}</div><div style="font-size:12px;font-weight:800">${zcBonusReward(d)}${big?'+':''}</div></div>`;
  }).join('');
  const nextReward=zcBonusReward(nextStreak);
  const off=claimed||!name;
  return`<style>@keyframes zcPassPulse{0%,100%{box-shadow:0 0 0 0 transparent}50%{box-shadow:0 0 12px 1px var(--pc)}}</style>
    <div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:16px;overflow:hidden;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,0.05)">
      <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:linear-gradient(120deg,#ff9800,#ef5350);color:#fff">
        <div style="font-size:34px;line-height:1">🎁</div>
        <div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9">Tagesbonus</div><div style="font-size:18px;font-weight:800;line-height:1.2">${shown} Tag${shown===1?'':'e'} in Folge 🔥</div></div>
        <div style="text-align:right;flex:none"><div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9">Heute</div><div style="font-size:20px;font-weight:800">${claimed?'✅':'+'+nextReward+' 🪙'}</div></div>
      </div>
      <div style="padding:14px 16px">
        <div style="display:flex;gap:5px;margin-bottom:12px">${days}</div>
        <button class="btn-generate" ${off?'disabled':''} onclick="zcBonusClaim()" style="width:100%;padding:12px;font-size:14px;${off?'opacity:0.5':''}">${claimed?'✅ Heute abgeholt – morgen wieder!':`🎁 Abholen: +${nextReward} 🪙${nextStreak%7===0?' (Wochen-Bonus!)':''}`}</button>
        <div style="font-size:10px;color:var(--text-3);margin-top:8px">Jeder Tag in Folge erhöht den Bonus (bis Tag 7, dort +50 extra). Verpasst du einen Tag, beginnt die Serie neu.</div>
      </div>
    </div>
    <div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:16px;overflow:hidden;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.05)">
      <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:linear-gradient(120deg,#7c4dff,#00bcd4);color:#fff;text-align:left">
        <div style="font-size:34px;line-height:1">🎡</div>
        <div style="flex:1"><div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9">Glücksrad</div><div style="font-size:18px;font-weight:800;line-height:1.2">Einmal pro Tag drehen</div></div>
        <div style="flex:none;font-size:12px;font-weight:700;padding:4px 10px;border-radius:12px;background:rgba(255,255,255,0.22)">${spun?'✅ gedreht':'bereit'}</div>
      </div>
      <div style="padding:16px">
        <div style="position:relative;width:268px;height:280px;margin:0 auto">
          <div style="position:absolute;top:-2px;left:50%;transform:translateX(-50%);font-size:26px;z-index:2;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.5))">🔻</div>
          <canvas id="zc-wheel" width="260" height="260" style="margin-top:14px;border-radius:50%;box-shadow:0 0 0 5px var(--surface),0 0 0 7px var(--accent),0 8px 24px rgba(0,0,0,0.3)"></canvas>
        </div>
        <button class="btn-generate" ${spun||!name?'disabled':''} onclick="zcWheelSpin()" style="margin-top:14px;width:auto;padding:12px 34px;font-size:14px;${spun||!name?'opacity:0.5':''}">${spun?'Heute schon gedreht':'🎡 Drehen'}</button>
        <div style="font-size:10px;color:var(--text-3);margin-top:10px">Gewinne: 5 bis 250 Coins – der Jackpot ist selten!</div>
      </div>
    </div>`;
}

/* ── Start ── */
try{zcSkinApply();zcBgApply();}catch(e){}
