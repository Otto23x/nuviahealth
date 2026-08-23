/* ═══════════════════════════════════════════════════════════════
   17. AVVIO: header, tema, streak, prompt del mattino
   ═══════════════════════════════════════════════════════════════ */
function renderHeader(){
  document.getElementById("hTitle").textContent=(S.ui.vacanza?" · "+tr("Vacanza"):"");
  const d=document.getElementById("hDate");
  d.innerHTML=fmtDateShort(VIEW)+(isToday()?"":"<small>"+tr("tocca per tornare a oggi")+"</small>");
  d.title=fmtDate(VIEW)+(isToday()?"":" — "+tr("tocca per tornare a oggi"));
  }
/* Banner (non popup) per gli allenamenti di ieri dimenticati */
function yIdx(){const y=new Date();y.setDate(y.getDate()-1);return wd(y);}
function unmarkedOfDay(di){return dayItems(di).filter(it=>{const st=S.week.days[it.pdi].meals[it.mi];return !st.done&&!st.skip;}).length;}
function dayCompleted(di){return dayItems(di).length>0&&unmarkedOfDay(di)===0;}
/* Settimana "scaduta": è iniziata prima del lunedì corrente e viene archiviata */
function weekStale(){const m=new Date();m.setHours(12,0,0,0);m.setDate(m.getDate()-wd(m));return S.week.started<iso(m);}
/* Il banner della nuova settimana diceva la stessa cosa dell'avviso,
   con un'altra forma: due modi diversi di comunicare lo stesso fatto. */
function needWeekBanner(){return false&&weekStale()&&S.ui.dismissWeek!==iso(new Date());}
window.dismissWeek=()=>{S.ui.dismissWeek=iso(new Date());save();render("oggi");};
/* v5 — Revisione persistente: i giorni passati con pasti non spuntati (o ieri
   senza sport) restano in un banner FISSO finché non premi "Completa" su
   ciascuno. Sopravvive al cambio di giorno (non è più "solo per oggi"). */
function pendingReviewDays(){ // promemoria di IERI: pasti, sport e acqua
  S.ui.reviewDone=S.ui.reviewDone||{};
  if(wd(new Date())===0)return [];      // lunedì: ieri è nella settimana chiusa
  const di=yIdx(),dISO=isoOfPdi(di);
  if(S.ui.reviewDone[dISO])return [];
  const missMeals=unmarkedOfDay(di)>0;
  const missSport=(S.week.days[di].workouts||[]).length===0;
  const missWater=(S.week.days[di].water||0)===0;
  return (missMeals||missSport||missWater)?[{di,dISO,missMeals,missSport,missWater}]:[];}
function isoOfPdi(di){ // ISO del giorno di piano `di` nella settimana corrente
  const mon=new Date();mon.setHours(12,0,0,0);mon.setDate(mon.getDate()-wd(mon));
  const d=new Date(mon);d.setDate(mon.getDate()+di);return iso(d);}
window.reviewDone=(dISO)=>{S.ui.reviewDone=S.ui.reviewDone||{};S.ui.reviewDone[dISO]=true;save();render("oggi");toast(tr("Giornata segnata come rivista ✓"));};
window.goReview=(di)=>{const mon=new Date();mon.setHours(12,0,0,0);mon.setDate(mon.getDate()-wd(mon)+di);VIEW=mon;renderHeader();render("oggi");};
/* Senza un piano non esistono pasti da spuntare: chiedere «hai segnato
   tutto?» a chi non ha ancora nulla da segnare è solo un rimprovero
   senza senso. */
/* Il saluto in cima al Punto dice già com'è andata ieri: un riquadro in
   fondo che rifà la stessa domanda è una ripetizione. */
function needMorningBanner(){return false;}
/* v5.1: grafici senza animazione (Chart.js ridisegna il canvas a 60fps
   per ogni animazione: è uno dei costi maggiori in batteria). */
try{if(window.Chart){Chart.defaults.animation=false;Chart.defaults.animations={};
  Chart.defaults.transitions.active.animation.duration=0;
  Chart.defaults.responsiveAnimationDuration=0;}}catch(e){}
/* ── Tema grafici ──────────────────────────────────────────────────
   Un solo posto per lo stile di TUTTI i grafici: font dell'app,
   griglie leggerissime sul colore delle linee di interfaccia, assi
   senza bordo, tooltip scuro arrotondato, barre morbide. I colori
   dei dataset restano quelli semantici scelti grafico per grafico. */
try{if(window.Chart){
  const cssv=v=>{try{return getComputedStyle(document.documentElement).getPropertyValue(v).trim();}catch(e){return "";}};
  const grig=cssv("--grigio")||"#68807C", linea=cssv("--linea")||"#E3EAE8", bosco=cssv("--bosco")||"#0A4E49";
  Chart.defaults.font.family="'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
  Chart.defaults.font.size=10.5;
  Chart.defaults.color=grig;                       /* etichette e legende */
  Chart.defaults.borderColor=linea;                /* griglia di default  */
  Chart.defaults.scale.grid.color=linea;
  Chart.defaults.scale.grid.drawTicks=false;       /* niente trattini: solo la griglia */
  Chart.defaults.scale.border.display=false;       /* assi senza riga di bordo */
  Chart.defaults.scale.ticks.padding=6;
  Chart.defaults.elements.line.borderWidth=2.4;
  Chart.defaults.elements.line.tension=0.35;
  Chart.defaults.elements.point.hoverRadius=5;
  Chart.defaults.elements.point.hitRadius=10;      /* facile da toccare col dito */
  Chart.defaults.elements.bar.borderRadius=7;
  Chart.defaults.elements.bar.borderSkipped=false;
  Chart.defaults.plugins.legend.labels.usePointStyle=true;
  Chart.defaults.plugins.legend.labels.pointStyle="line";
  Chart.defaults.plugins.legend.labels.boxWidth=18;
  Chart.defaults.plugins.legend.labels.padding=12;
  Chart.defaults.plugins.tooltip.backgroundColor=bosco;
  Chart.defaults.plugins.tooltip.cornerRadius=10;
  Chart.defaults.plugins.tooltip.padding=10;
  Chart.defaults.plugins.tooltip.titleFont={weight:"700",size:11.5};
  Chart.defaults.plugins.tooltip.bodyFont={size:11};
  Chart.defaults.plugins.tooltip.displayColors=true;
  Chart.defaults.plugins.tooltip.boxPadding=4;
}}catch(e){}
/* ── Rete di sicurezza dell'interfaccia ────────────────────────────
   Se una pagina va in errore mentre si disegna, prima restava il
   contenitore vuoto: schermo bianco e app inutilizzabile. Ora l'errore
   viene catturato, mostrato e restano a disposizione le vie d'uscita. */
