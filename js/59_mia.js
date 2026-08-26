/* ═══════════════════════════════════════════════════════════════
   59. LA MIA PAGINA
   ═══════════════════════════════════════════════════════════════
   L'app standard resta com'è: chi la apre trova le stesse schede
   nello stesso ordine, e non deve configurare niente per usarla.
   Ma chi la usa da un mese sa cosa gli serve ogni giorno — e in
   genere sono tre o quattro cose, non venti.

   Qui si compone una pagina propria: si scelgono i pezzi, si
   mettono nell'ordine che si vuole, e diventa la prima cosa che si
   apre. Non è una scorciatoia per l'app: è l'app come la usa
   quella persona.

   LE REGOLE:
   1. SI ATTIVA, NON CAPITA. Chi non la vuole non la vede: la
      pagina esiste solo se qualcuno l'ha composta. Un'app che si
      riorganizza da sola è un'app in cui non si ritrova più niente.
   2. IL CONTATORE PROPONE, LA PERSONA DECIDE. `usoClassifica()` sa
      cosa tocchi di più, e da lì nasce una proposta — con un
      bottone, mai in automatico. Il giorno che l'app sposta le cose
      da sé, la memoria muscolare non serve più a niente.
   3. MASSIMO SEI PEZZI. Non è un limite tecnico: è che una pagina
      con dodici blocchi è la pagina che stavamo cercando di
      evitare. Sei sta in due schermate di pollice.
   4. NIENTE SI DUPLICA. I widget sono le STESSE funzioni delle
      pagine normali, chiamate da qui: se un giorno cambia la card
      dell'acqua, cambia in entrambi i posti. Un widget che è una
      copia diventa una copia vecchia in tre settimane.
   5. SI DISFA IN UN TOCCO. Chi si pente torna allo standard senza
      perdere nulla: la composizione è una preferenza, non un dato. */

const MIA_KEY="nuvia_mia";
const MIA_MAX=6;

/* Il catalogo. Ogni voce dice: come si chiama per una persona, quale
   funzione la disegna, e da quale gesto del contatore si capisce che
   quella persona la userebbe. */
function MIA_CATALOGO(){return [
 {k:"pasto",   t:tr("Il pasto di adesso"),  gesto:"pasto_spunta",
  html:()=>{try{return puntoTesta(viewIdx());}catch(e){return "";}}},
 {k:"acqua",   t:tr("I bicchieri"),         gesto:"acqua",
  html:()=>{try{return `<div class="card">${acquaRiga(viewIdx())}</div>`;}catch(e){return "";}}},
 {k:"peso",    t:tr("Il peso"),             gesto:"pesata",
  html:()=>{try{return pesoHeroHTML();}catch(e){return "";}}},
 {k:"anello",  t:tr("La giornata in un anello"), gesto:"pasto_spunta",
  html:()=>{try{return anelloHTML();}catch(e){return "";}}},
 {k:"spesa",   t:tr("La lista della spesa"), gesto:"spesa_spunta",
  html:()=>{try{return dispensaHTML();}catch(e){return "";}}},
 {k:"sport",   t:tr("L'allenamento di oggi"), gesto:"allenamento",
  html:()=>{try{return abitualiHTML();}catch(e){return "";}}},
 {k:"stai",    t:tr("Come stai"),           gesto:"scala",
  html:()=>{try{
    const di=viewIdx();
    return `<div class="card"><h2>${tr("Come stai")}</h2>
      <div class="duo" style="margin-top:12px">
       <div><label>${tr("Come hai dormito")}</label>${stars(di,"sleep")}</div>
       <div><label>${tr("Come ti senti")}</label>${stars(di,"feel")}</div></div></div>`;
   }catch(e){return "";}}},
 {k:"turno",   t:tr("Il turno di oggi"),    gesto:"scheda",
  html:()=>{try{return turnoHTML();}catch(e){return "";}}},
 {k:"traguardi",t:tr("I traguardi"),        gesto:"pesata",
  html:()=>{try{return traguardiHTML();}catch(e){return "";}}},
 {k:"studio",  t:tr("Dal tuo studio"),      gesto:"scheda",
  html:()=>{try{return studioMsgHTML();}catch(e){return "";}}},
 {k:"gioco",   t:tr("Le sfide"),            gesto:"scheda",
  html:()=>{try{return giocoHTML();}catch(e){return "";}}},
 {k:"budget",  t:tr("Il budget della spesa"), gesto:"spesa_spunta",
  html:()=>{try{return budgetHTML();}catch(e){return "";}}}
];}
window.MIA_CATALOGO=MIA_CATALOGO;

function mia(){
  try{
    const d=JSON.parse(localStorage.getItem(MIA_KEY)||"null");
    if(d&&Array.isArray(d.pezzi))return d;
  }catch(e){}
  return {attiva:false,pezzi:[],prima:false};}
window.mia=mia;

function miaSalva(d){
  try{localStorage.setItem(MIA_KEY,JSON.stringify(d));}catch(e){}}

window.miaAttiva=()=>mia().attiva===true&&mia().pezzi.length>0;

/* ── comporre ─────────────────────────────────────────────────── */
window.miaAggiungi=(k)=>{
  const d=mia();
  if(d.pezzi.includes(k))return;
  if(d.pezzi.length>=MIA_MAX)
    return toast(tr("Sei pezzi bastano: togline uno per farne spazio."));
  d.pezzi.push(k);d.attiva=true;miaSalva(d);
  try{usoSegna("mia_componi");}catch(e){}
  render(cur);};

