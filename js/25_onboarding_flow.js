/* ═══════════════════════════════════════════════════════════════
   25. ONBOARDING CONVERSAZIONALE (Sprint 1)
   ═══════════════════════════════════════════════════════════════
   Dieci schermate, una domanda per schermata, tocco = avanti. Il
   percorso lungo resta al suo posto (si raggiunge da «Rifai il
   percorso guidato» e regge i collaudi storici): questo è ciò che
   incontra chi apre l'app per la prima volta.

   Tre principi, in ordine di importanza:
   1. NIENTE SI PERDE. Le risposte vivono in S.onb2, dentro lo stato
      già esistente: chi abbandona a metà riprende esattamente da lì.
   2. LA VOCE PROPONE, LA PERSONA DISPONE. Il parlato pre-compila e
      fa saltare schermate, ma ogni campo estratto è un chip che si
      può correggere o buttare prima di confermare.
   3. LA VOCE NON È MAI UN REQUISITO. Niente microfono, niente rete,
      niente chiave: si prosegue toccando, senza un messaggio di colpa.

   I numeri mostrati sono VERI: la proiezione del peso passa dal
   motore già collaudato (wizTargets), non da una stima inventata
   per far bella figura sulla schermata.                            */

/* onb2Attivo non esiste più (25/08): decideva fra i due percorsi, e
   di percorso ce n'è rimasto uno. Con lei se n'è andato anche
   S.ui.onbLungo, l'interruttore che nessuno impostava più. */

/* ── Le cinque sezioni della barra ────────────────────────────────
   PRIMA tutto ciò che ha effetto sul piano (profilo, alimentazione,
   vita), POI le domande per conoscersi. Regola del founder, 22/08:
   quando finisce il blocco che serve al piano, l'AI può partire in
   background — le ultime domande si rispondono mentre lavora. */
function ONB2_SEZt(){return [
  {k:"profilo",       t:tr("Obiettivo & profilo")},
  {k:"alimentazione", t:tr("Come mangi")},
  {k:"vita",          t:tr("Corpo & vita")},
  {k:"conoscerti",    t:tr("Per conoscerti")},
  {k:"ricette",       t:tr("Le tue ricette")}
];}

/* ── Le schermate ─────────────────────────────────────────────────
   `k` è anche la chiave della risposta in S.onb2.ris e il campo del
   contratto di estrazione: un nome solo, così la voce sa cosa salta.

   ORDINE (regola del founder, 22/08/2026): prima TUTTE le domande con
   effetto sul piano, poi quelle per conoscersi. Il confine è la fine
   della sezione «vita»: da lì in poi nessuna risposta cambia il piano,
   e la generazione può partire (arriva col passo 3).
   Le opzioni vengono dalle STESSE liste della pagina Regole
   (INTOL_LIST, PAT_LIST, PROT_LIST, REL_LIST, DIET_TYPES, CUCINE):
   una fonte sola — l'onboarding le chiede, Regole le modifica.     */
const O2CAP=x=>{const e=tr(x);return e?e[0].toUpperCase()+e.slice(1):e;};
function ONB2t(){return [
 /* ═══ LA LINGUA, PRIMA DI TUTTO (riscontro del founder, 25/08) ═══
    Subito dopo la pagina di saluto: le domande che seguono vanno
    fatte nella lingua della persona, non scoperta a metà percorso
    dentro Sistema. Le etichette NON passano da tr(): «Italiano» e
    «English» si scrivono ognuna nella propria lingua, perché chi
    le legge sta proprio cercando la sua. L'elenco viene dal
    registro LINGUE (10_base): aggiungendo il polacco, la scelta
    compare qui da sola. */
 /* ── DOVE SEI (founder, 28/08) ───────────────────────────────────
    «Va inserito anche dove vivi… e che valuta usi… metti anche le
    unità di misura del paese.»
    Sta insieme alla lingua e non in una schermata sua per una ragione
    sola: sono la stessa domanda vista da quattro lati — in che lingua
    ti parlo, dove sei, con che soldi fai la spesa, in che unità
    ragioni. Chiederle separate sarebbero quattro schermate per
    sapere una cosa. E il paese PROPONE valuta e unità: due campi su
    quattro sono già compilati quando arrivi. */
 {k:"lingua",sez:"profilo",tipo:"dove",
  q:tr("Dove sei, e in che lingua parliamo?"),
  sub:tr("Il paese cambia i prezzi della spesa e i piatti di casa; la lingua cambia come ti parlo. Si cambiano quando vuoi, da Sistema.")},

 {k:"obiettivo",sez:"profilo",tipo:"scelta",
  q:tr("Cosa vorresti fare?"),
  sub:tr("Da qui parte tutto il resto: il fabbisogno, il piano, il ritmo."),
  op:[["perdere",tr("Perdere peso"),tr("Con calma e senza fame nera")],
      ["mantenere",tr("Mantenere"),tr("Stare bene dove sono")],
      ["massa",tr("Mettere massa"),tr("Crescere, non solo pesare di più")]]},

 {k:"bio",sez:"profilo",tipo:"modulo",
  q:tr("Partiamo da te"),
  /* La frase «il peso è il segnale che dice se il piano funziona» è
     stata tolta il 23/08: puntava tutto sulla bilancia, e per chi
     mantiene o mette massa il peso da solo non dice se le cose vanno
     come devono. Restano i numeri e a cosa servono. */
  sub:tr("Servono a calcolare quanto consumi in un giorno.")},

 /* ── I DETTAGLI DEL CORPO, SE CI SONO (founder, 27/08) ───────────
    «Va inserita la scheda Dettagli, dove l'utente inserisce anche le
    pliche, massa magra, massa grassa: serve per avere esercizi più
    mirati.» Ed è vero anche per il piano: il prompt ha da sempre il
    campo `massa_grassa_pct` e gli arrivava sempre vuoto, perché
    nessuno lo chiedeva prima della prima generazione.
    NON è un magazzino nuovo: scrive nella STESSA visita di Io →
    Misure dello studio, con lo stesso scrittore (misureRegistra). Chi
    compila qui ritrova tutto là, e là lo corregge. Una fonte sola.
    È tutta facoltativa, e lo dice: la maggior parte delle persone
    questi numeri non ce l'ha, e chiederli come obbligatori sarebbe il
    modo più rapido di far chiudere l'app al terzo passo. */
 /* ── PAUSA1 NON STA PIÙ QUI (founder, 29/08) ─────────────────────
    «Piccoli premi ogni 8 risposte per tenere agganciato l'utente:
    l'ultimo è il piano, mancano i primi due.» La pausa era alla
    QUARTA schermata: troppo presto per premiare, e il ritmo era
    3 — 17 — 5 invece di 8 — 8 — il resto. Ora sta dopo gli
    integratori (ottava risposta) e il suo contenuto è un premio
    vero: vedi onb2PremioHTML. */

 {k:"dieta",sez:"alimentazione",tipo:"dieta",
  q:tr("Come mangi, per scelta o abitudine?")},

 /* ── DUE DOMANDE, NON UNA CON DUE COLONNE (founder, 27/08) ──────
    «È professionale affrontarle così? Sarebbe meglio avere due
    tabelle distinte, una per le intolleranze e una per le allergie,
    in due pagine diverse: le allergie inoltre potrebbero essere
    diverse dalle intolleranze.»
    La ragione è clinica prima che grafica. Un'intolleranza è dose ed
    enzimi: chi non tollera il lattosio mangia i latticini delattosati,
    e infatti glieli proponiamo. Un'allergia è la PROTEINA: chi è
    allergico al latte non può toccare il latte senza lattosio.
    Due comportamenti opposti dello stesso motore non possono stare
    nella stessa tabella. E «cibi acidi» non era né l'una né l'altra:
    è una sensibilità, e vive fra i cibi che si preferisce evitare. */
 {k:"intolleranze",sez:"alimentazione",tipo:"multi",none:"niente",altro:true,
  q:tr("Ci sono alimenti che digerisci male?"),
  sub:tr("Intolleranze: è questione di quantità. Le alternative esistono quasi sempre, e te le propongo io."),
  op:[["niente",tr("Nessuna intolleranza"),""]]
     .concat((typeof INTOL_LIST!=="undefined"?INTOL_LIST:[]).map(x=>[x,O2CAP(x),""]))},

 {k:"allergie",sez:"alimentazione",tipo:"multi",none:"niente",altro:true,
  q:tr("Hai allergie alimentari?"),
  sub:tr("Qui non esistono eccezioni né «un assaggio»: quello che segni non comparirà mai, in nessuna forma. Il latte senza lattosio, per esempio, resta latte."),
  op:[["niente",tr("Nessuna allergia"),""]]
     .concat((typeof ALLERG_LIST!=="undefined"?ALLERG_LIST:[]).map(x=>[x,O2CAP(x),""]))},

 /* IL CAMPO SOTTO LE CONDIZIONI ERA «FARMACI» (founder, 24/08):
    «dovrebbe esserci altro per far inserire altre condizioni».
    Aveva ragione due volte. Sotto un elenco di condizioni ci si
    aspetta di poter aggiungere LA PROPRIA, che nell'elenco non c'è —
    e invece l'unico campo libero chiedeva un'altra cosa. I farmaci
    si sono spostati dove stanno bene, accanto agli integratori:
    sono la stessa domanda, «cosa prendi tutti i giorni». */
 {k:"salute",sez:"alimentazione",tipo:"multi",none:"niente",
  testo:{k:"salute_altro",label:tr("Altre condizioni"),ph:tr("es. emicrania, tiroidite — separale con una virgola")},
  q:tr("Condizioni di salute di cui tenere conto?"),
  sub:tr("Servono a scegliere gli alimenti, non a curarle: la parte clinica resta del tuo medico."),
  op:[["niente",tr("Nessuna"),""]]
     .concat((typeof PAT_LIST!=="undefined"?PAT_LIST:[]).map(x=>[x.k,tr(x.l),""]))},

 /* ── INTEGRATORI E FARMACI: mancavano del tutto ─────────────────
    Non è una domanda di cortesia: gli integratori cambiano il piano
    per davvero. Le proteine in polvere entrano nel target proteico
    invece di sommarsi sopra, il ferro non va col caffè, la vitamina D
    vuole grassi nello stesso pasto, i probiotici vogliono fibra. Le
    regole ci sono già (INTEG_REGOLE) e finora giravano a vuoto,
    perché nessuno chiedeva cosa prendi. */
 /* ── LA FREQUENZA STA ACCANTO A OGNI VOCE (founder, 26/08) ──────
    «Intendo un menù a tendina in parte ad ogni integratore, non
    sulla pagina dopo.» Aveva ragione due volte: la domanda sulla
    frequenza arrivava a schermata cambiata, quando l'elenco non si
    vedeva più — e una frequenza sola per tutto non descrive nessuno:
    la vitamina D è quotidiana e la creatina no, nella stessa persona.
    Ora ogni voce spuntata apre la sua tendina, lì. */
 /* ── L'INTEGRAZIONE SI CHIEDE, NON SI DÀ PER SCONTATA ────────────
    Founder, 27/08: «Vorrei che chiedessi se all'utente sta bene
    integrare alcune cose come le proteine in polvere o il ferro,
    perché non tutti vogliono.» È una domanda di rispetto prima che di
    tecnica: c'è chi vuole arrivare ai target col cibo e basta, e
    proporgli una polvere è un modo per fargli chiudere l'app.
    Sta QUI e non su una schermata sua: è la stessa domanda vista da
    un altro lato, e il percorso è già lungo — ventotto schermate. */
 {k:"integratori",sez:"alimentazione",tipo:"integ",none:"nessuno",
  q:tr("Prendi integratori?"),
  sub:tr("Alcuni contano nei target — le proteine in polvere sono proteine — altri vogliono o evitano certi alimenti nello stesso pasto."),
  op:[["nessuno",tr("Nessun integratore"),""]]
     .concat((typeof INTEG_LIST!=="undefined"?INTEG_LIST:[]).map(x=>[x,O2CAP(x),""])),
  gr2:tr("E se i conti non tornassero solo col cibo?"),
  op2:[["si",tr("Puoi propormi un integratore"),tr("Solo quando i target non si coprono")],
       ["chiedi",tr("Scrivimelo, decido io"),tr("Me lo segni nella nota del giorno")],
       ["no",tr("Solo cibo vero"),tr("Non propormi integratori in nessun caso")]]},

 /* ── I FARMACI: UNA DOMANDA A SÉ, E CON IL SUO CONFINE ───────────
    Stavano appesi come campo libero sotto gli integratori, ed è la
    cosa sbagliata due volte: sono un'altra domanda, e sono la domanda
    più delicata del percorso. Nuvia non entra nella terapia, non la
    discute e non la cambia: legge cosa prendi e ne tiene conto a
    tavola — il ferro non va col caffè, la vitamina K di chi prende
    anticoagulanti deve restare COSTANTE, il pompelmo con le statine
    non ci va. Il confine è scritto nella schermata, non sottinteso. */
 /* ── IL PRIMO PREMIO: dopo otto risposte (founder, 29/08) ────────
    La chiave resta `pausa1` — rinominarla romperebbe risposte salvate
    e collaudi per un guadagno estetico — ma la posizione e il senso
    sono nuovi: ottava schermata, e il contenuto è il primo numero che
    l'app RESTITUISCE invece di chiedere. */
 {k:"pausa1",sez:"alimentazione",tipo:"pausa",posa:"festeggia",
  q:tr("Otto risposte. Questo è già tuo."),
  sub:tr("Il primo numero che ti restituisco: da qui in poi ogni risposta lo affina.")},

 /* ── I FARMACI E IL MEDICO, INSIEME (founder, 28/08) ────────────
    Erano due schermate di fila che chiedono la stessa cosa da due
    lati: cosa prendi, e cosa ti ha detto chi ti segue. Il confine
    scritto — «non entro nella terapia» — vale per tutte e due, e
    detto una volta sola pesa meno di detto due. */
 {k:"farmaci",sez:"alimentazione",tipo:"medico",none:"nessuno",altro:true,
  q:tr("Farmaci e indicazioni del medico"),
  sub:tr("Non entro nella terapia e non la cambio: mi serve solo per non metterti nel piatto qualcosa che le va contro. Quello che ti ha detto il medico viene prima di qualunque cosa proponga io."),
  op:[["nessuno",tr("Nessuno"),""]]
     .concat((typeof FARM_LIST!=="undefined"?FARM_LIST:[]).map(x=>[x.k,tr(x.l),""]))},

 /* ── LE REGOLE CHE SEGUI, IN UNA SCHERMATA (founder, 28/08) ─────
    Protocolli e vincoli erano due schermate di fila che chiedono la
    stessa cosa: quali regole segui già, per scelta o per convinzione.
    Restano due liste separate — un digiuno intermittente e un «niente
    maiale» non si mescolano — ma dentro la stessa domanda.
    «Segui o VUOI SEGUIRE» resta la formula del founder (27/08):
    chiedere solo «segui?» taglia fuori chi vorrebbe cominciare
    adesso, ed è proprio il momento in cui lo direbbe. */
 {k:"protocolli",sez:"alimentazione",tipo:"multi",none:"nessuno",
  k2:"vincoli",none2:"nessuno",
  q:tr("Segui regole particolari a tavola?"),
  sub:tr("Uno schema che segui o vuoi seguire, e i vincoli che rispetti. Li applico a ogni proposta, e non ti chiedo perché."),
  gr1:tr("Schemi alimentari"),
  gr1sub:tr("Un modo di mangiare che scegli tu: orienta le proposte e si cambia quando vuoi."),
  op:[["nessuno",tr("Nessuno schema"),""]]
     .concat((typeof PROT_LIST!=="undefined"?PROT_LIST:[]).map(x=>[x.k,tr(x.l).trim(),""])),
  gr2:tr("Vincoli religiosi o etici"),
  /* la riga che spiega la differenza: qui non si «orienta», si VIETA */
  gr2sub:tr("Un'altra cosa: questi non sono preferenze. Quello che segni qui non entra mai nel piano, per nessun motivo."),
  op2:[["nessuno",tr("Nessun vincolo"),""]]
     .concat((typeof REL_LIST!=="undefined"?REL_LIST:[]).map(x=>[x,O2CAP(x),""]))},

 {k:"cibi",sez:"alimentazione",tipo:"cibi",
  q:tr("Cosa eviti e cosa ami"),
  sub:tr("Non intolleranze: gusti. Il piano gira intorno alle prime e punta sulle seconde.")},

 /* La frase diceva «niente più liste» — e la prima cosa dopo era
    un'altra schermata di scelte. Il founder: «ha senso? non credo».
    La pausa adesso dice quello che succede davvero: il cibo è
    raccontato, si passa alla settimana. */
 /* La pausa che stava qui non c'è più (28/08): il blocco
    «alimentazione» è sceso da undici schermate a otto, e un respiro
    dopo otto domande è un respiro che non serve — restano le due
    pause che contano, quella prima delle domande sul corpo e quella
    che avvia la generazione. */
 {k:"corpo",sez:"vita",tipo:"scelta",sensibile:true,
  se:()=>((onb2Stato().ris.bio||{}).gen==="f"),
  q:tr("C'è uno di questi stati, adesso?"),
  sub:tr("Cambiano davvero fabbisogno e porzioni, per il tempo giusto."),
  op:[["no",tr("No, niente di questo"),""],
      ["t1",tr("Gravidanza · 1° trimestre"),""],
      ["t2",tr("Gravidanza · 2° trimestre"),""],
      ["t3",tr("Gravidanza · 3° trimestre"),""],
      ["lactE",tr("Allatto in modo esclusivo"),""],
      ["lactP",tr("Allatto parzialmente"),""]]},

 /* ── L'ATTIVITÀ, RIFATTA (founder, 24/08) ───────────────────────
    «Perché non vedo tutte le scelte di molto sedentario, sedentario
    ecc?» Perché le quattro opzioni parlavano solo di ALLENAMENTI —
    «una o due volte», «cinque o più» — e chi sta fermo tutto il
    giorno ma cammina molto per lavoro non si riconosceva in nessuna.
    Il fabbisogno però lo fa la giornata intera, non le tre ore di
    palestra: adesso ogni riga dice come si passa la giornata E
    quanto ci si allena, che sono le due cose che lo determinano.

    E c'era di peggio: i valori scritti qui — 1,375 e 1,725 — NON
    ESISTONO nella tendina di Regole → Obiettivi (1,2 · 1,3 · 1,35 ·
    1,4 · 1,45 · 1,55). Chi finiva il percorso e poi apriva Regole
    trovava la tendina SENZA NIENTE selezionato, e toccandola
    cambiava il proprio fabbisogno senza saperlo. 1,725 stava
    addirittura sopra il massimo raggiungibile a mano.
    Adesso i valori sono quelli, e sono anche le chiavi di ACT_STEPS:
    così la stessa risposta imposta i passi base, che finora
    restavano a 3.000 qualunque cosa una persona rispondesse. */
 {k:"attivita",sez:"vita",tipo:"giornate",
  /* ── UNA SCHERMATA SOLA PER LE GIORNATE (founder, 26/08) ─────────
     «Dove passano le tue giornate è una pagina duplicata… viene
     chiesta due volte la stessa cosa.» Era già successo il 25/08 e
     l'avevamo «risolto» cambiando i titoli: non bastava, e la terza
     volta non si tenta lo stesso rimedio. Le due domande adesso
     stanno su UNA schermata, una sotto l'altra: quanto ti muovi (da
     lì esce il fabbisogno) e dove passano le giornate (da lì escono
     orari e contesto del piano). Due gruppi, un solo posto, nessuna
     sensazione di déjà-vu. Le chiavi restano `attivita` e `ritmi`:
     tutto quello che le legge — o2Att, i passi base, il turnista —
     continua a funzionare senza saperlo. */
  q:tr("Le tue giornate"),
  sub:tr("Servono due cose: quanto ti muovi, e dove passi il tempo. Il piano si adatta a tutte e due."),
  gr1:tr("Quanto ti muovi, in una settimana normale?"),
  op:[["fermo",tr("Quasi per niente"),tr("Niente sport e poca camminata")],
      ["poco",tr("Poco"),tr("Qualche camminata, nessun allenamento fisso")],
      /* «Un po'» → «Abbastanza» (founder, 27/08): fra «Poco» e
         «Parecchio», «un po'» suonava come un secondo «poco». */
      ["leggero",tr("Abbastanza"),tr("Mi alleno una o due volte a settimana")],
      ["regolare",tr("Parecchio"),tr("Tre o quattro allenamenti a settimana")],
      ["intenso",tr("Molto"),tr("Lavoro fisico, o cinque e più allenamenti")]],
  /* «E dove passano, di solito?» era una frase bruttissima — parole
     del founder, e aveva ragione: si capiva solo dopo aver letto le
     risposte. La domanda vera è quella. */
  gr2:tr("Com'è il tuo lavoro?"),
  op2:[["sedentario",tr("Alla scrivania"),tr("Ufficio, computer, guida")],
      ["inPiedi",tr("In piedi"),tr("Lavoro fisico, cammino molto")],
      ["turni",tr("A turni"),tr("Orari che cambiano di settimana in settimana")],
      ["studente",tr("Tra lezioni e studio"),tr("Orari spezzati, pasti fuori")],
      ["casa",tr("A casa"),tr("Gli orari li decido io")]]},

 {k:"sportPref",sez:"vita",tipo:"multi",none:"nessuno",altro:true,
  q:tr("Quali sport ti piacciono?"),
  sub:tr("Così il tuo allenatore propone cose che faresti davvero, non attività a caso. Puoi segnarne più di uno."),
  op:[["corsa",tr("Corsa"),tr("Corsa, jogging, trail")],
      ["palestra",tr("Palestra"),tr("Pesi, macchinari, functional")],
      ["camminata",tr("Camminata"),tr("Passeggiate, nordic walking")],
      ["nuoto",tr("Nuoto"),tr("Piscina o acque libere")],
      ["ciclismo",tr("Bici"),tr("Strada, mountain bike, cyclette")],
      ["racchetta",tr("Racchetta"),tr("Tennis, padel, squash")],
      ["squadra",tr("Sport di squadra"),tr("Calcio, basket, pallavolo")],
      ["yoga",tr("Yoga o pilates"),tr("Anche stretching, mobilità")],
      ["nessuno",tr("Niente di regolare, per ora"),tr("Si parte da qui")]]},

 /* ── I PASTI FUORI CASA ─────────────────────────────────────────
    Il piano ha già regole diverse per un pasto fuori — niente
    grammature, una riga generica su come comporre il piatto, e gli
    ingredienti che NON entrano nella lista della spesa — e sapere in
    quali giorni succede è l'unico modo per applicarle.
    Finora il percorso non lo chiedeva: quelle regole esistevano e non
    si accendevano mai, e la spesa comprava il pranzo di chi mangia in
    mensa. C'è anche il caso di chi se lo porta da casa, che è
    l'opposto: quel pasto va scritto per intero E comprato. */
 {k:"fuori",sez:"vita",tipo:"fuori",
  q:tr("Ci sono pasti che non fai a casa?"),
  sub:tr("Mensa, bar, ristorante — o la schiscetta che ti prepari. Cambia come li scrivo e cosa finisce nella spesa.")},

 /* ── IL SECONDO PREMIO: dopo altre otto (founder, 29/08) ─────────
    A questo punto l'app sa come mangi, cosa eviti e a cosa sei
    allergico: il premio è la prova che le risposte LAVORANO — tre
    piatti già filtrati su di te, passati dalla stessa rete di
    sicurezza del piano vero (vietatiElenco/vietatoDentro), non da
    una lista decorativa. */
 {k:"pausa2",sez:"vita",tipo:"pausa",posa:"cucina",
  q:tr("Sedici risposte. Guarda cosa ne esce."),
  sub:tr("Tre piatti scelti con quello che mi hai detto finora — è un assaggio, il piano vero arriva alla fine.")},

 {k:"pasti",sez:"vita",tipo:"pasti",
  q:tr("Quali pasti fai davvero?"),
  sub:tr("Il piano non proporrà quelli spenti.")},

 /* ── QUANTO TEMPO HAI, E PER CHI CUCINI (founder, 28/08) ────────
    Erano due schermate di fila, e sono la stessa scena: la cucina.
    Il tempo che hai e le persone a tavola decidono insieme che piatti
    hanno senso — una cena in dieci minuti per quattro persone non è
    la stessa cosa di una per uno. */
 {k:"cucina",sez:"vita",tipo:"famiglia",
  q:tr("Quanto tempo hai per cucinare, e per chi?"),
  sub:tr("Un piano che non entra nella tua settimana non lo segue nessuno."),
  op:[["veloce",tr("Pochissimo"),tr("Cose pronte o da 10 minuti")],
      ["normale",tr("Il giusto"),tr("Mezz'ora, di solito")],
      ["amoCucinare",tr("Mi piace cucinare"),tr("Il tempo lo trovo volentieri")]]},

 {k:"preferenze",sez:"vita",tipo:"preferenze",
  q:tr("Le ultime tre cose per il piano")},

 /* ── I PIANI, PRIMA DELLE DOMANDE PER CONOSCERSI (founder, 23/08) ──
    Sta qui e non alla fine per una ragione precisa: **la scelta
    cambia cosa succede dopo**. Chi resta su Free non ha l'AI, quindi
    non c'è niente da generare — e scoprirlo in fondo, davanti a una
    barra che non parte, sarebbe la peggiore delle sorprese.
    Messa qui, il piano parte in sottofondo mentre la persona
    risponde alle ultime tre domande, esattamente come chiesto.
    È una schermata come le altre: stessa barra, stesse card, stesso
    modo di rispondere. Non un cartellone dei prezzi in mezzo al
    percorso. */
 {k:"piani",sez:"conoscerti",tipo:"piani",
  q:tr("Come vuoi che ti segua?"),
  sub:tr("Da qui dipende come nasce il piano. Si cambia quando vuoi.")},

 /* `genera` sta sulla PAUSA e non sulla schermata dei piani: la
    generazione deve partire DOPO la scelta, perché è la scelta a
    decidere se e come generare. */
 {k:"pausa3",sez:"conoscerti",tipo:"pausa",posa:"cerca",genera:true,
  q:tr("Ho tutto quello che serve al piano."),
  sub:tr("Comincio a scriverlo adesso, mentre rispondi alle ultime domande: qui sotto vedrai a che punto è.")},

 /* ── IL CIBO E IL PERCHÉ, INSIEME (founder, 28/08) ──────────────
    Erano due schermate a scelta multipla nello stesso blocco, dopo
    che il piano è già partito. Sono le due domande che non servono al
    piano ma alla persona: come stai col cibo, e perché proprio
    adesso. Una schermata, due liste. */
 {k:"cibo",sez:"conoscerti",tipo:"multi",none:"sereno",
  k2:"motivazione",
  q:tr("Il cibo e te"),
  sub:tr("Non c'è una risposta giusta, e puoi segnarne più di una. Te lo ricorderò nei giorni storti — sono le tue parole, non le mie."),
  gr1:tr("Che rapporto hai con il cibo"),
  op:[["sereno",tr("Sereno"),tr("Mangio quando ho fame, e va bene così")],
      ["nervoso",tr("Mangio quando sono teso"),tr("Le giornate storte si sentono a tavola")],
      ["noia",tr("Mangio per noia"),tr("Soprattutto la sera, davanti allo schermo")],
      ["sociale",tr("Mangio molto fuori"),tr("Cene, pranzi di lavoro, amici")]],
  gr2:tr("Perché proprio adesso"),
  op2:[["salute",tr("Per la salute"),tr("Analisi, medico, prevenzione")],
      ["energia",tr("Per avere più energia"),tr("Arrivo a sera scarico")],
      ["estetica",tr("Per come mi vedo"),tr("Voglio ritrovarmi allo specchio")],
      ["evento",tr("Ho una data in mente"),tr("Un appuntamento che conta")]]},

 /* ── HAI GIÀ PROVATO, E COM'ERA ANDATA (founder, 28/08) ─────────
    L'esito era una schermata condizionale che seguiva la prima. Sono
    la stessa domanda in due tempi: il secondo gruppo compare qui
    sotto appena dici che hai provato, e sparisce se dici di no.
    Sapere COM'È ANDATA vale quanto sapere che c'è stato un tentativo:
    un piano che ha funzionato finché è durato chiede continuità, uno
    che non ha mai funzionato chiede un approccio diverso. */
 {k:"tentativi",sez:"conoscerti",tipo:"scelta",
  k2:"tentativi_esito",
  se2:()=>{const v=onb2Stato().ris.tentativi;return !!v&&v!=="mai";},
  q:tr("Hai già provato altre diete?"),
  sub:tr("Serve a non riproporti quello che non ha funzionato."),
  op:[["mai",tr("No, è la prima volta"),tr("Comincio da qui")],
      ["qualcuno",tr("Sì, qualche volta"),tr("Qualche periodo, poi ho lasciato")],
      ["molti",tr("Sì, spesso"),tr("Ne ho seguiti parecchi, di tipi diversi")],
      ["yoyo",tr("Sì, e faccio fatica a restarci"),tr("Parto bene e poi si interrompe")]],
  gr2:tr("E com'era andata?"),
  op2:[["funzionato",tr("Aveva funzionato"),tr("Poi la vita si è messa in mezzo")],
      ["ripreso",tr("Peso perso, poi ripreso"),tr("L'effetto fisarmonica")],
      ["parziale",tr("In parte"),tr("Qualche risultato, non quello che speravo")],
      ["male",tr("Non aveva funzionato"),tr("Troppo rigido, o non faceva per me")]]},

 {k:"avvisi",sez:"ricette",tipo:"avvisi",
  q:tr("Quanto vuoi che mi faccia sentire?")},

 {k:"fine",sez:"ricette",tipo:"fine",
  q:tr("Come vuoi che ti segua?"),
  sub:tr("Puoi cambiare idea quando vuoi, da Io.")}
];}

/* I const a livello globale non finiscono su window: qui servono anche
   fuori (collaudi, futuro riuso), quindi si espongono esplicitamente. */
