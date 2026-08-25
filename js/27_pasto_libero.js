/* ═══════════════════════════════════════════════════════════════
   27. MODALITÀ LIBERA: FOTO-PASTO, TONO, LINEE GUIDA (Sprint 3)
   ═══════════════════════════════════════════════════════════════
   Chi ha scelto «alla giornata» non vuole un piano da seguire: vuole
   sapere se sta andando bene e vuole tracciare in tre secondi.

   Qui dentro c'è la parte più delicata di tutta l'app: un commento
   su quello che una persona ha appena mangiato. Le regole stanno in
   src/contratti/tono.md e non sono consigli di stile — sono
   vincolanti, e t_tono.js le fa rispettare. Le tre che contano:

   1. IL COMMENTO NON È UN VOTO TRAVESTITO. La faccina guarda la
      COMPOSIZIONE del piatto (c'è una proteina? c'è verdura?), mai
      le calorie. Un voto calorico con la faccia sorridente resta un
      voto, e per chi ha un rapporto difficile col cibo è peggio del
      numero nudo, perché arriva senza preavviso.
   2. SEMPRE UN COMPLIMENTO, E SINCERO. Se nel piatto non c'è nulla
      da lodare, si loda l'aver tracciato: è l'unica cosa che
      chiediamo davvero.
   3. UN SOLO SUGGERIMENTO. Due diventano una lista di difetti.

   E una quarta, che vale più delle altre tre: quando dall'onboarding
   emerge un rapporto difficile col cibo, i numeri si attenuano e il
   supporto sale. Non è una funzione ridotta: è la stessa app che
   sceglie parole diverse, come farebbe una persona che sa chi ha
   davanti.                                                          */

/* ── Chi ha davanti l'app ───────────────────────────────────────
   Il consenso dato nell'onboarding dice soltanto «puoi chiedermelo».
   Il segnale vero è la RISPOSTA: fame nervosa o mangiare per noia.
   A questi si aggiunge, se c'è, la restrizione rilevata dagli schemi —
   che è il segnale più serio dei tre e non passa dall'onboarding. */
function profiloDelicato(){
  try{
    const o=S.onb2||{};
    if(o.sensibili===true&&/^(nervoso|noia)$/.test((o.ris||{}).cibo||""))return true;
    if(typeof analizzaSchemi==="function"){
      const r=analizzaSchemi();
      if(r&&!r.pochi&&(r.schemi||[]).some(x=>x.t==="restrizione"))return true;}
  }catch(e){}
  return false;}
window.profiloDelicato=profiloDelicato;

/* ── Le parole che non si usano ─────────────────────────────────
   Elenco unico, esposto perché il collaudo lo legga da qui: una
   seconda copia dentro il test si allontanerebbe da questa al primo
   ritocco, e il collaudo passerebbe controllando la lista sbagliata. */
const PAROLE_VIETATE=[
  "sgarro","sgarrare","sgarrato",
  "hai fatto male","cibo sbagliato","pasto sbagliato",
  "troppo","troppa","troppi","eccessiv","esagerat",
  "colpa","sensi di colpa",
  "ingrassare","sei grasso","sei grassa",
  "devi ","dovresti","non puoi",
  "fallito","disastro","pessimo",
  "bruciare le calorie","smaltire",
  "meriti","meritato","penitenza","recuperare lo sgarro"
];
window.PAROLE_VIETATE=PAROLE_VIETATE;

/* ── I mattoni del commento ─────────────────────────────────────
   Frasi separate per ruolo, così la struttura complimento →
   suggerimento → incoraggiamento è garantita dalla forma dei dati e
   non dalla buona volontà di chi scrive il prossimo pezzo. */
const TONO={
  lode:{
    completo:"Piatto completo: c'è la proteina e c'è il colore della verdura.",
    proteina:"Ottima la fonte proteica.",
    verdura:"Bella la parte di verdura.",
    frutta:"La frutta nel pasto è una buona abitudine.",
    varieta:"Mi piace la varietà di questo piatto.",
    tracciato:"Hai segnato il pasto: è la cosa che conta di più."
  },
  spunto:{
    proteina:"La prossima volta puoi affiancarci una fonte proteica.",
    verdura:"Un contorno di verdura ci starebbe bene.",
    fibra:"Una porzione di verdura o frutta completerebbe il quadro."
  },
  chiusa:{
    normale:"Continua così.",
    delicato:"Va bene così.",
    dubbio:"Se ho letto male qualcosa, correggilo pure."
  }
};
window.TONO=TONO;

