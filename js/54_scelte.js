/* ═══════════════════════════════════════════════════════════════
   54. LE SCELTE CHE SI VEDONO
   ═══════════════════════════════════════════════════════════════
   Quattro file di cinque stelline identiche — sonno, umore,
   stress, fame nervosa — chiedevano di leggere l'etichetta per
   sapere cosa si stava votando, e non dicevano niente sul
   significato del voto. Cinque stelle sono cinque stelle: una
   luna che si copre di nuvole è un sonno andato male.

   IL PRINCIPIO: un'icona che CAMBIA vale una scala. Non cinque
   copie della stessa cosa più intense, ma cinque cose diverse
   che raccontano il passaggio. È così che si toglie una parola
   senza togliere un'informazione.

   E le micro-animazioni, tutte con la stessa regola: durano meno
   di mezzo secondo, succedono quando cambia qualcosa di vero, e
   spariscono. Chi ha chiesto meno movimento non ne vede nessuna
   e non perde niente.                                            */

/* ── SONNO: dalla luna coperta al riposo pieno ───────────────── */
const SCALE={
  sleep:{
    nome:"Come hai dormito",
    v:[{i:"nuvola", c:"#8FA3B8", t:"Male"},
       {i:"luna_q", c:"#7E93AE", t:"Poco"},
       {i:"luna",   c:"#6E86A6", t:"Così così"},
       {i:"luna_p", c:"#4E7FA8", t:"Bene"},
       {i:"stelle", c:"#0C7C74", t:"Benissimo"}]},
  /* ── UMORE: la bocca cambia, non l'intensità di una stella ── */
  feel:{
    nome:"Come ti senti",
    v:[{i:"giu",    c:"#B0566A", t:"Giù"},
       {i:"fiacco", c:"#C77A5E", t:"Fiacco"},
       {i:"neutro", c:"#8A9A97", t:"Normale"},
       {i:"bene",   c:"#3E9E8C", t:"Bene"},
       {i:"carico", c:"#00AFA3", t:"Carico"}]},
  /* ── STRESS: il nodo che si stringe ── */
  stress:{
    nome:"Quanto stress",
    v:[{i:"calmo",  c:"#3E9E8C", t:"Calmo"},
       {i:"lieve",  c:"#7FB0A0", t:"Poco"},
       {i:"medio",  c:"#D2A24C", t:"Medio"},
       {i:"tanto",  c:"#DD8A4A", t:"Tanto"},
       {i:"tempest",c:"#C6553C", t:"Tantissimo"}]},
  /* ── FAME NERVOSA: la fiamma che cresce ── */
  emo:{
    nome:"Fame nervosa",
    v:[{i:"spenta", c:"#8A9A97", t:"Nessuna"},
       {i:"fiamma1",c:"#E8C07A", t:"Un po'"},
       {i:"fiamma2",c:"#E4A05C", t:"Media"},
       {i:"fiamma3",c:"#DD7A45", t:"Forte"},
       {i:"fiamma4",c:"#C6553C", t:"Fortissima"}]}
};
window.SCALE=SCALE;

