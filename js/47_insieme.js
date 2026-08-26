/* ═══════════════════════════════════════════════════════════════
   47. INSIEME — la piazza, non il social
   ═══════════════════════════════════════════════════════════════
   Le community delle app di dieta sono il posto dove nascono le
   cose peggiori: la gara al ribasso calorico, il confronto fra
   corpi, il consiglio pericoloso dato da chi non sa. E chi le apre
   scopre che moderare è un lavoro a tempo pieno.

   Qui si sta insieme senza quel prezzo. Quattro riquadri, e uno
   solo richiede moderazione — che è un'approvazione, non un
   presidio.

   1 · LE NOSTRE CARD — messaggi, consigli, storie scritte da noi.
       Editoria: rischio zero, voce nostra.

   2 · I RISULTATI DI TUTTI — numeri aggregati e anonimi, dalla
       telemetria di chi l'ha accesa. «Questa settimana abbiamo
       riparato 12.400 sgarri»: la community come dato collettivo,
       dove nessuno espone sé stesso.

   3 · LE STORIE — chi vuole manda due righe e una foto; finiscono
       in una coda e appaiono solo dopo approvazione, con reazioni
       a set chiuso. NIENTE COMMENTI LIBERI: sono loro la bestia,
       non le foto. Senza campo di testa aperto, non c'è flame da
       spegnere alle due di notte.

   4 · PROPOSTE E SEGNALAZIONI — vivevano sparse (modulo 40, e le
       proposte in 31_piani). Qui hanno una casa sola: si propone,
       si vota, si vede lo stato. Input strutturato, zero
       conversazione da sorvegliare.

   REGOLA DI FONDO: da questa scheda non esce MAI un dato di
   salute. Quello che parte, quando parte, è solo ciò che la
   persona ha scritto apposta per essere letto.                     */

const INSIEME_KEY="nuvia_insieme";
const REAZIONI=["applausi","forza","cuore"];      /* set CHIUSO, per sempre */
window.REAZIONI=REAZIONI;

/* ── LE FRASI ─────────────────────────────────────────────────────
   Le icone dicono «ti ho letto». Le parole dicono «ci sono». Ma un
   campo di testo libero è la bestia che abbiamo deciso di non far
   entrare: quindi frasi PRESTAMPATE, un set chiuso come le icone.

   Tutte di sostegno, nessuna valutativa: niente «bravo, quanto hai
   perso» né «che fisico» — appena si valuta il risultato di un
   altro, la piazza diventa il posto che volevamo evitare. Si tifa
   per la persona, non per il numero.

   Una sola frase per storia: chi ne manda cinque non sta
   sostenendo, sta occupando. */
/* Le chiavi stanno qui, i TESTI si scelgono a mano dentro
   frasiTesto(): `tr(variabile)` è invisibile al collaudo delle
   traduzioni e lascia chiavi orfane nel dizionario. È la terza volta
   che ci casco (ciclo, agende, frasi): la regola è una sola —
   OGNI tr() ha una stringa letterale dentro, sempre. */
const FRASI=["coraggio","continua","con te","anchio","forte","bello","grazie"];
window.FRASI=FRASI;
function frasiTesto(k){
  return k==="coraggio"?tr("Coraggio!")
       :k==="continua" ?tr("Continua così")
       :k==="con te"   ?tr("Sono con te")
       :k==="anchio"   ?tr("Ci sono passato anch'io")
       :k==="forte"    ?tr("Sei più forte di quel giorno")
       :k==="bello"    ?tr("Bello leggerti")
       :k==="grazie"   ?tr("Grazie di averlo scritto")
       :"";}
window.frasiTesto=frasiTesto;

function insieme(){
  let d=null;
  try{d=JSON.parse(localStorage.getItem(INSIEME_KEY)||"null");}catch(e){}
  if(!d||typeof d!=="object")d={card:[],storie:[],aggregati:null,mie:[],reazioni:{},visto:null};
  d.card=d.card||[];d.storie=d.storie||[];d.mie=d.mie||[];d.reazioni=d.reazioni||{};
  return d;}
function insiemeSalva(d){
  try{localStorage.setItem(INSIEME_KEY,JSON.stringify(d));}catch(e){}}
