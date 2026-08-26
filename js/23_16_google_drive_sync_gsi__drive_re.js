/* ═══════════════════════════════════════════════════════════════
   16. GOOGLE DRIVE SYNC (GSI + Drive REST, scope drive.appdata)
       Funziona solo da origine http/https registrata nel progetto.
   ═══════════════════════════════════════════════════════════════ */
let DTOKEN=null,tokenClient=null,driveReauthed=false;
/* Cache del token d'accesso Drive: dopo il primo consenso, entro la sua durata
   (~1h) l'app riusa il token salvato senza chiedere di nuovo l'accesso, anche
   dopo un riavvio. Alla scadenza si rinnova in silenzio. */
const DTOK_KEY="diario_dtoken";
// Questo dispositivo ha già completato una sincronizzazione con Drive? Serve a
// distinguere il PRIMO collegamento di un nuovo dispositivo (dove non bisogna
// mai spingere un profilo vuoto sopra un backup con dati veri di un altro
// dispositivo) dalle sincronizzazioni successive (dove basta confrontare i
// timestamp di contenuto).
const SYNCED_ONCE_KEY="diario_synced_once";
function hasRealLocalContent(){
  return !!(S.profile&&S.profile.dob) || (S.history&&S.history.length>0) || (S.profile&&S.profile.weights&&S.profile.weights.length>0);
}
function driveSaveToken(t){try{if(t&&t.access_token){DTOKEN=t.access_token;
  const exp=Date.now()+(((+t.expires_in||3600)-90)*1000);
  localStorage.setItem(DTOK_KEY,JSON.stringify({tok:t.access_token,exp}));}}catch(e){}}
function driveCachedToken(){try{const c=JSON.parse(localStorage.getItem(DTOK_KEY)||"null");
  if(c&&c.tok&&c.exp&&Date.now()<c.exp)return c.tok;}catch(e){}return null;}
function driveClearToken(){DTOKEN=null;try{localStorage.removeItem(DTOK_KEY);}catch(e){}}
/* Riacquisizione silenziosa del token (nessun popup se la sessione Google è
   attiva e il consenso è già stato dato in passato su questo dispositivo). */
function driveSilentAuth(){
  loadGSI(()=>{try{
    tokenClient=google.accounts.oauth2.initTokenClient({client_id:S.drive.cid,
      scope:"https://www.googleapis.com/auth/drive.appdata",
      callback:async t=>{if(t&&t.access_token){driveSaveToken(t);await driveSyncOnStart();
        const st=document.getElementById("driveStatus");if(st)st.textContent=" Sincronizzato con Drive.";}},
      error_callback:()=>{}});
    tokenClient.requestAccessToken({prompt:""});
  }catch(e){}});}
function loadGSI(cb){if(window.google&&google.accounts)return cb();
  const s=document.createElement("script");s.src="https://accounts.google.com/gsi/client";
  s.onload=cb;s.onerror=()=>dlgAlert(tr("Impossibile caricare Google Identity (offline?)."));document.head.appendChild(s);}
/* IL DIFETTO DEL 23/08: questa funzione leggeva SEMPRE il campo
   `dCid`, che esiste solo nella pagina Sistema. Chiamata dal primo
   avvio — dove il campo si chiama `primoCid` — esplodeva sul null, e
   il `try` di chi la chiamava trasformava l'errore in un generico
   «il collegamento non è riuscito». Cioè: «Entra con Google» non ha
   MAI funzionato dalla prima schermata, e non lo diceva.
   Ora il campo si passa; se non c'è, vale quello già salvato. */
window.driveConnect=(idCampo)=>{
  S.drive=S.drive||{};
  const campo=document.getElementById(idCampo||"dCid");
  if(campo)S.drive.cid=String(campo.value||"").trim();
  save();
  if(!S.drive.cid)return dlgAlert(tr("Inserisci il CLIENT_ID."));
  if(location.protocol==="file:")return dlgAlert(tr("L'OAuth Google non funziona da file:// — pubblica l'app su https (es. GitHub Pages) e registra l'origine nel progetto Google Cloud."));
  loadGSI(()=>{
    tokenClient=google.accounts.oauth2.initTokenClient({client_id:S.drive.cid,
      scope:"https://www.googleapis.com/auth/drive.appdata",
      callback:async t=>{driveSaveToken(t);S.drive.on=true;save();
        /* la riga di stato esiste solo in Sistema: dal primo avvio non
           c'è, e cercarla faceva fallire il collegamento RIUSCITO */
        const st=document.getElementById("driveStatus");
        if(st)st.textContent=" "+tr("Connesso. Sincronizzo…");
        await driveSyncOnStart();render(cur);}});
    tokenClient.requestAccessToken();});};
