/* ═══════════════════════════════════════════════════════════════
   64. IL PRIMO AVVIO — l'account, e dove finiscono i dati
   ═══════════════════════════════════════════════════════════════
   Chiesto dal founder il 19/08/2026: «voglio provarla come se fosse
   pubblicata». Giusto: il primo avvio è la schermata che decide se
   una persona resta, e finora si saltava direttamente alle domande.

   ── COSA CHIEDE, E PERCHÉ ─────────────────────────────────────
   Una cosa sola: l'account Google. Serve a due scopi che vanno
   detti chiaramente, perché sono i due che interessano davvero:

   1. IL BACKUP SU DRIVE. I dati non stanno sui nostri server —
      questo è il punto di tutta l'app — quindi il posto sicuro è
      il TUO Drive. E qui va detta una cosa scomoda invece di
      nasconderla: **se togli quella copia, i dati sono persi.**
      Non ne abbiamo una copia. È il prezzo di non averli noi, e
      chi lo scopre dopo si sente ingannato.

      ── DOV'È DAVVERO QUELLA COPIA (founder, 29/08) ────────────
      «Ma la cartella in Drive non si vede, sicuro che l'utente
      possa cancellarla?» Domanda giusta, e la risposta era: no,
      non come diceva questa schermata. Il codice chiede lo scope
      `drive.appdata` e scrive dentro `appDataFolder` (vedi
      23_16): uno spazio riservato all'app che NON compare fra i
      file del Drive. Sfogliando il Drive quella cartella non c'è,
      e «cancelli quei file dal Drive» descriveva un gesto che la
      persona non può fare.
      Cancellabile lo è — Impostazioni del Drive → Gestisci app →
      elimina i dati nascosti, oppure revocando l'accesso — ma è
      un'altra strada, e dirla storta è peggio che non dirla: la
      parte «scomoda» esiste apposta per essere vera. Adesso i tre
      testi dicono dov'è quella copia e come si toglie.
   2. RITROVARE L'ABBONAMENTO. Cambi telefono, reinstalli, e con
      la stessa email ritrovi quello che hai pagato. Senza,
      dovresti ricomprare — ed è il motivo per cui l'email si
      chiede ORA e non quando serve.

   ── E COSA NON CHIEDE ─────────────────────────────────────────
   Non una password nostra (non abbiamo conti nostri), non i dati
   di salute (quelli si chiedono dopo, e restano sul telefono),
   non il permesso alle notifiche (si chiede quando servono).

   ── I CAMPI TECNICI ───────────────────────────────────────────
   Client ID e chiave Gemini stanno in fondo, dietro «impostazioni
   di prova», e A PUBBLICAZIONE AVVENUTA SPARISCONO: la chiave
   arriva dal nostro backend e l'OAuth è configurato una volta per
   tutte. Sono lì perché il founder possa provare il percorso vero,
   non perché un utente debba vederli.                              */

const PRIMO_KEY="nuvia_primo";
const SALUTO_KEY="nuvia_saluto";

/* ═══ LA PRIMA SCHERMATA, quella che mancava ══════════════════════
   Chiesta dal founder il 23/08: «PRIMA di qualunque richiesta, una
   pagina che dice a cosa serve Nuvia e con che filosofia. Breve, non
   l'elenco degli strumenti».
   Aveva ragione, ed era una mancanza grossa: la prima cosa che l'app
   faceva era CHIEDERE — l'email, il Google, i numeri del corpo — a
   qualcuno che non sapeva ancora cosa avesse aperto. Si risponde
   volentieri a chi ha già detto perché sta chiedendo.
   PERCHÉ NON L'ELENCO DEGLI STRUMENTI: il piano, il barcode, la
   spesa e il resto sono buoni, e non convincono nessuno — ce li
   hanno tutte. Quello che non ha nessun'altra è la ragione per cui
   esiste un'app che si fa da parte quando arrivi.
   TRE COSE E BASTA, e nessuna è una funzione: quando serve, cosa
   fa di diverso, e di chi sono i dati. Poi si comincia.
   NON È SALTABILE, e non ha bisogno di esserlo: un tocco solo. */
