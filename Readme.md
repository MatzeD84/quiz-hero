# Quiz-Hero

## Architektur
Quiz-Hero besteht inzwischen aus drei Schichten:

- Frontend: `index.html`, `styles.css` und die Module in `js/`. Das Frontend rendert Quiz, Kategorien, Tags, User-Login und Ergebnisanzeige im Browser.
- Backend/API: `api/index.php` mit `api/bootstrap.php`. Die API liefert Quizdaten aus MySQL, speichert Spieler und Ergebnisse und stellt geschuetzte Admin-Endpunkte bereit.
- Datenbank: MySQL mit Schema in `database/schema.sql`. Gespeichert werden Kategorien, Fragen, Tags, Feedback-Texte, Spieler und Quiz-Ergebnisse.

Der Datenfluss ist bewusst fallback-faehig:

1) Das Frontend fragt zuerst `api/index.php?action=public-data` ab.
2) Wenn die API erreichbar ist, kommen Kategorien, Fragen, Tags und Feedback aus MySQL.
3) Wenn die API nicht erreichbar ist, nutzt das Frontend die alten JSON-Dateien (`categories.json`, `tags.json`, `feedback.json`, `data/questions-*.json`) als Fallback.

Admin-Funktionen laufen nur ueber die PHP-API und MySQL. Die Admin-Session wird serverseitig per PHP-Session verwaltet. Spieler melden sich optional mit Name und Profilbild-URL an; diese Daten und abgeschlossene Ergebnisse werden in MySQL gespeichert.

## Deployment: Produktivumgebung aktualisieren
Der produktive Betrieb braucht einen Webserver mit PHP 8.x, aktivem `pdo_mysql`/`mbstring`, eine MySQL-Datenbank und Zugriff auf die Projektdateien. Docker ist lokal praktisch, aber fuer Produktion optional. Wenn dein Hosting Docker unterstuetzt, kannst du die Compose-Struktur adaptieren; bei klassischem Webhosting laedst du die Dateien hoch und konfigurierst PHP/MySQL dort.

### 1) Vor dem Deploy lokal pruefen
1) Docker-Stack starten und Datenbank pruefen:
```bash
docker compose up -d --build
docker compose run --rm seed
```
2) Lokal testen:
- `http://localhost:8080/`
- `http://localhost:8080/admin/`
- `http://localhost:8080/api/index.php?action=public-data`
3) PHP/JS grob pruefen:
```bash
docker compose exec app php -l api/bootstrap.php
docker compose exec app php -l api/index.php
docker compose exec app php -l database/seed-from-json.php
node --check js/admin.js
node --check js/quiz-data-service.js
node --check js/user-service.js
node --check js/quiz-controller.js
node --check js/quiz-view.js
```

### 2) Cache-Buster und SEO-Seiten aktualisieren
1) Cache-Buster/Version anpassen:
   - `index.html` bei CSS/JS/Fonts mit `?v=...`
   - `admin/index.html` bei `js/admin.js?v=...`
   - `js/config.js` (`ASSET_VERSION`)
   - `scripts/build-seo-pages.js` CSS-Version fuer Landingpages
2) SEO-Build mit deiner echten Domain ausfuehren:
```bat
.\scripts\build-seo.bat "https://deine-domain.de"
```

### 3) Produktive Datenbank vorbereiten
1) MySQL-Datenbank und eigenen MySQL-Benutzer anlegen.
2) Schema importieren:
```bash
mysql -u <user> -p <database> < database/schema.sql
```
3) Nur bei Erstbefuellung oder bewusstem Reset die bestehenden JSON-Inhalte importieren:
```bash
QUIZ_HERO_DB_HOST=<host> QUIZ_HERO_DB_NAME=<database> QUIZ_HERO_DB_USER=<user> QUIZ_HERO_DB_PASSWORD=<password> php database/seed-from-json.php
```

Wichtig: Das Seed-Script loescht und ersetzt Fragen pro Kategorie aus den JSON-Dateien. Wenn du produktiv bereits Fragen ueber die Admin-Oberflaeche gepflegt hast, fuehre den Seed nicht unbedacht erneut aus.

Bei Hosting ohne Shell-Zugriff kann stattdessen eine SQL-Datei fuer phpMyAdmin erzeugt werden:

```bash
node scripts/build-seed-sql.js
```

Danach in phpMyAdmin importieren:

1) `database/schema.sql`
2) `database/seed.sql`

`database/seed.sql` befuellt Kategorien, Fragen, Tags und Feedback. User und Ergebnisse werden nicht befuellt.

### 4) PHP-Umgebung produktiv konfigurieren
Setze auf dem Server mindestens diese Umgebungsvariablen:

- `QUIZ_HERO_DB_HOST`
- `QUIZ_HERO_DB_PORT`
- `QUIZ_HERO_DB_NAME`
- `QUIZ_HERO_DB_USER`
- `QUIZ_HERO_DB_PASSWORD`
- `QUIZ_HERO_ADMIN_USER`
- `QUIZ_HERO_ADMIN_PASSWORD_HASH`