/* Le frasi del tono arrivano a tr() dentro una variabile: invisibili a una
   ricerca testuale, in entrambe le direzioni. Si dichiarano qui, e il
   registro delle chiavi dinamiche le legge da sé. */
window.tonoFrasi=function(){
  return [].concat(Object.values(TONO.lode),Object.values(TONO.spunto),Object.values(TONO.chiusa));};

/* ── La faccina ─────────────────────────────────────────────────
   Tre stati, nessuna bocciatura. Guarda i GRUPPI presenti nel
   piatto: proteina e verdura/frutta insieme = completo. Le calorie
   non entrano in questo calcolo, mai. */
function facciaDi(gruppi){
  const g=new Set(gruppi||[]);
  const prot=g.has("proteina")||g.has("latticino");
  const veg=g.has("verdura")||g.has("frutta");
  if(prot&&veg)return "completo";
  if(prot||veg)return "quasi";
  return "nutre";}
window.facciaDi=facciaDi;

const FACCE={completo:"😊",quasi:"🙂",nutre:"😌"};
window.FACCE=FACCE;

/* Il commento: due frasi, in quest'ordine, sempre. */
function commentoPasto(gruppi,opz){
  opz=opz||{};
  const g=new Set(gruppi||[]);
  const delicato=("delicato" in opz)?opz.delicato:profiloDelicato();
  const stato=facciaDi(gruppi);
  const prot=g.has("proteina")||g.has("latticino");
  const veg=g.has("verdura")||g.has("frutta");

  /* 1 · la lode, e deve riferirsi a qualcosa che c'è davvero */
  let lode;
  if(stato==="completo")lode=TONO.lode.completo;
  else if(veg)lode=g.has("frutta")&&!g.has("verdura")?TONO.lode.frutta:TONO.lode.verdura;
  else if(prot)lode=TONO.lode.proteina;
  else if(g.size>=3)lode=TONO.lode.varieta;
  else lode=TONO.lode.tracciato;          /* non c'è nulla da lodare nel piatto:
                                             si loda il gesto, che è sincero */

  /* 2 · al massimo UN suggerimento, e per chi ha un rapporto
     difficile col cibo nessuno: in quel caso il suggerimento non
     viene letto come un aiuto ma come la conferma di aver sbagliato */
  let spunto="";
  if(!delicato&&stato!=="completo"){
    if(!prot)spunto=TONO.spunto.proteina;
    else if(!veg)spunto=TONO.spunto.verdura;}

  /* 3 · la chiusa */
  const chiusa=opz.dubbio?TONO.chiusa.dubbio:(delicato?TONO.chiusa.delicato:TONO.chiusa.normale);

  return {faccia:FACCE[stato],stato,
    testo:[tr(lode),spunto?tr(spunto):"",tr(chiusa)].filter(Boolean).join(" "),
    lode:tr(lode),spunto:spunto?tr(spunto):"",chiusa:tr(chiusa),delicato};}
window.commentoPasto=commentoPasto;

/* ── Validazione della stima ────────────────────────────────────
   Stesso confine dell'onboarding: il modello propone, il client
   decide cosa tenere. Un numero fuori scala diventa null e non zero:
   uno zero inventato entrerebbe nel bilancio del giorno in silenzio. */
const GRUPPI=["proteina","carboidrato","verdura","frutta","grasso","latticino","dolce","bevanda","altro"];
const CAMPI_NUM={kcal:[0,4000],proteine:[0,300],carboidrati:[0,500],grassi:[0,300],fibre:[0,100]};

function pulisciTesto(x,max){
  return String(x==null?"":x).replace(/<[^>]*>/g,"").trim().slice(0,max||60);}

function stimaValida(j){
  const out={alimenti:[],kcal:null,proteine:null,carboidrati:null,grassi:null,fibre:null,
             sicurezza:"media",momento:null};
  if(!j||typeof j!=="object"||Array.isArray(j))return out;
  if(Array.isArray(j.alimenti)){
    j.alimenti.slice(0,12).forEach(a=>{
      if(!a||typeof a!=="object")return;
      const nome=pulisciTesto(a.nome,60);
      if(!nome)return;
      const gr=GRUPPI.includes(String(a.gruppo))?String(a.gruppo):"altro";
      const g=parseFloat(a.g);
      out.alimenti.push({nome,gruppo:gr,
        quantita:pulisciTesto(a.quantita,40)||null,
        g:(isFinite(g)&&g>0&&g<=2000)?Math.round(g):null});});}
  Object.keys(CAMPI_NUM).forEach(k=>{
    const n=parseFloat(j[k]),[min,max]=CAMPI_NUM[k];
    out[k]=(isFinite(n)&&n>=min&&n<=max)?Math.round(n):null;});
  if(/^(alta|media|bassa)$/.test(String(j.sicurezza)))out.sicurezza=String(j.sicurezza);
  if(/^(colazione|pranzo|cena|spuntino)$/.test(String(j.momento)))out.momento=String(j.momento);
  return out;}
