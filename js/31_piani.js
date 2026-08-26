/* ═══════════════════════════════════════════════════════════════
   31. PIANI, GATING E PROPOSTE (Sprint 6)
   ═══════════════════════════════════════════════════════════════
   Qui si decide come Nuvia chiede soldi. Tre regole, e sono di
   prodotto prima che di codice:

   1. IL BASE È UN'APP COMPLETA, NON UN ASSAGGIO. Diario, alimenti
      propri, arco, peso, streak, storico, Drive: tutto funziona
      senza pagare e senza AI. Chi non può o non vuole spendere deve
      trovarsi bene lo stesso — è acquisizione, è passaparola, ed è
      anche la rete di chi disdice. Una funzione bloccata non porta
      mai a un vicolo cieco: c'è SEMPRE una strada Free che risolve
      lo stesso bisogno in modo più lento.

   2. NON SI VENDE NEI MOMENTI DI FRAGILITÀ. Mai dopo un pasto
      commentato con la faccina più tenera, mai dentro una schermata
      che parla di peso in salita, mai in un modale che blocca.
      Vendere a chi si sente giù funziona una volta e brucia tutto.

   3. IL PAZIENTE DI UNO STUDIO NON VEDE PREZZI. Mai. Paga il centro,
      e un listino che compare a chi non deve pagare è un errore che
      si nota subito e non si dimentica.                            */

/* ── Cosa serve per cosa ────────────────────────────────────────
   Stessi livelli del server, e non è una duplicazione da eliminare:
   qui servono a DISEGNARE, là a DECIDERE. Se divergono, comanda il
   server e l'interfaccia mostra un pulsante che non funziona — mai
   il contrario. */
const LIVELLI={piano:1,analisi:2,foto:2,supporto:3,allenamenti:3};
window.LIVELLI=LIVELLI;

/* La strada Free per ogni funzione a pagamento: è l'antidoto al
   vicolo cieco. Ogni voce dice cosa si può fare comunque, e come. */
const ALTERNATIVE={
  piano:      {t:"Puoi comporre la settimana a mano dal Piano: ci vuole più tempo, ma il risultato è tuo.",azione:"show('piano')",eti:"Vai al piano"},
  analisi:    {t:"Puoi scrivere il pasto a mano: il bilancio del giorno si aggiorna lo stesso.",azione:"show('oggi')",eti:"Scrivi il pasto"},
  foto:       {t:"Puoi scrivere cosa hai mangiato: il conto delle calorie è identico.",azione:"show('oggi')",eti:"Scrivi il pasto"},
  supporto:   {t:"Nella pagina Come stai trovi comunque i tuoi schemi e i tuoi numeri.",azione:"show('comestai')",eti:"Vai a Come stai"},
  allenamenti:{t:"Puoi segnare gli allenamenti a mano: entrano nel bilancio come sempre.",azione:"show('sport')",eti:"Vai agli allenamenti"}
};
window.ALTERNATIVE=ALTERNATIVE;

/* ── Il cancello ────────────────────────────────────────────────
   Risponde a «posso usare questa funzione?» e, se no, dice sempre
   COSA si può fare al posto suo. Non è mai un muro. */
function cancello(pilastro){
  const serve=LIVELLI[pilastro]||1;
  const ho=(typeof contoLivello==="function")?contoLivello():0;
  /* Chi usa la propria chiave ha tutto: è un accordo diverso, e chi
     c'era prima non deve trovarsi peggio di com'era. */
  const chiavePropria=!!(S.ai&&S.ai.key);
  if(chiavePropria)return {ok:true,motivo:"chiave"};
  if(ho>=serve)return {ok:true,motivo:"piano"};
  return {ok:false,serve,ho,
    alternativa:ALTERNATIVE[pilastro]||null,
    piano:serve>=3?"premium":(serve>=2?"complete":"start")};}
window.cancello=cancello;

/* Il messaggio quando una funzione non è inclusa: dice cosa la
   sblocca, ma soprattutto cosa si può fare SUBITO senza pagare. */
