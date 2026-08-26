/* ═══════════════════════════════════════════════════════════════
   32. COSA CONDIVIDI CON IL TUO STUDIO (Sprint 7)
   ═══════════════════════════════════════════════════════════════
   Qui il paziente decide, categoria per categoria, cosa il suo studio
   può vedere. Tre cose che questo modulo fa e che vale la pena
   scrivere per esteso, perché sono la differenza fra un'app che cura
   e un'app che sorveglia:

   1. NON SI PARTE CON TUTTO ACCESO. Il consenso si dà, non si toglie.
      Un'impostazione già spuntata che si può disattivare è una scelta
      fatta da noi al posto della persona.
   2. IL RAPPORTO COL CIBO NON È IN ELENCO. Non c'è una casella da
      lasciare spenta: non deve esistere la domanda. Serve a Nuvia per
      scegliere le parole, non è una diagnosi da passare a un terzo.
   3. SI VEDE CHI HA GUARDATO, E QUANDO. Il monitoraggio deve
      somigliare alla cura, non al controllo, e per chi è guardato la
      differenza sta tutta nel saperlo.

   E una quarta, tecnica ma che vale quanto le altre: quello che parte
   da qui è un RIASSUNTO, non il diario. Peso, percentuale di aderenza,
   allenamenti della settimana. Il pasto per pasto esce solo con il
   consenso separato «dettaglio», che si accende per una visita e si
   spegne subito dopo.                                                */

const CONS_CAT=[
  {k:"peso",     t:"Il tuo peso",
   d:"Peso di partenza, quello di oggi e l'obiettivo. Non le singole pesate."},
  {k:"aderenza", t:"Quanto segui il piano",
   d:"Una percentuale della settimana e del mese, e da quanti giorni segni."},
  {k:"sport",    t:"Gli allenamenti",
   d:"Quanti ne fai in una settimana e di che tipo."},
  {k:"messaggi", t:"Ricevere messaggi dallo studio",
   d:"Promemoria e commenti scritti da chi ti segue, fra una visita e l'altra. Chiuderlo non chiude la cura."}
];
const CONS_DETT={k:"dettaglio",t:"Il diario, pasto per pasto",
  d:"Serve per una visita. Puoi accenderlo prima e spegnerlo subito dopo."};
window.CONS_CAT=CONS_CAT;
window.CONS_DETT=CONS_DETT;

/* Titoli e descrizioni arrivano a tr() dentro una variabile: invisibili a
   una ricerca testuale, come le frasi degli stati vuoti e del tono. */
window.consensiFrasi=function(){
  return CONS_CAT.concat([CONS_DETT]).flatMap(c=>[c.t,c.d]);};

function consensi(){
  if(!S.consensi||typeof S.consensi!=="object")S.consensi={};
  const C=S.consensi;
  /* Tutto spento finché non si dice il contrario: il consenso si dà. */
  CONS_CAT.concat([CONS_DETT]).forEach(c=>{
    if(typeof C[c.k]!=="boolean")C[c.k]=false;});
  if(!Array.isArray(C.accessi))C.accessi=[];
  return C;}
window.consensi=consensi;

function haStudio(){
  try{const v=(S.conto&&S.conto.vista)||null;return !!(v&&v.studio);}catch(e){return false;}}
window.haStudio=haStudio;

function condivideQualcosa(){
  const C=consensi();
  return CONS_CAT.concat([CONS_DETT]).some(c=>C[c.k]===true);}
window.condivideQualcosa=condivideQualcosa;

/* ── Il riassunto ───────────────────────────────────────────────
   Si costruisce QUI, e contiene solo ciò che il paziente ha acceso.
   Il server rifiuta comunque il resto, ma un'app che manda dati non
   consentiti sperando nel filtro altrui è un'app di cui non fidarsi. */
function riassuntoDaMandare(){
  const C=consensi(),out={};
  if(C.peso){
    const p=(typeof pesoDati==="function")?pesoDati():null;
    if(p)out.peso={attuale:p.attuale,partenza:p.partenza,obiettivo:p.obiettivo,serie:p.n};}
  if(C.aderenza){
    const t=(typeof settimanaTacche==="function")?settimanaTacche():[];
    const vissuti=t.filter(x=>x!=="futuro").length||1;
    const pieni=t.filter(x=>x==="pieno").length;
    const segnati=t.filter(x=>x!=="futuro"&&x!=="vuoto").length;
    out.aderenza={settimana:Math.round(pieni/vissuti*100),
      giorniSegnati:segnati,ultimoGiorno:iso(new Date())};}
  if(C.sport){
    let min=0;
    try{S.week.days.forEach((d,i)=>{(SorgentiAttivita.allenamentiDelGiorno(i)||[])
      .forEach(w=>{min+=(+w.min||+w.minuti||0);});});}catch(e){}
    let tipi=[];
    try{tipi=(allen().abituali||[]).map(x=>x.sport).slice(0,6);}catch(e){}
    out.sport={settimana:(typeof workoutsThisWeek==="function")?workoutsThisWeek():0,
      minuti:min,tipi};}
  if(C.dettaglio){
    /* Il dettaglio è il cerchio più stretto: si manda una riga per
       giorno, non il testo dei pasti. Serve al professionista per
       capire l'andamento, non per leggere cosa ha mangiato a colazione. */
    const g=[];
    try{S.week.days.forEach((d,i)=>{
      const e=eatenOfDay(i);
      g.push({giorno:i,kcal:Math.round(e.k||0),proteine:Math.round(e.p||0),
        pastiSegnati:dayItems(i).filter(it=>{
          const st=S.week.days[it.pdi].meals[it.mi];return st.done||st.skip;}).length});});}catch(e){}
    out.dettaglio={giorni:g};}
  return out;}