window.stimaValida=stimaValida;

function gruppiDi(stima){return (stima.alimenti||[]).map(a=>a.gruppo);}
window.gruppiDi=gruppiDi;

/* ── Il contatore delle foto ────────────────────────────────────
   Cinque a settimana in questa fase: il limite vero arriverà dal
   server (S6). Vive in una proprietà nuova, con default, e non tocca
   nulla di quello che c'era. */
const FOTO_SETT=5;
function fotoStato(){
  if(!S.libera||typeof S.libera!=="object")S.libera={};
  const L=S.libera;
  /* Chiave della settimana: anno + numero ISO. Basta che sia stabile per
     sette giorni e che cambi il lunedì, come il resto dell'app. */
  const n=new Date(),g=new Date(n.getFullYear(),0,1);
  const sett=n.getFullYear()+"-"+Math.ceil((((n-g)/86400000)+g.getDay()+1)/7);
  if(L.fotoSett!==sett){L.fotoSett=sett;L.fotoUsate=0;}
  if(typeof L.fotoUsate!=="number")L.fotoUsate=0;
  if(typeof L.giorniLibera!=="number")L.giorniLibera=0;
  if(!L.ponte)L.ponte={proposto:false,rifiutato:false};
  return L;}
window.fotoStato=fotoStato;
/* Quante foto restano. La verità è del server (Sprint 5): il contatore
   locale è solo la stima da mostrare quando non c'è rete. Due verità
   sullo stesso numero divergono sempre, e quella sbagliata è sempre
   quella che l'utente vede per prima — quindi il locale cede il passo. */
function fotoRimaste(){
  if(typeof contoResta==="function"){
    const s=contoResta("foto");
    if(s===-1)return Infinity;              /* piano senza limiti */
    if(typeof s==="number")return s;}
  const L=fotoStato();return Math.max(0,FOTO_SETT-L.fotoUsate);}
window.fotoRimaste=fotoRimaste;

/* ── Le linee guida del giorno ──────────────────────────────────
   La modalità Libera non dà ricette: dà i confini dentro cui
   muoversi. I numeri arrivano dal motore fabbisogni già collaudato,
   non da una tabella scritta a parte — se un giorno cambia il calcolo
   del fabbisogno, cambiano anche queste, da sole.
   Per chi ha un rapporto difficile col cibo i grammi spariscono e
   restano le porzioni: la stessa informazione, senza il numero. */
function lineeGuidaOggi(opz){
  opz=opz||{};
  const delicato=("delicato" in opz)?opz.delicato:profiloDelicato();
  const k=dayTargetK(),p=dayTargetP(),c=dayTargetC(),f=dayTargetF(),fib=dayTargetFib();
  const porzVerdura=Math.max(2,Math.round(fib/12));
  const righe=[];
  if(delicato){
    righe.push({k:"proteine", t:tr("Una fonte proteica a pranzo e a cena")});
    righe.push({k:"verdura",  t:tr("{n} porzioni di verdura",{n:porzVerdura})});
    righe.push({k:"frutta",   t:tr("2 frutti nella giornata")});
    righe.push({k:"cereali",  t:tr("Cereali integrali a ogni pasto principale")});
    righe.push({k:"grassi",   t:tr("Olio d'oliva a crudo, frutta secca a piacere")});
  }else{
    righe.push({k:"kcal",     t:tr("~{n} kcal nella giornata",{n:k})});
    righe.push({k:"proteine", t:tr("~{n} g di proteine",{n:p})});
    righe.push({k:"carboidrati",t:tr("~{n} g di carboidrati",{n:c})});
    righe.push({k:"grassi",   t:tr("~{n} g di grassi",{n:f})});
    righe.push({k:"verdura",  t:tr("{n} porzioni di verdura e 2 frutti",{n:porzVerdura})});
  }
  return {righe,delicato,
    nota:delicato?tr("Sono confini larghi, non compiti: servono a orientarsi, non a fare i conti.")
                 :tr("Sono indicazioni di massima: una giornata storta non rompe niente.")};}
