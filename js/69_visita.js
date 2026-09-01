/* ═══════════════════════════════════════════════════════════════
   69. IL FOGLIO PER LA VISITA — periodo e raggruppamenti
   ═══════════════════════════════════════════════════════════════
   Primo passo del canale nutrizionisti (founder, 29/08): «l'export
   deve avere varie date, una settimana, un mese, raggruppamenti».

   ── COSA C'ERA, E PERCHÉ NON BASTAVA ────────────────────────────
   Il foglio esisteva (printVisita, in 21_14) e leggeva
   `S.ui.visitaGiorni || 90`. Ma `visitaGiorni` NON VENIVA IMPOSTATO
   DA NESSUNA PARTE: era una manopola scollegata, e il foglio usciva
   sempre a novanta giorni. Chi torna dal nutrizionista dopo una
   settimana portava tre mesi di medie in cui la settimana che conta
   spariva dentro le altre dodici.

   ── E UN DIFETTO VERO, TROVATO SPOSTANDO IL PERIODO ─────────────
   Il peso lo prendeva dalla PRIMA e dall'ULTIMA pesata di sempre
   (`ws[0]` e `ws[ws.length-1]`), non da quelle del periodo: con la
   finestra fissa la cosa passava inosservata, ma su «ultima
   settimana» avrebbe scritto il calo di tutta la storia sotto il
   titolo di sette giorni. Un numero giusto sotto un'etichetta
   sbagliata è peggio di un numero mancante — a un professionista si
   consegna un foglio, e il foglio deve dire la verità sul periodo
   che dichiara. Qui le pesate sono filtrate sulla finestra.

   ── LE REGOLE DEL FOGLIO ────────────────────────────────────────
   1. LE MEDIE CONTANO SOLO I GIORNI REGISTRATI, e accanto a ogni
      riga c'è quanti sono: chi non registra non ha sbagliato, ha
      solo non registrato. Un professionista deve poter distinguere
      «ha mangiato poco» da «non ha scritto».
   2. IL RAGGRUPPAMENTO SI DICHIARA nel foglio: leggere «1.850 kcal»
      senza sapere se è un giorno, una settimana o un mese non
      significa niente.
   3. NIENTE DIAGNOSI, NIENTE TERAPIA: il foglio porta dati raccolti
      dalla persona e lo dice in fondo. È la stessa riga della
      v15.6.0, e vale doppio qui, perché questo foglio finisce
      davvero in mano a un professionista.                          */

/* I periodi offerti. «tutto» non è un numero: è tutta la storia. */
var VISITA_PERIODI=[["7","una settimana"],["30","un mese"],["90","tre mesi"],
                    ["180","sei mesi"],["tutto","tutta la storia"],["scelto","date scelte"]];
var VISITA_GRUPPI=["giorno","settimana","mese"];

function visitaConf(){
  if(!S.ui)S.ui={};
  var v=S.ui.visita;
  if(!v||typeof v!=="object")v=S.ui.visita={};
  if(VISITA_PERIODI.map(function(x){return x[0];}).indexOf(v.periodo)<0)v.periodo="30";
  if(VISITA_GRUPPI.indexOf(v.gruppo)<0&&v.gruppo!=="auto")v.gruppo="auto";
  if(!v.gruppo)v.gruppo="auto";
  if(typeof v.da!=="string")v.da="";
  if(typeof v.a!=="string")v.a="";
  return v;}
window.visitaConf=visitaConf;

/* ── LA FINESTRA ─────────────────────────────────────────────────
   Ritorna i giorni del periodo scelto, con gli estremi VERI (quelli
   dei dati, non quelli chiesti): se una persona chiede sei mesi ma
   l'app la conosce da tre settimane, il foglio deve dire tre
   settimane, non sei mesi con cinque mesi di vuoto. */
function visitaFinestra(){
  var v=visitaConf();
  var tutti=[];
  try{tutti=(typeof flattenDiario==="function")?flattenDiario():[];}catch(e){tutti=[];}
  var sel;
  if(v.periodo==="scelto"&&v.da&&v.a){
    var da=v.da<v.a?v.da:v.a, a=v.da<v.a?v.a:v.da;
    sel=tutti.filter(function(d){return d.date>=da&&d.date<=a;});
  }else if(v.periodo==="tutto"){
    sel=tutti.slice();
  }else{
    sel=tutti.slice(-Math.max(1,parseInt(v.periodo,10)||30));
  }
  return {giorni:sel,
    da:sel.length?sel[0].date:"",
    a:sel.length?sel[sel.length-1].date:""};}