window.riassuntoDaMandare=riassuntoDaMandare;

/* L'invio: silenzioso, ma mai automatico su cose non consentite.
   Se non c'è nulla da mandare, si manda il vuoto — che sul server
   cancella quello che c'era. */
window.condividiOra=async()=>{
  if(!haStudio()||typeof contoChiama!=="function")return null;
  try{
    const r=await contoChiama("/condividi",{metodo:"POST",
      corpo:{dati:riassuntoDaMandare(),nome:(S.profile&&S.profile.name)||""}});
    if(r.stato===200){consensi().inviatoIl=new Date().toISOString();save();}
    return r;
  }catch(e){return null;}};

window.consensoSalva=async(k,v)=>{
  const C=consensi();C[k]=!!v;save();
  try{
    const corpo={};CONS_CAT.concat([CONS_DETT]).forEach(c=>{corpo[c.k]=C[c.k]===true;});
    await contoChiama("/consenso",{metodo:"POST",corpo});
    await condividiOra();
  }catch(e){}
  try{render(cur);}catch(e){}};

window.accessiAggiorna=async()=>{
  if(!haStudio())return;
  try{
    const r=await contoChiama("/accessi");
    if(r.stato===200&&Array.isArray(r.dati.accessi)){
      consensi().accessi=r.dati.accessi.slice(0,20);save();
      try{render(cur);}catch(e){}}
  }catch(e){}};

/* ── La pagina ──────────────────────────────────────────────────── */
function consensiHTML(){
  if(!haStudio())return "";
  const C=consensi();
  const v=(S.conto&&S.conto.vista)||{};
  const riga=(c)=>`<label class="ck consriga" data-cons="${esc(c.k)}">
    <input type="checkbox" ${C[c.k]?"checked":""} onchange="consensoSalva('${esc(c.k)}',this.checked)">
    <span><b>${esc(tr(c.t))}</b><br><span class="hint">${esc(tr(c.d))}</span></span></label>`;

  const acc=(C.accessi||[]).slice(0,3);
  return `<div class="card" data-consensi="1"><h2>${esc(tr("Cosa vede {s}",{s:v.studio||tr("il tuo studio")}))}</h2>
    <div class="hint">${esc(tr("Niente parte da qui se non lo accendi tu. Puoi spegnere quando vuoi: spegnere cancella, non nasconde."))}</div>
    <div class="conslist">${CONS_CAT.map(riga).join("")}</div>
    <div class="hint" style="margin-top:16px"><b>${esc(tr("Solo per una visita"))}</b></div>
    <div class="conslist">${riga(CONS_DETT)}</div>
    <div class="hint" style="margin-top:16px">${esc(tr("Come stai e il tuo rapporto con il cibo non si condividono: restano fra te e Nuvia."))}</div>
    ${acc.length?`<div class="hint" style="margin-top:16px"><b>${esc(tr("Chi ha guardato"))}</b></div>
      <div class="conslist">${acc.map(a=>
        `<div class="hint" data-accesso="1">${esc(fmtQuando(a.quando))} — ${esc(a.operatore||tr("il tuo studio"))}</div>`).join("")}</div>`
     :(condivideQualcosa()?`<div class="hint" style="margin-top:16px">${esc(tr("Nessuno ha ancora guardato i tuoi dati."))}</div>`:"")}
  </div>`;}
window.consensiHTML=consensiHTML;

function fmtQuando(iso8601){
  try{
    const d=new Date(iso8601);
    const g=Math.floor((Date.now()-d.getTime())/86400000);
    if(g===0)return tr("oggi");
    if(g===1)return tr("ieri");
    if(g<7)return tr("{n} giorni fa",{n:g});
    return d.toLocaleDateString(dataLoc());
  }catch(e){return "";}}
window.fmtQuando=fmtQuando;