function errorCardHTML(where,e){
  return `<div class="card nota grave">
  <h2>${tr("Qualcosa si è rotto")}</h2>
  <div class="hint">${tr("Non sono riuscito a disegnare la sezione")} <b>${esc(where)}${tr("</b>. I tuoi dati non sono stati toccati: sono ancora tutti sul dispositivo.")}</div>
  <div class="hint" style="font-family:monospace;font-size:11.5px;word-break:break-word;background:var(--crema);padding:8px;border-radius:8px">${esc((e&&e.message)||String(e))}</div>
  <div class="mtools" style="margin-top:12px">
    <button class="btn small" onclick="location.reload()">Ricarica</button>
    <button class="btn ghost small" onclick="show('oggi')">Vai a Oggi</button>
    <button class="btn ghost small" onclick="show('sistema')">Ripristino e backup</button>
    <button class="btn ghost small" onclick="reportCrash('${esc(where)}',${JSON.stringify((e&&e.message)||String(e))})">Segnala</button>
  </div></div>`;}
window.reportCrash=(where,msg)=>{
  const body="Errore nella sezione: "+where+"\n\n"+msg+"\n\n---\nNuvia v"+APP_VER+
    "\n"+new Date().toLocaleString(dataLoc())+"\n"+navigator.userAgent;
  location.href="mailto:info@nuviahealth.app?subject="+encodeURIComponent("[Nuvia "+APP_VER+"] Errore in "+where)+
    "&body="+encodeURIComponent(body);};
function safeRender(p,fn){
  try{fn();}
  catch(e){
    try{const el=document.getElementById("pg-"+p);
      if(el)el.innerHTML=errorCardHTML(p,e);}catch(_){}
    try{console.error("Nuvia render:",p,e);}catch(_){}
  }}
/* ═══ GUIDA ATTIVA — faro + primi passi ═══════════════════════════
   L'app va conosciuta: nelle prime due settimane un motore di priorità
   sceglie L'UNICA prossima azione utile e la illumina (il faro), mentre
   la card «Primi passi» in Punto tiene il conto dei cinque gesti che
   fanno partire davvero: piano, spunta, pesata, scontrino, backup.
   Ogni voce si spunta DA SOLA leggendo i dati veri — niente flag da
   ricordare — e toccandola si atterra sul punto esatto. Poi tace. */
function guideState(){S.guide=S.guide||{};if(!S.guide.start)S.guide.start=iso(new Date());return S.guide;}
function guideDays(){const d=safeDate(guideState().start+"T12:00:00");return d?Math.max(0,Math.floor((new Date()-d)/864e5)):0;}
function guideAnyCheck(){
  try{if(((S.archWeeks||S.hist)||[]).length)return true;}catch(e){}
  try{return (S.week.days||[]).some(d=>Object.values(d.st||{}).some(v=>v&&(v.done||v.skip)));}catch(e){return false;}}
const GUIDE_STEPS=[
 {id:"plan", t:tr("Genera o importa il piano"),done:()=>!!S.customPlan&&!planIsEmpty(),page:"piano",sel:'[onclick="planMoreSheet()"]'},
 {id:"check",t:tr("Spunta il primo pasto"),done:()=>guideAnyCheck(),page:"oggi",sel:".chk"},
 {id:"weigh",t:tr("Registra una pesata"),done:()=>(S.profile.weights||[]).some(x=>x&&x.w),page:"io",sel:'[onclick^="saveWeighIn"]'},
 {id:"scan", t:"Fotografa uno scontrino",done:()=>(((S.pantry||{}).items)||[]).length>0,page:"piano",sel:'[onclick="scontrinoScan()"]'},
 {id:"drive",t:tr("Attiva il backup su Drive"),done:()=>!!(S.drive&&S.drive.on),page:"sistema",sel:'[onclick="driveConnect()"]'}];
function guideActive(){
  if(!S.onboard.done)return false;
  if(S.ui&&S.ui.guidaOff)return false;
  if(guideState().hide)return false;
  if(GUIDE_STEPS.every(x=>x.done()))return false;
  return guideDays()<=14;}
window.guideLand=(page,seltxt)=>{
  const sel=seltxt.replace(/&quot;/g,'"');
  show(page);
  setTimeout(()=>{try{
    const el=document.querySelector("#pg-"+page+" "+sel);if(!el)return;
    (el.closest(".card")||el).scrollIntoView({block:"start",behavior:"smooth"});
    el.classList.add("faro");setTimeout(()=>el.classList.remove("faro"),4500);
  }catch(e){}},380);};
