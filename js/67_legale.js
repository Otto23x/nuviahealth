/* ═══════════════════════════════════════════════════════════════
   67. I DOCUMENTI LEGALI — termini, privacy, e i consensi veri
   ═══════════════════════════════════════════════════════════════
   Chiesto dal founder il 29/08: «metti tutto quello che manca, poi
   lo faremo convalidare».

   ── PERCHÉ ESISTE QUESTO MODULO ─────────────────────────────────
   Fino alla v15.6.0 l'app aveva il LESSICO giusto (proposte, non
   prescrizioni) e le frasi di responsabilità nelle schermate. Ma
   quello che protegge davvero un'app non è il testo nell'interfaccia:
   è un CONTRATTO che la persona accetta esplicitamente, e
   un'informativa privacy che dice dove finiscono i dati. Nuvia non
   aveva né l'uno né l'altra, e nessun momento in cui qualcuno dicesse
   «accetto». Qui ci sono tutti e tre.

   ── LE QUATTRO REGOLE DI QUESTO MODULO ──────────────────────────

   1. I DOCUMENTI SONO TESTO IN CHIARO, NON STRINGHE DELL'INTERFACCIA.
      Stessa scelta della Guida (vedi t_densita): un documento legale
      si legge una volta quando serve, e non deve stare sotto il tetto
      di parole pensato per i bottoni. Due corpi, IT ed EN, come
      GUIDA_IT/GUIDA_EN. Le poche parole del gate — le spunte, i
      bottoni — passano invece da tr(), perché quelle sì sono
      interfaccia.

   2. IL CONSENSO SI REGISTRA CON LA VERSIONE E LA DATA.
      «Ha accettato» senza sapere COSA e QUANDO non vale niente: se
      i documenti cambiano, il consenso vecchio non copre i nuovi. Da
      qui `LEGALE_VER`: cambiandola, l'app richiede l'accettazione.

   3. IL CONSENSO ALL'AI È SEPARATO, FACOLTATIVO E REVOCABILE.
      Non è formalismo. I dati che il piano manda al modello
      comprendono peso, età, e — se compilate — condizioni di salute,
      farmaci, gravidanza: sono «categorie particolari» (art. 9 GDPR)
      e chiedono un consenso ESPLICITO e SPECIFICO. Un consenso
      impacchettato insieme ai termini non è valido, e un consenso
      obbligatorio per usare l'app non è «libero». Qui è valido
      perché è vero: senza AI l'app funziona lo stesso (piano di base
      calcolato in locale, diario, spesa, peso), e si revoca in un
      tocco.

   4. IL CONSENSO SI FA RISPETTARE DAL CODICE, NON DALLA BUONA FEDE.
      `geminiCall` — la porta unica di ogni chiamata all'AI, sia con
      la chiave dell'utente sia dal proxy — si ferma se il consenso
      non c'è. Un consenso che il codice non fa rispettare è teatro:
      la spunta direbbe una cosa e il programma ne farebbe un'altra.

   ── QUELLO CHE QUESTO MODULO NON È ──────────────────────────────
   Non è un parere legale, e i documenti sono una BOZZA da far
   validare a un avvocato. Finché i dati del titolare sono segnaposto
   (`[…]`), la pagina lo dichiara in cima con un avviso che sparisce
   da solo quando vengono compilati: nessuno deve poter pubblicare
   dei segnaposto credendoli definitivi.                            */

/* ── LA VERSIONE DEI DOCUMENTI ────────────────────────────────────
   È la data dell'ultima modifica sostanziale. Cambiandola, chi aveva
   già accettato rivede il gate con la riga «i documenti sono
   cambiati»: è l'unico modo perché un consenso resti riferito a un
   testo preciso. */
const LEGALE_VER="2026-08-29";

/* ── I DATI DEL TITOLARE, IN UN POSTO SOLO ────────────────────────
   Da compilare prima della pubblicazione. Stanno qui e non sparsi
   nei testi perché si riempiano UNA volta: un indirizzo scritto in
   quattro punti è un indirizzo che a un certo punto sarà diverso in
   uno dei quattro. Finché contengono le parentesi quadre, l'app
   mostra l'avviso di bozza. */
const LEGALE_TITOLARE={
  nome:"[RAGIONE SOCIALE O NOME E COGNOME DEL TITOLARE]",
  fiscale:"[P.IVA / CODICE FISCALE]",
  indirizzo:"[INDIRIZZO COMPLETO DELLA SEDE]",
  email:"[EMAIL DI CONTATTO]"
};
/* Vero finché c'è anche un solo segnaposto: lo usa l'avviso di bozza
   e lo usa il collaudo, così il giorno che si riempiono l'avviso
   sparisce da sé e nessuno deve ricordarsi di toglierlo. */
