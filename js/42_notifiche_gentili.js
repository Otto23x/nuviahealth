/* ═══════════════════════════════════════════════════════════════
   42. IL MOTORE DELLE NOTIFICHE GENTILI
   ═══════════════════════════════════════════════════════════════
   Sopra le regole aritmetiche già esistenti (36_telefono: ore di
   silenzio, tetto giornaliero, tipi vietati) ne mettiamo altre
   quattro, che riguardano il TONO e la DURATA della relazione.
   Sono la fondazione su cui poggeranno ciclo v2, momento fragile e
   patto: quei tre non avranno un motore proprio, useranno questo.

   1 · IL TETTO SETTIMANALE
       Massimo due notifiche «di cura» a settimana, e mai due
       giorni di fila. La fiducia si spende, non si stampa: alla
       terza spinta in cinque giorni la persona non legge più — o
       disinstalla, che è lo stesso ma peggio.

   2 · LA GRAMMATICA IN TRE PEZZI
       momento giusto · messaggio senza specchietto retrovisore ·
       una mossa sola.
       Mai nominare il silenzio («non registri da tre giorni»):
       chi è sparito lo sa già, e sentirselo dire conferma la
       vergogna. Mai nominare il cibo sulla schermata di blocco:
       quella riga la leggono anche gli altri. Si aprono porte sul
       futuro — «giovedì gnocchi in programma» — non finestre sul
       passato.

   3 · IL FOLLOW-UP UNICO
       Un solo richiamo. Se non risponde neanche a quello, silenzio
       dignitoso. E a sette giorni una frase sola, la migliore che
       abbiamo: «il piano si è tenuto in ordine da solo».

   4 · LA PROMESSA DEL TRAGUARDO
       Quando l'obiettivo è raggiunto, ci facciamo da parte: niente
       più spinte, solo un «come stai?» ogni tanto e la domanda se
       serve una mano a mantenere. Se un giorno sceglie un obiettivo
       nuovo, si ricomincia a seguirlo da vicino.
       È scritto sul sito e nella presentazione: qui diventa codice.
                                                                   */

/* ── quanto siamo vicini al traguardo ─────────────────────────── */
function traguardoRaggiunto(){
  const p=S.profile||{};
  const goal=+p.goalW, ora=+p.w;
  if(!goal||!ora)return false;
  /* mezzo chilo di tolleranza: pretendere il numero esatto
     significa non festeggiare mai. */
  if(p.goalDir==="su")return ora>=goal-0.5;
  return ora<=goal+0.5;}

/* Da quanti giorni è raggiunto: serve per diradare piano piano,
   non per spegnere di colpo. */
function giorniDaTraguardo(){
  const N=notifiche();
  if(!traguardoRaggiunto()){N.traguardoDal=null;return null;}
  const oggi=iso(new Date());
  if(!N.traguardoDal){N.traguardoDal=oggi;save();}
  return Math.max(0,Math.round((Date.parse(oggi)-Date.parse(N.traguardoDal))/86400000));}

/* ── le regole nuove, in numeri ───────────────────────────────── */
const CURA_REGOLE={
  massimoSettimana:2,        /* notifiche «di cura» in 7 giorni */
  maiDueGiorniDiFila:true,
  followUpMassimo:1,         /* un richiamo, poi silenzio */
  silenzioDopoGiorni:7,      /* e a 7 giorni, la frase buona */
  dopoIlTraguardoOgniGiorni:21  /* a obiettivo raggiunto: un «come stai?» */
};
window.CURA_REGOLE=CURA_REGOLE;

/* I tipi «di cura»: quelli che parlano alla persona, non al piano.
   Hanno un tetto proprio, più severo di quello giornaliero. */
const TIPI_CURA=["fragile","patto","ciclo","ritorno"];
window.TIPI_CURA=TIPI_CURA;

/* ── il cancello: si può mandare una notifica di cura adesso? ──── */
function curaSiPuo(tipo,quando){
  const t=quando||new Date();
  /* prima passano le regole di sempre: ore, quota, tipi vietati */
  const base=notificaSiPuo(tipo,t);
  if(!base.ok)return base;
  if(TIPI_CURA.indexOf(tipo)<0)return base;

  const N=notifiche();
  const mandate=(N.mandate||[]).filter(m=>TIPI_CURA.indexOf(m.tipo)>=0);

  /* dopo il traguardo si dirada: solo il «come stai?», e di rado */
  const g=giorniDaTraguardo();
  if(g!==null){
    if(tipo!=="comestai")
      return {ok:false,perche:"traguardo-raggiunto",
        motivo:"l'obiettivo è raggiunto: adesso tocca a lei, non a noi"};
    const ultimo=mandate.filter(m=>m.tipo==="comestai").pop();
    if(ultimo&&(t-Date.parse(ultimo.quando))<CURA_REGOLE.dopoIlTraguardoOgniGiorni*86400000)
      return {ok:false,perche:"traguardo-troppo-presto"};
    return {ok:true};}

  /* tetto settimanale */
  const settimana=mandate.filter(m=>(t-Date.parse(m.quando))<7*86400000);
  if(settimana.length>=CURA_REGOLE.massimoSettimana)
    return {ok:false,perche:"quota-settimanale",
      motivo:"la fiducia si spende: due spinte a settimana sono già tante"};

  /* mai due giorni di fila */
  if(CURA_REGOLE.maiDueGiorniDiFila){
    const ieri=new Date(t.getTime()-86400000).toISOString().slice(0,10);
    const oggi=t.toISOString().slice(0,10);
    if(mandate.some(m=>{const d=String(m.quando||"").slice(0,10);
      return d===ieri||d===oggi;}))
      return {ok:false,perche:"ieri-o-oggi"};}

  /* il follow-up è uno solo */
  const seq=(N.seq&&N.seq[tipo])||0;
  if(seq>CURA_REGOLE.followUpMassimo)
    return {ok:false,perche:"gia-richiamato",
      motivo:"ha già ricevuto il richiamo: adesso il silenzio è rispetto"};

  return {ok:true};}