async function driveFind(){
  const r=await fetch("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name%3D%27diario_backup.json%27&fields=files(id,modifiedTime)",
    {headers:{Authorization:"Bearer "+DTOKEN}});
  if(r.status===401){driveClearToken();throw new Error("auth");}
  const j=await r.json();return (j.files&&j.files[0])||null;}
/* Quanti "dati veri" contiene uno stato: serve per accorgersi se stiamo per
   sovrascrivere un backup pieno con uno molto più povero. */
function dataWeight(st){
  try{let n=0;
    n+=(st.history||[]).length*50;
    n+=(st.periods||[]).length*10;
    n+=((st.profile||{}).weights||[]).length*3;
    ((st.week||{}).days||[]).forEach(d=>{
      n+=(d.meals||[]).filter(m=>m.done||m.skip||m.custom).length;
      n+=(d.extras||[]).length+(d.workouts||[]).length;});
    return n;}catch(e){return 0;}}
window.driveUpload=async(silent)=>{
  if(!DTOKEN)return silent?null:dlgAlert(tr("Connettiti prima a Drive."));
  try{const f=await driveFind();
    // controllo di sicurezza: se il backup remoto contiene molti più dati di
    // quelli locali, qualcosa non torna. Meglio chiedere che cancellare.
    if(f&&!S.drive.forceUp){try{
      const rr=await fetch("https://www.googleapis.com/drive/v3/files/"+f.id+"?alt=media",{headers:{Authorization:"Bearer "+DTOKEN}});
      if(rr.ok){const remote=await rr.json();
        const wl=dataWeight(S),wr=dataWeight(remote);
        if(wr>0&&wl<wr*0.6){
          const ok=await dlgConfirm(tr(" Attenzione: il backup su Drive contiene molti più dati di quelli presenti su questo dispositivo.\n\nSe hai perso dei dati, NON sovrascrivere: annulla e usa «Ripristina da Drive».\n\nOK = sovrascrivo comunque il backup · Annulla = lascio il backup intatto"));
          if(!ok){const st0=document.getElementById("driveStatus");
            if(st0)st0.textContent="⏸ Caricamento sospeso per sicurezza: il backup remoto è più completo.";
            drivePending=false;return;}
          S.drive.forceUp=true;}
      }}catch(e){}}
    const meta={name:"diario_backup.json",parents:f?undefined:["appDataFolder"]};
    const boundary="-------diario";const body=
      "--"+boundary+"\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"+JSON.stringify(meta)+
      "\r\n--"+boundary+"\r\nContent-Type: application/json\r\n\r\n"+JSON.stringify(S)+"\r\n--"+boundary+"--";
    const url="https://www.googleapis.com/upload/drive/v3/files"+(f?"/"+f.id:"")+"?uploadType=multipart";
    await fetch(url,{method:f?"PATCH":"POST",
      headers:{Authorization:"Bearer "+DTOKEN,"Content-Type":"multipart/related; boundary="+boundary},body});
    const st=document.getElementById("driveStatus");if(st)st.textContent=" Salvato su Drive alle "+new Date().toLocaleTimeString(dataLoc());
    try{localStorage.setItem(SYNCED_ONCE_KEY,"1");localStorage.setItem(SYNC_LAST_KEY,String(Date.now()));}catch(e2){}
    drivePending=false;
    driveDailyCopy();   // copia datata, così le versioni precedenti restano
  }catch(e){if(!silent)dlgAlert(tr("Errore Drive: {e}",{e:e.message}));}};
