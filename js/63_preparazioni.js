/* ═══════════════════════════════════════════════════════════════
   63. LE TUE PREPARAZIONI
   ═══════════════════════════════════════════════════════════════
   CORREZIONE DI UN PRINCIPIO SBAGLIATO (19 agosto 2026).

   Fino a ieri l'app «imparava dalle correzioni»: se abbassavi le
   calorie di un piatto, quella diventava la verità per sempre. Era
   un errore, e il founder l'ha visto prima di me.

   Il motivo è semplice: NESSUNO SA CONTARE LE CALORIE DI UN PIATTO
   A OCCHIO. Una carbonara è una carbonara; se una persona corregge
   da 700 a 450 kcal non ha misurato niente — ha espresso un
   desiderio, o ha confrontato con un numero letto da qualche parte.
   E un'app che prende quel numero per buono, e poi lo riusa ogni
   domenica, sta costruendo un bilancio falso su richiesta di chi
   lo subirà.

   ── COSA SI FA INVECE ──────────────────────────────────────────
   Non si corregge il RISULTATO: si descrive la COMPOSIZIONE.
     «carbonara con 80 g di pasta, un tuorlo, 20 g di pecorino e
      50 g di pancetta scolata»
   Questo la persona lo sa, perché l'ha cucinata lei. E da lì il
   conto lo fa chi sa farlo.

   ── LE PREPARAZIONI DI CASA ────────────────────────────────────
   Alcune cose si rifanno sempre uguali: la maionese, il ragù, il
   pane. Si descrivono UNA volta, con gli ingredienti, e diventano
   un pezzo riusabile: «hamburger con la mia maionese». L'AI sa
   cosa c'è dentro perché gliel'hai detto tu, e sa quanta se ne
   mette in un hamburger perché quello è il suo mestiere.

   LA DIFFERENZA CHE CONTA: qui la persona porta quello che SA
   (cosa ha messo nel piatto), non quello che non può sapere
   (quante calorie ne escono).                                     */

const PREP_KEY="nuvia_preparazioni";
const PREP_MAX=40;

function preparazioni(){
  try{
    const l=JSON.parse(localStorage.getItem(PREP_KEY)||"null");
    if(Array.isArray(l))return l;
  }catch(e){}
  return [];}
window.preparazioni=preparazioni;

function prepSalvaTutte(l){
  try{localStorage.setItem(PREP_KEY,JSON.stringify(l.slice(0,PREP_MAX)));}catch(e){}}

/* Il nome si scrive come lo si direbbe: «la mia maionese». La chiave
   toglie articoli e accenti, così «mia maionese» e «la mia maionese»
   sono la stessa cosa. */
function prepChiave(nome){
  return String(nome||"").toLowerCase()
    .replace(/[àá]/g,"a").replace(/[èé]/g,"e").replace(/[ìí]/g,"i")
    .replace(/[òó]/g,"o").replace(/[ùú]/g,"u")
    .replace(/\b(la|il|lo|le|i|gli|mia|mio|miei|mie|di|del|della)\b/g," ")
    .replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim();}
window.prepChiave=prepChiave;

/* ── salvare una preparazione ─────────────────────────────────── */
/* Si salvano gli INGREDIENTI, non le calorie. Se arrivano dei valori
   (calcolati dall'AI dopo la descrizione) si tengono come promemoria,
   ma la verità resta la descrizione: se un giorno miglioriamo il
   calcolo, si ricalcola da lì. */
window.prepSalva=(nome,ingredienti,valori)=>{
  const k=prepChiave(nome);
  const ing=String(ingredienti||"").trim().slice(0,400);
  if(!k||ing.length<8)return {ok:false,perche:"corta"};
  const l=preparazioni();
  const voce={k,nome:String(nome).trim().slice(0,50),ing,
    /* i valori sono DERIVATI, e si dichiara da dove vengono */
    kcal100:valori&&+valori.kcal100>0?Math.round(+valori.kcal100):null,
    fonte:valori?"calcolata":"da calcolare",
    at:Date.now(),usi:0};
  const i=l.findIndex(x=>x.k===k);
  if(i>-1){voce.usi=l[i].usi||0;l[i]=voce;}
  else l.unshift(voce);
  prepSalvaTutte(l);
  try{usoSegna("preparazione");}catch(e){}
  return {ok:true};};