window.guideHide=()=>{guideState().hide=1;save();render(cur);};
function guideCardHTML(){
  if(!guideActive())return "";
  const fatti=GUIDE_STEPS.filter(x=>x.done()).length;
  return `<div class="card"><h2>Primi passi <span style="font-weight:600;color:var(--grigio);font-size:13px">${fatti}/5</span></h2>
  <div class="glist">
   ${GUIDE_STEPS.map(x=>{const ok=x.done();
     const sel=x.sel.replace(/"/g,"&quot;").replace(/'/g,"\\'");
     return `<button class="grow gstep ${ok?"on fatta":""}" onclick="guideLand('${x.page}','${sel}')">
       <div class="gl"><b>${ok?"✓ ":""}${esc(x.t)}</b></div>
       <div class="gc"><span class="glink">${ok?"Fatto":"Vai ›"}</span></div></button>`;}).join("")}
  </div>
  <div style="text-align:right;margin-top:4px"><button class="glink" onclick="guideHide()">Nascondi</button></div></div>`;}
/* ── Suggerimenti una-tantum ─────────────────────────────────────
   Piccole bolle ancorate all'elemento, mostrate UNA volta nella vita
   al primo incontro con un gesto non ovvio. Una sola per visita, mai
   insieme al faro, si chiudono con un tocco ovunque. */
const GUIDE_TIPS=[
 {id:"ricetta", page:"piano", sel:".mname",
  t:"Tocca il titolo di un pasto per vederne la ricetta o modificarlo."},
 {id:"fame", page:"oggi", sel:".hungry", when:()=>guideAnyCheck(),
  t:"Dopo la spunta, di' che fame avevi: serve a tarare i pasti su di te."},
 {id:"ribilancia", page:"punto", sel:'[onclick="rebalance()"]',
  t:"Sei oltre? Nessun dramma: Ribilancia alleggerisce solo i pasti che restano."},
 {id:"assistente", page:"punto", sel:"#askFab", fisso:1,
  t:"Questo cerchio apre l'assistente: scegli dall'elenco o scrivi con parole tue."},
 {id:"whatsapp", page:"spesa", sel:'[onclick="waShop()"]',
  t:"La lista si manda su WhatsApp con un tocco: comoda per chi fa la spesa per te."},
 {id:"archivio", page:"storico", sel:"#pg-storico h2",
  t:"Le settimane si archiviano da sole a fine domenica, e restano modificabili."}];
window.tipClose=(id)=>{
  const o=document.getElementById("tipOv");if(o)o.remove();
  if(id){S.guide=S.guide||{};S.guide.seen=S.guide.seen||{};S.guide.seen[id]=1;save();}};
function tipApply(p){
  tipClose();
  if(!S.onboard.done||(S.ui&&S.ui.guidaOff))return;
  if(document.querySelector(".faro"))return;        /* una guida alla volta */
  S.guide=S.guide||{};const seen=S.guide.seen||{};
  const tip=GUIDE_TIPS.find(x=>x.page===p&&!seen[x.id]&&(!x.when||x.when()));
  if(!tip)return;
  const el=tip.fisso?document.querySelector(tip.sel):document.querySelector("#pg-"+p+" "+tip.sel);
  if(!el)return;
  const r=el.getBoundingClientRect();
  const o=document.createElement("div");o.id="tipOv";
  o.innerHTML=esc(tip.t)+"<small>Tocca per chiudere</small>";
  document.body.appendChild(o);
  const su=r.top>window.innerHeight*0.62;          /* elemento in basso → bolla sopra */
  if(su)o.classList.add("up");
  const top=su?(r.top+window.scrollY-o.offsetHeight-10):(r.bottom+window.scrollY+10);
  const left=Math.max(10,Math.min(r.left+window.scrollX,window.innerWidth-o.offsetWidth-10));
  o.style.top=top+"px";o.style.left=left+"px";
  const ax=Math.max(14,Math.min(o.offsetWidth-22,(r.left+r.width/2+window.scrollX)-left-7));
  o.style.setProperty("--ax",ax+"px");
  o.onclick=()=>tipClose(tip.id);
  setTimeout(()=>{document.addEventListener("click",function h(e){
    if(e.target.closest&&e.target.closest("#tipOv"))return;
    document.removeEventListener("click",h);tipClose(tip.id);},{once:false});},50);}
function faroApply(p){
  document.querySelectorAll(".faro").forEach(e=>e.classList.remove("faro"));
  if(!guideActive())return;
  const x=GUIDE_STEPS.find(x=>!x.done());
  if(!x||x.page!==p)return;
  const el=document.querySelector("#pg-"+p+" "+x.sel);
  if(el)el.classList.add("faro");}
/* ═══ CHIAVI DINAMICHE ════════════════════════════════════════════════
   Alcune frasi arrivano a tr() dentro una variabile — i nomi degli
   esercizi, le stagioni, le cause della fame nervosa, le domande del
   racconto — quindi una ricerca testuale nel codice non le trova e il
   collaudo delle traduzioni le scambierebbe per voci orfane.
   La lista NON si tiene più a mano: la costruisce l'app leggendo le
   proprie strutture, così aggiungendo un esercizio o una stagione la
   verifica si aggiorna da sola. Serve solo al collaudo. */
