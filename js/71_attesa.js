/* ═══════════════════════════════════════════════════════════════
   71. L'ATTESA CHE SI MUOVE (v15.19.0)

   IL PROBLEMA, in una riga: chi paga aspetta peggio di chi non paga.

   Chi usa la PROPRIA chiave Gemini riceve le ricette a poco a poco
   (`streamGenerateContent`), e la barra si muove sul lavoro VERO —
   `AI_PIANO_DELTA` conta i giorni già scritti nel testo che arriva.
   Chi ha l'abbonamento passa dal nostro server, che non fa streaming:
   il gancio resta muto e la barra sta ferma a 8% per un minuto.
   Un minuto davanti a una barra ferma non è un minuto di attesa: è un
   minuto di dubbio. E tocca proprio a chi ha pagato.

   LA SCELTA DEL FOUNDER (30/08): non lo streaming dal proxy — una
   percentuale che avanza e si completa quando le ricette sono pronte.
   Giusto, e si può fare onestamente, a una condizione.

   LA CONDIZIONE — «un conteggio senza la sua regola dichiarata è un
   giudizio». Questa barra non stima il LAVORO (non lo sa): stima
   l'ATTESA, e la stima da un fatto vero, non da un numero recitato.
   Il fatto è già in casa: `S.ai.genMs` conserva quanto è durata
   l'ultima generazione. La barra dice, in sostanza: «l'ultima volta
   ci sono voluti 58 secondi». È una MEMORIA, non un'invenzione.

   TRE REGOLE CHE LE IMPEDISCONO DI MENTIRE
   1. Non arriva mai in fondo da sola, e nemmeno vicino. Si ferma a
      TETTO e ci resta finché il risultato vero non arriva. Una barra
      che tocca il 100% e poi aspetta è una bugia che si vede.
      Il TETTO è 78 e non 92 per una ragione precisa: la prima fase
      VERA dopo la scrittura è «controllo», che vale 82. Un tetto più
      alto avrebbe fatto TORNARE INDIETRO la barra da 92 a 82 sotto
      gli occhi della persona, nel momento esatto in cui il lavoro
      vero comincia a parlare. Il tetto sotto il primo gradino vero
      toglie di mezzo tutta la classe di difetto, invece di rincorrerla
      con dei massimi. E il 22% che resta non è margine inventato:
      sono il controllo e l'eventuale ritocco, che devono ancora
      accadere davvero.
   2. Cede il posto al vero. Se lo streaming comincia a parlare, la
      barra finta si spegne e non risale mai: la percentuale non
      torna indietro e non lampeggia fra due sorgenti.
   3. Lo dice. Sotto il numero c'è scritto da dove viene, come per la
      prova e per il foglio della visita.

   NOTA SULLE PAROLE: qui non si scrive mai «piano». Sono RICETTE e
   suggerimenti che la persona modifica: è la postura legale
   dell'app, e vale anche in una barra di avanzamento.
   ═══════════════════════════════════════════════════════════════ */

/* Quanto durò l'ultima volta. Fuori da questi limiti il numero non è
   una memoria ma un incidente (una rete caduta a metà, un orologio
   spostato), e si torna al valore di riferimento. */
const ATTESA_MIN=8000, ATTESA_MAX=240000, ATTESA_DEF=60000;
const ATTESA_TETTO=78;      /* sotto «controllo» (82): vedi regola 1 */
const ATTESA_VITA=360000;   /* vita massima del timer: 6 minuti */
const ATTESA_PARTE=8;       /* da dove comincia: la fase «settimana» */

function attesaRiferimento(){
  var ms=0;
  try{ms=+(S&&S.ai&&S.ai.genMs)||0;}catch(e){ms=0;}
  if(!(ms>=ATTESA_MIN&&ms<=ATTESA_MAX))return {ms:ATTESA_DEF,misurata:false};
  return {ms:ms,misurata:true};}
window.attesaRiferimento=attesaRiferimento;

/* La curva. Lineare fino al riferimento, poi si appiattisce: se il
   modello ci sta mettendo più del solito la barra continua a muoversi
   — piano — invece di inchiodarsi, che è il momento in cui una
   persona chiude l'app. */
function attesaPerc(trascorsoMs,rifMs){
  var t=Math.max(0,+trascorsoMs||0), r=Math.max(1,+rifMs||ATTESA_DEF);
  var q=t/r, base;
  if(q<=1) base=q*0.85;                       /* 0 → 85% nel tempo atteso */
  else     base=0.85+(1-Math.exp(-(q-1)))*0.13; /* poi verso 98%, sempre più piano */
  var p=ATTESA_PARTE+base*(100-ATTESA_PARTE);
  return Math.min(ATTESA_TETTO,Math.round(p));}
window.attesaPerc=attesaPerc;

/* La frase che dichiara la regola. Senza, il numero è un giudizio. */
function attesaNota(){
  var r=attesaRiferimento();
  if(!r.misurata)return tr("La barra segue il tempo, non il lavoro: le ricette arrivano tutte insieme.");
  return trh("La barra segue il tempo: l'ultima volta ci sono voluti {v1} secondi.",
    {v1:Math.round(r.ms/1000)});}
window.attesaNota=attesaNota;

/* ── L'ATTREZZO ────────────────────────────────────────────────────
   `attesaAvvia(tocca)` parte e chiama `tocca(perc,nota)` ogni secondo
   finché non arriva il vero. `.vero()` la spegne per sempre (lo
   streaming ha parlato); `.ferma()` la chiude a fine lavoro.
   Non tiene stato globale: due generazioni insieme non si pestano i
   piedi, e un'attesa dimenticata muore col suo timer. */
function attesaAvvia(tocca){
  var t0=Date.now(), rif=attesaRiferimento().ms, viva=true, ceduta=false;
  var nota=attesaNota();
  /* ── SI SPEGNE DA SOLA ────────────────────────────────────────
     Chi la avvia la ferma quando il lavoro finisce bene; ma la
     strada dell'ERRORE è spesso in un altro blocco, dove la
     variabile non arriva. Un timer dimenticato per ogni tentativo
     fallito è una perdita che non si vede finché non se ne
     accumulano venti. Qui c'è una vita massima: oltre quella non
     c'è più niente da raccontare comunque. */
  var id=setInterval(function(){
    if(!viva||ceduta)return;
    if(Date.now()-t0>ATTESA_VITA){viva=false;try{clearInterval(id);}catch(e){}return;}
    try{tocca(attesaPerc(Date.now()-t0,rif),nota);}catch(e){}
  },1000);
  try{if(id&&id.unref)id.unref();}catch(e){}
  return {
    /* lo streaming ha parlato: da qui in poi comanda il lavoro vero */
    vero:function(){ceduta=true;},
    ceduta:function(){return ceduta;},
    ferma:function(){viva=false;try{clearInterval(id);}catch(e){}},
    perc:function(){return ceduta?null:attesaPerc(Date.now()-t0,rif);},
    nota:function(){return nota;}};}
window.attesaAvvia=attesaAvvia;
