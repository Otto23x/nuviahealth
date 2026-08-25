/* ═══════════════════════════════════════════════════════════════
   13. PAGINA SPORT
   ═══════════════════════════════════════════════════════════════ */
/* ═══ SORGENTI ATTIVITÀ (Sprint 0 del piano definitivo) ═════════════
   Un solo punto da cui si LEGGONO passi e allenamenti. Oggi esiste la
   sorgente "manuale" (quello che l'utente registra a mano); quando
   l'app diventerà nativa si registrerà qui una sorgente "health"
   (Health Connect / HealthKit) e le pagine non cambieranno di una riga.
   Le SCRITTURE restano dove sono: una sorgente esterna sarà in sola
   lettura, e sarà lei a decidere come convivere con l'inserimento a mano. */
const SorgentiAttivita={
  _reg:{},
  registra(nome,src){this._reg[nome]=src;},
  attiva(){const scelta=(S.ui&&S.ui.sorgenteAttivita)||"manuale";return this._reg[scelta]||this._reg.manuale;},
  passiDelGiorno(di){return this.attiva().passi(di);},
  allenamentiDelGiorno(di){return this.attiva().allenamenti(di);}
};
SorgentiAttivita.registra("manuale",{
  passi:di=>+(((S.week.days[di]||{}).steps))||0,
  allenamenti:di=>((S.week.days[di]||{}).workouts)||[]
});
window.SorgentiAttivita=SorgentiAttivita;

function renderSport(){const el=document.getElementById("pg-sport");const di=Math.max(0,viewIdx());const ti=viewIdx();
  let h="";
  /* Il trainer apre la pagina: era in mezzo, dopo l'obiettivo, e chi
     entrava «per vedere il trainer» non lo trovava. La cosa che
     costruisce la settimana viene PRIMA della settimana stessa. */
  /* Prima quello che fa già, poi eventualmente un pensiero, e solo dopo
     gli attrezzi: l'ordine dice che l'app parte da lei, non da sé. */
  h+=abitualiHTML();
  h+=spuntoHTML();
  h+=trainerCardHTML();
  /* Poi A CHE PUNTO SEI (l'obiettivo), quello che fai adesso
     (registra, passi), infine il riepilogo. */
  {const g=goalWkTotal(),f=workoutsThisWeek();
   if(g>0){const pc=Math.min(100,Math.round(f/g*100));
  h+=`<div class="gsec">${tr("A che punto sei")}</div>`;
  h+=`<div class="card"><h2>${tr("Obiettivo della settimana")}</h2>
  <div class="hint">${tr("Quanti allenamenti ti sei dato e a che punto sei. Si imposta in")} <b>${tr("Io → Obiettivi")}</b>.</div>
     <div class="daytotal" style="border:0;padding:0">${tr("Allenamenti:")} <span>${f} su ${g}</span></div>
     <div style="height:10px;background:var(--linea);border-radius:8px;overflow:hidden;margin:8px 0 8px">
       <div style="height:100%;width:${pc}%;background:${f>=g?"var(--salvia)":"var(--zaff)"}"></div></div>
     <div class="hint">${f>=g?"Obiettivo raggiunto ✓":(g-f)+" da fare entro domenica. L'obiettivo si imposta in Io → Obiettivi e viene usato anche nella proiezione del peso."}</div></div>`;}}
  h+=`<div class="gsec">${tr("Registra")}</div>`;
  h+=`<div class="card"><h2>${tr("Registra un allenamento")}</h2>
  <div class="hint">${tr("Segna cosa hai fatto: le calorie bruciate entrano nel bilancio del giorno.")}</div>
    <label>${tr("Giorno")}</label><select id="wDay">`;
  PLAN.forEach((d,di)=>h+=`<option value="${di}" ${di===ti?"selected":""}>${giorno(d.day)}</option>`);
  h+=`</select><div class="row3"><div><label>Sport</label><select id="wSport">`;
  allSports().forEach(s=>h+=`<option value="${esc(s.name)}">${esc(tr(s.name))}</option>`);
  h+=`</select></div><div><label>Minuti</label><input type="number" id="wMin" value="60" min="5"></div>
  <div><label>${tr("Intensità")}</label><select id="wInt"><option value="bassa">Bassa</option><option value="media" selected>Media</option><option value="alta">Alta</option></select></div></div>
  <button class="btn" onclick="addW()">${tr("Aggiungi allenamento")}</button>
  <button class="btn ghost" onclick="addSportType()">+ Nuovo sport</button>
  <div class="hint">Allenamenti "alta" o >${tr("45 min alzano l'obiettivo acqua di quel giorno (+2 bicchieri).")}</div></div>`;
  {const base=(+S.profile.baseSteps>0)?+S.profile.baseSteps:3000;
   const oggi=SorgentiAttivita.passiDelGiorno(di);
   const extra=Math.max(0,oggi-base);
   h+=`<div class="card"><h2>Passi</h2>
   ${hint2(`${trh("I passi che fai normalmente sono {b1} il fabbisogno: contano come",{b1:"<b>"+tr("già dentro")+"</b>"})} <b>${trh("{v1} al giorno",{v1:base.toLocaleString(dataLoc())})}</b>.`,
     `${trh("Il numero base si cambia in {b1}. Se un giorno cammini molto più del solito, scrivi qui quanti passi hai fatto: l'app sottrae i {v1} già conteggiati e aggiunge al bilancio solo la",{b1:"<b>"+tr("Profilo → Attività")+"</b>"})})}${tr("<b>differenza</b>, così non si contano due volte.")}`)}
   <label>${tr("Passi di")} ${esc(PLAN[di]?giorno(PLAN[di].day):tr("oggi"))}</label>
   <input type="number" id="stepsDay" min="0" max="80000" step="500" value="${oggi||""}" placeholder="es. 9500">
   <div class="mtools"><button class="btn ghost small" onclick="stepsSave(${di})">${tr("Salva i passi")}</button></div>
   <div class="hint">${oggi
     ? (extra>0
        ? trh("Hai fatto <b>{v1}</b> passi: {v2} erano già contati, quindi entrano nel bilancio i <b>{v3}</b> in più — circa <b>{v4} kcal</b>.",{v1:oggi.toLocaleString(dataLoc()),v2:base.toLocaleString(dataLoc()),v3:extra.toLocaleString(dataLoc()),v4:stepsKcal(extra)})
        : trh("Hai fatto <b>{v1}</b> passi, sotto i {v2} già inclusi: non si aggiunge nulla, e non si toglie niente.",{v1:oggi.toLocaleString(dataLoc()),v2:base.toLocaleString(dataLoc())}))
     : tr("Lascia vuoto se è stata una giornata come le altre.")}</div>
   </div>`;}
  h+=`<div class="card"><h2>${tr("Allenamenti della settimana")}</h2>
  <div class="hint">${tr("Tutto quello che hai registrato, giorno per giorno. Con la matita correggi, col cestino elimini.")}</div>`;
  let tot=0,anyw=false;
  PLAN.forEach((d,di)=>{const ws=SorgentiAttivita.allenamentiDelGiorno(di);if(ws.length){anyw=true;
    h+=`<div style="font-weight:700;color:var(--bosco);font-size:13px;margin-top:8px">${giorno(d.day)}</div>`;
    ws.forEach((w,wi)=>{const k=workoutKcal(w);tot+=k;
      h+=`<div class="wline"><span>${esc(cap(sportCorto(w.sport)))} · ${w.min} min · ${w.int}</span><span><b style="color:var(--salvia)">~${k} kcal</b><span class="del" onclick="delW(${di},${wi})">✕</span></span></div>`;});}});
  if(!anyw)h+=vuotoDi("sport");
  h+=`<div class="daytotal" style="margin-top:8px">${tr("Totale settimana:")} <span>~${tot} kcal bruciate</span></div></div>`;
  el.innerHTML=h;}
window.addW=()=>{const di=+document.getElementById("wDay").value;
  (S.week.days[di].workouts=S.week.days[di].workouts||[]).push({sport:document.getElementById("wSport").value,
    min:+document.getElementById("wMin").value||30,int:document.getElementById("wInt").value,
    w:S.profile.w}); // peso del momento: i giorni passati non si ricalcolano
  freezeDay(di);save();render(cur);};
window.delW=(d,i)=>{S.week.days[d].workouts.splice(i,1);save();render(cur);};
window.addSportType=async()=>{const n=(await dlgPrompt(tr("Nome del nuovo sport? (es. canoa)"))||"").trim();if(!n)return;
  if(allSports().some(s=>s.name.toLowerCase()===n.toLowerCase()))return dlgAlert(tr("\"{a}\" esiste già nell\'elenco degli sport.",{a:n}));
  let met=null;
  if(aiOn()){try{
    const t=await aiAsk('Stima il valore MET medio dell\'attività "'+n+'" a intensità media per un adulto amatoriale. Coerenza con l\'app: il MET verrà usato con i moltiplicatori di intensità '+JSON.stringify(INT)+' e in modalità "'+metMode()+'" (netto = si sottrae 1 MET di riposo), quindi dai il valore LORDO standard da compendio, senza correzioni. Riferimenti già usati dall\'app: camminata 3.5, ciclismo 7.5, corsa 9.8, squash 9.0. Rispondi SOLO JSON: {"met":numero}');
    const j=parseAIJSON(t);
    const v=+(+((j&&j.met)||0)).toFixed(1);
    if(v>=1.5&&v<=16){
      if(await dlgConfirm(tr("Stima AI per \"{a}\": MET {b} (a intensità media).\n\nCon il tuo peso: ~{c} kcal in 45 minuti.",{a:n,b:v.toFixed(1),c:Math.round(((v*INT.media)-(metMode()==="netto"?1:0))*(S.profile.w||70)*0.75)}),{ok:tr("Uso questo"),ko:tr("Lo scrivo io")}))met=v;
    }
  }catch(e){aiFail(e);}}
  if(met===null)met=parseFloat(await dlgPrompt(tr("MET (3=leggero, 6=medio, 9=intenso)"),"6"))||6;
  S.customSports.push({name:n,met});save();render("sport");toast(tr('Sport "{n}" aggiunto ✓',{n:n}));};



