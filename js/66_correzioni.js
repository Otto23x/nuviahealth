/* ═══════════════════════════════════════════════════════════════
   66. LE CORREZIONI — «questo non mi va» diventa una regola
   ═══════════════════════════════════════════════════════════════
   Chiesto dal founder il 25/08: «facciamo una sezione correzioni con
   AI dove l'utente scrive le correzioni e l'AI le propaga dove serve».

   ── LA REGOLA CHE GOVERNA TUTTO IL MODULO ──────────────────────
   **Una correzione diventa una regola, non una nota.** Un disclaimer
   che dice «controlla tu che non ci sia niente che ti fa male» sposta
   il lavoro sulla persona senza darle uno strumento; una nota nel
   prompt è un promemoria che il modello può dimenticare al piano
   successivo. Una regola invece finisce in `S.diet.no` — il campo che
   il prompt legge da sempre — e da lì in `vietatiElenco()`, cioè
   nell'elenco che `validaSettimana` CONTROLLA IN JAVASCRIPT a ogni
   generazione. Da quel momento non è più una preghiera: è una
   verifica che non si stanca.

   ── COSA FA, IN ORDINE ─────────────────────────────────────────
   1. La persona scrive come le viene: «il finocchio mi gonfia»,
      «basta legumi», «niente fritti».
   2. L'AI (o, senza AI, una pulizia locale) ESTRAE gli alimenti, le
      categorie o le preparazioni da evitare. Solo quello.
   3. I termini entrano in S.diet.no, senza doppioni.
   4. Si cercano nel piano ATTUALE i giorni che li contengono — con
      `vietatoDentro`, lo stesso confronto della validazione — e si
      rifanno SOLO quelli, con la chiamata mirata che esiste già.
   5. Si racconta cosa è successo: «tolto da Mercoledì e Sabato».

   ── COSA NON FA, PER SCELTA ────────────────────────────────────
   Non chiede perché. Non registra sintomi. Non diagnostica.
   «Il finocchio mi gonfia» → si toglie il finocchio, punto.
   Chiedere «da quanto ti gonfia?» o annotare il sintomo sarebbe
   attraversare il confine medico (v13.64): il gonfiore è affare del
   medico, il finocchio è affare nostro.                            */

/* ── LA CARD NELLA PAGINA PIANO ─────────────────────────────────
   È anche la casa del disclaimer, ed è il modo giusto di farlo: non
   una scrollata di spalle («verifica tu»), ma una porta — la frase
   dice il limite E consegna lo strumento per agire. */
function correzioniCardHTML(){
  const attive=String((S.diet&&S.diet.no)||"").trim();
  return `<div class="card"><h2>${tr("Correzioni")}</h2>
  <div class="hint">${esc(tr("Il piano è costruito sulle tue risposte, non è una prescrizione: se un piatto non ti va, o non è compatibile con una tua condizione, scrivilo qui — lo tolgo e non torna più."))}</div>
  <label for="corrIn" style="margin-top:12px">${esc(tr("Cosa togliere o cambiare"))}</label>
  <input type="text" id="corrIn" placeholder="${esc(tr("es. il finocchio mi gonfia, niente fritti"))}">
  <button class="btn ghost" style="width:100%;margin-top:12px" onclick="correzioneApplica()">${esc(tr("Applica la correzione"))}</button>
  <div class="aibox" aria-live="polite" id="corrOut" style="display:none"></div>
  ${attive?`<div class="hint" style="margin-top:8px">${esc(tr("Regole attive — quello che non compare mai:"))} ${esc(attive)}. ${esc(tr("Si modificano da Regole."))}</div>`:""}
</div>`;}
window.correzioniCardHTML=correzioniCardHTML;

/* ── L'ESTRAZIONE ───────────────────────────────────────────────
   Con l'AI: una chiamata breve che tira fuori SOLO i termini. Il
   prompt dice esplicitamente di ignorare sintomi e motivi: non è
   freddezza, è il confine — quello che ci serve è COSA togliere,
   il perché resta della persona.
   Senza AI: la stessa pulizia di vietatiElenco sul testo scritto,
   che con «finocchio, fritti» funziona benissimo. */
