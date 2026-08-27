/* ═══════════════════════════════════════════════════════════════
   30. IL CONTO (Sprint 5)
   ═══════════════════════════════════════════════════════════════
   Con l'abbonamento la chiave Gemini sparisce dall'esperienza: la
   persona entra con la sua email e l'AI funziona. Chi ha già la
   propria chiave la tiene — è un'impostazione avanzata, non un
   requisito, e chi l'aveva non deve accorgersi di nulla.

   Tre cose che questo modulo NON fa, e sono le più importanti:

   1. NON DECIDE A COSA HAI DIRITTO. Legge quello che dice il
      server e disegna di conseguenza. Se qualcuno scrive a mano
      `S.conto.livelloAI=3`, l'interfaccia gli mostrerà dei pulsanti
      che il proxy si rifiuterà di servire. Nascondere è cortesia,
      il controllo sta dall'altra parte.
   2. NON MANDA VIA I DATI. Sul server vanno identità e abbonamento.
      Diario, peso e foto restano qui e sul Drive della persona.
      «Non possiamo venderli perché non ce li abbiamo» è un argomento
      di vendita solo finché è vero.
   3. NON BLOCCA NIENTE QUANDO NON C'È RETE. Senza connessione il
      diario, le spunte, il peso e il piano già scaricato funzionano
      esattamente come prima. L'AI no, e si dice — senza drammi.   */

const CONTO_BASE="https://api.nuvia.app";     /* si cambia in Regole → Avanzate */

function contoUrl(){
  try{return (S.conto&&S.conto.base)||CONTO_BASE;}catch(e){return CONTO_BASE;}}
window.contoUrl=contoUrl;

/* ── Lo stato ───────────────────────────────────────────────────
   Proprietà nuova, con default. `vista` è la copia di quello che il
   server ha detto l'ultima volta: serve a disegnare l'interfaccia
   anche offline, e non è mai una fonte di verità. */
function conto(){
  if(!S.conto||typeof S.conto!=="object")S.conto={};
  const C=S.conto;
  if(typeof C.token!=="string")C.token="";
  if(!C.vista||typeof C.vista!=="object")C.vista=null;
  return C;}
window.conto=conto;

function contoEntrato(){const C=conto();return !!C.token&&!!C.vista;}
window.contoEntrato=contoEntrato;

/* Il livello AI di cui il client CREDE di disporre. Serve solo a
   decidere cosa mostrare: la parola definitiva è del proxy. */
function contoLivello(){
  const C=conto();
  return (C.vista&&+C.vista.livelloAI)||0;}
window.contoLivello=contoLivello;

function contoSenzaPrezzi(){
  const C=conto();
  return !!(C.vista&&C.vista.senzaPrezzi);}
window.contoSenzaPrezzi=contoSenzaPrezzi;

/* Quanto resta di un pilastro, secondo l'ultima risposta del server.
   -1 = illimitato, null = non lo sappiamo (offline, o piano senza quote). */
function contoResta(pilastro){
  const C=conto();
  if(!C.vista||!C.vista.resti)return null;
  const v=C.vista.resti[pilastro];
  return (v===undefined)?null:v;}
window.contoResta=contoResta;

/* I nomi dei pilastri arrivano a tr() da una variabile (le chiavi delle
   quote che il server manda): invisibili a una ricerca testuale, come le
   frasi degli stati vuoti e del tono. Si dichiarano al registro. */
const CONTO_PILASTRI=["piano","analisi","foto","supporto","allenamenti"];
window.contoFrasi=function(){return CONTO_PILASTRI.concat(["senza limiti"]);};

/* ── Le chiamate ────────────────────────────────────────────────
   Un solo punto di uscita verso il server, così i ripieghi (rete
   assente, sessione scaduta) si gestiscono una volta sola. */
async function contoChiama(via,opz){
  opz=opz||{};
  const C=conto();
  const r=await fetch(contoUrl()+via,{
    method:opz.metodo||"GET",
    headers:Object.assign({"Content-Type":"application/json"},
      C.token?{Authorization:"Bearer "+C.token}:{}),
    body:opz.corpo?JSON.stringify(opz.corpo):undefined});
  let j={};try{j=await r.json();}catch(e){}
  /* Sessione caduta: si esce con garbo invece di mostrare errori a
     ripetizione su ogni schermata. */
  if(r.status===401&&C.token){contoEsciLocale();}
  return {stato:r.status,dati:j};}
window.contoChiama=contoChiama;

window.contoChiediCodice=async(email)=>{
  const e=String(email||"").trim().toLowerCase();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))
    return {ok:false,msg:tr("Controlla l'indirizzo email.")};
  try{
    const r=await contoChiama("/auth/chiedi",{metodo:"POST",corpo:{email:e}});
    if(r.stato!==200)return {ok:false,msg:tr("Non sono riuscito a mandare il codice. Riprova fra poco.")};
    conto().emailInCorso=e;save();
    return {ok:true,msg:tr("Ti ho mandato un codice a {e}. Arriva entro un minuto.",{e})};
  }catch(err){
    return {ok:false,msg:tr("Serve la connessione per entrare. Il diario intanto funziona.")};}};

