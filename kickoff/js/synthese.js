// js/synthese.js — Arcéane © CO-JAK

const Synthese = (() => {

  async function build() {
    const nom = document.getElementById('acq-nom')?.value || 'l\'acquéreur';
    const proj = document.getElementById('acq-projet')?.value || 'projet d\'acquisition';
    const sect = document.getElementById('cib-sect')?.value || '';
    const zone = document.getElementById('cib-zone')?.value || '';
    const caMin = document.getElementById('cib-ca-min')?.value || '';
    const caMax = document.getElementById('cib-ca-max')?.value || '';
    const tri = document.getElementById('v-tri')?.textContent || '15';
    const horizon = document.getElementById('v-horizon')?.textContent || '5';
    const ebitda = document.getElementById('v-ebitda')?.textContent || '10';
    const mult = document.getElementById('v-mult')?.textContent || '6';
    const apport = parseFloat(document.getElementById('fin-apport')?.value) || 0;
    const total = apport * App.state.levMult;
    const delaiBtn = document.querySelector('[data-group="delai"].sel');

    // Métriques
    document.getElementById('syn-tri').textContent = tri + '%';
    document.getElementById('syn-horizon').textContent = horizon + ' ans';

    // Tags
    let tags = '';
    if (sect) tags += `<span class="tag tag-s">${sect}</span>`;
    if (zone) tags += `<span class="tag tag-g">${zone}</span>`;
    const effBtn = document.querySelector('[data-group="eff"].sel');
    if (effBtn) tags += `<span class="tag tag-sz">${effBtn.textContent.trim()} sal.</span>`;
    if (tags) document.getElementById('syn-tags').innerHTML = tags;

    // Détail cible
    const det = [];
    if (caMin || caMax) det.push(`CA : ${caMin||'?'} – ${caMax||'?'} M€`);
    det.push(`EBITDA min. : ${ebitda}%`);
    det.push(`Multiple max : ×${mult}`);
    document.getElementById('syn-cib-detail').textContent = det.join('  ·  ');

    // Top motivations
    const sliders = [
      { l: 'Croissance CA', id: 'v-ca' },
      { l: 'Acquisition compétences', id: 'v-comp' },
      { l: 'Intégration verticale', id: 'v-integ' },
      { l: 'Diversification', id: 'v-div' },
      { l: 'Consolidation', id: 'v-conso' },
      { l: 'Effet de levier', id: 'v-lev' }
    ];
    const ranked = sliders
      .map(s => ({ l: s.l, v: parseInt(document.getElementById(s.id)?.textContent || 0) }))
      .sort((a, b) => b.v - a.v);
    document.getElementById('syn-mots').innerHTML = ranked.slice(0, 3).map((it, i) =>
      `<li class="ci"><span class="cr">${i+1}</span><span class="ct">${it.l}</span><span class="cw">${it.v}/10</span></li>`
    ).join('');

    // Personnalité synthétisée
    const aspir = document.getElementById('per-aspirations')?.value || '';
    const savoir = document.getElementById('per-savoir-faire')?.value || '';
    const rejets = document.getElementById('per-rejets')?.value || '';
    const ambit = document.getElementById('per-ambitions')?.value || '';
    const perLines = [aspir, savoir, rejets, ambit].filter(Boolean);
    const perSummary = document.getElementById('syn-per');
    if (perSummary) {
      perSummary.textContent = perLines.length
        ? perLines.join(' · ')
        : 'Module personnalité non renseigné.';
    }

    // Texte IA
    const synText = document.getElementById('syn-text');
    synText.textContent = 'Génération de la synthèse narrative en cours…';
    try {
      const narrative = await AI.generateSynthese({
        nom, projet: proj, secteur: document.getElementById('acq-secteur')?.value,
        secteurs_cibles: sect, zone, ca_range: `${caMin}–${caMax}`,
        enveloppe: total > 0 ? Math.round(total) : 'N/A',
        levier: App.state.levMult, tri, horizon: horizon + ' ans',
        top_motivations: ranked.slice(0, 3).map(r => r.l).join(', '),
        personnalite: perLines.join(' | '),
        delai: delaiBtn?.textContent || ''
      });
      synText.textContent = narrative;
    } catch (err) {
      synText.textContent = `Synthèse narrative non disponible (${err.message}). Configurez la clé API dans config.js.`;
    }

    App.state.tabDone[5] = true;
    App.updateProgress();
  }

  return { build };
})();