window.visitaFinestra=visitaFinestra;

/* Il raggruppamento effettivo: «auto» sceglie in base a quanto è
   lunga la finestra — una settimana si legge giorno per giorno, un
   anno no. La persona può sempre scavalcare. */
function visitaGruppo(n){
  var v=visitaConf();
  if(v.gruppo!=="auto")return v.gruppo;
  if(n<=14)return "giorno";
  if(n<=92)return "settimana";
  return "mese";}
window.visitaGruppo=visitaGruppo;

/* ── I MUCCHI ────────────────────────────────────────────────────
   Stessa logica di raggruppamento del «Riepilogo esteso» (settimane
   che iniziano di lunedì, mesi per AAAA-MM): due tabelle che
   raggruppano in modi diversi sarebbero due verità diverse. */
function visitaMucchi(giorni,gruppo){
  var b={},ordine=[];
  giorni.forEach(function(d){
    var k;
    if(gruppo==="mese")k=d.date.slice(0,7);
    else if(gruppo==="settimana"){
      var dt=new Date(d.date+"T12:00:00"),mon=new Date(dt);
      mon.setDate(dt.getDate()-((dt.getDay()+6)%7));
      k=(typeof iso==="function")?iso(mon):mon.toISOString().slice(0,10);
    }else k=d.date;
    if(!b[k]){b[k]=[];ordine.push(k);}
    b[k].push(d);});
  return ordine.sort().map(function(k){
    var arr=b[k],reg=arr.filter(function(d){return (d.eat||0)>0;});
    var media=function(f){return reg.length?Math.round(reg.reduce(function(a,d){return a+(d[f]||0);},0)/reg.length):null;};
    return {k:k,gruppo:gruppo,giorni:arr.length,registrati:reg.length,
      etichetta:visitaEtichetta(k,gruppo),
      kcal:media("eat"),prot:media("prot"),carb:media("c"),gras:media("f"),fib:media("fib"),
      def:media("def"),burn:media("burn"),sonno:media("sleep"),umore:media("feel"),
      allenamenti:arr.reduce(function(a,d){return a+(d.workoutN||(d.workouts||[]).length||0);},0),
      difficili:arr.filter(function(d){return d.hard;}).length};});}
window.visitaMucchi=visitaMucchi;

function visitaEtichetta(k,gruppo){
  try{
    var loc=(typeof dataLoc==="function")?dataLoc():"it-IT";
    if(gruppo==="mese")
      return new Date(k+"-01T12:00:00").toLocaleDateString(loc,{month:"long",year:"numeric"});
    if(gruppo==="settimana")
      return tr("sett. del")+" "+new Date(k+"T12:00:00").toLocaleDateString(loc,{day:"numeric",month:"short"});
    return new Date(k+"T12:00:00").toLocaleDateString(loc,{weekday:"short",day:"numeric",month:"short"});
  }catch(e){return k;}}

/* ── IL RIASSUNTO DELLA FINESTRA ─────────────────────────────────
   Le pesate sono filtrate SULLA FINESTRA (vedi la nota in cima: era
   il difetto). Se dentro la finestra c'è una sola pesata, delta e
   ritmo non esistono e si dice «–» invece di inventarli. */
function visitaRiassunto(){
  var f=visitaFinestra(),g=f.giorni;
  var reg=g.filter(function(d){return (d.eat||0)>0;});
  var media=function(arr,c){return arr.length?Math.round(arr.reduce(function(a,d){return a+(d[c]||0);},0)/arr.length):null;};
  var inTarget=reg.filter(function(d){return (d.def||0)>=0;}).length;
  var ws=[];
  try{ws=(S.profile.weights||[]).filter(function(x){
    return x&&x.w&&(!f.da||x.d>=f.da)&&(!f.a||x.d<=f.a);});}catch(e){}
  var primo=ws.length?ws[0]:null,ultimo=ws.length?ws[ws.length-1]:null;
  var delta=(primo&&ultimo&&primo!==ultimo)?Math.round((ultimo.w-primo.w)*10)/10:null;
  var ritmo=null;
  if(primo&&ultimo&&primo.d!==ultimo.d){
    var sett=(Date.parse(ultimo.d)-Date.parse(primo.d))/(7*86400000);
    if(sett>=1)ritmo=Math.round((ultimo.w-primo.w)/sett*100)/100;}
  return {da:f.da,a:f.a,giorni:g.length,registrati:reg.length,
    difficili:g.filter(function(d){return d.hard;}).length,
    aderenza:reg.length?Math.round(inTarget/reg.length*100):null,
    kcal:media(reg,"eat"),prot:media(reg,"prot"),carb:media(reg,"c"),
    gras:media(reg,"f"),fib:media(reg,"fib"),tdee:media(reg,"tdee"),
    burn:media(g,"burn"),sonno:media(reg,"sleep"),umore:media(reg,"feel"),
    allenamenti:g.reduce(function(a,d){return a+(d.workoutN||(d.workouts||[]).length||0);},0),
    pesoDa:primo?primo.w:null,pesoA:ultimo?ultimo.w:null,delta:delta,ritmo:ritmo,
    pesate:ws.slice(-12)};}
