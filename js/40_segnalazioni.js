/* ═══════════════════════════════════════════════════════════════
   40. SEGNALAZIONI E PROPOSTE — UNA SOLA SCHEDA
   ═══════════════════════════════════════════════════════════════
   Prima c'erano due strade diverse per dire la stessa cosa: «qui
   si è rotto» e «qui si può fare meglio». Sono lo stesso gesto —
   una persona che si ferma e ti scrive — e meritano un posto solo.

   Cosa cambia rispetto a prima:
   · un tipo si sceglie toccando, non aprendo una tendina;
   · la schermata da cui scrivi viene rilevata da sola (chi segnala
     un bug quasi mai ricorda di dire DOVE è successo);
   · la bozza si salva mentre scrivi: cambiare pagina non la perde;
   · se la posta non si apre — succede spesso nelle PWA Android —
     resta il pulsante «Copia»: il testo non muore nel vuoto;
   · quello che hai mandato resta scritto qui, con la data.

   Nessun dato alimentare, nessun peso, nessun profilo esce mai:
   i tecnici allegati sono versione, dispositivo e schermo.        */

const SEG_CHIAVE="nuvia_segnalazioni";
const SEG_BOZZA="nuvia_seg_bozza";

const SEG_TIPI=[
  {k:"bug",    e:"gear", n:"Bug",           d:"Qualcosa non funziona"},
  {k:"idea",   e:"star", n:"Idea",          d:"Vorrei che facesse anche…"},
  {k:"meglio", e:"pencil", n:"Miglioria",     d:"Funziona, ma si può fare meglio"},
  {k:"altro",  e:"chiedi", n:"Altro",         d:"Un pensiero, un dubbio, un grazie"}
];

const SEG_GRAVITA=[
  {k:"blocca", n:"Mi blocca",      d:"non posso proseguire"},
  {k:"fastidio",n:"Fastidioso",    d:"si aggira, ma pesa"},
  {k:"piccolo",n:"Piccolo",        d:"un dettaglio"}
];

/* Le schermate con il nome che usa la persona, non quello del codice */
const SEG_SCHERMI={
  punto:"Il punto", oggi:"La giornata", piano:"Il piano", spesa:"La spesa",  /* tradotte al disegno */
  sport:"Sport", comestai:"Come stai", storico:"Numeri e storico",
  io:"Io", sistema:"Sistema", regole:"Regole", tools:"Strumenti",
  guida:"Guida", nuvia:"Nuvi", setup:"Configurazione",
  onb2:"Primo avvio", piani:"Piani"
};

function segLista(){
  try{return JSON.parse(localStorage.getItem(SEG_CHIAVE)||"[]");}catch(e){return [];}}
function segSalvaLista(l){
  try{localStorage.setItem(SEG_CHIAVE,JSON.stringify(l.slice(-30)));}catch(e){}}

function segBozza(){
  try{return JSON.parse(localStorage.getItem(SEG_BOZZA)||"null")||
    {tipo:"bug",grav:"fastidio",testo:"",schermo:"",tec:true};}
  catch(e){return {tipo:"bug",grav:"fastidio",testo:"",schermo:"",tec:true};}}
function segSalvaBozza(b){
  try{localStorage.setItem(SEG_BOZZA,JSON.stringify(b));}catch(e){}}

/* La schermata da cui parte la segnalazione.
   La scheda vive in «Sistema»: ci si arriva quasi sempre DOPO aver
   visto il problema altrove, quindi quello che conta è l'ultima
   pagina di lavoro, non quella da cui parte il tocco. */
const SEG_TECNICHE=["sistema","io","regole","tools","guida","setup"];
let SEG_ULTIMA_PAGINA="";
try{
  const _show=window.show;
  if(typeof _show==="function"){
    window.show=function(p){
      try{
        if(typeof cur!=="undefined"&&cur&&SEG_TECNICHE.indexOf(cur)<0&&SEG_TECNICHE.indexOf(p)>=0)
          SEG_ULTIMA_PAGINA=cur;
      }catch(e){}
      return _show.apply(this,arguments);};}
}catch(e){}

