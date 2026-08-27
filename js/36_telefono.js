/* ═══════════════════════════════════════════════════════════════
   36. IL TELEFONO: DATI SALUTE E NOTIFICHE (Sprint 10)
   ═══════════════════════════════════════════════════════════════
   Due cose che esistono solo quando l'app è installata davvero:
   leggere passi e allenamenti dal telefono, e mandare promemoria.

   ── IL RISCHIO DI QUESTO SPRINT: IL DOPPIO CONTEGGIO ───────────
   È il difetto più facile da introdurre e il più difficile da notare.
   Una persona corre mezz'ora. Il telefono la registra. Lei, che è
   diligente, la segna anche a mano. Se sommiamo, l'app le concede
   350 kcal che non ha bruciato — e lo fa in silenzio, con l'aria di
   essere più precisa di prima perché «ora leggiamo i dati veri».

   Nessuno se ne accorgerebbe: i numeri sono plausibili, il peso non
   scende, e la persona conclude che l'app non funziona per lei o che
   il suo metabolismo è rotto. Quindi qui NON si somma mai: si fonde,
   e le fusioni sono collaudate una per una.

   ── LE SCRITTURE NON ESISTONO ──────────────────────────────────
   Leggiamo, mai scriviamo. Riversare i nostri dati in Health Connect
   significherebbe spargere informazioni sull'alimentazione di una
   persona in un archivio che non controlliamo e che altre app
   leggono. Il permesso di scrittura non lo chiediamo nemmeno.

   ── LE NOTIFICHE: MENO, MAI PER PAURA ──────────────────────────
   Un promemoria è un favore; due sono un fastidio; uno che dice «stai
   per perdere la tua serie di 12 giorni» è ricatto travestito da
   attenzione. Le regole stanno in NOTIFICA_REGOLE e sono aritmetiche
   apposta: si collaudano invece di discuterle.                     */

/* ── Il ponte verso il telefono ─────────────────────────────────
   Quando l'app gira dentro Capacitor, qui c'è un oggetto vero. Nel
   browser non c'è, e va bene: tutto ricade sul manuale senza che
   nessuno se ne accorga. Chi non ha il telefono nativo non deve
   vedere una funzione rotta, deve vedere l'app di sempre. */
function pontePresente(){
  try{return !!(window.Capacitor&&window.Capacitor.isNativePlatform&&
                window.Capacitor.isNativePlatform());}catch(e){return false;}}
window.pontePresente=pontePresente;

function saluteStato(){
  if(!S.salute||typeof S.salute!=="object")S.salute={};
  const H=S.salute;
  if(typeof H.attiva!=="boolean")H.attiva=false;
  if(typeof H.permesso!=="string")H.permesso="mai-chiesto";
  if(!H.cache||typeof H.cache!=="object")H.cache={};
  return H;}
window.saluteStato=saluteStato;

/* ── La fusione, che è il cuore di tutto ────────────────────────
   Due allenamenti sono LO STESSO allenamento se si sovrappongono nel
   tempo e durano una cosa simile. La soglia è generosa (venti minuti)
   perché sbagliare per eccesso di prudenza significa contare una
   volta invece di due — e fra i due errori possibili questo è quello
   che non fa male a nessuno. */
const FINESTRA_MIN=20;

function stessoAllenamento(a,b){
  if(!a||!b)return false;
  /* senza orari si confronta su sport e durata: è il caso di chi
     segna «corsa 30 min» senza dire quando */
  const ta=+a.oraMin, tb=+b.oraMin;
  const durataSimile=Math.abs((+a.min||0)-(+b.min||0))<=Math.max(10,(+a.min||0)*0.35);
  if(!Number.isFinite(ta)||!Number.isFinite(tb))
    return durataSimile&&normSport(a.sport)===normSport(b.sport);
  const vicini=Math.abs(ta-tb)<=FINESTRA_MIN;
  /* stesso sport e vicini: è lo stesso. Sport diversi ma esattamente
     sovrapposti: probabilmente il telefono ha chiamato «camminata»
     quello che lei chiama «cardio», e vale lo stesso. */
  return vicini&&(normSport(a.sport)===normSport(b.sport)||durataSimile);}
window.stessoAllenamento=stessoAllenamento;