/* Le due tabelle si ricostruiscono al cambio lingua e basta: dentro
   ci sono chiamate a tr(), che deve rispondere con la lingua di ADESSO.
   Costruirle una volta sola, all'avvio, le congelerebbe in italiano. */
let _o2tab=null,_o2sez=null,_o2lang=null;
function ONB2c(){const L=(typeof LANG!=="undefined")?LANG:"it";
  if(_o2lang!==L){_o2lang=L;_o2tab=ONB2t();_o2sez=ONB2_SEZt();}
  return _o2tab;}
function ONB2_SEZc(){ONB2c();return _o2sez;}
/* I const globali non finiscono su window: qui servono anche fuori
   (collaudi, riuso futuro), quindi si espongono come sola lettura. */
try{
  Object.defineProperty(window,"ONB2",{get:ONB2c,configurable:true});
  Object.defineProperty(window,"ONB2_SEZ",{get:ONB2_SEZc,configurable:true});
}catch(e){window.ONB2=ONB2c();window.ONB2_SEZ=ONB2_SEZc();}

/* Stato: nasce con default e non tocca nulla di quello che c'era.
   `maxVisto` esiste perché la barra non deve MAI tornare indietro:
   se torni a correggere una risposta, l'avanzamento resta quello
   raggiunto — l'occhio legge «quanto manca», non «dove sono». */
function onb2Stato(){
  if(!S.onb2||typeof S.onb2!=="object")S.onb2={};
  const o=S.onb2;
  if(o.v!==1)o.v=1;
  if(typeof o.step!=="number"||o.step<0||o.step>=ONB2c().length)o.step=0;
  if(typeof o.maxVisto!=="number"||o.maxVisto<o.step)o.maxVisto=o.step;
  if(!o.ris||typeof o.ris!=="object")o.ris={};
  if(!Array.isArray(o.saltate))o.saltate=[];
  if(o.done!==true)o.done=false;
  if(o.sensibili===undefined)o.sensibili=null;   /* null = mai chiesto */
  return o;}
window.onb2Stato=onb2Stato;

function onb2Salva(){try{save();}catch(e){}}

/* Indice della sezione di una schermata, per la barra segmentata */
function onb2SezIdx(i){
  const k=(ONB2c()[i]||ONB2c()[0]).sez;
  return Math.max(0,ONB2_SEZc().findIndex(s=>s.k===k));}

/* ── Barra segmentata: quattro tratti, uno per sezione ───────────── */
function onb2Barra(){
  const o=onb2Stato(),vis=Math.max(o.step,o.maxVisto);
  const sezCorr=onb2SezIdx(o.step);
  let seg="";
  ONB2_SEZc().forEach((s,si)=>{
    const tot=ONB2c().filter(x=>x.sez===s.k).length;
    const fatti=ONB2c().filter((x,xi)=>x.sez===s.k&&xi<=vis).length;
    const pc=Math.round(Math.min(1,fatti/tot)*100);
    seg+=`<div class="o2seg${si===sezCorr?" ora":""}"><i style="width:${pc}%"></i></div>`;});
  return `<div class="o2top">
    <span class="o2chip">${esc(ONB2_SEZc()[sezCorr].t)}</span>
    <div class="o2segs" role="progressbar" aria-valuenow="${vis+1}" aria-valuemin="1" aria-valuemax="${ONB2c().length}"
      data-passo="${o.step+1}" data-avanzamento="${Math.round((vis+1)/ONB2c().length*100)}">${seg}</div>
  </div>`;}

/* ── Il pulsante del microfono: c'è su ogni schermata, non chiede mai
   il permesso da solo e non promette nulla che non possa mantenere. */
/* ── IL MICROFONO, UNO SOLO ───────────────────────────────────────
   Prima ce n'erano DUE: «Preferisci dirlo a voce?» in mezzo alla
   schermata e «Raccontami tutto a voce» in fondo. Facevano cose
   diverse (una risposta sola contro tutto il percorso), ma da fuori
   sembravano la stessa e uno dei due era di troppo.
   Ne resta uno, nella barra dei comandi: l'icona dice cosa fa, e la
   parola che l'accompagna cambia solo alla prima schermata, dove
   raccontare TUTTO ha senso. */
function onb2Mic(campo){return "";}   /* non più in mezzo alla pagina */

/* PILASTRO (20/08, ribadito 22/08): il microfono vive SOLO nella
   dettatura dei pasti. Nell'onboarding non c'è — né in mezzo alla
   pagina né nella barra. L'interruttore resta dichiarato (non un
   return secco) così il codice sotto è leggibile e il lint pulito. */
const O2_MIC_IN_BARRA=false;
function onb2MicBarra(campo,passo){
  if(!O2_MIC_IN_BARRA)return "";
  const ok=(typeof vocePossibile==="function")&&vocePossibile();
  if(!ok)return "";
  /* IL RACCONTO INTERO ha bisogno dell'AI per essere capito; la
     dettatura di UNA risposta no — quella la fa il telefono.
     Alla prima schermata quindi si offre il racconto SOLO se l'AI
     c'è: offrire un comando che non può funzionare, e poi spiegare
     perché non ha funzionato, è il modo più rapido di far pensare
     che l'app sia rotta. (Trovato dal founder il 19/08: toccava il
     microfono e si sentiva rispondere «mi serve la connessione».) */
  const conAI=(typeof aiOn==="function")&&aiOn();
  const tutto=(passo===0)&&conAI;
  if(passo===0&&!conAI)return "";
  return `<button class="btn ghost small o2mic" id="o2mic_${esc(campo)}" type="button"
    onclick="${tutto?"onb2Racconto()":"onb2Voce('"+esc(campo)+"')"}"
    aria-label="${esc(tutto?tr("Raccontami tutto a voce"):tr("Rispondi a voce"))}">
    ${ic("mic",15)} ${esc(tutto?tr("A voce"):tr("A voce"))}</button>`;}

/* ═══ NIENTE MESSAGGI DI STATO NEL PERCORSO (founder, 27/08) ═══════
   «Ci sono dei messaggi di stato che escono durante l'onboarding:
   possiamo eliminarli?»
   Erano `confermaPasso()`: «Bene, so da dove partire», «Il piano si
   adatterà a queste ore». Nati per dare un ritorno a ogni risposta,
   nel percorso fanno il contrario — coprono la domanda successiva
   mentre la stai leggendo, e a dieci schermate di fila diventano
   dieci interruzioni. Il ritorno c'è già, ed è migliore: la card che
   si accende e la barra che avanza. `confermaPasso` resta viva nel
   resto dell'app, dove un gesto isolato un cenno se lo merita.
   ── Render ───────────────────────────────────────────────────── */
function renderOnb2(){
  const el=document.getElementById("pg-onb2");if(!el)return;
  /* ── PRIMA ANCORA DELL'ACCOUNT: I DOCUMENTI (v15.7.0) ───────────
     Collegare un account Google è già un trattamento di dati:
     chiederlo prima di aver detto come si trattano sarebbe l'ordine
     sbagliato, e un consenso raccolto dopo il fatto non è un
     consenso. Quindi il gate legale sta davanti a tutto. */
  try{
    if(typeof legaleServe==="function"&&legaleServe()){
      el.innerHTML=legaleGateHTML();
      try{if(typeof a11yLega==="function")a11yLega("onb2");}catch(e){}
      return;}
  }catch(e){}
  /* Poi l'account. È la schermata che decide se una
     persona resta, e va prima delle domande — non dopo, quando
     ha già investito dieci minuti e scopre che serviva un
     collegamento. */
  try{
    if(typeof primoServe==="function"&&primoServe()){
      el.innerHTML=primoHTML();
      try{if(typeof a11yLega==="function")a11yLega("onb2");}catch(e){}
      return;}
  }catch(e){}
  const o=onb2Stato(),i=o.step,sc=ONB2c()[i];
  let c="";
  if(sc.tipo==="scelta")c=onb2Scelta(sc);
  else if(sc.tipo==="modulo")c=onb2Modulo(sc);
  else if(sc.tipo==="numero")c=onb2Numero(sc);
  else if(sc.tipo==="multi")c=onb2Multi(sc);
  else if(sc.tipo==="dieta")c=onb2Dieta(sc);
  else if(sc.tipo==="pasti")c=onb2Pasti(sc);
  else if(sc.tipo==="cibi")c=onb2Cibi(sc);
  else if(sc.tipo==="fuori")c=onb2Fuori(sc);
  else if(sc.tipo==="preferenze")c=onb2Pref(sc);
  else if(sc.tipo==="piani")c=onb2Piani(sc);
  else if(sc.tipo==="pausa")c=onb2Pausa(sc);
  else if(sc.tipo==="intoll")c=onb2Intoll(sc);
  else if(sc.tipo==="integ")c=onb2Integ(sc);
  else if(sc.tipo==="giornate")c=onb2Giornate(sc);
  else if(sc.tipo==="medico")c=onb2Medico(sc);
  else if(sc.tipo==="famiglia")c=onb2Famiglia(sc);
  else if(sc.tipo==="avvisi")c=onb2Avvisi(sc);
  else if(sc.tipo==="dove")c=onb2Dove(sc);
  else c=onb2Fine(sc);

  /* ── IL TITOLO DELL'ULTIMA SCHERMATA DICE LA VERITÀ (26/08) ──────
     «Come vuoi che ti segua?» era il titolo della scelta dei piani,
     rimasto appiccicato anche alla chiusura: a piano PRONTO non
     chiedeva niente che avesse senso chiedere. Il titolo ora segue lo
     stato della generazione. */
  let q=sc.q,sub=sc.sub;
  if(sc.tipo==="fine"){
    const g=onb2Gen();
    /* ── «PRONTO» SOLO SE C'È DAVVERO (founder, 27/08) ──────────────
       «Il sistema mi ha detto che il mio piano era pronto e una volta
       entrato non c'era nessun piano.» Lo stato diceva «fatto» un
       istante prima che il piano fosse in mano a qualcuno: bastava
       entrare in quel momento per trovare la pagina vuota e il
       messaggio dell'AI al lavoro. Adesso «pronto» pretende anche il
       piano fra le mani — lo stato da solo non basta più. */
    const inMano=!!(g.piano||(S.genPronto&&S.genPronto.piano));
    if((g.stato==="fatto"||g.stato==="base")&&inMano){q=tr("Il tuo piano è pronto.");sub=tr("Lo trovi in Piano, con la spesa già scritta. Benvenuto.");}
    else if(g.stato==="fatto"||g.stato==="base"){q=tr("Ci siamo quasi.");sub=tr("Il piano è scritto, lo sto sistemando: entra pure, si attiva da solo.");}
    else if(g.stato==="lavoro"){q=tr("Sto scrivendo il tuo piano…");sub=tr("Puoi già entrare: si attiva da solo appena è finito.");}
    else if(g.stato==="errore"){q=tr("Il piano non è arrivato.");
      sub=g.riga||tr("Il diario è già tuo: il piano lo rifai da Piano quando vuoi, in un tocco.");}
    else{q=tr("Ci siamo.");sub=tr("Il diario è pronto: si comincia da lì.");}}
  /* Tutto il percorso vive dentro un riquadro, come il resto
     dell'app (founder, 26/08): stessa carta, stessa distanza dai
     bordi delle altre pagine. */
  el.innerHTML=onb2Barra()+
   `<div class="o2wrap" data-passo="${i+1}" data-chiave="${esc(sc.k)}">
      <div class="card o2card">
        <h1 class="o2q">${esc(q)}</h1>
        ${sub?`<p class="o2sub">${esc(sub)}</p>`:""}
        ${c}
      </div>
      <div class="o2nav o2nav2">
        <button class="btn ghost o2back" type="button" onclick="onb2Indietro()"
          aria-label="${esc(tr("Torna indietro"))}">${esc(tr("Indietro"))}</button>
        ${sc.tipo!=="fine"?`<button class="btn o2next" type="button"
          onclick="onb2AvantiSchermo()">${esc(tr("Avanti"))}</button>`
        :`<button class="btn o2next o2entra" type="button"
          onclick="onb2Chiudi('piano')">${esc(tr("Entra"))}</button>`}
        ${onb2MicBarra(sc.k,i)}
      </div>
    </div>`;
  try{if(typeof a11yLega==="function")a11yLega("onb2");}catch(e){}}
window.renderOnb2=renderOnb2;

/* Schermata a scelta: card larghe, un tocco e si va avanti. */
function onb2Scelta(sc){
  const o=onb2Stato(),val=o.ris[sc.k];
  let h="";
  if(sc.sensibile)h+=onb2Consenso();
  h+=onb2Chip(sc.k);
  h+=`<div class="o2ops" data-gruppo="${esc(sc.k)}">`+sc.op.map(([v,t,d])=>
    `<button class="o2op${val===v?" scelta":""}" type="button" data-v="${esc(v)}"
       aria-pressed="${val===v?"true":"false"}" onclick="onb2Rispondi('${esc(sc.k)}','${esc(v)}')">
       <b>${esc(t)}</b>${d?`<span>${esc(d)}</span>`:""}</button>`).join("")+`</div>`;
  /* ── LA SECONDA DOMANDA, QUANDO SERVE (28/08) ────────────────────
     Una scelta può portarne dietro un'altra che ha senso solo dopo la
     prima («hai già provato?» → «e com'era andata?»). Prima era una
     schermata condizionale a sé: adesso il gruppo compare qui sotto,
     e sparisce se la risposta cambia. Una schermata in meno, e la
     seconda domanda arriva dove la si sta pensando.
     Dal 29/08 il gruppo c'è SEMPRE nel documento e si nasconde con
     `hidden` quando non serve: comparire e sparire riscrivendo la
     pagina era metà del lampo che il founder vedeva. */
  if(sc.k2&&sc.op2){
    const v2=o.ris[sc.k2];
    let serve=true;try{serve=!sc.se2||!!sc.se2();}catch(e){serve=true;}
    h+=`<div data-gruppo2="${esc(sc.k2)}"${serve?"":" hidden"}>
      <div class="o2gr" style="margin-top:16px"><b class="o2grt">${esc(sc.gr2||"")}</b></div>
      <div class="o2ops" data-gruppo="${esc(sc.k2)}">`+sc.op2.map(([v,t,d])=>
      `<button class="o2op${v2===v?" scelta":""}" type="button" data-v="${esc(v)}"
         aria-pressed="${v2===v?"true":"false"}" onclick="onb2Set('${esc(sc.k2)}','${esc(v)}')">
         <b>${esc(t)}</b>${d?`<span>${esc(d)}</span>`:""}</button>`).join("")+`</div></div>`;}
  h+=onb2Mic(sc.k);
  return h;}

/* ── Intolleranze e allergie: due caselle per riga ────────────────
   Ogni alimento ha «Intollerante» e «Allergico», che si escludono a
   vicenda: rispetto allo stesso cibo si è l'uno o l'altro. Un solo
   tocco su una casella accesa la spegne. Chi non ha niente va avanti
   e basta: nessuna casella accesa VUOL DIRE nessuna intolleranza,
   senza costringere a dichiararlo. */
function onb2Intoll(sc){
  const o=onb2Stato();
  const intol=Array.isArray(o.ris.allergie)?o.ris.allergie:[];
  const gravi=Array.isArray(o.ris.allergie_gravi)?o.ris.allergie_gravi:[];
  let h=onb2Chip(sc.k);
  h+=`<div class="o2itesta"><span></span><b>${esc(tr("Intollerante"))}</b><b>${esc(tr("Allergico"))}</b></div>`;
  h+=`<div class="o2ops o2intoll">`+sc.op.map(([v,t])=>{
    const i=intol.includes(v),g=gravi.includes(v);
    return `<div class="o2irow${(i||g)?" scelta":""}" data-riga="${esc(v)}">
      <span class="o2inome">${esc(t)}</span>
      <button class="o2ibox${i?" on":""}" type="button" aria-pressed="${i}"
        aria-label="${esc(trh("{v1}: intollerante",{v1:t}))}"
        onclick="onb2IntollTag('${esc(v)}','intol')">${i?"✓":""}</button>
      <button class="o2ibox o2ibox-a${g?" on":""}" type="button" aria-pressed="${g}"
        aria-label="${esc(trh("{v1}: allergico",{v1:t}))}"
        onclick="onb2IntollTag('${esc(v)}','grave')">${g?"✓":""}</button>
    </div>`;}).join("")+`</div>`;
  h+=`<div class="o2form"><input type="text" id="o2alt" value="${esc(o.ris.allergie_altro||"")}"
      placeholder="${esc(tr("altro, scrivilo tu"))}"></div>`;
  return h;}
window.onb2IntollTag=(v,tipo)=>{
  const o=onb2Stato();
  const A=o.ris.allergie=Array.isArray(o.ris.allergie)?o.ris.allergie.filter(x=>x!=="niente"):[];
  const G=o.ris.allergie_gravi=Array.isArray(o.ris.allergie_gravi)?o.ris.allergie_gravi:[];
  const dentro=(l,x)=>l.indexOf(x)>-1;
  const via=(l,x)=>{const i=l.indexOf(x);if(i>-1)l.splice(i,1);};
  if(tipo==="grave"){ if(dentro(G,v))via(G,v); else{G.push(v);via(A,v);} }
  else{ if(dentro(A,v))via(A,v); else{A.push(v);via(G,v);} }
  onb2Salva();
  /* Sul posto come tutto il resto (29/08): le due caselle di UNA riga
     e la classe della riga. La struttura non cambia mai — sono due
     stati che si escludono, non due forme diverse — quindi non c'è
     niente da ricostruire. */
  const riga=document.querySelector('.o2irow[data-riga="'+(window.CSS&&CSS.escape?CSS.escape(v):v)+'"]');
  if(!riga)return renderOnb2();
  const i2=dentro(A,v),g2=dentro(G,v);
  const box=riga.querySelectorAll(".o2ibox");
  if(box[0]){box[0].classList.toggle("on",i2);box[0].setAttribute("aria-pressed",i2?"true":"false");box[0].textContent=i2?"✓":"";}
  if(box[1]){box[1].classList.toggle("on",g2);box[1].setAttribute("aria-pressed",g2?"true":"false");box[1].textContent=g2?"✓":"";}
  riga.classList.toggle("scelta",i2||g2);};

/* ── Integratori: la frequenza accanto a ogni voce, SEMPRE ────────
   Founder, 27/08: «La doppia colonna deve essere sempre visibile
   negli integratori, non deve essere a scomparsa.» Aveva ragione: una
   tendina che compare solo dopo la spunta fa saltare la riga mentre
   la leggi, e non si capisce che la frequenza si può scegliere finché
   non hai già scelto. Adesso c'è dall'inizio, spenta finché la voce
   non è segnata — come le due colonne di una tabella vera. */
function onb2Integ(sc){
  const o=onb2Stato(),sel=Array.isArray(o.ris[sc.k])?o.ris[sc.k]:[];
  const freq=o.ris.integ_freq||{};
  /* ── «MAI» È LA PRIMA VOCE, E QUELLA DI PARTENZA (founder, 27/08) ──
     «Sull'assunzione degli integratori sul numero di volte dovrebbe
     esserci anche mai, selezionato di default per tutti.»
     Prima le tendine partivano tutte da «tutti i giorni»: una riga
     non spuntata diceva comunque «tutti i giorni», e chi guardava la
     schermata leggeva una risposta che non aveva dato. Ora lo stato
     di partenza è quello vero — non lo prendo — e la tendina e la
     spunta dicono sempre la stessa cosa: scegliere una frequenza
     spunta la voce, scegliere «mai» la toglie. Due comandi che si
     contraddicono sono un difetto, non una libertà. */
  const FR=[["mai",tr("mai")],["giorni",tr("tutti i giorni")],["quasi",tr("quasi tutti i giorni")],["saltuario",tr("qualche volta")]];
  let h=onb2Chip(sc.k);
  /* Niente testata «Ogni quanto» (founder, 27/08): le tendine lo dicono
     da sole, e una riga di intestazione sopra una lista di spunte è una
     colonna che si spiega da sé. */
  h+=`<div class="o2ops o2multi" data-multi="${esc(sc.k)}">`+sc.op.map(([v,t,d])=>{
    const on=sel.includes(v);
    /* «Nessun integratore» prende la riga intera: chiedere ogni quanto
       non prendi niente non vuol dire nulla. */
    if(v==="nessuno")
      return `<div class="o2irowi o2irowi-piena${on?" scelta-riga":""}" data-riga="${esc(v)}"><button class="o2op o2opm${on?" scelta":""}" type="button" data-v="${esc(v)}"
        onclick="onb2Toggle('${esc(sc.k)}','${esc(v)}')" aria-pressed="${on}">
        <i class="o2box" aria-hidden="true">${on?"✓":""}</i>
        <span class="o2opt"><b>${esc(t)}</b></span></button></div>`;
    /* -- LA TENDINA NASCE ATTIVA (founder, 27/08) -----------------
       «Devono essere da subito attive anche le colonne della
       frequenza, perche' il sistema rirenderizza la pagina ogni volta
       che l'utente clicca su un integratore. Si vede il rerender con
       un effetto fastidioso dove la pagina scompare e riappare per un
       attimo: non voglio venga rirenderizzata, deve essere subito
       pronta e definitiva.»
       Era l'accendersi della tendina a costringere al ridisegno: la
       spunta cambiava la STRUTTURA della riga. Se la tendina c'e'
       sempre ed e' sempre viva, la struttura non cambia mai e la
       spunta si aggiorna sul posto come in tutte le altre schermate.
       In piu' scegliere una frequenza adesso SPUNTA la voce: dire
       «tutti i giorni» di una cosa che non prendi non vuol dire
       niente, e nessuno lo farebbe per sbaglio. */
    const tendina=`<select class="o2ifreq" aria-label="${esc(trh("Ogni quanto: {v1}",{v1:t}))}"
          onchange="onb2IntegFreq('${esc(v)}',this.value)" onclick="event.stopPropagation()">${
          FR.map(([fv,ft])=>`<option value="${fv}"${onb2Freq(freq,v,sel)===fv?" selected":""}>${esc(ft)}</option>`).join("")}</select>`;
    return `<div class="o2irowi${on?" scelta-riga":""}" data-riga="${esc(v)}"><button class="o2op o2opm${on?" scelta":""}" type="button" data-v="${esc(v)}"
       onclick="onb2Toggle('${esc(sc.k)}','${esc(v)}')" aria-pressed="${on}">
       <i class="o2box" aria-hidden="true">${on?"✓":""}</i>
       <span class="o2opt"><b>${esc(t)}</b>${d?`<span>${esc(d)}</span>`:""}</span></button>${tendina}</div>`;
    }).join("")+`</div>`;
  /* il secondo gruppo: se i conti non tornano, ti va di integrare? */
  if(sc.op2)h+=`<div class="o2gr"><b class="o2grt">${esc(sc.gr2)}</b>
    <div class="o2ops" data-gruppo="integrareOk">`+sc.op2.map(([v,t,d])=>
    `<button class="o2op${o.ris.integrareOk===v?" scelta":""}" type="button" data-v="${esc(v)}"
       aria-pressed="${o.ris.integrareOk===v?"true":"false"}" onclick="onb2Set('integrareOk','${esc(v)}')">
       <b>${esc(t)}</b>${d?`<span>${esc(d)}</span>`:""}</button>`).join("")+`</div></div>`;
  return h;}
/* Ogni quanto prende QUESTO integratore: un lettore solo, usato dalla
   tendina, dal travaso e dai collaudi. Senza risposta scritta vale la
   spunta: spuntato = tutti i giorni (era così prima del «mai» e i
   percorsi lasciati a metà devono continuare a valere), non spuntato =
   mai. */
function onb2Freq(freq,v,sel){
  const f=(freq||{})[v];
  if(f)return f;
  return (Array.isArray(sel)&&sel.includes(v))?"giorni":"mai";}
window.onb2IntegFreq=(v,f)=>{const o=onb2Stato();
  (o.ris.integ_freq=o.ris.integ_freq||{})[v]=f;onb2Salva();
  /* toccare la tendina di una voce non spuntata vuol dire «questo lo
     prendo, e lo prendo cosi'»: si spunta da sola, sul posto.
     E «mai» fa l'opposto: toglie la spunta. La tendina e la spunta
     non possono dire due cose diverse della stessa riga. */
  const sel=Array.isArray(o.ris.integratori)?o.ris.integratori:[];
  if(f==="mai"){if(sel.includes(v))onb2Toggle("integratori",v);}
  else if(!sel.includes(v))onb2Toggle("integratori",v);};

/* ── I dettagli del corpo: tutti facoltativi ──────────────────────
   Le pliche stanno dietro una spunta, come in Io: da soli non si
   prendono, servono le pinze e una mano esperta — offrirle a tutti
   sarebbe una fila di campi che nessuno può compilare. */
/* I campi degli «altri numeri»: vivono qui perché adesso stanno
   dentro la schermata dei numeri del corpo (28/08), ma restano una
   funzione sola — il giorno che tornano una schermata a sé, si
   richiama e basta. */
function onb2DettagliCampi(){
  const o=onb2Stato(),m=o.ris.misure||{};
  const P=(typeof PLICHE!=="undefined")?PLICHE:[];
  const num=(id,lab,unita,val)=>`<div><label>${esc(tr(lab))}</label>
    <input type="number" inputmode="decimal" step="0.1" id="${id}" value="${val!=null?esc(String(val)):""}" placeholder="${esc(unita)}"></div>`;
  /* girovita e fianchi in pollici per chi vive in pollici — le pliche
     restano in millimetri ovunque, che è come si legge un plicometro */
  const uL=(typeof unitaLungh==="function")?unitaLungh():"cm";
  const vestiC=(x)=>(x==null)?null
    :((typeof imperiale==="function"&&imperiale())?Math.round(x*0.3937007874*10)/10:x);
  let h="";
  h+=`<div class="o2form"><div class="grid2">
    ${num("o2dFat","Massa grassa","%",m.fat)}
    ${num("o2dMus","Massa magra","%",m.mus)}
  </div>
  <div class="grid2">
    ${num("o2dVita","Girovita",uL,vestiC((m.circ||{}).vita))}
    ${num("o2dFianchi","Fianchi",uL,vestiC((m.circ||{}).fianchi))}
  </div>
  <label class="ckline" style="margin-top:12px"><input type="checkbox" id="o2dPl" ${m.conPliche?"checked":""}
    onchange="var b=document.getElementById('o2dPliche');if(b)b.style.display=this.checked?'block':'none'">
    ${esc(tr("Ho le pliche misurate da un professionista"))}</label>
  <div id="o2dPliche" style="display:${m.conPliche?"block":"none"}">
    <label>${esc(tr("Pliche"))} <small style="font-weight:400;color:var(--grigio)">mm</small></label>
    <div class="grid2">${P.map(([k,lab])=>num("o2dP_"+k,lab,"mm",(m.pliche||{})[k])).join("")}</div>
  </div></div>`;
  return h;}

/* ── CHI ALTRO MANGIA A CASA ───────────────────────────────────────
   Le stesse tre informazioni di Regole → Chi altro mangia a casa
   (nome, sesso, età) e gli stessi due interruttori che l'app aveva
   già: quello della spesa (S.shopFor, in Spesa) e quello nuovo del
   piano. Qui si chiedono, lì si correggono: una fonte sola.
   L'età si scrive in ANNI e non con il calendario: la data di
   nascita di un figlio, su un telefono, è la cosa più scomoda da
   inserire che ci sia. L'app la converte in data appena travasa, così
   l'età continua a crescere da sola ogni anno (vedi etaToDob).
   Il nome è facoltativo: chi non lo scrive resta «bambino di 8 anni»
   e le porzioni funzionano lo stesso. */
function onb2Fam(){
  const o=onb2Stato();
  const f=o.ris.famiglia||(o.ris.famiglia={con:null,lista:[],piano:true,spesa:true});
  if(!Array.isArray(f.lista))f.lista=[];
  return f;}
function onb2FamRiga(m,i){
  return `<div class="famrow">
    <input type="text" class="fnome" placeholder="${esc(tr("Nome"))}" value="${esc(m.nome||"")}"
      onchange="onb2FamSet(${i},'nome',this.value)" aria-label="${esc(tr("Nome"))}">
    <select class="fsex" aria-label="${esc(tr("Sesso"))}" onchange="onb2FamSet(${i},'gender',this.value)">
      <option value="f"${m.gender!=="m"?" selected":""}>F</option>
      <option value="m"${m.gender==="m"?" selected":""}>M</option></select>
    <input type="text" class="fdob" inputmode="numeric" maxlength="10" placeholder="${esc(tr("gg/mm/aaaa"))}"
      value="${esc(m.dob?dobPretty(m.dob):"")}" oninput="dateMask(this)"
      onchange="onb2FamSet(${i},'dob',this.value)" aria-label="${esc(tr("Data di nascita"))}">
    <button class="ibtn" type="button" title="${esc(tr("Togli"))}" onclick="onb2FamDel(${i})">✕</button></div>`;}
function onb2FamBox(){
  const f=onb2Fam();
  return f.lista.map((m,i)=>onb2FamRiga(m,i)).join("");}