/* I disegni: tratto unico, 24×24, coerenti col set ICONS. */
const SCALA_SVG={
 nuvola:'<path d="M7 16a3.4 3.4 0 0 1 .6-6.7 5 5 0 0 1 9.5 1.2A3.2 3.2 0 0 1 17 16z"/><path d="M8 20h3M14 20h3"/>',
 luna_q:'<path d="M17 14.5A7 7 0 0 1 9.5 7a7 7 0 1 0 7.5 7.5z"/><path d="M6 18h4"/>',
 luna:  '<path d="M18 14.8A7.6 7.6 0 0 1 9.2 6a7.6 7.6 0 1 0 8.8 8.8z"/>',
 luna_p:'<path d="M18 14.8A7.6 7.6 0 0 1 9.2 6a7.6 7.6 0 1 0 8.8 8.8z"/><path d="M19 5.5v3M17.5 7h3"/>',
 stelle:'<path d="M18 14.8A7.6 7.6 0 0 1 9.2 6a7.6 7.6 0 1 0 8.8 8.8z"/><path d="M19 4v3.4M17.3 5.7h3.4M6 17.6V20M4.8 18.8h2.4"/>',
 giu:   '<circle cx="12" cy="12" r="8.4"/><path d="M8.6 16c1-1.4 5.8-1.4 6.8 0"/><path d="M9 9.6h.01M15 9.6h.01"/>',
 fiacco:'<circle cx="12" cy="12" r="8.4"/><path d="M8.6 15.2h6.8"/><path d="M8.4 9.4h1.6M14 9.4h1.6"/>',
 neutro:'<circle cx="12" cy="12" r="8.4"/><path d="M8.8 14.8h6.4"/><path d="M9 9.6h.01M15 9.6h.01"/>',
 bene:  '<circle cx="12" cy="12" r="8.4"/><path d="M8.4 14c1 1.6 6.2 1.6 7.2 0"/><path d="M9 9.4h.01M15 9.4h.01"/>',
 carico:'<circle cx="12" cy="12" r="8.4"/><path d="M8 13.6c1.2 2.2 6.8 2.2 8 0"/><path d="M8.4 9.6c.5-.8 1.4-.8 1.9 0M13.7 9.6c.5-.8 1.4-.8 1.9 0"/>',
 calmo: '<path d="M4 12h16"/><path d="M6 8h12M6 16h12" opacity=".45"/>',
 lieve: '<path d="M4 12q4-2.4 8 0t8 0"/><path d="M6 7.5h12M6 16.5h12" opacity=".35"/>',
 medio: '<path d="M4 12q3-4.4 6 0t6 0 4-2"/><path d="M7 17h10" opacity=".3"/>',
 tanto: '<path d="M4 12q2.2-6 4.4 0t4.4 0 4.4 0 2.8-3"/>',
 tempest:'<path d="M3 12q1.8-7 3.6 0t3.6 0 3.6 0 3.6 0 2.6-4"/><path d="M13 3.5 10 10h3l-1.4 5"/>',
 spenta:'<path d="M12 20a5.4 5.4 0 0 1-5.4-5.4c0-3.4 3.6-5 5.4-9.6 1.8 4.6 5.4 6.2 5.4 9.6A5.4 5.4 0 0 1 12 20z" opacity=".35"/>',
 fiamma1:'<path d="M12 20a4.4 4.4 0 0 1-4.4-4.4c0-2.6 3-4.2 4.4-7.6 1.4 3.4 4.4 5 4.4 7.6A4.4 4.4 0 0 1 12 20z"/>',
 fiamma2:'<path d="M12 20a5 5 0 0 1-5-5c0-3.1 3.4-4.8 5-8.8 1.6 4 5 5.7 5 8.8a5 5 0 0 1-5 5z"/>',
 fiamma3:'<path d="M12 20.5a5.6 5.6 0 0 1-5.6-5.6C6.4 11.3 10.2 9.4 12 5c1.8 4.4 5.6 6.3 5.6 9.9A5.6 5.6 0 0 1 12 20.5z"/><path d="M12 17.4a2 2 0 0 1-2-2c0-1.3 1.3-2 2-3.4.7 1.4 2 2.1 2 3.4a2 2 0 0 1-2 2z" opacity=".5"/>',
 fiamma4:'<path d="M12 21a6.2 6.2 0 0 1-6.2-6.2C5.8 10.7 10 8.6 12 3.8c2 4.8 6.2 6.9 6.2 11A6.2 6.2 0 0 1 12 21z"/><path d="M12 17.8a2.3 2.3 0 0 1-2.3-2.3c0-1.5 1.5-2.3 2.3-3.9.8 1.6 2.3 2.4 2.3 3.9a2.3 2.3 0 0 1-2.3 2.3z" opacity=".55"/>'
};