window.i18nDinamiche=function(){
  const fuori=[];
  const agg=x=>{if(typeof x==="string"&&x.trim())fuori.push(x);};
  /* dalle strutture vive dell'app */
  try{ESERCIZI.forEach(e=>{agg(e.n);agg(e.g);});}catch(e){}
  try{(typeof STRETCH!=="undefined"?STRETCH:[]).forEach(e=>{agg(e.n);agg(e.g);});}catch(e){}
  try{RACC_DOMANDE.forEach(x=>{agg(x.q);agg(x.es);});}catch(e){}
  try{SENSO.forEach(x=>{agg(x.q);agg(x.ph);});}catch(e){}
  try{TRIG_FISSI.forEach(agg);}catch(e){}
  /* le frasi degli stati vuoti: vivono nel catalogo VUOTI e arrivano a
     tr() dentro vuoto(), cioè da una variabile — invisibili a una
     ricerca testuale, in entrambe le direzioni */
  try{vuotiFrasi().forEach(agg);}catch(e){}
  try{tonoFrasi().forEach(agg);}catch(e){}
  try{giocoFrasi().forEach(agg);}catch(e){}
  try{contoFrasi().forEach(agg);}catch(e){}
  try{dispensaFrasi().forEach(agg);}catch(e){}
  try{consensiFrasi().forEach(agg);}catch(e){}
  /* le etichette delle tradizioni culinarie: arrivano a tr() da CUCINE,
     quindi una ricerca nel codice le prenderebbe per orfane */
  try{CUCINE.forEach(c=>agg(c[1]));}catch(e){}
  /* gli stati vuoti della pagina Io: le frasi arrivano a tr() da
     vuoto(), cioè da variabili — senza questo risulterebbero orfane */
  try{["dati","permessi"].forEach(k=>{
    const html=IO_VUOTI[k];void html;});}catch(e){}
  /* le voci del menu ⋯: etichette in variabile, tradotte nel punto
     d'uso — senza registro risulterebbero orfane */
  try{ALTRE.forEach(v=>agg(v[1]));}catch(e){}
  /* giorni e fasce: arrivano a tr() da giorno()/fascia(), cioè da una
     variabile — una ricerca nel codice li darebbe per orfani */
  ["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica",
   "Colazione","Metà mattina","Pranzo","Metà pomeriggio","Tardo pomeriggio",
   "Cena","Dopo cena","Spuntino","Intensità bassa","Intensità media",
   "Intensità alta"].forEach(agg);
  /* i vincoli religiosi: etichette tradotte, valori salvati in italiano */
  try{REL_LIST.forEach(agg);}catch(e){}
  try{PLICHE.forEach(x=>agg(x[1]));}catch(e){}
  try{CIRCONF.forEach(x=>agg(x[1]));}catch(e){}
  try{["primavera","estate","autunno","inverno"].forEach(st=>{
    agg(st);agg(seasonLabel(st));agg(seasonLabel(st).toLowerCase());});}catch(e){}
  /* etichette passate a tr() da una variabile e non ricavabili altrove */
  ["periodi rimossi","pesate rimosse","settimane archiviate rimosse","eventi rimossi",
   "spunte azzerate","extra rimossi","allenamenti rimossi",
   "periodo in deficit","periodo libero","lavoro","festa","abitudine",
   "nome","sesso","data di nascita","altezza","peso","peso obiettivo","allenamento",
   "cosa non mangi","Massa grassa","Massa magra","Acqua corporea","Metabolismo misurato",
   "Come stai","frase","ho {n} mele"].forEach(agg);
  return [...new Set(fuori)];};
function render(p){
  /* Ridisegnare una pagina non deve spegnere l'indicatore: il lavoro in
     sottofondo continua anche se cambi scheda o torni all'app dopo. */
  setTimeout(()=>{const e=document.getElementById("aiSpin");
    if(e)e.classList.toggle("on",AIBUSY>0);},0);
  /* ═══ PERCHÉ QUI SI CERCA PER NOME ═══════════════════════════════
     DIFETTO TROVATO IN PRODUZIONE il 19/08/2026, sul telefono del
     founder: «renderInsieme is not defined», e l'app non partiva
     PIÙ SU NESSUNA PAGINA.

     La causa: questa mappa scritta con gli identificatori diretti
     (`insieme:renderInsieme`) li valuta TUTTI nel momento in cui
     l'oggetto viene creato. Basta che UNO dei moduli non sia ancora
     stato caricato — e l'avvio parte prima che finiscano tutti — e
     l'errore fa saltare qualunque pagina, anche quelle che non
     c'entrano niente. Nel monolite l'ordine di caricamento era
     fortunato; nella consegna a file separati no.

     Con la ricerca per nome su window, una funzione mancante rende
     vuota una sola pagina invece di rompere tutta l'app: un guasto
     che resta piccolo invece di allargarsi. */
  const NOMI={punto:"renderPunto",oggi:"renderOggi",piano:"renderPiano",
    spesa:"renderSpesa",sport:"renderSport",comestai:"renderComeStai",
    storico:"renderStorico",mia:"renderMia",insieme:"renderInsieme",
    io:"renderIo",ruota:"renderRuota",conto:"renderConto",costellazione:"renderCostellazione",sistema:"renderSistema",regole:"renderRegole",
    tools:"renderTools",benvenuto:"renderBenvenuto",onb2:"renderOnb2",
    piani:"renderPiani",guida:"renderGuida",nuvia:"renderNuvia",
    setup:"renderSetup"};
  const nome=NOMI[p];
  const fn=nome?window[nome]:null;
  if(typeof fn!=="function")return;
  safeRender(p,fn);
  setTimeout(()=>{try{faroApply(p);tipApply(p);a11yLega(p);
    if(typeof filaIconeSegna==="function")filaIconeSegna();}catch(e){}},90);}

/* ── ACCESSIBILITÀ: l'etichetta parla al suo campo ───────────────────
   Nell'app le etichette stanno accanto al campo ma non erano collegate:
   uno screen reader leggeva «casella di riepilogo» senza dire di cosa.
   Invece di ritoccare 70 punti a mano, il collegamento si fa qui dopo
   ogni disegno — e vale anche per il markup che verrà. */
/* Chi naviga da tastiera (o con lo switch) deve restare dentro il dialogo
   finché non lo chiude, e ritrovare il punto di partenza all'uscita. */
