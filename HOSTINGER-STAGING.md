# Quiz-Hero: getrennte Hostinger-Kopie

Stand: 17.10.2026. Arbeitsordner ist ausschließlich dieses Projekt.
Die Quelle `C:\Users\mdouw\OneDrive\Dokumente\code\html-quiz` wurde nur gelesen.

## Lokale Umgebung

- App: `quiz-hero-hostinger`, http://localhost:8081
- Datenbank: `quiz-hero-hostinger-db`, localhost:3308
- Compose-Projekt: `quiz-hero-hostinger`
- Eigenes Volume: `quiz-hero-hostinger-mysql`
- Start: `docker compose up -d --build`
- Stop: `docker compose stop`
- Das Volume wurde vom gestoppten Original mit schreibgeschütztem Quellmount kopiert.
- Die Originalcontainer wurden nicht gestartet. Alle acht Datenbankmigrationen waren bereits vorhanden.
- Bestand: 297 Fragen, 6 Kategorien, 5 Accounts, 11 Ergebnisse. Das ist der lokale Datenbestand, kein aktueller Produktionsabzug.
- Die lokalen Zugangseinstellungen stehen ausschließlich in der ignorierten `.env`.
- Lokale E-Mails gehen in das private Log im App-Container, nicht an echte Empfänger.

## Hostinger-Paket

`node scripts/build-hostinger.js` erstellt `.build/hostinger/public`.
Benötigt `SITE_URL=https://quiz-hero-stage.matzeverse.de`, `SEO_EXPORT_URL`
und `SEO_EXPORT_TOKEN` für einen funktionierenden SEO-Export der kopierten Datenbank.
Der Token darf nicht in die Dokumentation, Versionsverwaltung oder Buildausgabe gelangen.
Optional: `ASSET_VERSION`.

Das tatsächlich bereitgestellte Linux-Paket liegt unter `dist/quiz-hero-stage-upload.tar.gz`.
Das frühere ZIP ist der erste Zwischenstand und soll nicht zum erneuten Deployment verwendet werden.
Es enthält Bilder, PHP-API, Frontend, erzeugte Kategorieseiten, Assetversionierung
und CSP-Hashes. Es enthält keine Datenbank, echten Zugangsdaten, Git-Metadaten,
Docker-Konfiguration oder GitHub Actions. `api/config.local.php` im Paket enthält
ausschließlich einen Verweis auf die private Konfiguration außerhalb des Webroots.
Analytics ist im Paket deaktiviert;
robots.txt und X-Robots-Tag verhindern reguläre Suchmaschinenindexierung.
Dies ersetzt keinen Zugriffsschutz; vor öffentlichem Zugriff auf kopierte Accounts
soll auf Hostinger ein Passwortschutz für die gesamte Staging-Website eingerichtet werden.

Privater SQL-Export: `.private/local-database.sql` (inklusive lokaler Accounts).
Dieser Pfad ist ignoriert und im lokalen Apache mit HTTP 403 gesperrt.
Der Dump darf niemals in das öffentliche Webverzeichnis oder ein Git-Repository.
Die rohe Datenvolume-Kopie bleibt zusätzlich im eigenen Docker-Volume erhalten.

`api/config.hostinger.example.php` ist eine Vorlage für die separat und privat
bereitgestellte `private/config.php` auf Hostinger. Neue Admin-Zugangsdaten,
Token-Secrets und die eigene Staging-Datenbank einsetzen. Kein Dev-Login online.
Echter Mailversand ist zunächst deaktiviert; Registrierung und Passwort-Reset
sind deshalb online erst nach Einrichtung eines kontrollierten Mailziels vollständig testbar.

## Hostinger-Provisionierung am 17.10.2026

Der Hostinger-Zugang funktioniert nach Reparatur des unvollständigen npm-Caches.
Bestehender aktiver Tarif: Business (`hostinger_business_v5`), Order `1010081161`,
Hosting-Konto `u199598707`.

