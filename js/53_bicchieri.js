/* ═══════════════════════════════════════════════════════════════
   53. I BICCHIERI — e quello che non è acqua
   ═══════════════════════════════════════════════════════════════
   Prima erano rettangolini che si coloravano. Un bicchiere ha una
   forma, e quando lo riempi l'acqua si ferma un dito sotto
   l'orlo — come nella vita, dove nessuno riempie fino al bordo.
   Sono dettagli che non si notano guardando, ma si notano se
   mancano: un'icona che assomiglia alla cosa vera si legge senza
   leggere, ed è esattamente il tipo di parola che possiamo
   togliere dall'app.

   ── QUELLO CHE NON È ACQUA ──────────────────────────────────
   Tenendo premuto un bicchiere si sceglie cosa c'era dentro:
   acqua, gassata, succo, vino bianco o rosso, birra, bibita
   zero. Perché tutti bevono anche altro, e un'app che finge di
   no costringe a mentirle.

   TRE REGOLE DI TONO, e sono la parte importante:
   1. LE CALORIE SI CONTANO, IL GIUDIZIO NO. Un bicchiere di
      vino porta 85 kcal nel bilancio della giornata; nessuna
      faccina triste, nessun «attenzione».
   2. L'IDRATAZIONE È UN'ALTRA COSA DALLE CALORIE. Alcolici e
      bibite zuccherate NON contano verso l'obiettivo d'acqua —
      non per punizione, ma perché è vero. La bibita zero e la
      gassata sì: idratano quanto l'acqua.
   3. LA NOTA SI DICE UNA VOLTA SOLA. La prima volta che segni
      un vino, l'app dice che l'alcol non idrata. La seconda
      volta tace: ripeterlo sarebbe fare la predica.           */

/* ── COSA C'ERA NEL BICCHIERE (rifatta il 28/08) ───────────────────
   Tre cose cambiano rispetto a prima, tutte su richiesta del founder.

   1. L'ACQUA FRIZZANTE NON È UNA BEVANDA A PARTE: è acqua. Toglierla
      dall'elenco non toglie niente a nessuno e leva un dubbio
      («conta?»). Chi la beve tocca «acqua», che è la verità.

   2. LE BIBITE IDRATANO. Prima succo e bibite erano marcati come «non
      idratanti»: falso. Portano acqua come l'acqua; quello che
      portano IN PIÙ sono zuccheri e calorie, e quelli si vedono già
      nel conto della giornata. Marcarli come non idratanti era una
      punizione travestita da fisiologia.

   3. GLI ALCOLICI CONTANO PER QUELLO CHE SONO, non zero e non uno.
      L'etanolo blocca l'ormone che trattiene i liquidi: ogni grammo
      costa circa 10 ml di urina in più. Da lì esce un numero onesto
      per ciascuno:
        birra 330 ml a 5°  → 13 g di alcol · 330 − 130 = ~200 ml netti
        vino  125 ml a 12° → 12 g          · 125 − 120 = ~0
        amaro  40 ml a 40° →  13 g         · sotto zero
      `idro` è quella quota, da 0 a 1, sul bicchiere d'acqua da 250 ml:
      la birra vale ~0,8, il vino 0, i superalcolici 0. È la ragione
      per cui «la birra un po' idrata» è vero e «il vino idrata» no,
      detta con un numero invece che con un'opinione.               */
const BEVANDE=[
  {k:"acqua",   kcal:0,   ml:250, gradi:0,  idro:1,   c:"#7FD4CC"},
  {k:"zero",    kcal:1,   ml:330, gradi:0,  idro:1,   c:"#B0B7C3"},
  {k:"bibita",  kcal:140, ml:330, gradi:0,  idro:1,   c:"#8B5A3C"},
  {k:"succo",   kcal:90,  ml:200, gradi:0,  idro:0.8, c:"#F0A85A"},
  {k:"birra",   kcal:130, ml:330, gradi:5,  idro:0.8, c:"#D9A441"},
  {k:"doppio",  kcal:210, ml:330, gradi:8,  idro:0.4, c:"#A9701F"},
  {k:"bianco",  kcal:90,  ml:125, gradi:12, idro:0,   c:"#E8D98A"},
  {k:"rosso",   kcal:90,  ml:125, gradi:12, idro:0,   c:"#B0566A"},
  {k:"cocktail",kcal:200, ml:200, gradi:15, idro:0,   c:"#8E6BB0"},
  {k:"amaro",   kcal:90,  ml:40,  gradi:40, idro:0,   c:"#6B4A2F"}
];
window.BEVANDE=BEVANDE;

