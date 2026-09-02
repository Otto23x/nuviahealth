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
  /* lo psicologo segue la regola dei sanitari, e per una ragione in
     più: chi arriva a quella scheda ci arriva da un momento difficile
     (27/08). Una percentuale su quell'incontro sarebbe indifendibile. */
  psicologo:   {commerciale:true, etichetta:true, canone:true, mai_percentuale:true},
  /* le non commerciali: nessuna etichetta, nessun contributo, e
     mai nella stessa lista di quelle sopra */
  onlus:      {commerciale:false, etichetta:false},
  pubblico:   {commerciale:false, etichetta:false}
};
window.PARTNER_TIPI=PARTNER_TIPI;

/* ── NIENTE PIÙ SEGNI DI CATEGORIA (founder, 27/08) ───────────────
   «I segni di categoria non voglio più vederli: quando caricheremo
   un'attività la caricheremo con il suo logo.»
   I cinque segni a tratto (psicologo, nutrizionista, palestra,
   sportivo, spesa) erano un ripiego per un elenco che non aveva
   ancora immagini. Adesso il logo arriva CON la scheda, quindi il
   ripiego se ne va: cinque disegni nostri accanto a insegne vere
   sarebbero due linguaggi grafici nella stessa lista.
   Una scheda senza logo resta una riga di testo, e va bene: è il
   segnale che quella scheda è incompleta, non qualcosa da mascherare
   con un disegno di categoria. */

/* ── I LOGHI DELLE SCHEDE DI ESEMPIO (founder, 27/08) ──────────────
   «Tieni i loghetti demo per psicologo, nutrizionista, palestra,
   alimentari e negozio articoli sportivi.»
   Sono cinque disegni nei colori del marchio, uno per MESTIERE, e
   mostrano com'è fatto lo spazio quando una scheda ha la sua
   insegna. Le schede vere portano il logo dell'attività, caricato
   insieme alla scheda: non c'è più nessun segno di categoria dietro
   di loro.

   Due regole, per la stessa ragione del segno di categoria:
   · il logo lo decide il TIPO, non la scheda. Chi scrive una scheda
     non può scegliersi un'immagine — se potesse, potrebbe metterci
     l'insegna di qualcun altro;
   · valgono SOLO per le schede di esempio, e sono file NOSTRI dentro
     l'app. Nessuna immagine da un indirizzo esterno: sarebbe una
     richiesta di rete verso un dominio che non controlliamo, e la CSP
     giustamente la fermerebbe.
   L'etichetta «Esempio · non è un'attività reale» resta dov'era: il
   logo non la sostituisce, la accompagna. */
const PARTNER_LOGO={
  psicologo:"assets/partner/psicologo.svg",
  nutrizionista:"assets/partner/nutrizionista.svg",
  palestra:"assets/partner/palestra.svg",
  attrezzi:"assets/partner/sportivo.svg",
  negozio:"assets/partner/alimentari.svg"};
/* ── IL LOGO DI UNA SCHEDA VERA ────────────────────────────────────
   Una scheda vera porta la propria insegna, e l'immagine sta DOVE
   STA LA SCHEDA: sul nostro backend, quello da cui l'elenco arriva.
   Due indirizzi soli sono ammessi, e il controllo è qui perché
   l'elenco arriva dalla rete e la rete si può sbagliare o mentire:
   · un file dell'app (`assets/partner/…`), che sono i cinque esempi;
   · un indirizzo https sul backend delle schede (`contoUrl()`).
   Qualunque altro indirizzo — un dominio altrui, un `javascript:`,
   un pixel di tracciamento travestito da logo — viene buttato via e
   la scheda resta senza immagine. Non è prudenza teorica: un'immagine
   caricata da un dominio terzo racconta a quel dominio che questa
   persona ha aperto questa scheda, e noi non facciamo passare niente
   di nostro a nessuno. La CSP dice la stessa cosa a livello di
   browser (`img-src`), ma una regola sola non basta mai. */
function partnerLogoOk(u){
  const t=String(u||"").trim();
  if(!t)return "";
  if(/^assets\/partner\/[a-z0-9_-]+\.svg$/i.test(t))return t;
  try{
    const base=(typeof contoUrl==="function")?contoUrl():"";
    if(!base)return "";
    const b=new URL(base),x=new URL(t,b);
    if(x.protocol==="https:"&&x.host===b.host)return x.href;
  }catch(e){}
  return "";}
window.partnerLogoOk=partnerLogoOk;
window.partnerLogo=(s)=>{
  if(!s)return "";
  /* gli esempi hanno il loro logo per MESTIERE: chi scrive una scheda
     di esempio non se lo sceglie (sono schede nostre, ma la regola
     vale lo stesso — è quella che impedisce di metterci l'insegna di
     qualcun altro) */
  if(s.demo)return PARTNER_LOGO[s.tipo]||"";
  return partnerLogoOk(s.logo);};

/* ── LE SCHEDE DI ESEMPIO (founder, 27/08) ────────────────────────
   Il modulo era scritto, collaudato e non lo chiamava nessuno: le
   promesse della slide B2B erano vere per vuoto. Adesso è collegato in
   tre punti veri — e finché non c'è un accordo con qualcuno, quello
   che si vede sono QUESTE schede.

   Sono dichiaratamente esempi, e si vede: ogni card porta la parola
   «esempio». Nessuno deve poter scambiare uno studio inventato da noi
   per uno studio vero — sarebbe pubblicità a un'attività che non
   esiste, e la persona potrebbe cercarla davvero.

   Spariscono da sole appena il backend manda una scheda vera per lo
   stesso bisogno: non c'è niente da spegnere a mano. */
