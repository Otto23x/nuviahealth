/* ═══════════════════════════════════════════════════════════════
   70. L'EVOLUZIONE DELLE MISURE
   ═══════════════════════════════════════════════════════════════
   Il founder (30/08), parlando delle misure prese in studio: «l'app
   deve mostrare l'evoluzione nel tempo di tutte queste cose».
   La v15.13.0 ha fatto entrare quelle misure nell'app; questa fa la
   seconda metà della frase — perché fino a ieri delle misure del
   professionista si vedeva solo il DELTA fra le ultime due visite,
   che è una differenza, non un'evoluzione. Il peso aveva il suo
   grafico dal primo giorno; pliche, circonferenze e composizione no.

   ── LA SCELTA CHE FA IL LAVORO: IL PESO SEMPRE SOTTO ────────────
   Ogni misura si disegna INSIEME al peso, su due assi. Non è
   decorazione: è la domanda clinica che questa pagina esiste per
   rispondere. «Peso fermo e pliche in calo» non è uno stallo, è
   ricomposizione — l'app lo dice già al modello nel prompt
   dell'analisi (`studioForAI`), e finora non lo faceva vedere a
   nessuno. Due linee sullo stesso tempo la raccontano senza una
   parola.

   ── LE TRE REGOLE ───────────────────────────────────────────────
   1. NIENTE LINEA SU UN PUNTO SOLO. Con meno di due misurazioni di
      quella grandezza non si disegna: si dice quante ne mancano. Una
      linea fra un punto e il nulla è un'invenzione grafica.
   2. I BUCHI RESTANO BUCHI. Chi salta la plica di giugno ha un buco
      a giugno: `spanGaps` unisce i punti veri senza fingere che il
      valore intermedio esista (il peso invece è una serie continua e
      la sua linea può passare sopra).
   3. LE UNITÀ SONO QUELLE DELLA PERSONA. Le circonferenze si vestono
      in pollici per chi vive in pollici; le PLICHE NO — un
      plicometro si legge in millimetri in tutto il mondo, e «0,3 in»
      è un numero che nessun professionista sa leggere (stessa
      decisione già scritta in `studioCardHTML`).                   */

/* Le grandezze disegnabili. `k` è la chiave nel record della visita,
   `dove` dice in quale cassetto sta, `u` l'unità a schermo.
   La SOMMA DELLE PLICHE è la prima della lista e non è un capriccio:
   è il numero che un professionista guarda per primo, ed è anche
   quello che regge meglio i buchi (una plica saltata cambia la somma,
   ma la tendenza resta leggibile). */
function EVO_CAMPI(){return [
  {k:"pliche", dove:"somma", n:tr("somma pliche"), u:"mm"},
  {k:"fat",    dove:"campo", n:tr("massa grassa"), u:"%"},
  {k:"mus",    dove:"campo", n:tr("massa magra"),  u:"%"},
  {k:"acqua",  dove:"campo", n:tr("acqua corporea"),u:"%"},
  {k:"vita",   dove:"circ",  n:tr("vita"),         u:"cm"},
  {k:"fianchi",dove:"circ",  n:tr("fianchi"),      u:"cm"},
  {k:"bmr",    dove:"campo", n:tr("metabolismo misurato"),u:"kcal"}
];}
window.EVO_CAMPI=EVO_CAMPI;

/* La serie di UNA grandezza: [{d,v}] in ordine di data, senza i buchi
   (un valore mancante non diventa uno zero: sparisce, ed è il punto). */
function evoSerie(campo){
  const c=EVO_CAMPI().find(x=>x.k===campo);
  if(!c)return [];
  let V=[];
  try{V=(typeof visite==="function")?visite():[];}catch(e){V=[];}
  const out=[];
  V.forEach(v=>{
    if(!v||!v.d)return;
    let n=null;
    if(c.dove==="somma"){
      const p=v.pliche||{};
      const ks=Object.keys(p).filter(k=>+p[k]>0);
      /* la somma ha senso solo se le pliche misurate sono le stesse:
         sommare tre pliche a giugno e cinque a luglio farebbe salire
         il numero mentre la persona dimagrisce. Si tiene il conto di
         quante sono, e il grafico spezza la linea quando cambia. */
      if(ks.length)n={v:Math.round(ks.reduce((a,k)=>a+ +p[k],0)*10)/10,quante:ks.length};
    }else if(c.dove==="circ"){
      const x=(v.circ||{})[c.k];
      if(x>0)n={v:x};
    }else{
      const x=v[c.k];
      if(x>0)n={v:x};
    }
    if(n)out.push(Object.assign({d:v.d},n));});
  return out.sort((a,b)=>a.d<b.d?-1:1);}