function legaleBozza(){
  try{return Object.keys(LEGALE_TITOLARE).some(k=>/\[/.test(LEGALE_TITOLARE[k]));}
  catch(e){return true;}}
window.legaleBozza=legaleBozza;

function legaleTit(){return LEGALE_TITOLARE;}

/* ── LO STATO ─────────────────────────────────────────────────────
   `patto`  → accettazione di termini + privacy: {ver, quando, eta18}
   `ai`     → consenso separato all'invio dei dati al modello
   Le due cose non si toccano MAI insieme: revocare l'AI non revoca
   il contratto, e riaccettare il contratto non riaccende l'AI. */
function legaleStato(){
  if(!S.legale||typeof S.legale!=="object")S.legale={};
  const L=S.legale;
  if(!L.patto||typeof L.patto!=="object")L.patto={};
  if(!L.ai||typeof L.ai!=="object")L.ai={};
  return L;}
window.legaleStato=legaleStato;

/* Accettato vuol dire: accettato QUESTA versione. Una versione
   vecchia non copre un testo nuovo. */
function legaleAccettato(){
  try{return legaleStato().patto.ver===LEGALE_VER;}catch(e){return false;}}
window.legaleAccettato=legaleAccettato;

/* Chi aveva accettato una versione PRECEDENTE non è un utente nuovo:
   glielo si dice, invece di rimettergli davanti la stessa schermata
   come se non avesse mai accettato niente. */
function legaleAggiornato(){
  try{const p=legaleStato().patto;
    return !!p.ver&&p.ver!==LEGALE_VER;}catch(e){return false;}}
window.legaleAggiornato=legaleAggiornato;

window.legaleAccetta=()=>{
  const c1=(document.getElementById("lgPatto")||{}).checked;
  const c2=(document.getElementById("lgEta")||{}).checked;
  if(!c1||!c2)return;                     /* il bottone è già spento */
  const L=legaleStato();
  L.patto={ver:LEGALE_VER,quando:new Date().toISOString(),eta18:true};
  /* Il consenso all'AI è una spunta a parte e può benissimo restare
     spenta: si registra solo se è stata data, con data propria. */
  const cai=(document.getElementById("lgAi")||{}).checked;
  if(cai)L.ai={ver:LEGALE_VER,quando:new Date().toISOString(),ok:true};
  save();
  /* Chi aveva già finito il percorso — l'utente di sempre, che il
     gate ha intercettato all'avvio per fargli accettare i documenti
     nuovi — deve tornare alla sua app, non ritrovarsi le domande
     dell'onboarding: `cur` in quel momento è "onb2" solo perché ce
     l'aveva portato il gate. */
  try{
    if(S.onboard.done)show(S.profile&&S.profile.dob?"punto":"io");
    else{render(cur);paginaInCima();}
  }catch(e){}};

/* Il consenso all'AI si accende e si spegne quando si vuole, dalla
   pagina dei documenti. Spegnendolo l'app resta intera: il piano di
   base si calcola in locale, il diario e la spesa non hanno mai
   avuto bisogno del modello. */
function legaleAiOk(){
  try{const a=legaleStato().ai;return !!(a&&a.ok===true);}catch(e){return false;}}
window.legaleAiOk=legaleAiOk;

window.legaleAiCambia=(v)=>{
  const L=legaleStato();
  if(v){L.ai={ver:LEGALE_VER,quando:new Date().toISOString(),ok:true};}
  else {L.ai={ok:false,revocato:new Date().toISOString()};}
  save();
  try{toast(v?tr("Consenso dato: ora posso chiedere i suggerimenti al modello.")
             :tr("Consenso revocato: non mando più niente al modello."));}catch(e){}
  try{render(cur);}catch(e){}};

/* ── IL GATE ──────────────────────────────────────────────────────
   Sta PRIMA di tutto, compreso il collegamento a Google: collegare un
   account è già un trattamento di dati, e chiederlo prima di dire
   come si trattano sarebbe l'ordine sbagliato. */
function legaleServe(){return !legaleAccettato();}
window.legaleServe=legaleServe;

function legaleGateHTML(){
  const agg=legaleAggiornato();
  return `<div class="o2wrap" data-gate="legale">
    <div class="card o2card">
      <h1 class="o2q">${esc(agg?tr("I documenti sono cambiati"):tr("Prima di cominciare"))}</h1>
      <p class="o2sub">${esc(agg
        ? tr("Abbiamo aggiornato i termini e l'informativa. Rileggili e confermali per continuare: il consenso di prima valeva per il testo di prima.")
        : tr("Due cose da leggere e una da confermare. Sono corte apposta."))}</p>

      ${legaleBozza()?`<div class="hint" data-bozza="1" style="border-left:4px solid var(--zaff);padding-left:10px">
        ${esc(tr("Documenti in bozza: i dati del titolare non sono ancora stati compilati e il testo non è stato validato da un legale."))}</div>`:""}

      <div class="hint" style="margin:12px 0">
        ${esc(tr("Nuvia è un diario alimentare con suggerimenti: non è un dispositivo medico, non fa diagnosi e non prescrive cure. I tuoi dati restano sul tuo telefono."))}
      </div>

      <label class="lgriga"><input type="checkbox" id="lgPatto" onchange="legaleGateAggiorna()">
        <span>${trh("Ho letto e accetto {a} e {b}.",
          {a:'<a href="#" onclick="show(\'documenti\');return false;"><b>'+esc(tr("i Termini di servizio"))+'</b></a>',
           /* l'apostrofo NON si scrive con la barra dentro una stringa
              a doppi apici: a runtime la chiave sarebbe «l'Informativa»
              ma lo scanner delle traduzioni legge il sorgente e ne
              vedrebbe una diversa — la voce risulterebbe mancante pur
              essendoci (preso da t_lingue_pagine). */
           b:'<a href="#" onclick="show(\'documenti\');return false;"><b>'+esc(tr("l’Informativa privacy"))+'</b></a>'})}</span></label>

      <label class="lgriga"><input type="checkbox" id="lgEta" onchange="legaleGateAggiorna()">
        <span>${esc(tr("Ho almeno 18 anni."))}</span></label>

      <div class="lgsep"></div>

      <label class="lgriga"><input type="checkbox" id="lgAi" ${legaleAiOk()?"checked":""}>
        <span>${esc(tr("Acconsento a che, quando chiedo dei suggerimenti, i miei dati alimentari — e se li compilo peso, età, condizioni di salute e farmaci — siano inviati al modello di intelligenza artificiale di Google per scrivere la risposta."))}</span></label>
      <div class="hint">${esc(tr("Questa è facoltativa e si cambia quando vuoi. Senza, Nuvia funziona lo stesso: le ricette di partenza le calcola da sola, e diario, spesa e peso non passano da nessun modello."))}</div>

      <div class="mtools" style="margin-top:12px">
        <button class="btn ghost small" type="button" onclick="show('documenti')">${esc(tr("Leggi i documenti"))}</button>
      </div>
    </div>
    ${/* ── AVANTI E INDIETRO COME NELLE ALTRE SCHERMATE (founder,
          02/09): «anche da questa si dovrebbe poter andare avanti o
          indietro». Il gate stava fuori dal percorso, con un solo
          bottone e nessuna via per tornare alla lingua appena scelta.
          Adesso ha la stessa barra delle domande: Indietro riporta
          alla schermata della lingua; Avanti è l'accettazione, e si
          accende solo con le due spunte obbligatorie. Chi è già
          dentro l'app da tempo (documenti cambiati) non ha un
          «indietro» che abbia senso: per lui c'è solo Avanti. */""}
    <div class="o2nav o2nav2">
      ${(S.onboard&&S.onboard.done)?"":`<button class="btn ghost o2back" type="button" onclick="legaleIndietro()"
        aria-label="${esc(tr("Torna indietro"))}">${esc(tr("Indietro"))}</button>`}
      <button class="btn o2next" id="lgVia" type="button" disabled onclick="legaleAccetta()">${esc(tr("Accetto e vado avanti"))}</button>
    </div>
  </div>`;}
window.legaleGateHTML=legaleGateHTML;

/* Indietro dal gate: si torna alla schermata della lingua (step 0 del
   percorso), che è la porta appena attraversata. Non si tocca nessun
   consenso — non ne è stato dato nessuno. */
window.legaleIndietro=()=>{
  try{const o=onb2Stato();o.step=0;save();}catch(e){}
  try{renderOnb2();}catch(e){}
  paginaInCima();};

/* Il bottone si accende solo con le due spunte obbligatorie. Non è
   un vezzo: un «Accetto» premuto senza spuntare niente è la prova
   che l'accettazione era una formalità, non un atto. */
window.legaleGateAggiorna=()=>{
  const b=document.getElementById("lgVia");if(!b)return;
  const c1=(document.getElementById("lgPatto")||{}).checked;
  const c2=(document.getElementById("lgEta")||{}).checked;
  b.disabled=!(c1&&c2);};

/* ── LA PAGINA DEI DOCUMENTI ──────────────────────────────────────
   Consultabile SEMPRE, non solo al primo avvio: un contratto che si
   può leggere una volta sola non è consultabile, ed è un requisito,
   non una gentilezza. */
function legaleCorpo(){
  const en=(typeof LANG!=="undefined"&&LANG==="en");
  return (en?LEGALE_EN:LEGALE_IT);}

function documentiHTML(){
  const D=legaleCorpo(),L=legaleStato();
  let h="";
  /* Durante il percorso l'intestazione dell'app non c'è: senza questo
     bottone si arriva ai documenti dal gate e non si torna indietro.
     Una via d'uscita che dipende da una freccia nascosta non è una
     via d'uscita. */
  try{if(!S.onboard.done)h+=`<div class="card"><div class="mtools">
    <button class="btn" onclick="show('onb2')">${esc(tr("Torna indietro"))}</button></div></div>`;}catch(e){}
  if(legaleBozza())h+=`<div class="card" data-bozza="1" style="border-left:4px solid var(--zaff)">
    <div class="hint">${esc(tr("Documenti in bozza: i dati del titolare non sono ancora stati compilati e il testo non è stato validato da un legale."))}</div></div>`;

  /* Cosa ha accettato questa persona, e quando. Sta in cima perché è
     la prima domanda di chi apre questa pagina mesi dopo. */
  h+=`<div class="card"><h2>${esc(tr("I tuoi consensi"))}</h2>
    <div class="hint">${L.patto.quando
      ? esc(tr("Termini e privacy: accettati il {q} (versione {v}).",{q:legaleData(L.patto.quando),v:L.patto.ver}))
      : esc(tr("Termini e privacy: non ancora accettati."))}</div>
    <div class="lgsep"></div>
    <label class="lgriga"><input type="checkbox" id="lgAiPag" ${legaleAiOk()?"checked":""}
      onchange="legaleAiCambia(this.checked)">
      <span>${esc(tr("Invio dei miei dati al modello di AI per i suggerimenti"))}</span></label>
    <div class="hint">${legaleAiOk()
      ? esc(tr("Dato il {q}. Togliendo la spunta l'app smette di mandare qualsiasi cosa al modello, da subito.",{q:legaleData(L.ai.quando)}))
      : esc(tr("Non attivo: nessun dato esce dal telefono verso il modello. Le ricette di partenza si calcolano comunque, in locale."))}</div>
  </div>`;

  h+=`<div class="card"><h2>${esc(tr("Termini di servizio"))}</h2>
    <div class="hint lgdoc">${D.termini()}</div></div>`;
  h+=`<div class="card"><h2>${esc(tr("Informativa privacy"))}</h2>
    <div class="hint lgdoc">${D.privacy()}</div></div>`;
  return h;}
window.documentiHTML=documentiHTML;

function legaleData(iso){
  try{return new Date(iso).toLocaleDateString(dataLoc());}catch(e){return "";}}

function renderDocumenti(){
  const el=document.getElementById("pg-documenti");if(!el)return;
  el.innerHTML=documentiHTML();}
window.renderDocumenti=renderDocumenti;

/* ═══════════════════════════════════════════════════════════════
   IL TESTO — italiano
   ═══════════════════════════════════════════════════════════════
   Testo in chiaro e non stringhe di interfaccia: vedi la regola 1 in
   cima al modulo. Ogni affermazione qui dentro dev'essere VERA nel
   codice: un'informativa che promette una protezione che il programma
   non ha non protegge nessuno — aggrava.                          */
const LEGALE_IT={};
LEGALE_IT.termini=()=>{
  const T=legaleTit();
  return `
<p><b>Termini di servizio di Nuvia</b><br>
Versione del ${LEGALE_VER}. Titolare: ${esc(T.nome)}, ${esc(T.fiscale)}, ${esc(T.indirizzo)} — ${esc(T.email)}.</p>

<p><b>1. Cos'è Nuvia.</b> Nuvia è un'applicazione di diario alimentare
che ti aiuta a organizzare quello che mangi e a fare la spesa, e che
ti propone ricette e suggerimenti coerenti con gli obiettivi che
imposti tu. I suggerimenti sono spunti: puoi cambiarli, sostituirli o
ignorarli in qualsiasi momento, e le scelte su cosa mangiare restano
tue.</p>

<p><b>2. Cosa Nuvia non è.</b> Nuvia non è un dispositivo medico e non
è destinata a diagnosi, prevenzione, monitoraggio, trattamento o
attenuazione di malattie. Non fornisce consulenza medica, dietetica o
nutrizionale personalizzata, non sostituisce il parere di un medico,
di un dietista o di un biologo nutrizionista, e non elabora
prescrizioni dietetiche. I fabbisogni, le calorie e le quantità che
vedi sono stime ottenute da formule statistiche generali applicate ai
dati che inserisci: sono approssimazioni, non misure, e possono non
essere adatte al tuo caso specifico. Prima di seguire nel tempo
qualsiasi indicazione dell'app, e in ogni caso se hai condizioni di
salute, assumi farmaci, sei in gravidanza o in allattamento,
consulta un professionista sanitario.</p>

<p><b>3. Chi può usarla.</b> Nuvia è riservata a chi ha compiuto 18
anni. Accettando questi termini dichiari di avere almeno 18 anni.
L'app non è destinata a minori e non deve essere usata per elaborare
indicazioni alimentari rivolte a minori. La funzione che calcola le
porzioni da cucinare per gli altri componenti della famiglia serve
solo a dimensionare le quantità di una ricetta: non definisce
obiettivi calorici, deficit o percorsi individuali per queste
persone, e non ne conserva un profilo.</p>

<p><b>4. Contenuti generati dall'intelligenza artificiale.</b> Parte
dei suggerimenti è scritta da un modello di intelligenza artificiale
di terze parti. I contenuti generati automaticamente possono essere
incompleti, imprecisi o errati, comprese le stime nutrizionali:
controlla sempre quello che ti sembra strano, e in particolare
verifica la compatibilità dei piatti proposti con le tue allergie,
intolleranze e condizioni prima di consumarli. L'app applica controlli
automatici per escludere gli alimenti che hai dichiarato di dover
evitare, ma nessun controllo automatico può sostituire la tua
verifica.</p>

<p><b>5. Le tue responsabilità.</b> Sei responsabile dei dati che
inserisci e delle decisioni che prendi sulla tua alimentazione e sulla
tua salute. Ti impegni a inserire dati veritieri (in particolare età,
peso e altezza, da cui derivano tutte le stime) e a non usare l'app
per finalità diverse da quelle previste, né per conto di terzi senza
il loro consenso.</p>

<p><b>6. Disponibilità del servizio.</b> Nuvia funziona in larga parte
sul tuo dispositivo. Alcune funzioni richiedono una connessione e
servizi di terze parti (il modello di intelligenza artificiale, il
backup su Google Drive) che possono essere temporaneamente non
disponibili, cambiare o cessare: in quel caso le funzioni che ne
dipendono possono non funzionare, mentre il diario, il calcolo di
base, la spesa e i tuoi dati restano utilizzabili.</p>

<p><b>7. Limitazione di responsabilità.</b> Nei limiti consentiti
dalla legge, il titolare non risponde dei danni derivanti dall'uso
dei suggerimenti dell'app, dall'imprecisione delle stime o dei
contenuti generati automaticamente, o dall'indisponibilità di servizi
di terze parti. Restano espressamente esclusi da questa limitazione,
perché la legge non ne consente l'esclusione, i danni derivanti da
dolo o colpa grave e i danni alla vita, all'integrità fisica e alla
salute delle persone. Nulla in questi termini limita i diritti che ti
spettano come consumatore ai sensi di norme inderogabili.</p>

<p><b>8. Servizi a pagamento.</b> Le funzioni gratuite restano
gratuite. Se attiverai un abbonamento, condizioni economiche, durata,
rinnovo e diritto di recesso saranno indicati prima dell'acquisto e
regolati anche dalle condizioni dello store attraverso cui l'acquisto
avviene.</p>

<p><b>9. Proprietà intellettuale.</b> L'applicazione, il marchio, i
testi e le illustrazioni sono di proprietà del titolare. I dati che
inserisci restano tuoi: l'app non acquisisce alcun diritto su di
essi.</p>

<p><b>10. Modifiche.</b> Questi termini possono essere aggiornati.
Quando cambiano in modo sostanziale, l'app te lo dice e ti chiede di
accettarli di nuovo prima di proseguire: l'accettazione precedente
resta riferita al testo precedente.</p>

<p><b>11. Chiusura e cancellazione.</b> Puoi smettere di usare Nuvia
in qualsiasi momento. Disinstallando l'applicazione i dati conservati
sul dispositivo vengono rimossi; l'eventuale copia di backup nel tuo
Google Drive si elimina dalle impostazioni del tuo account Google
(Impostazioni → Gestisci app).</p>

<p><b>12. Legge applicabile e foro.</b> Questi termini sono regolati
dalla legge italiana. Se usi l'app come consumatore, per le
controversie è competente il giudice del luogo in cui risiedi o hai
eletto domicilio, se situato nel territorio dello Stato, e restano
ferme le tutele previste dal Codice del consumo.</p>

<p><b>13. Contatti.</b> Per qualunque comunicazione relativa a questi
termini: ${esc(T.email)}.</p>`;};

LEGALE_IT.privacy=()=>{
  const T=legaleTit();
  return `
<p><b>Informativa sul trattamento dei dati personali</b><br>
Versione del ${LEGALE_VER}. Resa ai sensi degli articoli 13 e 14 del
Regolamento (UE) 2016/679 (GDPR).</p>

<p><b>1. Titolare del trattamento.</b> ${esc(T.nome)}, ${esc(T.fiscale)},
${esc(T.indirizzo)}. Per esercitare i tuoi diritti o per qualunque
domanda: ${esc(T.email)}.</p>

<p><b>2. Il principio: Nuvia non ha un server.</b> Nuvia funziona sul
tuo dispositivo. Non esiste un account Nuvia, non c'è un archivio
centrale dei tuoi dati e il titolare non conserva né consulta il tuo
diario, il tuo peso o le tue abitudini alimentari. Non ci sono
strumenti di analisi del comportamento, non ci sono tracciatori
pubblicitari e i tuoi dati non vengono venduti né ceduti a nessuno.</p>

<p><b>3. Quali dati tratti l'app, sul tuo dispositivo.</b> Dati
anagrafici e fisici (nome o soprannome, data di nascita, sesso,
altezza, peso e sue variazioni, eventuali misure corporee); abitudini
alimentari (pasti, orari, preferenze, alimenti evitati, budget della
spesa); attività fisica e sonno, se li registri; e — solo se scegli
di compilarli — dati che rientrano nelle categorie particolari
dell'articolo 9 GDPR, cioè intolleranze e allergie, condizioni di
salute, farmaci assunti, stato di gravidanza o allattamento, e le
annotazioni sul tuo rapporto con il cibo. Questi ultimi sono
facoltativi: l'app funziona anche senza.</p>

<p><b>4. Cosa esce dal tuo dispositivo, e verso chi.</b> Fuori dal tuo
telefono vanno solo due flussi, ed entrambi li accendi tu.</p>

<p>(a) <i>Suggerimenti scritti dall'intelligenza artificiale.</i> Se
dai il consenso specifico, quando chiedi delle proposte l'app invia a
Google (servizio Gemini) il testo della richiesta, che contiene i dati
necessari a scriverla: obiettivo, fabbisogno calcolato, età, peso,
preferenze e alimenti da evitare e, se li hai compilati, intolleranze,
allergie, condizioni di salute, farmaci, gravidanza o allattamento.
Il trattamento avviene secondo le condizioni di Google e comporta un
trasferimento verso paesi terzi, compresi gli Stati Uniti. Non
inviamo il tuo nome, il tuo diario storico né le tue fotografie, se
non quelle che scegli tu di far analizzare. Il consenso è facoltativo
e revocabile in qualsiasi momento dalla pagina dei documenti: revocato,
l'app smette immediatamente di inviare qualsiasi cosa al modello e
continua a funzionare con i calcoli locali. Quando l'app userà un
proprio servizio intermedio per contattare il modello, quel servizio
inoltrerà la richiesta senza conservarne il contenuto.</p>

<p>(b) <i>Backup nel tuo Google Drive.</i> Se lo attivi, l'app salva
una copia dei tuoi dati in un'area riservata alle applicazioni del
TUO account Drive (spazio «appDataFolder»): il file appartiene a te,
non è visibile fra i tuoi documenti e il titolare non vi ha accesso.
Si disattiva da Sistema → Sincronizzazione e si elimina dalle
impostazioni del tuo account Google.</p>

<p><b>5. Perché trattiamo questi dati (base giuridica).</b> Il
funzionamento dell'app sul tuo dispositivo e l'esecuzione delle
funzioni che chiedi si fondano sul contratto che accetti con i
termini di servizio (art. 6.1.b GDPR). L'invio al modello di
intelligenza artificiale dei dati che rientrano nelle categorie
particolari si fonda sul tuo consenso esplicito (art. 9.2.a GDPR),
raccolto separatamente e revocabile. Non trattiamo i tuoi dati per
finalità di marketing.</p>

<p><b>6. Per quanto tempo.</b> I dati restano sul tuo dispositivo
finché tieni l'app installata e non li cancelli. Non essendoci un
archivio centrale, non esiste una conservazione da parte nostra. La
copia di backup resta nel tuo Drive finché non la elimini.</p>

<p><b>7. I tuoi diritti.</b> Hai diritto di accedere ai tuoi dati,
rettificarli, cancellarli, limitarne il trattamento, opporti e
ottenerne la portabilità (artt. 15-22 GDPR), oltre a revocare in ogni
momento i consensi prestati. Poiché i dati stanno sul tuo dispositivo,
la maggior parte di questi diritti la eserciti direttamente: li
consulti e li correggi nell'app, li esporti dalle impostazioni e li
cancelli disinstallando o azzerando i dati. Per tutto il resto puoi
scrivere a ${esc(T.email)}. Hai inoltre diritto di proporre reclamo
al Garante per la protezione dei dati personali (www.gpdp.it).</p>

<p><b>8. Minori.</b> Nuvia è destinata esclusivamente a persone di età
pari o superiore a 18 anni e non raccoglie consapevolmente dati di
minori.</p>

<p><b>9. Modifiche.</b> Se questa informativa cambia in modo
sostanziale, l'app te lo comunica e ti chiede di prenderne atto prima
di proseguire.</p>`;};

/* ═══════════════════════════════════════════════════════════════
   IL TESTO — inglese
   ═══════════════════════════════════════════════════════════════ */
const LEGALE_EN={};
LEGALE_EN.termini=()=>{
  const T=legaleTit();
  return `
<p><b>Nuvia Terms of Service</b><br>
Version of ${LEGALE_VER}. Provider: ${esc(T.nome)}, ${esc(T.fiscale)}, ${esc(T.indirizzo)} — ${esc(T.email)}.</p>

<p><b>1. What Nuvia is.</b> Nuvia is a food-diary application that
helps you organise what you eat and do your shopping, and suggests
recipes and ideas consistent with the goals you set yourself. The
suggestions are just that: you can change, replace or ignore them at
any time, and decisions about what you eat remain yours.</p>

<p><b>2. What Nuvia is not.</b> Nuvia is not a medical device and is
not intended for the diagnosis, prevention, monitoring, treatment or
alleviation of disease. It does not provide personalised medical,
dietetic or nutritional advice, does not replace a doctor, a dietitian
or a nutritionist, and does not produce dietary prescriptions. The
energy needs, calories and amounts you see are estimates produced by
general statistical formulas applied to the data you enter: they are
approximations, not measurements, and may not suit your specific
case. Before following any of the app's indications over time — and
in any case if you have health conditions, take medication, are
pregnant or breastfeeding — consult a healthcare professional.</p>

<p><b>3. Who may use it.</b> Nuvia is reserved for people aged 18 or
over. By accepting these terms you declare that you are at least 18.
The app is not intended for minors and must not be used to produce
dietary indications addressed to minors. The feature that works out
cooking portions for other members of your household only sizes the
quantities of a recipe: it does not set calorie targets, deficits or
individual programmes for those people, and keeps no profile of
them.</p>

<p><b>4. AI-generated content.</b> Some suggestions are written by a
third-party artificial-intelligence model. Automatically generated
content can be incomplete, imprecise or wrong, including nutritional
estimates: always check anything that looks odd, and in particular
verify that suggested dishes are compatible with your allergies,
intolerances and conditions before eating them. The app applies
automatic checks to exclude foods you declared you must avoid, but no
automatic check can replace your own.</p>

<p><b>5. Your responsibilities.</b> You are responsible for the data
you enter and for the decisions you make about your diet and health.
You undertake to enter truthful data (in particular age, weight and
height, from which every estimate derives) and not to use the app for
purposes other than those intended, nor on behalf of others without
their consent.</p>

<p><b>6. Service availability.</b> Nuvia largely runs on your device.
Some features require a connection and third-party services (the AI
model, Google Drive backup) which may be temporarily unavailable,
change or cease: in that case the features that depend on them may
not work, while your diary, the basic calculations, the shopping list
and your data remain usable.</p>

<p><b>7. Limitation of liability.</b> To the extent permitted by law,
the provider is not liable for damages arising from use of the app's
suggestions, from the imprecision of estimates or automatically
generated content, or from the unavailability of third-party
services. Expressly excluded from this limitation, because the law
does not allow their exclusion, are damages arising from wilful
misconduct or gross negligence and damages to life, physical
integrity and health. Nothing in these terms limits the rights you
have as a consumer under mandatory law.</p>

<p><b>8. Paid services.</b> Free features stay free. If you take out a
subscription, price, duration, renewal and right of withdrawal will
be shown before purchase and also governed by the terms of the store
through which the purchase is made.</p>

<p><b>9. Intellectual property.</b> The application, the trademark,
the texts and the illustrations belong to the provider. The data you
enter remains yours: the app acquires no rights over it.</p>

<p><b>10. Changes.</b> These terms may be updated. When they change
substantially the app tells you and asks you to accept them again
before continuing: your previous acceptance remains tied to the
previous text.</p>

<p><b>11. Ending and deletion.</b> You may stop using Nuvia at any
time. Uninstalling the application removes the data held on the
device; any backup copy in your Google Drive is deleted from your
Google account settings (Settings → Manage apps).</p>

<p><b>12. Governing law and jurisdiction.</b> These terms are governed
by Italian law. If you use the app as a consumer, disputes fall to
the court of the place where you reside or have elected domicile, if
located within the State, and the protections of the Italian Consumer
Code continue to apply.</p>

<p><b>13. Contact.</b> For any communication concerning these terms:
${esc(T.email)}.</p>`;};

LEGALE_EN.privacy=()=>{
  const T=legaleTit();
  return `
<p><b>Privacy notice</b><br>
Version of ${LEGALE_VER}. Provided under Articles 13 and 14 of
Regulation (EU) 2016/679 (GDPR).</p>

<p><b>1. Data controller.</b> ${esc(T.nome)}, ${esc(T.fiscale)},
${esc(T.indirizzo)}. To exercise your rights or for any question:
${esc(T.email)}.</p>

<p><b>2. The principle: Nuvia has no server.</b> Nuvia runs on your
device. There is no Nuvia account, no central store of your data, and
the controller neither keeps nor consults your diary, your weight or
your eating habits. There is no behavioural analytics, there are no
advertising trackers, and your data is never sold or passed to
anyone.</p>

<p><b>3. What data the app handles, on your device.</b> Identity and
body data (name or nickname, date of birth, sex, height, weight and
its changes, any body measurements); eating habits (meals, times,
preferences, avoided foods, shopping budget); physical activity and
sleep, if you log them; and — only if you choose to fill them in —
data falling within the special categories of Article 9 GDPR, namely
intolerances and allergies, health conditions, medication, pregnancy
or breastfeeding, and notes about your relationship with food. These
last are optional: the app works without them.</p>

<p><b>4. What leaves your device, and to whom.</b> Only two flows
leave your phone, and you switch on both.</p>

<p>(a) <i>AI-written suggestions.</i> If you give specific consent,
when you ask for suggestions the app sends Google (Gemini service)
the text of the request, which contains the data needed to write it:
goal, calculated needs, age, weight, preferences and foods to avoid
and, if you filled them in, intolerances, allergies, health
conditions, medication, pregnancy or breastfeeding. Processing takes
place under Google's terms and involves a transfer to third
countries, including the United States. We do not send your name,
your historical diary or your photographs, other than those you
choose to have analysed. Consent is optional and can be withdrawn at
any time from the documents page: once withdrawn, the app immediately
stops sending anything to the model and keeps working with local
calculations. When the app uses its own intermediate service to reach
the model, that service will forward the request without storing its
content.</p>

<p>(b) <i>Backup in your Google Drive.</i> If you turn it on, the app
saves a copy of your data in the application-reserved area of YOUR
Drive account (the "appDataFolder" space): the file belongs to you,
is not visible among your documents, and the controller has no access
to it. It is switched off from System → Sync and deleted from your
Google account settings.</p>

<p><b>5. Why we process this data (legal basis).</b> Running the app
on your device and performing the functions you ask for rest on the
contract you accept with the terms of service (Art. 6.1.b GDPR).
Sending special-category data to the AI model rests on your explicit
consent (Art. 9.2.a GDPR), collected separately and revocable. We do
not process your data for marketing purposes.</p>

<p><b>6. For how long.</b> Data stays on your device as long as you
keep the app installed and do not delete it. As there is no central
store, there is no retention on our side. The backup copy stays in
your Drive until you delete it.</p>

<p><b>7. Your rights.</b> You have the right to access your data,
rectify it, erase it, restrict its processing, object, and obtain its
portability (Arts. 15-22 GDPR), as well as to withdraw at any time
the consents you have given. Since the data sits on your device, you
exercise most of these rights directly: you view and correct it in
the app, export it from the settings, and delete it by uninstalling
or clearing the data. For anything else you can write to
${esc(T.email)}. You also have the right to lodge a complaint with the
Italian Data Protection Authority (www.gpdp.it).</p>

<p><b>8. Minors.</b> Nuvia is intended exclusively for people aged 18
or over and does not knowingly collect data from minors.</p>

<p><b>9. Changes.</b> If this notice changes substantially, the app
tells you and asks you to acknowledge it before continuing.</p>`;};
