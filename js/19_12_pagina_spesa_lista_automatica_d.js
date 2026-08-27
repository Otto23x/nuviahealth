/* ═══════════════════════════════════════════════════════════════
   12. PAGINA SPESA (lista automatica dal piano, link supermercato, sostituzioni AI, WhatsApp)
   ═══════════════════════════════════════════════════════════════ */
/* Costruisce il link di ricerca: usa il modello personale se impostato
   (con {q} = termine pulito e codificato), altrimenti apre solo la home
   del sito del TUO supermercato (nessun link indovinato). */
function shopLink(text){
  const q=encodeURIComponent(shopQ(text));
  const tpl=shopTplNow();
  if(tpl&&tpl.includes("{q}"))return safeUrl(tpl.replace("{q}",q));
  return "";}
function shopQ(t){ // pulizia testo per la ricerca sul sito del supermercato
  return t.replace(/\(.*?\)/g,"").replace(/~|≈/g,"")
    .replace(/\b(crudi|crudo|crude|cruda|secca|secchi|freschi|fresco|SENZA|senza|surgelati|surgelata|opz\.?)\b/gi,"")
    .replace(/[0-9]+([.,][0-9]+)?\s*(g|kg|l|ml|pz)?/gi,"").replace(/[—–-].*$/,"")
    .replace(/\s+/g," ").trim();}
/* ── ALTERNATIVA AL PRODOTTO ─────────────────────────────────────────
   Le alternative non sono più un testo da leggere: si scelgono. Quella
   scelta sostituisce il prodotto in lista E nei pasti del piano che lo
   usavano — perché una spesa cambiata senza piano aggiornato è una
   bugia che si scopre a cena. */
window.subAI=async(txt,ci,ii)=>{
  if(!aiOn())return aiFail(new Error("nokey"));
  try{
    const j=await aiQuiet(()=>aiAskJSON('Al supermercato è esaurito: "'+txt+'". Proponi 3 alternative acquistabili in un supermercato italiano, coerenti con le caratteristiche alimentari dichiarate, con quantità equivalente dal punto di vista nutrizionale. '+dietStr()+
      ' Rispondi SOLO JSON: {"alt":[{"prodotto":"nome con quantità","perche":"motivo in massimo 12 parole"}]}',"sub"));
    const alt=(j&&Array.isArray(j.alt)?j.alt:[]).filter(x=>x&&x.prodotto).slice(0,3);
    if(!alt.length)throw new Error("Nessuna alternativa utile");
    const scelta=await dlgChoice("Al posto di: "+prodottoPrima(txt),
      alt.map(a=>[a.prodotto,a.prodotto+(a.perche?" — "+a.perche:"")]));
    if(!scelta)return;
    if(ci==null)return dlgAlert(tr("Alternativa scelta: {s}",{s:scelta}));
    await sostituisciProdotto(ci,ii,txt,scelta);
  }catch(e){aiFail(e);}};

/* La sostituzione vera: lista, poi i pasti del piano che contenevano
   l'ingrediente, ristimati con i valori reali del sostituto. */
async function sostituisciProdotto(ci,ii,vecchio,nuovo){
  ensureCustomShop();
  const cat=S.customShop[ci];
  if(cat&&cat[1]&&cat[1][ii]!=null)cat[1][ii]=nuovo;
  S.shop={};save();render("spesa");
  const key=ingrKey(vecchio);
  const tocca=[];
  PLAN.forEach((d,di)=>{(d.meals||[]).forEach((m,mi)=>{
    const o=(m.o&&m.o[0])?m.o[0]:null;if(!o||!o.d)return;
    if(shopParts(o.d).some(part=>ingrKey(part)===key))tocca.push({di,mi,o,giorno:d.day,pasto:m.n});});});
  if(!tocca.length){toast(tr("Sostituito in lista ✓"));return;}
  if(!await dlgConfirm(tr("Sostituito in lista.\n\n«{a}» compare in {b}{c}: lo aggiorno con «{d}» e ricalcolo i valori?",{a:prodottoPrima(vecchio),b:tocca.length,c:(tocca.length===1?" pasto del piano":" pasti del piano"),d:prodottoPrima(nuovo)}),
      {ok:tr("Sì, aggiorna il piano"),ko:tr("No, solo la lista")}))return;
  const box=document.getElementById("shopOut");
  try{
    const j=await aiAskJSON('In questi pasti sostituisci "'+vecchio+'" con "'+nuovo+'", adattando la grammatura per restare il più vicino possibile a kcal e proteine originali. Riscrivi la descrizione completa del piatto con tutte le grammature e ricalcola i valori REALI. '+dietStr()+
      ' Pasti: '+JSON.stringify(tocca.map((t,i)=>({i,piatto:t.o.d,kcal:t.o.k,prot:t.o.p})))+
      ' Rispondi SOLO JSON: [{"i":indice,"d":"nuova descrizione","k":kcal,"p":prot,"c":carb,"f":grassi}]',"sostituzione");
    const arr=Array.isArray(j)?j:(j&&j.pasti);
    if(!Array.isArray(arr)||!arr.length)throw new Error("Non sono riuscito ad aggiornare i pasti");
    let n=0;
    arr.forEach(x=>{
      const t=tocca[+x.i];if(!t||!x.d)return;
      t.o.d=String(x.d);
      if(+x.k)t.o.k=Math.round(+x.k);
      if(+x.p)t.o.p=Math.round(+x.p);
      if(+x.c)t.o.c=Math.round(+x.c);
      if(+x.f)t.o.f=Math.round(+x.f);
      t.o.fib=estFiberOf(t.o.d);t.o.z=estSugarOf(t.o.d);
      n++;});
    if(!n)throw new Error("Nessun pasto aggiornato");
    S.customPlan=PLAN;pianoCambiato();save();render("spesa");
    dlgAlert(tr("Fatto: «{a}» è in lista e ha sostituito «{b}» in {c}{d} del piano. Le giornate si sono aggiornate di conseguenza.",{a:prodottoPrima(nuovo),b:prodottoPrima(vecchio),c:n,d:(n===1?" pasto":" pasti")}));
  }catch(e){aiFail(e);}}
/* La lista base SHOP appartiene alla dieta standard: finché l'utente non ha un
   piano, la spesa resta vuota e si popola solo dopo la sincronizzazione. */
const SHOPCUR=()=>{
  if(S.customShop)return S.customShop;      /* anche se svuotata del tutto: resta vuota */
  if(planIsEmpty())return [];
  if(!S.customPlan)return SHOP;             /* la lista base vale SOLO per il piano standard */
  return buildShopFromPlan();               /* piano personalizzato: ingredienti del TUO piano */
};
/* Genera la lista della spesa dal piano attuale (per i piani personalizzati) */
/* Un solo comando per costruire la spesa: parte dagli ingredienti del piano e,
   se l'AI è disponibile e il piano è personalizzato, li raggruppa e ne stima
   le quantità. Senza AI resta il calcolo diretto dagli ingredienti. */

/* -- LA SPIA SI SPEGNE SEMPRE (founder, 27/08) -------------------
   «Dopo la generazione del piano resta per molto tempo il messaggio
   dell'AI che sta lavorando per la lista della spesa.»
   Restava perche' qui si accendeva l'indicatore (aiLungoOn) e non lo
   spegneva NESSUNA delle sei uscite di questa funzione: ne' quella
   buona, ne' l'annullamento, ne' i tre ritorni anticipati, ne'
   l'errore. Ogni lista della spesa lasciava indietro un'attesa che
   per l'app non era mai finita - e la spia le somma, quindi restava
   accesa per sempre.
   L'accensione sta qui, lo spegnimento in un `finally`: cosi' non
   dipende da quale strada prende il codice. */
window.genShop=async(silent)=>{
  aiLungoOn();
  try{return await genShopCore(silent);}
  finally{try{aiLungoOff();}catch(_){}}};
/* Quanto si aspetta la lista prima di farsela da soli: la spesa non
   e' il piano, e nessuno deve restare fermo due minuti per una lista
   che sappiamo gia' ricostruire dagli ingredienti dei piatti. */
const SPESA_MS=90000;
function conScadenza(promessa,ms){
  let orologio=null;
  return Promise.race([
    Promise.resolve(promessa).finally(()=>{if(orologio)clearTimeout(orologio);}),
    new Promise((_,no)=>{orologio=setTimeout(()=>no(new Error("timeout")),ms||SPESA_MS);})]);}
async function genShopCore(silent){
  /* Senza AI la lista si costruisce comunque, dagli ingredienti del
     piano: «si aggiorna da sola» deve valere per tutti, non solo per
     chi ha la chiave. */
  if(!aiOn()){
    if(silent){try{if(!planIsEmpty()){S.customShop=buildShopFromPlan();S.shop={};save();if(cur==="spesa")render("spesa");}}catch(_){/* la lista resta quella di prima */}return null;}
    return aiFail(new Error("nokey"));}
  if(!silent&&!await dlgConfirm(tr("Genero la lista della spesa dal piano attuale? Sostituisce quella corrente.")))return;
  try{
    /* i pasti fuori casa entrano nella spesa solo se te li prepari tu */
    const meals=shopWindow().map(w=>{
      const o=shopOptOf(w.d,w.m);return o?o.d:null;}).filter(Boolean);
    if(!meals.length)return silent?null:dlgAlert(tr("Non ci sono pasti da comprare nei prossimi 7 giorni."));
    /* Due tentativi anche sulla LETTURA della risposta: il piano riprova
       giorno per giorno, la spesa faceva un tentativo solo e al primo
       formato storto si arrendeva. */
    let arr=null,ultimo=null;
    for(let att=0;att<2&&!arr;att++){
      try{
    const t=await conScadenza(aiAsk("Da questi pasti dei prossimi 7 giorni ("+shopWindowLabel()+") crea la lista della spesa SETTIMANALE"+dispensaForShop()+((!shopForMe()&&(S.family||[]).length)?" per "+(Math.round(famUnits()*100)/100)+" porzioni di riferimento (donna adulta=1, uomo=1,25, adolescente=1,10, bambino=0,75, infante=0,50)":" per UNA persona")+
      " con le quantita totali stimate. Sono già esclusi i pasti in mensa e quelli fuori casa: non aggiungere nulla per quelli. Raggruppa gli stessi ingredienti in una voce sola con la quantità totale della settimana. "+
      "Scrivi SOLO il nome del prodotto e la quantità totale della settimana, senza formati commerciali, senza numero di confezioni e senza indicazioni fra parentesi su come distribuirla: chi compra sa già come si vende. "+dietStr()+" Non inserire alimenti incompatibili con l'impostazione alimentare, le intolleranze o le esclusioni dichiarate. Usa ESCLUSIVAMENTE queste categorie, nell'ordine dato, saltando quelle vuote: "+JSON.stringify(SHOP_CATS)+". Ogni prodotto va nella categoria giusta per la sua natura (es. lo yogurt in 'Uova e latticini', il pane in 'Cereali, pane e derivati', le patate in 'Verdura'). Rispondi SOLO con un JSON array di coppie [categoria, [prodotti]]. Pasti: "+JSON.stringify(meals)));
    const o=parseAIJSON(t);
    if(!Array.isArray(o)||!o.length)throw new Error("formato non valido");
    /* La pulizia era scritta due volte, qui e in normSpesaAI, e solo
       una delle due ha imparato a leggere le voci-oggetto: e' cosi'
       che nascono i «[object Object]» in una strada e non nell'altra.
       Adesso il normalizzatore e' uno solo. */
    const pulita=(typeof normSpesaAI==="function")?normSpesaAI(o):null;
    if(!pulita||!pulita.length)throw new Error("formato non valido");
    arr=pulita;
      }catch(e){ultimo=e;if(att===0)await wait(900);}
    }
    if(!arr)throw (ultimo||new Error("formato non valido"));
    S.customShop=arr;
    S.shop={};save();render("spesa");if(!silent)toast(tr("Lista della spesa generata ✓"));
  }catch(e){return shopRipiego(e,silent);}};