function segSchermoAuto(){
  const p=SEG_ULTIMA_PAGINA||(typeof cur!=="undefined"?cur:"");
  return SEG_SCHERMI[p]||"";}

/* ── I dati tecnici: si vedono prima di mandarli ──────────────── */
function segTecnici(){
  const r=[];
  try{r.push("Nuvia v"+(typeof APP_VER!=="undefined"?APP_VER:"?"));}catch(e){}
  try{r.push("Data: "+new Date().toLocaleString(typeof dataLoc==="function"?dataLoc():"it-IT"));}catch(e){}
  try{r.push("Dispositivo: "+navigator.userAgent);}catch(e){}
  try{r.push("Schermo: "+window.innerWidth+"x"+window.innerHeight+" @"+(window.devicePixelRatio||1)+"x");}catch(e){}
  try{r.push("Lingua: "+(navigator.language||"?"));}catch(e){}
  try{r.push("Installata: "+(window.matchMedia("(display-mode: standalone)").matches?"sì (PWA)":"no (browser)"));}catch(e){}
  try{r.push("Rete: "+(navigator.onLine?"online":"offline"));}catch(e){}
  try{r.push("AI configurata: "+(typeof aiOn==="function"&&aiOn()?"sì":"no"));}catch(e){}
  try{r.push("Piano: "+(typeof ricetteVuote==="function"&&ricetteVuote()?"vuoto":
    (S&&S.ricette?"personalizzato":"originale")));}catch(e){}
  return r.join("\n");}
window.segTecnici=segTecnici;

/* ── Il testo che parte ────────────────────────────────────────── */
function segCorpo(b){
  const t=SEG_TIPI.find(x=>x.k===b.tipo)||SEG_TIPI[0];
  let s=t.e+" "+t.n.toUpperCase()+" — "+t.d+"\n";
  if(b.tipo==="bug"){
    const g=SEG_GRAVITA.find(x=>x.k===b.grav);
    if(g)s+="Gravità: "+g.n+" ("+g.d+")\n";}
  if(b.schermo)s+="Schermata: "+b.schermo+"\n";
  s+="\n"+(b.testo||"").trim()+"\n";
  if(b.tec)s+="\n---\n"+segTecnici()+"\n";
  return s;}

/* ── Le azioni ─────────────────────────────────────────────────── */
function segLeggiForm(){
  const b=segBozza();
  const x=document.getElementById("segTxt");
  const c=document.getElementById("segTec");
  const s=document.getElementById("segSchermo");
  if(x)b.testo=x.value;
  if(c)b.tec=!!c.checked;
  if(s)b.schermo=s.value;
  segSalvaBozza(b);
  return b;}

window.segTipo=(k)=>{const b=segLeggiForm();b.tipo=k;segSalvaBozza(b);segRidisegna();};
window.segGrav=(k)=>{const b=segLeggiForm();b.grav=k;segSalvaBozza(b);segRidisegna();};
window.segCambia=()=>{segLeggiForm();};

function segRidisegna(){
  const w=document.getElementById("seg-scheda");
  if(!w)return;
  const foc=document.activeElement&&document.activeElement.id==="segTxt";
  const pos=foc?document.getElementById("segTxt").selectionStart:null;
  w.outerHTML=segnalazioniHTML();
  if(foc){const n=document.getElementById("segTxt");
    if(n){n.focus();try{n.setSelectionRange(pos,pos);}catch(e){}}}}

