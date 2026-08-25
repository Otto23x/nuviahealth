/* ═══════════════════════════════════════════════════════════════
   4. MOTORE CALORICO E BIOMETRICO
   ═══════════════════════════════════════════════════════════════ */
function age(){if(!S.profile.dob)return 0;const b=new Date(S.profile.dob),n=new Date();
  let a=n.getFullYear()-b.getFullYear();if(n<new Date(n.getFullYear(),b.getMonth(),b.getDate()))a--;return a;}
/* Metabolismo basale. Tre formule selezionabili nelle Regole:
   • auto      → Katch-McArdle se conosci la % di grasso, altrimenti Mifflin
   • mifflin   → sempre su peso/altezza/età (la più usata)
   • katch     → solo su massa magra (richiede la % di grasso)
   • harris    → Harris-Benedict rivista, tende a stimare un filo più alto */
function bmrFormula(){return S.profile.bmrF||"auto";}
function bmr(){const p=S.profile;
  if(!(+p.w>0)||!(+p.h>0))return 0; // profilo non ancora compilato
  const fat=parseFloat(p.fatp);
  const lbm=fat>0?p.w*(1-fat/100):parseFloat(p.lbm); // magra in kg dalla % di grasso
  const F=bmrFormula();
  const mifflin=()=>{const b=10*p.w+6.25*p.h-5*age();return Math.round(p.gender==="m"?b+5:b-161);};
  const katch=()=>lbm>0?Math.round(370+21.6*lbm):mifflin();
  const harris=()=>Math.round(p.gender==="m"      /* Harris-Benedict rivista (Roza 1984) */
    ?88.362+13.397*p.w+4.799*p.h-5.677*age()
    :447.593+9.247*p.w+3.098*p.h-4.330*age());
  if(F==="mifflin")return mifflin();
  if(F==="katch")return katch();
  if(F==="harris")return harris();
  return lbm>0?katch():mifflin();}
function tdee(){ // fabbisogno: BMR×attività + correzione sui PASSI BASE
  // Riferimento: 3000 passi base (quelli che fai comunque). Se in Io imposti
  // un valore diverso, il fabbisogno si aggiusta di conseguenza.
  const base=(+S.profile.baseSteps>0)?+S.profile.baseSteps:3000;
  /* Profilo non ancora compilato: bmr() vale 0 e peso/attività possono
     mancare. Senza questa rete usciva NaN, che finiva a schermo come
     «+NaN kcal di surplus» — un numero che non significa niente e
     spaventa chi ha appena installato l'app. */
  const b=bmr();
  if(!(b>0))return 0;
  const att=(+S.profile.act>0)?+S.profile.act:1.2;
  const peso=(+S.profile.w>0)?+S.profile.w:0;
  return Math.round(b*att+(base-3000)*peso*0.00045);}
function allSports(){
  const norm=x=>x.name.toLowerCase().trim();
  const cust={};S.customSports.forEach(c=>cust[norm(c)]=c);
  const out=SPORTS_DEFAULT.map(s=>cust[norm(s)]||s);   /* un custom omonimo vince sul default */
  S.customSports.forEach(c=>{if(!(SPORTS_DEFAULT.some(s=>norm(s)===norm(c))))out.push(c);});
  return out;
}
/* kcal di un allenamento = (MET netto) × peso corporeo × ore.
   MET netto = MET dell'attività, corretto per l'intensità, MENO 1: quel "1" è
   il metabolismo a riposo, che nel tuo fabbisogno è GIÀ contato. Senza questa
   sottrazione ogni allenamento risulta più generoso del reale (è l'errore
   classico dei calcolatori online). Il peso corporeo è il moltiplicatore
   principale: a parità di sport, più pesi più consumi. */
