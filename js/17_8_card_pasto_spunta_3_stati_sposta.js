/* ═══════════════════════════════════════════════════════════════
   8. CARD PASTO (spunta 3 stati, spostamento giorno+fascia anche
      nello stesso giorno, modifica AI , alternativa AI )
   ═══════════════════════════════════════════════════════════════ */
function mealCard(pdi,mi){
  const m=PLAN[pdi].meals[mi],st=S.week.days[pdi].meals[mi],o=mealOpt(pdi,mi);
  const dispName=st.movedAs||m.n;
  const cls="meal "+(m.type==="free"?"free ":"")+(m.type==="mensa"?"mensa ":"")+(st.done?"done ":"")+(st.skip?"skip":"");
  const sym=st.done?"✓":(st.skip?"✗":"");
  let h=`<div class="${cls}" data-meal="${pdi}-${mi}">
    <div class="chk ${st.done?"c":""}${st.skip?" s":""}" role="button" tabindex="0" onclick="tgl(${pdi},${mi})">${sym}</div>
    <div class="mbody">
      <div class="mtop"><span class="mname tap" onclick="editMeal(${pdi},${mi})" title="${tr("Tocca per modificare")}">${esc(fascia(dispName))}${st.skip?" "+tr("(saltato)"):""}</span>${
        st.done&&!st.skip
          ? (function(){const q=qOf(st,o.d)??qPeek(o.d);return `<span class="qwrap">${qDot(q)}${q!=null?q+"%":(aiOn()?"…":"")}</span>`;})()
          : (function(){const q=qPeek(o.d);return q!=null?`<span class="qwrap" title="${tr("Qualità stimata del piatto in piano")}">${qDot(q)}${q}%</span>`:"";})()}</div>
      <div class="mdesc tap" onclick="editMeal(${pdi},${mi})" title="${tr("Tocca per modificare")}">${esc(cap(tr(o.d)))}</div>
      <div class="mkcal">~${o.k}kcal · ${o.p}g ${tr("proteine")}${o.c!=null?` · ${o.c}g ${tr("carboidrati")}`:""}${o.f!=null?` · ${o.f}g ${tr("grassi")}`:""}${o.fib!=null?` · ${o.fib}g ${tr("fibre")}`:""}${o.z!=null?` · ${o.z}g ${tr("zuccheri")}`:""} ${st.custom?'<span class="badge ai">'+tr("modificato")+'</span>':(S.permMeals[pdi+"_"+mi]&&st.opt===0?'<span class="badge ai">'+tr("alternativa fissa")+'</span>':"")}</div>`;
  h+=hungryHTML(pdi,mi);
  /* i fulmini dell'energia mancavano in Oggi (riscontro 25/08): la
     stessa domanda del Punto, sulla card del pasto da segnare */
  if(!st.done&&!st.skip)h+=energyHTML(pdi,mi);
  if(((PLAN[pdi].meals[mi]||{}).o||[]).length>1&&!st.custom){h+=`<div class="mopts">`+(m.o||[]).map((x,oi)=>
    `<button class="${oi===st.opt?"sel":""}" onclick="setOpt(${pdi},${mi},${oi})">${optLabel(x,oi)}</button>`).join("")+`</div>`;}
  h+=`<div class="mtools">
    <select aria-label="${tr("Sposta il pasto in un altro giorno")}" onchange="moveDay(${pdi},${mi},this.value)">
      <option value="-1" ${st.movedTo===-1?"selected":""}> ${giorno(PLAN[pdi].day)}</option>`;
  PLAN.forEach((d,di)=>{if(di!==pdi)h+=`<option value="${di}" ${st.movedTo===di?"selected":""}>→ ${giorno(d.day)}</option>`;});
  h+=`</select>
    <select aria-label="${tr("Sposta il pasto in un'altra fascia")}" onchange="moveSlot(${pdi},${mi},this.value)">`;
  /* Il valore che si salva resta la fascia in italiano (moveSlot lo
   confronta con m.n): si traduce solo l'etichetta, e il valore va
   scritto esplicitamente perché senza value l'option manderebbe
   indietro il testo tradotto. */
  SLOTS.forEach(s=>{h+=`<option value="${esc(s)}" ${((st.movedAs||m.n)===s)?"selected":""}>${esc(fascia(s))}</option>`;});
  /* ═══ LA RIGA «⋯» — il pilastro 3.3 ══════════════════════════
     Fino alla v13.85 qui stava una fila di SEI icone (dado, scambia,
     foto, galleria, ospite, barcode), e gli attrezzi veri erano
     DIECI: mancavano la dettatura, i commensali e la cucina guidata,
     che vivevano solo sulla scheda del «prossimo pasto» nel Punto.
     Il pilastro 3.3 chiede la riga sotto OGNI pasto e nomina proprio
     i commensali, che qui non c'erano.

     Copiare le dieci icone sotto ogni pasto voleva dire un muro di
     bottoni in Oggi: rumore, peso, e una riga che scorre di lato.
     Invece UN bottone apre `attrezziPasto` — la STESSA funzione del
     Punto, stessi handler, un solo posto da correggere. Il pilastro
     è rispettato senza il muro di icone.

     NB: il Piano (`mealCardStatic`) resta com'è, e non è una
     dimenticanza. Là i pasti sono il TEMPLATE della settimana, e
     «scatta la foto» o «sono ospite» su un pasto di giovedì
     prossimo non vogliono dire niente: là le azioni sono altre
     (alternativa permanente, ripristino) e ci sono già.         */
  /* ── GLI ATTREZZI SI VEDONO (riscontro del founder, 25/08 sera:
     «hai nascosto dentro i ⋯ le features per i pasti e non va bene»).
     Il bottone ⋯ della v13.86 era la mia lettura del pilastro; il
     founder, provandolo, ha deciso il contrario: la griglia dei dieci
     attrezzi sta SOTTO ogni pasto, visibile, come nel Punto — due
     righe da cinque, niente scorrimenti. Stessa funzione
     `attrezziPasto`, quindi sempre un posto solo da correggere. */
  h+=`</select></div>${attrezziPasto(pdi,mi)}`;
  if(st.custom)h+=`<button class="ibtn" title="${tr("Ripristina originale")}" onclick="resetMeal(${pdi},${mi})">${ic("undo",17)}</button>`;
  /* ── GLI STESSI BOTTONI DEL PUNTO (riscontro del founder, 25/08
     sera): in «Alberto» il pasto si segna con «L'ho mangiato / Non
     l'ho mangiato», in Oggi c'era solo il cerchietto a tre stati da
     scoprire. Due porte diverse per lo stesso gesto sono una in
     troppo: i bottoni ora stanno anche qui (il cerchietto resta come
     stato e scorciatoia per chi l'ha imparato). */
  if(!st.done&&!st.skip)h+=`<div class="tcta" style="margin-top:8px">
    <button class="btn small" onclick="tgl(${pdi},${mi})">${esc(tr("L'ho mangiato"))}</button>
    <button class="btn ghost small" onclick="saltaPasto(${pdi},${mi})">${esc(tr("Non l'ho mangiato"))}</button>
  </div>`;
  if(st.movedTo!==-1||st.movedAs&&st.movedAs!==m.n)h+=`<span class="badge moved">da ${giorno(PLAN[pdi].day)} · ${fascia(m.n)}</span><button class="ibtn" title="${tr("Riporta questo pasto (e quello scambiato) al giorno di origine")}" onclick="unmoveMeal(${pdi},${mi})">${ic("undo",17)}</button>`;
  h+=`</div></div></div>`;return h;}
/* `filaIconeSegna` è stata tolta nella v13.86 insieme alla fila che
   segnava. Serviva a mettere la sfumatura sul bordo destro quando le
   icone sotto un pasto uscivano dallo schermo: con un solo bottone
   «⋯» non esce più niente. Chi la chiamava (24_17) la cerca con un
   `typeof`, quindi non serve altro. Una funzione che non ha più un
   lavoro non si lascia in giro: è la prossima che qualcuno rilancia
   per sbaglio. */
/*  Analisi per-pasto: foto → l'AI ricalcola kcal e macro REALI del pasto.
   NON spunta nulla: la spunta la dai sempre tu. Dopo puoi correggere con . */
window.mealPhoto=async(pdi,mi,gal)=>{
  if(!aiOn())return aiFail(new Error("nokey"));
  const st=S.week.days[pdi].meals[mi];const o=mealOpt(pdi,mi);
  try{const ph=await anyPhoto(gal,false);
    const t=await aiAskVision('FOTO di una portata di questo pasto: "'+o.d+'". Stima dal PIATTO REALE nella foto: cosa contiene, il PESO IN GRAMMI di ogni elemento, condimenti visibili e pane compresi, usando riferimenti dimensionali (diametro del piatto 24-27 cm, larghezza di una forchetta ~2,5 cm, spessore delle fette, altezza del cumulo); riconosci il metodo di cottura perché cambia le calorie a parità di peso; se la foto non basta, dillo e dai un intervallo invece di un numero secco, kcal e macro coerenti con quei pesi. Nel campo "nome" scrivi la descrizione CON i grammi di ciascun elemento, così l\'utente può correggerli a mano, es: "riso ~150 g + salmone ~120 g + zucchine ~100 g". Rispondi SOLO JSON: {"nome":"elemento ~N g + elemento ~N g + …","kcal":numero,"prot":numero,"carb":numero,"gras":numero,"fibre":numero,"zuccheri":numero}',[ph]);
    /* ── LA RETE SUL FUORI-SCALA (v13.87) ────────────────────────
       Qui c'era `Math.round(j.kcal)` e basta: qualunque numero
       arrivasse dalla foto entrava nel diario, comprese 84.100 kcal
       e proteine negative. `portataValida` (09_guardrail) toglie i
       campi fuori scala invece di correggerli: un valore assente è
       una domanda, un valore corretto d'ufficio è una bugia.
       Senza le kcal non si può registrare niente, e conviene dirlo
       invece di scrivere uno zero che sembrerebbe un pasto vuoto. */
    const grezza=parseAIJSON(t);
    const {pulita:j,fuori}=portataValida(grezza);
    if(fuori.length&&j.kcal===undefined){
      return void dlgAlert(tr("Dalla foto è uscita una stima fuori scala, quindi non l'ho registrata. Riprova con una foto più chiara, o scrivi tu i valori.")
        +"\n\n"+fuori.join(" · "));}
    const nk=Math.round(j.kcal),np=Math.round(j.prot)||0,nc=Math.round(j.carb)||0,nf=Math.round(j.gras)||0,nfib=Math.round(j.fibre)||0,nz=Math.round(j.zuccheri)||0;
    /* Al ristorante analizzi UNA portata alla volta (primo, secondo, dolce…):
       se il pasto ha già valori da foto/barcode puoi SOMMARE la nuova portata. */
    if(st.custom&&/da foto|da barcode/.test(st.custom.d||"")){
      if(await dlgConfirm(tr("{a} — ~{b} kcal · {c} g prot\n\nQuesta portata la aggiungo a quanto già registrato ({d} kcal) oppure sostituisce il pasto?",{a:j.nome,b:nk,c:np,d:st.custom.k}),{ok:tr("Aggiungi"),ko:tr("Sostituisci")})){
        st.custom={d:st.custom.d.replace(/ \(da foto\)$/,"")+" + "+j.nome+" (da foto)",
          k:st.custom.k+nk,p:(st.custom.p||0)+np,c:(st.custom.c||0)+nc,f:(st.custom.f||0)+nf,fib:(st.custom.fib||0)+nfib,z:(st.custom.z||0)+nz};
        save();render(cur);toast(tr("Portata aggiunta al pasto ✓"));return;}}
    else{const dev=nk-o.k;
      if(!await dlgConfirm(tr(" {a}\n~{b} kcal · {c} g prot ({d}{e} kcal vs piano)\n\nI pesi sono stimati dalla foto: dopo la conferma puoi correggerli con la matita e l\'AI ricalcola.\n\nOK = registra questa portata come pasto reale (poi puoi aggiungerne altre con )",{a:j.nome,b:nk,c:np,d:(dev>=0?"+":""),e:dev})))return;}
    st.custom={d:j.nome+" (da foto)",k:nk,p:np,c:nc||null,f:nf||null,fib:nfib||null,z:nz||estSugarOf(j.nome)};
    save();render(cur);toast(tr("Pasto aggiornato dalla foto ✓ Pesi sbagliati? Correggili con "));
  }catch(e){if(e.message!=="annullato")aiFail(e);}};
window.tgl=(d,m)=>{const st=S.week.days[d].meals[m];
  const wasComplete=dayCompleted(d);
  freezeDay(d); // fissa il fabbisogno del giorno alla prima spunta
  if(!st.done&&!st.skip){st.done=true;
    try{usoSegna("pasto_spunta");}catch(e){}
    /* l'ora della spunta, con il suo grado di attendibilità: serve a
       capire se la fame di adesso è di stomaco o arriva da altrove */
    try{if(typeof orarioSegna==="function")orarioSegna(d,m);}catch(e){}
    /* il festone solo qui: si spunta, si festeggia. Togliere la
       spunta non è un errore da sottolineare. */
    try{if(typeof festone==="function"){
      const b=event&&event.target&&event.target.getBoundingClientRect&&event.target.getBoundingClientRect();
      festone(b?b.left+b.width/2:null,b?b.top:null);}}catch(e){}
    /* Il gesto più ripetuto dell'app merita una risposta: micro-rimbalzo
       sulla card + colpetto. `conferma` fa entrambi e riavvia
       l'animazione, così la seconda spunta si vede come la prima. */
    if(typeof conferma==="function")conferma(document.querySelector('[data-meal="'+d+'-'+m+'"] .chk'),12);
    else vibra(12);
    qRefreshMeal(d,m);}
  else if(st.done){st.done=false;st.skip=true;vibra([8,40,8]);}
  else st.skip=false;
  save();render(cur);
  if(!wasComplete&&dayCompleted(d)&&!S.ui.vacanza){
    if(deficitOfDay(d)>=0&&extrasKcal(d)<=300){confetti();toast(tr("Giornata chiusa in target!"));}
    else toast(tr("Giornata chiusa. Domani si riparte!"));}};
/* Extra come i pasti: ✓ mangiato → ✗ non mangiato → ✓ … (niente eliminazioni per sbaglio) */
window.tglExtra=(d,i)=>{const e=S.week.days[d].extras[i];
  e.st=(e.st==="skip")?"done":"skip";
  if(e.st!=="skip")qRefreshExtra(d,i);
  save();render(cur);};
window.editExtra=async(d,i)=>{const e=S.week.days[d].extras[i];
  const nd=await dlgPrompt(tr("Modifica l'extra:"),e.d);if(nd==null||!nd.trim())return;
  let k=e.k,p=e.p||0,j=null;
  if(aiOn()&&nd!==e.d){try{
    if(!await bingeCheck(nd,0))return;
    const t=await estimaCached(nd,{});
    /* stessa rete: se la stima è fuori scala si finisce nel ramo
       che chiede i numeri a mano, che esiste già ed è la cosa
       giusta da fare (v13.87) */
    j=portataValida(parseAIJSON(t)).pulita;
    if(j.kcal===undefined)throw new Error("stima fuori scala");
    k=Math.round(j.kcal);p=Math.round(j.prot)||0;
  }catch(_){k=parseInt(await dlgPrompt(tr("Calorie?"),e.k))||e.k;p=parseInt(await dlgPrompt(tr("Proteine (g)?"),e.p||0))||0;}}
  else if(nd!==e.d){const le=localEstimate(nd);
    if(le){k=le.kcal;p=le.prot;j={carb:le.carb,gras:le.gras,fibre:le.fibre,zuccheri:le.zuccheri};
      toast(tr("Stima dalla tabella locale (senza AI)")+(le.persi.length?tr(" — non riconosciuti: {l}",{l:le.persi.join(", ")}):""));}
    else{k=parseInt(await dlgPrompt(tr("Calorie?"),e.k))||e.k;p=parseInt(await dlgPrompt(tr("Proteine (g)?"),e.p||0))||0;}}
  Object.assign(e,{d:nd.trim(),k,p,c:j?Math.round(j.carb)||null:e.c,f:j?Math.round(j.gras)||null:e.f,fib:j?Math.round(j.fibre)||estFiberOf(nd):e.fib,z:j?Math.round(j.zuccheri)||estSugarOf(nd):estSugarOf(nd)});
  save();render(cur);};
window.extraPhotoFix=async(d,i,gal)=>{ // / Analisi sull'extra: ricalcola da foto
  if(!aiOn())return aiFail(new Error("nokey"));
  try{const ph=await anyPhoto(gal,false);
    const t=await aiAskVision('Analizza la FOTO di questo cibo. Stima il PESO IN GRAMMI di ogni elemento principale (riferimenti: dimensioni di piatto, posate, mani, confezioni visibili) e calorie e macro coerenti con quei pesi. Nel campo "nome" scrivi la descrizione CON i grammi di ciascun elemento, così l\'utente può correggerli a mano, es: "focaccia ~90 g + mortadella ~40 g". Rispondi SOLO JSON: {"nome":"elemento ~N g + elemento ~N g","kcal":numero,"prot":numero,"carb":numero,"gras":numero,"fibre":numero,"zuccheri":numero}',[ph]);
    const j=parseAIJSON(t);
    if(!await bingeCheck(j.nome,j.kcal))return;
    if(!await dlgConfirm(tr(" {a}\n~{b} kcal · ~{c} g prot\n\nI pesi sono stimati dalla foto: dopo l'aggiornamento puoi correggerli con la matita e l'AI ricalcola.\n\nOK = aggiorna l'extra con questi valori",{a:j.nome,b:Math.round(j.kcal),c:Math.round(j.prot)})))return;
    Object.assign(S.week.days[d].extras[i],{d:j.nome,k:Math.round(j.kcal),p:Math.round(j.prot),c:Math.round(j.carb)||null,f:Math.round(j.gras)||null,fib:Math.round(j.fibre)||null,z:Math.round(j.zuccheri)||estSugarOf(j.nome)});
    save();render(cur);
  }catch(e){if(e.message!=="annullato")aiFail(e);}};
window.setOpt=(d,m,o)=>{S.week.days[d].meals[m].opt=o;save();render(cur);};
/* ── SCAMBIO PASTI v5: bidirezionale e automatico ─────────────────
   Se sposti il pranzo di mercoledì alla cena di venerdì, l'app mette
   AUTOMATICAMENTE la cena di venerdì al pranzo di mercoledì: uno
   scambio solo, senza dover ricordare cosa hai preso da dove. */
function findCounterpart(toDi,slot,excludePdi,excludeMi){
  // trova il pasto che occupa (toDi, slot) in questo momento
  for(let pdi=0;pdi<7;pdi++)for(let mi=0;mi<PLAN[pdi].meals.length;mi++){
    if(pdi===excludePdi&&mi===excludeMi)continue;
    const st=S.week.days[pdi].meals[mi];const m=PLAN[pdi].meals[mi];
    const effDay=(st.movedTo!==-1&&st.movedTo!=null)?st.movedTo:pdi;
    const effSlot=st.movedAs||m.n;
    if(effDay===toDi&&effSlot===slot)return{pdi,mi};}
  return null;}
function applyMove(pdi,mi){
  const st=S.week.days[pdi].meals[mi];const m=PLAN[pdi].meals[mi];
  const toDi=(st.movedTo!==-1&&st.movedTo!=null)?st.movedTo:pdi;
  const toSlot=st.movedAs||m.n;
  if(toDi===pdi&&toSlot===m.n){save();render(cur);return;} // tornato a casa: niente scambio
  const other=findCounterpart(toDi,toSlot,pdi,mi);
  if(other){ // scambio SEMPRE automatico: mai due pasti sullo stesso slot
    const ost=S.week.days[other.pdi].meals[other.mi];
    if(!ost.done&&!ost.skip){
      ost.movedTo=(pdi===other.pdi)?-1:pdi;ost.movedAs=m.n;
      toast(tr("Scambiati: {a} ⇄ {b} (Annulla per tornare indietro)",{a:m.n,b:PLAN[other.pdi].meals[other.mi].n}));}}
  save();render(cur);}
/*  Riporta il pasto (e il suo gemello scambiato) al giorno di origine */
window.unmoveMeal=(pdi,mi)=>{
  const st=S.week.days[pdi].meals[mi];const m=PLAN[pdi].meals[mi];
  // il gemello è chi ora occupa la MIA posizione originale
  const twin=findCounterpart(pdi,m.n,pdi,mi);
  st.movedTo=-1;st.movedAs=null;
  if(twin){const tst=S.week.days[twin.pdi].meals[twin.mi];
    tst.movedTo=-1;tst.movedAs=null;} // sempre: l'altro pasto è invisibile da qui
  save();render(cur);toast(tr("Pasti riportati al giorno di origine ✓"));}
window.moveDay=(d,m,v)=>{const st=S.week.days[d].meals[m];st.movedTo=parseInt(v);
  if(!st.movedAs)st.movedAs=PLAN[d].meals[m].n;applyMove(d,m);};
window.moveSlot=(d,m,v)=>{S.week.days[d].meals[m].movedAs=v;applyMove(d,m);};
window.resetMeal=(d,m)=>{S.week.days[d].meals[m].custom=null;save();render(cur);};
/*  Modifica pasto + stima AI */
window.editMeal=(d,m)=>{
  /* Pannello con textarea: il pasto si vede TUTTO mentre lo modifichi.
     La vecchia riga singola tagliava i piatti lunghi. */
  const o=mealOpt(d,m);
  sheetShow("Modifica il pasto",`
    <textarea id="emTxt" rows="5" style="width:100%">${esc(o.d)}</textarea>
    <div class="hint">${tr("Scrivi gli ingredienti come li hai mangiati: kcal e macro si ristimano da sole. Salva anche senza cambiare nulla per ristimare.")}</div>
    <div class="mtools" style="margin-top:12px">
      <button class="btn small" onclick="editMealGo(${d},${m})">${tr("Salva e ristima")}</button>
      <button class="btn ghost small" onclick="sheetClose()">${tr("Annulla")}</button>
    </div>`);};
window.editMealGo=async(d,m)=>{
  const o=mealOpt(d,m);
  const nd=(document.getElementById("emTxt")||{}).value;
  sheetClose();
  if(nd==null||!nd.trim())return;
  let txt=nd.trim();
  /* Pasto fuori casa (libero/mensa): non lo prepari tu, quindi la
     descrizione resta indicativa e nello stesso stile corto del piano.
     Per i pasti normali il TUO testo non si tocca: le grammature che
     scrivi sono legge. */
  const fuori=(PLAN[d]&&PLAN[d].meals[m]&&(PLAN[d].meals[m].type==="free"||PLAN[d].meals[m].type==="mensa"));
  let k=o.k,p=o.p,j=null;
  if(aiOn()){
    try{
      const t=await estimaCached(txt,{fuori:fuori,campo:"piatto"});
      j=parseAIJSON(t);k=Math.round(j.kcal);p=Math.round(j.prot);
      if(fuori&&j.piatto&&String(j.piatto).trim())txt=String(j.piatto).trim();
      if(!await dlgConfirm(tr("Stima AI: ~{k} kcal · ~{p}g prot",{k:k,p:p}),{ok:tr("Va bene"),ko:tr("Correggo io")})){
        const k0=k;
        k=parseInt(await dlgPrompt(tr("Calorie?"),k))||k;
        p=parseInt(await dlgPrompt(tr("Proteine (g)?"),p))||p;
        recCorrection(txt,k0,k);   /* l'AI impara la TUA taratura */
      }
    }catch(e){aiFail(e);
      k=parseInt(await dlgPrompt(tr("Calorie?"),o.k))||o.k;p=parseInt(await dlgPrompt(tr("Proteine (g)?"),o.p))||o.p;}
  }else{const le=localEstimate(txt);
    if(le){k=le.kcal;p=le.prot;j={carb:le.carb,gras:le.gras,fibre:le.fibre,zuccheri:le.zuccheri};
      toast(tr("Stima dalla tabella locale (senza AI)")+(le.persi.length?tr(" — non riconosciuti: {l}",{l:le.persi.join(", ")}):""));}
    else{k=parseInt(await dlgPrompt(tr("Calorie?"),o.k))||o.k;p=parseInt(await dlgPrompt(tr("Proteine (g)?"),o.p))||o.p;}}
  S.week.days[d].meals[m].custom={d:txt,k,p,
    c:(j&&Math.round(j.carb))||null,f:(j&&Math.round(j.gras))||null,
    fib:(j&&Math.round(j.fibre))||estFiberOf(txt),
    z:(j&&Math.round(j.zuccheri))||estSugarOf(txt)};
  save();render(cur);};
