/* ══════════════════════════════════
   APP-SHELL – Seitenleiste (Baumstruktur mit Kategorien & Apps), Kopfleiste mit Breadcrumb/Zurück,
   Befehlspalette (Strg+K), Startseiten-Dashboard, Favoriten-Sterne.
   Zustand: zf_sb_collapsed · zf_sb_open (aufgeklappte Kategorien) · zf_recent · zf_favs (bestehend)
══════════════════════════════════ */
(function(){
  'use strict';
  const LSget=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v;}catch(e){return d;}};
  const LSset=(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}};
  const MOBILE=()=>window.innerWidth<=900;
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  let cats=[],tiles=[],recent=[],openCats=[],hist=[],goingBack=false,homeMode='all'; // homeMode: 'all' | Kategorie-ID
  // „Zuletzt genutzt" gehört zum gewählten Account (zf_recent_<spieler>); ohne Account die gemeinsame Liste
  const recentKey=()=>{try{const k=typeof zcp==='function'&&typeof zcKey==='function'?zcKey(zcp().player||''):'';return k?'zf_recent_'+k:'zf_recent';}catch(e){return 'zf_recent';}};
  const recentLoad=()=>{try{const k=recentKey(),raw=LSget(k,null);recent=JSON.parse(raw!=null?raw:(k==='zf_recent'?'[]':'[]'))||[];}catch(e){recent=[];}};
  recentLoad();
  window.sbReloadRecent=()=>{recentLoad();try{sbRefresh();}catch(e){}};
  try{openCats=JSON.parse(LSget('zf_sb_open','["spiele"]'))||[];}catch(e){openCats=['spiele'];}
  let cfg={cards:true,favs:true,recent:true,grouped:false};
  try{Object.assign(cfg,JSON.parse(LSget('zf_home_cfg','{}'))||{});}catch(e){}

  const CSS=`
  :root{--tb-h:48px}
  #zf-sb{position:fixed;top:0;left:0;bottom:0;width:var(--sb-w,260px);z-index:1300;display:flex;flex-direction:column;box-sizing:border-box;
    background:color-mix(in srgb,var(--bg) 92%,var(--text) 8%);border-right:0.5px solid var(--divider);transition:width .18s ease,transform .2s ease;overflow:hidden}
  body.sb-on{padding-left:var(--sb-w,260px);padding-top:var(--tb-h);transition:padding-left .18s ease}
  body.sb-collapsed{--sb-w:64px}
  body.sb-on .titlebar{display:none!important}
  body.sb-on .screen.active{min-height:calc(100vh - var(--tb-h))!important}
  body.sb-on .screen.active{animation:sbFade .16s ease}
  @keyframes sbFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
  #zf-sb .sb-scroll{flex:1;overflow-y:auto;overflow-x:hidden;padding:4px 10px 10px}
  #zf-sb .sb-scroll::-webkit-scrollbar{width:6px}#zf-sb .sb-scroll::-webkit-scrollbar-thumb{background:var(--divider);border-radius:3px}
  #zf-sb .sb-head{display:flex;align-items:center;gap:10px;padding:12px 14px 6px;min-height:52px;flex:none}
  #zf-sb .sb-brand{font-size:16px;font-weight:800;color:var(--text);letter-spacing:-0.01em;white-space:nowrap;flex:1;display:flex;align-items:center;gap:9px;cursor:pointer}
  #zf-sb .sb-logo{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,var(--accent),#7c4dff);display:flex;align-items:center;justify-content:center;font-size:16px;flex:none;color:#fff}
  #zf-sb .sb-tgl{width:30px;height:30px;border-radius:8px;border:none;background:none;color:var(--text-3);cursor:pointer;font-size:16px;flex:none;display:flex;align-items:center;justify-content:center}
  #zf-sb .sb-tgl:hover{background:var(--active-bg);color:var(--accent)}
  #zf-sb .sb-sec{display:flex;align-items:center;font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.07em;padding:14px 8px 5px;white-space:nowrap}
  #zf-sb .sb-sec span{flex:1}
  #zf-sb .sb-item{display:flex;align-items:center;gap:10px;width:100%;box-sizing:border-box;padding:7px 10px;margin:1px 0;border-radius:9px;border:none;background:none;color:var(--text-2);font-size:13px;font-family:inherit;text-align:left;cursor:pointer;white-space:nowrap;position:relative}
  #zf-sb .sb-item:hover{background:var(--active-bg);color:var(--text)}
  #zf-sb .sb-item.active{background:var(--active-bg);color:var(--accent);font-weight:600}
  #zf-sb .sb-item.active::before{content:'';position:absolute;left:-10px;top:7px;bottom:7px;width:3px;border-radius:0 3px 3px 0;background:var(--accent)}
  #zf-sb .sb-item.sub{padding-left:32px;font-size:12.5px}
  #zf-sb .sb-item .sb-x{opacity:0;font-size:12px;color:var(--text-3);padding:0 2px}
  #zf-sb .sb-item:hover .sb-x{opacity:1}
  #zf-sb .sb-x:hover{color:var(--accent)}
  #zf-sb .sb-chev{width:14px;flex:none;font-size:9px;color:var(--text-3);transition:transform .15s;text-align:center}
  #zf-sb .sb-chev.open{transform:rotate(90deg)}
  #zf-sb .sb-ico{width:22px;height:22px;flex:none;display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1}
  #zf-sb .sb-ico .app-icon{width:22px!important;height:22px!important;min-width:0;border-radius:6px!important;margin:0!important;padding:0!important;display:flex;align-items:center;justify-content:center}
  #zf-sb .sb-ico .app-icon svg{width:14px;height:14px}
  #zf-sb .sb-item.sub .sb-ico{width:20px;height:20px}#zf-sb .sb-item.sub .sb-ico .app-icon{width:20px!important;height:20px!important}
  #zf-sb .sb-lbl{flex:1;overflow:hidden;text-overflow:ellipsis}
  #zf-sb .sb-count{font-size:11px;color:var(--text-3);font-weight:500}
  #zf-sb .sb-grid{opacity:0;font-size:12px;color:var(--text-3);padding:0 3px;border-radius:5px}
  #zf-sb .sb-item:hover .sb-grid{opacity:1}#zf-sb .sb-grid:hover{color:var(--accent);background:var(--bg)}
  #zf-sb .sb-badge{min-width:18px;height:18px;border-radius:9px;background:#ff3b30;color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 5px}
  #zf-sb .sb-player{display:flex;align-items:center;gap:10px;margin:2px 10px 6px;padding:8px 10px;border-radius:12px;background:var(--surface);border:0.5px solid var(--divider);cursor:pointer;flex:none;overflow:hidden;white-space:nowrap;color:var(--text);font-family:inherit;text-align:left}
  #zf-sb .sb-player:hover{border-color:var(--accent)}
  #zf-sb .sb-player .sb-pn{font-size:13px;font-weight:700;line-height:1.2;overflow:hidden;text-overflow:ellipsis}
  #zf-sb .sb-player .sb-pc{font-size:11px;color:var(--text-3)}
  #zf-sb .sb-find{display:flex;align-items:center;gap:8px;margin:2px 10px 6px;padding:8px 10px;border-radius:10px;border:0.5px solid var(--divider);background:var(--bg);color:var(--text-3);font-size:13px;font-family:inherit;cursor:pointer;flex:none;white-space:nowrap;overflow:hidden}
  #zf-sb .sb-find:hover{border-color:var(--accent);color:var(--text-2)}
  #zf-sb .sb-find kbd,#zf-top kbd{font-family:inherit;font-size:10px;padding:1px 5px;border-radius:5px;border:0.5px solid var(--divider);background:var(--surface);color:var(--text-3);margin-left:auto}
  #zf-sb .sb-foot{border-top:0.5px solid var(--divider);padding:8px 10px;flex:none}
  body.sb-collapsed #zf-sb .sb-lbl,body.sb-collapsed #zf-sb .sb-count,body.sb-collapsed #zf-sb .sb-name,body.sb-collapsed #zf-sb .sb-sec span,body.sb-collapsed #zf-sb .sb-pinfo,body.sb-collapsed #zf-sb .sb-chev,body.sb-collapsed #zf-sb .sb-grid,body.sb-collapsed #zf-sb .sb-x,body.sb-collapsed #zf-sb .sb-key,body.sb-collapsed #zf-sb .sb-find span,body.sb-collapsed #zf-sb .sb-find kbd,body.sb-collapsed #zf-sb .sb-item.sub{display:none}
  body.sb-collapsed #zf-sb .sb-sec{padding:8px 0 2px;justify-content:center}body.sb-collapsed #zf-sb .sb-sec::after{content:'';width:20px;height:1px;background:var(--divider)}
  body.sb-collapsed #zf-sb .sb-head{padding:12px 0 6px;flex-direction:column;gap:8px;min-height:0}
  body.sb-collapsed #zf-sb .sb-brand{flex:none}
  body.sb-collapsed #zf-sb .sb-item,body.sb-collapsed #zf-sb .sb-find{justify-content:center;padding:8px 0}
  body.sb-collapsed #zf-sb .sb-player{justify-content:center;padding:8px 0;margin:2px 8px 6px}
  body.sb-collapsed #zf-sb .sb-scroll{padding:4px 8px 10px}
  body.sb-collapsed #zf-sb .sb-badge{position:absolute;top:1px;right:6px;min-width:14px;height:14px;font-size:9px;padding:0 3px}
  #sb-fly{position:fixed;left:68px;z-index:1400;min-width:220px;max-height:70vh;overflow-y:auto;background:var(--bg);border:0.5px solid var(--divider);border-radius:12px;padding:8px;box-shadow:0 12px 40px rgba(0,0,0,0.28);display:none}
  #sb-fly .sb-item{display:flex;align-items:center;gap:10px;width:100%;padding:7px 10px;border:none;background:none;border-radius:8px;color:var(--text-2);font-size:13px;font-family:inherit;cursor:pointer;text-align:left}
  #sb-fly .sb-item:hover{background:var(--active-bg);color:var(--text)}
  #sb-fly .sb-fh{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-3);padding:4px 10px 6px}
  #sb-fly .sb-ico{width:22px;height:22px;display:flex;align-items:center;justify-content:center}
  #sb-fly .sb-ico .app-icon{width:22px!important;height:22px!important;min-width:0;border-radius:6px!important;margin:0!important;padding:0!important;display:flex;align-items:center;justify-content:center}
  #sb-fly .sb-ico .app-icon svg{width:14px;height:14px}
  /* Kopfleiste */
  #zf-top{position:fixed;top:0;right:0;left:var(--sb-w,260px);height:var(--tb-h);z-index:1200;display:flex;align-items:center;gap:6px;padding:0 14px;box-sizing:border-box;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(12px);border-bottom:0.5px solid var(--divider);transition:left .18s ease}
  #zf-top .tb-btn{height:32px;min-width:32px;padding:0 9px;border-radius:9px;border:0.5px solid transparent;background:none;color:var(--text-2);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;font-family:inherit;flex:none}
  #zf-top .tb-btn:hover:not(:disabled){background:var(--active-bg);color:var(--text)}
  #zf-top .tb-btn:disabled{opacity:0.35;cursor:default}
  #zf-top .tb-btn.on{color:#f5b301}
  #zf-top .tb-crumbs{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-3);min-width:0;flex:1;white-space:nowrap;overflow:hidden}
  #zf-top .tb-crumbs a{color:var(--text-2);cursor:pointer;text-decoration:none;padding:3px 6px;border-radius:6px}
  #zf-top .tb-crumbs a:hover{background:var(--active-bg);color:var(--text)}
  #zf-top .tb-crumbs b{color:var(--text);font-weight:700;padding:3px 6px;overflow:hidden;text-overflow:ellipsis}
  #zf-top .tb-find{gap:10px;border-color:var(--divider);color:var(--text-3);min-width:190px;justify-content:flex-start}
  #zf-top .tb-burger{display:none}
  #zf-sb-veil{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1290}
  /* Startseite – schöner */
  .home-greeting{font-size:30px!important;font-weight:800!important;letter-spacing:-0.6px!important;margin-bottom:2px!important;text-align:center}
  .home-greeting #home-greeting-text{background:linear-gradient(100deg,var(--text),var(--accent));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
  .home-sub{font-size:13px;color:var(--text-3);margin-bottom:18px;text-align:center}
  .app-tile{transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease,background .16s ease}
  .app-tile:hover{transform:translateY(-3px);box-shadow:0 8px 22px rgba(0,0,0,0.14),0 0 0 1px var(--accent)}
  .app-tile:active{transform:translateY(-1px)}
  .app-tile .app-icon{transition:transform .18s ease}
  .app-tile:hover .app-icon{transform:scale(1.08) rotate(-3deg)}
  #sb-sech h2{font-size:18px!important;letter-spacing:-0.2px}
  #sb-dash .dsh-sec{display:flex;align-items:center;gap:6px}
  #sb-dash .dsh-sec::after{content:'';flex:1;height:1px;background:var(--divider);margin-left:6px}
  #sb-dash .dsh-chip{transition:transform .14s,box-shadow .14s,border-color .14s}
  #sb-dash .dsh-chip:hover{transform:translateY(-2px);box-shadow:0 5px 14px rgba(0,0,0,0.12)}
  #sb-dash .dsh-card{position:relative;overflow:hidden;transition:transform .14s,box-shadow .14s,border-color .14s;background:linear-gradient(135deg,var(--surface),var(--active-bg))}
  #sb-dash .dsh-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--accent)}
  #sb-dash .dsh-card:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,0.13)}
  #sb-dash .dsh-card .v{font-size:22px}
  /* Startseite */
  .app-tile{position:relative}
  .app-tile[data-appid="zentrale"],.app-tile[data-appid="hilfe"],.app-tile[data-appid="einstellungen"]{display:none!important}
  .app-tile .tile-star{position:absolute;bottom:8px;right:8px;font-size:15px;line-height:1;opacity:0;color:var(--text-3);cursor:pointer;padding:2px;transition:opacity .12s}
  .app-tile:hover .tile-star{opacity:0.75}.app-tile .tile-star:hover{opacity:1;color:#f5b301}.app-tile .tile-star.on{opacity:1;color:#f5b301}
  #sb-dash{width:100%;display:none;flex-direction:column;gap:16px;margin-bottom:6px}
  #sb-dash .dsh-sec{font-size:12px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px}
  #sb-dash .dsh-row{display:flex;flex-wrap:wrap;gap:8px}
  #sb-dash .dsh-chip{display:flex;align-items:center;gap:9px;padding:8px 14px 8px 8px;background:var(--surface);border:0.5px solid var(--divider);border-radius:12px;cursor:pointer;color:var(--text);font-size:13px;font-weight:600;font-family:inherit}
  #sb-dash .dsh-chip:hover{border-color:var(--accent);background:var(--active-bg)}
  #sb-dash .dsh-chip .app-icon{width:28px!important;height:28px!important;min-width:0;border-radius:8px!important;margin:0!important;padding:0!important;display:flex;align-items:center;justify-content:center}
  #sb-dash .dsh-chip .app-icon svg{width:16px;height:16px}
  #sb-dash .dsh-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}
  #sb-dash .dsh-card{background:var(--surface);border:0.5px solid var(--divider);border-radius:14px;padding:12px 14px;cursor:pointer;text-align:left;color:var(--text);font-family:inherit}
  #sb-dash .dsh-card:hover{border-color:var(--accent)}
  #sb-dash .dsh-card .k{font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.05em}
  #sb-dash .dsh-card .v{font-size:20px;font-weight:800;margin-top:2px}
  #sb-dash .dsh-card .s{font-size:12px;color:var(--text-3);margin-top:1px}
  #sb-sech{width:100%;display:flex;align-items:baseline;gap:10px;margin:4px 0 2px}
  #sb-sech h2{font-size:16px;font-weight:800;color:var(--text)}#sb-sech span{font-size:12px;color:var(--text-3)}
  /* Fokus-Modus, Drag & Drop, Anpassen, Kürzel */
  body.sb-focus #zf-sb,body.sb-focus #zf-top,body.sb-focus #zf-sb-veil{display:none!important}
  body.sb-focus.sb-on{padding:0}
  body.sb-focus.sb-on .screen.active{min-height:100vh!important}
  #sb-focus-exit{display:none;position:fixed;top:10px;right:12px;z-index:1400;padding:6px 12px;border-radius:18px;border:0.5px solid var(--divider);background:var(--surface);color:var(--text-2);font-size:12px;cursor:pointer;opacity:0.55;backdrop-filter:blur(8px);font-family:inherit}
  #sb-focus-exit:hover{opacity:1}
  body.sb-focus #sb-focus-exit{display:block}
  .sb-drag-over{outline:2px dashed var(--accent);outline-offset:-2px}
  .sb-dragging{opacity:0.4}
  #zf-sb .sb-key{font-size:10px;color:var(--text-3);border:0.5px solid var(--divider);border-radius:4px;padding:0 4px;margin-left:4px}
  #sb-sech .sb-cfg-btn{margin-left:auto;padding:5px 11px;border-radius:9px;border:0.5px solid var(--divider);background:var(--surface);color:var(--text-2);font-size:12px;cursor:pointer;font-family:inherit;align-self:center}
  #sb-sech .sb-cfg-btn:hover{border-color:var(--accent);color:var(--text)}
  #sb-sech{position:relative}
  #sb-cfg{position:absolute;right:0;top:100%;z-index:50;min-width:250px;background:var(--bg);border:0.5px solid var(--divider);border-radius:12px;padding:12px 14px;box-shadow:0 12px 40px rgba(0,0,0,0.25);display:none}
  #sb-cfg label{display:flex;align-items:center;gap:9px;font-size:13px;color:var(--text);padding:5px 0;cursor:pointer}
  #sb-cfg .h{font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.07em;margin:6px 0 2px}
  .sb-grp{grid-column:1/-1;font-size:13px;font-weight:800;color:var(--text);padding:12px 2px 2px;display:none}
  #zf-keys{position:fixed;inset:0;z-index:2700;background:rgba(0,0,0,0.5);display:none;align-items:center;justify-content:center}
  #zf-keys .k-box{width:min(460px,92vw);background:var(--bg);border:0.5px solid var(--divider);border-radius:16px;padding:20px 22px;color:var(--text);box-shadow:0 24px 70px rgba(0,0,0,0.45)}
  #zf-keys .k-row{display:flex;align-items:center;gap:10px;padding:6px 0;font-size:13px;border-bottom:0.5px solid var(--divider)}
  #zf-keys .k-row:last-child{border:none}
  #zf-keys .k-row span:first-child{flex:1;color:var(--text-2)}
  #zf-keys kbd{font-family:inherit;font-size:11px;padding:2px 7px;border-radius:6px;border:0.5px solid var(--divider);background:var(--surface)}
  /* Befehlspalette */
  #zf-pal{position:fixed;inset:0;z-index:2600;background:rgba(0,0,0,0.5);backdrop-filter:blur(3px);display:none;align-items:flex-start;justify-content:center;padding-top:12vh}
  #zf-pal .pal-box{width:min(640px,92vw);background:var(--bg);border:0.5px solid var(--divider);border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,0.45);overflow:hidden;color:var(--text)}
  #zf-pal input{width:100%;box-sizing:border-box;padding:16px 18px;border:none;border-bottom:0.5px solid var(--divider);background:none;color:var(--text);font-size:16px;outline:none;font-family:inherit}
  #zf-pal .pal-list{max-height:52vh;overflow-y:auto;padding:6px}
  #zf-pal .pal-h{font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.07em;padding:10px 12px 4px}
  #zf-pal .pal-it{display:flex;align-items:center;gap:12px;padding:9px 12px;border-radius:10px;cursor:pointer;font-size:14px}
  #zf-pal .pal-it.sel{background:var(--active-bg);color:var(--accent)}
  #zf-pal .pal-it .pi{width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:17px;flex:none}
  #zf-pal .pal-it .pi .app-icon{width:26px!important;height:26px!important;min-width:0;border-radius:7px!important;margin:0!important;padding:0!important;display:flex;align-items:center;justify-content:center}
  #zf-pal .pal-it .pi .app-icon svg{width:15px;height:15px}
  #zf-pal .pal-it .ps{margin-left:auto;font-size:11px;color:var(--text-3)}
  #zf-pal .pal-foot{display:flex;gap:14px;padding:8px 14px;border-top:0.5px solid var(--divider);font-size:11px;color:var(--text-3)}
  @media(min-width:901px){
    body.sb-on .cat-tabs{display:none!important}
    body.sb-on #sfx-toggle{display:none!important}
    body.sb-on #zc-chip{display:none!important}
  }
  @media(max-width:900px){
    #zf-sb{transform:translateX(-100%);width:280px;box-shadow:0 0 40px rgba(0,0,0,0.4)}
    body.sb-on{padding-left:0}
    #zf-top{left:0}
    body.sb-open #zf-sb{transform:none}
    body.sb-open #zf-sb-veil{display:block}
    #zf-top .tb-burger{display:flex}
    #zf-top .tb-find{min-width:0}#zf-top .tb-find span,#zf-top .tb-find kbd{display:none}
    body.sb-collapsed{--sb-w:260px}
    body.sb-collapsed #zf-sb .sb-lbl,body.sb-collapsed #zf-sb .sb-count,body.sb-collapsed #zf-sb .sb-name,body.sb-collapsed #zf-sb .sb-sec span,body.sb-collapsed #zf-sb .sb-pinfo,body.sb-collapsed #zf-sb .sb-chev,body.sb-collapsed #zf-sb .sb-find span,body.sb-collapsed #zf-sb .sb-item.sub{display:revert}
    #zf-sb .sb-tgl.sb-desktop{display:none}
    #sb-fly{display:none!important}
  }`;

  /* ── Daten aus der Startseite ── */
  function readData(){
    cats=[...document.querySelectorAll('#cat-tabs .cat-tab')].map(b=>{
      const t=b.textContent.trim(),i=t.indexOf(' ');
      return{id:b.dataset.cat,icon:i>0?t.slice(0,i):'•',label:i>0?t.slice(i+1):t};
    }).filter(c=>c.id!=='favoriten');
    tiles=[...document.querySelectorAll('.app-tile')].map(t=>{
      const ic=t.querySelector('.app-icon');
      return{id:t.dataset.appid,cat:t.dataset.cat||'',name:(t.querySelector('.app-tile-name')||{}).textContent||t.dataset.appid,desc:(t.querySelector('.app-tile-desc')||{}).textContent||'',el:t,icon:ic?ic.outerHTML:'📄'};
    });
  }
  const tileOf=id=>tiles.find(t=>t.id===id);
  const catOf=id=>cats.find(c=>c.id===id);
  const HIDE_GRID=['zentrale','hilfe','einstellungen'];
  const inCat=c=>tiles.filter(t=>t.cat===c&&!HIDE_GRID.includes(t.id));
  const favs=()=>(typeof favApps!=='undefined'&&Array.isArray(favApps))?favApps:[];
  const currentScreen=()=>{const a=document.querySelector('.screen.active');return a?a.id.replace('screen-',''):'home';};
  const playerName=()=>{try{return(zcp().player||'').trim();}catch(e){return'';}};
  const SB_ZC_TABS=[['profile','Profil'],['board','Bestenliste'],['chal','Challenges'],['cmp','Vergleich'],['champ','Meisterschaft'],['season','Saison'],['replays','Replays'],['week','Woche'],['shop','Shop'],['bonus','Bonus & Glücksrad'],['stats','Statistik'],['groups','Gruppen']];

  /* ── Aufbau ── */
  function build(){
    if(document.getElementById('zf-sb'))return;
    readData();
    const st=document.createElement('style');st.id='zf-sb-css';st.textContent=CSS;document.head.appendChild(st);
    const sb=document.createElement('aside');sb.id='zf-sb';sb.setAttribute('aria-label','Navigation');
    sb.innerHTML=`<div class="sb-head"><div class="sb-brand" onclick="sbHome()"><span class="sb-logo">🧩</span><span class="sb-name">AppHub</span></div><button class="sb-tgl sb-desktop" id="sb-toggle" title="Seitenleiste ein-/ausklappen (Strg+B)" onclick="sbToggle()">«</button></div>
      <button class="sb-player" id="sb-player" onclick="typeof zcWhoOpen==='function'&&zcWhoOpen(true)" title="Spieler wechseln"></button>
      <button class="sb-find" onclick="palOpen()" title="Suchen &amp; Befehle (Strg+K)"><span class="sb-ico" style="width:auto;font-size:13px">🔍</span><span>Suchen…</span><kbd>Strg K</kbd></button>
      <div class="sb-scroll" id="sb-scroll"></div>
      <div class="sb-foot" id="sb-foot"></div>`;
    document.body.appendChild(sb);
    const fly=document.createElement('div');fly.id='sb-fly';document.body.appendChild(fly);
    const tb=document.createElement('header');tb.id='zf-top';
    tb.innerHTML=`<button class="tb-btn tb-burger" onclick="document.body.classList.add('sb-open')" title="Menü">☰</button>
      <button class="tb-btn" id="tb-back" onclick="sbBack()" title="Zurück (Alt+←)">←</button>
      <div class="tb-crumbs" id="tb-crumbs"></div>
      <button class="tb-btn" id="tb-fav" onclick="sbToggleFavCurrent()" title="Als Favorit markieren" style="display:none">☆</button>
      <button class="tb-btn tb-find" onclick="palOpen()" title="Suchen &amp; Befehle (Strg+K)">🔍 <span>Suchen…</span><kbd>Strg K</kbd></button>
      <button class="tb-btn" id="tb-focus" onclick="sbFocus()" title="Fokus-Modus (Strg+.)">⤢</button>
      <button class="tb-btn" id="tb-theme" onclick="sbTheme()" title="Hell/Dunkel wechseln">🌓</button>
      <button class="tb-btn" id="tb-sound" onclick="sbSound()" title="Ton an/aus">🔊</button>`;
    document.body.appendChild(tb);
    const vl=document.createElement('div');vl.id='zf-sb-veil';vl.onclick=()=>document.body.classList.remove('sb-open');document.body.appendChild(vl);
    const pal=document.createElement('div');pal.id='zf-pal';pal.onclick=e=>{if(e.target===pal)palClose();};
    pal.innerHTML=`<div class="pal-box"><input id="pal-in" placeholder="App suchen oder Befehl eingeben…" autocomplete="off" oninput="palFilter(this.value)" onkeydown="palKey(event)"/><div class="pal-list" id="pal-list"></div><div class="pal-foot"><span>↑↓ auswählen</span><span>↵ öffnen</span><span>Esc schließen</span></div></div>`;
    document.body.appendChild(pal);
    const fx=document.createElement('button');fx.id='sb-focus-exit';fx.textContent='⤡ Fokus beenden';fx.title='Strg+.';fx.onclick=()=>sbFocus();document.body.appendChild(fx);
    const kb=document.createElement('div');kb.id='zf-keys';kb.onclick=e=>{if(e.target===kb)kb.style.display='none';};document.body.appendChild(kb);
    document.body.classList.add('sb-on');
    if(LSget('zf_sb_collapsed','0')==='1')document.body.classList.add('sb-collapsed');
    tiles.forEach(t=>{
      if(t.id==='einstellungen'||t.id==='hilfe')return;
      const s=document.createElement('span');s.className='tile-star';s.textContent='★';s.title='Favorit';
      s.onclick=e=>{e.stopPropagation();e.preventDefault();sbToggleFav(t.id);};t.el.appendChild(s);
    });
    const hb=document.querySelector('.home-body'),grid=document.getElementById('app-grid');
    if(hb&&grid){
      const dash=document.createElement('div');dash.id='sb-dash';hb.insertBefore(dash,grid);
      const sh=document.createElement('div');sh.id='sb-sech';hb.insertBefore(sh,grid);
    }
    sbRefresh();
  }

  /* ── Seitenleiste rendern ── */
  function item(o){
    return`<button class="sb-item${o.active?' active':''}${o.sub?' sub':''}" title="${esc(o.title||o.label)}" onclick="${o.on}"><span class="sb-ico">${o.ico}</span><span class="sb-lbl">${esc(o.label)}</span>${o.right||''}</button>`;
  }
  function sbRender(){
    const sc=document.getElementById('sb-scroll');if(!sc)return;
    const cur=currentScreen(),curTile=tileOf(cur),coll=document.body.classList.contains('sb-collapsed');
    let h=item({ico:'🏠',label:'Startseite',on:'sbHome()',active:cur==='home'&&homeMode==='all'});
    const fv=favs().map(tileOf).filter(Boolean);
    if(fv.length){
      h+=`<div class="sb-sec"><span>Favoriten</span></div>`;
      h+=fv.map((t,i)=>`<button class="sb-item${cur===t.id?' active':''}" title="${esc(t.name)}${i<9?' (Alt+'+(i+1)+')':''} – zum Sortieren ziehen" draggable="true" data-fav="${t.id}" onclick="goTo('${t.id}')" ondragstart="sbDragStart(event,'${t.id}')" ondragover="sbDragOver(event)" ondragleave="this.classList.remove('sb-drag-over')" ondrop="sbDrop(event,'${t.id}')" ondragend="sbDragEnd()"><span class="sb-ico">${t.icon}</span><span class="sb-lbl">${esc(t.name)}</span>${i<9?`<span class="sb-key">${i+1}</span>`:''}<span class="sb-x" title="Favorit entfernen" onclick="event.stopPropagation();sbToggleFav('${t.id}')">✕</span></button>`).join('');
    }
    h+=`<div class="sb-sec"><span>Kategorien</span></div>`;
    h+=cats.map(c=>{
      const list=inCat(c.id),isOpen=openCats.includes(c.id)&&!coll,hasCur=curTile&&curTile.cat===c.id;
      let r=`<button class="sb-item${hasCur||(cur==='home'&&homeMode===c.id)?' active':''}" title="${esc(c.label)}" onclick="sbCatClick('${c.id}',event)"><span class="sb-chev${isOpen?' open':''}">▶</span><span class="sb-ico">${c.icon}</span><span class="sb-lbl">${esc(c.label)}</span><span class="sb-grid" title="Alle ${esc(c.label)}-Apps als Übersicht" onclick="event.stopPropagation();sbGoCat('${c.id}')">⊞</span><span class="sb-count">${list.length}</span></button>`;
      if(isOpen)r+=list.map(t=>item({sub:true,ico:t.icon,label:t.name,on:`goTo('${t.id}')`,active:cur===t.id})).join('');
      return r;
    }).join('');
    const rec=recent.map(tileOf).filter(Boolean).slice(0,4);
    if(rec.length){
      h+=`<div class="sb-sec"><span>Zuletzt genutzt</span></div>`;
      h+=rec.map(t=>item({ico:t.icon,label:t.name,on:`goTo('${t.id}')`,active:false})).join('');
    }
    const top=sc.scrollTop;sc.innerHTML=h;sc.scrollTop=top;
  }
  function sbFoot(){
    const f=document.getElementById('sb-foot');if(!f)return;
    const cur=currentScreen();let badge='';
    try{if((typeof zcReminderInfo==='function'&&zcReminderInfo())||(typeof zcBonusAvailable==='function'&&zcBonusAvailable(playerName())))badge='<span class="sb-badge">!</span>';}catch(e){}
    f.innerHTML=item({ico:'🏆',label:'Spielzentrale',on:"goTo('zentrale')",active:cur==='zentrale',right:badge})
      +item({ico:'❓',label:'Hilfe',on:"goTo('hilfe')",active:cur==='hilfe'})
      +item({ico:'⚙️',label:'Einstellungen',on:"goTo('einstellungen')",active:cur==='einstellungen'});
  }
  window.sbUpdatePlayer=function(){
    const b=document.getElementById('sb-player');if(!b)return;
    const name=playerName();
    let bn='';try{bn=name?zcBannerBg(name):'';}catch(e){}
    b.style.background=bn?`${bn} 0 0/5px 100% no-repeat,var(--surface)`:'';
    if(!name){b.innerHTML='<span class="sb-ico" style="font-size:20px">👤</span><span class="sb-pinfo"><div class="sb-pn">Spieler wählen</div><div class="sb-pc">Anmelden für Ränge &amp; Coins</div></span>';return;}
    let av='',coins=0;try{av=zcAvatarHtml(name,34);coins=zcCoinsOf(name);}catch(e){}
    b.innerHTML=`${av}<span class="sb-pinfo"><div class="sb-pn">${esc(name)}</div><div class="sb-pc">🪙 ${coins}${(typeof zcBonusAvailable==='function'&&zcBonusAvailable(name))?' · 🎁':''}</div></span>`;
  };

  /* ── Kopfleiste ── */
  function sbTop(){
    const cur=currentScreen(),cr=document.getElementById('tb-crumbs');if(!cr)return;
    const t=tileOf(cur);let h='<a onclick="sbHome()">AppHub</a>';
    if(cur==='home'){
      h+=homeMode==='all'?'<span>›</span><b>Startseite</b>':`<span>›</span><b>${esc((catOf(homeMode)||{label:'Favoriten'}).label)}</b>`;
    }else if(t){
      const c=catOf(t.cat);
      if(c)h+=`<span>›</span><a onclick="sbGoCat('${c.id}')">${esc(c.label)}</a>`;
      h+=`<span>›</span><b>${esc(t.name)}</b>`;
      if(cur==='zentrale'&&typeof zcView!=='undefined'){const tab=SB_ZC_TABS.find(x=>x[0]===zcView);if(tab)h+=`<span>›</span><b style="font-weight:500;color:var(--text-2)">${tab[1]}</b>`;}
    }else h+=`<span>›</span><b>${esc(cur)}</b>`;
    cr.innerHTML=h;
    const bk=document.getElementById('tb-back');if(bk)bk.disabled=hist.length<2;
    const fb=document.getElementById('tb-fav');
    if(fb){const show=!!t&&cur!=='einstellungen'&&cur!=='hilfe';fb.style.display=show?'flex':'none';const on=favs().includes(cur);fb.textContent=on?'★':'☆';fb.classList.toggle('on',on);fb.title=on?'Aus Favoriten entfernen':'Als Favorit markieren';}
    const sd=document.getElementById('tb-sound');if(sd){let m=false;try{m=!!SFX_MUTED;}catch(e){}sd.textContent=m?'🔇':'🔊';}
  }

  /* ── Startseite ── */
  function greeting(){
    const h=new Date().getHours(),n=playerName();
    const g=h<5?'Gute Nacht':h<11?'Guten Morgen':h<17?'Guten Tag':h<22?'Guten Abend':'Gute Nacht';
    return g+(n?', '+n:'')+' 👋';
  }
  function sbHomeRender(){
    if(currentScreen()!=='home')return;
    const gt=document.getElementById('home-greeting-text');if(gt)gt.textContent=greeting();
    const hs=document.getElementById('home-sub');if(hs)hs.textContent=new Date().toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'})+' · Update-Test ✓';
    const dash=document.getElementById('sb-dash'),sh=document.getElementById('sb-sech');if(!dash||!sh)return;
    const chip=t=>`<button class="dsh-chip" onclick="goTo('${t.id}')">${t.icon}<span>${esc(t.name)}</span></button>`;
    const favChip=t=>`<button class="dsh-chip" draggable="true" title="Zum Sortieren ziehen" onclick="goTo('${t.id}')" ondragstart="sbDragStart(event,'${t.id}')" ondragover="sbDragOver(event)" ondragleave="this.classList.remove('sb-drag-over')" ondrop="sbDrop(event,'${t.id}')" ondragend="sbDragEnd()">${t.icon}<span>${esc(t.name)}</span></button>`;
    if(homeMode==='all'){
      const fv=favs().map(tileOf).filter(Boolean),rc=recent.map(tileOf).filter(Boolean).slice(0,6);
      let h='';
      const name=playerName();
      if(name&&cfg.cards){
        let coins=0,streak=0,week=0;try{coins=zcCoinsOf(name);streak=(zcp().days[zcKey(name)]||{}).count||0;week=(zcp().wk.players[zcKey(name)]||{}).pts||0;}catch(e){}
        let nextAch=null;try{const a=zcAggregate(name);nextAch=zcTrophyList(a).filter(t=>!t.done).sort((x,y)=>(y.cur/Math.max(1,y.target))-(x.cur/Math.max(1,x.target)))[0];}catch(e){}
        const achCard=nextAch?`<button class="dsh-card" onclick="goTo('zentrale');zcShow('profile')"><div class="k">Nächster Erfolg</div><div class="v">${nextAch.icon} ${Math.min(nextAch.cur,nextAch.target)}/${nextAch.target}</div><div class="s">${esc(nextAch.label)}</div><div style="height:4px;background:var(--divider);border-radius:2px;overflow:hidden;margin-top:6px"><div style="height:100%;width:${Math.round(Math.min(1,nextAch.cur/nextAch.target)*100)}%;background:var(--accent)"></div></div></button>`:'';
        h+=`<div class="dsh-cards"><button class="dsh-card" onclick="goTo('zentrale');zcShow('shop')"><div class="k">Coins</div><div class="v">🪙 ${coins}</div><div class="s">Zum Shop</div></button>
          <button class="dsh-card" onclick="goTo('zentrale');zcShow('chal')"><div class="k">Challenge-Serie</div><div class="v">🔥 ${streak} Tag${streak===1?'':'e'}</div><div class="s">Tages-Challenges</div></button>
          <button class="dsh-card" onclick="goTo('zentrale');zcShow('week')"><div class="k">Wochenpunkte</div><div class="v">🏆 ${week}</div><div class="s">Wochen-Bestenliste</div></button>
          <button class="dsh-card" onclick="goTo('zentrale');zcShow('bonus')"><div class="k">Tagesbonus</div><div class="v">🎁 ${(typeof zcBonusAvailable==='function'&&zcBonusAvailable(name))?'Bereit!':'Abgeholt'}</div><div class="s">Bonus &amp; Glücksrad</div></button>${achCard}</div>`;
      }
      if(fv.length&&cfg.favs)h+=`<div><div class="dsh-sec">⭐ Favoriten</div><div class="dsh-row">${fv.map(favChip).join('')}</div></div>`;
      if(rc.length&&cfg.recent)h+=`<div><div class="dsh-sec">🕘 Zuletzt genutzt</div><div class="dsh-row">${rc.map(chip).join('')}</div></div>`;
      if(typeof zcDuelChips==='function')h+=zcDuelChips();
      dash.innerHTML=h;dash.style.display=h?'flex':'none';applyGrouping();
      sh.innerHTML=`<h2>Alle Apps</h2><span>${tiles.length} Apps · ★ auf einer Kachel = Favorit</span>${cfgBtn()}`;sh.style.display='flex';
    }else{
      applyGrouping();
      dash.style.display='none';
      const c=catOf(homeMode);
      sh.innerHTML=c?`<h2>${c.icon} ${esc(c.label)}</h2><span>${inCat(c.id).length} Apps</span>`:`<h2>⭐ Favoriten</h2><span>${favs().length} Apps</span>`;
      sh.style.display='flex';
    }
  }
  function cfgBtn(){
    const c=(k,l)=>`<label><input type="checkbox" ${cfg[k]?'checked':''} onchange="sbCfgSet('${k}',this.checked)"/>${l}</label>`;
    return`<button class="sb-cfg-btn" onclick="sbCfgToggle(event)">⚙ Anpassen</button><div id="sb-cfg" onclick="event.stopPropagation()"><div class="h">Startseite</div>${c('cards','Kennzahlen-Kacheln')}${c('favs','Favoriten')}${c('recent','Zuletzt genutzt')}<div class="h">Alle Apps</div>${c('grouped','Nach Kategorien gruppieren')}</div>`;
  }
  window.sbCfgToggle=function(e){e.stopPropagation();const c=document.getElementById('sb-cfg');if(c)c.style.display=c.style.display==='block'?'none':'block';};
  window.sbCfgSet=function(k,v){cfg[k]=v;LSset('zf_home_cfg',JSON.stringify(cfg));sbHomeRender();const c=document.getElementById('sb-cfg');if(c)c.style.display='block';};
  function applyGrouping(){
    const grid=document.getElementById('app-grid');if(!grid)return;
    const on=cfg.grouped&&homeMode==='all';
    grid.querySelectorAll('.sb-grp').forEach(e=>e.remove());
    tiles.forEach(t=>{t.el.style.order='';});
    if(!on)return;
    cats.forEach((c,ci)=>{
      const n=inCat(c.id).length;if(!n)return;
      const hd=document.createElement('div');hd.className='sb-grp';hd.style.display='block';hd.style.order=String(ci*1000);hd.innerHTML=`${c.icon} ${esc(c.label)} <span style="font-weight:400;color:var(--text-3);font-size:12px">· ${n}</span>`;
      grid.appendChild(hd);
      inCat(c.id).forEach((t,i)=>{t.el.style.order=String(ci*1000+1+i);});
    });
    tiles.filter(t=>!cats.some(c=>c.id===t.cat)).forEach(t=>{t.el.style.order='99999';});
  }
  function showAllTiles(){applyGrouping();document.querySelectorAll('.app-tile').forEach(t=>{t.style.display='flex';t.style.flexDirection='column';});}

  /* ── Aktionen ── */
  window.sbToggle=function(){
    if(MOBILE()){document.body.classList.toggle('sb-open');return;}
    const c=document.body.classList.toggle('sb-collapsed');LSset('zf_sb_collapsed',c?'1':'0');
    document.getElementById('sb-toggle').textContent=c?'»':'«';sbFlyClose();sbRender();
  };
  window.sbHome=function(){
    homeMode='all';goTo('home');showAllTiles();
    document.body.classList.remove('sb-open');sbRefresh();window.scrollTo(0,0);
  };
  window.sbGoCat=function(cat){
    homeMode=cat;goTo('home');
    if(typeof showCat==='function')showCat(cat);
    LSset('zf_last_cat',cat);
    document.body.classList.remove('sb-open');sbFlyClose();sbRefresh();window.scrollTo(0,0);
  };
  window.sbCatClick=function(cat,ev){
    if(document.body.classList.contains('sb-collapsed')&&!MOBILE()){sbFly(cat,ev.currentTarget);return;}
    const i=openCats.indexOf(cat);if(i>=0)openCats.splice(i,1);else openCats.push(cat);
    LSset('zf_sb_open',JSON.stringify(openCats));sbRender();
  };
  function sbFlyClose(){const f=document.getElementById('sb-fly');if(f)f.style.display='none';}
  function sbFly(cat,btn){
    const f=document.getElementById('sb-fly'),c=catOf(cat);if(!f||!c)return;
    const r=btn.getBoundingClientRect();
    f.innerHTML=`<div class="sb-fh">${c.icon} ${esc(c.label)}</div>`+inCat(cat).map(t=>`<button class="sb-item" onclick="sbFlyClose();goTo('${t.id}')"><span class="sb-ico">${t.icon}</span><span>${esc(t.name)}</span></button>`).join('')+`<button class="sb-item" style="color:var(--accent)" onclick="sbGoCat('${cat}')"><span class="sb-ico">⊞</span><span>Alle anzeigen</span></button>`;
    f.style.display='block';f.style.top=Math.max(8,Math.min(r.top,window.innerHeight-f.offsetHeight-8))+'px';
  }
  window.sbFlyClose=sbFlyClose;
  window.sbOpen=function(id){document.body.classList.remove('sb-open');goTo(id);};
  window.sbBack=function(){
    if(hist.length<2)return;
    hist.pop();const prev=hist[hist.length-1];goingBack=true;
    if(prev==='home')sbHome();else goTo(prev);
    goingBack=false;
  };
  window.sbToggleFav=function(id){
    const a=favs();
    if(a.includes(id))favApps=a.filter(x=>x!==id);
    else{if(a.length>=12){showToast('Maximal 12 Favoriten');return;}favApps=[...a,id];}
    LSset('zf_favs',JSON.stringify(favApps));
    sbRefresh();
    const t=tileOf(id);if(t)showToast((favs().includes(id)?'★ Favorit: ':'Favorit entfernt: ')+t.name,1800);
  };
  let dragId=null;
  window.sbDragStart=function(e,id){dragId=id;e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',id);}catch(x){}e.currentTarget.classList.add('sb-dragging');};
  window.sbDragOver=function(e){if(!dragId)return;e.preventDefault();e.dataTransfer.dropEffect='move';e.currentTarget.classList.add('sb-drag-over');};
  window.sbDragEnd=function(){dragId=null;document.querySelectorAll('.sb-dragging,.sb-drag-over').forEach(x=>x.classList.remove('sb-dragging','sb-drag-over'));};
  window.sbDrop=function(e,targetId){
    e.preventDefault();const id=dragId;sbDragEnd();if(!id||id===targetId)return;
    const a=favs().filter(x=>x!==id),i=a.indexOf(targetId);
    a.splice(i<0?a.length:i,0,id);favApps=a;LSset('zf_favs',JSON.stringify(favApps));sbRefresh();
  };
  window.sbFocus=function(){
    const on=document.body.classList.toggle('sb-focus');
    if(on)showToast('Fokus-Modus – mit Strg+. beenden',2200);
    sbFlyClose();
  };
  window.sbKeys=function(){
    const row=(a,b)=>`<div class="k-row"><span>${a}</span><kbd>${b}</kbd></div>`;
    const fv=favs().map(tileOf).filter(Boolean).slice(0,9).map((t,i)=>row('Favorit öffnen: '+esc(t.name),'Alt '+(i+1))).join('');
    const k=document.getElementById('zf-keys');
    k.innerHTML=`<div class="k-box"><div style="font-size:16px;font-weight:800;margin-bottom:10px">⌨️ Tastenkürzel</div>
      ${row('Suchen &amp; Befehle','Strg K')}${row('Seitenleiste ein-/ausklappen','Strg B')}${row('Fokus-Modus','Strg .')}${row('Zurück','Alt ←')}${row('Startseite','Alt H')}${row('Spielzentrale','Alt S')}${row('Diese Übersicht','?')}
      ${fv||row('Favoriten öffnen','Alt 1 – 9')}
      <div style="font-size:11px;color:var(--text-3);margin-top:10px">Favoriten lassen sich in der Seitenleiste per Ziehen sortieren – die Reihenfolge bestimmt die Nummer.</div>
      <div style="text-align:right;margin-top:12px"><button class="timer-btn" onclick="document.getElementById('zf-keys').style.display='none'" style="padding:6px 16px;font-size:12px">Schließen</button></div></div>`;
    k.style.display='flex';
  };
  window.sbToggleFavCurrent=function(){const c=currentScreen();if(tileOf(c))sbToggleFav(c);};
  function sbStars(){tiles.forEach(t=>{const s=t.el.querySelector('.tile-star');if(s)s.classList.toggle('on',favs().includes(t.id));});}
  window.sbTheme=function(){
    const dark=document.documentElement.getAttribute('data-theme')==='dark';
    if(typeof setTheme==='function')setTheme(dark?'light':'dark');
  };
  window.sbSound=function(){if(typeof sfxToggle==='function')sfxToggle();sbTop();};
  window.sbRefresh=function(){
    try{
      sbRender();sbFoot();sbUpdatePlayer();sbTop();sbStars();sbHomeRender();
      const tg=document.getElementById('sb-toggle');if(tg)tg.textContent=document.body.classList.contains('sb-collapsed')?'»':'«';
    }catch(e){}
  };

  /* ── Befehlspalette ── */
  let palItems=[],palSel=0;
  function palAll(){
    const out=[];
    tiles.filter(t=>!HIDE_GRID.includes(t.id)).forEach(t=>out.push({k:'App',label:t.name,sub:(catOf(t.cat)||{label:''}).label,ico:t.icon,run:()=>goTo(t.id),kw:t.desc}));
    cats.forEach(c=>out.push({k:'Kategorie',label:c.label,sub:'Kategorie',ico:c.icon,run:()=>sbGoCat(c.id),kw:''}));
    SB_ZC_TABS.forEach(([id,l])=>out.push({k:'Spielzentrale',label:'Spielzentrale: '+l,sub:'Spielzentrale',ico:'🏆',run:()=>{goTo('zentrale');zcShow(id);},kw:l}));
    out.push({k:'Aktion',label:'Spieler wechseln',sub:'Konto',ico:'👤',run:()=>{typeof zcWhoOpen==='function'&&zcWhoOpen(true);},kw:'profil account anmelden'});
    out.push({k:'Aktion',label:'Hell/Dunkel wechseln',sub:'Design',ico:'🌓',run:sbTheme,kw:'theme design modus dark light'});
    out.push({k:'Aktion',label:'Ton an/aus',sub:'Ton',ico:'🔊',run:sbSound,kw:'sound audio mute'});
    out.push({k:'Aktion',label:'Seitenleiste ein-/ausklappen',sub:'Strg+B',ico:'◧',run:sbToggle,kw:'sidebar menü navigation'});
    out.push({k:'Aktion',label:'Sicherung herunterladen',sub:'Daten',ico:'💾',run:()=>{window.zfSync&&zfSync.exportFile&&zfSync.exportFile();},kw:'backup export daten'});
    out.push({k:'Aktion',label:'Fokus-Modus ein/aus',sub:'Strg+.',ico:'⤢',run:sbFocus,kw:'vollbild zen ablenkung'});
    out.push({k:'Aktion',label:'Tastenkürzel anzeigen',sub:'?',ico:'⌨️',run:sbKeys,kw:'shortcuts hilfe'});
    out.push({k:'Aktion',label:'Spielzentrale',sub:'',ico:'🏆',run:()=>goTo('zentrale'),kw:'ränge coins profil bestenliste'});
    out.push({k:'Aktion',label:'Hilfe & Anleitungen',sub:'',ico:'❓',run:()=>goTo('hilfe'),kw:'help anleitung faq'});
    out.push({k:'Aktion',label:'Startseite',sub:'',ico:'🏠',run:sbHome,kw:'home'});
    out.push({k:'Aktion',label:'Einstellungen',sub:'',ico:'⚙️',run:()=>goTo('einstellungen'),kw:'settings optionen'});
    return out;
  }
  function score(it,q){
    const l=it.label.toLowerCase(),kw=(it.kw||'').toLowerCase();
    if(l===q)return 100;if(l.startsWith(q))return 80;
    if(l.split(/[\s:&-]+/).some(w=>w.startsWith(q)))return 65;
    if(l.includes(q))return 50;if(kw.includes(q))return 30;
    let i=0;for(const ch of l){if(ch===q[i])i++;if(i===q.length)return 10;}
    return 0;
  }
  window.palOpen=function(){
    const p=document.getElementById('zf-pal');p.style.display='flex';
    const i=document.getElementById('pal-in');i.value='';palFilter('');setTimeout(()=>i.focus(),20);
  };
  window.palClose=function(){document.getElementById('zf-pal').style.display='none';};
  window.palFilter=function(q){
    q=(q||'').toLowerCase().trim();const all=palAll();let list;
    const appItem=t=>all.find(x=>x.k==='App'&&x.label===t.name);
    if(!q){
      const rec=recent.map(tileOf).filter(Boolean).slice(0,5).map(appItem).filter(Boolean);
      const fv=favs().map(tileOf).filter(Boolean).map(appItem).filter(Boolean);
      const acts=all.filter(x=>x.k==='Aktion').slice(0,5);
      list=[...fv.map(x=>({...x,g:'Favoriten'})),...rec.map(x=>({...x,g:'Zuletzt genutzt'})),...acts.map(x=>({...x,g:'Aktionen'}))];
    }else{
      list=all.map(x=>({x,s:score(x,q)})).filter(o=>o.s>0).sort((a,b)=>b.s-a.s).slice(0,40).map(o=>({...o.x,g:'Ergebnisse'}));
    }
    palItems=list;palSel=0;palRender();
  };
  function palRender(){
    const el=document.getElementById('pal-list');let last='',h='';
    if(!palItems.length)h='<div style="padding:24px;text-align:center;color:var(--text-3);font-size:13px">Nichts gefunden</div>';
    palItems.forEach((it,i)=>{
      if(it.g!==last){h+=`<div class="pal-h">${esc(it.g)}</div>`;last=it.g;}
      h+=`<div class="pal-it${i===palSel?' sel':''}" data-i="${i}" onmousemove="palHover(${i})" onclick="palRun(${i})"><span class="pi">${it.ico}</span><span>${esc(it.label)}</span><span class="ps">${esc(it.sub||'')}</span></div>`;
    });
    el.innerHTML=h;
    const s=el.querySelector('.sel');if(s)s.scrollIntoView({block:'nearest'});
  }
  window.palHover=function(i){if(palSel!==i){palSel=i;document.querySelectorAll('#pal-list .pal-it').forEach(e=>e.classList.toggle('sel',+e.dataset.i===i));}};
  window.palRun=function(i){const it=palItems[i];if(!it)return;palClose();document.body.classList.remove('sb-open');try{it.run();}catch(e){}};
  window.palKey=function(e){
    if(e.key==='Escape'){palClose();return;}
    if(e.key==='ArrowDown'){e.preventDefault();palSel=Math.min(palItems.length-1,palSel+1);palRender();}
    else if(e.key==='ArrowUp'){e.preventDefault();palSel=Math.max(0,palSel-1);palRender();}
    else if(e.key==='Enter'){e.preventDefault();palRun(palSel);}
  };

  /* ── Verdrahtung ── */
  function wire(){
    if(typeof goTo==='function'){
      const _g=goTo;
      goTo=function(id){
        const r=_g.apply(this,arguments);
        try{
          const cur=currentScreen();
          if(!goingBack){if(hist[hist.length-1]!==cur||cur==='home')hist.push(cur);if(hist.length>40)hist.shift();}
          if(cur!=='home'&&cur!=='zentrale'&&cur!=='einstellungen'&&cur!=='hilfe'&&tileOf(cur)){
            recent=[cur,...recent.filter(x=>x!==cur)].slice(0,8);LSset(recentKey(),JSON.stringify(recent));
            const t=tileOf(cur);if(t&&t.cat&&!openCats.includes(t.cat)&&!document.body.classList.contains('sb-collapsed')){openCats.push(t.cat);LSset('zf_sb_open',JSON.stringify(openCats));}
          }
          document.body.classList.remove('sb-open');sbFlyClose();
          sbRefresh();
          const act=document.querySelector('#sb-scroll .sb-item.sub.active');if(act&&!document.body.classList.contains('sb-collapsed'))act.scrollIntoView({block:'nearest'});
        }catch(e){}
        return r;
      };
    }
    if(typeof zcShow==='function'){const _z=zcShow;zcShow=function(){const r=_z.apply(this,arguments);try{sbTop();}catch(e){}return r;};}
    if(typeof zcChipUpdate==='function'){const _c=zcChipUpdate;zcChipUpdate=function(){const r=_c.apply(this,arguments);try{sbUpdatePlayer();sbFoot();sbHomeRender();}catch(e){}return r;};}
    if(typeof sfxToggle==='function'){const _s=sfxToggle;sfxToggle=function(){const r=_s.apply(this,arguments);try{sbTop();}catch(e){}return r;};}
    document.addEventListener('keydown',e=>{
      const mod=e.ctrlKey||e.metaKey,k=(e.key||'').toLowerCase();
      if(mod&&k==='b'){e.preventDefault();sbToggle();}
      else if(mod&&k==='k'){e.preventDefault();palOpen();}
      else if(mod&&(e.key==='.'||e.code==='Period')){e.preventDefault();sbFocus();}
      else if(e.altKey&&e.key==='ArrowLeft'){e.preventDefault();sbBack();}
      else if(e.altKey&&/^[1-9]$/.test(e.key)){const t=tileOf(favs()[+e.key-1]);if(t){e.preventDefault();goTo(t.id);}}
      else if(e.altKey&&k==='h'){e.preventDefault();sbHome();}
      else if(e.altKey&&k==='s'){e.preventDefault();goTo('zentrale');}
      else if(e.key==='?'&&!/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName||''))&&!e.target.isContentEditable){e.preventDefault();sbKeys();}
      else if(e.key==='Escape'){const kk=document.getElementById('zf-keys');if(kk&&kk.style.display==='flex')kk.style.display='none';}
      else if(mod&&e.altKey&&e.shiftKey&&k==='m'&&typeof zcAdminToggle==='function'){e.preventDefault();zcAdminToggle();}
    });
    document.addEventListener('click',e=>{const f=document.getElementById('sb-fly');if(f&&f.style.display==='block'&&!f.contains(e.target)&&!e.target.closest('#zf-sb'))sbFlyClose();});
    document.addEventListener('click',()=>{const c=document.getElementById('sb-cfg');if(c)c.style.display='none';});
    window.addEventListener('resize',()=>{if(!MOBILE())document.body.classList.remove('sb-open');sbFlyClose();});
  }
  function init(){
    build();wire();
    hist=['home'];showAllTiles();
    setTimeout(()=>{showAllTiles();sbRefresh();},300);
    setTimeout(sbRefresh,1500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
