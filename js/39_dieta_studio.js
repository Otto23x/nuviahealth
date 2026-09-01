/* ═══════════════════════════════════════════════════════════════
   39. LA DIETA CHE ARRIVA DALLO STUDIO
   ═══════════════════════════════════════════════════════════════
   Il professionista compone il piano nel pannello e lo pubblica;
   qui arriva col conto (vista.ricetteStudio) e diventa una proposta
   sulla pagina del piano. PROPOSTA, non imposizione: si adotta con
   un tocco, dopo un avviso chiaro che la settimana in corso
   riparte. Tre scelte:

   1. SI VEDE CHI E QUANDO. Un piano senza firma è un ordine; con la
      firma è una cura. Versione, autore e data stanno sulla scheda.
   2. NON SI ADOTTA DA SOLO. Mai sostituire il piano di una persona
      in silenzio: la scheda resta finché non decide — «adotta» o
      «più tardi» (e «più tardi» non insiste: torna alla prossima
      pubblicazione o riaprendo la pagina).
   3. LA STRADA È QUELLA DI SEMPRE. Adottare usa lo stesso identico
      percorso del piano generato (customPlan + settimana nuova):
      niente secondo motore, niente stati speciali da mantenere.  */

/* traduzioni nel dizionario centrale (10_base), come da convenzione */

function ricetteStudioInArrivo(){
  try{
    const v=(S.conto&&S.conto.vista)||{};
    const d=v.ricetteStudio;
    if(!d||!Array.isArray(d.piano)||!d.piano.length)return null;
    if(S.ricetteStudioV&&S.ricetteStudioV>=d.v)return null;  /* già adottata */
    return d;
  }catch(e){return null;}}

function ricetteStudioAdotta(){
  const d=ricetteStudioInArrivo();
  if(!d)return;
  if(!confirm(tr("Confermo questo piano come base settimanale? La settimana in corso (spunte, extra, allenamenti) viene azzerata.")))return;
  /* stessa strada del piano personalizzato: un solo motore */
  S.ricette=d.piano;RICETTE=d.piano;S.permMeals={};S.week=freshWeek();
  S.ricetteStudioV=d.v;
  save();
  try{telemetria("dieta_studio_adottata");}catch(e){}
  try{renderRicette();}catch(e){}}
window.ricetteStudioAdotta=ricetteStudioAdotta;

/* La scheda, in testa alla pagina del piano. */
(function(){
  const _renderProposta=window.renderRicette;
  if(typeof _renderProposta!=="function")return;
  window.renderRicette=function(){
    _renderProposta.apply(this,arguments);
    try{
      const el=document.getElementById("pg-ricette");
      const d=ricetteStudioInArrivo();
      const vecchia=el&&el.querySelector("#dieta-studio-scheda");
      if(vecchia)vecchia.remove();
      if(!el||!d)return;
      const nome=(S.conto&&S.conto.vista&&S.conto.vista.studioNome)||tr("il tuo studio");
      const box=document.createElement("div");
      box.className="card";box.id="dieta-studio-scheda";
      box.innerHTML=
        '<h3>'+tr("C'è un piano nuovo da {nome}",{nome:nome})+'</h3>'+
        '<p class="hint">'+tr("Versione {v} · {autore} · {quando}",
          {v:d.v,autore:d.autore||"",quando:new Date(d.quando).toLocaleDateString()})+
        (d.nota?('<br>'+escHtml(d.nota)):'')+'</p>'+
        '<div class="riga-bottoni">'+
        '<button class="btn" id="dieta-studio-si">'+trBtn("Adotta il piano")+'</button>'+
        '<button class="btn ghost" id="dieta-studio-no">'+trBtn("Più tardi")+'</button></div>';
      el.insertBefore(box,el.firstChild);
      box.querySelector("#dieta-studio-si").addEventListener("click",ricetteStudioAdotta);
      box.querySelector("#dieta-studio-no").addEventListener("click",function(){box.remove();});
    }catch(e){}
  };
})();
