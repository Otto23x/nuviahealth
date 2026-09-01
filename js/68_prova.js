/* ═══════════════════════════════════════════════════════════════
   68. LA PROVA — la promessa di Nuvia, misurata
   ═══════════════════════════════════════════════════════════════
   Deciso col founder il 29/08. Nuvia esiste per una cosa sola:
   raddrizzare le giornate storte invece di farle diventare un
   «ricomincio lunedì». Fino alla v15.8.0 lo faceva — ribilancio,
   recupero sui giorni dopo, pasto libero senza colpa — ma non lo
   DICEVA mai: `ribilancia` compare in tutto il codice e non veniva
   contato una volta. La promessa dell'app era l'unica cosa che l'app
   non misurava.

   ── LA DEFINIZIONE È IL PRODOTTO ────────────────────────────────
   Non il codice: la definizione. Va scritta qui, difesa dal collaudo,
   e DETTA alla persona sotto il numero — un conteggio di cui non si
   capisce la regola è un giudizio, e Nuvia non giudica.

   GIORNATA STORTA (solo giorni chiusi, con un piano):
   · almeno un pasto saltato (sk ≥ 1), oppure
   · sforata oltre il 15% del pianificato (eat > prevK × 1,15).

   RIMESSA IN PIEDI:
   · il saltato: la giornata si è chiusa comunque VICINA al piano
     (fra il 75% e il 110% del pianificato) — il buco è stato
     assorbito dal resto del giorno, che è esattamente ciò che fanno
     il ribilancio e gli extra segnati con onestà;
   · lo sforamento: i giorni successivi ne hanno riassorbito almeno
     metà (recovered ≥ eccesso × 0,5) — è il motore del recupero
     che lavora, e `rgpRecovered` è la sua firma nei dati.

   ── PERCHÉ QUESTE SOGLIE ────────────────────────────────────────
   15% di sforamento ≈ 300 kcal su un piano da 2000: sotto, è rumore
   di bilancia, non una giornata storta — chiamarla storta sarebbe il
   giudizio che l'app promette di non dare. La finestra 75–110% del
   «chiuso comunque bene» è la stessa larghezza che la pagina Oggi usa
   per dire «sei in linea» (0,92–1,08) allargata sotto, perché un
   pasto saltato ASSORBITO tira il giorno verso il basso e va bene
   così. Metà dell'eccesso riassorbito: il motore del recupero ha un
   tetto per giorno (rgpCap), quindi pretendere il 100% renderebbe
   irraggiungibile la definizione proprio negli sforamenti grossi —
   quelli in cui rimettersi in piedi conta di più.

   ── DA DOVE VENGONO I DATI ──────────────────────────────────────
   Tutto è GIÀ nell'archivio settimanale (weekSummary): sk, eat,
   prevK, recovered, completed. Niente contatori nuovi, niente
   migrazioni: la prova vale anche per le settimane vissute PRIMA
   che questo modulo esistesse. La settimana in corso entra con i
   soli giorni già chiusi, calcolati con le stesse funzioni vive.  */

var PROVA_GIORNI=28;                  /* la finestra: quattro settimane */
var PROVA_SFORO=1.15;                 /* oltre qui è una giornata storta */
var PROVA_CHIUSA_MIN=0.75,PROVA_CHIUSA_MAX=1.10;
var PROVA_RECUPERO=0.5;               /* metà dell'eccesso riassorbita */

/* Classifica UN giorno d'archivio. Ritorna:
   null = non giudicabile (non chiuso, o senza piano),
   {storta:false} = giornata normale,
   {storta:true,ripresa:bool,perche:"saltato"|"sforato"} */
function provaGiorno(d){
  if(!d||!d.completed)return null;
  var plan=+d.prevK||0,eat=+d.eat||0;
  if(!(plan>0))return null;
  var saltato=(+d.sk||0)>=1;
  var sforato=eat>plan*PROVA_SFORO;
  if(!saltato&&!sforato)return {storta:false};
  if(sforato){
    var ecc=eat-plan,rec=+d.recovered||0;
    return {storta:true,perche:"sforato",ripresa:rec>=ecc*PROVA_RECUPERO};}
  /* saltato ma non sforato: ripresa se chiusa comunque vicino al piano */
  var r=eat/plan;
  return {storta:true,perche:"saltato",
    ripresa:r>=PROVA_CHIUSA_MIN&&r<=PROVA_CHIUSA_MAX};}
