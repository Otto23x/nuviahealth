/* ═══════════════════════════════════════════════════════════════
   29. ALLENAMENTI IBRIDI (Sprint 4)
   ═══════════════════════════════════════════════════════════════
   Il modello vecchio era top-down: l'app decide la scheda, tu la
   esegui. Funziona per chi parte da zero e non funziona per nessun
   altro, perché quasi tutti hanno già qualcosa — il padel del
   martedì, la palestra del giovedì, il cane da portare fuori.

   Quindi si ribalta: LA PERSONA PORTA I SUOI ALLENAMENTI, l'app li
   struttura e li mette in settimana. Poi, e solo poi, integra:
   suggerisce quantità, distribuzione e recupero. Mai sostituisce, mai
   prescrive, mai cancella quello che c'è.

   Tre regole ferree, tutte collaudate:
   1. UN SUGGERIMENTO A SETTIMANA. Un allenatore che parla ogni
      giorno viene spento dopo tre giorni.
   2. SEMPRE CON IL MOTIVO. «Aggiungi una sessione» è un ordine;
      «con il tuo obiettivo una terza sessione leggera renderebbe il
      deficit più sostenibile» è un ragionamento che si può rifiutare.
   3. MAI A CHI HA UN RAPPORTO DIFFICILE COL CIBO. Suggerire volume
      di esercizio a chi mangia per compensare è la strada più corta
      per trasformare il movimento in penitenza. profiloDelicato()
      esiste dallo Sprint 3: qui si usa, e vale più di ogni altra
      regola di questo file.                                        */

/* ── Lo stato ───────────────────────────────────────────────────── */
function allen(){
  if(!S.allen||typeof S.allen!=="object")S.allen={};
  const A=S.allen;
  if(!Array.isArray(A.abituali))A.abituali=[];   /* quello che fa di solito */
  if(!A.spunto||typeof A.spunto!=="object")A.spunto={};
  return A;}
window.allen=allen;

/* ── Gli allenamenti abituali ───────────────────────────────────
   «Padel il martedì, palestra il giovedì»: si raccontano una volta e
   restano. Da qui l'app sa cosa aspettarsi, e può accorgersi di una
   settimana diversa dal solito senza chiedere niente. */
function abitualiAggiungi(sport,giorno,min){
  const A=allen();
  const s=String(sport||"").replace(/<[^>]*>/g,"").trim().slice(0,40);
  if(!s)return null;
  const g=(giorno>=0&&giorno<=6)?+giorno:null;
  const m=(+min>=5&&+min<=300)?Math.round(+min):45;
  const v={sport:s,giorno:g,min:m};
  A.abituali.push(v);save();
  return v;}
window.abitualiAggiungi=abitualiAggiungi;

window.abitualiTogli=(i)=>{const A=allen();A.abituali.splice(i,1);save();
  try{render(cur);}catch(e){}};

/* Quante volte a settimana si allena di solito. È il numero su cui si
   ragiona: non «quanto dovrebbe», ma «quanto fa già». */
function abitualiPerSettimana(){return allen().abituali.length;}
window.abitualiPerSettimana=abitualiPerSettimana;

/* ── Il suggerimento ────────────────────────────────────────────
   Nasce dai dati, porta con sé il motivo, e non arriva mai due volte
   nella stessa settimana. Se non c'è niente di sensato da dire, tace:
   il silenzio è una risposta legittima. */
function settimanaChiave(){
  const n=new Date(),g=new Date(n.getFullYear(),0,1);
  return n.getFullYear()+"-"+Math.ceil((((n-g)/86400000)+g.getDay()+1)/7);}