window.segInvia=()=>{
  const b=segLeggiForm();
  if(!(b.testo||"").trim())
    return dlgAlert(tr("Scrivi prima cosa vuoi segnalare: bastano due righe."));
  const t=SEG_TIPI.find(x=>x.k===b.tipo)||SEG_TIPI[0];
  const ogg="[Nuvia "+(typeof APP_VER!=="undefined"?APP_VER:"")+"] "+t.n+
    (b.schermo?" · "+b.schermo:"");
  const url="mailto:"+DEV_MAIL+"?subject="+encodeURIComponent(ogg)+
    "&body="+encodeURIComponent(segCorpo(b));
  segArchivia(b);
  try{location.href=url;}catch(e){}
  setTimeout(()=>toast(tr("Si apre la tua email: premi invia per spedire")),300);
  setTimeout(()=>{segNuova();},900);};

window.segCopia=async()=>{
  const b=segLeggiForm();
  if(!(b.testo||"").trim())
    return dlgAlert(tr("Scrivi prima cosa vuoi segnalare: bastano due righe."));
  const testo=DEV_MAIL+"\n\n"+segCorpo(b);
  let ok=false;
  try{await navigator.clipboard.writeText(testo);ok=true;}
  catch(e){
    try{const ta=document.createElement("textarea");
      ta.value=testo;ta.style.position="fixed";ta.style.opacity="0";
      document.body.appendChild(ta);ta.select();
      ok=document.execCommand("copy");document.body.removeChild(ta);}
    catch(e2){ok=false;}}
  if(ok){segArchivia(b);
    toast(tr("Copiato: incollalo dove vuoi, l'indirizzo è in cima"));
    segNuova();}
  else dlgAlert(tr("Non riesco a copiare da solo. Seleziona il testo a mano e copialo."));};

function segArchivia(b){
  const t=SEG_TIPI.find(x=>x.k===b.tipo)||SEG_TIPI[0];
  const l=segLista();
  l.push({q:Date.now(),tipo:b.tipo,n:t.n,e:t.e,
    schermo:b.schermo||"",
    estratto:(b.testo||"").trim().slice(0,90)});
  segSalvaLista(l);}

function segNuova(){
  segSalvaBozza({tipo:"bug",grav:"fastidio",testo:"",schermo:"",tec:true});
  segRidisegna();}
window.segNuova=segNuova;

window.segScorda=(q)=>{
  segSalvaLista(segLista().filter(x=>String(x.q)!==String(q)));
  segRidisegna();};

window.segVediTecnici=()=>{dlgAlert(tr("Ecco esattamente cosa viene allegato:")+"\n\n"+segTecnici());};

