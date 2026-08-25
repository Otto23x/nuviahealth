/* ═══════════════════════════════════════════════════════════════
   IL CODICE A BARRE E I TUOI PIATTI
   ═══════════════════════════════════════════════════════════════
   Due modi di sapere cosa c'è in un cibo senza chiedere niente
   all'AI, cioè due modi di rendere il piano Free uno strumento e non
   un assaggio.

   1 · IL CODICE A BARRE → Open Food Facts. È un archivio pubblico e
   collaborativo (milioni di prodotti, gran parte italiani), senza
   chiavi e senza contratti: si interroga con l'EAN e torna la tabella
   nutrizionale del produttore. Meglio di qualunque stima, perché non
   è una stima: è l'etichetta.

   Tre scelte che contano più della funzione:
   · LA CACHE È IL PRODOTTO, non un'ottimizzazione. Chi fa la spesa
     compra ogni settimana le stesse trenta cose: dopo pochi giorni il
     lettore funziona anche in aereo. Teniamo 200 prodotti, i più
     recenti in testa.
   · SI CHIEDONO SOLO I CAMPI CHE SERVONO (`fields=`): meno banda per
     noi, meno traffico per un archivio che è di tutti e vive di
     donazioni.
   · SE OFF NON SA, NON SI INVENTA. Torna "sconosciuto" e l'interfaccia
     propone le altre strade (foto, scrittura, tavola locale). Un
     numero inventato su un'etichetta è peggio di nessun numero.

   2 · I TUOI PIATTI. Ogni stima accettata — dall'AI, dal barcode, o
   scritta a mano — può diventare una voce riusabile: la seconda volta
   che mangi la tua parmigiana non serve stimare niente, e non serve
   rete. È il database che cresce con la persona, resta sul telefono, e
   nessun concorrente può copiarlo perché non è nostro: è suo.
   Cercando, i piatti personali VINCONO sulla tavola generale — se hai
   corretto una volta, quella correzione vale per sempre. */

const OFF_URL="https://world.openfoodfacts.org/api/v2/product/";
const OFF_CAMPI="product_name,brands,quantity,nutriments,serving_quantity";
const OFF_MAX=200;          /* prodotti tenuti in cache */
/* ── LA SCADENZA ─────────────────────────────────────────────────
   Prima la cache non scadeva mai: un prodotto letto una volta
   restava quello per sempre. Nella pratica conta poco — le etichette
   cambiano raramente e sono i TUOI prodotti abituali — ma quando
   un'azienda riformula la ricetta, il telefono continua a usare i
   valori vecchi senza dirlo. Novanta giorni: abbastanza perché la
   spesa di ogni settimana non tocchi la rete, poco abbastanza perché
   una riformulazione arrivi entro un trimestre.
   REGOLA: se sei offline si usa comunque la voce scaduta. Un dato
   vecchio è meglio di nessun dato, e va detto invece che nascosto. */
const OFF_GIORNI=90;
const PIATTI_MAX=300;       /* voci personali            */

/* ── L'archivio locale ─────────────────────────────────────────── */
function offCache(){S.off=S.off||{};return S.off;}
function mieiPiatti(){S.piatti=Array.isArray(S.piatti)?S.piatti:[];return S.piatti;}

/* Un EAN è 8 o 13 cifre. Validare prima di uscire in rete evita una
   chiamata inutile e, soprattutto, di mostrare un errore di rete
   quando il problema era una lettura sbagliata. */
function eanValido(cod){
  const c=String(cod||"").replace(/\D/g,"");
  return (c.length===8||c.length===12||c.length===13)?c:null;}

/* ── La lettura dal codice ─────────────────────────────────────── */
async function barcodeCerca(cod){
  const ean=eanValido(cod);
  if(!ean)return {stato:"codice"};
  const cache=offCache();
  const vecchia=cache[ean];
  const scaduta=vecchia&&(Date.now()-(vecchia.preso||vecchia.visto||0)>OFF_GIORNI*86400000);
  if(vecchia&&!scaduta){
    vecchia.visto=Date.now();save();
    return {stato:"ok",p:vecchia,da:"cache"};}
  if(typeof navigator!=="undefined"&&navigator.onLine===false){
    /* offline con una voce scaduta in mano: si usa, e si dice */
    if(vecchia){vecchia.visto=Date.now();save();
      return {stato:"ok",p:vecchia,da:"cache-vecchia",
              giorni:Math.round((Date.now()-(vecchia.preso||vecchia.visto))/86400000)};}
    return {stato:"offline"};}
  let j=null;
  try{
    const r=await fetch(OFF_URL+encodeURIComponent(ean)+".json?fields="+OFF_CAMPI,
      {headers:{"Accept":"application/json"}});
    if(r.status===404)return {stato:"sconosciuto"};
    if(!r.ok)return {stato:"rete"};
    j=await r.json();
  }catch(e){return {stato:"rete"};}
  const p=offNormalizza(ean,j);
  if(!p)return {stato:"sconosciuto"};
  cache[ean]=p;
  /* si tengono i più recenti: la spesa di ieri serve più di quella di
     tre mesi fa */
  const chiavi=Object.keys(cache);
  if(chiavi.length>OFF_MAX){
    chiavi.sort((a,b)=>(cache[a].visto||0)-(cache[b].visto||0));
    delete cache[chiavi[0]];}
  save();
  return {stato:"ok",p,da:"rete"};}

/* I nutrimenti di OFF arrivano con nomi e unità variabili: qui si
   riducono al nostro contratto (per 100 g) e si scartano i prodotti
   senza energia, che sono voci incomplete dell'archivio. */
