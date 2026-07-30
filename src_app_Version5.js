// src/app.js
// Moved from inline index.html script. Uses module scope and event listeners.

const CANTONI = [
  {name:'Argovia', rate:0.20},
  {name:'Appenzello Esterno', rate:0.19},
  {name:'Appenzello Interno', rate:0.16},
  {name:'Basilea Campagna', rate:0.22},
  {name:'Basilea Città', rate:0.24},
  {name:'Berna', rate:0.21},
  {name:'Friburgo', rate:0.22},
  {name:'Ginevra', rate:0.25},
  {name:'Glarona', rate:0.19},
  {name:'Grigioni', rate:0.19},
  {name:'Giura', rate:0.23},
  {name:'Lucerna', rate:0.19},
  {name:'Neuchâtel', rate:0.25},
  {name:'Nidvaldo', rate:0.16},
  {name:'Obvaldo', rate:0.17},
  {name:'San Gallo', rate:0.20},
  {name:'Sciaffusa', rate:0.20},
  {name:'Soletta', rate:0.21},
  {name:'Svitto', rate:0.16},
  {name:'Ticino', rate:0.23},
  {name:'Turgovia', rate:0.19},
  {name:'Uri', rate:0.17},
  {name:'Vallese', rate:0.22},
  {name:'Vaud', rate:0.24},
  {name:'Zugo', rate:0.15},
  {name:'Zurigo', rate:0.22}
];

const PROFILES = {
  basso: {
    rend: 1.5, vol: 1.0,
    desc: 'Orientato alla sicurezza: preferisci fondi obbligazionari e monetari con oscillazioni di valore contenute, accettando rendimenti più bassi in cambio di maggiore stabilità.',
    badges: ['Fondi obbligazionari', 'Fondi monetari', 'Bassa volatilità']
  },
  medio: {
    rend: 3.5, vol: 4.0,
    desc: 'Orientato alla crescita del capitale: cerchi un equilibrio tra rendimento e rischio, con un mix di fondi azionari e obbligazionari. Accetti oscillazioni moderate del valore investito.',
    badges: ['Fondi misti', 'Azionario/obbligazionario', 'Volatilità moderata']
  },
  alto: {
    rend: 5.5, vol: 8.0,
    desc: 'Speculativo: privilegi il potenziale di rendimento più elevato, prevalentemente tramite fondi azionari. Accetti forti oscillazioni di valore e un rischio di perdita maggiore.',
    badges: ['Fondi azionari', 'Elevata volatilità', 'Orizzonte lungo consigliato']
  },
  custom: {
    rend: 3.5, vol: 4.0,
    desc: 'Imposta tu il rendimento atteso e l\'oscillazione annua, ad esempio sulla base della selezione di fondi definita con il tuo consulente.',
    badges: ['Fondi selezionati su misura']
  }
};

let currentProfile = 'basso';

function fmt(v){
  return new Intl.NumberFormat('de-CH',{style:'currency',currency:'CHF',minimumFractionDigits:0,maximumFractionDigits:0}).format(v);
}
function fmtPct(v){ return (v*100).toFixed(0)+'%'; }

function populateCantoni(selEl){
  selEl.innerHTML = CANTONI.map((c,i)=>`<option value="${i}">${c.name}</option>`).join('');
  const zh = CANTONI.findIndex(c=>c.name==='Zurigo');
  if(zh>=0) selEl.value = zh;
}

function setProfile(p, elements){
  currentProfile = p;
  const tabs = document.querySelectorAll('.risk-tab');
  tabs.forEach(t=>{
    const is = t.dataset.p === p;
    t.classList.toggle('active', is);
    t.setAttribute('aria-selected', is ? 'true' : 'false');
    if(is) t.focus();
  });

  const customBox = document.getElementById('customBox');
  if(p === 'custom'){
    customBox.classList.add('active');
    customBox.classList.remove('visually-hidden');
    customBox.setAttribute('aria-hidden', 'false');
  } else {
    customBox.classList.remove('active');
    customBox.setAttribute('aria-hidden', 'true');
  }

  document.getElementById('riskDescText').textContent = PROFILES[p].desc;
  document.getElementById('fundBadges').innerHTML = PROFILES[p].badges.map(b=>`<span class="fund-badge">${b}</span>`).join('');
  calc();
}