/* Copia datata giornaliera su Drive: diario_YYYY-MM-DD.json, ne teniamo 7.
   Il file principale può essere sovrascritto, ma le versioni dei giorni
   scorsi restano recuperabili. */
async function driveDailyCopy(){
  try{
    const today=iso(new Date()),name="diario_"+today+".json";
    const q=encodeURIComponent("name contains 'diario_2'");
    const r=await fetch("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q="+q+"&fields=files(id,name,modifiedTime)",
      {headers:{Authorization:"Bearer "+DTOKEN}});
    if(!r.ok)return;
    const files=((await r.json()).files||[]).filter(x=>/^diario_\d{4}-\d{2}-\d{2}\.json$/.test(x.name));
    if(files.some(x=>x.name===name))return;           // copia di oggi già fatta
    const meta={name,parents:["appDataFolder"]};
    const b="-------diarioC";const body=
      "--"+b+"\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"+JSON.stringify(meta)+
      "\r\n--"+b+"\r\nContent-Type: application/json\r\n\r\n"+JSON.stringify(S)+"\r\n--"+b+"--";
    await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {method:"POST",headers:{Authorization:"Bearer "+DTOKEN,"Content-Type":"multipart/related; boundary="+b},body});
    // rotazione: teniamo le 7 copie più recenti
    files.sort((a,b2)=>a.name<b2.name?1:-1);
    for(let i=6;i<files.length;i++)
      fetch("https://www.googleapis.com/drive/v3/files/"+files[i].id,{method:"DELETE",headers:{Authorization:"Bearer "+DTOKEN}}).catch(()=>{});
  }catch(e){}}
/* Avvio: riconnessione silenziosa se già autorizzato su questo dispositivo.
   1) se ho un token valido in cache lo riuso senza contattare Google (nessun
      popup, nessun "accesso a Drive"); 2) altrimenti provo il rinnovo silenzioso. */
function tryDriveAuto(){
  if(!(S.drive.on&&S.drive.cid)||location.protocol==="file:")return;
  const cached=driveCachedToken();
  if(cached){DTOKEN=cached;
    driveSyncOnStart().then(()=>{const st=document.getElementById("driveStatus");if(st)st.textContent=" Sincronizzato con Drive.";}).catch(()=>{});
    return;}
  driveSilentAuth();}
/* Importa da Drive su richiesta: scarica il backup e sostituisce i dati locali */
/* Elenco delle copie disponibili su Drive: il backup principale più le copie
   datate degli ultimi giorni, così si può tornare a una versione precedente. */
window.driveVersions=async()=>{
  if(!DTOKEN)return dlgAlert(tr("Connettiti prima a Drive."));
  try{
    const r=await fetch("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,modifiedTime,size)",
      {headers:{Authorization:"Bearer "+DTOKEN}});
    const files=((await r.json()).files||[]).filter(x=>/^diario_/.test(x.name))
      .sort((a,b)=>a.modifiedTime<b.modifiedTime?1:-1);
    if(!files.length)return dlgAlert(tr("Nessuna copia trovata su Drive."));
    const list=files.map((f,i)=>(i+1)+") "+f.name.replace("diario_","").replace(".json","")+
      " — "+new Date(f.modifiedTime).toLocaleString(dataLoc())+(f.size?" ("+Math.round(f.size/1024)+" KB)":"")).join("\n");
    const n=(await dlgPrompt(tr("Copie disponibili su Drive:")+"\n\n"+list+"\n\n"+tr("Scrivi il NUMERO della copia da ripristinare.\nPer cancellarne una scrivi «elimina» e il numero (es. elimina 2), oppure «elimina tutte».")))||"";
    if(!n.trim())return;
    const mDel=String(n).trim().toLowerCase().match(/^elimina\s*(\d+|tutte)$/);
    if(mDel){
      const tutte=(mDel[1]==="tutte");
      const target=tutte?files:[files[parseInt(mDel[1])-1]].filter(Boolean);
      if(!target.length)return dlgAlert(tr("Numero non valido."));
      if(!await dlgConfirm(tutte?(tr("Elimino da Drive tutte le {n} copie datate?",{n:files.length})+"\n\n"+tr("Il backup principale non viene toccato.")):tr("Elimino da Drive la copia «{n}»?",{n:target[0].name}),{ok:tr("Elimina"),ko:tr("No")}))return;
      for(const f of target)
        await fetch("https://www.googleapis.com/drive/v3/files/"+f.id,{method:"DELETE",headers:{Authorization:"Bearer "+DTOKEN}});
      toast(tr("Eliminate da Drive: {n} ✓",{n:target.length}));
      return driveVersions();      /* riapre la lista aggiornata */
    }
    const f=files[parseInt(n)-1];if(!f)return dlgAlert(tr("Numero non valido."));
    if(!await dlgConfirm(tr("Ripristino «{n}» del {d}?",{n:f.name,d:new Date(f.modifiedTime).toLocaleString(dataLoc())})+"\n\n"+tr("I dati attuali del dispositivo vengono prima salvati in un'istantanea locale.")))return;
    snapSave("prima del ripristino da Drive");
    const rr=await fetch("https://www.googleapis.com/drive/v3/files/"+f.id+"?alt=media",{headers:{Authorization:"Bearer "+DTOKEN}});
    const data=await rr.text();
    localStorage.setItem(KEY,data);location.reload();
  }catch(e){dlgAlert(tr("Errore Drive: {e}",{e:e.message}));}};