/*  Alternativa AI con macro identici */
window.altMeal=async(d,m)=>{const o=mealOpt(d,m);
  if(!aiOn())return aiFail(new Error("nokey"));
  try{
    const slot=(PLAN[d]&&PLAN[d].meals[m]&&PLAN[d].meals[m].n)||"pasto";
    /* memoria breve per pasto: senza, «Alternativa» ripropone sempre
       le stesse 2-3 idee. La chiave è giorno_pasto, si tengono le ultime 6. */
    S.altSeen=S.altSeen||{};const akey=d+"_"+m;const visti=S.altSeen[akey]||[];
    const t=await aiAsk('Genera UN piatto completamente diverso da "'+o.d+'" ma con circa '+o.k+' kcal e '+o.p+' g di proteine. '+
      (visti.length?'Alternative GIÀ PROPOSTE in passato per questo pasto — NON riproporle né in variante simile: '+visti.join("; ")+'. ':'')+
      'IMPORTANTE: il pasto è «'+slot+'», quindi il piatto deve essere adatto a QUEL momento della giornata. '+
      'A colazione e a metà mattina si mangiano latticini, cereali, pane, frutta secca, frutta, uova, dolci da colazione — MAI carne, pesce o piatti da pranzo. '+
      'A metà pomeriggio spuntini piccoli. A pranzo e cena piatti completi. '+
      dietStr()+' Ingredienti comuni nella tradizione culinaria indicata sopra, con grammature. Rispondi SOLO JSON: {"piatto":"descrizione con grammature","kcal":numero,"prot":numero,"carb":numero,"gras":numero}');
    const j=parseAIJSON(t);
    if(!await dlgConfirm(tr("Alternativa AI:\n{p}\n~{k} kcal · ~{pr} g prot\n\nOK = usala",{p:j.piatto,k:Math.round(j.kcal),pr:Math.round(j.prot)})))return;
    const perm=await dlgConfirm(tr("Renderla FISSA anche per le prossime settimane?"),{ok:tr("Sempre"),ko:tr("Solo questa settimana")});
    const val={d:j.piatto,k:Math.round(j.kcal),p:Math.round(j.prot)};
    if(perm){S.permMeals[d+"_"+m]=val;pianoCambiato();S.week.days[d].meals[m].custom=null;S.week.days[d].meals[m].opt=0;}
    else S.week.days[d].meals[m].custom=val;
    save();render(cur);
    if(await dlgConfirm(tr("Vuoi salvare questo piatto anche in ⭐ I miei piatti?")))addRecipe(val.d,val.k,val.p,null,null);
  }catch(e){aiFail(e);}};
/*  Sostituzione ingredienti — proposte CLICCABILI in un pannello:
   scegli toccando, "Altre proposte" rigenera, foto multiple del cibo in casa. */
let SUB=null;
window.subIngr=async(pdi,mi)=>{
  if(!aiOn())return aiFail(new Error("nokey"));
  const o=mealOpt(pdi,mi);
  const miss=await dlgPrompt(tr("Quale ingrediente (o più di uno) NON hai in casa?")+"\n\n"+tr("Pasto: {p}",{p:o.d}));
  if(!miss)return;
  SUB={pdi,mi,o,miss,excluded:[],opts:[],sel:-1,photos:[]};
  renderSub();subFetch();};
function subPrompt(){
  return 'Pasto del mio piano: "'+SUB.o.d+'" (~'+SUB.o.k+' kcal · '+SUB.o.p+' g prot). Non ho in casa: '+SUB.miss+'.'+
  (SUB.excluded.length?' Ho già scartato questi sostituti, NON riproporli: '+SUB.excluded.join(", ")+'.':'')+
  ' Proponi 3 alternative DIVERSE per sostituire SOLO quegli ingredienti, mantenendo le kcal (±10%) e le proteine (±5 g): per ciascuna indica il sostituto con grammatura e la descrizione completa del pasto risultante. '+dietStr()+
  ' Rispondi SOLO JSON: [{"sost":"sostituto con grammi","piatto":"descrizione completa","k":kcal,"p":prot,"c":carboidrati,"f":grassi},{...},{...}]';}
async function subFetch(){
  const st=document.getElementById("subStatus");if(st)st.textContent="Cerco proposte…";
  try{
    const arr=parseAIJSON(await aiAsk(subPrompt()));
    if(!Array.isArray(arr)||!arr.length)throw new Error("formato");
    SUB.opts=arr.slice(0,3).map(a=>({sost:String(a.sost),piatto:String(a.piatto),k:Math.round(+a.k)||SUB.o.k,p:Math.round(+a.p)||SUB.o.p,c:Math.round(+a.c)||null,f:Math.round(+a.f)||null,src:"ai"}));
    SUB.sel=-1;renderSub();
  }catch(e){if(SUB)closeSub();aiFail(e);}}
window.subMore=()=>{if(!SUB)return;SUB.opts.forEach(a=>SUB.excluded.push(a.sost));SUB.opts=[];SUB.sel=-1;renderSub();subFetch();};
window.subPhotoAdd=async(gal)=>{try{const g=await anyPhoto(gal,true);(Array.isArray(g)?g:[g]).forEach(x=>SUB.photos.push(x));renderSub();}catch(e){}};
window.subPhotoAsk=async()=>{
  if(!SUB.photos.length)return dlgAlert(tr("Prima scatta almeno una foto del cibo che hai in casa."));
  const st=document.getElementById("subStatus");if(st)st.textContent="Guardo le foto…";
  try{
    const t=await aiAskVision('Pasto del mio piano: "'+SUB.o.d+'" (~'+SUB.o.k+' kcal · '+SUB.o.p+' g prot). Non ho in casa: '+SUB.miss+'. Nelle '+SUB.photos.length+' FOTO vedi il cibo che ho a disposizione: scegli il MIGLIOR sostituto tra ciò che vedi, con grammatura per mantenere kcal (±10%) e proteine (±5 g). '+dietStr()+' Rispondi SOLO JSON: {"sost":"sostituto con grammi","piatto":"descrizione completa","k":kcal,"p":prot,"c":carboidrati,"f":grassi}',SUB.photos);
    const j=parseAIJSON(t);
    SUB.opts.push({sost:" "+String(j.sost),piatto:String(j.piatto),k:Math.round(+j.k)||SUB.o.k,p:Math.round(+j.p)||SUB.o.p,c:Math.round(+j.c)||null,f:Math.round(+j.f)||null,src:"foto"});
    SUB.sel=SUB.opts.length-1;renderSub();
  }catch(e){const st2=document.getElementById("subStatus");if(st2)st2.textContent="";if(e.message!=="annullato")aiFail(e);}};
window.subPick=i=>{if(SUB){SUB.sel=i;renderSub();}};
window.subOk=async ()=>{
  if(!SUB||SUB.sel<0)return dlgAlert(tr("Tocca prima una delle proposte per selezionarla."));
  const a=SUB.opts[SUB.sel];
  S.week.days[SUB.pdi].meals[SUB.mi].custom={d:a.piatto,k:a.k,p:a.p,c:a.c,f:a.f};
  save();closeSub();render(cur);toast(tr("Pasto aggiornato ✓"));
  if(await dlgConfirm(tr("Vuoi salvare questo piatto anche in ⭐ I miei piatti, per riusarlo in futuro?")))addRecipe(a.piatto,a.k,a.p,a.c,a.f);};
function addRecipe(d,k,p,c,f,fib,z){
  S.recipes.push({d,k,p,c:(c!=null?c:null),f:(f!=null?f:null),
    fib:(fib!=null?fib:estFiberOf(d)),z:(z!=null?z:estSugarOf(d)),at:new Date().toISOString()});
  save();toast(tr("Salvato in Piatti"));}
/* I piatti salvati vanno all'AI come repertorio della persona: sono già stati
   scelti da lei, quindi riproporli è sempre gradito. */
function favForAI(){const r=(S.recipes||[]);if(!r.length)return "";
  return " Piatti che la persona ha già salvato e apprezza, da riproporre quando sono compatibili con il pasto e con i target (senza ripeterli ogni giorno): "+
    r.slice(-12).map(x=>x.d.split(" — ")[0]+" (~"+x.k+" kcal, "+x.p+" g prot)").join("; ")+".";}
window.closeSub=()=>{SUB=null;const m=document.getElementById("subModal");if(m)m.remove();};
window.recModal=(di)=>{
  let m=document.getElementById("recM");
  if(!m){m=document.createElement("div");m.id="recM";m.className="modal";document.body.appendChild(m);}
  let inner=`<div class="mcard"><h2 style="color:var(--bosco);font-size:16px">${trh("⭐ I miei piatti ({v1})",{v1:S.recipes.length})}</h2>
  ${hint2(tr("I tuoi piatti salvati: scegli il pasto e riusali quando vuoi, senza consumare AI."),tr("Ci finiscono i piatti creati da te o con l'AI (Crea, alternativa, sostituzione, modifica). <b>Tocca il titolo</b> per la ricetta completa con le grammature. L'AI li tiene presenti anche nelle proposte future."))}
  ${mealSelHtml("recTarget",di)||`<div class="hint">${tr("Aggiungili come extra.")}</div>`}`;
  if(!S.recipes.length)inner+=`<div class="hint">${trh("Ancora nessun piatto salvato. Quando l'AI te ne propone uno che ti piace — o quando lo crei col frigo — premi {b} e lo ritrovi qui.",{b:"<b>⭐ Salva</b>"})}</div>`;
  /* i più recenti in cima */
  S.recipes.map((r,i)=>({r,i})).reverse().forEach(({r,i})=>{
    const ric=r.d.includes(" — ")?r.d.split(" — ").slice(1).join(" — "):"";
    const open=(RECOPEN===i);
    inner+=`<div class="optbtn">
    <div onclick="recToggle(${di},${i})" style="cursor:pointer">
      <b>${esc(r.d.split(" — ")[0])}</b> <span style="color:var(--grigio);font-size:13px">${ric?(open?"▲ chiudi":"▼ ricetta"):""}</span><br>
      <span style="color:var(--salvia);font-weight:700">~${r.k} kcal · P ${r.p}g${r.c!=null?" · C "+r.c+"g":""}${r.f!=null?" · Gr "+r.f+"g":""}${r.fib!=null?" · F "+r.fib+"g":""}${r.z!=null?" · Z "+r.z+"g":""}</span>
    </div>
    ${open&&ric?`<div class="aibox" aria-live="polite" style="margin-top:8px">${esc(ric)}</div>`:""}
    <div class="btngrid3" style="margin-top:8px">
      <button class="btn small" onclick="recUse(${di},${i})">${tr("Usa per il pasto")}</button>
      <button class="btn ghost small" onclick="recExtra(${di},${i})">+ Extra</button>
      <button class="btn warn small" onclick="recDel(${di},${i})">${tr("Elimina")}</button></div></div>`;});
  inner+=`<div class="mtools" style="margin-top:12px"><button class="btn warn" onclick="document.getElementById('recM').remove()">${tr("Chiudi")}</button></div></div>`;
  m.innerHTML=inner;};
window.recUse=(di,i)=>{const r=S.recipes[i];
  const tgt=document.getElementById("recTarget")?selTarget("recTarget",di):selTarget("frTarget",di);
  if(tgt.pdi===undefined)return dlgAlert(tr("Nessun pasto selezionabile in questo giorno."));
  S.week.days[tgt.pdi].meals[tgt.mi].custom={d:r.d.split(" — ")[0]+" (dai miei piatti)",k:r.k,p:r.p,c:r.c,f:r.f};
  save();document.getElementById("recM").remove();render(cur);toast(tr("Pasto impostato ✓"));};
let RECOPEN=-1;
/* La ricetta completa si apre sotto al piatto, con tutte le grammature */
window.recToggle=(di,i)=>{RECOPEN=(RECOPEN===i)?-1:i;
  const m=document.getElementById("recM");if(m)m.remove();recModal(di);};
window.recExtra=(di,i)=>{const r=S.recipes[i];
  S.week.days[di].extras.push({d:r.d.split(" — ")[0],k:r.k,p:r.p,c:r.c,f:r.f});
  save();document.getElementById("recM").remove();render(cur);};
window.recDel=(di,i)=>{
  const r=S.recipes[i];if(!r)return;
  const copia=JSON.parse(JSON.stringify(r));
  S.recipes.splice(i,1);save();
  const m=document.getElementById("recM");if(m)m.remove();recModal(di);
  snackUndo(tr("Piatto eliminato"),()=>{S.recipes.splice(i,0,copia);save();
    const m2=document.getElementById("recM");if(m2)m2.remove();recModal(di);});};
function renderSub(){
  let m=document.getElementById("subModal");
  if(!m){m=document.createElement("div");m.id="subModal";m.className="modal";document.body.appendChild(m);}
  let inner=`<div class="mcard"><h2 style="color:var(--bosco);font-size:16px">Sostituisci: ${esc(SUB.miss)}</h2>
  <div class="hint" style="margin-top:4px">${esc(cap(SUB.o.d))} · ~${SUB.o.k} kcal · ${SUB.o.p}g prot</div>
  <div class="hint" id="subStatus">${SUB.opts.length?"Tocca una proposta per selezionarla:":""}</div>`;
  SUB.opts.forEach((a,i)=>{inner+=`<button class="optbtn ${SUB.sel===i?"sel":""}" onclick="subPick(${i})">
    <b>${esc(cap(a.sost))}</b><br>${esc(cap(a.piatto))}<br><span style="color:var(--salvia);font-weight:700">~${a.k} kcal · ${a.p}g prot${a.c!=null?" · C "+a.c+"g":""}${a.f!=null?" · Gr "+a.f+"g":""}</span></button>`;});
  inner+=`<div class="mtools" style="margin-top:12px">
    <button class="btn ghost small" onclick="subMore()">Altre proposte</button>
    <button class="btn ghost small" onclick="subPhotoAdd()">Fotografa${SUB.photos.length?" ("+SUB.photos.length+")":""}</button>
    <button class="btn ghost small" onclick="subPhotoAdd(true)">Galleria</button>
    ${SUB.photos.length?'<button class="btn small" onclick="subPhotoAsk()">Proponi dalla foto</button>':""}</div>
  <div class="mtools" style="margin-top:12px">
    <button class="btn" onclick="subOk()">OK</button>
    <button class="btn warn" onclick="closeSub()">${tr("Annulla")}</button></div></div>`;
  m.innerHTML=inner;}
window.setNote=(d,v)=>{S.week.days[d].note=v;save();};
window.delExtra=(d,i)=>{S.week.days[d].extras.splice(i,1);save();render(cur);};
window.delExtraAsk=(d,i)=>{
  const arr=S.week.days[d].extras;const x=arr[i];if(!x)return;
  const copia=JSON.parse(JSON.stringify(x));
  arr.splice(i,1);save();render(cur);
  snackUndo(tr("Extra eliminato"),()=>{S.week.days[d].extras.splice(i,0,copia);save();render(cur);});};
/* Extra/sgarro: AI o manuale */
window.addExtra=(d)=>{ // v5.1: crea un extra VUOTO da compilare come preferisci
  S.week.days[d].extras.push({d:"Nuovo extra — compilalo con ,  o barcode",k:0,p:0,st:"done"});
  save();render(cur);};
/*  Salva-sgarro: ribilancia i pasti rimanenti della giornata */
/*  #2 — Spunta con foto: fotografi il pasto e l'AI capisce a quale pasto del
   piano corrisponde (o se è un extra), lo spunta e, se lo scostamento è
   rilevante, registra i valori reali della foto. */
/* ── Il PROMPT DI STIMA vive QUI e solo qui ─────────────────────────
   Quattro copie avevano già divergato: in editMealPermGo mancavano la
   regola delle grammature per i pasti in casa, il vincolo "componenti
   separate da virgole" e i campi fibre/zuccheri. opts: fuori (mensa/
   ristorante) · riscrivi (descrizione riscritta con le grammature) ·
   campo (nome del campo descrizione nel JSON: "piatto", "desc", assente). */
/* ═══ PERCHÉ QUI NON SI IMPARA PIÙ ════════════════════════════════
   Fino al 19/08/2026 una correzione delle calorie diventava la
   verità per quel piatto, e veniva riusata. Era sbagliato:
   NESSUNO SA CONTARE LE CALORIE DI UN PIATTO A OCCHIO. Chi corregge
   una carbonara da 700 a 450 non ha misurato niente — ha espresso un
   desiderio, o ha confrontato con un numero letto da qualche parte.
   Prendere quel numero per buono significa costruire un bilancio
   falso su richiesta di chi poi lo subirà.
   Quello che la persona SA è cosa ha messo nel piatto: «80 g di
   pasta, un tuorlo, 20 g di pecorino». Quella è la strada — la
   descrizione, non il risultato — e per le cose che rifà sempre
   uguali ci sono le PREPARAZIONI (modulo 63).
   La funzione resta, vuota, perché è chiamata in più punti: togliere
   la chiamata da tutti i rami era il modo di dimenticarne uno. */
function recCorrection(txt,da,a){
  /* volutamente non fa niente: vedi sopra */}
/* ── 6.5 · Salute del motore: quando un prompt inizia a degradare
   (Google cambia modello, risposte sporche) lo dice il contatore,
   non i reclami. ok = risposte parsate; ko = risposte malformate. */
function aiHealth(tag,ok){
  S.aiHealth=S.aiHealth||{};
  const h=S.aiHealth[tag]=S.aiHealth[tag]||{ok:0,ko:0};
  ok?h.ok++:h.ko++;}
/* ═══ 6.3 · TABELLA LOCALE DEGLI ALIMENTI ═══════════════════════════
   Il piano B senza chiave AI. Da quando si sceglie la tradizione
   culinaria non basta più la dispensa italiana: qui ci sono anche i
   pilastri delle altre cucine (riso e noodles asiatici, legumi e pani
   mediorientali, radici africane e sudamericane, latticini nordici).
   Ogni riga porta anche i NOMI INGLESI: chi usa l'app in inglese scrive
   «chicken breast», non «petto di pollo», e senza alias la stima non
   riconoscerebbe nulla. Il confronto è per sottostringa e vince l'alias
   più lungo, quindi un nome specifico batte sempre quello generico.
   Valori per 100 g (secco per pasta/riso/legumi secchi, crudo per carne
   e pesce, come si pesa in casa). k kcal · p prot · c carb · f grassi ·
   fib fibre · z zuccheri · u = peso di UN pezzo (contabili). */
/* La tavola degli alimenti vive in 07_alimenti.js: dati e codice
   separati, così il database cresce senza toccare la logica. */

/* ═══ QUANDO LA TAVOLA NON BASTA ═══════════════════════════════
   Il calcolo locale è preciso su quello che sa: «120 g di riso» è
   aritmetica. Ma su «4 pezzi di nigiri» o «una porzione di lasagne
   della nonna» sommare ingredienti singoli produce un numero
   PLAUSIBILE E SBAGLIATO — e un numero sbagliato con l'aria di
   essere certo è peggio di nessun numero, perché nessuno lo mette
   in dubbio.

   Quindi prima di rispondere ci si chiede: questa cosa la sappiamo
   davvero? Tre casi in cui la risposta è no e serve l'AI:

   1. PIATTI COMPOSTI E PRONTI — sushi, lasagne, paella, poke, kebab,
      piadina, pizza farcita: il nome nasconde una ricetta, e la
      ricetta cambia le calorie del doppio.
   2. UNITÀ CHE NON SONO GRAMMI — «4 pezzi», «una teglia», «un
      trancio», «due mestoli»: quanto pesa un pezzo lo sa chi
      conosce il piatto, non una tabella di ingredienti.
   3. TROPPI COMPONENTI PERSI — se metà di quello che hai scritto
      non è nel database, il totale è una mezza risposta spacciata
      per intera.

   In tutti e tre i casi localEstimate torna null con un motivo, e
   il chiamante passa all'AI. Se l'AI non c'è (offline, o piano
   senza AI) si mostra la stima locale DICHIARANDO che è approssimata:
   meglio un numero con l'etichetta «circa» che un numero muto. */
const AI_PIATTI=[
  "sushi","nigiri","sashimi","maki","uramaki","temaki","onigiri","poke",
  "lasagn","cannellon","parmigiana","moussaka","paella","risotto","paniss",
  "kebab","piadin","panzerott","calzon","arancin","suppl","crocch","polpett",
  "hamburger","cheeseburger","hot dog","toast","club sandwich","wrap","burrito",
  "taco","quesadilla","nachos",
  "carbonara","amatrician","cacio e pepe","gricia","genovese","ragu","ragù",
  "bolognese","pesto","norma","puttanesca","alfredo","tikka","curry","tandoori",
  "ramen","pad thai","noodles saltat","involtin",
  "tortin","frittat","omelette","crepe","crêpe","strudel","tiramis",
  "cheesecake","panna cotta","gelato","cornetto","brioche farcit","maritozz",
  "pizza","focacc","torta salat","quiche","vol au vent","tramezzin","piade",
  "insalata di riso","insalata russa","vitello tonnato","cotoletta","milanese",
  "saltimbocca","spezzatino","stufato","brasato","goulash","zuppa","minestrone",
  "vellutata","passato di verdur","pasta al forno","gnocchi","ravioli","tortellin",
  "agnolott","pierogi","empanada","samosa","spring roll","dim sum","bao"];

/* Le unità che una tabella di ingredienti non sa convertire. */
const AI_UNITA=/\b(\d+\s*)?(pezz[oi]|fett[ae]|trancio|tranci|teglia|teglie|mestol[oi]|cucchiaiat[ae]|porzion[ei]|piatt[oi]|scodell[ae]|ciotol[ae]|vassoi?|vasett[oi]|barattol[oi]|confezion[ei]|sacchett[oi]|panin[oi]|rotolin[oi]|involtin[oi]|spiedin[oi]|bocconcin[oi])\b/i;

/* Una voce già CURATA non ha bisogno dell'AI: se «hummus» sta in
   tavola con le sue calorie misurate, sommarla è aritmetica.
   ATTENZIONE al modo in cui si controlla: bisogna cercare IL NOME DEL
   PIATTO in tavola, non un ingrediente qualsiasi del testo. La prima
   versione guardava tutto il testo e su «4 pezzi di nigiri» trovava
   un ingrediente scollegato, concludendo che il sushi fosse pesato.
   Un controllo troppo generoso è peggio di nessun controllo: fa
   passare per certo quello che è indovinato. */
function piattoInTavola(nomePiatto){
  const p=String(nomePiatto||"");
  if(p.length<4)return false;
  try{
    for(const row of FOOD_DB)
      for(const stem of row[0].split("|"))
        /* SEVERO: il gambo deve COMINCIARE col nome del piatto (o
           coincidere). «hummus» ↔ «hummus di ceci» sì; «nigiri» ↔
           un gambo qualsiasi che gli somiglia dentro, NO — con la
           versione larga «nigiri» risultava pesato e il sushi non
           arrivava mai all'AI. */
        if(stem===p||stem.indexOf(p)===0)return true;
  }catch(e){}
  return false;}

