/* ═══════════════════════════════════════════════════════════════
   65. LA COSTELLAZIONE — 24 segni, e la Modalità Zen al centro
   ═══════════════════════════════════════════════════════════════
   L'idea è del founder (22/08). Le decisioni prese insieme, e il
   PERCHÉ di ognuna, perché fra sei mesi non si ricostruisce:

   1. SOLO ATTIVAZIONE, NESSUN LIVELLO, NESSUN DECADIMENTO.
      Nella prima stesura le rune avevano tre livelli e scendevano
      dopo sette giorni di inattività. È esattamente il «ricomincio
      lunedì» che Nuvia esiste per togliere: una casella che si
      spegne perché hai avuto una settimana storta PUNISCE l'assenza.
      Qui un segno acceso non si spegne MAI. Il collaudo lo difende.
      Sparito il decadimento è sparita anche la carica «congela il
      conteggio» che serviva a tamponarlo — se serve una protezione
      per andare in ferie, il meccanismo sotto è aggressivo — e con
      loro lo sconto legato al comportamento: sugli store non era
      implementabile, e legare un prezzo alla salute crea l'incentivo
      sbagliato.

   2. COSTELLAZIONE, NON RUOTA. Ventiquattro segni disposti in
      cerchio a raggiera somigliano al «Sole Nero» di Wewelsburg, che
      è oggi il simbolo estremista più riconoscibile della rete. Non
      erano i segni il problema: era la forma del contenitore. Tre
      gruppi sparsi (gli aett SONO tre gruppi da otto) non somigliano
      a niente e restano leggibili su un telefono.

   3. NOME E OBIETTIVO SEMPRE SCRITTI, mai in un tooltip. Un segno
      con la sua didascalia è un alfabeto; un segno isolato è
      un'altra cosa. Vale come scelta di prodotto e come tutela.

   4. IL PREMIO È LA MODALITÀ ZEN, unico e coerente: quando ci sono
      tutti e ventiquattro, l'app SMETTE di mostrare i numeri. È il
      «ci facciamo da parte» del posizionamento, reso concreto.

   5. NIENTE LAVORO IN PIÙ. Come per i traguardi (modulo 28): ogni
      segno si accende da solo da gesti che la persona farebbe
      comunque. Nessuna missione da accettare, nessuna casella da
      spuntare a mano.                                              */

const COST_KEY="nuvia_cost";

function cost(){
  if(!S.cost||typeof S.cost!=="object")S.cost={};
  const C=S.cost;
  if(!Array.isArray(C.attivi))C.attivi=[];   /* chiavi già accese */
  if(typeof C.zen!=="boolean")C.zen=false;   /* premio sbloccato */
  return C;}
window.cost=cost;

/* Il conteggio di un gesto, dal contatore d'uso che esiste già.
   Se le statistiche sono spente il gesto vale 0: la costellazione
   non è una ragione per accenderle. */
function costGesti(g){
  try{const c=usoClassifica(60).righe.find(r=>r.gesto===g);return c?c.n:0;}
  catch(e){return 0;}}

/* Giorni con acqua all'obiettivo, sonno buono, ecc: si leggono dalla
   settimana e dallo storico, senza chiedere niente in più. */
function costGiorni(f){
  let n=0;
  try{(S.week.days||[]).forEach(d=>{if(f(d))n++;});}catch(e){}
  try{(S.history||[]).forEach(w=>(w.days||[]).forEach(d=>{if(f(d))n++;}));}catch(e){}
  return n;}

/* ── I VENTIQUATTRO SEGNI ────────────────────────────────────────
   `s` il segno, `n` il nome, `sig` il significato antico, `t`
   l'obiettivo in parole della persona, `q` quando si accende.
   L'ordine è quello dell'alfabeto: i tre aett sono i tre gruppi. */
