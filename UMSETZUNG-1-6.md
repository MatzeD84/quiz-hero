# Umsetzung der Analysepunkte 1–6

Stand: 19. September 2026. Änderungen liegen ausschließlich im Arbeitsverzeichnis. Kein Commit, Merge oder Produktionsdeployment durch den Assistenten.

## Was geändert wurde

1. **Sitzungen:** Zufällige serverseitig gespeicherte Sitzungen ersetzen die bisherigen selbstsignierten Tokens. Die Datenbank enthält nur SHA-256-Hashes. Laufzeit: maximal sieben Tage, höchstens 24 Stunden ohne Nutzung. `account-me` behält das Token und dessen absolute Laufzeit bei. Logout widerruft die aktuelle Sitzung; Passwortänderung, Reset und Kontolöschung widerrufen alle Sitzungen des Benutzers. Passwortänderung und Löschung verlangen das aktuelle Passwort. Reset- und Verifikationslinks werden unter Datenbanksperre einmalig verbraucht. Der Client verwirft abgelaufene Sitzungen und meldet fehlgeschlagene Logouts, statt einen erfolgreichen Widerruf vorzutäuschen.
2. **Mailfehler:** Kein Fallback mehr auf `var/mail.log`. Fehlgeschlagene Bestätigungsmails führen zu einer fehlgeschlagenen Registrierung ohne zurückgelassenes Konto. Bereits abgeschlossene Aktionen bleiben bei einem Fehler einer nachfolgenden Benachrichtigung erfolgreich. Passwortreset-Anfragen verraten auch bei Versandfehlern nicht direkt, ob ein Konto existiert. Nur der ausdrücklich aktivierte lokale Entwicklungsmodus darf Mails unter `sys_get_temp_dir()/quiz-hero-private-mail/mail.log` protokollieren (Verzeichnis 0700, Datei 0600). Der gesamte alte `/var`-Webpfad ist zusätzlich gesperrt.
3. **Bildpfade und Tags:** Relative und root-relative `images/`-Pfade bleiben beim Speichern erhalten. Unsichere Protokolle und Pfadtraversierung werden abgewiesen; ungültige nichtleere Bildpfade werden nicht still in leere Werte umgewandelt. Bekannte Tags werden anhand der vorhandenen Tag-IDs kanonisiert und dedupliziert. Das gilt auch für die API-Ausgabe bestehender Fragen. Unbekannte Tags werden nicht durch zufällige IDs ersetzt. Es wurde keine pauschale inhaltliche Datenbereinigung vorgenommen.
4. **Datenverträge:** Ein inaktives Badge darf leeren Text haben; ein aktives benötigt Text. Quizfragen benötigen genau vier Antworten und einen ganzzahligen richtigen Index. API-Ausfälle und ungültige Antworten führen nicht mehr zu einem stillen JSON-Fallback; Ladefehler stehen sichtbar auf der Seite. JSON-Limit: 1 MiB in Frontend und Backend; der Admin prüft auch die Größe der aufbereiteten Import-Anfrage. Leere Importkategorien werden nicht mehr zufällig erzeugt. Ergebnisspeicherung benötigt einen aktiven Account und widerspruchsfreie Punkt-/Fragenzahlen.
5. **SEO-Veröffentlichung:** Produktionsbuilds benötigen einen erfolgreichen authentifizierten Export. Fehlende Konfiguration, HTTP-Fehler, Timeout, leere Kategorien oder ungültige Daten brechen ab. Ein ausdrücklich gewählter JSON-Modus ist nur für lokale Vorschauen möglich. Inaktive Fragen werden in beiden Datenpfaden ausgeschlossen. Ausgabe unter `.build/seo`, einschließlich Seitenmanifest. Nur zuvor im Manifest verwaltete Altseiten werden lokal bereinigt. Der Deploymentworkflow übernimmt ausschließlich diese Ausgabe; serverseitiges Löschen ist auf das Verzeichnis der generierten Kategorieseiten begrenzt. Sitemap enthält keine erfundenen Änderungszeitpunkte. Ein Nachtest kontrolliert Status, Canonical und Frageanzahl der veröffentlichten Seiten.
6. **Build und Migrationen:** CSS wird aus den Quellen deterministisch gebaut und vor Deployment neu erzeugt. Node 22 ist explizit festgelegt. Snapshot und Migrationshistorie stimmen überein; Migration 006 verträgt die bereits vorhandene `reviewed`-Spalte. Der Runner verarbeitet SQL-Ergebnissets korrekt und verhindert parallele Migrationsläufe über eine Datenbanksperre. Migration 007 ergänzt die Sitzungen. Die CI führt die neuen JavaScript-/SEO-Tests sowie die PHP-/MySQL-Integrationstests vor dem Deployment aus.

## Durchgeführte Prüfungen

