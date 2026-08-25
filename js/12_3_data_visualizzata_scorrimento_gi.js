/* ═══════════════════════════════════════════════════════════════
   3. DATA VISUALIZZATA (scorrimento giorni) + utilità date
   ═══════════════════════════════════════════════════════════════ */
let VIEW=new Date(); VIEW.setHours(12,0,0,0);
/* ATTENZIONE: toISOString() restituisce l'ora UTC. In Italia, fra
   mezzanotte e le due, dava ancora la data del giorno prima — e quella
   data finisce OVUNQUE: eventi del giorno, spunte, pesate, serie, dati
   d'uso, scontrini. Chi segnava la cena all'una di notte se la ritrovava
   sul giorno sbagliato. Qui si usa la data LOCALE, che è quella che la
   persona vede sull'orologio. */
const iso=d=>{const x=(d instanceof Date)?d:new Date(d);
  return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");};
/* Data da un valore archiviato: null se non è utilizzabile. Serve perché una
   sola data corrotta (backup vecchio, import a mano) non deve far crollare
   un'intera pagina. */
/* Una stringa solo-data ("2026-08-15") per lo standard è mezzanotte UTC:
   a ovest di UTC il giorno mostrato slitterebbe a quello prima. La si
   ancora a MEZZOGIORNO LOCALE, come già si fa altrove con "T12:00:00". */
function giornoDa(x){return (typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x))?new Date(x+"T12:00:00"):new Date(x);}
window.giornoDa=giornoDa;
function safeDate(x){if(!x&&x!==0)return null;const d=giornoDa(x);return isNaN(d.getTime())?null:d;}
function dateIT(x){const d=safeDate(x);return d?d.toLocaleDateString(dataLoc()):tr("data assente");}
const wd=d=>(d.getDay()+6)%7; // 0=lunedì
function shiftDay(n){VIEW.setDate(VIEW.getDate()+n);renderHeader();render(cur);}
function goToday(){VIEW=new Date();VIEW.setHours(12,0,0,0);renderHeader();render(cur);}
function viewIdx(){return wd(VIEW);}
function isToday(){return iso(VIEW)===iso(new Date());}
const fmtDate=d=>d.toLocaleDateString(dataLoc(),{weekday:"long",day:"numeric",month:"long",year:"numeric"});
const fmtDateShort=d=>d.toLocaleDateString(dataLoc(),{weekday:"short",day:"numeric",month:"short"}).replace(/\./g,"");

