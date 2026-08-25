/* ═══════════════════════════════════════════════════════════════
   41. LA CUCINA GUIDATA — l'omino e la pentola
   ═══════════════════════════════════════════════════════════════
   Due bottoni sulla card del pasto, e una promessa: che nessuno
   debba più tradurre da solo «120 g di riso» in «siamo in quattro,
   quanto ne butto?».

   L'OMINO chiede per quante persone si cucina. Il numero resta per
   TUTTA LA GIORNATA — chi apparecchia per quattro a pranzo quasi
   sempre lo fa anche a cena — ma è legato al giorno, non allo
   stato generale: domani si riparte da capo senza dover disdire
   niente.

   LA PENTOLA fa parlare l'AI: legge il piatto, lo scala su quel
   numero di persone e lo spiega passo per passo. Non una ricetta
   generica presa da internet: QUESTO piatto, con le TUE grammature
   moltiplicate, nell'ordine giusto perché le cose finiscano di
   cuocere insieme.

   Il doppio passaggio esiste una volta sola: se tocchi la pentola
   senza aver mai detto per quanti cucini, te lo chiede lei e poi
   procede. Mai due domande per una risposta.

   La porzione TUA resta quella del piano: si moltiplica la spesa,
   non il tuo piatto. È una differenza che vale l'intero prodotto.  */

const CUCINA_KEY="nuvia_cucina_commensali";

/* ── quante persone, oggi ─────────────────────────────────────── */
function commensaliOggi(){
  try{
    const g=JSON.parse(localStorage.getItem(CUCINA_KEY)||"null");
    if(g&&g.d===iso(new Date()))return g;
  }catch(e){}
  return null;}

function commensaliSalva(adulti,bimbi){
  try{localStorage.setItem(CUCINA_KEY,JSON.stringify(
    {d:iso(new Date()),a:+adulti||1,b:+bimbi||0}));}catch(e){}}

/* I bambini mangiano meno: mezza porzione è la convenzione più
   onesta che si possa fare senza chiedere l'età di ciascuno. */
function porzioniTotali(c){return (c?c.a:1)+(c?c.b:0)*0.5;}

function commensaliTesto(c){
  if(!c)return tr("Per quante persone cucini?");
  const p=[];
  p.push(c.a===1?tr("1 adulto"):tr("{n} adulti",{n:c.a}));
  if(c.b)p.push(c.b===1?tr("1 bambino"):tr("{n} bambini",{n:c.b}));
  return p.join(" · ");}

window.commensali=(pdi,mi,poi)=>{
  try{usoSegna("commensali");}catch(e){}
  const c=commensaliOggi()||{a:1,b:0};
  sheetShow(tr("Chi mangia oggi"),
   `<div class="hint">${esc(tr("Vale per tutta la giornata: la spesa e le dosi si moltiplicano, la TUA porzione resta quella del piano."))}</div>
    <label>${esc(tr("Adulti"))}</label>
    <div class="mopts" id="cucAd">${[1,2,3,4,5,6].map(n=>
      `<button type="button" class="${n===c.a?"on":""}" onclick="cucSetA(${n})">${n}</button>`).join("")}</div>
    <label style="margin-top:12px">${esc(tr("Bambini"))}</label>
    <div class="mopts" id="cucBi">${[0,1,2,3,4].map(n=>
      `<button type="button" class="${n===c.b?"on":""}" onclick="cucSetB(${n})">${n}</button>`).join("")}</div>
    <div class="hint" style="margin-top:12px">${esc(tr("Un bambino conta come mezza porzione: è una stima onesta, correggila pure cucinando."))}</div>
    <div class="btngrid2" style="margin-top:16px">
      <button class="btn" onclick="cucConferma(${pdi},${mi},${poi?1:0})">${esc(tr("Va bene"))}</button>
      <button class="btn ghost" onclick="sheetClose()">${esc(tr("Annulla"))}</button>
    </div>`);
  CUC_TMP={a:c.a,b:c.b};};

let CUC_TMP={a:1,b:0};
window.cucSetA=(n)=>{CUC_TMP.a=n;cucSegna("cucAd",n,1);};
window.cucSetB=(n)=>{CUC_TMP.b=n;cucSegna("cucBi",n,0);};
function cucSegna(id,n,base){
  const box=document.getElementById(id);if(!box)return;
  [...box.children].forEach((b,i)=>b.classList.toggle("on",i+base===n));}

