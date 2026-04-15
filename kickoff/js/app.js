// js/app.js — Arcéane © CO-JAK
// Logique principale : navigation, état, profil bar, progression, radar, calculs

const App = (() => {

  // ── État global ──────────────────────────────────────────────────────────
  const state = {
    currentTab: 0,
    tabDone: [false, false, false, false, false, false],
    levMult: 3,
    importedFields: {},
    repCount: 1  // 1 = solo, 2 = duo
  };

  // ── Navigation ───────────────────────────────────────────────────────────
  function goTab(n) {
    document.querySelector('.section.visible')?.classList.remove('visible');
    document.getElementById('tab-' + n)?.classList.add('visible');
    document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === n));
    state.currentTab = n;
    state.tabDone[n] = true;
    updateProgress();
    if (n === 5) Synthese.build();
  }

  function updateProgress() {
    const done = state.tabDone.filter(Boolean).length;
    const total = 6;
    document.getElementById('prog-label').textContent = done + ' / ' + total;
    document.getElementById('prog-fill').style.width = (done / total * 100) + '%';
    state.tabDone.forEach((d, i) => {
      const tab = document.querySelectorAll('.tab')[i];
      if (tab) {
        const badge = tab.querySelector('.tab-badge');
        if (badge) badge.style.background = d ? 'var(--green)' : '';
        tab.classList.toggle('done', d);
      }
    });
  }

  // ── Profile bar ──────────────────────────────────────────────────────────
  function syncProfileBar() {
    const nom = document.getElementById('acq-nom')?.value;
    const proj = document.getElementById('acq-projet')?.value;
    if (nom) document.getElementById('pb-nom').textContent = nom;
    if (proj) document.getElementById('pb-mission').textContent = proj;
  }

  function setType(val) {
    const el = document.getElementById('pb-type');
    const wrap = document.getElementById('pb-tw');
    const labels = { individuel: 'Repreneur individuel', societe: 'Société acquéreuse', duo: 'Duo de repreneurs' };
    const classes = { individuel: 'pill pill-ind', societe: 'pill pill-soc', duo: 'pill pill-duo' };
    el.textContent = labels[val] || '';
    el.className = classes[val] || 'pill';
    wrap.style.display = val ? '' : 'none';
    // Afficher/masquer co-repreneur dans le module personnalité
    state.repCount = val === 'duo' ? 2 : 1;
    const coPanel = document.getElementById('co-rep-section');
    if (coPanel) coPanel.style.display = val === 'duo' ? '' : 'none';
  }

  // ── Toggle helpers ───────────────────────────────────────────────────────
  function selUnique(btn, group) {
    document.querySelectorAll(`[data-group="${group}"]`).forEach(b => b.classList.remove('sel', 'imp'));
    btn.classList.add('sel');
  }

  function selType(btn, val) {
    selUnique(btn, 'type');
    setType(val);
  }

  function selLev(btn, val) {
    selUnique(btn, 'lev');
    const map = { x2: 2, x3: 3, x4: 4, x5: 5 };
    state.levMult = map[val] || 3;
    calcFin();
  }

  function toggleMulti(btn) { btn.classList.toggle('sel'); }

  // ── Sliders ──────────────────────────────────────────────────────────────
  function updateSlider(el, id) {
    const out = document.getElementById(id);
    if (out) out.textContent = el.value;
    if (id.startsWith('v-') && ['v-ca','v-comp','v-integ','v-div','v-conso','v-lev'].includes(id)) {
      drawRadar();
    }
  }

  // ── Radar ────────────────────────────────────────────────────────────────
  function drawRadar() {
    const canvas = document.getElementById('radarCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 200, H = 200, cx = 100, cy = 100, r = 72;
    const ids = ['v-ca', 'v-comp', 'v-integ', 'v-div', 'v-conso', 'v-lev'];
    const labels = ['CA', 'Compétences', 'Intégration', 'Diversif.', 'Conso.', 'Levier'];
    const vals = ids.map(id => parseFloat(document.getElementById(id)?.textContent || 0) / 10);
    const n = vals.length;
    ctx.clearRect(0, 0, W, H);
    // Grille
    for (let ring = 1; ring <= 5; ring++) {
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 / n) * i - Math.PI / 2;
        const rr = r * (ring / 5);
        i === 0 ? ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)
                : ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    // Axes + labels
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 / n) * i - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.fillStyle = '#5a5a6a';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[i], cx + Math.cos(a) * (r + 16), cy + Math.sin(a) * (r + 16));
    }
    // Aire
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 / n) * i - Math.PI / 2;
      const x = cx + Math.cos(a) * r * vals[i];
      const y = cy + Math.sin(a) * r * vals[i];
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(200,168,75,0.15)';
    ctx.fill();
    ctx.strokeStyle = '#c8a84b';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Points
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 / n) * i - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r * vals[i], cy + Math.sin(a) * r * vals[i], 3, 0, Math.PI * 2);
      ctx.fillStyle = '#c8a84b';
      ctx.fill();
    }
  }

  // ── Calcul financier ─────────────────────────────────────────────────────
  function calcFin() {
    const apport = parseFloat(document.getElementById('fin-apport')?.value) || 0;
    const dette = apport * (state.levMult - 1);
    const total = apport + dette;
    const fmt = v => v > 0 ? Math.round(v).toLocaleString('fr-FR') : '—';
    document.getElementById('fin-fp').textContent = fmt(apport);
    document.getElementById('fin-dette').textContent = fmt(dette);
    document.getElementById('fin-total').textContent = fmt(total);
    document.getElementById('syn-env').textContent = total > 0 ? Math.round(total).toLocaleString('fr-FR') + ' k€' : '—';
    const al = document.getElementById('fin-alert');
    if (apport > 0) {
      al.className = 'alert a-ok';
      al.textContent = `Enveloppe calculée avec un levier ×${state.levMult}. Indicatif — à affiner avec votre banquier d'affaires.`;
    } else {
      al.className = 'alert a-info';
      al.textContent = 'Renseignez l\'apport en fonds propres pour calculer l\'enveloppe.';
    }
  }

  // ── Import file ──────────────────────────────────────────────────────────
  function onDrag(e, over) {
    e.preventDefault();
    document.getElementById('drop-zone')?.classList.toggle('drag', over);
  }

  function onDrop(e) {
    e.preventDefault();
    onDrag(e, false);
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  }

  function handleFile(file) {
    if (!file) return;
    document.getElementById('drop-zone')?.classList.remove('drag');
    const status = document.getElementById('import-status');
    status.className = 'import-status show is-loading';
    status.innerHTML = '<div class="is-spinner"></div><span>Analyse de la fiche en cours…</span>';

    const reader = new FileReader();
    reader.onload = e => Import.processText(e.target.result || '', file.name);
    reader.onerror = () => Import.showError('Impossible de lire le fichier.');
    reader.readAsText(file);
  }

  // ── Expose ───────────────────────────────────────────────────────────────
  return {
    state, goTab, updateProgress, syncProfileBar, setType,
    selUnique, selType, selLev, toggleMulti, updateSlider,
    drawRadar, calcFin, onDrag, onDrop, handleFile
  };
})();
