/* ═══════════════════════════════════════════════════════════════
   28. GAMIFICATION A COSTO ZERO E PESO IN PRIMO PIANO (Sprint 4)
   ═══════════════════════════════════════════════════════════════
   Il principio, e non è una preferenza estetica: la gamification non
   deve MAI chiedere tempo, solo restituire soddisfazione per azioni
   già fatte. Niente pianta da innaffiare, niente lezioni da
   completare, niente missioni da accettare. Chi apre l'app deve
   poterla chiudere trenta secondi dopo avendo fatto quello per cui
   era entrato.

   Da qui tre scelte che sembrano piccole e non lo sono:
   · l'anello della settimana si riempie DA SOLO con le spunte che la
     persona farebbe comunque;
   · la missione del giorno è una riga sotto il diario e si completa
     da sola: non esiste un bottone «accetto», perché accettare una
     missione è già lavoro;
   · i traguardi arrivano come un avviso di due secondi e vanno a
     dormire nello Storico. Nessuna bacheca da visitare.

   Costo per la persona: zero secondi al giorno.                    */

/* ── Lo stato: proprietà nuova, con default, non tocca nulla ───── */
function gioco(){
  if(!S.gioco||typeof S.gioco!=="object")S.gioco={};
  const G=S.gioco;
  if(!Array.isArray(G.traguardi))G.traguardi=[];   /* chiavi già festeggiate */
  if(!G.missioni||typeof G.missioni!=="object")G.missioni={};
  return G;}
window.gioco=gioco;

/* ── L'anello della settimana ───────────────────────────────────
   Sette tacche, una per giorno. Verde piena = giornata chiusa in
   target; contorno = giornata segnata ma non in target; vuota = da
   vivere. Nessun tocco richiesto: si riempie con le spunte.
   Il futuro non si giudica: i giorni non ancora arrivati restano
   neutri, perché una settimana che parte con quattro caselle grigie
   sembra già persa il lunedì. */
function settimanaTacche(){
  const oggi=wd(new Date());
  return S.week.days.map((d,di)=>{
    if(di>oggi)return "futuro";
    const items=dayItems(di);
    const segnati=items.filter(it=>{
      const st=S.week.days[it.pdi].meals[it.mi];return st.done||st.skip;}).length;
    if(!segnati&&!(d.extras||[]).length)return "vuoto";
    return dayInTarget(di)?"pieno":"segnato";});}
window.settimanaTacche=settimanaTacche;

function anelloHTML(){
  const t=settimanaTacche();
  const fatti=t.filter(x=>x==="pieno").length;
  const G=["L","M","M","G","V","S","D"];
  return `<div class="anello" data-anello="1"
      role="img" aria-label="${esc(tr("{n} giorni in target questa settimana",{n:fatti}))}">
    ${t.map((s,i)=>`<span class="tacca ${s}" aria-hidden="true"><i>${G[i]}</i></span>`).join("")}
  </div>`;}
window.anelloHTML=anelloHTML;

/* ── La missione del giorno ─────────────────────────────────────
   Deterministica per data: la stessa persona, lo stesso giorno, vede
   sempre la stessa missione — se cambiasse a ogni ridisegno sarebbe
   rumore. Si sceglie da regole locali, senza AI: deve funzionare in
   metropolitana come funziona a casa.

   E soprattutto: OGNI missione si completa con un gesto che la
   persona farebbe comunque. Se per completarla servisse un'azione in
   più, sarebbe un compito travestito da gioco. */
const MISSIONI=[
  {k:"spunta3",  t:"Spunta tre pasti oggi",
   fatto:di=>dayItems(di).filter(it=>S.week.days[it.pdi].meals[it.mi].done).length>=3},
  {k:"proteine", t:"Resta in target sulle proteine",
   fatto:di=>eatenOfDay(di).p>=dayTargetP()*0.9},
  {k:"acqua",    t:"Bevi i bicchieri d'acqua di oggi",
   fatto:di=>(+S.week.days[di].water||0)>=waterGoal(di)},
  {k:"pesata",   t:"Segna una pesata",
   fatto:()=>{const w=(S.profile.weights||[]);
     return w.length>0&&w[w.length-1].d===iso(new Date());}},
  {k:"verdura",  t:"Metti la verdura in almeno due pasti",
   fatto:di=>eatenOfDay(di).fib>=dayTargetFib()*0.6},
  {k:"movimento",t:"Muoviti, anche solo una camminata",
   fatto:di=>burnedOfDay(di)>0||(+S.week.days[di].steps||0)>0},
  {k:"chiudi",   t:"Chiudi la giornata: nessun pasto lasciato in sospeso",
   fatto:di=>dayItems(di).length>0&&dayItems(di).every(it=>{
     const st=S.week.days[it.pdi].meals[it.mi];return st.done||st.skip;})}
];
window.MISSIONI=MISSIONI;

