/* ═══════════════════════════════════════════════════════════════
   51. IL FILM DEL MESE
   ═══════════════════════════════════════════════════════════════
   Alla fine del mese quasi tutte le app mostrano un rendiconto:
   quanti chili, quante calorie, quante volte hai fallito. È il
   momento in cui più gente disinstalla, perché un bilancio è un
   giudizio con la faccia dei numeri.

   Qui si racconta una storia. Le stesse settimane, dette come le
   direbbe un amico: «la sera del compleanno l'hai attraversata,
   non subita». Non è marketing: è che una persona ricorda quello
   che ha VISSUTO, non le percentuali.

   LE REGOLE:
   1 · NIENTE NUMERI DEL CORPO. Mai un peso, mai una caloria,
       nemmeno in positivo: «hai perso 3 kg» oggi è una carezza,
       il mese che non succede è uno schiaffo. Si contano i GESTI —
       i giorni tenuti, gli imprevisti riassorbiti — che dipendono
       da te e non dal sale di ieri sera.
   2 · SI PUÒ CONDIVIDERE SENZA ESPORSI. Quello che esce non
       contiene un solo dato sensibile: è una frase e una forma.
   3 · SE IL MESE È STATO POVERO, NON SI INVENTA. Sotto una soglia
       di giorni registrati il film non esiste: meglio niente che
       un racconto costruito sul vuoto.
   4 · SI GUARDA SE SI VUOLE. Nessuna notifica lo impone, nessun
       bollino rosso lo reclama.                                   */

const FILM_MINIMO=8;        /* giorni registrati sotto i quali si tace */

/* ── i giorni del mese, come li vede il telefono ──────────────── */
function filmGiorni(meseIso){
  const m=meseIso||iso(new Date()).slice(0,7);
  let G=[];
  try{G=(typeof fragGiorni==="function")?fragGiorni(120):[];}catch(e){}
  return G.filter(g=>String(g.date||"").slice(0,7)===m);}

/* ── le scene ─────────────────────────────────────────────────── */
/* Ogni scena è: una riga grande, una piccola, e un colore. Nessuna
   scena esiste se non ha qualcosa di vero da dire. */
function filmScene(meseIso){
  const G=filmGiorni(meseIso);
  if(G.length<FILM_MINIMO)return null;

  const tenuti=G.filter(g=>(g.mealsDone||0)>0).length;
  const imprevisti=G.filter(g=>(+g.sgarri||0)>400).length;
  const ripresi=G.filter((g,i)=>{
    const prima=G[i-1];
    return prima&&(+prima.sgarri||0)>400&&(g.mealsDone||0)>0;}).length;
  const mese=new Date((meseIso||iso(new Date()).slice(0,7))+"-15T12:00:00");
  const nomeMese=mese.toLocaleDateString(typeof dataLoc==="function"?dataLoc():"it-IT",
    {month:"long"});

  const S=[];

  /* 1 · l'apertura: il mese ha un nome, non un numero */
  S.push({t:tr("{m}.",{m:nomeMese.charAt(0).toUpperCase()+nomeMese.slice(1)}),
          s:tr("Un mese che hai attraversato."),c:"apre"});

  /* 2 · i giorni tenuti — il gesto, non il risultato.
     Frasi INTERE col numero dentro: un frammento che comincia in
     minuscolo non si traduce, perché in un'altra lingua l'ordine
     delle parole cambia e la frase si spezza in mano. */
  S.push({t:tr("{n} giorni",{n:tenuti}),
          s:tenuti>=G.length*0.8
            ? tr("Giorni in cui ti sei fermato un momento a dirlo.")
            : tr("Giorni in cui ci sei stato. Non è poco."),c:"tiene"});

  /* 3 · la sera difficile: è QUI che vive il senso di Nuvia */
  if(imprevisti>0){
    S.push({t:imprevisti===1?tr("Una sera storta."):tr("{n} sere storte.",{n:imprevisti}),
            s:ripresi>=imprevisti
              ? tr("E il giorno dopo eri ancora qui.")
              : tr("Successe. E il mese è andato avanti lo stesso."),c:"sera"});}

  /* 4 · la ripresa, se c'è stata */
  if(ripresi>0){
    S.push({t:ripresi===1?tr("Una volta")
                         :tr("{n} volte",{n:ripresi}),
            s:tr("Hai ripreso il giorno dopo, senza aspettare lunedì."),c:"riprende"});}

  /* 5 · la chiusura: guarda avanti, mai indietro */
  S.push({t:tr("E adesso?"),
          s:tr("Il mese prossimo è già pronto. Nessun arretrato."),c:"chiude"});

  return {mese:nomeMese,scene:S,
    /* la riga da condividere: niente di sensibile, solo il senso */
    condivisibile:ripresi>0
      ? tr("Questo mese ho ripreso {n} volte il giorno dopo. Con Nuvia.",{n:ripresi})
      : tr("Questo mese sono stato costante {n} giorni. Con Nuvia.",{n:tenuti})};}