const PARTNER_ESEMPI=[
  {id:"es-psi",tipo:"psicologo",demo:true,bisogni:["sostegno"],
   nome:"Studio Aurora (esempio)",riga:"Psicologi con esperienza nel rapporto col cibo",azione:"Come funziona"},
  {id:"es-nut",tipo:"nutrizionista",demo:true,bisogni:["sostegno","piano"],
   nome:"Centro Nutrizione Verde (esempio)",riga:"Prima visita e percorso personalizzato",azione:"Come funziona"},
  {id:"es-pal",tipo:"palestra",demo:true,bisogni:["allenamento"],
   nome:"Palestra Ponte (esempio)",riga:"Sala pesi e corsi, primo ingresso di prova",azione:"Guarda"},
  {id:"es-spo",tipo:"attrezzi",demo:true,bisogni:["allenamento","attrezzi"],
   nome:"Sportivo Nord (esempio)",riga:"Manubri, elastici e scarpe da corsa",azione:"Guarda"},
  {id:"es-neg",tipo:"negozio",demo:true,bisogni:["spesa"],
   nome:"Bottega Fresca (esempio)",riga:"Frutta e verdura di stagione, consegna in giornata",azione:"Guarda"}];
window.PARTNER_ESEMPI=PARTNER_ESEMPI;

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
  const vere=d.schede.filter(s=>{
    const tag=(s.bisogni||[]).map(x=>String(x).toLowerCase());
    return tag.indexOf(b)>=0;});
  /* gli esempi si fanno da parte appena arriva qualcuno di vero per
     quel bisogno: non si mescolano mai */
  const buone=vere.length?vere:PARTNER_ESEMPI.filter(s=>
    (s.bisogni||[]).indexOf(b)>=0);
  /* mai più di due per volta: tre diventano una vetrina */
  return buone.slice(0,Math.min(quanti||2,2));};

/* ── la scheda ──────────────────────────────────────────────────
   L'etichetta non è un'opzione della scheda: la decide il TIPO. Chi
   scrive una scheda non può dimenticarsela né toglierla. */
/* ── ANCHE QUI VALGONO LE PAROLE VIETATE (audit 27/08) ────────────
   Il pilastro le nomina esplicitamente — «vale per l'AI, per i
   messaggi dello studio, per **le schede partner**, per le notifiche»
   — e le schede erano l'unico posto nominato che non le controllava:
   nome, riga e azione arrivano dal backend e finivano a schermo così
   come sono. Basta una scheda scritta male («smaltisci lo sgarro con
   il nostro integratore») per rompere in un colpo il tono di tutta
   l'app, in un punto che la persona associa a Nuvia e non a chi
   l'ha scritta.
   Una scheda che rompe la regola non si mostra: nessuno perde niente,
   perché una scheda partner non è mai indispensabile. */
function partnerPulita(s){
  if(!s)return false;
  const L=(typeof PAROLE_VIETATE!=="undefined"&&Array.isArray(PAROLE_VIETATE))?PAROLE_VIETATE:[];
  const testo=[s.nome,s.riga,s.azione].filter(Boolean).join(" ").toLowerCase();
  return !L.some(p=>testo.indexOf(p)>-1);}
window.partnerPulita=partnerPulita;
window.partnerScheda=(s)=>{
  if(!s||!PARTNER_TIPI[s.tipo])return "";
  if(!partnerPulita(s))return "";
  /* Le schede VERE arrivano gia' scritte dal partner e non si toccano.
     Quelle di ESEMPIO sono testo nostro, quindi si traducono come
     tutto il resto: in inglese una card in italiano si vede subito, e
     il collaudo delle lingue l'ha detto prima di me. */
  const P=(x)=>s.demo?tr(String(x||"")):String(x||"");
  const T=PARTNER_TIPI[s.tipo];
  return `<div class="pcard${T.commerciale?"":" pnc"}">
    <div class="pnome">${partnerLogo(s)
      /* Decorativo, quindi invisibile ai lettori di schermo: il nome
         lo dice già. E se l'immagine non arriva (rete assente, file
         tolto dal backend) sparisce invece di lasciare il riquadro
         rotto — una scheda con un'icona spezzata sembra un errore
         dell'app, non un'immagine mancante. */
      ?`<img class="plogo" src="${esc(partnerLogo(s))}" alt="" aria-hidden="true" width="48" height="48" loading="lazy" onerror="this.remove()">`
      :""}<span>${esc(P(s.nome))}</span></div>
    ${s.riga?`<div class="hint">${esc(P(s.riga))}</div>`:""}
    ${T.etichetta?`<div class="petichetta">${esc(tr("Partner · Nuvia riceve un contributo"))}</div>`:""}
    ${s.demo?`<div class="petichetta pdemo">${esc(tr("Esempio · non è un'attività reale"))}</div>`:""}
    <div class="mtools"><button class="chipbtn" onclick="partnerApri('${esc(s.id||"")}')">${esc(s.azione?P(s.azione):tr("Vai"))}</button></div>
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
