/* ═══════════════════════════════════════════════════════════════
   72. CAPIRE COSA PARTE (v15.22.0)

   Il founder, 31/08: «nel caso dell'inglese l'utente dovrebbe vedere
   una preview di quello che manda in inglese per comprenderlo o una
   traduzione. Poi il sistema manda allo sviluppatore in italiano.»

   Ha ragione, e la ragione è seria: la scheda «Cosa sa di te l'AI»
   esiste per far vedere alla persona che cosa parte sul suo conto.
   A un utente inglese quel riquadro mostrava quattromila caratteri
   di italiano — cioè, per lui, niente. Una trasparenza che non si
   capisce non è trasparenza: è un riquadro.

   COSA SI FA, E COSA NON SI FA
   Non si traduce il prompt parola per parola. Sarebbe la cosa
   sbagliata due volte: quattromila caratteri di istruzioni tecniche
   tradotte non li legge nessuno, e soprattutto **mostrare un testo
   tradotto lascerebbe credere che sia quello spedito**, che è
   falso — al modello parte l'italiano, sempre.

   Si fa la cosa che serve davvero: si dice, nella lingua della
   persona e in parole sue, QUALI COSE Nuvia racconta di lei, con
   accanto i SUOI valori. «Intolerances: lactose». «Absolutely
   avoid: liver». Quello si capisce, ed è l'informazione per cui il
   riquadro esiste. Sotto resta il testo vero, italiano, dichiarato
   per quello che è.

   COME SI EVITA CHE LE DUE COSE DIVERGANO — la trappola di sempre.
   Questa vista NON ricostruisce il prompt dallo stato: LEGGE il
   prompt vero e ne riscrive le etichette. Se domani `vincoliStr()`
   aggiunge una voce, quella voce compare qui automaticamente (in
   italiano, finché nessuno le dà un'etichetta) invece di sparire in
   silenzio. E `t_prompt_capire` pretende che ogni etichetta emessa
   davvero abbia la sua traduzione: il giorno in cui ne nasce una
   nuova, il collaudo lo dice.
   ═══════════════════════════════════════════════════════════════ */

/* Le etichette che `vincoliStr()` scrive nel prompt, con la loro
   versione leggibile. La chiave è il testo ESATTO che compare nel
   prompt: si confronta con quello, non con una copia a mano. */
function PROMPT_ETICHETTE(){return {
  "Impostazione alimentare":tr("Come mangi"),
  "tradizione culinaria":tr("Tradizione culinaria"),
  "intolleranze":tr("Intolleranze"),
  "ATTENZIONE, ALLERGIE VERE (mai nel piatto, nessun derivato, nessuna «traccia»)":tr("Allergie (mai nel piatto, in nessuna forma)"),
  "da evitare assolutamente":tr("Da evitare assolutamente"),
  "cibi preferiti":tr("Cibi che ti piacciono"),
  "vincoli religiosi/etici":tr("Vincoli religiosi o etici"),
  "condizioni da tenere presenti":tr("Condizioni di salute dichiarate"),
  "farmaci in uso continuativo (contesto, NON terapia — evita solo interazioni alimentari note)":tr("Farmaci in uso (solo per evitare interazioni note col cibo)"),
  "integratori in uso":tr("Integratori che prendi"),
  "pasti al giorno":tr("Pasti al giorno"),
  "pasti liberi concessi":tr("Pasti liberi a settimana"),
  "pasti fuori casa":tr("Pasti fuori casa"),
  "tempo per cucinare":tr("Tempo per cucinare"),
  "varietà desiderata":tr("Varietà che vuoi"),
  "complessità delle ricette":tr("Quanto complesse le ricette"),
  "budget spesa":tr("Budget della spesa"),
  "budget settimanale per la spesa":tr("Budget settimanale della spesa"),
  "occasioni ricorrenti":tr("Occasioni che si ripetono"),
  "caffè":tr("Caffè"),
  "ALCOL":tr("Alcol"),
  "altre note":tr("Altre note tue")};}
window.PROMPT_ETICHETTE=PROMPT_ETICHETTE;

/* Le voci del prompt che NON sono «etichetta: valore» ma frasi di
   servizio: si saltano, perché non dicono niente sulla persona e
   riempirebbero l'elenco di regole interne. */
const PROMPT_SALTA=[
  "le voci in «da evitare assolutamente»",
  "ATTENZIONE:",
  /* «Stile obbligatorio» non dice niente sulla persona: è la regola
     operativa della cucina scelta, trecento caratteri di istruzioni
     al modello. In un elenco che risponde a «cosa sa di me» sarebbe
     rumore al posto di una risposta — la tradizione culinaria, che è
     il FATTO, compare già nella riga sopra. */
  "Stile obbligatorio:"];

/* Il taglio: da `vincoliStr()` si prende la parte fra il trattino e il
   punto finale, e si spezza sui punti e virgola — che è esattamente
   come è stata composta (`L.join("; ")`). Leggere il testo vero
   invece di rifare il conto è ciò che impedisce alle due viste di
   divergere. */