window.visitaRiassunto=visitaRiassunto;

/* ── LA CARTA IN NUMERI ──────────────────────────────────────────
   Prima si sceglie e si VEDE, poi si stampa: stampare per scoprire
   cosa esce è il modo più rapido di sprecare un foglio. */
function visitaCardHTML(){
  var v=visitaConf(),r=visitaRiassunto(),gr=visitaGruppo(r.giorni);
  var mucchi=visitaMucchi(visitaFinestra().giorni,gr);
  var chip=function(on,testo,azione){
    return '<button class="chipbtn'+(on?" on":"")+'" type="button" onclick="'+azione+'">'+esc(testo)+'</button>';};
  var h='<div class="card" data-visita="1"><h2>'+esc(tr("Foglio per la visita"))+'</h2>'
   +'<div class="hint">'+esc(tr("Il riassunto da portare al nutrizionista o al medico: scegli il periodo e come raggrupparlo, guarda cosa esce, poi stampalo o salvalo in PDF."))+'</div>';
  h+='<div class="mtools" style="margin-top:12px">'
   +VISITA_PERIODI.map(function(p){
     return chip(v.periodo===p[0],tr(p[1]),"visitaPeriodo('"+p[0]+"')");}).join("")+'</div>';
  if(v.periodo==="scelto"){
    h+='<div class="grid2" style="margin-top:8px">'
     +'<div><label>'+esc(tr("Dal"))+'</label><input type="date" id="visDa" value="'+esc(v.da)+'" onchange="visitaDate()"></div>'
     +'<div><label>'+esc(tr("Al"))+'</label><input type="date" id="visA" value="'+esc(v.a)+'" onchange="visitaDate()"></div></div>';}
  h+='<div class="mtools" style="margin-top:12px"><span class="o2hint" style="align-self:center;margin:0 4px 0 0">'+esc(tr("Raggruppa per"))+'</span>'
   +chip(v.gruppo==="auto",tr("automatico"),"visitaGruppoSet('auto')")
   +VISITA_GRUPPI.map(function(g){return chip(v.gruppo===g,tr(g),"visitaGruppoSet('"+g+"')");}).join("")+'</div>';

  if(!r.giorni){
    h+='<div class="hint" style="margin-top:12px">'+esc(tr("In questo periodo non c'è ancora niente di registrato: scegline un altro, o comincia a segnare i pasti."))+'</div></div>';
    return h;}

  h+='<div class="hint" style="margin-top:12px">'+esc(visitaRiga(r,gr))+'</div>';
  /* l'anteprima: le stesse righe che finiranno sul foglio */
  h+='<div style="max-height:280px;overflow-y:auto;border:1px solid var(--linea);border-radius:12px;margin-top:8px">'
   +'<table><tr><th>'+esc(tr("Periodo"))+'</th><th class="n">'+esc(tr("Mangiate"))+'</th><th class="n">'+esc(tr("Prot"))+'</th><th class="n">'+esc(tr("Deficit"))+'</th></tr>'
   +mucchi.map(function(m){
     return '<tr><td>'+esc(m.etichetta)+' <small style="color:var(--grigio)">('+m.registrati+"/"+m.giorni+'g)</small></td>'
      +'<td class="n">'+(m.kcal==null?"–":m.kcal)+'</td>'
      +'<td class="n">'+(m.prot==null?"–":m.prot+"g")+'</td>'
      +'<td class="n">'+(m.def==null?"–":((m.def>=0?"−":"+")+Math.abs(m.def)))+'</td></tr>';}).join("")
   +'</table></div>';
  h+='<div class="mtools" style="margin-top:12px">'
   +'<button class="btn" onclick="printVisita()">'+esc(tr("Stampa o salva in PDF"))+'</button></div>';
  h+='</div>';
  return h;}
window.visitaCardHTML=visitaCardHTML;

