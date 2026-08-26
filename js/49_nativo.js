/* ═══════════════════════════════════════════════════════════════
   49. IL GUSCIO NATIVO — quello che si può fare solo negli store
   ═══════════════════════════════════════════════════════════════
   La stessa app gira in tre posti: browser, schermata home (PWA) e
   store. Questo modulo è l'unico che sa in quale dei tre si trova,
   e accende SOLO quello che esiste lì.

   LA REGOLA: una funzione che non c'è non viene chiamata. Niente
   bottoni morti, niente errori in console, niente «funziona solo
   sull'app». Sul web tutto resta esattamente come oggi.

   COSA SI GUADAGNA NEGLI STORE:
   · il tasto INDIETRO di Android che si comporta come deve — senza,
     la prima cosa che fa un utente Android è uscire dall'app per
     sbaglio, e la recensione a una stella è già scritta;
   · la barra di stato coi nostri colori invece che bianca;
   · la condivisione di sistema (il «film del mese» avrà bisogno
     proprio di questa);
   · le notifiche VERE, che è poi il motivo per cui si va negli
     store: il motore gentile di P-3 esiste già e aspetta solo un
     canale che funzioni anche ad app chiusa.

   Niente di tutto questo cambia una riga del resto dell'app.       */

/* ── dove stiamo girando ──────────────────────────────────────── */
function dentroApp(){
  try{
    const C=window.Capacitor;
    return !!(C&&typeof C.isNativePlatform==="function"&&C.isNativePlatform());
  }catch(e){return false;}}
window.dentroApp=dentroApp;

function piattaforma(){
  try{
    const C=window.Capacitor;
    if(C&&typeof C.getPlatform==="function")return C.getPlatform();
  }catch(e){}
  /* installata dalla schermata home ma senza guscio: è una PWA */
  try{
    if(window.matchMedia&&matchMedia("(display-mode: standalone)").matches)return "pwa";
  }catch(e){}
  return "web";}
window.piattaforma=piattaforma;

/* Un plugin si usa solo se c'è. Questa funzione è l'unico posto in
   cui si guarda dentro Capacitor: se un giorno cambia l'API, si
   corregge qui e basta. */
function plugin(nome){
  try{
    const C=window.Capacitor;
    const p=C&&C.Plugins&&C.Plugins[nome];
    return p||null;
  }catch(e){return null;}}
window.plugin=plugin;

/* ── il tasto indietro di Android ─────────────────────────────── */
/* Senza questo, «indietro» chiude l'app anche se sei in fondo a una
   sottopagina: è il difetto che più fa disinstallare un'app Android.
   La regola giusta: prima si chiudono i pannelli aperti, poi si
   torna alla scheda principale, e solo dall'inizio si esce. */
function legaTastoIndietro(){
  const App=plugin("App");
  if(!App||typeof App.addListener!=="function")return;
  App.addListener("backButton",()=>{
    /* 1 · un pannello aperto? si chiude quello */
    const foglio=document.getElementById("uiSheet");
    if(foglio&&!foglio.hidden){try{sheetClose();}catch(e){}return;}
    const altre=document.getElementById("moreSheet");
    if(altre&&!altre.hidden){try{moreClose();}catch(e){}return;}
    /* 2 · una finestra di dialogo? si annulla */
    const dlg=document.querySelector(".dlg-bg");
    if(dlg){const ko=document.querySelector(".dlg-ko")||document.querySelector(".dlg-ok");
      if(ko){ko.click();return;}}
    /* 3 · non sei sulla scheda principale? si torna indietro di UNA
       pagina, sulla stessa cronologia del browser: prima saltava
       direttamente a «punto», perdendo il punto di partenza. */
    if(typeof cur!=="undefined"&&cur!=="punto"){
      try{if(typeof tornaIndietro==="function")tornaIndietro();else show("punto");}catch(e){}return;}
    /* 4 · solo da qui si esce, e lo si chiede */
    if(typeof App.exitApp==="function")App.exitApp();});}

/* ── la barra di stato ────────────────────────────────────────── */
function tingiBarra(){
  const SB=plugin("StatusBar");
  if(!SB)return;
  try{
    const scuro=document.documentElement.getAttribute("data-theme")==="dark";
    if(typeof SB.setBackgroundColor==="function")
      SB.setBackgroundColor({color:scuro?"#0A1211":"#0C7C74"});
    if(typeof SB.setStyle==="function")
      SB.setStyle({style:"DARK"});   /* testo chiaro su fondo nostro */
  }catch(e){}}
window.tingiBarra=tingiBarra;

/* ── la condivisione di sistema ───────────────────────────────── */
/* Tre strade, in ordine di bellezza: il foglio nativo, quello del
   browser, la copia negli appunti. L'ultima funziona sempre. */
window.condividiTesto=async(titolo,testo)=>{
  const Share=plugin("Share");
  if(Share&&typeof Share.share==="function"){
    try{await Share.share({title:titolo,text:testo,dialogTitle:titolo});return true;}catch(e){}}
  if(navigator.share){
    try{await navigator.share({title:titolo,text:testo});return true;}catch(e){}}
  try{
    await navigator.clipboard.writeText(testo);
    toast(tr("Copiato: incollalo dove vuoi"));
    return true;
  }catch(e){return false;}};