Fuer Produktion sollte kein Klartext-Admin-Passwort genutzt werden. Hash lokal erzeugen:
```bash
php -r "echo password_hash('DEIN_STARKES_PASSWORT', PASSWORD_DEFAULT), PHP_EOL;"
```

Den erzeugten Wert als `QUIZ_HERO_ADMIN_PASSWORD_HASH` setzen. `QUIZ_HERO_ADMIN_PASSWORD` ist nur fuer lokale Tests gedacht.

Bei STRATO Shared Hosting sind echte PHP-Umgebungsvariablen oft unpraktisch. Deshalb unterstuetzt die App zusaetzlich `api/config.local.php`. Diese Datei ist in `.gitignore` ausgeschlossen und wird in der GitHub-Actions-Pipeline aus Secrets erzeugt.

Beispielstruktur siehe `api/config.local.example.php`.

### 5) Dateien hochladen
Fuer die produktive Version muessen hochgeladen werden:

- `index.html`, `styles.css`, `.htaccess`, `404.html`
- `admin/`
- `api/`
- `content/`
- `data/` und die JSON-Dateien als Fallback
- `database/schema.sql` und `database/seed-from-json.php` nur wenn du sie auf dem Server fuer Setup/Migration brauchst
- `fonts/`
- `images/`
- `js/`
- `pages/`
- `categories.json`, `tags.json`, `feedback.json`
- `sitemap.xml`, `robots.txt`

Nicht produktiv hochladen oder nicht oeffentlich ausliefern:

- `.env`
- `.docker-cli/`
- lokale Backups/Dumps
- persoenliche Notizen wie `hinweise.md`, falls sie nicht bewusst Teil des Deployments sein sollen

### 6) Nach dem Deploy pruefen
1) Seiten pruefen:
   - `https://deine-domain.de/index.html`
   - `https://deine-domain.de/admin/`
   - `https://deine-domain.de/api/index.php?action=public-data`
   - `https://deine-domain.de/pages/index.html`
   - `https://deine-domain.de/pages/<kategorie>.html`
2) Admin-Login pruefen und eine Testfrage anlegen/bearbeiten.
3) Quiz mit Testspieler abschliessen und kontrollieren, ob ein Ergebnis gespeichert wird.
4) Server-Logs auf PHP-/Datenbankfehler pruefen.
5) Optional: Sitemap in Google Search Console erneut einreichen.

### 7) Rollback
Vor jedem produktiven Update ein Backup der Datenbank erstellen. Fuer ein Rollback brauchst du:

- den vorherigen Dateistand
- einen Datenbank-Dump vor Schema-/Content-Aenderungen
- die vorherigen produktiven Umgebungsvariablen

## GitHub Actions Deployment zu STRATO
Die Pipeline liegt in `.github/workflows/deploy-strato.yml` und wird bewusst manuell gestartet. Damit geht nicht jeder Commit automatisch live.

### GitHub Secrets anlegen
In GitHub:

1) Repository oeffnen.
2) `Settings` anklicken.
3) `Secrets and variables` -> `Actions` oeffnen.
4) `New repository secret` anklicken.
5) Namen exakt wie unten eintragen und den jeweiligen Wert speichern.

Benötigte Secrets:

- `SITE_URL`: `https://quiz-hero.de`
- `STRATO_SFTP_HOST`: `ssh.strato.de`
- `STRATO_SFTP_USER`: dein STRATO-SFTP-Benutzer, z. B. `developerMatze@yuchingchao.com`
- `STRATO_SFTP_PASSWORD`: dein STRATO-SFTP-Passwort
- `STRATO_TARGET_PATH`: `/html/quiz-hero.de/`
- `QUIZ_HERO_DB_HOST`: STRATO-MySQL-Host
- `QUIZ_HERO_DB_PORT`: meistens `3306`
- `QUIZ_HERO_DB_NAME`: STRATO-Datenbankname
- `QUIZ_HERO_DB_USER`: STRATO-Datenbankbenutzer
- `QUIZ_HERO_DB_PASSWORD`: STRATO-Datenbankpasswort
- `QUIZ_HERO_ADMIN_USER`: produktiver Admin-User
- `QUIZ_HERO_ADMIN_PASSWORD_HASH`: Passwort-Hash, nicht Klartext

Admin-Passwort-Hash lokal erzeugen:

```bash
php -r "echo password_hash('DEIN_STARKES_PASSWORT', PASSWORD_DEFAULT), PHP_EOL;"
```

### Deployment starten
In GitHub:

1) Repository oeffnen.
2) `Actions` anklicken.
3) Workflow `Deploy to STRATO` auswaehlen.
4) `Run workflow` anklicken.
5) Nach Abschluss pruefen:
   - `https://quiz-hero.de/`
   - `https://quiz-hero.de/admin/`
   - `https://quiz-hero.de/api/index.php?action=public-data`