/* ═══ LA SPESA CHE HAI FATTO ════════════════════════════════════════
   Fotografi lo scontrino, l'app riconosce i prodotti e li mette in
   dispensa. Da lì costruisce i pasti finché il cibo basta, dà un voto
   alla spesa rispetto alle linee guida OMS e dice cosa manca.
   Gli scontrini si sommano: ogni nuova spesa allunga la copertura. */
const SPESA_CAT=["verdura","frutta","proteine","cereali","latticini","grassi buoni","dispensa","dolci e snack","bevande","altro"];
function pantry(){
  S.pantry=Object.assign({items:[],voti:[],freezer:[]},S.pantry||{});
  if(!Array.isArray(S.pantry.items))S.pantry.items=[];
  if(!Array.isArray(S.pantry.voti))S.pantry.voti=[];
  if(!Array.isArray(S.pantry.freezer))S.pantry.freezer=[];
  return S.pantry;}
function pantryKey(n){return String(n||"").toLowerCase().trim().replace(/\s+/g," ");}
/* Somma le quantità dei prodotti uguali invece di duplicarli */
function pantryAdd(list){
  const p=pantry(),oggi=iso(new Date());
  (list||[]).forEach(x=>{
    const n=String(x.nome||"").trim();if(!n)return;
    const k=pantryKey(n);
    const ex=p.items.find(i=>pantryKey(i.n)===k);
    const q=parseFloat(String(x.qta).replace(",","."))||0;
    const eu=Math.round((parseFloat(String(x.prezzo).replace(",","."))||0)*100)/100;
    if(ex){ex.q=Math.round(((+ex.q||0)+q)*100)/100;ex.d=oggi;if(eu)ex.e=Math.round(((+ex.e||0)+eu)*100)/100;}
    else p.items.push({n:prodottoPrima(n),q:q,u:String(x.unita||"").trim()||"pz",cat:SPESA_CAT.includes(x.categoria)?x.categoria:"altro",d:oggi,e:eu||0});
  });
  save();}
window.pantryDel=(i)=>{const p=pantry();p.items.splice(i,1);save();render("spesa");};
window.pantrySvuota=async()=>{
  if(!await dlgConfirm(tr("Svuoto la dispensa?\n\nI prodotti registrati dagli scontrini verranno rimossi. Gli scontrini futuri ripartiranno da zero."),{ok:tr("Svuota"),ko:trBtn("Annulla")}))return;
  const p=pantry();p.items=[];save();render("spesa");toast(tr("Dispensa svuotata"));};

/* ── Il voto alla spesa ────────────────────────────────────────────
   Non è un giudizio morale: è la distanza fra quello che hai comprato
   e le proporzioni che l'OMS raccomanda. Serve a imparare a fare la
   spesa, che è dove la dieta si decide davvero. */
/* ── IL COSTO DELLA SPESA ────────────────────────────────────────────
   I prezzi arrivano dallo scontrino: sono una STIMA (offerte, sconti e
   OCR sbagliano), quindi si mostrano come tali e restano correggibili.
   Il costo per pasto usa gli slot veri del piano, non un numero fisso. */
function spesaCosto(){
  const p=pantry();
  const conPrezzo=p.items.filter(i=>+i.e>0);
  if(!conPrezzo.length)return null;
  const tot=Math.round(conPrezzo.reduce((a,i)=>a+(+i.e||0),0)*100)/100;
  const pastiSett=planSlots().length*7;
  const perPasto=Math.round(tot/pastiSett*100)/100;
  const perGiorno=Math.round(tot/7*100)/100;
  /* quanto pesa ogni categoria: serve a dire DOVE vanno i soldi */
  const perCat={};
  conPrezzo.forEach(i=>{perCat[i.cat]=Math.round(((perCat[i.cat]||0)+(+i.e||0))*100)/100;});
  const top=Object.keys(perCat).sort((a,b)=>perCat[b]-perCat[a]).slice(0,3).map(k=>({cat:k,eu:perCat[k],pc:Math.round(perCat[k]/tot*100)}));
  const noti=conPrezzo.length,manca=p.items.length-noti;
  return {tot,perPasto,perGiorno,pastiSett,top,noti,manca};}
window.prezzoEdit=async(k)=>{
  const p=pantry(),it=p.items[k];if(!it)return;
  const v=await dlgPrompt(tr("Quanto è costato «{n}»? (euro)",{n:it.n}),it.e||"");
  if(v==null)return;
  const eu=Math.round((parseFloat(String(v).replace(",","."))||0)*100)/100;
  it.e=eu;save();render(cur);};
/* ── IL CARRELLO COPRE LA SETTIMANA? ─────────────────────────────────
   Il voto diceva se la spesa era sana, non se BASTA. Qui si confronta
   quello che i pasti dei prossimi 7 giorni richiedono con quello che è
   davvero entrato in casa (scontrino + dispensa + freezer).
   Il confronto è per ingrediente, non per prodotto: «petto di pollo» e
   «pollo a fette» sono la stessa cosa per una cena. */
function spesaCopertura(){
  const p=pantry();
  if(!p.items.length)return null;
  /* 1 · cosa chiede il piano, pasto per pasto */
  const serve={};
  shopWindow().forEach(({d,m,di,mi})=>{
    const o=mealOpt(di,mi)||((m.o&&m.o[0])?m.o[0]:null);
    if(!o||!o.d)return;
    shopParts(o.d).forEach(part=>{
      const k=ingrKey(part);
      if(!k||k.length<3)return;
      const q=parseQty(part);
      serve[k]=serve[k]||{k,g:0,pasti:[],senzaPeso:0};
      if(q&&q.u==="g")serve[k].g+=q.v; else serve[k].senzaPeso++;
      if(serve[k].pasti.length<3)serve[k].pasti.push(d.day+" · "+(m.n||m.slot||""));
    });
  });
  /* 2 · cosa c'è in casa: dispensa, freezer e prodotti durevoli */
  const ho={};
  const aggiungi=(nome,qta,unita)=>{
    const k=ingrKey(nome);if(!k)return;
    ho[k]=ho[k]||{g:0,pezzi:0};
    const q=parseQty(String(qta||"")+String(unita||""))||parseQty(nome);
    if(q&&q.u==="g")ho[k].g+=q.v; else ho[k].pezzi+=(+qta||1);
  };
  p.items.forEach(i=>aggiungi(i.n,i.q,i.u));
  (p.freezer||[]).forEach(f=>aggiungi(f.n,f.q,""));
  /* 3 · confronto */
  const manca=[],scarso=[],avanza=[];
  Object.values(serve).forEach(r=>{
    const c=ho[r.k];
    if(!c){manca.push(r);return;}
    if(r.g>0&&c.g>0&&c.g<r.g*0.7)scarso.push(Object.assign({},r,{hai:c.g}));
  });
  Object.keys(ho).forEach(k=>{
    if(serve[k])return;
    if(/sale|spezie|olio|aceto|caff|tisan|acqua|zucchero|farina/.test(k))return;   /* scorte, non sprechi */
    avanza.push({k,...ho[k]});
  });
  const richiesti=Object.keys(serve).length;
  const coperti=richiesti-manca.length;
  const pc=richiesti?Math.round(coperti/richiesti*100):0;
  return {pc,richiesti,coperti,manca:manca.slice(0,8),scarso:scarso.slice(0,5),
    avanza:avanza.slice(0,6),mancaTot:manca.length,avanzaTot:avanza.length};}

/* Il testo che l'AI riceve: non «hai speso bene», ma «ti manca questo». */
function coperturaForAI(){
  const c=spesaCopertura();
  if(!c)return "";
  let t=" COPERTURA della spesa sui prossimi 7 giorni: "+c.pc+"% degli ingredienti richiesti è in casa.";
  if(c.manca.length)t+=" MANCANO: "+c.manca.map(m=>m.k+(m.pasti.length?" (serve per: "+m.pasti[0]+")":"")).join("; ")+".";
  if(c.scarso.length)t+=" INSUFFICIENTI: "+c.scarso.map(m=>m.k+" (servono ~"+Math.round(m.g)+"g, ce ne sono ~"+Math.round(m.hai)+"g)").join("; ")+".";
  if(c.avanza.length)t+=" IN PIÙ rispetto al piano: "+c.avanza.map(a=>a.k).join(", ")+".";
  return t;}
function spesaVoto(){
  const p=pantry();
  if(!p.items.length)return null;
  const n=(c)=>p.items.filter(x=>x.cat===c).length;
  const tot=p.items.length;
  const q=(c)=>Math.round(n(c)/tot*100);
  const vf=q("verdura")+q("frutta"), pr=q("proteine"), ce=q("cereali");
  const dolci=q("dolci e snack"), gb=q("grassi buoni"), lat=q("latticini");
  let v=50;
  /* frutta e verdura: l'OMS ne vuole 400 g al giorno, in un carrello
     sano sono la voce più numerosa */
  v+= vf>=35?25:(vf>=25?15:(vf>=15?5:-15));
  v+= (pr>=15&&pr<=30)?12:(pr>0?4:-10);
  v+= (ce>=8&&ce<=25)?8:0;
  v+= gb>0?7:-3;
  v+= lat>0?4:0;
  v-= dolci>=20?20:(dolci>=12?10:(dolci>=6?3:0));
  v=Math.max(0,Math.min(100,Math.round(v)));
  const piu=[],meno=[];
  if(vf<35)piu.push("verdura e frutta");
  if(pr<15)piu.push("fonti proteiche (pesce, uova, legumi, carne bianca)");
  if(gb===0)piu.push("olio extravergine, frutta secca o semi");
  if(ce<8)piu.push("cereali, meglio integrali");
  if(dolci>=12)meno.push("dolci e snack confezionati");
  if(q("bevande")>=15)meno.push("bevande, se sono zuccherate");
  return {v:v,vf:vf,pr:pr,dolci:dolci,piu:piu,meno:meno,tot:tot};}
function spesaFaccia(v){
  return v>=85?["","Spesa da manuale"]:v>=70?["","Buona spesa"]:
         v>=55?["","Si può migliorare"]:v>=40?["","Sbilanciata"]:["","Da rivedere"];}