/* Il seme: giorno dell'anno. Semplice, stabile, senza dipendenze. */
function missioneDelGiorno(dISO){
  const s=dISO||iso(new Date());
  let n=0;for(let i=0;i<s.length;i++)n=(n*31+s.charCodeAt(i))>>>0;
  return MISSIONI[n%MISSIONI.length];}
window.missioneDelGiorno=missioneDelGiorno;

function missioneHTML(di){
  const m=missioneDelGiorno(iso(VIEW));
  let fatta=false;
  try{fatta=!!m.fatto(di);}catch(e){}
  /* Completata: si registra, per il traguardo delle missioni di fila.
     Nessun avviso: la persona ha già visto la riga diventare verde. */
  if(fatta){const G=gioco(),k=iso(VIEW);
    if(!G.missioni[k]){G.missioni[k]=m.k;save();}}
  return `<div class="missione ${fatta?"fatta":""}" data-missione="${esc(m.k)}" data-fatta="${fatta?1:0}">
    <span class="msegno" aria-hidden="true">${fatta?"✓":"·"}</span>
    <span class="mtesto">${esc(tr(m.t))}</span>
  </div>`;}
window.missioneHTML=missioneHTML;

/* ── I traguardi ────────────────────────────────────────────────
   Arrivano da soli, si vedono due secondi e vanno nello Storico.
   Ognuno si festeggia UNA volta sola: rivedere lo stesso traguardo
   a ogni apertura lo trasformerebbe da regalo a rumore. */
const TRAGUARDI=[
  {k:"streak7",   t:"Sette giorni in target di fila",  quando:()=>(S.streak.count||0)>=7},
  {k:"streak30",  t:"Trenta giorni in target",         quando:()=>(S.streak.count||0)>=30},
  {k:"streak100", t:"Cento giorni in target",          quando:()=>(S.streak.count||0)>=100},
  {k:"pesata1",   t:"La prima pesata",                 quando:()=>((S.profile.weights||[]).length)>=1},
  {k:"pesate10",  t:"Dieci pesate segnate",            quando:()=>((S.profile.weights||[]).length)>=10},
  {k:"piano1",    t:"Le prime ricette della settimana",  quando:()=>!!S.ricette&&!ricetteVuote()},
  {k:"missioni7", t:"Sette missioni completate",       quando:()=>Object.keys(gioco().missioni||{}).length>=7},
  {k:"settimana1",t:"La prima settimana archiviata",   quando:()=>((S.history||[]).length)>=1}
];
window.TRAGUARDI=TRAGUARDI;

/* Missioni e traguardi arrivano a tr() dentro una variabile: invisibili a
   una ricerca testuale, in entrambe le direzioni. Come per gli stati vuoti
   e per il tono, si dichiarano al registro delle chiavi dinamiche. */
window.giocoFrasi=function(){
  return MISSIONI.map(m=>m.t).concat(TRAGUARDI.map(t=>t.t));};

function traguardiRaggiunti(){
  const G=gioco();
  return TRAGUARDI.filter(t=>G.traguardi.includes(t.k));}
window.traguardiRaggiunti=traguardiRaggiunti;

/* Si controlla all'avvio e dopo le azioni che possono averne aperto
   uno. Al massimo UNO per volta: due avvisi di fila si annullano. */
function traguardiControlla(){
  const G=gioco();
  for(const t of TRAGUARDI){
    if(G.traguardi.includes(t.k))continue;
    let ok=false;try{ok=!!t.quando();}catch(e){}
    if(!ok)continue;
    G.traguardi.push(t.k);save();
    try{toastFatto("🎉 "+tr(t.t));}catch(e){}
    return t;                       /* uno solo per volta */
  }
  return null;}
window.traguardiControlla=traguardiControlla;
/* Qui c'era un secondo giro di controllo per la costellazione
   (v15.5.0): la costellazione è confluita nella ruota, e la ruota si
   controlla già a OGNI salvataggio (ruotaDopoSalvataggio, in 11_2).
   Un terzo controllo qui sarebbe stato solo un posto in più in cui
   dimenticarsi di lei. */

function traguardiHTML(){
  const presi=traguardiRaggiunti();
  if(!presi.length)return "";
  return `<div class="card" data-traguardi="1"><h2>${esc(tr("I tuoi traguardi"))}</h2>
    <div class="trlist">${presi.map(t=>
      `<span class="trg" data-trg="${esc(t.k)}">🎉 ${esc(tr(t.t))}</span>`).join("")}</div></div>`;}
window.traguardiHTML=traguardiHTML;