/* ── LA PALESTRA DENTRO NUVIA ────────────────────────────────────────
   Ventiquattro esercizi che coprono tutte le fasce principali, ognuno
   con la sua figura: una silhouette e UNA freccia che dice dove va il
   corpo. Poche e chiare, non cinquanta confuse. Niente immagini esterne:
   sono disegni nel file, che funzionano offline e pesano nulla. */
const ESERCIZI=[
 {k:"superman",n:"Superman a terra",g:"paravertebrali",att:"niente",lv:"base",s:3,r:12,come:"Prono, solleva insieme braccia e gambe di pochi centimetri, tieni due secondi, scendi lentamente.",p:"schiena_su",err:"Non sollevare troppo: pochi centimetri bastano, la schiena non va strizzata."},
 {k:"birddog",n:"Bird dog",g:"paravertebrali",att:"niente",lv:"base",s:3,r:10,come:"A quattro zampe, allunga braccio destro e gamba sinistra insieme senza ruotare il bacino, poi cambia.",p:"diagonale",err:"Il bacino non deve ruotare: immagina un bicchiere pieno appoggiato sulla schiena."},
 {k:"goodmorning",n:"Good morning a corpo libero",g:"paravertebrali",att:"niente",lv:"medio",s:3,r:12,come:"Mani dietro la testa, gambe semipiegate, porta il busto avanti tenendo la schiena dritta, risali.",p:"busto_avanti",err:"La schiena resta dritta: se si incurva, fermati prima."},
 {k:"hollow",n:"Hollow hold",g:"addominali",att:"niente",lv:"medio",s:3,r:20,come:"Supino, schiena schiacciata a terra, braccia e gambe sollevate. Conta i secondi.",p:"barca_tieni",err:"La zona lombare resta incollata a terra: se si stacca, alza di più le gambe."},
 {k:"gambetese",n:"Sollevamento gambe tese",g:"addominali",att:"niente",lv:"medio",s:3,r:12,come:"Supino, mani sotto i glutei, sali con le gambe tese fino a 90 gradi, scendi senza toccare terra.",p:"gambe_su",err:"Non inarcare la schiena: se succede, piega un po' le ginocchia."},
 {k:"russian",n:"Russian twist",g:"addominali",att:"niente",lv:"base",s:3,r:16,come:"Seduto, busto inclinato indietro, ruota le spalle da un lato all'altro con controllo.",p:"busto_ruota",err:"Ruotano le spalle, non solo le braccia: il movimento parte dal busto."},
 {k:"deadbug",n:"Dead bug",g:"addominali",att:"niente",lv:"base",s:3,r:12,come:"Supino, braccia e ginocchia in alto: allunga braccio e gamba opposti senza staccare la schiena da terra.",p:"diagonale_supino",err:"Lento è meglio: se la schiena si stacca, riduci l'escursione."},
 {k:"collo",n:"Mobilità del collo",g:"collo",att:"niente",lv:"base",s:2,r:8,come:"Seduto, porta l'orecchio verso la spalla e poi il mento verso il petto, lentamente. Mai rotazioni complete.",p:"collo_lato",err:"Mai rotazioni complete del collo: solo inclinazioni dolci."},
 {k:"scapole",n:"Retrazioni scapolari",g:"collo",att:"niente",lv:"base",s:3,r:15,come:"Seduto o in piedi, spingi le spalle indietro e in basso stringendo le scapole. Ottimo dopo ore alla scrivania.",p:"spalle_indietro",err:"Le spalle vanno indietro e IN BASSO: non alzarle verso le orecchie."},
 {k:"squat",n:"Squat a corpo libero",g:"gambe",att:"niente",lv:"base",s:3,r:12,come:"Piedi larghi come le spalle, scendi come per sederti, ginocchia in linea coi piedi, schiena dritta.",p:"gambe_giu",err:"I talloni restano a terra e le ginocchia seguono la punta dei piedi."},
 {k:"affondi",n:"Affondi alternati",g:"gambe",att:"niente",lv:"base",s:3,r:10,come:"Un passo avanti, scendi finché il ginocchio dietro sfiora terra, torna su spingendo col tallone.",p:"gambe_avanti",err:"Il ginocchio davanti non supera la punta del piede: il passo è lungo."},
 {k:"ponte",n:"Ponte per glutei",g:"glutei",att:"niente",lv:"base",s:3,r:15,come:"Sdraiato, piedi a terra, solleva il bacino stringendo i glutei, scendi senza appoggiare.",p:"bacino_su",err:"Spingi coi talloni e stringi i glutei in alto: non inarcare la schiena."},
 {k:"stacco",n:"Stacco a gambe tese con manubri",g:"posteriori",att:"manubri",lv:"medio",s:3,r:10,come:"Manubri davanti alle cosce, scendi spingendo il bacino indietro, schiena dritta, risali stringendo i glutei.",p:"busto_avanti",err:"Il movimento parte dal bacino che va indietro, non dalla schiena che scende."},
 {k:"polpacci",n:"Sollevamenti sui polpacci",g:"polpacci",att:"niente",lv:"base",s:3,r:20,come:"In piedi, sali sulle punte lentamente, scendi ancora più lentamente.",p:"punte_su",err:"La discesa lenta vale più della salita: non rimbalzare."},
 {k:"piegamenti",n:"Piegamenti sulle braccia",g:"petto",att:"niente",lv:"base",s:3,r:10,come:"Mani sotto le spalle, corpo in linea, scendi fino a sfiorare, spingi. Se è troppo, ginocchia a terra.",p:"petto_giu",err:"Il corpo è un'asse: se il bacino cade o sale, meglio le ginocchia a terra."},
 {k:"panca",n:"Spinte su panca con manubri",g:"petto",att:"manubri",lv:"medio",s:3,r:10,come:"Sdraiato, manubri all'altezza del petto, spingi in alto senza bloccare i gomiti.",p:"braccia_su",err:"I gomiti non si bloccano mai del tutto in alto."},
 {k:"rematore",n:"Rematore con manubri",g:"dorso",att:"manubri",lv:"base",s:3,r:12,come:"Busto inclinato, schiena dritta, tira i manubri verso i fianchi stringendo le scapole.",p:"braccia_indietro",err:"Tira coi gomiti, non con le mani: le scapole si stringono a ogni ripetizione."},
 {k:"trazioni",n:"Trazioni alla sbarra",g:"dorso",att:"sbarra",lv:"alto",s:3,r:6,come:"Presa larga, tira fino a portare il mento sopra la sbarra, scendi controllando.",p:"corpo_su",err:"Niente slanci: se servono, meglio l'elastico di aiuto o la lat machine."},
 {k:"lat",n:"Lat machine",g:"dorso",att:"palestra",lv:"base",s:3,r:12,come:"Tira la barra al petto, gomiti verso il basso, senza dondolare col busto.",p:"barra_giu",err:"Il busto resta fermo: se dondoli, il peso è troppo."},
 {k:"spalle",n:"Spinte sopra la testa",g:"spalle",att:"manubri",lv:"medio",s:3,r:10,come:"In piedi, manubri all'altezza delle orecchie, spingi sopra la testa senza inarcare la schiena.",p:"braccia_su",err:"La schiena non si inarca: se succede, siediti con lo schienale."},
 {k:"alzate",n:"Alzate laterali",g:"spalle",att:"manubri",lv:"base",s:3,r:12,come:"Braccia leggermente piegate, sali fino all'altezza delle spalle, scendi lentamente.",p:"braccia_lato",err:"Fermati all'altezza delle spalle: più su lavora il trapezio, non la spalla."},
 {k:"curl",n:"Curl per bicipiti",g:"braccia",att:"manubri",lv:"base",s:3,r:12,come:"Gomiti fermi lungo il busto, sali fino alla spalla, scendi controllando.",p:"avambraccio_su",err:"I gomiti restano incollati ai fianchi: se si muovono, il peso è troppo."},
 {k:"french",n:"Estensioni per tricipiti",g:"braccia",att:"manubri",lv:"base",s:3,r:12,come:"Un manubrio sopra la testa con due mani, scendi dietro la nuca piegando i gomiti, risali.",p:"avambraccio_dietro",err:"Si muove solo l'avambraccio: il gomito punta sempre al soffitto."},
 {k:"dip",n:"Dip fra due sedie",g:"braccia",att:"sedia",lv:"medio",s:3,r:10,come:"Mani sul bordo, gambe avanti, scendi piegando i gomiti indietro, risali.",p:"corpo_giu",err:"Le spalle restano lontane dalle orecchie: scendi solo finché è comodo."},
 {k:"sidebend",n:"Flessioni laterali",g:"obliqui",att:"manubri",lv:"base",s:3,r:15,come:"In piedi, un manubrio in una mano, scendi di lato senza ruotare, risali. Poi cambia lato.",p:"busto_lato",err:"Il busto si piega di lato, non in avanti: il movimento è piccolo."},
 {k:"plank",n:"Plank",g:"core",att:"niente",lv:"base",s:3,r:30,come:"Gomiti sotto le spalle, corpo in linea dalla testa ai talloni, addome contratto. Conta i secondi.",p:"linea_tieni",err:"Il bacino né su né giù: una linea sola dalla testa ai talloni."},
 {k:"plank_lat",n:"Plank laterale",g:"core",att:"niente",lv:"medio",s:3,r:20,come:"Su un gomito, corpo in linea vista di lato, bacino alto. Conta i secondi per lato.",p:"lato_tieni",err:"Il fianco non deve cedere verso terra: se cede, appoggia il ginocchio."},
 {k:"crunch",n:"Crunch a terra",g:"core",att:"niente",lv:"base",s:3,r:15,come:"Solleva solo le spalle da terra guardando il soffitto, senza tirare il collo.",p:"spalle_su",err:"Si sollevano solo le scapole: il collo non tira, lo sguardo va in alto."},
 {k:"mountain",n:"Mountain climber",g:"core",att:"niente",lv:"medio",s:3,r:20,come:"In posizione di plank, porta le ginocchia al petto alternate, veloce ma controllato.",p:"ginocchia_avanti",err:"Il bacino resta basso: se salta su, rallenta il ritmo."},
 {k:"burpee",n:"Burpee",g:"tutto il corpo",att:"niente",lv:"alto",s:3,r:8,come:"Squat, mani a terra, gambe indietro, piegamento, torni su e salti.",p:"corpo_su_giu",err:"Meglio lenti e completi che veloci e storti: la schiena dritta nel salto giù."},
 {k:"jumping",n:"Jumping jack",g:"tutto il corpo",att:"niente",lv:"base",s:3,r:30,come:"Salti aprendo gambe e braccia insieme, poi richiudi. Ottimo per scaldarsi.",p:"aperto_chiuso",err:"Atterra morbido sulle punte: le ginocchia ammortizzano."},
 {k:"camminata",n:"Camminata veloce",g:"cardio",att:"niente",lv:"base",s:1,r:30,come:"Passo sostenuto, respiro un po' corto ma riesci a parlare. Conta i minuti.",p:"cammina",err:"Il passo è sostenuto ma il fiato regge una frase intera."},
 {k:"corsa",n:"Corsa leggera",g:"cardio",att:"niente",lv:"medio",s:1,r:25,come:"Ritmo in cui riesci ancora a dire una frase intera. Conta i minuti.",p:"corri",err:"Se non riesci a parlare, stai correndo troppo forte per oggi."},
 {k:"bici",n:"Cyclette o bici",g:"cardio",att:"bici",lv:"base",s:1,r:30,come:"Resistenza media, gambe che girano rotonde. Conta i minuti.",p:"pedala",err:"La gamba distesa resta leggermente piegata: sella alla giusta altezza."},
 {k:"hipthrust",n:"Hip thrust con spalle sul divano",g:"glutei",att:"niente",lv:"medio",s:3,r:12,come:"Spalle appoggiate al bordo del divano, piedi a terra: spingi il bacino in alto e stringi i glutei.",err:"In alto il corpo è un tavolo: non inarcare la schiena per salire di più.",p:"bacino_su"},
 {k:"stepup",n:"Step-up su gradino",g:"gambe",att:"niente",lv:"base",s:3,r:10,come:"Sali su un gradino stabile spingendo con la gamba sopra, scendi controllando. Poi cambia gamba.",err:"Spinge la gamba che sta sopra: quella sotto non dà lo slancio.",p:"gambe_avanti"},
 {k:"wallsit",n:"Sedia al muro",g:"gambe",att:"niente",lv:"base",s:3,r:30,come:"Schiena al muro, scivola giù fino a cosce parallele al pavimento. Conta i secondi e respira.",err:"Le ginocchia stanno sopra le caviglie, non oltre le punte.",p:"gambe_giu"},
 {k:"bulgaro",n:"Squat bulgaro",g:"gambe",att:"niente",lv:"alto",s:3,r:8,come:"Collo del piede dietro appoggiato al divano, scendi sulla gamba davanti tenendo il busto dritto.",err:"Il peso sta sulla gamba davanti: quella dietro solo appoggia.",p:"gambe_avanti"},
 {k:"remelastico",n:"Rematore con elastico",g:"dorso",att:"elastici",lv:"base",s:3,r:15,come:"Elastico sotto i piedi o a una maniglia: tira i gomiti indietro stringendo le scapole.",err:"Le spalle non salgono verso le orecchie: il collo resta lungo.",p:"braccia_indietro"},
 {k:"facepull",n:"Face pull con elastico",g:"spalle",att:"elastici",lv:"base",s:3,r:15,come:"Elastico ancorato in alto: tira verso il viso aprendo i gomiti larghi. Oro per chi sta molto seduto.",err:"Il movimento finisce coi gomiti alti e larghi, non bassi lungo i fianchi.",p:"braccia_indietro"},
 {k:"presselastico",n:"Spinte sopra la testa con elastico",g:"spalle",att:"elastici",lv:"base",s:3,r:12,come:"Elastico sotto i piedi, spingi le mani sopra la testa senza inarcare la schiena.",err:"Le costole restano giù: se la schiena si inarca, accorcia l'elastico.",p:"braccia_su"},
 {k:"curlelastico",n:"Curl con elastico",g:"braccia",att:"elastici",lv:"base",s:3,r:15,come:"Elastico sotto i piedi, gomiti fermi ai fianchi, piega gli avambracci.",err:"Niente slancio col busto: se serve, l'elastico è troppo corto.",p:"avambraccio_su"},
 {k:"nuotatore",n:"Nuotatore a terra",g:"paravertebrali",att:"niente",lv:"base",s:3,r:12,come:"Prono, solleva alternando braccio destro-gamba sinistra e viceversa, come nuotando lento.",err:"Il collo resta neutro: lo sguardo va al pavimento, non avanti.",p:"schiena_su"},
 {k:"polpseduto",n:"Polpacci da seduto",g:"polpacci",att:"niente",lv:"base",s:3,r:20,come:"Seduto, spingi sulle punte sollevando i talloni, con le mani sulle ginocchia come resistenza.",err:"Corsa completa: i talloni scendono del tutto prima di risalire.",p:"punte_su"},
 /* ── palestra: i macchinari ── */
 {k:"legpress",n:"Leg press",g:"gambe",att:"palestra",lv:"base",s:3,r:12,come:"Piedi al centro della pedana, scendi finché le ginocchia arrivano a 90 gradi, spingi senza bloccarle.",err:"La schiena resta incollata allo schienale: se il bacino si stacca, stai scendendo troppo.",p:"gambe_giu"},
 {k:"legext",n:"Leg extension",g:"gambe",att:"palestra",lv:"base",s:3,r:12,come:"Distendi le gambe contro il rullo, fermati un attimo in alto, scendi piano.",err:"Niente colpi: il rullo sale e scende con lo stesso ritmo.",p:"gambe_avanti"},
 {k:"legcurl",n:"Leg curl",g:"posteriori",att:"palestra",lv:"base",s:3,r:12,come:"Porta i talloni verso i glutei contro il rullo, torna controllando.",err:"Il bacino non si solleva dal supporto: se succede, togli peso.",p:"tallone_dietro"},
 {k:"calfpressa",n:"Polpacci alla pressa",g:"polpacci",att:"palestra",lv:"base",s:3,r:15,come:"Punte dei piedi sul bordo della pedana, spingi in massima estensione, scendi oltre il neutro.",err:"Corsa completa: mezzo movimento è mezzo risultato.",p:"punte_su"},
 {k:"adduttori",n:"Adductor machine",g:"gambe",att:"palestra",lv:"base",s:3,r:15,come:"Chiudi le gambe contro i cuscinetti con controllo, riapri piano.",err:"L'apertura iniziale è quella comoda: forzarla non serve.",p:"aperto_chiuso"},
 {k:"abduttori",n:"Abductor machine",g:"glutei",att:"palestra",lv:"base",s:3,r:15,come:"Spingi le gambe verso l'esterno contro i cuscinetti, torna senza far sbattere i pesi.",err:"Il busto resta fermo: non aiutarti dondolando avanti.",p:"aperto_chiuso"},
 {k:"chestpress",n:"Chest press",g:"petto",att:"palestra",lv:"base",s:3,r:10,come:"Impugnature all'altezza del petto, spingi avanti senza bloccare i gomiti, torna piano.",err:"Le spalle restano basse e indietro: non si sollevano verso le orecchie.",p:"opposti_avanti"},
 {k:"pecdeck",n:"Pectoral machine",g:"petto",att:"palestra",lv:"base",s:3,r:12,come:"Gomiti leggermente piegati, chiudi le braccia davanti al petto, riapri controllando.",err:"Non aprire oltre la linea delle spalle: lì il petto non lavora, la spalla soffre.",p:"aperto_chiuso"},
 {k:"shoulderpress",n:"Shoulder press",g:"spalle",att:"palestra",lv:"base",s:3,r:10,come:"Schienale regolato, spingi le impugnature sopra la testa, scendi fino alle orecchie.",err:"La schiena non si inarca: le costole restano giù.",p:"braccia_su"},
 {k:"pulley",n:"Pulley basso",g:"dorso",att:"palestra",lv:"base",s:3,r:12,come:"Tira la maniglia alla pancia stringendo le scapole, busto quasi fermo.",err:"Non farti trascinare avanti dal peso: il ritorno è lento come la tirata.",p:"braccia_indietro"},
 {k:"latstretta",n:"Lat machine presa stretta",g:"dorso",att:"palestra",lv:"base",s:3,r:12,come:"Presa stretta, tira la barra allo sterno con i gomiti che scendono lungo i fianchi.",err:"Il busto si inclina appena: se dondoli, il peso è troppo.",p:"barra_giu"},
 {k:"croci_cavi",n:"Croci ai cavi",g:"petto",att:"palestra",lv:"medio",s:3,r:12,come:"Un passo avanti fra i cavi, chiudi le mani davanti al petto con gomiti morbidi.",err:"Il movimento è un abbraccio, non una spinta: i gomiti restano piegati uguali.",p:"aperto_chiuso"},
 {k:"pushdown",n:"Spinte in basso ai cavi",g:"braccia",att:"palestra",lv:"base",s:3,r:12,come:"Gomiti fermi ai fianchi, spingi la barra in basso fino a distendere, risali piano.",err:"Se i gomiti si aprono, stai usando le spalle: avvicinali al corpo.",p:"avambraccio_dietro"},
 {k:"curl_cavi",n:"Curl ai cavi",g:"braccia",att:"palestra",lv:"base",s:3,r:12,come:"Gomiti ai fianchi, porta la barra verso le spalle, scendi controllando fino in fondo.",err:"La discesa completa conta: mezzo curl allena mezzo bicipite.",p:"avambraccio_su"},
 {k:"smith_squat",n:"Squat al multipower",g:"gambe",att:"palestra",lv:"medio",s:3,r:10,come:"Bilanciere guidato sulle spalle, piedi un passo avanti, scendi a 90 gradi.",err:"I piedi stanno più avanti che nello squat libero: la guida lo richiede.",p:"gambe_giu"},
 {k:"trazassist",n:"Trazioni assistite",g:"dorso",att:"palestra",lv:"base",s:3,r:8,come:"Ginocchia sul supporto, tira fino al mento sopra la sbarra: la macchina compensa quello che manca.",err:"Scegli un aiuto che ti fa arrivare a 8: troppo aiuto non allena, troppo poco insegna a strattonare.",p:"corpo_su"},
 /* ── palestra: il cardio delle macchine ── */
 {k:"tapis_cam",n:"Camminata sul tapis roulant",g:"cardio",att:"tapis",lv:"base",s:1,r:30,come:"Passo sostenuto, 5,5-6,5 km/h: il fiato regge una frase intera.",err:"Non aggrapparti ai manubri: le braccia oscillano come per strada.",p:"cammina"},
 {k:"tapis_corsa",n:"Corsa sul tapis roulant",g:"cardio",att:"tapis",lv:"medio",s:1,r:25,come:"Ritmo in cui riesci a parlare a frasi corte. Un filo di pendenza (1%) imita la strada.",err:"Lo sguardo va avanti, non ai piedi: il collo ringrazia.",p:"corri"},
 {k:"tapis_salita",n:"Camminata in salita sul tapis",g:"cardio",att:"tapis",lv:"base",s:1,r:20,come:"Pendenza 6-10%, passo tranquillo: lavorano glutei e cuore senza impatto.",err:"Se ti serve aggrapparti, abbassa la pendenza: contare i watt degli altri non brucia calorie.",p:"cammina"},
 {k:"ellittica",n:"Ellittica",g:"cardio",att:"palestra",lv:"base",s:1,r:25,come:"Movimento fluido spingendo anche con le braccia, resistenza media.",err:"I talloni restano appoggiati: sulle punte si affaticano solo i polpacci.",p:"cammina"},
 {k:"vogatore",n:"Vogatore",g:"cardio",att:"palestra",lv:"medio",s:1,r:15,come:"Prima le gambe, poi il busto, poi le braccia. Al ritorno l'ordine inverso.",err:"Il novanta per cento della spinta viene dalle gambe, non dalle braccia.",p:"braccia_indietro"},
 {k:"scale",n:"Simulatore di scale",g:"cardio",att:"palestra",lv:"medio",s:1,r:15,come:"Passo regolare, mani appoggiate senza scaricare il peso.",err:"Gradini interi, non punte: il tallone appoggia.",p:"gambe_avanti"},
 /* ── manubri: la seconda ondata ── */
 {k:"goblet",n:"Goblet squat",g:"gambe",att:"manubri",lv:"base",s:3,r:12,come:"Manubrio verticale contro il petto, scendi tra le ginocchia tenendo il busto dritto.",err:"I gomiti scendono DENTRO le ginocchia: se le toccano fuori, allarga i piedi.",p:"gambe_giu"},
 {k:"affondi_man",n:"Affondi con manubri",g:"gambe",att:"manubri",lv:"medio",s:3,r:10,come:"Manubri lungo i fianchi, passo avanti, scendi finché il ginocchio dietro sfiora terra.",err:"Il busto resta verticale: se si piega avanti, i manubri sono troppo pesanti.",p:"gambe_avanti"},
 {k:"shrug",n:"Scrollate con manubri",g:"spalle",att:"manubri",lv:"base",s:3,r:15,come:"Manubri lungo i fianchi, alza le spalle verso le orecchie, tieni un secondo, scendi.",err:"Solo su e giù: le rotazioni delle spalle sotto carico non servono e infastidiscono il collo.",p:"spalle_su"},
 {k:"pullover",n:"Pullover con manubrio",g:"petto",att:"manubri",lv:"medio",s:3,r:12,come:"Sdraiato, un manubrio a due mani sopra il petto: portalo dietro la testa ad arco, torna.",err:"I gomiti restano quasi fermi: l'arco lo disegnano le spalle.",p:"braccia_su"},
 {k:"floorpress",n:"Distensioni a terra",g:"petto",att:"manubri",lv:"base",s:3,r:10,come:"Sdraiato a terra, spingi i manubri dal petto verso l'alto: i gomiti toccano terra a ogni ripetizione.",err:"La pausa a terra è il punto del movimento: non rimbalzare.",p:"braccia_su"},
 {k:"renegade",n:"Renegade row",g:"dorso",att:"manubri",lv:"alto",s:3,r:8,come:"In plank sulle maniglie dei manubri, tira un manubrio al fianco senza ruotare il bacino.",err:"Il bacino è un tavolo: se ruota, allarga i piedi o togli peso.",p:"diagonale"},
 {k:"rem_uno",n:"Rematore a un braccio",g:"dorso",att:"manubri",lv:"base",s:3,r:10,come:"Mano e ginocchio sulla panca o sul divano, tira il manubrio al fianco col gomito radente.",err:"La schiena resta piatta come un tavolo: lo specchio di lato lo conferma.",p:"braccia_indietro"},
 {k:"alz_front",n:"Alzate frontali",g:"spalle",att:"manubri",lv:"base",s:3,r:12,come:"Braccia quasi tese, alza i manubri davanti a te fino alle spalle, alternando.",err:"Niente slancio del busto: se serve, il peso è troppo.",p:"opposti_avanti"},
 {k:"alz_90",n:"Alzate a busto flesso",g:"spalle",att:"manubri",lv:"medio",s:3,r:12,come:"Busto piegato avanti, schiena dritta: apri le braccia ai lati come ali.",err:"Le scapole si stringono a fine movimento: senza, lavorano solo le braccia.",p:"braccia_indietro"},
 {k:"kickback",n:"Kickback per tricipiti",g:"braccia",att:"manubri",lv:"base",s:3,r:12,come:"Busto flesso, gomito alto e fermo: distendi l'avambraccio all'indietro.",err:"Il gomito non scende mai: è lui il perno di tutto.",p:"avambraccio_dietro"},
 {k:"martello",n:"Curl a martello",g:"braccia",att:"manubri",lv:"base",s:3,r:12,come:"Manubri con i palmi che si guardano: piega gli avambracci tenendo i gomiti ai fianchi.",err:"I polsi restano dritti in linea con l'avambraccio.",p:"avambraccio_su"},
 {k:"arnold",n:"Arnold press",g:"spalle",att:"manubri",lv:"medio",s:3,r:10,come:"Parti coi palmi verso di te, spingi in alto ruotando i palmi in avanti.",err:"La rotazione è fluida e accompagna la spinta, non uno scatto a metà.",p:"braccia_su"},
 {k:"farmer",n:"Camminata del contadino",g:"tutto il corpo",att:"manubri",lv:"base",s:3,r:30,come:"Un manubrio pesante per mano, cammina dritto per i secondi indicati. Semplice e completo.",err:"Le spalle indietro e il passo normale: non è una corsa, è una postura che cammina.",p:"cammina"},
 /* ── elastici: la palestra nel cassetto ── */
 {k:"pullapart",n:"Pull apart con elastico",g:"spalle",att:"elastici",lv:"base",s:3,r:15,come:"Elastico teso fra le mani davanti a te: aprilo fino a toccare il petto stringendo le scapole.",err:"Le braccia restano all'altezza delle spalle, non scendono.",p:"aperto_chiuso"},
 {k:"squat_el",n:"Squat con elastico",g:"gambe",att:"elastici",lv:"base",s:3,r:15,come:"Elastico sotto i piedi e sulle spalle (o alle mani): squat normale contro la resistenza.",err:"L'elastico tira più in alto: non farti richiudere le ginocchia in salita.",p:"gambe_giu"},
 {k:"monster",n:"Monster walk",g:"glutei",att:"elastici",lv:"base",s:3,r:12,come:"Elastico sopra le ginocchia, mezzo squat: passi laterali mantenendo la tensione.",err:"I piedi non si avvicinano mai del tutto: la tensione non deve mollare.",p:"aperto_chiuso"},
 {k:"glute_el",n:"Slancio dietro con elastico",g:"glutei",att:"elastici",lv:"base",s:3,r:12,come:"Elastico alle caviglie, mani a un appoggio: spingi una gamba indietro tesa, torna piano.",err:"La schiena non si inarca: il movimento è corto e viene dal gluteo.",p:"tallone_dietro"},
 {k:"extrarot",n:"Extrarotazioni con elastico",g:"spalle",att:"elastici",lv:"base",s:3,r:15,come:"Gomito al fianco piegato a 90 gradi: ruota l'avambraccio verso l'esterno contro l'elastico.",err:"Il gomito resta incollato al fianco: un asciugamano sotto aiuta a sentirlo.",p:"opposti_avanti"},
 {k:"tric_el",n:"Estensioni tricipiti con elastico",g:"braccia",att:"elastici",lv:"base",s:3,r:15,come:"Elastico ancorato in alto: gomiti ai fianchi, spingi le mani in basso fino a distendere.",err:"Solo l'avambraccio si muove: il gomito è il cardine.",p:"avambraccio_dietro"},
 {k:"alzlat_el",n:"Alzate laterali con elastico",g:"spalle",att:"elastici",lv:"base",s:3,r:15,come:"Elastico sotto i piedi: alza le braccia ai lati fino alle spalle.",err:"Fermati alle spalle: più su lavora il trapezio.",p:"braccia_lato"},
 {k:"pallof",n:"Pallof press",g:"core",att:"elastici",lv:"medio",s:3,r:10,come:"Elastico ancorato di lato all'altezza del petto: spingi le mani avanti e RESISTI alla rotazione.",err:"Il segreto è quello che NON si muove: fianchi e spalle restano frontali.",p:"opposti_avanti"},
 /* ── sbarra: la seconda ondata ── */
 {k:"chin",n:"Trazioni presa inversa",g:"dorso",att:"sbarra",lv:"medio",s:3,r:6,come:"Palmi verso di te, presa alla larghezza delle spalle: tira fino al mento sopra la sbarra.",err:"Parti da braccia distese: le mezze trazioni contano metà.",p:"corpo_su"},
 {k:"negative",n:"Trazioni negative",g:"dorso",att:"sbarra",lv:"base",s:3,r:5,come:"Sali aiutandoti con un salto o una sedia, poi scendi il più lentamente possibile.",err:"La discesa dura almeno 4 secondi: è lì che si costruisce la prima trazione vera.",p:"corpo_giu"},
 /* ── corpo libero: la seconda ondata ── */
 {k:"ponte_uno",n:"Ponte a una gamba",g:"glutei",att:"niente",lv:"medio",s:3,r:10,come:"Come il ponte, ma con una gamba tesa in aria: spingi col tallone a terra.",err:"Il bacino resta orizzontale: se pende dal lato della gamba alzata, torna al ponte classico.",p:"bacino_su"},
 {k:"affondo_inv",n:"Affondo all'indietro",g:"gambe",att:"niente",lv:"base",s:3,r:10,come:"Passo INDIETRO, scendi col ginocchio verso terra, risali spingendo col tallone davanti.",err:"Più gentile col ginocchio dell'affondo avanti: se quello ti dà fastidio, questo è il tuo.",p:"gambe_avanti"},
 {k:"affondo_lat",n:"Affondo laterale",g:"gambe",att:"niente",lv:"medio",s:3,r:8,come:"Passo largo di lato, scendi sul quel lato tenendo l'altra gamba tesa, risali.",err:"Il piede della gamba tesa resta tutto a terra: se si solleva, accorcia il passo.",p:"aperto_chiuso"},
 {k:"curtsy",n:"Affondo incrociato",g:"glutei",att:"niente",lv:"medio",s:3,r:8,come:"Passo indietro in diagonale, dietro l'altra gamba, come un inchino: scendi e risali.",err:"Il ginocchio davanti punta sempre avanti, anche se la gamba dietro incrocia.",p:"gambe_avanti"},
 {k:"calf_grad",n:"Polpacci sul gradino",g:"polpacci",att:"niente",lv:"medio",s:3,r:15,come:"Punte sul bordo del gradino, talloni nel vuoto: scendi sotto il livello, spingi in alto.",err:"La corsa completa è il vantaggio del gradino: usala tutta.",p:"punte_su"},
 {k:"squat_jump",n:"Squat con salto",g:"gambe",att:"niente",lv:"alto",s:3,r:8,come:"Squat normale, poi esplodi in un salto: atterra morbido e riparti.",err:"L'atterraggio è già il prossimo squat: ginocchia che ammortizzano, mai tese.",p:"corpo_su_giu"},
 {k:"skater",n:"Salti dello skater",g:"gambe",att:"niente",lv:"medio",s:3,r:12,come:"Salta di lato da un piede all'altro come un pattinatore, il braccio opposto accompagna.",err:"Atterra sul piede intero e fermati un attimo: il controllo vale più dell'ampiezza.",p:"aperto_chiuso"},
 {k:"highknees",n:"Corsa sul posto ginocchia alte",g:"cardio",att:"niente",lv:"medio",s:3,r:30,come:"Corri sul posto portando le ginocchia all'altezza dei fianchi, braccia attive.",err:"Resta sulle punte, atterraggi leggeri: i vicini di sotto non devono saperlo.",p:"ginocchia_avanti"},
 {k:"marcia",n:"Marcia sul posto",g:"cardio",att:"niente",lv:"base",s:1,r:10,come:"Cammina sul posto alzando bene le ginocchia, braccia che oscillano. Perfetta per iniziare o per le pause.",err:"Le braccia lavorano col ritmo delle gambe: metà del cardio sta lì.",p:"cammina"},
 {k:"pike",n:"Piegamenti a V",g:"spalle",att:"niente",lv:"alto",s:3,r:8,come:"Bacino in alto a formare una V rovesciata: piega le braccia portando la testa verso terra.",err:"È un esercizio di SPALLE: più il bacino è alto, più lavora dove deve.",p:"petto_giu"},
 {k:"diamond",n:"Piegamenti stretti",g:"braccia",att:"niente",lv:"alto",s:3,r:8,come:"Mani vicine sotto il petto: piegamenti coi gomiti che scorrono lungo i fianchi.",err:"I gomiti indietro, non in fuori: è questo che sposta il lavoro sui tricipiti.",p:"petto_giu"},
 {k:"incline",n:"Piegamenti inclinati",g:"petto",att:"sedia",lv:"base",s:3,r:12,come:"Mani sul bordo del divano o della sedia: piegamenti in salita, più gentili di quelli a terra.",err:"Il corpo resta un'asse anche in salita: il bacino non si siede.",p:"petto_giu"},
 {k:"wall_push",n:"Piegamenti al muro",g:"petto",att:"niente",lv:"base",s:3,r:15,come:"Mani al muro all'altezza delle spalle, un passo indietro: piega e spingi.",err:"Più i piedi sono lontani dal muro, più è difficile: regola tu la salita.",p:"petto_giu"},
 {k:"bicycle",n:"Crunch bicicletta",g:"addominali",att:"niente",lv:"medio",s:3,r:16,come:"Supino, pedala portando il gomito verso il ginocchio opposto, lento.",err:"Il gomito va verso il ginocchio col BUSTO che ruota: non tirare il collo con le mani.",p:"ginocchia_avanti"},
 {k:"boxe",n:"Boxe con l'ombra",g:"cardio",att:"niente",lv:"base",s:3,r:60,come:"Guardia alta, colpi leggeri nell'aria alternando le braccia, gambe sempre in movimento.",err:"I colpi non si distendono mai del tutto: il gomito resta morbido.",p:"opposti_avanti"},
];
const ES_POSE={
 schiena_su:{f:"M20 52a5 5 0 100 10 5 5 0 000-10M25 57h44M25 57l-8-8M69 57l10-6",a:"M46 42V26M46 26l-5 6M46 26l5 6"},
 opposti_avanti:{f:"M26 34a5 5 0 100 10 5 5 0 000-10M31 39h30M31 39v18M61 39v18M31 39l-12-8M61 57l14 8",a:"M78 32h14M92 32l-6-5M92 32l-6 5"},
 busto_ruota:{f:"M50 18a5 5 0 100 10 5 5 0 000-10M50 28v18M50 46l-12 16M50 46l12 16M34 34h32",a:"M30 34a24 12 0 0040 0M70 34l-6-4M70 34l-6 5"},
 busto_lato:{f:"M50 16a5 5 0 100 10 5 5 0 000-10M50 26q-6 12-4 24M46 50l-4 20M46 50l8 20M50 30l14 6",a:"M76 34v22M76 56l-5-6M76 56l5-6"},
 collo_lato:{f:"M50 22a7 7 0 100 14 7 7 0 000-14M50 36v18M50 40l-14 4M50 40l14 4M50 54l-6 16M50 54l6 16",a:"M64 24a14 10 0 00-22-2M42 22l-1 7M42 22l7 1"},
 collo_avanti:{f:"M50 22a7 7 0 100 14 7 7 0 000-14M50 36v18M50 40l-14 4M50 40l14 4M50 54l-6 16M50 54l6 16",a:"M50 12v-0M64 20a12 12 0 01-6 12M58 32l6-2M58 32l1-6"},
 schiena_arco:{f:"M26 40a5 5 0 100 10 5 5 0 000-10M31 45q18-14 34 0M31 45v14M65 45v14",a:"M48 24v-8M48 16l-5 6M48 16l5 6M48 60v8M48 68l-5-6M48 68l5-6"},
 ginocchia_petto:{f:"M24 52a5 5 0 100 10 5 5 0 000-10M29 57h20l10-10 8 4M29 57v8M49 57l6 8",a:"M70 40h-14M56 40l6-5M56 40l6 5"},
 tallone_dietro:{f:"M50 16a5 5 0 100 10 5 5 0 000-10M50 26v20M50 46l-6 22M50 46l10 12-8 8M50 32l10 6",a:"M74 56l-10-8M64 48l7 0M64 48l0 7"},
 diagonale:{f:"M28 34a5 5 0 100 10 5 5 0 000-10M32 42h24M32 42v16M56 42v16M32 42l-10-8M56 58l12 6",a:"M74 40l-8-8M66 32l6 0M66 32l0 6"},
 barca_tieni:{f:"M24 52a5 5 0 100 10 5 5 0 000-10M29 55l16-6M29 57l16 8M45 49l22-8M45 65l22 6",a:"M82 44h12M82 62h12"},
 gambe_su:{f:"M22 60a5 5 0 100 10 5 5 0 000-10M27 65h20M47 65l16-22M47 65l20-16",a:"M80 60V34M80 34l-5 6M80 34l5 6"},
 diagonale_supino:{f:"M22 46a5 5 0 100 10 5 5 0 000-10M27 51h30M27 51l-6-10M57 51l10-8M35 51l-4 12M49 51l6 10",a:"M78 40l8-8M86 32l-6 0M86 32l0 6"},
 spalle_indietro:{f:"M50 18a5 5 0 100 10 5 5 0 000-10M50 28v20M50 32l-14 4M50 32l14 4M50 48l-7 20M50 48l7 20",a:"M30 34h-8M22 34l6-5M22 34l6 5M70 34h8M78 34l-6-5M78 34l-6 5"},
 gambe_giu:{f:"M50 14a5 5 0 100 10 5 5 0 000-10M50 24v20M50 44l-9 12v14M50 44l9 12v14M41 30l-11 6M59 30l11 6",a:"M84 30v26M84 56l-5-6M84 56l5-6"},
 gambe_avanti:{f:"M50 14a5 5 0 100 10 5 5 0 000-10M50 24v20M50 44l-14 10v16M50 44l10 14v12M50 32l-9 8M50 32l9 8",a:"M78 34l10 14M88 48l-1-7M88 48l-7 1"},
 bacino_su:{f:"M22 60a5 5 0 100 10 5 5 0 000-10M27 65h22l10-12 12 12v12M49 65l10-12",a:"M74 46V26M74 26l-5 6M74 26l5 6"},
 busto_avanti:{f:"M38 16a5 5 0 100 10 5 5 0 000-10M40 26l16 14M56 40v26M56 40l-8 8M40 26l-4 12M48 48v14",a:"M74 30l10 16M84 46l-1-7M84 46l-7 1"},
 punte_su:{f:"M50 12a5 5 0 100 10 5 5 0 000-10M50 22v22M50 44l-7 20M50 44l7 20M43 64h-6M57 64h6",a:"M80 50V28M80 28l-5 6M80 28l5 6"},
 petto_giu:{f:"M24 44a5 5 0 100 10 5 5 0 000-10M29 49h34l12 8M29 49l0 12M46 49v14M63 49v14",a:"M84 34v22M84 56l-5-6M84 56l5-6"},
 braccia_su:{f:"M50 20a5 5 0 100 10 5 5 0 000-10M50 30v22M50 30l-12-8M50 30l12-8M50 52l-8 18M50 52l8 18",a:"M84 50V24M84 24l-5 6M84 24l5 6"},
 braccia_indietro:{f:"M34 18a5 5 0 100 10 5 5 0 000-10M36 28l16 12M52 40v24M52 40l14-4M36 28l-6 10M44 44v18",a:"M84 44h-22M62 44l6-5M62 44l6 5"},
 corpo_su:{f:"M50 26a5 5 0 100 10 5 5 0 000-10M50 36v20M50 36l-10-12M50 36l10-12M50 56l-7 16M50 56l7 16M32 22h36",a:"M84 60V32M84 32l-5 6M84 32l5 6"},
 barra_giu:{f:"M50 22a5 5 0 100 10 5 5 0 000-10M50 32v20M50 32l-13-6M50 32l13 6M50 52l-8 18M50 52l8 18M30 24h40",a:"M84 30v26M84 56l-5-6M84 56l5-6"},
 braccia_lato:{f:"M50 18a5 5 0 100 10 5 5 0 000-10M50 28v24M50 32l-18 2M50 32l18 2M50 52l-8 18M50 52l8 18",a:"M78 30h14M92 30l-6-5M92 30l-6 5"},
 avambraccio_su:{f:"M50 16a5 5 0 100 10 5 5 0 000-10M50 26v24M50 30l-10 10 4 10M50 30l10 10-4 10M50 50l-7 20M50 50l7 20",a:"M84 56V30M84 30l-5 6M84 30l5 6"},
 avambraccio_dietro:{f:"M50 20a5 5 0 100 10 5 5 0 000-10M50 30v22M50 32l-9 -8-3 8M50 32l9 -8 3 8M50 52l-8 18M50 52l8 18",a:"M84 30v22M84 52l-5-6M84 52l5-6"},
 corpo_giu:{f:"M50 22a5 5 0 100 10 5 5 0 000-10M50 32v18M50 34l-12 4M50 34l12 4M50 50l-4 20M50 50l4 20M32 38h8M60 38h8",a:"M84 32v24M84 56l-5-6M84 56l5-6"},
 linea_tieni:{f:"M22 46a5 5 0 100 10 5 5 0 000-10M27 51h44M31 51v12M67 51v12",a:"M78 40h16M78 62h16"},
 lato_tieni:{f:"M24 34a5 5 0 100 10 5 5 0 000-10M28 39l40 26M28 39v22M68 65h-8",a:"M80 36v28"},
 spalle_su:{f:"M28 52a5 5 0 100 10 5 5 0 000-10M33 57h20l10 8M53 57l-2-10M63 65v6",a:"M80 60V34M80 34l-5 6M80 34l5 6"},
 ginocchia_avanti:{f:"M22 44a5 5 0 100 10 5 5 0 000-10M27 49h40M31 49v12M67 49l-12 8M55 57v8",a:"M84 52h-18M66 52l6-5M66 52l6 5"},
 corpo_su_giu:{f:"M50 16a5 5 0 100 10 5 5 0 000-10M50 26v22M50 30l-12-6M50 30l12-6M50 48l-8 20M50 48l8 20",a:"M86 26v30M86 56l-5-6M86 56l5-6M86 26l-5 6M86 26l5 6"},
 aperto_chiuso:{f:"M50 16a5 5 0 100 10 5 5 0 000-10M50 26v22M50 30l-16-8M50 30l16-8M50 48l-14 20M50 48l14 20",a:"M76 28h16M92 28l-6-5M92 28l-6 5"},
 cammina:{f:"M50 16a5 5 0 100 10 5 5 0 000-10M50 26v20M50 46l-10 22M50 46l12 20M50 32l-10 8M50 32l10 6",a:"M74 44h18M92 44l-6-5M92 44l-6 5"},
 corri:{f:"M54 14a5 5 0 100 10 5 5 0 000-10M52 24l-4 18M48 42l-12 16M48 42l12 12M52 28l-14 4M52 28l14 8",a:"M76 40h18M94 40l-6-5M94 40l-6 5"},
 pedala:{f:"M46 18a5 5 0 100 10 5 5 0 000-10M46 28v16M46 44l-8 12M46 44l10 10M46 32l12 4M32 66a8 8 0 1016 0 8 8 0 10-16 0M56 66a8 8 0 1016 0 8 8 0 10-16 0",a:"M78 60a10 10 0 10-2-14M76 46l-1 6M76 46l6 1"}
};
const RISCALDA=[["Cerchi con le braccia","30 secondi avanti, 30 indietro"],["Ginocchia al petto camminando","10 per gamba"],["Rotazioni del busto","20 lente, piedi fermi"],["Jumping jack leggeri","1 minuto"]];
const STRETCH=[
 {k:"s_collo",n:"Collo, lato",g:"collo",sec:20,come:"Orecchio verso la spalla, la mano accompagna senza tirare. Spalle basse.",p:"collo_lato"},
 {k:"s_trapezi",n:"Collo e trapezi",g:"collo",sec:20,come:"Mento verso il petto, mani intrecciate dietro la testa senza spingere.",p:"collo_avanti"},
 {k:"s_petto",n:"Petto allo stipite",g:"petto",sec:30,come:"Avambraccio contro lo stipite, ruota il busto dalla parte opposta.",p:"braccia_lato"},
 {k:"s_dorso",n:"Dorso a gatto",g:"dorso",sec:30,come:"A quattro zampe, inarca e arrotonda la schiena seguendo il respiro.",p:"schiena_arco"},
 {k:"s_lombari",n:"Ginocchia al petto",g:"paravertebrali",sec:30,come:"Supino, abbraccia le ginocchia e dondola piano: scarica la zona lombare.",p:"ginocchia_petto"},
 {k:"s_quadri",n:"Quadricipite in piedi",g:"gambe",sec:30,come:"Tallone al gluteo, ginocchia vicine, bacino leggermente in avanti.",p:"tallone_dietro"},
 {k:"s_poster",n:"Posteriori seduto",g:"posteriori",sec:30,come:"Seduto, una gamba tesa, scendi con la schiena dritta verso la punta del piede.",p:"busto_avanti"},
 {k:"s_polpa",n:"Polpaccio al muro",g:"polpacci",sec:30,come:"Punta contro il muro, tallone a terra, avvicina il bacino.",p:"punte_su"},
 {k:"s_anche",n:"Flessori dell'anca",g:"anche",sec:30,come:"In affondo basso, bacino avanti e glutei stretti: si allunga davanti alla coscia dietro.",p:"gambe_avanti"},
];

