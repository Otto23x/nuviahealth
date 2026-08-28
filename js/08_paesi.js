/* ═══════════════════════════════════════════════════════════════
   8. DOVE VIVI — paese, valuta, unità di misura
   ═══════════════════════════════════════════════════════════════
   Richiesta del founder (28/08): «Va inserito anche dove vivi:
   Italia ecc (lista di paesi del mondo con ricerca) e che valuta
   usi… metti anche le unità di misura del paese».

   ── PERCHÉ TRE COSE E NON UNA ──────────────────────────────────
   Il paese non basta a decidere la valuta (in Svizzera si paga in
   franchi, ma chi lavora a Chiasso ragiona in euro) e non basta a
   decidere le unità (un italiano che vive a Londra pesa la carne in
   grammi da tutta la vita). Quindi: il paese PROPONE, la persona
   decide. Tre campi, due dei quali già compilati.

   ── LA REGOLA CHE NON SI PASSA ─────────────────────────────────
   **I dati si salvano SEMPRE in metrico.** Chilogrammi, centimetri,
   grammi, millilitri: sempre, per tutti. Le unità imperiali sono un
   VESTITO che si mette al momento di mostrare un numero e si toglie
   al momento di leggerlo da un campo. Il giorno che una persona
   cambia paese, i suoi dati non devono muoversi di un grammo — e
   soprattutto: un peso salvato in libbre e riletto come chili sarebbe
   un errore del 120% dentro il calcolo del fabbisogno.

   ── E IL CAMBIO VALUTA NON LO INVENTIAMO ───────────────────────
   Un tasso è un dato di giornata. Un modello linguistico non lo sa e
   ne produce uno che sembra giusto: è esattamente il tipo di numero
   contro cui è costruita tutta l'app. Qui NON si converte niente. I
   prezzi restano nella valuta in cui si è speso, e al modello si dice
   dove siamo, in che anno e con quanti soldi — così ragiona sui
   prezzi veri di quel posto invece di tradurre i nostri.           */

/* Paese → valuta proposta e sistema di misura di casa.
   L'elenco copre i paesi da cui l'app può ragionevolmente essere
   aperta; per tutti gli altri c'è «Altro», che non è un ripiego
   silenzioso: chiede la valuta e le unità come le altre voci. */