function focusTrap(box){
  if(!box)return ()=>{};
  const prima=document.activeElement;
  const sel='button,[href],input:not([type=hidden]),select,textarea,[tabindex]:not([tabindex="-1"])';
  const primo=()=>[...box.querySelectorAll(sel)].filter(e=>e.offsetParent!==null||e===document.activeElement);
  setTimeout(()=>{const f=primo();if(f.length)f[0].focus();},30);
  const onKey=(e)=>{
    if(e.key!=="Tab")return;
    const f=primo();if(!f.length)return;
    const a=f[0],z=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}
    else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}
  };
  box.addEventListener("keydown",onKey);
  return ()=>{box.removeEventListener("keydown",onKey);
    try{if(prima&&prima.focus)prima.focus();}catch(e){}};}
function a11yLega(p){
  const root=document.getElementById("pg-"+p)||document;
  root.querySelectorAll("label:not([for])").forEach(lab=>{
    if(lab.querySelector("input,select,textarea"))return;      /* etichetta che avvolge: già a posto */
    let el=lab.nextElementSibling;
    let hop=0;
    while(el&&hop<3&&!/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)){
      const dentro=el.querySelector&&el.querySelector("input,select,textarea");
      if(dentro){el=dentro;break;}
      el=el.nextElementSibling;hop++;
    }
    if(!el||!/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName))return;
    const testo=(lab.textContent||"").trim();
    if(!testo)return;
    if(el.id){lab.setAttribute("for",el.id);}
    else if(!el.getAttribute("aria-label")){el.setAttribute("aria-label",testo);}
  });
  /* In Regole i campi vivono in tabella: il nome sta nella prima cella
     della riga, non in un <label>. Per lo screen reader vale lo stesso. */
  root.querySelectorAll("table tr").forEach(tr=>{
    const celle=tr.querySelectorAll("td,th");
    if(celle.length<2)return;
    const nome=(celle[0].textContent||"").trim().replace(/\s+/g," ").slice(0,60);
    if(!nome)return;
    tr.querySelectorAll("input,select,textarea").forEach(el=>{
      if(el.type==="hidden")return;
      if(el.getAttribute("aria-label")||el.closest("label"))return;
      if(el.id&&root.querySelector('label[for="'+el.id+'"]'))return;
      el.setAttribute("aria-label",nome);
    });
  });}

/* ═══════════════════════════════════════════════════════════════
   FX ENGINE — reveal allo scroll, header dinamico, zoom grafici.
   Rispetta prefers-reduced-motion (le animazioni CSS si spengono
   da sole; qui evitiamo anche di nascondere gli elementi).
   ═══════════════════════════════════════════════════════════════ */
const REDUCED=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/* Al primo avvio dopo l'aggiornamento la cache qualità può essere vuota:
   la riempiamo in sottofondo, senza toccare l'esperienza. */
setTimeout(()=>{try{qPlanPrecompute();
/* La proposta del ciclo: si affaccia dopo che l'app si è accesa, una
   volta sola, e solo se ha davvero imparato il ritmo. Mai all'apertura
   secca: la prima cosa che vedi aprendo l'app non può essere una
   domanda sul tuo corpo. */
/* La pausa si controlla all'avvio: se sono passati tre giorni muti
   si apre da sola, e se la persona è tornata si chiude. */
setTimeout(()=>{try{if(typeof pausaControlla==="function")pausaControlla();}catch(e){}},1800);
setTimeout(()=>{try{if(typeof cicloProponi==="function")cicloProponi();}catch(e){}},4200);}catch(e){}},4000);
let _rvObs=null;
/* v5.1: header fisso (niente listener di scroll che ridisegna l'intestazione) */
/* ── ZOOM GRAFICI: tap su un grafico → overlay con pinch/rotella/drag ── */
let ZM={s:1,x:0,y:0,drag:null,pinch:0};
function ensureZoomOv(){
  let ov=document.getElementById("zoomOv");
  if(ov)return ov;
  ov=document.createElement("div");ov.id="zoomOv";
  ov.innerHTML=`<div class="zhint"> ${tr("Rotella / pinch per zoom · trascina per muoverti · doppio tap per resettare")}</div>
  <img id="zoomImg" alt="grafico ingrandito">
  <div class="ztools">
    <button onclick="zoomBy(1.35)" title="Zoom +">＋</button>
    <button onclick="zoomBy(1/1.35)" title="Zoom −">－</button>
    <button onclick="zoomReset()" title="Reimposta">⤾</button>
    <button onclick="closeZoom()" title="${tr("Chiudi")}">✕</button></div>`;
  document.body.appendChild(ov);
  ov.addEventListener("click",e=>{if(e.target===ov)closeZoom();});
  const img=ov.querySelector("#zoomImg");
  ov.addEventListener("wheel",e=>{e.preventDefault();zoomBy(e.deltaY<0?1.18:1/1.18);},{passive:false});
  img.addEventListener("pointerdown",e=>{e.preventDefault();ZM.drag={x:e.clientX-ZM.x,y:e.clientY-ZM.y};img.setPointerCapture(e.pointerId);img.style.cursor="grabbing";});
  img.addEventListener("pointermove",e=>{if(!ZM.drag)return;ZM.x=e.clientX-ZM.drag.x;ZM.y=e.clientY-ZM.drag.y;applyZoom();});
  img.addEventListener("pointerup",()=>{ZM.drag=null;img.style.cursor="grab";});
  img.addEventListener("dblclick",zoomReset);
  let lastTap=0;
  img.addEventListener("touchend",e=>{const now=Date.now();if(now-lastTap<300)zoomReset();lastTap=now;});
  ov.addEventListener("touchmove",e=>{ // pinch a due dita
    if(e.touches.length===2){e.preventDefault();
      const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
      if(ZM.pinch)zoomBy(d/ZM.pinch,true);
      ZM.pinch=d;}
  },{passive:false});
  ov.addEventListener("touchend",()=>{ZM.pinch=0;});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeZoom();});
  return ov;
}
function applyZoom(){const img=document.getElementById("zoomImg");
  if(img)img.style.transform=`translate(${ZM.x}px,${ZM.y}px) scale(${ZM.s})`;}