function spuntoAllenamento(){
  /* 1 · chi ha un rapporto difficile col cibo non riceve suggerimenti
     sul volume: è la regola che viene prima di tutte le altre */
  try{if(typeof profiloDelicato==="function"&&profiloDelicato())return null;}catch(e){}

  const fatti=workoutsThisWeek();
  const abituali=abitualiPerSettimana();
  const obiettivo=goalWkTotal();
  const oggi=wd(new Date());

  /* 2 · troppi giorni di fila senza respiro: il recupero viene prima
     di qualunque aggiunta, sempre */
  let consec=0,max=0;
  S.week.days.forEach((d,di)=>{
    if(di>oggi)return;
    if((d.workouts||[]).length){consec++;max=Math.max(max,consec);}else consec=0;});
  if(max>=5)return {k:"recupero",
    t:tr("Sono cinque giorni di fila che ti alleni."),
    perche:tr("Un giorno di respiro fa parte dell'allenamento: è lì che il corpo incassa il lavoro fatto.")};

  /* 3 · settimana più vuota del solito: si nota, senza rimproverare */
  if(abituali>=2&&fatti===0&&oggi>=4)return {k:"vuota",
    t:tr("Questa settimana non hai ancora segnato allenamenti."),
    perche:tr("Capita, e non rompe niente. Se ti va, anche una camminata di venti minuti rimette in moto la settimana.")};

  /* 4 · l'obiettivo è vicino ma non raggiunto, e c'è ancora tempo */
  if(obiettivo>0&&fatti>0&&fatti<obiettivo&&oggi<=4){
    const manca=obiettivo-fatti;
    return {k:"vicino",
      t:tr("Ti manca {n} allenamento per l'obiettivo della settimana.",{n:manca}),
      perche:tr("Ci sono ancora giorni utili: se trovi mezz'ora, ci arrivi senza forzare.")};}

  /* 5 · si allena poco e ha un obiettivo di peso: si propone UNA
     sessione leggera, spiegando cosa cambia davvero */
  if(abituali<=1&&fatti<=1&&(+S.profile.goalW>0)&&S.profile.goalW<S.profile.w)
    return {k:"aggiungi",
      t:tr("Con una sessione leggera in più la settimana cambia passo."),
      perche:tr("Non per bruciare di più: muoversi rende il deficit più sostenibile, e la fame si regola meglio. Anche trenta minuti di camminata contano.")};

  return null;}
window.spuntoAllenamento=spuntoAllenamento;

/* Uno a settimana: si registra la settimana in cui è stato mostrato. */
function spuntoDaMostrare(){
  const A=allen();
  if(A.spunto.sett===settimanaChiave())return null;
  return spuntoAllenamento();}
window.spuntoDaMostrare=spuntoDaMostrare;

window.spuntoVisto=()=>{const A=allen();A.spunto.sett=settimanaChiave();save();};
window.spuntoChiudi=()=>{spuntoVisto();try{render(cur);}catch(e){}};

function spuntoHTML(){
  const s=spuntoDaMostrare();
  if(!s)return "";
  return `<div class="card" data-spunto="${esc(s.k)}"><h2>${esc(tr("Un pensiero sulla settimana"))}</h2>
    <div class="hint"><b>${esc(s.t)}</b></div>
    <div class="hint" style="margin-top:8px">${esc(s.perche)}</div>
    <div class="mtools"><button class="btn ghost small" type="button" onclick="spuntoChiudi()">${esc(tr("Ho capito"))}</button></div>
  </div>`;}
window.spuntoHTML=spuntoHTML;

/* ── I tuoi allenamenti, raccontati ─────────────────────────────
   Si scrivono o si dettano, e la stessa infrastruttura vocale
   dell'onboarding li struttura. Il contratto è in
   src/contratti/allenamenti_abituali.md. */
window.abitualiVoce=()=>{
  if(typeof vocePossibile!=="function"||!vocePossibile())
    return dlgAlert(tr("Su questo telefono non posso accendere il microfono da solo. Puoi scrivere i tuoi allenamenti: è identico."));
  let ta=document.getElementById("abitTxt");
  if(!ta){ta=document.createElement("textarea");ta.id="abitTxt";
    ta.style.position="absolute";ta.style.left="-9999px";ta.setAttribute("aria-hidden","true");
    (document.getElementById("pg-sport")||document.body).appendChild(ta);}
  ta.value="";
  try{voceIn("abitTxt","abitMic");}catch(e){
    return dlgAlert(tr("Il microfono non è partito. Puoi scrivere i tuoi allenamenti: è identico."));}
  const box=document.getElementById("abitOut");
  if(box&&!document.getElementById("abitStop")){
    box.style.display="block";
    const b=document.createElement("button");
    b.id="abitStop";b.className="btn";b.type="button";
    b.textContent=tr("Ho finito");
    b.onclick=()=>{try{voceIn("abitTxt","abitMic");}catch(e){}
      const t=(document.getElementById("abitTxt")||{}).value||"";
      b.remove();abitualiLeggi(t);};
    box.appendChild(b);}};

