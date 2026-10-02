import "dotenv/config";
import express from "express";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024
  }
});

const port = Number(process.env.PORT || 3000);
const host = "0.0.0.0";
const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const fallbackModel = "gemini-2.5-flash-lite";
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey && apiKey !== "your_gemini_api_key_here" ? new GoogleGenAI({ apiKey }) : null;
const geminiBusyMessage =
  "Le service Gemini est temporairement saturé. Merci de réessayer dans quelques minutes.";
const missingApiKeyMessage =
  "Le service de génération n'est pas configuré. Merci de contacter l'administrateur de la plateforme.";

// Formats réellement exploitables par Gemini : le PDF est envoyé comme document,
// le CSV et le TXT sont envoyés comme texte.
const supportedFileTypes = {
  ".pdf": "pdf",
  ".csv": "text",
  ".txt": "text"
};
const supportedFormatsLabel = "PDF, CSV ou TXT";

// Exposer uniquement l'interface et les assets, jamais le reste du dépôt.
app.get(["/", "/index.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use(express.json());

function buildPrompt(fields) {
  const seoActive = Boolean(fields.seoPack);
  const seaActive = Boolean(fields.seaPack);

  const clientName = fields.clientName?.trim() || "Client non renseigné";
  const analysisPeriod = fields.analysisPeriod?.trim() || "Période non renseignée";
  const startDate = fields.startDate?.trim() || "Non renseignée";
  const endDate = fields.endDate?.trim() || "Non renseignée";
  const reportType = fields.reportType?.trim() || "Rapport non renseigné";

  // Le vocabulaire du rapport s'adapte au type de rapport (trimestriel ou semestriel).
  const isQuarterly = reportType.toLowerCase() === "trimestriel";
  const periodNoun = isQuarterly ? "trimestre" : "semestre";
  const reportAdjective = isQuarterly ? "trimestriel" : "semestriel";
  const comparisonTitle = `Comparaison inter${periodNoun}`;

  const seoPack = fields.seoPack?.trim() || "Non renseigné";
  const seoActions = fields.seoActions?.trim() || "Aucune action SEO détaillée n'a été fournie.";
  const keywordTable = fields.keywordTable?.trim() || "Aucun mot-clé n'a été fourni.";
  const seoComment = fields.seoComment?.trim() || "Aucun commentaire SEO complémentaire.";
  const seaPack = fields.seaPack?.trim() || "Non renseigné";
  const seaComment = fields.seaComment?.trim() || "Aucun commentaire SEA complémentaire.";
  const seaActions = Array.isArray(fields.seaActions)
    ? fields.seaActions.join("\n- ")
    : fields.seaActions?.trim() || "Aucune action SEA fournie.";

  // Le pack affiché dans le prompt correspond au pack réellement sélectionné.
  const packContext = seoActive ? `du Pack ${seoPack}` : "de notre accompagnement";
  const reportLabel = seoActive
    ? `rapport ${reportAdjective} Pack ${seoPack}`
    : `rapport ${reportAdjective}`;

  // La trame mensuelle sur 6 mois ne correspond qu'au Pack Essentiel semestriel.
  const monthlyTemplate =
    seoPack === "Essentiel" && !isQuarterly
      ? `Quand les informations sont disponibles ou déductibles à partir du formulaire, respecte cette logique :
• Mois 1 – Publication d'un article
• Mois 2 – Optimisations techniques standards
• Mois 3 – Backlink : Création d'un backlink
• Mois 4 – Création d'une page SEO
• Mois 5 – Optimisations techniques complémentaires
• Mois 6 – Backlink externe + publication vidéo`
      : "";

  const conclusionNumber = seaActive ? 10 : 9;

  const seaSection = `
9. Bilan SEA
Titre cette section exactement :
"9. Bilan SEA"

Commence par une formulation proche de :
"Sur la période analysée, les campagnes Google Ads ont enregistré :"

Présente ensuite sous forme de puces simples uniquement les indicateurs réellement disponibles dans le rapport :
• Impressions
• Clics
• CTR
• Coût total
• CPC moyen
• Conversions
• Taux de conversion
• Coût par conversion
Respecte exactement la nature des indicateurs présents dans le document et n'invente aucune valeur.
Tu peux t'appuyer sur les actions SEA et le commentaire SEA fournis par le formulaire pour contextualiser l'analyse, sans les présenter comme des résultats chiffrés.

Ajoute ensuite un bloc :
➤ Interprétation :
L'interprétation ne doit pas simplement répéter les chiffres.
Analyse, uniquement lorsque les données sont disponibles :

1) Visibilité et attractivité
- impressions
- clics
- CTR
- capacité des campagnes à générer du trafic

2) Coût et efficacité
- coût total
- CPC moyen
- conversions
- taux de conversion
- coût par conversion
Ne qualifie pas automatiquement un coût, un CPC ou un CTR de bon ou mauvais sans contexte fiable.

3) Performance par campagne
Si plusieurs campagnes existent, compare-les.
Analyse notamment : impressions, clics, CPC moyen, conversions, taux de conversion, coût par conversion.
Identifie clairement :
- les campagnes qui génèrent les conversions ;
- les campagnes qui génèrent du trafic mais pas encore de conversion ;
- les différences de performance importantes.

4) Nature des conversions
Si les types de conversion sont disponibles, distingue par exemple :
- appels depuis les annonces ;
- demandes d'estimation ;
- clics sur un numéro de téléphone ;
- formulaires ;
- autres contacts.
Explique ce que cela révèle sur l'intention des internautes.

5) Termes de recherche
Si les données sont disponibles, sélectionne uniquement les termes les plus utiles.
Analyse notamment :
- les requêtes générant des clics ;
- leur CTR ;
- leur CPC ;
- les requêtes géolocalisées ;
- les intentions fortes comme achat, vente ou estimation.
Ne reproduis pas toute la liste.

6) Audiences et zones
Si disponibles, analyse :
- les principales villes ;
- les appareils ;
- les données démographiques uniquement lorsqu'elles apportent une information utile.
Pour une agence immobilière locale, vérifie si la diffusion géographique est cohérente avec sa zone d'activité.
Si le mobile représente une part très importante des clics, explique ce que cela implique pour la transformation des visites en contacts.

N'utilise pas les numéros 1) à 6) comme titres dans le rapport : rédige l'interprétation en paragraphes courts et fluides, en ne traitant que les points pour lesquels des données existent.

Termine obligatoirement par un bloc :
➤ Lecture :
Rédige entre 3 et 5 phrases maximum qui expliquent :
- si les campagnes génèrent de la visibilité ;
- si elles génèrent des contacts ou conversions ;
- quelle campagne est actuellement la plus efficace ;
- si une campagne génère du trafic sans convertir ;
- si les recherches et zones touchées sont cohérentes avec l'activité de l'agence.
Le ton doit être professionnel, pédagogique, factuel et accessible à un client non expert.

Ajoute ensuite un bloc :
➤ Actions SEA à venir :
Commence par :
"Voici les actions SEA que notre équipe mettra en place au cours des prochains mois :"
Propose 2 ou 3 actions maximum, sous forme de puces, directement liées aux constats du rapport.
Ces actions sont réalisées par notre équipe.
Ne jamais écrire "vous devriez", "nous vous recommandons de" ou toute formulation laissant penser que le client doit réaliser lui-même ces optimisations.
`;

  return `
RÔLE
Tu es un expert SEO${seaActive ? " et SEA" : ""} et analyste digital.
Tu rédiges un rapport ${reportAdjective} automatisé destiné à être lu à l'oral par un chef de projet non expert.
Tu travailles sur un dossier immobilier local dans le cadre ${packContext}.
Le rendu attendu est un rapport client structuré, fluide, professionnel et directement présentable.

LANGUE DE SORTIE
- Rédige l'intégralité du rapport en français.
- Utilise un français professionnel, naturel et correct, avec tous les accents.
- N'utilise aucune autre langue dans le rapport final, sauf pour les noms propres, marques, URLs, noms de campagnes, mots-clés ou données provenant directement des documents.
- Corrige naturellement les formulations lorsque nécessaire, sans modifier le sens des données sources.

CONTEXTE DU DOSSIER
- Nom du client : ${clientName}
- Période analysée : ${analysisPeriod}
- Date de début : ${startDate}
- Date de fin : ${endDate}
- Type de rapport : ${reportType}
- Pack SEO : ${seoActive ? seoPack : "Non actif"}
${seaActive ? `- Pack SEA : ${seaPack}\n` : ""}
INFORMATIONS FORMULAIRE À UTILISER EN COMPLÉMENT DU PDF
- Actions SEO fournies :
${seoActions}

- Mots-clés fournis :
${keywordTable}

- Commentaire SEO :
${seoComment}

${seaActive ? `- Actions SEA fournies :
- ${seaActions}

- Commentaire SEA :
${seaComment}` : ""}

OBJECTIF
Tu dois produire un rapport client immobilier très proche d'un rendu métier humain.
Le résultat ne doit pas ressembler à une réponse d'IA ni à une simple synthèse analytique.
Le style attendu est celui d'un ${reportLabel}, prêt à être lu à l'oral.

PRIORITÉS
1. Exactitude des données issues du PDF
2. Respect strict de la structure éditoriale demandée
3. Fidélité au ton métier attendu
4. Clarté pédagogique pour un interlocuteur non expert

RÈGLES ABSOLUES
- Rédige tout le rapport en français, y compris les titres et les blocs commençant par "➤".
- Analyse d'abord le ou les documents joints et base-toi sur leurs données réelles.
- N'invente aucun chiffre, aucune évolution, aucune position, aucune comparaison.
- Ne confonds jamais sessions, clics, utilisateurs, impressions, conversions et événements.
- Les champs du formulaire servent uniquement à compléter le contexte et les actions menées.
- Le PDF fournit les données de performance.
- Le formulaire complète les actions SEO, les commentaires et les informations métier.
- La structure du rapport est imposée : elle ne doit pas être modifiée.
- Le style attendu est imposé : il doit se rapprocher d'un ${reportLabel} destiné à un client immobilier.
- N'écris jamais une introduction générique du type :
  "Voici la synthèse des performances..."
  "Voici le rapport..."
  "Ci-dessous..."
- N'écris jamais une conclusion trop neutre ou administrative.
- N'utilise pas un ton de résumé automatique.
- N'utilise pas de méta-commentaire sur ta méthode.
- N'utilise pas de JSON.
- N'utilise pas de séparateurs décoratifs du type "---".
- N'utilise pas de placeholders entre crochets.
${seaActive ? "" : `- N'écris pas de section SEA : le SEA n'est pas actif.
- Omets totalement le SEA sans le signaler : aucune phrase sur son absence, aucune mention "non applicable".\n`}- Si une donnée est absente, ambiguë ou illisible, indique-le sobrement sans extrapoler.
- Si une donnée manque, garde la section mais formule-la de façon sobre et professionnelle.
- Toutes les sections doivent être générées, même si les données sont absentes.
- Il est strictement interdit de supprimer une section.
- Tu n'as pas le droit de décider de supprimer une section.
- Tu dois respecter la structure même si elle semble incomplète.
- Le rapport doit ressembler à un template rempli, pas à une synthèse intelligente.
- Tu dois toujours générer les sections 4. Bilan SEO, 5. ${comparisonTitle} et 6. Évolution des mots-clés stratégiques.
- Si les données sont absentes, écris explicitement "Données non disponibles dans le rapport fourni." ou "Aucune donnée exploitable..." selon la section concernée, mais garde la section.
- Si une comparaison inter${periodNoun} n'est pas possible, écris exactement :
  "Données non disponibles dans le rapport fourni."
- Si aucune donnée exploitable sur les mots-clés n'est disponible, écris exactement :
  "Aucune donnée exploitable sur les mots-clés n'est disponible dans le rapport."
- Ne reformule pas trop librement les actions fournies si elles sont déjà exploitables.
- Réutilise fidèlement les titres, URLs, descriptions techniques et éléments mensuels quand ils sont fournis.

STYLE ATTENDU
- Titres clairs, naturels et lisibles
- Tu peux utiliser des emojis de section
- Paragraphes courts
- Langage professionnel
- Ton positif, rassurant et accessible
- Aucune surcharge technique
- Chaque bloc doit donner l'impression d'un rapport rédigé par un expert métier
- La rédaction doit être très proche d'un livrable client
- Utilise quand c'est pertinent les formulations :
  - "➤ Lecture :"
  - "➤ Interprétation :"
  - "➤ Rappel des seuils :"
- Chaque section doit être séparée par une ligne vide.
- Chaque paragraphe doit être séparé par une ligne vide.
- Ne jamais coller plusieurs blocs dans un seul paragraphe.
- Les blocs commençant par "➤" doivent toujours être sur une nouvelle ligne.
- Toujours laisser une ligne vide après un titre.
- Toujours laisser une ligne vide entre les paragraphes.
- Toujours laisser une ligne vide avant et après les blocs commençant par "➤".
- Chaque section commence sur une nouvelle ligne.

STRUCTURE OBLIGATOIRE DU RAPPORT

1. Introduction
Rédige deux paragraphes fluides.
Le premier doit commencer de façon proche de :
"Ce rapport couvre la période de ... Il repose sur l'analyse des performances du site de ..."
Le second doit rappeler qu'il inclut :
- les statistiques de fréquentation
- la visibilité SEO
- les contenus les plus vus
- les requêtes stratégiques
${seaActive ? "- les performances des campagnes Google Ads\n" : ""}- les actions menées dans le cadre ${packContext}
- des pistes concrètes pour renforcer cette dynamique

2. Dernières actions SEO réalisées
Commence par une phrase proche de :
"Voici les optimisations réalisées durant le ${periodNoun} :"
Si le nombre d'actions réellement présentées est clairement identifiable, tu peux l'indiquer (par exemple "Voici les 3 optimisations réalisées durant le ${periodNoun} :"), mais n'annonce jamais un nombre qui ne correspond pas aux actions présentées.
Présente les actions mois par mois dans un style homogène lorsque les mois sont connus.
${monthlyTemplate}
Ne réécris pas librement ces actions si le formulaire fournit déjà une formulation exploitable.
Si un titre d'article, une URL ou une description technique sont fournis, réutilise-les fidèlement.
Si aucune action n'est fournie par le formulaire ni identifiable dans les documents, indique-le sobrement sans en inventer.

3. Bilan global du site
Rédige un ou deux paragraphes fluides.
Présente les sessions, la durée moyenne, le taux d'engagement, les formulaires, les appels ou autres conversions si présents.
Ajoute ensuite un bloc :
➤ Lecture :
avec une interprétation courte, claire et pédagogique du niveau d'engagement, de la qualité de visite ou du volume de contacts, dès qu'une donnée utile existe.

4. Bilan SEO
Commence par :
"Sur le ${periodNoun}, le site a enregistré :"
Puis présente sous forme de puces simples :
• impressions SEO
• clics organiques
• Taux de clics (CTR)
• Position moyenne
Si une donnée est absente, indique-le sans inventer, mais la section doit tout de même être rédigée.

Ajoute ensuite un bloc :
➤ Interprétation :
avec des commentaires pédagogiques fondés sur ces repères :
- un CTR supérieur à 3 % est considéré comme bon pour un site immobilier local
- une position moyenne idéale est inférieure à 15
- une position jusqu'à 25 reste satisfaisante
- une position supérieure à 30 peut être normale en début de mission
- plus de 5 000 impressions constitue déjà un bon début pour une agence locale

Ajoute ensuite un bloc :
➤ Lecture :
qui résume en une ou deux phrases la situation SEO générale, de manière fluide et orientée client.

5. ${comparisonTitle}
Si la comparaison est possible, présente les évolutions principales de manière lisible et courte.
Sinon, écris exactement :
"Données non disponibles dans le rapport fourni."

Cette section doit toujours apparaître.

6. Évolution des mots-clés stratégiques
Si des mots-clés sont disponibles, commente leur évolution.
Sinon, écris exactement :
"Aucune donnée exploitable sur les mots-clés n'est disponible dans le rapport."

Ajoute ensuite un bloc :
➤ Lecture :
avec une interprétation sobre et utile, même si les données sont absentes.

Puis ajoute :
➤ Rappel des seuils :
• < 5 → très bonne position
• 6-15 → bonne visibilité
• 16-30 → position moyenne
• > 30 → normal en phase de lancement

Cette section doit toujours apparaître, même sans mot-clé exploitable.

7. Pages et audience
Présente le pays principal, les zones ou villes dominantes, la part mobile et les pages les plus consultées.
Ne surcharge pas la section avec des détails inutiles.
Fais ressortir l'intérêt local et le comportement des internautes.

Ajoute :
➤ Lecture :
avec une conclusion courte sur l'adéquation entre l'offre et la demande locale.

8. Actions SEO à venir
Titre cette section exactement :
"8. Actions SEO à venir"

Commence obligatoirement par la phrase :
"Voici les 3 actions SEO que notre équipe mettra en place au cours des prochains mois :"

Propose exactement 3 actions, sous forme de puces.

Ces actions doivent :
- être concrètes, simples et réalistes
- être cohérentes avec les constats observés dans le rapport
- être adaptées à une stratégie SEO locale immobilière

IMPORTANT :
- Ces actions doivent être formulées comme des actions prises en charge par notre équipe
- Ne jamais utiliser un ton de recommandation au client
- Ne jamais écrire "vous devriez", "il est recommandé de", "nous vous recommandons de" ou équivalent
- Ne jamais donner l'impression que le client doit faire ces actions
- Le ton doit être proactif, professionnel et orienté accompagnement
${seaActive ? seaSection : ""}
${conclusionNumber}. Conclusion
Titre cette section exactement :
"${conclusionNumber}. Conclusion"

Rédige au moins deux paragraphes fluides, sans liste.
La conclusion doit :
- mettre en avant les résultats positifs
- souligner les avancées
- valoriser les conversions, l'engagement ou les signaux favorables
${seaActive ? "- reprendre brièvement les principaux enseignements du bilan SEA\n" : ""}- rappeler les leviers de progression à venir

Le ton doit être rassurant, positif et professionnel.

FORMAT DE SORTIE
- Renvoie uniquement le texte final du rapport, entièrement en français
- Pas de JSON
- Pas d'explication sur ta méthode
- Pas de phrase d'introduction hors rapport
- Le rendu final doit ressembler à un rapport client attendu, et non à une réponse générique
- Respecte strictement les retours à la ligne et les espacements demandés.
`
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isTemporaryGeminiUnavailable(error) {
  const status = error?.status || error?.statusCode || error?.code || error?.error?.code;
  const message = [
    error?.message,
    error?.statusText,
    error?.error?.message,
    error?.error?.status,
    error?.cause?.message
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    status === 503 ||
    status === "503" ||
    message.includes("503") ||
    message.includes("unavailable") ||
    message.includes("service unavailable") ||
    message.includes("high demand") ||
    message.includes("overloaded") ||
    message.includes("temporarily") ||
    message.includes("surcharge") ||
    message.includes("satur")
  );
}

function createUserFacingError(message) {
  const error = new Error(message);
  error.isUserFacing = true;
  return error;
}

async function retryGenerateContent({ contents, config }) {
  const retryDelays = [2000, 5000, 10000];
  let lastError = null;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    console.log(`Tentative Gemini ${attempt}/4`);

    try {
      return await genAI.models.generateContent({
        model,
        contents,
        config
      });
    } catch (error) {
      lastError = error;

      if (!isTemporaryGeminiUnavailable(error)) {
        throw error;
      }

      if (attempt < 4) {
        await wait(retryDelays[attempt - 1]);
      }
    }
  }

  if (model !== fallbackModel) {
    console.log(`Fallback vers ${fallbackModel}`);

    try {
      return await genAI.models.generateContent({
        model: fallbackModel,
        contents,
        config
      });
    } catch (error) {
      lastError = error;
    }
  }

  if (isTemporaryGeminiUnavailable(lastError)) {
    throw createUserFacingError(geminiBusyMessage);
  }

  throw lastError;
}

function getFileKind(file) {
  const extension = path.extname(file.originalname || "").toLowerCase();
  return supportedFileTypes[extension] || null;
}

function buildFilePart(file) {
  if (getFileKind(file) === "pdf") {
    return {
      inlineData: {
        mimeType: "application/pdf",
        data: file.buffer.toString("base64")
      }
    };
  }

  return {
    text: `Contenu du fichier joint « ${file.originalname} » :\n${file.buffer.toString("utf8")}`
  };
}

// Transforme les erreurs d'upload (taille, nombre de fichiers) en message propre pour l'utilisateur.
function handleUpload(req, res, next) {
  upload.array("mainReport", 5)(req, res, (error) => {
    if (!error) {
      return next();
    }

    let message = "Les fichiers joints n'ont pas pu être lus. Merci de réessayer.";

    if (error.code === "LIMIT_FILE_SIZE") {
      message = "Un des fichiers dépasse la taille maximale autorisée (20 Mo).";
    } else if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Vous pouvez joindre au maximum 5 fichiers.";
    }

    return res.status(400).json({ error: message });
  });
}

app.post("/api/generate-summary", handleUpload, async (req, res) => {
  try {
    if (!genAI) {
      console.error("GEMINI_API_KEY manquante : la génération de synthèse est désactivée.");
      return res.status(500).json({ error: missingApiKeyMessage });
    }

    if (!req.files?.length) {
      return res.status(400).json({ error: "Le rapport principal est obligatoire." });
    }

    const unsupportedFiles = req.files.filter((file) => !getFileKind(file));

    if (unsupportedFiles.length) {
      const names = unsupportedFiles.map((file) => file.originalname).join(", ");
      return res.status(400).json({
        error: `Format de fichier non pris en charge (${names}). Merci de joindre un fichier ${supportedFormatsLabel}.`
      });
    }

    const prompt = buildPrompt(req.body);
    const contents = [
      {
        role: "user",
        parts: [{ text: prompt }, ...req.files.map(buildFilePart)]
      }
    ];

    const response = await retryGenerateContent({
      contents,
      config: {
        systemInstruction:
          "Analyse d'abord les documents joints et base le contenu uniquement sur leurs informations fiables. Les champs du formulaire servent uniquement de contexte complémentaire. N'invente aucun chiffre. Respecte strictement la structure demandée et conserve toutes les sections du rapport, même si certaines données sont partielles. Le rendu doit ressembler à un vrai rapport client immobilier, pas à une synthèse IA générique. Rédige l'intégralité du rapport en français."
      }
    });

    const summary =
      response.text?.trim() ||
      response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Aucune synthèse n'a pu être générée.";

    return res.json({
      summary
    });
  } catch (error) {
    const message = error?.isUserFacing
      ? error.message
      : "Une erreur est survenue pendant la génération de la synthèse.";
    const statusCode = error?.isUserFacing ? 503 : 500;

    return res.status(statusCode).json({ error: message });
  }
});

app.listen(port, host, () => {
  console.log(`NUESTRO app running on http://${host}:${port}`);

  if (!genAI) {
    console.warn("Attention : GEMINI_API_KEY n'est pas définie, la génération de synthèse ne fonctionnera pas.");
  }
});