function salutoFatto(){
  try{return localStorage.getItem(SALUTO_KEY)==="1";}catch(e){return false;}}
window.salutoFatto=salutoFatto;

window.salutoChiudi=()=>{
  try{localStorage.setItem(SALUTO_KEY,"1");}catch(e){}
  render(cur);paginaInCima();};

/* ── I QUATTRO PUNTI, RIFATTI (founder, 24/08) ─────────────────────
   Cosa c'era e perché non andava:

   1. «Serve alle 19:20 di una giornata storta». Un'ora precisa è una
      trovata, non una spiegazione: chi cena alle 21 o fa i turni legge
      un orario che non è il suo e pensa che l'app non parli a lui. Il
      momento resta, l'orologio no.
   2. «È il contrario di tutte le altre.» Un confronto che non possiamo
      dimostrare, e che oltretutto invita a pensare alle altre proprio
      mentre si sta guardando questa. Si dice cosa fa Nuvia, e basta.
   3. «Non li vendiamo perché non ce li abbiamo» difendeva da un'accusa
      che nessuno ha ancora fatto. Si dice dove stanno i dati e chi
      comanda: è privacy, non un'excusatio.
   4. La riga sul tono stava in fondo, in un riquadro verde, dopo il
      pulsante: la parte che distingue davvero Nuvia era quella che si
      saltava. Ora è un punto come gli altri, e il riquadro non c'è più. */
/* ═══ IL MARCHIO È UN VETTORE (v13.94) ════════════════════════════
   Storia in tre atti, che vale la pena tenere.
   1. Fino alla v13.60 la parola «Nuvia» era TESTO in Fraunces accanto
      al simbolo: due cose disegnate da mani diverse.
   2. Poi è diventata un PNG, e quel PNG portava striature verticali
      nelle lettere — artefatti di generazione. Si erano appiattiti i
      pixel ai due colori del marchio: le striature sparivano, ma
      restavano un alone bianco intorno al segno e il bianco dentro
      la contro-forma della N, che sul tema SCURO si vedevano.
   3. Dal 26/08 il founder ha dato i vettori. Niente striature perché
      non ci sono pixel, niente alone perché la trasparenza è vera, e
      8 KB invece di 210. Il file PNG resta solo come sorgente delle
      icone della PWA, che PNG devono essere.
   L'immagine è più PICCOLA a schermo (CSS) di quanto fosse: il logo a
   mezza pagina costringeva a scorrere per trovare «Comincia».

   L'ORDINE delle sezioni è del founder: prima «il piano è tuo» (cosa
   ricevi), poi «raddrizza la giornata storta» (cosa fa quando serve).
   E il titolo della seconda è il suo: la giornata non si guarda, si
   RADDRIZZA. */
/* ── COMPATTO, PERCHÉ «COMINCIA» SI DEVE VEDERE (founder, 26/08) ──
   «Il logo è posizionato male, va messo più in alto riducendo la
   spaziatura col banner e con la scritta… è fondamentale che l'utente
   veda il pulsante senza dover scrollare.» Il marchio scende a 96px,
   gli spazi si stringono, e i quattro punti stanno in UN riquadro —
   la stessa carta del resto dell'app — così su uno schermo normale il
   bottone sta sopra la piega. */
