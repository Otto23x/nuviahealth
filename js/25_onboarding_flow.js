/* ═══════════════════════════════════════════════════════════════
   25. ONBOARDING CONVERSAZIONALE (Sprint 1)
   ═══════════════════════════════════════════════════════════════
   Dieci schermate, una domanda per schermata, tocco = avanti. Il
   percorso lungo resta al suo posto (si raggiunge da «Rifai il
   percorso guidato» e regge i collaudi storici): questo è ciò che
   incontra chi apre l'app per la prima volta.

   Tre principi, in ordine di importanza:
   1. NIENTE SI PERDE. Le risposte vivono in S.onb2, dentro lo stato
      già esistente: chi abbandona a metà riprende esattamente da lì.
   2. LA VOCE PROPONE, LA PERSONA DISPONE. Il parlato pre-compila e
      fa saltare schermate, ma ogni campo estratto è un chip che si
      può correggere o buttare prima di confermare.
   3. LA VOCE NON È MAI UN REQUISITO. Niente microfono, niente rete,
      niente chiave: si prosegue toccando, senza un messaggio di colpa.

   I numeri mostrati sono VERI: la proiezione del peso passa dal
   motore già collaudato (wizTargets), non da una stima inventata
   per far bella figura sulla schermata.                            */

/* Chi vede cosa. Il flusso breve è la porta d'ingresso per chi arriva
   nuovo. Chi aveva già cominciato il percorso lungo lo finisce dov'era:
   spostarlo a metà strada gli farebbe riscrivere quello che ha già dato. */
function onb2Attivo(){
  try{
    if(S.ui&&S.ui.onbLungo)return false;              /* scelta esplicita */
    if(S.onb2&&(S.onb2.step>0||S.onb2.done))return true;
    if(S.onboard&&S.onboard.started&&(S.onboard.step||0)>0)return false;
    return true;
  }catch(e){return false;}}
window.onb2Attivo=onb2Attivo;

/* ── Le cinque sezioni della barra ────────────────────────────────
   PRIMA tutto ciò che ha effetto sul piano (profilo, alimentazione,
   vita), POI le domande per conoscersi. Regola del founder, 22/08:
   quando finisce il blocco che serve al piano, l'AI può partire in
   background — le ultime domande si rispondono mentre lavora. */
function ONB2_SEZt(){return [
  {k:"profilo",       t:tr("Obiettivo & profilo")},
  {k:"alimentazione", t:tr("Come mangi")},
  {k:"vita",          t:tr("Corpo & vita")},
  {k:"conoscerti",    t:tr("Per conoscerti")},
  {k:"piano",         t:tr("Il tuo piano")}
];}

/* ── Le schermate ─────────────────────────────────────────────────
   `k` è anche la chiave della risposta in S.onb2.ris e il campo del
   contratto di estrazione: un nome solo, così la voce sa cosa salta.

   ORDINE (regola del founder, 22/08/2026): prima TUTTE le domande con
   effetto sul piano, poi quelle per conoscersi. Il confine è la fine
   della sezione «vita»: da lì in poi nessuna risposta cambia il piano,
   e la generazione può partire (arriva col passo 3).
   Le opzioni vengono dalle STESSE liste della pagina Regole
   (INTOL_LIST, PAT_LIST, PROT_LIST, REL_LIST, DIET_TYPES, CUCINE):
   una fonte sola — l'onboarding le chiede, Regole le modifica.     */
const O2CAP=x=>{const e=tr(x);return e?e[0].toUpperCase()+e.slice(1):e;};
function ONB2t(){return [
 {k:"obiettivo",sez:"profilo",tipo:"scelta",
  q:tr("Cosa vorresti fare?"),
  sub:tr("Da qui parte tutto il resto: il fabbisogno, il piano, il ritmo."),
  op:[["perdere",tr("Perdere peso"),tr("Con calma e senza fame nera")],
      ["mantenere",tr("Mantenere"),tr("Stare bene dove sono")],
      ["massa",tr("Mettere massa"),tr("Crescere, non solo pesare di più")]]},

 {k:"bio",sez:"profilo",tipo:"modulo",
  q:tr("Partiamo da te"),
  /* La frase «il peso è il segnale che dice se il piano funziona» è
     stata tolta il 23/08: puntava tutto sulla bilancia, e per chi
     mantiene o mette massa il peso da solo non dice se le cose vanno
     come devono. Restano i numeri e a cosa servono. */
  sub:tr("Servono a calcolare quanto consumi in un giorno.")},

 {k:"pesoObiettivo",sez:"profilo",tipo:"numero",
  q:tr("Dove vorresti arrivare?"),
  sub:tr("Scrivi il peso che hai in mente: ti dico subito quanto ci vuole davvero."),
  unita:"kg",min:30,max:300},

 {k:"pausa1",sez:"profilo",tipo:"pausa",posa:"pensa",
  q:tr("Questo è già abbastanza per i numeri."),
  sub:tr("Il resto serve a una cosa sola: che i piatti siano i tuoi, non quelli di un manuale.")},

 {k:"dieta",sez:"alimentazione",tipo:"dieta",
  q:tr("Come mangi, per scelta o abitudine?")},

 {k:"allergie",sez:"alimentazione",tipo:"multi",none:"niente",altro:true,
  q:tr("Ci sono alimenti che il tuo corpo non tollera?"),
  sub:tr("Non compariranno mai nei tuoi piatti."),
  op:[["niente",tr("Nessuna intolleranza"),""]]
     .concat((typeof INTOL_LIST!=="undefined"?INTOL_LIST:[]).map(x=>[x,O2CAP(x),""]))},

 {k:"salute",sez:"alimentazione",tipo:"multi",none:"niente",
  testo:{k:"farmaci",label:tr("Farmaci che prendi in modo continuativo"),ph:tr("es. levotiroxina — se non ce ne sono, lascia vuoto")},
  q:tr("Condizioni di salute di cui tenere conto?"),
  sub:tr("Entrano nei criteri del piano. Non sono una diagnosi né una terapia."),
  op:[["niente",tr("Nessuna"),""]]
     .concat((typeof PAT_LIST!=="undefined"?PAT_LIST:[]).map(x=>[x.k,tr(x.l),""]))},

 {k:"protocolli",sez:"alimentazione",tipo:"multi",none:"nessuno",
  q:tr("Segui uno schema alimentare preciso?"),
  sub:tr("Se lo segui, l'AI ne applica le regole a ogni proposta."),
  op:[["nessuno",tr("Nessuno schema"),""]]
     .concat((typeof PROT_LIST!=="undefined"?PROT_LIST:[]).map(x=>[x.k,tr(x.l).trim(),""]))},

 {k:"vincoli",sez:"alimentazione",tipo:"multi",none:"nessuno",
  q:tr("Vincoli religiosi o etici a tavola?"),
  op:[["nessuno",tr("Nessun vincolo"),""]]
     .concat((typeof REL_LIST!=="undefined"?REL_LIST:[]).map(x=>[x,O2CAP(x),""]))},

 {k:"pausa2",sez:"alimentazione",tipo:"pausa",posa:"cucina",
  q:tr("Da qui in poi niente più liste."),
  sub:tr("Restano le domande sulla tua settimana: quanto ti muovi, come sono fatte le giornate, quanto tempo hai.")},

 {k:"corpo",sez:"vita",tipo:"scelta",sensibile:true,
  se:()=>((onb2Stato().ris.bio||{}).gen==="f"),
  q:tr("C'è uno di questi stati, adesso?"),
  sub:tr("Cambiano davvero fabbisogno e porzioni, per il tempo giusto."),
  op:[["no",tr("No, niente di questo"),""],
      ["t1",tr("Gravidanza · 1° trimestre"),""],
      ["t2",tr("Gravidanza · 2° trimestre"),""],
      ["t3",tr("Gravidanza · 3° trimestre"),""],
      ["lactE",tr("Allatto in modo esclusivo"),""],
      ["lactP",tr("Allatto parzialmente"),""]]},

 {k:"attivita",sez:"vita",tipo:"scelta",
  q:tr("Quanto ti muovi in una settimana normale?"),
  sub:tr("Il movimento entra nel bilancio: meglio dire come stanno le cose oggi."),
  op:[["fermo",tr("Poco o niente"),tr("Per ora zero allenamenti")],
      ["leggero",tr("Una o due volte"),tr("Camminate, qualcosa di leggero")],
      ["regolare",tr("Tre o quattro volte"),tr("Ci tengo, con una certa costanza")],
      ["intenso",tr("Cinque o più"),tr("Mi alleno sul serio")]]},

 {k:"ritmi",sez:"vita",tipo:"scelta",
  q:tr("Com'è fatta la tua giornata?"),
  sub:tr("Gli orari veri contano più delle buone intenzioni: il piano si adatta a loro."),
  op:[["sedentario",tr("Seduto quasi tutto il giorno"),tr("Ufficio, scrivania, guida")],
      ["inPiedi",tr("In piedi o in movimento"),tr("Lavoro fisico, cammino molto")],
      ["turni",tr("A turni"),tr("Orari che cambiano di settimana in settimana")],
      ["studente",tr("Studio"),tr("Lezioni, biblioteca, pasti fuori")],
      ["casa",tr("A casa"),tr("Gestisco i miei orari")]]},

 {k:"pasti",sez:"vita",tipo:"pasti",
  q:tr("Quali pasti fai davvero?"),
  sub:tr("Il piano non proporrà quelli spenti.")},

 {k:"cucina",sez:"vita",tipo:"scelta",
  q:tr("Quanto tempo hai per cucinare?"),
  sub:tr("Un piano che non entra nella tua settimana non lo segue nessuno."),
  op:[["veloce",tr("Pochissimo"),tr("Cose pronte o da 10 minuti")],
      ["normale",tr("Il giusto"),tr("Mezz'ora, di solito")],
      ["amoCucinare",tr("Mi piace cucinare"),tr("Il tempo lo trovo volentieri")]]},

 {k:"preferenze",sez:"vita",tipo:"preferenze",
  q:tr("Le ultime tre cose per il piano")},

 /* ── I PIANI, PRIMA DELLE DOMANDE PER CONOSCERSI (founder, 23/08) ──
    Sta qui e non alla fine per una ragione precisa: **la scelta
    cambia cosa succede dopo**. Chi resta su Free non ha l'AI, quindi
    non c'è niente da generare — e scoprirlo in fondo, davanti a una
    barra che non parte, sarebbe la peggiore delle sorprese.
    Messa qui, il piano parte in sottofondo mentre la persona
    risponde alle ultime tre domande, esattamente come chiesto.
    È una schermata come le altre: stessa barra, stesse card, stesso
    modo di rispondere. Non un cartellone dei prezzi in mezzo al
    percorso. */
 {k:"piani",sez:"conoscerti",tipo:"piani",
  q:tr("Come vuoi che ti segua?"),
  sub:tr("Da qui dipende come nasce il piano. Si cambia quando vuoi.")},

 /* `genera` sta sulla PAUSA e non sulla schermata dei piani: la
    generazione deve partire DOPO la scelta, perché è la scelta a
    decidere se e come generare. */
 {k:"pausa3",sez:"conoscerti",tipo:"pausa",posa:"cerca",genera:true,
  q:tr("Ho tutto quello che serve al piano."),
  sub:tr("Comincio a scriverlo adesso, mentre rispondi alle ultime domande: quando arrivi in fondo è già pronto.")},

 {k:"cibo",sez:"conoscerti",tipo:"multi",none:"sereno",
  q:tr("Che rapporto hai con il cibo?"),
  sub:tr("Non c'è una risposta giusta. Puoi segnarne più di una."),
  op:[["sereno",tr("Sereno"),tr("Mangio quando ho fame, e va bene così")],
      ["nervoso",tr("Mangio quando sono teso"),tr("Le giornate storte si sentono a tavola")],
      ["noia",tr("Mangio per noia"),tr("Soprattutto la sera, davanti allo schermo")],
      ["sociale",tr("Mangio molto fuori"),tr("Cene, pranzi di lavoro, amici")]]},

 {k:"tentativi",sez:"conoscerti",tipo:"scelta",
  q:tr("Ci hai già provato altre volte?"),
  sub:tr("Se è già successo, ne teniamo conto: si parte più morbidi."),
  op:[["mai",tr("È la prima volta"),tr("Comincio adesso")],
      ["qualcuno",tr("Qualche tentativo"),tr("Con alti e bassi")],
      ["molti",tr("Molti tentativi"),tr("Ho provato di tutto")],
      ["yoyo",tr("Ho ripreso tutto più volte"),tr("Scendo e risalgo")]]},

 {k:"motivazione",sez:"conoscerti",tipo:"scelta",
  q:tr("Perché proprio adesso?"),
  sub:tr("Te lo ricorderò nei giorni storti — sono le tue parole, non le mie."),
  op:[["salute",tr("Per la salute"),tr("Analisi, medico, prevenzione")],
      ["energia",tr("Per avere più energia"),tr("Arrivo a sera scarico")],
      ["estetica",tr("Per come mi vedo"),tr("Voglio ritrovarmi allo specchio")],
      ["evento",tr("Ho una data in mente"),tr("Un appuntamento che conta")]]},

 {k:"fine",sez:"piano",tipo:"fine",
  q:tr("Come vuoi che ti segua?"),
  sub:tr("Puoi cambiare idea quando vuoi, da Io.")}
];}

