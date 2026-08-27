/* ═══════════════════════════════════════════════════════════════
   46. IL DUO
   ═══════════════════════════════════════════════════════════════
   Farcela in due è più facile che farcela da soli. Ma "in due" può
   voler dire due cose molto diverse, e questa app le tiene separate.

   SOLO CONTRO L'AI — ED È UNA SCELTA, NON UNA MANCANZA.
   Il duo con un amico l'abbiamo tolto dopo averlo scritto: una
   persona vera che ti supera in classifica diventa un peso, non un
   aiuto, e nei giorni storti è l'ultima cosa che serve. Il paragone
   con qualcuno che ti conosce non si spegne quando chiudi l'app.
   La lepre sì.

   ── CON L'AI: LA LEPRE, NON L'AVVERSARIO ───────────────────────
   Nelle maratone la lepre è un atleta pagato per correre a un
   ritmo preciso e tirare gli altri. Nessuno la considera un
   imbroglio: sanno tutti cosa fa. Qui è uguale — e infatti la
   personalità si DICHIARA, mentre l'esito no.

   Tre caratteri, e sono caratteri veri, non tre livelli di finta:
     · IL COMPAGNO — si allena a giorni alterni, ogni tanto cede al
       dolce. Comportamento autentico: se lo segui appena, lo superi.
     · IL COSTANTE — non salta mai, non strafà. Ogni tanto ti passa
       davanti e senti il fiato sul collo.
     · L'OMBRA DEL PIANO — segue il TUO piano quasi alla lettera e
       si ferma un passo prima dell'ultimo. Se il piano lo rispetti
       davvero, arrivi davanti PER MERITO.

   Le frasi raccontano cosa fa LUI oggi — «l'Ombra ha saltato lo
   spuntino, sei a +2» — e mai l'esito garantito. Non diciamo mai
   «ti lascio vincere»: sarebbe togliere valore a una vittoria che
   è comunque tua. Diciamo com'è fatto, e com'è fatto è vero.       */

const DUO_CARATTERI={
  compagno:{
    nome:"Il Compagno",
    come:"Si allena a giorni alterni e ogni tanto cede al dolce. Come tanti di noi.",
    /* quota di giorni in cui tiene il piano */
    tiene:0.55,
    /* di quanto resta indietro, al massimo, rispetto a chi aderisce */
    passoIndietro:2
  },
  costante:{
    nome:"Il Costante",
    come:"Non salta mai e non strafà. Tiene il ritmo, e ogni tanto ti passa davanti.",
    tiene:0.80,
    passoIndietro:1
  },
  ombra:{
    nome:"L'Ombra del piano",
    come:"Segue il tuo stesso piano, quasi alla lettera: si ferma sempre un passo prima dell'ultimo.",
    tiene:0.95,
    passoIndietro:1
  }
};
window.DUO_CARATTERI=DUO_CARATTERI;

function duo(){
  if(!S.duo||typeof S.duo!=="object")S.duo=null;
  return S.duo;}
window.duo=duo;

/* ── aprire un duo ────────────────────────────────────────────── */
window.duoConAI=(carattere)=>{
  const k=DUO_CARATTERI[carattere]?carattere:"costante";
  S.duo={tipo:"ai",carattere:k,dal:iso(new Date()),punti:0,punteAI:0};
  save();return S.duo;};

window.duoChiudi=()=>{S.duo=null;save();};

/* ── quanto ho tenuto io ──────────────────────────────────────── */
/* Stessa misura del patto: giorni in cui hai registrato qualcosa.
   Non «giorni buoni»: giorni in cui c'eri. */
function duoMiei(giorni){
  let G=[];
  try{G=(typeof fragGiorni==="function")?fragGiorni(giorni||14):[];}catch(e){}
  const d=duo();
  const dentro=d&&d.dal?G.filter(g=>g.date>=d.dal):G;
  const tenuti=dentro.filter(g=>(g.mealsDone||0)>0).length;
  return {giorni:dentro.length,tenuti};}
window.duoMiei=duoMiei;

/* ── quanto ha tenuto la lepre ────────────────────────────────── */
/* Il carattere è vero: il Compagno tiene davvero poco più della
   metà dei giorni. Ma la lepre non deve MAI staccare chi aderisce,
   perciò il suo risultato viene anche limitato a un passo dietro
   il tuo. Le due regole insieme fanno un avversario credibile che
   non può rubarti una vittoria meritata. */
function duoLepre(){
  const d=duo();
  if(!d||d.tipo!=="ai")return null;
  const c=DUO_CARATTERI[d.carattere]||DUO_CARATTERI.costante;
  const mio=duoMiei();
  if(!mio.giorni)return {tenuti:0,giorni:0,nome:c.nome};

  /* quello che il carattere farebbe da solo */
  const suo=Math.round(mio.giorni*c.tiene);
  /* il tetto: mai oltre il tuo risultato meno un passo */
  const tetto=Math.max(0,mio.tenuti-1);
  const tenuti=Math.min(suo,Math.max(tetto,0));

  return {tenuti,giorni:mio.giorni,nome:c.nome,carattere:d.carattere};}
window.duoLepre=duoLepre;

/* ── il confronto, raccontato ─────────────────────────────────── */
/* Le frasi dicono cosa ha fatto LUI. Mai «vinci di sicuro», mai
   «ti lascio vincere»: sarebbe togliere valore a una vittoria che
   resta tua. */
function duoRacconto(){
  const d=duo();if(!d)return null;

  const l=duoLepre();const mio=duoMiei();
  if(!l||!mio.giorni)return null;
  const diff=mio.tenuti-l.tenuti;
  const c=DUO_CARATTERI[d.carattere]||DUO_CARATTERI.costante;

  let riga;
  if(diff>0)riga=tr("{n} è a {a} giorni su {b}. Tu sei avanti di {d}.",
    {n:l.nome,a:l.tenuti,b:l.giorni,d:diff});
  else if(diff===0)riga=tr("{n} è esattamente al tuo passo: {a} su {b}.",
    {n:l.nome,a:l.tenuti,b:l.giorni});
  else riga=tr("{n} oggi è avanti: {a} su {b}.",{n:l.nome,a:l.tenuti,b:l.giorni});

  return {riga,nota:tr(c.come),nome:l.nome};}
window.duoRacconto=duoRacconto;

/* ── il duo non è un altro canale di notifiche ────────────────── */
/* Due persone che si spronano lo fanno da sole: l'app non aggiunge
   spinte. Se mai parlerà, passerà dalle regole di P-3 come tutti. */
window.duoOra=(quando)=>{
  const r=duoRacconto();
  if(!r)return null;
  const tono=curaTestoOk(r.riga);
  if(!tono.ok)return null;
  const via=curaSiPuo("duo",quando);
  if(!via.ok)return null;
  return curaComponi({messaggio:r.riga,mossa:tr("Guarda il duo")});};
