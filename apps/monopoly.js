/* ══════════════════════════════════
   MONOPOLY
══════════════════════════════════ */
const MONO_COLOR_HEX={brown:'#955436',lightblue:'#aae0fa',pink:'#d93a96',orange:'#f7941d',red:'#e6231e',yellow:'#fef200',green:'#1fb25a',darkblue:'#0072bb'};
const MONO_PLAYER_COLORS=['#e53935','#1e88e5','#43a047','#fdd835','#8e24aa','#fb8c00','#00acc1','#6d4c41'];
const MONO_AVATARS=['🐶','🐱','🦊','🐸','🐵','🦁','🐧','🐨','🦄','🐙','🐢','🦉','🐺','🐯','🐮','🐷'];
function monoAvatarFor(p,i){return (p&&p.avatar)||MONO_AVATARS[i%MONO_AVATARS.length];}
const MONO_AI_PERSONALITIES={
  balanced:{label:'Ausgewogen',icon:'⚖️',desc:'Spielt nach Lehrbuch – solide Rücklage, normale Handelsbereitschaft und -angebote.',reserveMult:1,tradeChance:0.4,premiumMult:1},
  aggressive:{label:'Aggressiv',icon:'🔥',desc:'Kauft und baut mit wenig Rücklage, bietet beim Handeln mehr um schnell abzuschließen.',reserveMult:0.4,tradeChance:0.4,premiumMult:1.15},
  cautious:{label:'Vorsichtig',icon:'🛡️',desc:'Hält viel Bargeld zurück, handelt selten und bietet beim Kauf eher wenig.',reserveMult:1.8,tradeChance:0.2,premiumMult:0.85},
  dealmaker:{label:'Händler',icon:'🤝',desc:'Bietet ständig Handel an und ist beim Preis etwas großzügiger.',reserveMult:1,tradeChance:0.75,premiumMult:1.05}
};
function monoAiPersonality(idx){
  const p=monoPlayers[idx];
  return MONO_AI_PERSONALITIES[p&&p.personality]||MONO_AI_PERSONALITIES.balanced;
}
const MONO_TYPE_LABELS={go:'Los',property:'Straße',railroad:'Bahnhof',utility:'Werk',card:'Kartenfeld',tax:'Steuer',jail:'Gefängnis',parking:'Frei Parken',gotojail:'Ins Gefängnis'};
const MONO_DEFAULT_FIELDS=[
{type:'go',name:'Los'},
{type:'property',name:'Badstraße',color:'brown',price:60,rent:[2,10,30,90,160,250],houseCost:50},
{type:'card',deck:'community',name:'Gemeinschaftsfeld'},
{type:'property',name:'Turmstraße',color:'brown',price:60,rent:[4,20,60,180,320,450],houseCost:50},
{type:'tax',name:'Einkommenssteuer',amount:200},
{type:'railroad',name:'Südbahnhof',price:200},
{type:'property',name:'Chausseestraße',color:'lightblue',price:100,rent:[6,30,90,270,400,550],houseCost:50},
{type:'card',deck:'chance',name:'Ereignisfeld'},
{type:'property',name:'Elisenstraße',color:'lightblue',price:100,rent:[6,30,90,270,400,550],houseCost:50},
{type:'property',name:'Poststraße',color:'lightblue',price:120,rent:[8,40,100,300,450,600],houseCost:50},
{type:'jail',name:'Gefängnis / Nur zu Besuch'},
{type:'property',name:'Seestraße',color:'pink',price:140,rent:[10,50,150,450,625,750],houseCost:100},
{type:'utility',name:'Elektrizitätswerk',price:150},
{type:'property',name:'Hafenstraße',color:'pink',price:140,rent:[10,50,150,450,625,750],houseCost:100},
{type:'property',name:'Neue Straße',color:'pink',price:160,rent:[12,60,180,500,700,900],houseCost:100},
{type:'railroad',name:'Westbahnhof',price:200},
{type:'property',name:'Münchener Straße',color:'orange',price:180,rent:[14,70,200,550,750,950],houseCost:100},
{type:'card',deck:'community',name:'Gemeinschaftsfeld'},
{type:'property',name:'Wiener Straße',color:'orange',price:180,rent:[14,70,200,550,750,950],houseCost:100},
{type:'property',name:'Berliner Straße',color:'orange',price:200,rent:[16,80,220,600,800,1000],houseCost:100},
{type:'parking',name:'Frei Parken'},
{type:'property',name:'Theaterstraße',color:'red',price:220,rent:[18,90,250,700,875,1050],houseCost:150},
{type:'card',deck:'chance',name:'Ereignisfeld'},
{type:'property',name:'Museumstraße',color:'red',price:220,rent:[18,90,250,700,875,1050],houseCost:150},
{type:'property',name:'Opernplatz',color:'red',price:240,rent:[20,100,300,750,925,1100],houseCost:150},
{type:'railroad',name:'Nordbahnhof',price:200},
{type:'property',name:'Lessingstraße',color:'yellow',price:260,rent:[22,110,330,800,975,1150],houseCost:150},
{type:'property',name:'Schillerstraße',color:'yellow',price:260,rent:[22,110,330,800,975,1150],houseCost:150},
{type:'utility',name:'Wasserwerk',price:150},
{type:'property',name:'Goethestraße',color:'yellow',price:280,rent:[24,120,360,850,1025,1200],houseCost:150},
{type:'gotojail',name:'Gehe ins Gefängnis'},
{type:'property',name:'Rathausplatz',color:'green',price:300,rent:[26,130,390,900,1100,1275],houseCost:200},
{type:'property',name:'Hauptstraße',color:'green',price:300,rent:[26,130,390,900,1100,1275],houseCost:200},
{type:'card',deck:'community',name:'Gemeinschaftsfeld'},
{type:'property',name:'Bahnhofstraße',color:'green',price:320,rent:[28,150,450,1000,1200,1400],houseCost:200},
{type:'railroad',name:'Hauptbahnhof',price:200},
{type:'card',deck:'chance',name:'Ereignisfeld'},
{type:'property',name:'Parkstraße',color:'darkblue',price:350,rent:[35,175,500,1100,1300,1500],houseCost:200},
{type:'tax',name:'Zusatzsteuer',amount:100},
{type:'property',name:'Schlossallee',color:'darkblue',price:400,rent:[50,200,600,1400,1700,2000],houseCost:200}
];
const MONO_CHANCE_DEFAULT=[
 {text:'Gehe zu $. Ziehe $goMoney€ ein.',fx:{type:'move',to:0}},
 {text:'Rücke vor bis zum $.',fx:{type:'move',to:24}},
 {text:'Rücke vor bis zur $.',fx:{type:'move',to:11}},
 {text:'Rücke vor bis zum nächsten $. Zahle den $multiplier-fachen Mietpreis.',fx:{type:'nearest',kind:'railroad',multiplier:2}},
 {text:'Rücke vor bis zum nächsten $. Ist es unbebaut, kannst du es kaufen. Gehört es einem Mitspieler, zahle das $multiplier-fache des Würfelergebnisses als Miete.',fx:{type:'nearest',kind:'utility',multiplier:10}},
 {text:'Die Bank zahlt dir eine Dividende von $€.',fx:{type:'collect',amount:50}},
 {text:'Du kommst aus dem Gefängnis frei. Diese Karte kannst du behalten.',fx:{type:'getoutofjail'}},
 {text:'Gehe $ Felder zurück.',fx:{type:'moverel',steps:-3}},
 {text:'Gehe direkt ins Gefängnis. Gehe nicht über Los. Ziehe nicht $goMoney€ ein.',fx:{type:'gotojail'}},
 {text:'Du lässt Reparaturen durchführen: Zahle $house€ pro Haus und $hotel€ pro Hotel.',fx:{type:'repairs',house:25,hotel:100}},
 {text:'Zahle eine Strafe von $€.',fx:{type:'pay',amount:15}},
 {text:'Rücke vor bis zum $.',fx:{type:'move',to:5}},
 {text:'Mach einen Spaziergang bis zur $.',fx:{type:'move',to:39}},
 {text:'Du wirst zum Vorsitzenden gewählt. Zahle jedem Mitspieler $€.',fx:{type:'payeach',amount:50}},
 {text:'Dein Baukredit wird fällig. Du erhältst $€.',fx:{type:'collect',amount:150}},
 {text:'Du hast ein Kreuzworträtsel gewonnen. Ziehe $€ ein.',fx:{type:'collect',amount:100}}
];
const MONO_COMMUNITY_DEFAULT=[
 {text:'Gehe zu $. Ziehe $goMoney€ ein.',fx:{type:'move',to:0}},
 {text:'Bankirrtum zu deinen Gunsten. Ziehe $€ ein.',fx:{type:'collect',amount:200}},
 {text:'Arztkosten: Zahle $€.',fx:{type:'pay',amount:50}},
 {text:'Aus dem Verkauf von Wertpapieren erhältst du $€.',fx:{type:'collect',amount:50}},
 {text:'Du kommst aus dem Gefängnis frei. Diese Karte kannst du behalten.',fx:{type:'getoutofjail'}},
 {text:'Gehe direkt ins Gefängnis. Gehe nicht über Los. Ziehe nicht $goMoney€ ein.',fx:{type:'gotojail'}},
 {text:'Dein Sparvertrag wird fällig. Du erhältst $€.',fx:{type:'collect',amount:100}},
 {text:'Steuerrückzahlung: Ziehe $€ ein.',fx:{type:'collect',amount:20}},
 {text:'Du hast Geburtstag. Jeder Mitspieler schenkt dir $€.',fx:{type:'collectfromeach',amount:10}},
 {text:'Deine Lebensversicherung wird fällig. Ziehe $€ ein.',fx:{type:'collect',amount:100}},
 {text:'Krankenhauskosten: Zahle $€.',fx:{type:'pay',amount:100}},
 {text:'Schulgebühren: Zahle $€.',fx:{type:'pay',amount:150}},
 {text:'Du erhältst ein Beraterhonorar von $€.',fx:{type:'collect',amount:25}},
 {text:'Straßenausbesserung: Zahle $house€ pro Haus und $hotel€ pro Hotel.',fx:{type:'repairs',house:40,hotel:115}},
 {text:'Du hast beim Schönheitswettbewerb den 2. Platz gewonnen. Ziehe $€ ein.',fx:{type:'collect',amount:10}},
 {text:'Du erbst $€.',fx:{type:'collect',amount:100}}
];
let monoFields=[];
let monoPlayersSetup=[];
let monoPlayers=[];
let monoOwner={};
let monoHouses={};
let monoMortgaged={};
let monoTurn=0;
let monoDoublesStreak=0;
let monoLastDice=[1,1];
let monoLog=[];
let monoCanRoll=true;
let monoCanEndTurn=false;
let monoModalType=null;
let monoModalField=null;
let monoPendingCard=null;
let monoPendingDebt=null;
let monoGameOver=false;
let monoAutoRoll=false;
let monoAutoRollTimer=null;
let monoTrade={with:null,offerProps:[],offerMoney:0,reqProps:[],reqMoney:0};
let monoNetWorthHistory=[];
let monoStats=[];
let monoBankruptOrder=[];
let monoMilestonesShown=new Set();
function monoStatsInit(){
  monoStats=monoPlayers.map(()=>({passedGo:0,cardsDrawn:0,housesBuilt:0,jailVisits:0,paidToPlayers:0,collectedFromPlayers:0,peakMoney:0,peakNetWorth:0,doublesRolled:0,tradesCompleted:0,loansTaken:0,tripleDoubles:0,biggestRentPaid:0,biggestRentCollected:0,loansRepaid:0,totalRolls:0}));
}
function monoStatBump(idx,key,amount){
  if(!monoStats[idx])return;
  monoStats[idx][key]=(monoStats[idx][key]||0)+amount;
}
function monoStatMax(idx,key,value){
  if(!monoStats[idx])return;
  if(value>(monoStats[idx][key]||0))monoStats[idx][key]=value;
}
let monoGoMoney=200;
let monoChanceCards=[],monoCommunityCards=[];
let monoRules={
  startMoney:1500,
  goMoney:200,
  aiDifficulty:'hard',
  adaptiveAI:false,
  doublesBonusRoll:true,
  doublesToJail:true,
  doubleRentUnbuiltMonopoly:true,
  evenBuildRule:true,
  receiveMultiplier:1,
  payMultiplier:1,
  freeParkingPot:false,
  loansEnabled:false,
  loanMaxTurns:10,
  loanInterestPercent:10,
  maxLoansPerPlayer:0,
  aiMonopolyPremium:1.5,
  bankruptToBank:true,
  undoEnabled:false,
  aiTradeOffers:false,
  teamsEnabled:false
};
let monoParkingPot=0;
let monoLoans=[];
let monoLoanAmount=100;
const MONO_RULE_TOGGLES=[
  {k:'doublesBonusRoll',label:'Pasch = nochmal würfeln',desc:'Bei einem Pasch darf man direkt noch einmal würfeln.'},
  {k:'doublesToJail',label:'3× Pasch in Folge → Gefängnis',desc:'Wer dreimal hintereinander einen Pasch würfelt, muss ins Gefängnis.'},
  {k:'doubleRentUnbuiltMonopoly',label:'Doppelte Miete bei unbebautem Straßenmonopol',desc:'Gehören einem Spieler alle Straßen einer Farbe ohne Häuser, wird die Miete verdoppelt.'},
  {k:'evenBuildRule',label:'Gleichmäßiger Hausbau',desc:'Innerhalb eines Straßenmonopols muss gleichmäßig gebaut werden.'},
  {k:'freeParkingPot',label:'Frei Parken-Jackpot',desc:'Alle an die Bank gezahlten Beträge (Steuern, Kartenstrafen, Gefängnis-Kaution – keine Miete) sammeln sich in einem Topf. Wer auf „Frei Parken" landet, kassiert den gesamten Topf.'},
  {k:'bankruptToBank',label:'Bankrott: Besitz verfällt an die Bank',desc:'Grundstücke eines bankrotten Spielers gehen immer an die Bank zurück, statt an den Gläubiger-Spieler. Deaktiviert: der Gläubiger erbt bei Mietschulden den Besitz (klassische Regel).'},
  {k:'undoEnabled',label:'Zug rückgängig machen',desc:'Zeigt einen Button, mit dem man den aktuellen Zug auf den Zugbeginn zurücksetzen kann (vor dem Würfeln). Frühere, bereits beendete Züge können nicht rückgängig gemacht werden.'},
  {k:'aiTradeOffers',label:'KI macht Handelsvorschläge',desc:'Die KI kann während ihres Zuges von sich aus ein Kaufangebot für ein Grundstück machen, das ihr Monopol vervollständigt – an dich oder an andere KI-Spieler.'}
];
const MONO_RULE_PRESETS={
  classic:{label:'Klassisch',rules:{startMoney:1500,goMoney:200,aiDifficulty:'hard',doublesBonusRoll:true,doublesToJail:true,doubleRentUnbuiltMonopoly:true,evenBuildRule:true,receiveMultiplier:1,payMultiplier:1,freeParkingPot:false,loansEnabled:false,loanMaxTurns:10,loanInterestPercent:10,maxLoansPerPlayer:0,aiMonopolyPremium:1.5,bankruptToBank:true,undoEnabled:false,aiTradeOffers:false,teamsEnabled:false}},
  fast:{label:'Schnelles Spiel',rules:{doublesBonusRoll:true,doublesToJail:false,doubleRentUnbuiltMonopoly:true,evenBuildRule:false,receiveMultiplier:1.5,payMultiplier:1,freeParkingPot:false}},
  chaos:{label:'Chaos',rules:{doublesBonusRoll:true,doublesToJail:false,doubleRentUnbuiltMonopoly:true,evenBuildRule:false,receiveMultiplier:2,payMultiplier:2,freeParkingPot:true}}
};
const MONO_FX_TYPES=[
  {v:'collect',label:'Geld erhalten',params:[{k:'amount',label:'Betrag (€)'}]},
  {v:'pay',label:'Geld zahlen',params:[{k:'amount',label:'Betrag (€)'}]},
  {v:'payeach',label:'An jeden Mitspieler zahlen',params:[{k:'amount',label:'Betrag pro Spieler (€)'}]},
  {v:'collectfromeach',label:'Von jedem Mitspieler erhalten',params:[{k:'amount',label:'Betrag pro Spieler (€)'}]},
  {v:'move',label:'Vorrücken auf Feld',params:[{k:'to',label:'Feldnummer (0-39)'}]},
  {v:'moverel',label:'Felder vor/zurück',params:[{k:'steps',label:'Schritte (neg.=zurück)'}]},
  {v:'nearest',label:'Zum nächsten Bahnhof/Werk',params:[{k:'kind',label:'Art',type:'select',options:[['railroad','Bahnhof'],['utility','Werk']]},{k:'multiplier',label:'Mietfaktor'}]},
  {v:'repairs',label:'Reparaturen (pro Haus/Hotel)',params:[{k:'house',label:'€ pro Haus'},{k:'hotel',label:'€ pro Hotel'}]},
  {v:'getoutofjail',label:'Freikarte Gefängnis',params:[]},
  {v:'gotojail',label:'Ins Gefängnis',params:[]},
  {v:'skipturn',label:'Runde(n) aussetzen',params:[{k:'turns',label:'Anzahl Runden'}]},
  {v:'payperproperty',label:'Zahlen pro Grundstück',params:[{k:'amount',label:'Betrag pro Grundstück (€)'}]},
  {v:'collectperproperty',label:'Erhalten pro Grundstück',params:[{k:'amount',label:'Betrag pro Grundstück (€)'}]},
  {v:'multiplymoney',label:'Vermögen multiplizieren',params:[{k:'factor',label:'Faktor (2=verdoppeln, 0.5=halbieren)'}]},
  {v:'moverandom',label:'Zufälliges Feld',params:[]},
  {v:'stealproperty',label:'Grundstück stehlen',params:[]},
  {v:'doublerentnext',label:'Nächste Miete verdoppeln',params:[]},
  {v:'gifthouse',label:'Gratis-Haus',params:[]},
  {v:'destroyhouse',label:'Haus zerstören',params:[]}
];

function monoInit(){
  monoLoadFields();monoLoadCards();monoLoadRules();
  if(!monoPlayersSetup.length){monoPlayersSetup=[{name:'Gast',color:MONO_PLAYER_COLORS[0],avatar:MONO_AVATARS[0],isAI:false,team:null},{name:'Gast 2',color:MONO_PLAYER_COLORS[1],avatar:MONO_AVATARS[1],isAI:false,team:null}];
    try{if(typeof zcp==='function'&&zcp().player)zcPrefillGames(zcp().player);}catch(e){}}
  monoRenderPlayerSetup();
  let restored=false;
  if(!monoPlayers.length){restored=monoLoadGame();}
  if(monoPlayers.length&&!monoGameOver){
    monoShowView('setup');
    const sp=document.getElementById('mono-setup-panel');if(sp)sp.style.display='none';
    const gp=document.getElementById('mono-game-panel');if(gp)gp.style.display='block';
    monoRenderAll();
    if(restored)showToast('Spielstand wiederhergestellt ✓');
  } else {
    monoShowView('setup');
    const sp=document.getElementById('mono-setup-panel');if(sp)sp.style.display='block';
    const gp=document.getElementById('mono-game-panel');if(gp)gp.style.display='none';
  }
  monoUpdateEditTabsState();
}
function monoLoadFields(){
  try{const s=localStorage.getItem('zf_mono_fields');monoFields=s?JSON.parse(s):JSON.parse(JSON.stringify(MONO_DEFAULT_FIELDS));}
  catch(e){monoFields=JSON.parse(JSON.stringify(MONO_DEFAULT_FIELDS));}
  if(!Array.isArray(monoFields)||monoFields.length!==40)monoFields=JSON.parse(JSON.stringify(MONO_DEFAULT_FIELDS));
}
function monoSaveFields(){localStorage.setItem('zf_mono_fields',JSON.stringify(monoFields));}
function monoLoadCards(){
  try{const s=localStorage.getItem('zf_mono_chance');monoChanceCards=s?JSON.parse(s):JSON.parse(JSON.stringify(MONO_CHANCE_DEFAULT));}
  catch(e){monoChanceCards=JSON.parse(JSON.stringify(MONO_CHANCE_DEFAULT));}
  try{const s=localStorage.getItem('zf_mono_community');monoCommunityCards=s?JSON.parse(s):JSON.parse(JSON.stringify(MONO_COMMUNITY_DEFAULT));}
  catch(e){monoCommunityCards=JSON.parse(JSON.stringify(MONO_COMMUNITY_DEFAULT));}
  if(!Array.isArray(monoChanceCards))monoChanceCards=JSON.parse(JSON.stringify(MONO_CHANCE_DEFAULT));
  if(!Array.isArray(monoCommunityCards))monoCommunityCards=JSON.parse(JSON.stringify(MONO_COMMUNITY_DEFAULT));
}
function monoSaveCards(){localStorage.setItem('zf_mono_chance',JSON.stringify(monoChanceCards));localStorage.setItem('zf_mono_community',JSON.stringify(monoCommunityCards));}
function monoLoadRules(){
  try{const s=localStorage.getItem('zf_mono_rules');if(s)monoRules=Object.assign({},monoRules,JSON.parse(s));}catch(e){}
}
function monoSaveRules(){localStorage.setItem('zf_mono_rules',JSON.stringify(monoRules));}
function monoGive(p,amount){const actual=Math.round(amount*monoRules.receiveMultiplier);p.money+=actual;return actual;}
function monoTake(p,amount){const actual=Math.round(amount*monoRules.payMultiplier);p.money-=actual;return actual;}
function monoGameActive(){return monoPlayers.length>0&&!monoGameOver;}
function monoUpdateEditTabsState(){
  const active=monoGameActive();
  ['mono-tab-editor','mono-tab-cards','mono-tab-rules'].forEach(id=>{
    const t=document.getElementById(id);if(!t)return;
    t.style.opacity=active?'0.4':'';t.style.cursor=active?'not-allowed':'';
    t.title=active?'Nur vor dem Spielstart verfügbar':'';
  });
}
let monoCurrentView='setup';
function monoIsVisible(){
  const screen=document.getElementById('screen-monopoly');
  return !!screen&&screen.classList.contains('active')&&monoCurrentView==='setup';
}
function monoShowView(v){
  if(typeof monoMetaShowView==='function'&&monoMetaShowView(v)){monoUpdateEditTabsState();return;}
  if((v==='editor'||v==='cards'||v==='rules')&&monoGameActive()){
    showToast('Nur vor dem Spielstart bearbeitbar');
    v='setup';
  }
  monoCurrentView=v;
  document.getElementById('mono-tab-setup')?.classList.toggle('active',v==='setup');
  document.getElementById('mono-tab-editor')?.classList.toggle('active',v==='editor');
  document.getElementById('mono-tab-cards')?.classList.toggle('active',v==='cards');
  document.getElementById('mono-tab-rules')?.classList.toggle('active',v==='rules');
  document.getElementById('mono-tab-badges')?.classList.toggle('active',v==='badges');
  const vs=document.getElementById('mono-view-setup');if(vs)vs.style.display=v==='setup'?'block':'none';
  const ve=document.getElementById('mono-view-editor');if(ve)ve.style.display=v==='editor'?'block':'none';
  const vc=document.getElementById('mono-view-cards');if(vc)vc.style.display=v==='cards'?'block':'none';
  const vr=document.getElementById('mono-view-rules');if(vr)vr.style.display=v==='rules'?'block':'none';
  const vb=document.getElementById('mono-view-badges');if(vb)vb.style.display=v==='badges'?'block':'none';
  if(v==='editor')monoEditRender();
  if(v==='cards')monoRenderCardsEditor();
  if(v==='rules')monoRenderRulesEditor();
  if(v==='badges')monoRenderBadgesTab();
  monoUpdateEditTabsState();
}