window.salutoHTML=()=>`<div class="primo saluto">
  <div class="saluto-marchio">
    <img src="assets/marchio-esteso.svg" alt="Nuvia" onerror="this.style.display='none'">
  </div>
  <h1 class="primo-t">${esc(tr("Il diario che si ripara mentre lo vivi."))}</h1>

  <div class="card saluto-card">
  <div class="saluto-p">
    <b>${esc(tr("Si parte da te, non da un manuale"))}</b>
    <span>${esc(tr("La tua settimana nasce dai tuoi orari, dai cibi che eviti e da quelli che ti piacciono. E si riscrive quando cambia qualcosa, senza ricominciare da capo."))}</span>
  </div>
  <div class="saluto-p">
    <b>${esc(tr("Serve a raddrizzare una giornata storta"))}</b>
    <span>${esc(tr("Un pranzo saltato, una cena fuori, una settimana che non torna: Nuvia rifà i conti su quello che resta, invece di darla per persa."))}</span>
  </div>
  <div class="saluto-p">
    <b>${esc(tr("Qui non si giudica nessuno"))}</b>
    <span>${esc(tr("Non esiste la parola «sgarro»: si racconta quello che è successo, non si giudica chi l'ha fatto. E quando arrivi dove volevi, l'app si fa sentire di meno."))}</span>
  </div>
  <div class="saluto-p">
    <b>${esc(tr("I tuoi dati restano tuoi"))}</b>
    <span>${esc(tr("Quello che mangi e quanto pesi stanno sul tuo telefono e, se lo colleghi, sul tuo Drive. Decidi tu cosa condividere, e puoi cancellare tutto in qualsiasi momento."))}</span>
  </div>
  </div>

  <button class="btn saluto-via" type="button" onclick="salutoChiudi()">${esc(tr("Comincia"))}</button>
  ${/* LA RIGA DEI 18 ANNI NON STA PIÙ QUI (founder, 02/09): «si può
       togliere da qui la scritta dei 18 anni, ci sarà già nella pagina
       legale più avanti». Aveva ragione due volte: la pagina legale
       arriva SUBITO DOPO questa e chiede la stessa cosa con una spunta
       vera — dirla qui in piccolo era una premessa che nessuno
       leggeva prima di una spunta che tutti devono mettere. E «Nuvia
       non è un dispositivo medico» sta nel riquadro del gate, a
       caratteri normali. Il saluto dice cos'è Nuvia; la pagina dopo
       dice le condizioni. Una cosa per pagina. */""}
</div>`;

/* La G di Google. Sul pulsante di accesso il marchio va messo come
   Google lo pubblica — quattro colori, non una lettera qualsiasi: è
   anche il modo in cui una persona riconosce al volo di che accesso
   si tratta, senza leggere. */
function logoG(){return `<svg class="acc-gicona" viewBox="0 0 48 48" width="18" height="18" aria-hidden="true" focusable="false">
  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 .5 24 .5 14.6.5 6.4 5.9 2.5 13.7l7.8 6.1C12.2 13.9 17.6 9.5 24 9.5z"/>
  <path fill="#4285F4" d="M46.9 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.9c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7.2-10.2 7.2-17.6z"/>
  <path fill="#FBBC05" d="M10.3 28.2c-.5-1.4-.8-2.9-.8-4.2s.3-2.8.8-4.2l-7.8-6.1C.9 16.9 0 20.3 0 24s.9 7.1 2.5 10.3l7.8-6.1z"/>
  <path fill="#34A853" d="M24 47.5c6.2 0 11.5-2 15.3-5.6l-7.6-5.9c-2.1 1.4-4.8 2.3-7.7 2.3-6.4 0-11.8-4.4-13.7-10.3l-7.8 6.1C6.4 42.1 14.6 47.5 24 47.5z"/>
</svg>`;}

function primoFatto(){
  try{return localStorage.getItem(PRIMO_KEY)==="1";}catch(e){return false;}}
window.primoFatto=primoFatto;

window.primoSalta=()=>{
  try{localStorage.setItem(PRIMO_KEY,"1");}catch(e){}
  render(cur);paginaInCima();};

/* Serve mostrarla? Solo a chi non l'ha ancora vista e non ha già
   un conto: chi torna non deve rifare la strada. */
window.primoServe=()=>{
  if(primoFatto())return false;
  try{if(S.conto&&S.conto.email)return false;}catch(e){}
  return true;};

