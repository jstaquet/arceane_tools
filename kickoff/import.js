// js/import.js — Arcéane © CO-JAK
// Module d'import et de remplissage des champs

const Import = (() => {

  function showError(msg) {
    const st = document.getElementById('import-status');
    st.className = 'import-status show is-err';
    st.innerHTML = `<div class="is-dot"></div><span>${msg}</span>`;
  }

  async function processText(text, filename) {
    try {
      const extracted = await AI.extractFiche(text);
      applyExtracted(extracted, filename);
    } catch (err) {
      showError('Erreur d\'analyse IA : ' + err.message);
    }
  }

  function setField(id, val, badgeId) {
    if (!val) return false;
    const el = document.getElementById(id);
    if (!el) return false;
    el.value = val;
    el.classList.add('imported');
    const badge = document.getElementById(badgeId);
    if (badge) badge.style.display = '';
    if (id === 'acq-nom' || id === 'acq-projet') App.syncProfileBar();
    if (id === 'fin-apport') App.calcFin();
    return true;
  }

  function applyExtracted(d, filename) {
    const chips = [];
    let count = 0;

    const fields = [
      ['acq-nom', d.nom, 'b-nom', 'Nom / Raison sociale'],
      ['acq-secteur', d.secteur_acquereur, 'b-secteur', 'Secteur acquéreur'],
      ['acq-loc', d.localisation, 'b-loc', 'Localisation'],
      ['acq-projet', d.projet_intitule, 'b-projet', 'Intitulé projet'],
      ['acq-genese', d.projet_genese, 'b-genese', 'Genèse projet'],
      ['mot-geo', d.contrainte_geo, 'b-geo', 'Contrainte géo'],
      ['mot-bloquants', d.facteurs_bloquants, 'b-bloquants', 'Facteurs bloquants'],
      ['cib-sect', d.secteurs_cibles, 'b-cibsect', 'Secteurs cibles'],
      ['cib-excl', d.secteurs_exclus, 'b-cibexcl', 'Secteurs exclus'],
      ['cib-zone', d.zone_geo, 'b-cibzone', 'Zone géographique'],
      ['cib-ca-min', d.ca_min_m, 'b-camin', 'CA min (M€)'],
      ['cib-ca-max', d.ca_max_m, 'b-camax', 'CA max (M€)'],
      ['fin-apport', d.budget_fonds_propres_k, 'b-apport', 'Fonds propres (k€)'],
      // Personnalité
      ['per-aspirations', d.aspirations, 'b-aspirations', 'Aspirations'],
      ['per-savoir-faire', d.savoir_faire, 'b-savoirfaire', 'Savoir-faire'],
      ['per-rejets', d.rejets, 'b-rejets', 'Rejets'],
      ['per-ambitions', d.ambitions, 'b-ambitions', 'Ambitions'],
      ['co-nom', d.co_repreneur_nom, 'b-conom', 'Co-repreneur'],
      ['co-profil', d.co_repreneur_profil, 'b-coprofil', 'Profil co-repreneur'],
    ];

    fields.forEach(([id, val, badge, label]) => {
      if (setField(id, val, badge)) { count++; chips.push({ field: label, val: String(val) }); }
    });

    // Type acquéreur
    if (d.type_acquereur) {
      document.querySelectorAll('[data-group="type"]').forEach(b => b.classList.remove('sel', 'imp'));
      document.querySelectorAll('[data-group="type"]').forEach(b => {
        const t = b.getAttribute('data-val') || '';
        if (t === d.type_acquereur) {
          b.classList.add('imp');
          App.setType(d.type_acquereur);
          count++;
          chips.push({ field: 'Type acquéreur', val: b.textContent.trim() });
        }
      });
    }

    // Motivations
    if (d.motivations?.length) {
      d.motivations.forEach(mot => {
        document.querySelectorAll('[data-mot]').forEach(b => {
          if (b.getAttribute('data-mot').toLowerCase().includes(mot.toLowerCase().substring(0, 8))) {
            b.classList.add('imp');
          }
        });
      });
      chips.push({ field: 'Motivations', val: d.motivations.join(', ') });
    }

    App.state.importedFields = d;

    // Status
    const st = document.getElementById('import-status');
    if (count > 0) {
      st.className = 'import-status show is-ok';
      st.innerHTML = `<div class="is-dot"></div><strong>${count} informations importées</strong>&nbsp;depuis "${filename}" — tous les champs restent éditables.`;
      const iz = document.getElementById('drop-zone');
      iz.classList.add('loaded');
      document.getElementById('iz-title').textContent = filename + ' — importé avec succès';
      document.getElementById('iz-sub').textContent = count + ' champs pré-remplis · Cliquez pour remplacer';
      // Mapping chips
      const mapEl = document.getElementById('import-mapping');
      mapEl.classList.add('show');
      document.getElementById('map-count').textContent = count + ' champs importés';
      document.getElementById('mapping-chips').innerHTML = chips.map(c =>
        `<div class="m-chip"><div class="m-chip-dot"></div><span class="m-chip-field">${c.field}</span><span class="m-chip-val" title="${c.val}">${c.val}</span></div>`
      ).join('');
    } else {
      showError('Aucune donnée exploitable trouvée. Renseignez les modules manuellement.');
    }
  }

  function reset() {
    document.querySelectorAll('.imported').forEach(el => el.classList.remove('imported'));
    document.querySelectorAll('[class*="b-"]').forEach(el => { if (el.classList.contains('imported-tag')) el.style.display = 'none'; });
    document.querySelectorAll('.imp').forEach(el => el.classList.remove('imp'));
    document.getElementById('import-status').className = 'import-status';
    document.getElementById('import-mapping').classList.remove('show');
    const iz = document.getElementById('drop-zone');
    iz.classList.remove('loaded', 'drag');
    document.getElementById('iz-title').textContent = 'Importer une fiche de cadrage existante';
    document.getElementById('iz-sub').textContent = 'Glissez-déposez ou cliquez — les données pré-rempliront les modules';
    App.state.importedFields = {};
  }

  return { processText, showError, applyExtracted, reset };
})();
