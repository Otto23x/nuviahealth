/* ═══════════════════════════════════════════════════════════════
   34. IL FOSSATO — «cucina quello che hai» e «piano a budget»
   ═══════════════════════════════════════════════════════════════
   Le due funzioni per cui qualcuno sceglie noi invece di chi
   riconosce le foto meglio di noi.

   Il ragionamento, in una riga: **loro fotografano quello che hai
   mangiato, noi organizziamo quello che mangerai.** Su quel terreno
   il riconoscimento del piatto è un dettaglio, non un fossato — e
   inseguirli lì significa perdere piano piano con la loro arma.

   Le due domande a cui rispondiamo sono quelle che la gente si fa
   davvero, e nessuna delle due riguarda le calorie:

   1. Sono le 19:15, ho il frigo mezzo vuoto e devo cenare.
      **Con questa roba, cosa ci faccio?**
   2. Ho 45 € per la spesa della settimana.
      **Cosa compro perché mi basti e mangi decentemente?**

   Chi risolve queste due cose entra nella vita di una persona il
   martedì sera, non solo dopo pranzo quando c'è da registrare.

   ── LE REGOLE ──────────────────────────────────────────────────
   · **Non si inventa quello che non c'è.** Se mancano ingredienti
     lo si dice e si propone il minimo da comprare, non si scrive una
     ricetta che presuppone il basilico fresco.
   · **Il budget è un vincolo, non un obiettivo.** Non si fa a gara a
     spendere meno: si sta dentro quello che la persona ha detto,
     dicendo con onestà cosa si perde quando è troppo poco.
   · **Mai giudicare né la dispensa né il portafoglio.** «Con 35 € si
     fa» è aiuto; «con 35 € si mangia male» è una porta in faccia a
     chi non ha alternative.
   · **Niente sprechi come leva morale.** Usare quello che c'è si
     propone perché conviene e semplifica, non perché buttare è una
     colpa.                                                        */

/* ── Lo stato ───────────────────────────────────────────────────
   Proprietà nuova con default, come sempre: chi aggiorna non perde
   niente e chi non usa queste funzioni non se ne accorge. */
function dispensa(){
  if(!S.disp||typeof S.disp!=="object")S.disp={};
  const D=S.disp;
  if(!Array.isArray(D.roba))D.roba=[];
  if(typeof D.letto!=="string")D.letto="";
  if(typeof D.budget!=="number")D.budget=0;
  if(!Array.isArray(D.propostePiatti))D.propostePiatti=[];
  return D;}
window.dispensa=dispensa;

const DISP_CAT=["Carne e pesce","Uova e latticini","Cereali, pane e derivati",
  "Legumi","Verdura","Frutta","Grassi, semi e frutta secca","Dispensa e bevande","Altro"];

/* Normalizza una voce letta dalla foto o scritta a mano. Le quantità
   restano TESTO: «circa 400 g» è più onesto di 400, perché nessuno
   pesa il frigo e una precisione finta produce piani che non tornano. */
function vocePulita(v){
  if(!v||typeof v!=="object")return null;
  const nome=String(v.nome||"").trim().toLowerCase().slice(0,60);
  if(!nome)return null;
  return {nome,
    qta:String(v.qta||"").trim().slice(0,40),
    cat:DISP_CAT.includes(v.cat)?v.cat:"Altro",
    certezza:["alta","media","bassa"].includes(v.certezza)?v.certezza:"media",
    /* «scade presto» solo se dichiarato: dedurlo fa buttare cibo buono
       o, peggio, fa fidare di cibo andato. */
    scade:["presto","no","ignoto"].includes(v.scade)?v.scade:"ignoto"};}
window.vocePulita=vocePulita;

function dispensaAggiungi(voci){
  const D=dispensa();
  const nuove=(Array.isArray(voci)?voci:[]).map(vocePulita).filter(Boolean);
  nuove.forEach(n=>{
    const g=D.roba.find(x=>x.nome===n.nome);
    if(g){Object.assign(g,n);}else{D.roba.push(n);}});
  D.letto=iso(new Date());save();
  return nuove.length;}
window.dispensaAggiungi=dispensaAggiungi;

window.dispensaTogli=(nome)=>{
  const D=dispensa();
  D.roba=D.roba.filter(x=>x.nome!==String(nome||"").toLowerCase());save();
  try{render(cur);}catch(e){}};

