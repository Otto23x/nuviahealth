/* ═══════════════════════════════════════════════════════════════
   14. STORICO: recap, salvataggio con AI (report PT + correlazioni +
       check TDEE), grafici Chart.js, WhatsApp, Report PDF
   ═══════════════════════════════════════════════════════════════ */
/* Genera l'analisi di una settimana già archiviata, su richiesta */
window.weekAnalisi=async(i)=>{
  const wk=S.history[i];if(!wk)return;
  if(!aiOn())return aiFail(new Error("nokey"));
  const box=genBox();
  if(box){box.style.display="block";genBoxMostra(box);box.textContent="Analizzo la settimana…";}
  try{
    const t=await aiAsk(WEEK_COACH+JSON.stringify(wk.days)+'. Deficit medio '+wk.avgDef+' kcal, proteine medie '+wk.avgProt+'g. Rispondi SOLO con {"report":"3-4 frasi sul risultato e su cosa migliorare","corr":"eventuali legami fra umore, sonno, allenamenti e alimentazione, 1 frase; se non ce ne sono scrivi stringa vuota"}');
    const j=parseAIJSON(t);
    wk.ai={report:j.report,corr:j.corr};save();
    if(box)box.textContent="";genBoxVia();
    render("storico");toast(tr("Analisi pronta ✓"));
  }catch(e){if(box)box.textContent="";genBoxVia();aiFail(e);}};
/* ── L'ANALIZZATORE DEI COMPORTAMENTI ────────────────────────────────
   Non conta calorie: cerca gli SCHEMI che si ripetono, incrociando
   quando esci dal piano con come stavi. Funziona senza AI — sono conti,
   non opinioni — e parla in modo descrittivo, mai giudicante: dice cosa
   è successo, non cosa avresti dovuto fare.
   Regola di prudenza: nessuno schema viene dichiarato sotto le 10
   giornate utili. Meglio tacere che inventare una tendenza dal nulla. */
const PAT_MIN_GIORNI=10;
function giorniAnalisi(max=28){
  const out=[];
  (S.history||[]).slice(-6).forEach(w=>(w.days||[]).forEach(d=>{if(d&&typeof d==="object")out.push(d);}));
  try{PLAN.forEach((d,di)=>{const D=S.week.days[di];if(!D)return;
    if(!(D.meals||[]).some(m=>m.done)&&!(D.extras||[]).length)return;   /* giorno non vissuto */
    out.push({day:d.day,eat:eatenOfDay(di).k,planK:plannedOfDay(di).k,def:deficitOfDay(di),
      sgarri:extrasKcal(di),extrasN:(D.extras||[]).filter(x=>x.st!=="skip").length,
      sk:skippedOfDay(di),sleep:D.sleep||0,feel:D.feel||0,stress:D.stress||0,
      emo:D.emo||0,emoWhy:Array.isArray(D.emoWhy)?D.emoWhy:[],mealsDone:(D.meals||[]).filter(m=>m.done).length});});
  }catch(e){}
  return out.slice(-max);}

function analizzaSchemi(){
  const g=giorniAnalisi();
  if(g.length<PAT_MIN_GIORNI)return {pochi:true,n:g.length,servono:PAT_MIN_GIORNI};
  const schemi=[];
  const perc=(a,b)=>b?Math.round(100*a/b):0;
  /* 1 · lo stress alto finisce fuori piano? */
  const stressAlto=g.filter(d=>d.stress>=4), stressBasso=g.filter(d=>d.stress<=2);
  if(stressAlto.length>=3&&stressBasso.length>=3){
    const a=perc(stressAlto.filter(d=>d.sgarri>150).length,stressAlto.length);
    const b=perc(stressBasso.filter(d=>d.sgarri>150).length,stressBasso.length);
    if(a-b>=25)schemi.push({t:"stress",forza:a-b,
      testo:trh("Nei giorni di stress alto esci dal piano nel {v1}% dei casi, contro il {v2}% dei giorni tranquilli.",{v1:a,v2:b})});
  }
  /* 2 · il sonno corto anticipa la fame nervosa del giorno dopo */
  let dormitoPoco=0,poiFame=0;
  for(let i=0;i<g.length-1;i++){ if(g[i].sleep&&g[i].sleep<=2){dormitoPoco++; if(g[i+1].emo>=4)poiFame++;} }
  if(dormitoPoco>=3&&perc(poiFame,dormitoPoco)>=50)
    schemi.push({t:"sonno",forza:perc(poiFame,dormitoPoco),
      testo:trh("Dopo una notte corta, il giorno seguente la fame nervosa è alta nel {v1}% dei casi.",{v1:perc(poiFame,dormitoPoco)})});
  /* 3 · il ciclo restrizione → abbuffata: è il più importante da vedere presto */
  let tagliati=0,poiSforo=0;
  for(let i=0;i<g.length-1;i++){
    const forte=g[i].planK&&g[i].eat&&g[i].eat<g[i].planK*0.75;
    if(forte){tagliati++; if(g[i+1].sgarri>300)poiSforo++;}}
  if(tagliati>=3&&perc(poiSforo,tagliati)>=50)
    schemi.push({t:"restrizione",forza:perc(poiSforo,tagliati),priorita:true,
      testo:trh("Quando un giorno mangi molto meno del previsto, il giorno dopo arriva un eccesso nel {v1}% dei casi: è il corpo che recupera, non una mancanza di volontà.",{v1:perc(poiSforo,tagliati)})});
  /* 4 · le sere: gli extra si concentrano dopo cena? */
  const conExtra=g.filter(d=>d.extrasN>0).length;
  if(conExtra>=4&&perc(conExtra,g.length)>=40)
    schemi.push({t:"extra",forza:perc(conExtra,g.length),
      testo:trh("In {v1} giorni su 100 compare almeno un extra fuori piano: fa parte del tuo ritmo, il piano può tenerne conto invece di ignorarlo.",{v1:perc(conExtra,g.length)})});
  /* 5 · i pasti saltati */
  const saltati=g.reduce((a,d)=>a+(d.sk||0),0);
  if(saltati>=5)schemi.push({t:"salti",forza:saltati,
    testo:trh("Negli ultimi {v1} giorni hai saltato {v2} pasti: saltare aumenta la fame di quello dopo.",{v1:g.length,v2:saltati})});
  /* 6 · cosa accende la fame nervosa, secondo quello che hai segnato tu */
  const cause={};
  g.forEach(d=>(d.emoWhy||[]).forEach(c=>{cause[c]=(cause[c]||0)+1;}));
  const top=Object.keys(cause).sort((a,b)=>cause[b]-cause[a])[0];
  if(top&&cause[top]>=3)schemi.push({t:"causa",forza:cause[top],
    testo:trh("La fame nervosa che hai segnato torna soprattutto insieme a: {v1} ({v2} volte).",{v1:top,v2:cause[top]})});
  schemi.sort((a,b)=>(b.priorita?1:0)-(a.priorita?1:0)||b.forza-a.forza);
  return {giorni:g.length,schemi:schemi.slice(0,4)};}

/* ── QUANDO SERVE PIÙ DI UN'APP ──────────────────────────────────────
   Nuvia non fa diagnosi e non ne farà mai. Ma alcuni segnali, se durano,
   non si risolvono con un piatto diverso: quando compaiono, il compito
   dell'app è uno solo — dirlo con delicatezza e indicare una porta vera.
   Le soglie sono volutamente prudenti: meglio tacere che allarmare. */
const SOS_NUMERO="800 180 969";     /* Numero Verde SOS Disturbi Alimentari — gratuito e anonimo */
function segnaliSostegno(){
  const g=(typeof giorniAnalisi==="function")?giorniAnalisi():[];
  if(g.length<14)return null;                    /* due settimane: sotto non si giudica */
  const ultimi=g.slice(-21);
  const n=ultimi.length;
  const perc=(a)=>Math.round(100*a/n);
  const segni=[];
  /* 1 · restrizione forte che si ripete */
  const restr=ultimi.filter(d=>d.planK&&d.eat&&d.eat<d.planK*0.6).length;
  if(restr>=Math.max(4,Math.round(n*0.25)))
    segni.push({id:"restr",t:trh("In {v1} giorni su {v2} hai mangiato molto meno di quanto previsto",{v1:restr,v2:n})});
  /* 2 · perdita di controllo ricorrente */
  const perdite=ultimi.filter(d=>+d.sgarri>800).length;
  if(perdite>=4)
    segni.push({id:"perdite",t:trh("In {v1} giorni è arrivato un eccesso molto grande",{v1:perdite})});
  /* 3 · umore basso che dura */
  const feel=ultimi.filter(d=>+d.feel>0);
  const bassi=feel.filter(d=>+d.feel<=2).length;
  if(feel.length>=10&&perc(bassi)>=60)
    segni.push({id:"umore",t:trh("L'umore che segni è basso da parecchi giorni ({v1} su {v2})",{v1:bassi,v2:feel.length})});
  /* 4 · fame nervosa quasi ogni giorno */
  const emo=ultimi.filter(d=>+d.emo>=4).length;
  if(emo>=Math.max(7,Math.round(n*0.5)))
    segni.push({id:"emo",t:trh("La fame nervosa è alta quasi ogni giorno ({v1} su {v2})",{v1:emo,v2:n})});
  if(!segni.length)return null;
  return {segni:segni,giorni:n};}

function sostegnoCardHTML(){
  const r=segnaliSostegno();
  if(!r||S.ui.sosOff)return "";
  return `<div class="card" style="border-left:4px solid var(--zaff)">
    <h2>${tr("Una cosa, con calma")}</h2>
    Guardando gli ultimi giorni ho notato questo:
    ${r.segni.map(x=>`<div class="hint" style="margin-top:8px"><b>${esc(x.t)}</b>.</div>`).join("")}
    ${hint2(tr("Non è una diagnosi e non voglio spaventarti:"),tr("Sono numeri, e i numeri non sanno come stai davvero. Ma quando queste cose durano, un'app non basta — e non deve bastare. Parlarne con il tuo medico, o con uno psicologo, è la mossa più utile che puoi fare per te."))}
    <div class="hint" style="margin-top:12px">${tr("In Italia esiste un numero verde gratuito e anonimo per i disturbi alimentari:")} <b>${SOS_NUMERO}</b> ${tr("(lun-ven). Rispondono psicologi e nutrizionisti, anche solo per capire se c'è qualcosa di cui parlare.")}</div>
    <!-- ══ LA PORTA INTERNAZIONALE (founder, 27/08) ══════════════
         Il numero verde è italiano, e il testo lo dice — quindi non
         mente. Ma a chi usa l'app in inglese, fuori dall'Italia, quel
         numero non apre nessuna porta: la card che dovrebbe indicare
         un aiuto vero diventa un vicolo cieco proprio nel momento in
         cui serve. Accanto al numero c'è un indirizzo che riconosce il
         paese di chi lo apre e copre un centinaio di stati. È un link,
         non una chiamata: nessun dato esce da qui. -->
    <div class="hint" style="margin-top:8px">${tr("Fuori dall'Italia:")}
      <a href="https://findahelpline.com" target="_blank" rel="noopener">findahelpline.com</a>
      ${tr("— elenchi di ascolto gratuiti, paese per paese.")}</div>
    ${(typeof partnerBlocco==="function")?partnerBlocco("sostegno",tr("Se preferisci parlare con qualcuno")):""}
    <div class="mtools">
      <button class="btn ghost small" onclick="sosNascondi()">${tr("Ho capito, non mostrarlo più")}</button>
    </div></div>`;}
window.sosNascondi=async()=>{
  if(!await dlgConfirm(tr("Lo tolgo dalla pagina. Resta comunque in Guida, se ti servisse."),{ok:tr("Va bene"),ko:trBtn("Annulla")}))return;
  S.ui.sosOff=1;save();render(cur);};


/* ── BLOCCO E · DEBRIEFING DELLA SETTIMANA ───────────────────────────
   La domenica (o quando la settimana è scaduta) Nuvia chiude il cerchio:
   fino a TRE domande costruite sui numeri veri della settimana — non un
   questionario fisso. Le risposte finiscono nel racconto (S.profile.story),
   dove l'AI le legge già; e da lì il sovragente può proporre UNA mossa
   per la settimana nuova, mostrandola prima di agire, come sempre.
   Riusa pezzi collaudati: giorniAnalisi, il racconto, assistPiano. */
function debriefKey(){const m=new Date();m.setHours(12,0,0,0);m.setDate(m.getDate()-wd(m));return iso(m);}
function debriefDomande(){
  const g=(typeof giorniAnalisi==="function")?giorniAnalisi():[];
  const sett=g.slice(-7);if(sett.length<5)return [];
  const dom=[];
  /* 1 · il giorno più storto: che cosa è successo? */
  let peggio=null;
  sett.forEach(d=>{if(d.planK&&d.eat){const sc=Math.abs(d.eat-d.planK)/d.planK;
    if(sc>0.25&&(!peggio||sc>peggio.sc))peggio={d:d,sc:sc};}});
  if(peggio)dom.push({id:"storto",q:tr("Il giorno più fuori piano è stato {g} ({k} kcal contro {p}): cosa c'era quel giorno?",
    {g:dateIT(peggio.d.date||peggio.d.d||""),k:peggio.d.eat,p:peggio.d.planK})});
  /* 2 · sgarri grandi ricorrenti */
  const sg=sett.filter(d=>+d.sgarri>500).length;
  if(sg>=2)dom.push({id:"sgarri",q:tr("In {n} giorni è arrivato un extra importante: succede in un momento preciso (sera, weekend, dopo il lavoro)?",{n:sg})});
  /* 3 · allenamenti sotto l'obiettivo */
  try{const goal=goalWkTotal(),fatti=workoutsThisWeek();
    if(goal>0&&fatti<goal)dom.push({id:"sport",q:tr("Ti eri dato {g} allenamenti e ne hai fatti {f}: cosa si è messo in mezzo?",{g:goal,f:fatti})});
  }catch(e){}
  /* 4 · umore basso che pesa (solo se non c'è già troppo) */
  if(dom.length<3){const bassi=sett.filter(d=>+d.feel>0&&+d.feel<=2).length;
    if(bassi>=3)dom.push({id:"umore",q:tr("L'umore è stato basso per {n} giorni: c'è qualcosa che la settimana nuova dovrebbe tenere presente?",{n:bassi})});}
  return dom.slice(0,3);}
function debriefRisposte(){return (S.ui.debriefR&&S.ui.debriefR.k===debriefKey())?S.ui.debriefR.done:{};}
function debriefCardHTML(forza){
  if(S.ui.debriefOff)return "";
  const oggiDom=wd(new Date())===6;
  if(!forza&&!oggiDom&&!weekStale())return "";        /* si apre a fine settimana */
  if(S.ui.debriefDone===debriefKey())return "";
  const dom=debriefDomande();if(!dom.length)return "";
  const fatte=debriefRisposte();
  const resto=dom.filter(d=>!fatte[d.id]);
  let h=`<div class="card" style="border-left:4px solid var(--teal)"><h2>${tr("Com'è andata la settimana")}</h2>
    ${hint2(tr("Due minuti, guardando i tuoi numeri veri."),tr("Quello che scrivi finisce nel racconto: la settimana nuova ne tiene conto."))}`;
  dom.forEach(d=>{h+=`<div class="hint" style="margin-top:12px">${fatte[d.id]?"✓ ":""}<b>${d.q}</b>${fatte[d.id]?"":`<div class="mtools" style="margin-top:8px"><button class="btn ghost small" onclick="debriefRispondi('${d.id}')">${tr("Rispondo")}</button></div>`}</div>`;});
  h+=`<div class="mtools" style="margin-top:12px">`;
  if(!resto.length&&aiOn())h+=`<button class="btn small" onclick="debriefMossa()">${tr("Proponimi UNA mossa per la settimana nuova")}</button>`;
  h+=`<button class="btn ghost small" onclick="debriefChiudi()">${resto.length?tr("Non ora"):tr("Chiudi")}</button></div></div>`;
  return h;}
window.debriefCardHTML=debriefCardHTML;window.debriefDomande=debriefDomande;
window.debriefRispondi=async(id)=>{
  const d=debriefDomande().find(x=>x.id===id);if(!d)return;
  const t=await dlgPrompt(d.q,"");
  if(t===null||!t.trim())return;
  /* la risposta vive nel racconto, non in un campo nascosto: la persona
     la può rileggere e correggere, e ogni AI la vede già */
  S.profile.story=((S.profile.story||"").trim()+"\n["+tr("settimana")+" "+debriefKey()+"] "+d.q+" — "+t.trim().slice(0,300)).trim();
  if(!(S.ui.debriefR&&S.ui.debriefR.k===debriefKey()))S.ui.debriefR={k:debriefKey(),done:{}};
  S.ui.debriefR.done[id]=1;save();render(cur);};
window.debriefMossa=async()=>{
  const fatte=debriefRisposte();
  const testo=tr("debriefing della settimana")+": "+debriefDomande().map(d=>d.q).join(" · ")+" — "+tr("Proponi UNA sola mossa concreta per la settimana nuova");
  try{assistOpen();}catch(e){}
  try{await assistPiano(testo);}catch(e){}};
window.debriefChiudi=()=>{S.ui.debriefDone=debriefKey();save();render(cur);};

/* Il motivatore: parla dei TUOI numeri, non frasi da poster. E dopo una
   giornata storta non fa la predica: ricorda che il piano regge lo stesso. */
function spintaDelGiorno(){
  const g=(typeof giorniAnalisi==="function")?giorniAnalisi():[];
  if(g.length<3)return "";
  const ieri=g[g.length-1]||{};
  const ok=g.filter(d=>d.planK&&d.eat&&Math.abs(d.eat-d.planK)<=d.planK*0.1).length;
  if(+ieri.sgarri>500)
    return tr("Ieri è andata storta e non cambia niente: su {n} giorni ne hai centrati {ok}. Il piano non riparte da lunedì, riparte dal prossimo pasto.",{n:g.length,ok:ok});
  if(ok>=3&&ok>=Math.round(g.length*0.5))
    return tr("{ok} giornate su {n} sono finite dentro il piano. Non è fortuna: è quello che stai facendo ogni giorno.",{ok:ok,n:g.length});
  const seg=g.filter(d=>d.sleep||d.feel||d.stress).length;
  if(seg>=5)
    return tr("Stai segnando come stai da {n} giorni: è la parte che quasi tutti saltano, ed è quella che poi permette di capire cosa non funziona.",{n:seg});
  return "";}
/* Quello che l'AI riceve: fatti, non etichette. */
/* ── LA PAGINA «COME STAI» ───────────────────────────────────────────
   Non duplica niente: raccoglie i pezzi che già esistono — le domande di
   oggi, gli schemi, la spinta, il ponte verso un aiuto vero — e li mette
   dove uno li cerca quando sta cercando proprio quello. */
function renderComeStai(){
  const di=viewIdx();   /* stesso giorno che stai guardando altrove */
  let h=`<div class="gsec">${tr("Oggi")}</div>`;
  h+=`<div class="card"><h2>${tr("Come stai adesso")}</h2>
    ${tr("Quattro tocchi. Non è un questionario: è quello che permette a Nuvia di capire perché certe giornate vanno storte.")}
    <div class="duo" style="margin-top:16px">
      <div><label>${tr("Come hai dormito")}</label>${stars(di,"sleep")}</div>
      <div><label>${tr("Come ti senti")}</label>${stars(di,"feel")}</div>
    </div>
    <div class="duo" style="margin-top:12px">
      <div><label>${tr("Quanto stress")}</label>${stars(di,"stress")}</div>
      <div><label>${tr("Fame nervosa")}</label>${stars(di,"emo")}</div>
    </div>
    ${emoNota(di)}</div>`;
  /* Se stress o fame nervosa sono alti, si offre un gesto — non un
     altro consiglio da leggere, una cosa da fare col corpo. */
  {const d=S.week.days[di]||{};
   if((+d.stress>=4||+d.emo>=4)&&typeof gestiBlocco==="function")
     h+=gestiBlocco("stress",tr("Una cosa che puoi fare adesso"));}
  h+=(typeof letturaCardHTML==="function")?letturaCardHTML():"";
  /* Prima il ricontrollo (se è ora), poi una domanda nuova: mai insieme. */
  const ric=(typeof sensoRichiestaHTML==="function")?sensoRichiestaHTML():"";
  h+=ric?ric:((typeof sensoCardHTML==="function")?sensoCardHTML():"");
  /* La spinta del giorno: la stessa che compare in Punto. */
  const sp=(typeof spintaDelGiorno==="function")?spintaDelGiorno():"";
  if(sp)h+=`<div class="card"><h2>${tr("Il punto")}</h2><div class="hint">${sp}</div></div>`;
  h+=`<div class="gsec">${tr("Cosa si ripete")}</div>`;
  h+=schemiPagina();
  const sos=(typeof sostegnoCardHTML==="function")?sostegnoCardHTML():"";
  if(sos)h+=sos;
  h+=`<div class="card"><h2>${tr("Se serve più di un'app")}</h2>
    ${hint2(tr("Nuvia sta accanto, non cura."),tr("Quando quello che senti dura da settimane, o quando il cibo è diventato il modo principale per gestire le emozioni, parlarne con uno psicologo o un medico è la cosa più utile che puoi fare — e non toglie nulla a quello che stai facendo qui."))}
    <div class="hint" style="margin-top:12px;border-left:4px solid var(--salvia);padding-left:12px">
      ${trh("{b}<br>{n} — gratuito e anonimo, attivo dal lunedì al sabato.",{b:"<b>"+tr("Numero verde SOS Disturbi Alimentari")+"</b>",n:SOS_NUMERO})}</div></div>`;
  document.getElementById("pg-comestai").innerHTML=h;}

/* Gli schemi, in una funzione sola: usata dalla pagina e dai Numeri. */
function schemiPagina(){
  const r=analizzaSchemi();
  /* Pochi giorni: prima c'era solo una riga di testo, e una pagina che
     spiega perché non può ancora dire nulla è il posto dove si perde la
     gente. Ora la figura e una cosa sola da fare: segnare come stai. */
  if(r.pochi)return `<div class="card"><h2>${tr("I tuoi schemi")}</h2>
    ${vuotoDi("schemi")}
    <div class="hint" style="text-align:center">${fascia(r.n)}/${r.servono} ${tr("giorni")}</div></div>`;
  if(!r.schemi.length)return `<div class="card"><h2>${tr("I tuoi schemi")}</h2>
    ${hint2(tr("Negli ultimi giorni non emergono schemi ricorrenti:"),tr("Quello che mangi non sembra legato a sonno, stress o fame nervosa. È una buona notizia."))}</div>`;
  return `<div class="card"><h2>${tr("I tuoi schemi")}</h2>
    <div class="hint">${tr("Cosa si ripete, negli ultimi {n} giorni vissuti. Sono osservazioni, non giudizi: servono a costruire proposte che funzionino nei tuoi momenti difficili.",{n:r.giorni||r.n})}</div>
    ${r.schemi.map(x=>`<div class="hint" style="margin-top:12px;border-left:4px solid ${x.priorita?"var(--zaff)":"var(--salvia)"};padding-left:12px">${esc(x.testo)}</div>`).join("")}
    ${r.schemi.some(x=>x.t==="restrizione")?`${hint2(tr("Se questo schema ti pesa o si ripete da mesi, parlarne con un professionista è la mossa più utile:"),tr("Qui trovi solo i numeri, non un aiuto clinico."))}`:""}
  </div>`;}
/* ── L'AGENTE CHE RICORDA ────────────────────────────────────────────
   Non consigli generici: proposte che nascono da quello che è successo
   davvero, con l'azione già pronta. Regole ferree, perché la differenza
   fra utile e molesto è tutta qui:
   una proposta alla volta · ignorata due volte, non torna mai più ·
   sempre rifiutabile per sempre con un tocco. */
/* ricotta al cambio lingua: il tr() qui dentro si valuta alla
   costruzione, e la costruzione si ripete quando la lingua cambia
   (registro I18N_RIFAI in 10_base) */
let PROPOSTE;
(window.I18N_RIFAI=window.I18N_RIFAI||[]).push(function(){PROPOSTE=[
 {id:"giornoduro",
  trova(){
    const g=(typeof giorniAnalisi==="function")?giorniAnalisi():[];
    if(g.length<14)return null;
    const per={};
    g.forEach((d,i)=>{if(+d.sgarri>400){const wd=i%7;per[wd]=(per[wd]||0)+1;}});
    const k=Object.keys(per).sort((a,b)=>per[b]-per[a])[0];
    if(k==null||per[k]<3)return null;
    const GG=["lunedì","martedì","mercoledì","giovedì","venerdì","sabato","domenica"];
    return {t:tr("Il {g} è il tuo giorno più difficile: è successo {n} volte.",{g:giorno(GG[k]),n:per[k]}),
            q:tr("Vuoi che quel giorno il piano sia più leggero e con qualcosa di pronto?"),
            fai:tr("Preparalo"),
            f:()=>{show("piano");if(typeof planMoreSheet==="function")planMoreSheet();}};}},
 {id:"pastosaltato",
  trova(){
    const g=(typeof giorniAnalisi==="function")?giorniAnalisi():[];
    if(g.length<10)return null;
    const salti=g.filter(d=>+d.sk>0).length;
    if(salti<Math.max(4,Math.round(g.length*0.3)))return null;
    return {t:tr("Salti un pasto in {n} giorni su {tot}.",{n:salti,tot:g.length}),
            q:tr("Se non è una scelta, forse è nell'orario sbagliato: lo spostiamo?"),
            fai:tr("Sistemiamolo"),
            f:()=>{show("piano");}};}},
 {id:"freezerfermo",
  trova(){
    const f=((S.pantry||{}).freezer)||[];
    if(!f.length)return null;
    const vecchi=f.filter(x=>x.at&&(Date.now()-new Date(x.at).getTime())>14*86400000);
    if(!vecchi.length)return null;
    return {t:tr("Nel freezer c'è roba da più di due settimane: {c}.",{c:vecchi.map(x=>x.n).slice(0,3).join(", ")}),
            q:tr("La uso nei prossimi giorni invece di farla invecchiare?"),
            fai:tr("Usala"),
            f:()=>{show("piano");if(typeof pantryCucina==="function")pantryCucina();}};}},
 {id:"allenamentigiu",
  trova(){
    const g=(typeof goalWkTotal==="function")?goalWkTotal():0;
    if(!g)return null;
    const st=(S.history||[]).slice(-2);
    if(st.length<2)return null;
    const fatti=st.map(w=>(w.days||[]).reduce((s,d)=>s+((d.workouts||[]).length),0));
    if(fatti.some(x=>x>=g))return null;
    return {t:tr("Da due settimane resti sotto l'obiettivo di allenamenti ({a} e {b} su {g}).",{a:fatti[0],b:fatti[1],g:g}),
            q:tr("Meglio un obiettivo più basso che centri, o teniamo questo?"),
            fai:tr("Rivedi l'obiettivo"),
            f:()=>{show("io");}};}},
];});
window.I18N_RIFAI[window.I18N_RIFAI.length-1]();
/* ── LA LETTURA INTERA ───────────────────────────────────────────────
   Il report settimanale guardava cibo, sonno e umore. Ma una persona non
   è fatta a compartimenti: gli allenamenti pesano sulla fame, lo stress
   pesa sugli allenamenti, e le misure dello studio dicono se quello che
   si vede sulla bilancia è vero. Questa è l'unica lettura che li mette
   insieme — e parte dalle parole della persona, non dai grammi. */
function letturaDati(){
  const g=(typeof giorniAnalisi==="function")?giorniAnalisi(28):[];
  if(g.length<7)return null;
  const media=(k)=>{const v=g.filter(d=>+d[k]>0);return v.length?Math.round(v.reduce((s,d)=>s+ +d[k],0)/v.length*10)/10:null;};
  const all=((S.history||[]).slice(-4)).map(w=>(w.days||[]).reduce((s,d)=>s+((d.workouts||[]).length),0));
  const sett=(S.history||[]).slice(-4).map(w=>w.avgDef).filter(x=>x!=null);
  return {giorni:g.length,
    sonno:media("sleep"),umore:media("feel"),stress:media("stress"),fame:media("emo"),
    fuoriPiano:g.filter(d=>+d.sgarri>400).length,
    salti:g.filter(d=>+d.sk>0).length,
    allenamenti:all,deficit:sett,
    peso:(S.profile.weights||[]).slice(-4).map(x=>x.w)};}
window.letturaAI=async()=>{
  if(!aiOn())return aiFail(new Error("nokey"));
  const box=document.getElementById("letturaOut");
  box.style.display="block";genBoxMostra(box);box.textContent=tr("Guardo tutto insieme…");
  try{
    const d=letturaDati();
    if(!d)throw new Error(tr("Servono almeno sette giorni registrati."));
    const t=await aiAsk(
      "Leggi come sta andando questa persona guardando TUTTO insieme, non solo la dieta. "+
      "Numeri degli ultimi "+d.giorni+" giorni: "+
      ["sonno medio "+(d.sonno??"n.d.")+"/5","umore "+(d.umore??"n.d.")+"/5","stress "+(d.stress??"n.d.")+"/5",
       "fame nervosa "+(d.fame??"n.d.")+"/5","giorni fuori piano "+d.fuoriPiano,"giorni con un pasto saltato "+d.salti,
       "allenamenti per settimana: "+(d.allenamenti.join(", ")||"n.d."),
       tr("deficit medio settimanale:")+" "+(d.deficit.join(", ")||"n.d."),
       "peso nelle ultime pesate: "+(d.peso.join(", ")||"n.d.")].join("; ")+"."+
      (typeof studioForAI==="function"?studioForAI():"")+
      (typeof schemiForAI==="function"?schemiForAI():"")+
      (typeof sensoForAI==="function"?sensoForAI():"")+
      (typeof trainForAI==="function"?trainForAI():"")+
      " Scrivi TRE paragrafi brevi: 1) come sta andando davvero, tenendo insieme corpo, movimento e testa "+
      "(se il peso è fermo ma le misure migliorano, dillo); 2) il legame più utile che vedi fra queste cose "+
      "(per esempio: le settimane con meno allenamenti sono anche quelle con più fame serale); "+
      "3) UNA cosa da cambiare la prossima settimana, piccola e concreta. "+
      "Parla con lei, non di lei. Niente diagnosi, niente parole cliniche, niente colpe. "+
      "Se un dato manca, dillo invece di stimarlo. Testo semplice, niente markdown.");
    box.textContent=t;
    S.ui=S.ui||{};S.ui.letturaAt=iso(new Date());save();
  }catch(e){box.textContent="";aiFail(e);}};
function letturaCardHTML(){
  const d=letturaDati();
  if(!d)return "";
  const ultimo=(S.ui&&S.ui.letturaAt)||"";
  return `<div class="card"><h2>${tr("Come sta andando, tutto insieme")}</h2>
    ${hint2(tr("Cibo, movimento e testa nella stessa lettura:"),tr("È l'unico modo per capire se il peso fermo è uno stallo o una ricomposizione, e se la fame di certe sere viene dal piatto o dalla settimana."))}
    <div class="hint" style="margin-top:12px">${[
      d.sonno!=null?tr("sonno")+" "+d.sonno+"/5":"",
      d.stress!=null?tr("stress")+" "+d.stress+"/5":"",
      d.allenamenti.length?tr("allenamenti")+" "+d.allenamenti.join("·"):"",
      tr("giorni fuori piano")+" "+d.fuoriPiano+"/"+d.giorni].filter(Boolean).join(" — ")}</div>
    ${aiOn()?`<div class="mtools"><button class="btn small" onclick="letturaAI()">${tr("Leggi tutto insieme")}</button></div>
    ${ultimo?`<div class="hint">${tr("Ultima lettura")}: ${ultimo}</div>`:""}
    <div class="aibox" aria-live="polite" id="letturaOut" style="display:none"></div>`:""}</div>`;}
function propostaMemoria(){S.ui=S.ui||{};S.ui.prop=S.ui.prop||{};return S.ui.prop;}
function propostaAttuale(){
  const m=propostaMemoria();
  for(const p of PROPOSTE){
    const st=m[p.id]||{};
    if(st.mai)continue;                       /* rifiutata per sempre */
    if((st.ignorata||0)>=2)continue;          /* ignorata due volte: basta */
    if(st.fatta)continue;
    let r=null;try{r=p.trova();}catch(e){r=null;}
    if(r)return Object.assign({id:p.id},r);
  }
  return null;}
window.propostaFai=(id)=>{
  const m=propostaMemoria();m[id]=Object.assign({},m[id],{fatta:1});save();
  const p=PROPOSTE.find(x=>x.id===id);
  if(p){const r=p.trova();try{(r&&r.f)&&r.f();}catch(e){}}};
window.propostaDopo=(id)=>{
  const m=propostaMemoria();
  const st=m[id]||{};st.ignorata=(st.ignorata||0)+1;m[id]=st;save();render(cur);
  toast(st.ignorata>=2?tr("Non te lo ripropongo più."):tr("Va bene, ne riparliamo."));};
window.propostaMai=(id)=>{
  const m=propostaMemoria();m[id]=Object.assign({},m[id],{mai:1});save();render(cur);
  toast(tr("Non te lo ripropongo più."));};
function propostaCardHTML(){
  const p=propostaAttuale();
  if(!p)return "";
  return `<div class="card"><h2>${tr("Ho notato una cosa")}</h2>
    <div class="hint">${esc(p.t)}<br><b>${esc(p.q)}</b></div>
    <div class="mtools">
      <button class="btn small" onclick="propostaFai('${p.id}')">${esc(p.fai)}</button>
      <button class="btn ghost small" onclick="propostaDopo('${p.id}')">${tr("Non ora")}</button>
      <button class="btn ghost small" onclick="propostaMai('${p.id}')">${tr("Mai più")}</button>
    </div></div>`;}
function schemiForAI(){
  const r=analizzaSchemi();
  if(r.pochi||!r.schemi.length)return "";
  return " SCHEMI RICORRENTI osservati negli ultimi "+r.giorni+" giorni: "+
    r.schemi.map(s=>s.testo).join(" ")+
    " Tienine conto nelle proposte (per esempio: pasti più sazianti nei giorni difficili, niente tagli aggressivi dopo un giorno di forte restrizione). Non fare diagnosi e non colpevolizzare.";}
function weekSummary(){
  const days=PLAN.map((d,di)=>{const e=eatenOfDay(di),pl=plannedOfDay(di),D=S.week.days[di];
    // si salva TUTTO ciò che serve all'esportazione: le settimane archiviate
    // devono avere gli stessi campi di quella in corso, non zeri
    return {day:d.day,eat:e.k,prot:e.p,c:e.c,f:e.f,fib:e.fib,z:e.z||0,
      cycle:!!D.cycle,lact:D.lact||"no",physK:D.physK||0,hungerAvg:D.hungerAvg||0,
      planK:pl.k,planP:pl.p,planC:pl.c||0,planF:pl.f||0,planFib:pl.fib||0,planZ:pl.z||0,
      burn:burnedOfDay(di),def:deficitOfDay(di),tdee:tdeeOfDay(di),sk:skippedOfDay(di),
      mealsDone:dayItems(di).filter(it=>S.week.days[it.pdi].meals[it.mi].done).length,
      mealsTot:dayItems(di).length,extrasN:(D.extras||[]).filter(x=>x.st!=="skip").length,
      recovered:D.rgpRecovered||0,water:D.water||0,
      sgarri:extrasKcal(di),sleep:D.sleep,relax:D.relax,feel:D.feel,
      stress:D.stress||0,emo:D.emo||0,emoWhy:Array.isArray(D.emoWhy)?D.emoWhy.slice():[],
      note:D.note||"",workouts:(D.workouts||[]).map(w=>w.sport+" "+w.min+"' "+(w.int||"media"))}});
  days.forEach((d,di)=>d.completed=dayCompleted(di));
  const done=days.filter(d=>d.completed);
  const avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):0;
  return {from:S.week.started,to:iso(new Date()),tdee:tdee(),weight:S.profile.w,nDone:done.length,
    avgEat:avg(done.map(d=>d.eat)),avgProt:avg(done.map(d=>d.prot)),avgDef:avg(done.map(d=>d.def)),
    totBurn:days.reduce((a,d)=>a+d.burn,0),days,ai:null};}
/* ═══════════════════════════════════════════════════════════════
   PERIODI: Dieta 1 → Periodo libero 1 → Dieta 2 …
   Ogni periodo ha inizio/fine, aspettativa iniziale (★), motivazione
   di inizio, giudizio finale (★), motivazione di fine e — per i
   periodi chiusi — una valutazione AI (★ + indicazioni) basata su
   come hai mangiato, sugli allenamenti e sui risultati.
   ═══════════════════════════════════════════════════════════════ */
function activePeriod(){return S.periods.find(p=>!p.end)||null;}
/* ═══ CICLO DIETA: 3 MESI DI DEFICIT → 1 MESE DI MANTENIMENTO ══════
   Un deficit prolungato oltre i 3 mesi fa scendere il metabolismo e logora
   la testa. Il ciclo standard alterna 90 giorni di deficit e 30 di
   mantenimento: durante il mantenimento il deficit va a zero da solo, le
   grammature del piano risalgono e la spesa si adegua di conseguenza. */
/* Schemi standard fra cui scegliere. La scelta è dell'utente o del centro
   dimagrimento che lo segue: non esiste uno schema giusto per tutti. */
const CYC_PRESETS=[
  ["cost",   0,  0, "Sempre in deficit"],
  ["21_7",  21,  7, "3 settimane di deficit + 1 di mantenimento"],
  ["42_14", 42, 14, "6 settimane di deficit + 2 di mantenimento"],
  ["63_21", 63, 21, "9 settimane di deficit + 3 di mantenimento"],
  ["pers",   0,  0, "Altro — scelgo io le settimane"]
];
/* Quale preset corrisponde alla configurazione attuale (o "pers.") */
window.cycPresetSet=(v)=>{
  /* «Altro» non applica uno schema: accende i campi delle settimane,
     che prima non comparivano mai — la voce era una scelta che non
     portava da nessuna parte. */
  if(v==="pers"){S.profile.cycPhases=true;S.ui.cycPers=true;save();render(cur);
    return toast(tr("Scegli tu quante settimane"));}
  S.ui.cycPers=false;
  if(v==="cost"){S.profile.cycPhases=false;save();render("regole");
    return toast(tr("Deficit costante: nessuna pausa programmata"));}
  const p=CYC_PRESETS.find(x=>x[0]===v);if(!p)return;
  S.profile.cycPhases=true;S.profile.cycDefDays=p[1];S.profile.cycMaintDays=p[2];
  save();render("regole");toast(p[3]+" ✓");};
/* Nell'onboarding i campi compaiono e spariscono con la scelta, senza
   ridisegnare la pagina: ridisegnare farebbe perdere quello che si sta
   scrivendo negli altri campi. */
window.dateMask=(el)=>{
  const d=el.value.replace(/\D/g,"").slice(0,8);
  el.value=d.length>4?d.slice(0,2)+"/"+d.slice(2,4)+"/"+d.slice(4)
          :d.length>2?d.slice(0,2)+"/"+d.slice(2):d;};
function dobPretty(iso){
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso||""));
  return m?m[3]+"/"+m[2]+"/"+m[1]:"";}
function dobParse(txt){
  const m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(txt||"").trim());
  if(!m)return "";
  const g=+m[1],me=+m[2],a=+m[3];
  if(g<1||g>31||me<1||me>12||a<1900||a>new Date().getFullYear())return "";
  return m[3]+"-"+m[2]+"-"+m[1];}
window.obCycUI=(v)=>{
  const b=document.getElementById("obCycPers");
  if(b)b.style.display=(v==="pers")?"block":"none";
  S.ui.cycPers=(v==="pers");};
window.cycPersSave=()=>{
  const d=Math.round(+((document.getElementById("cycDefW")||{}).value)||0);
  const m=Math.round(+((document.getElementById("cycMaiW")||{}).value)||0);
  if(!(d>=1&&m>=1))return toast(tr("Servono almeno una settimana per parte"));
  S.profile.cycPhases=true;S.profile.cycDefDays=d*7;S.profile.cycMaintDays=m*7;
  save();render(cur);
  toast(tr("{d} settimane di deficit + {m} di mantenimento ✓",{d:d,m:m}));};
function cycDefDays(){const n=+S.profile.cycDefDays;return n>0?n:90;}
function cycMaintDays(){const n=+S.profile.cycMaintDays;return n>0?n:30;}
function cycOn(){return S.profile.cycPhases!==false;}
/* Giorni trascorsi nel periodo di dieta aperto (0 se non ce n'è uno) */
/* Da quando si contano le fasi deficit/pausa: il periodo di dieta aperto,
   altrimenti una data fissa (prima pesata o giorno di avvio). NON la
   settimana in corso, che cambia ogni lunedì e azzererebbe il ciclo. */
function cycAnchor(){
  const ap=activePeriod();
  if(ap&&ap.type==="dieta"){const a=safeDate(ap.start+"T12:00:00");if(a)return a;}
  if(!S.cycStart){
    const w=(S.profile&&S.profile.weights&&S.profile.weights[0])||null;
    S.cycStart=(w&&w.d)||iso(new Date());
  }
  return safeDate(S.cycStart+"T12:00:00")||new Date();}
function dietDayNAt(date){
  const a=cycAnchor();if(!a)return 0;
  const d=new Date(date);d.setHours(12,0,0,0);
  return Math.max(1,Math.round((d-a)/864e5)+1);}
function dietDayN(){return dietDayNAt(new Date());}
/* Quel giorno cade in una pausa di mantenimento? Serve alla proiezione:
   nelle pause il peso non scende, e la curva deve dirlo. */
function cycMaintAtDate(date){
  if(!cycOn())return false;
  const n=dietDayNAt(date);if(!n)return false;
  const tot=cycDefDays()+cycMaintDays();
  return (((n-1)%tot)+1)>cycDefDays();}
/* Fase attuale del ciclo: "deficit" o "mantenimento" (null = ciclo spento
   o nessun periodo di dieta aperto) */
function cycPhase(){
  if(!cycOn())return null;
  const n=dietDayN();if(!n)return null;
  const tot=cycDefDays()+cycMaintDays();
  const pos=((n-1)%tot)+1;
  return pos<=cycDefDays()?"deficit":"mantenimento";}
function cycPhaseDay(){
  const n=dietDayN();if(!n||!cycOn())return 0;
  const tot=cycDefDays()+cycMaintDays();
  const pos=((n-1)%tot)+1;
  return pos<=cycDefDays()?pos:(pos-cycDefDays());}
function cycPhaseLen(){return cycPhase()==="mantenimento"?cycMaintDays():cycDefDays();}
function cycMaintOn(){return cycPhase()==="mantenimento";}
/* Chiave del blocco corrente: cambia a ogni passaggio di fase, così
   l'avviso ricompare al blocco successivo ma non ogni giorno. */
function cycPhaseKey(){
  const n=dietDayN();if(!n)return "";
  const tot=cycDefDays()+cycMaintDays();
  return Math.floor((n-1)/tot)+"_"+cycPhase();}
let CYC_AVVISO=false;
async function cycAvvisoFase(){
  if(CYC_AVVISO)return;                 /* uno alla volta */
  if(S.ui.cycSeen===cycPhaseKey())return;
  CYC_AVVISO=true;
  const mant=cycMaintOn();
  const testo=mant
    ? tr("⏸ <b>Inizia la pausa di mantenimento</b><br><br>Dopo {d} settimane di deficit il metabolismo ha bisogno di respirare: per {m} settimane si mangia a mantenimento, circa <b>+{k} kcal al giorno</b>.<br><br>Non è un passo indietro: serve a far funzionare il blocco successivo. Premi OK e ritaro piano e spesa.",{d:Math.round(cycDefDays()/7),m:Math.round(cycMaintDays()/7),k:Math.abs(Math.round(tdeeTarget()*defPct()/100))})
    : " "+tr("<b>Riparte il deficit</b><br><br>La pausa è finita: si torna in deficit per {d} settimane.<br><br>Premi OK e ritaro piano e spesa sulle nuove calorie.",{d:Math.round(cycDefDays()/7)});
  try{await dlgAlert(testo);}catch(e){}
  S.ui.cycSeen=cycPhaseKey();save();
  try{await cycApply();}catch(e){}
  CYC_AVVISO=false;}
window.cycApply=async()=>{
  S.ui.cycSeen=cycPhaseKey();save();
  if(!aiOn())return dlgAlert(tr("Serve la chiave AI per ritarare il piano.\n\nIl target è già cambiato: le grammature del piano puoi adeguarle a mano."));
  if(await retunePlan()){await genShop(true);render("oggi");}};
function periodLabel(p){return (p.type==="dieta"?tr("Dieta")+" ":tr("Periodo libero")+" ")+p.n;}
function starsTxt(n){n=Math.max(0,Math.min(5,Math.round(+n||0)));return "★".repeat(n)+"☆".repeat(5-n);}
function nextPeriodN(type){return S.periods.filter(p=>p.type===type).length+1;}
function weightNear(dateISO,after){ // peso registrato più vicino alla data (after: primo dopo, altrimenti ultimo prima)
  const ws=(S.profile.weights||[]).slice().sort((a,b)=>giornoDa(a.d)-giornoDa(b.d));
  if(!ws.length)return null;const t=new Date(dateISO+"T12:00:00");
  if(after){const x=ws.find(w=>giornoDa(w.d)>=t);return x?x.w:ws[ws.length-1].w;}
  const before=ws.filter(w=>giornoDa(w.d)<=t);return before.length?before[before.length-1].w:ws[0].w;}
function periodStats(p){
  const endISO=p.end||iso(new Date());
  const days=flattenDiet().filter(d=>d.date>=p.start&&d.date<=endISO);
  const done=days.filter(d=>d.eat>0);
  const n=done.length||1;
  const avg=k=>Math.round(done.reduce((a,d)=>a+(d[k]||0),0)/n);
  const workouts=days.reduce((a,d)=>a+((d.workouts||[]).length),0);
  const w0=weightNear(p.start,true),w1=weightNear(endISO,false);
  const dW=(w0!=null&&w1!=null)?Math.round((w1-w0)*10)/10:null;
  const nDays=Math.max(1,Math.round((new Date(endISO+"T12:00:00")-new Date(p.start+"T12:00:00"))/864e5)+1);
  return{nDays,nDone:done.length,avgEat:avg("eat"),avgProt:avg("prot"),avgFib:avg("fib"),avgDef:avg("def"),workouts,w0,w1,dW};}
/* startPeriod resta il punto di ingresso (lo chiamano anche i pulsanti
   in Profilo) ma ora apre il pannello unico con il tipo preselezionato. */
window.startPeriod=(type)=>periodoSheet(type);
window.endPeriod=(id)=>{
  const p=S.periods.find(x=>x.id===id);if(!p||p.end)return;
  sheetShow("Chiudi "+periodLabel(p),`
    <label>${tr("Fino a quando")}</label>
    <input type="date" id="perEnd" value="${iso(new Date())}" min="${esc(p.start)}" max="${iso(new Date())}">
    <label style="margin-top:16px">${tr("Come ti senti di essere andato/a?")}</label>
    ${perStarsHTML("perEndStars",3)}
    <label style="margin-top:16px">${tr("Com'è andata, cosa hai imparato")} <span style="font-weight:400;color:var(--grigio)">(facoltativo)</span></label>
    <input type="text" id="perEndNote" placeholder="${tr("Due righe per il te del futuro")}">
    <button class="btn" style="margin-top:16px" onclick="endPeriodGo(${id})">${tr("Chiudi il periodo")}</button>`);};
window.endPeriodGo=(id)=>{
  const p=S.periods.find(x=>x.id===id);if(!p||p.end)return;
  const end=(document.getElementById("perEnd")||{}).value||iso(new Date());
  if(!/^\d{4}-\d{2}-\d{2}$/.test(end)||end<p.start)return dlgAlert(tr("Data non valida (deve essere ≥ inizio)."));
  p.end=end;p.endStars=perStarsVal("perEndStars");
  p.endNote=String((document.getElementById("perEndNote")||{}).value||"").trim();
  save();sheetClose();render(cur);
  toast(tr("{p} chiuso ✓ Ora puoi chiedere la valutazione AI in Storico.",{p:periodLabel(p)}));};
window.editPeriod=async (id)=>{
  const p=S.periods.find(x=>x.id===id);if(!p)return;
  const start=await dlgPrompt(tr("Data di inizio:"),p.start);if(start&&/^\d{4}-\d{2}-\d{2}$/.test(start))p.start=start;
  if(p.end){const end=await dlgPrompt(tr("Data di fine:"),p.end);if(end&&/^\d{4}-\d{2}-\d{2}$/.test(end)&&end>=p.start)p.end=end;}
  const en=await dlgPrompt(tr("Motivazione di inizio:"),p.expNote||"");if(en!==null)p.expNote=en;
  if(p.end){const xn=await dlgPrompt(tr("Motivazione di fine:"),p.endNote||"");if(xn!==null)p.endNote=xn;}
  save();render(cur);};
window.delPeriod=async (id)=>{const p=S.periods.find(x=>x.id===id);if(!p)return;
  if(!await dlgConfirm(tr("Elimino {p}? I dati giornalieri restano, sparisce solo il raggruppamento.",{p:periodLabel(p)})))return;
  S.periods=S.periods.filter(x=>x.id!==id);save();render(cur);};
window.analyzePeriod=(id)=>{ // apre l'Analisi con il range del periodo
  const p=S.periods.find(x=>x.id===id);if(!p)return;
  AN.mode="manuale";AN.from=p.start;AN.to=p.end||iso(new Date());
  render("storico");
  const f=document.getElementById("anFrom"),t=document.getElementById("anTo");
  if(f)f.value=AN.from;if(t)t.value=AN.to;drawAnalysis();
  const card=document.getElementById("anMode");if(card)card.scrollIntoView({behavior:"smooth"});};
window.aiRatePeriod=async(id)=>{
  const p=S.periods.find(x=>x.id===id);if(!p||!p.end)return;
  if(!aiOn())return aiFail(new Error("nokey"));
  const st=periodStats(p);
  try{
    const t=await aiAsk('Sei un coach nutrizionale. Valuta questo periodo "'+periodLabel(p)+'" ('+p.start+' → '+p.end+', '+st.nDays+' giorni).'
      +' Dati: giorni tracciati '+st.nDone+', kcal medie '+st.avgEat+', proteine medie '+st.avgProt+' g, fibre medie '+st.avgFib+' g,'
      +' deficit medio '+st.avgDef+' kcal, allenamenti totali '+st.workouts+','
      +' peso da '+(st.w0!=null?st.w0+' kg':'n.d.')+' a '+(st.w1!=null?st.w1+' kg':'n.d.')+(st.dW!=null?' ('+(st.dW>0?'+':'')+st.dW+' kg)':'')+'.'
      +' Aspettativa iniziale dell\'utente: '+p.expStars+'/5 ("'+(p.expNote||"")+'"). Autovalutazione finale: '+p.endStars+'/5 ("'+(p.endNote||"")+'").'
      +' Dai un voto onesto in stelle (1-5) su come si è comportato davvero, e 3-4 indicazioni concrete e incoraggianti in italiano.'
      +' Rispondi SOLO JSON: {"stelle":numero,"testo":"..."}');
    const j=parseAIJSON(t);
    p.aiStars=Math.max(1,Math.min(5,Math.round(j.stelle)||3));p.aiText=String(j.testo||"").trim();
    save();render("storico");toast(tr("Valutazione AI pronta ✓"));
  }catch(e){aiFail(e);}};
function periodsCardHTML(forIo){
  const ap=activePeriod();
  let h=`<div class="card"><h2>${tr("Periodi (dieta / libero)")}</h2>`;
  /* La vacanza È un periodo della vita, non una voce di sistema:
     sta qui dentro, accanto ai periodi dieta/libero. */
  /* Dieta, Libero e Vacanza sono tre modi di stare nello stesso momento:
     stanno su una riga sola, non sparsi in tre blocchi. */
  if(ap){const st=periodStats(ap);
    h+=`<div class="hint">${tr("In corso:")} <b>${periodLabel(ap)}</b> dal ${ap.start} ${tr("· giorno")} ${st.nDays} · aspettativa ${starsTxt(ap.expStars)}${ap.expNote?` · <i>"${esc(ap.expNote)}"</i>`:""}</div>
    <div class="mtools"><button class="btn small" onclick="endPeriod(${ap.id})">${tr("Chiudi")} ${periodLabel(ap)}</button>
    <button title="${tr("Apri")}" class="btn ghost small" onclick="editPeriod(${ap.id})">${ic("pencil",15)}</button>${forIo?`
    <button class="btn ${S.ui.vacanza?"warn":"ghost"} small" onclick="toggleVacanza()">${S.ui.vacanza?tr("Fine vacanza"):tr("Vacanza")}</button>`:""}</div>${forIo?`
    ${tr("In vacanza deficit e serie sono sospesi: l'app resta un semplice diario.")}`:""}`;
  }else{
    h+=`${hint2(tr("Nessun periodo aperto. Aprine uno per raggruppare i dati:"),tr("Saprai sempre da quando è iniziato e potrai confrontare aspettativa, sensazione finale e comportamento reale."))}
    <div class="mtools"><button class="btn small" onclick="startPeriod('dieta')">${tr("Dieta")} ${nextPeriodN("dieta")}</button>
    <button class="btn ghost small" onclick="startPeriod('libero')">${tr("Libero")} ${nextPeriodN("libero")}</button>${forIo?`
    <button class="btn ${S.ui.vacanza?"warn":"ghost"} small" onclick="toggleVacanza()">${S.ui.vacanza?tr("Fine vacanza"):tr("Vacanza")}</button>`:""}</div>
    ${forIo?tr("In vacanza deficit e serie sono sospesi: l'app resta un semplice diario."):""}`;}
  if(!forIo){ // in Storico: lista completa con metriche e valutazione AI
    const closed=S.periods.filter(p=>p.end).slice().reverse();
    closed.forEach(p=>{const st=periodStats(p);
      h+=`<div style="border-top:1px solid var(--linea);margin-top:12px;padding-top:8px">
      <b>${periodLabel(p)}</b> <span style="color:var(--grigio);font-size:13px">${p.start} → ${p.end} (${st.nDays} gg)</span>
      <div class="hint" style="margin-top:4px"> Aspettativa: ${starsTxt(p.expStars)}${p.expNote?` · <i>"${esc(p.expNote)}"</i>`:""}<br>
       Sensazione finale: ${starsTxt(p.endStars)}${p.endNote?` · <i>"${esc(p.endNote)}"</i>`:""}<br>
      ${p.aiStars?` Valutazione AI: ${starsTxt(p.aiStars)}`:` ${tr("Valutazione AI: non ancora richiesta")}`}</div>
      ${p.aiText?`<div class="hint" style="background:var(--cardbg,#F5F5F5);border-radius:8px;padding:8px;margin-top:4px">${esc(p.aiText)}</div>`:""}
      <div class="hint" style="margin-top:4px"> ${st.nDone} ${tr("giorni tracciati ·")} ${st.avgEat} kcal medie · ${st.avgProt}g prot · ${st.avgFib}g fibre · deficit medio ${st.avgDef} · ${st.workouts} allenamenti${st.dW!=null?` · peso ${st.dW>0?"+":""}${st.dW} kg`:""}</div>
      <div class="mtools" style="margin-top:8px">
      <button class="btn ghost small" onclick="aiRatePeriod(${p.id})">${p.aiStars?"Rivaluta":"Valutazione AI"}</button>
      <button class="btn ghost small" onclick="analyzePeriod(${p.id})">Analizza</button>
      <button title="${tr("Apri")}" class="btn ghost small" onclick="editPeriod(${p.id})">${ic("pencil",15)}</button>
      <button title="${tr("Apri")}" class="btn ghost small" onclick="delPeriod(${p.id})">${ic("trash",15)}</button></div></div>`;});
    if(!closed.length&&!ap)h+=`<div class="hint" style="margin-top:8px">${""}</div>`;
  }
  h+=`</div>`;return h;}

/* ═══ Riepilogo esteso v5: scorri TUTTA la storia (giorni/settimane/mesi)
   dentro un riquadro a scorrimento verticale, senza tabelle infinite. ═══ */
let RECAP={mode:"settimana"};
window.setRecapMode=(m)=>{RECAP.mode=m;render("storico");};
/* ═══ TABELLONE: esportazione completa di un periodo ═══════════════
   Una riga per giorno con TUTTO ciò che è stato inserito o calcolato:
   pianificato vs mangiato, macro completi, sport, sonno/relax/umore,
   acqua, evento del giorno, periodo di dieta, azioni compiute
   (ribilanciamento, recupero, spostamenti) e conteggio dei pasti.
   Serve sia all'utente sia all'AI per l'analisi dei pattern. */
function periodOfDate(dISO){
  const p=(S.periods||[]).find(x=>dISO>=x.start&&(!x.end||dISO<=x.end));
  return p?periodLabel(p):"";}
const EXPORT_COLS=[
  ["data","date"],["giorno",d=>new Date(d.date+"T12:00:00").toLocaleDateString(dataLoc(),{weekday:"long"})],
  ["periodo",d=>periodOfDate(d.date)],
  ["evento",d=>(S.dayEvents||{})[d.date]||""],
  ["giornata_particolare",d=>d.hard?"si":"no"],
  ["kcal_piano","planK"],["kcal_mangiate","eat"],["kcal_scostamento",d=>(d.planK?d.eat-d.planK:"")],
  ["prot_piano","planP"],["prot_mangiate","prot"],["prot_scostamento",d=>(d.planP?d.prot-d.planP:"")],
  ["carbo_piano","planC"],["carbo_mangiati","c"],
  ["grassi_piano","planF"],["grassi_mangiati","f"],
  ["fibre_piano","planFib"],["fibre_mangiate","fib"],
  ["zuccheri_piano","planZ"],["zuccheri_mangiati","z"],
  ["fabbisogno_tdee","tdee"],["kcal_sport","burn"],["deficit","def"],
  ["n_allenamenti","workoutN"],["allenamenti",d=>(d.workouts||[]).join(" + ")],
  ["sonno","sleep"],["relax","relax"],["umore","feel"],["acqua_bicchieri","water"],
  ["pasti_totali","mealsTot"],["pasti_spuntati","mealsDone"],["pasti_saltati","mealsSkip"],
  ["extra_n","extrasN"],["extra_kcal","sgarri"],
  ["pasti_spostati","moved"],["ribilanciato",d=>d.rebalanced?"si":"no"],["kcal_recuperate","recovered"],
  ["giornata_completa",d=>d.completed?"si":"no"],
  ["fame_media","hungerAvg"],["ciclo_fase_luteale",d=>d.cycle?"si":"no"],["allattamento",d=>d.lact||"no"],["kcal_fisiologia","physK"],
  ["nota","note"]
];
function exportRows(from,to){
  return flattenDiet().filter(d=>(!from||d.date>=from)&&(!to||d.date<=to))
    .map(d=>EXPORT_COLS.map(([,g])=>{const v=(typeof g==="function")?g(d):d[g];
      return (v==null||v==="")?(typeof g==="function"?v||"":0):v;}));}
function exportCSV(from,to){
  const head=EXPORT_COLS.map(c=>c[0]).join(";");
  const body=exportRows(from,to).map(r=>r.map(v=>{
    const t=String(v).replace(/"/g,"'");return /[;\n]/.test(t)?'"'+t+'"':t;}).join(";"));
  return [head].concat(body).join("\n");}
function exportRange(){
  const f=document.getElementById("expFrom"),t=document.getElementById("expTo");
  return {from:(f&&f.value)||"",to:(t&&t.value)||""};}
window.doExportCSV=()=>{const{from,to}=exportRange();
  const rows=exportRows(from,to);if(!rows.length)return dlgAlert(tr("Nessun giorno tracciato nel periodo scelto."));
  dlFile("nutry_"+(from||"inizio")+"_"+(to||"oggi")+".csv","text/csv;charset=utf-8","\uFEFF"+exportCSV(from,to));};
/* Esportazioni JSON e Copia rimosse: restano il CSV (che si apre in
   Excel e Fogli) e l'analisi AI, che coprono i due usi veri. */
function dlFile(name,type,content){
  busy("Preparo il file…");
  const b=new Blob([content],{type}),u=URL.createObjectURL(b);
  const a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(u);a.remove();busyOff();toast(tr("Download avviato: {f}",{f:name}));},600);}
window.aiPatterns=async()=>{ // analisi dei pattern sul tabellone
  if(!aiOn())return aiFail(new Error("nokey"));
  const{from,to}=exportRange();const rows=exportRows(from,to);
  if(rows.length<7)return dlgAlert(tr("Servono almeno 7 giorni tracciati nel periodo per cercare pattern sensati."));
  const box=document.getElementById("expOut");box.style.display="block";box.textContent="Cerco i pattern nel periodo…";
  try{
    const t=await aiAsk('Sei un analista di dati nutrizionali. Questa è la tabella giornaliera completa (separatore ;) di una persona a dieta. '+rulesForAI()+' Analizza: (1) rapporto tra sonno/relax/umore e calorie mangiate o extra; (2) giorni della settimana critici; (3) effetto degli allenamenti sul deficit e sulle scelte alimentari; (4) se gli scostamenti dal piano seguono uno schema (es. sempre a cena, sempre il venerdì); (5) qualità dei macro (proteine, fibre, zuccheri) e loro andamento; (6) effetto di eventi e giornate particolari. Concludi con 3 azioni concrete e realistiche. Niente markdown, testo semplice, massimo 350 parole.\n\n'+exportCSV(from,to));
    box.textContent=t;
  }catch(e){box.textContent="";aiFail(e);}};
/* ═══ REGOLE DEL SISTEMA ═══════════════════════════════════════════
   Tutti i numeri che governano calcoli e proposte AI, in un posto solo e
   modificabili. In futuro questa sezione sarà riservata al professionista;
   per ora è aperta perché il sistema è in prova. */
/* ═══════════════════════════════════════════════════════════════
   IL PERCORSO GUIDATO È UNO SOLO — 25/08/2026

   Qui vivevano i nove passi del percorso vecchio («benvenuto»):
   ~440 righe fra ONB_STEPS, renderBenvenuto, onbSave, il racconto
   con le bolle e l'editor degli allenamenti. Il founder ha deciso:
   «l'onboarding deve essere solo quello nuovo» — e il nuovo (onb2,
   25_onboarding_flow) fa tutte le stesse cose, meglio: 30+ schermate
   una domanda alla volta, racconto a voce e per iscritto con schema
   vincolato, piano che si scrive in sottofondo mentre si risponde.

   Due percorsi vivi erano un doppio costo: ogni regola nuova andava
   scritta due volte o — peggio — una sola, e i due percorsi
   divergevano. La schermata-muro della privacy, tolta dal nuovo, nel
   vecchio c'era ancora.

   Chi aveva uno stato a metà del percorso vecchio viene portato nel
   nuovo dal router (16_7): non si perde niente, perché i dati del
   profilo restano e qui sotto si travasano nelle risposte. */
window.restartOnboarding=async()=>{
  if(!await dlgConfirm(tr("Rifaccio il percorso guidato?\n\nTrovi le risposte già compilate: cambia solo quello che serve e vai avanti. Alla fine il piano si riscrive con le nuove impostazioni.")))return;
  /* Chi rifà il percorso vuole rivedere anche le spiegazioni. */
  S.guide=S.guide||{};S.guide.seen={};
  const o=onb2Stato();
  o.done=false;o.step=0;o.maxVisto=0;o.ris=o.ris||{};
  /* La semina: chi arriva dal percorso vecchio non ha risposte in
     onb2, ma ha un profilo vero. I numeri si travasano, così la
     promessa «campi già compilati» vale anche per lui. */
  if(!o.ris.bio&&S.profile&&S.profile.h){
    let eta=null;
    try{eta=Math.floor((Date.now()-new Date(S.profile.dob).getTime())/31557600000)||null;}catch(e){}
    o.ris.bio={nome:S.profile.name||"",gen:S.profile.gender||"m",
               dob:S.profile.dob||"",eta:eta,h:S.profile.h,w:S.profile.w};}
  S.onboard.done=false;S.onboard.step=0;onb2Salva();save();show("onb2");};

window.regTab=(v)=>{S.ui.regTab=v;save();render("regole");};
function renderRegole(){const el=document.getElementById("pg-regole");
  /* Tre schede per non perdersi: le scelte dell'utente (modificabili qui
     con effetto ovunque), le regole dell'AI con la loro verifica, e le
     formule. Nessuna sezione è stata toccata: cambia solo cosa è in vista. */
  const tb=S.ui.regTab||"scelte";
  el.dataset.rt=tb;
  const tabBtn=(v,txt)=>`<button role="tab" id="rt-${v}" aria-selected="${tb===v}" aria-controls="rp-${v}" tabindex="${tb===v?0:-1}" class="${tb===v?"on":""}" onclick="regTab('${v}')">${txt}</button>`;
  let h=`<div class="rtabs" role="tablist" aria-label="${tr("Sezioni delle regole")}">
    ${tabBtn("scelte",tr("Le tue scelte"))}${tabBtn("ai",tr("Regole AI"))}${tabBtn("formule","Formule e calcoli")}
  </div>`;
  h+=rulesCardHTML();
  h+=`<div class="regsec" data-rt="scelte">`+dietCardHTML()+`</div>`;
  el.innerHTML=h;}
function rulesCardHTML(){
  const p=S.profile,r=rulesSnapshot();
  const num=(id,val,step,min,max,suf)=>`<input class="rv" type="number" id="${id}" value="${val}"${step?` step="${step}"`:""}${min!=null?` min="${min}"`:""}${max!=null?` max="${max}"`:""}>${suf?`<span class="ru">${suf}</span>`:""}`;
  const sel=(id,val,opts)=>`<select class="rv" id="${id}">`+opts.map(o=>`<option value="${o[0]}" ${String(val)===String(o[0])?"selected":""}>${o[1]}</option>`).join("")+`</select>`;
  const row=(k,desc,ctrl)=>`<tr><td>${k}</td><td class="rd">${desc}</td><td class="rc">${ctrl}</td></tr>`;
  const out=(v)=>`<span class="rout">${v}</span>`;
  return `
  <div class="regsec" data-rt="ai">
  <div class="card"><h2>${tr("Come deve ragionare l'AI")}</h2>
  ${hint2(tr("Le istruzioni che l'AI riceve a ogni richiesta. Se il piano non ti convince, la causa è quasi sempre qui."),tr("Cambia queste righe e il piano cambia: non serve toccare altro. Con «Ripristina» torni a quelle di partenza. Il pulsante «Vedi» mostra il testo esatto che parte, con il conteggio dei caratteri."))}
  <label>${tr("Regole di qualità nutrizionale")}</label>
  <textarea id="rNutri" rows="10" style="line-height:1.45">${esc(nutriRules())}</textarea>
  <div class="mtools">
    <button class="btn small" onclick="nutriSave()">${tr("Salva")}</button>
    <button class="btn ghost small" onclick="nutriReset()">${tr("Ripristina")}</button>
  </div>
  <div class="aibox" aria-live="polite" id="promptOut" style="display:none"></div>
  <label>${tr("Regole tue, in parole tue")}</label>
  <textarea id="rCustom" rows="4" placeholder="${tr("es. «niente carne rossa più di una volta a settimana», «cena sempre leggera»")}">${esc((S.rules&&S.rules.custom)||"")}</textarea>
  <div class="mtools"><button class="btn small" onclick="saveCustomRules()">${tr("Salva le mie regole")}</button></div>
  </div>

  <div class="card"><details class="gdet"><summary><h2>${tr("Cosa sa di te l'AI")}</h2><span class="gdet-arrow">▾</span></summary><div class="gdet-body">
  ${hint2(tr("Questo è il testo esatto che accompagna ogni richiesta all'AI, composto adesso dai tuoi dati:"),tr("Regole, intolleranze, divieti, stati del corpo, preferenze. Cambi qualcosa nell'app e cambia anche qui. Niente parte verso l'AI oltre a questo e alla domanda del momento."))}
  <div style="white-space:pre-wrap;font-size:14.5px;line-height:1.55;color:var(--grigio);border:1px solid var(--linea);border-radius:12px;padding:12px;margin-top:8px;max-height:340px;overflow:auto">${esc(rulesForAI())}</div>
  ${(function(){const h=S.aiHealth||{};const ks=Object.keys(h);if(!ks.length)return "";
    const rotti=ks.filter(k=>h[k].ko>0);
    return `<div class="hint" style="margin-top:8px"><b>${tr("Salute del motore:")}</b> `+ks.map(k=>k+" "+h[k].ok+"/"+(h[k].ok+h[k].ko)).join(" · ")+(rotti.length?` — risposte malformate su: ${rotti.join(", ")} ${tr("(di solito è passeggero)")}`:" — tutte le risposte in formato corretto")+`</div>`;})()}
  </div></details></div>
  <div class="card"><h2>Linee guida OMS</h2>
  ${hint2(tr("La base nutrizionale del piano: le raccomandazioni dell'Organizzazione Mondiale della Sanità, con i numeri."),tr("Sono il riferimento, non un dogma: le tue condizioni di salute e le intolleranze hanno sempre la precedenza. Si modificano nel riquadro «Come deve ragionare l'AI» qui sopra."))}
  <div class="omsgrid">
    ${[[tr("Frutta e verdura"),tr("almeno 400 g al giorno"),tr("5 porzioni, patate escluse")],
       [tr("Zuccheri liberi"),tr("sotto il 10%"),tr("Delle calorie · meglio sotto il 5%")],
       [tr("Grassi totali"),tr("sotto il 30%"),tr("delle calorie")],
       [tr("Grassi saturi"),tr("sotto il 10%"),tr("trans sotto l'1%")],
       [tr("Sale"),tr("sotto 5 g"),tr("al giorno, meglio iodato")],
       [tr("Fibra"),tr("almeno 25 g"),tr("al giorno")]].map(([t,v,d])=>
      `<div class="omscard"><div class="omsv">${v}</div><div class="omst">${t}</div><div class="omsd">${d}</div></div>`).join("")}
  </div>
  <div class="hint">${trh("Applicate al tuo caso: {v1} kcal al giorno significano max",{v1:dayTargetK()})} <b>${Math.round(dayTargetK()*0.10/4)} g</b> ${tr("di zuccheri liberi, max")} <b>${Math.round(dayTargetK()*0.30/9)} g</b> ${tr("di grassi e almeno")} <b>${dayTargetFib()} g</b> ${tr("di fibra.")}</div>
  </div>

  </div><div class="regsec" data-rt="scelte">
  <div class="card"><h2>Te</h2>
  ${hint2(tr("Come l'app calcola il tuo fabbisogno, a partire dal corpo che hai."),tr("Questi numeri si aggiornano da soli quando cambi peso, attività o stato fisiologico. In verde i risultati calcolati: quelli non si scrivono, si leggono."))}
  <div class="gsec">${tr("Il tuo fabbisogno")}</div>
  <table class="rules">
  ${row("Basale calcolato",tr("Scende quando cali di peso: aggiorna la pesata in Io e il fabbisogno si abbassa da solo."),out(bmr()+" kcal"))}
  ${row(tr("Attività di base"),"Moltiplicatore su lavoro e vita quotidiana, allenamenti esclusi.",
     `<select class="rv" id="rAct" onchange="actSteps(this.value,'rSteps')">`+[["1.2","1.2 · "+tr("molto sedentario")],["1.25","1.25 · "+tr("sedentario−")],["1.3","1.3 · "+tr("sedentario, PC")],["1.35","1.35 · "+tr("poco attivo")],["1.4","1.4 · "+tr("moderatamente attivo")],["1.45","1.45 · "+tr("attivo")],["1.55","1.55 · "+tr("molto attivo")]].map(o=>`<option value="${o[0]}" ${String(p.act)===String(o[0])?"selected":""}>${o[1]}</option>`).join("")+`</select>`)}
  ${row(tr("Passi base"),tr("Passi che fai comunque ogni giorno. Il riferimento è 3.000: sopra o sotto, il fabbisogno si corregge."),num("rSteps",r.passi_base,500,0,null,"passi"))}
  ${row(tr("Fabbisogno totale"),tr("Basale × attività, corretto sui passi base. Gli allenamenti si sommano a parte."),out(r.tdee_calcolato+" kcal"))}
  ${row(tr("Fabbisogno usato per i target"),tr("Fabbisogno meno la prudenza."),out(tdeeTarget()+" kcal"))}
  ${row(tr("Cambio di genere"),tr("Il genere entra in basale, peso ideale e pavimento calorico. Cambiandolo, tutto si ricalcola <b>subito</b>; restano fissi i giorni già iniziati e le grammature del piano (ritarale con Ricalibra)."),out((S.profile.gender==="f"?"donna":"uomo")+" · basale "+bmr()+" kcal · pavimento "+kcalFloorMin()+" kcal"))}
  ${row(tr("Peso di riferimento"),tr("Non il peso attuale: il grasso non richiede proteine, quindi si usa massa magra, peso obiettivo o peso corretto. <b>Nel tuo caso viene da: ")+refWeightWhy()+"</b>."+
    (goalWeightSet()?"":" <button class=\"btn ghost small\" style=\"margin:8px 0 0\" onclick=\"askGoalWeight()\">"+tr("Imposta il peso obiettivo")+"</button>")+tr(" Se preferisci un altro valore, cambia i dati da cui deriva (percentuale di grasso in Io, o peso obiettivo negli Obiettivi)."),out(refWeight()+" kg"))}
  </table>
  <div class="gsec">${tr("Il tuo corpo, giorno per giorno")}</div>
  <table class="rules">
  ${row(tr("Stati fisiologici · come funzionano"),tr("Questi stati <b>cambiano le calorie del giorno</b> e le grammature. Il ciclo scade da solo; gli altri restano attivi <b>finché non li togli</b> da Oggi → Come stai."),out(physDelta()?((physDelta()>0?"+":"")+physDelta()+" "+tr("kcal attivi ora")):tr("nessuno stato attivo")))}
  ${row(tr("Ciclo · durata della fase"),tr("Dopo questi giorni la fase luteale si spegne da sola. Lo standard è <b>7 giorni</b>: la settimana prima del flusso, quella in cui il fabbisogno sale davvero."),num("rCycleDays",cycleDaysMax(),1,3,14,"giorni"))}
  ${row(tr("Ciclo · aumento del metabolismo"),tr("In fase luteale il metabolismo basale sale di qualche punto percentuale. Queste calorie si <b>sommano</b> al fabbisogno: il target cresce, non si riorganizza. Attiva la fase da <b>Oggi → Come stai</b>.")+(cycleDay()?trh(" <b>Attiva ora: giorno {v1} di {v2}, +{v3} kcal.</b>",{v1:cycleDay(),v2:cycleDaysMax(),v3:cycleKcal()}):""),num("rCyclePct",cyclePct(),1,0,15,"%"))}
  ${row("Allattamento esclusivo",tr("Costo energetico della produzione di latte quando il bambino prende solo il tuo latte. Si somma al fabbisogno, e alza anche il pavimento di sicurezza.")+(S.phys.lact==="esclusivo"?" <b>Attivo ora.</b>":""),num("rLactFull",(+S.profile.lactFull||500),10,200,900,"kcal"))}
  ${row("Allattamento parziale",tr("Quando il latte è affiancato da altri alimenti.")+(S.phys.lact==="parziale"?" <b>Attivo ora.</b>":""),num("rLactPart",(+S.profile.lactPart||250),10,100,600,"kcal"))}
  ${row("Gravidanza · 1° trimestre",tr("Calorie aggiuntive nel primo trimestre. In gravidanza il deficit viene <b>sempre</b> sospeso."),num("rPregT1",(+S.profile.pregT1>0?+S.profile.pregT1:70),10,0,600,"kcal"))}
  ${row("Gravidanza · 2° trimestre",tr("Calorie aggiuntive nel secondo trimestre."),num("rPregT2",(+S.profile.pregT2>0?+S.profile.pregT2:260),10,0,600,"kcal"))}
  ${row("Gravidanza · 3° trimestre",tr("Calorie aggiuntive nel terzo trimestre."),num("rPregT3",(+S.profile.pregT3>0?+S.profile.pregT3:450),10,0,600,"kcal"))}
  ${row(tr("Infortunio · taglio del movimento"),tr("Quanto si riduce la quota di fabbisogno dovuta all'<b>attività</b> quando sei fermo per un infortunio. Il metabolismo basale non viene mai toccato.")+(injOn()?" <b>Attivo ora: −"+moveCut()+" kcal.</b>":""),num("rInjPct",injPct(),5,0,90,"%"))}
  ${row(tr("Malattia · taglio del movimento"),tr("Come sopra, ma per i giorni di malattia. In più, finché la malattia è attiva il <b>deficit resta sospeso</b>: si mangia a mantenimento.")+(illOn()?" <b>Attiva ora.</b>":""),num("rIllPct",illPct(),5,0,90,"%"))}
  ${row(tr("Saldo fisiologico di oggi"),tr("Somma di ciò che si aggiunge (ciclo, allattamento, gravidanza) meno ciò che si toglie (movimento ridotto). Riscala le porzioni del piano in proporzione, partendo dalle kcal del tuo piano."),out((physDelta()>0?"+":"")+physDelta()+" kcal"+(physPct(viewIdx())?" · porzioni "+(physPct(viewIdx())>0?"+":"−")+Math.abs(physPct(viewIdx()))+"%":"")))}
  </table></div>

  <div class="card"><h2>${tr("Il tuo obiettivo")}</h2>
  ${hint2(tr("Quanto deficit, con che ritmo, e come si alternano le fasi."),tr("Il deficit non scende mai sotto il minimo calorico, che è calcolato sul tuo basale. Le fasi servono a non restare in deficit troppo a lungo di fila."))}
  <table class="rules">
  ${row("Ritmo e deficit",tr("Il ritmo lo scegli nel percorso guidato; il deficit che ne deriva ha un tetto al 30% del fabbisogno."),out(((typeof pesoNum==="function")?pesoNum(ratePerWeek(),1):ratePerWeek())+trh("{v0}/sett · {v1} kcal/giorno",{v0:" "+((typeof unitaPeso==="function")?unitaPeso():"kg"),v1:deficitTarget()})))}
  ${row(tr("→ Target calorico del piano"),tr("Fabbisogno per i target meno il deficit, mai sotto il minimo."),out(dayTargetK()+" kcal")+(dayTargetK()<bmr()?`<br><small style="color:var(--zafft);font-size:14.5px">${trh("Sotto il basale ({v1}): sostenibile a periodi, con proteine alte",{v1:bmr()})}`:""))}
  ${row(tr("Fasi della dieta"),tr("Deficit e pause di mantenimento si alternano.")+(cycPhase()?trh(" <b>Ora: {v1}, giorno {v2} di {v3}.</b>",{v1:cycPhase(),v2:cycPhaseDay(),v3:cycPhaseLen()}):""),out(Math.round(cycDefDays()/7)+" + "+Math.round(cycMaintDays()/7)+" settimane"))}
  ${row("Allenamenti pianificati",tr("Stimano i tempi dell'obiettivo: non alzano le calorie da mangiare."),out(goalWkTotal()+" a sett. · ~"+wkForecastBurn()+" kcal/g"))}
  </table>
  ${rateCapped()?`<table class="rules"><tr><td colspan="3" class="rfull" style="color:var(--zafft);font-weight:600;background:var(--zaffbg)"> ${trh("{v1}. Per andare più veloce serve il parere di un nutrizionista.",{v1:rateNote()})}</td></tr></table>`:""}
  <div class="mtools" style="margin:12px 0 4px"><button class="btn small" onclick="restartOnboarding()">${tr("Modifica nel percorso guidato ›")}</button></div>
  ${tr("Peso obiettivo, ritmo, fasi e allenamenti si impostano lì: una fonte sola, niente doppioni.")}
  <details class="gdet" style="margin-top:12px"><summary><h2 style="font-size:14.5px">Regolazioni fini</h2><span class="gdet-arrow">▾</span></summary><div class="gdet-body">
  <table class="rules">
  ${row(tr("Come fissare il deficit"),tr("<b>Percentuale</b>: mangi una quota del fabbisogno (20% = l'80% di quello che consumi). <b>Ritmo</b>: parti dai chili a settimana desiderati."),
     sel("rDefMode",defMode(),[["pct",tr("Percentuale del fabbisogno")],["ritmo",tr("Chili a settimana")]]))}
  ${row(tr("Percentuale di deficit"),tr("Usata in modalità percentuale. Fino al 20% è tranquilla; oltre il 25% è una fase spinta, meglio se seguita da un professionista."),num("rDefPct",defPct(),1,5,30,"%"))}
  ${row("Minimo calorico",trh("Il target non scende mai sotto questa soglia. Non è un numero fisso per uomini e donne: si adatta al <b>tuo</b> corpo — ora è {v1}. Stare sotto il <i>basale</i> è normale quando c'è grasso da consumare; stare sotto questa soglia no.",{v1:kcalFloorWhy()}),num("rKcalMin",kcalFloorMin(),50,1000,null,"kcal"))}
  ${row(tr("Obiettivo settimanale"),tr("Allenamenti da fare in una settimana. Il valore parte da quanto hai impostato per singolo sport e resta modificabile qui."),num("rGoalWk",goalWkTotal(),1,0,14,"a sett."))}
  </table></div></details>
  </div>

  </div><div class="regsec" data-rt="formule">
  <div class="card"><h2>Nutrizione</h2>
  ${hint2(tr("Proteine e regole dei pasti: quanto ti serve e come si ribilancia."),tr("Le proteine si calcolano sul peso di riferimento, non su quello della bilancia. Il minimo per pasto impedisce che un ribilanciamento renda un pasto ridicolo."))}
  <div class="gsec">${tr("Proteine")}</div>
  <table class="rules">
  ${row(tr("Grammi per kg"),tr("Riferimenti: sedentari 0,8–1,0 · attivi e mantenimento 1,2–1,6 (media 1,3) · aumento massa 1,6–2,2. Se non lo tocchi, l'app usa il valore adatto al tuo obiettivo e alla tua attività."),num("rProtKg",r.obiettivo_proteine_g_kg,.1,.8,3,"g/kg"))}
  ${row(tr("Proteine · quale peso"),tr("Le proteine si calcolano su <b>")+((typeof pesoTxt==="function")?pesoTxt(refWeight(),1):refWeight()+" kg")+"</b> — "+refWeightWhy()+tr(" — non sul peso della bilancia: il grasso corporeo non richiede proteine, quindi in sovrappeso il peso pieno gonfierebbe il numero. Standard: <b>1,5 g/kg</b>."),out(dayTargetP()+trh(" g al giorno · {v1} g/kg",{v1:(S.profile.protKg!=null?+S.profile.protKg:protKgAuto())})))}
  ${row(tr("→ Target proteico del piano"),tr("Peso di riferimento × grammi per kg."),out(dayTargetP()+" g"))}
  ${row(tr("Proteine intoccabili"),tr("Ribilanciamenti e recuperi riducono solo carboidrati e grassi."),
     sel("rProtLock",p.protLock!==false?"si":"no",[["si",tr("Sì, mai ridotte")],["no","No, riducibili"]]))}
  </table>
  <div class="gsec">${tr("Pasti e ribilanciamento")}</div>
  <table class="rules">
  ${row(tr("Minimo per pasto"),tr("Nessuna proposta può portare un pasto sotto questa soglia, e nessun pasto viene eliminato."),num("rMinMeal",r.kcal_minime_per_pasto,25,100,null,"kcal"))}
  ${row("Solo valori reali",tr("Per ridurre si abbassano prima le grammature, poi si sostituiscono ingredienti. Con <b>Sì</b> le proposte che cambiano solo i numeri vengono scartate."),
     sel("rReal",p.realOnly!==false?"si":"no",[["si",tr("Sì, controlla e scarta")],["no","No, accetta comunque"]]))}
  </table></div>

  
  <div class="card"><h2>Formule</h2>
  ${hint2(tr("La meccanica fine. <b>Non serve toccarla</b>: l'app funziona bene così."),tr("Mettici mano solo se sai cosa stai facendo o se te lo indica un professionista."))}
  <div class="gsec">${tr("Come si calcola il fabbisogno")}</div>
  <table class="rules">
  ${row(tr("Formula del basale"),tr("Come si calcola il metabolismo a riposo. <b>Auto</b> usa la massa magra se conosci la percentuale di grasso, altrimenti Mifflin."),
     sel("rBmrF",bmrFormula(),[["auto","Auto (consigliata)"],["mifflin","Mifflin-St Jeor"],["katch","Katch-McArdle"],["harris","Harris-Benedict"]]))}
  ${row(tr("Prudenza sul fabbisogno"),tr("Il moltiplicatore di attività è una stima: se i tuoi giorni sono più fermi di così, il fabbisogno risulta gonfiato. Questa percentuale lo abbassa <b>solo per il calcolo dei target</b>, senza toccare deficit e storico."),num("rPrud",prudence(),1,0,20,"%"))}
  ${row("Verifica sui tuoi dati",tr("Fabbisogno ricavato da quanto hai mangiato e da come è cambiato il peso: è una misura, non una stima."),
     (function(){const rr=tdeeReal();return rr
       ?out(rr.tdee+" kcal")+`<br><button class="btn ghost small" style="margin-top:8px" onclick="applyTdeeReal()">Allinea</button>`
       :`<span class="rout" style="color:var(--grigio);font-weight:500">${tr("servono 2 settimane")}</span>`;})())}
  </table>
  <div class="gsec">${tr("Come si contano gli allenamenti")}</div>
  <table class="rules">
  ${row(tr("Modo di calcolo"),tr("<b>Netto</b> = (MET × intensità − 1) × peso × ore: toglie il metabolismo a riposo, già incluso nel fabbisogno. <b>Lordo</b> non lo toglie e restituisce numeri più alti."),
     sel("rMet",metMode(),[["netto","Netto (consigliato)"],["lordo","Lordo"]]))}
  ${row(tr("Intensità bassa"),tr("Moltiplicatore applicato al MET dichiarato dello sport."),num("rIntB",INT.bassa,.05,.3,2,"×"))}
  ${row(tr("Intensità media"),"",num("rIntM",INT.media,.05,.3,2,"×"))}
  ${row(tr("Intensità alta"),"",num("rIntA",INT.alta,.05,.3,2,"×"))}
  ${row("Verifica",trh("Squash 45 minuti a bassa intensità con il tuo peso attuale ({v1}).",{v1:((typeof pesoTxt==="function")?pesoTxt(p.w,1):p.w+" kg")}),out(workoutBurnFor("Squash",45,"bassa",p.w)+" kcal"))}
  </table>
  <div class="gsec">${tr("Recupero degli sfori")}</div>
  <table class="rules">
  ${row("Soglia · percentuale",tr("Sotto questa quota della giornata lo sforo non viene proposto: è dentro l'errore di stima delle porzioni."),num("rRgpPct",r.soglia_recupero_pct,1,0,30,"%"))}
  ${row("Soglia · minimo",tr("Vale la più alta fra percentuale e minimo."),num("rRgpMin",r.soglia_recupero_min_kcal,25,0,null,"kcal"))}
  ${row("Tetto · percentuale",tr("Massimo taglio in una giornata, in quota del pianificato."),num("rRgpCap",r.recupero_max_pct_giorno,5,5,50,"%"))}
  ${row("Tetto · massimo",tr("Vale il più basso fra percentuale e massimo. Il resto slitta ai giorni successivi."),num("rRgpCapMax",r.recupero_max_kcal_giorno,50,50,null,"kcal"))}
  ${row(tr("Giorni recuperabili"),tr("Quanti giorni indietro possono comparire nel menu Recupero."),num("rRgpDays",(+p.rgpDays||5),1,1,7,"giorni"))}
  </table></div>
  </div>
  `;}

window.nutriSave=()=>{
  const e=document.getElementById("rNutri");if(!e)return;
  S.rules=S.rules||{};S.rules.nutri=e.value.trim();save();
  toast(tr("Regole nutrizionali salvate ✓ — valgono dalla prossima richiesta"));};
window.nutriReset=async()=>{
  if(!await dlgConfirm(tr("Torno alle regole nutrizionali di partenza?\n\nQuelle che hai scritto andranno perse."),{ok:tr("Ripristina"),ko:trBtn("Annulla")}))return;
  S.rules=S.rules||{};delete S.rules.nutri;save();render("regole");toast(tr("Regole ripristinate"));};
window.saveCustomRules=()=>{
  const e=document.getElementById("rCustom");if(!e)return;
  S.rules=S.rules||{};S.rules.custom=e.value.trim();save();
  toast(e.value.trim()?tr("Le tue regole sono salvate ✓"):tr("Regole personali rimosse"));};
/* ── «IL TESTO ESATTO» NE MOSTRAVA UNO SOLO (audit 27/08) ─────────
   La presentazione dice: «Dentro l'app leggi il testo esatto che
   accompagna OGNI richiesta all'AI. Non devi fidarti: verifichi.»

   Qui si mostrava `rulesForAI()`, che è il testo delle richieste
   BREVI — ribilanci, stime, strumenti. Il piano non usa quella
   funzione: usa `rulesForPlan()` più il contesto della persona,
   costruito a parte. Chi «verificava» leggeva quindi un testo diverso
   da quello che parte per la richiesta più importante che l'app fa —
   e più ricco, il che è il modo peggiore di sbagliare: prometti una
   verifica e la fai fallire per eccesso di fiducia.

   Adesso si mostrano tutti e due, uno sotto l'altro, con scritto a
   cosa serve ognuno. Sono due richieste diverse: è giusto che i testi
   siano due, non che se ne veda uno solo. */
window.promptShow=()=>{
  const el=document.getElementById("promptOut");if(!el)return;
  if(el.style.display==="block"){el.style.display="none";return;}
  let t="",p="";
  try{t=rulesForAI();}catch(e){t="(impossibile generare: "+e.message+")";}
  try{p=((typeof dietStr==="function")?dietStr()+" ":"")+rulesForPlan()
        +((typeof rigaPasto==="function")?rigaPasto():"");}
  catch(e){p="(impossibile generare: "+e.message+")";}
  const blocco=(titolo,testo,nota)=>
    '<div style="font-weight:700;font-size:12.5px;margin:12px 0 4px">'+esc(titolo)+'</div>'+
    '<div style="font-size:11.5px;line-height:1.5;white-space:pre-wrap">'+esc(testo)+'</div>'+
    '<div class="hint" style="margin-top:8px">'+esc(testo.length+" caratteri. "+nota)+'</div>';
  el.style.display="block";
  el.innerHTML=
    blocco(tr("Le richieste brevi"),t,
      tr("Accompagna ribilanciamenti, stime, alternative, spesa e strumenti."))+
    blocco(tr("La generazione del piano"),p,
      tr("È un'altra richiesta e ha un altro testo: le linee guida ci sono in forma breve, perché una settimana intera è già una risposta lunga."));};
/* Segnalazione allo sviluppatore: apre il client di posta (Gmail sul telefono)
   con destinatario, oggetto e corpo già compilati. */
const DEV_MAIL="info@nuviahealth.app"   /* la casella del progetto, non quella personale */;
/* ═══ PIANI PRECONFEZIONATI ═══════════════════════════════════════
   Un codice carica un piano già pronto. 00000000 è la dieta standard
   con cui è nata Nuvia (mediterranea, cinque pasti, mensa il martedì
   e il giovedì): utile per partire subito o per tornare all'origine. */
const PLAN_CODES={
  "00000000":{name:"Dieta standard Nuvia",desc:"Il piano originale: mediterraneo, cinque pasti al giorno, pranzo in mensa il martedì e il giovedì.",get:()=>JSON.parse(JSON.stringify(BASE_PLAN))}
};
window.loadPlanCode=async (fromOnboard)=>{
  const el=document.getElementById(fromOnboard?"obCode":"planCode");
  const code=((el&&el.value)||"").trim();
  if(!code)return dlgAlert(tr("Inserisci il codice del piano."));
  const P=PLAN_CODES[code];
  if(!P)return dlgAlert(tr("Codice non riconosciuto.\n\nSe non hai un codice, genera il piano con l'AI o scrivilo tu: sono le due strade normali."));
  const prev=P.get();
  const kd=prev.map(d=>(d.meals||[]).reduce((a,m)=>a+((m.o[0]&&m.o[0].k)||0),0));
  const avg=Math.round(kd.reduce((a,b)=>a+b,0)/(kd.length||1));
  if(!await dlgConfirm(tr("Carico «{n}»?",{n:P.name})+"\n\n"+P.desc+"\n\n"+tr("Media del piano: ~{a} kcal al giorno (da {mn} a {mx} kcal).",{a:avg,mn:Math.min.apply(null,kd),mx:Math.max.apply(null,kd)})+"\n\n"+tr("Sostituisce il piano attuale. Le settimane già archiviate restano intatte.")))return;
  snapSave("prima di: codice piano");
  S.customPlan=P.get();PLAN=S.customPlan;S.permMeals={};S.week=freshWeek();S.planW=S.profile.w;
  S.customShop=null;S.shop={};      /* la spesa riparte dagli ingredienti del nuovo piano */
  if(aiOn())setTimeout(()=>{try{genShop(true);}catch(e){}},400);
  if(fromOnboard)S.onboard.done=true;
  save();renderHeader();show("piano");toast(tr("Piano «{n}» caricato ✓",{n:P.name}));};
/* Pulizia selettiva: azzera solo le voci scelte, opzionalmente limitandosi a
   un intervallo di date. Serve dopo un imprevisto, per ripartire puliti senza
   buttare via profilo, piano e impostazioni. */
window.cleanupRange=(kind)=>{
  const f=document.getElementById("clFrom"),t=document.getElementById("clTo");
  const d=new Date();d.setHours(12,0,0,0);
  /* iso() locale, NON toISOString(): il primo del mese nasce a mezzanotte
     locale, e convertito in UTC diventava il 31 del mese prima — la pulizia
     «questo mese» avrebbe cancellato anche quel giorno. */
  const iso2=x=>iso(x);
  let from="",to="";
  if(kind==="oggi"){from=to=iso2(d);}
  else if(kind==="settimana"){const m=new Date(d);m.setDate(d.getDate()-((d.getDay()+6)%7));from=iso2(m);to=iso2(d);}
  else if(kind==="mese"){from=iso2(new Date(d.getFullYear(),d.getMonth(),1));to=iso2(d);}
  else {from="";to="";}   // tutto
  if(f)f.value=from;if(t)t.value=to;
  const lb=document.getElementById("clRangeLbl");
  if(lb)lb.textContent=from?("dal "+from.split("-").reverse().join("/")+" al "+to.split("-").reverse().join("/")):"tutto lo storico";
  document.querySelectorAll(".clchip").forEach(b=>b.classList.toggle("on",b.dataset.k===kind));};
window.cleanupRun=async ()=>{
  const g=id=>document.getElementById(id),ck=id=>!!(g(id)&&g(id).checked);
  const from=(g("clFrom")&&g("clFrom").value)||"",to=(g("clTo")&&g("clTo").value)||"";
  const inRange=d=>{d=String(d||"").slice(0,10);return (!from||d>=from)&&(!to||d<=to);};
  const sel=[];
  if(ck("clStreak"))sel.push("serie ");
  if(ck("clPeriods"))sel.push("periodi");
  if(ck("clWeights"))sel.push("pesate");
  if(ck("clWeek"))sel.push("settimana in corso");
  if(ck("clHistory"))sel.push("settimane archiviate");
  if(ck("clEvents"))sel.push("eventi");
  if(ck("clShop"))sel.push("lista della spesa");
  if(ck("clRecipes"))sel.push("piatti salvati");
  if(!sel.length)return dlgAlert(tr("Seleziona almeno una voce da azzerare."));
  const range="\n\n"+((from||to)?tr("Limitato al periodo {a} → {b}",{a:from||tr("inizio"),b:to||tr("oggi")}):tr("Su tutto lo storico."));
  if(!await dlgConfirm(tr("Azzero: {v}",{v:sel.join(", ")})+range+"\n\n"+tr("Profilo, piano, regole e caratteristiche restano intatti.\nViene creata un'istantanea prima di procedere.")))return;
  snapSave("prima della pulizia");
  // conteggi PRIMA, per poter dire davvero che cosa è stato rimosso
  const b={streak:(S.streak&&S.streak.count)||0,periodi:(S.periods||[]).length,
    pesate:(S.profile.weights||[]).length,storico:(S.history||[]).length,
    eventi:Object.keys(S.dayEvents||{}).length,
    spunte:S.week.days.reduce((a,d)=>a+(d.meals||[]).filter(m=>m.done||m.skip).length,0),
    extra:S.week.days.reduce((a,d)=>a+(d.extras||[]).length,0),
    sport:S.week.days.reduce((a,d)=>a+(d.workouts||[]).length,0),
    spesa:(S.customShop||[]).length};
  if(ck("clStreak"))S.streak={count:0,best:0,last:""};
  if(ck("clPeriods"))S.periods=(from||to)?(S.periods||[]).filter(p=>!inRange(p.start)):[];
  if(ck("clWeights"))S.profile.weights=(S.profile.weights||[]).filter(x=>!inRange(x.d));
  if(ck("clWeek"))S.week=freshWeek();
  if(ck("clHistory"))S.history=(from||to)?(S.history||[]).filter(w=>!inRange(w.from)):[];
  if(ck("clEvents")){
    if(from||to){Object.keys(S.dayEvents||{}).forEach(k=>{if(inRange(k))delete S.dayEvents[k];});
      Object.keys(S.hardDays||{}).forEach(k=>{if(inRange(k))delete S.hardDays[k];});}
    else {S.dayEvents={};S.hardDays={};}}
  if(ck("clShop")){S.shop={};S.customShop=null;}
  /* i piatti creati: con un intervallo si tolgono solo quelli salvati in quei
     giorni, senza intervallo si svuota tutto il repertorio */
  if(ck("clRecipes")){
    const pre=(S.recipes||[]).length;
    S.recipes=(from||to)?(S.recipes||[]).filter(r=>!(r.at&&inRange(String(r.at).slice(0,10)))):[];
    b.piatti=pre-(S.recipes||[]).length;}
  save();
  const a={streak:(S.streak&&S.streak.count)||0,periodi:(S.periods||[]).length,
    pesate:(S.profile.weights||[]).length,storico:(S.history||[]).length,
    eventi:Object.keys(S.dayEvents||{}).length,
    spunte:S.week.days.reduce((x,d)=>x+(d.meals||[]).filter(m=>m.done||m.skip).length,0),
    extra:S.week.days.reduce((x,d)=>x+(d.extras||[]).length,0),
    sport:S.week.days.reduce((x,d)=>x+(d.workouts||[]).length,0),
    spesa:(S.customShop||[]).length};
  const rep=[];
  const dif=(lbl,k,suf)=>{const n=b[k]-a[k];if(n>0)rep.push("• "+tr(lbl)+": "+n+(suf||""));};
  if(ck("clStreak")&&b.streak)rep.push("• "+tr("serie azzerata (era {n})",{n:b.streak}));
  dif("periodi rimossi","periodi");
  dif("pesate rimosse","pesate");
  dif("settimane archiviate rimosse","storico");
  dif("eventi rimossi","eventi");
  dif("spunte azzerate","spunte");
  dif("extra rimossi","extra");
  dif("allenamenti rimossi","sport");
  if(ck("clShop")&&b.spesa)rep.push("• "+tr("lista della spesa svuotata"));
  if(ck("clRecipes"))rep.push("• "+tr("piatti salvati eliminati: {n}",{n:(b.piatti||0)}));
  // ridisegna TUTTO, intestazione compresa: la fiamma vive lì
  renderHeader();render(cur);
  dlgAlert(rep.length
    ? tr("Pulizia completata ✓")+"\n\n"+rep.join("\n")+"\n\n"+tr("Se qualcosa non torna, recuperi tutto da Ripristino di emergenza.")
    : tr("Non c'era nulla da rimuovere con questi criteri.\n\nControlla il periodo selezionato: con un intervallo di date vengono toccati solo pesate, settimane archiviate ed eventi che ci ricadono dentro."));};
window.sendBug=()=>{
  const t=document.getElementById("bugType"),x=document.getElementById("bugTxt"),c=document.getElementById("bugCtx");
  const txt=(x&&x.value||"").trim();
  if(!txt)return dlgAlert(tr("Scrivi prima cosa vuoi segnalare."));
  const tipo=(t&&t.value)||"Segnalazione";
  let body=tipo+"\n\n"+txt+"\n";
  if(c&&c.checked){
    body+="\n---\nNuvia v"+APP_VER+
      "\nData: "+new Date().toLocaleString(dataLoc())+
      "\nDispositivo: "+navigator.userAgent+
      "\nSchermo: "+window.innerWidth+"x"+window.innerHeight+
      "\nAI configurata: "+(aiOn()?"sì":"no")+
      "\nPiano: "+(planIsEmpty()?"vuoto":(S.customPlan?"personalizzato":"originale"))+"\n";}
  const url="mailto:"+DEV_MAIL+"?subject="+encodeURIComponent("[Nuvia "+APP_VER+"] "+tipo.split("—")[0].trim())+
    "&body="+encodeURIComponent(body);
  location.href=url;
  setTimeout(()=>toast(tr("Si apre la tua email: premi invia per spedire")),300);};
/* ═══ CARATTERISTICHE ALIMENTARI ═══════════════════════════════════ */
/* ══ COMPONENTI A SPUNTA (usati in Regole) ══ */
function parseSlots(s){return String(s||"").split(",").map(x=>x.trim()).filter(Boolean);}
/* ── I PASTI SI DICONO PER NOME (founder, 27/08) ───────────────────
   «Il piano è uscito bene ma non vengono rispettati i pasti scelti
   dall'utente: a me escono colazione, merenda, pranzo, spuntino,
   cena. Ma i pasti selezionati sono Metà mattina, Pranzo, Primo
   pomeriggio, Metà pomeriggio e Cena.»

   Il percorso guidato diceva al modello soltanto QUANTI pasti
   («pasti_al_giorno: 5»), e il modello faceva l'unica cosa che
   poteva: inventava i cinque nomi più comuni in italiano. Poi il
   controllo non se ne accorgeva, perché quella strada non gli
   passava l'elenco dei nomi attesi — solo il numero — e cinque pasti
   erano cinque pasti.

   Chi salta la colazione e mangia alle 11 riceveva un piano che
   comincia con la colazione: non è un dettaglio di forma, è il piano
   di un'altra persona.

   La riga vive QUI, in un posto solo, e la usano tutte e due le
   strade: due frasi diverse sarebbero due piani diversi per la stessa
   persona — è già successo con i farmaci e col medico. */
function rigaPasti(slots){
  const l=Array.isArray(slots)?slots:parseSlots(slots);
  if(!l.length)return "";
  return ' Pasti da prevedere ogni giorno, in questo ordine esatto e con QUESTI NOMI: '+l.join(", ")+
    '. Non aggiungerne altri, non toglierne, non rinominarli: se la persona non ha la colazione, il giorno comincia dal primo pasto di questo elenco.';}
window.rigaPasti=rigaPasti;

/* ── LA FORMA DI UN PASTO (founder, 27/08) ─────────────────────────
   «Aggiungi dei dettagli per fare in modo che non venga creato un
   piano con pasti con voti scarsi: altrimenti l'utente potrebbe essere
   confuso, perché quei pasti sono stati creati dall'app e quindi deve
   avere la percezione che vengano creati pasti di qualità.»

   È una richiesta di prodotto prima che nutrizionale, ed è giusta: un
   pallino arancione su un piatto che ha scritto Nuvia è Nuvia che si
   dà del mediocre da sola.

   IL BUCO CHE CHIUDE. Le regole che c'erano (linee guida OMS, in
   `nutriRulesShort`) parlano della GIORNATA: «verdura a pranzo e cena,
   frutta 2-3 volte, zuccheri sotto il 10%». Sono vere anche in una
   giornata che comincia con gallette e miele — e infatti quella
   colazione ha preso 45 senza violare niente. Qui si dice come è fatto
   un PASTO, che è la cosa che nessuno aveva ancora scritto.

   LA GERARCHIA, DETTA NEL PROMPT E NON SOTTINTESA (founder): «la
   precedenza devono averla le linee guida OMS eccetera». Quindi
   l'ultima frase di questa riga dice al modello, con parole sue, che
   se questa regola litiga con le linee guida, con la tradizione
   culinaria scelta, con un'intolleranza o con quello che ha detto il
   medico, questa regola PERDE. Senza quella frase, un vincolo scritto
   dopo tende a vincere solo perché è più recente e più specifico — e
   ci ritroveremmo pasti «da manuale» che ignorano la cucina scelta.

   PERCHÉ NON «MAI DUE CARBOIDRATI INSIEME», che era la prima stesura:
   il founder ha riscritto a mano la colazione da 45 mettendo yogurt
   senza lattosio, fette biscottate INTEGRALI, 10 g di miele e cinque
   mandorle — due fonti di carboidrati — e ha preso 78. Aveva ragione
   lui: il problema non erano due carboidrati, era lo zucchero senza
   niente accanto. La regola dice quello. */
function rigaPasto(){
  /* UNA frase sola, non tre pezzi: una chiave che comincia in
     minuscolo è un frammento, e in inglese si ricomporrebbe
     nell'ordine sbagliato (lo dice t_i18n, e ha ragione). */
  return " "+tr("FORMA DI OGNI PASTO (dopo le regole qui sopra, non al posto loro): ogni pasto ha una fonte proteica riconoscibile — nei pasti principali almeno 4 g di proteine ogni 100 kcal; pranzo e cena hanno sempre verdura; i carboidrati sono integrali quando la ricetta lo consente; gli zuccheri aggiunti — quelli che non vengono dall'alimento stesso — restano sotto i 10 g per pasto e non stanno mai da soli, ma accanto a proteine e a un grasso buono; nessun pasto è fatto solo di carboidrati raffinati e zucchero; uno spuntino senza proteine porta frutta secca, semi o frutta intera. La colazione segue le stesse regole degli altri pasti: un pasto fatto di soli cereali raffinati e zucchero non è una colazione, in nessuna cucina.")+" "+
    tr("Se una di queste indicazioni contrasta con le linee guida qui sopra, con la tradizione culinaria scelta, con un'intolleranza, con un'allergia o con le indicazioni del medico, vincono sempre quelle: questa è una regola di composizione, non un vincolo di salute.");}
window.rigaPasto=rigaPasto;
function slotsChecksHTML(pre,cur){const on=parseSlots(cur);
  return `<div class="ckgrid">`+SLOTS.map((s,i)=>`<label class="ck"><input type="checkbox" id="${pre}S${i}" ${on.includes(s)?"checked":""}> ${esc(fascia(s))}</label>`).join("")+`</div>`;}
function readSlotsChecks(pre){const out=[];SLOTS.forEach((s,i)=>{const e=document.getElementById(pre+"S"+i);if(e&&e.checked)out.push(s);});return out.join(", ");}
const MENSA_DAYS=[["lun","Lunedì"],["mar","Martedì"],["mer","Mercoledì"],["gio","Giovedì"],["ven","Venerdì"],["sab","Sabato"],["dom","Domenica"]];
function parseMensa(s){const m={};String(s||"").toLowerCase().split(",").forEach(x=>{x=x.trim();if(!x)return;
  const day=MENSA_DAYS.find(d=>x.indexOf(d[0])===0);if(!day)return;
  m[day[0]]=(/entrambi/.test(x))?"entrambi":(/cena/.test(x)?"cena":"pranzo");});return m;}
/* Un giorno può avere il pranzo fuori, la cena fuori o entrambi: chi lavora
   in viaggio ha spesso tutti e due. Le spunte sono quindi due per giorno. */
function mensaChecksHTML(pre,cur){const m=parseMensa(cur);
  const has=(k,p)=>{const v=m[k];return v==="entrambi"?true:(v===p);};
  return `<div class="ckmensa-w">`+MENSA_DAYS.map(([k,lbl])=>
    `<div class="ckmensa"><span style="flex:1;font-weight:700;font-size:13px;color:var(--bosco)">${giorno(lbl)}</span>
     <label class="ck" style="flex:none"><input type="checkbox" id="${pre}Mp${k}" ${has(k,"pranzo")?"checked":""}> ${tr("pranzo")}</label>
     <label class="ck" style="flex:none"><input type="checkbox" id="${pre}Mc${k}" ${has(k,"cena")?"checked":""}> ${tr("cena")}</label></div>`).join("")+`</div>`;}
function readMensaChecks(pre){const out=[];
  MENSA_DAYS.forEach(([k])=>{
    const p=document.getElementById(pre+"Mp"+k),c=document.getElementById(pre+"Mc"+k);
    const P=!!(p&&p.checked),C=!!(c&&c.checked);
    if(P&&C)out.push(k+" (entrambi)");
    else if(P)out.push(k+" (pranzo)");
    else if(C)out.push(k+" (cena)");});
  return out.join(", ");}
/* Quanti pasti fuori casa alla settimana: si contano dalle spunte, non si
   chiedono piu a mano (era un doppio inserimento che confondeva). */
function fuoriCount(str){const m=parseMensa(str);let n=0;
  Object.keys(m).forEach(k=>{n+=(m[k]==="entrambi")?2:1;});return n;}
/* Le intolleranze da sole non bastano: «cibi acidi» non dice all'AI che
   il pomodoro è acido, e infatti proponeva i pomodorini a chi l'aveva
   spuntata. Qui ogni voce porta con sé gli alimenti che esclude. */
const INTOL_ESPANDI={
  "nichel":"evita nichel: pomodoro, legumi, cacao, frutta secca, avena, mais, spinaci, asparagi, cipolla, pere, kiwi, conserve in latta",
  "istamina":"evita alimenti ricchi di istamina o istamino-liberatori: formaggi stagionati, salumi, pesce conservato o non freschissimo, crostacei, pomodoro, spinaci, melanzane, fragole, agrumi, cioccolato, alcol, alimenti fermentati",
  /* «Acido» ha TRE sensi diversi, e riguardano tre organi diversi:

     1. STOMACO ed esofago — conta il pH dell'alimento. Il limone ha
        pH ~2 e su una mucosa infiammata da reflusso o gastrite brucia.
     2. INTESTINO — al colon il limone NON arriva acido: l'acidità è già
        stata neutralizzata dai bicarbonati pancreatici nel duodeno, e
        il suo residuo metabolico è alcalino. Quello che irrita un colon
        irritabile è tutt'altro: FODMAP, grassi, caffeina, piccante.
     3. EQUILIBRIO ACIDO-BASE dell'organismo — il limone è fra gli
        alimenti più ALCALINIZZANTI che esistono.

     Escludere il limone a chi ha il colon irritabile è quindi un errore:
     gli si toglie un alimento utile per un problema che non ha. Qui la
     lista cambia a seconda di DOVE sta il disturbo. */
  "cibi acidi":"__ACIDI__",

  "lattosio":"evita latte e derivati freschi; ammessi i formaggi stagionati oltre 24 mesi e i prodotti delattosati",
  "glutine":"nessun alimento con glutine e attenzione alle contaminazioni: solo prodotti certificati senza glutine"
};
/* Gli integratori NON sono decorazione: cambiano davvero il piano.
   Le proteine in polvere entrano nel conteggio proteico, il ferro non
   va preso col caffè, la vitamina D ha bisogno di grassi, i probiotici
   di fibra. Prima erano una lista che l'AI riceveva e ignorava. */
const INTEG_REGOLE={
  "proteine in polvere":"le proteine in polvere contano NEL target proteico giornaliero: scala dai pasti la quota che copre, non sommarla sopra",
  "ferro":"chi prende ferro: mettilo lontano da caffè, tè e latticini, e accompagna gli alimenti ricchi di ferro con vitamina C nello stesso pasto",
  "vitamina D":"la vitamina D si assorbe con i grassi: il pasto in cui la prende deve contenere olio, frutta secca o pesce grasso",
  "calcio":"il calcio compete con il ferro: non nello stesso pasto",
  "creatina":"con la creatina servono più liquidi: alza l'obiettivo acqua di 2-3 bicchieri",
  "magnesio":"il magnesio la sera favorisce il sonno: se serve, collocalo nel pasto serale",
  "omega 3":"chi già integra omega 3 non ha bisogno che tu forzi il pesce grasso più di 2 volte a settimana",
  "probiotici":"i probiotici funzionano meglio con fibra fermentabile: prevedi verdura, legumi o cereali integrali nello stesso giorno",
  "postbiotici":"chi prende postbiotici non ha bisogno di alimenti fermentati aggiuntivi ogni giorno",
  "fermenti lattici":"chi prende fermenti lattici non ha bisogno di yogurt o kefir tutti i giorni: bastano 2-3 volte a settimana",
  "multivitaminico":"chi prende un multivitaminico non ha bisogno di alimenti fortificati: non proporli",
  "vitamina B12":"chi integra B12 non ha bisogno di alimenti fortificati con B12"};
function integForAI(txt){
  const t=String(txt||"").toLowerCase();
  const r=Object.keys(INTEG_REGOLE).filter(k=>t.indexOf(k)>-1).map(k=>INTEG_REGOLE[k]);
  if(!r.length)return "";
  return " INTEGRATORI GIÀ IN USO — tienine conto e non proporne altri: "+r.join("; ")+".";}
const ACIDI_STOMACO="disturbo allo STOMACO (reflusso, gastrite): evita agrumi e loro succhi, pomodoro e derivati (passata, pelati, ketchup, pomodorini), aceto, sottaceti, ananas, kiwi, bevande gassate, caffè, cioccolato, menta, piccante e fritti";
const ACIDI_INTESTINO="disturbo all'INTESTINO (colon irritabile): NON escludere il limone né gli agrumi — al colon arrivano già neutralizzati dai bicarbonati e il loro residuo è alcalino. Quello che irrita il colon è altro: alimenti ad alto FODMAP (aglio, cipolla, legumi interi, mele, pere, dolcificanti in -olo), pasti molto grassi o fritti, caffeina, alcol, piccante, bevande gassate e fibra insolubile in eccesso durante gli episodi acuti";
function intolForAI(txt,cond){
  const t=String(txt||"").toLowerCase(), c=String(cond||"").toLowerCase();
  const note=Object.keys(INTOL_ESPANDI).filter(k=>t.indexOf(k)>-1).map(k=>{
    const v=INTOL_ESPANDI[k];
    if(v!=="__ACIDI__")return v;
    /* Dove sta il problema lo dice la condizione dichiarata. Se non è
       chiaro, si dicono entrambe le cose invece di indovinare. */
    const w=(S.diet&&S.diet.acidWhere)||"";
    if(w==="stomaco")return ACIDI_STOMACO;
    if(w==="intestino")return ACIDI_INTESTINO;
    if(w==="entrambi")return ACIDI_STOMACO+". E in più, per l'intestino: "+ACIDI_INTESTINO;
    /* nessuna scelta esplicita: si tenta l'inferenza dalle condizioni */
    const colon=/colon irritabile|ibs/.test(c), stom=/reflusso|gastrite|esofag/.test(c);
    if(colon&&!stom)return ACIDI_INTESTINO;
    if(stom&&!colon)return ACIDI_STOMACO;
    if(colon&&stom) return ACIDI_STOMACO+". E in più, per l'intestino: "+ACIDI_INTESTINO;
    return trh("la persona ha indicato i «cibi acidi» ma non dove le danno fastidio. Se è lo stomaco: {v1}. Se è l'intestino: {v2}. Nel dubbio chiediglielo prima di togliere alimenti utili",{v1:ACIDI_STOMACO,v2:ACIDI_INTESTINO});
  });
  return note.length?(" In pratica: "+note.join("; ")+"."):"";}
/* ═══ INTOLLERANZE E ALLERGIE SONO DUE COSE DIVERSE ══════════════════
   Il founder, 27/08: «È professionale affrontarle così? Sarebbe meglio
   avere due tabelle distinte, in due pagine diverse: le allergie
   inoltre potrebbero essere diverse dalle intolleranze.»
   Aveva ragione, e la ragione è clinica prima che grafica.
   Un'INTOLLERANZA è una questione di dose e di enzimi: chi non tollera
   il lattosio può mangiare i latticini DELATTOSATI, e infatti gli si
   propongono.
   Un'ALLERGIA è una reazione immunitaria alla PROTEINA: chi è allergico
   al latte NON può mangiare il latte senza lattosio — la proteina è
   ancora tutta lì. Sono due elenchi diversi perché portano a due
   comportamenti opposti dello stesso motore, e tenerli in una tabella
   sola con due colonne li faceva sembrare la stessa domanda posta due
   volte.
   «Cibi acidi» esce da qui: non è né l'una né l'altra cosa. È una
   sensibilità, e vive dove vivono le condizioni (reflusso, gastrite) e
   i cibi che si preferisce evitare. */
const INTOL_LIST=["lattosio","glutine","fruttosio","sorbitolo e polioli",
                  "istamina","nichel","caffeina","solfiti","lieviti","salicilati"];
/* Le allergie alimentari più diffuse: sono nove delle quattordici che
   la legge europea obbliga a dichiarare in etichetta, più il sesamo.
   Qui NON valgono esenzioni di nessun tipo — vedi vietatoDentro. */
const ALLERG_LIST=["latte","uova","arachidi","frutta a guscio","pesce",
                   "crostacei","molluschi","soia","grano","sesamo"];
/* Condizioni legate all'alimentazione: etichetta + indicazione operativa che
   viene passata all'AI. Non sono terapie: sono i criteri dietetici che un
   nutrizionista applicherebbe, così il piano nasce già sensato. */
const PAT_LIST=[
 {k:"colon irritabile",l:"Colon irritabile",ai:"pasti piccoli e regolari, approccio a basso contenuto di FODMAP, poche fibre insolubili nelle fasi acute, niente bibite gassate e dolcificanti polioli"},
 {k:"reflusso",l:"Reflusso o gastrite",ai:"porzioni contenute, niente fritti, pomodoro, agrumi, cioccolato, menta, caffè e alcol; cena leggera e non a tarda ora"},
 {k:"colesterolo alto",l:"Colesterolo alto",ai:"pochi grassi saturi (burro, insaccati, formaggi grassi, carni rosse), nessun grasso idrogenato, più fibra solubile (avena, orzo, legumi, mele) e pesce azzurro 2-3 volte a settimana"},
 {k:"trigliceridi alti",l:"Trigliceridi alti",ai:"pochissimi zuccheri semplici e nessun alcol, carboidrati preferibilmente integrali e distribuiti, più omega-3 dal pesce azzurro"},
 {k:"ipertensione",l:"Pressione alta",ai:"poco sale e niente cibi conservati o insaccati, più potassio da verdura, frutta e legumi (impostazione tipo DASH)"},
 {k:"diabete",l:"Diabete 2 / insulino-resistenza",ai:"nessuno zucchero libero, carboidrati integrali distribuiti nella giornata e sempre abbinati a proteine, grassi buoni e verdura per contenere il carico glicemico"},
 {k:"ovaio policistico",l:"Ovaio policistico (PCOS)",ai:"carico glicemico basso, carboidrati integrali distribuiti, deficit calorico moderato e non aggressivo"},
 {k:"fegato grasso",l:"Fegato grasso (steatosi)",ai:"niente alcol, pochissimi zuccheri e nessuna bevanda zuccherata, deficit calorico graduale, olio d'oliva come grasso principale"},
 {k:"acido urico",l:"Gotta / acido urico alto",ai:"limitare purine (frattaglie, selvaggina, acciughe, sardine, crostacei), niente alcol e birra, molta acqua nella giornata"},
 {k:"ipotiroidismo",l:"Ipotiroidismo",ai:"iodio adeguato (pesce, sale iodato), non eccedere con crucifere crude e soia, e tenerle distanti dall'assunzione della terapia"},
 {k:"anemia",l:"Anemia da carenza di ferro",ai:"fonti di ferro a ogni pasto principale abbinate a vitamina C (agrumi, peperoni, prezzemolo), evitando tè e caffè durante i pasti"},
 {k:"calcoli renali",l:"Calcoli renali",ai:"molta acqua distribuita, poco sale, moderare gli alimenti ricchi di ossalati (spinaci, bietole, rabarbaro, frutta secca), calcio ai pasti e non lontano da essi"},
 {k:"diverticoli",l:"Diverticoli",ai:"fibre regolari e molta acqua nelle fasi di remissione, evitando semi e bucce durante gli episodi acuti"},
 {k:"celiachia",l:"Celiachia",ai:"nessun alimento con glutine, attenzione alle contaminazioni: usare solo prodotti certificati senza glutine"}
];
/* Le voci più comuni a spunte, più il campo libero per tutto il resto */
/* I vincoli qui sono PERMANENTI. Un digiuno (Quaresima, Ramadan) dura
   qualche settimana e si spegne: sta fra gli stati temporanei, in Oggi →
   Come stai, insieme a ciclo, infortunio e malattia. */
const REL_LIST=["niente carne di maiale","niente carne di alcun tipo","halal","kosher","niente alcol"];
/* I dieci integratori che si incontrano davvero, e che cambiano il
   piano per davvero: le proteine in polvere contano NEL target proteico
   invece di sommarsi sopra, il ferro non va col caffè, la vitamina D
   vuole grassi nello stesso pasto, il calcio litiga col ferro. */
/* «Proteine» e basta (founder, 27/08): «proteine in polvere» andava a
   capo su una riga sola e il senso era già chiaro. */
const INTEG_LIST=["vitamina D","magnesio","omega 3","multivitaminico","ferro",
                  "vitamina B12","probiotici","proteine","creatina","calcio"];
/* ═══ I FARMACI CHE PARLANO CON IL CIBO ══════════════════════════════
   «È giusto chiedere anche i farmaci?» — sì, e non per curiosità: sono
   dieci terapie comunissime che cambiano COSA e QUANDO ha senso
   mettere in un piano. Nuvia non entra nella terapia e non la discute:
   legge la voce, e ne tiene conto a tavola. Il confine medico è
   scritto nella schermata, non sottinteso.
   Ogni voce porta l'indicazione operativa che va all'AI, esattamente
   come le condizioni di salute. */
const FARM_LIST=[
 {k:"levotiroxina",l:"Levotiroxina (tiroide)",ai:"si prende a digiuno: tieni lontane dalla prima ora del mattino soia, fibre in quantità, caffè, calcio e ferro, e non concentrarli nella colazione"},
 {k:"metformina",l:"Metformina (diabete)",ai:"carboidrati integrali distribuiti e mai da soli, pasti regolari senza salti; attenzione alla vitamina B12, favorisci pesce, uova e carne bianca"},
 {k:"statine",l:"Statine (colesterolo)",ai:"niente pompelmo e succo di pompelmo in tutto il piano; pochi grassi saturi, più fibra solubile e pesce azzurro"},
 {k:"anticoagulanti",l:"Anticoagulanti (warfarin e simili)",ai:"la vitamina K deve restare COSTANTE giorno per giorno: verdure a foglia verde in porzioni regolari e simili fra loro, mai un giorno senza e un giorno pieno; niente integratori di vitamina K"},
 {k:"antipertensivi",l:"Farmaci per la pressione",ai:"poco sale e nessun sostituto del sale a base di potassio; niente liquirizia; più verdura e frutta fresca"},
 {k:"diuretici",l:"Diuretici",ai:"potassio regolare da verdura e frutta (banana, patata, spinaci) distribuito nella settimana, e acqua distribuita nella giornata"},
 {k:"gastroprotettori",l:"Gastroprotettori (omeprazolo e simili)",ai:"il ferro e la vitamina B12 si assorbono peggio: fonti di ferro abbinate a vitamina C, e pesce, uova e carne bianca presenti con regolarità"},
 {k:"cortisonici",l:"Cortisonici",ai:"sale ridotto, zuccheri semplici ridotti, proteine adeguate a ogni pasto e calcio regolare da alimenti"},
 {k:"antidepressivi",l:"Antidepressivi",ai:"se la terapia è di tipo IMAO vanno evitati i cibi ricchi di tiramina (formaggi stagionati, salumi, fermentati, estratti di lievito): nel dubbio tienili contenuti e scrivilo nella nota del giorno"},
 {k:"insulina",l:"Insulina",ai:"carboidrati presenti a ogni pasto principale, quantità simili di giorno in giorno e mai un pasto senza: la regolarità conta più del totale"}];
const OCC_LIST=["cena fuori il sabato","pranzo in famiglia la domenica","aperitivo del venerdì","pausa dolce al bar","cene di lavoro","allenamento la sera tardi"];
/* Come tagChecksHTML, ma ogni voce ha anche la frequenza: «vitamina D
   settimanalmente» e «vitamina D tutti i giorni» sono due cose diverse
   per chi costruisce il piano. La frequenza si salva accanto al nome. */
const FREQ=["giornalmente","settimanalmente","mensilmente","al bisogno"];
window.freqSync=(id)=>{const c=document.getElementById(id),f=document.getElementById(id+"f");
  if(c&&f)f.disabled=!c.checked;};
/* L'etichetta passa da tr(), il valore no: readTagChecks() legge sempre
   la lista italiana, quindi in stato finisce «niente carne di maiale»
   anche con l'app in inglese. Il confronto con c.indexOf resta sul
   valore nudo, altrimenti le spunte già fatte non si ritroverebbero. */
function tagChecksHTML(pre,key,list,cur,label,hint){
  const c=String(cur||"").toLowerCase();
  let h=`<label>${tr(label)}</label><div class="ckgrid">`+list.map((x,i)=>
    `<label class="ck"><input type="checkbox" id="${pre}${key}${i}" ${c.indexOf(x.toLowerCase())>-1?"checked":""}> ${(function(e){return e[0].toUpperCase()+e.slice(1);})(tr(x))}</label>`).join("")+`</div>`;
  const extra=parseSlots(cur).filter(x=>!list.some(k=>x.toLowerCase().indexOf(k.toLowerCase())>-1)).join(", ");
  h+=`<input type="text" id="${pre}${key}txt" value="${esc(extra)}" placeholder="${tr("altro, scrivilo tu")}">`;
  if(hint)h+=`<div class="hint">${hint}</div>`;
  return h;}
function readTagChecks(pre,key,list){const out=[];
  list.forEach((x,i)=>{const e=document.getElementById(pre+key+i);if(e&&e.checked)out.push(x);});
  const t=document.getElementById(pre+key+"txt");
  if(t&&t.value.trim())t.value.split(",").map(x=>x.trim()).filter(Boolean).forEach(x=>out.push(x));
  return out.join(", ");}
/* I PROTOCOLLI sono schemi alimentari, non condizioni di salute: stanno in una
   sezione loro. Ognuno porta con sé le indicazioni operative per l'AI. */
const PROT_LIST=[
 /* Progetto DIANA — «DIeta e ANdrogeni» — dell'Istituto Nazionale dei
    Tumori di Milano: poggia su studi pubblicati: DIANA-5, concluso nel 2016, ha
    misurato l'effetto di alimentazione e attività fisica sulle recidive
    del tumore al seno. Qui viene proposta come STILE ALIMENTARE —
    integrale, vegetale, povero di zuccheri — non come terapia. */
 {k:"diana",l:" Integrale e vegetale (DIANA)",ai:"stile alimentare del progetto DIANA: cereali NON raffinati (riso integrale, orzo, farro, miglio, grano saraceno, pane integrale a lievitazione naturale), legumi tutti i giorni, verdura in abbondanza e di stagione, frutta intera. Riduci molto zucchero, farine bianche, riso bianco, patate e bevande zuccherate. Poca carne, soprattutto rossa e conservata; latte e latticini in quantità contenute; niente alcol o pochissimo. Semi oleosi e olio extravergine a crudo. Dolci solo senza zucchero raffinato. Mantieni comunque il minimo proteico indicato, coprendolo con legumi, pesce, uova e cereali integrali combinati"},
 {k:"basso fodmap",l:"Basso FODMAP",ai:"schema a basso contenuto di FODMAP: niente aglio e cipolla, legumi solo in piccole quantità e ben cotti, frutta e verdura scelte fra quelle a basso FODMAP, nessun dolcificante poliolo"},
 {k:"digiuno intermittente",l:"Digiuno intermittente",  /* etichetta tradotta al disegno */ai:"finestra alimentare ristretta (tipo 16/8): concentra i pasti in 8 ore, niente calorie fuori dalla finestra, i pasti restano pochi e sostanziosi"},
 {k:"low carb",l:"Low carb",ai:"carboidrati contenuti (circa 100-130 g al giorno), più grassi buoni e proteine, cereali solo in porzioni piccole e integrali"},
 {k:"chetogenica",l:"Chetogenica",ai:"carboidrati sotto i 50 g al giorno, grassi come fonte energetica principale, verdura a foglia in abbondanza, nessun cereale, frutta molto limitata"},
 {k:"dash",l:"DASH (iposodica)",ai:"schema DASH: poco sale, niente cibi conservati e insaccati, molta verdura, frutta, cereali integrali e latticini magri"},
 {k:"basso indice glicemico",l:"Basso indice glicemico",ai:"cereali integrali e legumi al posto dei raffinati, nessuno zucchero libero, ogni pasto con fibre, proteine e grassi per contenere la risposta glicemica"},
 {k:"ipocalorica bilanciata",l:" Ipocalorica bilanciata",ai:"deficit moderato con i macronutrienti in proporzioni classiche, senza escludere nessun gruppo alimentare"},
 {k:"antinfiammatoria",l:" Antinfiammatoria",ai:"molti omega-3 (pesce azzurro, noci, semi di lino), spezie come curcuma e zenzero, pochissimi zuccheri e cibi ultraprocessati"},
 {k:"alta proteina",l:"Alta proteina",ai:"proteine distribuite in tutti i pasti, ogni pasto con una fonte proteica chiara, carboidrati intorno agli allenamenti"},
 {k:"iposodica",l:"Iposodica",ai:"sale ridotto al minimo, insaporire con erbe, limone e spezie, evitare conserve, salumi e formaggi stagionati"}
];
function protChecksHTML(pre,D){
  const cur=String(D.protocolli||"").toLowerCase();
  let h=`<div class="ckgrid">`+PROT_LIST.map((x,i)=>
    `<label class="ck"><input type="checkbox" id="${pre}Pr${i}" ${cur.indexOf(x.k)>-1?"checked":""}> ${tr(x.l)}</label>`).join("")+`</div>`;
    if(cur.indexOf("diana")>-1)h+=`${hint2(tr("<b>DIANA</b> sta per «DIeta e ANdrogeni»:"),tr("È lo stile alimentare studiato dall'Istituto Nazionale dei Tumori di Milano — cereali integrali, legumi, verdura, pochissimo zucchero e poca carne. Qui è proposto come modo di mangiare, non come terapia: per qualunque uso clinico parlane con il tuo medico."))}`;
  const extra=parseSlots(D.protocolli).filter(x=>!PROT_LIST.some(p=>x.toLowerCase().indexOf(p.k)>-1)).join(", ");
  h+=`<label>Altri protocolli</label>
  <input type="text" id="${pre}Prtxt" value="${esc(extra)}" placeholder="es. dieta a rotazione, Mind, dissociata">`;
  return h;}
function readProtChecks(pre){const out=[];
  PROT_LIST.forEach((x,i)=>{const e=document.getElementById(pre+"Pr"+i);if(e&&e.checked)out.push(x.k);});
  const t=document.getElementById(pre+"Prtxt");
  if(t&&t.value.trim())t.value.split(",").map(x=>x.trim()).filter(Boolean).forEach(x=>out.push(x));
  return out.join(", ");}
/* I protocolli diventano istruzioni concrete in ogni richiesta all'AI */
function protForAI(){const cur=String((S.diet||{}).protocolli||"").toLowerCase();
  if(!cur.trim())return "";
  const hit=PROT_LIST.filter(p=>cur.indexOf(p.k)>-1);
  const extra=parseSlots(S.diet.protocolli).filter(x=>!PROT_LIST.some(p=>x.toLowerCase().indexOf(p.k)>-1));
  let out=" PROTOCOLLI ALIMENTARI da rispettare: "+hit.map(p=>p.l.replace(/^\S+\s/,"")+" → "+p.ai).join("; ");
  if(extra.length)out+=(hit.length?"; ":"")+"inoltre: "+extra.join(", ");
  return out+".";}
function patChecksHTML(pre,D){const cur=String(D.patologie||"").toLowerCase();
  let h=`<div class="ckgrid">`+PAT_LIST.map((x,i)=>
    `<label class="ck"><input type="checkbox" id="${pre}P${i}" ${cur.indexOf(x.k)>-1?"checked":""}> ${tr(x.l)}</label>`).join("")+`</div>`;
  const extra=parseSlots(D.patologie).filter(x=>!PAT_LIST.some(p=>x.toLowerCase().indexOf(p.k)>-1)).join(", ");
  h+=`<label>Altre condizioni</label>
  <input type="text" id="${pre}Ptxt" value="${esc(extra)}" placeholder="es. emicrania, sindrome metabolica, intolleranza all'istamina">`;
  return h;}
function readPatChecks(pre){setTimeout(()=>{try{patPromote();}catch(e){}},80);const out=[];
  PAT_LIST.forEach((x,i)=>{const e=document.getElementById(pre+"P"+i);if(e&&e.checked)out.push(x.k);});
  const t=document.getElementById(pre+"Ptxt");
  if(t&&t.value.trim())t.value.split(",").map(x=>x.trim()).filter(Boolean).forEach(x=>out.push(x));
  return out.join(", ");}
/* Le condizioni diventano istruzioni concrete per ogni richiesta all'AI */
function patExtras(){
  return parseSlots((S.diet||{}).patologie||"").filter(x=>!PAT_LIST.some(p=>x.toLowerCase().indexOf(p.k)>-1));}
/* ── 2.2 · Le condizioni scritte a mano non sono più di serie B ──────
   Le spunte portano criteri operativi pronti; il testo libero prima
   passava nudo («adatta il piano di conseguenza», e l'AI improvvisava a
   OGNI chiamata). Ora, al salvataggio, UNA chiamata silenziosa lo
   trasforma in criteri operativi che vengono cacheati e riusati: stesso
   rango delle spunte, zero costi ricorrenti. */
window.patPromote=async()=>{
  try{
    const extra=patExtras();
    const key=extra.join("|").toLowerCase();
    S.diet.patCache=S.diet.patCache||{};
    if(!extra.length){S.diet.patCache={};return;}
    if(S.diet.patCache.src===key&&S.diet.patCache.rules)return;
    if(!aiOn())return;
    const j=await aiQuiet(()=>aiAskJSON('Trasforma queste condizioni di salute dichiarate da una persona in CRITERI DIETETICI OPERATIVI sintetici (massimo 25 parole per condizione), nello stile di questo esempio: "trigliceridi alti → limitare zuccheri semplici e alcol, preferire pesce azzurro e omega-3". Condizioni: '+extra.join(", ")+'. Solo criteri alimentari, nessun consiglio medico o farmacologico. Rispondi SOLO JSON: {"rules":"criteri separati da punto e virgola"}'));
    if(j&&j.rules)S.diet.patCache={src:key,rules:String(j.rules).slice(0,600)};
    save();
  }catch(e){}};
function patForAI(){const cur=String((S.diet||{}).patologie||"").toLowerCase();
  if(!cur.trim())return "";
  const hit=PAT_LIST.filter(p=>cur.indexOf(p.k)>-1);
  const extra=patExtras();
  let s=" CONDIZIONI DI SALUTE dichiarate, da rispettare nella scelta degli alimenti: ";
  s+=hit.map(p=>p.l+" → "+p.ai).join("; ");
  if(extra.length){
    const pc=S.diet.patCache||{};
    const key=extra.join("|").toLowerCase();
    s+=(hit.length?"; ":"")+"inoltre: "+((pc.src===key&&pc.rules)?pc.rules:extra.join(", ")+" (adatta il piano di conseguenza)");}
  s+=". Non presentare mai il piano come una terapia: le indicazioni cliniche restano del medico e del nutrizionista.";
  return s;}
/* ── DUE ELENCHI, DUE FUNZIONI (v13.102) ─────────────────────────
   Erano una casella sola intitolata «Intolleranze e allergie», con
   dentro tutte e due le cose: la stessa confusione che il founder ha
   fatto togliere dal percorso guidato il 27/08, rimasta qui.
   Adesso Regole rispecchia il percorso — stesse liste, stessi campi,
   stesso significato — perché è il posto dove si CAMBIA quello che il
   percorso ha CHIESTO. Due schede diverse sarebbero due verità.
   «Cibi acidi» è uscito dalle intolleranze (non lo è) e con lui il
   riquadro «dove danno fastidio», che restava a chiedere una cosa che
   nessuno poteva più spuntare. */
function intolChecksHTML(pre,D){const cur=String(D.intol||"").toLowerCase();
  let h=`<div class="ckgrid">`+INTOL_LIST.map((x,i)=>
    `<label class="ck"><input type="checkbox" id="${pre}I${i}" ${cur.indexOf(x.split(" ")[0])>-1?"checked":""}> ${(y=>y[0].toUpperCase()+y.slice(1))(tr(x))}</label>`).join("")+`</div>`;
  const extra=parseSlots(D.intol).filter(x=>!INTOL_LIST.some(k=>x.toLowerCase().indexOf(k.split(" ")[0])>-1)).join(", ");
  h+=`<input type="text" id="${pre}Itxt" value="${esc(extra)}" placeholder="${esc(tr("altre intolleranze, scrivile tu"))}">`;
  return h;}
function readIntolChecks(pre){const out=[];
  INTOL_LIST.forEach((x,i)=>{const e=document.getElementById(pre+"I"+i);if(e&&e.checked)out.push(x);});
  const t=document.getElementById(pre+"Itxt");
  if(t&&t.value.trim())t.value.split(",").map(x=>x.trim()).filter(Boolean).forEach(x=>out.push(x));
  return out.join(", ");}
/* Le allergie: stessa forma, altro elenco, e un avviso che dice perché
   sono una domanda a parte. */
function allergChecksHTML(pre,D){const cur=String(D.allergie||"").toLowerCase();
  let h=`<div class="ckgrid">`+ALLERG_LIST.map((x,i)=>
    `<label class="ck"><input type="checkbox" id="${pre}A${i}" ${cur.indexOf(x.split(" ")[0])>-1?"checked":""}> ${(y=>y[0].toUpperCase()+y.slice(1))(tr(x))}</label>`).join("")+`</div>`;
  const extra=parseSlots(D.allergie).filter(x=>!ALLERG_LIST.some(k=>x.toLowerCase().indexOf(k.split(" ")[0])>-1)).join(", ");
  h+=`<input type="text" id="${pre}Atxt" value="${esc(extra)}" placeholder="${esc(tr("altre allergie, scrivile tu"))}">`;
  return h;}
function readAllergChecks(pre){const out=[];
  ALLERG_LIST.forEach((x,i)=>{const e=document.getElementById(pre+"A"+i);if(e&&e.checked)out.push(x);});
  const t=document.getElementById(pre+"Atxt");
  if(t&&t.value.trim())t.value.split(",").map(x=>x.trim()).filter(Boolean).forEach(x=>out.push(x));
  return out.join(", ");}
/* I farmaci: le dieci terapie comuni a spunte più il campo libero,
   come nel percorso. Erano un campo di testo e basta. */
function farmChecksHTML(pre,D){const cur=String(D.farmaci||"").toLowerCase();
  let h=`<div class="ckgrid">`+FARM_LIST.map((x,i)=>
    `<label class="ck"><input type="checkbox" id="${pre}F${i}" ${cur.indexOf(x.k)>-1?"checked":""}> ${esc(tr(x.l))}</label>`).join("")+`</div>`;
  const extra=parseSlots(D.farmaci).filter(x=>!FARM_LIST.some(k=>x.toLowerCase().indexOf(k.k)>-1)).join(", ");
  h+=`<input type="text" id="${pre}Ftxt" value="${esc(extra)}" placeholder="${esc(tr("altri farmaci, scrivili tu"))}">`;
  return h;}
function readFarmChecks(pre){const out=[];
  FARM_LIST.forEach((x,i)=>{const e=document.getElementById(pre+"F"+i);if(e&&e.checked)out.push(x.k);});
  const t=document.getElementById(pre+"Ftxt");
  if(t&&t.value.trim())t.value.split(",").map(x=>x.trim()).filter(Boolean).forEach(x=>out.push(x));
  return out.join(", ");}

/* Se in «da evitare» compare un'intolleranza nota, la spunta è più/* Se in «da evitare» compare un'intolleranza nota, la spunta è più
   protettiva (porta le esclusioni pratiche): si propone, non si impone. */
window.suggIntolNo=async(el,pre)=>{
  window._SUGGI=window._SUGGI||{};
  const val=String(el.value||"").toLowerCase();
  const stems=["lattosio","glutine","nichel","istamina"];
  for(const k of stems){
    if(val.indexOf(k)<0)continue;
    if(String((S.diet||{}).intol||"").toLowerCase().indexOf(k)>-1)continue;
    if(window._SUGGI[k])continue;
    window._SUGGI[k]=1;
    const i=INTOL_LIST.findIndex(x=>x.indexOf(k)===0);
    if(i<0)continue;
    if(await dlgConfirm(tr("Hai scritto «{k}» tra i cibi da evitare.",{k:k})+"\n\n"+tr("La spunta Intolleranza è più protettiva: dice all'AI anche DOVE si nasconde e cosa usare al suo posto. La aggiungo?"),{ok:tr("Sì, spunta"),ko:tr("No, lascia così")})){
      const e=document.getElementById(pre+"I"+i);if(e)e.checked=true;}}};
/* Vegetariana e vegana si scelgono nel menù «Dieta di riferimento»: qui restano
   solo le due precisazioni che servono a chi è vegetariano, perché le versioni
   cambiano (di norma uova sì e pesce no). Compaiono da sole scegliendo
   «vegetariana» nel menù e spariscono con qualunque altra dieta. */
function vegChecksHTML(pre,tipo){const D=S.diet;
  const veg=(tipo==="vegetariana");
  return `<div id="${pre}VegBox" style="${veg?"":"display:none"}">
    <div class="ckgrid" style="margin-top:8px">
      <label class="ck"><input type="checkbox" id="${pre}VegU" ${(D.vegUova!==false)?"checked":""}> Uova ammesse</label>
      <label class="ck"><input type="checkbox" id="${pre}VegP" ${D.vegPesce?"checked":""}> Pesce ammesso</label>
    </div>
    ${tr("Nella dieta vegetariana le versioni cambiano: di norma le uova sono ammesse e il pesce no. Regola qui come mangi tu.")}
  </div>`;}
/* Chiamata dal menù della dieta: mostra o nasconde le due precisazioni.
   Passando a «vegetariana» da un'altra dieta si parte dalla versione più
   comune — uova sì, pesce no — invece di ereditare i valori dell'onnivoro. */
window.vegUI=(pre,val)=>{const b=document.getElementById(pre+"VegBox");if(!b)return;
  /* "era già vegetariano?" si legge dal riquadro: S.diet.tipo a questo punto
     può essere già stato aggiornato dal salvataggio automatico */
  const era=(b.style.display!=="none");
  if(val==="vegetariana"&&!era){
    const u=document.getElementById(pre+"VegU"),p=document.getElementById(pre+"VegP");
    if(u)u.checked=true;if(p)p.checked=false;}
  b.style.display=(val==="vegetariana")?"":"none";};
function applyVeg(pre,selVal){const g=id=>document.getElementById(id),D=S.diet;
  if(selVal==="vegana"){D.vegUova=false;D.vegPesce=false;return selVal;}
  if(selVal==="vegetariana"){
    D.vegUova=!(g(pre+"VegU")&&!g(pre+"VegU").checked);
    D.vegPesce=!!(g(pre+"VegP")&&g(pre+"VegP").checked);
    return selVal;}
  /* tutte le altre diete: uova e pesce ammessi per definizione */
  D.vegUova=true;D.vegPesce=true;
  return selVal;}
/* L'impostazione di riferimento è lo STILE di fondo: cosa mangi per scelta
   culturale o etica. Gli schemi tecnici (chetogenica, low carb, digiuno, DASH…)
   stanno nei PROTOCOLLI e le esclusioni (senza glutine, senza lattosio) fra le
   INTOLLERANZE: prima erano mescolati qui e si finiva per doverne scegliere uno
   solo fra tre cose che invece possono convivere. */
const DIET_TYPES=["mediterranea","onnivora","vegetariana","vegana","pescetariana","flexitariana"];
function dietCardHTML(){const D=S.diet;
  const sel=(id,val,opts)=>`<select id="${id}">`+opts.map(o=>`<option ${val===o?"selected":""}>${o}</option>`).join("")+`</select>`;
  return `<div class="card"><h2>Caratteristiche alimentari</h2>
  ${tr("Definiscono come l'AI costruisce e corregge i pasti: entrano in ogni proposta insieme alle regole numeriche qui sopra.")}
  <label>${tr("Dieta di riferimento")}</label>
  ${`<select id="dTipo" onchange="vegUI('d',this.value)">`+DIET_TYPES.map(o=>`<option ${D.tipo===o?"selected":""}>${o}</option>`).join("")+`</select>`}
  ${vegChecksHTML("d",D.tipo)}
  <label>${tr("Tradizione culinaria")}</label>
  ${`<select id="dTradizione">`+CUCINE.map(c=>`<option value="${c[0]}" ${(D.tradizione||"italiana")===c[0]?"selected":""}>${esc(tr(c[1]))}</option>`).join("")+`</select>`}
  ${hint2(tr("Come si cucina dove vivi: entra in ogni proposta dell'AI, dal piano alla spesa."),tr("La <b>dieta di riferimento</b> dice COSA mangi (scelta o convinzione), la tradizione dice COME si mette insieme un piatto: dispensa, grassi, metodi di cottura. Alcune tradizioni sono accorpate per zona quando si somigliano davvero — nordica, centroeuropea, sud-est asiatico — altre restano da sole perché a tavola si riconoscono. Le stime senza chiave AI conoscono anche gli ingredienti di queste cucine."))}
  ${hint2(tr("Lo <b>stile di fondo</b>: cosa mangi per scelta o convinzione."),tr("Gli schemi tecnici stanno nei <b>protocolli</b> qui sotto, le esclusioni fra le <b>intolleranze</b>. Possono convivere tutti e tre: per esempio mediterranea + basso FODMAP + digiuno intermittente."))}
  ${hint2(tr(" Nuvia non fa diagnosi e non sostituisce un professionista."),tr("Le impostazioni particolari (chetogenica, digiuno, eliminazioni) <b>vanno concordate con un medico o un nutrizionista</b>, soprattutto in presenza di patologie, gravidanza o terapie in corso."))}
  <label>${tr("Quanta varietà vuoi nel piano")}</label>
  ${sel("dVar",D.varieta||"media",["bassa","media","alta"])}
  ${hint2(tr("Varietà <b>bassa</b>: poche fonti proteiche e pochi contorni che tornano più volte, spesa corta e poco da cucinare."),tr("<b>Alta</b>: ogni giorno diverso, spesa più lunga."))}
  <label>${tr("Quali pasti fai davvero")}</label>
  ${slotsChecksHTML("d",D.slots||"Colazione, Metà mattina, Pranzo, Metà pomeriggio, Cena")}
  ${tr("Spunta solo quelli che fai: il numero di pasti al giorno esce da qui, e il piano non proporrà quelli spenti.")}
  ${outTypeHTML("d",false)}
  <label>${tr("Giorni fuori casa")}</label>
  ${mensaChecksHTML("d",D.mensaGiorni)}
  ${hint2(tr("<b>Liberi</b> = mangi quello che vuoi. <b>Fuori casa</b> = mensa, bar, ristorante."),tr("Nei pasti fuori casa non cucini tu, quindi l'AI non inventa ricette: propone come comporre il piatto con quello che si trova in quel contesto."))}
  <div class="grid2">
    <div><label>${tr("Pasti liberi a settimana")}</label><input type="number" id="dLiberi2" value="${D.pastiLiberi||0}" min="0" max="7"></div>
    <div><label>${tr("Pasti fuori casa a settimana")}</label><input type="number" id="dFuori" value="${fuoriCount(D.mensaGiorni)}" min="0" max="21" disabled title="${tr("Si conta dalle spunte dei pasti fuori casa")}"></div>
  </div>
  <div class="grid2">
    <div><label>${tr("Minuti per cucinare")}</label><input type="number" id="dCucina" value="${D.cucina||30}" min="0" max="180" step="5"></div>
    <div><label>${tr("Complessità ricette")}</label>${sel("dPronto",D.pronto,["velocissimo","semplice","mi piace cucinare"])}</div>
  </div>
  <div class="grid2">
    <div><label>${tr("Budget spesa")}</label>${sel("dBudget",D.budget,["contenuto","medio",tr("senza limiti")])}</div>
    <div><label>Alcol</label>${sel("dAlcol",D.alcol,["mai","raramente",tr("nel fine settimana"),"quotidiano"])}</div>
  </div>
  ${hint2(tr("L'alcol è un dato di contesto, non un'impostazione del piano."),
    tr("Nel piano non entra mai — al modello parte un divieto, e c'è una rete che lo verifica — e nella spesa nemmeno. Serve a segnarlo nel diario quando capita, così i conti restano veri, e a scegliere le parole giuste il giorno dopo."))}
  <label>${tr("Intolleranze")}</label>
  ${intolChecksHTML("d",D)}
  ${hint2(tr("È questione di <b>quantità</b>: le alternative esistono quasi sempre e l'AI le propone."),tr("Chi non tollera il lattosio riceve i latticini <b>senza lattosio</b>, non una settimana senza latticini."))}
  <label>${tr("Allergie")}</label>
  ${allergChecksHTML("d",D)}
  ${hint2(tr(" Qui non valgono eccezioni: quello che spunti non compare mai, in nessuna forma."),tr("Un'allergia è alla <b>proteina</b>: il latte senza lattosio resta latte, e il pane senza glutine resta grano. L'AI e il controllo di sicurezza li trattano in modo diverso dalle intolleranze, apposta."))}
  <label>Da evitare assolutamente</label>
  <input type="text" id="dNo" value="${esc(D.no||"")}" placeholder="es. frattaglie, funghi">
  <label>Cibi preferiti</label>
  <input type="text" id="dSi" value="${esc(D.si||"")}" placeholder="es. pesce azzurro, uova, yogurt greco">
  ${tagChecksHTML("d","R",REL_LIST,D.religiose,"Vincoli religiosi o etici","")}
  <label>${tr("Protocolli alimentari che segui")}</label>
  ${protChecksHTML("d",D)}
  ${hint2(tr("Gli <b>schemi alimentari</b> che segui: ognuno porta con sé le sue regole operative, che entrano in tutte le proposte dell'AI."),tr("Lascia vuoto se non segui nessun protocollo."))}
  ${famCardHTML("d")}
  <label>Condizioni da tenere presenti</label>
  ${patChecksHTML("d",D)}
  ${hint2(tr("Ogni spunta diventa un criterio operativo in tutte le proposte dell'AI (piano, ribilanci, alternative, spesa)."),tr("È informazione di contesto, <b>non</b> una terapia: le indicazioni cliniche restano di competenza del medico e del nutrizionista."))}
  <label>${tr("Farmaci in uso continuativo")}</label>
  ${farmChecksHTML("d",D)}
  ${hint2(tr("Contesto per l'AI, non una terapia: evita proposte in conflitto col farmaco."),tr("Nuvia non entra nella terapia e non la cambia. Sa però che il pompelmo litiga con le statine, che la vitamina K di chi prende anticoagulanti deve restare costante e che il ferro non va col caffè. Si compila anche nel percorso guidato; qui si aggiorna quando cambia."))}
  <label>${tr("Indicazioni del medico sull'alimentazione")}</label>
  <textarea id="dMedico" rows="3" placeholder="${esc(tr("es. poco sale per la pressione · almeno due volte a settimana il pesce · niente pompelmo con le statine"))}">${esc(D.medico||"")}</textarea>
  ${hint2(tr(" Quello che scrivi qui viene <b>prima</b> di qualunque proposta dell'AI."),tr("Nuvia non è un medico e non sostituisce nessuna cura: se il tuo medico ti ha detto qualcosa, quella è la regola e non si discute."))}
  ${tagChecksHTML("d","G",INTEG_LIST,D.integratori,"Integratori in uso",tr("Servono all'AI per non proporti doppioni."))}
  <label>${tr("Se il cibo non basta")}</label>
  ${sel("dInteg",D.integrareOk||"chiedi",["si","chiedi","no"])}
  ${hint2(tr("<b>si</b>: posso proporti un integratore. <b>chiedi</b>: te lo scrivo nella nota. <b>no</b>: solo cibo vero."),tr("Non tutti vogliono integrare, e proporre una polvere a chi non la vuole è il modo più rapido per far chiudere l'app."))}
  <label>Occasioni ricorrenti</label>
  <input type="text" id="dOcc" value="${esc(D.liberi||"")}" placeholder="${tr("es. cena fuori il sabato, pranzo in famiglia la domenica")}">
  <label>Altre note</label>
  <textarea id="dNote" placeholder="${tr("Qualsiasi cosa serva a capire come mangi")}">${esc(D.note||"")}</textarea>
  <button class="btn" onclick="saveDiet()">${tr("Salva caratteristiche")}</button></div>`;}
window.saveDiet=()=>{const g=id=>document.getElementById(id),v=id=>(g(id)?g(id).value:"");
  const slots=readSlotsChecks("d"),nS=parseSlots(slots).length;
  if(nS<2){dlgAlert(tr("Seleziona almeno due pasti: con meno di due il piano non sta in piedi."));return;}
  Object.assign(S.diet,{varieta:v("dVar")||"media",tipo:applyVeg("d",v("dTipo")),nPasti:nS,pastiLiberi:+v("dLiberi2")||0,
    slots:slots,mensaGiorni:readMensaChecks("d"),fuoriN:fuoriCount(readMensaChecks("d")),cucina:v("dCucina"),
    tradizione:v("dTradizione")||"italiana",
    pronto:v("dPronto"),budget:v("dBudget"),alcol:v("dAlcol"),
    intol:readIntolChecks("d"),allergie:readAllergChecks("d"),no:v("dNo"),si:v("dSi"),
    religiose:readTagChecks("d","R",REL_LIST),patologie:readPatChecks("d"),
    farmaci:readFarmChecks("d"),medico:v("dMedico").trim(),
    integrareOk:v("dInteg")||"chiedi",
    integratori:readTagChecks("d","G",INTEG_LIST),liberi:v("dOcc"),note:v("dNote"),
    protocolli:readProtChecks("d"),
    fodmap:String(readProtChecks("d")||"").toLowerCase().includes("fodmap")});
  save();render("regole");toast(tr("Caratteristiche alimentari salvate ✓"));};
/* ═══ GENERATORE DI PIANO ═══════════════════════════════════════════
   Costruisce 7 giorni completi partendo da profilo, obiettivo e
   caratteristiche alimentari. Il piano è una proposta: va letta, corretta
   e — per scelte particolari — confermata con un professionista. */
/* Intervallo di peso sano per l'altezza dichiarata (BMI 18,5–24,9) */
function healthyRange(){const h=+S.profile.h;if(!(h>0))return null;
  const m=h/100;return{min:Math.round(18.5*m*m*10)/10,max:Math.round(24.9*m*m*10)/10};}
/* Controlla che l'obiettivo di peso sia sensato PRIMA di costruire il piano.
   Ritorna false solo se la persona decide di fermarsi per correggerlo. */
async function goalHealthCheck(){
  const p=S.profile,h=+p.h,gw=goalWeightSet();
  if(!h||!gw)return true;
  const b=bmiFor(gw),cl=bmiClass(b),r=healthyRange();
  if(!b||!r)return true;
  /* La fascia 18,5-24,9 è un riferimento statistico, non una regola: la
     costituzione, la massa muscolare e la struttura ossea cambiano molto da
     persona a persona. Quindi silenzio nella fascia allargata 18-27, nota
     informativa fuori, avviso vero solo sotto 18 o sopra 30. */
  if(b>=18&&b<27)return true;
  const tooLow=b<18;
  const msg=(tooLow?" "+tr("L'obiettivo che hai impostato non sembra salutare."):tr("ℹ Nota sull'obiettivo."))+
    "\n\n"+tr("Con {h}, un peso di {g} corrisponde a un BMI di {b} ({c}).",{h:((typeof altTxt==="function")?altTxt(h):h+" cm"),g:((typeof pesoTxt==="function")?pesoTxt(gw,1):gw+" kg"),b:numLoc(b),c:cl.label})+
    "\n\n"+tr("Per la tua altezza la fascia considerata sana (BMI 18,5–24,9) va da {min} a {max}.",{min:numLoc(((typeof pesoNum==="function")?pesoNum(r.min,1):r.min)),max:((typeof pesoTxt==="function")?pesoTxt(r.max,1):r.max+" kg")})+
    "\n\n"+tr("Quella fascia è un riferimento statistico, non una regola: costituzione, massa muscolare e struttura ossea cambiano molto da persona a persona, e stare un po' sopra o un po' sotto può essere del tutto normale per te.")+
    (tooLow?("\n\nQui però il margine è ampio: scendere sotto "+String(r.min).replace(".",",")+" kg espone a perdita di massa muscolare, cali ormonali, "+
      "stanchezza e carenze. Un obiettivo intorno a "+Math.round(r.min+(r.max-r.min)*0.35)+"–"+Math.round(r.min+(r.max-r.min)*0.6)+
      " kg sarebbe più sostenibile, e vale la pena parlarne con un medico o un nutrizionista.")
      :("\n\n"+(cl.msg||"L'obiettivo resta sopra la fascia normopeso: come tappa intermedia va benissimo.")))+
    "\n\nPosso generare il piano su questo obiettivo, oppure puoi riscriverlo subito qui e rianalizzarlo.";
  if(await dlgConfirm(msg,{ok:tr("Genera così"),ko:tr("Riscrivi obiettivo")}))return true;
  /* riscrittura in linea: si corregge il peso e si rianalizza, senza uscire */
  const nw=parseFloat(String(await dlgPrompt(
    tr("Nuovo peso desiderato in {u} (fascia sana per {h}: da {min}",{u:((typeof unitaPeso==="function")?unitaPeso():"kg"),h:((typeof altTxt==="function")?altTxt(h):h+" cm"),min:numLoc(((typeof pesoNum==="function")?pesoNum(r.min,1):r.min))})+
    " a "+String(r.max).replace(".",",")+" kg).\n\nLascia vuoto per annullare la generazione.",
    String(Math.round((r.min+r.max)/2))||"")||"").replace(",","."));
  if(!(nw>0))return false;
  if(nw<25||nw>350)  {await dlgAlert(tr("Quel valore non sembra un peso plausibile: riprova."));return goalHealthCheck();}
  setGoalWeight(nw);save();
  const nb=bmiFor(nw);
  await dlgAlert(tr("Obiettivo aggiornato a {n} (BMI {b} · {c}) ✓",{n:((typeof pesoTxt==="function")?pesoTxt(nw,1):nw+" kg"),b:numLoc(nb),c:bmiClass(nb).label})+
    "\n\nLo trovi anche in Io → Obiettivi. Adesso rianalizzo.");
  return goalHealthCheck();          /* rianalisi immediata del nuovo obiettivo */
}
/* Tornando sull'app dopo averla messa via, l'indicatore deve essere
   ancora lì se il lavoro non è finito. */
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState!=="visible")return;
  try{aiSpiaSincro();}catch(e){}});
/* ═══ DOVE MOSTRARE L'AVANZAMENTO ═══════════════════════════════════
   «planOut» esiste solo nella pagina Piano. Al termine dell'onboarding
   quella pagina non c'è, quindi il riquadro con i giorni completati non
   aveva dove comparire e si vedeva solo «L'AI sta lavorando». Qui si
   cerca il contenitore giusto e, se non c'è, se ne crea uno fisso in
   fondo allo schermo: generare un piano dura minuti, e restare senza
   segnali per minuti fa pensare che si sia bloccato tutto. */
function genBoxMostra(el){
  if(el&&el.id==="genFloat")requestAnimationFrame(()=>el.classList.add("on"));}
/* L'elenco dei passaggi: i sette giorni più le due cose che vengono
   dopo. Vederli tutti fin dall'inizio dice quanto manca — un elenco che
   si allunga a sorpresa fa sembrare l'attesa più lunga di quanto sia. */
const GEN_GIORNI=["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
/* ricotta al cambio lingua: il tr() qui dentro si valuta alla
   costruzione, e la costruzione si ripete quando la lingua cambia
   (registro I18N_RIFAI in 10_base) */
let GEN_PASSI;
(window.I18N_RIFAI=window.I18N_RIFAI||[]).push(function(){GEN_PASSI=[tr("Lista della spesa"),"Controllo di uniformità"];});
window.I18N_RIFAI[window.I18N_RIFAI.length-1]();
/* `insieme`: i sette giorni nascono nella stessa risposta, quindi sono
   TUTTI in corso insieme. Fingere che si accendano uno alla volta
   sarebbe raccontare una cosa che non succede — e questo elenco esiste
   per dire la verità su quanto manca, non per far scorrere qualcosa.
   `ritocco`: i giorni che il controllo ha rimandato indietro. Vederli
   per nome spiega perché l'attesa si è allungata. */
/* ── LA BARRA MANCAVA DOVE IL LAVORO PARTE (founder, 27/08) ───────
   «Quando viene generato il piano in Alberto non c'è neanche la barra
   di avanzamento.»
   C'era l'elenco dei giorni, e nel percorso guidato c'era la barra:
   due racconti diversi della stessa attesa, e quello piu' povero
   toccava proprio alla schermata da cui si preme il pulsante. Adesso
   la barra sta in cima al riquadro, e il conto e' quello vero — i
   sette giorni piu' le due cose che vengono dopo.
   `GEN_ULTIMO` ricorda l'ultimo disegno: la pagina Alberto si
   ridisegna da sola per mille motivi (una spunta, un minuto che
   passa) e ogni ridisegno svuotava il riquadro, lasciando la persona
   davanti al nulla mentre il lavoro andava avanti. Il guardiano qui
   sotto lo ridipinge. */
let GEN_ULTIMO=null,GEN_TIC=null;
function genRidipingi(){
  if(!GEN_ULTIMO)return;
  const box=genBox();
  if(!box)return;
  if((box.innerHTML||"").indexOf("genbar")>-1)return;   /* c'e' gia' */
  genPassi(box,GEN_ULTIMO.fatti,GEN_ULTIMO.extra,GEN_ULTIMO.insieme,GEN_ULTIMO.ritocco);}
window.genRidipingi=genRidipingi;

function genPassi(box,fatti,extra,insieme,ritocco){
  if(!box)return;
  GEN_ULTIMO={fatti:fatti,extra:extra,insieme:insieme,ritocco:ritocco};
  if(!GEN_TIC)GEN_TIC=setInterval(()=>{
    if(!GEN_ULTIMO){clearInterval(GEN_TIC);GEN_TIC=null;return;}
    try{genRidipingi();}catch(e){}},1200);
  /* I nomi si tengono qui: «DAYS» vive dentro la funzione di generazione
     e da fuori non esiste — chiamare genPassi altrove andava in errore. */
  const tutti=GEN_GIORNI.concat(GEN_PASSI);
  const n=(extra===undefined)?fatti:(GEN_GIORNI.length+extra);
  box.style.display="block";genBoxMostra(box);
  /* l'avanzamento in un numero: i giorni fatti sui nove passaggi */
  const perc=Math.max(4,Math.min(100,Math.round(n/tutti.length*100)));
  box.innerHTML=`<div class="genbar" role="progressbar" aria-valuemin="0" aria-valuemax="100"
      aria-valuenow="${perc}"><i style="width:${perc}%"></i></div>`
    +tutti.map((nome,k)=>
      (insieme&&k<GEN_GIORNI.length)
           ? `<div class="gday now">◍ ${esc(nome)}</div>`
    : k<n  ? `<div class="gday ok">✓ ${esc(nome)}</div>`
    : k===n? `<div class="gday now">◍ ${esc(nome)} — ci sto lavorando…</div>`
    :        `<div class="gday">○ ${esc(nome)}</div>`).join("")+
    ((ritocco&&ritocco.length)?`<div class="gday now">◍ ${esc(trh("Rifaccio: {v1}",{v1:ritocco.join(", ")}))}</div>`:"")+
    /* ── VIA IL «PERCHÉ?» DA QUI (founder, 24/08) ────────────────
       C'era un `hint2`, cioè un richiudibile: dentro un riquadro che
       racconta un'attesa, un comando da aprire è una cosa in più da
       decidere proprio mentre non si vuole decidere niente. E la
       spiegazione l'ha già data la schermata prima, alla conferma.
       Resta UNA riga, quella che serve davvero: puoi mettere via il
       telefono. */
    `<div class="hint">${esc(tr("Puoi anche mettere via il telefono: il lavoro continua."))}</div>`;}
function genBox(){
  /* L'avanzamento sta DENTRO la scheda da cui è partito il lavoro, non
     in una finestra che copre la pagina: chi ha premuto «Genera il
     piano» vuole vedere cosa succede lì. Il riquadro fisso resta solo
     come ultima possibilità, se nessun contenitore è visibile. */
  const attiva=(el)=>el&&el.closest(".page")&&el.closest(".page").classList.contains("active");
  const cand=[document.getElementById("genPunto"),
              document.getElementById("genOut"),
              document.getElementById("planOut"),
              document.getElementById("rulesOut")];
  for(const q of cand) if(attiva(q))return q;
  let f=document.getElementById("genFloat");
  if(!f){
    f=document.createElement("div");
    f.id="genFloat";f.className="genfloat";
    document.body.appendChild(f);
  }
  return f;}
/* si toglie da sé quando il lavoro finisce */
function genBoxVia(){
  /* Il lavoro lungo è finito: l'indicatore può spegnersi. Si aggancia
     qui perché genBoxVia viene chiamata in TUTTI i punti di uscita —
     successo, errore e annullamento — e non se ne dimentica nessuno. */
  try{aiLungoOff();}catch(_){}
  /* e con lui smette anche il guardiano che ridipinge il riquadro:
     senza questa riga continuerebbe a rimetterlo a schermo a lavoro
     finito, che e' il difetto opposto */
  GEN_ULTIMO=null;
  if(GEN_TIC){clearInterval(GEN_TIC);GEN_TIC=null;}
  document.querySelectorAll("#genPunto,#genOut,#planOut,#rulesOut").forEach(b=>{
    try{b.innerHTML="";b.style.display="none";}catch(_){}});
  const f=document.getElementById("genFloat");
  if(f){f.classList.remove("on");setTimeout(()=>{try{f.remove();}catch(_){}} ,260);}}
/* ═══ CUORE CONDIVISO della generazione giorno-per-giorno ═══════════
   Usato sia da «Genera nuovo piano» sia dal percorso guidato: il PRIMO
   piano della vita di un utente ha la stessa qualità delle rigenerazioni
   (retry silenzioso sul giorno, normalizzazione unica, stesso contratto). */
async function askDayAI(q){
  let d=null,lastE=null;
  for(let att=0;att<2&&!d;att++){
    try{const t2=await aiAsk(q);const o=parseAIJSON(t2);
      const obj=Array.isArray(o)?o[0]:o;
      if(obj&&Array.isArray(obj.meals)&&obj.meals.length)d=obj;
    }catch(e){lastE=e;}}
  aiHealth("giorno",!!d);
  return {day:d,err:lastE};}
function normDayAI(dayName,d){
  return {day:dayName,ctx:d.ctx||"",meals:(d.meals||[]).map(m=>({
    n:m.n,t:m.t||"",type:(m.type==="libero"?"free":(m.type||"norm")),
    /* il segno della riparazione sopravvive alla normalizzazione:
       serve a dire alla persona quali piatti sono stati adattati */
    adattato:m.adattato?1:0,
    o:[{d:m.d,k:Math.round(m.k)||0,p:Math.round(m.p)||0,c:Math.round(m.c)||0,f:Math.round(m.f)||0,
      fib:Math.round(m.fib)||estFiberOf(m.d),z:Math.round(m.z)||estSugarOf(m.d)}]}))};}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  LA SETTIMANA IN UNA CHIAMATA SOLA, E LA RETE CHE LA CONTROLLA   ║
   ╚══════════════════════════════════════════════════════════════════╝
   Chiesto dal founder il 24/08/2026.

   ── PERCHÉ UNA CHIAMATA SOLA ──────────────────────────────────────
   Sette giorni in sette chiamate in fila erano il collo di bottiglia
   dell'attesa. Ma la velocità è il motivo minore: generando i sette
   giorni INSIEME il modello vede la settimana intera mentre la scrive.
   Prima «non ripetere i piatti» gli arrivava come una lista di stringhe
   dei giorni già fatti, e lui ci ragionava alla cieca — non poteva
   distribuire le fonti proteiche, né bilanciare una domenica pesante
   con un lunedì leggero, perché la domenica non esisteva ancora.

   ── PERCHÉ LA VALIDAZIONE È LA PARTE CHE CONTA ────────────────────
   Chiedere al modello di ricontrollarsi nel prompt aiuta e non basta:
   se sbaglia le kcal, sbaglia anche a verificarle — è lo stesso
   ragionamento che ha prodotto l'errore. Quindi qui sotto il controllo
   è in JavaScript, deterministico, e non fa domande a nessuno.

   ── DUE PESI DIVERSI, ED È VOLUTO ─────────────────────────────────
   • QUALITÀ (kcal fuori tolleranza, proteine basse, piatti ripetuti,
     contratto incompleto): si rifà, e se dopo il rifacimento non torna
     ancora, SI DICHIARA. Una stima che si sa storta e non lo dice è
     peggio di nessuna stima.
   • SICUREZZA (un alimento vietato o un'intolleranza dentro la
     descrizione): si rifà, e se non torna NON si attiva. Qui non c'è
     un «va bene lo stesso» da offrire.                                */

/* ── Le parole che il codice deve poter confrontare ────────────────
   INTOL_ESPANDI (più su) dice al MODELLO cosa evitare, e lo dice in
   prosa: giusto per un prompt, inservibile per un controllo. Qui la
   stessa sostanza in forma di elenco.
   Le due liste devono dire la stessa cosa: se un giorno divergono, la
   persona riceve un divieto nel prompt che nessuno verifica, oppure un
   rifiuto su un alimento che le avevamo detto ammesso. È il collaudo a
   tenerle allineate.
   COSA NON C'È, e non per dimenticanza: il parmigiano e i formaggi
   stagionati NON sono fra i vietati del lattosio, perché INTOL_ESPANDI
   li dichiara ammessi («stagionati oltre 24 mesi»). Un controllo più
   severo del divieto che abbiamo dato rifiuterebbe risposte corrette. */
/* Cosa porta con sé ogni ALLERGIA. Attenzione: la lista del «latte»
   allergene contiene anche le forme delattosate — «latte senza
   lattosio» è vietato a un allergico, perché la proteina è ancora lì.
   È esattamente il motivo per cui allergie e intolleranze non possono
   stare nella stessa colonna. */
const VIETATI_DA_ALLERG={
 "latte":["latte","latticini","formaggio","formaggi","mozzarella","yogurt","ricotta","burro","panna","besciamella","mascarpone","stracchino","crescenza","robiola","scamorza","provola","caciotta","gelato","kefir","fiocchi di latte","feta","brie","cheddar","parmigiano","grana","pecorino","caseina","siero di latte","whey"],
 "uova":["uovo","uova","frittata","omelette","maionese","albume","tuorlo","meringa","pasta all'uovo"],
 "arachidi":["arachidi","burro di arachidi","olio di arachidi"],
 "frutta a guscio":["noci","nocciole","mandorle","pistacchi","anacardi","pinoli","noci pecan","noci del brasile","macadamia","marzapane","pesto"],
 "pesce":["pesce","salmone","tonno","branzino","orata","merluzzo","sgombro","alici","acciughe","platessa","colatura","bottarga","surimi"],
 "crostacei":["gamberi","gamberetti","scampi","astice","granchio","mazzancolle","aragosta","surimi"],
 "molluschi":["cozze","vongole","calamari","seppie","polpo","totani","capesante","lumache","ostriche"],
 "soia":["soia","tofu","tempeh","edamame","salsa di soia","miso","lecitina di soia"],
 "grano":["pane","pasta","farro","orzo","seitan","couscous","cous cous","bulgur","semola","cracker","fette biscottate","grissini","piadina","pizza","panino","panini","crostini","pangrattato","biscotti","brioche","gnocchi","tortellini","ravioli","lasagne","farina","frumento"],
 "sesamo":["sesamo","tahina","semi di sesamo","hummus"]};
const VIETATI_DA_INTOL={
 "lattosio":["latte","latticini","formaggio","formaggi","mozzarella","yogurt","ricotta","burro","panna","besciamella","mascarpone","stracchino","crescenza","robiola","scamorza","provola","caciotta","gelato","kefir","fiocchi di latte","feta","brie","cheddar"],
 "glutine":["pane","pasta","farro","orzo","seitan","couscous","cous cous","bulgur","semola","cracker","fette biscottate","grissini","piadina","pizza","panino","panini","crostini","pangrattato","biscotti","brioche","gnocchi","tortellini","ravioli","lasagne","birra"],
 "nichel":["pomodoro","pomodorini","passata","pelati","legumi","fagioli","ceci","lenticchie","cacao","cioccolato","noci","nocciole","mandorle","avena","mais","spinaci","asparagi","cipolla","pere","kiwi"],
 "istamina":["formaggi stagionati","salumi","prosciutto","salame","speck","bresaola","mortadella","tonno in scatola","acciughe","sgombro","crostacei","gamberi","gamberetti","pomodoro","spinaci","melanzane","fragole","cioccolato","crauti","vino","birra"],
 "glutammato":["dado","estratto di lievito","salsa di soia"],
 "fruttosio":["miele","sciroppo di glucosio","sciroppo d'agave","succo di frutta"],
 "uova":["uovo","uova","frittata","omelette","maionese","albume","tuorlo"],
 "frutta secca":["noci","nocciole","mandorle","pistacchi","anacardi","arachidi","pinoli"],
 "arachidi":["arachidi","burro di arachidi"],
 "soia":["soia","tofu","tempeh","edamame","salsa di soia"],
 "pesce":["pesce","salmone","tonno","branzino","orata","merluzzo","sgombro","alici","acciughe","platessa"],
 "crostacei":["gamberi","gamberetti","scampi","astice","granchio","mazzancolle"],
 "molluschi":["cozze","vongole","calamari","seppie","polpo","totani","capesante"],
 /* le sei intolleranze aggiunte con la separazione del 27/08 */
 "sorbitolo e polioli":["sorbitolo","maltitolo","xilitolo","mannitolo","gomme senza zucchero","caramelle senza zucchero","dolcificanti"],
 "caffeina":["caffè","tè","cioccolato","cacao","energy drink","cola","matcha"],
 "solfiti":["frutta secca disidratata","albicocche secche","aceto balsamico","succhi di frutta","gamberi"],
 "lieviti":["pane","pizza","dado","estratto di lievito","aceto","formaggi stagionati","brioche","focaccia"],
 "salicilati":["pomodoro","fragole","frutti di bosco","curry","paprica","tè","menta","mandorle"]};

/* ═══ LE ALTERNATIVE: COSA SI USA AL POSTO DI ═══════════════════════
   PERCHÉ ESISTE QUESTA TABELLA (founder, 26/08 sera)
   «Il piano non può saltare per queste cose. Se uno è intollerante al
   lattosio ci sono prodotti caseari senza lattosio o alternative: non
   puoi metterli e poi far saltare il piano. Il check dovrebbe servire
   a RIPARARE gli errori, non a bloccare.»
   Aveva ragione, ed era un errore di impostazione, non un difetto:
   il controllo di sicurezza sapeva dire NO e non sapeva dire «al suo
   posto ci va questo». Un intollerante all'istamina e al nichel ha
   una lista di divieti lunghissima — prosciutto, pomodoro,
   cioccolato, formaggi stagionati — e bastava che una parola
   scivolasse dentro una descrizione perché sette giorni di lavoro
   finissero nel cestino, due volte di fila.
   Questa tabella serve a DUE cose, e in quest'ordine:
   1. PREVENIRE — arriva nel prompt: al modello si dice cosa usare
      invece di cosa, e il problema in gran parte non nasce;
   2. RIPARARE — se un divieto scivola dentro lo stesso, si sostituisce
      la parola con la prima alternativa che è sicura PER QUESTA
      PERSONA (una che è intollerante al lattosio E alla soia non può
      ricevere lo yogurt di soia: si scorre finché una passa).
   I sostituti sono scelti VICINI DI MACRO — burro→olio, prosciutto→
   petto di pollo, pasta→pasta di riso — così le calorie del piatto
   restano nell'ordine di grandezza giusto; le grammature esatte le
   sistema «Ricalibra», che esiste per questo.                       */
const ALT_DA_INTOL={
 "lattosio":"latticini senza lattosio (esistono e sono normali: latte, yogurt, mozzarella, formaggio delattosati) oppure alternative vegetali (bevanda e yogurt di soia, formaggio vegetale)",
 "glutine":"prodotti senza glutine (pane, pasta e biscotti senza glutine) oppure cereali naturalmente senza glutine: riso, quinoa, grano saraceno, mais, patate",
 "nichel":"al posto di pomodoro e legumi: zucchine, carote, finocchi, carne bianca, pesce, riso; al posto del cioccolato: carruba",
 "istamina":"alimenti freschi al posto di stagionati e conservati: carne bianca e pesce freschi al posto di salumi e tonno in scatola, formaggi freschi al posto degli stagionati, zucchine e carote al posto di pomodoro e melanzane",
 "glutammato":"brodo vegetale fatto in casa ed erbe aromatiche al posto di dado ed estratti",
 "fruttosio":"sciroppo di riso al posto del miele, frutta fresca intera al posto dei succhi",
 "uova":"tofu al posto delle uova nei piatti salati, maionese vegana al posto della maionese",
 "frutta secca":"semi di zucca e di girasole, oppure olio EVO",
 "arachidi":"crema di semi di girasole al posto del burro di arachidi",
 "soia":"ceci, lenticchie e tofu di ceci al posto della soia e del tofu di soia",
 "pesce":"carne bianca, uova e legumi al posto del pesce",
 "crostacei":"carne bianca o pesce senza guscio",
 "molluschi":"carne bianca o pesce"};

/* La riga che va nel prompt: solo le alternative che servono a QUESTA
   persona. Si costruisce dallo stesso testo delle intolleranze che
   genera i divieti, così le due cose non possono divergere. */
function alternativeRiga(testoIntol){
  const t=cibNorm(testoIntol);
  const righe=[];
  Object.keys(ALT_DA_INTOL).forEach(k=>{
    if(t.indexOf(cibNorm(k))>-1)righe.push(k+" → "+ALT_DA_INTOL[k]);});
  if(!righe.length)return "";
  return " ALTERNATIVE DA USARE, invece di eliminare il piatto: "+righe.join("; ")+
    ". Scrivi l'alternativa PER ESTESO nella descrizione (per esempio «yogurt senza lattosio», non «yogurt»), così si capisce che è quella giusta.";}

/* Il sostituto, per parola vietata. L'ordine conta: il primo che è
   sicuro per questa persona vince. In coda a ogni lista c'è un ripiego
   di famiglia — proteina, cereale, verdura, grasso — perché una
   sostituzione deve SEMPRE poter finire. */
const SOSTITUTI={
 /* latticini */
 "latte":["latte senza lattosio","bevanda di soia","bevanda di riso"],
 "latticini":["latticini senza lattosio","alternative vegetali"],
 "yogurt":["yogurt senza lattosio","yogurt di soia","yogurt di cocco"],
 "kefir":["kefir senza lattosio","yogurt di soia"],
 "formaggio":["formaggio senza lattosio","formaggio vegetale"],
 "formaggi":["formaggi senza lattosio","formaggi vegetali"],
 "formaggi stagionati":["ricotta fresca","formaggio fresco"],
 "mozzarella":["mozzarella senza lattosio","tofu"],
 "ricotta":["ricotta senza lattosio","tofu setoso"],
 "burro":["olio EVO"],
 "panna":["panna di soia","panna senza lattosio"],
 "besciamella":["besciamella di soia"],
 "mascarpone":["ricotta senza lattosio","tofu setoso"],
 "stracchino":["formaggio senza lattosio","tofu"],
 "crescenza":["formaggio senza lattosio","tofu"],
 "robiola":["formaggio senza lattosio","tofu"],
 "scamorza":["scamorza senza lattosio","tofu"],
 "provola":["formaggio senza lattosio","tofu"],
 "caciotta":["formaggio senza lattosio","tofu"],
 "feta":["feta senza lattosio","tofu"],
 "brie":["formaggio senza lattosio","tofu"],
 "cheddar":["formaggio senza lattosio","tofu"],
 "gelato":["gelato di soia","sorbetto di frutta"],
 "fiocchi di latte":["tofu setoso","ricotta senza lattosio"],
 /* glutine */
 "pane":["pane senza glutine","gallette di riso"],
 "pasta":["pasta di riso","pasta senza glutine"],
 "pizza":["pizza senza glutine"],
 "panino":["panino senza glutine"],"panini":["panini senza glutine"],
 "piadina":["piadina senza glutine"],
 "cracker":["gallette di riso"],
 "fette biscottate":["gallette di riso"],
 "grissini":["gallette di riso"],
 "crostini":["crostini senza glutine","gallette di riso"],
 "biscotti":["biscotti senza glutine"],
 "brioche":["brioche senza glutine"],
 "pangrattato":["farina di riso"],
 "farro":["riso","quinoa"],"orzo":["riso","quinoa"],
 "couscous":["quinoa","riso"],"cous cous":["quinoa","riso"],
 "bulgur":["quinoa","riso"],"semola":["farina di riso"],
 "seitan":["tofu","petto di pollo"],
 "gnocchi":["gnocchi di riso","riso"],
 "tortellini":["riso","quinoa"],"ravioli":["riso","quinoa"],
 "lasagne":["lasagne senza glutine","riso"],
 "avena":["riso","quinoa"],
 /* nichel e istamina */
 "pomodoro":["zucchine","carote"],"pomodorini":["zucchine","carote"],
 "passata":["crema di zucchine"],"pelati":["zucchine"],
 "cacao":["carruba"],"cioccolato":["carruba"],
 "spinaci":["zucchine","bietole"],"asparagi":["zucchine","finocchi"],
 "melanzane":["zucchine","carote"],
 "cipolla":["sedano","finocchio"],
 "mais":["riso","quinoa"],
 "pere":["mela"],"kiwi":["mela"],"fragole":["mela","mirtilli"],
 "crauti":["cavolo fresco"],
 /* proteine da sostituire */
 "prosciutto":["petto di pollo","fesa di tacchino"],
 "salumi":["petto di pollo","fesa di tacchino"],
 "salame":["petto di pollo"],"speck":["petto di pollo"],
 "bresaola":["petto di pollo"],"mortadella":["petto di pollo"],
 "tonno in scatola":["petto di pollo","branzino fresco"],
 "acciughe":["petto di pollo"],"alici":["petto di pollo"],
 "sgombro":["petto di pollo","branzino fresco"],
 "crostacei":["petto di pollo"],"gamberi":["petto di pollo"],
 "gamberetti":["petto di pollo"],"scampi":["petto di pollo"],
 "astice":["petto di pollo"],"granchio":["petto di pollo"],
 "mazzancolle":["petto di pollo"],
 "cozze":["petto di pollo"],"vongole":["petto di pollo"],
 "calamari":["petto di pollo"],"seppie":["petto di pollo"],
 "polpo":["petto di pollo"],"totani":["petto di pollo"],
 "capesante":["petto di pollo"],
 "pesce":["petto di pollo","fesa di tacchino"],
 "salmone":["petto di pollo"],"tonno":["petto di pollo"],
 "branzino":["petto di pollo"],"orata":["petto di pollo"],
 "merluzzo":["petto di pollo"],"platessa":["petto di pollo"],
 /* uova */
 "uovo":["tofu"],"uova":["tofu"],"frittata":["frittata di ceci"],
 "omelette":["frittata di ceci"],"albume":["tofu"],"tuorlo":["tofu"],
 "maionese":["maionese vegana"],
 /* frutta secca e semi */
 "noci":["semi di zucca"],"nocciole":["semi di zucca"],
 "mandorle":["semi di zucca"],"pistacchi":["semi di zucca"],
 "anacardi":["semi di zucca"],"arachidi":["semi di zucca"],
 "pinoli":["semi di zucca"],
 "burro di arachidi":["crema di semi di girasole"],
 /* legumi e soia */
 "legumi":["petto di pollo","riso"],
 "fagioli":["petto di pollo","riso"],
 "ceci":["petto di pollo","riso"],
 "lenticchie":["petto di pollo","riso"],
 "soia":["ceci","petto di pollo"],"tofu":["ceci","petto di pollo"],
 "tempeh":["ceci","petto di pollo"],"edamame":["piselli","ceci"],
 "salsa di soia":["aceto e spezie"],
 /* altro */
 "miele":["sciroppo di riso"],
 "succo di frutta":["frutta fresca"],
 "sciroppo di glucosio":["sciroppo di riso"],
 "sciroppo d'agave":["sciroppo di riso"],
 "dado":["brodo vegetale fatto in casa"],
 "estratto di lievito":["erbe aromatiche"],
 "birra":["acqua"],"vino":["acqua"]};

/* I ripieghi di famiglia: quando nessun sostituto dedicato passa, si
   prova con questi. Sono cibi semplici e quasi mai vietati; se anche
   loro sono esclusi, la parola si toglie e basta (e il pasto resta
   segnato come adattato, così si vede). */
const RIPIEGO_FAMIGLIA=["petto di pollo","riso","patate","zucchine","carote","olio EVO","mela"];

/* ── UN POMODORO NON DIVENTA UN POLLO (founder, 27/08) ─────────────
   «Perché il sistema ad esempio sostituisce il pomodoro con il pollo?
   Mi sarei aspettato una sostituzione con delle zucchine o altre
   verdure.»

   Aveva ragione, e il difetto era proprio qui sopra: quando un
   alimento non aveva un sostituto dedicato in SOSTITUTI, si pescava
   dalla lista piatta dei ripieghi — che comincia con «petto di
   pollo». Cosi' un contorno diventava un secondo, e la persona
   riceveva un piatto che non era piu' il piatto: cambiavano le
   calorie, i macro, il senso della cena.

   Il ripiego adesso conosce le FAMIGLIE: una verdura si sostituisce
   con una verdura, la frutta con la frutta, un cereale con un
   cereale. La lista piatta resta in fondo, come ultima spiaggia —
   meglio un pollo di un piatto vuoto — ma ci si arriva solo quando la
   famiglia non ha niente di sicuro da offrire.

   Le famiglie sono scritte a mano ed elencano solo cibi comuni: non
   e' una tassonomia, e' una rete di sicurezza. Chi non e' in nessuna
   famiglia prende la lista piatta, come prima. */
const FAMIGLIE={
  verdura:["pomodoro","pomodori","pomodorini","zucchine","zucchina","melanzane","melanzana",
    "peperoni","peperone","carote","carota","spinaci","broccoli","cavolfiore","cavolo","verza",
    "insalata","lattuga","rucola","radicchio","finocchi","finocchio","sedano","cetrioli","cetriolo",
    "zucca","funghi","fungo","porri","porro","cipolla","cipolle","aglio","asparagi","carciofi",
    "bietole","cime di rapa","fagiolini","piselli","verdure","ortaggi","olive"],
  frutta:["mela","mele","pera","pere","banana","banane","fragole","fragola","kiwi","arancia","arance",
    "mandarini","pesca","pesche","albicocche","susine","prugne","uva","ananas","melone","anguria",
    "mirtilli","lamponi","more","frutti di bosco","ciliegie","fichi","cachi","melograno","frutta"],
  proteina:["pollo","petto di pollo","tacchino","manzo","vitello","maiale","agnello","coniglio",
    "bresaola","prosciutto","prosciutto cotto","prosciutto crudo","speck","salame","salsiccia","wurstel",
    "pesce","merluzzo","nasello","orata","branzino","sgombro","salmone","tonno","alici","sardine",
    "platessa","gamberi","calamari","seppie","cozze","vongole","uova","uovo","frittata"],
  cereale:["pane","pasta","riso","patate","patata","farro","orzo","avena","mais","polenta","quinoa",
    "cous cous","couscous","gnocchi","piadina","cracker","gallette","fette biscottate","grissini",
    "cereali","pizza","panino","tortilla","bulgur","miglio"],
  latticino:["latte","yogurt","formaggio","formaggi","mozzarella","ricotta","stracchino","robiola",
    "scamorza","provola","caciotta","feta","parmigiano","grana","pecorino","burro","panna","kefir"],
  legume:["ceci","lenticchie","fagioli","cannellini","borlotti","fave","soia","tofu","tempeh",
    "edamame","legumi","hummus"],
  guscio:["noci","nocciole","mandorle","pistacchi","anacardi","pinoli","semi di zucca","semi di girasole",
    "semi di lino","semi di sesamo","frutta secca","arachidi"],
  grasso:["olio","olio evo","olio extravergine","burro di arachidi","maionese","margarina"],
  bevanda:["vino","birra","caffè","tè","succo","spremuta","bibita","cola","aperitivo"]};

/* I ripieghi, famiglia per famiglia: cibi comuni, semplici e quasi mai
   esclusi. Ordinati dal piu' neutro al piu' caratterizzato, perche' il
   primo che passa il controllo di sicurezza e' quello che vince. */
const RIPIEGO_FAM={
  verdura:["zucchine","carote","spinaci","insalata","broccoli"],
  frutta:["mela","pera","banana","arancia"],
  /* dopo le animali ci sono le vegetali: per chi non mangia carne il
     primo candidato sicuro dev'essere un alimento vero, non il vuoto
     che resta quando nessun ripiego passa il controllo (27/08) */
  proteina:["petto di pollo","tacchino","uova","merluzzo","ceci","lenticchie","tofu"],
  cereale:["riso","patate","pane","avena"],
  latticino:["yogurt bianco","ricotta","formaggio fresco","yogurt di soia","bevanda di soia"],
  legume:["ceci","lenticchie","fagioli"],
  guscio:["semi di zucca","semi di girasole"],
  grasso:["olio EVO"],
  bevanda:["acqua"]};

/* A quale famiglia appartiene un alimento vietato. Il confronto e' a
   parola intera e passa da formeDi, cosi' «pomodori» trova
   «pomodoro» — che e' esattamente il buco da cui il pollo e' entrato
   in un contorno di verdure. */
function famigliaDi(v){
  const x=String(v||"").toLowerCase().trim();
  if(!x)return null;
  const forme=(typeof formeDi==="function")?formeDi(x):[x];
  for(const fam of Object.keys(FAMIGLIE))
    if(FAMIGLIE[fam].some(k=>forme.some(f=>f===k||k.indexOf(f+" ")===0||k.endsWith(" "+f))))
      return fam;
  return null;}
window.famigliaDi=famigliaDi;

/* I candidati per un alimento vietato, nell'ordine giusto: prima il
   sostituto dedicato, poi la sua famiglia, e solo alla fine la lista
   piatta. */
function ripieghiPer(v){
  const fam=famigliaDi(v);
  const suoi=(fam&&RIPIEGO_FAM[fam])?RIPIEGO_FAM[fam]:[];
  return suoi.concat(RIPIEGO_FAMIGLIA.filter(x=>suoi.indexOf(x)<0));}
window.ripieghiPer=ripieghiPer;

/* ── LA RIPARAZIONE DI UNA DESCRIZIONE ────────────────────────────
   Torna {d, cambi} — la descrizione nuova e cosa è stato scambiato.
   Si gira più volte: un piatto può contenere più di un divieto, e
   sostituendone uno può affiorare quello dopo. */
/* ── E L'ITALIANO DEVE RESTARE ITALIANO ───────────────────────────
   Uno scambio fatto a parole secche produce «fiocchi d'riso», «pasta
   al zucchine», «yogurt senza lattosio greco»: sicuro, e scritto da
   una macchina. Un piano che si legge male non lo segue nessuno, e la
   prima cosa che una persona vede di questa riparazione è proprio la
   frase. Quindi lo scambio conosce tre forme, e sceglie la sua:
   1. IL SOSTITUTO È LO STESSO CIBO, QUALIFICATO («yogurt» → «yogurt
      senza lattosio»): la qualifica si appende DOPO il nome e il suo
      aggettivo — «yogurt greco senza lattosio», non «yogurt senza
      lattosio greco».
   2. LA PAROLA HA UNA PREPOSIZIONE DAVANTI (al, di, d', all', con…):
      si sostituisce PREPOSIZIONE E PAROLA con «con <sostituto>» —
      «pasta al pomodoro» → «pasta con zucchine». Così non si deve
      indovinare genere e numero, che è dove queste cose si rompono.
   3. ALTRIMENTI si scambia la parola e basta. */
/* «e» NON sta in questa lista: è una congiunzione, non una
   preposizione. Inghiottendola, «pane e burro» diventava «pane con
   olio» invece di «pane e olio» — una virgola di differenza che si
   sente leggendo. Le preposizioni di appartenenza («di», «d'»)
   restano «di» dopo lo scambio: «fiocchi d'avena» → «fiocchi di
   riso», non «fiocchi con riso». */
const PREP_DI="(?:di|d'|del|dello|della|dei|degli|delle|dell')";
const PREP_PRIMA="(?:con|senza|di|del|dello|della|dei|degli|delle|d'|dell'|a|al|allo|alla|ai|agli|alle|all'|in|nel|nello|nella|nei|negli|nelle|nell'|il|lo|la|i|gli|le|l'|un|uno|una|un')";
/* aggettivi che appartengono al cibo VECCHIO: dopo lo scambio non
   hanno più senso e si tolgono. Lista corta apposta: si tolgono solo
   quelli inequivocabili. */
/* Le qualifiche del cibo VECCHIO se ne vanno col cibo vecchio. «Senza
   lattosio» dopo uno scambio è la più insidiosa: la bevanda di soia
   non ha bisogno di essere delattosata, e leggerlo fa pensare che il
   piatto sia stato scritto da una macchina — che è esattamente quello
   che è successo (27/08). */
const AGG_DEL_VECCHIO=["fondente","stagionato","stagionata","delattosato","delattosata","greco","greca",
  "senza lattosio","senza glutine"];
/* ── LA RIPARAZIONE ORA CONOSCE GLI ASSOLUTI (27/08) ──────────────
   Riceveva UNA lista sola e la trattava tutta come divieti normali,
   cioè con le esenzioni attive. Per un allergico al latte voleva dire
   che «yogurt senza lattosio» non veniva nemmeno riparato: la
   validazione lo segnalava, la riparazione lo lasciava lì. Adesso gli
   assoluti — allergie e dieta di riferimento — hanno un argomento
   loro e valgono sul testo grezzo. */
function riparaDesc(desc,vietati,assoluti){
  let d=String(desc||""),cambi=[];
  const esc2=x=>x.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  for(let giro=0;giro<8;giro++){
    const v=vietatoDentro(d,vietati,assoluti);
    if(!v)break;
    /* dedicato → famiglia → lista piatta: una verdura non diventa un
       secondo di carne solo perche' nessuno le aveva scritto un
       sostituto suo. */
    const cand=(SOSTITUTI[v]||[]).concat(ripieghiPer(v));
    /* il sostituto deve essere sicuro per QUESTA persona: si scorre
       finché uno passa. Un intollerante al lattosio E alla soia non
       può ricevere lo yogurt di soia. */
    const buono=cand.find(c=>!vietatoDentro(c,vietati,assoluti));
    const P="(?:"+formeDi(v).map(esc2).join("|")+")";
    const prima=d;
    if(buono&&buono.toLowerCase().indexOf(v.toLowerCase()+" ")===0){
      /* forma 1 · stesso cibo, qualificato */
      const qual=buono.slice(v.length).trim();
      d=d.replace(new RegExp("("+P+")(\\s+[a-zàèéìòù]+)?(?![a-zàèéìòù])","i"),
        (t,parola,agg)=>parola+(agg||"")+" "+qual);
    }else if(buono){
      /* forma 2 · c'è una preposizione davanti: si riscrive «con …» */
      const conDi=new RegExp("(^|[^a-zàèéìòù])"+PREP_DI+"\\s*"+P+"(?![a-zàèéìòù])","i");
      const conPrep=new RegExp("(^|[^a-zàèéìòù])"+PREP_PRIMA+"\\s*"+P+"(?![a-zàèéìòù])","i");
      if(conDi.test(d))d=d.replace(conDi,(t,pre)=>pre+"di "+buono);
      else if(conPrep.test(d))d=d.replace(conPrep,(t,pre)=>pre+"con "+buono);
      /* forma 3 · scambio secco */
      else{
        d=d.replace(new RegExp("(^|[^a-zàèéìòù])("+P+")(?![a-zàèéìòù])","i"),(t,pre)=>pre+buono);
        /* «Frittata di zucchine» → «Ceci di zucchine» non è italiano:
           quando si scambia la testa di un piatto, il «di» che la
           legava al resto diventa un «con». Si tocca solo il «di» che
           sta SUBITO dopo il sostituto appena messo. */
        d=d.replace(new RegExp("("+esc2(buono)+")\\s+di\\s+","i"),"$1 con ");}
    }else{
      /* nessun sostituto sicuro: si toglie la parola con la sua
         preposizione, se ce l'ha. Il piatto resta sicuro e leggibile,
         e il segno «adattato» lo dichiara. */
      const conPrep=new RegExp("(^|[^a-zàèéìòù])"+PREP_PRIMA+"\\s*"+P+"(?![a-zàèéìòù])","i");
      d=conPrep.test(d)?d.replace(conPrep,"$1")
                       :d.replace(new RegExp("(^|[^a-zàèéìòù])("+P+")(?![a-zàèéìòù])","i"),"$1");
    }
    if(d===prima){cambi.push({da:v,a:null});break;}   /* non sostituibile: si esce e lo dice */
    /* gli aggettivi del cibo vecchio se ne vanno col cibo vecchio */
    if(buono&&buono.toLowerCase().indexOf(v.toLowerCase())!==0)
      AGG_DEL_VECCHIO.forEach(a=>{
        d=d.replace(new RegExp("("+esc2(buono)+")\\s+"+a+"(?![a-zàèéìòù])","i"),"$1");});
    d=d.replace(/\s{2,}/g," ").replace(/\s+([,.;)])/g,"$1").replace(/\(\s+/g,"(").trim();
    d=d.replace(/^(?:e|con|di|al|alla|allo|ai|agli|alle)\s+/i,"");
    /* se la frase cominciava con la maiuscola, ricomincia con la
       maiuscola: uno scambio in prima parola non deve farla cadere */
    if(/^[A-ZÀÈÉÌÒÙ]/.test(String(desc||""))&&/^[a-zàèéìòù]/.test(d))
      d=d.charAt(0).toUpperCase()+d.slice(1);
    cambi.push({da:v,a:buono||null});
  }
  return {d:d,cambi:cambi};}

/* ── LA RIPARAZIONE DI UNA SETTIMANA ──────────────────────────────
   Passa su tutti i pasti, ripara quelli che contengono un divieto e
   torna l'elenco di cosa ha cambiato. NON butta via niente: è il
   punto di tutta questa storia. */
function riparaSettimana(days,vietati,assoluti){
  const fatti=[];
  (days||[]).forEach((d,i)=>{
    if(!d||!Array.isArray(d.meals))return;
    d.meals.forEach(m=>{
      if(!m||!m.d)return;
      /* IL CANCELLO GUARDAVA SOLO METÀ DEI DIVIETI (27/08). Questa
         riga decide se un piatto va riparato, e non passava gli
         ASSOLUTI: un allergene — o un alimento vietato dalla dieta di
         riferimento — non entrava nemmeno in riparazione, perché il
         cancello non lo vedeva. La riparazione sotto era giusta e non
         veniva mai chiamata: è il difetto più insidioso di tutti,
         perché il motore funziona e il risultato non cambia. */
      if(!vietatoDentro(m.d,vietati,assoluti))return;
      const r=riparaDesc(m.d,vietati,assoluti);
      if(!r.cambi.length)return;
      m.d=r.d;m.adattato=true;
      r.cambi.forEach(c=>fatti.push({giorno:i,pasto:m.n||"",da:c.da,a:c.a}));});});
  return fatti;}
window.riparaDesc=riparaDesc;window.riparaSettimana=riparaSettimana;
window.alternativeRiga=alternativeRiga;

/* ── LA VARIETÀ, IN UN POSTO SOLO ─────────────────────────────────
   Era scritta dentro genPlanAI e ricopiata (male) dentro wizGenDays:
   la strada del PRIMO piano — quella dell'onboarding, cioè quella che
   quasi tutti percorrono — aveva «nessun piatto si ripete» a mano,
   cioè varietà alta sempre, qualunque cosa la persona avesse scelto.
   Adesso la regola è una funzione, e le due strade la chiamano. */
function rigaVarieta(v){
  const vv=v||"media";
  if(vv==="bassa")return ' VARIETÀ BASSA richiesta: usa in tutta la settimana al massimo 3 fonti proteiche, 3 fonti di carboidrati e 4-5 verdure IN TOTALE, facendole tornare più volte cambiando solo la preparazione e gli abbinamenti. La spesa deve restare corta e i piatti semplici e veloci. Puoi ripetere lo stesso piatto anche 2-3 volte nella settimana, ma MAI due giorni di fila.';
  if(vv==="alta")return ' VARIETÀ ALTA richiesta: ogni giorno piatti diversi, e nessun piatto si ripete nella settimana, nemmeno in variante simile.';
  return ' VARIETÀ MEDIA: alterna senza esagerare, riusa gli stessi ingredienti base in preparazioni diverse così la spesa resta gestibile; al massimo 5 fonti proteiche in tutta la settimana; lo stesso piatto non torna mai due giorni di fila.';}
window.rigaVarieta=rigaVarieta;

/* ── I FARMACI, DETTI AL MODELLO ──────────────────────────────────
   Non si discute la terapia: si dice cosa vuole a tavola. Le voci
   scritte a mano dalla persona passano come sono, dichiarate per
   quello che sono — una nota, non una regola che sappiamo tradurre. */
function farmaciRiga(testo){
  const t=cibNorm(testo);
  if(!t.trim())return "";
  const note=[];
  (typeof FARM_LIST!=="undefined"?FARM_LIST:[]).forEach(f=>{
    if(t.indexOf(cibNorm(f.k))>-1||t.indexOf(cibNorm(f.l))>-1)note.push(f.ai);});
  const testa=' TERAPIE IN CORSO, da rispettare a tavola (non commentarle e non suggerire di cambiarle): '+testo+'.';
  return note.length?(testa+' In pratica: '+note.join("; ")+'.'):testa;}
window.farmaciRiga=farmaciRiga;

/* Cosa è stato adattato, detto alla persona. Una frase sola per
   scambio, e mai più di sei righe: un elenco lungo non si legge, e
   quello che conta è che la sostituzione sia stata FATTA e dichiarata.
   Le voci si contano per coppia (da → a), non per pasto: lo stesso
   scambio ripetuto in quattro giorni è UNA cosa da dire, non quattro. */
function adattatiTesto(adattati){
  const per={};
  (adattati||[]).forEach(x=>{
    const k=x.da+"→"+(x.a||"");
    (per[k]=per[k]||{da:x.da,a:x.a,n:0}).n++;});
  const righe=Object.values(per).slice(0,6).map(x=>x.a
    ? "· "+trh("{v1} → {v2}",{v1:x.da,v2:x.a})+(x.n>1?" ("+x.n+")":"")
    : "· "+trh("{v1}: tolto, non c'era un'alternativa sicura",{v1:x.da})+(x.n>1?" ("+x.n+")":""));
  const altre=Object.keys(per).length-righe.length;
  return tr("Ho adattato qualche piatto ai tuoi vincoli:")+"\n\n"+righe.join("\n")+
    (altre>0?"\n"+trh("… e altri {v1} scambi",{v1:altre}):"")+
    "\n\n"+tr("Le grammature restano quelle del piatto di partenza: se vuoi rifarle sui tuoi numeri, dal Piano c'è «Ricalibra».");}
window.adattatiTesto=adattatiTesto;

/* ── L'ALCOL È VIETATO PER TUTTI, SEMPRE (founder, 25/08) ─────────
   Non è un'intolleranza da dichiarare: è una regola della casa. Il
   prompt lo dice al modello; questa lista lo verifica in codice, con
   lo stesso peso della sicurezza — un piano con lo spritz dentro non
   si attiva, si rifà.
   Parole intere e nomi inequivocabili: «amaro» NON c'è (è anche il
   cacao), «marsala» e «aperitivo» nemmeno (piatti e usi analcolici li
   contengono). Una rete che scatta a vuoto viene disattivata. */
const ALCOL_VIETATI=["vino","birra","prosecco","spumante","champagne","spritz",
  "cocktail","liquore","grappa","gin","vodka","whisky","whiskey","rum","sidro alcolico","sangria"];

/* Un'esenzione dichiarata NON è una violazione: «pane senza glutine» e
   «yogurt delattosato» sono la risposta giusta, non l'errore. Senza
   queste righe il controllo rifiuterebbe proprio i piatti costruiti
   bene per quella persona, e lo farebbe due volte di fila.
   Si CANCELLA la forma ammessa dal testo prima di cercare, invece di
   esentare tutta la descrizione: in «latte di mandorla + burro» il
   latte vegetale va perdonato e il burro no.
   Il taglio si ferma a DUE parole prima di «senza…»: quanto basta per
   «fette biscottate senza glutine», non tanto da nascondere un altro
   alimento che stesse lì accanto. */
/* ── L'ESENZIONE NON DEVE CANCELLARE L'ALTERNATIVA ────────────────
   Trovato il 26/08 sera da una controprova che si rifiutava di
   diventare rossa. Le esenzioni della v13.96 cancellavano l'INTERA
   frase: «yogurt di soia» spariva dal testo, e con lei spariva la
   parola «soia». Per chi è intollerante al lattosio era giusto —
   per chi è intollerante al lattosio E ALLA SOIA era un buco: lo
   yogurt di soia passava il controllo di sicurezza.
   Adesso l'esenzione toglie solo il cibo PERDONATO e lascia in piedi
   l'ingrediente alternativo, che resta esposto ai divieti di questa
   persona. «Yogurt di soia» diventa « di soia»: lo yogurt è
   perdonato, la soia no — e se la soia è vietata, si vede.
   Ogni voce è [regola, cosa resta]: il pezzo che resta è il gruppo
   catturato che nomina l'alternativa. */
const VIETATI_ESENTI=[
  [/(\S+\s+){0,2}senza (glutine|lattosio|uova|frutta secca)/g," "],
  [/(\S+\s+){0,2}(gluten ?free|delattosat\w*|deglutinat\w*)/g," "],
  [/privo di (glutine|lattosio)/g," "],
  /* qui il pezzo che resta è l'alternativa: mandorla, soia, riso… */
  [/latte (?:di |d')(mandorl\w*|soia|riso|avena|cocco|nocciol\w*)/g," di $1 "],
  [/bevanda (?:vegetale|di (soia|mandorla|riso|avena|cocco))/g," di $1 "],
  /* ── LE VARIANTI VEGETALI NON SONO IL DIVIETO (v13.96) ──────────
     Il difetto che consegnava a TUTTI il piano di base. A un
     intollerante al lattosio il modello scrive — correttamente —
     «yogurt di soia», «gelato di soia», «burro di arachidi»: il
     controllo trovava la parola «yogurt», «gelato», «burro» e
     bocciava per sicurezza. Si rifaceva il giorno, il modello
     riproponeva un'altra variante vegetale (giusta anche quella),
     si ribocciava, e si ripiegava sul piano di base. Ogni volta.
     Il founder: «viene riutilizzato un piano fatto per un'altra
     persona» — era esattamente questo.
     La finestra di due parole salta i connettivi («panna e speck
     di soia» NON è esente: la congiunzione ferma la finestra). */
  [/(?:yogurt|gelato|formagg\w*|panna|besciamella|burro|latte|ricotta|mozzarella|mascarpone|stracchino|robiola|scamorza|provola|caciotta|feta|brie|cheddar|kefir|maionese|frittata)((?:\s+(?!e\b|con\b|o\b|in\b|al\b|alla\b)\S+){0,2})\s+(vegetal\w*|vegan\w*|di soia|di cocco|di mandorl\w*|di riso|d'avena|di avena|di anacardi|d'acqua|di ceci)/g," $1 $2 "],
  [/burro (?:di |d')(arachid\w*|mandorl\w*|anacard\w*|nocciol\w*|sesamo|semi)/g," di $1 "],
  [/(?:pane|pasta|pizza|biscott\w*|cracker\w*|grissin\w*|piadina)((?:\s+(?!e\b|con\b|o\b)\S+){0,2})\s+(di riso|di mais|di grano saraceno|di legumi|di lenticchie|di ceci|di quinoa)/g," $1 $2 "],
  [/farinata/g," "]];

/* minuscole, niente accenti: «pomodorì», «Pomodori» e «POMODORO» sono
   la stessa parola quando si cerca un divieto. */
function cibNorm(x){return String(x||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}

/* L'elenco delle parole vietate per QUESTA persona: quelle che ha
   scritto lei, più quelle che discendono dalle intolleranze dichiarate.
   Le voci troppo corte si buttano: una parola di due lettere comparirà
   dentro qualunque descrizione e bloccherebbe ogni piano per sempre. */
const VIETATI_RUMORE=["tenere","conto","nessuna","nessuno","niente","alcuni","altri","varie","cibi","cibo","alimenti","evitare","assolutamente","poco","molto","sono","anche","tutto","tutti","della","delle","degli","come"];
/* Gli alimenti vietati da un'ALLERGIA: lista a parte, perché su questi
   nessuna esenzione vale. Torna sempre un array, anche vuoto. */
/* I divieti della DIETA DI RIFERIMENTO viaggiano insieme agli allergeni,
   non insieme alle intolleranze, e la ragione è la stessa: **su di loro
   non vale nessuna esenzione**. «Yogurt senza lattosio» è la risposta
   giusta a un intollerante e resta latte per un vegano. Gli assoluti si
   cercano sul testo GREZZO, prima che le esenzioni lo ripuliscano — è
   il canale costruito per le allergie il 26/08, e la dieta di
   riferimento è lo stesso tipo di divieto. */
function allergeniElenco(testoAllerg,tipo){
  const out=new Set();
  vietatiDaDieta(tipo).forEach(v=>out.add(cibNorm(v)));
  const t=cibNorm(testoAllerg);
  if(!t.trim())return [...out].sort((a,b)=>b.length-a.length);
  Object.keys(VIETATI_DA_ALLERG).forEach(k=>{
    if(t.indexOf(cibNorm(k))>-1)VIETATI_DA_ALLERG[k].forEach(v=>out.add(cibNorm(v)));});
  /* quello che la persona ha scritto a mano fra le allergie vale come
     allergene, non come intolleranza: nel dubbio si stringe */
  cibNorm(testoAllerg).split(/[,;\n]/).forEach(p=>{
    const x=p.trim();
    if(x.length>=4&&x.indexOf(":")<0&&x.split(/\s+/).length<=4&&VIETATI_RUMORE.indexOf(x)<0)out.add(x);});
  /* la voce più lunga vince: «petto di pollo» prima di «pollo», o la
     riparazione scambia la parola dentro la frase invece della frase
     intera e produce «Petto di ceci» */
  return [...out].sort((a,b)=>b.length-a.length);}
window.allergeniElenco=allergeniElenco;

/* ── «VEGANA» NON ERA UN DIVIETO PER IL CONTROLLO (27/08) ─────────
   Il controllo di sicurezza costruiva la lista dei vietati SOLO da
   «da evitare assolutamente» e dalle intolleranze. Il tipo di dieta —
   vegana, vegetariana, pescetariana — non lo guardava nessuno: se il
   modello metteva il pollo a una vegana, il piano passava.

   Ora la dieta di riferimento entra nella lista come ci entra
   un'intolleranza. Non è una preferenza: per chi l'ha scelta è la
   ragione per cui usa l'app, e un piano che la ignora è un piano di
   un'altra persona.

   Il tipo si legge da `S.diet` quando chi chiama non lo passa: così la
   rete c'è ovunque, senza dover ricordarsi di aggiungere un argomento
   in ognuno dei punti che chiamano questa funzione. */
const VIETATI_DA_DIETA={
  vegana:["carne","manzo","vitello","maiale","agnello","pollo","petto di pollo","tacchino","coniglio",
    "prosciutto","prosciutto cotto","prosciutto crudo","bresaola","speck","salame","salsiccia","wurstel","mortadella","pancetta","guanciale",
    "pesce","merluzzo","nasello","orata","branzino","sgombro","salmone","tonno","alici","acciughe","sardine","platessa",
    "gamberi","gamberetti","calamari","seppie","cozze","vongole","polpo",
    "uova","uovo","frittata","omelette","maionese",
    "latte","yogurt","formaggio","formaggi","mozzarella","ricotta","parmigiano","grana","pecorino","burro","panna","mascarpone","stracchino","scamorza","provola","feta",
    "miele","strutto","lardo","brodo di carne","brodo di pollo"],
  vegetariana:["carne","manzo","vitello","maiale","agnello","pollo","petto di pollo","tacchino","coniglio",
    "prosciutto","prosciutto cotto","prosciutto crudo","bresaola","speck","salame","salsiccia","wurstel","mortadella","pancetta","guanciale",
    "strutto","lardo","brodo di carne","brodo di pollo"],
  pescetariana:["carne","manzo","vitello","maiale","agnello","pollo","petto di pollo","tacchino","coniglio",
    "prosciutto","prosciutto cotto","prosciutto crudo","bresaola","speck","salame","salsiccia","wurstel","mortadella","pancetta","guanciale",
    "strutto","lardo","brodo di carne","brodo di pollo"]};
/* La vegetariana ammette o esclude pesce e uova secondo la scelta fatta
   nella schermata: si aggiungono qui, perché senza sarebbero un divieto
   che la persona non ha chiesto. */
function vietatiDaDieta(tipo){
  const t=String(tipo==null?((S.diet&&S.diet.tipo)||""):tipo).toLowerCase();
  const base=(VIETATI_DA_DIETA[t]||[]).slice();
  if(t==="vegetariana"){
    if(!(S.diet&&S.diet.vegPesce))base.push("pesce","merluzzo","nasello","orata","branzino","sgombro","salmone","tonno","alici","acciughe","sardine",
      "gamberi","gamberetti","calamari","seppie","cozze","vongole","polpo");
    if(S.diet&&S.diet.vegUova===false)base.push("uova","uovo","frittata","omelette","maionese");}
  return base;}
window.vietatiDaDieta=vietatiDaDieta;

function vietatiElenco(testoNo,testoIntol){
  const out=new Set();
  const pezzi=cibNorm(testoNo).split(/[,;\n]|\bassolutamente\b/);
  pezzi.forEach(p=>{
    const s=p.trim().replace(/^(e|o|di|il|la|le|i|gli|lo|un|una)\s+/,"");
    if(s.length<4)return;
    if(VIETATI_RUMORE.indexOf(s)>-1)return;
    /* un alimento non ha mai i due punti dentro: se ci sono, quella
       voce è una frase («tenere conto di: reflusso») e cercarla dentro
       un piatto non troverebbe mai niente — o peggio, troverebbe */
    if(s.indexOf(":")>-1)return;
    /* una voce di più di quattro parole non è un alimento: è una frase,
       e cercarla dentro un piatto non troverebbe mai niente */
    if(s.split(/\s+/).length>4)return;
    out.add(s);});
  const ti=cibNorm(testoIntol);
  Object.keys(VIETATI_DA_INTOL).forEach(k=>{
    if(ti.indexOf(cibNorm(k))>-1)VIETATI_DA_INTOL[k].forEach(v=>out.add(cibNorm(v)));});
  /* ── LA VOCE PIÙ LUNGA VIENE PRIMA (27/08) ────────────────────────
     Chi cerca si ferma alla PRIMA voce che trova, e con «pollo» prima
     di «petto di pollo» la riparazione produceva «Petto di ceci»:
     scambiava la parola dentro la frase invece della frase intera.
     Ordinando dal più lungo al più corto, «petto di pollo» vince su
     «pollo» e il piatto diventa «Ceci 150g con riso», che è italiano. */
  return [...out].sort((a,b)=>b.length-a.length);}

/* ── IL PLURALE SFUGGIVA AL DIVIETO (trovato il 26/08 sera) ────────
   Le liste sono scritte a mano, e a mano si scrive una forma sola:
   «pomodoro». Il confronto è a parola intera, quindi «insalata di
   POMODORI» passava il controllo di sicurezza senza che nessuno
   dicesse niente. Non è un fastidio: è un falso NEGATIVO, cioè
   esattamente il verso in cui questo controllo non deve sbagliare —
   un alimento vietato che arriva a schermo.
   Le forme si generano invece di scriverle: -o↔-i, -a↔-e, -e→-i.
   NON si fa -e→-a in generale, perché «pesce» diventerebbe «pesca» e
   a un allergico al pesce spariterebbero le pesche: si fa solo dopo
   -le, -ne, -re, -te, dove il rischio non c'è («fragole»→«fragola»,
   «melanzane»→«melanzana»). Le forme che non esistono nella lingua
   non fanno danno: semplicemente non le incontra nessuno. */
function formeDi(v){
  const out=[v];
  const agg=x=>{if(x.length>3&&out.indexOf(x)<0)out.push(x);};
  const b=v.slice(0,-1),f=v.slice(-1);
  if(f==="o")agg(b+"i");
  else if(f==="a")agg(b+"e");
  else if(f==="e"){agg(b+"i");if(/(le|ne|re|te)$/.test(v))agg(b+"a");}
  else if(f==="i"){agg(b+"o");agg(b+"e");}
  return out;}
/* Confronto a parole intere: «pane» non deve trovarsi dentro
   «panettone» né «uva» dentro «uvetta» per caso. */
function vietatoDentro(desc,vietati,assoluti){
  const grezzo=cibNorm(desc);
  let t=grezzo;
  VIETATI_ESENTI.forEach(e=>{t=t.replace(e[0],e[1]);});
  const esc3=x=>x.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const cerca=(lista,testo)=>{
    for(const v of lista||[]){
      const forme=formeDi(v).map(esc3).join("|");
      const re=new RegExp("(^|[^a-z])(?:"+forme+")([^a-z]|$)");
      if(re.test(testo))return v;}
    return null;};
  /* ── GLI ALLERGENI SI CERCANO SUL TESTO GREZZO ────────────────────
     Nessuna esenzione vale su un'allergia: «latte senza lattosio» è
     sicuro per chi non tollera il lattosio e VIETATO per chi è
     allergico al latte, perché la proteina è ancora tutta lì. Cercare
     anche gli allergeni sul testo ripulito dalle esenzioni avrebbe
     fatto passare esattamente il piatto che manda al pronto soccorso.
     Si guardano per primi, e senza sconti. */
  const a=cerca(assoluti,grezzo);
  if(a)return a;
  return cerca(vietati,t);}
window.formeDi=formeDi;

/* Un numero è un numero. `Math.round("circa 400")` è NaN, e il `||0`
   della normalizzazione lo trasforma in ZERO senza dire niente: il
   totale del giorno cala e nessuno lo sa. Questa funzione è il punto
   in cui quel silenzio finisce. */
function numPulito(x){
  if(typeof x==="number")return isFinite(x)?x:null;
  const s=String(x==null?"":x).trim().replace(",",".");
  if(!/^-?\d+(\.\d+)?$/.test(s))return null;
  const n=parseFloat(s);
  return isFinite(n)?n:null;}

/* La firma di un piatto: le parole che lo identificano, senza
   grammature e senza ordine. «Pollo 200g + patate» e «Patate + pollo
   220g» sono lo stesso piatto, ed è giusto che il controllo lo veda. */
function piattoFirma(d){
  const t=cibNorm(d).replace(/\d+([.,]\d+)?\s*(g|gr|kg|ml|cl|l|pz)?/g," ");
  const w=t.split(/[^a-z]+/).filter(x=>x.length>=4);
  return [...new Set(w)].sort().join(" ");}

/* ═══ IL CONTRATTO DELLA SETTIMANA ═══════════════════════════════
   La passata di verifica finale è chiesta DENTRO il prompt — non
   sostituisce il controllo in JavaScript, gli fa risparmiare un
   rifacimento quando il modello si accorge da solo. */
function weekJSONContract(giorni,conSpesa){
  return aiLingua()+' PRIMA DI RISPONDERE, RILEGGI QUELLO CHE HAI SCRITTO e correggilo dove serve:'+
    ' rifai la somma delle calorie e delle proteine di ogni giorno e verifica che stiano nel target dichiarato;'+
    ' verifica che nessun alimento vietato o incompatibile con le intolleranze sia finito in una descrizione;'+
    ' verifica che nessun piatto si ripeta; verifica che ogni giorno abbia tutti i pasti richiesti;'+
    ' verifica che ogni pasto abbia una fonte proteica e che nessun pasto sia fatto solo di carboidrati raffinati e zucchero.'+
    ' Rispondi SOLO con un oggetto JSON, senza alcun testo intorno: {"days":[{"day":"'+giorni[0]+'","ctx":"contesto breve del giorno","meals":[{"n":"Colazione","t":"08:00","type":"norm","d":"descrizione con grammature","k":numero,"p":numero,"c":numero,"f":numero,"fib":numero,"z":numero}]}]'+
    (conSpesa?',"spesa":[["Categoria",["prodotto con la quantità totale della settimana"]]]':'')+
    '} dove "days" contiene ESATTAMENTE sette oggetti, in quest\'ordine: '+giorni.join(", ")+
    '; type vale "norm", "mensa" oppure "free"; e ogni valore numerico è un NUMERO, senza unità di misura e senza parole intorno.'+
    /* ── L'UNITÀ DEI CAMPI NUMERICI, DETTA QUI E NON ALTROVE (28/08) ─
       Il contratto è il posto dove si dichiara l'unità di un campo:
       chi legge questa riga sta per scrivere quei numeri. La riga
       vale per tutti i paesi, imperiali compresi — `unitaForAI()`
       dice la stessa cosa dal lato delle regole, e le due si
       rinforzano invece di contraddirsi. Senza questa riga, un
       modello a cui è stato appena chiesto di scrivere in once ha
       una ragione per metterle anche qui. */
    ' I campi numerici sono SEMPRE nelle stesse unità, in ogni paese: "k" in kcal; "p", "c", "f", "fib" e "z" in GRAMMI. Mai once, mai libbre, mai altre unità in questi campi, qualunque unità si usi nelle descrizioni.'+
    (conSpesa?' "spesa" è la lista della spesa ricavata da questi sette giorni, raggruppata in queste categorie, nell\'ordine dato e saltando quelle vuote: '+JSON.stringify(SHOP_CATS)+'. Ogni voce porta il nome del prodotto e la quantità totale della settimana, senza formati commerciali e senza numero di confezioni. I pasti di tipo "mensa" e "free" NON entrano nella spesa.':'');}

/* ═══ LA DOMANDA ═════════════════════════════════════════════════
   Stesso doppio tentativo di askDayAI: un JSON storto al primo colpo
   è un incidente, non un guasto. Si accetta anche un array nudo — se
   il modello dimentica l'involucro, il piano c'è lo stesso. */
async function askWeekAI(q){
  let w=null,lastE=null;
  for(let att=0;att<2&&!w;att++){
    try{const t=await aiAsk(q,"piano");const o=parseAIJSON(t);
      const obj=Array.isArray(o)?{days:o}:o;
      if(obj&&Array.isArray(obj.days)&&obj.days.length)w=obj;
    }catch(e){lastE=e;}}
  aiHealth("piano",!!w);
  return {week:w,err:lastE};}

/* ═══ LA VALIDAZIONE ═════════════════════════════════════════════
   Lavora sui dati GREZZI, prima della normalizzazione: è lì che un
   «circa 400» è ancora riconoscibile per quello che è.
   Torna un elenco di giorni con quello che non va, in italiano: la
   stessa frase serve a chi legge e alla seconda chiamata. */
function validaSettimana(days,r){
  r=r||{};
  const G=r.giorni||["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
  const toll=(r.tollPct==null?5:r.tollPct)/100;
  /* l'alcol si somma SEMPRE ai vietati della persona: è l'unica voce
     che non dipende da cosa ha dichiarato */
  const vietati=(r.vietati||[]).concat(ALCOL_VIETATI);
  /* gli allergeni si controllano a parte: nessuna esenzione vale */
  const allergeni=r.allergeni||[];
  const problemi=[],firme={};
  const arr=Array.isArray(days)?days:[];
  /* ── DUE PESI, E ADESSO CONTANO DAVVERO (25/08) ───────────────────
     `grave` = il giorno è INUTILIZZABILE così: manca, ha pasti in meno,
     numeri che non sono numeri, o dentro c'è un alimento escluso. Solo
     questo merita una seconda chiamata — che raddoppia l'attesa.
     Il resto (kcal fuori tolleranza, proteine basse, un piatto che
     torna) è un piano IMPERFETTO ma vero: si dichiara, e c'è
     «Ricalibra» che sistema le grammature senza rifare niente.
     Prima OGNI problema faceva ripartire una chiamata: la validazione
     severa quanto il prompt trasformava «una chiamata sola» in due
     quasi sempre, e l'attesa raddoppiava per difetti da un avviso. */
  for(let i=0;i<G.length;i++){
    const d=arr[i],motivi=[],gravi=[],sicurezza=[];
    if(!d||!Array.isArray(d.meals)||!d.meals.length){
      problemi.push({i:i,giorno:G[i],motivi:[tr("il giorno non è arrivato")],sicuro:true,grave:true});
      continue;}
    /* i pasti attesi — senza, il giorno non è quello chiesto */
    if(r.slots&&r.slots.length){
      const nomi=d.meals.map(m=>cibNorm(m.n));
      const mancanti=r.slots.filter(s=>nomi.indexOf(cibNorm(s))<0);
      if(mancanti.length)gravi.push(trh("mancano questi pasti: {v1}",{v1:mancanti.join(", ")}));
    }else if(r.nPasti&&d.meals.length!==+r.nPasti){
      gravi.push(trh("i pasti sono {v1} invece di {v2}",{v1:d.meals.length,v2:r.nPasti}));}
    /* i numeri, e la somma */
    let k=0,p=0,storti=0;
    d.meals.forEach(m=>{
      const mk=numPulito(m.k),mp=numPulito(m.p);
      if(mk==null||mp==null)storti++;
      k+=mk||0;p+=mp||0;});
    if(storti)gravi.push(trh("{v1} pasti hanno calorie o proteine che non sono numeri",{v1:storti}));
    if(r.kcal>0&&Math.abs(k-r.kcal)>r.kcal*toll)
      motivi.push(trh("il totale è {v1} kcal invece di circa {v2}",{v1:Math.round(k),v2:r.kcal}));
    if(r.prot>0&&p<r.prot)
      motivi.push(trh("le proteine sono {v1} g, sotto il minimo di {v2} g",{v1:Math.round(p),v2:r.prot}));
    /* ── UN PASTO SQUILIBRATO SI VEDE DAI SUOI NUMERI (27/08) ─────
       «Aggiungi dei dettagli per fare in modo che non venga creato un
       piano con pasti con voti scarsi.»

       Il voto vero lo dà il modello DOPO, sul piatto già scritto — e
       chiedere un secondo giudizio a metà generazione costerebbe una
       chiamata per pasto. Ma il caso che ha prodotto il 45% non ha
       bisogno di un'opinione: lo dicono i numeri che il modello ci ha
       già mandato. «200 g yogurt di soia, 60 g gallette, 15 g miele»
       sono 390 kcal con 11 g di proteine, cioè 2,8 g ogni 100 kcal:
       un pasto fatto quasi solo di carboidrati.

       Due reti, tarate sui pasti VERI del piano del founder, così non
       bocciano quello che è già buono:
       · pasto principale (dal 20% delle calorie del giorno in su):
         almeno 3,5 g di proteine ogni 100 kcal. La sua colazione
         riscritta ne ha 4,2 e passa; quella da 45 ne ha 2,8 e no.
       · pasto piccolo: può avere poche proteine — una banana con i
         semi di zucca ha preso 80 — ma non può essere solo zucchero:
         o proteine, o un grasso buono (frutta secca, semi).

       Sono soglie BASSE apposta: non devono scrivere il piano al posto
       del modello, devono impedire il pasto indifendibile. E non
       toccano mensa e pasti liberi, dove le grammature non esistono.

       ── PERCHÉ SONO «LIEVI» E NON «GRAVI» ────────────────────────
       Perché rifare un giorno costa una seconda chiamata, e la regola
       del 25/08 dice: «un piano imperfetto non raddoppia l'attesa — la
       seconda chiamata si paga solo per un giorno inutilizzabile o per
       la sicurezza». Un pasto sbilanciato è un difetto, non un piano
       inutilizzabile.
       La PREVENZIONE sta nel prompt (le linee guida, che ora arrivano
       anche al primo piano, più la forma del pasto); questa è la
       DICHIARAZIONE: se un pasto sbilanciato passa lo stesso, il piano
       lo dice invece di far finta di niente, e quel motivo viaggia col
       giorno se il giorno va rifatto per un'altra ragione.
       Se coi piani veri si vedrà che il modello continua a scrivere
       pasti indifendibili, la promozione a «grave» è una parola sola —
       ma è una decisione da prendere coi numeri in mano, sapendo che si
       paga in attesa. */
    if(r.kcal>0)d.meals.forEach(m=>{
      const t=(m.type||"norm");
      if(t!=="norm")return;
      const mk=numPulito(m.k),mp=numPulito(m.p),mf=numPulito(m.f);
      if(mk==null||mp==null||mk<=0)return;              /* già detto sopra */
      const nome=String(m.n||"").trim()||tr("un pasto");
      const principale=(mk>=r.kcal*0.20);
      if(principale){
        const per100=mp/mk*100;
        if(per100<3.5)
          motivi.push(trh("{v1}: {v2} g di proteine su {v3} kcal, troppo poche per un pasto principale",
            {v1:nome,v2:Math.round(mp),v3:Math.round(mk)}));
      }else if(mp<4&&(mf==null||mf<4)){
        motivi.push(trh("{v1}: solo carboidrati, senza proteine né grassi buoni",{v1:nome}));}});
    /* la sicurezza: un divieto dentro una descrizione */
    if(vietati.length||allergeni.length)d.meals.forEach(m=>{
      const v=vietatoDentro(m.d,vietati,allergeni);
      if(v)sicurezza.push(trh("«{v1}» in «{v2}»",{v1:v,v2:String(m.d||"").slice(0,40)}));});
    /* le ripetizioni, secondo la regola che il prompt ha DAVVERO
       chiesto a questa persona: chi ha scelto varietà bassa ha chiesto
       piatti che tornano, e rifiutarglieli sarebbe rifiutare la sua
       impostazione. */
    if(r.ripetizioni!=="libera")d.meals.forEach(m=>{
      if((m.type||"norm")!=="norm")return;                 /* mensa e liberi si ripetono per natura */
      const f=piattoFirma(m.d);if(!f)return;
      const pre=firme[f];
      if(pre!=null){
        const vicino=(i-pre)===1;
        if(r.ripetizioni==="nessuna"||vicino)
          motivi.push(trh("il piatto «{v1}» è già in {v2}",{v1:String(m.d||"").slice(0,34),v2:G[pre]}));}
      firme[f]=i;});
    if(sicurezza.length)gravi.push(trh("alimenti vietati o non tollerati: {v1}",{v1:sicurezza.join("; ")}));
    if(gravi.length||motivi.length)
      problemi.push({i:i,giorno:G[i],motivi:gravi.concat(motivi),
        sicuro:!sicurezza.length,grave:gravi.length>0});
  }
  const extra=arr.length>G.length?arr.length-G.length:0;
  return {ok:!problemi.length,problemi:problemi,extra:extra};}

/* ═══ LA LISTA DELLA SPESA CHE ARRIVA INSIEME AL PIANO ═══════════
   Se torna storta NON si rifà il piano: il piano è buono, e la spesa
   sa ricostruirsi da sola dagli ingredienti (buildShopFromPlan). Rifare
   sette giorni per una lista è il genere di spreco che poi si paga in
   attesa. */
/* ── «[object Object]» NELLA LISTA DELLA SPESA (founder, 27/08) ────
   Una schermata con nove righe, tutte uguali: «[object Object]».

   Il contratto chiede `[["Categoria",["prodotto con la quantità"]]]`,
   cioe' stringhe. Il modello ogni tanto risponde meglio di cosi' —
   `{"prodotto":"Petto di pollo","quantita":"1 kg"}` — e noi lo
   passavamo a `String(...)`, che su un oggetto produce esattamente
   quella parola. Non e' un errore del modello: e' una risposta piu'
   ricca del contratto, e chi legge deve saperla accogliere.

   Da qui in poi ogni voce passa da `voceSpesa`, che accetta una
   stringa, un numero o un oggetto e ne ricava una riga leggibile.
   Nome e quantita' hanno molti nomi possibili (nome/prodotto/n/item,
   qta/quantita/q/totale): si guardano tutti, e se nessuno c'e' si
   prendono i valori di testo dell'oggetto invece di buttare la voce.
   Una voce che non produce niente sparisce: meglio una riga in meno
   che una riga che non vuol dire nulla. */
function voceSpesa(y){
  if(y==null)return "";
  if(typeof y==="string")return y.trim();
  if(typeof y==="number")return String(y);
  if(Array.isArray(y))return y.map(voceSpesa).filter(Boolean).join(" ").trim();
  if(typeof y!=="object")return "";
  const pesca=(chiavi)=>{
    for(const k of chiavi){
      const v=y[k];
      if(typeof v==="string"&&v.trim())return v.trim();
      if(typeof v==="number")return String(v);}
    return "";};
  const nome=pesca(["nome","prodotto","n","item","name","alimento","voce","descrizione","d"]);
  const qta=pesca(["qta","quantita","quantità","q","qty","quantity","totale","tot","peso"]);
  const uni=pesca(["unita","unità","u","unit","um"]);
  const testo=[nome,[qta,uni].filter(Boolean).join(" ")].filter(Boolean).join(" ").trim();
  if(testo)return testo;
  /* ultimo ripiego: tutto quello che nell'oggetto e' leggibile */
  const resti=Object.keys(y).map(k=>y[k])
    .filter(v=>typeof v==="string"||typeof v==="number").map(String)
    .map(x=>x.trim()).filter(Boolean);
  return resti.join(" ").trim();}
window.voceSpesa=voceSpesa;

function normSpesaAI(arr){
  if(!Array.isArray(arr))return null;
  const pulita=arr.filter(x=>Array.isArray(x)&&x.length>=2&&Array.isArray(x[1])&&x[1].length)
    .map(x=>[cap(voceSpesa(x[0])||"Altro"),
             x[1].map(y=>{const t=voceSpesa(y);
               return t?((typeof prodottoPrima==="function")?prodottoPrima(t):t):"";}).filter(Boolean)])
    .filter(x=>x[1].length);
  return pulita.length?pulita:null;}
window.normSpesaAI=normSpesaAI;

/* ── E QUELLO CHE È GIÀ SALVATO SI RIPARA ─────────────────────────
   Chi ha ricevuto la lista rotta ce l'ha su disco: rigenerarla
   sarebbe una cosa da chiedergli, e non ha fatto niente di male.
   All'apertura, se nella lista salvata compare la parola che non
   dovrebbe esistere, la lista si ricostruisce dagli ingredienti del
   piano — che e' esattamente quello che sa fare quando l'AI non
   risponde. Nessun dato perso: la lista e' un derivato del piano. */
function spesaRipara(){
  try{
    const L=S.customShop;
    if(!Array.isArray(L)||!L.length)return false;
    const rotta=JSON.stringify(L).indexOf("[object Object]")>-1;
    if(!rotta)return false;
    let nuova=null;
    try{nuova=(typeof buildShopFromPlan==="function")?buildShopFromPlan():null;}catch(e){nuova=null;}
    S.customShop=(nuova&&nuova.length)?nuova:null;
    S.shop={};save();
    try{if(cur==="spesa")render("spesa");}catch(e){}
    return true;
  }catch(e){return false;}}
window.spesaRipara=spesaRipara;
setTimeout(()=>{try{spesaRipara();}catch(e){}},1800);

/* ═══ L'ORCHESTRATORE ════════════════════════════════════════════
   Una chiamata, un controllo, e — solo se serve — una seconda chiamata
   che rifà SOLO i giorni che non passano. Non tutto il piano da capo:
   con la chiamata unica si perderebbe la cosa migliore che il vecchio
   ciclo aveva, cioè che il lavoro buono non si butta.
   `onFase` racconta a che punto siamo: 'settimana' → 'controllo' →
   ('ritocco') → 'fatto'. */
async function chiediSettimana(cfg){
  const G=(cfg.regole&&cfg.regole.giorni)||["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
  const conSpesa=cfg.spesa!==false;
  const fase=cfg.onFase||function(){};
  const t0=Date.now();
  const chiudi=(out)=>{
    /* il tempo si registra SEMPRE, anche quando è andata male: un
       fallimento lento è un dato, e serve a confrontare i livelli */
    try{S.ai=S.ai||{};S.ai.genMs=Date.now()-t0;S.ai.genAt=new Date().toISOString();
      /* si registra anche CON QUALE livello: un tempo senza il livello
         che l'ha prodotto non si può confrontare con niente */
      /* si registra il livello VERO con cui è stata fatta (27/08: il
         selettore non esiste più, quindi non c'è niente da tradurre) */
      S.ai.genPens=(typeof pensieroDi==="function")?pensieroDi("piano"):"low";
      save();}catch(e){}
    return Object.assign({ms:Date.now()-t0},out);};

  fase("settimana");
  /* ── L'AVANZAMENTO VERO, DAL TESTO CHE ARRIVA (25/08) ────────────
     Il gancio riceve il testo accumulato dallo streaming e ci conta i
     giorni: un giorno è COMPLETATO quando nel testo è comparso l'inizio
     del successivo — finché scrive il martedì, il lunedì è chiuso.
     Non è una stima: è la lettura di quello che è stato scritto.
     Se lo streaming non c'è (proxy, webview vecchie) il gancio resta
     muto e l'interfaccia tiene la fase «settimana»: nessun avanzamento
     finto al posto di quello vero. */
  let fattiVisti=-1;
  window.AI_PIANO_DELTA=(txt)=>{
    const nomi=[];const re=/"day"\s*:\s*"([^"]*)"/g;let m;
    while((m=re.exec(txt)))nomi.push(m[1]);
    const fatti=Math.max(0,nomi.length-1);
    if(fatti!==fattiVisti){fattiVisti=fatti;
      fase("giorno",{fatti:fatti,ora:nomi[nomi.length-1]||""});}};
  let r;
  try{r=await askWeekAI(cfg.prompt+weekJSONContract(G,conSpesa));}
  finally{try{delete window.AI_PIANO_DELTA;}catch(_){window.AI_PIANO_DELTA=null;}}
  if(!r.week)return chiudi({plan:null,spesa:null,problemi:[],err:r.err});
  let grezzi=(r.week.days||[]).slice(0,G.length);
  const spesa=conSpesa?normSpesaAI(r.week.spesa):null;

  fase("controllo");
  let esito=validaSettimana(grezzi,cfg.regole);

  /* ── LA SECONDA CHIAMATA, MIRATA — E SOLO PER I GIORNI GRAVI ────
     Raddoppiare l'attesa si giustifica solo per un giorno
     inutilizzabile. Un giorno imperfetto si dichiara: c'è «Ricalibra». */
  const daRifare=esito.problemi.filter(p=>p.grave);
  if(daRifare.length&&cfg.promptGiorni){
    fase("ritocco",daRifare.map(p=>p.giorno));
    const guasti=daRifare.slice();
    const buoni=grezzi.filter((d,i)=>!guasti.some(p=>p.i===i));
    const usati=[];
    buoni.forEach(d=>(d.meals||[]).forEach(m=>{
      if((m.type||"norm")==="norm"&&m.d)usati.push(String(m.d).slice(0,60));}));
    const q=cfg.promptGiorni(guasti,usati)+weekJSONContract(guasti.map(p=>p.giorno),false)
      .replace('ESATTAMENTE sette oggetti','ESATTAMENTE '+guasti.length+(guasti.length===1?' oggetto':' oggetti'));
    const r2=await askWeekAI(q);
    if(r2.week&&Array.isArray(r2.week.days)){
      /* si rimettono al loro posto per NOME, non per posizione: se il
         modello ne restituisce tre in ordine sparso, metterli in fila
         significherebbe scambiare il mercoledì col sabato */
      r2.week.days.forEach(d=>{
        const nome=cibNorm(d&&d.day);
        let p=guasti.find(x=>cibNorm(x.giorno)===nome);
        if(!p&&r2.week.days.length===guasti.length)p=guasti[r2.week.days.indexOf(d)];
        if(p&&d&&Array.isArray(d.meals)&&d.meals.length)grezzi[p.i]=d;});
      esito=validaSettimana(grezzi,cfg.regole);
    }
  }
  /* ═══ LA RIPARAZIONE, INVECE DEL CESTINO (founder, 26/08 sera) ═══
     «Il check del piano dovrebbe servire proprio a riparare eventuali
     errori, non a bloccarlo.»
     Fino a qui il controllo sapeva solo dire NO: se dopo il
     rifacimento restava un divieto dentro una descrizione, sette
     giorni di lavoro finivano nel cestino e la persona si ritrovava
     davanti a «non lo attivo». Per chi ha molte intolleranze —
     istamina e nichel vietano da soli una ventina di alimenti comuni —
     succedeva quasi sempre, e due volte di fila.
     Adesso il divieto si SOSTITUISCE: la parola vietata lascia il
     posto al primo sostituto sicuro per questa persona (SOSTITUTI, più
     in alto), il pasto resta segnato come adattato, e il piano si
     consegna. La sicurezza non è stata allentata di un grammo — un
     alimento vietato non arriva mai a schermo — è cambiato cosa si fa
     quando lo si trova. */
  /* gli assoluti restano SEPARATI (27/08): allergie e dieta di
     riferimento non conoscono esenzioni, e mescolarli ai divieti
     normali voleva dire perdonarli col «senza lattosio». */
  const vietatiTutti=((cfg.regole&&cfg.regole.vietati)||[]).concat(ALCOL_VIETATI);
  const assolutiTutti=((cfg.regole&&cfg.regole.allergeni)||[]);
  const adattati=(vietatiTutti.length||assolutiTutti.length)
    ?riparaSettimana(grezzi,vietatiTutti,assolutiTutti):[];
  if(adattati.length)esito=validaSettimana(grezzi,cfg.regole);
  /* ── ULTIMA RETE SUI NOMI DEI PASTI (27/08) ────────────────────
     Il prompt li dice, e i giorni sbagliati si rifanno. Se dopo il
     rifacimento i nomi sono ancora quelli del modello — succede: un
     modello che ha in testa «colazione» ce la rimette — non si
     consegna un piano con i pasti di un'altra persona: si RINOMINA.
     Si fa solo quando il numero dei pasti è quello giusto, cioè
     quando l'unica cosa sbagliata è l'etichetta: rinominare cinque
     pasti in sei sposterebbe il cibo di posto, che è un'altra cosa e
     molto peggiore. Il conto dei pasti resta un problema dichiarato,
     non una cosa che si aggiusta di nascosto. */
  const attesi=(cfg.regole&&cfg.regole.slots)||null;
  if(attesi&&attesi.length){
    grezzi.forEach(g=>{
      if(!g||!Array.isArray(g.meals)||g.meals.length!==attesi.length)return;
      const storti=g.meals.some((m,i)=>cibNorm(m&&m.n)!==cibNorm(attesi[i]));
      if(!storti)return;
      g.meals.forEach((m,i)=>{if(m)m.n=attesi[i];});});
    esito=validaSettimana(grezzi,cfg.regole);}
  const plan=G.map((nome,i)=>normDayAI(nome,grezzi[i]||{meals:[]}));
  plan.adattati=adattati;
  fase("fatto");
  return chiudi({plan:plan,spesa:spesa,problemi:esito.problemi,adattati:adattati,err:null});}
window.genPlanAI=async()=>{
  S.ui.pianoProprio=0;   /* rigenerare da capo = il piano nuovo non è più «il suo di prima» */
  aiLungoOn();   /* l'indicatore resta acceso fino alla fine */
  /* Sette giorni di piano sono un'attesa lunga: al posto della rotella
     si mostra la FORMA dei giorni che stanno arrivando. Chi aspetta
     capisce cosa aspetta, e l'attesa percepita si accorcia. */
  try{if(typeof scheletroIn==="function"&&typeof skelRegistra==="function")
    skelRegistra(scheletroIn("pg-piano",6));}catch(e){}
  if(!aiOn())return aiFail(new Error("nokey"));
  /* ── SI BUSSA PRIMA DI ENTRARE (founder, 27/08) ─────────────────
     «Prima di passare il prompt al modello, il sistema faccia una
     chiamata per vedere se risponde.» Il piano dura minuti: scoprire
     alla fine di quei minuti che la chiave è scaduta o la quota è
     finita è il modo peggiore di scoprirlo. Due parole di domanda, e
     si sa subito. */
  if(typeof aiProva==="function"){
    const prova=await aiProva();
    if(!prova.ok){
      genBoxVia();
      try{aiLungoOff();}catch(e){}
      return dlgAlert(tr("Il modello non risponde")+" ("+esc(prova.motivo||"")+").\n\n"+
        tr("Non ho nemmeno cominciato: il piano richiede minuti e non volevo fartelli aspettare per niente. Riprova fra poco, o controlla la chiave in Sistema."));}}
  if(!await goalHealthCheck()){
    /* «Obiettivi» sta nella scheda Corpo: mandare qui senza aprire la
       scheda giusta significava atterrare su una pagina vuota con un
       messaggio che parlava di un campo invisibile. */
    try{schedaVai("io","dati");}catch(e){show("io");}
    return toast(tr("Aggiorna il peso desiderato in Obiettivi, poi rigenera il piano"));}
  const p=S.profile,D=S.diet,t=tdee();
  const goal=p.goal||"dimagrimento graduale";
  const target=dayTargetK(),protG=dayTargetP();      /* stesso target del resto dell'app */
  const wkN=goalWkTotal(),wkKcal=plannedActivityBurnFor(p.w||70);
  const slots=parseSlots(D.slots||"Colazione, Metà mattina, Pranzo, Metà pomeriggio, Cena");
  const mensa=parseMensa(D.mensaGiorni);
  const defTxt=(defMode()==="ritmo")?(trh("dal ritmo di {v1} a settimana",{v1:((typeof pesoTxt==="function")?pesoTxt(ratePerWeek(),1):ratePerWeek()+" kg")})):"dalla percentuale impostata nelle Regole";
  const capTxt=rateCapped()?("\n•  "+rateNote()):"";
  if(!await dlgConfirm(tr("Genero un piano settimanale completo: sette giorni e la lista della spesa, in una volta sola.")+"\n\n"+tr("• {a} anni, {w}, obiettivo: {g}",{a:age(),w:((typeof pesoTxt==="function")?pesoTxt(p.w,1):p.w+" kg"),g:goal})+
    "\n"+tr("• fabbisogno {t} kcal → target ~{x} kcal al giorno ({d})",{t:t,x:target,d:defTxt})+capTxt+
    (wkN?"\n"+tr("• allenamenti previsti: {n} a settimana (~{k} kcal al giorno già contate)",{n:wkN,k:wkKcal}):"")+
    "\n"+tr("• impostazione: {t}",{t:(D.tipo||"mediterranea")})+
    "\n"+tr("• pasti: {p}",{p:slots.join(", ")})+
    (Object.keys(mensa).length?"\n"+tr("• mensa: {g}",{g:D.mensaGiorni}):"")+
    "\n\n⏳ "+tr("L'AI scrive la settimana intera in una volta — così i giorni si tengono fra loro — e io ricontrollo che i conti tornino e che non sia comparso niente che hai escluso. Vedrai i giorni accendersi man mano che vengono scritti.")+
    ((S.ai&&S.ai.genMs)?"\n"+trh("L'ultima volta il piano ha richiesto {v1}.",{v1:pensieroUltima()}):"")+
    "\n\n È una proposta generata automaticamente, non una prescrizione: falla validare da un medico o da un nutrizionista prima di seguirla a lungo. Sostituirà il piano attuale (le settimane già salvate restano intatte)."))return;
  const box=genBox();
  const DAYS=[["Lunedì","lun"],["Martedì","mar"],["Mercoledì","mer"],["Giovedì","gio"],["Venerdì","ven"],["Sabato","sab"],["Domenica","dom"]];
  const G=DAYS.map(x=>x[0]);
  let plan=null,esito=null;
  try{
    /* ── I FUORI CASA, DETTI TUTTI INSIEME ────────────────────────
       Prima ogni giorno riceveva la sua riga sulla mensa perché ogni
       giorno era una chiamata a sé. Con una chiamata sola vanno
       nominati insieme: se non gli si dice QUALI giorni, li mette dove
       capita — o non li mette affatto. */
    const fuoriCasa=DAYS.filter(x=>mensa[x[1]]).map(x=>x[0]+" → "+(mensa[x[1]]==="cena"?"Cena":"Pranzo"));
    const rigaFuori=!fuoriCasa.length?"":(outTypeIsPorto()
      ? ' Questi pasti la persona se li prepara e se li porta da casa ('+fuoriCasa.join("; ")+'): scrivili ESATTAMENTE come gli altri — stessa struttura, stesse grammature, stesso livello di dettaglio — con l\'unico vincolo che siano trasportabili in un contenitore e buoni anche freddi o riscaldati. Niente indicazioni speciali, niente ricette elaborate. Per quei pasti usa type "norm", perché gli ingredienti vanno comprati.'
      : ' Questi pasti sono FUORI CASA, mensa, bar o ristorante ('+fuoriCasa.join("; ")+'): NON scegliere un piatto preciso e non dare grammature, perché non si sa cosa ci sarà. Scrivi UNA RIGA generica su come comporre il piatto, per esempio "una fonte proteica + verdura abbondante + una porzione di pane o pasta". Per quei pasti usa type "mensa".');
    const rigaVar=rigaVarieta(D.varieta||"media");
    /* le stesse righe che il percorso guidato manda: due testi diversi
       sarebbero due piani diversi per la stessa persona */
    const rigaFarm=(typeof farmaciRiga==="function")?farmaciRiga(D.farmaci||""):"";
    const rigaMed=D.medico?(' INDICAZIONI DEL MEDICO, VINCOLANTI e sopra ogni altra preferenza: '+D.medico+'. Non contraddirle mai, nemmeno per rispettare i target.'):"";
    const rigaInt=((D.integrareOk||"chiedi")==="no")
      ? ' NON proporre integratori in nessun caso, nemmeno se i target sono difficili: la persona ha chiesto solo alimenti veri.'
      : ((D.integrareOk==="si")
        ? ' Se i target non si coprono col cibo puoi indicare un integratore, scrivendolo nel campo ctx del giorno e ricordando che va concordato con un nutrizionista.'
        : ' Se i target non si coprono col cibo NON inserire integratori: scrivi nel campo ctx del giorno che varrebbe la pena parlarne con un nutrizionista.');
    /* Il corpo della richiesta, uguale per la settimana intera e per il
       rifacimento dei giorni storti: due testi diversi sarebbero due
       piani diversi, e il rifacimento smetterebbe di somigliare al
       piano che sta riparando. */
    /* ══ IL CONTESTO DELLA PERSONA, DA UNA FONTE SOLA (27/08) ══════
       L'audit delle promesse ha trovato sei difetti con la stessa
       causa, e questa riga li chiude tutti e sei.

       `dietStr()` è il testo che dice al modello CHI è la persona:
       impostazione alimentare (vegana, vegetariana con o senza uova e
       pesce, pescetariana, mediterranea con le sue regole operative),
       tradizione culinaria scelta, intolleranze per esteso, cibi da
       evitare, cibi amati, vincoli religiosi, protocolli, patologie,
       budget, tempo per cucinare, il divieto assoluto di alcol.

       Lo usano VENTI punti dell'app — ribilanci, alternative, spesa,
       stime, menù del ristorante. Le uniche due funzioni che NON lo
       usavano erano le due che generano il piano: quella che scrive
       la cosa più importante che l'app produce.

       Il risultato, misurato: a un utente che ha dichiarato «vegana»
       il prompt del piano non diceva che è vegana, e le linee guida
       compresse gli dicevano «carne rossa 1-2, uova 2-4». Alla
       tradizione culinaria — venti voci in due schermate — il piano
       rispondeva «cucina italiana/mediterranea», sempre.

       Le frasi scritte a mano che ripetevano un pezzo di questo testo
       («ingredienti reperibili in un supermercato italiano», «rispetta
       il tempo di cucina dichiarato») se ne vanno con questa riga: le
       dice `dietStr()`, e le dice giuste. */
    /* peso e altezza nelle unità della persona: se il modello le cita
       nel contesto del giorno («i tuoi 95 kg»), deve citare il numero
       che lei vede sullo schermo, non la sua traduzione metrica */
    const comune=' Persona: '+age()+' anni, '+(p.gender==="m"?"uomo":"donna")+', '+
      ((typeof altTxt==="function")?altTxt(p.h):p.h+" cm")+', '+
      ((typeof pesoTxt==="function")?pesoTxt(p.w,1):p.w+" kg")+', obiettivo: '+goal+'. Target di OGNI giorno: circa '+target+' kcal (tolleranza ±5%) e almeno '+protG+' g di proteine, distribuiti sui '+slots.length+' pasti. '+
      dietStr()+' '+rulesForPlan()+
      rigaPasti(slots)+rigaPasto()+rigaFuori+
      (D.patologie?' Le condizioni di salute dichiarate sopra sono VINCOLANTI nella scelta degli alimenti di ogni pasto.':'')+
      ' Regole: il piano si basa ESCLUSIVAMENTE su alimenti veri; NON inserire integratori (proteine in polvere, vitamine, barrette o pasti sostitutivi) a meno che i target siano davvero impossibili da coprire con il cibo: solo in quel caso indicali e scrivi nel campo ctx che l\'integrazione va concordata con un nutrizionista; le porzioni vanno SEMPRE indicate, nelle unità dette sopra; valori nutrizionali REALI per le quantità scritte; stagione attuale: '+seasonNow()+', proponi piatti adatti alla stagione (niente piatti tipicamente invernali in estate e viceversa), restando generico su "verdura di stagione" e "frutta di stagione" dove sensato; nell\'arco della settimana devono alternarsi con equilibrio fonti proteiche compatibili con l\'impostazione dichiarata (per esempio carne bianca, pesce, uova, legumi, latticini SOLO se ammessi) più cereali integrali e abbondante verdura.'+rigaVar+rigaFarm+rigaMed+rigaInt;
    const regole={giorni:G,kcal:target,prot:protG,tollPct:5,slots:slots,nPasti:slots.length,
      vietati:vietatiElenco(D.no,D.intol),
      allergeni:allergeniElenco(D.allergie||""),
      /* la regola sulle ripetizioni è quella che il prompt ha CHIESTO a
         questa persona, non una regola nostra imposta sopra la sua */
      ripetizioni:((D.varieta||"media")==="alta")?"nessuna":"vicine"};
    esito=await chiediSettimana({
      prompt:'Costruisci un piano alimentare italiano SETTIMANALE, sano ed equilibrato: SETTE GIORNI INTERI, da Lunedì a Domenica, più la lista della spesa che ne deriva.'+comune+
        ' Guarda la settimana come un insieme: distribuisci le fonti proteiche, non concentrare i piatti pesanti negli stessi giorni, e tieni conto dei giorni fuori casa quando bilanci gli altri.',
      promptGiorni:(guasti,usati)=>'Stai correggendo un piano alimentare settimanale italiano già scritto. Rifai SOLO questi giorni, lasciando stare gli altri.'+comune+
        ' Ecco cosa NON andava, giorno per giorno — correggi esattamente questo: '+
        guasti.map(x=>x.giorno+" → "+x.motivi.join("; ")).join(" · ")+'.'+
        (usati.length?' Questi piatti sono già negli altri giorni della settimana e non vanno riproposti: '+usati.slice(-24).join("; ")+'.':''),
      regole:regole,spesa:true,
      onFase:(f,dati)=>{
        if(!box)return;
        /* L'avanzamento è QUELLO VERO, contato dal testo che arriva in
           streaming: le spunte si accendono quando un giorno è stato
           scritto davvero. Prima del primo pezzo (e senza streaming)
           l'elenco resta «tutti in corso», che è l'unica cosa onesta
           che si possa dire in quel momento. */
        if(f==="settimana")genPassi(box,0,undefined,true);
        else if(f==="giorno")genPassi(box,dati.fatti);
        else if(f==="controllo")genPassi(box,7,1);
        else if(f==="ritocco")genPassi(box,7,1,false,dati);
        else if(f==="fatto")genPassi(box,7,2);}});
    if(!esito.plan){
      if(box)box.textContent="";genBoxVia();
      return aiFail(esito.err||new Error("errore"));}
    plan=esito.plan;
    /* la mensa la conosce l'app: non ci si affida al tipo scelto dall'AI,
       altrimenti quel pasto finisce nella lista della spesa */
    if(!outTypeIsPorto())DAYS.forEach((dd,i)=>{
      const mensaOggi=mensa[dd[1]];if(!mensaOggi)return;
      const slotM=(mensaOggi==="cena")?"Cena":"Pranzo";
      (plan[i].meals||[]).forEach(m=>{if(String(m.n||"").toLowerCase()===slotM.toLowerCase())m.type="mensa";});});
    genPassi(box,7,2);
    /* ═══ QUELLO CHE IL CONTROLLO HA TROVATO ═════════════════════
       Non è più una passata cortese fatta alla fine: è l'esito della
       validazione che ha già provato a riparare da sé. Quello che si
       legge qui è ciò che NON è stato possibile sistemare. */
    const tot=plan.map(d=>(d.meals||[]).reduce((a,m)=>a+(+m.o[0].k||0),0));
    const pro=plan.map(d=>(d.meals||[]).reduce((a,m)=>a+(+m.o[0].p||0),0));
    const media=Math.round(tot.reduce((a,b)=>a+b,0)/7);
    /* ── LA SICUREZZA SI RIPARA (v13.98) ───────────────────────────
       Qui c'era il rifiuto: «non lo attivo», e sette giorni di lavoro
       nel cestino. Era la cosa sbagliata da fare, e il founder l'ha
       detto con parole che vale la pena tenere: «se uno è intollerante
       al lattosio ci sono prodotti senza lattosio o alternative, non
       puoi metterli e poi far saltare il piano — il check dovrebbe
       servire a riparare, non a bloccare».
       Adesso la riparazione è già avvenuta dentro chiediSettimana: qui
       si DICE cosa è stato scambiato, e si va avanti. */
    /* ── TRE FINESTRE ERANO DUE DI TROPPO (founder, 27/08) ─────────
       «Quando il piano viene generato arrivano troppi messaggi di
       stato, alcuni anche strani.»
       Erano tre, una dietro l'altra: gli scambi fatti, il riepilogo
       dei sette giorni da confermare, e l'annuncio finale. Tre volte
       «OK» per una cosa sola, e in mezzo una domanda — «vai avanti?» —
       a cui nessuno avrebbe mai risposto di no: il piano era gia'
       scritto, annullare significava buttarlo.
       Adesso: nessuna interruzione a meta', e UN riepilogo alla fine
       (piu' sotto) che dice tutto quello che dicevano le tre. Gli
       scambi e gli avvisi si preparano qui e viaggiano con lui. */
    const adattati=esito.adattati||[];
    const avvisi=(esito.problemi||[]).filter(x=>x.sicuro).map(x=>" "+x.giorno+": "+x.motivi.join("; "));
    if(avvisi.length)avvisi.push(tr("Puoi attivarlo lo stesso e poi premere «Ricalibra», che sistema le grammature senza cambiare i piatti."));
    snapSave("prima di: piano generato");
    try{S.ui.pianoOrigine="ai";}catch(e){} S.customPlan=plan;PLAN=plan;S.permMeals={};S.week=freshWeek();
    S.customShop=null;S.shop={};      /* la spesa riparte dagli ingredienti del nuovo piano */
    S.planW=S.profile.w;S.ui=S.ui||{};
    save();
    /* ── LA SPESA È GIÀ ARRIVATA COL PIANO ────────────────────────
       Stessa risposta, nessuna seconda chiamata: era il passaggio che
       allungava l'attesa DOPO che il piano era già pronto.
       E se la spesa è tornata storta NON si rifà niente: il piano è
       buono, e la lista sa ricostruirsi dagli ingredienti dei piatti.
       Rifare sette giorni per una lista sarebbe uno spreco che si paga
       in attesa. */
    /* anche qui si normalizza: era una delle due strade che scrivevano
       la risposta del modello COSI' COM'ERA, ed e' da qui che sono
       usciti i «[object Object]» della schermata del 27/08 */
    const spesaOk=(typeof normSpesaAI==="function")?normSpesaAI(esito.spesa):esito.spesa;
    if(spesaOk&&spesaOk.length){S.customShop=spesaOk;S.shop={};save();}
    else{try{await genShop(true);}catch(e){}}
    genPassi(box,7,2);await wait(400);
    if(box)box.textContent="";genBoxVia();
    render("piano");show("piano");
    /* L'annuncio arriva SOLO adesso: piano, spesa e controllo sono fatti. */
    const nSpesa=(S.customShop||[]).reduce((a,c)=>a+((c[1]||[]).length),0);
    /* IL riepilogo, uno solo: cosa c'e' nel piano, cosa e' stato
       scambiato per rispettare i vincoli e cosa non torna ancora. */
    const nAd=(function(){try{return new Set(adattati.map(x=>x.da+"→"+(x.a||""))).size;}catch(_){return adattati.length;}})();
    dlgAlert(tr("<b>Tutto pronto.</b>")+"<br><br>"+tr("· Piano settimanale di 7 giorni, media ~{k} kcal",{k:media})+"<br>"+
      (nSpesa?(tr("· Lista della spesa con {n} prodotti",{n:nSpesa})+"<br>"):"")+
      (nAd?(trh("· {v1} piatti adattati alle tue esclusioni, segnati nel Piano",{v1:nAd})+"<br>"):"")+
      (avvisi.length?(tr("· Da guardare:")+" "+esc(avvisi.join(" · "))+"<br>")
                    :(tr("· Controllo finale superato")+"<br>"))+"<br>"+
      tr("Puoi correggere ogni pasto dal Piano con «Correzioni», e le modifiche restano permanenti.")+"<br><br>"+
      tr("Ricorda: fallo validare da un nutrizionista. Se il piano indica integratori, anche quelli vanno concordati con lui, non presi di propria iniziativa."));
  }catch(e){if(box)box.textContent="";genBoxVia();aiFail(e);}};
/* ═══ IMPORT DEL PIANO DA FOTO ═══════════════════════════════════
   Chi ha già un piano (nutrizionista, foglio, PDF) lo fotografa:
   l'AI trascrive giorni, pasti e ALTERNATIVE, stima kcal/macro e
   ricostruisce tutto dentro Nuvia. */
/* Stessa rete della lista della spesa (27/08): l'indicatore si accende
   qui e si spegne in un `finally`, non alla fine di una delle sette
   strade che questa funzione puo' prendere. Una sola dimenticata
   lasciava la spia accesa per il resto della giornata. */
window.importPlanPhotos=async()=>{
  aiLungoOn();
  try{return await importPlanPhotosCore();}
  finally{try{aiLungoOff();}catch(_){}}};
async function importPlanPhotosCore(){
  S.ui.pianoProprio=0;
  if(!aiOn())return aiFail(new Error("nokey"));
  if(!await dlgConfirm(tr("Importo il piano dalle foto.\n\nScatta o scegli dalla galleria (anche più pagine insieme). L'AI legge giorni, pasti e alternative e li ricostruisce qui, con calorie e macro.\n\nCi vuole qualche minuto. Sostituirà il piano attuale (le settimane già salvate restano intatte).")))return;
  const photos=[];
  try{
    do{
      const gal=!await dlgConfirm(tr("Da dove prendo la pagina del piano?"),{ok:tr(" Scatta ora"),ko:tr(" Dalla galleria")});
      const got=await anyPhoto(gal,true);          /* dalla galleria anche più pagine insieme */
      (Array.isArray(got)?got:[got]).forEach(x=>photos.push(x));
    }while(await dlgConfirm(tr("Pagine acquisite: {n} ✓\n\nNe aggiungo altre?",{n:photos.length})));
  }catch(e){if(!photos.length)return;}
  const box=genBox();
  if(box){box.style.display="block";genBoxMostra(box);box.textContent=trh(" Sto leggendo il piano da {v1} foto…\n⏳ L'AI sta trascrivendo giorni, pasti e alternative: può volerci qualche minuto, abbi un po' di pazienza.",{v1:photos.length});}
  try{
    const q='Queste '+photos.length+' FOTO mostrano un piano alimentare settimanale scritto (tabella, foglio o quaderno). TRASCRIVILO FEDELMENTE: per ogni giorno i pasti nell\'ordine in cui compaiono, con le grammature scritte; se un pasto ha più alternative (es. separate da "oppure", "o", righe alternative), riportale TUTTE come opzioni dello stesso pasto, prima quella principale. NON inventare piatti: se una parte non è leggibile, omettila. Stima kcal e macro REALI di ogni opzione dalle grammature scritte (porzioni tipiche italiane solo dove il peso manca). Se il piano copre meno di 7 giorni, completa la settimana ripetendo i giorni disponibili e segnalandolo nel ctx. Rispondi SOLO con un JSON array di 7 oggetti da Lunedì a Domenica: [{"day":"Lunedì","ctx":"","meals":[{"n":"Colazione","t":"","type":"norm","o":[{"d":"descrizione con grammature","k":numero,"p":numero,"c":numero,"f":numero,"fib":numero,"z":numero}]}]}] — "o" contiene una voce per OGNI alternativa del pasto; type vale "norm", "mensa" oppure "free". I campi numerici sono SEMPRE metrici: "k" in kcal, "p", "c", "f", "fib" e "z" in GRAMMI — se il piano fotografato è scritto in once o libbre, converti tu nei numeri e lascia pure le once nella descrizione.';
    let arr=null;
    for(let att=0;att<2&&!arr;att++){
      try{const t=await aiAskVision(q,photos);const o=parseAIJSON(t);
        if(Array.isArray(o)&&o.length)arr=o;}catch(e){if(att===1)throw e;}
    }
    if(!arr)throw new Error("non riesco a leggere il piano: riprova con foto più nitide e dritte");
    const DAYN=["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
    while(arr.length<7)arr.push(arr[arr.length%Math.max(1,arr.length)]);
    const plan=arr.slice(0,7).map((d,i)=>({day:giorno(DAYN[i]),ctx:d.ctx||"",meals:(d.meals||[]).filter(m=>m&&(m.o||m.d)).map(m=>({
      n:m.n||"Pasto",t:m.t||"",type:(m.type==="libero"?"free":(m.type||"norm")),
      o:(Array.isArray(m.o)&&m.o.length?m.o:[{d:m.d,k:m.k,p:m.p,c:m.c,f:m.f,fib:m.fib,z:m.z}]).filter(o=>o&&o.d).map(o=>({
        d:String(o.d),k:Math.round(o.k)||0,p:Math.round(o.p)||0,c:Math.round(o.c)||0,f:Math.round(o.f)||0,
        fib:Math.round(o.fib)||estFiberOf(o.d),z:Math.round(o.z)||estSugarOf(o.d)}))}))}));
    if(plan.some(d=>!(d.meals||[]).length||(d.meals||[]).some(m=>!m.o.length)))throw new Error("alcuni giorni o pasti sono rimasti vuoti: riprova con foto più nitide");
    if(box)box.textContent="";genBoxVia();
    const tot=plan.map(d=>(d.meals||[]).reduce((a,m)=>a+m.o[0].k,0));
    const nAlt=plan.reduce((a,d)=>a+(d.meals||[]).reduce((x,m)=>x+Math.max(0,m.o.length-1),0),0);
    if(!await dlgConfirm(tr("Piano letto dalle foto ✓")+"\n\n"+plan.map((d,i)=>d.day+trh(": {v1} pasti · ~{v2} kcal",{v1:(d.meals||[]).length,v2:tot[i]})).join("\n")+trh("\n\nAlternative trovate: {v1}\n\nControlla che i numeri abbiano senso (potrai correggere ogni pasto con ).\n\nOK = attiva questo piano",{v1:nAlt})))return;
    snapSave("prima di: piano importato da foto");
    try{S.ui.pianoOrigine="ai";}catch(e){} S.customPlan=plan;PLAN=plan;S.permMeals={};S.week=freshWeek();S.customShop=null;S.planW=S.profile.w;
    save();
    /* prima si finisce la lista della spesa, poi ci si sposta */
    genPassi(box,0,0);
    try{await genShop(true);}catch(e){}
    genPassi(box,0,2);await wait(500);
    if(box)box.textContent="";genBoxVia();
    render("piano");show("piano");
    toast(tr("Piano importato dalle foto ✓"));
    await planForecast(true);
  }catch(e){if(box)box.textContent="";genBoxVia();aiFail(e);}};
/* ═══ STIMA DEI RISULTATI ════════════════════════════════════════
   Bilancio matematico del piano (media kcal vs fabbisogno + allenamenti
   pianificati) → kg/settimana e data stimata dell'obiettivo; poi, se
   l'AI è attiva, un giudizio qualitativo su sostenibilità e criticità. */
window.planForecast=async(afterImport,noRetune)=>{
  if(planIsEmpty())return dlgAlert(tr("Il piano è vuoto: prima creane o importane uno."));
  const p=S.profile,t=tdeeTarget();
  /* stessa matematica dei totali mostrati nel Piano: tutte le portate (liberi e
     mensa compresi) e le modifiche permanenti, tramite plannedTemplateOfDay */
  const days=PLAN.map((d,di)=>plannedTemplateOfDay(di).k).filter(k=>k>0);
  if(!days.length)return dlgAlert(tr("Nessun pasto con calorie nel piano: niente da stimare."));
  const avg=Math.round(days.reduce((a,b)=>a+b,0)/days.length);
  /* qui gli allenamenti contano: accorciano il tempo per arrivare all'obiettivo,
     senza aver alzato le calorie da mangiare */
  const burn=wkForecastBurn();
  const defDay=t+burn-avg;
  const wk=defDay*7/7700;
  let msg=" "+tr("Stima sul piano attuale")+"\n\n"+tr("• media del piano: ~{k} kcal al giorno",{k:avg})+"\n"+tr("• fabbisogno per i target: {t} kcal + ~{b} kcal di allenamenti pianificati ({n} a settimana)",{t:t,b:burn,n:goalWkTotal()})+"\n"+tr("• bilancio: {tipo} di ~{k} kcal al giorno → {segno}{kg} a settimana",{tipo:(defDay>=0?tr("deficit"):tr("surplus")),k:Math.abs(defDay),segno:(defDay>=0?tr("circa −"):tr("circa +")),kg:((typeof pesoTxt==="function")?pesoTxt(Math.abs(wk),1):Math.abs(wk)+" kg")});
  const goalW=goalWeightSet()||null;
  const needSurplus=!!(goalW&&p.w&&goalW>p.w);
  const reachable=(goalW&&p.w)?(needSurplus?defDay<0:defDay>0):null;
  if(reachable){
    const daysTo=Math.round(Math.abs(p.w-goalW)*7700/Math.abs(defDay));
    const eta=new Date(Date.now()+daysTo*864e5);
    msg+="\n"+tr("• obiettivo {g}: circa {s} settimane, indicativamente entro {d}",{g:((typeof pesoTxt==="function")?pesoTxt(goalW,1):goalW+" kg"),s:Math.round(daysTo/7),d:eta.toLocaleDateString(dataLoc(),{month:"long",year:"numeric"})})+(needSurplus?"":" "+tr("(il ritmo rallenta man mano che scendi)"));
  }
  if(defMode()==="ritmo"){
    msg+="\n"+tr("• ritmo desiderato: {r} a settimana",{r:((typeof pesoTxt==="function")?pesoTxt(ratePerWeek(),1):ratePerWeek()+" kg")});
    if(rateCapped())msg+="\n•  "+rateNote();
    const rif=rateCapped()?rateEffective():ratePerWeek();
    if(reachable&&Math.abs(Math.abs(wk)-rif)>0.15)msg+="\n"+tr("• il piano viaggia a un ritmo diverso da quello impostato: valuta un ritocco delle porzioni o del ritmo");
  }
  if(defDay>1000)msg+="\n"+tr("•  deficit molto aggressivo (oltre 1.000 kcal al giorno): sostenibile solo per brevi periodi e sotto controllo di un nutrizionista.");
  if(reachable===false&&noRetune)msg+="\n"+tr("•  anche dopo la ritaratura il bilancio non torna: rivedi obiettivo, allenamenti o piano insieme a un nutrizionista.");
  msg+="\n\n "+tr("Stima matematica indicativa: la verifica vera arriva dalle pesate, e il piano va validato da un nutrizionista.");
  await dlgAlert(msg);
  if(reachable===false&&!noRetune){
    if(aiOn()){
      if(await dlgConfirm(" "+tr("Con questo piano l'obiettivo {g} kg NON sembra raggiungibile: il bilancio {b}.\n\nMa sono un'AI e posso commettere errori: controlla tu i numeri della stima qui sopra.\n\nPosso ritararlo automaticamente modificando le grammature (i piatti restano gli stessi) verso ~{k} kcal al giorno, e poi rigenerare lista della spesa e stima.",{g:goalW,b:(needSurplus?tr("non è in surplus"):tr("non è in deficit")),k:dayTargetK()}),{ok:tr("Ritara il piano"),ko:tr("Mantieni com'è")})){
        if(await retunePlan()){await genShop(true);return planForecast(afterImport,true);}
      }
    }
    return;
  }
  if(!aiOn())return;
  const box=genBox();
  if(box){box.style.display="block";genBoxMostra(box);box.textContent=" Giudizio dell'AI sul piano in arrivo…";}
  try{
    const t2=await aiAsk('Valuta in modo onesto questo piano alimentare rispetto all\'obiettivo della persona. '+rulesForAI()+' Dati: media del piano '+avg+' kcal/giorno; fabbisogno per i target '+t+' kcal; allenamenti pianificati '+goalWkTotal()+' a settimana (~'+burn+' kcal/giorno); obiettivo: '+(p.goal||"—")+(goalW?'; peso '+p.w+' → '+goalW+' kg':'')+(defMode()==="ritmo"?'; ritmo desiderato '+ratePerWeek()+' kg/settimana'+(rateCapped()?' (ridotto a '+rateEffective()+' kg/settimana dal tetto di sicurezza)':''):'')+'. In massimo 130 parole: quanto è realistico raggiungere l\'obiettivo con questo piano e questi allenamenti, i 2-3 punti deboli principali (proteine, fibre, varietà, sostenibilità) e 2 consigli concreti. Chiudi ricordando la validazione da parte di un nutrizionista. Testo semplice, niente markdown.');
    if(box)box.textContent=" "+t2;
  }catch(e){if(box)box.textContent="";genBoxVia();if(!afterImport)aiFail(e);}};
/* ═══ RITARATURA DEL PIANO ═══════════════════════════════════════
   Quando la stima dice che l'obiettivo non è raggiungibile, l'utente può
   far ritarare il piano: i piatti restano gli stessi, cambiano SOLO le
   grammature, giorno per giorno, verso il target calorico dell'app. */
window.retunePlan=async()=>{
  if(!aiOn())return aiFail(new Error("nokey")),false;
  const target=dayTargetK(),protG=dayTargetP();
  snapSave("prima di: ritaratura del piano");
  if(!S.customPlan){S.customPlan=JSON.parse(JSON.stringify(PLAN));PLAN=S.customPlan;}
  const box=genBox();
  /* La settimana da ritarare parte da OGGI, non dal lunedì: la ricalibratura
     si fa quando serve, anche di mercoledì, e deve coprire i 7 giorni
     successivi nell'ordine in cui verranno davvero vissuti. */
  const start=wd(new Date());
  try{
    for(let n=0;n<7;n++){
      const di=(start+n)%7;
      if(box){box.style.display="block";genBoxMostra(box);box.textContent=trh(" Ritaro il giorno {v1} di 7 — {v2} verso ~{v3} kcal…\n⏳ Può volerci qualche minuto, abbi un po' di pazienza: l'AI mantiene i tuoi piatti e cambia solo le quantità.",{v1:(n+1),v2:PLAN[di].day,v3:target});}
      const idx=[],list=[];
      PLAN[di].meals.forEach((m,mi)=>{
        /* i pasti in mensa/fuori si ritarano solo se li prepari tu:
           altrimenti sono indicazioni generiche, non piatti con grammature */
        if(m.type!=="norm"&&!(m.type==="mensa"&&outTypeIsPorto()))return;
        idx.push(mi);
        list.push({slot:m.n,desc:m.o[0].d,kcal:m.o[0].k});});
      if(!list.length)continue;
      const q='Aggiusta le GRAMMATURE di questi pasti di una giornata per arrivare a un totale di circa '+target+' kcal (tolleranza ±5%) e almeno '+protG+' g di proteine, MANTENENDO i piatti: cambia solo le quantità, al massimo aggiungi contorni di verdura, non stravolgere i piatti. '+rulesForAI()+' Usa valori nutrizionali REALI per le quantità che scrivi e non scendere sotto '+minMealKcal()+' kcal a pasto principale. Pasti: '+JSON.stringify(list)+'. Rispondi SOLO JSON array nello stesso ordine e con lo stesso numero di voci: [{"slot":"...","desc":"descrizione con grammature","kcal":n,"prot":n,"carb":n,"gras":n,"fibre":n,"zuccheri":n}]';
      let arr=null;
      for(let att=0;att<2&&!arr;att++){
        try{const r=parseAIJSON(await aiAsk(q));if(Array.isArray(r)&&r.length===list.length)arr=r;}
        catch(e){if(att===1)throw e;}
      }
      if(!arr)throw new Error(trh("giorno {v1} non ritarato: riprova",{v1:PLAN[di].day}));
      arr.forEach((v,k)=>{const m=PLAN[di].meals[idx[k]];
        m.o[0]={d:String(v.desc||m.o[0].d),k:Math.round(v.kcal)||m.o[0].k,p:Math.round(v.prot)||0,c:Math.round(v.carb)||0,f:Math.round(v.gras)||0,
          fib:Math.round(v.fibre)||estFiberOf(v.desc),z:Math.round(v.zuccheri)||estSugarOf(v.desc)};
        delete S.permMeals[di+"_"+idx[k]];});
    }
    S.customShop=null;S.shop={};   /* la spesa va ricalcolata sulle nuove grammature */
    save();render("piano");
    if(box)box.textContent="";genBoxVia();
    toast(tr("Piano ritarato sulle nuove grammature ✓"));
    return true;
  }catch(e){if(box)box.textContent="";genBoxVia();aiFail(e);return false;}};
/* ═══ STAGIONALIZZAZIONE ═════════════════════════════════════════
   Il piano base resta generico ("verdura di stagione"); qui l'AI aggiunge
   ai pasti principali un'ALTERNATIVA marcata 🍂 con piatti e ingredienti
   adatti alla stagione corrente. In Oggi e nel Piano si sceglie l'opzione
   che si preferisce; rilanciandola, le alternative 🍂 vengono rinnovate. */
function seasonNow(){const m=new Date().getMonth()+1;
  return (m===12||m<=2)?"inverno":m<=5?"primavera":m<=8?"estate":"autunno";}
function seasonEmoji(s){return {primavera:"🌸",estate:"☀️",autunno:"🍂",inverno:"❄️"}[s||seasonNow()]||"🍂";}
function seasonLabel(s){return {primavera:"Primaverile",estate:"Estivo",autunno:"Autunnale",inverno:"Invernale"}[s||seasonNow()]||"Stagionale";}
const SEASON_RE=/^(🌸|☀️|🍂|❄️)/;
function optLabel(o,oi){const m=String((o&&o.d)||"").match(SEASON_RE);
  if(!m)return tr("Opzione")+" "+(oi+1);
  return m[1]+" "+tr({"🌸":"Primaverile","☀️":"Estivo","🍂":"Autunnale","❄️":"Invernale"}[m[1]]||"Stagionale");}
window.seasonalizePlan=async()=>{
  if(!aiOn())return aiFail(new Error("nokey"));
  if(planIsEmpty())return dlgAlert(tr("Il piano è vuoto: prima creane o importane uno."));
  const sea=seasonNow();
  if(!await dlgConfirm(seasonEmoji(sea)+" "+tr("Stagionalizzo il piano — stagione attuale: {s}.\n\nIl piano base resta com'è: per i pasti principali l'AI aggiunge un'ALTERNATIVA marcata {e} {l} con piatti e ingredienti di stagione (es. niente polenta e spezzatino d'estate, niente insalatone fredde d'inverno). Potrai scegliere l'opzione che preferisci pasto per pasto.\n\nLe alternative stagionali precedenti, di qualunque stagione, vengono sostituite.\n\n⏳ Può volerci qualche minuto.",{s:tr(sea),e:seasonEmoji(sea),l:seasonLabel(sea)})))return;
  const box=genBox();
  if(box){box.style.display="block";genBoxMostra(box);box.textContent=seasonEmoji(sea)+trh(" Sto preparando le alternative di stagione ({v1})…\n⏳ Può volerci qualche minuto, abbi un po' di pazienza.",{v1:sea});}
  try{
    const list=[];
    PLAN.forEach(d=>(d.meals||[]).forEach(m=>{
      if(m.type!=="norm")return;
      if(!/pranzo|cena/i.test(m.n||""))return;
      list.push({day:d.day,slot:m.n,piatto:m.o[0].d,kcal:m.o[0].k,prot:m.o[0].p});}));
    if(!list.length)throw new Error("nessun pranzo o cena nel piano");
    const t=await aiAsk('Stagione attuale in Italia: '+sea+'. Questi sono i pranzi e le cene di un piano alimentare: '+JSON.stringify(list)+'. Per OGNI voce proponi UNA variante di stagione: un piatto adatto alla stagione ('+sea+') con ingredienti di stagione reperibili in un supermercato italiano, grammature indicate, kcal entro ±10% e proteine entro ±5 g rispetto al piatto originale. '+rulesForAI()+' Se un piatto è già perfettamente stagionale puoi ometterlo. Rispondi SOLO JSON array: [{"day":"Lunedì","slot":"Pranzo","d":"piatto con grammature","k":n,"p":n,"c":n,"f":n,"fib":n,"z":n}]');
    const arr=parseAIJSON(t);
    if(!Array.isArray(arr)||!arr.length)throw new Error("nessuna variante proposta");
    if(!S.customPlan){S.customPlan=JSON.parse(JSON.stringify(PLAN));PLAN=S.customPlan;}
    snapSave("prima di: stagionalizzazione");
    let n=0;
    /* via le 🍂 vecchie, dentro le nuove */
    PLAN.forEach(d=>(d.meals||[]).forEach(m=>{m.o=(m.o||[]).filter(o=>!SEASON_RE.test(o.d||""));}));
    arr.forEach(v=>{
      const d=PLAN.find(x=>x.day===v.day);if(!d)return;
      const m=d.meals.find(x=>x.n===v.slot&&x.type==="norm");if(!m||!v.d)return;
      m.o.push({d:seasonEmoji(sea)+" "+String(v.d),k:Math.round(v.k)||0,p:Math.round(v.p)||0,c:Math.round(v.c)||0,f:Math.round(v.f)||0,
        fib:Math.round(v.fib)||estFiberOf(v.d),z:Math.round(v.z)||estSugarOf(v.d)});n++;});
    if(!n)throw new Error("nessuna variante applicabile");
    save();render("piano");
    if(box)box.textContent="";genBoxVia();
    dlgAlert(seasonEmoji(sea)+" "+tr("Aggiunte {n} alternative {t} ({s}) ✓",{n:n,t:seasonLabel(sea).toLowerCase(),s:tr(sea)})+trh("\n\nLe riconosci dall'etichetta {v1} {v2} tra le opzioni dei pasti: scegli quella che preferisci dal Piano o da Oggi. Il piano base resta intatto.",{v1:seasonEmoji(sea),v2:seasonLabel(sea)}));
  }catch(e){if(box)box.textContent="";genBoxVia();aiFail(e);}};
/* Tutte le note scritte nel diario, dalla più recente: le note esistono da
   sempre (finiscono nell'esportazione e nell'analisi), ma non c'era un posto
   per rileggerle tutte insieme. */
function notesCardHTML(){
  const rows=flattenDiet().filter(d=>d.note&&String(d.note).trim()).reverse();
  let h=`<div class="card"><h2>${tr("Le tue note")}</h2>
  ${hint2(tr("Tutto quello che hai scritto in <b>Nota del giorno</b>, dalla più recente."),tr("Le note vengono archiviate con la settimana, finiscono nel CSV e le legge l'AI in <b>Analizza i pattern</b> e nel report di fine settimana."))}`;
  if(!rows.length)h+=`<div class="hint">${trh("Ancora nessuna nota. La scrivi dalla tua pagina, in {b1}: fame, imprevisti, come ti sentivi.",{b1:"<b>"+tr("La giornata → Nota del giorno")+"</b>"})}</div></div>`;
  else{
    h+=`<div class="tbl-scroll" style="max-height:340px">`;
    /* Le note della settimana in corso si correggono TOCCANDOLE: stesso
       pannello della pagina del giorno. Le settimane archiviate restano
       in sola lettura (si correggono da Storico → Modifica). */
    const wkDi=(dateIso)=>{
      if(!S.week||!S.week.started)return -1;
      const st=safeDate(S.week.started+"T12:00:00"),d2=safeDate(dateIso+"T12:00:00");
      if(!st||!d2)return -1;
      const di=Math.round((d2-st)/86400000);
      return (di>=0&&di<(S.week.days||[]).length)?di:-1;};
    rows.slice(0,120).forEach(d=>{
      const dt=safeDate(d.date+"T12:00:00");
      const gg=dt?dt.toLocaleDateString(dataLoc(),{weekday:"short",day:"numeric",month:"short"}):d.date;
      const di=wkDi(d.date);
      h+=`<div style="padding:8px 0;border-bottom:1px solid var(--linea)"${di>=0?` class="tap" onclick="notaScrivi(${di})" title="${tr("Tocca per correggere")}"`:""}>
        <div style="font-weight:700;color:var(--bosco);font-size:13px">${esc(gg)}${d.eat?` · ${d.eat} kcal`:""}${d.workoutN?` ·  ${d.workoutN}`:""}${di>=0?` <span style="color:var(--salvia);font-weight:600">${tr("· tocca per correggere")}</span>`:""}</div>
        <div style="font-size:13px;white-space:pre-wrap">${esc(cap(d.note))}</div></div>`;});
    h+=`</div><div class="hint">${trh("{v1} note in totale{v2}. Quelle della settimana in corso si correggono toccandole; per una vecchia: <b>Storico → Settimane passate → Modifica</b>.",{v1:rows.length,v2:(rows.length>120?tr(" (mostro le 120 più recenti)"):"")})}</div></div>`;}
  return h;}
function exportCardHTML(){
  const all=flattenDiet();
  const first=all.length?all[0].date:iso(new Date()),last=all.length?all[all.length-1].date:iso(new Date());
  return `<div class="card"><h2>${tr("Esporta i dati")}</h2>
  <div class="hint">${trh("Una riga per giorno con {b} quello che inserisci e che l'app calcola: pianificato e mangiato, macro completi, sport, sonno, relax, umore, acqua, evento, periodo di dieta, ribilanciamenti e recuperi.",{b:"<b>"+tr("tutto")+"</b>"})} ${EXPORT_COLS.length} colonne.</div>
  <div class="grid2" style="margin-top:12px">
    <div><label>Dal</label><input type="date" id="expFrom" value="${first}"></div>
    <div><label>Al</label><input type="date" id="expTo" value="${last}"></div>
  </div>
  <div class="mtools" style="margin-top:12px">
    <button class="btn ghost small" onclick="doExportCSV()">CSV</button>
    <button class="btn ghost small" onclick="aiPatterns()">${tr("Analizza i pattern")}</button>
  </div>
  ${hint2(tr("Il CSV si apre in Excel o Fogli Google: una riga per giorno, note comprese."),
 tr("<b>Analizza i pattern</b> fa leggere gli stessi dati all'AI, che cerca le correlazioni fra sonno, umore, allenamenti e alimentazione. Separatore punto e virgola."),null,"e l'analisi AI?")}
  <div class="aibox" aria-live="polite" id="expOut" style="display:none"></div></div>`;}
function extendedRecapHTML(){
  /* Riepilogo esteso v5.1: MEDIE per periodo (come il recap), su tutta la
     storia, in un riquadro scrollabile. Solo Settimanale e Mensile. */
  if(RECAP.mode!=="settimana"&&RECAP.mode!=="mese")RECAP.mode="settimana";
  const days=flattenDiet();
  const buckets={};
  days.forEach(d=>{let k;
    if(RECAP.mode==="mese")k=d.date.slice(0,7);
    else{const dt=new Date(d.date+"T12:00:00");const mon=new Date(dt);mon.setDate(dt.getDate()-((dt.getDay()+6)%7));k=iso(mon);}
    (buckets[k]=buckets[k]||[]).push(d);});
  const keys=Object.keys(buckets).sort().reverse();
  let rowsH="";
  keys.forEach(k=>{const arr=buckets[k].filter(d=>d.eat>0);const n=arr.length;
    const avg=f=>n?Math.round(arr.reduce((a,d)=>a+(d[f]||0),0)/n):0;
    const label=RECAP.mode==="mese"
      ?new Date(k+"-01T12:00:00").toLocaleDateString(dataLoc(),{month:"long",year:"numeric"})
      :"sett. "+new Date(k+"T12:00:00").toLocaleDateString(dataLoc(),{day:"numeric",month:"short"});
    rowsH+=`<tr><td>${label}${n?` <small style="color:var(--grigio)">(${n}g)</small>`:" ⏳"}</td>
      <td class="n">${n?avg("eat"):"–"}</td>
      <td class="n">${n?avg("prot")+"g":"–"}</td>
      <td class="n">${n?avg("burn"):"–"}</td>
      <td class="n" style="color:${avg("def")>=0?"var(--salvia)":"var(--zaff)"}">${n?((avg("def")>=0?"−":"+")+Math.abs(avg("def"))):"–"}</td></tr>`;});
  return `<div class="card"><h2>${tr("Riepilogo esteso")}</h2>
  Il quadro completo del periodo scelto: medie, totali e scostamenti rispetto al piano.
  <div class="mtools">${["settimana","mese"].map(m=>`<button class="chipbtn" style="${RECAP.mode===m?"border-color:var(--salvia);color:var(--salvia);font-weight:700":""}" onclick="setRecapMode('${m}')">${m==="settimana"?"Settimanale":"Mensile"}</button>`).join("")}</div>
  <div style="max-height:320px;overflow-y:auto;border:1px solid var(--linea);border-radius:12px;margin-top:8px">
  <table><tr><th>Periodo</th><th class="n">Mangiate</th><th class="n">Prot</th><th class="n">Sport</th><th class="n">Deficit</th></tr>${rowsH||`<tr><td colspan="5">${tr("Ancora nessun dato.")}</td></tr>`}</table></div>
  ${hint2(tr("Medie giornaliere del periodo. Scorri nel riquadro per la storia completa."),"Contano solo i giorni tracciati (tra parentesi quanti). Sport = kcal medie dei soli allenamenti.")}</div>`;}
/* Chiusura AUTOMATICA della settimana: al primo avvio dopo il lunedì la
   settimana scaduta viene archiviata così com'è (sempre modificabile poi). */
async function autoCloseStaleWeeks(){
  let guard=0;
  while(weekStale()&&guard<8){guard++;
    await closeWeekCore(true);}
  /* Nessun avviso: l'archiviazione è automatica per definizione, e
     annunciarla ogni lunedì è rumore. Chi vuole vedere la settimana
     passata la trova in Numeri, dove se l'aspetta. */
  }

let PESCH=null;
function drawWeightsChart(){
  try{
    const cv=document.getElementById("chPesate");
    if(!cv||typeof Chart==="undefined")return;
    if(PESCH){PESCH.destroy();PESCH=null;}
    const ws=(S.profile.weights||[]).slice().sort((a,b)=>a.d<b.d?-1:1);
    if(ws.length<2)return;
    const goal=goalWeightSet()||null;
    PESCH=new Chart(cv,{type:"line",
      data:{labels:ws.map(x=>giornoDa(x.d).toLocaleDateString(dataLoc(),{day:"numeric",month:"short"})),
        datasets:[{label:trh("Peso ({v1})",{v1:((typeof unitaPeso==="function")?unitaPeso():"kg")}),data:ws.map(x=>((x)=>((typeof pesoNum==="function")?pesoNum(x,1):x))(x.w)),tension:.3,borderColor:"#00AFA3",pointRadius:2},
          ...(goal?[{label:"Obiettivo",data:ws.map(()=>goal),borderColor:"#0A4E49",borderDash:[6,5],pointRadius:0}]:[]),
          ...(ws.some(x=>x.fat)?[{label:"Grasso %",data:ws.map(x=>x.fat||null),tension:.3,borderColor:"#E4632F",pointRadius:2,spanGaps:true,yAxisID:"y2"}]:[])]},
      options:{animation:false,plugins:{legend:{labels:{boxWidth:11,font:{size:10}}}},
        scales:{x:{ticks:{font:{size:9}}},y2:{position:"right",grid:{drawOnChartArea:false}}}}});
  }catch(e){}}
function weightsCardHTML(){const p=S.profile,W=(p.weights||[]);
  let h="";
  if(W.length>1)
    h+=`<div class="card"><h2>${tr("Andamento del peso")}</h2>
    <canvas id="chPesate" height="170"></canvas>
    <div class="hint">${trh("Ogni pesata registrata in {b} aggiunge un punto. La linea tratteggiata è l'obiettivo, se impostato.",{b:"<b>Io</b>"})}</div></div>`;
  h+=`<div class="card"><h2>Pesate e biometriche</h2>`;
  if(!W.length)h+=`<div class="hint">${trh("Nessuna pesata registrata: la prima si aggiunge da {b}.",{b:"<b>Io → Nuova pesata</b>"})}</div></div>`;
  else{
    h+=`<div class="tbl-scroll"><table class="wtab"><tr>
      <th>Data</th><th class="n">Kg</th><th class="n">Δ</th><th class="n">%MG</th><th class="n">%MM</th><th class="n">PA</th><th class="n">SpO₂</th><th></th></tr>`;
    W.slice().reverse().forEach((x,ri)=>{const i2=W.length-1-ri;
      const prev=i2>0?W[i2-1].w:null,d=prev!=null?Math.round((x.w-prev)*10)/10:null;
      const dt=giornoDa(x.d);
      const gg=String(dt.getDate()).padStart(2,"0")+"/"+String(dt.getMonth()+1).padStart(2,"0")+"/"+String(dt.getFullYear()).slice(2);
      h+=`<tr><td>${gg}</td><td class="n"><b>${x.w}</b></td>
        <td class="n" style="color:${d==null?"var(--grigio)":(d<=0?"var(--salvia)":"var(--zaff)")}">${d==null?"–":(d>0?"+":"")+d}</td>
        <td class="n">${x.fat!=null&&x.fat!==""?x.fat:"–"}</td>
        <td class="n">${x.mus!=null&&x.mus!==""?x.mus:"–"}</td>
        <td class="n">${x.pa||"–"}</td>
        <td class="n">${x.spo2!=null&&x.spo2!==""?x.spo2:"–"}</td>
        <td class="n" style="white-space:nowrap"><button class="ibtn" title="${tr("Modifica o completa questa pesata")}" onclick="editWeight(${i2})">${ic("pencil",15)}</button><button class="ibtn" title="${tr("Elimina questa pesata")}" onclick="delWeight(${i2})">${ic("trash",15)}</button></td></tr>`;});
    h+=`</table></div>
    ${hint2(tr("Con la matita correggi una pesata o aggiungi valori che ti mancavano, anche a distanza di giorni. Col cestino la elimini."),tr("Δ = differenza rispetto alla pesata precedente · %MG massa grassa · %MM massa muscolare · PA pressione."))}</div>`;}
  return h;}
/* ═══  TOOLS ══════════════════════════════════════════════════════
   Tutti gli strumenti che prima affollavano "Oggi": restano legati al
   giorno visualizzato, ma hanno una casa loro. */
function renderTools(){
  const el=document.getElementById("pg-tools");const di=viewIdx();
  let h=`<div class="card"><h2>Tools</h2>
  ${hint2(`${tr("Aiuti per il momento in cui la dieta rischia di saltare. Agiscono su")} <b>${fmtDateShort(VIEW)}${tr("</b> e sul pasto che scegli in ogni riquadro.")}`,
 tr("Creare un piatto con quello che hai in casa, scegliere al ristorante, gestire una voglia improvvisa, cucinare per tutta la famiglia, trovare i piatti tipici del posto dove sei."))}</div>`;
  if(di<0){h+=`<div class="card"><div class="hint">${trh("Il giorno che stai guardando non è nella settimana in corso: torna a {b} per usare gli strumenti.",{b:"<b>Oggi</b>"})}</div></div>`;el.innerHTML=h;return;}
  h+=`<div class="gsec">${tr("Sto per cedere")}</div>`;
  h+=`<div class="card"><h2>${tr("Ho una voglia…")}</h2>
  <div class="hint">${trh("Scegli la {b}, non il cibo: l'AI trova qualcosa che la soddisfa restando nelle calorie di oggi.",{b:"<b>sensazione</b>"})}</div>
  ${mealSelHtml("craveTarget",di)}
  <div id="craveBox">${craveRows()}</div>
  <div class="mtools"><button class="btn small" onclick="craveHack(${di})">${tr("Trova un'alternativa")}</button></div>
  
  <div class="aibox" aria-live="polite" id="craveOut" style="display:none"></div></div>`;
  h+=`<div class="card"><h2>Tentazione improvvisa</h2>
  ${hint2(tr("Non si dice di no: si dice <b>metà, e adesso</b>."),tr("L'AI spiega quando mangiarla per limitare il picco glicemico e toglie l'equivalente dal pasto scelto qui sopra."))}
  ${mealSelHtml("treatTarget",di)}
  <div class="mtools"><button class="btn small" onclick="treatDefuse(${di})">${tr("Dimmi come gestirla")}</button></div>
  
  <div class="aibox" aria-live="polite" id="treatOut" style="display:none"></div></div>`;
  h+=`<div class="card"><h2>${tr("Ho una fame incontrollabile")}</h2>
  ${hint2(tr("Stesse calorie, molto più volume nello stomaco: verdure ricche d'acqua, zuppe, albumi montati."),tr("La fame meccanica si spegne senza sforare."))}
  ${mealSelHtml("volTarget",di)}
  <div class="mtools"><button class="btn small" onclick="volumeSOS(${di})">${tr("Aumenta il volume")}</button></div>
  
  <div class="aibox" aria-live="polite" id="volOut" style="display:none"></div></div>`;
  h+=`<div class="card"><h2>${tr("Oggi voglio spiluccare")}</h2>
  ${tr("I pasti che restano diventano un vassoio di bocconcini da consumare lentamente, con lo stesso totale di calorie e proteine.")}
  ${mealSelHtml("grazTarget",di)}
  <div class="mtools"><button class="btn small" onclick="grazing(${di})">${tr("Trasforma in spuntini")}</button></div>
  
  <div class="aibox" aria-live="polite" id="grazOut" style="display:none"></div></div>`;
  h+=`<div class="card"><h2>Ridurre gonfiore</h2>
  ${hint2(tr("L'AI guarda le ultime 48 ore e riscrive i pasti che restano in versione più digeribile."),tr("Sulla bilancia è gas e acqua, non grasso."))}
  ${mealSelHtml("bloatTarget",di)}
  <div class="mtools"><button class="btn small" onclick="bloatSOS(${di})">${tr("Alleggerisci i pasti")}</button></div>
  
  <div class="aibox" aria-live="polite" id="bloatOut" style="display:none"></div></div>`;
  h+=`<div class="gsec">${tr("Sistemo la giornata")}</div>`;
  h+=`<div class="card"><h2>${tr("Calibra la giornata")}</h2>
  ${hint2(tr("Notte storta o giornata pesante? L'AI risistema i pasti che restano, <b>a parità di calorie</b>."),tr("Sposta i carboidrati a pranzo, rende la cena più leggera e proteica, aumenta il volume se hai avuto fame. Prima dai un voto a sonno e come ti senti in <b>Oggi → Come stai</b>."))}
  <div class="mtools"><button class="btn small" onclick="calibraGiornata()">${tr("Riorganizza la giornata")}</button></div>
  
  <div class="aibox" aria-live="polite" id="caliOut" style="display:none"></div></div>`;
  h+=`<div class="card"><h2>Mi alleno tra poco e ho zero energie</h2>
  <div class="hint">${hint2(tr("Non aggiunge calorie: sposta, non somma."),trh("L'AI {b} una quota di carboidrati dai pasti che devi ancora fare e la trasforma in uno spuntino pre-allenamento ad assorbimento rapido, lasciando intatte le proteine. Poi aggiorna da sola i pasti da cui l'ha presa.",{b:"<b>prende</b>"}))}</div>
  <div class="mtools"><button class="btn small" onclick="fuelPre(${di})">${tr("Trova uno spuntino")}</button></div>
  <div class="aibox" aria-live="polite" id="fuelOut" style="display:none"></div></div>`;
  // Svuota-frigo — "⭐ I miei piatti" al posto di "Usa il testo"; "Usa il testo" sotto la casella

  h+=`<div class="card"><h2>Bilanciamento predittivo</h2>
  ${hint2("Lo sgarro si gestisce <b>prima</b>.",tr("Dici quando e cosa mangerai; l'AI mette da parte quelle calorie con piccoli tagli sui pasti che restano. Le proteine non si toccano."))}
  <label>${tr("Quando sarà l'occasione?")}</label>
  <div class="row2"><select id="predDay" onchange="predFillMeals()">${(function(){let o="";for(let k=di;k<7;k++){if(PLAN[k])o+=`<option value="${k}">${giorno(PLAN[k].day)}${k===di?" (oggi)":""}</option>`;}return o;})()}</select>
  <select id="predMeal"></select></div>
  <label>${tr("Cosa prevedi di mangiare?")}</label>
  <textarea id="predWhat" placeholder="${tr("es. «pizza e birra», «cena aziendale al ristorante», «compleanno con torta»")}"></textarea>
  <div class="mtools"><button class="btn small" onclick="predictive(${di})">${tr("Prepara il margine")}</button></div>
  
  <div class="aibox" aria-live="polite" id="predOut" style="display:none"></div></div>`;
  h+=`<div class="card"><h2>${tr("Il giorno dopo")}</h2>
  <div class="hint">${trh("Serata pesante ieri? Oggi non si recupera con la fame: {b}. Riscrive i pasti che restano in versione digeribile, a parità di calorie e proteine, e dice quanto bere in più.",{b:"<b>"+tr("si recupera con acqua e cibo leggero")+"</b>"})}</div>
  <label>${tr("Com'è andata")}</label>
  ${/* CHI HA DETTO CHE NON BEVE non si sente nominare l'alcol (28/08).
       È l'unica conseguenza vera della domanda sull'alcol, ed è quella
       giusta: non cambia il piano — che l'alcol non lo mette comunque —
       cambia le parole. Prima tutte e tre le voci parlavano di
       bicchieri: a chi ha risposto «mai» questo strumento sembrava
       scritto per qualcun altro, e una serata pesante senza alcol
       esiste eccome. */
   (S.diet&&S.diet.alcol==="mai")
  ?`<select id="dopoCome">
    <option value="una cena abbondante, fuori orario">${tr("una cena abbondante")}</option>
    <option value="pesante" selected>${tr("Pesante: cibo abbondante e tardi")}</option>
    <option value="molto pesante, ho mangiato molto più del solito e tardi">${tr("molto pesante")}</option>
  </select>`
  :`<select id="dopoCome">
    <option value="con qualche bicchiere di vino o birra">${tr("qualche bicchiere")}</option>
    <option value="pesante" selected>${tr("pesante: alcol e cibo abbondante")}</option>
    <option value="molto pesante, ho bevuto parecchio">${tr("molto pesante")}</option>
  </select>`}
  <div class="mtools"><button class="btn small" onclick="dopoAI(${di})">${tr("Sistema oggi")}</button></div>
  ${tr("Non è un consiglio medico: se ti senti male, parlane con un medico.")}
  <div class="aibox" aria-live="polite" id="dopoOut" style="display:none"></div></div>`;
  h+=`<div class="gsec">Cucino</div>`;
  h+=`<div class="card"><h2>Ho dieci minuti</h2>
  <div class="hint">${trh("Il vincolo è il tempo, non la fantasia: due proposte che stanno {b} in dieci minuti, con quello che hai in casa e nel freezer. Niente forno, massimo quattro ingredienti.",{b:"<b>davvero</b>"})}</div>
  ${mealSelHtml("rapTarget",di)}
  <div class="mtools"><button class="btn small" onclick="rapidoAI(${di})">${tr("Cosa faccio")}</button></div>
  <div class="aibox" aria-live="polite" id="rapOut" style="display:none"></div></div>`;
  h+=`<div class="card" style="margin-top:16px"><h2>${tr("Crea un piatto con quello che hai")}</h2>
  ${hint2(tr("Scatta PIÙ foto (frigo, congelatore, dispensa), poi «Crea»:"),tr("Il piatto sarà tarato sul pasto di questo momento, compensando le calorie già accumulate oggi. In alternativa scrivi gli ingredienti qui sotto."))}
  ${mealSelHtml("frTarget",di)}
  <div class="btngrid4">
    <button class="btn small" onclick="frAdd()">Fotografa<span id="frN">${FR.length?" ("+FR.length+")":""}</span></button>
    <button class="btn ghost small" onclick="frAdd(true)">Galleria</button>
    <button class="btn small" onclick="frCreate(${di})">Crea</button>
    <button class="btn ghost small" onclick="recModal(${di})">Piatti${S.recipes.length?" ("+S.recipes.length+")":""}</button>
  </div>
  
  <textarea id="fridgeIn" placeholder="…oppure scrivi: zucchine, uova, ricotta…"></textarea>
  <div class="mtools"><button class="btn ghost small" onclick="fridge(${di})">${tr("Usa il testo")}</button></div>
  <div class="aibox" aria-live="polite" id="fridgeOut" style="display:none"></div></div>`;
  // Selezionatore di menù — FOTO MULTIPLE + "Cerca" per confermare; "Usa il testo" sotto la casella
  h+=`<div class="card"><h2>Cucina intelligente</h2>
  ${tr("Scegli fin dove arrivare (massimo 3 giorni): l'AI ti dice cosa cucinare <b>adesso, in una volta sola</b>, per coprire tutto.")}
  <label>${tr("Copri il fabbisogno fino a…")}</label>
  <select id="prepUntil">${prepUntilOpts(di)}</select>
  <div class="mtools"><button class="btn small" onclick="mealPrep(${di})">${tr("Dimmi cosa cucinare")}</button></div>
  
  <div class="aibox" aria-live="polite" id="prepOut" style="display:none"></div></div>`;
  h+=`<div class="aibox" aria-live="polite" id="bingeOut" style="display:none"></div>`;
  h+=`<div class="card"><h2>${tr("Cucino per tutti")}</h2>
  <div class="hint">${trh("Una pentola sola: l'AI dà le dosi {b} per tutti e i grammi esatti da mettere nel tuo piatto {b2}, così non devi fare conversioni a mente.",{b:"<b>a crudo</b>",b2:"<b>pesati da cotto</b>"})}</div>
  ${mealSelHtml("splitTarget",di)}
  <div id="splitBox">${splitRowsHTML()}</div>
  <div class="mtools" style="margin-bottom:12px"><button class="btn ghost small" onclick="splitGuests()"> Ospiti (${SPLIT.guests||0})</button></div>
  <textarea id="splitIn" placeholder="${tr("Cosa stai cucinando: riso, zucchine, petto di pollo…")}"></textarea>
  <div class="mtools"><button class="btn small" onclick="splitCook(${di})">${tr("Calcola le dosi")}</button></div>
  
  <div class="aibox" aria-live="polite" id="splitOut" style="display:none"></div></div>`;
  h+=`<div class="card"><h2>Compromesso a tavola</h2>
  <div class="hint">${trh("Si cucina {b1}, poi ognuno completa il suo piatto. Stessa tavola, tu resti nei tuoi numeri.",{b1:"<b>"+tr("una base sola")+"</b>"})}</div>
  ${mealSelHtml("coupleTarget",di)}
  <label>${tr("Chi c'è a tavola")}</label>
  <div id="coupleBox">${splitRowsHTML()}</div>
  <div class="mtools" style="margin-bottom:12px"><button class="btn ghost small" onclick="splitGuests()"> Ospiti (${SPLIT.guests||0})</button></div>
  <div class="mtools"><button class="btn small" onclick="coupleFork(${di})">${tr("Trova un compromesso")}</button></div>
  
  <div class="aibox" aria-live="polite" id="coupleOut" style="display:none"></div></div>`;
  h+=`<div class="gsec">Al supermercato</div>`;
  h+=`<div class="card"><h2>Scaffale</h2>
  <div class="hint">${hint2(trh("Sei davanti a venti prodotti uguali e non sai quale prendere."),trh("{b2}: Nuvia legge le etichette, guarda la tua lista e le tue caratteristiche alimentari, e dice quale prendere, {b} e {b3} quello e non l'altro.",{b2:"<b>"+tr("Fotografa lo scaffale")+"</b>",b:"<b>quanto</b>",b3:"<b>"+tr("perché")+"</b>"}))}</div>
  <div class="btngrid3">
    <button class="btn small" onclick="scafAdd()">Fotografa<span id="scafN"></span></button>
    <button class="btn ghost small" onclick="scafAdd(true)">Galleria</button>
    <button class="btn small" onclick="scafAI()">Quale prendo</button>
  </div>
  <div class="hint">${tr("Le foto restano sul telefono: parte solo l'immagine a Gemini con la tua chiave, e non ne resta copia.")} <button class="btn ghost small" style="margin-top:8px" onclick="scafReset()">${tr("Togli le foto")}</button></div>
  <div class="aibox" aria-live="polite" id="scafOut" style="display:none"></div></div>`;
  h+=`<div class="gsec">${tr("Mangio fuori")}</div>`;
  h+=`<div class="card"><h2>Ordino a domicilio</h2>
  ${hint2(tr("Incolla i piatti dell'app di consegne:"),tr("Nuvia sceglie la combinazione che sta nei numeri di stasera. Tiene conto che <b>le porzioni da asporto sono più abbondanti</b>, quindi stima al rialzo."))}
  ${mealSelHtml("domTarget",di)}
  <textarea id="domIn" rows="4" placeholder="${tr("Incolla qui i piatti, uno per riga")}"></textarea>
  <div class="mtools"><button class="btn small" onclick="domicilioAI(${di})">${tr("Cosa ordino")}</button></div>
  <div class="aibox" aria-live="polite" id="domOut" style="display:none"></div></div>`;
  h+=`<div class="card"><h2>${tr("Selezionatore di menù")}</h2>
  <div class="hint">Scatta <b>${tr("più foto")}</b> ${trh("(pagine diverse del menù), spunta le portate che vuoi fare e premi {b1}: l'AI compone il pasto scegliendo dal menù, ti dà il {b2} della combinazione e un'alternativa per ogni portata. Se non spunti nulla decide lei come comporlo. In alternativa incolla il testo qui sotto.",{b1:"<b>Cerca</b>",b2:"<b>totale</b>"})}</div>
  ${mealSelHtml("menuTarget",di)}
  <div class="btngrid3">
    <button class="btn small" onclick="mnAdd()">Fotografa<span id="mnN">${MN.length?" ("+MN.length+")":""}</span></button>
    <button class="btn ghost small" onclick="mnAdd(true)">Galleria</button>
    <button class="btn small" onclick="menuSearch(${di})">Cerca</button>
  </div>
  <label>${tr("Cosa vuoi ordinare")}</label>
  <div class="ckgrid">${MENU_CATS.map((c,i)=>`<label class="ck"><input type="checkbox" id="mnCat${i}" ${MNCATS.indexOf(c)>-1?"checked":""} onchange="mnCat(${i})"> ${c}</label>`).join("")}</div>
  <input type="text" id="mnAltro" value="${esc(MNALTRO)}" placeholder="${tr("Altre sezioni del menù: insalatone, poke, tapas, taglieri…")}" onchange="MNALTRO=this.value">
  
  <textarea id="menuIn" placeholder="${tr("…oppure incolla qui il testo del menù")}"></textarea>
  <div class="mtools"><button class="btn ghost small" onclick="menuAI(${di})">${tr("Usa il testo")}</button></div>
  <div class="aibox" aria-live="polite" id="menuOut" style="display:none"></div></div>`;
  //  Piatti tipici del posto in cui ti trovi
  h+=`<div class="card"><h2>${tr("Piatti tipici di dove sei")}</h2>
  ${hint2(tr("In viaggio: tre <b>piatti tipici del posto</b> che stanno nel target, con la porzione e cosa farsi cambiare."),tr("La posizione serve solo per capire la regione — arrotondata, mai salvata — oppure scrivi tu la città.<br>Sono piatti della tradizione, non il menù del locale: per quello usa il <b>selezionatore di menù</b>."))}
  ${mealSelHtml("geoTarget",di)}
  <div class="btngrid2">
    <button class="btn small" onclick="geoDishes(${di})">${tr("Usa la mia posizione")}</button>
    <button class="btn ghost small" onclick="geoReset(${di})">${tr("Scrivo io il posto")}</button>
  </div>
  
  <div class="aibox" aria-live="polite" id="geoOut" style="display:none"></div></div>`;
  h+=`<div class="gsec">${tr("Per periodi lunghi")}</div>`;
  h+=`<div class="card"><h2>Uscita morbida</h2>
  <div class="hint">${tr("Per <b>smettere la dieta senza riprendere peso</b>. Invece di tornare di colpo a mangiare come prima, si risale di 60 kcal a settimana finché il peso resta stabile.")}${reverseOn()?` <b>${trh("Attiva: +{v1} kcal al giorno, settimana {v2}.",{v1:reverseBonus(),v2:S.reverse.step||0})}</b>`:""}</div>
  <div class="mtools">
    <button class="btn ${reverseOn()?"warn":"ghost"} small" onclick="reverseToggle()">${reverseOn()?"Chiudi":"Attiva"}</button>
    ${reverseOn()?`<button class="btn ghost small" onclick="reverseStep()">${tr("Valuta la settimana")}</button>`:""}
  </div></div>`;
  h+=`<div class="card"><h2>Fondo weekend</h2>
  <div class="hint">${tr("Dal lunedì al venerdì metti da parte il")} <b>${bankPct()}${tr("%</b> del target; il sabato torna tutto insieme per la cena fuori. Nella settimana il conto è identico.")}${bankOn()?" <b>Attivo.</b>":""}</div>
  <div class="mtools"><button class="btn ${bankOn()?"warn":"ghost"} small" onclick="bankToggle()">${bankOn()?"Disattiva":"Attiva"}</button></div></div>`;
  el.innerHTML=h;predFillMeals();}
function renderStorico(){const el=document.getElementById("pg-storico");
  /* I TRAGUARDI stanno qui dal 22/08: lo Storico È la pagina dei
     progressi, e i traguardi sono progressi — non «Tu». */
  const w=weekSummary();
  /* Recap v5.1: scostamenti dagli OBIETTIVI del giorno (Δ mangiate vs
     PIANIFICATO del giorno, Δ proteine vs piano), faccine, Sport = solo kcal
     allenamenti, Deficit. Selettore: settimana in corso / mese in corso. */
  let h="";
  /* Le schede: il rendering resta com'era e i confini si segnano con
     dei marcatori, filtrati alla fine. Nessuna graffa toccata. */
  const SK="storico";
  h+=schedeBarra(SK,[["settimana",tr("Settimana")],["analisi",tr("Analisi")],
                     ["peso",tr("Peso")],["archivio",tr("Archivio")]]);
  h+=`<!--SCHEDA:peso-->`;
  h+=(function(){try{return traguardiHTML();}catch(e){return "";}})();
  h+=`<!--SCHEDA:settimana-->`;
  {
    let rowsH="";
    /* Una riga per giorno, leggibile senza legenda: il giorno, una barra
       che dice quanto hai mangiato rispetto al piano, il deficit e la
       qualità. Il resto (proteine, sonno, sport, saltati) sta nel
       sottotitolo, in parole, invece che in sette colonne di sigle. */
    w.days.forEach((d,di)=>{
      const plan=plannedOfDay(di),pk=plan.k||dayTargetK();
      const dEat=d.eat-(plan.k||0),dProt=d.prot-(plan.p||0);
      const pct=Math.min(140,Math.round((d.eat||0)/Math.max(1,pk)*100));
      const q=dayQuality(di),br=burnedOfDay(di)||0;
      const note=[];
      if(d.eat)note.push((dProt>=0?"+":"")+dProt+" g proteine");
      if(br)note.push(br+" kcal di sport");
      if(d.sk)note.push(d.sk+(d.sk===1?" pasto saltato":" pasti saltati"));
      if(d.sleep||d.feel)note.push("sonno "+(d.sleep||"–")+"/5, umore "+(d.feel||"–")+"/5");
      rowsH+=`<div class="wrow ${d.eat?"":"vuota"}">
        <div class="wd">${giorno(d.day).slice(0,3)}${d.completed?"":`<span class="wpend" title="${tr("Giornata non ancora completata")}">${tr("in corso")}</span>`}</div>
        <div class="wmain">
          <div class="wtop">
            <span class="wk">${d.eat?d.eat+" / "+pk+" kcal":tr("niente segnato")}</span>
            <span class="wdef ${d.def>=0?"ok":"no"}">${d.eat?((d.def>=0?"−":"+")+Math.abs(d.def)):""}</span>
          </div>
          <div class="wbar"><i style="width:${pct}%;background:${dEat<=0?"var(--bosco)":"var(--zaff)"}"></i></div>
          ${note.length?`<div class="wnote">${note.join(" · ")}</div>`:""}
        </div>
        <div class="wq">${d.eat?arcoMiniHTML(d.eat,pk,tr("{v} su {q} kcal",{v:d.eat,q:pk})):qDot(q,12)}</div>
      </div>`;});
    h+=`<div class="gsec">${tr("Questa settimana")}</div>`;
  h+=`<div class="card"><h2>${tr("Riepilogo della settimana in corso")}</h2>
  ${tr("Come sta andando la settimana, giorno per giorno, rispetto a quello che avevi pianificato.")}
    <div class="wlist">${rowsH}</div>
    ${hint2(tr("La barra è quanto hai mangiato rispetto al piano di quel giorno:"),tr("Verde se sei rimasto dentro, rossa se l'hai superato. Il numero a destra è il deficit."))}
    <div class="stat3"><div><div class="v">${w.avgEat}</div><div class="l">kcal medie</div></div>
    <div><div class="v">${w.avgProt} g</div><div class="l">prot medie</div></div>
    <div><div class="v">−${w.avgDef}</div><div class="l">deficit medio</div></div></div>
    ${S.history.length?(()=>{const L=S.history[S.history.length-1];const d1=w.avgDef-L.avgDef,d2=w.avgProt-L.avgProt,d3=Math.round((S.profile.w-L.weight)*10)/10;
      return `<div class="hint"> vs settimana scorsa: deficit ${d1>=0?"+":""}${d1} kcal · proteine ${d2>=0?"+":""}${d2} g · peso ${d3>0?"+":""}${d3} kg</div>`;})():""}
    <div class="hint"> ${trh("A fine settimana l'archiviazione è {b}; le settimane chiuse restano modificabili con la matita qui sotto.",{b:"<b>automatica</b>"})}</div>
    <button class="btn ghost" onclick="waWeek()">WhatsApp</button>
    <button class="btn ghost" onclick="printVisita()">${tr("Foglio per la visita")}</button>
    <button class="btn ghost" onclick="printReport()">Esporta report PDF</button></div>`;
  }
  h+=`<!--SCHEDA:analisi-->`;
  h+=extendedRecapHTML();
  // Periodi (Dieta 1, Libero 1, …) con metriche e valutazione AI

  // Analisi: periodi, grafici multi-metrica, coaching AI
  h+=`<div class="gsec">${tr("I tuoi numeri")}</div>`;
  /* Gli schemi hanno casa in «Come stai»: qui resta un rimando, non una copia. */
  h+=(function(){
    const r=analizzaSchemi();
    if(r.pochi||!r.schemi.length)return "";
    return `<div class="card"><h2>${tr("I tuoi schemi")}</h2>
      <div class="hint">${tr("Ne ho trovati {n} negli ultimi giorni: sonno, stress e fame nervosa spiegano parte di quello che vedi qui sotto.",{n:r.schemi.length})}</div>
      <div class="mtools"><button class="btn small" onclick="show('comestai')">${tr("Vedi in Come stai")}</button></div></div>`;})();
  h+=`<div class="card"><h2>Analisi</h2>
  I tuoi numeri nel tempo: scegli il periodo e cosa mettere sul grafico.
  <div class="row2"><div><label>Periodo</label><select id="anMode" onchange="drawAnalysis()">
  <option value="giorno" ${AN.mode==="giorno"?"selected":""}>Giornaliero</option>
  <option value="settimana" ${AN.mode==="settimana"?"selected":""}>Settimanale</option>
  <option value="mese" ${AN.mode==="mese"?"selected":""}>Mensile</option>
  <option value="anno" ${AN.mode==="anno"?"selected":""}>Annuale</option>
  <option value="manuale" ${AN.mode==="manuale"?"selected":""}>Periodo manuale</option>
  </select></div>
  <div id="anManual" class="row2" style="display:${AN.mode==="manuale"?"flex":"none"}">
  <div><label>Da</label><input type="date" id="anFrom" value="${AN.from||(dietStartDate()?iso(dietStartDate()):"")}" onchange="drawAnalysis()"></div>
  <div><label>A</label><input type="date" id="anTo" value="${AN.to||""}" onchange="drawAnalysis()"></div></div></div>
  ${dietStartLabel()?`<div class="hint">${tr("I periodi partono dall'inizio del tuo primo periodo di dieta:")} <b>${dietStartLabel()}${tr("</b>. In «Periodo manuale» puoi comunque scegliere qualsiasi intervallo.")}</div>`:""}
  <div class="hint" id="anHint"></div>
  </div>`;
  h+=`<!--SCHEDA:peso-->`;
  h+=`<div class="card chart"><div class="cht">${tr("Peso e massa grassa")}</div><canvas id="chAnWeight" height="160"></canvas></div>`;
  h+=`<div class="card chart"><div class="cht">${tr("Calorie e deficit")}</div><canvas id="chAnCal" height="160"></canvas></div>`;
  h+=`<div class="card chart"><div class="cht">Macronutrienti</div><canvas id="chAnMacro" height="160"></canvas></div>`;
  h+=`<div class="card">
  <button class="btn" style="width:100%" onclick="askProgress()">${tr("Chiedi un'analisi dei progressi")}</button>
  ${hint2(tr("Considera pasti, resoconti settimanali, sonno/relax/umore e allenamenti del periodo scelto sopra."),tr("Solo suggerimenti: nessun parametro viene cambiato in automatico."))}
  <div class="aibox" aria-live="polite" id="anAI" style="display:none"></div></div>`;
  //  Obiettivo e proiezione (curva non lineare vs peso reale)
  h+=`<div class="card"><h2>${tr("Obiettivo e proiezione")}</h2>
  <div class="hint" id="projText" style="margin-top:0"></div>
  <canvas id="chGoalProj" height="170"></canvas>
  ${hint2(tr("Curva ideale non lineare verso l'obiettivo (dieta + passi/allenamenti obiettivo) confrontata col peso reale registrato:"),tr("Il delta dice se sei avanti o indietro rispetto al piano."))}</div>`;
  //  Insight dai sensori già attivi nei prompt: ora li vedi anche tu
  h+=(function(){
    let g="";
    const hs=hungerStats();
    if(hs&&hs.avg>=3.2)g+=`<div class="card"><h2>${tr("La fame è alta")}</h2>
      <div class="hint" style="margin-top:4px">${tr("Negli ultimi 14 giorni la fame media segnata è")} <b>${hs.avg}${tr("/5</b>. L'AI lo sa già: a parità di calorie sta aumentando sazietà e volume (fibre, proteine, zuppe e verdure) in ogni proposta.")}</div></div>`;
    const cs=crashStats();
    if(cs&&cs.n>=3)g+=`<div class="card"><h2>${tr("Cali di energia ricorrenti")}</h2>
      <div class="hint" style="margin-top:4px">${trh("<b>{v3} cali</b> segnalati di recente, per lo più dopo «{v1}» (in media {v2}g di carboidrati). L'AI sta già spostando i carboidrati raffinati di quel pasto e alzando proteine e fibre per appiattire la curva.",{v3:cs.n,v1:esc(cs.top),v2:cs.carbMedi})}</div></div>`;
    return g;})();
  //  Correlazioni: cosa influenza i risultati
  h+=`<div class="card"><h2>${tr("Cosa influenza i tuoi risultati")}</h2>
  Confronto tra sonno, umore e allenamento e il tuo deficit/sfori (giorni difficili esclusi).
  ${(function(){const hs=hungerStats(),cs=crashStats();let x="";
    if(hs&&hs.avg>=3.2)x+=`<div class="card"><h2>Fame alta</h2><div class="hint">Media <b>${hs.avg}${trh("/5</b> negli ultimi {v1} giorni con pallini segnati. L'AI lo sa già: a parità di calorie sta aumentando fibre, proteine e volume nei piatti che ti propone.",{v1:hs.n})}</div></div>`;
    if(cs)x+=`<div class="card"><h2>${tr("Cali di energia")}</h2><div class="hint">${trh("<b>{v3} segnalazioni</b> recenti, per lo più dopo «{v1}» (~{v2}g di carboidrati in media). Nei ribilanci l'AI riduce i raffinati proprio lì.",{v3:cs.n,v1:cs.top,v2:cs.carbMedi})}</div></div>`;
    return x;})()}
  ${correlationsSummaryHtml()}
  <button class="btn ghost" style="margin-top:12px" onclick="askCorrelations()">${tr("Analisi AI dei pattern")}</button>
  <div class="aibox" aria-live="polite" id="corrAI" style="display:none"></div></div>`;
  //  Chiedi all'AI: domande libere sui propri risultati/dati
  h+=`<div class="card"><h2>Chiedi all'AI</h2>
  ${hint2(tr("Domande sui tuoi risultati, alimentazione, peso e obiettivi (es."),tr("«sto mangiando in modo corretto?» oppure «in quanto tempo raggiungo l'obiettivo continuando così?»). Rispondo solo a domande inerenti ai tuoi dati."))}
  <textarea id="diaryQ" rows="2" placeholder="${tr("Scrivi la tua domanda…")}" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--linea);border-radius:12px;font-size:14.5px;resize:vertical"></textarea>
  <button class="btn ghost" style="margin-top:8px" onclick="askDiaryQuestion()">Invia domanda</button>
  <div class="aibox" aria-live="polite" id="diaryQA" style="display:none"></div></div>`;
  // Storia
  //  Mesi passati: riepilogo per mese chiuso, dalle settimane archiviate
  h+=`<!--SCHEDA:archivio-->`;
  {const ymNow=iso(new Date()).slice(0,7);
   const md=flattenDiet().filter(d=>d.eat>0&&d.date.slice(0,7)<ymNow);
   const mb={};md.forEach(d=>{(mb[d.date.slice(0,7)]=mb[d.date.slice(0,7)]||[]).push(d);});
   const mkeys=Object.keys(mb).sort().reverse();
   if(mkeys.length){
     h+=`<div class="gsec">Archivio</div>`;
  h+=`<div class="card"><h2>Mesi passati</h2>
  Le medie mese per mese: servono a vedere la tendenza di fondo, al netto delle oscillazioni di una singola settimana.<table><tr><th>Mese</th><th class="n">Mangiate</th><th class="n">Prot</th><th class="n">Sport</th><th class="n">Deficit</th></tr>`;
     mkeys.forEach(k=>{const arr=mb[k];const n=arr.length;const avg=f=>Math.round(arr.reduce((a,d)=>a+(d[f]||0),0)/n);
       h+=`<tr><td>${new Date(k+"-01T12:00:00").toLocaleDateString(dataLoc(),{month:"long",year:"numeric"})} <small style="color:var(--grigio)">(${n}g)</small></td>
       <td class="n">${avg("eat")}</td><td class="n">${avg("prot")}g</td><td class="n">${avg("burn")}</td>
       <td class="n" style="color:${avg("def")>=0?"var(--salvia)":"var(--zaff)"}">${avg("def")>=0?"−":"+"}${Math.abs(avg("def"))}</td></tr>`;});
     h+=`</table>Medie giornaliere dei mesi conclusi (solo giorni tracciati).</div>`;}}
  h+=`<div class="card"><h2>${tr("Settimane passate")}</h2>`;
  if(!S.history.length)h+=vuotoDi("storico");
  S.history.slice().reverse().forEach((wk,ri)=>{const i=S.history.length-1-ri;
    h+=`<div class="histweek" id="hw${i}"><div class="hh" onclick="document.getElementById('hw${i}').classList.toggle('open')">
      <span>${new Date(wk.from).toLocaleDateString(dataLoc())} → ${new Date(wk.to).toLocaleDateString(dataLoc())}</span>
      <span style="color:var(--salvia)">−${wk.avgDef}/g</span></div><div class="hb">
      <span class="pill">${wk.avgEat} kcal medie</span><span class="pill">${wk.avgProt} g prot</span>
      <span class="pill">${wk.totBurn} kcal sport</span><span class="pill">peso ${wk.weight} kg</span>`;
    if(wk.ai&&wk.ai.report)h+=`<div class="aibox" aria-live="polite"> ${esc(wk.ai.report)}${wk.ai.corr?"\n\n "+esc(wk.ai.corr):""}</div>`;
    /* L'analisi non si genera più da sola alla chiusura: si chiede qui,
       quando si guarda la settimana e si ha voglia di leggerla. */
    else if(aiOn())h+=`<div class="mtools"><button class="btn ghost small" onclick="weekAnalisi(${i})">${tr("Chiedi l'analisi della settimana")}</button></div>`;
    if(editWeekIdx===i){h+=renderWeekEditForm(i,wk);}
    else{
      wk.days.forEach(d=>{if(!d)return;if(d.note||(d.workouts||[]).length)h+=`<div style="margin-top:4px"><b>${giorno(d.day)}:</b> ${esc((d.workouts||[]).join(", "))}${d.note?" —  "+esc(d.note):""}</div>`;});
      h+=`<div class="mtools" style="margin-top:8px">
        <button class="btn ghost small" onclick="toggleEditWeek(${i})">${tr("Modifica")}</button>
        <button class="btn warn small" onclick="delWeek(${i})">${tr("Elimina")}</button></div>`;}
    h+=`</div></div>`;});
  h+=`</div>`;                 /* chiude «Settimane passate»: le card che seguono sono sorelle, non figlie */
  h+=weightsCardHTML();
  h+=notesCardHTML();
  h+=exportCardHTML();
  h+=`</div>`;el.innerHTML=schedeFiltra(h,schedaAttiva(SK,"settimana"));drawWeightsChart();drawAnalysis();drawGoalProjection();renderProgressBox();}
/* ── Modifica settimane passate ──────────────────────────────────────────
   Le settimane chiuse archiviano solo dati aggregati per giorno (kcal, prot,
   carbo, grassi, sport bruciato, sonno/relax/umore, note, allenamenti come
   testo): qui si possono correggere. Il deficit e le medie della settimana
   vengono RICALCOLATI da questi valori al salvataggio (stesso TDEE usato
   all'epoca, salvato in wk.tdee). */
let editWeekIdx=null;
window.toggleEditWeek=(i)=>{editWeekIdx=(editWeekIdx===i?null:i);render("storico");
  setTimeout(()=>{const el=document.getElementById("hw"+i);if(el)el.classList.add("open");},0);};
function renderWeekEditForm(i,wk){
  const from=safeDate((wk.from||"")+"T12:00:00")||new Date();
  let h=`${hint2(tr("Modifica i valori dei singoli giorni."),tr("Al salvataggio il deficit e le medie della settimana vengono ricalcolati."))}`;
  wk.days.forEach((d,di)=>{
    const dateKey=iso(new Date(from.getFullYear(),from.getMonth(),from.getDate()+di,12));
    h+=`<div style="border:1px solid var(--bordo);border-radius:12px;padding:8px;margin-top:8px">
      <div style="font-weight:700;font-size:13px;margin-bottom:4px">${giorno(d.day)} <span style="font-weight:400;color:var(--grigio);font-size:11.5px">(${dateKey})</span>
      <label style="float:right;font-weight:400;font-size:11.5px"><input type="checkbox" id="we_${i}_${di}_ok" ${d.completed?"checked":""}> completato</label></div>
      <div class="row2"><div><label>Mangiate (kcal)</label><input type="number" id="we_${i}_${di}_eat" value="${d.eat}"></div>
      <div><label>Prot (g)</label><input type="number" id="we_${i}_${di}_prot" value="${d.prot}"></div></div>
      <div class="row3"><div><label>Carb (g)</label><input type="number" id="we_${i}_${di}_c" value="${d.c||0}"></div>
      <div><label>Grassi (g)</label><input type="number" id="we_${i}_${di}_f" value="${d.f||0}"></div>
      <div><label>Fibre (g)</label><input type="number" id="we_${i}_${di}_fib" value="${d.fib||0}"></div></div>
      <div class="row2"><div><label>Sport bruciato (kcal)</label><input type="number" id="we_${i}_${di}_burn" value="${d.burn||0}"></div>
      <div><label>Sgarri (kcal)</label><input type="number" id="we_${i}_${di}_sgarri" value="${d.sgarri||0}"></div></div>
      <div class="row2"><div><label>Sonno/Relax/Umore (1-5)</label><div style="display:flex;gap:4px">
        <input type="number" min="1" max="5" id="we_${i}_${di}_sleep" value="${d.sleep||""}" style="width:33%">
        <input type="number" min="1" max="5" id="we_${i}_${di}_relax" value="${d.relax||""}" style="width:33%">
        <input type="number" min="1" max="5" id="we_${i}_${di}_feel" value="${d.feel||""}" style="width:33%"></div></div>
      <div><label>${tr("Allenamenti (uno per riga)")}</label></div></div>
      <textarea id="we_${i}_${di}_workouts" rows="2" style="width:100%;box-sizing:border-box">${esc((d.workouts||[]).join("\n"))}</textarea>
      <div style="margin-top:4px"><label>Note</label><input type="text" id="we_${i}_${di}_note" value="${esc(d.note||"")}" style="width:100%;box-sizing:border-box"></div>
      </div>`;});
  h+=`<div class="mtools" style="margin-top:12px">
    <button class="btn small" onclick="saveWeekEdit(${i})">${tr("Ricalcola e salva")}</button>
    <button class="btn ghost small" onclick="toggleEditWeek(${i})">${tr("Annulla")}</button></div>`;
  return h;}

window.saveWeekEdit=(i)=>{
  const wk=S.history[i];
  wk.days.forEach((d,di)=>{
    d.eat=parseFloat(document.getElementById(`we_${i}_${di}_eat`).value)||0;
    d.prot=parseFloat(document.getElementById(`we_${i}_${di}_prot`).value)||0;
    d.c=parseFloat(document.getElementById(`we_${i}_${di}_c`).value)||0;
    d.f=parseFloat(document.getElementById(`we_${i}_${di}_f`).value)||0;
    d.fib=parseFloat(document.getElementById(`we_${i}_${di}_fib`).value)||0;
    d.burn=parseFloat(document.getElementById(`we_${i}_${di}_burn`).value)||0;
    d.sgarri=parseFloat(document.getElementById(`we_${i}_${di}_sgarri`).value)||0;
    d.sleep=parseFloat(document.getElementById(`we_${i}_${di}_sleep`).value)||0;
    d.relax=parseFloat(document.getElementById(`we_${i}_${di}_relax`).value)||0;
    d.feel=parseFloat(document.getElementById(`we_${i}_${di}_feel`).value)||0;
    d.note=document.getElementById(`we_${i}_${di}_note`).value||"";
    d.workouts=document.getElementById(`we_${i}_${di}_workouts`).value.split("\n").map(x=>x.trim()).filter(Boolean);
    d.completed=document.getElementById(`we_${i}_${di}_ok`).checked;
    d.def=(wk.tdee||tdee())+d.burn-d.eat;});
  const done=wk.days.filter(d=>d.completed);
  const avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):0;
  wk.nDone=done.length;wk.avgEat=avg(done.map(d=>d.eat));wk.avgProt=avg(done.map(d=>d.prot));wk.avgDef=avg(done.map(d=>d.def));
  wk.totBurn=wk.days.reduce((a,d)=>a+d.burn,0);
  // (altrimenti conterebbero due volte): li tolgo dall'archivio in sospeso.
  S.history[i]=wk;save();editWeekIdx=null;render("storico");dlgAlert(tr("Settimana ricalcolata e salvata."));};
/* ═══════════════════════════════════════════════════════════════
   ANALISI STORICO: periodi (giorno/settimana/mese/anno/manuale),
   grafici multi-metrica (calorie, peso, macro) + coaching AI
   con cronologia a tendina (solo l'ultima analisi resta visibile).
   ═══════════════════════════════════════════════════════════════ */
let AN={mode:"settimana"};
let ANCH={cal:null,weight:null,macro:null};
/* Tutti i giorni (storico + settimana in corso) con data reale calcolata */
function flattenDiet(){
  const out=[];
  S.history.forEach(w=>{
    const base=safeDate((w.from||"")+"T12:00:00")||safeDate(w.from);
    if(!base)return;                 /* settimana senza data valida: si salta */
    (w.days||[]).forEach((d,i)=>{
    const dt=new Date(base.getTime());dt.setDate(dt.getDate()+i);
    out.push({date:iso(dt),eat:d.eat||0,prot:d.prot||0,c:d.c||0,f:d.f||0,fib:d.fib||0,z:d.z||0,
      planK:d.planK||0,planP:d.planP||0,planC:d.planC||0,planF:d.planF||0,planFib:d.planFib||0,planZ:d.planZ||0,
      def:d.def||0,burn:d.burn||0,tdee:d.tdee||0,
      sleep:d.sleep||0,relax:d.relax||0,feel:d.feel||0,water:d.water||0,
      cycle:!!d.cycle,lact:d.lact||"no",physK:d.physK||0,hungerAvg:d.hungerAvg||0,
      note:d.note||"",workouts:d.workouts||[],workoutN:(d.workouts||[]).length,
      mealsDone:d.mealsDone||0,mealsSkip:d.sk||0,mealsTot:d.mealsTot||0,extrasN:d.extrasN||0,
      sgarri:d.sgarri||0,completed:!!d.completed,hard:isHard(iso(dt)),
      moved:0,rebalanced:!!d.rebalanced,recovered:d.recovered||0});});});
  const wkStart=new Date(S.week.started+"T12:00:00"),today=new Date();today.setHours(12,0,0,0);
  PLAN.forEach((pd,di)=>{
    const dt=new Date(wkStart);dt.setDate(dt.getDate()+di);
    if(dt>today)return;
    const e=eatenOfDay(di),pl=plannedOfDay(di),D=S.week.days[di];
    out.push({date:iso(dt),eat:e.k,prot:e.p,c:e.c||0,f:e.f||0,fib:e.fib||0,z:e.z||0,
      planK:pl.k,planP:pl.p,planC:pl.c||0,planF:pl.f||0,planFib:pl.fib||0,planZ:pl.z||0,
      def:deficitOfDay(di),burn:burnedOfDay(di),tdee:tdeeOfDay(di),
      sleep:D.sleep||0,relax:D.relax||0,feel:D.feel||0,water:D.water||0,
      note:D.note||"",workouts:(D.workouts||[]).map(w=>w.sport+" "+w.min+"' "+(w.int||"media")),
      workoutN:(D.workouts||[]).length,
      mealsDone:dayItems(di).filter(it=>S.week.days[it.pdi].meals[it.mi].done).length,
      mealsSkip:skippedOfDay(di),mealsTot:dayItems(di).length,
      extrasN:(D.extras||[]).filter(x=>x.st!=="skip").length,
      sgarri:extrasKcal(di),completed:dayCompleted(di),hard:isHard(iso(dt)),
      moved:dayItems(di).filter(it=>it.pdi!==di).length,
      rebalanced:dayItems(di).some(it=>/ribilanciato|recupero/.test((S.week.days[it.pdi].meals[it.mi].custom||{}).d||"")),
      recovered:D.rgpRecovered||0});});
  out.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
  return out;}
/* Quante colonne mostrare: le calcoliamo in base alla LARGHEZZA del grafico,
   puntando a ~12 (così i mesi mostrano di fatto l'ultimo anno "rolling"), ma
   adattandoci a schermi più larghi/stretti invece di usare un numero fisso. */
function bucketsToShow(){
  const el=document.getElementById("chAnCal");
  let w=el&&el.clientWidth?el.clientWidth:0;
  if(!w){const pg=document.querySelector(".page.active");w=(pg&&pg.clientWidth)||document.body.clientWidth||340;}
  const perCol=26; // px per colonna leggibile
  return Math.max(6,Math.min(24,Math.round(w/perCol)));}
function periodBounds(mode,n){
  if(!n)n=bucketsToShow();
  const today=new Date();today.setHours(12,0,0,0);
  const back=d=>{const x=new Date(today);x.setDate(x.getDate()-d);return x;};
  if(mode==="giorno")return{from:back(n-1),to:today,bucket:"day"};
  if(mode==="settimana")return{from:back((n-1)*7),to:today,bucket:"week"};
  if(mode==="mese"){const f=new Date(today.getFullYear(),today.getMonth()-(n-1),1);f.setHours(12,0,0,0);return{from:f,to:today,bucket:"month"};}
  if(mode==="anno"){const f=new Date(today.getFullYear()-(n-1),0,1);f.setHours(12,0,0,0);return{from:f,to:today,bucket:"year"};}
  const f=document.getElementById("anFrom"),t=document.getElementById("anTo");
  const fromD=f&&f.value?new Date(f.value+"T12:00:00"):(dietStartDate()||back(30));
  const toD=t&&t.value?new Date(t.value+"T12:00:00"):today;
  const days=(toD-fromD)/864e5;
  return{from:fromD,to:toD,bucket:days>75?"month":"day"};}
/* Inizio del primo periodo di dieta: è da lì che ha senso far partire le
   analisi, non da una finestra fissa di 30 giorni. Se non ci sono periodi,
   si parte dal primo giorno con dati. */
function dietStartDate(){
  const ps=(S.periods||[]).filter(p=>p.start).sort((a,b)=>a.start<b.start?-1:1);
  if(ps.length){const d=safeDate(ps[0].start+"T12:00:00");if(d)return d;}
  const rows=flattenDiet();
  if(rows.length){const d=safeDate(rows[0].date+"T12:00:00");if(d)return d;}
  return null;}
function dietStartLabel(){const d=dietStartDate();
  return d?d.toLocaleDateString(dataLoc(),{day:"numeric",month:"long",year:"numeric"}):null;}
function bucketKey(d,bucket){
  if(bucket==="day")return d.date;
  if(bucket==="year")return d.date.slice(0,4);
  if(bucket==="month")return d.date.slice(0,7);
  const dt=new Date(d.date+"T12:00:00");const day=(dt.getDay()+6)%7;dt.setDate(dt.getDate()-day);
  return iso(dt);}
function bucketLabel(key,bucket){
  if(bucket==="year")return key;
  if(bucket==="month"){const p=key.split("-");return new Date(+p[0],+p[1]-1,1).toLocaleDateString(dataLoc(),{month:"short",year:"2-digit"});}
  const dt=new Date(key+"T12:00:00");
  return dt.toLocaleDateString(dataLoc(),{day:"numeric",month:"short"});}
function aggregateDiet(mode){
  const {from,to,bucket}=periodBounds(mode);
  const all=flattenDiet().filter(d=>{const dt=new Date(d.date+"T12:00:00");return dt>=from&&dt<=to;});
  const buckets={};
  all.forEach(d=>{const k=bucketKey(d,bucket);(buckets[k]=buckets[k]||[]).push(d);});
  const keys=Object.keys(buckets).sort();
  const rows=keys.map(k=>{const arr=buckets[k];const n=arr.length;
    const avg=fld=>Math.round(arr.reduce((a,x)=>a+(x[fld]||0),0)/n);
    return{key:k,label:bucketLabel(k,bucket),n,eat:avg("eat"),prot:avg("prot"),c:avg("c"),f:avg("f"),fib:avg("fib"),def:avg("def"),burn:avg("burn")};});
  return {rows,all,from,to,bucket};}
function aggregateWeight(mode){
  const {from,to,bucket}=periodBounds(mode);
  const ws=S.profile.weights.filter(x=>{const dt=giornoDa(x.d);return dt>=from&&dt<=to;});
  if(bucket==="day")return ws.map(x=>({label:giornoDa(x.d).toLocaleDateString(dataLoc(),{day:"numeric",month:"short"}),w:x.w,fat:x.fat}));
  const buckets={};
  ws.forEach(x=>{const dstr=iso(giornoDa(x.d));let k;
    if(bucket==="year")k=dstr.slice(0,4);else if(bucket==="month")k=dstr.slice(0,7);
    else{const dt=new Date(dstr+"T12:00:00");const day=(dt.getDay()+6)%7;dt.setDate(dt.getDate()-day);k=iso(dt);}
    (buckets[k]=buckets[k]||[]).push(x);});
  const keys=Object.keys(buckets).sort();
  return keys.map(k=>{const arr=buckets[k];const n=arr.length;
    const avgw=arr.reduce((a,x)=>a+x.w,0)/n;
    const fats=arr.filter(x=>x.fat!=null);const avgf=fats.length?fats.reduce((a,x)=>a+x.fat,0)/fats.length:null;
    return{label:bucketLabel(k,bucket),w:Math.round(avgw*10)/10,fat:avgf!=null?Math.round(avgf*10)/10:null};});}
function drawAnalysis(){
  const modeSel=document.getElementById("anMode");if(modeSel)AN.mode=modeSel.value;
  const manual=document.getElementById("anManual");if(manual)manual.style.display=AN.mode==="manuale"?"flex":"none";
  const hint=document.getElementById("anHint");
  if(window._noChart||typeof Chart==="undefined"){if(hint)hint.textContent="Grafici non disponibili offline (Chart.js si carica da internet al primo avvio).";return;}
  const {rows}=aggregateDiet(AN.mode);
  const wrows=aggregateWeight(AN.mode);
  if(hint)hint.textContent=rows.length?"":"Nessun dato nel periodo selezionato.";
  [ANCH.cal,ANCH.weight,ANCH.macro].forEach(c=>{if(c)c.destroy();});
  const calEl=document.getElementById("chAnCal");
  if(calEl&&rows.length)ANCH.cal=new Chart(calEl,{type:"line",
    data:{labels:rows.map(r=>r.label),datasets:[
      {label:"Kcal mangiate",data:rows.map(r=>r.eat),tension:.3,borderColor:"#00AFA3",pointRadius:2},
      {label:"Deficit",data:rows.map(r=>r.def),tension:.3,borderColor:"#B23B3B",pointRadius:2,borderDash:[5,4]}]},
    options:{plugins:{legend:{labels:{boxWidth:11,font:{size:10}}}},scales:{x:{ticks:{font:{size:9}}}}}});
  const wEl=document.getElementById("chAnWeight");
  if(wEl)ANCH.weight=new Chart(wEl,{type:"line",
    data:{labels:wrows.map(r=>r.label),datasets:[
      {label:trh("Peso ({v1})",{v1:((typeof unitaPeso==="function")?unitaPeso():"kg")}),data:wrows.map(r=>((x)=>((typeof pesoNum==="function")?pesoNum(x,1):x))(r.w)),tension:.3,borderColor:"#00AFA3",pointRadius:2},
      ...(S.profile.goalW?[{label:"Obiettivo",data:wrows.map(()=>S.profile.goalW),borderColor:"#0A4E49",borderDash:[6,5],pointRadius:0}]:[]),
      ...(wrows.some(r=>r.fat!=null)?[{label:"Grasso %",data:wrows.map(r=>r.fat),tension:.3,borderColor:"#E4632F",pointRadius:2,spanGaps:true,yAxisID:"y2"}]:[])]},
    options:{plugins:{legend:{labels:{boxWidth:11,font:{size:10}}}},scales:{x:{ticks:{font:{size:9}}},y2:{position:"right",grid:{drawOnChartArea:false}}}}});
  const mEl=document.getElementById("chAnMacro");
  if(mEl&&rows.length)ANCH.macro=new Chart(mEl,{type:"line",
    data:{labels:rows.map(r=>r.label),datasets:[
      /* I MACRO SONO TUTTI UGUALI (founder, 22/08): quattro linee, un
         colore solo con le sue tre gradazioni. La quarta non prende
         un colore nuovo — prende il TRATTEGGIO. Distinguere resta
         possibile, l'identità resta una. */
      {label:"Proteine (g)",data:rows.map(r=>r.prot),tension:.3,borderColor:"#0A4E49",pointRadius:2},
      {label:"Carboidrati (g)",data:rows.map(r=>r.c),tension:.3,borderColor:"#0C7C74",pointRadius:2},
      {label:"Grassi (g)",data:rows.map(r=>r.f),tension:.3,borderColor:"#00AFA3",pointRadius:2},
      {label:"Fibre (g)",data:rows.map(r=>r.fib),tension:.3,borderColor:"#0C7C74",
       borderDash:[5,4],pointRadius:2}]},
    options:{plugins:{legend:{labels:{boxWidth:11,font:{size:10}}}},scales:{x:{ticks:{font:{size:9}}}}}});}
window.drawAnalysis=drawAnalysis;
/*  Grafico proiezione: curva ideale non lineare (dalla prima pesata reale)
   verso l'obiettivo, sovrapposta al peso reale; mostra ETA da oggi e il delta. */
let GOALCH=null;
function goalEmptyChart(cv,msg){
  if(window._noChart||typeof Chart==="undefined")return;
  GOALCH=new Chart(cv,{type:"line",data:{labels:[],datasets:[{label:"Peso",data:[]},{label:"Proiezione ideale",data:[],borderDash:[6,4]},{label:"Obiettivo",data:[],borderColor:"#E4632F",borderDash:[3,3]}]},
    options:{plugins:{legend:{labels:{boxWidth:11,font:{size:10}}}},scales:{x:{ticks:{font:{size:9}}},y:{ticks:{font:{size:9}}}}}});}
function drawGoalProjection(){
  const txt=document.getElementById("projText"),cv=document.getElementById("chGoalProj");
  if(!cv)return;
  const p=S.profile;
  if(GOALCH){GOALCH.destroy();GOALCH=null;}
  if(window._noChart||typeof Chart==="undefined"){if(txt)txt.textContent="Grafico non disponibile offline (Chart.js si carica da internet).";return;}
  if(!p.goalW||!p.w){if(txt)txt.textContent=tr("Imposta peso attuale e obiettivo peso in Io per popolare la proiezione.");goalEmptyChart(cv);return;}
  const W=(p.weights||[]).filter(x=>x.w).slice().sort((a,b)=>giornoDa(a.d)-giornoDa(b.d));
  const anchorW=W.length?W[0].w:p.w,anchorDate=W.length?new Date(W[0].d):new Date();
  const sim=simulateWeightDescent(anchorW,anchorDate);   // curva ideale dal primo dato reale
  const simNow=simulateWeightDescent(p.w,new Date());     // ETA da adesso
  // Timeline unificata (per giorno) tra pesate reali e punti proiettati
  const realByKey={};W.forEach(x=>{realByKey[iso(giornoDa(x.d))]=x.w;});
  const projByKey={};if(sim)sim.points.forEach(pt=>{projByKey[iso(pt.d)]=pt.w;});
  const keys=Array.from(new Set([...Object.keys(realByKey),...Object.keys(projByKey)])).sort();
  if(!keys.length){if(txt)txt.textContent="Aggiungi almeno una pesata per popolare la proiezione.";goalEmptyChart(cv);return;}
  const labels=keys.map(k=>new Date(k+"T12:00:00").toLocaleDateString(dataLoc(),{day:"numeric",month:"short",year:"2-digit"}));
  const realData=keys.map(k=>realByKey[k]!=null?realByKey[k]:null);
  const projData=keys.map(k=>projByKey[k]!=null?projByKey[k]:null);
  const goalData=keys.map(()=>p.goalW);
  // Media mobile a 7 giorni del peso reale (smussa le oscillazioni di acqua/glicogeno)
  const mavgByKey={};W.forEach(x=>{const dt=giornoDa(x.d).getTime();
    const win=W.filter(y=>{const t=giornoDa(y.d).getTime();return t<=dt&&t>=dt-7*864e5;});
    mavgByKey[iso(giornoDa(x.d))]=Math.round(win.reduce((a,y)=>a+y.w,0)/win.length*10)/10;});
  const mavgData=keys.map(k=>mavgByKey[k]!=null?mavgByKey[k]:null);
  GOALCH=new Chart(cv,{type:"line",
    data:{labels,datasets:[
      {label:"Proiezione ideale",data:projData,borderColor:"#0A4E49",borderDash:[6,4],pointRadius:0,tension:0,spanGaps:true},
      {label:"Peso reale",data:realData,borderColor:"#9AD6CC",backgroundColor:"#9AD6CC",pointRadius:2,tension:.2,spanGaps:true},
      {label:"Media 7 gg",data:mavgData,borderColor:"#00AFA3",borderWidth:2,pointRadius:0,tension:.3,spanGaps:true},
      {label:"Obiettivo",data:goalData,borderColor:"#E4632F",borderDash:[3,3],pointRadius:0}
    ]},
    options:{plugins:{legend:{labels:{boxWidth:11,font:{size:10}}}},
      scales:{x:{ticks:{font:{size:9},maxTicksLimit:8}},y:{ticks:{font:{size:9}}}}}});
  if(txt){const parts=[];
    if(simNow){if(simNow.stalled)parts.push(trh("Con dieta e obiettivi attuali il deficit si annulla prima di {v1}: servirebbe mangiare meno o muoversi di più.",{v1:((typeof pesoTxt==="function")?pesoTxt(p.goalW,1):p.goalW+" kg")}));
      else parts.push("Stima: <b>"+p.goalW+" kg</b> intorno al <b>"+simNow.etaDate.toLocaleDateString(dataLoc(),{day:"numeric",month:"long",year:"numeric"})+trh("</b> (~{v1} giorni), ritmo non lineare.",{v1:simNow.etaDays}));}
    else parts.push("Sei già all'obiettivo o sotto: nessuna discesa da proiettare.");
    if(simNow&&simNow.pausa>0)parts.push(trh("La curva comprende <b>{v1} settimane di mantenimento</b> ({v2} giorni di deficit + {v3} di pausa): nei tratti piatti il peso resta fermo apposta. Allungano il percorso ma lo rendono sostenibile — si cambia in Regole → Fasi della dieta.",{v1:Math.round(simNow.pausa/7),v2:cycDefDays(),v3:cycMaintDays()}));
    // Delta reale-vs-ideale + tendenza (il divario si allarga o si chiude?)
    let worsening=false;
    if(W.length){const last=W[W.length-1],proj=projectedWeightAt(last.d);
      if(proj!=null){const delta=Math.round((last.w-proj)*10)/10;
        const deltas=W.map(x=>{const pr=projectedWeightAt(x.d);return pr!=null?(x.w-pr):null;}).filter(v=>v!=null);
        let trend="";
        if(deltas.length>=3){const r3=deltas.slice(-3),diff=r3[r3.length-1]-r3[0];
          if(diff>0.3){trend=" — divario in <b>aumento</b> ";worsening=true;}
          else if(diff<-0.3)trend=" — divario in <b>diminuzione</b> ";
          else trend=" — divario <b>stabile</b>";}
        parts.push("Scarto: reale "+last.w+" kg vs ideale "+proj+" kg → "+(delta<=0?("<b>"+Math.abs(delta)+" kg in anticipo</b>"):("<b>"+delta+" kg in ritardo</b>"))+trend+".");}}
    if(worsening)parts.push("Il divario peggiora da qualche pesata: conviene chiedere all'AI un'analisi qui sotto per capire cosa aggiustare.");
    txt.innerHTML=parts.join(" ");}}
window.drawGoalProjection=drawGoalProjection;
/*  #1 — Correlazioni: cosa fa andare meglio/peggio deficit e sgarri.
   Confronta gruppi di giorni (sonno alto/basso, con/senza allenamento, umore
   alto/basso), escludendo i giorni difficili e quelli senza pasti registrati. */
function computeCorrelations(){
  const days=flattenDiet().filter(d=>!d.hard&&(d.eat||0)>0);
  if(days.length<6)return {enough:false,n:days.length};
  const mean=arr=>arr.length?Math.round(arr.reduce((a,x)=>a+x,0)/arr.length):null;
  const goodSleep=days.filter(d=>d.sleep>=4),badSleep=days.filter(d=>d.sleep&&d.sleep<=2);
  const wDays=days.filter(d=>(d.burn||0)>150),rDays=days.filter(d=>(d.burn||0)<=150);
  const goodMood=days.filter(d=>d.feel>=4),badMood=days.filter(d=>d.feel&&d.feel<=2);
  return {enough:true,n:days.length,
    sonno:{n_alto:goodSleep.length,n_basso:badSleep.length,alto_def:mean(goodSleep.map(d=>d.def)),basso_def:mean(badSleep.map(d=>d.def)),alto_sgarri:mean(goodSleep.map(d=>d.sgarri)),basso_sgarri:mean(badSleep.map(d=>d.sgarri))},
    allenamento:{n_con:wDays.length,n_senza:rDays.length,con_def:mean(wDays.map(d=>d.def)),senza_def:mean(rDays.map(d=>d.def)),con_sgarri:mean(wDays.map(d=>d.sgarri)),senza_sgarri:mean(rDays.map(d=>d.sgarri))},
    umore:{n_alto:goodMood.length,n_basso:badMood.length,alto_def:mean(goodMood.map(d=>d.def)),basso_def:mean(badMood.map(d=>d.def)),alto_sgarri:mean(goodMood.map(d=>d.sgarri)),basso_sgarri:mean(badMood.map(d=>d.sgarri))}};}
function correlationsSummaryHtml(){
  const c=computeCorrelations();
  if(!c.enough)return `<div class="hint">${trh("Servono almeno ~6 giorni con pasti registrati (esclusi i difficili) per calcolare i pattern: ne hai {v1}.",{v1:c.n})}</div>`;
  const rows=[];
  if(c.sonno.n_alto>=2&&c.sonno.n_basso>=2)rows.push(` Sonno buono (≥4): deficit medio <b>${c.sonno.alto_def}</b> vs <b>${c.sonno.basso_def}${trh("</b> con poco sonno · sgarri {v1} vs {v2} kcal.",{v1:c.sonno.alto_sgarri,v2:c.sonno.basso_sgarri})}`);
  if(c.allenamento.n_con>=2&&c.allenamento.n_senza>=2)rows.push(` ${tr("Con allenamento: deficit medio")} <b>${c.allenamento.con_def}</b> vs <b>${c.allenamento.senza_def}</b> ${tr("nei giorni di riposo.")}`);
  if(c.umore.n_alto>=2&&c.umore.n_basso>=2)rows.push(` Umore alto (≥4): deficit medio <b>${c.umore.alto_def}</b> vs <b>${c.umore.basso_def}</b> · sgarri ${c.umore.alto_sgarri} vs ${c.umore.basso_sgarri} kcal.`);
  if(!rows.length)return `Non ci sono ancora gruppi abbastanza numerosi da confrontare: continua a registrare sonno, umore e allenamenti.`;
  return rows.map(r=>`<div style="margin-top:8px;font-size:13px">${r}</div>`).join("");}
window.askCorrelations=async()=>{
  const box=document.getElementById("corrAI");const c=computeCorrelations();
  if(!c.enough){if(box){box.style.display="block";genBoxMostra(box);box.textContent="Servono almeno ~6 giorni con pasti registrati (esclusi i difficili) per trovare correlazioni.";}return;}
  if(!aiOn())return aiFail(new Error("nokey"));
  if(box){box.style.display="block";genBoxMostra(box);box.textContent="Sto cercando i pattern…";}
  try{
    const t=await aiAsk(trh("Sei un coach dati. Da questi confronti (medie di deficit e sgarri per gruppi di giorni: sonno alto/basso, con/senza allenamento, umore alto/basso) trova i PATTERN più utili e spiegali come CORRELAZIONI, non come causa certa. Italiano, max 5-6 frasi, niente elenchi puntati né markdown. Dati: {v1}. Concludi con UN suggerimento pratico. Se un gruppo ha pochi giorni (n<3) dichiara che è solo un indizio.",{v1:JSON.stringify(c)})+
      (function(){const n=flattenDiet().filter(d=>d.note&&String(d.note).trim()).slice(-14);
        return n.length?" Note scritte dalla persona nei giorni recenti, usale per interpretare i numeri: "+n.map(d=>d.date+": "+String(d.note).slice(0,120)).join(" | "):"";})());
    if(box)box.textContent=t;
  }catch(e){if(box)box.style.display="none";genBoxVia();aiFail(e);}};
/*  Analisi dei progressi: SOLO testo/suggerimenti, nessuna modifica automatica ai parametri */
window.askProgress=async()=>{
  if(!aiOn())return aiFail(new Error("nokey"));
  const {all}=aggregateDiet(AN.mode);
  if(!all.length)return dlgAlert(tr("Non ci sono ancora dati nel periodo selezionato."));
  const wrows=aggregateWeight(AN.mode);
  const avg=fld=>Math.round(all.reduce((a,x)=>a+(x[fld]||0),0)/all.length);
  const workoutsCount={};all.forEach(d=>(d.workouts||[]).forEach(w=>{const sport=w.split(" ")[0];workoutsCount[sport]=(workoutsCount[sport]||0)+1;}));
  const notes=all.map(d=>d.note).filter(Boolean).slice(-6);
  const {from,to}=periodBounds(AN.mode);
  const weekReports=S.history.filter(w=>{const dt=new Date(w.to);return dt>=from&&dt<=to;})
    .map(w=>w.ai&&w.ai.report).filter(Boolean).slice(-4);
  const withMeals=all.filter(d=>(d.eat||0)>0);
  const avgReal=fld=>withMeals.length?Math.round(withMeals.reduce((a,x)=>a+(x[fld]||0),0)/withMeals.length):null;
  const plan=plannedDietSummary();const TDEE=tdee();
  // Sport+passi: media giornaliera VERA sui giorni realmente tracciati (dal
  // diario completo, non dai bucket aggregati che diluirebbero/gonfierebbero),
  // così non prendo il dato grezzo di un singolo giorno.
  const act=activityDailyAvg(flattenDiet().slice(-30));
  const deficitDieta=TDEE-plan.kcal_giorno;
  const payload={periodo:AN.mode,giorni_analizzati:all.length,
    dieta_pianificata:{kcal_giorno:plan.kcal_giorno,proteine_g:plan.proteine_g,
      deficit_dieta_giorno:deficitDieta,
      sport_passi_media_giornaliera_kcal:act.media_giornaliera_kcal,giorni_considerati_per_sport:act.giorni_considerati,campione_sport_sufficiente:act.campione_sufficiente,
      deficit_teorico_giorno:deficitDieta+(act.campione_sufficiente?act.media_giornaliera_kcal:0)},
    tdee_kcal:TDEE,
    dati_reali:{giorni_con_pasti_registrati:withMeals.length,kcal_medie:avgReal("eat"),deficit_medio_reale:avgReal("def")},
    kcal_medie:avg("eat"),proteine_medie:avg("prot"),carboidrati_medi:avg("c"),grassi_medi:avg("f"),deficit_medio:avg("def"),
    peso_inizio_periodo:wrows.length?wrows[0].w:null,peso_fine_periodo:wrows.length?wrows[wrows.length-1].w:null,
    sonno_medio:avg("sleep")||null,relax_medio:avg("relax")||null,umore_medio:avg("feel")||null,
    allenamenti_per_tipo:workoutsCount,note_recenti:notes,resoconti_settimanali_precedenti:weekReports};
  const box=document.getElementById("anAI");if(box){box.style.display="block";genBoxMostra(box);box.textContent="‍ Sto analizzando i tuoi progressi…";}
  try{
    const t=await aiAsk("Sei un coach nutrizionale onesto e diretto. Analizza questi dati del periodo scelto dall'utente: "+JSON.stringify(payload)+
      ". Considera insieme: alimentazione (kcal/macro/deficit), andamento del peso, come si sente (sonno/relax/umore) e attività fisica svolta. Rispondi in italiano, MASSIMO 5-6 frasi, diretto e concreto, senza elenchi puntati e senza markdown. "+
      "Per stime/proiezioni sul tempo per raggiungere l'obiettivo (1 kg grasso ≈ 7700 kcal): BASE dal deficit dieta = dieta_pianificata.deficit_dieta_giorno (TDEE − intake) se i dati reali sono pochi (meno di ~7 giorni con pasti); con abbastanza dati reali usa il ritmo di peso osservato o dati_reali.deficit_medio_reale. Aggiungi lo sport SOLO come dieta_pianificata.sport_passi_media_giornaliera_kcal (media giornaliera già pronta) e solo se campione_sport_sufficiente è true, mai col dato grezzo di un singolo giorno. "+
      "Se noti che i risultati non stanno arrivando, PROPONI (mai imporre) un possibile aggiustamento generico, lasciando all'utente la decisione se e dove applicarlo nell'app; se i dati sono pochi per giudicare, dillo chiaramente invece di inventare conclusioni.");
    S.progressLog.push({t:new Date().toISOString(),period:AN.mode,text:t});save();renderProgressBox();
  }catch(e){if(box)box.style.display="none";genBoxVia();aiFail(e);}};
/* Mostra solo l'ultima analisi; le precedenti restano in un menu a tendina */
function renderProgressBox(){
  const box=document.getElementById("anAI");if(!box)return;
  const log=S.progressLog||[];
  if(!log.length){box.style.display="none";return;}
  box.style.display="block";
  const last=log[log.length-1];
  let h=`<div style="font-size:11.5px;color:var(--grigio);margin-bottom:4px">${new Date(last.t).toLocaleString(dataLoc(),{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>${esc(last.text)}`;
  if(log.length>1){
    h+=`<details style="margin-top:12px"><summary style="cursor:pointer;color:var(--bosco);font-weight:700;font-size:13px">Cronologia analisi precedenti (${log.length-1})</summary>`;
    log.slice(0,-1).slice().reverse().forEach(e=>{h+=`<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--linea)"><div style="font-size:11.5px;color:var(--grigio);margin-bottom:4px">${new Date(e.t).toLocaleString(dataLoc(),{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>${esc(e.text)}</div>`;});
    h+=`</details>`;}
  box.innerHTML=h;}
/* ──  Chiedi all'AI: contesto con dieta PIANIFICATA vs dati REALI ── */
/* Riepilogo della dieta pianificata (cosa mangeresti seguendo il piano): media
   sui 7 giorni del piano. Serve per le proiezioni quando i pasti reali non sono
   ancora stati registrati (altrimenti i giorni "vuoti" darebbero deficit ~ TDEE). */
function plannedDietSummary(){
  let pk=0,pp=0,pc=0,pf=0;for(let di=0;di<7;di++){const o=plannedTemplateOfDay(di);pk+=o.k;pp+=o.p;pc+=(o.c||0);pf+=(o.f||0);}
  return {kcal_giorno:Math.round(pk/7),proteine_g:Math.round(pp/7),carboidrati_g:Math.round(pc/7),grassi_g:Math.round(pf/7)};}
/* Sport + passi: MEDIA GIORNALIERA vera sul periodo tracciato (i giorni di
   riposo contano come 0), NON il valore grezzo di un singolo giorno — che
   gonfierebbe il deficit. Riporta anche quanti giorni compongono la media, così
   l'AI sa se il campione è affidabile (con 1-2 giorni lo sport è occasionale). */
function activityDailyAvg(recent){
  const nDays=recent.length;
  const totBurn=recent.reduce((a,x)=>a+(x.burn||0),0);
  const activeDays=recent.filter(x=>(x.burn||0)>0).length;
  return {giorni_considerati:nDays,giorni_con_attivita:activeDays,
    media_giornaliera_kcal:nDays?Math.round(totBurn/nDays):0,campione_sufficiente:nDays>=7};}
function buildDiaryContext(){
  const all=flattenDiet();
  const recentAll=all.slice(-30);
  const hardCount=recentAll.filter(d=>d.hard).length;
  const recent=recentAll.filter(d=>!d.hard); // le giornate difficili non sporcano le medie
  const avgOf=(arr,f)=>arr.length?Math.round(arr.reduce((a,x)=>a+(x[f]||0),0)/arr.length):0;
  // REALE: solo i giorni in cui i pasti sono stati davvero registrati (eat>0).
  // I giorni senza pasti segnati mostrerebbero deficit ~ TDEE e falserebbero tutto.
  const withMeals=recent.filter(d=>(d.eat||0)>0);
  const TDEE=tdee();
  const plan=plannedDietSummary();
  // Deficit da DIETA (parte affidabile): TDEE − intake pianificato (senza sport).
  const deficitDieta=TDEE-plan.kcal_giorno;
  // Sport/passi come MEDIA GIORNALIERA (non il dato puro di oggi).
  const act=activityDailyAvg(recent);
  const sportAvg=act.media_giornaliera_kcal;
  // Nel deficit teorico lo sport si aggiunge SOLO se il campione è sufficiente,
  // altrimenti col dato di 1-2 giorni sballerebbe la stima.
  const deficitTeorico=deficitDieta+(act.campione_sufficiente?sportAvg:0);
  const realDeficit=withMeals.length?avgOf(withMeals,"def"):null;
  const workoutsCount={};recent.forEach(d=>(d.workouts||[]).forEach(w=>{const s=String(w).split(" ")[0];if(s)workoutsCount[s]=(workoutsCount[s]||0)+1;}));
  // Ritmo peso osservato (kg/settimana) dallo storico pesate, se abbastanza dati
  let rateKgWeek=null;const W=(S.profile.weights||[]).filter(x=>x.w).slice(-10);
  if(W.length>=2){const days=(new Date(W[W.length-1].d)-new Date(W[0].d))/864e5;if(days>=5)rateKgWeek=Math.round((W[W.length-1].w-W[0].w)/days*7*100)/100;}
  const kgToGoal=(S.profile.goalW&&S.profile.w)?Math.round((S.profile.w-S.profile.goalW)*10)/10:null;
  return {
    obiettivo_peso_kg:S.profile.goalW||null,
    peso_attuale_kg:S.profile.w||null,
    kg_da_perdere:kgToGoal,
    tdee_kcal:TDEE,
    dieta_pianificata:{kcal_giorno:plan.kcal_giorno,proteine_g:plan.proteine_g,carboidrati_g:plan.carboidrati_g,grassi_g:plan.grassi_g,
      deficit_dieta_giorno:deficitDieta,
      sport_passi_media_giornaliera_kcal:sportAvg,
      giorni_considerati_per_sport:act.giorni_considerati,giorni_con_attivita:act.giorni_con_attivita,campione_sport_sufficiente:act.campione_sufficiente,
      deficit_teorico_giorno:deficitTeorico,
      spiegazione:trh("Deficit da dieta = TDEE({v1}) − intake({v2}) = {v3} kcal/giorno. Sport+passi vanno aggiunti come MEDIA GIORNALIERA ({v4} kcal su {v5} giorni, riposo incluso), non col valore di un singolo giorno; con pochi giorni consideralo occasionale. Deficit teorico = {v6} kcal/giorno.",{v1:TDEE,v2:plan.kcal_giorno,v3:deficitDieta,v4:sportAvg,v5:act.giorni_considerati,v6:deficitTeorico})},
    dati_reali:{giorni_con_pasti_registrati:withMeals.length,
      kcal_medie:withMeals.length?avgOf(withMeals,"eat"):null,
      proteine_medie_g:withMeals.length?avgOf(withMeals,"prot"):null,
      carboidrati_medi_g:withMeals.length?avgOf(withMeals,"c"):null,
      grassi_medi_g:withMeals.length?avgOf(withMeals,"f"):null,
      deficit_medio_reale_kcal:realDeficit,
      ritmo_peso_kg_settimana:rateKgWeek,
      giornate_difficili_escluse:hardCount},
    sonno_medio:avgOf(recent,"sleep")||null,relax_medio:avgOf(recent,"relax")||null,umore_medio:avgOf(recent,"feel")||null,
    allenamenti_per_tipo:workoutsCount,
    obiettivi:{passi_giorno_nota:trh("passi base ({v1}/giorno) già inclusi nel TDEE, nessun obiettivo passi separato",{v1:(((+S.profile.baseSteps>0)?+S.profile.baseSteps:3000))}),
      allenamenti_settimana:(S.profile.goalWorkoutList||[]).map(g=>({sport:g.sport,volte_settimana:g.perWeek,minuti:g.min})),
      dispendio_extra_medio_giornaliero_kcal:plannedActivityBurnFor(S.profile.w||70)},
    proiezione:(()=>{const s=simulateWeightDescent(S.profile.w,new Date());if(!s)return null;
      const Wt=(S.profile.weights||[]).filter(x=>x.w).slice().sort((a,b)=>giornoDa(a.d)-giornoDa(b.d));
      let delta=null,ideale=null;if(Wt.length){const last=Wt[Wt.length-1];ideale=projectedWeightAt(last.d);if(ideale!=null)delta=Math.round((last.w-ideale)*10)/10;}
      return {data_stimata:s.stalled?null:iso(s.etaDate),giorni_stimati:s.stalled?null:s.etaDays,deficit_iniziale_giorno:s.dailyDeficitStart,stallo:s.stalled,
        peso_reale_ultimo:Wt.length?Wt[Wt.length-1].w:null,peso_ideale_stessa_data:ideale,delta_kg_vs_ideale:delta,
        nota_delta:"delta>0 = sei indietro rispetto al piano; delta<0 = sei in anticipo"};})(),
    resoconti_settimanali:S.history.slice(-4).map(w=>({periodo:dateIT(w.from)+"→"+dateIT(w.to),kcal_medie:w.avgEat,deficit_medio:w.avgDef,peso:w.weight}))
  };}
window.askDiaryQuestion=async()=>{
  const ta=document.getElementById("diaryQ");const box=document.getElementById("diaryQA");
  const q=(ta&&ta.value||"").trim();
  if(!q){if(box){box.style.display="block";genBoxMostra(box);box.textContent="Scrivi prima una domanda.";}return;}
  if(!aiOn())return aiFail(new Error("nokey"));
  const ctx=buildDiaryContext();
  if(box){box.style.display="block";genBoxMostra(box);box.textContent="Sto pensando…";}
  try{
    const t=await aiAsk("Sei l'assistente del diario alimentare/sportivo dell'utente. Rispondi alla sua domanda usando SOLO i dati qui sotto: "+JSON.stringify(ctx)+
      ". DOMANDA: \""+q+"\". REGOLE GENERALI: se la domanda NON riguarda alimentazione, peso, deficit, macronutrienti, allenamenti, obiettivi o progressi, rispondi ESATTAMENTE con la sola parola NON_PERTINENTE (in maiuscolo, senza altro). Altrimenti rispondi "+((typeof LANG!=="undefined"&&LANG==="en")?"in English":"in italiano")+", massimo 5-6 frasi, diretta e concreta, senza elenchi puntati e senza markdown. "+
      "REGOLE PER LE PROIEZIONI (tempo per raggiungere l'obiettivo di peso): 1 kg di grasso ≈ 7700 kcal, quindi giorni ≈ kg_da_perdere × 7700 / deficit_giornaliero. Per il deficit_giornaliero: (1) BASE = dieta. Se dati_reali.giorni_con_pasti_registrati è basso (meno di ~7) usa dieta_pianificata.deficit_dieta_giorno (= TDEE − intake, il valore affidabile ~900); NON usare dati_reali.deficit_medio_reale_kcal né il TDEE puro (i giorni senza pasti segnati danno deficit ~ TDEE ed è fuorviante). Con abbastanza dati reali preferisci dati_reali.ritmo_peso_kg_settimana osservato o dati_reali.deficit_medio_reale_kcal. (2) SPORT+PASSI = extra. Aggiungilo SOLO come dieta_pianificata.sport_passi_media_giornaliera_kcal (media giornaliera già calcolata sui giorni tracciati, riposo incluso) e SOLO se campione_sport_sufficiente è true; con pochi giorni consideralo occasionale e non gonfiare il deficit col dispendio di un singolo giorno. Dichiara che è una proiezione indicativa e che il ritmo rallenta scendendo di peso. Se manca l'obiettivo peso dillo. "+
      "ANALISI COSA FUNZIONA: se l'utente chiede come sta andando o cosa migliorare, confronta proiezione.delta_kg_vs_ideale (reale vs curva ideale: >0 sei indietro, <0 sei in anticipo) con gli allenamenti_per_tipo e le kcal reali per capire dove agire (dieta poco rispettata, poco movimento, deficit troppo blando…), proponendo senza imporre.");
    if(String(t).trim().toUpperCase().startsWith("NON_PERTINENTE")){
      if(box)box.textContent=" Posso rispondere solo a domande sui tuoi dati: alimentazione, peso, allenamenti, obiettivi e progressi.";
      return;}
    if(box)box.textContent=t;
  }catch(e){if(box)box.style.display="none";genBoxVia();aiFail(e);}};
/* Nucleo riusabile: silent=true per l'archiviazione AUTOMATICA di fine
   settimana (niente confirm, niente alert, niente AI che blocca). */
const WEEK_COACH="Sei un personal trainer rigoroso ma motivante. Dati settimana (dieta; sonno, relax e umore in scala 1=basso 5=alto; sgarri kcal): ";
/* Rilevatore puro del sospetto TDEE sovrastimato: 3 settimane archiviate
   con deficit teorico ≥250 kcal/g e peso fermo (calo < 0,3 kg). */
function tdeeDriftInfo(){
  if(!S.history||S.history.length<3)return null;
  const last3=S.history.slice(-3);
  if(!last3.every(x=>x.avgDef>=250))return null;
  const w0=last3[0].weight,w2=last3[2].weight;
  if(!(w0>0&&w2>0))return null;
  if(w0-w2>=0.3)return null;
  return {avgDef:Math.round(last3.reduce((a,x)=>a+x.avgDef,0)/3),w0,w2};}
window.tdeeSuggApply=()=>{
  S.profile.act=Math.max(1.15,Math.round((S.profile.act-0.05)*100)/100);
  S.tdeeSugg=null;save();render(cur);
  toast(tr("Fattore attività abbassato: fabbisogno più prudente"));};
window.tdeeSuggRecomp=()=>{
  S.tdeeSugg=null;save();render(cur);
  dlgAlert(tr("Peso fermo ma grasso in calo è RICOMPOSIZIONE: nessuna correzione, continua così. Consiglio: registra la % di massa grassa nelle pesate."));};
window.tdeeSuggNo=()=>{S.tdeeSugg=null;save();render(cur);};
function tdeeSuggCardHTML(){
  if(!S.tdeeSugg)return "";
  const g=S.tdeeSugg;
  return `<div class="card"><h2>${tr("Peso fermo da 3 settimane")}</h2>
  <div class="hint">${hint2(trh("Il conto dice deficit, ma il peso non scende:"),trh("Probabilmente il fabbisogno reale è più basso, o i passi quotidiani sono calati. Se però la <b>massa grassa</b> sta scendendo, è ricomposizione e va tutto bene.",{v1:g.avgDef,v2:g.w0,v3:g.w2}))}</div>
  <div class="mtools" style="margin-top:8px">
    <button class="btn small" onclick="tdeeSuggApply()">${tr("Abbassa il fattore (−0.05)")}</button>
    <button class="btn ghost small" onclick="tdeeSuggRecomp()">${tr("È ricomposizione")}</button>
    <button class="btn ghost small" onclick="tdeeSuggNo()">Ignora</button>
  </div></div>`;}
async function closeWeekCore(silent){
  const wk=weekSummary();
  /* L'analisi della settimana costa una richiesta e qualche minuto. Nella
     chiusura AUTOMATICA — quella che scatta al primo avvio del lunedì —
     non si fa: partiva da sola appena si riapriva l'app, senza che nessuno
     l'avesse chiesta. Il report si genera dallo Storico, quando lo vuoi.
     Nella chiusura manuale, invece, l'hai chiesta tu. */
  if(aiOn()&&!silent){try{
    const t=await aiAsk(WEEK_COACH+JSON.stringify(wk.days)+'. Deficit medio '+wk.avgDef+' kcal, proteine medie '+wk.avgProt+'g. Rispondi SOLO JSON: {"report":"commento di massimo 3 frasi in italiano","corr":"1 correlazione interessante trovata tra sonno/relax/umore e alimentazione, 1 frase; se non ce ne sono scrivi stringa vuota"}');
    const j=parseAIJSON(t);wk.ai={report:j.report,corr:j.corr};
  }catch(e){/* senza AI si salva comunque */}}
  S.history.push(wk);
  // Check TDEE: 3 settimane di deficit teorico ma peso fermo.
  // In chiusura MANUALE parte il dialogo; in chiusura AUTOMATICA (domenica,
  // silent) i dialoghi non possono apparire: si lascia un suggerimento
  // persistente che Punto mostra come card finché non decidi tu.
  const drift=tdeeDriftInfo();
  if(silent&&drift&&!S.tdeeSugg)S.tdeeSugg={avgDef:drift.avgDef,w0:drift.w0,w2:drift.w2,at:Date.now()};
  if(!silent&&drift){
    {const last3=S.history.slice(-3);
      /* ── Prima di correggere il TDEE: verifica RICOMPOSIZIONE corporea ──
         Peso fermo + massa grassa in calo = stai perdendo grasso e mettendo
         muscolo: nessuna correzione, anzi ottimo segnale. */
      const cutoff=new Date(last3[0].from).getTime();
      const fats=S.profile.weights.filter(x=>x.fat!=null&&giornoDa(x.d).getTime()>=cutoff).map(x=>x.fat);
      let recomp=false;
      if(fats.length>=2&&(fats[0]-fats[fats.length-1])>=0.5){
        recomp=true;
        dlgAlert(" "+tr("Peso fermo ma massa grassa in calo ({a}% → {b}%): è RICOMPOSIZIONE, stai perdendo grasso e guadagnando muscolo. Nessuna correzione del TDEE: continua così!",{a:fats[0],b:fats[fats.length-1]}));
      }else if(fats.length<2){
        if(await dlgConfirm(tr(" Peso fermo da 3 settimane. Prima di correggere il TDEE: la tua % di massa grassa È SCESA (bilancia impedenziometrica o plicometria)?\n\nOK = sì, è scesa (ricomposizione) · Annulla = no / non lo so"))){
          recomp=true;
          dlgAlert(tr("Perfetto: è ricomposizione (grasso giù, muscolo su a parità di peso). Nessuna correzione necessaria. Consiglio: registra la % di massa grassa nelle pesate per tracciarla."));
        }
      }
      if(!recomp){
      let sugg="Da 3 settimane il deficit teorico c'è ma il peso non scende: probabilmente il TDEE reale è più basso o il NEAT è calato.";
      if(aiOn()){try{
        const t=await aiAsk(trh("In 3 settimane deficit teorico medio {v1} kcal/g ma peso invariato ({v2}→{v3} kg). Suggerisci in 2 frasi in italiano: correzione del moltiplicatore TDEE e/o aumento passi/NEAT quotidiano.",{v1:Math.round(last3.reduce((a,x)=>a+x.avgDef,0)/3),v2:last3[0].weight,v3:last3[2].weight}));
        sugg=t;}catch(e){}}
      if(await dlgConfirm(" "+sugg+"\n\n"+tr("Abbasso il fattore attività di 0.05, così il fabbisogno stimato diventa più prudente?"),{ok:tr("Abbassa"),ko:tr("Lascia così")})){
        S.profile.act=Math.max(1.15,Math.round((S.profile.act-0.05)*100)/100);}
      }
    }}
  S.week=freshWeek();save();if(!silent){render(cur);
  dlgAlert(wk.ai?tr("Settimana salvata con report AI. Buona settimana nuova!"):tr("Settimana salvata. Buona settimana nuova!"));}}
window.delSnap=async i=>{const list=snapshots(),x=list[i];if(!x)return;
  if(!await dlgConfirm(tr("Elimino la copia del {d}?\n\nLe altre copie restano al loro posto.",{d:new Date(x.at).toLocaleString(dataLoc())}),{ok:tr("Elimina"),ko:tr("No")}))return;
  list.splice(i,1);
  try{if(list.length)localStorage.setItem(SNAP_KEY,JSON.stringify(list));else localStorage.removeItem(SNAP_KEY);}
  catch(e){return dlgAlert(tr("Eliminazione non riuscita: {e}",{e:e.message}));}
  render(cur);toast(tr("Copia eliminata ✓"));};
window.delAllSnaps=async ()=>{const n=snapshots().length;
  if(!n)return dlgAlert(tr("Non c'è nessuna copia da eliminare."));
  if(!await dlgConfirm(tr("Elimino TUTTE le copie di sicurezza ({n})?\n\nI dati attuali non vengono toccati, ma non potrai più tornare indietro a uno stato precedente.",{n:n}),{ok:tr("Elimina tutte"),ko:tr("No")}))return;
  try{localStorage.removeItem(SNAP_KEY);}catch(e){return dlgAlert(tr("Eliminazione non riuscita: {e}",{e:e.message}));}
  render(cur);toast(tr("Copie eliminate ✓"));};
window.delWeek=async i=>{if(await dlgConfirm(tr("Eliminare questa settimana dallo storico?"),{ok:tr("Elimina"),ko:tr("No")})){S.history.splice(i,1);save();render("storico");}};
window.waWeek=()=>{const w=weekSummary();
  let t=" *Riepilogo settimana*%0A";
  w.days.forEach(d=>t+=encodeURIComponent(d.day.slice(0,3))+": "+d.eat+" kcal · "+d.prot+"g prot · deficit "+(d.def>=0?"−":"+")+Math.abs(d.def)+"%0A");
  t+="%0AMedie: "+w.avgEat+" kcal · "+w.avgProt+"g prot · deficit −"+w.avgDef;
  window.open("https://wa.me/?text="+t,"_blank");};

/* ═══ REPORT PER LA VISITA — una pagina, per il professionista ═══
   Il report completo esiste e serve: è un dump di tutto. Ma alla visita
   nessuno legge otto pagine in dieci minuti — e il paziente che arriva
   con un plico sembra uno che si è auto-diagnosticato. Questo è
   l'opposto: UNA pagina, i numeri che un medico chiede davvero
   (tendenza del peso, aderenza, medie, sport, misure), niente
   interpretazioni nostre, e una riga che dice cos'è e cosa non è.

   Tre regole di sostanza:
   · NESSUNA DIAGNOSI, NESSUNA RACCOMANDAZIONE. Si portano i dati; la
     lettura è di chi ha studiato per farla.
   · I GIORNI DIFFICILI SI DICHIARANO, non si nascondono per far
     bella figura: un'aderenza del 70% con il motivo scritto è più
     utile di un 100% ripulito.
   · SI DICE CHE LE STIME SONO STIME. Un professionista che scopre da
     sé che i numeri sono stimati smette di fidarsi di tutto il resto. */
function datiVisita(){
  const p=S.profile,fd=flattenDiet();
  const gg=Math.max(1,+((S.ui||{}).visitaGiorni||90));
  const periodo=fd.slice(-gg);
  const conPasti=periodo.filter(d=>(d.eat||0)>0);
  const difficili=periodo.filter(d=>d.hard).length;
  const med=(arr,f)=>arr.length?Math.round(arr.reduce((a,x)=>a+(x[f]||0),0)/arr.length):null;
  /* Aderenza = giorni dentro il target sui giorni registrati. Non sul
     totale: chi non registra non ha "sbagliato", ha solo non registrato. */
  const inTarget=conPasti.filter(d=>(d.def||0)>=0).length;
  const ws=(p.weights||[]).filter(x=>x.w);
  const primo=ws.length?ws[0]:null,ultimo=ws.length?ws[ws.length-1]:null;
  const delta=(primo&&ultimo)?Math.round((ultimo.w-primo.w)*10)/10:null;
  /* Ritmo settimanale reale: è il numero che un medico guarda per primo. */
  let ritmo=null;
  if(primo&&ultimo&&primo.d!==ultimo.d){
    const sett=(Date.parse(ultimo.d)-Date.parse(primo.d))/(7*86400000);
    if(sett>=1)ritmo=Math.round((ultimo.w-primo.w)/sett*100)/100;}
  return {giorni:gg,registrati:conPasti.length,difficili,
    aderenza:conPasti.length?Math.round(inTarget/conPasti.length*100):null,
    kcal:med(conPasti,"eat"),prot:med(conPasti,"prot"),
    carb:med(conPasti,"c"),gras:med(conPasti,"f"),fib:med(conPasti,"fib"),
    tdee:med(conPasti,"tdee"),burn:med(periodo,"burn"),
    allenamenti:periodo.reduce((a,d)=>a+((d.workouts||[]).length),0),
    sonno:med(conPasti,"sleep"),umore:med(conPasti,"feel"),
    pesoDa:primo?primo.w:null,pesoA:ultimo?ultimo.w:null,delta,ritmo,
    misure:ws.slice(-6)};}
window.datiVisita=datiVisita;

window.printVisita=()=>{
  busy(tr("Preparo il foglio per la visita…"));
  const p=S.profile,v=datiVisita();
  const nd=x=>(x==null?"–":x);
  const bio=v.misure.map(x=>
    `<tr><td>${giornoDa(x.d).toLocaleDateString(dataLoc())}</td><td>${x.w} kg</td>`+
    `<td>${x.fat??"–"}</td><td>${esc(x.pa??"–")}</td><td>${x.spo2??"–"}</td></tr>`).join("");
  const h=`<h1>${tr("Foglio per la visita")}</h1>
  <div>${esc(p.name||tr("Paziente"))} · ${age()} ${tr("anni")} · ${p.h} cm · ${p.w} kg
    ${p.goalW?" · "+tr("obiettivo")+" "+p.goalW+" kg":""} · ${fmtDate(new Date())}</div>
  <h2>${trh("Ultimi {v1} giorni",{v1:v.giorni})}</h2>
  <table>
  <tr><th>${tr("Giorni registrati")}</th><td>${v.registrati} / ${v.giorni}${v.difficili?" · "+trh("{v1} dichiarati difficili",{v1:v.difficili}):""}</td></tr>
  <tr><th>${tr("Aderenza al target")}</th><td>${v.aderenza==null?"–":v.aderenza+"%"} ${tr("(sui giorni registrati)")}</td></tr>
  <tr><th>${tr("Energia media assunta")}</th><td>${nd(v.kcal)} kcal/${tr("giorno")}</td></tr>
  <tr><th>${tr("Fabbisogno stimato")}</th><td>${nd(v.tdee)} kcal/${tr("giorno")}</td></tr>
  <tr><th>${tr("Proteine · carboidrati · grassi · fibre")}</th><td>${nd(v.prot)} · ${nd(v.carb)} · ${nd(v.gras)} · ${nd(v.fib)} g</td></tr>
  <tr><th>${tr("Attività fisica")}</th><td>${v.allenamenti} ${tr("sedute")} · ${nd(v.burn)} kcal/${tr("giorno")}</td></tr>
  <tr><th>${tr("Sonno · umore (autovalutati 1-5)")}</th><td>${nd(v.sonno)} · ${nd(v.umore)}</td></tr>
  </table>
  <h2>${tr("Andamento del peso")}</h2>
  <table>
  <tr><th>${tr("Da")} → ${tr("a")}</th><td>${nd(v.pesoDa)} kg → ${nd(v.pesoA)} kg</td></tr>
  <tr><th>${tr("Variazione")}</th><td>${v.delta==null?"–":(v.delta>0?"+":"")+v.delta+" kg"}</td></tr>
  <tr><th>${tr("Ritmo settimanale")}</th><td>${v.ritmo==null?"–":(v.ritmo>0?"+":"")+v.ritmo+" kg/"+tr("settimana")}</td></tr>
  </table>
  ${bio?`<h2>${tr("Misure registrate")}</h2><table>
  <tr><th>${tr("Data")}</th><th>${tr("Peso")}</th><th>${tr("Grasso %")}</th><th>${tr("Pressione")}</th><th>SpO2</th></tr>
  ${bio}</table>`:""}
  <p style="margin-top:16px;font-size:11.5px">${tr("Dati raccolti dalla persona con un diario alimentare. Le energie e i macronutrienti sono STIME calcolate da tabelle e da riconoscimento automatico: vanno lette come ordini di grandezza, non come misure. Questo foglio non contiene diagnosi né indicazioni terapeutiche.")}</p>
  <p style="font-size:10.5px;color:#666">${tr("Generato con Nuvia · nuviahealth.app")}</p>`;
  document.getElementById("printreport").innerHTML=h;
  setTimeout(()=>{busyOff();window.print();},120);};

/* Report PDF (Modalità Nuviazionista): costruisce una vista stampabile */
/* Bannerino con rotella per le operazioni che non passano dall'AI
   (download, stampa): senza feedback sembra che il tocco non abbia funzionato. */
function busy(msg){const b=document.getElementById("aiSpin");if(!b)return;
  const t=b.childNodes[b.childNodes.length-1];
  b._prev=(t&&t.nodeType===3)?t.textContent:null;
  if(t&&t.nodeType===3)t.textContent=msg||"Preparo il file…";
  /* la spia si accende SOLO da aiSpiaSincro: qui si dichiara che c'è
     un lavoro su file in corso, e la porta unica decide */
  aiFileOn();}
function busyOff(){const b=document.getElementById("aiSpin");if(!b)return;
  const t=b.childNodes[b.childNodes.length-1];
  if(t&&t.nodeType===3&&b._prev)t.textContent=b._prev;
  /* spegnere a mano cancellerebbe una richiesta AI ancora in corso:
     si dichiara che il file è pronto e decide la porta unica */
  aiFileOff();}
window.printReport=()=>{busy("Preparo il report…");const p=S.profile,w=weekSummary();
  const fd=flattenDiet();const last30=fd.slice(-30).filter(d=>!d.hard);
  const wm=last30.filter(d=>(d.eat||0)>0);
  const avg=(arr,f)=>arr.length?Math.round(arr.reduce((a,x)=>a+(x[f]||0),0)/arr.length):"–";
  const ws=(p.weights||[]).filter(x=>x.w);
  const wchange=ws.length>=2?Math.round((ws[ws.length-1].w-ws[0].w)*10)/10:null;
  const woCount=last30.reduce((a,d)=>a+((d.workouts||[]).length),0);
  const sim=simulateWeightDescent(p.w,new Date());
  let img="";try{if(typeof GOALCH!=="undefined"&&GOALCH&&GOALCH.toBase64Image){img='<h2>Andamento peso e proiezione</h2><img src="'+GOALCH.toBase64Image()+'" style="max-width:100%"/>';}}catch(e){}
  let h=`<h1>Report — ${esc(p.name||"Paziente")}</h1>
  <div>${fmtDate(new Date())} · ${age()} anni · ${p.h} cm · ${p.w} kg${parseFloat(p.fatp)>0?" · grasso "+p.fatp+"% (magra "+(p.w*(1-p.fatp/100)).toFixed(1)+" kg)":""} · BMR ${bmr()} · TDEE ${tdee()}${p.goalW?" · obiettivo "+p.goalW+" kg (BMI "+bmiFor(p.goalW)+", "+bmiClass(bmiFor(p.goalW)).label+")":""}</div>
  <h2>${tr("Riepilogo ultimi 30 giorni")}</h2><table>
  <tr><th>${tr("Giorni con pasti registrati")}</th><td>${wm.length}${last30.filter(d=>d.hard).length?" (esclusi "+fd.slice(-30).filter(d=>d.hard).length+" giorni difficili)":""}</td></tr>
  <tr><th>Kcal medie</th><td>${avg(wm,"eat")}</td></tr>
  <tr><th>${tr("Proteine medie")}</th><td>${avg(wm,"prot")} g</td></tr>
  <tr><th>${tr("Deficit medio (giorni reali)")}</th><td>${avg(wm,"def")} kcal</td></tr>
  <tr><th>Dispendio sport medio</th><td>${avg(last30,"burn")} kcal/g</td></tr>
  <tr><th>${tr("Allenamenti (30 gg)")}</th><td>${woCount}</td></tr>
  <tr><th>Sonno / Umore medi</th><td>${avg(wm,"sleep")} / ${avg(wm,"feel")}</td></tr>
  <tr><th>${tr("Variazione peso registrata")}</th><td>${wchange!=null?(wchange>0?"+":"")+wchange+" kg":"–"}</td></tr>
  ${sim&&!sim.stalled?`<tr><th>${tr("Proiezione obiettivo")}</th><td>${trh("~{v1} giorni ({v2})",{v1:sim.etaDays,v2:sim.etaDate.toLocaleDateString(dataLoc())})}</td></tr>`:""}
  </table>
  ${img}
  <h2>Biometriche registrate</h2><table><tr><th>Data</th><th>Peso</th><th>Grasso %</th><th>Pressione</th><th>SpO2</th></tr>`;
  p.weights.forEach(x=>h+=`<tr><td>${giornoDa(x.d).toLocaleDateString(dataLoc())}</td><td>${x.w} kg</td><td>${x.fat??"–"}</td><td>${esc(x.pa??"–")}</td><td>${x.spo2??"–"}</td></tr>`);
  h+=`</table><h2>${tr("Settimana in corso")}</h2><table><tr><th>${tr("Giorno")}</th><th>Kcal</th><th>Prot</th><th>Sport</th><th>Sonno</th><th>Relax</th><th>Umore</th><th>Deficit</th><th>Note</th></tr>`;
  w.days.forEach(d=>h+=`<tr><td>${giorno(d.day)}</td><td>${d.eat}</td><td>${d.prot}g</td><td>${d.burn}</td><td>${d.sleep||"–"}</td><td>${d.relax||"–"}</td><td>${d.feel||"–"}</td><td>${d.def}</td><td>${esc(cap(d.note))}</td></tr>`);
  h+=`</table><h2>${tr("Storico settimane")}</h2><table><tr><th>Periodo</th><th>Kcal medie</th><th>Prot medie</th><th>Deficit medio</th><th>Peso</th></tr>`;
  S.history.forEach(x=>h+=`<tr><td>${dateIT(x.from)} → ${dateIT(x.to)}</td><td>${x.avgEat}</td><td>${x.avgProt}g</td><td>−${x.avgDef}</td><td>${x.weight} kg</td></tr>`);
  h+=`</table><p style="margin-top:16px;font-size:11.5px">${tr("Generato dal Diario personale. Stime caloriche indicative — da validare col professionista.")}</p>`;
  document.getElementById("printreport").innerHTML=h;
  setTimeout(()=>{busyOff();window.print();},120);};

