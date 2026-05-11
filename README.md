# Modelo Office - Generateur de synthese SEO / SEA

## Prerequis

- Node.js 18+
- Une cle API Gemini

## Installation

1. Copier `.env.example` vers `.env`
2. Renseigner `GEMINI_API_KEY`
3. Installer les dependances :

```bash
npm install
```

4. Lancer le projet :

```bash
npm start
```

5. Ouvrir [http://localhost:3000](http://localhost:3000)

## Variables d'environnement

- `GEMINI_API_KEY` : obligatoire
- `GEMINI_MODEL` : optionnel, par defaut `gemini-2.5-flash-lite`
- `PORT` : optionnel, par defaut `3000`
- `HOST` : optionnel, par defaut `127.0.0.1`

## Fonctionnement

- Le frontend envoie le formulaire et le rapport principal au backend.
- Le backend transmet le PDF et les consignes metier au modele Gemini.
- Le modele renvoie une synthese complete qui s'affiche dans l'aperçu.

## Element encore necessaire

Il me faut uniquement ta cle API Gemini pour que la generation reelle fonctionne.