window.dispensaSvuota=()=>{const D=dispensa();D.roba=[];D.propostePiatti=[];save();
  try{render(cur);}catch(e){}};

/* Quello che scade prima si propone prima. Non è una lezione sullo
   spreco: è che se hai gli spinaci da tre giorni, la cena giusta è
   quella con gli spinaci. */
function dispensaPriorita(){
  const D=dispensa();
  const peso={presto:0,ignoto:1,no:2};
  return D.roba.slice().sort((a,b)=>(peso[a.scade]-peso[b.scade])||a.nome.localeCompare(b.nome));}
window.dispensaPriorita=dispensaPriorita;

/* ── Cucina quello che hai ──────────────────────────────────────
   Il prompt dice al modello cosa NON può fare, che è la parte che
   conta: senza, propone la ricetta col basilico fresco che non hai. */
function promptPiatti(quanti){
  const D=dispensa();
  const roba=dispensaPriorita().map(x=>x.nome+(x.qta?" ("+x.qta+")":"")+
    (x.scade==="presto"?" [da usare presto]":"")).join(", ");
  const t=(typeof lineeGuidaOggi==="function")?lineeGuidaOggi():null;
  const kcal=t&&t.kcal?Math.round(t.kcal/3):null;
  return "In casa ci sono SOLO questi ingredienti: "+roba+".\n"+
    "Proponi "+(quanti||3)+" piatti fattibili ADESSO.\n"+
    "REGOLE NON NEGOZIABILI:\n"+
    "- Usa SOLO gli ingredienti elencati, più sale, pepe, olio e acqua che si danno per scontati.\n"+
    "- Se un piatto ha bisogno di UNA cosa che manca, puoi proporlo lo stesso ma devi elencarla in \"manca\".\n"+
    "- Mai proporre un piatto che richiede più di due cose mancanti.\n"+
    "- Metti per primi i piatti che usano ciò che è segnato [da usare presto].\n"+
    "- Niente giudizi su cosa c'è o non c'è in casa.\n"+
    (kcal?"- Punta a circa "+kcal+" kcal a porzione, senza scriverlo come un obbligo.\n":"")+
    "Rispondi SOLO con JSON: {\"piatti\":[{\"nome\":\"\",\"come\":\"\",\"minuti\":0,"+
    "\"usa\":[\"\"],\"manca\":[\"\"],\"k\":0,\"p\":0,\"c\":0,\"f\":0}]}";}
window.promptPiatti=promptPiatti;

/* Convalida la risposta: un piatto che usa ingredienti inventati non
   arriva mai a schermo. È il controllo che rende la funzione
   affidabile invece che simpatica. */
function piattiValidi(risposta){
  let j=risposta;
  if(typeof j==="string"){try{j=JSON.parse(j);}catch(e){return {piatti:[],scartati:0};}}
  const avuti=new Set(dispensa().roba.map(x=>x.nome));
  const ovvi=["sale","pepe","olio","acqua","olio d'oliva","olio extravergine"];
  const out=[];let scartati=0;
  ((j&&j.piatti)||[]).forEach(p=>{
    if(!p||!p.nome)return;
    const usa=(Array.isArray(p.usa)?p.usa:[]).map(x=>String(x).toLowerCase().trim());
    const manca=(Array.isArray(p.manca)?p.manca:[]).map(x=>String(x).toLowerCase().trim());
    /* Ogni ingrediente dichiarato «usato» dev'essere davvero in casa,
       o dichiarato mancante. Il modello a volte se ne dimentica. */
    const fantasmi=usa.filter(u=>!avuti.has(u)&&!manca.includes(u)&&
      !ovvi.includes(u)&&![...avuti].some(a=>u.includes(a)||a.includes(u)));
    if(fantasmi.length){scartati++;return;}
    if(manca.length>2){scartati++;return;}
    out.push({nome:String(p.nome).slice(0,80),
      come:String(p.come||"").slice(0,400),
      minuti:Math.max(0,Math.min(180,+p.minuti||0)),
      usa,manca,
      k:Math.max(0,+p.k||0),p:Math.max(0,+p.p||0),
      c:Math.max(0,+p.c||0),f:Math.max(0,+p.f||0)});});
  return {piatti:out,scartati};}
window.piattiValidi=piattiValidi;

/* ── Piano a budget ─────────────────────────────────────────────
   Il vincolo è quello che la persona ha detto. Non si fa a gara a
   spendere meno, e non si commenta la cifra. */