window.insieme=insieme;

/* ── 1 e 2 · quello che arriva da noi ─────────────────────────── */
/* Il backend serve card e aggregati già pronti: l'app non calcola
   nulla sugli altri, li mostra e basta. In assenza di rete resta
   quello che c'era: una piazza vuota è peggio di una piazza vecchia. */
window.insiemeAggiorna=async()=>{
  try{
    const r=await fetch(contoUrl()+"/insieme",{headers:{"Accept":"application/json"}});
    if(!r.ok)return false;
    const j=await r.json();
    const d=insieme();
    if(Array.isArray(j.card))d.card=j.card.slice(0,20);
    if(Array.isArray(j.storie))d.storie=j.storie.slice(0,30);
    if(j.aggregati&&typeof j.aggregati==="object")d.aggregati=j.aggregati;
    d.visto=new Date().toISOString();
    insiemeSalva(d);
    return true;
  }catch(e){return false;}};

/* Gli aggregati si mostrano solo se sono davvero aggregati: sotto una
   certa soglia di persone, un numero «anonimo» non lo è più. */
function insiemeAggregati(){
  const a=insieme().aggregati;
  if(!a||!(+a.persone>=50))return null;
  return a;}
window.insiemeAggregati=insiemeAggregati;

/* ── 3 · le storie ────────────────────────────────────────────── */
/* Si manda, si aspetta. Nessuna storia appare senza che qualcuno
   l'abbia letta: è l'unico presidio, e costa dieci minuti al giorno
   invece di una notte in bianco. */
window.storiaManda=async(testo,foto)=>{
  const t=String(testo||"").trim();
  if(t.length<20)return {ok:false,perche:"corta"};
  if(t.length>600)return {ok:false,perche:"lunga"};
  /* il tono vale anche per chi scrive: una storia che colpevolizza
     gli altri non entra in coda, e glielo diciamo subito. */
  const vietata=(typeof PAROLE_VIETATE!=="undefined"?PAROLE_VIETATE:[])
    .find(p=>t.toLowerCase().indexOf(String(p).toLowerCase())>=0);
  if(vietata)return {ok:false,perche:"tono",parola:vietata};

  const d=insieme();
  d.mie.push({t,foto:foto?String(foto).slice(0,200):null,
    inviata:new Date().toISOString(),stato:"in attesa"});
  insiemeSalva(d);
  try{
    await fetch(contoUrl()+"/insieme/storia",{method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({t,foto:foto||null})});
  }catch(e){/* resta in coda locale: si riproverà */}
  return {ok:true,stato:"in attesa"};};

/* Le reazioni sono un set chiuso e si contano sul telefono: nessuno
   deve poter scrivere una riga di testo verso un'altra persona. */
window.storiaFrase=(id,quale)=>{
  if(FRASI.indexOf(quale)<0)return false;
  const d=insieme();
  const k="f"+String(id);
  /* una sola per storia: la seconda sostituisce, non si somma */
  d.reazioni[k]=(d.reazioni[k]===quale)?null:quale;
  insiemeSalva(d);
  try{fetch(contoUrl()+"/insieme/reazione",{method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id,frase:d.reazioni[k]})});}catch(e){}
  return true;};

window.storiaReagisci=(id,quale)=>{
  if(REAZIONI.indexOf(quale)<0)return false;
  const d=insieme();
  const k=String(id);
  d.reazioni[k]=(d.reazioni[k]===quale)?null:quale;   /* si può togliere */
  insiemeSalva(d);
  try{fetch(contoUrl()+"/insieme/reazione",{method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id,quale:d.reazioni[k]})});}catch(e){}
  return true;};

/* ── 4 · proposte e segnalazioni, finalmente in un posto solo ─── */
/* Il modulo 40 resta il motore (scheda unica bug+idee): qui si
   espone il suo elenco, così la persona trova tutto in Insieme
   invece che in fondo alle impostazioni. */
function insiemeProposte(){
  try{
    if(typeof segStorico==="function")return segStorico();
    const l=JSON.parse(localStorage.getItem("nuvia_segnalazioni")||"[]");
    return Array.isArray(l)?l:[];
  }catch(e){return [];}}
