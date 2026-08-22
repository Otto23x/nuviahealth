/* ═══════════════════════════════════════════════════════════════
   38. LA TELEMETRIA CHE NON SA NIENTE DI TE
   ═══════════════════════════════════════════════════════════════
   Per decidere dove lavorare serve sapere quali funzioni vengono
   usate. C'è un solo modo di saperlo senza tradire «i tuoi dati
   stanno sul tuo telefono»: che il dato inviato, anche intercettato,
   non dica niente di nessuno.

   Le regole, identiche a quelle del server (che rifà i controlli:
   questo modulo è cortesia, quello è legge):
   · SPENTA finché la persona non la accende, dalla pagina Io.
   · Un evento è UN NOME da una lista chiusa + il giorno. Mai testo
     libero, mai numeri del corpo, mai orari precisi (il giorno
     basta a contare, l'ora profila).
   · Niente identità: la chiamata non porta il token. Il server
     somma +1 e butta il resto.
   · La coda vive fuori dal diario (chiave sua): spegnere la
     telemetria la svuota, e il diario non c'entra mai.            */

const TLM_EVENTI=[
  "apertura","onboarding_finito","piano_generato","foto_pasto",
  "pasto_libero","barcode","piatto_mio","spesa_aperta","dispensa",
  "allenamento_fatto","vacanza_accesa","report_visita","racconto",
  "drive_sync","dieta_studio_adottata","lingua_cambiata"];
const TLM_CHIAVE="nuvia_tlm";

/* traduzioni nel dizionario centrale (10_base), come da convenzione */

function tlmAccesa(){try{return !!(S.ui&&S.ui.telemetria);}catch(e){return false;}}

/* Registra un evento. Chiamarla è sempre lecito: se la telemetria è
   spenta o il nome non è in lista, non succede NIENTE — così il
   codice chiamante non deve sapere né chiedere. */
function telemetria(nome){
  try{
    if(!tlmAccesa()||TLM_EVENTI.indexOf(nome)<0)return;
    const coda=JSON.parse(localStorage.getItem(TLM_CHIAVE)||"[]");
    coda.push({n:nome,g:giornoIso(new Date())});
    /* una coda che cresce per sempre è un archivio: si tiene poco */
    localStorage.setItem(TLM_CHIAVE,JSON.stringify(coda.slice(-100)));
    tlmSpedisci();
  }catch(e){}}
window.telemetria=telemetria;

/* Spedizione: quando c'è rete, senza insistere, senza token. */
let _tlmInCorso=false;
function tlmSpedisci(){
  try{
    if(_tlmInCorso||!tlmAccesa()||!navigator.onLine)return;
    const coda=JSON.parse(localStorage.getItem(TLM_CHIAVE)||"[]");
    if(!coda.length)return;
    _tlmInCorso=true;
    fetch(contoUrl()+"/telemetria",{method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({eventi:coda.slice(0,50)})})
    .then(r=>{if(r.ok)localStorage.setItem(TLM_CHIAVE,
        JSON.stringify(coda.slice(50)));})
    .catch(()=>{})            /* niente rete, niente dramma: resta in coda */
    .finally(()=>{_tlmInCorso=false;});
  }catch(e){_tlmInCorso=false;}}

function tlmAccendi(si){
  S.ui=S.ui||{};
  S.ui.telemetria=!!si;
  if(!si)try{localStorage.removeItem(TLM_CHIAVE);}catch(e){}
  save();
  if(si)telemetria("apertura");}
window.tlmAccendi=tlmAccendi;

/* ── L'interruttore, nella pagina Io ────────────────────────────
   Si aggiunge in coda alla pagina esistente senza riscriverla: il
   modulo avvolge il disegno e appende la sua scheda.              */
(function(){
  const _renderIo=window.renderIo;
  if(typeof _renderIo!=="function")return;
  window.renderIo=function(){
    _renderIo.apply(this,arguments);
    try{
      const el=document.getElementById("pg-io");
      if(!el||el.querySelector("#tlm-scheda"))return;
      /* Appesa in coda, questa card finiva FUORI dal filtro delle
         schede e compariva in tutte e quattro — anche su «Tu», dove
         non c'entra niente. Ora compare solo dentro «Altro». */
      if(typeof inScheda==="function"&&!inScheda("io","permessi","dati"))return;
      const on=tlmAccesa();
      const box=document.createElement("div");
      box.className="card";box.id="tlm-scheda";
      box.innerHTML=
        '<h3>'+tr("Statistiche anonime d'uso")+'</h3>'+
        '<p class="hint">'+tr("Se le accendi, ci dici quali funzioni usi — mai cosa mangi, quanto pesi o come stai: solo «funzione usata», contata in forma anonima. Non esiste un tuo profilo da nessuna parte: per questo non c'è niente da cancellare.")+'</p>'+
        '<label class="ckline riga-toggle"><input type="checkbox" id="tlm-int" '+(on?"checked":"")+'> '+
        /* LE PARENTESI SERVONO: `+` lega più forte di `? :`, quindi
           senza di esse tutta la stringa costruita finora finiva nella
           CONDIZIONE del ternario (ed è sempre vera), e la card si
           riduceva alla sola frase «Accese — grazie…».
           È il difetto che il founder ha visto al posto della sua
           schermata: una riga di testo e nient'altro. */
        (on?tr("Accese — grazie: ci aiuti a capire dove lavorare")
           :tr("Spente — l'app funziona identica"))+'</label>';
      el.appendChild(box);
      const ck=box.querySelector("#tlm-int");
      ck.addEventListener("change",function(){tlmAccendi(ck.checked);renderIo();});
    }catch(e){}
  };
})();

/* al risveglio della rete, si prova a svuotare la coda */
try{window.addEventListener("online",tlmSpedisci);}catch(e){}