function serveAI(txt){
  const t=String(txt||"").toLowerCase()
    .replace(/[àá]/g,"a").replace(/[èé]/g,"e").replace(/[ìí]/g,"i")
    .replace(/[òó]/g,"o").replace(/[ùú]/g,"u");
  const piatto=AI_PIATTI.find(p=>t.indexOf(p.replace(/[àù]/g,m=>m==="à"?"a":"u"))>-1);
  /* il piatto va all'AI solo se non è già pesato in tavola */
  if(piatto&&!piattoInTavola(piatto))return {si:true,perche:"piatto",dettaglio:piatto};
  /* i grammi espliciti battono l'unità vaga: «4 fette, 80 g» si sa
     calcolare, «4 fette» no */
  if(AI_UNITA.test(t)&&!/\b\d+(?:[.,]\d+)?\s*(?:g|gr|grammi|ml|l)\b/.test(t))
    return {si:true,perche:"unita"};
  return {si:false};}
window.serveAI=serveAI;

function localEstimate(txt){
  /* I TUOI PIATTI VINCONO. Se questa persona ha già salvato (o
     corretto) questo piatto, la sua versione è più vera di qualunque
     media di tabella: una correzione fatta una volta deve valere per
     sempre, altrimenti la si rifà ogni settimana e si smette di
     fidarsi. Si tenta prima del calcolo per componenti. */
  if(typeof piattoTrova==="function"){
    const mio=piattoTrova(txt);
    if(mio){
      const g=/(\d+(?:[.,]\d+)?)\s*(?:g|gr|grammi)\b/.exec(String(txt).toLowerCase());
      const q=g?parseFloat(g[1].replace(",","."))/(mio.g||100):1;
      return {kcal:Math.round(mio.kcal*q),prot:Math.round(mio.prot*q),
              carb:Math.round(mio.carb*q),gras:Math.round(mio.gras*q),
              fibre:Math.round((mio.fibre||0)*q),zuccheri:Math.round((mio.zuccheri||0)*q),
              trovati:[mio.nome],persi:[],mio:true};}}
  /* Se è un piatto composto o un'unità che non sappiamo pesare, la
     tavola tace e lascia parlare l'AI: sommare ingredienti su «4
     pezzi di nigiri» darebbe un numero sbagliato con l'aria di essere
     giusto. I TUOI piatti (sopra) restano l'eccezione: se l'hai già
     corretto tu, quella è la verità e vale anche per il sushi. */
  const g=serveAI(txt);
  if(g.si)return null;
  const norm=x=>String(x||"").toLowerCase()
    .replace(/[àá]/g,"a").replace(/[èé]/g,"e").replace(/[ìí]/g,"i").replace(/[òó]/g,"o").replace(/[ùú]/g,"u");
  const comps=norm(txt).split(/,| e |\+|;/).map(c=>c.trim()).filter(Boolean);
  if(!comps.length)return null;
  const tot={k:0,p:0,c:0,f:0,fib:0,z:0};const trovati=[];const persi=[];
  for(const comp of comps){
    let food=null,best=0;
    for(const row of FOOD_DB){
      for(const stem of row[0].split("|")){
        if(comp.indexOf(stem)>-1&&stem.length>best){best=stem.length;food=row;}}}
    /* SECONDA LINEA — la porta è aperta, ma non c'è nessuno.
       Fino a v13.27 qui rispondeva un registro USDA di 6.032 voci.
       MISURATO su 60 modi realistici di scrivere un pasto italiano:
       i curati coprivano il 98%, l'USDA lo 0% — non agganciava MAI,
       perché i suoi nomi sono in inglese e iper-specifici («pork,
       fresh, loin, center loin (chops), bone-in, separable lean
       only»). 452 KB per zero risposte: rimosso.
       Il meccanismo resta: se `FOOD_DB_EXT` esiste (una tavola
       migliore, un giorno) viene usata. Quello che nessuna tavola sa,
       va all'AI — che è la strada giusta per i casi rari. */
    if(!food&&typeof FOOD_DB_EXT!=="undefined"){
      for(const row of FOOD_DB_EXT){
        for(const stem of row[0].split("|")){
          if(stem.length>=5&&comp.indexOf(stem)>-1&&stem.length>best){best=stem.length;food=row;}}}}
    if(!food){persi.push(comp);continue;}
    const g=/(\d+(?:[.,]\d+)?)\s*(?:g|gr|grammi)\b/.exec(comp);
    let peso=g?parseFloat(g[1].replace(",",".")):0;
    if(!peso){
      const nMatch=/(?:^|\s)(\d+)\s+\S/.exec(comp);
      const nPezzi=nMatch?parseInt(nMatch[1]):1;
      peso=food[7]?food[7]*nPezzi:100;   /* contabili col loro peso, altrimenti porzione da 100 g */
    }
    const q=peso/100;
    tot.k+=food[1]*q;tot.p+=food[2]*q;tot.c+=food[3]*q;tot.f+=food[4]*q;tot.fib+=food[5]*q;tot.z+=food[6]*q;
    trovati.push(comp);}
  /* Ottanta per cento, non sessanta: con un componente su tre perso il
     totale è una mezza risposta spacciata per intera. Alzare questa
     soglia manda più roba all'AI, che è il punto. */
  if(!trovati.length||trovati.length/comps.length<0.8)return null;
  return {kcal:Math.round(tot.k),prot:Math.round(tot.p),carb:Math.round(tot.c),gras:Math.round(tot.f),
          fibre:Math.round(tot.fib),zuccheri:Math.round(tot.z),trovati,persi};}
/* ── 6.2 · Cache delle stime: stesso piatto, stessa taratura (le
   correzioni fanno parte della chiave) → stessa risposta, senza
   richiamare l'AI. Massimo 40 voci. Bonus: un piatto già stimato
   funziona anche offline. */
function estKey(txt,o){
  const pr=estimaPrompt(txt,o);
  let h=5381;for(let i=0;i<pr.length;i++)h=((h<<5)+h+pr.charCodeAt(i))|0;
  return "e"+(h>>>0).toString(36);}
async function estimaCached(txt,o){
  S.estCache=S.estCache||{};
  const k=estKey(txt,o);
  const hit=S.estCache[k];
  if(hit&&hit.t)return hit.t;
  const t=await aiAsk(estimaPrompt(txt,o));
  let ok=true;try{ok=parseAIJSON(t)!=null;}catch(e){ok=false;}
  aiHealth("stima",ok);
  if(ok){
    const keys=Object.keys(S.estCache);
    if(keys.length>=40)delete S.estCache[keys[0]];
    S.estCache[k]={t:String(t).slice(0,800),at:Date.now()};}
  return t;}
