/* ═══════════════════════════════════════════════════════════════
   2. STATO, PERSISTENZA, TEMA
   ═══════════════════════════════════════════════════════════════ */
const KEY="diarioDieta_v2"; // NON cambiare mai: e' dove vivono i dati dell'utente
/* Era ferma a «12.65.0» da oltre trenta versioni: il numero che esiste
   apposta per verificare il deploy non verificava niente — e mentre si
   cercava un piano che «non arriva mai», non si poteva nemmeno sapere
   QUALE versione stesse girando sul telefono. Riallineata (25/08). */
const APP_VER="14.2.0";        // aggiorna a ogni release: visibile in Io per verificare il deploy
/*   SBLOCCO DI TEST — DA METTERE A false PRIMA DEL RILASCIO  
   Con true, ciclo/allattamento/gravidanza restano CLICCABILI anche sui
   profili maschili, per poterli provare senza cambiare genere. Con false
   restano visibili ma disattivati, che è il comportamento definitivo.
   Finché è true l'app mostra un avviso rosso fisso in Oggi e in Regole.
   Deve stare QUI, in cima: viene già letto dalle migrazioni all'avvio. */
const PHYS_TEST_UNLOCK=false;
/* Dove arrivano i dati d'uso anonimi.
   ATTENZIONE: un browser NON può spedire email da solo. Per riceverli in
   automatico su info@nuviahealth.app serve un piccolo script di
   raccolta che poi inoltri (istruzioni nella guida, voce «Dati d'uso»):
   si crea una volta in cinque minuti e si incolla qui il suo indirizzo.
   Finché resta vuoto, all'utente compare solo l'invio manuale. */
const TEL_URL="";
/* Giorno LOCALE in formato AAAA-MM-GG. iso() arriva solo più avanti (modulo
   della data) e qui serve già durante le migrazioni. toISOString() darebbe
   il giorno UTC: in Italia, fra mezzanotte e le 2, è il giorno PRIMA — e una
   settimana nata «ieri» sposta di uno tutta la mappa dei giorni del piano. */
