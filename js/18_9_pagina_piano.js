/* ═══════════════════════════════════════════════════════════════
   9. PAGINA PIANO
   ═══════════════════════════════════════════════════════════════ */
/* Il piano è un MODELLO statico: niente spunte, niente extra (quelli stanno in
   Oggi). Le modifiche fatte qui (opzione /  / ) sono PERMANENTI: restano
   effettive anche nelle settimane successive, perché vivono in S.permMeals. */
function templateOpt(pdi,mi){const perm=S.permMeals[pdi+"_"+mi];if(perm)return perm;return PLAN[pdi].meals[mi].o[0];}
function plannedTemplateOfDay(di){let k=0,p=0,c=0,f=0,fib=0,z=0;PLAN[di].meals.forEach((m,mi)=>{const o=templateOpt(di,mi);k+=o.k;p+=o.p;c+=(o.c||0);f+=(o.f||0);fib+=(o.fib||0);z+=(o.z||0);});return{k,p,c,f,fib,z};}
function mealCardStatic(pdi,mi){const m=PLAN[pdi].meals[mi];const o=templateOpt(pdi,mi);
  const permObj=S.permMeals[pdi+"_"+mi];const isCustom=!!permObj;
  let h=`<div class="meal"><div class="mbody">
    <div class="mtop"><span class="mname tap" onclick="editMealPerm(${pdi},${mi})" title="${tr("Tocca per modificare")}">${esc(cap(fascia(m.n)))}</span>${
      (function(){const q=qPeek(o.d);return q!=null?`<span class="qwrap" title="${tr("Qualità stimata")}">${qDot(q)}${q}%</span>`:"";})()}</div>
    <div class="mdesc tap" onclick="editMealPerm(${pdi},${mi})" title="${tr("Tocca per modificare")}">${esc(cap(tr(o.d)))}</div>
    <div class="mkcal">~${o.k}kcal · ${o.p}g ${tr("proteine")}${o.c!=null?` · ${o.c}g ${tr("carboidrati")}`:""}${o.f!=null?` · ${o.f}g ${tr("grassi")}`:""}${o.fib!=null?` · ${o.fib}g ${tr("fibre")}`:""}${o.z!=null?` · ${o.z}g ${tr("zuccheri")}`:""} ${isCustom?'<span class="badge ai">'+tr("modificato")+'</span>':""}</div>`;
  if((m.o||[]).length>1){h+=`<div class="mopts">`+(m.o||[]).map((x,oi)=>{
      const sel=isCustom?(permObj.d===x.d):(oi===0);
      return `<button class="${sel?"sel":""}" onclick="setPermOpt(${pdi},${mi},${oi})">${optLabel(x,oi)}</button>`;}).join("")+`</div>`;}
  h+=`<div class="mtools" style="margin-top:4px">
    <button class="ibtn" title="${tr("Alternativa AI a parità di macro (permanente)")}" onclick="altMealPerm(${pdi},${mi})">${ic("dice",17)}</button>`;
  if(isCustom)h+=`<button class="ibtn" title="${tr("Ripristina originale")}" onclick="resetPerm(${pdi},${mi})">${ic("undo",17)}</button>`;
  h+=`</div></div></div>`;return h;}
window.setPermOpt=(d,m,oi)=>{const o=PLAN[d].meals[m].o[oi];
  if(oi===0)delete S.permMeals[d+"_"+m];else S.permMeals[d+"_"+m]={d:o.d,k:o.k,p:o.p,c:o.c!=null?o.c:null,f:o.f!=null?o.f:null};
  save();render("piano");};
window.resetPerm=(d,m)=>{delete S.permMeals[d+"_"+m];save();render("piano");};
window.editMealPerm=(d,m)=>{
  const o=templateOpt(d,m);
  sheetShow("Modifica il piano (permanente)",`
    <textarea id="empTxt" rows="5" style="width:100%">${esc(o.d)}</textarea>
    La modifica resta valida anche nelle settimane successive; kcal e macro si ristimano da sole.
    <div class="mtools" style="margin-top:12px">
      <button class="btn small" onclick="editMealPermGo(${d},${m})">${tr("Salva e ristima")}</button>
      <button class="btn ghost small" onclick="sheetClose()">${tr("Annulla")}</button>
    </div>`);};
window.editMealPermGo=async(d,m)=>{
  const o=templateOpt(d,m);
  const nd=(document.getElementById("empTxt")||{}).value;
  sheetClose();
  if(nd==null||!nd.trim())return;let k=o.k,p=o.p,c=o.c,f=o.f;
  const fuori=(PLAN[d]&&PLAN[d].meals[m]&&(PLAN[d].meals[m].type==="free"||PLAN[d].meals[m].type==="mensa"));
  let txt=nd.trim();
  if(aiOn()){
    try{const t=await estimaCached(txt,{fuori:fuori,campo:"piatto"});
      const j=parseAIJSON(t);k=Math.round(j.kcal);p=Math.round(j.prot);c=Math.round(j.carb)||null;f=Math.round(j.gras)||null;
      if(fuori&&j.piatto&&String(j.piatto).trim())txt=String(j.piatto).trim();}catch(e){aiFail(e);return;}}
  S.permMeals[d+"_"+m]={d:txt,k,p,c,f};pianoCambiato();save();render("piano");};
window.altMealPerm=async(d,m)=>{if(!aiOn())return aiFail(new Error("nokey"));const o=templateOpt(d,m);
  S.altSeen=S.altSeen||{};const akey="t"+d+"_"+m;const visti=S.altSeen[akey]||[];
  try{const t=await aiAsk('Genera UN piatto completamente diverso da "'+o.d+'" ma con circa '+o.k+' kcal e '+o.p+' g di proteine. '+
    (visti.length?'Alternative GIÀ PROPOSTE in passato per questo pasto — NON riproporle né in variante simile: '+visti.join("; ")+'. ':'')+dietStr()+' Ingredienti comuni in Italia con grammature. Rispondi SOLO JSON: {"piatto":"descrizione con grammature","kcal":numero,"prot":numero,"carb":numero,"gras":numero}');
    const j=parseAIJSON(t);
    if(!await dlgConfirm(tr("Alternativa permanente:\n{a}\n~{b} kcal · ~{c}g proteine\n\nOK = usala sempre nel piano",{a:j.piatto,b:Math.round(j.kcal),c:Math.round(j.prot)})))return;
    S.altSeen[akey]=(visti.concat(String(j.piatto).slice(0,60))).slice(-6);
    S.permMeals[d+"_"+m]={d:j.piatto,k:Math.round(j.kcal),p:Math.round(j.prot),c:Math.round(j.carb)||null,f:Math.round(j.gras)||null};pianoCambiato();save();render("piano");}catch(e){aiFail(e);}};
