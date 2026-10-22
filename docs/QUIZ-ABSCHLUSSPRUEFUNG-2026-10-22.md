# Abschlussprüfung: Quizdarstellung und CSS-Pflege

Stand: 22.10.2026. Auf `https://quiz-hero.de` veröffentlicht als `cb23f51a0cc4-20261022131903`, Code-Commit `cb23f51a0cc4df6ee9f179cb1d3bc4d4d3fd8df3`. Der tatsächlich aktive Commit steht in `/version.json`; Rollout und Sicherung siehe [Production](HOSTINGER-PRODUCTION.md).

## Umfang

- Schwierigkeitstag und Punkte im ersten Versuch zwischen Bild und Antworten; bei Textfragen direkt vor den Antworten.
- Einfache Frage: dunkles Blau, 2 Punkte; Schwere Frage: Petrol, 3 Punkte; Hero-Frage: bestehendes Lila, 5 Punkte. Zweiter Versuch immer 1 Punkt nach bestehender Wertung.
- Nach erstem Fehler ersetzt der Hinweis auf die zweite Chance die anfängliche Punktanzeige. Der Header zeigt nur den Zähler „1 von 25“.
- Antwort-Hover mit passenden hellen Schwierigkeitsflächen und Rahmen. Gesperrte und bereits bewertete Antworten behalten ihre Zustände.
- Modularisierte CSS-Quellen und eindeutige zentrale Tokens; historischer Darstellungsvergleich in [CSS-Modularisierung](CSS-MODULARISIERUNG-2026-10-22.md).
- Vereinfachtes menschenleeres Siena-Kategorienbild als zusätzliche Datei; keine neue Kategorie oder Fragen importiert.

## Prüfungen

- Tokenprüfung, CSS-Build und BEM-Prüfung erfolgreich.
- 34 Frontend-Vertragstests erfolgreich, einschließlich neuem Test für falschen/richtigen zweiten Versuch, wiederholten Klick und unveränderte Punktvergabe auf allen drei Schwierigkeitsstufen.
- Lokaler Hostinger-Build mit ausdrücklich gewählter JSON-SEO-Vorschau erfolgreich. Der serverseitige Build verwendet die Produktionsdatenbank für SEO.
- Browser: alle drei Schwierigkeiten mit und ohne Bild bei 320, 390, 768 und 1440 Pixeln geprüft (24 Kombinationen). Kein horizontaler Überlauf; Hinweis unter dem Bild und vor den Antworten, korrekte Tags/Punkte/Zähler, zweiter Versuch sichtbar, nach Auflösung verborgen, Antworten gesperrt und 1 Punkt bei zweitem korrektem Versuch.
- Hoverregeln im Browser mit erzwungenen Selektorzuständen geprüft: drei passende Farben, deaktivierte/richtige/falsche Antworten ohne Hoveränderung.
- Serverseitiger Build einschließlich Tests, PHP-Lint und Datenbank-/Releaseprüfung sowie HTTP-Verifikation erfolgreich. Live-Seiten/API und Cacheversionen geprüft; produktive Anzeige einmal ohne Ergebnisübermittlung geprüft. Siena-Originaldatei serverseitig hashgleich; CDN-Antwort byteweise abweichend, Format/Abmessungen und korrektes Motiv visuell bestätigt (Details im Rolloutprotokoll).

Keine Datenbank- oder Backendänderung; keine Migration erforderlich. Keine Test-Runden an echte Productionaccounts gesendet. Browserprüfung verwendet emulierte Viewports und DOM/Layoutzustände, keinen physischen Surface-Laptop. Ein vollständiger produktiver Nutzer-/Registrierungsdurchlauf ist damit nicht behauptet.

## Sicherung und Rücksprung

Vorabbackup: `private/backups/before-souvenirs-20261022131540/` mit SQL-Dump, Konfiguration, Uploadarchiv und Manifest. Ausgangsrelease: `8b84553884fa-20261022101348`. Schema bleibt bis Migration 019 unverändert. Das vorherige Dateirelease bleibt als Rücksprung verfügbar; dafür ist kein Datenbank-Restore nötig. Zugangsdaten und Sicherungen liegen außerhalb des Webroots.