async function correzioneEstrai(testo){
  if(typeof aiOn==="function"&&aiOn()){
    try{
      const t=await aiAsk('Da questa richiesta di correzione di un piano alimentare estrai SOLO cosa va evitato d\'ora in poi: alimenti, categorie di alimenti o preparazioni. IGNORA sintomi, motivi e tutto il resto: non servono e non vanno riportati. Non aggiungere niente che non sia stato chiesto. Richiesta: "'+String(testo).replace(/"/g,"'")+'". Rispondi SOLO JSON: {"evita":["termine1","termine2"]}',"analisi");
      const j=parseAIJSON(t);
      if(j&&Array.isArray(j.evita)&&j.evita.length)
        return j.evita.map(x=>String(x).toLowerCase().trim()).filter(Boolean);
    }catch(e){/* si passa alla strada locale */}
  }
  return vietatiElenco(String(testo||""),"");}

/* ── L'APPLICAZIONE ─────────────────────────────────────────────── */
window.correzioneApplica=async()=>{
  const inp=document.getElementById("corrIn");
  const box=document.getElementById("corrOut");
  const testo=String((inp&&inp.value)||"").trim();
  if(!testo)return dlgAlert(tr("Scrivi cosa devo togliere o cambiare, come ti viene."));
  if(box){box.style.display="block";box.textContent=tr("Leggo la correzione…");}

  const termini=await correzioneEstrai(testo);
  /* la stessa pulizia della validazione: niente frasi, niente rumore */
  const puliti=vietatiElenco(termini.join("; "),"");
  if(!puliti.length){
    if(box)box.textContent=tr("Non ho capito quale alimento togliere: prova a scriverlo diretto, per esempio «niente finocchio».");
    return;}

  /* ── 1 · la regola si scrive, senza doppioni ── */
  const attuali=vietatiElenco(String(S.diet.no||""),"");
  const nuovi=puliti.filter(x=>attuali.indexOf(x)<0);
  if(nuovi.length){
    S.diet.no=[String(S.diet.no||"").trim(),nuovi.join(", ")].filter(Boolean).join(", ");
    save();}

  /* ── 2 · i giorni colpiti si trovano col confronto della validazione ── */
  const colpiti=[];
  (PLAN||[]).forEach((d,i)=>{
    const trovato=(d.meals||[]).some(m=>{
      if((m.type||"norm")!=="norm")return false;      /* liberi e mensa non si toccano */
      const desc=(m.o&&m.o[0]&&m.o[0].d)||"";
      return !!vietatoDentro(desc,puliti);});
    if(trovato)colpiti.push({i:i,giorno:d.day});});

  if(!colpiti.length){
    if(box)box.textContent=nuovi.length
      ? trh("Registrato: {v1}. Nel piano attuale non compare — e d'ora in poi non comparirà.",{v1:nuovi.join(", ")})
      : tr("Era già fra le regole, e nel piano attuale non compare.");
    try{render(cur);}catch(e){}
    return;}

  /* ── 3 · senza AI la regola vale comunque, e si dice cosa resta ── */
  if(typeof aiOn!=="function"||!aiOn()){
    if(box)box.innerHTML=esc(trh("Registrato: {v1}. Compare ancora in {v2}: scegli lì un'alternativa con il dado — dal prossimo piano non ci sarà più.",{v1:puliti.join(", "),v2:colpiti.map(c=>giorno(c.giorno)).join(", ")}));
    try{render(cur);}catch(e){}
    return;}

  /* ── 4 · si rifanno SOLO i giorni colpiti ── */
  if(box)box.textContent=trh("Rifaccio {v1}…",{v1:colpiti.map(c=>giorno(c.giorno)).join(", ")});
  try{
    const esito=await correzioneRifai(colpiti,puliti);
    if(!esito.fatti.length){
      if(box)box.textContent=tr("La riscrittura non è arrivata: la regola resta registrata, riprova fra poco o cambia i pasti con il dado.");
      return;}
    snapSave("prima di: correzione applicata");
    esito.fatti.forEach(f=>{PLAN[f.i]=f.day;});
    S.customPlan=PLAN;
    if(typeof pianoCambiato==="function")pianoCambiato();
    save();
    const nomi=esito.fatti.map(f=>giorno(PLAN[f.i].day)).join(", ");
    if(box)box.innerHTML=esc(trh("Fatto: {v1} non compare più. Ho riscritto {v2}, il resto del piano non è stato toccato.",{v1:puliti.join(", "),v2:nomi}))+
      (esito.rimasti.length?"<br>"+esc(trh("In {v1} non sono riuscito a toglierlo: scegli lì un'alternativa.",{v1:esito.rimasti.join(", ")})):"");
    try{render(cur);}catch(e){}
  }catch(e){
    if(box)box.textContent=tr("La riscrittura non è arrivata: la regola resta registrata, riprova fra poco o cambia i pasti con il dado.");
  }};

/* ── LA RISCRITTURA MIRATA ──────────────────────────────────────
   Usa gli stessi mattoni della generazione — askWeekAI, il contratto,
   normDayAI, la validazione — e le stesse regole del piano
   (rulesForPlan, target, pasti). I giorni tornano al loro posto per
   NOME; un giorno in cui il termine resta NON si applica: sarebbe
   sostituire un giorno buono con uno che ha lo stesso difetto. */
async function correzioneRifai(colpiti,vietati){
  const target=dayTargetK(),protG=dayTargetP();
  const slots=parseSlots(S.diet.slots||"Colazione, Metà mattina, Pranzo, Metà pomeriggio, Cena");
  /* ══ ANCHE QUESTA È UNA STRADA CHE SCRIVE UN PIANO (audit 27/08) ══
     Riscrive uno o più giorni interi, e lo faceva sapendo solo: i
     termini appena corretti, l'età, il target e le regole nutrizionali.
     Non sapeva le allergie, le intolleranze, il tipo di dieta, la
     tradizione, i farmaci — e il suo controllo confrontava soltanto i
     termini appena corretti, senza allergeni.
     Cioè: un giorno riscritto per togliere il finocchio poteva
     rientrare con dentro un allergene, e passava. Adesso questa strada
     riceve lo stesso contesto delle altre e la stessa rete. */
  const q='Stai correggendo un piano alimentare settimanale italiano già scritto. Rifai SOLO questi giorni, lasciando stare gli altri: '+
    colpiti.map(c=>c.giorno).join(", ")+'. Il motivo della correzione: la persona NON vuole più questi alimenti o preparazioni, in nessuna forma: '+
    vietati.join(", ")+'. Persona: '+age()+' anni. Target di OGNI giorno: circa '+target+' kcal (tolleranza ±5%) e almeno '+protG+' g di proteine. '+
    ((typeof dietStr==="function")?dietStr()+' ':'')+
    rulesForPlan()+((typeof rigaPasto==="function")?rigaPasto():'')+
    ' Pasti da prevedere, in questo ordine esatto: '+slots.join(", ")+'.'+
    ' Regole: solo alimenti veri, porzioni in grammi, valori nutrizionali REALI.'+
    weekJSONContract(colpiti.map(c=>c.giorno),false)
      .replace('ESATTAMENTE sette oggetti','ESATTAMENTE '+colpiti.length+(colpiti.length===1?' oggetto':' oggetti'));
  const r=await askWeekAI(q);
  const fatti=[],rimasti=[];
  if(r.week&&Array.isArray(r.week.days)){
    r.week.days.forEach(d=>{
      const nome=cibNorm(d&&d.day);
      let c=colpiti.find(x=>cibNorm(x.giorno)===nome);
      if(!c&&r.week.days.length===colpiti.length)c=colpiti[r.week.days.indexOf(d)];
      if(!c||!d||!Array.isArray(d.meals)||!d.meals.length)return;
      /* la verifica è la stessa della generazione: il termine non deve
         più esserci, e i numeri devono essere numeri */
      /* la rete completa, non solo i termini appena corretti: le
         allergie e la dieta di riferimento valgono anche qui, e sono
         proprio quelle su cui non ci si può permettere un buco */
      const controllo=validaSettimana([d],{giorni:[c.giorno],kcal:target,prot:protG,
        tollPct:5,slots:slots,nPasti:slots.length,
        vietati:vietati.concat((typeof vietatiElenco==="function")
          ?vietatiElenco(S.diet.no||"",S.diet.intol||""):[]),
        allergeni:(typeof allergeniElenco==="function")?allergeniElenco(S.diet.allergie||""):[],
        ripetizioni:"libera"});
      const grave=controllo.problemi.some(p=>p.grave);
      if(grave){rimasti.push(giorno(c.giorno));return;}
      fatti.push({i:c.i,day:normDayAI(c.giorno,d)});});
  }
  return {fatti:fatti,rimasti:rimasti};}
