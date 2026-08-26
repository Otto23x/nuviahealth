/* ═══════════════════════════════════════════════════════════════
   65. LA RUOTA — ventiquattro gesti, e poi l'app si toglie di mezzo
   ═══════════════════════════════════════════════════════════════
   IDEA DEL FOUNDER (22/08/2026), e le sue regole non negoziabili:

   1. NIENTE PUNIZIONE. Un segno acceso non si spegne MAI. Non c'è
      decadimento a sette giorni, non ci sono scudi da spendere per
      andare in ferie. La settimana storta, in Nuvia, non conta —
      e un meccanismo che la conta sarebbe il «ricomincio lunedì»
      travestito da simbolo.
   2. NIENTE LIVELLI. Due stati soli: acceso o non ancora. Corallo,
      turchese e oro insieme erano tre gradi di giudizio su una
      persona che sta solo vivendo.
   3. NIENTE DA FARE. Come tutto il modulo 28: i segni si accendono
      per gesti che la persona farebbe comunque. Zero secondi al
      giorno di costo. Nessun bottone «accetta la sfida».
   4. IL PREMIO È TOGLIERE, NON DARE. A ventiquattro su ventiquattro
      si sblocca la Modalità Zen: l'app smette di mostrare i numeri.
      È il «ci facciamo da parte» del posizionamento, reso gesto.
      Nessuno sconto legato al comportamento: legare il prezzo alla
      salute crea l'incentivo sbagliato (e sugli store non si fa).

   SULLA FORMA (deciso il 22/08 dopo verifica delle fonti):
   Le rune si tengono, ma la ruota NON è a raggiera. Il Sole Nero di
   Wewelsburg — il simbolo neonazista più diffuso — è UNA runa sola
   (sig) ripetuta dodici volte, con i raggi che convergono al centro.
   Qui i segni sono ventiquattro DIVERSI, dritti, senza raggi verso
   il centro, ognuno col suo nome e il suo obiettivo scritti accanto.
   L'ADL stessa dice che le ruote solari vanno lette nel contesto:
   questo contesto — ventiquattro abitudini di salute, ognuna
   dichiarata — è il contesto che le spiega. Niente oro su nero,
   niente lessico guerriero: turchese e grigio, e basta.

   OGNI CONDIZIONE LEGGE DATI CHE ESISTONO GIÀ. Nessun contatore
   nuovo, nessun campo inventato: se un gesto non è misurabile con
   quello che l'app registra davvero, non entra nella ruota.      */

const RUOTA_MIN=24;

/* Il contatore d'uso (57_uso) è spegnibile: se è spento, i segni che
   dipendono da lui non si accendono e lo diciamo, invece di fingere
   che la persona non abbia fatto niente. */
function ruotaUso(g){
  try{if(typeof usoAttivo==="function"&&!usoAttivo())return 0;
    const c=(typeof usoClassifica==="function")?usoClassifica(60).righe:[];
    const r=c.find(x=>x.gesto===g);return r?r.n:0;}catch(e){return 0;}}

function ruotaGiorni(){try{return (S.week&&S.week.days)||[];}catch(e){return [];}}
function ruotaStorico(){try{return S.history||[];}catch(e){return [];}}
function ruotaPesi(){try{return (S.profile&&S.profile.weights)||[];}catch(e){return [];}}

/* Quanti giorni, in tutto lo storico più la settimana in corso,
   soddisfano una condizione. Serve a metà dei segni. */
function ruotaConta(f){
  let n=0;
  try{
    ruotaGiorni().forEach(d=>{if(f(d))n++;});
    ruotaStorico().forEach(w=>(w.days||[]).forEach(d=>{if(f(d))n++;}));
  }catch(e){}
  return n;}

/* ── I VENTIQUATTRO ────────────────────────────────────────────────
   `r` è la runa, `n` il nome, `t` l'obiettivo detto a una persona
   (non al codice), `q` la condizione che lo accende. L'obiettivo si
   VEDE sempre accanto al segno: un simbolo senza didascalia è un
   simbolo isolato, e questo è ciò che non vogliamo essere. */