window.miaTogli=(k)=>{
  const d=mia();
  d.pezzi=d.pezzi.filter(x=>x!==k);
  if(!d.pezzi.length)d.attiva=false;
  miaSalva(d);render(cur);};

window.miaSu=(k)=>{
  const d=mia(),i=d.pezzi.indexOf(k);
  if(i<=0)return;
  d.pezzi.splice(i,1);d.pezzi.splice(i-1,0,k);
  miaSalva(d);render(cur);};

window.miaGiu=(k)=>{
  const d=mia(),i=d.pezzi.indexOf(k);
  if(i<0||i>=d.pezzi.length-1)return;
  d.pezzi.splice(i,1);d.pezzi.splice(i+1,0,k);
  miaSalva(d);render(cur);};

window.miaSpegni=()=>{
  const d=mia();d.attiva=false;d.prima=false;miaSalva(d);
  toast(tr("Torni all'app di sempre. La tua pagina resta composta."));
  render(cur);};

window.miaPrima=(si)=>{
  const d=mia();d.prima=!!si;miaSalva(d);render(cur);};

/* ── LA PROPOSTA ──────────────────────────────────────────────── */
/* Dal contatore dei gesti, in ordine. Non si applica: si propone, e
   si vede cosa propone PRIMA di accettare. Un'app che si riordina da
   sola è un'app in cui la memoria muscolare non serve più. */
window.miaProposta=()=>{
  let cl=null;
  try{cl=usoClassifica(30);}catch(e){}
  if(!cl||!cl.righe.length)return [];
  const cat=MIA_CATALOGO();
  const punti={};
  cl.righe.forEach((r,i)=>{
    cat.forEach(c=>{
      if(c.gesto===r.gesto)punti[c.k]=(punti[c.k]||0)+r.n;});});
  return Object.keys(punti).sort((a,b)=>punti[b]-punti[a]).slice(0,MIA_MAX);};

window.miaApplicaProposta=()=>{
  const p=miaProposta();
  if(!p.length)return toast(tr("Ancora pochi dati: usa l'app qualche giorno e riprova."));
  const d=mia();
  d.pezzi=p;d.attiva=true;miaSalva(d);
  toast(tr("Composta sui tuoi gesti. Puoi cambiarla quando vuoi."));
  render(cur);};

/* ── la pagina ────────────────────────────────────────────────── */
window.renderMia=()=>{
  const el=document.getElementById("pg-mia");
  if(!el)return;
  const d=mia();
  const cat=MIA_CATALOGO();
  let h="";

  if(!d.pezzi.length){
    h+=`<div class="card"><h2>${tr("La tua pagina")}</h2>
      ${hint2(tr("Scegli i pezzi che usi ogni giorno: diventano la tua prima schermata."),
        tr("L'app resta quella di sempre — questa è una pagina in più, e si disfa quando vuoi. Massimo sei pezzi: una pagina con dodici blocchi è quella che stiamo cercando di evitare."))}
      <div class="mtools"><button class="btn" onclick="miaApplicaProposta()">${esc(tr("Componila sui miei gesti"))}</button></div></div>`;
  }else{
    /* i pezzi scelti, nell'ordine scelto */
    d.pezzi.forEach(k=>{
      const c=cat.find(x=>x.k===k);
      if(!c)return;
      const pezzo=c.html()||"";
      if(!pezzo)return;                /* un widget senza dati non occupa spazio */
      h+=pezzo;});
  }

  /* il pannello di composizione, in fondo: si apre quando serve */
  h+=`<div class="card"><h2>${tr("Componi")}</h2>
    <div class="miaelenco">${d.pezzi.map((k,i)=>{
      const c=cat.find(x=>x.k===k);
      return c?`<div class="miariga">
        <span>${esc(c.t)}</span>
        <button class="ibtn" title="${tr("Su")}" onclick="miaSu('${k}')" ${i===0?"disabled":""}>${ic("su",15)}</button>
        <button class="ibtn" title="${tr("Giù")}" onclick="miaGiu('${k}')" ${i===d.pezzi.length-1?"disabled":""}>${ic("giu",15)}</button>
        <button class="ibtn" title="${tr("Togli")}" onclick="miaTogli('${k}')">${ic("x",15)}</button>
      </div>`:"";}).join("")}</div>
    ${d.pezzi.length<MIA_MAX?`<div class="miapiu">${cat.filter(c=>!d.pezzi.includes(c.k)).map(c=>
      `<button class="chipbtn" title="${esc(tr("Aggiungi"))} ${esc(c.t)}" onclick="miaAggiungi('${c.k}')">${ic("plus",14)} ${esc(c.t)}</button>`).join("")}</div>`
      :`<div class="hint">${esc(tr("Sei pezzi: il massimo. Togline uno per aggiungerne un altro."))}</div>`}
    ${d.pezzi.length?`<label class="ck" style="margin-top:12px"><input type="checkbox" ${d.prima?"checked":""}
      onchange="miaPrima(this.checked)"> ${esc(tr("Aprila per prima quando avvio l'app"))}</label>
      <div class="mtools"><button class="btn ghost small" onclick="miaSpegni()">${esc(tr("Torna all'app di sempre"))}</button></div>`:""}
    </div>`;
  el.innerHTML=h;};
