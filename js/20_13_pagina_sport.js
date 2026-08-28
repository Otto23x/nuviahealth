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
  h+=facileHTML();
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
  /* Le schede partner stanno in FONDO, e solo qui: chi è arrivato a
     leggere il totale della settimana ha un bisogno vero — un posto
     dove allenarsi, o l'attrezzo che gli manca. In cima sarebbe una
     vetrina; qui è una risposta (27/08). */
  if(typeof partnerBlocco==="function")h+=partnerBlocco("allenamento",tr("Dove allenarsi"));
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



/* ── I TRENTA DI NUVIA ────────────────────────────────────────────
   Il catalogo era di 104 esercizi su 37 pose disegnate a mano, e la
   sproporzione si vedeva: `aperto_chiuso` serviva NOVE gesti diversi
   — jumping jack, adduttori, pectoral machine, monster walk, skater —
   con lo stesso disegno. Contenuto riusato: chi guarda se ne accorge.

   Adesso sono TRENTA, uno per gruppo muscolare, tutti di livello base
   e fattibili in casa con due manubri e un elastico. Ognuno ha la SUA
   illustrazione, il suo MET per le calorie, la sua dose per tre
   livelli e — la parte che serve davvero al trainer — il MODO in cui
   cresce, che non è lo stesso per tutti.

   Quattro sezioni, nell'ordine in cui si fa una seduta:
   riscaldamento (4) → cardio (1) → forza (19) → stretching (6).   */