window.curaSiPuo=curaSiPuo;

/* ── la grammatica: tre pezzi, e nessuno di troppo ─────────────── */
function curaComponi(pezzi){
  /* pezzi = {momento, messaggio, mossa} — se manca la mossa, la
     notifica non parte: una spinta senza una cosa da fare è solo
     un peso in più. */
  if(!pezzi||!pezzi.messaggio||!pezzi.mossa)return null;
  return {titolo:pezzi.messaggio, azione:pezzi.mossa,
          quando:pezzi.momento||null};}
window.curaComponi=curaComponi;

/* Il controllo del tono, applicato al testo PRIMA che parta.
   Le parole vietate valgono qui come nei commenti: una notifica è
   la voce dell'app nel momento più delicato della giornata. */
function curaTestoOk(testo){
  const t=String(testo||"").toLowerCase();
  if(!t.trim())return {ok:false,perche:"vuoto"};
  const vietata=(typeof PAROLE_VIETATE!=="undefined"?PAROLE_VIETATE:[])
    .find(p=>t.indexOf(String(p).toLowerCase())>=0);
  if(vietata)return {ok:false,perche:"parola-vietata",parola:vietata};
  /* lo specchietto retrovisore: nominare il silenzio o l'assenza */
  const retrovisore=[
    "non registri","non apri","non hai segnato","non ti vedo",
    "dove sei finit","ti sei dimenticat","hai saltato",
    "da giorni","è da un po'","ultimamente non"];
  const r=retrovisore.find(p=>t.indexOf(p)>=0);
  if(r)return {ok:false,perche:"specchietto-retrovisore",frase:r};
  /* Il cibo e il corpo sulla schermata di blocco li leggono anche gli
     altri: il collega che sbircia, il figlio che prende il telefono.
     Si guardano le RADICI, non le parole intere — «pesarti» è intimo
     quanto «peso», e chiedere «è ora di pesarti» in pubblico è la
     cosa che più fa disinstallare un'app di dieta. */
  const intimo=["calori","kcal","peso","pesar","pesat","pesarsi","bilancia",
    "chili","chilo"," kg","dieta","diete","grasso","grassa","magro","magra",
    "pancia","taglia","addome","girovita"];
  const i=intimo.find(p=>t.indexOf(p)>=0);
  if(i)return {ok:false,perche:"troppo-intimo",parola:i.trim()};
  return {ok:true};}
window.curaTestoOk=curaTestoOk;

/* ── il registro: cosa è partito, e a che punto è la sequenza ──── */
window.curaSegna=(tipo,quando)=>{
  const N=notifiche();
  N.seq=N.seq||{};
  N.seq[tipo]=(N.seq[tipo]||0)+1;
  notificaSegna(tipo,quando);};

/* Quando la persona risponde — apre l'app, tocca la mossa — la
   sequenza si azzera: il richiamo serviva, non serve insistere. */
window.curaRisposta=(tipo)=>{
  const N=notifiche();
  if(N.seq&&N.seq[tipo]){N.seq[tipo]=0;save();}};

/* ── la frase dei sette giorni ─────────────────────────────────── */
function curaRitorno(){
  const N=notifiche();
  const ultima=(N.mandate||[]).slice(-1)[0];
  if(!ultima)return null;
  const giorni=Math.round((Date.now()-Date.parse(ultima.quando))/86400000);
  if(giorni<CURA_REGOLE.silenzioDopoGiorni)return null;
  /* una sola volta: dopo, silenzio davvero */
  if(N.ritornoDetto)return null;
  return curaComponi({
    messaggio:tr("Il piano si è tenuto in ordine da solo."),
    mossa:tr("Guarda com'è messo")});}
window.curaRitorno=curaRitorno;

/* ── il «come stai?» del dopo-traguardo ───────────────────────── */
/* L'orario si può passare: una funzione che legge l'ora di sistema
   dà risultati diversi a seconda di quando gira, e un collaudo che
   passa di giorno e fallisce di notte non difende niente. */
function curaComeStai(quando){
  if(giorniDaTraguardo()===null)return null;
  if(!curaSiPuo("comestai",quando).ok)return null;
  return curaComponi({
    messaggio:tr("Come stai?"),
    mossa:tr("Serve una mano a mantenere?")});}
window.curaComeStai=curaComeStai;

window.traguardoRaggiunto=traguardoRaggiunto;
window.giorniDaTraguardo=giorniDaTraguardo;
