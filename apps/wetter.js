/* ── Wetter ── */
function wetterInit(){}
function wetterLoad(){
  const city=document.getElementById('wetter-city')?.value.trim();if(!city)return;
  const res=document.getElementById('wetter-result');if(res)res.innerHTML='<div style="text-align:center;color:var(--text-3)">Lädt…</div>';
  fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=de&format=json`)
    .then(r=>r.json()).then(d=>{
      if(!d.results?.length){if(res)res.innerHTML='<div style="color:var(--danger)">Stadt nicht gefunden</div>';return;}
      const loc=d.results[0];
      return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,weathercode,apparent_temperature,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&timezone=auto&forecast_days=5`)
        .then(r=>r.json()).then(w=>{
          const wc=w.current;
          const icons=['☀️','⛅','🌤️','☁️','🌧️','⛈️','🌨️','🌫️'];
          function wIcon(code){if(code<=1)return'☀️';if(code<=3)return'⛅';if(code<=48)return'🌫️';if(code<=67)return'🌧️';if(code<=77)return'🌨️';if(code<=82)return'🌧️';return'⛈️';}
          if(res)res.innerHTML=`
            <div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:16px;padding:20px;margin-bottom:12px;text-align:center">
              <div style="font-size:16px;font-weight:600;color:var(--text);margin-bottom:4px">${escHtml(loc.name)}, ${escHtml(loc.country||'')}</div>
              <div style="font-size:56px;margin:8px 0">${wIcon(wc.weathercode)}</div>
              <div style="font-size:48px;font-weight:700;color:var(--text)">${Math.round(wc.temperature_2m)}°C</div>
              <div style="font-size:13px;color:var(--text-3)">Gefühlt ${Math.round(wc.apparent_temperature)}°C · 💧${wc.relative_humidity_2m}% · 💨${Math.round(wc.wind_speed_10m)}km/h</div>
            </div>
            <div style="display:flex;gap:6px;overflow-x:auto">${w.daily.time.map((t,i)=>`<div style="flex:1;min-width:80px;background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:10px;text-align:center"><div style="font-size:11px;color:var(--text-3)">${new Date(t).toLocaleDateString('de-DE',{weekday:'short'})}</div><div style="font-size:24px;margin:4px 0">${wIcon(w.daily.weathercode[i])}</div><div style="font-size:12px;font-weight:600;color:var(--text)">${Math.round(w.daily.temperature_2m_max[i])}°</div><div style="font-size:11px;color:var(--text-3)">${Math.round(w.daily.temperature_2m_min[i])}°</div></div>`).join('')}</div>`;
        });
    }).catch(()=>{if(res)res.innerHTML='<div style="color:var(--danger)">Fehler beim Laden</div>';});
}
function wetterGPS(){
  navigator.geolocation.getCurrentPosition(pos=>{
    fetch(`https://geocoding-api.open-meteo.com/v1/search?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}`)
      .catch(()=>{});
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current=temperature_2m,weathercode,apparent_temperature,relative_humidity_2m,wind_speed_10m&timezone=auto`)
      .then(r=>r.json()).then(w=>{
        const res=document.getElementById('wetter-result');
        function wIcon(code){if(code<=1)return'☀️';if(code<=3)return'⛅';if(code<=48)return'🌫️';return'🌧️';}
        if(res)res.innerHTML=`<div style="text-align:center;padding:20px;background:var(--surface);border-radius:16px"><div style="font-size:48px">${wIcon(w.current.weathercode)}</div><div style="font-size:48px;font-weight:700;color:var(--text)">${Math.round(w.current.temperature_2m)}°C</div><div style="font-size:13px;color:var(--text-3)">Standort · Gefühlt ${Math.round(w.current.apparent_temperature)}°C</div></div>`;
      });
  },()=>alert('Standort nicht verfügbar'));
}