/* I const a livello globale non finiscono su window: qui servono anche
   fuori (collaudi, futuro riuso), quindi si espongono esplicitamente. */
/* Le due tabelle si ricostruiscono al cambio lingua e basta: dentro
   ci sono chiamate a tr(), che deve rispondere con la lingua di ADESSO.
   Costruirle una volta sola, all'avvio, le congelerebbe in italiano. */
let _o2tab=null,_o2sez=null,_o2lang=null;
function ONB2c(){const L=(typeof LANG!=="undefined")?LANG:"it";
  if(_o2lang!==L){_o2lang=L;_o2tab=ONB2t();_o2sez=ONB2_SEZt();}
  return _o2tab;}
function ONB2_SEZc(){ONB2c();return _o2sez;}
/* I const globali non finiscono su window: qui servono anche fuori
   (collaudi, riuso futuro), quindi si espongono come sola lettura. */
try{
  Object.defineProperty(window,"ONB2",{get:ONB2c,configurable:true});
  Object.defineProperty(window,"ONB2_SEZ",{get:ONB2_SEZc,configurable:true});
}catch(e){window.ONB2=ONB2c();window.ONB2_SEZ=ONB2_SEZc();}

/* Stato: nasce con default e non tocca nulla di quello che c'era.
   `maxVisto` esiste perché la barra non deve MAI tornare indietro:
   se torni a correggere una risposta, l'avanzamento resta quello
   raggiunto — l'occhio legge «quanto manca», non «dove sono». */
function onb2Stato(){
  if(!S.onb2||typeof S.onb2!=="object")S.onb2={};
  const o=S.onb2;
  if(o.v!==1)o.v=1;
  if(typeof o.step!=="number"||o.step<0||o.step>=ONB2c().length)o.step=0;
  if(typeof o.maxVisto!=="number"||o.maxVisto<o.step)o.maxVisto=o.step;
  if(!o.ris||typeof o.ris!=="object")o.ris={};
  if(!Array.isArray(o.saltate))o.saltate=[];
  if(o.done!==true)o.done=false;
  if(o.sensibili===undefined)o.sensibili=null;   /* null = mai chiesto */
  return o;}
window.onb2Stato=onb2Stato;

function onb2Salva(){try{save();}catch(e){}}

/* Indice della sezione di una schermata, per la barra segmentata */
function onb2SezIdx(i){
  const k=(ONB2c()[i]||ONB2c()[0]).sez;
  return Math.max(0,ONB2_SEZc().findIndex(s=>s.k===k));}

/* ── Barra segmentata: quattro tratti, uno per sezione ───────────── */
function onb2Barra(){
  const o=onb2Stato(),vis=Math.max(o.step,o.maxVisto);
  const sezCorr=onb2SezIdx(o.step);
  let seg="";
  ONB2_SEZc().forEach((s,si)=>{
    const tot=ONB2c().filter(x=>x.sez===s.k).length;
    const fatti=ONB2c().filter((x,xi)=>x.sez===s.k&&xi<=vis).length;
    const pc=Math.round(Math.min(1,fatti/tot)*100);
    seg+=`<div class="o2seg${si===sezCorr?" ora":""}"><i style="width:${pc}%"></i></div>`;});
  return `<div class="o2top">
    <span class="o2chip">${esc(ONB2_SEZc()[sezCorr].t)}</span>
    <div class="o2segs" role="progressbar" aria-valuenow="${vis+1}" aria-valuemin="1" aria-valuemax="${ONB2c().length}"
      data-passo="${o.step+1}" data-avanzamento="${Math.round((vis+1)/ONB2c().length*100)}">${seg}</div>
  </div>`;}

/* ── Il pulsante del microfono: c'è su ogni schermata, non chiede mai
   il permesso da solo e non promette nulla che non possa mantenere. */
/* ── IL MICROFONO, UNO SOLO ───────────────────────────────────────
   Prima ce n'erano DUE: «Preferisci dirlo a voce?» in mezzo alla
   schermata e «Raccontami tutto a voce» in fondo. Facevano cose
   diverse (una risposta sola contro tutto il percorso), ma da fuori
   sembravano la stessa e uno dei due era di troppo.
   Ne resta uno, nella barra dei comandi: l'icona dice cosa fa, e la
   parola che l'accompagna cambia solo alla prima schermata, dove
   raccontare TUTTO ha senso. */
function onb2Mic(campo){return "";}   /* non più in mezzo alla pagina */

/* PILASTRO (20/08, ribadito 22/08): il microfono vive SOLO nella
   dettatura dei pasti. Nell'onboarding non c'è — né in mezzo alla
   pagina né nella barra. L'interruttore resta dichiarato (non un
   return secco) così il codice sotto è leggibile e il lint pulito. */
const O2_MIC_IN_BARRA=false;
function onb2MicBarra(campo,passo){
  if(!O2_MIC_IN_BARRA)return "";
  const ok=(typeof vocePossibile==="function")&&vocePossibile();
  if(!ok)return "";
  /* IL RACCONTO INTERO ha bisogno dell'AI per essere capito; la
     dettatura di UNA risposta no — quella la fa il telefono.
     Alla prima schermata quindi si offre il racconto SOLO se l'AI
     c'è: offrire un comando che non può funzionare, e poi spiegare
     perché non ha funzionato, è il modo più rapido di far pensare
     che l'app sia rotta. (Trovato dal founder il 19/08: toccava il
     microfono e si sentiva rispondere «mi serve la connessione».) */
  const conAI=(typeof aiOn==="function")&&aiOn();
  const tutto=(passo===0)&&conAI;
  if(passo===0&&!conAI)return "";
  return `<button class="btn ghost small o2mic" id="o2mic_${esc(campo)}" type="button"
    onclick="${tutto?"onb2Racconto()":"onb2Voce('"+esc(campo)+"')"}"
    aria-label="${esc(tutto?tr("Raccontami tutto a voce"):tr("Rispondi a voce"))}">
    ${ic("mic",15)} ${esc(tutto?tr("A voce"):tr("A voce"))}</button>`;}

/* ── Render ─────────────────────────────────────────────────────── */
function renderOnb2(){
  const el=document.getElementById("pg-onb2");if(!el)return;
  /* PRIMA DI TUTTO: l'account. È la schermata che decide se una
     persona resta, e va prima delle domande — non dopo, quando
     ha già investito dieci minuti e scopre che serviva un
     collegamento. */
  try{
    if(typeof primoServe==="function"&&primoServe()){
      el.innerHTML=primoHTML();
      try{if(typeof a11yLega==="function")a11yLega("onb2");}catch(e){}
      return;}
  }catch(e){}
  const o=onb2Stato(),i=o.step,sc=ONB2c()[i];
  let c="";
  if(sc.tipo==="scelta")c=onb2Scelta(sc);
  else if(sc.tipo==="modulo")c=onb2Modulo(sc);
  else if(sc.tipo==="numero")c=onb2Numero(sc);
  else if(sc.tipo==="multi")c=onb2Multi(sc);
  else if(sc.tipo==="dieta")c=onb2Dieta(sc);
  else if(sc.tipo==="pasti")c=onb2Pasti(sc);
  else if(sc.tipo==="preferenze")c=onb2Pref(sc);
  else if(sc.tipo==="piani")c=onb2Piani(sc);
  else if(sc.tipo==="pausa")c=onb2Pausa(sc);
  else c=onb2Fine(sc);

  el.innerHTML=onb2Barra()+
   `<div class="o2wrap" data-passo="${i+1}" data-chiave="${esc(sc.k)}">
      <h1 class="o2q">${esc(sc.q)}</h1>
      ${sc.sub?`<p class="o2sub">${esc(sc.sub)}</p>`:""}
      ${c}
      <div class="o2nav o2nav2">
        <button class="btn ghost o2back" type="button" onclick="onb2Indietro()"
          aria-label="${esc(tr("Torna indietro"))}">${esc(tr("Indietro"))}</button>
        ${sc.tipo!=="fine"?`<button class="btn o2next" type="button"
          onclick="onb2AvantiSchermo()">${esc(tr("Avanti"))}</button>`:""}
        ${onb2MicBarra(sc.k,i)}
      </div>
    </div>`;
  try{if(typeof a11yLega==="function")a11yLega("onb2");}catch(e){}}
