// js/ai.js — Arcéane © CO-JAK
// Appels API OpenAI — modèle gpt-4.5-mini
// Clé saisie via panneau inline, sauvegardée en localStorage

const AI = (() => {

  const MODEL = 'gpt-4.5-mini';
  const LS_KEY = 'arceane_openai_key';

  // ── Gestion de la clé ────────────────────────────────────────────────────
  function getSavedKey() {
    try { return localStorage.getItem(LS_KEY) || ''; } catch { return ''; }
  }

  function saveKey(k) {
    try { localStorage.setItem(LS_KEY, k); } catch {}
  }

  function clearKey() {
    try { localStorage.removeItem(LS_KEY); } catch {}
    refreshKeyStatus();
  }

  function getKey() {
    const fromConfig = window.ARCEANE_CONFIG?.openai_api_key;
    if (fromConfig && !fromConfig.startsWith('sk-VOTRE')) return fromConfig;
    return getSavedKey();
  }

  function refreshKeyStatus() {
    const k = getSavedKey();
    const statusEl = document.getElementById('api-key-status');
    const clearBtn = document.getElementById('btn-clear-key');
    if (!statusEl) return;
    if (k) {
      statusEl.textContent = 'Clé : sk-…' + k.slice(-6);
      statusEl.className = 'key-status ok';
      if (clearBtn) clearBtn.style.display = '';
    } else {
      statusEl.textContent = 'Aucune clé enregistrée';
      statusEl.className = 'key-status warn';
      if (clearBtn) clearBtn.style.display = 'none';
    }
  }

  // Ouvre le panneau inline et attend que l'utilisateur enregistre sa clé
  function promptForKey() {
    return new Promise((resolve, reject) => {
      // Ouvrir le panneau de config
      const panel = document.getElementById('key-panel');
      if (panel) panel.classList.add('open');
      const input = document.getElementById('key-input');
      if (input) { input.value = ''; setTimeout(() => input.focus(), 80); }
      const errEl = document.getElementById('key-error');
      if (errEl) errEl.textContent = 'Une clé API est requise pour cette action.';

      // Stocker le resolve pour que confirmKey() le déclenche
      window._keyResolve = (val) => resolve(val);
      window._keyReject = () => reject(new Error('Clé API non renseignée.'));
    });
  }

  // ── Appel API ─────────────────────────────────────────────────────────────
  async function call(messages, maxTokens) {
    let key = getKey();
    if (!key) key = await promptForKey();

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens || 1500,
        temperature: 0.2,
        messages
      })
    });

    if (resp.status === 401) {
      clearKey();
      // Invalide : rouvrir le panneau
      key = await promptForKey();
      throw new Error('Clé API invalide ou expirée. Veuillez saisir une nouvelle clé.');
    }
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erreur API ${resp.status}`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  }

  // ── Extraction structurée depuis une fiche de cadrage ────────────────────
  async function extractFiche(text) {
    const system = `Tu es un expert M&A et reprise d'entreprise. Extrais les informations d'une fiche de cadrage.
Réponds UNIQUEMENT en JSON valide, sans markdown, sans commentaires, sans explication.
Schéma exact :
{
  "nom": "",
  "type_acquereur": "individuel|societe|duo|",
  "secteur_acquereur": "",
  "localisation": "",
  "projet_intitule": "",
  "projet_genese": "",
  "budget_fonds_propres_k": "",
  "secteurs_cibles": "",
  "secteurs_exclus": "",
  "zone_geo": "",
  "ca_min_m": "",
  "ca_max_m": "",
  "contrainte_geo": "",
  "facteurs_bloquants": "",
  "motivations": [],
  "aspirations": "",
  "savoir_faire": "",
  "rejets": "",
  "ambitions": "",
  "rep1_traits": [],
  "rep2_nom": "",
  "rep2_profil": "",
  "rep2_apport": ""
}
Pour motivations : "Croissance CA","Acquisition compétences","Intégration verticale","Diversification","Consolidation","Effet de levier","Indépendance","Transmission familiale","Reconversion","Investissement patrimonial".
Laisse vide ("") les champs non trouvés. Ne devine pas.`;

    const content = await call([
      { role: 'system', content: system },
      { role: 'user', content: text.substring(0, 7000) }
    ], 1200);

    const clean = content.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  }

  // ── Génération synthèse narrative ────────────────────────────────────────
  async function generateSynthese(data) {
    const system = `Tu es un consultant M&A senior chez Arcéane. Rédige une fiche de mission synthétique, professionnelle et concise (280 mots max) à partir des données d'un atelier de cadrage. Ton sobre, précis, conseil. Pas de titres, pas de markdown, pas de bullet points. Texte en prose continu. Langue française.`;

    const userContent = `Données atelier :
Acquéreur : ${data.nom || 'N/A'} | Type : ${data.type || 'N/A'} | Secteur actuel : ${data.secteur || 'N/A'}
Projet : ${data.projet || 'N/A'}
Cibles : ${data.secteurs_cibles || 'N/A'} | Zone : ${data.zone || 'N/A'} | CA : ${data.ca_range || 'N/A'} M€
Enveloppe : ${data.enveloppe || 'N/A'} k€ | Levier : ×${data.levier || 'N/A'} | TRI : ${data.tri || 'N/A'}%
Top motivations : ${data.top_motivations || 'N/A'}
Personnalité : ${data.personnalite || 'non renseignée'}
Délai : ${data.delai || 'N/A'}`;

    return await call([
      { role: 'system', content: system },
      { role: 'user', content: userContent }
    ], 500);
  }

  return { call, extractFiche, generateSynthese, refreshKeyStatus, clearKey, getKey };
})();