function onb2Famiglia(sc){
  const o=onb2Stato(),f=onb2Fam();
  /* il tempo per cucinare, che stava in una schermata sua (28/08) */
  const tempo=(sc.op||[]).map(([v,t,d])=>
    `<button class="o2op${o.ris.cucina===v?" scelta":""}" type="button" data-cuc="${esc(v)}"
       onclick="onb2CucSet('${esc(v)}')"><b>${esc(t)}</b><span>${esc(d)}</span></button>`).join("");
  const B=(v,t,d)=>`<button class="o2op${f.con===v?" scelta":""}" type="button" data-fam="${v?1:0}"
     onclick="onb2FamCon(${v?1:0})"><b>${esc(t)}</b><span>${esc(d)}</span></button>`;
  return onb2Chip(sc.k)+
  `<div class="o2gr"><b class="o2grt">${esc(tr("Quanto tempo hai"))}</b></div>
   <div class="o2ops">${tempo}</div>
   <div class="o2gr" style="margin-top:16px"><b class="o2grt">${esc(tr("Per chi cucini"))}</b></div>
   <div class="o2ops">
     ${B(false,tr("Cucino solo per me"),tr("Piano e spesa per una persona"))}
     ${B(true,tr("Mangiamo insieme"),tr("Dimmi chi c'è: cambio la spesa, non le tue porzioni"))}
   </div>
   <div id="o2famBox" class="o2form" style="${f.con===true?"":"display:none"}">
     <label>${esc(tr("Chi altro mangia a casa"))}</label>
     <div id="o2famRighe">${onb2FamBox()}</div>
     <button class="btn ghost small" type="button" onclick="onb2FamAdd()">${esc(tr("+ Aggiungi una persona"))}</button>
     <label class="ckline" style="margin-top:12px"><input type="checkbox" id="o2famRicette" ${f.piano!==false?"checked":""}
       onchange="onb2FamFlag('piano',this.checked)"> ${esc(tr("Scegli piatti che posso cucinare per tutti"))}</label>
     <label class="ckline"><input type="checkbox" id="o2famSpesa" ${f.spesa!==false?"checked":""}
       onchange="onb2FamFlag('spesa',this.checked)"> ${esc(tr("La spesa la faccio per tutti"))}</label>
   </div>
   <div class="hint">${tr("Le porzioni del piano restano tue: le decidono i tuoi numeri, non quanti siete a tavola. Chi mangia con te cambia la spesa e mi fa scegliere piatti da cucinare una volta sola.")}</div>`;}
/* La scelta accende o spegne il riquadro SUL POSTO: nessun ridisegno
   della pagina, come per le spunte e per le tendine degli integratori. */
window.onb2CucSet=(v)=>{
  const o=onb2Stato();o.ris.cucina=v;onb2Salva();
  document.querySelectorAll(".o2op[data-cuc]").forEach(b=>
    b.classList.toggle("scelta",b.getAttribute("data-cuc")===v));};
window.onb2FamCon=(v)=>{
  const f=onb2Fam();f.con=!!v;
  if(f.con&&!f.lista.length)f.lista.push({nome:"",gender:"f",dob:""});
  onb2Salva();
  const box=document.getElementById("o2famBox");
  const righe=document.getElementById("o2famRighe");
  if(righe)righe.innerHTML=onb2FamBox();
  if(box)box.style.display=f.con?"":"none";
  document.querySelectorAll('.o2op[data-fam]').forEach(b=>{
    const on=(b.getAttribute("data-fam")==="1")===f.con;
    b.classList.toggle("scelta",on);});
  if(!box)renderOnb2();};
window.onb2FamAdd=()=>{
  const f=onb2Fam();f.lista.push({nome:"",gender:"f",dob:""});onb2Salva();
  const righe=document.getElementById("o2famRighe");
  if(righe)righe.insertAdjacentHTML("beforeend",onb2FamRiga(f.lista[f.lista.length-1],f.lista.length-1));
  else renderOnb2();};
window.onb2FamDel=(i)=>{
  const f=onb2Fam();f.lista.splice(i,1);onb2Salva();
  /* qui il ridisegno serve davvero: togliendo una riga cambiano gli
     indici di tutte quelle sotto, e un indice sbagliato cancella la
     persona sbagliata. Si ridisegna il solo riquadro, non la pagina. */
  const righe=document.getElementById("o2famRighe");
  if(righe)righe.innerHTML=onb2FamBox();else renderOnb2();};
window.onb2FamSet=(i,k,v)=>{
  const f=onb2Fam();if(!f.lista[i])return;
  /* ── LA DATA VERA, NON GLI ANNI (founder, 28/08) ────────────────
     «Sulla famiglia metti le date intere.» Con gli anni l'app
     costruiva una data approssimata — oggi meno N anni — e il
     compleanno finiva nel giorno in cui si compilava: l'età si
     aggiornava lo stesso, ma la fascia (4-9, 10-14) poteva cambiare
     con mesi di anticipo o di ritardo. E si scrive, non si sfoglia:
     è la stessa regola della propria data di nascita, per la stessa
     ragione — su un telefono il calendario per il 2016 è decine di
     tocchi. */
  if(k==="dob"){
    const t=String(v||"").trim();
    if(!t){delete f.lista[i].dob;onb2Salva();return;}
    const d=(typeof dobParse==="function")?dobParse(t):"";
    if(d)f.lista[i].dob=d;
  }else f.lista[i][k]=(k==="nome")?String(v||"").trim().slice(0,24):v;
  onb2Salva();};
window.onb2FamFlag=(k,v)=>{const f=onb2Fam();f[k]=!!v;onb2Salva();};

/* ── DOVE SEI: lingua, paese, valuta, unità ───────────────────────
   Quattro campi, due dei quali si compilano da soli: scegliendo il
   paese arrivano la valuta e le unità di casa, che restano
   cambiabili — in Svizzera si paga in franchi ma chi lavora a Chiasso
   ragiona in euro, e un italiano che vive a Londra pesa la carne in
   grammi da tutta la vita.
   La ricerca sul paese non è un vezzo: duecento voci in una tendina
   sono una lista da scorrere col pollice per venti secondi. */
function onb2Dove(sc){
  const o=onb2Stato(),r=o.ris.dove||{};
  const L=(typeof LINGUE!=="undefined")?LINGUE:[["it","Italiano"],["en","English"]];
  const paese=r.paese||(typeof paeseSuggerito==="function"?paeseSuggerito():"IT");
  const P=(typeof paeseDi==="function")?paeseDi(paese):["IT","Italia","EUR","metrico"];
  const val=r.valuta||P[2], uni=r.unita||P[3];
  const lingua=r.lingua||((typeof LANG!=="undefined")?LANG:"it");
  const paesi=(typeof PAESI!=="undefined")?PAESI:[];
  const valute=(typeof VALUTE!=="undefined")?VALUTE:[];
  return onb2Chip(sc.k)+
  `<div class="o2form">
     <label>${esc(tr("Lingua"))}</label>
     <div class="o2ops o2ling">${L.map(x=>
       `<button class="o2op${lingua===x[0]?" scelta":""}" type="button" data-ling="${esc(x[0])}"
          onclick="onb2DoveLingua('${esc(x[0])}')"><b>${esc(x[1])}</b></button>`).join("")}</div>

     <label for="o2cerca" style="margin-top:16px">${esc(tr("Dove vivi"))}</label>
     <input type="search" id="o2cerca" inputmode="search" autocomplete="off"
       placeholder="${esc(tr("cerca il tuo paese"))}" oninput="onb2DoveCerca(this.value)">
     <select id="o2paese" size="1" onchange="onb2DovePaese(this.value)">${
       paesi.map(p=>`<option value="${esc(p[0])}"${p[0]===paese?" selected":""}>${esc(tr(p[1]))}</option>`).join("")}</select>

     <div class="grid2" style="margin-top:16px">
       <div>
         <label for="o2valuta">${esc(tr("Valuta"))}</label>
         <select id="o2valuta" onchange="onb2DoveVal(this.value)">${
           valute.map(v=>`<option value="${esc(v[0])}"${v[0]===val?" selected":""}>${esc(v[0])} · ${esc(tr(v[2]))}</option>`).join("")}</select>
       </div>
       <div>
         <label for="o2unita">${esc(tr("Unità di misura"))}</label>
         <select id="o2unita" onchange="onb2DoveUni(this.value)">
           <option value="metrico"${uni==="metrico"?" selected":""}>${esc(tr("Chili e centimetri"))}</option>
           <option value="imperiale"${uni==="imperiale"?" selected":""}>${esc(tr("Libbre e piedi"))}</option>
         </select>
       </div>
     </div>
     <span class="o2hint">${tr("Il paese decide i prezzi e i prodotti che ti propongo per la spesa, e i piatti che si trovano dove sei. <b>Non converto valute</b>: i prezzi restano nei tuoi soldi.")}</span>
   </div>`;}

/* La ricerca filtra la tendina invece di aprire un secondo elenco:
   una lista sola, quella che si sta già guardando. */
window.onb2DoveCerca=(q)=>{
  const sel=document.getElementById("o2paese");if(!sel)return;
  const t=String(q||"").trim().toLowerCase();
  let primo=null;
  [...sel.options].forEach(op=>{
    const ok=!t||op.textContent.toLowerCase().indexOf(t)>=0;
    op.hidden=!ok;if(ok&&!primo)primo=op;});
  if(primo&&t)  {sel.value=primo.value;onb2DovePaese(primo.value);}};

/* Scegliendo il paese arrivano valuta e unità: non si sovrascrive
   una scelta fatta a mano, si propone quella di casa a chi non ha
   ancora deciso niente. */
window.onb2DovePaese=(k)=>{
  const o=onb2Stato(),r=(o.ris.dove=o.ris.dove||{});
  const P=paeseDi(k);
  r.paese=P[0];
  if(!r.valutaMano)r.valuta=P[2];
  if(!r.unitaMano)r.unita=P[3];
  onb2Salva();
  const v=document.getElementById("o2valuta"),u=document.getElementById("o2unita");
  if(v)v.value=r.valuta;
  if(u)u.value=r.unita;};
window.onb2DoveVal=(v)=>{const o=onb2Stato(),r=(o.ris.dove=o.ris.dove||{});
  r.valuta=v;r.valutaMano=true;onb2Salva();};
window.onb2DoveUni=(v)=>{const o=onb2Stato(),r=(o.ris.dove=o.ris.dove||{});
  r.unita=v;r.unitaMano=true;onb2Salva();};
window.onb2DoveLingua=(l)=>{
  const o=onb2Stato(),r=(o.ris.dove=o.ris.dove||{});
  r.lingua=l;o.ris.lingua=l;onb2Salva();
  /* la lingua si applica SUBITO: il resto della schermata cambia
     sotto gli occhi, ed è la prova che la scelta ha funzionato */
  try{if(typeof langSet==="function"&&l!==LANG){langSet(l);return;}}catch(e){}
  document.querySelectorAll(".o2op[data-ling]").forEach(b=>
    b.classList.toggle("scelta",b.getAttribute("data-ling")===l));};

/* ── QUANTE NOTIFICHE, E I DATI D'USO ─────────────────────────────
   Due domande sole, e sono di natura opposta: la prima è un limite
   che l'app si dà (quante volte può farsi sentire), la seconda è una
   cosa che chiediamo noi. Per questo la seconda parte da SPENTA e
   dice per intero cosa manda: un elenco, non una formula.
   Le tre risposte sulle notifiche non sono etichette: diventano il
   tetto settimanale vero (`notifTetto()`), quello che il cancello
   `curaSiPuo` legge prima di lasciar passare qualunque avviso. */
function onb2Avvisi(sc){
  const o=onb2Stato();
  const a=o.ris.avvisi||(o.ris.avvisi={quante:"normale",usi:false});
  const B=(v,t,d)=>`<button class="o2op${a.quante===v?" scelta":""}" type="button"
     data-avv="${esc(v)}" onclick="onb2AvvSet('${esc(v)}')"><b>${esc(t)}</b><span>${esc(d)}</span></button>`;
  return onb2Chip(sc.k)+
  `<div class="o2ops">
     ${B("normale",tr("Quando serve davvero"),tr("Al massimo due a settimana, mai in due giorni di fila"))}
     ${B("poche",tr("Il meno possibile"),tr("Una a settimana, solo le cose importanti"))}
     ${B("nessuna",tr("Nessuna notifica"),tr("Non ti scrivo mai: apri l'app quando vuoi tu"))}
   </div>
   <div class="hint">${tr("Il permesso del telefono non te lo chiedo adesso: lo chiede lui, la prima volta che serve. E non ti scriverò mai del peso, della serie o di quanto hai mangiato — su quelle tre cose non si notifica, mai.")}</div>

   <div class="o2form" style="margin-top:16px">
     <label class="ckline"><input type="checkbox" id="o2usi" ${a.usi?"checked":""}
       onchange="onb2AvvUsi(this.checked)"> ${esc(tr("Mandami i dati d'uso anonimi"))}</label>
     <div class="hint">${tr("Servono a rispondere a una domanda sola, che decide se questa app ha senso: <b>dopo quanti giorni si smette?</b>")}
     <br><br>${tr("Esce questo, e nient'altro: un numero casuale che non sei tu, la versione dell'app, da quanti giorni ce l'hai, quanti giorni l'hai usata, quante spunte hai messo e quante richieste sono andate all'AI.")}
     <br><br><b>${tr("Non esce niente di tuo: né peso, né cibo, né nome, né note, né dati di salute.")}</b>
     ${tr("Si spegne quando vuoi da Sistema, e da lì puoi anche vedere esattamente cosa verrebbe mandato.")}</div>
   </div>`;}
window.onb2AvvSet=(v)=>{
  const o=onb2Stato();(o.ris.avvisi=o.ris.avvisi||{}).quante=v;onb2Salva();
  /* sul posto, come tutte le altre scelte del percorso */
  document.querySelectorAll(".o2op[data-avv]").forEach(b=>
    b.classList.toggle("scelta",b.getAttribute("data-avv")===v));};
window.onb2AvvUsi=(v)=>{
  const o=onb2Stato();(o.ris.avvisi=o.ris.avvisi||{}).usi=!!v;onb2Salva();};

/* ── Le indicazioni del medico: il campo, e il confine scritto ─────
   È la sola schermata del percorso in cui Nuvia si mette
   esplicitamente in secondo piano. Il riquadro non è una nota a piè
   di pagina: sta SOPRA il campo, perché quello che deve arrivare
   prima è il confine, non la richiesta. */
/* Farmaci e indicazioni del medico: una schermata sola (28/08).
   Sopra la lista dei farmaci — che serve a evitare le interazioni col
   cibo — sotto il campo libero con quello che ha detto il medico, che
   al modello arriva come VINCOLANTE. Erano due schermate di fila che
   chiedevano la stessa cosa da due lati, e il confine («non entro
   nella terapia») andava scritto due volte per dire una cosa sola. */
function onb2Medico(sc){
  const o=onb2Stato();
  const sel=Array.isArray(o.ris.farmaci)?o.ris.farmaci:[];
  const lista=(sc.op||[]).map(([v,t,d])=>{
    const on=sel.includes(v);
    return `<button class="o2op o2opm${on?" scelta":""}" type="button" data-v="${esc(v)}"
       onclick="onb2Toggle('farmaci','${esc(v)}')" aria-pressed="${on}">
       <i class="o2box" aria-hidden="true">${on?"✓":""}</i>
       <span class="o2opt"><b>${esc(t)}</b>${d?`<span>${esc(d)}</span>`:""}</span></button>`;}).join("");
  return onb2Chip(sc.k)+
   `<div class="o2conf">${esc(tr("Nuvia non è un medico e non sostituisce nessuna cura. Se il tuo medico ti ha detto qualcosa sull'alimentazione, quello che scrivi qui vale più di ogni mia proposta: non lo tolgo e non lo discuto."))}</div>
    <div class="o2gr"><b class="o2grt">${esc(tr("Farmaci che prendi con continuità"))}</b></div>
    <div class="o2ops o2multi" data-multi="farmaci">${lista}</div>
    <div class="o2form">
      <input type="text" id="o2alt" value="${esc(o.ris.farmaci_altro||"")}"
        placeholder="${esc(tr("altro, scrivilo tu"))}">
      <label style="margin-top:16px">${esc(tr("E cosa ti ha detto il medico, con parole tue"))}</label>
      <textarea id="o2med" rows="4" placeholder="${esc(tr("es. poco sale per la pressione · almeno due volte a settimana il pesce · niente pompelmo con la statina"))}">${esc(o.ris.medico||"")}</textarea>
    </div>
    <div class="hint">${esc(tr("Se non prendi niente e non ti ha detto niente di particolare, vai avanti: non serve scrivere nulla."))}</div>`;}


/* ── Le giornate: due gruppi, una schermata (vedi la nota nella
   tabella). La scelta NON avanza da sola: coi gruppi sono due, si
   avanza con «Avanti» quando ci sono tutte e due le risposte. */
function onb2Giornate(sc){
  const o=onb2Stato();
  const gruppo=(titolo,ops,k)=>`<div class="o2gr"><b class="o2grt">${esc(titolo)}</b>
    <div class="o2ops" data-gruppo="${esc(k)}">`+ops.map(([v,t,d])=>
    `<button class="o2op${o.ris[k]===v?" scelta":""}" type="button" data-v="${esc(v)}"
       aria-pressed="${o.ris[k]===v?"true":"false"}" onclick="onb2Set('${k}','${esc(v)}')">
       <b>${esc(t)}</b>${d?`<span>${esc(d)}</span>`:""}</button>`).join("")+`</div></div>`;
  return onb2Chip("attivita")
    +gruppo(sc.gr1,sc.op,"attivita")
    +gruppo(sc.gr2,sc.op2,"ritmi");}
/* ── UNA SCELTA NON RIDISEGNA LA PAGINA (founder, 29/08) ───────────
   «Queste tre pagine vengono rirenderizzate con un effetto fastidioso:
   fai in modo che quando l'utente le vede siano già complete e che
   nessuna scelta faccia rirenderizzare la pagina.»
   È la stessa correzione già fatta per le spunte multiple il 25/08 e
   per le tendine degli integratori il 27/08, arrivata all'ultimo
   posto in cui era rimasta: i gruppi a scelta singola. Cambiava lo
   stato e poi rifaceva TUTTO l'innerHTML per accendere una card.
   Adesso si accende la card e basta — il resto della pagina non si
   muove, e lo scorrimento nemmeno.
   Il ripiego (renderOnb2) resta per il caso in cui il gruppo non si
   trovi: meglio un ridisegno che una scelta persa. */
function onb2SegnaScelta(k,v){
  const g=document.querySelector('.o2ops[data-gruppo="'+(window.CSS&&CSS.escape?CSS.escape(k):k)+'"]');
  if(!g)return false;
  g.querySelectorAll(".o2op").forEach(b=>{
    const on=b.getAttribute("data-v")===String(v);
    b.classList.toggle("scelta",on);
    b.setAttribute("aria-pressed",on?"true":"false");});
  return true;}
window.onb2SegnaScelta=onb2SegnaScelta;

/* Il secondo gruppo che dipende dal primo («hai già provato?» → «e
   com'era andata?») c'è SEMPRE nel documento: quando non serve si
   nasconde con `hidden`, che è un attributo, non una ricostruzione.
   Prima compariva e spariva riscrivendo la pagina — ed era l'altro
   motivo del lampo. */
function onb2Gruppo2Aggiorna(sc){
  if(!sc||!sc.k2)return;
  const box=document.querySelector('[data-gruppo2="'+(window.CSS&&CSS.escape?CSS.escape(sc.k2):sc.k2)+'"]');
  if(!box)return;
  let serve=true;
  try{serve=!sc.se2||!!sc.se2();}catch(e){serve=true;}
  box.hidden=!serve;}
window.onb2Gruppo2Aggiorna=onb2Gruppo2Aggiorna;

window.onb2Set=(k,v)=>{const o=onb2Stato();o.ris[k]=v;onb2Salva();
  /* niente messaggio di stato: vedi la nota in cima al file */
  if(!onb2SegnaScelta(k,v))renderOnb2();};

/* ── Multi-selezione: si tocca più di una card, «Avanti» conferma. ──
   La voce `none` («nessuna») è esclusiva: toccarla spegne le altre,
   toccarne un'altra spegne lei. Con `altro:true` c'è il campo libero,
   con `testo:{…}` un campo dedicato (i farmaci). */
function onb2Multi(sc){
  const o=onb2Stato(),sel=Array.isArray(o.ris[sc.k])?o.ris[sc.k]:[];
  let h="";
  if(sc.sensibile)h+=onb2Consenso();
  h+=onb2Chip(sc.k);
  /* Il quadratino non è decorazione: è l'unica cosa che dice «puoi
     sceglierne più di una» prima che la persona provi. */
  /* data-v serve al tocco senza il lampo (vedi onb2Toggle) */
  h+=`<div class="o2ops o2multi" data-multi="${esc(sc.k)}">`+sc.op.map(([v,t,d])=>
    `<button class="o2op o2opm${sel.includes(v)?" scelta":""}" type="button" data-v="${esc(v)}" onclick="onb2Toggle('${esc(sc.k)}','${esc(v)}')"
       aria-pressed="${sel.includes(v)}"><i class="o2box" aria-hidden="true">${sel.includes(v)?"✓":""}</i>
       <span class="o2opt"><b>${esc(t)}</b>${d?`<span>${esc(d)}</span>`:""}</span></button>`).join("")+`</div>`;
  if(sc.altro)h+=`<div class="o2form"><input type="text" id="o2alt" value="${esc(o.ris[sc.k+"_altro"]||"")}"
      placeholder="${esc(tr("altro, scrivilo tu"))}"></div>`;
  if(sc.testo)h+=`<div class="o2form"><label>${esc(sc.testo.label)}</label>
      <input type="text" id="o2txtx" value="${esc(o.ris[sc.testo.k]||"")}" placeholder="${esc(sc.testo.ph||"")}"></div>`;
  /* ── DUE LISTE, UNA SCHERMATA (28/08) ────────────────────────────
     Serve ad accorpare le domande che chiedono la stessa cosa da due
     lati (schemi e vincoli, il cibo e il perché). Le liste restano
     SEPARATE — mescolarle vorrebbe dire perdere la differenza fra un
     protocollo e una convinzione — ma la schermata è una.
     `op2` esisteva già per un gruppo a scelta singola (gli
     integratori): qui è a scelta multipla e ha una chiave sua. */
  if(sc.k2&&sc.op2){
    /* ── I VINCOLI COERENTI CON LA DIETA ARRIVANO GIÀ SPUNTATI ─────
       (founder, 29/08): «un vegetariano/vegano troverà questi vincoli
       etici già spuntati, così come un pescetariano?» Adesso sì: la
       dieta si sceglie DUE schermate prima, e chi ha detto «vegana»
       non deve rispuntare «niente carne» come se non l'avesse già
       detto. Il suggerimento si SCRIVE nello stato (non solo a
       schermo): così vale anche per chi preme Avanti senza toccare
       niente. E vale solo la prima volta (o.ris[k2] mai risposto):
       una spunta tolta a mano resta tolta.
       La sicurezza non dipende da qui — la dieta è già un divieto
       assoluto per il controllo (VIETATI_DA_DIETA) — questo è il
       percorso che dimostra di aver ascoltato. */
    if(sc.k2==="vincoli"&&!Array.isArray(o.ris[sc.k2])){
      const dt=((o.ris.dieta||{}).tipo||"").toLowerCase();
      const sug=[];
      if(dt==="vegana"){sug.push("niente carne di alcun tipo","niente pesce e frutti di mare");}
      else if(dt==="vegetariana"){sug.push("niente carne di alcun tipo");
        if(!(o.ris.dieta||{}).pesce)sug.push("niente pesce e frutti di mare");}
      else if(dt==="pescetariana"){sug.push("niente carne di alcun tipo");}
      if(sug.length){o.ris[sc.k2]=sug;onb2Salva();}}
    const sel2=Array.isArray(o.ris[sc.k2])?o.ris[sc.k2]:[];
    if(sc.gr1)h=h.replace('<div class="o2ops o2multi"',
      `<div class="o2gr"><b class="o2grt">${esc(sc.gr1)}</b>${sc.gr1sub?`<span class="o2grs">${esc(sc.gr1sub)}</span>`:""}</div><div class="o2ops o2multi"`);
    /* ── DUE COSE DIVERSE, E ADESSO SI VEDE (founder, 29/08) ───────
       «Vincoli religiosi ed etici sotto il tipo di dieta cosa
       c'entra?» La schermata li teneva già in due liste con la loro
       intestazione, ma a schermo erano una fila sola di quadratini
       con una scritta grigia in mezzo: si leggeva come un unico
       elenco, e infatti «Halal» sembrava un'altra dieta accanto a
       «Iposodica».
       Non sono la stessa cosa nemmeno per il motore: uno schema
       finisce in `S.pref.protocolli` ed è una preferenza che orienta
       il piano; un vincolo finisce in `S.pref.religiose` e da lì
       entra fra i divieti ASSOLUTI (`vietatiElenco`), quelli che il
       controllo di sicurezza non perdona mai. Due comportamenti
       opposti dello stesso motore non possono sembrare la stessa
       lista — è la stessa ragione per cui intolleranze e allergie
       sono state separate il 27/08.
       Quindi: una linea vera fra i due blocchi, e sotto il titolo la
       riga che dice perché il secondo è diverso. */
    h+=`<div class="o2gr o2gr2"><b class="o2grt">${esc(sc.gr2||"")}</b>${sc.gr2sub?`<span class="o2grs">${esc(sc.gr2sub)}</span>`:""}</div>`;
    h+=`<div class="o2ops o2multi" data-multi="${esc(sc.k2)}">`+sc.op2.map(([v,t,d])=>
      `<button class="o2op o2opm${sel2.includes(v)?" scelta":""}" type="button" data-v="${esc(v)}"
         onclick="onb2Toggle('${esc(sc.k2)}','${esc(v)}')" aria-pressed="${sel2.includes(v)}">
         <i class="o2box" aria-hidden="true">${sel2.includes(v)?"✓":""}</i>
         <span class="o2opt"><b>${esc(t)}</b>${d?`<span>${esc(d)}</span>`:""}</span></button>`).join("")+`</div>`;}
  return h;}

window.onb2Toggle=(k,v)=>{
  const o=onb2Stato();
  /* la seconda lista di una schermata a due liste ha la sua chiave:
     si cerca anche lì, altrimenti il suo «nessuno» non spegne niente */
  let sc=ONB2c().find(x=>x.k===k);
  if(!sc){const p=ONB2c().find(x=>x.k2===k);
    if(p)sc={k:p.k2,none:p.none2,sensibile:p.sensibile};}
  if(sc&&sc.sensibile&&o.sensibili!==true)return;   /* niente consenso, niente risposta */
  let sel=Array.isArray(o.ris[k])?o.ris[k].slice():[];
  if(sel.includes(v))sel=sel.filter(x=>x!==v);
  else{
    if(sc&&sc.none&&v===sc.none)sel=[v];             /* «nessuna» spegne il resto */
    else{sel=sel.filter(x=>!(sc&&sc.none&&x===sc.none));sel.push(v);}
  }
  o.ris[k]=sel;onb2Salva();
  /* ── IL TOCCO NON RIDISEGNA LA PAGINA (riscontro del founder, 25/08:
     «sembra che venga fatto un piccolo refresh ed è fastidioso») ──
     renderOnb2() rifaceva l'intero innerHTML a ogni spunta: la pagina
     lampeggiava e lo scorrimento poteva saltare. Le spunte adesso si
     aggiornano SUL POSTO — classe, ✓ e aria-pressed dei soli bottoni
     della lista — e la pagina non si muove. renderOnb2 resta il
     ripiego se la lista non si trova (non dovrebbe succedere mai,
     ma un ripiego che ridisegna è meglio di una spunta persa). */
  /* Gli integratori NON fanno piu' eccezione (founder, 27/08): la
     tendina della frequenza c'e' da subito ed e' viva, quindi la
     spunta non cambia piu' la struttura della riga e non c'e' niente
     da ridisegnare. Era l'ultimo lampo rimasto nel percorso. */
  const lista=document.querySelector('.o2multi[data-multi="'+(window.CSS&&CSS.escape?CSS.escape(k):k)+'"]');
  if(!lista)return renderOnb2();
  lista.querySelectorAll(".o2opm").forEach(b=>{
    const on=sel.includes(b.getAttribute("data-v"));
    b.classList.toggle("scelta",on);
    b.setAttribute("aria-pressed",on?"true":"false");
    const box=b.querySelector(".o2box");if(box)box.textContent=on?"✓":"";
    /* la riga (che contiene anche la tendina) segue la spunta: e' un
       cambio di CLASSE, non di struttura — nessun ridisegno */
    const riga=b.closest(".o2irowi");
    if(riga)riga.classList.toggle("scelta-riga",on);
    /* ── LA TENDINA SEGUE LA SPUNTA (27/08) ────────────────────────
       Da quando «mai» è la voce di partenza, spuntare un integratore
       lasciando la tendina su «mai» sarebbe una riga che si
       contraddice da sola. Spuntare vuol dire «lo prendo»: se la
       frequenza non è ancora stata scelta, diventa quella comune
       (tutti i giorni); togliere la spunta la riporta a «mai».
       È l'altra metà di onb2IntegFreq, che fa la stessa cosa
       partendo dalla tendina. */
    if(k==="integratori"){
      const t=riga&&riga.querySelector(".o2ifreq");
      if(t){
        const f=(o.ris.integ_freq=o.ris.integ_freq||{});
        const v=b.getAttribute("data-v");
        if(on&&(!f[v]||f[v]==="mai"))f[v]="giorni";
        if(!on)f[v]="mai";
        t.value=f[v];onb2Salva();}}});};

window.onb2MultiOk=(k)=>{
  const o=onb2Stato(),sc=ONB2c().find(x=>x.k===k);
  if(sc&&sc.sensibile&&o.sensibili!==true)return onb2Salta();
  if(!Array.isArray(o.ris[k]))o.ris[k]=[];
  const alt=document.getElementById("o2alt");
  if(sc&&sc.altro&&alt)o.ris[k+"_altro"]=alt.value.trim();
  const tx=document.getElementById("o2txtx");
  if(sc&&sc.testo&&tx)o.ris[sc.testo.k]=tx.value.trim();
  onb2Salva();
  /* niente messaggio di stato: vedi la nota in cima al file */
  onb2Avanti();};

/* ── Come mangi: dieta di riferimento e tradizione culinaria. ──────
   Le stesse voci (e gli stessi campi) di Regole → Caratteristiche
   alimentari: qui si chiedono, lì si modificano. */