function applyMax(){
  const tipoEl = document.getElementById('tipo');
  const premioEl = document.getElementById('premio');
  const reddito = Number(document.getElementById('reddito').value) || 0;
  const tipo = tipoEl.value;
  if(tipo === 'employee'){
    const max = Number(tipoEl.selectedOptions[0].dataset.max) || 7258;
    premioEl.max = max;
    if(Number(premioEl.value) > max) premioEl.value = max;
  } else {
    const declaredMax = Number(tipoEl.selectedOptions[0].dataset.max) || 36288;
    const calcMax = Math.floor(reddito * 0.2);
    const max = Math.min(declaredMax, calcMax || declaredMax);
    premioEl.max = max;
    if(Number(premioEl.value) > max) premioEl.value = max;
  }
}

function buildCantonTable(premio, anni, selectedIdx){
  const body = document.getElementById('cantonTableBody');
  const rows = CANTONI.map((c,i)=>{
    const annuo = premio * c.rate;
    const totale = annuo * anni;
    return `<tr class="${i===selectedIdx?'hi':''}">
      <td>${c.name}${i===selectedIdx?' ●':''}</td>
      <td class="r">${fmtPct(c.rate)}</td>
      <td class="r">${fmt(Math.round(annuo))}</td>
      <td class="r">${fmt(Math.round(totale))}</td>
    </tr>`;
  }).join('');
  body.innerHTML = rows;
}

function drawChart(serieCentr, serieLow, serieHigh, serieSenza, serieBenef, etaStart, rendNettoPct){
  const svg = document.getElementById('chart');
  const w=800,h=220,pad={t:10,r:130,b:26,l:64};
  const n = serieCentr.length || 1;
  const max = Math.max(...(serieHigh.length?serieHigh:[0]), ...(serieBenef.length?serieBenef:[0]), 1);
  const cw = w-pad.l-pad.r, ch = h-pad.t-pad.b;
  const x = i => pad.l + (i/(n-1||1))*cw;
  const y = v => pad.t + ch - (v/max)*ch;

  let grid='', ylab='';
  for(let g=0; g<=4; g++){
    const val = max*g/4;
    const yp = y(val);
    grid += `<line x1="${pad.l}" y1="${yp}" x2="${w-pad.r}" y2="${yp}" stroke="#d9d6cb" stroke-width="1" stroke-dasharray="2,3"/>`;
    ylab += `<text x="${pad.l-8}" y="${yp+3}" text-anchor="end" font-size="9" fill="#5c5b52" font-family="monospace">${Math.round(val/1000)}k</text>`;
  }

  // ensure arrays have length n by padding with last value
  function padSeries(arr){
    if(!arr.length) return Array(n).fill(0);
    if(arr.length === n) return arr;
    const out = arr.slice();
    while(out.length < n) out.push(out[out.length-1] || 0);
    return out;
  }
  serieCentr = padSeries(serieCentr);
  serieLow = padSeries(serieLow);
  serieHigh = padSeries(serieHigh);
  serieSenza = padSeries(serieSenza);
  serieBenef = padSeries(serieBenef);

  let bandD = `M ${x(0)} ${y(serieLow[0])}`;
  serieLow.forEach((v,i)=>{ bandD += ` L ${x(i)} ${y(v)}`; });
  for(let i=n-1;i>=0;i--){ bandD += ` L ${x(i)} ${y(serieHigh[i])}`; }
  bandD += ' Z';

  let lineCentr='', lineSenza='', lineBenef='';
  serieCentr.forEach((v,i)=>{ lineCentr += (i===0?'M':'L')+` ${x(i)} ${y(v)}`; });
  serieSenza.forEach((v,i)=>{ lineSenza += (i===0?'M':'L')+` ${x(i)} ${y(v)}`; });
  serieBenef.forEach((v,i)=>{ lineBenef += (i===0?'M':'L')+` ${x(i)} ${y(v)}`; });

  let xlab='';
  const step = Math.max(1, Math.floor(n/8));
  serieCentr.forEach((v,i)=>{
    if(i%step===0 || i===n-1) xlab += `<text x="${x(i)}" y="${h-8}" text-anchor="middle" font-size="9" fill="#5c5b52" font-family="monospace">${etaStart+i+1}</text>`;
  });

  const lastX = x(n-1);
  const yBenef = y(serieBenef[n-1]);
  const yFinal = y(serieCentr[n-1]);
  const ySenza = y(serieSenza[n-1]);
  const annot = `
    <circle cx="${lastX}" cy="${yBenef}" r="3.5" fill="#2c6e49"/>
    <text x="${lastX+8}" y="${yBenef-4}" font-size="10" font-weight="700" fill="#2c6e49" font-family="monospace">${fmt(Math.round(serieBenef[n-1]))}</text>
    <text x="${lastX+8}" y="${yBenef+9}" font-size="9" fill="#5c5b52" font-family="monospace">con risparmio fiscale</text>
    <circle cx="${lastX}" cy="${yFinal}" r="3.5" fill="#d5001c"/>
    <text x="${lastX+8}" y="${yFinal+4}" font-size="10" font-weight="700" fill="#d5001c" font-family="monospace">${fmt(Math.round(serieCentr[n-1]))}</text>
    <circle cx="${lastX}" cy="${ySenza}" r="3" fill="#5c5b52"/>
    <text x="${lastX+8}" y="${ySenza+3}" font-size="9" fill="#5c5b52" font-family="monospace">${fmt(Math.round(serieSenza[n-1]))} versati</text>
  `;

  svg.innerHTML = grid + ylab + xlab + annot +
    `<path d="${bandD}" fill="#d5001c" fill-opacity="0.12" stroke="none"/>` +
    `<path d="${lineSenza}" fill="none" stroke="#5c5b52" stroke-width="1.75" stroke-dasharray="5,4"/>` +
    `<path d="${lineCentr}" fill="none" stroke="#d5001c" stroke-width="2.25" stroke-linecap="round"/>` +
    `<path d="${lineBenef}" fill="none" stroke="#2c6e49" stroke-width="2.5" stroke-linecap="round"/>`;
}