function estimaPrompt(txt,o){
  o=o||{};
  const t=String(txt==null?"":txt).replace(/"/g,"'");
  /* ── QUI STAVA L'ERRORE PIÙ GRAVE ──────────────────────────────
     Le correzioni di calorie fatte dalla persona finivano DENTRO IL
     PROMPT: «adegua la taratura, da 700 a 450». Cioè si chiedeva
     all'AI di abbassare le stime perché qualcuno lo aveva chiesto.
     Un bilancio così è falso, e la persona che lo usa non lo sa.
     Al suo posto: le PREPARAZIONI DI CASA. Se nel piatto compare
     «la mia maionese», all'AI si allega la RICETTA che la persona
     ha descritto — un'informazione vera, che solo lei poteva dare —
     e si lascia a lei il mestiere di stimare quanta se ne usa. */
  const memo=(typeof prepPerAI==="function")?prepPerAI(t):"";
  const corpo=o.fuori
    ?'Il pasto è fuori casa (mensa/ristorante): riscrivi la descrizione in forma INDICATIVA e sintetica, massimo 12 parole, componenti separate da virgole, SENZA grammature precise. '
    :('Se nel testo sono indicate grammature, usale ESATTAMENTE come scritte (sono state corrette a mano dall\'utente); per gli elementi senza peso assumi porzioni tipiche italiane'+(o.riscrivi?' e RISCRIVI la descrizione includendole, sintetica, componenti separate da virgole':'')+'. ');
  const campo=o.campo?'"'+o.campo+'":"descrizione",':'';
  return 'Stima calorie e macro REALI di questo pasto: "'+t+'". '+corpo+memo+
    ' Rispondi SOLO JSON: {'+campo+'"kcal":numero,"prot":numero,"carb":numero,"gras":numero,"fibre":numero,"zuccheri":numero}';}
/* ── Le REGOLE DEL RIBILANCIO vivono QUI e solo qui ─────────────────
   Erano copiate in tre prompt e una copia aveva già divergato (la
   priorità sostituzione/grammature era invertita in rebalanceNextDay).
   Versione canonica: prima si abbassano le grammature (il piatto resta
   il tuo), la sostituzione è l'eccezione per la sazietà. */
const REBAL_RULES=" REGOLE OBBLIGATORIE: (1) usa i valori nutrizionali REALI degli alimenti nelle quantità che scrivi, mai numeri adattati per far tornare il conto; (2) per ridurre parti sempre ABBASSANDO LE GRAMMATURE degli ingredienti (es. \"pasta 80g\"→\"pasta 60g\"); (3) SOLO se il pasto così diventa poco saziante, sostituisci un ingrediente con uno più leggero e voluminoso (es. parte dei carboidrati con verdure); (4) è vietato lasciare la descrizione uguale abbassando solo i numeri; (5) NESSUN pasto va eliminato o ridotto sotto ~250 kcal: meglio un totale un po' diverso ma VERO che numeri falsi. Riduci carboidrati e grassi, MAI le proteine.";
/* ══ «PROTEINE INTOCCABILI» ERA UNA PREGHIERA (audit 27/08) ═══════
   L'app lo dichiara nelle Regole — «Ribilanciamenti e recuperi
   riducono solo carboidrati e grassi, le proteine non si toccano» — e
   la presentazione lo mette fra le garanzie del motore.

   In codice c'era solo un'istruzione dentro il prompt: «Riduci
   carboidrati e grassi, MAI le proteine». Il controllo che scarta le
   proposte guardava le GRAMMATURE (una descrizione identica con meno
   calorie = barare) e non guardava le proteine: se il modello le
   abbassava, quel numero finiva nel piano senza obiezioni. Una
   garanzia che dipende dalla buona volontà di chi risponde non è una
   garanzia: è una speranza.

   Adesso è una rete. La tolleranza è 1 grammo o il 5%, il maggiore
   dei due: un ribilanciamento vero sposta qualche grammo per gli
   arrotondamenti, e bocciare per un grammo vorrebbe dire rifiutare
   proposte buone. Sotto quella soglia la proposta non si applica.

   Vale per tutti e due i punti che alleggeriscono un pasto — il
   ribilanciamento di oggi e il recupero del giorno dopo — perché una
   rete che vale in un posto solo è la stessa cosa che non averla. */
function proteineTenute(prop,orig){
  /* I DUE OGGETTI PARLANO DUE LINGUE. La proposta arriva dall'AI e usa
     i nomi del contratto — {slot, desc, kcal, prot} — mentre il pasto
     nel piano usa i nomi interni — {d, k, p}. Leggendo `p` su tutti e
     due, la proposta risultava sempre a ZERO proteine e ogni
     ribilanciamento veniva rifiutato: la rete avrebbe bloccato la
     funzione invece di proteggerla. L'ha trovato un verso, non io. */
  const num=(o,a,b)=>Math.round(+(((o&&o[a])!=null?o[a]:(o&&o[b]))||0));
  const pOrig=num(orig,"p","prot");
  const pNuovo=num(prop,"prot","p");
  if(!pOrig)return true;                       /* non c'era niente da tenere */
  const tolleranza=Math.max(1,Math.round(pOrig*0.05));
  return pNuovo>=(pOrig-tolleranza);}
window.proteineTenute=proteineTenute;

window.rebalance=async(di)=>{
  /* v5.0.3 — logica a BUDGET, idempotente:
     budget residuo = kcal pianificate della giornata − kcal già mangiate;
     eccesso = pianificato dei pasti RIMANENTI − budget residuo.
     Se eccesso ≤ 50 non si tocca nulla (cliccare due volte non ri-taglia). */
  const dayPlan=plannedOfDay(di).k;                 // la "giornata tipo"
  const eaten=eatenOfDay(di).k;                     // mangiato finora (pasti ✓ + extra)
  const remaining=dayItems(di).filter(it=>{const st=S.week.days[it.pdi].meals[it.mi];
    return !st.done&&!st.skip&&PLAN[it.pdi].meals[it.mi].type==="norm";});
  const remPlanned=remaining.reduce((a,it)=>a+mealOpt(it.pdi,it.mi).k,0);
  const budget=dayPlan-eaten;
  const excess=Math.round(remPlanned-budget);
  if(!remaining.length)return dlgAlert(tr("Non c'è più niente da spostare oggi."));
  if(excess<=50)return dlgAlert(tr("Sei in linea con la giornata: pasti rimanenti ~{a} kcal, budget residuo ~{b} kcal (su {c} pianificate). Nessun ribilanciamento necessario.",{a:remPlanned,b:Math.max(0,budget),c:dayPlan}));
  if(!aiOn())return aiFail(new Error("nokey"));
  const list=remaining.map(it=>{const o=mealOpt(it.pdi,it.mi);return {slot:it.slot,desc:o.d,kcal:o.k,prot:o.p};});
  const targetRem=Math.max(remaining.length*minMealKcal(),budget); // mai sotto ~250 kcal/pasto
  try{
    const arr=await aiAskJSON('Devo restare dentro un budget di circa '+Math.round(targetRem)+' kcal TOTALI per questi pasti rimanenti di oggi (ora sommano '+remPlanned+' kcal): '+JSON.stringify(list)+'. '+REBAL_RULES+' La SOMMA delle kcal proposte deve essere vicina a '+Math.round(targetRem)+'. '+dietStr()+' Rispondi SOLO JSON array: [{"slot":"...","desc":"descrizione COMPLETA con le nuove grammature","kcal":n,"prot":n}]');
    // scarta le proposte "furbe": kcal più basse ma descrizione identica = barare
    const valid=arr.filter(a=>{const it=remaining.find(r=>r.slot===a.slot);if(!it)return false;
      const o=mealOpt(it.pdi,it.mi);
      /* la furbizia delle grammature: stessa descrizione, meno calorie */
      if(String(a.desc).trim()===String(o.d).trim()&&Math.round(a.kcal)<o.k)return false;
      /* e le proteine, che l'app promette di non toccare */
      return proteineTenute(a,o);});
    if(!valid.length)return dlgAlert(tr("L'AI non ha proposto grammature nuove valide: riprova."));
    let msg=tr("Ribilanciamento (budget residuo ~{b} kcal, eccesso {e} kcal):",{b:Math.max(0,budget),e:excess})+"\n";
    valid.forEach(a=>{const it=remaining.find(r=>r.slot===a.slot);const o=mealOpt(it.pdi,it.mi);
      msg+="\n• "+a.slot+" ("+o.k+"→"+Math.round(a.kcal)+" kcal): "+a.desc+" (~"+a.prot+"p)";});
    if(!await dlgConfirm(msg+"\n\n"+tr("OK = applica ai pasti rimanenti")))return;
    valid.forEach(a=>{const it=remaining.find(r=>r.slot===a.slot);if(it)
      S.week.days[it.pdi].meals[it.mi].custom={d:a.desc+" (ribilanciato)",k:Math.round(a.kcal),p:Math.round(a.prot)};});
    save();render(cur);
  }catch(e){aiFail(e);}};
/*  Recupero del GIORNO SUCCESSIVO: alleggerisce pranzo e cena di toDi per
   assorbire l'eccesso (surplus) di fromDi. Avvisa, propone e applica solo se
   l'utente conferma. Segna il giorno come già ribilanciato per non insistere. */
window.rebalanceNextDay=async(fromDi,toDi)=>{
  // eccesso del giorno passato = mangiato − pianificato dell'INTERA giornata
  const sg=Math.max(0,Math.round(eatenOfDay(fromDi).k-plannedOfDay(fromDi).k));
  if(sg<=50)return dlgAlert(tr("{a} non risulta sforato (mangiate {b} su {c} pianificate): pasti di oggi invariati.",{a:PLAN[fromDi].day,b:eatenOfDay(fromDi).k,c:plannedOfDay(fromDi).k}));
  if(!aiOn())return aiFail(new Error("nokey"));
  const mains=dayItems(toDi).filter(it=>{const st=S.week.days[it.pdi].meals[it.mi];
    return !st.done&&!st.skip&&PLAN[it.pdi].meals[it.mi].type==="norm";});
  if(!mains.length)return dlgAlert(tr("Non c'è più niente da alleggerire oggi."));
  const list=mains.map(it=>{const o=mealOpt(it.pdi,it.mi);return {slot:it.slot,desc:o.d,kcal:o.k,prot:o.p};});
  const remPlanned=list.reduce((a,x)=>a+x.kcal,0);
  const targetRem=Math.max(mains.length*minMealKcal(),remPlanned-sg);
  try{
    const arr=await aiAskJSON('Ieri ho ecceduto di '+sg+' kcal. Alleggerisci i pasti di OGGI ancora da consumare (ora sommano '+remPlanned+' kcal) portandone la SOMMA vicino a '+Math.round(targetRem)+' kcal. '+REBAL_RULES+' Pasti: '+JSON.stringify(list)+'. '+dietStr()+' Rispondi SOLO JSON array: [{"slot":"...","desc":"descrizione COMPLETA con le nuove grammature","kcal":n,"prot":n}]');
    const valid=arr.filter(a=>{const it=mains.find(r=>r.slot===a.slot);if(!it)return false;
      const o=mealOpt(it.pdi,it.mi);
      if(String(a.desc).trim()===String(o.d).trim()&&Math.round(a.kcal)<o.k)return false;
      return proteineTenute(a,o);});
    if(!valid.length)return dlgAlert(tr("L'AI non ha proposto grammature nuove valide: riprova."));
    let msg="Recupero dello sforo di "+PLAN[fromDi].day+" (~"+sg+" kcal):\n";
    valid.forEach(a=>{const it=mains.find(r=>r.slot===a.slot);const o=mealOpt(it.pdi,it.mi);
      msg+="\n• "+a.slot+" ("+o.k+"→"+Math.round(a.kcal)+" kcal): "+a.desc+" (~"+a.prot+"p)";});
    if(!await dlgConfirm(tr("{a}\n\nOK = applica ai pasti di oggi",{a:msg})))return;
    valid.forEach(a=>{const it=mains.find(r=>r.slot===a.slot);if(it)
      S.week.days[it.pdi].meals[it.mi].custom={d:a.desc+" (recupero)",k:Math.round(a.kcal),p:Math.round(a.prot)};});
    S.week.days[toDi].rebalancedFrom=fromDi;save();render(cur);
    dlgAlert(tr("Fatto: pasti di oggi alleggeriti per recuperare lo sforo di {g}.",{g:PLAN[fromDi].day}));
  }catch(e){aiFail(e);}};
/* ═══ RGP — Recupero dei giorni precedenti (v5.2) ═══════════════════
   Principi:
   • SOGLIA DI TOLLERANZA: sotto una certa quota lo sforo non si recupera
     (rientra nell'errore di stima delle porzioni). Default: 10% del
     pianificato del giorno, con un minimo di 150 kcal — regolabile in Io.
   • MAI GIORNI DI DIGIUNO: in un giorno si recupera al massimo una quota
     del pianificato (default 25%), e i pasti non scendono sotto ~250 kcal.
     Se lo sforo è grande, il resto si recupera nei giorni successivi.
   • Recupero PARZIALE tracciato: ogni giorno sforato ricorda quanto è già
     stato recuperato, così non si conta due volte. */
function minMealKcal(){return (S.profile.minMeal!=null?+S.profile.minMeal:250);}
function rgpThresh(di){ // kcal sotto le quali NON vale la pena recuperare
  const pct=(S.profile.rgpPct!=null?+S.profile.rgpPct:10);
  const min=(S.profile.rgpMin!=null?+S.profile.rgpMin:150);
  return Math.max(min,Math.round(plannedOfDay(di).k*pct/100));}
function rgpCapPct(){return (S.profile.rgpCap!=null?+S.profile.rgpCap:25);}
function rgpCapMax(){return (S.profile.rgpCapMax!=null?+S.profile.rgpCapMax:400);}
function overOfDay(di){return Math.round(eatenOfDay(di).k-plannedOfDay(di).k);}
function residualOfDay(di){ // sforo ancora da recuperare (al netto di quanto già fatto)
  return Math.max(0,overOfDay(di)-(S.week.days[di].rgpRecovered||0));}
function rgpDays(di){
  const out=[];
  const maxD=Math.max(1,Math.min(7,+S.profile.rgpDays||5));
  for(let d=di-1;d>=0&&out.length<maxD;d--){ // giorni precedenti considerati (Regole)
    const res=residualOfDay(d),th=rgpThresh(d);
    out.push({di:d,over:overOfDay(d),res,th,tracked:eatenOfDay(d).k>0,
      done:(S.week.days[d].rgpRecovered||0)>0&&res<th,
      todo:eatenOfDay(d).k>0&&res>=th});}
  return out;}
/* C'è qualcosa da recuperare? Serve a NON mostrare la riga quando non
   c'è niente da fare: una riga che dice «niente da recuperare» occupa
   spazio per non dire nulla. */
function rgpPending(di){
  try{return rgpDays(di===undefined?viewIdx():di).some(d=>d.todo);}catch(e){return false;}}
function rgpControlHTML(di){
  const days=rgpDays(di),over=days.filter(d=>d.todo);
  if(!over.length)return `<span class="coff" title="${tr("Nessuno degli ultimi giorni supera la soglia di recupero")}">niente da recuperare</span>`;
  const tot=over.reduce((a,d)=>a+d.res,0);
  const opts=[`<option value="">${tr("— non recuperare —")}</option>`,`<option value="all">${trh("tutti · +{v1} kcal",{v1:tot})}</option>`]
    .concat(over.map(d=>`<option value="${d.di}">${giorno(PLAN[d.di].day)} · +${d.res} kcal</option>`)).join("");
  return `<select id="rgpSel" title="${tr("Scegli cosa recuperare, poi conferma con ✓")}">${opts}</select>`;}
/* Un solo pulsante ✓ rende effettivi evento e recupero della giornata. */
window.applyCtl=(dISO,di,isToday)=>{
  const ev=(S.dayEvents||{})[dISO]||"";
  S.ui.evOk=S.ui.evOk||{};
  if(ev)S.ui.evOk[dISO]=true;else delete S.ui.evOk[dISO];
  save();
  const sel=document.getElementById("rgpSel");
  const want=isToday&&sel&&sel.value;
  render("oggi");
  if(want)return rgpRun(di);
  toast(ev?("Evento confermato: "+ev):"Giornata confermata ✓");};
window.rgpRun=async(toDi)=>{
  const el=document.getElementById("rgpSel");const v=el?el.value:"";
  const over=rgpDays(toDi).filter(d=>d.todo);
  const sel=(v==="all")?over.map(d=>d.di):(v===""?[]:[+v]);
  if(!sel.length)return;
  const tot=sel.reduce((a,d)=>a+residualOfDay(d),0);
  if(!tot)return dlgAlert(tr(" Non c'è nulla da recuperare: pasti di oggi invariati."));
  if(!aiOn())return aiFail(new Error("nokey"));
  const mains=dayItems(toDi).filter(it=>{const st=S.week.days[it.pdi].meals[it.mi];
    return !st.done&&!st.skip&&PLAN[it.pdi].meals[it.mi].type==="norm";});
  if(!mains.length)return dlgAlert(tr("Non c'è più niente da alleggerire oggi."));
  const list=mains.map(it=>{const o=mealOpt(it.pdi,it.mi);return {slot:it.slot,desc:o.d,kcal:o.k,prot:o.p};});
  const remPlanned=list.reduce((a,x)=>a+x.kcal,0);
  // tetto giornaliero: mai più di X% del pianificato, e mai sotto ~250 kcal a pasto
  const capDay=Math.min(Math.round(plannedOfDay(toDi).k*rgpCapPct()/100),rgpCapMax());
  const floor=mains.length*minMealKcal();
  const cut=Math.max(0,Math.min(tot,capDay,remPlanned-floor));
  if(cut<50)return dlgAlert(tr("Oggi non c'è margine per recuperare senza farti saltare un pasto (restano {a} pasti da ~{b} kcal). Meglio rimandare a domani.",{a:mains.length,b:Math.round(remPlanned/mains.length)}));
  const targetRem=remPlanned-cut;
  const nomi=sel.map(d=>PLAN[d].day).join(", ");
  try{
    const arr=await aiAskJSON('Devo recuperare '+cut+' kcal di sforo dei giorni '+nomi+' alleggerendo i pasti di OGGI ancora da consumare (ora sommano '+remPlanned+' kcal): la loro SOMMA deve arrivare vicino a '+targetRem+' kcal. '+REBAL_RULES+' Pasti: '+JSON.stringify(list)+'. '+dietStr()+' Rispondi SOLO JSON array: [{"slot":"...","desc":"descrizione COMPLETA con le nuove grammature","kcal":n,"prot":n}]');
    const valid=arr.filter(a=>{const it=mains.find(r=>r.slot===a.slot);if(!it)return false;
      const o=mealOpt(it.pdi,it.mi);
      return String(a.desc).trim()!==String(o.d).trim()||Math.round(a.kcal)>=o.k;});
    if(!valid.length)return dlgAlert(tr("L'AI non ha proposto grammature nuove valide: riprova."));
    let applied=0;
    valid.forEach(a=>{const it=mains.find(r=>r.slot===a.slot);const o=mealOpt(it.pdi,it.mi);
      applied+=Math.max(0,o.k-Math.round(a.kcal));});
    let msg="Recupero da "+nomi+" — "+applied+" kcal di alleggerimento oggi";
    if(applied<tot)msg+=" (restano ~"+(tot-applied)+" kcal, le recuperi nei prossimi giorni)";
    msg+=":\n";
    valid.forEach(a=>{const it=mains.find(r=>r.slot===a.slot);const o=mealOpt(it.pdi,it.mi);
      msg+="\n• "+a.slot+" ("+o.k+"→"+Math.round(a.kcal)+" kcal): "+a.desc;});
    if(!await dlgConfirm(tr("{a}\n\nOK = applica ai pasti di oggi",{a:msg})))return;
    valid.forEach(a=>{const it=mains.find(r=>r.slot===a.slot);if(it)
      S.week.days[it.pdi].meals[it.mi].custom={d:a.desc+" (recupero)",k:Math.round(a.kcal),p:Math.round(a.prot)};});
    // ripartisci il recuperato sui giorni scelti, dal più vecchio
    let rest=applied;
    sel.slice().sort((a,b)=>a-b).forEach(d=>{if(rest<=0)return;
      const q=Math.min(rest,residualOfDay(d));
      S.week.days[d].rgpRecovered=(S.week.days[d].rgpRecovered||0)+q;rest-=q;});
    save();render(cur);
  }catch(e){aiFail(e);}};
/*  Giornate difficili: escluse dalle medie e dalle correlazioni AI, e non
   spezzano lo streak (a differenza della vacanza che congela tutto). */
/*  Eventi v5: motivazione esplicita (Natale, compleanno, giornata no…)
   al posto della generica "giornata difficile". Stesso effetto: escluso
   dalle medie/AI e streak protetto. */
window.setDayEvent=async (dISO,label)=>{
  S.dayEvents=S.dayEvents||{};
  if(label==="Altro…"){const c=await dlgPrompt(tr("Che evento è?"));label=(c&&c.trim())?c.trim():"";}
  if(!label){delete S.dayEvents[dISO];delete (S.hardDays||{})[dISO];delete (S.ui.evOk||{})[dISO];}
  else{S.dayEvents[dISO]=label;S.hardDays=S.hardDays||{};S.hardDays[dISO]=true;}
  save();render("oggi");};

window.fridge=async(di)=>{
  const ing=document.getElementById("fridgeIn").value.trim();
  if(!ing)return dlgAlert(tr("Scrivi gli ingredienti, o usa le foto."));
  if(!aiOn())return aiFail(new Error("nokey"));
  const tgt=selTarget("frTarget",di);
  const box=document.getElementById("fridgeOut");box.textContent="Sto creando il piatto…";
  try{
    const t=await aiAsk('Ho a disposizione: '+ing+'. In questo momento dovrei mangiare: '+tgt.slot+' da circa '+tgt.k+' kcal e '+tgt.p+' g di proteine.'+compNote(tgt)+' Crea UN piatto semplice da circa '+tgt.kAdj+' kcal e '+tgt.p+' g di proteine con dosi esatte (al massimo 1-2 basi da dispensa). '+dietStr()+' Rispondi SOLO JSON: {"titolo":"...","ricetta":"passaggi brevi con grammature","kcal":n,"prot":n}');
    const j=parseAIJSON(t);
    LASTDISH={di:di,pdi:tgt.pdi,mi:tgt.mi,titolo:String(j.titolo||"Piatto"),ricetta:String(j.ricetta||""),
      kcal:Math.round(j.kcal)||0,prot:Math.round(j.prot)||0,
      carb:(j.carb!=null?Math.round(j.carb):null),gras:(j.gras!=null?Math.round(j.gras):null),
      fib:(j.fibre!=null?Math.round(j.fibre):null),zuc:(j.zuccheri!=null?Math.round(j.zuccheri):null)};
    box.innerHTML="<b>"+esc(j.titolo)+"</b> (~"+Math.round(j.kcal)+" kcal · ~"+Math.round(j.prot)+" g prot)\n\n"+esc(j.ricetta)+dishButtonsHTML();
  }catch(e){box.textContent="";aiFail(e);}};
let FR=[]; // foto in attesa per lo svuota-frigo (frigo, congelatore, dispensa…)
window.frAdd=async(gal)=>{try{const g=await anyPhoto(gal,true);(Array.isArray(g)?g:[g]).forEach(x=>FR.push(x));
  const n=document.getElementById("frN");if(n)n.textContent=FR.length;
  }catch(e){}};
window.frCreate=async(di)=>{
  if(!aiOn())return aiFail(new Error("nokey"));
  if(!FR.length)return dlgAlert(tr("Prima scatta almeno una foto (), anche più di una: frigo, congelatore, dispensa."));
  const tgt=selTarget("frTarget",di);
  const extra=document.getElementById("fridgeIn").value.trim();
  const box=document.getElementById("fridgeOut");box.textContent="Guardo le "+FR.length+" foto e invento…";
  try{
    const t=await aiAskVision('Queste '+FR.length+' FOTO mostrano il cibo che ho tra frigo, congelatore e dispensa.'+(extra?' In più ho: '+extra+'.':'')+' In questo momento dovrei mangiare: '+tgt.slot+' da circa '+tgt.k+' kcal e '+tgt.p+' g di proteine.'+compNote(tgt)+' Crea UN piatto semplice da circa '+tgt.kAdj+' kcal e '+tgt.p+' g di proteine, con dosi esatte, usando SOLO ciò che vedi (al massimo 1-2 basi da dispensa come olio o sale). '+dietStr()+' Rispondi SOLO JSON: {"visti":"ingredienti riconosciuti in breve","titolo":"...","ricetta":"passaggi brevi con grammature","kcal":n,"prot":n}',FR);
    const j=parseAIJSON(t);FR=[];
    LASTDISH={di:di,pdi:tgt.pdi,mi:tgt.mi,titolo:String(j.titolo||"Piatto"),ricetta:String(j.ricetta||""),
      kcal:Math.round(j.kcal)||0,prot:Math.round(j.prot)||0,
      carb:(j.carb!=null?Math.round(j.carb):null),gras:(j.gras!=null?Math.round(j.gras):null),
      fib:(j.fibre!=null?Math.round(j.fibre):null),zuc:(j.zuccheri!=null?Math.round(j.zuccheri):null)};
    box.innerHTML=" Ho visto: "+esc(j.visti)+"\n\n<b>"+esc(j.titolo)+"</b> (~"+Math.round(j.kcal)+" kcal · ~"+Math.round(j.prot)+" g prot)\n\n"+esc(j.ricetta)+dishButtonsHTML();
  }catch(e){box.textContent="";if(e.message!=="annullato")aiFail(e);}};
/* Ultimo piatto creato (da frigo o da testo): tenuto qui, non dentro l'HTML.
   Prima i valori venivano interpolati in onclick='…' e il primo apostrofo
   della ricetta (in italiano ce n'è sempre uno) rompeva il pulsante Salva. */
let LASTDISH=null;
function dishButtonsHTML(){return '\n\n<div class="btngrid3">'+
  '<button class="btn small" onclick="dishExtra()">+ Extra</button>'+
  '<button class="btn ghost small" onclick="dishReplace()">Selezionato</button>'+
  '<button class="btn ghost small" onclick="dishSave()">Salva</button></div>';}
window.dishExtra=()=>{const d=LASTDISH;if(!d)return;
  S.week.days[d.di].extras.push({d:"Piatto creato: "+d.titolo,k:d.kcal,p:d.prot});
  save();render(cur);toast(tr("Aggiunto come extra ✓"));};
window.dishReplace=()=>{const d=LASTDISH;if(!d)return;
  if(d.pdi===undefined||!PLAN[d.pdi])return dlgAlert(tr("Nessun pasto selezionabile in questo giorno."));
  S.week.days[d.pdi].meals[d.mi].custom={d:d.titolo+" (piatto creato)",k:d.kcal,p:d.prot};
  save();render(cur);toast(tr("Pasto sostituito ✓"));};
window.dishSave=()=>{const d=LASTDISH;if(!d)return;
  addRecipe(d.titolo+(d.ricetta?" — "+d.ricetta:""),d.kcal,d.prot,d.carb,d.gras,d.fib,d.zuc);
  render(cur);};
window.addFridge=(di,k,p,n)=>{S.week.days[di].extras.push({d:"Piatto creato: "+n,k,p});save();render(cur);};
window.subFridge=(pdi,mi,k,p,n)=>{if(pdi===undefined||!PLAN[pdi])return;
  S.week.days[pdi].meals[mi].custom={d:n+" (piatto creato)",k,p};save();render(cur);
  dlgAlert(tr("Fatto: il pasto selezionato ora è «{n}».",{n:n}));};
/*  Selezionatore di menù v5: più foto, poi "Cerca" per confermare */
/* Al ristorante non si ordina "un piatto": si compone un pasto fra portate
   diverse. Qui si spunta cosa si ha voglia di fare e l'AI mette insieme la
   combinazione che sta nel target, con il totale e le alternative. */
const MENU_CATS=["Antipasto","Stuzzicherie","Primo","Secondo","Contorno","Pizza","Panino","Dolce","Bevanda"];
let MNCATS=[];
let MNALTRO="";   /* sezioni scritte a mano: ogni menù ha le sue */
window.mnCat=(i)=>{const c=MENU_CATS[i];const k=MNCATS.indexOf(c);
  if(k<0)MNCATS.push(c);else MNCATS.splice(k,1);
  const el=document.getElementById("mnCat"+i);if(el)el.checked=(k<0);};
let MN=[];        // foto del menù in attesa
let MNPHOTOS=[];  // le foto usate per la ricerca in corso, per chiedere altre scelte
let MNAT=0;       // quando sono state scattate: dopo mezz'ora non valgono più
/* Il menù di un locale non serve più quando esci: senza scadenza, la settimana
   dopo in un altro ristorante l'app userebbe ancora le foto vecchie. */
const MN_TTL=3*60*60*1000;   /* un pranzo o una cena durano: tre ore bastano */
function mnFresh(){
  if(MNAT&&Date.now()-MNAT>MN_TTL){MN=[];MNPHOTOS=[];MNSEEN=[];MNAT=0;
    const n=document.getElementById("mnN");if(n)n.textContent="";
    const b=document.getElementById("menuOut");if(b){b.style.display="none";b.textContent="";}
    return false;}
  return true;}
setInterval(()=>{try{mnFresh();}catch(e){}},60000);
window.mnAdd=async(gal)=>{try{mnFresh();const g=await anyPhoto(gal,true);(Array.isArray(g)?g:[g]).forEach(x=>MN.push(x));MNAT=Date.now();
  const n=document.getElementById("mnN");if(n)n.textContent=MN.length;}catch(e){}};
let MNSEEN=[];   /* piatti già proposti da questo menù */
window.menuSearch=async(di,ancora)=>{
  if(!aiOn())return aiFail(new Error("nokey"));
  const era=(MN.length||MNPHOTOS.length);
  if(!mnFresh()&&era)
    return dlgAlert(tr("⏱ Le foto del menù avevano più di tre ore e sono state scartate.\n\nSe sei ancora in questo locale rifotografa il menù: così non rischi di ricevere proposte prese dal ristorante di un'altra volta."));
  if(!MN.length&&!(ancora&&MNPHOTOS.length))
    return dlgAlert(tr("Prima fotografa il menù (), anche più pagine, poi premi Cerca."));
  if(!ancora){MNSEEN=[];MNPHOTOS=MN.slice();MNAT=Date.now();}
  const tgt=selTarget("menuTarget",di);
  const box=document.getElementById("menuOut");
  box.textContent=(ancora?"Cerco altre scelte nel menù":"Leggo "+MNPHOTOS.length+" foto del menù e scelgo")+"…";
  try{
    const _a=document.getElementById("mnAltro");if(_a)MNALTRO=_a.value;
    const voglio=MNCATS.concat(String(MNALTRO||"").split(",").map(x=>x.trim()).filter(Boolean));
    const vuoi=voglio.length
      ? 'Voglio ordinare esattamente queste portate: '+voglio.join(", ")+'. Scegline UNA per ciascuna e nient\'altro; se una di queste sezioni non c\'è nel menù dillo e salta quella.'
      : 'Decidi tu come comporre il pasto (una o più portate fra antipasto, stuzzicherie, primo, secondo, contorno, pizza, panino, dolce, bevanda o qualunque sezione presente nel menù), scegliendo la combinazione più sensata per questo momento.';
    const t=await aiAskVision('Queste '+MNPHOTOS.length+' FOTO sono le pagine di un menù di ristorante. In questo momento, secondo il mio piano alimentare, dovrei mangiare: '+tgt.slot+' da circa '+tgt.kAdj+' kcal e '+tgt.p+' g di proteine in TOTALE per l\'intero pasto.'+compNote(tgt)+' '+dietStr()+
      ' '+vuoi+
      ' Il TOTALE della combinazione deve avvicinarsi al target, non ogni singola portata. Prendi i nomi esattamente come sono scritti sul menù.'+
      ' Per ogni portata indica anche come ordinarla per stare nei numeri (porzione, condimento a parte, contorno al posto delle patatine…).'+
      ' Aggiungi, per le portate principali, un\'alternativa presa dallo stesso menù.'+
      (MNSEEN.length?' NON riproporre questi piatti, già suggeriti prima: '+MNSEEN.join("; ")+'. Se nel menù non restano combinazioni compatibili, rispondi con {"finito":true,"perche":"una riga"}.':'')+
      ' Rispondi SOLO JSON: {"portate":[{"cat":"Primo","nome":"nome dal menù","kcal":n,"prot":n,"come":"come ordinarlo"}],'+
      '"totale":{"kcal":n,"prot":n},"commento":"una riga sul perché questa combinazione","alternative":[{"cat":"Primo","nome":"...","kcal":n,"prot":n,"perche":"..."}]}',MNPHOTOS);
    MN=[];const n=document.getElementById("mnN");if(n)n.textContent="";
    const j=parseAIJSON(t);
    if(j&&j.finito){
      box.innerHTML='<b>Le combinazioni compatibili di questo menù sono finite.</b>\n'+esc(j.perche||"")+
        '\n\n<div class="hint">Fotografa di nuovo il menù (magari altre pagine) e riparti da capo.</div>';
      MNSEEN=[];MNPHOTOS=[];return;}
    const port=(j.portate||[]).filter(x=>x&&x.nome);
    if(!port.length)throw new Error("nessuna combinazione proposta");
    const tot={k:Math.round((j.totale&&j.totale.kcal)||port.reduce((a,x)=>a+(+x.kcal||0),0)),
               p:Math.round((j.totale&&j.totale.prot)||port.reduce((a,x)=>a+(+x.prot||0),0))};
    MNPICK={di:di,pdi:tgt.pdi,mi:tgt.mi,slot:tgt.slot,port:port,tot:tot};
    port.forEach(x=>MNSEEN.push(String(x.nome)));
    const scarto=tot.k-tgt.kAdj;
    let h='<b>'+esc(fascia(tgt.slot))+'</b> · combinazione da <b>'+tot.k+' kcal</b> · '+tot.p+' g prot'+
      ' <span style="color:'+(Math.abs(scarto)<=120?"var(--ok)":"var(--zaff)")+'">('+(scarto>=0?"+":"")+scarto+' sul target)</span>\n'+
      (j.commento?'<i>'+esc(j.commento)+'</i>\n':'')+'\n';
    port.forEach(x=>{h+='• <b>'+esc(x.cat||"Portata")+'</b>: '+esc(x.nome)+' — ~'+Math.round(x.kcal||0)+' kcal · '+Math.round(x.prot||0)+' g prot\n'+
      (x.come?'  <i>'+esc(x.come)+'</i>\n':'');});
    if((j.alternative||[]).length){
      h+='\n<b>Se preferisci cambiare una portata</b>\n';
      (j.alternative||[]).forEach(x=>{if(!x||!x.nome)return;
        h+='• '+esc(x.cat||"")+': '+esc(x.nome)+' — ~'+Math.round(x.kcal||0)+' kcal'+(x.perche?' · '+esc(x.perche):"")+'\n';});}
    h+='\n<div class="btngrid3">'+
       '<button class="btn small" onclick="mnUse()">Usa per '+esc(fascia(tgt.slot))+'</button>'+
       '<button class="btn ghost small" onclick="mnExtra()">+ Extra</button>'+
       '<button class="btn ghost small" onclick="mnSave()">Salva</button></div>'+
       '<div class="btngrid2" style="margin-top:8px">'+
       '<button class="btn ghost small" onclick="menuSearch('+di+',true)">Altra combinazione</button>'+
       '<button class="btn ghost small" onclick="mnRestart()">Ricomincia</button></div>';
    box.innerHTML=h;
  }catch(e){box.textContent="";if(e.message!=="annullato")aiFail(e);}};
let MNPICK=null;
function mnDesc(){if(!MNPICK)return "";
  return MNPICK.port.map(x=>(x.cat?x.cat+": ":"")+x.nome).join(" + ");}
window.mnUse=()=>{if(!MNPICK)return;
  if(MNPICK.pdi===undefined||!PLAN[MNPICK.pdi])return dlgAlert(tr("Nessun pasto selezionabile in questo giorno: aggiungilo come extra."));
  S.week.days[MNPICK.pdi].meals[MNPICK.mi].custom={d:"Al ristorante — "+mnDesc(),k:MNPICK.tot.k,p:MNPICK.tot.p};
  save();render(cur);toast(tr("Pasto impostato ✓"));};
window.mnExtra=()=>{if(!MNPICK)return;
  S.week.days[MNPICK.di].extras.push({d:"Al ristorante: "+mnDesc(),k:MNPICK.tot.k,p:MNPICK.tot.p});
  save();render(cur);toast(tr("Aggiunto come extra ✓"));};
window.mnSave=()=>{if(!MNPICK)return;
  addRecipe("Al ristorante — "+mnDesc(),MNPICK.tot.k,MNPICK.tot.p,null,null);};
window.mnRestart=()=>{MNSEEN=[];MNPHOTOS=[];MNPICK=null;MNAT=0;
  const b=document.getElementById("menuOut");if(b){b.style.display="none";b.textContent="";}
  toast(tr("Menù azzerato: fotografane uno nuovo"));};
window.menuPhoto=async(di)=>{await mnAdd();return menuSearch(di);}; // compatibilità

/* ═══  CARBURANTE PRE-ALLENAMENTO ═══════════════════════════════
   Non aggiunge calorie dal nulla: le PRENDE dai pasti che devi ancora
   fare, spostando solo carboidrati rapidi e lasciando intatte le proteine. */
/* ═══  MOTORE DI SAZIETÀ ═════════════════════════════════════════
   La fame è il dato che manca a tutte le app: se torna sempre alla stessa
   ora, il problema non sono le calorie ma la composizione del pasto. */
function hungryHTML(pdi,mi){
  /* Sempre visibili, anche prima della spunta: la fame si registra
     quando la senti, non quando ti ricordi di spuntare il pasto. */
  const st=S.week.days[pdi].meals[mi];
  const v=+st.hunger||0;
  return `<div class="hungry"><b>${st.done?"Che fame avevi?":tr("Che fame hai?")}</b>`+
    [1,2,3,4,5].map(n=>`<span class="${v>=n?"on":""}" title="${n} = ${n===1?"nessuna":(n===5?"tantissima":"")}" onclick="setHunger(${pdi},${mi},${n})"></span>`).join("")+
    `${v?`<small style="color:var(--grigio);margin-left:6px">${v}/5</small>`:""}</div>`;}

/* ── L'ENERGIA GUARDA INDIETRO ────────────────────────────────────
   La fame è di adesso; l'energia è un giudizio sul pasto PRECEDENTE:
   «il pranzo ti ha retto fino a ora?». È l'unico modo di scoprire
   quali piatti spengono — e si segna qui, sulla card di adesso,
   perché è ora che lo sai, non tre ore fa. Il voto finisce sul
   pasto precedente, non su questo: chi legge i numeri deve trovare
   la colpa (o il merito) sul piatto giusto. */
function pastoPrima(pdi,mi){
  const d=S.week.days[pdi];if(!d)return null;
  for(let i=mi-1;i>=0;i--){const m=d.meals[i];if(m&&m.done&&!m.skip)return {pdi,mi:i,st:m};}
  const p=S.week.days[pdi-1];
  if(p&&p.meals)for(let i=p.meals.length-1;i>=0;i--){const m=p.meals[i];if(m&&m.done&&!m.skip)return {pdi:pdi-1,mi:i,st:m};}
  return null;}

function energyHTML(pdi,mi){
  const pre=pastoPrima(pdi,mi);
  if(!pre)return "";                       /* niente pasto prima: niente domanda */
  const v=+pre.st.energy||0;
  const eti=["","spento","fiacco","normale","bene","pieno di energia"];
  /* ── L'ETICHETTA DICEVA IL CONTRARIO DEL CODICE (25/08 sera).
     Il voto è SEMPRE andato sul pasto precedente (pastoPrima, qui
     sotto) — ma la domanda «quanta energia ti ha dato?» sembrava
     riferirsi al pasto della card, e il founder ha giustamente
     protestato: «non puoi chiedere quanta energia mi ha dato subito
     dopo averlo mangiato». La domanda adesso è quella vera: con
     quanta energia ARRIVI — e la nota sotto dice dove va il voto. */
  return `<div class="energy"><b>${tr("Con quanta energia arrivi a questo pasto?")}</b>`+
    [1,2,3,4,5].map(n=>`<span class="${v>=n?"on":""}" title="${n} = ${eti[n]}" onclick="setEnergy(${pre.pdi},${pre.mi},${n})">${FULMINE}</span>`).join("")+
    `${v?`<small>${v}/5</small>`:""}</div>
    <div class="energy-nota">${esc(tr("Il voto va sul pasto precedente"))}: ${esc((pre.st.d||"").slice(0,42))}${(pre.st.d||"").length>42?"…":""}</div>`;}

const FULMINE='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z"/></svg>';

window.setEnergy=(pdi,mi,n)=>{
  const st=S.week.days[pdi].meals[mi];
  st.energy=(+st.energy===n)?0:n;
  const d=S.week.days[pdi];
  const vals=(d.meals||[]).filter(m=>m.energy>0).map(m=>+m.energy);
  d.energyAvg=vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10:0;
  save();render(cur);};

/* Quali piatti ti spengono: serve almeno 3 voti sullo stesso piatto,
   altrimenti è aneddoto, non pattern. */
function energyStats(){
  const per={};
  for(const d of flattenDiet())for(const m of (d.meals||[])){
    if(!m.energy||!m.d)continue;
    const k=(m.d||"").toLowerCase().slice(0,40);
    (per[k]=per[k]||[]).push(+m.energy);}
  const righe=Object.entries(per).filter(([,v])=>v.length>=3)
    .map(([k,v])=>({piatto:k,media:Math.round(v.reduce((a,b)=>a+b,0)/v.length*10)/10,n:v.length}))
    .sort((a,b)=>a.media-b.media);
  return righe.length?righe:null;}
window.energyStats=energyStats;
/* «Non l'ho mangiato» dalla card di adesso: salta questo e mostra il
   prossimo, senza passare dal Piano. Annullabile come tutto il resto:
   un tocco per sbaglio non deve costare un pasto. */
window.saltaPasto=(pdi,mi)=>{
  try{usoSegna("pasto_salta");}catch(e){}
  const st=S.week.days[pdi].meals[mi];
  st.done=false;st.skip=true;
  save();render(cur);   /* save() registra da solo lo stato di prima:
                           «Annulla» in cima alla pagina lo riporta */
  toast(tr("Pasto saltato. Il bilancio si è riassestato — Annulla se è stato un tocco per sbaglio."));};

window.setHunger=(pdi,mi,n)=>{const st=S.week.days[pdi].meals[mi];
  st.hunger=(+st.hunger===n)?0:n;
  const d=S.week.days[pdi];
  const vals=(d.meals||[]).filter(m=>m.hunger>0).map(m=>+m.hunger);
  d.hungerAvg=vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10:0;
  save();render(cur);};
/* I dati di fame e cali vivevano solo nei prompt: le *Stats li espongono
   anche a te, in Numeri. Stessi numeri, due lettori. */
function hungerStats(){
  const rows=flattenDiet().filter(d=>d.hungerAvg>0).slice(-14);
  if(rows.length<3)return null;
  const avg=Math.round(rows.reduce((a,d)=>a+d.hungerAvg,0)/rows.length*10)/10;
  return {avg,n:rows.length};}
function hungerForAI(){
  const st=hungerStats();
  if(!st)return "";
  const avg=st.avg;
  if(avg<3.2)return "";
  return " FAME: negli ultimi giorni la persona ha segnato una fame media di "+avg+"/5, quindi alta. "+
    "A parità di calorie, aumenta il potere saziante dei pasti: più fibre (verdura, legumi, cereali integrali), "+
    "più proteine ai pasti principali, più volume (zuppe, insalate, verdure cotte) e meno carboidrati raffinati.";}
window.fuelPre=async(di)=>{
  if(!aiOn())return aiFail(new Error("nokey"));
  const box=document.getElementById("fuelOut");
  const items=dayItems(di).filter(it=>{const st=S.week.days[it.pdi].meals[it.mi];return !st.done&&!st.skip;});
  if(!items.length)return dlgAlert(tr("Non ci sono pasti ancora da consumare oggi da cui prendere l'energia.\n\nSe hai già mangiato tutto, aggiungi lo spuntino come + Extra."));
  const lista=items.map(it=>{const o=mealOpt(it.pdi,it.mi);return {slot:it.slot,pdi:it.pdi,mi:it.mi,d:o.d,k:o.k,p:o.p,c:o.c||0};});
  box.style.display="block";box.textContent="Cerco dove prendere l'energia senza sballare la giornata…";
  try{
    const t=await aiAsk('Mi alleno fra circa 45 minuti e sono senza energie. NON aggiungere calorie alla giornata: '+
      'devi PRENDERE una quota di carboidrati semplici dai pasti che devo ancora consumare e trasformarla in uno spuntino pre-allenamento ad assorbimento rapido. '+
      'Le proteine dei pasti restano INTATTE: si tolgono solo carboidrati (e semmai un po\' di grassi). '+
      'Pasti ancora da fare oggi: '+JSON.stringify(lista)+'. '+rulesForAI()+
      ' Lo spuntino deve essere piccolo, digeribile e a carica glicemica rapida (frutta, miele, gallette, marmellata), da mangiare subito. '+
      'Rispondi SOLO JSON: {"spuntino":"cosa mangiare ora con le grammature","kcal":n,"carb":n,"da":[{"pdi":n,"mi":n,"slot":"...","nuovo":"descrizione del pasto ridotto con grammature","kcal":n,"prot":n,"tolto":"cosa ho tolto"}],"nota":"una riga di incoraggiamento"}');
    const j=parseAIJSON(t);
    FUEL={di:di,sp:{d:String(j.spuntino||""),k:Math.round(j.kcal)||0,c:Math.round(j.carb)||0},da:(j.da||[]).filter(x=>x&&x.nuovo)};
    let h='<b>Mangia ORA</b>: '+esc(FUEL.sp.d)+' — ~'+FUEL.sp.k+' kcal'+(FUEL.sp.c?' · '+FUEL.sp.c+' g di carboidrati rapidi':'')+'\n\n';
    h+='<b>Da dove arriva</b> (proteine intatte):\n';
    FUEL.da.forEach(x=>{h+='• '+esc(fascia(x.slot))+': '+esc(x.nuovo)+' — ~'+Math.round(x.kcal||0)+' kcal · '+Math.round(x.prot||0)+' g prot'+(x.tolto?' <i>(tolto: '+esc(x.tolto)+')</i>':'')+'\n';});
    if(j.nota)h+='\n<i>'+esc(j.nota)+'</i>\n';
    h+='\n<div class="btngrid2"><button class="btn small" onclick="fuelApply()">Applica: mangio ora e aggiorno i pasti</button>'+
       '<button class="btn ghost small" onclick="fuelPre('+di+')">Un\'altra idea</button></div>';
    box.innerHTML=h;
  }catch(e){box.textContent="";aiFail(e);}};
let FUEL=null;
/* ═══  SPLIT-PORTION ══════════════════════════════════════════════
   Si cucina una pentola sola: l'AI dà le dosi totali (a crudo) e i grammi
   esatti da mettere nel TUO piatto, già convertiti in peso cotto. */
/* ═══  PERCHÉ OGGI LA BILANCIA SALE ══════════════════════════════ */
function waterPredict(di){
  const prev=di>0?di-1:-1;if(prev<0)return "";
  const d=S.week.days[prev];if(!d)return "";
  const e=eatenOfDay(prev);const carb=e.c||0;
  const wk=(d.workouts||[]);const dur=wk.reduce((a,w)=>a+(+w.min||0),0);
  const intenso=wk.some(w=>w.int==="alta")||dur>60;
  const cause=[];let g=0;
  if(carb>=250){cause.push("ieri hai preso <b>"+Math.round(carb)+" g di carboidrati</b>, e ogni grammo di glicogeno trattiene circa 3 g d'acqua");g+=0.8;}
  else if(carb>=180){cause.push("i carboidrati di ieri ("+Math.round(carb)+" g) hanno ricaricato il glicogeno, che porta acqua con sé");g+=0.4;}
  if(intenso){cause.push("l'allenamento di ieri"+(dur?" ("+dur+" minuti)":"")+" lascia una <b>infiammazione da riparazione</b> che trattiene liquidi nei muscoli");g+=0.5;}
  if((d.water||0)&&(d.water||0)<Math.round(waterGoal(prev)*0.6)){cause.push("hai bevuto poco, e il corpo trattiene più acqua quando ne riceve meno");g+=0.3;}
  if(cycleDay()){cause.push("sei in fase luteale, quando la ritenzione è fisiologica");g+=0.8;}
  if(!cause.length)return "";
  return "Se ti pesi stamattina, potresti trovare fino a <b>"+(Math.round(g*10)/10).toString().replace(".",",")+" kg in più</b> rispetto a ieri: "+
    cause.join("; ")+". È <b>acqua, non grasso</b> — se ne va da sola in un paio di giorni. Non cambiare il piano per questo.";}
/* ═══  CRONONUTRIZIONE ═══ */
function chronoForAI(di){
  const d=S.week.days[di===undefined?viewIdx():di];if(!d)return "";
  const p=[];
  if(d.sleep&&d.sleep<=2)p.push("ha dormito male (sonno "+d.sleep+"/5): sposta la maggior parte dei carboidrati a pranzo, tieni la cena più leggera e proteica, niente zuccheri semplici la sera");
  if(d.relax&&d.relax<=2)p.push("giornata stressata (relax "+d.relax+"/5): pasti semplici e qualcosa di caldo e confortante che non sfori");
  if(d.feel&&d.feel<=2)p.push("non si sente bene (umore "+d.feel+"/5): proponi cose che le piacciono davvero, dentro i numeri");
  if(d.hungerAvg>=4)p.push("oggi ha avuto molta fame (media "+d.hungerAvg+"/5): più fibre, proteine e volume a parità di calorie");
  return p.length?(" COME STA OGGI: "+p.join("; ")+"."):"";}
window.calibraGiornata=async()=>{
  const di=viewIdx();if(di<0)return dlgAlert(tr("Torna a un giorno della settimana in corso."));
  if(!aiOn())return aiFail(new Error("nokey"));
  const d=S.week.days[di],ctx=chronoForAI(di);
  if(!ctx&&!physBonus())return dlgAlert(tr("Per calibrare la giornata servono i tuoi dati di oggi.\n\nDai un voto a sonno e come ti senti (e segna la fame sotto i pasti spuntati)."));
  const items=dayItems(di).filter(it=>{const st=S.week.days[it.pdi].meals[it.mi];return !st.done&&!st.skip;});
  if(!items.length)return dlgAlert(tr("Non ci sono pasti ancora da fare oggi da riorganizzare."));
  const righe=[];
  if(d.sleep)righe.push("sonno "+d.sleep+"/5");if(d.relax)righe.push("relax "+d.relax+"/5");
  if(d.feel)righe.push("come ti senti "+d.feel+"/5");if(d.hungerAvg)righe.push("fame media "+d.hungerAvg+"/5");
  if(physBonus())righe.push(physNote());
  if(!await dlgConfirm(tr("Calibro la giornata su come stai?\n\n{a}\n\nRiorganizzo i {b} pasti che devi ancora fare — stesse calorie totali, distribuzione diversa.",{a:righe.join(" · "),b:items.length}),
    {ok:tr("Calibra"),ko:tr("Lascia com'è")}))return;
  const box=document.getElementById("caliOut");
  if(box){box.style.display="block";genBoxMostra(box);box.textContent=" Riorganizzo i pasti che restano…";}
  try{
    const lista=items.map(it=>{const o=mealOpt(it.pdi,it.mi);return {pdi:it.pdi,mi:it.mi,slot:it.slot,d:o.d,k:o.k,p:o.p};});
    const t=await aiAsk('Riorganizza questi pasti ancora da consumare oggi MANTENENDO invariato il totale di calorie e proteine: cambia solo la distribuzione e la composizione.'+ctx+' '+rulesForAI()+
      ' Pasti: '+JSON.stringify(lista)+'. Rispondi SOLO JSON: {"pasti":[{"pdi":n,"mi":n,"slot":"...","nuovo":"descrizione con grammature","kcal":n,"prot":n,"perche":"una riga"}],"nota":"una riga"}');
    const j=parseAIJSON(t);
    const arr=(j.pasti||[]).filter(x=>x&&x.nuovo);
    if(!arr.length)throw new Error("nessuna proposta");
    CALI=arr;
    let h=(j.nota?'<i>'+esc(j.nota)+'</i>\n\n':'');
    arr.forEach(x=>{h+='• <b>'+esc(x.slot||"")+'</b>: '+esc(x.nuovo)+' — ~'+Math.round(x.kcal||0)+' kcal · '+Math.round(x.prot||0)+' g prot'+(x.perche?'\n <i>'+esc(x.perche)+'</i>':'')+'\n';});
    h+='\n<div class="btngrid2"><button class="btn small" onclick="calibraApply()">Applica ai pasti di oggi</button><button class="btn ghost small" onclick="calibraGiornata()">Riprova</button></div>';
    if(box)box.innerHTML=h;
  }catch(e){if(box)box.textContent="";genBoxVia();aiFail(e);}};
let CALI=null;
window.calibraApply=()=>{if(!CALI)return;
  CALI.forEach(x=>{const pdi=+x.pdi,mi=+x.mi;
    if(PLAN[pdi]&&PLAN[pdi].meals[mi])
      S.week.days[pdi].meals[mi].custom={d:String(x.nuovo),k:Math.round(x.kcal)||0,p:Math.round(x.prot)||0};});
  save();render(cur);toast(tr("Giornata calibrata ✓"));};
/* ═══ INFRASTRUTTURA DEI TOOL ══════════════════════════════════════
   Tutti gli strumenti seguono lo stesso giro: box, chiamata all'AI,
   risultato con i pulsanti per usarlo. Scritto una volta sola. */
let TOOLPICK=null;
let SNACKT=null;
function bindSwipe(root){
  if(!root||root._swipeBound)return;root._swipeBound=true;
  let x0=0,y0=0,el=null,act=null,dx=0,lock=null;
  root.addEventListener("touchstart",ev=>{
    const w=ev.target.closest?ev.target.closest(".swipe"):null;
    if(!w||ev.target.closest("button"))return;
    el=w.querySelector(".meal");act=w.getAttribute("data-del");
    x0=ev.touches[0].clientX;y0=ev.touches[0].clientY;dx=0;lock=null;},{passive:true});
  root.addEventListener("touchmove",ev=>{
    if(!el)return;
    const cx=ev.touches[0].clientX-x0,cy=ev.touches[0].clientY-y0;
    if(lock===null)lock=Math.abs(cx)>Math.abs(cy)+6?"x":"y";
    if(lock!=="x")return;
    dx=Math.min(0,cx);el.style.transform="translateX("+dx+"px)";
    const bg=el.parentNode.querySelector(".swipebg");
    if(bg)bg.style.opacity=String(Math.min(1,Math.abs(dx)/90));},{passive:true});
  root.addEventListener("touchend",()=>{
    if(!el)return;
    const bg=el.parentNode.querySelector(".swipebg");
    if(dx<-90&&act){el.style.transform="translateX(-110%)";
      const fn=act;setTimeout(()=>{try{(new Function(fn))();}catch(e){}},160);}
    else{el.style.transform="";if(bg)bg.style.opacity=0;}
    el=null;act=null;dx=0;lock=null;});}
function snackUndo(msg,undo,ms){
  const old=document.getElementById("snackBar");if(old)old.remove();
  if(SNACKT)clearTimeout(SNACKT);
  const el=document.createElement("div");el.className="snack";el.id="snackBar";
  el.innerHTML=`<span>${esc(msg)}</span><button id="snackUndo">${tr("ANNULLA")}</button>`;
  document.body.appendChild(el);
  el.querySelector("#snackUndo").onclick=()=>{try{undo&&undo();}catch(e){}
    el.remove();if(SNACKT)clearTimeout(SNACKT);toast(tr("Annullato ✓"));};
  SNACKT=setTimeout(()=>{const e2=document.getElementById("snackBar");if(e2)e2.remove();},ms||4500);}
function toolBox(id){const b=document.getElementById(id);if(b){b.style.display="block";}return b;}
async function toolRun(id,prompt,fmt,attesa){
  if(!aiOn())return aiFail(new Error("nokey"));
  const box=toolBox(id);if(!box)return;
  box.innerHTML=`<div class="skel"></div><div class="skel"></div><div class="skel" style="width:60%"></div>`;
  try{const t=await aiAsk(prompt);const j=parseAIJSON(t);box.innerHTML=fmt(j);}
  catch(e){box.textContent="";aiFail(e);}}
/* pulsanti standard su un piatto proposto */
function toolBtns(di,pdi,mi,slot,d,k,p){
  TOOLPICK={di:di,pdi:pdi,mi:mi,d:d,k:k,p:p};
  return `<div class="btngrid3" style="margin:8px 0 4px">
    <button class="btn small" onclick="toolUse()">${tr("Usa per")} ${esc(slot||"il pasto")}</button>
    <button class="btn ghost small" onclick="toolExtra()">+ Extra</button>
    <button class="btn ghost small" onclick="toolSave()">${tr("Salva")}</button></div>`;}
window.toolUse=()=>{const x=TOOLPICK;if(!x)return;
  let pdi=x.pdi,mi=x.mi;
  if(pdi===undefined||!PLAN[pdi]){const t=targetMealOf(x.di);
    if(t&&t.pdi!==undefined&&PLAN[t.pdi]){pdi=t.pdi;mi=t.mi;}
    else return dlgAlert(tr("Nessun pasto selezionabile: usa «+ Extra»."));}
  S.week.days[pdi].meals[mi].custom={d:x.d,k:x.k,p:x.p};
  save();render(cur);toast(tr("Pasto impostato ✓"));};
window.toolExtra=()=>{const x=TOOLPICK;if(!x)return;
  S.week.days[x.di].extras.push({d:x.d,k:x.k,p:x.p});
  save();render(cur);toast(tr("Aggiunto come extra ✓"));};
window.toolSave=()=>{const x=TOOLPICK;if(!x)return;addRecipe(x.d,x.k,x.p,null,null);};
/* riscrive i pasti indicati dall'AI (usato da più strumenti) */
function applyMealEdits(arr){
  (arr||[]).forEach(x=>{const pdi=+x.pdi,mi=+x.mi;
    if(PLAN[pdi]&&PLAN[pdi].meals[mi])
      S.week.days[pdi].meals[mi].custom={d:String(x.nuovo||x.d||""),k:Math.round(x.kcal)||0,p:Math.round(x.prot)||0};});
  save();render(cur);}
/* elenco dei pasti ancora da fare, pronto per i prompt */
function pendingMeals(di){
  return dayItems(di).filter(it=>{const st=S.week.days[it.pdi].meals[it.mi];return !st.done&&!st.skip;})
    .map(it=>{const o=mealOpt(it.pdi,it.mi);const m=PLAN[it.pdi].meals[it.mi];
      return {pdi:it.pdi,mi:it.mi,slot:it.slot,t:(m&&m.t)||"",d:o.d,k:o.k,p:o.p,c:o.c||0,f:o.f||0};});}
/* ── Qual è «il prossimo pasto» ────────────────────────────────────
   Regola: il PRIMO pasto non ancora segnato, in ordine di orario. Non
   quello dell'ora corrente.
   Perché così e non a fasce orarie: chi lavora su turni, chi fa colazione
   alle 11 o chi ha saltato un pasto vedrebbe l'app saltare avanti da sola,
   e il pasto scavalcato sparirebbe senza che nessuno l'abbia segnato —
   restando poi conteggiato nel bilancio. Con questa regola l'ordine è
   sempre quello del piano e nulla sparisce da solo.
   Chi ha saltato un pasto lo dichiara: dalla lista in Oggi, con ✗.
   L'unica concessione all'orologio è l'etichetta: se l'orario del pasto
   è già passato di oltre un'ora, si dice — così si capisce perché è lì. */
/* «Stai bevendo abbastanza?» con i bicchieri, nel Punto, subito prima
   del prossimo pasto: è il momento in cui uno pensa a cosa mette in
   bocca, ed è l'unico in cui si ricorda anche di bere. */
/* Un'unica funzione per i bicchieri: prima ce n'erano due — «.water»
   con le gocce in Oggi e «.ag» nel Punto — e la stessa cosa aveva due
   forme diverse a seconda di dove la guardavi. */
/* ── GLI STRUMENTI DEL PASTO, ANCHE SULLA SCHEDA PUNTO ────────────
   Erano solo dentro il Piano: chi vive sulla card di adesso doveva
   fare un viaggio per fotografare o scansionare. Dieci strumenti,
   due file da cinque — pari, senza il bottone spaiato che tradisce
   una griglia pensata male. Gli handler sono QUELLI DEL PIANO, non
   copie: stessa funzione, un posto solo da correggere. I due nuovi
   (commensali, cucina guidata) arrivano col prossimo sprint: finché
   non esistono il bottone lo DICE, invece di rompersi in silenzio. */
window.prossimamente=()=>toast(tr("Arriva col prossimo aggiornamento — ci stiamo lavorando."));

function attrezziPasto(pdi,mi){
  const B=[
   ["camera",tr("Scatta la foto del piatto adesso"),"mealPhoto("+pdi+","+mi+")"],
   ["gallery",tr("Scegli una foto già salvata nella galleria"),"mealPhoto("+pdi+","+mi+",true)"],
   /* si passa IL BOTTONE (this), non un id: la griglia sta sotto ogni
      pasto e un id si ripeterebbe — così l'anello verde si accende e
      si SPEGNE sul bottone toccato (riscontro 25/08: restava acceso) */
   ["mic",tr("Detta cosa hai mangiato (conferma prima di salvare)"),"vocePasto(this)"],
   ["tag",tr("Barcode: scansiona i prodotti di questo pasto"),"scanStart(viewIdx(),"+pdi+","+mi+")"],
   ["guest",tr("Sono ospite: registra il pasto con una stima"),"stealthOpen("+pdi+","+mi+")"],
   ["persone",tr("Per quante persone cucini?"),"commensali("+pdi+","+mi+")"],
   ["pentola",tr("Come si cucina: te lo spiega passo passo"),"comeCucino("+pdi+","+mi+")"],
   ["dice",tr("Inventami un'alternativa con gli stessi macro"),"altMeal("+pdi+","+mi+")"],
   ["swap",tr("Non ho un ingrediente: 3 sostituzioni"),"subIngr("+pdi+","+mi+")"],
   ["undo",tr("Ripristina originale"),"resetMeal("+pdi+","+mi+")"]
  ];
  return `<div class="attrezzi">${B.map(([icn,ti,fn])=>
    `<button class="ibtn apic" title="${ti}" aria-label="${ti}" onclick="${fn}">${ic(icn,19)}</button>`).join("")}</div>`;}

/* `attrezziApri` (il foglio dietro il ⋯) è vissuta una consegna:
   v13.86 → v13.89. Il founder ha provato il ⋯ sul telefono e ha
   deciso che gli attrezzi si vedono, non si aprono. Una funzione
   senza chiamanti non si lascia in giro. */

function acquaRiga(di,titolo){
  /* Il disegno vero sta in 53_bicchieri: qui resta l'aggancio, così
     i bicchieri cambiano in tutti i posti in cui la riga appare. */
  if(typeof acquaRiga2==="function")return acquaRiga2(di,titolo);
  const g=waterGoal(di),b=(S.week.days[di]||{}).water||0;
  return `<div class="acqriga"><div class="ah"><span>${titolo||tr("Stai bevendo abbastanza?")}</span><b>${b} / ${g}</b></div></div>`;}

function prossimoPasto(di){
  const p=pendingMeals(di);
  if(!p.length)return null;
  const m=p[0];
  const oraOra=new Date().getHours()+new Date().getMinutes()/60;
  const mm=String(m.t||"").match(/^(\d{1,2})[:.](\d{2})/);
  m.tardi=(isToday()&&mm)?((oraOra-(+mm[1]+ +mm[2]/60))>1):false;
  m.altri=p.length-1;
  return m;}

/* ═══  BUSSOLA DELLE VOGLIE ══════════════════════════════════════ */
const CRAVE=[["croccante","Croccante"],["dolce","Dolce"],["caldo","Caldo"],
             ["cremoso","Cremoso"],["salato","Salato"],["freddo","Freddo"]];
let CRAVESEL=[];
window.craveTog=(k)=>{const i=CRAVESEL.indexOf(k);if(i<0)CRAVESEL.push(k);else CRAVESEL.splice(i,1);
  const el=document.getElementById("craveBox");if(el)el.innerHTML=craveRows();};
/* Prima della ricetta, un gesto: una voglia sale e scende, e a volte
   dieci minuti bastano. Non «non mangiare» — solo, poi decidi tu. */
function craveGesti(){
  return (typeof gestiBlocco==="function")?gestiBlocco("voglia",tr("Prima, se vuoi")):"";}
window.craveGesti=craveGesti;

function craveRows(){return `<div class="ckgrid crave3">`+CRAVE.map(([k,l])=>
  `<label class="ck"><input type="checkbox" ${CRAVESEL.indexOf(k)>-1?"checked":""} onchange="craveTog('${k}')"> ${l}</label>`).join("")+`</div>`;}
window.craveHack=(di)=>{
  if(!CRAVESEL.length)return dlgAlert(tr("Scegli almeno una voglia: croccante, dolce, cremoso, salato o caldo."));
  const t=selTarget("craveTarget",di),e=eatenOfDay(di);
  const resto=Math.max(0,dayTargetK()-e.k), restoP=Math.max(0,dayTargetP()-e.p);
  return toolRun("craveOut",
    'Ho una voglia precisa: '+CRAVESEL.join(" + ")+'. Oggi mi restano circa '+resto+' kcal e '+restoP+' g di proteine. '+rulesForAI()+
    ' Inventa UN "hack" culinario immediato che soddisfi ESATTAMENTE quella sensazione (croccante = scrocchia sotto i denti; cremoso = testura vellutata; caldo = conforta e scalda; freddo = gelato, ghiacciato, rinfrescante; dolce e salato per il gusto) restando dentro le calorie che mi restano. '+
    'Deve essere pronto in pochi minuti con ingredienti comuni. Rispondi SOLO JSON: {"nome":"...","d":"cosa fare con le grammature","kcal":n,"prot":n,"perche":"perché soddisfa proprio quella voglia","min":n}',
    j=>'<b>'+esc(j.nome||"")+'</b> — ~'+Math.round(j.kcal||0)+' kcal · '+Math.round(j.prot||0)+' g prot'+(j.min?' · '+j.min+' min':'')+
       '\n'+esc(j.d||"")+(j.perche?'\n<i>'+esc(j.perche)+'</i>':'')+
       toolBtns(di,t.pdi,t.mi,t.slot,String(j.nome||"")+" — "+String(j.d||""),Math.round(j.kcal)||0,Math.round(j.prot)||0)+
       '<div class="btngrid2"><button class="btn ghost small" onclick="craveHack('+di+')">Un\'altra idea</button></div>');};

/* ═══  DIPLOMAZIA DI COPPIA ══════════════════════════════════════ */
window.coupleFork=async(di)=>{
  const v=await dlgPrompt(tr("Cosa vogliono mangiare le altre persone a tavola?\n\n(scrivi il piatto: carbonara, pizza, lasagne…)"),"");
  if(!v||!v.trim())return;
  const t=selTarget("coupleTarget",di);
  const all=famAll(),sel=splitMembers();
  const altri=sel.map(i=>all[i]).filter(m=>m&&!m.me).map(m=>((m.nome||"").trim()?m.nome.trim()+" ("+famBand(m).l.split(" (")[0].toLowerCase()+")":famBand(m).l.split(" (")[0].toLowerCase()));
  if(SPLIT.guests)altri.push(SPLIT.guests+(SPLIT.guests>1?" ospiti":" ospite"));
  return toolRun("coupleOut",
    'A tavola con me ci sono: '+(altri.length?altri.join(", "):"un\'altra persona")+' — in tutto circa '+(Math.round(splitUnits()*100)/100)+' porzioni di riferimento (io=1, donna adulta=1, uomo=1,25, adolescente=1,10, bambino=0,75, infante=0,50). Vogliono mangiare: '+v.trim()+'. Io devo restare in circa '+t.kAdj+' kcal e '+t.p+' g di proteine per il pasto «'+t.slot+'».'+compNote(t)+' '+rulesForAI()+
    ' Crea una RICETTA A BIFORCAZIONE: si cucina insieme la stessa base (con le dosi TOTALI per tutte le porzioni indicate), poi si divide e ognuno completa la sua parte. '+
    'Non deve sembrare una punizione: la mia versione deve restare gustosa e simile alla loro. '+
    'Rispondi SOLO JSON: {"piatto":"nome","base":"cosa si cucina insieme con le grammature","loro":"come completare il loro piatto","mio":"come completare il mio piatto con le grammature","kcal":n,"prot":n,"trucco":"la furbizia che rende il mio piatto simile al loro"}',
    j=>'<b>'+esc(j.piatto||"")+'</b>\n\n<b>Insieme</b>: '+esc(j.base||"")+
       '\n<b>Per loro</b>: '+esc(j.loro||"")+
       '\n<b>Per te</b>: '+esc(j.mio||"")+' — ~'+Math.round(j.kcal||0)+' kcal · '+Math.round(j.prot||0)+' g prot'+
       (j.trucco?'\n\n<i>'+esc(j.trucco)+'</i>':'')+
       toolBtns(di,t.pdi,t.mi,t.slot,String(j.piatto||"")+" — "+String(j.mio||""),Math.round(j.kcal)||0,Math.round(j.prot)||0));};

/* ═══  SENSORE DI ABBIOCCO ═══════════════════════════════════════ */
const CRASH_SLOTS=[["mattina","Mattina"],["pomeriggio","Pomeriggio"],["sera","Sera"]];  /* etichette tradotte al disegno */
const CRASH_H={mattina:9,pomeriggio:16,sera:21,"dopo-pranzo":14.5,notte:23};
/* Tre caselle affiancate su uno schermo stretto si sovrapponevano e i
   quadratini finivano fuori posto. Una per riga, come gli altri stati. */
function crashHTML(di){
  const d=S.week.days[di]||{};const set=d.crash||[];
  return `<div style="border-top:1px solid var(--linea);margin-top:16px;padding-top:14px">
    <label>${tr("Cali di energia")}</label>
    <div class="statolist">`+CRASH_SLOTS.map(([k,l0])=>{const l=tr(l0);
      const on=set.indexOf(k)>-1;
      return `<label class="stato ${on?"on":""}">
        <input type="checkbox" ${on?"checked":""} onchange="crashTog(${di},'${k}')">
        <span class="sl"><b>${l}</b><small>${{mattina:tr("Sonnolenza o fame dopo colazione"),pomeriggio:tr("Il classico crollo del primo pomeriggio"),sera:tr("Stanchezza o voglia di dolce dopo cena")}[k]||""}</small></span></label>`;}).join("")+
    `</div><div class="hint">${tr("L'AI lega il calo al pasto precedente e, se lo schema si ripete, riduce i carboidrati raffinati di quel pasto.")}</div></div>`;}
window.crashTog=(di,k)=>{
  const d=S.week.days[di];d.crash=d.crash||[];
  const i=d.crash.indexOf(k);
  if(i<0){d.crash.push(k);S.crashes=S.crashes||[];
    const items=dayItems(di).filter(it=>S.week.days[it.pdi].meals[it.mi].done);
    const last=items.length?items[items.length-1]:null;
    const o=last?mealOpt(last.pdi,last.mi):null;
    S.crashes.push({at:new Date().toISOString(),h:CRASH_H[k]||12,slot:k,pasto:last?last.slot:"",d:o?String(o.d).slice(0,80):"",k:o?o.k:0,c:o?(o.c||0):0});
    if(S.crashes.length>200)S.crashes=S.crashes.slice(-200);
  }else{d.crash.splice(i,1);
    S.crashes=(S.crashes||[]).filter(x=>!(x.slot===k&&String(x.at).slice(0,10)===iso(new Date())));}
  save();render(cur);};
function crashStats(){
  const c=(S.crashes||[]).slice(-20);
  if(c.length<3)return null;
  const perPasto={};
  c.forEach(x=>{if(!x.pasto)return;perPasto[x.pasto]=(perPasto[x.pasto]||0)+1;});
  const top=Object.keys(perPasto).sort((a,b)=>perPasto[b]-perPasto[a])[0];
  if(!top)return null;
  const carbMedi=Math.round(c.filter(x=>x.pasto===top).reduce((a,x)=>a+(x.c||0),0)/Math.max(1,perPasto[top]));
  return {n:c.length,top,carbMedi};}
function crashForAI(){
  const st=crashStats();
  if(!st)return "";
  const c={length:st.n},top=st.top,carbMedi=st.carbMedi;
  return " CALI DI ENERGIA: la persona ha segnalato "+st.n+" cali recenti, per lo più dopo «"+top+"» (in media "+carbMedi+
    " g di carboidrati). Riduci i carboidrati raffinati di quel pasto, spostali dove servono e aumenta proteine, fibre e grassi buoni per appiattire la curva glicemica.";}

/* ═══  PRONTO SOCCORSO GONFIORE ═════════════════════════════════ */
window.bloatSOS=(di)=>{
  const ieri=di>0?di-1:-1;
  const mangiato=[];
  [ieri,di].forEach(k=>{if(k<0)return;
    dayItems(k).forEach(it=>{const st=S.week.days[it.pdi].meals[it.mi];
      if(st.done){const o=mealOpt(it.pdi,it.mi);mangiato.push(o.d);}});
    (S.week.days[k].extras||[]).forEach(e=>mangiato.push(e.d));});
  const tgt=selTarget("bloatTarget",di);
  let dopo=pendingMeals(di);
  const _bx=dopo.findIndex(m=>m.pdi===tgt.pdi&&m.mi===tgt.mi);
  if(_bx>0)dopo=dopo.slice(_bx);
  return toolRun("bloatOut",
    'Sento gonfiore e pesantezza. Ecco cosa ho mangiato nelle ultime 48 ore: '+JSON.stringify(mangiato.slice(-14))+'. '+rulesForAI()+
    ' 1) Individua i probabili responsabili (legumi, cavoli, cipolla, aglio, dolcificanti, eccesso di fibre, sale, bibite gassate). '+
    '2) RASSICURAMI: spiega in una riga che l\'eventuale aumento sulla bilancia è gas e acqua, non grasso. '+
    '3) Riscrivi i pasti che devo ancora fare in versione ad ALTISSIMA digeribilità (verdure cotte, finocchio, carote, zenzero, riso, patate, pesce bianco), togliendo i fermentescibili, MANTENENDO calorie e proteine. '+
    'Pasti da riscrivere: '+JSON.stringify(dopo)+
    '. Rispondi SOLO JSON: {"colpevoli":"...","rassicurazione":"...","pasti":[{"pdi":n,"mi":n,"slot":"...","nuovo":"...","kcal":n,"prot":n}],"consiglio":"una cosa pratica da fare subito"}',
    j=>{BLOAT=j.pasti||[];
      return '<b>Probabili responsabili</b>: '+esc(j.colpevoli||"")+
        '\n\n'+esc(j.rassicurazione||"")+
        (j.consiglio?'\n\n<i>'+esc(j.consiglio)+'</i>':'')+
        (BLOAT.length?'\n\n<b>Pasti alleggeriti</b>\n'+BLOAT.map(x=>'• '+esc(x.slot||"")+': '+esc(x.nuovo||"")+' — ~'+Math.round(x.kcal||0)+' kcal').join('\n')+
          '<div class="btngrid2" style="margin-top:8px"><button class="btn small" onclick="applyMealEdits(BLOAT)">Applica ai pasti di oggi</button></div>':"");});};
let BLOAT=null;

/* ═══  SCUDO TRAPPOLA IN UFFICIO ════════════════════════════════ */
window.treatDefuse=async(di)=>{
  const v=await dlgPrompt(tr("Cosa ti hanno offerto?\n\n(es. «una fetta di torta», «due cornetti», «cioccolatini»)"),"");
  if(!v||!v.trim())return;
  const tgt=selTarget("treatTarget",di);
  const dopo=pendingMeals(di);
  return toolRun("treatOut",
    'Mi hanno appena offerto in ufficio: '+v.trim()+'. Non voglio rinunciare del tutto ma nemmeno mandare all\'aria la giornata. '+rulesForAI()+
    ' Negozia con me: dimmi di mangiarne circa METÀ e QUANDO conviene farlo (subito dopo un pasto, così fibre e proteine appiattiscono la curva glicemica), '+
    'e spiega in una riga perché funziona. Poi togli l\'equivalente (circa 15 g di carboidrati e 5 g di grassi) dal pasto «'+tgt.slot+'», mantenendo le proteine. '+
    'Pasti che restano: '+JSON.stringify(dopo)+
    '. Rispondi SOLO JSON: {"quanto":"quanto mangiarne","quando":"quando mangiarlo","perche":"...","kcalStimate":n,"pasti":[{"pdi":n,"mi":n,"slot":"...","nuovo":"...","kcal":n,"prot":n}]}',
    j=>{TREAT=j.pasti||[];
      return '<b>'+esc(j.quanto||"")+'</b> — '+esc(j.quando||"")+
        (j.perche?'\n<i>'+esc(j.perche)+'</i>':'')+
        (j.kcalStimate?'\n\nCosto stimato: ~'+Math.round(j.kcalStimate)+' kcal, già assorbite qui sotto.':'')+
        (TREAT.length?'\n\n<b>Compenso</b>\n'+TREAT.map(x=>'• '+esc(x.slot||"")+': '+esc(x.nuovo||"")+' — ~'+Math.round(x.kcal||0)+' kcal · '+Math.round(x.prot||0)+' g prot').join('\n')+
          '<div class="btngrid2" style="margin-top:8px"><button class="btn small" onclick="applyMealEdits(TREAT)">Accetto: applica</button></div>':"");});};
let TREAT=null;

/* ═══  FAME DA LUPI (volume eating) ══════════════════════════════ */
window.volumeSOS=(di)=>{
  const t=selTarget("volTarget",di);const o=(t.pdi!==undefined&&PLAN[t.pdi])?mealOpt(t.pdi,t.mi):null;
  if(!o)return dlgAlert(tr("Non c'è un pasto su cui lavorare in questo momento."));
  return toolRun("volOut",
    'Ho una fame incontrollabile e devo mangiare «'+o.d+'» ('+o.k+' kcal, '+o.p+' g prot) per il pasto «'+t.slot+'». '+rulesForAI()+
    ' NON aggiungere calorie: riscrivi la preparazione per moltiplicare il VOLUME nello stomaco a parità di macro. '+
    'Usa verdure ricchissime d\'acqua in grandi quantità, brodi e zuppe, albumi montati, funghi, zucchine, cetrioli, insalata, e tecniche che gonfiano il piatto. '+
    'Rispondi SOLO JSON: {"nuovo":"la nuova preparazione con le grammature","kcal":n,"prot":n,"volume":"quanto è più voluminoso e perché sazia","trucco":"il trucco usato"}',
    j=>'<b>Stesso piatto, molto più volume</b>\n'+esc(j.nuovo||"")+
       '\n~'+Math.round(j.kcal||0)+' kcal · '+Math.round(j.prot||0)+' g prot'+
       (j.volume?'\n\n<i>'+esc(j.volume)+'</i>':'')+(j.trucco?'\n'+esc(j.trucco):'')+
       toolBtns(di,t.pdi,t.mi,t.slot,String(j.nuovo||""),Math.round(j.kcal)||0,Math.round(j.prot)||0));};

/* ═══  MODALITÀ PASCOLO ══════════════════════════════════════════ */
window.grazing=(di)=>{
  const tgt=selTarget("grazTarget",di);
  const dopo=pendingMeals(di);
  if(!dopo.length)return dlgAlert(tr("Non ci sono pasti ancora da fare da trasformare in pascolo."));
  const k=dopo.reduce((a,x)=>a+x.k,0),p=dopo.reduce((a,x)=>a+x.p,0);
  return toolRun("grazOut",
    'Oggi ho voglia di spiluccare invece di stare a tavola. Prendi i pasti che mi restano ('+JSON.stringify(dopo)+
    ') per un totale di '+k+' kcal e '+p+' g di proteine e trasformali in UNA "grazing board": '+
    'un vassoio di bocconcini da tenere a portata di mano e consumare lentamente in diverse ore. '+rulesForAI()+
    ' Devono essere cose che si mangiano con le mani, non deperibili in giornata, e il totale deve restare identico. '+
    'Rispondi SOLO JSON: {"board":[{"cosa":"...","g":"quantità","kcal":n,"prot":n}],"totale":{"kcal":n,"prot":n},"come":"come gestirla nell\'arco della giornata"}',
    j=>{const b=(j.board||[]);const tot=j.totale||{};
      return '<b>La tua grazing board</b> — ~'+Math.round(tot.kcal||k)+' kcal · '+Math.round(tot.prot||p)+' g prot in totale\n\n'+
        b.map(x=>'• '+esc(x.cosa||"")+' '+esc(x.g||"")+' — ~'+Math.round(x.kcal||0)+' kcal').join('\n')+
        (j.come?'\n\n<i>'+esc(j.come)+'</i>':'')+
        toolBtns(di,tgt.pdi,tgt.mi,tgt.slot,"Grazing board: "+b.map(x=>x.cosa).join(", "),Math.round(tot.kcal||k),Math.round(tot.prot||p));});};

/* ═══  BILANCIAMENTO PREDITTIVO ═════════════════════════════════
   Lo sgarro si gestisce PRIMA: si mette da parte un tesoretto nei giorni
   che precedono l'evento, così ci si arriva con budget e senza sensi di colpa. */
window.predFillMeals=()=>{
  const dEl=document.getElementById("predDay"),sel=document.getElementById("predMeal");
  if(!dEl||!sel)return;
  const pdi=+dEl.value;
  sel.innerHTML=(PLAN[pdi]?PLAN[pdi].meals:[]).map((m,mi)=>`<option value="${mi}" ${/cena/i.test(m.n||"")?"selected":""}>${esc(cap(fascia(m.n)))}</option>`).join("");};
/* Tutti i pasti pendenti da adesso fino al pasto dell'occasione (escluso) */
function pendingBefore(di,pdi,mi){
  const out=[];
  for(let k=di;k<=pdi;k++)pendingMeals(k).forEach(m=>{if(k<pdi||m.mi<mi)out.push(m);});
  return out;}
window.predictive=async(di)=>{
  const dEl=document.getElementById("predDay"),mEl=document.getElementById("predMeal");
  const pdi=dEl?+dEl.value:NaN,mi=mEl?+mEl.value:NaN;
  if(isNaN(pdi)||isNaN(mi)||!PLAN[pdi]||!PLAN[pdi].meals[mi])return dlgAlert(tr("Scegli il giorno e il pasto dell'occasione."));
  const cosa=((document.getElementById("predWhat")||{}).value||"").trim();
  if(!cosa)return dlgAlert(tr("Scrivi cosa prevedi di mangiare (es. «pizza e birra», «cena aziendale»)."));
  const stE=S.week.days[pdi].meals[mi]||{};
  if(stE.done||stE.skip)return dlgAlert(tr("Quel pasto risulta già spuntato o saltato: scegline uno ancora da fare."));
  const evento=mealOpt(pdi,mi);
  const prima=pendingBefore(di,pdi,mi);
  if(!prima.length)return dlgAlert(tr("Non ci sono pasti ancora da fare fra adesso e l'occasione su cui distribuire il delta."));
  return toolRun("predOut",
    'OCCASIONE PREVISTA: '+PLAN[pdi].day+', pasto «'+PLAN[pdi].meals[mi].n+'». Mangerò: «'+cosa+'». '+
    'Il piano prevedeva per quel pasto: «'+evento.d+'» (~'+evento.k+' kcal). '+rulesForAI()+
    ' 1) Stima quante kcal costerà davvero ciò che mangerò. 2) Calcola il DELTA = stima − '+evento.k+' kcal già previste. '+
    '3) Se il delta è positivo, distribuiscilo TOGLIENDOLO in piccoli tagli dai pasti ancora da fare da qui ad allora (elenco sotto), '+
    'senza mai scendere sotto '+minMealKcal()+' kcal nei pasti principali e senza toccare le proteine: solo carboidrati e grassi. '+
    'Se il delta è zero o negativo, non serve alcun taglio: dillo e lascia "pasti" vuoto. '+
    'Deve essere impercettibile: piccoli tagli distribuiti, non un giorno di digiuno. '+
    'Inoltre, se l\'occasione è a buffet, in piedi o con portate condivise (aperitivo, rinfresco, cena aziendale, matrimonio, compleanno), '+
    'aggiungi in "strategia" TRE righe concrete su come stare a tavola: da cosa partire, cosa saltare senza rimpianti, '+
    'quando fermarsi. Consigli pratici e senza moralismi, non regole. Se invece è un pasto normale (una pizza, un piatto) lascia "strategia" vuota. '+
    'Pasti disponibili prima dell\'occasione: '+JSON.stringify(prima)+
    '. Rispondi SOLO JSON: {"costo":n,"giaPrevisto":'+evento.k+',"delta":n,"pasti":[{"pdi":n,"mi":n,"slot":"...","nuovo":"...","kcal":n,"prot":n,"tolto":n}],"strategia":["",""],"messaggio":"una riga rassicurante"}',
    j=>{PRED=j.pasti||[];
      const tot=PRED.reduce((a,x)=>a+(+x.tolto||0),0);
      return '<b>'+esc(cosa)+'</b> — '+PLAN[pdi].day+', '+esc(PLAN[pdi].meals[mi].n)+
        /* il «+» mancava: senza, JavaScript chiudeva il return qui e tutto
           il resto del risultato (tesoretto, strategia, bottone) era codice
           morto. Il tool sembrava funzionare e non diceva nulla. */
        '\n\nCosto stimato: <b>~'+Math.round(j.costo||0)+' kcal</b> · già previste dal piano: '+Math.round(j.giaPrevisto||0)+
        ' · da mettere da parte: <b>'+Math.round(j.delta||0)+' kcal</b>'+
        (PRED.length?'\n\n<b>Il tesoretto</b> (piccoli tagli, proteine intatte)\n'+
          PRED.map(x=>'• '+esc(x.slot||"")+': −'+Math.round(x.tolto||0)+' kcal → '+esc(x.nuovo||"")).join('\n')+
          '\n\nTotale accantonato: <b>'+Math.round(tot)+' kcal</b>':'\n\n Il delta è coperto dal piano: nessun taglio necessario.')+
        (Array.isArray(j.strategia)&&j.strategia.filter(Boolean).length?
          '\n\n<b>A tavola</b>\n'+j.strategia.filter(Boolean).map(x=>'• '+esc(x)).join('\n'):'')+
        (j.messaggio?'\n\n<i>'+esc(j.messaggio)+'</i>':'')+
        (PRED.length?'<div class="btngrid2" style="margin-top:8px"><button class="btn small" onclick="applyMealEdits(PRED)">Costruisci il tesoretto</button></div>':'');});};
let PRED=null;

/* ═══  MEAL-PREP MATRIX ═════════════════════════════════════════ */
/* Opzioni "fino a … a cena": giornate intere, max 3; se oggi è già iniziato
   (un pasto spuntato o saltato) si parte da domani. */
function prepUntilOpts(di){
  const anyDone=dayItems(di).some(it=>{const st=S.week.days[it.pdi].meals[it.mi];return st.done||st.skip;});
  const start=anyDone?di+1:di;let o="";
  for(let k=start;k<Math.min(7,start+3);k++){if(!PLAN[k])continue;
    o+=`<option value="${k}">${trh("fino a {v1} a cena",{v1:giorno(PLAN[k].day)+(k===di?" ("+tr("oggi")+")":"")})}</option>`;}
  return o;}
function prepHomeType(m){return m.type==="norm"||(m.type==="mensa"&&outTypeIsPorto());}
window.mealPrep=(di)=>{
  const sel=document.getElementById("prepUntil");
  const end=(sel&&sel.value!=="")?+sel.value:NaN;
  if(isNaN(end)||!PLAN[end])return dlgAlert(tr("La settimana è quasi finita: non ci sono giornate intere da coprire. Riprova da lunedì."));
  const gg=[];
  pendingMeals(di).forEach(m=>{if(prepHomeType(PLAN[m.pdi].meals[m.mi]))gg.push({giorno:PLAN[di].day+" (oggi, ancora da fare)",slot:m.slot,d:m.d});});
  for(let k=di+1;k<=end;k++){
    (PLAN[k]?PLAN[k].meals:[]).forEach((m,mi)=>{if(!prepHomeType(m))return;
      const o=mealOpt(k,mi);gg.push({giorno:PLAN[k].day,slot:m.n,d:o.d});});}
  if(!gg.length)return dlgAlert(tr("Non ci sono pasti da coprire nel periodo scelto."));
  return toolRun("prepOut",
    'Questi sono i pasti da coprire con il batch cooking, da adesso fino a '+PLAN[end].day+' a cena compresa (i pasti di oggi già consumati sono esclusi): '+JSON.stringify(gg)+'. '+rulesForAI()+
    ' Estrai le PREPARAZIONI BASE comuni e costruisci un piano di batch cooking da fare tutto in una volta oggi, che copra ESATTAMENTE quel periodo. '+
    'Per ogni preparazione: quanto cucinarne in totale (a crudo), come conservarla e in quali pasti verrà usata. '+
    'Aggiungi anche un ordine di esecuzione sensato (cosa mettere sul fuoco per primo) e quanto tempo si risparmia. '+
    'Rispondi SOLO JSON: {"prep":[{"cosa":"...","quanto":"...","come":"cottura e conservazione","serve_per":["Lunedì pranzo","Martedì cena"]}],"ordine":"in che ordine procedere","risparmio":"quanto tempo risparmi"}',
    j=>' <b>Batch cooking dei prossimi giorni</b>\n\n'+
       (j.prep||[]).map(x=>'• <b>'+esc(x.cosa||"")+'</b>: '+esc(x.quanto||"")+'\n  '+esc(x.come||"")+
         (x.serve_per&&x.serve_per.length?'\n <i>serve per: '+esc(x.serve_per.join(", "))+'</i>':'')).join('\n\n')+
       (j.ordine?'\n\n<b>Ordine</b>: '+esc(j.ordine):'')+
       (j.risparmio?'\n⏱ '+esc(j.risparmio):''));};

/* ═══  OSPITE STEALTH ═══════════════════════════════════════════ */
const STEALTH_K={poco:{leggero:280,equilibrato:420,pesante:600},
                 normale:{leggero:450,equilibrato:700,pesante:950},
                 tanto:{leggero:650,equilibrato:1000,pesante:1300}};
const STEALTH_P={poco:18,normale:28,tanto:38};
let STE={pdi:0,mi:0,q:"",t:""};
window.stealthOpen=(pdi,mi)=>{STE={pdi:pdi,mi:mi,q:"",t:""};stealthDraw();};
function stealthDraw(){
  const q=[["poco","Poco"],["normale","Normale"],["tanto","Tanto"]];
  const t=[["leggero","Leggero"],["equilibrato","Equilibrato"],["pesante","Pesante"]];
  const pronto=STE.q&&STE.t;
  const k=pronto?STEALTH_K[STE.q][STE.t]:0, p=pronto?STEALTH_P[STE.q]:0;
  let h=`<div class="modal" id="steM"><div class="mcard">
    <h2 style="color:var(--bosco);font-size:16px">${tr("Sono ospite")}</h2>
    ${hint2(tr("Nessuno pesa il cibo a casa d'altri."),tr("Due domande e il pasto è registrato con una stima statistica: il recupero degli sfori penserà al resto."))}
    <label>${tr("Quanto hai mangiato?")}</label><div class="ckgrid">`+
    q.map(([k2,l])=>`<label class="ck" style="font-size:14.5px;padding:12px 16px"><input type="radio" name="steq" ${STE.q===k2?"checked":""} onchange="STE.q='${k2}';stealthDraw()"> ${l}</label>`).join("")+
    `</div><label>${tr("Cosa c'era nel piatto?")}</label><div class="ckgrid">`+
    t.map(([k2,l])=>`<label class="ck" style="font-size:14.5px;padding:12px 16px"><input type="radio" name="stet" ${STE.t===k2?"checked":""} onchange="STE.t='${k2}';stealthDraw()"> ${l}</label>`).join("")+
    `</div>`+
    (pronto?`<div class="hint" style="color:var(--bosco);font-weight:700;font-size:14.5px">${trh("Stima: ~{v1} kcal · {v2} g di proteine",{v1:k,v2:p})}</div>`:"")+
    `<div class="btngrid2" style="margin-top:12px">
      <button class="btn small" ${pronto?"":"disabled"} onclick="stealthSave()">${tr("Registra il pasto")}</button>
      <button class="btn ghost small" onclick="document.getElementById('steM').remove()">${tr("Annulla")}</button></div></div></div>`;
  const old=document.getElementById("steM");if(old)old.remove();
  document.body.insertAdjacentHTML("beforeend",h);}
window.stealthSave=()=>{
  if(!STE.q||!STE.t)return;
  const k=STEALTH_K[STE.q][STE.t],p=STEALTH_P[STE.q];
  const st=S.week.days[STE.pdi].meals[STE.mi];
  st.custom={d:"Ospite: pasto "+STE.q+", piatto "+STE.t+" (stima)",k:k,p:p};
  st.done=true;st.skip=false;
  const m=document.getElementById("steM");if(m)m.remove();
  save();render(cur);
  toast(tr("Pasto registrato: ~{k} kcal · il recupero assorbirà lo scarto",{k:k}));};

/* ═══  INTERCETTORE DI FAME EMOTIVA ═════════════════════════════
   Non blocca niente: si mette in mezzo con una domanda e tre alternative. */
const BINGE_RE=/nutella|cioccolat|merend|biscott|patatin|gelat|torta|brioche|cornett|caramell|dolc|crackers|snack|pizza|birra|vino/i;
function bingeRisk(desc,k){
  const h=new Date().getHours();
  const tardi=(h>=22||h<5);
  const denso=BINGE_RE.test(String(desc||""))||(+k>=350);
  return (tardi||denso)?{tardi:tardi,denso:denso}:null;}
window.bingeCheck=async(desc,k)=>{
  const r=bingeRisk(desc,k);
  if(!r)return true;                     /* niente da intercettare */
  const motivo=r.tardi?"È tardi":"È un alimento denso di zuccheri o grassi";
  const ok=await dlgConfirm(tr("Un attimo, senza giudizio.\n\n{a}: hai <b>fame fisica</b> o è noia, stanchezza, nervoso?\n\nProva così: bevi un bicchiere d'acqua e aspetta 15 minuti. Se dopo la fame c'è ancora, è vera — e allora mangiala, con la mia benedizione.\n\nSe l'hai già mangiato non è successo niente: la prossima volta prova il metodo dell'acqua.",{a:motivo}),
    {ok:tr("Registro comunque"),ko:tr("Aspetto 15 minuti")});
  if(ok)return true;
  /* ha scelto di aspettare: proponiamo alternative dentro i macro */
  const di=viewIdx(),e=eatenOfDay(di);
  const resto=Math.max(0,dayTargetK()-e.k);
  toolRun("bingeOut",
    'Sto per cedere a: '+String(desc||"qualcosa di goloso")+'. Ho deciso di aspettare 15 minuti. '+
    'Mi restano circa '+resto+' kcal oggi. '+rulesForAI()+
    ' Dammi 3 alternative DOLCI ma sazianti che rientrino in quelle calorie e che soddisfino davvero la voglia (non consigli moralisti). '+
    'Rispondi SOLO JSON: {"opzioni":[{"nome":"...","d":"con grammature","kcal":n,"prot":n}],"nota":"una riga gentile"}',
    j=>'<b>Mentre aspetti, tre idee che ci stanno</b>\n\n'+
       (j.opzioni||[]).map((x,i)=>'• <b>'+esc(x.nome||"")+'</b> — ~'+Math.round(x.kcal||0)+' kcal · '+Math.round(x.prot||0)+' g prot\n  '+esc(x.d||"")).join('\n')+
       (j.nota?'\n\n<i>'+esc(j.nota)+'</i>':''));
  return false;};

/* ═══  REVERSE DIETING & DIET BREAK ═════════════════════════════ */
S.reverse=Object.assign({on:false,start:null,step:0,kcal:0,lastCheck:null},S.reverse||{});
function reverseOn(){return !!(S.reverse&&S.reverse.on);}
function reverseBonus(){return reverseOn()?(+S.reverse.kcal||0):0;}
window.reverseToggle=async()=>{
  if(reverseOn()){
    if(!await dlgConfirm(tr("Chiudo l'uscita morbida?\n\nHai risalito {a} kcal in {b} settimane. Il target torna al calcolo normale.",{a:reverseBonus(),b:(S.reverse.step||0)})))return;
    S.reverse={on:false,start:null,step:0,kcal:0,lastCheck:null};save();render(cur);
    if(!planIsEmpty()&&aiOn()&&await dlgConfirm(tr("Uscita morbida chiusa.\n\nIl target torna al calcolo normale: ritaro piano e spesa?"),
       {ok:tr("Ritara ora"),ko:tr("Più tardi")}))
      return recalibrate();
    return toast(tr("Uscita morbida chiusa"));}
  if(!await dlgConfirm(tr("Attivo l'uscita morbida (reverse diet)?\n\nInvece del deficit, ogni settimana aggiungo 60 kcal da carboidrati e guardo la bilancia:\n• se il peso resta stabile, la settimana dopo salgo ancora\n• se sale, mi fermo: hai trovato il tuo soffitto metabolico\n\nServe a uscire dalla dieta senza riprendere tutto, non a dimagrire.",{})))return;
  S.reverse={on:true,start:iso(new Date()),step:0,kcal:0,lastCheck:iso(new Date())};
  save();render(cur);
  /* Il target è cambiato: se il piano resta sulle vecchie calorie
     l'uscita morbida non esiste nei fatti, esiste solo nello stato.
     Prima si limitava a salvare e non ricalcolava niente. */
  if(!planIsEmpty()&&aiOn()&&await dlgConfirm(tr(" Uscita morbida attiva.\n\nDa adesso il target sale di 60 kcal a settimana. Ritaro subito piano e spesa sulle nuove calorie?"),
     {ok:tr("Ritara ora"),ko:tr("Più tardi")}))
    return recalibrate();
  toast(tr("Uscita morbida attiva · +60 kcal a settimana"));};
/* una volta a settimana valuta il peso e decide se salire ancora */
window.reverseStep=async()=>{
  if(!reverseOn())return;
  const W=(S.profile.weights||[]).slice(-6);
  if(W.length<2)return dlgAlert(tr("Servono almeno due pesate per capire come sta andando."));
  const a=W[0].w,b=W[W.length-1].w,d=Math.round((b-a)*10)/10;
  const su=d>0.4;
  const msg=" "+tr("Uscita morbida · settimana {n}",{n:((S.reverse.step||0)+1)})+"\n\n"+
    tr("Peso: {a} kg → {b} kg ({d} kg)",{a:a,b:b,d:(d>=0?"+":"")+d})+"\n"+
    tr("Calorie già risalite: +{k} kcal al giorno",{k:reverseBonus()})+"\n\n"+
    (su?tr("Il peso sta salendo: conviene fermarsi qui. Hai trovato il tuo tetto.")
       :tr("Il peso è stabile: possiamo salire ancora di 60 kcal e vedere cosa succede."));
  if(!await dlgConfirm(msg,{ok:su?tr("Mi fermo qui"):tr("Sali di 60 kcal"),ko:su?tr("Salgo lo stesso"):tr("Resto così")}))
    {if(su){S.reverse.kcal=reverseBonus()+60;S.reverse.step=(S.reverse.step||0)+1;}}
  else if(!su){S.reverse.kcal=reverseBonus()+60;S.reverse.step=(S.reverse.step||0)+1;}
  S.reverse.lastCheck=iso(new Date());save();render(cur);
  toast(reverseOn()?("Target: +"+reverseBonus()+" kcal al giorno"):"");};

/* ═══  FONDO FIDUCIARIO DEL WEEKEND ═════════════════════════════ */
S.bank=Object.assign({on:false,pct:8},S.bank||{});
function bankOn(){return !!(S.bank&&S.bank.on);}
function bankPct(){return Math.max(3,Math.min(15,+S.bank.pct||8));}
/* lun-ven si toglie una micro-quota, sabato si restituisce tutta insieme */
/* Il giorno si legge dalla DATA vera del giorno visualizzato, non dall'indice:
   navigando fuori dalla settimana il calcolo resta corretto. */
function bankAdjust(di){
  if(!bankOn())return 0;
  const st=safeDate((S.week&&S.week.started)+"T12:00:00");
  const d=(di>=0&&st)?new Date(st.getTime()+di*864e5):VIEW;
  const dow=(d||new Date()).getDay();          /* 0 domenica … 6 sabato */
  const g=(dow===0)?6:dow-1;                   /* 0 lunedì … 6 domenica */
  const quota=Math.round(dayTargetKBase()*bankPct()/100);
  if(g<=4)return -quota;                       /* lun-ven: si mette da parte */
  if(g===5)return quota*5;                     /* sabato: si restituisce tutto */
  return 0;}
window.bankToggle=async()=>{
  if(bankOn()){S.bank.on=false;save();render(cur);return toast(tr("Tassa weekend disattivata"));}
  if(!await dlgConfirm(tr("Attivo il fondo fiduciario del weekend?\n\nDal lunedì al venerdì tolgo il {a}% dal target giornaliero — una quota che quasi non si sente.\nIl sabato te la restituisco tutta insieme: circa {b} kcal in più per la cena fuori.\n\nIl bilancio della settimana resta identico: cambia solo come è distribuito.",{a:bankPct(),b:Math.round(dayTargetKBase()*bankPct()/100*5)})))return;
  S.bank.on=true;save();render(cur);toast(tr("Fondo weekend attivo"));};

let SPLIT={sel:null};
function splitMembers(){
  if(!SPLIT.sel){SPLIT.sel=famAll().map((m,i)=>i);}   /* di default tutta la famiglia */
  return SPLIT.sel;}
function famBoxesRefresh(){["splitBox","coupleBox"].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=splitRowsHTML();});}
window.splitToggle=(i)=>{const l=splitMembers();const k=l.indexOf(i);
  if(k<0)l.push(i);else l.splice(k,1);
  if(!l.length)l.push(0);
  famBoxesRefresh();};