window.lineeGuidaOggi=lineeGuidaOggi;

function lineeGuidaHTML(){
  const g=lineeGuidaOggi();
  return `<div class="card" data-linee="1"><h2>${esc(tr("Le linee guida di oggi"))}</h2>
    <div class="lgrid">${g.righe.map(r=>
      `<div class="lg" data-lg="${esc(r.k)}">${esc(r.t)}</div>`).join("")}</div>
    <div class="hint" style="margin-top:12px">${esc(g.nota)}</div></div>`;}
window.lineeGuidaHTML=lineeGuidaHTML;

/* ── La foto ────────────────────────────────────────────────────── */
let FOTO=null;      /* stima in corso, prima della conferma */

window.fotoPasto=async(gal)=>{
  /* Prima il cancello: se il piano non include la foto, si dice cosa
     si può fare comunque invece di mostrare un muro. */
  if(typeof cancello==="function"){
    const g=cancello("foto");
    if(!g.ok){const box=document.getElementById("fotoOut");
      if(box){box.style.display="block";box.innerHTML=cancelloHTML("foto");}
      return;}}
  if(fotoRimaste()<=0)
    return dlgAlert(tr("Hai usato le foto di questa settimana. Puoi sempre scrivere il pasto o raccontarlo a voce: è identico."));
  if(!aiOn())
    return dlgAlert(tr("Per leggere la foto serve la connessione. Intanto puoi scrivere il pasto a mano."));
  let img;
  try{img=await anyPhoto(!!gal,false);}catch(e){return;}
  const box=document.getElementById("fotoOut");
  if(box){box.style.display="block";box.textContent=tr("Guardo la foto…");}
  try{
    const j=await aiAskVision(FOTO_PROMPT,[img]);
    const stima=stimaValida(parseAIJSON(j));
    if(!stima.alimenti.length){
      if(box)box.textContent=tr("In questa foto non riconosco un piatto. Puoi scriverlo a mano: ci metti un attimo.");
      return;}
    const L=fotoStato();L.fotoUsate++;save();
    FOTO=stima;fotoMostra();
  }catch(e){
    if(box)box.textContent=tr("Non sono riuscito a leggere la foto. Puoi scrivere il pasto a mano.");}};

const FOTO_PROMPT='Guarda questo piatto e dimmi COSA contiene, senza giudicarlo e senza dare consigli. '+
  'Se non c\'è cibo riconoscibile rispondi con alimenti vuoto. Non stimare età, peso o salute di eventuali persone. '+
  'Rispondi SOLO con questo JSON: {"alimenti":[{"nome":"","quantita":null,"g":null,'+
  '"gruppo":"proteina|carboidrato|verdura|frutta|grasso|latticino|dolce|bevanda|altro"}],'+
  '"kcal":0,"proteine":0,"carboidrati":0,"grassi":0,"fibre":null,"sicurezza":"alta|media|bassa"}';

/* I chip: la stima si vede e si corregge PRIMA di entrare nel
   bilancio. Togliere un alimento ricalcola il commento, perché il
   commento parla di quello che c'è nel piatto. */
function fotoMostra(){
  const box=document.getElementById("fotoOut");if(!box||!FOTO)return;
  const c=commentoPasto(gruppiDi(FOTO),{dubbio:FOTO.sicurezza==="bassa"});
  /* Si registra l'esito: serve a NON proporre un abbonamento subito
     dopo il commento più tenero. Vendere sulla fragilità funziona una
     volta e brucia tutto il resto. */
  try{if(typeof propostaEsitoPasto==="function")propostaEsitoPasto(c.stato);}catch(e){}
  const delicato=c.delicato;
  box.style.display="block";
  box.innerHTML=`<div class="fotoesito" data-faccia="${esc(c.stato)}">
    <div class="fotofaccia" aria-hidden="true">${c.faccia}</div>
    <p class="fototesto">${esc(c.testo)}</p>
    <div class="fotochips">${FOTO.alimenti.map((a,i)=>
      `<span class="o2chip2" data-cibo="${esc(a.nome)}">${esc(a.nome)}${a.quantita?" · "+esc(a.quantita):""}
        <button type="button" class="o2chipx" onclick="fotoTogli(${i})"
          aria-label="${esc(tr("Togli"))}">✕</button></span>`).join("")}</div>
    ${delicato?"":`<div class="hint" data-numeri="1">${esc(tr("Stima: ~{k} kcal · {p} g proteine",
        {k:FOTO.kcal||0,p:FOTO.proteine||0}))}</div>`}
    <div class="hint">${esc(FOTO.sicurezza==="bassa"
      ? tr("Non sono sicurissimo di aver letto bene: controlla prima di confermare.")
      : tr("È una stima da fotografia: correggila pure prima di confermare."))}</div>
    <button class="btn" type="button" onclick="fotoConferma()">${esc(tr("Aggiungi al diario"))}</button>
    <div class="mtools"><button class="btn ghost small" type="button" onclick="fotoAnnulla()">${esc(tr("Lascia perdere"))}</button></div>
  </div>`;}