function offNormalizza(ean,j){
  const pr=j&&j.product;if(!pr)return null;
  const n=pr.nutriments||{};
  const num=x=>{const v=parseFloat(x);return isFinite(v)&&v>=0?v:null;};
  let kcal=num(n["energy-kcal_100g"]);
  if(kcal===null){
    const kj=num(n["energy_100g"]);
    if(kj!==null)kcal=Math.round(kj/4.184);}
  if(kcal===null)return null;
  const nome=[pr.product_name,pr.brands?pr.brands.split(",")[0]:""]
    .filter(Boolean).join(" · ").slice(0,70)||("prodotto "+ean);
  return {ean,nome,
    q:pr.quantity||"",
    porzione:num(pr.serving_quantity),
    kcal:Math.round(kcal),
    prot:num(n["proteins_100g"])||0,
    carb:num(n["carbohydrates_100g"])||0,
    gras:num(n["fat_100g"])||0,
    fibre:num(n["fiber_100g"])||0,
    zuccheri:num(n["sugars_100g"])||0,
    visto:Date.now(),preso:Date.now()};}

/* Dal prodotto alla riga del diario: si moltiplica per i grammi
   davvero mangiati, non per la confezione. */
function offInPasto(p,grammi){
  const q=(+grammi||100)/100;
  return {d:p.nome+" "+Math.round(grammi||100)+" g (da barcode)",
    k:Math.round(p.kcal*q),p:Math.round(p.prot*q),
    c:Math.round(p.carb*q),f:Math.round(p.gras*q)};}

/* ── La fotocamera, quando c'è ──────────────────────────────────
   BarcodeDetector è nativo su Android/Chrome e assente su iOS Safari:
   si dichiara la mancanza invece di fingere un pulsante che non fa
   nulla. Dove manca, il codice si scrive a mano — dieci cifre sono
   meno di una foto. */
function barcodeSupportato(){
  return typeof window!=="undefined"&&"BarcodeDetector" in window;}

async function barcodeDaImmagine(sorgente){
  if(!barcodeSupportato())return null;
  try{
    const det=new window.BarcodeDetector({formats:["ean_13","ean_8","upc_a"]});
    const trovati=await det.detect(sorgente);
    return (trovati&&trovati[0]&&trovati[0].rawValue)||null;
  }catch(e){return null;}}

/* ── I tuoi piatti ─────────────────────────────────────────────── */
function piattoChiave(nome){
  return String(nome||"").toLowerCase()
    .replace(/[àá]/g,"a").replace(/[èé]/g,"e").replace(/[ìí]/g,"i")
    .replace(/[òó]/g,"o").replace(/[ùú]/g,"u")
    .replace(/\d+\s*(?:g|gr|grammi|ml)\b/g,"")
    .replace(/\(.*?\)/g,"").replace(/\s+/g," ").trim().slice(0,60);}

/* Salva una stima come voce personale. `fonte` serve a dire la verità
   nell'interfaccia: un valore letto dall'etichetta e uno stimato
   dall'AI non meritano la stessa fiducia. */
function piattoSalva(nome,val,fonte){
  const k=piattoChiave(nome);
  if(!k||!val||!(+val.kcal>0))return null;
  const p=mieiPiatti();
  const voce={k,nome:String(nome).slice(0,70),
    kcal:Math.round(+val.kcal||0),prot:Math.round(+val.prot||0),
    carb:Math.round(+val.carb||0),gras:Math.round(+val.gras||0),
    fibre:Math.round(+val.fibre||0),zuccheri:Math.round(+val.zuccheri||0),
    g:Math.round(+val.g||0)||null,
    fonte:fonte||"stima",usi:1,at:Date.now()};
  const i=p.findIndex(x=>x.k===k);
  if(i>-1){voce.usi=(p[i].usi||1)+1;p[i]=voce;}
  else{
    p.unshift(voce);
    /* pieno: esce il meno usato fra i più vecchi, non l'ultimo
       arrivato — la parmigiana di ogni domenica vale più di una prova */
    if(p.length>PIATTI_MAX){
      let peggio=0;
      p.forEach((x,idx)=>{if((x.usi||1)<=(p[peggio].usi||1)&&(x.at||0)<(p[peggio].at||0))peggio=idx;});
      p.splice(peggio,1);}}
  save();
  return voce;}

function piattoTrova(testo){
  const t=piattoChiave(testo);
  if(!t)return null;
  const p=mieiPiatti();
  let best=null,len=0;
  for(const v of p){
    if(!v.k)continue;
    if(t===v.k)return v;                       /* uguale: vince subito */
    if(t.indexOf(v.k)>-1&&v.k.length>len){len=v.k.length;best=v;}}
  return best;}

function piattoDimentica(k){
  const p=mieiPiatti();
  const i=p.findIndex(x=>x.k===k);
  if(i<0)return null;
  const via=p.splice(i,1)[0];
  save();
  /* si restituisce la voce così chi chiama può offrire l'annulla:
     cancellare per sbaglio un piatto tarato a mano è una perdita vera */
  return via;}

function piattoRipristina(voce){
  if(!voce||!voce.k)return false;
  const p=mieiPiatti();
  if(p.some(x=>x.k===voce.k))return false;
  p.unshift(voce);save();return true;}

window.barcodeCerca=barcodeCerca;
window.offNormalizza=offNormalizza;
window.offInPasto=offInPasto;
window.offCache=offCache;
window.eanValido=eanValido;
window.barcodeSupportato=barcodeSupportato;
window.barcodeDaImmagine=barcodeDaImmagine;
window.mieiPiatti=mieiPiatti;
window.piattoChiave=piattoChiave;
window.piattoSalva=piattoSalva;
window.piattoTrova=piattoTrova;
window.piattoDimentica=piattoDimentica;
window.piattoRipristina=piattoRipristina;
