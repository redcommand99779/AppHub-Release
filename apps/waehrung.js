/* ── Währung ── */
const WAEHR_CURRENCIES=['USD','EUR','GBP','JPY','CHF','CAD','AUD','CNY','KRW','INR','BRL','MXN','SEK','NOK','DKK','PLN','CZK','HUF','RON','TRY'];
let waehrRates={};
function waehrInit(){
  const sel_from=document.getElementById('waehr-from');const sel_to=document.getElementById('waehr-to');
  if(!sel_from)return;
  const opts=WAEHR_CURRENCIES.map(c=>`<option value="${c}">${c}</option>`).join('');
  sel_from.innerHTML=opts;sel_to.innerHTML=opts;
  sel_from.value='USD';sel_to.value='EUR';
  fetch('https://api.frankfurter.dev/v1/latest?base=USD')
    .then(r=>r.json()).then(d=>{waehrRates=d.rates;waehrRates.USD=1;waehrCalc();})
    .catch(()=>{});
}
function waehrCalc(){
  const from=document.getElementById('waehr-from')?.value;const to=document.getElementById('waehr-to')?.value;
  const amount=parseFloat(document.getElementById('waehr-amount')?.value)||1;
  const res=document.getElementById('waehr-result');if(!res)return;
  if(!waehrRates[from]||!waehrRates[to]){res.innerHTML='Lädt…';return;}
  const rate=waehrRates[to]/waehrRates[from];
  res.innerHTML=`${amount.toLocaleString('de-DE')} ${from} = <strong>${(amount*rate).toLocaleString('de-DE',{maximumFractionDigits:4})}</strong> ${to}`;
}