/* ── IL MOVIMENTO DELLE FIGURE ─────────────────────────────────────
   Ogni posa ha già una freccia che indica il gesto: l'animazione non
   inventa nulla, fa RESPIRARE quel linguaggio. La figura compie il
   micro-movimento del gesto, la freccia pulsa nella sua direzione.
   Solo transform/opacity (60fps, niente layout), ampiezze piccole
   (2-5px), e tutto dentro prefers-reduced-motion: chi lo chiede
   ferma, vede le pose statiche di prima. */
const ES_MOTO={
 schiena_su:"su", opposti_avanti:"lato", busto_ruota:"ruota",
 busto_lato:"ruota", collo_lato:"ruota", collo_avanti:"su",
 schiena_arco:"su", ginocchia_petto:"tieni", tallone_dietro:"tieni",
 diagonale:"lato", barca_tieni:"tieni", gambe_su:"su",
 diagonale_supino:"lato", spalle_indietro:"lato", gambe_giu:"giu",
 gambe_avanti:"tieni", bacino_su:"su", busto_avanti:"su",
 punte_su:"su", petto_giu:"giu", braccia_su:"su",
 braccia_indietro:"lato", corpo_su:"su", barra_giu:"giu",
 braccia_lato:"lato", avambraccio_su:"su", avambraccio_dietro:"lato",
 corpo_giu:"giu", linea_tieni:"tieni", lato_tieni:"tieni",
 spalle_su:"su", ginocchia_avanti:"lato", corpo_su_giu:"su",
 aperto_chiuso:"lato", cammina:"passo", corri:"passo2", pedala:"pedala"};