- `node --test tests/contracts.test.mjs`: vier Tests mit Prüfungen für Datenvalidierung, fehlenden API-Fallback, Sitzungsfehler/Logout und den echten SEO-Generator mit simulierter Export-API.
- `php tests/integration.php` in einer **separaten leeren `quiz_hero_audit_*`-Datenbank**: 28 erfolgreiche Prüfungen. Darunter Neuinstallation, Upgrade aus altem Snapshot, Wiederholung, Logoutwiderruf, Passwortwechsel/Reset, einmalige Verifikation, Ablauf, Kontolöschung, Bild-/Tag-Erhalt, Importlimits und Mailfehler ohne Webroot-Log.
- Die Integrationstests starten einen eigenen lokalen PHP-HTTP-Server und entfernen ihre Tabellen anschließend. Sie verweigern normale Anwendungsdatenbanken und nichtleere Testdatenbanken.
- JavaScript-Syntaxprüfungen und PHP-Ausführung der geänderten API-/Migrationspfade erfolgreich; CSS neu gebaut.
- Chrome auf `http://localhost:8080`: Startseite mit Datenbankdaten, lokaler Entwicklungslogin, Profilabruf, neues Passwortbestätigungsfeld und serverseitiger Logout erfolgreich. `account-me` und `account-logout` antworteten HTTP 200.
- Geschützter SEO-Export der lokalen Anwendung: fünf Kategorieseiten erfolgreich unter `.build/seo-local` erzeugt. Das entspricht dem lokalen Datenbestand, nicht zwingend dem Produktionsbestand.
- Lokale Startseite HTTP 200; `/var/mail.log` nicht öffentlich erreichbar (HTTP 403).

Die echte SFTP-Veröffentlichung, produktive SMTP-Zustellung und Produktionsmigration wurden nicht ausgeführt. Ein vollständiger Penetrationstest ist damit weiterhin nicht erfolgt.

## Lokales Testen

```powershell
node scripts/build-css.js
node --test tests/contracts.test.mjs
docker compose exec -T app php database/migrate.php
```

Die lokale Anwendung ist bereits bis einschließlich Migration 007 aktualisiert. Für die Integrationstests zuerst eine leere, separate Datenbank `quiz_hero_audit_local` mit Berechtigungen für den lokalen Datenbankbenutzer bereitstellen. Danach:

```powershell
docker compose exec -T -e QUIZ_HERO_DB_NAME=quiz_hero_audit_local app php tests/integration.php
```

Eine reine JSON-Vorschau erzeugt `scripts/build-seo.bat`. Für den Datenbankexport müssen `SITE_URL`, `SEO_EXPORT_URL` und `SEO_EXPORT_TOKEN` gesetzt sein; dann `node scripts/build-seo-pages.js` ausführen. Ausgabe standardmäßig `.build/seo`. Diese Umgebungsvariablen nicht als Klartext mit produktiven Geheimnissen in Versionsverwaltung oder Dokumentation speichern.

## Vor dem manuellen Produktionsdeployment

1. Datenbankbackup und Wiederherstellungsmöglichkeit bereitstellen. Die neue Migration ist additiv; der Snapshot ist ausschließlich für Neuinstallationen gedacht.
2. `007_user_sessions.sql` über den bestehenden CLI-Migrationsweg vor Veröffentlichung des neuen API-Codes auf Produktion anwenden. Die Datenbank-/Migrationswerkzeuge bleiben außerhalb des öffentlichen Deployments. Die bereits geprüfte lokale Ausführung ersetzt diesen Produktionsschritt nicht.
3. `QUIZ_HERO_SEO_EXPORT_TOKEN` muss in CI und der bereits laufenden Export-API übereinstimmen. Beim Tokenwechsel zuerst die Exportkonfiguration kontrolliert angleichen. Der bisherige „erster Lauf mit JSON-Fallback“-Weg ist absichtlich entfernt.
4. `QUIZ_HERO_ALLOW_DEV_ACCOUNT_LOGIN=false` auf Produktion beibehalten und SMTP korrekt konfigurieren. Alte Mail-Logbestände außerhalb dieser Codeänderung kontrolliert entfernen beziehungsweise nach festgelegter Aufbewahrung behandeln; die neue Sperre ersetzt keine Bereinigung vorhandener sensibler Logs.
5. Änderungen manuell prüfen, committen/mergen und den Workflow selbst auslösen. Alle bisherigen Benutzer-Tokens werden durch die Umstellung ungültig: Nutzer müssen sich erneut anmelden. Adminsitzungen verwenden weiterhin ihr separates PHP-Sitzungsmodell.
6. Nach Veröffentlichung Login, Logout, Mailzustellung und SEO-Nachprüfung kontrollieren. Das globale Deployment bleibt dateibasiert und ist nicht atomar; ein geplanter Veröffentlichungszeitpunkt vermeidet unnötige Versionsmischungen während der Übertragung.

## Verbleibende Grenzen

Die Benutzer-Bearertokens liegen weiterhin im Browser-LocalStorage. Widerruf und Ablauf sind nun serverseitig durchgesetzt; eine spätere Umstellung auf HttpOnly-Cookies mit passendem CSRF-Konzept würde das Ausleserisiko bei XSS weiter reduzieren. Regelmäßige Bereinigung abgelaufener Sitzungen/Resetdatensätze bleibt eine Betriebsaufgabe. Spielergebnisse werden auf Plausibilität geprüft, aber die Antworten werden noch nicht serverseitig als Wettbewerb ausgewertet. Bildkontext auf SEO-Seiten, Quellenqualität, Barrierefreiheit, mobile Adminabläufe und die weiteren Analysepunkte sind nicht Bestandteil dieser ersten sechs Umsetzungsschritte.