function renderPiano(){const el=document.getElementById("pg-piano");const ti=wd(new Date());
  /* Piano ancora tutto da scrivere: chi arriva qui appena finito il
     percorso trova sette giorni senza pasti, e sette contenitori vuoti
     non dicono cosa fare. Prima l'invito, poi gli attrezzi di sempre —
     che restano sotto, perché chi vuole comporlo a mano deve poterlo fare. */
  /* planIsEmpty() esiste già nel modulo dello stato: si riusa, non si
     riscrive. Due definizioni di «piano vuoto» finiscono sempre per
     divergere, e la seconda a divergere è quella che nessuno collauda. */
  let h=planIsEmpty()?`<div class="card">${vuotoDi("piano")}</div>`:"";
  h+=`<div class="card"><h2>${tr("La tua settimana")}</h2>
  ${hint2(tr("Questo è il tuo <b>piano</b>: il modello fisso. Le spunte e il tracciamento si fanno in <b>Oggi</b>."),tr("Le modifiche fatte qui (opzione ·  · ) restano valide anche nelle settimane successive. Il piano <b>non cambia</b> quando ribilanci o correggi un pasto in Oggi: resta il riferimento con cui confrontare quello che mangi davvero."))}
  <button class="btn" style="width:100%;margin:12px 0 8px" onclick="wizEditCurrent()">${tr("Gestisci piano")}</button>
  <div class="btngrid2" style="margin-top:0">
    <button class="btn ghost small" onclick="planForecast()">Stima risultati</button>
    <button class="btn ghost small" onclick="planMoreSheet()">Altre azioni…</button>
  </div>
  ${(function(){const d=planWeightDrift();
    if(Math.abs(d)<1)return "";
    return `<div class="hint" style="color:var(--zafft);font-weight:600"> ${tr("Il piano è stato costruito a")} ${S.planW} kg, oggi ne pesi ${S.profile.w}: ${d>0?"−":"+"}${Math.abs(d)} kg.${Math.abs(d)>=PLANW_TRIGGER?` ${trh("Il fabbisogno è cambiato: conviene {b1} sui numeri di adesso.",{b1:"<b>ritararlo</b>"})}`:" Ancora nessuna differenza rilevante."}</div>`;})()}
  <div class="aibox genout" id="planOut" style="display:none"></div></div>`;
  h+=weekOutCardHTML();
  h+=`<div class="gsec">${tr("La spesa che hai fatto")}</div>
    <div class="card"><h2>Scontrino e dispensa</h2>
    ${hint2(tr("Fotografa lo scontrino: riconosco i prodotti, ti dico com'è andata la spesa e costruisco i giorni di piano con quello che hai."),tr("Gli scontrini si <b>sommano</b>: puoi completare la settimana in più spese. Il piano non è obbligato a usare <b>tutto</b>: ciò che sfora resta in dispensa. Ciò che manca te lo dico io, e con un tocco va in lista. Lo scontrino non viene conservato: parte solo la foto a Gemini con la tua chiave."))}
    ${(function(){
      const v=spesaVoto();
      if(!v)return tr("La dispensa è vuota. Fotografa uno scontrino per cominciare.");
      const f=spesaFaccia(v.v);
      return `<div class="svoto">
        <div class="sfaccia">${f[0]}</div>
        <div class="sdett">
          <div class="stit">${f[1]}</div>
          <div class="sbar"><i style="width:${v.v}%;background:${v.v>=70?"var(--salvia)":(v.v>=55?"var(--zaff)":"var(--zafft)")}"></i></div>
          <div class="snum">${v.v}/100 · ${v.tot} prodotti · ${v.vf}% frutta e verdura</div>
        </div></div>
      ${v.piu.length?`<div class="hint" style="margin-top:12px"><b>${tr("Prendine di più:")}</b> ${v.piu.join(", ")}.</div>`:""}
      ${v.meno.length?`<div class="hint"><b>${tr("Prendine di meno:")}</b> ${v.meno.join(", ")}.</div>`:""}
      ${(!v.piu.length&&!v.meno.length)?`Le proporzioni sono in linea con le raccomandazioni OMS. Continua così.`:""}
      ${(function(){const c=spesaCosto();if(!c)return "";
        return `<div class="hint" style="margin-top:12px;background:var(--menta);padding:12px 12px;border-radius:12px">
          <b>Spesa: ~${c.tot.toFixed(2).replace(".",",")} €</b> · ~${c.perGiorno.toFixed(2).replace(".",",")} ${tr("€ al giorno ·")} <b>~${c.perPasto.toFixed(2).replace(".",",")} ${tr("€ a pasto")}</b> ${trh("su {v1} pasti.",{v1:c.pastiSett})}<br>
          ${tr("Dove vanno:")} ${c.top.map(t=>t.cat+" "+t.pc+"%").join(" · ")}.${c.manca?` <span style="color:var(--grigio)">${trh("Prezzo assente su {v1} prodotti: toccali in dispensa per correggerlo.",{v1:c.manca})}</span>`:""}</div>`;})()}
      ${(function(){const k=spesaCopertura();if(!k)return "";
        const col=k.pc>=85?"var(--salvia)":(k.pc>=60?"var(--zaff)":"var(--zafft)");
        return `<div class="hint" style="margin-top:12px;border-left:4px solid ${col};padding-left:12px">
          <b>${trh("Copre {v1}% di quello che serve</b> nei prossimi 7 giorni ({v3} ingredienti su {v2}).",{v1:k.pc,v3:k.coperti,v2:k.richiesti})}${k.manca.length?`<br><b style="color:var(--zafft)">Manca:</b> ${k.manca.map(m=>esc(m.k)+(m.pasti[0]?` <span style="color:var(--grigio)">(${esc(m.pasti[0])})</span>`:"")).join(" · ")}${k.mancaTot>k.manca.length?` e altri ${k.mancaTot-k.manca.length}`:""}.`:""}
          ${k.scarso.length?`<br><b>Poco:</b> ${k.scarso.map(m=>esc(m.k)+" (~"+Math.round(m.hai)+"g su ~"+Math.round(m.g)+"g)").join(" · ")}.`:""}
          ${k.avanza.length?`<br><b>${tr("Fuori piano:")}</b> ${k.avanza.map(a=>esc(a.k)).join(" · ")}${k.avanzaTot>k.avanza.length?` e altri ${k.avanzaTot-k.avanza.length}`:""} ${tr("— non serve a nessun pasto della settimana.")}`:""}
          ${(!k.manca.length&&!k.scarso.length)?`<br>${tr("Il carrello basta per la settimana.")}`:""}</div>`;})()}`;})()}
    <div class="mtools">
      <button class="btn ghost small" onclick="scontrinoScan()">${tr("Fotografa lo scontrino")}</button>
      ${pantry().items.length?`<button class="btn ghost small" onclick="pantryCucina()">${tr("Piano da quello che ho")}</button>`:""}
    </div>
    <div class="aibox" aria-live="polite" id="scoOut" style="display:none"></div>
    ${pantry().items.length?`
      <label>${trh("In dispensa · {v1} {v2}",{v1:pantry().items.length,v2:(pantry().items.length===1?tr("prodotto"):tr("prodotti"))})}</label>
      <div class="pantry">${pantry().items.map((i,k)=>
        `<span class="pchip"><span onclick="prezzoEdit(${k})" style="cursor:pointer">${esc(prodottoPrima(i.n))}${i.q?` <b>${i.q}${esc(i.u)}</b>`:""}${+i.e>0?` <span style="color:var(--teal2)">${(+i.e).toFixed(2).replace(".",",")}€</span>`:""}</span><button onclick="pantryDel(${k})" aria-label="${tr("Togli")}">×</button></span>`).join("")}</div>
      Tocca un prodotto per correggerne il prezzo: le stime dallo scontrino non sempre azzeccano offerte e sconti.
      <div class="mtools"><button class="btn ghost small" onclick="pantrySvuota()">${tr("Svuota la dispensa")}</button></div>`:""}
    ${pantry().freezer.length?`
      <label>${trh("In freezer · {v1}",{v1:pantry().freezer.length})}</label>
      <div class="pantry">${pantry().freezer.map((x,k)=>
        `<span class="pchip" style="background:var(--menta)">${esc(prodottoPrima(x.n))}${x.q?` <b>${esc(x.q)}</b>`:""}${x.per?` <span style="color:var(--grigio)">→ ${esc(x.per)}</span>`:""}<button onclick="freezerDel(${k})" aria-label="Consumato">×</button></span>`).join("")}</div>
      Quando lo consumi, togli la spunta con ×: sparisce dalla lista e dai suggerimenti.`:""}
    </div>`;

  h+=`<div class="card" style="display:none">
  <div class="mtools" style="margin-top:8px">
    <input type="text" id="planCode" placeholder="codice piano" style="max-width:150px;margin:0">
    <button class="btn ghost small" onclick="loadPlanCode(false)">${tr("Ripristina")}</button>
  </div>
  Con <b>00000000</b> ripristini il piano principale di Nuvia.
</div>`;
  /* Le CORREZIONI stanno subito sotto gli attrezzi del piano: è la
     porta con cui si dice «questo non mi va» e diventa una regola.
     Il typeof è la solita rete sull'ordine dei moduli. */
  if(!planIsEmpty()&&typeof correzioniCardHTML==="function")h+=correzioniCardHTML();
  if(planIsEmpty())h+=`<div class="card" style="text-align:center">
    <h2 style="margin-top:4px">${tr("Piano vuoto")}</h2>
    <div class="hint">${trh("Genera sette giorni con l'AI partendo dalle tue caratteristiche, oppure scrivili tu: per ogni piatto c'è {b} e {b2}, così non devi calcolare nulla a mano.",{b:"<b>Stima</b>",b2:"<b>"+tr("Bilancia la giornata")+"</b>"})}</div></div>`;
  PLAN.forEach((d,di)=>{
    h+=`<div class="dayname">${giorno(d.day)}${di===ti?'<span class="todaytag">'+tr("OGGI")+'</span>':""}</div><div class="dayctx">${esc(tr(d.ctx||""))}</div>`;
    (d.meals||[]).forEach((m,mi)=>h+=mealCardStatic(di,mi));
    const pl=plannedTemplateOfDay(di);
    h+=`<div class="daytotal">${tr("Piano:")} <span>~${pl.k} kcal · ${pl.p}g ${tr("proteine")} · ${pl.c}g ${tr("carboidrati")} · ${pl.f}g ${tr("grassi")} · ${pl.fib}g ${tr("fibre")} · ${pl.z||0}g ${tr("zuccheri")}</span></div>`;
  });
  el.innerHTML=h;}

function stars(di,field){
  /* Le stelline erano cinque copie della stessa cosa: la scala vera
     sta in 54_scelte e mostra cinque icone DIVERSE. Qui resta
     l'aggancio, così cambiano in tutti i posti in cui appaiono. */
  if(typeof scalaRiga==="function"&&SCALE&&SCALE[field])return scalaRiga(di,field);
  let h=`<div class="stars">`;
  for(let i=1;i<=5;i++)h+=`<span class="${S.week.days[di][field]>=i?"on":""}" onclick="setStar(${di},'${field}',${i})">⭐</span>`;
  return h+`</div>`;}
/* Quando la fame nervosa è alta, il numero da solo non basta: serve
   sapere COSA la accendeva. Una riga, facoltativa, mai obbligatoria. */