window.zoomBy=(f,raw)=>{ZM.s=Math.max(.5,Math.min(8,ZM.s*(raw?f:f)));applyZoom();};
window.zoomReset=()=>{ZM={s:1,x:0,y:0,drag:null,pinch:0};applyZoom();};
window.closeZoom=()=>{const ov=document.getElementById("zoomOv");if(ov)ov.classList.remove("on");};
window.openZoom=(dataURL)=>{const ov=ensureZoomOv();
  ov.querySelector("#zoomImg").src=dataURL;zoomReset();ov.classList.add("on");};
document.addEventListener("click",e=>{
  const c=e.target.closest&&e.target.closest("canvas");
  if(!c)return;
  if(c.id==="scanreader"||c.closest("#scanbox"))return; // non lo scanner
  try{openZoom(c.toDataURL("image/png"));}catch(_){/* canvas non esportabile: ignora */}
});
/* ═══ AGGIORNAMENTO AUTOMATICO ══════════════════════════════════════
   L'app è un singolo file servito via HTTP: all'avvio scarichiamo la copia
   fresca dal server (bypassando la cache) e confrontiamo la versione.
   Se ce n'è una più nuova: primo tentativo = ricarica automatica silenziosa;
   se la cache resiste, la nuova pagina viene applicata direttamente dal testo
   appena scaricato. L'utente non deve fare niente. */
function cmpVer(a,b){const pa=String(a).split(".").map(Number),pb=String(b).split(".").map(Number);
  for(let i=0;i<Math.max(pa.length,pb.length);i++){const d=(pa[i]||0)-(pb[i]||0);if(d)return d;}return 0;}
async function checkAppUpdate(){
  try{
    if(location.protocol!=="http:"&&location.protocol!=="https:")return;
    const url=location.href.split("#")[0];
    const r=await fetch(url,{cache:"no-store"});
    if(!r.ok)return;
    const t=await r.text();
    const m=t.match(/APP_VER\s*=\s*"([\d.]+)"/);
    if(!m||cmpVer(m[1],APP_VER)<=0)return;
    const remote=m[1];
    const k="nutryUpd_"+remote;
    if(!sessionStorage.getItem(k)){
      sessionStorage.setItem(k,"1");
      toast(tr("Nuova versione {v}: aggiorno Nuvia…",{v:remote}));
      setTimeout(()=>location.reload(),800);
      return;
    }
    /* la ricarica non è bastata (cache ostinata): applichiamo direttamente
       l'HTML appena scaricato — i dati in localStorage restano intatti */
    if(await dlgConfirm(tr("È disponibile Nuvia {nuova} (stai usando la {attuale}).\n\nAggiorno adesso? I tuoi dati restano al loro posto.",{nuova:remote,attuale:APP_VER}))){
      try{document.open();document.write(t);document.close();}
      catch(e){location.reload();}
    }
  }catch(_){}
}
setTimeout(checkAppUpdate,1200);
/* Pulizia: rimuove un eventuale service worker registrato dal vecchio
   esperimento (causava doppio download delle librerie = lentezza). Non ne
   registriamo uno nuovo: niente offline, niente file separato. */
(function(){
  try{
    if("serviceWorker" in navigator)navigator.serviceWorker.getRegistrations().then(regs=>regs.forEach(r=>r.unregister())).catch(()=>{});
    if(window.caches&&caches.keys)caches.keys().then(keys=>keys.forEach(k=>caches.delete(k))).catch(()=>{});
  }catch(e){}
})();
/* Manifest per "Aggiungi a schermata Home / Installa": generato qui dentro,
   tutto in un file solo, senza service worker (che dal 2021 Chrome non
   richiede più per l'installazione). Icone incorporate come immagini,
   nessun file esterno da mantenere. */
(function(){
  try{
    const ICON192="data:image/png;base64,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";
    const ICON512="data:image/png;base64,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";
    const man={name:"Nuvia",short_name:"Nuvia",display:"standalone",
      start_url:location.href.split("#")[0],scope:location.href.replace(/[^/]*$/,""),
      background_color:"#FFFFFF",theme_color:"#FFFFFF",
      icons:[
        {src:ICON192,sizes:"192x192",type:"image/png",purpose:"any"},
        {src:ICON192,sizes:"192x192",type:"image/png",purpose:"maskable"},
        {src:ICON512,sizes:"512x512",type:"image/png",purpose:"any"},
        {src:ICON512,sizes:"512x512",type:"image/png",purpose:"maskable"}
      ]};
    man.id=man.start_url;   /* identità stabile: aiuta Chrome a installare l'app vera */
    /* SCELTA DI PRODOTTO (Alberto): tutto in un solo file, nessun asset
       esterno. Il manifest vive in un Blob dentro la pagina: Chrome lo
       accetta per "Aggiungi a schermata Home" (icona nostra, dal manifest),
       ma il pacchetto-app "WebAPK" senza badge non può nascere, perché il
       server di Google dovrebbe scaricare manifest e icone da un URL reale
       e un Blob da fuori non è raggiungibile. Limite di piattaforma
       accettato consapevolmente in cambio del file unico. */
    const l=document.createElement("link");l.rel="manifest";
    l.href=URL.createObjectURL(new Blob([JSON.stringify(man)],{type:"application/manifest+json"}));
    document.head.appendChild(l);
    /* fallback icona per iOS e per i launcher che ignorano il manifest */
    const at=document.createElement("link");at.rel="apple-touch-icon";at.href=ICON192;
    document.head.appendChild(at);
  }catch(e){}
})();
/* Prompt d'installazione automatico: quando il browser segnala che l'app è
   installabile mostriamo un banner "Installa". */
