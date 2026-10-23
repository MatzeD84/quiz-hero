# Quiz-Hero

PHP/MySQL-Quiz mit JavaScript-Modulen und einem Adminbereich. Das bestehende Erscheinungsbild und der Lernmodus mit zwei Versuchen bleiben erhalten.

## Lokal starten

`docker compose up -d --build app`

App: http://localhost:8081 ? Container: `quiz-hero-hostinger` ? MySQL: `quiz-hero-hostinger-db`, Port 3308.
Konfiguration: ignorierte `.env`. Migrationen: `docker exec quiz-hero-hostinger php database/migrate.php`.
Keine Seeds auf eine bestehende Datenbank anwenden. Das urspr?ngliche Projektverzeichnis wird nicht verwendet oder ge?ndert.

## Struktur

| Verzeichnis | Verantwortung |
| --- | --- |
| `public/` | Einzige HTTP-Wurzel: HTML, CSS, JS, Bilder und API-Einstieg |
| `api/` | Bootstrap, Konfiguration und expliziter API-Router au?erhalb der HTTP-Wurzel |
| `src/backend/accounts/` | Accounts, Passw?rter und Sitzungen |
| `src/backend/content/` | Fragen, Kategorien, Importvalidierung, Medien, Feedback und Exporte |
| `src/backend/quiz/` | Serverseitige Runden und Ergebnisberechnung |
| `src/backend/admin/` | Adminanmeldung und Nutzerverwaltung |
| `src/backend/infrastructure/`, `templates/` | Mailtransport und Mailvorlagen |
| `styles/` | CSS-Quellen; `node scripts/build-css.js` erzeugt `public/styles.css` |
| `data/`, `database/` | Historische Seeds, Avatarkatalog, Schema und explizite Migrationen |
| `scripts/` | Build-, Pr?f- und Hostinger-Werkzeuge |
| `tests/` | Browservertr?ge und isolierte Backend-Integrationstests |
| `imports/` | Bei Bedarf erzeugte Fragenimporte; kein automatischer Import |

Die Backendmodule haben bewusst benannte Funktionen ohne Frameworkwechsel. `api/index.php` ordnet nur die Aktionen zu. Der ?ffentliche PHP-Einstieg l?dt diesen Router. Die Admin-Importvalidierung und der Admin-API-Client sind eigene Browsermodule.

## Pr?fung

- `node --test tests/contracts.test.mjs`
- `node scripts/check-bem.js`
- `tests/integration.php` nur mit einer leeren Wegwerfdatenbank namens `quiz_hero_audit_*` ausf?hren. Der Test l?scht ausschlie?lich dort Tabellen.
- SEO-Vorschau: `SEO_SOURCE=json` ausdr?cklich setzen; Ver?ffentlichungen verwenden immer den aktuellen Datenbankexport.

## Bereitstellung und Daten

Quizwelten mit Kategorie-Vererbung (Production seit 23.10.2026): [Datenmodell, Migrationen 020/021, Pflege und Prüfstand](docs/QUIZWELTEN.md).

Hostinger zieht Branch `hostinger`; Build, Tests und SSH-Werkzeuge laufen ausschlie?lich dort. Keine GitHub Actions oder API-Secrets in GitHub. Ablauf und R?cksprung: [deployment/README.md](deployment/README.md).

Admin?nderungen schreiben direkt in MySQL. Code-Deployments importieren keine Fragen, Nutzer, Ergebnisse oder Uploads. Ein unabh?ngiger Worker aktualisiert die SEO-Seiten aus dem aktuellen Datenbankstand.

Gespeicherte Runden besitzen einen serverseitigen Fragen-Snapshot. Der Server berechnet Punkte aus den gew?hlten Antworten und speichert jede Runde h?chstens einmal. L?sungen bleiben im Lernmodus ?ffentlich; dies ist kein manipulationssicherer Pr?fungsmodus.

[Audit](docs/ARCHITEKTUR-AUDIT-2026-10-17.md) ? [Refactoring und Betrieb](docs/REFACTORING-2026-10-17.md).

## Wartung und Hilfsdateien

Alle aktiven Build- und Diagnosewerkzeuge liegen unter `scripts/`. Einmalige Migrationsskripte, HTTP-Mitschnitte und alte Beta-Testdateien gehoeren nicht zum Quellcode. Reproduzierbare Ausgaben unter `.build/` und `dist/` duerfen nach Gebrauch entfernt werden. Lokale Zugangsdaten, Datenbank-Dumps und Sicherungen bleiben unter `.private/` und werden niemals veroeffentlicht.

SEO lokal: `scripts/build-seo.bat` (JSON-Vorschau), `node scripts/preview-seo.js` und `node scripts/verify-seo.js`. `scripts/build-seed-sql.js` bleibt ausschliesslich fuer eine explizite Neuinitialisierung aus den historischen JSON-Daten; keine Seeds auf Production anwenden.
