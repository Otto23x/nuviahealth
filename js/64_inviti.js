/* ═══════════════════════════════════════════════════════════════
   64. GLI INVITI — lo strumento giusto nel momento giusto
   ═══════════════════════════════════════════════════════════════
   Nuvia ha diciassette strumenti e quasi nessuno sa che esistono.
   Non perché siano nascosti male: perché quando li cerchi non ti
   servono, e quando ti servirebbero non ti viene in mente di
   cercarli.

   La settimana però ha un ritmo che si ripete per quasi tutti:
   venerdì sera si esce, sabato si cucina per qualcuno, domenica si
   sta a casa, lunedì si riparte. Su quel ritmo si può agganciare
   ogni strumento al momento in cui è la risposta ovvia a qualcosa
   che sta per succedere.

   ── LE REGOLE, e sono la ragione per cui questo non diventa spam ─

   1. UNO PER VOLTA, MAI DUE. Una lista di suggerimenti è un menù,
      e un menù si ignora. Una riga sola è una proposta.
   2. UNO OGNI TRE GIORNI AL MASSIMO. L'invito è una cortesia: se
      arriva ogni giorno diventa un venditore.
   3. SI DICE DUE VOLTE, POI MAI PIÙ. Se dopo due proposte non l'hai
      mai toccato, quello strumento non ti serve — e continuare a
      offrirlo è dire che non abbiamo capito.
   4. CHI LO USA GIÀ NON LO SENTE PROPORRE. Il contatore d'uso lo
      sa: se hai già fotografato dieci piatti, non ti spieghiamo la
      fotocamera.
   5. È UN INVITO, NON UN COMPITO. Nessun bollino, nessun conteggio
      di cose non fatte, e si chiude e sparisce.
   6. DENTRO L'APP, non come notifica. Le notifiche hanno il loro
      motore (P-3) con un tetto di due a settimana, e non si spende
      quel budget per far scoprire una funzione: si spende per le
      cose che riguardano la persona.                              */

const INVITI_KEY="nuvia_inviti";
const INVITI_OGNI=3;          /* giorni fra un invito e l'altro */
const INVITI_VOLTE=2;         /* quante volte si propone la stessa cosa */

/* ── I GANCI ──────────────────────────────────────────────────────
   giorni: 0=domenica … 6=sabato · ore: [da,a]
   Ognuno è il momento in cui quello strumento è la risposta OVVIA a
   qualcosa che sta per succedere, non un momento a caso. */
const INVITI=[
  /* ── VENERDÌ, il pomeriggio prima dell'aperitivo ── */
  {k:"aperitivo",giorni:[5],ore:[16,20],azione:"strumentoVai('craveHack')",
   titolo:"Stasera aperitivo?",
   riga:"Dimmi cosa ti va e ti dico come farcelo stare senza rinunce."},

  /* ── SABATO mattina: si cucina per qualcuno ── */
  {k:"perdue",giorni:[6],ore:[9,13],azione:"strumentoVai('cucinoPerTutti')",
   titolo:"Cucini per qualcuno oggi?",
   riga:"Ti do le dosi per tutti, con la tua porzione già calibrata."},

  /* ── SABATO sera: il compromesso ── */
  {k:"compromesso",giorni:[6],ore:[17,21],azione:"strumentoVai('compromesso')",
   titolo:"Si va fuori?",
   riga:"Guardiamo il menù insieme e scegliamo senza rovinare la settimana."},

  /* ── DOMENICA mattina: la spesa e la preparazione ── */
  {k:"prepara",giorni:[0],ore:[9,14],azione:"show('spesa')",
   titolo:"Ti va di cucinare?",
   riga:"Un'ora oggi e i piatti dei prossimi giorni sono pronti."},

  /* ── DOMENICA sera: la settimana che arriva ── */
  {k:"settimana",giorni:[0],ore:[17,21],azione:"show('piano')",
   titolo:"Come si mette la settimana?",
   riga:"Se sai già di una cena o di una trasferta, dimmelo adesso: il piano si sistema da solo."},

  /* ── MERCOLEDÌ: il fine settimana si prepara prima ── */
  {k:"tesoretto",giorni:[3],ore:[10,20],azione:"strumentoVai('bilanciamento')",
   titolo:"Nel fine settimana c'è qualcosa?",
   riga:"Se me lo dici adesso, i giorni prima si aggiustano da soli. Niente digiuni: solo un po' di margine."},

  /* ── LUNEDÌ: si riparte, e il frigo è quello che è ── */
  {k:"frigo",giorni:[1],ore:[17,21],azione:"strumentoVai('dalFrigo')",
   titolo:"Cosa c'è in frigo?",
   riga:"Dimmi cosa hai e ti tiro fuori una cena che sta nel piano."},

  /* ── MARTEDÌ e GIOVEDÌ sera: le cene di corsa ── */
  {k:"dieciminuti",giorni:[2,4],ore:[18,21],azione:"strumentoVai('dieciMinuti')",
   titolo:"Poco tempo stasera?",
   riga:"Dieci minuti di fornelli, e resta dentro il piano."},

  /* ── il pranzo fuori, nei giorni feriali ── */
  {k:"menu",giorni:[1,2,3,4,5],ore:[11,14],azione:"strumentoVai('menuSel')",
   titolo:"Pranzo fuori?",
   riga:"Fotografa il menù e ti dico cosa prendere."},

  /* ── il sabato pomeriggio della spesa ── */
  {k:"scaffale",giorni:[6],ore:[14,19],azione:"strumentoVai('scaffale')",
   titolo:"Al supermercato?",
   riga:"Inquadra due prodotti e ti dico quale conviene, per te."}
];
window.INVITI=INVITI;