/* I nomi passano da tr() ESPLICITI: la regola imparata tre volte. */
function bevandaNome(k){
  return k==="zero"    ?tr("Bibita zero")
       :k==="bibita"   ?tr("Bibita")
       :k==="succo"    ?tr("Succo")
       :k==="birra"    ?tr("Birra")
       :k==="doppio"   ?tr("Birra doppio malto")
       :k==="bianco"   ?tr("Vino bianco")
       :k==="rosso"    ?tr("Vino rosso")
       :k==="cocktail" ?tr("Cocktail")
       :k==="amaro"    ?tr("Superalcolico")
       :k==="gassata"  ?tr("Acqua")   /* voce vecchia: era acqua frizzante */
       :tr("Acqua");}
/* Quanto vale per l'acqua, detto in due parole invece che con un
   numero: «idrata», «idrata poco», «non idrata». */
function bevandaIdro(b){
  const q=(b.idro!=null)?b.idro:(b.idrata?1:0);
  return q>=0.9?tr("idrata"):q>0?tr("idrata poco"):tr("non idrata");}
window.bevandaIdro=bevandaIdro;
window.bevandaNome=bevandaNome;

function bevanda(k){return BEVANDE.find(b=>b.k===k)||BEVANDE[0];}

/* ── cosa c'era in ogni bicchiere di oggi ─────────────────────── */
/* Sta accanto al conteggio, non dentro: chi non tocca mai niente
   continua a bere acqua e non si accorge che esiste. */
function bicchieriDi(di){
  const d=S.week.days[di]||{};
  if(!Array.isArray(d.bevande))d.bevande=[];
  return d.bevande;}

window.bicchiereTipo=(di,i)=>{
  const L=bicchieriDi(di);
  return L[i]||"acqua";};

/* Quanti bicchieri contano DAVVERO verso l'obiettivo d'acqua. */
window.acquaVera=(di)=>{
  const d=S.week.days[di]||{};
  const n=+d.water||0;
  const L=bicchieriDi(di);
  let v=0;
  /* si sommano le QUOTE e si arrotonda: un bicchiere di birra vale
     0,8 — dire che vale 1 o 0 sarebbe comodo e falso */
  for(let i=0;i<n;i++){const b=bevanda(L[i]||"acqua");
    v+=(b.idro!=null)?b.idro:(b.idrata?1:0);}
  return Math.round(v);};

/* Le calorie che i bicchieri portano nella giornata. */
window.bevandeKcal=(di)=>{
  const d=S.week.days[di]||{};
  const n=+d.water||0;
  const L=bicchieriDi(di);
  let k=0;
  for(let i=0;i<n;i++)k+=bevanda(L[i]||"acqua").kcal;
  return k;};

/* ── il disegno del bicchiere ─────────────────────────────────── */
/* Il liquido si ferma al 78% dell'altezza: un bicchiere pieno fino
   all'orlo non esiste, e il vuoto sopra è quello che lo fa leggere
   come bicchiere invece che come barra. */
function bicchiereSVG(pieno,colore){
  const h=pieno?21:0;                 /* 78% di 27 */
  return `<svg viewBox="0 0 22 30" width="22" height="30" aria-hidden="true">
    <clipPath id="cb"><path d="M4 3h14l-1.6 22a2.5 2.5 0 0 1-2.5 2.2H8.1a2.5 2.5 0 0 1-2.5-2.2z"/></clipPath>
    ${pieno?`<g clip-path="url(#cb)"><rect x="2" y="${30-h}" width="18" height="${h}" fill="${colore}"/>
      <ellipse cx="11" cy="${30-h}" rx="9" ry="1.4" fill="${colore}" opacity=".55"/></g>`:""}
    <path d="M4 3h14l-1.6 22a2.5 2.5 0 0 1-2.5 2.2H8.1a2.5 2.5 0 0 1-2.5-2.2z"
      fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
  </svg>`;}
window.bicchiereSVG=bicchiereSVG;

/* ── la scelta, tenendo premuto ───────────────────────────────── */
let PREMUTO=null;
window.bicchierePremi=(di,i)=>{
  clearTimeout(PREMUTO);
  PREMUTO=setTimeout(()=>{PREMUTO="fatto";bevandaScegli(di,i);},520);};
window.bicchiereMolla=(di,i)=>{
  if(PREMUTO==="fatto"){PREMUTO=null;return;}   /* era una pressione lunga */
  clearTimeout(PREMUTO);PREMUTO=null;
  setWater(di,i);};

/* IL FOGLIO CHE IL FOUNDER HA CHIESTO CON MISURA STANDARD E KCAL
   (28/08, terza passata): mostrava sempre ml. Ogni altra riga dei
   bicchieri era stata vestita — questa, il foglio vero e proprio,
   no. (Prima versione di questa correzione metteva il commento
   DENTRO il template literal: finiva stampato nell'HTML davanti
   all'utente — trovato dalla controprova del collaudo, non a occhio.) */