function calc(){
  const reddito = parseFloat(document.getElementById('reddito').value)||0;
  const cantoneIdx = parseInt(document.getElementById('cantone').value,10);
  const canton = CANTONI[cantoneIdx] || CANTONI[0];
  const aliquota = canton.rate;
  const eta = parseInt(document.getElementById('eta').value,10) || 35;
  const etaRit = parseInt(document.getElementById('etaRit').value,10) || 65;
  const premio = parseFloat(document.getElementById('premio').value) || 0;
  const costiPct = parseFloat(document.getElementById('costi').value) || 0;

  let rendPct, volPct;
  if(currentProfile==='custom'){
    rendPct = parseFloat(document.getElementById('custRend').value)||0;
    volPct = parseFloat(document.getElementById('custVol').value)||0;
  } else {
    rendPct = PROFILES[currentProfile].rend;
    volPct = PROFILES[currentProfile].vol;
  }

  // rendimento netto = rendimento lordo dei fondi meno i costi di intermediazione/gestione
  const rendNettoPct = rendPct - costiPct;
  const rend = rendNettoPct/100;
  const rendLow = Math.max(-0.05,(rendNettoPct-volPct)/100);
  const rendHigh = (rendNettoPct+volPct)/100;

  document.getElementById('rmRend').textContent = rendPct.toFixed(1)+'% lordo';
  document.getElementById('rmVol').textContent = '± '+volPct.toFixed(1)+'%';
  document.getElementById('rmLow').textContent = (rendLow*100).toFixed(1)+'% netto';
  document.getElementById('rmHigh').textContent = (rendHigh*100).toFixed(1)+'% netto';

  const anni = Math.max(1, etaRit - eta);
  const risparmioAnnuo = premio * aliquota;
  const risparmioCumulato = risparmioAnnuo * anni;

  let cCentr=0, cLow=0, cHigh=0, cSenza=0, cBenef=0;
  const serieCentr=[], serieLow=[], serieHigh=[], serieSenza=[], serieBenef=[];
  for(let i=1;i<=anni;i++){
    cCentr = cCentr*(1+rend) + premio;
    cLow = cLow*(1+rendLow) + premio;
    cHigh = cHigh*(1+rendHigh) + premio;
    cSenza = cSenza + premio;
    cBenef = cBenef*(1+rend) + premio + risparmioAnnuo;
    serieCentr.push(cCentr); serieLow.push(cLow); serieHigh.push(cHigh); serieSenza.push(cSenza); serieBenef.push(cBenef);
  }

  const beneficioTotale = cBenef;
  const capitaleVersato = premio * anni;

  document.getElementById('kAliquota').textContent = fmtPct(aliquota);
  document.getElementById('kAliquotaS').textContent = canton.name;
  document.getElementById('k1').textContent = fmt(risparmioAnnuo);
  document.getElementById('k2').textContent = fmt(risparmioCumulato);
  document.getElementById('k2s').textContent = 'in ' + anni + ' anni, fino ai ' + etaRit;
  document.getElementById('kVersato').textContent = fmt(capitaleVersato);
  document.getElementById('kVersatoS').textContent = premio + '/anno × ' + anni + ' anni';
  document.getElementById('kPerf').textContent = (rendNettoPct>=0?'+':'') + rendNettoPct.toFixed(1) + '%';
  document.getElementById('kPerfS').textContent = 'lordo ' + rendPct.toFixed(1) + '% − costi ' + costiPct.toFixed(1) + '%';
  document.getElementById('k3').textContent = fmt(Math.round(cCentr));
  document.getElementById('k3s').textContent = 'range ' + fmt(Math.round(cLow)) + ' – ' + fmt(Math.round(cHigh));
  document.getElementById('k4').textContent = fmt(Math.round(beneficioTotale));
  document.getElementById('k4s').textContent = 'reinvestendo ' + fmt(risparmioAnnuo) + '/anno di risparmio fiscale allo stesso rendimento netto (' + rendNettoPct.toFixed(1) + '%)';

  // update live region summary
  const live = document.getElementById('kpiLive');
  live.textContent = `Aliquota ${fmtPct(aliquota)}; Risparmio annuo ${fmt(Math.round(risparmioAnnuo))}; Capitale stimato ${fmt(Math.round(cCentr))}.`;

  drawChart(serieCentr, serieLow, serieHigh, serieSenza, serieBenef, eta, rendNettoPct);
  buildCantonTable(premio, anni, cantoneIdx);
}