/* I testi passano da tr() espliciti: la regola di casa. */
function invitoTesto(k,campo){
  const T={
    aperitivo:["Stasera aperitivo?","Dimmi cosa ti va e ti dico come farcelo stare senza rinunce."],
    perdue:["Cucini per qualcuno oggi?","Ti do le dosi per tutti, con la tua porzione già calibrata."],
    compromesso:["Si va fuori?","Guardiamo il menù insieme e scegliamo senza rovinare la settimana."],
    prepara:["Ti va di cucinare?","Un'ora oggi e i piatti dei prossimi giorni sono pronti."],
    settimana:["Come si mette la settimana?","Se sai già di una cena o di una trasferta, dimmelo adesso: il piano si sistema da solo."],
    tesoretto:["Nel fine settimana c'è qualcosa?","Se me lo dici adesso, i giorni prima si aggiustano da soli. Niente digiuni: solo un po' di margine."],
    frigo:["Cosa c'è in frigo?","Dimmi cosa hai e ti tiro fuori una cena che sta nel piano."],
    dieciminuti:["Poco tempo stasera?","Dieci minuti di fornelli, e resta dentro il piano."],
    menu:["Pranzo fuori?","Fotografa il menù e ti dico cosa prendere."],
    scaffale:["Al supermercato?","Inquadra due prodotti e ti dico quale conviene, per te."]};
  const v=T[k];
  if(!v)return "";
  const i=campo==="titolo"?0:1;
  /* tr() con letterali: si scrivono a mano, come da regola */
  return k==="aperitivo"?(i?tr("Dimmi cosa ti va e ti dico come farcelo stare senza rinunce."):tr("Stasera aperitivo?"))
    :k==="perdue"?(i?tr("Ti do le dosi per tutti, con la tua porzione già calibrata."):tr("Cucini per qualcuno oggi?"))
    :k==="compromesso"?(i?tr("Guardiamo il menù insieme e scegliamo senza rovinare la settimana."):tr("Si va fuori?"))
    :k==="prepara"?(i?tr("Un'ora oggi e i piatti dei prossimi giorni sono pronti."):tr("Ti va di cucinare?"))
    :k==="settimana"?(i?tr("Se sai già di una cena o di una trasferta, dimmelo adesso: il piano si sistema da solo."):tr("Come si mette la settimana?"))
    :k==="tesoretto"?(i?tr("Se me lo dici adesso, i giorni prima si aggiustano da soli. Niente digiuni: solo un po' di margine."):tr("Nel fine settimana c'è qualcosa?"))
    :k==="frigo"?(i?tr("Dimmi cosa hai e ti tiro fuori una cena che sta nel piano."):tr("Cosa c'è in frigo?"))
    :k==="dieciminuti"?(i?tr("Dieci minuti di fornelli, e resta dentro il piano."):tr("Poco tempo stasera?"))
    :k==="menu"?(i?tr("Fotografa il menù e ti dico cosa prendere."):tr("Pranzo fuori?"))
    :(i?tr("Inquadra due prodotti e ti dico quale conviene, per te."):tr("Al supermercato?"));}
window.invitoTesto=invitoTesto;

/* ── la memoria: cosa è già stato detto, e quando ─────────────── */
function invitiStato(){
  try{
    const d=JSON.parse(localStorage.getItem(INVITI_KEY)||"null");
    if(d&&typeof d==="object")return d;
  }catch(e){}
  return {volte:{},usati:{},ultimo:null};}