/* ── Il peso in primo piano ─────────────────────────────────────
   Partenza, oggi, obiettivo: tre numeri e una riga. È la domanda che
   porta la gente ad aprire l'app, e stava in fondo a una pagina.

   La pesata rapida non sostituisce la scheda completa (massa grassa,
   pressione, circonferenze): quella resta dov'è per chi la usa. Qui
   c'è solo il numero, perché segnare il peso deve costare due tocchi. */
function pesoDati(){
  const W=(S.profile.weights||[]).filter(x=>x&&(x.w||x.kg));
  const val=x=>+(x.w||x.kg);
  const part=W.length?val(W[0]):(+S.profile.w||0);
  const ora=+S.profile.w||(W.length?val(W[W.length-1]):0);
  const obb=+S.profile.goalW||0;
  return {partenza:Math.round(part*10)/10,attuale:Math.round(ora*10)/10,
          obiettivo:obb?Math.round(obb*10)/10:null,n:W.length};}
window.pesoDati=pesoDati;

function pesoHeroHTML(){
  const d=pesoDati();
  if(!d.attuale)return "";
  const delta=Math.round((d.attuale-d.partenza)*10)/10;
  /* I TRE NUMERONI PORTANO L'UNITÀ NEL TITOLO, NON ACCANTO (28/08).
     Prima non ce l'avevano affatto: chi vive in libbre leggeva «80» e
     capiva ottanta libbre. Ripeterla tre volte in tre caselle strette
     però non si può, quindi la dice il titolo una volta sola e i
     numeri restano numeri. */
  const uP=(typeof unitaPeso==="function")?unitaPeso():"kg";
  const vP=(x)=>(x==null)?null:((typeof pesoNum==="function")?pesoNum(x,1):x);
  return `<div class="card" data-pesohero="1"><h2>${esc(trh("Il tuo peso ({v1})",{v1:uP}))}</h2>
    <div class="p3">
      <div><div class="pv">${vP(d.partenza)||"—"}</div><div class="pl">${esc(tr("partenza"))}</div></div>
      <div><div class="pv ora">${vP(d.attuale)||"—"}</div><div class="pl">${esc(tr("oggi"))}</div></div>
      <div><div class="pv">${vP(d.obiettivo)||"—"}</div><div class="pl">${esc(tr("obiettivo"))}</div></div>
    </div>
    ${d.n>1&&delta!==0?`<div class="hint" style="text-align:center">${esc(delta<0
      ? tr("{n} dalla partenza.",{n:(typeof pesoTxt==="function")?pesoTxt(delta,1):delta+" kg"})
      : tr("{n} dalla partenza: i pesi oscillano, conta la direzione nel tempo.",{n:"+"+((typeof pesoTxt==="function")?pesoTxt(delta,1):delta+" kg")}))}</div>`:""}
    <button class="btn" type="button" onclick="pesataRapida()">${esc(tr("Aggiungi una pesata"))}</button>
  </div>`;}
window.pesoHeroHTML=pesoHeroHTML;

window.pesataRapida=async()=>{
  const oggi=+S.profile.w||70;
  const v=await dlgPrompt(tr("Quanto pesi oggi?"),String(oggi));
  const kg=parseFloat(String(v==null?"":v).replace(",","."));
  if(!(kg>=25&&kg<=400))return;
  pesataSalva(kg);};

/* Separata dal dialogo: così il collaudo può salvare una pesata senza
   passare dall'interfaccia, e la regola di aggiornamento sta in un
   posto solo. */
function pesataSalva(kg){
  const oggiIso=iso(new Date());
  S.profile.w=Math.round(kg*10)/10;
  S.profile.weights=S.profile.weights||[];
  const ultima=S.profile.weights[S.profile.weights.length-1];
  /* Due pesate nello stesso giorno non fanno due righe: l'ultima
     corregge la prima. Altrimenti lo storico si riempie di ripensamenti
     e la media del giorno diventa un caso. */
  if(ultima&&ultima.d===oggiIso)ultima.w=S.profile.w;
  else S.profile.weights.push({d:oggiIso,w:S.profile.w,fat:null,mus:null,pa:null,spo2:null});
  S.profile.weights.sort((a,b)=>String(a.d).localeCompare(String(b.d)));
  save();
  traguardiControlla();
  try{toast(tr("Segnato: {n}",{n:(typeof pesoTxt==="function")?pesoTxt(S.profile.w,1):S.profile.w+" kg"}));}catch(e){}
  try{render(cur);}catch(e){}
  return S.profile.w;}
window.pesataSalva=pesataSalva;

/* ── Il blocco che si innesta nel diario ────────────────────────── */
function giocoHTML(di){
  return `<div class="card" data-gioco="1">
    <h2>${esc(tr("La tua settimana"))}</h2>
    ${anelloHTML()}
    ${missioneHTML(di)}
  </div>`;}
window.giocoHTML=giocoHTML;
