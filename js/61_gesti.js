/* ═══════════════════════════════════════════════════════════════
   61. I GESTI CHE AIUTANO
   ═══════════════════════════════════════════════════════════════
   Piccole cose che si possono fare col corpo, quando la testa è
   in tumulto o la fame arriva prima del pasto. Nessuna è una cura,
   nessuna sostituisce il mangiare, nessuna è obbligatoria.

   ── LA CAUTELA CHE VIENE PRIMA DI TUTTO ────────────────────────
   «Bevi un bicchiere d'acqua quando hai fame» è un consiglio che
   può scivolare in un posto brutto: diventare un modo per non
   mangiare. Se una persona ha fame VERA, la risposta è il cibo —
   e questa app non deve mai suggerire il contrario.
   Quindi qui l'acqua compare in due situazioni sole:
     · PRIMA di un pasto che sta arrivando (dove l'evidenza c'è, e
       il pasto si fa comunque);
     · quando il diario dice che si è bevuto poco.
   MAI come risposta a «ho fame» e mai al posto di un pasto. Chi ha
   fame e ha saltato dei pasti riceve il consiglio opposto: mangia.
   Il collaudo verifica proprio questo.

   ── LE EVIDENZE, DETTE PER QUELLO CHE VALGONO ──────────────────
   Ogni gesto porta scritto quanto è solida la ricerca che lo
   sostiene: `forte`, `discreta`, `iniziale`. Non è pignoleria —
   è che un'app che presenta tutto come dimostrato perde la
   fiducia il giorno in cui uno va a controllare. E qualcuno
   controlla sempre.                                              */

const GESTI=[
  {k:"respiro", forte:"discreta",
   nome:"Tre respiri lenti",
   quando:["stress","fragile","voglia"],
   riga:"Quattro secondi dentro, sei fuori. Tre volte.",
   perche:"Allungare l'espirazione più dell'inspirazione sposta l'equilibrio verso il sistema che calma: si misura sulla variabilità del battito, e l'effetto si vede in un minuto o due.",
   nota:"Studi su respirazione lenta e stress percepito: effetto modesto ma ripetuto in più lavori. Non è una terapia."},

  {k:"acquaprima", forte:"discreta",
   nome:"Un bicchiere prima di mangiare",
   quando:["prepasto"],
   riga:"Mezz'ora prima del pasto, non al posto del pasto.",
   perche:"Bere circa mezzo litro prima di mangiare tende a far arrivare la sazietà un po' prima. Il pasto si fa comunque: questo aiuta a sentirlo, non a saltarlo.",
   nota:"Sperimentato in adulti di mezza età e anziani, con effetti piccoli. Negli studi su persone giovani l'effetto è meno chiaro."},

  {k:"mastica", forte:"discreta",
   nome:"Masticare fino a sentire il gusto",
   quando:["pasto","voglia"],
   riga:"Prova a posare la forchetta fra un boccone e l'altro.",
   perche:"La sazietà arriva al cervello con qualche minuto di ritardo: mangiare in venti minuti invece che in otto le dà il tempo di farsi sentire prima che il piatto sia finito.",
   nota:"Più studi mostrano meno calorie a parità di piatto quando si mangia più lentamente. Le differenze fra studi sono ampie."},

  {k:"pausa", forte:"iniziale",
   nome:"Aspetta dieci minuti",
   quando:["voglia"],
   riga:"Non «non mangiare»: solo dieci minuti, e poi decidi tu.",
   perche:"Una voglia improvvisa sale e scende come un'onda. Dieci minuti spesso bastano perché passi da sola — e se non passa, vuol dire che era fame, e allora si mangia.",
   nota:"L'idea dell'onda è ben descritta in psicologia; su quanto duri esattamente i numeri sono pochi."},

  {k:"tavola", forte:"iniziale",
   nome:"Solo il piatto, niente schermo",
   quando:["pasto"],
   riga:"Mangiare guardando qualcosa fa mangiare di più senza accorgersene.",
   perche:"L'attenzione altrove rende difficile ricordare quanto si è mangiato, e la memoria del pasto precedente influenza quanto si mangia al successivo.",
   nota:"Osservato in più esperimenti; le dimensioni dell'effetto variano molto."},

  {k:"proteina", forte:"forte",
   nome:"Comincia dalla parte proteica",
   quando:["pasto","prepasto"],
   riga:"Uova, pesce, carne, legumi: prima quello.",
   perche:"A parità di calorie, le proteine saziano più di carboidrati e grassi. È una delle cose più solide che si sappiano sulla sazietà.",
   nota:"Ampiamente replicato in studi controllati."},

  {k:"fibra", forte:"forte",
   nome:"Verdura per prima",
   quando:["pasto"],
   riga:"Riempie e rallenta, e il resto arriva dopo.",
   perche:"Volume e fibra allungano i tempi dello stomaco e smorzano il picco di zucchero nel sangue dopo il pasto.",
   nota:"Solido su glicemia; sulla quantità mangiata gli effetti sono più variabili."},

  {k:"sonno", forte:"forte",
   nome:"Dormi mezz'ora in più",
   quando:["stress","fragile"],
   riga:"Non è pigrizia: il sonno corto fa venire più fame il giorno dopo.",
   perche:"Dormire poco sposta gli ormoni dell'appetito verso la fame e rende più attraenti i cibi molto calorici.",
   nota:"Uno dei legami più solidi in questo campo."}
];
window.GESTI=GESTI;