function splitRowsHTML(){
  const all=famAll(),sel=splitMembers();
  return `<div class="ckgrid">`+all.map((m,i)=>{const b=famBand(m);
    return `<label class="ck"><input type="checkbox" ${sel.indexOf(i)>-1?"checked":""} onchange="splitToggle(${i})"> ${b.ico} ${esc(famName(m))} <small>×${m.me?1:Math.round(b.c/(famCoef(meAsMember())||1)*100)/100}</small></label>`;}).join("")+
    `</div><div class="hint">${trh("A tavola: {v1} di riferimento. Togli o aggiungi chi c'è davvero — anche gli ospiti, con il pulsante qui sotto.",{v1:"<b>"+(Math.round(splitUnits()*100)/100)+" porzioni</b>"})}</div>`;}
function splitUnits(){const all=famAll(),sel=splitMembers();
  const meC=famCoef(meAsMember())||1;
  return Math.round((sel.reduce((a,i)=>{const m=all[i];if(!m)return a;return a+(m.me?1:famCoef(m)/meC);},0)+(SPLIT.guests||0)/meC)*100)/100;}
window.splitGuests=async()=>{
  const v=await dlgPrompt(tr("Quanti ospiti adulti si aggiungono?\n\n(contano come una porzione di riferimento ciascuno)"),String(SPLIT.guests||0));
  if(v===null)return;
  SPLIT.guests=Math.max(0,parseInt(v)||0);
  famBoxesRefresh();};
