/* ═══════════════════════════════════════════════════════════════
   63b. L'INVITO AI PROGRESSI
   ═══════════════════════════════════════════════════════════════
   Deciso dal founder il 22/08: la vecchia pagina «Io» esisteva
   soprattutto per portare la gente a pesarsi ogni tanto. La pagina
   non c'è più (è diventata «Utente», due schede), ma l'idea era
   giusta e vive qui: ogni DUE settimane — cadenza che la persona
   può cambiare, o spegnere — una card sul Punto propone i
   Progressi. Un invito, mai un dirottamento.

   LE REGOLE (dai PILASTRI sui richiami):
   - un solo invito alla volta, mai due giorni di fila;
   - sparisce da solo appena ti pesi;
   - «Non ora» lo rimanda di una settimana intera, non di un giorno;
   - la cadenza si cambia LÌ, senza andare nelle impostazioni. */

function progScelte(){return {s2:tr("ogni 2 settimane"),s4:tr("ogni 4 settimane"),
                              s8:tr("ogni 8 settimane"),mai:tr("mai")};}

function progressiInvitoHTML(){
  try{
    const ui=S.ui=S.ui||{};
    const cad=ui.progCad||"s2";
    if(cad==="mai")return "";
    const sett={s2:2,s4:4,s8:8}[cad]||2;
    const pesi=(S.profile&&S.profile.weights)||[];
    const ultima=pesi.length?Date.parse(pesi[pesi.length-1].d):0;
    const giorni=(Date.now()-ultima)/864e5;
    if(ultima&&giorni<sett*7)return "";
    if(ui.progRinvio&&Date.now()<ui.progRinvio)return "";
    /* mai due giorni di fila: se ieri l'ho mostrata e non hai voluto,
       oggi taccio */
    if(ui.progVista&&(Date.now()-ui.progVista)<2*864e5&&ui.progVista!==oggiTs())return "";
    /* si marca (e salva) UNA volta al giorno, non a ogni ridisegno:
       un save() dentro il render sporcherebbe l'ANNULLA a ogni
       passaggio sul Punto — trovato dal collaudo t_undo, non a occhio */
    if(ui.progVista!==oggiTs()){ui.progVista=oggiTs();try{save();}catch(e){}}
    const testo=ultima
      ?tr("Sono passate più di {v1} settimane dall'ultima pesata. Bastano dieci secondi, e i grafici tornano a dire qualcosa.",{v1:sett})
      :tr("Non c'è ancora nessuna pesata: la prima fa nascere i grafici e le proiezioni.");
    return `<div class="card prginv">${masc("cerca",72)}
      <div class="prgtx">${esc(testo)}</div>
      <div class="mtools">
        <button class="btn small" onclick="schedaVai('storico','peso')">${esc(tr("Vai ai Progressi"))}</button>
        <button class="btn ghost small" onclick="progRinvia()">${esc(tr("Non ora"))}</button>
        <button class="btn ghost small" onclick="progCadCambia()">${esc(progScelte()[S.ui.progCad||"s2"])}</button>
      </div></div>`;
  }catch(e){return "";}}

function oggiTs(){const d=new Date();d.setHours(0,0,0,0);return d.getTime();}

window.progRinvia=()=>{S.ui.progRinvio=Date.now()+7*864e5;save();
  try{render(cur);}catch(e){}};

window.progCadCambia=()=>{
  const ordine=["s2","s4","s8","mai"];
  const cur0=S.ui.progCad||"s2";
  S.ui.progCad=ordine[(ordine.indexOf(cur0)+1)%ordine.length];
  save();
  toast(tr("Progressi: {v1}",{v1:progScelte()[S.ui.progCad]}));
  try{render(cur);}catch(e){}};