/* ── LE DUE SPUNTE DEL VEGETARIANO DICONO CHI SEI, NON COSA È ──────
   «Uova sì» e «Pesce sì» sembravano l'etichetta di una regola
   dell'app: sì per chi? Adesso sono in prima persona — «Mangio le
   uova», «Mangio il pesce» — perché è una domanda su di te.
   E la riga che spiega PERCHÉ la domanda esiste (le versioni della
   dieta vegetariana cambiano) stava solo in Regole, cioè nel posto
   dove si correggono le risposte già date. Serve di più qui, dove la
   risposta si dà la prima volta: è la stessa frase, non una seconda
   scritta da mantenere allineata. */
function onb2Dieta(sc){
  const o=onb2Stato(),r=o.ris.dieta||{};
  const tipo=r.tipo||"mediterranea";
  const dt=(typeof DIET_TYPES!=="undefined")?DIET_TYPES:["mediterranea","onnivora","vegetariana","vegana","pescetariana","flexitariana"];
  const cuc=(typeof CUCINE!=="undefined")?CUCINE:[["italiana","Italiana"]];
  return onb2Chip("dieta")+
   `<div class="o2form">
      <label>${esc(tr("Dieta di riferimento"))}</label>
      <select id="o2dTipo" onchange="onb2VegUI(this.value)">`+
        dt.map(x=>`<option value="${esc(x)}"${tipo===x?" selected":""}>${esc(O2CAP(x))}</option>`).join("")+`</select>
      <div id="o2VegBox" style="${tipo==="vegetariana"?"":"display:none"}">
        <label class="ck"><input type="checkbox" id="o2vu"${r.uova===false?"":" checked"}> ${esc(tr("Mangio le uova"))}</label>
        <label class="ck"><input type="checkbox" id="o2vp"${r.pesce?" checked":""}> ${esc(tr("Mangio il pesce"))}</label>
        <div class="hint">${tr("Nella dieta vegetariana le versioni cambiano: di norma le uova sono ammesse e il pesce no. Regola qui come mangi tu.")}</div>
      </div>
      <label>${esc(tr("Tradizione culinaria"))}</label>
      <select id="o2dTrad">`+
        cuc.map(c=>`<option value="${esc(c[0])}"${(r.tradizione||"italiana")===c[0]?" selected":""}>${esc(tr(c[1]))}</option>`).join("")+`</select>
    </div>`;}

window.onb2VegUI=(v)=>{const b=document.getElementById("o2VegBox");
  if(b)b.style.display=(v==="vegetariana")?"":"none";};

window.onb2DietaOk=()=>{
  const g=id=>document.getElementById(id);
  const tipo=(g("o2dTipo")||{}).value||"mediterranea";
  const o=onb2Stato();
  o.ris.dieta={tipo,
    uova:tipo==="vegana"?false:(tipo==="vegetariana"?!!(g("o2vu")&&g("o2vu").checked):true),
    pesce:tipo==="vegana"?false:(tipo==="vegetariana"?!!(g("o2vp")&&g("o2vp").checked):true),
    tradizione:(g("o2dTrad")||{}).value||"italiana"};
  onb2Salva();onb2Avanti();};

/* ── Quali pasti fai: spunte sugli slot e pasti liberi. ─────────────
   Gli slot restano VALORI italiani (come in tutta l'app): a schermo
   passano da fascia(), nello stato vivono nudi. */
/* Gli stessi sette slot che l'app usa ovunque (SLOT_HOUR, motore AI,
   spesa): se qui ne mancasse uno, il piano non potrebbe proporlo. */
/* ── UNA MAPPA SOLA, E COI VALORI CHE ESISTONO DAVVERO ────────────
   Era scritta a mano in TRE punti (targets, dati del piano, travaso)
   con gli stessi numeri: tre copie di una tabella divergono al primo
   che ne cambia una, e qui divergere significa che la proiezione
   mostrata durante il percorso e il piano vero usano fabbisogni
   diversi.
   I valori sono le chiavi di ACT_STEPS e le voci della tendina di
   Regole → Obiettivi: la stessa risposta imposta il fabbisogno E i
   passi base, e chi apre Regole ritrova la sua scelta selezionata.
   Le chiavi vecchie restano mappate: chi ha il percorso salvato a
   metà non deve ritrovarsi senza attività. */
const O2ATT={fermo:1.2,poco:1.3,leggero:1.35,regolare:1.45,intenso:1.55};
function o2Att(k){
  const v=O2ATT[k];
  if(v)return v;
  /* percorsi salvati con le chiavi di prima della v13.65 */
  return ({leggero:1.35,regolare:1.45,intenso:1.55}[k])||1.35;}
window.o2Att=o2Att;

const O2SLOTS=["Colazione","Metà mattina","Pranzo","Metà pomeriggio",
               "Tardo pomeriggio","Cena","Dopo cena"];
function onb2Pasti(sc){
  const o=onb2Stato(),r=o.ris.pasti||{};
  const sel=Array.isArray(r.slots)?r.slots:["Colazione","Pranzo","Cena"];
  const eti=s=>(typeof fascia==="function")?fascia(s):s;
  return onb2Chip("pasti")+
   `<div class="o2form"><div class="ckgrid">`+
      O2SLOTS.map((s,i)=>`<label class="ck"><input type="checkbox" id="o2sl${i}"${sel.includes(s)?" checked":""}> ${esc(eti(s))}</label>`).join("")+
   `</div>
      <label>${esc(tr("Pasti liberi a settimana"))}</label>
      <input type="number" id="o2lib" inputmode="numeric" min="0" max="7" value="${r.liberi!=null?r.liberi:1}">
    </div>`;}

window.onb2PastiOk=()=>{
  const slots=O2SLOTS.filter((s,i)=>{const e=document.getElementById("o2sl"+i);return e&&e.checked;});
  if(slots.length<2)return dlgAlert(tr("Seleziona almeno due pasti: con meno di due il piano non sta in piedi."));
  const lib=Math.max(0,Math.min(7,+((document.getElementById("o2lib")||{}).value||0)));
  const o=onb2Stato();o.ris.pasti={slots,liberi:lib};
  onb2Salva();onb2Avanti();};

/* ── CIBI: quello che eviti, quello che ami, e il resto ──────────
   Tre campi liberi in una schermata sola. Il prompt del piano usa i
   primi due da sempre e finora arrivavano vuoti; il terzo è l'unico
   posto del percorso in cui si può dire una cosa che non stava in
   nessuna casella. */
function onb2Cibi(sc){
  const o=onb2Stato(),r=o.ris.cibi||{};
  return onb2Chip("cibi")+
   `<div class="o2form">
      <label for="o2cno">${esc(tr("Cosa non vuoi vedere nel piatto"))}</label>
      <input type="text" id="o2cno" value="${esc(bz("o2cno",r.no||""))}"
        placeholder="${esc(tr("es. cavolfiore, fegato, frutti di mare"))}">
      <span class="o2hint">${esc(tr("Gusti, non intolleranze: quelle le hai già dette. Qui basta che non ti piaccia."))}</span>
      <label for="o2csi" style="margin-top:16px">${esc(tr("Cosa ti piace davvero"))}</label>
      <input type="text" id="o2csi" value="${esc(bz("o2csi",r.si||""))}"
        placeholder="${esc(tr("es. pesce, zuppe, uova"))}">
      <span class="o2hint">${esc(tr("Su queste il piano punta: un piano fatto di cose che ami si segue da solo."))}</span>
      <label for="o2note" style="margin-top:16px">${esc(tr("Altro che dovrei sapere"))}</label>
      <input type="text" id="o2note" value="${esc(bz("o2note",r.note||""))}"
        placeholder="${esc(tr("facoltativo"))}">
      <label for="o2calc" style="margin-top:16px">${esc(tr("Bevi alcolici?"))}</label>
      <select id="o2calc">${[["mai",tr("Mai")],["raramente",tr("Raramente")],
          ["nel fine settimana",tr("Nel fine settimana")],["quotidiano",tr("Quasi ogni giorno")]]
        .map(x=>`<option value="${esc(x[0])}"${(r.alcol||"mai")===x[0]?" selected":""}>${esc(x[1])}</option>`).join("")}</select>
      <span class="o2hint">${esc(tr("Non entra nel piano e non entra nella spesa: nel piano non ci va mai, e non è una cosa da programmare. Me lo dici perché quando capita va segnato nel diario — così i conti restano veri — e perché cambia il modo in cui ti parlo il giorno dopo."))}</span>
    </div>`;}
window.onb2CibiOk=()=>{
  const v=id=>String((document.getElementById(id)||{}).value||"").trim();
  const o=onb2Stato();
  const alc=(document.getElementById("o2calc")||{}).value;
  o.ris.cibi={no:v("o2cno"),si:v("o2csi"),note:v("o2note"),alcol:alc||"mai"};
  onb2Salva();onb2Avanti();};

/* ── FUORI CASA: quali giorni, quale pasto, e se te lo porti ─────
   Le spunte sono quelle di Regole (`mensaChecksHTML`/`readMensaChecks`):
   stesso disegno, stesso formato salvato, una fonte sola. Rifarle qui
   avrebbe voluto dire due tabelle che si somigliano finché una delle
   due non cambia. */
function onb2Fuori(sc){
  const o=onb2Stato(),r=o.ris.fuori||{};
  const gg=(typeof mensaChecksHTML==="function")?mensaChecksHTML("o2f",r.giorni||""):"";
  const porto=(r.tipo==="porto");
  return onb2Chip("fuori")+
   `<div class="o2form">
      ${gg}
      <label style="margin-top:16px">${esc(tr("E in quei giorni…"))}</label>
      <div class="ckgrid">
        <label class="ck"><input type="radio" name="o2ftipo" value="fuori"${porto?"":" checked"}> ${esc(tr("Mangio fuori: mensa, bar, ristorante"))}</label>
        <label class="ck"><input type="radio" name="o2ftipo" value="porto"${porto?" checked":""}> ${esc(tr("Me lo porto da casa"))}</label>
      </div>
      <span class="o2hint">${esc(tr("Se mangi fuori non invento grammature che non puoi rispettare, e non compro quel pasto nella lista della spesa. Se te lo porti, lo scrivo per intero e lo metto nella spesa."))}</span>
    </div>`;}
window.onb2FuoriOk=()=>{
  const g=(typeof readMensaChecks==="function")?readMensaChecks("o2f"):"";
  const t=document.querySelector('input[name="o2ftipo"]:checked');
  const o=onb2Stato();
  o.ris.fuori={giorni:g,tipo:(t&&t.value==="porto")?"porto":"fuori"};
  onb2Salva();onb2Avanti();};

/* ── Le ultime due cose per il piano: budget e varietà. ────────────
   L'ALCOL NON STA PIÙ QUI (founder, 28/08): «perché nelle ultime tre
   cose del piano c'è l'alcol? non ha senso che ci sia per una dieta,
   ha senso più come cosa informativa».
   Aveva ragione due volte. La prima: nel piano non entrava già —
   al modello arriva un divieto, sempre — quindi stava in una
   schermata che prometteva l'opposto di quello che il codice fa.
   La seconda: messo fra «budget» e «varietà» sembrava una
   MANOPOLA del piano, cioè una cosa da regolare per stare meglio.
   Adesso è una domanda di contesto e sta con le abitudini (schermata
   `cibi`), dove le risposte servono a conoscere la persona e non a
   comporre la settimana. */
/* ── UNA DOMANDA SOLA SUL BUDGET (founder, 29/08) ─────────────────
   «Budget della spesa non può essere sia medio che un numero, l'utente
   si confonde: il numero mettilo in Spesa, non nell'onboarding.»

   Aveva ragione, e il difetto era mio: la cifra è stata aggiunta il
   28/08 SOTTO la tendina invece che al posto suo, e le due domande si
   contraddicevano a vista — se scrivo 60 euro, «Medio» cosa aggiunge?
   E se dicono cose diverse, quale vince?
   Qui resta la domanda a cui si risponde a memoria: chi comincia il
   percorso non ha in mano lo scontrino della settimana scorsa. La
   cifra esatta vive dove serve — nella pagina Spesa, accanto alla
   lista che la consuma e al numero di persone per cui si compra.

   E QUESTA NOTA STA FUORI DAL TEMPLATE, non dentro come l'avevo
   scritta la prima volta: un commento HTML dentro le backtick finisce
   nella pagina a ogni disegno. Non si vede, ma pesa — ed è la seconda
   volta in due consegne che ci cado (la prima fu il foglio dei
   bicchieri, dove si VEDEVA). Qui l'ha preso `t_onb_domande`, che
   cercava «alcol» e lo ha trovato dentro «calcolare». */
function onb2Pref(sc){
  const o=onb2Stato(),r=o.ris.preferenze||{};
  const sel=(id,val,opts)=>`<select id="${id}">`+opts.map(x=>`<option value="${esc(x[0])}"${(val||opts[0][0])===x[0]?" selected":""}>${esc(x[1])}</option>`).join("")+`</select>`;
  return onb2Chip("preferenze")+
   `<div class="o2form">
      <label>${esc(tr("Budget spesa"))}</label>
      ${sel("o2pb",r.budget,[["medio",tr("Medio")],["contenuto",tr("Contenuto")],["senza limiti",tr("Senza limiti")]])}
      <span class="o2hint">${esc(tr("La cifra esatta la dai dalla Spesa, dove conto anche per quante persone compri."))}</span>
      <label>${esc(tr("Quanta varietà vuoi nel piano"))}</label>
      ${sel("o2pv",r.varieta,[["media",tr("Media")],["bassa",tr("Bassa: pochi piatti che tornano, spesa corta")],["alta",tr("Alta: ogni giorno diverso")]])}
    </div>`;}

window.onb2PrefOk=()=>{
  const g=id=>(document.getElementById(id)||{}).value;
  const o=onb2Stato();
  /* l'alcol si porta dietro quello che c'era: chi ha lasciato il
     percorso a metà prima del 28/08 non perde la risposta gia' data */
  const vecchio=(o.ris.preferenze||{}).alcol;
  /* la cifra non si chiede più qui (vedi la nota nel disegno), ma chi
     l'aveva già data prima del 29/08 non la perde */
  const cifraVecchia=(o.ris.preferenze||{}).budgetCifra;
  o.ris.preferenze={budget:g("o2pb")||"medio",varieta:g("o2pv")||"media"};
  if(cifraVecchia>0)o.ris.preferenze.budgetCifra=+cifraVecchia;
  if(vecchio)o.ris.preferenze.alcol=vecchio;
  onb2Salva();onb2Avanti();};

/* ── Le pause ──────────────────────────────────────────────────
   Non chiedono niente: dicono a che punto siamo e perché le domande
   fatte servivano. Sono il posto della mascotte — l'unica figura che
   la persona vede in tutto il percorso. */
/* ═══ IL PREMIO, CHE PRIMA NON C'ERA ═══════════════════════════════
   RICHIESTA DEL FOUNDER (29/08): «avevi parlato di dare dei premi
   psicologici all'utente durante l'onboarding: quando arrivano le
   mascotte non dice niente di speciale, non li vedo questi premi».

   Aveva ragione: le due pause mostravano una figura e una frase
   uguale per tutti. Una pausa che non restituisce niente è una
   schermata in più fra la persona e il piano — cioè il contrario di
   un premio.

   Il premio vero non è un complimento: è un NUMERO che la persona non
   aveva prima di rispondere, e che ha ottenuto rispondendo. «Bravo,
   continua così» non si è guadagnato niente; «il tuo corpo consuma
   2.897 kcal anche stando fermo» sì — e viene dalle sue tre risposte.

   Regola, per chi aggiungerà pause: se per una schermata non c'è un
   dato vero da restituire, il premio NON si scrive. Un premio
   inventato vale meno di nessun premio, e questa app non finge. */
function onb2PremioHTML(sc){
  try{
    const o=onb2Stato(),b=o.ris.bio||{};
    /* IL NOME STA DENTRO LA FRASE, NON DAVANTI (29/08): la prima
       stesura incollava il nome davanti a una frase che comincia
       in minuscolo, cioè
       una chiave che comincia in minuscolo e vale solo in italiano —
       in inglese il nome va in un altro posto della frase. È il
       difetto che `t_i18n` chiama «chiave frammentata», e l'ha preso
       lui prima di me. */
    const nome=String(b.nome||"").trim();
    if(sc.k==="pausa1"){
      const t=onb2Targets(b);
      if(!t)return "";
      const righe=[];
      /* quello che il corpo consuma: il primo numero che l'app
         RESTITUISCE, ed è tutto suo */
      righe.push(`<div class="o2prem-n"><b>${esc(String(t.tdee))}</b> <span>${esc(tr("kcal al giorno"))}</span></div>`);
      righe.push(`<div class="o2prem-d">${esc(nome
        ? trh("{v1}, è quanto consumi in una giornata come le tue: non l'ha deciso una tabella, l'ho calcolato sui tuoi numeri.",{v1:nome})
        : tr("È quanto consumi in una giornata come le tue: non l'ha deciso una tabella, l'ho calcolato sui tuoi numeri."))}</div>`);
      const goal=+o.ris.pesoObiettivo||0;
      const gk=(typeof pesoIn==="function"&&goal)?pesoIn(String(goal)):goal;
      if(gk>0&&b.w>0){
        const diff=Math.round((b.w-gk)*10)/10;
        if(diff>=0.5){
          const defG=Math.max(1,t.tdee-t.kcal);
          const sett=Math.max(1,Math.round(diff*7700/(defG*7)));
          righe.push(`<div class="o2prem-d">${esc(trh("E per i {v1} che ti mancano servono circa {v2} settimane: lo sai prima di cominciare, non dopo tre mesi.",
            {v1:((typeof pesoTxt==="function")?pesoTxt(diff,1):diff+" kg"),v2:sett}))}</div>`);}}
      return `<div class="o2prem">${righe.join("")}</div>`;}
    if(sc.k==="pausa2"){
      const r=o.ris||{};
      /* ── TRE PIATTI CHE TI SOMIGLIANO GIÀ (premio 2, 29/08) ──────
         La prova che le risposte lavorano. I candidati vengono dal
         piano di partenza (BASE_RICETTE + PB_MODELLI) e passano dalla
         STESSA rete del piano vero: vietatiElenco/allergeniElenco
         costruiti sulle risposte date FINORA (S.pref non esiste
         ancora: il travaso arriva alla fine). Un piatto mostrato qui
         e vietato dopo sarebbe una promessa rotta alla prima
         schermata utile. */
      const no=[(Array.isArray(r.vincoli)?r.vincoli:[]).join(", "),
                (Array.isArray(r.cibi_no)?r.cibi_no:[]).join(", ")].filter(Boolean).join(", ");
      const intol=(Array.isArray(r.allergie)?r.allergie:[]).filter(x=>x!=="niente").join(", ");
      const gravi=(Array.isArray(r.allergie_gravi)?r.allergie_gravi:[]).join(", ");
      let vietati=[],assoluti=[];
      try{vietati=(typeof vietatiElenco==="function")?vietatiElenco(no,intol):[];}catch(e){}
      try{assoluti=(typeof allergeniElenco==="function")?allergeniElenco(gravi,"allergia"):[];}catch(e){}
      /* i candidati: pranzi e cene normali del piano base, più i
         modelli degli spuntini — descrizioni vere, non inventate qui */
      const cand=[];
      try{(typeof BASE_RICETTE!=="undefined"?BASE_RICETTE:[]).forEach(g=>(g.meals||[]).forEach(m=>{
        if(m.type==="norm"&&m.o&&m.o[0]&&/pranzo|cena/i.test(m.n||""))cand.push(m.o[0].d);}));}catch(e){}
      try{Object.keys(typeof PB_MODELLI!=="undefined"?PB_MODELLI:{}).forEach(k2=>{
        const m=PB_MODELLI[k2];if(m&&m.o&&m.o[0])cand.push(m.o[0].d);});}catch(e){}
      const passano=cand.filter(dsc=>{
        try{return (typeof vietatoDentro==="function")?!vietatoDentro(dsc,vietati,assoluti):true;}
        catch(e){return false;}});
      if(passano.length<3)return "";     /* meglio nessun premio che uno finto */
      /* tre piatti diversi, presi sparsi (inizio, metà, fine) così non
         sono tre pranzi uguali dello stesso giorno */
      const tre=[passano[0],passano[Math.floor(passano.length/2)],passano[passano.length-1]]
        .filter((x,i,a)=>a.indexOf(x)===i).slice(0,3);
      if(tre.length<3)return "";
      const esclusi=vietati.length+assoluti.length;
      const pezzi2=[];
      pezzi2.push(`<div class="o2prem-d">${esc(tr("Potresti provare, per dire:"))}</div>`);
      tre.forEach(dsc=>{pezzi2.push(`<div class="o2prem-p">• ${esc(dsc)}</div>`);});
      if(esclusi>0)
        pezzi2.push(`<div class="o2prem-d">${esc(trh("E ho già tolto dal tavolo {v1} alimenti per te: le risposte non finiscono in un cassetto.",{v1:esclusi}))}</div>`);
      else
        pezzi2.push(`<div class="o2prem-d">${esc(tr("Per ora non escludi niente: quando mi dirai di più, si adatteranno da soli."))}</div>`);
      return `<div class="o2prem">${pezzi2.join("")}</div>`;}
    if(sc.k==="pausa3"){
      /* quante cose il piano sa DAVVERO di lei: si contano, non si
         stimano — e se sono poche il numero è piccolo e va bene così */
      const r=o.ris||{},d=S.pref||{};
      const pezzi=[];
      const conta=(v)=>{ if(!v)return 0;
        if(Array.isArray(v))return v.filter(x=>x&&x!=="nessuno"&&x!=="niente").length;
        return String(v).trim()?1:0;};
      let n=0;
      n+=conta(d.intol); n+=conta(d.allergie); n+=conta(d.no); n+=conta(d.si);
      n+=conta(d.religiose); n+=conta(d.protocolli); n+=conta(d.farmaci); n+=conta(d.medico);
      n+=conta(d.tipo); n+=conta(d.slots?1:0); n+=conta(d.mensaGiorni);
      n+=conta(r.attivita); n+=conta(r.cucina); n+=conta(r.sportPref);
      if(n<3)return "";
      pezzi.push(`<div class="o2prem-n"><b>${esc(String(n))}</b> <span>${esc(tr("cose che il piano sa di te"))}</span></div>`);
      pezzi.push(`<div class="o2prem-d">${esc(tr("Nessuna è un valore di serie: le hai dette tu, e ognuna cambia il piano."))}</div>`);
      return `<div class="o2prem">${pezzi.join("")}</div>`;}
  }catch(e){}
  return "";}
window.onb2PremioHTML=onb2PremioHTML;

function onb2Pausa(sc){
  /* Più grande (founder, 27/08): «così si vedono meglio e sono più
     distintive». Su una pausa la figura È il contenuto della schermata,
     non un ornamento accanto al testo. */
  return `<div class="o2pausa">${masc(sc.posa||"pensa",150)}</div>`+onb2PremioHTML(sc);}

/* ── Il piano che si scrive da solo, in sottofondo ──────────────
   Regola del founder (22/08): l'AI parte PRIMA delle domande che non
   toccano il piano, così quando la persona arriva in fondo non
   aspetta. Lo stato si racconta riga per riga, non con una rotella. */
function onb2Gen(){
  if(!window.__o2gen)window.__o2gen={stato:"fermo",perc:0,riga:"",righe:[],piano:null};
  return window.__o2gen;}
window.onb2Gen=onb2Gen;