const ESERCIZI=[
 {k:"crunch_su",n:"Crunch",en:"Crunch",g:"addominali",mus:"Addominali alti",musEn:"Upper abs",sez:"forza",met:3.0,tipo:"rip",prog:"ripetizioni",
  dose:{base:[2,12],medio:[3,15],alto:[3,20]},
  scopo:"La parte alta degli addominali.",
  come:"Solleva solo le spalle, la lombare resta a terra. Non è un sit-up: il busto non arriva dritto.",scopoEn:"The upper abs.",comeEn:"Lift only your shoulders — your lower back stays on the floor. This isn't a sit-up: your torso never comes all the way up."},
 {k:"diagonale_supino",n:"Dead bug",en:"Dead bug",g:"addominali",mus:"Addominali bassi",musEn:"Lower abs",sez:"forza",met:3.0,tipo:"rip",prog:"ripetizioni",
  dose:{base:[2,8],medio:[3,10],alto:[3,12]},
  scopo:"La parte bassa degli addominali, con la schiena protetta — al contrario delle gambe tese, che la fanno inarcare.",
  come:"Supino, allunga braccio e gamba opposti tenendo la schiena incollata a terra.",scopoEn:"The lower abs, with your back protected — unlike straight-leg raises, which arch it.",comeEn:"Lying face up, extend the opposite arm and leg while keeping your back glued to the floor."},
 {k:"lato_tieni",n:"Plank laterale",en:"Side plank",g:"core",mus:"Obliqui",musEn:"Obliques",sez:"forza",met:3.0,tipo:"sec",prog:"tempo",
  dose:{base:[2,15],medio:[3,20],alto:[3,30]},
  scopo:"I fianchi, che nessun altro esercizio della lista tocca.",
  come:"Su un gomito, all'inizio col ginocchio a terra, bacino alto. Se il fianco cede verso il basso, fermati.",scopoEn:"Your sides, which nothing else on this list reaches.",comeEn:"On one elbow, knee down at first, hips high. If your hip sags towards the floor, stop."},
 {k:"panca_su",n:"Distensioni a terra",en:"Floor press",g:"petto",mus:"Pettorali, tricipiti",musEn:"Chest, triceps",sez:"forza",met:4.0,tipo:"rip",prog:"peso",
  dose:{base:[2,8],medio:[3,10],alto:[3,12]},
  scopo:"Petto e spalle. A terra invece che su una panca: i gomiti si fermano da soli e non puoi scendere troppo.",
  come:"Sdraiato, ginocchia piegate, spingi i manubri in alto dal petto senza bloccare i gomiti.",scopoEn:"Chest and shoulders. On the floor rather than a bench: your elbows stop themselves, so you can't go too low.",comeEn:"Lying down, knees bent, press the dumbbells up from your chest without locking your elbows."},
 {k:"braccia_lato",n:"Alzate laterali",en:"Lateral raise",g:"spalle",mus:"Deltoidi",musEn:"Deltoids",sez:"forza",met:3.5,tipo:"rip",prog:"peso",
  dose:{base:[2,10],medio:[3,12],alto:[3,15]},
  scopo:"La parte esterna della spalla, quella che dà la linea.",
  come:"Braccia leggermente piegate, sali fino all'altezza delle spalle e non oltre: più su lavora il trapezio.",scopoEn:"The outer shoulder — the part that gives the line.",comeEn:"Arms slightly bent, raise to shoulder height and no further: higher up, the traps take over."},
 {k:"braccia_indietro",n:"Rematore a un braccio",en:"One-arm row",g:"dorso",mus:"Dorsali, bicipiti",musEn:"Lats, biceps",sez:"forza",met:4.5,tipo:"rip",prog:"peso",
  dose:{base:[2,10],medio:[3,12],alto:[3,12]},
  scopo:"La schiena, cioè il muscolo che ti tiene dritto.",
  come:"Mano e ginocchio appoggiati, schiena piatta, tira il manubrio al fianco col gomito radente. L'appoggio toglie il carico dalla lombare.",scopoEn:"Your back — the muscle that keeps you upright.",comeEn:"Hand and knee on a support, back flat, pull the dumbbell to your side with the elbow grazing your body. The support takes the load off your lower back."},
 {k:"spalle_su",n:"Scrollate",en:"Shrugs",g:"trapezio",mus:"Trapezio",musEn:"Trapezius",sez:"forza",met:3.0,tipo:"rip",prog:"peso",
  dose:{base:[2,12],medio:[3,15],alto:[3,15]},
  scopo:"Il trapezio: il muscolo che si irrigidisce quando sei teso.",
  come:"Manubri lungo i fianchi, alza le spalle verso le orecchie, tieni un secondo, scendi. Solo su e giù, mai rotazioni.",scopoEn:"The traps: the muscle that tightens up when you're tense.",comeEn:"Dumbbells at your sides, lift your shoulders towards your ears, hold a second, lower. Straight up and down, never rolling."},
 {k:"diagonale",n:"Bird dog",en:"Bird dog",g:"paravertebrali",mus:"Paravertebrali, glutei",musEn:"Spinal erectors, glutes",sez:"forza",met:3.0,tipo:"rip",prog:"ripetizioni",
  dose:{base:[2,8],medio:[3,10],alto:[3,12]},
  scopo:"I muscoli lungo la colonna, e la capacità di restare fermi mentre qualcosa si muove.",
  come:"A quattro zampe, allunga braccio e gamba opposti senza far ruotare il bacino: come se avessi un bicchiere pieno sulla schiena.",scopoEn:"The muscles along your spine, and the knack of staying still while something moves.",comeEn:"On all fours, extend the opposite arm and leg without letting your hips rotate: as if you had a full glass balanced on your back."},
 {k:"avambraccio_su",n:"Curl",en:"Biceps curl",g:"braccia",mus:"Bicipiti",musEn:"Biceps",sez:"forza",met:3.5,tipo:"rip",prog:"peso",
  dose:{base:[2,10],medio:[3,12],alto:[3,12]},
  scopo:"I bicipiti, davanti al braccio.",
  come:"Gomiti fermi ai fianchi, sali fino alla spalla, scendi controllando. Se i gomiti si muovono, il peso è troppo.",scopoEn:"The biceps, at the front of the arm.",comeEn:"Elbows fixed at your sides, curl up to the shoulder, lower under control. If your elbows move, the weight is too heavy."},
 {k:"avambraccio_giu",n:"Estensioni per tricipiti",en:"Triceps pushdown",g:"braccia",mus:"Tricipiti",musEn:"Triceps",sez:"forza",met:3.5,tipo:"rip",prog:"peso",
  dose:{base:[2,12],medio:[3,15],alto:[3,15]},
  scopo:"I tricipiti, dietro al braccio: sono i due terzi del braccio, anche se si guarda sempre l'altro terzo.",
  come:"Elastico ancorato in alto, gomiti ai fianchi, spingi le mani in basso. Si muove solo l'avambraccio.",scopoEn:"The triceps, behind the arm: they're two thirds of the arm, even if everyone looks at the other third.",comeEn:"Band anchored high, elbows at your sides, push your hands down. Only the forearm moves."},
 {k:"gambe_giu",n:"Goblet squat",en:"Goblet squat",g:"gambe",mus:"Quadricipiti, glutei",musEn:"Quadriceps, glutes",sez:"forza",met:5.0,tipo:"rip",prog:"peso",
  dose:{base:[2,10],medio:[3,12],alto:[4,12]},
  scopo:"Cosce e glutei: i muscoli che usi ogni volta che ti alzi da una sedia.",
  come:"Manubrio verticale contro il petto, scendi come per sederti, talloni a terra. Il peso davanti ti raddrizza la schiena da solo.",scopoEn:"Thighs and glutes: the muscles you use every time you get up from a chair.",comeEn:"Dumbbell held upright against your chest, sit back down, heels on the floor. The weight in front straightens your back for you."},
 {k:"tallone_calcio",n:"Curl femorale",en:"Standing leg curl",g:"posteriori",mus:"Femorali",musEn:"Hamstrings",sez:"forza",met:3.5,tipo:"rip",prog:"peso",
  dose:{base:[2,10],medio:[3,12],alto:[3,15]},
  scopo:"Dietro la coscia. Quasi nessuno li allena, e sono quelli che bilanciano i quadricipiti.",
  come:"In piedi, una mano su una sedia, elastico alla caviglia: porta il tallone verso il gluteo.",scopoEn:"The back of the thigh. Almost nobody trains these, and they're what balances the quads.",comeEn:"Standing, one hand on a chair, band at your ankle: bring your heel towards your glute."},
 {k:"bacino_su",n:"Ponte per glutei",en:"Glute bridge",g:"glutei",mus:"Glutei",musEn:"Glutes",sez:"forza",met:3.5,tipo:"rip",prog:"peso",
  dose:{base:[2,12],medio:[3,15],alto:[3,20]},
  scopo:"I glutei, che stando seduti tutto il giorno si spengono.",
  come:"Sdraiato, piedi a terra, spingi il bacino in alto stringendo i glutei. Spingi coi talloni, non inarcare la schiena.",scopoEn:"The glutes, which switch off when you sit all day.",comeEn:"Lying down, feet on the floor, drive your hips up squeezing your glutes. Push through the heels, don't arch your back."},
 {k:"ginocchia_strette",n:"Spinta fra le ginocchia",en:"Adductor squeeze",g:"gambe",mus:"Adduttori",musEn:"Adductors",sez:"forza",met:2.5,tipo:"sec",prog:"tempo",
  dose:{base:[2,15],medio:[3,20],alto:[3,30]},
  scopo:"La parte interna della coscia. È l'esercizio che si dà in fisioterapia: farsi male è quasi impossibile.",
  come:"Sdraiato, ginocchia piegate, stringi un cuscino fra le ginocchia e tieni.",scopoEn:"The inner thigh. This is the one they give you in physiotherapy: hurting yourself is nearly impossible.",comeEn:"Lying down, knees bent, squeeze a cushion between your knees and hold."},
 {k:"aperto_chiuso",n:"Monster walk",en:"Monster walk",g:"glutei",mus:"Abduttori, glutei",musEn:"Abductors, glutes",sez:"forza",met:3.5,tipo:"rip",prog:"peso",
  dose:{base:[2,10],medio:[3,12],alto:[3,16]},
  scopo:"La parte esterna dell'anca: è quella che tiene fermo il ginocchio quando cammini.",
  come:"Elastico sopra le ginocchia, mezzo squat, passi laterali. La tensione non deve mai mollare.",scopoEn:"The outer hip: it's what keeps your knee steady when you walk.",comeEn:"Band above the knees, half squat, step sideways. The tension must never go slack."},
 {k:"punte_su",n:"Polpacci",en:"Calf raise",g:"polpacci",mus:"Polpacci",musEn:"Calves",sez:"forza",met:3.0,tipo:"rip",prog:"peso",
  dose:{base:[2,15],medio:[3,20],alto:[3,25]},
  scopo:"I polpacci, che spingono a ogni singolo passo.",
  come:"In piedi, sali sulle punte lentamente e scendi ancora più lentamente. La discesa vale più della salita.",scopoEn:"The calves, which push off at every single step.",comeEn:"Standing, rise onto your toes slowly and come down even more slowly. The way down counts for more than the way up."},
 {k:"linea_tieni",n:"Plank",en:"Plank",g:"core",mus:"Centro del corpo",musEn:"Core",sez:"forza",met:3.0,tipo:"sec",prog:"tempo",
  dose:{base:[2,20],medio:[3,30],alto:[3,45]},
  scopo:"Tiene insieme tutto il centro. È anche la prova più semplice per accorgersi che stai migliorando.",
  come:"Gomiti sotto le spalle, corpo in linea dalla testa ai talloni. Il bacino né su né giù.",scopoEn:"Holds your whole middle together. It's also the simplest way to notice you're getting better.",comeEn:"Elbows under your shoulders, body in a line from head to heels. Hips neither up nor down."},
 {k:"cammina",n:"Camminata",en:"Walking",g:"cardio",mus:"Gambe, cuore",musEn:"Legs, heart",sez:"cardio",met:3.5,tipo:"min",prog:"variante",
  dose:{base:[0,20],medio:[0,30],alto:[0,40]},
  scopo:"Il modo di muoversi più semplice che esista, e l'unico che quasi tutti riescono a fare ogni giorno.",
  come:"Passo sostenuto: il fiato deve reggere una frase intera. Conta i minuti, non i passi.",scopoEn:"The simplest way of moving there is, and the only one almost everyone manages every day.",comeEn:"A brisk pace: your breath should still carry a full sentence. Count the minutes, not the steps.",var:[{n:"Camminata",en:"Walking",met:3.5},{n:"Camminata veloce",en:"Brisk walking",met:4.3},{n:"Corsa leggera",en:"Light jog",met:7.0},{n:"Corsa",en:"Running",met:9.8}]},
 {k:"braccia_viso",n:"Face pull",en:"Face pull",g:"spalle",mus:"Deltoidi posteriori, trapezio",musEn:"Rear delts, traps",sez:"forza",met:3.0,tipo:"rip",prog:"peso",
  dose:{base:[2,12],medio:[3,15],alto:[3,20]},
  scopo:"Riapre le spalle chiuse in avanti. Se stai molte ore alla scrivania, è quello che ti serve di più.",
  come:"Elastico ancorato in alto, tira verso il viso coi gomiti larghi e alti, stringendo le scapole.",scopoEn:"Reopens shoulders that have rounded forward. If you spend hours at a desk, this is the one you need most.",comeEn:"Band anchored high, pull towards your face with elbows wide and high, squeezing your shoulder blades."},
 {k:"gambe_avanti",n:"Affondo all'indietro",en:"Reverse lunge",g:"gambe",mus:"Quadricipiti, glutei",musEn:"Quadriceps, glutes",sez:"forza",met:4.0,tipo:"rip",prog:"peso",
  dose:{base:[2,8],medio:[3,10],alto:[3,12]},
  scopo:"Una gamba per volta, e con lei l'equilibrio — che conta quanto la forza.",
  come:"Passo indietro, scendi col ginocchio verso terra, risali spingendo col tallone davanti. Indietro è più gentile col ginocchio che avanti.",scopoEn:"One leg at a time, and with it your balance — which counts as much as strength.",comeEn:"Step back, lower your knee towards the floor, come up pushing through the front heel. Stepping back is kinder to the knee than stepping forward."},
 {k:"braccia_cerchio",n:"Cerchi con le braccia",en:"Arm circles",g:"riscaldamento",mus:"Spalle",musEn:"Shoulders",sez:"riscaldamento",met:2.8,tipo:"sec",prog:"tempo",
  dose:{base:[1,30],medio:[1,45],alto:[1,60]},
  scopo:"Scalda le spalle e scioglie le articolazioni prima di chiedergli qualcosa.",
  come:"Braccia aperte ai lati, cerchi lenti e larghi. Metà tempo avanti, metà indietro.",scopoEn:"Warms up the shoulders and frees the joints before you ask anything of them.",comeEn:"Arms out to the sides, slow wide circles. Half the time forwards, half backwards."},
 {k:"busto_ruota",n:"Rotazioni del busto",en:"Torso twists",g:"riscaldamento",mus:"Obliqui, colonna",musEn:"Obliques, spine",sez:"riscaldamento",met:2.8,tipo:"rip",prog:"ripetizioni",
  dose:{base:[1,12],medio:[2,16],alto:[2,20]},
  scopo:"Scioglie la schiena, che è la parte che protesta di più se parti a freddo.",
  come:"Seduto, ginocchia piegate e busto leggermente indietro: ruota le spalle da un lato all'altro. Lento, e senza peso.",scopoEn:"Frees up your back, the part that complains most if you start cold.",comeEn:"Seated, knees bent and torso leaning back a little: rotate your shoulders from side to side. Slow, and with no weight."},
 {k:"ginocchia_avanti",n:"Marcia sul posto",en:"Marching in place",g:"riscaldamento",mus:"Gambe, cuore",musEn:"Legs, heart",sez:"riscaldamento",met:3.5,tipo:"sec",prog:"tempo",
  dose:{base:[1,45],medio:[1,60],alto:[1,90]},
  scopo:"Alza il battito e scalda le gambe senza affaticarle.",
  come:"Cammina sul posto portando le ginocchia all'altezza dei fianchi, braccia che accompagnano.",scopoEn:"Raises your heart rate and warms your legs without tiring them.",comeEn:"March on the spot bringing your knees up to hip height, arms swinging along."},
 {k:"schiena_arco",n:"Gatto-cammello",en:"Cat-cow",g:"riscaldamento",mus:"Colonna",musEn:"Spine",sez:"riscaldamento",met:2.5,tipo:"rip",prog:"ripetizioni",
  dose:{base:[1,8],medio:[1,12],alto:[2,12]},
  scopo:"Sveglia la schiena una vertebra per volta. È il movimento che manca a chi sta seduto.",
  come:"A quattro zampe: inarca la schiena verso l'alto, poi lasciala scendere. Segui il respiro.",scopoEn:"Wakes your back up one vertebra at a time. It's the movement people who sit are missing.",comeEn:"On all fours: arch your back upwards, then let it sink. Follow your breath."},
 {k:"petto_apre",n:"Petto allo stipite",en:"Doorway chest stretch",g:"stretching",mus:"Pettorali",musEn:"Chest",sez:"stretching",met:2.3,tipo:"sec",prog:"tempo",
  dose:{base:[1,20],medio:[1,30],alto:[2,30]},
  scopo:"Riapre il petto che la scrivania chiude.",
  come:"Avambraccio contro lo stipite, ruota il busto dalla parte opposta.",scopoEn:"Reopens the chest that the desk closes.",comeEn:"Forearm against the door frame, rotate your torso the other way."},
 {k:"anca_avanti",n:"Flessori dell'anca",en:"Hip flexor stretch",g:"stretching",mus:"Flessori dell'anca",musEn:"Hip flexors",sez:"stretching",met:2.3,tipo:"sec",prog:"tempo",
  dose:{base:[1,20],medio:[1,30],alto:[2,30]},
  scopo:"La parte che si accorcia di più stando seduti, e che poi tira sulla lombare.",
  come:"In affondo basso, ginocchio dietro a terra: porta il bacino avanti stringendo i glutei.",scopoEn:"The part that shortens most from sitting, and then pulls on your lower back.",comeEn:"In a low lunge, back knee on the floor: bring your hips forward while squeezing your glutes."},
 {k:"busto_seduto",n:"Posteriori seduto",en:"Seated hamstring stretch",g:"stretching",mus:"Femorali",musEn:"Hamstrings",sez:"stretching",met:2.3,tipo:"sec",prog:"tempo",
  dose:{base:[1,20],medio:[1,30],alto:[2,30]},
  scopo:"Dietro la coscia, dove la rigidità si sente per prima.",
  come:"Seduto, una gamba tesa: scendi verso il piede con la schiena dritta, non curva.",scopoEn:"The back of the thigh, where stiffness shows up first.",comeEn:"Seated, one leg straight: reach towards the foot with a straight back, not a rounded one."},
 {k:"tallone_dietro",n:"Quadricipite in piedi",en:"Standing quad stretch",g:"stretching",mus:"Quadricipiti",musEn:"Quadriceps",sez:"stretching",met:2.3,tipo:"sec",prog:"tempo",
  dose:{base:[1,20],medio:[1,30],alto:[2,30]},
  scopo:"Davanti alla coscia, dopo squat e affondi.",
  come:"Tallone al gluteo, ginocchia vicine, bacino leggermente in avanti.",scopoEn:"The front of the thigh, after squats and lunges.",comeEn:"Heel to your glute, knees together, hips slightly forward."},
 {k:"ginocchia_petto",n:"Posizione del bambino",en:"Child's pose",g:"stretching",mus:"Lombare",musEn:"Lower back",sez:"stretching",met:2.3,tipo:"sec",prog:"tempo",
  dose:{base:[1,30],medio:[1,45],alto:[1,60]},
  scopo:"Scarica la zona lombare. È il più sicuro di tutti: non si sbaglia.",
  come:"In ginocchio, siediti sui talloni e allunga le braccia in avanti, fronte verso terra.",scopoEn:"Takes the load off your lower back. It's the safest of them all: you can't get it wrong.",comeEn:"Kneeling, sit back on your heels and stretch your arms forward, forehead towards the floor."},
 {k:"spalla_incrociata",n:"Spalla incrociata",en:"Cross-body shoulder stretch",g:"stretching",mus:"Deltoidi posteriori",musEn:"Rear delts",sez:"stretching",met:2.3,tipo:"sec",prog:"tempo",
  dose:{base:[1,20],medio:[1,30],alto:[2,30]},
  scopo:"La spalla e la parte alta della schiena, dopo aver spinto e tirato.",
  come:"Porta un braccio teso davanti al petto e accompagnalo con l'altro.",scopoEn:"The shoulder and upper back, after all the pushing and pulling.",comeEn:"Bring one straight arm across your chest and guide it with the other."}
];