(function(){
  let deferredPrompt=null;
  const KEY_DISMISS="nutri_install_dismiss";
  function isStandalone(){return (window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches)||window.navigator.standalone===true;}
  function showBanner(){
    if(isStandalone())return;
    if(document.getElementById("install-banner"))return;
    if(!document.body){document.addEventListener("DOMContentLoaded",showBanner);return;}
    const b=document.createElement("div");
    b.id="install-banner";
    b.className="ibanner";
    b.style.cssText="position:fixed;left:12px;right:12px;bottom:calc(78px + env(safe-area-inset-bottom));z-index:9999;background:var(--card,#fff);color:var(--ink,#0D2422);border:1px solid var(--linea,#E3EAE8);border-radius:20px;padding:12px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 16px 38px -16px rgba(10,78,73,.35);font-family:inherit;touch-action:pan-y;transition:transform .2s cubic-bezier(.22,1,.36,1),opacity .2s;";
    /* scorri di lato per toglierlo, come per i promemoria */
    (function(){let x0=0,y0=0,mv=false;
      b.addEventListener("touchstart",e=>{x0=e.touches[0].clientX;y0=e.touches[0].clientY;mv=false;},{passive:true});
      b.addEventListener("touchmove",e=>{
        const dx=e.touches[0].clientX-x0,dy=e.touches[0].clientY-y0;
        if(Math.abs(dx)<Math.abs(dy))return;mv=true;
        b.style.transform="translateX("+dx+"px)";b.style.opacity=String(Math.max(.2,1-Math.abs(dx)/240));},{passive:true});
      b.addEventListener("touchend",e=>{
        if(!mv)return;
        const dx=e.changedTouches[0].clientX-x0;
        if(Math.abs(dx)>90){try{localStorage.setItem(KEY_DISMISS,"1");}catch(_){}
          b.style.transform="translateX("+(dx>0?"110%":"-110%")+")";b.style.opacity="0";
          setTimeout(()=>b.remove(),200);}
        else{b.style.transform="";b.style.opacity="";}},{passive:true});
    })();
    b.innerHTML='<img alt="" src="data:image/png;base64,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" style="width:42px;height:42px;border-radius:12px;border:1px solid var(--linea,#E3EAE8);flex:0 0 auto">'+
      '<div style="flex:1;font-size:13px;line-height:1.35"><b style="color:var(--bosco,#0A4E49)">Aggiungi Nuvia alla Home</b><br><span style="color:var(--grigio,#68807C);font-size:13px">Il suo logo sulla schermata Home, si apre a un tocco.</span></div>'+
      '<button id="install-yes" style="background:var(--card,#FFFFFF);color:var(--bosco,#0A4E49);border:1.5px solid var(--azione,#0C7C74);border-radius:12px;padding:8px 16px;font-weight:700;font-size:13px;cursor:pointer">Installa</button>'+
      '<button id="install-no" aria-label="Chiudi" style="background:transparent;color:var(--grigio,#68807C);border:0;font-size:18px;cursor:pointer;padding:4px 8px">✕</button>';
    document.body.appendChild(b);
    document.getElementById("install-no").onclick=()=>{try{localStorage.setItem(KEY_DISMISS,String(Date.now()));}catch(e){}b.remove();};
    document.getElementById("install-yes").onclick=async()=>{
      if(deferredPrompt){b.remove();deferredPrompt.prompt();try{await deferredPrompt.userChoice;}catch(e){}deferredPrompt=null;}
      else{dlgAlert(tr('Per installare: apri il menu del browser (⋮) e scegli "Installa app" oppure "Aggiungi a schermata Home".'));}
    };
  }
  window.addEventListener("beforeinstallprompt",function(e){
    e.preventDefault();deferredPrompt=e;
    let dis=0;try{dis=+localStorage.getItem(KEY_DISMISS)||0;}catch(e2){}
    if(Date.now()-dis>7*24*3600*1000)showBanner();
  });
  window.addEventListener("appinstalled",function(){const b=document.getElementById("install-banner");if(b)b.remove();deferredPrompt=null;try{localStorage.removeItem(KEY_DISMISS);}catch(e){}});
})();
/* Caricamento su Drive anche quando esci dall'app: così il ritardo non
   diventa un rischio di perdere l'ultima mezz'ora di lavoro. */
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")driveFlush();});
window.addEventListener("pagehide",driveFlush);
/* Qualsiasi errore non gestito diventa visibile invece di lasciare
   una schermata bianca. */
window.addEventListener("error",function(ev){
  try{
    if(document.querySelector(".page.active")&&document.querySelector(".page.active").innerHTML.trim())return;
    const el=document.querySelector(".page.active")||document.getElementById("pg-oggi");
    if(el&&!el.innerHTML.trim())el.innerHTML=errorCardHTML(cur||"avvio",ev.error||ev.message);
  }catch(_){}
});
/* Avvio protetto: se qualcosa esplode, l'app resta comunque utilizzabile
   e mostra come recuperare. */
