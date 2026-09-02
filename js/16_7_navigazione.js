/* ═══════════════════════════════════════════════════════════════
   7. NAVIGAZIONE
   ═══════════════════════════════════════════════════════════════ */
/* «costellazione» non è più una pagina (v15.5.0): è confluita in
   «ruota» — Il tuo percorso — che ora porta anche medaglia e Zen. */
const pages=["punto","oggi","ricette","spesa","sport","comestai","storico","mia","insieme","io","ruota","conto","sistema","regole","tools","guida","nuvia","documenti","setup","onb2","piani"];let cur="oggi";
/* L'intestazione è sticky: sta sempre in cima e copre i primi ~90 px.
   scrollIntoView non lo sa e infila il titolo della card sotto la barra.
   Qui si calcola l'altezza VERA dell'intestazione e si scorre di conseguenza,
   con un dito di respiro sopra: l'atterraggio cade dove guarda l'occhio. */
function portaInVista(el,extra){
  try{
    const h=document.querySelector("header");
    const alto=(h?h.getBoundingClientRect().height:0)+(extra||0)+14;
    const y=el.getBoundingClientRect().top+window.pageYOffset-alto;
    window.scrollTo({top:Math.max(0,Math.round(y)),behavior:"auto"});
  }catch(e){try{el.scrollIntoView({block:"start"});}catch(e2){}}}
window.portaInVista=portaInVista;
/* ═══ OGNI PAGINA PARTE DALL'ALTO, DAVVERO (founder, 02/09) ══════════
   «Anche questa pagina viene renderizzata più in basso. Controlla che
   tutte le pagine partano dall'alto sempre.»
   Lo `scrollTo(0,0)` c'era già, in show() e a ogni passo del percorso —
   e non bastava. Sul telefono lo scorrimento arriva DOPO: la tastiera
   che si chiude quando si lascia un campo cambia l'altezza della
   finestra e il browser «recupera» la posizione; il campo appena
   disegnato che riceve il fuoco viene portato in vista; l'animazione
   d'ingresso della carta ricalcola il layout. Uno scrollTo eseguito
   un istante prima di tutto questo viene semplicemente sovrascritto,
   e la pagina atterra sessanta pixel più in basso — con la barra
   dell'avanzamento nascosta sotto l'intestazione.
   Qui si fa la cosa completa: si toglie il fuoco (così la tastiera si
   chiude ADESSO, non dopo), si scorre subito, e si scorre di nuovo al
   frame successivo e a due riprese entro mezzo secondo — abbastanza
   perché ogni assestamento del browser sia già passato, e troppo poco
   perché una persona abbia già iniziato a scorrere da sé. */
function paginaInCima(){
  try{const a=document.activeElement;if(a&&a!==document.body&&a.blur)a.blur();}catch(e){}
  const su=()=>{try{window.scrollTo(0,0);}catch(e){}};
  su();
  try{requestAnimationFrame(su);}catch(e){}
  setTimeout(su,120);setTimeout(su,420);}
window.paginaInCima=paginaInCima;
/* ── LA VIA DEL RITORNO ────────────────────────────────────────────
   Le pagine della barra in basso sono quattro; tutte le altre (Io,
   Regole, Strumenti, Guida…) si aprono dal ⋯ e finora NON avevano un
   ritorno: nel browser il tasto indietro del telefono usciva dal sito,
   nell'header non c'era una freccia. Chi ci finiva — anche mandato
   dall'app stessa, com'è per il controllo dell'obiettivo — restava lì.

   Due cose, insieme: una cronologia vera (una voce per pagina, così il
   tasto di sistema naviga invece di uscire) e una freccia nell'header,
   che compare SOLO dove serve. */
const PAG_BARRA=["punto","oggi","sport","spesa"];
let storiaNav=[];          /* dove sono passato, senza doppioni di fila */
let storiaSalta=false;     /* sto tornando indietro: non registrare */

function fuoriBarra(p){
  return pages.includes(p)&&!PAG_BARRA.includes(p)
    &&p!=="onb2"&&p!=="setup";}

window.tornaIndietro=()=>{
  /* prima si chiude ciò che è aperto sopra la pagina */
  const foglio=document.getElementById("uiSheet");
  if(foglio&&!foglio.hidden){try{return sheetClose();}catch(e){}}
  const altre=document.getElementById("moreSheet");
  if(altre&&!altre.hidden){try{return moreClose();}catch(e){}}
  storiaNav.pop();                       /* la pagina corrente */
  const dove=storiaNav.pop()||"punto";   /* quella prima */
  storiaSalta=true;show(dove);storiaSalta=false;
  storiaNav.push(dove);};

/* Il tasto di sistema: nel browser passa da qui, nell'app nativa dal
   modulo Capacitor. Stessa regola, due strade. */
try{
  window.addEventListener("popstate",()=>{
    try{tornaIndietro();}catch(e){}
    try{history.pushState({nuvia:1},"");}catch(e){}});
  history.pushState({nuvia:1},"");
}catch(e){}

function show(p){
  /* Percorso guidato non finito: non si va da nessun'altra parte. Senza
     profilo l'app non sa nulla e ogni numero sarebbe inventato. */
  /* Percorso non finito: non si va da nessun'altra parte. Chi arriva
     nuovo incontra il flusso a dieci schermate; il percorso lungo resta
     raggiungibile (da Io) per chi vuole rifarlo con tutti i dettagli. */
  /* Un percorso solo (25/08): chiunque non abbia finito va in onb2,
     compreso chi era rimasto a metà del percorso vecchio.
     ── L'ECCEZIONE DEI DOCUMENTI (v15.7.0) ────────────────────────
     «documenti» passa anche a percorso non finito, e non è una
     comodità: il gate legale è la PRIMA schermata e chiede di
     accettare termini e privacy: se il link per leggerli riportasse
     al gate, si accetterebbe un testo che non si può aprire. Un
     consenso dato su un documento non consultabile non è un
     consenso. Il gate resta comunque invalicabile — da Documenti si
     torna indietro e si è ancora lì. */
  if(!S.onboard.done&&p!=="onb2"&&p!=="documenti")p="onb2";
  cur=p;pages.forEach(x=>document.getElementById("pg-"+x).classList.toggle("active",x===p));
  document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("on",b.dataset.p===p));
  {const mb=document.getElementById("hMore");
   if(mb)mb.classList.toggle("on",ALTRE.some(x=>x[0]===p));}
  /* la freccia compare solo fuori dalle quattro pagine della barra */
  {const bb=document.getElementById("hBack");
   if(bb)bb.hidden=!fuoriBarra(p);}
  if(!storiaSalta&&storiaNav[storiaNav.length-1]!==p){
    storiaNav.push(p);
    if(storiaNav.length>30)storiaNav.shift();}
  /* Ogni pagina si apre dall'alto: senza questo si eredita lo scorrimento
     della pagina precedente e si atterra a metà contenuto. */
  paginaInCima();
  document.body.classList.toggle("onb",!S.onboard.done);
  render(p);paginaInCima();}
/* La barra si costruisce da codice: alla prossima passata basta cambiare
   questa lista per passare da otto voci a quattro. */
/* Quattro voci. Le altre pagine non spariscono: si raggiungono dal menù
   «Altro» in alto, e nella passata successiva dall'assistente. */
/* Le quattro cose che si fanno tutti i giorni. Il nome della prima è
   quello della persona: è il suo punto della situazione. */
