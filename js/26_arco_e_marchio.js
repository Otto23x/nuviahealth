/* ═══════════════════════════════════════════════════════════════
   26. ARCO NUVIA, MASCOTTE E STATI VUOTI (Sprint 2)
   ═══════════════════════════════════════════════════════════════
   Tre attrezzi, una regola sola: una domanda per grafico.

   L'ARCO risponde a «quanto mi resta oggi». Mostra CIÒ CHE RESTA,
   non ciò che è stato consumato: il numero che scende verso lo zero
   racconta uno spazio disponibile, non un conto alla rovescia verso
   la colpa. Per lo stesso motivo, oltre il limite non diventa mai
   rosso: vira al corallo, che avverte senza punire.

   Le PILLOLE stanno sotto l'arco e non gli fanno concorrenza: tre
   barrette, non tre anelli che si contendono l'occhio.

   Gli STATI VUOTI non sono pagine rotte: sono inviti. Illustrazione,
   una frase, una cosa sola da fare.                                */

/* ── La mascotte ────────────────────────────────────────────────
   I disegni vivono in src/assets_src e la build ne fa una sprite:
   qui si richiamano soltanto. Decorativa per definizione → sempre
   aria-hidden, mai annunciata da un lettore di schermo. */
/* SEI POSE. `brinda` e `dorme` sono state tolte il 25/08 per lo
   stesso motivo: nessuna pagina le richiamava. `brinda` era anche un
   doppione di `festeggia`. Una posa che non si vede da nessuna parte
   è peso morto che qualcuno dovrà mantenere. */
const MASC_POSE=["saluta","festeggia","pensa","cucina","sport","cerca"];
/* ── PIÙ GRANDI DI UN QUARTO (founder, 27/08) ─────────────────────
   «Puoi fare le mascotte un po' più grandi? Così si vedono meglio e
   sono più distintive.» Le misure sono salite tutte insieme, non una
   per volta: 88→110 negli stati vuoti, 120→150 nelle pause del
   percorso, 96→120 sulla generazione, 72→92 e 56→72 dove sono un
   invito. La proporzione fra loro resta quella di prima — una figura
   che cresce da sola in un posto solo diventa un'altra figura. */
function masc(posa,lato){
  const p=MASC_POSE.includes(posa)?posa:"saluta";
  const l=lato||64;
  /* Il riquadro dichiara la stessa geometria dei disegni (300x300): il
     <use> scala il simbolo dentro la misura chiesta. Tenere due sistemi
     di coordinate diversi funziona lo stesso, ma è la cosa che confonde
     chi apre il file fra sei mesi. */
  return `<svg class="masc" width="${l}" height="${l}" viewBox="0 0 300 300" aria-hidden="true" focusable="false"><use href="#masc-${p}"/></svg>`;}
window.masc=masc;

/* ── Stato vuoto ────────────────────────────────────────────────
   Una pagina senza dati è il momento in cui si decide se l'app
   serve a qualcosa. Quindi: mai un trattino, mai «nessun dato».
   Sempre una figura, una frase in tono, e UNA cosa da fare. */
function vuoto(posa,frase,azione,etichetta){
  return `<div class="vuoto" data-vuoto="1">
    ${masc(posa,110)}
    <p class="vuotot">${esc(tr(frase))}</p>
    ${azione?`<button class="btn ghost small" type="button" onclick="${azione}">${esc(tr(etichetta))}</button>`:""}
  </div>`;}
window.vuoto=vuoto;

/* ── Il catalogo degli stati vuoti ──────────────────────────────
   Tutte le frasi in un posto solo, per due motivi che vanno insieme.
   Il primo è di tono: il brand book chiede che gli stati vuoti
   invitino e non si scusino, e una regola sul tono si fa rispettare
   se le frasi si leggono tutte di seguito, non sparse in sei file.
   Il secondo è tecnico: passate come argomenti, queste frasi non
   sono dentro un tr() letterale e nessuno scanner le vedrebbe —
   finirebbero non tradotte o segnate come orfane. Qui invece sono
   una struttura viva, che il registro delle chiavi dinamiche legge
   da sé: aggiungendo una voce, la traduzione si controlla da sola. */