/* ── Lettura dello scontrino ──────────────────────────────────── */
window.scontrinoScan=async()=>{
  if(!aiOn())return aiFail(new Error("nokey"));
  if(!await dlgConfirm(tr("Fotografa lo scontrino della spesa.\n\nRiconosco i prodotti e le quantità e li metto in dispensa. Da lì posso costruire i pasti finché il cibo basta, e dirti com'è andata la spesa.\n\nLo scontrino resta sul telefono: viene inviata solo la foto a Gemini con la tua chiave, e non ne conservo copia.")))return;
  const gal=!await dlgConfirm(tr("Da dove prendo la foto?"),{ok:tr(" Scatto ora"),ko:tr(" Dalla galleria")});
  let img=null;
  try{img=await pickPhoto({gallery:gal,multi:false});}catch(e){return;}
  if(!img)return;
  const box=document.getElementById("scoOut");
  if(box){box.style.display="block";genBoxMostra(box);box.textContent="Leggo lo scontrino…";}
  try{
    const t=await aiAsk("Questa è la foto di uno scontrino della spesa italiano. Estrai SOLO i prodotti ALIMENTARI, ignorando detersivi, articoli per la casa, totali, sconti e codici. "+
      "Per ogni prodotto: il nome "+((typeof LANG!=="undefined"&&LANG==="en")?"in English":"in italiano")+" corrente (non la sigla del supermercato: «PT CRUDO 100G» diventa «prosciutto crudo»), la quantità, l'unità e il PREZZO PAGATO in euro (quello effettivo di riga: se c'è uno sconto applicato usa il prezzo scontato; se il prezzo non è leggibile usa 0). "+
      "Se la quantità non è leggibile usa 1 e unità «pz». Assegna a ciascuno UNA categoria fra: "+JSON.stringify(SPESA_CAT)+". "+
      "Rispondi SOLO con questo JSON: {\"prodotti\":[{\"nome\":\"\",\"qta\":0,\"unita\":\"\",\"categoria\":\"\",\"prezzo\":0}]}",[img]);
    const j=parseAIJSON(t);
    const list=(j&&Array.isArray(j.prodotti))?j.prodotti:null;
    if(!list||!list.length)throw new Error("Non sono riuscito a leggere prodotti da questa foto");
    pantryAdd(list);
    if(box)box.style.display="none";genBoxVia();
    render("spesa");
    const v=spesaVoto(),fa=v?spesaFaccia(v.v):null;
    dlgAlert(tr("Letti <b>{a}</b> prodotti e aggiunti alla dispensa.{b}<br><br>Ora puoi chiedere i pasti con <b>Cucina quello che ho</b>: userò quello che c'è, finché basta.",{a:list.length,b:(fa?("<br><br>"+fa[0]+" <b>"+fa[1]+"</b> — voto "+v.v+"/100"):"")}));
  }catch(e){if(box)box.style.display="none";genBoxVia();aiFail(e);}};

/* ── I pasti da quello che hai in casa ─────────────────────────────
   Non si pretende di coprire la settimana: si copre quello che si può,
   e allo scontrino successivo si va avanti. È il modo onesto di farlo. */
/* Da Piano si arriva alla dispensa: la funzione vive in Spesa, ma è lì
   che uno la cerca quando pensa "cosa mangio questa settimana". */
/* Dal Punto al pasto vero, in Oggi: si apre la giornata e si va dritti
   alla card di quel pasto, evidenziata, dove ci sono tutte le funzioni. */
/* Scorciatoia al campo del genere: da «Il tuo corpo» ci si arriva in un
   tocco invece di cercarlo in Profilo. Il campo si illumina e prende il
   fuoco, così si vede subito dov'è. */
/* ── Scelta fra più voci ───────────────────────────────────────────
   Un pannello dal basso con una riga per opzione: su un telefono è più
   comodo di un menù a tendina, e si legge senza aprire nulla. */
function dlgChoice(titolo,voci){
  return new Promise(res=>{
    const w=document.getElementById("moreSheet"),l=document.getElementById("moreList");
    if(!w||!l)return res(null);
    let chiuso=false;
    const fine=(v)=>{if(chiuso)return;chiuso=true;moreClose();setTimeout(()=>res(v),160);};
    l.innerHTML='<div class="sheethd">'+esc(titolo)+'</div>'+
      voci.map((v,i)=>`<button class="sheetrow" data-i="${i}"><span>${esc(v[1])}</span><em>›</em></button>`).join("")+
      '<button class="sheetrow" data-i="-1" style="color:var(--grigio)"><span>'+trBtn("Annulla")+'</span></button>';
    l.querySelectorAll(".sheetrow").forEach(b=>{
      b.onclick=()=>{const i=+b.getAttribute("data-i");fine(i<0?null:voci[i][0]);};});
    const bg=w.querySelector(".sheetbg");
    if(bg)bg.onclick=()=>fine(null);
    w.hidden=false;requestAnimationFrame(()=>w.classList.add("on"));
  });}
/* ── Le azioni della giornata ─────────────────────────────────────
   Prima erano un menù a tendina e un pulsante pieno dentro una riga di
   testo: stonavano. Ora ogni riga ha una scritta a destra che apre una
   scelta, come «Aprine uno ›». */
/* Formato italiano: 13/08/2026. toLocaleDateString cambia a seconda
   della lingua del telefono, e su un dispositivo inglese usciva 8/13. */
function dataIT(iso8601){
  const d=safeDate(String(iso8601||"")+"T12:00:00");
  if(!d)return "";
  const z=n=>String(n).padStart(2,"0");
  return z(d.getDate())+"/"+z(d.getMonth()+1)+"/"+d.getFullYear();}
/* I nomi lunghi degli sport mandano a capo le righe e sfondano le
   colonne strette: si accorciano mantenendo la parola riconoscibile. */
const SPORT_CORTO={
  "allenamento funzionale":"Funzionale","corpo libero":"Corpo libero",
  "camminata veloce":"Camminata","corsa leggera":"Corsa","cyclette":"Cyclette",
  "nuoto libero":"Nuoto","pesi in palestra":"Pesi","sala pesi":"Pesi",
  "bicicletta":"Bici","mountain bike":"MTB","ellittica":"Ellittica",
  "ginnastica dolce":"Ginnastica","stretching e mobilità":"Stretching",
  "arti marziali":"Arti marziali","danza o zumba":"Danza",
  "calcetto o calcio":"Calcio","padel o tennis":"Padel"};
/* Passi: si contano solo quelli IN PIÙ rispetto alla base già inclusa
   nel fabbisogno, altrimenti si conterebbero due volte. Circa 0,04 kcal
   per passo per una persona di 70-80 kg: è una stima grossolana, e
   viene arrotondata alle decine per non fingere una precisione che non
   c'è. */
function stepsKcal(n){
  const w=+S.profile.w||75;
  return Math.round((n*0.0005*w)/10)*10;}
window.stepsSave=(di)=>{
  const e=document.getElementById("stepsDay");if(!e)return;
  const v=Math.max(0,Math.round(+e.value||0));
  S.week.days[di].steps=v||0;save();render("sport");
  const base=(+S.profile.baseSteps>0)?+S.profile.baseSteps:3000;
  const x=Math.max(0,v-base);
  toast(v?(x>0?tr("+{k} kcal dai passi in più",{k:stepsKcal(x)}):tr("Passi salvati · sotto la base, nessuna aggiunta")):tr("Passi rimossi"));};
function sportCorto(n,max){
  const t=String(n||"").trim(); if(!t)return t;
  const k=SPORT_CORTO[t.toLowerCase()];
  if(k)return k;
  const m=max||14;
  return t.length<=m?t:(t.slice(0,m-1).replace(/\s+\S*$/,"")+"…");}
function giorniPeriodo(ap){
  const a=safeDate((ap&&ap.start||"")+"T12:00:00");
  return a?Math.max(1,Math.round((new Date()-a)/864e5)+1):0;}
/* Da quattro popup in fila a un pannello solo: tipo, data (con il
   selettore nativo del telefono), impegno e motivazione stanno insieme
   e si vede tutto quello che si sta per confermare. */
window.periodoApri=()=>periodoSheet();
function perStarsHTML(id,pre){
  return `<div class="pstars" id="${id}">${[1,2,3,4,5].map(n=>`<button type="button" class="${n<=pre?"on":""}" data-n="${n}" onclick="perStarSet('${id}',${n})" aria-label="${n} su 5">★</button>`).join("")}</div>`;}
window.perStarSet=(id,n)=>{
  document.querySelectorAll("#"+id+" button").forEach(b=>b.classList.toggle("on",+b.dataset.n<=n));};
function perStarsVal(id){return document.querySelectorAll("#"+id+" button.on").length||3;}
function periodoSheet(pre){
  if(activePeriod())return dlgAlert(tr("C'è già un periodo aperto ({a}). Da <b>Gestisci</b> puoi chiuderlo o passare all'altro tipo.",{a:periodLabel(activePeriod())}));
  const t0=(pre==="libero")?"libero":"dieta";
  sheetShow("Nuovo periodo",`
    <div class="ckgrid">
      <label class="ck"><input type="radio" name="perT" value="dieta" ${t0==="dieta"?"checked":""} onchange="perTypeUI()"> <b>Dieta</b>${tr("&nbsp;— sei in deficit e vuoi misurarlo")}</label>
      <label class="ck"><input type="radio" name="perT" value="libero" ${t0==="libero"?"checked":""} onchange="perTypeUI()"> <b>Libero</b>${tr("&nbsp;— mantenimento, senza deficit")}</label>
    </div>
    <label style="margin-top:16px">${tr("Da quando")}</label>
    <input type="date" id="perStart" value="${iso(new Date())}" max="${iso(new Date())}">
    <div id="perDieta">
      <label style="margin-top:16px">${tr("Con che impegno parti?")}</label>
      ${perStarsHTML("perStars",4)}
      <label style="margin-top:16px">Motivazione <span style="font-weight:400;color:var(--grigio)">(facoltativa)</span></label>
      <input type="text" id="perNote" placeholder="${tr("Perché cominci, cosa vuoi ottenere")}">
    </div>
    <button class="btn" style="margin-top:16px" onclick="periodoSheetGo()">${tr("Apri il periodo")}</button>`);
  perTypeUI();}
window.perTypeUI=()=>{
  const t=(document.querySelector('input[name="perT"]:checked')||{}).value||"dieta";
  const d=document.getElementById("perDieta");if(d)d.style.display=(t==="libero")?"none":"";};
window.periodoSheetGo=()=>{
  const type=(document.querySelector('input[name="perT"]:checked')||{}).value||"dieta";
  const start=(document.getElementById("perStart")||{}).value||iso(new Date());
  if(!/^\d{4}-\d{2}-\d{2}$/.test(start))return dlgAlert(tr("La data di inizio non è valida."));
  const exp=(type==="libero")?3:perStarsVal("perStars");
  const note=(type==="libero")?"":String((document.getElementById("perNote")||{}).value||"").trim();
  S.periods.push({id:Date.now(),type,n:nextPeriodN(type),start,end:null,
    expStars:Math.max(1,Math.min(5,exp)),expNote:note,endStars:null,endNote:"",aiStars:null,aiText:""});
  save();sheetClose();render(cur);
  toast(periodLabel(S.periods[S.periods.length-1])+" aperto ✓");};
/* L'identificativo NON si passa più dall'onclick: arrivava come testo
   mentre i periodi lo hanno numerico, e «x.id===id» falliva in silenzio.
   Il periodo aperto è uno solo: lo si prende qui. */
