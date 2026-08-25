/* ═══════════════════════════════════════════════════════════════
   15. PAGINA IO: profilo, biometriche, AI key, vacanza, backup, Drive
   ═══════════════════════════════════════════════════════════════ */
function usageHtml(){const u=S.usage,t=iso(new Date());  /* giorno locale, in coppia con trackUsage */
  const calls=u.day===t?u.calls:0,tok=u.day===t?u.tokens:0,err=u.day===t?u.errors:0;
  return "Oggi: <b>"+calls+"</b> chiamate · <b>"+tok.toLocaleString(dataLoc())+"</b> token stimati"+(err?" · <span style='color:var(--rosso)'>"+err+" errori</span>":"");}
/* ═══════════════════════════════════════════════════════════════
   WIZARD "RI/COMINCIA DA ZERO" + EDITOR DEL PIANO
   Percorso: 1 dati personali → 2 gusti/vincoli → 3 obiettivi/target
   → generazione AI → editor modificabile → conferma (azzera settimana).
   ═══════════════════════════════════════════════════════════════ */
let WIZ={step:0,d:{},plan:null,editOnly:false};
window.wizStart=(full)=>{WIZ={step:1,d:{},plan:null,editOnly:false};show("setup");};
window.wizEditCurrent=()=>{WIZ={step:4,d:{},plan:JSON.parse(JSON.stringify(PLAN)),editOnly:true};show("setup");};
function wg(id){const e=document.getElementById(id);return e?e.value.trim():"";}
function wizNext(to){
  if(WIZ.step===1){
    WIZ.d.nome=wg("wzNome");WIZ.d.gen=wg("wzGen");WIZ.d.dob=wg("wzDob");
    WIZ.d.h=+wg("wzH")||0;WIZ.d.w=+wg("wzW")||0;WIZ.d.fat=parseFloat(wg("wzFat"))||null;WIZ.d.mus=parseFloat(wg("wzMus"))||null;
    WIZ.d.act=+wg("wzAct")||1.3;WIZ.d.vita=wg("wzVita");WIZ.d.sport=wg("wzSport");
    if(!WIZ.d.dob||!WIZ.d.h||!WIZ.d.w)return dlgAlert(tr("Servono almeno data di nascita, altezza e peso."));}
  if(WIZ.step===2){
    WIZ.d.intol=wg("wzIntol");WIZ.d.no=wg("wzNo");WIZ.d.si=wg("wzSi");WIZ.d.note=wg("wzNote");
    WIZ.d.liberi=wg("wzLiberi");WIZ.d.pronto=wg("wzPronto");WIZ.d.nPasti=+wg("wzNPasti")||5;WIZ.d.colaz=wg("wzColaz");
    if(WIZ.mode==="diet"){Object.assign(S.diet,{intol:WIZ.d.intol,no:WIZ.d.no,si:WIZ.d.si,note:WIZ.d.note,liberi:WIZ.d.liberi,pronto:WIZ.d.pronto,nPasti:WIZ.d.nPasti,colaz:WIZ.d.colaz});save();
      dlgAlert(tr("Caratteristiche aggiornate!"));show("io");return;}}
  if(WIZ.step===3){WIZ.d.goal=wg("wzGoal");}
  WIZ.step=to;renderSetup();}
function wizAge(){const b=new Date(WIZ.d.dob),n=new Date();let a=n.getFullYear()-b.getFullYear();
  if(n<new Date(n.getFullYear(),b.getMonth(),b.getDate()))a--;return a;}
/* ╔══════════════════════════════════════════════════════════════════╗
   ║  UNA FORMULA SOLA — le funzioni PURE che tutti chiamano          ║
   ╚══════════════════════════════════════════════════════════════════╝
   Il difetto (in coda dal 23/08, chiuso il 25/08): il wizard aveva
   formule SUE. La proiezione mostrata durante l'onboarding prometteva
   −500 kcal fisse mentre il motore ne toglieva il 20% del fabbisogno
   (~470); per la massa il wizard dava +200 fissi e il motore +12% con
   tetto 150–500; le proteine del wizard erano 2,0 g/kg di massa magra
   per tutti, il motore 1,2–1,8 sul peso di riferimento a seconda di
   obiettivo e attività. Due calcoli per la stessa cosa: quello che la
   persona vedeva promesso e quello che il piano faceva davvero.

   Adesso le formule sono QUESTE tre, pure — ricevono i numeri, non
   leggono lo stato — e le chiamano tutti: `deficitTarget()` e
   `protKgAuto()` del motore (che ci mettono attorno i casi speciali:
   malattia, gravidanza, ritmo scelto a mano), il wizard, e la
   proiezione dell'onboarding. Il collaudo t_regole_motore pretende
   che i due mondi diano lo stesso numero. */
function bilancioPer(goal,tdee,pct){
  const g=String(goal||"").toLowerCase();
  if(/manten/.test(g))return 0;
  /* massa: surplus del 12% del fabbisogno, mai sotto 150 né sopra 500 —
     negativo perché il motore ragiona a deficit */
  if(/massa|aument/.test(g))return -Math.min(500,Math.max(150,Math.round(tdee*0.12)));
  const p=Math.max(5,Math.min(30,+pct||20));
  return Math.min(Math.round(tdee*p/100),Math.round(tdee*0.30));}
window.bilancioPer=bilancioPer;
function protKgPer(goal,act){
  const g=String(goal||"").toLowerCase();
  if(/massa|aument/.test(g))return 1.8;
  if((+act||1.3)<=1.25)return 1.2;
  return 1.5;}
window.protKgPer=protKgPer;
/* Il peso di riferimento, puro: ideale + 25% dell'eccesso. È il perché
   le proteine non si calcolano sul peso pieno — il grasso corporeo non
   ne richiede. */
function refWeightPer(w,h,gender){
  if(h>0){const ideal=(gender==="f"?21.5:22.5)*Math.pow(h/100,2);
    if(w>ideal)return Math.round(ideal+(w-ideal)*0.25);}
  return Math.round(w);}
window.refWeightPer=refWeightPer;

function wizTargets(){
  const d=WIZ.d;
  const lbm=d.fat>0?d.w*(1-d.fat/100):null;
  const bmrV=lbm?Math.round(370+21.6*lbm):Math.round((10*d.w+6.25*d.h-5*wizAge())+(d.gen==="f"?-161:5));
  const tdeeV=Math.round(bmrV*d.act);
  /* ── LE FORMULE SONO QUELLE DEL MOTORE (25/08) ──────────────────
     Via la defMap {−300, −500, −750, +200}: erano numeri fissi che il
     motore non usava. «leggero» e «deciso» del wizard legacy diventano
     percentuali (12% e 27%) attorno al 20% standard: la STESSA
     famiglia di formule, non una tabella parallela. E via anche le
     proteine a 2,0 g/kg di massa magra: si usa protKgPer sul peso di
     riferimento, come fa il piano vero. */
  const goalMotore={leggero:"dimagrimento",moderato:"dimagrimento",deciso:"dimagrimento",
                    mantenimento:"mantenimento",massa:"aumento di massa"}[d.goal]||"dimagrimento";
  const pct={leggero:12,moderato:20,deciso:27}[d.goal]||20;
  const kcal=tdeeV-bilancioPer(goalMotore,tdeeV,pct);
  const prot=Math.round(refWeightPer(d.w,d.h,d.gen)*protKgPer(goalMotore,d.act));
  const bmi=Math.round(d.w/((d.h/100)**2)*10)/10;
  return {bmr:bmrV,tdee:tdeeV,kcal,prot,bmi,lbm:lbm?Math.round(lbm*10)/10:null};}
/* ── Il primo piano nasce da UNA chiamata sola ─────────────────────
   La storia di questa funzione, per non rifare due volte lo stesso
   giro: nasce come colpo unico, diventa una fila di sette chiamate per
   avere anti-ripetizione e riprova, e dalla v13.59 torna a essere una
   chiamata sola — ma non è un passo indietro, perché adesso sotto c'è
   quello che allora mancava: un contratto verificato in JavaScript
   (validaSettimana) e il rifacimento dei soli giorni che non passano.
   Quello che si guadagna non è solo l'attesa. Vedendo i sette giorni
   insieme il modello può distribuire le fonti proteiche e bilanciare
   la settimana; sette chiamate cieche non potevano farlo, perché la
   domenica non esisteva ancora quando si scriveva il lunedì.

   I dati restano quelli del wizard (WIZ.d): a questo punto del percorso
   S non è ancora completo, quindi il prompt si costruisce da qui.
   `onStep(i,nome)` resta per compatibilità con chi la chiamava; adesso
   riceve anche `onFase`, che è il racconto vero. */