/* ── Dati storici congelati ────────────────────────────────────────
   Le calorie di un allenamento dipendono dal peso: se dimagrisci, i giorni
   già passati NON devono essere ricalcolati con il peso nuovo, altrimenti
   deficit e medie di ieri cambiano ogni volta che ti pesi.
   Perciò ogni allenamento salva il peso del momento (w.w) e ogni giornata
   tracciata salva il fabbisogno del momento (tdeeSnap). Da lì in poi quei
   numeri restano quelli, salvo ricalcolo esplicito. */
function weightOfWorkout(w){return (+w.w>0)?+w.w:S.profile.w;}
function tdeeOfDay(di){const d=S.week.days[di];return (+d.tdeeSnap>0)?+d.tdeeSnap:tdee();}
function freezeDay(di){const d=S.week.days[di];if(!(+d.tdeeSnap>0))d.tdeeSnap=tdee();}
function metMode(){return S.profile.metMode||"netto";}
function metUsed(sport,intensity){
  const sp=allSports().find(s=>s.name===sport)||{met:6};
  const m=sp.met*(INT[intensity]||1);
  return metMode()==="lordo"?m:Math.max(0.5,m-1);}
function workoutKcal(w){return Math.round(metUsed(w.sport,w.int)*weightOfWorkout(w)*((+w.min||0)/60));}
function mealOpt(pdi,mi){const st=S.week.days[pdi].meals[mi];
  /* Un valore misurato davvero (foto, barcode, ) è un dato reale:
     non va mai riscalato dalla fisiologia. */
  if(st.custom)return st.custom;
  return planOpt(pdi,mi);}
function assignedDay(pdi,mi){const st=S.week.days[pdi].meals[mi];return st.movedTo===-1?pdi:st.movedTo;}
function dayItems(di){const items=[];
  PLAN.forEach((pd,pdi)=>pd.meals.forEach((m,mi)=>{if(assignedDay(pdi,mi)===di){
    const st=S.week.days[pdi].meals[mi];const slot=st.movedAs||m.n;
    items.push({pdi,mi,slot,ord:SLOTS.indexOf(slot)<0?9:SLOTS.indexOf(slot)});}}));
  items.sort((a,b)=>a.ord-b.ord);return items;}
function eatenOfDay(di){let k=0,p=0,c=0,f=0,fib=0,z=0;
  dayItems(di).forEach(it=>{const st=S.week.days[it.pdi].meals[it.mi];
    if(st.done&&!st.skip){const o=mealOpt(it.pdi,it.mi);k+=o.k;p+=o.p;c+=o.c||0;f+=o.f||0;fib+=o.fib||0;z+=o.z||0;}});
  (S.week.days[di].extras||[]).forEach(e=>{if(e.st==="skip")return; // extra saltato: non conta
    k+=e.k;p+=e.p||0;c+=e.c||0;f+=e.f||0;fib+=e.fib||0;z+=e.z||0;});return{k,p,c,f,fib,z};}
/* I bicchieri che non sono acqua portano calorie: entrano negli
   extra come tutto il resto, senza una categoria a parte. */
function bevandeDelGiorno(di){
  try{return (typeof bevandeKcal==="function")?bevandeKcal(di):0;}catch(e){return 0;}}

function extrasKcal(di){return (S.week.days[di].extras||[]).reduce((a,e)=>a+(e.st==="skip"?0:e.k),0)+bevandeDelGiorno(di)}
function skippedOfDay(di){return dayItems(di).filter(it=>S.week.days[it.pdi].meals[it.mi].skip).length;}
/* Opzione di PIANO di un pasto: quella prevista dal piano (o l'override
   permanente), MAI la modifica temporanea della settimana (ribilancio, foto,
   barcode, matita). Serve a tenere il "pianificato" del giorno FISSO e a
   confrontarlo con quello realmente mangiato. */
/* Opzione GREZZA del piano: quella scritta dall'utente (o l'override
   permanente), senza alcuna correzione fisiologica. È la base neutra. */