window.evoSerie=evoSerie;

/* Quale grandezza mostrare: quella scelta, se ha ancora almeno due
   punti; altrimenti la prima che ne ha — meglio un grafico che si
   apre da solo su qualcosa di vero che uno vuoto con un elenco. */
function evoCampo(){
  const scelto=(S.ui&&S.ui.evoCampo)||"";
  if(scelto&&evoSerie(scelto).length>=2)return scelto;
  const c=EVO_CAMPI().find(x=>evoSerie(x.k).length>=2);
  return c?c.k:(scelto||"pliche");}
window.evoCampo=evoCampo;
window.evoCampoSet=(k)=>{S.ui=S.ui||{};S.ui.evoCampo=k;save();try{render(cur);}catch(e){}};

/* Il peso alle stesse date: la seconda linea. Si prende dalla serie
   delle pesate (che è continua) e si taglia sulla finestra della
   misura scelta — un peso di sei mesi prima sotto tre pliche di
   questo mese schiaccerebbe il grafico e non direbbe niente. */
function evoPesi(da,a){
  try{
    return (S.profile.weights||[])
      .filter(x=>x&&x.w&&(!da||x.d>=da)&&(!a||x.d<=a))
      .map(x=>({d:x.d,v:x.w}));
  }catch(e){return [];}}
window.evoPesi=evoPesi;

/* ── LA RICOMPOSIZIONE, IN UN POSTO SOLO ─────────────────────────
   La domanda clinica che il modulo esiste per mostrare — «peso quasi
   fermo, misura di grasso in calo» — la calcola QUESTA funzione, e la
   usano sia la carta che il testo mandato all'AI. Due calcoli della
   stessa cosa divergerebbero: la carta direbbe ricomposizione e il
   modello direbbe stallo, alla stessa persona, nella stessa pagina.
   Ritorna null quando non c'è abbastanza per dirlo — che è la
   maggioranza dei casi, ed è giusto così. */
function evoRicomposizione(campo){
  const c=campo||evoCampo();
  const spia=(c==="pliche"||c==="fat"||(EVO_CAMPI().find(x=>x.k===c)||{}).dove==="circ");
  if(!spia)return null;
  const s=evoSerie(c);
  if(s.length<2)return null;
  const dv=Math.round((s[s.length-1].v-s[0].v)*10)/10;
  const W=evoPesi(s[0].d,s[s.length-1].d);
  if(W.length<2)return null;
  const dw=Math.round((W[W.length-1].v-W[0].v)*10)/10;
  /* «quasi fermo» è mezzo chilo scarso su tutto il periodo: sotto
     quella soglia la bilancia sta dentro l'acqua di una giornata */
  if(!(Math.abs(dw)<0.7&&dv<0))return null;
  return {campo:c,misura:dv,peso:dw,da:s[0].d,a:s[s.length-1].d,punti:s.length};}
window.evoRicomposizione=evoRicomposizione;

/* ── QUELLO CHE VA AL MODELLO ────────────────────────────────────
   Founder (30/08): «l'AI è in grado di fare queste analisi su pliche,
   ricomposizione ecc?». Fino alla v15.14.0 no, e non per colpa del
   modello: `studioForAI` gli passava l'ULTIMA visita più il delta
   dalla precedente — due punti. Con due punti si dice «è sceso», non
   «sta scendendo da quattro mesi e negli ultimi due ha rallentato».
   Qui il modello riceve la TRAIETTORIA di ogni grandezza misurata,
   il peso alle stesse date, e il fatto già calcolato quando c'è.
   Compatto di proposito: al massimo dodici punti per grandezza — una
   serie più lunga costa contesto e non cambia la lettura. */
