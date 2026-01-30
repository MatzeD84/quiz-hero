# Quiz-Hero

## Deploy (wichtig)
1) Cache-Buster/Version anpassen:
   - `index.html` (fonts/styles/main.js `?v=...`)
   - `js/config.js` (`ASSET_VERSION`)
   - `scripts/build-seo-pages.js` (CSS-Version fuer Landingpages)
2) SEO-Build ausfuehren:
```bat
.\scripts\build-seo.bat "https://deine-domain.de"
```
3) Deploy:
   - `index.html`, `styles.css`, `js/`, `images/`, `data/`, `content/`, `fonts/`
   - `pages/`
   - `sitemap.xml`, `robots.txt` (werden beim Build erzeugt)
   - `.htaccess`, `404.html`
4) Nach dem Deploy pruefen:
   - `https://deine-domain.de/index.html`
   - `https://deine-domain.de/pages/index.html`
   - `https://deine-domain.de/pages/<kategorie>.html`
5) Optional: Sitemap in Google Search Console erneut einreichen.

## Neuer Content (Kategorien/Fragen)
1) `categories.json` erweitern:
   - `id`, `title`, `description`, `icon`, `questionsFile`
   - optional: `seoDescription`, `badge`
2) Neue Fragen-Datei anlegen: `data/questions-<id>.json`
   - Felder: `question`, `answers[]`, `correct`
   - optional: `difficulty` (`easy|medium|hero`), `tag[]`, `imageUrl`
3) Bilder in `images/` ablegen und Pfade pruefen.
4) SEO-Build ausfuehren (siehe oben).

## Projektstruktur (kurz)
- `index.html` App-Einstieg
- `styles.css` globale Styles
- `js/` Logik (Controller/State/View, DataService, Config)
- `data/` Fragen-Dateien pro Kategorie
- `categories.json` Kategorien-Manifest
- `tags.json` Tag-Metadaten
- `pages/` generierte SEO-Landingpages
- `content/` Modal-Inhalte (Impressum/Datenschutz/Cookies)
- `scripts/build-seo-pages.js` SEO-Generator
- `scripts/build-seo.bat` Build-Wrapper
- `.htaccess` Redirects + Kompression + 404
- `404.html` einfache Fehlerseite mit Footer-Modalen

## App-Logik (JS)
- `js/config.js` Konfiguration (URLs, Labels, Punktelogik, Selektoren, `ASSET_VERSION`)
- `js/quiz-data-service.js` Laedt Kategorien/Fragen, validiert JSON, Cache-Busting
- `js/quiz-state.js` Zustand (Kategorie/Tag, Sequenz, Score, Attempts)
- `js/quiz-view.js` DOM/Rendering/Events
- `js/quiz-controller.js` Nutzerfluss (Auswahl, Antworten, Ergebnis)
- `js/main.js` Bootstrap

## SEO-Setup (Landingpages)
- Statische Seiten unter `pages/` (Layout wie Startseite)
- Alle Fragen + Antworten sichtbar (einklappbar)
- FAQPage JSON-LD fuer sichtbare Q/A
- Breadcrumbs sichtbar + BreadcrumbList JSON-LD
- OpenGraph/Twitter-Bilder pro Kategorie
- "Auch interessant" (3 verwandte Kategorien via Tag-Ueberschneidung)
- SEO-Fliesstext aus `categories.json` (`seoDescription`)
- Allgemeiner Info-Block zu Punkte-System/KI-Bildern/Projekt
- Start per `index.html?category=<id>`
- `sitemap.xml`/`robots.txt` werden beim Build erzeugt (nur mit `SITE_URL`)

## Lokaler Build (ohne Deploy)
```bat
.\scripts\build-seo.bat
```

## Fragen verifizieren (Wikipedia)
Alle Fragen prüfen:
```bat
node scripts/verify-wikipedia.js
```

Nur eine Datei prüfen:
```bat
node scripts/verify-wikipedia.js data/questions-florenz.json
```

Felder in `meta` (Kurzbeschreibung):
- `verifiedFinal`: finale manuelle Freigabe (default `false`).
- `sourceUrl`: Platzhalter fuer spaetere KI-Quellen, bleibt beim Wiki-Check leer.
- `generatedAt`: Platzhalter fuer spaetere KI-Generierung, bleibt beim Wiki-Check leer.
- `verifiedGPT`: Platzhalter fuer spaetere GPT-Verifikation (string).
- `knowledgeConfidence`: Platzhalter fuer spaetere KI-Bewertung (0–1), bleibt beim Wiki-Check unveraendert.
- `verificationWiki.sourceUrlWiki`: Wikipedia-URL zum Treffer.
- `verificationWiki.confidence`: Confidence-Score (0–1) basierend auf Treffer im Artikeltext.
- `verificationWiki.matchedText`: kurzer Auszug aus dem Artikel (Match-Snippet).
- `verificationWiki.verified`: Ergebnis des Wikipedia-Checks (`true`, wenn `verificationWiki.confidence >= 0.6`).

Scoring (Wiki-Check):
- Basis: Treffer der Antwort im Artikel (+0.6) + Keyword-Overlap aus der Frage (bis +0.4).
- Bonus: Antwort im Intro (+0.08) und Antwort im Artikeltitel (+0.1).
- Wenn die Antwort im Artikel gar nicht vorkommt, wird der Score auf max. 0.4 begrenzt.
- Dynamischer Threshold: kurze Antworten brauchen hoehere Sicherheit (>= 0.75), sehr lange Fragen duerfen niedriger sein (>= 0.55).
Konfiguration (scripts/verify-wikipedia.js):
- verifiedThreshold: 0.6
- shortAnswerThreshold: 0.75
- longQuestionThreshold: 0.55
- introBonus: 0.08
- titleBonus: 0.1
- maxScoreWithoutAnswerHit: 0.4
- requestDelayMs: 1100
- perQuestionDelayMs: 600
- retryAfterSeconds: 2
- maxRetries: 3

## Hinweise
- Lazy-Loading fuer Quiz-Bilder aktiv; Logos laden eager.
- Kompression: `.htaccess` aktiviert gzip (mod_deflate) und optional brotli.
- Wenn du `pages/` nicht commiten willst, generiere sie immer vor Deploy.

## Private Notizen
- `hinweise.md` ist persoenlich und kann lokale ToDos enthalten.