function esFigura(pose,sz){
  const p=ES_POSE[pose];if(!p)return "";
  const m=ES_MOTO[pose]||"tieni";
  return '<svg viewBox="0 0 100 80" width="'+(sz||96)+'" height="'+Math.round((sz||96)*0.8)+'" fill="none" aria-hidden="true" class="esfig">'+
    '<g class="esfig-corpo mo-'+m+'"><path d="'+p.f+'" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g>'+
    '<g class="esfig-gesto mo-a-'+m+'"><path d="'+p.a+'" stroke="var(--zaff)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g></svg>';}
function esTrova(k){return ESERCIZI.find(e=>e.k===k)||null;}
/* Cosa può fare davvero: dipende da dove si allena e da cosa possiede. */
function esDisponibili(){
  const t=(S.train&&(S.train.dove||"")+" "+(S.train.attrezzi||"")).toLowerCase();
  const inPalestra=/palestr|gym/.test(t);
  const haManubri=inPalestra||/manubri|pesi|bilancier|kettlebell/.test(t);
  const haSbarra=inPalestra||/sbarra|trazioni|pull/.test(t);
  const haBici=inPalestra||/bici|cyclette|spinning/.test(t);
  const haElastici=inPalestra||/elastic|band|loop/.test(t);
  const haTapis=inPalestra||/tapis|treadmill/.test(t);
  return ESERCIZI.filter(e=>e.att==="niente"||e.att==="sedia"
    ||(e.att==="manubri"&&haManubri)||(e.att==="sbarra"&&haSbarra)
    ||(e.att==="bici"&&haBici)||(e.att==="palestra"&&inPalestra)
    ||(e.att==="elastici"&&haElastici)||(e.att==="tapis"&&haTapis));}