const EMO_CAUSE=["stanchezza","noia","lavoro","solitudine","rabbia","tristezza","festa","abitudine"];
function emoNota(di){
  const d=S.week.days[di]||{};
  if(!(+d.emo>=4))return "";
  const scelte=Array.isArray(d.emoWhy)?d.emoWhy:[];
  /* le cause scritte a mano (con «altro») diventano chip come le altre:
     si tolgono con un tocco, e l'AI le legge insieme alle fisse */
  const libere=scelte.filter(c=>!EMO_CAUSE.includes(c));
  return `<div class="hint" style="margin-top:12px">${tr("Cosa c'era dietro? (facoltativo)")}</div>
  <div class="pantry" style="margin-top:8px">${EMO_CAUSE.map(c=>
    `<span class="pchip ${scelte.includes(c)?"on":""}" style="cursor:pointer${scelte.includes(c)?";background:var(--menta);border-color:var(--salvia)":""}" onclick="emoWhy(${di},'${c}')">${tr(c)}</span>`).join("")}${libere.map(c=>
    `<span class="pchip on" style="cursor:pointer;background:var(--menta);border-color:var(--salvia)" onclick="emoWhy(${di},'${esc(c).replace(/'/g,"&#39;")}')">${esc(c)} ×</span>`).join("")}<span class="pchip" style="cursor:pointer;border-style:dashed" onclick="emoAltro(${di})">+ ${tr("altro…")}</span></div>`;}
window.emoAltro=async(di)=>{
  const t=await dlgPrompt(tr("Cos'altro c'era dietro? Una parola o due bastano."),"");
  if(!t||!t.trim())return;
  const d=S.week.days[di];if(!d)return;
  if(!Array.isArray(d.emoWhy))d.emoWhy=[];
  const v=t.trim().slice(0,40);
  if(!d.emoWhy.includes(v))d.emoWhy.push(v);
  save();render(cur);};
window.emoWhy=(di,c)=>{
  const d=S.week.days[di];if(!d)return;
  if(!Array.isArray(d.emoWhy))d.emoWhy=[];
  const i=d.emoWhy.indexOf(c);
  if(i<0)d.emoWhy.push(c); else d.emoWhy.splice(i,1);
  save();render(cur);};
window.setStar=(di,f,v)=>{
  S.week.days[di][f]=(S.week.days[di][f]===v?0:v);save();
  /* ridisegna la pagina in cui ci si trova: le stelle stanno nel Punto,
     e ridisegnare «oggi» non aggiornava nulla di visibile */
  render(cur);};
/* Saluto + com'è andata ieri. È la prima cosa che si legge la mattina:
   non un cruscotto, ma il punto della situazione in due righe. */
function puntoSaluto(){
  const o=new Date().getHours(),n=(S.profile.name||"").trim().split(" ")[0];
  const s=o<5?tr("Notte fonda"):o<12?tr("Buongiorno"):o<18?tr("Buon pomeriggio"):tr("Buonasera");
  return s+(n?", "+esc(n):"");}
function puntoTesta(di){
  const ie=(di+6)%7,d=S.week.days[ie]||{};
  const fatti=(d.meals||[]).filter(m=>m.done&&!m.skip).length;
  const q=dayQuality(ie),st=+((S.streak||{}).count)||0;
  const righe=[];
  if(fatti){
    const e=eatenOfDay(ie),p=plannedOfDay(ie).k||dayTargetK();
    righe.push(e.k<=p?`${trh("Ieri sei rimasto in linea ({v1} kcal su {v2}).",{v1:e.k,v2:p})}`
                     :`${tr("Ieri sei andato sopra di")} ${e.k-p} kcal.`);
    if(q!=null)righe.push(`${tr("Qualità del cibo")} ${q}%.`);
  }else righe.push(tr("Ieri non hai segnato nulla: se vuoi puoi ancora farlo dallo storico."));
  if(st>=3)righe.push(`<b>${trh("{v1} giorni di fila",{v1:st})}</b> ${tr("in linea.")}`);
  {const p=pesoRiga();if(p&&!/Non hai ancora/.test(p))righe.push(cap(p)+".");}
  /* «Come va» era un riquadro con la ✕ sotto il prossimo pasto: la
     stessa informazione, in un posto diverso, con un altro modo di
     chiuderla. Ora è una riga del saluto, dove si legge tutto insieme. */
  if(isToday()){const nf=notifOra(di);
    if(nf&&nf.d&&!/_pasto$/.test(nf.k)){
      righe.push(String(nf.d).replace(/<[^>]+>/g,"")+(nf.d2?(" "+String(nf.d2).replace(/<[^>]+>/g,"")):""));
      try{notifVisto(nf.k,0);}catch(_){}}}
  return `<div class="psaluto tap" onclick="show('oggi')" title=tr("Vai a Oggi")>
    <div class="ph">${puntoSaluto()} <span class="pgo">›</span></div>
    <div class="pd">${righe.join(" ")}</div>
    ${fatti?`<div class="mtools" style="margin-top:12px"><button class="btn ghost small" onclick="show('storico')">Guarda ieri</button>${aiOn()?`<button class="btn ghost small" onclick="show('storico')">${tr("Chiedi un'analisi")}</button>`:""}</div>`:""}
  </div>`;}
/* Richiamo alla spesa: compare in Oggi quando la lista è pronta, così non
   resta sepolta in un menù pur non essendo una cosa di tutti i giorni. */
function oggiSpesa(){
  const n=Object.keys(S.shop||{}).length||((S.customShop||[]).reduce((a,c)=>a+((c.items||[]).length),0));
  if(!n)return "";
  const presi=Object.values(S.shop||{}).filter(Boolean).length;
  if(presi>=n)return "";
  return `<div class="card nota info riga">
    <div style="flex:1;min-width:160px;font-size:13px">${ic("spesa",18)} ${tr("La spesa della settimana è pronta:")} <b>${n-presi}</b> prodotti da prendere.</div>
    <button class="btn ghost small" onclick="show('spesa')">${tr("Apri la lista")}</button></div>`;}
/* Il peso nel Punto: il confronto che motiva non è con l'obiettivo lontano,
   ma con te stesso di quattro settimane fa. La proiezione e i grafici
   restano in Numeri, per chi li vuole. */
/* Il peso di oggi, se c'è, e come sta andando rispetto a quattro
   settimane fa: due righe invece di una scheda intera. */
function pesoOggi(){
  const w=(S.profile.weights||[]).find(x=>x.d===iso(new Date()));
  return w?(+w.w||0):null;}
function pesoRiga(){
  const w=(S.profile.weights||[]).slice().sort((a,b)=>(a.d<b.d?-1:1));
  if(!w.length)return "Non hai ancora registrato una pesata";
  const ogg=+w[w.length-1].w||0;
  const lim=new Date();lim.setDate(lim.getDate()-28);
  const vecchie=w.filter(x=>safeDate(x.d+"T12:00:00")&&safeDate(x.d+"T12:00:00")<lim);
  const rif=vecchie.length?vecchie[vecchie.length-1]:w[0];
  const d=Math.round((ogg-(+rif.w||0))*10)/10;
  const quando=vecchie.length?tr("in quattro settimane"):tr("dalla prima pesata");
  /* In italiano il decimale è una virgola: «−2.4 kg» sembra un refuso */
  const num=(x)=>String(Math.abs(x)).replace(".",",");
  /* La frase si compone di tre pezzi (variazione · periodo · ultima pesata):
     ognuno passa da tr(), così in inglese non resta un ibrido. */
  const testa=(d===0?tr("Stabile")+" ":(d<0?"−"+num(d)+" kg ":"+"+num(d)+" kg "));
  const coda=(pesoOggi()?"":(function(){const q=dataIT(w[w.length-1].d);
    return q?trh(" · ultima pesata {v1}",{v1:q}):"";})());
  return testa+quando+coda;}
function renderPunto(){const el=document.getElementById("pg-punto");const di=viewIdx();
  const eat=eatenOfDay(di),burn=burnedOfDay(di),t=tdeeOfDay(di),def=t+burn-eat.k,target=t+burn;
  let h="";
  const _vd=iso(VIEW);
  /* Il saluto e il riepilogo di ieri: si apre qui la mattina. */
  h+=puntoTesta(di);
  /* ── IL PIANO CHE NASCE STA DENTRO LA PAGINA (founder, 24/08) ──
     «Appare questa schermata in sovraimpressione che si blocca sullo
     schermo e lo scorrimento diventa strano.»
     Era `genFloat`: un riquadro FISSO in fondo, alto fino al 46% dello
     schermo, sopra il contenuto — quindi mangiava metà pagina e la
     pagina sotto continuava a scorrere per conto suo.
     Adesso c'è un contenitore VERO qui, in cima al Punto, e genBox()
     lo trova come trova `planOut` nella pagina Piano: l'avanzamento
     scorre insieme al resto, e il riquadro fisso resta solo come
     ultima possibilità se nessuna pagina lo ospita. */
  /* NON si chiama `genOut`: quell'id esiste già nel percorso lungo
     (21_14), e due elementi con lo stesso id nella stessa pagina sono
     un guasto che si manifesta a caso — getElementById ne restituisce
     UNO SOLO, e sarebbe quello sbagliato. */
  h+=`<div id="genPunto" class="aibox genout" style="display:none"></div>`;
  h+=(function(){try{return progressiInvitoHTML();}catch(e){return "";}})();
  /* ── L'ORDINE (passo 4 del piano UX) ──────────────────────────
     Principio che non ha bisogno di dati: LA COSA CHE SI FA OGNI
     GIORNO VA PRIMA DI QUELLE CHE SUCCEDONO A VOLTE.
     puntoTesta porta la card «Questo pasto», che è il gesto
     quotidiano: spuntare quello che mangi. Le spinte, il sostegno e
     il debriefing sono importanti ma occasionali — se stanno sopra,
     ogni giorno bisogna scorrerli per arrivare alla cosa di sempre.
     Il resto dell'ordine (dentro la giornata, fra gli strumenti) si
     deciderà coi dati di usoClassifica(), non con le nostre
     impressioni: chi scrive l'app è l'ultima persona da ascoltare
     su cosa si usa di più. */
  h+=(typeof propostaCardHTML==="function")?propostaCardHTML():"";
  h+=(function(){const sp=(typeof spintaDelGiorno==="function")?spintaDelGiorno():"";
    return sp?`<div class="card" style="border-left:4px solid var(--salvia)"><div class="hint" style="font-size:14.5px">${sp}</div></div>`:"";})();
  /* Se i segnali durano, il posto giusto per dirlo è qui, non sepolto
     nello Storico: si vede all'apertura, una volta sola, e si può togliere. */
  h+=(typeof sostegnoCardHTML==="function")?sostegnoCardHTML():"";
  /* Fine settimana: il debriefing chiude il cerchio (Blocco E). */
  h+=(typeof debriefCardHTML==="function")?debriefCardHTML():"";
  /* I controlli della giornata stanno in alto: periodo, evento e
     recupero riguardano OGGI, e chi apre l'app li vuole vedere subito. */
  /* ── LA GIORNATA ────────────────────────────────────────────────
     Periodo, evento e recupero in una scheda sola, con la stessa forma
     degli stati del corpo: nome, effetto sotto, comando a destra. Prima
     erano tre strisce con il bordo, l'unico elemento dell'app che ce
     l'avesse ancora. */
  /* La scheda c'è SEMPRE: peso, allenamenti e nota sono cose di base.
     A cambiare con il livello sono solo le righe tecniche — periodo,
     evento, recupero — che a chi comincia non dicono niente. Prima
     spariva tutta insieme, e a livello Essenziale non si poteva più
     registrare un allenamento né scrivere una nota. */
  if(!S.ui.vacanza){
    const ev=(S.dayEvents||{})[_vd]||"",today=isToday();
    const evOK=!!(S.ui.evOk||{})[_vd];
    const ap=activePeriod();
    h+=guideCardHTML();
    h+=tdeeSuggCardHTML();
    h+=`<div class="card"><h2>${tr("La giornata")}</h2>
    <div class="glist">
      ${(ap
      /* Compilato = compatto: quando il periodo è aperto basta una riga
         corta; le date complete stanno in Gestisci e in Numeri. */
      ?`<div class="grow on fatta">
        <div class="gl"><b>${trh("Periodo {v1} · {v2}º giorno",{v1:esc(cap(ap.type)),v2:giorniPeriodo(ap)})}</b></div>
        <div class="gc"><button class="glink" onclick="periodoAzioni()">Gestisci ›</button></div>
      </div>`
      :`<div class="grow">
        <div class="gl"><b>${tr("Nessun periodo aperto")}</b>
          <small>${tr("Serve a raggruppare i dati in Numeri")}</small></div>
        <div class="gc"><button class="glink" onclick="periodoApri()">Aprine uno ›</button></div>
      </div>`)}
      ${pesoOggi()?"":`<div class="grow">
        <div class="gl"><b>${tr("Peso")}</b><small>${pesoRiga()}</small></div>
        <div class="gc"><button class="glink" onclick="show('io')">Pesati ›</button></div>
      </div>`}
      ${(function(){
        /* Se stai andando oltre e ci sono ancora pasti da fare, la cosa
           utile non è saperlo: è poterci fare qualcosa subito. */
        if(!today||eat.k<=0)return "";
        const resta=pendingMeals(di).length;
        const oltre=eat.k-target;
        if(!(resta>0&&oltre>0))return "";
        return `<div class="grow on">
          <div class="gl"><b>${trh("Sei oltre di {v1} kcal",{v1:oltre})}</b>
            <small>${trh("Restano {v1} {v2}: posso alleggerire solo quelli",{v1:resta,v2:(resta===1?tr("pasto"):tr("pasti"))})}</small></div>
          <div class="gc"><button class="glink" onclick="rebalance()">Ribilancia ›</button></div>
        </div>`;})()}
      ${(!densMin("full")||(!ev&&(S.ui.evNo||{})[_vd]))?"":(ev?`<div class="grow on fatta">
        <div class="gl"><b> ${esc(ev)}</b></div>
        <div class="gc"><button class="glink" onclick="eventoScegli('${_vd}',${di},${today?1:0})">${tr("Cambia ›")}</button></div>
      </div>`:`<div class="grow">
        <div class="gl"><b>${tr("Evento del giorno")}</b>
          <small>${tr("Compleanno, cena fuori, giornata no…")}</small></div>
        <div class="gc"><button class="glink" onclick="eventoScegli('${_vd}',${di},${today?1:0})">${tr("Scegli ›")}</button></div>
      </div>`)}
      ${(densMin("expert")&&today&&rgpPending(di))?`<div class="grow">
        <div class="gl"><b>${tr("Ribilancia i giorni prima")}</b>
          <small>${tr("Recupera gli sfori sui giorni che restano")}</small></div>
        <div class="gc">${rgpControlHTML(di)}</div>
      </div>`:""}
      ${(function(){
        /* Allenamenti e nota erano due schede a sé sotto «La giornata»,
           con titolo e pulsante pieno: due mestieri in più per una cosa
           che è un dettaglio della giornata, non un capitolo. Qui hanno
           la forma delle altre righe. */
        const wk=(S.week.days[di].workouts)||[],br=burnedOfDay(di);
        /* Una volta registrato, la riga si accorcia: il dettaglio degli
           sport sta già in Allenamento, e qui basta sapere che è fatto. */
        if(wk.length)return `<div class="grow on fatta">
          <div class="gl"><b>${wk.length+(wk.length===1?" allenamento":" allenamenti")+" · "+br+" kcal"}</b></div>
          <div class="gc"><button class="glink" onclick="show('sport')">Gestisci ›</button></div>
        </div>`;
        return `<div class="grow">
          <div class="gl"><b>${tr("Allenamenti")}</b>
            <small>${tr("Se ti muovi, registralo: entra nel bilancio del giorno")}</small></div>
          <div class="gc"><button class="glink" onclick="show('sport')">${tr("Registra ›")}</button></div>
        </div>`;})()}
      ${(function(){
        const n=String((S.week.days[di]||{}).note||"").trim();
        if(n)return `<div class="grow on fatta">
          <div class="gl"><b>${esc(cap(n.length>52?n.slice(0,51)+"…":n))}</b></div>
          <div class="gc"><button class="glink" onclick="notaScrivi(${di})">${tr("Modifica ›")}</button></div>
        </div>`;
        return `<div class="grow">
          <div class="gl"><b>${tr("Nota del giorno")}</b>
            <small>${tr("Fame, imprevisti: quello che i numeri non dicono")}</small></div>
          <div class="gc"><button class="glink" onclick="notaScrivi(${di})">${tr("Scrivi ›")}</button></div>
        </div>`;})()}
    </div></div>`;}


  /* La risposta apre la pagina: è la domanda che uno si fa aprendo l'app.
     Avvisi, banner e riepiloghi vengono DOPO — prima si sa come si sta. */
    /* ═══ LA RISPOSTA ═══════════════════════════════════════════
       Prima si apriva su nove riquadri di numeri, tutti uguali di peso.
       Ora la prima cosa è una frase che risponde alla domanda che uno si
       fa davvero — «come sto andando?» — e l'azione che serve adesso.
       I numeri restano, subito sotto. */
  h+=(function(){
      const plan=plannedOfDay(di).k||dayTargetK();
      const resta=Math.max(0,plan-eat.k);
      const dopo=pendingMeals(di);
      const prox=prossimoPasto(di);
      const q=dayQuality(di);
      /* La frase cambia con il momento della giornata. Attenzione al caso
         «nessun piano»: senza pasti previsti, zero spunte NON vuol dire
         giornata conclusa bene — vuol dire che non c'è ancora niente. */
      const previsti=dayItems(di).length;
      let cap,ton="hi";
      if(!previsti&&!eat.k){cap="Non hai ancora un piano.";ton="warn";}
      else if(!previsti){cap="Stai segnando a mano.";}
      else if(!eat.k&&dopo.length){cap=tr("Giornata da iniziare.");}
      else if(eat.k>plan*1.08){cap="Sei un po' oltre.";ton="warn";}
      else if(!dopo.length){cap=eat.k>plan?"Giornata chiusa, un po' sopra.":"Giornata chiusa bene.";ton=eat.k>plan?"warn":"hi";}
      else if(eat.k>plan*0.92){cap="Ci sei quasi.";}
      else cap="Sei in linea.";
      const sotto=[];
      if(dopo.length)sotto.push(dopo.length===1?tr("Resta un pasto"):trh("Restano {v1} pasti",{v1:dopo.length}));
      if(burn)sotto.push((burn>0?"+":"")+burn+" kcal di sport");
      if(q!=null)sotto.push("qualità "+q+"%");
      return `<div class="today">
        <div class="tanswer"><span class="${ton}">${cap}</span>${(previsti&&dopo.length)?` ${tr("Restano")} <b>${resta}</b> kcal.`:""}</div>
        <div class="tsub">${sotto.join(" · ")||(previsti?"Segna il primo pasto per iniziare":"Genera un piano o aggiungi quello che mangi con + Extra")}</div>
        <div class="tmeter">
          <div class="trow"><span>Mangiate</span><b>${eat.k} / ${plan}</b></div>
          <div class="ttrack"><i style="width:${Math.min(100,Math.round(eat.k/Math.max(1,plan)*100))}%;background:${eat.k>plan?"var(--zaff)":"var(--bosco)"}"></i></div>
        </div>
        ${acquaRiga(di)}
        ${prox?`<div class="tnext">
          <div class="k">${prox.tardi?"Da segnare":tr("Questo pasto")}</div>
          <div class="t">${esc(fascia(prox.d||prox.slot||""))}</div>
          <div class="m">${Math.round(prox.k||0)} kcal · ${Math.round(prox.p||0)}g ${tr("proteine")} ${(function(){const q=qPeek(prox.d);return q!=null?`<span class="qwrap" title="${tr("Qualità stimata del piatto")}">${qDot(q)}${q}%</span>`:"";})()}</div>
          ${(prox.pdi!=null&&prox.mi!=null)?hungryHTML(prox.pdi,prox.mi):""}
          ${(prox.pdi!=null&&prox.mi!=null&&typeof energyHTML==="function")?energyHTML(prox.pdi,prox.mi):""}
          ${(prox.pdi!=null&&prox.mi!=null)?attrezziPasto(prox.pdi,prox.mi):""}
          <div class="tcta">
            <button class="btn small" onclick="tgl(${prox.pdi},${prox.mi})">L'ho mangiato</button>
            <button class="btn ghost small" onclick="saltaPasto(${prox.pdi},${prox.mi})">${tr("Non l'ho mangiato")}</button>
            <button class="btn ghost small" onclick="vaiPasto(${prox.pdi},${prox.mi})">${tr("Modifica")}</button>
          </div>
          ${prox.tardi?`${hint2(tr("L'orario è passato."),tr("Se l'hai saltato, segnalo con ✗ in Oggi: così il bilancio resta giusto."))}`:""}
          </div>`:""}
      </div>`;})();
  /* «Come va» e gli altri promemoria vivono nel saluto in cima alla
     pagina (puntoTesta): il riquadro con la ✕ non esiste più. */
  /* ═══ COME STAI ═══════════════════════════════════════════════════
     Prima era una card sola che faceva cinque mestieri: sonno, corpo,
     cali di energia, nota e ricalibratura, separati da righine grigie.
     Ora sono blocchi distinti, ciascuno con il suo titolo e la sua forma. */
  if(densMin("full")){
  h+=`<div class="card"><h2>Sonno e umore</h2>
  ${hint2(tr("Due tocchi: 1 = male · 5 = alla grande."),tr("Servono all'analisi di fine settimana per capire cosa influenza davvero i tuoi risultati: sonno e umore pesano più di quanto sembri."))}
  <div class="duo" style="margin-top:16px">
    <div><label>${tr("Come hai dormito")}</label>${stars(di,"sleep")}</div>
    <div><label>${tr("Come ti senti")}</label>${stars(di,"feel")}</div>
  </div>
  <div class="duo" style="margin-top:12px">
    <div><label>${tr("Quanto stress")}</label>${stars(di,"stress")}</div>
    <div><label>${tr("Fame nervosa")}</label>${stars(di,"emo")}</div>
  </div>
  ${hint2(tr("Stress e fame nervosa: 1 = per niente · 5 = tantissimo."),
   tr("Sono le due domande che spiegano le sere storte meglio delle calorie. Nessuno le giudica: servono a riconoscere gli schemi che si ripetono, e a proporti qualcosa che funzioni davvero in quei momenti."))}
  ${emoNota(di)}
  ${crashHTML(di)}
  </div>`;

  h+=`<div class="card"><h2>${tr("Il tuo corpo")}</h2>
  ${hint2(tr("Situazioni temporanee che cambiano il fabbisogno. Ricordati di spegnerle quando finiscono."),tr("Non sono etichette: cambiano davvero le calorie del giorno e le grammature dei pasti. Il ciclo si spegne da solo; le altre restano finché non le togli tu, e finché restano il target è tarato su una condizione che potrebbe non esserci più."))}
  ${(function(){
    const dis=!physAllowed(),d=dis?" disabled":"";
    let g="";
    /* Se non si applicano non si mostrano: righe grigie e intoccabili
       occupano spazio e fanno solo chiedere perché ci sono. */
    const riga=(id,on,lab,desc,ev)=>`<label class="stato ${on?"on":""} ${dis?"off":""}">
      <input type="checkbox" id="${id}" ${on?"checked":""}${d} onchange="${ev}">
      <span class="sl"><b>${lab}</b><small>${desc}</small></span></label>`;
    if(!dis){
      g+=`<div class="statolist">`
      +riga("phCycle",!!cycleDay(),"Ciclo"+(cycleDay()?" · giorno "+cycleDay():""),"Si spegne da solo dopo "+cycleDaysMax()+" giorni","cycleToggle()")
      +riga("phLactF",S.phys.lact==="esclusivo","Allattamento esclusivo","+"+(+S.profile.lactFull||500)+" kcal al giorno","lactSet(this.checked?'esclusivo':'no')")
      +riga("phLactP",S.phys.lact==="parziale","Allattamento parziale","+"+(+S.profile.lactPart||250)+" kcal al giorno","lactSet(this.checked?'parziale':'no')")
      +Object.keys(PREG_LBL).map(k=>riga("phPreg_"+k,pregOn()===k,PREG_LBL[k],
          "+"+pregKcalOf(k)+" kcal al giorno · il deficit resta sospeso",
          "pregSet(this.checked?'"+k+"':'no')")).join("")
      +`</div>`;}
    /* Questi tre non c'entrano nulla con il genere: bloccarli era un
       errore, e li rendeva grigi e intoccabili per metà degli utenti. */
    const rigaLibera=(id,on,lab,desc,ev)=>`<label class="stato ${on?"on":""}">
      <input type="checkbox" id="${id}" ${on?"checked":""} onchange="${ev}">
      <span class="sl"><b>${lab}</b><small>${desc}</small></span></label>`;
    g+=`<div class="statolist" style="margin-top:12px">`
      +rigaLibera("phInj",injOn(),"Infortunio",trh("Mi muovo meno del solito: −{v1}% sulla quota attività",{v1:injPct()}),"injSet(this.checked)")
      +rigaLibera("phIll",illOn(),tr("Malattia"),tr("Deficit sospeso: si mangia a mantenimento"),"illSet(this.checked)")
      +rigaLibera("phDig",digiunoOn(),
          "        ".trim()+(digiunoOn()?tr(DIGIUNI[digiunoTipo()].l):tr("Digiuno religioso")),
          digiunoOn()?tr(DIGIUNI[digiunoTipo()].d):tr("Ramadan, Quaresima, digiuno totale: scegli quale"),
          "digiunoSet(this.checked)")
      +`</div>`;
    return g;})()}
  ${(cycleDay()&&cycleDay()<=5)?`<div class="hint" style="background:var(--zaffbg);padding:12px 12px;border-radius:12px;margin-top:12px">${trh("Nei giorni del ciclo è normale pesare {b1}: è acqua, non grasso. Non toccare il piano per questo — passa da sé.",{b1:"<b>"+tr("1-2 kg in più")+"</b>"})}</div>`:""}
  ${physDurationNote()}
  ${tr("Se hai acceso o spento qualcosa, le grammature della settimana vanno ritarate.")}
  <div class="mtools">
    <button class="btn ghost small" onclick="recalibrateToday()">${tr("Solo oggi")}</button>
    <button class="btn ghost small" onclick="recalibrate()">${tr("Tutta la settimana")}</button></div>
  </div>`;

  }
  // Pasti
  if(planIsEmpty()){h+=`<div class="card" style="text-align:center">
    <h2 style="margin-top:4px">${tr("Non hai ancora un piano")}</h2>
    <div class="hint">${trh("Puoi comunque usare Nuvia da subito: aggiungi {b1} per registrare quello che mangi e segna gli allenamenti in Sport.",{b1:"<b>+ Extra</b>"})}</div>
    <div class="mtools" style="justify-content:center;margin-top:12px">
      <button class="btn small" onclick="genPlanAI()">${tr("Genera il piano")}</button>
      <button class="btn ghost small" onclick="wizEditCurrent()">${tr("Lo scrivo io")}</button>
    </div></div>`;}

  
  /* ═══ UN AVVISO ALLA VOLTA ══════════════════════════════════════
     Prima potevano impilarsi fino a quattro riquadri prima del
     contenuto. Ora si sceglie il più urgente e gli altri aspettano il
     prossimo giro: la pagina resta una pagina, non una bacheca. */
  {const avvisi=[];
  if(needMorningBanner()){const p=pendingReviewDays()[0];
    avvisi.push(`<div class="card invito">
    <div class="ik">Ieri</div>
    <div class="it">${tr("Hai segnato tutti i pasti, l'acqua e lo sport?")}</div>
    <div class="mtools">
      <button class="btn small" onclick="goReview(${p.di})">${tr("Apri ieri")}</button>
      <button class="btn ghost small" onclick="reviewDone('${p.dISO}')">${tr("Era tutto a posto")}</button>
    </div></div>`);}
  if(needWeekBanner())avvisi.push(`<div class="card nota info riga">
    <div style="flex:1;font-size:13px"><b>${tr("Nuova settimana.")}</b> ${tr("La scorsa è stata archiviata da sola: se vuoi darle un'occhiata o correggere qualcosa, la trovi in Storico →  Modifica.")}</div>
    <button class="btn small" onclick="show('storico')">${tr("Vai al riepilogo")}</button>
    <button class="ibtn" onclick="dismissWeek()" title="${tr("Nascondi per oggi")}">${ic("x",15)}</button></div>`);
  if(!aiOn()&&!S.ui.dismissAI)avvisi.push(`<div class="card nota riga">
    <div style="flex:1;font-size:13px"><b>${tr("Manca la chiave AI</b>: senza, restano spenti piano automatico, stime dei piatti, foto, menù, ribilanciamenti e recuperi. È gratuita e si crea in un minuto.")}</div>
    <a class="btn small" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" style="text-decoration:none">${tr("Crea la chiave ↗")}</a>
    <button class="btn ghost small" onclick="show('sistema')">Incollala</button>
    <button class="ibtn" onclick="S.ui.dismissAI=1;save();render('oggi')" title="Nascondi">${ic("x",15)}</button></div>`);
  if(densNudge())avvisi.push(`<div class="card nota buona">
    <div style="font-size:13px">${dens()==="base"
      ? "Stai usando Nuvia da "+(+S.tel.giorni||0)+" giorni. Vuoi vedere <b>qualcosa in più</b> — macro, fibre, fasi della dieta — o va bene così?"
      : "Ti sembra troppa roba a schermo? Puoi passare a <b>Essenziale</b>: nulla sparisce, resta solo l'indispensabile in vista."}</div>
    <div class="mtools">
      ${dens()==="base"
        ? `<button class="btn small" onclick="densSet('full')">${tr("Mostrami di più")}</button>`
        : `<button class="btn small" onclick="densSet('base')">Semplifica</button>`}
      <button class="btn ghost small" onclick="densNudgeNo()">${tr("Va bene così")}</button>
    </div></div>`);
  if(telNudge())avvisi.push(`<div class="card invito">
    <div class="ik">${tr("Un favore da 1 secondo")}</div>
    <div class="it">${tr("Mi mandi le statistiche di quanto usi Nuvia?")} <b>${tr("Nessun dato personale o della tua dieta.")}</b></div>
    <div class="mtools">
      <button class="btn small" onclick="telNudgeSend()">Mandali</button>
      <button class="btn ghost small" onclick="telNudgeLater()">${tr("Più tardi")}</button>
    </div></div>`);
  if(avvisi.length)h+=avvisi[0];}
  /* Cambio di fase del ciclo dieta: si avvisa una volta sola, e da lì si
     ritarano piano e spesa sulle nuove calorie. */
  /* Cambio di fase: non un riquadro in mezzo alla pagina, ma un avviso
     che compare UNA volta. Si legge, si preme OK e l'app si ritara da
     sola: è un fatto compiuto, non una cosa da ricordarsi di fare. */
  /* Solo a un cambio di fase VERO: nella prima fase in assoluto non è
     «ripartito» un bel niente, si è appena cominciato. Serve che sia
     già passato almeno un blocco di deficit. */
  if(!S.ui.vacanza&&cycPhase()&&cycPhaseDay()<=3&&dietDayN()>cycDefDays()&&S.ui.cycSeen!==cycPhaseKey()){
    setTimeout(()=>cycAvvisoFase(),400);
  }
  // v5.1: nessun banner automatico di ribilanciamento — si usa il tasto RGP
  el.innerHTML=h;
  bindSwipe(el);ariaSync(el);
}
function renderOggi(){const el=document.getElementById("pg-oggi");const di=viewIdx();
  const eat=eatenOfDay(di),burn=burnedOfDay(di),t=tdeeOfDay(di),def=t+burn-eat.k,target=t+burn;
  let h="";
  /* Modalità Libera: le linee guida e la foto vanno PRIMA di tutto il
     resto, perché sono ciò che questa persona è venuta a fare. In
     modalità Piano liberaHTML() non restituisce nulla e la pagina
     resta identica a com'era. */
  h+=liberaHTML();
  /* La settimana e la missione: si guardano in un colpo d'occhio e non
     chiedono niente. Stanno in alto perché sono la risposta a «come sto
     andando», che è la domanda con cui si apre l'app. */
  h+=giocoHTML(di);
  /* Una proposta, al massimo, e solo se il momento è quello giusto:
     le regole stanno in momentoSbagliato(). */
  h+=propostaHTML();
  h+=oggiSpesa();
  /* L'acqua in testa: in fondo alla pagina non la segnava nessuno. */
  const goal=waterGoal(di);
  const _vd=iso(VIEW);
  h+=`<div class="gsec">${tr("Acqua e movimento")}</div>`;
  h+=(typeof pausaHTML==="function")?pausaHTML():"";
  /* l'invito del momento: lo strumento giusto per oggi, uno solo */
  h+=(typeof invitoHTML==="function")?invitoHTML():"";
  h+=(typeof filmInvito==="function")?filmInvito():"";
  h+=`<div class="card"><h2>${tr("Acqua")}</h2>${acquaRiga(di,tr("Bicchieri di oggi"))}`;
  h+=hint2(`${tr("Obiettivo:")} <b>${goal} ${tr("bicchieri")}</b> ${tr("da 200 ml")} (~${(goal*ML_BICCHIERE/1000).toFixed(1)} L)${(S.week.days[di].workouts||[]).some(w=>w.int==="alta"||w.min>45)?" · allenamento intenso: +2 bicchieri":""}.`,
   `${(+S.profile.waterGoalL>0)?tr("È il valore che hai scelto in Io → Obiettivi."):tr("È proposto sul tuo peso: 35 ml per kg, meno il ~22% che arriva già dal cibo.")} ${tr("Nei giorni con allenamento intenso o oltre 45 minuti si aggiungono 2 bicchieri. Puoi sempre scrivere il tuo valore in Io → Obiettivi.")}`)+`</div>`;
  // Sonno & Stress
  h+=`<div class="gsec">A tavola</div>`;
  h+=`<div class="card"><h2>${tr("I pasti")}</h2>${hint2(tr("Tocca il cerchio: ○ da fare · ✓ mangiato · ✗ saltato."),
   tr("⏳ compare quando l'AI sta elaborando. I comandi sotto ogni pasto: matita per modificare, dado per un'alternativa, frecce per sostituire un ingrediente, macchina fotografica e galleria per la stima dalla foto, barcode per i prodotti confezionati."),null,"tutti i comandi")}</div>`;
  const items=dayItems(di);
  if(items.length)items.forEach(it=>h+=mealCard(it.pdi,it.mi));
  else h+=vuotoDi("oggi");
  // Extra v5: card COMPLETE come i pasti (✓/✗, , , ) — niente eliminazioni per sbaglio
  (S.week.days[di].extras||[]).forEach((e,ei)=>{const done=e.st!=="skip";
    h+=`<div class="swipe" data-del="delExtraAsk(${di},${ei})"><div class="swipebg">${tr("Elimina")}</div><div class="meal ${done?"done":"skip"}"><div class="chk ${done?"c":"s"}" role="button" onclick="tglExtra(${di},${ei})">${done?"✓":"✗"}</div>
    <div class="mbody"><div class="mtop"><span class="mname">Extra${done?"":" (non mangiato)"}</span>${
      done?(function(){const q=qOf(e,e.d);return `<span class="qwrap">${qDot(q)}${q!=null?q+"%":(aiOn()?"…":"")}</span>`;})():""}</div>
    <div class="mdesc tap" onclick="editExtra(${di},${ei})" title="${tr("Tocca per modificare")}">${esc(cap(tr(e.d)))}</div><div class="mkcal">~${e.k} kcal · ${e.p||0}g proteine${e.c!=null?` · ${e.c}g carboidrati`:""}${e.f!=null?` · ${e.f}g grassi`:""}${e.fib!=null?` · ${e.fib}g fibre`:""}${e.z!=null?` · ${e.z}g zuccheri`:""}</div>
    <div class="mtools" style="margin-top:8px">
      <button class="ibtn" title="${tr("Scatta la foto adesso")}" onclick="extraPhotoFix(${di},${ei})">${ic("camera",17)}</button>
        <button class="ibtn" title="${tr("Scegli una foto dalla galleria")}" onclick="extraPhotoFix(${di},${ei},true)">${ic("gallery",17)}</button>
      <button class="ibtn" title="${tr("Barcode: scansiona i prodotti di questo extra")}" onclick="scanStart(${di},null,null,${ei})"><svg width="16" height="14" viewBox="0 0 24 20" style="vertical-align:-2px"><g fill="currentColor"><rect x="1" y="2" width="2" height="16"/><rect x="5" y="2" width="1" height="16"/><rect x="8" y="2" width="3" height="16"/><rect x="13" y="2" width="1" height="16"/><rect x="16" y="2" width="2" height="16"/><rect x="20" y="2" width="1" height="16"/><rect x="22" y="2" width="1.5" height="16"/></g></svg></button>
      <button class="ibtn" title="Elimina definitivamente" onclick="delExtraAsk(${di},${ei})">${ic("trash",17)}</button>
    </div></div></div></div>`;});
  h+=`<div class="mtools" style="margin-top:4px">
    <button class="btn ghost small" onclick="addExtra(${di})">+ Extra</button>
    <button class="btn small" onclick="rebalance(${di})">${tr("Ribilancia le calorie residue")}</button></div>
  ${hint2(tr(" Ribilancia agisce solo sui pasti non ancora spuntati."),
   tr("Ricalcola la giornata tenendo conto di quello che hai già mangiato e alleggerisce solo ciò che resta: prima le grammature, poi eventuali sostituzioni. Le proteine non vengono mai ridotte."),null,tr("come funziona"))}`;

  // Acqua con obiettivo dinamico
  h+=`<div class="gsec">${tr("Il bilancio della giornata")}</div>`;
  /* ═══ SENZA I NUMERI, SI CHIEDONO ═══════════════════════════════
     Non si disegna un bilancio di cui non si sa niente. Prima qui
     compariva «1200 kcal · Obiettivo di oggi» a chi non aveva dato
     peso, altezza ed età: un numero inventato, e per giunta quello
     sotto cui si parla di dieta molto ipocalorica.
     Chiedere è più onesto che riempire il vuoto, e costa un tocco. */
  if(typeof profiloUtile==="function"&&!profiloUtile()){
    h+=`<div class="card"><h2>${tr("Mi mancano tre numeri")}</h2>
      <div class="hint">${esc(tr("Peso, altezza e data di nascita: senza, qualunque obiettivo calorico sarebbe inventato. Un minuto e non te li chiedo più."))}</div>
      <div class="mtools"><button class="btn" onclick="show('io')">${esc(tr("Completa il profilo"))}</button></div>
    </div>`;
    el.innerHTML=h;
    return;
  }
  if(rientroOn()&&typeof rientroBonus==="function"&&rientroBonus()>0){
    /* Il lunedì dopo la vacanza è il giorno in cui si molla: qui si
       dice a voce alta che il deficit è ancora ridotto, di proposito. */
    h+=`<div class="gaugecard"><h2>${tr("Rientro dolce")}</h2>
    ${hint2(trh("Rientro: per {v2} giorni il deficit resta ridotto, poi torna pieno da solo.",{v2:GIORNI_RIENTRO}),trh("La bilancia di questi giorni tiene ancora l'acqua della vacanza — non è grasso, e non entra nella tendenza.",{v1:rientroBonus(),v2:GIORNI_RIENTRO}))}</div>`;}
  if(S.ui.vacanza){
  h+=`<div class="gaugecard"><h2>${tr("Modalità vacanza")}</h2>
    ${hint2(tr("Mangi a fabbisogno: il peso resta dov'è, e va bene così."),tr("Non stai perdendo terreno, stai tenendo. La serie è in pausa e nessun giorno conta come mancato: spunta e scrivi liberamente. Alla chiusura riprendo il deficit un poco alla volta. Si disattiva dalla pagina Io."))}</div>
    <div class="stat3"><div><div class="v">${eat.k}</div><div class="l">kcal segnate</div></div>
    <div><div class="v">${eat.p} g</div><div class="l">${tr("proteine")}</div></div>
    <div><div class="v">${burn}</div><div class="l">kcal sport</div></div></div>
    </div>`;
  }else{
    /* L'arco apre il bilancio: risponde in un colpo d'occhio alla sola
       domanda che si fa chi apre l'app a metà giornata — quanto mi resta.
       I riquadri di dettaglio restano sotto, per chi vuole i numeri. */
    h+=`<div class="gaugecard">${arcoGiornoHTML(di)}<div class="hint" style="margin:0 0 4px">${tr("Bilancio di")} ${giorno(PLAN[di].day)} ${isToday()?"":("("+VIEW.toLocaleDateString(dataLoc())+")")}${isHard(_vd)?` · <span style="color:var(--zafft)"> ${esc((S.dayEvents||{})[_vd]||"giornata difficile")} (esclusa dalle medie)</span>`:""}</div>
    ${(function(){
      const plan=plannedOfDay(di).k;
      /* Riquadro con barra: valore su obiettivo. cap=true → l'obiettivo è un
         TETTO da non superare (zuccheri): oltre, la barra diventa rossa. */
      const box=(v,unit,lab,goal,col,cap)=>{
        const pct=Math.min(100,Math.round(v/Math.max(1,goal)*100));
        const over=cap?(v>goal):(v>goal*1.1);
        return `<div><div class="v">${v}${unit}</div><div class="l">${lab}</div>
          <div class="mbar" title="${v}${unit} di ${goal}${unit}"><i style="width:${pct}%;background:${over?"var(--zaff)":col}"></i></div>
          <div class="s">${cap?tr("max"):tr("obiettivo")} ${goal}${unit}</div></div>`;};
      const q=dayQuality(di);
      const ess=!densMin("full");   /* essenziale: quattro riquadri, non nove */
      return `<div class="mtx">
      <div><div class="v" style="color:${def>=0?"var(--azione)":"var(--zaff)"}">${def>=0?"−":"+"}${Math.abs(def)}</div>
        <div class="l">${tr("kcal di")} ${def>=0?"deficit":"surplus"}</div>
        <div class="s" style="margin-top:8px">${tr("mangiate")} ${eat.k}<br>${tr("sport")} ${burn>=0?"+":"−"}${Math.abs(burn)}</div></div>
      <!-- IDENTITÀ (founder, 22/08): kcal e macro stanno TUTTI sul
           turchese, con tre sole gradazioni. Prima c'erano corallo e
           due blu: quattro famiglie di colore per quattro numeri
           della stessa cosa. Le etichette scritte bastano a
           distinguerli, il colore non deve fare quel lavoro. -->
      ${box(eat.k,"",tr("kcal mangiate"),plan||dayTargetK(),"var(--bosco)")}
      ${box(eat.p," g",tr("proteine"),dayTargetP(),"var(--azione)")}
      ${ess?"":box(eat.c," g",tr("carboidrati"),dayTargetC(),"var(--salvia)")}
      ${ess?"":box(eat.f," g",tr("grassi"),dayTargetF(),"var(--azione)")}
      ${ess?"":box(eat.fib," g",tr("fibre"),dayTargetFib(),"#00AFA3")}
      ${ess?"":box(eat.z," g",tr("zuccheri"),dayTargetZ(),"#FF7F50",true)}
      <div><div class="v"> ${S.streak.count}</div><div class="l">${tr("giorni in target")}</div>
        <div class="s" style="margin-top:8px">${trh("{v1} pasti saltati",{v1:skippedOfDay(di)})}</div></div>
      <div><div class="v">${qDot(q,15)} ${q!=null?q+"%":"—"}</div><div class="l">${tr("qualità del cibo")}</div>
        <div class="s" style="margin-top:8px">${(function(){const n=qStreak();
          return n>0?("<b>"+n+(n===1?" giorno":" giorni")+" di fila</b> con cibo buono")
                    :(q!=null?esc(qLabel(q)):(aiOn()?tr("spunta i pasti per saperlo"):"serve la chiave AI"));})()}</div></div>
    </div>`;})()}
    ${(function(){const t=waterPredict(di);return t?`<div class="hint" style="background:var(--menta);padding:8px;border-radius:12px;margin-top:12px">${t}</div>`:"";})()}</div>`;}
  el.innerHTML=h;
  /* i box AI si mostrano solo quando hanno contenuto: gli id possono non
     esserci più in questa pagina (alcuni sono passati in Tools), quindi si
     osserva solo ciò che esiste davvero */
  bindSwipe(el);ariaSync(el);qSweep(di);
  ["fridgeOut","menuOut","geoOut","caliOut","fuelOut","splitOut"].forEach(id=>{
    const b=document.getElementById(id);if(!b)return;
    new MutationObserver(()=>{b.style.display=b.textContent.trim()?"block":"none";}).observe(b,{childList:true,subtree:true,characterData:true});});}
/* Accessibilità: le spunte custom espongono il loro stato agli screen reader */
function ariaSync(root){
  const el=root||document;
  el.querySelectorAll(".ck").forEach(l=>{
    const inp=l.querySelector("input[type=checkbox],input[type=radio]");
    if(!inp)return;
    l.setAttribute("role",inp.type==="radio"?"radio":"checkbox");
    l.setAttribute("aria-checked",inp.checked?"true":"false");
    if(!inp._ariaBound){inp._ariaBound=true;
      inp.addEventListener("change",()=>l.setAttribute("aria-checked",inp.checked?"true":"false"));}});
  el.querySelectorAll(".water span").forEach((sp,i)=>{
    sp.setAttribute("role","checkbox");
    sp.setAttribute("aria-checked",sp.className.indexOf("f")>-1?"true":"false");
    sp.setAttribute("aria-label","Bicchiere "+(i+1));});
  el.querySelectorAll(".chk").forEach(c=>{
    c.setAttribute("role","checkbox");
    c.setAttribute("aria-checked",c.className.indexOf("c")>-1?"true":"false");});}
window.setWater=(d,i)=>{
  try{usoSegna("acqua");}catch(e){}
  S.week.days[d].water=(S.week.days[d].water===i+1?i:i+1);save();
  /* i bicchieri sono in DUE pagine: ridisegnare sempre «oggi» lasciava
     il Punto immobile, e sembrava che il tocco non funzionasse */
  render(cur);};

/* ═══════════════════════════════════════════════════════════════
   11. SCANNER BARCODE v5 (Html5-Qrcode + Open Food Facts)
   Più prodotti nella stessa sessione: scansiona → si accodano →
   modifichi i grammi → confermi la SOMMA. Il totale finisce nel
   pasto scelto (come "modificato") oppure come extra.
   ═══════════════════════════════════════════════════════════════ */
let scanner=null;
let SCANQ=null; // {di, pdi, mi, items:[{name,k100,p100,c100,f100,fib100,g}]}
window.scanStart=(di,pdi,mi,ei)=>{
  if(window._noScan||typeof Html5Qrcode==="undefined")return dlgAlert(tr("Scanner non disponibile: serve internet al primo avvio per caricare la libreria."));
  SCANQ={di,pdi:(pdi!=null?pdi:null),mi:(mi!=null?mi:null),ei:(ei!=null?ei:null),items:[]};
  renderScanQ();scanOne();};
async function stopCam(){if(scanner){try{await scanner.stop();}catch(_){}scanner=null;}
  const b=document.getElementById("scanLive");if(b)b.style.display="none";}
function scanTotals(){let k=0,p=0,c=0,f=0,fib=0,z=0;
  SCANQ.items.forEach(it=>{const r=it.g/100;k+=it.k100*r;p+=it.p100*r;c+=it.c100*r;f+=it.f100*r;fib+=(it.fib100||0)*r;z+=(it.z100||0)*r;});
  return{k:Math.round(k),p:Math.round(p),c:Math.round(c),f:Math.round(f),fib:Math.round(fib),z:Math.round(z)};}
window.scanG=(i,v)=>{SCANQ.items[i].g=Math.max(0,parseFloat(v)||0);renderScanQ(true);};
window.scanDel=(i)=>{SCANQ.items.splice(i,1);renderScanQ();};
window.scanManual=async ()=>{const n=await dlgPrompt(tr("Nome prodotto:"));if(!n)return;
  const k=parseFloat(await dlgPrompt(tr("kcal per 100 g:"),"100"))||0,p=parseFloat(await dlgPrompt(tr("proteine per 100 g:"),"5"))||0;
  SCANQ.items.push({name:n,k100:k,p100:p,c100:0,f100:0,fib100:0,z100:0,g:100});renderScanQ();};
window.scanMore=()=>{renderScanQ();scanOne();};

/* ═══ UNA SCANSIONE ═══════════════════════════════════════════════
   DIFETTO TROVATO IL 19/08/2026: questa funzione veniva CHIAMATA da
   scanStart e scanMore ma non era definita da nessuna parte —
   toccare «scansiona» lanciava un ReferenceError e la fotocamera non
   si apriva. Nessun collaudo l'aveva visto perché tutti impostano
   `window._noScan` (in JSDOM la fotocamera non esiste) e quindi
   uscivano prima di arrivare qui.
   Lezione: un collaudo che salta sempre non è un collaudo. Ora
   t_barcode verifica almeno che la funzione ESISTA. */
async function scanOne(){
  const box=document.getElementById("scanLive");
  if(box)box.style.display="block";
  if(typeof Html5Qrcode==="undefined"){await scanChiedi();return;}
  try{
    if(scanner)await stopCam();
    scanner=new Html5Qrcode("scanLive");
    await scanner.start({facingMode:"environment"},
      {fps:10,qrbox:{width:250,height:160}},
      async (testo)=>{
        await stopCam();
        await scanAggiungi(String(testo||"").replace(/\D/g,""));
      },()=>{});
  }catch(e){
    /* fotocamera negata o assente: si scrive il codice a mano invece
       di restare davanti a un rettangolo nero */
    await stopCam();
    await scanChiedi();}}

/* Il codice a mano: la via che funziona sempre. */
async function scanChiedi(){
  const c=await dlgPrompt(tr("Scrivi il codice a barre"),"");
  if(c)await scanAggiungi(String(c).replace(/\D/g,""));}

/* Dal codice alla riga in coda. Ogni esito ha la sua parola: un
   «non trovato» detto come un errore di rete manda la persona a
   controllare il wifi per niente. */
async function scanAggiungi(ean){
  if(!ean)return;
  const r=await barcodeCerca(ean);
  if(r.stato==="codice")   return dlgAlert(tr("Questo codice non sembra un codice a barre."));
  if(r.stato==="offline")  return dlgAlert(tr("Serve la rete per leggere un prodotto nuovo. Quelli già letti funzionano anche offline."));
  if(r.stato==="rete")     return dlgAlert(tr("L'archivio dei prodotti non risponde. Riprova, o scrivi il piatto a mano."));
  if(r.stato==="sconosciuto")
    return dlgAlert(tr("Questo prodotto non è nell'archivio. Puoi fotografarlo o scriverlo a mano: il valore lo mettiamo comunque."));
  const p=r.p;
  SCANQ.items.push({ean:p.ean,nome:p.nome,g:p.porzione||100,
    k100:p.kcal,p100:p.prot,c100:p.carb,f100:p.gras,
    fib100:p.fibre,z100:p.zuccheri});
  /* una voce vecchia si usa, ma lo si dice: un dato di tre mesi fa è
     meglio di nessun dato, non è la stessa cosa di uno fresco */
  if(r.da==="cache-vecchia")
    toast(tr("{n}: valori di {g} giorni fa, l'archivio non è raggiungibile.",{n:p.nome,g:r.giorni||90}));
  else toast(tr("{n} in coda.",{n:p.nome}));
  try{usoSegna("barcode");}catch(e){}
  renderScanQ();}
window.scanAggiungi=scanAggiungi;
window.scanConfirm=()=>{
  if(!SCANQ.items.length)return dlgAlert(tr("Nessun prodotto in lista."));
  const t=scanTotals();
  const desc=SCANQ.items.map(it=>it.name+" "+it.g+"g").join(" + ");
  if(SCANQ.pdi!=null&&SCANQ.mi!=null){ // dentro un pasto: aggiorna il pasto (spunta a te)
    S.week.days[SCANQ.pdi].meals[SCANQ.mi].custom={d:desc+" (da barcode)",k:t.k,p:t.p,c:t.c,f:t.f,fib:t.fib,z:t.z};
    toast(tr("Pasto aggiornato dai barcode ✓"));
  }else if(SCANQ.ei!=null&&S.week.days[SCANQ.di].extras[SCANQ.ei]){ // dentro un extra: lo compila
    Object.assign(S.week.days[SCANQ.di].extras[SCANQ.ei],{d:desc,k:t.k,p:t.p,c:t.c,f:t.f,fib:t.fib,z:t.z});
    toast(tr("Extra compilato dai barcode ✓"));
  }else{
    S.week.days[SCANQ.di].extras.push({d:desc,k:t.k,p:t.p,c:t.c,f:t.f,fib:t.fib,z:t.z,st:"done"});
    toast(tr("Extra aggiunto dai barcode ✓"));}
  closeScanQ();save();render(cur);};
window.closeScanQ=()=>{stopCam();SCANQ=null;const m=document.getElementById("scanM");if(m)m.remove();};
function renderScanQ(){
  let m=document.getElementById("scanM");
  if(!m){m=document.createElement("div");m.id="scanM";m.className="modal";document.body.appendChild(m);}
  const t=SCANQ.items.length?scanTotals():null;
  let inner=`<div class="mcard"><h2 style="color:var(--bosco);font-size:16px">Barcode — ${SCANQ.pdi!=null?"per il pasto "+esc(PLAN[SCANQ.pdi].meals[SCANQ.mi].n):(SCANQ.ei!=null?"per questo extra":"come extra")}</h2>
  <div class="hint">${trh("Scansiona <b>più prodotti</b> uno dopo l'altro, correggi i {b1} e conferma la <b>somma</b>.",{b1:"<b>grammi</b>"})}</div>
  <div id="scanLive" style="display:none;margin-top:8px"><div id="scanreader2" style="width:100%;border-radius:12px;overflow:hidden"></div>
  <button class="btn warn small" onclick="stopCam();renderScanQ()">Ferma fotocamera</button></div>`;
  SCANQ.items.forEach((it,i)=>{inner+=`<div class="wline"><span style="flex:1">${esc(it.name)}<br><small style="color:var(--grigio)">${it.k100} kcal · ${it.p100} g proteine /100g</small></span>
    <input type="number" value="${it.g}" style="width:74px" onchange="scanG(${i},this.value)"> <small>g</small>
    <span class="del" onclick="scanDel(${i})">✕</span></div>`;});
  if(t)inner+=`<div class="daytotal" style="padding-top:8px">${tr("Totale:")} <span>~${t.k} kcal · ${t.p}g proteine · ${t.c}g carboidrati · ${t.f}g grassi · ${t.fib}g fibre · ${t.z}g zuccheri</span></div>`;
  inner+=`<div class="mtools" style="margin-top:12px">
    <button class="btn ghost small" onclick="scanMore()">Scansiona ${SCANQ.items.length?"un altro":""}</button>
    <button class="btn ghost small" onclick="scanManual()">＋ A mano</button></div>
  <div class="mtools" style="margin-top:8px">
    <button class="btn small" onclick="scanConfirm()">${tr("Conferma somma")}</button>
    <button class="btn warn small" onclick="closeScanQ()">${tr("Annulla")}</button></div></div>`;
  m.innerHTML=inner;}