const VUOTI={
  piano:   ["cucina","Il tuo piano è una pagina bianca. Vuoi che ti prepari la settimana?","wizStart(1)","Prepara la settimana"],
  oggi:    ["cucina","Oggi è una pagina bianca. Vuoi che ti prepari la settimana?","show('piano')","Genera il piano"],
  spesa:   ["cerca","La lista si riempie da sola con gli ingredienti del piano. Appena c'è un piano, qui c'è la spesa.","show('piano')","Vai al piano"],
  sport:   ["sport","Questa settimana è ancora tutta da scrivere. Anche una camminata conta.","portaInVista(document.getElementById('wSport')||document.body)","Segna il primo"],
  schemi:  ["pensa","Gli schemi si vedono col tempo: ancora qualche giorno segnato e qui comincia il tuo racconto.","portaInVista(document.getElementById('pg-comestai')||document.body)","Segna come stai oggi"],
  storico: ["pensa","Le settimane si archiviano da sole alla domenica: fra qualche giorno qui ci sarà il tuo racconto.","show('oggi')","Torna a oggi"],
  obiettiviSport:["sport","Nessun obiettivo per ora. Quanti allenamenti ti va di fare in una settimana?","addGoalWk()","Aggiungi un obiettivo"]
};
window.VUOTI=VUOTI;

/* Le frasi del catalogo, per il registro delle chiavi dinamiche. */
window.vuotiFrasi=function(){
  const out=[];
  Object.keys(VUOTI).forEach(k=>{const v=VUOTI[k];out.push(v[1]);if(v[3])out.push(v[3]);});
  return out;};

/* Si disegna per NOME: la pagina dice quale vuoto le serve, non come
   è fatto. Se una frase va rivista, si rivede qui e cambia ovunque. */
function vuotoDi(nome){
  const v=VUOTI[nome];
  if(!v)return "";
  return vuoto(v[0],v[1],v[2],v[3]);}
window.vuotoDi=vuotoDi;

/* ── L'ARCO ─────────────────────────────────────────────────────
   270 gradi: si apre in basso, dove l'occhio non cerca informazione,
   e lascia spazio al numero grande al centro. Disegnato in SVG con
   stroke-dasharray perché conic-gradient dipende da @property, che
   troppi browser non conoscono (stessa lezione dell'anello di
   caricamento, vedi 01_stili).

   L'animazione dura 400 ms e finisce lì: una barra che pulsa in
   eterno è rumore, non informazione.                              */
const ARCO_R=52, ARCO_GIRO=270;
function arcoLunghezza(){return 2*Math.PI*ARCO_R*(ARCO_GIRO/360);}

/* Il colore dice a che punto sei, senza bisogno di leggere.
   Fino al 90%: teal, tutto in ordine. Da lì al limite: teal chiaro.
   Oltre: corallo — attenzione, non condanna. Il rosso resta per gli
   errori veri dell'app, non per una giornata storta. */
function arcoColore(pct){
  if(pct<=90)return "var(--azione)";
  if(pct<=100)return "var(--salvia)";
  return "var(--zaff)";}
window.arcoColore=arcoColore;

/* usati = quanto è già stato consumato · quota = quanto ne avevi.
   Il centro mostra la differenza, cioè quello che resta. */
function arcoHTML(usati,quota,etichetta){
  const q=Math.max(1,Math.round(quota||0));
  const u=Math.max(0,Math.round(usati||0));
  const pct=Math.round(u/q*100);
  const resta=q-u;
  const L=arcoLunghezza();
  const pieno=Math.min(100,pct)/100*L;
  const col=arcoColore(pct);
  const oltre=resta<0;
  return `<div class="arco" role="img"
      aria-label="${esc(tr("Restano {n} kcal su {q}",{n:resta,q:q}))}"
      data-pct="${pct}" data-resta="${resta}" data-colore="${col}">
    <svg viewBox="0 0 140 140" class="arcosvg">
      <circle class="arcofondo" cx="70" cy="70" r="${ARCO_R}"
        stroke-dasharray="${L.toFixed(1)} 999" />
      <circle class="arcopieno" cx="70" cy="70" r="${ARCO_R}"
        stroke="${col}" stroke-dasharray="${pieno.toFixed(1)} 999"
        style="--arco-pieno:${pieno.toFixed(1)}" />
    </svg>
    <div class="arcoc">
      <div class="arcon" style="${oltre?"color:var(--zafft)":""}">${oltre?"+"+Math.abs(resta):resta}</div>
      <div class="arcol">${oltre?esc(tr("kcal oltre")):esc(tr("kcal che restano"))}</div>
      <div class="arcos">${esc(etichetta||tr("Obiettivo di oggi: {q}",{q:q}))}</div>
    </div>
  </div>`;}
window.arcoHTML=arcoHTML;

/* Le tre pillole: stessa logica dell'arco, forma diversa perché
   rispondono a una domanda secondaria («e i macro?»). */
