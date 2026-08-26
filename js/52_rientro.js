/* ═══════════════════════════════════════════════════════════════
   52. IL RIENTRO — la pausa che si prende da sola,
       e il numero che non deve fare male
   ═══════════════════════════════════════════════════════════════
   Due momenti, lo stesso problema: la persona è stata via e
   l'app non lo sa.

   ── LA PAUSA ────────────────────────────────────────────────
   Il diario resta aperto e non lo compili. Dopo tre giorni
   l'app smette di far finta: apre un PERIODO LIBERO, che vuol
   dire tre cose concrete — i giorni vuoti non contano come
   fallimenti, la serie si congela invece di rompersi, e le
   medie non vengono avvelenate da zeri che non sono zeri (non
   hai mangiato niente: non l'hai scritto, che è diverso).
   Te lo diciamo, non lo nascondiamo. E si chiude quando torni.

   ── IL NUMERO DEL RIENTRO ───────────────────────────────────
   Torni, ti pesi, e leggi +3 kg. Quel numero, da solo, chiude
   più diete di qualunque sgarro.
   Quello che possiamo dire onestamente è: nei rientri, una
   parte di quel peso di solito se ne va da sola in qualche
   giorno — acqua e scorte, non grasso. MA NON LO SAPPIAMO.
   Non sappiamo cosa hai mangiato, quanto sale, quanto hai
   dormito, se ti sei mosso. Quindi si dice come IPOTESI, con
   una data in cui si verifica: fra qualche giorno il peso
   stesso ci dirà se era così.
   Promettere «è solo acqua» sarebbe una bugia gentile — e una
   bugia gentile, quando viene smentita, costa la fiducia su
   tutto il resto.                                              */

const PAUSA_GIORNI=3;          /* dopo quanti giorni muti si apre */
const RIENTRO_FINESTRA=10;     /* per quanti giorni la pesata è "di rientro" */

function rientro(){
  if(!S.rientro||typeof S.rientro!=="object")
    S.rientro={pausaDal:null,pausaFino:null,tornatoIl:null,pesoPrima:null,detto:false};
  return S.rientro;}
window.rientro=rientro;

/* ── quanti giorni di fila senza segnare niente ──────────────── */
function giorniMuti(){
  let G=[];
  try{G=(typeof fragGiorni==="function")?fragGiorni(30):[];}catch(e){}
  const oggi=iso(new Date());
  let n=0;
  for(let i=G.length-1;i>=0;i--){
    const g=G[i];
    if(g.date===oggi)continue;          /* oggi è ancora in corso: non conta */
    if((g.mealsTot||0)>0&&(g.mealsDone||0)===0)n++;
    else break;}
  return n;}
window.giorniMuti=giorniMuti;

/* ── la pausa si apre da sola ─────────────────────────────────── */
window.pausaControlla=()=>{
  const R=rientro();
  const muti=giorniMuti();

  /* già in pausa e la persona è tornata: si chiude */
  if(R.pausaDal&&muti===0){
    R.pausaFino=iso(new Date());
    R.tornatoIl=iso(new Date());
    R.pausaDal=null;R.detto=false;
    save();
    return {evento:"chiusa"};}

  if(R.pausaDal)return {evento:"in corso",da:R.pausaDal};
  if(muti<PAUSA_GIORNI)return null;

  /* si apre, e si ricorda il peso di prima: servirà al rientro */
  R.pausaDal=iso(new Date(Date.now()-muti*86400000));
  const W=(S.profile&&S.profile.weights)||[];
  R.pesoPrima=W.length?+W[W.length-1].w:null;
  R.detto=false;
  /* la serie non si rompe: si congela, come in vacanza */
  try{if(S.hardDays)S.hardDays[iso(new Date())]=true;}catch(e){}
  save();
  return {evento:"aperta",giorni:muti};};

/* Il messaggio della pausa: dice cosa È SUCCESSO, non cosa hai
   sbagliato. E passa dai cancelli come tutto il resto. */
window.pausaMessaggio=()=>{
  const R=rientro();
  if(!R.pausaDal||R.detto)return null;
  const m=curaComponi({
    messaggio:tr("Ho messo il diario in pausa."),
    mossa:tr("Riprendi quando vuoi")});
  if(!m)return null;
  if(!curaTestoOk(m.titolo+" "+m.azione).ok)return null;
  return m;};

window.pausaSegnaDetto=()=>{const R=rientro();R.detto=true;save();};

/* La riga da mostrare in pagina mentre la pausa è aperta: qui non
   serve il cancello delle notifiche, è l'app che parla quando la
   apri tu. */
window.pausaHTML=()=>{
  const R=rientro();
  if(!R.pausaDal)return "";
  return `<div class="card pausa">
    <h2>${tr("Il diario è in pausa")}</h2>
    <div class="hint">${esc(tr("Da qualche giorno non c'è niente da segnare, quindi ho smesso di contare: questi giorni non contano come mancati e la serie è congelata. Riprende da solo appena spunti qualcosa."))}</div>
    </div>`;};

/* ── il numero del rientro ────────────────────────────────────── */
/* Ritorna la nota da affiancare alla pesata, o null. È un'IPOTESI
   dichiarata, con una verifica fissata nel tempo: mai una promessa. */
window.rientroNotaPeso=(delta)=>{
  const R=rientro();
  if(!R.tornatoIl)return null;
  const giorni=Math.round((Date.now()-Date.parse(R.tornatoIl))/86400000);
  if(giorni>RIENTRO_FINESTRA)return null;
  if(!(delta>0.8))return null;          /* sotto, non c'è niente da spiegare */

  const quando=new Date(Date.now()+7*86400000)
    .toLocaleDateString(typeof dataLoc==="function"?dataLoc():"it-IT",
      {day:"numeric",month:"long"});
  /* Il condizionale non è timidezza: è la differenza fra un'ipotesi
     e una promessa. Se dicessimo «è solo acqua» e fra una settimana
     il peso fosse ancora lì, avremmo perso la fiducia su tutto. */
  return tr("Dopo una pausa, spesso una parte di questo peso è acqua e scorte, e se ne va da sola in qualche giorno. Ma non lo so: dipende da cosa è successo in questi giorni. Lo scopriamo insieme — se intorno al {d} il numero è sceso da solo, era così.",{d:quando});};

/* Il peso da cui si è partiti, per dire di quanto si parla senza
   farne un processo. */
window.rientroDelta=()=>{
  const R=rientro();
  if(!R.pesoPrima)return null;
  const w=+(S.profile&&S.profile.w);
  if(!w)return null;
  return Math.round((w-R.pesoPrima)*10)/10;};
