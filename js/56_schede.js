/* ═══════════════════════════════════════════════════════════════
   56. LE SCHEDE — una pagina lunga si naviga, non si scorre
   ═══════════════════════════════════════════════════════════════
   Numeri e Profilo erano due rotoli: 6.133 e 4.222 parole, tutto
   uno sotto l'altro. Chi cercava una cosa sola doveva passare
   davanti a tutte le altre, e chi arrivava per la prima volta
   vedeva un muro.

   La soluzione non è togliere contenuto — quel contenuto serve —
   ma smettere di mostrarlo tutto insieme. Si vede la scheda
   aperta, le altre aspettano.

   TRE REGOLE:
   1. LA SCHEDA SI RICORDA. Se torni sulla pagina, sei dove eri:
      ricominciare sempre dalla prima è il modo di far sembrare
      lungo anche ciò che è corto.
   2. LE ETICHETTE SONO UNA PAROLA. «Peso», non «Il tuo peso nel
      tempo»: una fila di titoli lunghi è un altro muro, più corto.
   3. NIENTE SCOMPARE. Le sezioni sono le stesse di prima, nello
      stesso ordine: chi sapeva dov'era una cosa la ritrova.

   Il ricordo vive in localStorage, non in S: è una preferenza di
   navigazione, non un dato della persona. Se si perde, si riparte
   dalla prima scheda e non è successo niente.                     */

const SCHEDE_KEY="nuvia_schede";

function schedaAttiva(pagina,prima){
  try{
    const m=JSON.parse(localStorage.getItem(SCHEDE_KEY)||"{}");
    if(m&&m[pagina])return m[pagina];
  }catch(e){}
  return prima;}
window.schedaAttiva=schedaAttiva;

window.schedaVai=(pagina,k)=>{
  try{usoSegna("scheda");}catch(e){}
  try{
    const m=JSON.parse(localStorage.getItem(SCHEDE_KEY)||"{}");
    m[pagina]=k;
    localStorage.setItem(SCHEDE_KEY,JSON.stringify(m));
  }catch(e){}
  render(cur);
  /* si torna in cima: cambiare scheda e restare a metà pagina è
     il modo più veloce di far credere che non sia successo niente */
  try{const el=document.getElementById("pg-"+cur);
    if(el&&el.scrollIntoView)el.scrollIntoView({block:"start",behavior:"instant"});
  }catch(e){}};

/* ── la barra ─────────────────────────────────────────────────── */
/* voci = [[chiave, etichetta], …]. L'etichetta è UNA parola. */
window.schedeBarra=(pagina,voci)=>{
  const att=schedaAttiva(pagina,voci[0][0]);
  return `<div class="schede" role="tablist">${voci.map(([k,t])=>
    `<button class="schtab${k===att?" on":""}" role="tab" aria-selected="${k===att}"
      onclick="schedaVai('${pagina}','${k}')">${esc(t)}</button>`).join("")}</div>`;};

/* Comodo per il chiamante: «sono nella scheda X?» */
window.inScheda=(pagina,k,prima)=>schedaAttiva(pagina,prima)===k;


/* ── IL FILTRO A MARCATORI ────────────────────────────────────────
   Dividere una funzione di rendering lunga con degli `if` significa
   mettere le mani nelle sue graffe — e su 160 righe è il modo più
   veloce di rompere qualcosa senza accorgersene (ci ho provato:
   tre errori di scope in dieci minuti).

   Qui si fa il contrario: il rendering resta ESATTAMENTE com'era,
   e si segnano i confini con dei commenti HTML. Alla fine si
   tengono solo i pezzi della scheda aperta. Nessuna graffa toccata,
   nessuno scope spostato: se un giorno le schede si tolgono, basta
   smettere di chiamare questa funzione.

   Il contenuto scartato non finisce nel DOM: non è nascosto con il
   CSS, non c'è proprio. */
window.schedeFiltra=(html,attiva)=>{
  const M=/<!--SCHEDA:(\w+)-->/g;
  if(!M.test(html))return html;
  M.lastIndex=0;
  let out="",corrente=null,ultimo=0,m;
  while((m=M.exec(html))){
    if(corrente===null||corrente===attiva)out+=html.slice(ultimo,m.index);
    corrente=m[1];
    ultimo=m.index+m[0].length;}
  if(corrente===null||corrente===attiva)out+=html.slice(ultimo);
  return out;};
