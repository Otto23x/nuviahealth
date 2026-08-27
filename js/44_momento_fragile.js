/* ═══════════════════════════════════════════════════════════════
   44. IL MOMENTO FRAGILE
   ═══════════════════════════════════════════════════════════════
   Le diete non si interrompono il giorno in cui si esagera. Si
   interrompono due giorni dopo, quando smetti di aprire l'app —
   non perché hai dimenticato, ma perché non vuoi guardare.

   Questo modulo cerca QUEL momento e arriva prima. Non dopo.

   COSA GUARDA (tutto già dentro il telefono, niente di nuovo):
     · il silenzio che segue un giorno pesante;
     · il giorno della settimana in cui, storicamente, molli;
     · la giornata cominciata e poi lasciata a metà.

   COSA NON FA MAI:
     · non nomina il silenzio. «Non registri da tre giorni» è la
       frase che fa disinstallare: chi è sparito lo sa già, e
       sentirselo dire trasforma il disagio in vergogna;
     · non nomina il cibo né il peso: quella riga compare sulla
       schermata di blocco e la leggono anche gli altri;
     · non chiede spiegazioni. Nessun «cos'è successo?».
   Apre una porta sul FUTURO — un piatto che arriva, una cosa
   piccola da fare — e poi si toglie di mezzo.

   I TETTI li mette P-3 (due a settimana, mai due giorni di fila,
   un solo richiamo). Qui si decide COSA dire e QUANDO: il permesso
   lo dà curaSiPuo(), sempre. Se un giorno qualcuno volesse
   aggirarlo, deve passare da qui e leggere questo commento.        */

/* ── i giorni, in ordine, come li vede il telefono ────────────── */
function fragGiorni(n){
  let out=[];
  try{out=(typeof flattenDiet==="function"?flattenDiet():[])||[];}catch(e){out=[];}
  /* la settimana in corso non è ancora nello storico: si aggiunge */
  try{
    const w=S.week||{};
    (w.days||[]).forEach((d,i)=>{
      const base=Date.parse((w.start||iso(new Date()))+"T12:00:00");
      const data=iso(new Date(base+i*86400000));
      if(data>iso(new Date()))return;            /* il futuro non conta */
      const meals=(d.meals||[]);
      out.push({date:data,
        mealsDone:meals.filter(m=>m.done).length,
        mealsTot:meals.length,
        sgarri:+d.sgarri||0});});
  }catch(e){}
  out.sort((a,b)=>a.date<b.date?-1:1);
  return n?out.slice(-n):out;}

/* Un giorno è «muto» quando il piano c'era e non è stato toccato. */
function fragMuto(g){return (g.mealsTot||0)>0&&(g.mealsDone||0)===0;}
/* Ed è «pesante» quando ci sono stati imprevisti veri. */
function fragPesante(g){
  return (+g.sgarri||0)>400||(typeof isHard==="function"&&isHard(g.date));}

/* ── i pattern, imparati sul telefono ─────────────────────────── */
/* Il giorno della settimana in cui storicamente si molla. Serve una
   ripetizione vera: due volte è coincidenza, tre è un'abitudine. */
function fragGiornoDebole(){
  const G=fragGiorni(56);
  if(G.length<21)return null;                    /* troppo poco per dire */
  const conta={},tot={};
  for(const g of G){
    const d=new Date(g.date+"T12:00:00").getDay();
    tot[d]=(tot[d]||0)+1;
    if(fragMuto(g))conta[d]=(conta[d]||0)+1;}
  let peggiore=null;
  for(const d in conta){
    if(conta[d]<3)continue;                      /* meno di tre: non è un pattern */
    const quota=conta[d]/tot[d];
    if(quota<0.5)continue;                       /* deve saltare più spesso che no */
    if(!peggiore||quota>peggiore.quota)peggiore={giorno:+d,quota,volte:conta[d]};}
  return peggiore;}
window.fragGiornoDebole=fragGiornoDebole;

/* Il silenzio che segue una giornata pesante: il pattern più
   prezioso e il più delicato. Chi sparisce dopo uno strappo non ha
   dimenticato l'app: si sta nascondendo da lei. */