const BUDGET_MIN_GIORNO=250;         /* centesimi: sotto, si avvisa */

function budgetPerGiorno(cent,giorni){
  const g=Math.max(1,+giorni||7);
  return Math.round((+cent||0)/g);}
window.budgetPerGiorno=budgetPerGiorno;

/* Cosa dire quando il budget è basso. La frase giusta aiuta; quella
   sbagliata è una porta in faccia a chi non ha alternative. */
function budgetAvviso(cent,giorni){
  const g=budgetPerGiorno(cent,giorni);
  if(!cent)return null;
  if(g>=BUDGET_MIN_GIORNO)return null;
  return {stretto:true,
    t:"Con questa cifra si mangia, ma la varietà sarà poca: punterò su legumi, uova e verdura di stagione. Dimmi pure se preferisci altro."};}
window.budgetAvviso=budgetAvviso;

function promptBudget(cent,giorni){
  const g=Math.max(1,+giorni||7);
  const euro=((+cent||0)/100).toFixed(2).replace(".",",");
  const D=dispensa();
  const gia=D.roba.length?dispensaPriorita().map(x=>x.nome).join(", "):"";
  const t=(typeof wizTargets==="function")?wizTargets():null;
  return "Prepara la spesa per "+g+" giorni con un budget di "+euro+" euro in tutto.\n"+
    (gia?"In casa c'è già: "+gia+". Non ricomprarlo.\n":"")+
    (t&&t.kcal?"Fabbisogno indicativo: "+Math.round(t.kcal)+" kcal al giorno.\n":"")+
    "REGOLE NON NEGOZIABILI:\n"+
    "- Il budget è un tetto, non un obiettivo: non fare a gara a spendere meno.\n"+
    "- Usa prezzi realistici di supermercato italiano e dichiara che sono stime.\n"+
    "- Se la cifra non basta per mangiare in modo decente, DILLO con calma e proponi il meglio possibile: non rifiutarti di rispondere.\n"+
    "- Nessun commento sulla cifra e nessun giudizio su chi la spende.\n"+
    "- Preferisci ingredienti che si usano in più piatti: meno sprechi e meno spesa.\n"+
    "Rispondi SOLO con JSON: {\"spesa\":[{\"cat\":\"\",\"voce\":\"\",\"qta\":\"\",\"cent\":0}],"+
    "\"totaleCent\":0,\"copre\":0,\"nota\":\"\"}";}
window.promptBudget=promptBudget;

function budgetValido(risposta,tettoCent){
  let j=risposta;
  if(typeof j==="string"){try{j=JSON.parse(j);}catch(e){return null;}}
  if(!j||!Array.isArray(j.spesa))return null;
  const voci=j.spesa.map(v=>({
    cat:DISP_CAT.includes(v&&v.cat)?v.cat:"Altro",
    voce:String((v&&v.voce)||"").slice(0,80),
    qta:String((v&&v.qta)||"").slice(0,40),
    cent:Math.max(0,Math.round(+(v&&v.cent)||0))})).filter(v=>v.voce);
  /* Il totale si RICALCOLA: se il modello ha sbagliato la somma, la
     persona se ne accorgerebbe alla cassa — che è il posto peggiore. */
  const totale=voci.reduce((a,v)=>a+v.cent,0);
  return {spesa:voci,totaleCent:totale,
    copre:Math.max(0,Math.min(60,+j.copre||0)),
    nota:String(j.nota||"").slice(0,300),
    sfora:!!(tettoCent&&totale>tettoCent),
    scarto:tettoCent?totale-tettoCent:0};}
window.budgetValido=budgetValido;

/* ── La pagina ──────────────────────────────────────────────────
   Sta dentro Spesa e non altrove: è lì che la persona arriva quando
   pensa al cibo che deve ancora comprare o cucinare. Una voce di menù
   in più per due funzioni sarebbe stata più facile da scrivere e più
   difficile da trovare. */
/* I pulsanti di queste due card sono a contorno e non pieni. Non è un
   declassamento: stanno in CIMA alla pagina, e sullo schermo di un
   telefono la posizione conta più del riempimento. La primaria della
   Spesa resta una sola, che è la regola — e una pagina con tre pulsanti
   che gridano non ne ha nessuno che si sente. */