function COSTELLAZIONE(){return [
 /* Aett I — le fondamenta */
 {k:"fehu",   s:"ᚠ",n:"Fehu",   sig:tr("il bene che si accumula"), t:tr("Tre giorni dentro i tuoi numeri"),        q:()=>(S.streak.count||0)>=3},
 {k:"uruz",   s:"ᚢ",n:"Uruz",   sig:tr("la forza"),                t:tr("La prima settimana di allenamenti"),      q:()=>costGiorni(d=>(d.workouts||[]).length>0)>=3},
 {k:"thurisaz",s:"ᚦ",n:"Thurisaz",sig:tr("l'urto improvviso"),     t:tr("Una voglia gestita con un'alternativa"),  q:()=>costGesti("voglia")>=1||costGesti("respiro")>=1},
 {k:"ansuz",  s:"ᚨ",n:"Ansuz",  sig:tr("la parola"),               t:tr("La prima domanda all'assistente"),        q:()=>costGesti("ai")>=1||costGesti("assistente")>=1},
 {k:"raidho", s:"ᚱ",n:"Raidho", sig:tr("il viaggio"),              t:tr("Trenta giorni di percorso"),              q:()=>((S.history||[]).length)>=4},
 {k:"kenaz",  s:"ᚲ",n:"Kenaz",  sig:tr("la torcia che mostra"),    t:tr("Cinquanta codici a barre letti"),         q:()=>costGesti("barcode")>=50},
 {k:"gebo",   s:"ᚷ",n:"Gebo",   sig:tr("il dono, lo scambio"),     t:tr("Una spesa organizzata dalla lista"),      q:()=>costGesti("spesa")>=1||costGesti("ordine")>=1},
 {k:"wunjo",  s:"ᚹ",n:"Wunjo",  sig:tr("la gioia"),                t:tr("Un pasto libero vissuto senza colpa"),    q:()=>costGesti("libero")>=1||costGesti("commensali")>=1},
 /* Aett II — quello che succede quando la vita si mette in mezzo */
 {k:"hagalaz",s:"ᚺ",n:"Hagalaz",sig:tr("la grandine"),             t:tr("Un imprevisto ribilanciato"),             q:()=>costGesti("ribilancia")>=1||costGesti("pasto_salta")>=1},
 {k:"nauthiz",s:"ᚾ",n:"Nauthiz",sig:tr("il bisogno"),              t:tr("Un giorno di riposo dichiarato"),         q:()=>costGesti("riposo")>=1||costGiorni(d=>(d.sleep||0)>=8)>=1},
 {k:"isa",    s:"ᛁ",n:"Isa",    sig:tr("il ghiaccio, la pausa"),   t:tr("Il piano tenuto durante uno stallo"),     q:()=>((S.profile.weights||[]).length)>=5},
 {k:"jera",   s:"ᛃ",n:"Jera",   sig:tr("il raccolto, il ciclo"),   t:tr("Tre mesi di percorso"),                   q:()=>((S.history||[]).length)>=12},
 {k:"eihwaz", s:"ᛇ",n:"Eihwaz", sig:tr("l'albero che regge"),      t:tr("Un lunedì ripreso dopo un weekend storto"),q:()=>(S.streak.count||0)>=1&&((S.history||[]).length)>=1},
 {k:"perthro",s:"ᛈ",n:"Perthro",sig:tr("ciò che non si sa ancora"),t:tr("Una ricetta proposta e cucinata"),        q:()=>costGesti("cucina")>=1||costGesti("preparazione")>=1},
 {k:"algiz",  s:"ᛉ",n:"Algiz",  sig:tr("la protezione"),           t:tr("Una fame emotiva scritta con onestà"),    q:()=>costGiorni(d=>(d.emoWhy||[]).length>0)>=1},
 {k:"sowilo", s:"ᛋ",n:"Sowilo", sig:tr("il sole"),                 t:tr("Una settimana di sonno buono"),           q:()=>costGiorni(d=>(d.sleep||0)>=7)>=7},
 /* Aett III — il traguardo */
 {k:"tiwaz",  s:"ᛏ",n:"Tiwaz",  sig:tr("la stella che orienta"),   t:tr("Il primo obiettivo di peso raggiunto"),   q:()=>{try{const w=S.profile.weights||[];const g=+S.profile.goalW||0;
                                                                        return !!(g&&w.length&&((S.diet.goal==="massa")?w[w.length-1].w>=g:w[w.length-1].w<=g));}catch(e){return false;}}},
 {k:"berkana",s:"ᛒ",n:"Berkana",sig:tr("la rinascita"),            t:tr("L'obiettivo aggiornato almeno una volta"), q:()=>costGesti("obiettivo")>=1},
 {k:"ehwaz",  s:"ᛖ",n:"Ehwaz",  sig:tr("il cavallo, il mezzo"),    t:tr("Un dispositivo o un backup collegato"),   q:()=>{try{return !!(S.conto&&S.conto.email)||costGesti("drive")>=1;}catch(e){return false;}}},
 {k:"mannaz", s:"ᛗ",n:"Mannaz", sig:tr("la persona"),              t:tr("Il profilo completo"),                    q:()=>{try{const p=S.profile;return !!(p.name&&p.dob&&p.h&&p.w&&p.goalW);}catch(e){return false;}}},
 {k:"laguz",  s:"ᛚ",n:"Laguz",  sig:tr("l'acqua"),                 t:tr("Quattordici giorni di acqua a posto"),    q:()=>costGiorni(d=>(d.water||0)>=6)>=14},
 {k:"ingwaz", s:"ᛝ",n:"Ingwaz", sig:tr("il seme messo da parte"),  t:tr("Una settimana pianificata in anticipo"),  q:()=>!!S.customPlan&&(typeof planIsEmpty!=="function"||!planIsEmpty())},
 {k:"dagaz",  s:"ᛞ",n:"Dagaz",  sig:tr("il giorno che si apre"),   t:tr("Sei mesi di percorso"),                   q:()=>((S.history||[]).length)>=24},
 {k:"othala", s:"ᛟ",n:"Othala", sig:tr("ciò che è tuo"),           t:tr("Un piatto tuo salvato"),                  q:()=>{try{return Object.keys(S.permMeals||{}).length>=1||costGesti("mia_componi")>=1;}catch(e){return false;}}}
];}
window.COSTELLAZIONE=COSTELLAZIONE;

