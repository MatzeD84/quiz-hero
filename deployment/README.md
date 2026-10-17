# Hostinger Git-Deployment

Repository: `MatzeD84/quiz-hero`, Branch `hostinger`.
GitHub Actions werden für dieses Deployment nicht verwendet.

## Normaler Ablauf

1. Lokal entwickeln und mit `docker compose up -d` auf http://localhost:8081 testen.
2. Änderungen auf Branch `hostinger` committen und `git push` ausführen.
3. Hostinger zieht den Branch in `.deploy-source`. Dieses Verzeichnis ist für HTTP gesperrt und verweist auf `shared/source` außerhalb des öffentlichen Webverzeichnisses.
4. Composer führt `scripts/hostinger/build-from-git.php` aus. Node 22 ist auf Hostinger unter `/opt/alt/alt-nodejs22/root/usr/bin/node` installiert.
5. Vorhandene Contract-Tests und PHP-Syntaxprüfung laufen. Der SEO-Export liest die aktuelle Hostinger-Datenbank über PHP-CLI; kein Zugangstoken muss GitHub erreichen.
6. CSS, Kategorieseiten, Assetversionen und CSP-Hashes werden gebaut. Ein neues versioniertes Release wird außerhalb des Webroots ausgepackt und gegen Datenbank/Migrationsstand geprüft.
7. `public_html` wird auf das geprüfte Release umgeschaltet. HTTP-Prüfungen kontrollieren Version, Startseite, Quiz-API und Passwortschutz. Bei einem Fehler wird das vorherige Dateirelease wieder aktiviert.

Voraussetzung: Die Hostinger-GitHub-App hat Zugriff auf `quiz-hero` und das Auto-Deployment ist für Branch `hostinger`, Verzeichnis `.deploy-source` aktiviert.
Beim erstmaligen Einrichten wird die Datei `.hostinger-server` ausschließlich im Server-Checkout angelegt. Lokales Composer löst dadurch keinen Upload aus.

## Daten und Secrets

- Datenbank: bleibt bei Code-Deployments unverändert. Neue Migrationen werden erkannt; das Deployment stoppt, bis sie separat und bewusst angewendet wurden.
- Uploads: `shared/uploads` bleibt über alle Releases erhalten.
- Konfiguration und Passwortschutz: `private/config.php`, `private/.htpasswd`, `private/healthcheck-auth.json`; keine dieser Dateien gehört in Git.
- Alte Dateireleases bleiben für einen Rücksprung erhalten. Ein Dateirücksprung ist kein Datenbank-Restore.
- `.env`, `.private`, SQL-Dumps, `.git`, Docker und Deploymentquellen gehören nicht in das fertige Webpaket.

## Rücksprung

Per SSH:

```sh
bash /home/u199598707/domains/quiz-hero-stage.matzeverse.de/private/rollback.sh
```

## Späterer Domainwechsel

Das Ziel steht in `deployment/hostinger.json`. Für den echten Wechsel `siteUrl`, `environment` und gegebenenfalls `siteRoot` anpassen und die private Serverkonfiguration abstimmen.
Der Produktionsbuild ist absichtlich gesperrt, bis die Freigabe im Server-Buildskript gezielt angepasst ist.
Erst dann Passwortschutz und Noindex entfernen, Mailversand/Analytics konfigurieren und die Domain umstellen.
Ein Registrartransfer migriert weder Datenbank noch E-Mail-Postfächer automatisch.

## Erste Aktivierung

Die Einrichtung wird mit einem echten Git-Push und anschließendem Versions-/HTTP-Abgleich verifiziert. Bis dahin ist die bisherige per SSH bereitgestellte Seite der aktive Stand.