window.prepTrova=(testo)=>{
  const t=prepChiave(testo);
  if(!t)return null;
  return preparazioni().find(p=>t.indexOf(p.k)>=0)||null;};

window.prepUsata=(k)=>{
  const l=preparazioni();
  const p=l.find(x=>x.k===k);
  if(p){p.usi=(p.usi||0)+1;prepSalvaTutte(l);}};

window.prepTogli=(k)=>{
  prepSalvaTutte(preparazioni().filter(x=>x.k!==k));
  render(cur);};

/* ── quello che l'AI riceve ───────────────────────────────────── */
/* Se nella descrizione compare una preparazione di casa, si allega
   la sua ricetta: l'AI non deve indovinare cosa c'è nella «tua
   maionese», e non deve nemmeno indovinare quanta se ne mette —
   quello sì che è il suo mestiere. */
window.prepPerAI=(testo)=>{
  const p=prepTrova(testo);
  if(!p)return "";
  prepUsata(p.k);
  return ' La persona usa una sua preparazione di casa chiamata "'+p.nome+
    '", fatta così: '+p.ing+
    '. Stima tu quanta se ne usa di solito in questo piatto e calcola i valori di conseguenza.';};

/* ── la scheda ────────────────────────────────────────────────── */
window.prepHTML=()=>{
  const l=preparazioni();
  let h=`<div class="card"><h2>${tr("Le tue preparazioni")}</h2>
    ${hint2(tr("Le cose che fai in casa sempre uguali: la maionese, il ragù, il pane."),
      tr("Le descrivi una volta con gli ingredienti, e poi basta nominarle: «hamburger con la mia maionese». Non serve che tu sappia quante calorie fanno — quello lo calcoliamo noi da quello che ci hai detto."))}`;
  if(l.length){
    h+=`<div class="preplista">${l.map(p=>`
      <div class="preprow">
        <div><b>${esc(p.nome)}</b>
          <div class="hint">${esc(p.ing.slice(0,90))}${p.ing.length>90?"…":""}</div></div>
        <button class="ibtn" aria-label="${esc(tr("Togli"))}" onclick="prepTogli('${esc(p.k)}')">${ic("x",15)}</button>
      </div>`).join("")}</div>`;}
  h+=`<div class="mtools"><button class="btn small" onclick="prepNuova()">${esc(tr("+ Aggiungi una preparazione"))}</button></div></div>`;
  return h;};

window.prepNuova=()=>{
  sheetShow(tr("Una cosa che fai in casa"),
    `<label>${tr("Come la chiami")}</label>
     <input type="text" id="prepNome" placeholder="${esc(tr("es. la mia maionese"))}" maxlength="50">
     <label style="margin-top:12px">${tr("Cosa ci metti")}</label>
     <textarea id="prepIng" rows="3" maxlength="400"
       placeholder="${esc(tr("es. 2 uova sode, 10 g di olio di semi, 5 g di aceto, acqua"))}"></textarea>
     <div class="hint" style="margin-top:8px">${esc(tr("Scrivi le quantità che usi davvero. Quante ne finiscono in un piatto lo stimiamo noi."))}</div>
     <div class="mtools"><button class="btn" onclick="prepConferma()">${esc(tr("Salva"))}</button></div>`);};

window.prepConferma=()=>{
  const n=(document.getElementById("prepNome")||{}).value||"";
  const i=(document.getElementById("prepIng")||{}).value||"";
  const r=prepSalva(n,i);
  if(!r.ok)return toast(tr("Scrivi cosa ci metti: bastano gli ingredienti principali."));
  sheetClose();
  toast(tr("Salvata. Ora puoi nominarla nei tuoi piatti."));
  render(cur);};