const PAESI=[
 ["IT","Italia","EUR","metrico"],["US","Stati Uniti","USD","imperiale"],
 ["GB","Regno Unito","GBP","imperiale"],["IE","Irlanda","EUR","metrico"],
 ["FR","Francia","EUR","metrico"],["DE","Germania","EUR","metrico"],
 ["ES","Spagna","EUR","metrico"],["PT","Portogallo","EUR","metrico"],
 ["NL","Paesi Bassi","EUR","metrico"],["BE","Belgio","EUR","metrico"],
 ["AT","Austria","EUR","metrico"],["CH","Svizzera","CHF","metrico"],
 ["GR","Grecia","EUR","metrico"],["MT","Malta","EUR","metrico"],
 ["SI","Slovenia","EUR","metrico"],["HR","Croazia","EUR","metrico"],
 ["SM","San Marino","EUR","metrico"],["VA","Città del Vaticano","EUR","metrico"],
 ["PL","Polonia","PLN","metrico"],["CZ","Cechia","CZK","metrico"],
 ["SK","Slovacchia","EUR","metrico"],["HU","Ungheria","HUF","metrico"],
 ["RO","Romania","RON","metrico"],["BG","Bulgaria","BGN","metrico"],
 ["SE","Svezia","SEK","metrico"],["NO","Norvegia","NOK","metrico"],
 ["DK","Danimarca","DKK","metrico"],["FI","Finlandia","EUR","metrico"],
 ["IS","Islanda","ISK","metrico"],["EE","Estonia","EUR","metrico"],
 ["LV","Lettonia","EUR","metrico"],["LT","Lituania","EUR","metrico"],
 ["UA","Ucraina","UAH","metrico"],["RS","Serbia","RSD","metrico"],
 ["AL","Albania","ALL","metrico"],["TR","Turchia","TRY","metrico"],
 ["RU","Russia","RUB","metrico"],
 ["CA","Canada","CAD","metrico"],["MX","Messico","MXN","metrico"],
 ["BR","Brasile","BRL","metrico"],["AR","Argentina","ARS","metrico"],
 ["CL","Cile","CLP","metrico"],["CO","Colombia","COP","metrico"],
 ["PE","Perù","PEN","metrico"],["UY","Uruguay","UYU","metrico"],
 ["VE","Venezuela","VES","metrico"],["EC","Ecuador","USD","metrico"],
 ["AU","Australia","AUD","metrico"],["NZ","Nuova Zelanda","NZD","metrico"],
 ["JP","Giappone","JPY","metrico"],["CN","Cina","CNY","metrico"],
 ["KR","Corea del Sud","KRW","metrico"],["IN","India","INR","metrico"],
 ["ID","Indonesia","IDR","metrico"],["PH","Filippine","PHP","metrico"],
 ["TH","Thailandia","THB","metrico"],["VN","Vietnam","VND","metrico"],
 ["MY","Malaysia","MYR","metrico"],["SG","Singapore","SGD","metrico"],
 ["IL","Israele","ILS","metrico"],["AE","Emirati Arabi Uniti","AED","metrico"],
 ["SA","Arabia Saudita","SAR","metrico"],["QA","Qatar","QAR","metrico"],
 ["EG","Egitto","EGP","metrico"],["MA","Marocco","MAD","metrico"],
 ["TN","Tunisia","TND","metrico"],["DZ","Algeria","DZD","metrico"],
 ["ZA","Sudafrica","ZAR","metrico"],["NG","Nigeria","NGN","metrico"],
 ["KE","Kenya","KES","metrico"],["GH","Ghana","GHS","metrico"],
 ["ET","Etiopia","ETB","metrico"],["SN","Senegal","XOF","metrico"],
 ["CI","Costa d'Avorio","XOF","metrico"],["CM","Camerun","XAF","metrico"],
 ["PK","Pakistan","PKR","metrico"],["BD","Bangladesh","BDT","metrico"],
 ["LK","Sri Lanka","LKR","metrico"],["NP","Nepal","NPR","metrico"],
 ["AZ","Azerbaigian","AZN","metrico"],["GE","Georgia","GEL","metrico"],
 ["AM","Armenia","AMD","metrico"],["KZ","Kazakistan","KZT","metrico"],
 ["LU","Lussemburgo","EUR","metrico"],["CY","Cipro","EUR","metrico"],
 ["MC","Monaco","EUR","metrico"],["AD","Andorra","EUR","metrico"],
 ["ZZ","Altro","EUR","metrico"]
];
window.PAESI=PAESI;

/* Le valute che l'app sa nominare e formattare. Il simbolo serve a
   scrivere un prezzo; `dopo` dice da che parte va (35 € ma $35), e
   `dec` quante cifre — lo yen non ha centesimi, e scrivere «¥120,00»
   è il modo più rapido di far capire che l'app non è di casa lì. */