/* La riga che dice cosa si sta guardando: periodo vero, giorni
   registrati, raggruppamento. È la stessa frase che va in cima al
   foglio stampato — una sola, così non possono divergere. */
function visitaRiga(r,gr){
  var loc=(typeof dataLoc==="function")?dataLoc():"it-IT";
  var d=function(x){try{return new Date(x+"T12:00:00").toLocaleDateString(loc);}catch(e){return x;}};
  var nomi={giorno:tr("per giorno"),settimana:tr("per settimana"),mese:tr("per mese")};
  return trh("Dal {v1} al {v2} · {v3} giorni, {v4} registrati · raggruppato {v5}",
    {v1:d(r.da),v2:d(r.a),v3:r.giorni,v4:r.registrati,v5:nomi[gr]||gr});}
window.visitaRiga=visitaRiga;

window.visitaPeriodo=function(p){
  var v=visitaConf();v.periodo=p;
  /* scegliendo «date scelte» si parte da quello che si stava già
     guardando: due campi vuoti non dicono niente */
  if(p==="scelto"&&(!v.da||!v.a)){var f=visitaFinestra();v.da=f.da;v.a=f.a;}
  save();try{render(cur);}catch(e){}};
window.visitaGruppoSet=function(g){
  visitaConf().gruppo=g;save();try{render(cur);}catch(e){}};
window.visitaDate=function(){
  var v=visitaConf();
  var a=document.getElementById("visDa"),b=document.getElementById("visA");
  if(a)v.da=a.value||"";
  if(b)v.a=b.value||"";
  save();try{render(cur);}catch(e){}};

/* ── IL FOGLIO ───────────────────────────────────────────────────
   Quello che finisce in mano al professionista. Tre tabelle: il
   riassunto del periodo, il dettaglio raggruppato, le pesate. In
   fondo la riga che dice cosa sono questi numeri e cosa NON sono. */