function normSport(s){
  const t=String(s||"").toLowerCase().trim();
  const gruppi={
    corsa:["corsa","running","run","jogging","corsetta"],
    camminata:["camminata","walking","walk","passeggiata"],
    bici:["bici","bicicletta","cycling","bike","spinning"],
    nuoto:["nuoto","swimming","swim"],
    palestra:["palestra","pesi","strength","weight","gym","functional"]
  };
  for(const k in gruppi)if(gruppi[k].some(x=>t.includes(x)))return k;
  return t;}
window.normSport=normSport;

/* Fonde gli allenamenti del telefono con quelli segnati a mano.
   Regola: MAI sommare. Quando i due descrivono la stessa cosa si
   tiene una voce sola — con la durata misurata dal telefono, che è
   più affidabile di un ricordo, e il nome dato dalla persona, che
   descrive meglio cosa stava facendo. */
function fondiAllenamenti(manuali,dalTelefono){
  const M=(manuali||[]).slice();
  const H=(dalTelefono||[]).slice();
  const fusi=M.map(m=>{
    const gemello=H.find(h=>stessoAllenamento(m,h));
    if(!gemello)return m;
    gemello._usato=true;
    return Object.assign({},m,{
      min:+gemello.min||+m.min||0,          /* la durata misurata vince */
      kcal:gemello.kcal||m.kcal,
      src:"fuso"});});
  /* quello che il telefono ha visto e la persona non ha segnato si
     aggiunge: è lavoro fatto e va contato */
  H.forEach(h=>{if(!h._usato)fusi.push(Object.assign({},h,{src:"health"}));});
  fusi.forEach(x=>{delete x._usato;});
  return fusi;}
window.fondiAllenamenti=fondiAllenamenti;

/* I passi non si fondono: si SCEGLIE. Il telefono conta, la persona
   stima — e sommare una misura a una stima non produce una misura
   migliore, produce un numero più grande. */
function scegliPassi(manuali,dalTelefono){
  const h=+dalTelefono||0, m=+manuali||0;
  return h>0?h:m;}
window.scegliPassi=scegliPassi;

/* ── L'adattatore ───────────────────────────────────────────────
   Si registra nell'interfaccia dello Sprint 0: le pagine non
   cambiano di una riga. Se il permesso non c'è o la lettura fallisce,
   si ricade sul manuale — senza avvisi drammatici, perché non è
   colpa di nessuno. */
if(typeof SorgentiAttivita!=="undefined"){
  SorgentiAttivita.registra("health",{
    passi:di=>{
      const H=saluteStato();
      const g=(H.cache[chiaveGiorno(di)]||{});
      return scegliPassi(((S.week.days[di]||{}).steps)||0, g.passi||0);},
    allenamenti:di=>{
      const H=saluteStato();
      const g=(H.cache[chiaveGiorno(di)]||{});
      return fondiAllenamenti(((S.week.days[di]||{}).workouts)||[], g.allenamenti||[]);}
  });}

function chiaveGiorno(di){
  try{return iso(dateOfIdx?dateOfIdx(di):new Date());}
  catch(e){return "d"+di;}}

/* La lettura vera dal telefono. Non lancia mai: un permesso negato
   non è un errore da mostrare, è una scelta da rispettare. */
window.saluteLeggi=async(giorni)=>{
  const H=saluteStato();
  if(!pontePresente())return {ok:false,perche:"non-nativa"};
  try{
    const P=window.Capacitor.Plugins&&window.Capacitor.Plugins.Health;
    if(!P)return {ok:false,perche:"plugin-assente"};
    if(H.permesso!=="dato"){
      /* SOLO lettura: il permesso di scrittura non lo chiediamo. */
      const r=await P.requestPermissions({read:["steps","workouts"],write:[]});
      H.permesso=(r&&r.granted)?"dato":"negato";save();
      if(H.permesso!=="dato")return {ok:false,perche:"permesso-negato"};}
    const dati=await P.query({giorni:giorni||7,tipi:["steps","workouts"]});
    (dati&&dati.giorni||[]).forEach(g=>{
      H.cache[g.data]={passi:+g.passi||0,
        allenamenti:(g.allenamenti||[]).map(a=>({sport:a.tipo||a.sport,
          min:+a.minuti||0,oraMin:+a.oraMin,kcal:+a.kcal||0,src:"health"}))};});
    H.ultimaLettura=Date.now();save();
    return {ok:true,giorni:Object.keys(H.cache).length};
  }catch(e){return {ok:false,perche:"lettura-fallita"};}};