const O2GIORNI=["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
/* ═══ LE RIGHE NON MENTONO (riscontro del founder, 25/08) ═════════
   Sul telefono la generazione passa dal PROXY, che oggi non fa
   streaming: nessun evento «giorno» arriva mai, e la lista restava
   inchiodata su «Lunedì: in corso…» per tutta l'attesa — che è
   esattamente il tipo di bugia involontaria che fa sembrare l'app
   ferma. Quando lo streaming è muto, la lista dei giorni NON si
   mostra: si dice la verità — «sto scrivendo tutta la settimana in
   un colpo solo» — e l'orologio a vista (in onb2Fine) fa vedere che
   il tempo scorre davvero. La lista coi giorni compare solo quando
   c'è qualcuno che li conta per davvero. */
function onb2GenRighe(fatti,stato){
  const g=onb2Gen();
  if(stato==="lavoro"&&!g.streamOk)
    /* «in un colpo solo» non e' un modo professionale di parlare
       (founder, 27/08): la frase dice la stessa cosa in italiano. */
    return [{t:tr("Sto scrivendo la settimana intera: ci vuole un paio di minuti."),s:"ora"}];
  /* Le frasi stanno dentro tr() LETTERALI, non costruite con un
     ternario: così il controllo delle traduzioni le vede davvero.
     L'AVANZAMENTO È QUELLO VERO (25/08): il piano arriva in streaming
     e i giorni completati si CONTANO dal testo già scritto — un giorno
     è chiuso quando è cominciato il successivo. Nella v13.59 i sette
     giorni stavano tutti «in corso» insieme, che era onesto ma non
     diceva niente; adesso le spunte si accendono una alla volta perché
     una alla volta i giorni vengono scritti davvero. */
  const R=O2GIORNI.map((g,i)=>{
    const n={g:tr(g)};
    if(i<fatti) return {t:tr("{g}: completato",n),s:"ok"};
    if(i===fatti)return {t:tr("{g}: in corso…",n),s:"ora"};
    return {t:tr("{g}: in attesa",n),s:"attesa"};});
  const fine=(stato==="fatto");
  /* La spesa arriva nella stessa risposta del piano: quando i giorni
     ci sono, c'è anche lei. Prima queste due righe dicevano «pronta» e
     «fatto» al termine di un percorso in cui la spesa non veniva mai
     chiesta e il controllo non esisteva: due passaggi dichiarati e mai
     eseguiti. */
  /* L'ORDINE È QUELLO VERO (riscontro del founder, 25/08 sera): il
     controllo di coerenza gira PRIMA che la spesa sia considerata
     pronta — la lista mostrava il contrario, e chi guardava vedeva il
     controllo partire con la spesa ancora «da calcolare» sotto. Le
     righe ora stanno nell'ordine in cui le cose accadono. */
  R.push(fine?{t:tr("Controllo di coerenza: fatto"),s:"ok"}
        :(stato==="controllo")?{t:tr("Controllo di coerenza: in corso…"),s:"ora"}
             :{t:tr("Controllo di coerenza: da fare"),s:"attesa"});
  R.push(fine?{t:tr("Lista della spesa: pronta"),s:"ok"}
             :{t:tr("Lista della spesa: da calcolare"),s:"attesa"});
  return R;}

/* Ridisegna SOLO se la persona sta guardando la schermata finale:
   altrimenti il piano cresce in silenzio, come deve.
   E se è GIÀ ENTRATA nell'app mentre il piano si scrive, l'avanzamento
   la segue nel riquadro fisso in fondo (lo stesso di «Genera nuovo
   piano»): entrare non deve voler dire perdere di vista il lavoro. */
function onb2GenTocca(){
  try{const o=onb2Stato();
    if(ONB2c()[o.step]&&ONB2c()[o.step].tipo==="fine"){
      /* ── SENZA SPOSTARE LA PERSONA (riscontro del founder, 25/08
         sera: «ogni volta che viene completato un giorno c'è una
         specie di refresh che sposta leggermente il punto in cui si
         trova l'utente»). renderOnb2 rifaceva l'intera pagina a ogni
         evento. Finché si sta LAVORANDO si aggiornano sul posto barra,
         percentuale, riga e lista — stesso principio del tocco senza
         lampo. Il ridisegno intero resta solo per i cambi di stato
         (pronto, errore), dove cambia anche il bottone. */
      const g=onb2Gen();
      const b=document.getElementById("o2genb"),
            l=document.getElementById("o2genl"),
            r=document.getElementById("o2gent"),
            pc=document.getElementById("o2perc");
      if(g.stato==="lavoro"&&b&&r){
        b.style.width=(g.perc||0)+"%";
        if(pc)pc.textContent=(g.perc||0)+"%";
        r.textContent=g.riga||"";
        if(l)l.innerHTML=(g.righe||[]).map(x=>
          `<li class="${esc(x.s)}">${esc(x.t)}</li>`).join("");
      }else renderOnb2();
    }}catch(e){}
  try{const g=onb2Gen();
    if(S.onboard&&S.onboard.done&&g.stato==="lavoro"&&typeof genBox==="function")
      genPassi(genBox(),g.fatti||0);}catch(e){}}

/* ═══ IL PIANO DI BASE, RIBILANCIATO SUI TUOI NUMERI ══════════════
   Deciso dal founder il 23/08: chi resta su Free non ha l'AI, quindi
   non c'è niente da generare — ma NON riceve un diario vuoto né un
   «torna quando paghi». Riceve il piano di base con le QUANTITÀ
   rifatte sul suo obiettivo.

   COME, e perché così:
   • Si calcola quanto pesa oggi ogni giornata del piano di base e
     quanto dovrebbe pesare per questa persona (`dayTargetK()`, cioè
     il fabbisogno meno o più il bilancio deciso dall'obiettivo: chi
     mette massa riceve porzioni PIÙ GRANDI, non più piccole).
   • I PASTI LIBERI NON SI TOCCANO. Dire «tre quarti di pallina di
     gelato» è ridicolo, e soprattutto tradisce il senso del pasto
     libero: è libero. La differenza la assorbono gli altri pasti,
     che è esattamente come si comporterebbe una persona.
   • Si scalano le GRAMMATURE scritte nel piatto, non solo i numeri
     dei macro: «Pollo 200g» che diventa «Pollo 150g» è un'istruzione
     che si può seguire; un piatto identico con meno calorie scritte
     sotto non lo è.
   • Il fattore ha un tetto, e NON è simmetrico: 0,6 in giù, 1,75 in
     su. In giù si scende in fretta nel ridicolo (30 g di pollo, 20 g
     di pasta) e sotto il pavimento calorico ci pensa già il motore;
     in su, un piatto più abbondante resta un piatto — e chi mette
     massa deve poterci arrivare. Misurato: con un tetto a 1,5 chi
     cresce restava sotto il proprio target di quasi il 10% nei
     giorni con più pasti liberi. Se il tetto morde lo si dichiara:
     una stima che si sa storta e non lo dice è peggio di nessuna.
   • Non si inventa un piatto nuovo: questo è un ADATTAMENTO, non un
     piano scritto per te, e la differenza va detta a chiare lettere. */
const PB_MIN=0.6,PB_MAX=1.75;

/* Le grammature dentro la descrizione. Si toccano SOLO i numeri
   seguiti da g/gr/ml: «4 nigiri» e «½ avocado» restano quello che
   sono, perché non si tagliano a fette. Sotto i 5 g non si scala
   (l'olio da 10 g che diventa 6 g è una precisione finta). */
function pbGrammature(testo,f){
  /* Si conserva lo SPAZIO come stava scritto: «200g» resta «150g» e
     «200 g» resta «150 g». Un piano che cambia formato a metà si
     legge come scritto da due mani diverse. */
  return String(testo||"").replace(/(\d+(?:[.,]\d+)?)(\s*)(g|gr|ml)\b/gi,(tutto,n,sp,u)=>{
    const v=parseFloat(String(n).replace(",","."));
    if(!(v>=5))return tutto;
    const nuovo=Math.max(5,Math.round(v*f/5)*5);   /* a passi di 5 g */
    return nuovo+sp+u;});}

/* Quanto pesa una giornata, e quanto ne pesano i soli pasti che si
   possono ritoccare. */
function pbPesi(giorno){
  let tutto=0,mobile=0;
  (giorno.meals||[]).forEach(m=>{
    const k=+(((m.o||[])[0]||{}).k)||0;
    tutto+=k;
    if(m.type!=="free")mobile+=k;});
  return {tutto,mobile};}

/* ── ANCHE IL PIANO DI BASE RISPETTA I PASTI SCELTI (29/08) ────────
   La promessa della schermata è «il piano non proporrà quelli spenti»,
   e il piano su misura la mantiene. Quello di BASE no: è il piano del
   founder (Metà mattina, Pranzo, Metà pomeriggio, Cena) e arrivava
   così a chiunque — a chi aveva scelto la colazione mancava la
   colazione, a chi non aveva scelto la metà mattina restava la metà
   mattina. Stessa malattia del contratto AI, su un'altra strada.
   Qui si adatta PRIMA di riscalare le quantità:
   · i pasti non scelti si tolgono;
   · i pasti scelti che mancano si aggiungono da modelli con alimenti
     e valori veri (gli stessi spuntini del piano di base, più una
     colazione e un dopo cena scritti con lo stesso metro);
   · l'ordine segue gli orari della giornata.
   Poi il riscalo esistente porta la giornata al target: i modelli non
   devono indovinare le calorie giuste, gliele sistema lui. */
const PB_MODELLI={
  "Colazione":{n:"Colazione",t:"07:30",type:"norm",o:[{d:"Yogurt greco 150g + fiocchi d'avena 40g + frutta fresca 100g + semi oleosi 10g",k:350,p:22,c:42,f:10}]},
  "Metà mattina":{n:"Metà mattina",t:"10:30",type:"norm",o:[{d:"Kefir 150g + quinoa soffiata 25g + frutti di bosco 40g + semi oleosi 10g",k:250,p:9,c:30,f:9}]},
  "Metà pomeriggio":{n:"Metà pomeriggio",t:"16:30",type:"norm",o:[{d:"Yogurt greco 150g + frutta di stagione 40g + semi oleosi 10g",k:170,p:17,c:10,f:8}]},
  "Tardo pomeriggio":{n:"Tardo pomeriggio",t:"18:30",type:"norm",o:[{d:"Frutta secca 20g + un frutto fresco",k:190,p:5,c:20,f:11}]},
  "Dopo cena":{n:"Dopo cena",t:"22:00",type:"norm",o:[{d:"Ricotta 100g + frutta fresca 80g",k:190,p:12,c:13,f:11}]}};
function pbSlots(giorno,slots){
  if(!Array.isArray(slots)||!slots.length)return giorno;
  const nrm=s=>(typeof cibNorm==="function")?cibNorm(s):String(s||"").toLowerCase();
  const scelti=slots.map(nrm);
  /* si tengono i pasti scelti; gli altri se ne vanno — TRANNE i
     liberi: un pasto libero è un'occasione del weekend, non uno slot
     quotidiano, e toglierlo a chi non ha spuntato quella fascia
     butterebbe via la libertà insieme all'orario (visto dal collaudo
     dello scalo, 29/08: il primo taglio si portava via la birra del
     venerdì) */
  let meals=(giorno.meals||[]).filter(m=>m&&(scelti.indexOf(nrm(m.n))>=0||(m.type||"norm")==="free"));
  /* un pasto LIBERO tenuto fuori fascia copre la fascia scelta più
     vicina nell'ora: il venerdì del piano di base ha l'aperitivo AL
     POSTO della merenda, non in aggiunta — inserire anche il modello
     della merenda farebbe due spuntini dove il piano ne prevede uno
     (visto dal collaudo dei liberi, 29/08) */
  const ORA_F={"colazione":7.5,"metà mattina":10.5,"meta mattina":10.5,"pranzo":13,
    "metà pomeriggio":16.5,"meta pomeriggio":16.5,"tardo pomeriggio":18.5,"cena":20,"dopo cena":22};
  const coperti=new Set();
  meals.filter(m=>(m.type||"norm")==="free"&&scelti.indexOf(nrm(m.n))<0).forEach(fm=>{
    const oraFm=parseFloat(String(fm.t||"").replace(":","."))||ORA_F[nrm(fm.n)]||13;
    let best=null,dist=99;
    slots.forEach(s=>{
      if(coperti.has(s))return;
      if(meals.some(m=>nrm(m.n)===nrm(s)))return;
      const d=Math.abs((ORA_F[nrm(s)]||13)-oraFm);
      if(d<dist){dist=d;best=s;}});
    if(best!=null&&dist<=4)coperti.add(best);});
  /* i pasti scelti che mancano entrano dai modelli */
  slots.forEach(s=>{
    if(coperti.has(s))return;
    if(meals.some(m=>nrm(m.n)===nrm(s)))return;
    const mod=PB_MODELLI[s];
    if(mod){meals.push(JSON.parse(JSON.stringify(mod)));return;}
    /* uno slot senza modello (un nome futuro): si copia lo spuntino
       più piccolo del giorno, rinominato — mai un giorno col buco */
    const più=meals.filter(m=>(m.type||"norm")==="norm"&&m.o&&m.o[0])
      .sort((a,b)=>((a.o[0]||{}).k||0)-((b.o[0]||{}).k||0))[0];
    if(più){const c=JSON.parse(JSON.stringify(più));c.n=s;meals.push(c);}});
  /* in ordine di GIORNATA, non di elenco: un pasto libero tenuto
     anche se la sua fascia non è fra le scelte (vedi sopra) con
     l'ordine dell'elenco finirebbe in testa (indexOf=-1). L'ora la
     dice il pasto stesso, e per chi non ce l'ha la dice la fascia. */
  const ORA_FASCIA={"colazione":7.5,"metà mattina":10.5,"meta mattina":10.5,"pranzo":13,
    "metà pomeriggio":16.5,"meta pomeriggio":16.5,"tardo pomeriggio":18.5,"cena":20,"dopo cena":22};
  const oraDi=m=>{
    const t=parseFloat(String(m.t||"").replace(":","."));
    if(isFinite(t)&&t>0)return t;
    return ORA_FASCIA[nrm(m.n)]||13;};
  meals.sort((a,b)=>oraDi(a)-oraDi(b));
  return Object.assign({},giorno,{meals:meals});}
window.pbSlots=pbSlots;

window.onb2RicetteBase=(targetK)=>{
  const base=(typeof BASE_RICETTE!=="undefined")?BASE_RICETTE:null;
  if(!base||!base.length)return null;
  const t=+targetK||0;
  if(!(t>0))return null;
  /* i pasti scelti, se a questo punto sono già stati travasati */
  const sceltiSlots=(typeof parseSlots==="function")?parseSlots((S.pref&&S.pref.slots)||""):[];
  let tagliato=false;
  const piano=base.map(g0=>{
    const g=sceltiSlots.length?pbSlots(g0,sceltiSlots):g0;
    const {tutto,mobile}=pbPesi(g);
    /* il fattore si applica ai soli pasti ritoccabili: i liberi
       restano interi e la differenza la assorbono gli altri */
    const serve=t-(tutto-mobile);
    let f=(mobile>0&&serve>0)?serve/mobile:1;
    if(f<PB_MIN){f=PB_MIN;tagliato=true;}
    if(f>PB_MAX){f=PB_MAX;tagliato=true;}
    return {...g,meals:(g.meals||[]).map(m=>{
      if(m.type==="free")return JSON.parse(JSON.stringify(m));
      return {...m,o:(m.o||[]).map(o=>({...o,
        d:pbGrammature(o.d,f),
        k:Math.round((+o.k||0)*f),
        p:Math.round((+o.p||0)*f),
        c:Math.round((+o.c||0)*f),
        f:Math.round((+o.f||0)*f)}))};})};});
  piano.tagliato=tagliato;
  return piano;};

window.onb2GeneraOra=async()=>{
  const g=onb2Gen();
  if(g.stato==="lavoro"||g.stato==="fatto")return;      /* mai due volte */
  const o=onb2Stato();
  onb2Travasa();                                         /* il piano nasce dai dati veri */
  /* ── SENZA AI NON SI ASPETTA NIENTE ──
     Prima qui si diceva «lo generiamo appena c'è connessione», che
     per chi resta su Free non sarebbe successo mai: una promessa che
     non poteva essere mantenuta. Ora il piano c'è subito, ed è
     quello di base con le quantità rifatte sui suoi numeri. */
  /* Chi ha SCELTO Free riceve il piano di base anche se l'AI sarebbe
     disponibile: la scelta della persona viene prima di quello che
     l'app potrebbe fare. */
  const scelseFree=(o.ris.piani==="free");
  if(scelseFree||typeof aiOn!=="function"||!aiOn()){
    let piano=null;
    try{
      const t=onb2Targets();
      piano=t?onb2RicetteBase(dayTargetK()||t.kcal):null;
    }catch(e){piano=null;}
    g.piano=piano;g.perc=100;
    if(piano){
      g.stato="base";
      g.riga=piano.tagliato
        ? tr("Piano pronto: è quello di base, con le quantità rifatte sui tuoi numeri — alcune porzioni si sono fermate al limite di sicurezza.")
        : tr("Piano pronto: è quello di base, con le quantità rifatte sui tuoi numeri.");
    }else{
      g.stato="senzaAI";
      g.riga=tr("Il diario è già pronto: il piano lo scegli tu da Piano, quando vuoi.");}
    g.righe=[];return onb2GenTocca();}
  /* ── IL LAVORO SOPRAVVIVE ALLA PAGINA (25/08) ────────────────────
     `S.genPend` scrive su disco COSA si stava generando: se la scheda
     viene chiusa o ricaricata a metà, al ritorno il lavoro riparte da
     solo (il ripristino sta in fondo a questo file). Il pilastro dice
     «se la persona chiude la pagina non deve fallire» — fino a ieri
     falliva, in silenzio. */
  /* ── I TARGET SONO QUELLI DEL MOTORE (25/08) ──────────────────
     onb2Travasa() è appena passato, quindi S.profile è completo:
     dayTargetK() e dayTargetP() — cioè il calcolo VERO, con pavimento,
     stati fisiologici e peso di riferimento — sono disponibili. Prima
     qui si usava onb2Targets()/wizTargets(), che aveva formule sue:
     il piano nasceva su numeri diversi da quelli con cui poi veniva
     giudicato. onb2Targets resta per la PROIEZIONE (quando S non è
     ancora travasato), e da oggi condivide le stesse formule pure. */
  try{
    const b=(onb2Stato().ris.bio||{});
    const bmi=(b.w>0&&b.h>0)?Math.round(b.w/((b.h/100)**2)*10)/10:null;
    S.genPend={dati:onb2DatiPiano(),
      t:{kcal:dayTargetK(),prot:dayTargetP(),bmi:bmi,tdee:tdee()},
      at:Date.now()};save();
  }catch(e){}
  await onb2GeneraCore(S.genPend&&S.genPend.dati,S.genPend&&S.genPend.t);};

/* Il motore, separato dal cancello: lo usano la partenza normale e il
   ripristino dopo un ricaricamento — che ha i dati salvati, non lo
   stato dell'onboarding. */
async function onb2GeneraCore(dati,t){
  const g=onb2Gen();
  /* -- OGNI TENTATIVO HA UN NUMERO (27/08) -----------------------
     Il guardiano qui sotto puo' far ripartire la generazione mentre
     la precedente e' ancora appesa da qualche parte. Se poi quella
     vecchia si sveglia e scrive il suo risultato, sovrascrive il
     lavoro nuovo - o peggio, il suo errore cancella un piano buono.
     Quindi ogni tentativo prende un numero, e scrive solo se e'
     ancora il tentativo in corso. */
  const mioGiro=(g.giro=(g.giro||0)+1);
  const mio=()=>onb2Gen().giro===mioGiro;
  g.ultimo=Date.now();
  g.stato="lavoro";g.perc=2;g.fatti=0;g.riga=tr("Sto componendo il tuo piano…");
  /* Per l'orologio a vista e per l'onestà delle righe (sotto):
     t0 è QUANDO si è partiti, streamOk dice se lo streaming sta
     davvero raccontando i giorni o se stiamo aspettando tutto in
     un fiato (proxy, webview vecchie). */
  g.t0=Date.now();g.streamOk=false;
  g.righe=onb2GenRighe(0,"lavoro");onb2GenTocca();
  try{
    if(!t||!dati)throw new Error("dati");
    /* -- SI BUSSA PRIMA DI ENTRARE (founder, 27/08) ----------------
       «Prima di passare il prompt al modello, che il sistema faccia
       una chiamata per vedere se risponde e solo dopo chiedere di
       generare il piano, altrimenti si rischia che il piano non
       arrivi mai alla fine.»
       Qui vale doppio: e' il primo minuto di vita dell'app, e una
       persona che vede una barra ferma per minuti e poi un errore non
       torna. La domanda di prova dura al massimo 25 secondi. */
    if(typeof aiProva==="function"){
      g.riga=tr("Controllo che il modello risponda…");onb2GenTocca();
      const prova=await aiProva();
      if(!prova.ok)throw new Error("prova:"+(prova.motivo||"non risponde"));}
    g.riga=tr("Sto componendo il tuo piano…");onb2GenTocca();
    /* L'avanzamento è quello VERO: la fase «giorno» arriva dallo
       streaming, contando i giorni già scritti nel testo. La barra si
       muove con loro — 10% a giorno per sette giorni, poi controllo ed
       eventuale ritocco — invece di stare ferma a un numero recitato. */
    /* ── QUANDO IL LAVORO VERO NON PARLA (v15.19.0) ──────────────
       Chi passa dal nostro server non riceve lo streaming: la fase
       «giorno» non arriva mai e questa barra restava a 8 per un
       minuto intero — proprio a chi ha l'abbonamento. L'attesa
       onesta si muove sul TEMPO (la memoria di quanto è durata
       l'ultima volta), si ferma al 92% e cede il posto al lavoro
       vero appena lo streaming apre bocca. Il perché sta in
       `71_attesa.js`; la regola è scritta sotto la barra. */
    /* La regola della barra è già dichiarata sotto di essa — «l'ultima
       volta ci ha messo X» — quindi qui non serve una seconda frase:
       due modi di dire la stessa cosa sono il difetto che abbiamo già
       corretto altrove (il banner della settimana nuova). */
    let att=null;
    try{att=attesaAvvia((p)=>{
      if(!mio()||g.stato!=="lavoro")return;
      if(p>g.perc){g.perc=p;g.ultimo=Date.now();onb2GenTocca();}});}catch(e){}
    const plan=await wizGenDays(dati,t,null,(f,extra)=>{
      if(!mio())return;                 /* un tentativo vecchio non parla piu' */
      g.ultimo=Date.now();              /* la prova che qualcosa si muove */
      /* Qualunque fase DOPO «settimana» è lavoro vero che parla: la
         barra a tempo si spegne qui, una volta sola. Cedere solo su
         «giorno» non bastava — senza streaming la prima fase vera è
         «controllo», e la barra finta (arrivata a 92) sarebbe
         tornata indietro a 82 sotto gli occhi della persona. */
      if(f!=="settimana"){try{if(att&&!att.ceduta())att.vero();}catch(e){}}
      if(f==="settimana"){g.perc=8;g.riga=tr("Sto componendo il tuo piano…");g.righe=onb2GenRighe(0,"lavoro");}
      else if(f==="giorno"){g.streamOk=true;
        g.fatti=extra.fatti;g.perc=8+Math.round(extra.fatti*10);
        g.riga=extra.ora?trh("Sto scrivendo {v1}…",{v1:extra.ora}):tr("Sto componendo il tuo piano…");
        g.righe=onb2GenRighe(extra.fatti,"lavoro");}
      else if(f==="controllo"){g.fatti=7;g.perc=82;g.riga=tr("Controllo i conti e quello che hai escluso…");g.righe=onb2GenRighe(7,"controllo");}
      else if(f==="ritocco"){g.perc=88;g.riga=trh("Rifaccio i giorni che non tornano: {v1}…",{v1:(extra||[]).join(", ")});g.righe=onb2GenRighe(7,"controllo");}
      onb2GenTocca();});
    /* ── IL PIANO SU MISURA NON SI BUTTA PIÙ (v13.98) ──────────────
       Qui c'era il ripiego che il founder ha visto in faccia: un
       alimento escluso rimasto dentro faceva scartare TUTTO il piano
       su misura e consegnare quello di base — «un piano fatto per
       un'altra persona». Adesso i divieti rimasti vengono sostituiti
       con alternative sicure dentro chiediSettimana, e quello che si
       consegna è il piano suo, con detto cosa è stato scambiato. */
    if(!mio())return;                   /* e' ripartito: questo risultato e' vecchio */
    if(plan&&plan.adattati&&plan.adattati.length){
      const q=plan.adattati.length;
      g.adattati=plan.adattati;
      g.notaAdatt=(q===1)
        ? tr("Un piatto l'ho adattato ai tuoi vincoli: lo trovi segnato nel Piano.")
        : trh("Ho adattato {v1} piatti ai tuoi vincoli: li trovi segnati nel Piano.",{v1:q});}
    /* ── UN PASTO CHE MANCA SI DICE (founder, 29/08) ──────────────
       «Ancora una volta il pasto del tardo pomeriggio non è stato
       generato, perché?» — e la risposta più scomoda non è perché il
       modello lo saltava (quello si ripara nel contratto, poco fa):
       è che quando lo saltava DAVVERO, dopo il rifacimento, qui
       compariva «Piano pronto, spesa compresa.» e nient'altro. Il
       controllo lo sapeva — `validaSettimana` lo marca grave — ma la
       persona no, e si ritrovava quattro pasti su cinque senza un
       motivo. Un piano incompleto che si annuncia completo è la
       versione peggiore di un piano incompleto. */
    let notaMancanti="";
    try{
      const mancanti=(typeof pastiMancanti==="function")?pastiMancanti(plan&&plan.problemi):[];
      if(mancanti.length)notaMancanti=" "+((mancanti.length===1)
        ? trh("Un pasto però non è stato scritto ({v1}): lo aggiungi dal Piano, oppure rigeneri.",{v1:mancanti[0]})
        : trh("Questi pasti però non sono stati scritti ({v1}): li aggiungi dal Piano, oppure rigeneri.",{v1:mancanti.join(", ")}));
    }catch(e){}
    try{if(att)att.ferma();}catch(e){}
    g.piano=plan||null;g.stato=plan?"fatto":"errore";g.perc=100;
    g.riga=plan?((g.notaAdatt?(tr("Piano pronto, spesa compresa.")+" "+g.notaAdatt):tr("Piano pronto, spesa compresa."))+notaMancanti)
               :tr("Il piano lo rifacciamo con calma da Piano: il diario intanto è già tuo.");
    g.righe=plan?onb2GenRighe(7,"fatto"):[];
  }catch(e){
    if(!mio())return;                   /* l'errore di un tentativo superato non conta */
    /* Il MOTIVO si scrive: «non e' arrivato» senza un perche' e' il
       tipo di frase che costringe a indovinare - chiave, rete, quota? */
    const grezzo=String((e&&e.message)||e||"");
    const daProva=/^prova:/.test(grezzo);
    const perche=daProva?grezzo.slice(6)
      :((typeof aiReason==="function")?aiReason(e):"");
    /* -- NON SI RESTA A MANI VUOTE (27/08) ------------------------
       Se il modello non ha nemmeno risposto alla domanda di prova, il
       piano su misura non arrivera': invece di lasciare la persona con
       un errore e basta, le si da' il piano di BASE ricalibrato sui
       suoi numeri - lo stesso che riceve chi sceglie Free - e si dice
       com'e' andata. Un piano vero addosso vale piu' di una promessa. */
    let ripiego=null;
    if(daProva){
      try{const tt=onb2Targets();ripiego=tt?onb2RicetteBase(dayTargetK()||tt.kcal):null;}catch(_){ripiego=null;}}
    if(ripiego){
      g.piano=ripiego;g.stato="base";g.perc=100;g.righe=[];
      g.riga=trh("Il modello non risponde ({v1}): intanto ti ho preparato il piano di base sui tuoi numeri, quello su misura lo rifai da Piano quando vuoi.",{v1:perche||"errore"});
    }else{
      g.stato="errore";g.perc=100;g.righe=[];
      g.riga=trh("Il piano non è arrivato ({v1}): lo rifacciamo da Piano, il diario intanto è già tuo.",{v1:perche||"errore"});}}
  if(!mio())return;
  onb2GenChiusa();}

/* ═══ IL GUARDIANO: SE IL TELEFONO SI SPEGNE, SI RIPRENDE ═════════
   RICHIESTA DEL FOUNDER (27/08): «attenzione poi che se l'utente non
   aspetta e blocca lo schermo come c'e' scritto che si puo' fare, il
   piano viene interrotto e appaiono questi errori.»

   Ed e' vero, ed e' colpa nostra due volte: gli abbiamo scritto che
   puo' mettere via il telefono, e quando lo fa la richiesta muore.
   Il sistema operativo sospende la scheda: la connessione cade e la
   promessa resta appesa per sempre, oppure torna un errore di rete
   che noi mostravamo come un fallimento definitivo.

   Il guardiano non guarda l'orologio della generazione (un piano
   lento e' normale): guarda QUANDO E' ARRIVATO L'ULTIMO SEGNO DI
   VITA. Se la pagina e' di nuovo davanti agli occhi, il lavoro
   risulta in corso e da 75 secondi non si muove niente, il tentativo
   e' morto: si riparte dagli stessi dati salvati su disco, dicendolo.

   Due tentativi, non infiniti: se non riparte, si consegna il piano
   di base invece di girare in tondo. */
const O2_MUTO_MS=75000;      /* silenzio oltre il quale il tentativo e' morto */
const O2_RIPRESE=2;          /* quante volte si riprova a riprendere */
function onb2Guardiano(){
  const g=onb2Gen();
  if(g.stato!=="lavoro")return;
  try{if(document.visibilityState!=="visible")return;}catch(e){}
  if(Date.now()-(g.ultimo||0)<O2_MUTO_MS)return;
  const p=(S.genPend&&S.genPend.dati&&S.genPend.t)?S.genPend:null;
  g.riprese=(g.riprese||0)+1;
  if(!p||g.riprese>O2_RIPRESE){
    g.ultimo=Date.now();
    let ripiego=null;
    try{const tt=onb2Targets();ripiego=tt?onb2RicetteBase(dayTargetK()||tt.kcal):null;}catch(_){ripiego=null;}
    if(ripiego){g.piano=ripiego;g.stato="base";g.perc=100;g.righe=[];
      g.riga=tr("L'attesa si è interrotta: intanto ti ho preparato il piano di base sui tuoi numeri, quello su misura lo rifai da Piano quando vuoi.");}
    else{g.stato="errore";g.perc=100;g.righe=[];
      g.riga=tr("L'attesa si è interrotta: il piano lo rifai da Piano quando vuoi, il diario intanto è già tuo.");}
    return onb2GenChiusa();}
  g.ultimo=Date.now();
  g.riga=tr("Riprendo da dove eravamo…");
  try{onb2GenTocca();}catch(e){}
  onb2GeneraCore(p.dati,p.t);}
window.onb2Guardiano=onb2Guardiano;
setInterval(onb2Guardiano,15000);
/* E quando lo schermo si riaccende non si aspettano i quindici
   secondi del giro: si guarda subito, che e' il momento in cui la
   persona sta guardando. */
try{document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="visible")setTimeout(onb2Guardiano,1200);});}catch(e){}

/* ═══ COSA SUCCEDE QUANDO IL LAVORO FINISCE ══════════════════════
   Tre casi, e nessuno perde il piano:
   • la persona è ancora nell'onboarding → il piano si SALVA su disco
     (`S.genPronto`): anche se ricarica prima di premere «Entra», al
     ritorno c'è;
   • è già entrata nell'app (il tappo dei 60 secondi non esiste più:
     si entra subito) → il piano SI APPLICA DA SOLO, e un avviso dice
     dov'è;
   • è andata male → lo stato resta scritto, col motivo. */
function onb2GenChiusa(){
  const g=onb2Gen();
  try{delete S.genPend;}catch(e){}
  const buono=(g.stato==="fatto"||g.stato==="base")&&g.piano;
  if(buono){
    const spesa=(g.stato==="fatto"&&g.piano.spesa)?g.piano.spesa:null;
    if((S.onboard&&S.onboard.done)||g.applicaDaSolo){
      onb2RicetteApplica(g.piano,spesa,g.stato);
      try{genBoxVia();}catch(e){}
      try{toast(tr("Piano pronto ✓ — lo trovi in Piano."));}catch(e){}
      try{render(cur);}catch(e){}
    }else{
      /* copia PULITA su disco: le proprietà appese all'array (spesa,
         problemi) non sopravvivono a JSON, quindi si separano qui */
      try{S.genPronto={piano:JSON.parse(JSON.stringify(g.piano)),spesa:spesa,origine:g.stato,at:Date.now()};save();}catch(e){}
    }
  }else{try{save();}catch(e){}try{genBoxVia();}catch(e){}}
  onb2GenTocca();}

/* L'applicazione del piano, in un posto solo: la usano la chiusura
   dell'onboarding, il completamento in sottofondo e il ripristino.
   NON si chiama onb2Applica: quel nome esiste già più sotto (applica
   le risposte del RACCONTO alle schermate) e l'hoisting della seconda
   dichiarazione avrebbe sepolto questa in silenzio — è successo, e
   l'ha trovato il collaudo del sottofondo. */
function onb2RicetteApplica(piano,spesa,origine){
  /* CHI ha scritto il piano si registra (riscontro del founder,
     25/08 sera): gli è arrivato il piano di partenza ricalibrato e
     l'app non gli ha detto che NON era quello dell'AI — l'ha
     scoperto riconoscendo i suoi piatti. La pagina Piano ora lo
     dichiara (vedi renderRicette). */
  try{S.ui.ricetteOrigine=(origine==="base")?"base":"ai";}catch(e){}
  S.ricette=piano;RICETTE=S.ricette;S.permMeals={};
  /* la lista passa dal normalizzatore anche qui: e' l'altra strada che
     scriveva la risposta del modello com'era (i «[object Object]») */
  S.customShop=((typeof normSpesaAI==="function")?normSpesaAI(spesa):spesa)||null;
  S.shop={};S.week=freshWeek();
  try{S.ui.ricetteProprie=0;}catch(e){}
  try{delete S.genPronto;}catch(e){}
  save();}
window.onb2RicetteApplica=onb2RicetteApplica;

/* I dati del piano in un posto solo: li usano la generazione in
   sottofondo e la chiusura. Due copie diverse sarebbero due piani. */
function onb2DatiPiano(){
  const o=onb2Stato(),b=o.ris.bio||{};
  const goalMap={perdere:"moderato",mantenere:"mantenimento",massa:"massa"};
  const nascita=b.dob?new Date(b.dob)
    :(function(){const d=new Date();d.setFullYear(d.getFullYear()-(+b.eta||30));return d;})();
  const vietati=[S.pref.no,S.pref.religiose,S.pref.patologie?tr("tenere conto di: {v1}",{v1:S.pref.patologie}):""]
    .filter(Boolean).join("; ");
  /* ── DUE COSE DIVERSE, E VANNO TENUTE SEPARATE ────────────────────
     `no` è il testo che legge il MODELLO, e contiene anche le
     patologie introdotte da «tenere conto di: …» — una frase, non un
     elenco di alimenti.
     `vietatiLista` è quello che confronta il CODICE, e deve contenere
     solo alimenti. Passando il testo intero, il controllo di sicurezza
     avrebbe messo fra le parole vietate «tenere» e «conto»: da lì in
     poi nessun piano sarebbe più passato, e il motivo sarebbe stato
     incomprensibile. */
  const vietatiLista=vietatiElenco([S.pref.no,S.pref.religiose].filter(Boolean).join("; "),S.pref.intol);
  const allergeniLista=(typeof allergeniElenco==="function")?allergeniElenco(S.pref.allergie||""):[];
  return {vietatiLista:vietatiLista,allergeniLista:allergeniLista,
    gen:b.gen||"m",dob:nascita.toISOString().slice(0,10),h:+b.h,w:+b.w,
    /* la massa grassa, se è stata data nella scheda Dettagli: il prompt
       ha sempre avuto questo campo e gli arrivava sempre vuoto */
    fat:(S.profile&&S.profile.fatp)||null,
    act:o2Att(o.ris.attivita)||1.375,goal:goalMap[o.ris.obiettivo]||"moderato",
    vita:o.ris.ritmi||"",sport:o.ris.attivita||"",
    intol:S.pref.intol||"",allergie:S.pref.allergie||"",no:vietati,si:S.pref.si||"",
    farmaci:S.pref.farmaci||"",medico:S.pref.medico||"",
    integrareOk:S.pref.integrareOk||"chiedi",
    varieta:(S.pref.varieta||"media"),
    pronto:(o.ris.cucina==="veloce")?"pronto":"semplice",
    /* -- I NOMI DEI PASTI, NON SOLO IL NUMERO (27/08) -------------
       `S.pref.slots` esiste da sempre (lo scrive il travaso, con le
       spunte della schermata «Quali pasti fai»), ma da qui non usciva
       e il generatore riceveva solo `nPasti`. Da lì il piano con la
       colazione a chi la colazione non la fa. */
    slots:S.pref.slots||"",
    nPasti:S.pref.nPasti||5,colaz:"",liberi:(S.pref.pastiLiberi!=null?+S.pref.pastiLiberi:1),
    /* ── LE RISPOSTE NUOVE ARRIVANO AL PIANO ──────────────────────
       `note` era una stringa vuota scritta a mano: adesso porta quello
       che la persona ha scritto. E i pasti fuori casa arrivano qui
       perché il generatore ha già le regole per trattarli — non
       inventare grammature, non comprarli nella spesa — e finora non
       si accendevano mai. */
    note:S.pref.note||"",
    integratori:S.pref.integratori||"",
    integratoriFreq:S.pref.integratoriFreq||"",
    mensaGiorni:S.pref.mensaGiorni||"",
    outType:S.pref.outType||"fuori"};}