function cancelloHTML(pilastro){
  const g=cancello(pilastro);
  if(g.ok)return "";
  /* Si segna che questa funzione è stata cercata davvero. È l'unico
     segnale onesto per una proposta: «hai provato a fare questa cosa»
     invece di «ti mostro una pubblicità». Senza, l'offerta sulla foto
     si attiverebbe solo per chi le foto le ha già usate — cioè per
     nessuno di quelli a cui è destinata. */
  try{const P=proposte();
    if(!Array.isArray(P.tentati))P.tentati=[];
    if(!P.tentati.includes(pilastro)){P.tentati.push(pilastro);save();}}catch(e){}
  const alt=g.alternativa;
  return `<div class="card" data-gate="${esc(pilastro)}">
    <div class="hint">${esc(tr("Questa funzione è inclusa nei piani con l'AI."))}</div>
    ${alt?`<div class="hint" style="margin-top:8px"><b>${esc(tr(alt.t))}</b></div>
      <button class="btn ghost small" type="button" onclick="${alt.azione}">${esc(tr(alt.eti))}</button>`:""}
    ${contoSenzaPrezzi()?"":`<div class="mtools"><button class="btn ghost small" type="button"
      onclick="show('piani')">${esc(tr("Vedi i piani"))}</button></div>`}
  </div>`;}
window.cancelloHTML=cancelloHTML;

/* ── Le proposte ────────────────────────────────────────────────
   Una proposta al momento giusto è un servizio; la stessa proposta
   ripetuta è molestia. Le regole sono aritmetiche apposta, così si
   possono collaudare invece che discutere. */
const PROPOSTA_OGNI=14*24*3600*1000;      /* quattordici giorni */

function proposte(){
  if(!S.propos||typeof S.propos!=="object")S.propos={};
  const P=S.propos;
  if(typeof P.ultima!=="number")P.ultima=0;
  if(!Array.isArray(P.viste))P.viste=[];
  if(typeof P.rifiuti!=="number")P.rifiuti=0;
  if(!Array.isArray(P.tentati))P.tentati=[];
  return P;}
window.propostaStato=proposte;

/* I momenti in cui NON si propone nulla. È la lista più importante
   di questo file: ogni riga è una persona che avremmo infastidito. */
function momentoSbagliato(){
  try{
    /* 1 · paziente di uno studio: non paga e non deve vedere prezzi */
    if(contoSenzaPrezzi())return "studio";
    /* 2 · rapporto difficile col cibo: mai vendere sulla fragilità */
    if(typeof profiloDelicato==="function"&&profiloDelicato())return "delicato";
    /* 3 · subito dopo un pasto commentato con la faccina più tenera */
    if(S.propos&&S.propos.ultimoEsito==="nutre")return "dopo-pasto";
    /* 4 · giornata dichiarata difficile */
    if(typeof isHard==="function"&&isHard(iso(new Date())))return "giornata-difficile";
    /* 5 · peso in salita nell'ultima pesata */
    const W=(S.profile.weights||[]).filter(x=>x&&(x.w||x.kg));
    if(W.length>=2){
      const u=+(W[W.length-1].w||W[W.length-1].kg),p=+(W[W.length-2].w||W[W.length-2].kg);
      if(u>p+0.3)return "peso-in-salita";}
    /* 6 · ha già detto no tre volte: ha risposto, e la risposta vale */
    if(proposte().rifiuti>=3)return "ha-gia-detto-no";
  }catch(e){}
  return null;}
window.momentoSbagliato=momentoSbagliato;

/* Le proposte possibili: contestuali, cioè legate a una cosa che la
   persona ha appena provato a fare. Una proposta a freddo è pubblicità. */