function scalaIcona(nome,sz,pieno){
  const p=SCALA_SVG[nome];
  if(!p)return "";
  return '<svg viewBox="0 0 24 24" width="'+(sz||24)+'" height="'+(sz||24)+
    '" fill="'+(pieno?"currentColor":"none")+'" stroke="currentColor" stroke-width="1.7" '+
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';}
window.scalaIcona=scalaIcona;

/* Il nome del voto, in parole, per il lettore di schermo e per il
   riepilogo sotto: l'icona non è mai muta. */
/* I nomi dei voti passano da tr() ESPLICITI. `tr(v.t)` sarebbe più
   corto ma invisibile al collaudo delle traduzioni, e lascerebbe
   venti chiavi orfane nel dizionario. È la regola scritta in
   v13.12 dopo esserci cascato tre volte. */
function scalaTesto(campo,n){
  const k=campo+n;
  return k==="sleep1"?tr("Male"):k==="sleep2"?tr("Poco"):k==="sleep3"?tr("Così così")
       :k==="sleep4"?tr("Bene"):k==="sleep5"?tr("Benissimo")
       :k==="feel1"?tr("Giù"):k==="feel2"?tr("Fiacco"):k==="feel3"?tr("Normale")
       :k==="feel4"?tr("Bene"):k==="feel5"?tr("Carico")
       :k==="stress1"?tr("Calmo"):k==="stress2"?tr("Poco"):k==="stress3"?tr("Medio")
       :k==="stress4"?tr("Tanto"):k==="stress5"?tr("Tantissimo")
       :k==="emo1"?tr("Nessuna"):k==="emo2"?tr("Un po'"):k==="emo3"?tr("Media")
       :k==="emo4"?tr("Forte"):k==="emo5"?tr("Fortissima"):"";}
window.scalaTesto=scalaTesto;

/* ── la riga di scelta ────────────────────────────────────────── */
/* Cinque icone diverse, non cinque copie: si tocca quella che
   somiglia a come stai. Quella scelta si accende e si ingrandisce
   di un soffio; le altre restano in grigio, leggibili ma quiete. */
window.scalaRiga=(di,campo)=>{
  const S1=SCALE[campo];
  if(!S1)return "";
  const d=S.week.days[di]||{};
  const val=+d[campo]||0;
  return `<div class="scala" role="group" aria-label="${esc(campo==="sleep"?tr("Come hai dormito"):campo==="feel"?tr("Come ti senti"):campo==="stress"?tr("Quanto stress"):tr("Fame nervosa"))}">
    ${S1.v.map((v,i)=>{
      const n=i+1, scelto=val===n;
      return `<button class="scbtn${scelto?" on":""}" style="${scelto?"color:"+v.c:""}"
        onclick="scalaSet(${di},'${campo}',${n})"
        aria-pressed="${scelto}" aria-label="${esc(scalaTesto(campo,n))}" title="${esc(scalaTesto(campo,n))}"
        >${scalaIcona(v.i,26,scelto)}</button>`;}).join("")}
    <span class="scnome">${val?esc(scalaTesto(campo,val)):""}</span>
  </div>`;};

window.scalaSet=(di,campo,n)=>{
  try{usoSegna("scala");}catch(e){}
  const d=S.week.days[di];
  d[campo]=(+d[campo]===n)?0:n;   /* toccare due volte annulla */
  save();
  /* il tocco si sente: l'icona scelta fa un piccolo salto */
  try{
    const b=event&&event.currentTarget;
    if(b&&b.animate&&matchMedia("(prefers-reduced-motion: no-preference)").matches)
      b.animate([{transform:"scale(1)"},{transform:"scale(1.22)"},{transform:"scale(1)"}],
        {duration:260,easing:"cubic-bezier(.22,1,.36,1)"});
  }catch(e){}
  render(cur);};

/* ── IL NUMERO CHE SALE ───────────────────────────────────────
   Quando le calorie del giorno cambiano, il numero non deve
   saltare al valore nuovo: ci arriva contando in 420 ms. È il
   modo più semplice di far vedere CHE è cambiato qualcosa senza
   scrivere «aggiornato». */
window.numeroSale=(el,da,a)=>{
  if(!el)return;
  try{
    if(!matchMedia("(prefers-reduced-motion: no-preference)").matches){
      el.textContent=String(Math.round(a));return;}
  }catch(e){el.textContent=String(Math.round(a));return;}
  const t0=performance.now(), dur=420;
  const passo=(t)=>{
    const k=Math.min(1,(t-t0)/dur);
    const e=1-Math.pow(1-k,3);           /* frena alla fine, come una cosa vera */
    el.textContent=String(Math.round(da+(a-da)*e));
    if(k<1)requestAnimationFrame(passo);};
  requestAnimationFrame(passo);};
