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

const BEVANDE=[
  {k:"acqua",   kcal:0,  idrata:true,  c:"#7FD4CC"},
  {k:"gassata", kcal:0,  idrata:true,  c:"#9FD8E8"},
  {k:"zero",    kcal:1,  idrata:true,  c:"#B0B7C3"},
  {k:"succo",   kcal:90, idrata:false, c:"#F0A85A"},
  {k:"bianco",  kcal:85, idrata:false, c:"#E8D98A"},
  {k:"rosso",   kcal:85, idrata:false, c:"#B0566A"},
  {k:"birra",   kcal:65, idrata:false, c:"#D9A441"}
];
window.BEVANDE=BEVANDE;

/* I nomi passano da tr() ESPLICITI: la regola imparata tre volte. */
function bevandaNome(k){
  return k==="gassata"?tr("Gassata")
       :k==="zero"    ?tr("Bibita zero")
       :k==="succo"   ?tr("Succo")
       :k==="bianco"  ?tr("Vino bianco")
       :k==="rosso"   ?tr("Vino rosso")
       :k==="birra"   ?tr("Birra")
       :tr("Acqua");}
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
  for(let i=0;i<n;i++)if(bevanda(L[i]||"acqua").idrata)v++;
  return v;};

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

function bevandaScegli(di,i){
  const ora=bicchiereTipo(di,i);
  sheetShow(tr("Cosa c'era nel bicchiere?"),
    `<div class="bevgrid">${BEVANDE.map(b=>
      `<button class="bevbtn${b.k===ora?" on":""}" onclick="bevandaSet(${di},${i},'${b.k}')">
         <span style="color:${b.c}">${bicchiereSVG(true,b.c)}</span>
         <b>${esc(bevandaNome(b.k))}</b>
         <small>${b.kcal?b.kcal+" kcal":tr("idrata")}</small>
       </button>`).join("")}</div>`);}

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
  const b=bevanda(k);
  /* LA NOTA UNA VOLTA SOLA: la prima volta si spiega, poi si tace.
     Ripetere una cosa vera ogni volta è il modo più veloce di
     trasformare un'informazione in una predica. */
  if(!b.idrata&&!(S.ui&&S.ui.dettoBevande)){
    S.ui=S.ui||{};S.ui.dettoBevande=true;
    toast(tr("Segnato. Le calorie entrano nella giornata; per l'acqua contano i bicchieri d'acqua."));
  }else{
    toast(tr("Segnato: {b}",{b:bevandaNome(k)}));}
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
    <div class="af">${esc(frase)} ${esc(tr("Un bicchiere è 200 ml."))}${
      kcal?" · "+esc(tr("{k} kcal dai bicchieri",{k:kcal})):""}</div>
  </div>`;};
