/* ═══════════════════════════════════════════════════════════════
   57. QUELLO CHE USI DAVVERO
   ═══════════════════════════════════════════════════════════════
   Il passo 4 del piano UX è «mettere in cima le cose che si usano
   di più». Ma senza sapere quali sono, riordinare è arredare al
   buio: si sposta in alto ciò che sembra importante a chi ha
   scritto l'app, che è l'ultima persona da ascoltare su questo.

   Quindi prima si misura. Questo modulo conta i tocchi delle
   funzioni, e lo fa con tre vincoli non negoziabili:

   1. RESTA SUL TELEFONO. È un contatore locale, non telemetria:
      nessun evento parte da qui. Chi vuole mandarci i numeri
      anonimi lo fa già dalla telemetria, che è un'altra cosa e ha
      il suo consenso.
   2. CONTA I GESTI, NON I CONTENUTI. Sa che hai toccato «foto
      pasto» dodici volte; non sa che cosa hai fotografato. Un
      contatore che scivola nei contenuti diventa un registro
      delle abitudini alimentari, e quello sta altrove e con altri
      permessi.
   3. SI PUÒ SPEGNERE E AZZERARE, e lo dice.

   COSA CI SI FA: dopo qualche settimana la pagina Sistema mostra
   la classifica dei propri gesti. Da lì si decide l'ordine — con i
   dati di chi usa l'app, non con le nostre impressioni.          */

const USO_KEY="nuvia_uso";
const USO_MAX=60;             /* le voci che vale la pena tenere */

function usoLeggi(){
  try{
    const d=JSON.parse(localStorage.getItem(USO_KEY)||"null");
    if(d&&typeof d==="object")return d;
  }catch(e){}
  return {on:true,dal:iso(new Date()),conta:{}};}

function usoScrivi(d){
  try{localStorage.setItem(USO_KEY,JSON.stringify(d));}catch(e){}}

/* Il gesto si registra con un nome scelto da noi, non col testo del
   bottone: se domani il bottone cambia parola, la misura continua. */
window.usoSegna=(gesto)=>{
  const g=String(gesto||"").slice(0,40);
  if(!g)return;
  const d=usoLeggi();
  if(!d.on)return;
  d.conta[g]=(d.conta[g]||0)+1;
  /* si tengono le sessanta voci più toccate: una lista che cresce
     senza limite diventa un peso senza diventare più utile */
  const k=Object.keys(d.conta);
  if(k.length>USO_MAX){
    const tenute=k.sort((a,b)=>d.conta[b]-d.conta[a]).slice(0,USO_MAX);
    const nuovo={};tenute.forEach(x=>nuovo[x]=d.conta[x]);
    d.conta=nuovo;}
  usoScrivi(d);};

window.usoAttivo=()=>usoLeggi().on!==false;
window.usoSpegni=(si)=>{const d=usoLeggi();d.on=!!si;usoScrivi(d);render(cur);};
window.usoAzzera=()=>{usoScrivi({on:usoLeggi().on,dal:iso(new Date()),conta:{}});
  toast(tr("Contatore azzerato."));render(cur);};

/* ── la classifica ───────────────────────────────────────────── */
window.usoClassifica=(quanti)=>{
  const d=usoLeggi();
  const righe=Object.keys(d.conta).map(k=>({gesto:k,n:d.conta[k]}))
    .sort((a,b)=>b.n-a.n);
  return {dal:d.dal,totale:righe.reduce((a,x)=>a+x.n,0),
          righe:righe.slice(0,quanti||15)};};

/* Il nome leggibile del gesto: la classifica deve poterla leggere
   una persona, non solo chi ha scritto il codice. */
function usoNome(g){
  return g==="pasto_spunta"   ?tr("Spuntare un pasto")
       :g==="pasto_foto"      ?tr("Fotografare un piatto")
       :g==="pasto_salta"     ?tr("Saltare un pasto")
       :g==="pasto_alt"       ?tr("Chiedere un'alternativa")
       :g==="acqua"           ?tr("Segnare un bicchiere")
       :g==="bevanda"         ?tr("Scegliere cosa bevi")
       :g==="scala"           ?tr("Votare sonno o umore")
       :g==="barcode"         ?tr("Scansionare un codice")
       :g==="voce"            ?tr("Dettare un pasto")
       :g==="spesa_spunta"    ?tr("Spuntare la spesa")
       :g==="allenamento"     ?tr("Registrare un allenamento")
       :g==="pesata"          ?tr("Registrare una pesata")
       :g==="cucina"          ?tr("Chiedere come si cucina")
       :g==="commensali"      ?tr("Dire per quanti cucini")
       :g==="film"            ?tr("Guardare il film del mese")
       :g==="scheda"          ?tr("Cambiare scheda")
       :g==="respiro"         ?tr("Fare i respiri lenti")
       :g==="preparazione"    ?tr("Salvare una preparazione")
       :g==="ordine"          ?tr("Riordinare la pagina")
       :g==="partner"         ?tr("Aprire una scheda partner")
       :g==="invito"          ?tr("Invitare qualcuno")
       :g==="mia_componi"     ?tr("Comporre la tua pagina")
       :g;}
window.usoNome=usoNome;

/* ── la card in Sistema ──────────────────────────────────────── */
window.usoHTML=()=>{
  const c=usoClassifica(12);
  const on=usoAttivo();
  let h=`<div class="card"><h2>${tr("Quello che usi davvero")}</h2>
    ${hint2(tr("Un conteggio dei tuoi gesti, solo su questo telefono."),
      tr("Serve a noi per capire cosa mettere in cima e cosa spostare in fondo. Conta i gesti, non cosa mangi: sa che hai toccato «foto» dodici volte, non cosa c'era nel piatto. Non parte niente da qui — la telemetria anonima è un'altra cosa e ha il suo consenso."))}
    <label class="ck" style="margin-top:12px"><input type="checkbox" ${on?"checked":""}
      onchange="usoSpegni(this.checked)"> ${esc(tr("Conta i miei gesti"))}</label>`;
  if(on&&c.righe.length){
    h+=`<div class="usolista">${c.righe.map(r=>{
      const q=Math.round(r.n/Math.max(1,c.righe[0].n)*100);
      return `<div class="usoriga">
        <span>${esc(usoNome(r.gesto))}</span>
        <i style="width:${q}%"></i>
        <b>${r.n}</b></div>`;}).join("")}</div>
      <div class="hint">${esc(tr("Dal {d} · {n} gesti in tutto",{d:c.dal,n:c.totale}))}</div>
      <div class="mtools"><button class="btn ghost small" onclick="usoAzzera()">${esc(tr("Azzera il conteggio"))}</button></div>`;
  }else if(on){
    h+=`<div class="hint">${esc(tr("Ancora niente da mostrare: torna fra qualche giorno."))}</div>`;}
  return h+`</div>`;};