window.fotoMostra=fotoMostra;

window.fotoTogli=(i)=>{if(!FOTO)return;FOTO.alimenti.splice(i,1);
  if(!FOTO.alimenti.length)return fotoAnnulla();
  fotoMostra();};
window.fotoAnnulla=()=>{FOTO=null;
  const box=document.getElementById("fotoOut");if(box){box.style.display="none";box.innerHTML="";}};

/* La conferma: il pasto entra nel bilancio del giorno come extra,
   che è il meccanismo che l'app usa già per tutto ciò che non nasce
   dal piano. Nessuna strada nuova da mantenere. */
window.fotoConferma=()=>{
  if(!FOTO)return;
  const di=Math.max(0,viewIdx());
  const nomi=FOTO.alimenti.map(a=>a.nome).join(", ");
  const d=S.week.days[di];
  d.extras=d.extras||[];
  d.extras.push({d:nomi.slice(0,120),k:FOTO.kcal||0,p:FOTO.proteine||0,
                 c:FOTO.carboidrati||0,f:FOTO.grassi||0,fib:FOTO.fibre||0,st:"done",
                 src:"foto"});
  save();
  const c=commentoPasto(gruppiDi(FOTO));
  FOTO=null;fotoAnnulla();
  toast(c.faccia+" "+c.lode);
  render(cur);};

/* ── Il pasto raccontato a voce ─────────────────────────────────
   Si appoggia al motore vocale dell'app (voceIn), lo stesso
   dell'onboarding: un solo microfono per tutta Nuvia. */
window.vocePasto=()=>{
  if(typeof vocePossibile!=="function"||!vocePossibile())
    return dlgAlert(tr("Su questo telefono non posso accendere il microfono da solo. Puoi dettare con il microfono della tastiera, oppure scrivere: è identico."));
  let ta=document.getElementById("vocePastoTxt");
  if(!ta){ta=document.createElement("textarea");ta.id="vocePastoTxt";
    ta.style.position="absolute";ta.style.left="-9999px";ta.setAttribute("aria-hidden","true");
    (document.getElementById("pg-oggi")||document.body).appendChild(ta);}
  ta.value="";
  try{voceIn("vocePastoTxt","vocePastoMic");}catch(e){
    return dlgAlert(tr("Il microfono non è partito. Puoi scrivere il pasto: è identico."));}
  const box=document.getElementById("fotoOut");
  if(box&&!document.getElementById("vocePastoStop")){
    box.style.display="block";
    const b=document.createElement("button");
    b.id="vocePastoStop";b.className="btn";b.type="button";
    b.textContent=tr("Ho finito");
    b.onclick=()=>{try{voceIn("vocePastoTxt","vocePastoMic");}catch(e){}
      const t=(document.getElementById("vocePastoTxt")||{}).value||"";
      b.remove();vocePastoLeggi(t);};
    box.appendChild(b);}};

window.vocePastoLeggi=async(testo)=>{
  const t=String(testo||"").trim();
  const box=document.getElementById("fotoOut");
  if(!t){if(box)box.textContent=tr("Non ho sentito nulla. Puoi scrivere il pasto: è identico.");return;}
  if(!aiOn()){if(box)box.textContent=tr("Per leggere il racconto serve la connessione. Puoi scrivere il pasto a mano.");return;}
  if(box){box.style.display="block";box.textContent=tr("Leggo…");}
  try{
    const j=await aiAskJSON(VOCE_PROMPT.replace("{T}",t),"pastovoce");
    const stima=stimaValida(j);
    if(!stima.alimenti.length){
      if(box)box.textContent=tr("Non ho capito bene cosa hai mangiato. Puoi scriverlo: ci metti un attimo.");
      return;}
    FOTO=stima;fotoMostra();
  }catch(e){
    if(box)box.textContent=tr("Non sono riuscito a leggere il racconto. Puoi scrivere il pasto a mano.");}};