Die Pipeline laedt nur produktive Web-Dateien hoch: Frontend, Admin, API, Content, Bilder, Fonts, JSON-Fallbacks und SEO-Seiten. Nicht hochgeladen werden Docker-Dateien, GitHub-Workflow-Dateien, lokale `.env`, README und persoenliche Notizen.

## Neuer Content (Kategorien/Fragen)
Der normale Pflegeweg ist jetzt die Admin-Oberflaeche unter `/admin/`. Dort kannst du Kategorien und Fragen anlegen, bearbeiten, aktivieren/deaktivieren und speichern. Diese Inhalte landen direkt in MySQL und werden vom Quiz bevorzugt aus der Datenbank geladen.

Die JSON-Dateien bleiben wichtig fuer:

- initiales Befuellen per `database/seed-from-json.php`
- statischen Fallback, falls die API nicht erreichbar ist
- SEO-Seiten, solange der SEO-Build noch aus den JSON-Dateien generiert

Wenn du neue Inhalte produktiv ueber Admin pflegst, denke daran: Der aktuelle SEO-Generator liest weiterhin `categories.json` und `data/questions-*.json`. Fuer SEO-Landingpages muessen wichtige neue Kategorien/Fragen deshalb entweder auch in den JSON-Dateien gepflegt werden oder der Generator spaeter auf die Datenbank umgestellt werden.

Klassischer JSON-Weg:

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
- `admin/` Admin-Oberflaeche fuer Kategorien und Fragen
- `api/` PHP-API fuer Quizdaten, User, Ergebnisse und Admin-Aktionen
- `database/schema.sql` MySQL-Schema
- `database/seed-from-json.php` Import bestehender JSON-Inhalte in MySQL
- `database/seed.sql` generierter SQL-Import fuer phpMyAdmin
- `styles.css` globale Styles
- `js/` Logik (Controller/State/View, DataService, Config)
- `data/` Fragen-Dateien pro Kategorie
- `categories.json` Kategorien-Manifest
- `tags.json` Tag-Metadaten
- `pages/` generierte SEO-Landingpages
- `content/` Modal-Inhalte (Impressum/Datenschutz/Cookies)
- `scripts/build-seo-pages.js` SEO-Generator
- `scripts/build-seo.bat` Build-Wrapper
- `scripts/build-seed-sql.js` erzeugt `database/seed.sql` aus den JSON-Dateien
- `.htaccess` Redirects + Kompression + 404
- `404.html` einfache Fehlerseite mit Footer-Modalen
- `Dockerfile`, `docker-compose.yml`, `.env.example` lokale Docker-Umgebung mit PHP/Apache und MySQL

## App-Logik (JS)
- `js/config.js` Konfiguration (URLs, Labels, Punktelogik, Selektoren, `ASSET_VERSION`)
- `js/quiz-data-service.js` Laedt Kategorien/Fragen, validiert JSON, Cache-Busting
- `js/quiz-state.js` Zustand (Kategorie/Tag, Sequenz, Score, Attempts)
- `js/quiz-view.js` DOM/Rendering/Events
- `js/quiz-controller.js` Nutzerfluss (Auswahl, Antworten, Ergebnis)
- `js/user-service.js` User-Login und Ergebnis-Speicherung ueber die API
- `js/admin.js` Admin-Frontend fuer die API
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

## Lokal testen mit Docker
Voraussetzung: Docker Desktop muss laufen.

1) Optional lokale Defaults kopieren und bei Bedarf Passwoerter/Ports anpassen:
```bash
cp .env.example .env
```

2) Webserver und MySQL starten:
```bash
docker compose up -d --build
```

3) Datenbank einmalig mit den bestehenden JSON-Fragen befuellen:
```bash
docker compose run --rm seed
```

4) App im Browser oeffnen:
- Quiz: `http://localhost:8080/`
- Admin: `http://localhost:8080/admin/`
- Admin-Testlogin aus `.env.example`: `admin` / `admin123`

MySQL ist vom Host aus unter `127.0.0.1:3307` erreichbar. Die Daten bleiben im Docker-Volume `quiz_hero_mysql` erhalten. Wenn du komplett neu starten willst, loescht dieser Befehl die lokale Datenbank:
```bash
docker compose down -v
```

Docker-Services:

- `app`: PHP 8.3 mit Apache, bedient Frontend, Admin und API auf Port `8080`.
- `mysql`: MySQL 8.4 mit persistentem Volume `quiz_hero_mysql`, lokal erreichbar auf Port `3307`.
- `seed`: Einmaliger Tool-Container, der JSON-Inhalte in MySQL importiert.

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

Das Seed-Script ist fuer Erstimport und bewusste Synchronisierung gedacht. Es ersetzt Fragen pro Kategorie anhand der JSON-Dateien und sollte auf Produktion nur nach Datenbank-Backup ausgefuehrt werden.

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