/* Le sole quattro cose che non si possono dedurre da nient'altro. */
function onb2Modulo(sc){
  const o=onb2Stato(),b=o.ris.bio||{};
  return onb2Chip("bio")+
   `<div class="o2form">
      <!-- Il NOME (22/08): la prima voce della barra è il punto della
           situazione di QUESTA persona, e finora si chiamava «Punto»
           perché il nome non veniva mai chiesto. Anche l'assistente
           salutava un nome che nessuno aveva scritto. Una riga, non
           una schermata: chi non vuole darlo lo lascia vuoto. -->
      <label>${esc(tr("Come ti chiami"))}</label>
      <input type="text" id="o2nome" autocomplete="given-name" maxlength="40"
             value="${esc(bz("o2nome",b.nome||(S.profile&&S.profile.name)||""))}">
      <label>${esc(tr("Sei…"))}</label>
      <select id="o2gen"><option value="m"${bz("o2gen",b.gen)!=="f"?" selected":""}>${esc(tr("Uomo"))}</option>
        <option value="f"${bz("o2gen",b.gen)==="f"?" selected":""}>${esc(tr("Donna"))}</option></select>
      <div class="grid2">
        <div><label>${esc(tr("Data di nascita"))}</label>
          <!-- La DATA, non l'età: con l'età si costruiva una data finta
               (1° gennaio di N anni fa) e il metabolismo si calcolava su
               quella. Un campo data si compila in un gesto sul telefono,
               e il numero che ne esce è vero. -->
          <!-- SI SCRIVE, non si sfoglia un calendario. Chiesto dal
               founder il 19/08 provando il percorso: con il campo
               type=date il telefono apriva il calendario ad AGOSTO
               2012 e per arrivare al 1985 servivano decine di tocchi.
               Chi conosce la propria data la scrive in tre secondi;
               le barrette le mette l'app mentre digiti. -->
          <input type="text" id="o2dob" inputmode="numeric" maxlength="10"
                 placeholder="${esc(tr("gg/mm/aaaa"))}"
                 oninput="dateMask(this);onb2Proiezione()"
                 value="${esc(bz("o2dob",b.dob?dobPretty(b.dob):""))}"></div>
        <div><label>${esc(trh("Altezza ({v1})",{v1:(typeof unitaAlt==="function")?unitaAlt():"cm"}))}</label>
          ${/* IN PIEDI E POLLICI NON SI SCRIVE IN UN CAMPO NUMERICO
                (v15.0.0): «5'10"» ha un apostrofo dentro, e un
                <input type=number> lo rifiuta in silenzio — il campo
                resta vuoto e la persona non capisce perché. Con le
                unità imperiali il campo diventa testo, con l'esempio
                nel segnaposto; in metrico resta numerico, che sul
                telefono apre la tastiera dei numeri. */
            (typeof imperiale==="function"&&imperiale())
            ? `<input type="text" id="o2h" inputmode="numeric" maxlength="8" placeholder="5'10&quot;"
                 oninput="onb2Proiezione()"
                 value="${esc(bz("o2h",b.h?altTxt(b.h):""))}">`
            : `<input type="number" id="o2h" inputmode="numeric" min="120" max="230" oninput="onb2Proiezione()" value="${esc(bz("o2h",b.h||""))}" placeholder="175">`}</div>
      </div>
      <label>${esc(trh("Peso di oggi ({v1})",{v1:(typeof unitaPeso==="function")?unitaPeso():"kg"}))}</label>
      <input type="number" id="o2w" inputmode="decimal" step="0.1" min="30" max="700" oninput="onb2Proiezione()" value="${esc(bz("o2w",b.w||""))}" placeholder="${(typeof imperiale==="function"&&imperiale())?"175":"80"}">

      <!-- ── DOVE VUOI ARRIVARE, NELLA STESSA SCHERMATA (28/08) ────
           Era una schermata a sé, due dopo questa. Ma la proiezione
           («ci vogliono 14 settimane») ha bisogno di peso, altezza ed
           età: chiederla qui, sotto i numeri che la alimentano, la fa
           comparire mentre scrivi invece che dopo due schermate. E la
           prima cosa che l'app RESTITUISCE arriva prima. -->
      <label style="margin-top:16px">${esc(trh("Dove vorresti arrivare ({v1})",{v1:(typeof unitaPeso==="function")?unitaPeso():"kg"}))}</label>
      <input type="number" id="o2goal" inputmode="decimal" step="0.1" min="30" max="700"
        value="${esc(bz("o2goal",o.ris.pesoObiettivo||""))}" placeholder="${(typeof imperiale==="function"&&imperiale())?"160":"72"}"
        oninput="onb2Proiezione()">
      <span class="o2hint">${esc(tr("Facoltativo: se non ce l'hai in mente, si va avanti lo stesso."))}</span>
      ${onb2RitmoHTML()}
    </div>
    <div class="o2ins" id="o2ins" aria-live="polite">${onb2ProiezioneHTML()}</div>

    <!-- ── GLI ALTRI NUMERI, RICHIUSI (28/08) ────────────────────
         Erano la QUARTA schermata del percorso: massa grassa, pliche
         e circonferenze prima ancora di aver visto cos'è l'app.
         Facoltative lo erano già, ma il posto diceva un'altra cosa —
         «qui bisogna essere precisi». Adesso sono qui sotto, chiuse:
         chi ha quei numeri li trova, chi non li ha non li vede. -->
    <details class="primo-tec" style="margin-top:16px">
      <summary>${esc(tr("Ho altri numeri del mio corpo"))}</summary>
      <div class="hint">${esc(tr("Solo se li conosci: rendono i target e gli allenamenti più precisi. Finiscono in Io → Misure dello studio, che è l'unico posto dove vivono."))}</div>
      ${onb2DettagliCampi()}
    </details>`+
   onb2Mic("bio");}

/* ═══ I PIANI, RACCONTATI SENZA PREZZI ════════════════════════════
   Tre regole, tutte del founder (23/08):
   • NIENTE PREZZI: «presto». Un listino su un'app non ancora
     pubblicata è un numero che cambierà, e un numero che cambia dopo
     che qualcuno l'ha letto è una promessa rotta. Quando i piani
     apriranno, i prezzi arriveranno dal server come dappertutto.
   • COSA È INCLUSO, con la formula «tutto quello che c'è in X, più…».
     Dice due cose in una: che il Free non è un assaggio a tempo, e
     che pagare AGGIUNGE invece di sbloccare qualcosa che era già lì.
   • STESSO STILE delle altre schermate: le stesse card di ogni altra
     domanda, non un cartellone.
   E il Free dice la verità su cosa riceve: il piano di base con le
   quantità rifatte sui suoi numeri, non «niente piano». */
function ONB2_PIANI(){return [
 /* ── I PIANI A PAGAMENTO DEVONO FAR VENIRE VOGLIA (24/08) ───────
    Le descrizioni erano corrette e spente: elencavano funzioni con la
    stessa voce con cui il Free elenca le sue. Il founder l'ha detto
    netto: «sul free parla di base, sugli altri parla di AI, di
    illimitati, di cose fighe in due righe».
    Cosa cambia, in concreto: il Free dice cosa RICEVE (è il piano di
    base, ed è completo per quello che è); gli altri dicono cosa
    SUCCEDE in più, e la parola che fa la differenza — l'AI che scrive
    su misura, il senza limiti, il piatto fotografato — sta all'inizio
    della riga, non in fondo.
    Resta la formula «tutto quello che c'è in X, più…»: dice che il
    Free non è un assaggio a tempo e che pagare AGGIUNGE.
    E resta la regola dei prezzi: nessun numero finché non è vero. */
 {k:"free",n:tr("Free"),p:tr("sempre gratis"),
  d:tr("Il piano di base, con le quantità rifatte sui tuoi numeri. Diario, alimenti, peso, spesa e backup sul tuo Drive: tutto quello che serve per cominciare davvero.")},
 {k:"start",n:"Start",p:tr("presto"),
  d:tr("L'AI ti propone le ricette della settimana — sui tuoi orari, i tuoi gusti, le tue intolleranze — e te le riorganizza quando la settimana cambia. Ogni piatto si cambia con un tocco. Tutto quello che c'è in Free, più questo.")},
 {k:"complete",n:"Complete",p:tr("presto"),
  d:tr("Fotografi il piatto e l'AI lo pesa per te, lo scontrino diventa dispensa, e le domande all'AI non hanno più un limite. Tutto quello che c'è in Start, più questo.")},
 {k:"premium",n:"Premium",p:tr("presto"),
  d:tr("Anche gli allenamenti scritti su misura per te, e il sostegno nei momenti difficili quando serve davvero. Tutto quello che c'è in Complete: è Nuvia intera.")}
];}
window.ONB2_PIANI=ONB2_PIANI;

function onb2Piani(sc){
  const o=onb2Stato(),val=o.ris.piani;
  return onb2Chip("piani")+
   `<div class="o2ops">`+ONB2_PIANI().map(P=>
    `<button class="o2op o2piano${val===P.k?" scelta":""}" type="button"
       onclick="onb2Rispondi('piani','${esc(P.k)}')">
       <span class="o2pr"><b>${esc(P.n)}</b><i>${esc(P.p)}</i></span>
       <span>${esc(P.d)}</span>
     </button>`).join("")+`</div>`+
   `<span class="o2hint">${esc(tr("Nessun pagamento adesso: quando i piani apriranno te lo diciamo."))}</span>`;}

/* Peso obiettivo + l'unico numero che conta: quanto ci vuole DAVVERO. */
function onb2Numero(sc){
  const o=onb2Stato(),val=o.ris[sc.k]||"";
  return onb2Chip(sc.k)+
   `<div class="o2form">
      <label>${esc(tr("Peso obiettivo"))} (${esc(sc.unita)})</label>
      <input type="number" id="o2goal" inputmode="decimal" step="0.1" min="${sc.min}" max="${sc.max}"
        value="${esc(bz("o2goal",val))}" placeholder="72" oninput="onb2Proiezione()">
    </div>
    <div class="o2ins" id="o2ins" aria-live="polite">${onb2ProiezioneHTML()}</div>`+
   onb2Mic(sc.k);}

/* ── La proiezione: numeri veri, dal motore già collaudato ─────────
   wizTargets() legge WIZ.d, quindi si travasano lì le risposte e si
   chiede a lui. Nessuna formula duplicata: se un giorno cambia la
   formula del fabbisogno, cambia anche qui, da sola.               */
/* ── I CAMPI CHE SI STANNO SCRIVENDO, NON QUELLI GIÀ SALVATI ───────
   RICHIESTA DEL FOUNDER (29/08): «quando l'utente inserisce il peso
   obiettivo non si vede neanche più in quanto tempo perderà quei kg».

   Non era sparita: non era MAI comparsa al primo passaggio. Il
   riquadro leggeva `o.ris.bio`, che si riempie solo quando si preme
   Avanti — cioè quando la schermata è già stata lasciata. Chi scriveva
   185, 115 e 90 e restava lì continuava a leggere «Appena scrivi il
   peso, ti dico quanto ci vuole», con il peso scritto davanti.
   Riprodotto in prova prima di toccare niente, e il collaudo nuovo lo
   rifà diventare rosso se qualcuno rimette lo stato al posto dei campi.

   Le conversioni sono le STESSE del salvataggio (`pesoIn`/`altIn`):
   in libbre «250» dev'essere 113 kg qui come là, altrimenti la
   proiezione promette un tempo e il piano ne calcola un altro. */
function onb2BioLive(){
  const o=onb2Stato(),b=Object.assign({},o.ris.bio||{});
  const g=id=>{const e=document.getElementById(id);return e?String(e.value||"").trim():"";};
  const dobTxt=g("o2dob");
  if(dobTxt){
    const dob=(typeof dobParse==="function")?dobParse(dobTxt):null;
    if(dob){b.dob=dob;
      b.eta=Math.floor((Date.now()-Date.parse(dob))/(365.25*864e5));}}
  const hTxt=g("o2h");
  if(hTxt){const h=(typeof altIn==="function")?altIn(hTxt):parseFloat(hTxt);
    if(isFinite(h)&&h>0)b.h=Math.round(h);}
  const wTxt=g("o2w");
  if(wTxt){const w=(typeof pesoIn==="function")?pesoIn(wTxt):parseFloat(wTxt);
    if(isFinite(w)&&w>0)b.w=Math.round(w*10)/10;}
  const gen=g("o2gen"); if(gen)b.gen=gen;
  return b;}
window.onb2BioLive=onb2BioLive;

/* L'obiettivo che si sta scrivendo, in CHILI: il campo parla nelle
   unità della persona, la proiezione ragiona in metrico come tutto
   il resto dell'app. */
function onb2GoalLive(){
  const e=document.getElementById("o2goal");
  const t=e?String(e.value||"").trim():"";
  if(t){const v=(typeof pesoIn==="function")?pesoIn(t):parseFloat(t.replace(",","."));
    if(isFinite(v)&&v>0)return Math.round(v*10)/10;
    return 0;}
  return +((onb2Stato().ris||{}).pesoObiettivo)||0;}
window.onb2GoalLive=onb2GoalLive;

function onb2Targets(bioLive){
  const o=onb2Stato(),b=bioLive||o.ris.bio||{};
  if(!(b.w>0)||!(b.h>0)||!(b.eta>0))return null;
  const goalMap={perdere:"moderato",mantenere:"mantenimento",massa:"massa"};
  const salva=(typeof WIZ!=="undefined"&&WIZ)?WIZ.d:null;
  try{
    /* la data vera se c'è; l'età resta solo come ripiego per chi ha
       già compilato il percorso con la versione vecchia */
    const nascita=b.dob?new Date(b.dob)
      :(function(){const d=new Date();d.setFullYear(d.getFullYear()-(+b.eta||30));return d;})();
    WIZ.d={gen:b.gen||"m",dob:nascita.toISOString().slice(0,10),h:+b.h,w:+b.w,fat:null,
           act:o2Att(o.ris.attivita)||1.375,goal:goalMap[o.ris.obiettivo]||"moderato"};
    return wizTargets();
  }catch(e){return null;}
  finally{if(salva)WIZ.d=salva;}}
window.onb2Targets=onb2Targets;

/* ═══ QUANTO IN FRETTA, E COSA COMPORTA ════════════════════════════
   RICHIESTA DEL FOUNDER (29/08): «vedo inoltre che non fai più
   scegliere all'utente quanti kg a settimana perdere, spiegando pro e
   contro della scelta che fa e come deve essere seguito in caso
   scelga 1 kg a settimana».

   Il motore c'era già e girava a vuoto: `S.profile.defMode="ritmo"` +
   `S.pref.ritmo` esistono da sempre e li imposta soltanto la pagina
   Regole — cioè un posto in cui una persona nuova non entra. Chi
   finiva il percorso guidato prendeva il ritmo che gli era stato
   deciso dal tipo di obiettivo, senza sapere né qual era né che si
   poteva cambiare. La stessa famiglia di difetti di sempre: una
   regola scritta bene, raggiungibile da una strada sola.

   STA QUI DENTRO, NON IN UNA SCHERMATA SUA. Il percorso è a 25
   schermate per una scelta esplicita del founder (v15.0.0, la barra
   avanza del 4% esatto) e aggiungerne una per una tendina sarebbe
   disfare quel lavoro. E soprattutto: la domanda ha senso solo
   accanto al peso obiettivo, con la proiezione che si muove sotto —
   scegliere «1 kg a settimana» e vedere le settimane dimezzarsi
   nello stesso istante è l'unica versione di questa domanda che
   insegna qualcosa.

   I PRO E I CONTRO SONO SCRITTI, NON SOTTINTESI. Ogni ritmo dice cosa
   costa: sotto, il tempo; sopra, la fame e il muscolo. E a 1 kg a
   settimana la riga sul controllo medico non è un asterisco in fondo:
   è il testo dell'opzione, perché quello è il momento in cui viene
   letto. Il tetto di sicurezza del motore (30% del fabbisogno) resta
   dov'era e continua a valere: se il ritmo scelto lo supera, la
   proiezione lo DICHIARA invece di promettere un tempo che il piano
   non produrrà mai. */
const O2RITMI=[0.25,0.5,0.75,1];
const O2RITMO_DEF=0.5;
function onb2RitmoScelto(){
  const v=parseFloat((onb2Stato().ris||{}).ritmo);
  return (v>0)?v:O2RITMO_DEF;}
window.onb2RitmoScelto=onb2RitmoScelto;

/* Cosa comporta ciascuno, in una riga che si legge prima di scegliere. */
function onb2RitmoNota(kg){
  if(kg<=0.25)return tr("Quasi non si sente e il muscolo non si tocca, ma il tempo raddoppia.");
  if(kg<=0.5) return tr("Il passo che regge nel tempo: si perde grasso e la fame resta gestibile.");
  if(kg<=0.75)return tr("Si vede prima, ma la fame si sente e le proteine vanno tenute alte.");
  return tr("Rapido e impegnativo: a questo ritmo si rischia di perdere anche muscolo, e va fatto seguiti da un medico o da un nutrizionista, non da soli.");}

function onb2RitmoHTML(){
  const o=onb2Stato();
  /* la domanda ha senso solo per chi vuole perdere peso: a chi
     mantiene non si chiede un ritmo, e a chi mette massa il ritmo è
     un'altra cosa (e ha già la sua strada nelle Regole) */
  if(o.ris.obiettivo!=="perdere")return "";
  const sel=onb2RitmoScelto();
  const uP=(typeof unitaPeso==="function")?unitaPeso():"kg";
  return `<label style="margin-top:16px">${esc(trh("Quanto in fretta ({v1} a settimana)",{v1:esc(uP)}))}</label>
    <div class="o2ritmi" role="radiogroup">`+
    O2RITMI.map(kg=>{
      const on=(Math.abs(kg-sel)<0.01);
      /* il numero si mostra nelle unità della persona: 0,5 kg sono
         1,1 lb, e a chi vive in libbre «0,5» non dice niente */
      const et=(typeof pesoNum==="function")?pesoNum(kg,(uP==="lb"?1:2)):kg;
      const etx=(typeof numLoc==="function")?numLoc(et):et;
      return `<button type="button" class="o2ritmo${on?" scelta":""}" role="radio" aria-checked="${on}"
         onclick="onb2RitmoSet(${kg})">
         <b>${esc(String(etx))}</b><span>${esc(onb2RitmoNota(kg))}</span></button>`;}).join("")+
    `</div>`;}
window.onb2RitmoHTML=onb2RitmoHTML;

window.onb2RitmoSet=(kg)=>{
  const o=onb2Stato();o.ris.ritmo=+kg;onb2Salva();
  /* si ridisegna solo il gruppo, non la schermata: ridisegnare tutto
     farebbe perdere quello che si sta scrivendo negli altri campi */
  const box=document.querySelector(".o2ritmi");
  if(box&&box.parentNode){
    const tmp=document.createElement("div");tmp.innerHTML=onb2RitmoHTML();
    const nuovo=tmp.querySelector(".o2ritmi");
    if(nuovo)box.parentNode.replaceChild(nuovo,box);}
  if(typeof onb2Proiezione==="function")onb2Proiezione();};

/* Il deficit che quel ritmo richiede, e quello che il motore concede.
   È la STESSA regola di `deficitTarget`/`rateEffective` (30% del
   fabbisogno): scritta due volte sarebbero due promesse diverse, e
   quella dell'onboarding sarebbe quella falsa. */
function onb2RitmoReale(kg,tdee){
  const chiesto=Math.max(1,kg*7700/7);
  const tetto=Math.max(1,Math.round(tdee*0.30));
  const vero=Math.min(chiesto,tetto);
  return {chiesto:Math.round(chiesto),tetto:tetto,def:Math.round(vero),
    kg:Math.round(vero*7/7700*100)/100,ridotto:chiesto>tetto+1};}
window.onb2RitmoReale=onb2RitmoReale;

function onb2ProiezioneHTML(bioLive,goalLive){
  const o=onb2Stato();
  const b=bioLive||o.ris.bio||{};
  const goal=(goalLive!=null)?+goalLive:(+o.ris.pesoObiettivo||0);
  /* l'attesa dice cosa manca DAVVERO, invece di chiedere sempre il
     peso: chi ha scritto il peso e non l'altezza leggeva «scrivi il
     peso» con il peso davanti (29/08) */
  const attesa=(txt)=>`<span class="o2hint">${esc(txt)}</span>`;
  if(!(b.w>0)||!(b.h>0)||!(b.eta>0))
    return attesa(tr("Scrivi data di nascita, altezza e peso: da lì ti dico quanto ci vuole."));
  if(!goal)return attesa(tr("Scrivi dove vorresti arrivare e ti dico quanto ci vuole."));
  const t=onb2Targets(b);
  if(!t)return attesa(tr("Scrivi data di nascita, altezza e peso: da lì ti dico quanto ci vuole."));
  const diff=Math.round((b.w-goal)*10)/10;
  if(Math.abs(diff)<0.5)
    return `<b>${esc(tr("Sei già dove volevi arrivare."))}</b><br><span class="o2hint">${esc(tr("Allora il piano serve a restarci: fabbisogno {k} kcal al giorno.",{k:t.tdee}))}</span>`;
  if(diff<0)
    return `<b>${esc(tr("Vuoi salire di {n}.",{n:((typeof pesoTxt==="function")?pesoTxt(Math.abs(diff),1):Math.abs(diff)+" kg")}))}</b><br><span class="o2hint">${esc(tr("Con {k} kcal al giorno e {p} g di proteine si cresce piano, che è il modo giusto.",{k:t.kcal,p:t.prot}))}</span>`;
  /* 7700 kcal ≈ 1 kg: è la stessa costante del motore di proiezione.
     ── E ADESSO IL RITMO LO SCEGLIE LA PERSONA (29/08) ─────────────
     Prima il deficit veniva dedotto dal tipo di obiettivo e la
     proiezione lo subiva. Ora, per chi vuole perdere peso, comanda il
     ritmo scelto qui sopra — e se supera il tetto del 30% del
     fabbisogno la proiezione dice il tempo VERO, non quello chiesto:
     promettere quindici settimane e poi lavorare a un ritmo che ne
     richiede venti è il modo più elegante di mentire. */
  const scelto=(onb2Stato().ris.obiettivo==="perdere")?onb2RitmoScelto():0;
  const rr=scelto?onb2RitmoReale(scelto,t.tdee):null;
  const defGiorno=rr?Math.max(1,rr.def):Math.max(1,t.tdee-t.kcal);
  const sett=Math.max(1,Math.round(diff*7700/(defGiorno*7)));
  const mesi=Math.round(sett/4.33*10)/10;
  const kcalPiano=rr?Math.max(1,t.tdee-rr.def):t.kcal;
  /* «andando piano e senza fame nera» non si può scrivere sotto un
     ritmo spinto: sarebbe la frase rassicurante messa esattamente
     dove non è vera (29/08) */
  const spinto=(rr?rr.kg:0)>=0.75;
  const coda=spinto
    ? (mesi>=2?tr("Poco più di {m} mesi, ma è un passo che si sente.",{m:((typeof numLoc==="function")?numLoc(mesi):mesi)}):tr("È un passo che si sente."))
    : (mesi>=2?tr("Poco più di {m} mesi, andando piano e senza fame nera.",{m:((typeof numLoc==="function")?numLoc(mesi):mesi)}):tr("Andando piano e senza fame nera."));
  return `<b>${esc(tr("{n} in circa {s} settimane.",{n:((typeof pesoTxt==="function")?pesoTxt(diff,1):diff+" kg"),s:sett}))}</b>
    <span class="o2hint">${esc(coda)}</span>
    ${(rr&&rr.ridotto)?`<div class="o2mini o2mini-av">${esc(trh("Il ritmo che hai scelto chiederebbe {v1} kcal di deficit al giorno: è oltre il tetto di sicurezza, quindi il piano lavora a {v2} a settimana e il tempo qui sopra è già quello vero.",{v1:rr.chiesto,v2:((typeof pesoTxt==="function")?pesoTxt(rr.kg,2):rr.kg+" kg")}))}</div>`:""}
    ${/* L'AVVISO SUL MEDICO NON DEVE SPARIRE QUANDO SCATTA IL TETTO
          (difetto mio, visto in prova il 29/08): la prima stesura lo
          mostrava solo se il tetto NON mordeva — cioè proprio a chi
          aveva scelto il ritmo più spinto l'avviso non arrivava, che
          è l'esatto contrario di quello che serve. Adesso dipende
          dal ritmo VERO del piano, non da quale messaggio è
          comparso. */""}
    ${spinto?`<div class="o2mini o2mini-av">${esc(tr("A questo ritmo fatti seguire da un medico o da un nutrizionista: non è una formalità, è il ritmo in cui si perde anche muscolo se nessuno controlla."))}</div>`:""}
    <div class="o2mini">${esc(tr("Fabbisogno {t} kcal · piano {k} kcal · {p} g di proteine",{t:t.tdee,k:kcalPiano,p:t.prot}))}</div>
    <div class="o2mini">${esc(tr("È una stima onesta, non una promessa: la ricalcolo insieme a te man mano."))}</div>`;}
window.onb2ProiezioneHTML=onb2ProiezioneHTML;

window.onb2Proiezione=()=>{
  const inp=document.getElementById("o2goal"),box=document.getElementById("o2ins");
  if(!box)return;
  /* il campo dell'obiettivo si ricorda come è SCRITTO (nelle unità
     della persona): è lo stesso valore che ridisegna il campo quando
     si torna indietro, e la conversione in chili la fa il
     salvataggio. Qui serve solo per non perdere quello che si è
     scritto se la schermata viene ridisegnata. */
  if(inp){const o=onb2Stato();o.ris.pesoObiettivo=+inp.value||0;}
  /* ma la PROIEZIONE si calcola sui campi vivi, convertiti: è il
     difetto del 29/08 — leggeva lo stato salvato e al primo
     passaggio lo stato era vuoto */
  box.innerHTML=onb2ProiezioneHTML(onb2BioLive(),onb2GoalLive());};

/* ── Consenso per il dato sensibile ──────────────────────────────
   Si chiede PRIMA di mostrare la domanda, con parole chiare, e la
   risposta si può dare anche saltando: nessuno è obbligato a
   raccontare come sta in mezzo a un questionario.                 */
function onb2Consenso(){
  const o=onb2Stato();
  if(o.sensibili===true)return `<div class="o2cons ok">${esc(tr("Grazie: resta sul tuo telefono e serve solo a scegliere le parole giuste."))}
    <button class="btn ghost small" type="button" onclick="onb2ConsensoSet(false)">${esc(tr("Ripensaci"))}</button></div>`;
  return `<div class="o2cons">
    <b>${esc(tr("Questa è una domanda personale."))}</b>
    <span>${esc(tr("La risposta resta sul tuo telefono e non esce da qui."))}</span>
    <div class="o2consb">
      <button class="btn small" type="button" onclick="onb2ConsensoSet(true)">${esc(tr("Va bene, chiedimi pure"))}</button>
      <button class="btn ghost small" type="button" onclick="onb2Salta()">${esc(tr("Preferisco non dirlo"))}</button>
    </div></div>`;}

window.onb2ConsensoSet=(v)=>{const o=onb2Stato();
  o.sensibili=!!v;
  if(!v)delete o.ris.corpo;   /* l'unica sensibile rimasta: gli stati del corpo */
  onb2Salva();renderOnb2();};

/* ── Chip modificabili: quello che la voce ha capito ─────────────
   La voce propone, non decide. Ogni campo estratto si vede, si può
   correggere (tornando alla schermata) o buttare via.             */
function onb2Chip(k){
  const o=onb2Stato();
  if(!o.saltate.includes(k))return "";
  const et=onb2Etichetta(k);
  if(!et)return "";
  return `<div class="o2chips"><span class="o2chip2" data-campo="${esc(k)}">${esc(et)}
    <button type="button" class="o2chipx" onclick="onb2ChipTogli('${esc(k)}')"
      aria-label="${esc(tr("Correggi"))}">✕</button></span>
    <span class="o2hint">${esc(tr("L'ho preso dal tuo racconto: correggilo se ho capito male."))}</span></div>`;}

function onb2Etichetta(k){
  const o=onb2Stato(),v=o.ris[k];
  if(v==null||v==="")return "";
  if(k==="bio"){const b=v||{};
    return [b.gen==="f"?tr("Donna"):tr("Uomo"),b.eta?b.eta+" "+tr("anni"):"",b.h?b.h+" cm":"",b.w?b.w+" kg":""]
      .filter(Boolean).join(" · ");}
  if(k==="pesoObiettivo")return v+" kg";
  const sc=ONB2c().find(x=>x.k===k);
  if(Array.isArray(v)){
    if(sc&&sc.op)return v.map(x=>{const t=sc.op.find(y=>y[0]===x);return t?t[1]:x;}).join(", ");
    return v.join(", ");}
  if(typeof v==="object")return Object.values(v).filter(x=>typeof x==="string").join(" · ")||tr("— compilata");
  if(sc&&sc.op){const t=sc.op.find(x=>x[0]===v);if(t)return t[1];}
  return String(v);}

