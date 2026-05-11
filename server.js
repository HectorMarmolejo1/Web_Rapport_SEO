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
const host = process.env.HOST || "127.0.0.1";
const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey && apiKey !== "your_gemini_api_key_here" ? new GoogleGenAI({ apiKey }) : null;

app.use(express.static(__dirname));
app.use(express.json());

function buildPrompt(fields) {
  const seoActive = Boolean(fields.seoPack);
  const seaActive = Boolean(fields.seaPack);
  const offers = [
    seoActive ? `SEO ${fields.seoPack}` : null,
    seaActive ? `SEA ${fields.seaPack}` : null
  ]
    .filter(Boolean)
    .join(" | ");

  const clientName = fields.clientName?.trim() || "Client non renseigne";
  const analysisPeriod = fields.analysisPeriod?.trim() || "Periode non renseignee";
  const startDate = fields.startDate?.trim() || "Non renseignee";
  const endDate = fields.endDate?.trim() || "Non renseignee";
  const reportType = fields.reportType?.trim() || "Rapport non renseigne";

  const seoPack = fields.seoPack?.trim() || "Non renseigne";
  const seoActions = fields.seoActions?.trim() || "Aucune action SEO detaillee n'a ete fournie.";
  const keywordTable = fields.keywordTable?.trim() || "Aucun mot-cle n'a ete fourni.";
  const seoComment = fields.seoComment?.trim() || "Aucun commentaire SEO complementaire.";
  const seaPack = fields.seaPack?.trim() || "Non renseigne";
  const seaComment = fields.seaComment?.trim() || "Aucun commentaire SEA complementaire.";
  const seaActions = Array.isArray(fields.seaActions)
    ? fields.seaActions.join("\n- ")
    : fields.seaActions?.trim() || "Aucune action SEA fournie.";

  return `
ROLE
Tu es un expert SEO et analyste digital.
Tu rediges un rapport semestriel automatise destine a etre lu a l'oral par un chef de projet non expert.
Tu travailles sur un dossier immobilier local dans le cadre d'un Pack Essentiel.
Le rendu attendu est un rapport client structure, fluide, professionnel et directement presentable.

CONTEXTE DU DOSSIER
- Nom du client : ${clientName}
- Periode analysee : ${analysisPeriod}
- Date de debut : ${startDate}
- Date de fin : ${endDate}
- Type de rapport : ${reportType}
- Pack SEO : ${seoPack}
${seaActive ? `- Pack SEA : ${seaPack}` : ""}

INFORMATIONS FORMULAIRE A UTILISER EN COMPLEMENT DU PDF
- Actions SEO fournies :
${seoActions}

- Mots-cles fournis :
${keywordTable}

- Commentaire SEO :
${seoComment}

${seaActive ? `- Actions SEA fournies :
- ${seaActions}

- Commentaire SEA :
${seaComment}` : ""}

OBJECTIF
Tu dois produire un rapport client immobilier tres proche d'un rendu metier humain.
Le resultat ne doit pas ressembler a une reponse d'IA ni a une simple synthese analytique.
Le style attendu est celui d'un rapport semestriel Pack Essentiel, pret a etre lu a l'oral.

PRIORITES
1. Exactitude des donnees issues du PDF
2. Respect strict de la structure editoriale demandee
3. Fidelite au ton metier attendu
4. Clarte pedagogique pour un interlocuteur non expert

REGLES ABSOLUES
- Analyse d'abord le ou les PDF joints et base-toi sur leurs donnees reelles.
- N'invente aucun chiffre, aucune evolution, aucune position, aucune comparaison.
- Les champs du formulaire servent uniquement a completer le contexte et les actions menees.
- Le PDF fournit les donnees de performance.
- Le formulaire complete les actions SEO, les commentaires et les informations metier.
- La structure du rapport est imposee : elle ne doit pas etre modifiee.
- Le style attendu est impose : il doit se rapprocher d'un rapport client immobilier Pack Essentiel.
- N'ecris jamais une introduction generique du type :
  "Voici la synthese des performances..."
  "Voici le rapport..."
  "Ci-dessous..."
- N'ecris jamais une conclusion trop neutre ou administrative.
- N'utilise pas un ton de resume automatique.
- N'utilise pas de meta-commentaire sur ta methode.
- N'utilise pas de JSON.
- N'utilise pas de separateurs decoratifs du type "---".
- N'utilise pas de placeholders entre crochets.
- N'ecris pas de section SEA si le SEA n'est pas actif.
- Si le SEA n'est pas actif, omets totalement cette section sans le signaler.
- Si une donnee est absente, ambigue ou illisible, indique-le sobrement sans extrapoler.
- Si une donnee manque, garde la section mais formule-la de facon sobre et professionnelle.
- Toutes les sections doivent etre generees, meme si les donnees sont absentes.
- Il est strictement interdit de supprimer une section.
- Tu n'as pas le droit de decider de supprimer une section.
- Tu dois respecter la structure meme si elle semble incomplete.
- Le rapport doit ressembler a un template rempli, pas a une synthese intelligente.
- Tu dois toujours generer les sections 4. Bilan SEO, 5. Comparaison intersemestre et 6. Evolution des mots-cles strategiques.
- Si les donnees sont absentes, ecris explicitement "Donnees non disponibles dans le rapport fourni." ou "Aucune donnee exploitable..." selon la section concernee, mais garde la section.
- Si une comparaison intersemestre n'est pas possible, ecris exactement :
  "Donnees non disponibles dans le rapport fourni."
- Si aucune donnee exploitable sur les mots-cles n'est disponible, ecris exactement :
  "Aucune donnee exploitable sur les mots-cles n'est disponible dans le rapport."
- Ne reformule pas trop librement les actions fournies si elles sont deja exploitables.
- Reutilise fidelement les titres, URLs, descriptions techniques et elements mensuels quand ils sont fournis.

STYLE ATTENDU
- Titres clairs, naturels et lisibles
- Tu peux utiliser des emojis de section
- Paragraphes courts
- Langage professionnel
- Ton positif, rassurant et accessible
- Aucune surcharge technique
- Chaque bloc doit donner l'impression d'un rapport redige par un expert metier
- La redaction doit etre tres proche d'un livrable client
- Utilise quand c'est pertinent les formulations :
  - "➤ Lecture :"
  - "➤ Interpretation :"
  - "➤ Rappel des seuils :"
- Chaque section doit etre separee par une ligne vide.
- Chaque paragraphe doit etre separe par une ligne vide.
- Ne jamais coller plusieurs blocs dans un seul paragraphe.
- Les blocs "➤ Lecture :", "➤ Interpretation :" et "➤ Rappel des seuils :" doivent toujours etre sur une nouvelle ligne.
- Toujours laisser une ligne vide apres un titre.
- Toujours laisser une ligne vide entre les paragraphes.
- Toujours laisser une ligne vide avant et apres les blocs commencant par "➤".
- Chaque section commence sur une nouvelle ligne.

STRUCTURE OBLIGATOIRE DU RAPPORT

1. Introduction
Redige deux paragraphes fluides.
Le premier doit commencer de facon proche de :
"Ce rapport couvre la periode de ... Il repose sur l'analyse des performances du site de ..."
Le second doit rappeler qu'il inclut :
- les statistiques de frequentation
- la visibilite SEO
- les contenus les plus vus
- les requetes strategiques
- les actions menees dans le cadre du Pack Essentiel
- des pistes concretes pour renforcer cette dynamique

2. Dernieres actions SEO realisees
Commence par une phrase proche de :
"Voici les 6 optimisations realisees durant le semestre :"
Presente les actions mois par mois dans un style homogene.
Quand les informations sont disponibles ou deductibles a partir du formulaire, respecte cette logique :
• Mois 1 – Publication d'un article
• Mois 2 – Optimisations techniques standards
• Mois 3 – Backlink : Creation d'un backlink
• Mois 4 – Creation d'une page SEO
• Mois 5 – Optimisations techniques complementaires
• Mois 6 – Backlink externe + publication video
Ne reecris pas librement ces actions si le formulaire fournit deja une formulation exploitable.
Si un titre d'article, une URL ou une description technique sont fournis, reutilise-les fidelement.

3. Bilan global du site
Redige un ou deux paragraphes fluides.
Presente les sessions, la duree moyenne, le taux d'engagement, les formulaires, les appels ou autres conversions si presents.
Ajoute ensuite un bloc :
➤ Lecture :
avec une interpretation courte, claire et pedagogique du niveau d'engagement, de la qualite de visite ou du volume de contacts, des qu'une donnee utile existe.

4. Bilan SEO
Commence par :
"Sur le semestre, le site a enregistre :"
Puis presente sous forme de puces simples :
• impressions SEO
• clics organiques
• Taux de clics (CTR)
• Position moyenne
Si une donnee est absente, indique-le sans inventer, mais la section doit tout de meme etre redigee.

Ajoute ensuite un bloc :
➤ Interpretation :
avec des commentaires pedagogiques fondes sur ces reperes :
- un CTR superieur a 3 % est considere comme bon pour un site immobilier local
- une position moyenne ideale est inferieure a 15
- une position jusqu'a 25 reste satisfaisante
- une position superieure a 30 peut etre normale en debut de mission
- plus de 5 000 impressions constitue deja un bon debut pour une agence locale

Ajoute ensuite un bloc :
➤ Lecture :
qui resume en une ou deux phrases la situation SEO generale, de maniere fluide et orientee client.

5. Comparaison intersemestre
Si la comparaison est possible, presente les evolutions principales de maniere lisible et courte.
Sinon, ecris exactement :
"Donnees non disponibles dans le rapport fourni."

Cette section doit toujours apparaitre.

6. Evolution des mots-cles strategiques
Si des mots-cles sont disponibles, commente leur evolution.
Sinon, ecris exactement :
"Aucune donnee exploitable sur les mots-cles n'est disponible dans le rapport."

Ajoute ensuite un bloc :
➤ Lecture :
avec une interpretation sobre et utile, meme si les donnees sont absentes.

Puis ajoute :
➤ Rappel des seuils :
• < 5 → tres bonne position
• 6-15 → bonne visibilite
• 16-30 → position moyenne
• > 30 → normal en phase de lancement

Cette section doit toujours apparaitre, meme sans mot-cle exploitable.

7. Pages et audience
Presente le pays principal, les zones ou villes dominantes, la part mobile et les pages les plus consultees.
Ne surcharge pas la section avec des details inutiles.
Fais ressortir l'interet local et le comportement des internautes.

Ajoute :
➤ Lecture :
avec une conclusion courte sur l'adequation entre l'offre et la demande locale.

8. Actions SEO a venir
Titre cette section exactement :
"🚀 8. Actions SEO à venir"

Commence obligatoirement par la phrase :
"Voici les 3 actions SEO que notre equipe mettra en place au cours des prochains mois :"

Propose exactement 3 actions, sous forme de puces.

Ces actions doivent :
- etre concretes, simples et realistes
- etre coherentes avec les constats observes dans le rapport
- etre adaptees a une strategie SEO locale immobiliere

IMPORTANT :
- Ces actions doivent etre formulees comme des actions prises en charge par notre equipe
- Ne jamais utiliser un ton de recommandation au client
- Ne jamais ecrire "vous devriez", "il est recommande de", ou equivalent
- Ne jamais donner l'impression que le client doit faire ces actions
- Le ton doit etre proactif, professionnel et oriente accompagnement

9. Conclusion
Titre cette section exactement :
"✅ 9. Conclusion"

Redige au moins deux paragraphes fluides, sans liste.
La conclusion doit :
- mettre en avant les resultats positifs
- souligner les avancees
- valoriser les conversions, l'engagement ou les signaux favorables
- rappeler les leviers de progression a venir

Le ton doit etre rassurant, positif et professionnel.

FORMAT DE SORTIE
- Renvoie uniquement le texte final du rapport
- Pas de JSON
- Pas d'explication sur ta methode
- Pas de phrase d'introduction hors rapport
- Le rendu final doit ressembler a un rapport client attendu, et non a une reponse generique
- Respecte strictement les retours a la ligne et les espacements demandes.
`.trim();
}