window.splitCook=async(di)=>{
  if(!aiOn())return aiFail(new Error("nokey"));
  const ing=(document.getElementById("splitIn")||{}).value||"";
  if(!ing.trim())return dlgAlert(tr("Scrivi cosa stai cucinando o che ingredienti hai (es. «riso, zucchine, petto di pollo»)."));
  const tgt=selTarget("splitTarget",di);
  const box=document.getElementById("splitOut");
  box.style.display="block";box.textContent="Calcolo le dosi per la pentola e la tua porzione…";
  try{
    const t=await aiAsk('Sto cucinando per '+(Math.round(splitUnits()*100)/100)+' porzioni di riferimento '+
      '(la porzione di riferimento è una donna adulta ~2000 kcal al giorno; uomo 1,25 · adolescente 1,10 · bambino 0,75 · infante 0,50). '+
      'Ingredienti o piatto: '+ing+'. '+
      'Io devo restare in circa '+tgt.kAdj+' kcal e '+tgt.p+' g di proteine per il pasto «'+tgt.slot+'».'+compNote(tgt)+' '+rulesForAI()+
      ' Dammi: 1) le dosi TOTALI da mettere in pentola per tutti, indicate a CRUDO; '+
      '2) quanti grammi esattamente devo mettere nel MIO piatto, indicati a COTTO, perché a tavola si pesa il cotto; '+
      '3) il fattore di resa che hai usato per passare da crudo a cotto per gli ingredienti principali (es. riso ×2,5, pasta ×2,2, carne ×0,7). '+
      'Rispondi SOLO JSON: {"piatto":"nome","pentola":[{"ing":"riso","crudo":"400 g","cotto":"1000 g","resa":"×2,5"}],'+
      '"mioPiatto":{"descrizione":"cosa e quanto nel mio piatto, pesato da cotto","grammi":"350 g","kcal":n,"prot":n},'+
      '"note":"una riga pratica"}');
    const j=parseAIJSON(t);
    SPLITDISH={di:di,pdi:tgt.pdi,mi:tgt.mi,nome:String(j.piatto||"Piatto"),
      d:String((j.mioPiatto&&j.mioPiatto.descrizione)||""),
      k:Math.round((j.mioPiatto&&j.mioPiatto.kcal)||0),p:Math.round((j.mioPiatto&&j.mioPiatto.prot)||0)};
    let h=' <b>'+esc(j.piatto||"")+'</b> per '+(Math.round(splitUnits()*100)/100)+' porzioni\n\n<b>In pentola</b> (pesi a crudo):\n';
    (j.pentola||[]).forEach(x=>{h+='• '+esc(x.ing)+': <b>'+esc(x.crudo||"")+'</b> a crudo'+(x.cotto?' → '+esc(x.cotto)+' da cotto':'')+(x.resa?' <i>('+esc(x.resa)+')</i>':'')+'\n';});
    h+='\n <b>Nel tuo piatto</b>: '+esc(SPLITDISH.d)+
       (j.mioPiatto&&j.mioPiatto.grammi?' — <b>'+esc(j.mioPiatto.grammi)+'</b> pesati da cotto':'')+
       '\n~'+SPLITDISH.k+' kcal · '+SPLITDISH.p+' g prot\n';
    if(j.note)h+='\n<i>'+esc(j.note)+'</i>\n';
    h+='\n<div class="btngrid3"><button class="btn small" onclick="splitUse()">Usa per '+esc(fascia(tgt.slot))+'</button>'+
       '<button class="btn ghost small" onclick="splitExtra()">+ Extra</button>'+
       '<button class="btn ghost small" onclick="splitSave()">Salva</button></div>';
    box.innerHTML=h;
  }catch(e){box.textContent="";aiFail(e);}};