/* ── LE FIGURE ────────────────────────────────────────────────────
   Non più tracciati vettoriali scritti a mano: trenta illustrazioni,
   una per esercizio, in `assets/esercizi/`. Il perché sta nella nota
   di consegna: trentasette pose disegnate a mano servivano 117 voci —
   nove esercizi diversi sullo stesso disegno — e si vedeva. Adesso
   ogni voce ha la SUA, e `t_esercizi_figure` verifica che sia vero.
   Il micro-movimento resta (le classi `mo-*`): si applica all'immagine
   invece che al gruppo di path, e chi chiede quiete lo ferma. */
function esFigura(k,sz){
  const e=(typeof k==="string")?esTrova(k):k;
  if(!e)return "";
  const l=sz||96;
  const m=(e.tipo==="sec")?"tieni":(e.tipo==="min")?"passo":"su";
  return '<img class="esfig mo-'+m+'" src="assets/esercizi/'+e.k+'.svg" alt="" '+
    'width="'+l+'" height="'+l+'" loading="lazy" decoding="async">';}
function esTrova(k){return ESERCIZI.find(e=>e.k===k)||null;}
window.esFigura=esFigura;window.esTrova=esTrova;

/* Il nome e i muscoli seguono la lingua scelta: sono DATI, non
   interfaccia, e per questo viaggiano nella voce invece che nel
   dizionario — come i piatti del piano. */