const OFFERTE=[
  {k:"foto",serve:1,
   quando:()=>tentato("foto"),
   t:"Con l'AI la foto del piatto diventa un pasto registrato in due secondi.",
   piano:"start"},
  {k:"piano",serve:1,
   quando:()=>tentato("piano"),
   t:"Con l'AI la settimana e la lista della spesa te le preparo io.",
   piano:"start"},
  {k:"allenamenti",serve:2,
   quando:()=>tentato("allenamenti")||
     (!cancello("allenamenti").ok&&typeof abitualiPerSettimana==="function"&&abitualiPerSettimana()>=2),
   t:"Con Complete tengo conto degli allenamenti nel bilancio della giornata.",
   piano:"complete"}
];

/* Ha provato a usare questa funzione e ha trovato il cancello? */
function tentato(k){
  try{return !cancello(k).ok&&proposte().tentati.includes(k);}catch(e){return false;}}
window.tentato=tentato;
window.OFFERTE=OFFERTE;

function propostaDaMostrare(){
  const sbagliato=momentoSbagliato();
  if(sbagliato)return null;
  const P=proposte();
  if(Date.now()-P.ultima<PROPOSTA_OGNI)return null;
  for(const p of OFFERTE){
    if(P.viste.includes(p.k))continue;      /* una volta per tipo, mai due */
    let ok=false;try{ok=!!p.quando();}catch(e){}
    if(ok)return p;}
  return null;}
window.propostaDaMostrare=propostaDaMostrare;

function propostaHTML(){
  const p=propostaDaMostrare();
  if(!p)return "";
  return `<div class="card" data-proposta="${esc(p.k)}">
    <div class="hint">${esc(tr(p.t))}</div>
    <div class="mtools">
      <button class="btn ghost small" type="button" onclick="propostaApri('${esc(p.k)}')">${esc(tr("Vedi i piani"))}</button>
      <button class="btn ghost small" type="button" onclick="propostaNo('${esc(p.k)}')">${esc(tr("Non ora"))}</button>
    </div></div>`;}
window.propostaHTML=propostaHTML;

window.propostaApri=(k)=>{const P=proposte();
  P.ultima=Date.now();if(!P.viste.includes(k))P.viste.push(k);save();
  show("piani");};
window.propostaNo=(k)=>{const P=proposte();
  P.ultima=Date.now();P.rifiuti++;if(!P.viste.includes(k))P.viste.push(k);save();
  try{render(cur);}catch(e){}};

/* Il commento del pasto avvisa qui: serve solo a NON proporre nulla
   subito dopo una faccina tenera. È un dato che si scrive, non si
   legge da nessun'altra parte. */
window.propostaEsitoPasto=(stato)=>{
  const P=proposte();P.ultimoEsito=stato;P.quandoEsito=Date.now();save();};

/* ── La pagina dei piani ────────────────────────────────────────
   Il listino arriva dal server: nel client non c'è un prezzo scritto.
   Se il server non risponde, si dice — non si inventa una cifra. */
function euro(cent,valuta){
  const v=(valuta==="EUR"||!valuta)?"€":valuta;
  return (cent/100).toFixed(2).replace(".",",")+" "+v;}
window.euro=euro;

window.pianiCarica=async()=>{
  try{
    const r=await fetch(contoUrl()+"/piani");
    const j=await r.json();
    if(j&&j.piani){S.ui.listino=j.piani;S.ui.listinoIl=Date.now();save();
      try{render(cur);}catch(e){}}
  }catch(e){}};