(function boot(){
  try{snapSave("giornaliera");}catch(e){}
  try{telTouch();}catch(e){}
  try{setTimeout(()=>{try{telSend();}catch(e){}},4000);}catch(e){}
  try{applyTheme();}catch(e){}
  try{bumpStreak();}catch(e){}
  try{traguardiControlla();}catch(e){}
  /* La Ruota si accende DA SOLA: qui all'avvio e, sotto, dopo ogni
     salvataggio. Regola del founder (22/08): nessun gesto in più —
     se una runa richiedesse un tocco per accendersi, sarebbe una
     missione da accettare, cioè esattamente ciò che non facciamo. */
  try{ruotaControlla();}catch(e){}
  try{setTimeout(()=>{try{contoAggiorna().then(()=>{try{prescrizioneApplica();render(cur);}catch(e){}});}catch(e){}},1500);}catch(e){}
  try{setTimeout(()=>{try{pianiCarica();}catch(e){}},2500);}catch(e){}
  try{cobrandApplica();}catch(e){}
  /* Chi ha uno studio: si rimanda il riassunto (così l'operatore non
     vede numeri di tre giorni fa) e si rileggono gli accessi. */
  try{setTimeout(()=>{try{if(haStudio()){condividiOra();accessiAggiorna();}}catch(e){}},3500);}catch(e){}
  try{renderHeader();}catch(e){}
  try{tryDriveAuto();}catch(e){}
  let start="oggi";
  try{/* Si apre SEMPRE sul Punto: è la pagina che dice come stai e cosa ti
       aspetta. Da lì si passa a Oggi con un tocco. */
    start=S.onboard.done?(S.profile.dob?"punto":"io"):(onb2Attivo()?"onb2":"benvenuto");
    /* L'UNICA eccezione: chi si è composto la sua pagina E ha chiesto
       di aprirla per prima. Due condizioni esplicite, non una
       preferenza dedotta: cambiare il punto di partenza di un'app è
       la cosa che più disorienta, e si fa solo se richiesto. */
    if(start==="punto"&&typeof mia==="function"){
      const d=mia();
      if(d&&d.attiva&&d.prima&&d.pezzi.length)start="mia";}
  }catch(e){}
  try{show(start);}
  catch(e){
    try{
      const el=document.getElementById("pg-oggi");
      if(el){el.classList.add("active");el.innerHTML=errorCardHTML("avvio",e);}
    }catch(_){
      document.body.innerHTML='<div style="padding:24px;font-family:system-ui">'+
        '<h2>Nuvia non è riuscita a partire</h2><p>I dati sono ancora sul dispositivo.</p>'+
        '<p><a href="javascript:location.reload()">Ricarica</a></p></div>';}
  }
  try{if(weekStale())autoCloseStaleWeeks().then(()=>{renderHeader();render(cur);}).catch(()=>{});}catch(e){}
})();

/* ══ S-D · SCHELETRI, SPUNTA E FOGLIO TRASCINABILE ═════════════════
   Il movimento non è decorazione: è la risposta dell'app al dito.
   Tre utensili, usabili da qualunque modulo. */

/* Lo scheletro di attesa. Chi aspetta un piano vede la forma di un
   piano, non una rotella: l'attesa percepita si dimezza e si capisce
   che cosa sta arrivando. Se le animazioni sono spente, il CSS non
   ondeggia e resta una forma grigia ferma — corretta comunque. */
function scheletro(righe,card){
  const n=Math.max(1,Math.min(8,+righe||3));
  let h=card===false?"":'<div class="skel-card">';
  for(let i=0;i<n;i++){
    const cl=i===0?"media":(i===n-1?"corta":"");
    h+='<div class="skel skel-r '+cl+'"></div>';}
  return h+(card===false?"":'</div>');}
function scheletroIn(id,righe){
  const el=typeof id==="string"?document.getElementById(id):id;
  if(!el)return null;
  const prima=el.innerHTML;
  el.innerHTML=scheletro(righe);
  el.setAttribute("aria-busy","true");
  /* Restituisce come si torna indietro: chi lo apre lo chiude. */
  return ()=>{el.innerHTML=prima;el.removeAttribute("aria-busy");};}

/* La conferma di un gesto: micro-rimbalzo + un colpetto di vibrazione
   dove esiste. Si toglie la classe alla fine, altrimenti la seconda
   spunta sullo stesso elemento non animerebbe più. */
function conferma(el,ms){
  const e=typeof el==="string"?document.getElementById(el):el;
  if(!e)return;
  e.classList.remove("pulsa");
  void e.offsetWidth;   /* void: lettura VOLUTA, forza il riavvio */                      /* letto per forzare il riavvio dell'animazione */
  e.classList.add("pulsa");
  setTimeout(()=>e.classList.remove("pulsa"),300);
  try{if(typeof vibra==="function")vibra(ms||12);}catch(err){}}

/* Il foglio che si trascina. Mentre il dito scende NON c'è
   transizione (inseguirebbe il dito in ritardo, ed è la differenza
   fra "nativo" e "sito web"). Oltre un quarto dell'altezza o con un
   gesto veloce si chiude; altrimenti torna su. */
function foglioTrascinabile(foglio,chiudi){
  const f=typeof foglio==="string"?document.getElementById(foglio):foglio;
  if(!f||f._drag)return;
  f._drag=true;
  let y0=null,t0=0,dy=0,h=0;
  const giu=e=>{
    const p=e.touches?e.touches[0]:e;
    y0=p.clientY;t0=Date.now();dy=0;h=f.offsetHeight||1;
    f.classList.add("sheet-drag");};
  const muovi=e=>{
    if(y0===null)return;
    const p=e.touches?e.touches[0]:e;
    dy=Math.max(0,p.clientY-y0);                 /* solo verso il basso */
    f.style.transform="translateY("+dy+"px)";
    if(dy>4&&e.cancelable)e.preventDefault();};  /* non trascinare la pagina */
  const su=()=>{
    if(y0===null)return;
    const veloce=(dy/Math.max(1,Date.now()-t0))>0.5;
    f.classList.remove("sheet-drag");
    f.style.transform="";
    y0=null;
    if(dy>h*0.25||veloce){try{chiudi&&chiudi();}catch(e){}}};
  const man=f.querySelector(".sheet-maniglia")||f;
  man.addEventListener("touchstart",giu,{passive:true});
  man.addEventListener("touchmove",muovi,{passive:false});
  man.addEventListener("touchend",su);
  man.addEventListener("mousedown",giu);
  window.addEventListener("mousemove",muovi);
  window.addEventListener("mouseup",su);}

window.scheletro=scheletro;window.scheletroIn=scheletroIn;
window.conferma=conferma;window.foglioTrascinabile=foglioTrascinabile;