window.periodoAzioni=async()=>{
  const ap=activePeriod();if(!ap)return;
  const altro=(ap.type==="libero")?"dieta":"libero";
  const scelta=await dlgChoice("Periodo "+cap(ap.type)+", aperto da "+giorniPeriodo(ap)+(giorniPeriodo(ap)===1?" giorno":" giorni"),[
    ["passa",(altro==="dieta"?" Passa in deficit":" Passa a periodo libero")+" — chiudo questo e apro l'altro"],
    ["soft", (reverseOn()?" Chiudi l'uscita morbida":" Passa all'uscita morbida — risali piano dal deficit")],
    ["vac",  (S.ui.vacanza?"Esci dalla modalità vacanza":"Modalità vacanza — sospendi tutto per qualche giorno")],
    ["fine", " Chiudi il periodo"]]);
  if(scelta==="passa"){
    /* Non si chiede di chiudere prima: chiuderlo È il senso del passaggio.
       Un periodo si chiude e l'altro si apre nello stesso momento. */
    ap.end=iso(new Date());save();
    S.periods.push({id:Date.now(),type:altro,n:nextPeriodN(altro),start:iso(new Date()),end:null,
      expStars:3,expNote:"",endStars:null,endNote:"",aiStars:null,aiText:""});
    save();render(cur);
    return toast(tr("{p} iniziato · il precedente è chiuso",{p:cap(tr(altro==="dieta"?tr("periodo in deficit"):tr("periodo libero")))}));}
  if(scelta==="soft")return reverseToggle();
  if(scelta==="vac")return toggleVacanza();
  if(scelta==="fine")return endPeriod(ap.id);};
/* La nota si scrive da una finestra: un campo di testo alto tre righe
   dentro una riga di elenco romperebbe l'allineamento di tutte. */
window.notaScrivi=(di)=>{
  const ora=String((S.week.days[di]||{}).note||"");
  sheetShow(tr("Nota del giorno"),`
    <div class="hint" style="margin-top:0">${tr("Fame, imprevisti, come ti sentivi: quello che i numeri non dicono. La leggerà anche l'analisi di fine settimana.")}</div>
    <textarea id="notaTxt" rows="4" style="margin-top:12px" placeholder="${tr("Com'è andata oggi?")}">${esc(ora)}</textarea>
    <button class="btn" style="margin-top:16px" onclick="notaSalva(${di})">${tr("Salva la nota")}</button>
    ${ora.trim()?`<button class="btn ghost" style="margin-top:8px" onclick="notaSalva(${di},1)">${tr("Svuota la nota")}</button>`:""}`);};
window.notaSalva=(di,vuota)=>{
  const t=vuota?"":String((document.getElementById("notaTxt")||{}).value||"");
  setNote(di,t);sheetClose();render(cur);
  toast(t.trim()?tr("Nota salvata"):tr("Nota rimossa"));};
window.eventoScegli=async(vd,di,today)=>{
  const opt=["Giornata no","Compleanno","Natale","Capodanno","Pasqua","Festa / party",
             "Cena fuori","Lavoro / trasferta","Matrimonio","Ferragosto","Vacanza breve","Malattia","Altro…"];
  const cur2=(S.dayEvents||{})[vd]||"";
  const scelta=await dlgChoice(tr("Evento del giorno"),
    [["","Nessuno"]].concat(opt.map(o=>[o,(o===cur2?"● ":"")+o])));
  if(scelta===null)return;
  /* «Nessuno» scelto apposta non è come «non ho ancora deciso»: la riga
     sparisce per quel giorno, perché non c'è niente da dire. */
  S.ui.evNo=S.ui.evNo||{};
  if(scelta==="")S.ui.evNo[vd]=true; else delete S.ui.evNo[vd];
  setDayEvent(vd,scelta);
  applyCtl(vd,di,today?1:0);};
window.vaiPasto=(pdi,mi)=>{
  show("oggi");
  setTimeout(()=>{
    const el=document.querySelector('#pg-oggi [data-meal="'+pdi+'-'+mi+'"]')||
             document.querySelectorAll("#pg-oggi .meal")[mi];
    if(!el)return;
    portaInVista(el);
    el.style.transition="box-shadow .4s";
    el.style.boxShadow="0 0 0 3px var(--menta),0 10px 26px -18px rgba(12,31,23,.3)";
    setTimeout(()=>{el.style.boxShadow="";},1800);
  },260);};
window.planMoreSheet=()=>{
  /* Le azioni rare (rifare o importare il piano) stanno in un pannello:
     la card resta pulita e ogni voce porta con sé la sua spiegazione,
     così il glossario a parte non serve più. */
  sheetShow("Altro sul piano",`
    <button class="shrow" onclick="sheetClose();seasonalizePlan()">
      <b>Alternativa stagionale</b>
      <small>${tr("Aggiunge a ogni pasto un'opzione con ingredienti di stagione, senza toccare il piano base.")}</small>
    </button>
    <button class="shrow" onclick="sheetClose();genPlanAI()">
      <b>${tr("Genera nuovo piano")}</b>
      <small>${tr("L'AI costruisce sette giorni su misura per i tuoi obiettivi. Sostituisce il piano attuale.")}</small>
    </button>
    <button class="shrow" onclick="sheetClose();importPlanPhotos()">
      <b>Importa da foto</b>
      <small>${tr("Fotografa un piano su carta o PDF: l'AI lo trascrive dentro l'app.")}</small>
    </button>
    <button class="shrow" onclick="sheetClose();vaiScontrino()">
      <b>${tr("Piano dalla spesa")}</b>
      <small>${tr("Dallo scontrino ai giorni di piano: si usa quello che hai comprato, e ciò che manca finisce in lista della spesa.")}</small>
    </button>`);};
window.vaiScontrino=()=>{
  show("piano");
  setTimeout(()=>{
    const c=[...document.querySelectorAll("#pg-piano .card h2")].find(x=>/Scontrino e dispensa/.test(x.textContent));
    if(!c)return;
    const card=c.closest(".card");
    portaInVista(card);
    card.style.transition="box-shadow .4s";
    card.style.boxShadow="0 0 0 3px var(--menta),0 10px 26px -18px rgba(12,31,23,.3)";
    setTimeout(()=>{card.style.boxShadow="";},1800);
  },260);};
let PANTRY_MANCA=[];
/* Gli acquisti suggeriti finiscono fra le aggiunte manuali della lista
   (S.shopExtra): sopravvivono ai ricalcoli della spesa e si spuntano
   come tutto il resto. Niente doppioni se si preme due volte. */
window.pantryMancaAdd=()=>{
  if(!PANTRY_MANCA.length)return;
  S.shopExtra=S.shopExtra||[];
  let n=0;
  PANTRY_MANCA.forEach(x=>{
    if(!S.shopExtra.some(y=>y.toLowerCase()===x.toLowerCase())){S.shopExtra.push(x);n++;}});
  save();
  toast(n?tr("Aggiunti {n} prodotti alla lista della spesa",{n:n}):tr("Erano già tutti in lista"));};
/* ═══ FRESCHEZZA E SCALETTA DI CONSUMO ══════════════════════════════
   Il piano resta lunedì→domenica per chi lo legge, ma gli alimenti si
   distribuiscono su un ALTRO orologio: quello che parte dal carrello.
   Spesa mercoledì sera ⇒ la cena di mercoledì è la posizione 1 e la
   mattina del mercoledì dopo è l'ultima: quindi lunedì e martedì, che
   in cima al piano SEMBRANO i primi, sono in realtà i più lontani e
   ricevono solo ciò che regge. Le durate sono stime di conservazione
   in frigo, non date di scadenza: si dichiarano come tali. */
const FRESH_DB=[
 [/pesce|merluzz|orata|branzin|spigola|salmone fresc|gamber|mazzancoll|cozze|vongole|calamar|polp|seppi|alici|sgombro|tonno fresc|trancio/i,2],
 [/macinat|hamburger|salsicc|fegato|frattagli/i,2],
 [/pollo|tacchino|petto di|coscia|fesa/i,3],
 [/manzo|vitell|maiale|lombo|bistecc|arrosto|spezzatino|agnello/i,3],
 [/prosciutt|bresaola|speck|salame|mortadella|affettat|salume/i,4],
 [/insalat|lattuga|rucola|spinaci|songino|valeriana|bieta|catalogna|foglie/i,4],
 [/basilico|prezzemolo|menta|erbe fresch/i,3],
 [/fragol|lampon|mirtill|more |frutti di bosco|ciliegi|fich/i,4],
 [/asparag|funghi|champignon|zucchin|fagiolin|piselli fresc|broccol|cavolfior|cime di rapa/i,5],
 [/ricotta|mascarpone|stracchino|crescenza|mozzarell|burrata|robiola|latte fresc|panna fresc/i,5],
 [/uova|uovo/i,14],
 [/pesc[ah]e|albicocc|susin|prugn|kiwi|pera |pere |banana|melone|anguria|uva/i,6],
 [/pomodor|peperon|melanzan|cetriol|sedano|finocchi|cavolo|verza|porro/i,8],
 [/mela|mele |arance|arancia|mandarin|limon|pompelmo|carot|patat|cipoll|aglio|zucca|barbabietol|rap[ae]/i,12],
 [/yogurt|formaggio fresc|feta|fiocchi di latte/i,10]
];
function freshDays(nome){
  const t=String(nome||"");
  if(/surgelat|congelat|in scatola|scatolame|sott'?olio|sott'?aceto|essiccat|secch|conserva|passata|pastorizzat|uht|a lunga conservazione|liofilizzat/i.test(t))return null;
  for(const [re,g] of FRESH_DB) if(re.test(t)) return g;
  return null;}   /* null = confezionato o lunga durata: fuori dal conto */
/* Gli slot che l'utente ha davvero scelto: 5 pasti ⇒ 35 posizioni in 7 giorni */
function planSlots(){
  const raw=String((S.diet&&S.diet.slots)||"Colazione, Metà mattina, Pranzo, Metà pomeriggio, Cena");
  const chosen=parseSlots(raw).filter(x=>SLOTS.indexOf(x)>-1);
  return chosen.length?SLOTS.filter(x=>chosen.indexOf(x)>-1):["Colazione","Pranzo","Cena"];}
const SLOT_HOUR={"Colazione":8,"Metà mattina":10.5,"Pranzo":13,"Metà pomeriggio":16.5,"Tardo pomeriggio":18.5,"Cena":20,"Dopo cena":22};
/* La scaletta: ogni pasto del piano con la sua distanza in giorni dal
   momento della spesa. Il giorno 0 dell'array è LUNEDÌ, come nel piano. */
function consumeOrder(now){
  const d=now||new Date();
  const dow=(d.getDay()+6)%7;                 /* 0 = lunedì */
  const oraOra=d.getHours()+d.getMinutes()/60;
  const slots=planSlots();
  const out=[];
  for(let g=0;g<7;g++){
    slots.forEach(sl=>{
      const h=SLOT_HOUR[sl]||13;
      let dist=(g-dow)+(h-oraOra)/24;         /* giorni di distanza da adesso */
      if(dist<0)dist+=7;                      /* è della settimana che viene */
      out.push({day:g,slot:sl,dist:Math.round(dist*100)/100});
    });
  }
  return out.sort((a,b)=>a.dist-b.dist);}