/* ── Le notifiche ───────────────────────────────────────────────
   Le regole sono numeri, così si collaudano invece di discuterle. */
const NOTIFICA_REGOLE={
  massimoAlGiorno:2,
  silenzioDa:22, silenzioA:8,        /* ore in cui non si disturba */
  minutiFraDue:180,
  /* Cose su cui NON si notifica mai, e il motivo accanto. */
  maiSu:{
    peso:"un promemoria sul peso trasforma una bilancia in un giudice",
    serie:"«stai per perdere la serie» è ricatto travestito da attenzione",
    calorie:"ricordare a qualcuno quanto ha mangiato non lo aiuta a mangiare meglio",
    inattivita:"chi non apre l'app da giorni sta già male: insistere lo allontana"
  }
};
window.NOTIFICA_REGOLE=NOTIFICA_REGOLE;

function notifiche(){
  if(!S.notif||typeof S.notif!=="object")S.notif={};
  const N=S.notif;
  if(!Array.isArray(N.mandate))N.mandate=[];
  if(typeof N.attive!=="boolean")N.attive=false;
  return N;}
window.notifiche=notifiche;

/* Si può mandare questa notifica, adesso? Una funzione sola, che dice
   anche perché no: senza il motivo, il primo che trova una notifica
   mancante la «aggiusta» togliendo un controllo. */
function notificaSiPuo(tipo,quando){
  const N=notifiche();
  const t=quando||new Date();
  if(!N.attive)return {ok:false,perche:"spente"};
  if(NOTIFICA_REGOLE.maiSu[tipo])
    return {ok:false,perche:"tipo-vietato",motivo:NOTIFICA_REGOLE.maiSu[tipo]};

  /* Le ore di silenzio seguono il TURNO di oggi: chi smonta alle 6
     dorme di giorno, e la nostra gentilezza diventerebbe una sveglia. */
  try{
    if(typeof turnoSiDorme==="function"&&turnoOggi&&turnoOggi()){
      if(turnoSiDorme(t))return {ok:false,perche:"silenzio"};
    }else{
      const ora=t.getHours();
      if(ora>=NOTIFICA_REGOLE.silenzioDa||ora<NOTIFICA_REGOLE.silenzioA)
        return {ok:false,perche:"silenzio"};}
  }catch(_){
    const ora=t.getHours();
    if(ora>=NOTIFICA_REGOLE.silenzioDa||ora<NOTIFICA_REGOLE.silenzioA)
      return {ok:false,perche:"silenzio"};}

  /* mai vendere o insistere in una giornata dichiarata difficile */
  try{if(typeof isHard==="function"&&isHard(iso(t)))return {ok:false,perche:"giornata-difficile"};}catch(e){}
  /* e mai a chi ha un rapporto difficile col cibo */
  try{if(typeof profiloDelicato==="function"&&profiloDelicato())
    return {ok:false,perche:"profilo-delicato"};}catch(e){}

  const oggi=t.toISOString().slice(0,10);
  const diOggi=N.mandate.filter(m=>String(m.quando||"").slice(0,10)===oggi);
  if(diOggi.length>=NOTIFICA_REGOLE.massimoAlGiorno)
    return {ok:false,perche:"quota-giornaliera"};

  const ultima=N.mandate[N.mandate.length-1];
  if(ultima&&(t-Date.parse(ultima.quando))<NOTIFICA_REGOLE.minutiFraDue*60000)
    return {ok:false,perche:"troppo-presto"};

  if(diOggi.some(m=>m.tipo===tipo))
    return {ok:false,perche:"gia-oggi"};

  return {ok:true};}
window.notificaSiPuo=notificaSiPuo;

window.notificaSegna=(tipo,quando)=>{
  const N=notifiche();
  N.mandate.push({tipo,quando:(quando||new Date()).toISOString()});
  if(N.mandate.length>60)N.mandate=N.mandate.slice(-60);
  save();};
