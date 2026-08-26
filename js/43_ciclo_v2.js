/* ═══════════════════════════════════════════════════════════════
   43. IL CICLO, SECONDA VERSIONE
   ═══════════════════════════════════════════════════════════════
   Prima c'era un interruttore: la fase luteale si accendeva a mano,
   e chi se ne dimenticava restava con un fabbisogno sbagliato per
   giorni. Ma un interruttore che si accende da solo sarebbe stato
   peggio: i cicli irregolari sono la norma, non l'eccezione, e
   un'app che DECIDE quando sei nella fase luteale — sbagliando —
   è invadente e pure inutile.

   La terza strada: l'app IMPARA e PROPONE. Mai attiva da sola.

   1 · IL CALENDARIO CHE IMPARA
       Ogni inizio registrato allunga la memoria. Da due cicli in
       poi conosce la TUA durata media — non i 28 giorni del libro,
       che quasi nessuna ha. Con tre o più, conosce anche quanto
       sei regolare: se la variabilità è alta, tace e basta.
       Nessun modello, nessuna previsione spacciata per certezza:
       una media e uno scarto, entrambi leggibili.

   2 · LA PROPOSTA, MAI L'IMPOSIZIONE
       «Da domani potresti entrare nella fase luteale: attivo?»
       Una domanda, una volta, con la risposta «non adesso» che
       vale quanto il sì. Se rifiuti, per questo ciclo non si
       chiede più.

   3 · LA BILANCIA CONTESTUALIZZATA
       Nei giorni giusti, il chilo in più arriva GIÀ SPIEGATO:
       «in questa fase il corpo trattiene acqua, la tendenza vera
       la vediamo fra qualche giorno». È la singola frase che
       previene più abbandoni di qualunque funzione: senza, quel
       numero sembra un fallimento e mezzo mondo molla lì.

   4 · LO SPUNTINO PREVISTO, NON VIETATO
       La fame luteale esiste. Il piano la mette in conto e la
       nutre: prevederla è dignità, vietarla e poi rimproverare
       è ipocrisia.

   PRIVACY: tutto sul telefono, dentro S.phys come il resto degli
   stati del corpo. Mai in telemetria, mai verso lo studio: un
   professionista vede il piano, non il calendario mestruale.       */

/* ── la memoria degli inizi ────────────────────────────────────── */
function cicloStorico(){
  if(!S.phys)S.phys={};
  if(!Array.isArray(S.phys.cicli))S.phys.cicli=[];
  return S.phys.cicli;}

window.cicloSegnaInizio=(giorno)=>{
  const L=cicloStorico();
  const d=giorno||iso(new Date());
  if(L.indexOf(d)>=0)return;
  L.push(d);L.sort();
  if(L.length>12)S.phys.cicli=L.slice(-12);   /* un anno basta */
  S.phys.cicloRifiutato=null;                 /* nuovo ciclo, nuova domanda */
  save();};

/* Le distanze fra un inizio e il successivo: sono loro il dato. */
function cicloIntervalli(){
  const L=cicloStorico();
  const out=[];
  for(let i=1;i<L.length;i++){
    const g=Math.round((Date.parse(L[i])-Date.parse(L[i-1]))/86400000);
    /* fuori da questa forbice non è un ciclo: è una dimenticanza o
       un doppio inserimento. Meglio scartare che imparare il falso. */
    if(g>=18&&g<=45)out.push(g);}
  return out;}

/* Quanto dura, e quanto è regolare. Null se non ha ancora imparato. */
function cicloRitmo(){
  const g=cicloIntervalli();
  if(g.length<1)return null;
  const media=Math.round(g.reduce((a,b)=>a+b,0)/g.length);
  const scarto=g.length<2?null:
    Math.round(Math.sqrt(g.reduce((a,b)=>a+(b-media)*(b-media),0)/g.length));
  return {media,scarto,n:g.length,
    /* con uno scarto oltre i 5 giorni una previsione è una scommessa:
       si dichiara irregolare e non si propone nulla. */
    regolare:scarto===null?null:scarto<=5};}
window.cicloRitmo=cicloRitmo;

/* ── la fase luteale attesa ────────────────────────────────────── */
/* Comincia circa 14 giorni prima del prossimo inizio: è l'unica
   costante decente in fisiologia, la parte variabile è l'altra. */