/* ── La scheda ─────────────────────────────────────────────────── */
function segnalazioniHTML(){
  const b=segBozza();
  if(!b.schermo)b.schermo=segSchermoAuto();
  const t=SEG_TIPI.find(x=>x.k===b.tipo)||SEG_TIPI[0];
  const storia=segLista().slice().reverse();

  const chips=SEG_TIPI.map(x=>
    `<button title="${tr("Apri")}" type="button" class="chipbtn${x.k===b.tipo?" on":""}" onclick="segTipo('${x.k}')">${ic(x.e,15)} ${esc(tr(x.n))}</button>`
  ).join("");

  const gravita = b.tipo==="bug"
    ? `<label>${esc(tr("Quanto ti pesa"))}</label>
       <div class="mtools" style="margin-top:4px">${SEG_GRAVITA.map(g=>
         `<button type="button" class="chipbtn${g.k===b.grav?" on":""}" onclick="segGrav('${g.k}')">${esc(tr(g.n))}</button>`
       ).join("")}</div>
       <div class="hint">${esc(tr("Serve a mettere in fila i lavori: quello che blocca passa davanti."))}</div>`
    : "";

  const opz=Object.keys(SEG_SCHERMI).map(k=>SEG_SCHERMI[k]);
  const sel=`<select id="segSchermo" onchange="segCambia()">
    <option value=""${b.schermo?"":" selected"}>${esc(tr("— non riguarda una schermata —"))}</option>
    ${opz.map(n=>`<option value="${esc(n)}"${n===b.schermo?" selected":""}>${esc(tr(n))}</option>`).join("")}
  </select>`;

  const ph = b.tipo==="bug"
    ? tr("Cosa hai fatto, cosa ti aspettavi, cosa è successo invece. Anche a righe: 1) ho toccato… 2) mi aspettavo… 3) invece…")
    : tr("Raccontala come viene. Se hai in mente il problema che risolve, scrivi anche quello: aiuta più della soluzione.");

  const storiaHTML = storia.length
    ? `<div class="gsec" style="margin-left:0">${esc(tr("Quello che hai già mandato"))}</div>
       <div class="pills">${storia.map(s=>
         `<div class="pill"><div class="pilltop">
            <span class="pilll">${s.e||"💬"} ${esc(s.n||"")}${s.schermo?" · "+esc(s.schermo):""}</span>
            <span class="pilll">${esc(new Date(s.q).toLocaleDateString(typeof dataLoc==="function"?dataLoc():"it-IT"))}</span>
          </div>
          <div style="font-size:13px;margin-top:4px">${esc(s.estratto||"")}${(s.estratto||"").length>=90?"…":""}</div>
          <div class="mtools" style="margin-top:8px"><button class="btn ghost small" onclick="segScorda('${s.q}')">${esc(tr("Togli dalla lista"))}</button></div>
        </div>`).join("")}</div>
       <div class="hint">${esc(tr("Questa lista sta solo sul tuo telefono: è un promemoria per te, non un ticket aperto da qualche parte."))}</div>`
    : "";

  return `<div class="card" id="seg-scheda">
  <h2>${esc(tr("Segnala un bug o proponi un'idea"))}</h2>
  <div class="hint">${esc(tr("Una cosa che non funziona e una cosa che potrebbe funzionare meglio sono lo stesso gesto: ti sei fermato a scrivermi. Grazie."))}</div>

  <label>${esc(tr("Di cosa si tratta"))}</label>
  <div class="mtools" style="margin-top:4px">${chips}</div>
  <div class="hint">${esc(tr(t.d))}</div>

  ${gravita}

  <label>${esc(tr("Dove succede"))}</label>
  ${sel}
  ${b.schermo&&b.schermo===segSchermoAuto()?`<div class="hint">${esc(tr("Rilevata da sola dall'ultima schermata che hai aperto: cambiala se sbaglio."))}</div>`:""}

  <label>${esc(tr("Raccontamelo"))}</label>
  <textarea id="segTxt" rows="5" style="min-height:130px" oninput="segCambia()" placeholder="${esc(ph)}">${esc(b.testo||"")}</textarea>
  <div class="hint">${esc(tr("La bozza si salva mentre scrivi: se esci e torni, la ritrovi qui."))}</div>

  <label class="ckline"><input type="checkbox" id="segTec" ${b.tec?"checked":""} onchange="segCambia()">
    ${esc(tr("Allega i dati tecnici"))}</label>
  <div class="hint">${esc(tr("Versione, dispositivo, schermo, lingua e se l'AI è configurata. Non escono né i tuoi dati alimentari né il profilo."))}</div>
  <div class="mtools" style="margin-top:8px"><button class="btn ghost small" onclick="segVediTecnici()">${esc(tr("Vedi cosa esce"))}</button></div>

  <div class="btngrid2">
    <button class="btn ghost" onclick="segInvia()">${esc(tr("Invia per email"))}</button>
    <button class="btn ghost" onclick="segCopia()">${esc(tr("Copia il testo"))}</button>
  </div>
  ${hint2(tr("Se la posta non si apre, usa «Copia»: incolli dove preferisci."),
          tr("Nelle app installate da browser il collegamento alla posta a volte non parte: non è colpa tua e non è un dato perso. Con «Copia» il testo finisce negli appunti, indirizzo compreso, e lo mandi da dove vuoi — anche da un messaggio."))}

  ${storiaHTML}
</div>`;}
window.segnalazioniHTML=segnalazioniHTML;