function promptVoci(testo){
  var t=String(testo||"");
  var i=t.indexOf("Vincoli alimentari della persona — ");
  if(i<0)return [];
  t=t.slice(i+"Vincoli alimentari della persona — ".length);
  /* ── DOVE FINISCE L'ELENCO (corretto al primo giro) ──────────────
     Il taglio era «al primo punto seguito da una maiuscola», e si
     fermava dopo sette voci su venti: la regola della cucina italiana
     contiene un esempio fra parentesi che finisce con un punto, e da
     lì in poi metà del profilo della persona spariva dal riquadro —
     senza che niente lo dicesse. Un taglio sbagliato non dà errore:
     mostra di meno, ed è il tipo di difetto che non si nota mai.
     Il confine vero è la frase di servizio con cui `vincoliStr()` chiude
     l'elenco: da lì in poi non ci sono più voci sulla persona. Se un
     giorno quella frase cambiasse, il collaudo lo direbbe subito —
     conta le voci e ne pretende almeno dodici. */
  var fine=t.indexOf("le voci in «da evitare assolutamente»");
  if(fine>0)t=t.slice(0,fine);
  var mappa=PROMPT_ETICHETTE();
  /* ── I VALORI CONTENGONO PUNTI E VIRGOLA (trovato al primo giro) ──
     Spezzare su «; » e basta rompeva a metà le voci lunghe: la regola
     della cucina italiana e il contratto halal ne contengono parecchi,
     e il collaudo si è ritrovato «etichette» che erano pezzi di frase.
     Un pezzo comincia una voce nuova solo se ha l'aria di un'etichetta:
     un testo BREVE prima dei due punti. Tutto il resto si riattacca al
     valore precedente, dove stava.
     La soglia è la difesa: una voce nuova con un'etichetta corta viene
     comunque vista e segnalata come da tradurre — che è il motivo per
     cui questo taglio esiste. */
  var ETI_MAX=60;
  var pezzi=[];
  t.split(/;\s+/).forEach(function(x){
    var s=x.trim(); if(!s)return;
    var j=s.indexOf(":");
    var nuova=(j>0&&j<=ETI_MAX);
    if(nuova||!pezzi.length)pezzi.push(s);
    else pezzi[pezzi.length-1]+="; "+s;});
  var out=[];
  pezzi.forEach(function(s){
    if(PROMPT_SALTA.some(function(x){return s.indexOf(x)===0;}))return;
    var j=s.indexOf(":");
    if(j<0){out.push({eti:"",val:s,tradotta:false});return;}
    var eti=s.slice(0,j).trim(), val=s.slice(j+1).trim();
    if(!val)return;
    out.push({eti:mappa[eti]||eti, val:val, tradotta:!!mappa[eti]});});
  return out;}
window.promptVoci=promptVoci;

/* La carta. Compare SOLO quando la lingua non è l'italiano: a chi
   legge in italiano il testo vero è già comprensibile, e una
   seconda versione delle stesse cose sarebbe rumore — lo stesso
   difetto del banner della settimana nuova, tolto in agosto. */
function promptPerCapireHTML(testo){
  if(LANG==="it")return "";
  var voci=promptVoci(testo);
  if(!voci.length)return "";
  var righe=voci.map(function(v){
    return '<div class="pcap-r"><span class="pcap-e">'+esc(v.eti)+'</span>'+
      '<span class="pcap-v">'+esc(v.val)+'</span></div>';}).join("");
  return '<div class="pcap">'+
    '<div class="pcap-t">'+esc(tr("Cosa dice Nuvia di te"))+'</div>'+
    '<div class="hint">'+esc(tr("Queste sono le cose che partono sul tuo conto a ogni richiesta. Le etichette sono nella tua lingua; i valori sono scritti esattamente come viaggiano, perché il testo vero è quello qui sotto."))+'</div>'+
    righe+'</div>';}
window.promptPerCapireHTML=promptPerCapireHTML;


/* ═══ E LO STESSO PER I DATI D'USO (v15.23.0) ═════════════════════
   Il founder, 31/08, chiarendo cosa intendeva: «l'utente deve vedere
   il testo che manda come dati di utilizzo». La card in Sistema
   mostrava già il pacchetto vero — «Cosa esce, esattamente» — ma i
   nomi dei campi sono in italiano (`installata_da_giorni`,
   `pasti_spuntati`): a un utente inglese il pacchetto reale diceva
   poco. Stesso schema della vista qui sopra: etichette nella sua
   lingua, valori esattamente come viaggiano, il JSON vero subito
   sotto. E lo stesso collaudo di completezza: un campo nuovo nel
   pacchetto senza etichetta fa diventare rosso t_prompt_capire. */
function TEL_ETICHETTE(){return {
  id:tr("Codice casuale (non è il tuo nome)"),
  versione:tr("Versione dell'app"),
  installata_da_giorni:tr("Da quanti giorni è installata"),
  giorni_di_utilizzo:tr("In quanti giorni l'hai usata"),
  ultimo_utilizzo:tr("Ultimo giorno di utilizzo"),
  pasti_spuntati:tr("Quanti pasti hai spuntato"),
  richieste_ai:tr("Quante richieste all'AI"),
  ha_ricette:tr("Se hai delle ricette attive (sì/no)")};}
window.TEL_ETICHETTE=TEL_ETICHETTE;

function telPerCapireHTML(payload){
  var p=payload||{};
  var mappa=TEL_ETICHETTE();
  var righe=Object.keys(p).map(function(k){
    return '<div class="pcap-r"><span class="pcap-e">'+esc(mappa[k]||k)+'</span>'+
      '<span class="pcap-v">'+esc(String(p[k]))+'</span></div>';}).join("");
  return '<div class="pcap">'+righe+'</div>';}
window.telPerCapireHTML=telPerCapireHTML;
