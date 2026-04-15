// js/ai.js — Arcéane © CO-JAK
// Appels API OpenAI — modèle gpt-4.5-mini
// Clé saisie au premier usage, sauvegardée en localStorage

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
    document.getElementById('api-key-status').textContent = 'Aucune clé enregistrée';
    document.getElementById('api-key-status').className = 'key-status warn';
    document.getElementById('btn-clear-key').style.display = 'none';
  }

  function getKey() {
    // Priorité : window.ARCEANE_CONFIG > localStorage
    const fromConfig = window.ARCEANE_CONFIG?.openai_api_key;
    if (fromConfig && !fromConfig.startsWith('sk-VOTRE')) return fromConfig;
    return getSavedKey();
  }

  // Affiche la modale de saisie de clé et résout avec la clé saisie
  function promptForKey() {
    return new Promise((resolve, reject) => {
      const modal = document.getElementById('key-modal');
      modal.classList.add('open');
      document.getElementById('key-input').value = '';
      document.getElementById('key-error').textContent = '';
      document.getElementById('key-input').focus();

      const onConfirm = () => {
        const val = document.getElementById('key-input').value.trim();
        if (!val.startsWith('sk-') || val.length < 20) {
          document.getElementById('key-error').textContent = 'Clé invalide — elle doit commencer par "sk-"';
          return;
        }
        saveKey(val);
        refreshKeyStatus();
        modal.classList.remove('open');
        cleanup();
        resolve(val);
      };

      const onCancel = () => {
        modal.classList.remove('open');
        cleanup();
        reject(new Error('Clé API non renseignée. L\'analyse IA ne peut pas démarrer.'));
      };

      document.getElementById('btn-key-confirm').onclick = onConfirm;
      document.getElementById('btn-key-cancel').onclick = onCancel;
      document.getElementById('key-input').onkeydown = e => { if (e.key === 'Enter') onConfirm(); if (e.key === 'Escape') onCancel(); };

      function cleanup() {
        document.getElementById('btn-key-confirm').onclick = null;
        document.getElementById('btn-key-cancel').onclick = null;
        document.getElementById('key-input').onkeydown = null;
      }
    });
  }

  function refreshKeyStatus() {
    const k = getSavedKey();
    const statusEl = document.getElementById('api-key-status');
    const clearBtn = document.getElementById('btn-clear-key');
    if (!statusEl) return;
    if (k) {
      statusEl.textContent = 'Clé enregistrée : sk-…' + k.slice(-6);
      statusEl.className = 'key-status ok';
      if (clearBtn) clearBtn.style.display = '';
    } else {
      statusEl.textContent = 'Aucune clé enregistrée';
      statusEl.className = 'key-status warn';
      if (clearBtn) clearBtn.style.display = 'none';
    }
  }

  // ── Appel API ────────────────────────────────────────────────────────────
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
      throw new Error('Clé API invalide ou expirée. Veuillez en saisir une nouvelle.');
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
  "rep1_risque": "",
  "rep1_vie": "",
  "rep2_nom": "",
  "rep2_profil": "",
  "rep2_apport": ""
}
Pour motivations : "Croissance CA","Acquisition compétences","Intégration verticale","Diversification","Consolidation","Effet de levier","Indépendance","Transmission familiale","Reconversion","Investissement patrimonial".
Pour rep1_traits : liste parmi Entrepreneur,Stratège,Bâtisseur,Négociateur,Opérationnel,Analytique,Leader naturel,Persévérant,Créateur de valeur,Orienté résultats,Fédérateur d'équipe,Visionnaire.
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