window.renderOnb2=renderOnb2;

/* Schermata a scelta: card larghe, un tocco e si va avanti. */
function onb2Scelta(sc){
  const o=onb2Stato(),val=o.ris[sc.k];
  let h="";
  if(sc.sensibile)h+=onb2Consenso();
  h+=onb2Chip(sc.k);
  h+=`<div class="o2ops">`+sc.op.map(([v,t,d])=>
    `<button class="o2op${val===v?" scelta":""}" type="button" onclick="onb2Rispondi('${esc(sc.k)}','${esc(v)}')">
       <b>${esc(t)}</b>${d?`<span>${esc(d)}</span>`:""}</button>`).join("")+`</div>`;
  h+=onb2Mic(sc.k);
  return h;}

/* ── Multi-selezione: si tocca più di una card, «Avanti» conferma. ──
   La voce `none` («nessuna») è esclusiva: toccarla spegne le altre,
   toccarne un'altra spegne lei. Con `altro:true` c'è il campo libero,
   con `testo:{…}` un campo dedicato (i farmaci). */
function onb2Multi(sc){
  const o=onb2Stato(),sel=Array.isArray(o.ris[sc.k])?o.ris[sc.k]:[];
  let h="";
  if(sc.sensibile)h+=onb2Consenso();
  h+=onb2Chip(sc.k);
  /* Il quadratino non è decorazione: è l'unica cosa che dice «puoi
     sceglierne più di una» prima che la persona provi. */
  h+=`<div class="o2ops o2multi">`+sc.op.map(([v,t,d])=>
    `<button class="o2op o2opm${sel.includes(v)?" scelta":""}" type="button" onclick="onb2Toggle('${esc(sc.k)}','${esc(v)}')"
       aria-pressed="${sel.includes(v)}"><i class="o2box" aria-hidden="true">${sel.includes(v)?"✓":""}</i>
       <span class="o2opt"><b>${esc(t)}</b>${d?`<span>${esc(d)}</span>`:""}</span></button>`).join("")+`</div>`;
  if(sc.altro)h+=`<div class="o2form"><input type="text" id="o2alt" value="${esc(o.ris[sc.k+"_altro"]||"")}"
      placeholder="${esc(tr("altro, scrivilo tu"))}"></div>`;
  if(sc.testo)h+=`<div class="o2form"><label>${esc(sc.testo.label)}</label>
      <input type="text" id="o2txtx" value="${esc(o.ris[sc.testo.k]||"")}" placeholder="${esc(sc.testo.ph||"")}"></div>`;
  return h;}

window.onb2Toggle=(k,v)=>{
  const o=onb2Stato(),sc=ONB2c().find(x=>x.k===k);
  if(sc&&sc.sensibile&&o.sensibili!==true)return;   /* niente consenso, niente risposta */
  let sel=Array.isArray(o.ris[k])?o.ris[k].slice():[];
  if(sel.includes(v))sel=sel.filter(x=>x!==v);
  else{
    if(sc&&sc.none&&v===sc.none)sel=[v];             /* «nessuna» spegne il resto */
    else{sel=sel.filter(x=>!(sc&&sc.none&&x===sc.none));sel.push(v);}
  }
  o.ris[k]=sel;onb2Salva();renderOnb2();};

window.onb2MultiOk=(k)=>{
  const o=onb2Stato(),sc=ONB2c().find(x=>x.k===k);
  if(sc&&sc.sensibile&&o.sensibili!==true)return onb2Salta();
  if(!Array.isArray(o.ris[k]))o.ris[k]=[];
  const alt=document.getElementById("o2alt");
  if(sc&&sc.altro&&alt)o.ris[k+"_altro"]=alt.value.trim();
  const tx=document.getElementById("o2txtx");
  if(sc&&sc.testo&&tx)o.ris[sc.testo.k]=tx.value.trim();
  onb2Salva();
  try{if(typeof confermaPasso==="function")confermaPasso(k);}catch(e){}
  onb2Avanti();};

/* ── Come mangi: dieta di riferimento e tradizione culinaria. ──────
   Le stesse voci (e gli stessi campi) di Regole → Caratteristiche
   alimentari: qui si chiedono, lì si modificano. */
function onb2Dieta(sc){
  const o=onb2Stato(),r=o.ris.dieta||{};
  const tipo=r.tipo||"mediterranea";
  const dt=(typeof DIET_TYPES!=="undefined")?DIET_TYPES:["mediterranea","onnivora","vegetariana","vegana","pescetariana","flexitariana"];
  const cuc=(typeof CUCINE!=="undefined")?CUCINE:[["italiana","Italiana"]];
  return onb2Chip("dieta")+
   `<div class="o2form">
      <label>${esc(tr("Dieta di riferimento"))}</label>
      <select id="o2dTipo" onchange="onb2VegUI(this.value)">`+
        dt.map(x=>`<option value="${esc(x)}"${tipo===x?" selected":""}>${esc(O2CAP(x))}</option>`).join("")+`</select>
      <div id="o2VegBox" style="${tipo==="vegetariana"?"":"display:none"}">
        <label class="ck"><input type="checkbox" id="o2vu"${r.uova===false?"":" checked"}> ${esc(tr("Uova sì"))}</label>
        <label class="ck"><input type="checkbox" id="o2vp"${r.pesce?" checked":""}> ${esc(tr("Pesce sì"))}</label>
      </div>
      <label>${esc(tr("Tradizione culinaria"))}</label>
      <select id="o2dTrad">`+
        cuc.map(c=>`<option value="${esc(c[0])}"${(r.tradizione||"italiana")===c[0]?" selected":""}>${esc(tr(c[1]))}</option>`).join("")+`</select>
    </div>`;}

window.onb2VegUI=(v)=>{const b=document.getElementById("o2VegBox");
  if(b)b.style.display=(v==="vegetariana")?"":"none";};

window.onb2DietaOk=()=>{
  const g=id=>document.getElementById(id);
  const tipo=(g("o2dTipo")||{}).value||"mediterranea";
  const o=onb2Stato();
  o.ris.dieta={tipo,
    uova:tipo==="vegana"?false:(tipo==="vegetariana"?!!(g("o2vu")&&g("o2vu").checked):true),
    pesce:tipo==="vegana"?false:(tipo==="vegetariana"?!!(g("o2vp")&&g("o2vp").checked):true),
    tradizione:(g("o2dTrad")||{}).value||"italiana"};
  onb2Salva();onb2Avanti();};

/* ── Quali pasti fai: spunte sugli slot e pasti liberi. ─────────────
   Gli slot restano VALORI italiani (come in tutta l'app): a schermo
   passano da fascia(), nello stato vivono nudi. */
/* Gli stessi sette slot che l'app usa ovunque (SLOT_HOUR, motore AI,
   spesa): se qui ne mancasse uno, il piano non potrebbe proporlo. */
const O2SLOTS=["Colazione","Metà mattina","Pranzo","Metà pomeriggio",
               "Tardo pomeriggio","Cena","Dopo cena"];
function onb2Pasti(sc){
  const o=onb2Stato(),r=o.ris.pasti||{};
  const sel=Array.isArray(r.slots)?r.slots:["Colazione","Pranzo","Cena"];
  const eti=s=>(typeof fascia==="function")?fascia(s):s;
  return onb2Chip("pasti")+
   `<div class="o2form"><div class="ckgrid">`+
      O2SLOTS.map((s,i)=>`<label class="ck"><input type="checkbox" id="o2sl${i}"${sel.includes(s)?" checked":""}> ${esc(eti(s))}</label>`).join("")+
   `</div>
      <label>${esc(tr("Pasti liberi a settimana"))}</label>
      <input type="number" id="o2lib" inputmode="numeric" min="0" max="7" value="${r.liberi!=null?r.liberi:1}">
    </div>`;}

window.onb2PastiOk=()=>{
  const slots=O2SLOTS.filter((s,i)=>{const e=document.getElementById("o2sl"+i);return e&&e.checked;});
  if(slots.length<2)return dlgAlert(tr("Seleziona almeno due pasti: con meno di due il piano non sta in piedi."));
  const lib=Math.max(0,Math.min(7,+((document.getElementById("o2lib")||{}).value||0)));
  const o=onb2Stato();o.ris.pasti={slots,liberi:lib};
  onb2Salva();onb2Avanti();};

/* ── Le ultime tre cose per il piano: budget, alcol, varietà. ─────── */
function onb2Pref(sc){
  const o=onb2Stato(),r=o.ris.preferenze||{};
  const sel=(id,val,opts)=>`<select id="${id}">`+opts.map(x=>`<option value="${esc(x[0])}"${(val||opts[0][0])===x[0]?" selected":""}>${esc(x[1])}</option>`).join("")+`</select>`;
  return onb2Chip("preferenze")+
   `<div class="o2form">
      <label>${esc(tr("Budget spesa"))}</label>
      ${sel("o2pb",r.budget,[["medio",tr("Medio")],["contenuto",tr("Contenuto")],["senza limiti",tr("Senza limiti")]])}
      <label>Alcol</label>
      ${sel("o2pa",r.alcol,[["mai",tr("Mai")],["raramente",tr("Raramente")],["nel fine settimana",tr("Nel fine settimana")],["quotidiano",tr("Quotidiano")]])}
      <label>${esc(tr("Quanta varietà vuoi nel piano"))}</label>
      ${sel("o2pv",r.varieta,[["media",tr("Media")],["bassa",tr("Bassa: pochi piatti che tornano, spesa corta")],["alta",tr("Alta: ogni giorno diverso")]])}
    </div>`;}

