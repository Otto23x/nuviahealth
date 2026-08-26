/* ═══════════════════════════════════════════════════════════════
   50. I TURNI — quando "colazione" è una parola sbagliata
   ═══════════════════════════════════════════════════════════════
   Ogni app di dieta dà per scontato che tu ceni alle 20 e dorma la
   notte. Infermieri, operai, autisti, panettieri, riders: milioni
   di persone per cui quella parola, alle 3 di notte, è una bugia.

   Non serve un piano diverso — le calorie non sanno che ore sono.
   Serve che l'app SMETTA di chiamare le cose col nome sbagliato e
   di suonare quando dormi. Tre cose sole:

   1 · IL PROFILO DEL GIORNO
       mattina · pomeriggio · notte · riposo. Si sceglie in un
       tocco, vale per oggi, e domani si riparte — come i
       commensali della cucina guidata. Chi fa i turni non ha una
       "settimana tipo": ha un turnario che cambia ogni mese.

   2 · I PASTI PRENDONO IL NOME GIUSTO
       In turno di notte non esiste la "colazione": esiste il primo
       pasto. Le etichette diventano Pasto 1, 2, 3 — neutre e vere.
       Il piano NON cambia: cambia come lo chiamiamo.

   3 · LE ORE DI SILENZIO SI SPOSTANO
       Le notifiche tacciono di notte perché di notte si dorme. Chi
       smonta alle 6 dorme di giorno: il silenzio va spostato lì,
       altrimenti la nostra gentilezza diventa una sveglia.

   E una cosa che NON si fa: nessun giudizio sull'orario. Mangiare
   alle 3 di notte, per chi lavora alle 3 di notte, è normale. Non
   è uno strappo, non è un'eccezione, non è una cosa da recuperare. */

const TURNI_KEY="nuvia_turno";

/* I quattro profili, con le ore di veglia che portano con sé.
   `silenzio` è la finestra in cui NON si disturba: è il pezzo che
   fa la differenza fra un'app utile e una sveglia. */
const TURNI={
  mattina:  {nome:"Mattina",  ore:"6-14",  silenzio:[22,7], neutro:false},
  pomeriggio:{nome:"Pomeriggio",ore:"14-22",silenzio:[24,8], neutro:false},
  notte:    {nome:"Notte",    ore:"22-6",   silenzio:[8,15],  neutro:true},
  riposo:   {nome:"Riposo",   ore:"",       silenzio:[23,8],  neutro:false}
};
window.TURNI=TURNI;

function turnoOggi(){
  try{
    const t=JSON.parse(localStorage.getItem(TURNI_KEY)||"null");
    if(t&&t.d===iso(new Date())&&TURNI[t.k])return t.k;
  }catch(e){}
  return null;}
window.turnoOggi=turnoOggi;

window.turnoScegli=(k)=>{
  if(!TURNI[k]){
    try{localStorage.removeItem(TURNI_KEY);}catch(e){}
    render(cur);return null;}
  try{localStorage.setItem(TURNI_KEY,JSON.stringify({d:iso(new Date()),k}));}catch(e){}
  render(cur);
  toast(tr("Oggi: turno {t}",{t:turnoNome(k)}));
  return k;};

function turnoNome(k){
  return k==="mattina"   ?tr("Mattina")
       :k==="pomeriggio" ?tr("Pomeriggio")
       :k==="notte"      ?tr("Notte")
       :k==="riposo"     ?tr("Riposo")
       :"";}
window.turnoNome=turnoNome;

/* ── i nomi dei pasti ─────────────────────────────────────────── */
/* Si rietichetta SOLO quando serve davvero: in turno di notte, e
   solo per i profili dichiarati "neutri". Rietichettare sempre
   sarebbe fastidioso quanto non farlo mai. */
function turnoNeutro(){
  const k=turnoOggi();
  return !!(k&&TURNI[k]&&TURNI[k].neutro);}
window.turnoNeutro=turnoNeutro;

/* L'ordine canonico degli slot: serve per dire QUALE pasto è.
   Se il piano ha slot personalizzati si usa quello che c'è. */
function turnoSlotOrdine(){
  const base=(S.diet&&S.diet.slots)||"Colazione, Metà mattina, Pranzo, Metà pomeriggio, Cena";
  return String(base).split(",").map(x=>x.trim()).filter(Boolean);}

/* La sostituzione del nome: «Colazione» → «Pasto 1». Se lo slot non
   è nell'elenco (un extra, una voce scritta a mano) si lascia com'è:
   meglio un nome vero che un numero inventato. */
function turnoEtichetta(slot){
  if(!turnoNeutro())return null;
  const ordine=turnoSlotOrdine();
  const i=ordine.indexOf(String(slot||"").trim());
  if(i<0)return null;
  return tr("Pasto {n}",{n:i+1});}
window.turnoEtichetta=turnoEtichetta;

/* ── le ore di silenzio ───────────────────────────────────────── */
/* Ritorna la finestra [da,a] in cui non si disturba, secondo il
   turno di oggi. Senza turno vale quella di sempre (22-8). */
function turnoSilenzio(){
  const k=turnoOggi();
  if(k&&TURNI[k])return TURNI[k].silenzio.slice();
  return [22,8];}
window.turnoSilenzio=turnoSilenzio;

/* Si dorme adesso? Gestisce anche le finestre che scavalcano la
   mezzanotte, che è il caso in cui questi conti sbagliano sempre. */
function turnoSiDorme(quando){
  const t=quando||new Date();
  const ora=t.getHours();
  const [da,a]=turnoSilenzio();
  return (da>a) ? (ora>=da||ora<a) : (ora>=da&&ora<a);}
window.turnoSiDorme=turnoSiDorme;

/* ── il chip nella pagina ─────────────────────────────────────── */
function turnoHTML(){
  const k=turnoOggi();
  const V=["mattina","pomeriggio","notte","riposo"];
  let h=`<div class="card"><h2>${tr("Il turno di oggi")}</h2>
    <div class="hint">${esc(tr("Serve solo a chiamare i pasti col nome giusto e a non suonare mentre dormi. Il piano non cambia."))}</div>
    <div class="turni">`;
  h+=V.map(x=>`<button class="chipbtn${k===x?" on":""}" onclick="turnoScegli('${k===x?"":x}')">${(typeof icoTurno==="function")?icoTurno(x,17):""} ${esc(turnoNome(x))}</button>`).join("");
  h+=`</div>`;
  if(k)h+=`<div class="hint" style="margin-top:8px">${esc(tr("Silenzio dalle {a} alle {b}",{a:turnoSilenzio()[0],b:turnoSilenzio()[1]}))}</div>`;
  h+=`</div>`;
  return h;}
window.turnoHTML=turnoHTML;