function esNome(e){return (LANG==="en"&&e.en)?e.en:e.n;}
function esMuscoli(e){return (LANG==="en"&&e.musEn)?e.musEn:e.mus;}
/* Anche le due descrizioni seguono la lingua. NON passano da tr(): sono
   contenuto, non interfaccia, e stanno dentro la voce come il nome. Un
   catalogo che si porta addosso la propria traduzione non può perderla
   per strada, e il dizionario resta quello delle frasi dell'app. */
function esScopo(e){return (LANG==="en"&&e.scopoEn)?e.scopoEn:(e.scopo||"");}
function esCome(e){return (LANG==="en"&&e.comeEn)?e.comeEn:(e.come||"");}
window.esNome=esNome;window.esMuscoli=esMuscoli;
window.esScopo=esScopo;window.esCome=esCome;

/* Riscaldamento e stretching non sono più due elenchi a parte: sono
   due sezioni dello stesso catalogo. Un posto solo da aggiornare. */
function esSez(s){return ESERCIZI.filter(e=>e.sez===s);}
const RISCALDA=esSez("riscaldamento");
const STRETCH=esSez("stretching");
window.RISCALDA=RISCALDA;window.STRETCH=STRETCH;window.esSez=esSez;

/* ── LA DOSE ──────────────────────────────────────────────────────
   Ogni esercizio porta la sua dose per tre livelli, e il MODO in cui
   cresce. Sono due cose diverse: la prima dice da dove si parte, la
   seconda cosa si tocca quando è ora di salire. */