/* Il testo che spiega la scaletta all'AI, e le regole di freschezza */
function freshForAI(now){
  const p=pantry();
  const ord=consumeOrder(now);
  const GG=["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
  const primi=ord.slice(0,8).map(o=>giorno(GG[o.day])+" "+o.slot.toLowerCase()).join(" → ");
  const ultimi=ord.slice(-6).map(o=>giorno(GG[o.day])+" "+o.slot.toLowerCase()).join(" → ");
  const fresh=p.items.map(i=>({n:i.n,g:freshDays(i.n)})).filter(x=>x.g!=null);
  let t=" ORDINE REALE DI CONSUMO (il piano resta lunedì→domenica, ma gli alimenti vanno distribuiti su questa scaletta, che parte da ADESSO): "+
    "i primi pasti disponibili sono "+primi+"; gli ULTIMI, cioè i più lontani nel tempo, sono "+ultimi+
    ". Attenzione: i giorni che nel piano vengono prima possono essere gli ultimi nell'ordine di consumo — conta la scaletta, non la posizione nel calendario.";
  if(fresh.length){
    t+=" DEPERIBILI in dispensa (giorni di conservazione stimati dall'acquisto): "+
      fresh.map(x=>x.n+" ~"+x.g+"gg").join("; ")+
      ". Colloca ogni deperibile in un pasto che cade ENTRO i suoi giorni di conservazione; nei pasti più lontani metti solo alimenti a lunga conservazione (scatolame, cereali, surgelati). "+
      "Se un deperibile non entra nei suoi giorni, NON forzarlo: indicalo in cuoci_e_congela con la porzione da cucinare subito e quella da congelare per un pasto lontano, dicendo quale.";}
  return t;}
/* ── IL FREEZER ──────────────────────────────────────────────────────
   Quando un fresco non entra nella sua finestra, il piano propone di
   cucinarlo subito e congelarne una parte. Se resta solo un consiglio a
   schermo, fra tre giorni nessuno se lo ricorda: qui la porzione viene
   segnata, e il pasto lontano sa che deve scongelarla. */
let _CONGELA=[];
window.freezerSalva=()=>{
  const p=pantry();
  _CONGELA.forEach(x=>{
    if(!x||!x.alimento)return;
    p.freezer.push({n:String(x.alimento).slice(0,60),q:String(x.congela||"").slice(0,30),
      per:String(x.per||"").slice(0,40),at:iso(new Date())});});
  if(p.freezer.length>20)p.freezer=p.freezer.slice(-20);
  _CONGELA=[];save();render(cur);
  toast(tr("Segnato nel freezer: lo ritrovi in dispensa"));};
window.freezerDel=(k)=>{const p=pantry();p.freezer.splice(k,1);save();render(cur);};
function freezerForAI(){
  const f=pantry().freezer;
  if(!f.length)return "";
  return " GIÀ PRONTO IN FREEZER (non va ricomprato e va consumato: proponi di scongelarlo nel pasto indicato): "+
    f.map(x=>x.n+(x.q?" ("+x.q+")":"")+(x.per?" → "+x.per:"")).join("; ")+".";}
window.pantryCucina=async()=>{
  if(!aiOn())return aiFail(new Error("nokey"));
  const p=pantry();
  if(!p.items.length)return dlgAlert(tr("La dispensa è vuota: fotografa uno scontrino per riempirla."));
  const box=document.getElementById("scoOut");
  if(box){box.style.display="block";genBoxMostra(box);box.textContent=" Costruisco i pasti con quello che hai…";}
  try{
    const lista=p.items.map(i=>i.n+(i.q?" "+i.q+" "+i.u:"")).join(", ");
    const t=await aiAsk("Ho in casa questi alimenti: "+lista+". "+freshForAI()+freezerForAI()+costoForAI()+coperturaForAI()+" "+
      "Costruisci quanti più GIORNI COMPLETI riesci (colazione, pranzo, cena e spuntini) usando questi alimenti, "+
      "con circa "+dayTargetK()+" kcal e almeno "+dayTargetP()+" g di proteine al giorno. "+
      "NON sei obbligato a usare tutto: se un alimento farebbe sforare le calorie o sbilanciare i macro, lascialo in dispensa e segnalalo nel campo nota. La priorità sono i target, non finire la spesa. "+
      "Fermati quando gli alimenti non bastano più: è normale coprire meno di sette giorni, NON inventare alimenti che non ho. "+
      "Se per completare o bilanciare i giorni servono alimenti che non ho (una fonte proteica, verdura, una base), elencali in manca come acquisti suggeriti, ordinati per importanza. "+
      "Indica sempre le grammature. "+rulesForPlan()+
      " Rispondi SOLO con questo JSON: {\"giorni\":[{\"n\":1,\"giorno\":\"Mercoledì\",\"pasti\":[{\"nome\":\"\",\"piatto\":\"\",\"kcal\":0,\"prot\":0}]}],\"cuoci_e_congela\":[{\"alimento\":\"\",\"ora\":\"\",\"congela\":\"\",\"per\":\"\"}],\"manca\":[\"\"],\"nota\":\"\"}");
    const j=parseAIJSON(t);
    if(!j||!Array.isArray(j.giorni)||!j.giorni.length)throw new Error("Non sono riuscito a costruire i pasti");
    let h="<b>"+j.giorni.length+(j.giorni.length===1?" giorno coperto":" giorni coperti")+" con quello che hai.</b><br>";
    h+="<span style=\"color:var(--grigio);font-size:13px\">I pasti seguono l'ordine reale di consumo a partire da adesso: i freschi per primi, la lunga conservazione alla fine.</span><br><br>";
    const cc=Array.isArray(j.cuoci_e_congela)?j.cuoci_e_congela.filter(x=>x&&x.alimento):[];
    if(cc.length){
      h+="<b>Cuoci ora, congela il resto</b><br>";
      cc.forEach(x=>{h+="· "+esc(x.alimento)+": "+esc(x.ora||"cucina subito")+
        (x.congela?" — congela "+esc(x.congela):"")+(x.per?" per "+esc(x.per):"")+"<br>";});
      _CONGELA=cc;
      h+=`<div class="mtools" style="margin:8px 0 12px"><button class="btn small" onclick="freezerSalva()">${tr("Segna nel freezer")}</button></div>`;}
    j.giorni.forEach(g=>{
      h+="<b>Giorno "+(g.n||"")+"</b><br>";
      (g.pasti||[]).forEach(m=>{h+="· "+esc(m.nome||"")+": "+esc(m.piatto||"")+" <span style=\"color:var(--grigio)\">("+Math.round(m.kcal||0)+" kcal, "+Math.round(m.prot||0)+" g proteine)</span><br>";});
      h+="<br>";});
    if(Array.isArray(j.manca)&&j.manca.length){
      PANTRY_MANCA=j.manca.map(x=>String(prodottoPrima(x)).trim()).filter(Boolean);
      h+="<b>Per completare la settimana ti manca:</b><br>"+PANTRY_MANCA.map(x=>"· "+esc(x)).join("<br>")+
        "<div style=\"margin-top:12px\"><button class=\"btn small\" onclick=\"pantryMancaAdd()\">Aggiungi alla lista della spesa</button></div>"+
        "<div class=\"hint\">Alla prossima spesa fotografa di nuovo lo scontrino: si somma a questa e i giorni coperti si allungano.</div><br>";
    }
    if(j.nota)h+="<div style=\"color:var(--grigio)\">"+esc(j.nota)+"</div>";
    if(box){box.style.display="block";genBoxMostra(box);box.innerHTML=h;}
  }catch(e){if(box)box.style.display="none";genBoxVia();aiFail(e);}};

/* ═══ RETE DI SICUREZZA DELLA SPESA ═══════════════════════════════
   La lista NON deve dipendere dall'AI. Se la richiesta fallisce, la si
   calcola dagli ingredienti del piano: quantità meno raffinate e nessun
   arrotondamento ai formati del supermercato, ma la lista c'è. Restare
   senza spesa perché un server è occupato non è accettabile. */
async function shopRipiego(e,silent){
  const locale=(function(){try{return buildShopFromPlan();}catch(_){return [];}})();
  if(!locale.length){if(!silent)aiFail(e);return;}
  const perche=aiReason(e);
  if(!silent&&!await dlgConfirm(tr("L'AI non è riuscita a preparare la lista ({a}).\n\nPosso calcolarla direttamente dagli ingredienti del piano: le quantità restano quelle esatte dei pasti. Al prossimo cambiamento del piano si riallinea da sola.",{a:esc(perche)}),
    {ok:tr("Calcolala così"),ko:trBtn("Annulla")}))return;
  S.customShop=locale;S.shop={};save();render("spesa");
  toast(tr("Lista calcolata dal piano · senza AI"));}

/* ═══════════════════════════════════════════════════════════════
   SPESA DAL PIANO (senza AI): calcola la lista considerando per ogni
   pasto UNA SOLA opzione — sempre quella "a casa" (mai mensa, mai il
   LIBERO che prevede di mangiare fuori). Così se poi mangi fuori, la
   roba avanzata resta buona per la settimana dopo. Sincronizzazione
   con anteprima delle differenze e conferma esplicita.
   ═══════════════════════════════════════════════════════════════ */
/* Opzione "a casa" di un pasto per la spesa (o null se si mangia fuori) */
function homeOptForShop(m){
  if(!m||!m.o||!m.o.length)return null;
  /* se i pasti fuori casa te li prepari tu, gli ingredienti vanno comprati */
  if(m.type==="mensa")return outTypeIsPorto()?m.o[0]:null;
  if(m.type==="free"){ // tra le due opzioni scegli quella NON "fuori"
    const home=m.o.find(o=>!/^\s*(libero|mensa)\b/i.test(o.d||""));
    return home||null;
  }
  return m.o[0];
}
/* Come homeOptForShop, ma decide sui GIORNI fuori casa dalle spunte della
   settimana (più affidabile del type, che nei piani vecchi può essere sbagliato):
   se quel pasto è nei giorni fuori casa, entra nella spesa solo se lo prepari tu. */
function shopOptOf(d,m){
  if(!m||!m.o||!m.o.length)return null;
  const fm=parseMensa(outThisWeek());
  const dk=MENSA_DAYS.find(x=>x[1]===d.day);const v=dk?fm[dk[0]]:null;
  const sl=String(m.n||"").toLowerCase();
  const isOut=v&&((v==="entrambi"&&/pranzo|cena/.test(sl))||(v==="pranzo"&&/pranzo/.test(sl))||(v==="cena"&&/cena/.test(sl)));
  if(isOut)return outTypeIsPorto()?m.o[0]:null;
  return homeOptForShop(m);
}
/* Categoria della spesa in base a parole chiave dell'ingrediente */
/* Classificazione per REPARTO, non per macronutriente: le stesse categorie
   generiche usate anche dall'AI, così un prodotto finisce sempre nello stesso
   posto sia che la lista la calcoli l'app sia che la generi l'AI. */
function shopCatOf(s){s=(s||"").toLowerCase();
  if(/pollo|tacchino|manzo|vitell|maiale|prosciutto|bresaola|salame|carne|salmone|branzino|orata|tonno|merluzzo|gamber|sgombro|pesce|sushi/.test(s))return "Carne e pesce";
  if(/uova|uovo|kefir|yogurt|latte|ricotta|fiocchi di latte|mozzarell|caprino|scamorza|parmigiano|formagg|burro|skyr/.test(s))return "Uova e latticini";
  if(/pane|crostin|pasta|riso|quinoa|avena|farro|orzo|cous|couscous|fette biscottate|cracker|cereali|farina|pizza|piadina|gnocchi|polenta/.test(s))return "Cereali, pane e derivati";
  if(/ceci|fagioli|lenticchi|piselli|fave|soia|edamame|hummus|tofu|tempeh/.test(s))return "Legumi";
  if(/insalata|valeriana|verdur|carote|cetriol|cipoll|rucola|spinaci|zucchin|melanzan|peperon|pomodor|broccol|cavol|finocchi|patate|patata|zucca|funghi|asparag|sedano|porro|minestr|zuppa|passato/.test(s))return "Verdura";
  if(/frutta|frutto|frutti di bosco|limone|mela|pera|banana|arancia|kiwi|pesca|albicocc|uva|fragol|lampon|mirtill|anguria|melone|ananas|mango|datter|prugn/.test(s))return "Frutta";
  if(/olio|evo|semi|noci|noce|mandorl|nocciol|pistacch|anacard|avocado|olive|burro di arachidi|tahini/.test(s))return "Grassi, semi e frutta secca";
  if(/tisana|tisane|caffè|caffe|tè|the|acqua|sale|spezie|aceto|zucchero|miele|marmellat|cioccolat|integrator|gelato|bevanda|succo|vino|birra/.test(s))return "Dispensa e bevande";
  return "Altro";
}
/* Pulisce un pezzo di descrizione ("Pollo 200g" ecc.) */
function cleanIngredient(x){return (x||"").replace(/^\s*(🌸|☀️|🍂|❄️)\s*/,"").replace(/^\s*(libero|mensa)\s*:\s*/i,"").replace(/\s+/g," ").trim();}
/* Chiave per de-duplicare ingredienti simili ignorando le grammature */
function ingrKey(x){return cleanIngredient(x).toLowerCase().replace(/\d+[.,]?\d*\s*(g|kg|ml|l|gr|scatolette?|pallina)?/g,"").replace(/[^a-zàèéìòù ]/g,"").replace(/\s+/g," ").trim();}
/* Quantità: legge "150g", "1,5 kg", "200 ml" e le somma sulla settimana */
function parseQty(x){const m=String(x).match(/(\d+[.,]?\d*)\s*(kg|gr|g|ml|cl|l)\b/i);
  if(!m)return null;
  let v=parseFloat(m[1].replace(",","."));if(!(v>0))return null;
  let u=m[2].toLowerCase();
  if(u==="kg"){v*=1000;u="g";}else if(u==="gr"){u="g";}
  else if(u==="l"){v*=1000;u="ml";}else if(u==="cl"){v*=10;u="ml";}
  return {v:v,u:u};}
function fmtQty(v,u){
  const big=(x,lbl)=>String(Math.round(x/10)/100).replace(".",",")+" "+lbl;  /* 1050 g → 1,05 kg */
  if(u==="g"&&v>=1000)return big(v,"kg");
  if(u==="ml"&&v>=1000)return big(v,"l");
  return Math.round(v)+" "+u;}
/* Nome pulito senza la grammatura del singolo pasto */
function ingrName(x){return cleanIngredient(x)
  .replace(/\(?\s*\d+[.,]?\d*\s*(kg|gr|g|ml|cl|l)\b\s*\)?/ig," ")
  .replace(/\s{2,}/g," ").replace(/^[\s,;+·-]+|[\s,;+·-]+$/g,"").trim();}
/* Costruisce la lista della spesa dal piano (opzioni a casa) */
/* Le descrizioni dei pasti non usano sempre il "+": spesso sono frasi
   ("riso condito con olio, abbinato a petto di pollo e zucchine grigliate").
   Qui si spezzano anche su virgole e congiunzioni, si buttano le note fra
   parentesi e si scartano i frammenti che sono istruzioni, non ingredienti. */
const SHOP_STOP=/^(condit[oaie]|abbinat[oaie]|accompagnat[oaie]|serv[a-z]+|cott[oaie]|grigliat[oaie]|lessat[oaie]|saltat[oaie]|al vapore|al forno|ai ferri|a crudo|peso crudo|q\.?b\.?|privat[oaie].*|senza .*|circa|un filo|a piacere|opzionale)$/i;
const SHOP_COOK=/(condit|abbinat|accompagnat|servit|cott|grigliat|lessat|saltat|tostat|scottat|bollit|arrostit|sbucciat|privat|tagliat|frullat|mescolat)[oaie]/i;
function shopParts(txt){
  return String(txt||"")
    /* ATTENZIONE: le parentesi NON sono note, contengono le grammature —
       «Pasta integrale (100g)». Buttarle via faceva sparire tutte le
       quantità dalla lista rigenerata. Si tolgono solo quelle che non
       contengono un numero, che sono note vere: «(a crudo)», «(facoltativo)». */
    .replace(/\((?![^)]*\d)[^)]*\)/g," ")
    .split(/\+|,|;|\bcon\b|\be\b|\bo\b|\boppure\b|\babbinat[oaie]\sa\b|\baccompagnat[oaie]\sda\b/i)
    .map(x=>x.replace(/\s+/g," ").trim())
    /* via i participi di cottura attaccati all'inizio o alla fine del pezzo */
    .map(x=>x.replace(new RegExp("^\\s*"+SHOP_COOK.source+"\\s+","i"),"")
             .replace(new RegExp("\\s+"+SHOP_COOK.source+"\\s*$","i"),"")
             .replace(/\s+/g," ").trim())
    .filter(x=>x.length>2&&x.length<60&&!SHOP_STOP.test(x)&&/[a-zà-ù]{3}/i.test(x));}