function invitiSalva(d){
  try{localStorage.setItem(INVITI_KEY,JSON.stringify(d));}catch(e){}}

/* ── LA SCELTA ────────────────────────────────────────────────── */
window.invitoDelMomento=(quando)=>{
  const t=quando||new Date();
  const st=invitiStato();

  /* 1 · il ritmo: uno ogni tre giorni, non di più */
  if(st.ultimo){
    const giorni=Math.floor((Date.parse(iso(t))-Date.parse(st.ultimo))/86400000);
    if(giorni<INVITI_OGNI)return null;}

  /* 2 · chi apre l'app per la prima volta non ha bisogno di
        suggerimenti: ha bisogno di capire dov'è */
  try{if(!S.onboard||!S.onboard.done)return null;}catch(e){return null;}

  const g=t.getDay(), h=t.getHours();
  const buoni=INVITI.filter(x=>{
    if(x.giorni.indexOf(g)<0)return false;
    if(h<x.ore[0]||h>=x.ore[1])return false;
    /* 3 · detto due volte e mai toccato: non serve */
    if((st.volte[x.k]||0)>=INVITI_VOLTE&&!st.usati[x.k])return false;
    /* 4 · chi lo usa già non se lo sente spiegare */
    if(st.usati[x.k])return false;
    return true;});

  if(!buoni.length)return null;
  /* 5 · uno solo: il primo che capita in quella finestra. Non il
        "migliore" — una scelta furba fra dieci proposte è comunque
        una proposta, e la differenza non si vede. */
  const x=buoni[0];
  return {k:x.k,azione:x.azione,
    titolo:invitoTesto(x.k,"titolo"),
    riga:invitoTesto(x.k,"riga")};};

/* ── quando compare, si segna ─────────────────────────────────── */
window.invitoVisto=(k)=>{
  const st=invitiStato();
  st.volte[k]=(st.volte[k]||0)+1;
  st.ultimo=iso(new Date());
  invitiSalva(st);};

window.invitoAccetta=(k,azione)=>{
  const st=invitiStato();
  st.usati[k]=true;          /* usato: non si propone più */
  invitiSalva(st);
  try{usoSegna("invito");}catch(e){}
  try{eval(azione);}catch(e){}
  render(cur);};

window.invitoChiudi=(k)=>{
  const st=invitiStato();
  /* chiuderlo conta come «detto»: due chiusure e sparisce */
  st.volte[k]=(st.volte[k]||0)+1;
  st.ultimo=iso(new Date());
  invitiSalva(st);
  const el=document.getElementById("invito");
  if(el)el.remove();};

/* ── la card ──────────────────────────────────────────────────── */
/* Una riga, due comandi, e si chiude. Nessun bollino, nessun conto
   di cose non fatte: è un invito, non un compito. */
window.invitoHTML=()=>{
  const i=invitoDelMomento();
  if(!i)return "";
  /* il tono passa dal controllo di sempre */
  try{
    if(typeof curaTestoOk==="function"&&!curaTestoOk(i.titolo+" "+i.riga).ok)return "";
  }catch(e){}
  invitoVisto(i.k);
  return `<div class="card invito" id="invito">
    <button class="invito-x" aria-label="${tr("Chiudi")}" onclick="invitoChiudi('${esc(i.k)}')">${ic("x",16)}</button>
    <h2>${esc(i.titolo)}</h2>
    <div class="hint">${esc(i.riga)}</div>
    <div class="mtools"><button class="chipbtn on" onclick="invitoAccetta('${esc(i.k)}','${esc(i.azione)}')">${esc(tr("Vediamo"))}</button></div>
  </div>`;};

/* Il ponte verso gli strumenti.
   NON si scrive un atterraggio nuovo: `assistGo` esiste già, sa
   trovare la card giusta, la porta in vista e la illumina — ed è
   collaudato (t_riscontro difende proprio il fatto che nessuno usi
   più lo scorrimento cieco). Qui si cerca solo la rotta nella mappa
   dell'assistente e si lascia fare a lui.
   Riscriverlo avrebbe significato avere due atterraggi che col tempo
   divergono: è già successo con i prompt di stima, che erano in
   quattro copie. */
window.strumentoVai=(quale)=>{
  try{
    if(typeof ASSIST_MAP==="undefined"||typeof assistGo!=="function")
      return show("tools");
    const i=ASSIST_MAP.findIndex(r=>r&&r.a&&String(r.a).indexOf(quale)===0);
    if(i>=0)return assistGo(i);
    show("tools");
  }catch(e){try{show("tools");}catch(_){}}};