function dispensaHTML(){
  const D=dispensa();
  const g=cancello("ricette");
  const roba=dispensaPriorita();

  if(!roba.length){
    return `<div class="card" data-dispensa="vuota"><h2>${esc(tr("Cosa hai in casa"))}</h2>
      ${masc("cerca",92)}
      <div class="hint">${esc(tr("Fotografa il frigo o la dispensa: ti dico cosa puoi cucinare stasera con quello che c'è già."))}</div>
      ${g.ok
        ? `<button class="btn ghost" type="button" onclick="dispensaFoto()">${esc(tr("Fotografa la dispensa"))}</button>
           <div class="mtools"><button class="btn ghost small" type="button" onclick="dispensaMano()">${esc(tr("Scrivo io cosa c'è"))}</button></div>`
        : `<button class="btn ghost" type="button" onclick="dispensaMano()">${esc(tr("Scrivo io cosa c'è"))}</button>
           ${cancelloHTML("ricette")}`}
    </div>`;}

  const pill=(x)=>`<button class="chip${x.scade==="presto"?" pri":""}" type="button"
    onclick="dispensaTogli('${esc(x.nome)}')" aria-label="${esc(tr("Togli {n}",{n:x.nome}))}">${esc(x.nome)}${
    x.qta?` <span class="chip-q">${esc(x.qta)}</span>`:""}</button>`;

  const P=D.propostePiatti||[];
  return `<div class="card" data-dispensa="piena"><h2>${esc(tr("Cosa hai in casa"))}</h2>
    <div class="chips">${roba.map(pill).join("")}</div>
    ${roba.some(x=>x.scade==="presto")
      ? `<div class="hint" style="margin-top:12px">${esc(tr("Metto per primi i piatti che usano quello che scade prima."))}</div>`:""}
    ${g.ok?`<button class="btn ghost" type="button" onclick="dispensaPiatti()">${esc(tr("Cosa posso cucinare"))}</button>`:cancelloHTML("ricette")}
    <div class="mtools">
      <button class="btn ghost small" type="button" onclick="dispensaMano()">${esc(tr("Aggiungi"))}</button>
      <button class="btn ghost small" type="button" onclick="dispensaSvuota()">${esc(tr("Svuota"))}</button>
    </div>
    <div class="aibox" id="dispOut" aria-live="polite" style="display:none"></div>
  </div>
  ${P.length?`<div class="card" data-piatti="${P.length}"><h2>${esc(tr("Stasera puoi fare"))}</h2>
    ${P.map((p,i)=>`<div class="lg" data-piatto="${i}">
      <b>${esc(p.nome)}</b>${p.minuti?` · ${esc(tr("{n} min",{n:p.minuti}))}`:""}
      <div class="hint">${esc(p.come)}</div>
      ${p.manca.length?`<div class="hint">${esc(tr("Ti manca solo: {x}",{x:p.manca.join(", ")}))}</div>`:""}
      <button class="btn ghost small" type="button" onclick="piattoInDiario(${i})">${esc(tr("Metti nel diario"))}</button>
    </div>`).join("")}</div>`:""}`;}
window.dispensaHTML=dispensaHTML;

window.dispensaMano=async()=>{
  const t=await dlgPrompt(tr("Cosa c'è in casa? Scrivi come viene, separando con la virgola."),"");
  if(!t)return;
  const voci=String(t).split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean)
    .map(x=>({nome:x,certezza:"alta"}));
  dispensaAggiungi(voci);
  try{render(cur);}catch(e){}};

window.dispensaPiatti=async()=>{
  const box=document.getElementById("dispOut");
  if(box){box.style.display="block";box.textContent=tr("Guardo cosa si può fare…");}
  try{
    /* Non è IL piano: sono tre proposte da quello che c'è in
       dispensa. Dichiarava "piano" e prendeva il livello del piano
       settimanale — trovato il 25/08 mettendo in tabella i pilastri.
       Il pilastro giusto è il suo, e prende PENSIERO_RESTO. */
    const r=await aiAsk(promptPiatti(3),"dispensa");
    const v=piattiValidi(r);
    if(!v.piatti.length){
      if(box)box.textContent=tr("Con questi ingredienti non me ne viene uno sensato. Aggiungine qualcuno e riprovo.");
      return;}
    dispensa().propostePiatti=v.piatti;save();
    if(box)box.style.display="none";
    try{render(cur);}catch(e){}
  }catch(e){
    if(box)box.textContent=aiFail(e);}};