/* ═══ FINESTRA DELLA SPESA ════════════════════════════════════════
   La settimana della spesa NON è lunedì-domenica: parte dal giorno in cui
   la fai. Chi fa la spesa di mercoledì deve coprire da mercoledì al martedì
   successivo. I pasti di oggi già spuntati o saltati sono esclusi: quelli
   sono già stati mangiati, non vanno comprati. */
/* Quello che è già in casa non si ricompra: la lista di un ciclo nasce
   da ciò che resta del ciclo prima. Deperibili esclusi dallo scarico:
   fra sette giorni non ci saranno più. */
/* Il costo entra nei suggerimenti: a parità nutrizionale, si può
   spendere meno. Nessuna morale sul risparmio: è un'informazione. */
function costoForAI(){
  const c=spesaCosto();
  if(!c)return "";
  return " COSTO della spesa registrata: circa "+c.tot.toFixed(2)+" € in totale, ~"+c.perPasto.toFixed(2)+
    " € a pasto (le voci più costose: "+c.top.map(t=>t.cat+" "+t.pc+"%").join(", ")+
    "). Se puoi ottenere gli stessi valori nutrizionali con alimenti più economici, segnalalo nel campo nota con la stima del risparmio settimanale.";}
function dispensaForShop(){
  const p=pantry();
  const durevoli=p.items.filter(i=>freshDays(i.n)==null||freshDays(i.n)>=10);
  const f=p.freezer;
  if(!durevoli.length&&!f.length)return "";
  let t=" NON inserire in lista ciò che ho già in casa";
  if(durevoli.length)t+=": "+durevoli.map(i=>i.n+(i.q?" "+i.q+i.u:"")).join(", ");
  if(f.length)t+=(durevoli.length?"; inoltre in freezer: ":": in freezer ")+f.map(x=>x.n+(x.q?" ("+x.q+")":"")).join(", ");
  return t+". Aggiungi solo il resto.";}
function shopWindow(){
  const t=wd(new Date()),out=[];
  for(let n=0;n<7;n++){
    const di=(t+n)%7;const d=PLAN[di];if(!d)continue;
    (d.meals||[]).forEach(function(m,mi){
      if(n===0){const st=S.week.days[di]&&S.week.days[di].meals[mi];
        if(st&&(st.done||st.skip))return;}
      out.push({di:di,mi:mi,d:d,m:m});});}
  return out;}
function shopWindowLabel(){
  const t=wd(new Date());
  return PLAN[t]?trh("da {v1} a {v2}",{v1:giorno(PLAN[t].day),v2:giorno(PLAN[(t+6)%7].day)}):tr("7 giorni");}
/* Quando il piano cambia, la lista della spesa è vecchia: rifarla a
   mano era un pulsante in più da ricordarsi. Si rifà da sé, tenendo le
   spunte già fatte sui prodotti che restano. */
let _shopTimer=null;
function pianoCambiato(){
  qPlanPrecompute();          /* qualità dei piatti: si ricalcola solo ciò che manca */
  clearTimeout(_shopTimer);
  _shopTimer=setTimeout(()=>{
    try{
      if(planIsEmpty())return;
      const prese=Object.assign({},S.shop||{});
      S.customShop=buildShopFromPlan();
      S.shop={};
      /* le spunte sopravvivono se il prodotto è ancora in lista */
      (S.customShop||[]).forEach((c,ci)=>(c[1]||[]).forEach((it,ii)=>{
        const k=ci+"_"+ii;if(prese[k])S.shop[k]=true;}));
      save();
      if(cur==="spesa")render("spesa");
    }catch(e){}
  },700);}
