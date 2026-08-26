/* ═══════════════════════════════════════════════════════════════
   45. IL PATTO
   ═══════════════════════════════════════════════════════════════
   Al posto della serie che ti guarda male ogni mattina, un accordo
   fra due parti: tu e l'app. Dura tre mesi, ha una meta scritta,
   e — la parte che nessuno mette per iscritto — HA GIÀ DENTRO GLI
   SGARRI. Non tollerati: previsti. Un patto che non li prevede è
   un patto che sai già di rompere.

   LE QUATTRO REGOLE, in ordine di importanza:

   1 · LA RINEGOZIAZIONE È UN SUCCESSO, NON UNA RESA.
       Sparisci dieci giorni? Il patto lo aveva messo in conto:
       «lo ridisegniamo in sessanta secondi — stessa meta, strada
       nuova». Nessuna app dice così, e per questo tutte perdono
       le persone esattamente in quel punto.

   2 · SI GIUDICA LA COSTANZA, MAI IL PESO.
       Il peso dipende da acqua, ormoni, sale, sonno. La costanza
       dipende da te. Un patto onesto misura solo ciò su cui hai
       davvero potere.

   3 · SI CONTROLLA OGNI QUINDICI GIORNI, IN TRENTA SECONDI.
       Non un esame: un punto della situazione, con la possibilità
       di cambiare i termini senza sensi di colpa.

   4 · IL RINNOVO È UN RITO.
       A fine trimestre si guarda indietro e si sceglie: rinnovare,
       cambiare, o chiudere. Anche «chiudere» è una risposta buona
       — se hai raggiunto la meta, la promessa del traguardo di
       P-3 dice che tocca a te, non a noi.                          */

const PATTO_GIORNI=90;
const PATTO_CHECK=15;

/* ── LE TAPPE ─────────────────────────────────────────────────────
   Un patto NON è il traguardo: è la tappa di tre mesi che ci porta.
   Serve perché sei chili in nove mesi sono un'astrazione, mentre due
   chili entro novembre sono una cosa che si fa. E serve soprattutto
   alla fine: quando una tappa si chiude e il traguardo è ancora
   lontano, l'app propone SUBITO la successiva — è lì che si resta
   insieme. Ci si fa da parte solo al traguardo VERO (lo decide
   traguardoRaggiunto() di P-3), mai a metà strada. */
function pattoTappa(){
  const p=S.profile||{};
  const ora=+p.w, meta=+p.goalW;
  if(!ora||!meta)return null;
  const resta=Math.abs(ora-meta);
  if(resta<0.6)return null;                    /* il traguardo è lì */
  /* mezzo chilo a settimana è il ritmo che il motore considera sano:
     in tre mesi fanno circa sei chili. Se ne restano meno, la tappa
     È il traguardo e si dice. */
  const passo=Math.min(resta,6);
  const verso=(meta<ora)?(ora-passo):(ora+passo);
  return {da:ora,a:Math.round(verso*10)/10,resta:Math.round(resta*10)/10,
          ultima:passo>=resta-0.05};}
window.pattoTappa=pattoTappa;

/* La frase della tappa, in italiano da persone: mai «obiettivo
   intermedio 2/4», che è il linguaggio dei videogiochi gestionali. */
function pattoTappaTesto(t){
  if(!t)return null;
  return t.ultima
    ? tr("Da {a} a {b} kg: l'ultimo tratto.",{a:t.da,b:t.a})
    : tr("Da {a} a {b} kg in tre mesi. Poi si guarda avanti.",{a:t.da,b:t.a});}
window.pattoTappaTesto=pattoTappaTesto;

function patto(){
  if(!S.patto||typeof S.patto!=="object")S.patto=null;
  return S.patto;}
window.patto=patto;

/* ── firmare ──────────────────────────────────────────────────── */
/* sgarriPrevisti: quanti strappi a settimana il patto MESSE IN CONTO.
   Zero non è ammesso: un patto che pretende la perfezione è una
   trappola con la firma sopra. */