/* ── Editor ── */
function monoEditReset(){
  appConfirm('Brett auf Original-Monopoly zurücksetzen?',()=>{
    monoFields=JSON.parse(JSON.stringify(MONO_DEFAULT_FIELDS));
    monoSaveFields();monoEditRender();showToast('Brett zurückgesetzt ✓');
  });
}
function monoEditRender(){
  const wrap=document.getElementById('mono-editor-list');if(!wrap)return;
  wrap.innerHTML=monoFields.map((f,i)=>monoEditRowHtml(i)).join('');
}
function monoEditRowHtml(i){
  const f=monoFields[i];
  const typeOpts=Object.keys(MONO_TYPE_LABELS).map(t=>`<option value="${t}" ${f.type===t?'selected':''}>${MONO_TYPE_LABELS[t]}</option>`).join('');
  let extra='';
  const inpStyle='padding:5px;font-size:11px;background:var(--bg);border:0.5px solid var(--divider);border-radius:6px;color:var(--text)';
  if(f.type==='property'){
    const colorOpts=Object.keys(MONO_COLOR_HEX).map(c=>`<option value="${c}" ${f.color===c?'selected':''}>${c}</option>`).join('');
    const rentLabels=['Basis','1 Haus','2 Häuser','3 Häuser','4 Häuser','Hotel'];
    extra=`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;padding-left:26px">
      <select onchange="monoEditSet(${i},'color',this.value)" style="${inpStyle}">${colorOpts}</select>
      <input type="number" value="${f.price||0}" onchange="monoEditSet(${i},'price',+this.value)" title="Preis" style="width:60px;${inpStyle}"/>
      ${rentLabels.map((lbl,ri)=>`<input type="number" value="${(f.rent&&f.rent[ri])||0}" onchange="monoEditSetRent(${i},${ri},+this.value)" title="Miete: ${lbl}" style="width:52px;${inpStyle}"/>`).join('')}
      <input type="number" value="${f.houseCost||0}" onchange="monoEditSet(${i},'houseCost',+this.value)" title="Preis pro Haus" style="width:64px;${inpStyle}"/>
    </div>`;
  } else if(f.type==='railroad'||f.type==='utility'){
    extra=`<div style="margin-top:6px;padding-left:26px"><input type="number" value="${f.price||0}" onchange="monoEditSet(${i},'price',+this.value)" title="Preis" style="width:70px;${inpStyle}"/></div>`;
  } else if(f.type==='tax'){
    extra=`<div style="margin-top:6px;padding-left:26px"><input type="number" value="${f.amount||0}" onchange="monoEditSet(${i},'amount',+this.value)" title="Betrag" style="width:70px;${inpStyle}"/></div>`;
  } else if(f.type==='card'){
    extra=`<div style="margin-top:6px;padding-left:26px"><select onchange="monoEditSet(${i},'deck',this.value)" style="${inpStyle}">
      <option value="chance" ${f.deck==='chance'?'selected':''}>Ereignis</option>
      <option value="community" ${f.deck==='community'?'selected':''}>Gemeinschaft</option>
    </select></div>`;
  }
  return `<div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:8px 10px">
    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
      <span style="font-size:11px;color:var(--text-3);width:20px;flex-shrink:0">${i}</span>
      <select onchange="monoEditSetType(${i},this.value)" style="${inpStyle}">${typeOpts}</select>
      <input type="text" value="${escHtml(f.name||'')}" onchange="monoEditSet(${i},'name',this.value)" style="flex:1;min-width:120px;padding:5px 8px;font-size:12px;background:var(--bg);border:0.5px solid var(--divider);border-radius:6px;color:var(--text)"/>
    </div>
    ${extra}
  </div>`;
}
function monoEditSet(i,key,val){monoFields[i][key]=val;monoSaveFields();}
function monoEditSetRent(i,idx,val){if(!monoFields[i].rent)monoFields[i].rent=[0,0,0,0,0,0];monoFields[i].rent[idx]=val;monoSaveFields();}
function monoEditSetType(i,type){
  const name=monoFields[i].name;
  if(type==='property')monoFields[i]={type,name,color:'brown',price:60,rent:[2,10,30,90,160,250],houseCost:50};
  else if(type==='railroad'||type==='utility')monoFields[i]={type,name,price:type==='railroad'?200:150};
  else if(type==='tax')monoFields[i]={type,name,amount:100};
  else if(type==='card')monoFields[i]={type,name,deck:'chance'};
  else monoFields[i]={type,name};
  monoSaveFields();monoEditRender();
}

/* ── Karten-Editor ── */
function monoCardsArr(deck){return deck==='chance'?monoChanceCards:monoCommunityCards;}
function monoCardSteps(c){return Array.isArray(c.fx)?c.fx:[c.fx];}
/* ── Karten-Skriptsprache ── */
const MONO_SCRIPT_COMMANDS=[
  {verb:'MOVE_TO',fx:'move',hint:'MOVE_TO field-name-or-index — move the player to a specific field'},
  {verb:'MOVE',fx:'moverel',hint:'MOVE steps — move the player forward/back by N fields (negative = back)'},
  {verb:'NEAREST',fx:'nearest',hint:'NEAREST RAILROAD|UTILITY multiplier — advance to the nearest one, apply a rent multiplier'},
  {verb:'COLLECT',fx:'collect',hint:'COLLECT amount — receive money from the bank'},
  {verb:'PAY',fx:'pay',hint:'PAY amount — pay money to the bank'},
  {verb:'PAY_EACH',fx:'payeach',hint:'PAY_EACH amount — pay every other player'},
  {verb:'COLLECT_EACH',fx:'collectfromeach',hint:'COLLECT_EACH amount — collect from every other player'},
  {verb:'REPAIRS',fx:'repairs',hint:'REPAIRS perHouse perHotel — pay for repairs based on owned houses/hotels'},
  {verb:'JAIL_FREE',fx:'getoutofjail',hint:'JAIL_FREE — receive a get-out-of-jail-free card'},
  {verb:'GO_TO_JAIL',fx:'gotojail',hint:'GO_TO_JAIL — send the player directly to jail'},
  {verb:'SKIP_TURN',fx:'skipturn',hint:'SKIP_TURN turns — the player misses the next N turns'},
  {verb:'PAY_PER_PROPERTY',fx:'payperproperty',hint:'PAY_PER_PROPERTY amount — pay amount × number of owned properties/railroads/utilities to the bank'},
  {verb:'COLLECT_PER_PROPERTY',fx:'collectperproperty',hint:'COLLECT_PER_PROPERTY amount — receive amount × number of owned properties/railroads/utilities from the bank'},
  {verb:'MULTIPLY_MONEY',fx:'multiplymoney',hint:'MULTIPLY_MONEY factor — multiply current money by factor (2 = double, 0.5 = half)'},
  {verb:'TELEPORT',fx:'moverandom',hint:'TELEPORT — move to a random field on the board'},
  {verb:'STEAL_PROPERTY',fx:'stealproperty',hint:'STEAL_PROPERTY — take a random property/railroad/utility from another player (houses on it are lost)'},
  {verb:'DOUBLE_RENT_NEXT',fx:'doublerentnext',hint:'DOUBLE_RENT_NEXT — the next rent this player collects is doubled'},
  {verb:'GIFT_HOUSE',fx:'gifthouse',hint:'GIFT_HOUSE — build one house for free on a random eligible property you own'},
  {verb:'DESTROY_HOUSE',fx:'destroyhouse',hint:'DESTROY_HOUSE — destroy one house on a random property owned by another player'}
];
function monoScriptArgsToStep(fxType,args){
  if(fxType==='move'){
    if(args.length!==1)throw new Error('MOVE_TO needs exactly 1 argument (field name or index)');
    let to;
    if(/^\d+$/.test(args[0])){to=+args[0];if(to<0||to>39)throw new Error('field index must be 0-39');}
    else{
      const idx=monoFields.findIndex(f=>f.name.toLowerCase()===args[0].toLowerCase());
      if(idx<0)throw new Error(`unknown field "${args[0]}"`);
      to=idx;
    }
    return{type:'move',to};
  }
  if(fxType==='moverel'){
    if(args.length!==1)throw new Error('MOVE needs exactly 1 argument (number of steps)');
    const n=+args[0];if(!Number.isFinite(n))throw new Error('steps must be a number');
    return{type:'moverel',steps:n};
  }
  if(fxType==='nearest'){
    if(args.length!==2)throw new Error('NEAREST needs 2 arguments: RAILROAD|UTILITY multiplier');
    const kindWord=args[0].toUpperCase();
    const kind=kindWord==='RAILROAD'?'railroad':kindWord==='UTILITY'?'utility':null;
    if(!kind)throw new Error('first argument must be RAILROAD or UTILITY');
    const mult=+args[1];if(!Number.isFinite(mult))throw new Error('multiplier must be a number');
    return{type:'nearest',kind,multiplier:mult};
  }
  if(fxType==='collect'||fxType==='pay'||fxType==='payeach'||fxType==='collectfromeach'){
    if(args.length!==1)throw new Error(MONO_SCRIPT_COMMANDS.find(c=>c.fx===fxType).verb+' needs exactly 1 argument (amount)');
    const amt=+args[0];if(!Number.isFinite(amt))throw new Error('amount must be a number');
    return{type:fxType,amount:amt};
  }
  if(fxType==='repairs'){
    if(args.length!==2)throw new Error('REPAIRS needs 2 arguments: perHouse perHotel');
    const h=+args[0],ho=+args[1];
    if(!Number.isFinite(h)||!Number.isFinite(ho))throw new Error('amounts must be numbers');
    return{type:'repairs',house:h,hotel:ho};
  }
  if(fxType==='getoutofjail')return{type:'getoutofjail'};
  if(fxType==='gotojail')return{type:'gotojail'};
  if(fxType==='skipturn'){
    if(args.length!==1)throw new Error('SKIP_TURN needs exactly 1 argument (number of turns)');
    const n=+args[0];if(!Number.isFinite(n)||n<1||!Number.isInteger(n))throw new Error('turns must be a positive whole number');
    return{type:'skipturn',turns:n};
  }
  if(fxType==='payperproperty'||fxType==='collectperproperty'){
    if(args.length!==1)throw new Error(MONO_SCRIPT_COMMANDS.find(c=>c.fx===fxType).verb+' needs exactly 1 argument (amount)');
    const amt=+args[0];if(!Number.isFinite(amt))throw new Error('amount must be a number');
    return{type:fxType,amount:amt};
  }
  if(fxType==='multiplymoney'){
    if(args.length!==1)throw new Error('MULTIPLY_MONEY needs exactly 1 argument (factor)');
    const f=+args[0];if(!Number.isFinite(f)||f<0)throw new Error('factor must be a non-negative number');
    return{type:'multiplymoney',factor:f};
  }
  if(fxType==='moverandom')return{type:'moverandom'};
  if(fxType==='stealproperty')return{type:'stealproperty'};
  if(fxType==='doublerentnext')return{type:'doublerentnext'};
  if(fxType==='gifthouse')return{type:'gifthouse'};
  if(fxType==='destroyhouse')return{type:'destroyhouse'};
  throw new Error('unsupported command');
}
function monoParseScriptLine(line,lineNo){
  const trimmed=line.trim();
  if(!trimmed||trimmed.startsWith('#'))return{skip:true};
  const parts=trimmed.match(/"[^"]*"|\S+/g)||[];
  const verb=parts[0].toUpperCase();
  const cmd=MONO_SCRIPT_COMMANDS.find(c=>c.verb===verb);
  if(!cmd)return{error:`Line ${lineNo}: unknown command "${parts[0]}"`};
  const args=parts.slice(1).map(a=>a.replace(/^"|"$/g,''));
  try{return{step:monoScriptArgsToStep(cmd.fx,args)};}
  catch(e){return{error:`Line ${lineNo}: ${e.message}`};}
}
function monoParseScript(text){
  const lines=(text||'').split('\n');
  const steps=[];const errors=[];
  lines.forEach((line,idx)=>{
    const res=monoParseScriptLine(line,idx+1);
    if(res.skip)return;
    if(res.error)errors.push(res.error);
    else steps.push(res.step);
  });
  if(!errors.length&&!steps.length)errors.push('At least one command is required.');
  return{steps,errors};
}
function monoStepToScriptLine(step){
  if(step.type==='move'){
    const name=monoFields[step.to]&&monoFields[step.to].name;
    return `MOVE_TO ${name?'"'+name+'"':step.to}`;
  }
  if(step.type==='moverel')return `MOVE ${step.steps}`;
  if(step.type==='nearest')return `NEAREST ${(step.kind||'').toUpperCase()} ${step.multiplier}`;
  if(step.type==='collect')return `COLLECT ${step.amount}`;
  if(step.type==='pay')return `PAY ${step.amount}`;
  if(step.type==='payeach')return `PAY_EACH ${step.amount}`;
  if(step.type==='collectfromeach')return `COLLECT_EACH ${step.amount}`;
  if(step.type==='repairs')return `REPAIRS ${step.house} ${step.hotel}`;
  if(step.type==='getoutofjail')return 'JAIL_FREE';
  if(step.type==='gotojail')return 'GO_TO_JAIL';
  if(step.type==='skipturn')return `SKIP_TURN ${step.turns}`;
  if(step.type==='payperproperty')return `PAY_PER_PROPERTY ${step.amount}`;
  if(step.type==='collectperproperty')return `COLLECT_PER_PROPERTY ${step.amount}`;
  if(step.type==='multiplymoney')return `MULTIPLY_MONEY ${step.factor}`;
  if(step.type==='moverandom')return 'TELEPORT';
  if(step.type==='stealproperty')return 'STEAL_PROPERTY';
  if(step.type==='doublerentnext')return 'DOUBLE_RENT_NEXT';
  if(step.type==='gifthouse')return 'GIFT_HOUSE';
  if(step.type==='destroyhouse')return 'DESTROY_HOUSE';
  return '';
}
function monoStepsToScript(steps){return steps.map(monoStepToScriptLine).join('\n');}
let monoCardEditorMode={};
let monoCardScriptDraft={};
function monoCardModeKey(deck,i){return deck+'-'+i;}
function monoCardSetMode(deck,i,mode){
  const key=monoCardModeKey(deck,i);
  const c=monoCardsArr(deck)[i];
  if(mode==='script')monoCardScriptDraft[key]=monoStepsToScript(monoCardSteps(c));
  monoCardEditorMode[key]=mode;
  monoRenderCardsEditor();
}
function monoCardHintId(deck,i){return `mono-card-hint-${deck}-${i}`;}
function monoCardScriptErrId(deck,i){return `mono-card-scripterr-${deck}-${i}`;}
function monoCardScriptInput(deck,i,val){
  const key=monoCardModeKey(deck,i);
  monoCardScriptDraft[key]=val;
  const{steps,errors}=monoParseScript(val);
  const errEl=document.getElementById(monoCardScriptErrId(deck,i));
  if(errors.length){
    if(errEl){errEl.innerHTML=errors.map(e=>escHtml(e)).join('<br>');errEl.style.display='block';}
  } else {
    if(errEl){errEl.innerHTML='';errEl.style.display='none';}
    const c=monoCardsArr(deck)[i];
    c.fx=steps;
    monoSaveCards();
    monoCardUpdatePreview(deck,i);
    const hintEl=document.getElementById(monoCardHintId(deck,i));
    if(hintEl)hintEl.innerHTML=monoCardMacroHint(c);
  }
}
function monoCardScriptHtml(deck,i,c){
  const key=monoCardModeKey(deck,i);
  const draft=monoCardScriptDraft[key]!==undefined?monoCardScriptDraft[key]:monoStepsToScript(monoCardSteps(c));
  const{errors}=monoParseScript(draft);
  return `<textarea oninput="monoCardScriptInput('${deck}',${i},this.value)" spellcheck="false" style="width:100%;padding:8px;background:var(--surface);border:0.5px solid var(--divider);border-radius:6px;color:var(--text);font-size:12px;font-family:monospace;resize:vertical;min-height:76px;margin-bottom:4px;box-sizing:border-box;white-space:pre">${escHtml(draft)}</textarea>
    <div id="${monoCardScriptErrId(deck,i)}" style="font-size:11px;color:var(--danger);margin-bottom:6px;${errors.length?'':'display:none'}">${errors.map(e=>escHtml(e)).join('<br>')}</div>
    <details style="margin-bottom:8px">
      <summary style="font-size:10px;color:var(--text-3);cursor:pointer">Command reference</summary>
      <div style="font-size:10px;color:var(--text-3);margin-top:4px;line-height:1.7;font-family:monospace">${MONO_SCRIPT_COMMANDS.map(c=>escHtml(c.hint)).join('<br>')}</div>
    </details>`;
}
function monoCardSetText(deck,i,val){monoCardsArr(deck)[i].text=val;monoSaveCards();monoCardUpdatePreview(deck,i);}
function monoCardSetFxType(deck,i,stepIdx,type){
  const c=monoCardsArr(deck)[i];
  const steps=monoCardSteps(c);
  const spec=MONO_FX_TYPES.find(t=>t.v===type);
  const step={type};
  spec.params.forEach(p=>{step[p.k]=p.type==='select'?p.options[0][0]:0;});
  steps[stepIdx]=step;
  c.fx=steps;
  monoSaveCards();monoRenderCardsEditor();
}
function monoCardSetFxParam(deck,i,stepIdx,key,val){
  const c=monoCardsArr(deck)[i];
  const steps=monoCardSteps(c);
  const step=steps[stepIdx];
  const spec=MONO_FX_TYPES.find(t=>t.v===step.type);
  const paramSpec=spec&&spec.params.find(p=>p.k===key);
  step[key]=paramSpec&&paramSpec.type==='select'?val:(+val||0);
  c.fx=steps;
  monoSaveCards();monoCardUpdatePreview(deck,i);
}
function monoCardAddStep(deck,i){
  const c=monoCardsArr(deck)[i];
  const steps=monoCardSteps(c);
  steps.push({type:'collect',amount:0});
  c.fx=steps;
  monoSaveCards();monoRenderCardsEditor();
}
function monoCardRemoveStep(deck,i,stepIdx){
  const c=monoCardsArr(deck)[i];
  const steps=monoCardSteps(c);
  if(steps.length<=1)return;
  steps.splice(stepIdx,1);
  c.fx=steps;
  monoSaveCards();monoRenderCardsEditor();
}
function monoCardDelete(deck,i){
  monoCardsArr(deck).splice(i,1);monoSaveCards();monoRenderCardsEditor();
}
function monoCardAdd(deck){
  monoCardsArr(deck).push({text:'Neue Karte: Ziehe $€ ein.',fx:{type:'collect',amount:0}});
  monoSaveCards();monoRenderCardsEditor();
}
function monoCardsReset(){
  appConfirm('Alle Karten auf Original zurücksetzen?',()=>{
    monoChanceCards=JSON.parse(JSON.stringify(MONO_CHANCE_DEFAULT));
    monoCommunityCards=JSON.parse(JSON.stringify(MONO_COMMUNITY_DEFAULT));
    monoSaveCards();monoRenderCardsEditor();showToast('Karten zurückgesetzt ✓');
  });
}
function monoCardStepHtml(deck,i,stepIdx,step,total){
  const spec=MONO_FX_TYPES.find(t=>t.v===step.type)||MONO_FX_TYPES[0];
  const paramsHtml=spec.params.map(p=>{
    const val=step[p.k]!==undefined?step[p.k]:'';
    if(p.type==='select'){
      return `<label style="display:flex;flex-direction:column;gap:2px;font-size:11px;color:var(--text-3)">${p.label}
        <select onchange="monoCardSetFxParam('${deck}',${i},${stepIdx},'${p.k}',this.value)" style="padding:5px;background:var(--bg);border:0.5px solid var(--divider);border-radius:6px;color:var(--text)">
          ${p.options.map(([ov,ol])=>`<option value="${ov}" ${val===ov?'selected':''}>${ol}</option>`).join('')}
        </select></label>`;
    }
    return `<label style="display:flex;flex-direction:column;gap:2px;font-size:11px;color:var(--text-3)">${p.label}
      <input type="number" value="${val}" oninput="monoCardSetFxParam('${deck}',${i},${stepIdx},'${p.k}',this.value)" style="width:90px;padding:5px;background:var(--bg);border:0.5px solid var(--divider);border-radius:6px;color:var(--text)"/></label>`;
  }).join('');
  return `<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;background:var(--surface);border:0.5px solid var(--divider);border-radius:8px;padding:8px;margin-bottom:6px">
    <label style="display:flex;flex-direction:column;gap:2px;font-size:11px;color:var(--text-3);font-weight:700">Schritt ${stepIdx+1}
      <select onchange="monoCardSetFxType('${deck}',${i},${stepIdx},this.value)" style="padding:5px;background:var(--bg);border:0.5px solid var(--divider);border-radius:6px;color:var(--text)">
        ${MONO_FX_TYPES.map(t=>`<option value="${t.v}" ${t.v===step.type?'selected':''}>${t.label}</option>`).join('')}
      </select></label>
    ${paramsHtml}
    ${total>1?`<button class="timer-btn" onclick="monoCardRemoveStep('${deck}',${i},${stepIdx})" title="Schritt entfernen" style="padding:5px 9px;font-size:11px;margin-left:auto">✕</button>`:''}
  </div>`;
}
function monoCardRowHtml(deck,i,c){
  const steps=monoCardSteps(c);
  const mode=monoCardEditorMode[monoCardModeKey(deck,i)]||'blueprint';
  return `<div style="background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;padding:10px;margin-bottom:8px">
    <textarea oninput="monoCardSetText('${deck}',${i},this.value)" style="width:100%;padding:6px;background:var(--surface);border:0.5px solid var(--divider);border-radius:6px;color:var(--text);font-size:12px;resize:vertical;min-height:38px;margin-bottom:4px;box-sizing:border-box">${escHtml(c.text)}</textarea>
    <div style="font-size:9px;color:var(--text-3);text-transform:uppercase;font-weight:700;margin-bottom:2px">Vorschau</div>
    <div id="${monoCardPreviewId(deck,i)}" style="font-size:12px;color:var(--text);background:var(--surface);border-radius:6px;padding:6px 8px;margin-bottom:6px">${escHtml(monoCardDisplayText(c))}</div>
    <div id="${monoCardHintId(deck,i)}" style="font-size:10px;color:var(--text-3);margin-bottom:8px">${monoCardMacroHint(c)}</div>
    <div style="display:flex;gap:6px;margin-bottom:8px">
      <button class="timer-btn" onclick="monoCardSetMode('${deck}',${i},'blueprint')" style="padding:5px 10px;font-size:11px;${mode==='blueprint'?'background:var(--accent);color:#fff;border-color:var(--accent)':''}">🧩 Blueprint</button>
      <button class="timer-btn" onclick="monoCardSetMode('${deck}',${i},'script')" style="padding:5px 10px;font-size:11px;${mode==='script'?'background:var(--accent);color:#fff;border-color:var(--accent)':''}">📝 Script</button>
    </div>
    ${mode==='script'
      ?monoCardScriptHtml(deck,i,c)
      :steps.map((step,si)=>monoCardStepHtml(deck,i,si,step,steps.length)).join('')+`<button class="timer-btn" onclick="monoCardAddStep('${deck}',${i})" style="padding:6px 10px;font-size:11px;margin-bottom:8px">+ Schritt</button>`
    }
    <div style="display:flex;justify-content:flex-end">
      <button class="timer-btn" onclick="monoCardDelete('${deck}',${i})" style="padding:6px 10px;font-size:11px;background:rgba(255,59,48,0.1);color:var(--danger);border-color:rgba(255,59,48,0.3)">🗑 Karte löschen</button>
    </div>
  </div>`;
}
function monoRenderCardsEditor(){
  const wrap=document.getElementById('mono-cards-editor');if(!wrap)return;
  wrap.innerHTML=`
    <div style="display:flex;gap:20px;flex-wrap:wrap">
      <div style="flex:1;min-width:280px">
        <div style="font-size:13px;font-weight:700;margin-bottom:8px">❓ Ereigniskarten (${monoChanceCards.length})</div>
        ${monoChanceCards.map((c,i)=>monoCardRowHtml('chance',i,c)).join('')}
        <button class="timer-btn" onclick="monoCardAdd('chance')" style="padding:7px 14px;font-size:12px">+ Neue Ereigniskarte</button>
      </div>
      <div style="flex:1;min-width:280px">
        <div style="font-size:13px;font-weight:700;margin-bottom:8px">📦 Gemeinschaftskarten (${monoCommunityCards.length})</div>
        ${monoCommunityCards.map((c,i)=>monoCardRowHtml('community',i,c)).join('')}
        <button class="timer-btn" onclick="monoCardAdd('community')" style="padding:7px 14px;font-size:12px">+ Neue Gemeinschaftskarte</button>
      </div>
    </div>`;
}