let SPLITDISH=null;
window.splitUse=()=>{if(!SPLITDISH)return;
  if(SPLITDISH.pdi===undefined||!PLAN[SPLITDISH.pdi])return dlgAlert(tr("Nessun pasto selezionabile: aggiungilo come extra."));
  S.week.days[SPLITDISH.pdi].meals[SPLITDISH.mi].custom={d:SPLITDISH.nome+" — "+SPLITDISH.d,k:SPLITDISH.k,p:SPLITDISH.p};
  save();render(cur);toast(tr("Pasto impostato ✓"));};
window.splitExtra=()=>{if(!SPLITDISH)return;
  S.week.days[SPLITDISH.di].extras.push({d:SPLITDISH.nome,k:SPLITDISH.k,p:SPLITDISH.p});
  save();render(cur);toast(tr("Aggiunto come extra ✓"));};
window.splitSave=()=>{if(!SPLITDISH)return;
  addRecipe(SPLITDISH.nome+" — "+SPLITDISH.d,SPLITDISH.k,SPLITDISH.p,null,null);};
window.fuelApply=async()=>{if(!FUEL)return;
  const asExtra=await dlgConfirm(tr("Registro subito lo spuntino pre-allenamento come extra già mangiato?\n\n«{a}» — ~{b} kcal",{a:FUEL.sp.d,b:FUEL.sp.k}),{ok:tr("Sì, aggiungi come extra"),ko:tr("No, solo i pasti")});
  if(asExtra)S.week.days[FUEL.di].extras.push({d:"Pre-allenamento: "+FUEL.sp.d,k:FUEL.sp.k,p:0});
  FUEL.da.forEach(x=>{const pdi=+x.pdi,mi=+x.mi;
    if(PLAN[pdi]&&PLAN[pdi].meals[mi])
      S.week.days[pdi].meals[mi].custom={d:String(x.nuovo),k:Math.round(x.kcal)||0,p:Math.round(x.prot)||0};});
  save();render(cur);toast(asExtra?tr("Spuntino registrato e pasti aggiornati ✓"):tr("Pasti aggiornati ✓ (segna lo spuntino quando lo mangi)"));};

/* ═══  PIATTI TIPICI DI DOVE SEI ═══════════════════════════════
   In viaggio il piano non aiuta granché: qui si parte dalla cucina del
   posto e si arriva a cosa ordinare restando nel target del pasto.
   La posizione serve solo a capire REGIONE e NAZIONE: le coordinate
   vengono arrotondate (~11 km), non vengono mai salvate e l'unica cosa
   che viaggia è quella coppia di numeri dentro la richiesta all'AI. */
let GEO={place:"",dishes:[],seen:[],at:0};
const GEO_TTL=60*60*1000;   /* la zona vale un'ora: poi si richiede dove sei */
function geoFresh(){if(GEO.at&&Date.now()-GEO.at>GEO_TTL)GEO={place:"",dishes:[],seen:[],at:0};}
function geoPos(){return new Promise((res,rej)=>{
  if(!navigator.geolocation)return rej(new Error("nogeo"));
  navigator.geolocation.getCurrentPosition(
    p=>res({lat:Math.round(p.coords.latitude*10)/10,lon:Math.round(p.coords.longitude*10)/10}),
    e=>rej(new Error(e&&e.code===1?"negato":"nogeo")),
    {timeout:12000,maximumAge:600000,enableHighAccuracy:false});});}
async function geoAskPlace(motivo){
  const v=await dlgPrompt(tr("{a}\n\nScrivi dove ti trovi — basta la regione o la città, il paese se sei all'estero (es. «Trentino», «Napoli», «Andalusia, Spagna»).\n\nLascia vuoto per uscire.",{a:motivo}),GEO.place||"");
  const t=String(v||"").trim();
  return t||null;}
