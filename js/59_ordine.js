/* ═══════════════════════════════════════════════════════════════
   59. IL TUO ORDINE
   ═══════════════════════════════════════════════════════════════
   Il passo 4 del piano UX diceva: «in cima quello che si usa di
   più». Il contatore (57_uso) misura cosa si usa, ma la misura da
   sola non decide: due persone usano l'app in modi diversi, e chi
   fa i turni di notte non ha le stesse priorità di chi cucina per
   quattro.

   Quindi non un ordine deciso da noi sui dati aggregati: UN ORDINE
   TUO. Nella pagina lo sposti, e resta.

   LE REGOLE:
   1. IL SUGGERIMENTO ARRIVA DAI TUOI DATI, non dalle nostre idee.
      Se una card sta in fondo e la tocchi ogni giorno, l'app te lo
      dice UNA volta e propone di alzarla. Poi tace.
   2. SI SPOSTA CON DUE BOTTONI, non trascinando. Il trascinamento
      su schermo piccolo, dentro una pagina che scorre, è il gesto
      che fallisce più spesso — e quando fallisce sposta la cosa
      sbagliata.
   3. NIENTE SI PUÒ NASCONDERE DEL TUTTO. Si sposta in fondo, non
      si cancella: un'app in cui puoi far sparire una funzione è
      un'app in cui un giorno non trovi più una cosa e pensi che
      sia rotta.
   4. SI TORNA INDIETRO IN UN TOCCO. «Rimetti l'ordine di prima»
      esiste sempre, perché sistemare le cose deve poter essere
      reversibile o non lo prova nessuno.                          */

const ORDINE_KEY="nuvia_ordine";

/* Le card che si possono spostare, con il loro nome leggibile.
   Non tutte: la card del pasto sta in cima e basta — è la ragione
   per cui si apre l'app, e lasciarla spostare è come lasciar
   togliere il volante. */
const CARD_MOBILI=[
  {k:"acqua",   t:"I bicchieri"},
  {k:"corpo",   t:"Il tuo corpo"},
  {k:"sonno",   t:"Sonno e umore"},
  {k:"giornata",t:"La giornata"},
  {k:"spinta",  t:"La spinta del giorno"},
  {k:"film",    t:"Il film del mese"},
  {k:"turno",   t:"Il turno di oggi"}
];
window.CARD_MOBILI=CARD_MOBILI;

function ordineNome(k){
  return k==="acqua"   ?tr("I bicchieri")
       :k==="corpo"    ?tr("Il tuo corpo")
       :k==="sonno"    ?tr("Sonno e umore")
       :k==="giornata" ?tr("La giornata")
       :k==="spinta"   ?tr("La spinta del giorno")
       :k==="film"     ?tr("Il film del mese")
       :k==="turno"    ?tr("Il turno di oggi")
       :k;}
window.ordineNome=ordineNome;

/* ── l'ordine scelto ─────────────────────────────────────────── */
function ordineMio(){
  try{
    const l=JSON.parse(localStorage.getItem(ORDINE_KEY)||"null");
    if(Array.isArray(l)&&l.length){
      /* le card nuove (aggiunte da noi dopo) vanno in fondo, non
         sparite: chi ha ordinato una volta non deve perdere quello
         che arriva dopo */
      const mancanti=CARD_MOBILI.map(c=>c.k).filter(k=>l.indexOf(k)<0);
      return l.filter(k=>CARD_MOBILI.some(c=>c.k===k)).concat(mancanti);}
  }catch(e){}
  return CARD_MOBILI.map(c=>c.k);}
window.ordineMio=ordineMio;

function ordineSalva(l){
  try{localStorage.setItem(ORDINE_KEY,JSON.stringify(l));}catch(e){}}

window.ordineSposta=(k,verso)=>{
  const l=ordineMio();
  const i=l.indexOf(k);
  const j=i+(verso<0?-1:1);
  if(i<0||j<0||j>=l.length)return;
  l[i]=l[j];l[j]=k;
  ordineSalva(l);
  try{usoSegna("ordine");}catch(e){}
  render(cur);};

window.ordineRipristina=()=>{
  try{localStorage.removeItem(ORDINE_KEY);}catch(e){}
  toast(tr("Ordine di prima rimesso."));
  render(cur);};