window.onb2ChipTogli=(k)=>{const o=onb2Stato();
  delete o.ris[k];o.saltate=o.saltate.filter(x=>x!==k);
  onb2Salva();renderOnb2();};

/* ── Navigazione ────────────────────────────────────────────────── */
/* ── SI CONFERMA SEMPRE CON «AVANTI» (founder, 29/08) ──────────────
   «Alcune pagine, se scelgo una cosa, vanno in automatico alla
   successiva senza farmi cliccare su Avanti come conferma. Io voglio
   che l'utente clicchi sempre Avanti: so che è un tocco in più, però
   dà l'idea di avere più controllo.»
   Ha ragione, e non solo per la sensazione di controllo: l'avanzamento
   automatico era anche il motivo per cui tornare indietro sembrava
   non funzionare. Si tornava alla domanda dell'obiettivo, si toccava
   la risposta giusta — e la schermata saltava subito avanti, come se
   il ritorno non fosse mai avvenuto. Con la conferma esplicita si
   può sbagliare, tornare, correggere e RESTARE lì a guardare. */
window.onb2Rispondi=(k,v)=>{
  const o=onb2Stato();
  const sc=ONB2c().find(x=>x.k===k);
  if(sc&&sc.sensibile&&o.sensibili!==true)return;   /* niente consenso, niente risposta */
  o.ris[k]=v;
  /* se la prima risposta cambia, la seconda domanda che dipendeva da
     lei può non avere più senso: si butta il valore e si nasconde il
     gruppo — nascondere, non ricostruire */
  if(sc&&sc.k2&&sc.se2&&!sc.se2())delete o.ris[sc.k2];
  onb2Salva();
  /* La lingua si applica NEL MOMENTO del tocco: la domanda successiva
     arriverà già tradotta. langSet ricuoce le tabelle (I18N_RIFAI).
     Qui il ridisegno è NECESSARIO — cambia la lingua di tutto quello
     che è a schermo — ed è l'unica scelta che ancora lo fa. */
  if(k==="lingua"){
    try{if(typeof langSet==="function"&&v!==LANG){langSet(v);return renderOnb2();}}catch(e){}}
  if(!onb2SegnaScelta(k,v))return renderOnb2();
  if(sc)onb2Gruppo2Aggiorna(sc);};

window.onb2Bio=()=>{
  const g=id=>{const e=document.getElementById(id);return e?e.value:"";};
  /* il campo ora è testo «gg/mm/aaaa»: si converte in data vera, e se
     la scrittura è incompleta si dice cosa manca invece di dare un
     errore generico */
  const dobTxt=g("o2dob");
  const dob=(typeof dobParse==="function")?dobParse(dobTxt):dobTxt;
  if(dobTxt&&!dob)
    return dlgAlert(tr("La data va scritta come giorno/mese/anno, per esempio 14/03/1985."));
  const eta=dob?Math.floor((Date.now()-Date.parse(dob))/(365.25*864e5)):0;
  /* I CAMPI PARLANO NELLE UNITÀ DELLA PERSONA, LO STATO NO (v15.0.0):
     quello che si scrive passa da pesoIn/altIn e diventa metrico prima
     di toccare qualunque calcolo. Un peso in libbre salvato come chili
     sarebbe un errore del 120% dentro il fabbisogno, e nessuno lo
     vedrebbe: i numeri resterebbero plausibili. */
  const h=(typeof altIn==="function")?altIn(g("o2h")):+g("o2h");
  const w=(typeof pesoIn==="function")?pesoIn(g("o2w")):parseFloat(g("o2w"));
  /* ── SOTTO I 18 ANNI L'APP SI FERMA, E LO DICE (founder, 29/08) ──
     Prima il cancello era a 14, scelto senza una ragione scritta. La
     soglia vera sta nel guardrail condiviso (ETA_MINIMA, con le tre
     ragioni: clinica, legale, onestà) — qui la si applica e la si
     SPIEGA, invece del messaggio generico che faceva sembrare l'età
     un campo compilato male. */
  if(dob&&eta<((typeof ETA_MINIMA!=="undefined")?ETA_MINIMA:18)&&eta>=0)
    return dlgAlert(tr("Nuvia lavora con i fabbisogni degli adulti: sotto i 18 anni le formule che usa non sono adatte a un corpo che cresce, e non sarebbe giusto fare finta di niente.")+
      "\n\n"+tr("Per l'alimentazione a questa età la persona giusta è il pediatra o un nutrizionista dell'età evolutiva."));
  if(!dob||!(eta>=((typeof ETA_MINIMA!=="undefined")?ETA_MINIMA:18)&&eta<=100)||!(h>=120&&h<=230)||!(w>=30&&w<=300))
    return dlgAlert(tr("Mi servono età, altezza e peso per calcolare qualcosa di vero. Sono gli unici numeri obbligatori."));
  const o=onb2Stato();
  o.ris.bio={nome:(g("o2nome")||"").trim().slice(0,40),gen:g("o2gen")||"m",dob,eta,
    h:Math.round(h),w:Math.round(w*10)/10};
  /* ── E QUI DENTRO ADESSO CI SONO ANCHE ALTRE DUE COSE (28/08) ────
     Il peso obiettivo (facoltativo: chi non ce l'ha in mente prosegue)
     e gli «altri numeri» del corpo, che stavano in due schermate a sé. */
  const gv=parseFloat(g("o2goal"));
  if(isFinite(gv)&&gv>0){
    const gk=(typeof pesoIn==="function")?pesoIn(g("o2goal")):gv;
    if(!(gk>=30&&gk<=300))return dlgAlert(tr("Scrivi il peso che hai in mente, anche di massima."));
    /* il guardrail vale dove una persona arriva per prima */
    if(!goalWeightApplica(Math.round(gk*10)/10,{zitto:true}))return;
    o.ris.pesoObiettivo=goalWeightSet()||Math.round(gk*10)/10;
  }else{delete o.ris.pesoObiettivo;}
  const nm=id=>{const e=document.getElementById(id);const v=e?parseFloat(e.value):NaN;
    return (isFinite(v)&&v>0)?v:null;};
  const P=(typeof PLICHE!=="undefined")?PLICHE:[];
  const mis={fat:nm("o2dFat"),mus:nm("o2dMus"),circ:{},pliche:{},
    conPliche:!!(document.getElementById("o2dPl")||{}).checked};
  /* ── OGNI MISURA HA IL SUO INTERVALLO (founder, 29/08) ───────────
     «Ci sono valori massimi e minimi per pliche e metriche varie?»
     Non c'erano: bastava un numero sopra lo zero. Gli intervalli
     stanno nel guardrail condiviso (MISURE) e sono larghi apposta —
     fermano il 250 che voleva essere 25, non un corpo. Qui si dice
     QUALE campo non torna, invece di un errore generico. */
  const fuoriScala=[];
  const dentro=(campo,v,nome)=>{
    if(v==null)return null;
    if(typeof misuraOk==="function"&&!misuraOk(campo,v)){fuoriScala.push(nome);return null;}
    return v;};
  mis.fat=dentro("grassoPct",mis.fat,tr("massa grassa"));
  mis.mus=dentro("muscoloPct",mis.mus,tr("massa muscolare"));
  /* le circonferenze si scrivono in pollici e si salvano in centimetri:
     `nm()` legge un numero nudo, e un girovita di 36 pollici salvato
     come 36 cm sarebbe una vita da bambola dentro i calcoli */
  const cIn=(id)=>{const e=document.getElementById(id);const t=e?String(e.value).trim():"";
    if(!t)return null;
    const v=(typeof lunghIn==="function")?lunghIn(t):parseFloat(t.replace(",","."));
    return (isFinite(v)&&v>0)?Math.round(v*10)/10:null;};
  const vv=dentro("circonf",cIn("o2dVita"),tr("girovita")),ff=dentro("circonf",cIn("o2dFianchi"),tr("fianchi"));
  if(vv)mis.circ.vita=vv; if(ff)mis.circ.fianchi=ff;
  if(mis.conPliche)P.forEach(([k])=>{const v=dentro("plica",nm("o2dP_"+k),tr("plica")+" "+k);if(v)mis.pliche[k]=v;});
  if(fuoriScala.length)
    return dlgAlert(trh("Qualche misura non sembra plausibile: {v1}.",{v1:fuoriScala.join(", ")})+"\n\n"+
      tr("Controlla il numero e l'unità (le pliche sono in millimetri, le circonferenze nell'unità scritta sull'etichetta). Se preferisci, lasciale vuote: sono facoltative."));
  if(mis.fat||mis.mus||vv||ff||Object.keys(mis.pliche).length)o.ris.misure=mis;
  onb2BozzaButta();onb2Salva();
  /* niente messaggio di stato: vedi la nota in cima al file */
  onb2Avanti();};

window.onb2Goal=()=>{
  const e=document.getElementById("o2goal"),v=parseFloat(e?e.value:"");
  const o=onb2Stato();
  if(!(v>=30&&v<=300))return dlgAlert(tr("Scrivi il peso che hai in mente, anche di massima."));
  /* IL GUARDRAIL VALE ANCHE QUI (23/08). Prima il percorso accettava
     qualunque numero fra 30 e 300: una persona di 178 cm che scriveva
     45 kg riceveva la sua proiezione e il piano ci veniva costruito
     sopra. Lo stesso 45, scritto in Regole, l'app lo rifiutava. Ora il
     metro è uno solo, e vale dove una persona arriva per prima. */
  if(!goalWeightApplica(v,{zitto:true}))return;
  o.ris.pesoObiettivo=goalWeightSet()||v;
  onb2BozzaButta();onb2Salva();onb2Avanti();};

/* Salta una schermata senza rispondere: succede col consenso negato
   e con le domande che non hanno una risposta per tutti. */
window.onb2Salta=()=>{const o=onb2Stato();
  if(ONB2c()[o.step]&&ONB2c()[o.step].sensibile&&o.sensibili===null)o.sensibili=false;
  onb2Salva();onb2Avanti();};

/* Il pulsante «Avanti» della barra: una porta sola per tutte le
   schermate. Prima ogni tipo aveva il suo bottone in mezzo alla
   pagina e la barra sotto ne aveva altri due: tre pulsanti, tre
   posti diversi. Ora sono tre, in fila, sempre nello stesso punto. */
window.onb2AvantiSchermo=()=>{
  const o=onb2Stato(),sc=ONB2c()[o.step];
  if(!sc)return;
  if(sc.tipo==="modulo")return onb2Bio();
  if(sc.tipo==="numero")return onb2Goal();
  if(sc.tipo==="dieta")return onb2DietaOk();
  if(sc.tipo==="pasti")return onb2PastiOk();
  if(sc.tipo==="cibi")return onb2CibiOk();
  if(sc.tipo==="fuori")return onb2FuoriOk();
  if(sc.tipo==="preferenze")return onb2PrefOk();
  if(sc.tipo==="multi")return onb2MultiOk(sc.k);
  if(sc.tipo==="intoll"){
    /* il campo libero si raccoglie qui, come nei multi */
    const o=onb2Stato(),alt=document.getElementById("o2alt");
    if(alt)o.ris.allergie_altro=alt.value.trim();
    if(!Array.isArray(o.ris.allergie))o.ris.allergie=[];
    if(!Array.isArray(o.ris.allergie_gravi))o.ris.allergie_gravi=[];
    onb2Salva();return onb2Avanti();}
  if(sc.tipo==="integ"){
    const o=onb2Stato();
    if(o.ris.integrareOk==null)
      return dlgAlert(tr("Dimmi anche l'ultima cosa: se i conti non tornassero solo col cibo, ti va che ti proponga un integratore?"));
    return onb2MultiOk(sc.k);}
  if(sc.tipo==="dettagliX"){   /* la schermata non esiste più: i campi vivono dentro «bio» */
    const o=onb2Stato();
    const n=id=>{const e=document.getElementById(id);const v=e?parseFloat(e.value):NaN;
      return (isFinite(v)&&v>0)?v:null;};
    const P=(typeof PLICHE!=="undefined")?PLICHE:[];
    const m={fat:n("o2dFat"),mus:n("o2dMus"),circ:{},pliche:{},
      conPliche:!!(document.getElementById("o2dPl")||{}).checked};
    /* stessa conversione dell'altra strada: pollici a schermo,
       centimetri nel dato (vedi la nota in onb2DettagliCampi) */
    const cIn2=(id)=>{const e=document.getElementById(id);const t=e?String(e.value).trim():"";
      if(!t)return null;
      const v=(typeof lunghIn==="function")?lunghIn(t):parseFloat(t.replace(",","."));
      return (isFinite(v)&&v>0)?Math.round(v*10)/10:null;};
    /* stessi intervalli della strada principale (MISURE, 29/08) */
    const ok2=(campo,v)=>(v!=null&&(typeof misuraOk!=="function"||misuraOk(campo,v)))?v:null;
    const vv=ok2("circonf",cIn2("o2dVita")),ff=ok2("circonf",cIn2("o2dFianchi"));
    if(vv)m.circ.vita=vv; if(ff)m.circ.fianchi=ff;
    if(m.conPliche)P.forEach(([k])=>{const v=ok2("plica",n("o2dP_"+k));if(v)m.pliche[k]=v;});
    m.fat=ok2("grassoPct",m.fat);m.mus=ok2("muscoloPct",m.mus);
    o.ris.misure=m;onb2Salva();
    return onb2Avanti();}
  if(sc.tipo==="famiglia"){
    const o=onb2Stato(),f=onb2Fam();
    if(!o.ris.cucina)return dlgAlert(tr("Dimmi quanto tempo hai per cucinare."));
    if(f.con==null)return dlgAlert(tr("Dimmi se cucini solo per te o se mangiate insieme."));
    /* le righe rimaste vuote non sono persone: si tolgono in silenzio */
    f.lista=f.lista.filter(m=>(m.nome||"").trim()!==""||!!m.dob);
    if(f.con&&!f.lista.length){
      /* «mangiamo insieme» senza nessuno è una risposta che non dice
         niente: o si scrive chi c'è, o si torna a «solo per me». */
      return dlgAlert(tr("Scrivi chi mangia con te, oppure scegli «Cucino solo per me»."));}
    const senzaData=f.lista.filter(m=>!m.dob);
    if(f.con&&senzaData.length)
      return dlgAlert(tr("Manca la data di nascita di chi mangia con te: è quella che mi dice quanto cucinare per ciascuno, e si aggiorna da sola ogni anno."));
    if(!f.con)f.lista=[];
    onb2Salva();
    return onb2Avanti();}
  if(sc.tipo==="dove"){
    const o=onb2Stato(),r=(o.ris.dove=o.ris.dove||{});
    if(!r.lingua)r.lingua=(typeof LANG!=="undefined")?LANG:"it";
    if(!r.paese)r.paese=(typeof paeseSuggerito==="function")?paeseSuggerito():"IT";
    const P=paeseDi(r.paese);
    if(!r.valuta)r.valuta=P[2];
    if(!r.unita)r.unita=P[3];
    o.ris.lingua=r.lingua;
    onb2Salva();return onb2Avanti();}
  if(sc.tipo==="avvisi"){
    /* si passa sempre: le due risposte hanno gia' un valore di
       partenza onesto (due a settimana, dati d'uso spenti) */
    onb2Salva();return onb2Avanti();}
  if(sc.tipo==="medico"){
    const o=onb2Stato(),t=document.getElementById("o2med");
    if(t)o.ris.medico=t.value.trim();
    const alt=document.getElementById("o2alt");
    if(alt)o.ris.farmaci_altro=alt.value.trim();
    if(!Array.isArray(o.ris.farmaci))o.ris.farmaci=[];
    onb2Salva();return onb2Avanti();}
  if(sc.tipo==="giornate"){
    const o=onb2Stato();
    if(o.ris.attivita==null||o.ris.ritmi==null)
      return dlgAlert(tr("Rispondi a tutte e due: quanto ti muovi, e dove passano le giornate."));
    return onb2Avanti();}
  if(sc.tipo==="pausa")return onb2Avanti();
  /* schermata a scelta: senza risposta non si va avanti a vuoto */
  if(o.ris[sc.k]==null)return dlgAlert(tr("Scegli una risposta per andare avanti."));
  /* e se la schermata porta una seconda domanda VISIBILE, vale come
     la prima: da quando non si avanza più da soli (29/08) è possibile
     rispondere alla prima e premere Avanti dimenticando la seconda —
     prima non si poteva, perché il tocco portava via la schermata. */
  if(sc.k2&&sc.op2&&o.ris[sc.k2]==null){
    let serve=true;try{serve=!sc.se2||!!sc.se2();}catch(e){serve=true;}
    if(serve)return dlgAlert(tr("Manca la seconda risposta: rispondi anche a quella per andare avanti."));}
  return onb2Avanti();};

function onb2Avanti(){
  const o=onb2Stato();
  let n=o.step+1;
  /* Si saltano: le schermate già risposte dal racconto (chiedere due
     volte la stessa cosa è il modo più rapido per far chiudere l'app)
     e quelle che non riguardano questa persona (`se` falso: gli stati
     del corpo femminile per chi ha detto uomo). */
  const salta=i=>{const s=ONB2c()[i];if(!s)return false;
    if(s.se&&!s.se())return true;
    return o.saltate.includes(s.k)&&o.ris[s.k]!=null;};
  while(n<ONB2c().length-1&&salta(n))n++;
  /* La schermata marcata `genera` è il confine: da lì in poi nessuna
     risposta cambia il piano, quindi l'AI può partire. */
  try{const arrivo=ONB2c()[n];
    if(arrivo&&arrivo.genera&&typeof onb2GeneraOra==="function")onb2GeneraOra();}catch(e){}
  o.step=Math.min(n,ONB2c().length-1);
  if(o.step>o.maxVisto)o.maxVisto=o.step;
  onb2Salva();renderOnb2();try{window.scrollTo(0,0);}catch(e){}}
window.onb2Avanti=onb2Avanti;

/* ═══ IL RIVEDI NON C'È PIÙ (founder, 23/08) ══════════════════════
   Era una terza azione nella barra: apriva un foglio con tutte le
   risposte e da ogni riga si tornava a cambiarla. È stato tolto
   insieme a onb2Rivedi, onb2Leggibile e onb2VaiA.
   La ragione: tre comandi su una riga sola costringevano a stringere
   Indietro e Avanti in misure diverse, e la barra cambiava forma da
   una schermata all'altra. Con due comandi soli, pari, la riga è
   sempre la stessa — e la cosa che il Rivedi risolveva («non ricordo
   cosa ho detto») la risolve un Indietro che c'è sempre e non perde
   quello che hai scritto.                                        */

/* ── LA BOZZA: quello che hai scritto non si perde ────────────────
   Richiesta del founder (23/08): «l'Indietro c'è sempre e conserva i
   dati». Fino a ieri i campi si salvavano SOLO passando da Avanti,
   che valida: chi scriveva metà della data e tornava indietro
   ritrovava la schermata vuota, e doveva riscrivere tutto.
   Qui si prende una fotografia dei campi a schermo — senza
   validarli, perché una bozza è per definizione incompleta — e la si
   rimette al loro posto al ritorno. Alla prima risposta valida la
   bozza si butta: da lì in poi comanda la risposta vera.
   Vale per ogni campo con un `id`, quindi non va aggiornata quando
   nasce una schermata nuova.                                     */
function onb2BozzaPrendi(){
  try{
    const el=document.getElementById("pg-onb2");
    if(!el)return;
    const o=onb2Stato();o.bozza=o.bozza||{};
    el.querySelectorAll("input[id],select[id],textarea[id]").forEach(c=>{
      if(c.type==="checkbox"||c.type==="radio")return;
      o.bozza[c.id]=c.value;});
  }catch(e){}}
/* Il valore da mettere nel campo: la bozza se c'è, altrimenti la
   risposta già data. Una funzione sola, così nessuna schermata può
   dimenticarsene a metà. */
function bz(id,valore){
  const b=(onb2Stato().bozza)||{};
  return (b[id]!=null&&b[id]!=="")?b[id]:(valore==null?"":valore);}
function onb2BozzaButta(){const o=onb2Stato();if(o.bozza)delete o.bozza;onb2Salva();}

window.onb2Indietro=()=>{
  const o=onb2Stato();
  onb2BozzaPrendi();                 /* prima di cambiare schermata, si fotografa */
  if(o.step<=0){                     /* dalla prima si esce, non si resta in trappola */
    onb2Salva();
    return dlgAlert(tr("Siamo alla prima domanda: da qui si può solo andare avanti. Puoi chiudere l'app e riprendere quando vuoi, non perdi nulla."));}
  let n=o.step-1;
  const salta=i=>{const s=ONB2c()[i];if(!s)return false;
    if(s.se&&!s.se())return true;
    return o.saltate.includes(s.k)&&o.ris[s.k]!=null;};
  while(n>0&&salta(n))n--;
  o.step=n;                          /* maxVisto NON scende: la barra non torna indietro */
  onb2Salva();renderOnb2();try{window.scrollTo(0,0);}catch(e){}};

/* ── Voce ────────────────────────────────────────────────────────
   Si appoggia al motore vocale dell'app (voceIn): un solo microfono
   per tutta Nuvia. Qui si crea al volo un campo di testo nascosto,
   si ascolta, e alla fine si legge il testo col contratto nuovo.  */
window.onb2Voce=(campo)=>{
  if(typeof vocePossibile!=="function"||!vocePossibile())
    return dlgAlert(tr("Su questo telefono non posso accendere il microfono da solo. Puoi dettare con il microfono della tastiera, oppure rispondere toccando: è identico."));
  onb2Ascolta(campo,false);};

window.onb2Racconto=()=>{
  if(typeof vocePossibile!=="function"||!vocePossibile())
    return onb2RaccontoScritto();
  onb2Ascolta("racconto",true);};

/* Il campo dove atterra il parlato. Invisibile ma reale: voceIn
   scrive lì dentro, e da lì si legge quando la persona ha finito. */
function onb2Campo(){
  let ta=document.getElementById("o2voce");
  if(!ta){ta=document.createElement("textarea");ta.id="o2voce";
    ta.style.position="absolute";ta.style.left="-9999px";ta.setAttribute("aria-hidden","true");
    (document.getElementById("pg-onb2")||document.body).appendChild(ta);}
  return ta;}

function onb2Ascolta(campo,tutto){
  const ta=onb2Campo();ta.value="";
  const box=document.getElementById("pg-onb2");
  try{voceIn("o2voce","o2mic_"+campo);}catch(e){
    return dlgAlert(tr("Il microfono non è partito. Rispondi pure toccando: è identico."));}
  if(box&&!document.getElementById("o2stop")){
    const b=document.createElement("button");
    b.id="o2stop";b.className="btn o2stop";b.type="button";
    b.textContent=tutto?tr("Ho finito di raccontare"):tr("Ho finito");
    b.onclick=()=>{try{voceIn("o2voce","o2mic_"+campo);}catch(e){}
      const t=(document.getElementById("o2voce")||{}).value||"";
      b.remove();onb2Leggi(t,tutto);};
    box.appendChild(b);}}

function onb2RaccontoScritto(){
  const box=document.getElementById("pg-onb2");if(!box)return;
  if(document.getElementById("o2scritto"))return;
  const d=document.createElement("div");
  d.id="o2scritto";d.className="o2form";
  d.innerHTML=`<label>${esc(tr("Raccontami di te con parole tue"))}</label>
    <textarea id="o2testo" rows="4" placeholder="${esc(trh("es. Ho 42 anni, {v1} per {v2}, lavoro seduto, vorrei arrivare a {v3}. La sera quando sono stanco mangio di più.",
      /* anche l'ESEMPIO parla la lingua delle sue misure: un
         suggerimento in centimetri a chi scrive in piedi insegna il
         formato sbagliato proprio nel campo dove si scrive libero */
      {v1:(typeof altTxt==="function")?altTxt(178):"178 cm",
       v2:(typeof pesoTxt==="function")?pesoTxt(95,0):"95 kg",
       v3:(typeof pesoTxt==="function")?pesoTxt(85,0):"85 kg"}))}"></textarea>
    <button class="btn small" type="button" onclick="onb2LeggiScritto()">${esc(tr("Leggi e compila"))}</button>`;
  box.appendChild(d);}
window.onb2RaccontoScritto=onb2RaccontoScritto;

window.onb2LeggiScritto=()=>{
  const e=document.getElementById("o2testo");
  onb2Leggi(e?e.value:"",true);};

/* ── Estrazione: contratto src/contratti/estrazione_onboarding.md ──
   Il modello PROPONE. Tutto ciò che non è nello schema, o è fuori
   intervallo, viene buttato via qui: meglio una domanda in più che
   un dato inventato dentro il calcolo del fabbisogno.             */
const ONB2_SCHEMA={
  obiettivo:{en:["perdere","mantenere","massa"]},
  sesso:{en:["m","f"]},
  eta:{n:[14,100]}, altezza:{n:[120,230]}, peso:{n:[30,300]}, pesoObiettivo:{n:[30,300]},
  ritmi:{en:["sedentario","inPiedi","turni","studente","casa"]},
  cibo:{en:["sereno","nervoso","noia","sociale"],sensibile:true},
  tentativi:{en:["mai","qualcuno","molti","yoyo"]},
  attivita:{en:["fermo","leggero","regolare","intenso"]},
  infortuni:{t:120}, attrezzatura:{en:["niente","casa","palestra"]},
  cucina:{en:["veloce","normale","amoCucinare"]},
  motivazione:{en:["salute","energia","estetica","evento"]}
};
window.ONB2_SCHEMA=ONB2_SCHEMA;

function onb2Valida(j){
  const out={};
  if(!j||typeof j!=="object"||Array.isArray(j))return out;
  Object.keys(j).forEach(k=>{
    const reg=ONB2_SCHEMA[k];
    if(!reg)return;                                   /* campo ignoto: via */
    const v=j[k];
    if(v==null||v==="")return;
    if(typeof v==="object")return;                    /* mai oggetti o liste */
    if(reg.en){if(reg.en.includes(String(v)))out[k]=String(v);return;}
    if(reg.n){const n=parseFloat(v);
      if(isFinite(n)&&n>=reg.n[0]&&n<=reg.n[1])out[k]=Math.round(n*10)/10;return;}
    if(reg.t){const t=String(v).replace(/<[^>]*>/g,"").trim().slice(0,reg.t);
      if(t)out[k]=t;return;}});
  return out;}
window.onb2Valida=onb2Valida;

/* Dai campi validati alle risposte delle schermate. Il dato sensibile
   entra SOLO col consenso già dato: senza, si scarta e si chiederà. */
function onb2Applica(v){
  const o=onb2Stato(),messi=[];
  const metti=(k,val)=>{if(val==null||val==="")return;
    o.ris[k]=val;if(!o.saltate.includes(k))o.saltate.push(k);messi.push(k);};
  metti("obiettivo",v.obiettivo);
  if(v.eta&&v.altezza&&v.peso)
    metti("bio",{gen:v.sesso||"m",eta:Math.round(v.eta),h:Math.round(v.altezza),w:v.peso});
  metti("pesoObiettivo",v.pesoObiettivo);
  metti("ritmi",v.ritmi);
  if(v.cibo&&o.sensibili===true)metti("cibo",v.cibo);
  metti("tentativi",v.tentativi);
  metti("attivita",v.attivita);
  metti("cucina",v.cucina);
  /* la motivazione ora è a scelta multipla: il racconto ne estrae
     una sola, e quella una diventa un elenco da uno */
  if(v.motivazione)metti("motivazione",[v.motivazione]);
  if(v.infortuni)o.ris.infortuni=v.infortuni;
  if(v.attrezzatura)o.ris.attrezzatura=v.attrezzatura;
  onb2Salva();
  return messi;}
window.onb2Applica=onb2Applica;

async function onb2Leggi(testo,tutto){
  const t=String(testo||"").trim();
  const sc=document.getElementById("o2scritto");if(sc)sc.remove();
  if(!t)return toast(tr("Non ho sentito nulla. Rispondi pure toccando: è identico."));
  if(typeof aiOn!=="function"||!aiOn())
    /* la causa non è la rete: è che l'AI non è ancora attiva. Dirlo
       storto manda la persona a controllare il wifi per niente. */
    return toast(tr("Per capire un racconto intero serve l'AI, che si attiva col conto. Intanto rispondi toccando: è identico, e ci mettiamo un attimo."));
  toast(tr("Leggo…"));
  try{
    const j=await onb2Chiedi(t);
    const v=onb2Valida(j);
    const messi=onb2Applica(v);
    renderOnb2();
    if(!messi.length)return toast(tr("Non ho capito abbastanza per compilare: andiamo con le domande, è un attimo."));
    if(tutto)onb2Avanti();
    toast(tr("Ho segnato {n} cose. Le vedi qui sopra: correggile se ho capito male.",{n:messi.length}));
  }catch(e){
    toast(tr("Non sono riuscito a leggere il racconto. Rispondi toccando: è identico."));}}
window.onb2Leggi=onb2Leggi;

/* Otto secondi e non uno di più: oltre, si prosegue a tocchi. */
function onb2Chiedi(testo){
  const q='Questa persona si racconta: """'+testo+'""". '+
    'Estrai SOLO ciò che dice davvero: non dedurre, non completare, non inventare. Campo non detto = null. '+
    'Rispondi SOLO con questo JSON, senza testo attorno: '+
    '{"obiettivo":"perdere|mantenere|massa|null","sesso":"m|f|null","eta":null,"altezza":null,"peso":null,'+
    '"pesoObiettivo":null,"ritmi":"sedentario|inPiedi|turni|studente|casa|null",'+
    '"cibo":"sereno|nervoso|noia|sociale|null","tentativi":"mai|qualcuno|molti|yoyo|null",'+
    '"attivita":"fermo|leggero|regolare|intenso|null","infortuni":null,'+
    '"attrezzatura":"niente|casa|palestra|null","cucina":"veloce|normale|amoCucinare|null",'+
    '"motivazione":"salute|energia|estetica|evento|null"}';
  return Promise.race([
    aiAskJSON(q,"onb2"),
    new Promise(r=>setTimeout(()=>r(null),8000))
  ]);}