/* ── IL TRAINER ──────────────────────────────────────────────────────
   Un programma settimanale che tiene insieme tre cose che di solito
   viaggiano separate: i gusti (dichiarati nel racconto), il deficit in
   corso (allenarsi tanto mangiando poco non funziona) e il recupero
   reale (sonno e stress degli ultimi giorni). */
function trainerCardHTML(){
  const t=S.train||{};
  const prog=Array.isArray(t.piano)?t.piano:[];
  let h=`<div class="gsec">${tr("Il tuo programma")}</div>`;
  /* La domanda giusta prima del programma: cosa possiedi davvero.
     Ogni chip aggiunge o toglie una parola da S.train.attrezzi — lo
     stesso testo libero che l'onboarding già scrive, così le due
     strade convivono e il filtro resta uno solo. */
  const ATTR=[["manubri",tr("Manubri o pesi")],["elastici",tr("Elastici")],
    ["sbarra",tr("Sbarra per trazioni")],["palestra",tr("Palestra coi macchinari")],
    ["tapis roulant",tr("Tapis roulant")],["bici",tr("Cyclette o bici")]];
  const attrTxt=()=>((S.train&&S.train.attrezzi)||"").toLowerCase();
  h+=`<div class="card"><h2>${tr("Cosa hai a disposizione?")}</h2>
    <div class="hint">${tr("A corpo libero funziona sempre. Il resto si aggiunge qui, e il programma cambia da solo.")}</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">${
      ATTR.map(([tok,lab])=>`<button class="chipbtn${attrTxt().includes(tok.split(" ")[0])?" on":""}" onclick="attrChip('${tok}')">${lab}</button>`).join("")
    }</div></div>`;
  h+=`<div class="card"><h2>${tr("Programma della settimana")}</h2>`;
  if(!t.ama&&!t.dove){
    /* Vicolo cieco, prima: una riga che diceva «vai altrove» e nessun modo
       di farlo da qui. Ora si risponde sul posto, in due tocchi. */
    h+=`<div class="hint">${tr("Dimmi che sport ti piacciono e dove ti alleni: senza quello proporrei attività a caso.")}</div>
    <div class="mtools"><button class="btn ghost small" onclick="trainerChiedi()">${tr("Dimmelo adesso")}</button></div>`;}
  else{
    h+=`<div class="hint">${tr("Costruito su quello che ti piace")}${t.ama?": <b>"+esc(t.ama)+"</b>":""}${t.odia?" — "+tr("mai")+" <b>"+esc(t.odia)+"</b>":""}.</div>`;
    if(prog.length){
      h+=`<div style="margin-top:12px">${prog.map((x,i)=>sedutaHTML(x,i)).join("")}</div>`;
      if(t.notaPiano)h+=`<div class="hint" style="margin-top:12px">${esc(t.notaPiano)}</div>`;}
    else h+=`<div class="hint" style="margin-top:8px">${tr("Te lo costruisco in un tocco.")}</div>`;
    if(aiOn())h+=`<div class="mtools"><button class="btn small" onclick="trainerAI()">${prog.length?tr("Rifai il programma"):tr("Costruisci il programma")}</button></div>
      <div class="aibox" aria-live="polite" id="trainerOut" style="display:none"></div>`;
    else h+=`<div class="hint" style="margin-top:8px">${tr("Serve la chiave AI per costruirlo.")}</div>`;}
  return h+`</div>`;}