function RUOTA(){return [
 /* Aett I — le fondamenta */
 {k:"fehu",   r:"ᚠ",n:tr("Fehu"),    t:tr("Tre giorni dentro i tuoi numeri"),
  s:tr("Bestiame, la ricchezza che si conta ogni giorno — come le prime giornate dentro i numeri"),
  q:()=>ruotaConta(d=>d&&d.meals&&Object.keys(d.meals).length>0)>=3},
 {k:"uruz",   r:"ᚢ",n:tr("Uruz"),    t:tr("La prima settimana con del movimento"),
  s:tr("Il bue selvatico: forza grezza da addomesticare, come il movimento all'inizio"),
  q:()=>ruotaConta(d=>d&&(d.workouts||[]).length>0)>=3},
 {k:"thurisaz",r:"ᚦ",n:tr("Thurisaz"),t:tr("Una voglia attraversata con uno strumento"),
  s:tr("La spina: l'ostacolo improvviso, cioè la voglia che arriva senza avvisare"),
  q:()=>ruotaUso("respiro")+ruotaUso("bevanda")>=1},
 {k:"ansuz",  r:"ᚨ",n:tr("Ansuz"),   t:tr("Hai chiesto qualcosa all'assistente"),
  s:tr("La parola e la voce: la domanda fatta a chi ne sa qualcosa"),
  q:()=>ruotaUso("scheda")>=1},
 {k:"raidho", r:"ᚱ",n:tr("Raidho"),  t:tr("Trenta giorni di percorso"),
  s:tr("Il viaggio: non un giorno, la strada — trenta giorni di percorso"),
  q:()=>ruotaStorico().length>=4},
 {k:"kenaz",  r:"ᚲ",n:tr("Kenaz"),   t:tr("Cinquanta prodotti letti col codice a barre"),
  s:tr("La torcia: vedere cosa c'è dentro, come leggere l'etichetta di un prodotto"),
  q:()=>ruotaUso("barcode")>=50},
 {k:"gebo",   r:"ᚷ",n:tr("Gebo"),    t:tr("Hai cucinato per più di te"),
  s:tr("Il dono e lo scambio: la spesa che nasce dal piano e torna in tavola"),
  q:()=>ruotaUso("commensali")>=1},
 {k:"wunjo",  r:"ᚹ",n:tr("Wunjo"),   t:tr("Un pasto libero segnato senza sensi di colpa"),
  s:tr("La gioia: il pasto libero vissuto come gioia, non come colpa"),
  q:()=>ruotaConta(d=>d&&(d.extras||[]).length>0)>=1},

 /* Aett II — quello che succede quando la vita si mette in mezzo */
 {k:"hagalaz",r:"ᚺ",n:tr("Hagalaz"), t:tr("Una giornata storta rimessa in piedi"),
  s:tr("La grandine: l'imprevisto che arriva e non si può evitare, solo attraversare"),
  q:()=>ruotaUso("ordine")+ruotaUso("partner")>=1},
 {k:"nauthiz",r:"ᚾ",n:tr("Nauthiz"), t:tr("Un giorno di riposo dichiarato"),
  s:tr("Il bisogno: riconoscere che oggi serve fermarsi"),
  q:()=>{try{return (S.hardDays&&Object.keys(S.hardDays).length>0)
        ||ruotaConta(d=>d&&d.sleep&&+d.sleep>=8)>=1;}catch(e){return false;}}},
 {k:"isa",    r:"ᛁ",n:tr("Isa"),     t:tr("Hai continuato durante uno stallo del peso"),
  s:tr("Il ghiaccio: la fase in cui tutto sembra fermo e invece sta tenendo"),
  q:()=>ruotaPesi().length>=4},
 {k:"jera",   r:"ᛃ",n:tr("Jera"),    t:tr("Tre mesi di percorso"),
  s:tr("Il raccolto e il ciclo dell'anno: i mesi che danno il risultato"),
  q:()=>ruotaStorico().length>=12},
 {k:"eihwaz", r:"ᛇ",n:tr("Eihwaz"),  t:tr("Un lunedì ripreso dopo un fine settimana pieno"),
  s:tr("Il tasso, l'albero che regge l'inverno: il lunedì dopo il weekend storto"),
  q:()=>ruotaStorico().length>=2},
 {k:"perthro",r:"ᛈ",n:tr("Perthro"), t:tr("Una ricetta cucinata e salvata"),
  s:tr("Il bussolotto dei dadi: provare qualcosa senza sapere come verrà"),
  q:()=>{try{return (S.recipes||[]).length>=1||ruotaUso("cucina")>=1;}catch(e){return false;}}},
 {k:"algiz",  r:"ᛉ",n:tr("Algiz"),   t:tr("Hai segnato una fame che veniva dalla testa"),
  s:tr("L'alce e le corna alzate: accorgersi in tempo di quello che sale dentro"),
  q:()=>ruotaConta(d=>d&&d.hunger!=null&&+d.hunger>=3)>=1},
 {k:"sowilo", r:"ᛋ",n:tr("Sowilo"),  t:tr("Sette notti di sonno registrate"),
  s:tr("Il sole: la luce che torna dopo la notte, cioè dormire bene"),
  q:()=>ruotaConta(d=>d&&d.sleep!=null&&+d.sleep>0)>=7},

 /* Aett III — il traguardo, e il farsi da parte */
 {k:"tiwaz",  r:"ᛏ",n:tr("Tiwaz"),   t:tr("Il peso obiettivo raggiunto"),
  s:tr("La stella polare: il punto che si tiene d'occhio per anni"),
  q:()=>{try{const g=+S.profile.goalW,w=ruotaPesi();
    if(!(g>0)||!w.length)return false;
    const u=+w[w.length-1].w,p=+w[0].w;
    return p>g?u<=g:u>=g;}catch(e){return false;}}},
 {k:"berkana",r:"ᛒ",n:tr("Berkana"), t:tr("Hai cambiato obiettivo quando serviva"),
  s:tr("La betulla, primo albero a rinascere: il passaggio a una fase nuova"),
  q:()=>{try{return (S.progressLog||[]).length>=1;}catch(e){return false;}}},
 {k:"ehwaz",  r:"ᛖ",n:tr("Ehwaz"),   t:tr("Il backup collegato al tuo Drive"),
  s:tr("Il cavallo: due che vanno insieme, come l'app e i tuoi strumenti"),
  q:()=>{try{return !!(S.drive&&S.drive.on);}catch(e){return false;}}},
 {k:"mannaz", r:"ᛗ",n:tr("Mannaz"),  t:tr("Il profilo completo"),
  s:tr("L'essere umano: chi sei, i tuoi dati, il profilo completo"),
  q:()=>{try{const p=S.profile;return !!(p.name&&p.dob&&p.h>0&&p.w>0&&p.goalW>0);}catch(e){return false;}}},
 {k:"laguz",  r:"ᛚ",n:tr("Laguz"),   t:tr("Quattordici giorni con l'acqua a posto"),
  s:tr("L'acqua: quella che bevi, giorno dopo giorno"),
  q:()=>ruotaConta(d=>d&&+(d.water||0)>=6)>=14},
 {k:"ingwaz", r:"ᛝ",n:tr("Ingwaz"),  t:tr("Una settimana intera pianificata"),
  s:tr("Il seme messo sotto terra: pianificare adesso per la settimana che viene"),
  q:()=>{try{return !!S.customPlan&&(typeof planIsEmpty!=="function"||!planIsEmpty());}catch(e){return false;}}},
 {k:"dagaz",  r:"ᛞ",n:tr("Dagaz"),   t:tr("Sei mesi: non è più una dieta, è come vivi"),
  s:tr("L'alba, il passaggio che non torna indietro: sei mesi cambiano un'abitudine"),
  q:()=>ruotaStorico().length>=24},
 {k:"othala", r:"ᛟ",n:tr("Othala"),  t:tr("La tua dispensa e i tuoi piatti, salvati"),
  s:tr("La casa e ciò che si tramanda: le tue ricette, quelle che restano"),
  q:()=>{try{return ((pantry().items||[]).length>=1)&&((S.recipes||[]).length>=1);}catch(e){return false;}}}
];}

