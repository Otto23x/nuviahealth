/* ═══ SORGENTE ATTIVITÀ — presa a muro per passi e allenamenti ═══════════
   Oggi l'unica sorgente è "manuale" (ciò che l'utente registra nella
   pagina Sport). Domani, nell'app nativa, si aggiungeranno Health Connect
   e HealthKit SENZA riscrivere nulla: si registra un'altra sorgente con
   la stessa forma e il resto dell'app non se ne accorge.

   Contratto di una sorgente:
     id              stringa unica ("manuale", "health", …)
     nome            etichetta da mostrare
     disponibile()   → true se può funzionare qui e ora
     passi(di)       → passi del giorno di piano `di` (indice) o null
     allenamenti(di) → array [{sport, …}] del giorno `di` (anche vuoto)

   Regole:
   - "manuale" esiste sempre ed è la sorgente attiva di default.
   - Le sorgenti automatiche non sovrascrivono MAI l'inserito a mano:
     si affiancano, e a parità di sport vince il manuale — l'utente ha
     sempre ragione sul proprio corpo.                                   */
(function(){
  const registro=new Map();
  let attiva="manuale";

  window.SorgenteAttivita={
    registra(s){
      if(!s||!s.id||typeof s.passi!=="function"||typeof s.allenamenti!=="function")
        throw new Error("sorgente attività malformata");
      registro.set(s.id,s);
    },
    elenca(){ return [...registro.values()].filter(s=>!s.disponibile||s.disponibile()); },
    scegli(id){ if(registro.has(id)) attiva=id; },
    attiva(){ return registro.get(attiva)||registro.get("manuale"); },
    passiDelGiorno(di){
      const s=this.attiva(); const v=s?s.passi(di):null;
      if(v!=null) return v;
      const man=registro.get("manuale");
      return man?man.passi(di):null;
    },
    /* lettura fusa: manuale + automatico, precedenza al manuale */
    allenamentiDelGiorno(di){
      const man=(registro.get("manuale")||{allenamenti:()=>[]}).allenamenti(di)||[];
      if(attiva==="manuale") return man;
      const auto=(registro.get(attiva)||{allenamenti:()=>[]}).allenamenti(di)||[];
      return man.concat(auto.filter(a=>!man.some(m=>m.sport===a.sport)));
    }
  };

  /* La sorgente manuale legge dallo stato esistente (S.week.days):
     nessun dato nuovo, nessuna chiave nuova, solo una finestra. */
  window.SorgenteAttivita.registra({
    id:"manuale", nome:"Inserito a mano",
    disponibile(){ return true; },
    passi(di){
      try{
        const st=(typeof S!=="undefined")?S:window.S;
        const g=(st&&st.week&&st.week.days&&st.week.days[di])||null;
        return (g&&+g.steps>0)?+g.steps:null;
      }catch(e){ return null; }
    },
    allenamenti(di){
      try{
        const st=(typeof S!=="undefined")?S:window.S;
        const g=(st&&st.week&&st.week.days&&st.week.days[di])||null;
        return (g&&Array.isArray(g.workouts))?g.workouts:[];
      }catch(e){ return []; }
    }
  });
})();