async function wizGenDays(d,t,onStep,onFase){
  const DAYS=["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
  const persona=JSON.stringify({eta:wizAge(),genere:d.gen,altezza:d.h,peso:d.w,bmi:t.bmi,
    massa_grassa_pct:d.fat,stile_di_vita:d.vita,sport:d.sport,intolleranze:d.intol,
    cibi_vietati:d.no,cibi_amati:d.si,preferenza_semplice_pronto:d.pronto,
    pasti_al_giorno:d.nPasti,colazione:d.colaz,obiettivo:d.goal});
  const liberi=+d.liberi||0;
  /* ── I PASTI FUORI CASA, DETTI PER NOME (v13.65) ────────────────
     Prima c'era una riga che tirava a indovinare: «se lo stile di
     vita cita mensa o ufficio, il pranzo dei giorni feriali PUÒ
     essere type mensa». Cioè il modello deduceva da una parola in una
     frase se e quando una persona mangia fuori — e sbagliava sia per
     eccesso (l'ufficio non vuol dire mensa) sia per difetto (chi
     mangia fuori il sabato non lo dice mai in «stile di vita»).
     Adesso il percorso lo CHIEDE, e qui si dice quali giorni. */
  const fuoriRiga=(function(){
    const g=String(d.mensaGiorni||"").trim();
    if(!g)return ' Nessun pasto fuori casa: tutti i pasti si preparano a casa.';
    return (d.outType==="porto")
      ? ' Questi pasti la persona se li prepara e se li porta da casa ('+g+'): scrivili ESATTAMENTE come gli altri — stessa struttura, stesse grammature — con l\'unico vincolo che siano trasportabili e buoni anche freddi. Usa type "norm", perché gli ingredienti vanno comprati.'
      : ' Questi pasti sono FUORI CASA, mensa bar o ristorante ('+g+'): NON scegliere un piatto preciso e non dare grammature, perché non si sa cosa ci sarà. Scrivi UNA RIGA generica su come comporre il piatto. Per quei pasti usa type "mensa".';})();
  /* Gli integratori non sono decorazione: le proteine in polvere
     contano NEL target proteico invece di sommarsi sopra, il ferro non
     va col caffè, la vitamina D vuole grassi nello stesso pasto. Le
     regole esistevano già (INTEG_REGOLE) e giravano a vuoto perché
     nessuno chiedeva cosa prende. */
  const integRiga=(typeof integForAI==="function"&&d.integratori)?integForAI(d.integratori):"";
  const comune=' Persona: '+persona+
    '. Target di OGNI giorno: circa '+t.kcal+' kcal (tolleranza ±5%) e almeno '+t.prot+' g di proteine, distribuiti sui '+(+d.nPasti||5)+' pasti.'+
    ' Rispetta intolleranze e cibi vietati; usa i cibi amati; piatti '+(d.pronto==="pronto"?"semplicissimi e in gran parte pronti":"semplici")+
    ' con grammature sempre indicate e valori nutrizionali REALI; cucina italiana/mediterranea con componenti separate nel piatto;'+
    ' NON inserire integratori nel piano.'+fuoriRiga+integRiga+
    (d.note?' Note della persona, da rispettare: '+d.note+'.':'')+
    (liberi?' Nella settimana vanno collocati '+liberi+' pasti liberi in totale, nei giorni che si prestano (weekend, cena sociale): quei pasti hanno type "free".':' Nessun pasto libero.')+
    ' Nessun piatto si ripete nella settimana, nemmeno in variante simile.';
  const esito=await chiediSettimana({
    prompt:'Costruisci un piano alimentare italiano SETTIMANALE, sano ed equilibrato: SETTE GIORNI INTERI, da Lunedì a Domenica, più la lista della spesa che ne deriva.'+comune+
      ' Guarda la settimana come un insieme: distribuisci le fonti proteiche e non concentrare i piatti pesanti negli stessi giorni.',
    promptGiorni:(guasti,usati)=>'Stai correggendo un piano alimentare settimanale italiano già scritto. Rifai SOLO questi giorni, lasciando stare gli altri.'+comune+
      ' Ecco cosa NON andava, giorno per giorno — correggi esattamente questo: '+
      guasti.map(x=>x.giorno+" → "+x.motivi.join("; ")).join(" · ")+'.'+
      (usati.length?' Questi piatti sono già negli altri giorni della settimana e non vanno riproposti: '+usati.slice(-24).join("; ")+'.':''),
    regole:{giorni:DAYS,kcal:t.kcal,prot:t.prot,tollPct:5,nPasti:+d.nPasti||5,
      vietati:(d.vietatiLista&&d.vietatiLista.length)?d.vietatiLista:vietatiElenco(d.no,d.intol),
      ripetizioni:"nessuna"},
    spesa:true,
    onFase:(f,dati)=>{
      /* i sette giorni nascono insieme: il vecchio «i di 7» non
         descrive più niente, e chi chiama riceve la fase vera */
      if(onFase)onFase(f,dati);
      if(onStep&&f==="fatto")onStep(7,DAYS[6]);
      else if(onStep&&f==="settimana")onStep(0,DAYS[0]);}});
  if(!esito.plan){
    await dlgAlert(tr("Il piano non è arrivato{e}.",{e:(esito.err?" ("+aiReason(esito.err)+")":"")})+
      "\n\n"+tr("Le tue risposte sono al sicuro: si riprova dal Piano, quando vuoi."));
    return null;}
  /* La SICUREZZA non si consegna comunque: se dopo il rifacimento è
     rimasto un alimento escluso, chi ha chiamato deve poterlo sapere e
     non attivare niente. Kcal e ripetizioni invece si dichiarano. */
  const insicuri=(esito.problemi||[]).filter(x=>!x.sicuro);
  const plan=esito.plan;
  plan.spesa=esito.spesa||null;
  plan.problemi=esito.problemi||[];
  plan.insicuro=insicuri.length?insicuri:null;
  return plan;}
async function wizGenerate(){
  S.ui.pianoProprio=0;
  if(!document.getElementById("wzOk").checked)return dlgAlert(tr("Per procedere devi confermare di aver letto l'avvertenza sul nutrizionista."));
  if(!aiOn())return aiFail(new Error("nokey"));
  const t=wizTargets(),d=WIZ.d;
  const box=document.getElementById("wzOut");box.style.display="block";
  try{
    /* Il racconto segue le fasi vere: la settimana si scrive tutta
       insieme, poi la controllo io, poi — solo se serve — rifaccio i
       giorni che non passano. Il vecchio «3 di 7» descriveva sette
       chiamate che non ci sono più. */
    const plan=await wizGenDays(d,t,null,(f,dati)=>{
      box.textContent=
        f==="settimana"? tr("Scrivo la settimana intera…")
      : f==="controllo"? tr("Controllo i conti e quello che hai escluso…")
      : f==="ritocco"  ? trh("Rifaccio i giorni che non tornano: {v1}…",{v1:(dati||[]).join(", ")})
      :                  tr("Fatto.");});
    if(!plan){box.textContent="";return;}
    if(plan.insicuro){
      box.textContent="";
      return dlgAlert(tr("Il piano non è utilizzabile così: in alcuni giorni è rimasto un alimento che avevi escluso.")+"\n\n"+
        plan.insicuro.map(x=>x.giorno+": "+x.motivi.join("; ")).join("\n")+
        "\n\n"+tr("Non lo attivo: su intolleranze e cibi vietati non esiste un «va bene lo stesso». Riprova, oppure togli il vincolo se l'avevi scritto per sbaglio."));}
    box.textContent="";
    WIZ.plan=plan;WIZ.step=4;renderSetup();
  }catch(e){box.textContent="";aiFail(e);}}
/* Riga unica con TUTTI i macro stimati del piatto */
function macroLine(o){
  if(!o||!o.k)return "da stimare";
  const bits=["~"+o.k+" kcal",(o.p||0)+" g proteine"];
  if(o.c!=null)bits.push(o.c+" g C");
  if(o.f!=null)bits.push(o.f+" g G");
  if(o.fib!=null)bits.push(o.fib+" g F");
  if(o.z!=null)bits.push(o.z+" g Z");
  return bits.join(" · ");}
window.wizSet=(di,mi,f,v)=>{if(f==="d")v=cap(String(v||"").trim());
  const o=WIZ.plan[di].meals[mi].o[0];
  if(f==="d")o.d=v;else WIZ.plan[di].meals[mi][f]=v;
  const el=document.getElementById("wzTot"+di);if(el)el.textContent=wizDayTot(di);
  const tg=document.getElementById("wzTgt"+di);if(tg)tg.textContent=wizDayTarget(di);
  /* Cambi il piatto → kcal, macro e qualità si ricalcolano DA SOLI:
     niente pulsante Stima da ricordarsi, il totale del giorno e il
     raggiungimento del target restano sempre veri. */
  if(f==="d"&&aiOn())wizEstim(di,mi);};
/*  Stima: calorie e macro li calcola l'AI dal testo del piatto, così i numeri
   corrispondono sempre a quello che c'è scritto (niente valori inventati a mano). */
window.wizEstim=async(di,mi,oi)=>{
  if(!aiOn())return aiFail(new Error("nokey"));
  const o=WIZ.plan[di].meals[mi].o[oi||0];
  if(!o.d||!o.d.trim())return dlgAlert(tr("Scrivi prima cosa contiene il pasto."));
  const cell=document.getElementById("wzv"+di+"_"+mi+(oi?"_"+oi:""));
  if(cell)cell.textContent="stimo…";
  /* Un pasto che NON prepari tu (libero, mensa, ristorante) non può avere
     grammature precise: la descrizione resta INDICATIVA e corta, nello
     stesso stile sintetico del resto del piano. Prima queste modifiche
     producevano testi enormi che sfondavano la card. */
  const fuori=(WIZ.plan[di].meals[mi].type==="free"||WIZ.plan[di].meals[mi].type==="mensa");
  try{
    const t=await estimaCached(o.d,{fuori:fuori,riscrivi:true,campo:"desc"});
    const j=parseAIJSON(t);
    Object.assign(o,{d:j.desc||o.d,k:Math.round(j.kcal)||0,p:Math.round(j.prot)||0,
      c:Math.round(j.carb)||0,f:Math.round(j.gras)||0,
      fib:Math.round(j.fibre)||estFiberOf(o.d),z:Math.round(j.zuccheri)||estSugarOf(o.d)});
    renderSetup();
  }catch(e){if(cell)cell.textContent="errore";aiFail(e);}};
/*  Bilancia la giornata: l'AI aggiusta le GRAMMATURE dei piatti scritti da te
   per centrare il target calorico e proteico, mantenendo la giornata equilibrata. */
window.wizBalance=async(di)=>{
  if(!aiOn())return aiFail(new Error("nokey"));
  const day=WIZ.plan[di];
  const meals=day.meals.filter(m=>m.o[0].d&&m.o[0].d.trim());
  if(!meals.length)return dlgAlert(tr("Scrivi prima i pasti della giornata."));
  const tk=dayTargetK(),tp=dayTargetP();
  if(!await dlgConfirm(tr("Bilancio {g} sul tuo target: ~{k} kcal e ~{p} g di proteine.",{g:day.day,k:tk,p:tp})+"\n\nL'AI aggiusta le grammature dei piatti che hai scritto, senza cambiarne la natura."))return;
  try{
    const list=meals.map(m=>({slot:m.n,desc:m.o[0].d}));
    const t=await aiAsk('Aggiusta le GRAMMATURE di questi pasti di una giornata per arrivare a un totale di circa '+tk+' kcal e almeno '+tp+' g di proteine, mantenendo una giornata equilibrata e i piatti che ti do (puoi cambiare le quantità e aggiungere contorni di verdura, non stravolgere i piatti). '+rulesForAI()+' Distribuisci le calorie in modo sensato tra i pasti e non scendere sotto '+minMealKcal()+' kcal a pasto principale. Usa valori nutrizionali REALI per le quantità che scrivi. Pasti: '+JSON.stringify(list)+'. Rispondi SOLO JSON array: [{"slot":"...","desc":"descrizione con grammature","kcal":n,"prot":n,"carb":n,"gras":n,"fibre":n,"zuccheri":n}]');
    const arr=parseAIJSON(t);
    arr.forEach(a=>{const m=day.meals.find(x=>x.n===a.slot);if(!m)return;
      Object.assign(m.o[0],{d:a.desc,k:Math.round(a.kcal)||0,p:Math.round(a.prot)||0,
        c:Math.round(a.carb)||0,f:Math.round(a.gras)||0,
        fib:Math.round(a.fibre)||estFiberOf(a.desc),z:Math.round(a.zuccheri)||estSugarOf(a.desc)});});
    renderSetup();toast(tr("Giornata bilanciata ✓"));
  }catch(e){aiFail(e);}};
/* ── Target giornalieri ────────────────────────────────────────────
   Le calorie del piano NON sono il fabbisogno: sono il fabbisogno meno il
   deficit che serve davvero per il ritmo di dimagrimento scelto.
   1 kg di grasso ≈ 7.700 kcal, quindi 0,5 kg a settimana ≈ 550 kcal al
   giorno di deficit. Il deficit viene comunque limitato al 25% del
   fabbisogno e il target non scende mai sotto un pavimento di sicurezza. */
function ratePerWeek(){const r=parseFloat((S.diet||{}).ritmo);return r>0?r:0.5;}
/* Ritmo che il target produce DAVVERO: il deficit è limitato al 30% del
   fabbisogno per sicurezza, quindi un ritmo molto ambizioso viene ridotto.
   Prima la riduzione era silenziosa e l'app mostrava un ritmo che non era
   quello reale: ora viene dichiarata. */
function rateEffective(){return Math.round(Math.abs(deficitTarget())*7/7700*100)/100;}
function rateCapped(){return defMode()==="ritmo"&&Math.abs(rateEffective()-ratePerWeek())>0.03;}
function rateNote(){
  if(!rateCapped())return "";
  const n=x=>String(x).replace(".",",");
  const su=/massa|aument/i.test(S.profile.goal||"");
  return trh("il ritmo richiesto ({v1} kg a settimana) supera il tetto di sicurezza",{v1:n(ratePerWeek())})+
    (su?" del surplus":" del 30% del fabbisogno")+trh(": il piano lavora a ~{v1} kg a settimana",{v1:n(rateEffective())});}
/* Fabbisogno usato per i TARGET del piano. Il moltiplicatore di attività è
   una stima: se i tuoi giorni sono più fermi di quanto dichiarato, il
   fabbisogno risulta gonfiato e il target troppo alto. La "prudenza" lo
   abbassa di una percentuale scelta da te (0 = nessuna correzione). */
function prudence(){return Math.max(0,Math.min(20,+S.profile.prud||0));}
function tdeeTarget(){return Math.round(tdee()*(1-prudence()/100));}
/* Due modi di fissare il deficit:
   • "pct"   → una percentuale del fabbisogno (il più leggibile: 20% significa
               mangiare l'80% di quello che consumi)
   • "ritmo" → i chili a settimana desiderati (1 kg ≈ 7.700 kcal)
   Il tetto è al 30%: oltre si entra in territorio da seguire con un
   professionista, e l'app lo segnala. */
function defMode(){return S.profile.defMode||"pct";}
function defPct(){return Math.max(5,Math.min(30,+S.profile.defPct||20));}
function deficitTarget(){
  const t=tdeeTarget(),g=(S.profile.goal||"").toLowerCase();
  /* Malattia e gravidanza non sono momenti da deficit: si va a mantenimento */
  if(illOn()||pregOn()!=="no")return 0;
  /* Mese di mantenimento programmato dopo i 3 mesi di deficit */
  if(cycMaintOn())return 0;
  if(/mantenimento/.test(g))return 0;
  /* Il RITMO scelto a mano vince sulla percentuale: è una decisione
     esplicita della persona. Per tutto il resto la formula è quella
     condivisa (bilancioPer), la stessa che vedono il wizard e la
     proiezione dell'onboarding: un solo calcolo, non due promesse. */
  if(/massa|aument/.test(g)){
    if(defMode()==="ritmo"){
      const s=Math.round(ratePerWeek()*7700/7);
      return -Math.min(500,Math.max(150,s));}
    return bilancioPer(g,t,null);}
  if(defMode()!=="pct"){
    const d=Math.round(ratePerWeek()*7700/7);
    return Math.min(d,Math.round(t*0.30));}
  return bilancioPer(g,t,defPct());}
/* Pavimento del target. NON è il metabolismo basale: per dimagrire si deve
   per forza stare sotto il consumo totale, e con un peso elevato è normale
   (e sicuro) mangiare anche sotto il basale stimato, perché la differenza la
   copre il grasso corporeo. Il limite vero è un minimo assoluto sotto il
   quale diventa difficile coprire proteine e micronutrienti. */
/* ═══ FASE 1 · IL CONTRIBUTO FISIOLOGICO ═══════════════════════════
   physBonus() è un'AGGIUNTA al fabbisogno: base + questo, mai "compreso". */
function cycleDaysMax(){const n=+S.profile.cycleDays;return n>0?n:7;}
/* Ciclo, allattamento e gravidanza: solo profilo femminile */
function isFemale(){return S.profile.gender==="f";}
function physAllowed(){return isFemale()||PHYS_TEST_UNLOCK;}
/* Gravidanza: il fabbisogno cresce per trimestre (riferimenti LARN/EFSA:
   1° ~+70, 2° ~+260, 3° ~+450 kcal). Valori modificabili in Regole. */
const PREG_LBL={t1:"1° trimestre",t2:"2° trimestre",t3:"3° trimestre"};
/* Le calorie in più per trimestre, lette dal profilo con i valori di
   riferimento come ripiego: servono a scriverle accanto alla voce, così
   si sa cosa si sta accendendo. */
function pregKcalOf(k){
  const p=S.profile||{};
  return k==="t1"?(+p.pregT1||70):k==="t2"?(+p.pregT2||260):(+p.pregT3||450);};
function pregOn(){const p=(S.phys&&S.phys.preg)||"no";return (physAllowed()&&PREG_LBL[p])?p:"no";}
function pregKcal(){
  const p=pregOn();if(p==="no")return 0;
  const d={t1:70,t2:260,t3:450};
  const v=+S.profile["preg"+p.toUpperCase()];
  return v>0?v:d[p];}
/* Infortunio e malattia riducono il MOVIMENTO, non il metabolismo basale:
   il taglio si applica solo alla quota di fabbisogno che sta SOPRA il basale
   (quella dovuta all'attività), mai al basale stesso. */
function injOn(){return !!(S.phys&&S.phys.inj);}
function illOn(){return !!(S.phys&&S.phys.ill);}
/* ═══ DIGIUNI RELIGIOSI ═════════════════════════════════════════════
   Non sono affatto uguali fra loro, e trattarli come una casella sola
   era sbagliato: il Ramadan sposta TUTTI i pasti fra tramonto e alba,
   la Quaresima toglie certi alimenti in certi giorni, lo Yom Kippur è
   un digiuno totale di 25 ore. Cambia cosa deve fare l'AI, non solo il
   tono della frase. */
const DIGIUNI={
  ramadan:{l:"Ramadan",d:"Si mangia solo fra tramonto e alba",
    ai:"RAMADAN: tutti i pasti vanno concentrati fra il tramonto (iftar) e l'alba (suhoor). Nessun cibo né bevanda durante il giorno. Proponi due pasti principali — iftar e suhoor — più eventuali spuntini nella finestra notturna, con il TOTALE calorico e proteico invariato. Al suhoor privilegia alimenti a rilascio lento (cereali integrali, proteine, grassi buoni) e forte idratazione; all'iftar apri con qualcosa di leggero. Ricorda di bere molto nella finestra consentita."},
  quaresima:{l:"Quaresima o giorni di magro",d:"Niente carne in certi giorni",
    ai:"QUARESIMA: niente carne nei giorni di magro (venerdì e mercoledì delle Ceneri). Sostituisci con pesce, uova, legumi e latticini mantenendo le proteine invariate. Pasti più sobri, senza ridurre le calorie totali."},
  yomkippur:{l:"Yom Kippur o digiuno totale",d:"24-25 ore senza cibo né acqua",
    ai:"DIGIUNO TOTALE di 24-25 ore: nessun pasto nella giornata. Concentra tutto nel pasto che precede e in quello che segue: il precedente ricco di liquidi e carboidrati complessi, il successivo leggero e graduale per non appesantire. Non recuperare le calorie perse: il deficit di quel giorno è voluto e non va compensato."},
  altro:{l:"Altro digiuno",d:"Descrivilo tu nelle regole dell'AI",
    ai:"DIGIUNO RELIGIOSO in corso: rispetta gli orari e le restrizioni indicate dalla persona nelle sue regole, ridistribuendo i pasti senza ridurre il totale."}
};
function digiunoOn(){return !!(S.phys&&S.phys.digiuno);}
function digiunoTipo(){const t=S.phys&&S.phys.digTipo;return DIGIUNI[t]?t:"ramadan";}
window.digiunoSet=async(on)=>{
  if(on&&!digiunoOn()){
    const t=await dlgChoice("Che digiuno stai osservando?",
      Object.keys(DIGIUNI).map(k=>[k,DIGIUNI[k].l+" — "+DIGIUNI[k].d]));
    if(!t){render(cur);return;}
    S.phys.digTipo=t;
    await dlgAlert(" "+tr("<b>{d}</b> attivo.<br><br>Le calorie e le proteine del giorno <b>restano quelle</b>: cambia quando e come si mangia. Ricordati di spegnerlo quando il periodo finisce.<br><br>Se hai dubbi sul digiuno e sulla tua salute, parlane con un medico: in gravidanza, allattamento, diabete o terapie in corso non è una scelta neutra.",{d:esc(DIGIUNI[t].l)}));
  }
  S.phys.digiuno=!!on;save();render(cur);
  toast(on?tr("{d} attivo",{d:DIGIUNI[digiunoTipo()].l}):tr("Digiuno disattivato"));};
function injPct(){const n=+S.profile.injPct;return n>0?Math.min(90,n):50;}
function illPct(){const n=+S.profile.illPct;return n>0?Math.min(90,n):30;}
function movePct(){ /* se coesistono, comanda il taglio maggiore: non si sommano */
  return Math.max(injOn()?injPct():0, illOn()?illPct():0);}
function moveCut(){
  const p=movePct();if(!p)return 0;
  const sopra=Math.max(0,tdee()-bmr());
  return Math.round(sopra*p/100);}
function cyclePct(){const n=+S.profile.cyclePct;return n>0?n:5;}
function lactKcal(){
  const l=(S.phys&&S.phys.lact)||"no";
  if(l==="esclusivo")return +S.profile.lactFull>0?+S.profile.lactFull:500;
  if(l==="parziale")return +S.profile.lactPart>0?+S.profile.lactPart:250;
  return 0;}
/* Giorni trascorsi dall'inizio della fase luteale; scaduta, si spegne da sola */
function cycleDay(){
  if(!S.phys||!S.phys.cycleOn||!S.phys.cycleStart)return 0;
  const a=safeDate(S.phys.cycleStart+"T12:00:00");if(!a)return 0;
  /* si confrontano i GIORNI, non gli istanti: prima di mezzogiorno la
     differenza sarebbe negativa e il primo giorno risultava zero */
  const oggi=safeDate(iso(new Date())+"T12:00:00")||new Date();
  const n=Math.round((oggi-a)/864e5)+1;
  if(n>cycleDaysMax()){S.phys.cycleOn=false;S.phys.cycleStart=null;try{save();}catch(e){}return 0;}
  return n;}
function cycleKcal(){return cycleDay()?Math.round(bmr()*cyclePct()/100):0;}
/* Saldo fisiologico del giorno: quello che si SOMMA (ciclo, allattamento,
   gravidanza) meno quello che si TOGLIE (movimento ridotto). Può essere
   negativo: in quel caso il target scende e le porzioni si riducono. */
function physDelta(){return cycleKcal()+lactKcal()+pregKcal()-moveCut();}
function physBonus(){return physDelta();}
function physNote(){
  const p=[];
  if(cycleDay())p.push(trh("ciclo, fase luteale (giorno {v1} di {v2}): +{v3} kcal",{v1:cycleDay(),v2:cycleDaysMax(),v3:cycleKcal()}));
  if(lactKcal())p.push("allattamento "+S.phys.lact+": +"+lactKcal()+" kcal");
  if(pregKcal())p.push("gravidanza, "+PREG_LBL[pregOn()]+": +"+pregKcal()+" kcal");
  if(injOn())p.push(trh("infortunio, movimento ridotto del {v1}%: −{v2} kcal",{v1:injPct(),v2:(illOn()&&illPct()>injPct()?0:moveCut())}));
  if(illOn())p.push("malattia: deficit sospeso"+((!injOn()||illPct()>=injPct())?trh(", movimento ridotto del {v1}%: −{v2} kcal",{v1:illPct(),v2:moveCut()}):""));
  return p.filter(Boolean).join(" · ");}
/* Data in cui il ciclo si spegne da solo (null se non è attivo) */
function cycleEndDate(){
  if(!cycleDay()||!S.phys.cycleStart)return null;
  const a=safeDate(S.phys.cycleStart+"T12:00:00");if(!a)return null;
  const d=new Date(a);d.setDate(d.getDate()+cycleDaysMax());return d;}
/* ═══ AVVISO SULLE DURATE ══════════════════════════════════════════
   Questi stati cambiano le calorie del giorno e le grammature del piano.
   Alcuni scadono da soli, altri restano accesi finché non li togli: se
   uno resta acceso per sbaglio, il target continua a essere sbagliato
   senza che si veda. Qui si dice sempre chiaramente quale è quale. */
function physDurationNote(){
  const auto=[],manu=[];
  if(cycleDay()){
    const e=cycleEndDate();
    auto.push(trh(" <b>Ciclo</b> — giorno {v1} di {v2}",{v1:cycleDay(),v2:cycleDaysMax()})+
      (e?", si spegne da solo il <b>"+e.toLocaleDateString(dataLoc(),{day:"numeric",month:"long"})+"</b>":", si spegne da solo alla scadenza"));}
  if(lactKcal())manu.push("<b>Allattamento "+S.phys.lact+"</b> (+"+lactKcal()+" kcal)");
  if(pregKcal())manu.push("<b>Gravidanza, "+PREG_LBL[pregOn()]+"</b> (+"+pregKcal()+" kcal)");
  if(injOn())manu.push("<b>Infortunio</b> (−"+moveCut()+" kcal)");
  if(illOn())manu.push("<b>Malattia</b> (deficit sospeso)");
  if(!auto.length&&!manu.length)
    return `<div class="hint" style="background:var(--menta);padding:8px 12px;border-radius:12px;margin-top:8px">
${trh("      ⏳ {b1}: questi stati cambiano le calorie del giorno.",{b1:"<b>"+tr("Spunta solo ciò che è vero adesso")+"</b>"})}
      <details class="why"><summary>durate</summary><div>${trh("Il ciclo si spegne da solo dopo {v1} giorni; gli altri restano attivi {b1}. Togli la spunta quando la situazione cambia.",{b1:"<b>"+tr("finché non li togli tu")+"</b>",v1:cycleDaysMax()})}</div></details></div>`;
  return `<div class="hint" style="background:var(--zaffbg);padding:8px 12px;border-radius:12px;margin-top:8px">
    ⏳ <b>${tr("Stati attivi adesso")}</b> ${tr("— stanno cambiando le calorie di oggi e le porzioni del piano.")}
    ${auto.length?"<br><br><b>Scade da solo:</b><br>"+auto.join("<br>"):""}
    ${manu.length?"<br><br><b>Resta attivo finché non lo togli tu:</b><br>"+manu.join("<br>")+
      "<br><br> Togli la spunta quando la situazione cambia: accesa per sbaglio, sposta il target su una condizione che non c'è più.":""}</div>`;}
/* Etichetta breve per marcare le porzioni riscalate */
function physTag(){
  if(pregKcal())return "gravidanza";
  if(lactKcal())return "allattamento";
  if(cycleKcal())return "ciclo";
  if(illOn())return "malattia";
  if(injOn())return "infortunio";
  return "fisiologia";}
/* ═══ FASE 2 · fasce ottimizzate (allineamento LARN) ═════════════════
   L'unità di misura è la donna adulta: tutti gli altri sono un multiplo. */
const FAM_BANDS=[
  {k:"infante",  min:1,  max:3,  c:0.50, ico:"", l:"Infante (1-3 anni)",      rif:1000},
  {k:"bambino",  min:4,  max:9,  c:0.75, ico:"", l:"Bambino (4-9 anni)",      rif:1500},
  {k:"adolescente",min:10,max:14,c:1.10, ico:"", l:"Adolescente (10-14 anni)",rif:2200}
];
function famAge(dob){const d=safeDate(dob);if(!d)return null;
  const t=new Date();let a=t.getFullYear()-d.getFullYear();
  const m=t.getMonth()-d.getMonth();
  if(m<0||(m===0&&t.getDate()<d.getDate()))a--;
  return a;}
/* Categoria e coefficiente da sesso + età */
/* Età: si scrive in anni. La data di nascita resta accettata (vecchi dati
   e import), ma non si chiede più — su un telefono il calendario per la
   data di nascita di un figlio è la cosa più scomoda che ci sia. */
function famEta(m){
  if(!m)return null;
  const d=famAge(m.dob);
  if(d!==null)return d;
  const e=parseInt(m.eta,10);
  return (!isNaN(e)&&e>=0&&e<=110)?e:null;}
/* Scrivi 8 e l'app salva una data di nascita approssimata (oggi meno 8
   anni): da lì l'età si ricalcola da sola ogni anno. I figli crescono, il
   numero scritto no — per questo si conserva la data, non il numero. */
function etaToDob(eta){
  const e=parseInt(eta,10);
  if(isNaN(e)||e<0||e>110)return "";
  const d=new Date();d.setFullYear(d.getFullYear()-e);
  return iso(d);}
function famBand(m){
  if(!m)return {k:"?",c:1,ico:"",l:"data mancante",rif:2000,age:null};
  const a=famEta(m);
  if(a===null)return {k:"?",c:1,ico:"",l:"data mancante",rif:2000,age:null};
  const b=FAM_BANDS.find(x=>a>=x.min&&a<=x.max);
  if(b)return Object.assign({},b,{age:a});
  if(a<1)return {k:"infante",c:0.50,ico:"",l:"Infante (sotto 1 anno)",rif:1000,age:a};
  return (m.gender==="m")
    ? {k:"uomo", c:1.25,ico:"",l:"Uomo (15+ anni)",  rif:2500,age:a}
    : {k:"donna",c:1.00,ico:"",l:"Donna (15+ anni)", rif:2000,age:a};}
function famCoef(m){return famBand(m).c;}
/* Nome da mostrare: "Io" per l'utente, il nome scelto per gli altri
   (con la categoria come riserva se il nome non è stato scritto). */
function famName(m){return (m&&m.me)?"Io":(((m&&m.nome)||"").trim()||famBand(m).l.split(" (")[0]);}
/* L'utente stesso, come membro della tavola */
function meAsMember(){return {gender:S.profile.gender||"f",dob:S.profile.dob,me:true};}
function famAll(){return [meAsMember()].concat(S.family||[]);}
/* Somma dei coefficienti: quante "porzioni base" servono in pentola */
/* La MIA porzione vale sempre 1 — sono a dieta e il target è il mio.
   Gli altri valgono in proporzione al loro fabbisogno rispetto al mio. */
function famUnits(list){const all=list||famAll();
  const meC=famCoef(meAsMember())||1;
  return Math.round(all.reduce((a,m)=>a+(m&&m.me?1:famCoef(m)/meC),0)*100)/100;}
function famForAI(){
  if(!(S.family||[]).length)return "";
  return trh(" IN CASA: oltre alla persona ci sono {v1} familiari — ",{v1:S.family.length})+
    S.family.map(m=>{const b=famBand(m);const base=b.l.split(" (")[0].toLowerCase()+trh(" di {v1} anni",{v1:b.age});return (m.nome||"").trim()?m.nome.trim()+" ("+base+")":base;}).join(", ")+
    ". Quando serve, ragiona sulle quantità per tutti: in totale valgono "+
    (Math.round(famUnits()*100)/100)+" porzioni di riferimento (donna adulta = 1).";}
window.famAdd=()=>{S.family.push({nome:"",gender:"f",dob:""});save();render(cur);};
window.famDel=(i)=>{S.family.splice(i,1);save();render(cur);};
window.famSet=(i,k,v)=>{if(!S.family[i])return;
  if(k==="eta"){                       /* l'età si salva come data, non come numero */
    const dob=etaToDob(v);
    if(dob){S.family[i].dob=dob;delete S.family[i].eta;}
    else{delete S.family[i].dob;delete S.family[i].eta;}
  }else S.family[i][k]=v;
  if(k==="dob"&&v)delete FAMEDIT[i];   /* data messa: si torna alla vista compatta */
  save();
  const el=document.getElementById("famBox");if(el)el.innerHTML=famRowsHTML();};
/* Quali righe stanno mostrando il calendario. La data si chiede una volta
   sola, precisa; dopo resta solo l'età, che occupa un quarto dello spazio
   e si aggiorna da sola. Toccandola si riapre il calendario. */
let FAMEDIT={};
window.famEdit=(i)=>{FAMEDIT[i]=1;famBoxesRefreshAll();};
function famBoxesRefreshAll(){
  ["famBox","famBoxob","famBoxd"].forEach(id=>{const e=document.getElementById(id);if(e)e.innerHTML=famRowsHTML();});
  try{famBoxesRefresh();}catch(_){}}
function famRowsHTML(){
  let h="";
  (S.family||[]).forEach((m,i)=>{const b=famBand(m);
    h+=`<div class="famrow">
      <input type="text" class="fnome" placeholder="Nome" value="${esc(m.nome||"")}" onchange="famSet(${i},'nome',this.value)">
      <select class="fsex" onchange="famSet(${i},'gender',this.value)" aria-label="Sesso">
        <option value="f" ${m.gender!=="m"?"selected":""}>F</option>
        <option value="m" ${m.gender==="m"?"selected":""}>M</option></select>
      ${(!m.dob||FAMEDIT[i])
        ? `<input type="date" class="fdob" value="${esc(m.dob||"")}" onchange="famSet(${i},'dob',this.value)" aria-label="${tr("Data di nascita")}">`
        : `<button class="feta" onclick="famEdit(${i})" title="${tr("Tocca per correggere la data")}">${b.age!==null?b.age+" a":"—"}</button>`}
      <span class="fbadge" title="${esc(b.l)}${m.dob?" · nato nel "+String(m.dob).slice(0,4):""}">${b.ico}${b.age!==null?" ×"+b.c:""}</span>
      <button class="ibtn" title="${tr("Togli")}" onclick="famDel(${i})">✕</button></div>`;});
  if((S.family||[]).length){
    const me=famBand(meAsMember());
    h+=`<div class="hint">${tr("A tavola siete in")} ${(S.family||[]).length+1}: Io (${me.ico} ×${me.c}${tr(") più")} ${(S.family||[]).map(m=>famName(m)).join(", ")} ${tr("— in tutto")} <b>${Math.round(famUnits()*100)/100} porzioni</b> ${tr("di riferimento.")}</div>`;}
  return h;}
/* Pasti fuori casa della SETTIMANA in corso: per chi fa turni */
function weekOutKey(){return (S.week&&S.week.started)||iso(new Date());}
function weekOutGet(){const k=weekOutKey();return (S.weekOut&&S.weekOut[k]!==undefined)?S.weekOut[k]:null;}
function outThisWeek(){const w=weekOutGet();return w!==null?w:(S.diet.mensaGiorni||"");}
window.weekOutSet=async()=>{
  S.weekOut=S.weekOut||{};S.weekOut[weekOutKey()]=readMensaChecks("wk");
  save();render(cur);
  toast(tr("Pasti fuori casa aggiornati ✓"));
  if(planIsEmpty())return;
  if(!aiOn())return dlgAlert(tr("Selezioni salvate.\n\nSenza chiave AI il piano non può essere riadattato da solo: rigenera la spesa a mano dalla pagina Spesa."));
  /* Salvando le selezioni della settimana il piano viene SEMPRE riadattato:
     cambiano i giorni fuori casa, quindi cambiano i pasti da cucinare, le
     grammature e di conseguenza la spesa. */
  outRetagMeals();
  await outMealsRewrite(outTypeIsPorto()?"porto":"fuori");
  if(await retunePlan()){await genShop(true);return planForecast(true,true);}};
window.weekOutReset=()=>{if(S.weekOut)delete S.weekOut[weekOutKey()];save();render(cur);toast(tr("Regola fissa ripristinata"));};
function outTypeGet(){const k=weekOutKey();
  return (S.weekOutTipo&&S.weekOutTipo[k])||S.diet.fuoriTipo||"fuori";}
function outTypeIsPorto(){return outTypeGet()==="porto";}
/* Pasti fuori casa del piano secondo le spunte della settimana (di,mi) */
function outMealsOfPlan(){
  const fm=parseMensa(outThisWeek()),out=[];
  PLAN.forEach((d,di)=>{const dk=MENSA_DAYS.find(x=>x[1]===d.day);const v=dk?fm[dk[0]]:null;if(!v)return;
    (d.meals||[]).forEach((m,mi)=>{const sl=String(m.n||"").toLowerCase();
      if((v==="entrambi"&&/pranzo|cena/.test(sl))||(v==="pranzo"&&/pranzo/.test(sl))||(v==="cena"&&/cena/.test(sl)))out.push({di:di,mi:mi});});});
  return out;}
/* Allinea il TIPO dei pasti fuori casa alla scelta porto/fuori:
   "li preparo io" → type norm (entrano nella spesa),
   "li mangio fuori" → type mensa (esclusi dalla spesa). */
function outRetagMeals(){
  if(planIsEmpty())return false;
  if(!S.customPlan){S.customPlan=JSON.parse(JSON.stringify(PLAN));PLAN=S.customPlan;}
  const want=outTypeIsPorto()?"norm":"mensa";let ch=false;
  outMealsOfPlan().forEach(x=>{const m=PLAN[x.di].meals[x.mi];if(m&&m.type!==want){m.type=want;ch=true;}});
  if(ch){S.customShop=null;S.shop={};save();}
  return ch;}
/* Riscrive con l'AI i pasti fuori casa: trasportabili se li prepari tu,
   composizione generica se li mangi fuori. */
async function outMealsRewrite(v){
  const list=outMealsOfPlan().map(x=>{const m=PLAN[x.di].meals[x.mi];const o=(m.o&&m.o[0])||{};
    return {di:x.di,mi:x.mi,giorno:PLAN[x.di].day,slot:m.n,d:o.d,k:o.k,p:o.p};});
  if(!list.length)return false;
  snapSave("prima di: adattamento pasti fuori casa");
  const box=genBox();
  if(box){box.style.display="block";genBoxMostra(box);box.textContent="Adatto i pasti fuori casa…";}
  try{
    const t=await aiAsk((v==="porto"
      ?'Questi pasti li prepara la persona e se li porta da casa. Riscrivili ESATTAMENTE come un normale pasto del piano — stessa struttura, stesse grammature, stesso livello di dettaglio degli altri pasti — con l\'unico vincolo che siano trasportabili in un contenitore e buoni anche freddi o riscaldati. Niente ricette elaborate. Mantieni per ogni pasto circa le stesse kcal e proteine indicate. '
      :'Questi pasti si consumano FUORI CASA (mensa, bar o ristorante): NON scegliere piatti precisi e non dare grammature precise. Per ciascuno scrivi UNA RIGA generica su come comporre il piatto (es. "una fonte proteica + verdura abbondante + una porzione di pane o pasta"), mantenendo circa le stesse kcal e proteine indicate. ')+rulesForAI()+
      ' Pasti: '+JSON.stringify(list)+'. Rispondi SOLO JSON array nello stesso ordine: [{"di":n,"mi":n,"d":"...","k":n,"p":n,"c":n,"f":n}]');
    const arr=parseAIJSON(t);
    if(Array.isArray(arr))arr.forEach(x=>{const m=PLAN[+x.di]&&PLAN[+x.di].meals[+x.mi];if(!m||!x.d)return;
      m.o=[{d:String(x.d),k:Math.round(x.k)||((m.o[0]||{}).k||0),p:Math.round(x.p)||((m.o[0]||{}).p||0),
        c:Math.round(x.c)||0,f:Math.round(x.f)||0,fib:estFiberOf(x.d),z:estSugarOf(x.d)}];});
    save();render(cur);if(box)box.textContent="";genBoxVia();toast(tr("Pasti fuori casa adattati ✓"));return true;
  }catch(e){if(box)box.textContent="";genBoxVia();aiFail(e);return false;}}
window.outTypeSet=async(v,perSettimana)=>{
  if(perSettimana){S.weekOutTipo=S.weekOutTipo||{};S.weekOutTipo[weekOutKey()]=v;}
  else S.diet.fuoriTipo=v;
  save();
  const changed=outRetagMeals();
  render(cur);
  if(!changed)return;
  if(aiOn()){
    if(await dlgConfirm(v==="porto"
      ?tr("Adesso i pasti fuori casa li prepari tu.\n\nTrasformo quei pasti in piatti trasportabili con le grammature e rigenero la lista della spesa includendo i loro ingredienti?")
      :tr("Adesso i pasti fuori casa li mangi fuori.\n\nTrasformo quei pasti in una composizione generica del piatto e rigenero la lista della spesa senza i loro ingredienti?"),
      {ok:tr("Adatta piano e spesa"),ko:tr("Solo il tipo")}))
      {if(await outMealsRewrite(v))await genShop(true);}
    else toast(tr("Tipo aggiornato: la spesa va rigenerata dalla pagina Spesa"));
  }else toast(tr("Tipo aggiornato: rigenera la spesa per allinearla"));};
function outTypeHTML(pre,perSettimana){
  const c2=perSettimana?outTypeGet():(S.diet.fuoriTipo||"fuori");
  return `<label>${tr("Come mangi fuori")}</label>
  <div class="ckgrid">
    <label class="ck"><input type="radio" name="${pre}ot" ${c2==="porto"?"checked":""} onchange="outTypeSet('porto',${!!perSettimana})"> Li preparo io</label>
    <label class="ck"><input type="radio" name="${pre}ot" ${c2!=="porto"?"checked":""} onchange="outTypeSet('fuori',${!!perSettimana})">  ${tr("Li mangio fuori")}</label>
  </div>
  <div class="hint">${c2==="porto"
    ?tr("<b>Piatti da portare</b>: buoni anche freddi, contenitore unico, ingredienti <b>in lista della spesa</b>.")
    :tr("Mensa o ristorante: il piano dice <b>come comporre il piatto</b>, e quegli ingredienti <b>non vanno in spesa</b>.")}</div>`;}
function weekOutCardHTML(){
  return `<div class="card"><h2>${tr("Pasti fuori casa di questa settimana")}</h2>
  <div class="hint">${trh("Se fai {b}, i giorni in cui mangi fuori cambiano ogni settimana. Qui li imposti {b2}, senza toccare la regola fissa in Regole.",{b:"<b>turni</b>",b2:"<b>"+tr("solo per la settimana in corso")+"</b>"})}${weekOutGet()!==null?" <b>Questa settimana ha impostazioni sue.</b>":""}</div>
  ${mensaChecksHTML("wk",outThisWeek())}
  ${outTypeHTML("wk",true)}
  <div class="mtools"><button class="btn ghost small" onclick="weekOutSet()">${tr("Salva per questa settimana")}</button>${weekOutGet()!==null?`<button class="btn ghost small" onclick="weekOutReset()">${tr("Torna alla regola fissa")}</button>`:""}</div></div>`;}
function famCardHTML(pre){
  return `<label>${tr("Chi altro mangia a casa")}</label>
  <div id="famBox">${famRowsHTML()}</div>
  <button class="btn ghost small" onclick="famAdd()">${tr("+ Aggiungi una persona")}</button>
  ${hint2(tr("Dai un <b>nome</b> a ciascuno e scrivi <b>sesso ed età</b>: al resto pensa l'app. L'età si aggiorna da sola con gli anni."),tr("Servono per cucinare in una pentola sola e per fare la spesa giusta. Le porzioni si calcolano così: donna adulta = 1, uomo = 1,25, adolescente = 1,10, bambino = 0,75, infante = 0,50."))}`;}
/* ═══ MINIMO CALORICO ═══════════════════════════════════════════════
   Il pavimento segue il CORPO, non il sesso: 1200 per una donna e 1500 per
   un uomo sono medie di popolazione che non dicono nulla su chi le usa —
   una donna alta e muscolosa consuma più di un uomo minuto. Qui il minimo è
   l'85% del metabolismo basale, con una soglia di sicurezza assoluta a
   1200 kcal sotto la quale non si scende comunque. */
/* ═══ SENZA I NUMERI NON C'È UN OBIETTIVO ══════════════════════════
   DIFETTO TROVATO IL 19/08/2026 simulando un percorso saltato: a chi
   non aveva dato peso, altezza ed età l'app mostrava lo stesso
   «1200 kcal · Obiettivo di oggi».
   1200 non è un numero neutro: è la soglia sotto cui si parla di
   dieta molto ipocalorica, e a un uomo di 113 kg sarebbe un consiglio
   sbagliato e pericoloso. Ma soprattutto è INVENTATO: non sappiamo
   niente di quella persona.
   Ora `profiloUtile()` dice se abbiamo abbastanza per calcolare, e
   chi disegna un obiettivo chiede prima i numeri invece di riempire
   il vuoto con una cifra. Un numero sbagliato con l'aria di essere
   giusto è peggio di nessun numero: nessuno lo mette in dubbio. */
function profiloUtile(){
  const p=S.profile||{};
  return +p.w>0&&+p.h>0&&(typeof age==="function"?age()>0:!!p.dob);}
window.profiloUtile=profiloUtile;

function kcalFloorMin(){
  if(+S.profile.kcalMin>0)return +S.profile.kcalMin;   /* valore scritto a mano */
  const b=bmr();
  if(!(b>0))return 1200;                                /* profilo non ancora compilato */
  return Math.max(1200,Math.round(b*0.85/10)*10);}
function kcalFloorWhy(){
  if(+S.profile.kcalMin>0)return "valore impostato da te";
  const b=bmr();if(!(b>0))return "soglia di sicurezza, profilo da completare";
  return Math.round(b*0.85)<=1200?"soglia di sicurezza assoluta":trh("85% del tuo basale ({v1} kcal)",{v1:b});}
function kcalFloor(){
  /* in allattamento e in gravidanza il pavimento di sicurezza si alza
     insieme al fabbisogno: sotto quella soglia non si scende mai */
  return kcalFloorMin()+lactKcal()+pregKcal();}
/* Gli allenamenti NON alzano le calorie da mangiare: il target dei pasti nasce
   solo dal fabbisogno di base meno il deficit scelto. Le calorie bruciate con lo
   sport servono a un'altra cosa — a stimare in quanto tempo si arriva
   all'obiettivo — e le usa soltanto la proiezione (vedi wkForecastBurn). */
function wkForecastBurn(){
  try{return plannedActivityBurnFor(+S.profile.w||70)||0;}catch(e){return 0;}}
function dayTargetKBase(){return Math.max(kcalFloor(),Math.round(tdeeTarget()+physBonus()-deficitTarget()));}
function dayTargetK(){
  /* zero vuol dire «non lo so», e chi disegna lo sa gestire: mostra
     l'invito a completare il profilo invece di una cifra qualsiasi */
  if(!profiloUtile())return 0;
  /* VACANZA = MANTENIMENTO, non assenza di numeri. Prima la vacanza
     spegneva il deficit smettendo di mostrare un target: chi rientrava
     trovava una settimana senza riferimenti e un buco nello storico.
     Ora il target esiste ed è il fabbisogno: si mangia quanto si
     consuma, il peso resta fermo per costruzione e il rientro non è un
     salto nel vuoto. Il deficit non viene "perso": viene sospeso. */
  if(vacanzaOn())return Math.max(kcalFloor(),Math.round(tdeeTarget()+physBonus()));
  let k=dayTargetKBase();
  if(reverseOn())k+=reverseBonus();          /* uscita morbida: si risale */
  if(bankOn())k+=bankAdjust(viewIdx());      /* tassa infrasettimanale, restituita il sabato */
  if(rientroOn())k+=rientroBonus();          /* i primi giorni dopo la vacanza: deficit dolce */
  return Math.max(kcalFloor(),Math.round(k));}

/* ── La vacanza, e soprattutto il RIENTRO ──────────────────────────
   Il momento in cui le diete si rompono non è la vacanza: è il lunedì
   dopo. Si torna al deficit pieno con due chili di ritenzione addosso,
   la bilancia dice una cosa falsa, e si molla. Quindi:
   · in vacanza si mangia a fabbisogno (sopra);
   · nei GIORNI_RIENTRO successivi il deficit riparte a metà e sale da
     solo, e il coach non commenta gli extra;
   · la bilancia del primo giorno di rientro non entra nella tendenza.
   Tutto dedotto da S.ui.vacanzaFine, scritta alla chiusura. */
const GIORNI_RIENTRO=3;
function vacanzaOn(){return !!(S.ui&&S.ui.vacanza);}
function vacanzaGiorniDaFine(){
  const f=S.ui&&S.ui.vacanzaFine;if(!f)return null;
  const d=Math.floor((Date.parse(iso(new Date()))-Date.parse(f))/86400000);
  return (d>=0&&d<=GIORNI_RIENTRO)?d:null;}
function rientroOn(){return !vacanzaOn()&&vacanzaGiorniDaFine()!==null;}
/* Quanto del deficit si restituisce oggi: giorno 0 metà, poi si chiude. */
function rientroBonus(){
  const g=vacanzaGiorniDaFine();if(g===null)return 0;
  const quota=[0.5,0.35,0.2,0][Math.min(g,3)];
  return Math.round(deficitTarget()*quota);}
window.vacanzaOn=vacanzaOn;window.rientroOn=rientroOn;
window.rientroBonus=rientroBonus;window.vacanzaGiorniDaFine=vacanzaGiorniDaFine;
window.GIORNI_RIENTRO=GIORNI_RIENTRO;
/* Proteine: si calcolano sul peso di RIFERIMENTO, non su quello attuale.
   Con un forte sovrappeso il grasso non "richiede" proteine: usare il peso
   pieno gonfia il numero (ed è il motivo per cui uscivano 182 g).
   Ordine di preferenza: massa magra → peso obiettivo → peso corretto. */
/* Da dove esce il peso di riferimento: serve poterlo leggere, invece di
   vedere comparire un numero diverso da quello inserito senza spiegazioni. */
function refWeightWhy(){
  /* Questa frase finisce DENTRO un'altra frase («Nel tuo caso viene da: …»),
     quindi ogni ramo è una chiave a sé con il numero come segnaposto: era
     l'ultima cosa che restava italiana in inglese. */
  const p=S.profile,fat=parseFloat(p.fatp);
  const gw=goalWeightSet();
  if(gw&&gw<p.w)return trh("il peso obiettivo che hai impostato tu ({v1} kg)",{v1:gw});
  if(fat>0)return trh("massa magra stimata dal {v1}% di grasso, +15% di margine",{v1:fat});
  const h=+p.h||0;
  if(h>0){const ideal=(p.gender==="f"?21.5:22.5)*Math.pow(h/100,2);
    if(p.w>ideal)return trh("peso corretto: ideale per l'altezza ({v1} kg) più un quarto dell'eccesso",{v1:Math.round(ideal)});}
  return tr("il tuo peso attuale");}
/* ═══ L'OBIETTIVO DI PESO: UNA VARIABILE, UN PORTONE ══════════════
   IL DIFETTO, ricostruito col founder il 23/08: «l'utente scriveva un
   peso e l'app non lo registrava, e non lo faceva nemmeno vedere».
   Erano due cose insieme.
   1. DUE VARIABILI. Il numero viveva in `S.profile.goalW` e in
      `S.diet.obiettivoPeso`. Chi leggeva ne guardava ora una ora
      l'altra, e chi scriveva ne aggiornava a volte una sola. Da oggi
      la variabile è UNA: `S.profile.goalW`. `S.diet.obiettivoPeso`
      viene travasato all'avvio per i profili già salvati e poi
      cancellato — non esiste più un secondo posto dove guardare.
   2. IL RIFIUTO SILENZIOSO. Questa funzione aveva TRE uscite che
      restituivano il valore VECCHIO come se fosse quello nuovo:
      numero assurdo, campo bloccato dallo studio, guardrail. Solo la
      terza diceva qualcosa. Chi salvava gli Obiettivi con un numero
      rifiutato non vedeva niente: il campo tornava com'era, e sembrava
      che l'app avesse perso il dato.
      Da oggi si restituisce un ESITO — cosa è successo e perché — e
      non si finge mai che sia andata bene.
   Chi vuole scrivere l'obiettivo NON chiama questa: chiama
   `goalWeightApplica()`, che dice sempre alla persona com'è finita. */
function setGoalWeight(v,opts){
  opts=opts||{};
  const attuale=goalWeightSet()||null;
  const esito=(motivo,messaggio)=>({ok:false,valore:attuale,motivo,messaggio:messaggio||""});
  const n=parseFloat(String(v==null?"":v).replace(",","."));

  if(String(v==null?"":v).trim()==="")return esito("vuoto");
  if(!Number.isFinite(n))return esito("assurdo",tr("Non è un numero."));
  if(!(n>20&&n<350))return esito("assurdo",tr("Quel peso non sembra plausibile."));

  /* Lo studio comanda: se l'obiettivo è stato fissato da un
     professionista, qui non si scrive. Non è un dispetto — è il motivo
     per cui la persona si è rivolta a lui. Ma ora glielo si DICE.
     L'unico che scavalca è lo studio stesso (`da:"studio"`). */
  if(opts.da!=="studio"){
    try{if(typeof bloccato==="function"&&bloccato("obiettivoPeso"))
      return esito("studio",tr("Il peso obiettivo l'ha fissato il tuo studio: da qui non si cambia."));
    }catch(e){}}

  /* Il guardrail di chi decide da solo: sotto il muro non si passa.
     Chi si imposta i numeri da sé non ha nessuno che lo guardi, e un
     obiettivo che porta a un indice di massa corporea di 16 non è una
     preferenza da rispettare: è il momento in cui l'app deve dire no. */
  let avviso="";
  try{
    if(typeof verifica==="function"&&opts.da!=="studio"){
      const r=verifica("obiettivoPeso",n,livelloGuardrail(),{altezza:+S.profile.h||0});
      if(r.esito==="vietato")return esito("guardrail",r.messaggio);
      if(r.esito==="avviso")avviso=r.messaggio||"";}
  }catch(e){}

  const ok=Math.round(n*10)/10;
  S.profile.goalW=ok;
  return {ok:true,valore:ok,motivo:null,messaggio:avviso};}

/* IL PORTONE. Scrive e poi DICE com'è andata: una schermata sola
   decide le parole, così le due pagine che toccano l'obiettivo non
   possono più dire cose diverse (o non dire niente).
   Restituisce true se il valore è entrato. */
window.goalWeightApplica=(v,opts)=>{
  const r=setGoalWeight(v,opts);
  if(r.ok){
    save();
    if(r.messaggio)toast(r.messaggio);              /* avviso: passa, ma si dice */
    else if(!(opts&&opts.zitto))toast(tr("Obiettivo impostato: {n} kg ✓",{n:r.valore}));
    return true;}
  if(r.motivo==="vuoto")return false;               /* niente scritto, niente da dire */
  /* Un rifiuto si dice sempre, e si dice PERCHÉ. Il vecchio valore
     resta, e la persona deve sapere che è rimasto quello. */
  const coda=r.valore
    ? "\n\n"+tr("L'obiettivo resta {n} kg.",{n:r.valore})
    : "\n\n"+tr("L'obiettivo resta vuoto.");
  dlgAlert((r.messaggio||tr("Quel peso non sembra plausibile."))+coda,tr("Non posso impostarlo"));
  return false;};

/* Chi è seguito da uno studio non usa il livello «studio»: quel livello
   è per CHI PRESCRIVE, non per chi riceve. Un paziente che si scrivesse
   i numeri da solo con le soglie larghe del professionista avrebbe il
   peggio dei due mondi. */
function livelloGuardrail(){return "persona";}
window.livelloGuardrail=livelloGuardrail;

/* Un avviso o un rifiuto si dicono e basta: nessun numero rosso,
   nessun tono di rimprovero. La persona sta cercando di fare una cosa
   ragionevole con un dato sbagliato. */
function guardrailAvvisa(r){
  try{
    const t=String(r&&r.messaggio||"");
    if(!t)return;
    if(r.esito==="vietato")dlgAlert(t,tr("Non posso impostarlo"));
    else toast(t);
  }catch(e){}}
window.guardrailAvvisa=guardrailAvvisa;
/* L'unico modo per togliere l'obiettivo è chiederlo esplicitamente */
function clearGoalWeight(){S.profile.goalW=null;}
function goalWeightSet(){
  /* UNA variabile sola (23/08). Prima si leggeva da due campi, e la
     scelta di quale vincesse era scritta qui: ogni altro punto del
     codice che leggesse direttamente uno dei due poteva vedere un
     numero diverso da questo. */
  const v=parseFloat(S.profile.goalW);
  return v>20&&v<350?v:0;}
function refWeight(){
  const p=S.profile,fat=parseFloat(p.fatp);
  /* se hai scritto tu un peso obiettivo, quello comanda: è una tua scelta
     esplicita e va rispettata invece di sostituirla con una stima */
  const gw=goalWeightSet();
  if(gw&&gw<p.w)return Math.round(gw);
  if(fat>0)return Math.round(p.w*(1-fat/100)*1.15);   // magra + margine
  /* la formula «ideale + 25% dell'eccesso» vive in refWeightPer, pura:
     la usano anche il wizard e la proiezione */
  return refWeightPer(+p.w||0,+p.h||0,p.gender);}
/* g/kg proteici automatici. Riferimento standard: 1,5 g per kg di peso di
   RIFERIMENTO (non il peso della bilancia — vedi refWeight: il grasso
   corporeo non richiede proteine, quindi in forte sovrappeso calcolarle sul
   peso pieno gonfia il numero senza motivo). Sedentari puri 1,2 ·
   aumento massa 1,8. Il valore scritto nelle Regole ha la precedenza.
   In gravidanza e allattamento il fabbisogno proteico sale ancora. */
function protKgAuto(){
  const g=(S.profile.goal||"").toLowerCase();
  /* i casi fisiologici restano qui — sono del motore, non del wizard */
  if(!/massa|aument/.test(g)&&(pregOn()!=="no"||lactKcal()))return 1.7;
  /* chi ha allenamenti programmati non è «sedentario puro» anche se
     l'attività di base è ferma: si passa un act alzato alla formula */
  const act=+S.profile.act||1.3;
  return protKgPer(g,(act<=1.25&&goalWkTotal())?1.3:act);}
function dayTargetP(){
  const gk=(S.profile.protKg!=null?+S.profile.protKg:protKgAuto());
  const w=+refWeight();
  /* Profilo senza peso: un obiettivo proteico non esiste ancora. Meglio
     zero, che l'interfaccia sa gestire, di NaN che finisce a schermo. */
  if(!(w>0)||!(gk>0))return 0;
  return Math.round(w*gk);}
/* ── Target degli altri macro, ricavati dal target calorico del giorno ──
   Grassi ~28% delle kcal · carboidrati = quello che resta · fibre 14 g ogni
   1.000 kcal (minimo 25) · zuccheri: un TETTO, non un obiettivo (10% kcal). */
function dayTargetF(){return Math.max(30,Math.round(dayTargetK()*0.28/9));}
function dayTargetC(){
  const rest=dayTargetK()-dayTargetP()*4-dayTargetF()*9;
  return Math.max(50,Math.round(rest/4));}
function dayTargetFib(){return Math.max(25,Math.round(dayTargetK()/1000*14));}
function dayTargetZ(){return Math.max(25,Math.round(dayTargetK()*0.10/4));}
/* ═══ QUALITÀ NUTRIZIONALE DEL CIBO (0-100) ════════════════════════
   Un punteggio per pasto, calcolato dall'AI quando lo spunti, mostrato
   come pallino colorato. Cinque fasce, come una scala del semaforo. */
const QBANDS=[[20,"#DC4444","molto scarsa"],[40,"#E4632F","scarsa"],
              [60,"#FF9B72","nella media"],[80,"#2FC9BC","buona"],[100,"#00AFA3","ottima"]];
function qBand(q){const n=Math.max(0,Math.min(100,Math.round(+q||0)));
  return QBANDS.find(b=>n<=b[0])||QBANDS[QBANDS.length-1];}
function qColor(q){return qBand(q)[1];}
function qLabel(q){return qBand(q)[2];}
/* Pallino: q null = non ancora valutato (contorno vuoto) */
function qDot(q,size,title){
  const d=size||13;
  if(q==null)return `<span class="qdot empty" style="width:${d}px;height:${d}px" title="${tr("Qualità non ancora valutata")}"></span>`;
  const n=Math.round(q);
  return `<span class="qdot" style="width:${d}px;height:${d}px;background:${qColor(n)}" title="${esc(title||(trh("Qualità del cibo: {v1}% — {v2}",{v1:n,v2:qLabel(n)})))}"></span>`;}
function qKey(d){return String(d||"").toLowerCase().replace(/\s+/g," ").replace(/ · porzioni [+−]\d+%[^·]*/,"").trim().slice(0,140);}
/* Il punteggio si chiede all'AI una volta per descrizione e si tiene in cache:
   lo stesso piatto non viene rivalutato ogni volta che lo spunti. */
const QUALITY_SCALE="0-20 = ultraprocessato, fritto, ricco di zuccheri e grassi saturi, povero di nutrienti; 21-40 = scarso, poco equilibrato; 41-60 = nella media, accettabile; 61-80 = buono, cibo vero e bilanciato; 81-100 = ottimo: ingredienti integrali, verdure, buone proteine, grassi buoni. Giudica la qualità degli alimenti, non le calorie.";
async function foodQuality(desc){
  const k=qKey(desc);if(!k)return null;
  S.qCache=S.qCache||{};
  if(S.qCache[k]!=null)return S.qCache[k];
  if(!aiOn())return null;
  const t=await aiAsk('Valuta la QUALITÀ NUTRIZIONALE di questo pasto: "'+String(desc).slice(0,300)+'". '+
    'Punteggio 0-100: '+QUALITY_SCALE+' Rispondi SOLO JSON: {"q":numero}');
  const j=parseAIJSON(t);
  const q=Math.max(0,Math.min(100,Math.round(+((j&&j.q)||0))));
  if(!q)return null;
  S.qCache[k]=q;save();
  return q;}
/* Qualità media della giornata, pesata sulle calorie: un piatto da 700 kcal
   conta più di uno spuntino da 100. Solo su ciò che è stato davvero mangiato. */
function dayQuality(di){
  let num=0,den=0;
  dayItems(di).forEach(it=>{const st=S.week.days[it.pdi].meals[it.mi];
    if(!st.done||st.skip)return;
    const o=mealOpt(it.pdi,it.mi),q=qOf(st,o&&o.d);
    if(q==null)return;
    const k=Math.max(1,(o&&o.k)||0);num+=q*k;den+=k;});
  (S.week.days[di].extras||[]).forEach(e=>{if(e.st==="skip")return;
    const q=qOf(e,e.d);if(q==null)return;
    const k=Math.max(1,e.k||0);num+=q*k;den+=k;});
  return den?Math.round(num/den):null;}
/* Serie di giorni consecutivi con qualità almeno "buona" (61%+), a ritroso
   da ieri: oggi è ancora in corso e non fa testo finché non è chiuso. */
/* ── Validità del punteggio ────────────────────────────────────────
   Il voto vale solo per la DESCRIZIONE su cui è stato calcolato: insieme
   al punteggio si salva anche quella (qFor). Se il pasto cambia — matita,
   foto, barcode, ribilancio, alternativa, piatto dal frigo… — le due non
   coincidono più e il voto decade da solo, senza dover ricordare di
   invalidarlo in ognuno dei punti che modificano un pasto. */
function qOf(obj,desc){
  if(!obj||obj.q==null)return null;
  return (obj.qFor===qKey(desc))?obj.q:null;}
/* Sguardo in cache: il punteggio del piatto se già calcolato (dal
   precalcolo del piano o da una spunta precedente). Zero chiamate AI. */
function qPeek(desc){const k=qKey(desc);return (k&&S.qCache&&S.qCache[k]!=null)?S.qCache[k]:null;}
/* ── Precalcolo qualità del PIANO ────────────────────────────────────
   Alla conferma o modifica del piano l'AI valuta TUTTI i piatti in una
   chiamata sola; i punteggi vanno in S.qCache. Risultato: pallino
   visibile PRIMA di mangiare, e spunta istantanea (cache-hit, nessuna
   chiamata AI a rallentare il gesto più frequente dell'app). */
let QPLAN_T=null;
function qPlanPrecompute(){
  if(!aiOn()||typeof PLAN==="undefined"||!PLAN||!PLAN.length)return;
  clearTimeout(QPLAN_T);
  QPLAN_T=setTimeout(async()=>{
    try{
      S.qCache=S.qCache||{};
      const miss=[],seen={};
      PLAN.forEach((d,di)=>(d.meals||[]).forEach((m,mi)=>{
        const perm=S.permMeals[di+"_"+mi];
        [perm].concat(m.o||[]).forEach(o=>{
          if(!o||!o.d)return;const k=qKey(o.d);
          if(!k||S.qCache[k]!=null||seen[k])return;
          seen[k]=1;miss.push({k,d:String(o.d).slice(0,200)});});}));
      if(!miss.length)return;
      const batch=miss.slice(0,40); // un piano intero ci sta; il resto al giro dopo
      const t=await aiQuiet(()=>aiAsk('Valuta la QUALITÀ NUTRIZIONALE di ognuno di questi piatti con un punteggio 0-100 '+
        'Scala: '+QUALITY_SCALE+
        ' Piatti: '+JSON.stringify(batch.map((x,i)=>({i,piatto:x.d})))+
        ' Rispondi SOLO JSON: [{"i":indice,"q":punteggio}, …] uno per piatto.'));
      const j=parseAIJSON(t);
      if(Array.isArray(j)){let n=0;
        j.forEach(r=>{const it=batch[+r.i];const q=Math.max(0,Math.min(100,Math.round(+r.q||0)));
          if(it&&q){S.qCache[it.k]=q;n++;}});
        if(n){save();render(cur);
          if(miss.length>batch.length)qPlanPrecompute();}}
    }catch(e){/* silenzioso: al peggio i pallini arrivano alla spunta, come prima */}
  },1200);}
let QPEND={},QFAIL={};      /* richieste in volo · descrizioni che l'AI non ha saputo valutare */
function qAsk(obj,desc,tag){
  const k=qKey(desc);
  if(!k||QPEND[tag]||QFAIL[k])return;
  QPEND[tag]=1;
  foodQuality(desc).then(q=>{
    delete QPEND[tag];
    if(q==null){QFAIL[k]=1;return;}
    if(qKey(desc)!==k)return;            /* nel frattempo il pasto è cambiato */
    obj.q=q;obj.qFor=k;save();render(cur);
  }).catch(()=>{delete QPEND[tag];QFAIL[k]=1;});}
function qRefreshMeal(pdi,mi){
  const st=S.week.days[pdi]&&S.week.days[pdi].meals[mi];if(!st)return;
  const o=mealOpt(pdi,mi);if(!o||!o.d)return;
  qAsk(st,o.d,"m"+pdi+"_"+mi);}
function qRefreshExtra(di,ei){
  const e=S.week.days[di]&&S.week.days[di].extras[ei];if(!e||!e.d)return;
  qAsk(e,e.d,"e"+di+"_"+ei);}
/* Passata sul giorno mostrato: chiede il voto per tutto ciò che risulta
   mangiato e non ha (più) un punteggio valido. */
function qSweep(di){
  if(!aiOn()||!S.week||!S.week.days[di])return;
  dayItems(di).forEach(it=>{const st=S.week.days[it.pdi].meals[it.mi];
    if(!st.done||st.skip)return;
    const o=mealOpt(it.pdi,it.mi);
    if(o&&o.d&&qOf(st,o.d)==null)qRefreshMeal(it.pdi,it.mi);});
  (S.week.days[di].extras||[]).forEach((e,ei)=>{
    if(e.st==="skip")return;
    if(e.d&&qOf(e,e.d)==null)qRefreshExtra(di,ei);});}
function qStreak(){
  let n=0;const oggi=new Date();
  for(let back=1;back<=60;back++){
    const d=new Date(oggi);d.setDate(d.getDate()-back);
    const di=wd(d);
    if(iso(d)<S.week.started)break;      /* fuori dalla settimana in memoria */
    const q=dayQuality(di);
    if(q==null||q<61)break;
    n++;}
  return n;}
function wizDayTot(di){let k=0,p=0;WIZ.plan[di].meals.forEach(m=>{k+=m.o[0].k;p+=m.o[0].p;});return "~"+k+" kcal · ~"+p+"g prot";}
function wizDayTarget(di){
  /* Raggiungimento del giorno rispetto al target: si capisce a colpo
     d'occhio se il giorno "ci sta", senza fare i conti a mente. */
  let k=0,p=0;WIZ.plan[di].meals.forEach(m=>{k+=m.o[0].k;p+=m.o[0].p;});
  const tk=dayTargetK(),tp=dayTargetP();
  const pk=tk?Math.round(k/tk*100):0;
  const okK=pk>=95&&pk<=105,okP=p>=tp;
  return (okK?"✓":"◦")+" "+pk+"% delle "+tk+" kcal target · "+(okP?"✓":"◦")+" proteine "+p+" su "+tp+" g"+((okK&&okP)?" — giornata in linea":"");}
window.wizDelMealAsk=async (di,mi)=>{const m=WIZ.plan[di].meals[mi];
  if(await dlgConfirm(tr("Rimuovo il pasto «{n}» di {g}?",{n:(m.n||""),g:WIZ.plan[di].day})+"\n\n"+((m.o[0]&&m.o[0].d)||"").slice(0,80)))wizDelMeal(di,mi);};
window.wizDelOptAsk=async (di,mi,oi)=>{const a=WIZ.plan[di].meals[mi].o[oi];
  if(await dlgConfirm(tr("Rimuovo questa alternativa?")+"\n\n"+((a&&a.d)||"").slice(0,80)))wizDelOpt(di,mi,oi);};
window.wizDelMeal=(di,mi)=>{WIZ.plan[di].meals.splice(mi,1);renderSetup();};
/* Alternative dello stesso pasto: nel giorno potrai scegliere quale usare
   (a casa, in mensa, fuori, versione veloce…) senza riscrivere il piano. */
window.wizSetOpt=(di,mi,oi,f,v)=>{if(f==="d")v=cap(String(v||"").trim());
  const o=WIZ.plan[di].meals[mi].o[oi];if(!o)return;
  if(f==="k"||f==="p")o[f]=Math.round(+v)||0;else o[f]=v;};
window.wizAddOpt=(di,mi)=>{const m=WIZ.plan[di].meals[mi],b=m.o[0];
  m.o.push({d:"Alternativa: "+(b.d||"").slice(0,40),k:b.k,p:b.p,c:b.c||0,f:b.f||0,fib:b.fib||0,z:b.z||0});
  renderSetup();};
window.wizDelOpt=(di,mi,oi)=>{WIZ.plan[di].meals[mi].o.splice(oi,1);renderSetup();};
window.wizAddMeal=(di)=>{WIZ.plan[di].meals.push({n:"Pranzo",t:"~12:30",type:"norm",o:[{d:"Nuovo pasto",k:400,p:25}]});renderSetup();};
window.wizConfirm=async ()=>{
  if(!WIZ.plan||WIZ.plan.some(d=>!(d.meals||[]).length))return dlgAlert(tr("Ogni giorno deve avere almeno un pasto."));
  if(!await dlgConfirm(tr("Confermo questo piano come base settimanale? La settimana in corso (spunte, extra, allenamenti) viene azzerata.")+(WIZ.editOnly?"":" "+tr("Consulta comunque un nutrizionista prima di seguirlo."))))return;
  snapSave("prima di: piano modificato");
  S.customPlan=WIZ.plan;PLAN=S.customPlan;S.permMeals={};
  if(!WIZ.editOnly){const d=WIZ.d,t=wizTargets();
    S.profile.name=d.nome||S.profile.name;S.profile.gender=d.gen||S.profile.gender;S.profile.dob=d.dob;
    S.profile.h=d.h;S.profile.w=d.w;S.profile.fatp=d.fat||null;S.profile.musp=d.mus||null;S.profile.act=d.act;
    S.profile.weights.push({d:iso(new Date()),w:d.w,fat:d.fat,mus:d.mus,pa:null,spo2:null});
    S.diet.intol=d.intol;S.diet.no=d.no;S.diet.si=d.si;
    if(document.getElementById("wzWipe")&&document.getElementById("wzWipe").checked){S.history=[];S.profile.weights=S.profile.weights.slice(-1);S.streak={count:0,last:""};}}
  S.customShop=null;S.week=freshWeek();save();
  dlgAlert(tr("Piano confermato! Vai in Spesa per generare la lista della spesa dal nuovo piano."));
  show("piano");};
function renderSetup(){const el=document.getElementById("pg-setup");let h="";
  const disc=`<div class="card nota grave">${hint2(tr("<b> Avvertenza importante:</b> questo piano è generato da un'intelligenza artificiale su dati auto-dichiarati."),tr("NON sostituisce un professionista: prima di seguirlo, fallo validare da un nutrizionista o un medico, soprattutto in presenza di patologie, intolleranze o gravidanza."))}</div>`;
  if(WIZ.step===1){h=disc+`<div class="card"><h2>${tr("Passo 1 di 3 — Chi sei")}</h2>
    <div class="row2"><div><label>${tr("Nome")}</label><input type="text" id="wzNome" value="${esc(WIZ.d.nome||S.profile.name||"")}"></div>
    <div><label>Genere</label><select id="wzGen"><option value="m">Uomo</option><option value="f" ${WIZ.d.gen==="f"?"selected":""}>Donna</option></select></div></div>
    <div class="row2"><div><label>${tr("Data di nascita")}</label><input type="date" id="wzDob" value="${WIZ.d.dob||S.profile.dob||""}"></div>
    <div><label>Altezza (cm)</label><input type="number" id="wzH" value="${WIZ.d.h||S.profile.h||""}"></div></div>
    <div class="row3"><div><label>${tr("Peso (kg)")}</label><input type="number" step="0.1" id="wzW" value="${WIZ.d.w||S.profile.w||""}"></div>
    <div><label>M. grassa %*</label><input type="number" step="0.1" id="wzFat" value="${WIZ.d.fat||S.profile.fatp||""}"></div>
    <div><label>M. muscolare %*</label><input type="number" step="0.1" id="wzMus" value="${WIZ.d.mus||S.profile.musp||""}"></div></div>
    <label>${tr("Attività di base (sport escluso)")}</label>
    <select id="wzAct">${[["1.2",tr("Molto sedentario")],["1.3",tr("Sedentario, lavoro al PC")],["1.35",tr("Poco attivo")],["1.4",tr("Moderatamente attivo")],["1.45",tr("Attivo")],["1.55",tr("Molto attivo (lavoro fisico)")]].map(o=>`<option value="${o[0]}" ${String(WIZ.d.act||S.profile.act||1.3)===o[0]?"selected":""}>${o[1]}</option>`).join("")}</select>
    <label>${tr("Stile di vita (giorni in ufficio, mensa, smart, famiglia…)")}</label><textarea id="wzVita" placeholder="${tr("es. 2 giorni in ufficio con mensa, 3 in smart; 2 figli")}">${esc(WIZ.d.vita||"")}</textarea>
    <label>${tr("Sport abituali")}</label><input type="text" id="wzSport" value="${esc(WIZ.d.sport||"")}" placeholder="${tr("es. camminata 4 km quasi ogni giorno, tennis saltuario")}">
    <button class="btn" onclick="wizNext(2)">Avanti →</button></div>`;}
  else if(WIZ.step===2){const dv=(f,def)=>WIZ.d[f]!==undefined?WIZ.d[f]:(S.diet[f]!==undefined?S.diet[f]:def);
    const sel=(f,val,def)=>dv(f,def)===val?" selected":"";
    h=`<div class="card"><h2>${tr("Passo 2 di 3 — Cosa mangi")}</h2>
    <label>Intolleranze / allergie</label><input type="text" id="wzIntol" value="${esc(WIZ.d.intol!==undefined?WIZ.d.intol:S.diet.intol)}" placeholder="es. lattosio; colon irritabile">
    <label>${tr("Cibi che NON puoi o NON vuoi mangiare")}</label><textarea id="wzNo" placeholder="es. pomodoro, cipolla, aglio, pesce spada…">${esc(WIZ.d.no!==undefined?WIZ.d.no:S.diet.no)}</textarea>
    <label>${tr("Cibi che ami (l'AI li userà spesso)")}</label><textarea id="wzSi" placeholder="es. pollo, patate, yogurt greco, kefir…">${esc(WIZ.d.si!==undefined?WIZ.d.si:S.diet.si)}</textarea>
    <label>Note</label><input type="text" id="wzNote" value="${esc(dv("note",""))}" placeholder="${tr("preferenze, orari, altro")}">
    <label>${tr("Pasti liberi desiderati (quali e quanti a settimana)")}</label><input type="text" id="wzLiberi" value="${esc(dv("liberi",""))}" placeholder="${tr("es. pizza il sabato, sushi 1 volta al mese, aperitivo venerdì")}">
    <div class="row3"><div><label>Cucini o pronto?</label><select id="wzPronto"><option value="cucino"${sel("pronto","cucino","semplice")}>Mi piace cucinare</option><option value="semplice"${sel("pronto","semplice","semplice")}>${tr("Piatti semplici")}</option><option value="pronto"${sel("pronto","pronto","semplice")}>Pronto/veloce</option></select></div>
    <div><label>${tr("Pasti al giorno")}</label><select id="wzNPasti"><option${sel("nPasti",3,5)}>3</option><option${sel("nPasti",4,5)}>4</option><option${sel("nPasti",5,5)}>5</option></select></div>
    <div><label>Colazione</label><select id="wzColaz"><option value="dolce"${sel("colaz","dolce","entrambe")}>Dolce</option><option value="salata"${sel("colaz","salata","entrambe")}>Salata</option><option value="entrambe"${sel("colaz","entrambe","entrambe")}>Indifferente</option></select></div></div>
    ${WIZ.mode==="diet"?'<button class="btn" onclick="wizNext(2)">Salva</button> <button class="btn ghost" onclick="show(\'io\')">Annulla</button>':'<button class="btn ghost" onclick="wizNext(1)">← Indietro</button> <button class="btn" onclick="wizNext(3)">Avanti →</button>'}</div>`;}
  else if(WIZ.step===3){const t=wizTargets();
    h=`<div class="card"><h2>${tr("Passo 3 di 3 — Obiettivo")}</h2>
    <label>${tr("Cosa vuoi ottenere")}</label>
    <select id="wzGoal"><option value="leggero">${tr("Dimagrire piano (−300 kcal/g)")}</option><option value="moderato" selected>Dimagrire (−500 kcal/g)</option><option value="deciso">Dimagrire deciso (−750 kcal/g)</option><option value="mantenimento">Mantenimento</option><option value="massa">Leggera massa (+200 kcal/g)</option></select>
    <div class="stat3" style="margin-top:12px"><div><div class="v">${t.bmi}</div><div class="l">BMI</div></div>
    <div><div class="v">${t.bmr}</div><div class="l">BMR</div></div><div><div class="v">${t.tdee}</div><div class="l">TDEE</div></div></div>
    <div class="hint">${t.lbm?trh("Massa magra stimata: {v1} kg (dalla % di grasso). ",{v1:t.lbm}):""}${trh("Con l'obiettivo selezionato il piano punterà a {v1} kcal e {v2} di proteine al giorno (ricalcolati quando premi Genera).",{v1:'<b id="wzK">'+t.kcal+"</b>",v2:"<b>"+t.prot+"g</b>"})}</div>
    <label style="margin-top:12px"><input type="checkbox" id="wzWipe" style="width:auto"> ${tr("Azzera anche storico e pesate precedenti (ricomincio davvero da zero)")}</label>
    <label style="margin-top:8px"><input type="checkbox" id="wzOk" style="width:auto"> ${tr("Ho letto l'avvertenza: farò validare il piano da un nutrizionista/medico")}</label>
    <div class="mtools"><button class="btn ghost" onclick="wizNext(2)">← Indietro</button>
    <button class="btn" onclick="wizGenerate()">${tr("Genera il piano")}</button></div>
    <div class="aibox" aria-live="polite" id="wzOut" style="display:none"></div></div>`;}
  else if(WIZ.step===4&&WIZ.plan){
    h=(WIZ.editOnly?`<button class="btn ghost small" style="margin-bottom:12px" onclick="show('piano')">${tr("‹ Torna al piano (senza salvare)")}</button>`:disc)+`<div class="card"><h2>${WIZ.editOnly?"Modifica il piano":" Il tuo piano — controlla e modifica"}</h2>
    Tocca i campi per correggere descrizioni, kcal e proteine. Poi conferma: diventerà la tua base settimanale.</div>`;
    WIZ.plan.forEach((d,di)=>{
      h+=`<div class="dayname">${esc(giorno(d.day))}</div><div class="dayctx">${esc(d.ctx)}</div>`;
      (d.meals||[]).forEach((m,mi)=>{const o=m.o[0];
        h+=`<div class="meal"><div class="mbody">
        <div class="grid2"><div><label>Fascia</label><select onchange="wizSet(${di},${mi},'n',this.value)">${SLOTS.map(s=>`<option ${m.n===s?"selected":""}>${s}</option>`).join("")}</select></div>
        <div><label>Tipo</label><select onchange="wizSet(${di},${mi},'type',this.value)"><option value="norm" ${m.type==="norm"?"selected":""}>normale</option><option value="free" ${m.type==="free"?"selected":""}>libero</option><option value="mensa" ${m.type==="mensa"?"selected":""}>mensa</option></select></div></div>
        <label>${tr("Piatto")}</label><textarea onchange="wizSet(${di},${mi},'d',this.value)">${esc(o.d)}</textarea>
        <div class="wzval" id="wzv${di}_${mi}">${macroLine(o)}</div>
        <div class="wzbar">
          <button class="btn ghost small" onclick="wizEstim(${di},${mi})">Stima</button>
          <button class="btn ghost small" onclick="wizAddOpt(${di},${mi})">Alternativa</button>
          <button class="btn warn small" onclick="wizDelMealAsk(${di},${mi})">Rimuovi</button>
        </div>`;
        // ── alternative dello stesso pasto (a casa / in mensa / fuori / veloce)
        if((m.o||[]).length>1)m.o.slice(1).forEach((alt,ai)=>{const oi=ai+1;
          h+=`<div class="rientro">
          <label>Alternativa ${oi}</label><textarea onchange="wizSetOpt(${di},${mi},${oi},'d',this.value)">${esc(alt.d)}</textarea>
          <div class="wzval" id="wzv${di}_${mi}_${oi}">${macroLine(alt)}</div>
          <div class="wzbar">
            <button class="btn ghost small" onclick="wizEstim(${di},${mi},${oi})">Stima</button>
            <button class="btn warn small" onclick="wizDelOptAsk(${di},${mi},${oi})">Rimuovi</button>
          </div></div>`;});
        h+=`        </div></div>`;});
      h+=`<div class="mtools"><button class="btn ghost small" onclick="wizAddMeal(${di})">${tr("+ pasto")}</button></div>
      <div class="daytotal">${tr("Giorno:")} <span id="wzTot${di}">${wizDayTot(di)}</span></div>
      <div class="hint" id="wzTgt${di}">${wizDayTarget(di)}</div>
      <div class="mtools" style="margin-bottom:16px">
        <button class="btn small" onclick="wizBalance(${di})">${tr("Bilancia la giornata con l'AI")}</button>
      </div>`;});
    h+=`<div class="card"><div class="mtools">
    ${WIZ.editOnly?"":'<button class="btn ghost" onclick="wizNext(3)">← Rigenera</button>'}
    <button class="btn" onclick="wizConfirm()">${tr("Conferma piano")}</button>
    <button class="btn ghost" onclick="show('io')">${tr("Annulla")}</button></div>
    <div class="hint"> ${tr("Ricorda: fai validare il piano da un nutrizionista prima di seguirlo.")}</div></div>`;}
  else{h=`<div class="card"><div class="hint">${tr("Percorso non avviato.")}</div><button class="btn small" onclick="wizStart(true)">Inizia</button></div>`;}
  el.innerHTML=h;}

/* ═══ PAGINA GUIDA (statica) ═══ */
/* La mappa delle funzioni segue la stessa regola di Guida e Nuvia: due
   corpi, si sceglie per lingua. L'inglese arriverà qui (NUVIA_FUNZIONI_EN);
   finché non c'è, esce l'italiano — mai una tabella vuota. */
window.NUVIA_FUNZIONI_EN=`<div class="card guida-sec"><details class="gdet"><summary><h2>Everything Nuvia can do</h2><span class="gdet-arrow">▾</span></summary><div class="gdet-body">
<div class="hint">The complete map, feature by feature. Each entry is then explained in detail in the Guide.</div>
<table class="gtable">
<tr><td colspan="2"><b>Guided setup</b> — eight guided steps: privacy, AI key, who you are, your goal, how you eat, backup, plan. The <b>Gemini key is hooked up right at step 3</b>, so every step after it can already use the AI.</td></tr>
<tr><td colspan="2"><b>A goal made for you</b> — the pace (kg/week) changes its options according to the goal you pick and <b>genuinely drives the deficit</b>; your <b>planned workouts</b> (sport · minutes · times) and your <b>water goal</b> feed into your energy needs right from the initial setup.</td></tr>
<tr><td colspan="2"><b>Tools</b> — the section for the tools of the moment, so "Today" stays readable. Inside:  <b>I've got a craving</b> (pick the sensation — crunchy, sweet, hot, creamy, salty, cold — and the AI invents a dish that puts it out while staying inside the calories you have left),  <b>Compromise at the table</b> (a forking recipe: the same base for everyone, then each person finishes their own),  <b>Reduce bloating</b> (works out what caused the last 48 hours, reassures you it's gas and water, rewrites the meals in a digestible version),  <b>Sudden temptation</b> (half a portion, right after a meal, compensated on the meal you choose),  <b>Uncontrollable hunger</b> (same calories, volume multiplied),  <b>Grazing</b> (meals become many small tastes, inside the numbers),  <b>Predictive balancing</b> (choose the day and meal of the occasion and what you'll eat: the AI estimates the calories, works out the gap against the plan and spreads it in small cuts across the meals still to come, protein untouched),  <b>Smart cooking</b> (cook once for several days, up to 3, on meals not yet eaten),  <b>Cooking for everyone</b>,  <b>I'm training soon</b>, plus fridge, menu and regional dishes.</td></tr>
<tr><td colspan="2"><b>I'm a guest</b> — on the meal cards: two questions with icons (how much you ate · what was on the plate) and the meal is logged with a statistical estimate, without asking you about food you don't know. Overshoot catch-up absorbs the gap.</td></tr>
<tr><td colspan="2"><b>Energy dip</b> — the button under the stars logs the slump with its time and ties it to the meal before. After three reports the AI receives the pattern and reduces the refined carbohydrates in the meal responsible.</td></tr>
<tr><td colspan="2"><b>Food quality</b> — when you tick a meal, a <b>coloured dot</b> appears in place of the time, with a score from 0 to 100 given by the AI: red below 20%, then orange, yellow, light green, dark green above 80%. It judges <b>what the food is made of</b>, not how many calories it has. In the balance you'll find the day's average, weighted by calories, and at the top the run of consecutive days of good food. If you change a meal (photo, barcode, , rebalance) the score recalculates itself.</td></tr>
<tr><td colspan="2"><b>The day's balance</b> — nine panels: deficit (sport already included), calories eaten, protein, carbohydrates, fat, fibre, sugars, streak and quality. Each with its own bar. <b>Sugars</b> are a ceiling, not a target: the bar turns red if you go over.</td></tr>
<tr><td colspan="2"><b>Pregnancy, injury and illness</b> (Today → How you feel) — alongside your cycle and breastfeeding. Pregnancy adds calories per trimester and <b>always suspends the deficit</b>. Injury and illness lower your needs because you move less: the cut applies only to the <b>activity</b> share, the basal rate is never touched. During illness the deficit stays suspended until you recover. Your cycle switches itself off after 7 days; the others stay on <b>until you turn them off</b>.</td></tr>
<tr><td colspan="2"><b>Rescaled portions</b> — these states don't rewrite your plan: they multiply the portions starting from <b>your plan's calories</b>, not from an estimate. That way an amount you forced by hand isn't lost, and when you switch the state off the portions go back <b>exactly</b> to the base ones. For the arithmetic to work, the plan needs to be kept in a <b>neutral</b> state, that is, written without those calories already counted in.</td></tr>
<tr><td colspan="2"><b>Diet phases</b> (Rules) — living in a permanent deficit wears out body and mind. You can alternate deficit days with <b>maintenance</b> days: nine ready-made schemes (from "6 days + 1" to "3 months + 1 month") or your own numbers. During the break the deficit goes to zero, portions come back up and shopping adjusts; a notice tells you and re-tunes plan and shopping. The <b>projection in History</b> takes it into account: in the flat stretches your weight stays put on purpose.</td></tr>
<tr><td colspan="2"><b>Recalibrate</b> (Today, under How you feel) — <b>today's meals</b> re-tunes only the ones you haven't ticked, against the calories you have left. <b>The week</b> re-tunes the 7 days starting today and rebuilds the shopping list: it applies to that week only, your base plan stays as it is.</td></tr>
<tr><td colspan="2"><b>Shopping starts from today</b> — the list covers the 7 days beginning <b>on the day you shop</b>, not from Monday: you can shop on a Wednesday and be covered until the following Tuesday. Today's meals you've already ticked aren't bought again.</td></tr>
<tr><td colspan="2"><b>Soft landing and weekend fund</b> (in Tools) — the <b>gradual climb back</b> adds 60 kcal a week for as long as your weight stays stable, so you can come off the diet without regaining everything; the <b>trust fund</b> sets aside 8% from Monday to Friday and gives it back on Saturday for dinner out, with the weekly balance unchanged.</td></tr>
<tr><td colspan="2"><b>Satiety engine</b> — under every ticked meal, five dots: <i>how hungry were you?</i> The app works out the day's average, exports it and, if hunger stays high, asks the AI to increase fibre, protein and volume at the same calories.</td></tr>
<tr><td colspan="2"><b>Why the scale is up today</b> — under the balance, when it's needed: it explains the spike with yesterday's carbohydrates and sport, how little water you drank and the luteal phase, and reminds you that it's water, not fat.</td></tr>
<tr><td colspan="2"><b>Calibrate the day</b> — after a bad night or a stressful day, it reorganises the remaining meals <b>at the same calories</b>: carbohydrates moved to lunch, a lighter, more protein-heavy dinner, more volume if you've been hungry.</td></tr>
<tr><td colspan="2"><b>Anonymous usage data</b> — "Would you send me the statistics of how much you use Nuvia? <b>No personal data and nothing about your diet.</b>" They answer one question only: after how many days do people stop? <b>Eight numbers</b> go out (a random identifier, version, days since installation, days of use, last use, ticks, AI requests, whether a plan exists) and nothing else: no weight, no food, no name, no notes. You choose during the guided setup and change it under <b>Profile</b>, where you can also <b>see the exact package</b> generated from your data.</td></tr>
<tr><td colspan="2"><b>For the developer: switching collection on</b> — a browser can't send email on its own. To receive the data automatically: open <i>script.google.com</i> → New project → paste a <code>doPost</code> script that writes to a sheet and uses <code>MailApp.sendEmail</code> towards your inbox → Deploy as a <i>web app</i>, access "anyone" → copy the address it gives you and paste it into the <code>TEL_URL</code> constant at the top of the code. From then on sending is automatic and the user has to do nothing.</td></tr>
<tr><td colspan="2"><b>Your supermarkets</b> — you build the list of stores yourself, and that isn't a shortcut: site addresses change constantly and the app can't verify them. You search for a food on <b>your</b> store's site, paste the address of the results, and the app works out the pattern by itself. From then on every ↗ in the list opens the search for that product. You can keep several stores and choose which to use.</td></tr>
<tr><td colspan="2"><b>Offers first</b> — same method: you switch the <b>offers</b> filter on at the site, paste the new address, and the app learns that too. Then with a toggle the ↗ links point at discounted products instead of the ordinary search. If on that site the filter doesn't end up in the address, the app tells you instead of pretending to work.</td></tr>
<tr><td colspan="2"><b>Shopping that does itself</b> — the list is built from your plan's ingredients with the <b>exact</b> quantities and <b>updates itself</b> at every change to the plan, keeping the ticks on the products that remain: no buttons to press. You can choose whether the shop is <b>just for you or for the whole household</b>, and meals away from home only count if you prepare them yourself.</td></tr>
<tr><td colspan="2"><b>Away from home: do you carry them or eat out?</b> — the difference changes everything, so now you choose: if <b>you prepare them</b> the plan gives real recipes with amounts, designed to travel (good cold too, one container, no sauces that separate) and the ingredients <b>stay on the shopping list</b>; if <b>you eat out</b> the plan describes how to put the plate together without inventing recipes, and those ingredients <b>don't reach the list</b>. It's set as a fixed rule in Rules, or for the current week only from the Plan.</td></tr>
<tr><td colspan="2"><b>Meals away from home, week by week</b> (in Plan) — for anyone working<b>shifts</b>: you set the days and meals away from home for the current week only, without touching the fixed rule. On saving, the app offers to review the plan and rebuild that week's shopping accordingly. The meals you carry from home are designed as a <b>packed lunch</b>: good cold, in a single container, without sauces that separate.</td></tr>
<tr><td colspan="2"><b>A more readable balance</b> — the big circle is gone: <b>deficit</b>, <b>protein</b> and <b>streak</b> sit in the three panels at the top, each with its own progress bar, and below them stay eaten · planned · sport.</td></tr>
<tr><td colspan="2"><b>Swipe to delete</b> — on the extras cards: swipe left and the card disappears, with an <b>UNDO</b> bar at the bottom for four seconds. No more confirmations for every little thing.</td></tr>
<tr><td colspan="2"><b>Emotional hunger catcher</b> — when you log an extra dense in sugar or fat, or it's late, the app steps in without judging: it asks whether it's real hunger, offers the water method (a glass and fifteen minutes) and, if you wait, three alternatives that are sweet but filling and inside today's macros.</td></tr>
<tr><td colspan="2"><b>Household</b> (setup and Rules) — you enter only the <b>sex and date of birth</b> of whoever eats at home: the category and relative energy needs are calculated by the app following the LARN bands (adult woman = 1 · man = 1.25 · teenager 10-14 = 1.10 · child 4-9 = 0.75 · infant 1-3 = 0.50). The AI knows how many portions are needed in the pan and for the shopping.</td></tr>
<tr><td colspan="2"><b>Cycle and breastfeeding</b> (in Today → How you feel) — the luteal phase raises your basal rate by a few percentage points, and breastfeeding costs real energy: switching them on <b>adds</b> those calories to your needs, it doesn't fit them inside. Your cycle switches itself off after 7 days and warns you that the weight gained on those days is water, not fat; breastfeeding (exclusive or partial) stays until you change it and also raises the safety calorie floor. Every value is editable in Rules, the state ends up in the export, and the <b> Recalibrate</b> button re-tunes amounts and shopping on these numbers.</td></tr>
<tr><td colspan="2"><b>Health conditions as tick boxes</b> — irritable bowel, reflux, cholesterol, triglycerides, high blood pressure, type 2 diabetes, PCOS, fatty liver, uric acid, thyroid, anaemia, gallstones, diverticula, coeliac disease, plus any you add by hand. Every tick carries <b>concrete dietary criteria</b> into all the AI's proposals: with triglycerides it cuts sugar and alcohol, with cholesterol saturated fat, with reflux fried and acidic dishes. It's context, not therapy: clinical guidance stays with your doctor and nutritionist.</td></tr>
<tr><td colspan="2"><b>Regional dishes from where you are</b> (in Today) — travelling or away for work, the AI starts from the <b>cuisine of the region</b> you're in and suggests three regional dishes <b>suited to that particular meal</b> (at breakfast, local pastries and dairy, not meat courses) and compatible with your rules, explaining <b>how to order them</b> to stay on target: portion, side, dressing on the side. If the three don't convince you, ask for others. Your location is used only to work out region and country — the coordinates are rounded to ~11 km and never saved — and alternatively you type where you are. These are dishes from the local tradition, not the restaurant's menu: for that there's the menu picker, which now <b>puts a whole meal together</b> instead of choosing a single dish: you tick the courses you want — starter, nibbles, first course, main, side, pizza, sandwich, dessert, drink — plus any sections you write yourself (big salads, poke, sharing boards…) — and the AI assembles the combination that fits inside the <b>total</b> target, with the calorie count, how to order each course and an alternative for each. You can ask for other combinations until the compatible options run out. Menu photos <b>expire after three hours</b>, the length of a meal: another time in another restaurant you won't find the previous place's suggestions.</td></tr>
<tr><td colspan="2"><b>Three separate levels</b> — your <b>reference style</b> is the underlying approach (Mediterranean, omnivore, vegetarian, vegan, pescetarian, flexitarian); <b>protocols</b> are the technical schemes (low FODMAP, intermittent fasting, low carb, ketogenic, DASH, low glycaemic index, balanced low-calorie, anti-inflammatory, high protein, low sodium, plus any you write yourself); <b>intolerances</b> are exclusions. The <b>reference diet</b> is chosen from a menu: picking <i>vegetarian</i> brings up by itself the two clarifications that matter (eggs and fish allowed or not), because the versions differ from person to person. They used to be mixed into a single menu where you could pick only one: now they can coexist, and every protocol brings its own operating rules that the AI applies to every proposal.</td></tr>
<tr><td colspan="2"><b>Workouts and the timing of your goal</b> — the calories burned in planned workouts <b>don't raise the calories you eat</b>: your meal target stays needs minus deficit. They're there to estimate <b>how long</b> it takes you to reach your goal, and Estimate results uses them.</td></tr>
<tr><td colspan="2"><b>Meals away from home</b> — no longer just "canteen": you mark the days you eat out (canteen, trattoria, bar, set menu) and for each whether it's <b>lunch, dinner or both</b> — useful if you work while travelling. The weekly total counts itself, and for those meals the plan describes how to compose the plate instead of inventing one.</td></tr>
<tr><td colspan="2"><b>Variety at three levels</b> — you decide whether the plan should turn on a few ingredients that come back (short shopping, little cooking), sit in the middle, or offer different dishes every time. The AI builds the week accordingly.</td></tr>
<tr><td colspan="2"><b>The plan follows your weight</b> — when you're more than 3 kg down (or up) from when the plan was born, the app tells you, shows how your needs have changed, and offers to re-tune the amounts. Never automatically: you decide.</td></tr>
<tr><td colspan="2"><b>A properly generic canteen</b> — for canteen meals the plan doesn't invent a precise dish, it describes how to build the tray (protein source, side, carbohydrate portion). Those meals never reach the shopping list.</td></tr>
<tr><td colspan="2"><b>Target weight, one value only</b> — it lives in one place, visible under <b>Profile → Goals</b> and used everywhere (protein, projection, charts, estimate). Only you change it: if the field is left empty the app asks for confirmation instead of deleting it, and when the AI suggests a correction you can accept it or rewrite it.</td></tr>
<tr><td colspan="2"><b>Dietary details as tick boxes</b> — the meals you actually eat (every slot, After dinner included), <b>canteen day by day</b> with a lunch/dinner choice, <b>intolerances</b> as checkboxes (lactose, gluten, nickel, eggs, tree nuts, fish/shellfish, soy, low FODMAP) plus free text, <b>vegetarian with eggs and fish allowed or excluded</b>, vegan.</td></tr>
<tr><td colspan="2"><b>Protein tuned to you</b> — g/kg automatically: sedentary 0.8–1.0 · active and maintenance 1.2–1.6 (1.3 on average) · muscle gain 1.6–2.2, always on your reference weight and editable in Rules.</td></tr>
<tr><td colspan="2"><b>Goal check</b> — before building the plan the app verifies that your desired weight is healthy for your height: if it's too low it says so, shows the correct range in kg (BMI 18.5–24.9) and lets you <b>rewrite the goal on the spot</b>, with an immediate re-analysis, without leaving the screen.</td></tr>
<tr><td colspan="2"><b>AI models always current</b> — in "auto" mode the app reads from your account which Gemini models exist (at every opening, or straight away with "Look for new models" in Profile) and uses the most recent available: when Google publishes a new one it picks it up by itself, with no app update.</td></tr>
<tr><td colspan="2"><b>Editable weigh-ins</b> — with the pencil you correct a weigh-in or <b>add the values you were missing</b> (fat, muscle, blood pressure, oxygen saturation) even days later; with the bin you delete it, always with a confirmation.</td></tr>
<tr><td colspan="2"><b>Your notes</b> (in History) — every note from your diary in a single list. They're archived with the week, come out in the CSV (the "note" column), and the AI reads them when it looks for correlations.</td></tr>
<tr><td colspan="2"><b>Declared pace = real pace</b> — the deficit can't exceed 30% of your needs, for safety. If the pace you choose would need more, the app <b>tells you</b> and shows the pace it will actually work at, instead of quietly reducing it.</td></tr>
<tr><td colspan="2"><b>AI plan generator</b> — seven days built <b>one at a time</b>: each day knows the dishes already used (no repeats), respects canteen, intolerances, season and target; real food only, supplements only if indispensable and to be agreed with a nutritionist.</td></tr>
<tr><td colspan="2"><b>Import a plan from photos</b> — you photograph the plan you already have, or load the images from your gallery (paper or PDF, several pages included): the AI reads days, meals and alternatives, works out calories and macros from the amounts written there, and prepares the shopping list.</td></tr>
<tr><td colspan="2"><b>Estimate results</b> — the plan's average vs your needs + workouts = kg/week and the estimated date for your goal; if the goal doesn't add up, it offers <b>automatic re-tuning of the amounts</b> (the dishes stay the same) with shopping and estimate rebuilt.</td></tr>
<tr><td colspan="2"><b>Seasonal alternatives</b> — lunches and dinners gain a seasonal option labelled ${ic("primavera",14)} Spring · ${ic("estate",14)} Summer · ${ic("autunno",14)} Autumn · ${ic("inverno",14)} Winter, at the same calories and protein; the base plan stays generic and regenerating clears the old seasons away.</td></tr>
<tr><td colspan="2"><b>Today's diary</b> — a ring with the deficit in real time, ✓/✗ ticks on meals and extras, water, sleep/relaxation/mood, events, the day's note, swipe between days.</td></tr>
<tr><td colspan="2"><b>Freshness and eating order</b> (a plan from your shopping) — the plan still runs Monday→Sunday, but the food is spread across a different clock: the one that starts <b>from the moment you shop</b>. If you buy on Wednesday evening, Wednesday's dinner is the first meal and the following Wednesday morning is the last: fish and cold cuts land in the first days, tins and frozen food at the end. The durations are fridge storage estimates, not use-by dates.</td></tr>
<tr><td colspan="2"><b>Cook and freeze</b> — when something fresh doesn't fit inside its window, Nuvia doesn't force it: it offers to cook it now and freeze part of it for a meal further off. With <b>Mark in the freezer</b> the portion stays in the cupboard, isn't bought again, and the meal that will use it knows to defrost it.</td></tr>
<tr><td colspan="2"><b>I'm ordering in</b> (in Tools) — you paste the dishes from your delivery app and Nuvia picks the combination that fits tonight's numbers, bearing in mind that <b>takeaway portions are larger and more heavily dressed</b>: it estimates high, not low. With two alternatives and, if needed, how to compensate across the rest of the day.</td></tr>
<tr><td colspan="2"><b>When you need more than an app</b> — if certain signals persist (eating far less than planned for days on end, very large excesses that repeat, persistently low mood, emotional hunger almost daily), a card appears in Point that says so calmly and gives the national freephone number for eating disorders, free and anonymous. It isn't a diagnosis: Nuvia doesn't make them and won't. The thresholds are cautious — at least two weeks of data are needed — and the card can be dismissed.</td></tr>
<tr><td colspan="2"><b>Undo</b> — every action that changes your data can be undone: next to the message at the bottom of the screen an <b>Undo</b> appears, for eight seconds (fifteen when the action is a heavy one, like emptying the cupboard or rewriting the plan). It undoes the last action, once: it's a change of mind, not a history. The automatic saves at start-up can't be undone, because you didn't make them.</td></tr>
<tr><td colspan="2"><b>The morning after</b> (in Tools) — after a heavy evening it rewrites the remaining meals in a digestible, water-rich version, <b>at the same calories and protein</b>: today isn't made up for with hunger. It also says how many extra glasses to drink and when. It doesn't talk about medicines or "detox", and if the symptoms go beyond tiredness and bloating it sends you to a doctor.</td></tr>
<tr><td colspan="2"><b>Strategy at the table</b> (inside predictive balancing) — if the occasion is a buffet, drinks or a work dinner, alongside the calorie margin come <b>three lines on how to handle the table</b>: what to start from, what to skip without regret, when to stop. Advice, not rules.</td></tr>
<tr><td colspan="2"><b>I've got ten minutes</b> (in Tools) — the constraint is time: two suggestions that <b>genuinely</b> fit into ten minutes including preparation and cooking, four ingredients at most, no oven, using what you have in the cupboard and freezer. If a recipe doesn't fit, it isn't offered.</td></tr>
<tr><td colspan="2"><b>Shelf</b> (in Tools) — faced with twenty similar products, you photograph the shelf: Nuvia reads the labels, cross-checks them against <b>your list</b> and your dietary details, and says <b>which to take, how much and why</b> that one and not the other (protein, sugar, salt, additives, price per kilo if legible). If a product is one to avoid for you, it flags it. If the labels can't be read, it says so instead of inventing.</td></tr>
<tr><td colspan="2"><b>What the shop costs</b> — from your receipt Nuvia also reads the prices: total, cost per day, <b>average cost per meal</b> and the breakdown by category. Prices are estimates (offers and discounts confuse the reading): tap a product in the cupboard to correct it. Cost also feeds the suggestions: at equal nutritional value, the AI points out where you'd spend less.</td></tr>
<tr><td colspan="2"><b>Estimates without an AI key</b> — a local table of <b>695 foods from every tradition</b>, named in both Italian and English, estimates calories and macros for common dishes ("rice 90g, chicken 150g, courgettes", "naan, dal, paneer") right on your phone, with no network and no key. It covers only what it recognises: if it understands less than 60% of the dish, it prefers to ask you for the numbers rather than invent them.</td></tr>
<tr><td colspan="2"><b>The AI learns your corrections</b> — after every estimate you can answer <b>I'll correct it</b>: the pair (dish, right value) stays in memory and is attached to later estimates. "My carbonara is 650, not 520", said once, holds for good: your pan, your oil, your portions.</td></tr>
<tr><td colspan="2"><b>Shopping alternatives that update the plan</b> — the AI icon on a product offers three <b>selectable</b> substitutes: the one you choose goes onto the list and, if you accept, rewrites the plan's meals that used it, adjusting the amounts to stay close to the original calories and protein.</td></tr>
<tr><td colspan="2"><b>What the AI knows about you</b> (Rules → AI rules) — the <b>exact</b> text that accompanies every request, composed live from your data: rules, intolerances, prohibitions, body states, corrections. At the bottom there's the <b>engine's health</b>: how many answers came back in the right format. You don't have to trust it: read it.</td></tr>
<tr><td colspan="2"><b>Photo of the plate</b> — the AI estimates <b>the weight in grams of every element</b> as well as calories and macros, and writes the description with those weights: correct the grams with ${ic("pencil",15)} and the estimate is redone using exactly your numbers. At a restaurant, one course at a time; multiple barcodes without spending any AI.</td></tr>
<tr><td colspan="2"><b>Rebalance the remaining calories</b> — it rewrites only the meals you haven't ticked, to get back inside the day's budget: amounts first, then any substitutions; protein never reduced, the per-meal minimum respected.</td></tr>
<tr><td colspan="2"><b>Overshoot catch-up</b> — the slips of the last 5 days are spread across the days after with safety thresholds and ceilings: never a day of fasting.</td></tr>
<tr><td colspan="2"><b>Help on a single meal</b> —  edit with re-estimate,  an alternative at the same macros,  ingredient substitution (from a photo of what you have at home too),  create a dish from the fridge, the restaurant menu picker, ⭐ saved dishes reusable without AI. Saved dishes end up under <b>⭐ Dishes</b>: from there you reuse them for any meal or as an extra, without spending AI, and the AI treats them as already liked when it suggests or rebalances.</td></tr>
<tr><td colspan="2"><b>Shopping list</b> — derived from <b>your</b> plan and <b>rebuilt by itself</b> when the plan changes, with or without AI, supermarket categories, ticks that persist, links to your store, sending by WhatsApp.</td></tr>
<tr><td colspan="2"><b>Sport</b> — 24 sports ready to go (cycling, swimming, padel, CrossFit…) and new sports with a MET estimate via AI, consistent with the app's rules; calories worked out on your weight at the time.</td></tr>
<tr><td colspan="2"><b>Transparent rules</b> — every number that governs the app is visible and editable; the <b>check against your own data</b> derives your real needs from your weigh-ins; "What the AI knows about you" shows the exact context of every request.</td></tr>
<tr><td colspan="2"><b>History</b> — summary, past months and weeks always editable, weigh-ins and body measurements with charts, the projection towards your goal, AI reports, a 38-column export (CSV/JSON) and pattern analysis.</td></tr>
<tr><td colspan="2"><b>Protections</b> — automatic snapshots before every important operation, with restore; selective clean-up by date range (weigh-ins, weeks, shopping, events and <b>saved dishes</b> too, useful when too many pile up); Drive backup with dated copies, and local backup.</td></tr>
<tr><td colspan="2"><b>Automatic updating</b> — at every start-up the app checks whether there's a new version and updates itself, with no manual steps; your data isn't touched.</td></tr>
<tr><td colspan="2"><b>iOS compatibility</b> — dialogues built into the app instead of the system ones: confirmations, saves and deletions work as a web app on the Home screen too.</td></tr>
<tr><td colspan="2"><b>Privacy</b> — everything lives on your device: no account, no server, the AI key and Drive are yours alone; the developer sees nothing.</td></tr>
</table></div></details></div>`;
function nuviaFunzioni(){
  const en=(typeof LANG!=="undefined"&&LANG==="en");
  return (en&&window.NUVIA_FUNZIONI_EN)||NUVIA_FUNZIONI;}
window.nuviaFunzioni=nuviaFunzioni;
/* ricotta al cambio lingua: il tr() qui dentro si valuta alla
   costruzione, e la costruzione si ripete quando la lingua cambia
   (registro I18N_RIFAI in 10_base) */
let NUVIA_FUNZIONI;
(window.I18N_RIFAI=window.I18N_RIFAI||[]).push(function(){NUVIA_FUNZIONI=`<div class="card guida-sec"><details class="gdet"><summary><h2>${tr("Tutto quello che Nuvia sa fare")}</h2><span class="gdet-arrow">▾</span></summary><div class="gdet-body">
${hint2(tr("La mappa completa, funzione per funzione."),tr("Ogni voce è poi spiegata in dettaglio nella Guida."))}
<table class="gtable">
<tr><td colspan="2"><b>Percorso guidato</b> ${trh("— otto passi guidati: privacy, chiave AI, chi sei, obiettivo, come mangi, backup, piano. La {b1}, così tutti i passi successivi possono già usare l'AI.",{b1:"<b>chiave Gemini si aggancia subito al passo 3</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Obiettivo su misura")}</b> ${trh("— il ritmo (kg/settimana) cambia opzioni in base all'obiettivo scelto e {b2}; gli {b1} (sport · minuti · volte) e l'{b3} entrano nel fabbisogno già dal percorso iniziale.",{b2:"<b>"+tr("guida davvero il deficit")+"</b>",b1:"<b>allenamenti previsti</b>",b3:"<b>"+tr("obiettivo acqua")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>Tools</b> — la sezione degli strumenti del momento, così "Oggi" resta leggibile. Dentro:  <b>${tr("Ho una voglia")}</b> ${trh("(scegli la sensazione — croccante, dolce, caldo, cremoso, salato, freddo — e l'AI inventa un piatto che la spegne restando nelle calorie rimaste),  {b}",{b:"<b>Compromesso a tavola</b>"})} ${trh("(ricetta a biforcazione: stessa base per tutti, poi ognuno completa la sua),  {b}",{b:"<b>Ridurre gonfiore</b>"})} ${trh("(individua i responsabili delle ultime 48 h, rassicura che è gas e acqua, riscrive i pasti in versione digeribile),  {b}",{b:"<b>Tentazione improvvisa</b>"})} ${trh("(metà porzione, subito dopo un pasto, e compensa sul pasto che scegli),  {b} (stesse calorie, volume moltiplicato),",{b:"<b>Fame incontrollabile</b>"})}  <b>Spiluccare</b> ${trh("(i pasti diventano tanti piccoli assaggi, dentro i conti),  {b} (scegli giorno e pasto dell'occasione e cosa mangerai: l'AI stima le calorie, fa il delta con il piano e lo distribuisce in piccoli tagli sui pasti che mancano, proteine intatte),  {b3} (cucini una volta per più giorni, fino a 3, sui pasti non ancora fatti),  {b1},  {b2}, più frigo, menù e piatti tipici.",{b:"<b>Bilanciamento predittivo</b>",b3:"<b>Cucina intelligente</b>",b1:"<b>"+tr("Cucino per tutti")+"</b>",b2:"<b>Mi alleno tra poco</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Sono ospite")}</b> ${tr("— sulle card dei pasti: due domande con icone (quanto hai mangiato · cos'era nel piatto) e il pasto viene registrato con una stima statistica, senza chiedere cibi che non conosci. Il recupero degli sfori assorbe lo scarto.")}</td></tr>
<tr><td colspan="2"><b>${tr("Calo di energia")}</b> ${tr("— il pulsante sotto le stelline registra l'abbiocco con l'orario e lo lega al pasto precedente. Dopo tre segnalazioni l'AI riceve lo schema e riduce i carboidrati raffinati del pasto incriminato.")}</td></tr>
<tr><td colspan="2"><b>${tr("Qualità del cibo")}</b> ${trh("— quando spunti un pasto, al posto dell'orario compare un {b} con un voto da 0 a 100 dato dall'AI: rosso sotto il 20%, poi arancione, giallo, verde chiaro, verde scuro sopra l'80%. Giudica {b1}, non quante calorie ha. Nel bilancio trovi la media della giornata, pesata sulle calorie, e in alto la serie di giorni di fila con cibo buono. Se cambi un pasto (foto, barcode, , ribilancio) il voto si ricalcola da solo.",{b:"<b>pallino colorato</b>",b1:"<b>"+tr("com'è fatto il cibo")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Bilancio della giornata")}</b> ${trh("— nove riquadri: deficit (già comprensivo dello sport), kcal mangiate, proteine, carboidrati, grassi, fibre, zuccheri, serie e qualità. Ognuno con la sua barra. Gli {b1} sono un tetto, non un obiettivo: la barra diventa rossa se lo superi.",{b1:"<b>zuccheri</b>"})}</td></tr>
<tr><td colspan="2"><b>Gravidanza, infortunio e malattia</b> ${trh("(Oggi → Come stai) — oltre a ciclo e allattamento. La gravidanza aggiunge calorie per trimestre e {b}. Infortunio e malattia riducono il fabbisogno perché ti muovi meno: il taglio è solo sulla quota di {b2}, il metabolismo basale non si tocca mai. In malattia il deficit resta sospeso finché non guarisci. Il ciclo si spegne da solo dopo 7 giorni; gli altri restano attivi",{b:"<b>"+tr("sospende sempre il deficit")+"</b>",b2:"<b>"+"attività"+"</b>"})} <b>${tr("finché non li togli tu")}</b>.</td></tr>
<tr><td colspan="2"><b>Porzioni riscalate</b> ${trh("— questi stati non riscrivono il piano: moltiplicano le porzioni partendo dalle {b2}, non da una stima. Così una grammatura che hai forzato a mano non va persa, e quando spegni lo stato le porzioni tornano {b1} quelle di base. Perché il conto torni, il piano va tenuto in stato {b3}, cioè scritto senza avere già conteggiato quelle calorie.",{b2:"<b>"+tr("kcal del tuo piano")+"</b>",b1:"<b>esattamente</b>",b3:"<b>neutro</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Fasi della dieta")}</b> ${trh("(Regole) — stare sempre in deficit stanca il corpo e la testa. Puoi alternare giorni di deficit e giorni di {b1}: nove schemi pronti (da «6 giorni + 1» a «3 mesi + 1 mese») oppure i tuoi numeri. Nella pausa il deficit va a zero, le porzioni risalgono e la spesa si adegua; un avviso te lo dice e ritara piano e spesa. La {b2} ne tiene conto: nei tratti piatti il peso resta fermo apposta.",{b1:"<b>mantenimento</b>",b2:"<b>"+tr("proiezione in Storico")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>Ricalibra</b> ${trh("(Oggi, sotto Come stai) — {b1} ritara solo quelli non ancora spuntati, sulle calorie che ti restano.",{b1:"<b>"+tr("i pasti di oggi")+"</b>"})} <b>${tr("La settimana</b> ritara i 7 giorni che partono da oggi e rigenera la spesa: vale solo per quella settimana, il piano di base resta quello che è.")}</td></tr>
<tr><td colspan="2"><b>${tr("La spesa parte da oggi")}</b> ${trh("— la lista copre i 7 giorni che iniziano {b1}, non da lunedì: puoi fare la spesa di mercoledì e coprire fino al martedì dopo. I pasti di oggi già spuntati non vengono ricomprati.",{b1:"<b>"+tr("dal giorno in cui la fai")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>Uscita morbida e fondo weekend</b> ${trh("(negli Strumenti) — la {b1} aggiunge 60 kcal a settimana finché il peso resta stabile, per smettere la dieta senza riprendere tutto; il {b2} mette da parte l'8% dal lunedì al venerdì e lo restituisce il sabato per la cena fuori, a parità di bilancio settimanale.",{b1:"<b>risalita graduale</b>",b2:"<b>fondo fiduciario</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Motore di sazietà")}</b> ${trh("— sotto ogni pasto spuntato cinque pallini: {b1} L'app calcola la media della giornata, la esporta e, se la fame resta alta, chiede all'AI di aumentare fibre, proteine e volume a parità di calorie.",{b1:"<i>"+tr("che fame avevi?")+"</i>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Perché oggi la bilancia sale")}</b> ${tr("— sotto il bilancio, quando serve: spiega il picco di peso con i carboidrati e lo sport di ieri, la poca acqua bevuta e la fase luteale, e ricorda che è acqua, non grasso.")}</td></tr>
<tr><td colspan="2"><b>Calibra giornata</b> ${trh("— dopo una notte storta o una giornata stressante, riorganizza i pasti che restano {b1}: carboidrati spostati a pranzo, cena più leggera e proteica, più volume se hai avuto fame.",{b1:"<b>"+tr("a parità di calorie")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>Dati d'uso anonimi</b>${trh(" — «Mi mandi le statistiche di quanto usi Nuvia? {b3}» Servono a rispondere a una domanda sola: dopo quanti giorni le persone smettono? Escono {b} (identificativo casuale, versione, giorni dall'installazione, giorni d'uso, ultimo utilizzo, spunte, richieste AI, se c'è un piano) e nient'altro: né peso, né cibo, né nome, né note. Si sceglie nel percorso guidato e si cambia in {b1}, dove puoi anche {b2} generato con i tuoi dati.",{b3:"<b>"+tr("Nessun dato personale o della tua dieta.")+"</b>",b:"<b>otto numeri</b>",b1:"<b>Io</b>",b2:"<b>"+tr("vedere il pacchetto esatto")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Per lo sviluppatore: attivare la raccolta")}</b> ${trh("— un browser non può spedire email da solo. Per ricevere i dati in automatico: apri {b4} → Nuovo progetto → incolla uno script {b5} che scrive su un foglio e usa {b2} verso la tua casella → Distribuisci come {b1}, accesso «chiunque» → copia l'indirizzo che ti dà e incollalo nella costante {b3} in cima al codice. Da quel momento l'invio è automatico e l'utente non deve fare nulla.",{b4:"<i>script.google.com</i>",b5:"<code>doPost</code>",b2:"<code>MailApp.sendEmail</code>",b1:"<i>app web</i>",b3:"<code>TEL_URL</code>"})}</td></tr>
<tr><td colspan="2"><b>${tr("I tuoi supermercati")}</b> ${trh("— la lista dei negozi la costruisci tu, e non è una scorciatoia: gli indirizzi dei siti cambiano di continuo e l'app non può verificarli. Cerchi un alimento sul sito del {b} negozio, incolli l'indirizzo dei risultati e l'app ricava da sola il modello. Da lì ogni della lista apre la ricerca di quel prodotto. Puoi tenere più negozi e scegliere quale usare.",{b:"<b>tuo</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Prima le offerte")}</b> ${trh("— con lo stesso metodo: attivi sul sito il filtro {b}, incolli il nuovo indirizzo e l'app impara anche quello. Poi con un interruttore i link ↗ puntano ai prodotti in promozione invece che alla ricerca normale. Se su quel sito il filtro non finisce nell'indirizzo, l'app te lo dice invece di far finta di funzionare.",{b:"<b>offerte</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Spesa che si fa da sola")}</b> ${trh("— la lista si costruisce dagli ingredienti del piano con le quantità {b} e si {b2} a ogni modifica del piano, tenendo le spunte sui prodotti che restano: niente pulsanti da premere. Puoi scegliere se la spesa è {b3}, e i pasti fuori casa contano solo se li prepari tu.",{b:"<b>esatte</b>",b2:"<b>aggiorna da sola</b>",b3:"<b>"+tr("solo per te o per tutta la famiglia")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>Fuori casa: li porti o li mangi fuori?</b> ${trh("— la differenza cambia tutto, quindi ora si sceglie: se {b1} il piano dà ricette vere con le grammature, pensate per essere trasportabili (buone anche fredde, contenitore unico, niente salse che si separano) e gli ingredienti <b>restano nella spesa</b>; se <b>li mangi fuori</b> il piano descrive come comporre il piatto senza inventare ricette e quegli ingredienti {b6}. Si imposta come regola fissa in Regole o solo per la settimana in corso dal Piano.",{b1:"<b>li prepari tu</b>",b6:"<b>"+tr("non finiscono nella lista")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Pasti fuori casa settimana per settimana")}</b> ${trh("(in Piano) — per chi fa {b}: imposti i giorni e i pasti fuori casa solo per la settimana in corso, senza toccare la regola fissa. Salvando, l'app propone di rivedere il piano e rigenerare la spesa settimanale di conseguenza. I pasti che porti da casa vengono pensati come {b1}: buoni anche freddi, in un contenitore unico, senza salse che si separano.",{b:"<b>turni</b>",b1:"<b>schiscetta</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Bilancio più leggibile")}</b> ${trh("— via il cerchio grande: {b}, {b2} e {b3} stanno nei tre riquadri in alto, ognuno con la sua barra di progressione, e sotto restano mangiate · pianificato · sport.",{b:"<b>deficit</b>",b2:"<b>proteine</b>",b3:"<b>serie</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Trascina per eliminare")}</b> ${trh("— sulle card degli extra: trascina verso sinistra e la card sparisce, con la barra {b} in basso per quattro secondi. Niente più conferme per ogni piccola cosa.",{b:"<b>ANNULLA</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Intercettore di fame emotiva")}</b> ${tr("— quando registri un extra denso di zuccheri o grassi, o è tardi, l'app si mette in mezzo senza giudicare: ti chiede se è fame vera, propone il metodo dell'acqua (un bicchiere e quindici minuti) e, se aspetti, tre alternative dolci ma sazianti dentro i macro di oggi.")}</td></tr>
<tr><td colspan="2"><b>Famiglia</b> ${trh("(onboarding e Regole) — inserisci solo {b1} di chi mangia a casa: la categoria e il fabbisogno relativo li calcola l'app secondo le fasce LARN (donna adulta = 1 · uomo = 1,25 · adolescente 10-14 = 1,10 · bambino 4-9 = 0,75 · infante 1-3 = 0,50). L'AI sa quante porzioni servono in pentola e per la spesa.",{b1:"<b>"+tr("sesso e data di nascita")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>Ciclo e allattamento</b> ${trh("(in Oggi → Come stai) — la fase luteale alza il metabolismo basale di qualche punto percentuale e l'allattamento costa energia vera: attivandoli, quelle calorie si {b1} al fabbisogno, non ci stanno dentro. Il ciclo si spegne da solo dopo 7 giorni e avvisa che l'aumento di peso di quei giorni è acqua, non grasso; l'allattamento (esclusivo o parziale) resta finché non lo cambi e alza anche il pavimento calorico di sicurezza. Tutti i valori sono modificabili in Regole, lo stato finisce nell'esportazione, e il pulsante {b2} ritara grammature e spesa su questi numeri.",{b1:"<b>sommano</b>",b2:"<b> Ricalibra</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Condizioni di salute a spunte")}</b> ${trh("— colon irritabile, reflusso, colesterolo, trigliceridi, pressione alta, diabete 2, PCOS, fegato grasso, acido urico, tiroide, anemia, calcoli, diverticoli, celiachia, più quelle che aggiungi a mano. Ogni spunta porta con sé {b1} che entrano in tutte le proposte dell'AI: con i trigliceridi taglia zuccheri e alcol, col colesterolo i grassi saturi, col reflusso fritti e piatti acidi. È contesto, non terapia: le indicazioni cliniche restano del medico e del nutrizionista.",{b1:"<b>criteri dietetici concreti</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Piatti tipici di dove sei")}</b> ${trh("(in Oggi) — in viaggio o in trasferta l'AI parte dalla {b} in cui ti trovi e propone tre piatti tipici {b1} (a colazione dolci da forno e latticini locali, non secondi di carne) e compatibili con le tue regole, spiegando {b2} per restare nel target: porzione, contorno, condimento a parte. Se la terna non convince, chiedi altre proposte. La posizione serve solo a dedurre regione e nazione — le coordinate vengono arrotondate a ~11 km e non vengono mai salvate — e in alternativa scrivi tu dove sei.",{b:"<b>cucina della regione</b>",b1:"<b>"+tr("adatti al pasto di quel momento")+"</b>",b2:"<b>"+tr("come ordinarli")+"</b>"})} ${trh("Sono piatti della tradizione locale, non il menù del locale: per quello c'è il selezionatore di menù, che ora <b>compone il pasto</b> invece di scegliere un piatto solo: spunti le portate che vuoi fare — antipasto, stuzzicherie, primo, secondo, contorno, pizza, panino, dolce, bevanda — più le sezioni che scrivi tu (insalatone, poke, taglieri…) — e l'AI mette insieme la combinazione che sta nel {b2} del target, con il conto delle calorie, come ordinare ogni portata e un'alternativa per ciascuna. Puoi chiedere altre combinazioni finché le opzioni compatibili non finiscono. Le foto del menù {b}, il tempo di un pasto: un'altra volta in un altro locale non ti ritrovi le proposte di quello di prima.",{b2:"<b>totale</b>",b:"<b>scadono dopo tre ore</b>"})}</td></tr>
<tr><td colspan="2"><b>Tre livelli separati</b> — l'${trh("<b>impostazione di riferimento</b> è lo stile di fondo (mediterranea, onnivora, vegetariana, vegana, pescetariana, flexitariana); i {b1} sono gli schemi tecnici (basso FODMAP, digiuno intermittente, low carb, chetogenica, DASH, basso indice glicemico, ipocalorica bilanciata, antinfiammatoria, alta proteina, iposodica, più quelli che scrivi tu); le {b9} sono le esclusioni. La {b8} si sceglie dal menù: selezionando {b7} compaiono da sole le due precisazioni che contano (uova e pesce ammessi o no), perché le versioni cambiano da persona a persona. Prima erano mescolati in un unico menù e se ne poteva scegliere uno solo: ora possono convivere, e ogni protocollo porta con sé le sue regole operative che l'AI applica a ogni proposta.",{b1:"<b>protocolli</b>",b9:"<b>intolleranze</b>",b8:"<b>"+tr("dieta di riferimento")+"</b>",b7:"<i>vegetariana</i>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Allenamenti e tempi dell'obiettivo")}</b> ${trh("— le calorie bruciate con gli allenamenti pianificati {b1}: il target dei pasti resta fabbisogno meno deficit. Servono a stimare {b2} arrivi all'obiettivo, e le usa la Stima risultati.",{b1:"<b>"+tr("non alzano le calorie da mangiare")+"</b>",b2:"<b>"+tr("in quanto tempo")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Pasti fuori casa")}</b> — non più solo "mensa": segni i giorni in cui mangi fuori (mensa, trattoria, bar, menù fisso) e per ognuno se è <b>pranzo, cena o entrambi</b> ${tr("— utile a chi lavora in viaggio. Il totale settimanale si conta da sé, e per quei pasti il piano descrive come comporre il piatto invece di inventarne uno.")}</td></tr>
<tr><td colspan="2"><b>${tr("Varietà a tre livelli")}</b> ${tr("— scegli tu se il piano deve girare su pochi ingredienti che tornano (spesa corta, poco da cucinare), stare in mezzo, o proporre piatti sempre diversi. L'AI costruisce la settimana di conseguenza.")}</td></tr>
<tr><td colspan="2"><b>${tr("Il piano segue il tuo peso")}</b> ${tr("— quando cali (o sali) di oltre 3 kg rispetto a quando il piano è nato, l'app te lo dice, mostra come è cambiato il fabbisogno e propone di ritarare le grammature. Mai in automatico: decidi tu.")}</td></tr>
<tr><td colspan="2"><b>Mensa davvero generica</b> ${tr("— per i pasti in mensa il piano non inventa un piatto preciso, ma descrive come comporre il vassoio (fonte proteica, contorno, porzione di carboidrati). Quei pasti non finiscono mai nella lista della spesa.")}</td></tr>
<tr><td colspan="2"><b>${tr("Obiettivo di peso, un valore solo")}</b> ${trh("— vive in un unico posto, visibile in {b} e usato ovunque (proteine, proiezione, grafici, stima). Lo cambi solo tu: se il campo resta vuoto l'app chiede conferma invece di cancellarlo, e quando l'AI propone una correzione puoi accettarla o riscriverla.",{b:"<b>Io → Obiettivi</b>"})}</td></tr>
<tr><td colspan="2">${trh("<b>Caratteristiche alimentari a spunte</b> — pasti che fai davvero (tutti gli slot, Dopo cena compreso), {b2} con scelta pranzo/cena, {b1} a checkbox (lattosio, glutine, nichel, uova, frutta a guscio, pesce/crostacei, soia, basso FODMAP) più testo libero, <b>vegetariana con uova e pesce ammessi o esclusi</b>, vegana.",{b2:"<b>"+tr("mensa giorno per giorno")+"</b>",b1:"<b>intolleranze</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Proteine tarate su di te")}</b> ${tr("— g/kg automatici: sedentari 0,8–1,0 · attivi e mantenimento 1,2–1,6 (media 1,3) · massa 1,6–2,2, sempre sul peso di riferimento e modificabili nelle Regole.")}</td></tr>
<tr><td colspan="2"><b>${tr("Controllo dell'obiettivo")}</b> ${trh("— prima di costruire il piano l'app verifica che il peso desiderato sia sano per la tua altezza: se è troppo basso te lo dice, mostra l'intervallo corretto in kg (BMI 18,5–24,9) e ti lascia {b1}, con rianalisi immediata, senza uscire dalla schermata.",{b1:"<b>"+tr("riscrivere l'obiettivo sul momento")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Modelli AI sempre aggiornati")}</b> ${tr("— in modalità «auto» l'app legge dal tuo account quali modelli Gemini esistono (a ogni apertura, o subito con «Cerca modelli nuovi» in Io) e usa il più recente disponibile: quando Google ne pubblica uno nuovo lo prende da solo, senza aggiornare l'app.")}</td></tr>
<tr><td colspan="2"><b>Pesate modificabili</b> ${trh("— con la matita correggi una pesata o {b1} (grasso, muscolo, pressione, saturazione) anche giorni dopo; col cestino la elimini, sempre con conferma.",{b1:"<b>"+tr("aggiungi i valori che ti mancavano")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Le tue note")}</b> ${tr("(in Storico) — tutte le note del diario in un unico elenco. Vengono archiviate con la settimana, escono nel CSV (colonna «nota») e le legge l'AI quando cerca le correlazioni.")}</td></tr>
<tr><td colspan="2"><b>Ritmo dichiarato = ritmo reale</b> ${trh("— il deficit non può superare il 30% del fabbisogno per sicurezza. Se il ritmo che scegli richiede di più, l'app {b1} e mostra il ritmo a cui lavorerà davvero, invece di ridurlo in silenzio.",{b1:"<b>"+tr("te lo dice")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Generatore di piano AI")}</b> ${trh("— sette giorni costruiti {b1}: ogni giorno conosce i piatti già usati (niente ripetizioni), rispetta mensa, intolleranze, stagione e target; solo cibo vero, integratori soltanto se indispensabili e da concordare con un nutrizionista.",{b1:"<b>"+tr("uno alla volta")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Importa il piano da foto")}</b> ${trh("— fotografi il piano che hai già, o carichi le immagini dalla galleria (carta o PDF, anche più pagine in una volta): l'AI trascrive giorni, pasti e {b}, stima kcal e macro dalle grammature scritte e prepara la lista della spesa.",{b:"<b>alternative</b>"})}</td></tr>
<tr><td colspan="2"><b>Stima risultati</b> ${trh("— media del piano vs fabbisogno + allenamenti = kg/settimana e data stimata dell'obiettivo; se l'obiettivo non torna, propone la {b1} (i piatti restano gli stessi) con spesa e stima rigenerate.",{b1:"<b>"+tr("ritaratura automatica delle grammature")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>Alternative stagionali</b> ${tr("— a pranzi e cene si aggiunge un'opzione di stagione etichettata")} ${ic("primavera",14)} Primaverile · ${ic("estate",14)} Estivo · ${ic("autunno",14)} Autunnale · ${ic("inverno",14)} ${tr("Invernale, a parità di kcal e proteine; il piano base resta generico e rigenerando spariscono le stagioni vecchie.")}</td></tr>
<tr><td colspan="2"><b>${tr("Diario di oggi")}</b> ${tr("— anello col deficit in tempo reale, spunte ✓/✗ su pasti ed extra, acqua, sonno/relax/umore, eventi, nota del giorno, swipe fra i giorni.")}</td></tr>
<tr><td colspan="2"><b>${tr("Freschezza e ordine di consumo")}</b> ${trh("(piano dalla spesa) — il piano resta lunedì→domenica, ma gli alimenti si distribuiscono su un altro orologio: quello che parte {b}. Se compri mercoledì sera, la cena di mercoledì è il primo pasto e la mattina del mercoledì dopo è l'ultimo: pesce e affettati finiscono nei primi giorni, scatolame e surgelati in fondo. Le durate sono stime di conservazione in frigo, non date di scadenza.",{b:"<b>"+tr("dal momento della spesa")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>Cuoci e congela</b> ${tr("— quando un fresco non entra nella sua finestra, Nuvia non lo forza: propone di cucinarlo subito e congelarne una parte per un pasto lontano. Con")} <b>${tr("Segna nel freezer</b> la porzione resta in dispensa, non viene ricomprata e il pasto che la userà sa di doverla scongelare.")}</td></tr>
<tr><td colspan="2"><b>Ordino a domicilio</b> ${tr("(in Strumenti) — incolli i piatti dell'app di consegne e Nuvia sceglie la combinazione che sta nei numeri di stasera, tenendo conto che <b>le porzioni da asporto sono più abbondanti e più condite</b>: stima al rialzo, non al ribasso. Con due alternative e, se serve, come compensare nel resto della giornata.")}</td></tr>
<tr><td colspan="2">${trh("{b} — se alcuni segnali durano (mangiare molto meno del previsto per giorni, eccessi molto grandi che si ripetono, umore basso persistente, fame nervosa quasi quotidiana), in Punto compare una card che te lo dice con calma e indica il numero verde nazionale per i disturbi alimentari, gratuito e anonimo. Non è una diagnosi: Nuvia non ne fa e non ne farà. Le soglie sono prudenti — servono almeno due settimane di dati — e la card si può togliere.",{b:"<b>"+tr("Quando serve più di un'app")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Annulla")}</b> ${trh("— ogni azione che cambia i dati si può disfare: accanto al messaggio in fondo allo schermo compare {b1}, per otto secondi (quindici quando l'azione è pesante, come svuotare la dispensa o riscrivere il piano). Si annulla l'ultima azione, una sola volta: è un ripensamento, non una cronologia. I salvataggi automatici dell'avvio non sono annullabili, perché non li hai fatti tu.",{b1:"<b>"+tr("Annulla")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Il giorno dopo")}</b> ${trh("(in Strumenti) — dopo una serata pesante riscrive i pasti che restano in versione digeribile e ricca d'acqua, {b1}: oggi non si recupera con la fame. Dice anche quanti bicchieri in più bere e quando. Non parla di farmaci né di «detox», e se i sintomi vanno oltre stanchezza e gonfiore rimanda al medico.",{b1:"<b>"+tr("a parità di calorie e proteine")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>Strategia a tavola</b> ${trh("(dentro il bilanciamento predittivo) — se l'occasione è un buffet, un aperitivo o una cena aziendale, oltre al margine di calorie arrivano {b1}: da cosa partire, cosa saltare senza rimpianti, quando fermarsi. Consigli, non regole.",{b1:"<b>"+tr("tre righe su come stare a tavola")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>Ho dieci minuti</b> ${trh("(in Strumenti) — il vincolo è il tempo: due proposte che stanno {b} in dieci minuti fra preparazione e cottura, massimo quattro ingredienti, niente forno, usando quello che hai in dispensa e nel freezer. Se una ricetta non ci sta, non te la propone.",{b:"<b>davvero</b>"})}</td></tr>
<tr><td colspan="2"><b>Scaffale</b> ${trh("(in Strumenti) — davanti a venti prodotti simili, fotografi lo scaffale: Nuvia legge le etichette, incrocia la {b} e le tue caratteristiche alimentari e dice <b>quale prendere, quanto e perché</b> quello e non l'altro (proteine, zuccheri, sale, additivi, prezzo al chilo se leggibile). Se un prodotto è da evitare per te, lo segnala. Se le etichette non si leggono, lo dice invece di inventare.",{b:"<b>"+tr("tua lista")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Quanto costa la spesa")}</b> ${trh("— dallo scontrino Nuvia legge anche i prezzi: totale, costo al giorno, {b} e la ripartizione per categoria. I prezzi sono stime (offerte e sconti ingannano la lettura): tocca un prodotto in dispensa per correggerlo. Il costo entra anche nei suggerimenti: a parità di valori nutrizionali, l'AI segnala dove si spenderebbe meno.",{b:"<b>costo medio a pasto</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Stime senza chiave AI")}</b> ${trh("— una tabella locale di {b1}, con i nomi in italiano e in inglese, stima calorie e macro dei piatti comuni («riso 90g, pollo 150g, zucchine», «naan, dal, paneer») direttamente sul telefono, senza rete e senza chiave. Copre solo ciò che riconosce: se capisce meno del 60% del piatto, preferisce chiederti i numeri piuttosto che inventarli.",{b1:"<b>"+tr("695 alimenti di tutte le tradizioni")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("L'AI impara le tue correzioni")}</b> ${trh("— dopo ogni stima puoi rispondere {b}: la coppia (piatto, valore giusto) resta in memoria e viene allegata alle stime successive. «La mia carbonara è 650, non 520» detto una volta vale per sempre: la tua padella, il tuo olio, le tue porzioni.",{b:"<b>Correggo io</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Alternative della spesa che aggiornano il piano")}</b> ${trh("— l'icona AI su un prodotto propone tre sostituti {b}: quello che scegli entra in lista e, se accetti, riscrive i pasti del piano che lo usavano adattando le grammature per restare vicino a kcal e proteine originali.",{b:"<b>selezionabili</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Cosa sa di te l'AI")}</b> ${trh("(Regole → Regole AI) — il testo {b} che accompagna ogni richiesta, composto dal vivo dai tuoi dati: regole, intolleranze, divieti, stati del corpo, correzioni. In fondo c'è la {b2}: quante risposte sono arrivate in formato corretto. Non devi fidarti: leggi.",{b:"<b>esatto</b>",b2:"<b>"+tr("salute del motore")+"</b>"})}</td></tr>
<tr><td colspan="2">${trh("<b>Foto del piatto</b> — l\'AI stima <b>il peso in grammi di ogni elemento</b> oltre a kcal e macro, e scrive la descrizione pesata: correggi i grammi con {v1} e la stima si rifà usando esattamente i tuoi numeri. Al ristorante una portata alla volta; barcode multiplo senza consumare AI.",{v1:ic("pencil",15)})}</td></tr>
<tr><td colspan="2"><b>${tr("Ribilancia le calorie residue")}</b> ${tr("— riscrive solo i pasti non ancora spuntati per rientrare nel budget del giorno: prima le grammature, poi eventuali sostituzioni; proteine mai ridotte, minimo per pasto rispettato.")}</td></tr>
<tr><td colspan="2"><b>Recupero sfori</b> ${tr("— gli sbagli degli ultimi 5 giorni si spalmano nei giorni dopo con soglie e tetti di sicurezza: mai un giorno di digiuno.")}</td></tr>
<tr><td colspan="2"><b>${tr("Aiuti sul singolo pasto")}</b> ${trh("—  modifica con ristima,  alternativa a parità di macro,  sostituzione ingrediente (anche dalla foto di ciò che hai in casa),  crea un piatto dal frigo, selezionatore di menù al ristorante, ⭐ piatti salvati riusabili senza AI. I piatti salvati finiscono in {b1}: da lì li riusi per qualsiasi pasto o come extra, senza consumare AI, e l'AI li considera già graditi quando propone o ribilancia.",{b1:"<b>⭐ Piatti</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Lista della spesa")}</b> — derivata dal ${tr("<b>tuo</b> piano e <b>rigenerata da sola</b> quando il piano cambia, con AI o senza, categorie da supermercato, spunte persistenti, link al tuo negozio, invio WhatsApp.")}</td></tr>
<tr><td colspan="2"><b>Sport</b> ${tr("— 24 sport pronti (ciclismo, nuoto, padel, CrossFit…) e nuovi sport con stima MET via AI coerente con le regole dell'app; kcal calcolate sul tuo peso del momento.")}</td></tr>
<tr><td colspan="2"><b>${tr("Regole trasparenti")}</b> ${trh("— ogni numero che governa l'app è visibile e modificabile; la {b1} ricava il fabbisogno reale dalle pesate; «Cosa sa di te l'AI» mostra il contesto esatto di ogni richiesta.",{b1:"<b>"+tr("verifica sui tuoi dati")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Storico")}</b> ${tr("— riepilogo, mesi e settimane passate sempre modificabili, pesate e biometriche con grafici, proiezione verso l'obiettivo, report AI, esportazione a 38 colonne (CSV/JSON) e analisi dei pattern.")}</td></tr>
<tr><td colspan="2"><b>Protezioni</b> ${trh("— istantanee automatiche prima di ogni operazione importante con ripristino, pulizia selettiva per intervallo di date (pesate, settimane, spesa, eventi e anche i {b1}, utile quando se ne accumulano troppi), backup su Drive con copie datate e backup locale.",{b1:"<b>piatti salvati</b>"})}</td></tr>
<tr><td colspan="2"><b>Aggiornamento automatico</b> ${tr("— a ogni avvio l'app controlla se c'è una versione nuova e si aggiorna da sola, senza gesti manuali; i dati non vengono toccati.")}</td></tr>
<tr><td colspan="2"><b>${tr("Compatibilità iOS")}</b> ${tr("— dialoghi interni all'app al posto di quelli di sistema: conferme, salvataggi e cancellazioni funzionano anche come web-app sulla schermata Home.")}</td></tr>
<tr><td colspan="2"><b>Privacy</b> ${tr("— tutto vive sul tuo dispositivo: niente account, niente server, chiave AI e Drive solo tuoi; lo sviluppatore non vede nulla.")}</td></tr>
</table></div></details></div>`;});
window.I18N_RIFAI[window.I18N_RIFAI.length-1]();
/* ═══ NUVIA: due corpi, una pagina ═══════════════════════════════════
   La casa del marchio: chi è Nuvia, cosa promette, e la mappa completa
   delle funzioni. L'ordine è voluto: prima il perché, poi il cosa. Come
   per la Guida, la prosa esiste in due lingue e si sceglie per LANG. */
const NUVIA_IT={};const NUVIA_EN={};
NUVIA_IT.corpo=()=>`<div class="card nvhero">
  <img class="nvfloat" alt="Nuvia" src="assets/marchio-esteso.png" style="width:min(60%,220px);height:auto" onerror="this.src=window.NUVIA_LOCKUP||''">
    <div class="nvtag">${tr("La nutrizione che vive con te.")}</div>
</div>
<div class="card">
  <h2>${tr("La promessa")}</h2>
  <div class="nvprom">${tr("«Non sarai mai più tu a doverti adattare a una dieta: sarà Nuvia ad adattarsi alla tua vita.»")}</div>
  <p class="hint2p" style="margin-top:12px">${trh("Il nome racconta già tutto: {b} come nutrimento e come nuovo, {b2} come il percorso — e dentro, l'{b3} che lo rende possibile.",{b:"<b>Nu</b>",b2:"<b>via</b>",b3:"<b>ia</b>"})}</p>
</div>
<div class="card">
  <h2>${tr("Dove vogliamo arrivare")}</h2>
  <p class="hint2p">${tr("Un mondo in cui l'alimentazione smette di essere una rigida gabbia matematica e diventa un'esperienza fluida e senza stress, capace di abbracciare con empatia l'imprevedibilità della vita.")}</p>
  <h2 style="margin-top:16px">${tr("Come ci arriviamo, ogni giorno")}</h2>
  <p class="hint2p">${tr("Con l'intelligenza artificiale più avanzata al servizio delle tue giornate vere: Nuvia si adatta ai tuoi imprevisti, protegge il tuo equilibrio, e organizza pasti e spesa con precisione scientifica e calore umano.")}</p>
</div>
<div class="card">
  <h2>${tr("I tre valori che guidano ogni funzione")}</h2>
  <div class="nvval"><b>Empatia radicale, zero giudizi</b><p>${tr("La vita succede: una vacanza, la febbre, una gravidanza, un attacco di fame emotiva. Nuvia non ti punisce mai — ti capisce, ti offre il metodo dell'acqua, e riorganizza la giornata senza farti sentire in colpa.")}</p></div>
  <div class="nvval" style="border-left-color:var(--gradz)"><b>${tr("Flessibilità reale")}</b><p>${tr("Mensa, schiscetta, ospiti a cena: il sistema ricrea l'ordine dal caos e ricalibra le tue settimane con un tocco. Le app statiche pretendono la tua routine; Nuvia segue la tua vita.")}</p></div>
  <div class="nvval"><b>Trasparenza scientifica</b><p>${tr("Nessuna scatola nera: Nuvia dichiara la qualità del cibo, mostra come divide le calorie, ti impedisce deficit pericolosi e adatta le proteine al tuo stile di vita. Puoi sempre vedere il perché di ogni numero.")}</p></div>
</div>
`+``+nuviaFunzioni()+`
<div class="hint" style="text-align:center;margin:16px 0">Versione ${APP_VER}</div>`;
NUVIA_EN.corpo=()=>`<div class="card nvhero">
  <img class="nvfloat" alt="Nuvia" src="assets/marchio-esteso.png" style="width:min(60%,220px);height:auto" onerror="this.src=window.NUVIA_LOCKUP||''">
    <div class="nvtag">Nutrition that lives with you.</div>
</div>
<div class="card">
  <h2>The promise</h2>
  <div class="nvprom">“You'll never have to bend your life around a diet again: Nuvia bends around your life.”</div>
  <p class="hint2p" style="margin-top:12px">The name says it already: <b>Nu</b> for nourishment and for new, <b>via</b> for the road — and inside it, the <b>ia</b> that makes it possible.</p>
</div>
<div class="card">
  <h2>Where we want to get to</h2>
  <p class="hint2p">A world where eating stops being a rigid mathematical cage and becomes something fluid and unstressful — something able to take in the unpredictability of a real life with empathy.</p>
  <h2 style="margin-top:16px">How we get there, every day</h2>
  <p class="hint2p">With the most advanced AI put at the service of your actual days: Nuvia adapts to what happens to you, protects your balance, and organises meals and shopping with scientific precision and human warmth.</p>
</div>
<div class="card">
  <h2>The three values behind every feature</h2>
  <div class="nvval"><b>Radical empathy, zero judgement</b><p>Life happens: a holiday, a fever, a pregnancy, a bout of emotional hunger. Nuvia never punishes you — it understands, it offers you the water method, and it reorganises the day without making you feel guilty.</p></div>
  <div class="nvval" style="border-left-color:var(--gradz)"><b>Real flexibility</b><p>Canteen, packed lunch, guests for dinner: the system rebuilds order out of chaos and recalibrates your week in one tap. Static apps demand your routine; Nuvia follows your life.</p></div>
  <div class="nvval"><b>Scientific transparency</b><p>No black box: Nuvia states the quality of the food, shows how it splits your calories, stops you from running dangerous deficits and adapts your protein to how you actually live. You can always see the reason behind every number.</p></div>
</div>
`+``+nuviaFunzioni()+`
<div class="hint" style="text-align:center;margin:16px 0">Version ${APP_VER}</div>`;
function nuviaCorpo(){
  const en=(typeof LANG!=="undefined"&&LANG==="en");
  return ((en&&NUVIA_EN.corpo)||NUVIA_IT.corpo)();}
function renderNuvia(){document.getElementById("pg-nuvia").innerHTML=avvisoLingua()+nuviaCorpo();}
function avvisoLingua(){
  if(LANG!=="en")return "";
  /* Onestà sulla lingua, e con un numero: dire «in arrivo» per mesi non è
     onesto, dire «due sezioni su cinque» sì. L'avviso sparisce da solo
     quando non resta più niente da dichiarare. */
  const q=(typeof guidaQuanteEN==="function")?guidaQuanteEN():0;
  const tot=(typeof GUIDA_SEZIONI!=="undefined")?GUIDA_SEZIONI.length:5;
  if(q>=tot&&window.NUVIA_FUNZIONI_EN)return "";
  /* Dire cosa manca DAVVERO: a Guida finita l'unico pezzo rimasto è la
     mappa delle funzioni, e continuare a parlare di sezioni sarebbe
     un avviso che non aiuta nessuno. */
  const resta=(q>=tot)
    ? "the Guide is fully rewritten; the feature map on this page is the last piece still in Italian."
    : `${q} of ${tot} guide sections are done, the rest are still in Italian and will follow.`;
  return `<div class="card" style="border-left:4px solid var(--zaff)"><div class="hint">The app itself — buttons, fields and screens — is fully translated. The long explanations are being rewritten in English rather than machine-translated: ${resta}</div></div>`;}
/* ═══ GUIDA: due corpi, una pagina ═══════════════════════════════════
   La Guida è prosa lunga: tradurla a macchina si sente al primo paragrafo.
   Quindi ogni sezione esiste in due versioni e si sceglie per lingua, una
   alla volta: finché l'inglese di una sezione non è scritto, esce quello
   italiano. Nessun buco, nessuna frase mezza tradotta, e la pagina resta
   leggibile in ogni momento del lavoro. */
const GUIDA_SEZIONI=["sistema","pagine","simboli","backup","api"];
const GUIDA_IT={};const GUIDA_EN={};
GUIDA_IT.sistema=()=>`<div class="card guida-sec"><details class="gdet" open><summary><h2>${tr("Come funziona il sistema")}</h2><span class="gdet-arrow">▾</span></summary><div class="gdet-body">
Se leggi una cosa sola, leggi questa: spiega il modello su cui è costruita tutta l'app.

<div class="gsec">${tr("1 · Due numeri, non uno")}</div>
<p class="gp">${tr("Ogni giorno Nuvia tiene separati")} <b>${tr("quello che era previsto")}</b> e <b>${tr("quello che hai davvero mangiato")}</b>.
${trh("Il <b>Piano</b> è un modello fisso: la somma dei pasti previsti per quel giorno. Non cambia mai da solo — se ribilanci, fotografi un piatto o correggi con , cambia la {b1} in Oggi, non il piano.\nIl {b2} è la somma dei pasti spuntati ✓ più gli extra non barrati. I pasti con la ✗ e gli extra con la ✗ non contano.\nDalla distanza fra questi due numeri nasce tutto il resto: riepiloghi, ribilanciamenti, recuperi, analisi dei pattern.",{b1:"<b>giornata</b>",b2:"<b>mangiato</b>"})}</p>

<div class="gsec">${tr("2 · Il fabbisogno")}</div>
<p class="gp">${trh("Il <b>metabolismo basale</b> si calcola su peso, altezza, età e sesso; si moltiplica per l'{b2} (lavoro e vita quotidiana) e si corregge sui {b1}, quelli che fai comunque ogni giorno (riferimento 3.000). Il risultato è il",{b2:"<b>"+tr("attività di base")+"</b>",b1:"<b>passi base</b>"})} <b>fabbisogno</b>.
${trh("Gli allenamenti non sono dentro: si sommano a parte, con la formula {b1}. Quel −1 toglie il metabolismo a riposo, che nel fabbisogno c'è già: senza, ogni allenamento risulterebbe più generoso del reale.",{b1:"<b>"+tr("(MET dello sport × intensità − 1) × peso × ore")+"</b>"})}
<b>${tr("Il deficit")}</b> ${tr("= fabbisogno + sport − mangiato. Se cali di peso il basale scende, quindi aggiornando la pesata cala anche il fabbisogno: il dimagrimento rallenta da solo, ed è normale.")}</p>

<div class="gsec">${tr("2 bis · Il target del piano (e perché non è il fabbisogno)")}</div>
<p class="gp">${trh("Le calorie del piano non coincidono col fabbisogno: sono {b}. Il deficit si fissa in due modi, a scelta in {b2}: come {b4} del fabbisogno (20% significa mangiare l'80% di quello che consumi) oppure partendo dai {b3} desiderati, sapendo che un chilo di grasso vale circa 7.700 kcal. Il tetto è il 30%.",{b:"<b>"+tr("fabbisogno meno il deficit")+"</b>",b2:"<b>Regole</b>",b4:"<b>percentuale</b>",b3:"<b>chili a settimana</b>"})}
<br><br>${trh("Il metabolismo basale {b} è un pavimento: per dimagrire bisogna stare sotto il consumo totale, e quando c'è grasso da consumare è normale — e sostenibile — mangiare anche sotto il basale stimato, perché la differenza la copre il corpo. Il limite vero è un {b1} (l'85% del tuo metabolismo basale, mai sotto 1.200 kcal, modificabile) sotto il quale diventa difficile coprire proteine e micronutrienti. Se il target scende sotto il basale, l'app te lo segnala: è una fase spinta, da tenere per periodi limitati e con proteine alte.",{b:"<b>non</b>",b1:"<b>minimo calorico</b>"})}
<br><br>${trh("Il moltiplicatore di attività resta però una stima, e se le tue giornate sono più ferme di così il fabbisogno risulta gonfiato. Per questo in {b2} ci sono due strumenti: la {b1}, che abbassa di una percentuale il fabbisogno usato per i target, e soprattutto la {b3}, che ricava il fabbisogno reale da quanto hai mangiato e da come è cambiato il peso — una misura, non una stima — e permette di allineare il moltiplicatore con un tocco.",{b2:"<b>"+tr("Regole")+"</b>",b1:"<b>prudenza</b>",b3:"<b>"+tr("verifica sui tuoi dati")+"</b>"})}
<br><br>${trh("Le proteine si calcolano sul {b} (massa magra, peso obiettivo o peso corretto), non su quello attuale: il grasso non richiede proteine, e usare il peso pieno gonfia il numero.",{b:"<b>"+tr("peso di riferimento")+"</b>"})}</p>

<div class="gsec">${tr("3 · Ribilanciare la giornata")}</div>
<p class="gp"> ${trh("<b>Ribilancia le calorie residue</b> ragiona a {b1}: pianificato del giorno meno quello già mangiato. Se i pasti che restano stanno dentro il budget non tocca nulla e te lo dice.\nSe invece eccedono, riscrive i pasti <b>ancora da consumare</b>: prima abbassa le grammature, poi — solo se il piatto diventa poco saziante — sostituisce un ingrediente con uno più leggero. Le proteine non si riducono mai, nessun pasto scende sotto il minimo impostato, e le proposte che abbassano solo i numeri lasciando il piatto identico vengono scartate prima di arrivarti sotto gli occhi.",{b1:"<b>budget</b>"})}</p>

<div class="gsec">${tr("4 · Recuperare i giorni passati")}</div>
<p class="gp">${trh("Il menu {b} (riga Evento, solo su oggi) mostra le calorie ancora da recuperare degli ultimi 5 giorni. Tre regole di sicurezza:sotto la <b>soglia di tolleranza</b> lo sforo non viene nemmeno proposto (è dentro l'errore di stima delle porzioni);\nin un giorno si taglia al massimo il {b1} impostato, in percentuale o in kcal;\nnessun pasto scende sotto il {b2}. Se lo sforo è grande il resto resta in coda per i giorni dopo. Una festa non si paga con un giorno di digiuno.",{b:"<b>Recupero</b>",b1:"<b>tetto</b>",b2:"<b>minimo</b>"})}</p>

<div class="gsec">${tr("5 · La settimana")}</div>
<p class="gp">${trh("La settimana {b} va da lunedì a domenica (la spesa e la ricalibratura, invece, partono dal giorno in cui le fai). Alla fine viene {b2} con quello che c'è: nessun bottone da premere, e resta sempre modificabile da Storico → Settimane passate → Modifica.\nLe medie si calcolano sui giorni tracciati. I giorni con un {b3} (Natale, trasferta, giornata no) restano registrati ma escono dalle medie e non spezzano la serie .",{b:"<b>archiviata</b>",b2:"<b>archiviata da sola</b>",b3:"<b>evento</b>"})}</p>

<div class="gsec">${tr("6 · Cosa sa l'AI di te")}</div>
<p class="gp">${trh("Ogni richiesta all'AI porta con sé le {b} attive e le tue {b2}: tipo di dieta, intolleranze, cibi da evitare, preferenze, tempo per cucinare, pasti liberi, condizioni da tenere presenti.\nLe trovi tutte nella sezione {b3}, dove sono modificabili — e con «Cosa sa di te l'AI» puoi leggere il testo esatto che viene allegato. L'AI propone sempre: la spunta e la conferma restano tue.",{b:"<b>regole numeriche</b>",b2:"<b>caratteristiche alimentari</b>",b3:"<b> Regole</b>"})}</p>

<div class="gsec">${tr("7 · I tuoi dati")}</div>
<p class="gp">${trh("Tutto vive sul telefono, senza account e senza server di Nuvia. Il backup su Drive è facoltativo e finisce sul {b} account Google; la chiave AI resta su questo dispositivo. {b2}: né ai dati, né al Drive, né alla chiave — non esiste un posto dove potrebbero arrivare.\nDa",{b:"<b>tuo</b>",b2:"<b>"+tr("Lo sviluppatore non ha accesso a nulla")+"</b>"})} <b>${trh("Storico → Esporta i dati</b> scarichi qualsiasi periodo come tabella: una riga per giorno con pianificato, mangiato, macro completi, sport, sonno, relax, umore, acqua, evento, periodo di dieta, ribilanciamenti e recuperi. In CSV per il foglio di calcolo, oppure lasci che sia Nuvia a cercarci i {b2}. Il backup completo dell'app, quello che serve per rimettere tutto su un altro telefono, si scarica invece da {b}.",{b2:"<b>pattern</b>",b:"<b>Io → Backup</b>"})}</p>
</div></details></div>`;
GUIDA_IT.pagine=()=>`<div class="card guida-sec"><details class="gdet"><summary><h2>${tr("Le pagine")}</h2><span class="gdet-arrow">▾</span></summary><div class="gdet-body"><table class="gtable">
<tr><td colspan="2"><b>Oggi</b> ${trh("— bilancio del giorno (anello con il {b1} in grande e {b2} = le kcal previste dal piano per quel giorno), acqua, sonno/relax/umore, pasti ed extra da spuntare. Le frecce ‹ › in alto cambiano giorno.",{b1:"<b>deficit</b>",b2:"<b>Pianificato</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Piano")}</b> ${tr("— tutta la settimana con i sei comandi: gestisci · alternativa stagionale · ripeti il percorso guidato · genera nuovo piano · importa da foto · stima risultati; più opzioni, orari e alternative per ogni pasto.")}</td></tr>
<tr><td colspan="2">${trh("<b>Spesa</b> — lista che si costruisce e si aggiorna da sola dal piano, ricerca sul sito del tuo supermercato, invio WhatsApp. L'icona AI su un prodotto propone {b1}: quella che scegli sostituisce il prodotto in lista e, se vuoi, <b>riscrive i pasti del piano</b> che lo usavano. Dallo {b3} arrivano prodotti, quantità e {b2}: da lì Nuvia calcola quanto è costata la spesa, quanto costa in media un pasto e dove vanno i soldi.",{b1:"<b>tre alternative da scegliere</b>",b3:"<b>scontrino</b>",b2:"<b>prezzi</b>"})}</td></tr>
<tr><td colspan="2"><b>Sport</b> ${tr("— registra allenamenti (le kcal si calcolano sul tuo peso); nuovi sport con stima MET.")}</td></tr>
<tr><td colspan="2">${trh("<b>Storico</b> — riepilogo settimanale ed esteso, mesi e settimane passate, <b>pesate e biometriche</b> in tabella (data, kg, Δ, %MG, %MM, pressione, SpO₂) con grafico dell'andamento, analisi ed esportazione, {b3} (medie settimanali o mensili di tutta la storia, in un riquadro scorrevole), {b} e {b2} sempre modificabili, grafici, report AI, stampa PDF.",{b3:"<b>Riepilogo esteso</b>",b:"<b>Mesi passati</b>",b2:"<b>Settimane passate</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Codice piano")}</b> ${trh("(in Regole → Il piano): carica un piano già pronto. {b} è la dieta standard con cui è nata Nuvia — mediterranea, cinque pasti, mensa il martedì e il giovedì.",{b:"<b>00000000</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Regole")}</b> ${trh("— la configurazione, divisa in {b2}: {b3} (quello che hai inserito nel percorso guidato: obiettivo, caratteristiche alimentari, protocolli — si modifica qui e vale ovunque), {b} (come deve ragionare l'AI, «Cosa sa di te l'AI» con il testo esatto che parte a ogni richiesta, linee guida OMS), {b1}: fabbisogno, formula degli allenamenti, soglie di ribilanciamento e recupero, obiettivo proteine, caratteristiche alimentari e gestione del piano.",{b2:"<b>tre schede</b>",b3:"<b>"+tr("Le tue scelte")+"</b>",b:"<b>Regole AI</b>",b1:"<b>Formule e calcoli</b>"})}</td></tr>
<tr><td colspan="2"><b>Io</b> ${trh("— solo il tuo corpo e i tuoi obiettivi: {b2}, {b3} (ogni salvataggio aggiunge una riga allo storico), {b},",{b2:"<b>Anagrafica</b>",b3:"<b>Nuova pesata</b>",b:"<b>Obiettivi</b>"})} <b>${tr("Attività di base")}</b>, promemoria, vacanza e percorso guidato.</td></tr>
<tr><td colspan="2"><b>Sistema</b> ${tr("— tutto il tecnico in un posto solo: livello di dettaglio dell'interfaccia, chiave AI (Gemini), Google Drive, backup locale, ripristino di emergenza, pulizia selettiva, dati d'uso anonimi e segnalazioni.")}</td></tr>
<tr><td colspan="2"><b>Percorso guidato</b> ${tr("(in Piano) — lo stesso percorso guidato, con tutti i campi già compilati (dati, intolleranze, gusti, obiettivi) da cui l'AI genera una settimana su misura, modificabile prima della conferma. «Modifica il piano» per ritocchi a mano. Sempre da validare con un nutrizionista.")}</td></tr></table></div></details></div>`;
GUIDA_IT.simboli=()=>`<div class="card guida-sec"><details class="gdet"><summary><h2>${tr("I simboli")}</h2><span class="gdet-arrow">▾</span></summary><div class="gdet-body">
<div class="gsec">${tr("Sui pasti")}</div><table class="gtable">
<tr><td>○ ✓ ✗</td><td>${trh("Tocca il cerchio per ciclare: {b}. Solo i ✓ contano nel bilancio; i ✗ restano segnati come saltati.",{b:"<b>da fare → mangiato → saltato</b>"})}</td></tr>
<tr><td>→</td><td>${trh("I due menu spostano il pasto in un altro {b} e/o {b2} (anche pranzo↔cena dello stesso giorno). Il badge rosso ricorda da dove viene.",{b:"<b>giorno</b>",b2:"<b>fascia</b>"})}</td></tr>
<tr><td>${ic("pencil",18)}</td><td><b>${tr("Modifica ingredienti")}</b> ${tr("(la matita): cambi il testo e l'AI ristima kcal e macro. Funziona anche sui pasti già ribilanciati o modificati, e <b>premendo OK senza cambiare nulla</b> rifà comunque la stima.")}</td></tr>
<tr><td>${ic("dice",18)}</td><td><b>Alternativa</b> ${tr("(il dado): l'AI inventa un piatto diverso con gli stessi macro; puoi renderla fissa o solo per questa settimana.")}</td></tr>
<tr><td>${ic("swap",18)}</td><td><b>${trh("Non ho un ingrediente</b>: si apre un pannello con 3 proposte {b} (tocca per selezionare, poi OK).",{b:"<b>cliccabili</b>"})}" Altre proposte" ne genera di nuove; " Scatta foto del cibo che hai in casa" (anche più foto) e poi " Proponi dalla foto" ti fa suggerire il sostituto migliore tra ciò che possiedi.</td></tr>
<tr><td>${ic("star",18)}</td><td><b>${tr("I miei piatti")}</b>: quando un piatto AI ti piace, salvalo con ⭐; lo ritrovi nel bottone "⭐ I miei piatti" (dentro Crea un piatto) e lo riusi con un tap, senza consumare AI.</td></tr>
<tr><td colspan="2">${trh("<b>Allenamenti</b>: kcal = (MET dello sport × intensità − 1) × {b1} × ore. Il −1 toglie il metabolismo a riposo, già incluso nel fabbisogno: senza quella sottrazione ogni sessione risulterebbe più generosa del reale.",{b1:"<b>peso corporeo</b>"})}</td></tr>
<tr><td colspan="2">${trh("<b>Passi</b>: nel fabbisogno sono già inclusi i tuoi {b2} (3.000 di riferimento, modificabili in Io). Nei giorni in cui cammini molto più del solito li scrivi in {b}: l'app <b>sottrae i 3.000 già conteggiati</b> e aggiunge al bilancio solo la differenza, così non si contano due volte. Le camminate vere e proprie si registrano come sport, con durata e intensità.",{b2:"<b>passi base</b>",b:"<b>Allenamento → Passi</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Obiettivo peso")}</b> ${tr("(in Io): imposta il traguardo e vedi la linea nel grafico + la data stimata di arrivo al ritmo attuale.")}</td></tr>
<tr><td>${ic("undo",18)}</td><td>${tr("Ripristina il pasto originale dopo una modifica, un'alternativa o un ribilanciamento.")}</td></tr>
<tr><td colspan="2">${trh("<b>Analisi</b> (dentro ogni pasto): con {v8} scatti sul momento, con {v9} scegli una foto già nella galleria (comoda se l'hai scattata prima o se non hai rete) e l'AI stima <b>il peso in grammi di ogni elemento</b> oltre a kcal e macro; la descrizione salvata contiene i pesi, così li correggi con  e la ristima usa esattamente i tuoi numeri. Al ristorante puoi fotografare {b2} (primo, secondo, dolce): ti chiede se {b} al pasto o sostituirlo. La spunta ✓ resta sempre tua.",{v8:ic("camera",15),v9:ic("gallery",15),b2:"<b>"+tr("una portata alla volta")+"</b>",b:"<b>aggiungere</b>"})}</td></tr>
<tr><td colspan="2">${trh("Appare sui pasti spostati: riporta {b1} i pasti dello scambio al loro giorno di origine, anche quello che da qui non vedi (e anche se è già spuntato). Lo scambio infatti è",{b1:"<b>entrambi</b>"})} <b>automatico e bidirezionale</b>.</td></tr>
<tr><td colspan="2"><b>${tr("Il piano non si muove")}</b>: ribilanciamenti, foto e correzioni cambiano solo la giornata in Oggi. Il pianificato del giorno resta quello del piano, così il confronto "previsto vs mangiato" ha sempre senso.</td></tr>
<tr><td colspan="2"><b>${trh("Ribilancia le calorie residue</b>: rimette in riga la giornata agendo {b2}; se sei già in linea non tocca nulla. Quando taglia usa {b}: prima abbassa le {b3}, poi — solo se il piatto diventa poco saziante — sostituisce ingredienti con alternative più leggere e voluminose. Mai numeri ritoccati a piatto invariato (scartati in automatico), mai pasti eliminati.",{b2:"<b>"+tr("solo sui pasti non ancora spuntati")+"</b>",b:"<b>valori reali</b>",b3:"<b>grammature</b>"})}</td></tr>
</table>
<div class="gsec">${tr("Colori dei pasti")}</div><table class="gtable">
<tr><td colspan="2">${tr("Verde = pasto normale del piano.")}</td></tr>
<tr><td colspan="2">${trh("Arancione = pasto {b1} (sushi, pizza, aperitivo, cornetto): non obbligatorio, c'è sempre l'opzione normale.",{b1:"<b>libero</b>"})}</td></tr>
<tr><td colspan="2">${trh("Blu = {b1}, nei giorni e nel pasto che hai impostato tu: segui la regola scritta nella riga.",{b1:"<b>mensa</b>"})}</td></tr></table>
<div class="gsec">Altri</div><table class="gtable">
<tr><td colspan="2">${trh("<b>Selezionatore di menù</b>: scatti <b>più foto</b> del menù (anche pagine diverse), poi premi {b} e l'AI sceglie il piatto più compatibile con quello che dovresti mangiare adesso, più due riserve. In alternativa incolli il testo e usi",{b:"<b>Cerca</b>"})}"Usa il testo".</td></tr>
<tr><td colspan="2"><b>${trh("Crea un piatto con quello che hai</b>: fotografi frigo, congelatore e dispensa (più foto), poi {b}; il piatto è tarato sul pasto di questo momento e compensa le calorie già accumulate.",{b:"<b>Crea</b>"})}"⭐ I miei piatti" riusa i piatti salvati senza consumare AI.</td></tr>
<tr><td colspan="2"><b>${tr("Esporta i dati")}</b> ${trh("(in Storico): scegli il periodo e scarichi una riga per giorno con tutto — pianificato e mangiato, macro completi, zuccheri, sport, sonno, relax, umore, acqua, evento, periodo di dieta, ribilanciamenti, recuperi, pasti spuntati e saltati. CSV per Excel o Fogli Google, oppure {b1} per farlo leggere all'AI di Nuvia.",{b1:"<b>"+tr("Analizza i pattern")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Regole del sistema")}</b> ${tr("(sezione Regole): tutti i numeri che governano l'app — formula del fabbisogno, calcolo degli allenamenti, minimo per pasto, soglie di recupero, obiettivo proteine — visibili e modificabili, più un campo di regole libere che viene allegato a ogni richiesta all'AI.")}</td></tr>
<tr><td colspan="2"><b>Caratteristiche alimentari</b> ${tr("(sezione Regole): impostazione di riferimento (mediterranea, low carb, digiuno intermittente, vegetariana…), pasti al giorno e quali salti, pasti liberi, pasti fuori casa e mensa, tempo per cucinare, budget, intolleranze, vincoli religiosi, condizioni da tenere presenti. Da qui l'AI può anche")} <b>${tr("generare un piano completo")}</b>.</td></tr>
<tr><td>${ic(seasonNow(),18)}</td><td>${tr("<b>Opzioni stagionali</b>: tra le opzioni dei pasti principali, l'etichetta")}${ic("primavera",14)} Primaverile · ${ic("estate",14)} Estivo · ${ic("autunno",14)} Autunnale · ${ic("inverno",14)} ${tr("Invernale indica l'alternativa di stagione creata con «Alternativa stagionale» nel Piano. Il piano base resta intatto; rigenerando, le stagioni vecchie vengono sostituite.")}</td></tr>
<tr><td colspan="2"><b>Stima risultati</b> ${trh("(nel Piano): bilancio del piano → kg a settimana e data stimata dell'obiettivo; se l'obiettivo non sembra raggiungibile, ti propone di {b} automaticamente (con spesa e stima rigenerate) o di mantenere tutto com'è.",{b:"<b>"+tr("ritarare le grammature")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>Zuccheri</b> ${tr("(g): accanto a P/C/G/F. Arrivano dal barcode (Open Food Facts) o dall'AI; se mancano sono stimati dalla descrizione.")}</td></tr>
<tr><td>${ic("plus",18)}</td><td>${trh("<b>Extra</b>: crea una card {b} da compilare — a mano, con la foto o con il barcode. Gli extra si spuntano come i pasti (✓ mangiato / ✗ non mangiato) e, una volta spuntati, sbiadiscono e vengono barrati esattamente come gli altri. Il cestino elimina davvero, con conferma.",{b:"<b>vuota</b>"})}</td></tr>
<tr><td colspan="2"><b>Recupero</b> ${trh("(riga Evento, solo su oggi): la tendina mostra le calorie {b} degli ultimi 5 giorni — un giorno solo o",{b:"<b>ancora da recuperare</b>"})} "Tutti". Tre regole di sicurezza: gli sfori <b>${tr("sotto la soglia")}</b> ${trh("(10% del giorno, minimo 150 kcal — regolabile in Io) non vengono nemmeno proposti; in un giorno si taglia al massimo il {b1}; <b>nessun pasto scende sotto ~250 kcal</b>. Se lo sforo è grande, il resto resta in coda e lo recuperi nei giorni seguenti — mai un giorno di digiuno.",{b1:"<b>"+tr("25% del pianificato")+"</b>"})}</td></tr>
<tr><td colspan="2">${trh("<b>Evento</b> del giorno (Natale, compleanno, festa, cena fuori, lavoro/trasferta, giornata no, malattia…): il giorno resta tracciato ma {b1} e non spezza la serie .",{b1:"<b>escluso dalle medie</b>"})}</td></tr>
<tr><td colspan="2">${tr("Barcode (dentro ogni pasto): scansiona PIÙ prodotti, correggi i grammi e conferma la somma — da Open Food Facts, senza consumare AI.")}</td></tr>
<tr><td colspan="2"><b>${tr("La serie, in parole semplici")}</b>: conta i giorni "buoni" di fila. Ogni mattina l'app guarda com'è andata IERI e si fa 3 domande: hai spuntato i pasti? sei rimasto dentro le calorie? gli extra erano al massimo 300 kcal? <b>${tr("Tre sì = fiamma +1. Anche un solo no = si riparte da 0.")}</b> ${tr("Fa tutto da sola, non devi premere nulla; in Progressi vacanza si mette in pausa.")}</td></tr>
<tr><td colspan="2">${trh("Acqua: l'obiettivo è l'acqua {b}, non il fabbisogno totale. Si parte da 35 ml per kg (32 se il BMI supera 25, 28 se supera 30: il tessuto adiposo contiene molta meno acqua del muscolo), poi si <b>sottrae il ~22% che arriva già dal cibo</b> — frutta, verdura, minestre, latte. Il risultato è in bicchieri da 200 ml, {b9} nei giorni con allenamento intenso o oltre 45 minuti. Puoi sempre scrivere il tuo valore in Io → Obiettivi.",{b:"<b>da bere</b>",b9:"<b>+2</b>"})}</td></tr>
<tr><td>${ic("star",18)}</td><td>${tr("Sonno · Relax · Come ti senti: scala 1 basso → 5 alto. Alimentano le correlazioni AI di fine settimana.")}</td></tr>
<tr><td colspan="2">${tr("Vacanza (in Io): congela deficit e ; l'app resta un diario senza giudizio.")}</td></tr>
<tr><td colspan="2">Promemoria del mattino: "Ieri hai segnato tutti i Pasti, l'Acqua e lo Sport?" — appare se qualcosa manca e resta in alto finché non premi <b>Fatto</b> ${tr("(o apri ieri e sistemi).")}</td></tr>
<tr><td colspan="2">${trh("Il bottone del tema cicla tra chiaro → scuro → {b} (segue le impostazioni del telefono).",{b:"<b>automatico</b>"})}</td></tr>
<tr><td colspan="2">${trh("Sulla pagina Oggi puoi {b} (swipe sinistra/destra) per cambiare giorno, oltre alle frecce ‹ ›.",{b:"<b>scorrere col dito</b>"})}</td></tr>
<tr><td colspan="2">${trh("Fine settimana: l'archiviazione è {b} con quello che c'è, senza bottoni da premere. Le settimane chiuse restano {b2} da Storico → Settimane passate → Modifica.",{b:"<b>automatica</b>",b2:"<b>"+tr("sempre modificabili")+"</b>"})}</td></tr>
<tr><td colspan="2"><b>${tr("Link di ricerca della spesa")}</b> ${tr("(in cima a Spesa): quasi tutti i supermercati online richiedono prima la scelta del negozio, quindi non c'è un link universale. Fai una ricerca sul sito del TUO negozio, copia l'indirizzo e incollalo sostituendo la parola cercata con")} <b>{q}${tr("</b>: da lì ogni link ↗ della lista cerca direttamente nel tuo supermercato.")}</td></tr>
<tr><td colspan="2"><b>${tr("Prodotti in lista")}</b> ${tr("(in Spesa): arrivano tutti dal piano, compresi gli ingredienti dei pasti che modifichi o aggiungi tu — la lista si riallinea da sola. Per una cosa fuori piano usa il ＋ accanto alla categoria.")}</td></tr>
</table></div></details></div>`;
GUIDA_IT.backup=()=>`<div class="card guida-sec"><details class="gdet"><summary><h2>Backup & aggiornamenti</h2><span class="gdet-arrow">▾</span></summary><div class="gdet-body">
<div class="hint">${hint2(tr("I dati stanno nel browser di questo dispositivo."),tr("Per questo <b>aggiornare l'app non li tocca</b>: quando pubblichi una nuova versione su Git, riapri e ritrovi tutto (la versione in uso è scritta in Io)."))}<br><br>
<b>Drive</b> ${trh("(Io → Sincronizzazione): dopo {b9} telefono e PC condividono gli stessi dati automaticamente (l'app carica e scarica da sola). {b2} = stacca solo questo dispositivo · {b} = elimina il backup remoto. I dati vivono in una cartella privata riservata a quest'app (non tra i tuoi file visibili di Drive): è una scelta di sicurezza, così nessun'altra app o cartella tua può leggerli o mescolarsi.",{b9:'<b>"Connetti e sincronizza"</b>',b2:"<b>Disconnetti e desincronizza</b>",b:"<b>Elimina backup</b>"})}<br><br>
${tr("<b>In locale</b>: Esporta/Importa = file .json sul dispositivo · Cancella = azzera tutto e ricomincia.")}<br><br>
<b>${tr("Se cambi indirizzo del sito</b>: i dati non seguono da soli — Esporta su Drive dal vecchio, Importa dal nuovo.")}</div></div></details></div>`;
GUIDA_IT.api=()=>`<div class="card guida-sec"><details class="gdet"><summary><h2>Configurazione API: Google Drive e Gemini</h2><span class="gdet-arrow">▾</span></summary><div class="gdet-body">
<div class="gsec">Parte 1 — Google Drive</div>
<details class="istr"><summary>${tr("Come si crea la chiave, passo per passo")}</summary><div class="hint" style="margin-top:8px">
<b>A) Progetto e API</b><br>
1. Vai su <b>console.cloud.google.com</b><br>
2. Crea un progetto (in alto a sinistra → "Nuovo progetto") o apri quello dell'app<br>
3. Menu  → "API e servizi" → "Libreria"<br>
4. Cerca <b>"Google Drive API"</b> → Abilita<br><br>
<b>${tr("B) Consenso OAuth e utente di test")}</b><br>
Finché l'app è in "Testing", Google blocca le email non autorizzate:<br>
1. Menu  → "API e servizi" → "Schermata di consenso OAuth"<br>
2. Tipo <b>"Esterno"</b> ${tr("→ compila Nome App e la tua Email")}<br>
3. Scorri fino a "Utenti di test" → <b>"+ ADD USERS"</b><br>
${trh("4. Digita la {b1} email Google (quella con cui userai l'app)",{b1:"<b>tua</b>"})}<br>
5. <b>Fondamentale:</b> ${tr("clicca SALVA per confermare")}<br><br>
<b>C) Credenziali</b><br>
1. Menu  → "API e servizi" → "Credenziali"<br>
2. "Crea credenziali" → <b>"ID client OAuth"</b><br>
${tr("3. Tipo di applicazione:")} <b>"App web"</b><br>
4. In "Origini JavaScript autorizzate" incolla <b>${tr("solo il dominio")}</b> ${tr("del tuo sito (es.")} <code>https://tuonome.github.io</code>) — niente percorsi, niente slash finale<br>
${tr("5. Salva: ottieni un")} <b>Client ID</b> (es. <code>123456-abc.apps.googleusercontent.com</code>). Copialo<br><br>
<b>D) Collegare l'app</b><br>
1. Vai su <b>Io → Sincronizzazione Google Drive</b><br>
${trh("2. Incolla il Client ID nel campo {b1} (non serve nessun'altra chiave)",{b1:"<b>CLIENT_ID</b>"})}<br>
3. "Connetti e sincronizza" → autorizzi col tuo account (ora sbloccato)
</div>
<div class="gsec">Parte 2 — Google Gemini</div>
<details class="istr"><summary>${tr("Come si prende la chiave")}</summary><div class="hint">
1. Vai su <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" class="lnk">aistudio.google.com/app/apikey ↗</a><br>
2. Clicca "Crea chiave"<br>
${tr("3. Scegli o crea un progetto")}<br>
${tr("4. Copia la chiave e incollala in")} <b>⋯ → Sistema → Motore AI (Gemini)</b>
</div></details>
<div class="hint" style="margin-top:8px;color:var(--rosso)"> ${tr("Non condividere né pubblicare mai queste chiavi (Client ID incluso è meglio tenerlo privato); se il repository è pubblico, evita di scrivere email o chiavi reali nei commit.")}</div></details></div></details></div>

<div class="card"><div class="hint"> ${trh("Le stime di calorie, proteine e consumi sono {b}: l'app è un diario, non un medico. Il piano va validato col tuo professionista.",{b:"<b>indicative</b>"})}</div>
</div>`;
GUIDA_EN.backup=()=>`<div class="card guida-sec"><details class="gdet"><summary><h2>Backup &amp; updates</h2><span class="gdet-arrow">▾</span></summary><div class="gdet-body">
<div class="hint"><b>Where your data lives:</b> in this device's browser — not inside the file. That's why <b>updating the app doesn't touch it</b>: when a new version goes up on Git, you reopen it and everything is still there (the version you're running is written in Profile).<br><br>
<b>Drive</b> (Profile → Sync): once you've tapped <b>"Connect and sync"</b>, phone and computer share the same data automatically — the app uploads and downloads on its own. <b>Disconnect and unsync</b> detaches this device only · <b>Delete backup</b> removes the remote copy. The data lives in a private folder reserved for this app, not among your visible Drive files: that's a safety choice, so no other app or folder of yours can read it or get tangled up with it.<br><br>
<b>On the device</b>: Export/Import = a .json file you keep · Erase = wipes everything and starts over.<br><br>
<b>If the site address changes</b>: your data doesn't follow by itself — export to Drive from the old address, import from the new one.</div></div></details></div>`;

GUIDA_EN.api=()=>`<div class="card guida-sec"><details class="gdet"><summary><h2>API setup: Google Drive and Gemini</h2><span class="gdet-arrow">▾</span></summary><div class="gdet-body">
<div class="gsec">Part 1 — Google Drive</div>
<div class="hint">
<b>A) Project and API</b><br>
1. Go to <b>console.cloud.google.com</b><br>
2. Create a project (top left → "New project") or open the app's existing one<br>
3. Menu → "APIs &amp; Services" → "Library"<br>
4. Search for <b>"Google Drive API"</b> → Enable<br><br>
<b>B) OAuth consent screen and test user</b><br>
While the app is in "Testing", Google blocks any email that isn't authorised:<br>
1. Menu → "APIs &amp; Services" → "OAuth consent screen"<br>
2. User type <b>"External"</b> → fill in the app name and your email<br>
3. Scroll down to "Test users" → <b>"+ ADD USERS"</b><br>
4. Enter <b>your own</b> Google address — the one you'll use the app with<br>
5. <b>This part matters:</b> press SAVE to confirm<br><br>
<b>C) Credentials</b><br>
1. Menu → "APIs &amp; Services" → "Credentials"<br>
2. "Create credentials" → <b>"OAuth client ID"</b><br>
3. Application type: <b>"Web application"</b><br>
4. Under "Authorised JavaScript origins" paste <b>the domain only</b> of your site (e.g. <code>https://yourname.github.io</code>) — no paths, no trailing slash<br>
5. Save, and you get a <b>Client ID</b> (something like <code>123456-abc.apps.googleusercontent.com</code>). Copy it<br><br>
<b>D) Connecting the app</b><br>
1. Go to <b>Profile → Google Drive sync</b><br>
2. Paste the Client ID into the <b>CLIENT_ID</b> field — no other key is needed<br>
3. "Connect and sync" → authorise with your account, now unblocked
</div>
<div class="gsec">Part 2 — Google Gemini</div>
<details class="istr"><summary>${tr("Come si prende la chiave")}</summary><div class="hint">
1. Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" class="lnk">aistudio.google.com/app/apikey ↗</a><br>
2. Press "Create key"<br>
3. Pick or create a project<br>
4. Copy the key and paste it under <b>⋯ → System → AI engine (Gemini)</b>
</div></details>
<div class="hint" style="margin-top:8px;color:var(--rosso)"> Never share or publish these keys — the Client ID included is better kept private. If your repository is public, keep real emails and keys out of your commits.</div></div></details></div>

<div class="card"><div class="hint"> Calorie, protein and energy figures are <b>indicative</b>: this is a diary, not a doctor. Have your plan validated by your own professional.</div>
</div>`;

GUIDA_EN.sistema=()=>`<div class="card guida-sec"><details class="gdet" open><summary><h2>How the system works</h2><span class="gdet-arrow">▾</span></summary><div class="gdet-body">
<div class="hint">If you read one thing only, read this: it explains the model the whole app is built on.</div>

<div class="gsec">1 · Two numbers, not one</div>
<p class="gp">Every day Nuvia keeps <b>what was planned</b> and <b>what you actually ate</b> apart.
The <b>Plan</b> is a fixed model: the sum of the meals planned for that day. It never changes on its own — if you rebalance, photograph a dish or correct something with , what changes is the <b>day</b> in Today, not the plan.\nWhat you <b>ate</b> is the sum of the meals you ticked ✓ plus any extras you haven't crossed out. Meals marked ✗ and extras marked ✗ don't count.
Everything else grows out of the distance between those two numbers: summaries, rebalancing, catch-ups, pattern analysis.</p>

<div class="gsec">2 · Your energy needs</div>
<p class="gp">Your <b>basal metabolic rate</b> is calculated from weight, height, age and sex; it's multiplied by your <b>baseline activity</b> (work and daily life) and corrected against your <b>baseline steps</b>, the ones you take anyway every day (3,000 as the reference point). The result is your <b>energy needs</b>.
Workouts aren't inside that figure: they're added separately, using <b>(sport MET × intensity − 1) × weight × hours</b>. That −1 removes the resting metabolism, which your needs already include; without it every workout would look more generous than it really is.
<b>The deficit</b> = needs + sport − eaten. As you lose weight your basal rate falls, so updating your weigh-in lowers your needs too: weight loss slows down by itself, and that's normal.</p>

<div class="gsec">2b · The plan's target (and why it isn't your needs)</div>
<p class="gp">The plan's calories don't match your needs: they are <b>your needs minus the deficit</b>. The deficit is set in one of two ways, your choice, under <b>Rules</b>: as a <b>percentage</b> of your needs (20% means eating 80% of what you burn), or starting from the <b>kilos per week</b> you want, knowing that a kilo of fat is worth roughly 7,700 kcal. The ceiling is 30%.
<br><br>Your basal metabolic rate is <b>not</b> a floor: to lose weight you have to stay below your total burn, and when there's fat to draw on it's normal — and sustainable — to eat below your estimated basal rate too, because your body covers the difference. The real limit is a <b>calorie minimum</b> (85% of your basal rate, never below 1,200 kcal, adjustable) under which it becomes hard to cover protein and micronutrients. If your target drops below your basal rate the app tells you: that's an aggressive phase, to be kept short and with protein high.
<br><br>The activity multiplier is still an estimate, though, and if your days are more sedentary than that, your needs come out inflated. That's why <b>Rules</b> holds two tools: <b>caution</b>, which shaves a percentage off the needs used for your targets, and above all the <b>check against your own data</b>, which works out your real needs from how much you've eaten and how your weight has moved — a measurement, not an estimate — and lets you align the multiplier in one tap.
<br><br>Protein is calculated on your <b>reference weight</b> (lean mass, target weight or adjusted weight), not on your current one: fat doesn't ask for protein, and using your full weight inflates the number.</p>

<div class="gsec">3 · Rebalancing the day</div>
<p class="gp"> <b>Rebalance the remaining calories</b> thinks in terms of a <b>budget</b>: the day's planned total minus what you've already eaten. If the meals still to come fit inside that budget it changes nothing, and tells you so.\nIf they don't, it rewrites the meals <b>still to be eaten</b>: first it lowers the amounts, then — only if the dish stops being filling — it swaps an ingredient for a lighter one. Protein is never cut, no meal drops below the minimum you've set, and any suggestion that just lowers the numbers while leaving the dish identical is thrown out before it ever reaches your eyes.</p>

<div class="gsec">4 · Catching up on past days</div>
<p class="gp">The <b>Catch-up</b> menu (the Event row, on today only) shows the calories still outstanding from the last 5 days. Three safety rules:
below the <b>tolerance threshold</b> an overshoot isn't even offered, because it sits inside the margin of error of estimating portions;\nin any one day you can cut at most the <b>ceiling</b> you've set, as a percentage or in kcal;\nno meal drops below its <b>minimum</b>. If the overshoot is large, the rest stays queued for the days after. A celebration isn't paid for with a day of fasting.</p>

<div class="gsec">5 · The week</div>
<p class="gp">The week that gets <b>archived</b> runs Monday to Sunday (shopping and recalibration, by contrast, start from the day you do them). At the end it's <b>archived on its own</b> with whatever is there: no button to press, and it stays editable from History → Past weeks → Edit.
Averages are calculated on tracked days only. Days carrying an <b>event</b> (Christmas, a work trip, a bad day) stay on record but drop out of the averages, and they don't break your streak .</p>

<div class="gsec">6 · What the AI knows about you</div>
<p class="gp">Every request to the AI carries your active <b>numeric rules</b> and your <b>dietary details</b>: type of diet, intolerances, foods to avoid, preferences, time to cook, free meals, conditions to keep in mind.\nYou'll find them all under <b> Rules</b>, where they can be changed — and with "What the AI knows about you" you can read the exact text that gets attached. The AI always proposes: the tick and the confirmation stay yours.</p>

<div class="gsec">7 · Your data</div>
<p class="gp">Everything lives on your phone, with no account and no Nuvia server. The Drive backup is optional and lands in <b>your own</b> Google account; the AI key stays on this device. <b>The developer has access to nothing</b>: not your data, not your Drive, not your key — there's no place they could arrive at.
From <b>History → Export data</b> you can download any period as a table: one row per day with planned, eaten, full macros, sport, sleep, relaxation, mood, water, event, diet phase, rebalancing and catch-ups. As CSV for your spreadsheet, or you can let Nuvia hunt for the <b>patterns</b> in it. The app's full backup — the one you need to put everything on another phone — is downloaded from <b>Profile → Backup</b> instead.</p>
</div></details></div>`;

GUIDA_EN.pagine=()=>`<div class="card guida-sec"><details class="gdet"><summary><h2>The pages</h2><span class="gdet-arrow">▾</span></summary><div class="gdet-body"><table class="gtable">
<tr><td colspan="2"><b>Today</b> — the day's balance: a ring with the <b>deficit</b> in large type and <b>Planned</b> (the kcal your plan sets for that day), water, sleep/relaxation/mood, meals and extras to tick off. The ‹ › arrows at the top move between days.</td></tr>
<tr><td colspan="2"><b>Plan</b> — the whole week with its six commands: manage · seasonal alternative · repeat the guided setup · generate a new plan · import from photos · estimate results; plus options, times and alternatives for every meal.</td></tr>
<tr><td colspan="2"><b>Shopping</b> — a list that builds and updates itself from your plan, searches your supermarket's own site, and sends by WhatsApp. The AI icon on a product offers <b>three alternatives to choose from</b>: the one you pick replaces the product on the list and, if you want, <b>rewrites the meals in your plan</b> that used it. From your <b>receipt</b> come products, quantities and <b>prices</b>: from there Nuvia works out what the shop cost, what an average meal costs, and where the money goes.</td></tr>
<tr><td colspan="2"><b>Training</b> — log workouts (calories are worked out on your own weight); add new sports with a MET estimate.</td></tr>
<tr><td colspan="2"><b>History</b> — weekly and extended summaries, past months and weeks, <b>weigh-ins and body measurements</b> in a table (date, kg, Δ, body fat %, muscle %, blood pressure, SpO₂) with a trend chart, analysis and export, an <b>extended summary</b> (weekly or monthly averages across your whole history, in a scrollable panel), <b>Past months</b> and <b>Past weeks</b> that stay editable, charts, AI reports and PDF printing.</td></tr>
<tr><td colspan="2"><b>Plan code</b> (under Rules → The plan, or in the last step of the welcome) — loads a ready-made plan. <b>00000000</b> is the standard diet Nuvia was born with: Mediterranean, five meals, canteen on Tuesdays and Thursdays.</td></tr>
<tr><td colspan="2"><b>Rules</b> — the configuration, in <b>three tabs</b>: <b>Your choices</b> (what you entered during the guided setup: goal, dietary details, protocols — you change it here and it counts everywhere), <b>AI rules</b> (how the AI should reason, "What the AI knows about you" with the exact text sent with every request, WHO guidelines), and <b>Formulas and calculations</b>: energy needs, the workout formula, rebalancing and catch-up thresholds, protein goal, dietary details and plan management.</td></tr>
<tr><td colspan="2"><b>Profile</b> — your body and your goals, nothing else: <b>personal details</b>, <b>new weigh-in</b> (every save adds a row to your history), <b>Goals</b>, <b>baseline activity</b>, reminders, holiday mode and the guided setup.</td></tr>
<tr><td colspan="2"><b>System</b> — everything technical in one place: how much detail the interface shows, the AI key (Gemini), Google Drive, local backup, emergency restore, selective clean-up, anonymous usage data and feedback.</td></tr>
<tr><td colspan="2"><b>Guided setup</b> (under Plan) — the same guided path, with every field already filled in (your data, intolerances, tastes, goals), from which the AI generates a week made for you, editable before you confirm it. "Edit the plan" for changes by hand. Always to be validated with a nutritionist.</td></tr></table></div></details></div>`;

GUIDA_EN.simboli=()=>`<div class="card guida-sec"><details class="gdet"><summary><h2>The symbols</h2><span class="gdet-arrow">▾</span></summary><div class="gdet-body">
<div class="gsec">On meals</div><table class="gtable">
<tr><td>○ ✓ ✗</td><td>Tap the circle to cycle through: <b>to do → eaten → skipped</b>. Only the ✓ count towards the balance; the ✗ stay on record as skipped.</td></tr>
<tr><td>→</td><td>The two menus move a meal to another <b>day</b> and/or <b>slot</b> — lunch↔dinner on the same day included. The red badge remembers where it came from.</td></tr>
<tr><td>${ic("pencil",18)}</td><td><b>Edit ingredients</b> (the pencil): you change the text and the AI re-estimates calories and macros. It works on meals you've already rebalanced or changed, and <b>pressing OK without changing anything</b> re-runs the estimate anyway.</td></tr>
<tr><td>${ic("dice",18)}</td><td><b>Alternative</b> (the die): the AI invents a different dish with the same macros; you can make it permanent or keep it just for this week.</td></tr>
<tr><td>${ic("swap",18)}</td><td><b>${"I'm missing an ingredient"}</b>: a panel opens with 3 <b>tappable</b> suggestions (tap to select, then OK). " More suggestions" generates new ones; " Photograph the food you have in" (several photos are fine) and then " Suggest from the photo" picks the best substitute from what you actually own.</td></tr>
<tr><td>${ic("star",18)}</td><td><b>My dishes</b>: when you like an AI dish, save it with ⭐; you'll find it again under "⭐ My dishes" (inside Create a dish) and reuse it in one tap, without spending any AI.</td></tr>
<tr><td colspan="2"><b>Workouts</b>: kcal = (sport MET × intensity − 1) × <b>body weight</b> × hours. The −1 removes the resting metabolism, already included in your needs: without that subtraction every session would look more generous than it really is.</td></tr>
<tr><td colspan="2"><b>Steps</b>: your <b>baseline steps</b> are already inside your energy needs (3,000 as the reference, adjustable in Profile). On days when you walk far more than usual you enter them under <b>Training → Steps</b>: the app <b>subtracts the 3,000 already counted</b> and adds only the difference to the balance, so nothing is counted twice. Proper walks are logged as sport, with duration and intensity.</td></tr>
<tr><td colspan="2"><b>Target weight</b> (in Profile): set the finish line and you'll see it as a line on the chart, plus the estimated arrival date at your current pace.</td></tr>
<tr><td>${ic("undo",18)}</td><td>Restores the original meal after an edit, an alternative or a rebalance.</td></tr>
<tr><td colspan="2"><b>Analysis</b> (inside every meal): with ${ic("camera",15)} you shoot there and then, with ${ic("gallery",15)} you pick a photo already in your gallery (handy if you took it earlier, or if you have no signal), and the AI estimates <b>${"the weight in grams of every element"}</b> as well as calories and macros; the saved description contains those weights, so you can correct them with  and the re-estimate uses exactly your numbers. At a restaurant you can photograph <b>one course at a time</b> (starter, main, dessert): it asks whether to <b>add</b> it to the meal or replace it. The ✓ always stays yours.</td></tr>
<tr><td colspan="2">Appears on moved meals: it sends <b>both</b> meals of the swap back to their original day — including the one you can't see from here, and even if it's already ticked. The swap, after all, is <b>automatic and two-way</b>.</td></tr>
<tr><td colspan="2"><b>The plan doesn't move</b>: rebalancing, photos and corrections change the day in Today only. The day's planned figure stays the one from the plan, so the "planned vs eaten" comparison always means something.</td></tr>
<tr><td colspan="2"><b>Rebalance the remaining calories</b>: puts the day back in line by acting <b>only on meals you haven't ticked yet</b>; if you're already on track it changes nothing. When it does cut, it uses <b>real values</b>: first it lowers the <b>amounts</b>, then — only if the dish stops being filling — it swaps ingredients for lighter, bulkier ones. Never numbers touched up while the dish stays the same (those are discarded automatically), never meals deleted.</td></tr>
</table>
<div class="gsec">Meal colours</div><table class="gtable">
<tr><td colspan="2">Green = an ordinary meal from the plan.</td></tr>
<tr><td colspan="2">Orange = a <b>free</b> meal (sushi, pizza, drinks, a croissant): never compulsory, the normal option is always there too.</td></tr>
<tr><td colspan="2">Blue = <b>canteen</b>, on the days and in the slot you set yourself: follow the rule written in the row.</td></tr></table>
<div class="gsec">Others</div><table class="gtable">
<tr><td colspan="2"><b>Menu picker</b>: you take <b>several photos</b> of the menu (different pages are fine), then press <b>Search</b> and the AI chooses the dish most compatible with what you ought to be eating right now, plus two reserves. Alternatively you paste the text and use "Use the text".</td></tr>
<tr><td colspan="2"><b>Create a dish from what you have</b>: photograph the fridge, freezer and cupboard (several photos), then press <b>Create</b>; the dish is tuned to the meal you're at right now and compensates for the calories already banked. "⭐ My dishes" reuses your saved dishes without spending any AI.</td></tr>
<tr><td colspan="2"><b>Export data</b> (in History): choose the period and download one row per day with everything — planned and eaten, full macros, sugars, sport, sleep, relaxation, mood, water, event, diet phase, rebalancing, catch-ups, meals ticked and skipped. CSV for Excel or Google Sheets, or <b>Analyse the patterns</b> to have Nuvia's AI read it for you.</td></tr>
<tr><td colspan="2"><b>System rules</b> (Rules section): every number that governs the app — the needs formula, the workout calculation, the per-meal minimum, catch-up thresholds, the protein goal — visible and editable, plus a free-text rules field that gets attached to every AI request.</td></tr>
<tr><td colspan="2"><b>Dietary details</b> (Rules section): your reference style (Mediterranean, low carb, intermittent fasting, vegetarian…), meals per day and which ones you skip, free meals, meals away from home and canteen, time to cook, budget, intolerances, religious constraints, conditions to keep in mind. From here the AI can also <b>generate a complete plan</b>.</td></tr>
<tr><td>${ic(seasonNow(),18)}</td><td><b>Seasonal options</b>: among the options for main meals, the label ${ic("primavera",14)} Spring · ${ic("estate",14)} Summer · ${ic("autunno",14)} Autumn · ${ic("inverno",14)} Winter marks the seasonal alternative created with "Seasonal alternative" in the Plan. Your base plan stays intact; regenerating replaces the old seasons.</td></tr>
<tr><td colspan="2"><b>Estimate results</b> (in the Plan): the plan's balance → kilos per week and the estimated date for your goal; if the goal doesn't look reachable, it offers to <b>re-tune the amounts</b> automatically (rebuilding shopping list and estimate) or to leave everything as it is.</td></tr>
<tr><td colspan="2"><b>Sugars</b> (g): alongside P/C/F/Fib. They come from the barcode (Open Food Facts) or from the AI; when missing they're estimated from the description.</td></tr>
<tr><td>${ic("plus",18)}</td><td><b>Extras</b>: creates an <b>empty</b> ${"card to fill in — by hand, with a photo, or with the barcode. Extras are ticked like meals (✓ eaten / ✗ not eaten) and, once ticked, they fade and get struck through exactly like the others. The bin really does delete, with a confirmation."}</td></tr>
<tr><td colspan="2"><b>Catch-up</b> (the Event row, on today only): the dropdown shows the calories <b>still outstanding</b> from the last 5 days — one day at a time, or "All". Three safety rules: overshoots <b>below the threshold</b> (10% of the day, minimum 150 kcal — adjustable in Profile) aren't even offered; in any one day you cut at most <b>25% of the planned total</b>; <b>no meal drops below ~250 kcal</b>. If the overshoot is large, the rest stays queued and you make it up over the following days — never a day of fasting.</td></tr>
<tr><td colspan="2">The day's <b>Event</b> (Christmas, a birthday, a party, dinner out, work or travel, a bad day, illness…): the day stays tracked but is <b>left out of the averages</b>, and it doesn't break your streak .</td></tr>
<tr><td colspan="2">Barcode (inside every meal): scan SEVERAL products, correct the grams and confirm the total — from Open Food Facts, without spending any AI.</td></tr>
<tr><td colspan="2"><b>The streak, in plain words</b>: it counts your "good" days in a row. Every morning the app looks at how YESTERDAY went and asks itself 3 questions: did you tick your meals? did you stay inside your calories? were your extras 300 kcal at most? <b>Three yeses = flame +1. A single no = back to 0.</b> It does it all by itself, you press nothing; in Progress, holiday mode pauses it.</td></tr>
<tr><td colspan="2">Water: the goal is the water <b>you drink</b>, not your total intake. It starts from 35 ml per kg (32 if your BMI is over 25, 28 if over 30: fat tissue holds far less water than muscle), then <b>subtracts the ~22% that already comes from food</b> — fruit, vegetables, soups, milk. The result is shown in 200 ml glasses, <b>+2</b> on days with an intense workout or one over 45 minutes. You can always write your own figure under Profile → Goals.</td></tr>
<tr><td>${ic("star",18)}</td><td>Sleep · Relaxation · How you feel: a scale of 1 low → 5 high. They feed the AI's end-of-week correlations.</td></tr>
<tr><td colspan="2">Holiday mode (in Profile): freezes the deficit and the ; the app stays a diary, without judgement.</td></tr>
<tr><td colspan="2">Morning reminder: "Did you log all your Meals, Water and Sport yesterday?" — it appears if something is missing and stays at the top until you press <b>Done</b> (or open yesterday and fix it).</td></tr>
<tr><td colspan="2">The theme button cycles through light → dark → <b>automatic</b> (following your phone's settings).</td></tr>
<tr><td colspan="2">On the Today page you can <b>swipe with your finger</b> (left/right) to change day, as well as using the ‹ › arrows.</td></tr>
<tr><td colspan="2">End of the week: archiving is <b>automatic</b>, with whatever is there, no buttons to press. Closed weeks stay <b>editable at any time</b> from History → Past weeks → Edit.</td></tr>
<tr><td colspan="2"><b>Shopping search link</b> (at the top of Shopping): nearly every online supermarket makes you choose a store first, so there's no universal link. Run a search on YOUR store's site, copy the address and paste it here, replacing the word you searched for with <b>{q}</b>: from then on every ↗ link in the list searches directly in your supermarket.</td></tr>
<tr><td colspan="2"><b>Products on the list</b> (in Shopping): they all come from the plan, including the ingredients of meals you change or add yourself — the list realigns itself. For something outside the plan, use the ＋ next to the category.</td></tr>
</table></div></details></div>`;

/* Il corpo inglese cresce qui dentro, una sezione per volta (blocco B). */
function guidaCorpo(){
  const en=(typeof LANG!=="undefined"&&LANG==="en");
  return GUIDA_SEZIONI.map(k=>{
    const f=(en&&GUIDA_EN[k])||GUIDA_IT[k];
    return f?f():"";}).join("\n");}
function guidaQuanteEN(){return GUIDA_SEZIONI.filter(k=>GUIDA_EN[k]).length;}
window.guidaQuanteEN=guidaQuanteEN;
function renderGuida(){document.getElementById("pg-guida").innerHTML=avvisoLingua()+guidaCorpo();}

/* Composizione in kg derivata da peso + percentuali. Il "resto" della massa
   magra non è "liquidi": è acqua extra-muscolare, ossa e organi. */
function compLine(p){const fat=parseFloat(p.fatp),mus=parseFloat(p.musp);
  if(!(fat>0))return "";
  const gK=(p.w*fat/100),lbmK=p.w-gK;
  let s=trh("La tua composizione: <b>magra {v1} kg</b> · <b>grasso {v2} kg</b>",{v1:lbmK.toFixed(1),v2:gK.toFixed(1)});
  if(mus>0){const mK=p.w*mus/100,rest=lbmK-mK;
    s+=trh(" — della magra: muscolo {v1} kg, il resto ({v2} kg) è acqua extra-muscolare, ossa e organi",{v1:mK.toFixed(1),v2:rest.toFixed(1)});}
  return `<div class="hint" style="margin:4px 0 8px">${trh("{v1}. I calcoli (Katch-McArdle) usano la magra derivata dalla % di grasso.",{v1:s})}</div>`;}
/* Proiezione verso l'obiettivo: regressione lineare sulle ultime pesate */
function goalProj(){const p=S.profile,ws=p.weights.slice(-8);
  if(!p.goalW||ws.length<2)return "";
  const t0=giornoDa(ws[0].d).getTime(),days=(giornoDa(ws[ws.length-1].d).getTime()-t0)/864e5;
  if(days<5)return "";
  const xs=ws.map(x=>(giornoDa(x.d).getTime()-t0)/864e5),ys=ws.map(x=>x.w);
  const n=xs.length,mx=xs.reduce((a,b)=>a+b)/n,my=ys.reduce((a,b)=>a+b)/n;
  let num=0,den=0;xs.forEach((x,i)=>{num+=(x-mx)*(ys[i]-my);den+=(x-mx)**2;});
  const slope=den?num/den:0; // kg/giorno
  if(slope>=-0.005)return "Il peso al momento non sta scendendo: la proiezione verso l'obiettivo apparirà quando ci sarà un trend in discesa.";
  if(ys[ys.length-1]<=p.goalW)return " Obiettivo raggiunto!";
  const dLeft=(ys[ys.length-1]-p.goalW)/(-slope);
  const eta=new Date(Date.now()+dLeft*864e5);
  return "Al ritmo attuale (~"+(slope*7).toFixed(1).replace("-","−")+trh(" kg/settimana) dovresti raggiungere <b>{v1} kg</b> intorno al <b>",{v1:p.goalW})+eta.toLocaleDateString(dataLoc(),{day:"numeric",month:"long",year:"numeric"})+"</b>. Stima indicativa: il ritmo rallenta man mano che scendi.";}
function renderIo(){const el=document.getElementById("pg-io");const p=S.profile;
  /* Quattro schede distinte, ognuna con il suo salvataggio:
     1) anagrafica (cambia quasi mai) · 2) misurazioni (la pesata, il dato che
     cambia di continuo) · 3) obiettivi · 4) attività di base. */
  /* Partenza, oggi, obiettivo: è la domanda che porta la gente ad aprire
     l'app, e stava in fondo alla pagina. La scheda completa (massa grassa,
     pressione, circonferenze) resta subito sotto per chi la usa. */
  let h=pesoHeroHTML();
  /* Quattro schede, stesso metodo della pagina Numeri: marcatori
     filtrati alla fine, nessuna graffa toccata. */
  const SKio="io";
  /* RIDISEGNO del 22/08, dal founder: quattro schede coi nomi
     sbagliati («Tu» conteneva i traguardi, «Corpo» l'anagrafica,
     «Studio» l'abbonamento) sono diventate DUE che dicono il vero:
     - I tuoi dati: chi sei, gli obiettivi, le situazioni del corpo
     - Permessi: cosa vede lo studio, prescrizione, statistiche
     L'ABBONAMENTO è una voce propria del menu (pagina «conto»), i
     TRAGUARDI vivono nello Storico coi progressi, e i progressi li
     propone una card sul Punto ogni due settimane (cadenza che la
     persona può cambiare lì). */
  h+=schedeBarra(SKio,[["dati",tr("I tuoi dati")],["permessi",tr("Permessi")]]);
  h+=`<!--SCHEDA:permessi-->`;
  h+=prescrizioneHTML();
  h+=cobrandNotaHTML();
  h+=consensiHTML();
  h+=`<!--SCHEDA:dati-->`;
  h+=`<div class="gsec">${tr("Chi sei")}</div>`;
  h+=`<div class="card pesata"><h2>Nuova pesata</h2>
  <div class="hint">${trh("I valori che cambiano nel tempo. Ogni salvataggio {b} allo storico, con la data di oggi: è così che nascono i grafici e le proiezioni.",{b:"<b>"+tr("aggiunge una riga")+"</b>"})}</div>
  <div class="row3"><div><label>${tr("Peso (kg)")}</label><input type="number" step="0.1" id="pW" value="${p.w||""}" placeholder="es. 80"></div>
  <div><label>M. grassa %</label><input type="number" step="0.1" id="pFat" value="${p.fatp||""}" placeholder="es. 28"></div>
  <div><label>M. muscolare %</label><input type="number" step="0.1" id="pMus" value="${p.musp||""}" placeholder="es. 42"></div></div>
  ${compLine(p)}
  <div class="row2"><div><label>Pressione</label><input type="text" id="pPa" placeholder="120/80"></div>
  <div><label>SpO2 %</label><input type="number" id="pSpo2" placeholder="98"></div></div>
  ${tr("Percentuali, pressione e SpO2 sono facoltative: se le lasci vuote, la riga registra solo il peso.")}
  <!-- Il pulsante in evidenza è quello in cima («Aggiungi una pesata»), che
       fa la cosa più frequente in due tocchi. Questo salva la scheda COMPLETA
       (massa grassa, pressione, circonferenze) e resta a contorno: serve a chi
       la usa, ma non deve contendere l'attenzione a quello sopra. -->
  <button class="btn ghost" onclick="saveWeighIn()">${tr("Registra la pesata")}</button></div>`;
  h+=studioCardHTML();

  h+=`<div class="card"><h2>${tr("Obiettivi")}</h2>
  ${hint2(tr("Dove vuoi arrivare e con che ritmo."),tr("Da qui l'app calcola il deficit e la proiezione del peso."))}
  <div class="row2"><div><label>${tr("Obiettivo peso (kg)")}</label><input type="number" step="0.1" id="pGoal" value="${goalWeightSet()||""}" placeholder="facoltativo"></div>
  <div><label>${tr("Obiettivo acqua (L al giorno)")}</label><input type="number" step="0.25" id="pWater" value="${p.waterGoalL||""}" placeholder="proposto: ${waterSuggestL()}"></div></div>
  ${(()=>{if(!p.goalW||!p.h)return"";const b=bmiFor(p.goalW),cl=bmiClass(b);
    return `<div class="hint" style="color:${cl.ok?"var(--bosco)":"var(--rosso)"}">Obiettivo ${p.goalW} kg → BMI ${b} (${cl.label}).</div>`;})()}
  ${hint2(tr("Lascia vuoto e l'obiettivo lo calcola l'app su di te."),
 `${trh("{v1}, già al netto dell'acqua che arriva dal cibo. Un bicchiere vale 200 ml; con allenamenti intensi o oltre 45 minuti l'obiettivo sale di 2 bicchieri.",{v1:waterExplain()})}`)}
  <label>${tr("Allenamenti obiettivo a settimana")}</label>
  ${(p.goalWorkoutList||[]).length?`<div class="wkhead"><span style="flex:2">Sport</span><span style="flex:1">Minuti</span><span style="flex:1">${tr("Volte")}</span><span style="width:34px"></span></div>`:""}
  <div id="goalWkList">${(p.goalWorkoutList||[]).map((g,i)=>`<div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">
    <select style="flex:2;min-width:0" onchange="setGoalWk(${i},'sport',this.value)">${allSports().map(sp=>`<option ${g.sport===sp.name?"selected":""}>${esc(sp.name)}</option>`).join("")}</select>
    <input style="flex:1;min-width:0" type="number" min="5" step="5" value="${g.min||30}" onchange="setGoalWk(${i},'min',this.value)" title="minuti a sessione">
    <input style="flex:1;min-width:0" type="number" min="1" step="1" value="${g.perWeek||1}" onchange="setGoalWk(${i},'perWeek',this.value)" title="${tr("volte a settimana")}">
    <button class="btn ghost small" style="padding:4px 8px;margin:0;width:34px" onclick="delGoalWk(${i})">✕</button></div>`).join("")||vuotoDi("obiettiviSport")}</div>
  <div class="hint"><b>Minuti</b> ${trh("= durata di una sessione · {b} = quante a settimana.",{b:"<b>Volte</b>"})}</div>
  <button class="btn ghost small" onclick="addGoalWk()">${tr("+ Aggiungi allenamento")}</button>
  ${(()=>{const sim=simulateWeightDescent(p.w,new Date());if(!sim)return"";
    if(sim.stalled)return `Con questi obiettivi il deficit si annulla prima di arrivare al traguardo.`;
    return `<div class="hint" style="color:var(--bosco)">${tr("Al ritmo pianificato l'obiettivo arriva intorno al")} <b>${sim.etaDate?new Date(sim.etaDate).toLocaleDateString(dataLoc(),{day:"numeric",month:"long",year:"numeric"}):"—"}</b> ${trh("(deficit iniziale ~{v1} kcal al giorno).",{v1:sim.dailyDeficitStart})}</div>`;})()}
  <button class="btn ghost" onclick="saveObiettivi()">${tr("Salva obiettivi")}</button></div>`;

  h+=`<div class="card"><h2>${tr("Il tuo motore")}</h2>
  ${tr("I numeri che l'app usa per tutto il resto: si aggiornano da soli quando cambi peso, attività o obiettivo.")}<div class="stat3">
  <div><div class="v">${age()||"—"}</div><div class="l">${tr("anni")}</div></div>
  <div><div class="v">${bmr()}</div><div class="l">BMR</div></div>
  <div><div class="v">${tdee()}</div><div class="l">TDEE base</div></div></div>
  <div class="hint">${parseFloat(S.profile.fatp)>0?tr("BMR con Katch-McArdle sulla magra derivata dalla tua % di grasso: il metodo più preciso."):tr("BMR con formula Mifflin-St Jeor. Inserisci la % di massa grassa per un calcolo più preciso.")} ${tr("Gli allenamenti si sommano giorno per giorno.")}${goalProj()?"<br><br> "+goalProj():""}</div></div>`;
  // Vacanza
  h+=`<div class="card"><h2>${tr("Attività di base")}</h2>
  ${trh("Quanto ti muovi {b} degli allenamenti: da qui e dal basale nasce il fabbisogno.",{b:"<b>"+tr("al di fuori")+"</b>"})}
  <label>${tr("Attività di base")}</label>
    <div class="hint" style="margin:0 0 8px">Lavoro e vita quotidiana, sport escluso.</div>
  <select id="pAct"><option value="1.2" ${p.act==1.2?"selected":""}>${tr("Molto sedentario")}</option>
  <option value="1.25" ${p.act==1.25?"selected":""}>${tr("Sedentario −")}</option>
  <option value="1.3" ${!p.act||p.act==1.3?"selected":""}>${tr("Sedentario, lavoro al PC")}</option>
  <option value="1.35" ${p.act==1.35?"selected":""}>${tr("Poco attivo")}</option>
  <option value="1.4" ${p.act==1.4?"selected":""}>${tr("Attivo")}</option>
  <option value="1.45" ${p.act==1.45?"selected":""}>${tr("Moderatamente attivo")}</option></select>
  <label>${tr("Passi base garantiti al giorno")}</label>
  <input type="number" id="pBaseSteps" value="${(+p.baseSteps>0)?+p.baseSteps:3000}" step="500" min="0">
  <div class="hint">${trh("I passi che fai {b}, anche nei giorni pigri: sono già dentro al fabbisogno, non si inseriscono ogni giorno. Le camminate vere si registrano in Sport.",{b:"<b>sempre</b>"})}</div>
  <button class="btn ghost" onclick="saveAttivita()">${tr("Salva attività")}</button></div>`;

  // Gestione periodi (inizio/fine dieta o periodo libero)
  h+=`<div class="card"><h2>Anagrafica</h2>
  ${tr("Dati che non cambiano (o cambiano di rado). Servono a calcolare il metabolismo basale.")}
  <div class="row2"><div><label>${tr("Nome")}</label><input type="text" id="pName" value="${esc(p.name||"")}"></div>
  <div><label>Genere</label><select id="pGen"><option value="m" ${p.gender==="m"?"selected":""}>Uomo</option><option value="f" ${p.gender==="f"?"selected":""}>Donna</option></select></div></div>
  <div class="row2"><div><label>${tr("Data di nascita")}</label><input type="date" id="pDob" value="${p.dob||""}"></div>
  <div><label>Altezza (cm)</label><input type="number" id="pH" value="${p.h||""}" placeholder="es. 175"></div></div>
  <button class="btn ghost" onclick="saveAnagrafica()">${tr("Salva anagrafica")}</button></div>`;

  h+=`<div class="card"><h2>${tr("Promemoria")}</h2>
  ${hint2(tr("Piccoli avvisi nei momenti in cui servono: la mattina il riassunto di ieri, il pomeriggio come sta andando, la sera la chiusura."),tr("Non arrivano mai di notte, e se ne ignori due di fila l'app smette di insistere. I complimenti si fanno solo quando c'è un motivo vero — una settimana intera in linea, o una giornata con qualità alta. Oggi compaiono dentro l'app; quando l'avrai installata diventeranno notifiche vere."))}
  <div class="ckgrid">
    ${NOTIF_LIV.map(([v,t,d])=>`<label class="ck" style="align-items:flex-start;text-align:left">
      <input type="radio" name="nfliv" ${notifCfg().liv===v?"checked":""} onchange="notifLiv('${v}')" style="margin-top:4px">
      <span><b>${t}</b><br><small style="color:var(--grigio)">${d}</small></span></label>`).join("")}
    <label class="ck" style="align-items:flex-start;text-align:left">
      <input type="radio" name="nfliv" ${notifCfg().liv==="mai"?"checked":""} onchange="notifLiv('mai')" style="margin-top:4px">
      <span><b>Nessuno</b><br><small style="color:var(--grigio)">${tr("Silenzio totale")}</small></span></label>
  </div>
  <label>${tr("Silenzio dalla sera al mattino")}</label>
  <div class="row2">
    <div><label class="ru">dalle ore</label><input type="number" id="nfAlle" min="18" max="24" value="${notifCfg().alle}" onchange="notifOre()"></div>
    <div><label class="ru">alle ore</label><input type="number" id="nfDalle" min="4" max="11" value="${notifCfg().dalle}" onchange="notifOre()"></div>
  </div></div>`;
  h+=`<div class="gsec">Situazioni</div>`;
  h+=periodsCardHTML(true);
  h+=`<div class="card"><h2>${tr("Rifai il percorso guidato")}</h2>
  ${hint2(tr("Ripercorri i nove passi con i dati che hai già inserito."),tr("Serve quando cambia qualcosa di grosso: obiettivo, abitudini, allenamenti. Nulla viene cancellato — trovi tutti i campi già compilati e cambi solo ciò che serve."))}
  <div class="mtools"><button class="btn ghost small" onclick="restartOnboarding()">${tr("Ricomincia il percorso")}</button></div></div>`;
  /* Una scheda che resta vuota non è una pagina: è un vicolo cieco.
     Succede a chi è appena arrivato (la scheda «Tu» vive di storico) o
     a chi non ha uno studio collegato. Meglio la mascotte con una cosa
     da fare che il bianco. */
  const att=schedaAttiva(SKio,"dati");
  let corpo=schedeFiltra(h,att);
  if(!/<div class="card|<div class="gsec/.test(corpo.split('<div class="schede"')[1]||"")){
    corpo+=IO_VUOTI[att]||IO_VUOTI.dati;}
  el.innerHTML=corpo;}

/* ── LA PAGINA ABBONAMENTO ──────────────────────────────────────
   Voce propria del menu (22/08, dal founder): l'abbonamento non è né
   configurazione né «studio» — è un rapporto fra la persona e noi.
   Stessa funzione contoHTML() di prima: nessuna copia. */
function renderConto(){const el=document.getElementById("pg-conto");
  if(!el)return;
  el.innerHTML=`<div class="gsec">${tr("Abbonamento")}</div>`+contoHTML();}
try{if(typeof RENDER_PAGINE!=="undefined")RENDER_PAGINE.conto=renderConto;}catch(e){}

/* Le frasi degli stati vuoti stanno qui, tutte insieme: è la regola
   del catalogo VUOTI, e serve anche perché il controllo delle
   traduzioni le veda. */
const IO_VUOTI={
  dati: ()=>vuoto("pensa","Ancora nessuna misura registrata. La prima pesata fa nascere grafici e proiezioni.","show('storico')","Vai ai Progressi"),
  permessi:()=>vuoto("saluta","Nessuno studio collegato. Quando un professionista ti segue, qui decidi cosa vede e cosa no.","show('regole')","Vai alle Regole")};
Object.keys(IO_VUOTI).forEach(k=>{const f=IO_VUOTI[k];
  Object.defineProperty(IO_VUOTI,k,{get:f,configurable:true});});
/* ═══ PAGINA SISTEMA ═════════════════════════════════════════════════
   Il profilo parlava di te e, in mezzo, di chiavi API, backup e
   telemetria. Ora il tecnico vive qui: Io resta corpo e obiettivi. */
function renderSistema(){const el=document.getElementById("pg-sistema");const p=S.profile;
  let h=`<div class="gsec">Interfaccia</div>`;
  h+=`<div class="card"><h2>${tr("Lingua")}</h2>
  ${hint2(tr("Interfaccia tradotta in inglese."),tr("Restano in italiano i dati (nomi dei cibi, giorni, fasce dei pasti) e le regole nutrizionali che vanno all'AI: sono valori, non etichette. Nulla resta mai vuoto."))}
  <div class="ckgrid">
    ${(window.LINGUE||[["it","Italiano"],["en","English"]]).map(([k,l])=>`<label class="ck"><input type="radio" name="lang" ${LANG===k?"checked":""} onchange="langSet('${k}')"> ${l}</label>`).join("")}
  </div></div>`;
  /* NIENTE COMANDO PER IL TEMA, e per una ragione precisa.
     Il 19/08 il tema scuro è stato rispento dopo un riscontro sul
     telefono: i contrasti delle VARIABILI passavano, ma i pulsanti
     erano illeggibili. Il 20/08 ho aggiunto qui una card «Chiaro o
     scuro» senza accorgermi di quella decisione: prometteva una
     scelta che non si poteva fare, perché temaVoluto() restituisce
     sempre «light».
     Un comando che non fa niente è peggio di nessun comando: chi lo
     tocca pensa che l'app sia rotta, e ha ragione.
     Il CSS scuro resta pronto. La card torna il giorno in cui il
     tema sarà verificato su un telefono vero, pulsante per
     pulsante. */
  h+=`<div class="card"><h2>${tr("Quanto vuoi vedere")}</h2>
  <label class="ck" style="margin-bottom:8px"><input type="checkbox" ${S.ui.guidaOff?"":"checked"} onchange="S.ui.guidaOff=!this.checked;save();toast(this.checked?tr('Suggerimenti di guida attivi'):tr('Suggerimenti di guida spenti'))"> ${tr("Suggerimenti di guida (primi passi, faro e consigli)")}</label>
  ${hint2(tr("Tre livelli di dettaglio. <b>Nessuna funzione viene tolta</b>: cambia solo cosa è in vista."),tr("Con «Essenziale» restano pasti, spesa e peso, e il bilancio mostra i quattro numeri che contano. Con «Completo» tornano macro, fibre e fasi della dieta. Con «Esperto» compaiono anche tutte le formule di calcolo. Tutto il resto resta comunque raggiungibile dall'assistente e dal pulsante ⋯."))}
  <div class="ckgrid">
    ${DENS.map(([v,t,d])=>`<label class="ck" style="align-items:flex-start;text-align:left">
      <input type="radio" name="dens" ${dens()===v?"checked":""} onchange="densSet('${v}')" style="margin-top:4px">
      <span><b>${t}</b><br><small style="color:var(--grigio)">${d}</small></span></label>`).join("")}
  </div>
  <label>${tr("Cosa vedi a questo livello")}</label>
  <div class="denslist">
    ${DENS_COSA.base.map(x=>`<div class="dline on">${esc(x)}</div>`).join("")}
    ${DENS_COSA.full.map(x=>`<div class="dline ${densMin("full")?"on":""}">${esc(x)}${densMin("full")?"":` <span class="dtag2">Completo</span>`}</div>`).join("")}
    ${DENS_COSA.expert.map(x=>`<div class="dline ${densMin("expert")?"on":""}">${esc(x)}${densMin("expert")?"":` <span class="dtag2">Esperto</span>`}</div>`).join("")}
  </div>
  ${tr("Le voci in grigio non sono state tolte: compaiono passando al livello indicato, e tutto resta comunque raggiungibile dall'assistente.")}</div>`;
  h+=`<div class="gsec">${tr("Impostazioni")}</div>`;
  h+=`<div class="card${aiOn()?"":" nota"}"><h2>Motore AI (Gemini)</h2>
  ${aiOn()?"":`${hint2(tr(" <b>Senza chiave l'app è fortemente limitata.</b> È gratuita e si crea in un minuto."),tr("Restano spenti: generazione e bilanciamento del piano, stima di calorie e macro dai piatti scritti, analisi delle foto, selezionatore di menù, svuota-frigo, ribilanciamento della giornata, recupero degli sfori, alternative ai pasti, analisi dei pattern e report."))}`}
  <label>Chiave API Google Gemini</label><input type="text" id="gKey" value="${(S.ai&&S.ai.key)||""}" placeholder="${tr("incolla qui la chiave")}">
  <label>Modello Gemini</label>
  <select id="gModel">${(function(){const d=gemDiscovered()||[];
    const list=["auto"].concat(d,GEM_ALL.filter(m=>m!=="auto"&&d.indexOf(m)<0));
    return list.map(m=>`<option ${S.ai.model===m?"selected":""}>${m}</option>`).join("");})()}</select>
  ${pensieroHTML("sis")}
  <div class="mtools" style="margin-top:8px"><button class="btn ghost small" onclick="aiDiagnosi()">${tr("Prova la connessione")}</button><button class="btn ghost small" onclick="gemRefreshModels()">Cerca modelli nuovi</button></div>
  <div class="aibox" aria-live="polite" id="aiDiag" style="display:none"></div>
  <div class="hint">${tr("Con <b>auto</b> l'app usa sempre il modello più recente di Google, scendendo agli altri se non risponde. L'elenco si aggiorna da solo.")}${gemDiscovered()?" Ultimo controllo: "+new Date(S.ai.models.at).toLocaleDateString(dataLoc())+" · "+S.ai.models.list.length+" modelli.":""}</div>
  <div class="hint">${trh("Con la chiave gratuita usi i modelli {b}",{b:"<b>Flash</b>"})} ${trh("La catena parte dal Flash più recente che il tuo account espone e scende ai due precedenti se non risponde. Niente lite, niente Pro: sono scelte prese.",{b:"<b>Pro</b>"})}</div>
  <button class="btn" onclick="saveAI()">${tr("Salva impostazioni AI")}</button>
  <div class="aibox" aria-live="polite" style="margin-top:12px"><div id="usageLine">${usageHtml()}</div>
  <div class="hint" style="margin-top:4px">${trh("Contatore locale del tuo consumo (Google non espone i token residui: quelli si vedono solo nella Google Cloud Console). Se vedi molti errori {v1}, stai toccando i limiti gratuiti: rallenta o attiva la fatturazione.",{v1:'\"quota\"'})}</div>
  <button class="btn ghost small" onclick="S.usage={day:'',calls:0,tokens:0,errors:0,last:''};save();render('io')">Azzera contatore</button></div>
  ${hint2(`${trh("Chiave gratuita su {v1} → <b>Create API key</b>. Resta sul tuo telefono.",{v1:'<a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" class="lnk">aistudio.google.com/app/apikey ↗</a>'})}`,
 tr("Serve per: foto dei piatti e del frigo, lettura dei menù, stime di sfori e sport, alternative, ribilanciamento, sostituzioni nella spesa e report settimanali. Senza chiave l'app funziona lo stesso, ma tutto va fatto a mano."))}</div>`;
  // Drive
  h+=`<div class="card"><h2>Sincronizzazione Google Drive</h2>
  <div class="hint">${trh("Backup automatico su una cartella privata del {b} Drive. Serve una configurazione iniziale su Google Cloud: i passaggi sono qui sotto.",{b:"<b>tuo</b>"})}</div>
  <label>CLIENT_ID (Google Cloud)</label><input type="text" id="dCid" value="${S.drive.cid||""}" placeholder="xxxx.apps.googleusercontent.com">
  ${hint2(tr("Salva al massimo ogni 15 minuti, e sempre quando chiudi l'app."),tr("Oltre al backup principale tiene una <b>copia al giorno</b> (le ultime sette), così puoi tornare indietro. Se il backup online risulta molto più ricco di quello sul telefono, l'app <b>si ferma e chiede</b> invece di sovrascrivere."))}
  <label style="margin-top:12px">Connessione</label>
  <div class="mtools">
    <button class="btn small" onclick="driveConnect()">Connetti e sincronizza</button>
    <button class="btn ghost small" onclick="driveDisconnect()">Disconnetti</button>
  </div>
  <label style="margin-top:12px">Salvataggi</label>
  <div class="mtools">
    <button class="btn ghost small" onclick="driveFlush();driveUpload()">${tr("Salva")}</button>
    <button class="btn ghost small" onclick="driveRestoreMenu()">${tr("Ripristina")}</button>
  </div>
  <label style="margin-top:12px">Zona pericolosa</label>
  <div class="mtools">
    <button class="btn warn small" onclick="driveDelete()">${tr("Elimina backup da Drive")}</button>
  </div>
  <div class="hint" id="driveStatus">${S.drive.on?"Configurato: a ogni avvio l'app si riconnette da sola, confronta i timestamp e carica la versione più recente (telefono e PC condividono così gli stessi dati). Auto-save attivo.":"Non connesso."}
  <br><b>Disconnetti e desincronizza</b> ${trh("= stacca solo QUESTO dispositivo, il backup su Drive e gli altri dispositivi restano intatti. {b} = cancella il file su Drive: sparisce da TUTTI i dispositivi (con conferma).",{b:"<b>Elimina backup</b>"})}
  <br>${trh("Configurazione (Client ID + progetto Google Cloud): spiegata passo passo nella {b1}. Salva su una cartella privata di Drive dedicata solo a quest'app (nessuna cartella tua è coinvolta). Al primo accesso su ogni dispositivo Google chiede il consenso una volta; poi la sincronizzazione è silenziosa.",{b1:"<b>Guida</b>"})}</div></div>`;
  // Backup
  h+=`<div class="gsec">${tr("I tuoi dati")}</div>`;
  h+=`<div class="card"><h2>${tr("Dati & backup in locale")}</h2>
  ${hint2(tr("I tuoi dati stanno sul telefono."),tr("Esporta ogni tanto un backup: se cambi dispositivo o svuoti il browser, è l'unico modo per ritrovarli."))}
  <button class="btn ghost" onclick="exportData()">Esporta</button>
  <button class="btn ghost" onclick="importData()">Importa</button>
  <button class="btn ghost warn" onclick="wipeAll()">Cancella</button>
  <div class="hint">${tr("Esporta/Importa = file di backup sul dispositivo · Cancella = azzera tutto e ricomincia da capo.")}<br>Versione app: <b>${APP_VER}</b> ${trh("· i dati vivono nel browser, non nel file: aggiornare non li tocca. Tutte le spiegazioni: nella {b}.",{b:"<b>Guida</b>"})}</div></div>`;
    {const sn=snapshots();
   h+=`<div class="card"><h2>${tr("Ripristino di emergenza")}</h2>
   <div class="hint">${trh("Nuvia conserva una {b} a ogni avvio giornaliero e prima di ogni operazione che li sovrascrive. Se qualcosa va storto, torni indietro da qui. Tutto resta su questo dispositivo.",{b:"<b>"+tr("copia completa dei tuoi dati")+"</b>"})}</div>`;
   if(!sn.length)h+=`<div class="hint">${tr("La prima copia si crea al prossimo avvio.")}</div>`;
   else sn.forEach((x,i)=>{
     h+=`<div class="wline"><span>${new Date(x.at).toLocaleString(dataLoc())}<br>
       <small style="color:var(--grigio)">v${esc(x.v||"?")}${x.w?" · "+x.w+" kg":""}</small></span>
       <span style="display:flex;gap:8px">
         <button class="btn ghost small" style="margin:0" onclick="restoreSnap(${i})">${tr("Ripristina")}</button>
         <button class="ibtn" title="${tr("Elimina questa copia")}" onclick="delSnap(${i})"></button></span></div>`;});
   h+=`<div class="mtools" style="margin-top:8px"><button class="btn ghost small" onclick="snapSave('manuale');render('io');toast(tr('Copia creata ✓'))">${tr("Crea una copia adesso")}</button>
   ${sn.length?`<button class="btn ghost small" onclick="delAllSnaps()">${tr("Elimina tutte le copie")}</button>`:""}</div></div>`;}
  {const st=S.streak||{},ws=(S.profile.weights||[]).length,pr=(S.periods||[]).length;
   h+=`<div class="card"><h2>Pulizia selettiva</h2>
   ${hint2(tr("Azzera <b>solo</b> quello che scegli, tenendo intatto tutto il resto:"),tr("Profilo, piano, regole e caratteristiche non vengono toccati. Prima di procedere viene creata un'istantanea, quindi si può tornare indietro dal <b>Ripristino di emergenza</b>."))}
   <label>${tr("Cosa vuoi azzerare")}</label>
   <label class="ckline"><input type="checkbox" id="clStreak"> ${tr("Serie di giorni in target")} <small>(ora: ${st.count||0})</small></label>
   <label class="ckline"><input type="checkbox" id="clPeriods"> ${tr("Periodi dieta/libero")} <small>(${tr("ora:")} ${pr})</small></label>
   <label class="ckline"><input type="checkbox" id="clWeights"> Pesate e biometriche <small>(ora: ${ws})</small></label>
   <label class="ckline"><input type="checkbox" id="clWeek"> ${tr("Settimana in corso")} <small>(spunte, extra…)</small></label>
   <label class="ckline"><input type="checkbox" id="clHistory"> ${tr("Settimane archiviate")} <small>(ora: ${(S.history||[]).length})</small></label>
   <label class="ckline"><input type="checkbox" id="clEvents"> Eventi e giornate particolari</label>
   <label class="ckline"><input type="checkbox" id="clShop"> ${tr("Lista della spesa")}</label>
   <label class="ckline"><input type="checkbox" id="clRecipes"> ${ic("star",16)} Piatti salvati <small>(ora: ${(S.recipes||[]).length})</small></label>
   <label>Periodo</label>
   Vale per pesate, settimane archiviate ed eventi.
   <div class="mtools" style="margin-top:0">
     <button class="chipbtn clchip on" data-k="tutto" onclick="cleanupRange('tutto')">${tr("Tutto")}</button>
     <button class="chipbtn clchip" data-k="oggi" onclick="cleanupRange('oggi')">Oggi</button>
     <button class="chipbtn clchip" data-k="settimana" onclick="cleanupRange('settimana')">${tr("Settimana")}</button>
     <button class="chipbtn clchip" data-k="mese" onclick="cleanupRange('mese')">Mese</button>
   </div>
   <div class="hint" style="margin-top:8px">Periodo scelto: <b id="clRangeLbl">${tr("tutto lo storico")}</b> ${tr("— oppure imposta due date qui sotto.")}</div>
   <div class="grid2 g2fix">
     <div><label>Dal</label><input type="date" id="clFrom" onchange="document.getElementById('clRangeLbl').textContent=this.value?('dal '+this.value.split('-').reverse().join('/')+(document.getElementById('clTo').value?' al '+document.getElementById('clTo').value.split('-').reverse().join('/'):'')):'tutto lo storico'"></div>
     <div><label>Al</label><input type="date" id="clTo" onchange="document.getElementById('clRangeLbl').textContent=(document.getElementById('clFrom').value?'dal '+document.getElementById('clFrom').value.split('-').reverse().join('/')+' ':'fino ')+('al '+this.value.split('-').reverse().join('/'))"></div>
   </div>
   <div class="hint">${trh("Serie, settimana in corso e lista della spesa si azzerano {b1}: non dipendono da una data.",{b1:"<b>"+tr("sempre per intero")+"</b>"})}</div>
   <button class="btn ghost warn" onclick="cleanupRun()">${tr("Esegui la pulizia")}</button></div>`;}
  h+=`<div class="card"><h2>Dati d'uso anonimi</h2>
  ${hint2(tr("Mi mandi le statistiche di quanto usi Nuvia? <b>Nessun dato personale o della tua dieta.</b>"),tr("Serve a rispondere a una domanda sola: dopo quanti giorni le persone smettono? È l'unico modo per capire cosa non va e migliorarlo. Non escono peso, cibo, nome, note o dati di salute — solo i numeri che vedi qui sotto. Puoi spegnerlo quando vuoi e l'app funziona identica."))}
  <div class="ckgrid">
    <label class="ck"><input type="radio" name="telOn" ${telOn()?"checked":""} onchange="telSet(true)"> ${tr("Sì, invia")}</label>
    <label class="ck"><input type="radio" name="telOn" ${S.tel.on===false?"checked":""} onchange="telSet(false)"> ${tr("No, non inviare")}</label>
  </div>
  ${S.tel.on===null?`<div class="hint" style="background:var(--zaffbg);padding:8px 12px;border-radius:12px">${trh("Non hai ancora scelto: finché non lo fai, {b}.",{b:"<b>"+tr("non viene inviato nulla")+"</b>"})}</div>`:""}
  <label>${tr("Indirizzo di raccolta (facoltativo)")}</label>
  <input type="text" id="telUrl" value="${esc((S.tel&&S.tel.url)||"")}" placeholder="https://script.google.com/…/exec">
  <div class="mtools"><button class="btn ghost small" onclick="telUrlSave()">${tr("Salva indirizzo")}</button></div>
  ${hint2(tr("Senza indirizzo non parte niente da solo: resta il pulsante «Mandali», che apre la tua posta."),tr("Con un indirizzo di raccolta l'invio diventa automatico, una volta al giorno e in sottofondo, e l'invito ogni 30 giorni non compare più. Serve uno script su Google Apps Script: chiedilo allo sviluppatore, sono cinque minuti di configurazione."))}
  <label>${tr("Cosa esce, esattamente")}</label>
  <div class="aibox" aria-live="polite" style="display:block;font-family:ui-monospace,monospace;font-size:11.5px;white-space:pre-wrap">${esc(JSON.stringify(telPayload(),null,2))}</div>
  ${hint2(tr("Questo è il pacchetto reale, generato adesso con i tuoi dati."),tr("Se ci trovi qualcosa che non dovrebbe esserci, è un difetto: segnalalo."))}
  <div class="mtools"><button class="btn ghost small" onclick="telMail()">Mandalo a mano ora</button></div>
  ${hint2(((S.tel.url||TEL_URL)?"Con «Sì, invia» parte da solo una volta al giorno: non devi fare nulla.":tr("L'invio automatico non è ancora attivo: per ora puoi mandarlo a mano con il pulsante qui sopra.")),
   tr("Il pulsante Email apre la tua app di posta con il pacchetto già scritto: parte solo se premi invia. Serve se vuoi segnalare qualcosa e allegare i numeri d'uso."))}
  </div>`;
  /* i messaggi dello studio stanno PRIMA dell'aiuto: se qualcuno ti
     ha scritto, è la cosa più importante di questa pagina */
  h+=(typeof turnoHTML==="function")?turnoHTML():"";
  h+=(typeof studioMsgHTML==="function")?studioMsgHTML():"";
  h+=(typeof prepHTML==="function")?prepHTML():"";
  h+=(typeof ordineHTML==="function")?ordineHTML():"";
  h+=(typeof usoHTML==="function")?usoHTML():"";
  h+=`<div class="gsec">Aiuto</div>`;
  /* Bug e proposte vivono nella stessa scheda (modulo 40): sono lo
     stesso gesto — una persona che si ferma e ti scrive — e due
     strade diverse confondevano soltanto. */
  h+=(typeof segnalazioniHTML==="function")?segnalazioniHTML():"";
  // AI
  el.innerHTML=h;}

window.toggleVacanza=()=>{
  const eraAttiva=!!S.ui.vacanza;
  S.ui.vacanza=!eraAttiva;
  if(S.ui.vacanza){S.ui.vacanzaInizio=iso(new Date());S.ui.vacanzaFine=null;}
  else{S.ui.vacanzaFine=iso(new Date());}
  save();
  /* si ridisegna la pagina in cui sei: da «La giornata» non cambiava nulla */
  render(cur);
  if(S.ui.vacanza)
    toast(tr("Vacanza attiva · si mangia a fabbisogno, la serie è in pausa"));
  else{
    /* Chi chiude la vacanza va rassicurato SUBITO, non scoprire da sé
       che il deficit è tornato pieno: si dice cosa accadrà. */
    /* Non serve un undo dedicato: ogni save() rende annullabile
       l'ultima azione (vedi ANNULLA in 11_stato), quindi «Annulla»
       riapre la vacanza da sé. */
    toast(trh("Bentornato · per {v1} giorni riprendo piano piano, senza fretta",{v1:GIORNI_RIENTRO}));}};
/* (rimosso duplicato legacy di saveDiet che sovrascriveva quello vero) */
/* BMI dell'obiettivo e classificazione (salubrità) */
function bmiFor(w){const h=S.profile.h;if(!h||!w)return null;return Math.round(w/Math.pow(h/100,2)*10)/10;}
function bmiClass(b){if(b==null)return{ok:true,label:"—",msg:""};
  if(b<16)return{ok:false,label:"gravemente sottopeso",msg:"È un peso a rischio per la salute: sconsigliato."};
  if(b<18.5)return{ok:false,label:"sottopeso",msg:"Sotto la soglia sana: valuta un obiettivo un po' più alto."};
  if(b<25)return{ok:true,label:"normopeso",msg:"Rientra nella fascia sana."};
  if(b<30)return{ok:true,label:"sovrappeso",msg:"Ancora sopra la fascia normopeso: obiettivo sensato."};
  if(b<35)return{ok:true,label:"obesità I",msg:""};
  if(b<40)return{ok:true,label:"obesità II",msg:""};
  return{ok:true,label:"obesità III",msg:""};}
window.addGoalWk=()=>{S.profile.goalWorkoutList=S.profile.goalWorkoutList||[];S.profile.goalWorkoutList.push({sport:allSports()[0].name,perWeek:1,min:30});save();render("io");};
window.delGoalWk=(i)=>{S.profile.goalWorkoutList.splice(i,1);save();render("io");};
window.setGoalWk=(i,f,v)=>{const g=(S.profile.goalWorkoutList||[])[i];if(!g)return;
  g[f]=(f==="sport")?v:Math.max(1,parseInt(v,10)||(f==="min"?30:1));save();render("io");};
/* Salvataggi separati: ognuno tocca solo i suoi campi, così modificare
   l'altezza non registra una pesata e viceversa. */
function _v(id){const e=document.getElementById(id);return e?String(e.value).trim():"";}
window.saveAnagrafica=()=>{const p=S.profile;
  p.name=_v("pName");p.gender=_v("pGen")||"m";p.dob=_v("pDob");
  p.h=+_v("pH")||p.h||"";
  /* Cambiando il nome cambia anche la prima voce della barra: senza
     questo, la barra restava col nome vecchio fino al ricaricamento. */
  save();try{if(typeof rifaiTabs==="function")rifaiTabs();}catch(e){}
  render("io");toast(tr("Anagrafica salvata ✓"));};
window.saveObiettivi=async()=>{const p=S.profile;
  const raw=String(_v("pGoal")||"").trim(),g=parseFloat(raw.replace(",","."));
  const prev=goalWeightSet();
  if(raw===""){
    /* campo vuoto: l'obiettivo NON si cancella da solo, si chiede */
    if(prev&&!await dlgConfirm(tr("Il campo «Obiettivo peso» è vuoto ma hai un obiettivo impostato ({n} kg).",{n:prev})+"\n\nLo tolgo o lo lascio com'è?",
      {ok:tr("Lascia {n} kg",{n:prev}),ko:tr("Togli l'obiettivo")}))clearGoalWeight();
  }else{
    /* La validazione NON si riscrive qui: la fa il portone, che è lo
       stesso per gli Obiettivi, per le Regole e per il percorso
       guidato. Prima questa pagina ricontrollava 20/350 per conto suo
       e le altre no: tre porte, tre metri diversi. */
    goalWeightApplica(raw,{zitto:true});
  }
  const w=parseFloat(_v("pWater"));p.waterGoalL=w>0?w:null;
  save();render("io");toast(tr("Obiettivi salvati ✓"));};
window.saveAttivita=()=>{const p=S.profile;
  p.act=parseFloat(_v("pAct"))||1.3;
  p.baseSteps=Math.max(0,parseInt(_v("pBaseSteps"))||3000);
  save();render("io");toast(tr("Attività salvata ✓ · fabbisogno ora {k} kcal",{k:tdee()}));};
/* La pesata è l'unico salvataggio che AGGIUNGE una riga allo storico. */
/* Il piano viene costruito su un certo peso. Scendendo, il fabbisogno cala:
   con lo stesso piano il deficit si assottiglia e il calo rallenta. Qui si
   controlla lo scarto e si propone (mai in automatico) di rifare i conti. */
const PLANW_TRIGGER=3;            /* kg di scarto oltre i quali vale la pena */
function planWeightDrift(){
  const base=+S.planW||0,now=+S.profile.w||0;
  if(!base||!now)return 0;
  return Math.round((base-now)*10)/10;}
/* ── COME IL PIANO LEGGE I PROGRESSI ──────────────────────────────
   La stessa variazione di peso significa cose opposte a seconda
   dell'obiettivo: due chili in più sono una deriva per chi voleva
   perdere e il risultato atteso per chi voleva crescere.
   Prima la frase era una sola e parlava sempre di «deficit»: a chi
   mette massa l'app diceva «il deficit è aumentato più del
   previsto», cioè segnalava come uno scostamento una cosa andata
   esattamente come doveva.
   `giu` significa che il peso è SCESO. Scendendo il fabbisogno cala,
   quindi con lo stesso piano il deficit si assottiglia e il surplus
   si allarga; salendo accade il contrario.                        */
function derivaFrase(giu){
  const g=(S.profile.goal||"").toLowerCase();
  if(/mantenimento/.test(g))
    return giu?tr("Con il piano di prima mangeresti sopra il fabbisogno di adesso.")
              :tr("Con il piano di prima mangeresti sotto il fabbisogno di adesso.");
  if(/massa|aument/.test(g))
    return giu?tr("Con il piano di prima il surplus è aumentato.")
              :tr("Con il piano di prima il surplus si è ridotto e la crescita rallenta.");
  return giu?tr("Con il piano di prima il deficit si è ridotto e il calo rallenta.")
            :tr("Con il piano di prima il deficit è aumentato.");}
window.checkPlanAge=async()=>{
  const d=planWeightDrift();
  if(Math.abs(d)<PLANW_TRIGGER)return;
  if(planIsEmpty())return;
  const key="planw_"+Math.round(S.profile.w);
  if(S.ui&&S.ui[key])return;                       /* già chiesto per questo peso */
  S.ui=S.ui||{};S.ui[key]=1;save();
  const oldT=Math.round(bmrForWeight(+S.planW)*(+S.profile.act||1.3));
  const newT=tdee(),diff=oldT-newT;
  const giu=d>0;
  const msg=" "+(giu?tr("Hai perso {d} kg da quando è stato costruito questo piano ({a} kg → {b} kg).",{d:d,a:S.planW,b:S.profile.w})
         :tr("Sei salito di {d} kg da quando è stato costruito questo piano ({a} kg → {b} kg).",{d:Math.abs(d),a:S.planW,b:S.profile.w}))+
    "\n\n"+tr("Il fabbisogno cambia con il peso: adesso è di ~{n} kcal al giorno invece di ~{o} ({d} kcal).",{n:newT,o:oldT,d:(diff>0?"−":"+")+Math.abs(diff)})+" "+derivaFrase(giu)+
    "\n\n"+tr("Il target aggiornato sarebbe ~{k} kcal al giorno.",{k:dayTargetK()})+
    "\n\nPosso ritarare le grammature del piano attuale sui nuovi numeri, tenendo gli stessi piatti. Oppure lasci tutto com'è: i calcoli del diario usano comunque il peso di oggi.";
  if(!await dlgConfirm(msg,{ok:tr("Ritara il piano"),ko:tr("Lascia com'è")}))return;
  if(!aiOn())return dlgAlert(tr("Per ritarare serve la chiave AI. Puoi comunque rigenerare il piano a mano dal Piano."));
  if(await retunePlan()){S.planW=S.profile.w;save();await genShop(true);return planForecast(true,true);}
};
/* ── LO STUDIO ───────────────────────────────────────────────────────
   Quello che misura un professionista — nutrizionista, centro dimagrimento,
   palestra — e che a casa non si può prendere da soli: pliche, circonferenze,
   composizione corporea, e le sue note. Non è un doppione della pesata:
   è la fotografia periodica fatta da chi ha gli strumenti.
   La stessa scheda funziona a casa in versione ridotta: le pliche sole
   spariscono, perché nessuno se le prende addosso da solo. */
const PLICHE=[["tri","tricipite"],["sotto","sottoscapolare"],["sovra","sovrailiaca"],["addo","addominale"],["cosc","coscia"]];
const CIRCONF=[["vita","vita"],["fianchi","fianchi"],["torace","torace"],["braccio","braccio"],["coscia","coscia"],["polpaccio","polpaccio"]];
function visite(){S.studio=S.studio||{visite:[],pro:""};if(!Array.isArray(S.studio.visite))S.studio.visite=[];return S.studio.visite;}
window.studioSalva=()=>{
  const n=(id)=>{const v=parseFloat((document.getElementById(id)||{}).value);return isFinite(v)&&v>0?v:null;};
  const t=(id)=>{const v=((document.getElementById(id)||{}).value||"").trim();return v||null;};
  const rec={d:iso(new Date()),
    fat:n("stFat"),mus:n("stMus"),acqua:n("stAcqua"),ossa:n("stOssa"),
    bmr:n("stBmr"),pa:t("stPa"),
    pliche:{},circ:{},note:t("stNote"),pro:t("stPro")};
  PLICHE.forEach(([k])=>{const v=n("stP_"+k);if(v)rec.pliche[k]=v;});
  CIRCONF.forEach(([k])=>{const v=n("stC_"+k);if(v)rec.circ[k]=v;});
  const pieno=rec.fat||rec.mus||rec.acqua||rec.bmr||Object.keys(rec.pliche).length||Object.keys(rec.circ).length||rec.note;
  if(!pieno)return dlgAlert(tr("Non c'è niente da salvare: compila almeno una misura o una nota."));
  const v=visite();
  const oggi=v.findIndex(x=>x.d===rec.d);
  if(oggi>=0)v[oggi]=Object.assign({},v[oggi],rec); else v.push(rec);
  v.sort((a,b)=>a.d<b.d?-1:1);
  /* la composizione corporea aggiorna anche il profilo: è lo stesso dato */
  if(rec.fat)S.profile.fatp=rec.fat;
  if(rec.mus)S.profile.musp=rec.mus;
  if(rec.pro)S.studio.pro=rec.pro;
  save();render(cur);
  toast(tr("Visita registrata"));};
window.studioDel=(i)=>{const v=visite();v.splice(i,1);save();render(cur);};

/* Il confronto fra due visite: la cosa che un professionista guarda per prima. */
function studioDelta(){
  const v=visite();
  if(v.length<2)return null;
  const a=v[v.length-2],b=v[v.length-1];
  const d=(x,y)=>(x!=null&&y!=null)?Math.round((y-x)*10)/10:null;
  const sommaPliche=(r)=>{const k=Object.keys(r.pliche||{});return k.length?k.reduce((s,x)=>s+r.pliche[x],0):null;};
  return {da:a.d,a:b.d,
    fat:d(a.fat,b.fat),mus:d(a.mus,b.mus),acqua:d(a.acqua,b.acqua),
    pliche:d(sommaPliche(a),sommaPliche(b)),
    vita:d((a.circ||{}).vita,(b.circ||{}).vita)};}

/* Quello che l'AI riceve per l'analisi grande: misure + note del professionista. */
/* La scheda. In modalità «studio» ci sono le pliche; a casa no — e lo
   diciamo, invece di lasciare campi che nessuno può compilare. */
function studioCardHTML(){
  const pro=(S.studio&&S.studio.pro)||"";
  const modo=(S.ui&&S.ui.studioPro)?"pro":"casa";
  const v=visite();
  const num=(id,lab,unita,val)=>`<div><label>${tr(lab)}</label>
    <input type="number" inputmode="decimal" step="0.1" id="${id}" value="${val!=null?val:""}" placeholder="${unita}"></div>`;
  const u=v.length?v[v.length-1]:{};
  let h=`<div class="card"><h2>${tr("Misure dello studio")}</h2>
  ${hint2(tr("Le misure che prende un professionista — nutrizionista, centro dimagrimento, palestra — e le sue note."),tr("Entrano nell'analisi insieme al piano, agli allenamenti e a come stai."))}
  <label class="ckline"><input type="checkbox" ${modo==="pro"?"checked":""} onchange="S.ui.studioPro=this.checked;save();render(cur)"> ${tr("Sto usando gli strumenti dello studio (pliche, impedenziometro)")}</label>
  <div class="grid2" style="margin-top:12px">
    ${num("stFat","Massa grassa","%",u.fat)}
    ${num("stMus","Massa magra","%",u.mus)}
    ${num("stAcqua","Acqua corporea","%",u.acqua)}
    ${num("stBmr","Metabolismo misurato","kcal",u.bmr)}
  </div>
  <label>${tr("Circonferenze")} <small style="font-weight:400;color:var(--grigio)">cm</small></label>
  <div class="grid2">${CIRCONF.map(([k,lab])=>num("stC_"+k,lab,"cm",(u.circ||{})[k])).join("")}</div>`;
  if(modo==="pro"){
    h+=`<label>${tr("Pliche")} <small style="font-weight:400;color:var(--grigio)">mm</small></label>
    <div class="grid2">${PLICHE.map(([k,lab])=>num("stP_"+k,lab,"mm",(u.pliche||{})[k])).join("")}</div>
    <div class="grid2">
      <div><label>${tr("Pressione")}</label><input type="text" id="stPa" value="${esc(u.pa||"")}" placeholder="120/80"></div>
      <div><label>${tr("Chi ti segue")}</label><input type="text" id="stPro" value="${esc(pro)}" placeholder="${esc(tr("nome dello studio"))}"></div>
    </div>
    <label>${tr("Note della visita")}</label>
    <textarea id="stNote" rows="3" placeholder="${esc(tr("es. ridurre il sale, aumentare le proteine a colazione, rivedere fra 4 settimane"))}">${esc(u.note||"")}</textarea>`;
  }else{
    h+=`${hint2(tr("Le pliche e le note della visita compaiono attivando la spunta qui sopra:"),tr("Da soli non si prendono, servono le pinze e una mano esperta."))}`;}
  h+=`<div class="mtools"><button class="btn ghost small" onclick="studioSalva()">${tr("Registra la visita")}</button></div>`;
  const d=studioDelta();
  if(d)h+=`<div class="hint" style="margin-top:12px;border-left:4px solid var(--salvia);padding-left:12px">
    <b>${tr("Dal")} ${d.da} ${tr("a oggi")}</b><br>${[
      d.fat!=null?tr("grasso")+" "+(d.fat>0?"+":"")+d.fat+"%":"",
      d.mus!=null?tr("magra")+" "+(d.mus>0?"+":"")+d.mus+"%":"",
      d.pliche!=null?tr("somma pliche")+" "+(d.pliche>0?"+":"")+d.pliche+" mm":"",
      d.vita!=null?tr("vita")+" "+(d.vita>0?"+":"")+d.vita+" cm":""].filter(Boolean).join(" · ")}</div>`;
  if(v.length)h+=`<label style="margin-top:16px">${tr("Visite")} · ${v.length}</label>
    <div class="pantry">${v.slice().reverse().slice(0,8).map((x,k)=>
      `<span class="pchip">${x.d}${x.fat!=null?" · "+x.fat+"%":""}<button onclick="studioDel(${v.length-1-k})" aria-label="${esc(tr("Togli"))}">×</button></span>`).join("")}</div>`;
  if(aiOn())h+=`<div class="mtools"><button class="btn small" onclick="studioAI()">${tr("Analisi completa")}</button></div>
    <div class="aibox" aria-live="polite" id="studioOut" style="display:none"></div>`;
  return h+`</div>`;}

/* L'analisi grande: misure + piano + allenamenti + come stai, insieme. */
window.studioAI=async()=>{
  if(!aiOn())return aiFail(new Error("nokey"));
  const box=document.getElementById("studioOut");
  box.style.display="block";genBoxMostra(box);box.textContent=tr("Metto insieme tutto…");
  try{
    const t=await aiAsk("Analizza il percorso di questa persona incrociando TUTTI i dati che seguono."+
      studioForAI()+" "+rulesForAI()+
      (typeof schemiForAI==="function"?schemiForAI():"")+
      " Dimmi: 1) cosa sta funzionando davvero (con il dato che lo dimostra); 2) cosa non torna e perché "+
      "(per esempio peso fermo ma pliche in calo = ricomposizione, non stallo); 3) UNA cosa da aggiustare, concreta. "+
      "REGOLE: se ci sono note del professionista, hanno la precedenza su qualsiasi tua proposta e non vanno contraddette. "+
      "Non fare diagnosi. Se un dato manca, dillo invece di stimarlo. Massimo 12 righe, testo semplice, niente markdown.");
    box.textContent=t;
  }catch(e){box.textContent="";aiFail(e);}};
function studioForAI(){
  const v=visite();
  if(!v.length)return "";
  const u=v[v.length-1];
  const p=[];
  if(u.fat!=null)p.push("massa grassa "+u.fat+"%");
  if(u.mus!=null)p.push("massa magra "+u.mus+"%");
  if(u.acqua!=null)p.push("acqua corporea "+u.acqua+"%");
  if(u.bmr!=null)p.push("metabolismo misurato "+u.bmr+" kcal");
  const pl=Object.keys(u.pliche||{});
  if(pl.length)p.push("pliche (mm): "+pl.map(k=>k+" "+u.pliche[k]).join(", "));
  const ci=Object.keys(u.circ||{});
  if(ci.length)p.push("circonferenze (cm): "+ci.map(k=>k+" "+u.circ[k]).join(", "));
  if(u.pa)p.push("pressione "+u.pa);
  let t=trh(" MISURE DELLO STUDIO del {v1}: ",{v1:u.d})+p.join("; ")+".";
  if(u.note)t+=trh(" NOTE DEL PROFESSIONISTA: {v1} (sono indicazioni di chi la segue: rispettale, non contraddirle).",{v1:u.note});
  const dl=studioDelta();
  if(dl)t+=trh(" RISPETTO ALLA VISITA PRECEDENTE ({v1}): ",{v1:dl.da})+
    [dl.fat!=null?"grasso "+(dl.fat>0?"+":"")+dl.fat+"%":"",
     dl.mus!=null?"magra "+(dl.mus>0?"+":"")+dl.mus+"%":"",
     dl.pliche!=null?"somma pliche "+(dl.pliche>0?"+":"")+dl.pliche+" mm":"",
     dl.vita!=null?"vita "+(dl.vita>0?"+":"")+dl.vita+" cm":""].filter(Boolean).join(", ")+".";
  return t;}
window.saveWeighIn=()=>{const p=S.profile;
  const wIn=parseFloat(_v("pW"));
  const nw=wIn>0?wIn:(parseFloat(p.w)>0?parseFloat(p.w):null);
  if(!nw)return dlgAlert(tr("Inserisci almeno il peso."));
  const fat=parseFloat(_v("pFat"))||null,mus=parseFloat(_v("pMus"))||null;
  const pa=_v("pPa")||null,spo2=parseInt(_v("pSpo2"))||null;
  p.w=nw;if(fat)p.fatp=fat;if(mus)p.musp=mus;
  p.weights=p.weights||[];
  const today=iso(new Date());
  const rec={d:today,w:nw,fat:fat||null,mus:mus||null,pa:pa,spo2:spo2};
  const same=p.weights.findIndex(x=>x.d===today);
  if(same>=0)p.weights[same]=Object.assign({},p.weights[same],rec);
  else p.weights.push(rec);
  p.weights.sort((a,b)=>a.d<b.d?-1:1);
  /* il contesto PRIMA del numero: se sei nella fase in cui il corpo
     trattiene acqua, quel +1 kg arriva già spiegato. Senza questa
     riga il numero sembra un fallimento, e mezzo mondo molla lì. */
  let notaCiclo=null;
  try{
    const prec=p.weights.filter(x=>x.d<today).slice(-1)[0];
    const delta=prec?(nw-(+prec.w||0)):0;
    /* prima si guarda se si torna da una pausa: quel numero ha
       bisogno di contesto più di ogni altro */
    if(typeof rientroNotaPeso==="function")notaCiclo=rientroNotaPeso(
      (typeof rientroDelta==="function"&&rientroDelta())||delta);
    if(!notaCiclo&&prec&&typeof cicloNotaPeso==="function")notaCiclo=cicloNotaPeso(delta);
  }catch(e){}
  save();render("io");
  toast(tr("Pesata registrata ✓ {n} kg",{n:nw}));
  if(notaCiclo)setTimeout(()=>toast(notaCiclo),1800);
  setTimeout(()=>{try{checkPlanAge();}catch(e){}},600);};
   // compatibilità
/* Modifica di una pesata già registrata: si possono correggere i valori o
   aggiungere quelli che mancavano, anche molto dopo. */
window.editWeight=async i=>{
  const W=S.profile.weights||[],x=W[i];if(!x)return;
  const gg=giornoDa(x.d).toLocaleDateString(dataLoc());
  const ask=async (lbl,cur,unit)=>{
    const v=await dlgPrompt(tr("Pesata del {g} — {l}{u}",{g:gg,l:lbl,u:(unit?" ("+unit+")":"")})+"\n\nLascia vuoto per non registrare nulla; scrivi «-» per cancellare il valore.",
      cur!=null&&cur!==""?String(cur):"");
    if(v===null)return {abort:true};
    const t=String(v).trim();
    if(t==="")return {keep:true};
    if(t==="-")return {val:null};
    return {val:t};};
  const kg=await ask("peso","","kg");if(kg.abort)return;
  if(kg.val!=null&&!kg.keep){const n=parseFloat(String(kg.val).replace(",","."));
    if(!(n>20&&n<400))return dlgAlert(tr("Peso non valido: la pesata resta come era."));
    x.w=Math.round(n*10)/10;}
  const fat=await ask("massa grassa",x.fat,"%");if(fat.abort)return;
  if(!fat.keep)x.fat=fat.val==null?null:(parseFloat(String(fat.val).replace(",","."))||null);
  const mus=await ask("massa muscolare",x.mus,"%");if(mus.abort)return;
  if(!mus.keep)x.mus=mus.val==null?null:(parseFloat(String(mus.val).replace(",","."))||null);
  const pa=await ask("pressione","",x.pa?"":"es. 120/80");if(pa.abort)return;
  if(!pa.keep)x.pa=pa.val==null?null:String(pa.val);
  const sp=await ask("saturazione",x.spo2,"%");if(sp.abort)return;
  if(!sp.keep)x.spo2=sp.val==null?null:(parseInt(sp.val)||null);
  /* se è l'ultima pesata, l'app allinea anche il peso corrente del profilo */
  const isLast=(i===W.length-1);
  if(isLast){S.profile.w=x.w;if(x.fat)S.profile.fatp=x.fat;if(x.mus)S.profile.musp=x.mus;}
  save();render("io");toast(tr("Pesata del {g} aggiornata ✓",{g:gg}));};
window.delWeight=async i=>{
  const W=S.profile.weights||[],x=W[i];if(!x)return;
  const gg=giornoDa(x.d).toLocaleDateString(dataLoc());
  if(!await dlgConfirm(tr("Elimino la pesata del {g} ({n} kg)?\n\nSparisce dai grafici e dai calcoli che la usano. Le altre pesate restano.",{g:gg,n:x.w}),
    {ok:tr("Elimina"),ko:tr("No")}))return;
  W.splice(i,1);save();render("io");toast(tr("Pesata eliminata ✓"));};
window.saveAI=()=>{
  S.ai.key=document.getElementById("gKey").value.trim();
  S.ai.model=document.getElementById("gModel").value;
  save();dlgAlert(S.ai.key?tr("Impostazioni Gemini salvate: funzioni AI attive."):tr("Chiave rimossa."));render(cur);};
window.exportData=()=>{const blob=new Blob([JSON.stringify(S)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);
  a.download="diario_backup_"+iso(new Date())+".json";a.click();};
window.importData=()=>{const inp=document.createElement("input");inp.type="file";inp.accept=".json";
  inp.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
    r.onload=()=>{try{S=JSON.parse(r.result);save();location.reload();}catch(x){dlgAlert(tr("File non valido."));}};r.readAsText(f);};inp.click();};
window.wipeAll=async()=>{if(!(await dlgConfirm(tr("Cancellare DAVVERO tutto su QUESTO dispositivo?"),{ok:tr("Cancella tutto"),ko:tr("No")})&&await dlgConfirm(tr("Sicuro? Non si torna indietro."),{ok:tr("Sì, cancella"),ko:tr("No")})))return;
  let alsoDrive=false;
  if(DTOKEN&&S.drive.on){
    alsoDrive=await dlgConfirm(tr("Vuoi eliminare ANCHE il backup su Google Drive?\n\nOK = elimina il backup: i dati spariscono da TUTTI i dispositivi collegati.\nAnnulla = azzera solo questo dispositivo; il backup su Drive e gli altri dispositivi restano intatti."));
    if(alsoDrive)await driveDelete(true);
  }
  // Se NON elimino il backup remoto, scollego questo dispositivo così, ricominciando
  // da zero, non ricarico né sovrascrivo i dati che vivono su Drive (e sugli altri dispositivi).
  if(!alsoDrive){driveClearToken();try{localStorage.removeItem(SYNCED_ONCE_KEY);}catch(e){}}
  /* ═══ CANCELLARE TUTTO VUOL DIRE TUTTO ═════════════════════════
     DIFETTO TROVATO IL 19/08/2026: qui si cancellavano DUE chiavi su
     diciannove. Restavano sul telefono le preparazioni, l'ordine
     delle schede, i turni, il contatore dei gesti, le schede partner,
     le storie della piazza, i commensali della cucina.
     Chi chiede di cancellare tutto ha diritto a tutto — e a maggior
     ragione qui, dove il posizionamento è «i tuoi dati restano tuoi».
     Un «cancella tutto» che lascia in giro dei resti è la promessa
     più facile da smentire.

     Si cancella per PREFISSO invece che per elenco: un elenco va
     aggiornato ogni volta che si aggiunge una chiave, e quello è
     esattamente il passaggio che si dimentica (l'ho dimenticato sei
     volte in questa sessione). Il prefisso non si dimentica. */
  try{
    const nostre=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k&&(k.indexOf("nuvia_")===0||k.indexOf("diarioDieta")===0||
             k.indexOf("diario_")===0||k.indexOf("nutri_")===0))nostre.push(k);}
    nostre.forEach(k=>{try{localStorage.removeItem(k);}catch(e){}});
  }catch(e){
    /* se qualcosa va storto, almeno lo stato principale se ne va */
    try{localStorage.removeItem(KEY);}catch(_){}}
  location.reload();};