window.cucConferma=(pdi,mi,proseguire)=>{
  commensaliSalva(CUC_TMP.a,CUC_TMP.b);
  sheetClose();
  toast(tr("Oggi si cucina per {q}",{q:commensaliTesto(commensaliOggi())}));
  if(proseguire)setTimeout(()=>comeCucino(pdi,mi),260);
  else render(cur);};

/* ── la pentola: l'AI spiega QUESTO piatto, per QUELLE persone ── */
window.comeCucino=async(pdi,mi)=>{
  try{usoSegna("cucina");}catch(e){}
  const c=commensaliOggi();
  /* mai due domande per una risposta: se non sa per quanti, lo chiede
     e poi prosegue da solo verso la ricetta. */
  if(!c)return commensali(pdi,mi,true);
  if(!aiOn())return aiFail(new Error("nokey"));

  const o=mealOpt(pdi,mi);
  const piatto=(o&&o.d)||"";
  if(!piatto)return toast(tr("Questo pasto non ha ancora un piatto da cucinare."));

  const q=porzioniTotali(c);
  sheetShow(tr("Come si cucina"),
    `<div class="hint">${esc(piatto)}</div>
     <div class="cucattesa">${esc(tr("Sto scalando le dosi e mettendo in ordine i passaggi…"))}</div>`);

  try{
    const t=await aiAsk(
      'Spiega come cucinare questo piatto: "'+piatto+'". '+
      'Le grammature indicate sono UNA porzione: moltiplicale per '+q+' '+
      '(sono '+c.a+' adulti'+(c.b?' e '+c.b+' bambini, contati mezza porzione ciascuno':'')+'). '+
      'Ordina i passaggi in modo che le cose finiscano di cuocere insieme, '+
      'indica tempi realistici e la pentola o teglia adatta a questa quantità. '+
      'Niente ingredienti nuovi oltre a sale, olio, acqua e spezie comuni. '+
      'Tono pratico e gentile, mai giudicante, come un amico che cucina con te. '+
      dietStr()+
      ' Rispondi SOLO JSON: {"dosi":["ingrediente e quantità totale",...],'+
      '"passi":[{"t":"titolo breve","d":"cosa fare","min":numero_minuti_o_0},...],'+
      '"nota":"una riga di consiglio o avvertenza"}',"cucina");
    const j=parseAIJSON(t);
    const passi=(j&&j.passi)||[];
    if(!passi.length)throw new Error("vuoto");

    const tot=passi.reduce((a,p)=>a+(+p.min||0),0);
    sheetShow(tr("Come si cucina"),
     `<div class="cuctesta">
        <div class="cucpiatto">${esc(piatto)}</div>
        <div class="cucmeta">${esc(commensaliTesto(c))}${tot?" · "+esc(tr("circa {m} minuti",{m:tot})):""}</div>
      </div>
      ${((j.dosi||[]).length)?`<div class="cucsez">${esc(tr("Quanto ne serve in tutto"))}</div>
        <ul class="cucdosi">${j.dosi.map(d=>`<li>${esc(String(d))}</li>`).join("")}</ul>`:""}
      <div class="cucsez">${esc(tr("Passo per passo"))}</div>
      <ol class="cucpassi">${passi.map((p,i)=>
        `<li><b>${esc(p.t||tr("Passo {n}",{n:i+1}))}</b>${(+p.min)?`<span class="cucmin">${esc(tr("{m} min",{m:+p.min}))}</span>`:""}
          <div>${esc(p.d||"")}</div></li>`).join("")}</ol>
      ${j.nota?`<div class="cucnota">${esc(String(j.nota))}</div>`:""}
      <div class="hint" style="margin-top:12px">${esc(tr("La tua porzione resta quella del piano: qui sono moltiplicate solo le quantità da cucinare."))}</div>
      <button class="btn ghost" style="margin-top:12px" onclick="sheetClose()">${esc(tr("Ho finito"))}</button>`);
  }catch(e){
    sheetClose();
    aiFail(e);}};

window.commensaliOggi=commensaliOggi;
window.porzioniTotali=porzioniTotali;
window.commensaliTesto=commensaliTesto;