/* Le due domande che servono al trainer, chieste dove serve: qui. Chi
   risponde si ritrova il programma pronto senza cercare il Profilo. */
window.trainerChiedi=async()=>{
  const t=S.train=S.train||{};
  const ama=await dlgPrompt(tr("Quali sport ti piacciono? Scrivili come ti vengono."),t.ama||"");
  if(ama===null)return;
  t.ama=ama.slice(0,200);
  const dove=await dlgPrompt(tr("E dove ti alleni? (casa, palestra, all'aperto, piscina…)"),t.dove||"");
  if(dove!==null)t.dove=dove.slice(0,200);
  save();render(cur);
  if(aiOn()&&(t.ama||t.dove)){
    if(await dlgConfirm(tr("Ho quello che mi serve. Ti costruisco il programma della settimana adesso?")))
      try{await trainerAI();}catch(e){}}};

/* Registrare un allenamento del programma: un tocco, senza riscrivere. */
window.trainerFatto=(i)=>{
  const t=S.train||{},x=(t.piano||[])[i];
  if(!x)return;
  const di=Math.max(0,viewIdx());
  const d=S.week.days[di];if(!d)return;
  d.workouts=d.workouts||[];
  d.workouts.push({t:x.tipo||"Allenamento",m:+x.minuti||30,i:x.intensita||"media"});
  save();render(cur);
  toast(tr("Allenamento registrato"));};

