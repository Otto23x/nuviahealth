/* ═══════════════════════════════════════════════════════════════
   35. QUELLO CHE DECIDE LO STUDIO (Sprint 11)
   ═══════════════════════════════════════════════════════════════
   Chi è seguito da un professionista non sceglie da solo l'obiettivo,
   il fabbisogno e le formule: li stabilisce chi lo ha visitato. Qui
   quei campi diventano di sola lettura.

   Tre regole, e la terza è quella che rende questa cosa uno strumento
   invece che una gabbia.

   1. SI BLOCCA IL PARAMETRO, NON LA PERSONA. Il peso di OGGI resta
      sempre modificabile: è un fatto che la persona registra, non una
      decisione che le viene imposta. Se non potesse segnarlo, l'app
      smetterebbe di funzionare proprio per chi è seguito di più.

   2. SI VEDE CHI HA DECISO, E QUANDO. Ogni campo bloccato porta il
      nome accanto. Un numero imposto senza un nome è il modo più
      rapido di far sentire una persona amministrata invece che seguita
      — e la prima cosa che le fa chiudere l'app.

   3. LA PORTA RESTA APERTA. Si può sempre uscire dallo studio, da qui,
      in due tocchi. Uscendo i blocchi cadono e i dati restano suoi.

   E una quarta, che riguarda noi: il blocco vive nell'interfaccia, ma
   NON è una garanzia di sicurezza. Chi vuole aggirarlo apre gli
   strumenti del browser e scrive quello che vuole. Il numero che conta
   per lo studio è quello che il paziente CONDIVIDE, e quello arriva
   dal server. Qui si aiuta una persona a non sbagliare, non si
   impedisce a nessuno di barare — e confondere le due cose è il modo
   in cui si costruiscono finte sicurezze.                            */

/* Quello che lo studio ha fissato, se c'è. Sempre dal conto: non si
   tiene una seconda copia che possa divergere. */
function prescrizione(){
  try{
    const v=conto().vista;
    return (v&&v.prescrizione)||null;
  }catch(e){return null;}}
window.prescrizione=prescrizione;

function bloccato(campo){
  const p=prescrizione();
  if(!p)return false;
  const b=p.bloccati||[];
  return b.indexOf(campo)>=0;}
window.bloccato=bloccato;

/* Il valore imposto, se c'è. Chi disegna un campo chiede questo
   invece di leggere il profilo: così il numero mostrato e quello
   applicato sono lo stesso, sempre. */
function valoreImposto(campo){
  const p=prescrizione();
  if(!p||!bloccato(campo))return null;
  return p[campo];}
window.valoreImposto=valoreImposto;

function chiHaDeciso(){
  const p=prescrizione();
  if(!p)return "";
  const v=conto().vista||{};
  return p.da||v.studioNome||tr("il tuo studio");}
window.chiHaDeciso=chiHaDeciso;

/* La riga che accompagna un campo bloccato. Corta, e senza scuse:
   non c'è niente di cui scusarsi, è il motivo per cui la persona si è
   rivolta a un professionista. */
function notaBlocco(){
  return tr("Impostato da {chi}.",{chi:chiHaDeciso()});}
window.notaBlocco=notaBlocco;

/* ── L'applicazione ─────────────────────────────────────────────
   I valori dello studio vincono sul profilo locale. Si applicano a
   ogni avvio e a ogni aggiornamento del conto: se il professionista
   cambia l'obiettivo durante la visita, il telefono lo recepisce al
   primo collegamento senza che nessuno debba fare niente. */