function evoPerAI(){
  const righe=[];
  EVO_CAMPI().forEach(c=>{
    const s=evoSerie(c.k);
    if(s.length<2)return;
    const u=(c.dove==="circ"&&typeof unitaLungh==="function")?unitaLungh():c.u;
    const vesti=(x)=>(c.dove==="circ"&&typeof lunghNum==="function")?lunghNum(x,1):x;
    righe.push(c.n+" ("+u+"): "+s.slice(-12).map(x=>x.d+" "+vesti(x.v)).join(" → "));});
  if(!righe.length)return "";
  let t=" ANDAMENTO DELLE MISURE NEL TEMPO (dalla prima all'ultima): "+righe.join("; ")+".";
  /* il peso alle stesse date: senza, il modello non può distinguere
     un calo di grasso da un calo di tutto */
  const tutteDate=EVO_CAMPI().map(c=>evoSerie(c.k)).filter(s=>s.length>=2);
  if(tutteDate.length){
    const da=tutteDate.map(s=>s[0].d).sort()[0];
    const a=tutteDate.map(s=>s[s.length-1].d).sort().pop();
    const W=evoPesi(da,a);
    if(W.length>=2){
      const uP=(typeof unitaPeso==="function")?unitaPeso():"kg";
      const vP=(x)=>(typeof pesoNum==="function")?pesoNum(x,1):x;
      t+=" PESO alle stesse date ("+uP+"): "+W.slice(-12).map(x=>x.d+" "+vP(x.v)).join(" → ")+".";}}
  const r=evoRicomposizione();
  if(r){
    const c=EVO_CAMPI().find(x=>x.k===r.campo)||{n:r.campo};
    t+=" FATTO GIÀ CALCOLATO DALL'APP: fra il "+r.da+" e il "+r.a+
      " il peso è cambiato di "+r.peso+" (quasi fermo) mentre «"+c.n+"» è sceso di "+Math.abs(r.misura)+
      ": è il quadro tipico della RICOMPOSIZIONE, non di uno stallo. Tienine conto invece di leggere il peso fermo come un mancato risultato.";}
  return t;}
window.evoPerAI=evoPerAI;

/* ── LA CARTA ────────────────────────────────────────────────────
   Sta sotto «Misure dello studio», dove vivono i dati che disegna. */
function evoluzioneHTML(){
  const campi=EVO_CAMPI();
  const pronti=campi.filter(c=>evoSerie(c.k).length>=2);
  const attivo=evoCampo();
  const s=evoSerie(attivo);
  const c=campi.find(x=>x.k===attivo)||campi[0];
  let h=`<div class="card" data-evoluzione="1"><h2>${esc(tr("Come cambiano le misure"))}</h2>`;
  if(!pronti.length){
    /* niente linea su un punto solo, e si dice quanto manca invece di
       mostrare un riquadro vuoto */
    const quante=campi.reduce((a,x)=>a+(evoSerie(x.k).length?1:0),0);
    h+=`<div class="hint">${esc(quante
      ? tr("Serve almeno una seconda misurazione: con un punto solo non c'è una tendenza da disegnare, c'è un numero.")
      : tr("Qui compare l'andamento di pliche, circonferenze e composizione, appena ci sono due misurazioni da confrontare."))}</div></div>`;
    return h;}
  h+=`<div class="mtools">`+pronti.map(x=>
    `<button class="chipbtn${x.k===attivo?" on":""}" type="button" data-evo="${esc(x.k)}"
       onclick="evoCampoSet('${esc(x.k)}')">${esc(x.n)}</button>`).join("")+`</div>`;
  h+=`<canvas id="chEvo" height="170"></canvas>`;
  /* la lettura in parole: quanto è cambiata la misura e quanto il
     peso nello stesso tempo — è la frase che il grafico disegna */
  const p0=s[0],p1=s[s.length-1];
  const dv=Math.round((p1.v-p0.v)*10)/10;
  const W=evoPesi(p0.d,p1.d);
  const dw=(W.length>=2)?Math.round((W[W.length-1].v-W[0].v)*10)/10:null;
  const uTxt=(c.dove==="circ"&&typeof lunghTxt==="function")
    ? (x)=>lunghTxt(Math.abs(x),1) : (x)=>Math.abs(x)+" "+c.u;
  const seg=(x)=>(x>0?"+":x<0?"−":"");
  h+=`<div class="hint" style="margin-top:8px">`
    +esc(trh("{v1}: {v2} in {v3} misurazioni.",
        {v1:cap(c.n),v2:seg(dv)+uTxt(dv),v3:s.length}))
    +(dw!=null?" "+esc(trh("Nello stesso periodo il peso: {v1}.",
        {v1:seg(dw)+((typeof pesoTxt==="function")?pesoTxt(Math.abs(dw),1):Math.abs(dw)+" kg")})):"")
    +`</div>`;
  /* LA FRASE CHE VALE IL MODULO. Si dice solo quando i due segni
     divergono davvero, e si dice come ipotesi — non è una diagnosi,
     e chi legge non è un paziente da informare ma una persona da non
     spaventare con un peso fermo.
     La CONDIZIONE non si scrive qui: la calcola `evoRicomposizione`,
     che è la stessa che parla al modello. Due calcoli della stessa
     cosa divergerebbero, e la carta direbbe ricomposizione mentre
     l'analisi dice stallo — alla stessa persona, nella stessa
     pagina. */
  if(evoRicomposizione(c.k))
    h+=`<div class="hint" style="border-left:4px solid var(--salvia);padding-left:12px;margin-top:8px">`
      +esc(tr("Il peso è quasi fermo ma questa misura è scesa: spesso vuol dire ricomposizione, non stallo. Parlane con chi ti segue."))+`</div>`;
  h+=`</div>`;
  return h;}