function bevandaScegli(di,i){
  const ora=bicchiereTipo(di,i);
  sheetShow(tr("Cosa c'era nel bicchiere?"),
    `<div class="bevgrid">${BEVANDE.map(b=>
      `<button class="bevbtn${b.k===ora?" on":""}" onclick="bevandaSet(${di},${i},'${b.k}')">
         <span style="color:${b.c}">${bicchiereSVG(true,b.c)}</span>
         <b>${esc(bevandaNome(b.k))}</b>
         <small>${(typeof volumeTxt==="function")?volumeTxt(b.ml):b.ml+" ml"}${b.gradi?" · "+String(b.gradi).replace(".",",")+"°":""}</small>
         <small>${b.kcal?b.kcal+" kcal · ":""}${esc(bevandaIdro(b))}</small>
       </button>`).join("")}</div>
     <div class="hint">${tr("Le calorie entrano nella giornata. Per l'obiettivo d'acqua contano l'acqua e le bibite; la birra conta poco più di tre quarti, perché l'alcol fa perdere liquidi — vino, cocktail e superalcolici non contano.")}</div>`);}

window.bevandaSet=(di,i,k)=>{
  try{usoSegna("bevanda");}catch(e){}
  const L=bicchieriDi(di);
  while(L.length<=i)L.push("acqua");
  L[i]=k;
  /* se scegli una bevanda su un bicchiere non ancora toccato, lo si
     conta: hai bevuto qualcosa, è quello che stavi dicendo. */
  const d=S.week.days[di];
  if((+d.water||0)<=i)d.water=i+1;
  sheetClose();
  /* ── LA NOTA CHE NESSUNO VEDEVA (trovata il 28/08) ──────────────
     Qui c'era la spiegazione più utile del modulo — «le calorie
     entrano nella giornata, per l'acqua contano i bicchieri d'acqua» —
     mandata a `toast()`, che dal 25/08 non disegna più niente. Una
     frase scritta bene, spedita in un posto che non esiste più.
     Adesso vive sotto la riga dei bicchieri, dove si legge: è una
     RIGA, non un avviso, quindi non fa la predica anche restando. */
  save();render(cur);};

/* ── la riga, rifatta ─────────────────────────────────────────── */
window.acquaRiga2=(di,titolo)=>{
  const g=waterGoal(di);
  const d=S.week.days[di]||{};
  const tot=+d.water||0;
  const vera=acquaVera(di);
  const kcal=bevandeKcal(di);
  const frase=vera>=g?tr("Obiettivo raggiunto.")
    :(vera===0?tr("Non hai ancora bevuto nulla.")
    :tr("Ne mancano {n}.",{n:g-vera}));

  return `<div class="acqriga">
    <div class="ah"><span>${esc(titolo||tr("Stai bevendo abbastanza?"))}</span>
      <b>${vera} / ${g}</b></div>
    <div class="agl">${Array.from({length:Math.max(g,tot)},(_,i)=>{
      const k=bicchiereTipo(di,i), b=bevanda(k), pieno=i<tot;
      return `<button class="ag2${pieno?" on":""}" style="color:${pieno?b.c:"var(--linea)"}"
        onpointerdown="bicchierePremi(${di},${i})"
        onpointerup="bicchiereMolla(${di},${i})"
        onpointercancel="clearTimeout(PREMUTO)"
        aria-label="${esc(tr("Bicchiere {n}",{n:i+1}))}${pieno?" · "+esc(bevandaNome(k)):""}"
        title="${esc(tr("Tocca per segnare · tieni premuto per scegliere cosa"))}">${bicchiereSVG(pieno,b.c)}</button>`;
      }).join("")}</div>
    <div class="af">${esc(frase)} ${esc(trh("Un bicchiere è {v1}.",{v1:(typeof volumeTxt==="function")?volumeTxt(ML_BICCHIERE):"200 ml"}))}${
      kcal?" · "+esc(tr("{k} kcal dai bicchieri",{k:kcal})):""}</div>
    <!-- ── LA RIGA CHE DICE COME FUNZIONA (28/08) ─────────────────
         Due cose che prima nessuno leggeva: che tenendo premuto si
         sceglie cosa c'era nel bicchiere (un gesto invisibile è un
         gesto che non esiste), e che quello che si beve porta calorie
         ma non sempre acqua. Era in un cartellino spento dal 25/08.
         È una riga, non un avviso: resta lì e non fa la predica. -->
    <div class="af" style="opacity:.75">${
      tr("Tieni premuto un bicchiere per dire cosa c'era: vino, birra, bibita, cocktail. Le calorie entrano nella giornata; per l'acqua contano l'acqua e le bibite.")}</div>
  </div>`;};
