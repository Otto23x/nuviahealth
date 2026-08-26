/* ═══════════════════════════════════════════════════════════════
   58. LE MICRO-CONFERME
   ═══════════════════════════════════════════════════════════════
   Nelle prime schermate ogni risposta è un investimento: qualcuno
   ci sta dando il proprio peso, il proprio obiettivo, cosa non
   riesce a mangiare. Rispondere con un silenzio e la schermata
   dopo è il modo più economico di far sembrare l'app un modulo da
   compilare.

   Quindi: una riga di riconoscimento, e via.

   LE QUATTRO REGOLE, che sono la ragione per cui funziona:

   1. SOLO NELL'ONBOARDING. Nell'uso quotidiano «bene, hai segnato
      il pranzo» diciotto volte al giorno diventa rumore — e
      soprattutto sposta il merito sull'app invece che sulla
      persona. Là fa il suo lavoro il festone: 900 ms, nessuna
      parola, e il merito resta a chi ha fatto la cosa.

   2. RICONOSCERE, NON COMPLIMENTARSI. «Segnato» e «Questo aiuta»
      sono riconoscimenti; «Bravo!» e «Ottima scelta!» sono
      complimenti su una cosa che non ha niente di bravo — hai
      scritto la tua altezza. I complimenti finti si sentono, e
      dopo tre schermate non si crede più a niente.

   3. UNA VOLTA SOLA PER RISPOSTA. Se torni indietro a correggere,
      la conferma non ricompare: la seconda volta non è più un
      riconoscimento, è una macchinetta.

   4. MAI SULLE COSE DELICATE. Chi dichiara un'intolleranza, una
      condizione o un peso che non gli piace non vuole una
      pacca: vuole andare avanti. Su quelle schermate si tace, e
      il silenzio è la forma di rispetto più semplice che esista.  */

const CONF_DETTE="nuvia_conferme";

function confDette(){
  try{
    const l=JSON.parse(localStorage.getItem(CONF_DETTE)||"[]");
    return Array.isArray(l)?l:[];
  }catch(e){return [];}}

/* Le schermate su cui NON si dice niente. L'elenco è esplicito
   apposta: se domani si aggiunge una domanda delicata, va aggiunta
   qui a mano — un elenco che si popola da sé finirebbe per
   dimenticare proprio i casi che contano. */
const CONF_ZITTE=["intolleranze","salute","condizioni","peso","pesoObiettivo","fisico"];
window.CONF_ZITTE=CONF_ZITTE;

/* La frase per ogni passaggio. Scritte una per una, non generate:
   «riconoscimento generico» è un ossimoro. */
function confFrase(k){
  /* Le frasi che citano LA RISPOSTA valgono dieci volte quelle
     generiche: «ce lo ricordiamo, non te lo riproporremo» dimostra
     che la risposta è stata LETTA, non solo registrata. Dove la
     risposta non aggiunge niente, si resta sul riconoscimento
     semplice — meglio breve che finto personale. */
  try{
    const o=(typeof onb2Stato==="function")?onb2Stato():null;
    const r=o&&o.ris?o.ris[k]:null;
    const nome=(S.profile&&S.profile.name)?String(S.profile.name).split(" ")[0]:"";

    if(k==="obiettivo"){
      if(r==="mantieni"||/manten/i.test(String(r)))
        return tr("Mantenere è un obiettivo, non un ripiego.");
      if(r==="massa"||/massa|muscol/i.test(String(r)))
        return tr("Costruire richiede pazienza. Ci siamo.");}
    if(k==="nome"&&nome)return tr("Ciao {n}.",{n:nome});
    if((k==="cibo"||k==="allergie")&&Array.isArray(r)&&!r.length)
      return tr("Nessuna esclusione, allora: campo libero.");
    if(k==="famiglia"&&+r>1)
      return tr("In {n}: le porzioni si regoleranno da sole.",{n:+r});
  }catch(e){}

  return k==="obiettivo" ?tr("Bene, so da dove partire.")
       :k==="bio"        ?tr("Fatto: non te li chiedo più.")
       :k==="ritmi"      ?tr("Il piano si adatterà a queste ore.")
       :k==="cibo"       ?tr("Me lo ricordo, non te lo riproporrò.")
       :k==="senso"      ?tr("Grazie di averlo scritto.")
       :k==="allergie"   ?tr("Segnato: non comparirà nei tuoi piatti.")
       :k==="sport"      ?tr("Buono a sapersi: entra nel conto della giornata.")
       :k==="cucina"     ?tr("Ne tengo conto quando propongo i piatti.")
       :k==="spesa"      ?tr("La lista nascerà su questa misura.")
       :k==="famiglia"   ?tr("Le porzioni si regoleranno da sole.")
       :"";}
