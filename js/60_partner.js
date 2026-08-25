/* ═══════════════════════════════════════════════════════════════
   60. LA RETE PARTNER
   ═══════════════════════════════════════════════════════════════
   Il piano dice una cosa che conviene prendere alla lettera:
   «meccanica codice + attribuzione funzionante in app — NON
   VENDERLA PRIMA DI AVERLA». Un partner che firma e poi scopre
   che il tracciamento non c'è non firma una seconda volta, e lo
   racconta agli altri.

   Questo modulo è quella meccanica. Le regole sono quelle del
   piano, e sono scritte qui perché un domani si possano
   collaudare invece che ricordare:

   1. NESSUN BANNER. Un partner appare SOLO come risposta a un
      bisogno che l'app ha già rilevato: se il trainer ha appena
      detto che serve una banda elastica, allora ha senso mostrare
      dove comprarla. Mai una vetrina, mai una schermata di
      offerte, mai una notifica commerciale.
   2. ETICHETTA SEMPRE VISIBILE: «Partner · Nuvia riceve un
      contributo». Su OGNI scheda commerciale, senza eccezioni.
      Le schede non commerciali (onlus, servizi pubblici) non ce
      l'hanno — e non stanno mai accanto a quelle commerciali.
   3. ZERO PERCENTUALE SU PRESTAZIONI SANITARIE. Un nutrizionista
      in mappa paga un canone di presenza, non una quota su quello
      che il paziente spende. Il collaudo lo verifica.
   4. TONO SENZA COLPA anche qui: mai «ti serve un professionista
      perché non ce la fai».
   5. NIENTE ESCE DAL TELEFONO. L'attribuzione è un codice nel
      link, non un profilo: il partner sa che un cliente è
      arrivato da Nuvia, non CHI è né cosa mangia.               */

const PARTNER_KEY="nuvia_partner";

/* I tipi, con la loro natura commerciale dichiarata nel dato: così
   l'etichetta non dipende da chi scrive la scheda ma dal tipo. */
const PARTNER_TIPI={
  attrezzi:   {commerciale:true,  etichetta:true},
  bilance:    {commerciale:true,  etichetta:true},
  palestra:   {commerciale:true,  etichetta:true},
  trainer:    {commerciale:true,  etichetta:true},
  negozio:    {commerciale:true,  etichetta:true},
  farmacia:   {commerciale:true,  etichetta:true},
  /* i sanitari pagano un CANONE di presenza, mai una percentuale:
     una commissione su una prestazione sanitaria è il confine che
     non si passa, e non per prudenza legale — per non avere
     l'interesse a mandare la gente dal professionista sbagliato. */
  nutrizionista:{commerciale:true, etichetta:true, canone:true, mai_percentuale:true},
  medico:      {commerciale:true, etichetta:true, canone:true, mai_percentuale:true},
  /* le non commerciali: nessuna etichetta, nessun contributo, e
     mai nella stessa lista di quelle sopra */
  onlus:      {commerciale:false, etichetta:false},
  pubblico:   {commerciale:false, etichetta:false}
};
window.PARTNER_TIPI=PARTNER_TIPI;

function partnerDati(){
  let d=null;
  try{d=JSON.parse(localStorage.getItem(PARTNER_KEY)||"null");}catch(e){}
  if(!d||typeof d!=="object")d={schede:[],aperte:{},dal:iso(new Date())};
  d.schede=d.schede||[];d.aperte=d.aperte||{};
  return d;}
function partnerSalva(d){
  try{localStorage.setItem(PARTNER_KEY,JSON.stringify(d));}catch(e){}}

/* Le schede arrivano dal backend, come le card di Insieme: l'app non
   ha nessun elenco cucito dentro, così aggiungere un partner non
   richiede una nuova versione. */
window.partnerAggiorna=async()=>{
  try{
    const r=await fetch(contoUrl()+"/partner",{headers:{"Accept":"application/json"}});
    if(!r.ok)return false;
    const j=await r.json();
    if(!Array.isArray(j.schede))return false;
    const d=partnerDati();
    d.schede=j.schede.filter(s=>s&&s.tipo&&PARTNER_TIPI[s.tipo]).slice(0,60);
    d.visto=new Date().toISOString();
    partnerSalva(d);
    return true;
  }catch(e){return false;}};

