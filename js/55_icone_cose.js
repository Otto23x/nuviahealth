/* ═══════════════════════════════════════════════════════════════
   55. LE ICONE DELLE COSE
   ═══════════════════════════════════════════════════════════════
   Dove serve davvero un'icona: nelle LISTE LUNGHE. In una spesa da
   quaranta righe, «Carne e pesce» letto quaranta volte è tempo
   perso; un'icona a sinistra la si salta con l'occhio e si arriva
   dove si voleva. È qui che un disegno vale più di una parola —
   non nei titoli, dove sarebbe decorazione.

   Quattro famiglie, scelte perché ricorrono ovunque:
   · i GRUPPI ALIMENTARI (proteina, carboidrato, verdura…) —
     compaiono in ogni piatto, in ogni riga della spesa;
   · le CATEGORIE DELLA SPESA e della dispensa, che sono le stesse
     cose viste da un'altra parte;
   · le CAUSE DELLA FAME NERVOSA — e qui l'icona fa una cosa in
     più: alleggerisce. Toccare un disegno costa meno che
     dichiarare per iscritto «solitudine»;
   · i TURNI, dove il sole, il tramonto e la luna dicono in un
     colpo quello che tre parole dicono in tre.

   REGOLA DI SEMPRE: l'icona accompagna la parola, non la
   sostituisce. Chi non riconosce il disegno legge; chi usa il
   lettore di schermo sente la parola. Un'icona sola è un indovinello.
                                                                   */

const ICONE_COSE={
 /* ── gruppi alimentari ── */
 proteina:  '<path d="M7 14.5c0-3 2.2-5.5 5-5.5s5 2.5 5 5.5-2.2 5.5-5 5.5-5-2.5-5-5.5z"/><path d="M9.5 12.5c.8-1 2.2-1.4 3.4-.8"/>',
 carboidrato:'<path d="M4 15.5c0-2.6 3.6-4.6 8-4.6s8 2 8 4.6-3.6 4.6-8 4.6-8-2-8-4.6z"/><path d="M7.5 13.8h9M8.5 16.6h7"/>',
 verdura:   '<path d="M12 20c-3.6 0-6.4-2.8-6.4-6.2 0-3 2-5.2 4.4-6.4C11.2 6.6 12 5.4 12 4c1.6 1.6 2.2 2.8 2 4.4 2.4 1.2 4.4 3.4 4.4 6.4C18.4 17.2 15.6 20 12 20z"/><path d="M12 8.4V20"/>',
 frutta:    '<circle cx="12" cy="14" r="6"/><path d="M12 8c0-2 1.4-3.6 3.4-4-.2 2-1.4 3.4-3.4 4z"/><path d="M12 8V6"/>',
 grasso:    '<circle cx="9" cy="13" r="3.4"/><circle cx="15.4" cy="15.6" r="2.4"/><circle cx="14.6" cy="9.8" r="1.8"/>',
 latticino: '<path d="M9 4h6l.8 3.4v11a1.6 1.6 0 0 1-1.6 1.6H9.8a1.6 1.6 0 0 1-1.6-1.6v-11z"/><path d="M8.6 9.6h6.8"/>',
 dolce:     '<path d="M5.5 12.5h13v5.5a1.6 1.6 0 0 1-1.6 1.6H7.1a1.6 1.6 0 0 1-1.6-1.6z"/><path d="M6.4 12.5c0-2.6 2.5-4.6 5.6-4.6s5.6 2 5.6 4.6"/><path d="M12 7.9V5.6"/>',
 bevanda:   '<path d="M6 4h12l-1.4 15.4a2 2 0 0 1-2 1.8h-5.2a2 2 0 0 1-2-1.8z"/><path d="M6.7 9.6h10.6"/>',
 /* ── categorie della spesa (le stesse cose, viste dal negozio) ── */
 carne:     '<path d="M13.6 4.6a5.4 5.4 0 0 1 5.8 5.8c-.3 3.6-3.4 5-5.6 6.8-1.8 1.5-2.6 3.2-4.4 2.6-2-.7-2.6-3-1.8-4.8 1.4-3 2.2-5.4 3-7.4.6-1.6 1.6-3 3-3z"/><circle cx="8.4" cy="16" r="1.5"/>',
 cereali:   '<path d="M12 20V8"/><path d="M12 8c-2.4 0-3.6-1.6-3.6-4 2.4 0 3.6 1.6 3.6 4zM12 8c2.4 0 3.6-1.6 3.6-4-2.4 0-3.6 1.6-3.6 4z"/><path d="M12 13c-2.4 0-3.6-1.6-3.6-4 2.4 0 3.6 1.6 3.6 4zM12 13c2.4 0 3.6-1.6 3.6-4-2.4 0-3.6 1.6-3.6 4z"/>',
 legumi:    '<path d="M5 12.5a4 4 0 0 1 4-4h6a4 4 0 0 1 0 8H9a4 4 0 0 1-4-4z"/><circle cx="9.4" cy="12.5" r="1.3"/><circle cx="14.6" cy="12.5" r="1.3"/>',
 pesce:     '<path d="M3.5 12c3-4.2 7-6 10.4-6 2.6 0 5 1.6 6.6 6-1.6 4.4-4 6-6.6 6-3.4 0-7.4-1.8-10.4-6z"/><path d="M3.5 12 6 9v6z" opacity=".5"/><circle cx="16.6" cy="10.6" r="1"/>',
 /* ── le cause della fame ── */
 stanchezza:'<path d="M18 14.8A7.6 7.6 0 0 1 9.2 6a7.6 7.6 0 1 0 8.8 8.8z"/>',
 noia:      '<circle cx="12" cy="12" r="8.4"/><path d="M9 15h6"/><path d="M8.6 9.8h1.8M13.6 9.8h1.8"/>',
 lavoro:    '<rect x="3.6" y="7.6" width="16.8" height="12" rx="2"/><path d="M9 7.6V6a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 6v1.6"/><path d="M3.6 13h16.8"/>',
 solitudine:'<circle cx="12" cy="8.6" r="3.4"/><path d="M6 19.4c.4-3.2 2.9-5 6-5s5.6 1.8 6 5"/>',
 rabbia:    '<circle cx="12" cy="12" r="8.4"/><path d="M8.6 16c1-1.4 5.8-1.4 6.8 0"/><path d="M8.2 8.6l2.2 1.4M15.8 8.6l-2.2 1.4"/>',
 tristezza: '<path d="M12 21s-6.6-4.4-6.6-9.4a3.6 3.6 0 0 1 6.6-2 3.6 3.6 0 0 1 6.6 2C18.6 16.6 12 21 12 21z" opacity=".35"/><path d="M9.6 9.6c-.6 1.4-.4 2.8.4 3.8"/>',
 festa:     '<path d="M4.4 20 10 8.4 15.6 14z"/><path d="M14 4.6v2M18.8 6.2l-1.4 1.4M20 11h-2"/>',
 abitudine: '<circle cx="12" cy="12" r="8"/><path d="M12 7.4V12l3 1.8"/>',
 /* ── i turni ── */
 mattina:   '<circle cx="12" cy="12" r="4.2"/><path d="M12 3.4v2M12 18.6v2M3.4 12h2M18.6 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18"/>',
 pomeriggio:'<path d="M4 17h16"/><path d="M7.4 13.6a4.6 4.6 0 0 1 9.2 0"/><path d="M12 5v2.4M5.4 8.2 7 9.6M18.6 8.2 17 9.6"/>',
 notte:     '<path d="M18 14.8A7.6 7.6 0 0 1 9.2 6a7.6 7.6 0 1 0 8.8 8.8z"/><path d="M19 4.4v2.8M17.6 5.8h2.8"/>',
 riposo:    '<path d="M3.6 11 12 4.4l8.4 6.6"/><path d="M5.8 12.6V19a1 1 0 0 0 1 1h10.4a1 1 0 0 0 1-1v-6.4"/>'
};
window.ICONE_COSE=ICONE_COSE;