function fragSilenzioDopoPeso(){
  const G=fragGiorni(14);
  if(G.length<3)return null;
  const oggi=iso(new Date());
  /* si guarda indietro: c'è stato un giorno pesante seguito da muti? */
  for(let i=G.length-2;i>=1;i--){
    if(!fragPesante(G[i-1]))continue;
    let muti=0;
    for(let j=i;j<G.length;j++){if(fragMuto(G[j]))muti++;else break;}
    /* Il tetto è sei giorni, non per capriccio: al settimo prende la
       parola curaRitorno() di P-3 («il piano si è tenuto in ordine da
       solo»), che è la frase giusta per un'assenza lunga. Qui si
       lavora nella finestra in cui una porta aperta serve ancora. */
    if(muti>=1&&muti<=6)return {muti,dopo:G[i-1].date};}
  return null;}
window.fragSilenzioDopoPeso=fragSilenzioDopoPeso;

/* La giornata iniziata e lasciata a metà: colazione spuntata,
   poi più niente, e il pomeriggio è già andato. */
function fragGiornataAMeta(){
  const G=fragGiorni(1);
  if(!G.length)return null;
  const g=G[0];
  if(g.date!==iso(new Date()))return null;
  const ora=new Date().getHours();
  if(ora<16||ora>20)return null;                 /* la finestra utile */
  if(!(g.mealsTot>2))return null;
  if(g.mealsDone===0)return null;                /* muta: è un altro caso */
  if(g.mealsDone>=Math.ceil(g.mealsTot/2))return null;
  return {fatti:g.mealsDone,totali:g.mealsTot};}
window.fragGiornataAMeta=fragGiornataAMeta;

/* ── cosa dire: porte sul futuro, mai finestre sul passato ────── */
/* Il piatto che arriva, per nome: è la cosa più concreta che
   abbiamo, e non nomina né cibo in generale né calorie. */
function fragProssimoPiatto(){
  try{
    const p=(typeof prossimoPasto==="function")?prossimoPasto():null;
    if(p&&p.d)return String(p.d).split(",")[0].split(" con ")[0].trim();
  }catch(e){}
  try{
    const d=(S.week&&S.week.days)||[];
    for(const g of d)for(const m of (g.meals||[]))
      if(!m.done&&!m.skip&&m.d)return String(m.d).split(",")[0].trim();
  }catch(e){}
  return null;}

const FRAG_NOMI=["domenica","lunedì","martedì","mercoledì","giovedì","venerdì","sabato"];

function fragMessaggio(){
  /* l'ordine è una scelta: il silenzio dopo un giorno pesante viene
     prima di tutto, perché è lì che si perde la gente. */
  const piatto=fragProssimoPiatto();

  const sil=fragSilenzioDopoPeso();
  if(sil)return curaComponi({
    messaggio:piatto?tr("C'è {p} nel piano, quando vuoi.",{p:piatto})
                    :tr("Il piano è pronto quando lo sei tu."),
    mossa:tr("Dai un'occhiata")});

  const meta=fragGiornataAMeta();
  if(meta)return curaComponi({
    messaggio:piatto?tr("Stasera c'è {p}.",{p:piatto}):tr("La serata è ancora tutta lì."),
    mossa:tr("Guarda cosa c'è")});

  const dg=fragGiornoDebole();
  if(dg){
    const oggi=new Date().getDay();
    const domani=(oggi+1)%7;
    if(dg.giorno===domani&&piatto)return curaComponi({
      messaggio:tr("Domani è {g}: c'è {p} in programma.",{g:FRAG_NOMI[domani],p:piatto}),
      mossa:tr("Dai un'occhiata")});}

  return null;}
window.fragMessaggio=fragMessaggio;

/* ── il cancello: si passa solo dalle regole di P-3 ───────────── */
window.fragileOra=(quando)=>{
  const msg=fragMessaggio();
  if(!msg)return null;
  /* il tono si controlla SEMPRE, anche sui testi nostri: una regola
     che vale solo per gli altri non è una regola. */
  const tono=curaTestoOk(msg.titolo+" "+msg.azione);
  if(!tono.ok)return null;
  const via=curaSiPuo("fragile",quando);
  if(!via.ok)return null;
  return msg;};

/* Quando la persona torna e tocca qualcosa, la sequenza si azzera:
   il richiamo ha funzionato, insistere sarebbe solo rumore. */
window.fragileRisposta=()=>{try{curaRisposta("fragile");}catch(e){}};