function prescrizioneApplica(){
  const p=prescrizione();
  if(!p)return false;
  let cambiato=false;
  const metti=(dove,chiave,val)=>{
    if(val===undefined||val===null)return;
    if(dove[chiave]!==val){dove[chiave]=val;cambiato=true;}};

  /* Anche lo studio passa dal portone, dichiarandosi: salta il blocco
     (l'ha messo lui) e il guardrail della persona, ma non la
     validazione. Un solo punto di scrittura vuol dire anche questo. */
  if(p.obiettivoPeso!=null&&p.obiettivoPeso!==""){
    const prima=S.profile.goalW;
    try{setGoalWeight(p.obiettivoPeso,{da:"studio"});}catch(e){}
    if(S.profile.goalW!==prima)cambiato=true;}
  metti(S.profile,"h",p.altezza);
  metti(S.profile,"act",p.attivita);
  if(p.kcal){S.pref=S.pref||{};metti(S.pref,"kcalImposte",p.kcal);}
  if(p.proteine||p.carboidrati||p.grassi){
    S.pref=S.pref||{};
    S.pref.macroImposte=S.pref.macroImposte||{};
    metti(S.pref.macroImposte,"p",p.proteine);
    metti(S.pref.macroImposte,"c",p.carboidrati);
    metti(S.pref.macroImposte,"g",p.grassi);}
  if(cambiato)save();
  return cambiato;}
window.prescrizioneApplica=prescrizioneApplica;

/* ── La scheda ──────────────────────────────────────────────────
   Un posto solo in cui la persona vede tutto quello che è stato
   deciso per lei. Che è anche il posto da cui può andarsene. */
function prescrizioneHTML(){
  const p=prescrizione();
  if(!p)return "";
  const b=p.bloccati||[];
  if(!b.length&&!p.note)return "";

  const eti={
    obiettivoPeso:tr("Obiettivo di peso"),
    altezza:tr("Altezza"),
    kcal:tr("Calorie al giorno"),
    proteine:tr("Proteine"),
    carboidrati:tr("Carboidrati"),
    grassi:tr("Grassi"),
    attivita:tr("Livello di attività"),
    pianoDaStudio:tr("Il piano lo prepara lo studio"),
    formula:tr("Formula del fabbisogno")};
  const unita={obiettivoPeso:"kg",altezza:"cm",kcal:"kcal",
    proteine:"g",carboidrati:"g",grassi:"g"};

  const righe=b.map(k=>{
    const v=p[k];
    const testo=(k==="pianoDaStudio")?(v?tr("sì"):tr("no"))
      :(v+(unita[k]?" "+unita[k]:""));
    /* Se il valore è fuori dall'intervallo consueto, il motivo si vede.
       Chi ha un numero addosso ha diritto di sapere perché ci è stato
       messo — e se leggendolo non lo riconosce, è il momento di
       chiedere allo studio, non di scoprirlo fra tre mesi. */
    const f=(p.forzati||{})[k];
    return `<div class="lg" data-imposto="${esc(k)}">${esc(eti[k]||k)}: <b>${esc(testo)}</b>${
      f?`<div class="hint" style="margin-top:8px" data-motivo="${esc(k)}">${
        esc(tr("Fuori dai valori consueti. Motivo indicato: {m}",{m:f.motivo}))}</div>`:""}</div>`;}).join("");

  return `<div class="card" data-prescrizione="1">
    <h2>${esc(tr("Quello che ha stabilito il tuo studio"))}</h2>
    <div class="hint">${esc(notaBlocco())}${p.aggiornato
      ? " "+esc(tr("Ultimo aggiornamento: {d}",{d:new Date(p.aggiornato).toLocaleDateString()})) : ""}</div>
    ${righe?`<div class="lgrid" style="margin-top:16px">${righe}</div>`:""}
    ${p.note?`<div class="hint" style="margin-top:16px">${esc(p.note)}</div>`:""}
    <div class="hint" style="margin-top:16px">${esc(tr("Il peso che segni ogni giorno resta tuo: quello lo registri tu."))}</div>
    <div class="mtools">
      <button class="btn ghost small" type="button" onclick="lasciaStudio()">${esc(tr("Non sono più seguito da questo studio"))}</button>
    </div>
  </div>`;}
window.prescrizioneHTML=prescrizioneHTML;

/* La via d'uscita. Si chiede conferma una volta, si spiega cosa
   succede, e non si insiste: una via d'uscita che discute non è una
   via d'uscita. */