/* ── LA PAGINA DEL COLLEGAMENTO FATTO (founder, 28/08) ────────────
   «Quando l'utente si collega con Google la schermata deve essere
   migliorata e non deve essere "prima di cominciare": deve essere una
   pagina a parte.»
   Aveva ragione, ed era un difetto di senso prima che di grafica: a
   collegamento avvenuto la pagina continuava a dire «Prima di
   cominciare — una cosa sola, e poi si parte», cioè chiedeva ancora
   la cosa che era appena stata fatta. Sopra restava la scheda con la
   spiegazione («per non perdere niente…») come se dovessi ancora
   decidere, e la conferma era una riga con una STELLA accanto —
   l'icona dei preferiti, che lì non voleva dire niente.
   Adesso il collegamento fatto ha la sua pagina: dice cos'è
   cambiato, con l'account che si è collegato, e ha un'unica strada
   avanti. La frase scomoda resta anche qui — è il momento in cui una
   persona decide di fidarsi, ed è lì che va detta, non solo prima. */
function primoCollegatoHTML(){
  const mail=(()=>{try{return (S.conto&&S.conto.email)||(S.drive&&S.drive.email)||"";}catch(e){return "";}})();
  const cid=(S.drive&&S.drive.cid)||"";
  const key=(S.ai&&S.ai.key)||"";
  return `<div class="primo">
    <div class="primo-segno" aria-hidden="true">✓</div>
    <h1 class="primo-t">${esc(tr("Il tuo Google è collegato"))}</h1>
    <p class="primo-s">${mail?esc(mail):esc(tr("Da qui in poi il backup si aggiorna da solo."))}</p>

    <div class="card">
      <h2>${esc(tr("Cosa cambia da adesso"))}</h2>
      <div class="primo-perche">
        <div class="pp">
          <b>${esc(tr("Il backup va sul TUO Drive"))}</b>
          <span>${esc(tr("I dati vivono sul telefono; una copia va nel tuo Drive, in uno spazio riservato a Nuvia che non compare fra i tuoi file. Noi non la vediamo e non ne teniamo un'altra."))}</span>
        </div>
        <div class="pp">
          <b>${esc(tr("L'abbonamento ti segue"))}</b>
          <span>${esc(tr("Cambi telefono, rientri con questa email e ritrovi quello che hai: non si ricompra niente."))}</span>
        </div>
        <div class="pp">
          <b>${esc(tr("E la cosa scomoda, detta adesso"))}</b>
          <span>${esc(tr("Quella copia non la trovi sfogliando il Drive: si toglie da Impostazioni → Gestisci app. Se lo fai, i dati sono persi: noi non ne abbiamo una copia. È il prezzo di non averli noi."))}</span>
        </div>
      </div>
      <button class="btn acc-b" onclick="primoSalta()">${esc(tr("Cominciamo"))}</button>
      <button class="btn ghost small acc-b" onclick="primoCollega()">${esc(tr("Uso un altro account"))}</button>
      <span class="o2hint">${esc(tr("Il backup si spegne quando vuoi da Sistema → Sincronizzazione."))}</span>
    </div>

    ${primoTecHTML(cid,key)}
  </div>`;}
window.primoCollegatoHTML=primoCollegatoHTML;