window.insiemeProposte=insiemeProposte;

/* ── quello che esce dal telefono: dichiarato, e solo questo ──── */
const INSIEME_CAMPI_IN_USCITA=["t","foto","id","quale"];
window.INSIEME_CAMPI_IN_USCITA=INSIEME_CAMPI_IN_USCITA;

/* ── la pagina ────────────────────────────────────────────────── */
function renderInsieme(){
  const el=document.getElementById("pg-insieme");
  if(!el)return;
  const d=insieme();
  const agg=insiemeAggregati();
  let h="";

  h+=`<div class="card"><h2>${tr("Insieme")}</h2>
    <div class="hint">${esc(tr("Nessun commento, nessuna classifica, nessun confronto fra corpi. Si sta insieme, non si gareggia."))}</div></div>`;

  /* i numeri di tutti */
  if(agg)h+=`<div class="card"><h2>${tr("Questa settimana, insieme")}</h2>
    <div class="ins-num">
      ${agg.riparati!=null?`<div><b>${esc(String(agg.riparati))}</b><span>${esc(tr("imprevisti riassorbiti dai piani"))}</span></div>`:""}
      ${agg.piani!=null?`<div><b>${esc(String(agg.piani))}</b><span>${esc(tr("settimane portate a casa"))}</span></div>`:""}
      ${agg.persone!=null?`<div><b>${esc(String(agg.persone))}</b><span>${esc(tr("persone che hanno acceso i numeri anonimi"))}</span></div>`:""}
    </div>
    <div class="hint">${esc(tr("Numeri sommati e senza nome: nessuno di questi conti risale a una persona."))}</div></div>`;

  /* le nostre card */
  (d.card||[]).slice(0,6).forEach(c=>{
    h+=`<div class="card ins-card"><h2>${esc(c.titolo||"")}</h2>
      <div>${esc(c.testo||"")}</div></div>`;});

  /* le storie approvate */
  if((d.storie||[]).length){
    h+=`<div class="gsec">${tr("Storie")}</div>`;
    d.storie.slice(0,12).forEach(s=>{
      const mia=d.reazioni[String(s.id)]||null;
      h+=`<div class="card ins-storia">
        <div>${esc(s.t||"")}</div>
        <div class="ins-reaz">${REAZIONI.map(r=>
          `<button title="${tr("Apri")}" class="chipbtn${mia===r?" on":""}" onclick="storiaReagisci('${esc(String(s.id))}','${r}')">${ic(reazIcona(r),16)} ${esc(reazNome(r))}</button>`).join("")}</div>
        <div class="ins-frasi">${FRASI.map(k=>{
          const scelta=d.reazioni["f"+String(s.id)]===k;
          return `<button class="chipbtn${scelta?" on":""}" onclick="storiaFrase('${esc(String(s.id))}','${k}')">${esc(frasiTesto(k))}</button>`;}).join("")}</div>
      </div>`;});}

  /* la propria coda */
  if((d.mie||[]).length){
    h+=`<div class="gsec">${tr("Le tue")}</div>`;
    d.mie.slice(-3).reverse().forEach(m=>{
      h+=`<div class="card"><div>${esc(m.t.slice(0,140))}${m.t.length>140?"…":""}</div>
        <div class="hint">${esc(tr("Stato"))}: ${esc(m.stato==="pubblicata"?tr("pubblicata"):tr("in attesa"))}</div></div>`;});}

  /* proposte e segnalazioni: la casa è qui */
  h+=`<div class="gsec">${tr("Proposte e segnalazioni")}</div>`;
  h+=(typeof segnalazioniHTML==="function")?segnalazioniHTML():
     `<div class="card"><div class="hint">${esc(tr("Da qui puoi proporre miglioramenti e segnalare problemi."))}</div></div>`;

  el.innerHTML=h;}
window.renderInsieme=renderInsieme;

function reazIcona(r){return r==="applausi"?"star":(r==="forza"?"sport":"heart");}
function reazNome(r){return r==="applausi"?tr("Bravo"):(r==="forza"?tr("Forza"):tr("Mi arriva"));}