const VALUTE=[
 ["EUR","€","Euro",2,true],["USD","$","Dollaro USA",2,false],
 ["GBP","£","Sterlina",2,false],["CHF","CHF","Franco svizzero",2,true],
 ["CAD","$","Dollaro canadese",2,false],["AUD","$","Dollaro australiano",2,false],
 ["NZD","$","Dollaro neozelandese",2,false],["JPY","¥","Yen",0,false],
 ["CNY","¥","Yuan",2,false],["KRW","₩","Won",0,false],
 ["INR","₹","Rupia indiana",2,false],["BRL","R$","Real",2,false],
 ["MXN","$","Peso messicano",2,false],["ARS","$","Peso argentino",2,false],
 ["CLP","$","Peso cileno",0,false],["COP","$","Peso colombiano",0,false],
 ["PEN","S/","Sol",2,false],["UYU","$","Peso uruguaiano",2,false],
 ["VES","Bs","Bolívar",2,false],["PLN","zł","Złoty",2,true],
 ["CZK","Kč","Corona ceca",2,true],["HUF","Ft","Fiorino",0,true],
 ["RON","lei","Leu",2,true],["BGN","лв","Lev",2,true],
 ["SEK","kr","Corona svedese",2,true],["NOK","kr","Corona norvegese",2,true],
 ["DKK","kr","Corona danese",2,true],["ISK","kr","Corona islandese",0,true],
 ["UAH","₴","Grivnia",2,true],["RSD","din","Dinaro serbo",2,true],
 ["ALL","L","Lek",0,true],["TRY","₺","Lira turca",2,false],
 ["RUB","₽","Rublo",2,true],["ILS","₪","Shekel",2,false],
 ["AED","AED","Dirham",2,false],["SAR","SAR","Riyal",2,false],
 ["QAR","QAR","Riyal qatariota",2,false],["EGP","EGP","Sterlina egiziana",2,false],
 ["MAD","MAD","Dirham marocchino",2,true],["TND","TND","Dinaro tunisino",3,true],
 ["DZD","DZD","Dinaro algerino",2,true],["ZAR","R","Rand",2,false],
 ["NGN","₦","Naira",2,false],["KES","KSh","Scellino keniota",2,false],
 ["GHS","₵","Cedi",2,false],["ETB","Br","Birr",2,false],
 ["XOF","CFA","Franco CFA (ovest)",0,true],["XAF","CFA","Franco CFA (centro)",0,true],
 ["PKR","₨","Rupia pakistana",2,false],["BDT","৳","Taka",2,false],
 ["LKR","₨","Rupia srilankese",2,false],["NPR","₨","Rupia nepalese",2,false],
 ["IDR","Rp","Rupia indonesiana",0,false],["PHP","₱","Peso filippino",2,false],
 ["THB","฿","Baht",2,false],["VND","₫","Dong",0,true],
 ["MYR","RM","Ringgit",2,false],["SGD","$","Dollaro di Singapore",2,false],
 ["AZN","₼","Manat",2,true],["GEL","₾","Lari",2,true],
 ["AMD","֏","Dram",0,true],["KZT","₸","Tenge",0,true]
];
window.VALUTE=VALUTE;

function paeseDi(k){return PAESI.find(p=>p[0]===String(k||"").toUpperCase())||PAESI[0];}
function valutaDi(k){return VALUTE.find(v=>v[0]===String(k||"").toUpperCase())||VALUTE[0];}
window.paeseDi=paeseDi;window.valutaDi=valutaDi;

/* Quello che la persona ha scelto, con i ripieghi giusti: paese
   Italia, valuta e unità proposte dal paese. */
function ilPaese(){return paeseDi((S.profile&&S.profile.paese)||"IT");}
function laValuta(){return valutaDi((S.profile&&S.profile.valuta)||ilPaese()[2]);}
function leUnita(){
  const u=(S.profile&&S.profile.unita)||ilPaese()[3];
  return (u==="imperiale")?"imperiale":"metrico";}
window.ilPaese=ilPaese;window.laValuta=laValuta;window.leUnita=leUnita;
function imperiale(){return leUnita()==="imperiale";}
window.imperiale=imperiale;

/* Il paese proposto al primo avvio: lo dice il telefono, non lo
   indoviniamo noi. `navigator.language` porta spesso la regione
   («it-CH», «en-US»); se non c'è, si prova il fuso orario, che è
   l'unico altro indizio onesto. In mancanza di entrambi: Italia,
   perché è il mercato da cui si parte — e comunque la persona vede
   la risposta e la può cambiare in un tocco. */
function paeseSuggerito(){
  try{
    const l=(navigator.languages&&navigator.languages[0])||navigator.language||"";
    const m=/[-_]([A-Za-z]{2})$/.exec(l);
    if(m){const k=m[1].toUpperCase();if(PAESI.some(p=>p[0]===k))return k;}
    const tz=(Intl.DateTimeFormat().resolvedOptions()||{}).timeZone||"";
    const perTz={"Europe/Rome":"IT","Europe/London":"GB","Europe/Paris":"FR",
      "Europe/Madrid":"ES","Europe/Berlin":"DE","Europe/Zurich":"CH",
      "America/New_York":"US","America/Chicago":"US","America/Denver":"US",
      "America/Los_Angeles":"US","America/Toronto":"CA","Australia/Sydney":"AU"};
    if(perTz[tz])return perTz[tz];
  }catch(e){}
  return "IT";}