function icoCosa(nome,sz){
  const p=ICONE_COSE[nome];
  if(!p)return "";
  return '<svg class="icocosa" viewBox="0 0 24 24" width="'+(sz||18)+'" height="'+(sz||18)+
    '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" '+
    'stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';}
window.icoCosa=icoCosa;

/* ── la traduzione: da una parola qualsiasi al disegno giusto ──── */
/* Le categorie hanno nomi diversi in posti diversi («Carne e pesce»
   nella spesa, «proteina» nel piatto): una mappa sola evita di
   inseguire le stringhe una per una. Se non riconosce, ritorna
   vuoto e la riga resta com'era: mai un'icona sbagliata. */
function cosaDi(testo){
  const t=String(testo||"").toLowerCase();
  if(/carne|pollo|manzo|maiale|salum/.test(t))return "carne";
  if(/pesce|tonno|salmon|molluschi/.test(t))return "pesce";
  if(/uova|latticin|formagg|yogurt|latte/.test(t))return "latticino";
  if(/cereal|pane|pasta|riso|deriv/.test(t))return "cereali";
  if(/legum|fagiol|cec[i]|lentic/.test(t))return "legumi";
  if(/verdur|ortagg|insalat/.test(t))return "verdura";
  if(/frutta|frutto/.test(t))return "frutta";
  if(/grass|olio|frutta secca|semi/.test(t))return "grasso";
  if(/dolc|snack|zucch/.test(t))return "dolce";
  if(/bevand|bibit|acqua/.test(t))return "bevanda";
  if(/protein/.test(t))return "proteina";
  if(/carboidrat/.test(t))return "carboidrato";
  if(/dispensa|scorte/.test(t))return "cereali";
  return "";}
window.cosaDi=cosaDi;

/* Il prefisso pronto da mettere davanti a una voce di lista: se non
   c'è un'icona adatta non aggiunge niente, e la riga resta pulita. */
window.icoPrefisso=(testo,sz)=>{
  const k=cosaDi(testo);
  return k?icoCosa(k,sz||17)+" ":"";};

/* ── le cause della fame, con la loro faccia ─────────────────── */
window.icoCausa=(k,sz)=>{
  const m={stanchezza:"stanchezza",noia:"noia",lavoro:"lavoro",
    solitudine:"solitudine",rabbia:"rabbia",tristezza:"tristezza",
    festa:"festa",abitudine:"abitudine","abitudine serale":"abitudine",
    stress:"lavoro"};
  const n=m[String(k||"").toLowerCase()];
  return n?icoCosa(n,sz||17):"";};

/* ── i turni ─────────────────────────────────────────────────── */
window.icoTurno=(k,sz)=>{
  const n=(k==="mattina"||k==="pomeriggio"||k==="notte"||k==="riposo")?k:"";
  return n?icoCosa(n,sz||18):"";};
