---
paths:
  - "server.js"
  - "index.html"
---

# Reglas métier del prompt del reporte — NUESTRO

Este archivo documenta, en español, las reglas que debe respetar `buildPrompt()` en `server.js`.
Es documentación para desarrolladores: el prompt real enviado a Gemini NO se escribe en español.

## Idioma (regla fundamental)

- Todo el texto de `buildPrompt()` y del `systemInstruction` enviado a Gemini debe estar en **francés**.
- Nunca traducir `buildPrompt()` al español.
- Gemini debe recibir la instrucción explícita de redactar el reporte final **únicamente en francés**
  (bloque `LANGUE DE SORTIE` al principio del prompt).
- Excepciones permitidas en el reporte: nombres propios, marcas, URLs, nombres de campañas,
  palabras clave o datos que vienen directamente de los documentos.
- Títulos del reporte, bloques `➤ Lecture :`, `➤ Interprétation :`, `➤ Rappel des seuils :`,
  `➤ Actions SEA à venir :` y cualquier texto destinado al cliente: en francés correcto, con acentos.
- La documentación para desarrolladores (`CLAUDE.md`, `.claude/rules/`) puede quedarse en español.

## Fuentes de datos

- El PDF es la fuente principal de métricas.
- El formulario completa el contexto: acciones SEO/SEA, palabras clave, comentarios.
- Nunca inventar cifras, evoluciones, posiciones ni comparaciones.
- No confundir sesiones, clics, usuarios, impresiones, conversiones ni eventos.
- Si un dato falta: mantener la sección y decirlo de forma sobria.

## Adaptación al pack y al tipo de reporte

- No forzar "Pack Essentiel": usar el pack SEO seleccionado (`seoPack`: Essentiel, Signature, Excellence).
- No forzar "semestriel": `reportType` puede ser `Trimestriel` o `Semestriel`.
  El vocabulario (trimestre/semestre, comparación inter-periodo) se adapta.
- No imponer "6 optimisations": el número anunciado debe corresponder a las acciones realmente presentadas.
  La plantilla mensual "Mois 1 … Mois 6" solo se usa con Pack Essentiel + Semestriel.

## Estructura del reporte

1. Introduction
2. Dernières actions SEO réalisées
3. Bilan global du site
4. Bilan SEO
5. Comparaison intersemestre / intertrimestre
6. Évolution des mots-clés stratégiques
7. Pages et audience
8. Actions SEO à venir
9. Bilan SEA — **solo si `seaPack` está activo**
9 o 10. Conclusion — 9 sin SEA, 10 con SEA

Si SEA no está activo: ninguna sección SEA, ninguna frase sobre la ausencia de SEA, ninguna mención "non applicable".

## Sección "9. Bilan SEA" (solo con SEA activo)

Debe ser un análisis real, no un simple resumen de cifras.

- Frase inicial cercana a: "Sur la période analysée, les campagnes Google Ads ont enregistré :"
- Indicadores, solo los realmente presentes en el reporte: impresiones, clics, CTR, coste total,
  CPC medio, conversiones, tasa de conversión, coste por conversión.
- `➤ Interprétation :` sin repetir cifras, analizando solo cuando hay datos:
  1. visibilidad y atractivo (impresiones, clics, CTR, capacidad de generar tráfico);
  2. coste y eficacia (coste, CPC, conversiones, tasa y coste por conversión) — no calificar
     automáticamente un coste/CPC/CTR como bueno o malo sin contexto fiable;
  3. rendimiento por campaña: qué campañas convierten, cuáles generan tráfico sin convertir, diferencias importantes;
  4. naturaleza de las conversiones (llamadas, estimaciones, clics en teléfono, formularios…) y qué revela de la intención;
  5. términos de búsqueda: solo los más útiles (clics, CTR, CPC, geolocalizados, intención compra/venta/estimación), nunca la lista completa;
  6. audiencias y zonas: ciudades, dispositivos, demografía solo si aporta; coherencia geográfica con la zona
     de la agencia; implicaciones de una parte móvil muy alta.
- `➤ Lecture :` de 3 a 5 frases máximo: visibilidad, contactos/conversiones, campaña más eficaz,
  campaña con tráfico sin conversión, coherencia de búsquedas y zonas.
- `➤ Actions SEA à venir :` empezando por "Voici les actions SEA que notre équipe mettra en place
  au cours des prochains mois :", 2 o 3 acciones máximo, ligadas a los constatos.

## Tono de las acciones futuras (SEO y SEA)

- Son acciones que realiza **nuestro equipo**, nunca recomendaciones al cliente.
- Prohibido: "vous devriez", "nous vous recommandons de", "il est recommandé de" o equivalentes.

## Archivos aceptados

- Formatos soportados: PDF (enviado a Gemini como documento), CSV y TXT (enviados como texto).
- Máximo 5 archivos de 20 MB. Cualquier otro formato se rechaza con un mensaje claro en francés,
  tanto en el navegador como en el servidor.