function rawPlanOpt(pdi,mi){const st=S.week.days[pdi].meals[mi];
  const perm=S.permMeals[pdi+"_"+mi];
  if(perm&&st.opt===0)return perm;
  return PLAN[pdi].meals[mi].o[st.opt]||PLAN[pdi].meals[mi].o[0];}
/* ═══ RISCALATURA FISIOLOGICA DELLE PORZIONI ═══════════════════════
   Ciclo, allattamento, gravidanza (in più) e movimento ridotto (in meno)
   NON riscrivono il piano: agiscono come un MOLTIPLICATORE calcolato sulle
   kcal del piano DELL'UTENTE, non su quelle stimate dal sistema. Così una
   forzatura fatta a mano non viene persa, e quando lo stato si spegne le
   grammature tornano esattamente quelle di base (il fattore torna a 1).
   Presupposto: il piano di base deve essere in stato NEUTRO, cioè scritto
   senza avere già conteggiato ciclo/allattamento/gravidanza. */
function planBaseKOfDay(di){let k=0;
  if(!S||!S.week||!S.week.days||!S.week.days[di]||!PLAN||!PLAN.length)return 0;
  dayItems(di).forEach(it=>{const o=rawPlanOpt(it.pdi,it.mi);k+=(o&&+o.k)||0;});return k;}
function physFactor(di){
  const d=physDelta();if(!d)return 1;
  const base=planBaseKOfDay(di);
  if(!(base>0))return 1;
  /* limiti di sicurezza: mai meno del 70% né più del 160% del piano */
  return Math.max(0.7,Math.min(1.6,Math.round((1+d/base)*1000)/1000));}
function physPct(di){return Math.round((physFactor(di)-1)*100);}
function scaleOpt(o,fac){
  if(!o||fac===1)return o;
  const r=x=>(x==null?x:Math.round(x*fac));
  const pct=Math.round((fac-1)*100);
  return {d:String(o.d||"")+(pct?" · porzioni "+(pct>0?"+":"−")+Math.abs(pct)+"% ("+physTag()+")":""),
    k:Math.round((+o.k||0)*fac),p:r(o.p),c:r(o.c),f:r(o.f),fib:r(o.fib),z:r(o.z)};}
function planOpt(pdi,mi){return scaleOpt(rawPlanOpt(pdi,mi),physFactor(assignedDay(pdi,mi)));}
function plannedOfDay(di){let k=0,p=0,c=0,f=0,fib=0,z=0;
  dayItems(di).forEach(it=>{const o=planOpt(it.pdi,it.mi);
    k+=o.k;p+=o.p;c+=o.c||0;f+=o.f||0;fib+=o.fib||0;z+=o.z||0;});return{k,p,c,f,fib,z};}
/* v5: i passi quotidiani sono dentro al TDEE (passi base, vedi tdee()).
   Le camminate "vere" si registrano come sport. stepsKcal resta per
   compatibilità ma vale sempre 0. */
function burnedOfDay(di){return (S.week.days[di].workouts||[]).reduce((a,w)=>a+workoutKcal(w),0);}
function deficitOfDay(di){
  if(!(tdeeOfDay(di)>0))return 0;   /* senza fabbisogno non esiste un bilancio */return tdeeOfDay(di)+burnedOfDay(di)-eatenOfDay(di).k;}
/* ── Obiettivi passi/allenamenti e PROIEZIONE non lineare del peso ──────────
   Man mano che si dimagrisce il BMR cala (dipende dal peso), quindi il deficit
   si riduce e il calo rallenta: la discesa NON è lineare. Simuliamo giorno per
   giorno ricalcolando BMR sul peso corrente. Sport e passi vengono dagli
   OBIETTIVI (media giornaliera), non dal singolo dato. */
function bmrForWeight(w){const p=S.profile;const fat=parseFloat(p.fatp);
  const lbm=fat>0?w*(1-fat/100):parseFloat(p.lbm);
  if(lbm>0)return Math.round(370+21.6*lbm);
  const base=10*w+6.25*p.h-5*age();return Math.round(p.gender==="m"?base+5:base-161);}