/* Le sedute di forza si compongono QUI, non le inventa l'AI: gli esercizi
   escono dalla libreria, con serie e ripetizioni tarate sul livello e sul
   tempo disponibile. All'AI resta il mestiere che sa fare — scegliere il
   mix giusto per questa settimana e spiegare il perché. */
function sedutaForza(minuti,livello,gruppi){
  const disp=esDisponibili();
  const scala={base:0,medio:1,alto:2};
  const ok=disp.filter(e=>scala[e.lv]<=scala[livello||"base"]&&e.g!=="cardio");
  const scelti=[];
  const FAMIGLIA={gambe:["gambe","glutei","posteriori","polpacci"],
    core:["core","addominali","paravertebrali"],
    schiena:["dorso","paravertebrali"],
    collo:["collo"]};
  (gruppi&&gruppi.length?gruppi:["gambe","petto","dorso","core","addominali","collo"]).forEach(g=>{
    const fam=FAMIGLIA[g]||[g];
    const c=ok.filter(e=>fam.includes(e.g));
    if(c.length)scelti.push(c[Math.floor(Math.random()*c.length)]);});
  /* il tempo comanda: 5' di riscaldamento, 5' di stretching, il resto in
     esercizi da ~4 minuti l'uno (serie + recupero) */
  const utili=Math.max(10,(+minuti||40)-10);
  const quanti=Math.max(2,Math.min(scelti.length,Math.floor(utili/4)));
  /* LA PROGRESSIONE: ogni 2 sedute completate, una ripetizione in più
     (fino a +4). Piccola apposta: la costanza si premia col carico che
     sale piano, non con salti che feriscono. A +4 l'app suggerisce di
     salire di livello e il conteggio riparte. */
  const extra=progressioneBonus();
  return scelti.slice(0,quanti).map(e=>({k:e.k,s:e.s,r:e.r+(e.g==="cardio"?0:extra)}));}