/* ── L'accensione ────────────────────────────────────────────────
   Gira insieme al controllo dei traguardi. Un segno acceso non si
   spegne mai: `attivi` è una lista a cui si aggiunge soltanto. */
window.costControlla=()=>{
  const C=cost();let nuovo=null;
  COSTELLAZIONE().forEach(x=>{
    if(C.attivi.includes(x.k))return;
    let ok=false;try{ok=!!x.q();}catch(e){ok=false;}
    if(ok){C.attivi.push(x.k);if(!nuovo)nuovo=x;}});
  /* il premio: tutti e ventiquattro. Il toast è l'unico posto in cui
     l'app DICE che finire la costellazione sblocca lo Zen — non solo
     lo fa, lo dichiara nel momento in cui succede (decisione del
     founder, 25/08: «va detto che sbloccare tutto sblocca la
     modalità zen»). */
  if(!C.zen&&C.attivi.length>=COSTELLAZIONE().length){
    C.zen=true;save();
    try{toast(tr("La costellazione è completa: la Modalità Zen è tua."));}catch(e){}
    return nuovo;}
  if(nuovo)save();
  return nuovo;};

window.costAttivi=()=>cost().attivi.length;
window.costZen=()=>!!cost().zen;

/* ── Il disegno ──────────────────────────────────────────────────
   Tre gruppi (gli aett), non un cerchio. Ogni segno porta il nome e
   l'obiettivo scritti accanto: mai un simbolo da solo. */
function costellazioneHTML(){
  const C=cost(),L=COSTELLAZIONE();
  const fatti=C.attivi.length,tot=L.length;
  const gruppi=[[0,8,tr("Le fondamenta")],[8,16,tr("Quando la vita si mette in mezzo")],[16,24,tr("Il traguardo")]];
  let h=`<div class="card costel">
    <h2>${esc(tr("La tua costellazione"))}</h2>
    <div class="hint">${esc(tr("Ventiquattro segni di un alfabeto antico, uno per abitudine. Si accendono da soli con quello che fai: nessuno si spegne mai, nemmeno dopo una settimana storta."))}</div>
    <div class="costmed ${C.zen?"on":""}">
      <div class="costmedn">${fatti}<span>/${tot}</span></div>
      <div class="costmedt">${esc(C.zen?tr("Modalità Zen sbloccata"):tr("Con tutti e ventiquattro, l'app smette di mostrarti i numeri"))}</div>
      ${C.zen?`<button class="btn small" onclick="zenAttiva()">${esc(S.ui.zen?tr("Torna ai numeri"):tr("Accendi la Modalità Zen"))}</button>`:""}
    </div>`;
  gruppi.forEach(([a,b,titolo])=>{
    h+=`<div class="gsec">${esc(titolo)}</div><div class="costgrid">`;
    L.slice(a,b).forEach(x=>{
      const on=C.attivi.includes(x.k);
      h+=`<div class="costseg${on?" on":""}">
        <i aria-hidden="true">${x.s}</i>
        <b>${esc(x.n)}</b>
        <span class="costsig">${esc(x.sig)}</span>
        <span class="costob">${esc(x.t)}</span></div>`;});
    h+=`</div>`;});
  h+=`</div>`;
  return h;}
window.costellazioneHTML=costellazioneHTML;

/* ── LA MODALITÀ ZEN ─────────────────────────────────────────────
   Il premio, e l'unico: i numeri spariscono dalla schermata del
   giorno e restano i colori. Si accende e si spegne quando si
   vuole — un premio che non si può rifiutare è una punizione. */
window.zenAttiva=()=>{
  if(!costZen())return;
  S.ui.zen=!S.ui.zen;save();
  try{toast(S.ui.zen?tr("Modalità Zen accesa: restano i colori."):tr("Numeri di nuovo visibili."));}catch(e){}
  try{render(cur);}catch(e){}};

function renderCostellazione(){const el=document.getElementById("pg-costellazione");
  if(!el)return;
  try{costControlla();}catch(e){}
  el.innerHTML=costellazioneHTML();}
window.renderCostellazione=renderCostellazione;
