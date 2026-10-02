# NUESTRO - Générateur de synthèses SEO / SEA

NUESTRO génère des synthèses client SEO et SEA à partir de rapports PDF / Looker Studio,
à l'aide de Gemini. La synthèse peut être modifiée manuellement avant l'export PDF.

## Prérequis

- Node.js 24.x
- npm 11.x
- Une clé API Gemini

## Installation locale

1. Copier `.env.example` vers `.env`
2. Renseigner `GEMINI_API_KEY` dans `.env` (ce fichier ne doit jamais être commité)
3. Installer les dépendances :

```bash
npm install
```

4. Lancer le projet :

```bash
npm start
```

Pour relancer automatiquement le serveur à chaque modification : `npm run dev`.

5. Ouvrir [http://localhost:3000](http://localhost:3000)

## Variables d'environnement

- `GEMINI_API_KEY` : obligatoire
- `GEMINI_MODEL` : optionnel, par défaut `gemini-2.5-flash` (repli automatique sur `gemini-2.5-flash-lite` si le service est saturé)
- `PORT` : optionnel, par défaut `3000` (défini automatiquement par Render en production)

Le serveur écoute toujours sur `0.0.0.0`, ce qui est requis par Render.

## Fonctionnement

- Le frontend envoie le formulaire et le rapport principal au backend.
- Les fichiers sont traités en mémoire et ne sont pas enregistrés sur le serveur.
- Le backend transmet le PDF et les consignes métier au modèle Gemini.
- En cas d'indisponibilité temporaire de Gemini (503), le backend réessaie automatiquement.
- Le modèle renvoie une synthèse complète qui s'affiche dans l'aperçu, modifiable avant l'export PDF.

## Déploiement

L'application est déployée sur Render (Web Service). Chaque push sur la branche `main`
déclenche un déploiement automatique.