/* ── Lo stato ─────────────────────────────────────────────────────
   Una volta acceso, resta acceso: si scrive in S.gioco.ruota e non
   si rilegge più la condizione. È la regola numero uno. */
function ruotaStato(){
  const G=(typeof gioco==="function")?gioco():(S.gioco=S.gioco||{});
  if(!Array.isArray(G.ruota))G.ruota=[];
  return G;}

window.ruotaControlla=()=>{
  const G=ruotaStato(),nuovi=[];
  RUOTA().forEach(x=>{
    if(G.ruota.includes(x.k))return;      /* già acceso: non si tocca */
    let ok=false;try{ok=!!x.q();}catch(e){ok=false;}
    if(ok){G.ruota.push(x.k);nuovi.push(x);}});
  if(nuovi.length&&!RUOTA_DENTRO_SAVE){try{save();}catch(e){}}
  return nuovi;};

/* Il controllo gira DOPO ogni salvataggio, non a comando: è così che
   una runa si accende da sola nel momento esatto in cui il gesto
   avviene. La bandierina evita il salvataggio ricorsivo (accendo →
   salvo → controllo → accendo…): dentro save() lo stato è già in
   partenza per il disco, quindi basta segnarlo. */
let RUOTA_DENTRO_SAVE=false;
window.ruotaDopoSalvataggio=()=>{
  if(RUOTA_DENTRO_SAVE)return;
  RUOTA_DENTRO_SAVE=true;
  try{
    const nuovi=ruotaControlla();
    if(nuovi.length){
      /* un avviso di due secondi, come i traguardi: si vede e va via */
      /* nome e gesto sono GIÀ tradotti nel catalogo: si accostano, non
         si passa da una chiave-contenitore che non vuol dire niente */
      /* ── IL TOAST DELLE RUNE NON ESCE PIÙ (founder, 25/08) ─────
         «Mannaz · Il profilo completo» compariva come messaggio a
         chi stava solo compilando il profilo: fuori contesto,
         sembrava un errore o uno scherzo («fa passare l'app per una
         cosa fatta male»). La runa si sblocca lo stesso, in
         silenzio: chi apre la costellazione la trova accesa, che è
         il posto dove quel linguaggio ha senso. */
      try{if(typeof cur!=="undefined"&&cur==="ruota")renderRuota();}catch(e){}
    }
  }finally{RUOTA_DENTRO_SAVE=false;}};