window.pattoFirma=(meta,sgarriSettimana,perche)=>{
  const n=Math.max(1,Math.min(7,+sgarriSettimana||2));
  S.patto={
    dal:iso(new Date()),
    al:iso(new Date(Date.now()+PATTO_GIORNI*86400000)),
    meta:String(meta||"").slice(0,120),
    perche:String(perche||(S.profile&&S.profile.senso&&S.profile.senso.perche)||"").slice(0,160),
    sgarriSettimana:n,
    revisioni:[],
    ultimoCheck:null,
    firmato:new Date().toISOString()
  };
  save();
  return S.patto;};

window.pattoChiudi=(come)=>{
  const p=patto();if(!p)return;
  S.pattoArchivio=S.pattoArchivio||[];
  S.pattoArchivio.push(Object.assign({},p,{chiuso:iso(new Date()),come:come||"scaduto"}));
  if(S.pattoArchivio.length>8)S.pattoArchivio=S.pattoArchivio.slice(-8);
  S.patto=null;save();};

/* ── come sta andando: solo costanza, mai peso ────────────────── */
function pattoAndamento(){
  const p=patto();if(!p)return null;
  let G=[];
  try{G=(typeof fragGiorni==="function")?fragGiorni(PATTO_GIORNI):[];}catch(e){}
  const dentro=G.filter(g=>g.date>=p.dal);
  if(!dentro.length)return {giorni:0,costanza:null,attivi:0,previsti:0};

  /* Un giorno «tenuto» è un giorno in cui hai registrato qualcosa:
     non uno in cui sei stato bravo. La differenza è tutto. */
  const tenuti=dentro.filter(g=>(g.mealsDone||0)>0).length;
  const costanza=Math.round(tenuti/dentro.length*100);

  /* gli strappi previsti dal contratto, in proporzione ai giorni */
  const settimane=Math.max(1,dentro.length/7);
  const previsti=Math.round(p.sgarriSettimana*settimane);
  const veri=dentro.filter(g=>(+g.sgarri||0)>400).length;

  return {giorni:dentro.length,costanza,tenuti,
    previsti,veri,
    /* «dentro il patto» vuol dire: gli strappi stanno nel numero che
       avevamo previsto insieme. Non «non ne hai fatti». */
    dentro:veri<=previsti};}
window.pattoAndamento=pattoAndamento;

function pattoGiorniRimasti(){
  const p=patto();if(!p)return null;
  return Math.max(0,Math.round((Date.parse(p.al)-Date.now())/86400000));}
window.pattoGiorniRimasti=pattoGiorniRimasti;

/* ── il controllo quindicinale ────────────────────────────────── */
function pattoCheckDovuto(){
  const p=patto();if(!p)return false;
  if(pattoGiorniRimasti()<=0)return false;         /* è il rinnovo, non un check */
  const ultimo=p.ultimoCheck||p.dal;
  return (Date.now()-Date.parse(ultimo))>=PATTO_CHECK*86400000;}
window.pattoCheckDovuto=pattoCheckDovuto;

window.pattoCheckFatto=(esito)=>{
  const p=patto();if(!p)return;
  p.ultimoCheck=iso(new Date());
  p.revisioni.push({d:p.ultimoCheck,esito:esito||"confermato"});
  save();};

/* ── LA RINEGOZIAZIONE ────────────────────────────────────────── */
/* Non è un fallimento da confessare: è una clausola del contratto.
   Cambiano i termini, la meta resta. E se cambia anche la meta,
   va bene lo stesso: era una scelta, non una condanna. */
window.pattoRinegozia=(nuoviSgarri,nuovaMeta)=>{
  const p=patto();if(!p)return null;
  p.revisioni.push({d:iso(new Date()),esito:"rinegoziato",
    da:{meta:p.meta,sgarriSettimana:p.sgarriSettimana}});
  if(nuoviSgarri)p.sgarriSettimana=Math.max(1,Math.min(7,+nuoviSgarri));
  if(nuovaMeta)p.meta=String(nuovaMeta).slice(0,120);
  p.ultimoCheck=iso(new Date());
  save();
  return p;};