/* ── la schermata ─────────────────────────────────────────────── */
window.primoHTML=()=>{
  /* PRIMA DI QUALUNQUE RICHIESTA. Il controllo sta QUI e non nei
     chiamanti: il primo avvio è l'unica porta d'ingresso dell'app,
     quindi mettendolo qui non esiste una strada che salti il saluto.
     Se un domani nascesse un secondo ingresso, andrebbe fatto passare
     di qua e non ricopiato — è il collaudo t_saluto a pretenderlo. */
  if(!salutoFatto())return salutoHTML();
  const cid=(S.drive&&S.drive.cid)||"";
  const key=(S.ai&&S.ai.key)||"";
  /* «collegato» vuol dire: c'è un gettone valido E il backup è acceso */
  let collegato=false;
  try{collegato=!!(typeof DTOKEN!=="undefined"&&DTOKEN&&S.drive&&S.drive.on);}catch(e){}
  /* collegato = un'altra pagina, non questa con un pezzo in meno */
  if(collegato)return primoCollegatoHTML();

  return `<div class="primo">
    <div class="primo-logo"><img src="assets/marchio.svg" alt="" width="72" height="72" onerror="this.style.display='none'"></div>
    <h1 class="primo-t">${esc(tr("Prima di cominciare"))}</h1>
    <p class="primo-s">${esc(tr("Una cosa sola, e poi si parte."))}</p>

    <div class="card">
      <h2>${esc(tr("Collega il tuo Google"))}</h2>
      <!-- UNA SPIEGAZIONE SOLA (founder, 23/08): l'email era spiegata
           DUE volte — nel secondo paragrafo e sotto il campo — e il
           riquadro corallo diceva una terza cosa sullo stesso tema.
           Tre blocchi per un argomento solo: chi legge si perde, chi
           salta si perde la parte che conta.
           IL RIQUADRO NON C'È PIÙ, ma la frase scomoda sì: se i dati
           sul tuo Drive spariscono noi non ne abbiamo copia, e chi lo
           scopre dopo si sente ingannato. Sta in grassetto DENTRO il
           discorso, dove si legge nel filo del ragionamento invece che
           come un allarme da scavalcare. -->
      <!-- VIA IL «SE VUOI» (founder, 24/08). Diceva «stanno sul tuo
           telefono e, SE VUOI, sul tuo Drive»: una condizione buttata
           in mezzo alla frase che indeboliva l'unica cosa che stavamo
           promettendo. Il backup su Drive è una scelta, e si sceglie
           col pulsante qui sotto — non serve dirlo dentro la riga che
           spiega dove vivono i dati. -->
      <div class="primo-perche">
        <div class="pp">
          <b>${esc(tr("Per non perdere niente"))}</b>
          <span>${esc(tr("I tuoi dati non stanno sui nostri server: stanno sul tuo telefono e sul TUO Drive. Con la stessa email ritrovi l'abbonamento se cambi telefono."))}
            <b class="primo-scomodo">${esc(tr("Quella copia sta in uno spazio riservato all'app, che nel Drive non si vede: se la togli da Gestisci app, i dati sono persi — noi non ne abbiamo una copia."))}</b></span>
        </div>
      </div>

      <!-- L'ORDINE È CAMBIATO (founder, 24/08): «Entra con Google
           OPPURE prosegui». Google è la strada che fa tutto — accesso,
           backup e abbonamento ritrovato — e stava in fondo, dopo un
           campo da compilare a mano. Adesso viene prima, e l'email
           resta per chi non vuole passare da Google.
           E IL «PIÙ TARDI» NON C'È PIÙ. Era un terzo pulsante che
           diceva «salta»: la strada più facile su una schermata che
           chiede una cosa sola. Chi non vuole né l'uno né l'altra
           prosegue col campo vuoto — che è la stessa cosa, senza un
           comando che inviti a non farlo. -->
      ${`<div class="acc">
             <button class="btn acc-b acc-g" onclick="primoCollega()">${logoG()}${esc(tr("Entra con Google"))}</button>
             <div class="acc-sep"><span>${esc(tr("oppure"))}</span></div>
             <label for="primoMail">${esc(tr("Email"))}</label>
             <input type="email" id="primoMail" inputmode="email" autocomplete="email"
               value="${esc((S.conto&&S.conto.email)||"")}" placeholder="${esc(tr("nome@esempio.it"))}">
             <span class="o2hint">${esc(tr("Puoi anche lasciarla vuota e proseguire: la aggiungi quando vuoi da Sistema."))}</span>
             <button class="btn ghost acc-b" onclick="primoProsegui()">${esc(tr("Prosegui"))}</button>
           </div>`}
    </div>
    ${primoTecHTML(cid,key)}
  </div>`;};

/* Il blocco tecnico è lo stesso nelle due pagine: una funzione sola,
   così non nascono due copie che poi divergono.
   ── E ADESSO HA UN INTERRUTTORE (v15.20.0) ────────────────────────
   Qui c'era scritto «a pubblicazione avvenuta se ne toglie una, non
   due»: la sicurezza dipendeva dal RICORDARSI di cancellare delle
   righe il giorno giusto. Il founder ha deciso — «credo sia meglio
   nessuna porta» — e una porta che si chiude a memoria non è chiusa.
   Con `MODO_BANCO=false` questa funzione non disegna niente: non un
   pannello nascosto, non un campo disabilitato, NIENTE. Quello che
   non si scrive non si trova nel sorgente e non si riattiva con un
   ispettore aperto. */
