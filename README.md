# Arcéane — Kick-off Acquisition
**© CO-JAK — Tous droits réservés**

Application de gestion d'atelier de cadrage pour mission de recherche d'entreprise (repreneur individuel ou croissance externe).

## Installation

```bash
git clone <repo>
cd arceane
cp .env.example .env
# Renseignez votre clé API OpenAI dans .env
```

Ouvrez `index.html` dans un navigateur, ou servez avec :
```bash
npx serve .
# ou
python3 -m http.server 8080
```

## Configuration API

Copiez `.env.example` en `.env` et renseignez :
```
OPENAI_API_KEY=sk-...
```

> **Note** : L'app lit la clé depuis `config.js` (généré à partir de `.env`).  
> Pour une utilisation locale simple, éditez directement `config.js`.

## Structure

```
arceane/
├── index.html          # App principale
├── config.js           # Clé API (non commité)
├── config.example.js   # Template de config
├── css/
│   └── style.css       # Styles globaux
├── js/
│   ├── app.js          # Logique principale
│   ├── ai.js           # Appels API OpenAI
│   ├── modules/
│   │   ├── acquereur.js
│   │   ├── personnalite.js
│   │   ├── motivations.js
│   │   ├── cible.js
│   │   ├── financier.js
│   │   └── synthese.js
└── README.md
```

## Modules

1. **Acquéreur** — Identité, contexte, expérience
2. **Personnalité** — Profil psychologique, aspirations, savoir-faire, rejets (optionnel, 1 ou 2 repreneurs)
3. **Motivations 360°** — Leviers stratégiques et personnels, radar
4. **Cible idéale** — Secteurs, géographie, critères de sélection
5. **Capacités financières** — Enveloppe, levier, structure juridique
6. **Synthèse atelier** — Fiche de mission générée par IA

## Import de fiche

L'app accepte PDF, Word (.docx) et texte (.txt). L'IA extrait automatiquement les données et pré-remplit les modules. Tous les champs restent éditables.