/* Quando proporre di ridisegnare: dopo un'assenza vera, e senza far
   pesare l'assenza. La frase la sceglie pattoMessaggio(). */
function pattoDaRinegoziare(){
  const p=patto();if(!p)return false;
  const a=pattoAndamento();
  if(!a||a.giorni<14)return false;                 /* troppo presto per dire */
  if(a.costanza===null)return false;
  /* sotto la metà dei giorni tenuti, il patto com'è scritto non
     descrive più la vita di questa persona: va riscritto, non subìto */
  return a.costanza<50;}
window.pattoDaRinegoziare=pattoDaRinegoziare;

/* ── cosa dice il patto, e quando ─────────────────────────────── */
function pattoMessaggio(){
  const p=patto();if(!p)return null;

  const rimasti=pattoGiorniRimasti();
  if(rimasti===0)return curaComponi({
    messaggio:tr("Tre mesi insieme. Vale la pena guardarli."),
    mossa:tr("Apri il patto")});

  if(pattoDaRinegoziare())return curaComponi({
    /* mai «hai mollato»: il patto lo aveva previsto, e lo dice */
    messaggio:tr("Il patto prevedeva anche questo. Lo ridisegniamo?"),
    mossa:tr("Sessanta secondi")});

  if(pattoCheckDovuto())return curaComponi({
    messaggio:tr("Quindici giorni di patto. Come lo vuoi tenere?"),
    mossa:tr("Punto della situazione")});

  return null;}
window.pattoMessaggio=pattoMessaggio;

/* Il cancello è lo stesso di tutti: le regole di P-3, senza deroghe. */
window.pattoOra=(quando)=>{
  const msg=pattoMessaggio();
  if(!msg)return null;
  const tono=curaTestoOk(msg.titolo+" "+msg.azione);
  if(!tono.ok)return null;
  const via=curaSiPuo("patto",quando);
  if(!via.ok)return null;
  return msg;};

/* ── il rito del rinnovo ──────────────────────────────────────── */
/* Tre strade, e nessuna è una sconfitta: si rinnova, si cambia, si
   chiude. Chiudere avendo raggiunto la meta è la strada migliore. */
function pattoRinnovo(){
  const p=patto();if(!p)return null;
  if(pattoGiorniRimasti()>0)return null;
  const a=pattoAndamento()||{};
  const raggiunto=(typeof traguardoRaggiunto==="function")&&traguardoRaggiunto();
  /* la tappa dopo è già pronta: chiudere un patto senza sapere
     dove si va è il momento in cui la gente saluta. */
  const prossima=raggiunto?null:pattoTappa();
  return {
    meta:p.meta,
    costanza:a.costanza,
    dentro:a.dentro,
    raggiunto,
    prossima,
    prossimaTesto:pattoTappaTesto(prossima),
    /* la riga che l'app dirà, scelta qui e non a caso */
    /* TRE STRADE, e solo la prima ci toglie di mezzo: al traguardo
       VERO. A tappa chiusa con la meta ancora davanti, si continua —
       è questo che tiene insieme i nove mesi che servono davvero. */
    riga:raggiunto
      ? tr("Ci sei arrivato. Da qui in poi decidi tu: noi ci facciamo da parte.")
      : (a.dentro
         ? tr("Tappa chiusa. La prossima è già pronta: {t}",{t:pattoTappaTesto(prossima)||""})
         : tr("Tre mesi di vita vera. Riscriviamo la tappa su misura di com'è andata."))};}
window.pattoRinnovo=pattoRinnovo;

/* Rinnovare è un gesto solo: il patto vecchio va in archivio e il
   nuovo nasce già scritto sulla tappa successiva, con gli stessi
   strappi previsti (li avevi scelti tu, e funzionavano). */
window.pattoRinnova=()=>{
  const r=pattoRinnovo();
  if(!r||r.raggiunto)return null;
  const vecchio=patto();
  const sgarri=vecchio?vecchio.sgarriSettimana:2;
  const perche=vecchio?vecchio.perche:"";
  pattoChiudi("rinnovato");
  return pattoFirma(r.prossimaTesto||tr("La prossima tappa"),sgarri,perche);};