window.evoluzioneHTML=evoluzioneHTML;

/* Il disegno. Due assi: la misura a sinistra, il peso a destra —
   grandezze diverse non condividono una scala, e forzarle insieme
   appiattirebbe quella piccola fino a farla sembrare immobile. */
var EVOCH=null;
function drawEvoluzione(){
  try{
    const cv=document.getElementById("chEvo");
    if(!cv||typeof Chart==="undefined")return;
    if(EVOCH){EVOCH.destroy();EVOCH=null;}
    const attivo=evoCampo(),c=EVO_CAMPI().find(x=>x.k===attivo);
    const s=evoSerie(attivo);
    if(s.length<2)return;
    const W=evoPesi(s[0].d,s[s.length-1].d);
    /* un asse dei tempi solo: le date di TUTTE e due le serie, in
       ordine — così i due tracciati stanno sullo stesso tempo e non
       su due elenchi diversi che sembrano allineati */
    const date=[...new Set(s.map(x=>x.d).concat(W.map(x=>x.d)))].sort();
    const loc=(typeof dataLoc==="function")?dataLoc():"it-IT";
    const et=date.map(d=>{try{return new Date(d+"T12:00:00").toLocaleDateString(loc,{day:"numeric",month:"short"});}catch(e){return d;}});
    const vesti=(x)=>(c.dove==="circ"&&typeof lunghNum==="function")?lunghNum(x,1):x;
    const mappa=(arr,f)=>date.map(d=>{const p=arr.find(x=>x.d===d);return p?f(p.v):null;});
    const dati=[{label:c.n+" ("+((c.dove==="circ"&&typeof unitaLungh==="function")?unitaLungh():c.u)+")",
      data:mappa(s,vesti),tension:.3,borderColor:"#0C7C74",pointRadius:3,spanGaps:true}];
    if(W.length>=2)dati.push({label:((typeof unitaPeso==="function")?tr("peso")+" ("+unitaPeso()+")":"peso (kg)"),
      data:mappa(W,x=>(typeof pesoNum==="function")?pesoNum(x,1):x),
      tension:.3,borderColor:"#E4632F",borderDash:[6,5],pointRadius:2,spanGaps:true,yAxisID:"y2"});
    EVOCH=new Chart(cv,{type:"line",data:{labels:et,datasets:dati},
      options:{animation:false,plugins:{legend:{labels:{boxWidth:11,font:{size:10}}}},
        scales:{x:{ticks:{font:{size:9}}},
          y2:{position:"right",grid:{drawOnChartArea:false}}}}});
  }catch(e){}}
window.drawEvoluzione=drawEvoluzione;
