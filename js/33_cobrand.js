/* ═══════════════════════════════════════════════════════════════
   33. IL CO-BRANDING (Sprint 8)
   ═══════════════════════════════════════════════════════════════
   Il paziente di uno studio apre un'app che sembra del suo centro:
   il logo in alto, il colore dei pulsanti. È quello che fa comprare
   allo studio, e non costa niente al paziente.

   Quattro regole, e tre sono difese qui e non solo nel pannello:

   1. LA LEGGIBILITÀ VIENE PRIMA DEL MARCHIO. Il server corregge già
      i colori impossibili, ma il tema arriva dalla rete e questo
      modulo lo ricontrolla: se non regge 4,5:1 si tengono i colori
      di Nuvia. Non è diffidenza verso il server, è che chi ci
      rimette è un paziente che non ha scelto niente — e per lui
      un'app illeggibile è un'app rotta, non un tema sbagliato.
   2. IL NOME NUVIA NON SI TOGLIE. Co-branding, non etichetta
      bianca: il logo dello studio sta ACCANTO al nostro. Serve al
      paziente (sa di chi è l'app se cambia studio) e serve a noi.
   3. IL TEMA NON TOCCA I SEGNALI. Verde «va bene» e rosso «attento»
      restano quelli: se un centro col rosso nel logo lo mettesse
      sui pulsanti, ogni azione sembrerebbe un allarme.
   4. LA MASCOTTE RESTA NOSTRA. È un personaggio, non un asset
      colorabile: tinta del colore dello studio diventerebbe una
      cosa senza identità.                                        */

/* ── La misura ──────────────────────────────────────────────────
   Stessa formula del server. Non è una duplicazione da togliere: là
   serve a CORREGGERE, qui a RIFIUTARE. Se un giorno divergono,
   l'app tiene i suoi colori — che è il lato giusto in cui sbagliare. */
function _lum(hex){
  const h=String(hex||"").replace("#","");
  if(!/^[0-9a-fA-F]{6}$/.test(h))return null;
  const c=v=>{v=parseInt(v,16)/255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};
  return 0.2126*c(h.slice(0,2))+0.7152*c(h.slice(2,4))+0.0722*c(h.slice(4,6));}

function contrastoDi(a,b){
  const la=_lum(a),lb=_lum(b);
  if(la===null||lb===null)return null;
  return (Math.max(la,lb)+0.05)/(Math.min(la,lb)+0.05);}
window.contrastoDi=contrastoDi;

/* ── Il tema dello studio ───────────────────────────────────────
   Arriva dentro il conto. Chi non ha uno studio non ne ha nessuno, e
   questo modulo non fa assolutamente niente. */
function temaStudio(){
  try{
    const v=conto().vista;
    if(!v||!v.studio||!v.tema)return null;
    return v.tema;
  }catch(e){return null;}}
window.temaStudio=temaStudio;

/* Il tema si applica solo se è leggibile. La verifica è per modo:
   lo stesso colore non può servire su fondo chiaro e su fondo scuro,
   e fingere che basti è il modo in cui il tema scuro diventa
   illeggibile senza che nessuno se ne accorga. */
function temaUsabile(t,scuro){
  if(!t)return null;
  const c=scuro?t.primarioScuro:t.primarioChiaro;
  if(!c||!/^#[0-9a-fA-F]{6}$/.test(c))return null;
  const testo=scuro?"#04211E":"#FFFFFF";
  const r=contrastoDi(c,testo);
  if(r===null||r<4.5)return null;      /* non si legge: si tiene Nuvia */
  return c;}
window.temaUsabile=temaUsabile;

function cobrandApplica(){
  const el=document.documentElement;
  const t=temaStudio();
  /* Si toglie sempre prima: uscire dallo studio deve riportare Nuvia
     com'era, senza ricaricare la pagina. */
  el.style.removeProperty("--azione");
  el.removeAttribute("data-studio");
  if(!t)return false;
  const scuro=el.getAttribute("data-theme")==="dark";
  const c=temaUsabile(t,scuro);
  if(!c)return false;
  /* SOLO il colore d'azione. Non i segnali, non i fondi, non il
     testo: un tema che tocca tutto diventa un'app diversa, e i
     problemi che genera li riceviamo noi, non lo studio. */
  el.style.setProperty("--azione",c);
  el.setAttribute("data-studio",t.nome||"1");
  return true;}
window.cobrandApplica=cobrandApplica;

/* ── La firma ───────────────────────────────────────────────────
   Il logo dello studio accanto al nostro nome. Mai al posto. */
function cobrandFirmaHTML(){
  const t=temaStudio();
  if(!t)return "";
  const logo=t.logo
    ? `<img src="${esc(t.logo)}" alt="" class="studio-logo" onerror="this.remove()">`
    : "";
  return `<div class="studio-firma" data-firma="1">
    ${logo}
    <div class="studio-testo">
      <div class="studio-nome">${esc(t.nome||"")}</div>
      <div class="studio-con">${esc(tr("con Nuvia"))}</div>
    </div>
  </div>`;}
window.cobrandFirmaHTML=cobrandFirmaHTML;

/* La riga che spiega al paziente com'è messo. Sta in Io, sotto il
   conto: chi paga, cosa vede lo studio, e come si esce. */
function cobrandNotaHTML(){
  const t=temaStudio();
  if(!t)return "";
  return `<div class="card" data-cobrand="nota">
    ${cobrandFirmaHTML()}
    <div class="hint" style="margin-top:12px">${esc(tr("Il tuo studio ha personalizzato l'aspetto dell'app. Nuvia resta la stessa: i tuoi dati sono tuoi, e decidi tu cosa condividere."))}</div>
    <button class="btn ghost small" type="button" onclick="show('consensi')">${esc(tr("Cosa vede il mio studio"))}</button>
  </div>`;}
window.cobrandNotaHTML=cobrandNotaHTML;