/* ── Ultima schermata: come vuoi che ti segua ────────────────────── */
/* PILASTRO: il piano è SETTIMANALE, sempre. Qui non si sceglie più
   fra settimana e giornata (la scelta «Alla giornata» è stata tolta
   il 22/08): si mostra soltanto a che punto è il piano che l'AI ha
   cominciato a scrivere tre schermate fa. */
function onb2Fine(sc){
  const g=onb2Gen();
  /* «base» è uno stato PRONTO come gli altri: il piano c'è, l'ha
     solo scritto il piano di partenza invece dell'AI. Senza questa
     riga chi resta su Free avrebbe letto «Entra appena è pronto»
     davanti a un piano già finito. */
  /* «pronto» vuol dire FINITO, non RIUSCITO: la barra si ferma e il
     contatore sparisce anche quando e' andata male. Chi festeggia e'
     un'altra cosa - e per tre giorni sono stati lo stesso valore. */
  const pronto=(g.stato==="fatto"||g.stato==="base"||g.stato==="senzaAI"||g.stato==="errore");
  const riuscito=((g.stato==="fatto"||g.stato==="base")&&!!g.piano);
  /* L'orologio a vista (riscontro del founder, 25/08): senza
     streaming la barra non può muoversi, e una barra ferma sembra
     un'app bloccata. Il tempo che passa invece si può SEMPRE dire:
     un contatore che ticchetta è la prova che si sta lavorando.
     L'intervallo tocca SOLO il numero (niente ridisegni: è lo stesso
     principio del tocco senza lampo) e si spegne da solo quando
     l'elemento sparisce o il piano è pronto. */
  if(!pronto&&!window.ONB2_TIC){
    window.ONB2_TIC=setInterval(()=>{
      const el=document.getElementById("o2tempo"),gg=onb2Gen();
      const vivo=el&&(gg.stato==="lavoro");
      if(!vivo){clearInterval(window.ONB2_TIC);window.ONB2_TIC=null;return;}
      const s=Math.max(0,Math.round((Date.now()-(gg.t0||Date.now()))/1000));
      el.textContent=Math.floor(s/60)+":"+String(s%60).padStart(2,"0");},1000);}
  return `${masc(riuscito?"festeggia":(pronto?"pensa":"cucina"),120)}
  <div class="o2gen" id="o2gen" aria-live="polite">
    <div class="o2genbar"><i id="o2genb" style="width:${g.perc}%"></i></div>
    <div class="o2genperc">${pronto?"":`<b id="o2perc">${g.perc||0}%</b> · <span id="o2tempo">0:00</span>`}</div>
    <div class="o2gent" id="o2gent">${esc(g.riga||tr("Sto per cominciare…"))}</div>
    ${(!pronto&&S.ai&&S.ai.genMs&&typeof pensieroUltima==="function")
      ?`<div class="hint">${esc(trh("L'ultima volta il piano ha richiesto {v1}.",{v1:pensieroUltima()}))}</div>`:""}
    ${onb2GenLista(g)}
    <!-- LA RIGA CHE NESSUNO VEDEVA (25/08). «Non è una prescrizione»
         esisteva solo nel percorso lungo e in «Genera nuovo piano»:
         due strade che chi installa l'app oggi non percorre. Qui è
         una PORTA, non una scrollata di spalle: dice il limite e
         consegna lo strumento — le Correzioni — per agire. -->
    ${(g.stato==="fatto"||g.stato==="base")
      ?`<div class="hint" style="margin-top:8px">${esc(tr("È una proposta costruita sulle tue risposte, non una prescrizione: falla vedere a un medico o a un nutrizionista. E se un piatto non ti va, dal Piano c'è «Correzioni»: lo dici, lo tolgo, non torna più."))}</div>`:""}
  </div>
  <!-- «ENTRA», SENZA PROMESSE FALSE (riscontro del founder, 25/08
       sera: «se clicco entra appena è pronto comunque mi porta dentro
       l'app»). Il bottone entra SUBITO — il tappo dei 60 secondi non
       esiste più, e il piano raggiunge la persona da solo. Un bottone
       che si chiama «appena è pronto» e agisce adesso è una bugia.
       t_piani_onboarding lo chiedeva già; era rimasto a metà. -->
  ${pronto?"":`<div class="hint" style="text-align:center;margin-top:4px">${esc(tr("Il piano continua a scriversi e si attiva da solo."))}</div>`}`;}
/* «Entra» non sta più qui dentro: sta nella barra dei comandi, di
   fianco a «Indietro» — richiesta del founder (26/08). Due bottoni,
   una riga, come in tutte le altre schermate. */

/* L'avanzamento raccontato riga per riga: la persona vede cosa manca
   invece di una rotella che gira. */
function onb2GenLista(g){
  if(!g.righe||!g.righe.length)return "";
  /* l'id serve al tocco sul posto: la lista si aggiorna senza
     ridisegnare la pagina */
  return `<ul class="o2genl" id="o2genl">`+g.righe.map(r=>
    `<li class="${esc(r.s)}">${esc(r.t)}</li>`).join("")+`</ul>`;}

/* Travaso finale: da S.onb2 alle chiavi di sempre. Si SCRIVE SOPRA
   solo ciò che la persona ha appena detto; il resto dello stato
   (e tutto ciò che c'era prima) resta intatto.                    */
function onb2Travasa(){
  const o=onb2Stato(),r=o.ris,b=r.bio||{};
  const goalMap={perdere:"deciso",mantenere:"mantenimento",massa:"massa"};
  /* ── L'OBIETTIVO, nel campo che il motore legge DAVVERO ──────────
     Il difetto (23/08): l'onboarding scriveva solo S.pref.goal, ma
     tutto il calcolo — deficitTarget(), protKgAuto(), rateNote(),
     stimaRicette(), checkPlanAge() — legge S.profile.goal, che non
     aveva nemmeno un valore predefinito. Risultato misurato: chi
     sceglieva «mettere massa» riceveva 1879 kcal con 470 kcal di
     DEFICIT, esattamente come chi voleva perdere peso.
     I rami giusti nel motore c'erano già: mancava chi li accendeva.
     Le parole sono quelle della tendina di Regole → Obiettivi, così
     le due porte dicono la stessa cosa invece di due dialetti: chi
     rifà il percorso ritrova la sua scelta già selezionata lì.
     S.pref.goal resta scritto com'era: lo legge 65_costellazione,
     che confronta con «massa» carattere per carattere.            */
  const goalProfilo={perdere:"dimagrimento graduale",
                     mantenere:"mantenimento",
                     massa:"aumento di massa"};
  if(b.eta>0){const n=new Date();n.setFullYear(n.getFullYear()-b.eta);
    S.profile.dob=S.profile.dob||n.toISOString().slice(0,10);}
  if(b.nome)S.profile.name=b.nome;
  if(b.gen)S.profile.gender=b.gen;
  if(b.h>0)S.profile.h=b.h;
  if(b.w>0)S.profile.w=b.w;
  /* Non più un «=» diretto (23/08): il percorso guidato era l'unica
     porta che scavalcava il portone, quindi l'unica dove il guardrail
     era spento. È anche la prima schermata che una persona incontra,
     cioè il posto in cui serve di più. Qui si scrive zitti perché il
     rifiuto è già stato detto quando è stato scritto il numero. */
  if(r.pesoObiettivo>0)goalWeightApplica(r.pesoObiettivo,{zitto:true});
  S.profile.act=o2Att(r.attivita)||S.profile.act||1.35;
  /* ── I PASSI BASE SEGUONO L'ATTIVITÀ (founder, 24/08) ─────────
     «Influiscono anche sul numero di passi?» No, e non doveva essere
     così: `baseSteps` restava a 3.000 qualunque cosa una persona
     rispondesse, quindi chi sta fermo tutto il giorno e chi fa lavoro
     fisico si vedevano attribuire gli stessi passi — che poi entrano
     nel bilancio della giornata.
     ACT_STEPS ha già la corrispondenza, ed è indicizzata proprio sui
     valori di `act`: ora che l'onboarding usa quei valori, i passi
     si impostano da soli. Si scrive solo se la persona non li ha già
     cambiati a mano: una scelta esplicita batte una deduzione. */
  try{
    const passi=(typeof ACT_STEPS!=="undefined")?ACT_STEPS[String(S.profile.act)]:null;
    if(passi&&!S.profile.baseStepsManuale)S.profile.baseSteps=passi;
  }catch(e){}
  /* ── I TURNI, COLLEGATI DAVVERO ───────────────────────────────
     «A turni» era un'opzione che non accendeva niente: `r.ritmi` non
     veniva travasato da nessuna parte, quindi sceglierla equivaleva a
     non sceglierla (pilastro 6.1.9 — un comando che non fa niente è
     peggio di nessun comando). Ora lo stile di giornata si salva, e
     chi fa i turni si porta dietro il suo interruttore: il modulo
     turni compare fra gli strumenti invece di restare nascosto. */
  if(r.ritmi){
    S.pref.ritmi=r.ritmi;
    S.ui.turnista=(r.ritmi==="turni");}
  if(r.obiettivo){
    S.pref.goal=goalMap[r.obiettivo]||S.pref.goal;
    S.profile.goal=goalProfilo[r.obiettivo]||S.profile.goal;}
  S.ui.modalitaPasti=o.modalita||"ricette";
  /* ── Le risposte nuove finiscono NEGLI STESSI CAMPI che Regole →
     Caratteristiche alimentari legge e modifica. Una fonte sola:
     l'onboarding compila, Regole resta il posto dove si cambia.
     Regola del founder (22/08): niente doppioni, due porte d'ingresso. */
  const senzaNone=(a,none)=>(Array.isArray(a)?a.filter(x=>x!==none):[]);
  const conAltro=(a,altro)=>{const l=a.slice();
    if(altro)String(altro).split(",").map(x=>x.trim()).filter(Boolean).forEach(x=>l.push(x));
    return l.join(", ");};
  if(r.dieta){
    S.pref.tipo=r.dieta.tipo||S.pref.tipo||"mediterranea";
    S.pref.vegUova=(r.dieta.uova!==false);
    S.pref.vegPesce=!!r.dieta.pesce;
    S.pref.tradizione=r.dieta.tradizione||"italiana";}
  /* Le intolleranze e le allergie viaggiano INSIEME in S.pref.intol —
     è la stringa che tutta la sicurezza già legge (vietatiElenco, il
     prompt, le Regole) — e le allergie anche DA SOLE in S.pref.allergie,
     perché al modello vanno dette con un altro peso. */
  /* Due domande, due campi. `S.pref.intol` è la stringa che tutta la
     sicurezza legge da sempre e continua a leggere; `S.pref.allergie`
     è quella nuova, e vale con un altro peso: nessuna esenzione. */
  if(Array.isArray(r.intolleranze))
    S.pref.intol=conAltro(senzaNone(r.intolleranze,"niente"),r.intolleranze_altro);
  if(Array.isArray(r.allergie))
    S.pref.allergie=conAltro(senzaNone(r.allergie,"niente"),r.allergie_altro);
  /* le condizioni scritte a mano si aggiungono a quelle spuntate:
     l'elenco non può prevedere la condizione di ognuno */
  if(Array.isArray(r.salute))S.pref.patologie=conAltro(senzaNone(r.salute,"niente"),r.salute_altro);
  /* i farmaci sono una lista a spunte, più il campo libero */
  if(Array.isArray(r.farmaci))
    S.pref.farmaci=conAltro(senzaNone(r.farmaci,"nessuno"),r.farmaci_altro);
  if(r.medico!=null)S.pref.medico=String(r.medico).trim();
  /* le misure NON hanno un magazzino loro: finiscono nella visita di
     Io → Misure dello studio, con lo stesso scrittore che usa quella
     scheda. Chi compila nel percorso le ritrova là, e là le corregge. */
  if(r.misure&&typeof misureRegistra==="function"){
    try{misureRegistra({fat:r.misure.fat||null,mus:r.misure.mus||null,
      circ:r.misure.circ||{},pliche:r.misure.pliche||{}});}catch(e){}}
  if(r.integrareOk)S.pref.integrareOk=r.integrareOk;
  /* ── GLI INTEGRATORI CAMBIANO IL PIANO DAVVERO ────────────────
     INTEG_REGOLE esisteva già e girava a vuoto: nessuno chiedeva cosa
     prendi, quindi le proteine in polvere si sommavano sopra il
     target invece di contarci dentro, e il ferro finiva nel pasto col
     caffè. */
  /* Ogni integratore con la SUA frequenza, scritta accanto al nome:
     «vitamina D (tutti i giorni), creatina (qualche volta)». È la
     stringa che integForAI() passa al modello. integratoriFreq
     riassume per le regole di conteggio: basta UN quotidiano perché
     i target debbano tenerne conto. */
  if(Array.isArray(r.integratori)){
    /* NON tradotte: questa stringa la legge il prompt del piano, che è
       scritto in italiano. Con tr() chi usa l'app in inglese si
       ritrovava «vitamina D (every day)» dentro una richiesta
       italiana, e la frequenza restava in inglese anche tornando
       all'italiano. Quello che si vede a schermo è tradotto; quello
       che si SALVA è la lingua del motore. */
    const FRT={giorni:"tutti i giorni",quasi:"quasi tutti i giorni",saltuario:"qualche volta a settimana"};
    const fm=r.integ_freq||{};
    const sel=Array.isArray(r.integratori)?r.integratori:[];
    /* «mai» non è una frequenza da travasare: è un integratore che
       questa persona non prende, e nel profilo non deve comparire. */
    const voci=senzaNone(r.integratori,"nessuno").filter(v=>onb2Freq(fm,v,sel)!=="mai");
    S.pref.integratori=voci.map(v=>v+" ("+(FRT[onb2Freq(fm,v,sel)])+")").join(", ");
    const f=voci.map(v=>onb2Freq(fm,v,sel));
    S.pref.integratoriFreq=f.includes("giorni")?"giorni":(f.includes("quasi")?"quasi":(f.length?"saltuario":""));}
  /* ── R1 · gli sport preferiti, travasati in DUE posti ──────────
     `S.train.ama` è la stringa che trainForAI() legge davvero (vedi
     src/15_6…js): senza questa, il trainer proponeva attività a
     caso finché qualcuno non rispondeva a mano su Sport.
     `S.allen.abituali` è quello che legge spuntoAllenamento() per i
     suggerimenti settimanali: stessi nomi che abitualiAggiungi()
     scrive quando li racconti a voce su Sport → «Come ti alleni di
     solito» — qui giorno e minuti non si conoscono, quindi restano
     null/predefiniti, correggibili là. Le due porte scrivono negli
     stessi campi: una volta raccontato qui, l'app non lo richiede
     più in nessuna delle due. */
  if(Array.isArray(r.sportPref)){
    const SPORT_TRAVASO={corsa:"Corsa",palestra:"Palestra — pesi",camminata:"Camminata",
      nuoto:"Nuoto",ciclismo:"Ciclismo",racchetta:"Tennis",squadra:"Calcio / calcetto",yoga:"Yoga"};
    const nomi=senzaNone(r.sportPref,"nessuno").map(v=>SPORT_TRAVASO[v]).filter(Boolean);
    if(r.sportPref_altro)String(r.sportPref_altro).split(",").map(x=>x.trim()).filter(Boolean).forEach(x=>nomi.push(x));
    if(nomi.length){
      S.train=S.train||{};
      S.train.ama=nomi.join(", ").slice(0,200);
      try{nomi.forEach(n=>{if(typeof abitualiAggiungi==="function")abitualiAggiungi(n,null,45);});}catch(e){}}}
  /* ── CIBI SÌ / NO / NOTE ──────────────────────────────────────
     I tre campi che il prompt del piano usa da sempre e che nessuno
     riempiva: alla prima generazione arrivavano «niente» e «—». */
  if(r.cibi){
    if(r.cibi.no!=null)S.pref.no=String(r.cibi.no).trim();
    if(r.cibi.si!=null)S.pref.si=String(r.cibi.si).trim();
    if(r.cibi.note!=null)S.pref.note=String(r.cibi.note).trim();
    /* L'alcol e' un dato di contesto, non una preferenza del piano:
       si salva nello stesso campo di sempre (Regole lo mostra li'), e
       nel prompt del piano non entra ne' entrera' — al modello va un
       divieto, sempre, e la rete in validaSettimana lo verifica. */
    if(r.cibi.alcol)S.pref.alcol=r.cibi.alcol;}
  /* ── I PASTI FUORI CASA ───────────────────────────────────────
     Stesso formato di Regole, perché le spunte sono le stesse:
     «lun pranzo, gio cena». `fuoriN` si conta da lì e non si scrive
     a mano, altrimenti diverge al primo cambio. */
  if(r.fuori){
    S.pref.mensaGiorni=r.fuori.giorni||"";
    try{if(typeof fuoriCount==="function")S.pref.fuoriN=fuoriCount(S.pref.mensaGiorni);}catch(e){}
    S.pref.outType=(r.fuori.tipo==="porto")?"porto":"fuori";}
  if(Array.isArray(r.protocolli)){
    S.pref.protocolli=senzaNone(r.protocolli,"nessuno").join(", ");
    S.pref.fodmap=S.pref.protocolli.toLowerCase().includes("fodmap");}
  if(Array.isArray(r.vincoli))S.pref.religiose=senzaNone(r.vincoli,"nessuno").join(", ");
  if(r.pasti&&Array.isArray(r.pasti.slots)&&r.pasti.slots.length>=2){
    S.pref.slots=r.pasti.slots.join(", ");
    S.pref.nPasti=r.pasti.slots.length;
    S.pref.pastiLiberi=+r.pasti.liberi||0;}
  if(r.cucina){
    S.pref.pronto=(r.cucina==="veloce")?"velocissimo":(r.cucina==="amoCucinare")?"mi piace cucinare":"semplice";
    S.pref.cucina=(r.cucina==="veloce")?10:(r.cucina==="amoCucinare")?60:30;}
  /* ── La famiglia: NEGLI STESSI CAMPI che Regole e Spesa usano già ──
     S.family è la lista che Regole → Chi altro mangia a casa mostra e
     corregge; S.shopFor è l'interruttore che sta in fondo alla Spesa.
     L'onboarding li COMPILA, non ne crea di nuovi.
     L'età scritta in anni diventa una data di nascita approssimata:
     così cresce da sola e l'anno prossimo le porzioni sono giuste
     senza che nessuno le tocchi.
     `famRicette` invece è nuovo, e riguarda solo la cucina: dice all'AI
     di scegliere piatti che si possano preparare in una volta sola per
     tutti. Le grammature restano quelle della persona — per questo la
     famiglia non entra nel conto delle calorie, ma solo nella scelta
     dei piatti e nelle quantità della spesa. */
  if(r.famiglia){
    const f=r.famiglia;
    if(f.con&&Array.isArray(f.lista)&&f.lista.length){
      S.family=f.lista.map(m=>{
        const p={nome:String(m.nome||"").trim(),gender:(m.gender==="m")?"m":"f"};
        /* la data è già una data: nessuna conversione, nessuna
           approssimazione — è il motivo per cui adesso si chiede */
        if(m.dob)p.dob=m.dob;
        else if(m.eta!==""&&m.eta!=null&&typeof etaToDob==="function"){
          const d=etaToDob(m.eta);if(d)p.dob=d;}   /* percorsi lasciati a metà prima del 28/08 */
        return p;});
      S.shopFor=(f.spesa===false)?"me":"fam";
      S.famRicette=(f.piano!==false);}
    else{S.family=[];S.shopFor="me";S.famRicette=false;}}
  /* ── LA SCELTA DEL PIANO NON SI BUTTA (founder, 28/08) ──────────
     «Se l'utente sceglie un piano piuttosto che un altro cambia
     qualcosa?» Fino a ieri: solo per chi sceglieva Free (che riceve
     il piano di base invece di quello dell'AI). Fra Start, Complete e
     Premium non cambiava NIENTE, e soprattutto la risposta non veniva
     nemmeno salvata: la persona dichiarava un'intenzione e l'app la
     dimenticava un istante dopo.
     Adesso l'intenzione resta scritta. Non è un acquisto e non
     sblocca niente — i piani non sono ancora aperti — ma è quello che
     l'app deve ricordare per non far ripetere la domanda, e per dire
     «te lo diciamo appena apre» a chi l'aveva chiesto. */
  /* ── DOVE VIVI (v15.0.0) ────────────────────────────────────────
     Paese, valuta e unità finiscono nel profilo, che è il posto da cui
     le legge tutta l'app: le funzioni che vestono i numeri, la spesa,
     e la riga che dice al modello dove siamo. La lingua invece si
     applica subito, mentre si sceglie: è l'unica risposta che cambia
     la schermata sotto gli occhi. */
  if(r.dove){
    if(r.dove.paese)S.profile.paese=r.dove.paese;
    if(r.dove.valuta)S.profile.valuta=r.dove.valuta;
    if(r.dove.unita)S.profile.unita=r.dove.unita;}

  /* ── QUANTE NOTIFICHE, E I DATI D'USO ───────────────────────────
     Le due risposte finiscono nei campi che l'app usa davvero:
     `S.notif.quante` lo legge il cancello delle notifiche (notifTetto)
     e `S.tel.on` decide se i dati d'uso partono. `attive` resta il
     vecchio interruttore: si accende solo se la persona ne vuole
     almeno una — il permesso del telefono e' un'altra cosa e lo
     chiede il telefono. */
  if(r.avvisi){
    S.notif=S.notif||{};
    S.notif.quante=(["nessuna","poche","normale"].indexOf(r.avvisi.quante)>=0)?r.avvisi.quante:"normale";
    S.notif.attive=(S.notif.quante!=="nessuna");
    S.tel=S.tel||{};
    S.tel.on=!!r.avvisi.usi;}
  if(r.piani){
    S.conto=S.conto||{};
    S.conto.intento={piano:r.piani,quando:new Date().toISOString()};}
  if(r.preferenze){
    if(r.preferenze.budgetCifra)S.pref.budgetCifra=+r.preferenze.budgetCifra;
    S.pref.budget=r.preferenze.budget||"medio";
    if(r.preferenze.alcol)S.pref.alcol=r.preferenze.alcol;   /* percorsi lasciati a meta' prima del 28/08 */
    S.pref.varieta=r.preferenze.varieta||"media";}
  /* ── IL RITMO SCELTO ARRIVA AL MOTORE (founder, 29/08) ───────────
     `S.pref.ritmo` + `S.profile.defMode="ritmo"` sono i due campi che
     la pagina Regole usa da sempre: qui si scrivono quelli, non un
     campo nuovo. Chi finisce il percorso e apre Regole ritrova la sua
     scelta selezionata, e se la cambia lì cambia davvero — un campo
     parallelo avrebbe voluto dire due ritmi e due piani diversi per
     la stessa persona. */
  if(r.obiettivo==="perdere"&&+r.ritmo>0){
    S.pref.ritmo=+r.ritmo;
    S.profile.defMode="ritmo";}
  /* Gli stati del corpo valgono solo con genere donna (11_2 li azzera
     altrimenti) e col consenso dato: sono dati sensibili. */
  if(b.gen==="f"&&o.sensibili===true&&r.corpo&&r.corpo!=="no"){
    S.phys=S.phys||{};
    if(r.corpo==="t1"||r.corpo==="t2"||r.corpo==="t3")S.phys.preg=r.corpo;
    if(r.corpo==="lactE")S.phys.lact="esclusivo";
    if(r.corpo==="lactP")S.phys.lact="parziale";}
  /* Il dato sensibile vive in un posto solo, con il suo consenso a fianco:
     così chi legge il codice sa sempre se può usarlo. */
  /* Il consenso resta solo dove serve davvero: gravidanza e
     allattamento. Condizioni di salute e rapporto col cibo non lo
     chiedono più (scelta del founder, 22/08): erano due muri in
     mezzo al percorso, e la riga sulla privacy vale per tutta l'app,
     non per una domanda. */
  o.sensibili=(o.sensibili===true);
  if(!o.sensibili)delete o.ris.corpo;
  onb2Salva();}
window.onb2Travasa=onb2Travasa;

/* La chiusura: il piano di solito è GIÀ pronto (l'AI è partita tre
   schermate fa). Se non lo è, si aspetta lì mostrando lo stato —
   nessuno resta davanti a una schermata muta. */
window.onb2Chiudi=async(modo)=>{
  const o=onb2Stato(),g=onb2Gen();
  o.modalita="ricette";                       /* PILASTRO: solo settimanale */
  onb2Travasa();
  const entra=()=>{
    o.done=true;S.onboard.done=true;onb2Salva();
    /* -- SI FESTEGGIA SOLO SE C'E' QUALCOSA DA FESTEGGIARE (27/08) --
       «Il sistema festeggia anche se il piano non e' stato generato e
       dice che e' stato generato dopo l'errore.» Il festone e i
       coriandoli dicevano «il piano e' tuo» un istante dopo la
       finestra che diceva che il piano non era arrivato. Il percorso
       finito resta una cosa buona - ma la frase che si canta e' su
       una cosa che non c'e'. Quindi: coriandoli col piano in mano,
       un saluto normale senza. */
    /* -- IL CARTELLINO SE N'E' ANDATO DEL TUTTO (founder, 27/08) --
       «Esce ancora il messaggio di stato pop-up "Ciao Alberto ci
       siamo, il piano è tuo", che deve essere rimosso.»
       Ieri l'avevo reso condizionale — coriandoli solo col piano in
       mano — ma la richiesta e' un'altra: quel messaggio non deve
       esserci. E ha ragione: la schermata sotto dice gia' se il piano
       c'e' e cosa fare, e un cartellino che copre lo schermo per
       ripetere la stessa cosa e' rumore. Chi entra in un'app vuole
       vedere l'app. */
    const b=o.ris.bio||{};
    if(b.w>0){try{S.profile.weights.push({d:iso(new Date()),w:b.w,fat:null,mus:null,pa:null,spo2:null});}catch(e){}}
    /* Si atterra sul PUNTO, non su Oggi: è il riepilogo di quello che
       la persona ha appena costruito, e porta il suo nome. */
    save();try{if(typeof rifaiTabs==="function")rifaiTabs();}catch(e){}
    setTimeout(()=>show("punto"),300);};
  /* mai partita (percorso ripreso a metà, o schermata raggiunta di
     corsa): si avvia adesso */
  if(g.stato==="fermo")onb2GeneraOra();
  const gg=onb2Gen();
  /* ═══ IL TAPPO DEI 60 SECONDI NON C'È PIÙ (25/08) ═══════════════
     Prima qui si aspettava al massimo un minuto e poi si entrava
     COMUNQUE: se il piano non era pronto, non veniva applicato — e
     quando arrivava, un attimo dopo, nessuno lo leggeva più. Il
     lavoro finiva in una variabile che non guardava nessuno: era il
     «non arriva mai alla fine» visto sul telefono.
     Ora si entra SUBITO, sempre. Se il piano sta ancora scrivendosi,
     `applicaDaSolo` dice al completamento di applicarlo da sé e di
     avvisare; se era già pronto (anche da un ricaricamento:
     S.genPronto), si applica qui. */
  if(gg.piano){
    onb2RicetteApplica(gg.piano,(gg.stato==="fatto"&&gg.piano.spesa)?gg.piano.spesa:null,gg.stato);
  }else if(S.genPronto&&S.genPronto.piano){
    onb2RicetteApplica(S.genPronto.piano,S.genPronto.spesa||null,S.genPronto.origine);
  }else if(gg.stato==="lavoro"){
    gg.applicaDaSolo=true;
    try{toast(tr("Il piano sta ancora scrivendosi: entra pure, si attiva da solo appena è pronto."));}catch(e){}}
  entra();};

/* Ripartire da capo: usato dalle impostazioni e dai collaudi. */
window.onb2Ricomincia=()=>{S.onb2={v:1,step:0,maxVisto:0,ris:{},saltate:[],done:false,sensibili:null};
  onb2Salva();show("onb2");};

/* ═══ IL RIPRISTINO DOPO UN RICARICAMENTO (25/08) ══════════════════
   Il lavoro vive in memoria di pagina: un ricaricamento — o il
   telefono che chiude la scheda per liberare memoria — lo cancellava,
   e con lui il piano. Qui si guarda su disco cosa era rimasto in
   sospeso:
   • `S.genPronto`: il piano era FINITO ma non ancora applicato (la
     scheda è morta fra il completamento e l'«Entra») → se la persona
     è già dentro l'app si applica subito, altrimenti resta lì e lo
     prenderà la chiusura dell'onboarding;
   • `S.genPend`: il lavoro era A METÀ → riparte da solo, in
     sottofondo, con gli stessi dati di allora.
   Una richiesta più vecchia di un giorno non si riprende: i dati di
   ieri possono non essere più quelli di oggi, e un piano vecchio che
   compare da solo farebbe più paura che comodo. */
setTimeout(()=>{try{
  if(S.genPronto&&S.genPronto.piano){
    if(S.onboard&&S.onboard.done){
      onb2RicetteApplica(S.genPronto.piano,S.genPronto.spesa||null);
      try{toast(tr("Piano pronto ✓ — lo trovi in Piano."));}catch(e){}
      try{render(cur);}catch(e){}}
    return;}
  if(S.genPend&&S.genPend.dati&&S.genPend.t){
    if(Date.now()-(S.genPend.at||0)>86400000){delete S.genPend;save();return;}
    if(typeof aiOn!=="function"||!aiOn())return;
    const g=onb2Gen();
    if(g.stato!=="fermo")return;
    g.applicaDaSolo=!!(S.onboard&&S.onboard.done);
    onb2GeneraCore(S.genPend.dati,S.genPend.t);}
}catch(e){}},3500);