/* I testi passano da tr() ESPLICITI: la regola di casa. */
function gestoTesto(k,campo){
  const g=GESTI.find(x=>x.k===k);
  if(!g)return "";
  if(campo==="nome")
    return k==="respiro"?tr("Tre respiri lenti")
         :k==="acquaprima"?tr("Un bicchiere prima di mangiare")
         :k==="mastica"?tr("Masticare fino a sentire il gusto")
         :k==="pausa"?tr("Aspetta dieci minuti")
         :k==="tavola"?tr("Solo il piatto, niente schermo")
         :k==="proteina"?tr("Comincia dalla parte proteica")
         :k==="fibra"?tr("Verdura per prima")
         :tr("Dormi mezz'ora in più");
  if(campo==="riga")
    return k==="respiro"?tr("Quattro secondi dentro, sei fuori. Tre volte.")
         :k==="acquaprima"?tr("Mezz'ora prima del pasto, non al posto del pasto.")
         :k==="mastica"?tr("Prova a posare la forchetta fra un boccone e l'altro.")
         :k==="pausa"?tr("Non «non mangiare»: solo dieci minuti, e poi decidi tu.")
         :k==="tavola"?tr("Mangiare guardando qualcosa fa mangiare di più senza accorgersene.")
         :k==="proteina"?tr("Uova, pesce, carne, legumi: prima quello.")
         :k==="fibra"?tr("Riempie e rallenta, e il resto arriva dopo.")
         :tr("Non è pigrizia: il sonno corto fa venire più fame il giorno dopo.");
  if(campo==="perche")
    return k==="respiro"?tr("Allungare l'espirazione più dell'inspirazione sposta l'equilibrio verso il sistema che calma: si misura sulla variabilità del battito, e l'effetto si vede in un minuto o due.")
         :k==="acquaprima"?tr("Bere circa mezzo litro prima di mangiare tende a far arrivare la sazietà un po' prima. Il pasto si fa comunque: questo aiuta a sentirlo, non a saltarlo.")
         :k==="mastica"?tr("La sazietà arriva al cervello con qualche minuto di ritardo: mangiare in venti minuti invece che in otto le dà il tempo di farsi sentire prima che il piatto sia finito.")
         :k==="pausa"?tr("Una voglia improvvisa sale e scende come un'onda. Dieci minuti spesso bastano perché passi da sola — e se non passa, vuol dire che era fame, e allora si mangia.")
         :k==="tavola"?tr("L'attenzione altrove rende difficile ricordare quanto si è mangiato, e la memoria del pasto precedente influenza quanto si mangia al successivo.")
         :k==="proteina"?tr("A parità di calorie, le proteine saziano più di carboidrati e grassi. È una delle cose più solide che si sappiano sulla sazietà.")
         :k==="fibra"?tr("Volume e fibra allungano i tempi dello stomaco e smorzano il picco di zucchero nel sangue dopo il pasto.")
         :tr("Dormire poco sposta gli ormoni dell'appetito verso la fame e rende più attraenti i cibi molto calorici.");
  if(campo==="nota")
    return k==="respiro"?tr("Studi su respirazione lenta e stress percepito: effetto modesto ma ripetuto in più lavori. Non è una terapia.")
         :k==="acquaprima"?tr("Sperimentato in adulti di mezza età e anziani, con effetti piccoli. Negli studi su persone giovani l'effetto è meno chiaro.")
         :k==="mastica"?tr("Più studi mostrano meno calorie a parità di piatto quando si mangia più lentamente. Le differenze fra studi sono ampie.")
         :k==="pausa"?tr("L'idea dell'onda è ben descritta in psicologia; su quanto duri esattamente i numeri sono pochi.")
         :k==="tavola"?tr("Osservato in più esperimenti; le dimensioni dell'effetto variano molto.")
         :k==="proteina"?tr("Ampiamente replicato in studi controllati.")
         :k==="fibra"?tr("Solido su glicemia; sulla quantità mangiata gli effetti sono più variabili.")
         :tr("Uno dei legami più solidi in questo campo.");
  if(campo==="forza")
    return g.forte==="forte"?tr("ricerca solida")
         :g.forte==="discreta"?tr("ricerca discreta")
         :tr("ricerca iniziale");
  return "";}
window.gestoTesto=gestoTesto;

/* ── quando proporre cosa ─────────────────────────────────────── */
/* IL CANCELLO SULL'ACQUA: se la persona ha saltato dei pasti oggi,
   il suggerimento dell'acqua non parte MAI. Chi ha fame perché non
   ha mangiato ha bisogno di mangiare, e un'app che gli offre un
   bicchiere sta facendo un danno. */