app.post("/api/generate-summary", upload.array("mainReport", 5), async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({
        error:
          "La variable GEMINI_API_KEY est absente. Ajoutez votre cle API Gemini dans le fichier .env avant de lancer le serveur."
      });
    }

    if (!req.files?.length) {
      return res.status(400).json({ error: "Le rapport principal est obligatoire." });
    }

    const prompt = buildPrompt(req.body);
    const contents = [
      {
        role: "user",
        parts: [
          { text: prompt },
          ...req.files.map((file) => ({
            inlineData: {
              mimeType: file.mimetype || "application/pdf",
              data: file.buffer.toString("base64")
            }
          }))
        ]
      }
    ];

    const response = await genAI.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction:
          "Analyse d'abord les PDF joints et base le contenu uniquement sur leurs informations fiables. Les champs du formulaire servent uniquement de contexte complementaire. N'invente aucun chiffre. Respecte strictement la structure demandee et conserve toutes les sections du rapport, meme si certaines donnees sont partielles. Le rendu doit ressembler a un vrai rapport client immobilier Pack Essentiel, pas a une synthese IA generique."
      }
    });

    const summary =
      response.text?.trim() ||
      response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Aucune synthese n'a pu etre generee.";

    return res.json({
      summary
    });
  } catch (error) {
    const message =
      error?.message ||
      error?.error?.message ||
      "Une erreur est survenue pendant la generation de la synthese.";

    return res.status(500).json({ error: message });
  }
});

app.listen(port, host, () => {
  console.log(`Modelo Office app running on http://${host}:${port}`);
});