const TABS=[["punto","Punto"],
            ["oggi","Oggi"],["sport","Allenamento"],["spesa","Spesa"]];
/* Il resto: si apre dal ⋯ oppure chiedendolo all'assistente. Un nome solo
   per ciascuna, così la lista si legge in un colpo d'occhio. */
const ALTRE=[["ricette","Ricette","ricette"],["comestai","Come stai","heart"],["storico","Numeri","progressi"],
             ["tools","Strumenti","tools"],["regole","Regole","regole"],
             ["mia","La mia","star"],["insieme","Insieme","persone"],["io","Utente","io"],["ruota","Il tuo percorso","star"],["conto","Abbonamento","star"],["sistema","Sistema","gear"],["guida","Guida","guida"],["nuvia","Nuvia","nuvia"],["documenti","Documenti","guida"]];
/* ═══ L'ASSISTENTE ══════════════════════════════════════════════════
   Diciassette strumenti non si cercano: si chiedono. Qui la domanda viene
   riconosciuta e porta dove serve. Quando la domanda non è una richiesta
   di aiuto ma una vera domanda sull'app o su come è configurata, risponde
   l'AI con il contesto di ciò che l'utente ha impostato. */
/* ricotta al cambio lingua: il tr() qui dentro si valuta alla
   costruzione, e la costruzione si ripete quando la lingua cambia
   (registro I18N_RIFAI in 10_base) */
let ASSIST_MAP;
(window.I18N_RIFAI=window.I18N_RIFAI||[]).push(function(){ASSIST_MAP=[
 {p:"tools",a:"craveHack",k:["voglia","dolce","salato","croccante","cremoso","sgarr","tentazion","offert","torta","gelato"],t:"Ho una voglia"},
 {p:"tools",a:"volumeSOS",k:["fame","affamat","non mi sazia","poco cibo","vuoto lo stomaco"],t:"Fame incontrollabile"},
 {p:"tools",a:"grazing",k:["spilucc","piluccare","stuzzic"],t:"Voglio spiluccare"},
 {p:"tools",a:"bloatSOS",k:["gonfi","pancia","meteor","digest","pesant"],t:"Ridurre gonfiore"},
 {p:"tools",a:"calibraGiornata",k:["stanc","dormito male","stress","giornata storta","non ho energie","spossat"],t:"Calibra la giornata"},
 {p:"tools",a:"fuelPre",k:["allen","palestra","corsa","corro","partita","prima di allenar"],t:"Mi alleno tra poco"},
 {p:"tools",a:"predictive",k:["venerd","sabato","compleanno","cena aziendale","matrimonio","pizzeria","evento","festa"],t:"Bilanciamento predittivo"},
 {p:"tools",a:"fridge",k:["frigo","dispensa","congelator","cosa cucino","che c'è in casa","avanzi"],t:"Crea un piatto dal frigo"},
 {p:"tools",a:"mealPrep",k:["batch","cucinare in anticipo","preparare i pasti","domenica cucino"],t:"Cucina intelligente"},
 {p:"tools",a:"splitCook",k:["cucino per tutti","famiglia","pentola","figli","moglie","marito"],t:"Cucino per tutti"},
 {p:"tools",a:"coupleFork",k:["ospiti","vengono a cena","invitati","compromesso"],t:"Compromesso a tavola"},
 {p:"tools",a:"menuAI",k:["ristorante","menù","menu","trattoria","fuori a cena","pizzeria stasera","osteria","sushi stasera"],t:"Selezionatore di menù"},
 {p:"tools",k:["viaggio","trasferta","vacanza","sono a ","tipici","albergo"],t:"Piatti tipici del posto",a:"geoDishes"},
 {p:"tools",a:"scafAI",k:["scaffale","supermercato","quale prendo","quale compro","etichett","al super","corsia","marca","quale yogurt","quale pasta"],t:"Scaffale: quale prendere"},
 {p:"tools",a:"domicilioAI",k:["domicilio","consegn","delivery","ordino","ordinare","asporto","take away","glovo","deliveroo","just eat"],t:"Ordino a domicilio"},
 {p:"tools",a:"rapidoAI",k:["dieci minuti","10 minuti","non ho tempo","veloce","di corsa","al volo","poco tempo","rapido"],t:"Ho dieci minuti"},
 {p:"tools",a:"dopoAI",k:["giorno dopo","ieri sera","postumi","ho bevuto troppo","bevuto ieri","sbornia","alcol","serata pesante","hangover","dopo la festa"],t:"Il giorno dopo"},   /* «geoStart» non esiste più: la chiave doppia lo teneva in vita */
 {p:"spesa",k:["spesa","supermercat","lista","comprare","carrello"],t:"Spesa"},
 {p:"ricette",k:["piano","ricette","settimana","menu settimanale","cambiare i pasti","genera"],t:"Ricette",top:1},
 {p:"sport",k:["sport","camminata","registrare l'allenamento","quanto ho bruciato","allenamento","registrare un allenamento","palestra","ho corso","andato a correre","andato in palestra","vado in palestra","corsa","camminata","in bici","nuotato","workout"],t:"Allenamenti"},
 {p:"storico",k:["peso","pesata","progress","grafico","quanto ho perso","andamento","proiezione","settimane passate","mesi passati","riepilogo","le note che ho scritto","note del diario","scarica csv"],t:"Progressi",top:1},
 {p:"regole",k:["regole","formula","calcolo","proteine per kg","deficit","minimo calorico","soglia"],t:"Regole del calcolo",top:1},
 {p:"io",k:["profilo","altezza","obiettivo","peso obiettivo","vacanza","pesata"],t:"Il tuo profilo",top:1},
 {p:"sistema",k:["backup","chiave ai","chiave gemini","drive","impostazioni","sistema","telemetria","ripristino","esport"],t:"Sistema",top:1},
 {p:"guida",k:["guida",tr("come funziona"),"non capisco","aiuto","spiegami l'app"],t:"Guida",top:1},
 {p:"nuvia",k:["nuvia","funzioni dell'app","cosa sa fare","valori","missione","chi siete"],t:"Scopri Nuvia",top:1},
 /* Rotte aggiunte perché l'elenco copra i gesti veri dell'app, non solo
    gli strumenti: pesarsi, periodi, scontrino, backup, diario di oggi. */
 {p:"punto",k:["ribilancia","ribilanciare","ribilanciami","ribilanciamento","redistribuisci le calorie"],t:"Ribilancia la giornata",a:"recalibrateToday"},
 {p:"io",k:["pesarmi","pesata","registra il mio peso","registrare il peso","segna il mio peso","segnare il peso","mi sono pesato","quanto peso","sulla bilancia","salgo sulla bilancia"],t:"Nuova pesata",a:"saveWeighIn"},
 {p:"punto",k:["periodo","apri un periodo","inizio la dieta","fase","chiudi il periodo"],t:"Periodi",a:"periodoApri"},
 {p:"comestai",k:["come sto","come mi sento","umore","stress","fame nervosa","mi sento giù","ansia","sostegno","aiuto psicologico","abbuffata","mi sento in colpa"],t:"Come stai"},   /* «a» qui è l'ancora dell'atterraggio, non una funzione da chiamare */
 {p:"punto",k:["evento","il mio compleanno","oggi compleanno","giornata particolare","oggi festa","oggi è speciale"],t:tr("Evento del giorno"),a:"eventoScegli"},
 {p:"punto",k:["nota","scrivere una nota","diario di oggi","annotare"],t:tr("Nota del giorno"),a:"notaScrivi"},
 {p:"ricette",k:["scontrino","piano dalla spesa","dispensa","ho fatto la spesa","fotografa lo scontrino"],t:"Ricette dalla spesa",a:"scontrinoScan"},
 {p:"io",k:["vacanza","parto per le ferie","ferie","viaggio lungo"],t:"Modalità vacanza",a:"toggleVacanza"},
 {p:"sistema",k:["backup","drive","salvare i dati","sincronizza","esportare"],t:"Backup e Drive",a:"driveRestoreMenu"},
 {p:"sistema",k:["chiave","gemini","api key","attivare l'ai"],t:"Chiave AI (Gemini)",a:"saveAI"},
 {p:"oggi",k:["acqua","bicchieri","quanto ho bevuto"],t:"Acqua di oggi"}
];});
window.I18N_RIFAI[window.I18N_RIFAI.length-1]();
/* Normalizza per il confronto: minuscole e niente accenti, così
   «menù», «menu» e «MENU'» sono la stessa parola. */