window.ruotaAccese=()=>ruotaStato().ruota.length;
window.ruotaComplete=()=>ruotaAccese()>=RUOTA_MIN;

/* ── La riga che parla a chi è a metà ─────────────────────────────
   Con due soli stati, chi ne ha diciannove non vedrebbe mai cambiare
   niente. Questa riga dice a che punto è e cosa manca — senza
   percentuali e senza rimproveri. */
function ruotaRiga(){
  const G=ruotaStato(),n=G.ruota.length;
  if(n===0)return tr("I segni si accendono da soli, mentre usi l'app. Non c'è niente da fare.");
  if(n>=RUOTA_MIN)return tr("Ventiquattro su ventiquattro. Da qui in poi decidi tu quanto vedere.");
  const manca=RUOTA().filter(x=>!G.ruota.includes(x.k))[0];
  return tr("{v1} segni su {v2}. Il prossimo che si accenderà, probabilmente: {v3}.",
            {v1:n,v2:RUOTA_MIN,v3:manca?manca.t.toLowerCase():""});}

/* ── Il disegno ───────────────────────────────────────────────────
   Cerchio, ventiquattro segni DRITTI, nessun raggio verso il centro,
   il marchio vero al centro (lo stesso file dell'app, non un
   ridisegno). Turchese acceso, grigio spento — lo spento si VEDE:
   deve dire cosa manca, non nascondersi. */
function ruotaSVG(){
  const G=ruotaStato(),L=RUOTA();
  const R=118,C=150;
  let seg="";
  L.forEach((x,i)=>{
    const a=(i/L.length)*2*Math.PI-Math.PI/2;
    const cx=C+R*Math.cos(a),cy=C+R*Math.sin(a);
    const on=G.ruota.includes(x.k);
    /* L'IDENTITÀ, non la decorazione (founder, 22/08): i due colori di
       Nuvia si alternano — lettera dispari corallo, pari turchese.
       Regola semplice, nessuna gerarchia: non è un livello, è il
       marchio che si accende. */
    const pari=(i%2===1);
    seg+=`<g class="rn ${on?(pari?"on onT":"on onC"):"off"}" data-k="${esc(x.k)}">
      <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="15"/>
      <text x="${cx.toFixed(1)}" y="${(cy+6).toFixed(1)}" text-anchor="middle">${x.r}</text></g>`;});
  return `<svg class="ruotaSvg" viewBox="0 0 300 300" role="img"
     aria-label="${esc(tr("{v1} segni accesi su {v2}",{v1:G.ruota.length,v2:RUOTA_MIN}))}">
    <circle class="rgiro" cx="${C}" cy="${C}" r="${R}"/>
    <image href="assets/marchio.png" x="${C-38}" y="${C-38}" width="76" height="76"
      preserveAspectRatio="xMidYMid meet"/>
    ${seg}</svg>`;}

/* ── La pagina ────────────────────────────────────────────────────
   Ogni segno con NOME e OBIETTIVO scritti accanto: è la cosa che
   rende evidente di cosa si sta parlando, e non è decorazione. */