/* Il piatto scelto entra fra gli extra di oggi, come un pasto libero:
   non tocca il piano della settimana, che è un modello. */
window.piattoInDiario=(i)=>{
  const p=(dispensa().propostePiatti||[])[i];
  if(!p)return;
  /* viewIdx(), non «oggi»: se la persona sta guardando ieri per
     sistemare una cena, il piatto deve finire lì. È lo stesso indice
     che usa tutto il resto dell'app. */
  const d=viewIdx();
  if(d<0)return dlgAlert(tr("Apri il giorno in cui vuoi metterlo."));
  const day=S.week.days[d];
  if(!day)return;
  day.extras=day.extras||[];
  day.extras.push({d:p.nome,k:p.k,p:p.p,c:p.c,f:p.f,src:"dispensa"});
  save();
  try{toast(tr("Messo nel diario."));}catch(e){}
  try{render(cur);}catch(e){}};

/* ── Il budget ──────────────────────────────────────────────────── */
function budgetHTML(){
  const D=dispensa();
  const g=cancello("ricette");
  const av=budgetAvviso(D.budget,7);
  return `<div class="card" data-budget="${D.budget||0}"><h2>${esc(tr("La spesa con un budget"))}</h2>
    <div class="hint">${esc(tr("Dimmi quanto vuoi spendere e ti preparo la lista: uso quello che hai già in casa e resto dentro la cifra."))}</div>
    <label>${esc(tr("Per la settimana ho"))}</label>
    <input type="number" id="budgetEuro" inputmode="decimal" min="0" step="1"
      value="${D.budget?(D.budget/100).toFixed(0):""}" placeholder="45">
    ${av?`<div class="hint" style="margin-top:12px">${esc(tr(av.t))}</div>`:""}
    ${g.ok?`<button class="btn ghost" type="button" onclick="budgetFai()">${esc(tr("Preparami la lista"))}</button>`:cancelloHTML("ricette")}
    <div class="aibox" id="budgetOut" aria-live="polite" style="display:none"></div>
  </div>`;}
window.budgetHTML=budgetHTML;

window.budgetFai=async()=>{
  const el=document.getElementById("budgetEuro"),box=document.getElementById("budgetOut");
  const cent=Math.round((parseFloat(String(el&&el.value||"").replace(",","."))||0)*100);
  if(!cent)return dlgAlert(tr("Dimmi quanto vuoi spendere e ci penso io."));
  dispensa().budget=cent;save();
  if(box){box.style.display="block";box.textContent=tr("Preparo la lista…");}
  try{
    /* Stesso caso: è la lista della spesa dentro un budget, non il
       piano settimanale. */
    const r=await aiAsk(promptBudget(cent,7),"budget");
    const v=budgetValido(r,cent);
    if(!v)return void(box&&(box.textContent=tr("Non mi è tornata una lista leggibile. Riprovo volentieri.")));
    const euro=(c)=>(c/100).toFixed(2).replace(".",",")+" €";
    box.innerHTML=`<div><b>${esc(euro(v.totaleCent))}</b> ${esc(tr("in tutto"))}${
      v.copre?" · "+esc(tr("copre {n} giorni",{n:v.copre})):""}</div>`+
      (v.sfora?`<div class="hint">${esc(tr("Sono {x} sopra quello che avevi detto: togli l'ultima voce se preferisci restare dentro.",{x:euro(v.scarto)}))}</div>`:"")+
      `<div class="lgrid" style="margin-top:12px">${v.spesa.map(x=>
        `<div class="lg" data-voce="${esc(x.cat)}">${esc(x.voce)}${x.qta?" · "+esc(x.qta):""}
          <span class="chip-q">${esc(euro(x.cent))}</span></div>`).join("")}</div>`+
      (v.nota?`<div class="hint" style="margin-top:12px">${esc(v.nota)}</div>`:"")+
      `<div class="hint" style="margin-top:8px">${esc(tr("I prezzi sono stime di supermercato: alla cassa può cambiare qualcosa."))}</div>`;
  }catch(e){if(box)box.textContent=aiFail(e);}};

window.dispensaFoto=()=>{
  /* Passa dallo stesso percorso della foto-pasto: una sola strada per
     le immagini significa un solo posto dove sbagliare. */
  if(typeof fotoScatta==="function")return fotoScatta("dispensa");
  dispensaMano();};

window.dispensaFrasi=function(){return DISP_CAT;};