/* ── il bisogno, non la vetrina ─────────────────────────────────
   Si chiede: «per QUESTO bisogno, c'è qualcuno?». Se non c'è, non
   si mostra niente — e va bene così. Il bisogno arriva da un
   momento vero dell'app: il trainer che nomina un attrezzo, la
   spesa che cerca un negozio, il piano che suggerisce una visita. */
window.partnerPerBisogno=(bisogno,quanti)=>{
  const d=partnerDati();
  const b=String(bisogno||"").toLowerCase();
  if(!b)return [];
  const buone=d.schede.filter(s=>{
    const tag=(s.bisogni||[]).map(x=>String(x).toLowerCase());
    return tag.indexOf(b)>=0;});
  /* mai più di due per volta: tre diventano una vetrina */
  return buone.slice(0,Math.min(quanti||2,2));};

/* ── la scheda ──────────────────────────────────────────────────
   L'etichetta non è un'opzione della scheda: la decide il TIPO. Chi
   scrive una scheda non può dimenticarsela né toglierla. */
window.partnerScheda=(s)=>{
  if(!s||!PARTNER_TIPI[s.tipo])return "";
  const T=PARTNER_TIPI[s.tipo];
  return `<div class="pcard${T.commerciale?"":" pnc"}">
    <div class="pnome">${esc(s.nome||"")}</div>
    ${s.riga?`<div class="hint">${esc(s.riga)}</div>`:""}
    ${T.etichetta?`<div class="petichetta">${esc(tr("Partner · Nuvia riceve un contributo"))}</div>`:""}
    <div class="mtools"><button class="chipbtn" onclick="partnerApri('${esc(s.id||"")}')">${esc(s.azione||tr("Vai"))}</button></div>
  </div>`;};

/* ── l'attribuzione ─────────────────────────────────────────────
   Un codice nel link, e basta. Il partner sa che un cliente arriva
   da Nuvia; non sa chi è, non sa cosa mangia, non riceve nessun
   dato. Il conteggio resta sul telefono e serve solo a NOI per
   sapere se una scheda è utile o è rumore da togliere. */
window.partnerApri=(id)=>{
  const d=partnerDati();
  const s=d.schede.find(x=>x.id===id);
  if(!s||!s.url)return;
  d.aperte[id]=(d.aperte[id]||0)+1;
  partnerSalva(d);
  try{usoSegna("partner");}catch(e){}
  /* il codice di attribuzione è il nostro, uguale per tutti: se
     fosse per persona diventerebbe un identificatore, e un
     identificatore che gira su un sito altrui è tracciamento. */
  const sep=s.url.indexOf("?")>=0?"&":"?";
  const url=s.url+sep+"ref=nuvia";
  try{window.open(url,"_blank","noopener");}catch(e){location.href=url;}};

/* Quante volte una scheda è stata aperta: serve a capire cosa
   togliere. Non esce dal telefono se non lo si sceglie. */
window.partnerConti=()=>{
  const d=partnerDati();
  return Object.keys(d.aperte).map(id=>({id,n:d.aperte[id]}))
    .sort((a,b)=>b.n-a.n);};

/* ── il blocco da mettere dentro un momento dell'app ──────────── */
window.partnerBlocco=(bisogno,titolo)=>{
  const l=partnerPerBisogno(bisogno);
  if(!l.length)return "";      /* niente da dire: silenzio, non un vuoto */
  /* le commerciali e le non commerciali non stanno mai insieme */
  const comm=l.filter(s=>PARTNER_TIPI[s.tipo].commerciale);
  const nonc=l.filter(s=>!PARTNER_TIPI[s.tipo].commerciale);
  const gruppo=comm.length?comm:nonc;
  return `<div class="pblocco">
    ${titolo?`<div class="gsec">${esc(titolo)}</div>`:""}
    ${gruppo.map(partnerScheda).join("")}</div>`;};
