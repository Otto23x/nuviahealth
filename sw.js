/* Service worker Nuvia — cache versionata dell'app shell.
   La versione segue l'impronta della build: ogni consegna nuova invalida
   la cache vecchia da sola, niente utenti bloccati su versioni passate. */
const VERSIONE="nuvia-7b55cb20a902";
const SHELL=["index.html", "stili.css", "manifest.webmanifest", "assets/icona-192.png", "assets/icona-512.png", "assets/marchio.svg", "assets/marchio-esteso.svg", "assets/font/fraunces-600.woff2", "assets/font/inter-400.woff2", "assets/font/inter-600.woff2", "assets/esercizi/anca_avanti.svg", "assets/esercizi/aperto_chiuso.svg", "assets/esercizi/avambraccio_giu.svg", "assets/esercizi/avambraccio_su.svg", "assets/esercizi/bacino_su.svg", "assets/esercizi/braccia_cerchio.svg", "assets/esercizi/braccia_indietro.svg", "assets/esercizi/braccia_lato.svg", "assets/esercizi/braccia_viso.svg", "assets/esercizi/busto_ruota.svg", "assets/esercizi/busto_seduto.svg", "assets/esercizi/cammina.svg", "assets/esercizi/crunch_su.svg", "assets/esercizi/diagonale.svg", "assets/esercizi/diagonale_supino.svg", "assets/esercizi/gambe_avanti.svg", "assets/esercizi/gambe_giu.svg", "assets/esercizi/ginocchia_avanti.svg", "assets/esercizi/ginocchia_petto.svg", "assets/esercizi/ginocchia_strette.svg", "assets/esercizi/lato_tieni.svg", "assets/esercizi/linea_tieni.svg", "assets/esercizi/panca_su.svg", "assets/esercizi/petto_apre.svg", "assets/esercizi/punte_su.svg", "assets/esercizi/schiena_arco.svg", "assets/esercizi/spalla_incrociata.svg", "assets/esercizi/spalle_su.svg", "assets/esercizi/tallone_calcio.svg", "assets/esercizi/tallone_dietro.svg", "js/07_alimenti.js", "js/10_base.js", "js/09_guardrail.js", "js/11_2_stato_persistenza_tema.js", "js/12_3_data_visualizzata_scorrimento_gi.js", "js/13_4_motore_calorico_e_biometrico.js", "js/14_5_streak_giorni_in_target_consecut.js", "js/15_6_ai_gemini_chiave_utente__con_fal.js", "js/57_uso.js", "js/56_schede.js", "js/59_mia.js", "js/59_ordine.js", "js/60_partner.js", "js/62_orari.js", "js/61_gesti.js", "js/63_preparazioni.js", "js/63_progressi_invito.js", "js/64_inviti.js", "js/16_7_navigazione.js", "js/17_8_card_pasto_spunta_3_stati_sposta.js", "js/18_9_pagina_piano.js", "js/19_12_pagina_spesa_lista_automatica_d.js", "js/20_12b_sorgente_attivita.js", "js/20_13_pagina_sport.js", "js/21_14_storico_recap_salvataggio_con_a.js", "js/22_15_pagina_io_profilo_biometriche_a.js", "js/23_16_google_drive_sync_gsi__drive_re.js", "js/26_arco_e_marchio.js", "js/58_conferme.js", "js/64_primo_avvio.js", "js/65_ruota.js", "js/65_costellazione.js", "js/66_correzioni.js", "js/25_onboarding_flow.js", "js/27_pasto_libero.js", "js/28_gioco_e_peso.js", "js/29_allenamenti_ibridi.js", "js/30_conto.js", "js/31_piani.js", "js/32_consensi.js", "js/33_cobrand.js", "js/34_dispensa_e_budget.js", "js/35_prescrizione.js", "js/36_telefono.js", "js/24_17_avvio_header_tema_streak_prompt.js", "js/37_barcode_e_piatti.js", "js/38_telemetria.js", "js/39_dieta_studio.js", "js/40_segnalazioni.js", "js/41_cucina_guidata.js", "js/42_notifiche_gentili.js", "js/43_ciclo_v2.js", "js/44_momento_fragile.js", "js/45_patto.js", "js/46_duo.js", "js/47_insieme.js", "js/48_studio_messaggi.js", "js/49_nativo.js", "js/50_turni.js", "js/51_film.js", "js/52_rientro.js", "js/53_bicchieri.js", "js/54_scelte.js", "js/55_icone_cose.js"];
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(VERSIONE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(
    ks.filter(k=>k!==VERSIONE).map(k=>caches.delete(k))
  )).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request).then(risp=>{
      /* le risorse nuove (assets futuri) entrano in cache al primo uso */
      if(risp.ok&&new URL(e.request.url).origin===location.origin){
        const copia=risp.clone();
        caches.open(VERSIONE).then(c=>c.put(e.request,copia));
      }
      return risp;
    }).catch(()=>caches.match("index.html")))
  );
});