function workoutBurnFor(sport,min,intensity,w){ // stessa formula usata ovunque
  return Math.round(metUsed(sport,intensity)*w*((+min||0)/60));}
/* Dispendio EXTRA medio giornaliero dagli obiettivi (passi/giorno + lista allenamenti/sett) */
function plannedActivityBurnFor(w){let b=0;const p=S.profile;
  (p.goalWorkoutList||[]).forEach(g=>{if(g.sport&&g.perWeek)b+=Math.round(workoutBurnFor(g.sport,g.min||30,"media",w)*g.perWeek/7);});
  return b;}
/* Simulazione della discesa del peso a partire da (startW,startDate) fino
   all'obiettivo, con deficit = TDEE(peso) + attività pianificata − intake dieta.
   Ritorna i punti (campionati ~settimanalmente), i giorni stimati e la data. */
function simulateWeightDescent(startW,startDate){
  const p=S.profile,goal=p.goalW;
  startW=startW||p.w;const start=startDate?new Date(startDate):new Date();start.setHours(12,0,0,0);
  if(!goal||!startW||startW<=goal)return null;
  /* Senza un piano, plannedDietSummary() vale 0 e il deficit diventerebbe
     il fabbisogno INTERO: la discesa risulterebbe due o tre volte più
     veloce del vero. In quel caso si usa il target calorico del giorno. */
  let intake=+plannedDietSummary().kcal_giorno||0;
  if(!(intake>0))intake=dayTargetK();
  intake=Math.max(kcalFloor(),intake);
  const dailyDeficitStart=Math.round(bmrForWeight(startW)*p.act)+plannedActivityBurnFor(startW)-intake;
  let w=startW;const pts=[{d:new Date(start),w:Math.round(w*10)/10}];
  let day=0;const MAX=3650;let stalled=false,pausa=0,_faseIn=false;
  while(w>goal&&day<MAX){day++;
    const dt=new Date(start);dt.setDate(dt.getDate()+day);
    /* Nelle settimane di mantenimento programmate si mangia a fabbisogno:
       il peso resta fermo e la curva si appiattisce. Non è uno stallo. */
    /* Un punto a ogni CAMBIO DI FASE, oltre a quelli settimanali: senza,
       una pausa di sette giorni poteva cadere fra due campionamenti e lo
       scalino spariva dal grafico. */
    const inPausa=cycMaintAtDate(dt);
    if(inPausa!==_faseIn){_faseIn=inPausa;pts.push({d:dt,w:Math.round(w*10)/10});}
    if(inPausa){pausa++;
      if(day%7===0)pts.push({d:dt,w:Math.round(w*10)/10});
      continue;}
    /* Il deficit resta quello di partenza perché il piano viene RITARATO
       man mano che dimagrisci (è ciò che fa «Ricalibra»). Tenendo invece
       le calorie fisse, il deficit si assottiglierebbe da solo col calo di
       peso e la stima diventerebbe molto più lunga del vero. */
    const tdeeW=Math.round(bmrForWeight(w)*p.act)+plannedActivityBurnFor(w);
    let def=dailyDeficitStart;
    if(tdeeW-def<kcalFloor())def=Math.max(0,tdeeW-kcalFloor());  /* mai sotto il minimo */
    if(def<=0){stalled=true;break;}
    w-=def/7700;if(w<goal)w=goal;
    if(day%7===0||w<=goal)pts.push({d:dt,w:Math.round(w*10)/10});}
  const reached=w<=goal+0.05&&!stalled;
  const etaDate=new Date(start);etaDate.setDate(etaDate.getDate()+day);
  return {points:pts,etaDays:day,etaDate,reached,stalled,dailyDeficitStart,intake,pausa};}