window.onb2PrefOk=()=>{
  const g=id=>(document.getElementById(id)||{}).value;
  const o=onb2Stato();
  o.ris.preferenze={budget:g("o2pb")||"medio",alcol:g("o2pa")||"mai",varieta:g("o2pv")||"media"};
  onb2Salva();onb2Avanti();};

/* ── Le pause ──────────────────────────────────────────────────
   Non chiedono niente: dicono a che punto siamo e perché le domande
   fatte servivano. Sono il posto della mascotte — l'unica figura che
   la persona vede in tutto il percorso. */
function onb2Pausa(sc){
  return `<div class="o2pausa">${masc(sc.posa||"pensa",120)}</div>`;}

/* ── Il piano che si scrive da solo, in sottofondo ──────────────
   Regola del founder (22/08): l'AI parte PRIMA delle domande che non
   toccano il piano, così quando la persona arriva in fondo non
   aspetta. Lo stato si racconta riga per riga, non con una rotella. */
function onb2Gen(){
  if(!window.__o2gen)window.__o2gen={stato:"fermo",perc:0,riga:"",righe:[],piano:null};
  return window.__o2gen;}
window.onb2Gen=onb2Gen;

const O2GIORNI=["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
function onb2GenRighe(fatti,stato){
  /* Le frasi stanno dentro tr() LETTERALI, non costruite con un
     ternario: così il controllo delle traduzioni le vede davvero. */
  const R=O2GIORNI.map((g,i)=>{
    const n={g:tr(g)};
    if(i<fatti) return {t:tr("{g}: completato",n),s:"ok"};
    if(i===fatti)return {t:tr("{g}: in corso…",n),s:"ora"};
    return {t:tr("{g}: in attesa",n),s:"attesa"};});
  const fine=(stato==="fatto");
  R.push(fine?{t:tr("Lista della spesa: pronta"),s:"ok"}
             :{t:tr("Lista della spesa: da calcolare"),s:"attesa"});
  R.push(fine?{t:tr("Controllo di coerenza: fatto"),s:"ok"}
             :{t:tr("Controllo di coerenza: da fare"),s:"attesa"});
  return R;}

/* Ridisegna SOLO se la persona sta guardando la schermata finale:
   altrimenti il piano cresce in silenzio, come deve. */
function onb2GenTocca(){
  try{const o=onb2Stato();
    if(ONB2c()[o.step]&&ONB2c()[o.step].tipo==="fine")renderOnb2();}catch(e){}}

/* ═══ IL PIANO DI BASE, RIBILANCIATO SUI TUOI NUMERI ══════════════
   Deciso dal founder il 23/08: chi resta su Free non ha l'AI, quindi
   non c'è niente da generare — ma NON riceve un diario vuoto né un
   «torna quando paghi». Riceve il piano di base con le QUANTITÀ
   rifatte sul suo obiettivo.

   COME, e perché così:
   • Si calcola quanto pesa oggi ogni giornata del piano di base e
     quanto dovrebbe pesare per questa persona (`dayTargetK()`, cioè
     il fabbisogno meno o più il bilancio deciso dall'obiettivo: chi
     mette massa riceve porzioni PIÙ GRANDI, non più piccole).
   • I PASTI LIBERI NON SI TOCCANO. Dire «tre quarti di pallina di
     gelato» è ridicolo, e soprattutto tradisce il senso del pasto
     libero: è libero. La differenza la assorbono gli altri pasti,
     che è esattamente come si comporterebbe una persona.
   • Si scalano le GRAMMATURE scritte nel piatto, non solo i numeri
     dei macro: «Pollo 200g» che diventa «Pollo 150g» è un'istruzione
     che si può seguire; un piatto identico con meno calorie scritte
     sotto non lo è.
   • Il fattore ha un tetto, e NON è simmetrico: 0,6 in giù, 1,75 in
     su. In giù si scende in fretta nel ridicolo (30 g di pollo, 20 g
     di pasta) e sotto il pavimento calorico ci pensa già il motore;
     in su, un piatto più abbondante resta un piatto — e chi mette
     massa deve poterci arrivare. Misurato: con un tetto a 1,5 chi
     cresce restava sotto il proprio target di quasi il 10% nei
     giorni con più pasti liberi. Se il tetto morde lo si dichiara:
     una stima che si sa storta e non lo dice è peggio di nessuna.
   • Non si inventa un piatto nuovo: questo è un ADATTAMENTO, non un
     piano scritto per te, e la differenza va detta a chiare lettere. */
const PB_MIN=0.6,PB_MAX=1.75;

/* Le grammature dentro la descrizione. Si toccano SOLO i numeri
   seguiti da g/gr/ml: «4 nigiri» e «½ avocado» restano quello che
   sono, perché non si tagliano a fette. Sotto i 5 g non si scala
   (l'olio da 10 g che diventa 6 g è una precisione finta). */
function pbGrammature(testo,f){
  /* Si conserva lo SPAZIO come stava scritto: «200g» resta «150g» e
     «200 g» resta «150 g». Un piano che cambia formato a metà si
     legge come scritto da due mani diverse. */
  return String(testo||"").replace(/(\d+(?:[.,]\d+)?)(\s*)(g|gr|ml)\b/gi,(tutto,n,sp,u)=>{
    const v=parseFloat(String(n).replace(",","."));
    if(!(v>=5))return tutto;
    const nuovo=Math.max(5,Math.round(v*f/5)*5);   /* a passi di 5 g */
    return nuovo+sp+u;});}

/* Quanto pesa una giornata, e quanto ne pesano i soli pasti che si
   possono ritoccare. */
function pbPesi(giorno){
  let tutto=0,mobile=0;
  (giorno.meals||[]).forEach(m=>{
    const k=+(((m.o||[])[0]||{}).k)||0;
    tutto+=k;
    if(m.type!=="free")mobile+=k;});
  return {tutto,mobile};}

window.onb2PianoBase=(targetK)=>{
  const base=(typeof BASE_PLAN!=="undefined")?BASE_PLAN:null;
  if(!base||!base.length)return null;
  const t=+targetK||0;
  if(!(t>0))return null;
  let tagliato=false;
  const piano=base.map(g=>{
    const {tutto,mobile}=pbPesi(g);
    /* il fattore si applica ai soli pasti ritoccabili: i liberi
       restano interi e la differenza la assorbono gli altri */
    const serve=t-(tutto-mobile);
    let f=(mobile>0&&serve>0)?serve/mobile:1;
    if(f<PB_MIN){f=PB_MIN;tagliato=true;}
    if(f>PB_MAX){f=PB_MAX;tagliato=true;}
    return {...g,meals:(g.meals||[]).map(m=>{
      if(m.type==="free")return JSON.parse(JSON.stringify(m));
      return {...m,o:(m.o||[]).map(o=>({...o,
        d:pbGrammature(o.d,f),
        k:Math.round((+o.k||0)*f),
        p:Math.round((+o.p||0)*f),
        c:Math.round((+o.c||0)*f),
        f:Math.round((+o.f||0)*f)}))};})};});
  piano.tagliato=tagliato;
  return piano;};

window.onb2GeneraOra=async()=>{
  const g=onb2Gen();
  if(g.stato==="lavoro"||g.stato==="fatto")return;      /* mai due volte */
  const o=onb2Stato();
  onb2Travasa();                                         /* il piano nasce dai dati veri */
  /* ── SENZA AI NON SI ASPETTA NIENTE ──
     Prima qui si diceva «lo generiamo appena c'è connessione», che
     per chi resta su Free non sarebbe successo mai: una promessa che
     non poteva essere mantenuta. Ora il piano c'è subito, ed è
     quello di base con le quantità rifatte sui suoi numeri. */
  /* Chi ha SCELTO Free riceve il piano di base anche se l'AI sarebbe
     disponibile: la scelta della persona viene prima di quello che
     l'app potrebbe fare. */
  const scelseFree=(o.ris.piani==="free");
  if(scelseFree||typeof aiOn!=="function"||!aiOn()){
    let piano=null;
    try{
      const t=onb2Targets();
      piano=t?onb2PianoBase(dayTargetK()||t.kcal):null;
    }catch(e){piano=null;}
    g.piano=piano;g.perc=100;
    if(piano){
      g.stato="base";
      g.riga=piano.tagliato
        ? tr("Piano pronto: è quello di base, con le quantità rifatte sui tuoi numeri — alcune porzioni si sono fermate al limite di sicurezza.")
        : tr("Piano pronto: è quello di base, con le quantità rifatte sui tuoi numeri.");
    }else{
      g.stato="senzaAI";
      g.riga=tr("Il diario è già pronto: il piano lo scegli tu da Piano, quando vuoi.");}
    g.righe=[];return onb2GenTocca();}
  g.stato="lavoro";g.perc=2;g.riga=tr("Sto componendo il tuo piano…");
  g.righe=onb2GenRighe(0,"lavoro");onb2GenTocca();
  try{
    const t=onb2Targets();
    if(!t)throw new Error("dati");
    const plan=await wizGenDays(onb2DatiPiano(),t,(i,nome)=>{
      g.perc=Math.round(i/7*100);
      g.riga=tr("Sto componendo il tuo piano: {g}…",{g:nome});
      g.righe=onb2GenRighe(i,"lavoro");onb2GenTocca();});
    g.piano=plan||null;g.stato="fatto";g.perc=100;
    g.riga=tr("Piano pronto, spesa compresa.");
    g.righe=onb2GenRighe(7,"fatto");
  }catch(e){
    g.stato="errore";g.perc=100;g.righe=[];
    g.riga=tr("Il piano lo rifacciamo con calma da Piano: il diario intanto è già tuo.");}
  onb2GenTocca();};

/* I dati del piano in un posto solo: li usano la generazione in
   sottofondo e la chiusura. Due copie diverse sarebbero due piani. */
function onb2DatiPiano(){
  const o=onb2Stato(),b=o.ris.bio||{};
  const attMap={fermo:1.25,leggero:1.375,regolare:1.55,intenso:1.725};
  const goalMap={perdere:"moderato",mantenere:"mantenimento",massa:"massa"};
  const nascita=b.dob?new Date(b.dob)
    :(function(){const d=new Date();d.setFullYear(d.getFullYear()-(+b.eta||30));return d;})();
  const vietati=[S.diet.no,S.diet.religiose,S.diet.patologie?tr("tenere conto di: {v1}",{v1:S.diet.patologie}):""]
    .filter(Boolean).join("; ");
  return {gen:b.gen||"m",dob:nascita.toISOString().slice(0,10),h:+b.h,w:+b.w,fat:null,
    act:attMap[o.ris.attivita]||1.375,goal:goalMap[o.ris.obiettivo]||"moderato",
    vita:o.ris.ritmi||"",sport:o.ris.attivita||"",
    intol:S.diet.intol||"",no:vietati,si:S.diet.si||"",
    pronto:(o.ris.cucina==="veloce")?"pronto":"semplice",
    nPasti:S.diet.nPasti||5,colaz:"",liberi:(S.diet.pastiLiberi!=null?+S.diet.pastiLiberi:1),note:""};}

/* Le sole quattro cose che non si possono dedurre da nient'altro. */
function onb2Modulo(sc){
  const o=onb2Stato(),b=o.ris.bio||{};
  return onb2Chip("bio")+
   `<div class="o2form">
      <!-- Il NOME (22/08): la prima voce della barra è il punto della
           situazione di QUESTA persona, e finora si chiamava «Punto»
           perché il nome non veniva mai chiesto. Anche l'assistente
           salutava un nome che nessuno aveva scritto. Una riga, non
           una schermata: chi non vuole darlo lo lascia vuoto. -->
      <label>${esc(tr("Come ti chiami"))}</label>
      <input type="text" id="o2nome" autocomplete="given-name" maxlength="40"
             value="${esc(bz("o2nome",b.nome||(S.profile&&S.profile.name)||""))}">
      <label>${esc(tr("Sei…"))}</label>
      <select id="o2gen"><option value="m"${bz("o2gen",b.gen)!=="f"?" selected":""}>${esc(tr("Uomo"))}</option>
        <option value="f"${bz("o2gen",b.gen)==="f"?" selected":""}>${esc(tr("Donna"))}</option></select>
      <div class="grid2">
        <div><label>${esc(tr("Data di nascita"))}</label>
          <!-- La DATA, non l'età: con l'età si costruiva una data finta
               (1° gennaio di N anni fa) e il metabolismo si calcolava su
               quella. Un campo data si compila in un gesto sul telefono,
               e il numero che ne esce è vero. -->
          <!-- SI SCRIVE, non si sfoglia un calendario. Chiesto dal
               founder il 19/08 provando il percorso: con il campo
               type=date il telefono apriva il calendario ad AGOSTO
               2012 e per arrivare al 1985 servivano decine di tocchi.
               Chi conosce la propria data la scrive in tre secondi;
               le barrette le mette l'app mentre digiti. -->
          <input type="text" id="o2dob" inputmode="numeric" maxlength="10"
                 placeholder="${esc(tr("gg/mm/aaaa"))}"
                 oninput="dateMask(this)"
                 value="${esc(bz("o2dob",b.dob?dobPretty(b.dob):""))}"></div>
        <div><label>${esc(tr("Altezza (cm)"))}</label>
          <input type="number" id="o2h" inputmode="numeric" min="120" max="230" value="${esc(bz("o2h",b.h||""))}" placeholder="175"></div>
      </div>
      <label>${esc(tr("Peso di oggi (kg)"))}</label>
      <input type="number" id="o2w" inputmode="decimal" step="0.1" min="30" max="300" value="${esc(bz("o2w",b.w||""))}" placeholder="80">
    </div>`+
   onb2Mic("bio");}

/* ═══ I PIANI, RACCONTATI SENZA PREZZI ════════════════════════════
   Tre regole, tutte del founder (23/08):
   • NIENTE PREZZI: «presto». Un listino su un'app non ancora
     pubblicata è un numero che cambierà, e un numero che cambia dopo
     che qualcuno l'ha letto è una promessa rotta. Quando i piani
     apriranno, i prezzi arriveranno dal server come dappertutto.
   • COSA È INCLUSO, con la formula «tutto quello che c'è in X, più…».
     Dice due cose in una: che il Free non è un assaggio a tempo, e
     che pagare AGGIUNGE invece di sbloccare qualcosa che era già lì.
   • STESSO STILE delle altre schermate: le stesse card di ogni altra
     domanda, non un cartellone.
   E il Free dice la verità su cosa riceve: il piano di base con le
   quantità rifatte sui suoi numeri, non «niente piano». */
function ONB2_PIANI(){return [
 {k:"free",n:tr("Free"),p:tr("sempre gratis"),
  d:tr("Diario, alimenti, peso, storico, spesa e backup sul tuo Drive. Il piano è quello di base, con le quantità rifatte sui tuoi numeri.")},
 {k:"start",n:"Start",p:tr("presto"),
  d:tr("Tutto quello che c'è in Free, più il piano scritto sulle tue risposte e rifatto quando qualcosa cambia.")},
 {k:"complete",n:"Complete",p:tr("presto"),
  d:tr("Tutto quello che c'è in Start, più la foto del piatto, lo scontrino e il quadro della settimana.")},
 {k:"premium",n:"Premium",p:tr("presto"),
  d:tr("Tutto quello che c'è in Complete, più gli allenamenti e il sostegno nei momenti difficili.")}
];}
window.ONB2_PIANI=ONB2_PIANI;

function onb2Piani(sc){
  const o=onb2Stato(),val=o.ris.piani;
  return onb2Chip("piani")+
   `<div class="o2ops">`+ONB2_PIANI().map(P=>
    `<button class="o2op o2piano${val===P.k?" scelta":""}" type="button"
       onclick="onb2Rispondi('piani','${esc(P.k)}')">
       <span class="o2pr"><b>${esc(P.n)}</b><i>${esc(P.p)}</i></span>
       <span>${esc(P.d)}</span>
     </button>`).join("")+`</div>`+
   `<span class="o2hint">${esc(tr("Nessun pagamento adesso: quando i piani apriranno te lo diciamo."))}</span>`;}

/* Peso obiettivo + l'unico numero che conta: quanto ci vuole DAVVERO. */
function onb2Numero(sc){
  const o=onb2Stato(),val=o.ris[sc.k]||"";
  return onb2Chip(sc.k)+
   `<div class="o2form">
      <label>${esc(tr("Peso obiettivo"))} (${esc(sc.unita)})</label>
      <input type="number" id="o2goal" inputmode="decimal" step="0.1" min="${sc.min}" max="${sc.max}"
        value="${esc(bz("o2goal",val))}" placeholder="72" oninput="onb2Proiezione()">
    </div>
    <div class="o2ins" id="o2ins" aria-live="polite">${onb2ProiezioneHTML()}</div>`+
   onb2Mic(sc.k);}

/* ── La proiezione: numeri veri, dal motore già collaudato ─────────
   wizTargets() legge WIZ.d, quindi si travasano lì le risposte e si
   chiede a lui. Nessuna formula duplicata: se un giorno cambia la
   formula del fabbisogno, cambia anche qui, da sola.               */
function onb2Targets(){
  const o=onb2Stato(),b=o.ris.bio||{};
  if(!(b.w>0)||!(b.h>0)||!(b.eta>0))return null;
  const attMap={fermo:1.25,leggero:1.375,regolare:1.55,intenso:1.725};
  const goalMap={perdere:"moderato",mantenere:"mantenimento",massa:"massa"};
  const salva=(typeof WIZ!=="undefined"&&WIZ)?WIZ.d:null;
  try{
    /* la data vera se c'è; l'età resta solo come ripiego per chi ha
       già compilato il percorso con la versione vecchia */
    const nascita=b.dob?new Date(b.dob)
      :(function(){const d=new Date();d.setFullYear(d.getFullYear()-(+b.eta||30));return d;})();
    WIZ.d={gen:b.gen||"m",dob:nascita.toISOString().slice(0,10),h:+b.h,w:+b.w,fat:null,
           act:attMap[o.ris.attivita]||1.375,goal:goalMap[o.ris.obiettivo]||"moderato"};
    return wizTargets();
  }catch(e){return null;}
  finally{if(salva)WIZ.d=salva;}}
window.onb2Targets=onb2Targets;

function onb2ProiezioneHTML(){
  const o=onb2Stato(),b=o.ris.bio||{},goal=+o.ris.pesoObiettivo||0;
  if(!goal||!(b.w>0))return `<span class="o2hint">${esc(tr("Appena scrivi il peso, ti dico quanto ci vuole."))}</span>`;
  const t=onb2Targets();
  if(!t)return `<span class="o2hint">${esc(tr("Appena scrivi il peso, ti dico quanto ci vuole."))}</span>`;
  const diff=Math.round((b.w-goal)*10)/10;
  if(Math.abs(diff)<0.5)
    return `<b>${esc(tr("Sei già dove volevi arrivare."))}</b><br><span class="o2hint">${esc(tr("Allora il piano serve a restarci: fabbisogno {k} kcal al giorno.",{k:t.tdee}))}</span>`;
  if(diff<0)
    return `<b>${esc(tr("Vuoi salire di {n} kg.",{n:Math.abs(diff)}))}</b><br><span class="o2hint">${esc(tr("Con {k} kcal al giorno e {p} g di proteine si cresce piano, che è il modo giusto.",{k:t.kcal,p:t.prot}))}</span>`;
  /* 7700 kcal ≈ 1 kg: è la stessa costante del motore di proiezione. */
  const defGiorno=Math.max(1,t.tdee-t.kcal);
  const sett=Math.max(1,Math.round(diff*7700/(defGiorno*7)));
  const mesi=Math.round(sett/4.33*10)/10;
  return `<b>${esc(tr("{n} kg in circa {s} settimane.",{n:diff,s:sett}))}</b>
    <span class="o2hint">${esc(mesi>=2?tr("Poco più di {m} mesi, andando piano e senza fame nera.",{m:mesi}):tr("Andando piano e senza fame nera."))}</span>
    <div class="o2mini">${esc(tr("Fabbisogno {t} kcal · piano {k} kcal · {p} g di proteine",{t:t.tdee,k:t.kcal,p:t.prot}))}</div>
    <div class="o2mini">${esc(tr("È una stima onesta, non una promessa: la ricalcolo insieme a te man mano."))}</div>`;}
window.onb2ProiezioneHTML=onb2ProiezioneHTML;

window.onb2Proiezione=()=>{
  const inp=document.getElementById("o2goal"),box=document.getElementById("o2ins");
  if(!inp||!box)return;
  const o=onb2Stato();o.ris.pesoObiettivo=+inp.value||0;
  box.innerHTML=onb2ProiezioneHTML();};

/* ── Consenso per il dato sensibile ──────────────────────────────
   Si chiede PRIMA di mostrare la domanda, con parole chiare, e la
   risposta si può dare anche saltando: nessuno è obbligato a
   raccontare come sta in mezzo a un questionario.                 */
function onb2Consenso(){
  const o=onb2Stato();
  if(o.sensibili===true)return `<div class="o2cons ok">${esc(tr("Grazie: resta sul tuo telefono e serve solo a scegliere le parole giuste."))}
    <button class="btn ghost small" type="button" onclick="onb2ConsensoSet(false)">${esc(tr("Ripensaci"))}</button></div>`;
  return `<div class="o2cons">
    <b>${esc(tr("Questa è una domanda personale."))}</b>
    <span>${esc(tr("La risposta resta sul tuo telefono e non esce da qui."))}</span>
    <div class="o2consb">
      <button class="btn small" type="button" onclick="onb2ConsensoSet(true)">${esc(tr("Va bene, chiedimi pure"))}</button>
      <button class="btn ghost small" type="button" onclick="onb2Salta()">${esc(tr("Preferisco non dirlo"))}</button>
    </div></div>`;}

window.onb2ConsensoSet=(v)=>{const o=onb2Stato();
  o.sensibili=!!v;
  if(!v)delete o.ris.corpo;   /* l'unica sensibile rimasta: gli stati del corpo */
  onb2Salva();renderOnb2();};

/* ── Chip modificabili: quello che la voce ha capito ─────────────
   La voce propone, non decide. Ogni campo estratto si vede, si può
   correggere (tornando alla schermata) o buttare via.             */
function onb2Chip(k){
  const o=onb2Stato();
  if(!o.saltate.includes(k))return "";
  const et=onb2Etichetta(k);
  if(!et)return "";
  return `<div class="o2chips"><span class="o2chip2" data-campo="${esc(k)}">${esc(et)}
    <button type="button" class="o2chipx" onclick="onb2ChipTogli('${esc(k)}')"
      aria-label="${esc(tr("Correggi"))}">✕</button></span>
    <span class="o2hint">${esc(tr("L'ho preso dal tuo racconto: correggilo se ho capito male."))}</span></div>`;}

function onb2Etichetta(k){
  const o=onb2Stato(),v=o.ris[k];
  if(v==null||v==="")return "";
  if(k==="bio"){const b=v||{};
    return [b.gen==="f"?tr("Donna"):tr("Uomo"),b.eta?b.eta+" "+tr("anni"):"",b.h?b.h+" cm":"",b.w?b.w+" kg":""]
      .filter(Boolean).join(" · ");}
  if(k==="pesoObiettivo")return v+" kg";
  const sc=ONB2c().find(x=>x.k===k);
  if(Array.isArray(v)){
    if(sc&&sc.op)return v.map(x=>{const t=sc.op.find(y=>y[0]===x);return t?t[1]:x;}).join(", ");
    return v.join(", ");}
  if(typeof v==="object")return Object.values(v).filter(x=>typeof x==="string").join(" · ")||tr("— compilata");
  if(sc&&sc.op){const t=sc.op.find(x=>x[0]===v);if(t)return t[1];}
  return String(v);}

window.onb2ChipTogli=(k)=>{const o=onb2Stato();
  delete o.ris[k];o.saltate=o.saltate.filter(x=>x!==k);
  onb2Salva();renderOnb2();};

/* ── Navigazione ────────────────────────────────────────────────── */
window.onb2Rispondi=(k,v)=>{
  const o=onb2Stato();
  const sc=ONB2c().find(x=>x.k===k);
  if(sc&&sc.sensibile&&o.sensibili!==true)return;   /* niente consenso, niente risposta */
  o.ris[k]=v;onb2Salva();
  /* la conferma prima di cambiare schermata: si vede sopra la
     risposta appena data, non sopra la domanda dopo */
  try{if(typeof confermaPasso==="function")confermaPasso(k);}catch(e){}
  onb2Avanti();};

window.onb2Bio=()=>{
  const g=id=>{const e=document.getElementById(id);return e?e.value:"";};
  /* il campo ora è testo «gg/mm/aaaa»: si converte in data vera, e se
     la scrittura è incompleta si dice cosa manca invece di dare un
     errore generico */
  const dobTxt=g("o2dob");
  const dob=(typeof dobParse==="function")?dobParse(dobTxt):dobTxt;
  if(dobTxt&&!dob)
    return dlgAlert(tr("La data va scritta come giorno/mese/anno, per esempio 14/03/1985."));
  const eta=dob?Math.floor((Date.now()-Date.parse(dob))/(365.25*864e5)):0;
  const h=+g("o2h"),w=parseFloat(g("o2w"));
  if(!dob||!(eta>=14&&eta<=100)||!(h>=120&&h<=230)||!(w>=30&&w<=300))
    return dlgAlert(tr("Mi servono età, altezza e peso per calcolare qualcosa di vero. Sono gli unici numeri obbligatori."));
  const o=onb2Stato();
  o.ris.bio={nome:(g("o2nome")||"").trim().slice(0,40),gen:g("o2gen")||"m",dob,eta,h,w};
  onb2BozzaButta();onb2Salva();
  try{if(typeof confermaPasso==="function")confermaPasso("bio");}catch(e){}
  onb2Avanti();};

window.onb2Goal=()=>{
  const e=document.getElementById("o2goal"),v=parseFloat(e?e.value:"");
  const o=onb2Stato();
  if(!(v>=30&&v<=300))return dlgAlert(tr("Scrivi il peso che hai in mente, anche di massima."));
  /* IL GUARDRAIL VALE ANCHE QUI (23/08). Prima il percorso accettava
     qualunque numero fra 30 e 300: una persona di 178 cm che scriveva
     45 kg riceveva la sua proiezione e il piano ci veniva costruito
     sopra. Lo stesso 45, scritto in Regole, l'app lo rifiutava. Ora il
     metro è uno solo, e vale dove una persona arriva per prima. */
  if(!goalWeightApplica(v,{zitto:true}))return;
  o.ris.pesoObiettivo=goalWeightSet()||v;
  onb2BozzaButta();onb2Salva();onb2Avanti();};

/* Salta una schermata senza rispondere: succede col consenso negato
   e con le domande che non hanno una risposta per tutti. */
window.onb2Salta=()=>{const o=onb2Stato();
  if(ONB2c()[o.step]&&ONB2c()[o.step].sensibile&&o.sensibili===null)o.sensibili=false;
  onb2Salva();onb2Avanti();};

/* Il pulsante «Avanti» della barra: una porta sola per tutte le
   schermate. Prima ogni tipo aveva il suo bottone in mezzo alla
   pagina e la barra sotto ne aveva altri due: tre pulsanti, tre
   posti diversi. Ora sono tre, in fila, sempre nello stesso punto. */
window.onb2AvantiSchermo=()=>{
  const o=onb2Stato(),sc=ONB2c()[o.step];
  if(!sc)return;
  if(sc.tipo==="modulo")return onb2Bio();
  if(sc.tipo==="numero")return onb2Goal();
  if(sc.tipo==="dieta")return onb2DietaOk();
  if(sc.tipo==="pasti")return onb2PastiOk();
  if(sc.tipo==="preferenze")return onb2PrefOk();
  if(sc.tipo==="multi")return onb2MultiOk(sc.k);
  if(sc.tipo==="pausa")return onb2Avanti();
  /* schermata a scelta: senza risposta non si va avanti a vuoto */
  if(o.ris[sc.k]==null)return dlgAlert(tr("Scegli una risposta per andare avanti."));
  return onb2Avanti();};

function onb2Avanti(){
  const o=onb2Stato();
  let n=o.step+1;
  /* Si saltano: le schermate già risposte dal racconto (chiedere due
     volte la stessa cosa è il modo più rapido per far chiudere l'app)
     e quelle che non riguardano questa persona (`se` falso: gli stati
     del corpo femminile per chi ha detto uomo). */
  const salta=i=>{const s=ONB2c()[i];if(!s)return false;
    if(s.se&&!s.se())return true;
    return o.saltate.includes(s.k)&&o.ris[s.k]!=null;};
  while(n<ONB2c().length-1&&salta(n))n++;
  /* La schermata marcata `genera` è il confine: da lì in poi nessuna
     risposta cambia il piano, quindi l'AI può partire. */
  try{const arrivo=ONB2c()[n];
    if(arrivo&&arrivo.genera&&typeof onb2GeneraOra==="function")onb2GeneraOra();}catch(e){}
  o.step=Math.min(n,ONB2c().length-1);
  if(o.step>o.maxVisto)o.maxVisto=o.step;
  onb2Salva();renderOnb2();try{window.scrollTo(0,0);}catch(e){}}
window.onb2Avanti=onb2Avanti;

/* ═══ IL RIVEDI NON C'È PIÙ (founder, 23/08) ══════════════════════
   Era una terza azione nella barra: apriva un foglio con tutte le
   risposte e da ogni riga si tornava a cambiarla. È stato tolto
   insieme a onb2Rivedi, onb2Leggibile e onb2VaiA.
   La ragione: tre comandi su una riga sola costringevano a stringere
   Indietro e Avanti in misure diverse, e la barra cambiava forma da
   una schermata all'altra. Con due comandi soli, pari, la riga è
   sempre la stessa — e la cosa che il Rivedi risolveva («non ricordo
   cosa ho detto») la risolve un Indietro che c'è sempre e non perde
   quello che hai scritto.                                        */

/* ── LA BOZZA: quello che hai scritto non si perde ────────────────
   Richiesta del founder (23/08): «l'Indietro c'è sempre e conserva i
   dati». Fino a ieri i campi si salvavano SOLO passando da Avanti,
   che valida: chi scriveva metà della data e tornava indietro
   ritrovava la schermata vuota, e doveva riscrivere tutto.
   Qui si prende una fotografia dei campi a schermo — senza
   validarli, perché una bozza è per definizione incompleta — e la si
   rimette al loro posto al ritorno. Alla prima risposta valida la
   bozza si butta: da lì in poi comanda la risposta vera.
   Vale per ogni campo con un `id`, quindi non va aggiornata quando
   nasce una schermata nuova.                                     */
function onb2BozzaPrendi(){
  try{
    const el=document.getElementById("pg-onb2");
    if(!el)return;
    const o=onb2Stato();o.bozza=o.bozza||{};
    el.querySelectorAll("input[id],select[id],textarea[id]").forEach(c=>{
      if(c.type==="checkbox"||c.type==="radio")return;
      o.bozza[c.id]=c.value;});
  }catch(e){}}
/* Il valore da mettere nel campo: la bozza se c'è, altrimenti la
   risposta già data. Una funzione sola, così nessuna schermata può
   dimenticarsene a metà. */
function bz(id,valore){
  const b=(onb2Stato().bozza)||{};
  return (b[id]!=null&&b[id]!=="")?b[id]:(valore==null?"":valore);}
function onb2BozzaButta(){const o=onb2Stato();if(o.bozza)delete o.bozza;onb2Salva();}

window.onb2Indietro=()=>{
  const o=onb2Stato();
  onb2BozzaPrendi();                 /* prima di cambiare schermata, si fotografa */
  if(o.step<=0){                     /* dalla prima si esce, non si resta in trappola */
    onb2Salva();
    return dlgAlert(tr("Siamo alla prima domanda: da qui si può solo andare avanti. Puoi chiudere l'app e riprendere quando vuoi, non perdi nulla."));}
  let n=o.step-1;
  const salta=i=>{const s=ONB2c()[i];if(!s)return false;
    if(s.se&&!s.se())return true;
    return o.saltate.includes(s.k)&&o.ris[s.k]!=null;};
  while(n>0&&salta(n))n--;
  o.step=n;                          /* maxVisto NON scende: la barra non torna indietro */
  onb2Salva();renderOnb2();try{window.scrollTo(0,0);}catch(e){}};

/* ── Voce ────────────────────────────────────────────────────────
   Si appoggia al motore vocale dell'app (voceIn): un solo microfono
   per tutta Nuvia. Qui si crea al volo un campo di testo nascosto,
   si ascolta, e alla fine si legge il testo col contratto nuovo.  */
window.onb2Voce=(campo)=>{
  if(typeof vocePossibile!=="function"||!vocePossibile())
    return dlgAlert(tr("Su questo telefono non posso accendere il microfono da solo. Puoi dettare con il microfono della tastiera, oppure rispondere toccando: è identico."));
  onb2Ascolta(campo,false);};

window.onb2Racconto=()=>{
  if(typeof vocePossibile!=="function"||!vocePossibile())
    return onb2RaccontoScritto();
  onb2Ascolta("racconto",true);};

/* Il campo dove atterra il parlato. Invisibile ma reale: voceIn
   scrive lì dentro, e da lì si legge quando la persona ha finito. */
function onb2Campo(){
  let ta=document.getElementById("o2voce");
  if(!ta){ta=document.createElement("textarea");ta.id="o2voce";
    ta.style.position="absolute";ta.style.left="-9999px";ta.setAttribute("aria-hidden","true");
    (document.getElementById("pg-onb2")||document.body).appendChild(ta);}
  return ta;}

function onb2Ascolta(campo,tutto){
  const ta=onb2Campo();ta.value="";
  const box=document.getElementById("pg-onb2");
  try{voceIn("o2voce","o2mic_"+campo);}catch(e){
    return dlgAlert(tr("Il microfono non è partito. Rispondi pure toccando: è identico."));}
  if(box&&!document.getElementById("o2stop")){
    const b=document.createElement("button");
    b.id="o2stop";b.className="btn o2stop";b.type="button";
    b.textContent=tutto?tr("Ho finito di raccontare"):tr("Ho finito");
    b.onclick=()=>{try{voceIn("o2voce","o2mic_"+campo);}catch(e){}
      const t=(document.getElementById("o2voce")||{}).value||"";
      b.remove();onb2Leggi(t,tutto);};
    box.appendChild(b);}}

function onb2RaccontoScritto(){
  const box=document.getElementById("pg-onb2");if(!box)return;
  if(document.getElementById("o2scritto"))return;
  const d=document.createElement("div");
  d.id="o2scritto";d.className="o2form";
  d.innerHTML=`<label>${esc(tr("Raccontami di te con parole tue"))}</label>
    <textarea id="o2testo" rows="4" placeholder="${esc(tr("es. Ho 42 anni, 178 cm per 95 kg, lavoro seduto, vorrei arrivare a 85 kg. La sera quando sono stanco mangio di più."))}"></textarea>
    <button class="btn small" type="button" onclick="onb2LeggiScritto()">${esc(tr("Leggi e compila"))}</button>`;
  box.appendChild(d);}
window.onb2RaccontoScritto=onb2RaccontoScritto;

window.onb2LeggiScritto=()=>{
  const e=document.getElementById("o2testo");
  onb2Leggi(e?e.value:"",true);};

/* ── Estrazione: contratto src/contratti/estrazione_onboarding.md ──
   Il modello PROPONE. Tutto ciò che non è nello schema, o è fuori
   intervallo, viene buttato via qui: meglio una domanda in più che
   un dato inventato dentro il calcolo del fabbisogno.             */
const ONB2_SCHEMA={
  obiettivo:{en:["perdere","mantenere","massa"]},
  sesso:{en:["m","f"]},
  eta:{n:[14,100]}, altezza:{n:[120,230]}, peso:{n:[30,300]}, pesoObiettivo:{n:[30,300]},
  ritmi:{en:["sedentario","inPiedi","turni","studente","casa"]},
  cibo:{en:["sereno","nervoso","noia","sociale"],sensibile:true},
  tentativi:{en:["mai","qualcuno","molti","yoyo"]},
  attivita:{en:["fermo","leggero","regolare","intenso"]},
  infortuni:{t:120}, attrezzatura:{en:["niente","casa","palestra"]},
  cucina:{en:["veloce","normale","amoCucinare"]},
  motivazione:{en:["salute","energia","estetica","evento"]}
};
window.ONB2_SCHEMA=ONB2_SCHEMA;

function onb2Valida(j){
  const out={};
  if(!j||typeof j!=="object"||Array.isArray(j))return out;
  Object.keys(j).forEach(k=>{
    const reg=ONB2_SCHEMA[k];
    if(!reg)return;                                   /* campo ignoto: via */
    const v=j[k];
    if(v==null||v==="")return;
    if(typeof v==="object")return;                    /* mai oggetti o liste */
    if(reg.en){if(reg.en.includes(String(v)))out[k]=String(v);return;}
    if(reg.n){const n=parseFloat(v);
      if(isFinite(n)&&n>=reg.n[0]&&n<=reg.n[1])out[k]=Math.round(n*10)/10;return;}
    if(reg.t){const t=String(v).replace(/<[^>]*>/g,"").trim().slice(0,reg.t);
      if(t)out[k]=t;return;}});
  return out;}
window.onb2Valida=onb2Valida;

/* Dai campi validati alle risposte delle schermate. Il dato sensibile
   entra SOLO col consenso già dato: senza, si scarta e si chiederà. */
function onb2Applica(v){
  const o=onb2Stato(),messi=[];
  const metti=(k,val)=>{if(val==null||val==="")return;
    o.ris[k]=val;if(!o.saltate.includes(k))o.saltate.push(k);messi.push(k);};
  metti("obiettivo",v.obiettivo);
  if(v.eta&&v.altezza&&v.peso)
    metti("bio",{gen:v.sesso||"m",eta:Math.round(v.eta),h:Math.round(v.altezza),w:v.peso});
  metti("pesoObiettivo",v.pesoObiettivo);
  metti("ritmi",v.ritmi);
  if(v.cibo&&o.sensibili===true)metti("cibo",v.cibo);
  metti("tentativi",v.tentativi);
  metti("attivita",v.attivita);
  metti("cucina",v.cucina);
  metti("motivazione",v.motivazione);
  if(v.infortuni)o.ris.infortuni=v.infortuni;
  if(v.attrezzatura)o.ris.attrezzatura=v.attrezzatura;
  onb2Salva();
  return messi;}
window.onb2Applica=onb2Applica;

async function onb2Leggi(testo,tutto){
  const t=String(testo||"").trim();
  const sc=document.getElementById("o2scritto");if(sc)sc.remove();
  if(!t)return toast(tr("Non ho sentito nulla. Rispondi pure toccando: è identico."));
  if(typeof aiOn!=="function"||!aiOn())
    /* la causa non è la rete: è che l'AI non è ancora attiva. Dirlo
       storto manda la persona a controllare il wifi per niente. */
    return toast(tr("Per capire un racconto intero serve l'AI, che si attiva col conto. Intanto rispondi toccando: è identico, e ci mettiamo un attimo."));
  toast(tr("Leggo…"));
  try{
    const j=await onb2Chiedi(t);
    const v=onb2Valida(j);
    const messi=onb2Applica(v);
    renderOnb2();
    if(!messi.length)return toast(tr("Non ho capito abbastanza per compilare: andiamo con le domande, è un attimo."));
    if(tutto)onb2Avanti();
    toast(tr("Ho segnato {n} cose. Le vedi qui sopra: correggile se ho capito male.",{n:messi.length}));
  }catch(e){
    toast(tr("Non sono riuscito a leggere il racconto. Rispondi toccando: è identico."));}}
window.onb2Leggi=onb2Leggi;

/* Otto secondi e non uno di più: oltre, si prosegue a tocchi. */
function onb2Chiedi(testo){
  const q='Questa persona si racconta: """'+testo+'""". '+
    'Estrai SOLO ciò che dice davvero: non dedurre, non completare, non inventare. Campo non detto = null. '+
    'Rispondi SOLO con questo JSON, senza testo attorno: '+
    '{"obiettivo":"perdere|mantenere|massa|null","sesso":"m|f|null","eta":null,"altezza":null,"peso":null,'+
    '"pesoObiettivo":null,"ritmi":"sedentario|inPiedi|turni|studente|casa|null",'+
    '"cibo":"sereno|nervoso|noia|sociale|null","tentativi":"mai|qualcuno|molti|yoyo|null",'+
    '"attivita":"fermo|leggero|regolare|intenso|null","infortuni":null,'+
    '"attrezzatura":"niente|casa|palestra|null","cucina":"veloce|normale|amoCucinare|null",'+
    '"motivazione":"salute|energia|estetica|evento|null"}';
  return Promise.race([
    aiAskJSON(q,"onb2"),
    new Promise(r=>setTimeout(()=>r(null),8000))
  ]);}

/* ── Ultima schermata: come vuoi che ti segua ────────────────────── */
/* PILASTRO: il piano è SETTIMANALE, sempre. Qui non si sceglie più
   fra settimana e giornata (la scelta «Alla giornata» è stata tolta
   il 22/08): si mostra soltanto a che punto è il piano che l'AI ha
   cominciato a scrivere tre schermate fa. */
function onb2Fine(sc){
  const g=onb2Gen();
  /* «base» è uno stato PRONTO come gli altri: il piano c'è, l'ha
     solo scritto il piano di partenza invece dell'AI. Senza questa
     riga chi resta su Free avrebbe letto «Entra appena è pronto»
     davanti a un piano già finito. */
  const pronto=(g.stato==="fatto"||g.stato==="base"||g.stato==="senzaAI"||g.stato==="errore");
  return `${masc(pronto?"festeggia":"cucina",96)}
  <div class="o2gen" id="o2gen" aria-live="polite">
    <div class="o2genbar"><i id="o2genb" style="width:${g.perc}%"></i></div>
    <div class="o2gent" id="o2gent">${esc(g.riga||tr("Sto per cominciare…"))}</div>
    ${onb2GenLista(g)}
  </div>
  <button class="btn o2entra" type="button" onclick="onb2Chiudi('piano')">${
    pronto?esc(tr("Entra")):esc(tr("Entra appena è pronto"))}</button>`;}

/* L'avanzamento raccontato riga per riga: la persona vede cosa manca
   invece di una rotella che gira. */
function onb2GenLista(g){
  if(!g.righe||!g.righe.length)return "";
  return `<ul class="o2genl">`+g.righe.map(r=>
    `<li class="${esc(r.s)}">${esc(r.t)}</li>`).join("")+`</ul>`;}

/* Travaso finale: da S.onb2 alle chiavi di sempre. Si SCRIVE SOPRA
   solo ciò che la persona ha appena detto; il resto dello stato
   (e tutto ciò che c'era prima) resta intatto.                    */
function onb2Travasa(){
  const o=onb2Stato(),r=o.ris,b=r.bio||{};
  const attMap={fermo:1.25,leggero:1.375,regolare:1.55,intenso:1.725};
  const goalMap={perdere:"deciso",mantenere:"mantenimento",massa:"massa"};
  /* ── L'OBIETTIVO, nel campo che il motore legge DAVVERO ──────────
     Il difetto (23/08): l'onboarding scriveva solo S.diet.goal, ma
     tutto il calcolo — deficitTarget(), protKgAuto(), rateNote(),
     planForecast(), checkPlanAge() — legge S.profile.goal, che non
     aveva nemmeno un valore predefinito. Risultato misurato: chi
     sceglieva «mettere massa» riceveva 1879 kcal con 470 kcal di
     DEFICIT, esattamente come chi voleva perdere peso.
     I rami giusti nel motore c'erano già: mancava chi li accendeva.
     Le parole sono quelle della tendina di Regole → Obiettivi, così
     le due porte dicono la stessa cosa invece di due dialetti: chi
     rifà il percorso ritrova la sua scelta già selezionata lì.
     S.diet.goal resta scritto com'era: lo legge 65_costellazione,
     che confronta con «massa» carattere per carattere.            */
  const goalProfilo={perdere:"dimagrimento graduale",
                     mantenere:"mantenimento",
                     massa:"aumento di massa"};
  if(b.eta>0){const n=new Date();n.setFullYear(n.getFullYear()-b.eta);
    S.profile.dob=S.profile.dob||n.toISOString().slice(0,10);}
  if(b.nome)S.profile.name=b.nome;
  if(b.gen)S.profile.gender=b.gen;
  if(b.h>0)S.profile.h=b.h;
  if(b.w>0)S.profile.w=b.w;
  /* Non più un «=» diretto (23/08): il percorso guidato era l'unica
     porta che scavalcava il portone, quindi l'unica dove il guardrail
     era spento. È anche la prima schermata che una persona incontra,
     cioè il posto in cui serve di più. Qui si scrive zitti perché il
     rifiuto è già stato detto quando è stato scritto il numero. */
  if(r.pesoObiettivo>0)goalWeightApplica(r.pesoObiettivo,{zitto:true});
  S.profile.act=attMap[r.attivita]||S.profile.act||1.375;
  if(r.obiettivo){
    S.diet.goal=goalMap[r.obiettivo]||S.diet.goal;
    S.profile.goal=goalProfilo[r.obiettivo]||S.profile.goal;}
  S.ui.modalitaPasti=o.modalita||"piano";
  /* ── Le risposte nuove finiscono NEGLI STESSI CAMPI che Regole →
     Caratteristiche alimentari legge e modifica. Una fonte sola:
     l'onboarding compila, Regole resta il posto dove si cambia.
     Regola del founder (22/08): niente doppioni, due porte d'ingresso. */
  const senzaNone=(a,none)=>(Array.isArray(a)?a.filter(x=>x!==none):[]);
  const conAltro=(a,altro)=>{const l=a.slice();
    if(altro)String(altro).split(",").map(x=>x.trim()).filter(Boolean).forEach(x=>l.push(x));
    return l.join(", ");};
  if(r.dieta){
    S.diet.tipo=r.dieta.tipo||S.diet.tipo||"mediterranea";
    S.diet.vegUova=(r.dieta.uova!==false);
    S.diet.vegPesce=!!r.dieta.pesce;
    S.diet.tradizione=r.dieta.tradizione||"italiana";}
  if(Array.isArray(r.allergie))S.diet.intol=conAltro(senzaNone(r.allergie,"niente"),r.allergie_altro);
  if(Array.isArray(r.salute))S.diet.patologie=senzaNone(r.salute,"niente").join(", ");
  if(r.farmaci!=null)S.diet.farmaci=String(r.farmaci).trim();
  if(Array.isArray(r.protocolli)){
    S.diet.protocolli=senzaNone(r.protocolli,"nessuno").join(", ");
    S.diet.fodmap=S.diet.protocolli.toLowerCase().includes("fodmap");}
  if(Array.isArray(r.vincoli))S.diet.religiose=senzaNone(r.vincoli,"nessuno").join(", ");
  if(r.pasti&&Array.isArray(r.pasti.slots)&&r.pasti.slots.length>=2){
    S.diet.slots=r.pasti.slots.join(", ");
    S.diet.nPasti=r.pasti.slots.length;
    S.diet.pastiLiberi=+r.pasti.liberi||0;}
  if(r.cucina){
    S.diet.pronto=(r.cucina==="veloce")?"velocissimo":(r.cucina==="amoCucinare")?"mi piace cucinare":"semplice";
    S.diet.cucina=(r.cucina==="veloce")?10:(r.cucina==="amoCucinare")?60:30;}
  if(r.preferenze){
    S.diet.budget=r.preferenze.budget||"medio";
    S.diet.alcol=r.preferenze.alcol||"mai";
    S.diet.varieta=r.preferenze.varieta||"media";}
  /* Gli stati del corpo valgono solo con genere donna (11_2 li azzera
     altrimenti) e col consenso dato: sono dati sensibili. */
  if(b.gen==="f"&&o.sensibili===true&&r.corpo&&r.corpo!=="no"){
    S.phys=S.phys||{};
    if(r.corpo==="t1"||r.corpo==="t2"||r.corpo==="t3")S.phys.preg=r.corpo;
    if(r.corpo==="lactE")S.phys.lact="esclusivo";
    if(r.corpo==="lactP")S.phys.lact="parziale";}
  /* Il dato sensibile vive in un posto solo, con il suo consenso a fianco:
     così chi legge il codice sa sempre se può usarlo. */
  /* Il consenso resta solo dove serve davvero: gravidanza e
     allattamento. Condizioni di salute e rapporto col cibo non lo
     chiedono più (scelta del founder, 22/08): erano due muri in
     mezzo al percorso, e la riga sulla privacy vale per tutta l'app,
     non per una domanda. */
  o.sensibili=(o.sensibili===true);
  if(!o.sensibili)delete o.ris.corpo;
  onb2Salva();}
window.onb2Travasa=onb2Travasa;

/* La chiusura: il piano di solito è GIÀ pronto (l'AI è partita tre
   schermate fa). Se non lo è, si aspetta lì mostrando lo stato —
   nessuno resta davanti a una schermata muta. */
window.onb2Chiudi=async(modo)=>{
  const o=onb2Stato(),g=onb2Gen();
  o.modalita="piano";                         /* PILASTRO: solo settimanale */
  onb2Travasa();
  const entra=()=>{
    o.done=true;S.onboard.done=true;onb2Salva();
    try{if(typeof confermaFine==="function")confermaFine();}catch(e){}
    const b=o.ris.bio||{};
    if(b.w>0){try{S.profile.weights.push({d:iso(new Date()),w:b.w,fat:null,mus:null,pa:null,spo2:null});}catch(e){}}
    /* Si atterra sul PUNTO, non su Oggi: è il riepilogo di quello che
       la persona ha appena costruito, e porta il suo nome. */
    save();try{if(typeof rifaiTabs==="function")rifaiTabs();}catch(e){}
    setTimeout(()=>show("punto"),300);};
  /* mai partita (percorso ripreso a metà, o schermata raggiunta di
     corsa): si avvia adesso e si aspetta */
  if(g.stato==="fermo")onb2GeneraOra();
  if(g.stato==="lavoro"){
    const t0=Date.now();
    while(onb2Gen().stato==="lavoro"&&Date.now()-t0<60000)
      await new Promise(r=>setTimeout(r,200));}
  const gg=onb2Gen();
  if(gg.piano){
    /* Stesso meccanismo del percorso lungo: il piano diventa customPlan
       e la settimana riparte pulita. Niente scorciatoie: se un giorno
       cambia il modo di applicare un piano, cambia in un posto solo. */
    S.customPlan=gg.piano;PLAN=S.customPlan;S.permMeals={};
    S.customShop=null;S.week=freshWeek();
    try{S.ui.pianoProprio=0;}catch(e){}}
  entra();};

/* Ripartire da capo: usato dalle impostazioni e dai collaudi. */
window.onb2Ricomincia=()=>{S.onb2={v:1,step:0,maxVisto:0,ris:{},saltate:[],done:false,sensibili:null};
  onb2Salva();show("onb2");};
