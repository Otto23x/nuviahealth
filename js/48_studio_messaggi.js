/* ═══════════════════════════════════════════════════════════════
   48. LO STUDIO CHE PARLA — messaggi firmati e appuntamenti
   ═══════════════════════════════════════════════════════════════
   Fra una visita e l'altra passano trenta giorni: il professionista
   non sa nulla, e il paziente si arrangia. Questo modulo apre quel
   canale dalla parte del telefono.

   TRE REGOLE, e la prima è quella che ci distingue:

   1 · IL TONO VALE ANCHE PER IL DOTTORE.
       Il messaggio passa dal filtro delle parole vietate lato
       server E si controlla di nuovo qui prima di mostrarlo.
       Un'app gentile che ospita un rimprovero firmato è peggio di
       un'app severa: la gentilezza sarebbe solo una facciata che
       cade nel momento che conta.

   2 · SI RICEVE SOLO SE SI È DETTO SÌ.
       Il consenso «messaggi» è suo, separato dagli altri, e si
       spegne quando vuole. Chiuderlo non chiude la cura: chiude
       il canale.

   3 · UN MESSAGGIO NON È UNA NOTIFICA.
       Arriva nell'app e aspetta. Nessuna vibrazione alle 22, e
       soprattutto nessun conteggio rosso che pesa: chi ha un
       nutrizionista non ha bisogno di un altro debito da saldare.

   L'APPUNTAMENTO invece merita un promemoria, perché dimenticarlo
   costa soldi veri a lui e una visita a te. Passa comunque dalle
   regole di P-3: niente cibo nel testo, niente ore di silenzio.    */

/* ── quello che arriva ─────────────────────────────────────────── */
function studioMsg(){
  if(!S.studioMsg||typeof S.studioMsg!=="object")
    S.studioMsg={lista:[],visti:[],app:[],ultimo:null};
  const M=S.studioMsg;
  M.lista=M.lista||[];M.visti=M.visti||[];M.app=M.app||[];
  return M;}
window.studioMsg=studioMsg;

/* Il filtro del tono, di nuovo, sul testo che sta per essere mostrato.
   Il server lo ha già fatto: questo è il secondo giro, per il caso in
   cui un giorno il server cambi e nessuno se ne accorga. */
function messaggioMostrabile(t){
  const basso=String(t||"").toLowerCase();
  if(!basso.trim())return false;
  const vietate=(typeof PAROLE_VIETATE!=="undefined")?PAROLE_VIETATE:[];
  return !vietate.some(p=>basso.indexOf(String(p).toLowerCase())>=0);}
window.messaggioMostrabile=messaggioMostrabile;

window.studioMsgAggiorna=async()=>{
  if(!haStudio||!haStudio())return false;
  const c=consensi();
  if(!c||!c.messaggi)return false;            /* nessun sì, nessun canale */
  try{
    const r=await fetch(contoUrl()+"/portale/messaggi",
      {headers:{"Accept":"application/json"}});
    if(!r.ok)return false;
    const j=await r.json();
    const M=studioMsg();
    if(Array.isArray(j.messaggi))
      M.lista=j.messaggi.filter(m=>messaggioMostrabile(m&&m.t)).slice(-20);
    if(Array.isArray(j.appuntamenti))M.app=j.appuntamenti.slice(0,10);
    M.ultimo=new Date().toISOString();
    save();
    return true;
  }catch(e){return false;}};

/* ── i non letti: si contano, non si sbandierano ──────────────── */
function studioMsgNuovi(){
  const M=studioMsg();
  return M.lista.filter(m=>M.visti.indexOf(m.quando)<0).length;}
window.studioMsgNuovi=studioMsgNuovi;

window.studioMsgSegnaVisti=()=>{
  const M=studioMsg();
  M.lista.forEach(m=>{if(M.visti.indexOf(m.quando)<0)M.visti.push(m.quando);});
  if(M.visti.length>60)M.visti=M.visti.slice(-60);
  save();};

/* ── gli appuntamenti ─────────────────────────────────────────── */
function prossimoAppuntamento(){
  const M=studioMsg();
  const ora=new Date().toISOString();
  const futuri=(M.app||[]).filter(a=>a.quando>=ora).sort((a,b)=>a.quando<b.quando?-1:1);
  return futuri[0]||null;}
window.prossimoAppuntamento=prossimoAppuntamento;

/* I nomi delle agende passano da tr() ESPLICITO, non da una variabile:
   tr(x) con x variabile è invisibile al collaudo delle traduzioni, e
   la chiave finisce orfana nel dizionario. Lezione già imparata in
   P-8: si scrive la scelta a mano. */
function agendaNome(k){
  return k==="trattamenti"?tr("Trattamento")
       :k==="palestra"    ?tr("Allenamento")
       :k==="nutrizione"  ?tr("Visita")
       :tr("Appuntamento");}

function appuntamentoTesto(a){
  if(!a)return null;
  const d=new Date(a.quando);
  const quando=d.toLocaleDateString(typeof dataLoc==="function"?dataLoc():"it-IT",
    {weekday:"long",day:"numeric",month:"long"});
  const ora=d.toTimeString().slice(0,5);
  return tr("{c} {q} alle {o}",{c:agendaNome(a.agenda),q:quando,o:ora});}
window.appuntamentoTesto=appuntamentoTesto;

/* Il promemoria: il giorno prima, e passa dai cancelli come tutti.
   Un appuntamento dimenticato costa una visita a te e dei soldi a lui:
   è una delle poche cose per cui vale la pena farsi sentire. */
window.appuntamentoOra=(quando)=>{
  const a=prossimoAppuntamento();
  if(!a)return null;
  const t=quando||new Date();
  const giorni=Math.round((Date.parse(a.quando)-t)/86400000);
  if(giorni!==1)return null;
  const msg=curaComponi({
    messaggio:appuntamentoTesto(a),
    mossa:tr("Segnatelo")});
  if(!msg)return null;
  if(!curaTestoOk(msg.titolo+" "+msg.azione).ok)return null;
  if(!curaSiPuo("studio",t).ok)return null;
  return msg;};

/* ── la card nella pagina Io ──────────────────────────────────── */
function studioMsgHTML(){
  const M=studioMsg();
  const c=(typeof consensi==="function")?consensi():{};
  if(!c||!c.messaggi)return "";
  const app=prossimoAppuntamento();
  if(!M.lista.length&&!app)return "";

  let h=`<div class="card"><h2>${tr("Dal tuo studio")}</h2>`;
  if(app)h+=`<div class="app-riga">${ic("storico",16)} ${esc(appuntamentoTesto(app))}
    ${app.nota?`<div class="hint">${esc(app.nota)}</div>`:""}</div>`;
  M.lista.slice(-5).reverse().forEach(m=>{
    const d=new Date(m.quando);
    h+=`<div class="msg-studio">
      <div>${esc(m.t)}</div>
      <div class="msg-firma">${esc(m.da||tr("il tuo studio"))} · ${esc(d.toLocaleDateString(typeof dataLoc==="function"?dataLoc():"it-IT"))}</div>
    </div>`;});
  h+=`<div class="hint">${esc(tr("Puoi chiudere questo canale quando vuoi, dai consensi: chiuderlo non chiude la cura."))}</div>`;
  h+=`</div>`;
  return h;}
window.studioMsgHTML=studioMsgHTML;