window.provaGiorno=provaGiorno;

/* Il giorno IN CORSO d'archivio non esiste ancora: i giorni chiusi
   della settimana viva si montano nella stessa forma, con le stesse
   funzioni con cui verranno archiviati. Un formato solo. */
function provaGiornoVivo(di){
  try{
    if(typeof dayCompleted!=="function"||!dayCompleted(di))return null;
    var e=eatenOfDay(di),pl=plannedOfDay(di),D=S.week.days[di];
    return provaGiorno({completed:true,eat:e.k,prevK:pl.k,
      sk:skippedOfDay(di),recovered:(D&&D.rgpRecovered)||0});
  }catch(err){return null;}}

/* La finestra: gli ultimi PROVA_GIORNI giorni giudicabili, fra
   archivio e settimana in corso. Si parte dal presente e si va
   indietro: quattro settimane di vita, non quattro righe di archivio. */
function provaFinestra(){
  var giorni=[];
  try{
    for(var di=0;di<((S.week&&S.week.days)||[]).length;di++){
      var g=provaGiornoVivo(di);if(g)giorni.push(g);}
  }catch(e){}
  try{
    var H=S.history||[];
    for(var i=H.length-1;i>=0&&giorni.length<PROVA_GIORNI;i--){
      var ds=(H[i].days||[]);
      for(var j=ds.length-1;j>=0&&giorni.length<PROVA_GIORNI;j--){
        var c=provaGiorno(ds[j]);if(c)giorni.push(c);}}
  }catch(e){}
  var storte=giorni.filter(function(x){return x.storta;});
  return {giudicabili:giorni.length,
    storte:storte.length,
    riprese:storte.filter(function(x){return x.ripresa;}).length};}
window.provaFinestra=provaFinestra;

/* ── LA CARTA ─────────────────────────────────────────────────────
   Vive in Numeri (Storico), in testa: è il progresso che conta più
   del peso. Tre casi, e nessuno è un rimprovero:
   · poca vita registrata → la carta NON compare (uno zero su dati
     che non esistono non è una prova, è un vuoto travestito);
   · nessuna giornata storta → lo si dice come il fatto raro che è;
   · il caso vero → il numero, la frase, e la regola dichiarata.  */
function provaHTML(){
  var f=provaFinestra();
  if(f.giudicabili<7)return "";       /* meno di una settimana vissuta */
  var h='<div class="card" data-prova="1"><h2>'+esc(tr("La prova"))+'</h2>';
  if(!f.storte){
    h+='<div class="hint">'+esc(tr("Nelle ultime quattro settimane non c'è stata nemmeno una giornata storta da rimettere in piedi. Capita di rado, e va detto."))+'</div>';
  }else{
    var frase=(f.riprese===f.storte)
      ? tr("Tutte rimesse in piedi. Nessun «ricomincio lunedì».")
      : (f.riprese===0
        ? tr("Le giornate storte capitano: rimetterle in piedi è il mestiere di Ribilancia, in Oggi.")
        : trh("{v1} rimesse in piedi. Il resto è vita: nessun «ricomincio lunedì».",{v1:f.riprese}));
    /* la frase è UNA chiave intera col numero dentro ({v1}): spezzarla
       in «numero + coda» creava una chiave che comincia in minuscolo,
       cioè un frammento — e t_i18n giustamente la rifiuta */
    h+='<div class="provanum">'
      +(f.storte===1?trh("<b>{v1}</b> giornata storta nelle ultime quattro settimane.",{v1:f.storte})
                    :trh("<b>{v1}</b> giornate storte nelle ultime quattro settimane.",{v1:f.storte}))
      +'</div><div class="provafrase">'+frase+'</div>';
    /* la barra: quante riprese su quante storte — colori, non giudizi */
    var pct=Math.round(f.riprese/f.storte*100);
    h+='<div class="ttrack provabar"><i style="width:'+pct+'%"></i></div>';
  }
  /* la regola, SEMPRE dichiarata: un numero senza la sua regola è un
     giudizio, e questo è il posto in cui Nuvia non può permetterselo */
  h+='<div class="hint provaregola">'+esc(tr("Storta = un pasto saltato o uno sforamento oltre il 15%. Rimessa in piedi = chiusa comunque vicino al piano, o con l'eccesso riassorbito nei giorni dopo."))+'</div>';
  h+='</div>';
  return h;}
window.provaHTML=provaHTML;