/* ── le notifiche vere ────────────────────────────────────────── */
/* Il motore gentile di P-3 decide COSA e QUANDO; qui c'è solo il
   canale. Le regole non si toccano: si chiede il permesso una volta
   e si passa comunque da curaSiPuo(). */
window.notificheNativeChiedi=async()=>{
  const LN=plugin("LocalNotifications");
  if(!LN||typeof LN.requestPermissions!=="function")return false;
  try{
    const r=await LN.requestPermissions();
    return !!(r&&(r.display==="granted"||r.receive==="granted"));
  }catch(e){return false;}};

window.notificaNativa=async(titolo,corpo,quando)=>{
  const LN=plugin("LocalNotifications");
  if(!LN||typeof LN.schedule!=="function")return false;
  /* il testo passa dal controllo di tono come ogni altra notifica:
     il canale cambia, le regole no. */
  if(typeof curaTestoOk==="function"&&!curaTestoOk(titolo+" "+corpo).ok)return false;
  try{
    await LN.schedule({notifications:[{
      id:Date.now()%100000,
      title:String(titolo||"").slice(0,60),
      body:String(corpo||"").slice(0,140),
      schedule:quando?{at:new Date(quando)}:undefined,
      smallIcon:"ic_stat_nuvia"}]});
    return true;
  }catch(e){return false;}};

/* ── LA PROGRAMMAZIONE ────────────────────────────────────────────
   Il canale c'era, ma nessuno lo usava: una notifica che deve
   arrivare ad app CHIUSA va programmata PRIMA, mentre l'app è
   ancora aperta. È l'unico modo che ha una notifica locale di
   esistere: nessun server la manda, la mette in coda il telefono.

   Chi decide COSA e QUANDO resta il motore gentile di P-3. Qui
   c'è solo la messa in coda, e tre precauzioni:
   · si cancella sempre la coda precedente prima di riscrivere,
     o le notifiche si accumulano e arriva un temporale;
   · non si programma nulla dentro le ore di silenzio del turno;
   · ogni testo passa comunque dal controllo di tono.            */
const CODA_ID=7000;          /* un intervallo nostro, per non pestare altri */

window.notificheProgramma=async()=>{
  const LN=plugin("LocalNotifications");
  if(!LN||typeof LN.schedule!=="function")return false;
  if(!(S.notif&&S.notif.attive))return false;

  /* 1 · si pulisce: senza, ogni apertura aggiunge un altro strato */
  try{
    const pend=await LN.getPending();
    const nostre=((pend&&pend.notifications)||[]).filter(n=>+n.id>=CODA_ID&&+n.id<CODA_ID+100);
    if(nostre.length&&typeof LN.cancel==="function")await LN.cancel({notifications:nostre});
  }catch(e){}

  /* 2 · si raccoglie quello che il motore ha da dire, nell'ordine
        in cui conta: prima le cose che scadono. */
  const candidate=[];
  const prova=(fn,quando)=>{
    try{
      const m=(typeof window[fn]==="function")?window[fn](quando):null;
      if(m&&m.titolo)candidate.push({m,quando});
    }catch(e){}};

  const domani=new Date();domani.setDate(domani.getDate()+1);domani.setHours(9,0,0,0);
  prova("appuntamentoOra",domani);      /* un appuntamento dimenticato costa una visita */
  prova("fragileOra",domani);
  prova("pattoOra",domani);
  prova("duoOra",domani);
  prova("pausaMessaggio");

  if(!candidate.length)return true;      /* niente da dire: silenzio */

  /* 3 · si programma UNA cosa sola: due notifiche nello stesso
        giorno sono già troppe, e il motore lo sa. */
  const scelta=candidate[0];
  const quando=scelta.quando||domani;
  if(typeof turnoSiDorme==="function"&&turnoSiDorme(quando))return true;

  return notificaNativa(scelta.m.titolo,scelta.m.azione,quando);};

/* Programmare all'uscita è il momento giusto: è lì che l'app sa
   tutto quello che è successo oggi. */
function agganciaProgrammazione(){
  const App=plugin("App");
  if(App&&typeof App.addListener==="function"){
    App.addListener("appStateChange",(st)=>{
      if(st&&st.isActive===false)notificheProgramma();});}
  /* e anche quando la pagina viene nascosta, per il caso PWA */
  document.addEventListener("visibilitychange",()=>{
    if(document.visibilityState==="hidden")notificheProgramma();});}

/* ── accensione ───────────────────────────────────────────────── */
function avviaNativo(){
  if(!dentroApp())return;                 /* sul web non succede nulla */
  document.documentElement.setAttribute("data-nativo","1");
  legaTastoIndietro();
  tingiBarra();
  /* la splash si chiude quando l'app è pronta, non a tempo: un
     secondo di logo dopo che tutto è caricato è un secondo rubato */
  const SP=plugin("SplashScreen");
  if(SP&&typeof SP.hide==="function")setTimeout(()=>{try{SP.hide();}catch(e){}},250);
  agganciaProgrammazione();}

if(typeof document!=="undefined"){
  if(document.readyState==="complete")avviaNativo();
  else window.addEventListener("load",avviaNativo);}
window.avviaNativo=avviaNativo;
