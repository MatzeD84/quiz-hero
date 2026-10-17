# Hostinger Git-Deployment

Repository: `MatzeD84/quiz-hero`, Branch `hostinger`.
GitHub Actions werden für dieses Deployment nicht verwendet.

## Normaler Ablauf

1. Lokal entwickeln und mit `docker compose up -d` auf http://localhost:8081 testen.
2. Änderungen auf Branch `hostinger` committen und `git push` ausführen.
3. Hostinger zieht den Branch in `.deploy-source`. Dieses Verzeichnis ist für HTTP gesperrt und verweist auf `shared/source` außerhalb des öffentlichen Webverzeichnisses.
4. Ein Hostinger-Cronworker prüft jede Minute auf einen neuen Commit und baut einen festen Commit-Snapshot. Composer bestätigt nur den Git-Abruf, damit die kurzen Zeitlimits der hPanel-Git-Jobs den Build nicht abbrechen. Node 22 ist auf Hostinger unter `/opt/alt/alt-nodejs22/root/usr/bin/node` installiert.
5. Vorhandene Contract-Tests und PHP-Syntaxprüfung laufen. Der SEO-Export liest die aktuelle Hostinger-Datenbank über PHP-CLI; kein Zugangstoken muss GitHub erreichen.
   Auf Hostinger verwendet der SEO-Vertragstest denselben Datei-Exporttransport wie der Build, da die Shared-Hosting-Umgebung den temporären lokalen HTTP-Testserver blockiert. Lokal wird weiterhin auch der HTTP-Transport getestet.
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

## Aktive Einrichtung

Hostinger-GitHub-App: Repository `MatzeD84/quiz-hero` freigegeben.
Auto-Deployment: Branch `hostinger`, Verzeichnis `.deploy-source`, aktiviert.
Cronjob `om95mvom6B`: jede Minute (`* * * * *`), `/bin/bash /home/u199598707/domains/quiz-hero-stage.matzeverse.de/private/watch-deploy.sh`.
Der Worker verwendet `git archive` für einen unveränderlichen Snapshot, einen Ausführungs-Lock und prüft, ob der Commit schon erfolgreich veröffentlicht wurde. Ohne neuen Commit findet kein Build statt.
Fehlgeschlagene Commits werden nicht minütlich erneut gebaut. Ein korrigierter neuer Commit startet automatisch einen neuen Versuch.
Für einen bewussten Wiederholungsversuch desselben Commits die Datei `private/failed-commit` per SSH umbenennen und den Worker erneut ausführen.
Das Buildprotokoll steht außerhalb des Webroots unter `private/git-build.log`.
Build und veröffentlichte Version lassen sich über die Git-Einstellungen in hPanel und per SSH prüfen.
Die Versionsdatei `/version.json` zeigt den veröffentlichten Commit hinter dem Staging-Passwortschutz.
Hostingers automatischer Git-Abruf verwendet intern einen abgelösten HEAD. Der separate ältere manuelle Git-API-Endpunkt kann deshalb einen Branch-/URL-Abgleich ablehnen; der eingerichtete Auto-Deploymentweg und der Cronworker verwenden den tatsächlich ausgecheckten Commit.

Der bisherige Branch `master` ist unverändert. Erst nach dem abgeschlossenen Umzug sollte entschieden werden, ob `hostinger` zum Hauptbranch wird.

## Refactoring-Layout und Content-Worker

Seit dem Refactoring enth?lt das Archiv einen Release-Root mit public/, api/, src/ und internen Buildwerkzeugen. Nur public/ wird ausgeliefert. Vorherige Releases im alten Layout bleiben r?cksprungf?hig. Migration 009_quiz_rounds.sql vor dem ersten Release separat anwenden und zuvor die Datenbank sichern.

watch-deploy.sh startet publish-content.php unabh?ngig vom Git-Commit. Der Exporthash erkennt Admin?nderungen; SEO und Sitemap werden aus MySQL neu generiert und atomar aktiviert. Bilder/Code werden per Hardlink wiederverwendet. content-build.log protokolliert Fehler; ein Fehler bel?sst das bisherige Content-Release aktiv. maintenance.php l?uft h?chstens t?glich. Details und Aufbewahrungsfristen: docs/REFACTORING-2026-10-17.md.

Secrets, Datenbank und Uploads werden weder aus Git wiederhergestellt noch durch Builds ?berschrieben. Backups m?ssen unabh?ngig von Releases aufbewahrt werden.