/* Un solo ingresso per il ripristino: prima si sceglie se l'ultimo
   salvataggio o una versione precedente. Due bottoni erano un bottone
   di troppo. */
window.driveRestoreMenu=async()=>{
  if(!DTOKEN)return dlgAlert(tr("Connettiti prima a Drive."));
  const v=await dlgChoice("Cosa ripristino?",[
    ["last","L'ultimo salvataggio"],
    ["ver","Una versione precedente…"]]);
  if(v==="last")driveImport();
  else if(v==="ver")driveVersions();};
window.driveImport=async()=>{
  if(!DTOKEN)return dlgAlert(tr("Connettiti prima a Drive."));
  try{const f=await driveFind();
    if(!f)return dlgAlert(tr("Nessun backup trovato su Drive."));
    if(!await dlgConfirm(tr("Importo il backup da Drive del {d}?",{d:new Date(f.modifiedTime).toLocaleString(dataLoc())})+" "+tr("Sovrascrive i dati locali.")))return;
    const r=await fetch("https://www.googleapis.com/drive/v3/files/"+f.id+"?alt=media",{headers:{Authorization:"Bearer "+DTOKEN}});
    S=await r.json();localStorage.setItem(KEY,JSON.stringify(S));try{localStorage.setItem(SYNCED_ONCE_KEY,"1");}catch(e2){}location.reload();
  }catch(e){dlgAlert(tr("Errore importazione: {e}",{e:e.message}));}};

window.driveDisconnect=async()=>{
  if(!await dlgConfirm(tr("Scollegare SOLO questo dispositivo da Drive?\n\nIl backup su Drive e gli altri dispositivi restano intatti. Potrai ricollegarti quando vuoi.")))return;
  driveClearToken();
  try{localStorage.removeItem(SYNCED_ONCE_KEY);}catch(e){}
  S.drive.on=false;save();
  const st=document.getElementById("driveStatus");if(st)st.textContent="Dispositivo scollegato da Drive (il backup remoto è intatto).";
  render("io");};
/* Elimina il backup da Drive: azione che riguarda TUTTI i dispositivi collegati */
window.driveDelete=async(silent)=>{
  if(!DTOKEN){if(!silent)dlgAlert(tr("Connettiti prima a Drive."));return;}
  if(!silent&&!await dlgConfirm(tr("Eliminare il backup da Google Drive?\n\nATTENZIONE: sparirà da TUTTI i dispositivi collegati a questo account, non solo da questo. I dati locali di questo dispositivo restano finché non li cancelli a parte.")))return;
  try{
    /* va eliminato TUTTO: il backup principale e le copie datate, altrimenti
       restano visibili in "Versioni precedenti" */
    const all=await driveListAll();
    for(const f of all)
      await fetch("https://www.googleapis.com/drive/v3/files/"+f.id,{method:"DELETE",headers:{Authorization:"Bearer "+DTOKEN}});
    if(!silent){const st=document.getElementById("driveStatus");if(st)st.textContent=" Backup eliminati da Drive ("+all.length+").";
      render(cur);dlgAlert(tr("Eliminati da Drive: {n} file (backup principale e copie datate).",{n:all.length}));}
  }catch(e){if(!silent)dlgAlert(tr("Errore eliminazione: {e}",{e:e.message}));}};