function buildShopFromPlan(){
  const order=SHOP_CATS,acc={},seq=[];
  const fact=shopForMe()?1:Math.max(1,famUnits());
  shopWindow().forEach(function(w){const d=w.d,m=w.m;
    const o=shopOptOf(d,m);if(!o)return;
    shopParts(o.d).forEach(function(part){
      const ing=cleanIngredient(part);if(!ing)return;
      const key=ingrKey(ing);if(!key)return;
      const q=parseQty(ing),nm=ingrName(ing)||ing;
      if(!acc[key]){acc[key]={cat:shopCatOf(ing),name:nm,v:0,u:null,n:0};seq.push(key);}
      const a=acc[key];a.n++;
      if(nm.length>a.name.length)a.name=nm;          /* tiene la dicitura più esplicita */
      if(q){if(!a.u)a.u=q.u;if(a.u===q.u)a.v+=q.v;}
    });
  });
  const byCat={};
  seq.forEach(k=>{const a=acc[k];
    const label=(a.u&&a.v>0)?(a.name+" "+fmtQty(a.v*fact,a.u)):(a.n>1?a.name+" ×"+a.n:a.name);
    (byCat[a.cat]=byCat[a.cat]||[]).push(label);});
  const out=[];order.forEach(cat=>{if(byCat[cat]&&byCat[cat].length)out.push([cat,byCat[cat]]);});
  Object.keys(byCat).forEach(cat=>{if(!order.includes(cat))out.push([cat,byCat[cat]]);});
  return out;
}
/* Insieme normalizzato di tutte le voci di una lista, per confrontarle */
function shopItemSet(arr){const m={};(arr||[]).forEach(([,items])=>items.forEach(it=>{m[ingrKey(it)]=it;}));return m;}
/* Sincronizza la lista con il piano: mostra le differenze e chiede conferma */
window.syncShopFromPlan=()=>{
  if(planIsEmpty())return dlgAlert(tr("Non c'è ancora un piano da cui calcolare la spesa.\n\nGenera o carica un piano dalla sezione Regole, poi torna qui."));
  const next=buildShopFromPlan();
  if(!next.length)return dlgAlert(tr("Nessun ingrediente ricavabile dal piano."));
  const cur=shopItemSet(SHOPCUR());const nw=shopItemSet(next);
  const added=Object.keys(nw).filter(k=>!cur[k]).map(k=>nw[k]);
  const removed=Object.keys(cur).filter(k=>!nw[k]).map(k=>cur[k]);
  let m=document.getElementById("syncM");
  if(!m){m=document.createElement("div");m.id="syncM";m.className="modal";document.body.appendChild(m);}
  let inner=`<div class="mcard"><h2 style="color:var(--bosco);font-size:16px">${tr("Sincronizza la spesa col piano")}</h2>
    <div class="hint" style="margin-top:4px">${trh("Calcolata considerando {b1}, sempre quella a casa (mai mensa/fuori). Ecco cosa cambierebbe rispetto alla lista attuale:",{b1:"<b>"+tr("una sola opzione per pasto")+"</b>"})}</div>`;
  if(!added.length&&!removed.length)inner+=`<div class="hint" style="margin-top:8px">${tr("Nessuna differenza: la lista è già allineata al piano ✓")}</div>`;
  if(added.length){inner+=`<div class="shopcat" style="color:var(--bosco)">Da aggiungere (${added.length})</div><div class="shopitems">`;
    added.forEach(x=>inner+=`<div class="shopitem"><span class="st">${esc(prodottoPrima(x))}</span></div>`);inner+=`</div>`;}
  if(removed.length){inner+=`<div class="shopcat" style="color:var(--zafft)">${trh("Non più nel piano ({v1})",{v1:removed.length})}</div><div class="shopitems">`;
    removed.forEach(x=>inner+=`<div class="shopitem"><span class="st">${esc(prodottoPrima(x))}</span></div>`);inner+=`</div>`;}
  inner+=`<div class="hint" style="margin-top:8px">${trh("La lista completa risultante avrà {v1} voci in {v2} categorie.",{v1:next.reduce((a,c)=>a+c[1].length,0),v2:next.length})}</div>
    <div class="mtools" style="margin-top:12px">
      <button class="btn small" onclick="applyShopSync()">Applica</button>
      <button class="btn ghost small" onclick="document.getElementById('syncM').remove()">${tr("Annulla")}</button></div></div>`;
  m.innerHTML=inner;
  window._pendingShop=next;
};
window.applyShopSync=()=>{if(!window._pendingShop)return;
  S.customShop=window._pendingShop.map(x=>[String(x[0]),x[1].map(String)]);
  S.shop={};window._pendingShop=null;save();
  const el=document.getElementById("syncM");if(el)el.remove();
  render("spesa");toast(tr("Lista sincronizzata col piano ✓"));};
/* Rende la lista modificabile: alla prima modifica copia quella corrente */
function ensureCustomShop(){if(!S.customShop)S.customShop=SHOPCUR().map(x=>[String(x[0]),x[1].slice()]);}
window.removeShopItem=async (ci,ii)=>{
  const cur=SHOPCUR()[ci],nome=(cur&&cur[1]&&cur[1][ii])||"questo prodotto";
  if(!await dlgConfirm(tr("Tolgo «{n}» dalla lista della spesa?",{n:nome})))return;
  ensureCustomShop();const cat=S.customShop[ci];if(!cat)return;
  cat[1].splice(ii,1);if(!cat[1].length)S.customShop.splice(ci,1);S.shop={};save();render("spesa");
  toast(tr("Prodotto rimosso dalla lista ✓"));};
/* addShopItem rimosso: le categorie del piano sono automatiche, e per
   il resto c'è la sezione Extra in fondo alla lista. */
/* «Nuova categoria» e «Ripristina dal piano» non servono più: le
   categorie le decide la lista costruita dal piano, e l'allineamento
   al piano avviene da solo a ogni modifica (pianoCambiato). */

/* ═══ I TUOI SUPERMERCATI ═══════════════════════════════════════════
   Nessun indirizzo predefinito: l'app non sa e non indovina come è fatto
   il sito di una catena. Sei tu a incollare l'indirizzo di una ricerca
   vera, e da lì l'AI ricava il modello. Così in lista c'è solo ciò che
   usi davvero, e ogni link è già stato verificato da te sul campo.
   Ogni voce: {n:nome, t:modello ricerca, p:modello offerte, on:attivo} */
function markets(){
  if(!Array.isArray(S.markets)){
    S.markets=[];
    /* chi aveva già impostato un modello se lo ritrova come primo negozio */
    if(S.shopTpl&&S.shopTpl.includes("{q}"))
      S.markets.push({n:"Il mio supermercato",t:S.shopTpl,p:"",on:true});
  }
  return S.markets;}
function marketOn(){const l=markets();return l.find(m=>m.on)||l[0]||null;}
function promoOn(){const m=marketOn();return !!(S.shopPromo&&m&&m.p);}
/* Il modello davvero usato dai della lista */
function shopTplNow(){
  const m=marketOn();if(!m)return "";
  return (promoOn()&&m.p)?m.p:(m.t||"");}

/* ── Estrazione del modello da un indirizzo incollato ──
   Se l'alimento cercato compare nell'indirizzo, la sostituzione è certa e
   si fa senza AI. Altrimenti (parola codificata, ricerca dentro un
   parametro strano) si chiede all'AI. Se nessuno dei due riesce, si dice
   chiaramente che non si è capito, invece di salvare un modello rotto. */
async function tplDaUrl(url,alimento){
  const u=String(url||"").trim();
  if(!u)return null;
  if(u.includes("{q}"))return u;                    /* già un modello */
  const a=String(alimento||"").trim();
  if(a){
    const varianti=[a,encodeURIComponent(a),a.toLowerCase(),a.toUpperCase(),
                    a.charAt(0).toUpperCase()+a.slice(1).toLowerCase()];
    for(const v of varianti){
      if(v&&u.includes(v))return u.split(v).join("{q}");
    }
  }
  if(!aiOn())return null;
  try{
    const t=await aiAsk('Questo è l\'indirizzo della pagina dei risultati di ricerca di un supermercato online: "'+u.slice(0,500)+'". '+
      (a?'Il termine cercato era: "'+a+'". ':'')+
      'Individua nell\'indirizzo il punto in cui compare il termine cercato e sostituiscilo con {q}, lasciando TUTTO il resto identico. '+
      'Se non riconosci il termine cercato, restituisci una stringa vuota. Rispondi SOLO JSON: {"tpl":"..."}');
    const j=parseAIJSON(t);
    const tpl=j&&j.tpl?String(j.tpl):"";
    return tpl.includes("{q}")?tpl:null;
  }catch(e){return null;}}

/* ── Aggiunta guidata di un supermercato ── */
/* Da tre prompt in fila a un pannello unico: nome, alimento cercato e
   indirizzo incollato stanno insieme, con la spiegazione sotto gli occhi
   mentre si compila. */
window.marketAdd=()=>{
  sheetShow("Aggiungi supermercato",`
    <div class="hint" style="margin-top:0">${trh("Apri il sito del tuo negozio, {b1} e copia l'indirizzo della pagina dei risultati (la barra in alto del browser).",{b1:"<b>"+tr("cerca un alimento qualsiasi")+"</b>"})}</div>
    <label style="margin-top:12px">${tr("Nome del negozio")}</label>
    <input type="text" id="mktNome" placeholder="es. Conad, Esselunga…">
    <label style="margin-top:12px">${tr("Che alimento hai cercato?")}</label>
    <input type="text" id="mktCibo" value="pollo">
    <label style="margin-top:12px">${tr("Indirizzo della pagina dei risultati")}</label>
    <input type="url" id="mktUrl" inputmode="url" placeholder="https://…">
    <button class="btn" style="margin-top:16px" onclick="marketAddGo()">${tr("Aggiungi il negozio")}</button>`);};
window.marketAddGo=async()=>{
  const nome=String((document.getElementById("mktNome")||{}).value||"").trim();
  const alimento=String((document.getElementById("mktCibo")||{}).value||"").trim();
  const url=String((document.getElementById("mktUrl")||{}).value||"").trim();
  if(!nome)return dlgAlert(tr("Manca il nome del negozio."));
  if(!alimento)return dlgAlert(tr("Scrivi l'alimento che hai cercato sul sito: serve a riconoscere dove va la parola nell'indirizzo."));
  if(!url)return dlgAlert(tr("Manca l'indirizzo della pagina dei risultati."));
  const t=await tplDaUrl(url,alimento);
  if(!t)return dlgAlert(tr("Non riesco a riconoscere «{a}» dentro quell'indirizzo.\n\nRiprova: cerca l'alimento sul sito e copia l'indirizzo della pagina dei RISULTATI, non quello della pagina iniziale.",{a:esc(alimento)}));
  const m={n:nome,t:t,p:"",on:true};
  markets().forEach(x=>x.on=false);
  S.markets.push(m);save();sheetClose();render("spesa");
  toast(tr("«{n}» aggiunto ✓",{n:m.n}));
  if(await dlgConfirm(tr("Vuoi anche le <b>offerte</b>? (facoltativo)\n\nSullo stesso sito, con la stessa ricerca, attiva il filtro offerte o promozioni e copia il nuovo indirizzo: da lì l'app ti mostra prima i prodotti in promozione."),
    {ok:tr("Aggiungo le offerte"),ko:tr("Più tardi")}))await marketPromo(S.markets.length-1);};

/* ── Modello «offerte» per un negozio già in lista ── */
window.marketPromo=async(i)=>{
  const m=markets()[i];if(!m)return;
  const alimento=await dlgPrompt(tr("Che alimento hai cercato, con il filtro offerte attivo?"),"pollo");
  if(!alimento||!alimento.trim())return;
  const url=await dlgPrompt(tr("Incolla l'indirizzo della pagina con il filtro <b>offerte</b> attivo."),"");
  if(!url||!url.trim())return;
  const p=await tplDaUrl(url,alimento);
  if(!p)return dlgAlert(tr("Non riesco a riconoscere «{n}» in quell'indirizzo.",{n:alimento.trim()}));
  if(p===m.t)return dlgAlert(tr("Questo indirizzo è identico a quello della ricerca normale.\n\nVuol dire che su questo sito il filtro offerte non finisce nell'indirizzo: purtroppo non è possibile richiamarlo da un link."));
  m.p=p;S.shopPromo=true;save();render("spesa");
  toast(tr("Offerte attive per «{n}» ✓",{n:m.n}));};

window.marketPick=(i)=>{markets().forEach((m,k)=>m.on=(k===+i));save();render("spesa");};
window.marketDel=async(i)=>{
  const m=markets()[i];if(!m)return;
  if(!await dlgConfirm(tr("Tolgo «{n}» dalla lista?",{n:m.n}),{ok:tr("Togli"),ko:trBtn("Annulla")}))return;
  S.markets.splice(i,1);
  if(S.markets.length&&!S.markets.some(x=>x.on))S.markets[0].on=true;
  save();render("spesa");toast(tr("Rimosso"));};
window.marketPromoDel=(i)=>{const m=markets()[i];if(!m)return;m.p="";save();render("spesa");toast(tr("Modello offerte rimosso"));};
window.shopPromoSet=(v)=>{S.shopPromo=!!v;save();render("spesa");
  toast(v?tr("I link puntano ai prodotti in offerta"):tr("I link tornano alla ricerca normale"));};