/* ── Regeln-Editor ── */
function monoSetRuleToggle(key,val){monoRules[key]=val;monoSaveRules();}
function monoSetRuleNumber(key,val){monoRules[key]=Math.max(0,+val||0);monoSaveRules();}
function monoRulesReset(){
  appConfirm('Regeln auf Standard zurücksetzen?',()=>{
    monoRules=Object.assign({},MONO_RULE_PRESETS.classic.rules);
    monoSaveRules();monoRenderRulesEditor();showToast('Regeln zurückgesetzt ✓');
  });
}
function monoApplyRulePreset(key){
  const preset=MONO_RULE_PRESETS[key];if(!preset)return;
  monoRules=Object.assign({},monoRules,preset.rules);
  monoSaveRules();monoRenderRulesEditor();showToast(`Preset „${preset.label}" angewendet ✓`);
}
function monoSetAiDifficulty(d){monoRules.aiDifficulty=d;monoSaveRules();monoRenderRulesEditor();}
function monoRenderRulesEditor(){
  const wrap=document.getElementById('mono-rules-editor');if(!wrap)return;
  wrap.innerHTML=`
    <div style="display:flex;flex-direction:column;gap:10px;max-width:560px">
      <div>
        <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:6px">Presets</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px">
          ${Object.entries(MONO_RULE_PRESETS).map(([key,preset])=>`<button class="timer-btn" onclick="monoApplyRulePreset('${key}')" style="padding:7px 14px;font-size:12px">${preset.label}</button>`).join('')}
        </div>
      </div>
      <div style="background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;padding:12px;display:flex;align-items:center;justify-content:space-between;gap:10px">
        <label class="set-label">Startkapital</label>
        <input type="number" min="0" step="50" value="${monoRules.startMoney}" oninput="monoSetRuleNumber('startMoney',this.value)" style="width:100px;padding:7px;background:var(--surface);border:0.5px solid var(--divider);border-radius:8px;color:var(--text);text-align:right"/>
      </div>
      <div style="background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;padding:12px;display:flex;align-items:center;justify-content:space-between;gap:10px">
        <label class="set-label">Gehalt beim Passieren von Los</label>
        <input type="number" min="0" step="10" value="${monoRules.goMoney}" oninput="monoSetRuleNumber('goMoney',this.value)" style="width:100px;padding:7px;background:var(--surface);border:0.5px solid var(--divider);border-radius:8px;color:var(--text);text-align:right"/>
      </div>
      <div style="background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;padding:12px">
        <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer">
          <input type="checkbox" ${monoRules.adaptiveAI?'checked':''} onchange="monoSetRuleToggle('adaptiveAI',this.checked)" style="margin-top:2px"/>
          <span>
            <span style="display:block;font-size:13px;font-weight:600;color:var(--text)">🧠 Adaptive KI</span>
            <span style="display:block;font-size:11px;color:var(--text-3);margin-top:2px">Bei genau einem Menschen gegen KI: nach 2 Siegen in Folge wechselt die KI auf „Schwer", nach 2 Niederlagen auf „Leicht".</span>
          </span>
        </label>
      </div>
      <div style="background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;padding:12px">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px">KI-Schwierigkeit</div>
        <div style="font-size:11px;color:var(--text-3);margin-bottom:8px">„Leicht" kauft &amp; baut naiv ohne Rücklage. „Schwer" spart Reserve, bevorzugt Monopol-Ausbau &amp; vermeidet riskante Verpfändungen. Zusätzlich lässt sich pro KI-Spieler im Setup eine Persönlichkeit wählen (${Object.values(MONO_AI_PERSONALITIES).map(pers=>`${pers.icon} ${pers.label}`).join(', ')}), die Rücklage, Handelslust &amp; Preisverhalten weiter verfeinert.</div>
        <div style="display:flex;gap:8px">
          <button class="timer-btn" onclick="monoSetAiDifficulty('easy')" style="padding:7px 14px;font-size:12px;${monoRules.aiDifficulty==='easy'?'background:var(--accent);color:#fff;border-color:var(--accent)':''}">Leicht</button>
          <button class="timer-btn" onclick="monoSetAiDifficulty('hard')" style="padding:7px 14px;font-size:12px;${monoRules.aiDifficulty!=='easy'?'background:var(--accent);color:#fff;border-color:var(--accent)':''}">Schwer</button>
        </div>
      </div>
      <div style="background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;padding:12px;display:flex;align-items:center;justify-content:space-between;gap:10px">
        <div>
          <label class="set-label" style="display:block">KI-Handel: Monopol-Aufschlag</label>
          <div style="font-size:11px;color:var(--text-3);margin-top:2px">Faktor auf den Grundstückspreis, den die KI verlangt, wenn ein Handel dir ein Monopol vervollständigt (1 = kein Aufschlag).</div>
        </div>
        <input type="number" min="1" step="0.1" value="${monoRules.aiMonopolyPremium}" oninput="monoSetRuleNumber('aiMonopolyPremium',this.value)" style="width:80px;padding:7px;background:var(--surface);border:0.5px solid var(--divider);border-radius:8px;color:var(--text);text-align:right;flex-shrink:0"/>
      </div>
      ${MONO_RULE_TOGGLES.map(r=>`
        <label style="display:flex;align-items:flex-start;gap:10px;background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;padding:10px 12px;cursor:pointer">
          <input type="checkbox" ${monoRules[r.k]?'checked':''} onchange="monoSetRuleToggle('${r.k}',this.checked)" style="margin-top:2px"/>
          <span>
            <span style="display:block;font-size:13px;font-weight:600;color:var(--text)">${r.label}</span>
            <span style="display:block;font-size:11px;color:var(--text-3);margin-top:2px">${r.desc}</span>
          </span>
        </label>`).join('')}

      <div style="background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;padding:12px">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px">Geld-erhalten-Multiplikator</div>
        <div style="font-size:11px;color:var(--text-3);margin-bottom:8px">Skaliert Gehalt (Los), Karteneinnahmen &amp; erhaltene Miete.</div>
        <input type="number" min="0" step="0.1" value="${monoRules.receiveMultiplier}" oninput="monoSetRuleNumber('receiveMultiplier',this.value)" style="width:100px;padding:7px;background:var(--surface);border:0.5px solid var(--divider);border-radius:8px;color:var(--text)"/>
      </div>
      <div style="background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;padding:12px">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px">Geld-bezahlen-Multiplikator</div>
        <div style="font-size:11px;color:var(--text-3);margin-bottom:8px">Skaliert Steuern, Kartenstrafen, Gefängnis-Kaution &amp; gezahlte Miete.</div>
        <input type="number" min="0" step="0.1" value="${monoRules.payMultiplier}" oninput="monoSetRuleNumber('payMultiplier',this.value)" style="width:100px;padding:7px;background:var(--surface);border:0.5px solid var(--divider);border-radius:8px;color:var(--text)"/>
      </div>
      <div style="background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;padding:12px">
        <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;margin-bottom:${monoRules.loansEnabled?'10px':'0'}">
          <input type="checkbox" ${monoRules.loansEnabled?'checked':''} onchange="monoSetRuleToggle('loansEnabled',this.checked);monoRenderRulesEditor()" style="margin-top:2px"/>
          <span>
            <span style="display:block;font-size:13px;font-weight:600;color:var(--text)">Bankkredite</span>
            <span style="display:block;font-size:11px;color:var(--text-3);margin-top:2px">Spieler können sich während ihres Zuges Geld von der Bank leihen und müssen es innerhalb einer festgelegten Zügezahl mit Zinsen zurückzahlen. Bei Fälligkeit wird automatisch abgebucht (ggf. mit Verkauf/Verpfändung oder Bankrott).</span>
          </span>
        </label>
        ${monoRules.loansEnabled?`<div style="display:flex;gap:16px;flex-wrap:wrap;padding-left:30px">
          <div>
            <label class="set-label" style="display:block;margin-bottom:4px">Rückzahlungsfrist (Züge)</label>
            <input type="number" min="1" step="1" value="${monoRules.loanMaxTurns}" oninput="monoSetRuleNumber('loanMaxTurns',this.value)" style="width:90px;padding:7px;background:var(--surface);border:0.5px solid var(--divider);border-radius:8px;color:var(--text);text-align:right"/>
          </div>
          <div>
            <label class="set-label" style="display:block;margin-bottom:4px">Zinsen (%)</label>
            <input type="number" min="0" step="1" value="${monoRules.loanInterestPercent}" oninput="monoSetRuleNumber('loanInterestPercent',this.value)" style="width:90px;padding:7px;background:var(--surface);border:0.5px solid var(--divider);border-radius:8px;color:var(--text);text-align:right"/>
          </div>
          <div>
            <label class="set-label" style="display:block;margin-bottom:4px">Max. gleichzeitige Kredite</label>
            <input type="number" min="0" step="1" value="${monoRules.maxLoansPerPlayer}" oninput="monoSetRuleNumber('maxLoansPerPlayer',this.value)" style="width:90px;padding:7px;background:var(--surface);border:0.5px solid var(--divider);border-radius:8px;color:var(--text);text-align:right" title="0 = unbegrenzt"/>
          </div>
        </div>`:''}
      </div>
      <div style="background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;padding:12px">
        <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer">
          <input type="checkbox" ${monoRules.teamsEnabled?'checked':''} onchange="monoSetRuleToggle('teamsEnabled',this.checked);monoRenderRulesEditor();monoRenderPlayerSetup()" style="margin-top:2px"/>
          <span>
            <span style="display:block;font-size:13px;font-weight:600;color:var(--text)">Team-Modus</span>
            <span style="display:block;font-size:11px;color:var(--text-3);margin-top:2px">Spieler können im Setup Teams mit frei wählbarem Namen bilden – beliebig viele Teams, gleicher Name = gleiches Team. Jeder behält eigenes Geld, aber Teammitglieder zahlen sich keine Miete, dürfen bauen sobald eine Straßengruppe zusammen dem Team gehört, und gewinnen gemeinsam, sobald nur noch ein Team übrig ist.</span>
          </span>
        </label>
      </div>
      <button class="timer-btn" onclick="monoRulesReset()" style="padding:8px 14px;font-size:12px;align-self:flex-start">↩ Regeln auf Standard zurücksetzen</button>
    </div>`;
}