/* Tutti i file dell'app su Drive: backup principale + copie datate */
async function driveListAll(){
  const r=await fetch("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,modifiedTime,size)",
    {headers:{Authorization:"Bearer "+DTOKEN}});
  return ((await r.json()).files||[]).filter(x=>/^diario/.test(x.name))
    .sort((a,b)=>a.modifiedTime<b.modifiedTime?1:-1);}
async function driveSyncOnStart(){ // confronta i timestamp DI CONTENUTO e allinea in silenzio
  try{const f=await driveFind();if(!f){try{localStorage.setItem(SYNCED_ONCE_KEY,"1");}catch(e2){}return driveUpload();}
    // Scarico il contenuto e confronto remote.meta.updated con S.meta.updated:
    // sono entrambi scritti dallo stesso save(), quindi sullo STESSO dispositivo
    // combaciano (niente più falso avviso "versione più recente" a ogni avvio).
    // Non uso f.modifiedTime (ora del file sul server), che è sempre leggermente
    // successiva al contenuto e faceva scattare l'avviso ogni volta.
    const r=await fetch("https://www.googleapis.com/drive/v3/files/"+f.id+"?alt=media",{headers:{Authorization:"Bearer "+DTOKEN}});
    if(r.status===401){driveClearToken();throw new Error("auth");}
    const remote=await r.json();
    const rT=new Date((remote&&remote.meta&&remote.meta.updated)||0).getTime();
    const lT=new Date((S&&S.meta&&S.meta.updated)||0).getTime();
    const firstSyncOnThisDevice=!localStorage.getItem(SYNCED_ONCE_KEY);

    if(firstSyncOnThisDevice){
      // Primo collegamento di QUESTO dispositivo: un dispositivo appena aperto
      // non ha un timestamp di contenuto significativo (è solo il momento in
      // cui il profilo vuoto è stato creato), quindi non va MAI usato per
      // decidere di sovrascrivere un backup che può contenere i dati veri di
      // un altro dispositivo — è esattamente il bug che impediva la
      // sincronizzazione tra telefono e tablet. Se qui non c'è nulla di
      // reale, adottiamo sempre il backup in silenzio; se invece questo
      // dispositivo ha già dati suoi mai sincronizzati, chiediamo una sola volta.
      if(!hasRealLocalContent()){
        S=remote;localStorage.setItem(KEY,JSON.stringify(S));
        try{localStorage.setItem(SYNCED_ONCE_KEY,"1");}catch(e2){}
        location.reload();return;
      }
      const useRemote=await dlgConfirm(tr("Questo dispositivo non si è mai sincronizzato con Drive. È già presente un backup del {d}.\n\nQuali dati tengo? Con quelli di Drive perdi ciò che esiste solo su questo dispositivo; tenendo quelli locali sovrascrivi il backup.",{d:new Date(remote.meta&&remote.meta.updated||f.modifiedTime).toLocaleString(dataLoc())}),
        {ok:tr("Uso quelli di Drive"),ko:tr("Tengo quelli locali")});
      try{localStorage.setItem(SYNCED_ONCE_KEY,"1");}catch(e2){}
      if(useRemote){S=remote;localStorage.setItem(KEY,JSON.stringify(S));location.reload();}
      else{await driveUpload();}
      return;
    }

    if(rT>lT+2000){ // il remoto è davvero più recente (modifica da un altro dispositivo): lo adotto in silenzio
      S=remote;localStorage.setItem(KEY,JSON.stringify(S));location.reload();
    }else if(lT>rT+2000){ // il locale è più recente: aggiorno Drive
      await driveUpload();
    } // altrimenti sono allineati: non faccio nulla
  }catch(e){ if(String(e&&e.message)==="auth"&&!driveReauthed){driveReauthed=true;driveSilentAuth();} }}