/* ES_LIVELLI, non LIVELLI: nel monolite ogni `const` in cima a un modulo
   diventa un globale, e `LIVELLI` era già preso dal registro delle lingue.
   Si è visto subito — «Identifier already declared», e l'app che non parte —
   ma un nome generico è una trappola che si arma da sé: il prefisso la
   disinnesca prima che scatti. */
const ES_LIVELLI=["base","medio","alto"];
function esDose(e,liv){
  const d=(e.dose&&e.dose[ES_LIVELLI.includes(liv)?liv:"base"])||[2,10];
  return {serie:d[0],valore:d[1],tipo:e.tipo};}
window.esDose=esDose;

/* Come si scrive una dose a schermo: 3×12, 3×30s, 20 min. */
function doseTesto(e,liv){
  const d=esDose(e,liv);
  if(e.tipo==="min")return d.valore+" "+tr("min");
  if(e.tipo==="sec")return d.serie>1?(d.serie+"×"+d.valore+"s"):(d.valore+"s");
  return d.serie+"×"+d.valore;}
window.doseTesto=doseTesto;

/* ── LE KCAL DELLA SEDUTA ─────────────────────────────────────────
   Stessa formula degli sport (MET netto × peso × ore): il «meno 1» è
   il metabolismo a riposo, che nel fabbisogno è già contato. Qui il
   tempo non è dichiarato dalla persona ma si RICAVA dalla dose —
   tre secondi a ripetizione, il tempo scritto per gli isometrici, più
   il recupero fra le serie. Approssimato, e dichiarato tale. */
const SEC_RIP=3, REC_SERIE=60, REC_TENUTA=45;
function esMinuti(e,liv){
  const d=esDose(e,liv);
  if(e.tipo==="min")return d.valore;
  const lavoro=(e.tipo==="sec")?d.valore:(d.valore*SEC_RIP);
  const rec=(e.tipo==="sec")?REC_TENUTA:REC_SERIE;
  return Math.round((d.serie*lavoro+Math.max(0,d.serie-1)*rec)/60*10)/10;}
function esKcal(e,liv,peso){
  const p=(+peso>0)?+peso:(+((S.profile||{}).w)>0?+S.profile.w:70);
  return Math.round(Math.max(0,(e.met||3)-1)*p*(esMinuti(e,liv)/60));}
window.esMinuti=esMinuti;window.esKcal=esKcal;

/* La seduta intera: quanto dura e quanto costa. Il riscaldamento e lo
   stretching si contano — sono pochi minuti, ma sono minuti veri. */
function sedutaConto(chiavi,liv,peso){
  const l=(chiavi||[]).map(k=>esTrova(k)).filter(Boolean);
  return {min:Math.round(l.reduce((s,e)=>s+esMinuti(e,liv),0)),
          kcal:l.reduce((s,e)=>s+esKcal(e,liv,peso),0)};}
window.sedutaConto=sedutaConto;

/* ── QUANDO SALIRE, E DI QUANTO ───────────────────────────────────
   Quattro modi, uno per esercizio, dichiarati nella voce:
   · peso        → DOPPIA PROGRESSIONE: prima le ripetizioni fino in
                   cima, poi si aggiunge peso e si torna in fondo. È
                   così che la forza cresce senza serie infinite.
   · ripetizioni → dove aggiungere peso non ha senso (bird dog, crunch)
   · tempo       → gli isometrici e tutti gli allunghi
   · variante    → solo la camminata: si cambia esercizio, non si allunga
   Non si tocca mai più di una cosa alla volta.                      */
const TETTO={serie:5,rip:25,sec:60};
function esProssima(e,liv){
  const d=esDose(e,liv);
  if(e.prog==="variante")return {cosa:"variante"};   /* il motore non parla nessuna lingua */
  if(e.tipo==="sec"){
    if(d.valore<TETTO.sec)return {cosa:"tempo",valore:Math.min(TETTO.sec,d.valore+10)};
    if(d.serie<TETTO.serie)return {cosa:"serie",valore:d.serie+1};
    return null;}
  if(d.valore<TETTO.rip)return {cosa:"ripetizioni",valore:Math.min(TETTO.rip,d.valore+2)};
  if(e.prog==="peso")return {cosa:"peso",valore:d.serie};   /* si torna in fondo */
  if(d.serie<TETTO.serie)return {cosa:"serie",valore:d.serie+1};
  return null;}
window.esProssima=esProssima;

/* ── «QUESTO È DIVENTATO FACILE?» ─────────────────────────────────
   Si chiede a un esercizio per volta, dopo SEI volte alla stessa
   dose, e mai a chi ha un rapporto difficile col cibo: suggerire
   volume a chi mangia per compensare trasforma il movimento in
   penitenza. È la regola che viene prima di tutte le altre.
   Se la risposta è no, non si richiede per altre sei volte: una
   domanda si risponde, un questionario si chiude.                  */
const VOLTE_PRIMA_DI_CHIEDERE=6;
function esStato(){const t=S.train=S.train||{};
  if(!t.dose||typeof t.dose!=="object")t.dose={};return t.dose;}
function esFatto(k){const D=esStato();const r=D[k]||(D[k]={volte:0});
  r.volte=(r.volte|0)+1;save();return r;}
window.esFatto=esFatto;
function esDaChiedere(){
  try{if(typeof profiloDelicato==="function"&&profiloDelicato())return null;}catch(e){}
  const liv=(S.train&&S.train.livello)||"base";
  const D=esStato();
  for(const k of Object.keys(D)){
    const r=D[k],e=esTrova(k);
    if(!e||(r.volte|0)<VOLTE_PRIMA_DI_CHIEDERE)continue;
    if(!esProssima(e,liv))continue;              /* è già al tetto: non si chiede */
    return e;}
  return null;}
window.esDaChiedere=esDaChiedere;
window.esRisposta=(k,facile)=>{
  const D=esStato(),r=D[k]||(D[k]={volte:0});
  r.volte=0;                                     /* il conto riparte in ogni caso */
  if(facile)r.su=(r.su|0)+1;                     /* quante volte è già salito */
  save();try{render(cur);}catch(e){}};

/* ── COSA PUÒ FARE ────────────────────────────────────────────────
   Il filtro per attrezzatura non c'è più, ed è una decisione del
   founder: si dà per scontato che chi usa Nuvia abbia due manubri e
   un elastico, o possa comprarli con poco. Trenta esercizi scelti per
   essere fattibili così — niente panche, niente macchinari, niente
   sbarra. La funzione resta perché la chiama il trainer, e perché il
   giorno in cui servisse un filtro il posto è questo. */