/* ── Spieler-Setup ── */
let monoColorPickerFor=null;
function monoTeamNamesDatalist(){
  const names=[...new Set(monoPlayersSetup.map(p=>p.team).filter(Boolean))];
  return `<datalist id="mono-team-names">${names.map(n=>`<option value="${escHtml(n)}"></option>`).join('')}</datalist>`;
}
function monoNormNames(){
  if(typeof zcNormAccount!=='function')return;
  const taken=[];
  monoPlayersSetup.forEach(p=>{
    if(p.isAI)return;
    const n=zcNormAccount(p.name,taken);
    if(n!==p.name){
      p.name=n;const l=zcAccountLook(n);
      if(l){if(!monoPlayersSetup.some(q=>q!==p&&q.avatar===l.avatar))p.avatar=l.avatar;if(!monoPlayersSetup.some(q=>q!==p&&q.color===l.color))p.color=l.color;}
    }
    taken.push(p.name);
  });
}
function monoRenderPlayerSetup(){
  const wrap=document.getElementById('mono-player-rows');if(!wrap)return;
  monoNormNames();
  wrap.innerHTML=monoTeamNamesDatalist()+monoPlayersSetup.map((p,i)=>`<div style="display:flex;flex-direction:column;gap:6px">
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <input type="text" value="${escHtml(monoAvatarFor(p,i))}" onchange="monoSetupAvatar(${i},this.value)" maxlength="8" title="Emoji eingeben – Windows: Win+. bzw. Win+; · Mac: Cmd+Ctrl+Leertaste öffnet die Emoji-Auswahl" style="width:26px;height:26px;border-radius:50%;background:var(--bg);flex-shrink:0;border:2px solid var(--divider);cursor:text;padding:0;font-size:14px;line-height:1;text-align:center"/>
      <button onclick="monoToggleColorPicker(${i})" title="Farbe ändern" style="width:22px;height:22px;border-radius:50%;background:${p.color};flex-shrink:0;border:2px solid var(--divider);cursor:pointer;padding:0"></button>
      ${p.isAI||typeof zcAccountSelect!=='function'?`<input type="text" value="${escHtml(p.name)}" onchange="monoSetupName(${i},this.value)" style="flex:1;padding:8px 10px;background:var(--bg);border:0.5px solid var(--divider);border-radius:8px;color:var(--text);font-size:13px"/>`:zcAccountSelect(p.name,monoPlayersSetup.filter((q,j)=>j!==i&&!q.isAI).map(q=>q.name),`monoSetupName(${i},this.value)`,{style:'flex:1;min-width:120px;padding:8px 10px;background:var(--bg);border:0.5px solid var(--divider);border-radius:8px;color:var(--text);font-size:13px'})}
      ${monoRules.teamsEnabled?`<input type="text" list="mono-team-names" value="${escHtml(p.team||'')}" placeholder="Team (leer=keins)" title="Team – frei benennbar, gleicher Name = gleiches Team" onchange="monoSetupTeam(${i},this.value)" style="width:120px;padding:7px 8px;font-size:12px;border-radius:8px;border:0.5px solid var(--divider);background:var(--bg);color:var(--text);flex-shrink:0"/>`:''}
      <button onclick="monoToggleAI(${i})" title="${p.isAI?'KI-Spieler – klicken für Mensch':'Mensch – klicken für KI-Spieler'}" style="padding:7px 10px;font-size:12px;border-radius:8px;border:0.5px solid var(--divider);background:${p.isAI?'var(--accent)':'var(--bg)'};color:${p.isAI?'#fff':'var(--text)'};cursor:pointer;flex-shrink:0">🤖${p.isAI?' KI':''}</button>
      ${p.isAI?`<select onchange="monoSetupPersonality(${i},this.value)" title="KI-Persönlichkeit" style="padding:7px 8px;font-size:12px;border-radius:8px;border:0.5px solid var(--divider);background:var(--bg);color:var(--text);flex-shrink:0">
        ${Object.entries(MONO_AI_PERSONALITIES).map(([key,def])=>`<option value="${key}" ${(p.personality||'balanced')===key?'selected':''}>${def.icon} ${def.label}</option>`).join('')}
      </select>`:''}
    </div>
    ${monoColorPickerFor===i?`<div style="display:flex;flex-direction:column;gap:8px;padding:2px 0 4px 30px">
      <div style="display:flex;gap:7px;flex-wrap:wrap">
      ${MONO_PLAYER_COLORS.map(c=>{
        const takenBy=monoPlayersSetup.findIndex((pp,ii)=>ii!==i&&pp.color===c);
        const disabled=takenBy>=0;
        return `<button ${disabled?'disabled':''} onclick="monoSetupColor(${i},'${c}')" title="${disabled?'Bereits vergeben':c}" style="width:22px;height:22px;border-radius:50%;background:${c};border:${c===p.color?'2px solid var(--text)':'2px solid transparent'};cursor:${disabled?'not-allowed':'pointer'};padding:0;opacity:${disabled?'0.25':'1'}"></button>`;
      }).join('')}
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <input type="color" value="${p.color}" onchange="monoSetupColorHex(${i},this.value)" title="Eigene Farbe wählen" style="width:32px;height:28px;padding:0;border:0.5px solid var(--divider);border-radius:6px;cursor:pointer;background:none"/>
        <input type="text" value="${p.color}" onchange="monoSetupColorHex(${i},this.value)" placeholder="#RRGGBB" maxlength="7" style="width:90px;padding:6px 8px;background:var(--bg);border:0.5px solid var(--divider);border-radius:6px;color:var(--text);font-size:12px;font-family:monospace"/>
      </div>
    </div>`:''}
  </div>`).join('');
}
function monoToggleColorPicker(i){monoColorPickerFor=monoColorPickerFor===i?null:i;monoRenderPlayerSetup();}
function monoSetupAvatar(i,val){
  const v=(val||'').trim();
  if(!v){monoRenderPlayerSetup();return;}
  if(monoPlayersSetup.some((pp,ii)=>ii!==i&&pp.avatar===v)){showToast('Emoji bereits vergeben');monoRenderPlayerSetup();return;}
  monoPlayersSetup[i].avatar=v;monoRenderPlayerSetup();
}
function monoSetupColor(i,color){
  if(monoPlayersSetup.some((pp,ii)=>ii!==i&&pp.color===color))return;
  monoPlayersSetup[i].color=color;monoColorPickerFor=null;monoRenderPlayerSetup();
}
function monoSetupColorHex(i,val){
  let v=(val||'').trim();
  if(v&&!v.startsWith('#'))v='#'+v;
  v=v.toLowerCase();
  if(!/^#[0-9a-f]{6}$/.test(v)){showToast('Ungültiger Hex-Code (Format #RRGGBB)');monoRenderPlayerSetup();return;}
  if(monoPlayersSetup.some((pp,ii)=>ii!==i&&pp.color===v)){showToast('Farbe bereits vergeben');monoRenderPlayerSetup();return;}
  monoPlayersSetup[i].color=v;monoRenderPlayerSetup();
}
function monoSetupName(i,v){
  const p=monoPlayersSetup[i];
  if(v==='__new'&&typeof zcWhoCreate==='function'){zcWhoCreate(n=>monoSetupName(i,n));monoRenderPlayerSetup();return;}
  p.name=(v||'').trim()||(p.isAI?'KI':zcGuestName([]));
  if(!p.isAI){
    const l=typeof zcAccountLook==='function'?zcAccountLook(p.name):null;
    if(l){if(!monoPlayersSetup.some(q=>q!==p&&q.avatar===l.avatar))p.avatar=l.avatar;if(!monoPlayersSetup.some(q=>q!==p&&q.color===l.color))p.color=l.color;}
    monoRenderPlayerSetup();
  }
}
function monoToggleAI(i){
  monoPlayersSetup[i].isAI=!monoPlayersSetup[i].isAI;
  if(monoPlayersSetup[i].isAI&&!monoPlayersSetup[i].personality)monoPlayersSetup[i].personality='balanced';
  monoRenderPlayerSetup();
}
function monoSetupPersonality(i,v){monoPlayersSetup[i].personality=MONO_AI_PERSONALITIES[v]?v:'balanced';}
function monoSetupTeam(i,v){monoPlayersSetup[i].team=(v||'').trim()||null;monoRenderPlayerSetup();}
function monoAddPlayer(){monoColorPickerFor=null;
  const used=monoPlayersSetup.map(p=>p.color);
  const nextColor=MONO_PLAYER_COLORS.find(c=>!used.includes(c))||MONO_PLAYER_COLORS[monoPlayersSetup.length%MONO_PLAYER_COLORS.length];
  const usedAvatars=monoPlayersSetup.map(p=>p.avatar);
  const nextAvatar=MONO_AVATARS.find(a=>!usedAvatars.includes(a))||MONO_AVATARS[monoPlayersSetup.length%MONO_AVATARS.length];
  monoPlayersSetup.push({name:zcGuestName(monoPlayersSetup.map(q=>q.name)),color:nextColor,avatar:nextAvatar,isAI:false,team:null});monoRenderPlayerSetup();
}
function monoRemovePlayer(){if(monoPlayersSetup.length<=2)return;monoColorPickerFor=null;monoPlayersSetup.pop();monoRenderPlayerSetup();}

/* ── Spielstart ── */
function monoStartGame(){
  if(typeof monoMetaBeforeStart==='function')monoMetaBeforeStart();
  monoLoadFields();monoLoadCards();monoLoadRules();
  const startMoney=monoRules.startMoney||1500;
  monoGoMoney=monoRules.goMoney||0;
  monoPlayers=monoPlayersSetup.map((p,i)=>({name:p.name,color:p.color,avatar:monoAvatarFor(p,i),isAI:!!p.isAI,personality:p.isAI?(p.personality||'balanced'):null,team:monoRules.teamsEnabled?(p.team||null):null,money:startMoney,pos:0,inJail:false,jailTurns:0,getOutCards:0,bankrupt:false,skipTurns:0,doubleRentNext:false}));
  monoNetWorthHistory=monoPlayers.map(()=>[]);
  if(typeof rplBegin==='function')rplBegin('mono');
  monoStatsInit();monoBankruptOrder=[];monoMilestonesShown=new Set();
  monoOwner={};monoHouses={};monoMortgaged={};monoParkingPot=0;monoLoans=[];
  monoTurn=0;monoDoublesStreak=0;monoLog=[];monoLastDice=[1,1];
  monoCanRoll=true;monoCanEndTurn=false;monoModalType=null;monoModalField=null;monoPendingCard=null;monoPendingDebt=null;monoGameOver=false;
  monoAutoRoll=false;clearTimeout(monoAutoRollTimer);
  monoTrade={with:null,offerProps:[],offerMoney:0,reqProps:[],reqMoney:0};
  monoAiOfferMade=false;monoAiOffer=null;monoAiOfferCountering=false;
  monoLogAdd('🎲 Spiel gestartet mit '+monoPlayers.length+' Spielern.');
  const sp=document.getElementById('mono-setup-panel');if(sp)sp.style.display='none';
  const gp=document.getElementById('mono-game-panel');if(gp)gp.style.display='block';
  monoUpdateEditTabsState();
  monoUndoCheckpoint();
  monoRenderAll();
}
function monoAbandonGame(){
  appConfirm('Aktuelles Spiel beenden?',()=>{
    monoAutoRoll=false;clearTimeout(monoAutoRollTimer);
    if(typeof monoMetaCancelCup==='function')monoMetaCancelCup();
    monoPlayers=[];monoGameOver=false;monoModalType=null;
    monoUndoSnapshot=null;monoAiOffer=null;monoAiOfferCountering=false;
    monoClearSavedGame();
    const overlay=document.getElementById('mono-modal-overlay');if(overlay)overlay.style.display='none';
    const sp=document.getElementById('mono-setup-panel');if(sp)sp.style.display='block';
    const gp=document.getElementById('mono-game-panel');if(gp)gp.style.display='none';
    monoUpdateEditTabsState();
  });
}
/* ── Spielstand speichern/fortsetzen ── */
function monoSerializeState(){
  return{
    players:monoPlayers,owner:monoOwner,houses:monoHouses,mortgaged:monoMortgaged,
    turn:monoTurn,doublesStreak:monoDoublesStreak,lastDice:monoLastDice,log:monoLog,
    canRoll:monoCanRoll,canEndTurn:monoCanEndTurn,modalType:monoModalType,modalField:monoModalField,
    pendingCard:monoPendingCard,pendingDebt:monoPendingDebt,gameOver:monoGameOver,
    goMoney:monoGoMoney,parkingPot:monoParkingPot,netWorthHistory:monoNetWorthHistory,
    loans:monoLoans,stats:monoStats,bankruptOrder:monoBankruptOrder,
    milestonesShown:Array.from(monoMilestonesShown)
  };
}
function monoApplyState(st){
  monoPlayers=st.players;monoOwner=st.owner||{};monoHouses=st.houses||{};monoMortgaged=st.mortgaged||{};
  monoTurn=st.turn||0;monoDoublesStreak=st.doublesStreak||0;monoLastDice=st.lastDice||[1,1];monoLog=st.log||[];
  monoCanRoll=!!st.canRoll;monoCanEndTurn=!!st.canEndTurn;monoModalType=st.modalType||null;
  monoModalField=st.modalField!=null?st.modalField:null;
  monoPendingCard=st.pendingCard||null;monoPendingDebt=st.pendingDebt||null;monoGameOver=!!st.gameOver;
  monoGoMoney=st.goMoney!=null?st.goMoney:200;monoParkingPot=st.parkingPot||0;
  monoNetWorthHistory=Array.isArray(st.netWorthHistory)?st.netWorthHistory:monoPlayers.map(()=>[]);
  monoLoans=Array.isArray(st.loans)?st.loans:[];
  monoStats=Array.isArray(st.stats)&&st.stats.length===monoPlayers.length?st.stats:(monoStatsInit(),monoStats);
  monoBankruptOrder=Array.isArray(st.bankruptOrder)?st.bankruptOrder:[];
  monoMilestonesShown=new Set(Array.isArray(st.milestonesShown)?st.milestonesShown:[]);
}
function monoSaveGame(){
  if(!monoPlayers.length)return;
  try{localStorage.setItem('zf_mono_savegame',JSON.stringify(monoSerializeState()));}catch(e){}
}
function monoLoadGame(){
  try{
    const s=localStorage.getItem('zf_mono_savegame');if(!s)return false;
    const st=JSON.parse(s);
    if(!st||!Array.isArray(st.players)||!st.players.length)return false;
    monoApplyState(st);
    monoAutoRoll=false;
    monoUndoSnapshot=null;monoAiOfferMade=true;monoAiOffer=null;monoAiOfferCountering=false;
    return true;
  }catch(e){return false;}
}
function monoClearSavedGame(){try{localStorage.removeItem('zf_mono_savegame');}catch(e){}}
/* ── Zug rückgängig machen ── */
let monoUndoSnapshot=null;
function monoUndoCheckpoint(){
  if(!monoPlayers.length){monoUndoSnapshot=null;return;}
  const p=monoPlayers[monoTurn];
  if(!p||p.isAI||p.bankrupt||monoGameOver){monoUndoSnapshot=null;return;}
  try{monoUndoSnapshot=JSON.parse(JSON.stringify(monoSerializeState()));}catch(e){monoUndoSnapshot=null;}
}
function monoUndo(){
  if(!monoRules.undoEnabled||!monoUndoSnapshot)return;
  try{monoApplyState(JSON.parse(JSON.stringify(monoUndoSnapshot)));}catch(e){return;}
  monoAutoRoll=false;clearTimeout(monoAutoRollTimer);
  monoLogAdd('↩️ Zug rückgängig gemacht.');
  monoRenderAll();
}

/* ── Board-Rendering ── */
function monoFieldGridPos(i){
  if(i===0)return{row:11,col:11};
  if(i<=9)return{row:11,col:11-i};
  if(i===10)return{row:11,col:1};
  if(i<=19)return{row:11-(i-10),col:1};
  if(i===20)return{row:1,col:1};
  if(i<=29)return{row:1,col:1+(i-20)};
  if(i===30)return{row:1,col:11};
  return{row:1+(i-30),col:11};
}
const MONO_BOARD_BG='#c8e6c9';
const MONO_CELL_BG='#faf6ec';
function monoRenderBoard(){
  const board=document.getElementById('mono-board');if(!board)return;
  board.style.background=MONO_BOARD_BG;
  let html='<style>@keyframes monoActivePulse{0%,100%{box-shadow:inset 0 0 0 2px var(--pc),0 0 6px 2px var(--pc)}50%{box-shadow:inset 0 0 0 3px var(--pc),0 0 16px 6px var(--pc)}}</style>';
  const activePlayer=(!monoGameOver&&monoPlayers[monoTurn]&&!monoPlayers[monoTurn].bankrupt)?monoPlayers[monoTurn]:null;
  for(let i=0;i<40;i++){
    const f=monoFields[i];const pos=monoFieldGridPos(i);
    const isCorner=[0,10,20,30].includes(i);
    const owner=monoOwner[i];
    const ownerColor=owner!==undefined?monoPlayers[owner].color:null;
    const mortgaged=monoMortgaged[i];
    const houses=monoHouses[i]||0;
    const isActiveHere=activePlayer&&activePlayer.pos===i;
    const tokens=monoPlayers.map((p,pi)=>{
      if(p.bankrupt||p.pos!==i)return '';
      const isActive=p===activePlayer;
      const size=isActive?16:13;
      return `<span style="display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:${p.color};border:2px solid #fff;margin:1px;box-shadow:0 0 0 1px #0006,0 1px 2px rgba(0,0,0,0.4);font-size:${isActive?9:8}px;line-height:1">${monoAvatarFor(p,pi)}</span>`;
    }).join('');
    const activeStyle=isActiveHere?`--pc:${activePlayer.color};animation:monoActivePulse 1.3s ease-in-out infinite;z-index:2;`:'';
    let inner;
    if(i===0){
      inner=`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:2px">
        <div style="font-size:17px;color:#e6231e;font-weight:900;transform:rotate(-45deg)">➜</div>
        <div style="font-size:6px;color:#333;text-align:center;line-height:1.1;padding:0 2px">Ziehen Sie im Vorübergehen 200€ ein</div>
        <div style="font-size:12px;font-weight:900;color:#e6231e;letter-spacing:1px">LOS</div>
      </div>`;
    } else if(i===10){
      inner=`<div style="position:relative;height:100%;background:linear-gradient(135deg,#f7941d 0 50%,${MONO_CELL_BG} 50%)">
        <div style="position:absolute;top:3px;left:3px;font-size:6.5px;color:#333;font-weight:700;line-height:1.1">NUR ZU<br>BESUCH</div>
        <div style="position:absolute;bottom:3px;right:3px;text-align:right">
          <div style="font-size:15px;line-height:1">🚔</div>
          <div style="font-size:7px;font-weight:900;color:#e6231e">GEFÄNGNIS</div>
        </div>
      </div>`;
    } else if(i===20){
      inner=`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:2px">
        <div style="font-size:19px">🅿️</div>
        <div style="font-size:8.5px;font-weight:900;color:#e6231e;letter-spacing:0.5px">FREI<br>PARKEN</div>
      </div>`;
    } else if(i===30){
      inner=`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:2px">
        <div style="font-size:19px">👮</div>
        <div style="font-size:7px;font-weight:900;color:#0a2c8c;text-align:center;line-height:1.1">GEHE INS<br>GEFÄNGNIS</div>
      </div>`;
    } else {
      let colorBar='';
      if(f.type==='property')colorBar=`<div style="height:12px;background:${MONO_COLOR_HEX[f.color]||'#999'};margin:-1px -1px 2px;flex-shrink:0;border-bottom:1px solid rgba(0,0,0,0.25)"></div>`;
      let icon='';
      if(f.type==='railroad')icon='<span style="font-size:12px;line-height:1">🚂</span>';
      else if(f.type==='utility')icon=(f.name||'').toLowerCase().includes('wasser')?'<span style="font-size:12px;line-height:1">🚰</span>':'<span style="font-size:12px;line-height:1">💡</span>';
      else if(f.type==='card')icon=f.deck==='chance'?'<span style="font-size:13px;font-weight:900;color:#e6231e;line-height:1">❓</span>':'<span style="font-size:12px;line-height:1">📦</span>';
      else if(f.type==='tax')icon='<span style="font-size:12px;line-height:1">💎</span>';
      let priceOrOwner='';
      if(f.type==='property'||f.type==='railroad'||f.type==='utility'){
        priceOrOwner=owner!==undefined
          ?`<div style="font-size:6.5px;color:${ownerColor};font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%">${escHtml(monoPlayers[owner].name.slice(0,8))}${mortgaged?' 🏦':''}</div>`
          :`<div style="font-size:6.5px;color:#777">${f.price}€</div>`;
      } else if(f.type==='tax'){
        priceOrOwner=`<div style="font-size:6.5px;color:#777">${f.amount}€</div>`;
      }
      const houseIcons=houses>0?`<div style="font-size:7px">${houses===5?'🏨':'🏠'.repeat(houses)}</div>`:'';
      inner=`${colorBar}
      <div style="flex:1;padding:1px 2px;font-size:6.5px;line-height:1.05;text-align:center;color:#222;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px">
        ${icon}
        <div style="font-weight:600;letter-spacing:0.1px;word-break:break-word">${escHtml(f.name)}</div>
        ${priceOrOwner}
        ${houseIcons}
      </div>`;
    }
    html+=`<div onclick="monoFieldTapInfo(${i})" style="grid-row:${pos.row};grid-column:${pos.col};border:0.5px solid #999;overflow:hidden;display:flex;flex-direction:column;cursor:pointer;position:relative;background:${MONO_CELL_BG};${owner!==undefined?'box-shadow:inset 0 0 0 2px '+ownerColor+';':''}${activeStyle}">
      ${inner}
      <div style="position:absolute;bottom:1px;left:1px;right:1px;display:flex;flex-wrap:wrap;justify-content:center">${tokens}</div>
    </div>`;
  }
  html+=`<div style="grid-row:2/11;grid-column:2/11;position:relative;display:flex;align-items:center;justify-content:center;background:${MONO_BOARD_BG};border:0.5px solid #999;overflow:hidden">
    <div style="position:absolute;top:12%;left:14%;width:76px;height:76px;background:#8fd3ff;border:2px dotted #333;transform:rotate(45deg);opacity:0.85"></div>
    <div style="position:absolute;bottom:10%;right:12%;width:76px;height:76px;background:#f7941d;border:2px dotted #333;transform:rotate(45deg);opacity:0.85"></div>
    <div style="position:relative;font-size:26px;font-weight:900;color:#fff;background:#e6231e;padding:8px 22px;transform:rotate(-20deg);letter-spacing:2px;user-select:none;box-shadow:0 3px 10px rgba(0,0,0,0.35);border:2px solid #fff">MONOPOLY</div>
  </div>`;
  board.innerHTML=html;
}
function monoFieldTapInfo(i){
  const f=monoFields[i];let msg=f.name;
  if(f.type==='property'){
    const owner=monoOwner[i];
    msg+=` — ${f.price}€, Grundmiete ${f.rent[0]}€`+(owner!==undefined?` · Besitzer: ${monoPlayers[owner].name}`:' · frei');
  } else if(f.type==='railroad')msg+=` — ${f.price}€ (Bahnhof)`;
  else if(f.type==='utility')msg+=` — ${f.price}€ (Werk)`;
  else if(f.type==='tax')msg+=` — Zahle ${f.amount}€`;
  showToast(msg,2600);
}

/* ── Zug-Engine ── */
function monoDiceFace(n){return['','⚀','⚁','⚂','⚃','⚄','⚅'][n]||n;}
function monoMovePlayer(p,steps){
  let newPos=p.pos+steps;let passedGo=false;
  if(newPos>=40){newPos-=40;passedGo=true;}
  p.pos=newPos;
  if(passedGo){
    monoStatBump(monoPlayers.indexOf(p),'passedGo',1);
    if(monoGoMoney){const actual=monoGive(p,monoGoMoney);monoLogAdd(`💵 ${p.name} zieht an Los vorbei und erhält ${actual}€.`);}
  }
}
function monoSendToJail(p){
  sfx('lose');
  const jailIdx=monoFields.findIndex(f=>f.type==='jail');
  p.pos=jailIdx>=0?jailIdx:10;p.inJail=true;p.jailTurns=0;
  monoStatBump(monoPlayers.indexOf(p),'jailVisits',1);
}
function monoSameTeam(idxA,idxB){
  if(idxA===idxB)return true;
  if(!monoRules.teamsEnabled)return false;
  const a=monoPlayers[idxA],b=monoPlayers[idxB];
  return !!(a&&b&&a.team!=null&&a.team===b.team);
}
function monoTeamKey(idx){
  const p=monoPlayers[idx];
  return(monoRules.teamsEnabled&&p.team!=null)?('t:'+p.team):('p:'+idx);
}
function monoGameShouldEnd(){
  const remainingIdxs=monoPlayers.map((p,i)=>i).filter(i=>!monoPlayers[i].bankrupt);
  const keys=new Set(remainingIdxs.map(monoTeamKey));
  return keys.size<=1;
}
function monoWinners(){return monoPlayers.filter(p=>!p.bankrupt);}
function monoWinnerMessage(escaped){
  const esc=escaped?escHtml:(x=>x);
  const winners=monoWinners();
  if(!winners.length)return 'Niemand';
  if(monoRules.teamsEnabled&&winners[0].team!=null)return `Team „${esc(winners[0].team)}" (${winners.map(w=>esc(w.name)).join(', ')})`;
  return esc(winners[0].name);
}
function monoOwnsFullGroup(owner,color){
  const idxs=monoFields.map((f,i)=>f.type==='property'&&f.color===color?i:-1).filter(x=>x>=0);
  return idxs.length>0&&idxs.every(i=>monoOwner[i]!==undefined&&monoSameTeam(monoOwner[i],owner));
}
function monoOwnedFieldCount(playerIdx){
  return monoFields.reduce((n,f,i)=>n+((f.type==='property'||f.type==='railroad'||f.type==='utility')&&monoOwner[i]===playerIdx?1:0),0);
}
function monoComputeRent(i){
  const f=monoFields[i];const owner=monoOwner[i];
  if(f.type==='property'){
    const houses=monoHouses[i]||0;
    let rent=(f.rent&&f.rent[houses])||0;
    if(monoRules.doubleRentUnbuiltMonopoly&&houses===0&&monoOwnsFullGroup(owner,f.color))rent*=2;
    return rent;
  }
  if(f.type==='railroad'){
    const count=monoFields.reduce((n,ff,idx)=>n+(ff.type==='railroad'&&monoOwner[idx]===owner?1:0),0);
    return[0,25,50,100,200][count]||0;
  }
  if(f.type==='utility'){
    const count=monoFields.reduce((n,ff,idx)=>n+(ff.type==='utility'&&monoOwner[idx]===owner?1:0),0);
    const mult=count>=2?10:4;
    return(monoLastDice[0]+monoLastDice[1])*mult;
  }
  return 0;
}
function monoRentAfterBoost(ownerIdx,rawRent){
  const owner=monoPlayers[ownerIdx];
  if(owner&&owner.doubleRentNext){owner.doubleRentNext=false;return{rent:rawRent*2,boosted:true};}
  return{rent:rawRent,boosted:false};
}
function monoEnsureFunds(p,amount,creditor,resumeTag,resumeData){
  if(p.money>=amount)return true;
  monoPendingDebt={amount,creditorIdx:creditor?monoPlayers.indexOf(creditor):null,resumeTag:resumeTag||'finishLanding',resumeData:resumeData||null};
  monoModalType='debt';monoRenderAll();
  return false;
}
function monoDebtCreditor(){
  const pd=monoPendingDebt;
  return pd&&pd.creditorIdx!=null?monoPlayers[pd.creditorIdx]:null;
}
function monoRunDebtResume(pd){
  const tag=pd&&pd.resumeTag;const data=(pd&&pd.resumeData)||{};
  const p=monoPlayers[monoTurn];
  if(tag==='jailRoll3rd'){
    p.inJail=false;p.jailTurns=0;
    monoSuppressDoubleBonus=true;
    monoMovePlayer(p,data.d1+data.d2);monoLandOn(p);
    if(!monoModalType){monoCanRoll=false;monoCanEndTurn=true;monoSuppressDoubleBonus=false;}
  } else if(tag==='payJailFine'){
    p.inJail=false;p.jailTurns=0;monoCanRoll=true;
  } else if(tag==='loanRepaid'){
    monoCanRoll=true;monoCanEndTurn=false;
  } else {
    monoFinishLanding();
  }
}
function monoPayBank(p,amount,reason,resume){
  if(!monoEnsureFunds(p,amount,null,resume))return;
  const actual=monoTake(p,amount);
  if(monoRules.freeParkingPot)monoParkingPot+=actual;
  monoLogAdd(`💸 ${p.name} zahlt ${actual}€ (${reason}) an die Bank.`);
}
function monoPayTo(p,recipient,amount,reason,resume){
  if(!monoEnsureFunds(p,amount,recipient,resume))return;
  const paid=monoTake(p,amount);monoGive(recipient,amount);
  monoStatBump(monoPlayers.indexOf(p),'paidToPlayers',paid);
  monoStatBump(monoPlayers.indexOf(recipient),'collectedFromPlayers',paid);
  monoLogAdd(`💸 ${p.name} zahlt ${recipient.name} ${paid}€ (${reason}).`);
}
const MONO_MAX_CARD_CHAIN=8;
function monoLandOn(p,depth){
  depth=depth||0;
  const i=p.pos;const f=monoFields[i];
  if(f.type==='property'||f.type==='railroad'||f.type==='utility'){
    const owner=monoOwner[i];
    if(owner===undefined){monoModalType='buy';monoModalField=i;}
    else if(owner===monoTurn){/* eigenes Feld */}
    else if(monoRules.teamsEnabled&&monoSameTeam(owner,monoTurn)){monoLogAdd(`${f.name} gehört einem Teammitglied – keine Miete fällig.`);}
    else if(monoMortgaged[i]){monoLogAdd(`${f.name} ist verpfändet – keine Miete fällig.`);}
    else{
      const{rent,boosted}=monoRentAfterBoost(owner,monoComputeRent(i));
      monoStatMax(monoTurn,'biggestRentPaid',rent);monoStatMax(owner,'biggestRentCollected',rent);
      monoPayTo(p,monoPlayers[owner],rent,`Miete für ${f.name}`+(boosted?' (verdoppelt!)':''));
    }
  } else if(f.type==='tax'){
    monoPayBank(p,f.amount,f.name);
  } else if(f.type==='card'){
    const card=monoDrawCard(f.deck);
    if(monoAutoRoll&&!p.isAI&&depth<MONO_MAX_CARD_CHAIN){monoApplyCard(card,depth+1);}
    else{
      if(monoAutoRoll&&!p.isAI)monoLogAdd(`🔁 Kartenkette nach ${MONO_MAX_CARD_CHAIN}× in Folge gestoppt – bitte bestätigen.`);
      monoPendingCard=card;monoModalType='card';
    }
  } else if(f.type==='gotojail'){
    monoLogAdd(`👮 ${p.name} muss ins Gefängnis.`);monoSendToJail(p);
  } else if(f.type==='parking'){
    if(monoRules.freeParkingPot&&monoParkingPot>0){
      const pot=monoParkingPot;monoParkingPot=0;
      const actual=monoGive(p,pot);
      monoLogAdd(`🅿️ ${p.name} landet auf ${f.name} und kassiert den Jackpot von ${actual}€!`);
    }
  }
}
let monoSuppressDoubleBonus=false;
function monoFinishLanding(){
  if(monoModalType)return;
  const p=monoPlayers[monoTurn];if(p.bankrupt)return;
  const isDouble=monoRules.doublesBonusRoll&&monoLastDice[0]===monoLastDice[1]&&!monoSuppressDoubleBonus;
  monoSuppressDoubleBonus=false;
  if(isDouble&&!p.inJail){monoCanRoll=true;monoCanEndTurn=false;monoLogAdd(`↻ ${p.name} darf nochmal würfeln (Pasch).`);}
  else{monoCanRoll=false;monoCanEndTurn=true;}
}
function monoRollDice(){
  if(monoModalType||monoGameOver||!monoCanRoll)return;
  sfx('dice');
  monoSuppressDoubleBonus=false;
  const p=monoPlayers[monoTurn];
  const d1=1+Math.floor(Math.random()*6),d2=1+Math.floor(Math.random()*6);
  monoLastDice=[d1,d2];
  const isDouble=d1===d2;
  monoDoublesStreak=isDouble?monoDoublesStreak+1:0;
  monoStatBump(monoTurn,'totalRolls',1);
  if(isDouble)monoStatBump(monoTurn,'doublesRolled',1);
  monoLogAdd(`🎲 ${p.name} würfelt ${d1}+${d2}${isDouble?' (Pasch!)':''}`);
  if(monoRules.doublesToJail&&isDouble&&monoDoublesStreak>=3){
    monoLogAdd(`🚔 ${p.name} würfelt zum 3. Mal in Folge Pasch und muss ins Gefängnis!`);
    monoStatBump(monoTurn,'tripleDoubles',1);
    monoSendToJail(p);monoDoublesStreak=0;
    monoCanRoll=false;monoCanEndTurn=true;monoRenderAll();return;
  }
  monoMovePlayer(p,d1+d2);
  monoLandOn(p);
  monoCanRoll=false;monoCanEndTurn=false;
  monoFinishLanding();
  monoRenderAll();
}
function monoNextTurn(){
  monoRecordNetWorth();
  let guard=0;
  while(guard++<monoPlayers.length*3){
    monoTurn=(monoTurn+1)%monoPlayers.length;
    const p=monoPlayers[monoTurn];
    if(p.bankrupt)continue;
    if(p.skipTurns>0){
      p.skipTurns--;
      monoLogAdd(`⏭️ ${p.name} setzt diese Runde aus.`);
      continue;
    }
    break;
  }
  monoDoublesStreak=0;monoCanRoll=true;monoCanEndTurn=false;monoLastDice=[1,1];
  monoAiOfferMade=false;
  monoProcessLoansForCurrentPlayer();
  monoUndoCheckpoint();
}
function monoEndTurn(){
  if(monoModalType)return;
  monoNextTurn();monoRenderAll();
}

/* ── Kaufen ── */
function monoBuyCurrent(){
  const p=monoPlayers[monoTurn];const i=monoModalField;const f=monoFields[i];
  if(p.money<f.price)return;
  p.money-=f.price;monoOwner[i]=monoTurn;sfx('coin');
  monoLogAdd(`🏠 ${p.name} kauft ${f.name} für ${f.price}€.`);
  monoModalType=null;monoModalField=null;
  monoFinishLanding();monoRenderAll();
}
function monoDeclineBuy(){
  const f=monoFields[monoModalField];
  monoLogAdd(`🏦 ${f.name} bleibt unbebaut bei der Bank.`);
  monoModalType=null;monoModalField=null;
  monoFinishLanding();monoRenderAll();
}

/* ── Karten ── */
function monoDrawCard(deck){
  const list=deck==='chance'?monoChanceCards:monoCommunityCards;
  const deckLabel=deck==='chance'?'❓ Ereigniskarte':'📦 Gemeinschaftskarte';
  monoStatBump(monoTurn,'cardsDrawn',1);
  if(!list.length)return{text:'Der Stapel ist leer. Nichts passiert.',fx:[{type:'collect',amount:0}],deckLabel};
  const c=list[Math.floor(Math.random()*list.length)];
  return{...c,fx:monoCardSteps(c).map(s=>({...s})),deckLabel};
}
const MONO_CARD_CONTEXT_MACROS={
  goMoney:{label:'Gehalt bei Los',value:()=>monoRules.goMoney}
};
function monoCardMacroValue(steps,stepIdx,key){
  const step=steps[stepIdx];if(!step)return '';
  const spec=MONO_FX_TYPES.find(t=>t.v===step.type);
  if(!spec||!spec.params.length)return '';
  const param=key?spec.params.find(p=>p.k===key):spec.params[0];
  if(!param)return '';
  const val=step[param.k];
  if(param.k==='to'&&step.type==='move')return (monoFields[val]&&monoFields[val].name)||val;
  if(param.k==='steps'&&step.type==='moverel')return Math.abs(val);
  if(param.type==='select'){const opt=param.options.find(o=>o[0]===val);return opt?opt[1]:val;}
  return val;
}
function monoCardDisplayText(c){
  const steps=monoCardSteps(c);
  let text=c.text||'';
  text=text.replace(/\$(\d+)(?:\.([a-zA-Z]+))?/g,(m,n,key)=>String(monoCardMacroValue(steps,(+n)-1,key)));
  Object.keys(MONO_CARD_CONTEXT_MACROS).forEach(key=>{
    text=text.split('$'+key).join(MONO_CARD_CONTEXT_MACROS[key].value());
  });
  const spec0=steps[0]&&MONO_FX_TYPES.find(t=>t.v===steps[0].type);
  if(spec0){
    spec0.params.forEach(p=>{
      text=text.split('$'+p.k).join(String(monoCardMacroValue(steps,0,p.k)));
    });
  }
  return text.split('$').join(String(monoCardMacroValue(steps,0)));
}
function monoCardMacroHint(c){
  const steps=monoCardSteps(c);
  const parts=[];
  steps.forEach((step,idx)=>{
    const spec=MONO_FX_TYPES.find(t=>t.v===step.type);
    if(!spec||!spec.params.length){parts.push(`Schritt ${idx+1} (${spec?spec.label:step.type}): kein Wert`);return;}
    const names=spec.params.map((p,pi)=>{
      if(idx===0)return pi===0?'$':'$'+p.k;
      return pi===0?'$'+(idx+1):'$'+(idx+1)+'.'+p.k;
    });
    parts.push(`Schritt ${idx+1} (${spec.label}): ${names.map(n=>'<code>'+n+'</code>').join(', ')}`);
  });
  Object.entries(MONO_CARD_CONTEXT_MACROS).forEach(([key,m])=>{
    parts.push(`<code>$${key}</code> = ${m.label} (${m.value()}€)`);
  });
  let out='Platzhalter: '+parts.join(' · ');
  if(steps.length>1){
    out=`<span style="color:var(--danger)">⚠️ ${steps.length} Schritte: <code>$</code> allein zeigt immer nur Schritt 1! Für Schritt 2 <code>$2</code>, für Schritt 3 <code>$3</code> usw. verwenden – sonst erscheint überall derselbe Wert.</span><br>`+out;
  }
  return out;
}
function monoCardPreviewId(deck,i){return `mono-card-preview-${deck}-${i}`;}
function monoCardUpdatePreview(deck,i){
  const el=document.getElementById(monoCardPreviewId(deck,i));
  if(el)el.textContent=monoCardDisplayText(monoCardsArr(deck)[i]);
}
function monoCardAck(){
  const c=monoPendingCard;monoPendingCard=null;monoModalType=null;
  monoApplyCard(c);
  monoFinishLanding();monoRenderAll();
}
function monoApplyCardStep(fx,depth){
  const p=monoPlayers[monoTurn];
  if(fx.type==='move'){const delta=(fx.to-p.pos+40)%40;monoMovePlayer(p,delta);monoLandOn(p,depth);}
  else if(fx.type==='moverel'){p.pos=(p.pos+fx.steps+40)%40;monoLandOn(p,depth);}
  else if(fx.type==='nearest'){
    const idxs=monoFields.map((f,i)=>f.type===fx.kind?i:-1).filter(i=>i>=0);
    let target=idxs.find(i=>i>p.pos);if(target===undefined)target=idxs[0];
    const delta=(target-p.pos+40)%40;monoMovePlayer(p,delta);
    const owner=monoOwner[target];
    if(owner===undefined){monoModalType='buy';monoModalField=target;}
    else if(owner!==monoTurn&&!(monoRules.teamsEnabled&&monoSameTeam(owner,monoTurn))&&!monoMortgaged[target]){
      const rawRent=fx.kind==='utility'?(monoLastDice[0]+monoLastDice[1])*fx.multiplier:monoComputeRent(target)*(fx.multiplier||1);
      const{rent,boosted}=monoRentAfterBoost(owner,rawRent);
      monoStatMax(monoTurn,'biggestRentPaid',rent);monoStatMax(owner,'biggestRentCollected',rent);
      monoPayTo(p,monoPlayers[owner],rent,`Miete für ${monoFields[target].name}`+(boosted?' (verdoppelt!)':''));
    }
  }
  else if(fx.type==='collect'){const actual=monoGive(p,fx.amount);monoLogAdd(`💵 ${p.name} erhält ${actual}€.`);}
  else if(fx.type==='pay'){monoPayBank(p,fx.amount,'Karte');}
  else if(fx.type==='payeach'){monoPlayers.forEach(op=>{if(op!==p&&!op.bankrupt)monoPayTo(p,op,fx.amount,'Karte');});}
  else if(fx.type==='collectfromeach'){monoPlayers.forEach(op=>{if(op!==p&&!op.bankrupt)monoPayTo(op,p,fx.amount,'Karte');});}
  else if(fx.type==='getoutofjail'){p.getOutCards++;monoLogAdd(`🎟️ ${p.name} erhält eine Freikarte.`);}
  else if(fx.type==='gotojail'){monoLogAdd(`👮 ${p.name} muss ins Gefängnis.`);monoSendToJail(p);}
  else if(fx.type==='repairs'){
    let total=0;
    monoFields.forEach((f,i)=>{if(monoOwner[i]===monoTurn){const h=monoHouses[i]||0;total+=h===5?fx.hotel:h*fx.house;}});
    if(total>0)monoPayBank(p,total,'Reparaturen');
  }
  else if(fx.type==='skipturn'){
    p.skipTurns=(p.skipTurns||0)+fx.turns;
    monoLogAdd(`⏭️ ${p.name} setzt die nächsten ${fx.turns} Runde(n) aus.`);
  }
  else if(fx.type==='payperproperty'){
    const count=monoOwnedFieldCount(monoTurn);
    const total=fx.amount*count;
    if(total>0)monoPayBank(p,total,`Karte (${count}× Grundstück)`);
  }
  else if(fx.type==='collectperproperty'){
    const count=monoOwnedFieldCount(monoTurn);
    const total=fx.amount*count;
    if(total>0){const actual=monoGive(p,total);monoLogAdd(`💵 ${p.name} erhält ${actual}€ (${count}× Grundstück).`);}
  }
  else if(fx.type==='multiplymoney'){
    const before=p.money;p.money=Math.max(0,Math.round(p.money*fx.factor));
    const diff=p.money-before;
    monoLogAdd(diff>=0?`✨ ${p.name}s Vermögen wächst um ${diff}€ (×${fx.factor}).`:`📉 ${p.name}s Vermögen schrumpft um ${Math.abs(diff)}€ (×${fx.factor}).`);
  }
  else if(fx.type==='moverandom'){
    const target=Math.floor(Math.random()*40);
    const delta=(target-p.pos+40)%40;monoMovePlayer(p,delta);monoLandOn(p,depth);
  }
  else if(fx.type==='stealproperty'){
    const candidates=Object.keys(monoOwner).map(k=>+k).filter(i=>monoOwner[i]!==monoTurn&&!monoPlayers[monoOwner[i]].bankrupt);
    if(!candidates.length){monoLogAdd(`🕵️ ${p.name} findet kein Grundstück zum Stehlen.`);}
    else{
      const target=candidates[Math.floor(Math.random()*candidates.length)];
      const victim=monoPlayers[monoOwner[target]];
      monoHouses[target]=0;
      monoOwner[target]=monoTurn;
      monoLogAdd(`🕵️ ${p.name} stiehlt ${monoFields[target].name} von ${victim.name}!`);
    }
  }
  else if(fx.type==='doublerentnext'){
    p.doubleRentNext=true;
    monoLogAdd(`⚡ Die nächste Miete, die ${p.name} kassiert, zählt doppelt.`);
  }
  else if(fx.type==='gifthouse'){
    const idxs=monoFields.map((f,i)=>i).filter(i=>monoCanPlaceHouseFree(i));
    if(!idxs.length){monoLogAdd(`🎁 ${p.name} findet kein passendes Grundstück für ein Gratis-Haus.`);}
    else{
      const i=idxs[Math.floor(Math.random()*idxs.length)];
      monoHouses[i]=(monoHouses[i]||0)+1;
      monoStatBump(monoTurn,'housesBuilt',1);
      monoLogAdd(`🎁 ${p.name} erhält ein Gratis-Haus auf ${monoFields[i].name}.`);
    }
  }
  else if(fx.type==='destroyhouse'){
    const idxs=Object.keys(monoHouses).map(k=>+k).filter(i=>monoOwner[i]!==undefined&&monoOwner[i]!==monoTurn&&(monoHouses[i]||0)>0&&!monoPlayers[monoOwner[i]].bankrupt);
    if(!idxs.length){monoLogAdd(`💥 ${p.name} findet kein Haus zum Zerstören.`);}
    else{
      const i=idxs[Math.floor(Math.random()*idxs.length)];
      monoHouses[i]--;
      monoLogAdd(`💥 ${p.name} zerstört ein Haus auf ${monoFields[i].name} (${monoPlayers[monoOwner[i]].name}).`);
    }
  }
}
function monoApplyCard(c,depth){
  monoCardSteps(c).forEach(fx=>monoApplyCardStep(fx,depth));
}

/* ── Gefängnis ── */
function monoJailRoll(){
  const p=monoPlayers[monoTurn];
  const d1=1+Math.floor(Math.random()*6),d2=1+Math.floor(Math.random()*6);
  monoLastDice=[d1,d2];
  monoSuppressDoubleBonus=true;
  if(d1===d2){
    monoLogAdd(`🎲 ${p.name} würfelt Pasch (${d1}+${d2}) und kommt frei!`);
    p.inJail=false;p.jailTurns=0;
    monoMovePlayer(p,d1+d2);monoLandOn(p);
  } else {
    p.jailTurns++;
    monoLogAdd(`🎲 ${p.name} würfelt ${d1}+${d2} — kein Pasch (Versuch ${p.jailTurns}/3).`);
    if(p.jailTurns>=3){
      if(p.getOutCards>0){
        p.getOutCards--;
        monoLogAdd(`🎟️ ${p.name} nutzt nach 3 Versuchen eine Freikarte, um freizukommen.`);
        p.inJail=false;p.jailTurns=0;
        monoMovePlayer(p,d1+d2);monoLandOn(p);
      } else {
        const ok=monoEnsureFunds(p,50,null,'jailRoll3rd',{d1,d2});
        if(!ok)return;
        const actual=monoTake(p,50);
        if(monoRules.freeParkingPot)monoParkingPot+=actual;
        monoLogAdd(`🔒 ${p.name} musste nach 3 Versuchen ${actual}€ zahlen.`);
        p.inJail=false;p.jailTurns=0;
        monoMovePlayer(p,d1+d2);monoLandOn(p);
      }
    }
  }
  if(!monoModalType){monoCanRoll=false;monoCanEndTurn=true;monoSuppressDoubleBonus=false;}
  monoRenderAll();
}
function monoPayJailFine(){
  const p=monoPlayers[monoTurn];
  const ok=monoEnsureFunds(p,50,null,'payJailFine');
  if(!ok)return;
  const actual=monoTake(p,50);
  if(monoRules.freeParkingPot)monoParkingPot+=actual;
  p.inJail=false;p.jailTurns=0;
  monoLogAdd(`💵 ${p.name} zahlt ${actual}€ und kommt frei.`);
  monoCanRoll=true;monoRenderAll();
}
function monoUseJailCard(){
  const p=monoPlayers[monoTurn];if(p.getOutCards<=0)return;
  p.getOutCards--;p.inJail=false;p.jailTurns=0;
  monoLogAdd(`🎟️ ${p.name} nutzt eine Freikarte, um freizukommen.`);
  monoCanRoll=true;monoRenderAll();
}

/* ── Grundstücke verwalten ── */
function monoCanBuildHouse(i){
  const f=monoFields[i];if(f.type!=='property')return false;
  if(monoOwner[i]!==monoTurn)return false;
  if(!monoOwnsFullGroup(monoTurn,f.color))return false;
  const groupIdxs=monoFields.map((ff,ii)=>ff.type==='property'&&ff.color===f.color?ii:-1).filter(x=>x>=0);
  if(groupIdxs.some(ii=>monoMortgaged[ii]))return false;
  const myHouses=monoHouses[i]||0;
  if(myHouses>=5)return false;
  const minInGroup=Math.min(...groupIdxs.map(ii=>monoHouses[ii]||0));
  if(monoRules.evenBuildRule&&myHouses>minInGroup)return false;
  if(monoPlayers[monoTurn].money<f.houseCost)return false;
  return true;
}
function monoCanPlaceHouseFree(i){
  const f=monoFields[i];if(f.type!=='property')return false;
  if(monoOwner[i]!==monoTurn)return false;
  if(!monoOwnsFullGroup(monoTurn,f.color))return false;
  const groupIdxs=monoFields.map((ff,ii)=>ff.type==='property'&&ff.color===f.color?ii:-1).filter(x=>x>=0);
  if(groupIdxs.some(ii=>monoMortgaged[ii]))return false;
  const myHouses=monoHouses[i]||0;
  if(myHouses>=5)return false;
  const minInGroup=Math.min(...groupIdxs.map(ii=>monoHouses[ii]||0));
  if(monoRules.evenBuildRule&&myHouses>minInGroup)return false;
  return true;
}
function monoComputeHint(){
  const p=monoPlayers[monoTurn];if(!p)return '💡 Gerade nichts Besonderes zu tun.';
  for(let i=0;i<monoFields.length;i++){
    if(monoOwner[i]===monoTurn&&monoCanBuildHouse(i)){
      return `🏠 Du könntest auf ${monoFields[i].name} bauen (${monoFields[i].houseCost}€).`;
    }
  }
  for(let i=0;i<monoFields.length;i++){
    if(monoOwner[i]===monoTurn&&monoMortgaged[i]){
      const cost=Math.ceil((monoFields[i].price||0)*11/20);
      if(p.money>=cost)return `🏦 Du könntest ${monoFields[i].name} für ${cost}€ auslösen.`;
    }
  }
  const colors=[...new Set(monoFields.filter(f=>f.type==='property').map(f=>f.color))];
  for(const color of colors){
    const idxs=monoFields.map((f,i)=>f.type==='property'&&f.color===color?i:-1).filter(x=>x>=0);
    if(idxs.length<2)continue;
    const missing=idxs.filter(i=>monoOwner[i]!==monoTurn);
    const ownedByMe=idxs.length-missing.length;
    if(ownedByMe>0&&missing.length===1){
      const mi=missing[0];const ownerIdx=monoOwner[mi];
      if(ownerIdx!==undefined&&ownerIdx!==monoTurn&&!monoSameTeam(ownerIdx,monoTurn)){
        return `🧩 Dir fehlt nur ${monoFields[mi].name} für ein Monopol (${color}) – gehört ${monoPlayers[ownerIdx].name}.`;
      }
    }
  }
  return '💡 Gerade nichts Besonderes zu tun.';
}
function monoShowHint(){showToast(monoComputeHint(),4000);}
function monoBuildHouse(i){
  if(!monoCanBuildHouse(i))return;
  const f=monoFields[i];const p=monoPlayers[monoTurn];
  p.money-=f.houseCost;monoHouses[i]=(monoHouses[i]||0)+1;
  monoStatBump(monoTurn,'housesBuilt',1);
  monoLogAdd(`🏠 ${p.name} baut auf ${f.name} (${monoHouses[i]===5?'Hotel':monoHouses[i]+' Haus/Häuser'}).`);
  monoRenderAll();
}
function monoCanSellHouse(i){
  const f=monoFields[i];if(f.type!=='property'||monoOwner[i]!==monoTurn)return false;
  const myHouses=monoHouses[i]||0;if(myHouses<=0)return false;
  const groupIdxs=monoFields.map((ff,ii)=>ff.type==='property'&&ff.color===f.color?ii:-1).filter(x=>x>=0);
  const maxInGroup=Math.max(...groupIdxs.map(ii=>monoHouses[ii]||0));
  return myHouses>=maxInGroup;
}
function monoSellHouse(i){
  if(!monoCanSellHouse(i))return;
  const f=monoFields[i];const p=monoPlayers[monoTurn];
  monoHouses[i]=(monoHouses[i]||0)-1;p.money+=Math.floor(f.houseCost/2);
  monoLogAdd(`🏚️ ${p.name} verkauft ein Haus auf ${f.name}.`);
  monoRenderAll();
}
function monoMortgage(i){
  const f=monoFields[i];const p=monoPlayers[monoTurn];
  if(monoOwner[i]!==monoTurn||monoMortgaged[i]||(monoHouses[i]||0)>0)return;
  monoMortgaged[i]=true;p.money+=Math.floor((f.price||0)/2);
  monoLogAdd(`🏦 ${p.name} verpfändet ${f.name} (+${Math.floor((f.price||0)/2)}€).`);
  monoRenderAll();
}
function monoUnmortgage(i){
  const f=monoFields[i];const p=monoPlayers[monoTurn];
  if(monoOwner[i]!==monoTurn||!monoMortgaged[i])return;
  const cost=Math.ceil((f.price||0)*11/20);
  if(p.money<cost)return;
  p.money-=cost;monoMortgaged[i]=false;
  monoLogAdd(`🏦 ${p.name} löst ${f.name} für ${cost}€ aus.`);
  monoRenderAll();
}

/* ── Bankrott ── */
function monoDeclareBankrupt(){
  const p=monoPlayers[monoTurn];
  const creditor=monoRules.bankruptToBank?null:monoDebtCreditor();
  p.bankrupt=true;p.money=0;
  monoBankruptOrder.push(monoTurn);
  Object.keys(monoOwner).forEach(k=>{
    const i=+k;
    if(monoOwner[i]===monoTurn){
      if(creditor){
        monoOwner[i]=monoPlayers.indexOf(creditor);
        monoHouses[i]=0;
      } else {
        delete monoOwner[i];monoMortgaged[i]=false;monoHouses[i]=0;
      }
    }
  });
  monoLoans=monoLoans.filter(l=>l.playerIdx!==monoTurn);
  monoLogAdd(`💀 ${p.name} ist bankrott!`+(creditor?` Besitz geht an ${creditor.name}.`:' Besitz verfällt an die Bank.'));
  monoPendingDebt=null;monoModalType=null;
  if(monoGameShouldEnd()){
    monoGameOver=true;monoModalType='gameover';
    monoLogAdd(`🏆 ${monoWinnerMessage()} gewinnt das Spiel!`);
    monoHallOfFameRecordGame();
    if(typeof monoMetaOnGameOver==='function')monoMetaOnGameOver();
    monoUpdateEditTabsState();
    monoRenderAll();return;
  }
  monoNextTurn();monoRenderAll();
}
function monoResolveDebt(){
  const p=monoPlayers[monoTurn];const{amount}=monoPendingDebt;
  const creditor=monoDebtCreditor();
  p.money-=amount;if(creditor)creditor.money+=amount;
  monoLogAdd(`💸 ${p.name} zahlt ${amount}€.`);
  const pd=monoPendingDebt;monoPendingDebt=null;monoModalType=null;
  monoRunDebtResume(pd);
  monoRenderAll();
}

/* ── Render ── */
function monoLogAdd(msg){
  monoLog.unshift(msg);if(monoLog.length>60)monoLog.pop();
  monoRenderLog();
}
function monoRenderLog(){
  const el=document.getElementById('mono-log');if(el)el.innerHTML=monoLog.map(m=>`<div>${escHtml(m)}</div>`).join('');
}
function monoLowMoneyThreshold(){return Math.max(100,Math.round((monoRules.startMoney||1500)*0.1));}
function monoRenderPlayersPanel(){
  const el=document.getElementById('mono-players-panel');if(!el)return;
  const threshold=monoLowMoneyThreshold();
  el.innerHTML='<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:8px">Spieler</div>'+
    monoPlayers.map((p,i)=>{
      const loan=monoRules.loansEnabled?monoLoans.find(l=>l.playerIdx===i):null;
      const low=!p.bankrupt&&p.money<threshold;
      return `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;${p.bankrupt?'opacity:0.4;text-decoration:line-through;':''}${i===monoTurn?'font-weight:700;':''}">
      <span style="width:18px;height:18px;border-radius:50%;background:${p.color};flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;font-size:11px;line-height:1">${monoAvatarFor(p,i)}</span>
      <span style="flex:1;font-size:12px;color:var(--text)">${escHtml(p.name)}${monoRules.teamsEnabled&&p.team?` <span style="color:var(--text-3);font-weight:400">· Team ${escHtml(p.team)}</span>`:''}${loan?` <span title="Kredit: ${loan.amountDue}€ fällig in ${loan.turnsLeft} Zügen" style="color:var(--text-3);font-weight:400">🏦${loan.turnsLeft}</span>`:''}${low?` <span title="Kritisch wenig Geld!">⚠️</span>`:''}</span>
      <span style="font-size:12px;color:${low?'var(--danger)':'var(--text-2)'};font-weight:${low?'700':'400'}">${p.bankrupt?'Bankrott':p.money+'€'}</span>
    </div>`;
    }).join('');
}
function monoRenderMyLoans(){
  const myLoans=monoLoans.map((l,i)=>({l,i})).filter(x=>x.l.playerIdx===monoTurn);
  if(!myLoans.length)return '';
  return `<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:6px">Deine Kredite</div>
    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px">
    ${myLoans.map(({l,i})=>`<div style="background:var(--bg);border-radius:8px;padding:6px 8px">
      <div style="font-size:12px;margin-bottom:4px">Rest: <b>${l.amountDue}€</b> · fällig in ${l.turnsLeft} Zügen</div>
      <div style="display:flex;gap:6px;align-items:center">
        <input type="number" id="mono-loan-repay-${i}" min="0" max="${l.amountDue}" value="${l.amountDue}" style="width:80px;padding:4px 6px;background:var(--surface);border:0.5px solid var(--divider);border-radius:6px;color:var(--text);font-size:11px"/>
        <button class="timer-btn" onclick="monoRepayLoan(${i})" style="padding:4px 8px;font-size:11px">Zurückzahlen</button>
      </div>
    </div>`).join('')}
    </div>`;
}
function monoRenderActionsPanel(){
  const el=document.getElementById('mono-actions-panel');if(!el)return;
  if(monoGameOver){el.innerHTML='';return;}
  const loansHtml=monoRenderMyLoans();
  const owned=monoFields.map((f,i)=>({i,f})).filter(x=>monoOwner[x.i]===monoTurn);
  if(!owned.length){el.innerHTML=loansHtml+'<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:6px">Verwalten</div><div style="font-size:12px;color:var(--text-3)">Keine Grundstücke im Besitz</div>';return;}
  let html=loansHtml+'<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:8px">Verwalten</div><div style="display:flex;flex-direction:column;gap:6px;max-height:220px;overflow-y:auto">';
  owned.forEach(({i,f})=>{
    const mortgaged=monoMortgaged[i];const houses=monoHouses[i]||0;
    html+=`<div style="background:var(--bg);border-radius:8px;padding:6px 8px">
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-bottom:4px;gap:6px">
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(f.name)}${mortgaged?' <span style="color:var(--danger)">(verpfändet)</span>':''}</span>
        ${houses>0?`<span style="flex-shrink:0">${houses===5?'🏨':'🏠'.repeat(houses)}</span>`:''}
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">`;
    if(f.type==='property'&&!mortgaged){
      const canBuild=monoCanBuildHouse(i);
      html+=`<button class="timer-btn" ${canBuild?'':'disabled'} onclick="monoBuildHouse(${i})" style="padding:3px 8px;font-size:10px;${canBuild?'':'opacity:0.4'}">🏠 Bauen (${f.houseCost}€)</button>`;
      if(houses>0)html+=`<button class="timer-btn" onclick="monoSellHouse(${i})" style="padding:3px 8px;font-size:10px">Verkaufen (+${Math.floor(f.houseCost/2)}€)</button>`;
    }
    if(!mortgaged&&houses===0)html+=`<button class="timer-btn" onclick="monoMortgage(${i})" style="padding:3px 8px;font-size:10px">Verpfänden (+${Math.floor((f.price||0)/2)}€)</button>`;
    if(mortgaged){
      const cost=Math.ceil((f.price||0)*11/20);
      html+=`<button class="timer-btn" ${monoPlayers[monoTurn].money<cost?'disabled':''} onclick="monoUnmortgage(${i})" style="padding:3px 8px;font-size:10px">Auslösen (${cost}€)</button>`;
    }
    html+='</div></div>';
  });
  html+='</div>';
  el.innerHTML=html;
}
function monoRenderTurnInfo(){
  const el=document.getElementById('mono-turn-info');if(!el)return;
  if(monoGameOver){el.innerHTML='<div style="text-align:center;font-weight:700;color:var(--accent)">🏆 Spiel beendet</div>';return;}
  const p=monoPlayers[monoTurn];
  el.innerHTML=`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span style="width:22px;height:22px;border-radius:50%;background:${p.color};flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;font-size:13px;line-height:1">${monoAvatarFor(p,monoTurn)}</span>
      <div style="font-weight:700;color:var(--text)">${escHtml(p.name)} ist dran</div>
    </div>
    <div style="font-size:13px;color:${p.money<monoLowMoneyThreshold()?'var(--danger)':'var(--text-2)'};font-weight:${p.money<monoLowMoneyThreshold()?'700':'400'};margin-bottom:4px">💰 ${p.money}€${p.money<monoLowMoneyThreshold()?' ⚠️':''}${p.inJail?' · 🔒 im Gefängnis ('+p.jailTurns+'/3)':''}</div>
    <div style="font-size:12px;color:var(--text-3);margin-bottom:8px">📍 ${escHtml(monoFields[p.pos].name)}</div>
    ${monoRules.freeParkingPot?`<div style="font-size:12px;color:var(--text-3);text-align:center;margin-bottom:8px">🅿️ Frei Parken-Jackpot: <b>${monoParkingPot}€</b></div>`:''}
    ${typeof monoMetaPreviewHtml==='function'?monoMetaPreviewHtml(p,monoTurn):''}
    <div style="font-size:26px;text-align:center;margin-bottom:8px">${monoDiceFace(monoLastDice[0])} ${monoDiceFace(monoLastDice[1])}</div>
    ${p.isAI?`<div style="text-align:center;font-size:13px;color:var(--text-3);margin-bottom:8px">🤖 KI (${MONO_AI_PERSONALITIES[p.personality||'balanced'].icon} ${MONO_AI_PERSONALITIES[p.personality||'balanced'].label}) denkt…</div>`:`<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">
      <button class="timer-btn" ${monoPlayers.filter(pl=>!pl.bankrupt).length<2?'disabled':''} onclick="monoOpenTrade()" style="padding:6px 12px;font-size:12px">🤝 Handel</button>
      ${monoRules.loansEnabled?`<button class="timer-btn" ${monoCanTakeLoan(monoTurn)?'':'disabled title="Kreditlimit erreicht"'} onclick="monoOpenLoan()" style="padding:6px 12px;font-size:12px${monoCanTakeLoan(monoTurn)?'':';opacity:0.5'}">🏦 Kredit</button>`:''}
      ${monoRules.undoEnabled?`<button class="timer-btn" ${monoUndoSnapshot?'':'disabled title="Nichts rückgängig zu machen"'} onclick="monoUndo()" style="padding:6px 12px;font-size:12px${monoUndoSnapshot?'':';opacity:0.5'}">↩️ Rückgängig</button>`:''}
      <button class="timer-btn" onclick="monoToggleAutoRoll()" style="padding:6px 12px;font-size:12px;${monoAutoRoll?'background:var(--accent);color:#fff;border-color:var(--accent)':''}">${monoAutoRoll?'⏸ Autowürfel läuft':'🔁 Autowürfel'}</button>
      <button class="timer-btn" onclick="monoShowHint()" style="padding:6px 12px;font-size:12px">💡 Tipp</button>
    </div>`}
    <div id="mono-turn-btns" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"></div>
  `;
  monoRenderTurnButtons();
}
function monoRenderTurnButtons(){
  const el=document.getElementById('mono-turn-btns');if(!el)return;
  if(monoModalType){el.innerHTML='';return;}
  const p=monoPlayers[monoTurn];
  if(p.isAI){el.innerHTML='';return;}
  if(p.inJail){
    el.innerHTML=`<button class="btn-generate" style="width:auto;padding:8px 14px;font-size:12px" onclick="monoPayJailFine()">50€ zahlen</button>
      ${p.getOutCards>0?`<button class="timer-btn" style="padding:8px 14px;font-size:12px" onclick="monoUseJailCard()">🎟️ Freikarte nutzen</button>`:''}
      <button class="timer-btn" style="padding:8px 14px;font-size:12px" onclick="monoJailRoll()">🎲 Würfeln</button>`;
  } else if(monoCanRoll){
    el.innerHTML=`<button class="btn-generate" style="width:auto;padding:10px 24px" onclick="monoRollDice()">🎲 Würfeln</button>`;
  } else if(monoCanEndTurn){
    el.innerHTML=`<button class="btn-generate" style="width:auto;padding:10px 24px" onclick="monoEndTurn()">✅ Zug beenden</button>`;
  } else el.innerHTML='';
}
function monoRenderBuyModal(){
  const p=monoPlayers[monoTurn];const f=monoFields[monoModalField];
  document.getElementById('mono-modal-box').innerHTML=`
    <div style="font-weight:700;font-size:16px;margin-bottom:6px">${escHtml(f.name)}</div>
    <div style="font-size:13px;color:var(--text-2);margin-bottom:14px">Preis: ${f.price}€ · Dein Kontostand: ${p.money}€</div>
    <div style="display:flex;gap:8px;justify-content:center">
      <button class="btn-generate" ${p.money<f.price?'disabled':''} onclick="monoBuyCurrent()" style="width:auto;padding:10px 20px;${p.money<f.price?'opacity:0.5':''}">Kaufen</button>
      <button class="timer-btn" onclick="monoDeclineBuy()" style="padding:10px 20px">Nicht kaufen</button>
    </div>`;
}
function monoRenderCardModal(){
  const c=monoPendingCard;if(!c)return;
  document.getElementById('mono-modal-box').innerHTML=`
    <div style="font-size:12px;color:var(--text-3);text-transform:uppercase;font-weight:700;margin-bottom:8px">${c.deckLabel}</div>
    <div style="font-size:15px;color:var(--text);margin-bottom:16px;line-height:1.5">${escHtml(monoCardDisplayText(c))}</div>
    <div style="text-align:center"><button class="btn-generate" onclick="monoCardAck()" style="width:auto;padding:10px 24px">OK</button></div>`;
}
function monoRenderDebtModal(){
  const p=monoPlayers[monoTurn];const need=monoPendingDebt.amount;
  const owned=monoFields.map((f,i)=>({i,f})).filter(x=>monoOwner[x.i]===monoTurn);
  let html=`<div style="font-weight:700;margin-bottom:8px">💳 Du brauchst ${need}€, hast aber nur ${p.money}€</div>
    <div style="font-size:12px;color:var(--text-3);margin-bottom:10px">Verkaufe Häuser oder verpfände Grundstücke, um Geld zu beschaffen.</div>
    <div style="display:flex;flex-direction:column;gap:6px;max-height:240px;overflow-y:auto;margin-bottom:12px">`;
  owned.forEach(({i,f})=>{
    const houses=monoHouses[i]||0;
    if(f.type==='property'&&houses>0){
      html+=`<div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg);padding:6px 10px;border-radius:8px">
        <span style="font-size:12px">${escHtml(f.name)} (${houses===5?'Hotel':houses+' Haus/Häuser'})</span>
        <button class="timer-btn" onclick="monoSellHouse(${i});monoRenderDebtModal()" style="padding:4px 10px;font-size:11px">Verkaufen (+${Math.floor(f.houseCost/2)}€)</button>
      </div>`;
    }
  });
  owned.forEach(({i,f})=>{
    if((f.type==='property'||f.type==='railroad'||f.type==='utility')&&!monoMortgaged[i]&&!(monoHouses[i]>0)){
      html+=`<div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg);padding:6px 10px;border-radius:8px">
        <span style="font-size:12px">${escHtml(f.name)}</span>
        <button class="timer-btn" onclick="monoMortgage(${i});monoRenderDebtModal()" style="padding:4px 10px;font-size:11px">Verpfänden (+${Math.floor((f.price||0)/2)}€)</button>
      </div>`;
    }
  });
  if(monoRules.loansEnabled&&p.money<need){
    const shortfall=need-p.money;
    const amountDue=Math.round(shortfall*(1+(monoRules.loanInterestPercent||0)/100));
    const canLoan=monoCanTakeLoan(monoTurn);
    html+=`<div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg);padding:6px 10px;border-radius:8px;margin-bottom:12px">
      <span style="font-size:12px">🏦 Kredit über ${shortfall}€ (Rückzahlung: ${amountDue}€ in ${monoRules.loanMaxTurns||10} Zügen)${canLoan?'':' – Limit erreicht'}</span>
      <button class="timer-btn" ${canLoan?'':'disabled'} onclick="monoDebtTakeLoan()" style="padding:4px 10px;font-size:11px${canLoan?'':';opacity:0.5'}">Aufnehmen</button>
    </div>`;
  }
  html+=`
    <div style="display:flex;gap:8px;justify-content:center">
      <button class="btn-generate" ${p.money<need?'disabled':''} onclick="monoResolveDebt()" style="width:auto;padding:10px 20px;${p.money<need?'opacity:0.5':''}">Zahlen (${need}€)</button>
      <button class="timer-btn" style="background:rgba(255,59,48,0.1);color:var(--danger);border-color:rgba(255,59,48,0.3)" onclick="monoDeclareBankrupt()">Bankrott erklären</button>
    </div>`;
  document.getElementById('mono-modal-box').innerHTML=html;
}
function monoDebtTakeLoan(){
  if(!monoRules.loansEnabled||monoModalType!=='debt'||!monoPendingDebt)return;
  if(!monoCanTakeLoan(monoTurn)){showToast(`Maximal ${monoRules.maxLoansPerPlayer} gleichzeitige Kredite erlaubt`);return;}
  const p=monoPlayers[monoTurn];const need=monoPendingDebt.amount;
  const shortfall=need-p.money;if(shortfall<=0)return;
  const interest=monoRules.loanInterestPercent||0;
  const turns=monoRules.loanMaxTurns||10;
  const amountDue=Math.round(shortfall*(1+interest/100));
  p.money+=shortfall;
  monoLoans.push({playerIdx:monoTurn,principal:shortfall,amountDue,interestPercent:interest,turnsLeft:turns});
  monoStatBump(monoTurn,'loansTaken',1);
  monoLogAdd(`🏦 ${p.name} nimmt einen Kredit über ${shortfall}€ auf, um eine Schuld zu decken (Rückzahlung: ${amountDue}€ in ${turns} Zügen).`);
  monoRenderAll();
}
function monoFullGroupCount(idx){
  const colors=[...new Set(monoFields.filter(f=>f.type==='property').map(f=>f.color))];
  return colors.filter(c=>monoOwnsFullGroup(idx,c)).length;
}
function monoHotelCount(idx){
  return Object.keys(monoOwner).filter(k=>monoOwner[k]===idx&&(monoHouses[k]||0)===5).length;
}
function monoMortgagedCount(idx){
  return Object.keys(monoOwner).filter(k=>monoOwner[k]===idx&&monoMortgaged[k]).length;
}
const MONO_BADGE_DEFS=[
  {key:'richest',icon:'💰',label:'Krösus',desc:'Höchstes je erreichtes Vermögen (netto)',stat:'peakNetWorth',unit:'€'},
  {key:'poorest',icon:'🍂',label:'Pechvogel',desc:'Niedrigstes je erreichtes Vermögen (netto)',stat:'peakNetWorth',unit:'€',agg:'min'},
  {key:'builder',icon:'🏗️',label:'Baumeister',desc:'Die meisten Häuser gebaut',stat:'housesBuilt',unit:''},
  {key:'hotelier',icon:'🏨',label:'Hotelier',desc:'Die meisten Hotels im Besitz (Spielende)',stat:null,unit:''},
  {key:'realestate',icon:'🏢',label:'Immobilienkönig',desc:'Die meisten Grundstücke im Besitz (Spielende)',stat:null,unit:''},
  {key:'monopolist',icon:'🧩',label:'Monopolist',desc:'Die meisten kompletten Farbgruppen im Besitz (Spielende)',stat:null,unit:''},
  {key:'mortgagee',icon:'🏦',label:'Verpfänder',desc:'Die meisten verpfändeten Grundstücke (Spielende)',stat:null,unit:''},
  {key:'jailbird',icon:'🔒',label:'Dauergast',desc:'Am häufigsten im Gefängnis gelandet',stat:'jailVisits',unit:''},
  {key:'landlord',icon:'🤝',label:'Vermieter-König',desc:'Am meisten von Mitspielern kassiert',stat:'collectedFromPlayers',unit:'€'},
  {key:'spender',icon:'💸',label:'Zahlmeister',desc:'Am meisten an Mitspieler gezahlt',stat:'paidToPlayers',unit:'€'},
  {key:'drawer',icon:'🎴',label:'Kartenjunkie',desc:'Die meisten Karten gezogen',stat:'cardsDrawn',unit:''},
  {key:'traveler',icon:'🎲',label:'Weltenbummler',desc:'Am häufigsten an Los vorbeigezogen',stat:'passedGo',unit:''},
  {key:'gambler',icon:'🍀',label:'Würfelglück',desc:'Die meisten Pasche gewürfelt',stat:'doublesRolled',unit:''},
  {key:'trader',icon:'🔁',label:'Verhandlungskünstler',desc:'Die meisten Handel abgeschlossen',stat:'tradesCompleted',unit:''},
  {key:'debtor',icon:'🏧',label:'Zockernatur',desc:'Die meisten Kredite aufgenommen',stat:'loansTaken',unit:''},
  {key:'cashking',icon:'💵',label:'Bargeld-König',desc:'Höchster je gehaltener Kontostand (Bargeld)',stat:'peakMoney',unit:'€'},
  {key:'rentmaster',icon:'🏠',label:'Miet-Ass',desc:'Höchste auf einmal kassierte Miete',stat:'biggestRentCollected',unit:'€'},
  {key:'rentvictim',icon:'😬',label:'Pechmiete',desc:'Höchste je auf einmal gezahlte Miete',stat:'biggestRentPaid',unit:'€'},
  {key:'roller',icon:'🎯',label:'Vielwürfler',desc:'Die meisten Würfelwürfe insgesamt',stat:'totalRolls',unit:''},
  {key:'firstout',icon:'💀',label:'Erster Bankrotteur',desc:'Als Erste(r) bankrott gegangen',stat:null,unit:''}
];
const MONO_BADGE_BOARD_FNS={hotelier:monoHotelCount,realestate:monoOwnedFieldCount,monopolist:monoFullGroupCount,mortgagee:monoMortgagedCount};
function monoComputeBadges(){
  const badges=[];
  MONO_BADGE_DEFS.forEach(def=>{
    if(def.key==='firstout'){
      if(monoBankruptOrder.length&&monoPlayers[monoBankruptOrder[0]])badges.push({...def,playerIdx:monoBankruptOrder[0],value:null});
      return;
    }
    if(MONO_BADGE_BOARD_FNS[def.key]){
      const fn=MONO_BADGE_BOARD_FNS[def.key];
      let bestIdx=-1,bestVal=0;
      monoPlayers.forEach((p,i)=>{const v=fn(i);if(v>bestVal){bestVal=v;bestIdx=i;}});
      if(bestIdx>=0)badges.push({...def,playerIdx:bestIdx,value:bestVal});
      return;
    }
    const isMin=def.agg==='min';
    let bestIdx=-1,bestVal=isMin?Infinity:0;
    monoStats.forEach((s,i)=>{
      const v=(s&&s[def.stat])||0;
      if(isMin?v<bestVal:v>bestVal){bestVal=v;bestIdx=i;}
    });
    if(bestIdx>=0&&(!isMin||bestVal<Infinity))badges.push({...def,playerIdx:bestIdx,value:bestVal});
  });
  return badges;
}
const MONO_MILESTONE_DEFS=[
  {key:'traveler3',icon:'🧳',label:'Vielreisender',desc:'Mindestens 3× an Los vorbeigezogen',check:i=>(monoStats[i]&&monoStats[i].passedGo||0)>=3},
  {key:'cardaddict',icon:'🎴',label:'Kartensüchtig',desc:'Mindestens 10 Karten gezogen',check:i=>(monoStats[i]&&monoStats[i].cardsDrawn||0)>=10},
  {key:'jailrepeat',icon:'🔓',label:'Wiederholungstäter',desc:'Mindestens 3× im Gefängnis gelandet',check:i=>(monoStats[i]&&monoStats[i].jailVisits||0)>=3},
  {key:'buildboom',icon:'🏗️',label:'Bauboom',desc:'Mindestens 10 Häuser gebaut',check:i=>(monoStats[i]&&monoStats[i].housesBuilt||0)>=10},
  {key:'luckyroller',icon:'🍀',label:'Glückspilz',desc:'Mindestens 5× einen Pasch gewürfelt',check:i=>(monoStats[i]&&monoStats[i].doublesRolled||0)>=5},
  {key:'dealmaker',icon:'🔁',label:'Verhandlungsprofi',desc:'Mindestens 3 Handel abgeschlossen',check:i=>(monoStats[i]&&monoStats[i].tradesCompleted||0)>=3},
  {key:'sharkloan',icon:'🏧',label:'Kredithai',desc:'Mindestens 3 Kredite aufgenommen',check:i=>(monoStats[i]&&monoStats[i].loansTaken||0)>=3},
  {key:'bigspender',icon:'💸',label:'Großzügig',desc:'Mindestens 1000€ an Mitspieler gezahlt',check:i=>(monoStats[i]&&monoStats[i].paidToPlayers||0)>=1000},
  {key:'bigearner',icon:'🤑',label:'Kassierer',desc:'Mindestens 1000€ von Mitspielern kassiert',check:i=>(monoStats[i]&&monoStats[i].collectedFromPlayers||0)>=1000},
  {key:'hotelowner',icon:'🏨',label:'Hotelbesitzer',desc:'Am Spielende mindestens ein Hotel besessen',check:i=>monoHotelCount(i)>=1},
  {key:'colorgroup',icon:'🧩',label:'Farbsammler',desc:'Am Spielende mindestens eine komplette Farbgruppe besessen',check:i=>monoFullGroupCount(i)>=1},
  {key:'triplejail',icon:'🚔',label:'Pasch-Pech',desc:'3× in Folge Pasch gewürfelt und dadurch ins Gefängnis gewandert',check:i=>(monoStats[i]&&monoStats[i].tripleDoubles||0)>=1},
  {key:'debtfree',icon:'✅',label:'Schuldenfrei',desc:'Mindestens einen Kredit vollständig zurückgezahlt',check:i=>(monoStats[i]&&monoStats[i].loansRepaid||0)>=1},
  {key:'marathon',icon:'🏃',label:'Marathon-Spieler',desc:'Mindestens 20× gewürfelt',check:i=>(monoStats[i]&&monoStats[i].totalRolls||0)>=20},
  {key:'megarent',icon:'💥',label:'Großgrundbesitzer',desc:'Mindestens 200€ Miete auf einmal kassiert',check:i=>(monoStats[i]&&monoStats[i].biggestRentCollected||0)>=200},
  {key:'fatcat',icon:'🐈',label:'Dicke Katze',desc:'Mindestens 2000€ Bargeld gleichzeitig besessen',check:i=>(monoStats[i]&&monoStats[i].peakMoney||0)>=2000},
  {key:'landbaron',icon:'🗺️',label:'Landbaron',desc:'Am Spielende mindestens 5 Grundstücke besessen',check:i=>monoOwnedFieldCount(i)>=5},
  {key:'doublemonopoly',icon:'🏘️',label:'Doppel-Monopolist',desc:'Am Spielende mindestens zwei komplette Farbgruppen besessen',check:i=>monoFullGroupCount(i)>=2}
];
function monoComputeMilestones(){
  const out=[];
  monoPlayers.forEach((p,i)=>{
    MONO_MILESTONE_DEFS.forEach(def=>{if(def.check(i))out.push({...def,playerIdx:i});});
  });
  return out;
}
const MONO_TEAM_BADGE_DEFS=[
  {key:'teamRichest',icon:'👑',label:'Team-Krösus',desc:'Höchstes gemeinsames Vermögen (netto)',unit:'€',calc:idxs=>idxs.reduce((s,i)=>s+monoNetWorth(i),0)},
  {key:'teamBuilder',icon:'🏗️',label:'Team-Baumeister',desc:'Die meisten gemeinsam gebauten Häuser',unit:'',calc:idxs=>idxs.reduce((s,i)=>s+((monoStats[i]&&monoStats[i].housesBuilt)||0),0)},
  {key:'teamLandlord',icon:'🤝',label:'Team-Vermieter',desc:'Am meisten gemeinsam von Gegnern kassiert',unit:'€',calc:idxs=>idxs.reduce((s,i)=>s+((monoStats[i]&&monoStats[i].collectedFromPlayers)||0),0)},
  {key:'teamTrader',icon:'🔁',label:'Team-Verhandler',desc:'Die meisten gemeinsam abgeschlossenen Handel',unit:'',calc:idxs=>idxs.reduce((s,i)=>s+((monoStats[i]&&monoStats[i].tradesCompleted)||0),0)}
];
function monoTeamGroups(){
  const groups={};
  monoPlayers.forEach((p,i)=>{
    if(p.team==null)return;
    if(!groups[p.team])groups[p.team]=[];
    groups[p.team].push(i);
  });
  return groups;
}
function monoComputeTeamBadges(){
  if(!monoRules.teamsEnabled)return[];
  const groups=monoTeamGroups();
  const teamNames=Object.keys(groups);
  if(teamNames.length<2)return[];
  const badges=[];
  MONO_TEAM_BADGE_DEFS.forEach(def=>{
    let bestTeam=null,bestVal=0;
    teamNames.forEach(name=>{
      const val=def.calc(groups[name]);
      if(val>bestVal){bestVal=val;bestTeam=name;}
    });
    if(bestTeam)badges.push({...def,team:bestTeam,value:bestVal,memberIdxs:groups[bestTeam]});
  });
  return badges;
}
function monoCheckMilestoneToasts(){
  if(!monoPlayers.length||monoGameOver)return;
  monoComputeMilestones().forEach(m=>{
    const seenKey=m.playerIdx+':'+m.key;
    if(monoMilestonesShown.has(seenKey))return;
    monoMilestonesShown.add(seenKey);
    const p=monoPlayers[m.playerIdx];
    showToast(`${m.icon} ${p.name}: „${m.label}" erreicht!`,3500);
  });
}
function monoBadgeLegendGroupHtml(title,hint,defs){
  return `<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin:14px 0 6px">${title}</div>
    <div style="font-size:11px;color:var(--text-3);margin-bottom:8px">${hint}</div>
    ${defs.map(b=>`<div style="display:flex;gap:12px;align-items:center;background:var(--surface);border:0.5px ${b.check?'dashed var(--accent)':'solid var(--divider)'};border-radius:12px;padding:12px 14px;margin-bottom:8px">
      <div style="font-size:26px;flex-shrink:0;line-height:1">${b.icon}</div>
      <div>
        <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:2px">${escHtml(b.label)}</div>
        <div style="font-size:12px;color:var(--text-3)">${escHtml(b.desc)}</div>
      </div>
    </div>`).join('')}`;
}
/* ── Hall of Fame (über mehrere Partien hinweg, nach Spielername) ── */
function monoHallOfFameLoad(){
  try{const s=localStorage.getItem('zf_mono_halloffame');return s?JSON.parse(s):{};}catch(e){return{};}
}
function monoHallOfFameSave(hof){try{localStorage.setItem('zf_mono_halloffame',JSON.stringify(hof));}catch(e){}}
function monoHallOfFameRecordGame(){
  const hof=monoHallOfFameLoad();
  const badges=monoComputeBadges();
  const milestones=monoComputeMilestones();
  const winners=monoWinners();
  monoPlayers.forEach((p,i)=>{
    const name=(p.name||'').trim();if(!name)return;
    if(!hof[name])hof[name]={games:0,wins:0,badges:{},milestones:{}};
    const rec=hof[name];
    rec.games++;
    if(winners.includes(p))rec.wins++;
    badges.filter(b=>b.playerIdx===i).forEach(b=>{rec.badges[b.key]=(rec.badges[b.key]||0)+1;});
    milestones.filter(m=>m.playerIdx===i).forEach(m=>{rec.milestones[m.key]=(rec.milestones[m.key]||0)+1;});
  });
  monoHallOfFameSave(hof);
}
function monoHallOfFameChipsHtml(counts,defs,milestone){
  return Object.entries(counts).map(([key,count])=>{
    const def=defs.find(d=>d.key===key);if(!def)return '';
    return `<span title="${escHtml(def.label)}" style="font-size:10px;background:var(--surface);border:0.5px ${milestone?'dashed var(--accent)':'solid var(--divider)'};border-radius:12px;padding:2px 7px;white-space:nowrap">${def.icon} ${count}×</span>`;
  }).join('');
}
let monoHofSortedNames=[];
function monoRenderHallOfFame(){
  const hof=monoHallOfFameLoad();
  const names=Object.keys(hof);
  if(!names.length){monoHofSortedNames=[];return `<div style="font-size:12px;color:var(--text-3);text-align:center;padding:16px 0">Noch keine abgeschlossene Partie – füllt sich nach dem ersten Spielende.</div>`;}
  const rows=names.map(name=>{
    const r=hof[name];
    const total=Object.values(r.badges).reduce((a,b)=>a+b,0)+Object.values(r.milestones).reduce((a,b)=>a+b,0);
    return{name,...r,total};
  }).sort((a,b)=>b.total-a.total||b.wins-a.wins);
  monoHofSortedNames=rows.map(r=>r.name);
  return rows.map((r,idx)=>{
    const chips=monoHallOfFameChipsHtml(r.badges,MONO_BADGE_DEFS,false)+monoHallOfFameChipsHtml(r.milestones,MONO_MILESTONE_DEFS,true);
    return `<div style="background:var(--bg);border-radius:10px;padding:10px 12px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="flex:1;font-size:13px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(r.name)}</span>
        <span style="font-size:11px;color:var(--text-3);flex-shrink:0">${r.games} Spiel${r.games===1?'':'e'} · 🏆 ${r.wins}</span>
        <button onclick="monoHallOfFameDeleteAt(${idx})" title="Eintrag löschen" style="flex-shrink:0;padding:2px 7px;font-size:11px;border-radius:6px;border:0.5px solid var(--divider);background:var(--surface);color:var(--text-3);cursor:pointer">✕</button>
      </div>
      ${chips?`<div style="display:flex;flex-wrap:wrap;gap:4px">${chips}</div>`:'<div style="font-size:11px;color:var(--text-3)">Noch keine Auszeichnung</div>'}
    </div>`;
  }).join('');
}
function monoHallOfFameDeleteAt(idx){
  const name=monoHofSortedNames[idx];if(name==null)return;
  appConfirm(`Hall-of-Fame-Eintrag für „${name}" löschen? Das kann nicht rückgängig gemacht werden.`,()=>{
    const hof=monoHallOfFameLoad();
    delete hof[name];
    monoHallOfFameSave(hof);
    monoRenderBadgesTab();
    showToast('Eintrag gelöscht ✓');
  });
}
function monoHallOfFameResetConfirm(){
  appConfirm('Hall of Fame wirklich zurücksetzen? Das kann nicht rückgängig gemacht werden.',()=>{
    try{localStorage.removeItem('zf_mono_halloffame');}catch(e){}
    monoRenderBadgesTab();
    showToast('Hall of Fame zurückgesetzt ✓');
  });
}
function monoRenderBadgesTab(){
  const wrap=document.getElementById('mono-badges-list');if(!wrap)return;
  wrap.innerHTML=
    monoBadgeLegendGroupHtml('Bestenlisten','Nur der/die Spieler(in) mit dem besten Wert bekommt die Auszeichnung.',MONO_BADGE_DEFS)+
    monoBadgeLegendGroupHtml('Meilensteine','Ab einem Schwellenwert – kann jede(r), auch mehrere Spieler gleichzeitig, erreichen.',MONO_MILESTONE_DEFS)+
    monoBadgeLegendGroupHtml('Team-Auszeichnungen','Nur im Team-Modus (mind. 2 Teams) – bezieht sich auf die Summe des ganzen Teams statt auf einzelne Spieler.',MONO_TEAM_BADGE_DEFS)+
    `<div style="display:flex;align-items:center;justify-content:space-between;margin:14px 0 6px">
      <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em">Hall of Fame</div>
      <button class="timer-btn" onclick="monoHallOfFameResetConfirm()" style="padding:4px 10px;font-size:10px">Zurücksetzen</button>
    </div>
    <div style="font-size:11px;color:var(--text-3);margin-bottom:8px">Sammelt Auszeichnungen über alle Partien hinweg – zugeordnet nach dem im Setup eingegebenen Spielernamen.</div>
    ${monoRenderHallOfFame()}`;
}
const MONO_CONFETTI_COLORS=['#e53935','#1e88e5','#43a047','#fdd835','#8e24aa','#fb8c00','#00acc1','#6d4c41'];
function monoConfettiHtml(){
  let pieces='';
  for(let i=0;i<60;i++){
    const color=MONO_CONFETTI_COLORS[i%MONO_CONFETTI_COLORS.length];
    const left=(Math.random()*100).toFixed(1);
    const delay=(Math.random()*0.7).toFixed(2);
    const duration=(2.2+Math.random()*1.6).toFixed(2);
    const rotate=Math.floor(Math.random()*360);
    const w=(5+Math.random()*6).toFixed(1);
    pieces+=`<span style="position:fixed;top:-20px;left:${left}%;width:${w}px;height:${(w*0.4).toFixed(1)}px;background:${color};opacity:0.9;transform:rotate(${rotate}deg);animation:monoConfettiFall ${duration}s ${delay}s ease-in forwards;border-radius:2px"></span>`;
  }
  return `<style>@keyframes monoConfettiFall{to{transform:translateY(100vh) rotate(720deg);opacity:0}}</style>${pieces}`;
}
function monoRenderGameOverModal(){
  const hasWinner=monoWinners().length>0;
  const badges=monoComputeBadges();
  const milestones=monoComputeMilestones();
  const teamBadges=monoComputeTeamBadges();
  const rows=monoPlayers.map((p,i)=>({
    p,i,worth:monoNetWorth(i),
    chips:[
      ...badges.filter(b=>b.playerIdx===i).map(b=>({...b,milestone:false})),
      ...milestones.filter(m=>m.playerIdx===i).map(m=>({...m,milestone:true}))
    ]
  })).sort((a,b)=>b.worth-a.worth);
  document.getElementById('mono-modal-box').innerHTML=`
    ${hasWinner?monoConfettiHtml():''}
    <div style="text-align:center">
      <div style="font-size:40px;margin-bottom:6px">🏆</div>
      <div style="font-size:18px;font-weight:700;color:var(--text);margin-bottom:2px">${hasWinner?monoWinnerMessage(true)+' gewinnt!':'Spiel beendet'}</div>
      <div style="font-size:11px;color:var(--text-3);margin-bottom:12px">Nachspielstatistik</div>
    </div>
    ${monoStatsSvg()}
    <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto">
      ${rows.map((r,rank)=>`<div style="background:var(--bg);border-radius:8px;padding:8px 10px;${r.p.bankrupt?'opacity:0.5':''}">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:11px;color:var(--text-3);width:14px;flex-shrink:0">${rank+1}.</span>
          <span style="width:18px;height:18px;border-radius:50%;background:${r.p.color};flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;font-size:11px;line-height:1">${monoAvatarFor(r.p,r.i)}</span>
          <span style="flex:1;font-size:13px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(r.p.name)}${r.p.isAI?' 🤖'+MONO_AI_PERSONALITIES[r.p.personality||'balanced'].icon:''}${r.p.bankrupt?' (bankrott)':''}</span>
          <span style="font-size:13px;font-weight:700;flex-shrink:0">${r.worth}€</span>
        </div>
        ${r.chips.length?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;padding-left:22px">${r.chips.map(b=>`<span title="${escHtml(b.desc)}${b.value?' ('+b.value+(b.unit||'')+')':''}" style="font-size:10px;background:var(--surface);border:0.5px ${b.milestone?'dashed var(--accent)':'solid var(--divider)'};border-radius:12px;padding:2px 7px;white-space:nowrap">${b.icon} ${b.label}</span>`).join('')}</div>`:''}
      </div>`).join('')}
    </div>
    ${teamBadges.length?`<div style="margin-top:14px">
      <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">Team-Auszeichnungen</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${teamBadges.map(b=>`<div style="display:flex;align-items:center;gap:8px;background:var(--bg);border-radius:8px;padding:6px 10px">
          <span style="font-size:16px;flex-shrink:0">${b.icon}</span>
          <span style="flex:1;font-size:12px;color:var(--text)"><b>${escHtml(b.label)}</b>: Team „${escHtml(b.team)}" (${b.memberIdxs.map(i=>escHtml(monoPlayers[i].name)).join(', ')})</span>
          <span style="font-size:12px;font-weight:700;flex-shrink:0">${b.value}${b.unit||''}</span>
        </div>`).join('')}
      </div>
    </div>`:''}
    ${typeof monoMetaModalHtml==='function'?monoMetaModalHtml():''}
    ${typeof monoMetaButtonsHtml==='function'?monoMetaButtonsHtml():'<div style="text-align:center;margin-top:14px"><button class="btn-generate" onclick="monoAbandonGame()" style="width:auto;padding:10px 24px">Neues Spiel</button></div>'}
  `;
}
function monoRenderAll(){
  if(!monoPlayers.length)return;
  if(typeof rplPush==='function')rplPush('mono',{turn:monoTurn,pos:monoPlayers.map(p=>p.pos||0),mon:monoPlayers.map(p=>p.money),own:{...monoOwner},out:monoPlayers.map((p,i)=>p.bankrupt?i:-1).filter(i=>i>=0)});
  monoRenderBoard();monoRenderTurnInfo();monoRenderPlayersPanel();monoRenderActionsPanel();monoRenderLog();
  const overlay=document.getElementById('mono-modal-overlay');if(!overlay)return;
  if(monoModalType){
    overlay.style.display='flex';
    if(monoModalType==='buy')monoRenderBuyModal();
    else if(monoModalType==='card')monoRenderCardModal();
    else if(monoModalType==='debt')monoRenderDebtModal();
    else if(monoModalType==='trade')monoRenderTradeModal();
    else if(monoModalType==='stats')monoRenderStatsModal();
    else if(monoModalType==='tradehistory')monoRenderTradeHistoryModal();
    else if(monoModalType==='loan')monoRenderLoanModal();
    else if(monoModalType==='aiOffer')monoRenderAiOfferModal();
    else if(monoModalType==='gameover')monoRenderGameOverModal();
  } else overlay.style.display='none';
  monoCheckMilestoneToasts();
  monoAutoRollStep();
  monoAiTurnStep();
  monoSaveGame();
}

/* ── Autowürfel ── */
function monoToggleAutoRoll(){
  monoAutoRoll=!monoAutoRoll;
  if(monoAutoRoll)monoAutoRollStep();else clearTimeout(monoAutoRollTimer);
  monoRenderTurnInfo();
}
function monoAutoRollStep(){
  clearTimeout(monoAutoRollTimer);
  if(!monoAutoRoll||monoGameOver||!monoPlayers.length||monoModalType)return;
  if(monoPlayers[monoTurn]&&monoPlayers[monoTurn].isAI)return;
  monoAutoRollTimer=setTimeout(()=>{
    if(!monoAutoRoll||monoGameOver||monoModalType)return;
    if(!monoIsVisible()){monoAutoRollStep();return;}
    const p=monoPlayers[monoTurn];if(p.bankrupt||p.isAI)return;
    if(p.inJail)monoJailRoll();
    else if(monoCanRoll)monoRollDice();
    else if(monoCanEndTurn)monoEndTurn();
  },700);
}

/* ── KI-Spieler ── */
let monoAiTimer=null;
let monoAiOfferMade=false;
let monoAiOffer=null;
function monoAiDiff(){return monoRules.aiDifficulty==='easy'?'easy':'hard';}
function monoAiMaybeBuild(){
  const p=monoPlayers[monoTurn];if(!p||!p.isAI)return;
  const RESERVE=monoAiDiff()==='easy'?0:Math.round(150*monoAiPersonality(monoTurn).reserveMult);
  let built=true,guard=0;
  while(built&&guard++<50){
    built=false;
    const candidates=[];
    for(let i=0;i<monoFields.length;i++){
      if(monoOwner[i]!==monoTurn)continue;
      if(!monoCanBuildHouse(i))continue;
      if(p.money-monoFields[i].houseCost<RESERVE)continue;
      candidates.push(i);
    }
    if(!candidates.length)break;
    if(monoAiDiff()==='hard')candidates.sort((a,b)=>monoFields[a].houseCost-monoFields[b].houseCost);
    monoBuildHouse(candidates[0]);built=true;
  }
}
function monoAiMaybeUnmortgage(){
  const p=monoPlayers[monoTurn];if(!p||!p.isAI)return;
  const RESERVE=monoAiDiff()==='easy'?0:Math.round(150*monoAiPersonality(monoTurn).reserveMult);
  let acted=true,guard=0;
  while(acted&&guard++<50){
    acted=false;
    const candidates=[];
    for(let i=0;i<monoFields.length;i++){
      if(monoOwner[i]!==monoTurn)continue;
      if(!monoMortgaged[i])continue;
      const cost=Math.ceil((monoFields[i].price||0)*11/20);
      if(p.money-cost<RESERVE)continue;
      candidates.push(i);
    }
    if(!candidates.length)break;
    if(monoAiDiff()==='hard')candidates.sort((a,b)=>(monoFields[a].price||0)-(monoFields[b].price||0));
    monoUnmortgage(candidates[0]);acted=true;
  }
}
function monoAiDecideBuy(){
  if(monoModalType!=='buy')return;
  const p=monoPlayers[monoTurn];if(!p||!p.isAI)return;
  const f=monoFields[monoModalField];
  if(monoAiDiff()==='easy'){
    if(p.money>=f.price)monoBuyCurrent();else monoDeclineBuy();
    return;
  }
  const mult=monoAiPersonality(monoTurn).reserveMult;
  let reserve=Math.round(150*mult);
  if(f.type==='property'&&f.color){
    const ownedInGroup=monoFields.filter((ff,i)=>ff.type==='property'&&ff.color===f.color&&monoOwner[i]===monoTurn).length;
    if(ownedInGroup>0)reserve=Math.round(50*mult);
  }
  if(p.money-f.price>=reserve)monoBuyCurrent();else monoDeclineBuy();
}
function monoAiResolveDebt(){
  if(monoModalType!=='debt')return;
  const p=monoPlayers[monoTurn];if(!p||!p.isAI)return;
  const need=monoPendingDebt.amount;
  const hard=monoAiDiff()==='hard';
  let guard=0;
  while(p.money<need&&guard++<80){
    const owned=monoFields.map((f,i)=>i).filter(i=>monoOwner[i]===monoTurn);
    const sellable=owned.filter(i=>monoCanSellHouse(i));
    if(sellable.length){monoSellHouse(sellable[0]);continue;}
    let mortgageable=owned.filter(i=>!monoMortgaged[i]&&(monoHouses[i]||0)===0);
    if(hard){
      mortgageable.sort((a,b)=>{
        const fa=monoFields[a],fb=monoFields[b];
        const aMono=(fa.type==='property'&&monoOwnsFullGroup(monoTurn,fa.color))?1:0;
        const bMono=(fb.type==='property'&&monoOwnsFullGroup(monoTurn,fb.color))?1:0;
        return aMono-bMono;
      });
    }
    if(mortgageable.length){monoMortgage(mortgageable[0]);continue;}
    break;
  }
  if(p.money<need&&monoRules.loansEnabled&&monoCanTakeLoan(monoTurn)){
    const shortfall=need-p.money;
    const interest=monoRules.loanInterestPercent||0;
    const turns=monoRules.loanMaxTurns||10;
    const amountDue=Math.round(shortfall*(1+interest/100));
    p.money+=shortfall;
    monoLoans.push({playerIdx:monoTurn,principal:shortfall,amountDue,interestPercent:interest,turnsLeft:turns});
    monoStatBump(monoTurn,'loansTaken',1);
    monoLogAdd(`🏦 ${p.name} nimmt einen Kredit über ${shortfall}€ auf, um eine Schuld zu decken (Rückzahlung: ${amountDue}€ in ${turns} Zügen).`);
  }
  if(p.money>=need)monoResolveDebt();else monoDeclareBankrupt();
}
function monoAiMaybeRepayLoans(){
  const p=monoPlayers[monoTurn];if(!p||!p.isAI)return;
  if(!monoRules.loansEnabled)return;
  const RESERVE=monoAiDiff()==='easy'?0:150;
  let acted=true,guard=0;
  while(acted&&guard++<50){
    acted=false;
    const myLoans=monoLoans.filter(l=>l.playerIdx===monoTurn).sort((a,b)=>a.amountDue-b.amountDue);
    for(const loan of myLoans){
      if(p.money-loan.amountDue>=RESERVE){
        p.money-=loan.amountDue;
        monoLoans=monoLoans.filter(l=>l!==loan);
        monoStatBump(monoTurn,'loansRepaid',1);
        monoLogAdd(`🏦 ${p.name} zahlt einen Kredit über ${loan.amountDue}€ vorzeitig zurück.`);
        acted=true;break;
      }
    }
  }
}
function monoAiTurnStep(){
  clearTimeout(monoAiTimer);
  if(!monoPlayers.length||monoGameOver)return;
  if(!monoIsVisible()){monoAiTimer=setTimeout(monoAiTurnStep,700);return;}
  const p=monoPlayers[monoTurn];
  if(!p||!p.isAI||p.bankrupt)return;
  if(monoModalType==='debt'){monoAiTimer=setTimeout(monoAiResolveDebt,500);return;}
  if(monoModalType==='buy'){monoAiTimer=setTimeout(monoAiDecideBuy,500);return;}
  if(monoModalType==='card'){monoAiTimer=setTimeout(()=>{if(monoModalType==='card')monoCardAck();},500);return;}
  if(monoModalType)return;
  monoAiTimer=setTimeout(()=>{
    if(monoGameOver||monoModalType)return;
    const pl=monoPlayers[monoTurn];if(!pl||!pl.isAI||pl.bankrupt)return;
    if(pl.inJail){
      const hard=monoAiDiff()==='hard';
      if(pl.getOutCards>0)monoUseJailCard();
      else if(hard&&pl.money>=200)monoPayJailFine();
      else if(pl.jailTurns>=1&&pl.money>=50)monoPayJailFine();
      else monoJailRoll();
      return;
    }
    if(monoCanRoll){monoRollDice();return;}
    if(monoCanEndTurn){
      monoAiMaybeUnmortgage();
      monoAiMaybeBuild();
      monoAiMaybeRepayLoans();
      if(!monoAiOfferMade){
        monoAiOfferMade=true;
        if(monoRules.aiTradeOffers&&Math.random()<monoAiPersonality(monoTurn).tradeChance){
          const off=monoAiBuildTradeOffer(monoTurn,1);
          if(off&&monoPlayers[off.ownerIdx].isAI){
            monoAiResolveAiToAiOffer(off);
          } else if(off){
            monoAiOffer=off;monoModalType='aiOffer';monoRenderAll();return;
          }
        }
      }
      monoEndTurn();return;
    }
  },650);
}
function monoAiFindOfferCandidate(aiIdx){
  for(let i=0;i<monoFields.length;i++){
    const f=monoFields[i];
    if(f.type!=='property'||!f.color)continue;
    const ownerIdx=monoOwner[i];
    if(ownerIdx===undefined||ownerIdx===aiIdx)continue;
    const owner=monoPlayers[ownerIdx];
    if(!owner||owner.bankrupt)continue;
    if(monoMortgaged[i]||(monoHouses[i]||0)>0)continue;
    const groupIdxs=monoFields.map((ff,ii)=>ff.type==='property'&&ff.color===f.color?ii:-1).filter(x=>x>=0);
    if(groupIdxs.length<2)continue;
    const aiOwnsRest=groupIdxs.every(ii=>ii===i||monoOwner[ii]===aiIdx);
    if(aiOwnsRest)return{fieldIdx:i,ownerIdx};
  }
  return null;
}
function monoAiBuildTradeOffer(aiIdx,round,fieldIdx,ownerIdx){
  round=round||1;
  if(fieldIdx===undefined){
    const cand=monoAiFindOfferCandidate(aiIdx);if(!cand)return null;
    fieldIdx=cand.fieldIdx;ownerIdx=cand.ownerIdx;
  }
  const ai=monoPlayers[aiIdx];const f=monoFields[fieldIdx];
  const price=f.price||0;
  const multiplier=(round>=2?1.6:1.3)*monoAiPersonality(aiIdx).premiumMult;
  const buffer=round>=2?30:100;
  let money=Math.round(price*multiplier);
  money=Math.min(money,Math.max(0,ai.money-buffer));
  const minThreshold=round>=2?1.1:0.8;
  if(money<Math.round(price*minThreshold))return null;
  return{aiIdx,fieldIdx,ownerIdx,money,round};
}
function monoAiOfferAccepted(o){
  const f=monoFields[o.fieldIdx];
  const keepValue=monoAiPropTradeValue(o.fieldIdx,o.ownerIdx);
  return o.money>=Math.min(keepValue,(f.price||0))*0.9;
}
function monoAiCompleteTrade(o){
  const initiator=monoPlayers[o.aiIdx];const owner=monoPlayers[o.ownerIdx];const f=monoFields[o.fieldIdx];
  const amt=Math.min(o.money,initiator.money);
  initiator.money-=amt;owner.money+=amt;monoOwner[o.fieldIdx]=o.aiIdx;
  const suffix=o.counter?' (Gegenangebot angenommen)':(o.round>=2?' (nach Nachverhandlung)':'');
  monoLogAdd(`🤝 ${owner.name} verkauft ${f.name} für ${amt}€ an ${initiator.name}${suffix}.`);
}
function monoAiMaxWillingness(aiIdx,fieldIdx){
  const ai=monoPlayers[aiIdx];const price=monoFields[fieldIdx].price||0;
  const cap=Math.round(price*Math.max(monoRules.aiMonopolyPremium||1.5,1.6));
  return Math.min(cap,Math.max(0,ai.money-50));
}
function monoAiResolveAiToAiOffer(off){
  const initiator=monoPlayers[off.aiIdx];const owner=monoPlayers[off.ownerIdx];const f=monoFields[off.fieldIdx];
  if(monoAiOfferAccepted(off)){monoAiCompleteTrade(off);return;}
  if(off.round<2){
    const counter=monoAiBuildTradeOffer(off.aiIdx,2,off.fieldIdx,off.ownerIdx);
    if(counter&&monoAiOfferAccepted(counter)){
      monoLogAdd(`🤝 ${owner.name} lehnt ${initiator.name}s erstes Angebot für ${f.name} ab.`);
      monoAiCompleteTrade(counter);return;
    }
  }
  monoLogAdd(`🤝 ${owner.name} lehnt das Angebot von ${initiator.name} für ${f.name} endgültig ab.`);
}
let monoAiOfferCountering=false;
let monoAiOfferCounterAmount=0;
function monoRenderAiOfferModal(){
  const o=monoAiOffer;
  if(!o){monoModalType=null;return;}
  const ai=monoPlayers[o.aiIdx];const f=monoFields[o.fieldIdx];const owner=monoPlayers[o.ownerIdx];
  if(monoAiOfferCountering){
    document.getElementById('mono-modal-box').innerHTML=`
      <div style="font-weight:700;font-size:16px;margin-bottom:8px">🤝 Gegenangebot an ${escHtml(ai.name)}</div>
      <div style="font-size:13px;color:var(--text-2);margin-bottom:10px">Für <b>${escHtml(f.name)}</b> verlangt <b>${escHtml(owner.name)}</b>:</div>
      <input type="number" min="0" value="${monoAiOfferCounterAmount}" oninput="monoAiOfferCounterAmount=Math.max(0,+this.value||0)" style="width:100%;padding:8px;background:var(--bg);border:0.5px solid var(--divider);border-radius:8px;color:var(--text);margin-bottom:14px;box-sizing:border-box"/>
      <div style="display:flex;gap:8px;justify-content:center">
        <button class="btn-generate" onclick="monoSubmitAiOfferCounter()" style="width:auto;padding:10px 20px">Angebot senden</button>
        <button class="timer-btn" onclick="monoAiOfferCountering=false;monoRenderAll()" style="padding:10px 20px">Zurück</button>
      </div>`;
    return;
  }
  document.getElementById('mono-modal-box').innerHTML=`
    <div style="font-weight:700;font-size:16px;margin-bottom:8px">🤖 Handelsangebot von ${escHtml(ai.name)}</div>
    <div style="font-size:13px;color:var(--text-2);margin-bottom:14px">${escHtml(ai.name)} möchte <b>${escHtml(f.name)}</b> von <b>${escHtml(owner.name)}</b> kaufen und bietet <b>${o.money}€</b> dafür.${o.round>=2?' <span style="color:var(--text-3)">(nachgebessertes Angebot)</span>':''}</div>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
      <button class="btn-generate" onclick="monoAcceptAiOffer()" style="width:auto;padding:10px 20px">Annehmen</button>
      <button class="timer-btn" onclick="monoStartAiOfferCounter(${o.money+Math.max(20,Math.round(o.money*0.2))})" style="padding:10px 20px">Gegenbieten</button>
      <button class="timer-btn" onclick="monoDeclineAiOffer()" style="padding:10px 20px">Ablehnen</button>
    </div>`;
}
function monoStartAiOfferCounter(suggested){
  monoAiOfferCounterAmount=suggested;monoAiOfferCountering=true;monoRenderAll();
}
function monoSubmitAiOfferCounter(){
  const o=monoAiOffer;if(!o)return;
  const amt=monoAiOfferCounterAmount;
  const ai=monoPlayers[o.aiIdx];const owner=monoPlayers[o.ownerIdx];const f=monoFields[o.fieldIdx];
  const willingness=monoAiMaxWillingness(o.aiIdx,o.fieldIdx);
  if(amt>0&&amt<=willingness&&amt<=ai.money){
    monoAiCompleteTrade({...o,money:amt,counter:true});
  } else {
    monoLogAdd(`🤝 ${ai.name} lehnt ${owner.name}s Gegenangebot über ${amt}€ für ${f.name} ab.`);
  }
  monoAiOffer=null;monoAiOfferCountering=false;monoModalType=null;
  monoEndTurn();
}
function monoAcceptAiOffer(){
  const o=monoAiOffer;if(!o)return;
  monoAiCompleteTrade(o);
  monoAiOffer=null;monoAiOfferCountering=false;monoModalType=null;
  monoEndTurn();
}
function monoDeclineAiOffer(){
  const o=monoAiOffer;if(!o)return;
  if(o.round<2){
    const counter=monoAiBuildTradeOffer(o.aiIdx,2,o.fieldIdx,o.ownerIdx);
    if(counter){
      monoLogAdd(`🤝 ${monoPlayers[o.ownerIdx].name} lehnt ${monoPlayers[o.aiIdx].name}s Angebot für ${monoFields[o.fieldIdx].name} ab.`);
      monoAiOffer=counter;monoAiOfferCountering=false;monoRenderAll();return;
    }
  }
  monoLogAdd(`🤝 ${monoPlayers[o.ownerIdx].name} lehnt ${monoPlayers[o.aiIdx].name}s Angebot für ${monoFields[o.fieldIdx].name} endgültig ab.`);
  monoAiOffer=null;monoAiOfferCountering=false;monoModalType=null;
  monoEndTurn();
}

/* ── Kredite ── */
function monoLoanCount(playerIdx){return monoLoans.filter(l=>l.playerIdx===playerIdx).length;}
function monoCanTakeLoan(playerIdx){return !monoRules.maxLoansPerPlayer||monoLoanCount(playerIdx)<monoRules.maxLoansPerPlayer;}
function monoProcessLoansForCurrentPlayer(){
  if(!monoRules.loansEnabled||!monoLoans.length)return;
  const p=monoPlayers[monoTurn];if(!p||p.bankrupt)return;
  let dueLoan=null;
  monoLoans.forEach(loan=>{
    if(loan.playerIdx!==monoTurn)return;
    loan.turnsLeft--;
    if(loan.turnsLeft<=0&&!dueLoan)dueLoan=loan;
  });
  if(dueLoan){
    monoLoans=monoLoans.filter(l=>l!==dueLoan);
    monoStatBump(monoTurn,'loansRepaid',1);
    monoLogAdd(`🏦 ${p.name}s Kredit über ${dueLoan.principal}€ wird fällig: ${dueLoan.amountDue}€ (inkl. ${dueLoan.interestPercent}% Zinsen).`);
    monoPayBank(p,dueLoan.amountDue,'Kreditrückzahlung','loanRepaid');
  }
}
function monoOpenLoan(){
  if(monoModalType||monoGameOver||!monoRules.loansEnabled)return;
  const p=monoPlayers[monoTurn];if(!p||p.isAI)return;
  if(!monoCanTakeLoan(monoTurn)){showToast(`Maximal ${monoRules.maxLoansPerPlayer} gleichzeitige Kredite erlaubt`);return;}
  monoLoanAmount=100;
  monoModalType='loan';monoRenderAll();
}
function monoCloseLoan(){monoModalType=null;monoRenderAll();}
function monoSetLoanAmount(v){
  monoLoanAmount=Math.max(0,+v||0);
  const interest=monoRules.loanInterestPercent||0;
  const due=Math.round(monoLoanAmount*(1+interest/100));
  const el=document.getElementById('mono-loan-due');if(el)el.textContent=due+'€';
}
function monoTakeLoan(){
  const p=monoPlayers[monoTurn];if(!p||p.isAI)return;
  if(!monoCanTakeLoan(monoTurn)){showToast(`Maximal ${monoRules.maxLoansPerPlayer} gleichzeitige Kredite erlaubt`);return;}
  const amt=monoLoanAmount;if(amt<=0)return;
  const interest=monoRules.loanInterestPercent||0;
  const turns=monoRules.loanMaxTurns||10;
  const amountDue=Math.round(amt*(1+interest/100));
  p.money+=amt;
  monoLoans.push({playerIdx:monoTurn,principal:amt,amountDue,interestPercent:interest,turnsLeft:turns});
  monoStatBump(monoTurn,'loansTaken',1);
  monoLogAdd(`🏦 ${p.name} nimmt einen Kredit über ${amt}€ auf (Rückzahlung: ${amountDue}€ in ${turns} Zügen).`);
  monoModalType=null;monoRenderAll();
}
function monoRepayLoan(loanIdx){
  const loan=monoLoans[loanIdx];if(!loan||loan.playerIdx!==monoTurn)return;
  const p=monoPlayers[monoTurn];
  const inputEl=document.getElementById('mono-loan-repay-'+loanIdx);
  let amt=inputEl?Math.max(0,+inputEl.value||0):loan.amountDue;
  amt=Math.min(amt,loan.amountDue);
  if(amt<=0)return;
  if(amt>p.money){showToast('Nicht genug Geld');return;}
  p.money-=amt;loan.amountDue-=amt;
  if(loan.amountDue<=0){
    monoLoans=monoLoans.filter(l=>l!==loan);
    monoStatBump(monoTurn,'loansRepaid',1);
    monoLogAdd(`🏦 ${p.name} zahlt ${amt}€ zurück – Kredit vollständig getilgt.`);
  } else {
    monoLogAdd(`🏦 ${p.name} zahlt ${amt}€ auf einen Kredit zurück (Rest: ${loan.amountDue}€).`);
  }
  monoRenderAll();
}
function monoRenderLoanModal(){
  const interest=monoRules.loanInterestPercent||0;
  const turns=monoRules.loanMaxTurns||10;
  const amountDue=Math.round((monoLoanAmount||0)*(1+interest/100));
  document.getElementById('mono-modal-box').innerHTML=`
    <div style="font-weight:700;font-size:16px;margin-bottom:6px">🏦 Kredit aufnehmen</div>
    <div style="font-size:12px;color:var(--text-3);margin-bottom:12px">Rückzahlung in ${turns} eigenen Zügen zzgl. ${interest}% Zinsen. Bei Fälligkeit wird automatisch abgebucht.</div>
    <label class="set-label" style="display:block;margin-bottom:4px">Betrag</label>
    <input type="number" min="0" step="50" value="${monoLoanAmount}" oninput="monoSetLoanAmount(this.value)" style="width:100%;padding:8px;background:var(--bg);border:0.5px solid var(--divider);border-radius:8px;color:var(--text);margin-bottom:8px;box-sizing:border-box"/>
    <div style="font-size:12px;color:var(--text-2);margin-bottom:14px">Rückzahlungsbetrag: <b id="mono-loan-due">${amountDue}€</b></div>
    <div style="display:flex;gap:8px;justify-content:center">
      <button class="btn-generate" onclick="monoTakeLoan()" style="width:auto;padding:10px 20px">Aufnehmen</button>
      <button class="timer-btn" onclick="monoCloseLoan()" style="padding:10px 20px">Abbrechen</button>
    </div>`;
}

/* ── Statistik ── */
function monoNetWorth(idx){
  const p=monoPlayers[idx];if(!p)return 0;
  if(p.bankrupt)return 0;
  let worth=p.money;
  monoFields.forEach((f,i)=>{
    if(monoOwner[i]!==idx)return;
    worth+=monoMortgaged[i]?Math.floor((f.price||0)/2):(f.price||0);
    worth+=(monoHouses[i]||0)*(f.houseCost||0);
  });
  monoLoans.forEach(l=>{if(l.playerIdx===idx)worth-=l.amountDue;});
  return worth;
}
function monoRecordNetWorth(){
  if(!monoPlayers.length)return;
  monoPlayers.forEach((p,i)=>{
    if(!monoNetWorthHistory[i])monoNetWorthHistory[i]=[];
    const worth=monoNetWorth(i);
    monoNetWorthHistory[i].push(worth);
    if(monoStats[i]){
      monoStats[i].peakMoney=Math.max(monoStats[i].peakMoney||0,p.money);
      monoStats[i].peakNetWorth=Math.max(monoStats[i].peakNetWorth||0,worth);
    }
  });
}
function monoOpenStats(){if(!monoPlayers.length||monoModalType)return;monoModalType='stats';monoRenderAll();}
function monoCloseStats(){monoModalType=null;monoRenderAll();}
function monoOpenTradeHistory(){if(!monoPlayers.length||monoModalType)return;monoModalType='tradehistory';monoRenderAll();}
function monoCloseTradeHistory(){monoModalType=null;monoRenderAll();}
function monoRenderTradeHistoryModal(){
  const trades=monoLog.filter(l=>l.includes('🤝'));
  document.getElementById('mono-modal-box').innerHTML=`
    <div style="font-weight:700;font-size:16px;margin-bottom:10px">📜 Handelsverlauf</div>
    <div style="display:flex;flex-direction:column;gap:6px;max-height:280px;overflow-y:auto;margin-bottom:14px">
      ${trades.length?trades.map(t=>`<div style="background:var(--bg);border-radius:8px;padding:8px 10px;font-size:12px;color:var(--text)">${escHtml(t)}</div>`).join(''):'<div style="font-size:12px;color:var(--text-3);text-align:center;padding:20px 0">Noch kein Handel getätigt.</div>'}
    </div>
    <div style="text-align:center"><button class="btn-generate" onclick="monoCloseTradeHistory()" style="width:auto;padding:8px 20px">Schließen</button></div>`;
}
function monoStatsSvg(){
  const hist=monoNetWorthHistory;
  const maxLen=Math.max(0,...hist.map(h=>h.length));
  if(maxLen<2)return `<div style="font-size:12px;color:var(--text-3);text-align:center;padding:24px 0">Noch nicht genug Daten – spiele ein paar Runden.</div>`;
  const allVals=hist.flat();
  const maxVal=Math.max(100,...allVals);
  const W=360,H=150,pad=8;
  const xScale=i=>pad+(W-2*pad)*(i/(maxLen-1));
  const yScale=v=>H-pad-(H-2*pad)*(Math.max(0,v)/maxVal);
  let svg=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;background:var(--bg);border-radius:8px;display:block">`;
  monoPlayers.forEach((p,pi)=>{
    const h=hist[pi]||[];if(h.length<2)return;
    const pts=h.map((v,i)=>`${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ');
    svg+=`<polyline points="${pts}" fill="none" stroke="${p.color}" stroke-width="2"/>`;
  });
  svg+='</svg>';
  return svg;
}
function monoRenderStatsModal(){
  const rows=monoPlayers.map((p,i)=>({
    p,i,worth:monoNetWorth(i),
    props:Object.keys(monoOwner).filter(k=>monoOwner[k]===i).length,
    houses:Object.keys(monoHouses).filter(k=>monoOwner[k]===i).reduce((s,k)=>s+(monoHouses[k]||0),0),
    loans:monoLoans.filter(l=>l.playerIdx===i),
    loanTotal:monoLoans.filter(l=>l.playerIdx===i).reduce((s,l)=>s+l.amountDue,0)
  })).sort((a,b)=>b.worth-a.worth);
  document.getElementById('mono-modal-box').innerHTML=`
    <div style="font-weight:700;font-size:16px;margin-bottom:10px">📊 Statistik</div>
    ${monoStatsSvg()}
    <div style="margin-top:12px;display:flex;flex-direction:column;gap:6px;max-height:200px;overflow-y:auto">
      ${rows.map(r=>`<div style="display:flex;align-items:center;gap:8px;background:var(--bg);border-radius:8px;padding:6px 10px;${r.p.bankrupt?'opacity:0.4;text-decoration:line-through':''}">
        <span style="width:16px;height:16px;border-radius:50%;background:${r.p.color};flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;font-size:10px;line-height:1">${monoAvatarFor(r.p,r.i)}</span>
        <span style="flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(r.p.name)}${r.p.isAI?' 🤖'+MONO_AI_PERSONALITIES[r.p.personality||'balanced'].icon:''}</span>
        <span style="font-size:11px;color:var(--text-3);flex-shrink:0">${r.props} Grdst. · ${r.houses} Häuser${r.loans.length?` · <span title="${r.loans.length} offene(r) Kredit(e)" style="color:var(--danger)">🏦 -${r.loanTotal}€</span>`:''}</span>
        <span style="font-size:12px;font-weight:700;flex-shrink:0">${r.worth}€</span>
      </div>`).join('')}
    </div>
    <div style="text-align:center;margin-top:14px"><button class="btn-generate" onclick="monoCloseStats()" style="width:auto;padding:8px 20px">Schließen</button></div>
  `;
}

/* ── Handel ── */
function monoOpenTrade(){
  if(monoModalType||monoGameOver)return;
  const partner=monoPlayers.findIndex((p,i)=>i!==monoTurn&&!p.bankrupt);
  if(partner<0){showToast('Kein Handelspartner verfügbar');return;}
  monoTrade={with:partner,offerProps:[],offerMoney:0,reqProps:[],reqMoney:0};
  monoModalType='trade';monoRenderAll();
}
function monoCloseTrade(){monoModalType=null;monoRenderAll();}
function monoTradeSetPartner(idx){monoTrade.with=+idx;monoTrade.offerProps=[];monoTrade.reqProps=[];monoRenderAll();}
function monoTradeToggleProp(side,i){
  const arr=side==='offer'?monoTrade.offerProps:monoTrade.reqProps;
  const pos=arr.indexOf(i);
  if(pos>=0)arr.splice(pos,1);else arr.push(i);
  monoRenderAll();
}
function monoTradeSetMoney(side,val){
  const v=Math.max(0,+val||0);
  if(side==='offer')monoTrade.offerMoney=v;else monoTrade.reqMoney=v;
}
function monoRenderTradeModal(){
  const t=monoTrade;const p=monoPlayers[monoTurn];
  const others=monoPlayers.map((pl,i)=>({pl,i})).filter(x=>x.i!==monoTurn&&!x.pl.bankrupt);
  if(!others.length){monoModalType=null;monoRenderAll();return;}
  if(t.with===null||monoPlayers[t.with].bankrupt)t.with=others[0].i;
  const partner=monoPlayers[t.with];
  const myProps=monoFields.map((f,i)=>({i,f})).filter(x=>monoOwner[x.i]===monoTurn);
  const theirProps=monoFields.map((f,i)=>({i,f})).filter(x=>monoOwner[x.i]===t.with);
  const propRow=(i,f,side)=>{
    const arr=side==='offer'?t.offerProps:t.reqProps;
    const checked=arr.includes(i);
    return `<label style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:12px;cursor:pointer">
      <input type="checkbox" ${checked?'checked':''} onchange="monoTradeToggleProp('${side}',${i})"/>
      ${escHtml(f.name)}${monoMortgaged[i]?' (verpfändet)':''}
    </label>`;
  };
  document.getElementById('mono-modal-box').innerHTML=`
    <div style="font-weight:700;font-size:16px;margin-bottom:10px">🤝 Handel</div>
    <div style="margin-bottom:12px">
      <label class="set-label" style="display:block;margin-bottom:4px">Handelspartner</label>
      <select onchange="monoTradeSetPartner(this.value)" style="width:100%;padding:7px;background:var(--bg);border:0.5px solid var(--divider);border-radius:8px;color:var(--text)">
        ${others.map(o=>`<option value="${o.i}" ${o.i===t.with?'selected':''}>${escHtml(o.pl.name)}${o.pl.isAI?' 🤖':''}</option>`).join('')}
      </select>
      ${partner.isAI?`<div style="font-size:11px;color:var(--text-3);margin-top:4px">Die KI prüft dein Angebot und nimmt nur faire oder für sie vorteilhafte Handel an.</div>`:''}
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <div style="flex:1;min-width:160px">
        <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:6px">Du bietest (${escHtml(p.name)})</div>
        <div style="max-height:140px;overflow-y:auto;margin-bottom:8px">${myProps.length?myProps.map(({i,f})=>propRow(i,f,'offer')).join(''):'<div style="font-size:12px;color:var(--text-3)">Keine Grundstücke</div>'}</div>
        <label class="set-label" style="display:block;margin-bottom:4px">Geld</label>
        <input type="number" min="0" value="${t.offerMoney}" oninput="monoTradeSetMoney('offer',this.value)" style="width:100%;padding:6px;background:var(--bg);border:0.5px solid var(--divider);border-radius:8px;color:var(--text)"/>
      </div>
      <div style="flex:1;min-width:160px">
        <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:6px">Du forderst (${escHtml(partner.name)})</div>
        <div style="max-height:140px;overflow-y:auto;margin-bottom:8px">${theirProps.length?theirProps.map(({i,f})=>propRow(i,f,'req')).join(''):'<div style="font-size:12px;color:var(--text-3)">Keine Grundstücke</div>'}</div>
        <label class="set-label" style="display:block;margin-bottom:4px">Geld</label>
        <input type="number" min="0" value="${t.reqMoney}" oninput="monoTradeSetMoney('req',this.value)" style="width:100%;padding:6px;background:var(--bg);border:0.5px solid var(--divider);border-radius:8px;color:var(--text)"/>
      </div>
    </div>
    <div style="display:flex;gap:8px;justify-content:center;margin-top:16px">
      <button class="btn-generate" onclick="monoExecuteTrade()" style="width:auto;padding:10px 20px">Tauschen</button>
      <button class="timer-btn" onclick="monoCloseTrade()" style="padding:10px 20px">Abbrechen</button>
    </div>`;
}
function monoAiPropTradeValue(fieldIdx,receiverIdx){
  const f=monoFields[fieldIdx];
  let val=(f.price||0)+(monoHouses[fieldIdx]||0)*(f.houseCost||0)*0.6;
  if(f.type==='property'&&f.color){
    const groupIdxs=monoFields.map((ff,ii)=>ff.type==='property'&&ff.color===f.color?ii:-1).filter(x=>x>=0);
    const wouldOwnAll=groupIdxs.length>1&&groupIdxs.every(ii=>ii===fieldIdx||monoOwner[ii]===receiverIdx);
    if(wouldOwnAll)val*=(monoRules.aiMonopolyPremium||1);
  }
  return val;
}
function monoAiEvaluateTrade(aiIdx,humanIdx,t){
  let aiReceives=t.offerMoney;
  t.offerProps.forEach(i=>{aiReceives+=monoAiPropTradeValue(i,aiIdx);});
  let aiGives=t.reqMoney;
  t.reqProps.forEach(i=>{aiGives+=monoAiPropTradeValue(i,humanIdx);});
  return aiReceives>=aiGives;
}
function monoExecuteTrade(){
  const t=monoTrade;const p=monoPlayers[monoTurn];const partner=monoPlayers[t.with];
  if(!partner)return;
  if(!t.offerProps.length&&!t.reqProps.length&&!t.offerMoney&&!t.reqMoney){showToast('Wähle mindestens etwas zum Tauschen aus');return;}
  if(t.offerMoney>p.money){showToast(`${p.name} hat nicht genug Geld`);return;}
  if(t.reqMoney>partner.money){showToast(`${partner.name} hat nicht genug Geld`);return;}
  if(partner.isAI&&!monoAiEvaluateTrade(t.with,monoTurn,t)){
    monoLogAdd(`🤝 ${partner.name} lehnt das Handelsangebot von ${p.name} ab.`);
    showToast(`${partner.name} lehnt den Handel ab`);
    monoModalType=null;monoRenderAll();return;
  }
  t.offerProps.forEach(i=>{monoOwner[i]=t.with;});
  t.reqProps.forEach(i=>{monoOwner[i]=monoTurn;});
  p.money-=t.offerMoney;partner.money+=t.offerMoney;
  partner.money-=t.reqMoney;p.money+=t.reqMoney;
  monoStatBump(monoTurn,'tradesCompleted',1);monoStatBump(t.with,'tradesCompleted',1);
  const parts=[];
  if(t.offerProps.length)parts.push(t.offerProps.map(i=>monoFields[i].name).join(', ')+` → ${partner.name}`);
  if(t.offerMoney)parts.push(`${t.offerMoney}€ → ${partner.name}`);
  if(t.reqProps.length)parts.push(t.reqProps.map(i=>monoFields[i].name).join(', ')+` → ${p.name}`);
  if(t.reqMoney)parts.push(`${t.reqMoney}€ → ${p.name}`);
  monoLogAdd(`🤝 Handel zwischen ${p.name} und ${partner.name}: ${parts.join(' · ')}`);
  monoModalType=null;monoRenderAll();
}