window.lasciaStudio=async()=>{
  const ok=await dlgConfirm(
    tr("Vuoi smettere di essere seguito da {chi}?",{chi:chiHaDeciso()}),
    tr("I tuoi dati restano tutti qui. Lo studio non vedrà più niente e i valori tornano modificabili da te."));
  if(!ok)return;
  try{
    await contoChiama("/consenso",{metodo:"POST",
      corpo:{peso:false,aderenza:false,sport:false,dettaglio:false}});
    await contoChiama("/licenza/lascia",{metodo:"POST"});
  }catch(e){}
  try{await contoAggiorna();}catch(e){}
  try{toast(tr("Fatto. Da qui in poi decidi tu."));render(cur);}catch(e){}};

/* ═══ LE MISURE ARRIVATE DALLO STUDIO (v15.13.0) ═══════════════════
   Deciso col founder (30/08): il peso sulla bilancia dello studio, le
   pliche, l'altezza sono FATTI misurati dal professionista — li
   inserisce lui dal pannello, e qui entrano nell'evoluzione della
   persona. Tre regole:

   1. STESSO SCRITTORE DI TUTTI. La visita passa da `misureRegistra`
      (la porta unica delle misure) e il peso si fonde nella serie
      delle pesate con la stessa regola del giorno di `saveWeighIn`.
      Un secondo magazzino per le misure «di studio» divergerebbe dal
      primo — è la lezione dei due elenchi della ruota.
   2. UNA VOLTA SOLA. Ogni misura ha un id e gli id già fusi stanno in
      S.studio.misureViste: il conto si riaggiorna dieci volte al
      giorno, la misura entra una volta.
   3. IL DIARIO NON SI TOCCA. Questa funzione scrive visite, pesate e
      altezza — MAI S.week, mai un pasto, mai un extra. «Il
      professionista può modificare i consigli di alimentazione, non
      quello che si è mangiato realmente» (founder). Il collaudo lo
      inchioda: sabotare questa regola deve essere rosso. */
window.misureStudioApplica=()=>{
  let nuove=0;
  try{
    const v=(S.conto&&S.conto.vista)||{};
    const arr=Array.isArray(v.misure)?v.misure:[];
    if(!arr.length)return 0;
    S.studio=S.studio||{visite:[],pro:""};
    const viste=S.studio.misureViste=Array.isArray(S.studio.misureViste)?S.studio.misureViste:[];
    arr.forEach(m=>{
      if(!m||!m.id||viste.includes(m.id))return;
      /* la visita: stessa porta di chi misura in casa, con la firma */
      const rec={d:m.d,fat:m.fat,mus:m.mus,acqua:m.acqua,ossa:m.ossa,
        bmr:m.bmr,pa:m.pa,note:m.note,da:m.da,fonte:"studio",
        pliche:Object.assign({},m.pliche||{}),circ:{}};
      if(m.vita!=null)rec.circ.vita=m.vita;
      if(m.fianchi!=null)rec.circ.fianchi=m.fianchi;
      try{if(typeof misureRegistra==="function")misureRegistra(rec);}catch(e){}
      /* il peso: nella serie delle pesate, fuso per giorno — la
         bilancia dello studio non cancella quella di casa, la
         completa (campo per campo, come fa saveWeighIn) */
      if(m.w!=null){
        try{
          const W=S.profile.weights=S.profile.weights||[];
          const i=W.findIndex(x=>x&&x.d===m.d);
          const voce={d:m.d,w:m.w,fonte:"studio",da:m.da};
          if(m.fat!=null)voce.fat=m.fat;
          if(i>=0)W[i]=Object.assign({},W[i],voce);
          else W.push(voce);
          W.sort((a,b)=>a.d<b.d?-1:1);
        }catch(e){}}
      /* l'altezza: misurata allo stadiometro vale più del ricordo */
      if(m.h!=null)S.profile.h=m.h;
      viste.push(m.id);
      nuove++;});
    if(viste.length>400)viste.splice(0,viste.length-400);
    if(nuove){
      save();
      try{toast(nuove===1
        ? tr("È arrivata una misura dal tuo studio: la trovi nell'andamento.")
        : trh("Sono arrivate {v1} misure dal tuo studio: le trovi nell'andamento.",{v1:nuove}));}catch(e){}
    }
  }catch(e){}
  return nuove;};