function cicloProssimoInizio(){
  const r=cicloRitmo();
  const L=cicloStorico();
  if(!r||!L.length)return null;
  const ultimo=L[L.length-1];
  return iso(new Date(Date.parse(ultimo)+r.media*86400000));}

function cicloFaseLuteale(giorno){
  const p=cicloProssimoInizio();
  if(!p)return false;
  const d=Date.parse(giorno||iso(new Date()));
  const inizio=Date.parse(p)-14*86400000;
  return d>=inizio&&d<Date.parse(p);}
window.cicloFaseLuteale=cicloFaseLuteale;

/* ── la proposta: una domanda, una volta ──────────────────────── */
function cicloDaProporre(){
  if(!physAllowed())return null;
  if(S.phys&&S.phys.cycleOn)return null;          /* già attiva */
  const r=cicloRitmo();
  if(!r||r.n<1)return null;                        /* non ha imparato */
  if(r.regolare===false)return null;               /* irregolare: tace */
  const p=cicloProssimoInizio();
  if(!p)return null;
  /* si chiede il giorno prima dell'inizio atteso della fase */
  const inizioFase=iso(new Date(Date.parse(p)-14*86400000));
  const oggi=iso(new Date());
  const domani=iso(new Date(Date.now()+86400000));
  if(inizioFase!==oggi&&inizioFase!==domani)return null;
  if(S.phys.cicloRifiutato===p)return null;        /* ha già detto no */
  if(S.phys.cicloPropostoPer===p)return null;      /* già chiesto */
  return {quando:inizioFase,prossimo:p,ritmo:r};}
window.cicloDaProporre=cicloDaProporre;

window.cicloProponi=async()=>{
  const q=cicloDaProporre();
  if(!q)return;
  S.phys.cicloPropostoPer=q.prossimo;save();
  const testo=tr("Dai tuoi ultimi cicli, da domani potresti entrare nella fase luteale.")+
    "\n\n"+tr("Se attivo, il fabbisogno sale di poco e la bilancia smette di allarmarsi per l'acqua. Puoi disattivarla quando vuoi.");
  const si=await dlgConfirm(testo,{ok:tr("Attiva"),ko:tr("Non adesso")});
  if(!si){S.phys.cicloRifiutato=q.prossimo;save();return;}
  S.phys.cycleOn=true;S.phys.cycleStart=iso(new Date());
  if(typeof stampPhys==="function")stampPhys();
  save();render(cur);
  toast(tr("Fase luteale attiva. La bilancia adesso lo sa."));};

/* ── la bilancia che sa in che giorno sei ─────────────────────── */
/* Ritorna la frase da mostrare accanto alla pesata, o null se non
   c'è niente di utile da dire. Mai un giudizio: solo il contesto
   che quel numero, da solo, non ha. */
function cicloNotaPeso(delta){
  const inFase=(S.phys&&S.phys.cycleOn)||cicloFaseLuteale();
  if(!inFase)return null;
  if(!(delta>0.3))return null;      /* niente da spiegare */
  return tr("In questa fase il corpo trattiene acqua: è normale, e non è grasso. La tendenza vera si vede fra qualche giorno.");}
window.cicloNotaPeso=cicloNotaPeso;

/* ── lo spuntino previsto ─────────────────────────────────────── */
/* Non un permesso da chiedere: una riga che il piano ha già. */
function cicloSpuntino(){
  const inFase=(S.phys&&S.phys.cycleOn)||cicloFaseLuteale();
  if(!inFase)return null;
  return {d:tr("Spuntino della fase: yogurt intero e cioccolato fondente (20 g)"),
          k:180,p:8,
          perche:tr("La fame di questi giorni è vera. È già nel conto: mangiarlo non toglie niente al piano.")};}
window.cicloSpuntino=cicloSpuntino;

/* ── privacy: questi dati non escono ──────────────────────────── */
/* La telemetria e il pannello dello studio leggono da funzioni loro;
   qui si dichiara nero su bianco cosa non deve mai partire, così il
   collaudo può verificarlo invece di fidarsi. */
const CICLO_MAI_FUORI=["cicli","cycleStart","cycleOn","cicloPropostoPer","cicloRifiutato"];
window.CICLO_MAI_FUORI=CICLO_MAI_FUORI;