function renderPiani(){
  const el=document.getElementById("pg-piani");if(!el)return;
  /* Chi non paga non deve nemmeno vedere che esiste un listino. */
  if(contoSenzaPrezzi()){
    el.innerHTML=`<div class="card"><h2>${esc(tr("Il tuo piano"))}</h2>
      <div class="hint">${esc(tr("Il tuo studio ha attivato tutte le funzioni: non c'è nulla da pagare e nulla da scegliere."))}</div>
      <button class="btn ghost" type="button" onclick="show('io')">${esc(tr("Torna a Io"))}</button></div>`;
    return;}

  const listino=(S.ui&&S.ui.listino)||null;
  let h=`<div class="card"><h2>${esc(tr("I piani"))}</h2>
    <div class="hint">${esc(tr("Il piano Free resta com'è: diario, peso, progressi e backup, senza scadenza e senza pagare. Gli abbonamenti aggiungono l'AI — e il mensile è sempre l'annuale diviso 8."))}</div></div>`;

  if(!listino){
    h+=`<div class="card"><div class="hint">${esc(tr("Non riesco a leggere i prezzi in questo momento: serve la connessione."))}</div>
      <button class="btn ghost" type="button" onclick="pianiCarica()">${esc(tr("Riprova"))}</button></div>`;
    el.innerHTML=h;return;}

  Object.keys(listino).forEach(k=>{
    const p=listino[k];
    const attuale=(conto().vista&&conto().vista.piano)===k;
    h+=`<div class="card" data-piano="${esc(k)}">
      <h2>${esc(p.nome)}${attuale?" · "+esc(tr("il tuo")):""}</h2>
      <div class="p3" style="margin:12px 0">
        <div><div class="pv ora" style="font-size:22px">${esc(euro(p.prezzi.mese,p.prezzi.valuta))}</div>
          <div class="pl">${esc(tr("al mese"))}</div></div>
        <div><div class="pv" style="font-size:22px">${esc(euro(p.prezzi.anno,p.prezzi.valuta))}</div>
          <div class="pl">${esc(tr("all'anno"))}</div></div>
      </div>
      ${p.prova?`<div class="hint"><b>${esc(tr("Il primo mese {p}",{p:euro(p.prova.prezzo,p.prezzi.valuta)}))}</b><br>${esc(tr("Si disdice in un tocco, e ti avviso prima del rinnovo."))}</div>`:""}
      ${attuale
        ? `<div class="mtools"><button class="btn ghost small" type="button" onclick="pianoPortale()">${esc(tr("Gestisci o disdici"))}</button></div>`
        : `<div class="mtools">
             <button class="btn ghost small" type="button" onclick="pianoCompra('${esc(k)}','mese')">${esc(tr("Mensile"))}</button>
             <button class="btn ghost small" type="button" onclick="pianoCompra('${esc(k)}','anno')">${esc(tr("Annuale"))}</button>
           </div>`}
    </div>`;});

  h+=`<div class="card"><h2>${esc(tr("Hai un codice del tuo studio?"))}</h2>
    <input type="text" id="pianoCod" placeholder="STUDIO-XXXX">
    <button class="btn" type="button" onclick="pianoRiscatta()">${esc(tr("Attiva il codice"))}</button>
    <div class="aibox" id="pianoOut" aria-live="polite" style="display:none"></div></div>`;
  el.innerHTML=h;}
window.renderPiani=renderPiani;

window.pianoCompra=async(piano,cadenza)=>{
  if(!contoEntrato())return dlgAlert(tr("Prima entra con la tua email: l'abbonamento si lega al conto."));
  try{
    const r=await contoChiama("/checkout",{metodo:"POST",corpo:{piano,cadenza}});
    if(r.stato===409)return dlgAlert(r.dati.messaggio||tr("Il tuo studio ha già attivato tutto."));
    if(r.stato!==200)return dlgAlert(tr("Non riesco ad aprire il pagamento. Riprova fra poco."));
    if(r.dati.url)return void(location.href=r.dati.url);
    dlgAlert(tr("I pagamenti non sono ancora attivi su questo server."));
  }catch(e){dlgAlert(tr("Serve la connessione per abbonarsi."));}};

window.pianoPortale=async()=>{
  try{
    const r=await contoChiama("/portale",{metodo:"POST"});
    if(r.dati&&r.dati.url)return void(location.href=r.dati.url);
    dlgAlert(r.dati&&r.dati.messaggio||tr("Il portale non è disponibile in questo momento."));
  }catch(e){dlgAlert(tr("Serve la connessione per gestire l'abbonamento."));}};

window.pianoRiscatta=async()=>{
  const i=document.getElementById("pianoCod"),box=document.getElementById("pianoOut");
  const r=await contoRiscatta(i?i.value:"");
  if(box){box.style.display="block";box.textContent=r.msg;}};