- Domaininhaberschaft für `quiz-hero-stage.matzeverse.de` bestätigt.
- Eigene Website erstellt; Setupstatus `completed`.
- Webroot: `/home/u199598707/domains/quiz-hero-stage.matzeverse.de/public_html`.
- Eigene Datenbank und Benutzer `u199598707_quiz_stage` erstellt und bestätigt.
- Neue zufällige Datenbankzugangsdaten ausschließlich in `.private/hostinger-staging.json`.
- PHP-Konfiguration der bestehenden Hauptwebsite: PHP 8.3, mbstring und MySQL-PDO aktiviert.
- App-Dateien per SSH bereitgestellt; lokaler SQL-Dump erfolgreich in die vorher leere Staging-Datenbank importiert.
- Server ist MariaDB 11.8.9; der MySQL-8.4-Export ließ sich unverändert importieren.
- HTTP-Basic-Passwortschutz aktiv: ohne Anmeldung HTTP 401, mit Anmeldung HTTP 200.
- Private Konfiguration unter `/home/u199598707/domains/quiz-hero-stage.matzeverse.de/private/config.php` (Modus 600).
- Passwortdatei ebenfalls außerhalb des Webroots. Das private Verzeichnis ist durchsuchbar (711), damit LiteSpeed die Hashdatei lesen kann; die übrigen privaten Dateien bleiben 600.
- SSH: `ssh -p 65002 u199598707@46.202.158.83`; vorhandene Schlüsselanmeldung funktioniert.
- Website- und Adminzugang stehen ausschließlich lokal in `.private/STAGING-ZUGANG.txt`.
- Quell- und Produktionsdatenbank wurden nicht verändert. Importierte Browsersitzungen wurden nur in Staging verworfen.

Die vorhandene VS-Code-Erweiterung `hostinger-official.hostinger-connector` 1.4.2
ist installiert. Die Vergleichsprojekte trading/my-cockpit sind laut Hostinger Node.js-Websites;
deren Laufzeitkonfiguration ist keine unverändert nutzbare Vorlage für diese PHP-App.

Erstes Deployment abgeschlossen. Für spätere Deployments:

1. Build aus der gewünschten Datenquelle neu erzeugen; HTTP-Basic-Gate und Konfigurationsverweis werden vom Build ergänzt.
2. Archiv mit Linux-Dateirechten packen, z. B. im lokalen App-Container:
   `tar --format=ustar --mode=u+rwX,go+rX --exclude=desktop.ini -czf /var/www/html/dist/quiz-hero-stage-upload.tar.gz -C /var/www/html/.build/hostinger/public .`
3. Archiv per SCP in das private Staging-Verzeichnis übertragen und SHA-256 prüfen.
4. Dateipaket bereitstellen, bestehende private Konfiguration und Zugangsdaten beibehalten.
5. Datenbank niemals automatisch neu importieren; Datenupdates separat mit Sicherung vorbereiten.
6. Layout, Bilder, Quiz, API, Admin und Schutzregeln online prüfen.

Der STRATO-Workflow ist ausschließlich als inaktive Referenz unter
`docs/reference/deploy-strato.yml.example` erhalten. In dieser Kopie ist keine
GitHub Action aktiv. Der portable Build benötigt keine GitHub-Secrets.
Welche Hostinger-Buildvariablen und Secretverwaltung für PHP tatsächlich nutzbar sind,
wird erst nach Prüfung des Tarifs entschieden; keine Node-App für die PHP-API voraussetzen.

## Späteres Update aus Produktion

Vor dem Ersetzen Staging-Datenbank und Uploads sichern. Einen konsistenten aktuellen
Produktionsdump zusammen mit einem passenden Code- und Uploadstand übernehmen.
Während des finalen Umzugs Schreibzugriffe zeitweise sperren oder Änderungen gezielt
nachziehen, damit keine neuen Accounts und Ergebnisse verloren gehen. Datenbank zuerst
in eine neue Staging-Datenbank importieren und prüfen, danach Konfiguration umstellen.
Staging-Zugänge, Mailziel und Domain bleiben getrennt von Produktion.
Domain-, DNS- und Mailumschaltung erfolgen erst in einem späteren eigenen Schritt.

## Bisherige Prüfung

- 225 Frontend-, Bild-, Schrift-, Inhalts- und Datendateien per SHA-256 mit der Quelle verglichen: identisch.
- 12 vorhandene Contract-Tests bestanden.
- PHP-Syntax und Migrationen geprüft.
- Lokale public-data-API liefert HTTP 200 und ok=true.
- Startseite in Chrome geöffnet, Cookieauswahl und Kategorieanzeige geprüft.
- Privater Dump über HTTP nicht zugänglich (403).
- Staging-Build erfolgreich aus dem SEO-Export der kopierten Datenbank erzeugt.
- Online geprüft: Startseite, Loginseite, Adminseite, Rom-Kategorieseite, Bild und public-data-API jeweils HTTP 200 hinter dem Passwortschutz.
- Admin-Login und geschützter admin-data-Abruf erfolgreich; Testsitzung wieder abgemeldet.
- Private Konfiguration und Dump nicht per Website erreichbar (HTTP 404).
- Quiz im Browser gestartet und eine Frage beantwortet; Darstellung visuell geprüft, keine defekten Startseitenbilder und keine Analytics-Requests.
- Aktuelle Produktion wurde nicht visuell verglichen. Ergebnisablage mit Spielerlogin, Registrierung und E-Mail-Flows sind noch separat zu testen; echter Mailversand bleibt deaktiviert.