function pillolaHTML(v,quota,etichetta,unita){
  const q=Math.max(1,Math.round(quota||0));
  const pct=Math.min(140,Math.round((v||0)/q*100));
  const col=arcoColore(pct);
  return `<div class="pill" data-macro="${esc(etichetta)}" data-pct="${pct}">
    <div class="pilltop"><span class="pilll">${esc(tr(etichetta))}</span>
      <span class="pillv">${Math.round(v||0)}<i>/${q}${unita||""}</i></span></div>
    <div class="pillb"><i style="width:${Math.min(100,pct)}%;background:${col}"></i></div>
  </div>`;}
window.pillolaHTML=pillolaHTML;

/* Il blocco intero: arco + tre pillole. È quello che si innesta in
   testa al bilancio della giornata. */
function arcoGiornoHTML(di){
  const eat=eatenOfDay(di),burn=burnedOfDay(di);
  const quota=Math.max(1,Math.round(dayTargetK()+burn));
  return `<div class="arcobox">
    ${arcoHTML(eat.k,quota,burn?tr("Obiettivo di oggi: {q}, sport compreso",{q:quota}):tr("Obiettivo di oggi: {q}",{q:quota}))}
    <div class="pills">
      ${pillolaHTML(eat.p,dayTargetP(),"proteine"," g")}
      ${pillolaHTML(eat.c,dayTargetC(),"carboidrati"," g")}
      ${pillolaHTML(eat.f,dayTargetF(),"grassi"," g")}
    </div>
  </div>`;}
window.arcoGiornoHTML=arcoGiornoHTML;

/* ── La miniatura per lo Storico ────────────────────────────────
   Stessa forma, stessi colori, dodici volte più piccola: chi ha
   capito l'arco di oggi ha già capito i sette giorni. Un secondo
   linguaggio visivo per la stessa informazione sarebbe una tassa
   di apprendimento pagata due volte. */
function arcoMiniHTML(usati,quota,titolo){
  const q=Math.max(1,Math.round(quota||0));
  const pct=Math.round((usati||0)/q*100);
  const L=2*Math.PI*13*(ARCO_GIRO/360);
  const pieno=Math.min(100,pct)/100*L;
  return `<span class="arcomini" title="${esc(titolo||"")}" data-pct="${pct}" aria-hidden="true">
    <svg viewBox="0 0 36 36"><circle class="arcofondo" cx="18" cy="18" r="13" stroke-dasharray="${L.toFixed(1)} 999"/>
    <circle class="arcopieno" cx="18" cy="18" r="13" stroke="${arcoColore(pct)}" stroke-dasharray="${pieno.toFixed(1)} 999"/></svg>
  </span>`;}
window.arcoMiniHTML=arcoMiniHTML;


/* ═══ IL FESTONE ═══════════════════════════════════════════════
   Un pasto spuntato è la cosa più frequente che si fa qui dentro,
   e finora non succedeva niente. Adesso cadono sei coriandoli per
   novecento millisecondi.

   LE REGOLE, che sono più importanti dell'effetto:
   · DURATA: 900 ms e via. Una festa più lunga diventa un ostacolo
     fra te e la cosa dopo.
   · FREQUENZA: solo alla spunta di un pasto, non a ogni tocco.
     Se si festeggia tutto non si festeggia niente.
   · SILENZIO: niente suoni, niente vibrazione. La gente segna i
     pasti in ufficio e in mensa.
   · RISPETTO: chi ha chiesto meno movimento non vede nulla — e
     non perde niente, perché il pasto è spuntato lo stesso.     */
const FESTONE_COLORI=["#00AFA3","#FF7F50","#7FD4CC","#FFB37A","#0C7C74","#E4632F"];
window.festone=(x,y)=>{
  try{
    if(!matchMedia("(prefers-reduced-motion: no-preference)").matches)return;
  }catch(e){return;}
  const box=document.createElement("div");
  box.className="festone";
  const cx=(x==null?innerWidth/2:x), cy=(y==null?innerHeight*0.35:y);
  for(let i=0;i<6;i++){
    const p=document.createElement("i");
    p.style.background=FESTONE_COLORI[i%FESTONE_COLORI.length];
    p.style.left=cx+"px";p.style.top=cy+"px";
    p.style.setProperty("--dx",(Math.random()*140-70).toFixed(0)+"px");
    p.style.setProperty("--rot",(Math.random()*540-270).toFixed(0)+"deg");
    p.style.animationDelay=(i*40)+"ms";
    box.appendChild(p);}
  document.body.appendChild(box);
  setTimeout(()=>box.remove(),1300);};