window.confFrase=confFrase;

/* ── il gesto ─────────────────────────────────────────────────── */
window.confermaPasso=(k)=>{
  const chiave=String(k||"");
  if(!chiave)return false;
  if(CONF_ZITTE.includes(chiave))return false;      /* qui si tace */
  const frase=confFrase(chiave);
  if(!frase)return false;
  const dette=confDette();
  if(dette.includes(chiave))return false;           /* già detta: basta */
  /* il tono passa dal controllo di sempre: una frase gentile che
     contiene una parola vietata non è gentile */
  try{
    if(typeof PAROLE_VIETATE!=="undefined"&&
       PAROLE_VIETATE.some(p=>frase.toLowerCase().includes(String(p).toLowerCase())))return false;
  }catch(e){}
  dette.push(chiave);
  try{localStorage.setItem(CONF_DETTE,JSON.stringify(dette.slice(-20)));}catch(e){}
  confMostra(frase);
  return true;};

/* ── come appare ──────────────────────────────────────────────── */
/* Una riga che scivola dal basso, resta 1,6 secondi e va via. Non
   un pannello, non un bottone da chiudere: una cosa che non chiede
   niente. Il segno di spunta si DISEGNA (300 ms), perché un segno
   che appare è un'immagine, uno che si disegna è un gesto. */
function confMostra(frase){
  const vecchio=document.getElementById("microconf");
  if(vecchio)vecchio.remove();
  const el=document.createElement("div");
  el.id="microconf";el.className="microconf";
  el.setAttribute("role","status");        /* lo legge anche il lettore di schermo */
  el.innerHTML=`<svg class="mcsegno" viewBox="0 0 24 24" width="19" height="19"
      fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"
      stroke-linejoin="round" aria-hidden="true">
      <path class="mcpath" d="M4.5 12.5l5 5 10-10"/></svg><span>${esc(frase)}</span>`;
  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add("on"));
  setTimeout(()=>{el.classList.remove("on");
    setTimeout(()=>el.remove(),400);},1600);}
window.confMostra=confMostra;

/* Azzerabile: chi rifà il percorso guidato ha diritto a risentirle. */
window.confAzzera=()=>{try{localStorage.removeItem(CONF_DETTE);}catch(e){}};


/* ── LA FINE DEL PERCORSO ─────────────────────────────────────────
   Qui il festeggiamento ci sta: è l'unico momento in cui qualcosa è
   stato COMPLETATO davvero. Dieci schermate sono un investimento, e
   arrivare in fondo merita più di un cambio di pagina.
   Resta breve come tutto il resto: due secondi, e poi l'app. */
window.confermaFine=()=>{
  try{
    const n=(S.profile&&S.profile.name)?String(S.profile.name).split(" ")[0]:"";
    const el=document.createElement("div");
    el.id="microconf";el.className="microconf grande";
    el.setAttribute("role","status");
    el.textContent=n?tr("Ci siamo, {n}. Il piano è tuo.",{n:n})
                    :tr("Ci siamo. Il piano è tuo.");
    document.body.appendChild(el);
    requestAnimationFrame(()=>el.classList.add("on"));
    /* i coriandoli del festone: la stessa animazione della spunta di
       un pasto, perché è la stessa cosa — una cosa portata a termine */
    if(typeof festone==="function")festone(null,innerHeight*0.4);
    setTimeout(()=>el.classList.remove("on"),2000);
    setTimeout(()=>el.remove(),2400);
  }catch(e){}};