/* Peso "ideale" proiettato a una certa data, partendo dalla prima pesata reale */
function projectedWeightAt(dateISO){
  const W=(S.profile.weights||[]).filter(x=>x.w).slice().sort((a,b)=>giornoDa(a.d)-giornoDa(b.d));
  if(!W.length)return null;
  const sim=simulateWeightDescent(W[0].w,W[0].d);if(!sim)return null;
  const target=new Date(dateISO).getTime();let best=sim.points[0];
  sim.points.forEach(pt=>{if(pt.d.getTime()<=target)best=pt;});
  return best?best.w:null;}
/* ═══ ACQUA ═══════════════════════════════════════════════════════
   Il fabbisogno idrico TOTALE non coincide con l'acqua da bere: una
   quota arriva dagli alimenti (frutta, verdura, minestre, latte…) e,
   in misura minore, dal metabolismo. Le linee guida europee stimano
   che circa il 20-25% dell'acqua totale venga dal cibo.
   Inoltre i ml/kg non scalano in modo lineare: il tessuto adiposo
   contiene molta meno acqua del muscolo, quindi su BMI alti un
   coefficiente fisso di 35 ml/kg sovrastima il bisogno reale. */
const WATER_FOOD_SHARE=0.22;              /* quota che arriva dal cibo */
function waterMlPerKg(){
  const p=S.profile,b=(p.h>0&&p.w>0)?(p.w/Math.pow(p.h/100,2)):22;
  if(b>=30)return 28;                     /* molta massa grassa: meno acqua per kg */
  if(b>=25)return 32;
  return 35;}
/* Fabbisogno idrico totale in litri (cibo + bevande) */
function waterTotalL(){
  const w=+S.profile.w||70;
  return Math.min(6,Math.max(1.8,w*waterMlPerKg()/1000));}
/* Proposta di acqua DA BERE: totale meno la quota che arriva dal cibo,
   arrotondata a 0,25 L (= un bicchiere esatto) */
function waterSuggestL(){
  const drink=waterTotalL()*(1-WATER_FOOD_SHARE);
  return Math.min(4,Math.max(1.25,Math.round(drink*4)/4));}
/* Spiegazione del calcolo, mostrata sotto al campo */
function waterExplain(){
  const tot=waterTotalL(),food=tot*WATER_FOOD_SHARE,drink=waterSuggestL();
  const n=x=>String(Math.round(x*100)/100).replace(".",",");
  /* Frase intera con i numeri come segnaposto: in inglese l'ordine delle
     parti cambia («total need», «of which»), e con i pezzi concatenati
     la traduzione sarebbe impossibile. */
  return trh("Fabbisogno totale ~{v1} L ({v2} ml per kg), di cui ~{v3} L arriva già dal cibo → <b>~{v4} L da bere</b> ({v5} bicchieri)",
    {v1:n(tot),v2:waterMlPerKg(),v3:n(food),v4:n(drink),v5:Math.round(drink*4)});}
/* Obiettivo acqua: l'utente lo sceglie in IO (litri/giorno); se non impostato
   si usa la proposta in base al peso. +2 bicchieri se allenamento intenso o >45'.
   1 bicchiere = 200 ml. */
/* Bicchieri da 200 ml: quelli da 250 sono grandi e rari, e nessuno ha
   davvero in casa il bicchiere da un quarto di litro. Si arrotonda per
   ECCESSO — 2,5 L fanno 12,5 bicchieri, quindi 13: mezzo bicchiere in
   più di acqua non ha mai fatto male a nessuno. */
const ML_BICCHIERE=200;
function waterGoal(di){const hard=(S.week.days[di].workouts||[]).some(w=>w.int==="alta"||w.min>45);
  const litri=(+S.profile.waterGoalL>0)?+S.profile.waterGoalL:waterSuggestL();
  const base=Math.min(28,Math.max(5,Math.ceil(litri*1000/ML_BICCHIERE)));
  return base+(hard?2:0);}

