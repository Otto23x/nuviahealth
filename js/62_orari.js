/* ═══════════════════════════════════════════════════════════════
   62. GLI ORARI VERI
   ═══════════════════════════════════════════════════════════════
   Sapere A CHE ORA una persona mangia davvero serve a due cose:
   capire se la fame che sente adesso è di stomaco o di testa, e
   accorgersi se il piano è tarato su orari che non vive.

   IL PROBLEMA, ed è quello vero: l'ora della SPUNTA non è l'ora
   del PASTO. Chi si ricorda a sera e spunta tutto insieme
   produrrebbe un profilo in cui pranza alle 22.

   ── LA SOLUZIONE, senza un solo tocco in più ──────────────────
   Si registra l'ora della spunta e si giudica quanto è
   attendibile, con tre regole:

   1. SPUNTA VICINA ALL'ORARIO DEL PIANO (±100 minuti) → l'ora è
      buona. È il caso normale: si mangia e si spunta.
   2. TRE O PIÙ SPUNTE IN POCHI MINUTI → è un recupero serale.
      Tutte incerte: si usa l'orario del piano e si dice che è
      una stima.
   3. SPUNTA MOLTO LONTANA dall'orario previsto → incerta anche
      se è sola.

   Gli orari INCERTI non entrano mai nel calcolo del ritmo. Meglio
   sapere poco e vero che molto e sbagliato: un profilo costruito
   su orari finti farebbe dire all'app cose che non stanno in
   piedi, e chi le legge se ne accorge.

   NON SI CHIEDE MAI CONFERMA. Un tocco in più a ogni pasto, per
   un dato che serve a noi e non a chi lo inserisce, è il modo più
   sicuro di far smettere di spuntare i pasti.                     */

const ORARI_VICINO=100;      /* minuti entro cui la spunta è credibile */
const ORARI_RAFFICA=3;       /* spunte ravvicinate = recupero serale   */
const ORARI_FINESTRA=4;      /* minuti entro cui si parla di raffica   */

function orariDi(di){
  const d=S.week.days[di!=null?di:viewIdx()]||{};
  if(!Array.isArray(d.orari))d.orari=[];
  return d.orari;}
window.orariDi=orariDi;

/* Minuti dalla mezzanotte, da un'ora scritta «13:30». */
function oraMin(t){
  const m=/^(\d{1,2})[:.](\d{2})/.exec(String(t||""));
  return m?(+m[1]*60+ +m[2]):null;}

/* ── la registrazione, al momento della spunta ────────────────── */
window.orarioSegna=(di,mi)=>{
  try{
    const g=S.week.days[di];
    if(!g||!g.meals||!g.meals[mi])return;
    const ora=new Date();
    const minuti=ora.getHours()*60+ora.getMinutes();
    const previsto=oraMin(g.meals[mi].t);
    const L=orariDi(di);

    /* raffica: quante spunte negli ultimi minuti? */
    const adesso=Date.now();
    const recenti=L.filter(x=>adesso-(x.ts||0)<ORARI_FINESTRA*60000).length;

    const lontano=(previsto!=null)&&Math.abs(minuti-previsto)>ORARI_VICINO;
    const raffica=recenti>=ORARI_RAFFICA-1;
    const certo=!lontano&&!raffica;

    L.push({mi,ts:adesso,
      /* se l'ora della spunta non è credibile si tiene quella del
         piano: è una stima dichiarata, non un numero inventato */
      min:certo?minuti:(previsto!=null?previsto:minuti),
      certo});

    /* se è una raffica, anche le spunte appena fatte diventano
       incerte: erano parte dello stesso recupero */
    if(raffica)L.forEach(x=>{if(adesso-(x.ts||0)<ORARI_FINESTRA*60000){
      x.certo=false;
      const p=oraMin((g.meals[x.mi]||{}).t);
      if(p!=null)x.min=p;}});

    if(L.length>12)g.orari=L.slice(-12);
    save();
  }catch(e){}};

/* ── il ritmo, solo dai dati buoni ────────────────────────────── */
/* Ritorna l'ora media a cui la persona fa ogni pasto, contando SOLO
   le spunte credibili. Sotto cinque osservazioni non dice niente:
   con tre punti si disegna qualunque curva. */
window.ritmoPasti=()=>{
  const per={};
  let G=[];
  try{G=(typeof fragGiorni==="function")?fragGiorni(45):[];}catch(e){}
  const giorni=(S.history||[]).concat([{days:S.week.days}]);
  (S.week.days||[]).forEach((d,di)=>{
    (d.orari||[]).forEach(o=>{
      if(!o.certo)return;
      (per[o.mi]=per[o.mi]||[]).push(o.min);});});
  const out={};
  Object.keys(per).forEach(mi=>{
    const l=per[mi];
    if(l.length<5)return;                 /* troppo pochi per dire qualcosa */
    l.sort((a,b)=>a-b);
    out[mi]={mediana:l[Math.floor(l.length/2)],quanti:l.length};});
  return out;};

/* ── quanto tempo è passato dall'ultimo pasto ─────────────────── */
/* È il numero che serve davvero: distingue la fame di stomaco da
   quella che arriva da altrove. */
window.daUltimoPasto=()=>{
  const di=viewIdx();
  const d=S.week.days[di]||{};
  const L=(d.orari||[]).slice().sort((a,b)=>(b.ts||0)-(a.ts||0));
  if(!L.length)return null;
  const ora=new Date();
  const minuti=ora.getHours()*60+ora.getMinutes();
  const ultimo=L[0];
  const passati=minuti-(ultimo.min||0);
  if(passati<0)return null;              /* pasto di ieri: non si conta */
  return {minuti:passati,certo:!!ultimo.certo};};

/* ── LA DOMANDA CHE CONTA: che fame è? ────────────────────────── */
/* Non lo diciamo mai alla persona come una diagnosi («questa è fame
   nervosa»): sarebbe presuntuoso e spesso sbagliato. Serve a NOI per
   scegliere quale gesto proporre — e la differenza è tutta lì. */
window.tipoFame=()=>{
  const u=daUltimoPasto();
  if(!u)return {tipo:"ignoto"};
  /* dopo quattro ore lo stomaco ha ragione: qualunque cosa dica la
     testa, la risposta giusta è mangiare qualcosa */
  if(u.minuti>=240)return {tipo:"stomaco",minuti:u.minuti,certo:u.certo};
  /* sotto i novanta minuti, il corpo non ha ancora fame di
     nutrimento: probabilmente è arrivata da altrove */
  if(u.minuti<=90)return {tipo:"testa",minuti:u.minuti,certo:u.certo};
  return {tipo:"mezzo",minuti:u.minuti,certo:u.certo};};

/* La riga da mostrare accanto ai gesti: descrive un FATTO («hai
   mangiato quaranta minuti fa»), non un giudizio sulla persona. */
window.fameRiga=()=>{
  const f=tipoFame();
  if(f.tipo==="ignoto"||!f.certo)return "";
  if(f.tipo==="stomaco")
    return tr("Sono passate più di quattro ore dall'ultimo pasto: questa è fame vera. Mangia qualcosa.");
  if(f.tipo==="testa")
    return tr("Hai mangiato da poco. Se la voglia è arrivata lo stesso, spesso passa da sola.");
  return "";};