function primoTecHTML(cid,key){
  if(!MODO_BANCO)return "";
  return `<details class="primo-tec">
      <summary>${esc(tr("Impostazioni di prova"))}</summary>
      <div class="hint">${esc(tr("Servono solo finché l'app non è pubblicata: dopo, la chiave arriva dal nostro server e il collegamento è già configurato. Un utente non vedrà mai questa parte."))}</div>
      <label style="margin-top:12px">CLIENT_ID (Google Cloud)</label>
      <input type="text" id="primoCid" value="${esc(cid)}" placeholder="…apps.googleusercontent.com">
      <label style="margin-top:12px">${esc(tr("Chiave AI"))}</label>
      <input type="password" id="primoKey" value="${esc(key)}" placeholder="${esc(tr("la tua chiave AI"))}" oninput="aiKeyVive(this.value)">
      <div class="mtools">
        <button class="btn ghost small" onclick="primoTecSalva()">${esc(tr("Salva le impostazioni"))}</button>
        <button class="btn ghost small" onclick="primoTecProva()">${esc(tr("Prova le chiavi"))}</button>
      </div>
      <!-- L'ESITO SCRITTO (founder, 23/08): «le chiavi non hanno
           nessuna prova che funzionino». Era vero, e costava caro:
           si salvavano, l'app diceva «Salvate», e il primo segnale
           che qualcosa non andava arrivava mezz'ora dopo, sotto
           forma di un piano che non si generava. Una chiave si prova
           usandola, e il risultato si scrive. -->
      <div class="primo-esito" id="primoEsito" aria-live="polite"></div>
    </details>`;}

/* «Prosegui» con l'email scritta a mano: chi non vuole passare da
   Google lascia comunque il modo di ritrovare l'abbonamento. Non è
   un accesso: è un promemoria, e lo diciamo. */
window.primoProsegui=()=>{
  const e=((document.getElementById("primoMail")||{}).value||"").trim();
  if(e&&!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(e))
    return dlgAlert(tr("Quell'indirizzo non sembra completo. Controllalo, oppure lascialo vuoto e prosegui."));
  if(e){S.conto=S.conto||{};S.conto.email=e;save();}
  primoSalta();};

window.primoTecSalva=()=>{
  const cid=(document.getElementById("primoCid")||{}).value||"";
  const key=(document.getElementById("primoKey")||{}).value||"";
  S.drive=S.drive||{};S.ai=S.ai||{};
  if(cid.trim())S.drive.cid=cid.trim();
  if(key.trim())S.ai.key=key.trim();
  save();
  toast(tr("Salvate. Ora «Entra con Google» funziona."));
  render(cur);};

/* ═══ LA PROVA DELLE CHIAVI ═══════════════════════════════════════
   Non si controlla la FORMA della chiave: una chiave ben scritta e
   revocata ha la forma giusta e non funziona. Si USA, e si scrive
   cosa è successo — compreso il motivo quando va male, perché
   «non funziona» non ha mai aiutato nessuno.
   Le due chiavi si provano in modo diverso, e va detto:
   • l'AI si prova davvero, facendole una domanda;
   • il Drive NON si può provare da soli — l'accesso lo concede la
     persona in una finestra di Google. Quindi si dice l'unica cosa
     onesta: se il collegamento c'è già lo si mette alla prova con
     una chiamata vera, altrimenti si dice cosa manca per farlo. */