window.geoDishes=async(di,ancora)=>{
  if(!aiOn())return aiFail(new Error("nokey"));
  const box=document.getElementById("geoOut");
  geoFresh();
  let place=GEO.place,coords=null;
  if(!ancora||!place){
    if(!place){
      box.style.display="block";box.textContent="Chiedo la posizione…";
      try{coords=await geoPos();}
      catch(e){
        const motivo=(e.message==="negato")
          ? " Senza la posizione non posso sapere quali piatti regionali suggerirti."
          : " Non riesco a leggere la posizione (GPS spento, permesso mai dato o segnale assente).";
        box.textContent="";
        place=await geoAskPlace(motivo);
        if(!place)return;                       /* l'utente esce */
        GEO.place=place;GEO.seen=[];
      }
    }
  }
  const tgt=selTarget("geoTarget",di);
  box.style.display="block";
  box.textContent=(ancora?"Cerco altre proposte":"Cerco i piatti tipici")+(place?" di "+place:" della zona")+"…";
  try{
    const dove=place
      ? 'La persona si trova in: '+place+'. Se è una città, ragiona sulla REGIONE a cui appartiene.'
      : 'Coordinate approssimate della persona (arrotondate a ~11 km): latitudine '+coords.lat+', longitudine '+coords.lon+
        '. Deduci REGIONE e NAZIONE (non il comune) e dichiarale nella prima riga.';
    const t=await aiAsk(dove+
      ' In questo momento, secondo il mio piano, dovrei mangiare: '+tgt.slot+' da circa '+tgt.kAdj+' kcal e '+tgt.p+' g di proteine.'+compNote(tgt)+' '+rulesForAI()+
      (GEO.seen.length?' NON riproporre questi piatti, già suggeriti: '+GEO.seen.join("; ")+'.':'')+
      ' Proponi 3 piatti TIPICI di quella regione (o della cucina nazionale se la regione non ha piatti propri adatti) che rispettino i miei vincoli e stiano vicini al target.'+
      ' FONDAMENTALE: devono essere adatti al pasto «'+tgt.slot+'». Per colazione o metà mattina proponi ciò che davvero si mangia lì a quell\'ora — dolci da forno tradizionali, latticini, pane, frutta, bevande tipiche — e MAI secondi di carne, primi o piatti da pranzo. Per pranzo e cena proponi piatti completi. Per merenda o aperitivo qualcosa di piccolo e tipico del posto.'+
      ' Per ciascuno: nome del piatto, una riga su cos\'è e perché è tipico di lì, come ordinarlo o adattarlo per rientrare nel target (porzione, contorno, condimento a parte), kcal e proteine stimate.'+
      ' Se un piatto tipico della zona è incompatibile con i miei vincoli, dillo e spiega perché invece di proporlo.'+
      ' Rispondi SOLO JSON: {"zona":"Regione, Nazione","piatti":[{"nome":"...","tipico":"...","come":"...","kcal":n,"prot":n}]}');
    const j=parseAIJSON(t);
    const zona=String(j.zona||place||"zona sconosciuta");
    const arr=(j.piatti||[]).filter(x=>x&&x.nome);
    if(!arr.length)throw new Error("nessun piatto proposto");
    GEO.place=GEO.place||zona;GEO.at=Date.now();
    GEO.dishes=arr;
    arr.forEach(x=>GEO.seen.push(String(x.nome)));
    let h=" <b>"+esc(zona)+"</b>"+(GEO.seen.length>arr.length?" · altre proposte":"")+"\n\n";
    arr.forEach((x,i)=>{
      h+="<b>"+esc(x.nome)+"</b> — ~"+Math.round(x.kcal||0)+" kcal · "+Math.round(x.prot||0)+" g prot\n"+
         esc(x.tipico||"")+"\n<i>"+esc(x.come||"")+"</i>\n"+
         '<div class="btngrid3" style="margin:8px 0 16px">'+
         '<button class="btn small" onclick="geoUse('+di+','+i+')">Usa per il pasto</button>'+
         '<button class="btn ghost small" onclick="geoExtra('+di+','+i+')">+ Extra</button>'+
         '<button class="btn ghost small" onclick="geoSave('+i+')">Salva</button></div>';
    });
    h+='<div class="btngrid2" style="margin-top:4px">'+
       '<button class="btn ghost small" onclick="geoDishes('+di+',true)">Altre proposte</button>'+
       '<button class="btn ghost small" onclick="geoReset('+di+')">Cambia posto</button></div>';
    box.innerHTML=h;
  }catch(e){box.textContent="";aiFail(e);}};
/* ═══ FASE 1 · comandi ═══ */
/* Fotografa nel giorno lo stato fisiologico, così resta nello storico */
function stampPhys(){
  const di=viewIdx();if(di<0||!S.week||!S.week.days[di])return;
  const D=S.week.days[di];
  D.cycle=!!cycleDay();D.lact=(S.phys&&S.phys.lact)||"no";D.preg=pregOn();D.inj=injOn();D.ill=illOn();D.physK=physDelta();}
/* Avviso comune a tutti gli stati che riscalano le porzioni */
const PHYS_NEUTRAL_WARN="\n\n Le porzioni del piano vengono riscalate in proporzione partendo dalle kcal del TUO piano (non da una stima): perché il conto torni, il piano di base deve essere in stato NEUTRO, cioè scritto senza avere già conteggiato queste calorie. Spegnendo lo stato si torna esattamente alle grammature di base.";
window.cycleToggle=async()=>{
  if(cycleDay()){
    if(!await dlgConfirm(tr("Chiudo la fase luteale?")+"\n\n"+tr("Il target torna al fabbisogno di base, senza le {k}",{k:cycleKcal()})+" kcal aggiuntive."))
      {render(cur);return;}
    S.phys.cycleOn=false;S.phys.cycleStart=null;stampPhys();save();render(cur);
    return toast(tr("Fase luteale chiusa ✓"));}
  if(!physAllowed())return dlgAlert(tr("Il ciclo si può attivare solo su un profilo femminile.\n\nSe il genere non è corretto, cambialo in Io → Anagrafica."));
  if(!await dlgConfirm(tr("Attivo la fase luteale?\n\nPer i prossimi {a} giorni il fabbisogno sale di circa il {b}% del metabolismo basale (~{c} kcal al giorno), che si SOMMANO al target.\n\nSi spegne da sola alla scadenza. In questi giorni la bilancia può salire di 1-2 kg per la ritenzione idrica: è acqua, non grasso.{d}",{a:cycleDaysMax(),b:cyclePct(),c:Math.round(bmr()*cyclePct()/100),d:PHYS_NEUTRAL_WARN})))
    {render(cur);return;}
  S.phys.cycleOn=true;S.phys.cycleStart=iso(new Date());
  /* ogni attivazione a mano insegna: da due in poi l'app conosce
     il TUO ritmo e può PROPORRE invece di aspettare. */
  try{if(typeof cicloSegnaInizio==="function")cicloSegnaInizio();}catch(e){}stampPhys();save();render(cur);
  toast(tr("Fase luteale attiva · +{k} kcal al giorno",{k:cycleKcal()}));};
window.lactSet=async(v)=>{
  const on=(v==="esclusivo"||v==="parziale");
  if(on&&!physAllowed())return dlgAlert(tr("L'allattamento si può attivare solo su un profilo femminile.\n\nSe il genere non è corretto, cambialo in Io → Anagrafica."));
  if(on&&S.phys.lact!==v){
    const k=(v==="esclusivo")?(+S.profile.lactFull>0?+S.profile.lactFull:500):(+S.profile.lactPart>0?+S.profile.lactPart:250);
    if(!await dlgConfirm(tr("Attivo l'allattamento {a}?\n\nIl fabbisogno sale di {b} kcal al giorno, che si SOMMANO al target.{c}",{a:v,b:k,c:PHYS_NEUTRAL_WARN}))){render(cur);return;}}
  S.phys.lact=on?v:"no";stampPhys();save();render(cur);
  if(lactKcal())toast(tr("Allattamento {t} · +{k} kcal al giorno",{t:S.phys.lact,k:lactKcal()}));
  else toast(tr("Allattamento disattivato"));};
/* ── Gravidanza: per trimestre, solo profilo femminile ── */
window.pregSet=async(v)=>{
  const on=!!PREG_LBL[v];
  if(on&&!physAllowed())return dlgAlert(tr("La gravidanza si può indicare solo su un profilo femminile.\n\nSe il genere non è corretto, cambialo in Io → Anagrafica."));
  if(on&&S.phys.preg!==v){
    const k={t1:70,t2:260,t3:450},kk=(+S.profile["preg"+v.toUpperCase()]>0)?+S.profile["preg"+v.toUpperCase()]:k[v];
    if(!await dlgConfirm(tr("Gravidanza, {a}?\n\nIl fabbisogno sale di {b} kcal al giorno, che si SOMMANO al target.\n\n In gravidanza il piano va sempre concordato con il medico o l'ostetrica: l'app non sostituisce il controllo clinico e NON applica alcun deficit.{c}",{a:PREG_LBL[v],b:kk,c:PHYS_NEUTRAL_WARN}))){render(cur);return;}}
  S.phys.preg=on?v:"no";stampPhys();save();render(cur);
  toast(on?("Gravidanza · "+PREG_LBL[v]+" · +"+pregKcal()+" kcal"):"Gravidanza disattivata");};
/* ── Infortunio: movimento ridotto, il fabbisogno scende ── */
window.injSet=async(on)=>{
  if(on&&!injOn()){
    if(!await dlgConfirm(tr("Infortunio: movimento ridotto?\n\nIl fabbisogno scende perché si muove meno: viene tagliato il {a}% della quota di consumo dovuta all'attività (il metabolismo basale NON si tocca mai), oggi circa −{b} kcal.\n\nLe proteine restano alte: servono a non perdere massa muscolare durante lo stop.{c}",{a:injPct(),b:Math.round(Math.max(0,tdee()-bmr())*injPct()/100),c:PHYS_NEUTRAL_WARN}))){render(cur);return;}}
  S.phys.inj=!!on;stampPhys();save();render(cur);
  toast(on?("Infortunio attivo · −"+moveCut()+" kcal al giorno"):"Infortunio disattivato");};
/* ── Malattia: deficit sospeso + movimento ridotto ── */
window.illSet=async(on)=>{
  if(on&&!illOn()){
    if(!await dlgConfirm(tr("Malattia?\n\nFinché resta attiva:\n• il DEFICIT viene sospeso — si mangia a mantenimento, perché guarire richiede energia e un deficit rallenta il recupero;\n• il movimento è considerato ridotto del {a}% sulla quota di attività;\n• le proteine restano alte e l'idratazione conta più del solito.\n\nRicordati di spegnerla quando stai meglio.{b}",{a:illPct(),b:PHYS_NEUTRAL_WARN}))){render(cur);return;}}
  S.phys.ill=!!on;stampPhys();save();render(cur);
  toast(on?tr("Malattia attiva · deficit sospeso"):tr("Malattia disattivata"));};
/* Ritara il piano e la spesa sui numeri di adesso: fisiologia compresa */
window.recalibrate=async()=>{
  if(planIsEmpty())return dlgAlert(tr("Non c'è ancora un piano da ricalibrare."));
  if(!aiOn())return aiFail(new Error("nokey"));
  const righe=[
    "• fabbisogno di base: "+tdeeTarget()+" kcal",
    physBonus()?"• fisiologia: +"+physBonus()+" kcal ("+physNote()+")":null,
    deficitTarget()?("• "+(deficitTarget()>0?"deficit":"surplus")+": "+Math.abs(deficitTarget())+" kcal"):null,
    "• target risultante: "+dayTargetK()+" kcal al giorno",
    goalWkTotal()?"• allenamenti previsti: "+goalWkTotal()+" a settimana":null,
    (function(){const d=S.week.days[viewIdx()]||{};const v=[];
      if(d.sleep)v.push("sonno "+d.sleep+"/5");if(d.relax)v.push("relax "+d.relax+"/5");if(d.feel)v.push("come ti senti "+d.feel+"/5");
      return v.length?"• come stai oggi: "+v.join(" · "):null;})()
  ].filter(Boolean).join("\n");
  if(!await dlgConfirm(tr("Ricalibro i 7 giorni che partono da oggi?\n\n{a}\n\nI piatti restano gli stessi: cambiano le grammature. Poi rigenero la lista della spesa.\n\nVale solo per questa settimana: il piano di base resta quello che è, e la settimana prossima si riparte da lì.",{a:righe}),
    {ok:tr("Ricalibra la settimana"),ko:tr("Lascia com'è")}))return;
  if(await retunePlan()){S.planW=S.profile.w;save();
    await genShop(true);            /* lista SETTIMANALE ricalcolata sul piano nuovo */
    return planForecast(true,true);}};
/* Ricalibra i soli pasti di OGGI ancora da fare, sui numeri del momento.
   Non tocca gli altri giorni né la lista della spesa. */
window.recalibrateToday=async()=>{
  const di=viewIdx();
  if(di<0)return dlgAlert(tr("Torna a Oggi per ricalibrare i pasti di oggi."));
  if(planIsEmpty())return dlgAlert(tr("Non c'è ancora un piano da ricalibrare."));
  if(!aiOn())return aiFail(new Error("nokey"));
  const dopo=pendingMeals(di);
  if(!dopo.length)return dlgAlert(tr("Oggi non ci sono più pasti da ricalibrare: sono tutti spuntati o saltati."));
  const e=eatenOfDay(di),restaK=Math.max(0,dayTargetK()-e.k),restaP=Math.max(0,dayTargetP()-e.p);
  if(!await dlgConfirm(tr("Ricalibro i {a} pasti di oggi ancora da fare?\n\n• target di oggi: {b} kcal\n• già mangiate: {c} kcal\n• restano: {d} kcal e {e} g di proteine\n\nI piatti restano gli stessi: cambiano le grammature. Gli altri giorni e la spesa non si toccano.",{a:dopo.length,b:dayTargetK(),c:e.k,d:restaK,e:restaP}),
    {ok:tr("Ricalibra oggi"),ko:tr("Lascia com'è")}))return;
  return toolRun("caliOut",
    "Ritara le GRAMMATURE dei pasti di oggi ancora da fare, senza cambiare i piatti. "+
    "Devono sommare circa "+restaK+" kcal e "+restaP+" g di proteine in totale. "+rulesForAI()+
    " Pasti da ritarare: "+JSON.stringify(dopo)+
    '. Rispondi SOLO JSON: {"pasti":[{"pdi":n,"mi":n,"slot":"...","nuovo":"...","kcal":n,"prot":n}],"messaggio":"una riga"}',
    j=>{CALI=j.pasti||[];
      return "<b>Pasti di oggi ritarati</b>\n"+
        CALI.map(x=>"• "+esc(x.slot||"")+": "+esc(x.nuovo||"")+" (~"+Math.round(x.kcal||0)+" kcal)").join("\n")+
        (j.messaggio?"\n\n<i>"+esc(j.messaggio)+"</i>":"")+
        '<div class="btngrid2" style="margin-top:8px"><button class="btn small" onclick="applyMealEdits(CALI)">Applica</button></div>';});};
window.geoReset=async(di)=>{
  const p=await geoAskPlace(" Dove ti trovi adesso?");
  if(!p)return;
  GEO={place:p,dishes:[],seen:[],at:Date.now()};geoDishes(di,true);};
function geoDish(i){return GEO.dishes[i]||null;}
window.geoUse=(di,i)=>{const x=geoDish(i);if(!x)return;
  const tgt=selTarget("geoTarget",di);
  if(tgt.pdi===undefined||!PLAN[tgt.pdi])return dlgAlert(tr("Nessun pasto selezionabile in questo giorno."));
  S.week.days[tgt.pdi].meals[tgt.mi].custom={d:x.nome+" (piatto tipico)",k:Math.round(x.kcal)||0,p:Math.round(x.prot)||0};
  save();render(cur);toast(tr("Pasto sostituito ✓"));};
window.geoExtra=(di,i)=>{const x=geoDish(i);if(!x)return;
  S.week.days[di].extras.push({d:"Piatto tipico: "+x.nome,k:Math.round(x.kcal)||0,p:Math.round(x.prot)||0});
  save();render(cur);toast(tr("Aggiunto come extra ✓"));};
window.geoSave=(i)=>{const x=geoDish(i);if(!x)return;
  addRecipe(x.nome+" — "+(x.tipico||"")+" "+(x.come||""),Math.round(x.kcal)||0,Math.round(x.prot)||0,null,null);};
/* ── SCAFFALE ────────────────────────────────────────────────────────
   Il momento vero: sei davanti a venti yogurt e non sai quale prendere.
   Nuvia legge lo scaffale, sa cosa ti serve (lista, piano, intolleranze,
   protocolli) e sceglie: quale, quanto, e perché quello e non l'altro.
   Riusa la stessa vista che legge scontrini e codici a barre. */
let SCAF=[];
window.scafAdd=async(gal)=>{
  try{const img=await pickPhoto({gallery:!!gal,multi:false});
    if(!img)return;SCAF.push(img);
    const n=document.getElementById("scafN");if(n)n.textContent=SCAF.length?" ("+SCAF.length+")":"";
    toast(SCAF.length+(SCAF.length===1?" foto pronta":" foto pronte"));}catch(e){}};
window.scafReset=()=>{SCAF=[];const n=document.getElementById("scafN");if(n)n.textContent="";toast(tr("Foto tolte"));};
/* ── DOMICILIO ──────────────────────────────────────────────────────
   Stessa idea del menù al ristorante, ma il menù è un'app di consegne:
   incolli i piatti (o li fotografi) e Nuvia sceglie la combinazione che
   sta nei numeri di stasera. Le consegne portano porzioni più grandi e
   più condimento: il prompt lo dice, così le stime non sono ottimiste. */
/* ── IL GIORNO DOPO ─────────────────────────────────────────────────
   Dopo una serata pesante il corpo chiede acqua e sali, non punizioni.
   Questo tool NON fa medicina: non parla di farmaci, non promette
   smaltimenti, non tocca il deficit. Riorganizza la giornata e ricorda
   di bere. Se ci sono segnali che vanno oltre la stanchezza, dice di
   rivolgersi a un medico invece di improvvisare. */
window.dopoAI=async(di)=>{
  if(!aiOn())return aiFail(new Error("nokey"));
  const com=document.getElementById("dopoCome");
  const stato=(com&&com.value)||"pesante";
  const box=document.getElementById("dopoOut");
  box.style.display="block";genBoxMostra(box);box.textContent="Sistemo la giornata…";
  try{
    const resto=pendingMeals(di);   /* i pasti di oggi non ancora fatti */
    const t=await aiAsk('Ieri sera è stata una serata '+stato+' (alcol e cibo fuori piano). Oggi mi sento appesantito e stanco. '+
      dietStr()+rulesForAI()+
      ' Pasti di oggi ancora da fare: '+JSON.stringify(resto)+'.'+
      ' Riscrivili in versione più digeribile e più ricca di acqua e potassio (verdura, frutta, brodi, cereali semplici), '+
      'MANTENENDO le calorie totali della giornata e le proteine: oggi non si recupera con la fame, si recupera con acqua e cibo leggero. '+
      ' Aggiungi quanti bicchieri d\'acqua in più bere oggi e in quali momenti. '+
      ' NON parlare di farmaci, integratori, «detox» o «smaltire»: non è una consulenza medica. '+
      ' Se descrivo sintomi che vanno oltre stanchezza e gonfiore, invita a parlarne con un medico invece di dare consigli. '+
      ' Testo semplice, niente markdown, massimo 10 righe.');
    box.textContent=t;
  }catch(e){box.textContent="";aiFail(e);}};
window.domicilioAI=async(di)=>{
  const el=document.getElementById("domIn");
  const txt=(el&&el.value||"").trim();
  if(!txt)return dlgAlert(tr("Incolla i piatti dell'app di consegne, o qualche riga del menù."));
  if(!aiOn())return aiFail(new Error("nokey"));
  const box=document.getElementById("domOut");
  box.style.display="block";genBoxMostra(box);box.textContent="Guardo cosa si può ordinare…";
  try{
    const tgt=selTarget("domTarget",di);
    const t=await aiAsk('Sto per ordinare a domicilio. Questi sono i piatti disponibili: """'+txt.slice(0,3000)+'""". '+
      'Secondo il piano ora dovrei mangiare: '+tgt.slot+' da circa '+tgt.kAdj+' kcal e '+tgt.p+' g di proteine.'+compNote(tgt)+' '+dietStr()+
      ' ATTENZIONE: le porzioni da asporto sono più abbondanti e più condite di quelle di casa — stima al rialzo, non al ribasso. '+
      'Scegli la combinazione MIGLIORE (anche più piatti insieme, o mezza porzione), con stima kcal e proteine e una riga di motivo. '+
      'Aggiungi 2 alternative e, se serve, come compensare nel resto della giornata. Testo semplice, niente markdown, massimo 10 righe.');
    box.textContent=t;
  }catch(e){box.textContent="";aiFail(e);}};

/* ── DIECI MINUTI ───────────────────────────────────────────────────
   Non è «cosa cucino»: è «cosa cucino ADESSO che non ho tempo». Vincolo
   duro sul tempo, e solo quello che è già in casa. */
window.rapidoAI=async(di)=>{
  if(!aiOn())return aiFail(new Error("nokey"));
  const box=document.getElementById("rapOut");
  box.style.display="block";genBoxMostra(box);box.textContent="Cerco qualcosa di veloce…";
  try{
    const tgt=selTarget("rapTarget",di);
    const p=pantry();
    const inCasa=p.items.map(i=>i.n).slice(0,40).join(", ");
    const frz=(p.freezer||[]).map(f=>f.n).join(", ");
    const t=await aiAsk('Ho dieci minuti in tutto, cottura compresa, e devo fare: '+tgt.slot+
      ' da circa '+tgt.kAdj+' kcal e '+tgt.p+' g di proteine.'+compNote(tgt)+' '+dietStr()+
      (inCasa?' In casa ho: '+inCasa+'.':' Non so cosa ho in casa: usa ingredienti comuni della tradizione culinaria indicata sopra.')+
      (frz?' Nel freezer: '+frz+' (scongelabile al microonde).':'')+
      ' VINCOLO DURO: preparazione e cottura entro 10 minuti reali, massimo 4 ingredienti, niente forno né lievitazioni né cotture lunghe. '+
      'Dammi 2 proposte con grammature, tempo stimato di ciascuna e i passaggi in 3 righe. Se qualcosa non sta nei 10 minuti, non proporlo. '+
      'Testo semplice, niente markdown.');
    box.textContent=t;
  }catch(e){box.textContent="";aiFail(e);}};
window.scafAI=async()=>{
  if(!aiOn())return aiFail(new Error("nokey"));
  if(!SCAF.length)return dlgAlert(tr("Fotografa prima lo scaffale: anche una foto sola va bene."));
  const box=document.getElementById("scafOut");
  box.style.display="block";genBoxMostra(box);box.textContent="Leggo lo scaffale…";
  try{
    /* cosa mi serve davvero: la lista di questo ciclo, non un ideale */
    const lista=[];
    SHOPCUR().forEach(([cat,items])=>items.forEach(it=>lista.push(it)));
    const mancano=(function(){const k=spesaCopertura();
      return k&&k.manca.length?k.manca.map(m=>m.k).join(", "):"";})();
    const prompt=
      "Sono al supermercato davanti a questo scaffale (foto). Leggi le etichette dei prodotti che vedi e dimmi QUALE prendere."+
      (lista.length?" Nella mia lista della spesa ho: "+lista.slice(0,40).join("; ")+".":"")+
      (mancano?" Mi mancano soprattutto: "+mancano+".":"")+
      " "+dietStr()+rulesForAI()+
      " Scegli 1 prodotto CONSIGLIATO fra quelli visibili nella foto, più 1 alternativa. Per ciascuno: nome come sta sull'etichetta, QUANTO prenderne per la mia settimana, e il PERCHÉ in una riga (confronto concreto: proteine, zuccheri, sale, grassi saturi, additivi, prezzo al chilo se leggibile). "+
      " Se nella foto c'è un prodotto da EVITARE per le mie caratteristiche alimentari, dillo in una riga. "+
      " Se le etichette non sono leggibili, dillo invece di inventare. Testo semplice, niente markdown, massimo 10 righe.";
    const t=await aiAskVision(prompt,SCAF);   /* le foto vanno con la vista, non col testo */
    box.textContent=t;
    SCAF=[];const n=document.getElementById("scafN");if(n)n.textContent="";
  }catch(e){box.textContent="";aiFail(e);}};
window.menuAI=async(di)=>{
  const txt=document.getElementById("menuIn").value.trim();
  if(!txt)return dlgAlert(tr("Incolla il testo del menù."));
  if(!aiOn())return aiFail(new Error("nokey"));
  const box=document.getElementById("menuOut");box.textContent="Analizzo il menù…";
  try{
    const tgt=selTarget("menuTarget",di);
    const t=await aiAsk('Menù del ristorante: """'+txt.slice(0,3000)+'""". In questo momento, secondo il mio piano, dovrei mangiare: '+tgt.slot+' da circa '+tgt.k+' kcal e '+tgt.p+' g di proteine.'+compNote(tgt)+' '+dietStr()+' SCEGLI il piatto più COMPATIBILE con circa '+tgt.kAdj+' kcal e '+tgt.p+' g prot più 2 riserve, con stima kcal/prot e 1 riga di motivo; evidenzia la scelta n.1. Testo semplice, niente markdown.');
    box.textContent=t;
  }catch(e){box.textContent="";aiFail(e);}};