function esDisponibili(){return esSez("forza");}
window.esDisponibili=esDisponibili;

/* ── IL TRAINER ──────────────────────────────────────────────────────
   Un programma settimanale che tiene insieme tre cose che di solito
   viaggiano separate: i gusti (dichiarati nel racconto), il deficit in
   corso (allenarsi tanto mangiando poco non funziona) e il recupero
   reale (sonno e stress degli ultimi giorni). */
/* ── «QUESTO È DIVENTATO FACILE?» ─────────────────────────────────
   Una domanda, un esercizio, e solo dopo sei volte alla stessa dose.
   È la sola cosa che l'app non può dedurre da sola: «facile» lo sa
   soltanto chi l'ha fatto. Il NO vale quanto il sì — riazzera il conto
   e non si richiede per altre sei volte. Un questionario si chiude,
   a una domanda si risponde. */
function facileHTML(){
  const e=esDaChiedere();if(!e)return "";
  const liv=(S.train&&S.train.livello)||"base";
  const p=esProssima(e,liv);if(!p)return "";
  /* Frasi INTERE, una per tipo di aumento, non un pezzo da incastrare.
     In italiano «la prossima volta metto {x}» reggeva con tutti e cinque;
     in inglese no — «I\u2019ll add the next step up» non si dice. Una frase
     tagliata a metà si ricompone storta appena cambia la lingua. */
  const FRASE={
    ripetizioni:tr("Se sì, la prossima volta metto qualche ripetizione in più."),
    serie:tr("Se sì, la prossima volta aggiungo una serie."),
    tempo:tr("Se sì, la prossima volta tengo qualche secondo in più."),
    peso:tr("Se sì, la prossima volta metto un po' di peso."),
    variante:tr("Se sì, la prossima volta si passa al gradino dopo.")};
  return `<div class="card" data-facile="${esc(e.k)}"><h2>${tr("Una domanda sola")}</h2>
    <div class="hint">${trh("Hai fatto <b>{v1}</b> sei volte alla stessa dose ({v2}). È diventato facile?",
      {v1:esc(esNome(e)),v2:esc(doseTesto(e,liv))})}</div>
    <div class="hint" style="margin-top:8px">${FRASE[p.cosa]||tr("Se sì, la prossima volta si sale un po'.")}</div>
    <div class="mtools">
      <button class="btn small" type="button" onclick="esRisposta('${esc(e.k)}',true)">${tr("Sì, è facile")}</button>
      <button class="btn ghost small" type="button" onclick="esRisposta('${esc(e.k)}',false)">${tr("No, va bene così")}</button>
    </div></div>`;}
window.facileHTML=facileHTML;