window.renderRuota=()=>{
  const el=document.getElementById("pg-ruota");if(!el)return;
  ruotaControlla();
  const G=ruotaStato(),L=RUOTA();
  let h=`<div class="gsec">${esc(tr("Il tuo percorso"))}</div>`;
  h+=`<div class="card ruotaCard">${ruotaSVG()}
    <div class="ruotaRiga">${esc(ruotaRiga())}</div></div>`;
  h+=ruotaAlfabetoHTML();
  h+=`<div class="card"><h2>${esc(tr("I ventiquattro"))}</h2>
    <div class="hint">${esc(tr("Ogni segno porta il nome, il significato antico e l'obiettivo a cui è legato: è il motivo per cui quel simbolo sta in quel posto."))}</div>
    <ul class="rlist">`+L.map(x=>{
      const on=G.ruota.includes(x.k);
      /* NOME · SIGNIFICATO · OBIETTIVO, sempre e tutti e tre. Un
         simbolo con la sua didascalia non è un simbolo isolato: è la
         differenza fra un alfabeto spiegato e un'insegna. */
      /* stessa alternanza del cerchio, così un segno ha lo stesso
         colore nei due posti in cui compare */
      const c=(L.indexOf(x)%2===0)?" c":"";
      return `<li class="${on?"on"+c:"off"}"><i>${x.r}</i>
        <span><b>${esc(x.n)}</b>
          <u>${esc(x.s||"")}</u>
          ${esc(x.t)}</span>
        <em>${on?esc(tr("acceso")):""}</em></li>`;}).join("")+`</ul></div>`;
  el.innerHTML=h;};

/* ── DA DOVE VENGONO QUESTI SEGNI ─────────────────────────────────
   Non è decorazione né esoterismo: è la risposta alla domanda che
   farebbe chiunque apra questa pagina la prima volta. E dichiararlo
   è anche ciò che rende l'uso evidente per quello che è — un
   alfabeto usato per intero, ogni lettera con la sua didascalia. */
function ruotaAlfabetoHTML(){
  return `<div class="card"><h2>${esc(tr("Che alfabeto è"))}</h2>
    <div class="hint">
      <p>${esc(tr("È il Futhark antico, l'alfabeto con cui si scriveva nel Nord Europa fra il II e l'VIII secolo: ventiquattro lettere incise su pietra, legno e metallo. Prende il nome dalle sue prime sei — F, U, TH, A, R, K — come il nostro «alfabeto» dalle prime due greche."))}</p>
      <p>${esc(tr("Ogni lettera aveva anche un nome e una cosa che significava: Fehu era il bestiame, cioè la ricchezza che si contava ogni giorno; Isa era il ghiaccio; Jera il raccolto dell'anno. Sono parole di gente che misurava il tempo con le stagioni e la fatica con quello che aveva in mano."))}</p>
      <p>${esc(tr("Li abbiamo scelti per questo: ventiquattro segni, ventiquattro abitudini, e un significato che c'entra davvero con l'obiettivo — non un badge con una stellina. Il tasso che regge l'inverno per il lunedì dopo un weekend storto, la grandine per l'imprevisto, il sole per il sonno."))}</p>
    </div></div>`;}

/* ── LA MODALITÀ ZEN NON VIVE QUI (decisione del founder, 25/08) ──
   Questa pagina («Il tuo percorso») e 65_costellazione.js («La tua
   costellazione») sono nate lo stesso giorno (22/08) come lo stesso
   alfabeto di ventiquattro segni raccontato due volte: prima come
   ruota a raggiera, poi — per lo stesso motivo di forma spiegato
   nell'intestazione di 65_costellazione.js (la somiglianza col
   Sole Nero di Wewelsburg) — come tre gruppi. Ogni file dichiarava
   un proprio `zenAttiva`: quello di qui IMPOSTAVA un valore passato,
   quello della costellazione lo INVERTIVA e prima controllava se
   fosse sbloccato. Nel monolite l'ultimo vinceva in silenzio, e il
   bottone qui sotto — quando lo Zen non era ancora sbloccato —
   toccava una funzione che non faceva letteralmente niente.
   Deciso (25/08): **la costellazione comanda**. «Zen si accende solo
   con tutti e ventiquattro i segni, e va detto chiaramente che
   finirli lo sblocca» — è la pagina Costellazione a dirlo, prima e
   dopo lo sblocco (vedi 65_costellazione.js). Qui il controllo non
   si duplica più: chi ha finito i ventiquattro segni de «Il tuo
   percorso» trova il bottone vero nella Costellazione. */

/* All'avvio la classe segue lo stato salvato: senza questo la Zen
   sparirebbe a ogni riapertura. Resta qui perché è l'unico posto che
   girava già a ogni avvio — lo stato che legge (`S.ui.zen`) è lo
   stesso, unico, che imposta `65_costellazione.js`. */
try{setTimeout(()=>{try{
  if(S.ui&&S.ui.zen)document.body.classList.add("zen");}catch(e){}},600);}catch(e){}