function giornoLocale(x){const d=x?new Date(x):new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function freshWeek(){return {started:giornoLocale(),
  days:PLAN.map(d=>({meals:(d.meals||[]).map(()=>({done:false,skip:false,opt:0,movedTo:-1,movedAs:"",custom:null})),
    extras:[],workouts:[],note:"",water:0,sleep:0,relax:0,feel:0,stress:0,emo:0,emoWhy:[],steps:0}))};}
function defaultState(){return {
  profile:{name:"",gender:"m",dob:"",h:"",w:"",lbm:"",act:1.3,weights:[]},
  customSports:[],shop:{},links:[],permMeals:{},week:freshWeek(),history:[],
  ai:{key:""},drive:{cid:"",on:false},
  ui:{theme:"auto",vacanza:false,lastOpen:"",lastMorning:""},
  streak:{count:0,last:""},meta:{updated:new Date().toISOString()}};}
let S;
try{S=JSON.parse(localStorage.getItem(KEY))||null;}catch(e){S=null;}
if(!S){ // migrazione dalla v1 se presente
  try{const old=JSON.parse(localStorage.getItem("diarioDieta_v1"));
    if(old){S=defaultState();S.profile=Object.assign(S.profile,old.profile||{});
      S.customSports=old.customSports||[];S.shop=old.shop||{};S.history=old.history||[];S.ai=old.ai||{key:""};}
  }catch(e){}
}
if(!S)S=defaultState();
// retro-compatibilità morbida su tutti i rami
S.ui=Object.assign({theme:"auto",vacanza:false,lastOpen:"",lastMorning:""},S.ui||{});
S.drive=Object.assign({cid:"",on:false},S.drive||{});
/* Il campo `pensiero` (il selettore Fast/Medium/Slow) non c'è più dal
   27/08: la misura è finita, il livello lo dice la tabella in
   `15_6` e nessuna scelta dell'interfaccia lo scavalca.
   `genMs` e `genAt` restano — quanto è durata l'ultima generazione e
   quando: senza quel numero il confronto fra i livelli sarebbe un
   confronto fra sensazioni, e serve ancora il giorno in cui si
   proverà «medium». Un `pensiero` rimasto scritto sui telefoni di chi
   aggiorna non dà fastidio: non lo legge più nessuno. */
S.ai=Object.assign({key:"",model:"auto",genMs:0,genAt:""},S.ai||{});
S.usage=Object.assign({day:"",calls:0,tokens:0,errors:0,last:""},S.usage||{});
/* Rete di compatibilità: qualunque stato salvato — anche di versioni vecchie,
   parziale o riparato a mano — viene completato con le chiavi mancanti prima
   che l'app lo usi. Senza questo, una sola chiave assente manda in errore
   un'intera pagina. */
S.profile=S.profile||{};
S.profile.weights=S.profile.weights||[];
S.customSports=S.customSports||[];
S.shop=S.shop||{};S.recipes=S.recipes||[];S.history=S.history||[];
S.ai=S.ai||{key:""};S.drive=S.drive||{cid:"",on:false};
S.ui=S.ui||{};S.meta=S.meta||{};S.usage=S.usage||{day:"",calls:0,tokens:0,errors:0,last:""};
/* ═══ DATI D'USO ANONIMI ════════════════════════════════════════════
   Serve a rispondere a una domanda sola: dopo quanti giorni si smette?
   Esce SOLO questo: un identificativo casuale, la versione, da quanti
   giorni è installata, quanti giorni è stata usata, quante spunte, quante
   richieste all'AI. NON esce nulla che riguardi la persona: niente peso,
   niente cibo, niente nome, niente note, niente dati di salute. */
S.tel=Object.assign({on:null,id:"",url:"",primo:"",ultimo:"",giorni:0,ai:0,inviato:""},S.tel||{});
if(!S.tel.id)S.tel.id="nx-"+Math.random().toString(36).slice(2,8)+Math.random().toString(36).slice(2,6);
/* iso() è dichiarata più avanti: qui si usa giornoLocale() (stessa logica) */
if(!S.tel.primo)S.tel.primo=giornoLocale();
S.week=S.week||freshWeek();
S.week.days=S.week.days||[];
while(S.week.days.length<PLAN.length)
  S.week.days.push({meals:[],extras:[],workouts:[],note:"",water:0,sleep:0,relax:0,feel:0,stress:0,emo:0,emoWhy:[]});
S.week.days.forEach((d,di)=>{
  d.meals=d.meals||[];d.extras=d.extras||[];d.workouts=d.workouts||[];
  const need=(PLAN[di]&&PLAN[di].meals)?PLAN[di].meals.length:0;
  while((d.meals||[]).length<need)d.meals.push({done:false,skip:false,opt:0,movedTo:-1,movedAs:"",custom:null});
});
S.permMeals=S.permMeals||{};S.streak=S.streak||{count:0,last:""};S.hardDays=S.hardDays||{};S.dayEvents=S.dayEvents||{};
/* UNA VARIABILE SOLA (23/08). `S.diet.obiettivoPeso` non è più una
   fonte: qui si travasa quello che c'era nei profili già salvati e poi
   si cancella, così non resta un secondo posto dove guardare. Il
   travaso scrive DIRETTO perché è una migrazione, non una scelta della
   persona: un numero già accettato ieri non si rimette in discussione
   oggi (e il guardrail, con lo studio di mezzo, lo rifiuterebbe). */
try{
  const vecchio=parseFloat((S.diet||{}).obiettivoPeso);
  if(!(parseFloat(S.profile.goalW)>0)&&vecchio>20&&vecchio<350)
    S.profile.goalW=Math.round(vecchio*10)/10;
  if(S.diet&&"obiettivoPeso" in S.diet)delete S.diet.obiettivoPeso;
}catch(e){}
if(S.planW===undefined)S.planW=(planIsEmpty&&typeof planIsEmpty==="function"&&!planIsEmpty())?S.profile.w:null;
if(!S.ui)S.ui={};
/* Riparazione pesate: il wizard salvava la data come timestamp UTC completo
   («2026-08-15T09:12:33.123Z»), tutti gli altri punti come giorno locale
   («2026-08-15»). Il formato misto rompeva la ricerca «peso di oggi», creava
   un doppione pesandosi il giorno stesso dell'onboarding, e nel confronto a
   4 settimane la voce col timestamp produceva una data invalida e spariva.
   Qui si porta tutto al giorno locale; a parità di giorno si fondono le voci
   tenendo, campo per campo, l'ultimo valore effettivamente presente. */
if(S.profile&&Array.isArray(S.profile.weights)&&S.profile.weights.some(x=>x&&/T/.test(String(x.d||"")))){
  const perGiorno={};
  S.profile.weights.forEach(x=>{
    if(!x)return;
    const g=/T/.test(String(x.d||""))?giornoLocale(x.d):String(x.d||"").slice(0,10);
    if(!g||g==="NaN-NaN-NaN")return;
    const dest=perGiorno[g]||(perGiorno[g]={d:g});
    Object.keys(x).forEach(k=>{if(k!=="d"&&x[k]!=null)dest[k]=x[k];});
  });
  S.profile.weights=Object.keys(perGiorno).sort().map(g=>perGiorno[g]);
}
if(!S.profile.goalWorkoutList){S.profile.goalWorkoutList=[];
  if(S.profile.goalWorkouts&&S.profile.goalSport)S.profile.goalWorkoutList.push({sport:S.profile.goalSport,perWeek:S.profile.goalWorkouts,min:S.profile.goalWorkoutMin||30});}
S.meta=S.meta||{updated:new Date().toISOString()};
S.shopTpl=S.shopTpl||S.conadTpl||"";delete S.conadTpl;
S.recipes=S.recipes||[];
S.progressLog=S.progressLog||[];
/* Periodi (Dieta 1, Periodo libero 1, Dieta 2, …): ogni periodo raggruppa i
   dati tra una data di inizio e una di fine, con aspettativa iniziale (stelle),
   giudizio finale (stelle), motivazioni e valutazione AI. */
S.periods=S.periods||[];
/* ═══ FASE 1 · CICLO E ALLATTAMENTO ═══════════════════════════════
   Sono fabbisogni AGGIUNTIVI: si sommano al target, non ci stanno dentro.
   In fase luteale il metabolismo basale sale di qualche punto percentuale;
   l'allattamento costa energia vera (~500 kcal al giorno se esclusivo). */
S.phys=Object.assign({cycleOn:false,cycleStart:null,lact:"no",preg:"no",inj:false,ill:false,digiuno:false},S.phys||{});
/* Ciclo: la fase dura 7 giorni (era 14 nelle versioni fino alla 9.0: chi
   aveva lasciato il valore di default viene riportato al nuovo standard) */
if(+S.profile.cycleDays===14)S.profile.cycleDays=7;
/* Ciclo, allattamento e gravidanza hanno senso solo per il profilo femminile:
   se il genere non è femminile si spengono da soli, così non restano attivi
   contributi calorici invisibili dopo un cambio di profilo. */
if(S.profile.gender!=="f"&&!PHYS_TEST_UNLOCK){S.phys.cycleOn=false;S.phys.cycleStart=null;S.phys.lact="no";S.phys.preg="no";}
/* ═══ FASE 2 · FAMIGLIA ════════════════════════════════════════════
   Solo sesso e data di nascita: la categoria e il coefficiente li calcola
   l'app. Servono a cucinare per tutti (dosi in pentola) e a fare la spesa
   per il numero giusto di persone. */
S.family=Array.isArray(S.family)?S.family:[];
/* Cucinare per tutti è una scelta, non una conseguenza dell'avere una
   famiglia: c'è chi prepara il proprio piatto a parte. Di norma è
   acceso quando qualcuno c'è, perché è il caso comune, e si spegne da
   Regole. Non tocca MAI le grammature: cambia solo la scelta dei
   piatti (vedi famPianoForAI). */
S.famPiano=(S.famPiano===undefined)?((S.family||[]).length>0):!!S.famPiano;
S.weekOut=(S.weekOut&&typeof S.weekOut==="object")?S.weekOut:{};
/* "porto" = me li preparo io e li porto (schiscetta): restano nella spesa.
   "fuori" = mensa, bar, ristorante: non si comprano e il piano è generico. */
S.weekOutTipo=(S.weekOutTipo&&typeof S.weekOutTipo==="object")?S.weekOutTipo:{};
S.rules=Object.assign({custom:""},S.rules||{});
S.onboard=Object.assign({done:false,step:0},S.onboard||{});
if(S.profile&&S.profile.intOverride)Object.assign(INT,S.profile.intOverride); // ripristina i moltiplicatori scelti
S.diet=Object.assign({intol:"",
  no:"",
  si:"",
  note:"",fodmap:false,protocolli:"",varieta:"media",fuoriTipo:"fuori",liberi:"",pronto:"semplice",nPasti:5,colaz:"entrambe",
  tipo:"mediterranea",       // impostazione alimentare di riferimento
  tradizione:"italiana",     // tradizione culinaria: da NON confondere con
                             // «cucina», che qui sotto sono i minuti
  pastiLiberi:1,             // pasti liberi concessi a settimana
  slots:"Colazione, Metà mattina, Pranzo, Metà pomeriggio, Cena",
  fuoriN:2,                  // pasti fuori casa a settimana (mensa, ristorante)
  mensaGiorni:"",            // giorni e pasti fuori casa (mensa, trattoria, bar…)
  cucina:"30",               // minuti disponibili per cucinare
  budget:"medio",
  alcol:"raramente",
  caffe:2,
  religiose:"",              // vincoli religiosi o etici
  integratori:"",
  patologie:"",              // condizioni da tenere presenti (informativo)
  ritmo:"0.5"                // kg a settimana desiderati
},S.diet||{});
if(S.profile&&S.profile.lbm&&!S.profile.fatp&&S.profile.w>0){ // migrazione: da magra kg a % grasso
  S.profile.fatp=Math.round((1-parseFloat(S.profile.lbm)/S.profile.w)*1000)/10;}
/* MIGRAZIONE: le voci che stavano nel menù "impostazione di riferimento" e ora
   sono protocolli o intolleranze vengono spostate al posto giusto, così nessuno
   perde la scelta che aveva già fatto. */
/* Chi usava Nuvia prima della scelta della tradizione ha sempre avuto
   piatti italiani: il campo mancante vale «italiana», così nessun piano
   già fatto cambia sapore da un aggiornamento all'altro. */
(function(){if(!S.diet.tradizione)S.diet.tradizione="italiana";})();
(function(){const t=String(S.diet.tipo||"").toLowerCase();
  /* lista letterale: questa migrazione gira prima che DIET_TYPES sia dichiarato */
  const VALID=["mediterranea","onnivora","vegetariana","vegana","pescetariana","flexitariana"];
  if(!t||VALID.indexOf(t)>-1)return;
  const asProt={"chetogenica":"chetogenica","low carb":"low carb","iperproteica":"alta proteina",
    "digiuno intermittente 16:8":"digiuno intermittente","antinfiammatoria":"antinfiammatoria",
    "dash (pressione)":"dash","a basso indice glicemico":"basso indice glicemico",
    "ipocalorica bilanciata":"ipocalorica bilanciata"}[t];
  const asIntol={"senza glutine":"glutine","senza lattosio":"lattosio"}[t];
  if(asProt){const cur=String(S.diet.protocolli||"");
    if(cur.toLowerCase().indexOf(asProt)<0)S.diet.protocolli=(cur?cur+", ":"")+asProt;}
  if(asIntol){const cur=String(S.diet.intol||"");
    if(cur.toLowerCase().indexOf(asIntol)<0)S.diet.intol=(cur?cur+", ":"")+asIntol;}
  S.diet.tipo="mediterranea";
  /* qui c'era «S.diet.fodmap=S.diet.fodmap»: una riga che non faceva nulla
     (assegnava un valore a se stesso) su un campo che non esiste più. Tolta. */
})();
function emptyPlan(){const D=["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
  return D.map(d=>({day:d,ctx:"",meals:[]}));}
function planIsEmpty(){return PLAN.every(d=>!d.meals||!(d.meals||[]).length);}
/* Riparazione piano: ogni pasto DEVE avere la sua lista di opzioni «o».
   Un piano che arriva da un backup vecchio, da un ripristino Drive o da un
   file scritto a mano può averne uno senza: fino a ieri bastava quel pasto
   solo per fermare l'avvio dell'intera app — schermata bianca, e da lì non
   si raggiunge nemmeno il Ripristino di emergenza. Qui il pasto si ricuce
   con quello che ha (o resta vuoto), e l'app parte comunque: nessun dato
   viene buttato, solo rimesso nella forma che tutto il resto si aspetta. */
function riparaPiano(pl){
  let tocchi=0;
  (pl||[]).forEach(d=>{
    if(!d||typeof d!=="object")return;
    if(!Array.isArray(d.meals))  {d.meals=[];tocchi++;}
    d.meals.forEach(m=>{
      if(!m||typeof m!=="object")return;
      if(Array.isArray(m.o))return;
      m.o=(m.d||m.k||m.p)
        ? [{d:String(m.d||m.t||m.n||"—"),k:Math.round(m.k)||0,p:Math.round(m.p)||0,
            c:Math.round(m.c)||0,f:Math.round(m.f)||0,fib:Math.round(m.fib)||0,z:Math.round(m.z)||0}]
        : [];
      tocchi++;});});
  return tocchi;}
if(S.customPlan&&Array.isArray(S.customPlan)){
  const t=riparaPiano(S.customPlan);
  if(t){try{save();}catch(e){}
        try{console.warn("Piano riparato: "+t+" punti rimessi in forma");}catch(e){}}}
if(S.customPlan&&Array.isArray(S.customPlan)&&S.customPlan.length===7)PLAN=S.customPlan;
/* Nuovo utente: nessun piano precompilato, si costruisce nel percorso
   guidato (onb2). ATTENZIONE: "nuovo" significa DAVVERO senza dati — niente
   profilo, niente settimane archiviate, nessuna spunta e nessun allenamento.
   Chi sta già usando l'app non viene toccato in nessun caso, e la settimana
   in corso non viene MAI azzerata da questo controllo. */
function hasAnyData(){
  if(S.profile&&S.profile.dob)return true;
  if(S.history&&S.history.length)return true;
  if(S.periods&&S.periods.length)return true;
  if(S.week&&S.week.days&&S.week.days.some(d=>
    (d.workouts&&(d.workouts||[]).length)||(d.extras&&(d.extras||[]).length)||d.water||d.note||
    (d.meals&&(d.meals||[]).some(m=>m.done||m.skip||m.custom))))return true;
  return false;}
if(!S.onboard.done&&!S.customPlan&&!hasAnyData()){
  S.customPlan=emptyPlan();PLAN=S.customPlan;S.week=freshWeek();
  /* ── LA RICARICA NON DEVE BUTTARE FUORI DAL PERCORSO (v13.96) ────
     Il ramo qui sotto esiste per chi usava l'app PRIMA che il
     percorso guidato nascesse: quelli non devono farlo. Ma nessuno
     marcava mai `started`, e questo primo ramo scrive S.customPlan —
     quindi al PRIMO riavvio la condizione «!S.customPlan» era falsa,
     si cadeva nel ramo dei veterani, e `done` diventava true: chi
     ricaricava la pagina sul saluto si ritrovava dentro l'app, su Io,
     senza piano e senza spiegazioni. Riprodotto passo-passo il 26/08:
     saluto → ricarica → pg-io. Un avvio VERGINE è per definizione
     qualcuno che il percorso deve farlo: lo si scrive subito. */
  S.onboard.started=true;
}else if(!S.onboard.done&&!S.onboard.started&&!onb2Iniziato()){
  /* Utente che usava già l'app prima del percorso guidato: non glielo
     imponiamo. Vale SOLO se il percorso non è mai stato aperto: chi lo ha
     iniziato e ha chiuso l'app a metà lo ritrova dov'era. Senza questo
     controllo bastava scrivere la data di nascita — da lì hasAnyData()
     diventa vera — e il percorso spariva da solo alla riapertura.
     Dallo Sprint 1 vale per ENTRAMBI i percorsi: chi ha risposto a due
     domande del percorso breve e ha chiuso l'app ha già dei dati, e
     senza questo controllo si ritrovava dentro l'app senza piano né
     spiegazioni, con metà delle risposte date a vuoto. */
  S.onboard.done=true;
}
/* ── LA RIPARAZIONE PER CHI C'È GIÀ CASCATO ──────────────────────
   Chi ha ricaricato con il difetto sopra si porta un `done:true`
   scritto per sbaglio: profilo vuoto, nessun dato, percorso mai
   aperto — e un'app che non sa niente di lui. Si riconosce proprio
   da questo (done senza data di nascita, senza dati e senza una sola
   risposta) e si rimette nel percorso, da dove era rimasto. Un
   veterano vero non passa di qui: ha i dati, o almeno la dob. */
/* SOLO il profilo davvero vergine: il difetto colpiva chi ricaricava
   PRIMA di rispondere alla prima domanda, quindi chi non ha né nome
   né numeri. Un profilo con un nome o un peso è di qualcuno che l'app
   la usa (o di un collaudo che la semina): non si tocca. */
if(S.onboard.done&&!S.onboard.started&&!onb2Iniziato()&&!hasAnyData()
   &&!(S.profile&&(S.profile.dob||S.profile.name||S.profile.w>0||S.profile.h>0))){
  S.onboard.done=false;S.onboard.started=true;}
enrichFiber(PLAN);
if(!S.week||!S.week.days||S.week.days.length!==7)S.week=freshWeek();
S.week.days.forEach((d,di)=>{(d.meals||[]).forEach(m=>{if(m.skip===undefined)m.skip=false;if(m.movedAs===undefined)m.movedAs="";if(m.custom===undefined)m.custom=null;});
  while((d.meals||[]).length<PLAN[di].meals.length)d.meals.push({done:false,skip:false,opt:0,movedTo:-1,movedAs:"",custom:null});
  if(d.sleep===undefined)d.sleep=0;if(d.relax===undefined)d.relax=(d.stress?Math.max(1,6-d.stress):0);if(d.feel===undefined)d.feel=0;if(d.steps===undefined)d.steps=0;
  if(Array.isArray(d.crash))d.crash=Array.from(new Set(d.crash.map(k=>k==="dopo-pranzo"?"pomeriggio":(k==="notte"?"sera":k))));});
(S.crashes||[]).forEach(x=>{if(x.slot==="dopo-pranzo")x.slot="pomeriggio";else if(x.slot==="notte")x.slot="sera";});
let driveTimer=null;
/* ── Istantanee di sicurezza ───────────────────────────────────────
   Una copia completa dei dati al giorno (ne teniamo 7) più una copia
   forzata prima di ogni operazione che può sovrascrivere qualcosa.
   Servono a poter tornare indietro se qualcosa va storto. */
const SNAP_KEY="diarioDieta_v2_snapshots";
function snapshots(){try{return JSON.parse(localStorage.getItem(SNAP_KEY))||[];}catch(e){return [];}}
function snapSave(tag){
  try{
    if(!S||!S.week)return;
    const data=JSON.stringify(S);
    const list=snapshots();
    const today=new Date().toISOString().slice(0,10);
    if(tag==="giornaliera"&&list.some(x=>x.tag==="giornaliera"&&x.at.slice(0,10)===today))return;
    list.unshift({at:new Date().toISOString(),tag:tag||"manuale",v:APP_VER,w:(S.profile&&S.profile.w)||null,data});
    /* Le copie stanno nello stesso spazio dei dati veri: se lo riempissero,
       i salvataggi normali fallirebbero. Perciò si tengono al massimo 5 copie
       e comunque solo finché ci si sta comodi: alla prima difficoltà si
       scartano le più vecchie, e in caso estremo si rinuncia alla copia. */
    while(list.length>5)list.pop();
    for(;;){
      try{localStorage.setItem(SNAP_KEY,JSON.stringify(list));return;}
      catch(e){
        list.pop();
        if(!list.length){try{localStorage.removeItem(SNAP_KEY);}catch(_){}return;}
      }}
  }catch(e){}}
/* (rimosso wrapper ricorsivo: la function declaration è già globale) */
window.restoreSnap=async (i)=>{
  const list=snapshots(),s=list[i];if(!s)return;
  if(!await dlgConfirm(tr("Ripristino i dati salvati il {q}?",{q:new Date(s.at).toLocaleString(LANG==="en"?"en-GB":"it-IT")})+"\n\nI dati attuali vengono messi da parte in una nuova istantanea, così puoi tornare indietro."))return;
  snapSave("prima del ripristino");
  try{localStorage.setItem(KEY,s.data);location.reload();}
  catch(e){dlgAlert(tr("Ripristino non riuscito."));}};
let saveFailed=false;
/* ── ANNULLA ─────────────────────────────────────────────────────────
   Lo stato di PRIMA non va costruito: è già in memoria, è la stringa
   che stiamo per sovrascrivere. Costo zero, e vale per ogni azione
   dell'app senza toccare i cento punti che salvano. */
let UNDO={prima:null,at:0,testo:""};
window.undoDisponibile=()=>!!UNDO.prima;
/* All'avvio l'app salva da sola (migrazioni, allineamenti): quei
   salvataggi non sono azioni della persona e non devono risultare
   annullabili. Passata l'accensione, la memoria riparte pulita. */
setTimeout(()=>{UNDO={prima:null,at:0,testo:""};},1500);
window.annullaUltima=()=>{
  if(!UNDO.prima)return;
  try{
    const rip=UNDO.prima;
    UNDO={prima:null,at:0,testo:""};        /* si annulla una volta sola */
    localStorage.setItem(KEY,rip);
    const S2=JSON.parse(rip);
    Object.keys(S).forEach(k=>{delete S[k];});
    Object.keys(S2).forEach(k=>{S[k]=S2[k];});
    try{PLAN=S.customPlan||PLAN;}catch(e){}
    render(cur);
    toast(tr("Annullato"));
  }catch(e){toast(tr("Non sono riuscito ad annullare"));}};
function save(){S.meta.updated=new Date().toISOString();
  try{
    const prima=localStorage.getItem(KEY);
    if(prima){UNDO={prima:prima,at:Date.now(),testo:""};}
    localStorage.setItem(KEY,JSON.stringify(S));
    if(saveFailed){saveFailed=false;const b=document.getElementById("saveWarn");if(b)b.remove();}
    /* La Ruota si accende da sola: ogni salvataggio è la fine di un
       gesto vero, quindi è il momento giusto per guardare se una runa
       ha appena raggiunto la sua condizione. Costo: un giro su 24
       controlli, nessuna azione chiesta alla persona. */
    try{if(typeof ruotaDopoSalvataggio==="function")ruotaDopoSalvataggio();}catch(e){}
  }catch(e){
    /* Spazio esaurito: è la situazione più pericolosa (si continuerebbe a usare
       l'app senza che nulla venga registrato). Prima liberiamo le copie di
       sicurezza, poi — se non basta — avvisiamo in modo ben visibile. */
    try{localStorage.removeItem(SNAP_KEY);localStorage.setItem(KEY,JSON.stringify(S));return;}catch(e2){}
    if(!saveFailed){saveFailed=true;
      try{const b=document.createElement("div");b.id="saveWarn";
        b.style.cssText="position:fixed;left:8px;right:8px;bottom:86px;z-index:120;background:#B23B3B;color:#fff;padding:12px 16px;border-radius:12px;font-size:13px;line-height:1.4;box-shadow:0 8px 24px rgba(0,0,0,.3)";
        b.innerHTML=" "+trh("{b}: le modifiche non vengono salvate. Esporta subito un backup da Io e libera spazio.",{b:"<b>"+tr("Memoria del browser piena")+"</b>"});
        document.body.appendChild(b);}catch(e3){}}
  }
  // Drive: caricamento DIFFERITO. Non si sincronizza a ogni tocco ma al
  // massimo ogni SYNC_EVERY minuti (e comunque quando chiudi o metti in
  // secondo piano l'app). Meno chiamate, e una finestra di tempo per
  // accorgersi di un problema prima che finisca anche nel backup.
  driveSyncSoon();}
const SYNC_EVERY=15*60*1000;         // intervallo minimo fra due caricamenti
const SYNC_LAST_KEY="diarioDieta_v2_lastsync";
let drivePending=false;
function lastSyncAt(){try{return +localStorage.getItem(SYNC_LAST_KEY)||0;}catch(e){return 0;}}
function driveSyncSoon(){
  if(!(DTOKEN&&S.drive.on))return;
  drivePending=true;clearTimeout(driveTimer);
  const wait=Math.max(8000,SYNC_EVERY-(Date.now()-lastSyncAt()));
  driveTimer=setTimeout(()=>driveUpload(true),wait);}
function driveFlush(){ // caricamento immediato: chiusura app o richiesta esplicita
  if(drivePending&&DTOKEN&&S.drive.on){clearTimeout(driveTimer);driveUpload(true);}}
/* ═══ IL TEMA ═════════════════════════════════════════════════════
   Riattivato il 19/08/2026. Era bloccato su chiaro «finché il tema
   scuro non torna disponibile»: ma il CSS scuro c'era già, con i
   contrasti tarati uno per uno. Mancavano due gradienti, ora ci sono.

   Perché conta per QUESTA app più che per altre: il momento in cui
   Nuvia serve davvero sono le 19:20 — la sera. Un'app che a quell'ora
   spara un fondo bianco in faccia viene chiusa, e chi la chiude non
   segna il pasto.

   Tre scelte, e «auto» è il default: segue il telefono, che è la cosa
   che la persona ha già deciso una volta per tutte. */
function temaVoluto(){
  /* ═══ IL TEMA SCURO È SPENTO, ED È COLPA MIA ═══════════════════
     Il 19/08/2026 l'ho riattivato dopo aver misurato OTTO coppie di
     variabili di colore. Passavano tutte. Ma le variabili non sono
     l'interfaccia: i pulsanti hanno colori propri, bordi propri,
     stati propri — e sul telefono del founder erano illeggibili.
     LEZIONE: verificare le VARIABILI non è verificare la SCHERMATA.
     Un contrasto calcolato su due esadecimali dice che quei due
     colori stanno bene insieme, non che l'interfaccia funziona.
     Torna spento finché non sarà verificato su un telefono vero,
     pulsante per pulsante. Il CSS resta, pronto. */
  return "light";}
window.temaVoluto=temaVoluto;

window.temaSet=(t)=>{
  S.ui.theme=(t==="dark"||t==="light")?t:"auto";
  save();applyTheme();render(cur);};

function applyTheme(){
  const t=temaVoluto();
  document.documentElement.dataset.theme=t;
  /* la barra del telefono segue il tema: se resta verde chiaro sul
     fondo scuro si vede la cucitura */
  try{
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute("content",t==="dark"?"#0A1211":"#0C7C74");
    if(typeof tingiBarra==="function")tingiBarra();
  }catch(e){}
  /* Il colore dello studio dipende dal modo: quello leggibile su fondo
     chiaro non lo è su fondo scuro. Si riapplica a ogni cambio, così il
     giorno in cui il tema scuro torna disponibile non serve ricordarsi
     di aggiungere questa riga. */
  try{if(typeof cobrandApplica==="function")cobrandApplica();}catch(e){}}