function trainerCardHTML(){
  const t=S.train||{};
  const prog=Array.isArray(t.piano)?t.piano:[];
  let h=`<div class="gsec">${tr("Il tuo programma")}</div>`;
  /* La domanda giusta prima del programma: cosa possiedi davvero.
     Ogni chip aggiunge o toglie una parola da S.train.attrezzi — lo
     stesso testo libero che l'onboarding già scrive, così le due
     strade convivono e la risposta resta una sola.
     COSA NE FA, dalla v13.92: non filtra più gli esercizi di forza —
     i trenta si fanno tutti in casa, quindi non c'è niente da filtrare —
     ma va al personal trainer AI, che su quello sceglie il cardio, le
     macchine e gli sport. La frase sotto lo dice: una domanda deve
     promettere solo quello che poi succede. */
  const ATTR=[["manubri",tr("Manubri o pesi")],["elastici",tr("Elastici")],
    ["sbarra",tr("Sbarra per trazioni")],["palestra",tr("Palestra coi macchinari")],
    ["tapis roulant",tr("Tapis roulant")],["bici",tr("Cyclette o bici")]];
  const attrTxt=()=>((S.train&&S.train.attrezzi)||"").toLowerCase();
  h+=`<div class="card"><h2>${tr("Cosa hai a disposizione?")}</h2>
    <div class="hint">${tr("Gli esercizi di forza si fanno a corpo libero, con due manubri o un elastico: quelli funzionano sempre. Quello che segni qui serve al cardio e agli sport.")}</div>
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
/* L'attività dichiarata nel percorso, tradotta in un numero di
   sedute che il programma NON può superare. */
function allenamentiRiga(){
  const a=(S.onb2&&S.onb2.ris&&S.onb2.ris.attivita)||"";
  const mappa={fermo:"al massimo 1",poco:"al massimo 1",leggero:"1 o 2",
               regolare:"3 o 4",intenso:"5"};
  const n=mappa[a];
  if(!n)return "";
  return " Faccio "+n+" allenamenti a settimana: NON programmarne di più — è un limite, non un punto di partenza.";}

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
  const ok=esDisponibili();
  const liv=ES_LIVELLI.includes(livello)?livello:"base";
  const scelti=[];
  /* Un esercizio per gruppo, e i gruppi larghi tengono dentro i loro
     parenti: chiedere «gambe» deve poter dare anche i glutei o i
     polpacci, perché il trainer ragiona per zone, non per muscoli. */
  const FAMIGLIA={gambe:["gambe","glutei","posteriori","polpacci"],
    core:["core","addominali","paravertebrali"],
    schiena:["dorso","paravertebrali","trapezio"],
    spalle:["spalle","trapezio"]};
  (gruppi&&gruppi.length?gruppi:["gambe","petto","dorso","spalle","core","addominali"]).forEach(g=>{
    const fam=FAMIGLIA[g]||[g];
    const c=ok.filter(e=>fam.includes(e.g)&&!scelti.some(x=>x.k===e.k));
    if(c.length)scelti.push(c[Math.floor(Math.random()*c.length)]);});
  /* Il tempo comanda, e adesso si sa quanto dura ogni esercizio davvero:
     lo dice `esMinuti` dalla dose, invece dei «quattro minuti l'uno»
     stimati a occhio di prima. Si tolgono i minuti di riscaldamento e
     stretching, che sono nella seduta ma non sono forza. */
  const fissi=RISCALDA.concat(STRETCH).reduce((a,e)=>a+esMinuti(e,liv),0);
  let resta=Math.max(6,(+minuti||40)-fissi), fuori=[];
  const metti=(e)=>{fuori.push({k:e.k,serie:esDose(e,liv).serie,valore:esDose(e,liv).valore,tipo:e.tipo});
    resta-=esMinuti(e,liv);};
  for(const e of scelti){ if(fuori.length&&esMinuti(e,liv)>resta)break; metti(e); }
  /* ── SI RIEMPIE IL TEMPO CHE RESTA ──────────────────────────────
     Alla prima stesura una seduta da 45 minuti ne riempiva DIECI: si
     prendeva un esercizio per gruppo richiesto e ci si fermava, con
     trentacinque minuti vuoti. Alle dosi del livello base un esercizio
     dura due minuti, quindi «un esercizio per gruppo» non basta mai.
     Adesso, finito l'elenco chiesto, si continua con gli altri gruppi
     — mai due volte lo stesso — finché il tempo c'è. Il tetto di otto
     è di buon senso: oltre, una seduta smette di essere una seduta. */
  const TETTO_ES=8;
  const restanti=ok.filter(e=>!fuori.some(x=>x.k===e.k)
                             &&!fuori.some(x=>(esTrova(x.k)||{}).g===e.g));
  for(const e of restanti){
    if(fuori.length>=TETTO_ES||esMinuti(e,liv)>resta)break;
    metti(e);}
  return fuori;}

/* La progressione automatica NON C'È PIÙ, ed è una scelta del founder.
   Prima l'app aggiungeva una ripetizione ogni due sedute, fino a +4,
   senza chiedere niente: una scala che sale da sola addosso a chi la
   sta usando. Adesso l'app CHIEDE — «questo è diventato facile?» —
   dopo sei volte alla stessa dose, un esercizio per volta, e sale solo
   se la risposta è sì. Vedi `esDaChiedere` e `esProssima` sopra.
   `progressioneBonus` resta come zero perché due collaudi la citano e
   perché dichiarare una scelta vale più che cancellarne la traccia. */
function progressioneBonus(){return 0;}
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
    /* ogni esercizio della seduta segna una volta: è il conto su cui,
       alla sesta, l'app chiede se è diventato facile */
    try{(x.esercizi||[]).forEach(e=>esFatto(e.k));}catch(err){}}
  x.fatto=1;save();render(cur);
  toast(tr("Allenamento messo in conto: entra nel deficit di oggi."));};

/* ══ «SEMPRE UN GIORNO DI RIPOSO VERO» ERA UNA PREGHIERA (27/08) ══
   Lo dice la presentazione, e il prompt lo chiede: «i giorni senza
   seduta scrivili come riposo». Ma se il modello riempiva tutti e
   sette i giorni nessuno lo fermava, e la persona si ritrovava una
   settimana senza un giorno libero — che e' la cosa che fa smettere di
   allenarsi (ed e' gia' successo il 25/08 con la frequenza: «e' follia»).

   Sta FUORI dalla funzione che chiama l'AI apposta: una rete che si
   puo' provare solo generando un programma vero non si prova mai.

   Come sceglie: diventa riposo il giorno con la seduta PIU' LEGGERA.
   Togliere la piu' pesante vorrebbe dire togliere il lavoro che conta.
   E si tocca UN giorno solo: il programma resta quello che il modello
   ha pensato, gli si aggiunge la cosa che si era dimenticato. */
function garantisciRiposo(piano){
  const l=Array.isArray(piano)?piano.slice():[];
  const riposo=(x)=>{
    const t=String((x&&x.tipo)||"").toLowerCase();
    return t.indexOf("riposo")>-1||(+((x&&x.minuti)||0)===0);};
  /* sotto i cinque giorni il riposo c'e' gia' per costruzione */
  if(l.length<5||l.some(riposo))return l;
  let iLeggero=0;
  l.forEach((x,i)=>{if((+x.minuti||0)<(+l[iLeggero].minuti||0))iLeggero=i;});
  const g=l[iLeggero]||{};
  l[iLeggero]={giorno:g.giorno,tipo:"riposo",minuti:0,
    nota:tr("Riposo: fa parte del programma, non è un buco.")};
  return l;}
window.garantisciRiposo=garantisciRiposo;

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
      " Per le sedute di forza usa tipo=\"forza\" e indica i gruppi muscolari in \"gruppi\":"+
      " gli esercizi li scelgo io dal catalogo, tu scegli il mix e il perché."+
      " Gruppi disponibili: gambe, glutei, posteriori, polpacci, petto, dorso, spalle, trapezio, braccia, addominali, core, paravertebrali."+
      " Metti sempre almeno un lavoro per la schiena o il core, e se passo molte ore seduto anche le spalle."+
      /* ── COSA DEVE SAPERE DEL CATALOGO (v13.92) ──────────────────
         Il catalogo è di TRENTA esercizi, uno per gruppo, tutti di
         livello base e fattibili con due manubri e un elastico. Il
         modello non li sceglie uno per uno — sceglie i GRUPPI — ma
         deve sapere com'è fatto, o proporrà cose che non esistono:
         niente panca, niente macchinari, niente sbarra. */
      " Il catalogo ha trenta esercizi, uno per gruppo muscolare, tutti fattibili in casa con due manubri e un elastico:"+
      " NON esistono panca, macchinari, cavi o sbarra per trazioni, quindi non proporli."+
      " Riscaldamento e stretching li aggiungo io a ogni seduta di forza: non metterli fra i gruppi."+
      " Ogni esercizio ha già la sua dose per il livello e cresce da solo quando la persona dice che è diventato facile:"+
      " NON scrivere tu serie, ripetizioni o carichi — scegli i gruppi, l'ordine e il perché."+
      trainForAI()+
      " Obiettivo alimentare: "+(S.profile.goal||"dimagrire")+", con un deficit calorico in corso."+
      (sonno!=null?" Media sonno ultimi giorni: "+sonno+"/5.":"")+
      (stress!=null?" Media stress: "+stress+"/5.":"")+inf+mal+
      /* ── LA FREQUENZA È LA SUA (riscontro del founder, 25/08 sera):
         a chi aveva dichiarato due allenamenti a settimana il
         programma riempiva TUTTI i giorni — «è follia». La frequenza
         dichiarata nel percorso ora è un vincolo, non un consiglio.
         E gli sport veri hanno durate vere: un campo da tennis si
         prenota a ore, «45 minuti di tennis» non esiste. */
      allenamentiRiga()+
      " REGOLE: usa SOLO gli sport che ama o che ha a disposizione; mai quelli che ha escluso; "+
      "se sonno basso o stress alto riduci volume e intensità e dillo; con un deficit in corso non proporre volumi da atleta; "+
      "i giorni senza seduta scrivili come riposo: il riposo è parte del programma, non un buco. "+
      "Per gli sport che si prenotano a campo o a corte (tennis, padel, calcetto, squash) la seduta dura 60 minuti o un multiplo: mai 45. "+
      'Rispondi SOLO JSON: {"settimana":[{"giorno":"Lunedì","tipo":"forza|cardio|sport","sport":"nome se è uno sport tuo","minuti":0,"intensita":"leggera|media|alta","gruppi":[],"nota":""}],"nota":"una riga sul perché di questa settimana"}',"trainer");
    const arr=(j&&Array.isArray(j.settimana))?j.settimana:[];
    if(!arr.length)throw new Error("Non sono riuscito a costruire il programma");
    S.train=S.train||{};
    /* ══ «SEMPRE UN GIORNO DI RIPOSO VERO» ERA UNA PREGHIERA ══════
       Lo dice la presentazione, e nel prompt c'era l'istruzione: «i
       giorni senza seduta scrivili come riposo». Ma se il modello
       riempiva tutti e sette i giorni, nessuno lo fermava — e la
       persona si ritrovava una settimana senza un giorno libero, che
       è la cosa che fa smettere di allenarsi (e che il founder ha già
       segnalato una volta, il 25/08, per la frequenza).

       Adesso è una rete: se nella settimana non c'è nemmeno un giorno
       di riposo, l'ULTIMO giorno con la seduta più leggera diventa
       riposo. Si sceglie il più leggero perché togliere la seduta
       pesante sarebbe togliere il lavoro che conta; e si tocca un
       giorno solo, perché il programma resta quello che il modello ha
       pensato — gli si aggiunge la cosa che si era dimenticato. */
    const piano=garantisciRiposo(arr.slice(0,7));
    /* le sedute di forza ricevono qui gli esercizi veri, dalla libreria */
    S.train.piano=piano.map(x=>{
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
  /* Sei allunghi, e ognuno ha i gruppi che serve. Prima erano nove su una
     mappa che nominava zone non più esistenti (collo, obliqui): adesso la
     mappa parte dai gruppi VERI del catalogo. Il petto e la lombare ci
     sono sempre — la scrivania li chiude a tutti, allenati o no. */
  const g=(gruppi||[]).filter(Boolean);
  const per={gambe:["tallone_dietro"],glutei:["anca_avanti"],posteriori:["busto_seduto"],
    polpacci:["busto_seduto"],petto:["petto_apre"],dorso:["spalla_incrociata"],
    spalle:["spalla_incrociata"],trapezio:["spalla_incrociata"],braccia:["spalla_incrociata"],
    core:["ginocchia_petto"],addominali:["ginocchia_petto"],paravertebrali:["ginocchia_petto"]};
  const voluti=new Set(["petto_apre","ginocchia_petto"]);
  g.forEach(x=>(per[x]||[]).forEach(v=>voluti.add(v)));
  const out=STRETCH.filter(e=>voluti.has(e.k));
  return out.length?out.slice(0,5):STRETCH.slice(0,4);}

/* Una card sola per tutte e tre le sezioni, nell'ordine chiesto dal
   founder: figura, nome, muscoli, a cosa serve, come si fa. Le quattro
   righe di testo seguono tutte la lingua. Prima ce
   n'erano due quasi uguali — una per la forza e una per lo stretching —
   e divergevano a ogni ritocco. */
function cardEsercizio(E,liv,scelta){
  const d=scelta&&scelta.serie
    ? (E.tipo==="sec"?(scelta.serie>1?scelta.serie+"×"+scelta.valore+"s":scelta.valore+"s")
                     :scelta.serie+"×"+scelta.valore)
    : doseTesto(E,liv);
  return `<div class="escard" data-es="${esc(E.k)}">
    <div class="esfig">${esFigura(E,84)}</div>
    <div class="esnome">${esc(esNome(E))}</div>
    <div class="esdose">${esc(d)} · ${esc(esMuscoli(E))}</div>
    <div class="esscopo">${esc(esScopo(E))}</div>
    <div class="escome">${esc(esCome(E))}</div>
  </div>`;}
window.cardEsercizio=cardEsercizio;

function sedutaHTML(x,i){
  const forza=Array.isArray(x.esercizi)&&x.esercizi.length;
  let h=`<div class="hint" style="border-left:4px solid ${x.fatto?"var(--linea)":"var(--salvia)"};padding-left:12px;margin-top:12px">
    <b>${esc(x.giorno||"")}</b> — ${esc(x.sport||x.tipo||"")} · ${esc(String(x.minuti||""))} min · ${esc(x.intensita||"")}
    ${x.nota?"<br>"+esc(x.nota):""}`;
  if(forza){
    const liv=(S.train&&S.train.livello)||"base";
    /* Il riscaldamento non è più una riga di testo: sono quattro card
       con la loro figura, come lo stretching. Era l'asimmetria per cui
       nessuno lo faceva — sembrava una nota a piè di pagina. */
    h+=`<div class="hint" style="margin-top:8px"><b>${tr("Riscaldamento")}</b></div>
      <div class="esgrid">${RISCALDA.map(E=>cardEsercizio(E,liv)).join("")}</div>`;
    h+=`<div class="hint" style="margin-top:8px"><b>${tr("Allenamento")}</b></div>
      <div class="esgrid">${x.esercizi.map(e=>{
        const E=esTrova(e.k);return E?cardEsercizio(E,liv,e):"";}).join("")}</div>`;
    /* Lo stretching non è una lista di nomi: sono posizioni, con la loro
       figura e i secondi. Si sceglie ciò che serve ai gruppi allenati,
       più collo e schiena che ne hanno sempre bisogno. */
    const gruppi=x.esercizi.map(e=>(esTrova(e.k)||{}).g);
    const str=stretchPer(gruppi);
    h+=`<div class="hint" style="margin-top:8px"><b>${tr("Stretching")}</b></div>
      <div class="esgrid">${str.map(E=>cardEsercizio(E,liv)).join("")}</div>`;
    /* Quanto è costata: minuti e calorie, calcolati dalle dose vere. */
    const conto=sedutaConto(RISCALDA.concat(x.esercizi.map(e=>esTrova(e.k)).filter(Boolean),str).map(e=>e.k),liv);
    h+=`<div class="hint" style="margin-top:8px">${trh("In tutto <b>{v1} minuti</b>, circa <b>{v2} kcal</b>.",{v1:conto.min,v2:conto.kcal})}</div>`;}
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
