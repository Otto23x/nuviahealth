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
      nasconderla: **se cancelli quei file dal Drive, i dati sono
      persi.** Non ne abbiamo una copia. È il prezzo di non
      averli noi, e chi lo scopre dopo si sente ingannato.
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
  render(cur);try{window.scrollTo(0,0);}catch(e){}};

window.salutoHTML=()=>`<div class="primo saluto">
  <div class="saluto-marchio">
    <img src="assets/marchio.png" alt="" width="72" height="72" onerror="this.style.display='none'">
    <b class="saluto-nome">Nuvia</b>
  </div>
  <h1 class="primo-t">${esc(tr("Il diario che si ripara mentre lo vivi."))}</h1>

  <div class="saluto-p">
    <b>${esc(tr("Serve alle 19:20 di una giornata storta"))}</b>
    <span>${esc(tr("È l'ora in cui le diete si rompono. Nuvia rimette in piedi la giornata invece di darla per persa."))}</span>
  </div>
  <div class="saluto-p">
    <b>${esc(tr("Ti accompagna, e poi si fa da parte"))}</b>
    <span>${esc(tr("Quando arrivi dove volevi, si fa sentire di meno invece che di più. È il contrario di tutte le altre, ed è la ragione per cui esiste."))}</span>
  </div>
  <div class="saluto-p">
    <b>${esc(tr("Quello che mangi resta tuo"))}</b>
    <span>${esc(tr("I dati di salute stanno sul tuo telefono, non sui nostri server. Non li vendiamo perché non ce li abbiamo."))}</span>
  </div>

  <p class="saluto-tono">${esc(tr("Qui dentro non esiste la parola «sgarro»: si racconta quello che è successo, non si giudica chi l'ha fatto."))}</p>

  <button class="btn saluto-via" type="button" onclick="salutoChiudi()">${esc(tr("Comincia"))}</button>
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
  render(cur);};

/* Serve mostrarla? Solo a chi non l'ha ancora vista e non ha già
   un conto: chi torna non deve rifare la strada. */
window.primoServe=()=>{
  if(primoFatto())return false;
  try{if(S.conto&&S.conto.email)return false;}catch(e){}
  return true;};

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

  return `<div class="primo">
    <div class="primo-logo"><img src="assets/marchio.png" alt="" width="72" height="72" onerror="this.style.display='none'"></div>
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
      <div class="primo-perche">
        <div class="pp">
          <b>${esc(tr("Per non perdere niente"))}</b>
          <span>${esc(tr("I tuoi dati non stanno sui nostri server: stanno sul tuo telefono e, se vuoi, sul TUO Drive. Con la stessa email ritrovi anche l'abbonamento se cambi telefono."))}
            <b class="primo-scomodo">${esc(tr("Se un giorno cancelli quei file dal Drive, i dati sono persi: noi non ne abbiamo una copia."))}</b></span>
        </div>
      </div>

      ${collegato
        ? `<div class="primo-ok">${ic("star",18)} ${esc(tr("Collegato."))}</div>
           <button class="btn acc-b" onclick="primoSalta()">${esc(tr("Prosegui"))}</button>`
        : `<div class="acc">
             <label for="primoMail">${esc(tr("Email"))}</label>
             <input type="email" id="primoMail" inputmode="email" autocomplete="email"
               value="${esc((S.conto&&S.conto.email)||"")}" placeholder="${esc(tr("nome@esempio.it"))}">
             <button class="btn acc-b" onclick="primoProsegui()">${esc(tr("Prosegui"))}</button>
             <div class="acc-sep"><span>${esc(tr("oppure"))}</span></div>
             <button class="btn ghost acc-b acc-g" onclick="primoCollega()">${logoG()}${esc(tr("Entra con Google"))}</button>
             <button class="btn ghost acc-b acc-dopo" onclick="primoSenza()">${esc(tr("Più tardi"))}</button>
           </div>`}
    </div>

    <details class="primo-tec">
      <summary>${esc(tr("Impostazioni di prova"))}</summary>
      <div class="hint">${esc(tr("Servono solo finché l'app non è pubblicata: dopo, la chiave arriva dal nostro server e il collegamento è già configurato. Un utente non vedrà mai questa parte."))}</div>
      <label style="margin-top:12px">CLIENT_ID (Google Cloud)</label>
      <input type="text" id="primoCid" value="${esc(cid)}" placeholder="…apps.googleusercontent.com">
      <label style="margin-top:12px">${esc(tr("Chiave AI"))}</label>
      <input type="password" id="primoKey" value="${esc(key)}" placeholder="${esc(tr("la tua chiave AI"))}">
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
    </details>
  </div>`;};

/* «Prosegui» con l'email scritta a mano: chi non vuole passare da
   Google lascia comunque il modo di ritrovare l'abbonamento. Non è
   un accesso: è un promemoria, e lo diciamo. */
window.primoProsegui=()=>{
  const e=((document.getElementById("primoMail")||{}).value||"").trim();
  if(e&&!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(e))
    return dlgAlert(tr("Quell'indirizzo non sembra completo. Controllalo, oppure vai avanti con «Più tardi»."));
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
      const r=await aiAsk(tr("Rispondi soltanto con la parola OK."),"prova");
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
  if(!cid)return dlgAlert(tr("Per provare il collegamento serve il CLIENT_ID, che trovi nelle impostazioni di prova qui sotto. A pubblicazione avvenuta sarà già configurato."));
  try{
    /* si passa il NOME del campo: qui si chiama primoCid, in Sistema
       dCid. Prima driveConnect cercava sempre quello di Sistema. */
    if(typeof driveConnect==="function")driveConnect("primoCid");
    else dlgAlert(tr("Il collegamento non è disponibile in questo momento."));
  }catch(e){dlgAlert(tr("Il collegamento non è riuscito. Puoi proseguire e collegarlo più tardi da Sistema."));}};

/* «Più tardi» è una scelta legittima, non un ripiego: l'app funziona
   tutta anche senza account. Si dice cosa si perde, e si va avanti. */
window.primoSenza=async()=>{
  const ok=await dlgConfirm(
    tr("Senza account l'app funziona tutta, ma i dati restano solo su questo telefono: se lo perdi o lo cambi, ricominci da capo. Puoi collegarlo quando vuoi da Sistema."),
    {ok:tr("Vado avanti così"),ko:tr("Aspetta, lo collego")});
  if(ok)primoSalta();};