window.filmScene=filmScene;

/* ── la proiezione ────────────────────────────────────────────── */
/* A schermo pieno, una scena alla volta, con lo scorrimento che fa
   il ritmo. Non un carosello automatico: si va avanti quando si è
   letto — un racconto che scappa non si ricorda. */
window.filmApri=(meseIso)=>{
  try{usoSegna("film");}catch(e){}
  const F=filmScene(meseIso);
  if(!F)return toast(tr("Il mese è ancora corto: il film arriva più avanti."));

  const vecchio=document.getElementById("film");
  if(vecchio)vecchio.remove();

  const el=document.createElement("div");
  el.id="film";el.className="film";
  el.innerHTML=
    `<button class="film-x" aria-label="${tr("Chiudi")}" onclick="filmChiudi()">${ic("x",22)}</button>`+
    F.scene.map((s,i)=>
      `<section class="film-s film-${s.c}" style="--i:${i}">
         <div class="film-t">${esc(s.t)}</div>
         <div class="film-p">${esc(s.s)}</div>
       </section>`).join("")+
    `<section class="film-s film-fine">
       <div class="film-t">${esc(tr("Grazie di esserci stato."))}</div>
       <div class="film-azioni">
         <button class="btn" onclick="filmCondividi()">${esc(tr("Condividi una riga"))}</button>
         <button class="btn ghost" onclick="filmChiudi()">${esc(tr("Torna all'app"))}</button>
       </div>
     </section>`;
  document.body.appendChild(el);
  document.body.style.overflow="hidden";
  FILM_RIGA=F.condivisibile;

  /* le scene si accendono quando entrano: è lo scorrimento a fare
     il montaggio, non un timer che corre per conto suo */
  try{
    const io=new IntersectionObserver((es)=>{
      es.forEach(e=>{if(e.isIntersecting)e.target.classList.add("on");});
    },{threshold:.5});
    el.querySelectorAll(".film-s").forEach(s=>io.observe(s));
  }catch(e){
    el.querySelectorAll(".film-s").forEach(s=>s.classList.add("on"));}
  requestAnimationFrame(()=>{const p=el.querySelector(".film-s");if(p)p.classList.add("on");});};

let FILM_RIGA="";
window.filmChiudi=()=>{
  const el=document.getElementById("film");
  if(el)el.remove();
  document.body.style.overflow="";};

window.filmCondividi=async()=>{
  if(!FILM_RIGA)return;
  if(typeof condividiTesto==="function")return condividiTesto(tr("Il mio mese"),FILM_RIGA);
  try{await navigator.clipboard.writeText(FILM_RIGA);toast(tr("Copiato: incollalo dove vuoi"));}
  catch(e){}};

/* ── l'invito, discreto ───────────────────────────────────────── */
/* Compare nei primi giorni del mese nuovo, come una riga: chi non la
   tocca non la ritrova addosso il giorno dopo. */
function filmInvito(){
  const oggi=new Date();
  if(oggi.getDate()>6)return "";
  const scorso=new Date(oggi.getFullYear(),oggi.getMonth()-1,15);
  const m=iso(scorso).slice(0,7);
  if(!filmScene(m))return "";
  const nome=scorso.toLocaleDateString(typeof dataLoc==="function"?dataLoc():"it-IT",{month:"long"});
  return `<div class="card film-invito" onclick="filmApri('${m}')">
    <h2>${esc(tr("Il tuo {m}",{m:nome}))}</h2>
    <div class="hint">${esc(tr("Due minuti, e nessun numero da giustificare."))}</div></div>`;}
window.filmInvito=filmInvito;