window.contoVerifica=async(codice)=>{
  const C=conto();
  const e=C.emailInCorso||"";
  try{
    const r=await contoChiama("/auth/verifica",{metodo:"POST",
      corpo:{email:e,codice:String(codice||"").trim()}});
    if(r.stato!==200||!r.dati.token)
      return {ok:false,msg:r.stato===429
        ? tr("Troppi tentativi. Chiedi un codice nuovo.")
        : tr("Il codice non corrisponde. Controlla e riprova.")};
    C.token=r.dati.token;C.vista=r.dati.conto;delete C.emailInCorso;save();
    try{render(cur);}catch(e2){}
    return {ok:true,msg:tr("Bentornato.")};
  }catch(err){
    return {ok:false,msg:tr("Serve la connessione per entrare. Il diario intanto funziona.")};}};

/* Uscita locale: si dimentica il gettone senza chiedere permesso al
   server (che potrebbe non rispondere). I dati della persona restano
   dove sono sempre stati: qui. */
function contoEsciLocale(){
  const C=conto();C.token="";C.vista=null;delete C.emailInCorso;save();}
window.contoEsciLocale=contoEsciLocale;

window.contoEsci=async()=>{
  try{await contoChiama("/auth/esci",{metodo:"POST"});}catch(e){}
  contoEsciLocale();
  try{toast(tr("Sei uscito. I tuoi dati restano su questo telefono."));}catch(e){}
  try{render(cur);}catch(e){}};

/* Si aggiorna all'avvio e dopo ogni chiamata AI: le quote cambiano
   mentre si usa l'app, e un numero vecchio è peggio di nessun numero. */
window.contoAggiorna=async()=>{
  const C=conto();
  if(!C.token)return null;
  try{
    const r=await contoChiama("/io");
    if(r.stato===200&&r.dati.conto){C.vista=r.dati.conto;save();return C.vista;}
  }catch(e){}
  return null;};

window.contoRiscatta=async(codice)=>{
  try{
    const r=await contoChiama("/licenza",{metodo:"POST",
      corpo:{codice:String(codice||"").trim()}});
    if(r.stato!==200)return {ok:false,msg:tr("Questo codice non risulta valido.")};
    conto().vista=r.dati.conto;save();
    try{render(cur);}catch(e){}
    return {ok:true,msg:tr("Fatto: il tuo studio ha attivato tutte le funzioni.")};
  }catch(e){return {ok:false,msg:tr("Serve la connessione per attivare il codice.")};}};

/* ── La pagina ──────────────────────────────────────────────────
   Chi non è entrato vede una porta; chi è entrato vede cosa ha e
   quanto gli resta. Nessuno vede prezzi se è paziente di uno studio. */
function contoHTML(){
  const C=conto();
  if(!contoEntrato()){
    /* Il pulsante è a contorno e non pieno: la primaria di questa pagina
       è la pesata, che si fa ogni giorno. Entrare si fa una volta sola. */
    return `<div class="card" data-conto="fuori"><h2>${esc(tr("Il tuo conto"))}</h2>
      <div class="hint">${esc(tr("Con un conto l'AI funziona senza configurare niente. Il diario, il peso e le foto restano su questo telefono: sul nostro server ci sono solo la tua email e l'abbonamento."))}</div>
      ${C.emailInCorso
        ? `<label>${esc(tr("Il codice che ti ho mandato"))}</label>
           <input type="text" id="contoCod" inputmode="numeric" maxlength="6" placeholder="123456">
           <button class="btn ghost" type="button" onclick="contoEntra()">${esc(tr("Entra"))}</button>
           <div class="mtools"><button class="btn ghost small" type="button" onclick="contoAnnulla()">${esc(tr("Cambia email"))}</button></div>`
        : `<label>${esc(tr("La tua email"))}</label>
           <input type="email" id="contoMail" placeholder="nome@esempio.it">
           <button class="btn ghost" type="button" onclick="contoChiedi()">${esc(tr("Mandami un codice"))}</button>`}
      <div class="aibox" id="contoOut" aria-live="polite" style="display:none"></div>
    </div>`;}

  const v=C.vista||{};
  const quote=v.resti||{};
  const righe=Object.keys(quote).filter(k=>quote[k]!==undefined);
  return `<div class="card" data-conto="dentro"><h2>${esc(tr("Il tuo conto"))}</h2>
    <div class="p3" style="margin:8px 0 12px">
      <div><div class="pv ora" style="font-size:20px">${esc(v.nomePiano||"—")}</div>
        <div class="pl">${esc(v.studio?tr("dal tuo studio"):tr("il tuo piano"))}</div></div>
    </div>
    <div class="hint">${esc(v.email||"")}</div>
    ${righe.length?`<div class="lgrid" style="margin-top:12px">${righe.map(k=>
      `<div class="lg" data-quota="${esc(k)}">${esc(tr(k))}: ${quote[k]<0
        ? esc(tr("senza limiti"))
        : esc(tr("{n} questo mese",{n:quote[k]}))}</div>`).join("")}</div>`:""}
    <div class="mtools">
      <button class="btn ghost small" type="button" onclick="contoEsci()">${esc(tr("Esci"))}</button>
    </div>
  </div>`;}
window.contoHTML=contoHTML;

window.contoChiedi=async()=>{
  const e=document.getElementById("contoMail"),box=document.getElementById("contoOut");
  const r=await contoChiediCodice(e?e.value:"");
  if(box){box.style.display="block";box.textContent=r.msg;}
  if(r.ok)try{render(cur);}catch(e2){}};

window.contoEntra=async()=>{
  const c=document.getElementById("contoCod"),box=document.getElementById("contoOut");
  const r=await contoVerifica(c?c.value:"");
  if(box){box.style.display="block";box.textContent=r.msg;}};

window.contoAnnulla=()=>{const C=conto();delete C.emailInCorso;save();
  try{render(cur);}catch(e){}};