function initEventListeners(){
  const redditoEl = document.getElementById('reddito');
  const cantoneEl = document.getElementById('cantone');
  const etaEl = document.getElementById('eta');
  const etaRitEl = document.getElementById('etaRit');
  const premioEl = document.getElementById('premio');
  const costiEl = document.getElementById('costi');
  const tipoEl = document.getElementById('tipo');
  const custRendEl = document.getElementById('custRend');
  const custVolEl = document.getElementById('custVol');
  const tabs = Array.from(document.querySelectorAll('.risk-tab'));

  // basic inputs
  [redditoEl, cantoneEl, etaEl, etaRitEl, premioEl, costiEl].forEach(el=>{
    el.addEventListener('input', ()=>{
      if(el === redditoEl) applyMax();
      calc();
    });
    el.addEventListener('change', ()=>{
      if(el === cantoneEl) calc();
    });
  });

  tipoEl.addEventListener('change', ()=>{
    applyMax();
    calc();
  });

  [custRendEl, custVolEl].forEach(el=>{
    el.addEventListener('input', ()=> calc());
  });

  // tabs: click + keyboard navigation
  tabs.forEach((tab, idx)=>{
    tab.addEventListener('click', ()=> setProfile(tab.dataset.p));
    tab.addEventListener('keydown', (e)=>{
      let next;
      if(e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
      if(e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
      if(e.key === 'Home') next = 0;
      if(e.key === 'End') next = tabs.length -1;
      if(next !== undefined){
        e.preventDefault();
        tabs[next].focus();
        setProfile(tabs[next].dataset.p);
      }
      if(e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setProfile(tab.dataset.p);
      }
    });
  });

  // modal open/close
  const requestBtn = document.getElementById('requestBtn');
  const overlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  requestBtn.addEventListener('click', ()=>{
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
    document.getElementById('modal').focus();
  });
  modalClose.addEventListener('click', ()=>{
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
  });
  overlay.addEventListener('click', (e)=>{
    if(e.target === overlay){
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
    }
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  const cantoneEl = document.getElementById('cantone');
  populateCantoni(cantoneEl);
  initEventListeners();
  applyMax();
  setProfile('basso');
  calc();
});