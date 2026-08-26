/* ═══════════════════════════════════════════════════════════════
   5. STREAK (giorni in target consecutivi) — congelata in vacanza
   ═══════════════════════════════════════════════════════════════ */
function dayInTarget(di){const e=eatenOfDay(di);
  return e.k>0&&deficitOfDay(di)>=0&&extrasKcal(di)<=300;}
function isHard(dISO){return !!(S.hardDays&&S.hardDays[dISO]);}
function bumpStreak(){const y=new Date();y.setDate(y.getDate()-1);y.setHours(12,0,0,0);
  const yIso=iso(y);if(S.streak.last===yIso)return;
  /* Congelata in vacanza, nelle giornate difficili E nei giorni di
     rientro: azzerare la serie il primo giorno dopo le ferie sarebbe
     il modo più rapido di far chiudere l'app a chi è appena tornato.
     Congelare non regala niente — semplicemente non punisce. */
  if(S.ui.vacanza||isHard(yIso)||(typeof rientroOn==="function"&&rientroOn())){
    S.streak.last=yIso;save();return;}
  const prev=new Date(y);prev.setDate(prev.getDate()-1);
  if(dayInTarget(wd(y))){S.streak.count=(S.streak.last===iso(prev)||S.streak.count===0)?S.streak.count+1:1;
    if(S.streak.count>0&&S.streak.count%7===0)setTimeout(()=>{confetti();toast(tr("{n} giorni in target di fila!",{n:S.streak.count}));},600);}
  else S.streak.count=0;
  S.streak.last=yIso;save();}