function progressioneBonus(){
  return Math.min(4,Math.floor(((S.train&&S.train.fatte)||0)/2));}
window.progressioneBonus=progressioneBonus;

/* Accettare una seduta significa metterla in conto: entra fra gli
   allenamenti del giorno e da lì nel deficit, come qualsiasi altro. */
window.attrChip=(tok)=>{
  S.train=S.train||{};
  const base=tok.split(" ")[0];
  const cur=(S.train.attrezzi||"").split(/\s*,\s*/).filter(Boolean);
  const gia=cur.some(x=>x.toLowerCase().includes(base));
  S.train.attrezzi=(gia?cur.filter(x=>!x.toLowerCase().includes(base)):cur.concat([tok])).join(", ");
  save();render(cur);};
window.sedutaAccetta=(i)=>{
  const t=S.train||{},x=(t.piano||[])[i];
  if(!x)return;
  const di=Math.max(0,viewIdx());
  const d=S.week.days[di];if(!d)return;
  d.workouts=d.workouts||[];
  d.workouts.push({sport:x.sport||x.tipo||"Allenamento",min:+x.minuti||30,int:x.intensita||"media",w:S.profile.w});
  if((x.tipo||x.sport||"").toLowerCase().includes("forza")){
    S.train.fatte=((S.train.fatte)||0)+1;
    if(progressioneBonus()===4&&S.train.fatte%2===0&&(S.train.livello||"base")!=="alto"){
      toast(tr("Otto sedute con ripetizioni in più: forse è ora di salire di livello, da Io → Allenamento."));}}
  x.fatto=1;save();render(cur);
  toast(tr("Allenamento messo in conto: entra nel deficit di oggi."));};

window.trainerAI=async()=>{
  if(!aiOn())return aiFail(new Error("nokey"));
  const box=document.getElementById("trainerOut");
  if(box){box.style.display="block";genBoxMostra(box);box.textContent=tr("Costruisco la settimana…");}
  try{
    const t=S.train||{};
    /* il recupero degli ultimi giorni: allenarsi sopra la fatica non allena */
    const gg=((S.week&&S.week.days)||[]).filter(d=>d&&(d.sleep||d.stress));
    const media=(k)=>gg.length?Math.round(gg.reduce((s,d)=>s+(+d[k]||0),0)/gg.length*10)/10:null;
    const sonno=media("sleep"),stress=media("stress");
    const inf=(S.phys&&S.phys.inj)?" È INFORTUNATO: niente carichi sulla parte interessata, proponi alternative.":"";
    const mal=(S.phys&&S.phys.ill)?" È MALATO: riposo, al massimo camminate leggere.":"";
    const tempo=(S.train&&S.train.minuti)||45;
    const liv=(S.train&&S.train.livello)||"base";
    const j=await aiAskJSON("Costruisci il mio programma di allenamento per questa settimana."+
      trh(" Ho circa {v1} minuti a sessione e il mio livello è {v2}.",{v1:tempo,v2:liv})+
      " Oltre agli sport che già faccio, PROPONI sedute complementari utili al mio obiettivo:"+
      " forza a corpo libero o con manubri per la massa muscolare, e cardio leggero (camminata o corsa) per il piacere e il recupero."+
      " Per le sedute di forza usa tipo=\"forza\" e indica i gruppi muscolari in \"gruppi\" (fra: gambe, petto, dorso, spalle, core):"+
      " gli esercizi li scelgo io dalla mia libreria, tu scegli il mix e il perché."+
      " Gruppi disponibili: gambe, petto, dorso, spalle, braccia, core, addominali, paravertebrali (lombari), collo."+
      " Metti sempre almeno un lavoro per la schiena o il core, e se passo molte ore seduto anche il collo."+
      trainForAI()+
      " Obiettivo alimentare: "+(S.profile.goal||"dimagrire")+", con un deficit calorico in corso."+
      (sonno!=null?" Media sonno ultimi giorni: "+sonno+"/5.":"")+
      (stress!=null?" Media stress: "+stress+"/5.":"")+inf+mal+
      " REGOLE: usa SOLO gli sport che ama o che ha a disposizione; mai quelli che ha escluso; "+
      "se sonno basso o stress alto riduci volume e intensità e dillo; con un deficit in corso non proporre volumi da atleta; "+
      "metti almeno un giorno di riposo vero. "+
      'Rispondi SOLO JSON: {"settimana":[{"giorno":"Lunedì","tipo":"forza|cardio|sport","sport":"nome se è uno sport tuo","minuti":0,"intensita":"leggera|media|alta","gruppi":[],"nota":""}],"nota":"una riga sul perché di questa settimana"}',"trainer");
    const arr=(j&&Array.isArray(j.settimana))?j.settimana:[];
    if(!arr.length)throw new Error("Non sono riuscito a costruire il programma");
    S.train=S.train||{};
    /* le sedute di forza ricevono qui gli esercizi veri, dalla libreria */
    S.train.piano=arr.slice(0,7).map(x=>{
      if(String(x.tipo||"").toLowerCase().indexOf("forza")>=0)
        x.esercizi=sedutaForza(x.minuti,liv,x.gruppi);
      return x;});
    S.train.notaPiano=(j.nota||"").slice(0,240);
    save();render("sport");
    toast(tr("Programma pronto"));
  }catch(e){box.textContent="";aiFail(e);}};


/* La seduta a schermo: cosa fare, quante volte, e la figura che mostra
   il movimento. Riscaldamento e stretching non sono un di più: aprono e
   chiudono ogni seduta di forza. */
/* Collo e schiena stanno sempre: sono i due che si irrigidiscono anche
   quando non li alleni. Il resto segue i gruppi della seduta. */
function stretchPer(gruppi){
  const g=(gruppi||[]).filter(Boolean);
  const vicini={gambe:["gambe","anche"],glutei:["gambe","anche"],posteriori:["posteriori"],
    polpacci:["polpacci"],petto:["petto"],dorso:["dorso"],spalle:["petto","collo"],
    braccia:["petto"],core:["paravertebrali"],addominali:["paravertebrali"],
    obliqui:["paravertebrali"],paravertebrali:["paravertebrali"],collo:["collo"]};
  const voluti=new Set(["collo","dorso"]);
  g.forEach(x=>(vicini[x]||[]).forEach(v=>voluti.add(v)));
  const out=STRETCH.filter(e=>voluti.has(e.g));
  return out.length?out.slice(0,5):STRETCH.slice(0,4);}
function sedutaHTML(x,i){
  const forza=Array.isArray(x.esercizi)&&x.esercizi.length;
  let h=`<div class="hint" style="border-left:4px solid ${x.fatto?"var(--linea)":"var(--salvia)"};padding-left:12px;margin-top:12px">
    <b>${esc(x.giorno||"")}</b> — ${esc(x.sport||x.tipo||"")} · ${esc(String(x.minuti||""))} min · ${esc(x.intensita||"")}
    ${x.nota?"<br>"+esc(x.nota):""}`;
  if(forza){
    h+=`<div class="hint" style="margin-top:8px"><b>${tr("Riscaldamento")}</b> · ${tr("5 minuti")}: ${RISCALDA.map(r=>esc(tr(r[0]))+" ("+esc(tr(r[1]))+")").join(" · ")}</div>`;
    h+=`<div class="esgrid">${x.esercizi.map(e=>{
      const E=esTrova(e.k);if(!E)return "";
      const dose=(E.g==="core"&&E.r>=20)?(e.s+"×"+e.r+" "+tr("secondi")):(e.s+"×"+e.r);
      return `<div class="escard">
        <div class="esfig">${esFigura(E.p,84)}</div>
        <div class="esnome">${esc(tr(E.n))}</div>
        <div class="esdose">${dose} · ${esc(tr(E.g))}</div>
        <div class="escome">${esc(tr(E.come))}</div>${E.err?`<div class="eserr">⚠ ${esc(tr(E.err))}</div>`:""}
      </div>`;}).join("")}</div>`;
    /* Lo stretching non è una lista di nomi: sono posizioni, con la loro
       figura e i secondi. Si sceglie ciò che serve ai gruppi allenati,
       più collo e schiena che ne hanno sempre bisogno. */
    const gruppi=x.esercizi.map(e=>(esTrova(e.k)||{}).g);
    const str=stretchPer(gruppi);
    h+=`<div class="hint" style="margin-top:8px"><b>${tr("Stretching")}</b> · ${tr("5 minuti")}</div>
      <div class="esgrid">${str.map(e=>`<div class="escard">
        <div class="esfig">${esFigura(e.p,84)}</div>
        <div class="esnome">${esc(tr(e.n))}</div>
        <div class="esdose">${e.sec} ${tr("secondi")}${/collo|petto|gambe|posteriori|polpacci|anche/.test(e.g)?" · "+tr("per lato"):""}</div>
        <div class="escome">${esc(tr(e.come))}</div>${e.err?`<div class="eserr">⚠ ${esc(tr(e.err))}</div>`:""}</div>`).join("")}</div>`;}
  h+=`<div class="mtools" style="margin-top:8px">
    ${x.fatto?`<span class="hint">${tr("Messo in conto ✓")}</span>`
      :`<button class="btn small" onclick="sedutaAccetta(${i})">${tr("Accetto: mettilo in conto")}</button>
        <button class="btn ghost small" onclick="sedutaSalta(${i})">${tr("Non questa")}</button>`}
  </div></div>`;
  return h;}
window.sedutaSalta=(i)=>{
  const t=S.train||{};if(!t.piano||!t.piano[i])return;
  t.piano.splice(i,1);save();render(cur);
  toast(tr("Tolta dal programma."));};