window.printVisita=function(){
  try{if(typeof busy==="function")busy(tr("Preparo il foglio per la visita…"));}catch(e){}
  var p=S.profile,r=visitaRiassunto(),gr=visitaGruppo(r.giorni);
  var mucchi=visitaMucchi(visitaFinestra().giorni,gr);
  var nd=function(x){return x==null?"–":x;};
  /* il foglio segue le unità della persona, come ogni altra
     schermata: chi ragiona in libbre lo legge in libbre */
  var pTxt=function(x){return x==null?"–":((typeof pesoTxt==="function")?pesoTxt(x,1):x+" kg");};
  var aTxt=function(x){return x==null?"–":((typeof altTxt==="function")?altTxt(x):x+" cm");};
  var pSeg=function(d){if(d==null)return "–";
    return (d>0?"+":d<0?"−":"")+pTxt(Math.abs(d));};
  var loc=(typeof dataLoc==="function")?dataLoc():"it-IT";
  var righe=mucchi.map(function(m){
    return "<tr><td>"+esc(m.etichetta)+"</td><td>"+m.registrati+"/"+m.giorni+"</td>"
     +"<td>"+nd(m.kcal)+"</td><td>"+nd(m.prot)+"</td><td>"+nd(m.carb)+"</td><td>"+nd(m.gras)+"</td>"
     +"<td>"+(m.def==null?"–":((m.def>=0?"−":"+")+Math.abs(m.def)))+"</td>"
     +"<td>"+m.allenamenti+"</td></tr>";}).join("");
  var pesate=(r.pesate||[]).map(function(x){
    var g=(typeof giornoDa==="function")?giornoDa(x.d):new Date(x.d+"T12:00:00");
    return "<tr><td>"+g.toLocaleDateString(loc)+"</td><td>"+pTxt(x.w)+"</td>"
     +"<td>"+(x.fat==null?"–":x.fat)+"</td><td>"+esc(x.pa==null?"–":x.pa)+"</td>"
     +"<td>"+(x.spo2==null?"–":x.spo2)+"</td></tr>";}).join("");
  var eta="";try{eta=age()+" "+tr("anni");}catch(e){}
  var h="<h1>"+esc(tr("Foglio per la visita"))+"</h1>"
   +"<div>"+esc(p.name||tr("Paziente"))+" · "+esc(eta)+" · "+aTxt(p.h)+" · "+pTxt(p.w)
   +(p.goalW?" · "+esc(tr("obiettivo"))+" "+pTxt(p.goalW):"")+"</div>"
   +"<div>"+esc(visitaRiga(r,gr))+"</div>"
   +"<h2>"+esc(tr("Il periodo in sintesi"))+"</h2><table>"
   +"<tr><th>"+esc(tr("Giorni registrati"))+"</th><td>"+r.registrati+" / "+r.giorni
     +(r.difficili?" · "+esc(trh("{v1} dichiarati difficili",{v1:r.difficili})):"")+"</td></tr>"
   +"<tr><th>"+esc(tr("Aderenza al target"))+"</th><td>"+(r.aderenza==null?"–":r.aderenza+"%")+" "+esc(tr("(sui giorni registrati)"))+"</td></tr>"
   +"<tr><th>"+esc(tr("Energia media assunta"))+"</th><td>"+nd(r.kcal)+" kcal/"+esc(tr("giorno"))+"</td></tr>"
   +"<tr><th>"+esc(tr("Fabbisogno stimato"))+"</th><td>"+nd(r.tdee)+" kcal/"+esc(tr("giorno"))+"</td></tr>"
   +"<tr><th>"+esc(tr("Proteine · carboidrati · grassi · fibre"))+"</th><td>"+nd(r.prot)+" · "+nd(r.carb)+" · "+nd(r.gras)+" · "+nd(r.fib)+" g</td></tr>"
   +"<tr><th>"+esc(tr("Attività fisica"))+"</th><td>"+r.allenamenti+" "+esc(tr("sedute"))+" · "+nd(r.burn)+" kcal/"+esc(tr("giorno"))+"</td></tr>"
   +"<tr><th>"+esc(tr("Sonno · umore (autovalutati 1-5)"))+"</th><td>"+nd(r.sonno)+" · "+nd(r.umore)+"</td></tr>"
   +"</table>"
   /* Con meno di due pesate NEL PERIODO l'andamento non esiste: si
      dice, invece di stampare tre righe di trattini che il
      professionista dovrebbe interpretare. */
   +"<h2>"+esc(tr("Andamento del peso"))+"</h2>"
   +((r.pesate||[]).length<2
     ? "<p>"+esc((r.pesate||[]).length
         ? tr("Una sola pesata in questo periodo: per un andamento ne servono almeno due.")
         : tr("Nessuna pesata registrata in questo periodo."))+"</p>"
     : "<table>"
       +"<tr><th>"+esc(tr("Da"))+" → "+esc(tr("a"))+"</th><td>"+pTxt(r.pesoDa)+" → "+pTxt(r.pesoA)+"</td></tr>"
       +"<tr><th>"+esc(tr("Variazione"))+"</th><td>"+pSeg(r.delta)+"</td></tr>"
       +"<tr><th>"+esc(tr("Ritmo settimanale"))+"</th><td>"+(r.ritmo==null?"–":pSeg(r.ritmo)+"/"+esc(tr("settimana")))+"</td></tr>"
       +"</table>")
   +(righe?"<h2>"+esc(tr("Il dettaglio, periodo per periodo"))+"</h2><table>"
     +"<tr><th>"+esc(tr("Periodo"))+"</th><th>"+esc(tr("Reg."))+"</th><th>kcal</th><th>"+esc(tr("Prot"))+"</th>"
     +"<th>"+esc(tr("Carb"))+"</th><th>"+esc(tr("Gras"))+"</th><th>"+esc(tr("Deficit"))+"</th><th>"+esc(tr("Allen."))+"</th></tr>"
     +righe+"</table>":"")
   +(pesate?"<h2>"+esc(tr("Misure registrate"))+"</h2><table>"
     +"<tr><th>"+esc(tr("Data"))+"</th><th>"+esc(tr("Peso"))+"</th><th>"+esc(tr("Grasso %"))+"</th><th>"+esc(tr("Pressione"))+"</th><th>SpO2</th></tr>"
     +pesate+"</table>":"")
   +'<p style="margin-top:16px;font-size:11.5px">'+esc(tr("Dati raccolti dalla persona con un diario alimentare. Le energie e i macronutrienti sono STIME calcolate da tabelle e da riconoscimento automatico: vanno lette come ordini di grandezza, non come misure. Le medie contano solo i giorni registrati. Questo foglio non contiene diagnosi né indicazioni terapeutiche."))+"</p>"
   +'<p style="font-size:10.5px;color:#666">'+esc(tr("Generato con Nuvia · nuviahealth.app"))+" · "+new Date().toLocaleDateString(loc)+"</p>";
  var box=document.getElementById("printreport");
  if(box)box.innerHTML=h;
  setTimeout(function(){
    try{if(typeof busyOff==="function")busyOff();}catch(e){}
    try{window.print();}catch(e){}},120);};