/* ── il montaggio: si passano i pezzi e tornano nell'ordine tuo ── */
/* Chi disegna la pagina non deve sapere niente dell'ordine: passa un
   oggetto {chiave: html} e riceve la stringa già montata. */
window.ordineMonta=(pezzi)=>{
  const l=ordineMio();
  let h="";
  l.forEach(k=>{if(pezzi[k])h+=pezzi[k];});
  /* quello che non è fra le card mobili esce comunque, in coda:
     mai perdere un pezzo perché non era nell'elenco */
  Object.keys(pezzi).forEach(k=>{if(l.indexOf(k)<0&&pezzi[k])h+=pezzi[k];});
  return h;};

/* ── IL SUGGERIMENTO, dai dati veri ──────────────────────────── */
/* Se una card sta nella metà bassa e i suoi gesti sono fra i tre più
   frequenti, l'app lo dice UNA volta. Non riordina da sola: proporre
   è aiutare, decidere al posto tuo è un'altra cosa. */
const ORDINE_GESTI={acqua:["acqua","bevanda"],sonno:["scala"],
  film:["film"],turno:["turno"],corpo:["pesata"]};

window.ordineSuggerimento=()=>{
  if(typeof usoClassifica!=="function")return null;
  let detti=[];
  try{detti=JSON.parse(localStorage.getItem(ORDINE_KEY+"_detti")||"[]");}catch(e){}
  const c=usoClassifica(6);
  if(!c.righe.length||c.totale<25)return null;   /* troppo presto per dire qualcosa */
  const top=c.righe.slice(0,3).map(r=>r.gesto);
  const l=ordineMio();
  const meta=Math.ceil(l.length/2);
  for(let i=meta;i<l.length;i++){
    const k=l[i];
    if(detti.indexOf(k)>=0)continue;
    const gesti=ORDINE_GESTI[k]||[];
    if(gesti.some(g=>top.indexOf(g)>=0))
      return {k,nome:ordineNome(k),
        riga:tr("«{n}» è in fondo, ma la usi spesso. La alziamo?",{n:ordineNome(k)})};}
  return null;};

window.ordineAccetta=(k)=>{
  const l=ordineMio();
  const i=l.indexOf(k);
  if(i>0){l.splice(i,1);l.unshift(k);ordineSalva(l);}
  ordineNoGrazie(k);
  render(cur);};

window.ordineNoGrazie=(k)=>{
  let detti=[];
  try{detti=JSON.parse(localStorage.getItem(ORDINE_KEY+"_detti")||"[]");}catch(e){}
  if(detti.indexOf(k)<0)detti.push(k);
  try{localStorage.setItem(ORDINE_KEY+"_detti",JSON.stringify(detti));}catch(e){}
  render(cur);};

/* ── la pagina dove si sistema ───────────────────────────────── */
window.ordineHTML=()=>{
  const l=ordineMio();
  const sug=ordineSuggerimento();
  let h=`<div class="card"><h2>${tr("L'ordine della tua pagina")}</h2>
    ${hint2(tr("Sposta le schede dove le vuoi."),
      tr("Vale per il Punto, la schermata che apri più spesso. Niente sparisce: quello che sposti in fondo resta in fondo, non se ne va."))}`;
  if(sug)h+=`<div class="ordsug">
    <div>${esc(sug.riga)}</div>
    <div class="riga">
      <button class="chipbtn on" onclick="ordineAccetta('${esc(sug.k)}')">${esc(tr("Alzala"))}</button>
      <button class="chipbtn" onclick="ordineNoGrazie('${esc(sug.k)}')">${esc(tr("Va bene così"))}</button>
    </div></div>`;
  h+=`<div class="ordlista">${l.map((k,i)=>`
    <div class="ordriga">
      <span>${esc(ordineNome(k))}</span>
      <button class="ibtn" ${i===0?"disabled":""} aria-label="${esc(tr("Su"))}"
        onclick="ordineSposta('${esc(k)}',-1)">${ic("su",16)}</button>
      <button class="ibtn" ${i===l.length-1?"disabled":""} aria-label="${esc(tr("Giù"))}"
        onclick="ordineSposta('${esc(k)}',1)">${ic("giu",16)}</button>
    </div>`).join("")}</div>
    <div class="mtools"><button class="btn ghost small" onclick="ordineRipristina()">${esc(tr("Rimetti l'ordine di prima"))}</button></div>
    </div>`;
  return h;};