window.primoTecProva=async()=>{
  const box=document.getElementById("primoEsito");
  if(!box)return;
  primoTecSalvaZitto();
  box.innerHTML=`<div class="pe att">${esc(tr("Sto provando…"))}</div>`;
  const righe=[];

  /* Ogni riga è UNA frase intera, non un'etichetta più un seguito:
     spezzata in due, metà finiva nel dizionario come frammento senza
     capo né coda, e in inglese sarebbe uscita storta. */

  /* ── L'AI: le si fa una domanda e si guarda se risponde ── */
  const key=((S.ai&&S.ai.key)||"").trim();
  if(!key)righe.push(["no",tr("AI: nessuna chiave scritta.")]);
  else{
    try{
      /* la frase è FISSA e in italiano: non passa da tr() perché non
         è interfaccia, è il testo che parte — e deve essere sempre lo
         stesso, senza dati della persona (vedi geminiCall, «prova») */
      const r=await aiAsk("Rispondi soltanto con la parola OK.","prova");
      righe.push(String(r||"").trim()
        ? ["si",tr("AI: risponde.")]
        : ["no",tr("AI: ha risposto vuoto.")]);
    }catch(e){
      const perche=(typeof aiReason==="function")?aiReason(e):String(e&&e.message||e);
      righe.push(["no",tr("AI: non risponde ({v1}).",{v1:perche})]);}}

  /* ── IL DRIVE ── */
  const cid=((S.drive&&S.drive.cid)||"").trim();
  let gettone=null;
  try{gettone=(typeof DTOKEN!=="undefined")?DTOKEN:null;}catch(e){}
  if(!cid)righe.push(["no",tr("Drive: nessun CLIENT_ID scritto.")]);
  else if(location.protocol==="file:")
    righe.push(["no",tr("Drive: da file:// Google non apre l'accesso, serve un indirizzo https.")]);
  else if(!gettone)
    righe.push(["forse",tr("Drive: CLIENT_ID a posto, ma non sei ancora entrato. Premi «Entra con Google» qui sopra.")]);
  else{
    try{
      await driveFind();                    /* chiamata vera all'archivio */
      righe.push(["si",tr("Drive: collegato, e l'archivio risponde.")]);
    }catch(e){
      righe.push(["no",(String(e&&e.message)==="auth")
        ? tr("Drive: l'accesso è scaduto. Rifai «Entra con Google».")
        : tr("Drive: collegato, ma l'archivio non risponde.")]);}}

  box.innerHTML=righe.map(([st,cosa])=>
    `<div class="pe ${esc(st)}">${esc(cosa)}</div>`).join("");};

/* Salva senza dire niente: la prova che segue parlerà per lei. */
function primoTecSalvaZitto(){
  const cid=(document.getElementById("primoCid")||{}).value||"";
  const key=(document.getElementById("primoKey")||{}).value||"";
  S.drive=S.drive||{};S.ai=S.ai||{};
  if(cid.trim())S.drive.cid=cid.trim();
  if(key.trim())S.ai.key=key.trim();
  save();}

window.primoCollega=()=>{
  const cid=(S.drive&&S.drive.cid)||"";
  /* ── LA FRASE SEGUE L'INTERRUTTORE (v15.20.0) ──────────────────
     Spento il modo banco, «lo trovi nelle impostazioni di prova qui
     sotto» mandava la persona a cercare un pannello che non esiste:
     una frase che promette quello che il codice non fa è un difetto,
     e questa lo sarebbe diventata il giorno della pubblicazione. */
  if(!cid)return dlgAlert(MODO_BANCO
    ?tr("Per provare il collegamento serve il CLIENT_ID, che trovi nelle impostazioni di prova qui sotto. A pubblicazione avvenuta sarà già configurato.")
    :tr("Il collegamento a Google non è ancora attivo. Puoi proseguire: i tuoi dati restano sul telefono, e lo colleghi più tardi da Sistema."));
  try{
    /* si passa il NOME del campo: qui si chiama primoCid, in Sistema
       dCid. Prima driveConnect cercava sempre quello di Sistema. */
    if(typeof driveConnect==="function")driveConnect("primoCid");
    else dlgAlert(tr("Il collegamento non è disponibile in questo momento."));
  }catch(e){dlgAlert(tr("Il collegamento non è riuscito. Puoi proseguire e collegarlo più tardi da Sistema."));}};

/* Il vecchio «Più tardi» aveva il suo dialogo — «senza account l'app
   funziona tutta, ma i dati restano solo su questo telefono» — ed è
   sparito col pulsante (founder, 24/08). Quella verità non si è persa:
   la dice la riga sotto il campo email, dove serve, invece che dentro
   una conferma che si scavalca con un tocco. */