window.paeseSuggerito=paeseSuggerito;

/* ── I VESTITI DEI NUMERI ──────────────────────────────────────────
   Un numero salvato è metrico; queste funzioni lo vestono per chi
   legge. Vanno sempre in coppia con quelle che spogliano (più sotto):
   se una schermata mostra libbre e rilegge chili, il peso della
   persona raddoppia — ed è il tipo di errore che nessuno vede finché
   non è nel calcolo del fabbisogno. */
const LB_PER_KG=2.2046226218, OZ_PER_G=0.03527396195, INCH_PER_CM=0.3937007874;

/* ── LA VIRGOLA SEGUE LA LINGUA, NON IL PAESE ─────────────────────
   Un italiano che vive a Boston legge l'app in italiano e pesa in
   libbre: «176,4 lb», non «176.4 lb». Il separatore decimale è una
   convenzione della LINGUA in cui si scrive la frase; l'unità è una
   convenzione del POSTO in cui si vive. Sono due cose diverse e qui
   si tengono separate, esattamente come già fa `soldiTxt` con i
   prezzi poco più sotto. Un punto inglese dentro una frase italiana è
   un dettaglio che si nota e fa sembrare l'app tradotta a metà. */
function dec2loc(t){
  return (typeof LANG!=="undefined"&&LANG==="en")?t:String(t).replace(".",",");}
window.dec2loc=dec2loc;

function pesoTxt(kg,dec){
  const n=parseFloat(kg);if(!isFinite(n))return "";
  const d=(dec==null)?1:dec;
  return imperiale()
    ? dec2loc((n*LB_PER_KG).toFixed(d))+" lb"
    : dec2loc(n.toFixed(d))+" kg";}
function altTxt(cm){
  const n=parseFloat(cm);if(!isFinite(n))return "";
  if(!imperiale())return Math.round(n)+" cm";
  const tot=n*INCH_PER_CM, ft=Math.floor(tot/12), inch=Math.round(tot-ft*12);
  return (inch===12)?(ft+1)+"'0\"":ft+"'"+inch+'"';}
function grammiTxt(g){
  const n=parseFloat(g);if(!isFinite(n))return "";
  if(!imperiale())return Math.round(n)+" g";
  const oz=n*OZ_PER_G;
  return dec2loc(oz<1?oz.toFixed(1):Math.round(oz))+" oz";}
function volumeTxt(ml){
  const n=parseFloat(ml);if(!isFinite(n))return "";
  if(!imperiale())return Math.round(n)+" ml";
  return Math.round(n/29.5735)+" fl oz";}
/* ── E IL NUMERO NUDO ──────────────────────────────────────────────
   Quando l'unità sta già altrove — nell'etichetta di un campo, nel
   titolo di una tabella, nell'intestazione di una colonna — ripeterla
   accanto a ogni numero fa rumore: «176,4 lb · 172,0 lb · 165,0 lb»
   in tre caselle larghe un pollice. Queste danno il numero convertito
   e basta, e l'unità la dice una volta chi le chiama.
   Conversione identica a quella delle sorelle vestite: se un giorno
   cambia una, cambia l'altra. */
function pesoNum(kg,dec){
  const n=parseFloat(kg);if(!isFinite(n))return null;
  const d=(dec==null)?1:dec;
  return +(imperiale()?(n*LB_PER_KG):n).toFixed(d);}
function lunghNum(cm,dec){
  const n=parseFloat(cm);if(!isFinite(n))return null;
  const d=(dec==null)?1:dec;
  return +(imperiale()?(n*INCH_PER_CM):n).toFixed(d);}
window.pesoNum=pesoNum;window.lunghNum=lunghNum;
window.pesoTxt=pesoTxt;window.altTxt=altTxt;
window.grammiTxt=grammiTxt;window.volumeTxt=volumeTxt;

/* ── E QUELLE CHE SPOGLIANO ────────────────────────────────────────
   Leggono quello che una persona scrive nella SUA unità e
   restituiscono metrico, che è l'unica cosa che finisce nello stato.
   Accettano anche l'unità scritta a mano («170 lb», «5'9"»), perché
   chi cambia paese scrive quello che ha in testa. */