const VOCE_PROMPT='Questa persona racconta cosa ha mangiato: """{T}""". '+
  'Estrai SOLO gli alimenti nominati: non aggiungere contorni o bevande che non ha detto. '+
  'Se non dice le quantità, stima una porzione comune e lascia quantita a null. Non giudicare, non dare consigli. '+
  'Rispondi SOLO con questo JSON: {"alimenti":[{"nome":"","quantita":null,"g":null,'+
  '"gruppo":"proteina|carboidrato|verdura|frutta|grasso|latticino|dolce|bevanda|altro"}],'+
  '"kcal":0,"proteine":0,"carboidrati":0,"grassi":0,"fibre":null,"sicurezza":"alta|media|bassa",'+
  '"momento":"colazione|pranzo|cena|spuntino|null"}';

/* ── Il ponte verso il Piano ────────────────────────────────────
   Dopo una settimana in Libera, UNA proposta. Se la persona dice di
   no, non si ripete mai più: una proposta rifiutata e riproposta è
   la definizione di molesto, e qui il rifiuto è un dato, non un
   silenzio da riempire. */
function ponteContaGiorno(){
  const L=fotoStato();
  const oggi=iso(new Date());
  if(L.ultimoGiorno===oggi)return;
  L.ultimoGiorno=oggi;L.giorniLibera=(L.giorniLibera||0)+1;save();}
window.ponteContaGiorno=ponteContaGiorno;

function ponteDaMostrare(){
  try{
    if((S.ui||{}).modalitaPasti!=="libera")return false;
    const L=fotoStato();
    return (L.giorniLibera||0)>=7&&!L.ponte.proposto&&!L.ponte.rifiutato;
  }catch(e){return false;}}
window.ponteDaMostrare=ponteDaMostrare;

function ponteHTML(){
  if(!ponteDaMostrare())return "";
  return `<div class="card" data-ponte="1"><h2>${esc(tr("Una proposta"))}</h2>
    <div class="hint">${esc(tr("Sono sette giorni che segni i pasti alla giornata. Se vuoi, da quello che mangi di solito ti preparo una settimana già pronta: la spesa la faccio io."))}</div>
    <button class="btn" type="button" onclick="ponteAccetta()">${esc(tr("Sì, preparami la settimana"))}</button>
    <div class="mtools"><button class="btn ghost small" type="button" onclick="ponteRifiuta()">${esc(tr("No, sto bene così"))}</button></div>
  </div>`;}
window.ponteHTML=ponteHTML;

window.ponteAccetta=()=>{const L=fotoStato();L.ponte.proposto=true;save();
  if(typeof wizStart==="function")wizStart(1);else show("piano");};
window.ponteRifiuta=()=>{const L=fotoStato();L.ponte.rifiutato=true;L.ponte.proposto=true;save();
  toast(tr("Va benissimo così. Non te lo chiedo più."));
  render(cur);};

/* ── Il blocco che si innesta nel diario ────────────────────────── */
function liberaHTML(){
  if((S.ui||{}).modalitaPasti!=="libera")return "";
  ponteContaGiorno();
  const rim=fotoRimaste();
  return ponteHTML()+lineeGuidaHTML()+
   `<div class="card" data-libera="1"><h2>${esc(tr("Cosa hai mangiato"))}</h2>
    <div class="hint">${esc(tr("Fotografa il piatto, raccontalo a voce o scrivilo: quello che preferisci."))}</div>
    <button class="btn" type="button" onclick="fotoPasto(false)">${esc(tr("Fotografa il piatto"))}</button>
    <div class="mtools">
      <button class="btn ghost small" type="button" onclick="fotoPasto(true)">${esc(tr("Scegli dalla galleria"))}</button>
      <button title="${tr("Apri")}" class="btn ghost small" id="vocePastoMic" type="button" onclick="vocePasto()">${ic("mic",15)} ${esc(tr("Raccontalo"))}</button>
    </div>
    <div class="hint" style="margin-top:8px">${esc(!isFinite(rim)
      ? tr("Foto senza limiti con il tuo piano.")
      : (rim>0 ? tr("Ti restano {n} foto questa settimana.",{n:rim})
               : tr("Foto finite per questa settimana: puoi sempre raccontare o scrivere.")))}</div>
    <div class="aibox" id="fotoOut" aria-live="polite" style="display:none"></div>
  </div>`;}
window.liberaHTML=liberaHTML;
