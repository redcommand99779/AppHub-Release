/* ══════════════════════════════════
   EINHEITEN
══════════════════════════════════ */
const UNITS={
  Länge:{m:1,km:1000,cm:0.01,mm:0.001,mi:1609.344,yd:0.9144,ft:0.3048,'in':0.0254,nm:1852},
  Gewicht:{kg:1,g:0.001,mg:0.000001,t:1000,lb:0.453592,oz:0.0283495},
  Temperatur:null,
  Volumen:{L:1,mL:0.001,m3:1000,ft3:28.3168,gal:3.78541,pt:0.473176,fl_oz:0.0295735},
  Fläche:{m2:1,km2:1e6,cm2:0.0001,ha:10000,ac:4046.86,ft2:0.092903,mi2:2.59e6},
  Geschwindigkeit:{'km/h':1,'m/s':3.6,'mph':1.60934,'kn':1.852},
  Druck:{Pa:1,hPa:100,kPa:1000,bar:100000,psi:6894.76,atm:101325},
  Energie:{J:1,kJ:1000,cal:4.184,kcal:4184,'kWh':3.6e6},
  Datenmenge:{B:1,KB:1024,MB:1048576,GB:1073741824,TB:1099511627776},
  Zeit:{s:1,min:60,h:3600,d:86400,wk:604800},
};
let unitsCat='Länge';
function unitsInit(){
  const cats=document.getElementById('units-cats');
  cats.innerHTML=Object.keys(UNITS).map(k=>`<button class="units-cat-btn${k===unitsCat?' active':''}" onclick="unitsSetCat('${k}')">${k}</button>`).join('');
  unitsPopulateSelects();unitsCalc();
}
function unitsSetCat(c){unitsCat=c;document.querySelectorAll('.units-cat-btn').forEach(b=>b.classList.toggle('active',b.textContent===c));unitsPopulateSelects();unitsCalc();}
function unitsPopulateSelects(){
  const units=unitsCat==='Temperatur'?['°C','°F','K']:Object.keys(UNITS[unitsCat]);
  ['u-from','u-to'].forEach((id,i)=>{
    const sel=document.getElementById(id);
    const prev=sel.value;
    sel.innerHTML=units.map(u=>`<option value="${u}">${u}</option>`).join('');
    if(units.includes(prev))sel.value=prev;
    else sel.value=units[i===0?0:1]||units[0];
  });
}
function unitsCalc(){
  const val=parseFloat(document.getElementById('u-val').value);
  const from=document.getElementById('u-from').value;
  const to=document.getElementById('u-to').value;
  let result;
  if(unitsCat==='Temperatur'){
    if(from===to)result=val;
    else if(from==='°C'&&to==='°F')result=val*9/5+32;
    else if(from==='°F'&&to==='°C')result=(val-32)*5/9;
    else if(from==='°C'&&to==='K')result=val+273.15;
    else if(from==='K'&&to==='°C')result=val-273.15;
    else if(from==='°F'&&to==='K')result=(val-32)*5/9+273.15;
    else result=val;
  } else {
    const map=UNITS[unitsCat];
    result=isNaN(val)?null:(val*map[from])/map[to];
  }
  const el=document.getElementById('u-result');
  const lbl=document.getElementById('u-result-label');
  if(result===null||isNaN(result)){el.textContent='–';lbl.textContent='';}
  else{
    const disp=Math.abs(result)<0.0001||Math.abs(result)>1e9?result.toExponential(4):parseFloat(result.toFixed(8)).toLocaleString('de-DE',{maximumFractionDigits:8});
    el.textContent=disp;lbl.textContent=`${val} ${from} = ${disp} ${to}`;
  }
}