function assistNorm(x){
  return String(x||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function assistFind(q){
  const t=assistNorm(q);
  if(!t.trim())return null;
  /* Prima si cerca sul testo SENZA l'impalcatura della domanda
     («come funziona», «cos'e», «mi spieghi»): il tema deve vincere
     sulla formula. Se spogliato non resta niente, si cerca sul testo
     intero e la formula generica porta alla Guida. */
  const nudo=t.replace(/\b(come funziona|come si usa|come faccio a?|come mai|cos ?e|che cos ?e|mi spieghi|spiegami|aiutami con|puoi dirmi|vorrei sapere)\b/g," ").trim();
  /* Le parole chiave si cercano come PAROLE INTERE, non come pezzi:
     «ribilanciami» conteneva «bilancia» e portava alla pesata,
     «sistemami» conteneva «sistema» e portava alle impostazioni.
     Una parola chiave può però stare all'inizio di una parola più
     lunga solo se è essa stessa una frase di più parole. */
  /* Alcune chiavi sono RADICI volute («allen» per allenamento/allenarsi,
     «gonfi» per gonfio/gonfiore, «progress» per progressi): devono poter
     stare all'inizio di una parola. Il divieto vale solo alla FINE: la
     chiave non può essere la coda di un'altra parola, ed è lì che
     nascevano gli scambi («ri-bilancia», «sistema-mi»). */
  /* Due famiglie di chiavi. Le RADICI («allen», «gonfi», «progress»)
     devono agganciare l'inizio di parole più lunghe. Le PAROLE PIENE
     («sistema», «bilancia», «piano») no: erano loro a produrre gli
     scambi, perché vivono dentro altre parole — «ri-bilancia-mi»,
     «sistema-mi» — e portavano la persona nel posto sbagliato. */
  const INTERE=["sistema","bilancia","ricette","peso","spesa","oggi","punto","regole","acqua","serie","fame"];
  const parola=(testo,kk)=>{
    if(kk.indexOf(" ")>=0)return testo.includes(kk);   /* frasi: confronto diretto */
    const esc2=kk.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    const re=INTERE.includes(kk)
      ? new RegExp("(^|[^a-z0-9])"+esc2+"([^a-z0-9]|$)")   /* parola intera */
      : new RegExp("(^|[^a-z0-9])"+esc2);                   /* radice */
    return re.test(testo);};
  const cerca=(testo)=>{let best=null,score=0;
    ASSIST_MAP.forEach(r=>{
      r.k.forEach(k=>{const kk=assistNorm(k);
        if(parola(testo,kk)&&kk.length>score){best=r;score=kk.length;}});});
    return best;};
  return (nudo&&cerca(nudo))||cerca(t);}
/* Ritrova una voce della mappa dal suo titolo (per la rotta suggerita
   dall'AI): confronto normalizzato e tollerante. */
function assistToolByLabel(lbl){
  const t=assistNorm(lbl);if(!t.trim())return -1;
  let hit=-1;
  ASSIST_MAP.forEach((r,i)=>{
    if(hit>-1)return;
    const rt=assistNorm(r.t);
    if(rt===t||rt.includes(t)||t.includes(rt))hit=i;});
  return hit;}
window.assistGo=(i)=>{
  const r=ASSIST_MAP[i];if(!r)return;
  assistClose();show(r.p);
  window.scrollTo(0,0);   /* partenza pulita: mai "viaggiare" dal fondo */
  /* L'atterraggio deve essere sul PUNTO giusto, non in cima alla pagina:
     prima si prova l'ancora esplicita, altrimenti si cerca la card il cui
     titolo corrisponde allo strumento, la si porta in vista e la si
     illumina un attimo, così l'occhio sa dove guardare. */
  if(r.top)return;   /* rotta di pagina intera: la cima È l'atterraggio */
  setTimeout(()=>{try{
    let el=r.a?document.querySelector('[onclick^="'+r.a+'"]'):null;
    if(!el){
      const t=assistNorm(r.t);
      const h=[...document.querySelectorAll('#pg-'+r.p+' h2, #pg-'+r.p+' h3')]
        .find(x=>{const n=assistNorm(x.textContent);return n.includes(t)||t.includes(n);});
      if(h)el=h.closest(".card")||h;
    }
    if(!el)return;
    portaInVista(el);   /* preciso e immediato: guida l'occhio l'evidenziazione, non il viaggio */
    /* Secondo passo correttivo: grafici e box AI finiscono di disporsi
       DOPO il primo scroll e spostano la card più in basso — si
       atterrava «all'altezza sbagliata». Qui si rimisura e si corregge,
       una volta sola, quando la pagina si è assestata. */
    setTimeout(()=>{try{portaInVista(el);}catch(e){}},700);
    el.style.transition="box-shadow .4s";
    el.style.boxShadow="0 0 0 3px var(--menta),0 10px 26px -18px rgba(10,78,73,.3)";
    setTimeout(()=>{el.style.boxShadow="";},1800);
  }catch(e){}},420);};
/* Quello che l'AI deve sapere per rispondere su COME È CONFIGURATA l'app */
function assistContext(){
  const p=S.profile||{};
  const righe=[
    "Sezioni dell'app: Oggi (pasti, acqua, come stai, allenamenti), Ricette (i 7 giorni), Spesa, Progressi (peso, grafici, storico), e dal pulsante ⋯ in alto: Strumenti, Allenamenti, Regole del calcolo, Il tuo profilo, Sistema (chiave AI, Drive, backup), Guida.",
    "Strumenti disponibili: "+ASSIST_MAP.filter(r=>r.a).map(r=>r.t).join(", ")+".",
    "Configurazione attuale della persona: obiettivo «"+(p.goal||"non impostato")+"»"+
      (goalWeightSet()?", peso obiettivo "+goalWeightSet()+" kg":"")+
      ", target di oggi "+dayTargetK()+" kcal, proteine "+dayTargetP()+" g, minimo calorico "+kcalFloorMin()+" kcal"+
      (cycPhase()?", fase della dieta: "+cycPhase()+" (giorno "+cycPhaseDay()+" di "+cycPhaseLen()+")":"")+
      (physDelta()?", stato fisiologico attivo: "+physNote():"")+".",
    (S.family&&S.family.length)?("In casa ci sono "+S.family.length+" familiari."):"Nessun familiare inserito.",
    ricetteVuote()?"Non ha ancora le ricette.":"Ha le ricette attive.",
    aiOn()?"":"Non ha inserito la chiave AI: molte funzioni sono spente."
  ];
  return righe.filter(Boolean).join(" ");}
/* ═══ PROMEMORIA ════════════════════════════════════════════════════
   Quattro momenti nella giornata. Oggi compaiono come avvisi dentro
   l'app; quando arriverà l'app installata diventeranno notifiche vere
   senza cambiare questa logica. Regole ferme: mai di notte, mai due di
   fila ignorati, mai complimenti automatici, mai colpevolizzare. */
/* ricotta al cambio lingua: il tr() qui dentro si valuta alla
   costruzione, e la costruzione si ripete quando la lingua cambia
   (registro I18N_RIFAI in 10_base) */
let NOTIF_LIV;
(window.I18N_RIFAI=window.I18N_RIFAI||[]).push(function(){NOTIF_LIV=[["poche",tr("Poche"),tr("Solo mattina e sera · 2 al giorno")],
                 ["normale",tr("Normali"),tr("Anche il pomeriggio · 3-4 al giorno")],
                 ["tutte",tr("Tutte"),tr("Anche ogni pasto · fino a 6")]];});
window.I18N_RIFAI[window.I18N_RIFAI.length-1]();
function notifCfg(){
  S.notif=Object.assign({liv:"normale",dalle:7,alle:22,giorni:[1,2,3,4,5,6,0],visti:{},saltati:0},S.notif||{});
  return S.notif;}
function notifOn(){return notifCfg().liv!=="mai";}
function notifSilenzio(){
  const c=notifCfg(),o=new Date().getHours();
  return o<(+c.dalle||7)||o>=(+c.alle||22);}
/* Il momento della giornata in cui siamo */
function notifMomento(){
  const o=new Date().getHours();
  if(o<10)return "mattina";
  if(o>=16&&o<18.5)return "pomeriggio";
  if(o>=20)return "sera";
  return "pasto";}
/* Un complimento si dà solo se è successo qualcosa di vero */
function notifMerito(di){
  const st=S.streak||{};
  if((+st.count||0)>0&&(+st.count||0)%7===0)return "Sette giorni di fila in linea. Non è fortuna.";
  const q=dayQuality(di);
  if(q!=null&&q>=85)return "Qualità "+q+"%: è la parte che conta più delle calorie.";
  return null;}
/* Il promemoria da mostrare adesso, o null */
function notifOra(di){
  const c=notifCfg();
  if(!notifOn()||notifSilenzio())return null;
  if(c.giorni.indexOf(new Date().getDay())<0)return null;
  if(!isToday())return null;
  const m=notifMomento();
  if(c.liv==="poche"&&(m==="pomeriggio"||m==="pasto"))return null;
  if(c.liv==="normale"&&m==="pasto")return null;
  const chiave=iso(new Date())+"_"+m;
  if(c.visti[chiave])return null;
  if((+c.saltati||0)>=2)return null;   /* due ignorati di fila: si tace */
  const eat=eatenOfDay(di),plan=plannedOfDay(di).k||dayTargetK();
  const dopo=pendingMeals(di),resta=Math.max(0,plan-eat.k);

  /* Il mattino NON ha un promemoria: il saluto in cima al Punto dice già
     com'è andata ieri e cosa aspetta oggi. Un riquadro che ripete quello
     che sta due centimetri sopra è rumore. */
  if(m==="mattina")return null;

  if(m==="pomeriggio"){
    if(!dopo.length)return null;
    const cena=dopo[dopo.length-1];
    return {k:chiave,t:"Come va",
      d:"Restano "+resta+" kcal e "+(cena.d?"la cena è da "+Math.round(cena.k||0):"resta la cena"),
      d2:resta>=(cena.k||0)?"Sei comodo.":"Serve un occhio: la cena da sola non ci sta.",
      a:resta>=(cena.k||0)?null:["Sistema la giornata","rebalance("+di+")"]};}

  if(m==="sera"){
    if(dopo.length>1)return null;
    const q=dayQuality(di),merito=notifMerito(di);
    return {k:chiave,t:"Giornata chiusa",
      d:(eat.k<=plan?"Sei rimasto in linea":"Sei andato un po' sopra")+
        (q!=null?", qualità "+q+"%":"")+". "+(merito||""),
      a:["Guarda il bilancio","show('oggi')"]};}

  if(dopo.length){const p=dopo[0];
    return {k:chiave,t:esc(p.slot||"Prossimo pasto"),
      d:esc(p.d||"")+" · "+Math.round(p.k||0)+" kcal",
      a:["L'ho mangiato","tgl("+p.pdi+","+p.mi+")"]};}
  return null;}
window.notifVisto=(k,fatto)=>{
  const c=notifCfg();c.visti[k]=1;
  c.saltati=fatto?0:(+c.saltati||0)+1;
  save();render("oggi");};
window.notifLiv=(v)=>{notifCfg().liv=v;notifCfg().saltati=0;save();render(cur);
  const d=NOTIF_LIV.find(x=>x[0]===v);toast(d?d[1]+" · "+d[2]:"Aggiornato");};
window.notifOre=()=>{
  const a=document.getElementById("nfDalle"),b=document.getElementById("nfAlle");
  if(!a||!b)return;
  const c=notifCfg();c.dalle=Math.max(0,Math.min(23,+a.value||7));c.alle=Math.max(1,Math.min(24,+b.value||22));
  save();toast(tr("Silenzio dalle {a} alle {b}",{a:c.alle,b:c.dalle}));};
/* ═══ QUANTO VUOI VEDERE ════════════════════════════════════════════
   Tre livelli di DENSITÀ, non di funzioni: nulla diventa irraggiungibile,
   cambia solo cosa è in vista. Chi comincia parte da «essenziale» per non
   annegare; ogni tanto l'app chiede se vuole vedere di più o di meno. */
/* ricotta al cambio lingua: il tr() qui dentro si valuta alla
   costruzione, e la costruzione si ripete quando la lingua cambia
   (registro I18N_RIFAI in 10_base) */
let DENS;
(window.I18N_RIFAI=window.I18N_RIFAI||[]).push(function(){DENS=[
  ["base","Essenziale",tr("Cosa mangi, quanto pesi. Il bilancio in 4 numeri.")],
  ["full","Completo",tr("Anche macro e fibre, come stai, periodo e fasi della dieta.")],
  ["expert","Esperto",tr("Anche recupero degli sfori, saldo fisiologico e tutte le formule.")]];});
window.I18N_RIFAI[window.I18N_RIFAI.length-1]();
/* Cosa compare a ogni livello — l'elenco vale sia per la logica sia per
   la spiegazione mostrata all'utente, così non possono divergere. */
/* ricotta al cambio lingua: il tr() qui dentro si valuta alla
   costruzione, e la costruzione si ripete quando la lingua cambia
   (registro I18N_RIFAI in 10_base) */
let DENS_COSA;
(window.I18N_RIFAI=window.I18N_RIFAI||[]).push(function(){DENS_COSA={
  base:[tr("I pasti e le spunte"),tr("La spesa"),tr("Il peso e l'andamento"),
        tr("Il bilancio essenziale: deficit, calorie, proteine, qualità"),
        tr("Acqua e allenamenti"),tr("L'assistente")],
  full:[tr("Il bilancio completo: carboidrati, grassi, fibre, zuccheri"),
        tr("Come stai: sonno, relax, umore, cali di energia"),
        tr("Stati del corpo: ciclo, infortunio, malattia, digiuno"),
        tr("Periodo ed evento del giorno"),tr("Fasi della dieta in Regole")],
  expert:[tr("Ribilancia i giorni prima (recupero degli sfori)"),
          tr("Saldo fisiologico di oggi"),tr("Tutte le formule di calcolo"),
          tr("Peso di riferimento e proteine intoccabili")]};});
window.I18N_RIFAI[window.I18N_RIFAI.length-1]();
function dens(){const v=S.ui&&S.ui.dens;return (v==="full"||v==="expert")?v:"base";}
function densMin(l){const o={base:0,full:1,expert:2};return o[dens()]>=o[l];}
window.densSet=(v)=>{
  S.ui.dens=v;S.ui.densChiesto=iso(new Date());save();render(cur);
  /* Il livello si cambia in Profilo, ma l'effetto si vede altrove: senza
     dirlo sembra che il comando non faccia niente. */
  const dove={base:"Bilancio con 4 numeri · formule nascoste",
              full:"Bilancio completo con macro e fibre",
              expert:"Tutto in vista, formule comprese"}[v]||"";
  toast(dove+" — lo vedi in "+(((S.profile.name||"").trim().split(" ")[0])||"Punto")+" e in Regole");};
/* Ogni tre settimane: «vuoi vedere di più, o preferisci più semplice?» */
function densNudge(){
  if(!S.onboard.done)return false;
  const g=+S.tel.giorni||0;
  if(g<8)return false;
  const u=S.ui.densChiesto||"";
  if(!u)return true;
  const d=safeDate(u+"T12:00:00");
  return !d||((new Date()-d)/864e5)>=21;}
window.densNudgeNo=()=>{S.ui.densChiesto=iso(new Date());save();render("oggi");};
window.assistOpen=()=>{
  const w=document.getElementById("askSheet");if(!w)return;
  ASKMENU_G=null;ASKMENU_APERTO=false;
  assistRender();w.hidden=false;requestAnimationFrame(()=>w.classList.add("on"));
  /* niente focus automatico: la tastiera copriva mezzo pannello prima
     ancora di aver letto le opzioni */};
window.assistClose=()=>{
  const w=document.getElementById("askSheet");if(!w)return;
  w.classList.remove("on");setTimeout(()=>{w.hidden=true;},220);};
let ASKLOG=[];
/* ── Elenco guidato ────────────────────────────────────────────────
   La porta d'ingresso non è più una chat da riempire: è un elenco di
   bisogni scritti come li direbbe una persona («Ho fame fuori orario»),
   ognuno agganciato allo strumento esatto. Si sceglie e si atterra.
   Il testo libero resta sotto, per chi preferisce scrivere. */
/* ricotta al cambio lingua: il tr() qui dentro si valuta alla
   costruzione, e la costruzione si ripete quando la lingua cambia
   (registro I18N_RIFAI in 10_base) */
let ASSIST_MENU;
(window.I18N_RIFAI=window.I18N_RIFAI||[]).push(function(){ASSIST_MENU=[
 ["Mangiare adesso",[
   ["Ho una voglia improvvisa","Ho una voglia"],
   ["Ho fame fuori orario","Fame incontrollabile"],
   ["Continuo a spiluccare","Voglio spiluccare"],
   ["Cosa cucino con quello che ho in casa?","Crea un piatto dal frigo"],
   ["Sono al ristorante: cosa scelgo?","Selezionatore di menù"]]],
 ["Situazioni",[
   ["Mi alleno tra poco","Mi alleno tra poco"],
   ["Ho un evento in vista (cena, festa)","Bilanciamento predittivo"],
   ["Stasera ho ospiti","Compromesso a tavola"],
   ["Cucino per tutta la famiglia","Cucino per tutti"],
   ["Sono in viaggio","Piatti tipici del posto"],
   ["Giornata storta, poche energie","Calibra la giornata"],
   ["Mi sento gonfio","Ridurre gonfiore"],
   ["Voglio cucinare in anticipo","Cucina intelligente"],
   ["Oggi è un giorno particolare (evento)",tr("Evento del giorno")],
   ["Scrivere la nota del giorno",tr("Nota del giorno")],
   ["Segnare l'acqua che ho bevuto","Acqua di oggi"]]],
 ["Ricette e spesa",[
   ["Vedere o cambiare le ricette","Ricette"],
   ["La lista della spesa","Spesa"],
   ["Ho fatto la spesa: fotografo lo scontrino","Ricette dalla spesa"]]],
 ["Corpo e progressi",[
   ["Registrare una pesata","Nuova pesata"],
   ["Peso, grafici e progressi","Progressi"],
   ["Registrare un allenamento","Allenamenti"],
   ["Aprire o gestire un periodo","Periodi"],
   ["Parto per una vacanza","Modalità vacanza"],
   ["Profilo e obiettivi","Il tuo profilo"]]],
 ["App",[
   ["Come vengono calcolati i numeri","Regole del calcolo"],
   ["Backup, chiave AI, impostazioni","Sistema"],
   ["Backup e Google Drive","Backup e Drive"],
   ["Chiave AI (Gemini)","Chiave AI"],
   ["Come funziona l'app","Guida"],
   ["Cosa sa fare Nuvia","Scopri Nuvia"]]]];});
window.I18N_RIFAI[window.I18N_RIFAI.length-1]();
/* Drill-down a livelli: prima i gruppi, un tocco apre le domande del
   gruppo, un tocco sulla domanda porta allo strumento. Niente tendine
   di sistema: tutto toccabile, con "Indietro" per risalire. */
let ASKMENU_G=null;                       /* null = livello gruppi */
window.assistMenuOpen=(gi)=>{ASKMENU_G=gi;assistRender();};
window.assistMenuBack=()=>{ASKMENU_G=null;assistRender();};
window.assistMenuGo=(lbl,tool)=>{
  const ti=assistToolByLabel(tool);
  if(ti<0)return;
  /* Navigazione pulita: la scelta dal menù NON lascia messaggi in chat.
     La cronologia resta solo per le conversazioni scritte. */
  ASKMENU_G=null;
  assistGo(ti);};
window.assistClear=()=>{ASKLOG=[];ASKMENU_G=null;ASKMENU_APERTO=false;assistRender();};
function assistMenuHTML(){
  if(ASKMENU_G==null){
    return `<div class="askmenu"><label style="margin-top:4px">${tr("Cosa ti serve?")}</label>`+
      ASSIST_MENU.map(([g,voci],gi)=>{
        const n=voci.filter(v=>assistToolByLabel(v[1])>-1).length;
        return `<button class="shrow" style="margin:8px 0;padding:12px 16px" onclick="assistMenuOpen(${gi})"><b style="font-size:14.5px;margin:0">${esc(g)}</b><small>${n} opzioni</small></button>`;}).join("")+
      `<div class="hint" style="margin-top:8px">${tr("Oppure scrivimi qui sotto con parole tue.")}</div></div>`;}
  const [g,voci]=ASSIST_MENU[ASKMENU_G];
  return `<div class="askmenu">
    <button class="glink" onclick="assistMenuBack()">‹ Indietro</button>
    <label style="margin-top:8px">${esc(g)}</label>`+
    voci.filter(v=>assistToolByLabel(v[1])>-1)
        .map(v=>`<button class="shrow" style="margin:8px 0;padding:12px 16px" onclick="assistMenuGo('${v[0].replace(/'/g,"\\'")}','${v[1].replace(/'/g,"\\'")}')"><b style="font-size:13px;margin:0;font-weight:600">${esc(v[0])}</b></button>`).join("")+
    `</div>`;}
let ASKMENU_APERTO=false;
window.assistMenuTog=()=>{ASKMENU_APERTO=!ASKMENU_APERTO;assistRender();};
function assistRender(){
  const b=document.getElementById("askBody");if(!b)return;
  const conversa=ASKLOG.length>0;
  /* Con una conversazione in corso il pannello si allarga e l'elenco
     guidato si ritira dietro un bottone: quello che hai chiesto e la
     risposta devono essere la prima cosa che vedi. */
  const box=document.querySelector(".asksheet");
  if(box)box.classList.toggle("conversa",conversa);
  const menu=(!conversa||ASKMENU_APERTO)?assistMenuHTML():"";
  const tasto=conversa?`<button class="askmenu-tog" aria-expanded="${ASKMENU_APERTO?"true":"false"}" onclick="assistMenuTog()">${ASKMENU_APERTO?"▾ ":"▸ "}${tr("Cosa ti serve? Scegli dall'elenco")}</button>`:"";
  b.innerHTML=
    (conversa?ASKLOG.map(m=>`<div class="askmsg ${m.me?"me":""}">${m.me?esc(m.t):m.t}</div>`).join("")
      :`<div class="askmsg">${trh("Ciao{v1}. Cosa ti serve adesso?",{v1:(S.profile.name?" "+esc(S.profile.name.split(" ")[0]):"")})}</div>`)+
    (conversa?`<div style="text-align:right;margin:4px 0"><button class="glink" onclick="assistClear()">${tr("Pulisci la chat")}</button></div>`:"")+
    tasto+menu;
  b.scrollTop=b.scrollHeight;}
/* Una DOMANDA non è un comando: «come funziona la spesa?» vuole una
   risposta, non essere teletrasportati sulla pagina Spesa. Le domande
   vanno all'AI (con il bottone del tool come scorciatoia); i comandi
   secchi — «ho fame», «spesa» — continuano a portare dritti al posto. */
function assistIsQuestion(t){
  const n=assistNorm(t).trim();
  return /\?\s*$/.test(t)||/^(come|perche|cosa|che |chi |quanto|quanti|quante|quando|dove|posso|devo|puoi|mi spieghi|spiegami|perch)/.test(n);}
/* ── L'AGENTE CHE AGISCE ─────────────────────────────────────────────
   Fin qui l'assistente indicava la strada; adesso la percorre. Due
   paletti che non si toccano: niente si muove senza un tocco di
   conferma, e ogni azione passa dal salvataggio normale — quindi
   «Annulla» la riporta indietro come qualsiasi altra cosa. */
const AZIONI=[
 {k:"ribilancia",t:"ribilanciare le calorie che restano oggi",
  q:"Ridistribuisco le calorie rimaste sui pasti che non hai ancora fatto.",f:()=>recalibrateToday()},
 {k:"lista",t:"rifare la lista della spesa dalle ricette",
  q:"Ricostruisco la lista della spesa dai pasti dei prossimi sette giorni.",f:()=>genShop()},
 {k:"programma",t:"costruire il programma di allenamento della settimana",
  q:"Preparo la settimana di allenamenti sui tuoi sport e sul recupero di questi giorni.",f:()=>trainerAI()},
 {k:"vacanza",t:"attivare o disattivare la modalita vacanza",
  q:"Sospendo deficit e serie: l'app resta un diario finche non la riattivi.",f:()=>toggleVacanza()},
 {k:"schemi",t:"analizzare i miei schemi e dirmi cosa fare",
  q:"Guardo gli schemi delle tue giornate e ti dico su cosa intervenire.",f:()=>{show("comestai");if(typeof schemiAI==="function")schemiAI();}}
];
function azioniPerAI(){return AZIONI.map(a=>a.k+" = "+a.t);}

/* ── IL PIANO D'AZIONE ───────────────────────────────────────────────
   Una richiesta vera contiene più cose: «stasera cena fuori e domani mi
   alleno» sono due mosse, in un ordine preciso. L'agente le mette in
   fila e le MOSTRA prima di toccare qualcosa: la persona vede cosa sta
   per succedere e può fermarlo. Non è burocrazia — è la differenza fra
   uno strumento e una cosa che decide al posto tuo. */
let PIANO_AZIONI=null;
window.assistPiano=async(richiesta)=>{
  if(!aiOn())return false;
  try{
    const j=await aiQuiet(()=>aiAskJSON(
      "L'utente chiede: \""+String(richiesta).slice(0,400)+"\". "+
      "Queste sono le azioni che posso eseguire nell'app: "+azioniPerAI().join("; ")+". "+
      "Scegli QUALI servono davvero e in quale ORDINE (spesso ne basta una, a volte nessuna). "+
      "Non inventare azioni che non sono nell'elenco. "+
      'Rispondi SOLO JSON: {"passi":[{"k":"chiave","perche":"in massimo 10 parole perché serve"}],"nota":"una riga, o vuota"}',"piano"));
    const passi=((j&&j.passi)||[]).filter(x=>x&&AZIONI.some(a=>a.k===x.k)).slice(0,4);
    if(!passi.length)return false;
    PIANO_AZIONI={passi:passi,i:0,nota:(j&&j.nota)||""};
    ASKLOG.push({t:assistPianoHTML()});assistRender();
    return true;
  }catch(e){return false;}};
function assistPianoHTML(){
  const p=PIANO_AZIONI;if(!p)return "";
  const righe=p.passi.map((x,i)=>{
    const a=AZIONI.find(y=>y.k===x.k)||{};
    return (i+1)+". <b>"+esc(a.t||x.k)+"</b>"+(x.perche?" — "+esc(x.perche):"");}).join("<br>");
  return "<b>"+esc(tr("Ecco cosa farei"))+"</b><br>"+righe+
    (p.nota?"<br><i>"+esc(p.nota)+"</i>":"")+
    '<div class="mtools" style="margin-top:12px">'+
    '<button class="btn small" onclick="assistPianoVai()">'+esc(tr("Fai tutto"))+'</button>'+
    '<button class="btn ghost small" onclick="assistPianoPasso()">'+esc(tr("Uno alla volta"))+'</button>'+
    '<button class="btn ghost small" onclick="assistPianoStop()">'+esc(tr("Lascia stare"))+'</button></div>';}
window.assistPianoStop=()=>{PIANO_AZIONI=null;ASKLOG.push({t:esc(tr("Va bene, non tocco niente."))});assistRender();};
/* «Uno alla volta»: esegue il primo e si ferma, così si vede l'effetto
   prima di procedere. È il modo giusto quando le azioni cambiano dati. */
window.assistPianoPasso=()=>{
  const p=PIANO_AZIONI;if(!p||!p.passi[p.i])return assistPianoStop();
  const x=p.passi[p.i],a=AZIONI.find(y=>y.k===x.k);
  p.i++;
  const restano=p.passi.length-p.i;
  ASKLOG.push({t:esc(tr("Faccio:"))+" <b>"+esc(a.t)+"</b>."+
    (restano?"<br>"+esc(tr("Poi restano {n} passi: riaprimi quando vuoi.",{n:restano})):"")});
  assistRender();
  setTimeout(()=>{try{assistClose();}catch(e){}
    try{a.f();}catch(e){toast(tr("Non sono riuscito a farlo."));}},150);};
window.assistPianoVai=async()=>{
  const p=PIANO_AZIONI;if(!p)return;
  ASKLOG.push({t:esc(tr("Vado. Ogni passo si può annullare dal messaggio in fondo."))});
  assistRender();assistClose();
  for(const x of p.passi){
    const a=AZIONI.find(y=>y.k===x.k);if(!a)continue;
    try{await a.f();}catch(e){toast(tr("Mi sono fermato su: ")+a.t);break;}
    await new Promise(r=>setTimeout(r,400));   /* un respiro fra un'azione e l'altra */
  }
  PIANO_AZIONI=null;
  toast(tr("Fatto tutto"));};
window.assistFai=(k)=>{
  const a=AZIONI.find(x=>x.k===k);if(!a)return;
  ASKLOG.push({t:esc(tr("Fatto. Se non era quello che volevi, premi Annulla nel messaggio in fondo."))});
  assistRender();
  setTimeout(()=>{try{assistClose();}catch(e){}
    try{a.f();}catch(e){toast(tr("Non sono riuscito a farlo."));}},150);};
function assistAzioneHTML(a){
  return '<div style="margin-top:12px"><b>'+esc(tr("Posso farlo io"))+'</b><br>'+esc(a.q)+
    '<div class="mtools" style="margin-top:8px">'+
    '<button class="btn small" onclick="assistFai(\''+a.k+'\')">'+esc(tr("Fallo"))+'</button>'+
    '<button class="btn ghost small" onclick="assistRender()">'+esc(tr("No, grazie"))+'</button></div></div>';}
window.assistSay=(t)=>{
  const i=document.getElementById("askIn");
  if(i&&!t){t=i.value.trim();if(!t)return;i.value="";}
  ASKLOG.push({me:1,t:t});assistRender();
  /* Richiesta con PIÙ cose dentro («stasera cena fuori e domani mi
     alleno»): prima si prova a costruire un piano d'azione, che è
     l'unica risposta sensata quando le mosse sono due o tre. */
  if(aiOn()&&assistMultipla(t)){
    assistPiano(t).then(fatto=>{ if(!fatto)assistProsegui(t); });
    return;}
  assistProsegui(t);};
/* Segnali che la richiesta contiene più mosse: congiunzioni fra due
   verbi/momenti diversi. Meglio pochi falsi positivi: se sbaglia, il
   piano torna vuoto e si prosegue come prima. */
function assistMultipla(t){
  const n=assistNorm(t);
  if(n.split(/\s+/).length<6)return false;
  return /(^|\s)(e poi|poi|inoltre|dopo|domani|stasera|stanotte|nel weekend)(\s|$)/.test(n)
      && /(^|\s)(e|ma|pero|mentre|quindi)(\s|$)/.test(n);}
function assistProsegui(t){
  const r=assistFind(t);
  const domanda=assistIsQuestion(t);
  if(r&&!domanda){
    ASKLOG.push({t:"Ti porto su <b>"+esc(r.t)+"</b>."});assistRender();
    /* Stesso atterraggio del pulsante: ancora esplicita, poi la card col
       titolo giusto, doppio scroll correttivo (i grafici si assestano
       dopo) ed evidenzia. Prima qui c'era una versione ridotta: un solo
       scroll, nessuna correzione — ed era l'atterraggio «all'altezza
       sbagliata». Una strada sola, non due copie. */
    setTimeout(()=>assistGo(ASSIST_MAP.indexOf(r)),700);
    return;}
  if(!aiOn()){
    if(r){/* senza AI la domanda non si può discutere, ma il posto giusto sì */
      const ti=ASSIST_MAP.indexOf(r);
      ASKLOG.push({t:"Senza chiave AI non posso rispondere a parole, ma la risposta sta qui:<div style=\"margin-top:12px\"><button class=\"btn small\" onclick=\"assistGo("+ti+")\">Apri: "+esc(r.t)+" ›</button></div>"});
      return assistRender();}
    ASKLOG.push({t:"Non ho capito, e senza chiave AI non posso ragionarci. Prova con una parola più semplice — «fame», «spesa», «peso» — oppure apri la <b>Guida</b>."});
    return assistRender();}
  ASKLOG.push({wait:1,t:'<span class="askwait">Ci penso…</span>'});assistRender();
  /* L'AI non risponde più solo a parole: classifica il bisogno e, se
     esiste lo strumento giusto, la risposta arriva con il bottone che
     ci porta. La chat è un centralino, non un oracolo. */
  /* Gli ultimi scambi entrano nel prompt: «e per la cena?» dopo una
     risposta sul pranzo deve avere un senso, non ripartire da zero. */
  const storia=ASKLOG.slice(0,-2).slice(-6)
    .map(m=>(m.me?"Utente: ":"Assistente: ")+String(m.t).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,180))
    .filter(x=>x.length>10).join(" || ");
  /* ── Domande a step ────────────────────────────────────────────
     Se il bisogno è ambiguo («ho un problema col cibo» può voler dire
     fame, sgarro, spesa vuota…), l'AI non tira a indovinare: fa UNA
     domanda breve con 2-4 opzioni toccabili. L'opzione toccata rientra
     nel giro come messaggio, con tutta la storia dietro. Massimo due
     giri di chiarimento, poi si sceglie comunque uno strumento. */
  /* conta i chiarimenti consecutivi: salta i messaggi dell'utente e il
     segnaposto "Ci penso…", si ferma alla prima risposta vera */
  const giri=(function(){let n=0;for(let i=ASKLOG.length-1;i>=0;i--){const m=ASKLOG[i];if(m.me||m.wait)continue;if(m.ask)n++;else break;}return n;})();
  aiQuiet(()=>aiAsk("Sei l'assistente dell'app Nuvia e rispondi "+((typeof LANG!=="undefined"&&LANG==="en")?"in English":"in italiano")+", in massimo 3 frasi, con tono pratico e amichevole. "+
    "Rispondi SOLO su Nuvia, su come è configurata per questa persona e su cosa può fare con l'app. "+
    "Questo è l'elenco degli strumenti e delle sezioni, con il loro nome esatto: "+
    JSON.stringify(ASSIST_MAP.map(r=>r.t))+". "+
    "Se il bisogno espresso si risolve con UNO di questi, indicane il nome esatto nel campo tool; se nessuno c'entra davvero, tool resta vuoto. "+
    "SE il bisogno è ambiguo tra più strumenti o manca un dettaglio decisivo per scegliere, NON indovinare: "+
    'lascia tool vuoto e compila ask (una sola domanda, max 12 parole) e opts (2-4 opzioni brevissime, max 5 parole ciascuna, concrete e mutuamente esclusive). '+
    "Domande di chiarimento già fatte in questo giro: "+giri+" su 2 massime"+(giri>=2?" — LIMITE RAGGIUNTO: ora scegli lo strumento più probabile, ask deve restare vuota":"")+". "+
    "Posso anche ESEGUIRE queste azioni al posto suo: "+JSON.stringify(azioniPerAI())+". "+
    "Se il messaggio chiede chiaramente una di queste, mettine il testo ESATTO nel campo azione; altrimenti azione resta vuota. "+
    "Non proporre azioni non richieste: se sta solo chiedendo una spiegazione, azione vuota. "+
    "Contesto: "+assistContext()+
    (storia?(" Conversazione fin qui: "+storia+"."):"")+
    ' Messaggio: «'+t+'». Rispondi SOLO JSON: {"reply":"2-3 frasi o vuota se fai una domanda","tool":"nome esatto o stringa vuota",\"azione\":\"testo esatto o stringa vuota\","ask":"domanda o stringa vuota","opts":["…"] o []}'))
  .then(r2=>{
    ASKLOG.pop();
    let reply="",ti=-1,ask="",opts=[],az=null;
    try{const j=parseAIJSON(r2);
      reply=String(j.reply||"").trim();ti=assistToolByLabel(j.tool);
      az=AZIONI.find(x=>x.t===String(j.azione||"").trim())||null;
      ask=String(j.ask||"").trim();
      opts=(Array.isArray(j.opts)?j.opts:[]).map(x=>String(x).trim()).filter(Boolean).slice(0,4);
    }catch(_){}
    if(ask&&opts.length>=2&&giri<2){
      /* giro di chiarimento: domanda + opzioni toccabili nel messaggio */
      const chips=opts.map(o=>`<button class="askchip" onclick="assistSay('${o.replace(/'/g,"\\'")}')">${esc(o)}</button>`).join("");
      ASKLOG.push({ask:1,t:(reply?esc(reply)+"<br>":"")+"<b>"+esc(ask)+"</b><div class=\"askchips\" style=\"margin-top:8px\">"+chips+"</div>"});
      return assistRender();}
    if(!reply)reply=String(r2||"").trim();
    let msg=esc(reply).replace(/\n/g,"<br>");
    if(az)msg+=assistAzioneHTML(az);
    else if(ti>-1)msg+='<div style="margin-top:12px"><button class="btn small" onclick="assistGo('+ti+')">Apri: '+esc(ASSIST_MAP[ti].t)+' ›</button></div>';
    ASKLOG.push({t:msg});assistRender();})
  .catch(()=>{ASKLOG.pop();ASKLOG.push({t:"Non sono riuscito a rispondere. Riprova fra poco."});assistRender();});};
window.moreOpen=()=>{
  const w=document.getElementById("moreSheet"),l=document.getElementById("moreList");
  if(!w||!l)return;
  /* ══ L'ANNULLA AVEVA PERSO IL SUO BOTTONE (audit 27/08) ══════════
     La presentazione promette: «ogni azione lascia un Annulla». Il
     motore c'è ed è completo (`annullaUltima`, in 11_2): tiene lo
     stato di PRIMA, si annulla una volta sola, e all'avvio si azzera
     perché le migrazioni non sono azioni della persona.

     Aveva però un solo modo di raggiungerlo: il cartellino in fondo
     allo schermo. Spenti i popup (25/08), la funzione è rimasta viva e
     irraggiungibile — cioè, per chi usa l'app, inesistente.

     Adesso vive qui, in cima al pannello «⋯»: compare SOLO quando c'è
     davvero qualcosa da annullare, e dice cosa. Niente cartellini, e
     niente promessa vuota: si torna indietro da un posto che c'è
     sempre, invece che da uno che spariva dopo otto secondi. */
  const undo=(typeof undoDisponibile==="function"&&undoDisponibile())
    ? `<button class="sheetrow" title="${esc(tr("Annulla l'ultima modifica"))}" onclick="moreClose();setTimeout(annullaUltima,120)">${ic("undo",20)}<span>${tr("Annulla l'ultima modifica")}</span><em>›</em></button>`
    : "";
  l.innerHTML='<div class="sheethd">Altre sezioni</div>'+undo+
    ALTRE.map(([p,lab,icn])=>`<button title="${tr("Apri")}" class="sheetrow" onclick="moreGo('${p}')">${ic(icn,20)}<span>${tr(lab)}</span><em>›</em></button>`).join("");
  w.hidden=false;requestAnimationFrame(()=>w.classList.add("on"));};
window.moreClose=()=>{
  const w=document.getElementById("moreSheet");if(!w)return;
  w.classList.remove("on");setTimeout(()=>{w.hidden=true;},220);};
window.moreGo=(p)=>{moreClose();setTimeout(()=>show(p),120);};
/* ═══ BOTTOM SHEET GENERICO ═══════════════════════════════════════
   Sostituisce le catene di popup (apri/chiudi periodo, aggiungi
   supermercato, nota del giorno): un pannello solo, con un form vero.
   Usa lo stesso CSS del pannello «Altre sezioni». */
window.sheetClose=()=>{
  const _s=document.getElementById("uiSheet");
  if(_s&&_s._libera){try{_s._libera();}catch(e){}}
  const w=document.getElementById("uiSheet");if(!w)return;
  w.classList.remove("on");setTimeout(()=>{try{w.remove();}catch(_){}} ,240);};
function sheetShow(title,html){
  const old=document.getElementById("uiSheet");if(old)old.remove();
  const w=document.createElement("div");
  w.id="uiSheet";w.className="sheet";
  w.innerHTML=`<div class="sheetbg" onclick="sheetClose()"></div>
    <div class="sheetbox" role="dialog" aria-modal="true" aria-label="${esc(title||"")}">
      <div class="sheetgrab"></div>
      ${title?`<div class="sheethd">${esc(title)}</div>`:""}
      <div class="sheetbody">${html}</div></div>`;
  document.body.appendChild(w);
  requestAnimationFrame(()=>w.classList.add("on"));
  w._libera=focusTrap(w.querySelector(".sheetbox"));   /* tastiera: si resta dentro */
  /* La maniglia si trascina davvero: il foglio segue il dito e si
     chiude se scende oltre un quarto, o con un gesto veloce. Senza
     questo la maniglia è un disegno che promette qualcosa che non fa. */
  try{if(typeof foglioTrascinabile==="function"){
    const box=w.querySelector(".sheetbox");
    const gr=w.querySelector(".sheetgrab");
    if(gr)gr.classList.add("sheet-maniglia");
    foglioTrascinabile(box,()=>sheetClose());}}catch(e){}
  return w;}
/* La prima voce porta il NOME della persona: è il suo punto della
   situazione, non «Punto». Se il nome non c'è (o è troppo lungo per
   stare nella barra) resta l'etichetta di sempre. */
function etichettaTab(p,l){
  if(p!=="punto")return l;
  const n=((S.profile&&S.profile.name)||"").trim().split(/\s+/)[0]||"";
  return (n&&n.length<=10)?n:l;}
window.rifaiTabs=function buildTabs(){
  const n=document.getElementById("tabs");if(!n)return;
  n.innerHTML=TABS.map(([p,l])=>{const e=etichettaTab(p,l);
    return `<button data-p="${p}" aria-label="${e}">${ic(p,21)}<span>${e}</span></button>`;}).join("");
  n.querySelectorAll("button").forEach(b=>b.onclick=()=>show(b.dataset.p));
  document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("on",b.dataset.p===cur));};
rifaiTabs();
/* Il riquadro promemoria («Come va») non esiste più: vive come riga del
   saluto in cima al Punto, e con lui se n'è andato lo swipe dedicato. */
/* Scorrimento laterale per cambiare giorno. Vale sul Punto e su Oggi:
   le frecce non ci sono più, quindi è l'unico modo. */
let _tsx=0,_tsy=0;
document.addEventListener("touchstart",e=>{_tsx=e.touches[0].clientX;_tsy=e.touches[0].clientY;},{passive:true});
document.addEventListener("touchend",e=>{
  if(cur!=="oggi"&&cur!=="punto")return;
  if(e.target&&e.target.closest&&e.target.closest(".ibanner,.sheet,input,select,textarea"))return;
  const dx=e.changedTouches[0].clientX-_tsx,dy=e.changedTouches[0].clientY-_tsy;
  if(Math.abs(dx)>65&&Math.abs(dy)<45)shiftDay(dx<0?1:-1);},{passive:true});