/* Prova il link: apre una ricerca vera, così vedi subito se funziona */
window.marketTest=(i,promo)=>{
  const m=markets()[i];if(!m)return;
  const tpl=promo?m.p:m.t;
  if(!tpl)return;
  const u=safeUrl(tpl.replace("{q}",encodeURIComponent("latte")));
  if(!u)return dlgAlert(tr("Indirizzo non valido."));
  window.open(u,"_blank","noopener");};
function renderSpesa(){const el=document.getElementById("pg-spesa");
  /* Le due funzioni del fossato stanno IN CIMA alla spesa, non in un
     menù a parte: qui arriva chi sta pensando a cosa comprare o cosa
     cucinare stasera, ed è esattamente il momento in cui servono. Una
     voce di menù dedicata sarebbe stata più facile da scrivere e più
     difficile da trovare. */
  let h="";
  try{h+=dispensaHTML();}catch(e){}
  try{h+=budgetHTML();}catch(e){}
  h+=`<div class="card"><h2>${tr("I tuoi supermercati")}</h2>
  ${markets().length
    ?`<div class="hint">${tr("I link della lista cercheranno qui.")}</div>`
    :`<div class="hint">${tr("Aggiungi il tuo negozio: i link della lista cercheranno lì.")}</div>`}
  ${markets().length?markets().map((m,k)=>`
    <div class="ctlrow" style="align-items:flex-start">
      <input type="radio" name="mkt" ${m.on?"checked":""} onchange="marketPick(${k})" style="margin:4px 0 0" aria-label="Usa ${esc(cap(fascia(m.n)))}">
      <div style="flex:1 1 140px;min-width:0">
        <b>${esc(cap(fascia(m.n)))}</b>
        <div class="ru" style="margin:4px 0 0">${m.p?" con offerte":"solo ricerca"}</div>
      </div>
      <button class="ibtn" title="${tr("Prova il link")}" onclick="marketTest(${k},0)">${ic("search",16)}</button>
      ${m.p?`<button class="ibtn" title="${tr("Togli le offerte")}" onclick="marketPromoDel(${k})">${ic("tag",16)}</button>`
           :`<button class="ibtn" title="${tr("Insegna le offerte")}" onclick="marketPromo(${k})" style="color:var(--grigio)">${ic("tag",16)}</button>`}
      <button class="ibtn" title="${tr("Togli")}" onclick="marketDel(${k})">${ic("x",15)}</button>
    </div>`).join(""):""}
  <div class="mtools"><button class="btn small" onclick="marketAdd()">${tr("+ Aggiungi supermercato")}</button></div>
  ${marketOn()&&marketOn().p?`<label class="ck" style="margin-top:12px"><input type="checkbox" ${promoOn()?"checked":""} onchange="shopPromoSet(this.checked)">  ${trh("Mostra prima i prodotti in {b}",{b:"<b>offerta</b>"})}</label>`:""}</div>
  <div class="card"><h2>${tr("Lista della spesa")}</h2>
  ${hint2(tr("La lista si costruisce <b>da sola</b> dagli ingredienti del piano e si aggiorna quando lo modifichi: non c'è niente da rigenerare."),tr("Vale anche per quello che aggiungi tu: cambia un pasto dal Piano e il prodotto entra in lista da sé. Per una cosa fuori piano c'è la sezione <b>Extra</b> in fondo, che sopravvive anche quando la lista si rigenera. Copre i 7 giorni da oggi e i pasti fuori casa non vengono comprati."))}
  ${(function(){
    const tot=SHOPCUR().reduce((a,c)=>a+((c[1]||[]).length),0)+((S.shopExtra||[]).length);
    /* Lista a zero: prima restava un titolo sopra il nulla, e chi arrivava
       qui prima di avere un piano non capiva se l'app fosse rotta o vuota.
       La lista nasce dagli ingredienti del piano: quindi si indica il piano. */
    if(!tot)return vuotoDi("spesa");
    const presi=Math.min(tot,Object.values(S.shop||{}).filter(Boolean).length);
    const pc=Math.round(presi/tot*100);
    return `<div class="daytotal" style="border:0;padding:0;margin-top:4px">Presi: <span>${presi} su ${tot}</span></div>
      <div style="height:8px;background:var(--linea);border-radius:8px;overflow:hidden;margin:8px 0 4px">
        <div style="height:100%;width:${pc}%;background:${presi>=tot?"var(--salvia)":"var(--bosco)"};transition:width .3s var(--ease)"></div></div>`;})()}
  ${hint2(tr("Spunta il prodotto quando lo metti nel carrello."),
   tr("Gli altri comandi sulla riga: la catenella apre la ricerca del prodotto sul sito del tuo negozio, la stella AI propone un'alternativa se è esaurito, la ✕ lo toglie dalla lista. Le spunte restano salvate finché il piano non cambia."),null,tr("gli altri comandi"))}
  ${(S.family||[]).length?`<label>${tr("Per chi fai la spesa?")}</label>
  <div class="ckgrid">
    <label class="ck"><input type="radio" name="shopFor" ${shopForMe()?"checked":""} onchange="shopForSet('me')"> ${tr("Solo per me")}</label>
    <label class="ck"><input type="radio" name="shopFor" ${!shopForMe()?"checked":""} onchange="shopForSet('fam')"> ${trh("Tutta la famiglia ({v1} porz.)",{v1:Math.round(famUnits()*100)/100})}</label>
  </div>`:""}
  <div class="btngrid2">
    <button class="btn ghost small" onclick="resetShop()">${tr("Pulisci le spunte")}</button>
    <button class="btn ghost small" onclick="waShop()">Manda su WhatsApp</button>
  </div>
  <div class="hint" style="margin-top:8px">${trh("Copre i {b} ({v1}). Si aggiorna da sola quando cambi il piano.",{b:"<b>"+tr("7 giorni da oggi")+"</b>",v1:esc(shopWindowLabel())})}</div></div>`;
  if(!SHOPCUR().length)h+=`<div class="card" style="text-align:center">
    <h2 style="margin-top:4px">Lista vuota</h2>
    <div class="hint">${planIsEmpty()
      ?"La lista si costruisce dal piano: appena avrai un piano attivo, la spesa della settimana comparirà qui da sola."
      :"Hai tolto tutto a mano. La lista si riallinea al piano al prossimo cambiamento del piano, oppure aggiungi i prodotti con ＋."}</div></div>`;
  const rigaShop=(id,it,delFn,ci,ii)=>{const c=S.shop[id];   /* ci/ii: posizione in lista, serve alla sostituzione */
    return `<div class="shopitem ${c?"c":""}">
        <span class="box" onclick="tglShop('${id}')">${c?"✓":""}</span>
        <span class="st" onclick="tglShop('${id}')">${esc(prodottoPrima(tr(it)))}</span>
                ${shopTplNow()?`<a class="ibtn" target="_blank" rel="noopener" href="${shopLink(it)}" title="${tr("Cerca nel tuo supermercato")}">${ic("link",16)}</a>`:`<button class="ibtn" title="${tr("Imposta il link del tuo supermercato in cima alla pagina")}" onclick="dlgAlert(tr('Imposta prima il link di ricerca del tuo supermercato, in cima alla pagina Spesa.'))">${ic("link",16)}</button>`}
        <button class="ibtn" title="Alternativa AI" onclick="subAI('${it.replace(/'/g,"\\'")}'${ci!=null?","+ci+","+ii:""})">${ic("ai",16)}</button>
        <button class="ibtn" title="${tr("Rimuovi dalla lista")}" onclick="${delFn}">${ic("x",15)}</button></div>`;};
  SHOPCUR().forEach(([cat,items],ci)=>{h+=`<div class="shopcat">${(typeof icoPrefisso==="function")?icoPrefisso(cat,16):""}${esc(tr(cat))}</div><div class="shopitems">`;
    items.forEach((it,ii)=>{h+=rigaShop(ci+"_"+ii,it,`removeShopItem(${ci},${ii})`,ci,ii);});
    h+=`</div>`;});
  /* ── EXTRA: gli acquisti fuori dal piano ──────────────────────────
     Vivono in una lista separata (S.shopExtra), così sopravvivono alle
     rigenerazioni automatiche della lista: il piano cambia, i tuoi
     appunti restano. La riga «Aggiungi» sta in fondo, allineata come
     un prodotto: niente più ＋ sparsi sulle categorie. */
  {const ex=S.shopExtra||[];
   h+=`<div class="shopcat">${tr("Extra — fuori dal piano")}</div><div class="shopitems">`;
   ex.forEach((it,ii)=>{h+=rigaShop("x_"+ii,it,`removeShopExtra(${ii})`);});
   h+=`<div class="shopitem" onclick="addShopExtra()" style="cursor:pointer">
     <span class="box" style="border-style:dashed;color:var(--salvia);line-height:21px">＋</span>
     <span class="st" style="color:var(--grigio)">${tr("Aggiungi prodotto…")}</span></div>`;
   h+=`</div>`;}
  el.innerHTML=h;}
window.addShopExtra=async()=>{
  const v=await dlgPrompt(tr("Cosa devi comprare, fuori dal piano?"));if(!v||!v.trim())return;
  S.shopExtra=S.shopExtra||[];S.shopExtra.push(v.trim());save();render("spesa");};
window.removeShopExtra=(ii)=>{
  (S.shopExtra||[]).splice(ii,1);
  /* le spunte degli extra scalano con l'indice: si azzerano solo le loro */
  Object.keys(S.shop||{}).forEach(k=>{if(/^x_/.test(k))delete S.shop[k];});
  save();render("spesa");};
/* I formati commerciali aiutano chi non vuole sprechi, ma allungano
   ogni riga con «(2 confezioni da 80 g)» e a chi fa la spesa da anni
   danno solo fastidio. Si sceglie. */
function shopForMe(){return (S.shopFor||((S.family||[]).length?"fam":"me"))==="me";}
window.shopForSet=(v)=>{S.shopFor=v;save();
  /* Cambiare i destinatari cambia le quantità: la lista si rifà da sé,
     esattamente come per ogni modifica del piano. */
  pianoCambiato();render("spesa");
  toast(v==="me"?tr("Dosi per una persona — la lista si sta aggiornando"):tr("Dosi per tutta la famiglia — la lista si sta aggiornando"));};
window.tglShop=id=>{S.shop[id]=!S.shop[id];save();render("spesa");};
window.resetShop=()=>{S.shop={};save();render("spesa");};
window.waShop=()=>{let t="*Spesa della settimana*%0A";
  SHOPCUR().forEach(([cat,items],ci)=>{const rest=items.filter((x,ii)=>!S.shop[ci+"_"+ii]);
    if(rest.length){t+="%0A*"+cat+"*%0A";rest.forEach(x=>t+="• "+encodeURIComponent(x)+"%0A");}});
  {const rest=(S.shopExtra||[]).filter((x,ii)=>!S.shop["x_"+ii]);
   if(rest.length){t+="%0A*Extra*%0A";rest.forEach(x=>t+="• "+encodeURIComponent(x)+"%0A");}}
  window.open("https://wa.me/?text="+t,"_blank");};