const GIORNI_NOMI=["domenica","lunedì","martedì","mercoledì","giovedì","venerdì","sabato"];

function abitualiValida(j){
  const out=[];
  if(!j||typeof j!=="object")return out;
  const lista=Array.isArray(j.allenamenti)?j.allenamenti:[];
  lista.slice(0,12).forEach(a=>{
    if(!a||typeof a!=="object")return;
    const sport=String(a.sport==null?"":a.sport).replace(/<[^>]*>/g,"").trim().slice(0,40);
    if(!sport)return;
    let g=null;
    if(typeof a.giorno==="string"){
      const i=GIORNI_NOMI.indexOf(a.giorno.toLowerCase().trim());
      if(i>=0)g=i;}
    else if(isFinite(a.giorno)&&a.giorno>=0&&a.giorno<=6)g=+a.giorno;
    const m=parseFloat(a.minuti);
    out.push({sport,giorno:g,min:(isFinite(m)&&m>=5&&m<=300)?Math.round(m):45});});
  return out;}
window.abitualiValida=abitualiValida;

window.abitualiLeggi=async(testo)=>{
  const t=String(testo||"").trim();
  const box=document.getElementById("abitOut");
  if(!t){if(box)box.textContent=tr("Non ho sentito nulla. Puoi scrivere i tuoi allenamenti: è identico.");return;}
  if(!aiOn()){if(box)box.textContent=tr("Per leggere il racconto serve la connessione. Puoi aggiungerli a mano qui sotto.");return;}
  if(box){box.style.display="block";box.textContent=tr("Leggo…");}
  try{
    const j=await aiAskJSON(ABIT_PROMPT.replace("{T}",t),"abituali");
    const lista=abitualiValida(j);
    if(!lista.length){
      if(box)box.textContent=tr("Non ho capito quali allenamenti fai. Puoi aggiungerli a mano: ci metti un attimo.");
      return;}
    const A=allen();
    lista.forEach(x=>A.abituali.push(x));save();
    if(box){box.style.display="none";box.textContent="";}
    toast(tr("Ho segnato {n} allenamenti. Correggili pure.",{n:lista.length}));
    try{render(cur);}catch(e){}
  }catch(e){
    if(box)box.textContent=tr("Non sono riuscito a leggere il racconto. Puoi aggiungerli a mano.");}};

const ABIT_PROMPT='Questa persona racconta come si allena di solito: """{T}""". '+
  'Estrai SOLO gli allenamenti nominati, senza aggiungerne e senza consigli. '+
  'Se non dice il giorno lascia giorno a null; se non dice la durata lascia minuti a null. '+
  'Rispondi SOLO con questo JSON: {"allenamenti":[{"sport":"","giorno":"lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica|null","minuti":null}]}';

/* ── Il blocco per la pagina Sport ──────────────────────────────── */
function abitualiHTML(){
  const A=allen();
  return `<div class="card" data-abituali="1"><h2>${esc(tr("Come ti alleni di solito"))}</h2>
    <div class="hint">${esc(tr("Raccontamelo una volta e non te lo chiedo più: da qui capisco com'è fatta la tua settimana."))}</div>
    ${A.abituali.length?`<div class="abitlist">${A.abituali.map((x,i)=>
      `<div class="abitrow" data-abit="${esc(x.sport)}">
        <span>${esc(cap(x.sport))}${x.giorno!=null?" · "+esc(tr(cap(GIORNI_NOMI[x.giorno]))):""} · ${x.min} min</span>
        <button class="btn ghost small" type="button" onclick="abitualiTogli(${i})"
          aria-label="${esc(tr("Togli"))}">✕</button></div>`).join("")}</div>`
     :`<div class="hint" style="margin-top:8px">${esc(tr("Per ora non mi hai detto nulla: quando vuoi."))}</div>`}
    <div class="mtools">
      <button title="${tr("Apri")}" class="btn ghost small" id="abitMic" type="button" onclick="abitualiVoce()">${ic("mic",15)} ${esc(tr("Raccontamelo"))}</button>
    </div>
    <div class="aibox" id="abitOut" aria-live="polite" style="display:none"></div>
  </div>`;}
window.abitualiHTML=abitualiHTML;