function pesoIn(v){
  const t=String(v==null?"":v).trim().toLowerCase().replace(",",".");
  const n=parseFloat(t);if(!isFinite(n))return null;
  if(/lb|libbr|pound/.test(t))return n/LB_PER_KG;
  if(/kg|chil/.test(t))return n;
  return imperiale()?n/LB_PER_KG:n;}
function altIn(v){
  const t=String(v==null?"":v).trim().toLowerCase().replace(",",".");
  /* 5'9" · 5 ft 9 · 5'9 — i piedi con i pollici, come si scrivono */
  const m=/^(\d+)\s*(?:'|’|ft|piedi)\s*(\d+(?:\.\d+)?)?/.exec(t);
  if(m)return ((+m[1])*12+(+(m[2]||0)))/INCH_PER_CM;
  const n=parseFloat(t);if(!isFinite(n))return null;
  if(/cm/.test(t))return n;
  if(/in|pollic|"/.test(t))return n/INCH_PER_CM;
  return imperiale()?n/INCH_PER_CM:n;}
window.pesoIn=pesoIn;window.altIn=altIn;

/* ── UNA CIRCONFERENZA NON È UN'ALTEZZA (28/08) ────────────────────
   Sembrano la stessa cosa — sono entrambe centimetri — e invece si
   scrivono in due modi diversi. Un'altezza in imperiale sono piedi e
   pollici (5'10"); un girovita sono pollici e basta (34 in), perché
   nessuno dice «due piedi e dieci di vita». Passare `altTxt()` a una
   circonferenza darebbe «2'10"», che è aritmeticamente giusto e
   completamente sbagliato da leggere. Da qui due funzioni. */
function lunghTxt(cm,dec){
  const n=parseFloat(cm);if(!isFinite(n))return "";
  if(!imperiale())return dec2loc(dec?n.toFixed(dec):Math.round(n))+" cm";
  const inch=n*INCH_PER_CM;
  return dec2loc(dec?inch.toFixed(dec):Math.round(inch))+" in";}
function lunghIn(v){
  const t=String(v==null?"":v).trim().toLowerCase().replace(",",".");
  const n=parseFloat(t);if(!isFinite(n))return null;
  if(/cm/.test(t))return n;
  if(/in|pollic|"/.test(t))return n/INCH_PER_CM;
  return imperiale()?n/INCH_PER_CM:n;}
window.lunghTxt=lunghTxt;window.lunghIn=lunghIn;

/* ── I LITRI D'ACQUA ───────────────────────────────────────────────
   L'obiettivo dell'acqua si scrive in litri, con lo 0,25 come passo.
   In imperiale i litri non esistono nella testa di nessuno: si conta
   in fl oz (2 L ≈ 68 fl oz). Non si passa ai galloni: un gallone
   d'acqua al giorno è la misura di uno scherzo, non di un obiettivo. */
const FLOZ_PER_L=33.8140226;
/* ── UN RAPPORTO SI CONVERTE SOPRA E SOTTO (28/08) ─────────────────
   «35 ml per kg» non è un volume: è un volume DIVISO un peso. Vestire
   solo il numeratore dà «1 fl oz per lb», che sembra giusto e sbaglia
   di 2,2 volte — il fabbisogno d'acqua raddoppiato, scritto nella riga
   che spiega come si calcola il fabbisogno d'acqua. È lo stesso
   errore delle valute, con la differenza che qui la conversione si
   può fare, e allora va fatta per intero:
     35 ml/kg → 35 × 0,0338 fl oz ÷ 2,2046 lb ≈ 0,5 fl oz/lb. */
function volPerPesoTxt(mlPerKg){
  const n=parseFloat(mlPerKg);if(!isFinite(n))return "";
  if(!imperiale())return Math.round(n)+" ml";
  const flozPerLb=(n/29.5735296)/LB_PER_KG;
  return dec2loc(Math.round(flozPerLb*100)/100)+" fl oz";}
window.volPerPesoTxt=volPerPesoTxt;

function litriTxt(L,dec){
  const n=parseFloat(L);if(!isFinite(n))return "";
  if(imperiale())return Math.round(n*FLOZ_PER_L)+" fl oz";
  /* la virgola decimale segue la LINGUA, non il paese — come i soldi
     poco più sotto: chi usa l'app in italiano legge «2,56 L» anche a
     Boston. Senza questa riga il punto inglese entrava in una frase
     italiana, e ci era già entrato una volta. */
  return dec2loc((dec==null)?String(n):n.toFixed(dec))+" L";}
function litriIn(v){
  const t=String(v==null?"":v).trim().toLowerCase().replace(",",".");
  const n=parseFloat(t);if(!isFinite(n))return null;
  if(/fl\s*oz|oz/.test(t))return n/FLOZ_PER_L;
  if(/\bl\b|litr|liter/.test(t))return n;
  return imperiale()?n/FLOZ_PER_L:n;}
window.litriTxt=litriTxt;window.litriIn=litriIn;

/* ── LE DISTANZE ───────────────────────────────────────────────────
   Camminate e corse: km o miglia. Serve poco (una frase di esempio e
   il racconto degli allenamenti), ma un «4 km» a un americano è un
   numero che deve tradurre a mente per capire se è tanto o poco. */
const MI_PER_KM=0.621371192;
function distTxt(km,dec){
  const n=parseFloat(km);if(!isFinite(n))return "";
  const d=(dec==null)?1:dec;
  return dec2loc(imperiale()?(+(n*MI_PER_KM).toFixed(d)):(+n.toFixed(d)))+
    (imperiale()?" mi":" km");}
function distIn(v){
  const t=String(v==null?"":v).trim().toLowerCase().replace(",",".");
  const n=parseFloat(t);if(!isFinite(n))return null;
  if(/km|chilom/.test(t))return n;
  if(/\bmi\b|migli|mile/.test(t))return n/MI_PER_KM;
  return imperiale()?n/MI_PER_KM:n;}
window.distTxt=distTxt;window.distIn=distIn;

/* ── LA DERIVA DEL RITORNO, E COME SI FERMA (28/08) ────────────────
   Vestire un numero lo arrotonda: 92 cm diventa «36 in», e 36 in
   riletti fanno 91,4 cm. Chi apre il profilo, non tocca niente e
   salva, si ritrova il girovita spostato di mezzo centimetro — e la
   volta dopo di un altro po'. Il peso è peggio, perché si salva ogni
   giorno: 80 kg → «176,4 lb» → 80,014 kg → «176,4 lb» → …
   È una deriva silenziosa: nessun errore, nessun avviso, e il grafico
   dello storico che si muove da solo.

   La regola: **se il numero VESTITO non è cambiato, la persona non ha
   cambiato niente — e il dato salvato resta quello di prima.** Si
   riscrive solo quando è stato scritto davvero qualcosa di diverso.
   Vale in metrico quanto in imperiale (79,96 e 80,0 si mostrano
   uguali con un decimale). */
function senzaDeriva(letto,vecchio,vesti){
  if(letto==null||!isFinite(letto))return null;
  if(vecchio==null||!isFinite(vecchio))return letto;
  try{if(vesti(vecchio)===vesti(letto))return vecchio;}catch(e){}
  return letto;}
window.senzaDeriva=senzaDeriva;

/* le etichette dei campi, che devono dire in che unità si scrive */
function unitaPeso(){return imperiale()?"lb":"kg";}
function unitaAlt(){return imperiale()?"ft/in":"cm";}
function unitaLungh(){return imperiale()?"in":"cm";}
function unitaVol(){return imperiale()?"fl oz":"L";}
function unitaDist(){return imperiale()?"mi":"km";}
/* I MACRO RESTANO IN GRAMMI, ANCHE IN IMPERIALE: le etichette
   nutrizionali americane sono in grammi. Non è una dimenticanza, ed è
   scritto qui perché è la prima cosa che verrebbe «corretta». */
function unitaMacro(){return "g";}
window.unitaPeso=unitaPeso;window.unitaAlt=unitaAlt;
window.unitaLungh=unitaLungh;window.unitaVol=unitaVol;
window.unitaDist=unitaDist;window.unitaMacro=unitaMacro;

/* ── I SOLDI ───────────────────────────────────────────────────────
   Si scrive un prezzo nella valuta della persona, e basta: nessuna
   conversione, nessun tasso, nessun «≈». Il separatore segue la
   lingua dell'interfaccia, non il paese: chi usa l'app in italiano
   legge 1.234,56 anche a Londra, ed è quello che si aspetta. */
function soldiTxt(v,valuta){
  const n=parseFloat(v);if(!isFinite(n))return "";
  const V=valuta?valutaDi(valuta):laValuta();
  const lang=(typeof LANG!=="undefined"&&LANG==="en")?"en-GB":"it-IT";
  let s;
  try{s=n.toLocaleString(lang,{minimumFractionDigits:V[3],maximumFractionDigits:V[3]});}
  catch(e){s=n.toFixed(V[3]);}
  return V[4]?(s+" "+V[1]):(V[1]+s);}
window.soldiTxt=soldiTxt;

/* ── QUELLO CHE IL MODELLO DEVE SAPERE ─────────────────────────────
   Tre fatti e un divieto. I fatti servono a rispondere alla domanda
   vera di chi fa la spesa: «con questi soldi, qui, adesso, cosa
   compro?» — che non è una conversione, è conoscenza del posto.
   Il divieto serve perché la tentazione di convertire c'è sempre. */
function paeseForAI(){
  const P=ilPaese(),V=laValuta();
  const anno=new Date().getFullYear();
  return " DOVE SIAMO: "+P[1]+" ("+P[0]+"), anno "+anno+", valuta "+V[0]+" ("+V[2]+")."+
    " Prezzi, prodotti e formati delle confezioni sono quelli che si trovano in "+P[1]+" oggi."+
    " NON convertire valute, non citare tassi di cambio, non tradurre prezzi da altri paesi:"+
    " ragiona direttamente nei prezzi locali."+
    unitaForAI();}
window.paeseForAI=paeseForAI;

/* ── LE UNITÀ AL MODELLO: DUE COSE DIVERSE (28/08) ─────────────────
   Questa era una trappola, e l'aveva armata la v15.0.0: la riga sulle
   unità diceva soltanto «scrivi le quantità in once e libbre», e
   arrivava anche dentro `rulesForPlan()`. Ma il piano torna come JSON
   con dei CAMPI NUMERICI — k, p, c, f, fib, z — e quelli sono kcal e
   GRAMMI di macronutrienti: ci lavorano il conto delle proteine, la
   validazione della settimana, il bilancio della giornata. Un modello
   che leggeva «scrivi in once» poteva rispondere `p:1.1` (once di
   proteine) invece di `p:31`: nessun errore, nessuna eccezione, solo
   un piano che sbaglia le proteine di 28 volte. E nello stesso prompt
   c'era già scritto «porzioni in grammi sempre indicate»: due ordini
   opposti nella stessa richiesta, con il modello a scegliere quale.

   La distinzione giusta non è «metrico o imperiale», è **testo o
   numero**:
   · i CAMPI NUMERICI del contratto sono un formato di scambio, e un
     formato di scambio ha una unità sola — sempre metrica, per tutti;
   · il TESTO che legge la persona (la descrizione del pasto, la lista
     della spesa) va nelle sue unità, perché è lì che serve.

   I macronutrienti restano in grammi ANCHE a schermo, e non è una
   dimenticanza: le etichette nutrizionali americane sono in grammi,
   «31 g di proteine» è la forma che un americano legge sulla
   confezione. Si vestono le PORZIONI (6 oz di pollo), non i macro. */
function unitaForAI(){
  return imperiale()
    ? " UNITÀ. Nel TESTO che legge la persona — descrizione dei pasti, lista della spesa —"+
      " scrivi le porzioni in once (oz) e libbre (lb) e i liquidi in fl oz o cup, come si usa in cucina lì."+
      " I MACRONUTRIENTI restano in grammi anche nel testo (è la forma delle etichette nutrizionali)."+
      " I CAMPI NUMERICI del JSON sono un formato di scambio e restano SEMPRE metrici:"+
      " kcal per l'energia, grammi per proteine, carboidrati, grassi, fibre e zuccheri. Mai once nei numeri."
    : " UNITÀ: sistema metrico — grammi e millilitri, sia nel testo sia nei campi numerici.";}
window.unitaForAI=unitaForAI;
