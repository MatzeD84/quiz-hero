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

## Hinweise
- Lazy-Loading fuer Quiz-Bilder aktiv; Logos laden eager.
- Kompression: `.htaccess` aktiviert gzip (mod_deflate) und optional brotli.
- Wenn du `pages/` nicht commiten willst, generiere sie immer vor Deploy.

## Private Notizen
- `hinweise.md` ist persoenlich und kann lokale ToDos enthalten.


## MySQL-/PHP-Betrieb
Die App kann weiterhin statisch mit den JSON-Dateien laufen. Sobald `api/index.php` erreichbar ist und die Datenbanktabellen existieren, lädt das Frontend Fragen, Kategorien, Tags und Feedback bevorzugt aus MySQL und fällt bei nicht erreichbarer API automatisch auf die JSON-Dateien zurück.

### Datenbank einrichten
1) MySQL-Datenbank und Benutzer anlegen.
2) Schema importieren:
```bash
mysql -u <user> -p <database> < database/schema.sql
```
3) Bestehende JSON-Inhalte einmalig in MySQL übernehmen:
```bash
QUIZ_HERO_DB_HOST=127.0.0.1 QUIZ_HERO_DB_NAME=<database> QUIZ_HERO_DB_USER=<user> QUIZ_HERO_DB_PASSWORD=<password> php database/seed-from-json.php
```

### PHP-Umgebungsvariablen
- `QUIZ_HERO_DB_HOST` (Default `127.0.0.1`)
- `QUIZ_HERO_DB_PORT` (Default `3306`)
- `QUIZ_HERO_DB_NAME` (Default `quiz_hero`)
- `QUIZ_HERO_DB_USER` (Default `quiz_hero`)
- `QUIZ_HERO_DB_PASSWORD`
- `QUIZ_HERO_ADMIN_USER` (Default `admin`)
- `QUIZ_HERO_ADMIN_PASSWORD_HASH` (empfohlen, erzeugbar mit `php -r "echo password_hash('DEIN_PASSWORT', PASSWORD_DEFAULT), PHP_EOL;"`)
- alternativ `QUIZ_HERO_ADMIN_PASSWORD` nur für einfache Testumgebungen

### Admin-Oberfläche
- Aufruf: `/admin/`
- Nach dem Admin-Login können Kategorien angelegt/bearbeitet und Quizfragen komfortabel per Formular erstellt, bearbeitet oder gelöscht werden.
- Alle Datenbankzugriffe laufen serverseitig über PDO Prepared Statements; Admin-Sessions verwenden HttpOnly/SameSite-Cookies.

### User-Login und Ergebnisse
- Auf der Startseite können Spieler optional Name und Profilbild-URL eintragen.
- Der User wird in `quiz_users` gespeichert; abgeschlossene Quizrunden werden in `quiz_results` persistiert.