function acquaSiPuo(di){
  try{
    const d=S.week.days[di!=null?di:viewIdx()]||{};
    const saltati=+d.sk||0;
    if(saltati>0)return false;
    const fatti=(d.meals||[]).filter(m=>m&&m.done).length;
    const previsti=(d.meals||[]).length;
    /* mezza giornata passata e meno di un terzo dei pasti fatti:
       non è il momento di parlare d'acqua */
    const ora=new Date().getHours();
    if(ora>=15&&previsti&&fatti/previsti<0.34)return false;
  }catch(e){}
  return true;}
window.acquaSiPuo=acquaSiPuo;

window.gestiPer=(situazione,quanti)=>{
  const s=String(situazione||"");
  let l=GESTI.filter(g=>g.quando.indexOf(s)>=0);
  /* l'acqua esce di scena quando non è il momento */
  if(!acquaSiPuo())l=l.filter(g=>g.k!=="acquaprima");
  /* i più solidi per primi: se se ne legge uno solo, che sia quello
     con la ricerca migliore alle spalle */
  const peso={forte:0,discreta:1,iniziale:2};
  l.sort((a,b)=>peso[a.forte]-peso[b.forte]);
  return l.slice(0,quanti||2);};

/* ── la scheda ────────────────────────────────────────────────── */
window.gestoHTML=(k)=>{
  const g=GESTI.find(x=>x.k===k);
  if(!g)return "";
  return `<div class="gesto">
    <div class="gnome">${esc(gestoTesto(k,"nome"))}</div>
    <div class="griga">${esc(gestoTesto(k,"riga"))}</div>
    ${hint2(esc(gestoTesto(k,"perche")),esc(gestoTesto(k,"nota"))+" · "+esc(gestoTesto(k,"forza")))}
    ${k==="respiro"?`<div class="mtools"><button class="chipbtn" onclick="respiroApri()">${esc(tr("Facciamoli insieme"))}</button></div>`:""}
  </div>`;};

window.gestiBlocco=(situazione,titolo)=>{
  /* QUANTO TEMPO È PASSATO cambia la risposta giusta. Dopo quattro
     ore senza mangiare non si propone di aspettare dieci minuti: si
     dice di mangiare. Un'app che offre un esercizio di respirazione
     a chi ha fame da mezza giornata non ha capito la domanda. */
  let f={tipo:"ignoto"};
  try{if(typeof tipoFame==="function")f=tipoFame();}catch(e){}
  let l=gestiPer(situazione);
  if(f.tipo==="stomaco"){
    /* niente gesti che rimandano: la fame vera si rispetta */
    l=l.filter(g=>g.k!=="pausa"&&g.k!=="acquaprima");}
  const riga=(typeof fameRiga==="function")?fameRiga():"";
  if(!l.length&&!riga)return "";
  return `<div class="card"><h2>${esc(titolo||tr("Una cosa che puoi fare adesso"))}</h2>
    ${riga?`<div class="hint">${esc(riga)}</div>`:""}
    ${l.map(g=>gestoHTML(g.k)).join("")}</div>`;};

/* ── IL RESPIRO GUIDATO ───────────────────────────────────────── */
/* Un cerchio che si allarga e si stringe. Quattro secondi dentro,
   sei fuori, per tre volte: trenta secondi in tutto. Poi finisce da
   solo — un esercizio che non finisce mai diventa un altro compito. */
window.respiroApri=()=>{
  const vecchio=document.getElementById("respiro");
  if(vecchio)vecchio.remove();
  const el=document.createElement("div");
  el.id="respiro";el.className="respiro";
  el.innerHTML=`
    <button class="respiro-x" aria-label="${tr("Chiudi")}" onclick="respiroChiudi()">${ic("x",22)}</button>
    <div class="rcerchio" id="rcerchio"></div>
    <div class="rtesto" id="rtesto" role="status">${esc(tr("Comincia quando vuoi."))}</div>`;
  document.body.appendChild(el);
  document.body.style.overflow="hidden";
  respiroCiclo(0);
  try{usoSegna("respiro");}catch(e){}};

function respiroCiclo(n){
  const c=document.getElementById("rcerchio"), t=document.getElementById("rtesto");
  if(!c||!t)return;
  if(n>=3){
    t.textContent=tr("Fatto. Come va adesso?");
    c.className="rcerchio";
    setTimeout(()=>{const e=document.getElementById("respiro");
      if(e)e.classList.add("finito");},600);
    return;}
  t.textContent=tr("Dentro… quattro");
  c.className="rcerchio dentro";
  setTimeout(()=>{
    if(!document.getElementById("rcerchio"))return;
    t.textContent=tr("…e fuori, sei");
    c.className="rcerchio fuori";
    setTimeout(()=>respiroCiclo(n+1),6000);
  },4000);}

window.respiroChiudi=()=>{
  const el=document.getElementById("respiro");
  if(el)el.remove();
  document.body.style.overflow="";};
